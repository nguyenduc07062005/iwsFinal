import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from 'src/database/entities/user.entity';
import { JwtAuthGuard } from 'src/modules/authentication/jwt/jwt-auth.guard';
import { Roles } from 'src/modules/authentication/roles/roles.decorator';
import { RolesGuard } from 'src/modules/authentication/roles/roles.guard';
import { GeminiService } from './gemini.service';

@ApiTags('llm')
@ApiBearerAuth('bearer')
@Controller('llm')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class LlmController {
  constructor(private readonly geminiService: GeminiService) {}

  @Get('test')
  async testAi(@Query('prompt') prompt: string) {
    const response = await this.geminiService.generateText(prompt);
    return {
      success: true,
      prompt,
      response,
    };
  }

  @Get('test-embedding')
  async testEmbedding(@Query('text') text: string) {
    const embedding = await this.geminiService.createEmbedding(text);

    if (!embedding) {
      return { success: false, message: 'embedding error' };
    }

    return {
      success: true,
      text,
      embeddingSize: embedding.length,
      preview: embedding.slice(0, 5),
    };
  }
}
