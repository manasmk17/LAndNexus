interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

export class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes
  private readonly maxSize = 1000; // Maximum cache entries
  private cleanupInterval: NodeJS.Timeout | null = null;

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  constructor() {
    // Start periodic cleanup
    this.startCleanup();
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      accessCount: 0,
      lastAccessed: now
    };

    this.cache.set(key, entry);
    
    // Cleanup if cache is too large
    if (this.cache.size > this.maxSize) {
      this.evictLeastUsed();
    }

    // Set expiration if TTL provided
    if (ttl) {
      setTimeout(() => {
        this.cache.delete(key);
      }, ttl);
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    const age = now - entry.timestamp;

    // Check if expired
    if (age > this.defaultTTL) {
      this.cache.delete(key);
      return null;
    }

    // Update access info
    entry.accessCount++;
    entry.lastAccessed = now;

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const age = Date.now() - entry.timestamp;
    if (age > this.defaultTTL) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  invalidate(pattern: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => key.includes(pattern));
    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }

  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;

    for (const entry of Array.from(this.cache.values())) {
      if (now - entry.timestamp > this.defaultTTL) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: this.cache.size,
      active,
      expired,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  private evictLeastUsed(): void {
    const entries = Array.from(this.cache.entries());
    
    // Sort by access count (ascending) and last accessed (ascending)
    entries.sort((a, b) => {
      const aEntry = a[1];
      const bEntry = b[1];
      
      if (aEntry.accessCount !== bEntry.accessCount) {
        return aEntry.accessCount - bEntry.accessCount;
      }
      return aEntry.lastAccessed - bEntry.lastAccessed;
    });

    // Remove 10% of least used entries
    const toRemove = Math.ceil(entries.length * 0.1);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 60000); // Every minute
  }

  private cleanupExpired(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now - entry.timestamp > this.defaultTTL) {
        toDelete.push(key);
      }
    }

    for (const key of toDelete) {
      this.cache.delete(key);
    }

    if (toDelete.length > 0) {
      console.log(`Cache cleanup: removed ${toDelete.length} expired entries`);
    }
  }

  private estimateMemoryUsage(): number {
    let size = 0;
    for (const [key, entry] of Array.from(this.cache.entries())) {
      size += key.length * 2; // UTF-16 characters
      size += JSON.stringify(entry.data).length * 2;
      size += 64; // Estimated overhead per entry
    }
    return size;
  }

  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

export const cacheManager = CacheManager.getInstance();