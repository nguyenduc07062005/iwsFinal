import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserRole } from 'src/database/entities/user.entity';
import { UserRepository } from 'src/database/repositories/user.repository';

const ADMIN_BOOTSTRAP_PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,128}$/;

@Injectable()
export class AdminBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminBootstrapService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const adminEmails = this.parseAdminEmails(
      this.configService.get<string>('ADMIN_EMAILS'),
    );
    const bootstrapPassword = this.configService
      .get<string>('ADMIN_BOOTSTRAP_PASSWORD')
      ?.trim();

    if (adminEmails.length === 0 || !bootstrapPassword) {
      return;
    }

    if (!ADMIN_BOOTSTRAP_PASSWORD_PATTERN.test(bootstrapPassword)) {
      throw new Error(
        'ADMIN_BOOTSTRAP_PASSWORD must be 12-128 characters and include uppercase, lowercase, number, and symbol.',
      );
    }

    const passwordHash = await bcrypt.hash(bootstrapPassword, 10);

    for (const email of adminEmails) {
      await this.bootstrapAdmin(email, passwordHash);
    }
  }

  private parseAdminEmails(value?: string): string[] {
    return Array.from(
      new Set(
        (value ?? '')
          .split(',')
          .map((email) => email.trim().toLowerCase())
          .filter(Boolean),
      ),
    );
  }

  private async bootstrapAdmin(email: string, passwordHash: string) {
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    const adminFields = {
      emailVerificationTokenExpiresAt: null,
      emailVerificationTokenHash: null,
      emailVerifiedAt: new Date(),
      isActive: true,
      isEmailVerified: true,
      role: UserRole.ADMIN,
    };

    if (!existingUser) {
      await this.userRepository.create({
        ...adminFields,
        email,
        name: 'StudyVault Admin',
        password: passwordHash,
      });
      this.logger.log(`Bootstrapped admin account ${email}.`);
      return;
    }

    if (
      existingUser.role === UserRole.ADMIN &&
      existingUser.isActive &&
      existingUser.isEmailVerified
    ) {
      return;
    }

    await this.userRepository.update(existingUser.id, {
      ...adminFields,
      password: passwordHash,
    });
    this.logger.log(`Promoted configured account ${email} to admin.`);
  }
}
