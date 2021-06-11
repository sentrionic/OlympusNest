import { Entity, ManyToOne, PrimaryKey, Property, wrap } from '@mikro-orm/core';
import { User } from './user.entity';
import { Article } from './article.entity';
import { CommentResponse } from '../models/comment.model';

@Entity()
export class Comment {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'date' })
  createdAt = new Date();

  @Property({ type: 'date', onUpdate: () => new Date() })
  updatedAt = new Date();

  @Property()
  body!: string;

  @ManyToOne()
  article!: Article;

  @ManyToOne()
  author!: User;

  constructor(author: User, article: Article, body: string) {
    this.author = author;
    this.article = article;
    this.body = body;
  }

  toJSON(): CommentResponse {
    const o = wrap(this).toObject();
    o.author = this.author.toProfile();
    return o as CommentResponse;
  }
}
