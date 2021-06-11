import {
  Body,
  Controller,
  Get,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express/multer/interceptors/file.interceptor';
import { GetUser } from '../auth/user.decorator';
import { AuthService } from '../auth/auth.service';
import { UpdateUserDTO, UserResponse } from '../models/user.model';
import { UserSchema } from '../schemas/user.schema';
import { YupValidationPipe } from '../utils/yupValidationPipe';
import { BufferFile } from '../utils/BufferFile';
import { AuthGuard } from '../utils/auth.guard';

@ApiTags('User Operation')
@Controller('user')
export class UserController {
  constructor(private authService: AuthService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Get Current User' })
  @ApiOkResponse({ description: 'Current user', type: UserResponse })
  @ApiUnauthorizedResponse()
  async findCurrentUser(@GetUser() id: number): Promise<UserResponse> {
    return await this.authService.findCurrentUser(id);
  }

  @Put()
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Update Current User' })
  @ApiOkResponse({ description: 'Update Success', type: UserResponse })
  @ApiUnauthorizedResponse()
  @ApiBody({ type: UpdateUserDTO })
  @ApiConsumes('multipart/form-data')
  async update(
    @GetUser() id: number,
    @Body(
      new YupValidationPipe(UserSchema),
      new ValidationPipe({ transform: true }),
    )
    data: UpdateUserDTO,
    @UploadedFile() image?: BufferFile,
  ): Promise<UserResponse> {
    return await this.authService.updateUser(id, data, image);
  }
}
