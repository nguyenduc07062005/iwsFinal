import { BadRequestException } from '@nestjs/common';
import { FolderService } from './folder.service';

describe('FolderService', () => {
  const folderRepository = {
    findOne: jest.fn(),
    findByOwner: jest.fn(),
    update: jest.fn(),
  };
  const documentRepository = {};
  const userDocumentRepository = {};
  const dataSource = {};
  let service: FolderService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FolderService(
      folderRepository as never,
      documentRepository as never,
      userDocumentRepository as never,
      dataSource as never,
    );
  });

  it('rejects updateFolder when the requested parent is a descendant', async () => {
    const sourceFolder = {
      id: 'folder-a',
      ownerId: 'user-1',
      name: 'Folder A',
      parentId: 'root-folder',
    };
    const descendantFolder = {
      id: 'folder-b',
      ownerId: 'user-1',
      name: 'Folder B',
      parentId: 'folder-a',
    };

    folderRepository.findOne
      .mockResolvedValueOnce(sourceFolder)
      .mockResolvedValueOnce(descendantFolder)
      .mockResolvedValueOnce(null);
    folderRepository.findByOwner.mockResolvedValue([
      { id: 'root-folder', parentId: null },
      sourceFolder,
      descendantFolder,
    ]);
    folderRepository.update.mockResolvedValue({
      ...sourceFolder,
      parentId: descendantFolder.id,
    });

    await expect(
      service.updateFolder(
        {
          folderId: sourceFolder.id,
          name: sourceFolder.name,
          parentId: descendantFolder.id,
        },
        'user-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(folderRepository.update).not.toHaveBeenCalled();
  });
});
