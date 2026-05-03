import { BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { In } from 'typeorm';
import { Chunk } from 'src/database/entities/chunks.entity';
import { Document } from 'src/database/entities/document.entity';
import { UserDocument } from 'src/database/entities/user-document.entity';
import { UserDocumentTag } from 'src/database/entities/user-document-tag.entity';
import { ChunkRepository } from 'src/database/repositories/chunks.repository';
import { DocumentRepository } from 'src/database/repositories/document.repository';
import { FolderRepository } from 'src/database/repositories/folder.repository';
import { UserDocumentRepository } from 'src/database/repositories/user-document.repository';
import { DocumentService } from './document.service';

const createService = (dataSource: unknown) =>
  new DocumentService(
    {} as never as DocumentRepository,
    {} as never as ChunkRepository,
    {} as never as UserDocumentRepository,
    {} as never as FolderRepository,
    dataSource as never,
  );

describe('DocumentService.updateDocumentName', () => {
  it('rejects document names that are only whitespace', async () => {
    const save = jest.fn();
    const findOne = jest.fn().mockResolvedValue({
      id: 'user-doc-1',
      documentName: 'Original',
    });
    const dataSource = {
      getRepository: jest.fn().mockReturnValue({ findOne, save }),
    };
    const service = createService(dataSource);

    await expect(
      service.updateDocumentName('user-1', 'doc-1', '   '),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(save).not.toHaveBeenCalled();
  });
});

describe('DocumentService.uploadDocument duplicate folders', () => {
  const createTextFile = (): Express.Multer.File =>
    ({
      buffer: Buffer.from('same file body for duplicate folder upload'),
      mimetype: 'text/plain',
      originalname: 'notes.txt',
      size: 43,
    }) as Express.Multer.File;

  const createUploadManager = () => {
    const userDocumentTagRepository = {
      create: jest.fn((payload: unknown) => payload),
      delete: jest.fn().mockResolvedValue({ affected: 0 }),
      save: jest.fn().mockResolvedValue([]),
    };
    const manager = {
      create: jest.fn((_entity: unknown, payload: Record<string, unknown>) => ({
        ...payload,
      })),
      getRepository: jest.fn((entity: unknown) => {
        if (entity === UserDocumentTag) {
          return userDocumentTagRepository;
        }

        throw new Error('Unexpected repository');
      }),
      save: jest.fn((entity: unknown, payload: unknown) => {
        if (entity === Document) {
          if (Array.isArray(payload)) {
            return (payload as Record<string, unknown>[]).map(
              (chunk, index) => ({
                ...chunk,
                id: `chunk-${index + 1}`,
              }),
            );
          }

          const documentPayload = payload as Record<string, unknown>;
          if (documentPayload.id) {
            return documentPayload;
          }

          return {
            ...documentPayload,
            id: 'new-doc',
            createdAt: new Date('2026-05-02T00:00:00.000Z'),
            updatedAt: new Date('2026-05-02T00:00:00.000Z'),
          };
        }

        if (entity === UserDocument) {
          return {
            ...(payload as Record<string, unknown>),
            id: 'new-user-doc',
          };
        }

        return payload;
      }),
    };

    return { manager, userDocumentTagRepository };
  };

  beforeEach(() => {
    jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
    jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    jest.spyOn(fs, 'rm').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates a separate document when the same owner uploads the same file to another folder', async () => {
    const documentRepository = {
      findByContentHashAndUser: jest.fn().mockResolvedValue({
        id: 'existing-doc-owned-by-user',
      }),
      findByContentHashAndUserAndFolder: jest.fn().mockResolvedValue(null),
      findOne: jest.fn().mockResolvedValue({
        id: 'existing-doc-owned-by-user',
        chunks: [{ id: 'chunk-1' }],
      }),
    };
    const folderRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 'folder-b',
        ownerId: 'user-1',
      }),
    };
    const { manager } = createUploadManager();
    const dataSource = {
      transaction: jest.fn((callback: (value: unknown) => unknown) =>
        callback(manager),
      ),
    };
    const service = new DocumentService(
      documentRepository as never,
      {} as never,
      {} as never,
      folderRepository as never,
      dataSource as never,
    );

    const result = await service.uploadDocument(
      createTextFile(),
      { title: 'Notes', folderId: 'folder-b' },
      'user-1',
    );

    expect(result.id).toBe('new-doc');
    expect(documentRepository.findByContentHashAndUser).toHaveBeenCalledWith(
      expect.any(String),
      'user-1',
    );
    expect(manager.save).toHaveBeenCalledWith(
      Document,
      expect.objectContaining({
        contentHash: expect.any(String) as unknown,
        title: 'Notes',
      }),
    );
  });

  it('rejects uploading the same file twice into the same folder', async () => {
    const documentRepository = {
      findByContentHashAndUser: jest.fn(),
      findByContentHashAndUserAndFolder: jest.fn().mockResolvedValue({
        id: 'same-folder-doc',
      }),
      findOne: jest.fn().mockResolvedValue({
        id: 'existing-doc',
        chunks: [{ id: 'chunk-1' }],
      }),
    };
    const folderRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 'folder-a',
        ownerId: 'user-1',
      }),
    };
    const dataSource = {
      transaction: jest.fn(),
    };
    const service = new DocumentService(
      documentRepository as never,
      {} as never,
      {} as never,
      folderRepository as never,
      dataSource as never,
    );

    await expect(
      service.uploadDocument(
        createTextFile(),
        { title: 'Notes', folderId: 'folder-a' },
        'user-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(dataSource.transaction).not.toHaveBeenCalled();
    expect(fs.writeFile).not.toHaveBeenCalled();
  });
});

describe('DocumentService.deleteDocument', () => {
  it('bulk deletes only chunks that are exclusive to the deleted document', async () => {
    const accessQueryBuilder = {
      addSelect: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({
        documentId: 'doc-1',
        fileRef: null,
        title: 'Document',
      }),
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
    };
    const exclusiveChunkQueryBuilder = {
      getRawMany: jest.fn().mockResolvedValue([{ id: 'chunk-1' }]),
      groupBy: jest.fn().mockReturnThis(),
      having: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
    };
    const documentRepo = {
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const chunkRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(exclusiveChunkQueryBuilder),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      find: jest.fn().mockResolvedValue([{ id: 'chunk-1' }, { id: 'chunk-2' }]),
    };
    const userDocumentRepo = {
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn().mockReturnValue(accessQueryBuilder),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const transactionManager = {
      getRepository: jest.fn((entity: unknown) => {
        if (entity === Document) return documentRepo;
        if (entity === Chunk) return chunkRepo;
        if (entity === UserDocument) return userDocumentRepo;
        throw new Error('Unexpected repository');
      }),
    };
    type TransactionCallback<T> = (
      manager: typeof transactionManager,
    ) => Promise<T> | T;
    const dataSource = {
      transaction: jest.fn(<T>(callback: TransactionCallback<T>) =>
        callback(transactionManager),
      ),
    };
    const service = createService(dataSource);

    await expect(
      service.deleteDocument('user-1', 'doc-1'),
    ).resolves.toMatchObject({
      removedFromLibraryOnly: false,
    });

    expect(chunkRepo.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(exclusiveChunkQueryBuilder.having).toHaveBeenCalledWith(
      'COUNT(document.id) = 1',
    );
    expect(chunkRepo.delete).toHaveBeenCalledWith({ id: In(['chunk-1']) });
  });
});
