import {
  Body,
  Controller,
  Post,
  Put,
  Req,
  Res,
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
import e from 'express';
import { AuthService } from './auth.service';
import { GetUser } from './user.decorator';
import {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginDTO,
  RegisterDTO,
  ResetPasswordInput,
  UserResponse,
} from '../models/user.model';
import {
  ChangePasswordSchema,
  ForgotPasswordSchema,
  LoginSchema,
  RegisterSchema,
  ResetPasswordSchema,
} from '../schemas/user.schema';
import { YupValidationPipe } from '../utils/yupValidationPipe';
import { COOKIE_NAME } from '../utils/constants';
import { AuthGuard } from '../utils/auth.guard';

@ApiTags('Auth Operation')
@Controller('users')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post()
  @ApiOperation({ summary: 'Register Account' })
  @ApiCreatedResponse({ description: 'Newly Created User' })
  @ApiBody({ type: RegisterDTO })
  async register(
    @Body(new YupValidationPipe(RegisterSchema)) credentials: RegisterDTO,
    @Req() req: e.Request,
  ): Promise<UserResponse> {
    return await this.authService.register(credentials, req);
  }

  @Post('/login')
  @ApiOperation({ summary: 'User Login' })
  @ApiOkResponse({ description: 'Current User', type: UserResponse })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiBody({ type: LoginDTO })
  async login(
    @Body(new YupValidationPipe(LoginSchema)) credentials: LoginDTO,
    @Req() req: e.Request,
  ): Promise<UserResponse> {
    return await this.authService.login(credentials, req);
  }

  @Post('/logout')
  @ApiOperation({ summary: 'User Logout' })
  async logout(@Req() req: e.Request, @Res() res: e.Response): Promise<any> {
    req.session?.destroy((err) => console.log(err));
    return res.clearCookie(COOKIE_NAME).status(200).send(true);
  }

  @Put('change-password')
  @UseGuards(AuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Change Current User Password' })
  @ApiCreatedResponse({ description: 'successfully changed password' })
  @ApiUnauthorizedResponse()
  @ApiBody({ type: ChangePasswordInput })
  async changePassword(
    @Body(new YupValidationPipe(ChangePasswordSchema))
    input: ChangePasswordInput,
    @GetUser() id: number,
  ): Promise<Record<string, any>> {
    return await this.authService.changePassword(input, id);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Forgot Password Request' })
  @ApiCreatedResponse({ description: 'Send Email' })
  async forgotPassword(
    @Body(new YupValidationPipe(ForgotPasswordSchema))
    { email }: ForgotPasswordInput,
  ): Promise<boolean> {
    return await this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset Password' })
  @ApiCreatedResponse({ description: 'successfully reset password' })
  @ApiBody({ type: ResetPasswordInput })
  async resetPassword(
    @Body(new YupValidationPipe(ResetPasswordSchema))
    input: ResetPasswordInput,
    @Req() req: e.Request,
  ): Promise<Record<string, any>> {
    return await this.authService.resetPassword(input, req);
  }
}
