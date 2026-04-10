import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

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
