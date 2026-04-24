import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RuleEngineController } from './rule-engine.controller';
import { RuleEngineService } from './rule-engine.service';
import { PlatformRule, PlatformRuleSchema } from './platform-rule.schema';
import { SqEngineModule } from '../sq-engine/sq-engine.module';
import { AuthModule } from '../auth/auth.module';

/**
 * Rule Engine Module
 *
 * Responsibility: Routing decisions after SQ scoring.
 * Listens to 'sq.scored' → evaluates platform rules → executes routing action.
 *
 * MongoDB collections:
 *   platform_rules  — admin-configured routing rules per platform
 *
 * Events consumed:
 *   sq.scored              ← from sq-engine (SqScoredEvent)
 *
 * Events emitted:
 *   sq.decision            → webhook module → pushes to platform webhook
 *   franchise.review_requested → franchise module → creates review record
 *   edr.review_requested   → edr module → creates EDR review record
 *   audit.write            → audit module → persists to audit_logs
 *
 * Dependencies:
 *   SqEngineModule — imported so RuleEngineService can call:
 *     sqEngineService.finalizeApproval()
 *     sqEngineService.finalizeRejection()
 *     sqEngineService.forwardToReview()
 *
 * NOTE: EventEmitterModule.forRoot() is in AppModule — EventEmitter2
 * and @OnEvent() are available here automatically.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PlatformRule.name, schema: PlatformRuleSchema },
    ]),
    SqEngineModule,
    AuthModule,
  ],
  controllers: [RuleEngineController],
  providers: [RuleEngineService],
  exports: [RuleEngineService],
})
export class RuleEngineModule {}
