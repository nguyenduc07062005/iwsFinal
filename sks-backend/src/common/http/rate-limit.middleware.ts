import type { NextFunction, Request, Response } from 'express';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  keyPrefix: string;
  maxRequests: number;
  windowMs: number;
  message: string;
  methods?: string[];
};

const stores = new Map<string, Map<string, RateLimitEntry>>();

const getClientIdentifier = (req: Request, keyPrefix: string) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  const firstForwardedIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : typeof forwardedFor === 'string'
      ? forwardedFor.split(',')[0]?.trim()
      : '';

  const ip =
    firstForwardedIp ||
    req.ip ||
    req.socket?.remoteAddress ||
    'anonymous-client';

  return `${keyPrefix}:${ip}`;
};

const getStore = (keyPrefix: string) => {
  const existingStore = stores.get(keyPrefix);

  if (existingStore) {
    return existingStore;
  }

  const nextStore = new Map<string, RateLimitEntry>();
  stores.set(keyPrefix, nextStore);
  return nextStore;
};

const cleanupExpiredEntries = (
  store: Map<string, RateLimitEntry>,
  currentTime: number,
) => {
  for (const [key, value] of store.entries()) {
    if (value.resetAt <= currentTime) {
      store.delete(key);
    }
  }
};

export const createRateLimitMiddleware = (options: RateLimitOptions) => {
  const allowedMethods = (options.methods ?? []).map((method) =>
    method.toUpperCase(),
  );
  const store = getStore(options.keyPrefix);

  return (req: Request, res: Response, next: NextFunction) => {
    if (
      allowedMethods.length > 0 &&
      !allowedMethods.includes(req.method.toUpperCase())
    ) {
      next();
      return;
    }

    const currentTime = Date.now();
    cleanupExpiredEntries(store, currentTime);

    const key = getClientIdentifier(req, options.keyPrefix);
    const currentEntry = store.get(key);

    if (!currentEntry || currentEntry.resetAt <= currentTime) {
      store.set(key, {
        count: 1,
        resetAt: currentTime + options.windowMs,
      });

      res.setHeader('X-RateLimit-Limit', String(options.maxRequests));
      res.setHeader('X-RateLimit-Remaining', String(options.maxRequests - 1));
      next();
      return;
    }

    const remainingRequests = Math.max(
      options.maxRequests - currentEntry.count - 1,
      0,
    );
    res.setHeader('X-RateLimit-Limit', String(options.maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(remainingRequests));

    if (currentEntry.count >= options.maxRequests) {
      const retryAfterSeconds = Math.max(
        Math.ceil((currentEntry.resetAt - currentTime) / 1000),
        1,
      );

      res.setHeader('Retry-After', String(retryAfterSeconds));
      res.status(429).json({
        statusCode: 429,
        error: 'Too Many Requests',
        message: options.message,
      });
      return;
    }

    currentEntry.count += 1;
    store.set(key, currentEntry);
    next();
  };
};
