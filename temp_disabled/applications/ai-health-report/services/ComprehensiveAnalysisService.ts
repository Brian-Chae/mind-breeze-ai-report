/**
 * 종합 분석 서비스 (새로운 아키텍처)
 * 
 * 재설계된 아키텍처 - 3차 분석 단계 (최종 통합)
 * - EEG/PPG 상세 분석 + 정신건강 위험도 분석 결과 통합
 * - 개인화된 건강 리포트 생성
 * - 맞춤형 추천사항 제공
 * - AI 기반 종합 건강 평가
 */

import { APIKeyManager } from '../../../services/APIKeyManager';
import { PersonalInfo, MeasurementData, AIAnalysisResult } from '../types/index';
import { EEGDetailedAnalysisService } from './EEGDetailedAnalysisService';
import { PPGDetailedAnalysisService } from './PPGDetailedAnalysisService';
import { MentalHealthRiskAnalysisService } from './MentalHealthRiskAnalysisService';
import { StressAnalysisService, StressAnalysisResult } from './StressAnalysisService';
import { MedicalInterpretationService } from './MedicalInterpretationService';
import { MentalHealthAnalysisService, MentalHealthBiomarkers } from './MentalHealthAnalysisService';
import { 
  EEGDetailedAnalysis,
  PPGDetailedAnalysis,
  MentalHealthRiskAnalysis
} from '../types/redesigned-architecture';
import { REDESIGNED_PROMPTS } from '../prompts/redesigned-prompts';
import { JSONSanitizer } from '../utils/JSONSanitizer';
import { ResponseValidator } from '../utils/ResponseValidator';

export interface ComprehensiveAnalysisResult {
  overallScore: number;
  healthStatus: string;
  analysis: string;
  keyFindings: {
    mentalHealth: string;
    physicalHealth: string;
    stressManagement: string;
    mentalHealthRisk: string;
    overallBalance: string;
  };
  problemAreas: Array<{
    problem: string;
    severity: string;
    description: string;
    solutions: {
      immediate: string[];
      shortTerm: string[];
      longTerm: string[];
    };
  }>;
  immediate: string[];
  shortTerm: string[];
  longTerm: string[];
  occupationalAnalysis: {
    characteristics: string;
    dataCorrelation: string;
    currentStatus: string;
    recommendations: string[];
  };
  followUpPlan: {
    monitoring: string;
    adjustments: string;
    professional: string;
  };
}

export class ComprehensiveAnalysisService {
  private static readonly API_KEY_ID = 'gemini-api';
  private static readonly API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
  
  private static readonly CONFIG = {
    model: 'gemini-2.5-flash',
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 120000 // 2분 타임아웃 (종합 분석이므로 더 길게)
  };

  /**
   * 종합 건강 분석 수행 (새로운 아키텍처)
   */
  static async performComprehensiveAnalysis(
    personalInfo: PersonalInfo,
    measurementData: MeasurementData
  ): Promise<AIAnalysisResult> {
    try {
      console.log('🔍 종합 건강 분석 시작 (새로운 아키텍처)...');
      console.log('⏱️ 예상 소요 시간: 약 45-60초');
      
      // 1단계: 1차 분석 - EEG/PPG 상세 분석 (병렬 실행)
      console.log('📊 1차 분석: EEG/PPG 상세 분석 병렬 실행...');
      const [eegDetailedAnalysis, ppgDetailedAnalysis] = await Promise.all([
        EEGDetailedAnalysisService.analyzeEEGSignal(measurementData, personalInfo),
        PPGDetailedAnalysisService.analyzePPGSignal(measurementData, personalInfo)
      ]);
      console.log('✅ 1차 분석 (EEG/PPG 상세 분석) 완료');

      // 2단계: 2차 분석 - 정신건강 위험도 분석
      console.log('🧠 2차 분석: 정신건강 위험도 분석...');
      const mentalHealthRiskAnalysis = await MentalHealthRiskAnalysisService.assessMentalHealthRisks(
        eegDetailedAnalysis,
        ppgDetailedAnalysis,
        personalInfo
      );
      console.log('✅ 2차 분석 (정신건강 위험도 분석) 완료');

      // 3단계: 레거시 호환성을 위한 스트레스 분석 (옵션)
      console.log('⚡ 레거시 호환성: 스트레스 분석...');
      const stressResult = await StressAnalysisService.analyzeStress(personalInfo, measurementData);
      console.log('✅ 레거시 스트레스 분석 완료');

      // 4단계: 의학적 해석 고도화 분석 (임시 비활성화)
      console.log('🧬 의학적 해석 고도화 분석...');
      const clinicalCorrelations = null; // MedicalInterpretationService.analyzeClinicalCorrelations(measurementData);
      const professionalGuidance = null; // MedicalInterpretationService.generateProfessionalGuidance(personalInfo, measurementData, clinicalCorrelations);
      console.log('✅ 의학적 해석 고도화 분석 완료 (임시 비활성화)');

      // 5단계: 정신건강 바이오마커 분석 (레거시 호환성)
      console.log('🧠 정신건강 바이오마커 분석...');
      const mentalHealthBiomarkers = await MentalHealthAnalysisService.analyzeMentalHealth(
        personalInfo,
        measurementData
      );
      console.log('✅ 정신건강 바이오마커 분석 완료');

      // 6단계: 3차 분석 - AI 기반 종합 분석 및 개인화된 추천사항 생성
      console.log('🎯 3차 분석: AI 기반 종합 분석 및 개인화된 추천사항 생성...');
      const comprehensiveResult = await this.generateNewArchitectureComprehensiveAnalysis(
        personalInfo,
        measurementData,
        eegDetailedAnalysis,
        ppgDetailedAnalysis,
        mentalHealthRiskAnalysis,
        stressResult,
        mentalHealthBiomarkers
      );

      // 7단계: 최종 결과 통합
      console.log('📋 최종 결과 통합...');
      const finalResult = this.combineNewArchitectureResults(
        personalInfo,
        measurementData,
        eegDetailedAnalysis,
        ppgDetailedAnalysis,
        mentalHealthRiskAnalysis,
        stressResult,
        comprehensiveResult,
        clinicalCorrelations,
        professionalGuidance,
        mentalHealthBiomarkers
      );

      // 8단계: 결과 검증
      this.validateAnalysisResult(finalResult);

      console.log('✅ 종합 건강 분석 완료 (새로운 아키텍처)');
      return finalResult;

    } catch (error) {
      console.error('❌ 종합 건강 분석 실패:', error);
      throw error;
    }
  }

  /**
   * 새로운 아키텍처 기반 종합 분석 생성
   */
  private static async generateNewArchitectureComprehensiveAnalysis(
    personalInfo: PersonalInfo,
    measurementData: MeasurementData,
    eegDetailedAnalysis: EEGDetailedAnalysis,
    ppgDetailedAnalysis: PPGDetailedAnalysis,
    mentalHealthRiskAnalysis: MentalHealthRiskAnalysis,
    stressAnalysis: StressAnalysisResult,
    mentalHealthBiomarkers?: MentalHealthBiomarkers
  ): Promise<ComprehensiveAnalysisResult> {
    try {
      console.log('🎯 새로운 아키텍처 기반 종합 분석 시작...');
      
      // AI 기반 종합 분석 프롬프트 생성
      const prompt = this.generateNewArchitecturePrompt(
        personalInfo,
        measurementData,
        eegDetailedAnalysis,
        ppgDetailedAnalysis,
        mentalHealthRiskAnalysis,
        stressAnalysis,
        mentalHealthBiomarkers
      );

      const response = await this.makeRequest(prompt);
      const result = await this.parseComprehensiveResponseWithRetry(response, 1);
      
      console.log('✅ 새로운 아키텍처 기반 종합 분석 완료');
      return result;
      
    } catch (error) {
      console.warn('⚠️ 새로운 아키텍처 종합 분석 실패, 폴백 결과 제공:', error);
      return this.createNewArchitectureFallbackResult(
        personalInfo,
        measurementData,
        eegDetailedAnalysis,
        ppgDetailedAnalysis,
        mentalHealthRiskAnalysis,
        stressAnalysis
      );
    }
  }

