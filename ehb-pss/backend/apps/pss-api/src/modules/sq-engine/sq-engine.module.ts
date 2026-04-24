import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SqEngineController } from './sq-engine.controller';
import { SqAdminController } from './sq-admin.controller';
import { SqEngineService } from './sq-engine.service';
import { SqRequest, SqRequestSchema } from './sq-request.schema';
import { SqRecord, SqRecordSchema } from './sq-record.schema';
import { CriteriaModule } from '../criteria/criteria.module';
import { AuthModule } from '../auth/auth.module';

/**
 * SQ Engine Module
 *
 * Owns: POST /sq/submit, GET /sq/status/:entity_id, POST /sq/status/bulk
 *
 * MongoDB collections registered:
 *   sq_requests  — approval lifecycle records (read + write)
 *   sq_records   — trust ledger per entity (read + write on decision)
 *
 * Criteria loading: delegated to CriteriaModule (was criteria-set-ref.schema.ts interim).
 *   SqEngineService calls:
 *     criteriaService.getCriteriaSet(platform_id, entity_type)
 *     criteriaService.evaluateCriteria(criteriaSet, entity_data)
 *   This replaces the interim presence-only inline check with full
 *   check_type support (presence | min_length | min_value | regex).
 *
 * Events emitted:
 *   sq.scored    → rule-engine subscribes → decides routing
 *   audit.write  → audit module subscribes → writes to audit_logs
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SqRequest.name, schema: SqRequestSchema },
      { name: SqRecord.name, schema: SqRecordSchema },
    ]),
    CriteriaModule,
    AuthModule,
  ],
  controllers: [SqEngineController, SqAdminController],
  providers: [SqEngineService],
  exports: [SqEngineService],
})
export class SqEngineModule {}
