import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'users', // same collection name as pss_db.users
})
export class User {
  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: String, required: true, trim: true })
  full_name: string;

  @Prop({ type: String, default: null })
  phone: string | null;

  @Prop({ type: String, default: null })
  avatar_url: string | null;

  @Prop({ type: Boolean, default: true })
  is_active: boolean;

  @Prop({ type: Boolean, default: false })
  is_verified: boolean;

  /**
   * List of sub-platform IDs this user has linked accounts on.
   * E.g. ['gosellr', 'ols', 'hps']
   */
  @Prop({ type: [String], default: [] })
  registered_platforms: string[];

  /**
   * Token version for logout / revocation.
   * Incremented by 1 on every logout. The JWT strategy rejects any token
   * whose `token_version` payload field doesn't match this value.
   * This makes all previously-issued tokens for this user immediately invalid.
   */
  @Prop({ type: Number, default: 0 })
  token_version: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
