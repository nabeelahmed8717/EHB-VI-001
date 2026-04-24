import {
  Controller,
  DefaultValuePipe,
  Get,
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
  ApiSecurity,
  ApiHeader,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';

/**
 * Audit Controller
 *
 * Read-only endpoints for querying the PSS audit trail.
 * No write endpoints — audit_logs are immutable; writes happen via events only.
 *
 * All list endpoints are paginated:
 *   default limit: 50 | max limit: 200
 *
 * Auth: All endpoints require the EHB admin key header.
 * Platforms can only access their own audit data (enforced at query layer).
 * EHB admins use /audit/search for cross-platform access.
 */
@ApiTags('Audit — Immutable Audit Trail')
@ApiSecurity('admin-key')
@ApiHeader({
  name: 'x-ehb-admin-key',
  description: 'EHB master admin key — required for all audit endpoints',
  required: true,
})
@Controller('audit')
export class AuditController {
  private readonly logger = new Logger(AuditController.name);

  constructor(private readonly auditService: AuditService) {}

  // ── GET /audit/request/:sq_request_id ────────────────────────────────────

  @Get('request/:sq_request_id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Full audit trail for one SQ request',
    description:
      'Returns ALL audit log entries for a single SQ request, ordered ' +
      'chronologically (oldest-first) so the reviewer can reconstruct ' +
      'the exact decision timeline. No pagination — a single request\'s trail ' +
      'is bounded in size.',
  })
  @ApiParam({
    name: 'sq_request_id',
    description: 'MongoDB ObjectId of the SqRequest',
    example: '665f1e2a4b3c2a1d0e9f8b7a',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Audit trail returned (array, sorted ASC)' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid admin key' })
  async getForRequest(@Param('sq_request_id') sq_request_id: string) {
    this.logger.log(`Audit by request: sq_request=${sq_request_id}`);
    return this.auditService.getLogsForRequest(sq_request_id);
  }

  // ── GET /audit/entity/:entity_id ─────────────────────────────────────────

  @Get('entity/:entity_id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'All audit logs for one entity',
    description:
      'Returns all audit log entries for a given entity across its entire SQ request history. ' +
      'Use platform_id to narrow to a single platform. ' +
      'Sorted most-recent-first.',
  })
  @ApiParam({ name: 'entity_id', example: 'prod_abc123' })
  @ApiQuery({
    name: 'platform_id',
    required: false,
    description: 'Filter to a single platform. Omit for all platforms.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Max 200. Default 50.', example: 50 })
  @ApiResponse({ status: HttpStatus.OK, description: 'Paginated entity audit logs returned' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid admin key' })
  async getForEntity(
    @Param('entity_id') entity_id: string,
    @Query('platform_id') platform_id?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit = 50,
  ) {
    this.logger.log(`Audit by entity: entity=${entity_id} platform=${platform_id ?? 'all'}`);
    return this.auditService.getLogsForEntity(entity_id, {
      platform_id,
      page,
      limit: this.auditService.clampLimit(limit),
    });
  }

  // ── GET /audit/user/:user_id ──────────────────────────────────────────────

  @Get('user/:user_id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'All audit activity for a user',
    description:
      'Returns all audit logs for actions that affected any entity owned by the given user. ' +
      'Use platform_id to narrow to a single platform. ' +
      'Sorted most-recent-first.',
  })
  @ApiParam({ name: 'user_id', example: 'usr_456' })
  @ApiQuery({
    name: 'platform_id',
    required: false,
    description: 'Filter to a single platform. Omit for all platforms.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Max 200. Default 50.', example: 50 })
  @ApiResponse({ status: HttpStatus.OK, description: 'Paginated user audit logs returned' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid admin key' })
  async getForUser(
    @Param('user_id') user_id: string,
    @Query('platform_id') platform_id?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit = 50,
  ) {
    this.logger.log(`Audit by user: user=${user_id} platform=${platform_id ?? 'all'}`);
    return this.auditService.getLogsForUser(user_id, {
      platform_id,
      page,
      limit: this.auditService.clampLimit(limit),
    });
  }

  // ── GET /audit/platform/:platform_id ─────────────────────────────────────

  @Get('platform/:platform_id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'All audit logs for a platform',
    description:
      'Returns all audit log entries for the given platform. ' +
      'Platform admins use this for their own dashboard. ' +
      'Supports filtering by action type and date range.',
  })
  @ApiParam({ name: 'platform_id', example: 'gosellr' })
  @ApiQuery({
    name: 'action',
    required: false,
    description: 'Filter by action string (e.g. "sq_auto_approved", "sq_rule_rejected")',
    example: 'sq_auto_approved',
  })
  @ApiQuery({
    name: 'from_date',
    required: false,
    description: 'ISO 8601 date — include logs on or after this date',
    example: '2024-01-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'to_date',
    required: false,
    description: 'ISO 8601 date — include logs on or before this date',
    example: '2024-12-31T23:59:59Z',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Max 200. Default 50.', example: 50 })
  @ApiResponse({ status: HttpStatus.OK, description: 'Paginated platform audit logs returned' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid admin key' })
  async getForPlatform(
    @Param('platform_id') platform_id: string,
    @Query('action') action?: string,
    @Query('from_date') from_date?: string,
    @Query('to_date') to_date?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit = 50,
  ) {
    this.logger.log(
      `Audit by platform: platform=${platform_id} action=${action ?? 'any'} page=${page}`,
    );
    return this.auditService.getLogsForPlatform(platform_id, {
      action,
      from_date: from_date ? new Date(from_date) : undefined,
      to_date: to_date ? new Date(to_date) : undefined,
      page,
      limit: this.auditService.clampLimit(limit),
    });
  }

  // ── GET /audit/search ─────────────────────────────────────────────────────

  @Get('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cross-platform audit search',
    description:
      'EHB admin search across all platforms and all entities. ' +
      'All filter params are optional — omitting all returns the most recent logs globally. ' +
      'Sorted most-recent-first. Useful for investigating specific actions, ' +
      'staff decisions, or suspicious patterns across platforms.',
  })
  @ApiQuery({
    name: 'action',
    required: false,
    description: 'Filter by action string',
    example: 'edr_override',
  })
  @ApiQuery({
    name: 'performed_by',
    required: false,
    description: 'Filter by who performed the action ("system", franchise_id, edr_staff_id)',
    example: 'edr_staff_001',
  })
  @ApiQuery({
    name: 'platform_id',
    required: false,
    description: 'Filter to a single platform. Omit for all platforms.',
    example: 'gosellr',
  })
  @ApiQuery({
    name: 'from_date',
    required: false,
    description: 'ISO 8601 date — include logs on or after this date',
  })
  @ApiQuery({
    name: 'to_date',
    required: false,
    description: 'ISO 8601 date — include logs on or before this date',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Max 200. Default 50.', example: 50 })
  @ApiResponse({ status: HttpStatus.OK, description: 'Paginated search results returned' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid admin key' })
  async search(
    @Query('action') action?: string,
    @Query('performed_by') performed_by?: string,
    @Query('platform_id') platform_id?: string,
    @Query('from_date') from_date?: string,
    @Query('to_date') to_date?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit = 50,
  ) {
    this.logger.log(
      `Audit search: action=${action ?? 'any'} by=${performed_by ?? 'any'} platform=${platform_id ?? 'all'}`,
    );
    return this.auditService.search({
      action,
      performed_by,
      platform_id,
      from_date: from_date ? new Date(from_date) : undefined,
      to_date: to_date ? new Date(to_date) : undefined,
      page,
      limit: this.auditService.clampLimit(limit),
    });
  }
}
