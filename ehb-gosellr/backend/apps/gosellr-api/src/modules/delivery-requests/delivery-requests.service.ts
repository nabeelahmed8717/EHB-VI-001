import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DeliveryRequest,
  DeliveryRequestDocument,
  DeliveryRequestStatus,
  DELIVERY_REQUEST_TTL_MS,
} from './delivery-request.schema';
import { OrdersService } from '../orders/orders.service';
import { OrdersGateway } from '../orders/orders.gateway';

/**
 * Manages the seller → rider request/accept handshake that fronts the
 * existing `order.rider_id` assignment. The flow:
 *
 *   seller hits "Assign Rider"
 *      → POST /orders/:id/delivery-requests  (this service.create)
 *      → DeliveryRequest{status=pending, expires_at=+60s}
 *      → WS push "delivery_request:new" to rider room
 *
 *   rider accepts
 *      → POST /delivery-requests/:id/accept  (this service.accept)
 *      → order.rider_id locked via OrdersService.assignRiderInternal
 *      → status=accepted
 *      → WS push "delivery_request:accepted" to seller room
 *
 *   rider rejects / seller cancels / 60s timeout
 *      → status=rejected | cancelled | expired
 *      → WS push to the other party
 *
 * Order status itself is NOT advanced here. The rider still has to hit
 * "Picked" manually later, which triggers the existing
 * ready_for_delivery → picked transition in OrdersService.updateStatus.
 */
