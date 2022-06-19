import {
  ArgumentMetadata,
  HttpException,
  HttpStatus,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ValidationError } from 'yup';
import { serializeValidationError } from './serializeValidationError';

@Injectable()
export class YupValidationPipe implements PipeTransform {
  constructor(private readonly schema: any) {}

  async transform(value: any, _: ArgumentMetadata) {
    try {
      await this.schema.validate(value, { abortEarly: false });
    } catch (err) {
      if (err instanceof ValidationError) {
        const errors = serializeValidationError(err);
        throw new HttpException(
          { message: 'Input data validation failed', errors },
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    return value;
  }
}
