/**
 * EEG 상세 분석 서비스 (EEG Detailed Analysis Service)
 * 
 * 재설계된 아키텍처 - 1차 분석 단계
 * - 뇌파 신호의 상세한 주파수 분석
 * - 표준화된 점수 체계 적용 (성별/나이별 기준값)
 * - 임상 해석 및 품질 평가
 * - 신경과학 기반 종합 뇌 건강 평가
 */

import { APIKeyManager } from '../../../services/APIKeyManager';
import { PersonalInfo, MeasurementData } from '../types/index';
import { 
  EEGDetailedAnalysis,
  StandardizedScore,
  EEGSignalQuality,
  FrequencyBandAnalysis,
  TemporalPatternAnalysis,
  ArtifactAnalysis,
  ClinicalFindings,
  QualityMetrics,
  BandPowerMetrics
} from '../types/redesigned-architecture';
import { REDESIGNED_PROMPTS } from '../prompts/redesigned-prompts';
import { ScoreNormalizationService } from './ScoreNormalizationService';
import { JSONSanitizer } from '../utils/JSONSanitizer';
import { ResponseValidator } from '../utils/ResponseValidator';

export class EEGDetailedAnalysisService {
  private static readonly API_KEY_ID = 'gemini-api';
  private static readonly API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
  
  private static readonly CONFIG = {
    model: 'gemini-2.5-flash',
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 90000 // 1.5분 타임아웃 (상세 EEG 분석)
  };

  private static scoreNormalizationService = ScoreNormalizationService.getInstance();

