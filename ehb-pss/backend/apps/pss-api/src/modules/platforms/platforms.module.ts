import { Module } from '@nestjs/common';

/**
 * Platforms Module
 *
 * Responsibility: Sub-company registration and management.
 * Handles: POST /platforms/register, platform API key issuance,
 * webhook URL storage, entity_type definitions per platform.
 *
 * Collections used: platforms
 *
 * API endpoints (from pss-api-contract.md):
 *   POST /api/platforms/register  — register a new sub-platform (admin only)
 *
 * Status: SCAFFOLD — logic to be implemented in Phase 1
 */
@Module({
  imports: [],
  controllers: [],
  providers: [],
  exports: [],
})
export class PlatformsModule {}
