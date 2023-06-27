import {  Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ArticleModule } from './article/article.module';
import { CommentsModule } from './comments/comments.module';
import { AppService } from './app.service';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    MikroOrmModule.forRoot(),
    CacheModule.register(),
    AuthModule,
    UserModule,
    ArticleModule,
    CommentsModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
    AppService,
  ],
})
export class AppModule {}
