/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access -- Supertest app handles and response bodies are dynamic in this e2e spec. */
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthenticationController } from '../src/modules/authentication/authentication.controller';
import { AuthenticationService } from '../src/modules/authentication/authentication.service';
import { AdminController } from '../src/modules/admin/admin.controller';
import { AdminService } from '../src/modules/admin/admin.service';
import { DocumentController } from '../src/modules/document/document.controller';
import { DocumentFileService } from '../src/modules/document/document-file.service';
import { DocumentNotesService } from '../src/modules/document/document-notes.service';
import { DocumentService } from '../src/modules/document/document.service';
import { FolderController } from '../src/modules/folder/folder.controller';
import { FolderService } from '../src/modules/folder/folder.service';
import { TagController } from '../src/modules/tag/tag.controller';
import { TagService } from '../src/modules/tag/tag.service';
import { LlmController } from '../src/common/llm/llm.controller';
import { GeminiService } from '../src/common/llm/gemini.service';
import { RagController } from '../src/modules/rag/rag.controller';
import { RagMindMapService } from '../src/modules/rag/services/rag-mind-map.service';
import { RagSummaryService } from '../src/modules/rag/services/rag-summary.service';
import { RagService } from '../src/modules/rag/rag.service';
import {
  createHttpTestApp,
  TEST_DOCUMENT_ID,
  TEST_FOLDER_ID,
  TEST_PARENT_FOLDER_ID,
  TEST_USER_ID,
} from './support/http-test-app';

const authHeader = {
  Authorization: 'Bearer phase-8-test-token',
};
const userAuthHeader = {
  Authorization: 'Bearer user-test-token',
};
const lockedAuthHeader = {
  Authorization: 'Bearer locked-test-token',
};

const TEST_SECONDARY_USER_ID = '55555555-5555-4555-8555-555555555555';
const TEST_NOTE_ID = '66666666-6666-4666-8666-666666666666';
const TEST_TAG_ID = '77777777-7777-4777-8777-777777777777';

