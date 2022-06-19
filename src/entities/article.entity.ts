import {
  ArrayType,
  Collection,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  wrap,
} from '@mikro-orm/core';
import * as slugify from 'slug';
import { User } from './user.entity';
import { Comment } from './comment.entity';
import { ArticleResponse, CreateArticleDTO } from '../models/article.model';
import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH } from '../utils/constants';

@Entity()
export class Article {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'date' })
  createdAt = new Date();

  @Property({ type: 'date', onUpdate: () => new Date() })
  updatedAt = new Date();

  @Property({ length: TITLE_MAX_LENGTH + 20 })
  slug!: string;

  @Property({ length: TITLE_MAX_LENGTH })
  title!: string;

  @Property()
  image!: string;

  @Property({ type: 'text', length: DESCRIPTION_MAX_LENGTH })
  description!: string;

  @Property({ type: 'text' })
  body!: string;

  @Property({ type: ArrayType })
  tagList: string[] = [];

  @ManyToOne()
  author!: User;

  @OneToMany(() => Comment, (comment) => comment.article, {
    orphanRemoval: true,
    hidden: true,
  })
  comments = new Collection<Comment>(this);

  @Property()
  favoritesCount = 0;

  constructor(
    author: User,
    image: string,
    { title, description, body }: CreateArticleDTO,
  ) {
    this.author = author;
    this.title = title;
    this.description = description;
    this.body = body;
    this.image = image;
    this.slug =
      slugify(this.title, { lower: true }) +
      '-' +
      ((Math.random() * Math.pow(36, 6)) | 0).toString(36);
  }

  toJSON(user?: User): ArticleResponse {
    const o = wrap<Article>(this).toObject() as unknown as ArticleResponse;
    o.favorited = user?.favorites?.isInitialized()
      ? user.favorites.contains(this)
      : false;
    o.bookmarked = user?.bookmarks?.isInitialized()
      ? user.bookmarks.contains(this)
      : false;
    o.author = this.author.toProfile(user);

    return o;
  }

  toAuthorJSON(author: User, user?: User): ArticleResponse {
    const o = wrap<Article>(this).toObject() as unknown as ArticleResponse;
    o.favorited = user?.favorites?.isInitialized()
      ? user.favorites.contains(this)
      : false;
    o.bookmarked = user?.bookmarks?.isInitialized()
      ? user.bookmarks.contains(this)
      : false;
    o.author = author.toProfile(user);

    return o;
  }
}
