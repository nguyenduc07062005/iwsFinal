import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { DocumentDto } from './dtos/document.dto';
import { Document } from 'src/database/entities/document.entity';
import { Chunk } from 'src/database/entities/chunks.entity';
import { UserDocument } from 'src/database/entities/user-document.entity';
import { Tag, TagType } from 'src/database/entities/tag.entity';
import { UserDocumentTag } from 'src/database/entities/user-document-tag.entity';
import { DocumentRepository } from 'src/database/repositories/document.repository';
import { ChunkRepository } from 'src/database/repositories/chunks.repository';
import { UserDocumentRepository } from 'src/database/repositories/user-document.repository';
import { FolderRepository } from 'src/database/repositories/folder.repository';
import {
  DocumentSortField,
  DocumentSortOrder,
  DocumentTypeFilter,
  ListDocumentsDto,
} from './dtos/list-documents.dto';
import {
  buildContainsLikePattern,
  escapeLikePattern,
} from 'src/common/database/like-pattern';
import { formatFileSize, getErrorMessage } from 'src/common/utils/format';

import {
  DataSource,
  EntityManager,
  In,
  IsNull,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';

import * as crypto from 'crypto';
import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';
import { promises as fs } from 'fs';
import * as path from 'path';

type CreatedDocumentResult = {
  id: string;
  title: string | null;
  metadata: Document['metadata'];
  docDate: Date | null;
  extraAttributes: Document['extraAttributes'];
  fileRef: string | null;
  contentHash: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  chunks: Chunk[];
};

type UploadDocumentResult = {
  id: string;
  ownerId: string;
  title: string | null;
  fileName: string | null;
  totalChunks: number;
};

type UserDocumentAccessRow = {
  fileRef: string | null;
  documentId: string;
  title: string | null;
};

type DeleteDocumentResult = {
  documentId: string;
  message: string;
  removedFromLibraryOnly: boolean;
  title: string | null;
};

type DocumentListFilters = {
  favorite?: boolean;
  folderId?: string;
  keyword?: string;
  sortBy: DocumentSortField;
  sortOrder: Uppercase<DocumentSortOrder>;
  subjectId?: string;
  tagId?: string;
  type?: DocumentTypeFilter;
};

type DocumentListResult = {
  documents: ReturnType<DocumentService['toDocumentSummary']>[];
  filters: DocumentListFilters;
  pagination: {
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const MAX_UPLOAD_FILE_SIZE_BYTES = 10 * 1024 * 1024;

type UploadTypeConfig = {
  extensions: readonly string[];
  mimeTypes: readonly string[];
};

const SUPPORTED_UPLOAD_TYPES = {
  pdf: {
    extensions: ['.pdf'],
    mimeTypes: ['application/pdf'],
  },
  docx: {
    extensions: ['.docx'],
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },
  txt: {
    extensions: ['.txt'],
    mimeTypes: ['text/plain'],
  },
} as const satisfies Record<string, UploadTypeConfig>;

type SupportedUploadType = keyof typeof SUPPORTED_UPLOAD_TYPES;

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);
  private readonly uploadsDirectory = path.resolve(process.cwd(), 'uploads');

  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly chunkRepository: ChunkRepository,
    private readonly userDocumentRepository: UserDocumentRepository,
    private readonly folderRepository: FolderRepository,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create document record in DB (with chunks)
   */
  async createDocument(
    dto: DocumentDto,
    contentHash?: string,
  ): Promise<CreatedDocumentResult> {
    return this.dataSource.transaction((manager) =>
      this.createDocumentWithChunks(manager, dto, contentHash),
    );
  }

  private async createDocumentWithChunks(
    manager: EntityManager,
    dto: DocumentDto,
    contentHash?: string,
  ): Promise<CreatedDocumentResult> {
    const document = manager.create(Document, {
      title: dto.title,
      metadata: dto.metadata || {},
      docDate: dto.docDate || undefined,
      extraAttributes: dto.extraAttributes || {},
      fileRef: dto.fileRef,
      fileSize: dto.fileSize,
      contentHash:
        contentHash ||
        this.generateContentHash(Buffer.from(dto.chunks?.join(' ') || '')),
      status: 'ready',
    });

    const savedDocument = await manager.save(Document, document);

    const chunks: Chunk[] = (dto.chunks || []).map((chunkText, idx) =>
      manager.create(Chunk, {
        documents: [savedDocument],
        chunkIndex: idx,
        chunkText,
        tokenCount: chunkText.split(/\s+/).length,
      }),
    );

    const savedChunks = await manager.save(Chunk, chunks);

    savedDocument.chunks = savedChunks;
    await manager.save(Document, savedDocument);

    return {
      id: savedDocument.id,
      title: savedDocument.title,
      metadata: savedDocument.metadata,
      docDate: savedDocument.docDate,
      extraAttributes: savedDocument.extraAttributes,
      fileRef: savedDocument.fileRef,
      contentHash: savedDocument.contentHash,
      status: savedDocument.status,
      createdAt: savedDocument.createdAt,
      updatedAt: savedDocument.updatedAt,
      chunks: savedDocument.chunks,
    };
  }

  /**
   * Handle document duplication logic.
   * Throws if the exact same file (by content hash) already exists in the same
   * folder for this user. If this user already has the same content elsewhere,
   * let the caller create a separate Document so document-id based routes stay
   * unambiguous for per-folder copies.
   */
  private async handleDocumentDuplication(
    contentHash: string,
    ownerId: string,
    targetFolderId: string,
  ): Promise<Document | null> {
    const existingDoc = await this.documentRepository.findOne({
      where: { contentHash },
      relations: ['chunks'],
    });

    if (!existingDoc) {
      return null;
    }

    const userDocInSameFolder =
      await this.documentRepository.findByContentHashAndUserAndFolder(
        contentHash,
        ownerId,
        targetFolderId,
      );

    if (userDocInSameFolder) {
      throw new BadRequestException(
        'This file already exists in the selected folder.',
      );
    }

    const ownerDocWithSameContent =
      await this.documentRepository.findByContentHashAndUser(
        contentHash,
        ownerId,
      );

    if (ownerDocWithSameContent) {
      return null;
    }

    return existingDoc;
  }

  /**
   * Extract text from file based on mimetype
   */
  private async extractTextFromFile(
    file: Express.Multer.File,
  ): Promise<string> {
    let text = '';

    switch (file.mimetype) {
      case 'application/pdf': {
        const parser = new PDFParse({ data: new Uint8Array(file.buffer) });
        const pdfResult = await parser.getText();
        text = pdfResult.text;
        break;
      }

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
        const docxData = await mammoth.extractRawText({ buffer: file.buffer });
        text = docxData.value;
        break;
      }

      case 'text/plain': {
        text = file.buffer.toString('utf-8');
        break;
      }
      default:
        throw new BadRequestException(
          'Only PDF, DOCX, or TXT files are supported.',
        );
    }

    // Remove null bytes
    text = text.split(String.fromCharCode(0)).join('');

    if (!text.trim()) {
      throw new BadRequestException(
        'We could not read any text from this file. Upload a text-based PDF, DOCX, or TXT file; scanned or image-only files are not supported yet.',
      );
    }

    return text;
  }

  sanitizeOriginalFileName(originalName: string): string {
    const baseName = path.basename(originalName || 'document.txt');
    const sanitizedName = baseName
      .normalize('NFKC')
      .replace(/[<>:"/\\|?*]+/g, '_')
      .replaceAll(/./g, (character) =>
        character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127
          ? '_'
          : character,
      )
      .replace(/\s+/g, ' ')
      .replace(/^\.+/, '')
      .trim()
      .slice(0, 180);

    return sanitizedName || 'document.txt';
  }

  validateUploadFile(file: Express.Multer.File): void {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException(
        'No readable file was received. Please choose a non-empty PDF, DOCX, or TXT file.',
      );
    }

    if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
      throw new BadRequestException('Maximum file size is 10MB.');
    }

    const uploadType = this.resolveUploadType(file);

    if (!this.doesFileContentMatchType(file.buffer, uploadType)) {
      throw new BadRequestException(
        'The uploaded file content does not match its file type.',
      );
    }
  }

  private resolveUploadType(file: Express.Multer.File): SupportedUploadType {
    const mimeType = String(file.mimetype || '')
      .toLowerCase()
      .split(';')[0]
      .trim();
    const extension = path.extname(file.originalname || '').toLowerCase();
    const typeByMime = this.findUploadTypeBy('mimeTypes', mimeType);
    const typeByExtension = this.findUploadTypeBy('extensions', extension);

    if (!typeByMime || !typeByExtension || typeByMime !== typeByExtension) {
      throw new BadRequestException(
        'Only PDF, DOCX, or TXT files are supported.',
      );
    }

    return typeByMime;
  }

  private findUploadTypeBy(
    key: keyof UploadTypeConfig,
    value: string,
  ): SupportedUploadType | undefined {
    return (Object.keys(SUPPORTED_UPLOAD_TYPES) as SupportedUploadType[]).find(
      (uploadType) => {
        const values: readonly string[] =
          SUPPORTED_UPLOAD_TYPES[uploadType][key];

        return values.includes(value);
      },
    );
  }

  private doesFileContentMatchType(
    buffer: Buffer,
    uploadType: SupportedUploadType,
  ): boolean {
    switch (uploadType) {
      case 'pdf':
        return buffer.subarray(0, 5).equals(Buffer.from('%PDF-'));
      case 'docx':
        return (
          this.hasZipHeader(buffer) &&
          buffer.includes(Buffer.from('[Content_Types].xml')) &&
          buffer.includes(Buffer.from('word/'))
        );
      case 'txt':
        return this.looksLikeText(buffer);
      default:
        return false;
    }
  }

  private hasZipHeader(buffer: Buffer): boolean {
    const zipHeaders = [
      Buffer.from([0x50, 0x4b, 0x03, 0x04]),
      Buffer.from([0x50, 0x4b, 0x05, 0x06]),
      Buffer.from([0x50, 0x4b, 0x07, 0x08]),
    ];

    return zipHeaders.some((header) =>
      buffer.subarray(0, header.length).equals(header),
    );
  }

  private looksLikeText(buffer: Buffer): boolean {
    return !buffer.some(
      (byte) =>
        byte === 0 || (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13),
    );
  }

  private async ensureRootFolder(ownerId: string) {
    const existingRoot = await this.folderRepository.findOne({
      where: { ownerId, parentId: IsNull() },
    });

    if (existingRoot) {
      return existingRoot;
    }

    return this.folderRepository.create({
      ownerId,
      name: 'Root',
      parentId: null,
    });
  }

  private async resolveTargetFolderId(
    ownerId: string,
    folderId?: string,
  ): Promise<string> {
    if (!folderId) {
      return (await this.ensureRootFolder(ownerId)).id;
    }

    const folder = await this.folderRepository.findOne({
      where: { id: folderId, ownerId },
    });

    if (!folder) {
      throw new BadRequestException(
        'The selected folder no longer exists or is not available.',
      );
    }

    return folder.id;
  }

  private async replaceUserDocumentTags(
    documentTagRepository: Repository<UserDocumentTag>,
    userDocumentId: string,
    tags: Tag[],
  ) {
    await documentTagRepository.delete({ userDocumentId });

    if (tags.length === 0) {
      return;
    }

    await documentTagRepository.save(
      tags.map((tag) =>
        documentTagRepository.create({
          userDocumentId,
          tagId: tag.id,
        }),
      ),
    );
  }

  /**
   * Upload file -> extract text -> chunk -> save to DB
   */
  async uploadDocument(
    file: Express.Multer.File,
    dto: DocumentDto,
    ownerId: string,
  ): Promise<UploadDocumentResult> {
    let savedFilePath: string | null = null;

    try {
      this.validateUploadFile(file);

      if (!dto.title || dto.title.trim().length === 0) {
        dto.title = file.originalname;
      }

      const contentHash = this.generateContentHash(file.buffer);

      // Resolve target folder BEFORE the duplicate check so we can do a
      // per-folder comparison instead of a library-wide one.
      const targetFolderId = await this.resolveTargetFolderId(
        ownerId,
        dto.folderId,
      );

      const duplicateDoc = await this.handleDocumentDuplication(
        contentHash,
        ownerId,
        targetFolderId,
      );

      if (duplicateDoc) {
        // Same file content already processed - reuse the existing Document
        // record and just create a new UserDocument in the requested folder.
        const tags = dto.tagIds?.length
          ? await this.getOwnedTags(ownerId, dto.tagIds)
          : [];

        await this.dataSource.transaction(async (manager) => {
          const userDocument = manager.create(UserDocument, {
            document: { id: duplicateDoc.id },
            documentName: dto.title || file.originalname,
            folder: { id: targetFolderId },
            isFavorite: false,
            user: { id: ownerId },
          });
          const savedUserDocument = await manager.save(
            UserDocument,
            userDocument,
          );

          await this.replaceUserDocumentTags(
            manager.getRepository(UserDocumentTag),
            savedUserDocument.id,
            tags,
          );
        });

        return {
          id: duplicateDoc.id,
          ownerId,
          title: duplicateDoc.title,
          fileName: duplicateDoc.fileRef,
          totalChunks: duplicateDoc.chunks?.length ?? 0,
        };
      }

      const text = await this.extractTextFromFile(file);
      const chunks = this.chunkText(text, 1000);
      // targetFolderId already resolved above
      const tags = dto.tagIds?.length
        ? await this.getOwnedTags(ownerId, dto.tagIds)
        : [];
      const uniqueName = `${crypto.randomUUID()}-${this.sanitizeOriginalFileName(
        file.originalname,
      )}`;
      await fs.mkdir(this.uploadsDirectory, { recursive: true });
      const filePath = path.join(this.uploadsDirectory, uniqueName);
      await fs.writeFile(filePath, file.buffer);
      savedFilePath = filePath;

      const documentDto: DocumentDto = {
        title: dto.title || file.originalname,
        metadata: dto.metadata || {},
        docDate: dto.docDate,
        extraAttributes: dto.extraAttributes || {},
        fileRef: filePath,
        fileSize: file.size,
        chunks,
      };

      const createdDoc = await this.dataSource.transaction(async (manager) => {
        const savedDocument = await this.createDocumentWithChunks(
          manager,
          documentDto,
          contentHash,
        );

        const userDocument = manager.create(UserDocument, {
          user: { id: ownerId },
          document: { id: savedDocument.id },
          folder: { id: targetFolderId },
          documentName: dto.title || file.originalname,
          isFavorite: false,
        });
        const savedUserDocument = await manager.save(
          UserDocument,
          userDocument,
        );

        await this.replaceUserDocumentTags(
          manager.getRepository(UserDocumentTag),
          savedUserDocument.id,
          tags,
        );

        return savedDocument;
      });
      savedFilePath = null;

      return {
        id: createdDoc.id,
        ownerId,
        title: createdDoc.title,
        fileName: createdDoc.fileRef,
        totalChunks: createdDoc.chunks.length,
      };
    } catch (error: unknown) {
      if (savedFilePath) {
        await fs.rm(savedFilePath, { force: true });
      }

      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Upload document failed: ${getErrorMessage(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        'The document could not be saved. Please try again in a moment.',
      );
    }
  }

  async getDocumentSummaryForOwner(documentId: string, ownerId: string) {
    const userDocument = await this.findUserDocumentForOwner(
      documentId,
      ownerId,
      ['document', 'folder', 'userDocumentTags', 'userDocumentTags.tag'],
    );

    if (!userDocument) {
      throw new NotFoundException('Document not found or not owned by user');
    }

    return this.toDocumentSummary(userDocument);
  }

  private async findUserDocumentForOwner(
    documentId: string,
    ownerId: string,
    relations: string[] = ['document', 'folder'],
  ) {
    const repository = this.dataSource.getRepository(UserDocument);

    const byDocumentId = await repository.findOne({
      where: { document: { id: documentId }, user: { id: ownerId } },
      relations,
    });

    if (byDocumentId) {
      return byDocumentId;
    }

    return repository.findOne({
      where: { id: documentId, user: { id: ownerId } },
      relations,
    });
  }

  private normalizeTagIds(tagIds: string[] = []) {
    return Array.from(new Set(tagIds.filter(Boolean)));
  }

  private async getOwnedTags(ownerId: string, tagIds: string[]) {
    const uniqueTagIds = this.normalizeTagIds(tagIds);

    if (uniqueTagIds.length === 0) {
      return [];
    }

    const tags = await this.dataSource.getRepository(Tag).find({
      where: { id: In(uniqueTagIds), ownerId },
      order: { type: 'ASC', name: 'ASC' },
    });

    if (tags.length !== uniqueTagIds.length) {
      throw new BadRequestException(
        'One or more selected tags no longer exist or are not available.',
      );
    }

    return tags;
  }

  private async syncUserDocumentTags(
    userDocumentId: string,
    ownerId: string,
    tagIds: string[],
  ) {
    const tags = await this.getOwnedTags(ownerId, tagIds);
    const documentTagRepository =
      this.dataSource.getRepository(UserDocumentTag);

    await this.replaceUserDocumentTags(
      documentTagRepository,
      userDocumentId,
      tags,
    );

    return tags;
  }

  async getDocumentTags(documentId: string, ownerId: string) {
    const userDocument = await this.findUserDocumentForOwner(
      documentId,
      ownerId,
      ['document', 'userDocumentTags', 'userDocumentTags.tag'],
    );

    if (!userDocument) {
      throw new NotFoundException('Document not found or not owned by user');
    }

    return this.getTagsFromUserDocument(userDocument);
  }

  async syncDocumentTags(
    documentId: string,
    ownerId: string,
    tagIds: string[],
  ) {
    const userDocument = await this.findUserDocumentForOwner(
      documentId,
      ownerId,
      ['document'],
    );

    if (!userDocument) {
      throw new NotFoundException('Document not found or not owned by user');
    }

    const tags = await this.syncUserDocumentTags(
      userDocument.id,
      ownerId,
      tagIds,
    );

    return tags.map((tag) => this.toTagSummary(tag));
  }

  /**
   * Chunk text into pieces of maxLength characters
   */
  private chunkText(text: string, maxLength: number): string[] {
    const result: string[] = [];
    let current = '';
    const words = text.split(/\s+/);

    for (const word of words) {
      if ((current + ' ' + word).length > maxLength) {
        if (current.trim()) {
          result.push(current.trim());
        }
        current = word;
      } else {
        current += ' ' + word;
      }
    }

    if (current.trim()) {
      result.push(current.trim());
    }
    return result;
  }

  /**
   * Generate SHA-256 content hash
   */
  private generateContentHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private createOwnerDocumentQueryBuilder(ownerId: string) {
    return this.dataSource
      .createQueryBuilder(UserDocument, 'userDocument')
      .leftJoin('userDocument.document', 'document')
      .leftJoin('userDocument.user', 'user')
      .leftJoinAndSelect('userDocument.folder', 'folder')
      .leftJoinAndSelect('userDocument.userDocumentTags', 'userDocumentTag')
      .leftJoinAndSelect('userDocumentTag.tag', 'tag')
      .select([
        'userDocument.id',
        'userDocument.isFavorite',
        'userDocument.documentName',
        'userDocumentTag.userDocumentId',
        'userDocumentTag.tagId',
        'userDocumentTag.createdAt',
        'tag.id',
        'tag.name',
        'tag.type',
        'tag.color',
        'tag.createdAt',
        'tag.updatedAt',
        'document.id',
        'document.title',
        'document.metadata',
        'document.docDate',
        'document.extraAttributes',
        'document.fileRef',
        'document.fileSize',
        'document.contentHash',
        'document.status',
        'document.createdAt',
        'document.updatedAt',
        'folder.id',
        'folder.name',
      ])
      .where('user.id = :ownerId', { ownerId });
  }

  private async applyTagFilter(
    queryBuilder: SelectQueryBuilder<UserDocument>,
    ownerId: string,
    tagId: string,
    parameterName: 'tagId' | 'subjectId',
    expectedType?: TagType,
  ) {
    const tag = await this.dataSource.getRepository(Tag).findOne({
      where: {
        id: tagId,
        ownerId,
        ...(expectedType ? { type: expectedType } : {}),
      },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    queryBuilder.andWhere(
      `EXISTS (
        SELECT 1
        FROM user_document_tags document_tag_filter
        INNER JOIN tags tag_filter ON tag_filter.id = document_tag_filter.tag_id
        WHERE document_tag_filter.user_document_id = "userDocument"."id"
          AND tag_filter.id = :${parameterName}
          AND tag_filter.owner_id = :ownerId
      )`,
      {
        [parameterName]: tagId,
        ownerId,
      },
    );
  }

  private async applyFolderFilter(
    queryBuilder: SelectQueryBuilder<UserDocument>,
    ownerId: string,
    folderId: string,
  ) {
    const folder = await this.folderRepository.findOne({
      where: { id: folderId, ownerId },
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    if (!folder.parentId) {
      queryBuilder.andWhere(
        '("folder"."id" = :folderId OR "userDocument"."folder_id" IS NULL)',
        {
          folderId,
        },
      );
      return;
    }

    queryBuilder.andWhere('folder.id = :folderId', { folderId });
  }

  private applyDocumentSort(
    queryBuilder: SelectQueryBuilder<UserDocument>,
    sortBy: DocumentSortField,
    sortOrder: Uppercase<DocumentSortOrder>,
  ) {
    const sortMap: Record<DocumentSortField, string> = {
      createdAt: 'document.createdAt',
      docDate: 'document.docDate',
      fileSize: 'document.fileSize',
      title: 'userDocument.documentName',
      updatedAt: 'document.updatedAt',
    };

    queryBuilder.orderBy(sortMap[sortBy], sortOrder, 'NULLS LAST');

    if (sortBy === 'title') {
      queryBuilder.addOrderBy('document.title', sortOrder, 'NULLS LAST');
    }

    if (sortBy !== 'createdAt') {
      queryBuilder.addOrderBy('document.createdAt', 'DESC');
    }
  }

  private escapeLikePattern(value: string): string {
    return escapeLikePattern(value);
  }

  /**
   * Get all documents for a user with server-side search, filter, sort, and pagination.
   */
  async getDocuments(
    ownerId: string,
    query: ListDocumentsDto = {},
  ): Promise<DocumentListResult> {
    try {
      const page = query.page ?? 1;
      const limit = query.limit ?? 8;
      const offset = (page - 1) * limit;
      const sortOrder = (
        query.sortOrder ?? 'desc'
      ).toUpperCase() as Uppercase<DocumentSortOrder>;
      const sortBy = query.sortBy ?? 'createdAt';

      const queryBuilder = this.createOwnerDocumentQueryBuilder(ownerId);

      if (query.folderId) {
        await this.applyFolderFilter(queryBuilder, ownerId, query.folderId);
      }

      if (query.favorite !== undefined) {
        queryBuilder.andWhere('userDocument.isFavorite = :favorite', {
          favorite: query.favorite,
        });
      }

      if (query.subjectId) {
        await this.applyTagFilter(
          queryBuilder,
          ownerId,
          query.subjectId,
          'subjectId',
          TagType.SUBJECT,
        );
      }

      if (query.tagId) {
        await this.applyTagFilter(queryBuilder, ownerId, query.tagId, 'tagId');
      }

      if (query.type) {
        queryBuilder.andWhere(
          'LOWER(COALESCE("document"."file_ref", \'\')) LIKE :typePattern',
          {
            typePattern: `%.${query.type}`,
          },
        );
      }

      if (query.keyword) {
        const normalizedKeyword = query.keyword.trim().toLowerCase();
        const hasSearchableText = /[a-z0-9]/i.test(normalizedKeyword);

        if (!hasSearchableText) {
          queryBuilder.andWhere('1 = 0');
        } else {
          const keywordPattern = `%${this.escapeLikePattern(normalizedKeyword)}%`;
          const searchableTitleExpression = `
            LOWER(
              regexp_replace(
                COALESCE("userDocument"."document_name", "document"."title", ''),
                '\\.[^.]*$',
                ''
              )
            )
          `;
          const searchClauses = [
            `${searchableTitleExpression} LIKE :keyword ESCAPE '\\'`,
          ];

          if (
            normalizedKeyword.length >= 2 &&
            !normalizedKeyword.startsWith('.')
          ) {
            searchClauses.push(
              `LOWER(COALESCE("document"."metadata"::text, '')) LIKE :keyword ESCAPE '\\'`,
              `LOWER(COALESCE("document"."extra_attributes"::text, '')) LIKE :keyword ESCAPE '\\'`,
            );
          }

          queryBuilder.andWhere(`(${searchClauses.join(' OR ')})`, {
            keyword: keywordPattern,
          });
        }
      }

      this.applyDocumentSort(queryBuilder, sortBy, sortOrder);

      const [userDocuments, total] = await queryBuilder
        .skip(offset)
        .take(limit)
        .getManyAndCount();

      const totalPages = Math.max(Math.ceil(total / limit), 1);
      const documents = userDocuments.map((userDoc) =>
        this.toDocumentSummary(userDoc),
      );

      this.logger.debug(
        `Retrieved ${documents.length} documents for owner ${ownerId}`,
      );

      return {
        documents,
        filters: {
          favorite: query.favorite,
          folderId: query.folderId,
          keyword: query.keyword,
          sortBy,
          sortOrder,
          subjectId: query.subjectId,
          tagId: query.tagId,
          type: query.type,
        },
        pagination: {
          currentPage: page,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `Failed to retrieve documents for owner ${ownerId}: ${getErrorMessage(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        'Documents could not be loaded. Please refresh and try again.',
      );
    }
  }

  /**
   * Delete document for a user
   */
  async deleteDocument(
    ownerId: string,
    documentId: string,
  ): Promise<DeleteDocumentResult> {
    return this.dataSource.transaction(async (manager) => {
      const documentRepo = manager.getRepository(Document);
      const chunkRepo = manager.getRepository(Chunk);
      const userDocumentRepo = manager.getRepository(UserDocument);

      // Check user access
      const userDocument = await userDocumentRepo
        .createQueryBuilder('userDocument')
        .leftJoin('userDocument.document', 'document')
        .leftJoin('userDocument.user', 'user')
        .select('userDocument.id')
        .addSelect('"document"."file_ref"', 'fileRef')
        .addSelect('"document"."id"', 'documentId')
        .addSelect(
          'COALESCE("userDocument"."document_name", "document"."title")',
          'title',
        )
        .where('"document"."id" = :id AND "user"."id" = :ownerId', {
          id: documentId,
          ownerId,
        })
        .getRawOne<UserDocumentAccessRow>();

      if (!userDocument) {
        throw new NotFoundException('Document not found or not owned by user');
      }

      const fileRef = userDocument.fileRef;

      // Get chunks
      const chunks = await chunkRepo.find({
        where: { documents: { id: documentId } },
        select: ['id'],
      });
      const chunkIds = chunks.map((c) => c.id);

      // Remove UserDocument entry
      await userDocumentRepo.delete({
        user: { id: ownerId },
        document: { id: documentId },
      });

      // Check if other users still have this document
      const remainingUserDocs = await userDocumentRepo.count({
        where: { document: { id: documentId } },
      });

      if (remainingUserDocs > 0) {
        return {
          documentId: userDocument.documentId,
          message: 'Document removed from your library',
          removedFromLibraryOnly: true,
          title: userDocument.title,
        };
      }

      // No other users - full deletion
      const chunksToDelete =
        chunkIds.length === 0
          ? []
          : (
              await chunkRepo
                .createQueryBuilder('chunk')
                .leftJoin('chunk.documents', 'document')
                .select('chunk.id', 'id')
                .where('chunk.id IN (:...chunkIds)', { chunkIds })
                .groupBy('chunk.id')
                .having('COUNT(document.id) = 1')
                .getRawMany<{ id: string }>()
            ).map((row) => row.id);

      await documentRepo.delete({ id: documentId });

      if (chunksToDelete.length > 0) {
        await chunkRepo.delete({ id: In(chunksToDelete) });
      }

      // Delete file from disk
      if (fileRef) {
        await fs.rm(fileRef, { force: true });
      }

      return {
        documentId: userDocument.documentId,
        message: 'Document removed successfully',
        removedFromLibraryOnly: false,
        title: userDocument.title,
      };
    });
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(userId: string, documentId: string) {
    try {
      const userDocument =
        await this.userDocumentRepository.findByUserAndDocument(
          userId,
          documentId,
        );

      if (!userDocument) {
        throw new NotFoundException('Document not found or not owned by user');
      }

      await this.userDocumentRepository.toggleFavorite(userId, documentId);
      return this.getDocumentSummaryForOwner(documentId, userId);
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to toggle favorite: ${getErrorMessage(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        'Favorite status could not be updated. Please try again.',
      );
    }
  }

  /**
   * Get favorite documents
   */
  async getFavorites(
    userId: string,
    query: ListDocumentsDto = {},
  ): Promise<DocumentListResult> {
    try {
      return this.getDocuments(userId, {
        ...query,
        favorite: true,
      });
    } catch (error: unknown) {
      this.logger.error(
        `Failed to get favorites: ${getErrorMessage(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        'Favorite documents could not be loaded. Please refresh and try again.',
      );
    }
  }

  async searchDocuments(query: string, ownerId: string, limit: number = 10) {
    const keyword = query.trim();

    if (!keyword) {
      return {
        relatedTitleDocuments: [],
        relatedContentDocuments: [],
      };
    }

    try {
      const titleMatches = await this.dataSource
        .createQueryBuilder(UserDocument, 'userDocument')
        .leftJoin('userDocument.document', 'document')
        .leftJoin('userDocument.user', 'user')
        .leftJoinAndSelect('userDocument.folder', 'folder')
        .select([
          'userDocument.id',
          'userDocument.isFavorite',
          'userDocument.documentName',
          'document.id',
          'document.metadata',
          'document.docDate',
          'document.extraAttributes',
          'document.fileRef',
          'document.fileSize',
          'document.contentHash',
          'document.status',
          'document.createdAt',
          'document.updatedAt',
          'folder.id',
          'folder.name',
        ])
        .where('user.id = :ownerId', { ownerId })
        .andWhere(
          'LOWER(COALESCE("userDocument"."document_name", "document"."title", \'\')) LIKE LOWER(:query) ESCAPE \'\\\'',
          {
            query: buildContainsLikePattern(keyword),
          },
        )
        .orderBy('document.createdAt', 'DESC')
        .take(limit)
        .getMany();

      const titleDocuments = titleMatches.map((userDoc) =>
        this.toDocumentSummary(userDoc),
      );

      const excludedIds = titleDocuments.map((document) => document.id);

      const chunkMatches = await this.dataSource
        .createQueryBuilder(UserDocument, 'userDocument')
        .leftJoin('userDocument.document', 'document')
        .leftJoin('userDocument.user', 'user')
        .leftJoinAndSelect('userDocument.folder', 'folder')
        .leftJoin('document.chunks', 'chunk')
        .select([
          'userDocument.id',
          'userDocument.isFavorite',
          'userDocument.documentName',
          'document.id',
          'document.metadata',
          'document.docDate',
          'document.extraAttributes',
          'document.fileRef',
          'document.fileSize',
          'document.contentHash',
          'document.status',
          'document.createdAt',
          'document.updatedAt',
          'folder.id',
          'folder.name',
        ])
        .where('user.id = :ownerId', { ownerId })
        .andWhere(
          'LOWER("chunk"."chunk_text") LIKE LOWER(:query) ESCAPE \'\\\'',
          {
            query: buildContainsLikePattern(keyword),
          },
        )
        .andWhere(
          excludedIds.length > 0
            ? '"document"."id" NOT IN (:...excludedIds)'
            : '1 = 1',
          { excludedIds },
        )
        .groupBy('"userDocument"."id"')
        .addGroupBy('"document"."id"')
        .addGroupBy('"folder"."id"')
        .addGroupBy('"folder"."name"')
        .orderBy('document.createdAt', 'DESC')
        .take(limit)
        .getMany();

      const contentDocuments = chunkMatches.map((userDoc) =>
        this.toDocumentSummary(userDoc),
      );

      return {
        relatedTitleDocuments: titleDocuments,
        relatedContentDocuments: contentDocuments,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Failed to search documents for owner ${ownerId}: ${getErrorMessage(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        'Document search could not be completed. Please try again.',
      );
    }
  }

  async getRelatedDocuments(
    documentId: string,
    ownerId: string,
    limit: number = 6,
  ) {
    try {
      const sourceDocument = await this.documentRepository.findByIdAndOwner(
        documentId,
        ownerId,
      );

      if (!sourceDocument) {
        throw new NotFoundException('Document not found or not owned by user');
      }

      const sourceTitle = (sourceDocument.title || '').toLowerCase();
      const sourceKeywords = new Set<string>();

      sourceTitle
        .split(/[^a-zA-Z0-9]+/)
        .filter((word) => word.length > 2)
        .forEach((word) => sourceKeywords.add(word));

      const metadataKeywords = Array.isArray(sourceDocument.metadata?.keywords)
        ? sourceDocument.metadata.keywords
        : [];

      metadataKeywords
        .map((keyword) => String(keyword).toLowerCase())
        .filter((keyword) => keyword.length > 2)
        .forEach((keyword) => sourceKeywords.add(keyword));

      if (sourceKeywords.size === 0) {
        return { total: 0, documents: [] };
      }

      const matches = await this.dataSource
        .createQueryBuilder(UserDocument, 'userDocument')
        .leftJoin('userDocument.document', 'document')
        .leftJoin('userDocument.user', 'user')
        .leftJoinAndSelect('userDocument.folder', 'folder')
        .select([
          'userDocument.id',
          'userDocument.isFavorite',
          'userDocument.documentName',
          'document.id',
          'document.metadata',
          'document.docDate',
          'document.extraAttributes',
          'document.fileRef',
          'document.fileSize',
          'document.contentHash',
          'document.status',
          'document.createdAt',
          'document.updatedAt',
          'folder.id',
          'folder.name',
        ])
        .where('user.id = :ownerId', { ownerId })
        .andWhere('"document"."id" != :documentId', { documentId })
        .orderBy('document.createdAt', 'DESC')
        .getMany();

      const ranked = matches
        .map((userDoc) => {
          const title = (
            userDoc.documentName ||
            userDoc.document?.title ||
            ''
          ).toLowerCase();
          const keywords = new Set<string>();

          title
            .split(/[^a-zA-Z0-9]+/)
            .filter((word) => word.length > 2)
            .forEach((word) => keywords.add(word));

          const metadataValues = Array.isArray(
            userDoc.document?.metadata?.keywords,
          )
            ? userDoc.document.metadata.keywords
            : [];

          metadataValues
            .map((keyword) => String(keyword).toLowerCase())
            .filter((keyword) => keyword.length > 2)
            .forEach((keyword) => keywords.add(keyword));

          let score = 0;
          sourceKeywords.forEach((keyword) => {
            if (keywords.has(keyword)) {
              score += 1;
            }
          });

          return {
            ...this.toDocumentSummary(userDoc),
            relatedScore: score,
          };
        })
        .filter((document) => document.relatedScore > 0)
        .sort((left, right) => right.relatedScore - left.relatedScore)
        .slice(0, limit)
        .map((document) => {
          const { relatedScore, ...rest } = document;
          void relatedScore;
          return rest;
        });

      return {
        total: ranked.length,
        documents: ranked,
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to get related documents for owner ${ownerId}: ${getErrorMessage(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        'Related documents could not be loaded. Please try again.',
      );
    }
  }

  /**
   * Get document details for a user
   * Supports both Document ID and UserDocument ID for robustness
   */
  async getDocumentDetails(documentId: string, ownerId: string) {
    const userDocument = await this.findUserDocumentForOwner(
      documentId,
      ownerId,
      ['document', 'folder', 'userDocumentTags', 'userDocumentTags.tag'],
    );

    if (!userDocument) {
      throw new NotFoundException('Document not found or not owned by user');
    }

    return this.toDocumentSummary(userDocument);
  }

  /**
   * Update document name
   */
  async updateDocumentName(
    userId: string,
    documentId: string,
    newName: string,
  ) {
    const trimmedName = newName.trim();

    if (!trimmedName) {
      throw new BadRequestException('Document name cannot be empty');
    }

    const userDocument = await this.dataSource
      .getRepository(UserDocument)
      .findOne({
        where: { user: { id: userId }, document: { id: documentId } },
      });

    if (!userDocument) {
      throw new NotFoundException('Document not found or not owned by user');
    }

    userDocument.documentName = trimmedName;
    await this.dataSource.getRepository(UserDocument).save(userDocument);

    return {
      message: 'Document name updated successfully',
      document: await this.getDocumentSummaryForOwner(documentId, userId),
    };
  }

  private toTagSummary(tag: Tag) {
    return {
      id: tag.id,
      name: tag.name,
      type: tag.type,
      color: tag.color,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    };
  }

  private getTagsFromUserDocument(
    userDoc: UserDocument & { userDocumentTags?: UserDocumentTag[] },
  ) {
    return (userDoc.userDocumentTags || [])
      .map((documentTag) => documentTag.tag)
      .filter((tag): tag is Tag => Boolean(tag))
      .map((tag) => this.toTagSummary(tag));
  }

  private toDocumentSummary(
    userDoc: UserDocument & {
      document: Document;
      folder?: { id?: string; name?: string } | null;
      userDocumentTags?: UserDocumentTag[];
    },
  ) {
    const tags = this.getTagsFromUserDocument(userDoc);

    return {
      ...userDoc.document,
      userDocumentId: userDoc.id,
      title: userDoc.documentName || userDoc.document?.title,
      isFavorite: userDoc.isFavorite,
      formattedFileSize: formatFileSize(userDoc.document?.fileSize || 0),
      folderId: userDoc.folder?.id || null,
      folderName: userDoc.folder?.name || 'Workspace',
      subject: tags.find((tag) => tag.type === TagType.SUBJECT) || null,
      tags,
    };
  }
}
