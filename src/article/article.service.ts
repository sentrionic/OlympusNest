import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { expr, QueryOrder, wrap } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Article } from '../entities/article.entity';
import { User } from '../entities/user.entity';
import {
  ArticleResponse,
  CreateArticleDTO,
  FindAllQuery,
  FindFeedQuery,
  FindQueryOrder,
  PaginatedArticles,
  UpdateArticleDTO,
} from '../models/article.model';
import { Tag } from '../entities/tag.entity';
import { BufferFile } from '../utils/BufferFile';
import { deleteFile, uploadToS3 } from '../utils/fileUtils';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private articleRepository: EntityRepository<Article>,
    @InjectRepository(User)
    private userRepository: EntityRepository<User>,
    @InjectRepository(Tag)
    private tagRepository: EntityRepository<Tag>,
  ) {}

  async findBySlug(userId: number, slug: string): Promise<ArticleResponse> {
    const user = userId
      ? await this.userRepository.findOneOrFail(userId, {
          populate: ['favorites', 'bookmarks'],
        })
      : undefined;
    const article = await this.articleRepository.findOne(
      { slug },
      { populate: ['author'] },
    );

    if (!article) {
      throw new NotFoundException();
    }

    const author = await this.userRepository.findOneOrFail(article.author.id, {
      populate: ['followersCollection'],
    });

    return article.toAuthorJSON(author, user);
  }

  async findAll(
    userId: number,
    query: FindAllQuery,
  ): Promise<PaginatedArticles> {
    const user = userId
      ? await this.userRepository.findOneOrFail(userId, {
          populate: ['followersCollection', 'favorites', 'bookmarks'],
        })
      : undefined;

    const { limit, tag, author, favorited, cursor, order, p, search } = query;

    const realLimit = Math.min(20, limit || 20);
    const realLimitPlusOne = realLimit + 1;

    const findOptions: Record<string, any> = {};

    if (tag) {
      findOptions['lower(CAST(tag_list AS text))'] = new RegExp(
        tag.toLowerCase(),
      );
    }

    if (author) {
      const articleAuthor = await this.userRepository.findOne({
        username: author,
      });

      if (!articleAuthor) {
        return { articles: [], hasMore: false };
      }

      findOptions.author = articleAuthor.id;
    }

    if (favorited) {
      const profile = await this.userRepository.findOne({
        username: query.favorited,
      });

      if (!profile || !profile.favorites.isInitialized()) {
        return { articles: [], hasMore: false };
      }

      findOptions.id = profile.favorites.getIdentifiers();
    }

    if (cursor) {
      findOptions.createdAt = { $lt: new Date(cursor) };
    }

    if (search) {
      const searchRE = new RegExp(search.toLowerCase());
      findOptions.$or = [
        { [expr('lower(title)')]: searchRE },
        { [expr('lower(description)')]: searchRE },
      ];
    }

    const queryOrder: Record<string, string> = {};
    if (order) {
      switch (order) {
        case FindQueryOrder.ASC:
          queryOrder.createdAt = 'ASC';
          break;

        case FindQueryOrder.TOP:
          queryOrder.favoritesCount = 'DESC';
          break;

        case FindQueryOrder.DESC:
        default:
          queryOrder.createdAt = 'DESC';
          break;
      }
    } else {
      queryOrder.createdAt = QueryOrder.DESC;
    }

    let skip = 0;
    if (p) {
      skip = Math.max(p - 1, 0);
    }

    const articles = await this.articleRepository.find(findOptions, {
      populate: ['author'],
      orderBy: queryOrder,
      limit: realLimitPlusOne,
      offset: skip * realLimit,
    });

    return {
      articles: articles.slice(0, realLimit).map((a) => a.toJSON(user)),
      hasMore: articles.length === realLimitPlusOne,
    };
  }

  async findFeed(
    userId: number,
    query: FindFeedQuery,
  ): Promise<PaginatedArticles> {
    const { limit, p, cursor } = query;

    const realLimit = Math.min(20, limit || 20);
    const realLimitPlusOne = realLimit + 1;

    const user = await this.userRepository.findOneOrFail(userId, {
      populate: ['favorites', 'bookmarks'],
    });

    let skip = 0;
    if (p) {
      skip = Math.max(p - 1, 0);
    }

    let results: Article[];
    if (cursor) {
      results = await this.articleRepository.find(
        {
          author: { followersCollection: userId },
          createdAt: { $lt: new Date(cursor) },
        },
        {
          populate: ['author.followersCollection'],
          orderBy: { createdAt: QueryOrder.DESC },
          limit: realLimitPlusOne,
        },
      );
    } else {
      results = await this.articleRepository.find(
        { author: { followersCollection: userId } },
        {
          populate: ['author', 'author.followersCollection'],
          orderBy: { createdAt: QueryOrder.DESC },
          limit: realLimitPlusOne,
          offset: skip * realLimit,
        },
      );
    }

    console.log(results[0].author.followersCollection.count());

    return {
      articles: results.slice(0, realLimit).map((a) => a.toJSON(user)),
      hasMore: results.length === realLimitPlusOne,
    };
  }

  async findBookmarked(
    userId: number,
    query: FindAllQuery,
  ): Promise<PaginatedArticles> {
    const user = await this.userRepository.findOneOrFail(userId, {
      populate: ['followersCollection', 'favorites', 'bookmarks'],
    });

    const realLimit = Math.min(20, query?.limit || 20);
    const realLimitPlusOne = realLimit + 1;

    const findOptions: Record<string, any> = {};
    findOptions.id = user.bookmarks.getIdentifiers();

    let skip = 0;
    if (query.p) {
      skip = Math.max(query.p - 1, 0);
    }

    if (query.cursor) {
      findOptions.createdAt = { $lt: new Date(query.cursor) };
    }

    const articles = await this.articleRepository.find(findOptions, {
      populate: ['author'],
      orderBy: { createdAt: QueryOrder.DESC },
      limit: realLimitPlusOne,
      offset: skip * realLimit,
    });

    return {
      articles: articles.slice(0, realLimit).map((a) => a.toJSON(user)),
      hasMore: articles.length === realLimitPlusOne,
    };
  }

  async createArticle(
    userId: number,
    data: CreateArticleDTO,
    image?: BufferFile,
  ): Promise<ArticleResponse> {
    const user = await this.userRepository.findOneOrFail(
      { id: userId },
      { populate: ['articles'] },
    );
    // Get random image if non is provided
    let url = `https://picsum.photos/seed/${(
      (Math.random() * Math.pow(36, 6)) |
      0
    ).toString(36)}/1080`;

    if (image) {
      const directory = `nest/users/${user.id}`;
      url = await uploadToS3(directory, image);
    }

    const article = new Article(user, url, data);
    article.tagList.push(...data.tagList);
    user.articles.add(article);
    await this.upsertTags(data.tagList);
    await this.userRepository.flush();

    return article.toJSON(user);
  }

  async updateArticle(
    slug: string,
    userId: number,
    data: UpdateArticleDTO,
    image?: BufferFile,
  ): Promise<ArticleResponse> {
    const user = await this.userRepository.findOneOrFail({ id: userId });
    const article = await this.articleRepository.findOne(
      { slug },
      { populate: ['author'] },
    );
    if (!article) {
      throw new NotFoundException();
    }

    if (!this.ensureOwnership(user.id, article)) {
      throw new UnauthorizedException();
    }

    if (image) {
      const directory = `nest/users/${user.id}`;
      data.image = await uploadToS3(directory, image);
      deleteFile(article.image);
    }

    wrap(article).assign(data);
    await this.articleRepository.flush();

    return article.toJSON(user);
  }

  async deleteArticle(slug: string, userId: number): Promise<ArticleResponse> {
    const user = await this.userRepository.findOneOrFail({ id: userId });
    const article = await this.articleRepository.findOneOrFail(
      { slug },
      { populate: ['author'] },
    );
    if (!this.ensureOwnership(userId, article)) {
      throw new UnauthorizedException();
    }
    await this.articleRepository.nativeDelete({ slug });
    deleteFile(article.image);
    return article.toJSON(user);
  }

  async favoriteArticle(
    slug: string,
    userId: number,
  ): Promise<ArticleResponse> {
    const user = await this.userRepository.findOneOrFail(
      { id: userId },
      { populate: ['favorites', 'followersCollection'] },
    );
    const article = await this.articleRepository.findOneOrFail(
      { slug },
      { populate: ['author'] },
    );
    if (!user.favorites.contains(article)) {
      user.favorites.add(article);
      article.favoritesCount++;
    }

    await this.articleRepository.flush();
    return article.toJSON(user);
  }

  async unfavoriteArticle(
    slug: string,
    userId: number,
  ): Promise<ArticleResponse> {
    const user = await this.userRepository.findOneOrFail(
      { id: userId },
      { populate: ['favorites', 'followersCollection'] },
    );
    const article = await this.articleRepository.findOneOrFail(
      { slug },
      { populate: ['author'] },
    );

    if (user.favorites.contains(article)) {
      user.favorites.remove(article);
      article.favoritesCount--;
    }

    await this.articleRepository.flush();
    return article.toJSON(user);
  }

  async bookmarkArticle(
    slug: string,
    userId: number,
  ): Promise<ArticleResponse> {
    const user = await this.userRepository.findOneOrFail(
      { id: userId },
      { populate: ['bookmarks'] },
    );
    const article = await this.articleRepository.findOneOrFail(
      { slug },
      { populate: ['author'] },
    );

    user.bookmarks.add(article);
    await this.userRepository.flush();
    return article.toJSON(user);
  }

  async removeBookmarkedArticle(
    slug: string,
    userId: number,
  ): Promise<ArticleResponse> {
    const user = await this.userRepository.findOneOrFail(
      { id: userId },
      { populate: ['bookmarks'] },
    );
    const article = await this.articleRepository.findOneOrFail(
      { slug },
      { populate: ['author'] },
    );

    user.bookmarks.remove(article);
    await this.userRepository.flush();
    return article.toJSON(user);
  }

  async findTags(): Promise<string[]> {
    const tags = await this.tagRepository.findAll({
      limit: 10,
      orderBy: { count: 'DESC' },
    });
    return tags.map((tag) => tag.tag);
  }

  private ensureOwnership(userId: number, article: Article): boolean {
    return article.author.id === userId;
  }

  private async upsertTags(tagList: string[]): Promise<void> {
    const foundTags = await this.tagRepository.find({
      tag: tagList.map((t) => t),
    });
    foundTags.map((t) => t.count++);
    const newTags = tagList.filter(
      (t) => !foundTags.map((t) => t.tag).includes(t),
    );
    const tags = newTags.map((t) => new Tag(t));
    await this.tagRepository.persistAndFlush(tags);
  }
}
