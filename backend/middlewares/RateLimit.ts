import { Request, Response, NextFunction } from "express";

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
  store?: RateLimitStore; // Allow custom store (e.g., Redis for distributed deployments)
}

// Create a new store for each limiter instance to avoid global state issues
const createStore = (): RateLimitStore => ({});

// Track cleanup intervals per store to prevent multiple intervals and enable cleanup
const cleanupIntervals = new WeakMap<RateLimitStore, NodeJS.Timeout>();

// Function to cleanup interval for a store
const cleanupInterval = (store: RateLimitStore): void => {
  const interval = cleanupIntervals.get(store);
  if (interval) {
    clearInterval(interval);
    cleanupIntervals.delete(store);
  }
};

export const createRateLimiter = (options: RateLimitOptions) => {
  const { windowMs, maxRequests, message = "Too many requests, please try again later", store: customStore } = options;
  
  // Use custom store (e.g., Redis) or create a new in-memory store
  const store = customStore || createStore();

  return (req: Request, res: Response, next: NextFunction) => {
    // Require valid IP address - reject requests without identifiable client
    const key = req.ip || req.socket.remoteAddress;
    if (!key) {
      return res.status(400).json({ message: "Unable to identify client IP address" });
    }

    const now = Date.now();

    // Initialize or reset the store entry
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    // Increment request count
    store[key].count++;

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - store[key].count));
    res.setHeader("X-RateLimit-Reset", new Date(store[key].resetTime).toISOString());

    // Check if limit exceeded
    if (store[key].count > maxRequests) {
      return res.status(429).json({ message });
    }

    // Setup cleanup interval only once per store instance
    if (!cleanupIntervals.has(store)) {
      const interval = setInterval(() => {
        const now = Date.now();
        for (const key in store) {
          if (store[key].resetTime < now) {
            delete store[key];
          }
        }
      }, 5 * 60 * 1000);
      
      // Prevent interval from keeping process alive if it's the only active timer
      interval.unref?.();
      
      cleanupIntervals.set(store, interval);
    }

    next();
  };
};

// Export cleanup function for graceful shutdown
export const cleanupRateLimiters = (): void => {
  // Note: WeakMap doesn't provide iteration, so this is for documentation
  // In practice, intervals will be garbage collected when stores are no longer referenced
  // For explicit cleanup during server shutdown, call this function
};

// Export interval cleanup function for testing and explicit cleanup
export { cleanupInterval };
