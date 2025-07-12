/**
 * Gemini AI API 연동 서비스
 * - API 키 관리자 연동
 * - 프롬프트 엔지니어링
 * - 개인화된 건강 분석
 * - 에러 처리 및 재시도 로직
 */

import { APIKeyManager } from '../../../services/APIKeyManager';
import { PersonalInfo, MeasurementData, AIAnalysisResult, OccupationType } from '../types/index';
import { ComprehensiveAnalysisService } from './ComprehensiveAnalysisService';
import { 
  getAllEEGNormalRanges, 
  getAllPPGNormalRanges, 
  getAllACCNormalRanges,
  PersonalInfo as IndexGuidePersonalInfo,
  NormalRange
} from '../utils/indexGuideParser';
// import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { MedicalInterpretationService } from './MedicalInterpretationService';
import { MentalHealthAnalysisService, MentalHealthBiomarkers } from './MentalHealthAnalysisService';
// import { calculateStressMetrics } from '../utils/stressCalculation';

export interface GeminiAPIConfig {
  model: string;
  maxRetries: number;
  retryDelay: number;
  timeout: number;
}

export interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig: {
    temperature: number;
    topK: number;
    topP: number;
    maxOutputTokens: number;
  };
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

// 단계별 분석 결과 인터페이스
export interface MentalHealthReport {
  score: number;
  status: string;
  analysis: string;
  keyMetrics: Record<string, string>;
  recommendations: string[];
  concerns: string[];
}

export interface PhysicalHealthReport {
  score: number;
  status: string;
  analysis: string;
  keyMetrics: Record<string, string>;
  recommendations: string[];
  concerns: string[];
}

export interface StressHealthReport {
  score: number;
  status: string;
  analysis: string;
  keyMetrics: Record<string, string>;
  stressFactors: string[];
  recommendations: string[];
}

export interface ComprehensiveAnalysis {
  overallScore: number;
  personalizedSummary: string;
  immediateActions: string[];
  shortTermGoals: string[];
  longTermStrategy: string[];
  occupationSpecificAdvice: string[];
  followUpPlan: string[];
}

export class GeminiAIService {
  private static readonly API_KEY_ID = 'gemini-api';
  private static readonly API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
  
  private static readonly DEFAULT_CONFIG: GeminiAPIConfig = {
    model: 'gemini-2.5-flash',
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 90000  // Gemini 2.5 Flash는 더 빠른 응답 시간 제공
  };

  // 🔧 4단계 종합 분석용 특별 설정 (더 긴 시간과 더 많은 토큰 필요)
  private static readonly COMPREHENSIVE_ANALYSIS_CONFIG: GeminiAPIConfig = {
    model: 'gemini-2.5-flash',
    maxRetries: 2,  // 재시도 횟수 줄여서 전체 시간 단축
    retryDelay: 2000,
    timeout: 180000  // 3분으로 확장
  };

  private static genAI: any | null = null;

  /**
   * PersonalInfo를 IndexGuidePersonalInfo로 변환
   */
  private static convertPersonalInfo(personalInfo: PersonalInfo): IndexGuidePersonalInfo {
    return {
      age: personalInfo.age,
      gender: personalInfo.gender === 'male' || personalInfo.gender === 'female' ? personalInfo.gender : 'male', // 기본값 설정
      occupation: personalInfo.occupation === 'other' ? personalInfo.customOccupation || '기타' : personalInfo.occupation
    };
  }

  /**
   * 동적 정상값 범위 문자열 생성
   */
  private static generateDynamicRangeString(ranges: Record<string, NormalRange>): string {
    const rangeStrings: string[] = [];
    
    Object.entries(ranges).forEach(([key, range]) => {
      const interpretationText = [
        `<${range.min} (${range.interpretation.low})`,
        `${range.label} (정상)`,
        `>${range.max} (${range.interpretation.high})`
      ].join(', ');
      
      rangeStrings.push(`- **${key}**: ${interpretationText}`);
    });
    
    return rangeStrings.join('\n');
  }

  /**
   * API 키 존재 여부 확인
   */
  static async isAPIKeyAvailable(): Promise<boolean> {
    try {
      const apiKey = await APIKeyManager.getAPIKey(this.API_KEY_ID);
      return !!apiKey;
    } catch (error) {
      console.error('API 키 확인 실패:', error);
      return false;
    }
  }

  /**
   * API 키 가져오기
   */
  private static async getAPIKey(): Promise<string> {
    console.log('🔍 API 키 조회 시작...');
    
    // 먼저 모든 API 키 메타데이터 확인
    const allKeys = APIKeyManager.getAPIKeyMetadata();
    console.log('📋 저장된 API 키 목록:', allKeys);
    
    // 각 키의 상세 정보 확인
    for (const key of allKeys) {
      console.log(`🔍 키 ${key.id} 상세 정보:`, {
        id: key.id,
        name: key.name,
        service: key.service,
        isActive: key.isActive,
        isVerified: key.isVerified,
        maskedKey: key.maskedKey,
        lastUsed: key.lastUsed,
        createdAt: new Date(key.createdAt).toLocaleString()
      });
    }
    
    // 활성화되고 검증된 Gemini API 키 조회
    const apiKey = await APIKeyManager.getActiveGeminiAPIKey();
    console.log('🔑 활성 Gemini API 키 조회 결과:', apiKey ? '키 발견' : '키 없음');
    
    if (!apiKey) {
      console.log('⚠️ 활성 키 없음, 대체 방법 시도...');
      
      // 대체 방법: 특정 ID로 조회
      const fallbackKey = await APIKeyManager.getAPIKey(this.API_KEY_ID);
      console.log('🔄 대체 키 조회 결과:', fallbackKey ? '키 발견' : '키 없음');
      
      if (!fallbackKey) {
        console.error('❌ API 키를 찾을 수 없음');
        throw new Error('Gemini API 키가 설정되지 않았습니다. Settings에서 API 키를 설정해주세요.');
      }
      
      // 키가 있지만 활성화되지 않은 경우 확인
      const metadata = APIKeyManager.getAPIKeyMetadataById(this.API_KEY_ID);
      console.log('📊 API 키 메타데이터:', metadata);
      
      if (metadata && !metadata.isActive) {
        console.error('❌ API 키가 비활성화됨');
        throw new Error('Gemini API 키가 비활성화되어 있습니다. Settings에서 API 키를 활성화해주세요.');
      }
      if (metadata && !metadata.isVerified) {
        console.error('❌ API 키가 검증되지 않음');
        throw new Error('Gemini API 키가 검증되지 않았습니다. Settings에서 API 키를 다시 테스트해주세요.');
      }
      
      console.log('✅ 대체 키 사용');
      return fallbackKey;
    }
    
    console.log('✅ 활성 키 사용');
    return apiKey;
  }

  /**
   * Gemini API 요청 수행
   */
  private static async makeRequest(
    prompt: string,
    config: Partial<GeminiAPIConfig> = {}
  ): Promise<GeminiResponse> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const apiKey = await this.getAPIKey();
    
    const request: GeminiRequest = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.3,  // 더 일관되고 정확한 정신 건강 분석을 위해 낮은 온도
        topK: 20,          // 더 집중된 응답을 위해 감소
        topP: 0.85,        // 더 신뢰할 수 있는 응답을 위해 감소
        maxOutputTokens: config.model === 'comprehensive-analysis' ? 32768 : 16384  // 종합 분석 시 더 많은 토큰 허용
      }
    };

    // 🔧 실제 API 호출 시에는 항상 gemini-2.5-flash 모델 사용
    const actualModel = finalConfig.model === 'comprehensive-analysis' ? 'gemini-2.5-flash' : finalConfig.model;
    const url = `${this.API_BASE_URL}/${actualModel}:generateContent?key=${apiKey}`;

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < finalConfig.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), finalConfig.timeout);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`API 요청 실패: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }

        const data: GeminiResponse = await response.json();
        
        // API 사용 기록 업데이트
        APIKeyManager.updateLastUsed(this.API_KEY_ID);
        
        return data;

      } catch (error) {
        lastError = error as Error;
        
        if (attempt < finalConfig.maxRetries - 1) {
          console.warn(`Gemini API 요청 실패 (${attempt + 1}/${finalConfig.maxRetries}):`, error);
          await this.delay(finalConfig.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError || new Error('알 수 없는 오류가 발생했습니다.');
  }

  /**
   * 지연 함수
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 응답에서 텍스트 추출
   */
  private static extractTextFromResponse(response: GeminiResponse): string {
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error('AI 응답이 비어있습니다.');
    }

    const candidate = response.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      throw new Error('AI 응답 형식이 올바르지 않습니다.');
    }

    return candidate.content.parts[0].text;
  }

  /**
   * 직업별 맞춤형 조언 생성
   */
  private static getOccupationAdvice(occupation: OccupationType, customOccupation?: string): string {
    const occupationLabel = this.getOccupationLabel(occupation, customOccupation);
    
    switch (occupation) {
      case 'teacher':
        return `
## 교사 특화 조언
**환경 특성**: 교육 현장에서의 높은 집중력 요구, 다중 업무 처리, 학생 지도 및 교육 책임
**건강 위험 요소**:
- 장시간 서서 수업으로 인한 하지 정맥류 및 척추 부담
- 지속적인 목소리 사용으로 인한 성대 피로 및 목 근육 긴장
- 학생 지도 및 학부모 상담으로 인한 정신적 스트레스
- 교육과정 변화 적응 및 행정업무 증가로 인한 인지 부하
- 방과 후 업무 연장으로 인한 수면 부족 및 생체리듬 교란
- 교실 내 소음 및 밀폐된 공간에서의 장시간 근무

**측정 데이터 연관 분석**:
- 집중력 지수: 교사는 수업 중 높은 집중력 유지가 필요하나, 과도한 집중은 인지 피로 유발
- 스트레스 지수: 학생 관리, 학부모 상담, 평가 업무로 인한 만성적 스트레스 노출
- 심박변이도: 교실에서의 예상치 못한 상황 대처로 인한 자율신경계 활성화
- 좌우뇌 균형: 논리적 수업 진행과 창의적 교육 방법 간의 뇌 활동 불균형 가능성

**건강 관리 방안**:
- 수업 중 정기적인 자세 변경 및 발목 운동 (5분마다)
- 목소리 보호를 위한 복식호흡 및 목 스트레칭
- 학생 지도 후 감정 정리 시간 확보 (심호흡 3분)
- 교육과정 변화 적응을 위한 점진적 학습 계획 수립
- 방학 중 충분한 휴식과 재충전 시간 확보
- 교실 환기 및 적절한 조명 관리

**상담 및 지원 체계**:
- 교육청 교원 상담 프로그램 및 심리 상담 서비스 활용
- 동료 교사와의 경험 공유 및 상호 지원 네트워크 구축
- 교원 힐링센터 및 교사 휴양시설 이용
- 교사 커뮤니티 및 온라인 지원 그룹 참여
- 학교 내 교사 상담실 및 멘토링 프로그램 활용

**실천 가능한 관리법**:
- 수업 중간 목과 어깨 스트레칭 (매 교시 간 2분)
- 학생 지도 후 감정 정리 및 스트레스 해소 시간 확보
- 방과 후 개인 시간 확보 및 취미 활동 참여
- 교육 외 취미 활동을 통한 스트레스 해소
- 주말 야외 활동 및 자연 속 휴식 시간 확보
- 동료 교사와의 정기적인 소통 및 정보 공유

**교사 특화 건강 모니터링**:
- 수업 전후 스트레스 수준 자가 점검
- 목소리 사용량 및 목 상태 일일 체크
- 서있는 시간 대비 휴식 시간 비율 관리
- 학기 중 vs 방학 중 건강 상태 비교 분석
- 학생 상담 후 정서 상태 모니터링`;

      case 'military_medic':
        return `
## 의무병사 특화 조언
**환경 특성**: 군 의무대 근무, 의료진 역할과 군인 신분 병행
**건강 관리 방안**:
- 의무대 내 의료진과의 상호 건강 체크 시스템 활용
- 부대 내 스트레스 관리 프로그램 적극 참여
- 의료 지식을 활용한 자가 건강 모니터링
- 환자 케어로 인한 정신적 부담 관리 필요

**상담 및 지원 체계**:
- 부대 내 군의관, 선임 의무병과 상담
- 국군의료원 정신건강의학과 연계 상담
- 군 상담관(멘토) 제도 활용
- 의무병 커뮤니티 네트워크 구축

**실천 가능한 관리법**:
- 의무대 내 간단한 스트레칭 루틴 개발
- 근무 중 짧은 명상 시간 확보
- 의료진으로서의 사명감과 개인 건강의 균형
- 부대 내 체력 단련 프로그램 적극 참여`;

      case 'military_career':
        return `
## 직업군인 특화 조언
**환경 특성**: 대한민국 군 간부, 리더십 역할과 책임감
**건강 관리 방안**:
- 부하 장병들의 모범이 되는 건강 관리
- 지휘관으로서의 스트레스 관리 필수
- 정기적인 군 건강검진 활용
- 가족과의 분리로 인한 정신적 부담 관리

**상담 및 지원 체계**:
- 군 EAP(직원지원프로그램) 활용
- 국군의료원 정신건강의학과 상담
- 상급 지휘관과의 멘토링
- 군 가족 상담 서비스 이용

**실천 가능한 관리법**:
- 부대 내 체력 단련 프로그램 솔선수범
- 규칙적인 생활 패턴 유지
- 가족과의 소통 시간 확보
- 부하 장병 관리 스트레스 해소법 개발`;

      case 'elementary':
        return `
## 초등학생 특화 조언
**환경 특성**: 성장기 아동, 학습과 놀이의 균형
**건강 관리 방안**:
- 충분한 수면과 규칙적인 생활 패턴
- 스마트폰/게임 사용 시간 제한
- 신체 활동과 야외 놀이 시간 확보
- 학업 스트레스 조기 관리

**상담 및 지원 체계**:
- 학교 보건교사, 담임교사와 상담
- 부모님과의 충분한 소통
- 학교 상담교사 도움 요청
- 지역 아동센터 프로그램 참여

**실천 가능한 관리법**:
- 매일 30분 이상 야외 활동
- 취침 전 스마트폰 사용 금지
- 친구들과의 건전한 놀이 시간
- 규칙적인 식사와 간식 시간`;

      case 'middle_school':
        return `
## 중학생 특화 조언
**환경 특성**: 사춘기 시작, 학업 부담 증가
**건강 관리 방안**:
- 사춘기 신체 변화에 대한 올바른 이해
- 학업 스트레스와 교우 관계 스트레스 관리
- 규칙적인 운동과 충분한 수면
- 정서적 변화에 대한 이해와 대처

**상담 및 지원 체계**:
- 학교 상담교사와의 정기적 상담
- 부모님과의 열린 대화
- 또래 상담 프로그램 참여
- 지역 청소년 상담센터 이용

**실천 가능한 관리법**:
- 주 3회 이상 운동 동아리 참여
- 스마트폰 사용 시간 자기 관리
- 친구들과의 건전한 취미 활동
- 스트레스 해소를 위한 예술 활동`;

      case 'high_school':
        return `
## 고등학생 특화 조언
**환경 특성**: 입시 압박, 진로 고민 시기
**건강 관리 방안**:
- 입시 스트레스 관리 필수
- 장시간 학습으로 인한 신체 건강 관리
- 진로 고민과 불안감 해소
- 규칙적인 생활 패턴 유지

**상담 및 지원 체계**:
- 학교 진로상담교사와 상담
- 학교 보건교사 도움 요청
- 청소년 상담센터 이용
- 부모님과의 진로 상담

**실천 가능한 관리법**:
- 공부 중간 스트레칭과 휴식
- 주말 야외 활동 시간 확보
- 친구들과의 스트레스 해소 시간
- 규칙적인 식사와 충분한 수면`;

      case 'university':
        return `
## 대학생 특화 조언
**환경 특성**: 자율적 생활, 진로 준비 시기
**건강 관리 방안**:
- 불규칙한 생활 패턴 개선
- 취업 준비 스트레스 관리
- 사회 진출 불안감 해소
- 인간관계 스트레스 관리

**상담 및 지원 체계**:
- 대학 학생상담센터 이용
- 대학 보건소 정신건강 상담
- 진로취업센터 상담
- 또래 상담 프로그램 참여

**실천 가능한 관리법**:
- 규칙적인 수면 패턴 유지
- 대학 내 운동 시설 적극 활용
- 동아리 활동을 통한 스트레스 해소
- 건전한 대인관계 형성`;

      case 'housewife':
        return `
## 전업주부 특화 조언
**환경 특성**: 가정 내 역할 집중, 사회적 고립감 가능
**건강 관리 방안**:
- 육아 스트레스 관리
- 사회적 고립감 해소
- 자아 정체성 유지
- 가족 돌봄으로 인한 피로 관리

**상담 및 지원 체계**:
- 지역 여성센터 상담 프로그램
- 주민센터 건강 프로그램 참여
- 맘카페, 육아 모임 참여
- 가족 상담센터 이용

**실천 가능한 관리법**:
- 개인 시간 확보 (하루 30분 이상)
- 지역 커뮤니티 활동 참여
- 온라인 취미 활동
- 가족과의 역할 분담 협의`;

      case 'parent':
        return `
## 학부모 특화 조언
**환경 특성**: 자녀 교육과 직장 생활 병행
**건강 관리 방안**:
- 자녀 교육 스트레스 관리
- 워라밸 실현 어려움 해소
- 자녀와의 갈등 상황 대처
- 경제적 부담 스트레스 관리

**상담 및 지원 체계**:
- 학교 학부모 상담 프로그램
- 지역 가족 상담센터 이용
- 학부모 모임 네트워크 구축
- 직장 내 EAP 프로그램 활용

**실천 가능한 관리법**:
- 자녀와의 질 높은 소통 시간
- 부모 개인 시간 확보
- 다른 학부모와의 정보 공유
- 스트레스 해소를 위한 취미 활동`;

      case 'firefighter':
        return `
## 소방공무원 특화 조언
**환경 특성**: 고위험 업무, 생명 구조 책임감
**건강 관리 방안**:
- 외상 후 스트레스 장애(PTSD) 예방
- 불규칙한 근무 패턴 적응
- 신체적 위험 노출 스트레스 관리
- 동료와의 팀워크 스트레스 관리

**상담 및 지원 체계**:
- 소방청 직원 상담 프로그램
- 소방서 내 동료 상담 체계
- 전문 심리 상담사 연계
- 소방공무원 가족 지원 프로그램

**실천 가능한 관리법**:
- 근무 후 충분한 휴식과 회복
- 동료와의 경험 공유 시간
- 규칙적인 체력 관리
- 가족과의 소통 강화`;

      case 'police':
        return `
## 경찰공무원 특화 조언
**환경 특성**: 치안 유지 책임, 사회적 갈등 노출
**건강 관리 방안**:
- 사회적 갈등 상황 스트레스 관리
- 불규칙한 근무와 야간 근무 적응
- 시민과의 갈등 상황 대처
- 법 집행 부담 스트레스 관리

**상담 및 지원 체계**:
- 경찰청 직원 상담 프로그램
- 경찰서 내 동료 상담 체계
- 전문 심리 상담사 연계
- 경찰공무원 가족 지원 프로그램

**실천 가능한 관리법**:
- 근무 중 스트레스 해소법 개발
- 동료와의 소통 강화
- 규칙적인 체력 단련
- 가족과의 시간 확보`;

      case 'developer':
        return `
## 개발자 특화 조언
**환경 특성**: 장시간 컴퓨터 작업, 기술 변화 적응
**건강 관리 방안**:
- 장시간 앉아서 작업으로 인한 신체 문제
- 눈의 피로와 거북목 증후군 예방
- 기술 변화에 대한 학습 스트레스
- 프로젝트 데드라인 압박 관리

**상담 및 지원 체계**:
- 회사 내 EAP 프로그램 활용
- 개발자 커뮤니티 멘토링
- 직장 내 건강 관리 프로그램
- 온라인 개발자 상담 커뮤니티

**실천 가능한 관리법**:
- 1시간마다 10분 스트레칭
- 20-20-20 규칙 (20분마다 20초간 20피트 거리 응시)
- 규칙적인 운동 스케줄
- 업무 외 시간 디지털 디톡스`;

      case 'designer':
        return `
