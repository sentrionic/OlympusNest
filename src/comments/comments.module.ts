import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Article } from '../entities/article.entity';
import { Comment } from '../entities/comment.entity';
import { User } from '../entities/user.entity';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [MikroOrmModule.forFeature({ entities: [Article, Comment, User] })],
  providers: [CommentsService],
  controllers: [CommentsController],
})
export class CommentsModule {}
