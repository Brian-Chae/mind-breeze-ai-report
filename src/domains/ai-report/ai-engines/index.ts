/**
 * AI 엔진 등록 시스템
 * 모든 AI 엔진들을 자동으로 등록하고 관리
 */

import { aiEngineRegistry } from '../core/registry/AIEngineRegistry';
import { BasicGeminiV1Engine } from './BasicGeminiV1Engine';

/**
 * 모든 AI 엔진 등록
 */
export function registerAllEngines(): void {
  try {
    // Basic Gemini V1 엔진 등록
    const basicGeminiEngine = new BasicGeminiV1Engine();
    aiEngineRegistry.register(basicGeminiEngine);

    console.log('✅ All AI engines registered successfully');
  } catch (error) {
    console.error('❌ Failed to register AI engines:', error);
  }
}

/**
 * 개발 환경용 테스트 엔진들 등록
 */
export function registerTestEngines(): void {
  try {
    // 테스트용 엔진들을 여기에 등록
    // 예: MockEngine, DemoEngine 등
    
    console.log('✅ Test engines registered for development');
  } catch (error) {
    console.error('❌ Failed to register test engines:', error);
  }
}

/**
 * 특정 환경에 따른 엔진 등록
 */
export function initializeEngines(): void {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // 기본 엔진들 등록
  registerAllEngines();
  
  // 개발 환경에서는 테스트 엔진들도 등록
  if (isDevelopment) {
    registerTestEngines();
  }
  
  // 엔진 통계 출력
  const stats = aiEngineRegistry.getStats();
  console.log(`📊 Engine Registry Stats:`, {
    totalEngines: stats.totalEngines,
    enabledEngines: stats.enabledEngines,
    providersCount: stats.providersCount
  });
}

// 기본 엔진들 내보내기
export { BasicGeminiV1Engine };

// 레지스트리도 함께 내보내기
export { aiEngineRegistry };

export default {
  registerAllEngines,
  registerTestEngines,
  initializeEngines
}; 