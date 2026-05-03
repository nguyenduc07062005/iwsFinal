import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum AdminAuditAction {
  USER_LOCKED = 'USER_LOCKED',
  USER_PROMOTED_TO_ADMIN = 'USER_PROMOTED_TO_ADMIN',
  USER_UNLOCKED = 'USER_UNLOCKED',
}

export enum AdminAuditTargetType {
  USER = 'user',
}

@Entity('admin_audit_logs')
@Index('IDX_admin_audit_logs_admin_created', ['adminId', 'createdAt'])
@Index('IDX_admin_audit_logs_target_created', ['targetUserId', 'createdAt'])
@Index('IDX_admin_audit_logs_action_created', ['action', 'createdAt'])
export class AdminAuditLog extends BaseEntity {
  @Column({ name: 'admin_id', type: 'uuid' })
  adminId: string;

  @Column({ name: 'target_user_id', type: 'uuid', nullable: true })
  targetUserId: string | null;

  @Column({ name: 'action', type: 'varchar', length: 80 })
  action: AdminAuditAction;

  @Column({ name: 'target_type', type: 'varchar', length: 80 })
  targetType: AdminAuditTargetType;

  @Column({ name: 'metadata', type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;
}
