import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { GetUser } from '../auth/user.decorator';
import {
  ArticleResponse,
  CreateArticleDTO,
  FindAllQuery,
  FindFeedQuery,
  PaginatedArticles,
  UpdateArticleDTO,
} from '../models/article.model';
import { ArticleService } from './article.service';
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express/multer/interceptors/file.interceptor';
import { BufferFile } from '../utils/BufferFile';
import { YupValidationPipe } from '../utils/yupValidationPipe';
import {
  ArticleSchema,
  SearchQuerySchema,
  UpdateArticleSchema,
} from '../schemas/article.schema';
import { AuthGuard } from '../utils/auth.guard';

@ApiTags('Article Operation')
@Controller('articles')
export class ArticleController {
  constructor(private articleService: ArticleService) {}

  @Get()
  @ApiOperation({ summary: 'Get Articles' })
  @ApiOkResponse({ description: 'List of articles', type: [ArticleResponse] })
  async findAll(
    @GetUser() user: number,
    @Query(new YupValidationPipe(SearchQuerySchema)) query: FindAllQuery,
  ): Promise<PaginatedArticles> {
    return await this.articleService.findAll(user, query);
  }

  @Get('/feed')
  @UseGuards(AuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Get Current User Feed' })
  @ApiOkResponse({
    description: 'List all articles of users feed',
    type: [ArticleResponse],
  })
  @ApiUnauthorizedResponse()
  async findFeed(
    @GetUser() user: number,
    @Query() query: FindFeedQuery,
  ): Promise<PaginatedArticles> {
    return await this.articleService.findFeed(user, query);
  }

  @Get('/bookmarked')
  @UseGuards(AuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Get bookmarked articles' })
  @ApiOkResponse({
    description: 'List all articles that the current user bookmarked',
    type: [ArticleResponse],
  })
  @ApiUnauthorizedResponse()
  async getBookmarkedArticles(
    @GetUser() user: number,
    @Query() query: FindFeedQuery,
  ): Promise<PaginatedArticles> {
    return await this.articleService.findBookmarked(user, query);
  }

  @Get('/tags')
  @ApiOperation({ summary: 'Get Tags' })
  @ApiOkResponse({ description: 'List all tags', type: [String] })
  async findTags(): Promise<string[]> {
    return await this.articleService.findTags();
  }

  @Get('/:slug')
  @ApiOperation({ summary: 'Get Article By Slug' })
  @ApiOkResponse({
    description: 'Article with slug :slug',
    type: ArticleResponse,
  })
  async findBySlug(
    @Param('slug') slug: string,
    @GetUser() user: number,
  ): Promise<ArticleResponse> {
    return await this.articleService.findBySlug(user, slug);
  }

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Create Article' })
  @ApiCreatedResponse({ description: 'Created Article', type: ArticleResponse })
  @ApiUnauthorizedResponse()
  @ApiBody({ type: CreateArticleDTO })
  @ApiConsumes('multipart/form-data')
  async createArticle(
    @GetUser() user: number,
    @Body(new YupValidationPipe(ArticleSchema)) data: CreateArticleDTO,
    @UploadedFile() image?: BufferFile,
  ): Promise<ArticleResponse> {
    return await this.articleService.createArticle(user, data, image);
  }

  @Put('/:slug')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Update Article' })
  @ApiOkResponse({ description: 'Updated Article', type: ArticleResponse })
  @ApiUnauthorizedResponse()
  @ApiBody({ type: UpdateArticleDTO })
  @ApiConsumes('multipart/form-data')
  async updateArticle(
    @Param('slug') slug: string,
    @GetUser() user: number,
    @Body(new YupValidationPipe(UpdateArticleSchema)) data: UpdateArticleDTO,
    @UploadedFile() image?: BufferFile,
  ): Promise<ArticleResponse> {
    return await this.articleService.updateArticle(slug, user, data, image);
  }

  @Delete('/:slug')
  @UseGuards(AuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Delete Article' })
  @ApiOkResponse({ description: 'Deleted Article', type: ArticleResponse })
  @ApiUnauthorizedResponse()
  async deleteArticle(
    @Param('slug') slug: string,
    @GetUser() user: number,
  ): Promise<ArticleResponse> {
    return await this.articleService.deleteArticle(slug, user);
  }

  @Post('/:slug/favorite')
  @UseGuards(AuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Favorite Articles' })
  @ApiCreatedResponse({
    description: 'Favorited Article',
    type: ArticleResponse,
  })
  @ApiUnauthorizedResponse()
  async favoriteArticle(
    @Param('slug') slug: string,
    @GetUser() user: number,
  ): Promise<ArticleResponse> {
    return await this.articleService.favoriteArticle(slug, user);
  }

  @Delete('/:slug/favorite')
  @UseGuards(AuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Unfavorite Articles' })
  @ApiCreatedResponse({
    description: 'Unfavorited Article',
    type: ArticleResponse,
  })
  @ApiUnauthorizedResponse()
  async unfavoriteArticle(
    @Param('slug') slug: string,
    @GetUser() user: number,
  ): Promise<ArticleResponse> {
    return await this.articleService.unfavoriteArticle(slug, user);
  }

  @Post('/:slug/bookmark')
  @UseGuards(AuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Bookmark Articles' })
  @ApiCreatedResponse({
    description: 'Bookmarked Article',
    type: ArticleResponse,
  })
  @ApiUnauthorizedResponse()
  async bookmarkArticle(
    @Param('slug') slug: string,
    @GetUser() user: number,
  ): Promise<ArticleResponse> {
    return await this.articleService.bookmarkArticle(slug, user);
  }

  @Delete('/:slug/bookmark')
  @UseGuards(AuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Remove Bookmark' })
  @ApiCreatedResponse({
    description: 'Removed Article',
    type: ArticleResponse,
  })
  @ApiUnauthorizedResponse()
  async unbookmarkArticle(
    @Param('slug') slug: string,
    @GetUser() user: number,
  ): Promise<ArticleResponse> {
    return await this.articleService.removeBookmarkedArticle(slug, user);
  }
}
