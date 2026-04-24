import {
  Controller,
  DefaultValuePipe,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiProperty,
  ApiPropertyOptional,
  ApiSecurity,
  ApiHeader,
} from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
  IsObject,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { EdrService } from './edr.service';
import { EdrDecision } from './edr-review.schema';

// ── Local DTOs ────────────────────────────────────────────────────────────────

export class EdrDecideDto {
  @ApiProperty({
    enum: ['approved', 'conditional', 'rejected'],
    description:
      'approved / conditional → assign SQ level, close request. ' +
      'rejected → reject with required rejection_reason.',
    example: 'approved',
  })
  @IsEnum(['approved', 'conditional', 'rejected'])
  decision: Exclude<EdrDecision, 'pending'>;

  @ApiPropertyOptional({
    description:
      'Required when decision=approved or conditional. ' +
      'EDR may assign any valid SQ level (1,2,3,5,7,10) — ' +
      'not limited to sq_level_calculated.',
    enum: [1, 2, 3, 5, 7, 10],
    example: 7,
    nullable: true,
  })
  @ValidateIf(
    (o: EdrDecideDto) => o.decision === 'approved' || o.decision === 'conditional',
  )
  @IsNumber()
  sq_level_assigned?: number | null;

  @ApiPropertyOptional({
    description: 'Required when decision=rejected.',
    example: 'Entity does not meet legal compliance standards for this region',
    nullable: true,
  })
  @ValidateIf((o: EdrDecideDto) => o.decision === 'rejected')
  @IsString()
  @IsNotEmpty()
  rejection_reason?: string | null;

  @ApiProperty({
    description: 'ID of the EDR staff member submitting this decision',
    example: 'edr_staff_001',
  })
  @IsString()
  @IsNotEmpty()
  reviewed_by: string;

  @ApiPropertyOptional({
    description: 'Optional notes for this decision (required when overriding, optional here)',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  override_notes?: string | null;
}

export class EdrOverrideDto {
  @ApiProperty({
    enum: ['approved', 'conditional', 'rejected'],
    description: 'New decision to apply after reopening the request.',
    example: 'approved',
  })
  @IsEnum(['approved', 'conditional', 'rejected'])
  new_decision: Exclude<EdrDecision, 'pending'>;

  @ApiPropertyOptional({
    description: 'Required when new_decision=approved or conditional.',
    enum: [1, 2, 3, 5, 7, 10],
    example: 5,
    nullable: true,
  })
  @ValidateIf(
    (o: EdrOverrideDto) =>
      o.new_decision === 'approved' || o.new_decision === 'conditional',
  )
  @IsNumber()
  sq_level_assigned?: number | null;

  @ApiPropertyOptional({
    description: 'Required when new_decision=rejected.',
    nullable: true,
  })
  @ValidateIf((o: EdrOverrideDto) => o.new_decision === 'rejected')
  @IsString()
  @IsNotEmpty()
  rejection_reason?: string | null;

  @ApiProperty({
    description: 'ID of the EDR staff member submitting this override',
    example: 'edr_staff_001',
  })
  @IsString()
  @IsNotEmpty()
  reviewed_by: string;

  @ApiProperty({
    description:
      'REQUIRED. EDR must justify why they are overriding a prior decision. ' +
      'Logged in audit_logs as the reason for the override.',
    example: 'Platform admin appeal approved — seller provided missing compliance documents',
  })
  @IsString()
  @IsNotEmpty()
  override_notes: string;
}

export class EdrEditDto {
  @ApiPropertyOptional({
    description:
      'Edited entity data. Stored in edr_review.edited_entity_data. ' +
      'The original SqRequest.entity_data is NOT modified — ' +
      'it is preserved for audit trail integrity.',
    example: { title: 'Updated Product Title', images: ['img1.jpg', 'img2.jpg'] },
    nullable: true,
  })
  @IsOptional()
  @IsObject()
  entity_data?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description: 'Notes explaining why the entity data was edited',
    example: 'Seller submitted corrected product images via support ticket #1234',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiProperty({
    description: 'ID of the EDR staff member making the edit',
    example: 'edr_staff_001',
  })
  @IsString()
  @IsNotEmpty()
  edited_by: string;
}

// ── Controller ────────────────────────────────────────────────────────────────

/**
 * EDR Controller — EHB Department of Review
 *
 * Provides endpoints for EDR staff to:
 *   1. View the full cross-platform pending queue.
 *   2. Inspect any SQ request in detail (request + record + franchise context + history).
 *   3. Edit entity data on a review before deciding.
 *   4. Submit a final EDR decision.
 *   5. Override a previously decided request.
 *
 * Scope: EDR operates across ALL platforms — no default platform_id restriction.
 * Auth: All endpoints require the EHB admin key header.
 */
@ApiTags('EDR — EHB Department of Review')
@ApiSecurity('admin-key')
@ApiHeader({
  name: 'x-ehb-admin-key',
  description: 'EHB master admin key — required for all EDR endpoints',
  required: true,
})
@Controller('edr')
export class EdrController {
  private readonly logger = new Logger(EdrController.name);

  constructor(private readonly edrService: EdrService) {}

  // ── GET /edr/queue ────────────────────────────────────────────────────────

  @Get('queue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get EDR review queue — all platforms',
    description:
      'Returns all EDR reviews matching the given filters, sorted oldest-first (FIFO). ' +
      'EDR staff see ALL pending requests across ALL platforms by default. ' +
      'Optional platform_id filter narrows to a single platform. ' +
      'Optional status filter changes from "pending" to any EdrDecision state.',
  })
  @ApiQuery({
    name: 'platform_id',
    required: false,
    description: 'Filter by platform. Omit to see all platforms.',
    example: 'gosellr',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'approved', 'conditional', 'rejected'],
    description: 'Filter by decision status. Defaults to pending.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: HttpStatus.OK, description: 'Paginated EDR queue returned' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid admin key' })
  async getQueue(
    @Query('platform_id') platform_id?: string,
    @Query('status') status?: EdrDecision,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    this.logger.log(
      `EDR queue: platform=${platform_id ?? 'all'} status=${status ?? 'pending'} page=${page} limit=${limit}`,
    );
    return this.edrService.getQueue({ platform_id, decision: status, page, limit });
  }

