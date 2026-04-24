import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';

// PSS Feature Modules — each scaffolded, logic built per phase
import { AuthModule } from './modules/auth/auth.module';
import { PlatformsModule } from './modules/platforms/platforms.module';
import { DevSeedModule } from './modules/dev-seed/dev-seed.module';
import { CriteriaModule } from './modules/criteria/criteria.module';
import { SqEngineModule } from './modules/sq-engine/sq-engine.module';
import { RuleEngineModule } from './modules/rule-engine/rule-engine.module';
import { AuditModule } from './modules/audit/audit.module';
import { FranchiseModule } from './modules/franchise/franchise.module';
import { EdrModule } from './modules/edr/edr.module';
import { WebhookModule } from './modules/webhook/webhook.module';

@Module({
  imports: [
    // ── Global Config ────────────────────────────────────────────────────────
    // Reads from .env — available everywhere via ConfigService
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ── Event Emitter ────────────────────────────────────────────────────────
    // Global event bus used for loose coupling between PSS modules.
    // sq-engine emits 'sq.scored' → rule-engine listens
    // sq-engine emits 'audit.write' → audit module listens
    // rule-engine emits 'sq.routed' → franchise/edr modules listen
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      maxListeners: 20,
    }),

    // ── MongoDB: pss_db ──────────────────────────────────────────────────────
    // PSS owns this database. No other platform has direct access.
    // All other platforms have their own databases.
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGODB_URI'),
        dbName: 'pss_db',
      }),
    }),

    // ── PSS Feature Modules ──────────────────────────────────────────────────
    // Build order: auth → platforms → criteria → sq-engine → rule-engine
    //              → audit → franchise → edr → webhook
    AuthModule,
    PlatformsModule,
    DevSeedModule,
    CriteriaModule,
    SqEngineModule,
    RuleEngineModule,
    AuditModule,
    FranchiseModule,
    EdrModule,
    WebhookModule,
  ],
})
export class AppModule {}
