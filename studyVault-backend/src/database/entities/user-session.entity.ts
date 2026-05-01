import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('user_sessions')
@Index('IDX_user_sessions_user_active', ['userId', 'revokedAt'])
@Index('IDX_user_sessions_refresh_hash', ['refreshTokenHash'], {
  unique: true,
})
export class UserSession extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'refresh_token_hash', type: 'varchar', length: 128 })
  refreshTokenHash: string;

  @Column({
    name: 'csrf_token_hash',
    type: 'varchar',
    length: 128,
    nullable: true,
  })
  csrfTokenHash: string | null;

  @Column({ name: 'refresh_token_expires_at', type: 'timestamp' })
  refreshTokenExpiresAt: Date;

  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
  revokedAt: Date | null;

  @Column({ name: 'last_used_at', type: 'timestamp', nullable: true })
  lastUsedAt: Date | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 255, nullable: true })
  userAgent: string | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 64, nullable: true })
  ipAddress: string | null;
}
