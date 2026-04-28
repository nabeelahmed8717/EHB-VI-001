import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'users' })
export class User {
  @Prop({ required: true, unique: true })
  ehb_user_id: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  full_name: string;

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ default: 0 })
  token_version: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
