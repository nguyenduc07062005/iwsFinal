import {
  BadRequestException,
  type CanActivate,
  type INestApplication,
  type Provider,
  type Type,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { Test } from '@nestjs/testing';
import { JwtAuthGuard } from '../../src/modules/authentication/jwt/jwt-auth.guard';
import { RolesGuard } from '../../src/modules/authentication/roles/roles.guard';

export const TEST_USER_ID = '11111111-1111-4111-8111-111111111111';
export const TEST_FOLDER_ID = '22222222-2222-4222-8222-222222222222';
export const TEST_PARENT_FOLDER_ID = '33333333-3333-4333-8333-333333333333';
export const TEST_DOCUMENT_ID = '44444444-4444-4444-8444-444444444444';

type TestPrincipal = {
  isActive: boolean;
  role: 'admin' | 'user';
  userId: string;
};

type AuthenticatedTestRequest = {
  headers?: {
    authorization?: unknown;
  };
  user?: {
    userId: string;
    role: TestPrincipal['role'];
  };
};

const TEST_TOKEN_PRINCIPALS: Record<string, TestPrincipal> = {
  'phase-8-test-token': {
    isActive: true,
    role: 'admin',
    userId: TEST_USER_ID,
  },
  'admin-test-token': {
    isActive: true,
    role: 'admin',
    userId: TEST_USER_ID,
  },
  'user-test-token': {
    isActive: true,
    role: 'user',
    userId: TEST_USER_ID,
  },
  'locked-test-token': {
    isActive: false,
    role: 'user',
    userId: TEST_USER_ID,
  },
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

const createAuthenticatedGuard = (): CanActivate => ({
  canActivate(context) {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedTestRequest>();
    const authorizationHeader = request.headers?.authorization;

    if (
      typeof authorizationHeader !== 'string' ||
      !authorizationHeader.startsWith('Bearer ')
    ) {
      throw new UnauthorizedException('Authentication token is required');
    }

    const token = authorizationHeader.slice('Bearer '.length).trim();
    const principal = TEST_TOKEN_PRINCIPALS[token];

    if (!principal) {
      throw new UnauthorizedException('Authentication token is invalid');
    }

    if (!principal.isActive) {
      throw new UnauthorizedException('Account is not active');
    }

    request.user = {
      userId: principal.userId,
      role: principal.role,
    };
    return true;
  },
});

const createValidationPipe = () =>
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
  });

type HttpTestAppOptions = {
  controllers: Type<unknown>[];
  providers: Provider[];
};

export const createHttpTestApp = async ({
  controllers,
  providers,
}: HttpTestAppOptions): Promise<INestApplication> => {
  const builder = Test.createTestingModule({
    controllers,
    providers: [...providers, RolesGuard],
  });

  builder.overrideGuard(JwtAuthGuard).useValue(createAuthenticatedGuard());

  const moduleRef = await builder.compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(createValidationPipe());
  await app.init();

  return app;
};
