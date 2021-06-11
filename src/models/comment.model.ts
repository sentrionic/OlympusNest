import { ApiProperty } from '@nestjs/swagger/dist/decorators';
import { ProfileResponse } from './user.model';
import { User } from '../entities/user.entity';

export class CreateCommentDTO {
  @ApiProperty({ type: String, description: 'Min 3, max 250 characters.' })
  body!: string;
}

export class CommentResponse {
  @ApiProperty()
  id!: number;
  @ApiProperty({ type: Date })
  createdAt!: string | Date;
  @ApiProperty({ type: Date })
  updatedAt!: string | Date;
  @ApiProperty({ type: String })
  body!: string;
  @ApiProperty({ type: ProfileResponse })
  author!: ProfileResponse | User;
}