@Injectable()
export class DeliveryRequestsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DeliveryRequestsService.name);
  private sweepHandle: NodeJS.Timeout | null = null;
  private static readonly SWEEP_INTERVAL_MS = 10_000;

  constructor(
    @InjectModel(DeliveryRequest.name)
    private readonly requestModel: Model<DeliveryRequestDocument>,
    private readonly ordersService: OrdersService,
    private readonly ordersGateway: OrdersGateway,
  ) {}

  // ── Lifecycle: periodic expiry sweep ───────────────────────────────────────
  onModuleInit() {
    this.sweepHandle = setInterval(
      () => void this.sweepExpired().catch((err) => this.logger.error(`sweep failed: ${String(err)}`)),
      DeliveryRequestsService.SWEEP_INTERVAL_MS,
    );
    // Don't keep the event loop alive just for this.
    this.sweepHandle.unref?.();
  }

  onModuleDestroy() {
    if (this.sweepHandle) clearInterval(this.sweepHandle);
  }

  // ── Commands ───────────────────────────────────────────────────────────────

  async create(params: {
    orderId: string;
    sellerId: string;
    riderUserId: string;
    riderJpsProfileId: string;
    riderDisplayName: string;
    deliveryFee: number;
  }): Promise<DeliveryRequestDocument> {
    // Verify the order exists, belongs to this seller, and is in the right state.
    const order = await this.ordersService.findById(params.orderId);
    if (!order) throw new NotFoundException('Order not found');
    if (order.seller_id.toString() !== params.sellerId) {
      throw new ForbiddenException('Not your order');
    }
    if (order.status !== 'ready_for_delivery') {
      throw new BadRequestException(
        `Order must be ready_for_delivery to assign a rider (current: ${order.status})`,
      );
    }
    if (order.rider_id) {
      throw new ConflictException('Order already has a rider assigned');
    }

    // Reject if there's already an open pending request on this order.
    const existing = await this.requestModel.findOne({
      order_id: new Types.ObjectId(params.orderId),
      status: 'pending',
    }).exec();
    if (existing) {
      throw new ConflictException(
        'A delivery request is already pending for this order. Cancel it before requesting another rider.',
      );
    }

    const now = new Date();
    const doc = await this.requestModel.create({
      order_id: new Types.ObjectId(params.orderId),
      seller_id: new Types.ObjectId(params.sellerId),
      rider_user_id: new Types.ObjectId(params.riderUserId),
      rider_jps_profile_id: params.riderJpsProfileId,
      rider_display_name: params.riderDisplayName,
      status: 'pending' as DeliveryRequestStatus,
      requested_at: now,
      expires_at: new Date(now.getTime() + DELIVERY_REQUEST_TTL_MS),
      delivery_fee: params.deliveryFee,
    });

    this.emit('delivery_request:new', doc);
    return doc;
  }

  async accept(requestId: string, riderUserId: string): Promise<DeliveryRequestDocument> {
    const req = await this.findOpenForRider(requestId, riderUserId);
    // Lock the order to this rider via the internal assignment path.
    await this.ordersService.assignRiderInternal(
      req.order_id.toString(),
      riderUserId,
      'Accepted via delivery request',
    );
    req.status = 'accepted';
    req.responded_at = new Date();
    const saved = await req.save();
    this.emit('delivery_request:accepted', saved);
    return saved;
  }

  async reject(
    requestId: string,
    riderUserId: string,
    reason?: string,
  ): Promise<DeliveryRequestDocument> {
    const req = await this.findOpenForRider(requestId, riderUserId);
    req.status = 'rejected';
    req.responded_at = new Date();
    req.reject_reason = reason ?? null;
    const saved = await req.save();
    this.emit('delivery_request:rejected', saved);
    return saved;
  }

  async cancel(requestId: string, sellerId: string): Promise<DeliveryRequestDocument> {
    const req = await this.requestModel.findById(requestId).exec();
    if (!req) throw new NotFoundException('Delivery request not found');
    if (req.seller_id.toString() !== sellerId) {
      throw new ForbiddenException('Not your request');
    }
    if (req.status !== 'pending') {
      throw new BadRequestException(`Cannot cancel a request in status "${req.status}"`);
    }
    req.status = 'cancelled';
    req.responded_at = new Date();
    const saved = await req.save();
    this.emit('delivery_request:cancelled', saved);
    return saved;
  }

  // ── Queries ────────────────────────────────────────────────────────────────

  /** What's open in the rider's inbox right now. */
  async listPendingForRider(riderUserId: string): Promise<DeliveryRequestDocument[]> {
    return this.requestModel
      .find({
        rider_user_id: new Types.ObjectId(riderUserId),
        status: 'pending',
        expires_at: { $gt: new Date() },
      })
      .sort({ requested_at: -1 })
      .exec();
  }

  /** What's the live state of the seller's request on this order (if any). */
  async findActiveForOrder(orderId: string): Promise<DeliveryRequestDocument | null> {
    return this.requestModel
      .findOne({ order_id: new Types.ObjectId(orderId) })
      .sort({ created_at: -1 })
      .exec();
  }

  async findById(requestId: string): Promise<DeliveryRequestDocument | null> {
    return this.requestModel.findById(requestId).exec();
  }

  // ── Internals ──────────────────────────────────────────────────────────────

  private async findOpenForRider(
    requestId: string,
    riderUserId: string,
  ): Promise<DeliveryRequestDocument> {
    const req = await this.requestModel.findById(requestId).exec();
    if (!req) throw new NotFoundException('Delivery request not found');
    if (req.rider_user_id.toString() !== riderUserId) {
      throw new ForbiddenException('This request is not addressed to you');
    }
    if (req.status !== 'pending') {
      throw new BadRequestException(`Request is already ${req.status}`);
    }
    if (req.expires_at <= new Date()) {
      // Lazy expiration on read — sweep will mark it persistently.
      req.status = 'expired';
      await req.save().catch(() => undefined);
      this.emit('delivery_request:expired', req);
      throw new BadRequestException('Request has expired');
    }
    return req;
  }

  private async sweepExpired(): Promise<void> {
    const cutoff = new Date();
    const expired = await this.requestModel
      .find({ status: 'pending', expires_at: { $lte: cutoff } })
      .limit(100)
      .exec();
    if (expired.length === 0) return;
    this.logger.log(`expiring ${expired.length} stale delivery request(s)`);
    for (const r of expired) {
      r.status = 'expired';
      r.responded_at = cutoff;
      try {
        await r.save();
        this.emit('delivery_request:expired', r);
      } catch (err) {
        this.logger.warn(`could not expire ${r._id?.toString()}: ${String(err)}`);
      }
    }
  }

  // ── WS bridge ──────────────────────────────────────────────────────────────

  private emit(
    event:
      | 'delivery_request:new'
      | 'delivery_request:accepted'
      | 'delivery_request:rejected'
      | 'delivery_request:expired'
      | 'delivery_request:cancelled',
    doc: DeliveryRequestDocument,
  ) {
    const payload = this.toPublic(doc);
    this.ordersGateway.emitDeliveryRequest(event, payload);
  }

  toPublic(doc: DeliveryRequestDocument) {
    return {
      id: (doc._id as unknown as { toString(): string }).toString(),
      order_id: doc.order_id.toString(),
      seller_id: doc.seller_id.toString(),
      rider_user_id: doc.rider_user_id.toString(),
      rider_jps_profile_id: doc.rider_jps_profile_id,
      rider_display_name: doc.rider_display_name,
      status: doc.status,
      requested_at: doc.requested_at.toISOString(),
      expires_at: doc.expires_at.toISOString(),
      responded_at: doc.responded_at?.toISOString() ?? null,
      reject_reason: doc.reject_reason,
      delivery_fee: doc.delivery_fee,
    };
  }
}

export type DeliveryRequestPublic = ReturnType<DeliveryRequestsService['toPublic']>;
