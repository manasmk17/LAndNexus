import { Request, Response, NextFunction } from 'express';
import { performanceMonitor } from './performance-monitor';

interface ApiMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: number;
}

class ApiPerformanceTracker {
  private static instance: ApiPerformanceTracker;
  private metrics: ApiMetrics[] = [];
  private maxMetrics = 1000; // Keep last 1000 API calls
  private slowQueryThreshold = 2000; // 2 seconds

  static getInstance(): ApiPerformanceTracker {
    if (!ApiPerformanceTracker.instance) {
      ApiPerformanceTracker.instance = new ApiPerformanceTracker();
    }
    return ApiPerformanceTracker.instance;
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      const originalEnd = res.end;
      
      res.end = function(this: Response, ...args: any[]) {
        const duration = Date.now() - start;
        const endpoint = req.route?.path || req.path;
        
        // Record metrics
        const metric: ApiMetrics = {
          endpoint,
          method: req.method,
          responseTime: duration,
          statusCode: res.statusCode,
          timestamp: Date.now()
        };
        
        ApiPerformanceTracker.getInstance().addMetric(metric);
        
        // Log slow queries
        if (duration > ApiPerformanceTracker.getInstance().slowQueryThreshold) {
          console.warn(`Slow API call: ${req.method} ${endpoint} took ${duration}ms`);
        }
        
        return originalEnd.apply(this, args);
      };
      
      next();
    };
  }

  private addMetric(metric: ApiMetrics) {
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getSlowQueries(limit: number = 10): ApiMetrics[] {
    return this.metrics
      .filter(m => m.responseTime > this.slowQueryThreshold)
      .sort((a, b) => b.responseTime - a.responseTime)
      .slice(0, limit);
  }

  getAverageResponseTime(endpoint?: string): number {
    const filteredMetrics = endpoint 
      ? this.metrics.filter(m => m.endpoint === endpoint)
      : this.metrics;
    
    if (filteredMetrics.length === 0) return 0;
    
    const sum = filteredMetrics.reduce((acc, m) => acc + m.responseTime, 0);
    return sum / filteredMetrics.length;
  }

  getEndpointStats() {
    const stats = new Map<string, { count: number, avgTime: number, maxTime: number }>();
    
    for (const metric of this.metrics) {
      const key = `${metric.method} ${metric.endpoint}`;
      
      if (!stats.has(key)) {
        stats.set(key, { count: 0, avgTime: 0, maxTime: 0 });
      }
      
      const stat = stats.get(key)!;
      stat.count++;
      stat.avgTime = (stat.avgTime * (stat.count - 1) + metric.responseTime) / stat.count;
      stat.maxTime = Math.max(stat.maxTime, metric.responseTime);
    }
    
    return Array.from(stats.entries()).map(([endpoint, stats]) => ({
      endpoint,
      ...stats
    }));
  }

  getHealthReport() {
    const now = Date.now();
    const last5Min = this.metrics.filter(m => now - m.timestamp < 5 * 60 * 1000);
    const errors = last5Min.filter(m => m.statusCode >= 400);
    const slowQueries = last5Min.filter(m => m.responseTime > this.slowQueryThreshold);
    
    return {
      totalRequests: last5Min.length,
      errorRate: last5Min.length > 0 ? (errors.length / last5Min.length) * 100 : 0,
      averageResponseTime: this.getAverageResponseTime(),
      slowQueryCount: slowQueries.length,
      memoryUsage: performanceMonitor.getMemoryUsage()
    };
  }
}

export const apiPerformanceTracker = ApiPerformanceTracker.getInstance();

// Middleware function for easy use
export const trackApiPerformance = () => apiPerformanceTracker.middleware();