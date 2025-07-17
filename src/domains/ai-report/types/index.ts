/**
 * AI Report 시스템 - 핵심 타입 정의
 */

// ============================================================================
// 측정 데이터 타입
// ============================================================================

export interface MeasurementData {
  id: string;
  sessionId: string;
  organizationId?: string;
  userId: string;
  
  measurementDate: Date;
  duration: number; // 초 단위
  
  deviceInfo: {
    serialNumber: string;
    model: 'LINK_BAND_V4' | 'LINK_BAND_WELLNESS';
    firmwareVersion: string;
    batteryLevel?: number;
  };
  
  eegMetrics: EEGMetrics;
  ppgMetrics: PPGMetrics;
  accMetrics: ACCMetrics;
  dataQuality: DataQuality;
  environmentInfo?: EnvironmentInfo;
  
  processingVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EEGMetrics {
  // 주파수 밴드 파워
  delta: number; // 0.5-4 Hz
  theta: number; // 4-8 Hz
  alpha: number; // 8-13 Hz
  beta: number; // 13-30 Hz
  gamma: number; // 30-100 Hz
  
  // 파생 지표
  attentionIndex: number; // 0-100
  meditationIndex: number; // 0-100
  stressIndex: number; // 0-100
  fatigueIndex: number; // 0-100
  
  // 신호 품질
  signalQuality: number; // 0-1
  artifactRatio: number; // 0-1
  
  // 데이터 경로
  rawDataPath?: string;
  processedDataPath?: string;
}

export interface PPGMetrics {
  // 심박 관련
  heartRate: number; // BPM
  heartRateVariability: number; // RMSSD
  rrIntervals: number[]; // ms 단위
  
  // 혈압 추정
  systolicBP?: number;
  diastolicBP?: number;
  
  // 스트레스 지표
  stressScore: number; // 0-100
  autonomicBalance: number; // LF/HF ratio
  
  // 신호 품질
  signalQuality: number; // 0-1
  motionArtifact: number; // 0-1
  
  // 데이터 경로
  rawDataPath?: string;
  processedDataPath?: string;
}

export interface ACCMetrics {
  // 활동 수준
  activityLevel: number; // 0-100
  movementIntensity: number; // 0-1
  
  // 자세 정보
  posture: 'SITTING' | 'STANDING' | 'LYING' | 'MOVING' | 'UNKNOWN';
  postureStability: number; // 0-1
  
  // 움직임 패턴
  stepCount?: number;
  movementEvents: MovementEvent[];
  
  // 데이터 경로
  rawDataPath?: string;
}

export interface MovementEvent {
  timestamp: number; // measurement 시작 기준 ms
  intensity: number; // 0-1
  duration: number; // ms
}

export interface DataQuality {
  overallScore: number; // 0-100
  eegQuality: number; // 0-100
  ppgQuality: number; // 0-100
  motionInterference: number; // 0-100
  usableForAnalysis: boolean;
  qualityIssues: string[];
}

export interface EnvironmentInfo {
  ambientNoise?: number; // dB
  temperature?: number; // Celsius
  humidity?: number; // %
  lightLevel?: number; // lux
}

// ============================================================================
// AI 엔진 시스템 타입
// ============================================================================

export interface AIEngine {
  id: string;
  engineId: string;
  name: string;
  description: string;
  version: string;
  
  aiProvider: 'GEMINI' | 'CLAUDE' | 'OPENAI' | 'CUSTOM';
  modelName: string;
  
  promptTemplate: PromptTemplate;
  outputFormat: OutputFormat;
  creditCost: number;
  
  averageProcessingTime: number;
  successRate: number;
  
  restrictions: EngineRestrictions;
  accessControl: EngineAccessControl;
  
