import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let dataSource: { query: jest.Mock };

  beforeEach(async () => {
    dataSource = {
      query: jest.fn(),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('returns ok when the API and database are ready', async () => {
      dataSource.query.mockResolvedValue([{ result: 1 }]);
      const response = { status: jest.fn() };

      const health = await appController.getHealth(response);

      expect(health.status).toBe('ok');
      expect(health.checks).toEqual({ api: 'ok', database: 'ok' });
      expect(typeof health.uptimeSeconds).toBe('number');
      expect(health.uptimeSeconds).toBeGreaterThanOrEqual(0);
      expect(new Date(health.timestamp).toString()).not.toBe('Invalid Date');
      expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
      expect(response.status).not.toHaveBeenCalled();
    });

    it('returns degraded with 503 when the database check fails', async () => {
      dataSource.query.mockRejectedValue(new Error('database unavailable'));
      const response = { status: jest.fn() };

      const health = await appController.getHealth(response);

      expect(health.status).toBe('degraded');
      expect(health.checks).toEqual({ api: 'ok', database: 'error' });
      expect(response.status).toHaveBeenCalledWith(
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    });
  });
});
