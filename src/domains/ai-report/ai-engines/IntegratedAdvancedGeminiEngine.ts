/**
 * 통합 고급 분석 엔진
 * EEG와 PPG 분석 결과를 통합하여 종합적인 건강 리포트를 생성
 */

import { IAIEngine, AnalysisResult, ValidationResult } from '../core/interfaces/IAIEngine';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';

// 개인 정보 인터페이스
export interface PersonalInfo {
  age: number;
  gender: 'male' | 'female' | 'other';
  occupation?: string;
  lifestyle?: {
    sleepHours?: number;
    exerciseFrequency?: string;
    stressLevel?: string;
  };
}

// 통합 분석 입력 인터페이스
export interface IntegratedAnalysisInput {
  eegAnalysis?: any; // EEGAdvancedAnalysisResult
  ppgAnalysis?: any; // PPGAdvancedAnalysisResult
  personalInfo: PersonalInfo;
  metadata: {
    measurementDuration: number;
    measurementTime: string;
    deviceInfo?: any;
  };
}

// 액션 아이템 인터페이스
export interface ActionItem {
  category: 'lifestyle' | 'exercise' | 'mental' | 'medical' | 'work';
  action: string;
  expectedBenefit: string;
  priority: 'high' | 'medium' | 'low';
  timeframe: string;
}

// 통합 분석 결과 인터페이스
export interface IntegratedAnalysisResult {
  // 전체 요약
  overallSummary: {
    healthScore: number; // 0-100
    mainFindings: string[];
    urgentIssues: string[];
    positiveAspects: string[];
  };
  
  // EEG 분석 요약
  eegSummary?: {
    overallScore: number;
    keyFindings: string[];
    dimensionScores: {
      emotionalBalance: number;
      brainFocus: number;
      brainArousal: number;
      stressLevel: number;
    };
  };
  
  // PPG 분석 요약
  ppgSummary?: {
    overallScore: number;
    keyFindings: string[];
    axisScores: {
      stressHealth: number;
      autonomicHealth: number;
      hrvHealth: number;
    };
  };
  
  // 맞춤형 분석
  personalizedAnalysis: {
    ageGenderAnalysis: {
      comparison: string;
      risks: string[];
      recommendations: string[];
    };
    occupationAnalysis?: {
      workStressImpact: string;
      occupationalRisks: string[];
      workLifeBalance: string[];
    };
  };
  
  // 개선 방향
  improvementPlan: {
    immediate: ActionItem[];
    shortTerm: ActionItem[]; // 1-4주
    longTerm: ActionItem[];  // 1-3개월
  };
  
  // 의료 권고
  medicalRecommendations?: {
    consultationNeeded: boolean;
    specialties: string[];
    urgency: 'immediate' | 'soon' | 'routine';
  };
  
  // 메타데이터
  metadata: {
    analysisDate: string;
    engineVersion: string;
    processingTime: number;
    dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  };
}

export class IntegratedAdvancedGeminiEngine implements IAIEngine {
  id = 'integrated-advanced-gemini-v1';
  name = '통합 고급 분석 (Gemini)';
  description = 'EEG와 PPG 데이터를 종합하여 심층적인 건강 분석 제공';
  provider = 'gemini';
  version = '1.0.0';
  supportedDataTypes = { eeg: true, ppg: true, acc: false };
  
  capabilities = {
    realTimeProcessing: false,
    batchProcessing: true,
    multilingual: true,
    customization: true,
    explainability: true,
    confidenceScores: true,
    maxDataDuration: 3600,
    supportedLanguages: ['ko', 'en'],
    minDataQuality: 0.6,
    supportedOutputFormats: ['json', 'text']
  };
  
  costPerAnalysis = 0.015; // 종합 분석이므로 비용이 더 높음

  recommendedRenderers = ['integrated-analysis-viewer'];

  private model: GenerativeModel | null = null;
  private isInitialized = false;
  
