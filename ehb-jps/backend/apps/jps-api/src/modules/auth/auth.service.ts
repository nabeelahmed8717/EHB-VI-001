import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/user.schema';
import { EhbClientService } from './ehb-client.service';

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
      token_version: user.token_version ?? 0,
    });
  }

  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    return this.usersService.toPublic(user);
  }

  async logout(userId: string): Promise<{ success: true; message: string }> {
    await this.usersService.incrementTokenVersion(userId);
    return { success: true, message: 'Logged out. All JPS sessions revoked.' };
  }

  /**
   * EHB SSO callback.
   * 1. Verify EHB token with EHB Main (port 5000)
   * 2. Find-or-create JPS user
   * 3. Link platform in EHB (best-effort)
   * 4. Issue JPS JWT
   */
  async ehbCallback(ehbToken: string): Promise<{
    access_token: string;
    user: ReturnType<UsersService['toPublic']>;
  }> {
    const ehbUser = await this.ehbClient.verifyToken(ehbToken);

    const jpsUser = await this.usersService.findOrCreateFromEhb({
      ehb_user_id: ehbUser.ehb_user_id,
      email: ehbUser.email,
      full_name: ehbUser.full_name,
    });

    void this.ehbClient.linkPlatform(ehbToken);

    return {
      access_token: this.signToken(jpsUser),
      user: this.usersService.toPublic(jpsUser),
    };
  }
}
