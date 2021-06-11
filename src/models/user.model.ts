import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export class LoginDTO {
  @ApiProperty({ type: String, description: 'Unique. Must be a valid email.' })
  email!: string;

  @ApiProperty({ type: String, description: 'Min 6, max 150 characters.' })
  password!: string;
}

export class RegisterDTO extends LoginDTO {
  @ApiProperty({
    type: String,
    description: 'Unique. Min 3, max 30 characters.',
  })
  username!: string;
}

export class UpdateUserDTO implements Partial<User> {
  @ApiProperty({ type: String, description: 'Unique. Must be a valid email.' })
  email!: string;

  @ApiProperty({
    type: String,
    description: 'Unique. Min 3, max 30 characters.',
  })
  username!: string;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Unique. Max 250 characters.',
  })
  bio?: string;

  @ApiProperty({ type: String, required: false })
  image?: string;
}

export class UserResponse {
  @ApiProperty({ type: String })
  email!: string;
  @ApiProperty({ type: String })
  username!: string;
  @ApiProperty({ type: String })
  bio!: string;
  @ApiProperty({ type: String })
  image!: string;
}

export class ProfileResponse extends UserResponse {
  @ApiProperty()
  following!: boolean;
  @ApiProperty()
  followers?: number;
  @ApiProperty()
  followee?: number;
}

export class ChangePasswordInput {
  @ApiProperty({ type: String })
  currentPassword!: string;

  @ApiProperty({ type: String, description: 'Min 6, max 150 characters.' })
  newPassword!: string;

  @ApiProperty({
    type: String,
    description: 'Must be the same as the newPassword value.',
  })
  confirmNewPassword!: string;
}

export class ResetPasswordInput {
  @ApiProperty({
    type: String,
    description: 'The from the email provided token.',
  })
  token!: string;
  @ApiProperty({ type: String, description: 'Min 6, max 150 characters.' })
  newPassword!: string;
  @ApiProperty({
    type: String,
    description: 'Must be the same as the newPassword value.',
  })
  confirmNewPassword!: string;
}

export class ForgotPasswordInput {
  @ApiProperty({
    type: String,
    description: 'User Email.',
  })
  email!: string;
}