  status: 'ACTIVE' | 'DEPRECATED' | 'MAINTENANCE' | 'BETA';
  
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
  usageCount: number;
}

export interface PromptTemplate {
  systemPrompt: string;
  userPromptTemplate: string;
  requiredVariables: string[];
}

export interface OutputFormat {
  type: 'JSON' | 'MARKDOWN' | 'HTML';
  schema: any;
  validationRules: string[];
}

export interface EngineRestrictions {
  minDataQuality: number;
  requiredMetrics: string[];
  maxRetries: number;
  timeoutMs: number;
}

export interface EngineAccessControl {
  isPublic: boolean;
  allowedOrganizations: string[];
  userTypes: string[];
  subscriptionRequired?: string;
}

// ============================================================================
// 렌더러 시스템 타입
// ============================================================================

export interface ReportRenderer {
  id: string;
  rendererId: string;
  name: string;
  description: string;
  version: string;
  
  inputFormat: RendererInputFormat;
  outputFormat: RendererOutputFormat;
  renderingConfig: RenderingConfig;
  
  creditCost: number;
  accessControl: RendererAccessControl;
  
  averageRenderTime: number;
  maxFileSize: number;
  
  status: 'ACTIVE' | 'DEPRECATED' | 'MAINTENANCE' | 'BETA';
  
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
}

export interface RendererInputFormat {
  supportedEngines: string[];
  requiredJsonSchema: any;
}

export interface RendererOutputFormat {
  type: 'WEB_COMPONENT' | 'PDF' | 'DOCX' | 'EMAIL' | 'MOBILE_APP';
  mimeType: string;
  downloadable: boolean;
}

export interface RenderingConfig {
  templateEngine: 'REACT' | 'HANDLEBARS' | 'MUSTACHE' | 'CUSTOM';
  stylesheetPath?: string;
  assetsPath?: string;
  customBranding?: CustomBranding;
}

export interface CustomBranding {
  logoPath: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  fonts: string[];
}

export interface RendererAccessControl {
  isPublic: boolean;
  allowedOrganizations: string[];
  customizationLevel: 'NONE' | 'BASIC' | 'ADVANCED' | 'FULL';
}

// ============================================================================
// 리포트 인스턴스 타입
// ============================================================================

export interface ReportInstance {
  id: string;
  measurementDataId: string;
  sessionId: string;
  userId: string;
  organizationId?: string;
  
  engineId: string;
  rendererId: string;
  
  aiAnalysisResult: AIAnalysisResult;
  renderedOutput: RenderedOutput;
  costBreakdown: CostBreakdown;
  processingStatus: ProcessingStatus;
  accessControl: ReportAccessControl;
  
  viewCount: number;
  downloadCount: number;
  lastViewedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface AIAnalysisResult {
  rawOutput: any;
  parsedResult: ParsedAnalysisResult;
}

export interface ParsedAnalysisResult {
  overallScore: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  
  stressAnalysis?: any;
  focusAnalysis?: any;
  healthRiskAnalysis?: any;
  
  recommendations: string[];
  warnings: string[];
  
  confidence: number; // 0-1
  analysisVersion: string;
}

export interface RenderedOutput {
  content: string;
  contentType: string;
  downloadUrl?: string;
  fileName?: string;
  fileSize?: number;
  renderingTime: number;
  renderingVersion: string;
}

export interface CostBreakdown {
  engineCost: number;
  rendererCost: number;
  totalCost: number;
  paidBy: string;
  paymentMethod: 'ORGANIZATION_CREDIT' | 'INDIVIDUAL_CREDIT' | 'FREE_TIER';
}

export interface ProcessingStatus {
  stage: 'QUEUED' | 'AI_PROCESSING' | 'RENDERING' | 'COMPLETED' | 'FAILED';
  progress: number; // 0-100
  
  queuedAt: Date;
  aiProcessingStartedAt?: Date;
  aiProcessingCompletedAt?: Date;
  renderingStartedAt?: Date;
  renderingCompletedAt?: Date;
  
  errorMessage?: string;
  errorCode?: string;
  retryCount: number;
}

export interface ReportAccessControl {
  isPublic: boolean;
  sharedWith: string[];
  accessCode?: string;
  expiresAt?: Date;
}

// ============================================================================
// 크레딧 및 정책 타입
// ============================================================================

export interface CreditPolicy {
  id: string;
  policyType: 'ENGINE' | 'RENDERER' | 'COMBO' | 'ORGANIZATION_OVERRIDE';
  
