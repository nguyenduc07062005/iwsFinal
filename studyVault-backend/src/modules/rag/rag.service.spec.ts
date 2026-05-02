import { RagService } from './rag.service';

describe('RagService', () => {
  const documentDiagram = {
    mermaid: 'flowchart TD\nA[User A private flow]',
    summaryText: 'User A private summary',
    generatedAt: '2026-04-11T00:00:00.000Z',
    summaryLanguage: 'en' as const,
  };
  const userDiagram = {
    mermaid: 'flowchart TD\nB[User B flow]',
    summaryText: 'User B summary',
    generatedAt: '2026-04-12T00:00:00.000Z',
    summaryLanguage: 'en' as const,
  };
  const geminiService = {
    generateText: jest.fn(),
  };
  const ragArtifactCacheService = {
    getDiagram: jest.fn(() => documentDiagram),
    getUserDiagram: jest.fn(() => userDiagram),
    saveUserDiagram: jest.fn(),
  };
  const ragDocumentContextService = {
    ensureOwnedDocument: jest.fn(),
  };
  const ragIndexingService = {
    ensureDocumentIndexed: jest.fn(),
    getEmbeddingDimension: jest.fn(),
  };
  const ragSummaryService = {
    generateSummary: jest.fn(),
    toPlainText: jest.fn(),
  };
  const ragQuestionAnsweringService = {
    askDocument: jest.fn(),
    getDocumentAskHistory: jest.fn(),
    clearDocumentAskHistory: jest.fn(),
  };
  const ragSearchService = {
    searchDocuments: jest.fn(),
    getRelatedDocuments: jest.fn(),
  };
  const userDocumentRepository = {
    findByUserAndDocument: jest.fn(),
  };
  let service: RagService;

  beforeEach(() => {
    jest.clearAllMocks();
    ragDocumentContextService.ensureOwnedDocument.mockResolvedValue({
      id: 'doc-1',
      title: 'Shared Document',
      extraAttributes: {
        aiArtifacts: {
          diagram: documentDiagram,
        },
      },
    });
    userDocumentRepository.findByUserAndDocument.mockResolvedValue({
      id: 'user-doc-2',
      extraAttributes: {
        aiArtifacts: {
          diagram: userDiagram,
        },
      },
    });
    service = new RagService(
      geminiService as never,
      ragArtifactCacheService as never,
      ragDocumentContextService as never,
      ragIndexingService as never,
      ragSummaryService as never,
      ragQuestionAnsweringService as never,
      ragSearchService as never,
      userDocumentRepository as never,
    );
  });

  it('uses the user document diagram cache instead of the shared document cache', async () => {
    const result = await service.getDocumentDiagram('doc-1', 'user-2');

    expect(result).toEqual({
      diagram: userDiagram.mermaid,
      summary: userDiagram.summaryText,
      cached: true,
    });
    expect(userDocumentRepository.findByUserAndDocument).toHaveBeenCalledWith(
      'user-2',
      'doc-1',
    );
    expect(ragArtifactCacheService.getUserDiagram).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-doc-2' }),
    );
    expect(ragArtifactCacheService.getDiagram).not.toHaveBeenCalled();
    expect(ragSummaryService.generateSummary).not.toHaveBeenCalled();
  });
});
