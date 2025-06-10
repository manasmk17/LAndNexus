/**
 * Request Deduplication Service
 * Prevents duplicate API calls and reduces server load
 */

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

export class RequestDeduplicator {
  private static instance: RequestDeduplicator;
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private readonly timeout = 5000; // 5 seconds timeout

  static getInstance(): RequestDeduplicator {
    if (!RequestDeduplicator.instance) {
      RequestDeduplicator.instance = new RequestDeduplicator();
    }
    return RequestDeduplicator.instance;
  }

  /**
   * Deduplicate requests based on key
   * If same request is already pending, return existing promise
   */
  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Check if request is already pending
    const existing = this.pendingRequests.get(key);
    if (existing) {
      // Check if request hasn't timed out
      if (Date.now() - existing.timestamp < this.timeout) {
        console.log(`Deduplicating request: ${key}`);
        return existing.promise;
      } else {
        // Remove timed out request
        this.pendingRequests.delete(key);
      }
    }

    // Create new request
    const promise = requestFn().finally(() => {
      // Clean up after request completes
      this.pendingRequests.delete(key);
    });

    // Store pending request
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now()
    });

    return promise;
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    this.pendingRequests.clear();
  }

  /**
   * Get stats about pending requests
   */
  getStats() {
    return {
      pendingCount: this.pendingRequests.size,
      requests: Array.from(this.pendingRequests.keys())
    };
  }
}

export const requestDeduplicator = RequestDeduplicator.getInstance();