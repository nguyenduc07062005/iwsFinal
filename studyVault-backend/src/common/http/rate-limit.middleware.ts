import type { NextFunction, Request, Response } from 'express';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  identityFields?: string[];
  keyPrefix: string;
  maxRequests: number;
  windowMs: number;
  message: string;
  methods?: string[];
};

const stores = new Map<string, Map<string, RateLimitEntry>>();

const normalizeIdentityValue = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim().toLowerCase();
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return '';
};

const getRateLimitKeys = (req: Request, options: RateLimitOptions) => {
  const ip = req.ip || req.socket?.remoteAddress || 'anonymous-client';
  const keys = new Set([`${options.keyPrefix}:client:${ip}`]);

  for (const field of options.identityFields ?? []) {
    const identityValue = normalizeIdentityValue(
      (req.body as Record<string, unknown> | undefined)?.[field],
    );

    if (identityValue) {
      keys.add(`${options.keyPrefix}:identity:${field}:${identityValue}`);
    }
  }

  return Array.from(keys);
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

    const keys = getRateLimitKeys(req, options);
    const activeEntries = keys
      .map((key) => ({ key, entry: store.get(key) }))
      .filter((item): item is { key: string; entry: RateLimitEntry } => {
        const entry = item.entry;
        return entry !== undefined && entry.resetAt > currentTime;
      });
    const exceededEntry = activeEntries.find(
      ({ entry }) => entry.count >= options.maxRequests,
    );

    res.setHeader('X-RateLimit-Limit', String(options.maxRequests));

    if (exceededEntry) {
      const retryAfterSeconds = Math.max(
        Math.ceil((exceededEntry.entry.resetAt - currentTime) / 1000),
        1,
      );

      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('Retry-After', String(retryAfterSeconds));
      res.status(429).json({
        statusCode: 429,
        error: 'Too Many Requests',
        message: options.message,
      });
      return;
    }

    const nextCounts = keys.map((key) => {
      const currentEntry = store.get(key);

      if (!currentEntry || currentEntry.resetAt <= currentTime) {
        store.set(key, {
          count: 1,
          resetAt: currentTime + options.windowMs,
        });
        return 1;
      }

      currentEntry.count += 1;
      store.set(key, currentEntry);
      return currentEntry.count;
    });
    const highestCount = Math.max(...nextCounts);
    const remainingRequests = Math.max(options.maxRequests - highestCount, 0);
    res.setHeader('X-RateLimit-Remaining', String(remainingRequests));
    next();
  };
};
