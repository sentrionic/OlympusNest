import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Comment } from '../entities/comment.entity';
import { User } from '../entities/user.entity';
import { CommentResponse, CreateCommentDTO } from '../models/comment.model';
import { Article } from '../entities/article.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: EntityRepository<Comment>,
    @InjectRepository(Article)
    private articleRepository: EntityRepository<Article>,
    @InjectRepository(User)
    private userRepository: EntityRepository<User>,
  ) {}

  async findByArticleSlug(slug: string): Promise<CommentResponse[]> {
    const article = await this.articleRepository.findOne({ slug });
    if (!article) {
      throw new NotFoundException();
    }

    const comments = await this.commentRepository.find({ article }, ['author']);

    return comments.map((c) => c.toJSON()) || [];
  }

  async createComment(
    user: number,
    slug: string,
    data: CreateCommentDTO,
  ): Promise<CommentResponse> {
    const article = await this.articleRepository.findOneOrFail({ slug }, [
      'author',
    ]);
    const author = await this.userRepository.findOneOrFail({ id: user });
    const comment = new Comment(author, article, data.body);
    await this.commentRepository.persistAndFlush(comment);

    return comment.toJSON();
  }

  async deleteComment(
    userId: number,
    slug: string,
    id: number,
  ): Promise<CommentResponse> {
    const article = await this.articleRepository.findOneOrFail({ slug }, [
      'author',
      'comments',
    ]);
    const user = await this.userRepository.findOneOrFail(userId);

    const comment = await this.commentRepository.findOne(id, ['author']);

    if (!comment) {
      throw new NotFoundException();
    }

    if (comment.author.id !== user.id) {
      throw new UnauthorizedException();
    }

    if (article.comments.contains(comment)) {
      article.comments.remove(comment);
      await this.commentRepository.removeAndFlush(comment);
    }

    return comment.toJSON();
  }
}
