/**
 * Request Deduplication System
 * Prevents duplicate API requests from overwhelming the server and causing memory leaks
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
  requestCount: number;
}

export class RequestDeduplicator {
  private static instance: RequestDeduplicator;
  private pendingRequests: Map<string, PendingRequest<any>> = new Map();
  private readonly maxPendingTime = 30000; // 30 seconds max pending time
  private cleanupInterval: NodeJS.Timeout | null = null;

  static getInstance(): RequestDeduplicator {
    if (!RequestDeduplicator.instance) {
      RequestDeduplicator.instance = new RequestDeduplicator();
    }
    return RequestDeduplicator.instance;
  }

  constructor() {
    this.startCleanup();
  }

  /**
   * Deduplicate requests with the same key
   */
  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Check if request is already pending
    const existing = this.pendingRequests.get(key);
    if (existing) {
      existing.requestCount++;
      console.log(`Deduplicating request: ${key} (${existing.requestCount} duplicate requests)`);
      return existing.promise;
    }

    // Create new request
    const promise = requestFn();
    const pendingRequest: PendingRequest<T> = {
      promise,
      timestamp: Date.now(),
      requestCount: 1
    };

    this.pendingRequests.set(key, pendingRequest);

    try {
      const result = await promise;
      this.pendingRequests.delete(key);
      return result;
    } catch (error) {
      this.pendingRequests.delete(key);
      throw error;
    }
  }

  /**
   * Generate cache key for database queries
   */
  generateQueryKey(tableName: string, method: string, params?: any): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${tableName}:${method}:${paramString}`;
  }

  /**
   * Get statistics about current deduplication
   */
  getStats() {
    const now = Date.now();
    const activeRequests = Array.from(this.pendingRequests.entries()).map(([key, req]) => ({
      key,
      pendingTime: now - req.timestamp,
      duplicateCount: req.requestCount
    }));

    return {
      pendingRequests: this.pendingRequests.size,
      activeRequests,
      totalDuplicatesSaved: activeRequests.reduce((sum, req) => sum + (req.duplicateCount - 1), 0)
    };
  }

  /**
   * Start periodic cleanup of stale requests
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleRequests();
    }, 10000); // Cleanup every 10 seconds
  }

  /**
   * Remove requests that have been pending too long
   */
  private cleanupStaleRequests(): void {
    const now = Date.now();
    const staleCutoff = now - this.maxPendingTime;

    const pendingEntries = Array.from(this.pendingRequests.entries());
    for (const [key, request] of pendingEntries) {
      if (request.timestamp < staleCutoff) {
        console.warn(`Removing stale request: ${key} (pending for ${now - request.timestamp}ms)`);
        this.pendingRequests.delete(key);
      }
    }
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    this.pendingRequests.clear();
  }

  /**
   * Stop the deduplicator and cleanup
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

export const requestDeduplicator = RequestDeduplicator.getInstance();