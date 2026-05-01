export const CORS_ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-CSRF-Token',
] as const;

export const isSwaggerEnabled = (
  nodeEnv = process.env.NODE_ENV ?? 'development',
  swaggerEnabled = process.env.SWAGGER_ENABLED,
): boolean => {
  if (swaggerEnabled !== undefined) {
    return swaggerEnabled.trim().toLowerCase() === 'true';
  }

  return nodeEnv !== 'production';
};
