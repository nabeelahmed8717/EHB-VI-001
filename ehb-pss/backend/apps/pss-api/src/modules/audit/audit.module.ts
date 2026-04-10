import { Module } from '@nestjs/common';

/**
 * Audit Module
 *
 * Responsibility: Full audit trail for ALL SQ decisions across all platforms.
 * Every approve / reject / conditional result writes a record here.
 * No silent rejections — every decision has a logged reason.
 *
 * Collections used: audit_logs
 *
 * Rules (from architecture.md):
 *   - Every SQ decision writes to audit_logs (Rule 8 — non-negotiable)
 *   - No silent auto-rejections — every rejection has a logged reason
 *
 * Status: SCAFFOLD — logic to be implemented in Phase 1
 */
@Module({
  imports: [],
  controllers: [],
  providers: [],
  exports: [],
})
export class AuditModule {}
