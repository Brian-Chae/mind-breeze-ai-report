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
  name = '종합 Gemini 분석';
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
  
  costPerAnalysis = 10.000; // 종합 분석이므로 비용이 더 높음

  recommendedRenderers = ['integrated-analysis-viewer'];

  private model: GenerativeModel | null = null;
  private isInitialized = false;
  
  async initialize(): Promise<void> {
    console.log('🚀 IntegratedAdvancedGeminiEngine 초기화 중...');
    
    const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ Gemini API 키가 없습니다. Mock 모드로 실행됩니다.');
      this.isInitialized = true;
      return;
    }
    
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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
        result = await this.callGeminiAPIWithRetry(prompt);
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
    
    // 디버깅: 전달받은 데이터 구조 확인
    console.log('🔍 통합 분석 엔진 - 받은 데이터 구조:');
    console.log('EEG Analysis Keys:', eegAnalysis ? Object.keys(eegAnalysis) : 'null');
    console.log('PPG Analysis Keys:', ppgAnalysis ? Object.keys(ppgAnalysis) : 'null');
    
    // EEG 데이터 추출 - AnalysisResult 구조에서 실제 데이터 찾기
    let eegData = null;
    let eegScores = {};
    let eegOverallScore = 0;
    
    if (eegAnalysis) {
      // rawData에서 찾기
      if (eegAnalysis.rawData) {
        eegData = eegAnalysis.rawData;
        console.log('EEG rawData에서 데이터 추출');
      }
      // insights.detailedAnalysis에서 JSON 파싱 시도
      else if (eegAnalysis.insights?.detailedAnalysis) {
        try {
          eegData = JSON.parse(eegAnalysis.insights.detailedAnalysis);
          console.log('EEG insights.detailedAnalysis에서 JSON 파싱 성공');
        } catch (e) {
          console.log('EEG JSON 파싱 실패, 텍스트로 처리');
        }
      }
      
      if (eegData) {
        eegScores = eegData.fourDimensionAnalysis || {};
        eegOverallScore = eegData.comprehensiveAssessment?.overallScore || eegAnalysis.overallScore || 0;
      } else {
        // 기본 AnalysisResult에서 점수 추출
        eegOverallScore = eegAnalysis.overallScore || 0;
      }
    }
    
    console.log('EEG Data Keys:', eegData ? Object.keys(eegData) : 'null');
    console.log('EEG Scores Keys:', Object.keys(eegScores));
    console.log('EEG Overall Score:', eegOverallScore);
    
    // PPG 데이터 추출 - AnalysisResult 구조에서 실제 데이터 찾기
    let ppgData = null;
    let ppgScores = {};
    let ppgOverallScore = 0;
    
    if (ppgAnalysis) {
      // rawData에서 찾기
      if (ppgAnalysis.rawData) {
        ppgData = ppgAnalysis.rawData;
        console.log('PPG rawData에서 데이터 추출');
      }
      // insights.detailedAnalysis에서 JSON 파싱 시도
      else if (ppgAnalysis.insights?.detailedAnalysis) {
        try {
          ppgData = JSON.parse(ppgAnalysis.insights.detailedAnalysis);
          console.log('PPG insights.detailedAnalysis에서 JSON 파싱 성공');
        } catch (e) {
          console.log('PPG JSON 파싱 실패, 텍스트로 처리');
        }
      }
      
      if (ppgData) {
        ppgScores = ppgData.threeAxisAnalysis || {};
        ppgOverallScore = ppgData.comprehensiveAssessment?.overallScore || ppgAnalysis.overallScore || 0;
      } else {
        // 기본 AnalysisResult에서 점수 추출
        ppgOverallScore = ppgAnalysis.overallScore || 0;
      }
    }
    
    console.log('PPG Data Keys:', ppgData ? Object.keys(ppgData) : 'null');
    console.log('PPG Scores Keys:', Object.keys(ppgScores));
    console.log('PPG Overall Score:', ppgOverallScore);
    
    return `
당신은 종합 건강 분석 전문가입니다. 
개별적으로 수행된 EEG(뇌파)와 PPG(심박) 분석 결과를 바탕으로 종합적인 건강 리포트를 작성해주세요.

[개인 정보]
- 나이: ${personalInfo.age}세
- 성별: ${personalInfo.gender === 'male' ? '남성' : personalInfo.gender === 'female' ? '여성' : '기타'}
- 직업: ${personalInfo.occupation || '미입력'}
${personalInfo.lifestyle ? `- 수면 시간: ${personalInfo.lifestyle.sleepHours || '미입력'}시간
- 운동 빈도: ${personalInfo.lifestyle.exerciseFrequency || '미입력'}
- 스트레스 수준: ${personalInfo.lifestyle.stressLevel || '미입력'}` : ''}

[EEG 뇌파 분석 결과 - 4대 지표]
${eegAnalysis ? `
EEG 종합 점수: ${eegOverallScore}점

