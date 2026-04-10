import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  NotFoundException,
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
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { FranchiseService } from './franchise.service';
import { FranchiseDecision } from './franchise-review.schema';

// ── Local DTOs ────────────────────────────────────────────────────────────────

export class SubmitFranchiseDecisionDto {
  @ApiProperty({
    enum: ['approve', 'reject', 'escalate'],
    description:
      'approve → assign SQ level and close. ' +
      'reject → reject entity with reason. ' +
      'escalate → forward to EDR for oversight review.',
    example: 'approve',
  })
  @IsEnum(['approve', 'reject', 'escalate'])
  decision: FranchiseDecision;

  @ApiPropertyOptional({
    description:
      'SQ level to assign when decision=approve. ' +
      'Omit to use sq_level_calculated from scoring.',
    enum: [1, 2, 3, 5, 7, 10],
    example: 5,
    nullable: true,
  })
  @ValidateIf((o: SubmitFranchiseDecisionDto) => o.decision === 'approve')
  @IsOptional()
  @IsNumber()
  sq_level_assigned?: number | null;

  @ApiPropertyOptional({
    description: 'Required when decision=reject. Logged in audit and returned to platform webhook.',
    example: 'Physical inspection failed — product does not match listing',
    nullable: true,
  })
  @ValidateIf((o: SubmitFranchiseDecisionDto) => o.decision === 'reject')
  @IsString()
  @IsNotEmpty()
  rejection_reason?: string | null;

  @ApiPropertyOptional({
    description: 'Internal reviewer notes (not forwarded to platform webhook)',
    example: 'Item photos taken on site — see attachment',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  reviewer_notes?: string | null;

  @ApiProperty({
    description: 'ID of the franchise staff member submitting this decision',
    example: 'franchise_staff_007',
  })
  @IsString()
  @IsNotEmpty()
  reviewed_by: string;
}

export class UpdateFranchiseDto {
  @ApiPropertyOptional({ description: 'Display name for the franchise office', example: 'Gosellr Lahore Office' })
  @IsOptional()
  @IsString()
  franchise_name?: string | null;

  @ApiPropertyOptional({ description: 'Contact email address', example: 'lahore@franchise.com' })
  @IsOptional()
  @IsString()
  contact_email?: string | null;

  @ApiPropertyOptional({ description: 'Contact phone number', example: '+92-300-1234567' })
  @IsOptional()
  @IsString()
  contact_phone?: string | null;

  @ApiPropertyOptional({ description: 'Set false to deactivate franchise — no new reviews will be assigned to it', example: true })
  @IsOptional()
  active?: boolean;
}

// ── Controller ────────────────────────────────────────────────────────────────

/**
 * Franchise Controller — Franchise staff endpoints.
 *
 * Franchise staff use these endpoints to:
 *   1. View their assigned review queue.
 *   2. Inspect a specific review's entity details and scoring context.
 *   3. Submit an approve / reject / escalate decision.
 *   4. Admins can list/update franchise offices.
 *
 * Auth: All endpoints require the EHB admin key header.
 * (Platform-level auth guard to be added when auth module is built.)
 *
 * NOTE: Franchise records are auto-created — there is no POST /franchises endpoint.
 * Franchises are created by FranchiseService when handling franchise.review_requested.
 */
@ApiTags('Franchise — Staff & Admin')
@ApiSecurity('admin-key')
@ApiHeader({
  name: 'x-ehb-admin-key',
  description: 'EHB master admin key — required for all franchise endpoints',
  required: true,
})
@Controller('franchise')
export class FranchiseController {
  private readonly logger = new Logger(FranchiseController.name);

  constructor(private readonly franchiseService: FranchiseService) {}

  // ── GET /franchise/:platform_id ───────────────────────────────────────────

  @Get(':platform_id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List all franchises for a platform',
    description:
      'Returns all franchise offices registered for the given platform, ' +
      'sorted by area alphabetically. Includes active/inactive and pending_review_count ' +
      'so admins can monitor franchise load.',
  })
  @ApiParam({ name: 'platform_id', example: 'gosellr' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Franchises returned' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid admin key' })
  async getFranchises(@Param('platform_id') platform_id: string) {
    this.logger.log(`List franchises: platform=${platform_id}`);
    return this.franchiseService.getFranchisesForPlatform(platform_id);
  }

  // ── PATCH /franchise/:franchise_id ────────────────────────────────────────

  @Patch(':franchise_id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update franchise contact info or active state',
    description:
      'Partial update — only supplied fields are changed. ' +
      'Set active=false to deactivate a franchise; future routing will skip it and fall back to EDR.',
  })
  @ApiParam({ name: 'franchise_id', description: 'MongoDB ObjectId of the franchise' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Franchise updated' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Franchise not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid admin key' })
  async updateFranchise(
    @Param('franchise_id') franchise_id: string,
    @Body() dto: UpdateFranchiseDto,
  ) {
    this.logger.log(`Update franchise: franchise_id=${franchise_id}`);
    const updated = await this.franchiseService.updateFranchise(franchise_id, dto);
    if (!updated) {
      throw new NotFoundException(`Franchise with id="${franchise_id}" not found`);
    }
    return updated;
  }

