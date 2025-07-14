/**
 * AI Health Report 애플리케이션 전용 타입 정의
 */

export type OccupationType = 
  | 'teacher'             // 교사
  | 'military_medic'      // 의무병사
  | 'military_career'     // 직업군인
  | 'elementary'          // 초등학생
  | 'middle_school'       // 중학생
  | 'high_school'         // 고등학생
  | 'university'          // 대학생
  | 'housewife'           // 전업주부
  | 'parent'              // 학부모
  | 'firefighter'         // 소방공무원
  | 'police'              // 경찰공무원
  | 'developer'           // 개발자
  | 'designer'            // 디자이너
  | 'office_worker'       // 일반 사무직
  | 'manager'             // 관리자
  | 'general_worker'      // 일반 직장인
  | 'entrepreneur'        // 사업가
  | 'other'               // 그외
  | '';

export interface PersonalInfo {
  name: string;
  gender: 'male' | 'female' | 'other' | '';
  birthDate: string; // YYYY-MM-DD 형식 (호환성 유지)
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  age: number;
  occupation: OccupationType;
  customOccupation?: string; // "그외" 선택 시 사용자 입력값
  healthStatus?: 'good' | 'fair' | 'poor';
}

// 메트릭 값과 의료적 맥락 정보를 포함하는 구조
interface MetricWithContext {
  value: number;
  normalRange: string;
  interpretation: string;
  formula: string;
  unit: string;
  clinicalMeaning: {
    belowNormal: string;  // 정상 범위 미만일 때의 의미
    withinNormal: string; // 정상 범위 내일 때의 의미  
    aboveNormal: string;  // 정상 범위 초과일 때의 의미
  };
}

export interface EEGMetrics {
  focusIndex: MetricWithContext;
  relaxationIndex: MetricWithContext;
  stressIndex: MetricWithContext;
  cognitiveLoad: MetricWithContext;
  emotionalStability: MetricWithContext;
  hemisphericBalance: MetricWithContext;
  totalPower: MetricWithContext;
}

export interface PPGMetrics {
  heartRate: MetricWithContext;
  rmssd: MetricWithContext;
  sdnn: MetricWithContext;
  pnn50: MetricWithContext;
  spo2: MetricWithContext;
  lfPower: MetricWithContext;
  hfPower: MetricWithContext;
  lfHfRatio: MetricWithContext;
}

export interface ACCMetrics {
  stability: number;
  intensity: number;
  averageMovement: number;
  maxMovement: number;
  tremor: number;
  postureStability: number;
}

export interface MeasurementData {
  personalInfo: PersonalInfo;
  duration: number; // 실제 측정 시간 (초)
  eegData: number[][];
  ppgData: { red: number[]; ir: number[] };
  accData: { x: number[]; y: number[]; z: number[] };
  // 분석된 메트릭 데이터
  eegMetrics: EEGMetrics;
  ppgMetrics: PPGMetrics;
  accMetrics: ACCMetrics;
  timestamp: number;
  signalQuality: {
    eeg: number;
    ppg: number;
    acc: number;
    overall: number;
  };
}

export interface AIAnalysisResult {
  // 새로운 분석 결과 구조
  overallHealth: {
    score: number;
    grade: string;
    summary: string;
    detailedComprehensiveSummary?: string; // 상세 분석 결과용 별도 요약
    keyFindings: string[];
    riskFactors: string[];
    strengths: string[];
  };
  
  detailedAnalysis: {
    mentalHealth: {
      score: number;
      status: string;
      analysis: string;
      keyMetrics: {
        concentration: string;
        relaxation: string;
        brainBalance: string;
        cognitiveLoad: string;
      };
      immediateActions: string[];
      shortTermGoals: string[];
      longTermStrategy: string[];
      recommendations?: string[]; // 호환성 유지
    };
    physicalHealth: {
      score: number;
      status: string;
      analysis: string;
      keyMetrics: {
        heartRate: string;
        hrv: string;
        oxygenSaturation: string;
        autonomicBalance: string;
      };
      immediateActions: string[];
      shortTermGoals: string[];
      longTermStrategy: string[];
      recommendations?: string[]; // 호환성 유지
    };
    stressLevel: {
      score: number;
      level: string;
      analysis: string;
      stressType: string;
      stressSources: string[];
      physiologicalImpact: string;
      immediateActions: string[];
      shortTermGoals: string[];
      longTermStrategy: string[];
      recommendations?: string[]; // 호환성 유지
    };
    mentalHealthRisk?: {
      depression: {
        riskScore: number;
        normalRange: string;
        status: string;
        analysis: string;
      };
      adhd: {
        riskScore: number;
        normalRange: string;
        status: string;
        analysis: string;
      };
      burnout: {
        riskScore: number;
        normalRange: string;
        status: string;
        analysis: string;
      };
      impulsivity: {
        riskScore: number;
        normalRange: string;
        status: string;
        analysis: string;
      };
      professionalRecommendations: string;
    };
    medicalRiskAnalysis?: {
      biosignalIntegration: {
        eegMedicalInterpretation: {
          alphaActivity: string;
          betaPattern: string;
          gammaSync: string;
          medicalFindings: string;
        };
        ppgMedicalInterpretation: {
          hrv: string;
          vascularElasticity: string;
          autonomicBalance: string;
          medicalFindings: string;
        };
      };
      pathologicalRiskFactors: {
        neurologicalRisk: {
          riskScore: number;
          description: string;
        };
        cardiovascularRisk: {
          riskScore: number;
          description: string;
        };
        metabolicSyndromeRisk: {
          riskScore: number;
          description: string;
        };
      };
      clinicalRecommendations: {
        preventiveMedicine: {
          regularCheckups: string;
          lifestyleModifications: string;
          stressManagement: string;
        };
        medicalConsultation: {
          urgency: 'immediate' | 'preventive' | 'maintenance';
          recommendations: string[];
          followUpPlan: string;
        };
        scientificEvidence: string;
      };
    };
  };
  
