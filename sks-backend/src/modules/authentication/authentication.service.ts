import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { UserRepository } from 'src/database/repositories/user.repository';
import { UserRole } from 'src/database/entities/user.entity';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { CreateUserDto } from './dtos/create-user.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { LoginDto } from './dtos/login.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { UpdateProfileDto } from './dtos/update-profile.dto';

const DEFAULT_RESET_PASSWORD_TTL_MINUTES = 15;
const DEFAULT_RETURN_RESET_TOKEN = true;

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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
      message:
        'If an account with that email exists, a reset link has been issued.',
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
    const existingUser = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.userRepository.create({
      email: normalizedEmail,
      password: hashedPassword,
      name: dto.name,
      role: this.isConfiguredAdminEmail(normalizedEmail)
        ? UserRole.ADMIN
        : UserRole.USER,
      isActive: true,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      message: 'User registered successfully.',
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

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('This account has been deactivated');
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
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user || !user.isActive) {
      return {
        message:
          'If an account with that email exists, a reset link has been issued.',
      };
    }

    const { rawToken, tokenHash, expiresAt } = this.createResetPasswordToken();

    await this.userRepository.update(user.id, {
      resetPasswordTokenHash: tokenHash,
      resetPasswordTokenExpiresAt: expiresAt,
    });

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
