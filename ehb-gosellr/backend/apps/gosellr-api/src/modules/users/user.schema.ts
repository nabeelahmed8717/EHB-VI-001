import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export type UserRole = 'seller' | 'buyer';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'users' })
export class User {
  @Prop({ type: String, required: true, unique: true, lowercase: true, trim: true, index: true })
  email: string;

  /**
   * Bcrypt-hashed password for locally-registered users.
   * Empty string for users who authenticate via EHB (no local password).
   */
  @Prop({ type: String, required: false, default: '' })
  password: string;

  @Prop({ type: String, required: true, trim: true })
  full_name: string;

  @Prop({ type: String, enum: ['seller', 'buyer'], required: true })
  role: UserRole;

  @Prop({ type: Boolean, default: true })
  is_active: boolean;

  @Prop({ type: String, default: null })
  pss_user_id: string | null;

  /**
   * EHB user ID from the central EHB identity platform.
   * Set when the user authenticates via EHB (OAuth-style flow).
   * Null for users registered directly on GoSellr before EHB integration.
   */
  @Prop({ type: String, default: null, index: true })
  ehb_user_id: string | null;

  /**
   * Token version for logout / revocation.
   * Incremented on every GoSellr logout. JwtStrategy rejects tokens with
   * a mismatched version — all existing GoSellr sessions are immediately invalidated.
   */
  @Prop({ type: Number, default: 0 })
  token_version: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
