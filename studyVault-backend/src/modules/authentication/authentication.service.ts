import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { MailService } from 'src/common/mail/mail.service';
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
const DEFAULT_RETURN_RESET_TOKEN = false;
const EMAIL_VERIFICATION_RESPONSE =
  'If an account with that email needs verification, a verification link has been issued.';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

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

  private buildResetPasswordResponse(rawToken: string, expiresAt: Date) {
    const shouldReturnToken =
      (this.configService.get<string>('AUTH_RETURN_RESET_TOKEN') ??
        String(DEFAULT_RETURN_RESET_TOKEN)) === 'true';

    const baseResponse = {
      message: 'Please check your email to reset your password.',
    };

    if (!shouldReturnToken) {
      return baseResponse;
    }

    return {
      ...baseResponse,
      resetToken: rawToken,
      resetTokenExpiresAt: expiresAt.toISOString(),
      delivery: 'direct',
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
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:3000';
    const baseUrl = frontendUrl.endsWith('/') ? frontendUrl : `${frontendUrl}/`;
    const resetUrl = new URL('/reset-password', baseUrl);
    resetUrl.searchParams.set('token', rawToken);
    return resetUrl.toString();
  }

  private buildEmailVerificationUrl(rawToken: string): string {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:3000';
    const baseUrl = frontendUrl.endsWith('/') ? frontendUrl : `${frontendUrl}/`;
    const verificationUrl = new URL('/complete-registration', baseUrl);
    verificationUrl.searchParams.set('token', rawToken);
    return verificationUrl.toString();
  }

  private isConfiguredAdminEmail(email: string): boolean {
    const configuredEmails =
      this.configService.get<string>('ADMIN_EMAILS') || '';

    return configuredEmails
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
      .includes(email);
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

    const user =
      existingUser ||
      (await this.userRepository.create({
        email: normalizedEmail,
        password: await bcrypt.hash(randomBytes(32).toString('hex'), 10),
        name: displayName,
        role: this.isConfiguredAdminEmail(normalizedEmail)
          ? UserRole.ADMIN
          : UserRole.USER,
        isActive: true,
        isEmailVerified: false,
        emailVerifiedAt: null,
        emailVerificationTokenHash: tokenHash,
        emailVerificationTokenExpiresAt: expiresAt,
      }));

    if (existingUser) {
      await this.userRepository.update(existingUser.id, {
        name: displayName,
        emailVerificationTokenHash: tokenHash,
        emailVerificationTokenExpiresAt: expiresAt,
      });
    }

    try {
      await this.mailService.sendEmailVerificationEmail(
        user.email,
        this.buildEmailVerificationUrl(rawToken),
        expiresAt,
      );
    } catch (error) {
      if (existingUser) {
        await this.userRepository.update(existingUser.id, {
          name: existingUser.name,
          emailVerificationTokenHash: existingUser.emailVerificationTokenHash,
          emailVerificationTokenExpiresAt:
            existingUser.emailVerificationTokenExpiresAt,
        });
      } else {
        await this.userRepository.delete(user.id);
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

  async login(dto: LoginDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('This account has been deactivated');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Please verify your email and set a password before logging in.',
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      role: user.role,
    };

    return {
      message: 'Login successful.',
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user) {
      throw new BadRequestException('Email does not exist in the system.');
    }

    if (!user.isActive) {
      throw new BadRequestException('This account has been deactivated.');
    }

    if (!user.isEmailVerified) {
      throw new BadRequestException(
        'This account has not been activated. Please check your verification email first.',
      );
    }

    const { rawToken, tokenHash, expiresAt } = this.createResetPasswordToken();

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
        resetPasswordTokenHash: null,
        resetPasswordTokenExpiresAt: null,
      });
      throw error;
    }

    return this.buildResetPasswordResponse(rawToken, expiresAt);
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

    return {
      message: 'Profile updated successfully.',
      user: {
        id: updatedUser?.id,
        email: updatedUser?.email,
        name: updatedUser?.name,
        role: updatedUser?.role,
        isActive: updatedUser?.isActive,
        isEmailVerified: updatedUser?.isEmailVerified,
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

    return {
      message: 'Password changed successfully.',
    };
  }
}
