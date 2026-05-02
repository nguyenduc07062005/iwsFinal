import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import pgvector from 'pgvector';
import { GeminiService } from 'src/common/llm/gemini.service';
import { Document } from 'src/database/entities/document.entity';
import { ChunkRepository } from 'src/database/repositories/chunks.repository';
import { DocumentRepository } from 'src/database/repositories/document.repository';
import { IndexingResult } from '../types/rag.types';

const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIMENSION = 3072;
const EMBEDDING_CONCURRENCY_LIMIT = 3;

@Injectable()
export class RagIndexingService {
  private readonly logger = new Logger(RagIndexingService.name);

  constructor(
    private readonly geminiService: GeminiService,
    private readonly documentRepository: DocumentRepository,
    private readonly chunkRepository: ChunkRepository,
  ) {}

  async ensureDocumentIndexed(
    documentId: string,
    options: { force?: boolean } = {},
  ): Promise<IndexingResult> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
      relations: ['chunks'],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const force = options.force ?? false;
    const chunks = [...(document.chunks ?? [])].sort(
      (left, right) => left.chunkIndex - right.chunkIndex,
    );

    if (chunks.length === 0) {
      await this.updateDocumentStatus(documentId, 'ready');
      return {
        documentId,
        indexedChunks: 0,
        totalChunks: 0,
      };
    }

    await this.updateDocumentStatus(documentId, 'indexing');

    let indexedChunks = 0;

    try {
      const chunksToIndex = chunks.filter((chunk) => {
        if (!force && chunk.embedding) {
          indexedChunks += 1;
          return false;
        }

        return true;
      });
      const chunkRepository = this.chunkRepository.getRepository();
      let nextChunkIndex = 0;
      const workerCount = Math.min(
        EMBEDDING_CONCURRENCY_LIMIT,
        chunksToIndex.length,
      );
      const indexNextChunk = async () => {
        while (nextChunkIndex < chunksToIndex.length) {
          const chunk = chunksToIndex[nextChunkIndex++];
          const embeddingValues = await this.geminiService.createEmbedding(
            chunk.chunkText,
          );

          chunk.embedding = this.toVectorSql(embeddingValues);
          chunk.embeddingModel = EMBEDDING_MODEL;
          await chunkRepository.save(chunk);
          indexedChunks += 1;
        }
      };

      await Promise.all(
        Array.from({ length: workerCount }, () => indexNextChunk()),
      );

      await this.updateDocumentStatus(documentId, 'indexed');

      return {
        documentId,
        indexedChunks,
        totalChunks: chunks.length,
      };
    } catch (error) {
      this.logger.error(
        `Failed to index document ${documentId}`,
        error instanceof Error ? error.stack : undefined,
      );
      await this.updateDocumentStatus(documentId, 'ai_failed');
      throw error;
    }
  }

  getEmbeddingDimension(): number {
    return EMBEDDING_DIMENSION;
  }

  private async updateDocumentStatus(
    documentId: string,
    status: Document['status'],
  ): Promise<void> {
    await this.documentRepository.getRepository().update(documentId, {
      status,
    });
  }

  private toVectorSql(embedding: number[]): string {
    return pgvector.toSql(embedding) as string;
  }
}
