import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { expr } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { User } from '../entities/user.entity';
import { ProfileResponse } from '../models/user.model';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: EntityRepository<User>,
  ) {}

  async findByUsername(
    username: string,
    user?: number,
  ): Promise<ProfileResponse> {
    const profile = await this.userRepository.findOneOrFail({ username }, [
      'followersCollection',
    ]);
    const currentUser = user
      ? await this.userRepository.findOneOrFail({ id: user })
      : undefined;
    return profile.toProfile(currentUser);
  }

  async getAllProfiles(
    search?: string,
    user?: number,
  ): Promise<ProfileResponse[]> {
    const query = new RegExp(search?.toLowerCase() || '');
    const profiles = await this.userRepository.find(
      {
        $or: [
          { [expr('lower(username)')]: query },
          { [expr('lower(bio)')]: query },
        ],
      },
      { populate: ['followersCollection'], limit: 20 },
    );
    const currentUser = user
      ? await this.userRepository.findOneOrFail({ id: user })
      : undefined;
    return profiles.map((p) => p.toProfile(currentUser));
  }

  async followUser(id: number, username: string): Promise<ProfileResponse> {
    const currentUser = await this.userRepository.findOneOrFail({ id });
    const user = await this.userRepository.findOneOrFail(
      {
        username,
      },
      ['followersCollection'],
    );

    if (currentUser.id === user.id) {
      throw new HttpException(
        'You cannot follow yourself.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      user.followersCollection.isInitialized() &&
      user.followersCollection.contains(currentUser)
    ) {
      return user.toProfile(currentUser);
    }

    user.followersCollection.add(currentUser);
    user.followers++;
    currentUser.followee++;
    await this.userRepository.flush();

    return user.toProfile(currentUser);
  }

  async unfollowUser(id: number, username: string): Promise<ProfileResponse> {
    const currentUser = await this.userRepository.findOneOrFail({ id });
    const user = await this.userRepository.findOneOrFail(
      {
        username,
      },
      ['followersCollection'],
    );

    if (
      user.followersCollection.isInitialized() &&
      !user.followersCollection.contains(currentUser)
    ) {
      return user.toProfile(currentUser);
    }

    user.followersCollection.remove(currentUser);
    user.followers--;
    currentUser.followee--;
    await this.userRepository.flush();
    return user.toProfile(currentUser);
  }
}
