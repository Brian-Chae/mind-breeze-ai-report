/**
 * 리포트 렌더러 인터페이스
 * 다양한 출력 형식으로 리포트를 렌더링하는 공통 인터페이스
 */

import { AnalysisResult } from './IAIEngine';

export type OutputFormat = 'web' | 'pdf' | 'json' | 'email' | 'ppt' | 'word';

export interface RenderOptions {
  // 브랜딩
  organizationLogo?: string;
  organizationName?: string;
  brandColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  
  // 콘텐츠 옵션
  includeRawData?: boolean;
  includeCharts?: boolean;
  includeRecommendations?: boolean;
  language?: 'ko' | 'en';
  
  // 포맷별 옵션
  pdfOptions?: {
    pageSize: 'A4' | 'Letter';
    orientation: 'portrait' | 'landscape';
    includeWatermark?: boolean;
  };
  
  webOptions?: {
    theme: 'light' | 'dark' | 'auto';
    interactive?: boolean;
    responsive?: boolean;
  };
  
  emailOptions?: {
    subject?: string;
    recipientName?: string;
    includeAttachment?: boolean;
  };
}

export interface RenderedReport {
  rendererId: string;
  rendererVersion: string;
  timestamp: string;
  reportId: string;
  
  // 출력 결과
  format: OutputFormat;
  content: string | Buffer | Blob; // 포맷에 따라 다름
  mimeType: string;
  
  // 메타 정보
  fileSize: number; // bytes
  renderTime: number; // ms
  costUsed: number; // credits
  
  // 접근 정보
  downloadUrl?: string;
  expiresAt?: string;
  accessToken?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  previewUrl?: string;
  sections: TemplateSection[];
  supportedFormats: OutputFormat[];
}

export interface TemplateSection {
  id: string;
  name: string;
  type: 'header' | 'summary' | 'charts' | 'analysis' | 'recommendations' | 'footer';
  required: boolean;
  customizable: boolean;
  defaultContent?: string;
}

export interface RendererCapabilities {
  supportedFormats: OutputFormat[];
  supportedLanguages: string[];
  maxContentSize: number; // bytes
  supportsInteractivity: boolean;
  supportsBranding: boolean;
  supportsCharts: boolean;
}

export interface IReportRenderer {
  // 기본 정보
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly outputFormat: OutputFormat;
  
  // 비용 및 기능
  readonly costPerRender: number; // credits
  readonly capabilities: RendererCapabilities;
  readonly supportedEngines: string[]; // 지원하는 AI 엔진 ID 목록
  
  // 필수 메서드
  render(analysis: AnalysisResult, options?: RenderOptions): Promise<RenderedReport>;
  validateAnalysis(analysis: AnalysisResult): Promise<boolean>;
  getTemplate(): ReportTemplate;
  
  // 선택적 메서드
  generatePreview?(analysis: AnalysisResult, options?: RenderOptions): Promise<string>;
  getSupportedBrandingOptions?(): string[];
  getDefaultRenderOptions?(): RenderOptions;
}

export default IReportRenderer; 