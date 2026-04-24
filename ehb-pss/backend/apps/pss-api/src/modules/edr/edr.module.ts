import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EdrController } from './edr.controller';
import { EdrService } from './edr.service';
import { EdrReview, EdrReviewSchema } from './edr-review.schema';
import { SqEngineModule } from '../sq-engine/sq-engine.module';
import { FranchiseModule } from '../franchise/franchise.module';
import { AuditModule } from '../audit/audit.module';

/**
 * EDR Module — EHB Department of Review
 *
 * EDR is EHB-level oversight: it operates across ALL platforms and is the
 * final authority in the SQ approval chain. No platform restriction.
 *
 * MongoDB collections:
 *   edr_reviews — one record per SQ request assigned to EDR;
 *                 multiple records for the same sq_request when overrides occur
 *
 * Events consumed:
 *   edr.review_requested  ← from rule-engine (action=edr in platform rules)
 *                         ← from franchise   (decision=escalate)
 *                         Both use the same event name.
 *
 * Events emitted:
 *   sq.decision           → webhook module → pushes approved/rejected to platform webhook
 *   audit.write           → audit module → persists to audit_logs
 *
 * Dependencies:
 *   SqEngineModule  — SqEngineService: getRequestById, getRecordByEntity,
 *                     finalizeApproval, finalizeRejection, forwardToReview
 *   FranchiseModule — FranchiseService: getReviewBySqRequestId
 *                     (needed for full-detail view: GET /edr/review/:sq_request_id)
 *   AuditModule     — AuditService: getLogsForRequest(sq_request_id)
 *                     (full audit trail in GET /edr/review/:sq_request_id)
 *
 * Dependency chain: EdrModule → FranchiseModule → SqEngineModule
 *                   EdrModule → AuditModule (no cycle: audit never imports EDR)
 * No circular dependency.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EdrReview.name, schema: EdrReviewSchema },
    ]),
    SqEngineModule,
    FranchiseModule,
    AuditModule,
  ],
  controllers: [EdrController],
  providers: [EdrService],
  exports: [EdrService],
})
export class EdrModule {}