4대 뇌파 지표 분석:
${eegData && Object.keys(eegScores).length > 0 ? Object.entries(eegScores).map(([key, data]: [string, any]) => `
• ${data?.dimension || key}: ${data?.score || 0}점 (${data?.level || '평가중'})
  - 임상적 의미: ${data?.clinicalSignificance || '분석중'}
  - 해석: ${data?.interpretation || '분석중'}`).join('') : `
• 감정균형도: 정보 추출 중
• 뇌파집중건강도: 정보 추출 중  
• 뇌파각성건강도: 정보 추출 중
• 스트레스: 정보 추출 중`}

EEG 종합 의견: ${eegData?.comprehensiveAssessment?.overallSummary || eegAnalysis.insights?.summary || '분석중'}
주요 발견사항: ${eegData?.comprehensiveAssessment?.keyFindings?.join(', ') || '분석중'}
우려사항: ${eegData?.comprehensiveAssessment?.primaryConcerns?.filter((c: string) => c !== "현재 특별한 문제점 없음").join(', ') || '없음'}
` : 'EEG 분석 결과 없음'}

[PPG 심박 분석 결과 - 3대 축]
${ppgAnalysis ? `
PPG 종합 점수: ${ppgOverallScore}점

3대 심박 축 분석:
${ppgData && Object.keys(ppgScores).length > 0 ? Object.entries(ppgScores).map(([key, data]: [string, any]) => `
• ${data?.axis || key}: ${data?.score || 0}점 (${data?.level || '평가중'})
  - 임상적 의미: ${data?.clinicalSignificance || '분석중'}
  - 해석: ${data?.interpretation || '분석중'}`).join('') : `
• 스트레스건강도: 정보 추출 중
• 자율신경건강도: 정보 추출 중
• 심박변이건강도: 정보 추출 중`}

