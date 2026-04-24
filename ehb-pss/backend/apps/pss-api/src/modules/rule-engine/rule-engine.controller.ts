import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { RuleEngineService } from './rule-engine.service';
import { RuleAction, RuleOperator } from './platform-rule.schema';
import { AdminKeyGuard } from '../auth/admin-key.guard';

// ── Local DTOs ───────────────────────────────────────────────────────────────
// These are rule-engine-specific and not shared with other platforms,
// so they live here rather than in libs/pss-dtos.

export class CreatePlatformRuleDto {
  @ApiProperty({ description: 'Platform this rule applies to', example: 'gosellr' })
  @IsString()
  @IsNotEmpty()
  platform_id: string;

  @ApiProperty({ description: 'Human-readable name for admin UI', example: 'Auto-approve high scorers' })
  @IsString()
  @IsNotEmpty()
  rule_name: string;

  @ApiProperty({
    description:
      'Criteria count threshold to compare against criteria_met from sq-engine. ' +
      'Note: this is a raw COUNT (e.g. 4), not a percentage.',
    example: 4,
  })
  @IsNumber()
  @Min(0)
  criteria_threshold: number;

  @ApiProperty({
    enum: ['gte', 'lte', 'eq', 'between'],
    description: 'Comparison operator for threshold matching',
    example: 'gte',
  })
  @IsEnum(['gte', 'lte', 'eq', 'between'])
  operator: RuleOperator;

  @ApiPropertyOptional({
    description: 'Upper bound when operator=between. Required if operator=between.',
    example: 7,
  })
  @ValidateIf((o: CreatePlatformRuleDto) => o.operator === 'between')
  @IsNumber()
  @Min(0)
  threshold_max?: number;

  @ApiProperty({
    enum: ['auto_approve', 'franchise', 'edr', 'reject'],
    description: 'Routing action to execute when rule matches',
    example: 'auto_approve',
  })
  @IsEnum(['auto_approve', 'franchise', 'edr', 'reject'])
  action: RuleAction;

  @ApiPropertyOptional({
    enum: [1, 2, 3, 5, 7, 10],
    description:
      'SQ level to assign when action=auto_approve. ' +
      'Omit to let sq_level_calculated from scoring be used.',
    example: 5,
  })
  @ValidateIf((o: CreatePlatformRuleDto) => o.action === 'auto_approve')
  @IsOptional()
  @IsNumber()
  sq_level_assigned?: number;

  @ApiPropertyOptional({
    description: 'Rejection message logged in audit_logs. Required when action=reject.',
    example: 'Insufficient criteria met for any SQ level',
  })
  @ValidateIf((o: CreatePlatformRuleDto) => o.action === 'reject')
  @IsString()
  @IsNotEmpty()
  rejection_reason?: string;

  @ApiProperty({
    description: 'Priority order — lower number = evaluated first. Ties broken by created_at.',
    example: 10,
  })
  @IsNumber()
  @Min(1)
  priority: number;

  @ApiPropertyOptional({ description: 'Whether this rule is active. Defaults to true.', example: true })
  @IsOptional()
  active?: boolean;
}

export class UpdatePlatformRuleDto extends PartialType(CreatePlatformRuleDto) {}

// ── Controller ────────────────────────────────────────────────────────────────

/**
 * Rule Engine Controller — Admin CRUD for platform routing rules.
 *
 * These endpoints are called by PSS admins to configure how entities
 * are routed after scoring: auto-approve, franchise, EDR, or reject.
 * Each platform configures its own rules — no global rules.
 * Protected by AdminKeyGuard (x-ehb-admin-key header).
 */
@ApiTags('Rule Engine — Admin')
@ApiSecurity('admin-key')
@ApiHeader({
  name: 'x-ehb-admin-key',
  description: 'EHB master admin key — required for all rule management endpoints',
  required: true,
})
@UseGuards(AdminKeyGuard)
@Controller('rule-engine/rules')
export class RuleEngineController {
  private readonly logger = new Logger(RuleEngineController.name);

