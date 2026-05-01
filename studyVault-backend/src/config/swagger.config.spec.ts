import { createSwaggerConfig } from './swagger.config';

describe('createSwaggerConfig', () => {
  it('describes the StudyVault API and bearer authentication', () => {
    const config = createSwaggerConfig();

    expect(config.info.title).toBe('StudyVault API');
    expect(config.info.version).toBe('1.0.0');
    expect(config.security).toEqual([{ bearer: [] }]);
    expect(config.components?.securitySchemes?.bearer).toEqual(
      expect.objectContaining({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      }),
    );
  });
});
