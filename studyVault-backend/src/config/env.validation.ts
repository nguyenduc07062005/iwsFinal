type EnvironmentConfig = Record<string, unknown>;

const DEFAULT_PORT = 8000;
const DEFAULT_DATABASE_PORT = 5432;
const DEFAULT_JWT_SECRET = 'studyvault_dev_secret_change_me';
const INSECURE_JWT_SECRETS = new Set([
  'change_me_before_production',
  'studyvault_docker_dev_secret',
  'studyvault_dev_secret_change_me',
  'sks_secret_key_2026',
  'replace_with_a_random_secret_at_least_32_characters',
]);

const readString = (
  config: EnvironmentConfig,
  key: string,
  fallback = '',
): string => {
  const value = config[key];

  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : fallback;
};

const readNumber = (
  config: EnvironmentConfig,
  key: string,
  fallback: number,
): number => {
  const value = Number(readString(config, key, String(fallback)));

  if (!Number.isInteger(value) || value <= 0 || value > 65535) {
    throw new Error(`${key} must be a valid port number.`);
  }

  return value;
};

const isProduction = (config: EnvironmentConfig): boolean =>
  readString(config, 'NODE_ENV', 'development') === 'production';

const requireProductionValue = (
  normalizedConfig: EnvironmentConfig,
  key: string,
): void => {
  if (!readString(normalizedConfig, key)) {
    throw new Error(`${key} is required when NODE_ENV=production.`);
  }
};

const validateProductionSafety = (
  normalizedConfig: EnvironmentConfig,
): void => {
  [
    'CORS_ORIGIN',
    'FRONTEND_URL',
    'DATABASE_HOST',
    'DATABASE_USERNAME',
    'DATABASE_PASSWORD',
    'DATABASE_NAME',
    'JWT_SECRET',
  ].forEach((key) => requireProductionValue(normalizedConfig, key));

  const corsOrigin = readString(normalizedConfig, 'CORS_ORIGIN');
  if (corsOrigin === '*') {
    throw new Error('CORS_ORIGIN cannot be "*" when NODE_ENV=production.');
  }

  const jwtSecret = readString(normalizedConfig, 'JWT_SECRET');
  if (jwtSecret.length < 32 || INSECURE_JWT_SECRETS.has(jwtSecret)) {
    throw new Error(
      'JWT_SECRET must be at least 32 characters and not use a development default when NODE_ENV=production.',
    );
  }

  if (readString(normalizedConfig, 'AUTH_RETURN_RESET_TOKEN') === 'true') {
    throw new Error(
      'AUTH_RETURN_RESET_TOKEN must be false when NODE_ENV=production.',
    );
  }
};

export const validateEnvironment = (
  config: EnvironmentConfig,
): EnvironmentConfig => {
  const normalizedConfig: EnvironmentConfig = {
    ...config,
    NODE_ENV: readString(config, 'NODE_ENV', 'development'),
    PORT: readNumber(config, 'PORT', DEFAULT_PORT),
    CORS_ORIGIN: readString(config, 'CORS_ORIGIN'),
    FRONTEND_URL: readString(config, 'FRONTEND_URL', 'http://localhost:3000'),
    DATABASE_HOST: readString(config, 'DATABASE_HOST', 'localhost'),
    DATABASE_PORT: readNumber(config, 'DATABASE_PORT', DEFAULT_DATABASE_PORT),
    DATABASE_USERNAME: readString(config, 'DATABASE_USERNAME', 'postgres'),
    DATABASE_PASSWORD: readString(config, 'DATABASE_PASSWORD', 'postgres'),
    DATABASE_NAME: readString(config, 'DATABASE_NAME', 'studyvault_iws'),
    DATABASE_SYNC: readString(config, 'DATABASE_SYNC', 'false'),
    DATABASE_LOGGING: readString(config, 'DATABASE_LOGGING', 'false'),
    JWT_SECRET: readString(config, 'JWT_SECRET', DEFAULT_JWT_SECRET),
    JWT_EXPIRES_IN: readString(config, 'JWT_EXPIRES_IN', '15m'),
    ADMIN_EMAILS: readString(config, 'ADMIN_EMAILS'),
    ADMIN_BOOTSTRAP_PASSWORD: readString(config, 'ADMIN_BOOTSTRAP_PASSWORD'),
    SWAGGER_ENABLED: readString(config, 'SWAGGER_ENABLED'),
    AUTH_RETURN_RESET_TOKEN: readString(
      config,
      'AUTH_RETURN_RESET_TOKEN',
      'false',
    ),
  };

  if (isProduction(normalizedConfig)) {
    validateProductionSafety(normalizedConfig);
  }

  return normalizedConfig;
};