  // ── GET /edr/queue/:platform_id ───────────────────────────────────────────

  @Get('queue/:platform_id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get EDR review queue filtered by platform',
    description:
      'Convenience endpoint — equivalent to GET /edr/queue?platform_id=:platform_id&status=pending. ' +
      'Returns pending EDR reviews for a specific platform only.',
  })
  @ApiParam({ name: 'platform_id', example: 'gosellr' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: HttpStatus.OK, description: 'Platform-filtered EDR queue returned' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid admin key' })
  async getQueueByPlatform(
    @Param('platform_id') platform_id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    this.logger.log(`EDR queue (platform): platform=${platform_id} page=${page}`);
    return this.edrService.getQueue({ platform_id, decision: 'pending', page, limit });
  }

  // ── GET /edr/review/:sq_request_id ───────────────────────────────────────

  @Get('review/:sq_request_id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get full detail view for a SQ request',
    description:
      'Returns the full EDR staff view for a single SQ request, including: ' +
      'sq_request (original submission), sq_record (current trust ledger state), ' +
      'franchise_review (if request was escalated from franchise), ' +
      'edr_reviews (all EDR review history for this request — including overrides), ' +
      'audit_trail (pending — populated once AuditModule is built).',
  })
  @ApiParam({
    name: 'sq_request_id',
    description: 'MongoDB ObjectId of the SqRequest',
    example: '665f1e2a4b3c2a1d0e9f8b7a',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Full detail view returned' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'SqRequest not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid admin key' })
  async getDetail(@Param('sq_request_id') sq_request_id: string) {
    this.logger.log(`EDR detail: sq_request=${sq_request_id}`);
    return this.edrService.getFullDetail(sq_request_id);
  }

  // ── PATCH /edr/review/:sq_request_id/edit ────────────────────────────────

  @Patch('review/:sq_request_id/edit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Edit entity data or notes on a pending EDR review',
    description:
      'EDR staff can edit entity_data before making a decision. ' +
      'Edited data is stored in edr_review.edited_entity_data — ' +
      'the original SqRequest.entity_data is preserved unchanged. ' +
      'Emits audit.write { action: "edr_edited_request" }. ' +
      'Only works on pending reviews — returns 404 if no pending review exists.',
  })
  @ApiParam({
    name: 'sq_request_id',
    description: 'MongoDB ObjectId of the SqRequest',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Review updated with edited data' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No pending EDR review for this sq_request_id',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid admin key' })
  async editReview(
    @Param('sq_request_id') sq_request_id: string,
    @Body() dto: EdrEditDto,
  ) {
    this.logger.log(`EDR edit: sq_request=${sq_request_id} by=${dto.edited_by}`);
    return this.edrService.editReviewEntityData(sq_request_id, {
      entity_data: dto.entity_data ?? null,
      notes: dto.notes ?? null,
      edited_by: dto.edited_by,
    });
  }

  // ── POST /edr/review/:sq_request_id/decide ────────────────────────────────

  @Post('review/:sq_request_id/decide')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit EDR final decision',
    description:
      'EDR staff submit their final decision on a pending review. ' +
      'approved / conditional → assigns SQ level, emits sq.decision(approved). ' +
      'rejected → rejects entity with reason, emits sq.decision(rejected). ' +
      'Rule: audit.write is emitted BEFORE the decision is finalized. ' +
      'Rule: sq_level_assigned required for approved/conditional. ' +
      'Rule: rejection_reason required for rejected. ' +
      'Returns 404 if no pending EDR review exists for this sq_request_id.',
  })
  @ApiParam({
    name: 'sq_request_id',
    description: 'MongoDB ObjectId of the SqRequest',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Decision submitted — updated EdrReview returned' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation error' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'No pending EDR review found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid admin key' })
  async submitDecision(
    @Param('sq_request_id') sq_request_id: string,
    @Body() dto: EdrDecideDto,
  ) {
    this.logger.log(
      `EDR decide: sq_request=${sq_request_id} decision=${dto.decision} by=${dto.reviewed_by}`,
    );
    return this.edrService.submitDecision(sq_request_id, {
      decision: dto.decision,
      sq_level_assigned: dto.sq_level_assigned ?? null,
      rejection_reason: dto.rejection_reason ?? null,
      reviewed_by: dto.reviewed_by,
      override_notes: dto.override_notes ?? null,
    });
  }

  // ── POST /edr/review/:sq_request_id/override ──────────────────────────────

  @Post('review/:sq_request_id/override')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Override a previously decided SQ request',
    description:
      'EDR re-opens a previously approved or rejected SQ request and applies a new decision. ' +
      'override_notes is REQUIRED — EDR must justify the override. ' +
      'Process: confirms sq_record exists → emits audit.write(edr_override) FIRST → ' +
      'resets sq_request to pending_edr → creates new EdrReview (source=override) → ' +
      'applies new decision → emits sq.decision. ' +
      'Returns 400 if no finalized sq_record exists (nothing to override). ' +
      'Returns 400 if override_notes is missing.',
  })
  @ApiParam({
    name: 'sq_request_id',
    description: 'MongoDB ObjectId of the SqRequest to override',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Override applied — new EdrReview returned' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'override_notes missing | no finalized record exists | validation error',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'SqRequest not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid admin key' })
  async submitOverride(
    @Param('sq_request_id') sq_request_id: string,
    @Body() dto: EdrOverrideDto,
  ) {
    this.logger.log(
      `EDR override: sq_request=${sq_request_id} new_decision=${dto.new_decision} by=${dto.reviewed_by}`,
    );
    return this.edrService.submitOverride(sq_request_id, {
      new_decision: dto.new_decision,
      sq_level_assigned: dto.sq_level_assigned ?? null,
      rejection_reason: dto.rejection_reason ?? null,
      reviewed_by: dto.reviewed_by,
      override_notes: dto.override_notes,
    });
  }
}
