import { Logger } from '@nestjs/common';

import { RagIndexingService } from './rag-indexing.service';

describe('RagIndexingService', () => {
  const geminiService = {
    createEmbedding: jest.fn(),
  };
  const documentRepository = {
    findOne: jest.fn(),
    getRepository: jest.fn(),
  };
  const chunkRepository = {
    getRepository: jest.fn(),
  };

  let service: RagIndexingService;
  let documentUpdate: jest.Mock;
  let chunkSave: jest.Mock;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    documentUpdate = jest.fn();
    chunkSave = jest.fn();
    documentRepository.getRepository.mockReturnValue({
      update: documentUpdate,
    });
    chunkRepository.getRepository.mockReturnValue({
      save: chunkSave,
    });
    documentRepository.findOne.mockResolvedValue({
      id: 'doc-1',
      chunks: [
        {
          id: 'chunk-1',
          chunkIndex: 0,
          chunkText: 'Indexed content',
          embedding: null,
        },
      ],
    });

    service = new RagIndexingService(
      geminiService as never,
      documentRepository as never,
      chunkRepository as never,
    );
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('marks a document as ai_failed when embedding generation fails', async () => {
    geminiService.createEmbedding.mockRejectedValue(
      new Error('quota exhausted'),
    );

    await expect(service.ensureDocumentIndexed('doc-1')).rejects.toThrow(
      'quota exhausted',
    );

    expect(documentUpdate).toHaveBeenNthCalledWith(1, 'doc-1', {
      status: 'indexing',
    });
    expect(documentUpdate).toHaveBeenNthCalledWith(2, 'doc-1', {
      status: 'ai_failed',
    });
  });
});
