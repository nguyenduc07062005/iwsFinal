import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LlmModule } from './common/llm/llm.module';
import { DatabaseModule } from './database/database.module';
import { AuthenticationModule } from './modules/authentication/authentication.module';
import { DocumentModule } from './modules/document/document.module';
import { FolderModule } from './modules/folder/folder.module';
import { RagModule } from './modules/rag/rag.module';
import { AdminModule } from './modules/admin/admin.module';
import { TagModule } from './modules/tag/tag.module';
import { validateEnvironment } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    DatabaseModule,
    AuthenticationModule,
    DocumentModule,
    FolderModule,
    LlmModule,
    RagModule,
    AdminModule,
    TagModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
