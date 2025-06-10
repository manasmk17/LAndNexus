import { performance } from 'perf_hooks';

interface PerformanceMetrics {
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  timestamp: number;
  activeConnections: number;
  cacheSize: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private maxMetricsHistory = 100; // Keep only last 100 metrics
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMonitoring(intervalMs: number = 30000) { // 30 seconds
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('Performance monitoring started');
    
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.checkMemoryLeaks();
    }, intervalMs);
    
    // Initial collection
    this.collectMetrics();
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('Performance monitoring stopped');
  }

  private collectMetrics() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const metric: PerformanceMetrics = {
      memoryUsage,
      cpuUsage,
      timestamp: Date.now(),
      activeConnections: 0, // Will be updated by connection tracking
      cacheSize: 0 // Will be updated by cache tracking
    };

    this.metrics.push(metric);
    
    // Keep only recent metrics to prevent memory growth
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }
  }

  private checkMemoryLeaks() {
    if (this.metrics.length < 5) return;
    
    const recent = this.metrics.slice(-5);
    const memoryGrowth = recent[recent.length - 1].memoryUsage.heapUsed - recent[0].memoryUsage.heapUsed;
    const timeSpan = recent[recent.length - 1].timestamp - recent[0].timestamp;
    
    // If memory grows more than 50MB in 5 measurements, log warning
    if (memoryGrowth > 50 * 1024 * 1024) {
      console.warn(`Potential memory leak detected: ${Math.round(memoryGrowth / 1024 / 1024)}MB growth in ${timeSpan}ms`);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        console.log('Forced garbage collection');
      }
    }
  }

  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
      rss: Math.round(usage.rss / 1024 / 1024) // MB
    };
  }

  getRecentMetrics(count: number = 10): PerformanceMetrics[] {
    return this.metrics.slice(-count);
  }

  logPerformanceReport() {
    const memory = this.getMemoryUsage();
    console.log('=== Performance Report ===');
    console.log(`Memory Usage: ${memory.heapUsed}MB / ${memory.heapTotal}MB heap`);
    console.log(`RSS: ${memory.rss}MB, External: ${memory.external}MB`);
    console.log(`Metrics History: ${this.metrics.length} entries`);
    console.log('=========================');
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();