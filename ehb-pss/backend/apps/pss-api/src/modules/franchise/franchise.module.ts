import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FranchiseController } from './franchise.controller';
import { FranchiseService } from './franchise.service';
import { Franchise, FranchiseSchema } from './franchise.schema';
import { FranchiseReview, FranchiseReviewSchema } from './franchise-review.schema';
import { SqEngineModule } from '../sq-engine/sq-engine.module';

/**
 * Franchise Module
 *
 * Responsibility: Manual review of entities routed to franchise by the rule-engine.
 *
 * MongoDB collections:
 *   franchises         — auto-created per (platform_id, area); holds contact info + counters
 *   franchise_reviews  — one record per SQ request routed to franchise
 *
 * Events consumed:
 *   franchise.review_requested  ← from rule-engine (FranchiseReviewRequestedEvent)
 *
 * Events emitted:
 *   sq.decision           → webhook module → pushes approved/rejected to platform webhook
 *   edr.review_requested  → EDR module → creates EDR review record (on escalation)
 *   audit.write           → audit module → persists to audit_logs
 *
 * Dependencies:
 *   SqEngineModule — imported so FranchiseService can call:
 *     sqEngineService.getRequestById()
 *     sqEngineService.assignFranchise()
 *     sqEngineService.finalizeApproval()
 *     sqEngineService.finalizeRejection()
 *     sqEngineService.forwardToReview()
 *
 * NOTE: EventEmitterModule.forRoot() is in AppModule — EventEmitter2
 * and @OnEvent() decorators are available here automatically.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Franchise.name, schema: FranchiseSchema },
      { name: FranchiseReview.name, schema: FranchiseReviewSchema },
    ]),
    // Import SqEngineModule to access SqEngineService (exported by that module)
    SqEngineModule,
  ],
  controllers: [FranchiseController],
  providers: [FranchiseService],
  exports: [FranchiseService],
})
export class FranchiseModule {}
