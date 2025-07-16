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

class AIEngineRegistry {
  private engines: Map<string, IAIEngine> = new Map();
  private enabledEngines: Set<string> = new Set();
  private engineMetadata: Map<string, EngineMetadata> = new Map();

  /**
   * 엔진 등록
   */
  register(engine: IAIEngine): void {
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
    
    console.log(`AI Engine registered: ${engine.id} (${engine.name})`);
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

// 싱글톤 인스턴스 생성
export const aiEngineRegistry = new AIEngineRegistry();

export default aiEngineRegistry; 