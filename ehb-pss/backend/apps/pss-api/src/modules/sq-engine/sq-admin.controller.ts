import {
  Controller,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
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
import { SqEngineService } from './sq-engine.service';
import { AdminKeyGuard } from '../auth/admin-key.guard';

/**
 * SQ Admin Controller
 *
 * Admin-only endpoints for the PSS dashboard.
 * Protected by AdminKeyGuard (x-ehb-admin-key header).
 * Kept separate from SqEngineController so that the class-level
 * PlatformKeyGuard on that controller does NOT interfere here.
 */
@ApiTags('SQ Admin')
@ApiSecurity('admin-key')
@ApiHeader({
  name: 'x-ehb-admin-key',
  description: 'PSS admin API key',
  required: true,
})
@UseGuards(AdminKeyGuard)
@Controller('sq')
export class SqAdminController {
  constructor(private readonly sqEngineService: SqEngineService) {}

  // ── GET /sq/requests  ─────────────────────────────────────────────────────

  /**
   * List all SQ requests — PSS admin dashboard.
   * Supports optional filtering by status and platform_id, with pagination.
   */
  @Get('requests')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List all SQ requests (admin)',
    description:
      'Returns a paginated list of SQ requests. ' +
      'Optionally filter by status and/or platform_id. ' +
      'Requires x-ehb-admin-key header.',
  })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by SQ status', example: 'pending' })
  @ApiQuery({ name: 'platform_id', required: false, description: 'Filter by platform', example: 'gosellr' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default 20)', example: 20 })
  @ApiResponse({ status: HttpStatus.OK, description: 'Paginated SQ requests list' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid or missing admin key' })
  async listRequests(
    @Query('status') status?: string,
    @Query('platform_id') platform_id?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.sqEngineService.listRequests({
      status,
      platform_id,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  // ── GET /sq/requests/:sq_request_id  ──────────────────────────────────────

  /**
   * Get full detail for a single SQ request — PSS admin dashboard.
   */
  @Get('requests/:sq_request_id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get SQ request detail (admin)',
    description:
      'Returns full detail for a single SQ request by its MongoDB ObjectId. ' +
      'Requires x-ehb-admin-key header.',
  })
  @ApiParam({
    name: 'sq_request_id',
    description: 'MongoDB ObjectId of the SQ request',
    example: '64f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'SQ request details' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'SQ request not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid or missing admin key' })
  async getRequestDetail(
    @Param('sq_request_id') sq_request_id: string,
  ) {
    return this.sqEngineService.getRequestDetail(sq_request_id);
  }
}
