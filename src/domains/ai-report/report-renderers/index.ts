/**
 * 리포트 렌더러 등록 시스템
 * 모든 리포트 렌더러들을 자동으로 등록하고 관리
 */

import { rendererRegistry } from '../core/registry/RendererRegistry';
import { BasicGeminiV1WebRenderer } from './web/BasicGeminiV1WebRenderer';
import { BasicGeminiV1MobileRenderer } from './web/BasicGeminiV1MobileRenderer';
import { EEGAdvancedReactRenderer } from './EEGAdvancedReactRenderer';
import { PPGAdvancedReactRenderer } from './PPGAdvancedReactRenderer';
// IntegratedAdvancedReactRenderer는 PipelineReportViewer로 대체됨
import { IntegratedAdvancedJsonRenderer } from './IntegratedAdvancedJsonRenderer';

/**
 * 모든 리포트 렌더러 등록
 */
export function registerAllRenderers(): void {
  try {
    // Gemini V1 Web 렌더러 등록
    const basicGeminiV1WebRenderer = new BasicGeminiV1WebRenderer();
    rendererRegistry.register(basicGeminiV1WebRenderer);

    // Gemini V1 Mobile 렌더러 등록
    const basicGeminiV1MobileRenderer = new BasicGeminiV1MobileRenderer();
    rendererRegistry.register(basicGeminiV1MobileRenderer);

    // EEG Advanced React 렌더러 등록
    const eegAdvancedReactRenderer = new EEGAdvancedReactRenderer();
    rendererRegistry.register(eegAdvancedReactRenderer);

    // PPG Advanced React 렌더러 등록
    const ppgAdvancedReactRenderer = new PPGAdvancedReactRenderer();
    rendererRegistry.register(ppgAdvancedReactRenderer);

    // Integrated Advanced React 렌더러는 PipelineReportViewer로 대체됨

    // Integrated Advanced JSON 렌더러 등록
    const integratedAdvancedJsonRenderer = new IntegratedAdvancedJsonRenderer();
    rendererRegistry.register(integratedAdvancedJsonRenderer);

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
export { 
  BasicGeminiV1WebRenderer, 
  BasicGeminiV1MobileRenderer,
  EEGAdvancedReactRenderer,
  PPGAdvancedReactRenderer,
  // IntegratedAdvancedReactRenderer는 PipelineReportViewer로 대체됨
  IntegratedAdvancedJsonRenderer
};

// 레지스트리도 함께 내보내기
export { rendererRegistry };

export default {
  registerAllRenderers,
  registerTestRenderers,
  initializeRenderers
}; 