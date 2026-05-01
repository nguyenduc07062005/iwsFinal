import { Module } from '@nestjs/common';
import { RolesGuard } from 'src/modules/authentication/roles/roles.guard';
import { GeminiService } from './gemini.service';
import { LlmController } from './llm.controller';

@Module({
  providers: [GeminiService, RolesGuard],
  controllers: [LlmController],
  exports: [GeminiService],
})
export class LlmModule {}
