/**
 * 스트레스 분석 전용 서비스 (레거시 호환성)
 * 
 * ⚠️ DEPRECATED: 이 서비스는 레거시 호환성을 위해 유지됩니다.
 * 새로운 구현에서는 MentalHealthRiskAnalysisService를 사용하세요.
 * 
 * - 내부적으로 MentalHealthRiskAnalysisService 위임
 * - 기존 인터페이스 호환성 유지
 * - 새로운 아키텍처와 통합
 */

import { PersonalInfo, MeasurementData } from '../types/index';
import { MentalHealthRiskAnalysisService } from './MentalHealthRiskAnalysisService';
import { EEGDetailedAnalysisService } from './EEGDetailedAnalysisService';
import { PPGDetailedAnalysisService } from './PPGDetailedAnalysisService';

export interface StressAnalysisResult {
  score: number;
  status: string;
  analysis: string;
  keyMetrics: Record<string, string>;
  recommendations: string[];
  concerns: string[];
}

export class StressAnalysisService {
  /**
   * EEG + PPG 종합 스트레스 분석
   * 
   * @deprecated 새로운 아키텍처에서는 MentalHealthRiskAnalysisService 사용 권장
   */
  static async analyzeStress(
    personalInfo: PersonalInfo,
    measurementData: MeasurementData
  ): Promise<StressAnalysisResult> {
    console.log('⚡ 스트레스 분석 시작 (레거시 호환성 모드)...');
    console.log('🔄 새로운 아키텍처 서비스로 위임...');
    
    try {
      // 1단계: EEG 상세 분석
      console.log('🧠 EEG 상세 분석...');
      const eegAnalysis = await EEGDetailedAnalysisService.analyzeEEGSignal(
        measurementData,
        personalInfo
      );

      // 2단계: PPG 상세 분석
      console.log('❤️ PPG 상세 분석...');
      const ppgAnalysis = await PPGDetailedAnalysisService.analyzePPGSignal(
        measurementData,
        personalInfo
      );

      // 3단계: 스트레스 위험도 분석
      console.log('⚡ 스트레스 위험도 분석...');
      const stressRiskAnalysis = await MentalHealthRiskAnalysisService.assessStressRisk(
        eegAnalysis,
        ppgAnalysis,
        personalInfo
      );

      // 4단계: 레거시 인터페이스로 변환
      console.log('🔄 레거시 인터페이스로 변환...');
      const legacyResult = this.convertToLegacyFormat(stressRiskAnalysis, eegAnalysis, ppgAnalysis);

      console.log('✅ 스트레스 분석 완료 (새로운 아키텍처)');
      return legacyResult;
        
      } catch (error) {
      console.error('❌ 스트레스 분석 실패, 폴백 결과 제공:', error);
          return this.createFallbackStressResult();
    }
  }

  /**
   * 새로운 아키텍처 결과를 레거시 형식으로 변환
   */
  private static convertToLegacyFormat(
    stressRisk: any,
    eegAnalysis: any,
    ppgAnalysis: any
  ): StressAnalysisResult {
    // 점수 변환 (위험도 -> 건강 점수)
    const healthScore = Math.max(0, Math.min(100, 100 - stressRisk.score.standardized));
    
    // 상태 결정
    let status: string;
    if (healthScore >= 80) status = '양호';
    else if (healthScore >= 60) status = '보통';
    else if (healthScore >= 40) status = '주의';
    else status = '관리 필요';

    // 주요 메트릭 구성
    const keyMetrics: Record<string, string> = {
      '스트레스 지수': `${stressRisk.stressIndex?.standardized?.toFixed(1) || 'N/A'}점 (${stressRisk.stressIndex?.grade || '평가 불가'})`,
      '자율신경 균형': `${stressRisk.autonomicBalance?.standardized?.toFixed(1) || 'N/A'}점 (${stressRisk.autonomicBalance?.grade || '평가 불가'})`,
      '피로도': `${stressRisk.fatigueLevel?.standardized?.toFixed(1) || 'N/A'}점 (${stressRisk.fatigueLevel?.grade || '평가 불가'})`,
      '회복력': `${stressRisk.resilience?.standardized?.toFixed(1) || 'N/A'}점 (${stressRisk.resilience?.grade || '평가 불가'})`,
      '전체 신뢰도': `${Math.round((eegAnalysis.confidence + ppgAnalysis.confidence) * 50)}%`
    };

    // 분석 내용 구성
    const analysis = this.generateLegacyAnalysis(stressRisk, healthScore, status);

    // 권장사항 추출
    const recommendations = this.extractRecommendations(stressRisk);

    // 주의사항 추출
    const concerns = this.extractConcerns(stressRisk);

    return {
      score: healthScore,
      status,
      analysis,
      keyMetrics,
      recommendations,
      concerns
    };
  }

