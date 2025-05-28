import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

const getSwaggerDescription = () =>
  fs.readFileSync(path.join(__dirname, 'swagger.description.txt'), 'utf8');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(helmet());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors({
    origin: /\.seerslab\.io$/,
    credentials: true,
  });

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('NestJS API')
    .setDescription(getSwaggerDescription())
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'access-token', // 이 이름은 @ApiBearerAuth() 데코레이터에서 사용됩니다
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log('DB_HOST:', configService.get('DB_HOST'));
  console.log('REDIS_HOST:', configService.get('REDIS_HOST'));

  console.log(`Server is running on port ${process.env.PORT ?? 3000}`);
  console.log(`Docs: http://localhost:${process.env.PORT ?? 3000}/docs`);

  // console.log(
  //   'REDIS_DATABASE from ConfigService:',
  //   configService.get('REDIS_DATABASE'),
  // );
}
bootstrap();
