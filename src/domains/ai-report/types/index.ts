// AI Health Report 기본 타입 정의

export interface PersonalInfo {
  name: string;
  gender: 'male' | 'female' | 'other';
  birthDate: string; // YYYY-MM-DD 형식
  occupation: string;
  workConcerns: string; // 직업상 평소 고민이 되는점 (AI Health Report에서 집중적으로 파악하고 싶은 내용)
}

export interface DeviceConnectionStatus {
  isConnected: boolean;
  deviceName?: string;
  batteryLevel?: number;
  signalStrength?: number;
}

export interface DataQualityMetrics {
  eegQuality: number; // SQI percentage
  ppgQuality: number; // SQI percentage  
  accQuality: number; // Signal quality percentage
  overallQuality: number; // Average quality
}

export interface MeasurementProgress {
  isActive: boolean;
  startTime?: Date;
  duration: number; // seconds
  targetDuration: number; // 60 seconds
  progress: number; // 0-100 percentage
}

export interface AggregatedMeasurementData {
  eegSummary: EEGSummary;
  ppgSummary: PPGSummary;
  accSummary: ACCSummary;
  qualitySummary: QualitySummary;
  measurementInfo: MeasurementInfo;
}

export interface EEGSummary {
  // 주파수 밴드 파워 (11개)
  deltaPower: number;
  thetaPower: number;
  alphaPower: number;
  betaPower: number;
  gammaPower: number;
  
  // 분석 지표들
  focusIndex: number;
  relaxationIndex: number;
  stressIndex: number;
  hemisphericBalance: number;
  cognitiveLoad: number;
  emotionalStability: number;
  attentionLevel: number;
  meditationLevel: number;
  
  // 품질 지표
  averageSQI: number;
  dataCount: number;
}

export interface PPGSummary {
  // 심박 관련 (14개)
  heartRate: number;
  hrv: number;
  rmssd: number;
  pnn50: number;
  stressLevel: number;
  recoveryIndex: number;
  autonomicBalance: number;
  cardiacCoherence: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  perfusionIndex: number;
  vascularTone: number;
  cardiacEfficiency: number;
  metabolicRate: number;
  
  // 품질 지표
  averageSQI: number;
  dataCount: number;
}

export interface ACCSummary {
  // 활동 관련 (5개)
  activityLevel: number;
  motionPattern: number;
  posturalStability: number;
  movementQuality: number;
  energyExpenditure: number;
  
  // 품질 지표
  averageQuality: number;
  dataCount: number;
}

export interface QualitySummary {
  totalDataPoints: number;
  highQualityDataPoints: number;
  qualityPercentage: number;
  measurementReliability: 'high' | 'medium' | 'low';
}

export interface MeasurementInfo {
  startTime: Date;
  endTime: Date;
  duration: number; // seconds
  environment?: string;
  notes?: string;
}

export interface AIAnalysisRequest {
  personalInfo: PersonalInfo;
  measurementData: AggregatedMeasurementData;
  timestamp: Date;
}

export interface AIAnalysisResponse {
  reportId: string;
  personalInfo: PersonalInfo;
  analysisResults: {
    mentalHealthScore: number;
    physicalHealthScore: number;
    stressLevel: number;
    recommendations: string[];
    detailedAnalysis: string;
  };
  generatedAt: Date;
  reliability: 'high' | 'medium' | 'low';
}

// 앱 상태 관리용 타입
export type AIReportStep = 
  | 'personal-info'
  | 'device-connection'
  | 'data-quality'
  | 'measurement'
  | 'analysis'
  | 'report';

export interface AIReportState {
  currentStep: AIReportStep;
  personalInfo?: PersonalInfo;
  deviceStatus: DeviceConnectionStatus;
  dataQuality: DataQualityMetrics;
  measurementProgress: MeasurementProgress;
  measurementData?: AggregatedMeasurementData;
  analysisResult?: AIAnalysisResponse;
  error?: string;
} 