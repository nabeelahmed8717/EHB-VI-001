import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiSecurity,
  ApiHeader,
} from '@nestjs/swagger';
import { WebhookService } from './webhook.service';
import { PlatformKeyGuard } from '../auth/platform-key.guard';
import { AdminKeyGuard } from '../auth/admin-key.guard';

/**
 * Webhook Controller
 *
 * Exposes 3 endpoints:
 *
 *   GET  /webhooks/deliveries/:platform_id  — list recent deliveries for a platform
 *                                             (PlatformKeyGuard — platform sees its own)
 *
 *   GET  /webhooks/delivery/:sq_request_id  — single delivery record by SQ request ID
 *                                             (PlatformKeyGuard — platform verifies delivery)
 *
 *   POST /webhooks/test/:platform_id        — admin test ping to verify connectivity
 *                                             (AdminKeyGuard — EHB admin only)
 *
 * Note: This controller uses different guards per endpoint, so guards are
 * applied at the method level rather than the controller level.
 */
@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly webhookService: WebhookService) {}

  // ── GET /webhooks/deliveries/:platform_id ─────────────────────────────────

  /**
   * Returns recent webhook delivery records for a platform.
   * Sorted most-recent-first (created_at DESC).
   * Platforms use this to inspect delivery history and diagnose failures.
   * Maximum 200 results per call.
   */
  @Get('deliveries/:platform_id')
  @HttpCode(HttpStatus.OK)
  @ApiSecurity('platform-key')
  @ApiHeader({
    name: 'x-platform-key',
    description: 'Platform API key',
    required: true,
  })
  @ApiHeader({
    name: 'x-platform-id',
    description: 'Platform ID (must match :platform_id path param)',
    required: true,
  })
  @UseGuards(PlatformKeyGuard)
  @ApiOperation({
    summary: 'List webhook delivery records for a platform',
    description:
      'Returns recent delivery records for the authenticated platform, sorted most-recent-first. ' +
      'Each record shows the payload sent, the delivery status, attempt count, and any error message. ' +
      'Maximum 200 records per call. Use the `limit` query param to reduce the result set.',
  })
  @ApiParam({
    name: 'platform_id',
    description: 'Platform ID to query delivery records for',
    example: 'gosellr',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of records to return (1–200, default 50)',
    required: false,
    type: Number,
    example: 50,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Delivery records returned, sorted most-recent-first',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid or missing platform key' })
  async getDeliveriesForPlatform(
    @Param('platform_id') platform_id: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const clampedLimit = isNaN(parsedLimit) ? 50 : Math.max(1, Math.min(parsedLimit, 200));

    this.logger.log(`List deliveries: platform=${platform_id} limit=${clampedLimit}`);
    return this.webhookService.getDeliveriesForPlatform(platform_id, clampedLimit);
  }

  // ── GET /webhooks/delivery/:sq_request_id ─────────────────────────────────

  /**
   * Returns the webhook delivery record for a specific SQ request.
   * Platform backend calls this to confirm delivery after receiving a webhook
   * (or to diagnose why a webhook has not arrived).
   */
  @Get('delivery/:sq_request_id')
  @HttpCode(HttpStatus.OK)
  @ApiSecurity('platform-key')
  @ApiHeader({
    name: 'x-platform-key',
    description: 'Platform API key',
    required: true,
  })
  @ApiHeader({
    name: 'x-platform-id',
    description: 'Platform ID',
    required: true,
  })
  @UseGuards(PlatformKeyGuard)
  @ApiOperation({
    summary: 'Get webhook delivery status for a specific SQ request',
    description:
      'Returns the delivery record for the given sq_request_id. ' +
      'Includes full payload snapshot, delivery status (pending/retrying/delivered/failed), ' +
      'attempt count, timestamps, and error message if delivery failed. ' +
      'Returns 404 if no delivery has been queued for this SQ request yet.',
  })
  @ApiParam({
    name: 'sq_request_id',
    description: 'The SQ request ID to look up delivery for',
    example: '665f1e2a4b3c2a1d0e9f8b7a',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Delivery record returned',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No delivery queued for this SQ request yet',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid or missing platform key' })
  async getDeliveryBySqRequestId(@Param('sq_request_id') sq_request_id: string) {
    this.logger.log(`Delivery lookup: sq_request_id=${sq_request_id}`);
    const delivery = await this.webhookService.getDeliveryBySqRequestId(sq_request_id);
    if (!delivery) {
      throw new NotFoundException(
        `No webhook delivery found for sq_request_id="${sq_request_id}". ` +
        `The request may still be in review (not yet decided) or the event has not been processed.`,
      );
    }
    return delivery;
  }

  // ── POST /webhooks/test/:platform_id ─────────────────────────────────────

  /**
   * Sends a test ping to a platform's webhook URL.
   * Used by EHB admins after:
   *   - Platform registers or updates their webhook URL
   *   - Troubleshooting failed deliveries
   *   - Verifying a new webhook secret was applied correctly
   *
   * The test payload is NOT a real sq.decision event — it uses event='sq.test_ping'.
   * The platform's webhook handler should respond 200 to any PSS event type.
   * This endpoint does NOT create a WebhookDelivery record.
   */
  @Post('test/:platform_id')
  @HttpCode(HttpStatus.OK)
  @ApiSecurity('admin-key')
  @ApiHeader({
    name: 'x-ehb-admin-key',
    description: 'EHB master admin key',
    required: true,
  })
  @UseGuards(AdminKeyGuard)
  @ApiOperation({
    summary: 'Send a test webhook ping to a platform (admin only)',
    description:
      'Sends a signed test payload (event=sq.test_ping) to the platform\'s configured webhook URL. ' +
      'Returns the HTTP status code and message from the platform\'s endpoint. ' +
      'Use this to verify webhook configuration without waiting for a real SQ decision. ' +
      'This does NOT create a WebhookDelivery record and is NOT retried on failure.',
  })
  @ApiParam({
    name: 'platform_id',
    description: 'Platform ID to send the test ping to',
    example: 'gosellr',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Test ping result — includes ok, status code, and message',
    schema: {
      type: 'object',
      properties: {
        ok: { type: 'boolean', example: true },
        status: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Test ping delivered to https://api.gosellr.com/webhooks/pss (HTTP 200)' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Platform not found or has no webhook URL configured',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid or missing admin key' })
  async sendTestPing(@Param('platform_id') platform_id: string) {
    this.logger.log(`Test ping: platform=${platform_id}`);
    const result = await this.webhookService.sendTestPing(platform_id);
    if (!result.ok && result.status === 0 && result.message.includes('No webhook config')) {
      throw new NotFoundException(result.message);
    }
    return result;
  }
}
