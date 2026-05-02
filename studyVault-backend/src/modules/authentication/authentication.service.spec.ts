import { BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { validate } from 'class-validator';
import { createHash } from 'crypto';
import { MailService } from 'src/common/mail/mail.service';
import { UserRole } from 'src/database/entities/user.entity';
import { UserSessionRepository } from 'src/database/repositories/user-session.repository';
import { UserRepository } from 'src/database/repositories/user.repository';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { CompleteRegistrationDto } from './dtos/complete-registration.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { AuthenticationService } from './authentication.service';

const RESET_RESPONSE = {
  message: 'Please check your email to reset your password.',
};
const VALID_PASSWORD = 'Correct#12345';
const HASHED_VALID_PASSWORD = bcrypt.hashSync(VALID_PASSWORD, 4);
const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

const createUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-1',
  email: 'student@example.com',
  password: HASHED_VALID_PASSWORD,
  name: 'Student',
  role: UserRole.USER,
  isActive: true,
  isEmailVerified: true,
  emailVerifiedAt: new Date(),
  emailVerificationTokenHash: null,
  emailVerificationTokenExpiresAt: null,
  resetPasswordTokenHash: null,
  resetPasswordTokenExpiresAt: null,
  ...overrides,
});

const createSession = (overrides: Record<string, unknown> = {}) => ({
  id: 'session-1',
  userId: 'user-1',
  user: createUser(),
  refreshTokenHash: 'old-refresh-token-hash',
  csrfTokenHash: hashToken('csrf-token'),
  refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  revokedAt: null,
  lastUsedAt: null,
  userAgent: 'Jest',
  ipAddress: '127.0.0.1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createService = () => {
  const userRepository = {
    create: jest.fn(),
    delete: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };
  const userSessionRepository = {
    create: jest.fn(),
    findByRefreshTokenHash: jest.fn(),
    findActiveByRefreshTokenHash: jest.fn(),
    revokeAllForUser: jest.fn(),
    revokeSession: jest.fn(),
    rotateRefreshToken: jest.fn(),
  };
  const mailService = {
    sendEmailVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  };
  const configValues = new Map<string, string>([
    ['FRONTEND_URL', 'http://localhost:3000'],
    ['JWT_EXPIRES_IN', '15m'],
    ['RESET_PASSWORD_TTL_MINUTES', '30'],
    ['REFRESH_TOKEN_TTL_DAYS', '7'],
    ['AUTH_RETURN_RESET_TOKEN', 'true'],
  ]);
  const configService = {
    get: jest.fn((key: string) => configValues.get(key)),
  };
  const jwtService = {
    signAsync: jest.fn().mockResolvedValue('jwt-token'),
  };

  const service = new AuthenticationService(
    userRepository as never as UserRepository,
    userSessionRepository as never as UserSessionRepository,
    jwtService as never as JwtService,
    configService as never as ConfigService,
    mailService as never as MailService,
  );

  return {
    configService,
    jwtService,
    mailService,
    service,
    userSessionRepository,
    userRepository,
  };
};

describe('AuthenticationService.forgotPassword', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns a neutral response without touching reset state for unknown emails', async () => {
    const { mailService, service, userRepository } = createService();
    userRepository.findOne.mockResolvedValue(null);

    await expect(
      service.forgotPassword({ email: 'missing@example.com' }),
    ).resolves.toEqual(RESET_RESPONSE);

    expect(userRepository.update).not.toHaveBeenCalled();
    expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('returns the same neutral response for inactive or unverified users', async () => {
    const { mailService, service, userRepository } = createService();

    userRepository.findOne
      .mockResolvedValueOnce(createUser({ isActive: false }))
      .mockResolvedValueOnce(createUser({ isEmailVerified: false }));

    await expect(
      service.forgotPassword({ email: 'student@example.com' }),
    ).resolves.toEqual(RESET_RESPONSE);
    await expect(
      service.forgotPassword({ email: 'student@example.com' }),
    ).resolves.toEqual(RESET_RESPONSE);

    expect(userRepository.update).not.toHaveBeenCalled();
    expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('sends reset email for eligible users but keeps the public response neutral', async () => {
    const { mailService, service, userRepository } = createService();
    userRepository.findOne.mockResolvedValue(createUser());
    userRepository.update.mockResolvedValue(createUser());
    mailService.sendPasswordResetEmail.mockResolvedValue(undefined);

    await expect(
      service.forgotPassword({ email: 'student@example.com' }),
    ).resolves.toEqual(RESET_RESPONSE);

    const [updatedUserId, resetUpdate] = userRepository.update.mock
      .calls[0] as [
      string,
      { resetPasswordTokenHash: string; resetPasswordTokenExpiresAt: Date },
    ];
    expect(updatedUserId).toBe('user-1');
    expect(typeof resetUpdate.resetPasswordTokenHash).toBe('string');
    expect(resetUpdate.resetPasswordTokenExpiresAt).toBeInstanceOf(Date);
    expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith(
      'student@example.com',
      expect.stringContaining('/reset-password?token='),
      expect.any(Date),
    );
  });

  it('rolls back reset state but still returns the neutral response when email delivery fails', async () => {
    const { mailService, service, userRepository } = createService();
    userRepository.findOne.mockResolvedValue(createUser());
    userRepository.update.mockResolvedValue(createUser());
    mailService.sendPasswordResetEmail.mockRejectedValue(
      new Error('SMTP unavailable'),
    );

    await expect(
      service.forgotPassword({ email: 'student@example.com' }),
    ).resolves.toEqual(RESET_RESPONSE);

    expect(userRepository.update).toHaveBeenNthCalledWith(2, 'user-1', {
      resetPasswordTokenHash: null,
      resetPasswordTokenExpiresAt: null,
    });
  });
});

describe('AuthenticationService.register', () => {
  it('recovers from a concurrent unverified registration for the same email', async () => {
    const { mailService, service, userRepository } = createService();
    const racedUser = createUser({
      id: 'race-user',
      email: 'new@example.com',
      isEmailVerified: false,
      emailVerificationTokenHash: 'old-token',
      emailVerificationTokenExpiresAt: new Date('2026-04-01T00:00:00.000Z'),
    });
    userRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(racedUser);
    userRepository.create.mockRejectedValueOnce({ code: '23505' });
    userRepository.update.mockResolvedValue({
      ...racedUser,
      name: 'New Student',
      emailVerificationTokenHash: 'new-token',
    });
    mailService.sendEmailVerificationEmail.mockResolvedValue(undefined);

    await expect(
      service.register({
        email: ' New@Example.com ',
        name: ' New Student ',
      }),
    ).resolves.toMatchObject({
      user: {
        id: 'race-user',
        email: 'new@example.com',
        name: 'New Student',
        isEmailVerified: false,
      },
    });

    expect(userRepository.findOne).toHaveBeenNthCalledWith(2, {
      where: { email: 'new@example.com' },
    });
    expect(userRepository.update).toHaveBeenCalledWith(
      'race-user',
      expect.objectContaining({
        name: 'New Student',
        role: UserRole.USER,
        emailVerificationTokenHash: expect.any(String) as string,
        emailVerificationTokenExpiresAt: expect.any(Date) as Date,
      }),
    );
  });

  it('returns the normal duplicate email error when a raced registration is already verified', async () => {
    const { service, userRepository } = createService();
    userRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(createUser({ email: 'new@example.com' }));
    userRepository.create.mockRejectedValueOnce({ code: '23505' });

    await expect(
      service.register({
        email: 'new@example.com',
        name: 'New Student',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('AuthenticationService.login', () => {
  it('keeps the public error neutral when inactive or unverified accounts use a wrong password', async () => {
    const { service, userRepository } = createService();
    userRepository.findOne
      .mockResolvedValueOnce(createUser({ isActive: false }))
      .mockResolvedValueOnce(createUser({ isEmailVerified: false }));

    await expect(
      service.login({ email: 'student@example.com', password: 'wrong-pass' }),
    ).rejects.toThrow('Invalid credentials');
    await expect(
      service.login({ email: 'student@example.com', password: 'wrong-pass' }),
    ).rejects.toThrow('Invalid credentials');
  });

  it('only reveals inactive account state after the password is valid', async () => {
    const { service, userRepository } = createService();
    userRepository.findOne.mockResolvedValue(createUser({ isActive: false }));

    await expect(
      service.login({ email: 'student@example.com', password: VALID_PASSWORD }),
    ).rejects.toThrow('This account has been deactivated');
  });

  it('creates a revocable refresh session and signs access tokens with the session id', async () => {
    const { jwtService, service, userRepository, userSessionRepository } =
      createService();
    userRepository.findOne.mockResolvedValue(createUser());
    userSessionRepository.create.mockResolvedValue(createSession());

    const result = await service.login(
      { email: 'student@example.com', password: VALID_PASSWORD },
      { ipAddress: '127.0.0.1', userAgent: 'Jest' },
    );

    expect(userSessionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ipAddress: '127.0.0.1',
        refreshTokenExpiresAt: expect.any(Date) as Date,
        refreshTokenHash: expect.any(String) as string,
        csrfTokenHash: expect.any(String) as string,
        userAgent: 'Jest',
        userId: 'user-1',
      }),
    );
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      {
        role: UserRole.USER,
        sid: 'session-1',
        sub: 'user-1',
      },
      { expiresIn: '15m' },
    );
    expect(result.accessToken).toBe('jwt-token');
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(result.refreshTokenExpiresAt).toBeInstanceOf(Date);
    expect(result.csrfToken).toEqual(expect.any(String));
  });
});

describe('AuthenticationService.refreshSession', () => {
  it('validates CSRF, rotates the refresh session, and issues a new access token', async () => {
    const { jwtService, service, userSessionRepository } = createService();
    userSessionRepository.findByRefreshTokenHash.mockResolvedValue(
      createSession(),
    );
    userSessionRepository.rotateRefreshToken.mockResolvedValue(
      createSession({
        id: 'session-2',
        refreshTokenHash: 'new-refresh-token-hash',
        lastUsedAt: new Date(),
      }),
    );

    const result = await service.refreshSession(
      'raw-refresh-token',
      'csrf-token',
      {
        ipAddress: '127.0.0.2',
        userAgent: 'Browser',
      },
    );

    const rotateRefreshTokenInput = userSessionRepository.rotateRefreshToken
      .mock.calls[0] as Parameters<UserSessionRepository['rotateRefreshToken']>;
    expect(rotateRefreshTokenInput[0]).toBe('session-1');
    expect(rotateRefreshTokenInput[1].ipAddress).toBe('127.0.0.2');
    expect(rotateRefreshTokenInput[1].refreshTokenExpiresAt).toBeInstanceOf(
      Date,
    );
    expect(rotateRefreshTokenInput[1].refreshTokenHash).toEqual(
      expect.any(String),
    );
    expect(rotateRefreshTokenInput[1].csrfTokenHash).toEqual(
      expect.any(String),
    );
    expect(rotateRefreshTokenInput[1].userAgent).toBe('Browser');
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      {
        role: UserRole.USER,
        sid: 'session-2',
        sub: 'user-1',
      },
      { expiresIn: '15m' },
    );
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(result.csrfToken).toEqual(expect.any(String));
  });

  it('rejects missing or revoked refresh tokens', async () => {
    const { service, userSessionRepository } = createService();
    userSessionRepository.findByRefreshTokenHash.mockResolvedValue(null);

    await expect(
      service.refreshSession('raw-refresh-token', 'csrf-token'),
    ).rejects.toThrow('Refresh session is invalid or expired');
  });

  it('rejects refresh requests without the matching CSRF token', async () => {
    const { service, userSessionRepository } = createService();
    userSessionRepository.findByRefreshTokenHash.mockResolvedValue(
      createSession(),
    );

    await expect(
      service.refreshSession('raw-refresh-token', 'wrong-csrf-token'),
    ).rejects.toThrow('CSRF token is invalid or missing');
    expect(userSessionRepository.rotateRefreshToken).not.toHaveBeenCalled();
  });

  it('revokes all user sessions when a rotated refresh token is reused', async () => {
    const { service, userSessionRepository } = createService();
    userSessionRepository.findByRefreshTokenHash.mockResolvedValue(
      createSession({ revokedAt: new Date('2026-04-30T00:00:00.000Z') }),
    );

    await expect(
      service.refreshSession('raw-refresh-token', 'csrf-token'),
    ).rejects.toThrow('Refresh session is invalid or expired');

    expect(userSessionRepository.revokeAllForUser).toHaveBeenCalledWith(
      'user-1',
    );
  });
});

describe('AuthenticationService.logoutSession', () => {
  it('revokes the matching refresh session when present', async () => {
    const { service, userSessionRepository } = createService();
    userSessionRepository.findByRefreshTokenHash.mockResolvedValue(
      createSession(),
    );

    await expect(
      service.logoutSession('raw-refresh-token', 'csrf-token'),
    ).resolves.toMatchObject({
      message: 'Signed out successfully.',
    });

    expect(userSessionRepository.revokeSession).toHaveBeenCalledWith(
      'session-1',
    );
  });
});

describe('AuthenticationService.logoutAllSessions', () => {
  it('requires the current refresh session CSRF token before revoking every session', async () => {
    const { service, userSessionRepository } = createService();
    userSessionRepository.findByRefreshTokenHash.mockResolvedValue(
      createSession(),
    );

    await expect(
      service.logoutAllSessions('user-1', 'raw-refresh-token', 'csrf-token'),
    ).resolves.toMatchObject({
      message: 'All sessions signed out successfully.',
    });

    expect(userSessionRepository.revokeAllForUser).toHaveBeenCalledWith(
      'user-1',
    );
  });
});

describe('AuthenticationService.changePassword', () => {
  it('revokes all refresh sessions after a password change', async () => {
    const { service, userRepository, userSessionRepository } = createService();
    userRepository.findById.mockResolvedValue(createUser());
    userRepository.update.mockResolvedValue(createUser());

    await service.changePassword('user-1', {
      currentPassword: VALID_PASSWORD,
      newPassword: 'NewCorrect#12345',
    });

    expect(userSessionRepository.revokeAllForUser).toHaveBeenCalledWith(
      'user-1',
    );
  });
});

describe('AuthenticationService.register', () => {
  it('does not grant admin role through public registration even when email is configured as admin', async () => {
    const { configService, mailService, service, userRepository } =
      createService();
    configService.get.mockImplementation((key: string) =>
      key === 'ADMIN_EMAILS'
        ? 'admin@example.com'
        : new Map<string, string>([
            ['FRONTEND_URL', 'http://localhost:3000'],
            ['EMAIL_VERIFICATION_TTL_MINUTES', '30'],
          ]).get(key),
    );
    const createdUser = createUser({
      email: 'admin@example.com',
      role: UserRole.USER,
      isEmailVerified: false,
    });
    userRepository.findOne.mockResolvedValue(null);
    userRepository.create.mockResolvedValue(createdUser);
    mailService.sendEmailVerificationEmail.mockResolvedValue(undefined);

    await expect(
      service.register({ email: 'admin@example.com', name: 'Admin User' }),
    ).resolves.toMatchObject({
      user: {
        email: 'admin@example.com',
        role: UserRole.USER,
      },
    });

    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'admin@example.com',
        role: UserRole.USER,
      }),
    );
  });
});

describe('authentication password policy DTOs', () => {
  const weakPassword = 'secret123';

  it.each([
    ['complete registration', CompleteRegistrationDto, 'password'],
    ['reset password', ResetPasswordDto, 'password'],
    ['change password', ChangePasswordDto, 'newPassword'],
  ])('rejects weak passwords for %s', async (_name, DtoClass, fieldName) => {
    const dto = new DtoClass();
    Object.assign(dto, {
      token: 'token',
      currentPassword: 'Current#12345',
      [fieldName]: weakPassword,
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === fieldName)).toBe(true);
  });
});
