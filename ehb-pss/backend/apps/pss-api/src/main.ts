import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

// ─── Process-level safety net for Redis / Bull connection errors ─────────────
// Bull internally creates ioredis connections that may reject promises during
// reconnection attempts. Even with .on('error') handlers attached on every
// client we create, an unhandled rejection from deep inside Bull's command
// pipeline (or a Node-level AggregateError from happy-eyeballs IPv4+IPv6 dial)
// can still crash the process. We swallow those specific cases here so the
// app stays up and degrades gracefully — webhook delivery is skipped, but
// SQ decisions, EDR review, and all HTTP routes keep working.
const processSafetyLogger = new Logger('ProcessSafety');
let connErrAlreadyWarned = false;

const isConnectionError = (err: unknown): boolean => {
  if (!err) return false;
  const any = err as {
    name?: string;
    code?: string;
    errno?: string | number;
    message?: string;
    errors?: unknown[];
    syscall?: string;
  };
  const parts = [
    any.name ?? '',
    any.code ?? '',
    String(any.errno ?? ''),
    any.syscall ?? '',
    any.message ?? '',
  ].join(' ');
  if (
    /ECONNREFUSED|ECONNRESET|ETIMEDOUT|EHOSTUNREACH|ENETUNREACH|EPIPE|AggregateError|getaddrinfo|Stream isn|Connection is closed|ready check|MaxRetriesPerRequest|Redis|Bull/i.test(
      parts,
    )
  ) {
    return true;
  }
  if (Array.isArray(any.errors) && any.errors.some(isConnectionError)) {
    return true;
  }
  return false;
};

process.on('unhandledRejection', (reason: unknown) => {
  if (isConnectionError(reason)) {
    if (!connErrAlreadyWarned) {
      connErrAlreadyWarned = true;
      processSafetyLogger.warn(
        'Suppressed unhandled rejection from Redis/Bull connection (likely Redis is down). ' +
          'Webhook delivery is disabled until Redis is reachable. (Further suppressions silent.)',
      );
    }
    return;
  }
  // Real unhandled rejection — log it loudly, do NOT exit
  const err = reason instanceof Error ? reason : new Error(String(reason));
  processSafetyLogger.error(`Unhandled rejection: ${err.message}`, err.stack);
});

process.on('uncaughtException', (err: Error) => {
  if (isConnectionError(err)) {
    if (!connErrAlreadyWarned) {
      connErrAlreadyWarned = true;
      processSafetyLogger.warn(
        'Suppressed uncaught exception from Redis/Bull connection (likely Redis is down). ' +
          'Webhook delivery is disabled until Redis is reachable. (Further suppressions silent.)',
      );
    }
    return;
  }
  processSafetyLogger.error(`Uncaught exception: ${err.message}`, err.stack);
  // Re-throw real errors so PM2/NX can restart cleanly
  throw err;
});

async function bootstrap() {
  const logger = new Logger('PSS-API');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);

  // Global validation — every incoming DTO is validated + stripped of unknown props
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableCors();
  app.setGlobalPrefix('api');

  // Swagger — auto-generated interactive docs at /api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('PSS API — EHB Trust Engine')
    .setDescription(
      'Platform Support Services (PSS): Central verification, SQ scoring, ' +
      'and trust governance for all EHB sub-platforms. ' +
      'All inter-platform communication routes through this API.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'jwt',
    )
    .addApiKey(
      { type: 'apiKey', in: 'header', name: 'x-platform-key' },
      'platform-key',
    )
    .addApiKey(
      { type: 'apiKey', in: 'header', name: 'x-ehb-admin-key' },
      'admin-key',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  logger.log(`PSS API listening on port ${port}`);
  logger.log(`Swagger docs → http://localhost:${port}/api/docs`);
}

bootstrap();