describe('StudyVault LLM debug API (e2e)', () => {
  let app: INestApplication;

  const geminiService = {
    generateText: jest.fn(),
    createEmbedding: jest.fn(),
  };

  beforeAll(async () => {
    app = await createHttpTestApp({
      controllers: [LlmController],
      providers: [
        {
          provide: GeminiService,
          useValue: geminiService,
        },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects unauthenticated LLM test requests', async () => {
    geminiService.generateText.mockResolvedValue('AI response');

    await request(app.getHttpServer())
      .get('/api/llm/test')
      .query({ prompt: 'hello' })
      .expect(401);

    expect(geminiService.generateText).not.toHaveBeenCalled();
  });

  it('rejects non-admin LLM test requests', async () => {
    geminiService.generateText.mockResolvedValue('AI response');

    await request(app.getHttpServer())
      .get('/api/llm/test')
      .set(userAuthHeader)
      .query({ prompt: 'hello' })
      .expect(403);

    expect(geminiService.generateText).not.toHaveBeenCalled();
  });
});

describe('StudyVault auth API (e2e)', () => {
  let app: INestApplication;

  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshSession: jest.fn(),
    logoutSession: jest.fn(),
    logoutAllSessions: jest.fn(),
    forgotPassword: jest.fn(),
    completeRegistration: jest.fn(),
    resendEmailVerification: jest.fn(),
    resetPassword: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
  };

  beforeAll(async () => {
    app = await createHttpTestApp({
      controllers: [AuthenticationController],
      providers: [
        {
          provide: AuthenticationService,
          useValue: authService,
        },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a user and returns the backend payload', async () => {
    authService.register.mockResolvedValue({
      message:
        'Registration started. Please check your email to set your password.',
      user: {
        id: TEST_USER_ID,
        email: 'student@example.com',
        name: 'Nguyen Van A',
        isEmailVerified: false,
      },
    });

    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'student@example.com',
        name: 'Nguyen Van A',
      })
      .expect(201);

    expect(authService.register).toHaveBeenCalledWith({
      email: 'student@example.com',
      name: 'Nguyen Van A',
    });
    expect(response.body.user.email).toBe('student@example.com');
    expect(response.body.user.isEmailVerified).toBe(false);
  });

  it('returns readable validation errors for invalid auth payloads', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'bad-email',
        name: '',
      })
      .expect(400);

    expect(response.body.error).toBe('Bad Request');
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        'Invalid email format',
        'name: Name is required',
      ]),
    );
  });

  it('supports login, forgot password, reset password, and profile lookup', async () => {
    authService.login.mockResolvedValue({
      accessToken: 'jwt-token',
      refreshToken: 'refresh-token',
      refreshTokenExpiresAt: new Date('2026-05-07T00:00:00.000Z'),
      csrfToken: 'csrf-token',
    });
    authService.refreshSession.mockResolvedValue({
      accessToken: 'new-jwt-token',
      refreshToken: 'new-refresh-token',
      refreshTokenExpiresAt: new Date('2026-05-07T00:00:00.000Z'),
      csrfToken: 'new-csrf-token',
    });
    authService.logoutSession.mockResolvedValue({
      message: 'Signed out successfully.',
    });
    authService.logoutAllSessions.mockResolvedValue({
      message: 'All sessions signed out successfully.',
    });
    authService.forgotPassword.mockResolvedValue({
      message: 'Please check your email to reset your password.',
    });
    authService.completeRegistration.mockResolvedValue({
      message: 'Registration completed successfully.',
    });
    authService.resendEmailVerification.mockResolvedValue({
      message:
        'If an account with that email needs verification, a verification link has been issued.',
    });
    authService.resetPassword.mockResolvedValue({
      message: 'Password reset successfully',
    });
    authService.getProfile.mockResolvedValue({
      id: TEST_USER_ID,
      email: 'student@example.com',
      name: 'Nguyen Van A',
      role: 'student',
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'student@example.com',
        password: 'secret123',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.accessToken).toBe('jwt-token');
        expect(body.csrfToken).toBe('csrf-token');
        expect(body.refreshToken).toBeUndefined();
        expect(body.refreshTokenExpiresAt).toBeUndefined();
      });
    const loginSetCookies = loginResponse.headers['set-cookie'] as unknown as
      | string[]
      | undefined;
    expect(loginSetCookies?.[0]).toContain(
      'studyvault_refresh_token=refresh-token',
    );
    expect((loginSetCookies ?? []).join(';')).toContain(
      'studyvault_csrf_token=csrf-token',
    );

    const refreshResponse = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', ['studyvault_refresh_token=refresh-token'])
      .set('X-CSRF-Token', 'csrf-token')
      .expect(200)
      .expect(({ body }) => {
        expect(body.accessToken).toBe('new-jwt-token');
        expect(body.csrfToken).toBe('new-csrf-token');
        expect(body.refreshToken).toBeUndefined();
        expect(body.refreshTokenExpiresAt).toBeUndefined();
      });
    const refreshSetCookies = refreshResponse.headers[
      'set-cookie'
    ] as unknown as string[] | undefined;
    expect(refreshSetCookies?.[0]).toContain(
      'studyvault_refresh_token=new-refresh-token',
    );
    expect((refreshSetCookies ?? []).join(';')).toContain(
      'studyvault_csrf_token=new-csrf-token',
    );
    const refreshSessionCall = authService.refreshSession.mock.calls[0] as [
      string,
      string,
      { ipAddress?: string },
    ];
    expect(refreshSessionCall[0]).toBe('refresh-token');
    expect(refreshSessionCall[1]).toBe('csrf-token');
    expect(refreshSessionCall[2].ipAddress).toEqual(expect.any(String));

    await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({
        email: 'student@example.com',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.message).toBe(
          'Please check your email to reset your password.',
        );
        expect(body.resetToken).toBeUndefined();
      });

    await request(app.getHttpServer())
      .post('/api/auth/complete-registration')
      .send({
        token: 'email-verification-token',
        password: 'StrongPass#123',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.message).toBe('Registration completed successfully.');
      });

    await request(app.getHttpServer())
      .post('/api/auth/resend-verification')
      .send({
        email: 'student@example.com',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.message).toContain('verification link has been issued');
      });

    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({
        token: 'demo-reset-token',
        password: 'StrongPass#123',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.message).toBe('Password reset successfully');
      });

    await request(app.getHttpServer())
      .get('/api/auth/profile')
      .set(authHeader)
      .expect(200)
      .expect(({ body }) => {
        expect(body.email).toBe('student@example.com');
      });

    expect(authService.getProfile).toHaveBeenCalledWith(TEST_USER_ID);

    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', ['studyvault_refresh_token=new-refresh-token'])
      .set('X-CSRF-Token', 'new-csrf-token')
      .expect(200)
      .expect(({ body }) => {
        expect(body.message).toBe('Signed out successfully.');
      });
    expect(authService.logoutSession).toHaveBeenCalledWith(
      'new-refresh-token',
      'new-csrf-token',
    );

    await request(app.getHttpServer())
      .post('/api/auth/logout-all')
      .set(authHeader)
      .set('Cookie', ['studyvault_refresh_token=new-refresh-token'])
      .set('X-CSRF-Token', 'new-csrf-token')
      .expect(200)
      .expect(({ body }) => {
        expect(body.message).toBe('All sessions signed out successfully.');
      });
    expect(authService.logoutAllSessions).toHaveBeenCalledWith(
      TEST_USER_ID,
      'new-refresh-token',
      'new-csrf-token',
    );
  });

  it('rejects refresh and logout requests with refresh cookies but no CSRF header before mutating sessions', async () => {
    const csrfError = new UnauthorizedException(
      'CSRF token is invalid or missing',
    );
    authService.refreshSession.mockRejectedValue(csrfError);
    authService.logoutSession.mockRejectedValue(csrfError);
    authService.logoutAllSessions.mockRejectedValue(csrfError);

    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', ['studyvault_refresh_token=refresh-token'])
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', ['studyvault_refresh_token=refresh-token'])
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/auth/logout-all')
      .set(authHeader)
      .set('Cookie', ['studyvault_refresh_token=refresh-token'])
      .expect(401);

    expect(authService.refreshSession).not.toHaveBeenCalled();
    expect(authService.logoutSession).not.toHaveBeenCalled();
    expect(authService.logoutAllSessions).not.toHaveBeenCalled();
  });

  it('updates profile name and changes password through protected routes', async () => {
    authService.updateProfile.mockResolvedValue({
      message: 'Profile updated successfully',
      user: {
        id: TEST_USER_ID,
        email: 'student@example.com',
        name: 'Nguyen Van B',
        role: 'user',
        isActive: true,
      },
    });
    authService.changePassword.mockResolvedValue({
      message: 'Password changed successfully.',
    });

    await request(app.getHttpServer())
      .patch('/api/auth/profile')
      .set(authHeader)
      .send({
        name: 'Nguyen Van B',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.user.name).toBe('Nguyen Van B');
      });

    expect(authService.updateProfile).toHaveBeenCalledWith(TEST_USER_ID, {
      name: 'Nguyen Van B',
    });

    await request(app.getHttpServer())
      .patch('/api/auth/password')
      .set(authHeader)
      .send({
        currentPassword: 'secret123',
        newPassword: 'NewSecret#123',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.message).toBe('Password changed successfully.');
      });

    expect(authService.changePassword).toHaveBeenCalledWith(TEST_USER_ID, {
      currentPassword: 'secret123',
      newPassword: 'NewSecret#123',
    });
  });

  it('rejects protected auth routes when the token is missing', async () => {
    await request(app.getHttpServer()).get('/api/auth/profile').expect(401);
  });

  it('rejects protected auth routes when the account token is locked', async () => {
    authService.getProfile.mockResolvedValue({
      id: TEST_USER_ID,
      email: 'student@example.com',
    });

    await request(app.getHttpServer())
      .get('/api/auth/profile')
      .set(lockedAuthHeader)
      .expect(401);

    expect(authService.getProfile).not.toHaveBeenCalled();
  });
});

