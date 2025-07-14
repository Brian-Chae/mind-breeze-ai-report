/**
 * AI Health Report 히스토리 관리 훅
 * - 리포트 목록 조회, 검색, 필터링
 * - 리포트 저장, 삭제
 * - 통계 정보 제공
 */

import { useState, useEffect, useCallback } from 'react';
import ReportStorage, { StoredReport, ReportSearchFilter, ReportStats } from '../services/ReportStorage';
import { AIAnalysisResult, PersonalInfo, MeasurementData } from '../types/index';

export interface UseReportHistoryReturn {
  // 데이터
  reports: StoredReport[];
  stats: ReportStats | null;
  currentReport: StoredReport | null;
  
  // 로딩 상태
  isLoading: boolean;
  isSearching: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  
  // 에러 상태
  error: string | null;
  
  // 액션
  loadReports: () => Promise<void>;
  searchReports: (filter: ReportSearchFilter) => Promise<void>;
  saveReport: (personalInfo: PersonalInfo, analysisResult: AIAnalysisResult, measurementData: MeasurementData, tags?: string[], notes?: string) => Promise<string | null>;
  loadReport: (reportId: string) => Promise<void>;
  deleteReport: (reportId: string) => Promise<boolean>;
  exportReports: () => Promise<string | null>;
  importReports: (jsonData: string) => Promise<number>;
  
  // 유틸리티
  clearError: () => void;
  resetSearch: () => void;
  refreshStats: () => Promise<void>;
}

export const useReportHistory = (): UseReportHistoryReturn => {
  const [reports, setReports] = useState<StoredReport[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [currentReport, setCurrentReport] = useState<StoredReport | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  
  const storage = ReportStorage.getInstance();

  /**
   * 모든 리포트 로드
   */
  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const allReports = await storage.getAllReports();
      setReports(allReports);
      console.log(`✅ ${allReports.length}개 리포트 로드 완료`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '리포트를 불러오는데 실패했습니다.';
      setError(errorMessage);
      console.error('❌ 리포트 로드 실패:', err);
    } finally {
      setIsLoading(false);
    }
  }, [storage]);

  /**
   * 리포트 검색
   */
  const searchReports = useCallback(async (filter: ReportSearchFilter) => {
    setIsSearching(true);
    setError(null);
    
    try {
      const searchResults = await storage.searchReports(filter);
      setReports(searchResults);
      console.log(`🔍 검색 완료: ${searchResults.length}개 리포트 발견`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '리포트 검색에 실패했습니다.';
      setError(errorMessage);
      console.error('❌ 리포트 검색 실패:', err);
    } finally {
      setIsSearching(false);
    }
  }, [storage]);

  /**
   * 새 리포트 저장
   */
  const saveReport = useCallback(async (
    personalInfo: PersonalInfo,
    analysisResult: AIAnalysisResult,
    measurementData: MeasurementData,
    tags: string[] = [],
    notes?: string
  ): Promise<string | null> => {
    setIsSaving(true);
    setError(null);
    
    try {
      const reportId = await storage.saveReport(personalInfo, analysisResult, measurementData, tags, notes);
      
      // 리포트 목록 새로고침
      await loadReports();
      await refreshStats();
      
      console.log(`✅ 리포트 저장 완료: ${reportId}`);
      return reportId;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '리포트 저장에 실패했습니다.';
      setError(errorMessage);
      console.error('❌ 리포트 저장 실패:', err);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [storage, loadReports]);

  /**
   * 특정 리포트 로드
   */
  const loadReport = useCallback(async (reportId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const report = await storage.getReport(reportId);
      setCurrentReport(report);
      
      if (report) {
        console.log(`✅ 리포트 로드 완료: ${reportId}`);
      } else {
        console.warn(`⚠️ 리포트를 찾을 수 없음: ${reportId}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '리포트를 불러오는데 실패했습니다.';
      setError(errorMessage);
      console.error('❌ 리포트 로드 실패:', err);
    } finally {
      setIsLoading(false);
    }
  }, [storage]);

  /**
   * 리포트 삭제
   */
  const deleteReport = useCallback(async (reportId: string): Promise<boolean> => {
    setIsDeleting(true);
    setError(null);
    
    try {
      const success = await storage.deleteReport(reportId);
      
      if (success) {
        // 리포트 목록에서 제거
        setReports(prev => prev.filter(report => report.id !== reportId));
        
        // 현재 리포트가 삭제된 리포트라면 초기화
        if (currentReport?.id === reportId) {
          setCurrentReport(null);
        }
        
        await refreshStats();
        console.log(`✅ 리포트 삭제 완료: ${reportId}`);
      }
      
      return success;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '리포트 삭제에 실패했습니다.';
      setError(errorMessage);
      console.error('❌ 리포트 삭제 실패:', err);
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [storage, currentReport]);

  /**
   * 모든 리포트 내보내기
   */
  const exportReports = useCallback(async (): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const exportData = await storage.exportAllReports();
      console.log('✅ 리포트 내보내기 완료');
      return exportData;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '리포트 내보내기에 실패했습니다.';
      setError(errorMessage);
      console.error('❌ 리포트 내보내기 실패:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [storage]);

  /**
   * 리포트 가져오기
   */
  const importReports = useCallback(async (jsonData: string): Promise<number> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const importedCount = await storage.importReports(jsonData);
      
      // 리포트 목록 새로고침
      await loadReports();
      await refreshStats();
      
      console.log(`✅ ${importedCount}개 리포트 가져오기 완료`);
      return importedCount;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '리포트 가져오기에 실패했습니다.';
      setError(errorMessage);
      console.error('❌ 리포트 가져오기 실패:', err);
      return 0;
    } finally {
      setIsLoading(false);
    }
  }, [storage, loadReports]);

  /**
   * 통계 정보 새로고침
   */
  const refreshStats = useCallback(async () => {
    try {
      const newStats = await storage.getReportStats();
      setStats(newStats);
    } catch (err) {
      console.error('❌ 통계 정보 로드 실패:', err);
    }
  }, [storage]);

  /**
   * 에러 초기화
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * 검색 초기화 (모든 리포트 다시 로드)
   */
  const resetSearch = useCallback(async () => {
    await loadReports();
  }, [loadReports]);

  // 초기 로드
  useEffect(() => {
    loadReports();
    refreshStats();
  }, [loadReports, refreshStats]);

  return {
    // 데이터
    reports,
    stats,
    currentReport,
    
    // 로딩 상태
    isLoading,
    isSearching,
    isSaving,
    isDeleting,
    
    // 에러 상태
    error,
    
    // 액션
    loadReports,
    searchReports,
    saveReport,
    loadReport,
    deleteReport,
    exportReports,
    importReports,
    
    // 유틸리티
    clearError,
    resetSearch,
    refreshStats
  };
};

export default useReportHistory; 