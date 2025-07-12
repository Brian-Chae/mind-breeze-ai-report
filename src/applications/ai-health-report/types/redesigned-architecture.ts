/**
 * AI Health Report 재설계된 아키텍처 타입 시스템
 * 
 * 구조:
 * 1차: 생체신호 상세 분석 (EEG, PPG)
 * 2차: 정신건강 위험도 분석 (우울, ADHD, 번아웃, 충동성, 스트레스)
 * 3차: 종합 분석 (전체 통합)
 */

// ============================================================================
// 표준화된 점수 체계
// ============================================================================

export type ScoreGrade = 'excellent' | 'good' | 'normal' | 'borderline' | 'attention';

export interface StandardizedScore {
  raw: number; // 원본 점수
  standardized: number; // 0-100 표준화 점수
  percentile: number; // 백분위수 (0-100)
  grade: ScoreGrade; // 5단계 등급
  gradeDescription: string; // 등급 설명
  ageGenderAdjusted: boolean; // 성별/나이 보정 여부
}

export interface ScoreDistribution {
  excellent: { min: number; max: number }; // 95-100% (상위 5%)
  good: { min: number; max: number }; // 75-95% (상위 25%)
  normal: { min: number; max: number }; // 25-75% (중간 50%)
  borderline: { min: number; max: number }; // 5-25% (하위 25%)
  attention: { min: number; max: number }; // 0-5% (하위 5%)
}

export interface DemographicNorms {
  gender: 'male' | 'female';
  ageGroup: '20-29' | '30-39' | '40-49' | '50-59' | '60+';
  mean: number;
  standardDeviation: number;
  sampleSize: number;
}

// ============================================================================
// 공통 타입
// ============================================================================

export interface ClinicalFindings {
  summary: string;
  keyFindings: string[];
  clinicalSignificance: string;
  recommendations: string[];
  followUpNeeded: boolean;
}

export interface QualityMetrics {
  score: number; // 0-100
  reliability: 'excellent' | 'good' | 'fair' | 'poor';
  artifactLevel: number; // 0-1
  signalToNoiseRatio: number;
  issues: string[];
}

// ============================================================================
// 1차: EEG 상세 분석
// ============================================================================

export interface EEGSignalQuality extends QualityMetrics {
  channelQuality: {
    ch1: QualityMetrics;
    ch2: QualityMetrics;
  };
  impedanceStatus: 'optimal' | 'acceptable' | 'poor';
  movementArtifacts: number; // 0-1
  eyeBlinkArtifacts: number; // 0-1
}

export interface FrequencyBandAnalysis {
  delta: BandPowerMetrics; // 0.5-4 Hz
  theta: BandPowerMetrics; // 4-8 Hz
  alpha: BandPowerMetrics; // 8-13 Hz
  beta: BandPowerMetrics; // 13-30 Hz
  gamma: BandPowerMetrics; // 30-100 Hz
  totalPower: number;
  dominantFrequency: number;
  spectralEntropy: number;
}

export interface BandPowerMetrics {
  absolutePower: number;
  relativePower: number; // 0-1
  peakFrequency: number;
  bandwidth: number;
  asymmetry: number; // -1 to 1 (left-right hemisphere)
  coherence: number; // 0-1
}

export interface TemporalPatternAnalysis {
  rhythmicity: number; // 0-1
  stationarity: number; // 0-1
  complexity: number; // 0-1
  synchronization: number; // 0-1
  burstiness: number; // 0-1
  variability: number; // 0-1
}

export interface ArtifactAnalysis {
  muscularArtifacts: number; // 0-1
  eyeMovementArtifacts: number; // 0-1
  cardiacArtifacts: number; // 0-1
  lineNoiseArtifacts: number; // 0-1
  overallArtifactLevel: number; // 0-1
  cleanDataPercentage: number; // 0-100
}

export interface EEGDetailedAnalysis {
  signalQuality: EEGSignalQuality;
  frequencyAnalysis: FrequencyBandAnalysis;
  temporalAnalysis: TemporalPatternAnalysis;
  artifactDetection: ArtifactAnalysis;
  clinicalInterpretation: ClinicalFindings;
  