describe('StudyVault admin API (e2e)', () => {
  let app: INestApplication;

  const adminService = {
    listUsers: jest.fn(),
    listAuditLogs: jest.fn(),
    updateUserRole: jest.fn(),
    updateUserStatus: jest.fn(),
    getStats: jest.fn(),
  };

  beforeAll(async () => {
    app = await createHttpTestApp({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: adminService,
        },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists users, toggles account status, and returns system stats', async () => {
    adminService.listUsers.mockResolvedValue({
      message: 'Users retrieved successfully.',
      data: [
        {
          id: TEST_SECONDARY_USER_ID,
          email: 'student@example.com',
          name: 'Nguyen Van A',
          role: 'user',
          isActive: true,
        },
      ],
      pagination: {
        currentPage: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    });
    adminService.updateUserStatus.mockResolvedValue({
      message: 'User account locked successfully.',
      data: {
        id: TEST_SECONDARY_USER_ID,
        email: 'student@example.com',
        isActive: false,
      },
    });
    adminService.updateUserRole.mockResolvedValue({
      message: 'User promoted to admin successfully.',
      data: {
        id: TEST_SECONDARY_USER_ID,
        email: 'student@example.com',
        role: 'admin',
        isActive: true,
      },
    });
    adminService.getStats.mockResolvedValue({
      message: 'System stats retrieved successfully.',
      data: {
        users: {
          total: 2,
          active: 1,
          locked: 1,
        },
        documents: {
          total: 4,
          byType: {
            pdf: 2,
            docx: 1,
            txt: 1,
            other: 0,
          },
        },
        folders: {
          total: 3,
        },
        storage: {
          totalBytes: 2048,
        },
      },
    });
    adminService.listAuditLogs.mockResolvedValue({
      message: 'Admin audit logs retrieved successfully.',
      data: [
        {
          id: 'audit-1',
          action: 'USER_LOCKED',
          targetType: 'user',
          targetUserId: TEST_SECONDARY_USER_ID,
          adminId: TEST_USER_ID,
          metadata: {
            targetEmail: 'student@example.com',
            previousIsActive: true,
            nextIsActive: false,
          },
          createdAt: '2026-04-30T00:00:00.000Z',
        },
      ],
      pagination: {
        currentPage: 1,
        limit: 5,
        total: 1,
        totalPages: 1,
      },
      filters: {
        action: 'USER_LOCKED',
        targetUserId: TEST_SECONDARY_USER_ID,
      },
    });

    await request(app.getHttpServer())
      .get('/api/admin/users')
      .set(authHeader)
      .query({
        keyword: 'student',
        status: 'active',
        page: '1',
        limit: '10',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.data).toHaveLength(1);
        expect(body.data[0].email).toBe('student@example.com');
      });

    expect(adminService.listUsers).toHaveBeenCalledWith({
      keyword: 'student',
      status: 'active',
      page: 1,
      limit: 10,
    });

    await request(app.getHttpServer())
      .patch(`/api/admin/users/${TEST_SECONDARY_USER_ID}/status`)
      .set(authHeader)
      .send({
        isActive: false,
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.isActive).toBe(false);
      });

    expect(adminService.updateUserStatus).toHaveBeenCalledWith(
      TEST_SECONDARY_USER_ID,
      TEST_USER_ID,
      { isActive: false },
    );

    await request(app.getHttpServer())
      .patch(`/api/admin/users/${TEST_SECONDARY_USER_ID}/role`)
      .set(authHeader)
      .send({
        role: 'admin',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.role).toBe('admin');
      });

    expect(adminService.updateUserRole).toHaveBeenCalledWith(
      TEST_SECONDARY_USER_ID,
      TEST_USER_ID,
      { role: 'admin' },
    );

    await request(app.getHttpServer())
      .get('/api/admin/stats')
      .set(authHeader)
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.users.total).toBe(2);
        expect(body.data.documents.byType.pdf).toBe(2);
      });

    await request(app.getHttpServer())
      .get('/api/admin/audit-logs')
      .set(authHeader)
      .query({
        action: 'USER_LOCKED',
        targetUserId: TEST_SECONDARY_USER_ID,
        page: '1',
        limit: '5',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.data).toHaveLength(1);
        expect(body.data[0].action).toBe('USER_LOCKED');
      });

    expect(adminService.listAuditLogs).toHaveBeenCalledWith({
      action: 'USER_LOCKED',
      targetUserId: TEST_SECONDARY_USER_ID,
      page: 1,
      limit: 5,
    });
  });

  it('rejects admin routes when the token is missing', async () => {
    await request(app.getHttpServer()).get('/api/admin/users').expect(401);
  });

  it('rejects admin routes for non-admin users', async () => {
    adminService.listUsers.mockResolvedValue({
      data: [],
      pagination: {
        currentPage: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
      },
    });

    await request(app.getHttpServer())
      .get('/api/admin/users')
      .set(userAuthHeader)
      .expect(403);

    expect(adminService.listUsers).not.toHaveBeenCalled();
  });
});

