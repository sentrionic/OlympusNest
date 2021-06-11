import * as yup from 'yup';
import { CreateCommentDTO } from '../models/comment.model';
import {
  CreateArticleDTO,
  FindAllQuery,
  FindQueryOrder,
  UpdateArticleDTO,
} from '../models/article.model';
import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH } from '../utils/constants';

export const ArticleSchema = yup.object().shape({
  title: yup
    .string()
    .min(10)
    .max(TITLE_MAX_LENGTH, `Max Limit is ${TITLE_MAX_LENGTH} characters`)
    .required('Title is required')
    .defined(),
  description: yup
    .string()
    .min(10)
    .max(
      DESCRIPTION_MAX_LENGTH,
      `Max Limit is ${DESCRIPTION_MAX_LENGTH} characters`,
    )
    .required('Description is required')
    .defined(),
  body: yup.string().defined().required('A body is required'),
  tagList: yup
    //@ts-ignore
    .array<string>(
      yup.string().min(3).max(15, 'Max Limit is 15 characters').defined(),
    )
    .max(5, 'At most 5 tags')
    .required('At least one tag is required')
    .defined(),
});

export const UpdateArticleSchema = yup.object().shape({
  title: yup
    .string()
    .min(10)
    .max(TITLE_MAX_LENGTH, `Max Limit is ${TITLE_MAX_LENGTH} characters`)
    .optional(),
  description: yup
    .string()
    .min(10)
    .max(
      DESCRIPTION_MAX_LENGTH,
      `Max Limit is ${DESCRIPTION_MAX_LENGTH} characters`,
    )
    .optional(),
  body: yup.string().optional(),
  tagList: yup
    //@ts-ignore
    .array<string>(
      yup.string().min(3).max(15, 'Max Limit is 15 characters').defined(),
    )
    .max(5, 'At most 5 tags'),
});

export const SearchQuerySchema = yup.object().shape({
  order: yup
    .mixed<FindQueryOrder>()
    .oneOf(Object.values(FindQueryOrder))
    .optional(),
});

export const CommentSchema = yup.object().shape({
  body: yup
    .string()
    .min(3)
    .max(250, 'Max Limit is 250 characters')
    .required('A comment is required')
    .defined(),
});
