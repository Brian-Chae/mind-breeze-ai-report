/**
 * AI 엔진 인터페이스
 * 다양한 AI 모델들이 구현해야 하는 공통 인터페이스
 */

export interface MeasurementDataType {
  eeg: boolean;
  ppg: boolean;
  acc: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  qualityScore: number; // 0-100
}

export interface AnalysisOptions {
  includeDetailedMetrics?: boolean;
  customPrompt?: string;
  outputLanguage?: 'ko' | 'en';
  analysisDepth?: 'basic' | 'detailed' | 'comprehensive';
}

export interface AnalysisResult {
  engineId: string;
  engineVersion: string;
  timestamp: string;
  analysisId: string;
  
  // 분석 결과
  overallScore: number; // 0-100
  stressLevel: number; // 0-100
  focusLevel: number; // 0-100
  
  // 상세 분석
  insights: {
    summary: string;
    detailedAnalysis: string;
    recommendations: string[];
    warnings: string[];
  };
  
  // 생체 지표
  metrics: {
    eeg?: {
      alpha: number;
      beta: number;
      gamma: number;
      theta: number;
      delta: number;
    };
    ppg?: {
      heartRate: number;
      hrv: number;
      stressIndex: number;
    };
    acc?: {
      movementLevel: number;
      stability: number;
    };
  };
  
  // 메타 정보
  processingTime: number; // ms
  costUsed: number; // credits
  rawData?: any; // 원본 AI 응답 (디버깅용)
}

export interface EngineCapabilities {
  supportedLanguages: string[];
  maxDataDuration: number; // seconds
  minDataQuality: number; // 0-100
  supportedOutputFormats: string[];
  realTimeProcessing: boolean;
}

export interface IAIEngine {
  // 기본 정보
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly provider: string; // 'gemini' | 'openai' | 'claude' | 'custom'
  
  // 지원 기능
  readonly supportedDataTypes: MeasurementDataType;
  readonly costPerAnalysis: number; // credits
  readonly capabilities: EngineCapabilities;
  
  // 필수 메서드
  validate(data: any): Promise<ValidationResult>;
  analyze(data: any, options?: AnalysisOptions): Promise<AnalysisResult>;
  
  // 선택적 메서드
  getHealthMetrics?(): string[];
  getRecommendationCategories?(): string[];
  getSamplePrompts?(): string[];
}

export default IAIEngine; 