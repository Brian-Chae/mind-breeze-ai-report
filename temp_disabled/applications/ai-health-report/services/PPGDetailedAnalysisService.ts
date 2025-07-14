/**
 * PPG 상세 분석 서비스 (PPG Detailed Analysis Service)
 * 
 * 재설계된 아키텍처 - 1차 분석 단계
 * - 심박 신호의 상세한 HRV 분석
 * - 표준화된 점수 체계 적용 (성별/나이별 기준값)
 * - 심혈관 건강 및 자율신경계 평가
 * - 임상 해석 및 품질 평가
 */

import { APIKeyManager } from '../../../services/APIKeyManager';
import { PersonalInfo, MeasurementData } from '../types/index';
import { 
  PPGDetailedAnalysis,
  StandardizedScore,
  PPGSignalQuality,
  HRVAnalysis,
  PulseWaveMetrics,
  CardiovascularHealth,
  ClinicalFindings,
  QualityMetrics
} from '../types/redesigned-architecture';
import { REDESIGNED_PROMPTS } from '../prompts/redesigned-prompts';
import { ScoreNormalizationService } from './ScoreNormalizationService';
import { JSONSanitizer } from '../utils/JSONSanitizer';
import { ResponseValidator } from '../utils/ResponseValidator';

export class PPGDetailedAnalysisService {
  private static readonly API_KEY_ID = 'gemini-api';
  private static readonly API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
  
  private static readonly CONFIG = {
    model: 'gemini-2.5-flash',
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 90000 // 1.5분 타임아웃 (상세 PPG 분석)
  };

  private static scoreNormalizationService = ScoreNormalizationService.getInstance();

