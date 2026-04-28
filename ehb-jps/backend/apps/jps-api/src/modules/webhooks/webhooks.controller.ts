import {
  Controller, Post, Body, Headers, HttpCode, HttpStatus, Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { PssWebhookPayload } from '../../../../../../libs/jps-types/src';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  /**
   * POST /webhooks/pss
   * Receives SQ decision events from PSS.
   * ALWAYS returns 200 — non-2xx triggers PSS retry.
   */
  @Post('pss')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive SQ decision webhook from PSS' })
  @ApiHeader({
    name: 'x-pss-signature',
    description: 'HMAC-SHA256 signature from PSS: sha256=<hex>',
    required: true,
  })
  async handlePssWebhook(
    @Body() payload: PssWebhookPayload,
    @Headers('x-pss-signature') signature: string,
  ): Promise<{ received: true }> {
    const rawBody = JSON.stringify(payload);
    try {
      return await this.webhooksService.handlePssWebhook(payload, rawBody, signature ?? '');
    } catch (err: unknown) {
      this.logger.error(`Webhook top-level error: ${String(err)}`);
      return { received: true };
    }
  }
}
