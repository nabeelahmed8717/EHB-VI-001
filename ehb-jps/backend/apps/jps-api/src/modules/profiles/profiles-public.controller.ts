import {
  Controller, Get, Param, Query, UseGuards, BadRequestException,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiHeader, ApiResponse, ApiQuery,
} from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { ServiceKeyGuard } from './service-key.guard';
import { JpsProfilePublicDto } from './profile-public.dto';

/**
 * Service-to-service read endpoints for JPS profiles.
 *
 * Used by other EHB platforms (e.g. GoSellr) to:
 *   1. render an "owner" card next to a product or listing (public DTO), or
 *   2. resolve which JPS profile belongs to a given user via their email
 *      (used by the GoSellr attach flow, since the two services don't share
 *      a JWT secret and therefore can't authenticate each other's bearers).
 *
 * Auth: x-service-key header (shared secret in JPS_SERVICE_KEY env var).
 *       Validated by ServiceKeyGuard.
 */
@ApiTags('Profiles (Public / Service-to-Service)')
@Controller('profiles')
@UseGuards(ServiceKeyGuard)
export class ProfilesPublicController {
  constructor(private readonly profilesService: ProfilesService) {}

  // ── Buyer-safe public view (no CNIC, no full address) ──────────────────────
  @Get(':id/public')
  @ApiOperation({
    summary: 'Get a buyer-safe view of a profile (service-to-service)',
    description:
      'Returns only fields safe to display to third-party platforms and ' +
      'buyers: display_name, bio, role, SQ level, verification status. ' +
      'Excludes CNIC images, full address, PSS internal IDs.',
  })
  @ApiHeader({ name: 'x-service-key', required: true })
  @ApiHeader({ name: 'x-service-id', required: false })
  @ApiResponse({ status: 200, type: JpsProfilePublicDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid service key' })
  @ApiResponse({ status: 404, description: 'Profile not found or deleted' })
  findPublic(@Param('id') id: string): Promise<JpsProfilePublicDto> {
    return this.profilesService.findPublic(id);
  }

  // ── Owner lookup by email (full profile, internals stripped) ───────────────
  @Get('by-email/lookup')
  @ApiOperation({
    summary: 'Lookup the profiles owned by a user identified by email',
    description:
      'Returns full profile records (minus user_id/deleted_at/pss_request_id) ' +
      'for every profile owned by the JPS user with the given email, optionally ' +
      'filtered by platform and role. Returns an empty array if no JPS user ' +
      'exists for that email (e.g. they have not signed in to JPS yet).',
  })
  @ApiHeader({ name: 'x-service-key', required: true })
  @ApiHeader({ name: 'x-service-id', required: false })
  @ApiQuery({ name: 'email', required: true, example: 'sara@gosellr.test' })
  @ApiQuery({ name: 'platform', required: false, example: 'gosellr' })
  @ApiQuery({ name: 'role', required: false, example: 'seller' })
  async findEligible(
    @Query('email') email: string,
    @Query('platform') platform?: string,
    @Query('role') role?: string,
  ) {
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw new BadRequestException('email query param is required');
    }
    return this.profilesService.findEligibleByEmail(email, platform, role);
  }

  @Get(':id/owned-by')
  @ApiOperation({
    summary: 'Fetch a single profile if and only if it is owned by the given email',
    description:
      'Used by the GoSellr attach-existing flow: after the user picks a profile ' +
      'in the picker, GoSellr re-validates ownership server-side via this endpoint ' +
      'before writing the link.',
  })
  @ApiHeader({ name: 'x-service-key', required: true })
  @ApiHeader({ name: 'x-service-id', required: false })
  @ApiQuery({ name: 'email', required: true })
  async findOwnedBy(
    @Param('id') id: string,
    @Query('email') email: string,
  ) {
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw new BadRequestException('email query param is required');
    }
    return this.profilesService.findOwnedByEmail(id, email);
  }
}
