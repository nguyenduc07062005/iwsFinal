import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export type AppHealthStatus = 'ok' | 'degraded';

export type AppHealthPayload = {
  status: AppHealthStatus;
  uptimeSeconds: number;
  timestamp: string;
  checks: {
    api: 'ok';
    database: 'ok' | 'error';
  };
};

@Injectable()
export class AppService {
  constructor(private readonly dataSource: DataSource) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getHealth(): Promise<AppHealthPayload> {
    const checks: AppHealthPayload['checks'] = {
      api: 'ok',
      database: 'ok',
    };

    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      checks.database = 'error';
    }

    return {
      status: checks.database === 'ok' ? 'ok' : 'degraded',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      checks,
    };
  }
}
