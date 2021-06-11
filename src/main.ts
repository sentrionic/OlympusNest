import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as connectRedis from 'connect-redis';
import { config } from 'dotenv';
import * as session from 'express-session';
import { AppModule } from './app.module';
import { redis } from './utils/redis';
import { COOKIE_NAME } from './utils/constants';

config();

const __prod__ = process.env.NODE_ENV === 'production';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const RedisStore = connectRedis(session);
  app.setGlobalPrefix('api');
  app.set('trust proxy', 1);
  app.enableCors({
    credentials: true,
    origin: process.env.CORS_ORIGIN,
  });
  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        sameSite: 'lax', // csrf
        secure: __prod__, // cookie only works in https,
        domain: __prod__ ? '.olympus-blog.herokuapp.com' : undefined,
      },
      saveUninitialized: false,
      secret: process.env.SECRET as string,
      resave: true,
      rolling: true,
    }),
  );

  const options = new DocumentBuilder()
    .setTitle('OlmypusBlog API')
    .setDescription('OlympusBlog API Spec')
    .setVersion('1.0.0')
    .addCookieAuth(COOKIE_NAME, {
      type: 'http',
    })
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('/', app, document);
  await app.listen(process.env.PORT || 4000);
}

bootstrap();
