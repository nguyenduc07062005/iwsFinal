import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserDocument } from 'src/database/entities/user-document.entity';
import { StudyNote } from 'src/database/entities/study-note.entity';
import { StudyNoteDto } from './dtos/study-note.dto';

type StudyNoteSummary = {
  id: string;
  content: string;
  userDocumentId: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class DocumentNotesService {
  constructor(private readonly dataSource: DataSource) {}

  async listStudyNotes(
    documentId: string,
    ownerId: string,
  ): Promise<StudyNoteSummary[]> {
    const userDocument = await this.findUserDocumentForOwner(
      documentId,
      ownerId,
    );

    if (!userDocument) {
      throw new NotFoundException('Document not found or not owned by user');
    }

    const notes = await this.dataSource.getRepository(StudyNote).find({
      where: { userId: ownerId, userDocumentId: userDocument.id },
      order: { updatedAt: 'DESC', createdAt: 'DESC' },
    });

    return notes.map((note) => this.toStudyNoteSummary(note));
  }

  async createStudyNote(
    documentId: string,
    ownerId: string,
    dto: StudyNoteDto,
  ): Promise<StudyNoteSummary> {
    const userDocument = await this.findUserDocumentForOwner(
      documentId,
      ownerId,
    );

    if (!userDocument) {
      throw new NotFoundException('Document not found or not owned by user');
    }

    const content = dto.content.trim();
    if (!content) {
      throw new BadRequestException('Note content is required');
    }

    const noteRepository = this.dataSource.getRepository(StudyNote);
    const note = noteRepository.create({
      userId: ownerId,
      userDocumentId: userDocument.id,
      content,
    });

    return this.toStudyNoteSummary(await noteRepository.save(note));
  }

  async updateStudyNote(
    noteId: string,
    ownerId: string,
    dto: StudyNoteDto,
  ): Promise<StudyNoteSummary> {
    const noteRepository = this.dataSource.getRepository(StudyNote);
    const note = await noteRepository.findOne({
      where: { id: noteId, userId: ownerId },
    });

    if (!note) {
      throw new NotFoundException('Study note not found');
    }

    const content = dto.content.trim();
    if (!content) {
      throw new BadRequestException('Note content is required');
    }

    note.content = content;
    return this.toStudyNoteSummary(await noteRepository.save(note));
  }

  async deleteStudyNote(
    noteId: string,
    ownerId: string,
  ): Promise<{ id: string }> {
    const noteRepository = this.dataSource.getRepository(StudyNote);
    const note = await noteRepository.findOne({
      where: { id: noteId, userId: ownerId },
    });

    if (!note) {
      throw new NotFoundException('Study note not found');
    }

    await noteRepository.delete(note.id);
    return { id: note.id };
  }

  private async findUserDocumentForOwner(
    documentId: string,
    ownerId: string,
  ): Promise<UserDocument | null> {
    const repository = this.dataSource.getRepository(UserDocument);

    const byDocumentId = await repository.findOne({
      where: { document: { id: documentId }, user: { id: ownerId } },
      relations: ['document'],
    });

    if (byDocumentId) {
      return byDocumentId;
    }

    return repository.findOne({
      where: { id: documentId, user: { id: ownerId } },
      relations: ['document'],
    });
  }

  private toStudyNoteSummary(note: StudyNote): StudyNoteSummary {
    return {
      id: note.id,
      content: note.content,
      userDocumentId: note.userDocumentId,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  }
}
