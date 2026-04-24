import { Module, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Redis as IORedis } from 'ioredis';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { WebhookDelivery, WebhookDeliverySchema } from './webhook-delivery.schema';
import { WEBHOOK_QUEUE } from './webhook.service';
import { PlatformsModule } from '../platforms/platforms.module';
import { AuthModule } from '../auth/auth.module';

const moduleLogger = new Logger('WebhookModule');

/**
 * Webhook Module
 *
 * Responsibility: Deliver sq.decision events to platform webhook endpoints.
 *
 * MongoDB collections:
 *   webhook_deliveries  — delivery records with status, attempts, payload snapshot
 *
 * Bull queue:
 *   "webhook-delivery"  — reliable job queue backed by Redis
 *   Job options: max 3 attempts, escalating backoff [30s, 120s, 300s]
 *   Jobs are NOT removed on complete/fail (admin inspection)
 *
 * Events consumed:
 *   sq.decision         ← from rule-engine, franchise, edr
 *
 * Events emitted:
 *   audit.write         → audit module (webhook_queued, webhook_delivered, webhook_failed)
 *
 * Dependencies:
 *   PlatformsModule     — WebhookService calls PlatformsService.getWebhookConfig()
 *   AuthModule          — exports AdminKeyGuard + PlatformKeyGuard for controller
 *
 * Redis connection:
 *   Loaded from REDIS_URL env var via ConfigService.
 *   BullModule.forRootAsync() in this module registers the Redis connection
 *   for the WEBHOOK_QUEUE only.
 *
 * NOTE: WebhookService is both a regular @Injectable() provider AND
 * registered as the Bull processor via @Processor(WEBHOOK_QUEUE).
 * NestJS Bull supports this pattern — the same class instance handles
 * both event listening and job processing.
 */
@Module({
  imports: [
    // ── Mongoose: webhook_deliveries collection ──────────────────────────────
    MongooseModule.forFeature([
      { name: WebhookDelivery.name, schema: WebhookDeliverySchema },
    ]),

    // ── Bull: Redis-backed job queue ─────────────────────────────────────────
    // Uses Bull's createClient factory so we can attach an error handler on every
    // ioredis connection Bull creates (client, subscriber, bclient).
    //
    // Without an .on('error') handler, ioredis emits an unhandled Node.js error
    // event when Redis is unreachable, which crashes the process with AggregateError.
    // By absorbing ECONNREFUSED / stream errors here the app stays up and degrades
    // gracefully — SQ decisions are recorded, webhook delivery is simply skipped.
    //
    // Key options:
    //   lazyConnect: true        — don't connect at module init, only on first command
    //   maxRetriesPerRequest: 0  — fail commands immediately instead of retrying 20×
    //   enableOfflineQueue: false — don't buffer commands while offline
    //   retryStrategy            — reconnect up to 5× then give up permanently
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL', 'redis://localhost:6379');
        let host = 'localhost';
        let port = 6379;
        let password: string | undefined;

        try {
          const parsed = new URL(redisUrl);
          host = parsed.hostname || 'localhost';
          port = parseInt(parsed.port || '6379', 10);
          password = parsed.password || undefined;
        } catch {
          // URL parse failure — fall back to defaults
        }

        // Bull creates 3 internal ioredis connections, each with different rules:
        //
        //   'client'     — regular commands; may use maxRetriesPerRequest
        //   'subscriber' — SUBSCRIBE/PSUBSCRIBE; Bull forbids maxRetriesPerRequest here
        //   'bclient'    — blocking commands (BRPOP); Bull forbids maxRetriesPerRequest here
        //
        // Bull validates this at queue creation and throws if the rule is violated:
        //   "Using a redis instance with enableReadyCheck or maxRetriesPerRequest
        //    for bclient/subscriber is not permitted."
        //
        // Solution: apply maxRetriesPerRequest: 0 only to 'client'; pass null for
        // the other two (null = use ioredis default, which is fine for these types).
        const makeClient = (type: 'client' | 'subscriber' | 'bclient') => {
          const isBlocking = type === 'subscriber' || type === 'bclient';

          const client = new IORedis({
            host,
            port,
            password,
            lazyConnect: true,
            // Only set on 'client' — Bull forbids this on subscriber/bclient
            maxRetriesPerRequest: isBlocking ? null : 0,
            enableOfflineQueue: false,
            enableReadyCheck: false,
            // Stop reconnecting almost immediately when Redis is unreachable.
            // We don't want the dev console flooded with reconnection errors —
            // 1 retry then permanent give-up. WebhookService catches the
            // resulting "client closed" errors and falls back to skipping.
            retryStrategy: (times: number) => {
              if (times > 1) return null;
              return 2000;
            },
            reconnectOnError: () => false,
          });

          // Absorb connection errors so they never surface as unhandled Node.js
          // error events (which would crash the process with AggregateError).
          //
          // Node's AggregateError (fired when IPv4+IPv6 dials both fail) has an
          // empty .message and stores the real errors in .errors[]. So we inspect
          // name, code, errno, and recursively the nested errors array to decide.
          //
          // We also only log a single "unavailable" warning per client — the
          // retryStrategy will fire the same error repeatedly as it reconnects,
          // and there's no value in logging each one.
          let alreadyWarned = false;

          const looksLikeConnErr = (e: unknown): boolean => {
            if (!e) return false;
            const any = e as {
              name?: string;
              code?: string;
              errno?: string | number;
              message?: string;
              errors?: unknown[];
            };
            const parts = [
              any.name ?? '',
              any.code ?? '',
              String(any.errno ?? ''),
              any.message ?? '',
            ].join(' ');
            if (
              /ECONNREFUSED|ECONNRESET|ETIMEDOUT|EHOSTUNREACH|ENETUNREACH|EPIPE|AggregateError|getaddrinfo|connect|Stream|closed|reset|ready check/i.test(
                parts,
              )
            ) {
              return true;
            }
            // AggregateError — walk nested errors
            if (Array.isArray(any.errors) && any.errors.some(looksLikeConnErr)) {
              return true;
            }
            return false;
          };

          client.on('error', (err: unknown) => {
            const err_ = err instanceof Error ? err : new Error(String(err));

            if (looksLikeConnErr(err_)) {
              if (!alreadyWarned) {
                alreadyWarned = true;
                moduleLogger.warn(
                  `[Redis/${type}] Unavailable — webhook delivery disabled. ` +
                    `Start Redis to re-enable. (Further connection errors suppressed.)`,
                );
              }
              return;
            }

            // Only reach here for genuinely unexpected, non-connection errors.
            moduleLogger.error(
              `[Redis/${type}] Unexpected error: ${err_.message || err_.name || 'unknown'}`,
            );
          });

          // Reset the "warned" flag once we successfully connect, so a later
          // disconnect after Redis was up will log once again.
          client.on('ready', () => {
            alreadyWarned = false;
            moduleLogger.log(`[Redis/${type}] Connected.`);
          });

          return client;
        };

        return {
          createClient: (type: 'client' | 'subscriber' | 'bclient') => makeClient(type),
        };
      },
    }),
    BullModule.registerQueue({
      name: WEBHOOK_QUEUE,
    }),

    // ── Feature dependencies ─────────────────────────────────────────────────
    PlatformsModule,
    AuthModule,
  ],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}