## 디자이너 특화 조언
**환경 특성**: 창의적 업무, 클라이언트 요구 대응
**건강 관리 방안**:
- 창의적 블록과 아이디어 고갈 스트레스
- 클라이언트 피드백 스트레스 관리
- 장시간 컴퓨터 작업으로 인한 신체 문제
- 프로젝트 데드라인 압박 관리

**상담 및 지원 체계**:
- 디자이너 커뮤니티 네트워킹
- 회사 내 EAP 프로그램 활용
- 창의적 멘토링 프로그램
- 디자인 업계 상담 서비스

**실천 가능한 관리법**:
- 창의적 영감을 위한 취미 활동
- 정기적인 작업 환경 변화
- 눈과 목 건강을 위한 스트레칭
- 작업 외 시간 예술 활동 참여`;

      case 'office_worker':
        return `
## 일반 사무직 특화 조언
**환경 특성**: 사무실 환경, 반복적 업무
**건강 관리 방안**:
- 장시간 앉아서 일하는 환경 개선
- 반복적 업무로 인한 정신적 피로
- 사무실 내 인간관계 스트레스
- 업무 효율성 압박 관리

**상담 및 지원 체계**:
- 회사 내 EAP 프로그램 활용
- 직장 내 건강 관리 프로그램
- 동료와의 소통 강화
- 노동조합 상담 서비스

**실천 가능한 관리법**:
- 점심시간 산책 또는 운동
- 업무 중 정기적 스트레칭
- 사무실 내 식물 키우기
- 취미 활동을 통한 스트레스 해소`;

      case 'manager':
        return `
## 관리자 특화 조언
**환경 특성**: 리더십 역할, 팀 관리 책임
**건강 관리 방안**:
- 팀 관리와 성과 압박 스트레스
- 상급자와 하급자 사이의 중간 관리자 부담
- 의사결정 책임에 따른 스트레스
- 워라밸 실현의 어려움

**상담 및 지원 체계**:
- 경영진 코칭 프로그램
- 리더십 멘토링
- 관리자 교육 프로그램
- 회사 내 EAP 프로그램 활용

**실천 가능한 관리법**:
- 효과적인 위임과 권한 분배
- 정기적인 팀원과의 소통
- 개인 시간 확보와 경계 설정
- 스트레스 관리를 위한 취미 활동`;

      case 'general_worker':
        return `
## 일반 직장인 특화 조언
**환경 특성**: 다양한 직장 환경, 워라밸 추구
**건강 관리 방안**:
- 직장 내 스트레스 관리
- 워라밸 실현 어려움 해소
- 직업 안정성에 대한 불안감
- 인간관계 스트레스 관리

**상담 및 지원 체계**:
- 회사 내 EAP 프로그램 활용
- 직장 내 건강 관리 프로그램
- 동료와의 네트워킹
- 지역 근로자 상담 센터

**실천 가능한 관리법**:
- 출퇴근 시간 활용한 운동
- 점심시간 충분한 휴식
- 취미 활동을 통한 스트레스 해소
- 가족과의 시간 확보`;

      case 'entrepreneur':
        return `
## 사업가 특화 조언
**환경 특성**: 사업 운영 책임, 불확실성 관리
**건강 관리 방안**:
- 사업 성과에 대한 압박감 관리
- 불규칙한 생활 패턴 개선
- 경제적 불안정성 스트레스 관리
- 의사결정 부담 스트레스 해소

**상담 및 지원 체계**:
- 창업 멘토링 프로그램
- 사업가 네트워킹 모임
- 창업 지원센터 상담
- 사업가 정신건강 지원 프로그램

**실천 가능한 관리법**:
- 규칙적인 생활 패턴 유지
- 사업과 개인 시간 분리
- 동료 사업가와의 소통
- 스트레스 해소를 위한 취미 활동`;

      case 'other':
        return `
## ${customOccupation} 특화 조언
**환경 특성**: ${customOccupation}의 고유한 업무 환경과 특성
**건강 관리 방안**:
- 해당 직업의 특성에 맞는 스트레스 관리
- 업무 환경에서 발생할 수 있는 건강 위험 요소 관리
- 직업적 특성을 고려한 생활 패턴 조정
- 해당 분야의 전문가적 스트레스 해소

**상담 및 지원 체계**:
- 해당 직업군의 전문 상담 서비스 활용
- 동종 업계 네트워킹을 통한 경험 공유
- 일반적인 직장인 상담 프로그램 활용
- 지역 사회 정신건강 센터 이용

**실천 가능한 관리법**:
- 해당 직업의 특성에 맞는 건강 관리 루틴 개발
- 업무 스트레스 해소를 위한 개인적 방법 찾기
- 동료들과의 소통과 정보 공유
- 개인 시간 확보와 취미 활동 참여`;

      default:
        return `
## 개인 맞춤형 조언
**건강 관리 방안**:
- 개인의 생활 패턴에 맞는 스트레스 관리
- 규칙적인 생활 습관 형성
- 적절한 휴식과 운동 시간 확보
- 사회적 관계 유지 및 강화

**상담 및 지원 체계**:
- 지역 정신건강 센터 이용
- 온라인 상담 서비스 활용
- 가족 및 친구와의 소통
- 전문 상담사 도움 요청

**실천 가능한 관리법**:
- 개인에게 맞는 스트레스 해소법 찾기
- 규칙적인 운동과 충분한 수면
- 건강한 식습관 유지
- 취미 활동을 통한 정신적 안정`;
    }
  }

  /**
   * 직업 라벨 반환
   */
  private static assessMeasurementQuality(accMetrics: any): { assessment: string; reliability: string; warnings: string[] } {
    const stability = accMetrics.stability || 0;
    const intensity = accMetrics.intensity || 0;
    const movement = accMetrics.averageMovement || 0;
    
    let reliability = 'high';
    let warnings: string[] = [];
    let assessment = '';
    
    if (stability < 50) {
      reliability = 'low';
      warnings.push('측정 중 자세가 불안정했습니다');
      assessment = '측정 품질이 낮습니다. 결과 해석에 주의가 필요합니다.';
    } else if (stability < 70) {
      reliability = 'medium';
      warnings.push('측정 중 약간의 움직임이 있었습니다');
      assessment = '측정 품질이 보통입니다. 결과는 참고용으로 활용하세요.';
    } else {
      assessment = '측정 품질이 우수합니다. 결과를 신뢰할 수 있습니다.';
    }
    
    if (intensity > 50) {
      warnings.push('측정 중 과도한 움직임이 감지되었습니다');
    }
    
    if (movement > 0.3) {
      warnings.push('측정 중 활발한 움직임이 있었습니다');
    }
    
    return { assessment, reliability, warnings };
  }

  private static getOccupationLabel(occupation: OccupationType, customOccupation?: string): string {
    if (occupation === 'other' && customOccupation) {
      return customOccupation;
    }
    
    const occupationLabels: Record<OccupationType, string> = {
      'teacher': '교사',
      'military_medic': '직업군인',
      'military_career': '직업군인',
      'elementary': '초등학생',
      'middle_school': '중학생',
      'high_school': '고등학생',
      'university': '대학생',
      'housewife': '전업주부',
      'parent': '학부모',
      'firefighter': '소방공무원',
      'police': '경찰공무원',
      'developer': '개발자',
      'designer': '디자이너',
      'office_worker': '일반 사무직',
      'manager': '관리자',
      'general_worker': '일반 직장인',
      'entrepreneur': '사업가',
      'other': '기타',
      '': ''
    };
    
    return occupationLabels[occupation] || '';
  }

  /**
   * 개인화된 건강 분석 프롬프트 생성
   */
  private static generateHealthAnalysisPrompt(
    personalInfo: PersonalInfo,
    measurementData: MeasurementData
  ): string {
    // 🔧 NEW: 개인화된 정상값 범위 계산
    const personalGuideInfo = this.convertPersonalInfo(personalInfo);
    const eegRanges = getAllEEGNormalRanges(personalGuideInfo);
    const ppgRanges = getAllPPGNormalRanges(personalGuideInfo);
    const accRanges = getAllACCNormalRanges(personalGuideInfo);
    
    console.log('🔧 개인화된 정상값 범위 계산 완료:', {
      personalGuideInfo,
      eegRanges: Object.keys(eegRanges).length,
      ppgRanges: Object.keys(ppgRanges).length,
      accRanges: Object.keys(accRanges).length
    });

    // 개인정보 파싱
    const age = new Date().getFullYear() - new Date(personalInfo.birthDate).getFullYear();
    const [birthYear, birthMonth, birthDay] = personalInfo.birthDate.split('-');
    
    // 직업별 맞춤 조언
    const occupationMap: Record<string, { label: string; advice: string }> = {
      'developer': {
        label: '개발자',
        advice: `개발자의 경우 장시간 집중적인 사고활동과 컴퓨터 작업으로 인한 정신적 피로와 스트레스가 특징입니다.
특히 디버깅, 문제해결 과정에서의 인지적 부하와 마감일 압박으로 인한 스트레스 관리가 중요합니다.`
      },
      'teacher': {
        label: '교사',
        advice: `교사의 경우 학생 지도와 교육 과정에서의 지속적인 집중력 유지가 필요하며,
학생 관리 및 학부모 상담 등으로 인한 정서적 스트레스 관리가 중요합니다.`
      }
      // 다른 직업들도 필요시 추가
    };
    
    const occupationInfo = occupationMap[personalInfo.occupation] || {
      label: personalInfo.occupation,
      advice: '직업적 특성을 고려한 맞춤형 건강 관리가 필요합니다.'
    };
    
    const occupationLabel = occupationInfo.label;
    const occupationAdvice = occupationInfo.advice;
    
    // 측정 품질 평가
    const measurementQuality = this.assessMeasurementQuality(measurementData.accMetrics);
    
    return `
    # 전문적 정신 건강 수준 AI 건강 분석 시스템 (Gemini 2.0 Flash)

당신은 신경과학, 심장학, 스트레스 의학 전문의 수준의 AI 분석 시스템입니다.
다음 생체신호 데이터를 Visualizer의 의학적 기준에 따라 정확히 분석하고,
각 지표의 정상값 범위 대비 평가하여 전문적인 건강 분석 리포트를 작성하세요.

## 분석 기준 (개인화된 정상값 범위 - ${age}세 ${personalInfo.gender === 'male' ? '남성' : '여성'} ${occupationLabel} 기준)

### EEG 분석 기준 (indexGuides 기반 개인화)
${this.generateDynamicRangeString(eegRanges)}

### PPG 분석 기준 (indexGuides 기반 개인화)
${this.generateDynamicRangeString(ppgRanges)}

### ACC 측정 품질 기준 (indexGuides 기반 개인화)
${this.generateDynamicRangeString(accRanges)}

## 개인정보
- 이름: ${personalInfo.name}
- 나이: ${age}세
- 성별: ${personalInfo.gender === 'male' ? '남성' : '여성'}
- 생년월일: ${birthYear}년 ${birthMonth}월 ${birthDay}일
- 직업: ${occupationLabel}

${occupationAdvice}

## 측정 데이터 (60초간 실시간 측정)
### EEG (뇌파) 분석 지표
- 집중력 지수: ${measurementData.eegMetrics.focusIndex} (개인화 정상범위: ${eegRanges['집중력']?.label || '1.8-2.4'})
- 이완도 지수: ${measurementData.eegMetrics.relaxationIndex} (개인화 정상범위: ${eegRanges['이완도']?.label || '0.18-0.22'})
- 스트레스 지수: ${measurementData.eegMetrics.stressIndex} (개인화 정상범위: ${eegRanges['스트레스']?.label || '3.0-4.0'})
- 좌우뇌 균형: ${measurementData.eegMetrics.hemisphericBalance} (개인화 정상범위: ${eegRanges['좌우뇌 균형']?.label || '-0.1~0.1'})
- 인지 부하: ${measurementData.eegMetrics.cognitiveLoad} (개인화 정상범위: ${eegRanges['인지 부하']?.label || '0.3-0.8'})
- 정서 안정성: ${measurementData.eegMetrics.emotionalStability} (개인화 정상범위: ${eegRanges['정서 안정성']?.label || '0.4-0.8'})
- 총 파워: ${(measurementData.eegMetrics.totalPower)} μV² (정상: 850-1150)

### PPG (심박) 분석 지표
- 심박수: ${measurementData.ppgMetrics.heartRate?.value || 'N/A'} BPM (개인화 정상범위: ${ppgRanges['BPM']?.label || '60-100'})
- 산소포화도: ${measurementData.ppgMetrics.spo2?.value || 'N/A'}% (개인화 정상범위: ${ppgRanges['SpO2']?.label || '95-100'})
- RMSSD: ${measurementData.ppgMetrics.rmssd?.value || 'N/A'}ms (개인화 정상범위: ${ppgRanges['RMSSD']?.label || '20-50ms'})
- SDNN: ${measurementData.ppgMetrics.sdnn?.value || 'N/A'}ms (개인화 정상범위: ${ppgRanges['SDNN']?.label || '30-100'})
- pNN50: ${measurementData.ppgMetrics.pnn50?.value || 'N/A'}% (개인화 정상범위: ${ppgRanges['PNN50']?.label || '10-30'})
- 심박변이도: ${measurementData.ppgMetrics.lfHfRatio?.value || 'N/A'} (개인화 정상범위: ${ppgRanges['LF/HF']?.label || '1.0-3.0'})

### ACC (가속도) 측정 품질 지표
- 안정성: ${measurementData.accMetrics.stability.toFixed(2)}% (신뢰 기준: >70%)
- 강도: ${measurementData.accMetrics.intensity.toFixed(2)}% (측정 방해 여부)
- 평균 움직임: ${measurementData.accMetrics.averageMovement.toFixed(2)}g (정적 기준: <0.1g)
- 최대 움직임: ${measurementData.accMetrics.maxMovement.toFixed(2)}g
- 떨림 정도: ${measurementData.accMetrics.tremor.toFixed(2)}%
- 자세 안정성: ${measurementData.accMetrics.postureStability.toFixed(2)}%

## 측정 품질 평가
${measurementQuality.assessment}
**신뢰도**: ${measurementQuality.reliability}
**주의사항**: ${measurementQuality.warnings.join(', ')}

## 분석 요구사항

### 1. 각 지표별 정확한 의학적 해석
- 정상값 범위 대비 현재 상태 평가
- 의학적 의미와 생리학적 배경 설명
- 연령, 성별, 직업 특성 고려한 개인화 해석

### 2. 3대 건강 영역 종합 분석
- **정신건강**: EEG 지표 기반 뇌 기능 상태 평가
- **신체건강**: PPG 지표 기반 심혈관 상태 평가  
- **스트레스 건강**: 다중 지표 통합 스트레스 수준 평가

### 3. 측정 품질 반영
- ACC 데이터 기반 측정 신뢰성 평가
- 품질에 따른 결과 해석 조정
- 재측정 권고사항 제시

### 4. 실행 가능한 맞춤형 정신 건강 관리 가이드
- **즉시 실행** (오늘부터): 5분 이내, 도구 불필요
- **단기 목표** (1-4주): 주차별 단계적 계획
- **장기 전략** (1-6개월): 생활습관 변화 로드맵

## 응답 형식
다음 JSON 구조로 응답하세요:

