import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthenticationController } from '../src/modules/authentication/authentication.controller';
import { AuthenticationService } from '../src/modules/authentication/authentication.service';
import { DocumentController } from '../src/modules/document/document.controller';
import { DocumentService } from '../src/modules/document/document.service';
import { FolderController } from '../src/modules/folder/folder.controller';
import { FolderService } from '../src/modules/folder/folder.service';
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

describe('StudyVault auth API (e2e)', () => {
  let app: INestApplication;

  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    getProfile: jest.fn(),
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
      message: 'User registered successfully',
      user: {
        id: TEST_USER_ID,
        email: 'student@example.com',
        name: 'Nguyen Van A',
      },
    });

    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'student@example.com',
        password: 'secret123',
        name: 'Nguyen Van A',
      })
      .expect(201);

    expect(authService.register).toHaveBeenCalledWith({
      email: 'student@example.com',
      password: 'secret123',
      name: 'Nguyen Van A',
    });
    expect(response.body.user.email).toBe('student@example.com');
  });

  it('returns readable validation errors for invalid auth payloads', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'bad-email',
        password: '123',
        name: '',
      })
      .expect(400);

    expect(response.body.error).toBe('Bad Request');
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        'Invalid email format',
        'password: Password must be at least 6 characters',
        'name: Name is required',
      ]),
    );
  });

  it('supports login, forgot password, reset password, and profile lookup', async () => {
    authService.login.mockResolvedValue({
      accessToken: 'jwt-token',
    });
    authService.forgotPassword.mockResolvedValue({
      message: 'Reset link created',
      resetToken: 'demo-reset-token',
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

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'student@example.com',
        password: 'secret123',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.accessToken).toBe('jwt-token');
      });

    await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({
        email: 'student@example.com',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.resetToken).toBe('demo-reset-token');
      });

    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({
        token: 'demo-reset-token',
        password: 'secret123',
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
  });
});

describe('StudyVault document API (e2e)', () => {
  let app: INestApplication;

  const documentService = {
    uploadDocument: jest.fn(),
    getDocumentSummaryForOwner: jest.fn(),
    getDocuments: jest.fn(),
    deleteDocument: jest.fn(),
    toggleFavorite: jest.fn(),
    getFavorites: jest.fn(),
    getDocumentDetails: jest.fn(),
    getDocumentFilePath: jest.fn(),
    updateDocumentName: jest.fn(),
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
    const response = await request(app.getHttpServer())
      .get('/api/documents')
      .set(authHeader)
      .query({
        sortBy: 'rank',
      })
      .expect(400);

    expect(response.body.error).toBe('Bad Request');
    expect(response.body.message).toContain('sortBy');
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
});
