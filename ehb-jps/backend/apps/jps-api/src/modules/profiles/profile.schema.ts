import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { EhbPlatform, ProfileRole, ProfileStatus } from '@ehb-jps/types';

export type ProfileDocument = Profile & Document;

const ROLE_ENUM = [
  'seller', 'buyer', 'rider', 'chef', 'driver',
  'cleaner', 'electrician', 'plumber', 'trainer',
  'worker', 'employer', 'freelancer', 'recruiter',
  'doctor', 'nurse', 'lawyer', 'teacher', 'other',
];

const PLATFORM_ENUM = ['gosellr', 'jps', 'hps', 'ols', 'wms', 'obs'];

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'profiles' })
export class Profile {
  @Prop({ type: String, required: true })
  user_id: string;

  /** EHB sub-platform this profile belongs to */
  @Prop({ type: String, required: true, enum: PLATFORM_ENUM })
  platform: EhbPlatform;

  // type: String required — reflect-metadata cannot infer union types at runtime
  @Prop({ type: String, required: true, enum: ROLE_ENUM })
  role: ProfileRole;

  @Prop({ type: String, required: true, trim: true })
  display_name: string;

  @Prop({ type: String, default: '' })
  bio: string;

  @Prop({ type: String, default: '' })
  description: string;

  /** CNIC front image path (relative to uploads dir) */
  @Prop({ type: String, default: null })
  cnic_front: string | null;

  /** CNIC back image path */
  @Prop({ type: String, default: null })
  cnic_back: string | null;

  @Prop({ type: String, default: '' })
  address: string;

  /** Address proof image path */
  @Prop({ type: String, default: null })
  address_proof: string | null;

  @Prop({
    type: String,
    default: 'draft',
    enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'resubmit_required'],
  })
  status: ProfileStatus;

  /**
   * sq_level — NEVER set by JPS logic.
   * Only written by updateFromPssWebhook() when PSS fires a decision webhook.
   */
  @Prop({ type: Number, default: null })
  sq_level: number | null;

  /** PSS request ID returned when we submitted to PSS. Used for idempotency. */
  @Prop({ type: String, default: null })
  pss_request_id: string | null;

  @Prop({ type: String, default: null })
  rejection_reason: string | null;

  @Prop({ type: Date, default: null })
  deleted_at: Date | null;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);

// One profile per platform+role per user
ProfileSchema.index(
  { user_id: 1, platform: 1, role: 1 },
  { unique: true, partialFilterExpression: { deleted_at: null } },
);
