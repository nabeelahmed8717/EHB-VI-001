import {
  Controller, Post, Body, Headers, HttpCode, HttpStatus, Logger, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { Request } from 'express';
import { WebhooksService } from './webhooks.service';
import { PssWebhookPayload } from '@ehb-jps/types';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  /**
   * POST /webhooks/pss
   * Receives SQ decision events from PSS.
   *
   * ALWAYS returns 200 — non-2xx triggers PSS retry.
   * Signature is verified against the raw request bytes (req.rawBody)
   * so the HMAC matches exactly what PSS signed.
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
    @Req() req: Request,
  ): Promise<{ received: true }> {
    // Use the actual raw bytes PSS signed — NOT a re-serialization of the parsed body
    const rawBody = req.rawBody
      ? req.rawBody.toString('utf8')
      : JSON.stringify(payload);   // fallback (should not happen in practice)

    try {
      return await this.webhooksService.handlePssWebhook(payload, rawBody, signature ?? '');
    } catch (err: unknown) {
      this.logger.error(`Webhook top-level error: ${String(err)}`);
      return { received: true };
    }
  }
}
