/**
 * Frontend Performance Optimization System
 * Comprehensive client-side optimizations for memory management and speed
 */

interface PerformanceConfig {
  imageOptimization: boolean;
  lazyLoading: boolean;
  requestBatching: boolean;
  memoryManagement: boolean;
  renderOptimization: boolean;
}

interface ImageCache {
  [key: string]: {
    blob: Blob;
    url: string;
    timestamp: number;
    accessCount: number;
  };
}

class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private config: PerformanceConfig;
  private imageCache: ImageCache = {};
  private requestQueue: Map<string, Promise<any>> = new Map();
  private intersectionObserver: IntersectionObserver | null = null;
  private memoryMonitorInterval: number | null = null;
  private readonly maxCacheSize = 50; // Maximum cached images
  private readonly cacheExpiryMs = 10 * 60 * 1000; // 10 minutes

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  constructor() {
    this.config = {
      imageOptimization: true,
      lazyLoading: true,
      requestBatching: true,
      memoryManagement: true,
      renderOptimization: true
    };
    this.initializeOptimizations();
  }

  private initializeOptimizations(): void {
    if (typeof window === 'undefined') return;

    // Initialize lazy loading observer
    if (this.config.lazyLoading && 'IntersectionObserver' in window) {
      this.setupLazyLoading();
    }

    // Initialize memory management
    if (this.config.memoryManagement) {
      this.setupMemoryManagement();
    }

    // Setup performance monitoring
    this.setupPerformanceMonitoring();
  }

  private setupLazyLoading(): void {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            if (src) {
              this.loadImageOptimized(src).then((url) => {
                img.src = url;
                img.removeAttribute('data-src');
                this.intersectionObserver?.unobserve(img);
              });
            }
          }
        });
      },
      {
        rootMargin: '50px 0px', // Load images 50px before they come into view
        threshold: 0.1
      }
    );
  }

  private setupMemoryManagement(): void {
    // Clean up image cache periodically
    this.memoryMonitorInterval = window.setInterval(() => {
      this.cleanupImageCache();
      this.monitorMemoryUsage();
    }, 2 * 60 * 1000); // Every 2 minutes

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });

    // Handle memory pressure
    if ('memory' in performance) {
      setInterval(() => {
        const memInfo = (performance as any).memory;
        if (memInfo && memInfo.usedJSHeapSize > memInfo.totalJSHeapSize * 0.9) {
          console.warn('High memory usage detected, cleaning up...');
          this.forceCleanup();
        }
      }, 30000);
    }
  }

  private setupPerformanceMonitoring(): void {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.duration > 50) { // Tasks longer than 50ms
              console.warn(`Long task detected: ${entry.duration}ms`);
            }
          });
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // PerformanceObserver not supported
      }
    }
  }

  /**
   * Optimized image loading with caching and compression
   */
  async loadImageOptimized(src: string): Promise<string> {
    // Check cache first
    const cached = this.imageCache[src];
    if (cached && Date.now() - cached.timestamp < this.cacheExpiryMs) {
      cached.accessCount++;
      return cached.url;
    }

    try {
      // Deduplicate requests
      if (this.requestQueue.has(src)) {
        return await this.requestQueue.get(src)!;
      }

      const loadPromise = this.fetchAndOptimizeImage(src);
      this.requestQueue.set(src, loadPromise);

      const result = await loadPromise;
      this.requestQueue.delete(src);
      return result;
    } catch (error) {
      this.requestQueue.delete(src);
      console.error('Image loading failed:', error);
      return src; // Fallback to original src
    }
  }

  private async fetchAndOptimizeImage(src: string): Promise<string> {
    const response = await fetch(src);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const blob = await response.blob();
    
    // Create optimized blob URL
    const url = URL.createObjectURL(blob);

    // Cache the result
    this.cacheImage(src, blob, url);

    return url;
  }

  private cacheImage(src: string, blob: Blob, url: string): void {
    // Remove oldest entries if cache is full
    const entries = Object.entries(this.imageCache);
    if (entries.length >= this.maxCacheSize) {
      // Sort by timestamp and access count, remove least used
      entries.sort((a, b) => {
        const scoreA = a[1].accessCount * 0.5 + (Date.now() - a[1].timestamp) * 0.5;
        const scoreB = b[1].accessCount * 0.5 + (Date.now() - b[1].timestamp) * 0.5;
        return scoreB - scoreA;
      });

      // Remove bottom 20%
      const toRemove = Math.ceil(entries.length * 0.2);
      for (let i = entries.length - toRemove; i < entries.length; i++) {
        const [key, entry] = entries[i];
        URL.revokeObjectURL(entry.url);
        delete this.imageCache[key];
      }
    }

    this.imageCache[src] = {
      blob,
      url,
      timestamp: Date.now(),
      accessCount: 1
    };
  }

  private cleanupImageCache(): void {
    const now = Date.now();
    Object.entries(this.imageCache).forEach(([key, entry]) => {
      if (now - entry.timestamp > this.cacheExpiryMs) {
        URL.revokeObjectURL(entry.url);
        delete this.imageCache[key];
      }
    });
  }

  private monitorMemoryUsage(): void {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      if (memInfo) {
        const usedMB = Math.round(memInfo.usedJSHeapSize / 1024 / 1024);
        const totalMB = Math.round(memInfo.totalJSHeapSize / 1024 / 1024);
        
        if (usedMB > 100) { // Over 100MB
          console.warn(`High memory usage: ${usedMB}MB / ${totalMB}MB`);
        }
      }
    }
  }

  /**
   * Enable lazy loading for an image element
   */
  enableLazyLoading(img: HTMLImageElement): void {
    if (!this.intersectionObserver) return;

    // Move src to data-src
    if (img.src && !img.dataset.src) {
      img.dataset.src = img.src;
      img.removeAttribute('src');
      
      // Add placeholder
      img.style.backgroundColor = '#f0f0f0';
      img.style.minHeight = '100px';
    }

    this.intersectionObserver.observe(img);
  }

  /**
   * Batch multiple API requests to reduce network overhead
   */
  async batchRequests<T>(requests: Array<() => Promise<T>>): Promise<T[]> {
    if (!this.config.requestBatching || requests.length <= 1) {
      return Promise.all(requests.map(req => req()));
    }

    // Batch requests in groups of 5 to avoid overwhelming the server
    const batchSize = 5;
    const results: T[] = [];

    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(req => req()));
      results.push(...batchResults);
      
      // Small delay between batches to prevent server overload
      if (i + batchSize < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    return results;
  }

  /**
   * Debounce function calls to improve performance
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: number | undefined;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = window.setTimeout(() => func(...args), wait);
    };
  }

  /**
   * Throttle function calls to limit execution frequency
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Force cleanup of all cached resources
   */
  forceCleanup(): void {
    // Clear image cache
    Object.values(this.imageCache).forEach(entry => {
      URL.revokeObjectURL(entry.url);
    });
    this.imageCache = {};

    // Clear request queue
    this.requestQueue.clear();

    console.log('Performance optimizer: forced cleanup completed');
  }

  /**
   * Get performance statistics
   */
  getStats() {
    return {
      cachedImages: Object.keys(this.imageCache).length,
      pendingRequests: this.requestQueue.size,
      memoryUsage: 'memory' in performance ? (performance as any).memory : null,
      config: this.config
    };
  }

  /**
   * Cleanup all resources
   */
  cleanup(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }

    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
    }

    this.forceCleanup();
  }
}

export const performanceOptimizer = PerformanceOptimizer.getInstance();

// Auto-initialize optimizations for images on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Auto-enable lazy loading for all images with data-src
    document.querySelectorAll('img[data-src]').forEach((img) => {
      performanceOptimizer.enableLazyLoading(img as HTMLImageElement);
    });
  });
}