  targetEngineId?: string;
  targetRendererId?: string;
  targetOrganizationId?: string;
  
  baseCost: number;
  discounts: Discount[];
  bundleRules?: BundleRule[];
  freeTierRules?: FreeTierRule;
  
  validFrom: Date;
  validUntil?: Date;
  
  isActive: boolean;
  priority: number;
  
  createdBy: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Discount {
  type: 'VOLUME' | 'SUBSCRIPTION' | 'PROMOTION' | 'LOYALTY';
  condition: any;
  discountRate: number; // 0-1
  maxDiscount?: number;
}

export interface BundleRule {
  engineId: string;
  rendererId: string;
  bundleCost: number;
  description: string;
}

export interface FreeTierRule {
  userType: string[];
  dailyLimit: number;
  monthlyLimit: number;
  qualityThreshold?: number;
}

// ============================================================================
// 요청/응답 타입
// ============================================================================

export interface ReportGenerationRequest {
  measurementDataId: string;
  engineId: string;
  rendererId: string;
  organizationId?: string;
  userId: string;
  
  customSettings?: {
    promptOverrides?: any;
    renderingOptions?: any;
  };
  
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

export interface ReportGenerationResponse {
  reportInstanceId: string;
  estimatedCost: CostBreakdown;
  estimatedProcessingTime: number; // ms
  queuePosition?: number;
}

export interface EngineExecutionContext {
  measurementData: MeasurementData;
  engine: AIEngine;
  customSettings?: any;
  organizationConfig?: any;
}

export interface RendererExecutionContext {
  aiResult: AIAnalysisResult;
  renderer: ReportRenderer;
  customBranding?: CustomBranding;
  organizationConfig?: any;
}

// ============================================================================
// 오류 타입
// ============================================================================

export interface AIReportError {
  code: string;
  message: string;
  stage: 'VALIDATION' | 'ENGINE_EXECUTION' | 'RENDERING' | 'STORAGE';
  details?: any;
  retryable: boolean;
}

export type AIReportErrorCode = 
  | 'INSUFFICIENT_DATA_QUALITY'
  | 'UNSUPPORTED_ENGINE'
  | 'UNSUPPORTED_RENDERER'
  | 'INSUFFICIENT_CREDITS'
  | 'ENGINE_TIMEOUT'
  | 'RENDERING_FAILED'
  | 'STORAGE_ERROR'
  | 'PERMISSION_DENIED'
  | 'RATE_LIMIT_EXCEEDED'; 

// ============================================================================
// Device Connection Types
// ============================================================================

export interface DeviceConnectionStatus {
  isConnected: boolean;
  isConnecting: boolean;
  connectionAttempts: number;
  lastConnectionAttempt?: Date;
  connectionError?: string;
  deviceInfo?: {
    name: string;
    address: string;
    rssi?: number;
    batteryLevel?: number;
  };
}

// ============================================================================
// Measurement Progress Types
// ============================================================================

export interface MeasurementProgress {
  currentPhase: 'preparing' | 'measuring' | 'processing' | 'completed';
  progressPercentage: number;
  elapsedTime: number;
  totalTime: number;
  currentActivity?: string;
  qualityMetrics?: {
    eegQuality: number;
    ppgQuality: number;
    accQuality: number;
  };
}

export interface AggregatedMeasurementData {
  sessionId: string;
  totalDuration: number;
  eegSummary: {
    averageAttention: number;
    averageMeditation: number;
    stressLevel: number;
    qualityScore: number;
  };
  ppgSummary: {
    averageHeartRate: number;
    heartRateVariability: number;
    qualityScore: number;
  };
  accSummary: {
    movementLevel: number;
    stabilityScore: number;
    qualityScore: number;
  };
  overallQuality: number;
  timestamp: Date;
} 