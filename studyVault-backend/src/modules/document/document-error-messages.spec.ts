import {
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { mkdtemp, readdir, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { DocumentService } from './document.service';
import { UpdateDocumentNameDto } from './dtos/update-document-name.dto';
import { CreateFolderDto } from '../folder/dtos/create-folder.dto';
import { AskRagDto } from '../rag/dtos/ask-rag.dto';

const createService = (overrides: Partial<Record<string, unknown>> = {}) => {
  const documentRepository = {
    findOne: jest.fn().mockResolvedValue(null),
    ...((overrides.documentRepository as object) || {}),
  };
  const folderRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    ...((overrides.folderRepository as object) || {}),
  };
  const dataSource = {
    transaction: jest.fn(),
    ...((overrides.dataSource as object) || {}),
  };
  const userDocumentRepository = {
    create: jest.fn(),
    findOne: jest.fn(),
    ...((overrides.userDocumentRepository as object) || {}),
  };

  return new DocumentService(
    documentRepository as never,
    {} as never,
    userDocumentRepository as never,
    folderRepository as never,
    dataSource as never,
  );
};

describe('document-facing error messages', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('explains when a file contains no extractable text', async () => {
    const service = createService();
    const file = {
      buffer: Buffer.from('   '),
      mimetype: 'text/plain',
    } as Express.Multer.File;

    await expect(
      (
        service as never as {
          extractTextFromFile(file: Express.Multer.File): Promise<string>;
        }
      ).extractTextFromFile(file),
    ).rejects.toMatchObject({
      response: {
        message:
          'We could not read any text from this file. Upload a text-based PDF, DOCX, or TXT file; scanned or image-only files are not supported yet.',
      },
    });
  });

  it('uses a server-side message when saving an upload fails', async () => {
    const uploadDirectory = await mkdtemp(join(tmpdir(), 'studyvault-upload-'));
    const service = createService({
      dataSource: {
        transaction: jest.fn().mockRejectedValue(new Error('database offline')),
      },
    });
    (service as never as { uploadsDirectory: string }).uploadsDirectory =
      uploadDirectory;
    const upload = () =>
      service.uploadDocument(
        {
          buffer: Buffer.from('hello world'),
          mimetype: 'text/plain',
          originalname: 'notes.txt',
          size: 11,
        } as Express.Multer.File,
        { title: 'notes.txt' },
        'user-1',
      );

    try {
      await expect(upload()).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );

      await expect(upload()).rejects.toMatchObject({
        response: {
          message:
            'The document could not be saved. Please try again in a moment.',
        },
      });
    } finally {
      await rm(uploadDirectory, { recursive: true, force: true });
    }
  });

  it('keeps client upload errors as bad requests', async () => {
    const service = createService();

    await expect(
      service.uploadDocument(
        {
          buffer: Buffer.alloc(0),
          mimetype: 'text/plain',
          originalname: 'empty.txt',
          size: 0,
        } as Express.Multer.File,
        { title: 'empty.txt' },
        'user-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not attach a duplicate document before folder validation succeeds', async () => {
    const userDocumentRepository = {
      create: jest.fn(),
    };
    const service = createService({
      documentRepository: {
        findOne: jest.fn().mockResolvedValue({
          id: 'document-1',
          title: 'Shared notes',
          fileRef: '/uploads/shared.txt',
          chunks: [],
        }),
        findByContentHashAndUser: jest.fn().mockResolvedValue(null),
      },
      folderRepository: {
        findOne: jest.fn().mockResolvedValue(null),
      },
      userDocumentRepository,
    });

    await expect(
      service.uploadDocument(
        {
          buffer: Buffer.from('same content'),
          mimetype: 'text/plain',
          originalname: 'shared.txt',
          size: 12,
        } as Express.Multer.File,
        {
          folderId: '22222222-2222-4222-8222-222222222222',
          title: 'shared.txt',
        },
        'user-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(userDocumentRepository.create).not.toHaveBeenCalled();
  });

  it('does not write a new file or create a document before folder validation succeeds', async () => {
    const uploadDirectory = await mkdtemp(join(tmpdir(), 'studyvault-upload-'));
    const service = createService({
      documentRepository: {
        findOne: jest.fn().mockResolvedValue(null),
      },
      folderRepository: {
        findOne: jest.fn().mockResolvedValue(null),
      },
    });
    (service as never as { uploadsDirectory: string }).uploadsDirectory =
      uploadDirectory;
    const createDocument = jest
      .spyOn(service, 'createDocument')
      .mockResolvedValue({
        chunks: [],
        contentHash: 'hash',
        createdAt: new Date(),
        docDate: null,
        extraAttributes: {},
        fileRef: '/uploads/new.txt',
        id: 'document-1',
        metadata: {},
        status: 'ready',
        title: 'new.txt',
        updatedAt: new Date(),
      });

    try {
      await expect(
        service.uploadDocument(
          {
            buffer: Buffer.from('new content'),
            mimetype: 'text/plain',
            originalname: 'new.txt',
            size: 11,
          } as Express.Multer.File,
          {
            folderId: '22222222-2222-4222-8222-222222222222',
            title: 'new.txt',
          },
          'user-1',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);

      await expect(readdir(uploadDirectory)).resolves.toHaveLength(0);
      expect(createDocument).not.toHaveBeenCalled();
    } finally {
      await rm(uploadDirectory, { recursive: true, force: true });
    }
  });

  it('rejects a forged PDF whose bytes do not match the declared type', () => {
    const service = createService();
    const file = {
      buffer: Buffer.from('This is not a real PDF file.'),
      mimetype: 'application/pdf',
      originalname: 'fake.pdf',
      size: 28,
    } as Express.Multer.File;

    expect(() =>
      (
        service as never as {
          validateUploadFile(file: Express.Multer.File): void;
        }
      ).validateUploadFile(file),
    ).toThrow(BadRequestException);
  });

  it('sanitizes uploaded file names before using them in storage paths', () => {
    const service = createService();

    const safeName = (
      service as never as {
        sanitizeOriginalFileName(originalName: string): string;
      }
    ).sanitizeOriginalFileName('../dangerous\\lecture<script>.pdf');

    expect(safeName).not.toContain('/');
    expect(safeName).not.toContain('\\');
    expect(safeName).toMatch(/lecture_script_\.pdf$/);
  });
});

describe('validation error messages', () => {
  it('uses clear validation messages for renaming a document', async () => {
    const dto = new UpdateDocumentNameDto();
    dto.newDocumentName = '';

    const errors = await validate(dto);

    expect(errors[0].constraints).toEqual(
      expect.objectContaining({
        isNotEmpty: 'Document name is required.',
      }),
    );
  });

  it('uses clear validation messages for creating folders', async () => {
    const dto = new CreateFolderDto();
    dto.name = '';
    dto.parentId = 'not-a-folder-id';

    const errors = await validate(dto);
    const messages = errors.flatMap((error) =>
      Object.values(error.constraints || {}),
    );

    expect(messages).toEqual(
      expect.arrayContaining([
        'Folder name is required.',
        'Parent folder id must be valid.',
      ]),
    );
  });

  it('uses clear validation messages for asking document questions', async () => {
    const dto = new AskRagDto();
    dto.question = 'a';

    const errors = await validate(dto);

    expect(errors[0].constraints).toEqual(
      expect.objectContaining({
        minLength: 'Question must be at least 2 characters.',
      }),
    );
  });
});
