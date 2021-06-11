import {
  BeforeCreate,
  Collection,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryKey,
  Property,
  wrap,
} from '@mikro-orm/core';
import * as bcrypt from 'bcryptjs';
import {
  ProfileResponse,
  RegisterDTO,
  UserResponse,
} from '../models/user.model';
import { Article } from './article.entity';

@Entity()
export class User {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'date' })
  createdAt = new Date();

  @Property({ type: 'date', onUpdate: () => new Date() })
  updatedAt = new Date();

  @Property({ hidden: true, unique: true })
  email!: string;

  @Property({ unique: true })
  username!: string;

  @Property({ default: '' })
  bio!: string;

  @Property()
  image!: string;

  @Property({ hidden: true })
  password!: string;

  @ManyToMany({ hidden: true })
  favorites = new Collection<Article>(this);

  @ManyToMany({ hidden: true })
  bookmarks = new Collection<Article>(this);

  @Property({ default: 0 })
  followers!: number;

  @Property({ default: 0 })
  followee!: number;

  @ManyToMany({
    entity: () => User,
    inversedBy: (u) => u.followeeCollection,
    owner: true,
    pivotTable: 'user_to_follower',
    joinColumn: 'follower',
    inverseJoinColumn: 'following',
    hidden: true,
  })
  followersCollection = new Collection<User>(this);

  @ManyToMany(() => User, (u) => u.followersCollection, { hidden: true })
  followeeCollection = new Collection<User>(this);

  @OneToMany(() => Article, (article) => article.author, { hidden: true })
  articles = new Collection<Article>(this);

  constructor({ username, email, password }: RegisterDTO) {
    this.username = username;
    this.email = email;
    this.password = password;
  }

  @BeforeCreate()
  async hashPassword(): Promise<void> {
    this.password = await bcrypt.hash(this.password, 10);
  }

  async comparePassword(attempt: string): Promise<boolean> {
    return await bcrypt.compare(attempt, this.password);
  }

  toJSON(): UserResponse {
    const o = wrap(this).toObject();
    o.email = this.email;
    return o as UserResponse;
  }

  toProfile(user?: User): ProfileResponse {
    const o = wrap(this).toObject();
    o.following =
      user && this.followersCollection.isInitialized()
        ? this.followersCollection.contains(user)
        : false;
    return o as ProfileResponse;
  }
}
