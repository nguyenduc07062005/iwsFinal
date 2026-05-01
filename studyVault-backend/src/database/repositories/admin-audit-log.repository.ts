import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AdminAuditLog } from '../entities/admin-audit-log.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class AdminAuditLogRepository extends BaseRepository<AdminAuditLog> {
  constructor(dataSource: DataSource) {
    super(dataSource, AdminAuditLog);
  }
}
