/**
 * Memory Leak Detection and Management System
 * Monitors and prevents memory leaks in the Node.js application
 */

interface MemorySnapshot {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  arrayBuffers: number;
}

interface LeakAlert {
  type: 'gradual' | 'sudden' | 'stable';
  severity: 'low' | 'medium' | 'high' | 'critical';
  growthRate: number;
  memoryUsed: number;
  timestamp: number;
}

export class MemoryLeakDetector {
  private static instance: MemoryLeakDetector;
  private snapshots: MemorySnapshot[] = [];
  private readonly maxSnapshots = 100;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly alertThresholds = {
    gradualGrowthMB: 10, // 10MB growth per hour
    suddenSpikeMB: 50,   // 50MB sudden increase
    criticalMemoryMB: 512, // 512MB total usage
    highMemoryMB: 256    // 256MB total usage
  };

  static getInstance(): MemoryLeakDetector {
    if (!MemoryLeakDetector.instance) {
      MemoryLeakDetector.instance = new MemoryLeakDetector();
    }
    return MemoryLeakDetector.instance;
  }

  startMonitoring(intervalMs: number = 30000): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      this.takeSnapshot();
      this.analyzeMemoryTrends();
    }, intervalMs);

    console.log('Memory leak detection started');
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('Memory leak detection stopped');
  }

  private takeSnapshot(): void {
    const memUsage = process.memoryUsage();
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      heapUsed: memUsage.heapUsed / 1024 / 1024, // Convert to MB
      heapTotal: memUsage.heapTotal / 1024 / 1024,
      external: memUsage.external / 1024 / 1024,
      rss: memUsage.rss / 1024 / 1024,
      arrayBuffers: memUsage.arrayBuffers / 1024 / 1024
    };

    this.snapshots.push(snapshot);

    // Keep only the last maxSnapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
  }

  private analyzeMemoryTrends(): void {
    if (this.snapshots.length < 2) return;

    const latest = this.snapshots[this.snapshots.length - 1];
    const previous = this.snapshots[this.snapshots.length - 2];
    
    // Check for sudden spikes
    const suddenIncrease = latest.heapUsed - previous.heapUsed;
    if (suddenIncrease > this.alertThresholds.suddenSpikeMB) {
      this.handleLeakAlert({
        type: 'sudden',
        severity: 'high',
        growthRate: suddenIncrease,
        memoryUsed: latest.heapUsed,
        timestamp: latest.timestamp
      });
    }

    // Check gradual growth over time
    if (this.snapshots.length >= 10) {
      const oldSnapshot = this.snapshots[this.snapshots.length - 10];
      const timeDiffHours = (latest.timestamp - oldSnapshot.timestamp) / (1000 * 60 * 60);
      const memoryGrowth = latest.heapUsed - oldSnapshot.heapUsed;
      const growthRate = memoryGrowth / timeDiffHours;

      if (growthRate > this.alertThresholds.gradualGrowthMB) {
        this.handleLeakAlert({
          type: 'gradual',
          severity: this.getSeverityLevel(latest.heapUsed),
          growthRate,
          memoryUsed: latest.heapUsed,
          timestamp: latest.timestamp
        });
      }
    }

    // Check absolute memory usage
    if (latest.heapUsed > this.alertThresholds.criticalMemoryMB) {
      this.handleLeakAlert({
        type: 'stable',
        severity: 'critical',
        growthRate: 0,
        memoryUsed: latest.heapUsed,
        timestamp: latest.timestamp
      });
    }
  }

  private getSeverityLevel(memoryMB: number): 'low' | 'medium' | 'high' | 'critical' {
    if (memoryMB > this.alertThresholds.criticalMemoryMB) return 'critical';
    if (memoryMB > this.alertThresholds.highMemoryMB) return 'high';
    if (memoryMB > this.alertThresholds.highMemoryMB * 0.7) return 'medium';
    return 'low';
  }

  private handleLeakAlert(alert: LeakAlert): void {
    console.warn(`🚨 Memory Leak Alert [${alert.severity.toUpperCase()}]:`, {
      type: alert.type,
      currentMemoryMB: Math.round(alert.memoryUsed),
      growthRateMB: Math.round(alert.growthRate * 100) / 100,
      timestamp: new Date(alert.timestamp).toISOString()
    });

    // Trigger garbage collection if available and severity is high
    if (alert.severity === 'critical' && global.gc) {
      console.log('🧹 Forcing garbage collection due to critical memory usage');
      global.gc();
    }

    // Log memory details for debugging
    this.logMemoryDetails();
  }

  private logMemoryDetails(): void {
    const latest = this.snapshots[this.snapshots.length - 1];
    if (!latest) return;

    console.log('📊 Current Memory Usage:', {
      heapUsed: `${Math.round(latest.heapUsed)}MB`,
      heapTotal: `${Math.round(latest.heapTotal)}MB`,
      external: `${Math.round(latest.external)}MB`,
      rss: `${Math.round(latest.rss)}MB`,
      heapUtilization: `${Math.round((latest.heapUsed / latest.heapTotal) * 100)}%`
    });
  }

  forceGarbageCollection(): void {
    if (global.gc) {
      console.log('🧹 Manual garbage collection triggered');
      global.gc();
      this.takeSnapshot();
    } else {
      console.warn('Garbage collection not available. Run with --expose-gc flag.');
    }
  }

  getMemoryStats() {
    if (this.snapshots.length === 0) {
      return { status: 'no-data' };
    }

    const latest = this.snapshots[this.snapshots.length - 1];
    const oldest = this.snapshots[0];
    const totalGrowth = latest.heapUsed - oldest.heapUsed;
    const timeSpanHours = (latest.timestamp - oldest.timestamp) / (1000 * 60 * 60);

    return {
      status: 'healthy',
      currentMemoryMB: Math.round(latest.heapUsed),
      totalGrowthMB: Math.round(totalGrowth * 100) / 100,
      avgGrowthRateMBPerHour: timeSpanHours > 0 ? Math.round((totalGrowth / timeSpanHours) * 100) / 100 : 0,
      snapshots: this.snapshots.length,
      timeSpanHours: Math.round(timeSpanHours * 100) / 100
    };
  }

  generateReport(): string {
    const stats = this.getMemoryStats();
    if (stats.status === 'no-data') {
      return 'No memory data available';
    }

    return `
Memory Leak Detection Report:
- Current Memory Usage: ${stats.currentMemoryMB}MB
- Total Growth: ${stats.totalGrowthMB}MB over ${stats.timeSpanHours} hours
- Average Growth Rate: ${stats.avgGrowthRateMBPerHour}MB/hour
- Snapshots Collected: ${stats.snapshots}
- Health Status: ${stats.status}
    `.trim();
  }
}

export const memoryLeakDetector = MemoryLeakDetector.getInstance();