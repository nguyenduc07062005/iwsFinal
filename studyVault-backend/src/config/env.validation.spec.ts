import { validateEnvironment } from './env.validation';

const productionEnv = {
  NODE_ENV: 'production',
  PORT: '8000',
  CORS_ORIGIN: 'https://studyvault.example.com',
  FRONTEND_URL: 'https://studyvault.example.com',
  DATABASE_HOST: 'database',
  DATABASE_PORT: '5432',
  DATABASE_USERNAME: 'postgres',
  DATABASE_PASSWORD: 'postgres',
  DATABASE_NAME: 'studyvault_iws',
  JWT_SECRET: 'production_secret_at_least_32_chars',
  AUTH_RETURN_RESET_TOKEN: 'false',
};

describe('validateEnvironment', () => {
  it('allows an explicit production configuration', () => {
    const validated = validateEnvironment(productionEnv);

    expect(validated.PORT).toBe(8000);
    expect(validated.DATABASE_PORT).toBe(5432);
    expect(validated.CORS_ORIGIN).toBe('https://studyvault.example.com');
  });

  it('rejects wildcard CORS in production', () => {
    expect(() =>
      validateEnvironment({
        ...productionEnv,
        CORS_ORIGIN: '*',
      }),
    ).toThrow('CORS_ORIGIN');
  });

  it('rejects weak JWT secrets in production', () => {
    for (const jwtSecret of [
      'studyvault_docker_dev_secret',
      'replace_with_a_random_secret_at_least_32_characters',
    ]) {
      expect(() =>
        validateEnvironment({
          ...productionEnv,
          JWT_SECRET: jwtSecret,
        }),
      ).toThrow('JWT_SECRET');
    }
  });

  it('rejects direct reset-token return mode in production', () => {
    expect(() =>
      validateEnvironment({
        ...productionEnv,
        AUTH_RETURN_RESET_TOKEN: 'true',
      }),
    ).toThrow('AUTH_RETURN_RESET_TOKEN');
  });

  it('keeps local development defaults permissive', () => {
    const validated = validateEnvironment({
      NODE_ENV: 'development',
    });

    expect(validated.PORT).toBe(8000);
    expect(validated.DATABASE_HOST).toBe('localhost');
    expect(validated.JWT_SECRET).toBe('studyvault_dev_secret_change_me');
  });
});
