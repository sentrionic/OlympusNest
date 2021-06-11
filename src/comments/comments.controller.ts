import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GetUser } from '../auth/user.decorator';
import { CommentResponse, CreateCommentDTO } from '../models/comment.model';
import { CommentsService } from './comments.service';
import { CommentSchema } from '../schemas/article.schema';
import { YupValidationPipe } from '../utils/yupValidationPipe';
import { AuthGuard } from '../utils/auth.guard';

@ApiTags('Comment Operation')
@Controller('articles')
export class CommentsController {
  constructor(private commentService: CommentsService) {}

  @Get('/:slug/comments')
  @ApiOperation({ summary: 'Get Article Comments' })
  @ApiOkResponse({
    description: 'List of article comments',
    type: [CommentResponse],
  })
  async findComments(@Param('slug') slug: string): Promise<CommentResponse[]> {
    return await this.commentService.findByArticleSlug(slug);
  }

  @Post('/:slug/comments')
  @UseGuards(AuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Create Comments' })
  @ApiCreatedResponse({
    description: 'Created Comment',
    type: CommentResponse,
  })
  @ApiUnauthorizedResponse()
  @ApiBody({ type: CreateCommentDTO })
  async createComment(
    @GetUser() user: number,
    @Param('slug') slug: string,
    @Body(new YupValidationPipe(CommentSchema)) data: CreateCommentDTO,
  ): Promise<CommentResponse> {
    return await this.commentService.createComment(user, slug, data);
  }

  @Delete('/:slug/comments/:id')
  @UseGuards(AuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Delete Comment' })
  @ApiOkResponse({ description: 'Deleted Comment', type: CommentResponse })
  @ApiUnauthorizedResponse()
  async deleteComment(
    @GetUser() user: number,
    @Param('slug') slug: string,
    @Param('id') id: number,
  ): Promise<CommentResponse> {
    return await this.commentService.deleteComment(user, slug, id);
  }
}
