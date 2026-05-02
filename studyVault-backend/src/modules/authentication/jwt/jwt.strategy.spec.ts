import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  it('fails fast when JWT_SECRET is missing', () => {
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    };

    expect(
      () =>
        new JwtStrategy(
          configService as never as ConfigService,
          {} as never,
          {} as never,
        ),
    ).toThrow('JWT_SECRET is required');
  });
});
