import {
  Controller,
  BadRequestException,
  Post,
  Patch,
  UploadedFile,
  UseInterceptors,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Logger,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Delete,
  Request,
  Res,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request as ExpressRequest, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentService } from './document.service';
import { DocumentDto } from './dtos/document.dto';
import { DeleteDocumentDto } from './dtos/delete-document.dto';
import { ListDocumentsDto } from './dtos/list-documents.dto';
import { SearchDocumentDto } from './dtos/search-document.dto';
import { StudyNoteDto } from './dtos/study-note.dto';
import { UpdateDocumentNameDto } from './dtos/update-document-name.dto';
import { UpdateDocumentTagsDto } from './dtos/update-document-tags.dto';
import { JwtAuthGuard } from '../authentication/jwt/jwt-auth.guard';
import { RagService } from '../rag/rag.service';

@ApiTags('documents')
@ApiBearerAuth('bearer')
@Controller('documents')
export class DocumentController {
  private readonly logger = new Logger(DocumentController.name);

  private static readonly supportedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  constructor(
    private readonly documentService: DocumentService,
    private readonly ragService: RagService,
  ) {}

  private getUserId(req: ExpressRequest): string {
    return (req as ExpressRequest & { user: { userId: string } }).user.userId;
  }

  private queueDocumentIndexing(documentId: string): void {
    void Promise.resolve()
      .then(() => this.ragService.ensureDocumentIndexed(documentId))
      .catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Document ${documentId} was uploaded but background indexing failed: ${message}`,
        );
      });
  }

  // --- Upload document ---
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, callback) => {
        if (DocumentController.supportedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
          return;
        }

        callback(
          new BadRequestException(
            'Only PDF, DOCX, or TXT files are supported.',
          ),
          false,
        );
      },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() createDocumentDto: DocumentDto,
    @Request() req: ExpressRequest,
  ): Promise<any> {
    const ownerId = this.getUserId(req);

    if (!file) {
      throw new BadRequestException(
        'A valid PDF, DOCX, or TXT file is required.',
      );
    }

    this.documentService.validateUploadFile(file);

    if (!createDocumentDto.title) {
      createDocumentDto.title = file.originalname;
    }

    const uploaded = await this.documentService.uploadDocument(
      file,
      createDocumentDto,
      ownerId,
    );
    this.queueDocumentIndexing(uploaded.id);
    const document = await this.documentService.getDocumentSummaryForOwner(
      uploaded.id,
      ownerId,
    );

    return {
      message: 'Document uploaded successfully',
      document,
      uploaded,
      indexing: {
        status: 'queued',
      },
    };
  }

  // --- Get all documents for logged-in user ---
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Get()
  async getDocuments(
    @Request() req: ExpressRequest,
    @Query() query: ListDocumentsDto,
  ) {
    const ownerId = this.getUserId(req);
    const result = await this.documentService.getDocuments(ownerId, query);
    return {
      message: 'Documents retrieved successfully',
      pagination: result.pagination,
      filters: result.filters,
      documents: result.documents,
    };
  }

  // --- Delete document ---
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Delete('delete')
  async deleteDocument(
    @Request() req: ExpressRequest,
    @Body() deleteDto: DeleteDocumentDto,
  ) {
    const ownerId = this.getUserId(req);
    const result = await this.documentService.deleteDocument(
      ownerId,
      deleteDto.documentId,
    );
    return result;
  }

  // RESTful alias kept alongside DELETE /documents/delete for backward compatibility.
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Delete(':documentId')
  async deleteDocumentById(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Request() req: ExpressRequest,
  ) {
    const ownerId = this.getUserId(req);
    return this.documentService.deleteDocument(ownerId, documentId);
  }

  // --- Toggle favorite ---
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Post(':documentId/toggle-favorite')
  async toggleFavorite(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Request() req: ExpressRequest,
  ) {
    const userId = this.getUserId(req);
    const result = await this.documentService.toggleFavorite(
      userId,
      documentId,
    );
    return {
      message: 'Favorite toggled successfully',
      document: result,
    };
  }

  // --- Get favorite documents ---
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Get('favorites')
  async getFavorites(
    @Request() req: ExpressRequest,
    @Query() query: ListDocumentsDto,
  ) {
    const userId = this.getUserId(req);
    const result = await this.documentService.getFavorites(userId, query);
    return {
      message: 'Favorites retrieved successfully',
      pagination: result.pagination,
      filters: result.filters,
      favorites: result.documents,
    };
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Get('search')
  async searchDocuments(
    @Query() searchDto: SearchDocumentDto,
    @Request() req: ExpressRequest,
  ) {
    const ownerId = this.getUserId(req);
    const result = await this.ragService.searchDocuments(
      searchDto.q || '',
      ownerId,
      {
        folderId: searchDto.folderId,
        page: Number(searchDto.page) || 1,
        limit: Number(searchDto.limit) || 10,
      },
    );

    return result;
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Get(':id/related')
  async getRelatedDocuments(
    @Param('id', ParseUUIDPipe) documentId: string,
    @Request() req: ExpressRequest,
    @Query('limit') limit: string = '6',
  ) {
    const ownerId = this.getUserId(req);
    const result = await this.ragService.getRelatedDocuments(
      documentId,
      ownerId,
      Number(limit) || 6,
    );

    return {
      message: 'Related documents retrieved successfully',
      total: result.total,
      documents: result.documents,
    };
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Patch(':id/tags')
  async updateDocumentTags(
    @Param('id', ParseUUIDPipe) documentId: string,
    @Body() updateDto: UpdateDocumentTagsDto,
    @Request() req: ExpressRequest,
  ) {
    const ownerId = this.getUserId(req);
    const tags = await this.documentService.syncDocumentTags(
      documentId,
      ownerId,
      updateDto.tagIds,
    );
    return {
      message: 'Document tags updated successfully',
      tags,
    };
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Get(':id/tags')
  async getDocumentTags(
    @Param('id', ParseUUIDPipe) documentId: string,
    @Request() req: ExpressRequest,
  ) {
    const ownerId = this.getUserId(req);
    const tags = await this.documentService.getDocumentTags(
      documentId,
      ownerId,
    );
    return {
      message: 'Document tags retrieved successfully',
      tags,
    };
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Get(':id/notes')
  async getDocumentNotes(
    @Param('id', ParseUUIDPipe) documentId: string,
    @Request() req: ExpressRequest,
  ) {
    const ownerId = this.getUserId(req);
    const notes = await this.documentService.listStudyNotes(
      documentId,
      ownerId,
    );
    return {
      message: 'Study notes retrieved successfully',
      notes,
    };
  }

  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @Post(':id/notes')
  async createDocumentNote(
    @Param('id', ParseUUIDPipe) documentId: string,
    @Body() noteDto: StudyNoteDto,
    @Request() req: ExpressRequest,
  ) {
    const ownerId = this.getUserId(req);
    const note = await this.documentService.createStudyNote(
      documentId,
      ownerId,
      noteDto,
    );
    return {
      message: 'Study note created successfully',
      note,
    };
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Patch('notes/:noteId')
  async updateDocumentNote(
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @Body() noteDto: StudyNoteDto,
    @Request() req: ExpressRequest,
  ) {
    const ownerId = this.getUserId(req);
    const note = await this.documentService.updateStudyNote(
      noteId,
      ownerId,
      noteDto,
    );
    return {
      message: 'Study note updated successfully',
      note,
    };
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Delete('notes/:noteId')
  async deleteDocumentNote(
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @Request() req: ExpressRequest,
  ) {
    const ownerId = this.getUserId(req);
    await this.documentService.deleteStudyNote(noteId, ownerId);
    return {
      message: 'Study note deleted successfully',
      id: noteId,
    };
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getDocumentById(
    @Param('id', ParseUUIDPipe) documentId: string,
    @Request() req: ExpressRequest,
  ) {
    const ownerId = this.getUserId(req);
    const document = await this.documentService.getDocumentDetails(
      documentId,
      ownerId,
    );

    return {
      message: 'Document retrieved successfully',
      document,
    };
  }

  // --- Serve document file ---
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Get(':id/file')
  async getDocumentFile(
    @Param('id', ParseUUIDPipe) documentId: string,
    @Request() req: ExpressRequest,
    @Res() res: Response,
  ) {
    const ownerId = this.getUserId(req);
    const filePath = await this.documentService.getDocumentFilePath(
      documentId,
      ownerId,
    );
    res.sendFile(filePath);
  }

  // --- Update document name ---
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Patch(':documentId')
  async updateDocumentById(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() updateDto: UpdateDocumentNameDto,
    @Request() req: ExpressRequest,
  ) {
    const userId = this.getUserId(req);
    return this.documentService.updateDocumentName(
      userId,
      documentId,
      updateDto.newDocumentName,
    );
  }

  // Legacy alias kept so older frontend/API calls continue to work.
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Patch(':documentId/update-name')
  async updateDocumentName(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() updateDto: UpdateDocumentNameDto,
    @Request() req: ExpressRequest,
  ) {
    const userId = this.getUserId(req);
    const result = await this.documentService.updateDocumentName(
      userId,
      documentId,
      updateDto.newDocumentName,
    );
    return result;
  }
}