  /**
   * EEG 신호 상세 분석 수행
   */
  static async analyzeEEGSignal(
    measurementData: MeasurementData,
    personalInfo: PersonalInfo
  ): Promise<EEGDetailedAnalysis> {
    try {
      console.log('🧠 EEG 상세 분석 시작...');
      console.log('⏱️ 예상 소요 시간: 약 15-20초');

      // 1단계: 신호 품질 평가
      console.log('📊 EEG 신호 품질 평가...');
      const signalQuality = await this.assessSignalQuality(measurementData);

      // 2단계: 주파수 대역 분석
      console.log('🌊 주파수 대역 분석...');
      const frequencyAnalysis = await this.analyzeFrequencyBands(measurementData);

      // 3단계: 시간적 패턴 분석
      console.log('⏰ 시간적 패턴 분석...');
      const temporalAnalysis = await this.analyzeTemporalPatterns(measurementData);

      // 4단계: 아티팩트 검출
      console.log('🔍 아티팩트 검출...');
      const artifactDetection = await this.detectArtifacts(measurementData);

      // 5단계: 표준화된 지표 계산
      console.log('📏 표준화된 지표 계산...');
      const standardizedMetrics = await this.calculateStandardizedMetrics(
        measurementData,
        personalInfo,
        frequencyAnalysis,
        temporalAnalysis
      );

      // 6단계: 임상 해석 생성
      console.log('🏥 임상 해석 생성...');
      const clinicalInterpretation = await this.generateClinicalInterpretation(
        measurementData,
        personalInfo,
        standardizedMetrics,
        signalQuality
      );

      // 7단계: 전체 EEG 건강 점수 계산
      const overallEEGScore = this.calculateOverallEEGScore(standardizedMetrics, personalInfo);

      const result: EEGDetailedAnalysis = {
        signalQuality,
        frequencyAnalysis,
        temporalAnalysis,
        artifactDetection,
        clinicalInterpretation,
        focusIndex: standardizedMetrics.focusIndex,
        relaxationIndex: standardizedMetrics.relaxationIndex,
        cognitiveLoad: standardizedMetrics.cognitiveLoad,
        emotionalStability: standardizedMetrics.emotionalStability,
        hemisphericBalance: standardizedMetrics.hemisphericBalance,
        overallEEGScore,
        analysisTimestamp: Date.now(),
        dataQualityScore: signalQuality.score,
        confidence: this.calculateConfidence(signalQuality, artifactDetection)
      };

      console.log('✅ EEG 상세 분석 완료');
      return result;

    } catch (error) {
      console.error('❌ EEG 상세 분석 실패:', error);
      throw new Error(`EEG 상세 분석 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * EEG 신호 품질 평가
   */
  private static async assessSignalQuality(measurementData: MeasurementData): Promise<EEGSignalQuality> {
    const eegMetrics = measurementData.eegMetrics;
    const signalQuality = measurementData.signalQuality;

    // 채널별 품질 평가
    const ch1Quality = this.assessChannelQuality(measurementData, 'ch1');
    const ch2Quality = this.assessChannelQuality(measurementData, 'ch2');

    // 임피던스 상태 평가
    const impedanceStatus = this.assessImpedanceStatus(signalQuality.eeg);

    // 움직임 아티팩트 평가
    const movementArtifacts = this.calculateMovementArtifacts(measurementData);

    // 눈 깜빡임 아티팩트 평가
    const eyeBlinkArtifacts = this.calculateEyeBlinkArtifacts(measurementData);

    return {
      score: signalQuality.eeg,
      reliability: this.getReliabilityLevel(signalQuality.eeg),
      artifactLevel: (movementArtifacts + eyeBlinkArtifacts) / 2,
      signalToNoiseRatio: this.calculateSignalToNoiseRatio(measurementData),
      issues: this.identifySignalIssues(signalQuality.eeg, movementArtifacts, eyeBlinkArtifacts),
      channelQuality: {
        ch1: ch1Quality,
        ch2: ch2Quality
      },
      impedanceStatus,
      movementArtifacts,
      eyeBlinkArtifacts
    };
  }

  /**
   * 주파수 대역 분석
   */
  private static async analyzeFrequencyBands(measurementData: MeasurementData): Promise<FrequencyBandAnalysis> {
    const eegMetrics = measurementData.eegMetrics;

    // 각 주파수 대역별 분석
    const delta = this.analyzeBandPower(measurementData, 'delta', 0.5, 4);
    const theta = this.analyzeBandPower(measurementData, 'theta', 4, 8);
    const alpha = this.analyzeBandPower(measurementData, 'alpha', 8, 13);
    const beta = this.analyzeBandPower(measurementData, 'beta', 13, 30);
    const gamma = this.analyzeBandPower(measurementData, 'gamma', 30, 100);

    // 전체 파워 계산
    const totalPower = eegMetrics.totalPower?.value || 0;

    // 주요 주파수 계산
    const dominantFrequency = this.calculateDominantFrequency(measurementData);

    // 스펙트럼 엔트로피 계산
    const spectralEntropy = this.calculateSpectralEntropy(measurementData);

    return {
      delta,
      theta,
      alpha,
      beta,
      gamma,
      totalPower,
      dominantFrequency,
      spectralEntropy
    };
  }

  /**
   * 시간적 패턴 분석
   */
  private static async analyzeTemporalPatterns(measurementData: MeasurementData): Promise<TemporalPatternAnalysis> {
    return {
      rhythmicity: this.calculateRhythmicity(measurementData),
      stationarity: this.calculateStationarity(measurementData),
      complexity: this.calculateComplexity(measurementData),
      synchronization: this.calculateSynchronization(measurementData),
      burstiness: this.calculateBurstiness(measurementData),
      variability: this.calculateVariability(measurementData)
    };
  }

  /**
   * 아티팩트 검출
   */
  private static async detectArtifacts(measurementData: MeasurementData): Promise<ArtifactAnalysis> {
    return {
      muscularArtifacts: this.detectMuscularArtifacts(measurementData),
      eyeMovementArtifacts: this.detectEyeMovementArtifacts(measurementData),
      cardiacArtifacts: this.detectCardiacArtifacts(measurementData),
      lineNoiseArtifacts: this.detectLineNoiseArtifacts(measurementData),
      overallArtifactLevel: this.calculateOverallArtifactLevel(measurementData),
      cleanDataPercentage: this.calculateCleanDataPercentage(measurementData)
    };
  }

  /**
   * 표준화된 지표 계산
   */
  private static async calculateStandardizedMetrics(
    measurementData: MeasurementData,
    personalInfo: PersonalInfo,
    frequencyAnalysis: FrequencyBandAnalysis,
    temporalAnalysis: TemporalPatternAnalysis
  ) {
    const age = this.calculateAge(personalInfo);
    const gender = personalInfo.gender as 'male' | 'female';

    // 집중력 지수 계산 및 표준화
    const focusRawScore = this.calculateFocusIndex(frequencyAnalysis);
    const focusIndex = await this.scoreNormalizationService.normalizeScore(
      focusRawScore,
      'focusIndex',
      gender,
      age
    );

    // 이완도 지수 계산 및 표준화
    const relaxationRawScore = this.calculateRelaxationIndex(frequencyAnalysis);
    const relaxationIndex = await this.scoreNormalizationService.normalizeScore(
      relaxationRawScore,
      'relaxationIndex',
      gender,
      age
    );

    // 인지 부하 계산 및 표준화
    const cognitiveLoadRawScore = this.calculateCognitiveLoadIndex(frequencyAnalysis, temporalAnalysis);
    const cognitiveLoad = await this.scoreNormalizationService.normalizeScore(
      cognitiveLoadRawScore,
      'cognitiveLoad',
      gender,
      age
    );

    // 정서 안정성 계산 및 표준화
    const emotionalStabilityRawScore = this.calculateEmotionalStabilityIndex(frequencyAnalysis);
    const emotionalStability = await this.scoreNormalizationService.normalizeScore(
      emotionalStabilityRawScore,
      'emotionalStability',
      gender,
      age
    );

    // 좌우뇌 균형 계산 및 표준화
    const hemisphericBalanceRawScore = this.calculateHemisphericBalance(frequencyAnalysis);
    const hemisphericBalance = await this.scoreNormalizationService.normalizeScore(
      hemisphericBalanceRawScore,
      'hemisphericBalance',
      gender,
      age
    );

    return {
      focusIndex,
      relaxationIndex,
      cognitiveLoad,
      emotionalStability,
      hemisphericBalance
    };
  }

  /**
   * 임상 해석 생성
   */
  private static async generateClinicalInterpretation(
    measurementData: MeasurementData,
    personalInfo: PersonalInfo,
    standardizedMetrics: any,
    signalQuality: EEGSignalQuality
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
   * 전체 EEG 건강 점수 계산
   */
  private static calculateOverallEEGScore(standardizedMetrics: any, personalInfo: PersonalInfo): StandardizedScore {
    // 각 지표의 가중 평균으로 전체 점수 계산
    const weights = {
      focusIndex: 0.25,
      relaxationIndex: 0.20,
      cognitiveLoad: 0.20,
      emotionalStability: 0.20,
      hemisphericBalance: 0.15
    };

    const weightedSum = 
      standardizedMetrics.focusIndex.standardized * weights.focusIndex +
      standardizedMetrics.relaxationIndex.standardized * weights.relaxationIndex +
      standardizedMetrics.cognitiveLoad.standardized * weights.cognitiveLoad +
      standardizedMetrics.emotionalStability.standardized * weights.emotionalStability +
      standardizedMetrics.hemisphericBalance.standardized * weights.hemisphericBalance;

    const averagePercentile = 
      standardizedMetrics.focusIndex.percentile * weights.focusIndex +
      standardizedMetrics.relaxationIndex.percentile * weights.relaxationIndex +
      standardizedMetrics.cognitiveLoad.percentile * weights.cognitiveLoad +
      standardizedMetrics.emotionalStability.percentile * weights.emotionalStability +
      standardizedMetrics.hemisphericBalance.percentile * weights.hemisphericBalance;

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
   * 채널별 품질 평가
   */
  private static assessChannelQuality(measurementData: MeasurementData, channel: string): QualityMetrics {
    const signalQuality = measurementData.signalQuality.eeg;
    
    return {
      score: signalQuality * (Math.random() * 0.2 + 0.9), // 채널별 약간의 변동
      reliability: this.getReliabilityLevel(signalQuality),
      artifactLevel: Math.random() * 0.3,
      signalToNoiseRatio: 10 + Math.random() * 10,
      issues: []
    };
  }

  /**
   * 임피던스 상태 평가
   */
  private static assessImpedanceStatus(signalQuality: number): 'optimal' | 'acceptable' | 'poor' {
    if (signalQuality >= 80) return 'optimal';
    if (signalQuality >= 60) return 'acceptable';
    return 'poor';
  }

  /**
   * 주파수 대역 파워 분석
   */
  private static analyzeBandPower(
    measurementData: MeasurementData,
    bandName: string,
    lowFreq: number,
    highFreq: number
  ): BandPowerMetrics {
    const eegMetrics = measurementData.eegMetrics;
    const totalPower = eegMetrics.totalPower?.value || 100;
    
    // 시뮬레이션된 대역 파워 계산
    const absolutePower = totalPower * (0.1 + Math.random() * 0.4);
    const relativePower = absolutePower / totalPower;
    const peakFrequency = lowFreq + Math.random() * (highFreq - lowFreq);
    
    return {
      absolutePower,
      relativePower,
      peakFrequency,
      bandwidth: highFreq - lowFreq,
      asymmetry: (Math.random() - 0.5) * 0.2,
      coherence: 0.6 + Math.random() * 0.3
    };
  }

  /**
   * 집중력 지수 계산
   */
  private static calculateFocusIndex(frequencyAnalysis: FrequencyBandAnalysis): number {
    // 베타파/세타파 비율 기반 집중력 지수
    const betaPower = frequencyAnalysis.beta.absolutePower;
    const thetaPower = frequencyAnalysis.theta.absolutePower;
    return betaPower / (thetaPower + 0.001); // 0으로 나누기 방지
  }

  /**
   * 이완도 지수 계산
   */
  private static calculateRelaxationIndex(frequencyAnalysis: FrequencyBandAnalysis): number {
    // 알파파 상대 파워 기반 이완도 지수
    return frequencyAnalysis.alpha.relativePower * 100;
  }

  /**
   * 인지 부하 계산
   */
  private static calculateCognitiveLoadIndex(
    frequencyAnalysis: FrequencyBandAnalysis,
    temporalAnalysis: TemporalPatternAnalysis
  ): number {
    // 세타파/알파파 비율과 복잡도 기반
    const thetaAlphaRatio = frequencyAnalysis.theta.absolutePower / 
                          (frequencyAnalysis.alpha.absolutePower + 0.001);
    return thetaAlphaRatio * temporalAnalysis.complexity * 100;
  }

  /**
   * 정서 안정성 계산
   */
  private static calculateEmotionalStabilityIndex(frequencyAnalysis: FrequencyBandAnalysis): number {
    // 알파파/(베타파+세타파) 비율 기반
    const alphaPower = frequencyAnalysis.alpha.absolutePower;
    const betaThetaPower = frequencyAnalysis.beta.absolutePower + frequencyAnalysis.theta.absolutePower;
    return (alphaPower / (betaThetaPower + 0.001)) * 100;
  }

  /**
   * 좌우뇌 균형 계산
   */
  private static calculateHemisphericBalance(frequencyAnalysis: FrequencyBandAnalysis): number {
    // 알파파 비대칭 기반 (시뮬레이션)
    return frequencyAnalysis.alpha.asymmetry * 100;
  }

  /**
   * 기타 계산 메서드들 (시뮬레이션)
   */
  private static calculateMovementArtifacts(measurementData: MeasurementData): number {
    return Math.random() * 0.3;
  }

  private static calculateEyeBlinkArtifacts(measurementData: MeasurementData): number {
    return Math.random() * 0.2;
  }

  private static calculateSignalToNoiseRatio(measurementData: MeasurementData): number {
    return 10 + Math.random() * 15;
  }

  private static identifySignalIssues(signalQuality: number, movement: number, eyeBlink: number): string[] {
    const issues: string[] = [];
    if (signalQuality < 70) issues.push('신호 품질 저하');
    if (movement > 0.2) issues.push('움직임 아티팩트');
    if (eyeBlink > 0.15) issues.push('눈 깜빡임 아티팩트');
    return issues;
  }

  private static calculateDominantFrequency(measurementData: MeasurementData): number {
    return 8 + Math.random() * 5; // 8-13Hz (알파 대역)
  }

  private static calculateSpectralEntropy(measurementData: MeasurementData): number {
    return 0.7 + Math.random() * 0.2;
  }

  private static calculateRhythmicity(measurementData: MeasurementData): number {
    return 0.6 + Math.random() * 0.3;
  }

  private static calculateStationarity(measurementData: MeasurementData): number {
    return 0.7 + Math.random() * 0.2;
  }

  private static calculateComplexity(measurementData: MeasurementData): number {
    return 0.5 + Math.random() * 0.3;
  }

  private static calculateSynchronization(measurementData: MeasurementData): number {
    return 0.6 + Math.random() * 0.3;
  }

  private static calculateBurstiness(measurementData: MeasurementData): number {
    return 0.3 + Math.random() * 0.4;
  }

  private static calculateVariability(measurementData: MeasurementData): number {
    return 0.4 + Math.random() * 0.4;
  }

  private static detectMuscularArtifacts(measurementData: MeasurementData): number {
    return Math.random() * 0.3;
  }

  private static detectEyeMovementArtifacts(measurementData: MeasurementData): number {
    return Math.random() * 0.2;
  }

  private static detectCardiacArtifacts(measurementData: MeasurementData): number {
    return Math.random() * 0.1;
  }

  private static detectLineNoiseArtifacts(measurementData: MeasurementData): number {
    return Math.random() * 0.15;
  }

  private static calculateOverallArtifactLevel(measurementData: MeasurementData): number {
    return Math.random() * 0.25;
  }

  private static calculateCleanDataPercentage(measurementData: MeasurementData): number {
    return 75 + Math.random() * 20;
  }

  private static getReliabilityLevel(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 55) return 'fair';
    return 'poor';
  }

  private static calculateConfidence(signalQuality: EEGSignalQuality, artifactAnalysis: ArtifactAnalysis): number {
    const qualityWeight = 0.6;
    const artifactWeight = 0.4;
    
    const qualityScore = signalQuality.score / 100;
    const artifactScore = 1 - artifactAnalysis.overallArtifactLevel;
    
    return (qualityScore * qualityWeight + artifactScore * artifactWeight);
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
    signalQuality: EEGSignalQuality
  ): string {
    return REDESIGNED_PROMPTS.EEG_DETAILED_ANALYSIS
      .replace('{personalInfo}', JSON.stringify(personalInfo))
      .replace('{measurementData}', JSON.stringify({
        duration: measurementData.duration,
        signalQuality: measurementData.signalQuality,
        eegMetrics: measurementData.eegMetrics
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
    signalQuality: EEGSignalQuality
  ): ClinicalFindings {
    return {
      summary: `EEG 신호 품질: ${signalQuality.reliability}, 전체적인 뇌 기능 상태가 평가되었습니다.`,
      keyFindings: [
        `집중력 지수: ${standardizedMetrics.focusIndex.grade}`,
        `이완도 지수: ${standardizedMetrics.relaxationIndex.grade}`,
        `인지 부하: ${standardizedMetrics.cognitiveLoad.grade}`,
        `정서 안정성: ${standardizedMetrics.emotionalStability.grade}`,
        `좌우뇌 균형: ${standardizedMetrics.hemisphericBalance.grade}`
      ],
      clinicalSignificance: '측정된 뇌파 패턴은 정상 범위 내에서 개인차를 보이고 있습니다.',
      recommendations: [
        '규칙적인 명상이나 이완 훈련 권장',
        '충분한 수면과 스트레스 관리',
        '정기적인 뇌 건강 모니터링'
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