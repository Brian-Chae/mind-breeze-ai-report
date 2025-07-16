/**
 * 리포트 렌더러 레지스트리
 * 모든 리포트 렌더러들을 등록하고 관리하는 중앙 레지스트리
 */

import { IReportRenderer, OutputFormat } from '../interfaces/IReportRenderer';

export interface RendererFilter {
  outputFormat?: OutputFormat;
  maxCost?: number;
  supportsBranding?: boolean;
  supportsCharts?: boolean;
  supportsInteractivity?: boolean;
  supportedLanguages?: string[];
}

export interface RendererSearchOptions {
  includeDisabled?: boolean;
  sortBy?: 'cost' | 'name' | 'format' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

class RendererRegistry {
  private renderers: Map<string, IReportRenderer> = new Map();
  private enabledRenderers: Set<string> = new Set();
  private rendererMetadata: Map<string, RendererMetadata> = new Map();

  /**
   * 렌더러 등록
   */
  register(renderer: IReportRenderer): void {
    if (this.renderers.has(renderer.id)) {
      console.warn(`Renderer ${renderer.id} is already registered. Overwriting...`);
    }
    
    this.renderers.set(renderer.id, renderer);
    this.enabledRenderers.add(renderer.id);
    
    // 메타데이터 초기화
    this.rendererMetadata.set(renderer.id, {
      registeredAt: new Date().toISOString(),
      usageCount: 0,
      averageRating: 0,
      lastUsed: null,
      isEnabled: true,
      outputFormat: renderer.outputFormat
    });
    
    console.log(`Report Renderer registered: ${renderer.id} (${renderer.name})`);
  }

  /**
   * 렌더러 등록 해제
   */
  unregister(rendererId: string): boolean {
    const removed = this.renderers.delete(rendererId);
    this.enabledRenderers.delete(rendererId);
    this.rendererMetadata.delete(rendererId);
    
    if (removed) {
      console.log(`Report Renderer unregistered: ${rendererId}`);
    }
    
    return removed;
  }

  /**
   * 렌더러 조회
   */
  get(rendererId: string): IReportRenderer | undefined {
    return this.renderers.get(rendererId);
  }

  /**
   * 모든 렌더러 조회
   */
  getAll(options: RendererSearchOptions = {}): IReportRenderer[] {
    let renderers = Array.from(this.renderers.values());
    
    // 비활성화된 렌더러 제외
    if (!options.includeDisabled) {
      renderers = renderers.filter(renderer => this.enabledRenderers.has(renderer.id));
    }
    
    // 정렬
    if (options.sortBy) {
      renderers.sort((a, b) => {
        let comparison = 0;
        
        switch (options.sortBy) {
          case 'cost':
            comparison = a.costPerRender - b.costPerRender;
            break;
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'format':
            comparison = a.outputFormat.localeCompare(b.outputFormat);
            break;
          case 'popularity':
            const aUsage = this.rendererMetadata.get(a.id)?.usageCount || 0;
            const bUsage = this.rendererMetadata.get(b.id)?.usageCount || 0;
            comparison = aUsage - bUsage;
            break;
        }
        
        return options.sortOrder === 'desc' ? -comparison : comparison;
      });
    }
    
    return renderers;
  }

  /**
   * 출력 포맷별 렌더러 조회
   */
  getByFormat(format: OutputFormat): IReportRenderer[] {
    return Array.from(this.renderers.values())
      .filter(renderer => 
        renderer.outputFormat === format && 
        this.enabledRenderers.has(renderer.id)
      );
  }