describe('StudyVault folder API (e2e)', () => {
  let app: INestApplication;

  const folderService = {
    getFolders: jest.fn(),
    getFolderById: jest.fn(),
    createFolder: jest.fn(),
    updateFolder: jest.fn(),
    moveFolder: jest.fn(),
    deleteFolder: jest.fn(),
    addDocumentToFolder: jest.fn(),
    removeDocumentFromFolder: jest.fn(),
    getDocumentsByFolder: jest.fn(),
  };

  beforeAll(async () => {
    app = await createHttpTestApp({
      controllers: [FolderController],
      providers: [
        {
          provide: FolderService,
          useValue: folderService,
        },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('covers folder CRUD and document organization routes', async () => {
    folderService.createFolder.mockResolvedValue({
      id: TEST_FOLDER_ID,
      name: 'Semester 8',
      parentId: null,
    });
    folderService.updateFolder.mockResolvedValue({
      id: TEST_FOLDER_ID,
      name: 'Semester 8 Updated',
      parentId: null,
    });
    folderService.moveFolder.mockResolvedValue({
      id: TEST_FOLDER_ID,
      name: 'Semester 8 Updated',
      parentId: TEST_PARENT_FOLDER_ID,
    });
    folderService.getFolders.mockResolvedValue({
      total: 2,
      folders: [
        { id: TEST_PARENT_FOLDER_ID, name: 'Workspace', children: [] },
        { id: TEST_FOLDER_ID, name: 'Semester 8 Updated', children: [] },
      ],
    });
    folderService.addDocumentToFolder.mockResolvedValue({
      message: 'Document added to folder successfully',
    });
    folderService.removeDocumentFromFolder.mockResolvedValue({
      message: 'Document removed from folder successfully',
    });
    folderService.getDocumentsByFolder.mockResolvedValue({
      total: 1,
      currentPage: 1,
      totalPages: 1,
      documents: [{ id: TEST_DOCUMENT_ID, title: 'Week 5 Notes' }],
    });
    folderService.deleteFolder.mockResolvedValue({
      message: 'Folder deleted successfully',
    });

    await request(app.getHttpServer())
      .post('/api/folders')
      .set(authHeader)
      .send({
        name: 'Semester 8',
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.folder.name).toBe('Semester 8');
      });

    await request(app.getHttpServer())
      .patch('/api/folders/update')
      .set(authHeader)
      .send({
        folderId: TEST_FOLDER_ID,
        name: 'Semester 8 Updated',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.folder.name).toBe('Semester 8 Updated');
      });

    await request(app.getHttpServer())
      .patch(`/api/folders/${TEST_FOLDER_ID}`)
      .set(authHeader)
      .send({
        name: 'Semester 8 Updated',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.folder.name).toBe('Semester 8 Updated');
      });

    await request(app.getHttpServer())
      .patch('/api/folders/move')
      .set(authHeader)
      .send({
        folderId: TEST_FOLDER_ID,
        newParentId: TEST_PARENT_FOLDER_ID,
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.folder.parentId).toBe(TEST_PARENT_FOLDER_ID);
      });

    await request(app.getHttpServer())
      .patch(`/api/folders/${TEST_FOLDER_ID}/move`)
      .set(authHeader)
      .send({
        newParentId: TEST_PARENT_FOLDER_ID,
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.folder.parentId).toBe(TEST_PARENT_FOLDER_ID);
      });

    await request(app.getHttpServer())
      .get('/api/folders')
      .set(authHeader)
      .expect(200)
      .expect(({ body }) => {
        expect(body.total).toBe(2);
      });

    await request(app.getHttpServer())
      .post('/api/folders/documents/add')
      .set(authHeader)
      .send({
        folderId: TEST_FOLDER_ID,
        documentId: TEST_DOCUMENT_ID,
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.message).toContain('added');
      });

    await request(app.getHttpServer())
      .delete('/api/folders/documents/remove')
      .set(authHeader)
      .send({
        folderId: TEST_FOLDER_ID,
        documentId: TEST_DOCUMENT_ID,
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.message).toContain('removed');
      });

    await request(app.getHttpServer())
      .get(`/api/folders/${TEST_FOLDER_ID}/documents?page=1&limit=5`)
      .set(authHeader)
      .expect(200)
      .expect(({ body }) => {
        expect(body.documents).toHaveLength(1);
      });

    await request(app.getHttpServer())
      .delete('/api/folders/delete')
      .set(authHeader)
      .send({
        folderId: TEST_FOLDER_ID,
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.message).toBe('Folder deleted successfully');
      });

    await request(app.getHttpServer())
      .delete(`/api/folders/${TEST_FOLDER_ID}`)
      .set(authHeader)
      .expect(200)
      .expect(({ body }) => {
        expect(body.message).toBe('Folder deleted successfully');
      });
  });

  it('passes the authenticated owner to folder ownership-sensitive routes', async () => {
    folderService.getFolderById.mockResolvedValue({
      id: TEST_FOLDER_ID,
      name: 'Semester 8',
      parentId: null,
    });
    folderService.createFolder.mockResolvedValue({
      id: TEST_FOLDER_ID,
      name: 'Security',
      parentId: null,
    });
    folderService.addDocumentToFolder.mockResolvedValue({
      message: 'Document added to folder successfully',
    });
    folderService.removeDocumentFromFolder.mockResolvedValue({
      message: 'Document removed from folder successfully',
    });
    folderService.getDocumentsByFolder.mockResolvedValue({
      total: 0,
      currentPage: 1,
      totalPages: 0,
      documents: [],
    });

    await request(app.getHttpServer())
      .get(`/api/folders/${TEST_FOLDER_ID}`)
      .set(userAuthHeader)
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/folders')
      .set(userAuthHeader)
      .send({ name: 'Security', parentId: TEST_PARENT_FOLDER_ID })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/folders/documents/add')
      .set(userAuthHeader)
      .send({
        folderId: TEST_FOLDER_ID,
        documentId: TEST_DOCUMENT_ID,
      })
      .expect(200);

    await request(app.getHttpServer())
      .delete('/api/folders/documents/remove')
      .set(userAuthHeader)
      .send({
        folderId: TEST_FOLDER_ID,
        documentId: TEST_DOCUMENT_ID,
      })
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/folders/${TEST_FOLDER_ID}/documents`)
      .set(userAuthHeader)
      .query({ page: '2', limit: '3' })
      .expect(200);

    expect(folderService.getFolderById).toHaveBeenCalledWith(
      TEST_FOLDER_ID,
      TEST_USER_ID,
    );
    expect(folderService.createFolder).toHaveBeenCalledWith(
      { name: 'Security', parentId: TEST_PARENT_FOLDER_ID },
      TEST_USER_ID,
    );
    expect(folderService.addDocumentToFolder).toHaveBeenCalledWith(
      TEST_FOLDER_ID,
      TEST_DOCUMENT_ID,
      TEST_USER_ID,
    );
    expect(folderService.removeDocumentFromFolder).toHaveBeenCalledWith(
      TEST_FOLDER_ID,
      TEST_DOCUMENT_ID,
      TEST_USER_ID,
    );
    expect(folderService.getDocumentsByFolder).toHaveBeenCalledWith(
      TEST_FOLDER_ID,
      TEST_USER_ID,
      2,
      3,
    );
  });
});

describe('StudyVault document API (e2e)', () => {
  let app: INestApplication;

  const documentService = {
    validateUploadFile: jest.fn(),
    uploadDocument: jest.fn(),
    getDocumentSummaryForOwner: jest.fn(),
    getDocuments: jest.fn(),
    deleteDocument: jest.fn(),
    toggleFavorite: jest.fn(),
    getFavorites: jest.fn(),
    getDocumentDetails: jest.fn(),
    updateDocumentName: jest.fn(),
    syncDocumentTags: jest.fn(),
    getDocumentTags: jest.fn(),
  };

  const documentFileService = {
    getDocumentHtmlPreview: jest.fn(),
    getDocumentFilePath: jest.fn(),
  };

  const documentNotesService = {
    listStudyNotes: jest.fn(),
    createStudyNote: jest.fn(),
    updateStudyNote: jest.fn(),
    deleteStudyNote: jest.fn(),
  };

  const ragService = {
    ensureDocumentIndexed: jest.fn(),
    searchDocuments: jest.fn(),
    getRelatedDocuments: jest.fn(),
  };

  beforeAll(async () => {
    app = await createHttpTestApp({
      controllers: [DocumentController],
      providers: [
        {
          provide: DocumentService,
          useValue: documentService,
        },
        {
          provide: DocumentFileService,
          useValue: documentFileService,
        },
        {
          provide: DocumentNotesService,
          useValue: documentNotesService,
        },
        {
          provide: RagService,
          useValue: ragService,
        },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    documentService.validateUploadFile.mockImplementation(() => undefined);
  });

  it('supports document upload and core document mutations', async () => {
    documentService.uploadDocument.mockResolvedValue({
      id: TEST_DOCUMENT_ID,
      title: 'Week 5 Notes',
      folderId: TEST_FOLDER_ID,
    });
    ragService.ensureDocumentIndexed.mockResolvedValue(undefined);
    documentService.getDocumentSummaryForOwner.mockResolvedValue({
      id: TEST_DOCUMENT_ID,
      title: 'Week 5 Notes',
      folderId: TEST_FOLDER_ID,
      isFavorite: false,
    });
    documentService.updateDocumentName.mockResolvedValue({
      message: 'Document name updated successfully',
    });
    documentService.toggleFavorite.mockResolvedValue({
      id: TEST_DOCUMENT_ID,
      isFavorite: true,
    });
    documentService.deleteDocument.mockResolvedValue({
      message: 'Document deleted successfully',
    });

    const uploadResponse = await request(app.getHttpServer())
      .post('/api/documents/upload')
      .set(authHeader)
      .field('title', 'Week 5 Notes')
      .field('folderId', TEST_FOLDER_ID)
      .attach('file', Buffer.from('StudyVault upload test'), {
        filename: 'week5.txt',
        contentType: 'text/plain',
      })
      .expect(200);

    expect(uploadResponse.body.message).toBe('Document uploaded successfully');
    expect(documentService.uploadDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        originalname: 'week5.txt',
        mimetype: 'text/plain',
      }),
      expect.objectContaining({
        title: 'Week 5 Notes',
        folderId: TEST_FOLDER_ID,
      }),
      TEST_USER_ID,
    );
    expect(ragService.ensureDocumentIndexed).toHaveBeenCalledWith(
      TEST_DOCUMENT_ID,
    );

    await request(app.getHttpServer())
      .patch(`/api/documents/${TEST_DOCUMENT_ID}/update-name`)
      .set(authHeader)
      .send({
        newDocumentName: 'Week 5 Final Notes',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.message).toContain('updated');
      });

    await request(app.getHttpServer())
      .patch(`/api/documents/${TEST_DOCUMENT_ID}`)
      .set(authHeader)
      .send({
        newDocumentName: 'Week 5 Final Notes',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.message).toContain('updated');
      });

    await request(app.getHttpServer())
      .post(`/api/documents/${TEST_DOCUMENT_ID}/toggle-favorite`)
      .set(authHeader)
      .expect(200)
      .expect(({ body }) => {
        expect(body.document.isFavorite).toBe(true);
      });

    await request(app.getHttpServer())
      .delete('/api/documents/delete')
      .set(authHeader)
      .send({
        documentId: TEST_DOCUMENT_ID,
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.message).toBe('Document deleted successfully');
      });

    await request(app.getHttpServer())
      .delete(`/api/documents/${TEST_DOCUMENT_ID}`)
      .set(authHeader)
      .expect(200)
      .expect(({ body }) => {
        expect(body.message).toBe('Document deleted successfully');
      });
  });

  it('keeps upload successful when background indexing fails', async () => {
    documentService.uploadDocument.mockResolvedValue({
      id: TEST_DOCUMENT_ID,
      title: 'Week 5 Notes',
      folderId: TEST_FOLDER_ID,
    });
    ragService.ensureDocumentIndexed.mockRejectedValue(
      new Error('Gemini quota exhausted'),
    );
    documentService.getDocumentSummaryForOwner.mockResolvedValue({
      id: TEST_DOCUMENT_ID,
      title: 'Week 5 Notes',
      folderId: TEST_FOLDER_ID,
      isFavorite: false,
    });

    await request(app.getHttpServer())
      .post('/api/documents/upload')
      .set(authHeader)
      .field('title', 'Week 5 Notes')
      .field('folderId', TEST_FOLDER_ID)
      .attach('file', Buffer.from('StudyVault upload test'), {
        filename: 'week5.txt',
        contentType: 'text/plain',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.message).toBe('Document uploaded successfully');
        expect(body.indexing.status).toBe('queued');
        expect(body.document.id).toBe(TEST_DOCUMENT_ID);
      });

    expect(ragService.ensureDocumentIndexed).toHaveBeenCalledWith(
      TEST_DOCUMENT_ID,
    );
  });

  it('keeps upload successful when background indexing throws synchronously', async () => {
    documentService.uploadDocument.mockResolvedValue({
      id: TEST_DOCUMENT_ID,
      title: 'Week 5 Notes',
      folderId: TEST_FOLDER_ID,
    });
    ragService.ensureDocumentIndexed.mockImplementation(() => {
      throw new Error('Gemini client failed before creating a request');
    });
    documentService.getDocumentSummaryForOwner.mockResolvedValue({
      id: TEST_DOCUMENT_ID,
      title: 'Week 5 Notes',
      folderId: TEST_FOLDER_ID,
      isFavorite: false,
    });

    await request(app.getHttpServer())
      .post('/api/documents/upload')
      .set(authHeader)
      .field('title', 'Week 5 Notes')
      .field('folderId', TEST_FOLDER_ID)
      .attach('file', Buffer.from('StudyVault upload test'), {
        filename: 'week5.txt',
        contentType: 'text/plain',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.message).toBe('Document uploaded successfully');
        expect(body.indexing.status).toBe('queued');
        expect(body.document.id).toBe(TEST_DOCUMENT_ID);
      });

    expect(ragService.ensureDocumentIndexed).toHaveBeenCalledWith(
      TEST_DOCUMENT_ID,
    );
  });

  it('forwards parsed server-side query options to document listing', async () => {
    documentService.getDocuments.mockResolvedValue({
      pagination: {
        currentPage: 2,
        hasNextPage: true,
        hasPreviousPage: true,
        limit: 5,
        total: 12,
        totalPages: 3,
      },
      filters: {
        favorite: true,
        folderId: TEST_FOLDER_ID,
        keyword: 'thesis',
        sortBy: 'title',
        sortOrder: 'asc',
        type: 'pdf',
      },
      documents: [{ id: TEST_DOCUMENT_ID, title: 'Capstone Thesis' }],
    });

    const response = await request(app.getHttpServer())
      .get('/api/documents')
      .set(authHeader)
      .query({
        page: '2',
        limit: '5',
        sortBy: 'title',
        sortOrder: 'asc',
        folderId: TEST_FOLDER_ID,
        favorite: 'true',
        type: 'pdf',
        keyword: ' thesis ',
      })
      .expect(200);

    expect(documentService.getDocuments).toHaveBeenCalledWith(TEST_USER_ID, {
      page: 2,
      limit: 5,
      sortBy: 'title',
      sortOrder: 'asc',
      folderId: TEST_FOLDER_ID,
      favorite: true,
      type: 'pdf',
      keyword: 'thesis',
    });
    expect(response.body.pagination.total).toBe(12);
  });

  it('returns readable validation errors for invalid list query params', async () => {
    const invalidCases = [
      { query: { page: '0' }, messageFragment: 'page' },
      { query: { limit: '100' }, messageFragment: 'limit' },
      { query: { sortBy: 'rank' }, messageFragment: 'sortBy' },
      { query: { type: 'exe' }, messageFragment: 'type' },
    ];

    for (const invalidCase of invalidCases) {
      const response = await request(app.getHttpServer())
        .get('/api/documents')
        .set(authHeader)
        .query(invalidCase.query)
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain(invalidCase.messageFragment);
    }
  });

  it('rejects protected document routes when the token is missing', async () => {
    await request(app.getHttpServer()).get('/api/documents').expect(401);
  });

  it('covers favorites and search query contracts', async () => {
    documentService.getFavorites.mockResolvedValue({
      pagination: {
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        limit: 4,
        total: 1,
        totalPages: 1,
      },
      filters: {
        keyword: 'notes',
        type: 'pdf',
      },
      documents: [{ id: TEST_DOCUMENT_ID, title: 'Week 5 Notes' }],
    });
    ragService.searchDocuments.mockResolvedValue({
      total: 1,
      page: 2,
      limit: 4,
      items: [
        {
          documentId: TEST_DOCUMENT_ID,
          score: 0.95,
        },
      ],
    });

    await request(app.getHttpServer())
      .get('/api/documents/favorites')
      .set(authHeader)
      .query({
        page: '1',
        limit: '4',
        type: 'pdf',
        keyword: 'notes',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.favorites).toHaveLength(1);
      });

    expect(documentService.getFavorites).toHaveBeenCalledWith(TEST_USER_ID, {
      page: 1,
      limit: 4,
      type: 'pdf',
      keyword: 'notes',
    });

    await request(app.getHttpServer())
      .get('/api/documents/search')
      .set(authHeader)
      .query({
        q: 'thesis',
        page: '2',
        limit: '4',
        folderId: TEST_FOLDER_ID,
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.items).toHaveLength(1);
      });

    expect(ragService.searchDocuments).toHaveBeenCalledWith(
      'thesis',
      TEST_USER_ID,
      {
        folderId: TEST_FOLDER_ID,
        page: 2,
        limit: 4,
      },
    );
  });

  it('passes the authenticated owner to document read and related routes', async () => {
    documentService.getDocumentDetails.mockResolvedValue({
      id: TEST_DOCUMENT_ID,
      title: 'Week 5 Notes',
      folderId: TEST_FOLDER_ID,
    });
    ragService.getRelatedDocuments.mockResolvedValue({
      total: 0,
      documents: [],
    });

    await request(app.getHttpServer())
      .get(`/api/documents/${TEST_DOCUMENT_ID}`)
      .set(userAuthHeader)
      .expect(200)
      .expect(({ body }) => {
        expect(body.document.id).toBe(TEST_DOCUMENT_ID);
      });

    await request(app.getHttpServer())
      .get(`/api/documents/${TEST_DOCUMENT_ID}/related`)
      .set(userAuthHeader)
      .query({ limit: '3' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.total).toBe(0);
      });

    expect(documentService.getDocumentDetails).toHaveBeenCalledWith(
      TEST_DOCUMENT_ID,
      TEST_USER_ID,
    );
    expect(ragService.getRelatedDocuments).toHaveBeenCalledWith(
      TEST_DOCUMENT_ID,
      TEST_USER_ID,
      3,
    );
  });

  it('passes the authenticated owner to document tag and note routes', async () => {
    documentService.syncDocumentTags.mockResolvedValue([
      { id: TEST_TAG_ID, name: 'Security' },
    ]);
    documentService.getDocumentTags.mockResolvedValue([
      { id: TEST_TAG_ID, name: 'Security' },
    ]);
    documentNotesService.listStudyNotes.mockResolvedValue([
      { id: TEST_NOTE_ID, content: 'Review authorization matrix.' },
    ]);
    documentNotesService.createStudyNote.mockResolvedValue({
      id: TEST_NOTE_ID,
      content: 'Review authorization matrix.',
    });
    documentNotesService.updateStudyNote.mockResolvedValue({
      id: TEST_NOTE_ID,
      content: 'Review CSRF protection.',
    });
    documentNotesService.deleteStudyNote.mockResolvedValue({
      id: TEST_NOTE_ID,
    });

    await request(app.getHttpServer())
      .patch(`/api/documents/${TEST_DOCUMENT_ID}/tags`)
      .set(userAuthHeader)
      .send({ tagIds: [TEST_TAG_ID] })
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/documents/${TEST_DOCUMENT_ID}/tags`)
      .set(userAuthHeader)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/documents/${TEST_DOCUMENT_ID}/notes`)
      .set(userAuthHeader)
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/documents/${TEST_DOCUMENT_ID}/notes`)
      .set(userAuthHeader)
      .send({ content: 'Review authorization matrix.' })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/documents/notes/${TEST_NOTE_ID}`)
      .set(userAuthHeader)
      .send({ content: 'Review CSRF protection.' })
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/api/documents/notes/${TEST_NOTE_ID}`)
      .set(userAuthHeader)
      .expect(200);

    expect(documentService.syncDocumentTags).toHaveBeenCalledWith(
      TEST_DOCUMENT_ID,
      TEST_USER_ID,
      [TEST_TAG_ID],
    );
    expect(documentService.getDocumentTags).toHaveBeenCalledWith(
      TEST_DOCUMENT_ID,
      TEST_USER_ID,
    );
    expect(documentNotesService.listStudyNotes).toHaveBeenCalledWith(
      TEST_DOCUMENT_ID,
      TEST_USER_ID,
    );
    expect(documentNotesService.createStudyNote).toHaveBeenCalledWith(
      TEST_DOCUMENT_ID,
      TEST_USER_ID,
      { content: 'Review authorization matrix.' },
    );
    expect(documentNotesService.updateStudyNote).toHaveBeenCalledWith(
      TEST_NOTE_ID,
      TEST_USER_ID,
      { content: 'Review CSRF protection.' },
    );
    expect(documentNotesService.deleteStudyNote).toHaveBeenCalledWith(
      TEST_NOTE_ID,
      TEST_USER_ID,
    );
  });

  it('rejects unsupported upload file types before they reach the service', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/documents/upload')
      .set(authHeader)
      .field('title', 'Invalid Upload')
      .attach('file', Buffer.from('console.log("bad");'), {
        filename: 'invalid.js',
        contentType: 'application/javascript',
      })
      .expect(400);

    expect(response.body.message).toContain('Only PDF, DOCX, or TXT files');
    expect(documentService.uploadDocument).not.toHaveBeenCalled();
  });

  it('rejects forged PDF uploads before they reach the service', async () => {
    documentService.validateUploadFile.mockImplementationOnce(() => {
      throw new BadRequestException(
        'The uploaded file content does not match its file type.',
      );
    });

    const response = await request(app.getHttpServer())
      .post('/api/documents/upload')
      .set(authHeader)
      .field('title', 'Forged PDF')
      .attach('file', Buffer.from('This is not a real PDF file.'), {
        filename: 'forged.pdf',
        contentType: 'application/pdf',
      })
      .expect(400);

    expect(response.body.message).toContain(
      'The uploaded file content does not match its file type.',
    );
    expect(documentService.uploadDocument).not.toHaveBeenCalled();
  });
});

