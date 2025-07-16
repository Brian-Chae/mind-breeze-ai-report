/**
 * AI Report 도메인 메인 엔트리 포인트
 * 확장가능한 AI 리포트 시스템의 모든 구성 요소들을 통합
 */

// 핵심 인터페이스
export type { 
  IAIEngine, 
  MeasurementDataType,
  ValidationResult,
  AnalysisOptions,
  AnalysisResult,
  EngineCapabilities
} from './core/interfaces/IAIEngine';

export type {
  IReportRenderer,
  OutputFormat,
  RenderOptions,
  RenderedReport,
  ReportTemplate,
  RendererCapabilities
} from './core/interfaces/IReportRenderer';

// 레지스트리 시스템
export { 
  type EngineFilter,
  type EngineSearchOptions
} from './core/registry/AIEngineRegistry';
import { aiEngineRegistry } from './core/registry/AIEngineRegistry';

export { 
  type RendererFilter,
  type RendererSearchOptions
} from './core/registry/RendererRegistry';
import { rendererRegistry } from './core/registry/RendererRegistry';

// AI 엔진들
export { 
  BasicGeminiV1Engine,
  registerAllEngines
} from './ai-engines';
import { initializeEngines } from './ai-engines';

// 리포트 렌더러들
export { 
  BasicGeminiV1WebRenderer,
  registerAllRenderers
} from './report-renderers';
import { initializeRenderers } from './report-renderers';

// 기존 서비스들 (호환성 유지)
export { MeasurementDataService } from './services/MeasurementDataService';
export { ReportGenerationService } from './services/ReportGenerationService';
export { AIEngineService } from './services/AIEngineService';

// 기존 타입들 (호환성 유지)
export type { 
  MeasurementData,
  EEGMetrics,
  PPGMetrics,
  ACCMetrics
} from './types';

// 컴포넌트들
export { AIHealthReportApp } from './components/AIHealthReportApp';
export { PersonalInfoScreen } from './components/PersonalInfoScreen';
export { DeviceConnectionScreen } from './components/DeviceConnectionScreen';
export { DataQualityScreen } from './components/DataQualityScreen';
export { MeasurementScreen } from './components/MeasurementScreen';
export { AnalysisScreen } from './components/AnalysisScreen';
export { ReportScreen } from './components/ReportScreen';

/**
 * AI 리포트 시스템 초기화
 * 애플리케이션 시작 시 호출하여 모든 엔진과 렌더러를 등록
 */
export function initializeAIReportSystem(): void {
  console.log('🚀 Initializing AI Report System...');
  
  try {
    // AI 엔진들 초기화
    initializeEngines();
    
    // 리포트 렌더러들 초기화
    initializeRenderers();
    
    console.log('✅ AI Report System initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize AI Report System:', error);
    throw error;
  }
}

/**
 * 시스템 상태 조회
 */
export function getSystemStatus(): any {
  const engineStats = aiEngineRegistry.getStats();
  const rendererStats = rendererRegistry.getStats();
  
  return {
    engines: engineStats,
    renderers: rendererStats,
    isHealthy: engineStats.totalEngines > 0 && rendererStats.totalRenderers > 0
  };
}

/**
 * 사용 가능한 AI 엔진 목록 조회
 */
export function getAvailableEngines() {
  return aiEngineRegistry.getAll();
}

/**
 * 사용 가능한 렌더러 목록 조회
 */
export function getAvailableRenderers() {
  return rendererRegistry.getAll();
}

export default {
  initializeAIReportSystem,
  getSystemStatus,
  getAvailableEngines,
  getAvailableRenderers
}; 