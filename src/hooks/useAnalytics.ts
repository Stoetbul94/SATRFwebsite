import { useState, useEffect, useCallback, useMemo } from 'react';
import { analyticsAPI, analyticsUtils, UserAnalytics, AnalyticsFilters, ScoreDataPoint, DisciplineStats } from '../lib/analytics';

interface UseAnalyticsOptions {
  userId?: string;
  initialFilters?: AnalyticsFilters;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  enableCaching?: boolean;
  cacheTimeout?: number; // in milliseconds
}

interface UseAnalyticsReturn {
  // Data
  analytics: UserAnalytics | null;
  scoreHistory: ScoreDataPoint[];
  disciplineStats: DisciplineStats[];
  
  // State
  loading: boolean;
  error: string | null;
  filters: AnalyticsFilters;
  
  // Actions
  loadAnalytics: () => Promise<void>;
  updateFilters: (newFilters: Partial<AnalyticsFilters>) => void;
  refreshData: () => Promise<void>;
  exportData: (format: 'csv' | 'json' | 'pdf') => Promise<void>;
  
  // Computed values
  summary: {
    totalMatches: number;
    averageScore: number;
    personalBest: number;
    totalXCount: number;
    improvementRate: number;
    consistencyScore: number;
  } | null;
  
  // Filter options
  availableDisciplines: string[];
  dateRange: { start: string; end: string };
  
  // Utilities
  getDisciplineColor: (discipline: string) => string;
  getPerformanceLevel: (score: number) => { level: string; color: string };
  formatDate: (dateString: string) => string;
}

