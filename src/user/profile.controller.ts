import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { GetUser } from '../auth/user.decorator';
import { ProfileResponse } from '../models/user.model';
import { AuthGuard } from '../utils/auth.guard';

@ApiTags('Profile Operation')
@Controller('profiles')
export class ProfileController {
  constructor(private userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Get Profiles' })
  @ApiOkResponse({ description: 'List of Profiles', type: [ProfileResponse] })
  async findAllProfiles(
    @Query('search') search: string,
    @GetUser() user: number,
  ): Promise<ProfileResponse[]> {
    return await this.userService.getAllProfiles(search, user);
  }

  @Get('/:username')
  @ApiOperation({ summary: 'Get Profile By Name' })
  @ApiOkResponse({ description: 'Single Profile', type: ProfileResponse })
  async findProfile(
    @Param('username') username: string,
    @GetUser() user: number,
  ): Promise<ProfileResponse> {
    return await this.userService.findByUsername(username, user);
  }

  @Post('/:username/follow')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Follow User' })
  @ApiOkResponse({
    description: 'Successfully followed',
    type: ProfileResponse,
  })
  @ApiUnauthorizedResponse()
  async followUser(
    @GetUser() user: number,
    @Param('username') username: string,
  ): Promise<ProfileResponse> {
    return await this.userService.followUser(user, username);
  }

  @Delete('/:username/follow')
  @UseGuards(AuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Unfollow User' })
  @ApiOkResponse({
    description: 'Successfully unfollowed',
    type: ProfileResponse,
  })
  @ApiUnauthorizedResponse()
  async unfollowUser(
    @GetUser() user: number,
    @Param('username') username: string,
  ): Promise<ProfileResponse> {
    return await this.userService.unfollowUser(user, username);
  }
}