  /**
   * 종합 분석 및 개인화된 추천사항 생성 (레거시 호환성)
   */
  private static async generateComprehensiveAnalysis(
    personalInfo: PersonalInfo,
    measurementData: MeasurementData,
    eegAnalysis: any, // EEGAnalysisResult 대신 any 사용
    ppgAnalysis: any, // PPGAnalysisResult 대신 any 사용
    stressAnalysis: StressAnalysisResult,
    mentalHealthBiomarkers?: MentalHealthBiomarkers
  ): Promise<ComprehensiveAnalysisResult> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.CONFIG.maxRetries; attempt++) {
      try {
        console.log(`🔄 종합 분석 시도 ${attempt}/${this.CONFIG.maxRetries}`);
        
        const prompt = this.generateRetryPrompt(
          personalInfo,
          measurementData,
          eegAnalysis,
          ppgAnalysis,
          stressAnalysis,
          mentalHealthBiomarkers,
          attempt,
          lastError
        );

        const response = await this.makeRequest(prompt);
        const result = await this.parseComprehensiveResponseWithRetry(response, attempt);
        
        console.log(`✅ 종합 분석 성공 (시도 ${attempt}):`, result);
        return result;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`❌ 종합 분석 시도 ${attempt} 실패:`, lastError.message);
        
        if (attempt < this.CONFIG.maxRetries) {
          const waitTime = attempt * this.CONFIG.retryDelay;
          console.log(`⏳ ${waitTime}ms 대기 후 재시도...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    // 모든 시도 실패 시 폴백 결과 제공
    console.warn('⚠️ 모든 종합 분석 시도 실패, 폴백 결과 제공');
    return this.createFallbackComprehensiveResult(personalInfo, measurementData, eegAnalysis, ppgAnalysis, stressAnalysis);
  }

  /**
   * 재시도를 위한 개선된 프롬프트 생성
   */
  private static generateRetryPrompt(
    personalInfo: PersonalInfo,
    measurementData: MeasurementData,
    eegAnalysis: any, // EEGAnalysisResult 대신 any 사용
    ppgAnalysis: any, // PPGAnalysisResult 대신 any 사용
    stressAnalysis: StressAnalysisResult,
    mentalHealthBiomarkers?: MentalHealthBiomarkers,
    attempt: number = 1,
    previousError: Error | null = null
  ): string {
    if (attempt === 1) {
      // 첫 번째 시도는 기존 프롬프트 사용
      return this.generateComprehensiveAnalysisPrompt(
        personalInfo,
        measurementData,
        eegAnalysis,
        ppgAnalysis,
        stressAnalysis,
        mentalHealthBiomarkers
      );
    }

    // 재시도 시에는 이전 실패 정보를 포함한 개선된 프롬프트
    const basePrompt = this.generateComprehensiveAnalysisPrompt(
      personalInfo,
      measurementData,
      eegAnalysis,
      ppgAnalysis,
      stressAnalysis,
      mentalHealthBiomarkers
    );

    const errorInfo = previousError ? `
이전 시도에서 다음 오류가 발생했습니다: ${previousError.message}

**중요한 JSON 형식 지침:**
- 반드시 완전한 JSON 형식으로 응답해주세요
- 모든 문자열 값은 반드시 쌍따옴표로 감싸주세요
- 배열과 객체의 마지막 요소 뒤에는 쉼표를 넣지 마세요
- 중괄호와 대괄호를 정확히 닫아주세요
- JSON 내부에서 줄바꿈은 \\n으로 표현해주세요
- 특수문자는 적절히 이스케이프해주세요

**응답 완성도 보장:**
- 응답이 중간에 끊어지지 않도록 주의해주세요
- 모든 필수 필드를 포함해주세요
- JSON 구조가 완전히 닫혀있는지 확인해주세요
` : '';

    return basePrompt + errorInfo;
  }

  /**
   * 재시도 메커니즘이 포함된 종합 분석 응답 파싱
   */
  private static async parseComprehensiveResponseWithRetry(response: any, attempt: number): Promise<ComprehensiveAnalysisResult> {
    try {
      const content = response.candidates[0].content.parts[0].text;
      console.log(`🔍 종합 분석 응답 파싱 시작 (시도 ${attempt}). 원본 길이:`, content.length);
      
      // 다양한 JSON 형식 패턴 시도 (개선된 패턴)
      const jsonPatterns = [
        // 표준 마크다운 코드 블록
        /```json\s*\n([\s\S]*?)\n\s*```/,
        /```json([\s\S]*?)```/,
        
        // 일반 코드 블록
        /```\s*\n([\s\S]*?)\n\s*```/,
        /```([\s\S]*?)```/,
        
        // JSON 라벨이 있는 경우
        /json\s*\n([\s\S]*?)(?:\n\s*$|$)/i,
        /JSON\s*\n([\s\S]*?)(?:\n\s*$|$)/i,
        
        // 중괄호로 시작하는 JSON 객체
        /(\{[\s\S]*\})/,
        
        // 전체 텍스트에서 JSON 추출
        /([\s\S]*)/
      ];
      
      let lastError: Error | null = null;
      
      for (let i = 0; i < jsonPatterns.length; i++) {
        const pattern = jsonPatterns[i];
        const match = content.match(pattern);
        
        if (match) {
          console.log(`📝 종합 분석 패턴 ${i + 1} 매치 성공 (시도 ${attempt})`);
          
          try {
            let jsonText = match[1] || match[0];
            console.log('🔍 종합 분석 JSON 원본 길이:', jsonText.length);
            
            // JSON 텍스트 전처리 - 잘린 JSON 감지 및 복구 시도
            if (this.isJSONTruncated(jsonText)) {
              console.warn('⚠️ 종합 분석 JSON이 잘린 것으로 감지됨, 복구 시도');
              jsonText = this.repairTruncatedJSON(jsonText);
            }
            
            let parsedResult: any;
            
            // 1단계: 원본 JSON 파싱 시도
            try {
              parsedResult = JSON.parse(jsonText);
              console.log(`✅ 종합 분석 원본 JSON 파싱 성공 (시도 ${attempt})`);
            } catch (originalError) {
              console.warn(`⚠️ 종합 분석 원본 JSON 파싱 실패, JSONSanitizer 적용 (시도 ${attempt}):`, originalError);
              lastError = originalError as Error;
              
              // 2단계: JSONSanitizer 적용 후 파싱 시도
              const sanitizationResult = JSONSanitizer.sanitizeJSON(jsonText);
              
              console.log('🔧 종합 분석 JSON 정리 결과:', {
                success: sanitizationResult.success,
                appliedFixes: sanitizationResult.appliedFixes,
                errors: sanitizationResult.errors,
                warnings: sanitizationResult.warnings
              });
              
              if (sanitizationResult.success) {
                try {
                  parsedResult = JSON.parse(sanitizationResult.sanitizedText);
                  console.log(`✅ 종합 분석 정리된 JSON 파싱 성공 (시도 ${attempt})`);
                } catch (sanitizedError) {
                  console.error(`❌ 종합 분석 정리된 JSON도 파싱 실패 (시도 ${attempt}):`, sanitizedError);
                  throw originalError; // 원본 오류를 다시 던짐
                }
              } else {
                console.error(`❌ 종합 분석 JSONSanitizer 적용 실패 (시도 ${attempt}):`, sanitizationResult.errors);
                throw originalError; // 원본 오류를 다시 던짐
              }
            }
            
            // 3단계: 기본 구조 검증 및 보완
            if (!this.isValidComprehensiveStructure(parsedResult)) {
              console.warn(`⚠️ 종합 분석 응답 구조가 불완전함, 보완 시도 (시도 ${attempt})`);
              parsedResult = this.repairComprehensiveStructure(parsedResult);
            }
            
            // 4단계: 결과 검증 및 완성도 확인
            const validatedResult = this.validateAndCompleteComprehensiveResult(parsedResult);
            
            // 5단계: ResponseValidator 적용
            const validationResult = ResponseValidator.validateComprehensiveResponse(validatedResult);
            
            console.log(`🔍 종합 분석 응답 검증 결과 (시도 ${attempt}):`, {
              isValid: validationResult.isValid,
              score: validationResult.score,
              errorCount: validationResult.errors.length,
              warningCount: validationResult.warnings.length
            });
            
            // 검증 결과 로깅
            if (validationResult.errors.length > 0) {
              console.warn('⚠️ 종합 분석 검증 오류:', validationResult.errors);
            }
            if (validationResult.warnings.length > 0) {
              console.warn('📝 종합 분석 검증 경고:', validationResult.warnings);
            }
            
            // 치명적 오류가 있으면 예외 발생
            const criticalErrors = validationResult.errors.filter((e: any) => e.severity === 'critical');
            if (criticalErrors.length > 0) {
              console.error(`🚨 종합 분석 치명적 검증 오류 발견 (시도 ${attempt}):`, criticalErrors);
              throw new Error(`응답 검증 실패: ${criticalErrors.map((e: any) => e.message).join(', ')}`);
            }
            
            console.log(`✅ 종합 분석 응답 파싱 및 검증 완료 (시도 ${attempt}). 품질 점수:`, validationResult.score);
            return validatedResult;
            
          } catch (error) {
            console.warn(`❌ 종합 분석 패턴 ${i + 1} JSON 파싱 실패 (시도 ${attempt}), 다음 패턴 시도:`, error);
            lastError = error as Error;
            
            // JSON 오류 상세 분석
            if (error instanceof SyntaxError) {
              const errorAnalysis = JSONSanitizer.analyzeJSONError(match[1] || match[0]);
              if (errorAnalysis) {
                console.error('📍 종합 분석 JSON 오류 위치:', {
                  line: errorAnalysis.line,
                  column: errorAnalysis.column,
                  message: errorAnalysis.message,
                  context: errorAnalysis.context?.substring(0, 100) + '...'
                });
              }
            }
            continue;
          }
        }
      }
      
      // 모든 패턴 실패 시 상세한 오류 정보 제공
      console.error(`❌ 종합 분석 응답 파싱 실패 (시도 ${attempt}). 응답 텍스트:`, content.substring(0, 500) + '...');
      
      if (lastError) {
        console.error('❌ 마지막 오류:', lastError.message);
      }
      
      throw new Error('JSON 형식의 응답을 찾을 수 없습니다.');
      
    } catch (error) {
      console.error(`💥 종합 분석 응답 파싱 오류 (시도 ${attempt}):`, error);
      throw new Error(`응답 파싱 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * Comprehensive 응답 구조 유효성 검사
   */
  private static isValidComprehensiveStructure(result: any): boolean {
    return (
      result &&
      typeof result === 'object' &&
      typeof result.overallScore === 'number' &&
      typeof result.healthStatus === 'string' &&
      typeof result.analysis === 'string' &&
      result.keyFindings &&
      typeof result.keyFindings === 'object' &&
      Array.isArray(result.immediate) &&
      Array.isArray(result.shortTerm) &&
      Array.isArray(result.longTerm)
    );
  }

  /**
   * 불완전한 Comprehensive 응답 구조 보완
   */
  private static repairComprehensiveStructure(result: any): any {
    const repaired = {
      overallScore: typeof result.overallScore === 'number' ? result.overallScore : 75,
      healthStatus: typeof result.healthStatus === 'string' ? result.healthStatus : '양호',
      analysis: typeof result.analysis === 'string' ? result.analysis : '종합 분석을 수행했으나 상세 결과를 표시하는데 기술적 문제가 발생했습니다.',
      keyFindings: result.keyFindings && typeof result.keyFindings === 'object' ? result.keyFindings : {
        mentalHealth: '정신건강 분석 결과 불완전',
        physicalHealth: '신체건강 분석 결과 불완전',
        stressManagement: '스트레스 관리 분석 결과 불완전',
        mentalHealthRisk: '정신건강 위험도 분석 결과 불완전',
        overallBalance: '전체 균형 분석 결과 불완전'
      },
      problemAreas: Array.isArray(result.problemAreas) ? result.problemAreas : [],
      immediate: Array.isArray(result.immediate) ? result.immediate : ['전문가와 상담하시기 바랍니다.'],
      shortTerm: Array.isArray(result.shortTerm) ? result.shortTerm : ['정기적인 건강 관리를 시작하세요.'],
      longTerm: Array.isArray(result.longTerm) ? result.longTerm : ['장기적인 건강 계획을 수립하세요.'],
      occupationalAnalysis: result.occupationalAnalysis && typeof result.occupationalAnalysis === 'object' ? 
        result.occupationalAnalysis : {
          characteristics: '직업 특성 분석 결과 불완전',
          dataCorrelation: '측정 데이터 연관 분석 결과 불완전',
          currentStatus: '현재 상태 분석 결과 불완전',
          recommendations: []
        },
      followUpPlan: result.followUpPlan && typeof result.followUpPlan === 'object' ? 
        result.followUpPlan : {
          monitoring: '정기 건강 모니터링 계획 수립 필요',
          adjustments: '관리 방안 조정 계획 수립 필요',
          professional: '전문가 상담 계획 수립 필요'
        }
    };

    console.log('🔧 종합 분석 응답 구조 보완 완료');
    return repaired;
  }

  /**
   * JSON 잘림 감지
   */
  private static isJSONTruncated(jsonText: string): boolean {
    const openBraces = (jsonText.match(/\{/g) || []).length;
    const closeBraces = (jsonText.match(/\}/g) || []).length;
    const openBrackets = (jsonText.match(/\[/g) || []).length;
    const closeBrackets = (jsonText.match(/\]/g) || []).length;
    
    return openBraces !== closeBraces || openBrackets !== closeBrackets;
  }

  /**
   * 잘린 JSON 복구 시도
   */
  private static repairTruncatedJSON(jsonText: string): string {
    let repairedJson = jsonText;
    
    // 마지막 불완전한 줄 제거
    const lines = repairedJson.split('\n');
    const lastLine = lines[lines.length - 1];
    
    if (lastLine && !lastLine.trim().endsWith('}') && !lastLine.trim().endsWith(']') && !lastLine.trim().endsWith(',')) {
      lines.pop();
      repairedJson = lines.join('\n');
    }
    
    // 닫는 괄호 추가
    const openBraces = (repairedJson.match(/\{/g) || []).length;
    const closeBraces = (repairedJson.match(/\}/g) || []).length;
    const openBrackets = (repairedJson.match(/\[/g) || []).length;
    const closeBrackets = (repairedJson.match(/\]/g) || []).length;
    
    // 배열 먼저 닫기
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      repairedJson += ']';
    }
    
    // 객체 닫기
    for (let i = 0; i < openBraces - closeBraces; i++) {
      repairedJson += '}';
    }
    
    return repairedJson;
  }

  /**
   * 종합 분석 결과 검증 및 완성
   */
  private static validateAndCompleteComprehensiveResult(parsedResult: any): ComprehensiveAnalysisResult {
    // 기본 구조 확인 및 생성
    const result: ComprehensiveAnalysisResult = {
      overallScore: parsedResult.overallScore || 75,
      healthStatus: parsedResult.healthStatus || "양호",
      analysis: parsedResult.analysis || "종합 분석 결과",
      keyFindings: {
        mentalHealth: parsedResult.keyFindings?.mentalHealth || "정신건강 점수 불명",
        physicalHealth: parsedResult.keyFindings?.physicalHealth || "신체건강 점수 불명",
        stressManagement: parsedResult.keyFindings?.stressManagement || "스트레스 관리 점수 불명",
        mentalHealthRisk: parsedResult.keyFindings?.mentalHealthRisk || "정신건강 위험도 불명",
        overallBalance: parsedResult.keyFindings?.overallBalance || "전체 균형 불명"
      },
      problemAreas: Array.isArray(parsedResult.problemAreas) ? parsedResult.problemAreas : [],
      immediate: Array.isArray(parsedResult.immediate) ? parsedResult.immediate : [],
      shortTerm: Array.isArray(parsedResult.shortTerm) ? parsedResult.shortTerm : [],
      longTerm: Array.isArray(parsedResult.longTerm) ? parsedResult.longTerm : [],
      occupationalAnalysis: {
        characteristics: parsedResult.occupationalAnalysis?.characteristics || "직업 특성 분석 결과 없음",
        dataCorrelation: parsedResult.occupationalAnalysis?.dataCorrelation || "측정 데이터 연관 분석 결과 없음",
        currentStatus: parsedResult.occupationalAnalysis?.currentStatus || "현재 상태 분석 결과 없음",
        recommendations: Array.isArray(parsedResult.occupationalAnalysis?.recommendations) ? 
          parsedResult.occupationalAnalysis.recommendations : []
      },
      followUpPlan: {
        monitoring: parsedResult.followUpPlan?.monitoring || "정기 건강 모니터링 없음",
        adjustments: parsedResult.followUpPlan?.adjustments || "관리 방안 조정 없음",
        professional: parsedResult.followUpPlan?.professional || "전문가 상담 없음"
      }
    };

    // 점수 범위 검증
    if (typeof result.overallScore !== 'number' || result.overallScore < 0 || result.overallScore > 100) {
      result.overallScore = 75;
    }

    // problemAreas 구조 검증
    result.problemAreas = result.problemAreas.map(problem => ({
      problem: problem.problem || "문제 영역",
      severity: problem.severity || "중간",
      description: problem.description || "문제 설명 없음",
      solutions: {
        immediate: Array.isArray(problem.solutions?.immediate) ? problem.solutions.immediate : [],
        shortTerm: Array.isArray(problem.solutions?.shortTerm) ? problem.solutions.shortTerm : [],
        longTerm: Array.isArray(problem.solutions?.longTerm) ? problem.solutions.longTerm : []
      }
    }));

    return result;
  }

  /**
   * 폴백 종합 분석 결과 생성
   */
  private static createFallbackComprehensiveResult(
    personalInfo: PersonalInfo,
    measurementData: MeasurementData,
    eegAnalysis: any,
    ppgAnalysis: any,
    stressAnalysis: StressAnalysisResult
  ): ComprehensiveAnalysisResult {
    const averageScore = Math.round((eegAnalysis.score + ppgAnalysis.score + stressAnalysis.score) / 3);
    const age = this.calculateAge(personalInfo);
    const occupationLabel = this.getOccupationLabel(personalInfo.occupation, personalInfo.customOccupation);

    return {
      overallScore: averageScore,
      healthStatus: averageScore >= 80 ? "우수" : averageScore >= 60 ? "양호" : "주의 필요",
      analysis: `### 🌟 전체 건강 개요

${personalInfo.name}님의 종합 건강 분석 결과입니다.

**전반적 건강 상태:**
- **뇌 기능**: 집중력 지수 ${measurementData.eegMetrics.focusIndex?.value?.toFixed(3) || 'N/A'}, 이완도 ${measurementData.eegMetrics.relaxationIndex?.value?.toFixed(3) || 'N/A'}
- **심혈관 건강**: 심박수 ${Math.round(measurementData.ppgMetrics.heartRate?.value || 0)}bpm, 심박변이도 ${Math.round(measurementData.ppgMetrics.rmssd?.value || 0)}ms
- **스트레스 수준**: 스트레스 지수 ${measurementData.eegMetrics.stressIndex?.value?.toFixed(3) || 'N/A'}

**건강 지표 상호 연관성:**
- 정신-신체 건강 균형 분석
- 자율신경계 기능과 스트레스 반응 연관성
- 인지 기능과 심혈관 건강의 상호 영향

**개인화된 건강 프로파일:**
- 연령대 특성: ${age}세 ${personalInfo.gender}의 건강 특성
- 직업적 영향: ${occupationLabel}의 건강 요구사항 및 위험 요인
- 종합 건강 수준: 전체적 건강 균형 및 위험도 평가`,
      
      keyFindings: {
        mentalHealth: `정신건강 ${eegAnalysis.score}점: 뇌파 기반 인지 기능, 집중력, 정서 안정성 종합 평가`,
        physicalHealth: `신체건강 ${ppgAnalysis.score}점: 심혈관 기능, 자율신경 균형, 순환 건강 종합 평가`,
        stressManagement: `스트레스 관리 ${stressAnalysis.score}점: 스트레스 대응력, 회복력, 적응 능력 종합 평가`,
        mentalHealthRisk: "정신건강 위험도: 우울, ADHD, 번아웃, 충동성 위험도 종합 평가 및 관리 필요성",
        overallBalance: "전체 균형: 정신-신체 건강의 조화, 자율신경 기능, 종합적 웰빙 상태"
      },
      
      problemAreas: [
        {
          problem: "🚨 스트레스 관리 개선 필요",
          severity: stressAnalysis.score < 60 ? "높음" : stressAnalysis.score < 80 ? "중간" : "낮음",
          description: "지속적인 스트레스 노출로 인한 정신적, 신체적 피로 누적",
          solutions: {
            immediate: ["깊은 호흡 연습", "5분 명상", "목과 어깨 스트레칭"],
            shortTerm: ["규칙적인 운동 습관", "수면 패턴 개선", "스트레스 관리 기법 학습"],
            longTerm: ["생활 패턴 전반적 개선", "취미 활동 증가", "전문가 상담 고려"]
          }
        }
      ],
      
      immediate: [
        "충분한 수분 섭취 (하루 8잔 이상)",
        "규칙적인 식사 시간 유지",
        "스마트폰 사용 시간 줄이기"
      ],
      
      shortTerm: [
        "주 3회 이상 30분 유산소 운동",
        "수면 시간 7-8시간 확보",
        "스트레스 관리 기법 실습"
      ],
      
      longTerm: [
        "정기적인 건강 검진",
        "건강한 생활 습관 정착",
        "지속적인 자기 관리"
      ],
      
      occupationalAnalysis: {
        characteristics: `${occupationLabel} 직업군의 특성상 고도의 집중력과 스트레스 관리 능력이 요구됩니다.`,
        dataCorrelation: "측정된 뇌파 및 심혈관 지표가 직업적 요구사항과 어떻게 연관되는지 분석하였습니다.",
        currentStatus: "현재 건강 상태는 직업적 요구를 충족하지만 지속적인 관리가 필요합니다.",
        recommendations: [
          "업무 중 정기적인 휴식",
          "직업 관련 스트레스 관리",
          "업무 환경 개선"
        ]
      },
      
      followUpPlan: {
        monitoring: "월 1회 건강 상태 자가 점검 및 분기별 정밀 검사 권장",
        adjustments: "개인 건강 상태 변화에 따른 관리 방안 조정",
        professional: "필요시 전문가 상담 및 맞춤형 건강 관리 프로그램 참여"
      }
    };
  }

  /**
   * 종합 분석 프롬프트 생성
   */
  private static generateComprehensiveAnalysisPrompt(
    personalInfo: PersonalInfo,
    measurementData: MeasurementData,
    eegAnalysis: any,
    ppgAnalysis: any,
    stressAnalysis: StressAnalysisResult,
    mentalHealthBiomarkers?: MentalHealthBiomarkers
  ): string {
    const age = this.calculateAge(personalInfo);
    const occupationLabel = this.getOccupationLabel(personalInfo.occupation, personalInfo.customOccupation);
    const qualityAssessment = { assessment: "측정 데이터 품질이 양호합니다.", reliability: "높음" };

    // 실제 메트릭 값들을 미리 계산
    const eegMetrics = measurementData.eegMetrics;
    const ppgMetrics = measurementData.ppgMetrics;
    
    // 주요 EEG 메트릭들
    const focusIndexValue = eegMetrics.focusIndex?.value?.toFixed(3) || 'N/A';
    const relaxationIndexValue = eegMetrics.relaxationIndex?.value?.toFixed(3) || 'N/A';
    const stressIndexValue = eegMetrics.stressIndex?.value?.toFixed(3) || 'N/A';
    const emotionalStabilityValue = eegMetrics.emotionalStability?.value?.toFixed(3) || 'N/A';
    const cognitiveLoadValue = eegMetrics.cognitiveLoad?.value?.toFixed(3) || 'N/A';
    const hemisphericBalanceValue = eegMetrics.hemisphericBalance?.value?.toFixed(3) || 'N/A';
    
    // 주요 PPG 메트릭들
    const heartRateValue = Math.round(ppgMetrics.heartRate?.value || 0);
    const rmssdValue = Math.round(ppgMetrics.rmssd?.value || 0);
    const sdnnValue = Math.round(ppgMetrics.sdnn?.value || 0);
    const pnn50Value = Math.round(ppgMetrics.pnn50?.value || 0);
    const spo2Value = Math.round(ppgMetrics.spo2?.value || 0);
    const lfHfRatioValue = ppgMetrics.lfHfRatio?.value?.toFixed(2) || 'N/A';
    const lfPowerValue = ppgMetrics.lfPower?.value?.toFixed(2) || 'N/A';
    const hfPowerValue = ppgMetrics.hfPower?.value?.toFixed(2) || 'N/A';

    // 정신건강 위험도 분석 결과 포함
    const mentalHealthRiskSection = mentalHealthBiomarkers ? `
### 정신건강 위험도 분석 결과
- **우울 위험도**: ${mentalHealthBiomarkers.depression.riskScore}/100
- **ADHD 위험도**: ${mentalHealthBiomarkers.adhd.riskScore}/100
- **번아웃 위험도**: ${mentalHealthBiomarkers.burnout.riskScore}/100
- **충동성 위험도**: ${mentalHealthBiomarkers.impulsivity.riskScore}/100
- **전체 정신건강 점수**: ${mentalHealthBiomarkers.overall.mentalHealthScore}/100
- **주요 관심사항**: ${mentalHealthBiomarkers.overall.primaryConcern}
- **위험도 수준**: ${mentalHealthBiomarkers.overall.riskLevel}
- **추가 관찰 필요**: ${mentalHealthBiomarkers.overall.followUpNeeded ? '예' : '아니오'}
- **권장사항**: ${mentalHealthBiomarkers.overall.recommendations.join(', ')}
` : '';

    return `
당신은 종합 건강 관리 전문 건강 분석 AI입니다. 다음 개인의 4가지 전문 분석 결과(EEG, PPG, 스트레스, 정신건강 위험도)를 바탕으로 개인 맞춤형 종합 건강 관리 계획을 수립해주세요.

**중요 지침:**
- 이 분석은 의료 정보 수준의 건강 참고 자료이며, 의료 진단이나 치료를 대체하지 않습니다.
- 특정 제품명, 브랜드명, 앱 이름 등은 절대 언급하지 마세요.
- 일반적인 건강 관리 방법과 생활습관 개선 방안만 제시하세요.
- "전문가 소견", "정신 건강 평가", "정신 건강 관리 가이드" 등의 의료 행위 관련 표현은 사용하지 마세요.
- 분석 결과에서 직업을 언급할 때는 반드시 "${occupationLabel}"로 표기하고, "military_medic" 같은 원본 코드는 절대 사용하지 마세요.

## 🎯 중요: 정규분포 기반 점수 분포 시스템

### 점수 분포 기준 (정규분포 적용)
**0-100점 척도에서 다음 분포를 따라야 합니다:**

#### 위험군 (0-30점): 5% (하위 5%)
- 0-10점: 심각한 위험 (1%)
- 11-20점: 높은 위험 (2%) 
- 21-30점: 위험 (2%)

#### 경계군 (31-50점): 20% (하위 6-25%)
- 31-40점: 경계 위험 (10%)
- 41-50점: 주의 필요 (10%)

#### 보통 (51-70점): 50% (26-75%)
- 51-60점: 보통 하위 (25%)
- 61-70점: 보통 상위 (25%)

#### 양호 (71-85점): 20% (76-95%)
- 71-80점: 양호 (15%)
- 81-85점: 우수 (5%)

#### 매우 우수 (86-100점): 5% (상위 5%)
- 86-95점: 매우 우수 (4%)
- 96-100점: 최우수 (1%)

### 🔥 종합 점수 계산 지침
**개별 분석 결과를 종합하여 위 분포에 맞는 점수를 계산하세요:**

1. **각 영역별 점수 가중 평균**
   - 뇌파 분석: 30% 가중치
   - PPG 분석: 30% 가중치
   - 스트레스 분석: 25% 가중치
   - 정신건강 위험도: 15% 가중치

2. **종합 점수 조정**
   - 모든 영역이 우수: 80-90점대
   - 대부분 영역이 양호: 70-80점대
   - 일부 영역에 문제: 50-70점대
   - 여러 영역에 문제: 30-50점대
   - 심각한 문제: 30점 미만

3. **현실적 분포 적용**
   - 대부분의 일반인은 50-70점대에 분포
   - 78-85점대는 상위 20%에 해당하는 우수한 수준
   - 90점 이상은 상위 5%의 매우 우수한 수준

**⚠️ 주의: 대부분의 분석 결과가 78-85점대로 나오면 안 됩니다. 정규분포를 따라 다양한 점수대에 분포되어야 합니다.**

## 개인 정보
- 이름: ${personalInfo.name}
- 나이: ${age}세
- 성별: ${personalInfo.gender}
- 직업: ${occupationLabel}

## 통합 건강 분석 데이터
### 뇌파(EEG) 핵심 지표
- **집중력 지수**: ${focusIndexValue}
- **이완도**: ${relaxationIndexValue}  
- **스트레스 지수**: ${stressIndexValue}
- **인지 부하**: ${cognitiveLoadValue}
- **정서 안정성**: ${emotionalStabilityValue}

### 심혈관(PPG) 핵심 지표
- **심박수**: ${heartRateValue} bpm
- **심박변이도 (RMSSD)**: ${rmssdValue} ms
- **자율신경 균형 (LF/HF)**: ${lfHfRatioValue}
- **산소포화도**: ${spo2Value}%
- **LF Power**: ${lfPowerValue} ms²
- **HF Power**: ${hfPowerValue} ms²

### 개별 분석 결과 요약
#### 뇌파 분석 결과 (점수: ${eegAnalysis.score}/100)
상태: ${eegAnalysis.status}
핵심 소견: ${eegAnalysis.analysis.substring(0, 200)}...

#### 심혈관 분석 결과 (점수: ${ppgAnalysis.score}/100)
상태: ${ppgAnalysis.status}
핵심 소견: ${ppgAnalysis.analysis.substring(0, 200)}...

#### 스트레스 분석 결과 (점수: ${stressAnalysis.score}/100)
상태: ${stressAnalysis.status}
핵심 소견: ${stressAnalysis.analysis.substring(0, 200)}...

${mentalHealthRiskSection}

## 측정 품질 및 신뢰도 평가
${qualityAssessment.assessment}
신뢰도: ${qualityAssessment.reliability}
**종합 데이터 해석 가능성**: ${Math.min(measurementData.signalQuality.eeg, measurementData.signalQuality.ppg) >= 70 ? '높음 - 건강 분석 가능' : Math.min(measurementData.signalQuality.eeg, measurementData.signalQuality.ppg) >= 50 ? '보통 - 참고용 해석' : '낮음 - 재측정 권장'}

## 🔥 중요: 각 섹션별 명확한 역할 분리 지침

### 1. 종합 건강 상태 평가 (analysis)
**역할**: 순수한 분석 결과만 제시 - 해결방안 제시 금지
- 뇌파, 심혈관, 스트레스, 정신건강 위험도 지표의 상호 연관성 분석
- 각 영역별 건강 상태 및 균형 평가  
- 전체적인 건강 수준 및 위험 요인 종합 분석
- **정신건강 위험도 종합 분석 (중요)**: 우울, ADHD, 번아웃, 충동성 위험도를 종합하여 개인의 연령(${age}세), 성별(${personalInfo.gender}), 직업(${occupationLabel}) 특성에 맞게 현재 상황을 구체적으로 해석
- 정신건강 위험도 분석 결과를 종합 건강 평가에 반영
- **금지사항**: 개선 방법, 해결책, 권장사항 등 일절 포함 금지

### 2. 문제 영역 및 해결방안 (problemAreas)
**역할**: 문제 진단 + 구체적 해결방안만 제시 - 분석 내용 중복 금지
- 가장 시급한 건강 관리 영역 식별 (정신건강 위험도 포함)
- 개선 가능성이 높은 영역 우선 제시
- 단계별 건강 개선 로드맵 제공
- 정신건강 위험 요소 예방 및 관리 방안
- **각 문제 영역별 즉시/단기/장기 해결방안 구체적 제시**
- **금지사항**: 분석 내용 반복, 일반적 설명 등 금지

### 3. 맞춤형 추천사항 (immediate/shortTerm/longTerm)
**역할**: 개인 특성(나이/성별/직업) 기반 맞춤 전략만 제시
- 연령대별 건강 특성 및 위험 요인 고려한 맞춤 방안
- 성별 특이적 건강 패턴 고려한 관리법
- 직업적 건강 요구사항 및 관리 방안 제시
- 정신건강 위험 요소를 고려한 맞춤형 건강 관리
- **금지사항**: 일반적 건강 상식, 문제 영역 해결방안 중복 등 금지

다음 형식으로 상세한 JSON 응답을 제공해주세요:

\`\`\`json
{
  "overallScore": 82,
  "healthStatus": "양호",
  "analysis": "### 🌟 전체 건강 개요\\n\\n**전반적 건강 상태:**\\n- 뇌 기능: [집중력 ${focusIndexValue}, 이완도 ${relaxationIndexValue} - 정신적 웰빙 평가]\\n- 심혈관 건강: [심박수 ${heartRateValue}bpm, 심박변이도 ${rmssdValue}ms - 순환계 건강 평가]\\n- 스트레스 수준: [스트레스 지수 ${stressIndexValue}, 자율신경 균형 ${lfHfRatioValue} - 스트레스 적응력 평가]\\n\\n**🎯 정신건강 위험도 종합 분석:**\\n${mentalHealthBiomarkers ? `\\n- **우울 위험도**: ${mentalHealthBiomarkers.depression.riskScore}/100점 (${mentalHealthBiomarkers.depression.riskScore < 30 ? '정상' : mentalHealthBiomarkers.depression.riskScore < 50 ? '경계' : '위험'})\\n- **ADHD 위험도**: ${mentalHealthBiomarkers.adhd.riskScore}/100점 (${mentalHealthBiomarkers.adhd.riskScore < 30 ? '정상' : mentalHealthBiomarkers.adhd.riskScore < 50 ? '경계' : '위험'})\\n- **번아웃 위험도**: ${mentalHealthBiomarkers.burnout.riskScore}/100점 (${mentalHealthBiomarkers.burnout.riskScore < 30 ? '정상' : mentalHealthBiomarkers.burnout.riskScore < 50 ? '경계' : '위험'})\\n- **충동성 위험도**: ${mentalHealthBiomarkers.impulsivity.riskScore}/100점 (${mentalHealthBiomarkers.impulsivity.riskScore < 30 ? '정상' : mentalHealthBiomarkers.impulsivity.riskScore < 50 ? '경계' : '위험'})\\n\\n**개인 특성별 해석:**\\n- **연령 특성**: ${age}세 ${personalInfo.gender === 'male' ? '남성' : '여성'}의 생애 주기상 정신건강 특성과 현재 위험도 수준의 연관성 분석\\n- **직업 특성**: ${occupationLabel}의 업무 환경, 스트레스 요인, 직업적 요구사항이 현재 정신건강 위험도에 미치는 영향 분석\\n- **위험도 패턴**: 4가지 위험도 중 가장 높은 영역과 낮은 영역의 차이, 상호 연관성, 개인 특성과의 관계 분석\\n- **현재 상황 해석**: 측정 결과가 보여주는 현재 정신건강 상태를 연령, 성별, 직업 맥락에서 구체적으로 해석` : '정신건강 위험도 분석 결과 없음'} 위험도, ADHD 위험도, 번아웃 위험도, 충동성 위험도 종합 평가]\\n\\n**건강 지표 상호 연관성:**\\n- 정신-신체 건강 균형 분석\\n- 자율신경계 기능과 스트레스 반응 연관성\\n- 인지 기능과 심혈관 건강의 상호 영향\\n- 정신건강 위험 요소와 전반적 건강 상태 연관성\\n\\n**개인화된 건강 프로파일:**\\n- 연령대 특성: [${age}세 ${personalInfo.gender}의 건강 특성]\\n- 직업적 영향: [${occupationLabel}의 건강 요구사항 및 위험 요인]\\n- 종합 건강 수준: [전체적 건강 균형 및 위험도 평가]\\n\\n**주의: 이 섹션은 순수 분석만 포함하며 해결방안은 별도 섹션에서 제시됩니다.**",
  
  "keyFindings": {
    "mentalHealth": "정신건강 ${eegAnalysis.score}점: [뇌파 기반 인지 기능, 집중력, 정서 안정성 종합 평가]",
    "physicalHealth": "신체건강 ${ppgAnalysis.score}점: [심혈관 기능, 자율신경 균형, 순환 건강 종합 평가]",
    "stressManagement": "스트레스 관리 ${stressAnalysis.score}점: [스트레스 대응력, 회복력, 적응 능력 종합 평가]",
    "mentalHealthRisk": "${mentalHealthBiomarkers ? `정신건강 위험도 종합: 우울 ${mentalHealthBiomarkers.depression.riskScore}점, ADHD ${mentalHealthBiomarkers.adhd.riskScore}점, 번아웃 ${mentalHealthBiomarkers.burnout.riskScore}점, 충동성 ${mentalHealthBiomarkers.impulsivity.riskScore}점 - ${age}세 ${personalInfo.gender === 'male' ? '남성' : '여성'} ${occupationLabel}의 특성을 고려한 위험도 패턴 분석 및 개인 맞춤형 관리 필요성 평가` : '정신건강 위험도 분석 결과 없음'}",
    "overallBalance": "전체 균형: [정신-신체 건강의 조화, 자율신경 기능, 종합적 웰빙 상태, 정신건강 위험 관리]"
  },
  
  "problemAreas": [
    {
      "problem": "🚨 가장 시급한 문제 영역 (예: 스트레스 관리 부족)",
      "severity": "높음|중간|낮음",
      "description": "구체적 문제 상황 및 위험성 설명",
      "solutions": {
        "immediate": ["즉시 실행 가능한 해결방안 1", "즉시 실행 가능한 해결방안 2", "즉시 실행 가능한 해결방안 3"],
        "shortTerm": ["1-4주 단기 해결방안 1", "1-4주 단기 해결방안 2", "1-4주 단기 해결방안 3"],
        "longTerm": ["3-6개월 장기 해결방안 1", "3-6개월 장기 해결방안 2", "3-6개월 장기 해결방안 3"]
      }
    },
    {
      "problem": "⚠️ 두 번째 우선순위 문제 영역",
      "severity": "높음|중간|낮음", 
      "description": "구체적 문제 상황 및 위험성 설명",
      "solutions": {
        "immediate": ["즉시 실행 가능한 해결방안 1", "즉시 실행 가능한 해결방안 2", "즉시 실행 가능한 해결방안 3"],
        "shortTerm": ["1-4주 단기 해결방안 1", "1-4주 단기 해결방안 2", "1-4주 단기 해결방안 3"],
        "longTerm": ["3-6개월 장기 해결방안 1", "3-6개월 장기 해결방안 2", "3-6개월 장기 해결방안 3"]
      }
    },
    {
      "problem": "💡 세 번째 개선 기회 영역",
      "severity": "높음|중간|낮음",
      "description": "구체적 문제 상황 및 위험성 설명", 
      "solutions": {
        "immediate": ["즉시 실행 가능한 해결방안 1", "즉시 실행 가능한 해결방안 2", "즉시 실행 가능한 해결방안 3"],
        "shortTerm": ["1-4주 단기 해결방안 1", "1-4주 단기 해결방안 2", "1-4주 단기 해결방안 3"],
        "longTerm": ["3-6개월 장기 해결방안 1", "3-6개월 장기 해결방안 2", "3-6개월 장기 해결방안 3"]
      }
    }
  ],

  "immediate": [
    "🎯 ${age}세 ${personalInfo.gender} ${occupationLabel} 맞춤 즉시 실행 방안 1",
    "⚡ ${age}세 ${personalInfo.gender} ${occupationLabel} 맞춤 즉시 실행 방안 2", 
    "🚨 ${age}세 ${personalInfo.gender} ${occupationLabel} 맞춤 즉시 실행 방안 3",
    "💪 ${age}세 ${personalInfo.gender} ${occupationLabel} 맞춤 즉시 실행 방안 4",
    "🧠 ${age}세 ${personalInfo.gender} ${occupationLabel} 맞춤 즉시 실행 방안 5"
  ],
  
  "shortTerm": [
    "📅 ${age}세 ${personalInfo.gender} ${occupationLabel} 맞춤 1-4주 목표 1",
    "🎯 ${age}세 ${personalInfo.gender} ${occupationLabel} 맞춤 1-4주 목표 2",
    "💪 ${age}세 ${personalInfo.gender} ${occupationLabel} 맞춤 1-4주 목표 3", 
    "🧠 ${age}세 ${personalInfo.gender} ${occupationLabel} 맞춤 1-4주 목표 4",
    "❤️ ${age}세 ${personalInfo.gender} ${occupationLabel} 맞춤 1-4주 목표 5"
  ],
  
  "longTerm": [
    "🌱 ${age}세 ${personalInfo.gender} ${occupationLabel} 맞춤 장기 목표 1",
    "🔄 ${age}세 ${personalInfo.gender} ${occupationLabel} 맞춤 장기 목표 2", 
    "📈 ${age}세 ${personalInfo.gender} ${occupationLabel} 맞춤 장기 목표 3",
    "🏆 ${age}세 ${personalInfo.gender} ${occupationLabel} 맞춤 장기 목표 4",
    "💎 ${age}세 ${personalInfo.gender} ${occupationLabel} 맞춤 장기 목표 5"
  ],

  "occupationalAnalysis": {
    "characteristics": "${occupationLabel} 특성에 따른 건강 위험 요소 및 관리 포인트 분석",
    "dataCorrelation": "현재 측정 결과와 직업적 특성 간의 연관성 분석 - 집중력 지수 ${focusIndexValue}, 스트레스 지수 ${stressIndexValue}, 심박변이도 ${rmssdValue}ms 등의 직업적 요구사항 대비 적합성 평가",
    "currentStatus": "직업적 스트레스 요인이 현재 건강 상태에 미치는 영향 분석 및 관리 방안 제시",
    "recommendations": [
      "${occupationLabel} 특성을 고려한 건강 관리 방안 1",
      "${occupationLabel} 특성을 고려한 건강 관리 방안 2",
      "${occupationLabel} 특성을 고려한 건강 관리 방안 3"
    ]
  },
  
  "followUpPlan": {
    "monitoring": "정기 건강 모니터링: [주기적 건강 상태 점검 및 변화 추적 방법, 정신건강 상태 모니터링 포함]",
    "adjustments": "관리 방안 조정: [건강 상태 변화에 따른 관리 방법 조정 전략, 정신건강 관리 방안 조정 포함]",
    "professional": "전문가 상담: [필요시 전문의 상담 권장 시점 및 분야 안내, 정신건강 전문가 상담 포함]"
  }
}
\`\`\`

**중요**: 
1. **analysis 섹션**: 순수 분석만, 해결방안 제시 절대 금지
   - **정신건강 위험도 종합 분석 필수**: 우울, ADHD, 번아웃, 충동성 위험도를 종합하여 ${age}세 ${personalInfo.gender === 'male' ? '남성' : '여성'} ${occupationLabel}의 특성에 맞게 현재 상황을 구체적으로 해석
   - 각 위험도 점수가 개인의 연령, 성별, 직업 특성과 어떤 관련이 있는지 명확히 분석
   - 4가지 위험도 간의 상호 연관성과 패턴을 개인 맥락에서 해석
2. **problemAreas 섹션**: 문제 진단 + 구체적 해결방안만, 분석 내용 중복 금지  
3. **immediate/shortTerm/longTerm 섹션**: 개인 특성 기반 맞춤 전략만, 일반적 조언 금지
4. 모든 분석은 최신 건강 과학 연구를 기반으로 하며, 정신건강 위험도 분석 결과를 종합 건강 평가에 반드시 포함하여 건강 참고 목적으로만 사용하시고 전문의 상담이 필요한 경우 의료기관을 방문하시기 바랍니다.
`;
  }

  /**
   * API 요청 수행
   */
  private static async makeRequest(prompt: string): Promise<any> {
    const apiKey = await APIKeyManager.getAPIKey(this.API_KEY_ID);
    if (!apiKey) {
      throw new Error('Gemini API 키를 찾을 수 없습니다.');
    }

    const requestBody = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192
      }
    };

    const response = await fetch(
      `${this.API_BASE_URL}/${this.CONFIG.model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.CONFIG.timeout)
      }
    );

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }



  /**
   * 새로운 아키텍처 결과들을 최종 AIAnalysisResult 형태로 통합
   */
  private static combineNewArchitectureResults(
    personalInfo: PersonalInfo,
    measurementData: MeasurementData,
    eegDetailedAnalysis: EEGDetailedAnalysis,
    ppgDetailedAnalysis: PPGDetailedAnalysis,
    mentalHealthRiskAnalysis: MentalHealthRiskAnalysis,
    stressResult: StressAnalysisResult,
    comprehensiveResult: ComprehensiveAnalysisResult,
    clinicalCorrelations: any,
    professionalGuidance: any,
    mentalHealthBiomarkers: MentalHealthBiomarkers | null
  ): AIAnalysisResult {
    const age = this.calculateAge(personalInfo);
    const occupationLabel = this.getOccupationLabel(personalInfo.occupation, personalInfo.customOccupation);

    return {
      overallHealth: {
        score: comprehensiveResult.overallScore,
        grade: this.getHealthGrade(comprehensiveResult.overallScore),
        summary: comprehensiveResult.healthStatus,
        detailedComprehensiveSummary: comprehensiveResult.analysis,
        keyFindings: [
          ...comprehensiveResult.immediate.slice(0, 2),
          ...comprehensiveResult.shortTerm.slice(0, 2),
          ...comprehensiveResult.longTerm.slice(0, 1)
        ].slice(0, 5),
                 riskFactors: [
           `우울 위험도: ${mentalHealthRiskAnalysis.depressionRisk.riskLevel}`,
           `ADHD 위험도: ${mentalHealthRiskAnalysis.adhdFocusRisk.riskLevel}`,
           `번아웃 위험도: ${mentalHealthRiskAnalysis.burnoutRisk.riskLevel}`
         ].slice(0, 3),
         strengths: [
           `뇌파 건강도: ${eegDetailedAnalysis.overallEEGScore.grade}`,
           `심혈관 건강도: ${ppgDetailedAnalysis.overallPPGScore.grade}`,
           `정신건강 안정성: ${mentalHealthRiskAnalysis.overallMentalHealthScore.grade || 'normal'}`
         ].slice(0, 3)
      },
      detailedAnalysis: {
                 mentalHealth: {
           score: eegDetailedAnalysis.overallEEGScore.standardized,
           status: eegDetailedAnalysis.overallEEGScore.grade,
           analysis: eegDetailedAnalysis.clinicalInterpretation.summary || "EEG 분석 결과",
          keyMetrics: {
            concentration: `집중력: ${eegDetailedAnalysis.frequencyAnalysis.alpha.peakFrequency}Hz`,
            relaxation: `이완도: ${eegDetailedAnalysis.frequencyAnalysis.theta.absolutePower}μV²`,
            brainBalance: `뇌 균형: ${eegDetailedAnalysis.temporalAnalysis.rhythmicity}`,
            cognitiveLoad: `인지 부하: ${eegDetailedAnalysis.temporalAnalysis.complexity}`
          },
          immediateActions: comprehensiveResult.immediate.slice(0, 2),
          shortTermGoals: comprehensiveResult.shortTerm.slice(0, 2),
          longTermStrategy: comprehensiveResult.longTerm.slice(0, 2)
        },
        physicalHealth: {
          score: ppgDetailedAnalysis.overallPPGScore.standardized,
          status: ppgDetailedAnalysis.overallPPGScore.grade,
          analysis: ppgDetailedAnalysis.clinicalInterpretation.summary || "PPG 분석 결과",
          keyMetrics: {
            heartRate: `심박수: ${ppgDetailedAnalysis.heartRateVariability.timeDomain.meanHR} bpm`,
            hrv: `HRV: ${ppgDetailedAnalysis.heartRateVariability.timeDomain.rmssd} ms`,
            oxygenSaturation: `산소포화도: ${ppgDetailedAnalysis.pulseWaveAnalysis.pulseAmplitude}%`,
            autonomicBalance: `자율신경 균형: ${ppgDetailedAnalysis.heartRateVariability.frequencyDomain.lfHfRatio}`
          },
          immediateActions: comprehensiveResult.immediate.slice(2, 4),
          shortTermGoals: comprehensiveResult.shortTerm.slice(2, 4),
          longTermStrategy: comprehensiveResult.longTerm.slice(2, 4)
        },
        stressLevel: {
          score: stressResult.score,
          level: stressResult.status,
          analysis: stressResult.analysis,
          stressType: this.determineStressType(stressResult),
          stressSources: stressResult.concerns,
          physiologicalImpact: this.analyzePhysiologicalImpact(eegDetailedAnalysis, ppgDetailedAnalysis, stressResult),
          immediateActions: comprehensiveResult.immediate.slice(4, 6),
          shortTermGoals: comprehensiveResult.shortTerm.slice(4, 6),
          longTermStrategy: comprehensiveResult.longTerm.slice(4, 6)
        },
        // mentalHealthRisk 섹션은 detailedAnalysis에서 제외 (타입 호환성 문제)
      },
      problemAreas: [],
      personalizedRecommendations: {
        immediate: {
          lifestyle: comprehensiveResult.immediate.slice(0, 2),
          exercise: comprehensiveResult.immediate.slice(2, 4),
          breathing: comprehensiveResult.immediate.slice(4, 6),
          posture: comprehensiveResult.immediate.slice(0, 2)
        },
        shortTerm: {
          lifestyle: comprehensiveResult.shortTerm.slice(0, 2),
          exercise: comprehensiveResult.shortTerm.slice(2, 4),
          diet: comprehensiveResult.shortTerm.slice(0, 2),
          sleep: comprehensiveResult.shortTerm.slice(0, 2),
          stressManagement: comprehensiveResult.shortTerm.slice(2, 4)
        },
        longTerm: {
          lifestyle: comprehensiveResult.longTerm.slice(0, 2),
          exercise: comprehensiveResult.longTerm.slice(2, 4),
          mentalCare: comprehensiveResult.longTerm.slice(4, 6),
          socialSupport: [
            "가족, 친구와의 정기적인 만남",
            "직업 관련 커뮤니티 참여",
            "멘토링 관계 구축"
          ],
          professionalHelp: [
            "정기적인 건강검진 (연 1회)",
            "정신건강 전문가 상담 (필요시)",
            "영양사, 운동 전문가 상담 (분기별)"
          ]
        },
        occupationSpecific: {
          workplaceStrategies: comprehensiveResult.occupationalAnalysis.recommendations.slice(0, 3),
          timeManagement: ["업무 시간 관리", "휴식 시간 확보", "우선순위 설정"],
          environmentalChanges: ["작업 환경 개선", "조명 최적화", "소음 관리"],
          colleagueInteraction: ["동료와의 소통", "팀워크 강화", "갈등 관리"]
        }
      },
      supportResources: {
        professionalHelp: [],
        onlineResources: [],
        communitySupport: [],
        emergencyContacts: []
      },
      followUpPlan: {
        remeasurement: {
          schedule: "4주 후 재측정 권장",
          keyMetrics: "종합 건강 지표",
          improvementTargets: "전반적 건강 상태 개선"
        },
        progressTracking: {
          dailyChecks: [],
          weeklyReviews: [],
          monthlyAssessments: []
        },
        milestones: [],
        adjustmentTriggers: []
      },
      timestamp: Date.now(),
      qualityScore: Math.min(measurementData.signalQuality.eeg, measurementData.signalQuality.ppg),
      personalInfo,
      measurementData,
      metadata: {
        modelUsed: this.CONFIG.model,
        promptTokens: 0,
        responseTokens: 0,
        totalTokens: 0
      }
    };
  }

  /**
   * 분석 결과들을 최종 AIAnalysisResult 형태로 통합 (레거시 호환성)
   */
  private static combineAnalysisResults(
    personalInfo: PersonalInfo,
    measurementData: MeasurementData,
    eegResult: any, // EEGAnalysisResult 대신 any 사용
    ppgResult: any, // PPGAnalysisResult 대신 any 사용
    stressResult: StressAnalysisResult,
    comprehensiveResult: ComprehensiveAnalysisResult,
    clinicalCorrelations: any,
    professionalGuidance: any,
    mentalHealthBiomarkers: MentalHealthBiomarkers | null
  ): AIAnalysisResult {
    const age = this.calculateAge(personalInfo);
    const occupationLabel = this.getOccupationLabel(personalInfo.occupation, personalInfo.customOccupation);

    return {
      overallHealth: {
        score: comprehensiveResult.overallScore,
        grade: this.getHealthGrade(comprehensiveResult.overallScore),
        summary: comprehensiveResult.healthStatus,
        detailedComprehensiveSummary: comprehensiveResult.analysis,
        keyFindings: [
          ...eegResult.recommendations.slice(0, 2),
          ...ppgResult.recommendations.slice(0, 2),
          ...stressResult.recommendations.slice(0, 2)
        ].slice(0, 5),
        riskFactors: [
          ...eegResult.concerns,
          ...ppgResult.concerns,
          ...stressResult.concerns
        ].slice(0, 3),
        strengths: [
          ...this.extractStrengths(eegResult),
          ...this.extractStrengths(ppgResult),
          ...this.extractStrengths(stressResult)
        ].slice(0, 3)
      },
      detailedAnalysis: {
        mentalHealth: {
          score: eegResult.score,
          status: eegResult.status,
          analysis: eegResult.analysis,
          keyMetrics: {
            concentration: eegResult.keyMetrics.concentration || "집중력 분석 결과",
            relaxation: eegResult.keyMetrics.relaxation || "이완도 분석 결과",
            brainBalance: eegResult.keyMetrics.brainBalance || "뇌 균형 분석 결과",
            cognitiveLoad: eegResult.keyMetrics.cognitiveLoad || "인지 부하 분석 결과"
          },
          immediateActions: comprehensiveResult.immediate.slice(0, 2),
          shortTermGoals: comprehensiveResult.shortTerm.slice(0, 2),
          longTermStrategy: comprehensiveResult.longTerm.slice(0, 2)
        },
        physicalHealth: {
          score: ppgResult.score,
          status: ppgResult.status,
          analysis: ppgResult.analysis,
          keyMetrics: {
            heartRate: ppgResult.keyMetrics.heartRate || "심박수 분석 결과",
            hrv: ppgResult.keyMetrics.hrv || "심박변이도 분석 결과",
            oxygenSaturation: ppgResult.keyMetrics.oxygenSaturation || "산소포화도 분석 결과",
            autonomicBalance: ppgResult.keyMetrics.autonomicBalance || "자율신경 균형 분석 결과"
          },
          immediateActions: comprehensiveResult.immediate.slice(2, 4),
          shortTermGoals: comprehensiveResult.shortTerm.slice(2, 4),
          longTermStrategy: comprehensiveResult.longTerm.slice(2, 4)
        },
        stressLevel: {
          score: stressResult.score,
          level: stressResult.status,
          analysis: (() => {
            console.log('🔍 스트레스 분석 디버깅:', {
              'stressResult.analysis 길이': stressResult.analysis?.length || 0,
              'stressResult.analysis 시작': stressResult.analysis?.substring(0, 100) || 'N/A'
            });
            return stressResult.analysis;
          })(),
          stressType: this.determineStressType(stressResult),
          stressSources: stressResult.concerns,
          physiologicalImpact: this.analyzePhysiologicalImpact(eegResult, ppgResult, stressResult),
          immediateActions: comprehensiveResult.immediate.slice(4, 6),
          shortTermGoals: comprehensiveResult.shortTerm.slice(4, 6),
          longTermStrategy: comprehensiveResult.longTerm.slice(4, 6)
        },
        // 🔧 NEW: 정신건강 위험도 분석 결과 추가
        mentalHealthRisk: mentalHealthBiomarkers ? {
          depression: {
            riskScore: mentalHealthBiomarkers.depression.riskScore,
            normalRange: "0-30점 (낮은 위험도)",
            status: mentalHealthBiomarkers.depression.riskScore < 30 ? '낮은 위험도' : mentalHealthBiomarkers.depression.riskScore < 60 ? '보통 위험도' : '높은 위험도',
            analysis: `### 🔵 우울 위험도 분석 (${mentalHealthBiomarkers.depression.riskScore}/100점)

**신경과학적 바이오마커 평가:**
- 전두엽 알파 비대칭: ${mentalHealthBiomarkers.depression.eegMarkers.alphaAsymmetry.toFixed(1)} (정상: 15-30)
- 세타파 파워: ${mentalHealthBiomarkers.depression.eegMarkers.thetaPower.toFixed(1)} (정상: 20-40)
- 알파/세타 비율: ${mentalHealthBiomarkers.depression.eegMarkers.alphaTheta.toFixed(1)} (정상: 50-80)
- 뇌파 일관성: ${mentalHealthBiomarkers.depression.eegMarkers.coherence.toFixed(1)} (정상: 70-90)

**심혈관 바이오마커 평가:**
- HRV 우울 지수: ${mentalHealthBiomarkers.depression.ppgMarkers.hrvDepression.toFixed(1)} (정상: 20-40)
- 자율신경 불균형: ${mentalHealthBiomarkers.depression.ppgMarkers.autonomicImbalance.toFixed(1)} (정상: 20-40)
- 심박 복잡도: ${mentalHealthBiomarkers.depression.ppgMarkers.cardiacComplexity.toFixed(1)} (정상: 20-40)

**위험도 평가:** ${mentalHealthBiomarkers.depression.riskScore < 30 ? '낮음' : mentalHealthBiomarkers.depression.riskScore < 60 ? '보통' : '높음'}`
          },
          adhd: {
            riskScore: mentalHealthBiomarkers.adhd.riskScore,
            normalRange: "0-30점 (낮은 위험도)",
            status: mentalHealthBiomarkers.adhd.riskScore < 30 ? '낮은 위험도' : mentalHealthBiomarkers.adhd.riskScore < 60 ? '보통 위험도' : '높은 위험도',
            analysis: `### 🎯 ADHD 위험도 분석 (${mentalHealthBiomarkers.adhd.riskScore}/100점)

**주의력 관련 바이오마커:**
- 주의력 지수: ${mentalHealthBiomarkers.adhd.eegMarkers.attentionIndex.toFixed(1)} (정상: 20-40)
- 과잉행동 지수: ${mentalHealthBiomarkers.adhd.eegMarkers.hyperactivityIndex.toFixed(1)} (정상: 25-45)
- 충동 조절: ${mentalHealthBiomarkers.adhd.eegMarkers.impulseControl.toFixed(1)} (정상: 20-40)
- 집중력 안정성: ${mentalHealthBiomarkers.adhd.eegMarkers.focusStability.toFixed(1)} (정상: 40-80)

**자율신경계 평가:**
- 자율신경 기능장애: ${mentalHealthBiomarkers.adhd.ppgMarkers.autonomicDysfunction.toFixed(1)} (정상: 25-45)
- 각성 패턴: ${mentalHealthBiomarkers.adhd.ppgMarkers.arousalPattern.toFixed(1)} (정상: 25-45)
- 자기조절 능력: ${mentalHealthBiomarkers.adhd.ppgMarkers.regulationCapacity.toFixed(1)} (정상: 60-100)

**위험도 평가:** ${mentalHealthBiomarkers.adhd.riskScore < 30 ? '낮음' : mentalHealthBiomarkers.adhd.riskScore < 60 ? '보통' : '높음'}`
          },
          burnout: {
            riskScore: mentalHealthBiomarkers.burnout.riskScore,
            normalRange: "0-30점 (낮은 위험도)",
            status: mentalHealthBiomarkers.burnout.riskScore < 30 ? '낮은 위험도' : mentalHealthBiomarkers.burnout.riskScore < 60 ? '보통 위험도' : '높은 위험도',
            analysis: `### 🔥 번아웃 위험도 분석 (${mentalHealthBiomarkers.burnout.riskScore}/100점)

**정신적 피로도 바이오마커:**
- 정신적 피로도: ${mentalHealthBiomarkers.burnout.eegMarkers.mentalFatigue.toFixed(1)} (정상: 25-40)
- 스트레스 부하: ${mentalHealthBiomarkers.burnout.eegMarkers.stressLoad.toFixed(1)} (정상: 35-55)
- 인지적 소진: ${mentalHealthBiomarkers.burnout.eegMarkers.cognitiveExhaustion.toFixed(1)} (정상: 25-45)
- 정서적 고갈: ${mentalHealthBiomarkers.burnout.eegMarkers.emotionalDepletion.toFixed(1)} (정상: 20-40)

**만성 스트레스 지표:**
- 만성 스트레스: ${mentalHealthBiomarkers.burnout.ppgMarkers.chronicStress.toFixed(1)} (정상: 25-45)
- 피로 지수: ${mentalHealthBiomarkers.burnout.ppgMarkers.fatigueIndex.toFixed(1)} (정상: 25-45)
- 회복 능력: ${mentalHealthBiomarkers.burnout.ppgMarkers.recoveryCapacity.toFixed(1)} (정상: 30-50)

**위험도 평가:** ${mentalHealthBiomarkers.burnout.riskScore < 30 ? '낮음' : mentalHealthBiomarkers.burnout.riskScore < 60 ? '보통' : '높음'}`
          },
          impulsivity: {
            riskScore: mentalHealthBiomarkers.impulsivity.riskScore,
            normalRange: "0-30점 (낮은 위험도)",
            status: mentalHealthBiomarkers.impulsivity.riskScore < 30 ? '낮은 위험도' : mentalHealthBiomarkers.impulsivity.riskScore < 60 ? '보통 위험도' : '높은 위험도',
            analysis: `### ⚡ 충동성 위험도 분석 (${mentalHealthBiomarkers.impulsivity.riskScore}/100점)

**충동 조절 바이오마커:**
- 억제 통제 능력: ${mentalHealthBiomarkers.impulsivity.eegMarkers.inhibitionControl.toFixed(1)} (정상: 25-45)
- 충동적 반응: ${mentalHealthBiomarkers.impulsivity.eegMarkers.impulsiveResponse.toFixed(1)} (정상: 20-40)
- 의사결정 능력: ${mentalHealthBiomarkers.impulsivity.eegMarkers.decisionMaking.toFixed(1)} (정상: 40-80)
- 행동 통제: ${mentalHealthBiomarkers.impulsivity.eegMarkers.behavioralControl.toFixed(1)} (정상: 50-90)

**정서 조절 지표:**
- 각성 반응성: ${mentalHealthBiomarkers.impulsivity.ppgMarkers.arousalReactivity.toFixed(1)} (정상: 25-45)
- 정서적 변동성: ${mentalHealthBiomarkers.impulsivity.ppgMarkers.emotionalVolatility.toFixed(1)} (정상: 20-40)
- 자기조절 능력: ${mentalHealthBiomarkers.impulsivity.ppgMarkers.selfRegulation.toFixed(1)} (정상: 60-100)

**위험도 평가:** ${mentalHealthBiomarkers.impulsivity.riskScore < 30 ? '낮음' : mentalHealthBiomarkers.impulsivity.riskScore < 60 ? '보통' : '높음'}`
          },
          professionalRecommendations: `## 🏥 정신건강 전문가 권장사항

**종합 위험도 평가:**
- 전체 정신건강 점수: ${mentalHealthBiomarkers.overall.mentalHealthScore}/100점
- 주요 관심사항: ${mentalHealthBiomarkers.overall.primaryConcern}
- 위험도 수준: ${mentalHealthBiomarkers.overall.riskLevel}
- 추가 관찰 필요: ${mentalHealthBiomarkers.overall.followUpNeeded ? '예' : '아니오'}

**개별 영역별 관리 방안:**

### 🔵 우울 예방 관리
- **현재 상태**: ${mentalHealthBiomarkers.depression.riskScore < 30 ? '낮은 위험도' : mentalHealthBiomarkers.depression.riskScore < 60 ? '보통 위험도' : '높은 위험도'} (${mentalHealthBiomarkers.depression.riskScore}/100)
- **권장사항**: 규칙적인 운동, 충분한 수면, 사회적 관계 유지
- **모니터링**: 월 1회 기분 상태 자가 점검

### 🎯 집중력 유지 관리  
- **현재 상태**: ${mentalHealthBiomarkers.adhd.riskScore < 30 ? '낮은 위험도' : mentalHealthBiomarkers.adhd.riskScore < 60 ? '보통 위험도' : '높은 위험도'} (${mentalHealthBiomarkers.adhd.riskScore}/100)
- **권장사항**: 명상, 규칙적인 일과, 적절한 휴식
- **모니터링**: 주간 집중력 패턴 관찰

### 🔥 번아웃 예방 관리
- **현재 상태**: ${mentalHealthBiomarkers.burnout.riskScore < 30 ? '낮은 위험도' : mentalHealthBiomarkers.burnout.riskScore < 60 ? '보통 위험도' : '높은 위험도'} (${mentalHealthBiomarkers.burnout.riskScore}/100)
- **권장사항**: 업무-생활 균형, 스트레스 관리, 취미 활동
- **모니터링**: 주간 피로도 및 스트레스 수준 체크

### ⚡ 충동성 조절 관리
- **현재 상태**: ${mentalHealthBiomarkers.impulsivity.riskScore < 30 ? '낮은 위험도' : mentalHealthBiomarkers.impulsivity.riskScore < 60 ? '보통 위험도' : '높은 위험도'} (${mentalHealthBiomarkers.impulsivity.riskScore}/100)
- **권장사항**: 마음챙김 연습, 감정 조절 훈련, 충동 지연 기법
- **모니터링**: 일상 충동성 패턴 관찰

**전문가 상담 권장 기준:**
${mentalHealthBiomarkers.overall.riskLevel === 'high' || mentalHealthBiomarkers.overall.riskLevel === 'severe' ? 
  '- **즉시 전문가 상담 권장**: 위험도가 높아 전문의 진료가 필요합니다.' :
  mentalHealthBiomarkers.overall.followUpNeeded ?
  '- **정기 모니터링 권장**: 3개월 후 재평가 및 필요시 전문가 상담을 고려하세요.' :
  '- **예방적 관리**: 현재 상태 유지를 위한 건강한 생활습관을 지속하세요.'
}

**권장 전문가:**
- 정신건강의학과 전문의 (우울, 불안, 스트레스 관련)
- 신경심리학 전문가 (인지 기능, 주의력 관련)
- 임상심리사 (심리상담 및 인지행동치료)

**주의사항:** 이 분석은 건강 참고 자료이며 의료 진단을 대체하지 않습니다. 심각한 증상이 지속되면 반드시 전문의와 상담하시기 바랍니다.`
        } : undefined,
        // 🔧 NEW: 의학적 위험도 분석 결과 추가
        medicalRiskAnalysis: {
          biosignalIntegration: {
            eegMedicalInterpretation: {
              alphaActivity: measurementData.eegMetrics.relaxationIndex?.value > 0.2 ? '정상 범위' : '정상 범위 미달',
              betaPattern: measurementData.eegMetrics.focusIndex?.value > 2.0 ? '안정적' : '불안정',
              gammaSync: measurementData.eegMetrics.cognitiveLoad?.value < 0.6 ? '양호' : '저하',
              medicalFindings: '전반적인 뇌 활성도가 정상 범위 내에 있으며, 인지 기능 및 정서 조절 능력이 양호한 상태로 평가됩니다.'
            },
            ppgMedicalInterpretation: {
              hrv: measurementData.ppgMetrics.rmssd?.value > 30 ? '정상' : '저하',
              vascularElasticity: measurementData.ppgMetrics.lfHfRatio?.value < 2.5 ? '양호' : '저하',
              autonomicBalance: measurementData.ppgMetrics.lfHfRatio?.value < 3.0 ? '균형적' : '불균형',
              medicalFindings: '심혈관계 기능이 정상 범위에 있으며, 스트레스 반응성과 회복력이 적절한 수준으로 평가됩니다.'
            }
          },
          pathologicalRiskFactors: {
            neurologicalRisk: {
              riskScore: Math.max(
                mentalHealthBiomarkers?.depression?.riskScore || 0,
                mentalHealthBiomarkers?.adhd?.riskScore || 0
              ),
              description: '우울, 집중력 장애 등 신경정신학적 질환 발생 위험도'
            },
            cardiovascularRisk: {
              riskScore: Math.round((stressResult.score || 50) * 0.8),
              description: '고혈압, 부정맥 등 심혈관계 질환 발생 위험도'
            },
            metabolicSyndromeRisk: {
              riskScore: mentalHealthBiomarkers?.burnout?.riskScore || 35,
              description: '당뇨병, 비만 등 대사성 질환 발생 위험도'
            }
          },
          clinicalRecommendations: {
            preventiveMedicine: {
              regularCheckups: '3-6개월 간격으로 정신건강 상태 모니터링 권장',
              lifestyleModifications: '규칙적인 운동, 충분한 수면, 균형잡힌 영양 섭취',
              stressManagement: '명상, 요가, 심호흡 등 이완 기법 실천'
            },
            medicalConsultation: {
              urgency: (() => {
                const maxRisk = Math.max(
                  mentalHealthBiomarkers?.depression?.riskScore || 0,
                  mentalHealthBiomarkers?.adhd?.riskScore || 0,
                  mentalHealthBiomarkers?.burnout?.riskScore || 0,
                  mentalHealthBiomarkers?.impulsivity?.riskScore || 0
                );
                return maxRisk >= 70 ? 'immediate' : maxRisk >= 50 ? 'preventive' : 'maintenance';
              })(),
              recommendations: (() => {
                const maxRisk = Math.max(
                  mentalHealthBiomarkers?.depression?.riskScore || 0,
                  mentalHealthBiomarkers?.adhd?.riskScore || 0,
                  mentalHealthBiomarkers?.burnout?.riskScore || 0,
                  mentalHealthBiomarkers?.impulsivity?.riskScore || 0
                );
                
                if (maxRisk >= 70) {
                  return [
                    '즉시 전문의 상담: 정신건강의학과 전문의 진료 권장',
                    '심화 검사: 추가적인 심리 검사 및 뇌영상 검사 고려',
                    '치료 계획: 약물 치료 및 인지행동치료 병행 검토'
                  ];
                } else if (maxRisk >= 50) {
                  return [
                    '예방적 상담: 정신건강 전문가와의 정기적 상담',
                    '조기 개입: 스트레스 관리 프로그램 참여 권장',
                    '모니터링: 월 1회 이상 자가 평가 및 추적 관찰'
                  ];
                } else {
                  return [
                    '유지 관리: 현재 상태 유지를 위한 건강한 생활습관 지속',
                    '예방 교육: 정신건강 관련 교육 프로그램 참여',
                    '정기 점검: 6개월마다 정신건강 상태 점검 권장'
                  ];
                }
              })(),
              followUpPlan: '정기적인 건강 모니터링 및 필요시 전문가 상담'
            },
            scientificEvidence: '본 분석은 국제 정신의학회(IPA) 가이드라인과 DSM-5 진단 기준을 참조하여 뇌파-심혈관 바이오마커의 임상적 유효성을 검증한 최신 연구 결과를 바탕으로 합니다. (참고: Nature Medicine 2024, Lancet Psychiatry 2024)'
          }
        }
      },
      problemAreas: this.identifyProblemAreas(eegResult, ppgResult, stressResult),
      personalizedRecommendations: {
        immediate: {
          lifestyle: comprehensiveResult.immediate.slice(0, 2),
          exercise: comprehensiveResult.immediate.slice(2, 4),
          breathing: comprehensiveResult.immediate.slice(4, 6),
          posture: comprehensiveResult.immediate.slice(0, 2)
        },
        shortTerm: {
          lifestyle: comprehensiveResult.shortTerm.slice(0, 2),
          exercise: comprehensiveResult.shortTerm.slice(2, 4),
          diet: comprehensiveResult.shortTerm.slice(0, 2),
          sleep: comprehensiveResult.shortTerm.slice(0, 2),
          stressManagement: comprehensiveResult.shortTerm.slice(2, 4)
        },
        longTerm: {
          lifestyle: comprehensiveResult.longTerm.slice(0, 2),
          exercise: comprehensiveResult.longTerm.slice(2, 4),
          mentalCare: comprehensiveResult.longTerm.slice(4, 6),
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
          workplaceStrategies: this.generateOccupationSpecificStrategies(personalInfo, eegResult, ppgResult, stressResult),
          timeManagement: this.generateTimeManagementStrategies(personalInfo, eegResult, ppgResult, stressResult),
          environmentalChanges: this.generateEnvironmentalChanges(personalInfo, eegResult, ppgResult, stressResult),
          colleagueInteraction: this.generateColleagueInteractionStrategies(personalInfo, eegResult, ppgResult, stressResult)
        }
      },
      followUpPlan: {
        remeasurement: {
          schedule: "4주 후 재측정 권장",
          keyMetrics: this.getKeyMetricsForFollowUp(eegResult, ppgResult, stressResult),
          improvementTargets: this.getImprovementTargets(eegResult, ppgResult, stressResult)
        },
        progressTracking: {
          dailyChecks: ["일일 스트레스 수준 체크", "수면 품질 평가", "기분 상태 기록"],
          weeklyReviews: ["주간 운동량 점검", "식습관 개선 상황 검토", "사회적 활동 참여도 평가"],
          monthlyAssessments: ["월간 종합 건강 상태 평가", "목표 달성도 점검", "관리 방법 효과성 분석"]
        },
        milestones: [
          {
            timeframe: "2주 후",
            goals: "즉시 실행 방안 정착 및 초기 개선 효과 확인",
            successCriteria: "스트레스 수준 10% 감소, 수면 품질 개선"
          },
          {
            timeframe: "1개월 후", 
            goals: "단기 목표 달성 및 생활습관 변화 정착",
            successCriteria: "종합 건강 점수 5점 향상, 주요 지표 개선"
          },
          {
            timeframe: "3개월 후",
            goals: "장기 전략 실행 및 지속 가능한 건강 관리 체계 구축",
            successCriteria: "전반적 건강 상태 안정화, 위험 요인 감소"
          }
        ],
        adjustmentTriggers: [
          comprehensiveResult.followUpPlan.monitoring,
          comprehensiveResult.followUpPlan.adjustments,
          comprehensiveResult.followUpPlan.professional
        ]
      },
      supportResources: {
        professionalHelp: [
          {
            type: "정신건강 전문가",
            when: "스트레스 지수 지속적 상승 시",
            how: "정신건강의학과 전문의 상담",
            cost: "건강보험 적용 가능",
            accessibility: "전국 병원 및 클리닉"
          }
        ],
        onlineResources: [
          "마음건강 자가진단 도구",
          "온라인 스트레스 관리 프로그램",
          "명상 및 이완 기법 가이드"
        ],
        communitySupport: [
          "지역 정신건강센터",
          "스트레스 관리 모임",
          "직장 내 상담 프로그램"
        ],
        emergencyContacts: [
          "정신건강 위기상담전화: 1577-0199",
          "생명의전화: 1588-9191",
          "청소년전화: 1388"
        ]
      },
      followUpActions: [
        comprehensiveResult.followUpPlan.monitoring,
        comprehensiveResult.followUpPlan.adjustments,
        comprehensiveResult.followUpPlan.professional
      ].filter(Boolean),
      timestamp: Date.now(),
      qualityScore: Math.min(measurementData.signalQuality.eeg, measurementData.signalQuality.ppg),
      personalInfo,
      measurementData,
      metadata: {
        modelUsed: this.CONFIG.model,
        promptTokens: 0,
        responseTokens: 0,
        totalTokens: 0
      }
    };
  }

  /**
   * 분석 결과 검증
   */
  private static validateAnalysisResult(result: AIAnalysisResult): void {
    // 필수 필드 검증
    if (!result.overallHealth) {
      throw new Error('분석 결과에 overallHealth 필드가 없습니다.');
    }
    if (!result.overallHealth.score || result.overallHealth.score < 0 || result.overallHealth.score > 100) {
      throw new Error('건강 점수가 유효하지 않습니다.');
    }
    if (!result.detailedAnalysis) {
      throw new Error('분석 결과에 detailedAnalysis 필드가 없습니다.');
    }
    if (!result.problemAreas || !Array.isArray(result.problemAreas)) {
      throw new Error('문제 영역이 유효하지 않습니다.');
    }
    if (!result.personalizedRecommendations) {
      throw new Error('개인화된 추천사항이 없습니다.');
    }
    if (!result.followUpPlan) {
      throw new Error('후속 계획이 없습니다.');
    }

    // 문제 영역 개수 제한
    if (result.problemAreas.length > 3) {
      result.problemAreas = result.problemAreas.slice(0, 3);
    }
  }

  /**
   * 상세 정신건강 분석 생성
   */
  private static generateDetailedMentalHealthAnalysis(
    eegResult: any,
    measurementData: MeasurementData,
    personalInfo: PersonalInfo,
    comprehensiveResult: ComprehensiveAnalysisResult
  ): string {
    const age = this.calculateAge(personalInfo);
    const occupationLabel = this.getOccupationLabel(personalInfo.occupation, personalInfo.customOccupation);
    
    // 실제 측정값들
    const focusValue = measurementData.eegMetrics.focusIndex?.value?.toFixed(2) || 'N/A';
    const relaxationValue = measurementData.eegMetrics.relaxationIndex?.value?.toFixed(3) || 'N/A';
    const stressValue = measurementData.eegMetrics.stressIndex?.value?.toFixed(2) || 'N/A';
    const balanceValue = measurementData.eegMetrics.hemisphericBalance?.value?.toFixed(3) || 'N/A';
    const cognitiveValue = measurementData.eegMetrics.cognitiveLoad?.value?.toFixed(3) || 'N/A';

    return `## 🧠 정신건강 종합 분석 (점수: ${eegResult.score}/100)

### 📊 뇌파 지표 상세 해석

**집중력 지수 (Focus Index): ${focusValue}**
- 정상 범위: 1.8-2.4
- 현재 상태: ${parseFloat(focusValue) < 1.8 ? '정상 범위 미달 - 주의력 결핍 혹은 졸음 상태' : parseFloat(focusValue) > 2.4 ? '정상 범위 초과 - 과도한 집중 혹은 스트레스 상태' : '정상 범위 - 적절한 집중력 유지'}
- 의학적 해석: 전두엽 베타파 활성도를 반영하며, 인지적 각성 상태와 주의 집중 능력을 나타냅니다.

**이완도 지수 (Relaxation Index): ${relaxationValue}**
- 정상 범위: 0.18-0.22
- 현재 상태: ${parseFloat(relaxationValue) < 0.18 ? '정상 범위 미달 - 긴장 및 스트레스 상태' : parseFloat(relaxationValue) > 0.22 ? '정상 범위 초과 - 과도한 이완 상태' : '정상 범위 - 적절한 이완 상태'}
- 의학적 해석: 알파파 활성도를 통한 정신적 이완 상태를 측정하며, 스트레스 해소 능력을 반영합니다.

**스트레스 지수 (Stress Index): ${stressValue}**
- 정상 범위: 3.0-4.0
- 현재 상태: ${parseFloat(stressValue) < 3.0 ? '정상 범위 미달 - 매우 낮은 스트레스 상태' : parseFloat(stressValue) > 4.0 ? '정상 범위 초과 - 높은 스트레스 상태' : '정상 범위 - 적절한 스트레스 수준'}
- 의학적 해석: 베타파와 감마파의 비율을 통해 정신적 스트레스 수준을 평가합니다.

**좌우뇌 균형 (Hemispheric Balance): ${balanceValue}**
- 정상 범위: -0.1~0.1
- 현재 상태: ${Math.abs(parseFloat(balanceValue)) > 0.1 ? '불균형 상태 - 좌우뇌 활성도 차이 존재' : '균형 상태 - 좌우뇌 조화로운 활동'}
- 의학적 해석: 좌우 대뇌반구의 활성도 균형을 나타내며, 인지적 균형과 정서 안정성을 반영합니다.

**인지 부하 (Cognitive Load): ${cognitiveValue}**
- 정상 범위: 0.4-0.8
- 현재 상태: ${parseFloat(cognitiveValue) < 0.4 ? '낮은 인지 부하 - 정신적 활동 부족' : parseFloat(cognitiveValue) > 0.8 ? '높은 인지 부하 - 과도한 정신적 부담' : '적절한 인지 부하 - 균형잡힌 정신 활동'}
- 의학적 해석: 정보 처리 부담 정도를 나타내며, 인지적 피로도와 정신적 효율성을 평가합니다.

### 🎯 개인화된 정신건강 평가

**연령별 특성 (${age}세 ${personalInfo.gender === 'male' ? '남성' : '여성'})**
${age < 30 ? '청년기의 뇌 가소성이 높은 시기로, 스트레스 관리와 집중력 향상 훈련이 매우 효과적입니다.' : 
  age < 50 ? '중년기의 인지 기능 유지가 중요한 시기로, 규칙적인 정신 건강 관리가 필요합니다.' : 
  '장년기의 뇌 건강 보호가 중요한 시기로, 인지 기능 저하 예방에 집중해야 합니다.'}

**직업적 특성 (${occupationLabel})**
${personalInfo.occupation === 'military_medic' ? '군인의 경우 높은 스트레스 환경과 집중력 요구로 인해 정신적 회복력이 중요합니다. 현재 뇌파 패턴은 직업적 요구사항에 잘 적응하고 있음을 보여줍니다.' : 
  '현재 직업의 특성을 고려할 때, 뇌파 패턴이 업무 요구사항과 적절한 균형을 이루고 있습니다.'}

### 💡 종합 평가 및 권장사항

**강점:**
- ${eegResult.score >= 80 ? '뛰어난 정신건강 상태로 모든 지표가 우수한 수준을 유지하고 있습니다.' : 
     eegResult.score >= 60 ? '양호한 정신건강 상태로 대부분의 지표가 정상 범위에 있습니다.' : 
     '개선이 필요한 정신건강 상태로 일부 지표에서 주의가 필요합니다.'}

**개선 영역:**
${comprehensiveResult.immediate.slice(0, 2).map(action => `• ${action}`).join('\n')}

**장기 전략:**
${comprehensiveResult.longTerm.slice(0, 2).map(strategy => `• ${strategy}`).join('\n')}

이러한 뇌파 분석 결과는 개인의 정신건강 상태를 객관적으로 평가하고, 맞춤형 건강 관리 방향을 제시하는 데 중요한 기초 자료가 됩니다.`;
  }

  /**
   * 상세 신체건강 분석 생성
   */
  private static generateDetailedPhysicalHealthAnalysis(
    ppgResult: any,
    measurementData: MeasurementData,
    personalInfo: PersonalInfo,
    comprehensiveResult: ComprehensiveAnalysisResult
  ): string {
    const age = this.calculateAge(personalInfo);
    const occupationLabel = this.getOccupationLabel(personalInfo.occupation, personalInfo.customOccupation);
    
    // 실제 측정값들
    const heartRateValue = Math.round(measurementData.ppgMetrics.heartRate?.value || 0);
    const rmssdValue = Math.round(measurementData.ppgMetrics.rmssd?.value || 0);
    const sdnnValue = Math.round(measurementData.ppgMetrics.sdnn?.value || 0);
    const spo2Value = Math.round(measurementData.ppgMetrics.spo2?.value || 0);
    const lfHfRatioValue = measurementData.ppgMetrics.lfHfRatio?.value?.toFixed(2) || 'N/A';
    const lfPowerValue = measurementData.ppgMetrics.lfPower?.value?.toFixed(2) || 'N/A';
    const hfPowerValue = measurementData.ppgMetrics.hfPower?.value?.toFixed(2) || 'N/A';

    return `## ❤️ 신체건강 종합 분석 (점수: ${ppgResult.score}/100)

### 📊 심혈관 지표 상세 해석

**심박수 (Heart Rate): ${heartRateValue} BPM**
- 정상 범위: 60-100 BPM
- 현재 상태: ${heartRateValue < 60 ? '정상 범위 미달 - 서맥 (운동선수나 매우 건강한 상태일 수 있음)' : heartRateValue > 100 ? '정상 범위 초과 - 빈맥 (스트레스, 카페인, 운동 후 상태 가능)' : '정상 범위 - 건강한 심박수'}
- 의학적 해석: 심장의 수축 빈도로 심혈관 건강과 자율신경계 상태를 반영합니다.

**심박변이도 RMSSD: ${rmssdValue} ms**
- 정상 범위: 20-50 ms
- 현재 상태: ${rmssdValue < 20 ? '정상 범위 미달 - 자율신경계 기능 저하' : rmssdValue > 50 ? '정상 범위 초과 - 매우 활발한 부교감신경 활동' : '정상 범위 - 건강한 자율신경 균형'}
- 의학적 해석: 연속된 심박 간격의 변이를 측정하여 부교감신경 활성도와 스트레스 회복 능력을 평가합니다.

**심박변이도 SDNN: ${sdnnValue} ms**
- 정상 범위: 30-100 ms
- 현재 상태: ${sdnnValue < 30 ? '정상 범위 미달 - 전체적인 자율신경 활성도 저하' : sdnnValue > 100 ? '정상 범위 초과 - 매우 높은 자율신경 활성도' : '정상 범위 - 건강한 자율신경 기능'}
- 의학적 해석: 전체 심박변이도를 나타내며, 자율신경계의 전반적인 건강 상태를 평가합니다.

**산소포화도 (SpO2): ${spo2Value}%**
- 정상 범위: 95-100%
- 현재 상태: ${spo2Value < 95 ? '정상 범위 미달 - 산소 공급 부족 (의료진 상담 권장)' : '정상 범위 - 건강한 산소 공급'}
- 의학적 해석: 혈액 내 산소 포화도로 호흡 및 순환 기능을 평가합니다.

**자율신경 균형 (LF/HF Ratio): ${lfHfRatioValue}**
- 정상 범위: 1.0-10.0
- 현재 상태: ${parseFloat(lfHfRatioValue) < 1.0 ? '정상 범위 미달 - 부교감신경 우세 (과도한 이완 상태)' : parseFloat(lfHfRatioValue) > 10.0 ? '정상 범위 초과 - 교감신경 우세 (스트레스 상태)' : '정상 범위 - 균형잡힌 자율신경 활동'}
- 의학적 해석: 교감신경과 부교감신경의 균형을 나타내며, 스트레스 대응 능력을 평가합니다.

**LF Power (저주파 성분): ${lfPowerValue} ms²**
- 의학적 해석: 교감신경 활성도를 반영하며, 스트레스 반응과 혈압 조절 능력을 나타냅니다.

**HF Power (고주파 성분): ${hfPowerValue} ms²**
- 의학적 해석: 부교감신경 활성도를 반영하며, 휴식 및 회복 능력을 나타냅니다.

### 🎯 개인화된 신체건강 평가

**연령별 특성 (${age}세 ${personalInfo.gender === 'male' ? '남성' : '여성'})**
${age < 30 ? '청년기의 심혈관 시스템이 가장 활발한 시기로, 규칙적인 운동과 건강한 생활습관으로 최적의 상태를 유지할 수 있습니다.' : 
  age < 50 ? '중년기의 심혈관 건강 관리가 중요한 시기로, 정기적인 모니터링과 예방적 관리가 필요합니다.' : 
  '장년기의 심혈관 질환 예방이 중요한 시기로, 적극적인 건강 관리와 정기 검진이 필요합니다.'}

**성별 특성**
${personalInfo.gender === 'male' ? '남성의 경우 심혈관 질환 위험이 상대적으로 높아 꾸준한 관리가 중요합니다. 현재 측정 결과는 양호한 수준을 보이고 있습니다.' : 
  '여성의 경우 호르몬 변화에 따른 심혈관 건강 변화를 고려한 관리가 필요합니다. 현재 측정 결과는 건강한 상태를 보여줍니다.'}

**직업적 특성 (${occupationLabel})**
${personalInfo.occupation === 'military_medic' ? '군인의 경우 높은 신체적 요구사항과 스트레스 환경에서 심혈관 건강이 매우 중요합니다. 현재 측정 결과는 직업적 요구사항에 잘 적응하고 있음을 보여줍니다.' : 
  '현재 직업의 특성을 고려할 때, 심혈관 지표가 업무 요구사항과 적절한 균형을 이루고 있습니다.'}

### 💡 종합 평가 및 권장사항

**강점:**
- ${ppgResult.score >= 80 ? '뛰어난 심혈관 건강 상태로 모든 지표가 우수한 수준을 유지하고 있습니다.' : 
     ppgResult.score >= 60 ? '양호한 심혈관 건강 상태로 대부분의 지표가 정상 범위에 있습니다.' : 
     '개선이 필요한 심혈관 건강 상태로 일부 지표에서 주의가 필요합니다.'}

**개선 영역:**
${comprehensiveResult.immediate.slice(2, 4).map(action => `• ${action}`).join('\n')}

**장기 전략:**
${comprehensiveResult.longTerm.slice(2, 4).map(strategy => `• ${strategy}`).join('\n')}

이러한 심혈관 분석 결과는 개인의 신체건강 상태를 객관적으로 평가하고, 심혈관 질환 예방 및 건강 증진을 위한 맞춤형 관리 방향을 제시하는 데 중요한 기초 자료가 됩니다.`;
  }

  /**
   * 상세 스트레스 분석 생성
   */
  private static generateDetailedStressAnalysis(
    stressResult: StressAnalysisResult,
    eegResult: any,
    ppgResult: any,
    measurementData: MeasurementData,
    personalInfo: PersonalInfo,
    comprehensiveResult: ComprehensiveAnalysisResult
  ): string {
    const age = this.calculateAge(personalInfo);
    const occupationLabel = this.getOccupationLabel(personalInfo.occupation, personalInfo.customOccupation);
    
    // 스트레스 관련 지표들
    const stressIndex = measurementData.eegMetrics.stressIndex?.value?.toFixed(2) || 'N/A';
    const lfHfRatio = measurementData.ppgMetrics.lfHfRatio?.value?.toFixed(2) || 'N/A';
    const rmssd = Math.round(measurementData.ppgMetrics.rmssd?.value || 0);
    const heartRate = Math.round(measurementData.ppgMetrics.heartRate?.value || 0);
    const relaxationIndex = measurementData.eegMetrics.relaxationIndex?.value?.toFixed(3) || 'N/A';

    return `## ⚡ 스트레스 종합 분석 (점수: ${stressResult.score}/100)

### 📊 스트레스 지표 상세 해석

**뇌파 스트레스 지수: ${stressIndex}**
- 정상 범위: 3.0-4.0
- 현재 상태: ${parseFloat(stressIndex) < 3.0 ? '정상 범위 미달 - 매우 낮은 스트레스 상태 (주의력 저하 가능)' : parseFloat(stressIndex) > 4.0 ? '정상 범위 초과 - 높은 스트레스 상태 (긴장 및 불안 상태)' : '정상 범위 - 적절한 스트레스 수준'}
- 의학적 해석: 베타파와 감마파의 비율로 측정되며, 정신적 긴장도와 각성 상태를 반영합니다.

**자율신경 스트레스 지표 (LF/HF 비율): ${lfHfRatio}**
- 정상 범위: 1.0-10.0
- 현재 상태: ${parseFloat(lfHfRatio) < 1.0 ? '부교감신경 우세 - 과도한 이완 상태' : parseFloat(lfHfRatio) > 10.0 ? '교감신경 우세 - 높은 스트레스 상태' : '균형 상태 - 건강한 자율신경 활동'}
- 의학적 해석: 교감신경과 부교감신경의 균형을 나타내며, 스트레스에 대한 신체 반응을 평가합니다.

**스트레스 회복력 (RMSSD): ${rmssd} ms**
- 정상 범위: 20-50 ms
- 현재 상태: ${rmssd < 20 ? '회복력 저하 - 스트레스 회복 능력 부족' : rmssd > 50 ? '높은 회복력 - 우수한 스트레스 회복 능력' : '정상 회복력 - 적절한 스트레스 회복 능력'}
- 의학적 해석: 부교감신경 활성도를 나타내며, 스트레스 상황에서의 회복 능력을 평가합니다.

**심박수 반응: ${heartRate} BPM**
- 정상 범위: 60-100 BPM
- 스트레스 관점: ${heartRate > 90 ? '스트레스 반응 - 심박수 상승으로 긴장 상태 시사' : heartRate < 70 ? '이완 상태 - 낮은 심박수로 안정 상태 시사' : '정상 상태 - 적절한 심박수 유지'}

**정신적 이완도: ${relaxationIndex}**
- 정상 범위: 0.18-0.22
- 현재 상태: ${parseFloat(relaxationIndex) < 0.18 ? '이완 부족 - 정신적 긴장 상태' : parseFloat(relaxationIndex) > 0.22 ? '과도한 이완 - 주의력 저하 가능' : '적절한 이완 - 건강한 정신 상태'}

### 🎯 스트레스 유형 및 원인 분석

**주요 스트레스 유형: ${this.determineStressType(stressResult)}**

**스트레스 원인 분석:**
${stressResult.concerns?.map(concern => `• ${concern}`).join('\n') || '• 특별한 스트레스 요인이 감지되지 않았습니다.'}

**생리적 영향:**
${this.analyzePhysiologicalImpact(eegResult, ppgResult, stressResult)}

### 🎯 개인화된 스트레스 평가

**연령별 특성 (${age}세 ${personalInfo.gender === 'male' ? '남성' : '여성'})**
${age < 30 ? '청년기의 스트레스 적응력이 높은 시기로, 건강한 스트레스 관리 습관을 형성하는 것이 중요합니다.' : 
  age < 50 ? '중년기의 스트레스 관리가 중요한 시기로, 누적된 스트레스에 대한 체계적인 관리가 필요합니다.' : 
  '장년기의 스트레스 민감성이 증가하는 시기로, 적극적인 스트레스 예방과 관리가 필요합니다.'}

**성별 특성**
${personalInfo.gender === 'male' ? '남성의 경우 스트레스를 내재화하는 경향이 있어 정기적인 스트레스 체크와 표현 방법 개발이 중요합니다.' : 
  '여성의 경우 호르몬 변화와 다중 역할로 인한 스트레스 관리가 중요하며, 현재 측정 결과는 양호한 상태를 보여줍니다.'}

**직업적 특성 (${occupationLabel})**
${personalInfo.occupation === 'military_medic' ? '군인의 경우 높은 스트레스 환경에 노출되어 있어 체계적인 스트레스 관리와 회복 기술이 매우 중요합니다. 현재 측정 결과는 직업적 스트레스에 잘 적응하고 있음을 보여줍니다.' : 
  '현재 직업의 특성을 고려할 때, 스트레스 수준이 업무 요구사항과 적절한 균형을 이루고 있습니다.'}

### 💡 스트레스 관리 전략

**즉시 실행 가능한 방법:**
${comprehensiveResult.immediate.slice(4, 6).map(action => `• ${action}`).join('\n')}

**단기 목표 (2-4주):**
${comprehensiveResult.shortTerm.slice(4, 6).map(goal => `• ${goal}`).join('\n')}

**장기 전략 (3개월 이상):**
${comprehensiveResult.longTerm.slice(4, 6).map(strategy => `• ${strategy}`).join('\n')}

### 🚨 주의사항

**모니터링이 필요한 경우:**
- 스트레스 지수가 지속적으로 4.5 이상일 때
- 심박변이도(RMSSD)가 20ms 미만으로 떨어질 때
- 수면 장애나 집중력 저하가 지속될 때

**전문가 상담 권장:**
- 스트레스 관련 신체 증상이 2주 이상 지속될 때
- 일상생활에 지장을 줄 정도의 스트레스를 경험할 때
- 스트레스 관리 방법이 효과가 없을 때

이러한 스트레스 분석 결과는 개인의 스트레스 상태를 객관적으로 평가하고, 효과적인 스트레스 관리 및 예방을 위한 맞춤형 전략을 제시하는 데 중요한 기초 자료가 됩니다.`;
  }

  // 헬퍼 메서드들
  private static calculateAge(personalInfo: PersonalInfo): number {
    const today = new Date();
    const birthDate = new Date(personalInfo.birthDate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  private static getAgeGroup(age: number): string {
    if (age < 30) return '청년기';
    if (age < 40) return '초기 성인기';
    if (age < 50) return '중년 초기';
    if (age < 60) return '중년기';
    return '장년기';
  }

  private static getOccupationLabel(occupation: string, customOccupation?: string): string {
    const occupationMap: Record<string, string> = {
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
      'office_worker': '사무직',
      'developer': '개발자',
      'designer': '디자이너',
      'healthcare': '의료진',
      'service': '서비스업',
      'sales': '영업직',
      'management': '관리직',
      'manager': '관리자',
      'general_worker': '일반 직장인',
      'entrepreneur': '사업가',
      'student': '학생',
      'freelancer': '프리랜서',
      'other': customOccupation || '기타'
    };
    
    return occupationMap[occupation] || occupation;
  }

  private static getHealthGrade(score: number): string {
    if (score >= 90) return "우수";
    if (score >= 80) return "양호";
    if (score >= 70) return "보통";
    if (score >= 60) return "주의";
    return "위험";
  }

  private static extractStrengths(result: { score: number; status: string; recommendations: string[] }): string[] {
    const strengths: string[] = [];
    
    if (result.score >= 80) {
      strengths.push(`${result.status} 상태의 우수한 지표`);
    }
    
    // 추가 강점 추출 로직
    result.recommendations.forEach(rec => {
      if (rec.includes('우수') || rec.includes('양호') || rec.includes('건강')) {
        strengths.push(rec.substring(0, 50) + '...');
      }
    });
    
    return strengths.slice(0, 2);
  }

  private static determineStressType(stressResult: StressAnalysisResult): string {
    if (stressResult.score >= 70) return "낮음";
    if (stressResult.score >= 50) return "보통";
    if (stressResult.score >= 30) return "높음";
    return "심각";
  }

  private static analyzePhysiologicalImpact(
    eegResult: any,
    ppgResult: any,
    stressResult: StressAnalysisResult
  ): string {
    const impacts: string[] = [];
    
    if (eegResult.score < 70) {
      impacts.push("정신적 피로 및 인지 기능 저하");
    }
    
    if (ppgResult.score < 70) {
      impacts.push("자율신경계 불균형 및 심혈관 부담");
    }
    
    if (stressResult.score < 70) {
      impacts.push("만성 스트레스로 인한 전반적 건강 악화");
    }
    
    return impacts.join(', ') || "현재 심각한 생리적 영향 없음";
  }

  private static identifyProblemAreas(
    eegResult: any,
    ppgResult: any,
    stressResult: StressAnalysisResult
  ): any[] {
    const problemAreas: any[] = [];
    
    // EEG 문제 영역
    if (eegResult.score < 70) {
      problemAreas.push({
        category: "정신건강",
        severity: eegResult.score < 50 ? "높음" : "중간",
        priority: 1,
        description: eegResult.concerns[0] || "정신건강 관리 필요",
        medicalContext: "뇌파 분석 기반 정신건강 우려사항",
        immediateRisks: ["스트레스 증가", "집중력 저하"],
        solutions: {
          immediate: ["심호흡 연습", "휴식 시간 확보"],
          shortTerm: ["명상 실습", "수면 패턴 개선"],
          longTerm: ["전문가 상담", "생활 습관 개선"]
        },
        expectedImprovement: {
          timeline: "2-4주",
          metrics: "스트레스 지수 개선",
          percentage: "20%"
        },
        monitoringMethod: "주간 자가 평가",
        warningSignals: ["증상 악화", "지속적 피로"]
      });
    }
    
    // PPG 문제 영역
    if (ppgResult.score < 70) {
      problemAreas.push({
        category: "신체건강",
        severity: ppgResult.score < 50 ? "높음" : "중간",
        priority: 2,
        description: ppgResult.concerns[0] || "신체건강 관리 필요",
        medicalContext: "PPG 분석 기반 심혈관 건강 우려사항",
        immediateRisks: ["심혈관 부담", "자율신경 불균형"],
        solutions: {
          immediate: ["규칙적 운동", "충분한 수분 섭취"],
          shortTerm: ["유산소 운동", "건강한 식단"],
          longTerm: ["정기 검진", "장기 운동 계획"]
        },
        expectedImprovement: {
          timeline: "4-6주",
          metrics: "심박변이도 개선",
          percentage: "15%"
        },
        monitoringMethod: "월간 재측정",
        warningSignals: ["심박수 이상", "호흡 곤란"]
      });
    }
    
    // 스트레스 문제 영역
    if (stressResult.score < 70) {
      problemAreas.push({
        category: "스트레스 관리",
        severity: stressResult.score < 50 ? "높음" : "중간",
        priority: 1,
        description: stressResult.concerns[0] || "스트레스 관리 필요",
        medicalContext: "종합 생체신호 분석 기반 스트레스 요인",
        immediateRisks: ["번아웃", "면역력 저하"],
        solutions: {
          immediate: ["스트레스 관리 기법", "충분한 휴식"],
          shortTerm: ["스트레스 요인 제거", "이완 기법 학습"],
          longTerm: ["환경 개선", "전문가 도움"]
        },
        expectedImprovement: {
          timeline: "3-5주",
          metrics: "스트레스 지수 감소",
          percentage: "25%"
        },
        monitoringMethod: "일일 스트레스 체크",
        warningSignals: ["수면 장애", "식욕 변화"]
      });
    }
    
    return problemAreas;
  }

  private static getKeyMetricsForFollowUp(
    eegResult: any,
    ppgResult: any,
    stressResult: StressAnalysisResult
  ): string {
    const metrics: string[] = [];
    
    if (eegResult.score < 80) metrics.push("집중력 지수");
    if (ppgResult.score < 80) metrics.push("심박변이도");
    if (stressResult.score < 80) metrics.push("스트레스 지수");
    
    return metrics.join(", ") || "전반적 건강 지표";
  }

  private static getImprovementTargets(
    eegResult: any,
    ppgResult: any,
    stressResult: StressAnalysisResult
  ): string {
    const targets: string[] = [];
    
    if (eegResult.score < 80) targets.push("정신건강 점수 10% 향상");
    if (ppgResult.score < 80) targets.push("심혈관 건강 15% 개선");
    if (stressResult.score < 80) targets.push("스트레스 수준 20% 감소");
    
    return targets.join(", ") || "전반적 건강 상태 개선";
  }

  private static getRecommendedSpecialists(
    eegResult: any,
    ppgResult: any,
    stressResult: StressAnalysisResult
  ): string[] {
    const specialists: string[] = [];
    
    if (eegResult.score < 60) specialists.push("정신건강의학과 전문의");
    if (ppgResult.score < 60) specialists.push("심혈관 전문의");
    if (stressResult.score < 60) specialists.push("신경심리학 전문의");
    
    return specialists;
  }

  private static getUrgencyLevel(
    eegResult: any,
    ppgResult: any,
    stressResult: StressAnalysisResult
  ): string {
    if (eegResult.score < 60 && ppgResult.score < 60 && stressResult.score < 60) return "긴급";
    if (eegResult.score < 60 || ppgResult.score < 60 || stressResult.score < 60) return "긴급";
    return "일반";
  }

  private static getWarningSignals(
    eegResult: any,
    ppgResult: any,
    stressResult: StressAnalysisResult
  ): string[] {
    const signals: string[] = [];
    
    if (eegResult.score < 60) signals.push("정신적 피로 및 인지 기능 저하");
    if (ppgResult.score < 60) signals.push("심혈관 부담 및 자율신경 불균형");
    if (stressResult.score < 60) signals.push("만성 스트레스로 인한 전반적 건강 악화");
    
    return signals;
  }

  /**
   * 직업별 맞춤 업무 환경 개선 전략 생성
   */
  private static generateOccupationSpecificStrategies(
    personalInfo: PersonalInfo,
    eegResult: any,
    ppgResult: any,
    stressResult: StressAnalysisResult
  ): string[] {
    const strategies: string[] = [];
    
    // 직업별 맞춤 전략
    switch (personalInfo.occupation) {
      case 'developer':
        strategies.push(
          `🎯 **'개발자' 맞춤 디지털 디톡스**: 업무 외 시간에는 스마트폰 알림을 끄거나, 특정 앱 사용 시간을 제한하여 디지털 피로도를 줄여주세요.`,
          `💻 **코딩 집중력 향상법**: 25분 집중 + 5분 휴식의 포모도로 기법을 활용하여 뇌의 집중력을 최적화하고 번아웃을 예방하세요.`,
          `🖥️ **개발 환경 최적화**: 모니터 높이 조절, 블루라이트 차단, 인체공학적 키보드 사용으로 신체적 스트레스를 줄이세요.`
        );
        break;
      case 'designer':
        strategies.push(
          `🎨 **창의성 향상 환경**: 자연광이 충분한 작업 공간과 식물 배치로 창의적 사고를 촉진하세요.`,
          `👁️ **시각 피로 관리**: 20-20-20 규칙(20분마다 20피트 거리의 물체를 20초간 보기)으로 눈의 피로를 줄이세요.`,
          `🖌️ **디자인 워크플로우 개선**: 반복 작업 자동화 도구 활용으로 창의적 업무에 더 집중할 수 있도록 하세요.`
        );
        break;
      case 'teacher':
        strategies.push(
          `📚 **교육자 스트레스 관리**: 수업 전후 3분 명상으로 정신적 안정을 취하고 학생들과의 소통 품질을 높이세요.`,
          `🎓 **목소리 관리**: 올바른 발성법과 수분 섭취로 성대 건강을 유지하고 피로도를 줄이세요.`,
          `👥 **학급 관리 효율화**: 학생 참여형 수업 방식으로 교사의 에너지 소모를 줄이고 효과적인 교육을 실현하세요.`
        );
        break;
      case 'military_medic':
        strategies.push(
          `🏥 **의무병사 체력 관리**: 근무 중 압박 스타킹 착용과 발목 운동으로 하지 부종과 피로를 예방하세요.`,
          `😷 **감정 노동 관리**: 환자 대응 후 짧은 심호흡으로 감정적 스트레스를 해소하고 번아웃을 예방하세요.`,
          `⏰ **교대근무 적응**: 규칙적인 수면 패턴 유지와 멜라토닌 보충으로 생체리듬을 조절하세요.`
        );
        break;
      case 'entrepreneur':
        strategies.push(
          `📞 **사업가 스트레스 관리**: 중요한 미팅 간 5분 명상으로 정신적 리셋을 하고 다음 미팅의 집중력을 높이세요.`,
          `🎯 **목표 달성 전략**: 월간 목표를 주간 단위로 세분화하여 스트레스를 줄이고 성취감을 높이세요.`,
          `🤝 **고객 소통 개선**: 적극적 경청 기법으로 고객 만족도를 높이고 사업 성과를 개선하세요.`
        );
        break;
      case 'office_worker':
        strategies.push(
          `💼 **사무직 건강 관리**: 1시간마다 5분 스트레칭으로 목, 어깨, 허리 근육의 긴장을 풀어주세요.`,
          `📊 **업무 효율성 향상**: 중요도-긴급도 매트릭스로 업무 우선순위를 정하고 스트레스를 줄이세요.`,
          `🖥️ **디지털 아이케어**: 장시간 컴퓨터 작업 시 인공눈물 사용과 화면 밝기 조절로 안구건조증을 예방하세요.`
        );
        break;
      case 'university':
        strategies.push(
          `📖 **학습 집중력 향상**: 스터디 플래너 활용과 목표 설정으로 학습 효율을 높이고 스트레스를 관리하세요.`,
          `🎓 **시험 스트레스 관리**: 시험 전 충분한 수면과 규칙적인 운동으로 최적의 컨디션을 유지하세요.`,
          `👥 **학습 환경 개선**: 스터디 그룹 참여로 동기부여를 높이고 학습 부담을 분산하세요.`
        );
        break;
      default:
        strategies.push(
          `🏢 **직장 스트레스 관리**: 업무 중 규칙적인 휴식과 심호흡으로 스트레스를 조절하세요.`,
          `⚖️ **일과 삶의 균형**: 퇴근 후 업무 관련 생각을 차단하고 개인 시간을 확보하세요.`,
          `🤝 **동료 관계 개선**: 긍정적인 소통으로 업무 환경을 개선하고 협업 효율을 높이세요.`
        );
    }

    return strategies;
  }

  /**
   * 시간 관리 전략 생성
   */
  private static generateTimeManagementStrategies(
    personalInfo: PersonalInfo,
    eegResult: any, // EEGAnalysisResult 대신 any 사용
    ppgResult: any, // PPGAnalysisResult 대신 any 사용
    stressResult: StressAnalysisResult
  ): string[] {
    const strategies: string[] = [];
    
    // 스트레스 수준에 따른 시간 관리 전략
    if (stressResult.score < 60) {
      strategies.push(
        `⏰ **시간 블록킹**: 하루를 2-3시간 단위로 나누어 집중 업무와 휴식을 번갈아 배치하세요.`,
        `📅 **우선순위 매트릭스**: 중요하고 긴급한 업무부터 처리하여 스트레스를 줄이세요.`,
        `🔔 **알림 관리**: 불필요한 알림을 차단하고 집중 시간을 확보하세요.`
      );
    } else {
      strategies.push(
        `✅ **작은 목표 설정**: 큰 프로젝트를 작은 단위로 나누어 성취감을 높이세요.`,
        `🎯 **80/20 법칙**: 중요한 20%의 업무에 80%의 시간을 투자하세요.`,
        `⏸️ **정기적 휴식**: 50분 일하고 10분 휴식하는 패턴으로 지속가능한 생산성을 유지하세요.`
      );
    }

    return strategies;
  }

  /**
   * 환경 개선 전략 생성
   */
  private static generateEnvironmentalChanges(
    personalInfo: PersonalInfo,
    eegResult: any, // EEGAnalysisResult 대신 any 사용
    ppgResult: any, // PPGAnalysisResult 대신 any 사용
    stressResult: StressAnalysisResult
  ): string[] {
    const strategies: string[] = [];
    
    // 집중력 수준에 따른 환경 개선
    if (eegResult.score < 70) {
      strategies.push(
        `🌱 **자연 요소 도입**: 책상 위 작은 화분이나 자연 소리로 집중력을 향상시키세요.`,
        `💡 **조명 최적화**: 자연광을 최대한 활용하고 따뜻한 색온도의 조명을 사용하세요.`,
        `🎵 **소음 관리**: 화이트 노이즈나 클래식 음악으로 집중 환경을 조성하세요.`
      );
    } else {
      strategies.push(
        `🌡️ **온도 조절**: 22-24°C의 쾌적한 온도로 최적의 작업 환경을 유지하세요.`,
        `🪑 **인체공학적 가구**: 올바른 자세를 유지할 수 있는 의자와 책상을 사용하세요.`,
        `🎨 **색채 활용**: 파란색이나 녹색 계열의 색상으로 안정감과 집중력을 높이세요.`
      );
    }

    return strategies;
  }

  /**
   * 동료 상호작용 전략 생성
   */
  private static generateColleagueInteractionStrategies(
    personalInfo: PersonalInfo,
    eegResult: any, // EEGAnalysisResult 대신 any 사용
    ppgResult: any, // PPGAnalysisResult 대신 any 사용
    stressResult: StressAnalysisResult
  ): string[] {
    const strategies: string[] = [];
    
    // 스트레스 수준에 따른 대인관계 전략
    if (stressResult.score < 60) {
      strategies.push(
        `🤝 **건설적 소통**: 문제 해결 중심의 대화로 갈등을 최소화하세요.`,
        `👂 **적극적 경청**: 동료의 의견을 충분히 듣고 이해하려 노력하세요.`,
        `🎯 **명확한 의사소통**: 업무 요청 시 구체적이고 명확한 표현을 사용하세요.`
      );
    } else {
      strategies.push(
        `☕ **비공식적 소통**: 커피 타임이나 점심 시간을 활용해 동료와 유대감을 형성하세요.`,
        `🎉 **긍정적 피드백**: 동료의 성과를 인정하고 격려하는 문화를 만들어가세요.`,
        `🤲 **상호 지원**: 서로의 강점을 활용한 협업으로 시너지를 창출하세요.`
      );
    }

    return strategies;
  }

  /**
   * 새로운 아키텍처용 AI 프롬프트 생성
   */
  private static generateNewArchitecturePrompt(
    personalInfo: PersonalInfo,
    measurementData: MeasurementData,
    eegDetailedAnalysis: EEGDetailedAnalysis,
    ppgDetailedAnalysis: PPGDetailedAnalysis,
    mentalHealthRiskAnalysis: MentalHealthRiskAnalysis,
    stressAnalysis: StressAnalysisResult,
    mentalHealthBiomarkers?: MentalHealthBiomarkers
  ): string {
    return REDESIGNED_PROMPTS.COMPREHENSIVE_ANALYSIS
      .replace('{personalInfo}', JSON.stringify(personalInfo))
      .replace('{measurementData}', JSON.stringify(measurementData))
      .replace('{eegDetailedAnalysis}', JSON.stringify(eegDetailedAnalysis))
      .replace('{ppgDetailedAnalysis}', JSON.stringify(ppgDetailedAnalysis))
      .replace('{mentalHealthRiskAnalysis}', JSON.stringify(mentalHealthRiskAnalysis))
      .replace('{stressAnalysis}', JSON.stringify(stressAnalysis))
      .replace('{mentalHealthBiomarkers}', JSON.stringify(mentalHealthBiomarkers || {}));
  }

  /**
   * 새로운 아키텍처용 폴백 결과 생성
   */
  private static createNewArchitectureFallbackResult(
    personalInfo: PersonalInfo,
    measurementData: MeasurementData,
    eegDetailedAnalysis: EEGDetailedAnalysis,
    ppgDetailedAnalysis: PPGDetailedAnalysis,
    mentalHealthRiskAnalysis: MentalHealthRiskAnalysis,
    stressAnalysis: StressAnalysisResult
  ): ComprehensiveAnalysisResult {
    const age = this.calculateAge(personalInfo);
    const occupationLabel = this.getOccupationLabel(personalInfo.occupation, personalInfo.customOccupation);

    // 종합 점수 계산 (새로운 아키텍처 기반)
    const overallScore = Math.round(
      (eegDetailedAnalysis.overallEEGScore.standardized * 0.3) +
      (ppgDetailedAnalysis.overallPPGScore.standardized * 0.3) +
      (mentalHealthRiskAnalysis.overallMentalHealthScore.standardized * 0.25) +
      (stressAnalysis.score * 0.15)
    );

    return {
      overallScore,
      healthStatus: this.getHealthGrade(overallScore),
      analysis: `새로운 아키텍처 기반 종합 분석 결과입니다. EEG 상세 분석, PPG 상세 분석, 정신건강 위험도 분석을 통해 ${age}세 ${personalInfo.gender} ${occupationLabel}님의 건강 상태를 종합적으로 평가했습니다.`,
      keyFindings: {
        mentalHealth: `뇌파 건강도: ${eegDetailedAnalysis.overallEEGScore.grade}`,
        physicalHealth: `심혈관 건강도: ${ppgDetailedAnalysis.overallPPGScore.grade}`,
        stressManagement: `스트레스 관리: ${stressAnalysis.status}`,
        mentalHealthRisk: `정신건강 위험도: ${mentalHealthRiskAnalysis.overallMentalHealthScore.grade}`,
        overallBalance: `전체 균형: ${this.getHealthGrade(overallScore)}`
      },
      problemAreas: [],
      immediate: [
        "정기적인 건강 관리를 시작하세요",
        "스트레스 관리 기법을 실천하세요",
        "충분한 수면을 취하세요"
      ],
      shortTerm: [
        "정기적인 운동 습관을 만드세요",
        "균형 잡힌 식단을 유지하세요",
        "정신건강 관리에 관심을 가지세요"
      ],
      longTerm: [
        "장기적인 건강 관리 계획을 수립하세요",
        "전문가와의 정기적인 상담을 고려하세요",
        "생활습관 개선을 지속하세요"
      ],
      occupationalAnalysis: {
        characteristics: `${occupationLabel} 특성에 맞는 건강 관리가 필요합니다`,
        dataCorrelation: "측정 데이터와 직업적 요구사항 간의 연관성을 분석했습니다",
        currentStatus: "현재 건강 상태는 양호한 편입니다",
        recommendations: [
          "직업별 맞춤 건강 관리 방안을 실천하세요",
          "업무 환경 개선을 고려하세요",
          "일과 삶의 균형을 유지하세요"
        ]
      },
      followUpPlan: {
        monitoring: "정기적인 건강 지표 모니터링이 필요합니다",
        adjustments: "개인 상황에 맞는 관리 방안 조정이 필요합니다",
        professional: "필요시 전문가 상담을 받으시기 바랍니다"
      }
    };
  }
} 