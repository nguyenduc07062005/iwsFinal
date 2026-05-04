import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import type { StringValue } from 'ms';
import { QueryFailedError } from 'typeorm';
import { MailService } from 'src/common/mail/mail.service';
import { UserSessionRepository } from 'src/database/repositories/user-session.repository';
import { UserRepository } from 'src/database/repositories/user.repository';
import { UserRole } from 'src/database/entities/user.entity';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { CompleteRegistrationDto } from './dtos/complete-registration.dto';
import { CreateUserDto } from './dtos/create-user.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { LoginDto } from './dtos/login.dto';
import { ResendVerificationDto } from './dtos/resend-verification.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { UpdateProfileDto } from './dtos/update-profile.dto';

const DEFAULT_RESET_PASSWORD_TTL_MINUTES = 15;
const DEFAULT_EMAIL_VERIFICATION_TTL_MINUTES = 60 * 24;
const DEFAULT_REFRESH_TOKEN_TTL_DAYS = 7;
const DEFAULT_ACCESS_TOKEN_EXPIRES_IN = '15m';
const INVALID_LOGIN_RESPONSE = 'Invalid credentials';
const DUMMY_PASSWORD_HASH =
  '$2b$10$LTWKSBc351ul97UU4i.8zOes0/iZ2dQMoU6rWlLzvAIBY8WDP6l2q';
const PASSWORD_RESET_RESPONSE =
  'Please check your email to reset your password.';
const EMAIL_VERIFICATION_RESPONSE =
  'If an account with that email needs verification, a verification link has been issued.';
const POSTGRES_UNIQUE_VIOLATION_CODE = '23505';

type SessionRequestContext = {
  ipAddress?: string;
  userAgent?: string;
};

type SessionTokenBundle = {
  rawRefreshToken: string;
  refreshTokenHash: string;
  refreshTokenExpiresAt: Date;
  rawCsrfToken: string;
  csrfTokenHash: string;
};

