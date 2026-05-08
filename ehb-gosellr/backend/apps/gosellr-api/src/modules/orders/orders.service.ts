import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from './order.schema';
import { OrdersGateway } from './orders.gateway';
import { CartService } from '../cart/cart.service';

export interface CreateOrderDto {
  buyer_id: string;
  seller_id: string;
  items: Array<{
    product_id: string;
    product_name: string;
    product_image_url?: string;
    unit_price: number;
    quantity: number;
    subtotal: number;
  }>;
  delivery_address: {
    address_line: string;
    city: string;
    area: string;
    lat?: number;
    lng?: number;
  };
  delivery_fee?: number;
  buyer_notes?: string;
}

// Valid status transitions — only these moves are allowed
const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending:             ['confirmed', 'cancelled'],
  confirmed:           ['ready_for_delivery', 'cancelled'],
  ready_for_delivery:  ['picked'],
  picked:              ['out_for_delivery'],
  out_for_delivery:    ['delivered'],
  delivered:           [],
  cancelled:           [],
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    private readonly ordersGateway: OrdersGateway,
    private readonly cartService: CartService,
  ) {}

  async create(dto: CreateOrderDto): Promise<OrderDocument> {
    const subtotal = dto.items.reduce((s, i) => s + i.subtotal, 0);
    const deliveryFee = dto.delivery_fee ?? 0;
    const total = subtotal + deliveryFee;

    const order = new this.orderModel({
      buyer_id: new Types.ObjectId(dto.buyer_id),
      seller_id: new Types.ObjectId(dto.seller_id),
      items: dto.items.map((i) => ({
        product_id: new Types.ObjectId(i.product_id),
        product_name: i.product_name,
        product_image_url: i.product_image_url ?? null,
        unit_price: i.unit_price,
        quantity: i.quantity,
        subtotal: i.subtotal,
      })),
      subtotal,
      delivery_fee: deliveryFee,
      total,
      status: 'pending' as OrderStatus,
      status_history: [{ status: 'pending', timestamp: new Date(), note: 'Order placed' }],
      delivery_address: {
        address_line: dto.delivery_address.address_line,
        city: dto.delivery_address.city,
        area: dto.delivery_address.area,
        lat: dto.delivery_address.lat ?? null,
        lng: dto.delivery_address.lng ?? null,
      },
      buyer_notes: dto.buyer_notes ?? null,
    });

    const saved = await order.save();
    // Clear buyer cart after successful order
    void this.cartService.clearCart(dto.buyer_id).catch(() => undefined);
    // Push real-time update
    this.emitUpdate(saved);
    return saved;
  }

  async findById(orderId: string): Promise<OrderDocument | null> {
    return this.orderModel.findById(orderId).exec();
  }

  async findByBuyer(buyerId: string): Promise<OrderDocument[]> {
    return this.orderModel
      .find({ buyer_id: new Types.ObjectId(buyerId) })
      .sort({ created_at: -1 })
      .exec();
  }

  async findBySeller(sellerId: string): Promise<OrderDocument[]> {
    return this.orderModel
      .find({ seller_id: new Types.ObjectId(sellerId) })
      .sort({ created_at: -1 })
      .exec();
  }

  async findByRider(riderId: string): Promise<OrderDocument[]> {
    return this.orderModel
      .find({ rider_id: new Types.ObjectId(riderId) })
      .sort({ created_at: -1 })
      .exec();
  }

  async findAvailableForRiders(): Promise<OrderDocument[]> {
    return this.orderModel
      .find({ status: 'ready_for_delivery', rider_id: null })
      .sort({ created_at: 1 })
      .exec();
  }

  async updateStatus(
    orderId: string,
    requesterId: string,
    requesterRole: string,
    newStatus: OrderStatus,
    note?: string,
  ): Promise<OrderDocument> {
    const order = await this.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');

    // Role-based permission checks
    const buyerId = order.buyer_id.toString();
    const sellerId = order.seller_id.toString();
    const riderId = order.rider_id?.toString() ?? null;

    if (requesterRole === 'seller' && sellerId !== requesterId) {
      throw new ForbiddenException('Not your order');
    }
    if (requesterRole === 'rider' && riderId && riderId !== requesterId) {
      throw new ForbiddenException('Not your delivery');
    }
    if (requesterRole === 'buyer' && buyerId !== requesterId) {
      throw new ForbiddenException('Not your order');
    }

    // Only buyers can cancel, only after pending
    if (newStatus === 'cancelled' && requesterRole !== 'buyer' && requesterRole !== 'seller') {
      throw new ForbiddenException('Only the buyer or seller can cancel an order');
    }

    // Validate transition
    const allowed = STATUS_TRANSITIONS[order.status];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from "${order.status}" to "${newStatus}". Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }

    order.status = newStatus;
    order.status_history.push({ status: newStatus, timestamp: new Date(), note: note ?? null });
    const saved = await order.save();
    this.emitUpdate(saved);
    return saved;
  }

  async assignRider(orderId: string, riderId: string): Promise<OrderDocument> {
    const order = await this.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'ready_for_delivery') {
      throw new BadRequestException('Order must be ready_for_delivery before assigning a rider');
    }
    order.rider_id = new Types.ObjectId(riderId);
    const saved = await order.save();
    this.emitUpdate(saved);
    return saved;
  }

  private emitUpdate(order: OrderDocument) {
    this.ordersGateway.emitOrderUpdated({
      order_id: order._id.toString(),
      buyer_id: order.buyer_id.toString(),
      seller_id: order.seller_id.toString(),
      rider_id: order.rider_id?.toString() ?? null,
      status: order.status,
      status_history: order.status_history,
    });
  }

  toPublic(order: OrderDocument) {
    return {
      id: order._id.toString(),
      buyer_id: order.buyer_id.toString(),
      seller_id: order.seller_id.toString(),
      rider_id: order.rider_id?.toString() ?? null,
      items: order.items.map((i) => ({
        product_id: i.product_id.toString(),
        product_name: i.product_name,
        product_image_url: i.product_image_url,
        unit_price: i.unit_price,
        quantity: i.quantity,
        subtotal: i.subtotal,
      })),
      subtotal: order.subtotal,
      delivery_fee: order.delivery_fee,
      total: order.total,
      status: order.status,
      status_history: order.status_history,
      delivery_address: order.delivery_address,
      buyer_notes: order.buyer_notes,
    };
  }
}
