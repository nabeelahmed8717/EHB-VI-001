import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SellerDocument = Seller & Document;

export type SqStatus =
  | 'not_submitted'
  | 'pending'
  | 'pending_franchise'
  | 'pending_edr'
  | 'approved'
  | 'rejected';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'sellers' })
export class Seller {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  user_id: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  business_name: string;

  @Prop({ type: String, required: true, trim: true })
  business_type: string;

  @Prop({ type: String, required: true, trim: true })
  business_category: string;

  @Prop({ type: String, default: '', trim: true })
  store_description: string;

  @Prop({ type: String, default: null, trim: true })
  store_logo_url: string | null;

  @Prop({
    type: {
      bank_name: String,
      account_title: String,
      account_number: String,
      iban: String,
    },
    default: null,
  })
  bank_info: {
    bank_name: string;
    account_title: string;
    account_number: string;
    iban: string;
  } | null;

  @Prop({ type: [String], default: [] })
  document_urls: string[];

  @Prop({ type: Number, default: null })
  sq_level: number | null;

  @Prop({
    type: String,
    enum: ['not_submitted', 'pending', 'pending_franchise', 'pending_edr', 'approved', 'rejected'],
    default: 'not_submitted',
  })
  sq_status: SqStatus;

  @Prop({ type: String, default: null })
  sq_request_id: string | null;

  @Prop({ type: Date, default: null })
  sq_decided_at: Date | null;

  @Prop({ type: String, default: null })
  sq_rejection_reason: string | null;

  @Prop({ type: String, default: null })
  sq_badge_label: string | null;

  @Prop({ type: Boolean, default: true })
  is_active: boolean;

  // ── JPS profile linkage ────────────────────────────────────────────────────
  // Required before this seller can upload products.
  // Stores ONLY the JPS profile id — the source of truth for display_name,
  // bio, and sq_level lives in JPS. GoSellr fetches it through jps-client
  // every time it renders a product (with a 5-minute in-memory cache).
  //
  // Linked profile must satisfy (platform=gosellr, role=seller).
  // Any JPS status (draft / submitted / approved) is accepted.

  @Prop({ type: String, default: null })
  jps_profile_id: string | null;

  @Prop({ type: Date, default: null })
  jps_profile_linked_at: Date | null;
}

export const SellerSchema = SchemaFactory.createForClass(Seller);

// Prevent two GoSellr sellers from claiming the same JPS profile.
// Partial filter so multiple sellers without a linked profile remain valid.
SellerSchema.index(
  { jps_profile_id: 1 },
  { unique: true, partialFilterExpression: { jps_profile_id: { $type: 'string' } } },
);
