import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class Tag {
  @PrimaryKey()
  id!: number;

  @Property()
  tag!: string;

  @Property({ default: 0 })
  count!: number;

  constructor(tag: string) {
    this.tag = tag;
  }
}
