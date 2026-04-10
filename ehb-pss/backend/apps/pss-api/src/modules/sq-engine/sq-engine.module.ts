import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SqEngineController } from './sq-engine.controller';
import { SqEngineService } from './sq-engine.service';
import { SqRequest, SqRequestSchema } from './sq-request.schema';
import { SqRecord, SqRecordSchema } from './sq-record.schema';
import { CriteriaSetRef, CriteriaSetRefSchema } from './criteria-set-ref.schema';

/**
 * SQ Engine Module
 *
 * Owns: POST /sq/submit, GET /sq/status/:entity_id, POST /sq/status/bulk
 *
 * MongoDB collections registered:
 *   sq_requests     — approval lifecycle records (read + write)
 *   sq_records      — trust ledger per entity (read + write on decision)
 *   criteria_sets   — read-only ref until CriteriaModule is built
 *
 * Events emitted:
 *   sq.scored       → rule-engine subscribes → decides routing
 *   audit.write     → audit module subscribes → writes to audit_logs
 *
 * NOTE: EventEmitterModule.forRoot() is registered in AppModule.
 * EventEmitter2 is injected here automatically once forRoot() is in the root.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SqRequest.name, schema: SqRequestSchema },
      { name: SqRecord.name, schema: SqRecordSchema },
      // Read-only ref — replaced with CriteriaModule import when that module is built
      { name: CriteriaSetRef.name, schema: CriteriaSetRefSchema },
    ]),
  ],
  controllers: [SqEngineController],
  providers: [SqEngineService],
  // Export service so rule-engine and other modules can update sq_records
  // e.g. rule-engine calls sqEngineService to mark a request as approved/rejected
  exports: [SqEngineService],
})
export class SqEngineModule {}
