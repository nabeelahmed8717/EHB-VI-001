import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEhbId(ehb_user_id: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ ehb_user_id }).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  /**
   * Find-or-create a JPS user from EHB identity.
   * Called on every EHB SSO callback.
   */
  async findOrCreateFromEhb(data: {
    ehb_user_id: string;
    email: string;
    full_name: string;
  }): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ ehb_user_id: data.ehb_user_id }).exec();
    if (existing) {
      // Sync name/email in case they changed on EHB
      existing.email = data.email;
      existing.full_name = data.full_name;
      return existing.save();
    }
    return this.userModel.create(data);
  }

  async incrementTokenVersion(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { $inc: { token_version: 1 } });
  }

  toPublic(user: UserDocument) {
    return {
      id: (user._id as unknown as { toString(): string }).toString(),
      ehb_user_id: user.ehb_user_id,
      email: user.email,
      full_name: user.full_name,
      is_active: user.is_active,
    };
  }
}
