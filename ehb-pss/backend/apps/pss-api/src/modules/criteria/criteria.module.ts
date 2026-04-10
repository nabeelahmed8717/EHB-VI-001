import { Module } from '@nestjs/common';

/**
 * Criteria Module
 *
 * Responsibility: Per-platform criteria set management.
 * Each platform has its own set of criteria that entities must satisfy
 * for each SQ level. Admins configure these criteria per platform.
 *
 * Collections used: criteria_sets
 *
 * API endpoints (from pss-api-contract.md):
 *   GET /api/criteria/:platform_id — return criteria for a platform (public)
 *
 * Status: SCAFFOLD — logic to be implemented in Phase 1
 */
@Module({
  imports: [],
  controllers: [],
  providers: [],
  exports: [],
})
export class CriteriaModule {}
