import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { AdminAuditAction } from 'src/database/entities/admin-audit-log.entity';

export class ListAdminAuditLogsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 10;

  @IsOptional()
  @IsIn(Object.values(AdminAuditAction))
  action?: AdminAuditAction;

  @IsOptional()
  @IsUUID('4')
  adminId?: string;

  @IsOptional()
  @IsUUID('4')
  targetUserId?: string;
}
