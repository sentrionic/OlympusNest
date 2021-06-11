import { ApiProperty } from '@nestjs/swagger';
import { ProfileResponse } from './user.model';
import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH } from '../utils/constants';

export class CreateArticleDTO {
  @ApiProperty({
    type: String,
    description: `Min 10, max ${TITLE_MAX_LENGTH} characters.`,
  })
  title!: string;

  @ApiProperty({
    type: String,
    description: `Min 10, max ${DESCRIPTION_MAX_LENGTH} characters.`,
  })
  description!: string;

  @ApiProperty({ type: String })
  body!: string;

  @ApiProperty({ type: [String] })
  tagList!: string[];
}

export class UpdateArticleDTO {
  @ApiProperty({
    type: String,
    description: `Min 10, max ${TITLE_MAX_LENGTH} characters.`,
  })
  title?: string;

  @ApiProperty({
    type: String,
    description: `Min 10, max ${DESCRIPTION_MAX_LENGTH} characters.`,
  })
  description?: string;
  @ApiProperty({
    type: String,
  })
  body?: string;

  @ApiProperty({ type: [String] })
  tagList?: string[];

  @ApiProperty({ type: String, required: false })
  image?: string;
}

export enum FindQueryOrder {
  ASC = 'ASC',
  DESC = 'DESC',
  TOP = 'TOP',
}

export class FindFeedQuery {
  @ApiProperty({ required: false, type: String, default: 10 })
  limit?: number;
  @ApiProperty({ required: false, type: String })
  cursor?: string | null;
  @ApiProperty({ required: false, description: 'Page Index' })
  p?: number;
}

export class FindAllQuery extends FindFeedQuery {
  @ApiProperty({ required: false, type: String })
  tag?: string;
  @ApiProperty({ required: false, type: String })
  author?: string;
  @ApiProperty({ required: false, type: String })
  favorited?: string;
  @ApiProperty({
    required: false,
    enum: FindQueryOrder,
    default: FindQueryOrder.DESC,
    description: 'Order by creation date ASC/DESC or favoritesCount DESC',
  })
  order?: FindQueryOrder;
  @ApiProperty({ required: false, type: String })
  search?: string;
}

export class PaginatedArticles {
  articles!: ArticleResponse[];
  hasMore!: boolean;
}

export class ArticleResponse {
  @ApiProperty({ type: String })
  slug!: string;
  @ApiProperty({ type: String })
  image!: string;
  @ApiProperty({ type: String })
  title!: string;
  @ApiProperty({ type: String })
  description!: string;
  @ApiProperty({ type: String })
  body!: string;
  @ApiProperty({ type: [String] })
  tagList!: string[];
  @ApiProperty({ type: Date })
  createdAt!: Date | string;
  @ApiProperty({ type: Date })
  updatedAt!: Date | string;
  @ApiProperty()
  favorited!: boolean;
  @ApiProperty()
  bookmarked!: boolean;
  @ApiProperty()
  favoritesCount!: number;
  @ApiProperty({ type: ProfileResponse })
  author!: ProfileResponse;
}
