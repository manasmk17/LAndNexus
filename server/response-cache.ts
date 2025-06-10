/**
 * Response Caching System
 * Intelligent caching to reduce database load and improve API response times
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  etag: string;
  hits: number;
}

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum cache entries
  enableCompression: boolean;
}

export class ResponseCache {
  private static instance: ResponseCache;
  private cache: Map<string, CacheEntry> = new Map();
  private accessOrder: string[] = []; // For LRU eviction
  
  private readonly configs: Map<string, CacheConfig> = new Map([
    // High-frequency, low-change data
    ['featured-profiles', { ttl: 10 * 60 * 1000, maxSize: 100, enableCompression: true }], // 10 min
    ['featured-jobs', { ttl: 5 * 60 * 1000, maxSize: 100, enableCompression: true }], // 5 min
    ['featured-resources', { ttl: 15 * 60 * 1000, maxSize: 100, enableCompression: true }], // 15 min
    ['subscription-plans', { ttl: 60 * 60 * 1000, maxSize: 10, enableCompression: false }], // 1 hour
    ['company-profiles', { ttl: 30 * 60 * 1000, maxSize: 200, enableCompression: true }], // 30 min
    ['professional-profiles', { ttl: 20 * 60 * 1000, maxSize: 500, enableCompression: true }], // 20 min
    ['user-expertise', { ttl: 60 * 60 * 1000, maxSize: 1000, enableCompression: false }], // 1 hour
    ['user-certifications', { ttl: 60 * 60 * 1000, maxSize: 1000, enableCompression: false }], // 1 hour
    ['default', { ttl: 5 * 60 * 1000, maxSize: 50, enableCompression: false }] // 5 min default
  ]);

  static getInstance(): ResponseCache {
    if (!ResponseCache.instance) {
      ResponseCache.instance = new ResponseCache();
    }
    return ResponseCache.instance;
  }

  constructor() {
    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Generate cache key from request details
   */
  private generateKey(prefix: string, params: any = {}): string {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${prefix}:${paramString}`;
  }

  /**
   * Get cache configuration for a given prefix
   */
  private getConfig(prefix: string): CacheConfig {
    return this.configs.get(prefix) || this.configs.get('default')!;
  }

  /**
   * Update access order for LRU
   */
  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  /**
   * Evict least recently used entries if cache is full
   */
  private evictIfNeeded(config: CacheConfig): void {
    while (this.cache.size >= config.maxSize && this.accessOrder.length > 0) {
      const lruKey = this.accessOrder.shift()!;
      this.cache.delete(lruKey);
    }
  }

  /**
   * Store data in cache
   */
  set(prefix: string, data: any, params: any = {}): string {
    const key = this.generateKey(prefix, params);
    const config = this.getConfig(prefix);
    
    // Generate ETag for cache validation
    const etag = `"${Date.now()}-${JSON.stringify(data).length}"`;
    
    this.evictIfNeeded(config);
    
    this.cache.set(key, {
      data: config.enableCompression ? this.compress(data) : data,
      timestamp: Date.now(),
      etag,
      hits: 0
    });
    
    this.updateAccessOrder(key);
    return etag;
  }

  /**
   * Retrieve data from cache
   */
  get(prefix: string, params: any = {}): { data: any; etag: string } | null {
    const key = this.generateKey(prefix, params);
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    const config = this.getConfig(prefix);
    const age = Date.now() - entry.timestamp;
    
    // Check if entry has expired
    if (age > config.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // Update access statistics
    entry.hits++;
    this.updateAccessOrder(key);
    
    return {
      data: config.enableCompression ? this.decompress(entry.data) : entry.data,
      etag: entry.etag
    };
  }

  /**
   * Check if cache has valid entry
   */
  has(prefix: string, params: any = {}): boolean {
    return this.get(prefix, params) !== null;
  }

  /**
   * Invalidate cache entries by prefix pattern
   */
  invalidate(pattern: string): number {
    let deleted = 0;
    const keysToDelete: string[] = [];
    
    const cacheKeys = Array.from(this.cache.keys());
    for (const key of cacheKeys) {
      if (key.startsWith(pattern)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      deleted++;
    });
    
    return deleted;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    const cacheEntries = Array.from(this.cache.entries());
    for (const [key, entry] of cacheEntries) {
      const prefix = key.split(':')[0];
      const config = this.getConfig(prefix);
      const age = now - entry.timestamp;
      
      if (age > config.ttl) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
    });
    
    if (keysToDelete.length > 0) {
      console.log(`Cache cleanup: removed ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Simple compression for large objects
   */
  private compress(data: any): string {
    return JSON.stringify(data);
  }

  /**
   * Decompress data
   */
  private decompress(data: string): any {
    return JSON.parse(data);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const stats = {
      totalEntries: this.cache.size,
      totalHits: 0,
      entriesByPrefix: new Map<string, number>(),
      hitsByPrefix: new Map<string, number>(),
      memoryUsage: 0
    };
    
    const cacheEntries = Array.from(this.cache.entries());
    for (const [key, entry] of cacheEntries) {
      const prefix = key.split(':')[0];
      
      stats.totalHits += entry.hits;
      stats.entriesByPrefix.set(prefix, (stats.entriesByPrefix.get(prefix) || 0) + 1);
      stats.hitsByPrefix.set(prefix, (stats.hitsByPrefix.get(prefix) || 0) + entry.hits);
      
      // Rough memory usage calculation
      stats.memoryUsage += JSON.stringify(entry).length;
    }
    
    return stats;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder.length = 0;
  }
}

export const responseCache = ResponseCache.getInstance();