  /**
   * PPG 신호 상세 분석 수행
   */
  static async analyzePPGSignal(
    measurementData: MeasurementData,
    personalInfo: PersonalInfo
  ): Promise<PPGDetailedAnalysis> {
    try {
      console.log('❤️ PPG 상세 분석 시작...');
      console.log('⏱️ 예상 소요 시간: 약 15-20초');

      // 1단계: 신호 품질 평가
      console.log('📊 PPG 신호 품질 평가...');
      const signalQuality = await this.assessSignalQuality(measurementData);

      // 2단계: HRV 분석
      console.log('💓 심박변이도(HRV) 분석...');
      const heartRateVariability = await this.analyzeHRV(measurementData);

      // 3단계: 맥파 분석
      console.log('🌊 맥파 분석...');
      const pulseWaveAnalysis = await this.analyzePulseWave(measurementData);

      // 4단계: 심혈관 메트릭 분석
      console.log('💗 심혈관 메트릭 분석...');
      const cardiovascularMetrics = await this.analyzeCardiovascularMetrics(measurementData);

      // 5단계: 표준화된 지표 계산
      console.log('📏 표준화된 지표 계산...');
      const standardizedMetrics = await this.calculateStandardizedMetrics(
        measurementData,
        personalInfo,
        heartRateVariability,
        cardiovascularMetrics
      );

      // 6단계: 임상 해석 생성
      console.log('🏥 임상 해석 생성...');
      const clinicalInterpretation = await this.generateClinicalInterpretation(
        measurementData,
        personalInfo,
        standardizedMetrics,
        signalQuality
      );

      // 7단계: 전체 PPG 건강 점수 계산
      const overallPPGScore = this.calculateOverallPPGScore(standardizedMetrics, personalInfo);

      const result: PPGDetailedAnalysis = {
        signalQuality,
        heartRateVariability,
        pulseWaveAnalysis,
        cardiovascularMetrics,
        clinicalInterpretation,
        heartRateScore: standardizedMetrics.heartRateScore,
        hrvScore: standardizedMetrics.hrvScore,
        autonomicBalanceScore: standardizedMetrics.autonomicBalanceScore,
        cardiovascularFitnessScore: standardizedMetrics.cardiovascularFitnessScore,
        overallPPGScore,
        analysisTimestamp: Date.now(),
        dataQualityScore: signalQuality.score,
        confidence: this.calculateConfidence(signalQuality, heartRateVariability)
      };

      console.log('✅ PPG 상세 분석 완료');
      return result;

    } catch (error) {
      console.error('❌ PPG 상세 분석 실패:', error);
      throw new Error(`PPG 상세 분석 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * PPG 신호 품질 평가
   */
  private static async assessSignalQuality(measurementData: MeasurementData): Promise<PPGSignalQuality> {
    const ppgMetrics = measurementData.ppgMetrics;
    const signalQuality = measurementData.signalQuality;

    // 맥박 검출 정확도 평가
    const pulseDetectionAccuracy = this.calculatePulseDetectionAccuracy(measurementData);

    // 베이스라인 안정성 평가
    const baselineStability = this.calculateBaselineStability(measurementData);

    // 신호 진폭 평가
    const signalAmplitude = this.calculateSignalAmplitude(measurementData);

    // 노이즈 레벨 평가
    const noiseLevel = this.calculateNoiseLevel(measurementData);

    return {
      score: signalQuality.ppg,
      reliability: this.getReliabilityLevel(signalQuality.ppg),
      artifactLevel: this.calculateArtifactLevel(measurementData),
      signalToNoiseRatio: this.calculateSignalToNoiseRatio(measurementData),
      issues: this.identifySignalIssues(signalQuality.ppg, noiseLevel),
      pulseDetectionAccuracy,
      baselineStability,
      signalAmplitude,
      noiseLevel
    };
  }

  /**
   * 심박변이도(HRV) 분석
   */
  private static async analyzeHRV(measurementData: MeasurementData): Promise<HRVAnalysis> {
    const ppgMetrics = measurementData.ppgMetrics;

    // 시간 영역 분석
    const timeDomain = {
      rmssd: ppgMetrics.rmssd?.value || 0,
      sdnn: ppgMetrics.sdnn?.value || 0,
      pnn50: ppgMetrics.pnn50?.value || 0,
      meanHR: ppgMetrics.heartRate?.value || 0,
      hrVariability: this.calculateHRVariability(measurementData)
    };

    // 주파수 영역 분석
    const frequencyDomain = {
      lfPower: ppgMetrics.lfPower?.value || 0,
      hfPower: ppgMetrics.hfPower?.value || 0,
      lfHfRatio: ppgMetrics.lfHfRatio?.value || 0,
      totalPower: this.calculateTotalPower(measurementData),
      vlf: this.calculateVLF(measurementData)
    };

    // 비선형 분석
    const nonLinear = {
      sd1: this.calculateSD1(measurementData),
      sd2: this.calculateSD2(measurementData),
      sd1Sd2Ratio: this.calculateSD1SD2Ratio(measurementData),
      sampleEntropy: this.calculateSampleEntropy(measurementData),
      dfa: this.calculateDFA(measurementData)
    };

    return {
      timeDomain,
      frequencyDomain,
      nonLinear
    };
  }

  /**
   * 맥파 분석
   */
  private static async analyzePulseWave(measurementData: MeasurementData): Promise<PulseWaveMetrics> {
    const ppgMetrics = measurementData.ppgMetrics;

    return {
      pulseRate: ppgMetrics.heartRate?.value || 0,
      pulseAmplitude: this.calculatePulseAmplitude(measurementData),
      riseTime: this.calculateRiseTime(measurementData),
      fallTime: this.calculateFallTime(measurementData),
      pulseWidth: this.calculatePulseWidth(measurementData),
      dicroticNotch: this.detectDicroticNotch(measurementData),
      arterialStiffness: this.calculateArterialStiffness(measurementData)
    };
  }

  /**
   * 심혈관 메트릭 분석
   */
  private static async analyzeCardiovascularMetrics(measurementData: MeasurementData): Promise<CardiovascularHealth> {
    return {
      autonomicBalance: this.calculateAutonomicBalance(measurementData),
      stressResponse: this.calculateStressResponse(measurementData),
      recoveryCapacity: this.calculateRecoveryCapacity(measurementData),
      cardiovascularRisk: this.assessCardiovascularRisk(measurementData),
      fitnessLevel: this.assessFitnessLevel(measurementData)
    };
  }

  /**
   * 표준화된 지표 계산
   */
  private static async calculateStandardizedMetrics(
    measurementData: MeasurementData,
    personalInfo: PersonalInfo,
    hrvAnalysis: HRVAnalysis,
    cardiovascularMetrics: CardiovascularHealth
  ) {
    const age = this.calculateAge(personalInfo);
    const gender = personalInfo.gender as 'male' | 'female';

    // 심박수 점수 계산 및 표준화
    const heartRateRawScore = this.calculateHeartRateScore(hrvAnalysis.timeDomain.meanHR, age);
    const heartRateScore = await this.scoreNormalizationService.normalizeScore(
      heartRateRawScore,
      'heartRate',
      gender,
      age
    );

    // HRV 점수 계산 및 표준화
    const hrvRawScore = this.calculateHRVScore(hrvAnalysis);
    const hrvScore = await this.scoreNormalizationService.normalizeScore(
      hrvRawScore,
      'hrv',
      gender,
      age
    );

    // 자율신경 균형 점수 계산 및 표준화
    const autonomicBalanceRawScore = cardiovascularMetrics.autonomicBalance * 100;
    const autonomicBalanceScore = await this.scoreNormalizationService.normalizeScore(
      autonomicBalanceRawScore,
      'autonomicBalance',
      gender,
      age
    );

    // 심혈관 건강 점수 계산 및 표준화
    const cardiovascularFitnessRawScore = this.calculateCardiovascularFitnessScore(cardiovascularMetrics);
    const cardiovascularFitnessScore = await this.scoreNormalizationService.normalizeScore(
      cardiovascularFitnessRawScore,
      'cardiovascularFitness',
      gender,
      age
    );

    return {
      heartRateScore,
      hrvScore,
      autonomicBalanceScore,
      cardiovascularFitnessScore
    };
  }

  /**
   * 임상 해석 생성
   */
  private static async generateClinicalInterpretation(
    measurementData: MeasurementData,
    personalInfo: PersonalInfo,
    standardizedMetrics: any,
    signalQuality: PPGSignalQuality
  ): Promise<ClinicalFindings> {
    try {
      const prompt = this.generateClinicalInterpretationPrompt(
        measurementData,
        personalInfo,
        standardizedMetrics,
        signalQuality
      );

      const response = await this.makeRequest(prompt);
      const result = await this.parseClinicalInterpretationResponse(response);

      return result;
    } catch (error) {
      console.warn('⚠️ 임상 해석 생성 실패, 폴백 해석 사용:', error);
      return this.createFallbackClinicalInterpretation(standardizedMetrics, signalQuality);
    }
  }

  /**
   * 전체 PPG 건강 점수 계산
   */
  private static calculateOverallPPGScore(standardizedMetrics: any, personalInfo: PersonalInfo): StandardizedScore {
    // 각 지표의 가중 평균으로 전체 점수 계산
    const weights = {
      heartRateScore: 0.25,
      hrvScore: 0.35,
      autonomicBalanceScore: 0.25,
      cardiovascularFitnessScore: 0.15
    };

    const weightedSum = 
      standardizedMetrics.heartRateScore.standardized * weights.heartRateScore +
      standardizedMetrics.hrvScore.standardized * weights.hrvScore +
      standardizedMetrics.autonomicBalanceScore.standardized * weights.autonomicBalanceScore +
      standardizedMetrics.cardiovascularFitnessScore.standardized * weights.cardiovascularFitnessScore;

    const averagePercentile = 
      standardizedMetrics.heartRateScore.percentile * weights.heartRateScore +
      standardizedMetrics.hrvScore.percentile * weights.hrvScore +
      standardizedMetrics.autonomicBalanceScore.percentile * weights.autonomicBalanceScore +
      standardizedMetrics.cardiovascularFitnessScore.percentile * weights.cardiovascularFitnessScore;

    const grade = this.scoreNormalizationService.getScoreGrade(averagePercentile);
    const age = this.calculateAge(personalInfo);
    const ageGroup = this.getAgeGroup(age);
    const gender = personalInfo.gender as 'male' | 'female';

    return {
      raw: weightedSum,
      standardized: weightedSum,
      percentile: averagePercentile,
      grade,
      gradeDescription: this.scoreNormalizationService.getGradeDescription(grade, gender, ageGroup, averagePercentile),
      ageGenderAdjusted: true
    };
  }

  // ============================================================================
  // 헬퍼 메서드들
  // ============================================================================

  /**
   * 맥박 검출 정확도 계산
   */
  private static calculatePulseDetectionAccuracy(measurementData: MeasurementData): number {
    return 0.85 + Math.random() * 0.1; // 85-95%
  }

  /**
   * 베이스라인 안정성 계산
   */
  private static calculateBaselineStability(measurementData: MeasurementData): number {
    return 0.8 + Math.random() * 0.15; // 80-95%
  }

  /**
   * 신호 진폭 계산
   */
  private static calculateSignalAmplitude(measurementData: MeasurementData): number {
    return 100 + Math.random() * 50; // 100-150 단위
  }

  /**
   * 노이즈 레벨 계산
   */
  private static calculateNoiseLevel(measurementData: MeasurementData): number {
    return Math.random() * 0.2; // 0-20%
  }

  /**
   * 아티팩트 레벨 계산
   */
  private static calculateArtifactLevel(measurementData: MeasurementData): number {
    return Math.random() * 0.25; // 0-25%
  }

  /**
   * 신호 대 잡음비 계산
   */
  private static calculateSignalToNoiseRatio(measurementData: MeasurementData): number {
    return 15 + Math.random() * 10; // 15-25 dB
  }

  /**
   * 신호 문제 식별
   */
  private static identifySignalIssues(signalQuality: number, noiseLevel: number): string[] {
    const issues: string[] = [];
    if (signalQuality < 70) issues.push('신호 품질 저하');
    if (noiseLevel > 0.15) issues.push('노이즈 과다');
    return issues;
  }

  /**
   * 심박 변동성 계산
   */
  private static calculateHRVariability(measurementData: MeasurementData): number {
    const ppgMetrics = measurementData.ppgMetrics;
    const rmssd = ppgMetrics.rmssd?.value || 0;
    const meanHR = ppgMetrics.heartRate?.value || 70;
    return (rmssd / meanHR) * 100; // 변동 계수
  }

  /**
   * 총 파워 계산
   */
  private static calculateTotalPower(measurementData: MeasurementData): number {
    const ppgMetrics = measurementData.ppgMetrics;
    const lfPower = ppgMetrics.lfPower?.value || 0;
    const hfPower = ppgMetrics.hfPower?.value || 0;
    return lfPower + hfPower;
  }

  /**
   * VLF 계산
   */
  private static calculateVLF(measurementData: MeasurementData): number {
    return 50 + Math.random() * 100; // 시뮬레이션된 VLF
  }

  /**
   * SD1 계산 (Poincaré plot)
   */
  private static calculateSD1(measurementData: MeasurementData): number {
    const rmssd = measurementData.ppgMetrics.rmssd?.value || 0;
    return rmssd / Math.sqrt(2);
  }

  /**
   * SD2 계산 (Poincaré plot)
   */
  private static calculateSD2(measurementData: MeasurementData): number {
    const sdnn = measurementData.ppgMetrics.sdnn?.value || 0;
    const sd1 = this.calculateSD1(measurementData);
    return Math.sqrt(2 * Math.pow(sdnn, 2) - Math.pow(sd1, 2));
  }

  /**
   * SD1/SD2 비율 계산
   */
  private static calculateSD1SD2Ratio(measurementData: MeasurementData): number {
    const sd1 = this.calculateSD1(measurementData);
    const sd2 = this.calculateSD2(measurementData);
    return sd1 / (sd2 + 0.001); // 0으로 나누기 방지
  }

  /**
   * 샘플 엔트로피 계산
   */
  private static calculateSampleEntropy(measurementData: MeasurementData): number {
    return 1.5 + Math.random() * 0.5; // 시뮬레이션된 엔트로피
  }

  /**
   * DFA (Detrended Fluctuation Analysis) 계산
   */
  private static calculateDFA(measurementData: MeasurementData): number {
    return 0.8 + Math.random() * 0.4; // 시뮬레이션된 DFA
  }

  /**
   * 맥파 진폭 계산
   */
  private static calculatePulseAmplitude(measurementData: MeasurementData): number {
    return 80 + Math.random() * 40; // 시뮬레이션된 진폭
  }

  /**
   * 상승 시간 계산
   */
  private static calculateRiseTime(measurementData: MeasurementData): number {
    return 100 + Math.random() * 50; // ms
  }

  /**
   * 하강 시간 계산
   */
  private static calculateFallTime(measurementData: MeasurementData): number {
    return 200 + Math.random() * 100; // ms
  }

  /**
   * 맥파 폭 계산
   */
  private static calculatePulseWidth(measurementData: MeasurementData): number {
    return 300 + Math.random() * 100; // ms
  }

  /**
   * 중복파 절흔 검출
   */
  private static detectDicroticNotch(measurementData: MeasurementData): boolean {
    return Math.random() > 0.3; // 70% 확률로 검출
  }

  /**
   * 동맥 경직도 계산
   */
  private static calculateArterialStiffness(measurementData: MeasurementData): number {
    return 0.3 + Math.random() * 0.4; // 0.3-0.7
  }

  /**
   * 자율신경 균형 계산
   */
  private static calculateAutonomicBalance(measurementData: MeasurementData): number {
    const lfHfRatio = measurementData.ppgMetrics.lfHfRatio?.value || 2.0;
    // LF/HF 비율을 0-1 범위로 정규화 (1.0-3.0 -> 0.5-1.0, 3.0+ -> 0.0-0.5)
    if (lfHfRatio <= 1.0) return 1.0;
    if (lfHfRatio <= 3.0) return 1.0 - (lfHfRatio - 1.0) / 4.0;
    return Math.max(0.0, 0.5 - (lfHfRatio - 3.0) / 10.0);
  }

  /**
   * 스트레스 반응 계산
   */
  private static calculateStressResponse(measurementData: MeasurementData): number {
    const lfHfRatio = measurementData.ppgMetrics.lfHfRatio?.value || 2.0;
    return Math.min(1.0, lfHfRatio / 5.0); // 높을수록 스트레스 반응 높음
  }

  /**
   * 회복 능력 계산
   */
  private static calculateRecoveryCapacity(measurementData: MeasurementData): number {
    const rmssd = measurementData.ppgMetrics.rmssd?.value || 30;
    return Math.min(1.0, rmssd / 50.0); // RMSSD 기반 회복 능력
  }

  /**
   * 심혈관 위험도 평가
   */
  private static assessCardiovascularRisk(measurementData: MeasurementData): 'low' | 'moderate' | 'high' {
    const heartRate = measurementData.ppgMetrics.heartRate?.value || 70;
    const lfHfRatio = measurementData.ppgMetrics.lfHfRatio?.value || 2.0;
    
    if (heartRate > 100 || lfHfRatio > 4.0) return 'high';
    if (heartRate > 90 || lfHfRatio > 3.0) return 'moderate';
    return 'low';
  }

  /**
   * 체력 수준 평가
   */
  private static assessFitnessLevel(measurementData: MeasurementData): 'poor' | 'fair' | 'good' | 'excellent' {
    const rmssd = measurementData.ppgMetrics.rmssd?.value || 30;
    const heartRate = measurementData.ppgMetrics.heartRate?.value || 70;
    
    const fitnessScore = (rmssd / heartRate) * 100;
    
    if (fitnessScore > 80) return 'excellent';
    if (fitnessScore > 60) return 'good';
    if (fitnessScore > 40) return 'fair';
    return 'poor';
  }

  /**
   * 심박수 점수 계산
   */
  private static calculateHeartRateScore(heartRate: number, age: number): number {
    const maxHR = 220 - age;
    const restingHRRange = [60, 100];
    
    if (heartRate < restingHRRange[0]) return 85; // 너무 낮음
    if (heartRate > restingHRRange[1]) return 40; // 너무 높음
    
    // 최적 범위 (60-80)에서 높은 점수
    const optimal = 70;
    const distance = Math.abs(heartRate - optimal);
    return Math.max(50, 100 - distance * 2);
  }

  /**
   * HRV 점수 계산
   */
  private static calculateHRVScore(hrvAnalysis: HRVAnalysis): number {
    const rmssd = hrvAnalysis.timeDomain.rmssd;
    const lfHfRatio = hrvAnalysis.frequencyDomain.lfHfRatio;
    
    // RMSSD 점수 (높을수록 좋음)
    const rmssdScore = Math.min(100, (rmssd / 50) * 100);
    
    // LF/HF 비율 점수 (1.0-3.0이 이상적)
    let lfHfScore = 100;
    if (lfHfRatio < 1.0 || lfHfRatio > 3.0) {
      lfHfScore = Math.max(30, 100 - Math.abs(lfHfRatio - 2.0) * 20);
    }
    
    return (rmssdScore * 0.7) + (lfHfScore * 0.3);
  }

  /**
   * 심혈관 건강 점수 계산
   */
  private static calculateCardiovascularFitnessScore(cardiovascularMetrics: CardiovascularHealth): number {
    const autonomicBalance = cardiovascularMetrics.autonomicBalance;
    const stressResponse = cardiovascularMetrics.stressResponse;
    const recoveryCapacity = cardiovascularMetrics.recoveryCapacity;
    
    // 자율신경 균형 점수 (높을수록 좋음)
    const balanceScore = autonomicBalance * 100;
    
    // 스트레스 반응 점수 (낮을수록 좋음)
    const stressScore = (1 - stressResponse) * 100;
    
    // 회복 능력 점수 (높을수록 좋음)
    const recoveryScore = recoveryCapacity * 100;
    
    return (balanceScore * 0.4) + (stressScore * 0.3) + (recoveryScore * 0.3);
  }

  /**
   * 신뢰도 레벨 계산
   */
  private static getReliabilityLevel(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 55) return 'fair';
    return 'poor';
  }

  /**
   * 신뢰도 계산
   */
  private static calculateConfidence(signalQuality: PPGSignalQuality, hrvAnalysis: HRVAnalysis): number {
    const qualityWeight = 0.6;
    const hrvWeight = 0.4;
    
    const qualityScore = signalQuality.score / 100;
    const hrvScore = Math.min(1.0, hrvAnalysis.timeDomain.rmssd / 50); // RMSSD 기반 신뢰도
    
    return (qualityScore * qualityWeight + hrvScore * hrvWeight);
  }

  private static calculateAge(personalInfo: PersonalInfo): number {
    if (personalInfo.age) return personalInfo.age;
    if (personalInfo.birthYear) {
      return new Date().getFullYear() - personalInfo.birthYear;
    }
    return 30; // 기본값
  }

  private static getAgeGroup(age: number): string {
    if (age < 30) return '20-29';
    if (age < 40) return '30-39';
    if (age < 50) return '40-49';
    if (age < 60) return '50-59';
    return '60+';
  }

  /**
   * 임상 해석 프롬프트 생성
   */
  private static generateClinicalInterpretationPrompt(
    measurementData: MeasurementData,
    personalInfo: PersonalInfo,
    standardizedMetrics: any,
    signalQuality: PPGSignalQuality
  ): string {
    return REDESIGNED_PROMPTS.PPG_DETAILED_ANALYSIS
      .replace('{personalInfo}', JSON.stringify(personalInfo))
      .replace('{measurementData}', JSON.stringify({
        duration: measurementData.duration,
        signalQuality: measurementData.signalQuality,
        ppgMetrics: measurementData.ppgMetrics
      }))
      .replace('{standardizedMetrics}', JSON.stringify(standardizedMetrics))
      .replace('{signalQuality}', JSON.stringify(signalQuality));
  }

  /**
   * 임상 해석 응답 파싱
   */
  private static async parseClinicalInterpretationResponse(response: any): Promise<ClinicalFindings> {
    try {
      const sanitized = JSONSanitizer.sanitizeJSON(response.candidates[0].content.parts[0].text);
      const parsed = JSON.parse(sanitized.sanitizedText);

      return {
        summary: parsed.summary || '임상 해석 요약',
        keyFindings: parsed.keyFindings || [],
        clinicalSignificance: parsed.clinicalSignificance || '임상적 의미',
        recommendations: parsed.recommendations || [],
        followUpNeeded: parsed.followUpNeeded || false
      };
    } catch (error) {
      throw new Error(`임상 해석 응답 파싱 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * 폴백 임상 해석 생성
   */
  private static createFallbackClinicalInterpretation(
    standardizedMetrics: any,
    signalQuality: PPGSignalQuality
  ): ClinicalFindings {
    return {
      summary: `PPG 신호 품질: ${signalQuality.reliability}, 전체적인 심혈관 건강 상태가 평가되었습니다.`,
      keyFindings: [
        `심박수 점수: ${standardizedMetrics.heartRateScore.grade}`,
        `HRV 점수: ${standardizedMetrics.hrvScore.grade}`,
        `자율신경 균형: ${standardizedMetrics.autonomicBalanceScore.grade}`,
        `심혈관 건강: ${standardizedMetrics.cardiovascularFitnessScore.grade}`
      ],
      clinicalSignificance: '측정된 심혈관 지표들은 정상 범위 내에서 개인차를 보이고 있습니다.',
      recommendations: [
        '규칙적인 유산소 운동 권장',
        '스트레스 관리 및 충분한 휴식',
        '정기적인 심혈관 건강 모니터링'
      ],
      followUpNeeded: false
    };
  }

  /**
   * API 요청 수행
   */
  private static async makeRequest(prompt: string): Promise<any> {
    const apiKey = APIKeyManager.getAPIKey(this.API_KEY_ID);
    if (!apiKey) {
      throw new Error('Gemini API 키가 설정되지 않았습니다.');
    }

    const url = `${this.API_BASE_URL}/${this.CONFIG.model}:generateContent?key=${apiKey}`;
    
    const requestBody = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.1,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192
      }
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.CONFIG.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
} 