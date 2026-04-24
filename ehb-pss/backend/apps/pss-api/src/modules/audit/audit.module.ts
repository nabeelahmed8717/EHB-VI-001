import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditLog, AuditLogSchema } from './audit-log.schema';

/**
 * Audit Module
 *
 * Responsibility: Persist and query the PSS-wide immutable audit trail.
 *
 * MongoDB collection: audit_logs
 *
 * Event consumed:
 *   audit.write  ← emitted by every module (sq-engine, rule-engine,
 *                  franchise, edr) on every significant state change.
 *                  AuditService subscribes globally and persists each event.
 *
 * Events emitted: NONE — audit module never emits events.
 *
 * Dependencies: NONE — audit module never calls another module's service.
 *   It only writes to its own collection and reads from it.
 *
 * Exports AuditService so EdrModule (and any future consumers) can call
 * AuditService.getLogsForRequest(sq_request_id) directly.
 *
 * Architecture rules (architecture.md Rule 4 + Rule 8):
 *   "Audit every SQ decision" — no silent decisions, no silent rejections.
 *   Audit records are IMMUTABLE — no update or delete endpoints.
 *   writeLog failures are caught and logged but NEVER thrown.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
