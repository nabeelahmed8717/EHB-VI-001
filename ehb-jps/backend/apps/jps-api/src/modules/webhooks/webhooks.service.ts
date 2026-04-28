import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { ProfilesService } from '../profiles/profiles.service';
import { PssWebhookPayload } from '../../../../../../libs/jps-types/src';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  private readonly webhookSecret: string;

  constructor(
    private readonly config: ConfigService,
    private readonly profilesService: ProfilesService,
  ) {
    this.webhookSecret = this.config.getOrThrow<string>('PSS_WEBHOOK_SECRET');
  }

  verifySignature(rawBody: string, signature: string): void {
    const expected = `sha256=${crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex')}`;

    const expectedBuf = Buffer.from(expected);
    const signatureBuf = Buffer.from(signature);
    const valid =
      expectedBuf.length === signatureBuf.length &&
      crypto.timingSafeEqual(expectedBuf, signatureBuf);

    if (!valid) {
      this.logger.warn(`Webhook signature mismatch — received: ${signature}`);
      throw new UnauthorizedException('Invalid webhook signature');
    }
  }

  async handlePssWebhook(
    payload: PssWebhookPayload,
    rawBody: string,
    signature: string,
  ): Promise<{ received: true }> {
    this.verifySignature(rawBody, signature);

    this.logger.log(
      `PSS webhook: event=${payload.event} entity=${payload.entity_id} decision=${payload.decision}`,
    );

    try {
      if (payload.event === 'sq.decision') {
        await this.profilesService.updateFromPssWebhook(
          payload.entity_id,
          payload.decision,
          payload.sq_level,
          payload.rejection_reason,
        );
      }
      // sq.under_review events are informational — no action needed
    } catch (err: unknown) {
      this.logger.error(`Webhook handler error: ${String(err)}`);
      // Always return 200 — PSS must not retry due to our internal errors
    }

    return { received: true };
  }
}