describe('StudyVault tag API (e2e)', () => {
  let app: INestApplication;

  const tagService = {
    listTags: jest.fn(),
    createTag: jest.fn(),
    updateTag: jest.fn(),
    deleteTag: jest.fn(),
  };

  beforeAll(async () => {
    app = await createHttpTestApp({
      controllers: [TagController],
      providers: [
        {
          provide: TagService,
          useValue: tagService,
        },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes the authenticated owner to tag routes', async () => {
    tagService.listTags.mockResolvedValue([
      { id: TEST_TAG_ID, name: 'Security', type: 'TAG', color: '#9b3f36' },
    ]);
    tagService.createTag.mockResolvedValue({
      id: TEST_TAG_ID,
      name: 'Security',
      type: 'TAG',
      color: '#9b3f36',
    });
    tagService.updateTag.mockResolvedValue({
      id: TEST_TAG_ID,
      name: 'Authorization',
      type: 'TAG',
      color: '#9b3f36',
    });
    tagService.deleteTag.mockResolvedValue({ id: TEST_TAG_ID });

    await request(app.getHttpServer())
      .get('/api/tags')
      .set(userAuthHeader)
      .query({ type: 'TAG' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/tags')
      .set(userAuthHeader)
      .send({ name: 'Security', type: 'TAG', color: '#9b3f36' })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/tags/${TEST_TAG_ID}`)
      .set(userAuthHeader)
      .send({ name: 'Authorization' })
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/api/tags/${TEST_TAG_ID}`)
      .set(userAuthHeader)
      .expect(200);

    expect(tagService.listTags).toHaveBeenCalledWith(TEST_USER_ID, {
      type: 'TAG',
    });
    expect(tagService.createTag).toHaveBeenCalledWith(TEST_USER_ID, {
      name: 'Security',
      type: 'TAG',
      color: '#9b3f36',
    });
    expect(tagService.updateTag).toHaveBeenCalledWith(
      TEST_USER_ID,
      TEST_TAG_ID,
      {
        name: 'Authorization',
      },
    );
    expect(tagService.deleteTag).toHaveBeenCalledWith(
      TEST_USER_ID,
      TEST_TAG_ID,
    );
  });
});

describe('StudyVault RAG API (e2e)', () => {
  let app: INestApplication;

  const ragService = {
    askDocument: jest.fn(),
    getDocumentAskHistory: jest.fn(),
    clearDocumentAskHistory: jest.fn(),
    getDocumentDiagram: jest.fn(),
  };

  const ragSummaryService = {
    generateSummary: jest.fn(),
  };

  const ragMindMapService = {
    getDocumentMindMap: jest.fn(),
  };

  beforeAll(async () => {
    app = await createHttpTestApp({
      controllers: [RagController],
      providers: [
        {
          provide: RagService,
          useValue: ragService,
        },
        {
          provide: RagSummaryService,
          useValue: ragSummaryService,
        },
        {
          provide: RagMindMapService,
          useValue: ragMindMapService,
        },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects unauthenticated document questions before they reach RAG', async () => {
    await request(app.getHttpServer())
      .post(`/api/rag/documents/${TEST_DOCUMENT_ID}/ask`)
      .send({ question: 'What are the main points?' })
      .expect(401);

    expect(ragService.askDocument).not.toHaveBeenCalled();
  });

  it('rejects locked accounts before they reach RAG', async () => {
    await request(app.getHttpServer())
      .post(`/api/rag/documents/${TEST_DOCUMENT_ID}/ask`)
      .set(lockedAuthHeader)
      .send({ question: 'What are the main points?' })
      .expect(401);

    expect(ragService.askDocument).not.toHaveBeenCalled();
  });

  it('passes the authenticated owner to document RAG operations', async () => {
    ragService.askDocument.mockResolvedValue({
      answer: 'The document explains the main course topics.',
      sources: [],
    });
    ragService.getDocumentAskHistory.mockResolvedValue([
      {
        id: 'history-1',
        question: 'What are the main points?',
        answer: 'The main points are listed in section one.',
        sources: [],
        createdAt: '2026-04-30T00:00:00.000Z',
      },
    ]);
    ragService.clearDocumentAskHistory.mockResolvedValue(1);
    ragSummaryService.generateSummary.mockResolvedValue({
      title: 'Week 5 Notes',
      overview: 'Summary overview',
      key_points: [],
      conclusion: 'Summary conclusion',
      language: 'vi',
      generatedAt: '2026-04-30T00:00:00.000Z',
      sources: [],
      cached: false,
      slot: 'custom',
      activeSlot: 'custom',
      versions: [],
    });
    ragMindMapService.getDocumentMindMap.mockResolvedValue({
      mindMap: {
        id: 'root',
        label: 'Week 5 Notes',
        summary: 'Mind map root',
        kind: 'root',
        children: [],
      },
      summary: 'Mind map summary',
      language: 'vi',
      generatedAt: '2026-04-30T00:00:00.000Z',
      cached: false,
    });
    ragService.getDocumentDiagram.mockResolvedValue({
      mermaid: 'graph TD; A-->B',
      summaryText: 'Diagram summary',
      generatedAt: '2026-04-30T00:00:00.000Z',
      summaryLanguage: 'vi',
    });

    await request(app.getHttpServer())
      .post(`/api/rag/documents/${TEST_DOCUMENT_ID}/ask`)
      .set(userAuthHeader)
      .send({ question: 'What are the main points?' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.answer).toContain('course topics');
      });

    await request(app.getHttpServer())
      .get(`/api/rag/documents/${TEST_DOCUMENT_ID}/ask/history`)
      .set(userAuthHeader)
      .expect(200)
      .expect(({ body }) => {
        expect(body.items).toHaveLength(1);
      });

    await request(app.getHttpServer())
      .delete(`/api/rag/documents/${TEST_DOCUMENT_ID}/ask/history`)
      .set(userAuthHeader)
      .expect(200)
      .expect(({ body }) => {
        expect(body.cleared).toBe(1);
      });

    await request(app.getHttpServer())
      .post(`/api/rag/documents/${TEST_DOCUMENT_ID}/summary`)
      .set(userAuthHeader)
      .send({
        language: 'vi',
        forceRefresh: true,
        instruction: 'Focus on exam points',
        slot: 'custom',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.title).toBe('Week 5 Notes');
      });

    await request(app.getHttpServer())
      .post(`/api/rag/documents/${TEST_DOCUMENT_ID}/mindmap`)
      .set(userAuthHeader)
      .send({
        language: 'vi',
        forceRefresh: true,
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.mindMap.id).toBe('root');
      });

    await request(app.getHttpServer())
      .post(`/api/rag/documents/${TEST_DOCUMENT_ID}/diagram`)
      .set(userAuthHeader)
      .expect(200)
      .expect(({ body }) => {
        expect(body.mermaid).toContain('graph TD');
      });

    expect(ragService.askDocument).toHaveBeenCalledWith(
      TEST_DOCUMENT_ID,
      TEST_USER_ID,
      'What are the main points?',
    );
    expect(ragService.getDocumentAskHistory).toHaveBeenCalledWith(
      TEST_DOCUMENT_ID,
      TEST_USER_ID,
    );
    expect(ragService.clearDocumentAskHistory).toHaveBeenCalledWith(
      TEST_DOCUMENT_ID,
      TEST_USER_ID,
    );
    expect(ragSummaryService.generateSummary).toHaveBeenCalledWith(
      TEST_DOCUMENT_ID,
      TEST_USER_ID,
      'vi',
      true,
      'Focus on exam points',
      'custom',
    );
    expect(ragMindMapService.getDocumentMindMap).toHaveBeenCalledWith(
      TEST_DOCUMENT_ID,
      TEST_USER_ID,
      'vi',
      true,
    );
    expect(ragService.getDocumentDiagram).toHaveBeenCalledWith(
      TEST_DOCUMENT_ID,
      TEST_USER_ID,
    );
  });
});
