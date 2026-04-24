import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './user.schema';

export interface CreateUserDto {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async createUser(dto: CreateUserDto): Promise<UserDocument> {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = new this.userModel({
      email: dto.email.toLowerCase().trim(),
      password: hashed,
      full_name: dto.full_name,
      phone: dto.phone ?? null,
    });
    return user.save();
  }

  /**
   * Increment token_version to invalidate all currently-issued JWTs for this user.
   * Called on logout — any token with an old version is rejected by JwtStrategy.
   */
  async incrementTokenVersion(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(
      userId,
      { $inc: { token_version: 1 } },
    ).exec();
  }

  async addRegisteredPlatform(userId: string, platformId: string): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $addToSet: { registered_platforms: platformId } },
      { new: true },
    ).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /** Safe public profile — never expose password */
  toPublic(user: UserDocument) {
    return {
      ehb_user_id: (user._id as unknown as { toString(): string }).toString(),
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      avatar_url: user.avatar_url,
      is_active: user.is_active,
      is_verified: user.is_verified,
      registered_platforms: user.registered_platforms,
    };
  }
}
