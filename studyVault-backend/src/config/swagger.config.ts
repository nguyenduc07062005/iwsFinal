import { DocumentBuilder } from '@nestjs/swagger';

export const createSwaggerConfig = () =>
  new DocumentBuilder()
    .setTitle('StudyVault API')
    .setDescription(
      'REST API for StudyVault authentication, document management, folders, tags, admin operations, and AI-assisted study workflows.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste the JWT access token returned by /api/auth/login.',
      },
      'bearer',
    )
    .addSecurityRequirements('bearer')
    .addTag('auth', 'Registration, login, profile, and password recovery')
    .addTag('system', 'Health checks and basic service endpoints')
    .addTag('documents', 'Document upload, listing, preview, and metadata')
    .addTag('folders', 'Folder tree and document organization')
    .addTag('tags', 'Tags and subjects for document filtering')
    .addTag('rag', 'AI summary and document Q&A')
    .addTag('admin', 'Admin-only user and system operations')
    .build();
