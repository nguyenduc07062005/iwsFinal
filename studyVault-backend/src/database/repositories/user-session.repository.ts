import { Injectable } from '@nestjs/common';
import { DataSource, IsNull, MoreThan } from 'typeorm';
import { UserSession } from '../entities/user-session.entity';
import { BaseRepository } from './base.repository';

type RotateRefreshTokenInput = {
  refreshTokenHash: string;
  csrfTokenHash: string;
  refreshTokenExpiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
};

@Injectable()
export class UserSessionRepository extends BaseRepository<UserSession> {
  constructor(dataSource: DataSource) {
    super(dataSource, UserSession);
  }

  async findActiveByRefreshTokenHash(
    refreshTokenHash: string,
  ): Promise<UserSession | null> {
    return this.repository.findOne({
      where: {
        refreshTokenHash,
        revokedAt: IsNull(),
        refreshTokenExpiresAt: MoreThan(new Date()),
      },
      relations: ['user'],
    });
  }

  async findByRefreshTokenHash(
    refreshTokenHash: string,
  ): Promise<UserSession | null> {
    return this.repository.findOne({
      where: {
        refreshTokenHash,
      },
      relations: ['user'],
    });
  }

  async findActiveById(sessionId: string): Promise<UserSession | null> {
    return this.repository.findOne({
      where: {
        id: sessionId,
        revokedAt: IsNull(),
        refreshTokenExpiresAt: MoreThan(new Date()),
      },
      relations: ['user'],
    });
  }

  async rotateRefreshToken(
    sessionId: string,
    input: RotateRefreshTokenInput,
  ): Promise<UserSession | null> {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(UserSession);
      const now = new Date();
      const currentSession = await repository.findOne({
        where: {
          id: sessionId,
          revokedAt: IsNull(),
          refreshTokenExpiresAt: MoreThan(now),
        },
      });

      if (!currentSession) {
        return null;
      }

      const revokeResult = await repository.update(
        {
          id: sessionId,
          revokedAt: IsNull(),
          refreshTokenExpiresAt: MoreThan(now),
        },
        {
          revokedAt: now,
          lastUsedAt: now,
        },
      );

      if ((revokeResult.affected ?? 0) !== 1) {
        return null;
      }

      const nextSession = repository.create({
        userId: currentSession.userId,
        refreshTokenHash: input.refreshTokenHash,
        csrfTokenHash: input.csrfTokenHash,
        refreshTokenExpiresAt: input.refreshTokenExpiresAt,
        revokedAt: null,
        lastUsedAt: now,
        userAgent: input.userAgent || null,
        ipAddress: input.ipAddress || null,
      });

      return repository.save(nextSession);
    });
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.repository.update(sessionId, {
      revokedAt: new Date(),
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(UserSession)
      .set({ revokedAt: new Date() })
      .where('user_id = :userId', { userId })
      .andWhere('revoked_at IS NULL')
      .execute();
  }
}
