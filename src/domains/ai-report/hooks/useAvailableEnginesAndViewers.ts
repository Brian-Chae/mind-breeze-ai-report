/**
 * AI Engine & Viewer Selection Hooks
 * 기업별 사용 가능한 AI 엔진과 뷰어 선택을 위한 React hooks
 */

import { useState, useEffect, useCallback } from 'react';
import aiEnginePermissionService, { AIEngine, ReportViewer } from '../services/AIEnginePermissionService';

// 엔진 선택을 위한 hook
export const useAvailableEngines = (organizationId: string) => {
  const [engines, setEngines] = useState<AIEngine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEngines = useCallback(async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const availableEngines = await aiEnginePermissionService.getAvailableEngines(organizationId);
      setEngines(availableEngines);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 엔진 목록을 불러오는데 실패했습니다.');
      setEngines([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadEngines();
  }, [loadEngines]);

  return {
    engines,
    loading,
    error,
    refetch: loadEngines
  };
};

// 뷰어 선택을 위한 hook
export const useAvailableViewers = (organizationId: string, engineId?: string) => {
  const [viewers, setViewers] = useState<ReportViewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadViewers = useCallback(async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const availableViewers = await aiEnginePermissionService.getAvailableViewers(organizationId, engineId);
      setViewers(availableViewers);
    } catch (err) {
      setError(err instanceof Error ? err.message : '뷰어 목록을 불러오는데 실패했습니다.');
      setViewers([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId, engineId]);

  useEffect(() => {
    loadViewers();
  }, [loadViewers]);

  return {
    viewers,
    loading,
    error,
    refetch: loadViewers
  };
};

// 호환 가능한 뷰어를 위한 hook
export const useCompatibleViewers = (engineId: string) => {
  const [viewers, setViewers] = useState<ReportViewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCompatibleViewers = useCallback(async () => {
    if (!engineId) {
      setViewers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const compatibleViewers = await aiEnginePermissionService.getCompatibleViewers(engineId);
      setViewers(compatibleViewers);
    } catch (err) {
      setError(err instanceof Error ? err.message : '호환 가능한 뷰어 목록을 불러오는데 실패했습니다.');
      setViewers([]);
    } finally {
      setLoading(false);
    }
  }, [engineId]);

  useEffect(() => {
    loadCompatibleViewers();
  }, [loadCompatibleViewers]);

  return {
    viewers,
    loading,
    error,
    refetch: loadCompatibleViewers
  };
};

// 권한 확인을 위한 hook
export const usePermissionCheck = (organizationId: string) => {
  const checkEnginePermission = useCallback(async (engineId: string): Promise<boolean> => {
    if (!organizationId || !engineId) return false;
    
    try {
      return await aiEnginePermissionService.checkEnginePermission(organizationId, engineId);
    } catch (error) {
      console.error('Engine permission check failed:', error);
      return false;
    }
  }, [organizationId]);

  const checkViewerPermission = useCallback(async (viewerId: string): Promise<boolean> => {
    if (!organizationId || !viewerId) return false;
    
    try {
      return await aiEnginePermissionService.checkViewerPermission(organizationId, viewerId);
    } catch (error) {
      console.error('Viewer permission check failed:', error);
      return false;
    }
  }, [organizationId]);

  const checkUsageLimit = useCallback(async (engineId: string): Promise<boolean> => {
    if (!organizationId || !engineId) return false;
    
    try {
      return await aiEnginePermissionService.checkUsageLimit(organizationId, engineId);
    } catch (error) {
      console.error('Usage limit check failed:', error);
      return false;
    }
  }, [organizationId]);

  return {
    checkEnginePermission,
    checkViewerPermission,
    checkUsageLimit
  };
};

// AI 리포트 생성 설정을 위한 통합 hook
export const useAIReportConfiguration = (organizationId: string) => {
  const [selectedEngine, setSelectedEngine] = useState<string>('');
  const [selectedViewer, setSelectedViewer] = useState<string>('');
  const [selectedPDFViewer, setSelectedPDFViewer] = useState<string>('');
  
  const { engines, loading: enginesLoading, error: enginesError } = useAvailableEngines(organizationId);
  const { viewers, loading: viewersLoading, error: viewersError } = useAvailableViewers(organizationId, selectedEngine);
  const { checkEnginePermission, checkUsageLimit } = usePermissionCheck(organizationId);

  // 엔진 선택 시 자동으로 호환 뷰어 필터링
  useEffect(() => {
    if (selectedEngine && viewers.length > 0) {
      // 첫 번째 호환 뷰어를 기본 선택
      const webViewer = viewers.find(v => v.type === 'web');
      const pdfViewer = viewers.find(v => v.type === 'pdf');
      
      if (webViewer && !selectedViewer) {
        setSelectedViewer(webViewer.id);
      }
      if (pdfViewer && !selectedPDFViewer) {
        setSelectedPDFViewer(pdfViewer.id);
      }
    }
  }, [selectedEngine, viewers, selectedViewer, selectedPDFViewer]);

  // 엔진 변경 시 뷰어 선택 초기화
  const handleEngineChange = useCallback((engineId: string) => {
    setSelectedEngine(engineId);
    setSelectedViewer('');
    setSelectedPDFViewer('');
  }, []);

  // 설정 유효성 검증
  const validateConfiguration = useCallback(async () => {
    if (!selectedEngine) {
      return { isValid: false, message: 'AI 엔진을 선택해주세요.' };
    }

    if (!selectedViewer) {
      return { isValid: false, message: '뷰어를 선택해주세요.' };
    }

    // 권한 확인
    const hasEnginePermission = await checkEnginePermission(selectedEngine);
    if (!hasEnginePermission) {
      return { isValid: false, message: '선택한 AI 엔진에 대한 권한이 없습니다.' };
    }

    // 사용량 제한 확인
    const withinUsageLimit = await checkUsageLimit(selectedEngine);
    if (!withinUsageLimit) {
      return { isValid: false, message: '이번 달 사용량 한도를 초과했습니다.' };
    }

    return { isValid: true, message: '설정이 완료되었습니다.' };
  }, [selectedEngine, selectedViewer, checkEnginePermission, checkUsageLimit]);

  return {
    // 선택된 값들
    selectedEngine,
    selectedViewer,
    selectedPDFViewer,
    
    // 선택 변경 함수들
    setSelectedEngine: handleEngineChange,
    setSelectedViewer,
    setSelectedPDFViewer,
    
    // 데이터
    engines,
    viewers: viewers.filter(v => v.type === 'web'), // 웹 뷰어만
    pdfViewers: viewers.filter(v => v.type === 'pdf'), // PDF 뷰어만
    
    // 상태
    loading: enginesLoading || viewersLoading,
    error: enginesError || viewersError,
    
    // 유틸리티
    validateConfiguration,
    
    // 선택된 엔진/뷰어의 상세 정보
    selectedEngineDetails: engines.find(e => e.id === selectedEngine),
    selectedViewerDetails: viewers.find(v => v.id === selectedViewer),
    selectedPDFViewerDetails: viewers.find(v => v.id === selectedPDFViewer)
  };
}; 