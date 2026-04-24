import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
  ApiProperty,
  ApiPropertyOptional,
  ApiSecurity,
  ApiHeader,
} from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CriteriaService } from './criteria.service';
import { Criterion, CriterionCheckType } from './criteria-set.schema';
import { AdminKeyGuard } from '../auth/admin-key.guard';

// ── Local DTOs ────────────────────────────────────────────────────────────────

export class CriterionDto implements Criterion {
  @ApiProperty({ example: 'c1' })
  @IsString() @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 'Product Title' })
  @IsString() @IsNotEmpty()
  label: string;

  @ApiProperty({ example: 'title', description: 'Key in entity_data to evaluate' })
  @IsString() @IsNotEmpty()
  field_key: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  required: boolean;

  @ApiProperty({ enum: [1, 2, 3, 5, 7, 10], example: 1 })
  @IsNumber()
  sq_min: number;

  @ApiProperty({ enum: ['presence', 'min_length', 'min_value', 'regex'], example: 'presence' })
  @IsEnum(['presence', 'min_length', 'min_value', 'regex'])
  check_type: CriterionCheckType;

  @ApiPropertyOptional({ example: 3, nullable: true })
  @IsOptional()
  check_value: string | number | null;
}

export class CreateCriteriaSetDto {
  @ApiProperty({ example: 'gosellr' })
  @IsString() @IsNotEmpty()
  platform_id: string;

  @ApiProperty({ example: 'product' })
  @IsString() @IsNotEmpty()
  entity_type: string;

  @ApiProperty({ type: [CriterionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriterionDto)
  criteria: CriterionDto[];
}

export class UpdateCriteriaSetDto {
  @ApiPropertyOptional({ type: [CriterionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriterionDto)
  criteria?: CriterionDto[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ example: 'seller_profile' })
  @IsOptional()
  @IsString()
  entity_type?: string;
}

// ── Controller ────────────────────────────────────────────────────────────────

/**
 * Criteria Controller
 *
 * GET /criteria/:platform_id     — PUBLIC (no guard) — FE reads this to show criteria UI
 * POST /criteria                 — ADMIN ONLY
 * PATCH /criteria/:id            — ADMIN ONLY
 * DELETE /criteria/:id           — ADMIN ONLY (soft-delete: sets active=false)
 */
@ApiTags('Criteria')
@Controller('criteria')
export class CriteriaController {
  private readonly logger = new Logger(CriteriaController.name);

  constructor(private readonly criteriaService: CriteriaService) {}

  // ── GET /criteria/:platform_id  (PUBLIC) ──────────────────────────────────

  @Get(':platform_id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get active criteria set(s) for a platform',
    description:
      'Public endpoint — no auth required. ' +
      'Returns the active criteria set(s) for the given platform. ' +
      'Optionally filtered by entity_type.',
  })
  @ApiParam({ name: 'platform_id', example: 'gosellr' })
  @ApiQuery({
    name: 'entity_type',
    required: false,
    description: 'Filter to a specific entity type. Omit for all.',
    example: 'product',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Criteria set(s) returned' })
  async getCriteriaSets(
    @Param('platform_id') platform_id: string,
    @Query('entity_type') entity_type?: string,
  ) {
    this.logger.log(`Get criteria: platform=${platform_id} entity_type=${entity_type ?? 'all'}`);
    return this.criteriaService.getCriteriaSetsForPlatform(platform_id, entity_type);
  }

  // ── POST /criteria  (ADMIN) ───────────────────────────────────────────────

  @Post()
  @UseGuards(AdminKeyGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiSecurity('admin-key')
  @ApiHeader({ name: 'x-ehb-admin-key', required: true })
  @ApiOperation({
    summary: 'Create a new criteria set',
    description:
      'Creates a new criteria set for a platform + entity_type combination. ' +
      'Returns 409 if one already exists — use PATCH to update.',
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Criteria set created' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Criteria set already exists' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid admin key' })
  async createCriteriaSet(@Body() dto: CreateCriteriaSetDto) {
    this.logger.log(
      `Create criteria: platform=${dto.platform_id} entity_type=${dto.entity_type} ` +
      `criteria_count=${dto.criteria.length}`,
    );
    return this.criteriaService.createCriteriaSet(
      dto.platform_id,
      dto.entity_type,
      dto.criteria,
    );
  }

  // ── PATCH /criteria/:criteria_set_id  (ADMIN) ─────────────────────────────

  @Patch(':criteria_set_id')
  @UseGuards(AdminKeyGuard)
  @HttpCode(HttpStatus.OK)
  @ApiSecurity('admin-key')
  @ApiHeader({ name: 'x-ehb-admin-key', required: true })
  @ApiOperation({
    summary: 'Update a criteria set',
    description:
      'Partial update — only supplied fields are changed. ' +
      'Set active=true to reactivate a soft-deleted set.',
  })
  @ApiParam({ name: 'criteria_set_id', description: 'MongoDB ObjectId of the CriteriaSet' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Criteria set updated' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Criteria set not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid admin key' })
  async updateCriteriaSet(
    @Param('criteria_set_id') criteria_set_id: string,
    @Body() dto: UpdateCriteriaSetDto,
  ) {
    this.logger.log(`Update criteria: id=${criteria_set_id}`);
    return this.criteriaService.updateCriteriaSet(criteria_set_id, dto);
  }

  // ── DELETE /criteria/:criteria_set_id  (ADMIN) ────────────────────────────

  @Delete(':criteria_set_id')
  @UseGuards(AdminKeyGuard)
  @HttpCode(HttpStatus.OK)
  @ApiSecurity('admin-key')
  @ApiHeader({ name: 'x-ehb-admin-key', required: true })
  @ApiOperation({
    summary: 'Soft-delete a criteria set',
    description:
      'Sets active=false. sq-engine will ignore this criteria set on future submissions. ' +
      'Hard delete is not supported — audit trail integrity requires the schema to remain.',
  })
  @ApiParam({ name: 'criteria_set_id', description: 'MongoDB ObjectId of the CriteriaSet' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Criteria set deactivated' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Criteria set not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid admin key' })
  async deleteCriteriaSet(@Param('criteria_set_id') criteria_set_id: string) {
    this.logger.log(`Delete criteria: id=${criteria_set_id}`);
    return this.criteriaService.deleteCriteriaSet(criteria_set_id);
  }
}