export const useAnalytics = (options: UseAnalyticsOptions = {}): UseAnalyticsReturn => {
  const {
    userId,
    initialFilters = {},
    autoRefresh = false,
    refreshInterval = 300000, // 5 minutes
    enableCaching = true,
    cacheTimeout = 600000, // 10 minutes
  } = options;

  // State
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AnalyticsFilters>(initialFilters);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const [cache, setCache] = useState<Map<string, { data: UserAnalytics; timestamp: number }>>(new Map());

  // Default date range (last 90 days)
  const defaultDateRange = useMemo(() => ({
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  }), []);

  // Initialize filters with date range if not provided
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(
    filters.dateRange || defaultDateRange
  );

  // Generate cache key based on filters
  const getCacheKey = useCallback((currentFilters: AnalyticsFilters): string => {
    return JSON.stringify({
      userId,
      filters: currentFilters,
      dateRange
    });
  }, [userId, dateRange]);

  // Check if cached data is still valid
  const isCacheValid = useCallback((cacheKey: string): boolean => {
    if (!enableCaching) return false;
    
    const cached = cache.get(cacheKey);
    if (!cached) return false;
    
    return Date.now() - cached.timestamp < cacheTimeout;
  }, [cache, enableCaching, cacheTimeout]);

  // Load analytics data
  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const currentFilters: AnalyticsFilters = {
        ...filters,
        dateRange: dateRange,
      };

      const cacheKey = getCacheKey(currentFilters);

      // Check cache first
      if (isCacheValid(cacheKey)) {
        const cached = cache.get(cacheKey);
        if (cached) {
          setAnalytics(cached.data);
          setLastFetch(cached.timestamp);
          return;
        }
      }

      // Fetch from API
      let data: UserAnalytics;

      // In development, use mock data if API is not available
      if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_API_BASE_URL) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        data = analyticsUtils.generateMockAnalytics();
      } else {
        data = await analyticsAPI.getUserAnalytics(currentFilters);
      }

      // Cache the data
      if (enableCaching) {
        setCache(prev => new Map(prev).set(cacheKey, {
          data,
          timestamp: Date.now()
        }));
      }

      setAnalytics(data);
      setLastFetch(Date.now());
    } catch (err: any) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics data. Please try again.');
      
      // Fallback to mock data in development
      if (process.env.NODE_ENV === 'development') {
        const mockData = analyticsUtils.generateMockAnalytics();
        setAnalytics(mockData);
        setLastFetch(Date.now());
      }
    } finally {
      setLoading(false);
    }
  }, [filters, dateRange, getCacheKey, isCacheValid, enableCaching]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<AnalyticsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Update date range
  const updateDateRange = useCallback((field: 'start' | 'end', value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  }, []);

  // Refresh data
  const refreshData = useCallback(async () => {
    // Clear cache to force fresh data
    if (enableCaching) {
      setCache(new Map());
    }
    await loadAnalytics();
  }, [loadAnalytics, enableCaching]);

  // Export data
  const exportData = useCallback(async (format: 'csv' | 'json' | 'pdf') => {
    try {
      const currentFilters: AnalyticsFilters = {
        ...filters,
        dateRange: dateRange,
      };

      const blob = await analyticsAPI.exportAnalytics(format, currentFilters);
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `satrf-analytics-${new Date().toISOString().split('T')[0]}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting analytics:', err);
      throw new Error('Failed to export analytics data');
    }
  }, [filters, dateRange]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadAnalytics();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadAnalytics]);

  // Load data on mount and when filters change
  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Computed values
  const summary = useMemo(() => {
    if (!analytics) return null;
    return analytics.summary;
  }, [analytics]);

  const scoreHistory = useMemo(() => {
    if (!analytics) return [];
    return analytics.scoreHistory;
  }, [analytics]);

  const disciplineStats = useMemo(() => {
    if (!analytics) return [];
    return analytics.disciplineStats;
  }, [analytics]);

  const availableDisciplines = useMemo(() => {
    if (!analytics) return [];
    return analytics.disciplineStats.map(stat => stat.discipline);
  }, [analytics]);

  // Utility functions
  const getDisciplineColor = useCallback((discipline: string): string => {
    return analyticsUtils.getDisciplineColor(discipline);
  }, []);

  const getPerformanceLevel = useCallback((score: number) => {
    return analyticsUtils.getPerformanceLevel(score);
  }, []);

  const formatDate = useCallback((dateString: string): string => {
    return analyticsUtils.formatDate(dateString);
  }, []);

  return {
    // Data
    analytics,
    scoreHistory,
    disciplineStats,
    
    // State
    loading,
    error,
    filters,
    
    // Actions
    loadAnalytics,
    updateFilters,
    refreshData,
    exportData,
    
    // Computed values
    summary,
    
    // Filter options
    availableDisciplines,
    dateRange,
    
    // Utilities
    getDisciplineColor,
    getPerformanceLevel,
    formatDate,
  };
};

// Specialized hooks for specific analytics features
export const useScoreHistory = (options: UseAnalyticsOptions = {}) => {
  const analytics = useAnalytics(options);
  
  const filteredScoreHistory = useMemo(() => {
    if (!analytics.scoreHistory.length) return [];
    
    let filtered = analytics.scoreHistory;
    
    // Filter by discipline if specified
    if (analytics.filters.discipline) {
      filtered = filtered.filter(score => 
        score.discipline === analytics.filters.discipline
      );
    }
    
    // Filter by date range
    if (analytics.filters.dateRange) {
      const { start, end } = analytics.filters.dateRange;
      filtered = filtered.filter(score => {
        const scoreDate = new Date(score.date);
        const startDate = new Date(start);
        const endDate = new Date(end);
        return scoreDate >= startDate && scoreDate <= endDate;
      });
    }
    
    return filtered;
  }, [analytics.scoreHistory, analytics.filters]);

  const scoreTrends = useMemo(() => {
    if (filteredScoreHistory.length < 2) return null;
    
    const sortedScores = [...filteredScoreHistory].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const recentScores = sortedScores.slice(-5);
    const averageScore = recentScores.reduce((sum, score) => sum + score.score, 0) / recentScores.length;
    
    const previousScores = sortedScores.slice(-10, -5);
    const previousAverage = previousScores.length > 0 
      ? previousScores.reduce((sum, score) => sum + score.score, 0) / previousScores.length
      : averageScore;
    
    const improvement = previousAverage > 0 
      ? ((averageScore - previousAverage) / previousAverage) * 100
      : 0;
    
    return {
      currentAverage: averageScore,
      previousAverage,
      improvement,
      trend: improvement > 0 ? 'up' : improvement < 0 ? 'down' : 'stable'
    };
  }, [filteredScoreHistory]);

  return {
    ...analytics,
    scoreHistory: filteredScoreHistory,
    scoreTrends,
  };
};

export const useDisciplineAnalytics = (discipline?: string) => {
  const analytics = useAnalytics({
    initialFilters: discipline ? { discipline } : {}
  });
  
  const disciplineData = useMemo(() => {
    if (!analytics.disciplineStats.length) return null;
    
    if (discipline) {
      return analytics.disciplineStats.find(stat => stat.discipline === discipline);
    }
    
    return analytics.disciplineStats;
  }, [analytics.disciplineStats, discipline]);

  const disciplineProgress = useMemo(() => {
    if (!disciplineData || !Array.isArray(disciplineData)) return null;
    
    const data = Array.isArray(disciplineData) ? disciplineData[0] : disciplineData;
    if (!data) return null;
    
    // Calculate progress indicators
    const scoreProgress = (data.averageScore / 100) * 100; // Assuming 100 is max score
    const xCountProgress = (data.averageXCount / 10) * 100; // Assuming 10 is max X count
    
    return {
      scoreProgress: Math.min(scoreProgress, 100),
      xCountProgress: Math.min(xCountProgress, 100),
      matchesProgress: Math.min((data.totalMatches / 50) * 100, 100), // Assuming 50 matches is a good target
    };
  }, [disciplineData]);

  return {
    ...analytics,
    disciplineData,
    disciplineProgress,
  };
};

export default useAnalytics; 