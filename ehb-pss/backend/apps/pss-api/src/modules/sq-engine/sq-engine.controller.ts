import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
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
import {
  SqSubmitRequestDto,
  SqSubmitResponseDto,
  SqAlreadyActiveResponseDto,
  SqStatusResponseDto,
  SqBulkStatusRequestDto,
  SqBulkStatusResponseDto,
} from '@ehb-pss/dtos';
import { SqEngineService } from './sq-engine.service';
import { PlatformKeyGuard } from '../auth/platform-key.guard';

/**
 * SQ Engine Controller
 *
 * Exposes the three SQ endpoints defined in pss-api-contract.md.
 * All routes are called by platform backends via their pss-client module.
 * Platform identity is authenticated via PlatformKeyGuard:
 *   reads x-platform-key + x-platform-id headers
 *   validates via PlatformsService.validatePlatformKey()
 *   attaches request.platform = { platform_id, platform_name }
 */
@ApiTags('SQ Engine')
@ApiSecurity('platform-key')
@ApiHeader({
  name: 'x-platform-key',
  description: 'Platform API key — issued by PSS on platform registration',
  required: true,
})
@ApiHeader({
  name: 'x-platform-id',
  description: 'Platform ID (e.g. gosellr, ols, hps)',
  required: true,
})
@UseGuards(PlatformKeyGuard)
@Controller('sq')
export class SqEngineController {
  private readonly logger = new Logger(SqEngineController.name);

  constructor(private readonly sqEngineService: SqEngineService) {}

  // ── POST /sq/submit ──────────────────────────────────────────────────────

  /**
   * Submit an entity for SQ approval.
   *
   * Called by platform backend when user clicks "Send for Approval".
   * Returns immediately with status=pending. Final decision arrives
   * via webhook (POST /webhooks/pss on the platform backend).
   *
   * Ref: pss-api-contract.md § 1
   */
  @Post('submit')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Submit entity for SQ approval',
    description:
      'Platform sends entity data. PSS scores it, saves the request as pending, ' +
      'and emits an internal event for the rule-engine to decide routing. ' +
      'Returns immediately — decision arrives via webhook.',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'SQ request accepted and queued for processing',
    type: SqSubmitResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Entity already has an active or pending SQ level',
    type: SqAlreadyActiveResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation error in request body' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid or missing platform key' })
  async submitForSQ(
    @Body() dto: SqSubmitRequestDto,
  ): Promise<SqSubmitResponseDto | SqAlreadyActiveResponseDto> {
    this.logger.log(
      `SQ submit: entity=${dto.entity_id} type=${dto.entity_type} platform=${dto.platform_id}`,
    );
    return this.sqEngineService.submitForSQ(dto);
  }

  // ── GET /sq/status/:entity_id ────────────────────────────────────────────

  /**
   * Get the SQ status for a single entity.
   *
   * Platform backend calls this to show the SQ badge or current approval
   * status to the user. Returns different shapes depending on status
   * (approved / pending / rejected) — see SqStatusResponseDto.
   *
   * Ref: pss-api-contract.md § 2
   */
  @Get('status/:entity_id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get SQ status for a single entity',
    description:
      'Returns the current SQ level and status for an entity. ' +
      'Response shape varies by status: approved includes badge_label, ' +
      'rejected includes rejection_reason and can_resubmit.',
  })
  @ApiParam({
    name: 'entity_id',
    description: 'MongoDB ObjectId of the entity',
    example: '64f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiQuery({
    name: 'platform_id',
    description: 'Platform ID the entity belongs to',
    example: 'gosellr',
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'SQ status returned successfully',
    type: SqStatusResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No SQ record or request found for this entity on this platform',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid or missing platform key' })
  async getSqStatus(
    @Param('entity_id') entity_id: string,
    @Query('platform_id') platform_id: string,
  ): Promise<SqStatusResponseDto> {
    this.logger.log(
      `SQ status check: entity=${entity_id} platform=${platform_id}`,
    );
    return this.sqEngineService.getSqStatus(entity_id, platform_id);
  }

  // ── POST /sq/status/bulk ─────────────────────────────────────────────────

  /**
   * Get SQ status for multiple entities in one request.
   *
   * Platform frontend calls this to render SQ badges on a product listing
   * or any page showing multiple entities at once. More efficient than
   * calling GET /sq/status/:entity_id for each entity individually.
   *
   * Ref: pss-api-contract.md § 3
   */
  @Post('status/bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get SQ status for multiple entities (bulk)',
    description:
      'Returns a compact status array for use on listing pages. ' +
      'Entities with no SQ record return sq_level=null, status=pending. ' +
      'Maximum recommended batch size: 100 entity IDs per call.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk SQ status results',
    type: SqBulkStatusResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation error — invalid entity_ids' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid or missing platform key' })
  async getBulkSqStatus(
    @Body() dto: SqBulkStatusRequestDto,
  ): Promise<SqBulkStatusResponseDto> {
    this.logger.log(
      `SQ bulk status: platform=${dto.platform_id} count=${dto.entity_ids.length}`,
    );
    return this.sqEngineService.getBulkSqStatus(dto);
  }

}
