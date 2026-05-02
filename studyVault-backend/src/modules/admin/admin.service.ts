import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AdminAuditAction,
  AdminAuditLog,
  AdminAuditTargetType,
} from 'src/database/entities/admin-audit-log.entity';
import { buildContainsLikePattern } from 'src/common/database/like-pattern';
import { DocumentRepository } from 'src/database/repositories/document.repository';
import { FolderRepository } from 'src/database/repositories/folder.repository';
import { UserRole } from 'src/database/entities/user.entity';
import { AdminAuditLogRepository } from 'src/database/repositories/admin-audit-log.repository';
import { UserSessionRepository } from 'src/database/repositories/user-session.repository';
import { UserDocumentRepository } from 'src/database/repositories/user-document.repository';
import { UserRepository } from 'src/database/repositories/user.repository';
import { ListAdminAuditLogsDto } from './dtos/list-admin-audit-logs.dto';
import { ListAdminUsersDto } from './dtos/list-admin-users.dto';
import { UpdateUserStatusDto } from './dtos/update-user-status.dto';

type TypeCountRow = {
  type: string;
  count: string;
};

const DOCUMENT_TYPE_EXPRESSION = `
  CASE
    WHEN LOWER(COALESCE(userDocument.documentName, document.title, document.fileRef, '')) LIKE '%.pdf' THEN 'pdf'
    WHEN LOWER(COALESCE(userDocument.documentName, document.title, document.fileRef, '')) LIKE '%.docx' THEN 'docx'
    WHEN LOWER(COALESCE(userDocument.documentName, document.title, document.fileRef, '')) LIKE '%.txt' THEN 'txt'
    ELSE 'other'
  END
`;

const sanitizeUser = (user: {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const sanitizeAuditLog = (auditLog: AdminAuditLog) => ({
  id: auditLog.id,
  action: auditLog.action,
  targetType: auditLog.targetType,
  adminId: auditLog.adminId,
  targetUserId: auditLog.targetUserId,
  metadata: auditLog.metadata ?? {},
  createdAt: auditLog.createdAt,
  updatedAt: auditLog.updatedAt,
});

@Injectable()
export class AdminService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly documentRepository: DocumentRepository,
    private readonly folderRepository: FolderRepository,
    private readonly userDocumentRepository: UserDocumentRepository,
    private readonly adminAuditLogRepository: AdminAuditLogRepository,
    private readonly userSessionRepository: UserSessionRepository,
  ) {}

  async listUsers(query: ListAdminUsersDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const status = query.status || 'all';
    const keyword = query.keyword?.trim();

    const queryBuilder = this.userRepository
      .getRepository()
      .createQueryBuilder('user')
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (keyword) {
      queryBuilder.andWhere(
        "(LOWER(user.email) LIKE LOWER(:keyword) ESCAPE '\\' OR LOWER(COALESCE(user.name, '')) LIKE LOWER(:keyword) ESCAPE '\\')",
        { keyword: buildContainsLikePattern(keyword) },
      );
    }

    if (status === 'active') {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive: true });
    }

    if (status === 'locked') {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive: false });
    }

    const [users, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.max(Math.ceil(total / limit), 1);

    return {
      message: 'Users retrieved successfully.',
      data: users.map(sanitizeUser),
      pagination: {
        currentPage: page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        keyword: keyword || '',
        status,
      },
    };
  }

  async updateUserStatus(
    targetUserId: string,
    adminUserId: string,
    dto: UpdateUserStatusDto,
  ) {
    if (targetUserId === adminUserId) {
      throw new BadRequestException('Admin cannot lock their own account');
    }

    const targetUser = await this.userRepository.findById(targetUserId);

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    if (targetUser.role === UserRole.ADMIN) {
      throw new BadRequestException('Admin account status cannot be changed');
    }

    const updatedUser = await this.userRepository.update(targetUser.id, {
      isActive: dto.isActive,
    });
    const action = dto.isActive
      ? AdminAuditAction.USER_UNLOCKED
      : AdminAuditAction.USER_LOCKED;

    await this.adminAuditLogRepository.create({
      action,
      adminId: adminUserId,
      metadata: {
        previousIsActive: targetUser.isActive,
        nextIsActive: dto.isActive,
        targetEmail: targetUser.email,
        targetName: targetUser.name,
        targetRole: targetUser.role,
      },
      targetType: AdminAuditTargetType.USER,
      targetUserId: targetUser.id,
    });

    if (!dto.isActive) {
      await this.userSessionRepository.revokeAllForUser(targetUser.id);
    }

    return {
      message: dto.isActive
        ? 'User account unlocked successfully.'
        : 'User account locked successfully.',
      data: sanitizeUser(updatedUser || targetUser),
    };
  }

  async listAuditLogs(query: ListAdminAuditLogsDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const queryBuilder = this.adminAuditLogRepository
      .getRepository()
      .createQueryBuilder('auditLog')
      .orderBy('auditLog.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.action) {
      queryBuilder.andWhere('auditLog.action = :action', {
        action: query.action,
      });
    }

    if (query.adminId) {
      queryBuilder.andWhere('auditLog.adminId = :adminId', {
        adminId: query.adminId,
      });
    }

    if (query.targetUserId) {
      queryBuilder.andWhere('auditLog.targetUserId = :targetUserId', {
        targetUserId: query.targetUserId,
      });
    }

    const [auditLogs, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.max(Math.ceil(total / limit), 1);

    return {
      message: 'Admin audit logs retrieved successfully.',
      data: auditLogs.map(sanitizeAuditLog),
      pagination: {
        currentPage: page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        action: query.action,
        adminId: query.adminId,
        targetUserId: query.targetUserId,
      },
    };
  }

  async getStats() {
    const usersRepository = this.userRepository.getRepository();
    const documentsRepository = this.documentRepository.getRepository();
    const foldersRepository = this.folderRepository.getRepository();
    const userDocumentsRepository = this.userDocumentRepository.getRepository();

    const [
      totalUsers,
      activeUsers,
      lockedUsers,
      totalDocuments,
      totalFolders,
      storageResult,
      documentsByTypeRows,
    ] = await Promise.all([
      usersRepository.count(),
      usersRepository.count({ where: { isActive: true } }),
      usersRepository.count({ where: { isActive: false } }),
      userDocumentsRepository.count(),
      foldersRepository.count(),
      documentsRepository
        .createQueryBuilder('document')
        .select('COALESCE(SUM(document.fileSize), 0)', 'total')
        .getRawOne<{ total: string }>(),
      userDocumentsRepository
        .createQueryBuilder('userDocument')
        .leftJoin('userDocument.document', 'document')
        .select(DOCUMENT_TYPE_EXPRESSION, 'type')
        .addSelect('COUNT(*)', 'count')
        .groupBy(DOCUMENT_TYPE_EXPRESSION)
        .getRawMany<TypeCountRow>(),
    ]);

    const documentsByType = documentsByTypeRows.reduce<Record<string, number>>(
      (accumulator, row) => {
        accumulator[row.type] = Number(row.count || 0);
        return accumulator;
      },
      { pdf: 0, docx: 0, txt: 0, other: 0 },
    );

    return {
      message: 'System stats retrieved successfully.',
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          locked: lockedUsers,
        },
        documents: {
          total: totalDocuments,
          byType: documentsByType,
        },
        folders: {
          total: totalFolders,
        },
        storage: {
          totalBytes: Number(storageResult?.total || 0),
        },
      },
    };
  }
}