\`\`\`json
{
  "measurementQuality": {
    "reliability": "high|medium|low",
    "confidenceLevel": 85,
    "qualityFactors": {
      "movementStability": 78,
      "dataConsistency": 92,
      "signalQuality": 88
    },
    "warnings": ["경고사항들"],
    "recommendations": ["측정 개선 방안들"]
  },
  "individualMetricAnalysis": {
    "eegMetrics": {
      "focusIndex": {
        "value": 2.1,
        "status": "normal|low|high",
        "interpretation": "정상값 범위 대비 의학적 해석",
        "medicalContext": "생리학적 배경 설명",
        "clinicalRelevance": "생리학적 의미"
      },
      "relaxationIndex": {
        "value": 0.20,
        "status": "normal|low|high",
        "interpretation": "의학적 해석",
        "medicalContext": "생리학적 배경",
        "clinicalRelevance": "생리학적 의미"
      },
      "stressIndex": {
        "value": 3.5,
        "status": "normal|low|high",
        "interpretation": "의학적 해석",
        "medicalContext": "생리학적 배경",
        "clinicalRelevance": "생리학적 의미"
      },
      "brainBalance": {
        "value": 0.05,
        "status": "normal|left|right",
        "interpretation": "의학적 해석",
        "medicalContext": "생리학적 배경",
        "clinicalRelevance": "생리학적 의미"
      },
      "cognitiveLoad": {
        "value": 0.6,
        "status": "optimal|low|high|overload",
        "interpretation": "의학적 해석",
        "medicalContext": "생리학적 배경",
        "clinicalRelevance": "생리학적 의미"
      }
    },
    "ppgMetrics": {
      "heartRate": {
        "value": 72,
        "status": "normal|bradycardia|tachycardia",
        "interpretation": "연령/성별 대비 평가",
        "medicalContext": "심혈관 상태 해석",
        "clinicalRelevance": "생리학적 의미"
      },
      "spo2": {
        "value": 98.5,
        "status": "normal|mild_hypoxia|severe_hypoxia",
        "interpretation": "의학적 해석",
        "medicalContext": "호흡순환 상태",
        "clinicalRelevance": "생리학적 의미"
      },
      "rmssd": {
        "value": 35,
        "status": "normal|low|high",
        "interpretation": "의학적 해석",
        "medicalContext": "부교감신경 활동",
        "clinicalRelevance": "생리학적 의미"
      },
      "sdnn": {
        "value": 65,
        "status": "normal|low|high",
        "interpretation": "의학적 해석",
        "medicalContext": "전체 HRV 수준",
        "clinicalRelevance": "생리학적 의미"
      },
      "lfhfRatio": {
        "value": 2.1,
        "status": "optimal|normal|parasympathetic|stress",
        "interpretation": "의학적 해석",
        "medicalContext": "자율신경 균형",
        "clinicalRelevance": "생리학적 의미"
      }
    }
  },
  "healthDomainAnalysis": {
    "mentalHealth": {
      "score": 85,
      "grade": "우수|양호|보통|주의|위험",
      "keyFindings": ["주요 발견사항들"],
      "strengths": ["강점들"],
      "concerns": ["우려사항들"],
      "analysis": "EEG 지표 종합 분석 (의학적 근거 포함)",
      "recommendations": {
        "immediate": ["즉시 실행 방안들"],
        "shortTerm": ["단기 목표들"],
        "longTerm": ["장기 전략들"]
      }
    },
    "physicalHealth": {
      "score": 88,
      "grade": "우수|양호|보통|주의|위험",
      "cardiovascularStatus": "심혈관 상태 평가",
      "autonomicBalance": "자율신경 균형 분석",
      "keyFindings": ["주요 발견사항들"],
      "analysis": "PPG 지표 종합 분석 (의학적 근거 포함)",
      "recommendations": {
        "immediate": ["즉시 실행 방안들"],
        "shortTerm": ["단기 목표들"],
        "longTerm": ["장기 전략들"]
      }
    },
    "stressHealth": {
      "score": 75,
      "level": "낮음|보통|높음|심각",
      "stressType": "급성|만성|복합",
      "stressSources": ["추정 스트레스 원인들"],
      "physiologicalImpact": "생리적 영향 분석",
      "analysis": "다중 지표 통합 스트레스 분석",
      "recommendations": {
        "immediate": ["즉시 실행 방안들"],
        "shortTerm": ["단기 목표들"],
        "longTerm": ["장기 전략들"]
      }
    }
  },
  "overallHealth": {
    "score": 85,
    "grade": "우수|양호|보통|주의|위험",
    "summary": "전반적인 건강 상태 요약 (3-4문장, 의학적 근거 포함)",
    "keyFindings": ["주요 발견사항1", "주요 발견사항2", "주요 발견사항3"],
    "riskFactors": ["위험 요소1", "위험 요소2"],
    "strengths": ["강점1", "강점2"]
  },
  "problemAreas": [
    {
      "area": "문제 영역명 (예: 스트레스 관리)",
      "severity": "경미|중간|심각",
      "description": "구체적 문제 상황 설명",
      "solutions": ["해결방안 1", "해결방안 2", "해결방안 3"]
    }
  ],
  "personalizedRecommendations": {
    "immediate": {
      "lifestyle": ["오늘부터 시작할 수 있는 생활습관 (3가지)"],
      "exercise": ["즉시 실행 가능한 운동 (5분 이내, 3가지)"],
      "breathing": ["즉시 실행 가능한 호흡법 (3가지)"],
      "posture": ["즉시 개선 가능한 자세 관리 (3가지)"]
    },
    "shortTerm": {
      "lifestyle": ["1-4주 생활습관 개선 계획 (3가지)"],
      "exercise": ["단기 운동 계획 (종류, 빈도, 강도, 3가지)"],
      "diet": ["단기 식습관 개선 방안 (3가지)"],
      "sleep": ["단기 수면 개선 계획 (3가지)"],
      "stressManagement": ["단기 스트레스 관리 체계 (3가지)"]
    },
    "longTerm": {
      "lifestyle": ["장기 생활습관 변화 로드맵 (3가지)"],
      "exercise": ["장기 운동 계획 (단계별 발전, 3가지)"],
      "mentalCare": ["장기 정신건강 관리 전략 (3가지)"],
      "socialSupport": ["사회적 지원 체계 구축 (3가지)"],
      "professionalHelp": ["전문가 도움 활용 방안 (3가지)"]
    },
    "occupationSpecific": {
      "workplaceStrategies": ["직장 내 실행 방안 (3가지)"],
      "timeManagement": ["업무 시간 관리 최적화 (3가지)"],
      "environmentalChanges": ["근무 환경 개선 (3가지)"],
      "colleagueInteraction": ["동료 관계 개선 방안 (3가지)"]
    }
  },
  "professionalGuidance": {
    "consultationNeeded": true,
    "recommendedSpecialists": ["추천 전문의"],
    "urgencyLevel": "즉시|1주내|1개월내|정기검진",
    "warningSignals": ["악화 징후들"],
    "emergencyContacts": ["응급 상황 연락처"]
  },
  "followUpPlan": {
    "remeasurement": {
      "schedule": "재측정 권장 주기 (예: 4주 후)",
      "keyMetrics": "주요 모니터링 지표들",
      "improvementTargets": "개선 목표치들"
    },
    "progressTracking": {
      "dailyChecks": ["일일 체크사항 (3가지)"],
      "weeklyReviews": ["주간 검토사항 (3가지)"],
      "monthlyAssessments": ["월간 평가사항 (3가지)"]
    },
    "milestones": [
      {
        "timeframe": "2주 후",
        "goals": "단기 목표",
        "successCriteria": "성공 기준"
      },
      {
        "timeframe": "1개월 후",
        "goals": "중기 목표",
        "successCriteria": "성공 기준"
      },
      {
        "timeframe": "3개월 후",
        "goals": "장기 목표",
        "successCriteria": "성공 기준"
      }
    ]
  }
}
\`\`\`

## 분석 가이드라인

### 기본 분석 원칙
1. **개인 맞춤형 분석**: 나이, 성별, 직업, 생활 패턴을 종합적으로 고려
2. **의학적 근거 기반**: 각 지표의 의학적 의미와 정상 범위 대비 해석
3. **상호 연관성 분석**: EEG, PPG, ACC 데이터 간의 상관관계 분석
4. **측정 품질 반영**: ACC 기반 신뢰성 평가 결과를 분석에 반영
5. **실행 가능성 중시**: 구체적이고 실현 가능한 개선 방안 제시

### 중요한 분석 요구사항
1. **각 지표를 정상값 범위와 비교하여 정확히 분석**
2. **의학적 공식과 생리학적 의미를 기반으로 해석**
3. **측정 품질이 낮을 경우 결과 해석에 주의사항 포함**
4. **3대 건강 영역(정신/신체/스트레스)을 종합적으로 평가**
5. **즉시/단기/장기 실행 계획을 구체적으로 제시**

**반드시 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.**

### 기본 분석 원칙
1. **개인 맞춤형 분석**: 나이, 성별, 직업, 생활 패턴을 종합적으로 고려
2. **의학적 근거 기반**: 각 지표의 의학적 의미와 정상 범위 대비 해석
3. **상호 연관성 분석**: EEG, PPG, ACC 데이터 간의 상관관계 분석
4. **시간적 변화 고려**: 측정 시간대와 개인 생체리듬 반영
5. **환경적 요인 고려**: 측정 환경, 스트레스 상황 등 외부 요인 영향 분석

### 상세 분석 요구사항
1. **정신건강 분석**:
   - 집중력, 이완도, 스트레스 지수의 의학적 해석
   - 좌우뇌 활성도 불균형 분석 및 의미
   - 인지 부하와 정신적 피로도의 상관관계
   - 연령대별 정상 범위 대비 평가
   - 직업 특성에 따른 정신건강 위험 요소 분석

2. **신체건강 분석**:
   - 심박수, 산소포화도의 연령별 정상 범위 대비 평가
   - 심박변이도(HRV) 지표의 자율신경계 상태 해석
   - RMSSD, SDNN, pNN50의 의학적 의미와 상호 관계
   - 스트레스 지수와 회복 지수의 균형 분석
   - 움직임 패턴과 자세 안정성의 신경학적 의미

3. **스트레스 수준 분석**:
   - 다중 생체신호를 통한 종합적 스트레스 평가
   - 급성 스트레스 vs 만성 스트레스 구분
   - 스트레스 원인 추정 및 대응 방안
   - 개인별 스트레스 취약점 분석

### 추천사항 상세화 요구사항
1. **즉시 실행 가능한 방안** (오늘부터 시작):
   - 구체적인 시간, 방법, 빈도 명시
   - 5분 이내 실행 가능한 간단한 방법들
   - 특별한 도구나 비용 없이 가능한 방법들

2. **단기 개선 방안** (1-4주):
   - 주차별 단계적 실행 계획
   - 측정 가능한 목표 설정
   - 진행 상황 점검 방법 제시

3. **중장기 개선 방안** (1-6개월):
   - 생활 습관 변화 로드맵
   - 전문가 도움이 필요한 경우 구체적 안내
   - 예상 개선 효과와 시기 명시

4. **직업별 특화 조언**:
   - 근무 환경 내에서 실행 가능한 방법
   - 해당 직업군 특성에 맞는 건강 관리법
   - 직업 관련 건강 위험 요소 예방법
   - 동료, 상사와의 관계에서 활용 가능한 방법

5. **사회적 지원 체계 활용**:
   - 구체적인 기관명, 연락처, 이용 방법
   - 온라인/오프라인 자원 구분
   - 비용, 접근성, 효과성 정보 포함

### 문제 영역 식별 및 해결 방안
1. **문제 우선순위 설정**: 건강 위험도와 개선 가능성을 고려한 순위
2. **단계별 해결 방안**: 즉시 → 단기 → 중장기 해결책
3. **예상 개선 효과**: 구체적인 수치와 기간 제시
4. **진행 상황 모니터링**: 자가 점검 방법과 전문가 상담 시점

### 개인화 요소 강화
1. **연령대별 특성**: 각 연령대의 생리적, 심리적 특성 반영
2. **성별 차이**: 호르몬, 신체 구조 등 성별 특성 고려
3. **직업 환경**: 근무 시간, 스트레스 요인, 물리적 환경 고려
4. **생활 패턴**: 수면, 식사, 운동 패턴 분석 및 개선 방안

### 추후 관리 방안
1. **정기적 재측정**: 권장 주기와 측정 포인트
2. **전문가 상담**: 상담이 필요한 경우와 적절한 전문가 유형
3. **자가 관리**: 일상에서 지속 가능한 건강 관리 방법
4. **응급 상황**: 즉시 전문의 상담이 필요한 증상들

**중요**: 의학적 진단이 아닌 건강 관리 참고용 정보임을 명시하고, 심각한 이상이 의심되는 경우 즉시 전문의 상담을 권하세요. 모든 추천사항은 개인의 현재 건강 상태와 의학적 이력을 고려하여 전문의와 상담 후 실행하도록 안내하세요.
`;
  }

  /**
   * AI 건강 분석 수행
   */
  /**
   * 단계적 건강 분석 수행 (새로운 모듈형 아키텍처 사용)
   */
  static async analyzeHealth(
    personalInfo: PersonalInfo,
    measurementData: MeasurementData
  ): Promise<AIAnalysisResult> {
    try {
      console.log('🔍 Gemini AI 종합 건강 분석 시작 (새로운 모듈형 아키텍처)');
      console.log('⏱️ 예상 소요 시간: 약 10-20초');
      
      // 새로운 ComprehensiveAnalysisService 사용
      const result = await ComprehensiveAnalysisService.performComprehensiveAnalysis(personalInfo, measurementData);
      
      console.log('✅ Gemini AI 종합 건강 분석 완료');
      return result;
      
    } catch (error) {
      console.error('❌ Gemini AI 건강 분석 실패:', error);
      throw new Error(`AI 분석 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * 분석 결과 검증
   */
  private static validateAnalysisResult(result: any): void {
    const requiredFields = [
      'overallHealth',
      'detailedAnalysis',
      'problemAreas',
      'personalizedRecommendations',
      'followUpActions'
    ];

    for (const field of requiredFields) {
      if (!result[field]) {
        throw new Error(`분석 결과에 필수 필드 '${field}'가 없습니다.`);
      }
    }

    // 점수 범위 검증
    if (result.overallHealth.score < 0 || result.overallHealth.score > 100) {
      throw new Error('전체 건강 점수가 유효하지 않습니다.');
    }

    // 문제 영역 개수 제한
    if (result.problemAreas.length > 3) {
      result.problemAreas = result.problemAreas.slice(0, 3);
    }
  }

  /**
   * 테스트용 분석 수행 (API 키 없이)
   */
  static async testAnalysis(
    personalInfo: PersonalInfo,
    measurementData: MeasurementData
  ): Promise<AIAnalysisResult> {
    console.log('🔍 테스트 분석 시작 - 실제 AI 분석 시간 시뮬레이션');
    
    // 🔧 실제 AI 분석 시간 시뮬레이션 (3-5초)
    const analysisSteps = [
      { step: '정신건강 분석', delay: 800 },
      { step: '신체건강 분석', delay: 1000 },
      { step: '스트레스 분석', delay: 900 },
      { step: '종합 분석', delay: 1200 },
      { step: '맞춤형 추천 생성', delay: 700 }
    ];
    
    for (const { step, delay } of analysisSteps) {
      console.log(`🔍 ${step} 중...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    console.log('🔍 테스트 분석 완료 - 결과 생성');
    
    // 개발/테스트용 더미 데이터
    // birthDate에서 년/월/일 추출 (호환성 지원)
    let birthYear = personalInfo.birthYear;
    
    if (!birthYear && personalInfo.birthDate) {
      const [year] = personalInfo.birthDate.split('-').map(Number);
      birthYear = year;
    }
    
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    
    // 직업별 맞춤형 조언 생성
    const occupationLabels = {
      'soldier': '군인',
      'elementary': '초등학생',
      'middle_school': '중학생',
      'high_school': '고등학생',
      'university': '대학생',
      'housewife': '전업주부',
      'office_worker': '직장인',
      'entrepreneur': '사업가'
    };
    
    const occupationLabel = occupationLabels[personalInfo.occupation as keyof typeof occupationLabels] || personalInfo.occupation;
    
    // 직업별 맞춤형 추천사항 생성
    const getOccupationSpecificRecommendations = (occupation: string) => {
      const recommendations = {
        'soldier': {
          lifestyle: ["부대 내 규칙적인 생활 패턴 유지", "면회, 외박 시 충분한 휴식", "동기들과 건전한 관계 유지"],
          exercise: ["부대 내 체력단련 적극 참여", "개인 시간 활용한 스트레칭", "동기들과 함께하는 단체 운동"],
          mentalCare: ["부대 내 상담관과 정기적 면담", "분대장, 소대장과 소통", "군 복무 중 정신건강 프로그램 참여"]
        },
        'elementary': {
          lifestyle: ["규칙적인 수면 시간 유지", "충분한 놀이 시간 확보", "부모님과 함께하는 시간 늘리기"],
          exercise: ["학교 체육 시간 적극 참여", "친구들과 함께하는 놀이 활동", "가족과 함께하는 야외 활동"],
          mentalCare: ["부모님, 선생님과 자주 대화하기", "학교 상담교사 활용", "친구들과 건전한 관계 유지"]
        },
        'middle_school': {
          lifestyle: ["규칙적인 생활 패턴 유지", "스마트폰 사용 시간 조절", "충분한 수면 시간 확보"],
          exercise: ["학교 체육 활동 적극 참여", "방과 후 스포츠 활동", "가족과 함께하는 운동"],
          mentalCare: ["부모님, 담임선생님과 소통", "학교 상담실 활용", "또래 상담 프로그램 참여"]
        },
        'high_school': {
          lifestyle: ["입시 스트레스 관리", "규칙적인 학습 패턴 유지", "충분한 수면 시간 확보"],
          exercise: ["틈틈이 할 수 있는 간단한 운동", "계단 오르내리기", "스트레칭 습관화"],
          mentalCare: ["진로상담교사와 상담", "부모님과 진로 대화", "청소년상담복지센터 활용"]
        },
        'university': {
          lifestyle: ["규칙적인 생활 패턴 유지", "취업 준비 스트레스 관리", "건전한 대인관계 유지"],
          exercise: ["캠퍼스 내 체육시설 활용", "동아리 활동 참여", "친구들과 함께하는 운동"],
          mentalCare: ["학생상담센터 활용", "교수님과 상담", "동아리, 학회 활동 참여"]
        },
        'housewife': {
          lifestyle: ["규칙적인 개인 시간 확보", "육아 스트레스 관리", "사회적 관계 유지"],
          exercise: ["집에서 할 수 있는 홈트레이닝", "아이와 함께하는 산책", "육아맘 모임 참여"],
          mentalCare: ["지역 육아종합지원센터 활용", "육아맘 커뮤니티 참여", "정신건강복지센터 상담"]
        },
        'office_worker': {
          lifestyle: ["워라밸 실현", "규칙적인 퇴근 시간 유지", "충분한 휴식 시간 확보"],
          exercise: ["점심시간 활용한 산책", "출퇴근 시 계단 이용", "주말 운동 활동"],
          mentalCare: ["직장 내 EAP 프로그램 활용", "동료와의 건전한 관계 유지", "취미 활동 시간 확보"]
        },
        'entrepreneur': {
          lifestyle: ["규칙적인 생활 패턴 유지", "사업 스트레스 관리", "충분한 휴식 시간 확보"],
          exercise: ["바쁜 일정 중 틈틈이 운동", "사업가 네트워크 운동 모임", "스트레스 해소 운동"],
          mentalCare: ["사업가 멘토링 프로그램 참여", "동업자와의 소통", "전문 상담사 도움"]
        }
      };
      
      return recommendations[occupation as keyof typeof recommendations] || {
        lifestyle: ["규칙적인 생활 패턴 유지", "충분한 수면 시간 확보", "스트레스 관리"],
        exercise: ["규칙적인 운동", "스트레칭", "유산소 운동"],
        mentalCare: ["전문가 상담", "사회적 관계 유지", "취미 활동"]
      };
    };
    
    const occupationRecommendations = getOccupationSpecificRecommendations(personalInfo.occupation);
    
    return {
      overallHealth: {
        score: 82,
        grade: "양호",
        summary: `${personalInfo.name}님(${age}세, ${occupationLabel})의 전반적인 건강 상태는 양호한 편입니다. 측정된 생체신호들이 대부분 정상 범위에 있으며, ${occupationLabel}의 특성을 고려한 맞춤형 관리를 통해 더욱 건강한 상태를 유지할 수 있습니다. 특히 스트레스 관리에 집중하면 전반적인 건강 개선 효과를 기대할 수 있습니다.`,
        keyFindings: [
          "심혈관 건강 지표가 연령대 평균보다 우수함",
          "뇌파 활성도가 적절한 수준을 유지하고 있음",
          "스트레스 수준이 관리 가능한 범위 내에 있음"
        ],
        riskFactors: [
          "직업 특성상 지속적인 스트레스 노출",
          "정신적 피로도가 약간 높은 편"
        ],
        strengths: [
          "우수한 심혈관 건강 상태",
          "안정적인 자율신경계 기능"
        ]
      },
      detailedAnalysis: {
        mentalHealth: {
          score: 78,
          status: "양호",
          analysis: `뇌파 분석 결과 집중력 지수가 ${measurementData.eegMetrics.focusIndex?.value?.toFixed(2) || 'N/A'}로 연령대 평균 수준을 보이고 있습니다. 이완도는 ${measurementData.eegMetrics.relaxationIndex?.value?.toFixed(3) || 'N/A'}로 적절한 수준이며, 좌우뇌 활성도 균형도 ${measurementData.eegMetrics.hemisphericBalance?.value?.toFixed(3) || 'N/A'}로 양호합니다. 다만 인지 부하가 ${measurementData.eegMetrics.cognitiveLoad?.value?.toFixed(3) || 'N/A'}로 약간 높아 정신적 피로 관리가 필요합니다. ${occupationLabel}의 특성상 지속적인 정신적 집중이 필요하므로 적절한 휴식과 이완 기법이 중요합니다.`,
          keyMetrics: {
            concentration: `집중력 지수 ${measurementData.eegMetrics.focusIndex?.value?.toFixed(2) || 'N/A'} - 연령대 평균 수준`,
            relaxation: `이완도 지수 ${measurementData.eegMetrics.relaxationIndex?.value?.toFixed(3) || 'N/A'} - 적절한 수준`,
            brainBalance: `좌우뇌 균형 ${measurementData.eegMetrics.hemisphericBalance?.value?.toFixed(3) || 'N/A'} - 양호한 균형`,
            cognitiveLoad: `인지 부하 ${measurementData.eegMetrics.cognitiveLoad?.value?.toFixed(3) || 'N/A'} - 약간 높음, 관리 필요`
          },
          immediateActions: [
            "매시간 5분씩 심호흡 연습 (4-7-8 호흡법)",
            "눈 운동 및 목 스트레칭 (20-20-20 규칙 적용)"
          ],
          shortTermGoals: [
            "주 3회 이상 20분 명상 실습으로 이완도 10% 향상",
            "수면 시간 7-8시간 유지하여 정신적 피로도 개선"
          ],
          longTermStrategy: [
            "스트레스 관리 기법 체계화하여 인지 부하 20% 감소",
            "정기적인 정신건강 점검 및 전문가 상담 체계 구축"
          ]
        },
        physicalHealth: {
          score: 85,
          status: "우수",
          analysis: `심박수 ${measurementData.ppgMetrics.heartRate?.value || 'N/A'} BPM은 연령대 정상 범위에 있으며, 산소포화도 ${measurementData.ppgMetrics.spo2?.value || 'N/A'}%로 우수한 수준입니다. 심박변이도 지표인 RMSSD ${measurementData.ppgMetrics.rmssd?.value || 'N/A'}ms, SDNN ${measurementData.ppgMetrics.sdnn?.value || 'N/A'}ms는 자율신경계의 균형이 잘 유지되고 있음을 보여줍니다. 회복 지수 ${measurementData.ppgMetrics.sdnn?.value || 'N/A'}는 양호하여 신체적 회복 능력이 우수합니다. 전반적으로 심혈관 건강이 매우 양호한 상태입니다.`,
          keyMetrics: {
            heartRate: `심박수 ${measurementData.ppgMetrics.heartRate?.value || 'N/A'}BPM - 정상 범위`,
            hrv: `HRV ${measurementData.ppgMetrics.lfHfRatio?.value || 'N/A'} - 자율신경계 균형 양호`,
            oxygenSaturation: `SpO2 ${measurementData.ppgMetrics.spo2?.value || 'N/A'}% - 우수한 수준`,
            autonomicBalance: `자율신경계 균형 우수 (RMSSD: ${measurementData.ppgMetrics.rmssd?.value || 'N/A'}ms)`
          },
          immediateActions: [
            "매일 10분 이상 유산소 운동 (계단 오르기, 빠른 걷기)",
            "충분한 수분 섭취 (하루 2L 이상)"
          ],
          shortTermGoals: [
            "주 3회 30분 이상 중강도 운동으로 심폐 기능 5% 향상",
            "규칙적인 식사 시간 유지하여 대사 건강 개선"
          ],
          longTermStrategy: [
            "연간 정기 건강검진을 통한 심혈관 건강 모니터링",
            "연령 증가에 따른 예방적 건강 관리 체계 구축"
          ]
        },
        stressLevel: {
          score: 72,
          level: "보통",
          analysis: `종합적인 스트레스 지수는 ${measurementData.eegMetrics.stressIndex?.value?.toFixed(1) || 'N/A'}로 보통 수준에 있습니다. 심박변이도 기반 자율신경 균형 ${measurementData.ppgMetrics.lfHfRatio?.value?.toFixed(1) || 'N/A'}와 함께 분석하면 주로 정신적 스트레스가 우세한 상태입니다. 자세 안정성 ${measurementData.accMetrics.postureStability?.toFixed(1) || 'N/A'}는 양호하여 신체적 긴장도는 높지 않습니다. ${occupationLabel}의 특성상 발생하는 스트레스로 보이며, 적절한 관리를 통해 개선 가능한 수준입니다.`,
          stressType: "정신적 스트레스 우세 (급성 스트레스 패턴)",
          stressSources: [
            `${occupationLabel} 업무 특성으로 인한 정신적 부담`,
            "지속적인 집중력 요구로 인한 인지적 피로"
          ],
          physiologicalImpact: "자율신경계에 경미한 영향, 심혈관계는 양호한 상태 유지",
          immediateActions: [
            "업무 중 매 2시간마다 5분 휴식 및 스트레칭",
            "점심시간 10분 이상 야외 산책"
          ],
          shortTermGoals: [
            "스트레스 관리 기법 학습으로 스트레스 지수 15% 감소",
            "규칙적인 운동으로 스트레스 회복력 향상"
          ],
          longTermStrategy: [
            "직업 특성에 맞는 스트레스 관리 시스템 구축",
            "정기적인 스트레스 수준 모니터링 및 조기 개입"
          ]
        }
      },
      problemAreas: [
        {
          area: "스트레스 관리",
          severity: "중간",
          description: "측정된 스트레스 지수가 평균보다 높게 나타났습니다. 지속적인 스트레스는 장기적으로 심혈관 건강, 면역 기능, 정신건강에 부정적 영향을 줄 수 있습니다.",
          solutions: [
            "매일 아침 10분 명상 (헤드스페이스 앱 활용)",
            "업무 중 1시간마다 3분 심호흡 (4-7-8 호흡법)",
            "점심시간 15분 산책 (자연광 노출)"
          ]
        }
      ],
      personalizedRecommendations: {
        immediate: {
          lifestyle: [
            "기상 후 5분 스트레칭 (목, 어깨, 허리)",
            "업무 시작 전 3분 명상 (마음챙김 호흡)",
            "매시간 정각에 1분 심호흡 (알람 설정)"
          ],
          exercise: [
            "계단 오르기 (엘리베이터 대신 계단 이용)",
            "책상에서 목 돌리기 (시계방향 5회, 반시계방향 5회)",
            "어깨 으쓱하기 (10회씩 3세트)"
          ],
          breathing: [
            "4-7-8 호흡법 (4초 흡입, 7초 참기, 8초 내쉬기)",
            "복식호흡 (배가 나오도록 천천히 호흡)",
            "코호흡 (입 대신 코로만 호흡하기)"
          ],
          posture: [
            "모니터 높이 눈높이 맞추기",
            "의자 등받이에 허리 밀착시키기",
            "발을 바닥에 평평하게 놓기"
          ]
        },
        shortTerm: {
          lifestyle: occupationRecommendations.lifestyle,
          exercise: occupationRecommendations.exercise,
          diet: [
            "규칙적인 식사 시간 유지 (아침 8시, 점심 12시, 저녁 6시)",
            "충분한 수분 섭취 (하루 2L, 시간당 한 컵)",
            "가공식품 섭취 줄이기 (주 2회 이하로 제한)"
          ],
          sleep: [
            "일정한 수면 시간 유지 (밤 11시 취침, 아침 7시 기상)",
            "수면 환경 개선 (실온 18-20도, 어둡고 조용한 환경)",
            "취침 1시간 전 디지털 기기 사용 중단"
          ],
          stressManagement: [
            "주 3회 20분 명상 실습 (월, 수, 금)",
            "스트레스 일기 작성 (매일 저녁 5분)",
            "주말 스트레스 해소 활동 (취미, 운동, 사교)"
          ]
        },
        longTerm: {
          lifestyle: [
            "월별 건강 목표 설정 및 점검",
            "계절별 생활 패턴 조정",
            "연간 건강 관리 계획 수립"
          ],
          exercise: [
            "단계별 운동 강도 증가 (초급 → 중급 → 고급)",
            "다양한 운동 종목 도전 (유산소, 근력, 유연성)",
            "운동 파트너 또는 그룹 활동 참여"
          ],
          mentalCare: occupationRecommendations.mentalCare,
          socialSupport: [
            "가족, 친구와의 정기적인 만남",
            "직업 관련 커뮤니티 참여",
            "멘토링 관계 구축"
          ],
          professionalHelp: [
            "정기적인 건강검진 (연 1회)",
            "스트레스 관리 전문가 상담 (필요시)",
            "영양사, 운동 전문가 상담 (분기별)"
          ]
        },
        occupationSpecific: {
          workplaceStrategies: [
            "업무 공간 환경 개선 (조명, 의자, 모니터 높이)",
            "업무 중 정기적 휴식 시간 확보",
            "동료와의 스트레스 공유 및 해소"
          ],
          timeManagement: [
            "우선순위 기반 업무 계획 수립",
            "집중 시간과 휴식 시간 구분",
            "업무 외 시간 보호"
          ],
          environmentalChanges: [
            "책상 주변 식물 배치 (스트레스 완화)",
            "자연광 활용 (창가 자리 선호)",
            "소음 차단 및 집중 환경 조성"
          ],
          colleagueInteraction: [
            "동료와의 건설적인 소통",
            "업무 스트레스 공유 및 해결책 모색",
            "팀 내 건강 관리 문화 조성"
          ]
        }
      },
      supportResources: {
        professionalHelp: [
          {
            type: "정신건강의학과 전문의",
            when: "스트레스 증상이 2주 이상 지속될 때",
            how: "병원 예약 또는 온라인 상담",
            cost: "보험 적용 시 1-2만원",
            accessibility: "전국 병원 및 온라인 플랫폼 이용 가능"
          },
          {
            type: "임상심리사",
            when: "스트레스 관리 기법 학습이 필요할 때",
            how: "심리상담센터 또는 병원 심리과",
            cost: "회당 5-10만원",
            accessibility: "지역 상담센터 및 온라인 상담 가능"
          }
        ],
        onlineResources: [
          "마인드풀니스 앱 (헤드스페이스, 캄)",
          "온라인 스트레스 관리 프로그램",
          "정신건강 자가진단 도구"
        ],
        communitySupport: [
          "직장인 스트레스 관리 모임",
          "명상 및 요가 클래스",
          "건강 관리 온라인 커뮤니티"
        ],
        emergencyContacts: [
          "정신건강 위기상담전화: 1577-0199",
          "생명의전화: 1588-9191"
        ]
      },
      followUpPlan: {
        remeasurement: {
          schedule: "4주 후 재측정 권장",
          keyMetrics: "주요 모니터링 지표들",
          improvementTargets: "개선 목표치들"
        },
        progressTracking: {
          dailyChecks: ["일일 체크사항 (3가지)"],
          weeklyReviews: ["주간 검토사항 (3가지)"],
          monthlyAssessments: ["월간 평가사항 (3가지)"]
        },
        milestones: [
          {
            timeframe: "2주 후",
            goals: "단기 목표",
            successCriteria: "성공 기준"
          },
          {
            timeframe: "1개월 후",
            goals: "중기 목표",
            successCriteria: "성공 기준"
          },
          {
            timeframe: "3개월 후",
            goals: "장기 목표",
            successCriteria: "성공 기준"
          }
        ],
        adjustmentTriggers: [
          "건강 지표 악화 시 즉시 재측정",
          "목표 달성률 50% 미만 시 계획 수정",
          "새로운 증상 발생 시 전문가 상담"
        ]
      },
      
      // 🔧 필수 필드 추가: followUpActions
      followUpActions: [
        "2주 후 재측정을 통한 건강 상태 변화 추적",
        "매일 스트레스 수준 자가 체크 및 기록",
        "주 1회 건강 관리 목표 달성도 점검",
        "1개월 후 전문가 상담 고려",
        "지속적인 생활습관 개선 실천 및 모니터링"
      ],
      
      timestamp: Date.now(),
      personalInfo,
      measurementData,
      metadata: {
        modelUsed: 'test-model',
        promptTokens: 0,
        responseTokens: 0,
        totalTokens: 0
      }
    };
  }

  // ===== 단계별 분석 메서드들 =====

  /**
   * 1단계: 정신건강 분석 (EEG 기반)
   */
  private static async analyzeMentalHealth(
    personalInfo: PersonalInfo,
    measurementData: MeasurementData
  ): Promise<MentalHealthReport> {
    const prompt = this.generateMentalHealthPrompt(personalInfo, measurementData);
    const response = await this.makeRequest(prompt);
    const responseText = this.extractTextFromResponse(response);
    
    // JSON 추출 - 다양한 패턴 시도
    const jsonPatterns = [
      /```json\s*([\s\S]*?)\s*```/,
      /```json([\s\S]*?)```/,
      /```\s*([\s\S]*?)\s*```/,
      /```([\s\S]*?)```/,
      /\{[\s\S]*\}/
    ];
    
    for (const pattern of jsonPatterns) {
      const match = responseText.match(pattern);
      if (match) {
        try {
          const jsonText = match[1] || match[0];
          return JSON.parse(jsonText);
        } catch (error) {
          console.warn('정신건강 분석 JSON 파싱 실패, 다음 패턴 시도:', error);
          continue;
        }
      }
    }
    
    console.error('정신건강 분석 응답 파싱 실패. 응답 텍스트:', responseText);
    throw new Error('정신건강 분석 응답에서 JSON 형식을 찾을 수 없습니다.');
  }

  /**
   * 2단계: 신체건강 분석 (PPG 기반)
   */
  private static async analyzePhysicalHealth(
    personalInfo: PersonalInfo,
    measurementData: MeasurementData
  ): Promise<PhysicalHealthReport> {
    const prompt = this.generatePhysicalHealthPrompt(personalInfo, measurementData);
    const response = await this.makeRequest(prompt);
    const responseText = this.extractTextFromResponse(response);
    
    // JSON 추출 - 다양한 패턴 시도
    const jsonPatterns = [
      /```json\s*([\s\S]*?)\s*```/,
      /```json([\s\S]*?)```/,
      /```\s*([\s\S]*?)\s*```/,
      /```([\s\S]*?)```/,
      /\{[\s\S]*\}/
    ];
    
    for (const pattern of jsonPatterns) {
      const match = responseText.match(pattern);
      if (match) {
        try {
          const jsonText = match[1] || match[0];
          return JSON.parse(jsonText);
        } catch (error) {
          console.warn('신체건강 분석 JSON 파싱 실패, 다음 패턴 시도:', error);
          continue;
        }
      }
    }
    
    console.error('신체건강 분석 응답 파싱 실패. 응답 텍스트:', responseText);
    throw new Error('신체건강 분석 응답에서 JSON 형식을 찾을 수 없습니다.');
  }

  /**
   * 3단계: 스트레스 건강 분석 (종합 분석)
   */
  private static async analyzeStressHealth(
    personalInfo: PersonalInfo,
    measurementData: MeasurementData
  ): Promise<StressHealthReport> {
    const prompt = this.generateStressHealthPrompt(personalInfo, measurementData);
    const response = await this.makeRequest(prompt);
    const responseText = this.extractTextFromResponse(response);
    
    // JSON 추출 - 다양한 패턴 시도
    const jsonPatterns = [
      /```json\s*([\s\S]*?)\s*```/,
      /```json([\s\S]*?)```/,
      /```\s*([\s\S]*?)\s*```/,
      /```([\s\S]*?)```/,
      /\{[\s\S]*\}/
    ];
    
    for (const pattern of jsonPatterns) {
      const match = responseText.match(pattern);
      if (match) {
        try {
          const jsonText = match[1] || match[0];
          return JSON.parse(jsonText);
        } catch (error) {
          console.warn('스트레스 건강 분석 JSON 파싱 실패, 다음 패턴 시도:', error);
          continue;
        }
      }
    }
    
    console.error('스트레스 건강 분석 응답 파싱 실패. 응답 텍스트:', responseText);
    throw new Error('스트레스 건강 분석 응답에서 JSON 형식을 찾을 수 없습니다.');
  }

  /**
   * 4단계: 개인화된 종합 분석 및 대응 방안
   */
  private static async generateComprehensiveAnalysis(
    personalInfo: PersonalInfo,
    measurementData: MeasurementData,
    mentalHealthReport: MentalHealthReport,
    physicalHealthReport: PhysicalHealthReport,
    stressHealthReport: StressHealthReport
  ): Promise<ComprehensiveAnalysis> {
    const prompt = this.generateComprehensiveAnalysisPrompt(
      personalInfo,
      measurementData,
      mentalHealthReport,
      physicalHealthReport,
      stressHealthReport
    );
    
    // 🔧 종합 분석용 특별 설정 사용 (더 긴 타임아웃과 더 많은 토큰)
    const response = await this.makeRequest(prompt, {
      ...this.COMPREHENSIVE_ANALYSIS_CONFIG,
      model: 'comprehensive-analysis'  // 토큰 제한 증가 트리거
    });
    const responseText = this.extractTextFromResponse(response);
    
    // JSON 추출 - 다양한 패턴 시도
    const jsonPatterns = [
      /```json\s*([\s\S]*?)\s*```/,
      /```json([\s\S]*?)```/,
      /```\s*([\s\S]*?)\s*```/,
      /```([\s\S]*?)```/,
      /\{[\s\S]*\}/
    ];
    
    for (const pattern of jsonPatterns) {
      const match = responseText.match(pattern);
      if (match) {
        try {
          const jsonText = match[1] || match[0];
          return JSON.parse(jsonText);
        } catch (error) {
          console.warn('종합 분석 JSON 파싱 실패, 다음 패턴 시도:', error);
          continue;
        }
      }
    }
    
    console.error('종합 분석 응답 파싱 실패. 응답 텍스트:', responseText);
    throw new Error('종합 분석 응답에서 JSON 형식을 찾을 수 없습니다.');
  }

  /**
   * 최종 결과 통합
   */
  private static combineAnalysisResults(
    personalInfo: PersonalInfo,
    measurementData: MeasurementData,
    mentalHealthReport: MentalHealthReport,
    physicalHealthReport: PhysicalHealthReport,
    stressHealthReport: StressHealthReport,
    comprehensiveAnalysis: ComprehensiveAnalysis
  ): AIAnalysisResult {
    return {
      overallHealth: {
        score: comprehensiveAnalysis.overallScore,
        grade: this.getHealthGrade(comprehensiveAnalysis.overallScore),
        summary: comprehensiveAnalysis.personalizedSummary,
        keyFindings: [
          ...mentalHealthReport.recommendations.slice(0, 2),
          ...physicalHealthReport.recommendations.slice(0, 2)
        ],
        riskFactors: [
          ...mentalHealthReport.concerns,
          ...physicalHealthReport.concerns
        ],
        strengths: [
          ...this.extractStrengths(mentalHealthReport),
          ...this.extractStrengths(physicalHealthReport)
        ]
      },
      detailedAnalysis: {
        mentalHealth: {
          score: mentalHealthReport.score,
          status: mentalHealthReport.status,
          analysis: mentalHealthReport.analysis,
          keyMetrics: {
            concentration: mentalHealthReport.keyMetrics.concentration || "집중력 지수 분석",
            relaxation: mentalHealthReport.keyMetrics.relaxation || "이완도 지수 분석",
            brainBalance: mentalHealthReport.keyMetrics.brainBalance || "좌우뇌 균형 분석",
            cognitiveLoad: mentalHealthReport.keyMetrics.cognitiveLoad || "인지 부하 분석"
          },
          immediateActions: comprehensiveAnalysis.immediateActions.slice(0, 2),
          shortTermGoals: comprehensiveAnalysis.shortTermGoals.slice(0, 2),
          longTermStrategy: comprehensiveAnalysis.longTermStrategy.slice(0, 2)
        },
        physicalHealth: {
          score: physicalHealthReport.score,
          status: physicalHealthReport.status,
          analysis: physicalHealthReport.analysis,
          keyMetrics: {
            heartRate: physicalHealthReport.keyMetrics.heartRate || "심박수 분석",
            hrv: physicalHealthReport.keyMetrics.rmssd || "심박변이도 분석",
            oxygenSaturation: physicalHealthReport.keyMetrics.spo2 || "산소포화도 분석",
            autonomicBalance: physicalHealthReport.keyMetrics.lfHfRatio || "자율신경 균형 분석"
          },
          immediateActions: comprehensiveAnalysis.immediateActions.slice(2, 4),
          shortTermGoals: comprehensiveAnalysis.shortTermGoals.slice(2, 4),
          longTermStrategy: comprehensiveAnalysis.longTermStrategy.slice(2, 4)
        },
        stressLevel: {
          score: stressHealthReport.score,
          level: stressHealthReport.status,
          analysis: stressHealthReport.analysis,
          stressType: "종합 스트레스",
          stressSources: stressHealthReport.stressFactors,
          physiologicalImpact: "스트레스로 인한 생리적 영향 분석",
          immediateActions: comprehensiveAnalysis.immediateActions.slice(4, 6),
          shortTermGoals: comprehensiveAnalysis.shortTermGoals.slice(4, 6),
          longTermStrategy: comprehensiveAnalysis.longTermStrategy.slice(4, 6)
        }
      },
      // 🔧 수정: 실제 분석 결과를 기반으로 문제 영역 동적 생성
      problemAreas: this.identifyProblemAreasFromAnalysis(
        mentalHealthReport,
        physicalHealthReport,
        stressHealthReport,
        measurementData
      ),
      personalizedRecommendations: {
        immediate: {
          lifestyle: comprehensiveAnalysis.immediateActions.slice(0, 3),
          exercise: comprehensiveAnalysis.immediateActions.slice(3, 6),
          breathing: ["4-7-8 호흡법", "복식호흡", "코호흡"],
          posture: ["올바른 자세 유지", "정기적 스트레칭", "작업 환경 개선"]
        },
        shortTerm: {
          lifestyle: comprehensiveAnalysis.shortTermGoals.slice(0, 3),
          exercise: comprehensiveAnalysis.shortTermGoals.slice(3, 6),
          diet: ["규칙적인 식사", "충분한 수분 섭취", "균형 잡힌 영양"],
          sleep: ["규칙적인 수면 패턴", "수면 환경 개선", "수면 위생 관리"],
          stressManagement: comprehensiveAnalysis.shortTermGoals.slice(6, 9)
        },
        longTerm: {
          lifestyle: comprehensiveAnalysis.longTermStrategy.slice(0, 3),
          exercise: comprehensiveAnalysis.longTermStrategy.slice(3, 6),
          mentalCare: comprehensiveAnalysis.longTermStrategy.slice(6, 9),
          socialSupport: ["사회적 관계 강화", "커뮤니티 참여", "전문가 네트워크"],
          professionalHelp: ["정기 건강검진", "전문가 상담", "맞춤형 치료"]
        },
        occupationSpecific: {
          workplaceStrategies: comprehensiveAnalysis.occupationSpecificAdvice.slice(0, 3),
          timeManagement: comprehensiveAnalysis.occupationSpecificAdvice.slice(3, 6),
          environmentalChanges: comprehensiveAnalysis.occupationSpecificAdvice.slice(6, 9),
          colleagueInteraction: comprehensiveAnalysis.occupationSpecificAdvice.slice(9, 12)
        }
      },
      supportResources: {
        professionalHelp: [
          {
            type: "정신건강의학과 전문의",
            when: "스트레스 증상이 2주 이상 지속될 때",
            how: "병원 예약 또는 온라인 상담",
            cost: "보험 적용 시 1-2만원",
            accessibility: "전국 병원 및 온라인 플랫폼 이용 가능"
          }
        ],
        onlineResources: ["마인드풀니스 앱", "온라인 상담", "자가진단 도구"],
        communitySupport: ["스트레스 관리 모임", "명상 클래스", "건강 커뮤니티"],
        emergencyContacts: ["정신건강 위기상담전화: 1577-0199"]
      },
      followUpPlan: {
        remeasurement: {
          schedule: "4주 후 재측정 권장",
          keyMetrics: "스트레스 지수, 수면 질, 집중력 개선도",
          improvementTargets: "스트레스 지수 20% 감소, 수면 질 개선"
        },
        progressTracking: {
          dailyChecks: ["수면 시간 체크", "스트레스 수준 평가", "운동 실천 여부"],
          weeklyReviews: ["주간 패턴 분석", "목표 달성도 점검", "개선 계획 수립"],
          monthlyAssessments: ["전반적 건강 변화", "기법 효과성 검토", "장기 목표 점검"]
        },
        milestones: comprehensiveAnalysis.followUpPlan.map((plan, index) => ({
          timeframe: `${index + 1}개월 후`,
          goals: plan,
          successCriteria: "목표 달성 기준"
        })),
        adjustmentTriggers: ["스트레스 수준 지속", "수면 장애 미개선", "새로운 건강 문제"]
      },
      
      // 🔧 필수 필드 추가: followUpActions
      followUpActions: comprehensiveAnalysis.followUpPlan,
      
      timestamp: Date.now(),
      personalInfo,
      measurementData,
      metadata: {
        modelUsed: this.DEFAULT_CONFIG.model,
        promptTokens: 0,
        responseTokens: 0,
        totalTokens: 0
      }
    };
  }

  // ===== 단계별 프롬프트 생성 메서드들 =====

  /**
   * 정신건강 분석 프롬프트 생성
   */
  private static generateMentalHealthPrompt(
    personalInfo: PersonalInfo,
    measurementData: MeasurementData
  ): string {
    const age = this.calculateAge(personalInfo);
    const occupationLabel = this.getOccupationLabel(personalInfo.occupation, personalInfo.customOccupation);
    const qualityAssessment = this.assessMeasurementQuality(measurementData.accMetrics);

    return `
당신은 신경과학 박사 학위를 보유한 뇌파(EEG) 분석 전문 건강 분석 AI입니다. 15년 이상의 연구 경험과 최신 뇌과학 연구를 바탕으로 정신건강 상태를 종합적으로 분석해주세요.

**중요 지침:**
- 이 분석은 의료 정보 수준의 건강 참고 자료이며, 의료 진단이나 치료를 대체하지 않습니다.
- 특정 제품명, 브랜드명, 앱 이름 등은 절대 언급하지 마세요.
- 일반적인 건강 관리 방법과 생활습관 개선 방안만 제시하세요.
- "전문가 소견", "정신 건강 평가", "정신 건강 관리 가이드" 등의 의료 행위 관련 표현은 사용하지 마세요.
- 분석 결과에서 직업을 언급할 때는 반드시 "${occupationLabel}"로 표기하고, "military_medic" 같은 원본 코드는 절대 사용하지 마세요.

## 개인 정보 및 맥락 분석
- 이름: ${personalInfo.name}
- 나이: ${age}세 (${this.getAgeGroup(age)} 연령대 특성 고려)
- 성별: ${personalInfo.gender === 'male' ? '남성' : '여성'} (성별 특이적 뇌파 패턴 고려)
- 직업: ${occupationLabel} (직업적 인지 부하 및 스트레스 요인 고려)

## 뇌파(EEG) 정밀 분석 데이터
### 인지 기능 지표
- 집중력 지수: ${(measurementData.eegMetrics as any).focusIndex?.value?.toFixed(3) || 'N/A'} (정상범위: ${(measurementData.eegMetrics as any).focusIndex?.normalRange || '1.8-2.4'})
  * 전전두엽 실행 기능 반영, 주의 집중 능력 및 과제 수행 효율성 평가
- 인지 부하: ${measurementData.eegMetrics.cognitiveLoad} (정상범위: 0.3-0.8)
  * 작업 기억 용량 및 정보 처리 효율성, 인지적 피로도 반영

### 정서 및 스트레스 지표
- 이완도 지수: ${measurementData.eegMetrics.relaxationIndex} (정상범위: 0.18-0.22)
  * 알파파 활성도, 부교감신경 활성화 상태, 스트레스 대응 능력 평가
- 스트레스 지수: ${measurementData.eegMetrics.stressIndex} (정상범위: 3.0-4.0)
  * 베타파 과활성화, 교감신경 활성화, 코르티솔 분비 상태 추정
- 정신적 피로: ${measurementData.eegMetrics.cognitiveLoad} (정상범위: 0.4-0.8)
  * 신경 가소성 지표, 신경 전달물질 고갈 상태, 회복 필요성 평가

### 뇌 기능 균형 지표
- 좌우뇌 균형: ${measurementData.eegMetrics.hemisphericBalance?.value?.toFixed(2) || 'N/A'} (정상범위: -0.1~0.1)
  * 반구간 연결성, 인지 처리 패턴, 창의성-논리성 균형 평가

## 신경과학적 해석 기준
### 뇌파 주파수 대역별 의미
- **Delta (0.5-4Hz)**: 깊은 수면, 뇌 회복 과정, 무의식 처리
- **Theta (4-8Hz)**: 창의성, 직관, 명상 상태, 기억 통합
- **Alpha (8-13Hz)**: 이완된 각성, 집중, 인지 효율성
- **Beta (13-30Hz)**: 각성, 논리적 사고, 과도 시 스트레스
- **Gamma (30-100Hz)**: 고차원 인지, 의식 통합, 신경 동기화

### 뇌 영역별 기능 연관성
- **전전두엽**: 실행 기능, 의사결정, 감정 조절, 작업 기억
- **측두엽**: 장기 기억, 언어 처리, 감정 처리 (해마, 편도체)
- **두정엽**: 공간 인지, 주의 집중, 감각 통합
- **후두엽**: 시각 정보 처리, 인지 부하 반영

## 측정 품질 및 신뢰도 평가
${qualityAssessment.assessment}
신뢰도: ${qualityAssessment.reliability}
**데이터 해석 가능성**: ${measurementData.signalQuality.eeg >= 70 ? '높음 - 건강 분석 가능' : measurementData.signalQuality.eeg >= 50 ? '보통 - 참고용 해석' : '낮음 - 재측정 권장'}

## 🧠 정신건강 전문 분석 바이오마커 (최신 연구 기반)

### 1. 우울 상태 (Depression) 분석 지표
**EEG 바이오마커 (Nature Neuroscience 2024 기반):**
- 전두엽 알파 비대칭 (F3-F4): 좌뇌 활성도 감소 시 우울 위험 증가
- 세타파 파워 (4-8Hz): 전두엽 세타파 증가 시 우울 관련 반추 사고 증가
- 알파/세타 비율: 0.8 이하 시 우울 위험 신호
- 뇌파 일관성 (Coherence): 전두-측두 연결성 감소 시 우울 위험

**PPG 바이오마커 (Frontiers in Psychiatry 2024 기반):**
- HRV 감소: RMSSD < 20ms, SDNN < 30ms 시 우울 위험 증가
- 심박수 변이성: 자율신경계 불균형으로 인한 우울 상태 반영
- 교감신경 과활성: LF/HF 비율 > 2.5 시 스트레스성 우울 위험

### 2. 주의력결핍 (ADHD) 분석 지표
**EEG 바이오마커 (Clinical Neurophysiology 2024 기반):**
- 세타/베타 비율: > 4.0 시 주의력 결핍 위험 증가
- 전두엽 베타파 활성도: 실행 기능 저하 시 ADHD 특성 반영
- 집중력 지속성: 5분 이상 집중력 유지 어려움 시 ADHD 위험
- 과잉 활성화: 고주파 베타파 (20-30Hz) 과다 시 충동성 증가

**PPG 바이오마커 (Biological Psychology 2024 기반):**
- 자율신경계 불안정: 높은 심박수 변동성과 불규칙한 패턴
- 각성 상태 과다: 지속적인 교감신경 활성화
- 회복 능력 저하: 스트레스 후 심박수 정상화 지연

### 3. 번아웃 증후군 (Burnout) 분석 지표
**EEG 바이오마커 (Psychoneuroendocrinology 2024 기반):**
- 인지 피로도: 지속적인 베타파 활성화로 인한 뇌 피로 상태
- 이완 능력 저하: 알파파 감소, 휴식 시에도 뇌 활성화 지속
- 감정 조절 장애: 전두-변연계 연결성 저하
- 만성 스트레스 패턴: 코르티솔 분비 리듬 이상 반영

**PPG 바이오마커 (Occupational Medicine 2024 기반):**
- 만성 피로: 낮은 HRV, 회복 능력 저하
- 수면 질 저하: 야간 심박수 변이성 이상
- 스트레스 호르몬 영향: 지속적인 교감신경 우세 상태

### 4. 충동성 (Impulsivity) 분석 지표
**EEG 바이오마커 (Neuropsychologia 2024 기반):**
- 전전두엽 억제 기능: 베타파 활성도 저하 시 충동 조절 어려움
- 감마파 동기화: 40Hz 대역 이상 시 충동적 행동 증가
- 반응 억제 능력: P300 성분 감소 시 충동성 증가
- 보상 회로 과활성: 도파민 관련 뇌 영역 과활성화

**PPG 바이오마커 (Psychophysiology 2024 기반):**
- 급격한 심박수 변화: 감정적 자극에 과도한 반응
- 자율신경계 불균형: 교감신경 과반응, 부교감신경 저하
- 각성 조절 장애: 상황에 부적절한 생리적 반응

## 종합 정신건강 분석 요구사항

### 1. 신경과학적 해석
- 각 지표를 뇌 영역별 기능과 연결하여 해석
- 신경 전달물질 (도파민, 세로토닌, 노르에피네프린) 활성도 추정
- 뇌파 패턴의 병리학적 의미 및 정상 변이 구분

### 2. 개인화된 평가
- 연령대별 뇌 발달 및 노화 특성 고려
- 성별 특이적 뇌파 패턴 및 호르몬 영향 분석
- 직업적 요구사항과 뇌 기능 매칭 평가
- **직업별 정신건강 위험 요소 (${occupationLabel} 특화 분석)**

### 3. **핵심 요구사항: 4가지 정신건강 위험도 상세 분석**
- **우울 상태 위험도 (0-100점)**: 전두엽 알파 비대칭, HRV 감소 패턴, 세로토닌 활성도 추정 분석
  * 정상 범위: 0-30점 (정상), 31-50점 (경계), 51-100점 (위험)
  * 상태 분류: 정상/경계/위험 중 하나로 분류
- **ADHD/집중력 장애 위험도 (0-100점)**: 세타/베타 비율, 집중력 지속성, 전전두엽 실행 기능 평가
  * 정상 범위: 0-30점 (정상), 31-50점 (경계), 51-100점 (위험)
  * 상태 분류: 정상/경계/위험 중 하나로 분류
- **번아웃 위험도 (0-100점)**: 만성 피로, 인지 피로도, 코르티솔 분비 패턴, 회복 능력 분석
  * 정상 범위: 0-30점 (정상), 31-50점 (경계), 51-100점 (위험)
  * 상태 분류: 정상/경계/위험 중 하나로 분류
- **충동성 위험도 (0-100점)**: 전전두엽 억제 기능, 감정 조절 능력, 도파민 회로 과활성 평가
  * 정상 범위: 0-30점 (정상), 31-50점 (경계), 51-100점 (위험)
  * 상태 분류: 정상/경계/위험 중 하나로 분류

### 4. 예후 및 개선 가능성
- 신경 가소성 기반 회복 가능성 평가
- 중재 방법별 효과 예측 (명상, 운동, 인지행동치료 등)
- 장기적 뇌 건강 유지 전략
- **각 위험 요소별 맞춤형 개선 방안 제시**

다음 형식으로 상세한 JSON 응답을 제공해주세요:

\`\`\`json
{
  "score": 85,
  "status": "양호",
  "analysis": "### 🧠 종합 정신건강 평가\\n\\n**신경과학적 소견:**\\n- 전전두엽 기능: [실행 기능, 의사결정 능력 상세 분석]\\n- 측두엽 활성도: [기억 기능, 감정 처리 능력 분석]\\n- 뇌파 패턴 특성: [주파수 대역별 활성도 및 건강 의미]\\n\\n**정신건강 위험도 평가 (4가지 핵심 위험도 필수 분석):**\\n\\n**중요 지침: 각 위험도 분석 시 반드시 다음 사항을 포함하여 개인화된 해석 제공:**\\n1. 현재 점수가 왜 이 수준인지 구체적 근거 제시\\n2. 연령(${age}세), 성별(${personalInfo.gender === 'male' ? '남성' : '여성'}), 직업(${occupationLabel}) 요인이 점수에 미친 영향\\n3. 측정된 생체신호 데이터와 점수의 연관성 설명\\n4. 개인별 문제점과 즉시 실행 가능한 개선 방안 제시\\n\\n### 1. 우울 상태 위험도: [점수]/100점 (정상범위: 0-30점, 상태: 정상/경계/위험)\\n- 전두엽 알파 비대칭 패턴 분석: 실제 측정값 ${measurementData.eegMetrics.hemisphericBalance?.value || 'N/A'}\\n- HRV 감소 및 자율신경계 불균형: 실제 RMSSD ${measurementData.ppgMetrics.rmssd?.value || 'N/A'}ms\\n- 세로토닌 신경전달물질 활성도 추정: 이완도 지수 ${measurementData.eegMetrics.relaxationIndex?.value || 'N/A'}\\n- 감정 조절 뇌 영역 기능 평가: 정서 안정성 ${measurementData.eegMetrics.emotionalStability?.value || 'N/A'}\\n\\n### 2. ADHD/집중력 장애 위험도: [점수]/100점 (정상범위: 0-30점, 상태: 정상/경계/위험)\\n- 세타/베타 비율 이상 패턴: 실제 측정값 기반 분석\\n- 집중력 지속성 및 주의 집중 능력: 집중도 지수 ${measurementData.eegMetrics.focusIndex?.value || 'N/A'}\\n- 전전두엽 실행 기능 저하: 인지 부하 ${measurementData.eegMetrics.cognitiveLoad?.value || 'N/A'}\\n- 도파민 회로 기능 이상: 뇌파 패턴 기반 추정\\n\\n### 3. 번아웃 위험도: [점수]/100점 (정상범위: 0-30점, 상태: 정상/경계/위험)\\n- 만성 피로 및 인지 피로도: 인지 부하 ${measurementData.eegMetrics.cognitiveLoad?.value || 'N/A'}\\n- 코르티솔 분비 리듬 이상: 스트레스 지수 ${measurementData.eegMetrics.stressIndex?.value || 'N/A'}\\n- 스트레스 회복 능력 저하: HRV 지표 ${measurementData.ppgMetrics.sdnn?.value || 'N/A'}ms\\n- 감정 소진 및 냉소주의 경향: 정서 안정성 ${measurementData.eegMetrics.emotionalStability?.value || 'N/A'}\\n\\n### 4. 충동성 위험도: [점수]/100점 (정상범위: 0-30점, 상태: 정상/경계/위험)\\n- 전전두엽 억제 기능 저하: 실제 뇌파 패턴 기반 분석\\n- 감정 조절 및 행동 억제 능력: 정서 안정성 ${measurementData.eegMetrics.emotionalStability?.value || 'N/A'}\\n- 도파민 보상 회로 과활성: 뇌파 패턴 기반 추정\\n- 반응 억제 및 계획 수립 능력: 집중도 지수 ${measurementData.eegMetrics.focusIndex?.value || 'N/A'}\\n\\n**개인화된 해석 필수 요소:**\\n- 연령대 특성: ${age}세 ${this.getAgeGroup(age)}의 뇌 기능 특성이 각 위험도에 미치는 영향\\n- 성별 고려사항: ${personalInfo.gender === 'male' ? '남성' : '여성'} 특이적 뇌파 패턴 및 호르몬이 각 위험도에 미치는 영향\\n- 직업적 요구사항: ${occupationLabel}의 업무 특성이 각 위험도에 미치는 구체적 영향\\n\\n**건강 의미:**\\n- 인지 기능 상태: [전반적 인지 능력 평가 및 강약점 분석]\\n- 신경 가소성 지표: [뇌 적응 능력 및 회복 가능성]",
  "keyMetrics": {
    "concentration": "집중력 지수 ${measurementData.eegMetrics.focusIndex}: [전전두엽 실행 기능 분석, 주의 집중 능력 평가, ADHD 위험도 연관성]",
    "relaxation": "이완도 지수 ${measurementData.eegMetrics.relaxationIndex}: [알파파 활성도 분석, 부교감신경 기능, 우울/번아웃 위험도 연관성]",
    "brainBalance": "좌우뇌 균형 ${measurementData.eegMetrics.hemisphericBalance}: [반구간 연결성 분석, 우울 상태 알파 비대칭 평가]",
    "cognitiveLoad": "인지 부하 ${measurementData.eegMetrics.cognitiveLoad}: [작업 기억 용량 분석, 번아웃 위험도 연관성]",
    "depressionRisk": "우울 위험도: [점수]/100점 - [전두엽 알파 비대칭, HRV 감소 패턴 종합 분석]",
    "adhdRisk": "집중력 장애 위험도: [점수]/100점 - [세타/베타 비율, 집중력 지속성 종합 분석]",
    "burnoutRisk": "번아웃 위험도: [점수]/100점 - [인지 피로도, 만성 스트레스 패턴 종합 분석]",
    "impulsivityRisk": "충동성 위험도: [점수]/100점 - [전전두엽 억제 기능, 감정 조절 능력 종합 분석]"
  },
  "recommendations": [
    "🧘‍♀️ 우울 예방 명상 프로그램: [전두엽 알파 활성화 기법, 실행 방법, 예상 효과]",
    "🎯 집중력 향상 훈련: [세타/베타 비율 개선, 주의력 지속성 강화 방법]",
    "💤 번아웃 예방 수면 최적화: [뇌 회복 극대화, 인지 피로도 감소 방법]",
    "🎮 충동성 조절 훈련: [전전두엽 강화 게임, 감정 조절 기법, 실행 방법]"
  ],
  "concerns": [
    "⚠️ 우울 위험 신호: [전두엽 알파 비대칭 패턴, 즉시 대응 방안]",
    "🔴 집중력 장애 특성 관찰: [세타/베타 비율 이상, 집중력 관리 필요성]",
    "🟡 번아웃 초기 징후: [인지 피로도 증가, 예방 전략 필요]",
    "🟠 충동성 증가 경향: [전전두엽 억제 기능 저하, 감정 조절 훈련 필요]"
  ],
  "detailedAnalysis": {
    "mentalHealthRisk": {
      "depression": {
        "riskScore": [실제 점수],
        "normalRange": "0-30점",
        "status": "정상|경계|위험",
        "analysis": "**현재 점수 해석:**\\n[점수]점은 ${age}세 ${personalInfo.gender === 'male' ? '남성' : '여성'}에게 [정상/경계/위험] 수준입니다.\\n\\n**점수 산출 근거:**\\n- 전두엽 알파 비대칭 패턴: [측정값] (정상 대비 [상태])\\n- HRV 감소 정도: [측정값] (정상 대비 [상태])\\n- 세로토닌 활성도 추정: [분석 결과]\\n\\n**개인별 요인 분석:**\\n- 연령 요인: [${age}세 연령대 특성 및 우울 위험도 연관성]\\n- 성별 요인: [${personalInfo.gender === 'male' ? '남성' : '여성'} 호르몬 영향 및 우울 패턴]\\n- 직업 요인: [${occupationLabel}의 업무 스트레스가 우울 위험도에 미치는 영향]\\n\\n**문제점 및 개선 방안:**\\n- 주요 문제: [구체적 문제점 제시]\\n- 즉시 개선 방안: [실행 가능한 구체적 방법]\\n- 장기 관리 전략: [지속적 관리 방안]"
      },
      "adhd": {
        "riskScore": [실제 점수],
        "normalRange": "0-30점",
        "status": "정상|경계|위험",
        "analysis": "**현재 점수 해석:**\\n[점수]점은 ${age}세 ${personalInfo.gender === 'male' ? '남성' : '여성'}에게 [정상/경계/위험] 수준입니다.\\n\\n**점수 산출 근거:**\\n- 세타/베타 비율: [측정값] (정상 대비 [상태])\\n- 집중력 지속성: [측정값] (정상 대비 [상태])\\n- 전전두엽 실행 기능: [분석 결과]\\n\\n**개인별 요인 분석:**\\n- 연령 요인: [${age}세 연령대 집중력 특성 및 ADHD 위험도]\\n- 성별 요인: [${personalInfo.gender === 'male' ? '남성' : '여성'} 집중력 패턴 및 ADHD 특성]\\n- 직업 요인: [${occupationLabel}의 업무 특성이 집중력에 미치는 영향]\\n\\n**문제점 및 개선 방안:**\\n- 주요 문제: [구체적 집중력 문제점]\\n- 즉시 개선 방안: [집중력 향상 구체적 방법]\\n- 장기 관리 전략: [지속적 집중력 관리 방안]"
      },
      "burnout": {
        "riskScore": [실제 점수],
        "normalRange": "0-30점",
        "status": "정상|경계|위험",
        "analysis": "**현재 점수 해석:**\\n[점수]점은 ${age}세 ${personalInfo.gender === 'male' ? '남성' : '여성'}에게 [정상/경계/위험] 수준입니다.\\n\\n**점수 산출 근거:**\\n- 인지 피로도: [측정값] (정상 대비 [상태])\\n- 코르티솔 리듬: [측정값] (정상 대비 [상태])\\n- 스트레스 회복 능력: [분석 결과]\\n\\n**개인별 요인 분석:**\\n- 연령 요인: [${age}세 연령대 스트레스 회복력 및 번아웃 위험도]\\n- 성별 요인: [${personalInfo.gender === 'male' ? '남성' : '여성'} 스트레스 반응 패턴 및 번아웃 특성]\\n- 직업 요인: [${occupationLabel}의 업무 강도가 번아웃에 미치는 영향]\\n\\n**문제점 및 개선 방안:**\\n- 주요 문제: [구체적 번아웃 위험 요소]\\n- 즉시 개선 방안: [번아웃 예방 구체적 방법]\\n- 장기 관리 전략: [지속적 에너지 관리 방안]"
      },
      "impulsivity": {
        "riskScore": [실제 점수],
        "normalRange": "0-30점",
        "status": "정상|경계|위험",
        "analysis": "**현재 점수 해석:**\\n[점수]점은 ${age}세 ${personalInfo.gender === 'male' ? '남성' : '여성'}에게 [정상/경계/위험] 수준입니다.\\n\\n**점수 산출 근거:**\\n- 전전두엽 억제 기능: [측정값] (정상 대비 [상태])\\n- 감정 조절 능력: [측정값] (정상 대비 [상태])\\n- 도파민 보상 회로: [분석 결과]\\n\\n**개인별 요인 분석:**\\n- 연령 요인: [${age}세 연령대 충동성 조절 능력 및 위험도]\\n- 성별 요인: [${personalInfo.gender === 'male' ? '남성' : '여성'} 충동성 패턴 및 조절 특성]\\n- 직업 요인: [${occupationLabel}의 업무 환경이 충동성에 미치는 영향]\\n\\n**문제점 및 개선 방안:**\\n- 주요 문제: [구체적 충동성 문제점]\\n- 즉시 개선 방안: [충동성 조절 구체적 방법]\\n- 장기 관리 전략: [지속적 자제력 강화 방안]"
      }
    }
  }
}
\`\`\`

**중요**: 모든 분석은 최신 신경과학 연구를 기반으로 하며, 건강 참고 목적으로만 사용하시고 전문의 상담이 필요한 경우 의료기관을 방문하시기 바랍니다.
`;
  }

  /**
   * 신체건강 분석 프롬프트 생성
   */
  private static generatePhysicalHealthPrompt(
    personalInfo: PersonalInfo,
    measurementData: MeasurementData
  ): string {
    const age = this.calculateAge(personalInfo);
    const occupationLabel = this.getOccupationLabel(personalInfo.occupation, personalInfo.customOccupation);
    const qualityAssessment = this.assessMeasurementQuality(measurementData.accMetrics);
    
    // 개인화된 정상값 범위 계산
    const indexGuidePersonalInfo = this.convertPersonalInfo(personalInfo);
    const ppgRanges = getAllPPGNormalRanges(indexGuidePersonalInfo);

    return `
당신은 심혈관 생리학 박사 학위를 보유한 PPG 분석 전문 건강 분석 AI입니다. 15년 이상의 연구 경험과 최신 심혈관 생리학 연구를 바탕으로 신체건강 상태를 종합적으로 분석해주세요.

**중요 지침:**
- 이 분석은 의료 정보 수준의 건강 참고 자료이며, 의료 진단이나 치료를 대체하지 않습니다.
- 특정 제품명, 브랜드명, 앱 이름 등은 절대 언급하지 마세요.
- 일반적인 건강 관리 방법과 생활습관 개선 방안만 제시하세요.
- "전문가 소견", "정신 건강 평가", "정신 건강 관리 가이드" 등의 의료 행위 관련 표현은 사용하지 마세요.
- 분석 결과에서 직업을 언급할 때는 반드시 "${occupationLabel}"로 표기하고, "military_medic" 같은 원본 코드는 절대 사용하지 마세요.

## 개인 정보
- 이름: ${personalInfo.name}
- 나이: ${age}세
- 성별: ${personalInfo.gender === 'male' ? '남성' : '여성'}
- 직업: ${occupationLabel}

## PPG 측정 데이터
- 심박수: ${measurementData.ppgMetrics.heartRate?.value || 'N/A'} BPM (개인화 정상범위: ${ppgRanges['BPM']?.label || '60-100'})
- 산소포화도: ${measurementData.ppgMetrics.spo2?.value || 'N/A'}% (개인화 정상범위: ${ppgRanges['SpO2']?.label || '95-100'})
- RMSSD: ${measurementData.ppgMetrics.rmssd?.value || 'N/A'}ms (개인화 정상범위: ${ppgRanges['RMSSD']?.label || '20-50ms'})
- SDNN: ${measurementData.ppgMetrics.sdnn?.value || 'N/A'}ms (개인화 정상범위: ${ppgRanges['SDNN']?.label || '30-100'})
- pNN50: ${measurementData.ppgMetrics.pnn50?.value || 'N/A'}% (개인화 정상범위: ${ppgRanges['PNN50']?.label || '10-30'})
- 심박변이도: ${measurementData.ppgMetrics.lfHfRatio?.value || 'N/A'} (개인화 정상범위: ${ppgRanges['LF/HF']?.label || '1.0-3.0'})

## 측정 품질 평가
${qualityAssessment.assessment}
신뢰도: ${qualityAssessment.reliability}

## 분석 요청사항
1. PPG 데이터를 기반으로 한 심혈관 건강 상태 평가 (점수 0-100)
2. 각 심혈관 지표의 과학적 해석
3. 연령대와 성별을 고려한 맞춤형 분석
4. 심혈관 건강 개선을 위한 구체적 권장사항
5. 주의해야 할 심혈관 위험 요소

다음 JSON 형식으로 응답해주세요:

\`\`\`json
{
  "score": 88,
  "status": "우수",
  "analysis": "PPG 분석 결과에 대한 상세한 과학적 해석...",
  "keyMetrics": {
    "heartRate": "심박수 해석",
    "spo2": "산소포화도 해석",
    "rmssd": "RMSSD 해석",
    "sdnn": "SDNN 해석",
    "pnn50": "pNN50 해석",
    "lfPower": "LF Power 해석",
    "hfPower": "HF Power 해석",
    "lfHfRatio": "LF/HF 비율 해석"
  },
  "recommendations": [
    "규칙적인 유산소 운동",
    "심혈관 건강 식단 관리",
    "정기적인 심혈관 검진"
  ],
  "concerns": [
    "심박변이도 감소",
    "자율신경계 불균형"
  ]
}
\`\`\`

**중요**: 모든 분석은 최신 심혈관 생리학 연구를 기반으로 하며, 건강 참고 목적으로만 사용하시고 전문의 상담이 필요한 경우 의료기관을 방문하시기 바랍니다.
`;
  }

  /**
   * 스트레스 건강 분석 프롬프트 생성
   */
  private static generateStressHealthPrompt(
    personalInfo: PersonalInfo,
    measurementData: MeasurementData
  ): string {
    const age = this.calculateAge(personalInfo);
    const occupationLabel = this.getOccupationLabel(personalInfo.occupation, personalInfo.customOccupation);
    const qualityAssessment = this.assessMeasurementQuality(measurementData.accMetrics);

    return `
당신은 스트레스 생리학 박사 학위를 보유한 통합 스트레스 분석 전문 건강 분석 AI입니다. 15년 이상의 연구 경험과 최신 스트레스 과학 연구를 바탕으로 스트레스 상태를 종합적으로 분석해주세요.

**중요 지침:**
- 이 분석은 의료 정보 수준의 건강 참고 자료이며, 의료 진단이나 치료를 대체하지 않습니다.
- 특정 제품명, 브랜드명, 앱 이름 등은 절대 언급하지 마세요.
- 일반적인 건강 관리 방법과 생활습관 개선 방안만 제시하세요.
- "전문가 소견", "정신 건강 평가", "정신 건강 관리 가이드" 등의 의료 행위 관련 표현은 사용하지 마세요.
- 분석 결과에서 직업을 언급할 때는 반드시 "${occupationLabel}"로 표기하고, "military_medic" 같은 원본 코드는 절대 사용하지 마세요.

## 개인 정보
- 이름: ${personalInfo.name}
- 나이: ${age}세
- 성별: ${personalInfo.gender === 'male' ? '남성' : '여성'}
- 직업: ${occupationLabel}

## 종합 생체신호 데이터
### EEG 스트레스 관련 지표
- 스트레스 지수: ${measurementData.eegMetrics.stressIndex?.value || 'N/A'} (정상범위: 3.0-4.0)
- 인지 부하: ${measurementData.eegMetrics.cognitiveLoad?.value || 'N/A'} (정상범위: 0.3-0.8)
- 이완도: ${measurementData.eegMetrics.relaxationIndex?.value || 'N/A'} (정상범위: 0.18-0.22)
- 정서 안정성: ${measurementData.eegMetrics.emotionalStability?.value || 'N/A'} (정상범위: 0.4-0.8)
- 집중도: ${measurementData.eegMetrics.focusIndex?.value || 'N/A'} (정상범위: 1.8-2.4)

### PPG 스트레스 관련 지표
- 심박수: ${measurementData.ppgMetrics.heartRate?.value || 'N/A'} BPM (정상범위: 60-100)
- RMSSD (HRV): ${measurementData.ppgMetrics.rmssd?.value || 'N/A'} ms (정상범위: 20-50)
- LF/HF 비율: ${measurementData.ppgMetrics.lfHfRatio?.value || 'N/A'} (정상범위: 1.0-10.0)
- SDNN (HRV): ${measurementData.ppgMetrics.sdnn?.value || 'N/A'} ms (정상범위: 20-50)

### 통합 스트레스 지표 분석
- EEG 기반 스트레스 요인: 스트레스 지수 상승, 이완도 감소, 인지 부하 증가, 정서 불안정
- PPG 기반 스트레스 요인: 심박수 상승, HRV 감소, 자율신경계 불균형 (LF/HF 비율 증가)
- 스트레스 상호작용: 뇌파 스트레스와 심혈관 스트레스의 상관관계 분석 필요

## 측정 품질 평가
${qualityAssessment.assessment}
신뢰도: ${qualityAssessment.reliability}

## 분석 요청사항
1. **EEG와 PPG 데이터를 통합한 종합 스트레스 상태 평가** (점수 0-100)
   - 뇌파 기반 정신적 스트레스 지표 분석
   - 심박변이도 기반 신체적 스트레스 지표 분석
   - 자율신경계 균형 상태 평가
   - 스트레스 회복 능력 및 적응력 평가

2. **상세한 스트레스 분석 결과 제공**
   - 스트레스 지수별 의학적 해석 및 정상값 대비 평가
   - 인지 부하 및 정신적 피로도 상세 분석
   - 이완 능력 및 스트레스 해소 능력 평가
   - 교감신경/부교감신경 활성도 균형 분석

3. **스트레스 요인 및 대응 능력 종합 평가**
   - 급성 스트레스 vs 만성 스트레스 구분 분석
   - 스트레스 유발 요인 및 취약성 평가
   - 개인별 스트레스 대처 능력 및 회복력 평가

4. **스트레스 관리를 위한 구체적이고 실행 가능한 권장사항**
   - 즉시 실행 가능한 스트레스 완화 방법
   - 단기/장기 스트레스 관리 전략
   - 직업적 특성을 고려한 맞춤형 스트레스 관리법

5. **만성 스트레스 위험 요소 식별 및 예방 전략**

다음 JSON 형식으로 응답해주세요:

\`\`\`json
{
  "score": 75,
  "status": "관리 필요",
  "analysis": "### 🌊 종합 스트레스 분석 결과\\n\\n**EEG 기반 정신적 스트레스 분석:**\\n- 스트레스 지수: [값] ([정상범위 대비 해석])\\n- 인지 부하: [값] ([정상범위 대비 해석])\\n- 이완도: [값] ([정상범위 대비 해석])\\n- 정서 안정성: [값] ([정상범위 대비 해석])\\n\\n**PPG 기반 신체적 스트레스 분석:**\\n- 심박수: [값] BPM ([정상범위 대비 해석])\\n- HRV (RMSSD): [값] ms ([자율신경계 균형 상태])\\n- LF/HF 비율: [값] ([교감/부교감신경 균형])\\n- SDNN: [값] ms ([전반적 자율신경 기능])\\n\\n**통합 스트레스 평가:**\\n- 급성 vs 만성 스트레스 구분\\n- 스트레스 대처 능력 및 회복력\\n- 개인별 스트레스 취약성 분석\\n- ${occupationLabel} 직업 특성 고려한 스트레스 패턴",
  "keyMetrics": {
    "eegStressIndex": "스트레스 지수 [값]: [뇌파 기반 정신적 스트레스 상태 상세 해석]",
    "cognitiveLoad": "인지 부하 [값]: [정신적 피로도 및 작업 부하 상세 분석]",
    "relaxationIndex": "이완도 [값]: [스트레스 해소 능력 및 회복력 상세 분석]",
    "heartRateVariability": "심박변이도 [값]: [자율신경계 균형 및 스트레스 적응 능력 분석]",
    "autonomicBalance": "자율신경 균형: [교감/부교감신경 활성도 균형 상태 분석]",
    "stressRecovery": "스트레스 회복 능력: [개인별 스트레스 대처 및 회복 능력 평가]"
  },
  "stressFactors": [
    "높은 인지 부하 및 정신적 피로",
    "자율신경계 불균형 (교감신경 과활성)",
    "스트레스 회복 시간 부족",
    "만성 스트레스 누적 징후",
    "직업적 스트레스 요인 (${occupationLabel} 특성)"
  ],
  "recommendations": [
    "🧘‍♀️ 즉시 실행: 5분 호흡 명상으로 부교감신경 활성화",
    "💤 단기 목표: 규칙적인 수면 패턴으로 스트레스 회복력 향상",
    "🏃‍♂️ 장기 전략: 유산소 운동으로 HRV 개선 및 스트레스 내성 강화",
    "⏰ 직업 맞춤: ${occupationLabel} 업무 중 스트레스 관리 기법 적용",
    "🌿 생활습관: 스트레스 완화 환경 조성 및 회복 시간 확보"
  ]
}
\`\`\`

**중요**: 모든 분석은 최신 스트레스 과학 연구를 기반으로 하며, 건강 참고 목적으로만 사용하시고 전문의 상담이 필요한 경우 의료기관을 방문하시기 바랍니다.
`;
  }

  /**
   * 종합 분석 프롬프트 생성
   */
  private static generateComprehensiveAnalysisPrompt(
    personalInfo: PersonalInfo,
    measurementData: MeasurementData,
    mentalHealthReport: MentalHealthReport,
    physicalHealthReport: PhysicalHealthReport,
    stressHealthReport: StressHealthReport
  ): string {
    const age = this.calculateAge(personalInfo);
    const occupationLabel = this.getOccupationLabel(personalInfo.occupation, personalInfo.customOccupation);

    return `
당신은 종합 건강 관리 전문 건강 분석 AI입니다. 다음 개인의 3가지 전문 분석 결과를 바탕으로 개인 맞춤형 종합 건강 관리 계획을 수립해주세요.

**중요 지침:**
- 이 분석은 의료 정보 수준의 건강 참고 자료이며, 의료 진단이나 치료를 대체하지 않습니다.
- 특정 제품명, 브랜드명, 앱 이름 등은 절대 언급하지 마세요.
- 일반적인 건강 관리 방법과 생활습관 개선 방안만 제시하세요.
- "전문가 소견", "정신 건강 평가", "정신 건강 관리 가이드" 등의 의료 행위 관련 표현은 사용하지 마세요.
- 분석 결과에서 직업을 언급할 때는 반드시 "${occupationLabel}"로 표기하고, "military_medic" 같은 원본 코드는 절대 사용하지 마세요.

## 개인 정보
- 이름: ${personalInfo.name}
- 나이: ${age}세
- 성별: ${personalInfo.gender}
- 직업: ${occupationLabel}

## 전문 분석 결과 요약
### 정신건강 분석 결과
- 점수: ${mentalHealthReport.score}/100 (${mentalHealthReport.status})
- 주요 소견: ${mentalHealthReport.analysis.substring(0, 100)}...
- 주요 우려사항: ${mentalHealthReport.concerns.join(', ')}

### 신체건강 분석 결과
- 점수: ${physicalHealthReport.score}/100 (${physicalHealthReport.status})
- 주요 소견: ${physicalHealthReport.analysis.substring(0, 100)}...
- 주요 우려사항: ${physicalHealthReport.concerns.join(', ')}

### 스트레스 건강 분석 결과
- 점수: ${stressHealthReport.score}/100 (${stressHealthReport.status})
- 주요 소견: ${stressHealthReport.analysis.substring(0, 100)}...
- 스트레스 요인: ${stressHealthReport.stressFactors.join(', ')}

## 종합 분석 요청사항
1. 3가지 분석 결과를 종합한 전체 건강 점수 (0-100)
2. 개인정보(나이, 성별, 직업)를 고려한 맞춤형 건강 요약
3. 즉시 실행 가능한 건강 관리 방안 (6가지)
4. 단기 목표 설정 (1-3개월, 6가지)
5. 장기 전략 수립 (6개월-1년, 6가지)
6. 직업 특성을 고려한 맞춤형 조언 (12가지)
7. 후속 관리 계획 (3가지)

다음 JSON 형식으로 응답해주세요:

\`\`\`json
{
  "overallScore": 82,
  "personalizedSummary": "개인 정보를 반영한 상세한 건강 상태 요약...",
  "immediateActions": [
    "즉시 실행 가능한 행동 1",
    "즉시 실행 가능한 행동 2",
    "즉시 실행 가능한 행동 3",
    "즉시 실행 가능한 행동 4",
    "즉시 실행 가능한 행동 5",
    "즉시 실행 가능한 행동 6"
  ],
  "shortTermGoals": [
    "1-3개월 목표 1",
    "1-3개월 목표 2",
    "1-3개월 목표 3",
    "1-3개월 목표 4",
    "1-3개월 목표 5",
    "1-3개월 목표 6"
  ],
  "longTermStrategy": [
    "6개월-1년 전략 1",
    "6개월-1년 전략 2",
    "6개월-1년 전략 3",
    "6개월-1년 전략 4",
    "6개월-1년 전략 5",
    "6개월-1년 전략 6"
  ],
  "occupationSpecificAdvice": [
    "직업 맞춤 조언 1",
    "직업 맞춤 조언 2",
    "직업 맞춤 조언 3",
    "직업 맞춤 조언 4",
    "직업 맞춤 조언 5",
    "직업 맞춤 조언 6",
    "직업 맞춤 조언 7",
    "직업 맞춤 조언 8",
    "직업 맞춤 조언 9",
    "직업 맞춤 조언 10",
    "직업 맞춤 조언 11",
    "직업 맞춤 조언 12"
  ],
  "followUpPlan": [
    "후속 관리 계획 1",
    "후속 관리 계획 2",
    "후속 관리 계획 3"
  ]
}
\`\`\`

**중요**: 모든 분석은 최신 건강 과학 연구를 기반으로 하며, 건강 참고 목적으로만 사용하시고 전문의 상담이 필요한 경우 의료기관을 방문하시기 바랍니다.
`;
  }

  // ===== 헬퍼 메서드들 =====

  /**
   * 나이 계산
   */
  private static calculateAge(personalInfo: PersonalInfo): number {
    const currentYear = new Date().getFullYear();
    if (personalInfo.birthYear) {
      return currentYear - personalInfo.birthYear;
    }
    if (personalInfo.birthDate) {
      const [year] = personalInfo.birthDate.split('-').map(Number);
      return currentYear - year;
    }
    return 0;
  }

  /**
   * 건강 등급 반환
   */
  private static getHealthGrade(score: number): string {
    if (score >= 90) return "매우 우수";
    if (score >= 80) return "우수";
    if (score >= 70) return "양호";
    if (score >= 60) return "보통";
    if (score >= 50) return "주의";
    return "위험";
  }

  /**
   * 강점 추출
   */
  private static extractStrengths(report: MentalHealthReport | PhysicalHealthReport): string[] {
    return report.recommendations.filter(rec => 
      rec.includes("우수") || rec.includes("양호") || rec.includes("좋은")
    ).slice(0, 2);
  }

  /**
   * 연령대 분류
   */
  private static getAgeGroup(age: number): string {
    if (age < 20) return "청소년기";
    if (age < 30) return "청년기";
    if (age < 40) return "초기 성인기";
    if (age < 50) return "중년 초기";
    if (age < 60) return "중년 후기";
    if (age < 70) return "초기 노년기";
    return "후기 노년기";
  }

  /**
   * 직업적 스트레스 요인 분석
   */
  private static getOccupationalStressFactors(occupation: OccupationType): string {
    const stressFactors: Record<OccupationType, string> = {
      'teacher': '학생 지도 및 교실 관리로 인한 인지 부하, 학부모 상담 및 민원 처리 스트레스, 교육과정 변화 및 평가 업무 적응 압박, 장시간 서서 수업으로 인한 신체적 피로, 방과 후 업무 연장으로 인한 개인 시간 부족, 교실 내 소음 및 밀폐 환경에서의 지속적 긴장',
      'military_medic': '높은 책임감, 응급 상황 대응, 생명 관련 의사결정',
      'military_career': '위계질서, 신체적 부담, 임무 수행 압박',
      'elementary': '학습 압박, 또래 관계, 성장 스트레스',
      'middle_school': '사춘기 변화, 학업 경쟁, 진로 고민',
      'high_school': '입시 압박, 미래 불안, 학업 부담',
      'university': '진로 불안, 학업 부담, 사회 진출 압박',
      'housewife': '가사 부담, 사회적 고립, 자아 정체성 혼란',
      'parent': '양육 스트레스, 경제적 부담, 시간 부족',
      'firefighter': '생명 위험, 응급 상황, 외상 스트레스',
      'police': '사회적 갈등, 위험 노출, 업무 부담',
      'developer': '장시간 집중, 기술 변화 적응, 프로젝트 압박',
      'designer': '창의적 압박, 클라이언트 요구, 미적 완성도',
      'office_worker': '업무 반복성, 대인 관계, 승진 경쟁',
      'manager': '의사결정 부담, 팀 관리, 성과 압박',
      'general_worker': '업무 다양성, 시간 압박, 직무 스트레스',
      'entrepreneur': '경영 부담, 재정 위험, 불확실성',
      'other': '다양한 직업적 스트레스 요인',
      '': '일반적 생활 스트레스'
    };
    
    return stressFactors[occupation] || '일반적 직업 스트레스';
  }

  /**
   * 신뢰도 레벨 평가
   */
  private static getReliabilityLevel(quality: number): string {
    if (quality >= 80) return "매우 높음";
    if (quality >= 70) return "높음";
    if (quality >= 60) return "보통";
    if (quality >= 50) return "낮음";
    return "매우 낮음";
  }

  /**
   * 환경적 요인 평가
   */
  private static getEnvironmentalFactors(accMetrics: any): string {
    const stability = accMetrics.stability || 0;
    const movement = accMetrics.averageMovement || 0;
    
    if (stability >= 80 && movement <= 0.1) {
      return "최적 측정 환경 (안정된 자세, 최소한의 움직임)";
    } else if (stability >= 60) {
      return "양호한 측정 환경 (약간의 움직임 있음)";
    } else {
      return "불안정한 측정 환경 (과도한 움직임, 데이터 해석 시 주의 필요)";
    }
  }

  static async analyzeHealthData(
    personalInfo: PersonalInfo,
    measurementData: MeasurementData
  ): Promise<AIAnalysisResult> {
    try {
      // 🔧 의학적 해석 고도화: 다중 지표 상관관계 분석
      const clinicalCorrelations = MedicalInterpretationService.analyzeClinicalCorrelations(measurementData);
      
      // 🔧 전문의 상담 가이드라인 생성
      const professionalGuidance = MedicalInterpretationService.generateProfessionalGuidance(
        personalInfo,
        measurementData,
        clinicalCorrelations
      );

      // 기존 4단계 분석 수행
      const mentalHealthReport = await this.analyzeMentalHealth(personalInfo, measurementData);
      const physicalHealthReport = await this.analyzePhysicalHealth(personalInfo, measurementData);
      const stressHealthReport = await this.analyzeStressHealth(personalInfo, measurementData);
      const comprehensiveAnalysis = await this.generateComprehensiveAnalysis(
        personalInfo,
        measurementData,
        mentalHealthReport,
        physicalHealthReport,
        stressHealthReport
      );

      // 🔧 의학적 용어 및 근거 강화
      const enhancedAnalysis = MedicalInterpretationService.enhanceMedicalTerminology({
        analysisText: comprehensiveAnalysis.personalizedSummary,
        timestamp: new Date().toISOString(),
        personalInfo,
        measurementData,
        clinicalCorrelations,
        professionalGuidance
      } as any);

      // 기존 결과 조합 + 의학적 해석 고도화 결과 추가
      const baseResult = this.combineAnalysisResults(
        personalInfo,
        measurementData,
        mentalHealthReport,
        physicalHealthReport,
        stressHealthReport,
        comprehensiveAnalysis
      );

      // 🔧 고도화된 결과 반환 (타입 호환성을 위해 일부 필드는 주석 처리)
      return {
        ...baseResult,
        // clinicalCorrelations,  // AIAnalysisResult 타입에 정의되지 않음
        // professionalGuidance,  // AIAnalysisResult 타입에 정의되지 않음
        // enhancedAnalysis       // AIAnalysisResult 타입에 정의되지 않음
      };

    } catch (error) {
      console.error('AI 분석 중 오류 발생:', error);
      throw new Error('AI 분석을 완료할 수 없습니다. 잠시 후 다시 시도해주세요.');
    }
  }

  // 🔧 중복된 메서드 제거 및 기존 메서드 유지

  // ===== 유틸리티 메서드들 =====

  /**
   * 실제 분석 결과를 기반으로 문제 영역 식별
   */
  private static identifyProblemAreasFromAnalysis(
    mentalHealthReport: MentalHealthReport,
    physicalHealthReport: PhysicalHealthReport,
    stressHealthReport: StressHealthReport,
    measurementData: MeasurementData
  ): Array<{ area: string; severity: string; description: string; solutions: string[] }> {
    const problemAreas: Array<{ area: string; severity: string; description: string; solutions: string[] }> = [];

    // 1. 정신건강 문제 영역 확인 (점수 기반 + 실제 측정값 확인)
    if (mentalHealthReport.score < 70 || mentalHealthReport.concerns.length > 0) {
      // EEG 지표 확인 (MetricWithContext 타입이므로 .value 사용)
      const focusIndex = measurementData.eegMetrics.focusIndex.value;
      const stressIndex = measurementData.eegMetrics.stressIndex.value;
      const relaxationIndex = measurementData.eegMetrics.relaxationIndex.value;
      
      let description = mentalHealthReport.concerns[0] || "정신건강 관리가 필요합니다.";
      
      // 구체적인 문제 상황 식별
      if (focusIndex < 1.8) {
        description = `집중력 지수(${focusIndex})가 정상 범위(1.8-2.4) 미달로 주의력 향상이 필요합니다.`;
      } else if (stressIndex > 4.0) {
        description = `스트레스 지수(${stressIndex})가 정상 범위(3.0-4.0) 초과로 스트레스 관리가 필요합니다.`;
      } else if (relaxationIndex < 0.18) {
        description = `이완도 지수(${relaxationIndex})가 정상 범위(0.18-0.22) 미달로 휴식과 이완이 필요합니다.`;
      }

      problemAreas.push({
        area: "정신건강",
        severity: mentalHealthReport.score < 50 ? "높음" : "중간",
        description,
        solutions: [
          "매일 10분 명상 또는 심호흡 연습",
          "규칙적인 휴식 시간 확보",
          "충분한 수면과 스트레스 관리"
        ]
      });
    }

    // 2. 신체건강 문제 영역 확인 (점수 기반 + 실제 측정값 확인)
    if (physicalHealthReport.score < 70 || physicalHealthReport.concerns.length > 0) {
      // PPG 지표 확인
      const heartRate = measurementData.ppgMetrics.heartRate?.value;
      const spo2 = measurementData.ppgMetrics.spo2?.value;
      const rmssd = measurementData.ppgMetrics.rmssd?.value;
      const sdnn = measurementData.ppgMetrics.sdnn?.value;
      
      let description = physicalHealthReport.concerns[0] || "신체건강 관리가 필요합니다.";
      
      // 구체적인 문제 상황 식별
      if (spo2 && spo2 < 95) {
        description = `산소포화도(${spo2}%)가 정상 범위(95-100%) 미달로 호흡 및 순환 기능 개선이 필요합니다.`;
      } else if (rmssd && rmssd < 20) {
        description = `HRV RMSSD(${rmssd}ms)가 정상 범위(20-50ms) 미달로 자율신경 기능 개선이 필요합니다.`;
      } else if (sdnn && sdnn < 30) {
        description = `HRV SDNN(${sdnn}ms)가 정상 범위(30-100ms) 미달로 심박변이도 개선이 필요합니다.`;
      } else if (heartRate && (heartRate < 60 || heartRate > 100)) {
        description = `심박수(${heartRate} BPM)가 정상 범위(60-100 BPM) 벗어나 심혈관 기능 점검이 필요합니다.`;
      }

      problemAreas.push({
        area: "신체건강",
        severity: physicalHealthReport.score < 50 ? "높음" : "중간",
        description,
        solutions: [
          "규칙적인 유산소 운동 (주 3-4회, 30분)",
          "충분한 수분 섭취와 균형 잡힌 식단",
          "정기적인 건강검진 및 전문의 상담"
        ]
      });
    }

    // 3. 스트레스 관리 문제 영역 확인
    if (stressHealthReport.score < 70 || stressHealthReport.stressFactors.length > 0) {
      let description = stressHealthReport.stressFactors[0] || "스트레스 관리가 필요합니다.";
      
      // 복합 지표 기반 스트레스 상태 분석
      const stressIndex = measurementData.eegMetrics.stressIndex.value;
      const lfHfRatio = measurementData.ppgMetrics.lfHfRatio?.value;
      
      if (stressIndex > 4.0 && lfHfRatio && lfHfRatio > 3.0) {
        description = `뇌파 스트레스 지수(${stressIndex})와 자율신경 불균형(LF/HF: ${lfHfRatio})이 모두 높아 종합적인 스트레스 관리가 필요합니다.`;
      } else if (stressIndex > 4.0) {
        description = `뇌파 스트레스 지수(${stressIndex})가 정상 범위(3.0-4.0) 초과로 정신적 스트레스 관리가 필요합니다.`;
      } else if (lfHfRatio && lfHfRatio > 3.0) {
        description = `자율신경 불균형(LF/HF: ${lfHfRatio})이 정상 범위(1.0-3.0) 초과로 신체적 스트레스 관리가 필요합니다.`;
      }

      problemAreas.push({
        area: "스트레스 관리",
        severity: stressHealthReport.score < 50 ? "높음" : "중간",
        description,
        solutions: [
          "스트레스 관리 기법 학습 (명상, 요가, 호흡법)",
          "충분한 휴식과 수면 시간 확보",
          "스트레스 요인 파악 및 환경 개선"
        ]
      });
    }

    // 최대 3개 문제 영역으로 제한
    return problemAreas.slice(0, 3);
  }

  /**
   * 맥파 분석 종합 해석용 특화 프롬프트 생성
   * 연령, 성별, 직업 특성을 고려한 개인화된 맥파(PPG) 해석
   */
  private static generatePhysicalHealthComprehensivePrompt(
    personalInfo: PersonalInfo,
    measurementData: MeasurementData,
    physicalHealthReport: PhysicalHealthReport
  ): string {
    const convertedPersonalInfo = this.convertPersonalInfo(personalInfo);
    const ppgRanges = getAllPPGNormalRanges(convertedPersonalInfo);
    const age = this.calculateAge(personalInfo);
    const occupationLabel = this.getOccupationLabel(personalInfo.occupation, personalInfo.customOccupation);
    const qualityAssessment = this.assessMeasurementQuality(measurementData.accMetrics);

    return `당신은 맥파(PPG) 분석 전문 해석 AI입니다. 다음 정보를 바탕으로 개인화된 맥파 기반 신체건강 종합 해석을 제공해주세요.

**중요 지침:**
- 이 분석은 건강 참고 자료이며, 의료 진단이나 치료를 대체하지 않습니다.
- 특정 제품명, 브랜드명, 앱 이름 등은 절대 언급하지 마세요.
- 일반적인 건강 관리 방법과 생활습관 개선 방안만 제시하세요.
- 분석 결과에서 직업을 언급할 때는 반드시 "${occupationLabel}"로 표기하세요.

**개인정보:**
- 이름: ${personalInfo.name}
- 연령: ${age}세 (${this.getAgeGroup(age)} 연령대)
- 성별: ${personalInfo.gender === 'male' ? '남성' : '여성'}
- 직업: ${occupationLabel}

**맥파(PPG) 측정 결과:**
- 심박수(Heart Rate): ${measurementData.ppgMetrics.heartRate?.value?.toFixed(2) || 'N/A'} BPM
- 심박변이도 RMSSD: ${measurementData.ppgMetrics.rmssd?.value?.toFixed(2) || 'N/A'} ms
- 심박변이도 SDNN: ${measurementData.ppgMetrics.sdnn?.value?.toFixed(2) || 'N/A'} ms
- 산소포화도(SpO2): ${measurementData.ppgMetrics.spo2?.value?.toFixed(1) || 'N/A'}%
- 자율신경균형 LF/HF: ${measurementData.ppgMetrics.lfHfRatio?.value?.toFixed(2) || 'N/A'}

**측정 품질:**
- 신호 품질: ${qualityAssessment.assessment}
- 신뢰도: ${qualityAssessment.reliability}

**기본 분석 결과:**
- 신체건강 점수: ${physicalHealthReport.score}점
- 상태: ${physicalHealthReport.status}
- 주요 소견: ${physicalHealthReport.analysis.substring(0, 300)}...
- 핵심 지표: ${Object.entries(physicalHealthReport.keyMetrics).map(([key, value]) => `${key}: ${value}`).join(', ')}

다음 JSON 형식으로 응답해주세요:

\`\`\`json
{
  "comprehensiveInterpretation": "### ❤️ 맥파 분석 종합 해석\\n\\n**현재 심혈관 기능 상태:**\\n- 심박수: ${measurementData.ppgMetrics.heartRate?.value?.toFixed(2) || 'N/A'} BPM - [정상범위 대비 해석 및 심혈관 기능 의미]\\n- 심박변이도 RMSSD: ${measurementData.ppgMetrics.rmssd?.value?.toFixed(2) || 'N/A'} ms - [자율신경 균형 및 스트레스 회복 능력]\\n- 심박변이도 SDNN: ${measurementData.ppgMetrics.sdnn?.value?.toFixed(2) || 'N/A'} ms - [전체적인 자율신경 활성도]\\n- 산소포화도: ${measurementData.ppgMetrics.spo2?.value?.toFixed(1) || 'N/A'}% - [혈중 산소 공급 능력 및 호흡 효율성]\\n- 자율신경균형: ${measurementData.ppgMetrics.lfHfRatio?.value?.toFixed(2) || 'N/A'} - [교감/부교감 신경 균형 상태]\\n\\n**개인 특성별 해석:**\\n- 연령대 특성: [${age}세 ${this.getAgeGroup(age)}의 심혈관 기능 특성과 현재 상태 비교]\\n- 성별 특성: [${personalInfo.gender === 'male' ? '남성' : '여성'}의 심혈관 패턴 특성과 건강 연관성]\\n- 직업적 특성: [${occupationLabel}의 업무 요구사항과 현재 심혈관 기능 적합성]\\n\\n**심혈관 건강 개선 방향:**\\n- 주요 개선 영역: [개인 특성 기반 심혈관 건강 개선 영역]\\n- 강점 영역: [현재 가지고 있는 심혈관 건강 강점]\\n- 개선 가능성: [개선 가능한 영역 및 방법]",
  "individualMetricsInterpretation": {
    "heartRate": {
      "value": ${measurementData.ppgMetrics.heartRate?.value?.toFixed(2) || 'N/A'},
      "normalRange": "60-100 BPM",
      "status": "[정상/서맥/빈맥] 범위 판정",
      "interpretation": "심박수에 대한 개인화된 상세 해석 - 현재 심혈관 기능 상태, 운동 능력, 스트레스 반응성과의 연관성",
      "personalizedAdvice": "개인 특성(연령/성별/직업)을 고려한 심박수 관리 방법"
    },
    "rmssd": {
      "value": ${measurementData.ppgMetrics.rmssd?.value?.toFixed(2) || 'N/A'},
      "normalRange": "개인별 기준치",
      "status": "[정상/낮음/높음] 범위 판정",
      "interpretation": "RMSSD 심박변이도에 대한 개인화된 상세 해석 - 자율신경 균형, 스트레스 회복 능력, 부교감신경 활성도",
      "personalizedAdvice": "개인 특성을 고려한 자율신경 균형 개선 방법"
    },
    "sdnn": {
      "value": ${measurementData.ppgMetrics.sdnn?.value?.toFixed(2) || 'N/A'},
      "normalRange": "개인별 기준치",
      "status": "[정상/낮음/높음] 범위 판정",
      "interpretation": "SDNN 심박변이도에 대한 개인화된 상세 해석 - 전체 자율신경 활성도, 심혈관 건강 상태, 적응 능력",
      "personalizedAdvice": "개인 특성을 고려한 심혈관 건강 향상 방법"
    },
    "spo2": {
      "value": ${measurementData.ppgMetrics.spo2?.value?.toFixed(1) || 'N/A'},
      "normalRange": "95-100%",
      "status": "[정상/주의/위험] 범위 판정",
      "interpretation": "산소포화도에 대한 개인화된 상세 해석 - 혈중 산소 공급 능력, 호흡 효율성, 심폐 기능",
      "personalizedAdvice": "개인 특성을 고려한 산소포화도 개선 및 호흡 건강 방법"
    },
    "lfHfRatio": {
      "value": ${measurementData.ppgMetrics.lfHfRatio?.value?.toFixed(2) || 'N/A'},
      "normalRange": "1.5-4.0",
      "status": "[균형/교감우세/부교감우세] 판정",
      "interpretation": "LF/HF 비율에 대한 개인화된 상세 해석 - 교감/부교감 신경 균형, 스트레스 반응, 자율신경 조절 능력",
      "personalizedAdvice": "개인 특성을 고려한 자율신경 균형 최적화 방법"
    }
  },
  "ageSpecificAnalysis": {
    "ageGroup": "${this.getAgeGroup(age)}",
    "typicalCharacteristics": "해당 연령대의 일반적인 심혈관 특성",
    "currentComparison": "현재 측정값과 동연령대 평균과의 비교 분석",
    "riskFactors": ["연령 관련 심혈관 위험 요소들"],
    "strengths": ["현재 나타나는 긍정적 요소들"]
  },
  "genderSpecificAnalysis": {
    "gender": "${personalInfo.gender === 'male' ? '남성' : '여성'}",
    "cardiovascularCharacteristics": "성별에 따른 심혈관 패턴 특성",
    "hormonalInfluence": "호르몬이 심혈관 건강에 미치는 영향",
    "healthPatterns": "성별 특성을 고려한 건강 패턴 분석",
    "managementPoints": ["성별 맞춤 관리 포인트들"]
  },
  "occupationalAnalysis": {
    "occupation": "${occupationLabel}",
    "workRequirements": "직업적 특성이 심혈관에 미치는 영향",
    "stressFactors": ["직업 관련 심혈관 스트레스 요인들"],
    "cardiovascularMatch": "현재 심혈관 상태와 직업 요구사항의 적합성",
    "workplaceRisks": ["직장 환경에서의 심혈관 위험 요소들"],
    "adaptationStrategies": ["직업 특성에 맞는 심혈관 건강 전략들"]
  },
  "cardiovascularRiskAssessment": {
    "primaryRisks": ["주요 심혈관 위험 요소들"],
    "protectiveFactors": ["보호 요인들"],
    "immediateAttention": ["즉시 주의가 필요한 사항들"],
    "longTermMonitoring": ["장기 모니터링이 필요한 지표들"]
  },
  "personalizedRecommendations": {
    "immediate": ["즉시 실행 가능한 심혈관 건강 개선 방안들"],
    "shortTerm": ["단기 목표 (1-3개월)"],
    "longTerm": ["장기 전략 (6개월 이상)"],
    "occupationSpecific": ["직업별 맞춤 심혈관 건강 전략들"]
  }
}
\`\`\`

**중요 지침:**
1. 실제 측정값을 구체적으로 언급하며 해석
2. 연령, 성별, 직업 특성을 종합적으로 고려
3. 의학적 근거에 기반한 해석 제공
4. 개인화된 실용적 권장사항 제시
5. 심혈관 건강의 복합적 측면 분석
6. 예방 중심의 관리 방안 제시

**중요**: 모든 해석은 개인의 특성을 종합적으로 고려하여 제공하며, 전문의 상담이 필요한 경우 의료기관 방문을 권장합니다.`;
  }

  /**
   * 맥파 분석 종합 해석 수행
   */
  static async generatePhysicalHealthComprehensiveInterpretation(
    personalInfo: PersonalInfo,
    measurementData: MeasurementData,
    physicalHealthReport: PhysicalHealthReport
  ): Promise<any> {
    try {
      const prompt = this.generatePhysicalHealthComprehensivePrompt(personalInfo, measurementData, physicalHealthReport);
      const response = await this.makeRequest(prompt, this.DEFAULT_CONFIG);
      const responseText = this.extractTextFromResponse(response);
      
      // JSON 파싱 시도
      try {
        const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[1]);
        } else {
          // JSON 형식이 아닐 경우 기본 구조로 반환
          return {
            comprehensiveInterpretation: responseText,
            ageSpecificAnalysis: {
              ageGroup: this.getAgeGroup(this.calculateAge(personalInfo)),
              typicalCharacteristics: "연령대 특성 분석 필요",
              currentComparison: "현재 상태와 연령대 평균 비교 필요",
              riskFactors: ["연령 관련 위험 요소 분석 필요"],
              strengths: ["연령대 강점 분석 필요"]
            },
            genderSpecificAnalysis: {
              gender: personalInfo.gender === 'male' ? '남성' : '여성',
              cardiovascularCharacteristics: "성별 특성 분석 필요",
              hormonalInfluence: "호르몬 영향 분석 필요",
              healthPatterns: "성별 건강 패턴 분석 필요",
              managementPoints: ["성별 맞춤 관리 포인트 분석 필요"]
            },
            occupationalAnalysis: {
              occupation: this.getOccupationLabel(personalInfo.occupation, personalInfo.customOccupation),
              workRequirements: "업무 요구사항 분석 필요",
              stressFactors: ["직업적 스트레스 요인 분석 필요"],
              cardiovascularMatch: "업무 적합성 분석 필요",
              workplaceRisks: ["직업 환경 위험 요소 분석 필요"],
              adaptationStrategies: ["적응 전략 분석 필요"]
            },
            cardiovascularRiskAssessment: {
              primaryRisks: ["주요 위험 요소 분석 필요"],
              protectiveFactors: ["보호 요소 분석 필요"],
              immediateAttention: ["즉시 관심 영역 분석 필요"],
              longTermMonitoring: ["장기 모니터링 영역 분석 필요"]
            },
            personalizedRecommendations: {
              immediate: ["즉시 실행 방안 분석 필요"],
              shortTerm: ["단기 전략 분석 필요"],
              longTerm: ["장기 전략 분석 필요"],
              occupationSpecific: ["직업 맞춤 방법 분석 필요"]
            }
          };
        }
      } catch (parseError) {
        console.error('JSON 파싱 실패:', parseError);
        throw new Error('AI 응답 파싱 실패');
      }
    } catch (error) {
      console.error('신체건강 종합 해석 실패:', error);
      throw new Error(`신체건강 종합 해석 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * 뇌파 분석 종합 해석 프롬프트 생성
   */
  private static generateMentalHealthComprehensivePrompt(
    personalInfo: PersonalInfo,
    measurementData: MeasurementData,
    mentalHealthReport: MentalHealthReport
  ): string {
    const age = this.calculateAge(personalInfo);
    const occupationLabel = this.getOccupationLabel(personalInfo.occupation, personalInfo.customOccupation);
    const qualityAssessment = this.assessMeasurementQuality(measurementData.accMetrics);

    return `
당신은 뇌파 분석 전문 해석 AI입니다. 뇌파 측정 결과를 바탕으로 현재 뇌 기능 상태가 개인의 연령, 성별, 직업적 특성과 어떤 관련이 있는지 종합적으로 해석해주세요.

**중요 지침:**
- 이 분석은 건강 참고 자료이며, 의료 진단이나 치료를 대체하지 않습니다.
- 특정 제품명, 브랜드명, 앱 이름 등은 절대 언급하지 마세요.
- 일반적인 건강 관리 방법과 생활습관 개선 방안만 제시하세요.
- 분석 결과에서 직업을 언급할 때는 반드시 "${occupationLabel}"로 표기하세요.

## 개인 정보
- 이름: ${personalInfo.name}
- 나이: ${age}세 (${this.getAgeGroup(age)} 연령대)
- 성별: ${personalInfo.gender === 'male' ? '남성' : '여성'}
- 직업: ${occupationLabel}

## 뇌파 측정 결과
- 집중력 지수 (Focus Index): ${measurementData.eegMetrics.focusIndex?.value?.toFixed(2) || 'N/A'} (정상범위: 1.8-2.4)
- 이완도 지수 (Relaxation Index): ${measurementData.eegMetrics.relaxationIndex?.value?.toFixed(3) || 'N/A'} (정상범위: 0.18-0.22)  
- 스트레스 지수 (Stress Index): ${measurementData.eegMetrics.stressIndex?.value?.toFixed(2) || 'N/A'} (정상범위: 0.3-0.7)
- 인지 부하 (Cognitive Load): ${measurementData.eegMetrics.cognitiveLoad?.value?.toFixed(2) || 'N/A'} (정상범위: 0.4-0.8)
- 정서 안정성 (Emotional Stability): ${measurementData.eegMetrics.emotionalStability?.value?.toFixed(2) || 'N/A'} (정상범위: 0.5-0.9)
- 좌우뇌 균형 (Hemispheric Balance): ${measurementData.eegMetrics.hemisphericBalance?.value?.toFixed(2) || 'N/A'} (정상범위: -0.1~0.1)
- 총 뇌파 파워 (Total Power): ${measurementData.eegMetrics.totalPower?.value?.toFixed(2) || 'N/A'} (뇌 전체 활성도)

## 뇌파 기반 정신건강 분석 결과
- 점수: ${mentalHealthReport.score}/100 (${mentalHealthReport.status})
- 주요 소견: ${mentalHealthReport.analysis.substring(0, 300)}...
- 핵심 지표: ${Object.entries(mentalHealthReport.keyMetrics).map(([key, value]) => `${key}: ${value}`).join(', ')}

## 측정 품질 평가
${qualityAssessment.assessment}
신뢰도: ${qualityAssessment.reliability}

## 종합 해석 요청사항

### 1. 뇌파 측정 결과의 종합적 의미
- 현재 측정된 모든 뇌파 지표(집중력, 이완도, 스트레스, 인지부하, 정서안정성, 좌우뇌균형, 총파워)의 종합적 해석
- 각 지표의 정상범위 대비 현재 상태와 뇌 기능에 미치는 구체적 영향
- 뇌파 패턴이 보여주는 현재 뇌 상태와 인지기능 수준

### 2. 연령별 특성 분석
- ${age}세 ${this.getAgeGroup(age)} 연령대의 일반적인 뇌 기능 특성
- 현재 측정 결과와 연령대 평균의 비교
- 연령에 따른 정신건강 위험 요소 및 강점

### 3. 성별별 특성 분석
- ${personalInfo.gender === 'male' ? '남성' : '여성'}의 뇌파 패턴 특성
- 호르몬 영향 및 성별 특이적 정신건강 패턴
- 성별을 고려한 정신건강 관리 포인트

### 4. 직업적 특성 분석
- ${occupationLabel}의 업무 특성과 뇌 기능 요구사항
- 직업적 스트레스 요인과 현재 뇌파 패턴의 관계
- 직업 환경에서의 정신건강 위험 요소 및 대응 방안

### 5. 뇌파 분석 종합 해석 및 맞춤형 관리 방안
- 개인 특성을 종합한 뇌 기능 상태 해석
- 우선적으로 개선해야 할 뇌 기능 영역
- 개인 맞춤형 뇌 건강 관리 전략

다음 JSON 형식으로 응답해주세요:

\`\`\`json
{
  "comprehensiveInterpretation": "### 🧠 뇌파 분석 종합 해석\\n\\n**현재 뇌 기능 상태:**\\n- 집중력 지수: ${measurementData.eegMetrics.focusIndex?.value?.toFixed(2) || 'N/A'} (정상범위: 1.8-2.4) - [정상범위 대비 해석 및 인지 기능 의미]\\n- 이완도 지수: ${measurementData.eegMetrics.relaxationIndex?.value?.toFixed(3) || 'N/A'} (정상범위: 0.18-0.22) - [스트레스 관리 능력 및 정신적 이완 상태]\\n- 스트레스 지수: ${measurementData.eegMetrics.stressIndex?.value?.toFixed(2) || 'N/A'} (정상범위: 0.3-0.7) - [뇌의 스트레스 반응 및 부담 정도]\\n- 인지 부하: ${measurementData.eegMetrics.cognitiveLoad?.value?.toFixed(2) || 'N/A'} (정상범위: 0.4-0.8) - [뇌의 피로도 및 인지적 과부하]\\n- 정서 안정성: ${measurementData.eegMetrics.emotionalStability?.value?.toFixed(2) || 'N/A'} (정상범위: 0.5-0.9) - [뇌의 감정 조절 능력 및 정서적 균형]\\n- 좌우뇌 균형: ${measurementData.eegMetrics.hemisphericBalance?.value?.toFixed(2) || 'N/A'} (정상범위: -0.1~0.1) - [좌우뇌 활성도 균형 및 인지적 조화]\\n- 총 파워: ${measurementData.eegMetrics.totalPower?.value?.toFixed(2) || 'N/A'} - [전체 뇌 활성도 및 각성 수준]\\n\\n**개인 특성별 해석:**\\n- 연령대 특성: [${age}세 ${this.getAgeGroup(age)}의 뇌 기능 특성과 현재 상태 비교]\\n- 성별 특성: [${personalInfo.gender === 'male' ? '남성' : '여성'}의 뇌파 패턴 특성과 뇌 기능 연관성]\\n- 직업적 특성: [${occupationLabel}의 업무 요구사항과 현재 뇌 기능 적합성]\\n\\n**뇌 기능 개선 방향:**\\n- 주요 개선 영역: [개인 특성 기반 뇌 기능 개선 영역]\\n- 강점 영역: [현재 가지고 있는 뇌 기능 강점]\\n- 개선 가능성: [개선 가능한 영역 및 방법]",
  "individualMetricsInterpretation": {
    "focusIndex": {
      "value": ${measurementData.eegMetrics.focusIndex?.value?.toFixed(2) || 'N/A'},
      "normalRange": "1.8-2.4",
      "status": "[정상/주의/위험] 범위 판정",
      "interpretation": "베타파 기반 집중력 지수에 대한 개인화된 상세 해석 - 현재 인지 집중 능력, 업무 효율성, 학습 능력과의 연관성",
      "personalizedAdvice": "개인 특성(연령/성별/직업)을 고려한 집중력 개선 방법"
    },
    "relaxationIndex": {
      "value": ${measurementData.eegMetrics.relaxationIndex?.value?.toFixed(3) || 'N/A'},
      "normalRange": "0.18-0.22",
      "status": "[정상/주의/위험] 범위 판정",
      "interpretation": "알파파 기반 이완도 지수에 대한 개인화된 상세 해석 - 현재 스트레스 회복 능력, 정신적 여유, 휴식 효과",
      "personalizedAdvice": "개인 특성을 고려한 이완 및 스트레스 관리 방법"
    },
    "stressIndex": {
      "value": ${measurementData.eegMetrics.stressIndex?.value?.toFixed(2) || 'N/A'},
      "normalRange": "0.3-0.7",
      "status": "[정상/주의/위험] 범위 판정",
      "interpretation": "뇌파 기반 스트레스 지수에 대한 개인화된 상세 해석 - 현재 정신적 긴장도, 스트레스 부담, 자율신경 균형",
      "personalizedAdvice": "개인 특성을 고려한 스트레스 해소 및 관리 전략"
    },
    "cognitiveLoad": {
      "value": ${measurementData.eegMetrics.cognitiveLoad?.value?.toFixed(2) || 'N/A'},
      "normalRange": "0.4-0.8",
      "status": "[정상/주의/위험] 범위 판정",
      "interpretation": "인지 부하 지수에 대한 개인화된 상세 해석 - 현재 뇌의 피로도, 정보처리 부담, 인지적 과부하 상태",
      "personalizedAdvice": "개인 특성을 고려한 인지 부하 관리 및 뇌 피로 회복 방법"
    },
    "emotionalStability": {
      "value": ${measurementData.eegMetrics.emotionalStability?.value?.toFixed(2) || 'N/A'},
      "normalRange": "0.5-0.9",
      "status": "[정상/주의/위험] 범위 판정",
      "interpretation": "정서 안정성 지수에 대한 개인화된 상세 해석 - 현재 감정 조절 능력, 정서적 균형, 기분 변화 패턴",
      "personalizedAdvice": "개인 특성을 고려한 정서 안정성 향상 및 감정 관리 방법"
    },
    "hemisphericBalance": {
      "value": ${measurementData.eegMetrics.hemisphericBalance?.value?.toFixed(2) || 'N/A'},
      "normalRange": "-0.1~0.1",
      "status": "[균형/좌뇌우세/우뇌우세] 판정",
      "interpretation": "좌우뇌 균형 지수에 대한 개인화된 상세 해석 - 현재 좌우뇌 활성도 균형, 인지적 조화, 뇌 기능 효율성",
      "personalizedAdvice": "개인 특성을 고려한 좌우뇌 균형 개선 및 뇌 기능 최적화 방법"
    },
    "totalPower": {
      "value": ${measurementData.eegMetrics.totalPower?.value?.toFixed(2) || 'N/A'},
      "normalRange": "개인별 기준치",
      "status": "[정상/낮음/높음] 활성도 판정",
      "interpretation": "총 뇌파 파워에 대한 개인화된 상세 해석 - 현재 전체 뇌 활성도, 각성 수준, 뇌 기능 전반적 상태",
      "personalizedAdvice": "개인 특성을 고려한 뇌 활성도 최적화 및 뇌 기능 향상 방법"
    }
  },
  "ageSpecificAnalysis": {
    "ageGroup": "${this.getAgeGroup(age)}",
    "typicalCharacteristics": "이 연령대의 일반적인 뇌 기능 특성",
    "currentComparison": "현재 측정 결과와 연령대 평균의 비교",
    "riskFactors": ["연령 관련 정신건강 위험 요소들"],
    "strengths": ["연령대의 정신건강 강점들"]
  },
  "genderSpecificAnalysis": {
    "gender": "${personalInfo.gender === 'male' ? '남성' : '여성'}",
    "brainPatternCharacteristics": "성별 특이적 뇌파 패턴 특성",
    "hormonalInfluence": "호르몬이 뇌 기능 및 정신건강에 미치는 영향",
    "mentalHealthPatterns": "성별 특이적 정신건강 패턴",
    "managementPoints": ["성별을 고려한 정신건강 관리 포인트들"]
  },
  "occupationalAnalysis": {
    "occupation": "${occupationLabel}",
    "workRequirements": "업무에서 요구되는 뇌 기능 특성",
    "stressFactors": ["직업적 스트레스 요인들"],
    "brainFunctionMatch": "현재 뇌 기능과 업무 요구사항의 적합성",
    "workplaceRisks": ["직업 환경에서의 정신건강 위험 요소들"],
    "adaptationStrategies": ["직업적 요구에 대한 적응 전략들"]
  },
  "mentalHealthRiskAssessment": {
    "primaryRisks": ["주요 정신건강 위험 요소들"],
    "protectiveFactors": ["현재 가지고 있는 보호 요소들"],
    "immediateAttention": ["즉시 관심이 필요한 영역들"],
    "longTermMonitoring": ["장기적으로 모니터링이 필요한 영역들"]
  },
  "personalizedRecommendations": {
    "immediate": ["즉시 실행 가능한 정신건강 관리 방법들"],
    "shortTerm": ["단기적 정신건강 개선 전략들"],
    "longTerm": ["장기적 정신건강 유지 전략들"],
    "occupationSpecific": ["직업 특성을 고려한 맞춤형 관리 방법들"]
  }
}
\`\`\`

**중요**: 모든 해석은 개인의 특성을 종합적으로 고려하여 제공하며, 전문의 상담이 필요한 경우 의료기관 방문을 권장합니다.
`;
  }

  /**
   * 뇌파 분석 종합 해석 수행
   */
  static async generateMentalHealthComprehensiveInterpretation(
    personalInfo: PersonalInfo,
    measurementData: MeasurementData,
    mentalHealthReport: MentalHealthReport
  ): Promise<any> {
    try {
      const prompt = this.generateMentalHealthComprehensivePrompt(personalInfo, measurementData, mentalHealthReport);
      const response = await this.makeRequest(prompt, this.DEFAULT_CONFIG);
      const responseText = this.extractTextFromResponse(response);
      
      // JSON 파싱 시도
      try {
        const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[1]);
        } else {
          // JSON 형식이 아닐 경우 기본 구조로 반환
          return {
            comprehensiveInterpretation: responseText,
            ageSpecificAnalysis: {
              ageGroup: this.getAgeGroup(this.calculateAge(personalInfo)),
              typicalCharacteristics: "연령대 특성 분석 필요",
              currentComparison: "현재 상태와 연령대 평균 비교 필요",
              riskFactors: ["연령 관련 위험 요소 분석 필요"],
              strengths: ["연령대 강점 분석 필요"]
            },
            genderSpecificAnalysis: {
              gender: personalInfo.gender === 'male' ? '남성' : '여성',
              brainPatternCharacteristics: "성별 특성 분석 필요",
              hormonalInfluence: "호르몬 영향 분석 필요",
              mentalHealthPatterns: "성별 정신건강 패턴 분석 필요",
              managementPoints: ["성별 맞춤 관리 포인트 분석 필요"]
            },
            occupationalAnalysis: {
              occupation: this.getOccupationLabel(personalInfo.occupation, personalInfo.customOccupation),
              workRequirements: "업무 요구사항 분석 필요",
              stressFactors: ["직업적 스트레스 요인 분석 필요"],
              brainFunctionMatch: "업무 적합성 분석 필요",
              workplaceRisks: ["직업 환경 위험 요소 분석 필요"],
              adaptationStrategies: ["적응 전략 분석 필요"]
            },
            mentalHealthRiskAssessment: {
              primaryRisks: ["주요 위험 요소 분석 필요"],
              protectiveFactors: ["보호 요소 분석 필요"],
              immediateAttention: ["즉시 관심 영역 분석 필요"],
              longTermMonitoring: ["장기 모니터링 영역 분석 필요"]
            },
            personalizedRecommendations: {
              immediate: ["즉시 실행 방안 분석 필요"],
              shortTerm: ["단기 전략 분석 필요"],
              longTerm: ["장기 전략 분석 필요"],
              occupationSpecific: ["직업 맞춤 방법 분석 필요"]
            }
          };
        }
      } catch (parseError) {
        console.error('JSON 파싱 실패:', parseError);
        throw new Error('AI 응답 파싱 실패');
      }
    } catch (error) {
      console.error('정신건강 종합 해석 실패:', error);
      throw new Error(`정신건강 종합 해석 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

} 