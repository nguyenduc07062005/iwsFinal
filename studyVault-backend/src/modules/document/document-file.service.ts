import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as mammoth from 'mammoth';
import { promises as fs } from 'fs';
import * as path from 'path';
import { DocumentRepository } from 'src/database/repositories/document.repository';
import { UserDocument } from 'src/database/entities/user-document.entity';
import { getErrorMessage } from 'src/common/utils/format';

type DocumentHtmlPreviewResult = {
  html: string;
  messages: string[];
};

@Injectable()
export class DocumentFileService {
  private readonly logger = new Logger(DocumentFileService.name);
  private readonly uploadsDirectory = path.resolve(process.cwd(), 'uploads');

  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Get document file path for serving.
   * Supports both Document ID and UserDocument ID for robustness.
   */
  async getDocumentFilePath(
    documentId: string,
    ownerId: string,
  ): Promise<string> {
    // Try to find by Document ID first
    let document = await this.documentRepository.findByIdAndOwner(
      documentId,
      ownerId,
    );

    // If not found, try to find by UserDocument ID
    if (!document) {
      const userDoc = await this.dataSource
        .getRepository(UserDocument)
        .findOne({
          where: { id: documentId, user: { id: ownerId } },
          relations: ['document'],
        });

      if (userDoc?.document) {
        document = userDoc.document;
      }
    }

    if (!document) {
      this.logger.warn(
        `File request failed: Document ${documentId} not found for owner ${ownerId}`,
      );
      throw new NotFoundException('Document not found or not owned by user');
    }

    try {
      await fs.access(document.fileRef);
      return document.fileRef;
    } catch {
      try {
        const fileName = path.basename(document.fileRef);
        const localFilePath = path.join(this.uploadsDirectory, fileName);
        await fs.access(localFilePath);

        // Auto-heal the database path
        if (localFilePath !== document.fileRef) {
          document.fileRef = localFilePath;
          await this.documentRepository.getRepository().save(document);
        }

        return localFilePath;
      } catch {
        this.logger.error(`File missing on disk: ${document.fileRef}`);
        throw new NotFoundException(
          'The uploaded file is missing from storage. Please upload the document again.',
        );
      }
    }
  }

  /**
   * Generate HTML preview for DOCX files.
   */
  async getDocumentHtmlPreview(
    documentId: string,
    ownerId: string,
  ): Promise<DocumentHtmlPreviewResult> {
    const filePath = await this.getDocumentFilePath(documentId, ownerId);
    const extension = path.extname(filePath).toLowerCase();

    if (extension !== '.docx') {
      throw new BadRequestException(
        'HTML preview is only available for DOCX files.',
      );
    }

    try {
      const result = await mammoth.convertToHtml(
        { path: filePath },
        {
          styleMap: [
            "p[style-name='Title'] => h1:fresh",
            "p[style-name='Subtitle'] => h2:fresh",
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
          ],
        },
      );
      const html = (result.value || '').trim();

      if (!html) {
        throw new BadRequestException(
          'We could not render any previewable content from this DOCX file.',
        );
      }

      return {
        html,
        messages: (result.messages || []).map((message) => message.message),
      };
    } catch (error: unknown) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `DOCX preview failed for document ${documentId}: ${getErrorMessage(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        'The Word document preview could not be generated. Please download the file to open it on your device.',
      );
    }
  }
}
