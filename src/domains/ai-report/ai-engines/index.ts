/**
 * AI 엔진 초기화 및 등록
 */

import { AIEngineRegistry } from '../services/AIEngineService';
import { BasicGeminiV1Engine } from './BasicGeminiV1Engine';

// 환경변수에서 API 키 로드
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

/**
 * AI 엔진들 초기화 및 등록
 */
export function initializeAIEngines(): void {
  console.log('Initializing AI engines...');
  
  try {
    // Basic Gemini V1 엔진 등록
    if (GEMINI_API_KEY) {
      const basicGeminiEngine = new BasicGeminiV1Engine(GEMINI_API_KEY);
      AIEngineRegistry.register('basic_gemini_v1', basicGeminiEngine);
      console.log('✅ Basic Gemini V1 engine registered');
    } else {
      console.warn('⚠️ Gemini API key not found, skipping Basic Gemini V1 engine');
    }
    
    // TODO: 추가 엔진들 등록
    // - Detail Gemini V1
    // - Focus Claude V1
    // - Custom engines...
    
    const registeredEngines = AIEngineRegistry.getAll();
    console.log(`🎯 Successfully registered ${registeredEngines.length} AI engines:`, registeredEngines);
    
  } catch (error) {
    console.error('❌ Failed to initialize AI engines:', error);
  }
}

/**
 * 앱 시작 시 자동 초기화
 */
if (typeof window !== 'undefined') {
  // 브라우저 환경에서만 실행
  initializeAIEngines();
}

export { BasicGeminiV1Engine }; 