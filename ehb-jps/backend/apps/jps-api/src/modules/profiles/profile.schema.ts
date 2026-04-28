import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ProfileRole, ProfileStatus } from '../../../../../../libs/jps-types/src';

export type ProfileDocument = Profile & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'profiles' })
export class Profile {
  @Prop({ required: true })
  user_id: string;

  @Prop({ required: true, enum: ['worker', 'employer', 'freelancer', 'trainer', 'recruiter'] })
  role: ProfileRole;

  @Prop({ required: true, trim: true })
  display_name: string;

  @Prop({ default: '' })
  bio: string;

  @Prop({ type: Object, default: {} })
  role_data: Record<string, unknown>;

  @Prop({
    default: 'draft',
    enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'resubmit_required'],
  })
  status: ProfileStatus;

  /**
   * sq_level — NEVER set by JPS logic.
   * Only written by updateFromPssWebhook() when PSS fires a decision webhook.
   */
  @Prop({ default: null })
  sq_level: number | null;

  /** PSS request ID returned when we submitted to PSS. Used for idempotency. */
  @Prop({ default: null })
  pss_request_id: string | null;

  @Prop({ default: null })
  rejection_reason: string | null;

  @Prop({ default: null })
  deleted_at: Date | null;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);

// One profile per role per user
ProfileSchema.index({ user_id: 1, role: 1 }, { unique: true, partialFilterExpression: { deleted_at: null } });
