import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { UserDocument } from './user-document.entity';

@Entity('study_notes')
export class StudyNote extends BaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'user_document_id' })
  userDocumentId: string;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => User, (user) => user.studyNotes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => UserDocument, (userDocument) => userDocument.studyNotes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_document_id' })
  userDocument: UserDocument;
}
