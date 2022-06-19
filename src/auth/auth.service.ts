import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { wrap } from '@mikro-orm/core';
import * as md5 from 'md5';
import { v4 } from 'uuid';
import * as bcrypt from 'bcryptjs';
import e from 'express';
import { FORGET_PASSWORD_PREFIX } from '../utils/constants';
import { uploadAvatarToS3, uploadToS3 } from '../utils/fileUtils';
import { redis } from '../utils/redis';
import { User } from '../entities/user.entity';
import {
  ChangePasswordInput,
  LoginDTO,
  RegisterDTO,
  ResetPasswordInput,
  UpdateUserDTO,
  UserResponse,
} from '../models/user.model';
import { BufferFile } from '../utils/BufferFile';
import { sendEmail } from '../utils/sendEmail';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: EntityRepository<User>,
  ) {}

  async login(
    { email, password }: LoginDTO,
    req: e.Request,
  ): Promise<UserResponse> {
    const user = await this.userRepository.findOne({ email });
    if (!user) {
      throw new HttpException(
        {
          errors: [{ field: 'email', message: 'Invalid Credentials' }],
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      throw new HttpException(
        {
          errors: [{ field: 'password', message: 'Invalid Credentials' }],
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    //@ts-ignore
    req!.session!['userId'] = user.id;

    return { ...user.toJSON() };
  }

  async register(
    credentials: RegisterDTO,
    req: e.Request,
  ): Promise<UserResponse> {
    const { username, email } = credentials;

    const exists = await this.userRepository.findOne({
      $or: [{ username }, { email }],
    });

    if (exists?.username === username) {
      throw new HttpException(
        {
          errors: [
            {
              field: 'username',
              message: 'Username must be unique.',
            },
          ],
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (exists?.email === email) {
      throw new HttpException(
        {
          errors: [
            {
              field: 'email',
              message: 'Email must be unique.',
            },
          ],
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = new User(credentials);
    user.image = `https://gravatar.com/avatar/${md5(
      credentials.email,
    )}?d=identicon`;
    await this.userRepository.persistAndFlush(user);

    //@ts-ignore
    req!.session!['userId'] = user.id;
    return { ...user.toJSON() };
  }

  async forgotPassword(email: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ email });
    if (!user) {
      // the email is not in the db
      return true;
    }

    const token = v4();

    await redis.set(
      FORGET_PASSWORD_PREFIX + token,
      user.id,
      'EX',
      1000 * 60 * 60 * 24 * 3,
    ); // 3 days

    await sendEmail(
      email,
      `<a href="${process.env.CORS_ORIGIN}/reset-password/${token}">Reset Password</a>`,
    );

    return true;
  }

  async resetPassword(
    input: ResetPasswordInput,
    req: e.Request,
  ): Promise<UserResponse> {
    const { newPassword, token } = input;

    const key = FORGET_PASSWORD_PREFIX + token;
    const userId = await redis.get(key);
    if (!userId) {
      throw new HttpException(
        {
          errors: [
            {
              field: 'token',
              message: 'Token expired',
            },
          ],
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await this.userRepository.findOneOrFail({
      id: parseInt(userId),
    });

    wrap(user).assign({
      password: await bcrypt.hash(newPassword, 10),
    });

    await this.userRepository.flush();

    await redis.del(key);

    // log in user after change password
    //@ts-ignore
    req!.session!['userId'] = user.id;

    return { ...user.toJSON() };
  }

  async changePassword(
    input: ChangePasswordInput,
    userId: number,
  ): Promise<UserResponse> {
    const { newPassword, currentPassword } = input;

    const user = await this.userRepository.findOne({ id: userId });

    if (!user) {
      throw new NotFoundException();
    }

    const valid = await user.comparePassword(currentPassword);

    if (!valid) {
      throw new UnauthorizedException();
    }

    wrap(user).assign({
      password: await bcrypt.hash(newPassword, 10),
    });

    await this.userRepository.flush();

    return { ...user.toJSON() };
  }

  async findCurrentUser(id: number): Promise<UserResponse> {
    const user = await this.userRepository.findOne(id);
    if (!user) {
      throw new NotFoundException({
        message: 'An account with that username or email does not exist.',
      });
    }
    return { ...user.toJSON() };
  }

  async updateUser(
    id: number,
    data: UpdateUserDTO,
    image?: BufferFile,
  ): Promise<UserResponse> {
    const { username, email } = data;

    const user = await this.userRepository.findOneOrFail(id);

    if (user.username !== username) {
      const checkUsername = await this.userRepository.findOne({ username });
      if (checkUsername) {
        throw new HttpException(
          {
            errors: [
              {
                field: 'username',
                message: 'Username must be unique.',
              },
            ],
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    if (user.email !== email) {
      const checkUsername = await this.userRepository.findOne({ email });
      if (checkUsername) {
        throw new HttpException(
          {
            errors: [
              {
                field: 'email',
                message: 'Email must be unique.',
              },
            ],
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    let url = null;
    if (image) {
      const directory = `nest/users/${id}`;
      url = await uploadAvatarToS3(directory, image);
    }

    if (url) {
      data.image = url;
    }

    wrap(user).assign(data);
    await this.userRepository.flush();

    return { ...user.toJSON() };
  }
}