  async initialize(): Promise<void> {
    console.log('🚀 IntegratedAdvancedGeminiEngine 초기화 중...');
    
    const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ Gemini API 키가 없습니다. Mock 모드로 실행됩니다.');
      this.isInitialized = true;
      return;
    }
    
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      this.model = genAI.getGenerativeModel({ model: "gemini-pro" });
      this.isInitialized = true;
      console.log('✅ IntegratedAdvancedGeminiEngine 초기화 완료');
    } catch (error) {
      console.error('❌ IntegratedAdvancedGeminiEngine 초기화 실패:', error);
      throw error;
    }
  }
  
  async analyze(data: any, options?: any): Promise<AnalysisResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    console.log('🔄 통합 분석 시작...');
    const startTime = Date.now();
    
    try {
      // 입력 데이터 검증
      const input = data as IntegratedAnalysisInput;
      if (!input.personalInfo) {
        throw new Error('개인 정보가 필요합니다.');
      }
      
      // 프롬프트 생성
      const prompt = this.buildPrompt(input);
      
      // Gemini API 호출 또는 Mock 데이터
      let result: IntegratedAnalysisResult;
      if (this.model) {
        result = await this.callGeminiAPI(prompt);
      } else {
        result = this.generateMockData(input);
      }
      
      // 결과 검증 및 정리
      const validatedResult = this.validateAndSanitizeResult(result);
      
      // AnalysisResult 형식으로 변환하여 반환
      return this.convertToAnalysisResult(validatedResult, startTime);
      
    } catch (error) {
      console.error('❌ 통합 분석 오류:', error);
      return this.createErrorAnalysisResult(error, startTime);
    }
  }
  
  private buildPrompt(input: IntegratedAnalysisInput): string {
    const { eegAnalysis, ppgAnalysis, personalInfo } = input;
    
    return `
당신은 종합 건강 분석 전문가입니다. 
개별적으로 수행된 EEG와 PPG 분석 결과를 바탕으로 종합적인 건강 리포트를 작성해주세요.

[개인 정보]
- 나이: ${personalInfo.age}세
- 성별: ${personalInfo.gender === 'male' ? '남성' : personalInfo.gender === 'female' ? '여성' : '기타'}
- 직업: ${personalInfo.occupation || '미입력'}
${personalInfo.lifestyle ? `- 수면 시간: ${personalInfo.lifestyle.sleepHours || '미입력'}시간
- 운동 빈도: ${personalInfo.lifestyle.exerciseFrequency || '미입력'}
- 스트레스 수준: ${personalInfo.lifestyle.stressLevel || '미입력'}` : ''}

[EEG 분석 결과]
${eegAnalysis ? JSON.stringify(eegAnalysis, null, 2) : '분석 결과 없음'}

[PPG 분석 결과]
${ppgAnalysis ? JSON.stringify(ppgAnalysis, null, 2) : '분석 결과 없음'}

다음 JSON 형식으로 종합 분석을 제공하세요:

{
  "overallSummary": {
    "healthScore": 0-100 사이의 종합 건강 점수,
    "mainFindings": ["주요 발견사항 3-5개"],
    "urgentIssues": ["즉시 주의가 필요한 사항들"],
    "positiveAspects": ["긍정적인 건강 지표들"]
  },
  
  "eegSummary": {
    "overallScore": 0-100,
    "keyFindings": ["EEG 주요 발견사항들"],
    "dimensionScores": {
      "emotionalBalance": 0-100,
      "brainFocus": 0-100,
      "brainArousal": 0-100,
      "stressLevel": 0-100
    }
  },
  
  "ppgSummary": {
    "overallScore": 0-100,
    "keyFindings": ["PPG 주요 발견사항들"],
    "axisScores": {
      "stressHealth": 0-100,
      "autonomicHealth": 0-100,
      "hrvHealth": 0-100
    }
  },
  
  "personalizedAnalysis": {
    "ageGenderAnalysis": {
      "comparison": "${personalInfo.age}세 ${personalInfo.gender === 'male' ? '남성' : '여성'} 평균 대비 건강 상태",
      "risks": ["연령/성별 특화 위험 요소들"],
      "recommendations": ["맞춤형 권고사항들"]
    },
    "occupationAnalysis": {
      "workStressImpact": "직업이 건강에 미치는 영향 분석",
      "occupationalRisks": ["직업 관련 건강 위험 요소들"],
      "workLifeBalance": ["일과 삶의 균형을 위한 제안들"]
    }
  },
  
  "improvementPlan": {
    "immediate": [
      {
        "category": "lifestyle/exercise/mental/medical/work 중 하나",
        "action": "구체적인 실천 사항",
        "expectedBenefit": "예상되는 효과",
        "priority": "high/medium/low",
        "timeframe": "실행 시기"
      }
    ],
    "shortTerm": ["1-4주 내 실천 사항들"],
    "longTerm": ["1-3개월 내 실천 사항들"]
  },
  
  "medicalRecommendations": {
    "consultationNeeded": true/false,
    "specialties": ["권장 진료과목들"],
    "urgency": "immediate/soon/routine"
  }
}

각 항목은 구체적이고 실행 가능한 내용으로 작성하세요.
건강 점수는 EEG와 PPG 결과를 종합적으로 고려하여 산출하세요.
`;
  }
  
  private async callGeminiAPI(prompt: string): Promise<IntegratedAnalysisResult> {
    if (!this.model) {
      throw new Error('Gemini 모델이 초기화되지 않았습니다.');
    }
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // JSON 파싱
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('응답에서 JSON을 찾을 수 없습니다.');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      return this.validateAndSanitizeResult(parsed);
      
    } catch (error) {
      console.error('Gemini API 호출 실패:', error);
      throw error;
    }
  }
  
  private generateMockData(input: IntegratedAnalysisInput): IntegratedAnalysisResult {
    const { personalInfo, eegAnalysis, ppgAnalysis } = input;
    
    // 기본 점수 계산
    const baseScore = 75;
    const ageModifier = personalInfo.age > 50 ? -5 : personalInfo.age < 30 ? 5 : 0;
    const overallScore = Math.max(0, Math.min(100, baseScore + ageModifier));
    
    const mockResult: IntegratedAnalysisResult = {
      overallSummary: {
        healthScore: overallScore,
        mainFindings: [
          eegAnalysis ? '뇌파 상태가 전반적으로 안정적입니다.' : 'EEG 데이터 없음',
          ppgAnalysis ? '심박 변이도가 정상 범위에 있습니다.' : 'PPG 데이터 없음',
          '스트레스 수준이 관리 가능한 범위입니다.',
          '자율신경계 균형이 양호합니다.'
        ],
        urgentIssues: [],
        positiveAspects: [
          '전반적인 건강 상태가 양호합니다.',
          '정신적 회복력이 좋습니다.',
          '신체 활력도가 적절합니다.'
        ]
      },
      
      eegSummary: eegAnalysis ? {
        overallScore: 78,
        keyFindings: [
          '감정 균형이 안정적입니다.',
          '집중력이 양호한 수준입니다.',
          '뇌파 각성도가 적절합니다.'
        ],
        dimensionScores: {
          emotionalBalance: 82,
          brainFocus: 75,
          brainArousal: 78,
          stressLevel: 68
        }
      } : undefined,
      
      ppgSummary: ppgAnalysis ? {
        overallScore: 72,
        keyFindings: [
          '심박 변이도가 건강한 범위입니다.',
          '자율신경계 균형이 양호합니다.',
          '스트레스 반응이 정상적입니다.'
        ],
        axisScores: {
          stressHealth: 70,
          autonomicHealth: 75,
          hrvHealth: 72
        }
      } : undefined,
      
      personalizedAnalysis: {
        ageGenderAnalysis: {
          comparison: `${personalInfo.age}세 ${personalInfo.gender === 'male' ? '남성' : '여성'} 평균 대비 상위 30%의 건강 상태를 보이고 있습니다.`,
          risks: [
            personalInfo.age > 40 ? '연령 증가에 따른 심혈관 건강 관리 필요' : '특별한 연령 관련 위험 없음',
            personalInfo.gender === 'male' ? '남성의 경우 스트레스 관리가 중요' : '여성의 경우 호르몬 변화 주의'
          ],
          recommendations: [
            '규칙적인 유산소 운동 권장',
            '충분한 수면 시간 확보',
            '스트레스 관리 기법 습득'
          ]
        },
        occupationAnalysis: personalInfo.occupation ? {
          workStressImpact: `${personalInfo.occupation} 직종의 특성상 정신적 부담이 있을 수 있습니다.`,
          occupationalRisks: [
            '장시간 앉아있는 작업으로 인한 혈액순환 저하',
            '정신적 피로 누적 가능성'
          ],
          workLifeBalance: [
            '업무와 휴식의 균형 유지',
            '정기적인 스트레스 해소 활동',
            '충분한 휴식 시간 확보'
          ]
        } : undefined
      },
      
      improvementPlan: {
        immediate: [
          {
            category: 'lifestyle' as const,
            action: '규칙적인 수면 패턴 확립',
            expectedBenefit: '전반적인 건강 상태 개선',
            priority: 'high' as const,
            timeframe: '1주일'
          }
        ],
        shortTerm: [
          {
            category: 'exercise' as const,
            action: '주 3회 30분 유산소 운동',
            expectedBenefit: '심혈관 건강 및 스트레스 감소',
            priority: 'medium' as const,
            timeframe: '4주'
          }
        ],
        longTerm: [
          {
            category: 'mental' as const,
            action: '정기적인 건강 검진',
            expectedBenefit: '건강 상태 모니터링 및 조기 발견',
            priority: 'low' as const,
            timeframe: '3개월'
          }
        ]
      },
      
      medicalRecommendations: {
        consultationNeeded: false,
        specialties: [],
        urgency: 'routine' as const
      },
      
      metadata: {
        analysisDate: new Date().toISOString(),
        engineVersion: this.version,
        processingTime: 0,
        dataQuality: this.assessDataQuality(input)
      }
    };
    
    return mockResult;
  }
  
  private validateAndSanitizeResult(result: any): IntegratedAnalysisResult {
    // Firestore 호환성을 위한 sanitization
    return this.sanitizeForFirestore(result) as IntegratedAnalysisResult;
  }
  
  private sanitizeForFirestore(obj: any): any {
    if (obj === null || obj === undefined) {
      return null;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeForFirestore(item));
    }
    
    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          sanitized[key] = this.sanitizeForFirestore(value);
        }
      }
      return sanitized;
    }
    
    return obj;
  }
  
  private assessDataQuality(input: IntegratedAnalysisInput): 'excellent' | 'good' | 'fair' | 'poor' {
    let score = 0;
    
    // EEG 데이터 존재 여부
    if (input.eegAnalysis) score += 30;
    
    // PPG 데이터 존재 여부
    if (input.ppgAnalysis) score += 30;
    
    // 개인정보 완성도
    if (input.personalInfo.occupation) score += 10;
    if (input.personalInfo.lifestyle) score += 10;
    
    // 측정 시간
    if (input.metadata.measurementDuration >= 300) score += 20;
    
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }
  
  private convertToAnalysisResult(result: IntegratedAnalysisResult, startTime: number): AnalysisResult {
    return {
      engineId: this.id,
      engineVersion: this.version,
      timestamp: new Date().toISOString(),
      analysisId: `integrated-${Date.now()}`,
      overallScore: result.overallSummary.healthScore,
      stressLevel: result.eegSummary?.dimensionScores.stressLevel || 60,
      focusLevel: result.eegSummary?.dimensionScores.brainFocus || 75,
      
      insights: {
        summary: '종합 건강 분석이 완료되었습니다.',
        detailedAnalysis: JSON.stringify(result, null, 2),
        recommendations: result.improvementPlan.immediate.map(item => item.action),
        warnings: result.overallSummary.urgentIssues
      },
      
      metrics: {
        eeg: {
          alpha: 0,
          beta: 0,
          gamma: 0,
          theta: 0,
          delta: 0
        }
      },
      
      processingTime: Date.now() - startTime,
      costUsed: this.costPerAnalysis,
      
      rawData: result
    };
  }

  private createErrorAnalysisResult(error: any, startTime: number): AnalysisResult {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      engineId: this.id,
      engineVersion: this.version,
      timestamp: new Date().toISOString(),
      analysisId: `integrated-error-${Date.now()}`,
      overallScore: 0,
      stressLevel: 0,
      focusLevel: 0,
      
      insights: {
        summary: '통합 분석 중 오류가 발생했습니다.',
        detailedAnalysis: `오류 내용: ${errorMessage}`,
        recommendations: ['나중에 다시 시도해주세요.'],
        warnings: ['분석 실패']
      },
      
      metrics: {
        eeg: {
          alpha: 0,
          beta: 0,
          gamma: 0,
          theta: 0,
          delta: 0
        }
      },
      
      processingTime: Date.now() - startTime,
      costUsed: 0
    };
  }
  
  getRequiredDataTypes(): string[] {
    return ['eeg', 'ppg'];
  }
  
  async validate(data: any): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let qualityScore = 100;

    try {
      const input = data as IntegratedAnalysisInput;
      
      if (!input.personalInfo) {
        errors.push('개인 정보가 필요합니다.');
        qualityScore -= 50;
      }

      if (!input.eegAnalysis && !input.ppgAnalysis) {
        errors.push('EEG 또는 PPG 분석 데이터가 필요합니다.');
        qualityScore -= 30;
      }

      if (input.metadata?.measurementDuration < 60) {
        warnings.push('측정 시간이 1분 미만입니다. 더 정확한 분석을 위해 더 긴 측정을 권장합니다.');
        qualityScore -= 10;
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        qualityScore: Math.max(0, qualityScore)
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ['데이터 검증 중 오류가 발생했습니다.'],
        warnings: [],
        qualityScore: 0
      };
    }
  }
}