  /**
   * 렌더러 검색
   */
  search(filter: RendererFilter, options: RendererSearchOptions = {}): IReportRenderer[] {
    let renderers = this.getAll(options);
    
    // 출력 포맷 필터
    if (filter.outputFormat) {
      renderers = renderers.filter(renderer => renderer.outputFormat === filter.outputFormat);
    }
    
    // 비용 필터
    if (filter.maxCost !== undefined) {
      renderers = renderers.filter(renderer => renderer.costPerRender <= filter.maxCost!);
    }
    
    // 브랜딩 지원 필터
    if (filter.supportsBranding !== undefined) {
      renderers = renderers.filter(renderer => 
        renderer.capabilities.supportsBranding === filter.supportsBranding
      );
    }
    
    // 차트 지원 필터
    if (filter.supportsCharts !== undefined) {
      renderers = renderers.filter(renderer => 
        renderer.capabilities.supportsCharts === filter.supportsCharts
      );
    }
    
    // 인터랙티브 지원 필터
    if (filter.supportsInteractivity !== undefined) {
      renderers = renderers.filter(renderer => 
        renderer.capabilities.supportsInteractivity === filter.supportsInteractivity
      );
    }
    
    // 언어 지원 필터
    if (filter.supportedLanguages) {
      renderers = renderers.filter(renderer => 
        filter.supportedLanguages!.every(lang => 
          renderer.capabilities.supportedLanguages.includes(lang)
        )
      );
    }
    
    return renderers;
  }

  /**
   * 렌더러 활성화/비활성화
   */
  setEnabled(rendererId: string, enabled: boolean): boolean {
    if (!this.renderers.has(rendererId)) {
      return false;
    }
    
    const metadata = this.rendererMetadata.get(rendererId);
    if (metadata) {
      metadata.isEnabled = enabled;
    }
    
    if (enabled) {
      this.enabledRenderers.add(rendererId);
    } else {
      this.enabledRenderers.delete(rendererId);
    }
    
    return true;
  }

  /**
   * 렌더러 사용 기록
   */
  recordUsage(rendererId: string, rating?: number): void {
    const metadata = this.rendererMetadata.get(rendererId);
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
   * 렌더러 메타데이터 조회
   */
  getMetadata(rendererId: string): RendererMetadata | undefined {
    return this.rendererMetadata.get(rendererId);
  }

  /**
   * 포맷별 통계
   */
  getFormatStats(): Map<OutputFormat, FormatStats> {
    const stats = new Map<OutputFormat, FormatStats>();
    
    Array.from(this.renderers.values()).forEach(renderer => {
      const format = renderer.outputFormat;
      const existing = stats.get(format) || {
        count: 0,
        totalUsage: 0,
        averageCost: 0,
        averageRating: 0
      };
      
      const metadata = this.rendererMetadata.get(renderer.id);
      
      existing.count++;
      existing.totalUsage += metadata?.usageCount || 0;
      existing.averageCost += renderer.costPerRender;
      existing.averageRating += metadata?.averageRating || 0;
      
      stats.set(format, existing);
    });
    
    // 평균 계산
    stats.forEach((stat, format) => {
      stat.averageCost /= stat.count;
      stat.averageRating /= stat.count;
    });
    
    return stats;
  }

  /**
   * 전체 렌더러 통계
   */
  getStats(): RendererRegistryStats {
    const totalRenderers = this.renderers.size;
    const enabledRenderers = this.enabledRenderers.size;
    const formats = new Set(Array.from(this.renderers.values()).map(r => r.outputFormat));
    
    const totalUsage = Array.from(this.rendererMetadata.values())
      .reduce((sum, metadata) => sum + metadata.usageCount, 0);
    
    const averageRating = Array.from(this.rendererMetadata.values())
      .filter(metadata => metadata.averageRating > 0)
      .reduce((sum, metadata, _, arr) => sum + metadata.averageRating / arr.length, 0);
    
    return {
      totalRenderers,
      enabledRenderers,
      formatsCount: formats.size,
      totalUsage,
      averageRating
    };
  }

  /**
   * 레지스트리 초기화
   */
  clear(): void {
    this.renderers.clear();
    this.enabledRenderers.clear();
    this.rendererMetadata.clear();
    console.log('Renderer Registry cleared');
  }
}

interface RendererMetadata {
  registeredAt: string;
  usageCount: number;
  averageRating: number;
  lastUsed: string | null;
  isEnabled: boolean;
  outputFormat: OutputFormat;
}

interface FormatStats {
  count: number;
  totalUsage: number;
  averageCost: number;
  averageRating: number;
}

interface RendererRegistryStats {
  totalRenderers: number;
  enabledRenderers: number;
  formatsCount: number;
  totalUsage: number;
  averageRating: number;
}

// 싱글톤 인스턴스 생성
export const rendererRegistry = new RendererRegistry();

export default rendererRegistry; 