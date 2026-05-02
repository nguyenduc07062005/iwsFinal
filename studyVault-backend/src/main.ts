import { BadRequestException, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { createRateLimitMiddleware } from './common/http/rate-limit.middleware';
import { GlobalExceptionFilter } from './common/http/global-exception.filter';
import { createSwaggerConfig } from './config/swagger.config';
import { CORS_ALLOWED_HEADERS, isSwaggerEnabled } from './config/http.config';

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

type ExpressSettingsApplication = {
  disable: (setting: string) => void;
};

const isExpressSettingsApplication = (
  value: unknown,
): value is ExpressSettingsApplication => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return typeof (value as { disable?: unknown }).disable === 'function';
};

const parseOrigins = (value?: string): string[] | true => {
  if (!value) {
    return DEFAULT_ALLOWED_ORIGINS;
  }

  if (value.trim() === '*') {
    return true;
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const flattenValidationErrors = (
  errors: ValidationError[],
  pathPrefix = '',
): string[] => {
  return errors.flatMap((error) => {
    const currentPath = pathPrefix
      ? `${pathPrefix}.${error.property}`
      : error.property;
    const constraintMessages = Object.values(error.constraints ?? {}).map(
      (message) =>
        message.includes(error.property)
          ? message
          : `${currentPath}: ${message}`,
    );
    const childMessages = flattenValidationErrors(
      error.children ?? [],
      currentPath,
    );

    return [...constraintMessages, ...childMessages];
  });
};

const resolveCorsOrigin = (allowedOrigins: string[] | true) => {
  if (allowedOrigins === true) {
    return true;
  }

  const strictOrigins = allowedOrigins;

  return (
    origin: string | undefined,
    callback: (error: Error | null, allow?: boolean) => void,
  ) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (strictOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  };
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = parseOrigins(process.env.CORS_ORIGIN);
  const expressInstance: unknown = app.getHttpAdapter().getInstance();

  if (isExpressSettingsApplication(expressInstance)) {
    expressInstance.disable('x-powered-by');
  }

  app.setGlobalPrefix('api');
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          fontSrc: ["'self'", 'https:', 'data:'],
          formAction: ["'self'"],
          frameAncestors: ["'self'"],
          imgSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginResourcePolicy: {
        policy: 'cross-origin',
      },
    }),
  );
  if (isSwaggerEnabled()) {
    const swaggerDocument = SwaggerModule.createDocument(
      app,
      createSwaggerConfig(),
    );
    SwaggerModule.setup('api/docs', app, swaggerDocument, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }
  app.enableCors({
    origin: resolveCorsOrigin(allowedOrigins),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [...CORS_ALLOWED_HEADERS],
    exposedHeaders: ['Content-Disposition'],
    maxAge: 600,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        const errors = flattenValidationErrors(validationErrors);

        return new BadRequestException({
          statusCode: 400,
          error: 'Bad Request',
          message: errors[0] || 'Validation failed.',
          errors,
        });
      },
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  const rateLimitConfigs: {
    path: string;
    identityFields?: string[];
    keyPrefix: string;
    maxRequests: number;
    windowMs: number;
    message: string;
    methods: string[];
  }[] = [
    {
      path: '/api/auth/login',
      identityFields: ['email'],
      keyPrefix: 'auth-login',
      maxRequests: 8,
      windowMs: 60_000,
      message: 'Too many login attempts. Please wait a minute and try again.',
      methods: ['POST'],
    },
    {
      path: '/api/auth/register',
      identityFields: ['email'],
      keyPrefix: 'auth-register',
      maxRequests: 6,
      windowMs: 10 * 60_000,
      message:
        'Too many registration attempts. Please wait a few minutes and try again.',
      methods: ['POST'],
    },
    {
      path: '/api/auth/forgot-password',
      identityFields: ['email'],
      keyPrefix: 'auth-forgot-password',
      maxRequests: 4,
      windowMs: 15 * 60_000,
      message:
        'Too many password reset requests. Please wait before requesting another reset link.',
      methods: ['POST'],
    },
    {
      path: '/api/auth/complete-registration',
      identityFields: ['token'],
      keyPrefix: 'auth-complete-registration',
      maxRequests: 12,
      windowMs: 15 * 60_000,
      message:
        'Too many registration completion attempts. Please request a new link and try again later.',
      methods: ['POST'],
    },
    {
      path: '/api/auth/resend-verification',
      identityFields: ['email'],
      keyPrefix: 'auth-resend-verification',
      maxRequests: 4,
      windowMs: 15 * 60_000,
      message:
        'Too many verification email requests. Please wait before requesting another link.',
      methods: ['POST'],
    },
    {
      path: '/api/auth/reset-password',
      identityFields: ['token'],
      keyPrefix: 'auth-reset-password',
      maxRequests: 6,
      windowMs: 15 * 60_000,
      message:
        'Too many password reset attempts. Please request a new link and try again later.',
      methods: ['POST'],
    },
    {
      path: '/api/documents/upload',
      keyPrefix: 'documents-upload',
      maxRequests: 12,
      windowMs: 10 * 60_000,
      message:
        'Too many upload requests. Please wait a moment before uploading more files.',
      methods: ['POST'],
    },
    {
      path: '/api/documents',
      keyPrefix: 'documents-read',
      maxRequests: 180,
      windowMs: 60_000,
      message:
        'Too many document requests. Please slow down and try again shortly.',
      methods: ['GET'],
    },
    {
      path: '/api/rag/documents',
      keyPrefix: 'rag-documents',
      maxRequests: 30,
      windowMs: 60_000,
      message:
        'Too many AI requests. Please wait a moment before asking again.',
      methods: ['POST', 'GET', 'DELETE'],
    },
  ];

  rateLimitConfigs.forEach(({ path, ...config }) => {
    app.use(path, createRateLimitMiddleware(config));
  });

  await app.listen(Number(process.env.PORT ?? 8000));
}

void bootstrap();
