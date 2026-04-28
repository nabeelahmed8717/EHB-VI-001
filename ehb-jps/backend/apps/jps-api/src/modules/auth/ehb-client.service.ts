import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface EhbVerifyResponse {
  valid: true;
  user: {
    ehb_user_id: string;
    email: string;
    full_name: string;
  };
}

@Injectable()
export class EhbClientService {
  private readonly logger = new Logger(EhbClientService.name);
  private readonly ehbApiUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {
    this.ehbApiUrl = this.config.getOrThrow<string>('EHB_API_URL');
  }

  async verifyToken(ehbToken: string): Promise<EhbVerifyResponse['user']> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<EhbVerifyResponse>(
          `${this.ehbApiUrl}/auth/verify-token`,
          { headers: { Authorization: `Bearer ${ehbToken}` } },
        ),
      );
      return response.data.user;
    } catch (err: unknown) {
      this.logger.error(`EHB token verification failed: ${String(err)}`);
      throw new UnauthorizedException('Invalid or expired EHB token');
    }
  }

  async linkPlatform(ehbToken: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.ehbApiUrl}/auth/link-platform`,
          { platform_id: 'jps' },
          { headers: { Authorization: `Bearer ${ehbToken}` } },
        ),
      );
    } catch (err: unknown) {
      this.logger.warn(`EHB link-platform failed (non-fatal): ${String(err)}`);
    }
  }
}
