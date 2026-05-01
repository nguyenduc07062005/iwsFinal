import { BadRequestException } from '@nestjs/common';
import { UserRole } from 'src/database/entities/user.entity';
import { AdminAuditLogRepository } from 'src/database/repositories/admin-audit-log.repository';
import { DocumentRepository } from 'src/database/repositories/document.repository';
import { FolderRepository } from 'src/database/repositories/folder.repository';
import { UserDocumentRepository } from 'src/database/repositories/user-document.repository';
import { UserSessionRepository } from 'src/database/repositories/user-session.repository';
import { UserRepository } from 'src/database/repositories/user.repository';
import { AdminService } from './admin.service';

const createAdminUser = (overrides: Record<string, unknown> = {}) => ({
  id: '22222222-2222-4222-8222-222222222222',
  email: 'admin@example.com',
  name: 'Admin',
  role: UserRole.ADMIN,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createService = () => {
  const userRepository = {
    findById: jest.fn(),
    update: jest.fn(),
  };
  const auditLogRepository = {
    create: jest.fn(),
  };
  const userSessionRepository = {
    revokeAllForUser: jest.fn(),
  };

  const service = new AdminService(
    userRepository as never as UserRepository,
    {} as never as DocumentRepository,
    {} as never as FolderRepository,
    {} as never as UserDocumentRepository,
    auditLogRepository as never as AdminAuditLogRepository,
    userSessionRepository as never as UserSessionRepository,
  );

  return {
    service,
    userRepository,
    auditLogRepository,
    userSessionRepository,
  };
};

describe('AdminService.updateUserStatus', () => {
  it('blocks status changes for admin accounts', async () => {
    const { service, userRepository } = createService();
    userRepository.findById.mockResolvedValue(createAdminUser());

    await expect(
      service.updateUserStatus(
        '22222222-2222-4222-8222-222222222222',
        '11111111-1111-4111-8111-111111111111',
        { isActive: false },
      ),
    ).rejects.toThrow(BadRequestException);

    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it('records an audit log when an admin changes a user account status', async () => {
    const {
      service,
      userRepository,
      auditLogRepository,
      userSessionRepository,
    } = createService();
    const targetUser = createAdminUser({
      id: '33333333-3333-4333-8333-333333333333',
      email: 'student@example.com',
      name: 'Student',
      role: UserRole.USER,
      isActive: true,
    });
    const updatedUser = {
      ...targetUser,
      isActive: false,
      updatedAt: new Date(),
    };
    userRepository.findById.mockResolvedValue(targetUser);
    userRepository.update.mockResolvedValue(updatedUser);

    await service.updateUserStatus(
      targetUser.id,
      '11111111-1111-4111-8111-111111111111',
      { isActive: false },
    );

    expect(auditLogRepository.create).toHaveBeenCalledWith({
      action: 'USER_LOCKED',
      adminId: '11111111-1111-4111-8111-111111111111',
      metadata: {
        nextIsActive: false,
        previousIsActive: true,
        targetEmail: 'student@example.com',
        targetName: 'Student',
        targetRole: UserRole.USER,
      },
      targetType: 'user',
      targetUserId: targetUser.id,
    });
    expect(userSessionRepository.revokeAllForUser).toHaveBeenCalledWith(
      targetUser.id,
    );
  });
});
