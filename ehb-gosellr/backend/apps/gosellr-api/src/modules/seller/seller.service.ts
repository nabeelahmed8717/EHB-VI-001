import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Seller, SellerDocument } from './seller.schema';
import { PssClientService } from '../pss-client/pss-client.service';

export interface CreateSellerDto {
  user_id: string;
  business_name: string;
  business_type: string;
  business_category: string;
  store_description?: string;
}

export interface UpdateSellerDto {
  business_name?: string;
  business_type?: string;
  business_category?: string;
  store_description?: string;
  store_logo_url?: string;
  document_urls?: string[];
  bank_info?: {
    bank_name: string;
    account_title: string;
    account_number: string;
    iban: string;
  };
}

@Injectable()
export class SellerService {
  constructor(
    @InjectModel(Seller.name) private readonly sellerModel: Model<SellerDocument>,
    private readonly pssClient: PssClientService,
  ) {}

  async create(dto: CreateSellerDto): Promise<SellerDocument> {
    const existing = await this.sellerModel.findOne({
      user_id: new Types.ObjectId(dto.user_id),
    }).exec();
    if (existing) throw new ConflictException('Seller profile already exists for this account');

    const seller = new this.sellerModel({
      user_id: new Types.ObjectId(dto.user_id),
      business_name: dto.business_name,
      business_type: dto.business_type,
      business_category: dto.business_category,
      store_description: dto.store_description ?? '',
    });
    const saved = await seller.save();
    // PSS verification is NOT submitted automatically.
    // The seller must manually trigger it via POST /seller/pss-submit.
    return saved;
  }

  async findByUserId(userId: string): Promise<SellerDocument | null> {
    return this.sellerModel.findOne({ user_id: new Types.ObjectId(userId) }).exec();
  }

  async findById(sellerId: string): Promise<SellerDocument | null> {
    return this.sellerModel.findById(sellerId).exec();
  }

  async update(userId: string, dto: UpdateSellerDto): Promise<SellerDocument> {
    const seller = await this.findByUserId(userId);
    if (!seller) throw new NotFoundException('Seller profile not found');

    Object.assign(seller, dto);
    return seller.save();
  }

  /**
   * Manually submit the seller's store profile to PSS for SQ verification.
   * Can only be triggered when sq_status is 'not_submitted' or 'rejected'.
   * Throws BadRequestException if a submission is already in-flight or approved.
   */
  async manualSubmitToPss(userId: string): Promise<{ sq_status: string; sq_request_id: string | null }> {
    const seller = await this.findByUserId(userId);
    if (!seller) throw new NotFoundException('Seller profile not found');

    const blockedStatuses = ['pending', 'pending_franchise', 'pending_edr', 'approved'];
    if (blockedStatuses.includes(seller.sq_status)) {
      throw new BadRequestException(
        `Cannot submit — current status is "${seller.sq_status}". ` +
        'Resubmission is only allowed when status is "not_submitted" or "rejected".',
      );
    }

    const entityData = {
      business_name: seller.business_name,
      business_category: seller.business_category,
      business_type: seller.business_type,
    };

    const result = await this.pssClient.submitForSQ(
      seller._id.toString(),
      userId,
      'seller',
      entityData,
    );

    const updated = await this.sellerModel.findByIdAndUpdate(
      seller._id,
      {
        sq_status: result.success ? 'pending' : 'not_submitted',
        sq_request_id: result.sq_request_id ?? null,
      },
      { new: true },
    ).exec();

    return {
      sq_status: updated?.sq_status ?? 'not_submitted',
      sq_request_id: updated?.sq_request_id ?? null,
    };
  }

  /**
   * Internal helper used by other services (e.g. webhooks) to update PSS status.
   */
  async submitToPss(
    sellerId: string,
    userId: string,
    entityData: Record<string, unknown>,
  ): Promise<void> {
    const result = await this.pssClient.submitForSQ(sellerId, userId, 'seller', entityData);
    await this.sellerModel.findByIdAndUpdate(sellerId, {
      sq_status: result.success ? 'pending' : 'not_submitted',
      sq_request_id: result.sq_request_id ?? null,
    }).exec();
  }

  async getStats(userId: string): Promise<{
    sq_status: string;
    sq_level: number | null;
    sq_badge_label: string | null;
    is_active: boolean;
  }> {
    const seller = await this.findByUserId(userId);
    if (!seller) throw new NotFoundException('Seller profile not found');
    return {
      sq_status: seller.sq_status,
      sq_level: seller.sq_level,
      sq_badge_label: seller.sq_badge_label,
      is_active: seller.is_active,
    };
  }

  toPublic(seller: SellerDocument) {
    return {
      id: seller._id.toString(),
      user_id: seller.user_id.toString(),
      business_name: seller.business_name,
      business_type: seller.business_type,
      business_category: seller.business_category,
      store_description: seller.store_description,
      store_logo_url: seller.store_logo_url,
      bank_info: seller.bank_info,
      document_urls: seller.document_urls,
      sq_status: seller.sq_status,
      sq_level: seller.sq_level,
      sq_badge_label: seller.sq_badge_label,
      is_active: seller.is_active,
    };
  }
}