  problemAreas: Array<{
    area: string;
    severity: string;
    description: string;
    solutions: string[];
  }>;
  
  personalizedRecommendations: {
    immediate: {
      lifestyle: string[];
      exercise: string[];
      breathing: string[];
      posture: string[];
    };
    shortTerm: {
      lifestyle: string[];
      exercise: string[];
      diet: string[];
      sleep: string[];
      stressManagement: string[];
    };
    longTerm: {
      lifestyle: string[];
      exercise: string[];
      mentalCare: string[];
      socialSupport: string[];
      professionalHelp: string[];
    };
    occupationSpecific: {
      workplaceStrategies: string[];
      timeManagement: string[];
      environmentalChanges: string[];
      colleagueInteraction: string[];
    };
  };
  
  supportResources: {
    professionalHelp: Array<{
      type: string;
      when: string;
      how: string;
      cost: string;
      accessibility: string;
    }>;
    onlineResources: string[];
    communitySupport: string[];
    emergencyContacts: string[];
  };
  
  followUpPlan: {
    remeasurement: {
      schedule: string;
      keyMetrics: string;
      improvementTargets: string;
    };
    progressTracking: {
      dailyChecks: string[];
      weeklyReviews: string[];
      monthlyAssessments: string[];
    };
    milestones: Array<{
      timeframe: string;
      goals: string;
      successCriteria: string;
    }>;
    adjustmentTriggers: string[];
  };
  
  followUpActions?: string[]; // 호환성 유지
  
  // 메타데이터
  timestamp: number;
  qualityScore: number; // 측정 데이터 품질 점수 (0-100)
  personalInfo: PersonalInfo;
  measurementData: MeasurementData;
  metadata: {
    modelUsed: string;
    promptTokens: number;
    responseTokens: number;
    totalTokens: number;
  };
  
  // 기존 구조 호환성 유지 (옵션)
  personalContext?: {
    ageGroup: string;
    genderConsiderations: string;
    personalizedMessage: string;
  };
  
  // 기존 구조 호환성 유지 (옵션)
  overallAssessment?: {
    mentalHealthScore: number;
    stressLevel: string;
    attentionState: string;
    emotionalStability: string;
    personalizedInterpretation: string;
  };
  
  recommendations?: {
    immediate: string[];
    mediumTerm: string[];
    professionalConsultation: boolean;
    followUpRecommended: boolean;
  };
  
  limitations?: string[];
  confidence?: number;
}

export interface HealthReport {
  id: string;
  timestamp: number;
  personalInfo: PersonalInfo;
  measurementData: MeasurementData;
  aiAnalysis: AIAnalysisResult;
  voiceFile?: string; // Base64 encoded audio
  reportPdf?: string; // Base64 encoded PDF
}

export interface MeasurementSession {
  id: string;
  startTime: number;
  duration: number;
  personalInfo: PersonalInfo;
  isActive: boolean;
  currentData: Partial<MeasurementData>;
  qualityChecks: {
    connectionStatus: boolean;
    sensorContact: boolean;
    signalQuality: boolean;
  };
}

export type MeasurementPhase = 
  | 'setup'           // 개인정보 입력
  | 'preparation'     // 측정 준비 (연결 확인)
  | 'measuring'       // 측정 중
  | 'analyzing'       // AI 분석 중
  | 'results'         // 결과 표시
  | 'completed';      // 완료

export interface MeasurementState {
  phase: MeasurementPhase;
  progress: number; // 0-100
  timeRemaining: number; // 초 단위
  currentSession?: MeasurementSession;
  error?: string;
} 