@Injectable()
export class AuthenticationService {
  private readonly logger = new Logger(AuthenticationService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly userSessionRepository: UserSessionRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  private hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private isTokenHashMatch(
    rawToken: string | undefined,
    tokenHash?: string | null,
  ): boolean {
    if (!rawToken || !tokenHash) {
      return false;
    }

    const rawTokenHash = Buffer.from(this.hashToken(rawToken), 'hex');
    const storedTokenHash = Buffer.from(tokenHash, 'hex');

    return (
      rawTokenHash.length === storedTokenHash.length &&
      timingSafeEqual(rawTokenHash, storedTokenHash)
    );
  }

  private getAccessTokenExpiresIn(): string {
    return (
      this.configService.get<string>('JWT_EXPIRES_IN') ||
      DEFAULT_ACCESS_TOKEN_EXPIRES_IN
    );
  }

  private getRefreshTokenExpiresAt(): Date {
    const expiresAt = new Date();
    const ttlDays = Number(
      this.configService.get<string>('REFRESH_TOKEN_TTL_DAYS') ||
        DEFAULT_REFRESH_TOKEN_TTL_DAYS,
    );

    expiresAt.setDate(expiresAt.getDate() + ttlDays);
    return expiresAt;
  }

  private createSessionTokenBundle(): SessionTokenBundle {
    const rawRefreshToken = randomBytes(64).toString('hex');
    const refreshTokenHash = this.hashToken(rawRefreshToken);
    const refreshTokenExpiresAt = this.getRefreshTokenExpiresAt();
    const rawCsrfToken = randomBytes(32).toString('hex');
    const csrfTokenHash = this.hashToken(rawCsrfToken);

    return {
      rawRefreshToken,
      refreshTokenHash,
      refreshTokenExpiresAt,
      rawCsrfToken,
      csrfTokenHash,
    };
  }

  private async signAccessToken(
    user: {
      id: string;
      role: UserRole;
    },
    sessionId: string,
  ): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: user.id,
        role: user.role,
        sid: sessionId,
      },
      { expiresIn: this.getAccessTokenExpiresIn() as StringValue },
    );
  }

  private assertCsrfToken(
    session: { csrfTokenHash?: string | null },
    csrfToken?: string,
  ) {
    if (!this.isTokenHashMatch(csrfToken, session.csrfTokenHash)) {
      throw new UnauthorizedException('CSRF token is invalid or missing');
    }
  }

  private createResetPasswordToken(): {
    rawToken: string;
    tokenHash: string;
    expiresAt: Date;
  } {
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date();
    const ttlMinutes = Number(
      this.configService.get<string>('RESET_PASSWORD_TTL_MINUTES') ||
        DEFAULT_RESET_PASSWORD_TTL_MINUTES,
    );

    expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);

    return {
      rawToken,
      tokenHash,
      expiresAt,
    };
  }

  private buildResetPasswordResponse() {
    return {
      message: PASSWORD_RESET_RESPONSE,
    };
  }

  private createEmailVerificationToken(): {
    rawToken: string;
    tokenHash: string;
    expiresAt: Date;
  } {
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date();
    const ttlMinutes = Number(
      this.configService.get<string>('EMAIL_VERIFICATION_TTL_MINUTES') ||
        DEFAULT_EMAIL_VERIFICATION_TTL_MINUTES,
    );

    expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);

    return {
      rawToken,
      tokenHash,
      expiresAt,
    };
  }

  private buildResetPasswordUrl(rawToken: string): string {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const baseUrl = frontendUrl.endsWith('/') ? frontendUrl : `${frontendUrl}/`;
    const resetUrl = new URL('/reset-password', baseUrl);
    resetUrl.searchParams.set('token', rawToken);
    return resetUrl.toString();
  }

  private buildEmailVerificationUrl(rawToken: string): string {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const baseUrl = frontendUrl.endsWith('/') ? frontendUrl : `${frontendUrl}/`;
    const verificationUrl = new URL('/complete-registration', baseUrl);
    verificationUrl.searchParams.set('token', rawToken);
    return verificationUrl.toString();
  }

  private isUniqueConstraintViolation(error: unknown): boolean {
    if (error instanceof QueryFailedError) {
      const driverError = error.driverError as { code?: string } | undefined;
      return driverError?.code === POSTGRES_UNIQUE_VIOLATION_CODE;
    }

    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === POSTGRES_UNIQUE_VIOLATION_CODE
    );
  }

  async register(dto: CreateUserDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const displayName = dto.name.trim();
    const existingUser = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser?.isEmailVerified) {
      throw new BadRequestException('Email already in use');
    }

    const { rawToken, tokenHash, expiresAt } =
      this.createEmailVerificationToken();

    let createdUserId: string | null = null;
    let userToRestore = existingUser;
    let user = existingUser
      ? ((await this.userRepository.update(existingUser.id, {
          name: displayName,
          role: UserRole.USER,
          emailVerificationTokenHash: tokenHash,
          emailVerificationTokenExpiresAt: expiresAt,
        })) ?? {
          ...existingUser,
          name: displayName,
          role: UserRole.USER,
          emailVerificationTokenHash: tokenHash,
          emailVerificationTokenExpiresAt: expiresAt,
        })
      : null;

    if (!user) {
      try {
        user = await this.userRepository.create({
          email: normalizedEmail,
          password: await bcrypt.hash(randomBytes(32).toString('hex'), 10),
          name: displayName,
          role: UserRole.USER,
          isActive: true,
          isEmailVerified: false,
          emailVerifiedAt: null,
          emailVerificationTokenHash: tokenHash,
          emailVerificationTokenExpiresAt: expiresAt,
        });
        createdUserId = user.id;
      } catch (error) {
        if (!this.isUniqueConstraintViolation(error)) {
          throw error;
        }

        const racedUser = await this.userRepository.findOne({
          where: { email: normalizedEmail },
        });

        if (!racedUser || racedUser.isEmailVerified) {
          throw new BadRequestException('Email already in use');
        }

        userToRestore = racedUser;
        user = (await this.userRepository.update(racedUser.id, {
          name: displayName,
          role: UserRole.USER,
          emailVerificationTokenHash: tokenHash,
          emailVerificationTokenExpiresAt: expiresAt,
        })) ?? {
          ...racedUser,
          name: displayName,
          role: UserRole.USER,
          emailVerificationTokenHash: tokenHash,
          emailVerificationTokenExpiresAt: expiresAt,
        };
      }
    }

    try {
      await this.mailService.sendEmailVerificationEmail(
        user.email,
        this.buildEmailVerificationUrl(rawToken),
        expiresAt,
      );
    } catch (error) {
      if (userToRestore) {
        await this.userRepository.update(userToRestore.id, {
          name: userToRestore.name,
          role: userToRestore.role,
          emailVerificationTokenHash: userToRestore.emailVerificationTokenHash,
          emailVerificationTokenExpiresAt:
            userToRestore.emailVerificationTokenExpiresAt,
        });
      } else if (createdUserId) {
        await this.userRepository.delete(createdUserId);
      }
      throw error;
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      message:
        'Registration started. Please check your email to set your password.',
    };
  }

  async login(dto: LoginDto, context: SessionRequestContext = {}) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (!user) {
      await bcrypt.compare(dto.password, DUMMY_PASSWORD_HASH);
      throw new UnauthorizedException(INVALID_LOGIN_RESPONSE);
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(INVALID_LOGIN_RESPONSE);
    }

    if (!user.isActive) {
      throw new UnauthorizedException('This account has been deactivated');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Please verify your email and set a password before logging in.',
      );
    }

    const sessionTokens = this.createSessionTokenBundle();
    const session = await this.userSessionRepository.create({
      userId: user.id,
      refreshTokenHash: sessionTokens.refreshTokenHash,
      csrfTokenHash: sessionTokens.csrfTokenHash,
      refreshTokenExpiresAt: sessionTokens.refreshTokenExpiresAt,
      revokedAt: null,
      lastUsedAt: null,
      userAgent: context.userAgent || null,
      ipAddress: context.ipAddress || null,
    });

    return {
      message: 'Login successful.',
      accessToken: await this.signAccessToken(user, session.id),
      refreshToken: sessionTokens.rawRefreshToken,
      refreshTokenExpiresAt: sessionTokens.refreshTokenExpiresAt,
      csrfToken: sessionTokens.rawCsrfToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  async refreshSession(
    refreshToken: string,
    csrfToken?: string,
    context: SessionRequestContext = {},
  ) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh session is invalid or expired');
    }

    const session = await this.userSessionRepository.findByRefreshTokenHash(
      this.hashToken(refreshToken),
    );

    if (!session) {
      throw new UnauthorizedException('Refresh session is invalid or expired');
    }

    if (session.revokedAt) {
      await this.userSessionRepository.revokeAllForUser(session.userId);
      throw new UnauthorizedException('Refresh session is invalid or expired');
    }

    if (
      session.refreshTokenExpiresAt <= new Date() ||
      !session.user?.isActive ||
      !session.user.isEmailVerified
    ) {
      throw new UnauthorizedException('Refresh session is invalid or expired');
    }

    this.assertCsrfToken(session, csrfToken);

    const nextSessionTokens = this.createSessionTokenBundle();
    const nextSession = await this.userSessionRepository.rotateRefreshToken(
      session.id,
      {
        refreshTokenHash: nextSessionTokens.refreshTokenHash,
        csrfTokenHash: nextSessionTokens.csrfTokenHash,
        refreshTokenExpiresAt: nextSessionTokens.refreshTokenExpiresAt,
        userAgent: context.userAgent,
        ipAddress: context.ipAddress,
      },
    );

    if (!nextSession) {
      throw new UnauthorizedException('Refresh session is invalid or expired');
    }

    return {
      message: 'Session refreshed successfully.',
      accessToken: await this.signAccessToken(session.user, nextSession.id),
      refreshToken: nextSessionTokens.rawRefreshToken,
      refreshTokenExpiresAt: nextSessionTokens.refreshTokenExpiresAt,
      csrfToken: nextSessionTokens.rawCsrfToken,
    };
  }

  async logoutSession(refreshToken?: string, csrfToken?: string) {
    if (refreshToken) {
      const session = await this.userSessionRepository.findByRefreshTokenHash(
        this.hashToken(refreshToken),
      );

      if (session && !session.revokedAt) {
        this.assertCsrfToken(session, csrfToken);
        await this.userSessionRepository.revokeSession(session.id);
      }
    }

    return {
      message: 'Signed out successfully.',
    };
  }

  async logoutAllSessions(
    userId: string,
    refreshToken?: string,
    csrfToken?: string,
  ) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh session is invalid or expired');
    }

    const session = await this.userSessionRepository.findByRefreshTokenHash(
      this.hashToken(refreshToken),
    );

    if (!session || session.revokedAt || session.userId !== userId) {
      throw new UnauthorizedException('Refresh session is invalid or expired');
    }

    this.assertCsrfToken(session, csrfToken);

    await this.userSessionRepository.revokeAllForUser(userId);

    return {
      message: 'All sessions signed out successfully.',
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user || !user.isActive || !user.isEmailVerified) {
      return this.buildResetPasswordResponse();
    }

    const { rawToken, tokenHash, expiresAt } = this.createResetPasswordToken();
    const previousTokenHash = user.resetPasswordTokenHash;
    const previousExpiresAt = user.resetPasswordTokenExpiresAt;

    await this.userRepository.update(user.id, {
      resetPasswordTokenHash: tokenHash,
      resetPasswordTokenExpiresAt: expiresAt,
    });

    try {
      await this.mailService.sendPasswordResetEmail(
        user.email,
        this.buildResetPasswordUrl(rawToken),
        expiresAt,
      );
    } catch (error) {
      await this.userRepository.update(user.id, {
        resetPasswordTokenHash: previousTokenHash,
        resetPasswordTokenExpiresAt: previousExpiresAt,
      });
      this.logger.warn(
        `Password reset email could not be sent for user ${user.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    return this.buildResetPasswordResponse();
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');
    const user = await this.userRepository
      .getRepository()
      .createQueryBuilder('user')
      .where('user.reset_password_token_hash = :tokenHash', { tokenHash })
      .andWhere('user.reset_password_token_expires_at IS NOT NULL')
      .andWhere('user.reset_password_token_expires_at > NOW()')
      .getOne();

    if (!user) {
      throw new BadRequestException('Reset token is invalid or has expired');
    }

    const isSamePassword = await bcrypt.compare(dto.password, user.password);
    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    await this.userRepository.update(user.id, {
      password: hashedPassword,
      resetPasswordTokenHash: null,
      resetPasswordTokenExpiresAt: null,
    });
    await this.userSessionRepository.revokeAllForUser(user.id);

    return {
      message: 'Password reset successful.',
    };
  }

  async completeRegistration(dto: CompleteRegistrationDto) {
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');
    const user = await this.userRepository
      .getRepository()
      .createQueryBuilder('user')
      .where('user.email_verification_token_hash = :tokenHash', { tokenHash })
      .andWhere('user.email_verification_token_expires_at IS NOT NULL')
      .andWhere('user.email_verification_token_expires_at > NOW()')
      .getOne();

    if (!user) {
      throw new BadRequestException(
        'Registration token is invalid or has expired',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    await this.userRepository.update(user.id, {
      password: hashedPassword,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      emailVerificationTokenHash: null,
      emailVerificationTokenExpiresAt: null,
    });

    return {
      message: 'Registration completed successfully.',
    };
  }

  async resendEmailVerification(dto: ResendVerificationDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user || !user.isActive || user.isEmailVerified) {
      return {
        message: EMAIL_VERIFICATION_RESPONSE,
      };
    }

    const previousTokenHash = user.emailVerificationTokenHash;
    const previousExpiresAt = user.emailVerificationTokenExpiresAt;
    const { rawToken, tokenHash, expiresAt } =
      this.createEmailVerificationToken();

    await this.userRepository.update(user.id, {
      emailVerificationTokenHash: tokenHash,
      emailVerificationTokenExpiresAt: expiresAt,
    });

    try {
      await this.mailService.sendEmailVerificationEmail(
        user.email,
        this.buildEmailVerificationUrl(rawToken),
        expiresAt,
      );
    } catch (error) {
      await this.userRepository.update(user.id, {
        emailVerificationTokenHash: previousTokenHash,
        emailVerificationTokenExpiresAt: previousExpiresAt,
      });
      throw error;
    }

    return {
      message: EMAIL_VERIFICATION_RESPONSE,
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const nextName = dto.name?.trim();

    if (nextName === undefined || nextName === user.name) {
      return {
        message: 'Profile is already up to date.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          isEmailVerified: user.isEmailVerified,
        },
      };
    }

    if (!nextName) {
      throw new BadRequestException('Name cannot be empty');
    }

    const updatedUser = await this.userRepository.update(user.id, {
      name: nextName,
    });

    const resultUser = updatedUser || { ...user, name: nextName };

    return {
      message: 'Profile updated successfully.',
      user: {
        id: resultUser.id,
        email: resultUser.email,
        name: resultUser.name,
        role: resultUser.role,
        isActive: resultUser.isActive,
        isEmailVerified: resultUser.isEmailVerified,
      },
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const isSamePassword = await bcrypt.compare(dto.newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.userRepository.update(user.id, {
      password: hashedPassword,
      resetPasswordTokenHash: null,
      resetPasswordTokenExpiresAt: null,
    });
    await this.userSessionRepository.revokeAllForUser(user.id);

    return {
      message: 'Password changed successfully.',
    };
  }
}
