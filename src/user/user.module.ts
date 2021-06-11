import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ProfileController } from './profile.controller';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AuthModule } from '../auth/auth.module';
import { User } from '../entities/user.entity';

@Module({
  imports: [MikroOrmModule.forFeature({ entities: [User] }), AuthModule],
  providers: [UserService],
  controllers: [UserController, ProfileController],
})
export class UserModule {}
