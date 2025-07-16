/**
 * AI Engine & Viewer Selection Hooks (v2)
 * 새로운 엔진 레지스트리 시스템을 사용한 React hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { aiEngineRegistry } from '../core/registry/AIEngineRegistry';
import { IAIEngine } from '../core/interfaces/IAIEngine';

// 엔진 정보를 위한 타입 정의
interface EngineInfo {
  id: string;
  name: string;
  description: string;
  version: string;
  provider: string;
  costPerAnalysis: number;
  supportedDataTypes: {
    eeg: boolean;
    ppg: boolean;
    acc: boolean;
  };
  capabilities: {
    supportedLanguages: string[];
    maxDataDuration: number;
    minDataQuality: number;
    supportedOutputFormats: string[];
    realTimeProcessing: boolean;
  };
  recommendedRenderers: string[];
}

// 뷰어 정보를 위한 타입 정의 (기본 구조)
interface ViewerInfo {
  id: string;
  name: string;
  description: string;
  type: 'web' | 'pdf';
  compatibleEngines: string[];
}

// 엔진 선택을 위한 hook
export const useAvailableEngines = (organizationId?: string) => {
  const [engines, setEngines] = useState<EngineInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEngines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 등록된 모든 엔진 조회
      const registeredEngines = aiEngineRegistry.getAll({ includeDisabled: false });
      
      // EngineInfo 형태로 변환
      const engineInfos: EngineInfo[] = registeredEngines.map((engine) => ({
        id: engine.id,
        name: engine.name,
        description: engine.description,
        version: engine.version,
        provider: engine.provider,
        costPerAnalysis: engine.costPerAnalysis,
        supportedDataTypes: engine.supportedDataTypes,
        capabilities: engine.capabilities,
        recommendedRenderers: engine.recommendedRenderers || []
      }));
      
      console.log('✅ 사용 가능한 엔진 목록:', engineInfos.length, '개');
      setEngines(engineInfos);
    } catch (err) {
      console.error('❌ 엔진 목록 로드 실패:', err);
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

// 뷰어 선택을 위한 hook (기본 뷰어 제공)
export const useAvailableViewers = (organizationId?: string, engineId?: string) => {
  const [viewers, setViewers] = useState<ViewerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadViewers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 기본 뷰어들 제공 (Firestore 의존성 제거)
      const defaultViewers: ViewerInfo[] = [
        {
          id: 'basic-gemini-v1-web',
          name: '기본 웹 뷰어',
          description: 'Gemini 분석 결과를 위한 기본 웹 뷰어',
          type: 'web',
          compatibleEngines: ['basic-gemini-v1']
        },
        {
          id: 'universal-web-viewer',
          name: '범용 웹 뷰어',
          description: '모든 엔진과 호환되는 범용 웹 뷰어',
          type: 'web',
          compatibleEngines: ['*'] // 모든 엔진과 호환
        },
        {
          id: 'basic-pdf-renderer',
          name: '기본 PDF 렌더러',
          description: '분석 결과를 PDF로 변환하는 기본 렌더러',
          type: 'pdf',
          compatibleEngines: ['*']
        }
      ];
      
      // 특정 엔진과 호환되는 뷰어만 필터링 (지정된 경우)
      let filteredViewers = defaultViewers;
      if (engineId) {
        filteredViewers = defaultViewers.filter(viewer => 
          viewer.compatibleEngines.includes('*') || 
          viewer.compatibleEngines.includes(engineId)
        );
      }
      
      console.log('✅ 사용 가능한 뷰어 목록:', filteredViewers.length, '개');
      setViewers(filteredViewers);
    } catch (err) {
      console.error('❌ 뷰어 목록 로드 실패:', err);
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
  const [viewers, setViewers] = useState<ViewerInfo[]>([]);
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
      
      // 해당 엔진의 추천 렌더러 조회
      const engine = aiEngineRegistry.get(engineId);
      const recommendedRenderers = engine?.recommendedRenderers || [];
      
      // 기본 호환 뷰어들
      const compatibleViewers: ViewerInfo[] = [
        {
          id: 'universal-web-viewer',
          name: '범용 웹 뷰어',
          description: '모든 엔진과 호환되는 범용 웹 뷰어',
          type: 'web',
          compatibleEngines: ['*']
        }
      ];
      
      // 추천 렌더러가 있으면 추가
      if (recommendedRenderers.length > 0) {
        recommendedRenderers.forEach((rendererId: string) => {
          if (!compatibleViewers.find(v => v.id === rendererId)) {
            compatibleViewers.push({
              id: rendererId,
              name: `${engine?.name} 전용 뷰어`,
              description: `${engine?.name}에 최적화된 뷰어`,
              type: 'web',
              compatibleEngines: [engineId]
            });
          }
        });
      }
      
      setViewers(compatibleViewers);
    } catch (err) {
      console.error('❌ 호환 뷰어 로드 실패:', err);
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

// 권한 확인을 위한 hook (단순화)
export const usePermissionCheck = (organizationId?: string) => {
  const checkEnginePermission = useCallback(async (engineId: string): Promise<boolean> => {
    // 새로운 시스템에서는 등록된 엔진은 모두 사용 가능
    const engine = aiEngineRegistry.get(engineId);
    return !!engine;
  }, [organizationId]);

  const checkViewerPermission = useCallback(async (viewerId: string): Promise<boolean> => {
    // 기본 뷰어들은 모두 사용 가능
    return true;
  }, [organizationId]);

  const checkUsageLimit = useCallback(async (engineId: string): Promise<boolean> => {
    // 개발 중에는 사용량 제한 없음
    return true;
  }, [organizationId]);

  return {
    checkEnginePermission,
    checkViewerPermission,
    checkUsageLimit
  };
};

// AI 리포트 생성 설정을 위한 통합 hook (v2)
export const useAIReportConfiguration = (organizationId?: string) => {
  const [selectedEngine, setSelectedEngine] = useState<string>('');
  const [selectedViewer, setSelectedViewer] = useState<string>('');
  const [selectedPDFViewer, setSelectedPDFViewer] = useState<string>('');
  
  const { engines, loading: enginesLoading, error: enginesError } = useAvailableEngines(organizationId);
  const { viewers, loading: viewersLoading, error: viewersError } = useAvailableViewers(organizationId, selectedEngine);
  const { checkEnginePermission, checkUsageLimit } = usePermissionCheck(organizationId);

  // 첫 번째 엔진과 뷰어를 기본 선택
  useEffect(() => {
    if (engines.length > 0 && !selectedEngine) {
      const defaultEngine = engines[0];
      setSelectedEngine(defaultEngine.id);
      console.log('🎯 기본 엔진 선택:', defaultEngine.name);
    }
  }, [engines, selectedEngine]);

  useEffect(() => {
    if (viewers.length > 0 && selectedEngine) {
      if (!selectedViewer) {
        const webViewer = viewers.find(v => v.type === 'web');
        if (webViewer) {
          setSelectedViewer(webViewer.id);
          console.log('🎯 기본 웹 뷰어 선택:', webViewer.name);
        }
      }
      
      if (!selectedPDFViewer) {
        const pdfViewer = viewers.find(v => v.type === 'pdf');
        if (pdfViewer) {
          setSelectedPDFViewer(pdfViewer.id);
          console.log('🎯 기본 PDF 뷰어 선택:', pdfViewer.name);
        }
      }
    }
  }, [viewers, selectedEngine, selectedViewer, selectedPDFViewer]);

  // 엔진 변경 시 뷰어 선택 초기화
  const handleEngineChange = useCallback((engineId: string) => {
    console.log('🔄 엔진 변경:', engineId);
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

  // 로딩 상태와 에러 상태 로깅
  useEffect(() => {
    if (enginesLoading || viewersLoading) {
      console.log('⏳ AI 설정 로딩 중...');
    } else {
      console.log('✅ AI 설정 로드 완료:', {
        engines: engines.length,
        viewers: viewers.length,
        selectedEngine,
        selectedViewer
      });
    }
  }, [enginesLoading, viewersLoading, engines.length, viewers.length, selectedEngine, selectedViewer]);

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