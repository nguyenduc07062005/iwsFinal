import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserRole } from 'src/database/entities/user.entity';
import { UserRepository } from 'src/database/repositories/user.repository';
import { AdminBootstrapService } from './admin-bootstrap.service';

const createService = (configValues: Record<string, string | undefined>) => {
  const userRepository = {
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };
  const configService = {
    get: jest.fn((key: string) => configValues[key]),
  };

  return {
    configService,
    service: new AdminBootstrapService(
      userRepository as never as UserRepository,
      configService as never as ConfigService,
    ),
    userRepository,
  };
};

describe('AdminBootstrapService', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates a verified admin from internal bootstrap config', async () => {
    const { service, userRepository } = createService({
      ADMIN_EMAILS: 'owner@example.com',
      ADMIN_BOOTSTRAP_PASSWORD: 'Admin#12345678',
    });
    userRepository.findOne.mockResolvedValue(null);
    userRepository.create.mockResolvedValue({
      id: 'admin-1',
      email: 'owner@example.com',
      role: UserRole.ADMIN,
    });

    await service.onApplicationBootstrap();

    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'owner@example.com',
        isActive: true,
        isEmailVerified: true,
        role: UserRole.ADMIN,
      }),
    );
    const createCalls = userRepository.create.mock.calls as unknown as Array<
      [{ password: string }]
    >;
    const createInput = createCalls[0][0];
    await expect(
      bcrypt.compare('Admin#12345678', createInput.password),
    ).resolves.toBe(true);
  });

  it('promotes an existing configured account without public registration', async () => {
    const { service, userRepository } = createService({
      ADMIN_EMAILS: 'owner@example.com',
      ADMIN_BOOTSTRAP_PASSWORD: 'Admin#12345678',
    });
    userRepository.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'owner@example.com',
      name: 'Owner',
      role: UserRole.USER,
    });

    await service.onApplicationBootstrap();

    expect(userRepository.update).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        isActive: true,
        isEmailVerified: true,
        role: UserRole.ADMIN,
      }),
    );
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it('does nothing when no bootstrap password is configured', async () => {
    const { service, userRepository } = createService({
      ADMIN_EMAILS: 'owner@example.com',
      ADMIN_BOOTSTRAP_PASSWORD: undefined,
    });

    await service.onApplicationBootstrap();

    expect(userRepository.findOne).not.toHaveBeenCalled();
    expect(userRepository.create).not.toHaveBeenCalled();
    expect(userRepository.update).not.toHaveBeenCalled();
  });
});
