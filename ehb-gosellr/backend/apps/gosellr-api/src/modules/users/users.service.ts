import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from './user.schema';
import { hashPassword } from '../../../../../libs/gosellr-utils/src';

export interface CreateUserDto {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
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

  async findByEhbUserId(ehbUserId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ ehb_user_id: ehbUserId }).exec();
  }

  /**
   * Find or create a GoSellr user from an EHB identity.
   * Called by the EHB callback flow — user comes from EHB with verified identity.
   *
   * Idempotency rules (in priority order):
   *  1. Found by ehb_user_id       → return as-is (already linked)
   *  2. Found by email, no ehb_id  → link by writing ehb_user_id onto existing record
   *  3. Not found at all           → create new user
   *
   * This prevents E11000 duplicate-key errors when a user who registered
   * locally before EHB integration later signs in via EHB.
   */
  async createFromEhb(dto: {
    ehb_user_id: string;
    email: string;
    full_name: string;
    role: UserRole;
  }): Promise<UserDocument> {
    // 1. Already fully linked
    const byEhbId = await this.findByEhbUserId(dto.ehb_user_id);
    if (byEhbId) return byEhbId;

    // 2. Email exists but not yet linked to EHB — link it
    const byEmail = await this.findByEmail(dto.email);
    if (byEmail) {
      byEmail.ehb_user_id = dto.ehb_user_id;
      return byEmail.save();
    }

    // 3. Brand new user — create
    const user = new this.userModel({
      email: dto.email.toLowerCase().trim(),
      password: '', // no local password — auth is via EHB
      full_name: dto.full_name,
      role: dto.role,
      ehb_user_id: dto.ehb_user_id,
    });

    try {
      return await user.save();
    } catch (err: unknown) {
      // E11000: two concurrent requests raced past the check-then-insert.
      // Recover by returning whichever document won the insert race.
      if ((err as { code?: number }).code === 11000) {
        const recovered =
          (await this.findByEhbUserId(dto.ehb_user_id)) ??
          (await this.findByEmail(dto.email));
        if (recovered) return recovered;
      }
      throw err;
    }
  }

  /**
   * Increment token_version to invalidate all current GoSellr sessions for this user.
   */
  async incrementTokenVersion(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(
      userId,
      { $inc: { token_version: 1 } },
    ).exec();
  }

  async createUser(dto: CreateUserDto): Promise<UserDocument> {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const hashed = await hashPassword(dto.password);
    const user = new this.userModel({
      email: dto.email.toLowerCase().trim(),
      password: hashed,
      full_name: dto.full_name,
      role: dto.role,
    });
    return user.save();
  }

  async updatePassword(userId: string, newHashedPassword: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { password: newHashedPassword }).exec();
  }

  /** Strip password — safe to send to client */
  toPublic(user: UserDocument) {
    return {
      id: (user._id as unknown as { toString(): string }).toString(),
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      /** true if the user has a local password set (can log in without EHB) */
      has_password: !!user.password,
    };
  }
}