PPG 종합 의견: ${ppgData?.comprehensiveAssessment?.overallSummary || ppgAnalysis.insights?.summary || '분석중'}
주요 발견사항: ${ppgData?.comprehensiveAssessment?.keyFindings?.join(', ') || '분석중'}
우려사항: ${ppgData?.comprehensiveAssessment?.primaryConcerns?.filter((c: string) => c !== "현재 특별한 문제점 없음").join(', ') || '없음'}
` : 'PPG 분석 결과 없음'}

다음 JSON 형식으로 종합 분석을 제공하세요:

{
  "overallSummary": {
    "healthScore": "수학적 평균값만 허용: (eegSummary.overallScore + ppgSummary.overallScore) ÷ 2",
    "mainFindings": ["주요 발견사항 3-5개"],
    "urgentIssues": ["즉시 주의가 필요한 사항들"],
    "positiveAspects": ["긍정적인 건강 지표들"]
  },
  
  "eegSummary": {
    "overallScore": "수학적 평균값만 허용: (emotionalBalance + brainFocus + brainArousal + stressLevel) ÷ 4",
    "keyFindings": ["EEG 4대 지표별 구체적 발견사항들"],
    "dimensionScores": {
      "emotionalBalance": EEG 감정균형도 실제 점수,
      "brainFocus": EEG 뇌파집중건강도 실제 점수,
      "brainArousal": EEG 뇌파각성건강도 실제 점수,
      "stressLevel": EEG 스트레스 수준 실제 점수
    }
  },
  
  "ppgSummary": {
    "overallScore": "수학적 평균값만 허용: (stressHealth + autonomicHealth + hrvHealth) ÷ 3",
    "keyFindings": ["PPG 3대 축별 구체적 발견사항들"],
    "axisScores": {
      "stressHealth": PPG 스트레스건강도 실제 점수,
      "autonomicHealth": PPG 자율신경건강도 실제 점수,
      "hrvHealth": PPG 심박변이건강도 실제 점수
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

**CRITICAL: 반드시 수학적 평균값을 정확히 계산하세요! 자의적인 점수 부여 금지!**

**계산 공식 (반드시 준수):**
1. eegSummary.overallScore = (emotionalBalance + brainFocus + brainArousal + stressLevel) ÷ 4
2. ppgSummary.overallScore = (stressHealth + autonomicHealth + hrvHealth) ÷ 3  
3. overallSummary.healthScore = (eegSummary.overallScore + ppgSummary.overallScore) ÷ 2

**예시:**
- EEG 지표가 100, 100, 94, 100이면 → overallScore = (100+100+94+100)÷4 = 98.5
- PPG 지표가 70, 83, 80이면 → overallScore = (70+83+80)÷3 = 77.7
- 전체 건강 점수 = (98.5+77.7)÷2 = 88.1

**기타 지침:**
4. EEG와 PPG의 실제 점수와 데이터를 정확히 반영하세요
5. dimensionScores와 axisScores는 실제 측정값을 사용하세요
6. keyFindings는 각각의 구체적인 지표값과 해석을 포함하세요
`;
  }
  
  private generateSummary(result: IntegratedAnalysisResult): string {
    const eegScore = result.eegSummary?.overallScore || 0;
    const ppgScore = result.ppgSummary?.overallScore || 0;
    const overallScore = result.overallSummary.healthScore;
    
    // EEG 4대 지표
    const emotionalBalance = result.eegSummary?.dimensionScores.emotionalBalance || 0;
    const brainFocus = result.eegSummary?.dimensionScores.brainFocus || 0;
    const brainArousal = result.eegSummary?.dimensionScores.brainArousal || 0;
    const eegStressLevel = result.eegSummary?.dimensionScores.stressLevel || 0;
    
    // PPG 3대 지표
    const stressHealth = result.ppgSummary?.axisScores.stressHealth || 0;
    const autonomicHealth = result.ppgSummary?.axisScores.autonomicHealth || 0;
    const hrvHealth = result.ppgSummary?.axisScores.hrvHealth || 0;
    
    // 종합 평가 문구 생성
    let summaryText = `종합 건강 분석이 완료되었습니다. 전체 건강 점수는 ${overallScore}점으로 `;
    
    // 전체 점수에 따른 평가
    if (overallScore >= 90) {
      summaryText += '매우 우수한 건강 상태를 보이고 있습니다. ';
    } else if (overallScore >= 80) {
      summaryText += '전반적으로 양호한 건강 상태입니다. ';
    } else if (overallScore >= 70) {
      summaryText += '보통 수준의 건강 상태이며, 일부 개선이 필요합니다. ';
    } else if (overallScore >= 60) {
      summaryText += '주의가 필요한 건강 상태입니다. ';
    } else {
      summaryText += '건강 관리가 시급히 필요한 상태입니다. ';
    }
    
    // EEG 분석 요약
    summaryText += `뇌파 분석 결과(${eegScore}점): `;
    const eegHighlights = [];
    
    if (emotionalBalance >= 80) {
      eegHighlights.push(`감정 균형이 안정적(${emotionalBalance}점)`);
    } else if (emotionalBalance < 60) {
      eegHighlights.push(`감정 조절 필요(${emotionalBalance}점)`);
    }
    
    if (brainFocus >= 80) {
      eegHighlights.push(`집중력 우수(${brainFocus}점)`);
    } else if (brainFocus < 60) {
      eegHighlights.push(`집중력 개선 필요(${brainFocus}점)`);
    }
    
    if (brainArousal >= 80) {
      eegHighlights.push(`뇌 활성도 양호(${brainArousal}점)`);
    } else if (brainArousal < 60) {
      eegHighlights.push(`뇌 활성도 저하(${brainArousal}점)`);
    }
    
    if (eegStressLevel >= 80) {
      eegHighlights.push(`스트레스 관리 우수(${eegStressLevel}점)`);
    } else if (eegStressLevel < 60) {
      eegHighlights.push(`스트레스 관리 필요(${eegStressLevel}점)`);
    }
    
    summaryText += eegHighlights.join(', ') + '. ';
    
    // PPG 분석 요약
    summaryText += `심박 분석 결과(${ppgScore}점): `;
    const ppgHighlights = [];
    
    if (stressHealth >= 80) {
      ppgHighlights.push(`스트레스 건강도 양호(${stressHealth}점)`);
    } else if (stressHealth < 60) {
      ppgHighlights.push(`스트레스 건강도 개선 필요(${stressHealth}점)`);
    }
    
    if (autonomicHealth >= 80) {
      ppgHighlights.push(`자율신경계 균형 우수(${autonomicHealth}점)`);
    } else if (autonomicHealth < 60) {
      ppgHighlights.push(`자율신경계 불균형(${autonomicHealth}점)`);
    }
    
    if (hrvHealth >= 80) {
      ppgHighlights.push(`심박변이도 건강(${hrvHealth}점)`);
    } else if (hrvHealth < 60) {
      ppgHighlights.push(`심박변이도 개선 필요(${hrvHealth}점)`);
    }
    
    summaryText += ppgHighlights.join(', ') + '. ';
    
    // 주요 권고사항
    const recommendations = [];
    if (eegStressLevel < 70 || stressHealth < 70) {
      recommendations.push('스트레스 관리 프로그램 참여 권장');
    }
    if (brainFocus < 70) {
      recommendations.push('집중력 향상 훈련 필요');
    }
    if (autonomicHealth < 70) {
      recommendations.push('규칙적인 운동과 호흡 훈련 권장');
    }
    
    if (recommendations.length > 0) {
      summaryText += '권장사항: ' + recommendations.join(', ') + '.';
    }
    
    return summaryText;
  }

  private async callGeminiAPIWithRetry(prompt: string, maxRetries: number = 3): Promise<IntegratedAnalysisResult> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Gemini API 호출 시도 ${attempt}/${maxRetries}`);
        
        const result = await this.callGeminiAPI(prompt);
        console.log(`✅ Gemini API 호출 성공 (시도 ${attempt})`);
        return result;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`❌ Gemini API 호출 실패 (시도 ${attempt}):`, lastError.message);
        
        // 503 서비스 불가 오류인 경우 재시도
        if (lastError.message.includes('503') && attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // 지수 백오프 (최대 5초)
          console.log(`⏳ ${delay}ms 후 재시도...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // 다른 오류이거나 마지막 시도인 경우 에러 던지기
        if (attempt === maxRetries) {
          throw lastError;
        }
      }
    }
    
    throw lastError || new Error('알 수 없는 오류');
  }

  private async callGeminiAPI(prompt: string): Promise<IntegratedAnalysisResult> {
    if (!this.model) {
      throw new Error('Gemini 모델이 초기화되지 않았습니다.');
    }
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
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
      // 통합 stressLevel: EEG stressLevel과 PPG stressHealth의 평균
      stressLevel: Math.round(
        ((result.eegSummary?.dimensionScores.stressLevel || 60) + 
         (result.ppgSummary?.axisScores.stressHealth || 60)) / 2
      ),
      focusLevel: result.eegSummary?.dimensionScores.brainFocus || 75,
      
      insights: {
        summary: this.generateSummary(result),
        detailedAnalysis: JSON.stringify(result, null, 2),
        recommendations: result.improvementPlan.immediate.map(item => item.action),
        warnings: result.overallSummary.urgentIssues
      },
      
      // metrics 필드 추가 (AnalysisResult 인터페이스 필수 필드)
      metrics: {
        eeg: {
          alpha: 100,
          beta: 100,
          gamma: 100,
          theta: 100,
          delta: 100
        },
        ppg: {
          heartRate: 75,
          hrv: 50,
          stressIndex: 50
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
      
      // metrics 필드 추가 (AnalysisResult 인터페이스 필수 필드)
      metrics: {
        eeg: {
          alpha: 0,
          beta: 0,
          gamma: 0,
          theta: 0,
          delta: 0
        },
        ppg: {
          heartRate: 0,
          hrv: 0,
          stressIndex: 0
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