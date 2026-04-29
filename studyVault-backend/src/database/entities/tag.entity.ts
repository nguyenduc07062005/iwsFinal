import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { UserDocumentTag } from './user-document-tag.entity';

export enum TagType {
  SUBJECT = 'SUBJECT',
  TOPIC = 'TOPIC',
  PURPOSE = 'PURPOSE',
  TAG = 'TAG',
}

@Entity('tags')
@Index(['ownerId', 'name', 'type'])
export class Tag extends BaseEntity {
  @Column({ type: 'uuid', name: 'owner_id' })
  ownerId: string;

  @Column({ type: 'varchar', length: 80 })
  name: string;

  @Column({
    name: 'type',
    type: 'enum',
    enum: TagType,
    default: TagType.TAG,
  })
  type: TagType;

  @Column({ name: 'color', type: 'varchar', length: 24, default: '#9b3f36' })
  color: string;

  @ManyToOne(() => User, (user) => user.tags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @OneToMany(() => UserDocumentTag, (documentTag) => documentTag.tag)
  userDocumentTags: UserDocumentTag[];
}
