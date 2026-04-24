import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CriteriaController } from './criteria.controller';
import { CriteriaService } from './criteria.service';
import { CriteriaSet, CriteriaSetSchema } from './criteria-set.schema';

/**
 * Criteria Module
 *
 * Manages per-platform criteria sets used by sq-engine to score entities.
 *
 * MongoDB collection: criteria_sets
 *   One document per (platform_id, entity_type).
 *   Compound unique index enforces no duplicate sets.
 *
 * Exports CriteriaService so SqEngineModule can:
 *   - call getCriteriaSet(platform_id, entity_type) at submit time
 *   - call evaluateCriteria(criteriaSet, entityData) for scoring
 *
 * No events emitted. No dependencies on other modules.
 * Auth is applied at the controller level via AdminKeyGuard directly.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CriteriaSet.name, schema: CriteriaSetSchema },
    ]),
  ],
  controllers: [CriteriaController],
  providers: [CriteriaService],
  exports: [CriteriaService],
})
export class CriteriaModule {}
