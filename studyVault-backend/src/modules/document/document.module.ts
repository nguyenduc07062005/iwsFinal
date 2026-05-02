import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Document } from 'src/database/entities/document.entity';
import { Chunk } from 'src/database/entities/chunks.entity';

import { DocumentRepository } from 'src/database/repositories/document.repository';
import { ChunkRepository } from 'src/database/repositories/chunks.repository';
import { UserDocumentRepository } from 'src/database/repositories/user-document.repository';
import { UserRepository } from 'src/database/repositories/user.repository';
import { RagModule } from '../rag/rag.module';

import { DocumentService } from './document.service';
import { DocumentFileService } from './document-file.service';
import { DocumentNotesService } from './document-notes.service';
import { DocumentController } from './document.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Document, Chunk]), RagModule],
  controllers: [DocumentController],
  providers: [
    DocumentService,
    DocumentFileService,
    DocumentNotesService,
    DocumentRepository,
    ChunkRepository,
    UserDocumentRepository,
    UserRepository,
  ],
  exports: [DocumentService, DocumentFileService, DocumentNotesService],
})
export class DocumentModule {}
