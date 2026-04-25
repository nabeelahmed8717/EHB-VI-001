import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/user.schema';

export interface RegisterDto {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResult {
  ehb_token: string;
  user?: ReturnType<UsersService['toPublic']>;
  redirect_url?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  /** Parsed map of platform_id → callback_url from env */
  private readonly callbackUrls: Map<string, string>;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    this.callbackUrls = this.parseCallbackUrls(
      this.config.get<string>('PLATFORM_CALLBACK_URLS', ''),
    );
  }

  private parseCallbackUrls(raw: string): Map<string, string> {
    const map = new Map<string, string>();
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((entry) => {
        const colon = entry.indexOf(':');
        if (colon === -1) return;
        const platformId = entry.slice(0, colon).trim();
        // The URL portion may contain colons (http://...) — take everything after first colon
        const url = entry.slice(colon + 1).trim();
        map.set(platformId, url);
      });
    return map;
  }

  private signToken(user: UserDocument): string {
    return this.jwtService.sign({
      sub: (user._id as unknown as { toString(): string }).toString(),
      email: user.email,
      token_version: user.token_version ?? 0,
    });
  }

  /**
   * Build redirect URL for a platform.
   * Returns the platform's callback URL with ?ehb_token=<token> appended.
   */
  private buildRedirectUrl(platformId: string, ehbToken: string): string | null {
    const callbackUrl = this.callbackUrls.get(platformId);
    if (!callbackUrl) return null;
    const separator = callbackUrl.includes('?') ? '&' : '?';
    return `${callbackUrl}${separator}ehb_token=${encodeURIComponent(ehbToken)}`;
  }

  async register(dto: RegisterDto, redirectPlatform?: string): Promise<AuthResult> {
    const user = await this.usersService.createUser(dto);
    const ehb_token = this.signToken(user);

    this.logger.log(`New EHB user registered: ${user.email}`);

    if (redirectPlatform) {
      const redirect_url = this.buildRedirectUrl(redirectPlatform, ehb_token);
      if (!redirect_url) {
        this.logger.warn(`Unknown redirect platform: ${redirectPlatform}`);
        throw new BadRequestException(`Unknown platform: ${redirectPlatform}`);
      }
      return { ehb_token, redirect_url };
    }

    return { ehb_token, user: this.usersService.toPublic(user) };
  }

  async login(dto: LoginDto, redirectPlatform?: string): Promise<AuthResult> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.is_active) {
      throw new UnauthorizedException('Account is inactive');
    }

    const ehb_token = this.signToken(user);

    if (redirectPlatform) {
      const redirect_url = this.buildRedirectUrl(redirectPlatform, ehb_token);
      if (!redirect_url) {
        throw new BadRequestException(`Unknown platform: ${redirectPlatform}`);
      }
      return { ehb_token, redirect_url };
    }

    return { ehb_token, user: this.usersService.toPublic(user) };
  }

  /**
   * Validate an EHB JWT and return user identity.
   * Called by sub-platform backends to verify EHB tokens.
   */
  verifyToken(user: UserDocument): {
    valid: true;
    user: { ehb_user_id: string; email: string; full_name: string; registered_platforms: string[] };
  } {
    return {
      valid: true,
      user: {
        ehb_user_id: (user._id as unknown as { toString(): string }).toString(),
        email: user.email,
        full_name: user.full_name,
        registered_platforms: user.registered_platforms ?? [],
      },
    };
  }

  /**
   * Logout — invalidate all tokens by incrementing token_version.
   * Any previously-issued ehb_token for this user will fail JwtStrategy validation.
   */
  async logout(userId: string): Promise<{ success: true; message: string }> {
    await this.usersService.incrementTokenVersion(userId);
    this.logger.log(`User ${userId} logged out — token version incremented`);
    return { success: true, message: 'Logged out successfully. All sessions revoked.' };
  }

  /**
   * Add a platform to the user's registered_platforms list.
   * Called after a user completes platform-specific onboarding.
   */
  async linkPlatform(userId: string, platformId: string): Promise<{ success: true }> {
    const allowedPlatforms = this.config
      .get<string>('ALLOWED_PLATFORMS', '')
      .split(',')
      .map((p) => p.trim());

    if (!allowedPlatforms.includes(platformId)) {
      throw new BadRequestException(`Unknown platform: ${platformId}`);
    }

    await this.usersService.addRegisteredPlatform(userId, platformId);
    this.logger.log(`User ${userId} linked to platform: ${platformId}`);
    return { success: true };
  }
}
