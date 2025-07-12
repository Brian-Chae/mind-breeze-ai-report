/**
 * 성능 최적화 훅
 * - 메모이제이션을 통한 불필요한 리렌더링 방지
 * - 가상화를 통한 대용량 데이터 처리
 * - 메모리 사용량 모니터링 및 최적화
 * - 이미지 지연 로딩 및 캐싱
 */

import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { StoredReport } from '../services/ReportStorage';

export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentCount: number;
  lastOptimization: number;
}

export interface VirtualizationOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  threshold?: number;
}

export interface UsePerformanceOptimizationOptions {
  enableVirtualization?: boolean;
  enableMemoization?: boolean;
  enableMemoryMonitoring?: boolean;
  maxCacheSize?: number;
  debounceDelay?: number;
}

export function usePerformanceOptimization(options: UsePerformanceOptimizationOptions = {}) {
  const {
    enableVirtualization = true,
    enableMemoization = true,
    enableMemoryMonitoring = true,
    maxCacheSize = 100,
    debounceDelay = 300
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    componentCount: 0,
    lastOptimization: Date.now()
  });

  const cacheRef = useRef<Map<string, any>>(new Map());
  const renderTimeRef = useRef<number>(0);
  const componentCountRef = useRef<number>(0);

  // 메모리 사용량 모니터링
  const monitorMemoryUsage = useCallback(() => {
    if (!enableMemoryMonitoring || typeof (performance as any).memory === 'undefined') {
      return 0;
    }

    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    };
  }, [enableMemoryMonitoring]);

  // 캐시 관리
  const memoizedValue = useCallback(<T>(key: string, computeFn: () => T): T => {
    if (!enableMemoization) {
      return computeFn();
    }

    if (cacheRef.current.has(key)) {
      return cacheRef.current.get(key);
    }

    const value = computeFn();
    
    // 캐시 크기 제한
    if (cacheRef.current.size >= maxCacheSize) {
      const firstKey = cacheRef.current.keys().next().value;
      if (firstKey) {
        cacheRef.current.delete(firstKey);
      }
    }
    
    cacheRef.current.set(key, value);
    return value;
  }, [enableMemoization, maxCacheSize]);

  // 캐시 클리어
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  // 디바운스 함수
  const debounce = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    delay: number = debounceDelay
  ): ((...args: Parameters<T>) => void) => {
    const timeoutRef = useRef<NodeJS.Timeout>();
    
    return (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        func(...args);
      }, delay);
    };
  }, [debounceDelay]);

  // 가상화 계산
  const calculateVirtualization = useCallback((
    items: any[],
    options: VirtualizationOptions,
    scrollTop: number = 0
  ) => {
    if (!enableVirtualization) {
      return {
        visibleItems: items,
        startIndex: 0,
        endIndex: items.length - 1,
        totalHeight: items.length * options.itemHeight,
        offsetY: 0
      };
    }

    const { itemHeight, containerHeight, overscan = 3 } = options;
    const totalHeight = items.length * itemHeight;
    
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const endIndex = Math.min(items.length - 1, startIndex + visibleCount + overscan * 2);
    
    const visibleItems = items.slice(startIndex, endIndex + 1);
    const offsetY = startIndex * itemHeight;

    return {
      visibleItems,
      startIndex,
      endIndex,
      totalHeight,
      offsetY
    };
  }, [enableVirtualization]);

  // 리포트 데이터 메모이제이션
  const memoizedReportAnalysis = useCallback((reports: StoredReport[]) => {
    return memoizedValue(`reports_analysis_${reports.length}`, () => {
      const analysis = {
        totalReports: reports.length,
        averageScore: reports.reduce((sum, r) => sum + r.analysisResult.overallHealth.score, 0) / reports.length,
        scoreDistribution: {
          excellent: reports.filter(r => r.analysisResult.overallHealth.score >= 85).length,
          good: reports.filter(r => r.analysisResult.overallHealth.score >= 70).length,
          fair: reports.filter(r => r.analysisResult.overallHealth.score >= 55).length,
          poor: reports.filter(r => r.analysisResult.overallHealth.score < 55).length
        },
        trends: calculateScoreTrends(reports),
        problemFrequency: calculateProblemFrequency(reports)
      };
      
      return analysis;
    });
  }, [memoizedValue]);

  // 점수 트렌드 계산
  const calculateScoreTrends = useCallback((reports: StoredReport[]) => {
    if (reports.length < 2) return null;
    
    const sortedReports = [...reports].sort((a, b) => a.timestamp - b.timestamp);
    const recentReports = sortedReports.slice(-5); // 최근 5개
    
    const scores = recentReports.map(r => r.analysisResult.overallHealth.score);
    const trend = scores[scores.length - 1] - scores[0];
    
    return {
      direction: trend > 0 ? 'improving' : trend < 0 ? 'declining' : 'stable',
      change: Math.abs(trend),
      scores: scores
    };
  }, []);

  // 문제 빈도 계산
  const calculateProblemFrequency = useCallback((reports: StoredReport[]) => {
    const problemCount = new Map<string, number>();
    
    reports.forEach(report => {
      report.analysisResult.problemAreas?.forEach(problem => {
        const count = problemCount.get(problem.category) || 0;
        problemCount.set(problem.category, count + 1);
      });
    });
    
    return Array.from(problemCount.entries())
      .map(([category, count]) => ({ category, count, percentage: (count / reports.length) * 100 }))
      .sort((a, b) => b.count - a.count);
  }, []);

  // 이미지 지연 로딩
  const lazyLoadImage = useCallback((src: string, placeholder?: string): string => {
    return memoizedValue(`image_${src}`, () => {
      const img = new Image();
      img.src = src;
      return placeholder || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23f0f0f0"/></svg>';
    });
  }, [memoizedValue]);

  // 렌더링 성능 측정
  const measureRenderTime = useCallback((componentName: string, renderFn: () => JSX.Element) => {
    if (!enableMemoryMonitoring) {
      return renderFn();
    }

    const startTime = performance.now();
    const result = renderFn();
    const endTime = performance.now();
    
    renderTimeRef.current = endTime - startTime;
    componentCountRef.current += 1;
    
    console.log(`[Performance] ${componentName} rendered in ${renderTimeRef.current.toFixed(2)}ms`);
    
    return result;
  }, [enableMemoryMonitoring]);

  // 메트릭 업데이트
  useEffect(() => {
    if (!enableMemoryMonitoring) return;

    const updateMetrics = () => {
      const memoryInfo = monitorMemoryUsage();
      
      setMetrics(prev => ({
        renderTime: renderTimeRef.current,
        memoryUsage: typeof memoryInfo === 'object' ? memoryInfo.percentage : 0,
        componentCount: componentCountRef.current,
        lastOptimization: Date.now()
      }));
    };

    const interval = setInterval(updateMetrics, 5000); // 5초마다 업데이트
    return () => clearInterval(interval);
  }, [enableMemoryMonitoring, monitorMemoryUsage]);

  // 메모리 정리
  useEffect(() => {
    return () => {
      clearCache();
    };
  }, [clearCache]);

  // 성능 최적화 제안
  const getOptimizationSuggestions = useCallback(() => {
    const suggestions: string[] = [];
    
    if (metrics.memoryUsage > 80) {
      suggestions.push('메모리 사용량이 높습니다. 캐시를 정리하는 것을 권장합니다.');
    }
    
    if (metrics.renderTime > 100) {
      suggestions.push('렌더링 시간이 길어지고 있습니다. 컴포넌트 최적화를 검토해보세요.');
    }
    
    if (cacheRef.current.size > maxCacheSize * 0.8) {
      suggestions.push('캐시 크기가 제한에 근접했습니다. 불필요한 데이터를 정리하세요.');
    }
    
    return suggestions;
  }, [metrics, maxCacheSize]);

  return {
    // 메모이제이션
    memoizedValue,
    memoizedReportAnalysis,
    clearCache,
    
    // 가상화
    calculateVirtualization,
    
    // 유틸리티
    debounce,
    lazyLoadImage,
    measureRenderTime,
    
    // 메트릭
    metrics,
    getOptimizationSuggestions,
    
    // 메모리 관리
    monitorMemoryUsage
  };
}

export default usePerformanceOptimization; 