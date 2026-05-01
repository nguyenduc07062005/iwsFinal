import type { NextFunction, Request, Response } from 'express';
import { createRateLimitMiddleware } from './rate-limit.middleware';

type MockResponse = Response & {
  json: jest.Mock;
  setHeader: jest.Mock;
  status: jest.Mock;
};

const createRequest = ({
  body = {},
  headers = {},
  ip = '10.0.0.1',
  method = 'POST',
}: {
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  ip?: string;
  method?: string;
}): Request =>
  ({
    body,
    headers,
    ip,
    method,
    socket: {
      remoteAddress: ip,
    },
  }) as Request;

const createResponse = (): MockResponse => {
  const response = {
    json: jest.fn(),
    setHeader: jest.fn(),
    status: jest.fn(),
  } as unknown as MockResponse;
  response.status.mockReturnValue(response);
  return response;
};

const createNext = (): jest.MockedFunction<NextFunction> =>
  jest.fn() as jest.MockedFunction<NextFunction>;

describe('createRateLimitMiddleware', () => {
  it('does not trust client-supplied X-Forwarded-For when generating rate limit keys', () => {
    const middleware = createRateLimitMiddleware({
      keyPrefix: 'test-x-forwarded-for-is-ignored',
      maxRequests: 1,
      message: 'limited',
      methods: ['POST'],
      windowMs: 60_000,
    });

    const firstNext = createNext();
    middleware(
      createRequest({
        headers: { 'x-forwarded-for': '203.0.113.1' },
        ip: '10.0.0.1',
      }),
      createResponse(),
      firstNext,
    );

    const secondResponse = createResponse();
    const secondNext = createNext();
    middleware(
      createRequest({
        headers: { 'x-forwarded-for': '203.0.113.2' },
        ip: '10.0.0.1',
      }),
      secondResponse,
      secondNext,
    );

    expect(firstNext).toHaveBeenCalledTimes(1);
    expect(secondNext).not.toHaveBeenCalled();
    expect(secondResponse.status).toHaveBeenCalledWith(429);
  });

  it('can rate-limit auth requests by normalized request identity as well as client IP', () => {
    const middleware = createRateLimitMiddleware({
      identityFields: ['email'],
      keyPrefix: 'test-email-identity-limit',
      maxRequests: 1,
      message: 'limited',
      methods: ['POST'],
      windowMs: 60_000,
    });

    const firstNext = createNext();
    middleware(
      createRequest({
        body: { email: 'Victim@Example.com ' },
        ip: '10.0.0.1',
      }),
      createResponse(),
      firstNext,
    );

    const secondResponse = createResponse();
    const secondNext = createNext();
    middleware(
      createRequest({
        body: { email: 'victim@example.com' },
        ip: '10.0.0.2',
      }),
      secondResponse,
      secondNext,
    );

    expect(firstNext).toHaveBeenCalledTimes(1);
    expect(secondNext).not.toHaveBeenCalled();
    expect(secondResponse.status).toHaveBeenCalledWith(429);
  });
});
