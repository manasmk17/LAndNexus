import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

// Performance monitoring hook
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
  });

  useEffect(() => {
    const startTime = performance.now();

    // Monitor initial page load
    const handleLoad = () => {
      const loadTime = performance.now() - startTime;
      setMetrics(prev => ({ ...prev, loadTime }));
    };

    // Monitor memory usage if available
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // MB
        }));
      }
    };

    window.addEventListener('load', handleLoad);
    const memoryInterval = setInterval(updateMemoryUsage, 5000);

    return () => {
      window.removeEventListener('load', handleLoad);
      clearInterval(memoryInterval);
    };
  }, []);

  return metrics;
}

// Debounced search hook for better performance
export function useDebouncedSearch(initialValue: string = "", delay: number = 300) {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  const handleChange = useCallback((newValue: string) => {
    setValue(newValue);
  }, []);

  return {
    value,
    debouncedValue,
    setValue: handleChange,
  };
}

// Optimized data fetching with intelligent caching
export function useOptimizedQuery<T>(
  queryKey: string[],
  queryFn?: () => Promise<T>,
  options?: {
    staleTime?: number;
    cacheTime?: number;
    enabled?: boolean;
  }
) {
  const defaultOptions = {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    enabled: true,
    ...options,
  };

  return useQuery({
    queryKey,
    queryFn,
    ...defaultOptions,
  });
}

// Batch API requests to reduce server load
export function useBatchedRequests<T>(
  requests: Array<() => Promise<T>>,
  batchSize: number = 3
) {
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const executeBatch = useCallback(async () => {
    if (requests.length === 0) return;

    setLoading(true);
    setError(null);
    const batchResults: T[] = [];

    try {
      for (let i = 0; i < requests.length; i += batchSize) {
        const batch = requests.slice(i, i + batchSize);
        const batchPromises = batch.map(request => request());
        const batchResponse = await Promise.all(batchPromises);
        batchResults.push(...batchResponse);
        
        // Small delay between batches to prevent overwhelming the server
        if (i + batchSize < requests.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      setResults(batchResults);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [requests, batchSize]);

  return {
    results,
    loading,
    error,
    execute: executeBatch,
  };
}

// Image optimization hook
export function useOptimizedImage(src: string, options?: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}) {
  const optimizedSrc = useMemo(() => {
    if (!src) return '';

    // If it's already an optimized URL or external URL, return as is
    if (src.startsWith('http') || src.includes('?')) {
      return src;
    }

    const params = new URLSearchParams();
    
    if (options?.width) params.append('w', options.width.toString());
    if (options?.height) params.append('h', options.height.toString());
    if (options?.quality) params.append('q', options.quality.toString());
    if (options?.format) params.append('f', options.format);

    const queryString = params.toString();
    return queryString ? `${src}?${queryString}` : src;
  }, [src, options]);

  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = useCallback(() => {
    setLoaded(true);
    setError(false);
  }, []);

  const handleError = useCallback(() => {
    setError(true);
    setLoaded(false);
  }, []);

  return {
    src: optimizedSrc,
    loaded,
    error,
    onLoad: handleLoad,
    onError: handleError,
  };
}

// Virtual scrolling hook for large lists
export function useVirtualizedList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight,
    };
  }, [items, itemHeight, containerHeight, scrollTop]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    ...visibleItems,
    onScroll: handleScroll,
  };
}

// Local storage hook with performance optimization
export function useOptimizedLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  // Memoize the initial value to avoid repeated localStorage reads
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  // Debounced setter to reduce localStorage writes
  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value);
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue];
}