import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: [
      'http://localhost:4000', // EHB main frontend
      'http://localhost:4001', // PSS frontend
      'http://localhost:4002', // GoSellr frontend
      'http://localhost:4003', // OLS frontend (future)
      process.env.CORS_ORIGIN ?? '',
    ].filter(Boolean),
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('EHB Main — Identity API')
    .setDescription(
      'EHB central identity platform. All sub-platforms redirect here for registration and login.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'ehb-jwt',
    )
    .addApiKey(
      { type: 'apiKey', name: 'x-platform-key', in: 'header' },
      'platform-key',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = parseInt(process.env.PORT ?? '5000', 10);
  await app.listen(port);
  logger.log(`EHB Main API running on http://localhost:${port}`);
  logger.log(`Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
