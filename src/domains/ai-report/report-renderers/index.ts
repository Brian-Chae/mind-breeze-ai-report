/**
 * 리포트 렌더러 등록 시스템
 * 모든 리포트 렌더러들을 자동으로 등록하고 관리
 */

import { rendererRegistry } from '../core/registry/RendererRegistry';
import { BasicWebRenderer } from './web/BasicWebRenderer';

/**
 * 모든 리포트 렌더러 등록
 */
export function registerAllRenderers(): void {
  try {
    // Basic Web 렌더러 등록
    const basicWebRenderer = new BasicWebRenderer();
    rendererRegistry.register(basicWebRenderer);

    console.log('✅ All report renderers registered successfully');
  } catch (error) {
    console.error('❌ Failed to register report renderers:', error);
  }
}

/**
 * 개발 환경용 테스트 렌더러들 등록
 */
export function registerTestRenderers(): void {
  try {
    // 테스트용 렌더러들을 여기에 등록
    // 예: MockRenderer, PreviewRenderer 등
    
    console.log('✅ Test renderers registered for development');
  } catch (error) {
    console.error('❌ Failed to register test renderers:', error);
  }
}

/**
 * 특정 환경에 따른 렌더러 등록
 */
export function initializeRenderers(): void {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // 기본 렌더러들 등록
  registerAllRenderers();
  
  // 개발 환경에서는 테스트 렌더러들도 등록
  if (isDevelopment) {
    registerTestRenderers();
  }
  
  // 렌더러 통계 출력
  const stats = rendererRegistry.getStats();
  console.log(`📊 Renderer Registry Stats:`, {
    totalRenderers: stats.totalRenderers,
    enabledRenderers: stats.enabledRenderers,
    formatsCount: stats.formatsCount
  });
}

// 기본 렌더러들 내보내기
export { BasicWebRenderer };

// 레지스트리도 함께 내보내기
export { rendererRegistry };

export default {
  registerAllRenderers,
  registerTestRenderers,
  initializeRenderers
}; 