  // 🆕 표준화된 지표들
  focusIndex: StandardizedScore;
  relaxationIndex: StandardizedScore;
  cognitiveLoad: StandardizedScore;
  emotionalStability: StandardizedScore;
  hemisphericBalance: StandardizedScore;
  
  // 🆕 전체 EEG 건강 점수
  overallEEGScore: StandardizedScore;
  
  // 메타데이터
  analysisTimestamp: number;
  dataQualityScore: number; // 0-100
  confidence: number; // 0-1
}

// ============================================================================
// 1차: PPG 상세 분석
// ============================================================================

export interface PPGSignalQuality extends QualityMetrics {
  pulseDetectionAccuracy: number; // 0-1
  baselineStability: number; // 0-1
  signalAmplitude: number;
  noiseLevel: number;
}

export interface HRVAnalysis {
  timeDomain: {
    rmssd: number; // ms
    sdnn: number; // ms
    pnn50: number; // %
    meanHR: number; // bpm
    hrVariability: number; // coefficient of variation
  };
  frequencyDomain: {
    lfPower: number; // ms²
    hfPower: number; // ms²
    lfHfRatio: number;
    totalPower: number; // ms²
    vlf: number; // ms²
  };
  nonLinear: {
    sd1: number;
    sd2: number;
    sd1Sd2Ratio: number;
    sampleEntropy: number;
    dfa: number; // Detrended Fluctuation Analysis
  };
}

export interface PulseWaveMetrics {
  pulseRate: number; // bpm
  pulseAmplitude: number;
  riseTime: number; // ms
  fallTime: number; // ms
  pulseWidth: number; // ms
  dicroticNotch: boolean;
  arterialStiffness: number; // 0-1
}

export interface CardiovascularHealth {
  autonomicBalance: number; // 0-1 (0=sympathetic, 1=parasympathetic)
  stressResponse: number; // 0-1
  recoveryCapacity: number; // 0-1
  cardiovascularRisk: 'low' | 'moderate' | 'high';
  fitnessLevel: 'poor' | 'fair' | 'good' | 'excellent';
}

export interface PPGDetailedAnalysis {
  signalQuality: PPGSignalQuality;
  heartRateVariability: HRVAnalysis;
  pulseWaveAnalysis: PulseWaveMetrics;
  cardiovascularMetrics: CardiovascularHealth;
  clinicalInterpretation: ClinicalFindings;
  
  // 🆕 표준화된 지표들
  heartRateScore: StandardizedScore;
  hrvScore: StandardizedScore;
  autonomicBalanceScore: StandardizedScore;
  cardiovascularFitnessScore: StandardizedScore;
  
  // 🆕 전체 PPG 건강 점수
  overallPPGScore: StandardizedScore;
  
  // 메타데이터
  analysisTimestamp: number;
  dataQualityScore: number; // 0-100
  confidence: number; // 0-1
}

// ============================================================================
// 2차: 정신건강 위험도 분석
// ============================================================================

export interface RiskAssessment {
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  score: StandardizedScore; // 🆕 표준화된 점수
  confidence: number; // 0-1
  indicators: string[];
  clinicalNotes: string;
  severity: 'mild' | 'moderate' | 'severe';
  urgency: 'routine' | 'priority' | 'urgent';
}

export interface DepressionRiskAssessment extends RiskAssessment {
  moodIndicators: {
    lowMoodSigns: string[];
    anhedoniaIndicators: string[];
    energyLevelMarkers: string[];
    cognitiveSymptoms: string[];
  };
  neurobiologicalMarkers: {
    alphaAsymmetry: number; // frontal alpha asymmetry
    betaActivity: number;
    hrvReduction: number;
  };
}

