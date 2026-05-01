import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json } from 'express';
import { join } from 'path';
import { AppModule } from './app.module';

// Extend Express Request type to carry the raw body for webhook HMAC verification
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

async function bootstrap() {
  // Create without default body parser so we can attach rawBody ourselves
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  const logger = new Logger('Bootstrap');

  // ── Raw body middleware ─────────────────────────────────────────────────────
  // Attaches req.rawBody (Buffer) so the webhook handler can verify the exact
  // bytes PSS signed, rather than re-serializing the parsed object.
  // This must be registered BEFORE the global ValidationPipe.
  app.use(
    json({
      verify: (req, _res, buf) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (req as any).rawBody = buf;
      },
    }),
  );

  // Serve uploaded files (CNIC, address proofs, etc.) as static assets
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/static' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:4006',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('JPS API')
    .setDescription('Job Providing Service — profile management & PSS SQ integration')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-pss-signature', in: 'header' }, 'pss-webhook')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = parseInt(process.env.PORT ?? '3006', 10);
  await app.listen(port);
  logger.log(`JPS API running on http://localhost:${port}`);
  logger.log(`Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
