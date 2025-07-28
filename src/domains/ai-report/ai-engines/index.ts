/**
 * AI 엔진 등록 시스템
 * 모든 AI 엔진들을 자동으로 등록하고 관리
 */

import { aiEngineRegistry } from '../core/registry/AIEngineRegistry';
import { BasicGeminiV1Engine } from './BasicGeminiV1Engine';
import { MockTestEngine } from './MockTestEngine';
import { EEGAdvancedGeminiEngine } from './EEGAdvancedGeminiEngine';

/**
 * 프로덕션용 AI 엔진 등록
 */
export function registerProductionEngines(): void {
  try {
    // Basic Gemini V1 엔진 등록
    const basicGeminiEngine = new BasicGeminiV1Engine();
    aiEngineRegistry.register(basicGeminiEngine);

    // EEG Advanced Gemini 엔진 등록
    const eegAdvancedEngine = new EEGAdvancedGeminiEngine();
    aiEngineRegistry.register(eegAdvancedEngine);

    console.log('✅ Production AI engines registered successfully');
  } catch (error) {
    console.error('❌ Failed to register production AI engines:', error);
  }
}

/**
 * 개발 환경용 테스트 엔진들 등록
 */
export function registerTestEngines(): void {
  try {
    // Mock 테스트 엔진 등록
    const mockEngine = new MockTestEngine();
    aiEngineRegistry.register(mockEngine);
    
    console.log('✅ Test engines registered for development');
  } catch (error) {
    console.error('❌ Failed to register test engines:', error);
  }
}

/**
 * 모든 AI 엔진 등록 (하위 호환성을 위해 유지)
 */
export function registerAllEngines(): void {
  registerProductionEngines();
}

/**
 * 환경별 엔진 초기화
 */
export function initializeEngines(): void {
  const isDevelopment = import.meta.env?.DEV || process.env.NODE_ENV === 'development';
  
  try {
    // 프로덕션 엔진들 등록
    registerProductionEngines();
    
    // 개발 환경에서는 테스트 엔진들도 추가 등록
    if (isDevelopment) {
      registerTestEngines();
    }
    
    // 등록된 엔진들 상태 확인
    const stats = aiEngineRegistry.getStats();
    console.log(`📊 Engine Registry Stats:`, {
      totalEngines: stats.totalEngines,
      enabledEngines: stats.enabledEngines,
      providersCount: stats.providersCount
    });

    // 개발 환경에서는 엔진 건강성 검사
    if (isDevelopment) {
      const healthReport = aiEngineRegistry.generateHealthReport();
      console.log(`🏥 Engine Health Report:`, healthReport);
      
      if (healthReport.overallHealth !== 'healthy') {
        console.warn('⚠️ 일부 엔진에 문제가 있습니다:', {
          invalidEngines: healthReport.invalidEngines,
          errors: healthReport.errors.slice(0, 3) // 첫 3개 오류만 표시
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Engine initialization failed:', error);
  }
}

/**
 * 엔진 목록 및 정보 조회
 */
export function getRegisteredEngines(): Array<{
  id: string;
  name: string;
  description: string;
  provider: string;
  version: string;
  cost: number;
  supportedDataTypes: string[];
}> {
  const engines = aiEngineRegistry.getAll();
  
  return engines.map(engine => ({
    id: engine.id,
    name: engine.name,
    description: engine.description,
    provider: engine.provider,
    version: engine.version,
    cost: engine.costPerAnalysis,
    supportedDataTypes: Object.entries(engine.supportedDataTypes)
      .filter(([_, supported]) => supported)
      .map(([type, _]) => type.toUpperCase())
  }));
}

/**
 * 특정 데이터 타입을 지원하는 엔진 조회
 */
export function getEnginesForDataTypes(eeg: boolean = false, ppg: boolean = false, acc: boolean = false) {
  return aiEngineRegistry.search({
    supportedDataTypes: { eeg, ppg, acc }
  });
}

/**
 * 비용별 엔진 조회
 */
export function getEnginesByCost(maxCost: number) {
  return aiEngineRegistry.search({
    maxCost
  }, {
    sortBy: 'cost',
    sortOrder: 'asc'
  });
}

// 기본 엔진들 내보내기
export { BasicGeminiV1Engine, MockTestEngine, EEGAdvancedGeminiEngine };

// 레지스트리도 함께 내보내기
export { aiEngineRegistry };

export default {
  registerAllEngines,
  registerProductionEngines,
  registerTestEngines,
  initializeEngines,
  getRegisteredEngines,
  getEnginesForDataTypes,
  getEnginesByCost
}; 