import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from './cart.schema';

export interface AddToCartDto {
  product_id: string;
  product_name: string;
  product_image_url?: string;
  unit_price: number;
  quantity: number;
}

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
  ) {}

  private recalcTotal(cart: CartDocument): void {
    cart.total = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
  }

  async getOrCreate(userId: string): Promise<CartDocument> {
    let cart = await this.cartModel.findOne({ user_id: new Types.ObjectId(userId) }).exec();
    if (!cart) {
      cart = new this.cartModel({ user_id: new Types.ObjectId(userId), items: [], total: 0 });
      await cart.save();
    }
    return cart;
  }

  async addItem(userId: string, dto: AddToCartDto): Promise<CartDocument> {
    const cart = await this.getOrCreate(userId);
    const productObjectId = new Types.ObjectId(dto.product_id);
    const existingIdx = cart.items.findIndex(
      (i) => i.product_id.toString() === dto.product_id,
    );

    if (existingIdx >= 0) {
      cart.items[existingIdx].quantity += dto.quantity;
      cart.items[existingIdx].subtotal =
        cart.items[existingIdx].unit_price * cart.items[existingIdx].quantity;
    } else {
      cart.items.push({
        product_id: productObjectId,
        product_name: dto.product_name,
        product_image_url: dto.product_image_url ?? null,
        unit_price: dto.unit_price,
        quantity: dto.quantity,
        subtotal: dto.unit_price * dto.quantity,
      });
    }
    this.recalcTotal(cart);
    return cart.save();
  }

  async updateItemQuantity(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<CartDocument> {
    if (quantity < 1) throw new BadRequestException('Quantity must be at least 1');
    const cart = await this.getOrCreate(userId);
    const idx = cart.items.findIndex((i) => i.product_id.toString() === productId);
    if (idx < 0) throw new NotFoundException('Item not in cart');
    cart.items[idx].quantity = quantity;
    cart.items[idx].subtotal = cart.items[idx].unit_price * quantity;
    this.recalcTotal(cart);
    return cart.save();
  }

  async removeItem(userId: string, productId: string): Promise<CartDocument> {
    const cart = await this.getOrCreate(userId);
    cart.items = cart.items.filter((i) => i.product_id.toString() !== productId);
    this.recalcTotal(cart);
    return cart.save();
  }

  async clearCart(userId: string): Promise<void> {
    await this.cartModel.findOneAndUpdate(
      { user_id: new Types.ObjectId(userId) },
      { items: [], total: 0 },
    ).exec();
  }

  toPublic(cart: CartDocument) {
    return {
      id: cart._id.toString(),
      user_id: cart.user_id.toString(),
      items: cart.items.map((i) => ({
        product_id: i.product_id.toString(),
        product_name: i.product_name,
        product_image_url: i.product_image_url,
        unit_price: i.unit_price,
        quantity: i.quantity,
        subtotal: i.subtotal,
      })),
      total: cart.total,
    };
  }
}
