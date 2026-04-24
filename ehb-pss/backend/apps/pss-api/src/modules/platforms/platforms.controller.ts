import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
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
  ApiProperty,
  ApiPropertyOptional,
  ApiSecurity,
  ApiHeader,
} from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { PlatformsService } from './platforms.service';
import { PlatformStatus } from './platform.schema';
import { AdminKeyGuard } from '../auth/admin-key.guard';

// ── Local DTOs ────────────────────────────────────────────────────────────────

export class RegisterPlatformDto {
  @ApiProperty({ example: 'gosellr', description: 'Lowercase unique platform identifier' })
  @IsString() @IsNotEmpty()
  platform_id: string;

  @ApiProperty({ example: 'GoSellr' })
  @IsString() @IsNotEmpty()
  platform_name: string;

  @ApiProperty({
    example: 'https://api.gosellr.com/pss/webhook',
    description: 'URL where PSS will POST sq.decision events',
  })
  @IsUrl()
  webhook_url: string;

  @ApiProperty({
    example: ['product', 'seller_profile'],
    description: 'Entity types this platform will submit for SQ scoring',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  entity_types: string[];

  @ApiProperty({ example: 'tech@gosellr.com' })
  @IsEmail()
  contact_email: string;
}

export class UpdateWebhookDto {
  @ApiProperty({
    example: 'https://api.gosellr.com/pss/webhook-v2',
    description: 'New webhook URL',
  })
  @IsUrl()
  webhook_url: string;
}

export class UpdateStatusDto {
  @ApiProperty({
    enum: ['active', 'suspended', 'pending'],
    description: 'New platform status',
    example: 'active',
  })
  @IsEnum(['active', 'suspended', 'pending'])
  status: PlatformStatus;
}

// ── Controller ────────────────────────────────────────────────────────────────

/**
 * Platforms Controller
 *
 * All endpoints require AdminKeyGuard except where noted.
 *
 * Endpoints:
 *   POST   /platforms/register             — register new platform (admin)
 *   GET    /platforms                       — list all platforms (admin)
 *   GET    /platforms/:platform_id          — get single platform (admin)
 *   PATCH  /platforms/:platform_id/webhook  — update webhook URL (admin)
 *   PATCH  /platforms/:platform_id/status   — activate/suspend (admin)
 *   POST   /platforms/:platform_id/rotate-key — rotate api_key (admin)
 */
@ApiTags('Platforms — Registration & Management')
@ApiSecurity('admin-key')
@ApiHeader({
  name: 'x-ehb-admin-key',
  description: 'EHB master admin key — required for all platform management endpoints',
  required: true,
})
@UseGuards(AdminKeyGuard)
@Controller('platforms')
export class PlatformsController {
  private readonly logger = new Logger(PlatformsController.name);

  constructor(private readonly platformsService: PlatformsService) {}

  // ── POST /platforms/register ──────────────────────────────────────────────

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new platform',
    description:
      'Registers a new sub-platform with PSS. Generates api_key and webhook_secret. ' +
      'Both keys are returned in plaintext ONCE — store them securely. ' +
      'Platform starts in status=pending until activated via PATCH /status.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Platform registered. api_key and webhook_secret returned (once only).',
  })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'platform_id already registered' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid admin key' })
  async register(@Body() dto: RegisterPlatformDto) {
    this.logger.log(`Register platform: platform_id=${dto.platform_id}`);
    return this.platformsService.registerPlatform({
      platform_id: dto.platform_id,
      platform_name: dto.platform_name,
      webhook_url: dto.webhook_url,
      entity_types: dto.entity_types,
      contact_email: dto.contact_email,
    });
  }

  // ── GET /platforms ────────────────────────────────────────────────────────

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List all registered platforms',
    description: 'Returns all platforms sorted by registration date (newest first).',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Platform list returned' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid admin key' })
  async listAll() {
    this.logger.log('List all platforms');
    return this.platformsService.getAllPlatforms();
  }

  // ── GET /platforms/:platform_id ───────────────────────────────────────────

  @Get(':platform_id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get single platform details' })
  @ApiParam({ name: 'platform_id', example: 'gosellr' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Platform details returned' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Platform not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid admin key' })
  async getOne(@Param('platform_id') platform_id: string) {
    this.logger.log(`Get platform: platform_id=${platform_id}`);
    const platform = await this.platformsService.getPlatform(platform_id);
    if (!platform) {
      throw new NotFoundException(`Platform "${platform_id}" not found`);
    }
    return platform;
  }

  // ── PATCH /platforms/:platform_id/webhook ─────────────────────────────────

  @Patch(':platform_id/webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update platform webhook URL',
    description: 'Updates the URL where PSS pushes sq.decision events.',
  })
  @ApiParam({ name: 'platform_id', example: 'gosellr' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Webhook URL updated' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Platform not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid admin key' })
  async updateWebhook(
    @Param('platform_id') platform_id: string,
    @Body() dto: UpdateWebhookDto,
  ) {
    this.logger.log(`Update webhook: platform_id=${platform_id}`);
    return this.platformsService.updateWebhookUrl(platform_id, dto.webhook_url);
  }

  // ── PATCH /platforms/:platform_id/status ──────────────────────────────────

  @Patch(':platform_id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activate or suspend a platform',
    description:
      'Sets the platform status. ' +
      'suspended → API key rejected on next request; webhooks paused. ' +
      'active → platform operational.',
  })
  @ApiParam({ name: 'platform_id', example: 'gosellr' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Status updated' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Platform not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid admin key' })
  async updateStatus(
    @Param('platform_id') platform_id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    this.logger.log(`Update status: platform_id=${platform_id} status=${dto.status}`);
    return this.platformsService.updateStatus(platform_id, dto.status);
  }

  // ── POST /platforms/:platform_id/rotate-key ───────────────────────────────

  @Post(':platform_id/rotate-key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotate platform API key',
    description:
      'Generates a new api_key and immediately invalidates the old one. ' +
      'New key is returned in plaintext — cannot be retrieved again. ' +
      'The platform must update their PSS client config with the new key.',
  })
  @ApiParam({ name: 'platform_id', example: 'gosellr' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'New api_key returned (plaintext, one time only)',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Platform not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid admin key' })
  async rotateKey(@Param('platform_id') platform_id: string) {
    this.logger.log(`Rotate key: platform_id=${platform_id}`);
    return this.platformsService.rotateApiKey(platform_id);
  }
}