export interface ADHDFocusRiskAssessment extends RiskAssessment {
  attentionIndicators: {
    focusStability: number; // 0-1
    distractibility: number; // 0-1
    taskPersistence: number; // 0-1
    cognitiveFlexibility: number; // 0-1
  };
  neurobiologicalMarkers: {
    thetaBetaRatio: number;
    frontolimbicActivity: number;
    executiveFunctionMarkers: number;
  };
}

export interface BurnoutRiskAssessment extends RiskAssessment {
  burnoutDimensions: {
    emotionalExhaustion: number; // 0-1
    depersonalization: number; // 0-1
    personalAccomplishment: number; // 0-1
    cynicism: number; // 0-1
  };
  physiologicalMarkers: {
    chronicStressIndicators: number;
    autonomicImbalance: number;
    recoveryCapacity: number;
  };
}

export interface ImpulsivityRiskAssessment extends RiskAssessment {
  impulsivityTypes: {
    motorImpulsivity: number; // 0-1
    cognitiveImpulsivity: number; // 0-1
    nonPlanningImpulsivity: number; // 0-1
  };
  neurobiologicalMarkers: {
    prefrontalActivity: number;
    inhibitoryControl: number;
    rewardSensitivity: number;
  };
}

export interface StressRiskAssessment extends RiskAssessment {
  stressTypes: {
    acuteStress: number; // 0-1
    chronicStress: number; // 0-1
    traumaticStress: number; // 0-1
  };
  physiologicalMarkers: {
    cortisol: number;
    autonomicActivation: number;
    inflammatoryResponse: number;
  };
  // 기존 스트레스 분석 호환성 (표준화된 점수로 변경)
  stressIndex: StandardizedScore;
  autonomicBalance: StandardizedScore;
  fatigueLevel: StandardizedScore;
  resilience: StandardizedScore;
}

export interface MentalHealthRecommendations {
  immediate: {
    lifestyle: string[];
    exercise: string[];
    mindfulness: string[];
    sleep: string[];
  };
  shortTerm: {
    behavioralChanges: string[];
    stressManagement: string[];
    socialSupport: string[];
    professionalHelp: string[];
  };
  longTerm: {
    mentalCare: string[];
    preventiveMeasures: string[];
    monitoringPlan: string[];
    treatmentOptions: string[];
  };
  occupationSpecific: {
    workplaceStrategies: string[];
    timeManagement: string[];
    boundarySettings: string[];
    careerGuidance: string[];
  };
}

export interface MentalHealthRiskAnalysis {
  // 개별 위험도 평가
  depressionRisk: DepressionRiskAssessment;
  adhdFocusRisk: ADHDFocusRiskAssessment;
  burnoutRisk: BurnoutRiskAssessment;
  impulsivityRisk: ImpulsivityRiskAssessment;
  stressRisk: StressRiskAssessment;
  
  // 🆕 전체 정신건강 점수 (표준화)
  overallMentalHealthScore: StandardizedScore;
  
  // 위험 요소 및 보호 요소
  riskFactors: string[];
  protectiveFactors: string[];
  
  // 종합 권고사항
  recommendations: MentalHealthRecommendations;
  
  // 메타데이터
  analysisTimestamp: number;
  confidence: number; // 0-1
  clinicalValidation: boolean;
}

// ============================================================================
// 3차: 종합 분석 (기존과 호환)
// ============================================================================

export interface ComprehensiveAnalysisResult {
  // 1차 분석 결과
  eegDetailedAnalysis: EEGDetailedAnalysis;
  ppgDetailedAnalysis: PPGDetailedAnalysis;
  
  // 2차 분석 결과
  mentalHealthRiskAnalysis: MentalHealthRiskAnalysis;
  
  // 🆕 표준화된 전체 건강 점수
  overallHealth: {
    score: StandardizedScore; // 🆕 표준화된 점수
    grade: ScoreGrade; // 🆕 5단계 등급
    summary: string;
    percentileRank: string; // "상위 15%", "중간 60%" 등
  };
  
