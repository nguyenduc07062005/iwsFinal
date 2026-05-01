import { NotFoundException } from '@nestjs/common';
import { Tag } from 'src/database/entities/tag.entity';
import { UserDocument } from 'src/database/entities/user-document.entity';
import { StudyNote } from 'src/database/entities/study-note.entity';
import { DocumentRepository } from 'src/database/repositories/document.repository';
import { ChunkRepository } from 'src/database/repositories/chunks.repository';
import { FolderRepository } from 'src/database/repositories/folder.repository';
import { UserDocumentRepository } from 'src/database/repositories/user-document.repository';
import { DocumentService } from '../document/document.service';
import { FolderService } from '../folder/folder.service';
import { TagService } from '../tag/tag.service';

const USER_A_ID = '11111111-1111-4111-8111-111111111111';
const FOLDER_ID = '22222222-2222-4222-8222-222222222222';
const DOCUMENT_ID = '33333333-3333-4333-8333-333333333333';
const NOTE_ID = '44444444-4444-4444-8444-444444444444';
const TAG_ID = '55555555-5555-4555-8555-555555555555';

describe('security regression ownership checks', () => {
  it('requires folder reads to match the authenticated owner', async () => {
    const folderRepository = {
      findOne: jest.fn().mockResolvedValue(null),
    };
    const service = new FolderService(
      folderRepository as never as FolderRepository,
      {} as never as DocumentRepository,
      {} as never as UserDocumentRepository,
      {} as never,
    );

    await expect(service.getFolderById(FOLDER_ID, USER_A_ID)).rejects.toThrow(
      NotFoundException,
    );

    expect(folderRepository.findOne).toHaveBeenCalledWith({
      where: { id: FOLDER_ID, ownerId: USER_A_ID },
      relations: ['children', 'userDocuments'],
    });
  });

  it('requires document organization to use a document owned by the authenticated user', async () => {
    const folderRepository = {
      findOne: jest
        .fn()
        .mockResolvedValue({ id: FOLDER_ID, ownerId: USER_A_ID }),
    };
    const documentRepository = {
      findByIdAndOwner: jest.fn().mockResolvedValue(null),
    };
    const userDocumentRepository = {
      getRepository: jest.fn(),
    };
    const service = new FolderService(
      folderRepository as never as FolderRepository,
      documentRepository as never as DocumentRepository,
      userDocumentRepository as never as UserDocumentRepository,
      {} as never,
    );

    await expect(
      service.addDocumentToFolder(FOLDER_ID, DOCUMENT_ID, USER_A_ID),
    ).rejects.toThrow(NotFoundException);

    expect(documentRepository.findByIdAndOwner).toHaveBeenCalledWith(
      DOCUMENT_ID,
      USER_A_ID,
    );
    expect(userDocumentRepository.getRepository).not.toHaveBeenCalled();
  });

  it('requires tag updates to match the authenticated owner', async () => {
    const tagRepository = {
      findOne: jest.fn().mockResolvedValue(null),
    };
    const dataSource = {
      getRepository: jest.fn().mockReturnValue(tagRepository),
    };
    const service = new TagService(dataSource as never);

    await expect(
      service.updateTag(USER_A_ID, TAG_ID, { name: 'Security' }),
    ).rejects.toThrow(NotFoundException);

    expect(dataSource.getRepository).toHaveBeenCalledWith(Tag);
    expect(tagRepository.findOne).toHaveBeenCalledWith({
      where: { id: TAG_ID, ownerId: USER_A_ID },
    });
  });

  it('requires document tag reads to match the authenticated owner', async () => {
    const userDocumentRepository = {
      findOne: jest.fn().mockResolvedValue(null),
    };
    const dataSource = {
      getRepository: jest.fn().mockReturnValue(userDocumentRepository),
    };
    const service = new DocumentService(
      {} as never as DocumentRepository,
      {} as never as ChunkRepository,
      {} as never as UserDocumentRepository,
      {} as never as FolderRepository,
      dataSource as never,
    );

    await expect(
      service.getDocumentTags(DOCUMENT_ID, USER_A_ID),
    ).rejects.toThrow(NotFoundException);

    expect(dataSource.getRepository).toHaveBeenCalledWith(UserDocument);
    expect(userDocumentRepository.findOne).toHaveBeenNthCalledWith(1, {
      where: { document: { id: DOCUMENT_ID }, user: { id: USER_A_ID } },
      relations: ['document', 'userDocumentTags', 'userDocumentTags.tag'],
    });
    expect(userDocumentRepository.findOne).toHaveBeenNthCalledWith(2, {
      where: { id: DOCUMENT_ID, user: { id: USER_A_ID } },
      relations: ['document', 'userDocumentTags', 'userDocumentTags.tag'],
    });
  });

  it('requires study note updates to match the authenticated user', async () => {
    const noteRepository = {
      findOne: jest.fn().mockResolvedValue(null),
    };
    const dataSource = {
      getRepository: jest.fn().mockImplementation((entity) => {
        if (entity === StudyNote) {
          return noteRepository;
        }

        return {};
      }),
    };
    const service = new DocumentService(
      {} as never as DocumentRepository,
      {} as never as ChunkRepository,
      {} as never as UserDocumentRepository,
      {} as never as FolderRepository,
      dataSource as never,
    );

    await expect(
      service.updateStudyNote(NOTE_ID, USER_A_ID, {
        content: 'Only the note owner can update this.',
      }),
    ).rejects.toThrow(NotFoundException);

    expect(dataSource.getRepository).toHaveBeenCalledWith(StudyNote);
    expect(noteRepository.findOne).toHaveBeenCalledWith({
      where: { id: NOTE_ID, userId: USER_A_ID },
    });
  });
});