  constructor(private readonly ruleEngineService: RuleEngineService) {}

  // ── GET /rules/:platform_id ──────────────────────────────────────────────

  @Get(':platform_id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List all rules for a platform',
    description:
      'Returns all routing rules (active and inactive) for the specified platform, ' +
      'sorted by priority ascending. Use this to audit or manage a platform\'s rule set.',
  })
  @ApiParam({ name: 'platform_id', example: 'gosellr' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rules returned' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid admin key' })
  async getRulesForPlatform(@Param('platform_id') platform_id: string) {
    this.logger.log(`List rules: platform=${platform_id}`);
    return this.ruleEngineService.getRulesForPlatform(platform_id);
  }

  // ── POST /rules ──────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new routing rule',
    description:
      'Adds a new rule to a platform\'s routing configuration. ' +
      'Rules are evaluated in ascending priority order — lower priority number = first. ' +
      'Ensure rule ranges are non-overlapping to avoid ambiguous routing.',
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Rule created' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation error' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid admin key' })
  async createRule(@Body() dto: CreatePlatformRuleDto) {
    this.logger.log(
      `Create rule: platform=${dto.platform_id} action=${dto.action} priority=${dto.priority}`,
    );
    return this.ruleEngineService.createRule({
      ...dto,
      active: dto.active ?? true,
      sq_level_assigned: dto.sq_level_assigned ?? null,
      rejection_reason: dto.rejection_reason ?? null,
      threshold_max: dto.threshold_max ?? null,
    });
  }

  // ── PATCH /rules/:rule_id ────────────────────────────────────────────────

  @Patch(':rule_id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update an existing rule',
    description:
      'Partial update — only provided fields are changed. ' +
      'Changing priority or threshold on a live rule takes effect immediately ' +
      'on the next sq.scored event.',
  })
  @ApiParam({ name: 'rule_id', description: 'MongoDB ObjectId of the rule' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rule updated' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Rule not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation error' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid admin key' })
  async updateRule(
    @Param('rule_id') rule_id: string,
    @Body() dto: UpdatePlatformRuleDto,
  ) {
    this.logger.log(`Update rule: rule_id=${rule_id}`);
    const updated = await this.ruleEngineService.updateRule(rule_id, dto);
    if (!updated) {
      throw new NotFoundException(`Rule with id="${rule_id}" not found`);
    }
    return updated;
  }

  // ── DELETE /rules/:rule_id ───────────────────────────────────────────────

  @Delete(':rule_id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a rule',
    description:
      'Permanently removes a rule. In-flight requests already forwarded by this ' +
      'rule are unaffected — only future evaluations change.',
  })
  @ApiParam({ name: 'rule_id', description: 'MongoDB ObjectId of the rule' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Rule deleted' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Rule not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid admin key' })
  async deleteRule(@Param('rule_id') rule_id: string): Promise<void> {
    this.logger.log(`Delete rule: rule_id=${rule_id}`);
    const deleted = await this.ruleEngineService.deleteRule(rule_id);
    if (!deleted) {
      throw new NotFoundException(`Rule with id="${rule_id}" not found`);
    }
  }

  // ── PATCH /rules/:rule_id/toggle ─────────────────────────────────────────

  @Patch(':rule_id/toggle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Toggle a rule active/inactive',
    description:
      'Inactive rules are skipped during evaluation. ' +
      'Use this to temporarily suspend a rule without deleting it. ' +
      'Returns the updated rule with its new active state.',
  })
  @ApiParam({ name: 'rule_id', description: 'MongoDB ObjectId of the rule' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rule toggled — returns new state' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Rule not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid admin key' })
  async toggleRule(@Param('rule_id') rule_id: string) {
    this.logger.log(`Toggle rule: rule_id=${rule_id}`);
    const toggled = await this.ruleEngineService.toggleRule(rule_id);
    if (!toggled) {
      throw new NotFoundException(`Rule with id="${rule_id}" not found`);
    }
    return toggled;
  }
}
