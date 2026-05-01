import { BadRequestException, Logger } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';

const createHost = () => {
  const status = jest.fn().mockReturnThis();
  const json = jest.fn().mockReturnThis();
  const response = { status, json };
  const request = {
    method: 'POST',
    url: '/api/auth/register',
  };

  return {
    response,
    host: {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    },
  };
};

describe('GlobalExceptionFilter', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('keeps validation error details in a stable response shape', () => {
    const filter = new GlobalExceptionFilter();
    const { host, response } = createHost();

    filter.catch(
      new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid email format',
        errors: ['Invalid email format'],
      }),
      host as never,
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid email format',
        errors: ['Invalid email format'],
        method: 'POST',
        path: '/api/auth/register',
      }),
    );
  });

  it('hides unexpected runtime error details from clients', () => {
    const filter = new GlobalExceptionFilter();
    const { host, response } = createHost();

    filter.catch(new Error('database password leaked'), host as never);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Internal server error',
        method: 'POST',
        path: '/api/auth/register',
      }),
    );
    const [payload] = response.json.mock.calls[0] as [{ message: string }];
    expect(payload.message).not.toContain('database password leaked');
  });
});
