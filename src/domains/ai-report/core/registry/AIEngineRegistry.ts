/**
 * AI 엔진 레지스트리
 * 모든 AI 엔진들을 등록하고 관리하는 중앙 레지스트리
 */

import { IAIEngine, MeasurementDataType } from '../interfaces/IAIEngine';

export interface EngineFilter {
  provider?: string;
  supportedDataTypes?: Partial<MeasurementDataType>;
  maxCost?: number;
  minQualityScore?: number;
  capabilities?: string[];
}

export interface EngineSearchOptions {
  includeDisabled?: boolean;
  sortBy?: 'cost' | 'name' | 'quality' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

// 엔진 검증 결과 인터페이스
export interface EngineValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

class AIEngineRegistry {
  private engines: Map<string, IAIEngine> = new Map();
  private enabledEngines: Set<string> = new Set();
  private engineMetadata: Map<string, EngineMetadata> = new Map();

  /**
   * 엔진 필수 정보 검증
   */
  private validateEngine(engine: IAIEngine): EngineValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. 필수 메타정보 검증
    if (!engine.id || typeof engine.id !== 'string' || engine.id.trim() === '') {
      errors.push('엔진 ID가 필수입니다.');
    } else if (!/^[a-z0-9-]+$/.test(engine.id)) {
      errors.push('엔진 ID는 소문자, 숫자, 하이픈(-)만 사용 가능합니다.');
    }

    if (!engine.name || typeof engine.name !== 'string' || engine.name.trim() === '') {
      errors.push('엔진 이름이 필수입니다.');
    }

    if (!engine.description || typeof engine.description !== 'string' || engine.description.trim() === '') {
      errors.push('엔진 설명이 필수입니다.');
    }

    if (!engine.version || typeof engine.version !== 'string' || engine.version.trim() === '') {
      errors.push('엔진 버전이 필수입니다.');
    } else if (!/^\d+\.\d+\.\d+$/.test(engine.version)) {
      warnings.push('버전은 x.y.z 형식을 권장합니다.');
    }

    if (!engine.provider || typeof engine.provider !== 'string' || engine.provider.trim() === '') {
      errors.push('엔진 제공업체(provider)가 필수입니다.');
    }

    // 2. 비용 정보 검증
    if (typeof engine.costPerAnalysis !== 'number') {
      errors.push('분석당 비용(costPerAnalysis)이 필수입니다.');
    } else if (engine.costPerAnalysis < 0) {
      errors.push('분석당 비용은 0 이상이어야 합니다.');
    } else if (!Number.isInteger(engine.costPerAnalysis)) {
      errors.push('분석당 비용은 정수여야 합니다.');
    }

    // 3. 지원 데이터 타입 검증
    if (!engine.supportedDataTypes || typeof engine.supportedDataTypes !== 'object') {
      errors.push('지원 데이터 타입(supportedDataTypes)이 필수입니다.');
    } else {
      const { eeg, ppg, acc } = engine.supportedDataTypes;
      if (typeof eeg !== 'boolean' || typeof ppg !== 'boolean' || typeof acc !== 'boolean') {
        errors.push('supportedDataTypes의 모든 속성(eeg, ppg, acc)은 boolean이어야 합니다.');
      }
      if (!eeg && !ppg && !acc) {
        errors.push('최소 하나의 데이터 타입은 지원해야 합니다.');
      }
    }

    // 4. 능력(capabilities) 검증
    if (!engine.capabilities || typeof engine.capabilities !== 'object') {
      errors.push('엔진 능력(capabilities)이 필수입니다.');
    } else {
      const caps = engine.capabilities;
      
      if (!Array.isArray(caps.supportedLanguages) || caps.supportedLanguages.length === 0) {
        errors.push('지원 언어(supportedLanguages)가 필수입니다.');
      }
      
      if (typeof caps.maxDataDuration !== 'number' || caps.maxDataDuration <= 0) {
        errors.push('최대 데이터 길이(maxDataDuration)는 양수여야 합니다.');
      }
      
      if (typeof caps.minDataQuality !== 'number' || caps.minDataQuality < 0 || caps.minDataQuality > 100) {
        errors.push('최소 데이터 품질(minDataQuality)은 0-100 사이여야 합니다.');
      }
      
      if (!Array.isArray(caps.supportedOutputFormats) || caps.supportedOutputFormats.length === 0) {
        errors.push('지원 출력 형식(supportedOutputFormats)이 필수입니다.');
      }
      
      if (typeof caps.realTimeProcessing !== 'boolean') {
        errors.push('실시간 처리 지원(realTimeProcessing)은 boolean이어야 합니다.');
      }
    }

