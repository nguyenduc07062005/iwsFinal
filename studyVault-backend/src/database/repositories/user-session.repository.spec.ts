import { UserSessionRepository } from './user-session.repository';

describe('UserSessionRepository', () => {
  const sessionRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
    create: jest.fn((value: Record<string, unknown>) => value),
    save: jest.fn((value: Record<string, unknown>) =>
      Promise.resolve({ ...value, id: 'session-2' }),
    ),
  };
  const transactionManager = {
    getRepository: jest.fn((): typeof sessionRepository => sessionRepository),
  };
  type TransactionCallback<T> = (
    manager: typeof transactionManager,
  ) => Promise<T> | T;
  const dataSource = {
    getRepository: jest.fn((): typeof sessionRepository => sessionRepository),
    transaction: jest.fn(<T>(callback: TransactionCallback<T>) =>
      callback(transactionManager),
    ),
  };
  let repository: UserSessionRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new UserSessionRepository(dataSource as never);
  });

  it('does not create a replacement session when the original refresh session was already consumed', async () => {
    sessionRepository.findOne.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      revokedAt: null,
      refreshTokenExpiresAt: new Date(Date.now() + 60_000),
    });
    sessionRepository.update.mockResolvedValue({ affected: 0 });

    const result = await repository.rotateRefreshToken('session-1', {
      refreshTokenHash: 'next-refresh-hash',
      csrfTokenHash: 'next-csrf-hash',
      refreshTokenExpiresAt: new Date(Date.now() + 120_000),
      userAgent: 'test-agent',
      ipAddress: '127.0.0.1',
    });

    expect(result).toBeNull();
    expect(sessionRepository.save).not.toHaveBeenCalled();
  });
});
