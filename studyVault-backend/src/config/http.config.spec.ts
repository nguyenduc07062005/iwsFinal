import { CORS_ALLOWED_HEADERS, isSwaggerEnabled } from './http.config';

describe('HTTP bootstrap configuration', () => {
  it('allows the CSRF header used by refresh and logout requests', () => {
    expect(CORS_ALLOWED_HEADERS).toEqual(
      expect.arrayContaining(['Content-Type', 'Authorization', 'X-CSRF-Token']),
    );
  });

  it('keeps Swagger off by default in production', () => {
    expect(isSwaggerEnabled('production')).toBe(false);
    expect(isSwaggerEnabled('production', 'true')).toBe(true);
    expect(isSwaggerEnabled('development')).toBe(true);
    expect(isSwaggerEnabled('development', 'false')).toBe(false);
  });
});
