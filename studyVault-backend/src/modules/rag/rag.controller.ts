import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { AskRagDto } from './dtos/ask-rag.dto';
import { GenerateSummaryDto } from './dtos/generate-summary.dto';
import { RagService } from './rag.service';
import { RagSummaryService } from './services/rag-summary.service';
import type { SummaryLanguage } from './types/rag.types';
import { JwtAuthGuard } from '../authentication/jwt/jwt-auth.guard';

@ApiTags('rag')
@ApiBearerAuth('bearer')
@Controller('rag')
@UseGuards(JwtAuthGuard)
export class RagController {
  constructor(
    private readonly ragService: RagService,
    private readonly ragSummaryService: RagSummaryService,
  ) {}

  private getUserId(req: ExpressRequest) {
    return (req as ExpressRequest & { user: { userId: string } }).user.userId;
  }

  private normalizeSummaryLanguage(language?: string): SummaryLanguage {
    if (!language) {
      return 'en';
    }

    if (language === 'en' || language === 'vi') {
      return language;
    }

    throw new BadRequestException('Summary language must be one of: vi, en.');
  }

  @HttpCode(HttpStatus.OK)
  @Post('documents/:documentId/ask')
  async askDocument(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() dto: AskRagDto,
    @Request() req: ExpressRequest,
  ) {
    const ownerId = this.getUserId(req);
    const result = await this.ragService.askDocument(
      documentId,
      ownerId,
      dto.question,
    );

    return {
      message: 'Document question answered successfully',
      ...result,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Get('documents/:documentId/ask/history')
  async getDocumentAskHistory(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Request() req: ExpressRequest,
  ) {
    const ownerId = this.getUserId(req);
    const items = await this.ragService.getDocumentAskHistory(
      documentId,
      ownerId,
    );

    return {
      message: 'Document ask history retrieved successfully',
      items,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Delete('documents/:documentId/ask/history')
  async clearDocumentAskHistory(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Request() req: ExpressRequest,
  ) {
    const ownerId = this.getUserId(req);
    const cleared = await this.ragService.clearDocumentAskHistory(
      documentId,
      ownerId,
    );

    return {
      message: 'Document ask history cleared successfully',
      cleared,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('documents/:documentId/summary')
  async getDocumentSummary(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() body: GenerateSummaryDto,
    @Request() req: ExpressRequest,
  ) {
    const ownerId = this.getUserId(req);
    const result = await this.ragSummaryService.generateSummary(
      documentId,
      ownerId,
      body.language ?? 'en',
      body.forceRefresh ?? false,
      body.instruction,
      body.slot,
    );

    return {
      message: 'Document summary generated successfully',
      ...result,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Get('documents/:documentId/summary')
  async getCachedDocumentSummary(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Query('language') language: string | undefined,
    @Request() req: ExpressRequest,
  ) {
    const ownerId = this.getUserId(req);
    const normalizedLanguage = this.normalizeSummaryLanguage(language);
    const summary = await this.ragSummaryService.getCachedSummary(
      documentId,
      ownerId,
      normalizedLanguage,
    );

    return {
      message: summary
        ? 'Document summary retrieved successfully'
        : 'No cached document summary found',
      language: normalizedLanguage,
      summary,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('documents/:documentId/diagram')
  async getDocumentDiagram(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Request() req: ExpressRequest,
  ) {
    const ownerId = this.getUserId(req);
    const result = await this.ragService.getDocumentDiagram(
      documentId,
      ownerId,
    );

    return {
      message: 'Document diagram generated successfully',
      ...result,
    };
  }
}