    // 5. 권장 렌더러 검증
    if (!Array.isArray(engine.recommendedRenderers)) {
      warnings.push('권장 렌더러(recommendedRenderers) 목록을 설정하는 것을 권장합니다.');
    }

    // 6. 필수 메서드 검증
    if (typeof engine.validate !== 'function') {
      errors.push('validate 메서드가 필수입니다.');
    }

    if (typeof engine.analyze !== 'function') {
      errors.push('analyze 메서드가 필수입니다.');
    }

    // 7. 중복 ID 검증
    if (this.engines.has(engine.id)) {
      warnings.push(`엔진 ID '${engine.id}'가 이미 등록되어 있습니다. 기존 엔진을 덮어씁니다.`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 엔진 등록 (검증 포함)
   */
  register(engine: IAIEngine, options: { skipValidation?: boolean } = {}): void {
    // 검증 수행 (skipValidation이 false인 경우)
    if (!options.skipValidation) {
      const validation = this.validateEngine(engine);
      
      // 검증 실패 시 등록 중단
      if (!validation.isValid) {
        const errorMessage = `엔진 등록 실패 (${engine.id || 'unknown'}): ${validation.errors.join(', ')}`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      // 경고 출력
      if (validation.warnings.length > 0) {
        console.warn(`엔진 등록 경고 (${engine.id}): ${validation.warnings.join(', ')}`);
      }
    }

    // 기존 엔진 덮어쓰기 경고
    if (this.engines.has(engine.id)) {
      console.warn(`Engine ${engine.id} is already registered. Overwriting...`);
    }
    
    this.engines.set(engine.id, engine);
    this.enabledEngines.add(engine.id);
    
    // 메타데이터 초기화
    this.engineMetadata.set(engine.id, {
      registeredAt: new Date().toISOString(),
      usageCount: 0,
      averageRating: 0,
      lastUsed: null,
      isEnabled: true
    });
    
    console.log(`✅ AI Engine registered: ${engine.id} (${engine.name}) - Cost: ${engine.costPerAnalysis} credits`);
  }

  /**
   * 엔진 일괄 검증
   */
  validateAllEngines(): Map<string, EngineValidationResult> {
    const results = new Map<string, EngineValidationResult>();
    
    this.engines.forEach((engine, id) => {
      const validation = this.validateEngine(engine);
      results.set(id, validation);
    });
    
    return results;
  }

  /**
   * 엔진 상태 보고서 생성
   */
  generateHealthReport(): EngineHealthReport {
    const validationResults = this.validateAllEngines();
    const totalEngines = this.engines.size;
    let validEngines = 0;
    let enginesWithWarnings = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    validationResults.forEach((result, engineId) => {
      if (result.isValid) {
        validEngines++;
      } else {
        errors.push(`${engineId}: ${result.errors.join(', ')}`);
      }
      
      if (result.warnings.length > 0) {
        enginesWithWarnings++;
        warnings.push(`${engineId}: ${result.warnings.join(', ')}`);
      }
    });

    return {
      timestamp: new Date().toISOString(),
      totalEngines,
      validEngines,
      invalidEngines: totalEngines - validEngines,
      enginesWithWarnings,
      errors,
      warnings,
      overallHealth: validEngines === totalEngines ? 'healthy' : validEngines > 0 ? 'warning' : 'critical'
    };
  }

  /**
   * 엔진 등록 해제
   */
  unregister(engineId: string): boolean {
    const removed = this.engines.delete(engineId);
    this.enabledEngines.delete(engineId);
    this.engineMetadata.delete(engineId);
    
    if (removed) {
      console.log(`AI Engine unregistered: ${engineId}`);
    }
    
    return removed;
  }

  /**
   * 엔진 조회
   */
  get(engineId: string): IAIEngine | undefined {
    return this.engines.get(engineId);
  }

  /**
   * 모든 엔진 조회
   */
  getAll(options: EngineSearchOptions = {}): IAIEngine[] {
    let engines = Array.from(this.engines.values());
    
    // 비활성화된 엔진 제외
    if (!options.includeDisabled) {
      engines = engines.filter(engine => this.enabledEngines.has(engine.id));
    }
    
    // 정렬
    if (options.sortBy) {
      engines.sort((a, b) => {
        let comparison = 0;
        
        switch (options.sortBy) {
          case 'cost':
            comparison = a.costPerAnalysis - b.costPerAnalysis;
            break;
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'quality':
            const aMetadata = this.engineMetadata.get(a.id);
            const bMetadata = this.engineMetadata.get(b.id);
            comparison = (aMetadata?.averageRating || 0) - (bMetadata?.averageRating || 0);
            break;
          case 'popularity':
            const aUsage = this.engineMetadata.get(a.id)?.usageCount || 0;
            const bUsage = this.engineMetadata.get(b.id)?.usageCount || 0;
            comparison = aUsage - bUsage;
            break;
        }
        
        return options.sortOrder === 'desc' ? -comparison : comparison;
      });
    }
    
    return engines;
  }

  /**
   * 엔진 검색
   */
  search(filter: EngineFilter, options: EngineSearchOptions = {}): IAIEngine[] {
    let engines = this.getAll(options);
    
    // 프로바이더 필터
    if (filter.provider) {
      engines = engines.filter(engine => engine.provider === filter.provider);
    }
    
    // 데이터 타입 필터
    if (filter.supportedDataTypes) {
      engines = engines.filter(engine => {
        const supported = engine.supportedDataTypes;
        const required = filter.supportedDataTypes!;
        
        return (!required.eeg || supported.eeg) &&
               (!required.ppg || supported.ppg) &&
               (!required.acc || supported.acc);
      });
    }
    
    // 비용 필터
    if (filter.maxCost !== undefined) {
      engines = engines.filter(engine => engine.costPerAnalysis <= filter.maxCost!);
    }
    
    // 품질 점수 필터
    if (filter.minQualityScore !== undefined) {
      engines = engines.filter(engine => {
        const metadata = this.engineMetadata.get(engine.id);
        return (metadata?.averageRating || 0) >= filter.minQualityScore!;
      });
    }
    
    return engines;
  }

  /**
   * 엔진 활성화/비활성화
   */
  setEnabled(engineId: string, enabled: boolean): boolean {
    if (!this.engines.has(engineId)) {
      return false;
    }
    
    const metadata = this.engineMetadata.get(engineId);
    if (metadata) {
      metadata.isEnabled = enabled;
    }
    
    if (enabled) {
      this.enabledEngines.add(engineId);
    } else {
      this.enabledEngines.delete(engineId);
    }
    
    return true;
  }

  /**
   * 엔진 사용 기록
   */
  recordUsage(engineId: string, rating?: number): void {
    const metadata = this.engineMetadata.get(engineId);
    if (metadata) {
      metadata.usageCount++;
      metadata.lastUsed = new Date().toISOString();
      
      if (rating !== undefined) {
        // 평균 평점 계산 (단순 이동평균)
        metadata.averageRating = (metadata.averageRating + rating) / 2;
      }
    }
  }

  /**
   * 엔진 메타데이터 조회
   */
  getMetadata(engineId: string): EngineMetadata | undefined {
    return this.engineMetadata.get(engineId);
  }

  /**
   * 전체 엔진 통계
   */
  getStats(): RegistryStats {
    const totalEngines = this.engines.size;
    const enabledEngines = this.enabledEngines.size;
    const providers = new Set(Array.from(this.engines.values()).map(e => e.provider));
    
    const totalUsage = Array.from(this.engineMetadata.values())
      .reduce((sum, metadata) => sum + metadata.usageCount, 0);
    
    const averageRating = Array.from(this.engineMetadata.values())
      .filter(metadata => metadata.averageRating > 0)
      .reduce((sum, metadata, _, arr) => sum + metadata.averageRating / arr.length, 0);
    
    return {
      totalEngines,
      enabledEngines,
      providersCount: providers.size,
      totalUsage,
      averageRating
    };
  }

  /**
   * 레지스트리 초기화
   */
  clear(): void {
    this.engines.clear();
    this.enabledEngines.clear();
    this.engineMetadata.clear();
    console.log('AI Engine Registry cleared');
  }
}

interface EngineMetadata {
  registeredAt: string;
  usageCount: number;
  averageRating: number;
  lastUsed: string | null;
  isEnabled: boolean;
}

interface RegistryStats {
  totalEngines: number;
  enabledEngines: number;
  providersCount: number;
  totalUsage: number;
  averageRating: number;
}

interface EngineHealthReport {
  timestamp: string;
  totalEngines: number;
  validEngines: number;
  invalidEngines: number;
  enginesWithWarnings: number;
  errors: string[];
  warnings: string[];
  overallHealth: 'healthy' | 'warning' | 'critical';
}

// 싱글톤 인스턴스 생성
export const aiEngineRegistry = new AIEngineRegistry();

export default aiEngineRegistry; 