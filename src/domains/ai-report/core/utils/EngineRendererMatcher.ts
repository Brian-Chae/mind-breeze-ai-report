/**
 * AI 엔진과 렌더러 매칭 유틸리티
 * 엔진별로 적합한 렌더러를 찾고 관리하는 기능들
 */

import { IAIEngine } from '../interfaces/IAIEngine';
import { IReportRenderer } from '../interfaces/IReportRenderer';
import { aiEngineRegistry } from '../registry/AIEngineRegistry';
import { rendererRegistry } from '../registry/RendererRegistry';

/**
 * 특정 AI 엔진에 대해 호환 가능한 렌더러들을 찾습니다
 */
export function findCompatibleRenderers(engineId: string): IReportRenderer[] {
  const engine = aiEngineRegistry.get(engineId);
  if (!engine) {
    throw new Error(`Engine not found: ${engineId}`);
  }

  const allRenderers = rendererRegistry.getAll();
  return allRenderers.filter(renderer => 
    renderer.supportedEngines.includes(engineId)
  );
}

/**
 * 특정 렌더러가 지원하는 AI 엔진들을 찾습니다
 */
export function findSupportedEngines(rendererId: string): IAIEngine[] {
  const renderer = rendererRegistry.get(rendererId);
  if (!renderer) {
    throw new Error(`Renderer not found: ${rendererId}`);
  }

  const allEngines = aiEngineRegistry.getAll();
  return allEngines.filter(engine => 
    renderer.supportedEngines.includes(engine.id)
  );
}

/**
 * AI 엔진에 대해 권장 렌더러를 가져옵니다
 */
export function getRecommendedRenderers(engineId: string): IReportRenderer[] {
  const engine = aiEngineRegistry.get(engineId);
  if (!engine) {
    throw new Error(`Engine not found: ${engineId}`);
  }

  const recommendedRenderers: IReportRenderer[] = [];
  
  for (const rendererId of engine.recommendedRenderers) {
    const renderer = rendererRegistry.get(rendererId);
    if (renderer && renderer.supportedEngines.includes(engineId)) {
      recommendedRenderers.push(renderer);
    }
  }

  return recommendedRenderers;
}

/**
 * 가장 적합한 렌더러를 자동으로 선택합니다
 * 1. 권장 렌더러 중 첫 번째
 * 2. 호환 가능한 렌더러 중 첫 번째
 * 3. 기본 렌더러
 */
export function selectBestRenderer(
  engineId: string, 
  outputFormat?: string
): IReportRenderer | null {
  // 1. 권장 렌더러 확인
  const recommended = getRecommendedRenderers(engineId);
  if (outputFormat) {
    const formatMatched = recommended.find(r => r.outputFormat === outputFormat);
    if (formatMatched) return formatMatched;
  }
  if (recommended.length > 0) {
    return recommended[0];
  }

  // 2. 호환 가능한 렌더러 확인
  const compatible = findCompatibleRenderers(engineId);
  if (outputFormat) {
    const formatMatched = compatible.find(r => r.outputFormat === outputFormat);
    if (formatMatched) return formatMatched;
  }
  if (compatible.length > 0) {
    return compatible[0];
  }

  // 3. 기본 렌더러 (없으면 null)
  return null;
}

/**
 * 엔진-렌더러 호환성 매트릭스를 생성합니다
 */
export function generateCompatibilityMatrix(): {
  engine: string;
  compatibleRenderers: string[];
  recommendedRenderers: string[];
}[] {
  const engines = aiEngineRegistry.getAll();
  
  return engines.map(engine => ({
    engine: engine.id,
    compatibleRenderers: findCompatibleRenderers(engine.id).map(r => r.id),
    recommendedRenderers: getRecommendedRenderers(engine.id).map(r => r.id)
  }));
}

/**
 * 매칭 통계를 생성합니다
 */
export function getMatchingStats(): {
  totalEngines: number;
  totalRenderers: number;
  totalCompatiblePairs: number;
  enginesCoverage: number; // 렌더러가 있는 엔진 비율
  renderersCoverage: number; // 엔진이 있는 렌더러 비율
} {
  const engines = aiEngineRegistry.getAll();
  const renderers = rendererRegistry.getAll();
  
  let totalCompatiblePairs = 0;
  let enginesWithRenderers = 0;
  let renderersWithEngines = 0;
  
  engines.forEach(engine => {
    const compatible = findCompatibleRenderers(engine.id);
    if (compatible.length > 0) {
      enginesWithRenderers++;
      totalCompatiblePairs += compatible.length;
    }
  });
  
  renderers.forEach(renderer => {
    const supported = findSupportedEngines(renderer.id);
    if (supported.length > 0) {
      renderersWithEngines++;
    }
  });
  
  return {
    totalEngines: engines.length,
    totalRenderers: renderers.length,
    totalCompatiblePairs,
    enginesCoverage: engines.length > 0 ? (enginesWithRenderers / engines.length) * 100 : 0,
    renderersCoverage: renderers.length > 0 ? (renderersWithEngines / renderers.length) * 100 : 0
  };
} 