  detailedAnalysis: {
    mentalHealth: {
      score: StandardizedScore; // 🆕 표준화된 점수
      analysis: string;
    };
    physicalHealth: {
      score: StandardizedScore; // 🆕 표준화된 점수
      analysis: string;
    };
    stressLevel: {
      level: string;
      score: StandardizedScore; // 🆕 표준화된 점수
      analysis: string;
    };
    // 새로운 의학적 위험도 분석
    medicalRiskAnalysis?: any;
  };
  
  problemAreas: Array<{
    category: string;
    description: string;
    severity: 'low' | 'moderate' | 'high';
    priority: number; // 🆕 우선순위 점수 (1-10)
  }>;
  
  recommendations?: Array<{
    category: string;
    suggestion: string;
    priority: 'low' | 'medium' | 'high';
    evidenceLevel: 'strong' | 'moderate' | 'weak'; // 🆕 근거 수준
  }>;
  
  personalizedRecommendations?: any; // 기존 구조 유지
  
  // 🆕 성별/나이별 비교 정보
  demographicComparison: {
    yourGender: 'male' | 'female';
    yourAgeGroup: string;
    comparedToSameDemo: string; // "같은 연령대 남성 대비 상위 25%"
    nationalAverage: string; // "전국 평균 대비 15% 높음"
  };
  
  // 메타데이터
  analysisTimestamp: number;
  version: string;
  confidence: number;
}

// ============================================================================
// 🆕 표준화 점수 계산 유틸리티 타입
// ============================================================================

export interface ScoreNormalizationConfig {
  demographicNorms: DemographicNorms[];
  scoreDistribution: ScoreDistribution;
  validationRules: {
    minSampleSize: number;
    confidenceLevel: number;
    outlierThreshold: number;
  };
}

// ============================================================================
// 서비스 인터페이스
// ============================================================================

export interface EEGDetailedAnalysisService {
  analyzeEEGSignal(data: any, personalInfo: any): Promise<EEGDetailedAnalysis>;
}

export interface PPGDetailedAnalysisService {
  analyzePPGSignal(data: any, personalInfo: any): Promise<PPGDetailedAnalysis>;
}

export interface MentalHealthRiskAnalysisService {
  assessMentalHealthRisks(
    eegAnalysis: EEGDetailedAnalysis,
    ppgAnalysis: PPGDetailedAnalysis,
    personalInfo: any
  ): Promise<MentalHealthRiskAnalysis>;
  
  assessDepressionRisk(eegAnalysis: EEGDetailedAnalysis, ppgAnalysis: PPGDetailedAnalysis): Promise<DepressionRiskAssessment>;
  assessADHDRisk(eegAnalysis: EEGDetailedAnalysis, ppgAnalysis: PPGDetailedAnalysis): Promise<ADHDFocusRiskAssessment>;
  assessBurnoutRisk(eegAnalysis: EEGDetailedAnalysis, ppgAnalysis: PPGDetailedAnalysis): Promise<BurnoutRiskAssessment>;
  assessImpulsivityRisk(eegAnalysis: EEGDetailedAnalysis, ppgAnalysis: PPGDetailedAnalysis): Promise<ImpulsivityRiskAssessment>;
  assessStressRisk(eegAnalysis: EEGDetailedAnalysis, ppgAnalysis: PPGDetailedAnalysis): Promise<StressRiskAssessment>;
}

export interface RedesignedComprehensiveAnalysisService {
  generateComprehensiveReport(
    eegAnalysis: EEGDetailedAnalysis,
    ppgAnalysis: PPGDetailedAnalysis,
    mentalHealthRisk: MentalHealthRiskAnalysis,
    personalInfo: any,
    measurementData: any
  ): Promise<ComprehensiveAnalysisResult>;
}

// 🆕 표준화 점수 계산 서비스
export interface ScoreNormalizationService {
  normalizeScore(
    rawScore: number,
    metric: string,
    gender: 'male' | 'female',
    age: number
  ): Promise<StandardizedScore>;
  
  getScoreGrade(percentile: number): ScoreGrade;
  getGradeDescription(grade: ScoreGrade): string;
  getDemographicNorms(metric: string, gender: 'male' | 'female', age: number): DemographicNorms;
} 