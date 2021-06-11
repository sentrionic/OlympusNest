import { Module } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Article } from '../entities/article.entity';
import { User } from '../entities/user.entity';
import { Tag } from '../entities/tag.entity';

@Module({
  imports: [
    MikroOrmModule.forFeature({
      entities: [Article, User, Tag],
    }),
  ],
  providers: [ArticleService],
  controllers: [ArticleController],
})
export class ArticleModule {}