  /**
   * 레거시 분석 내용 생성
   */
  private static generateLegacyAnalysis(stressRisk: any, score: number, status: string): string {
    const riskLevel = stressRisk.riskLevel || 'moderate';
    const confidence = Math.round(stressRisk.confidence * 100);

    return `**스트레스 종합 평가 결과**

**전체 점수**: ${score}점 (${status})
**위험도 수준**: ${this.translateRiskLevel(riskLevel)}
**분석 신뢰도**: ${confidence}%

**주요 발견사항**:
${stressRisk.indicators?.map((indicator: string) => `- ${indicator}`).join('\n') || '- 스트레스 지표 분석 완료'}

**임상적 의미**:
${stressRisk.clinicalNotes || '현재 스트레스 수준이 평가되었으며, 개인적 관리가 권장됩니다.'}

**스트레스 유형 분석**:
${this.formatStressTypes(stressRisk.stressTypes)}

**생리학적 지표**:
${this.formatPhysiologicalMarkers(stressRisk.physiologicalMarkers)}

이 분석은 건강 참고 목적으로 제공되며, 의료 진단을 대체하지 않습니다.`;
  }

  /**
   * 위험도 수준 번역
   */
  private static translateRiskLevel(riskLevel: string): string {
    const translations: Record<string, string> = {
      'low': '낮음',
      'moderate': '보통',
      'high': '높음',
      'critical': '매우 높음'
    };
    return translations[riskLevel] || '보통';
  }

  /**
   * 스트레스 유형 포맷팅
   */
  private static formatStressTypes(stressTypes: any): string {
    if (!stressTypes) return '- 스트레스 유형 분석 완료';
    
    const types = [];
    if (stressTypes.acute) types.push(`급성 스트레스: ${stressTypes.acute}`);
    if (stressTypes.chronic) types.push(`만성 스트레스: ${stressTypes.chronic}`);
    if (stressTypes.occupational) types.push(`직업적 스트레스: ${stressTypes.occupational}`);
    
    return types.length > 0 ? types.map(type => `- ${type}`).join('\n') : '- 일반적 스트레스 패턴';
  }

  /**
   * 생리학적 지표 포맷팅
   */
  private static formatPhysiologicalMarkers(markers: any): string {
    if (!markers) return '- 생리학적 지표 분석 완료';
    
    const markerList = [];
    if (markers.cortisol) markerList.push(`코르티솔 지표: ${markers.cortisol}`);
    if (markers.inflammation) markerList.push(`염증 지표: ${markers.inflammation}`);
    if (markers.autonomic) markerList.push(`자율신경 지표: ${markers.autonomic}`);
    
    return markerList.length > 0 ? markerList.map(marker => `- ${marker}`).join('\n') : '- 생리학적 반응 정상 범위';
  }

  /**
   * 권장사항 추출
   */
  private static extractRecommendations(stressRisk: any): string[] {
    const defaultRecommendations = [
      '규칙적인 명상이나 심호흡 연습',
      '충분한 수면과 규칙적인 수면 패턴 유지',
      '적절한 운동과 신체 활동',
      '스트레스 요인 식별 및 관리',
      '사회적 지지체계 활용'
    ];

    // 위험도에 따른 추가 권장사항
    if (stressRisk.riskLevel === 'high' || stressRisk.riskLevel === 'critical') {
      return [
        '전문가 상담 고려',
        '스트레스 관리 프로그램 참여',
        '작업 환경 개선 방안 모색',
        ...defaultRecommendations
      ];
    }

    return defaultRecommendations;
  }

  /**
   * 주의사항 추출
   */
  private static extractConcerns(stressRisk: any): string[] {
    const concerns: string[] = [];

    if (stressRisk.riskLevel === 'critical') {
      concerns.push('⚠️ 매우 높은 스트레스 수준 - 즉시 전문가 상담 권장');
    } else if (stressRisk.riskLevel === 'high') {
      concerns.push('⚠️ 높은 스트레스 수준 - 적극적 관리 필요');
    }

    if (stressRisk.severity === 'severe') {
      concerns.push('⚠️ 심각한 스트레스 반응 - 전문적 도움 필요');
    }

    if (stressRisk.urgency === 'urgent') {
      concerns.push('⚠️ 긴급한 스트레스 관리 필요');
    }

    // 기본 주의사항
    if (concerns.length === 0) {
      concerns.push('정기적인 스트레스 수준 모니터링 권장');
    }

    return concerns;
  }

  /**
   * 폴백 스트레스 결과 생성
   */
  private static createFallbackStressResult(): StressAnalysisResult {
    return {
      score: 65,
      status: '보통',
      analysis: `**스트레스 분석 결과 (기본 평가)**

현재 스트레스 수준이 평가되었습니다. 측정 데이터의 품질이나 분석 과정에서 제한이 있어 기본적인 평가를 제공합니다.

**권장사항**:
- 정기적인 스트레스 관리 실천
- 충분한 휴식과 수면
- 건강한 생활습관 유지

이 분석은 건강 참고 목적으로 제공되며, 의료 진단을 대체하지 않습니다.`,
      keyMetrics: {
        '스트레스 지수': '보통 수준',
        '자율신경 균형': '평가 진행 중',
        '피로도': '일반적 범위',
        '회복력': '개인차 존재',
        '전체 신뢰도': '제한적'
      },
      recommendations: [
        '규칙적인 명상이나 심호흡 연습',
        '충분한 수면과 규칙적인 수면 패턴 유지',
        '적절한 운동과 신체 활동',
        '스트레스 요인 식별 및 관리',
        '사회적 지지체계 활용'
      ],
      concerns: [
        '정기적인 스트레스 수준 모니터링 권장',
        '지속적인 스트레스 증상 시 전문가 상담'
      ]
    };
  }
} 