  // ── GET /franchise/:franchise_id/queue ────────────────────────────────────

  @Get(':franchise_id/queue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get pending review queue for a franchise',
    description:
      'Returns all FranchiseReview records with status=pending for the given franchise, ' +
      'sorted by created_at ascending (oldest first). ' +
      'Franchise staff use this as their work queue.',
  })
  @ApiParam({ name: 'franchise_id', description: 'MongoDB ObjectId of the franchise' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Pending reviews returned' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid admin key' })
  async getPendingQueue(@Param('franchise_id') franchise_id: string) {
    this.logger.log(`Pending queue: franchise_id=${franchise_id}`);
    return this.franchiseService.getPendingReviews(franchise_id);
  }

  // ── GET /franchise/review/:review_id ─────────────────────────────────────

  @Get('review/:review_id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a specific franchise review record',
    description:
      'Returns the full FranchiseReview document including entity context, ' +
      'scoring data (criteria_met, sq_level_calculated), and current decision state. ' +
      'Franchise staff use this to inspect details before submitting a decision.',
  })
  @ApiParam({ name: 'review_id', description: 'MongoDB ObjectId of the FranchiseReview' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Review returned' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Review not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid admin key' })
  async getReview(@Param('review_id') review_id: string) {
    this.logger.log(`Get review: review_id=${review_id}`);
    const review = await this.franchiseService.getReviewById(review_id);
    if (!review) {
      throw new NotFoundException(`FranchiseReview with id="${review_id}" not found`);
    }
    return review;
  }

  // ── POST /franchise/review/:review_id/decide ─────────────────────────────

  @Post('review/:review_id/decide')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit a franchise decision',
    description:
      'Franchise staff submit their decision on a pending review. ' +
      'approve → assigns SQ level, emits sq.decision(approved) to webhook. ' +
      'reject → rejects entity, emits sq.decision(rejected) to webhook. ' +
      'escalate → forwards to EDR, emits edr.review_requested. ' +
      'Exactly one decision per review — re-submitting on a decided/escalated review returns 400.',
  })
  @ApiParam({ name: 'review_id', description: 'MongoDB ObjectId of the FranchiseReview' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Decision submitted — returns updated FranchiseReview' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation error or review already decided' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Review not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid admin key' })
  async submitDecision(
    @Param('review_id') review_id: string,
    @Body() dto: SubmitFranchiseDecisionDto,
  ) {
    this.logger.log(
      `Franchise decision: review_id=${review_id} decision=${dto.decision} by=${dto.reviewed_by}`,
    );
    return this.franchiseService.submitDecision(review_id, {
      decision: dto.decision,
      sq_level_assigned: dto.sq_level_assigned ?? null,
      rejection_reason: dto.rejection_reason ?? null,
      reviewer_notes: dto.reviewer_notes ?? null,
      reviewed_by: dto.reviewed_by,
    });
  }
}
