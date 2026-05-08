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
  /** Free-text search across title + description */
  q?: string;
  /** Sort order. Defaults to `newest`. */
  sort?: 'newest' | 'popular' | 'price_asc' | 'price_desc';
  /** Filter by seller_id (used by brand-store pages). */
  seller_id?: string;
  /**
   * SQ status filter:
   *   'approved' (default) — only SQ-verified products
   *   'all'                — every active product, including pending/rejected/not_submitted
   */
  status?: 'approved' | 'all';
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

  // ── Public: products for buyers ──────────────────────────────────────────

  async getApprovedProducts(query: GetProductsQuery) {
    const { category, page = 1, limit = 20, q, sort = 'newest', seller_id, status = 'approved' } = query;
    const filter: Record<string, unknown> = { is_active: true };
    if (status === 'approved') filter['sq_status'] = 'approved';
    if (category) filter['category'] = category;
    if (seller_id && Types.ObjectId.isValid(seller_id)) {
      filter['seller_id'] = new Types.ObjectId(seller_id);
    }
    if (q && q.trim().length > 0) {
      const safe = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(safe, 'i');
      filter['$or'] = [{ title: rx }, { description: rx }];
    }

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest:     { sq_decided_at: -1, created_at: -1 },
      popular:    { sq_level: -1, sq_decided_at: -1 },
      price_asc:  { price: 1 },
      price_desc: { price: -1 },
    };
    const sortClause = sortMap[sort] ?? sortMap['newest'];

    const [data, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort(sortClause)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.productModel.countDocuments(filter),
    ]);

    return { data, total, page, limit, total_pages: Math.ceil(total / limit) };
  }

  /**
   * Returns the distinct categories present in approved products,
   * with product counts. Used by the landing page Popular Categories carousel.
   */
  async getCategoriesWithCounts(): Promise<Array<{ name: string; count: number }>> {
    const result = await this.productModel.aggregate([
      { $match: { is_active: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { _id: 0, name: '$_id', count: 1 } },
      { $sort: { count: -1, name: 1 } },
    ]).exec();
    return result as Array<{ name: string; count: number }>;
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
      area: 'lahore',
    };

    const result = await this.pssClient.submitForSQ(
      productId,
      sellerId,
      'product',
      entityData,
    );

    const pssUnavailable =
      'error' in result && (result as { error?: string }).error === 'PSS unavailable';

    if (!result.success && !pssUnavailable) {
      throw new BadRequestException(
        (result as { error?: string }).error ?? result.message ?? 'PSS submission failed',
      );
    }

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

  async getSQStatus(productId: string, sellerId: string) {
    const product = await this.getProductById(productId);
    if (product.seller_id.toString() !== sellerId) {
      throw new ForbiddenException('You can only check status of your own products');
    }

    const pssStatus = await this.pssClient.getSQStatus(productId);

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

  // ── PSS sync helper ───────────────────────────────────────────────────────

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
      return null;
    }

    if (prev === next) {
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

    await product.save();
    return { from: prev, to: next };
  }

  // ── Webhook handler ───────────────────────────────────────────────────────

  async updateSqFromWebhook(
    productId: string,
    _event: string,
    decision: string,
    sqLevel: number | null,
    rejectionReason: string | null | undefined,
    decidedAt: string | undefined,
  ): Promise<void> {
    if (!Types.ObjectId.isValid(productId)) {
      this.logger.warn('Webhook for invalid product id ignored: ' + productId);
      return;
    }
    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      this.logger.warn('Webhook for unknown product ignored: ' + productId);
      return;
    }
    const synced = await this.syncFromPss(product, {
      status: decision,
      sq_level: sqLevel,
      approved_at: decision === 'approved' ? decidedAt : undefined,
      rejected_at: decision === 'rejected' ? decidedAt : undefined,
      rejection_reason: rejectionReason ?? undefined,
    });
    if (synced) {
      this.logger.log('Webhook applied to product ' + productId + ': ' + synced.from + ' to ' + synced.to);
    }
  }
}
