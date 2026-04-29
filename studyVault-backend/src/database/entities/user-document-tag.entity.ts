import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Tag } from './tag.entity';
import { UserDocument } from './user-document.entity';

@Entity('user_document_tags')
export class UserDocumentTag {
  @PrimaryColumn({ name: 'user_document_id', type: 'uuid' })
  userDocumentId: string;

  @PrimaryColumn({ name: 'tag_id', type: 'uuid' })
  tagId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(
    () => UserDocument,
    (userDocument) => userDocument.userDocumentTags,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'user_document_id' })
  userDocument: UserDocument;

  @ManyToOne(() => Tag, (tag) => tag.userDocumentTags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag: Tag;
}
