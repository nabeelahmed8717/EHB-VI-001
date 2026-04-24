import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument, SqStatus } from './product.schema';
import { PssClientService } from '../pss-client/pss-client.service';

export interface CreateProductDto {
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
}

export interface UpdateProductDto {
  title?: string;
  description?: string;
  price?: number;
  category?: string;
  images?: string[];
  stock?: number;
  is_active?: boolean;
}

export interface GetProductsQuery {
  category?: string;
  page?: number;
  limit?: number;
}

function getSqBadgeLabel(level: number | null): string {
  const map: Record<number, string> = {
    1: 'SQ1 — Basic Verified',
    2: 'SQ2 — Compliance Verified',
    3: 'SQ3 — Financially Verified',
    5: 'SQ5 — Professional Verified',
    7: 'SQ7 — Expert Verified',
    10: 'SQ10 — Elite Certified',
  };
  if (level === null) return '';
  return map[level] ?? `SQ${level} — Verified`;
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    private readonly pssClient: PssClientService,
  ) {}

  // ── Public: approved products for buyers ─────────────────────────────────

  async getApprovedProducts(query: GetProductsQuery) {
    const { category, page = 1, limit = 20 } = query;
    const filter: Record<string, unknown> = { sq_status: 'approved', is_active: true };
    if (category) filter['category'] = category;

    const [data, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort({ sq_decided_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.productModel.countDocuments(filter),
    ]);

    return { data, total, page, limit, total_pages: Math.ceil(total / limit) };
  }

  async getProductById(id: string): Promise<ProductDocument> {
    const product = await this.productModel.findById(id).exec();
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  // ── Seller: own products ──────────────────────────────────────────────────

  async getMyProducts(sellerId: string, query: GetProductsQuery) {
    const { page = 1, limit = 20 } = query;
    const filter = { seller_id: new Types.ObjectId(sellerId) };

    const [data, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.productModel.countDocuments(filter),
    ]);

    return { data, total, page, limit, total_pages: Math.ceil(total / limit) };
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async createProduct(sellerId: string, dto: CreateProductDto): Promise<ProductDocument> {
    const product = new this.productModel({
      ...dto,
      seller_id: new Types.ObjectId(sellerId),
      sq_status: 'not_submitted' as SqStatus,
    });
    return product.save();
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async updateProduct(
    id: string,
    sellerId: string,
    dto: UpdateProductDto,
  ): Promise<ProductDocument> {
    const product = await this.getProductById(id);
    if (product.seller_id.toString() !== sellerId) {
      throw new ForbiddenException('You can only edit your own products');
    }
    Object.assign(product, dto);
    return product.save();
  }

  // ── Submit for SQ ─────────────────────────────────────────────────────────

  async submitForSQ(productId: string, sellerId: string) {
    const product = await this.getProductById(productId);

    if (product.seller_id.toString() !== sellerId) {
      throw new ForbiddenException('You can only submit your own products');
    }

    const allowedStatuses: SqStatus[] = ['not_submitted', 'rejected'];
    if (!allowedStatuses.includes(product.sq_status)) {
      throw new BadRequestException(
        `Cannot submit: product SQ status is "${product.sq_status}". ` +
        `Only not_submitted or rejected products can be submitted.`,
      );
    }

    const entityData: Record<string, unknown> = {
      title: product.title,
      description: product.description,
      price: product.price,
      category: product.category,
      images: product.images,
      stock: product.stock,
      seller_id: sellerId,
      area: 'lahore', // hardcoded for testing
    };

    const result = await this.pssClient.submitForSQ(
      productId,
      sellerId,
      'product',
      entityData,
    );

    const pssUnavailable =
      'error' in result && (result as { error?: string }).error === 'PSS unavailable';

    // Hard PSS rejection (not just connectivity) — fail fast
    if (!result.success && !pssUnavailable) {
      throw new BadRequestException(
        (result as { error?: string }).error ?? result.message ?? 'PSS submission failed',
      );
    }

    // Mark pending locally regardless of PSS reachability.
    // If PSS was down the product stays pending; once PSS is back it will
    // process the request and send the decision via webhook.
    product.sq_status = 'pending';
    product.sq_request_id = (!pssUnavailable && result.sq_request_id)
      ? result.sq_request_id
      : null;
    await product.save();

    if (pssUnavailable) {
      this.logger.warn(
        `Product ${productId} marked pending locally — PSS unavailable at submission time`,
      );
      return {
        sq_request_id: null,
        status: 'pending',
        message:
          'Submitted for approval. PSS is temporarily unreachable — ' +
          'your request will be processed once connectivity is restored.',
      };
    }

    this.logger.log(`Product ${productId} submitted for SQ: req=${result.sq_request_id ?? 'n/a'}`);

    return {
      sq_request_id: result.sq_request_id,
      status: 'pending',
      message: result.message ?? 'SQ request submitted successfully',
    };
  }

  // ── Get SQ Status ─────────────────────────────────────────────────────────

  /**
   * Pull-based status reconciliation. Called by the "Refresh Status" button
   * on the product detail page.
   *
   * This is the fallback when the push-based webhook flow fails (e.g. Redis
   * is down and Bull couldn't queue the webhook, or the webhook request
   * itself failed). We query PSS for the authoritative status and, if it
   * differs from what we have locally, write it back to the product
   * document so subsequent reads return the fresh state.
   */
  async getSQStatus(productId: string, sellerId: string) {
    const product = await this.getProductById(productId);
    if (product.seller_id.toString() !== sellerId) {
      throw new ForbiddenException('You can only check status of your own products');
    }

    const pssStatus = await this.pssClient.getSQStatus(productId);

    // If PSS was reachable, reconcile its authoritative state into our DB.
    const pssOk = !('error' in pssStatus);
    if (pssOk) {
      const synced = await this.syncFromPss(product, pssStatus as {
        status: string;
        sq_level: number | null;
        approved_at?: string;
        rejected_at?: string;
        rejection_reason?: string;
        badge_label?: string;
      });
      if (synced) {
        this.logger.log(
          `Refresh-status reconciled product ${productId}: ` +
          `local "${synced.from}" → PSS "${synced.to}"`,
        );
      }
    } else {
      this.logger.warn(
        `Refresh-status: PSS unavailable for product ${productId} — ` +
        `keeping local sq_status="${product.sq_status}"`,
      );
    }

    return {
      product_sq_status: product.sq_status,
      pss_status: pssStatus,
    };
  }

  /**
   * Map a PssSqStatusResponse onto the local product document and persist any
   * differences. Returns { from, to } if a change was written, or null if
   * the local state already matches PSS.
   *
   * PSS status values → product.sq_status mapping:
   *   approved / conditional → 'approved'
   *   rejected               → 'rejected'
   *   pending                → 'pending'
   *   pending_franchise      → 'pending_franchise'
   *   pending_edr            → 'pending_edr'
   *
   * Anything else (unknown) is ignored to avoid corrupting the product.
   */
  private async syncFromPss(
    product: ProductDocument,
    pss: {
      status: string;
      sq_level: number | null;
      approved_at?: string;
      rejected_at?: string;
      rejection_reason?: string;
      badge_label?: string;
    },
  ): Promise<{ from: SqStatus; to: SqStatus } | null> {
    const prev = product.sq_status;
    let next: SqStatus | null = null;

    if (pss.status === 'approved' || pss.status === 'conditional') {
      next = 'approved';
    } else if (pss.status === 'rejected') {
      next = 'rejected';
    } else if (pss.status === 'pending') {
      next = 'pending';
    } else if (pss.status === 'pending_franchise') {
      next = 'pending_franchise';
    } else if (pss.status === 'pending_edr') {
      next = 'pending_edr';
    } else {
      return null; // unknown status — do not touch local state
    }

    // Nothing to do if local state already reflects PSS
    if (prev === next) {
      // Still update sq_level if it moved (e.g. terminal-decision refinement)
      if (next === 'approved' && product.sq_level !== pss.sq_level) {
        product.sq_level = pss.sq_level;
        product.sq_badge_label = pss.badge_label ?? getSqBadgeLabel(pss.sq_level);
        await product.save();
      }
      return null;
    }

    product.sq_status = next;

    if (next === 'approved') {
      product.sq_level = pss.sq_level;
      product.sq_badge_label = pss.badge_label ?? getSqBadgeLabel(pss.sq_level);
      product.sq_decided_at = pss.approved_at ? new Date(pss.approved_at) : new Date();
      product.sq_rejection_reason = null;
    } else if (next === 'rejected') {
      product.sq_level = null;
      product.sq_badge_label = null;
      product.sq_rejection_reason = pss.rejection_reason ?? null;
      product.sq_decided_at = pss.rejected_at ? new Date(pss.rejected_at) : new Date();
    }
    // For pending states we just update sq_status; other fields stay null.

    await product.save();
    return { from: prev, to: next };
  }

  // ── Called by Webhook Handler ─────────────────────────────────────────────

  async updateSqFromWebhook(
    entityId: string,
    event: string,
    decision: string,
    sqLevel: number | null,
    rejectionReason: string | null,
    decidedAt: string | null,
  ): Promise<void> {
    const product = await this.productModel.findById(entityId).exec();
    if (!product) {
      this.logger.warn(`Webhook: product ${entityId} not found — skipping`);
      return;
    }

    if (decision === 'approved') {
      product.sq_status = 'approved';
      product.sq_level = sqLevel;
      product.sq_badge_label = getSqBadgeLabel(sqLevel);
      product.sq_decided_at = decidedAt ? new Date(decidedAt) : new Date();
      product.sq_rejection_reason = null;
    } else if (decision === 'rejected') {
      product.sq_status = 'rejected';
      product.sq_level = null;
      product.sq_rejection_reason = rejectionReason;
      product.sq_decided_at = decidedAt ? new Date(decidedAt) : new Date();
      product.sq_badge_label = null;
    } else if (event === 'sq.forwarded_franchise') {
      product.sq_status = 'pending_franchise';
    } else if (event === 'sq.forwarded_edr') {
      product.sq_status = 'pending_edr';
    }

    await product.save();
    this.logger.log(`Webhook updated product ${entityId} → ${product.sq_status}`);
  }
}
