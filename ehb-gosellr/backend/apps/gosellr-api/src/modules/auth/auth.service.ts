import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UserDocument, UserRole } from '../users/user.schema';
import { comparePassword, hashPassword } from '../../../../../libs/gosellr-utils/src';
import { EhbClientService } from './ehb-client.service';

export interface RegisterDto {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
}

export interface LoginDto {
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly ehbClient: EhbClientService,
  ) {}

  private signToken(user: UserDocument): string {
    return this.jwtService.sign({
      sub: (user._id as unknown as { toString(): string }).toString(),
      email: user.email,
      role: user.role,
      token_version: user.token_version ?? 0,
    });
  }

  async register(dto: RegisterDto) {
    const user = await this.usersService.createUser(dto);
    const token = this.signToken(user);
    return {
      access_token: token,
      user: this.usersService.toPublic(user),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    // EHB-linked users have no local password — must authenticate via EHB
    if (!user.password) {
      throw new UnauthorizedException('This account uses EHB login. Please sign in via EHB.');
    }
    const valid = await comparePassword(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.is_active) {
      throw new UnauthorizedException('Account is inactive');
    }
    const token = this.signToken(user);
    return {
      access_token: token,
      user: this.usersService.toPublic(user),
    };
  }

  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    return this.usersService.toPublic(user);
  }

  /**
   * EHB OAuth-style callback.
   *
   * Flow:
   * 1. Verify ehb_token with EHB Main identity API
   * 2. Find or create a GoSellr user mapped to that EHB identity
   * 3. Notify EHB to add 'gosellr' to user.registered_platforms
   * 4. Issue a GoSellr JWT
   */
  /**
   * Change (or first-time set) a user's local GoSellr password.
   *
   * Rules:
   *  - EHB users (no local password):  `current_password` is NOT required.
   *    They are simply setting a password for the first time.
   *  - Local users (password already set): `current_password` IS required and
   *    must match before the new password is accepted.
   */
  async changePassword(
    userId: string,
    dto: { current_password?: string; new_password: string },
  ): Promise<{ message: string }> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    const hasLocalPassword = !!user.password;

    if (hasLocalPassword) {
      // Must supply and verify current password
      if (!dto.current_password) {
        throw new BadRequestException('current_password is required');
      }
      const valid = await comparePassword(dto.current_password, user.password);
      if (!valid) throw new UnauthorizedException('Current password is incorrect');
    }

    const hashed = await hashPassword(dto.new_password);
    await this.usersService.updatePassword(userId, hashed);
    return { message: 'Password updated successfully' };
  }

  /**
   * Logout — revoke all GoSellr sessions for this user by incrementing token_version.
   */
  async logout(userId: string): Promise<{ success: true; message: string }> {
    await this.usersService.incrementTokenVersion(userId);
    return { success: true, message: 'Logged out. All GoSellr sessions revoked.' };
  }

  async ehbCallback(ehbToken: string): Promise<{
    access_token: string;
    user: ReturnType<UsersService['toPublic']>;
  }> {
    // 1. Verify EHB token
    const ehbUser = await this.ehbClient.verifyToken(ehbToken);

    // 2. Find or create GoSellr user
    const gosellrUser = await this.usersService.createFromEhb({
      ehb_user_id: ehbUser.ehb_user_id,
      email: ehbUser.email,
      full_name: ehbUser.full_name,
      role: 'buyer' as UserRole, // default role — user can upgrade to seller in dashboard
    });

    // 3. Link platform in EHB (best-effort, non-blocking)
    void this.ehbClient.linkPlatform(ehbToken);

    // 4. Issue GoSellr JWT
    const token = this.signToken(gosellrUser);
    return {
      access_token: token,
      user: this.usersService.toPublic(gosellrUser),
    };
  }
}
