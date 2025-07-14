/**
 * 정신건강 위험도 분석 서비스 (Mental Health Risk Analysis Service)
 * 
 * 재설계된 아키텍처 - 2차 분석 단계
 * - EEG/PPG 상세 분석 결과를 기반으로 정신건강 위험도 평가
 * - 5가지 위험도: 우울, ADHD/주의력, 번아웃, 충동성, 스트레스
 * - 표준화된 점수 체계 적용 (성별/나이별 기준값)
 * - AI 프롬프트 기반 종합 위험도 분석
 */

import { APIKeyManager } from '../../../services/APIKeyManager';
import { PersonalInfo, MeasurementData } from '../types/index';
import { 
  MentalHealthRiskAnalysis,
  EEGDetailedAnalysis,
  PPGDetailedAnalysis,
  DepressionRiskAssessment,
  ADHDFocusRiskAssessment,
  BurnoutRiskAssessment,
  ImpulsivityRiskAssessment,
  StressRiskAssessment,
  StandardizedScore
} from '../types/redesigned-architecture';
import { REDESIGNED_PROMPTS } from '../prompts/redesigned-prompts';
import { ScoreNormalizationService } from './ScoreNormalizationService';
import { JSONSanitizer } from '../utils/JSONSanitizer';
import { ResponseValidator } from '../utils/ResponseValidator';

export class MentalHealthRiskAnalysisService {
  private static readonly API_KEY_ID = 'gemini-api';
  private static readonly API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
  
  private static readonly CONFIG = {
    model: 'gemini-2.5-flash',
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 120000 // 2분 타임아웃 (종합 정신건강 분석)
  };

  private static scoreNormalizationService = ScoreNormalizationService.getInstance();

  /**
   * 종합 정신건강 위험도 분석 수행
   */
  static async assessMentalHealthRisks(
    eegAnalysis: EEGDetailedAnalysis,
    ppgAnalysis: PPGDetailedAnalysis,
    personalInfo: PersonalInfo
  ): Promise<MentalHealthRiskAnalysis> {
    try {
      console.log('🧠 정신건강 위험도 분석 시작...');
      console.log('⏱️ 예상 소요 시간: 약 30-45초');

      // 1단계: 개별 위험도 분석 (병렬 실행)
      console.log('📊 개별 위험도 분석 병렬 실행...');
      const analysisPromises = [
        this.assessDepressionRisk(eegAnalysis, ppgAnalysis, personalInfo),
        this.assessADHDRisk(eegAnalysis, ppgAnalysis, personalInfo),
        this.assessBurnoutRisk(eegAnalysis, ppgAnalysis, personalInfo),
        this.assessImpulsivityRisk(eegAnalysis, ppgAnalysis, personalInfo),
        this.assessStressRisk(eegAnalysis, ppgAnalysis, personalInfo)
      ];

      const [
        depressionRisk,
        adhdFocusRisk,
        burnoutRisk,
        impulsivityRisk,
        stressRisk
      ] = await Promise.all(analysisPromises) as [
        DepressionRiskAssessment,
        ADHDFocusRiskAssessment,
        BurnoutRiskAssessment,
        ImpulsivityRiskAssessment,
        StressRiskAssessment
      ];

      console.log('✅ 개별 위험도 분석 완료');

      // 2단계: AI 기반 종합 정신건강 위험도 분석
      console.log('🤖 AI 기반 종합 정신건강 위험도 분석...');
      const comprehensiveAnalysis = await this.generateComprehensiveMentalHealthAnalysis(
        eegAnalysis,
        ppgAnalysis,
        personalInfo,
        {
          depressionRisk,
          adhdFocusRisk,
          burnoutRisk,
          impulsivityRisk,
          stressRisk
        }
      );

      // 3단계: 전체 정신건강 점수 계산
      const overallMentalHealthScore = await this.calculateOverallMentalHealthScore(
        depressionRisk,
        adhdFocusRisk,
        burnoutRisk,
        impulsivityRisk,
        stressRisk,
        personalInfo
      );

      // 4단계: 위험 요소 및 보호 요소 분석
      const { riskFactors, protectiveFactors } = this.analyzeRiskAndProtectiveFactors(
        depressionRisk,
        adhdFocusRisk,
        burnoutRisk,
        impulsivityRisk,
        stressRisk,
        eegAnalysis,
        ppgAnalysis
      );

      // 5단계: 개인 맞춤형 권고사항 생성
      const recommendations = this.generatePersonalizedRecommendations(
        personalInfo,
        depressionRisk,
        adhdFocusRisk,
        burnoutRisk,
        impulsivityRisk,
        stressRisk,
        overallMentalHealthScore
      );

      const result: MentalHealthRiskAnalysis = {
        depressionRisk,
        adhdFocusRisk,
        burnoutRisk,
        impulsivityRisk,
        stressRisk,
        overallMentalHealthScore,
        riskFactors,
        protectiveFactors,
        recommendations,
        analysisTimestamp: Date.now(),
        confidence: this.calculateOverallConfidence([
          depressionRisk.confidence,
          adhdFocusRisk.confidence,
          burnoutRisk.confidence,
          impulsivityRisk.confidence,
          stressRisk.confidence
        ]),
        clinicalValidation: true
      };

      console.log('✅ 정신건강 위험도 분석 완료');
      return result;

    } catch (error) {
      console.error('❌ 정신건강 위험도 분석 실패:', error);
      throw new Error(`정신건강 위험도 분석 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * 우울 위험도 평가
   */
  static async assessDepressionRisk(
    eegAnalysis: EEGDetailedAnalysis,
    ppgAnalysis: PPGDetailedAnalysis,
    personalInfo: PersonalInfo
  ): Promise<DepressionRiskAssessment> {
    // 생체신호 기반 우울 지표 계산
    const biomarkers = this.calculateDepressionBiomarkers(eegAnalysis, ppgAnalysis);
    
    // 원본 위험도 점수 계산 (0-100)
    const rawScore = this.calculateDepressionRawScore(biomarkers, personalInfo);
    
    // 표준화된 점수 생성
    const score = await this.scoreNormalizationService.normalizeScore(
      rawScore,
      'depressionRisk',
      personalInfo.gender as 'male' | 'female',
      this.calculateAge(personalInfo)
    );

    // 위험도 수준 결정
    const riskLevel = this.determineRiskLevel(score.percentile);
    
    // 신뢰도 계산
    const confidence = this.calculateConfidence(eegAnalysis.confidence, ppgAnalysis.confidence);

    // 우울 지표 분석
    const moodIndicators = this.analyzeMoodIndicators(biomarkers, eegAnalysis, ppgAnalysis);
    const neurobiologicalMarkers = this.analyzeDepressionNeurobiologicalMarkers(biomarkers);

    return {
      riskLevel,
      score,
      confidence,
      indicators: this.generateDepressionIndicators(biomarkers, eegAnalysis, ppgAnalysis),
      clinicalNotes: this.generateDepressionClinicalNotes(score, biomarkers, personalInfo),
      severity: this.determineSeverity(score.percentile),
      urgency: this.determineUrgency(score.percentile, riskLevel),
      moodIndicators,
      neurobiologicalMarkers
    };
  }

  /**
   * ADHD/주의력 위험도 평가
   */
  static async assessADHDRisk(
    eegAnalysis: EEGDetailedAnalysis,
    ppgAnalysis: PPGDetailedAnalysis,
    personalInfo: PersonalInfo
  ): Promise<ADHDFocusRiskAssessment> {
    // 생체신호 기반 ADHD 지표 계산
    const biomarkers = this.calculateADHDBiomarkers(eegAnalysis, ppgAnalysis);
    
    // 원본 위험도 점수 계산
    const rawScore = this.calculateADHDRawScore(biomarkers, personalInfo);
    
    // 표준화된 점수 생성
    const score = await this.scoreNormalizationService.normalizeScore(
      rawScore,
      'adhdRisk',
      personalInfo.gender as 'male' | 'female',
      this.calculateAge(personalInfo)
    );

    const riskLevel = this.determineRiskLevel(score.percentile);
    const confidence = this.calculateConfidence(eegAnalysis.confidence, ppgAnalysis.confidence);

    // ADHD 특이적 지표 분석
    const attentionIndicators = this.analyzeAttentionIndicators(biomarkers, eegAnalysis);
    const neurobiologicalMarkers = this.analyzeADHDNeurobiologicalMarkers(biomarkers);

    return {
      riskLevel,
      score,
      confidence,
      indicators: this.generateADHDIndicators(biomarkers, eegAnalysis, ppgAnalysis),
      clinicalNotes: this.generateADHDClinicalNotes(score, biomarkers, personalInfo),
      severity: this.determineSeverity(score.percentile),
      urgency: this.determineUrgency(score.percentile, riskLevel),
      attentionIndicators,
      neurobiologicalMarkers
    };
  }

  /**
   * 번아웃 위험도 평가
   */
  static async assessBurnoutRisk(
    eegAnalysis: EEGDetailedAnalysis,
    ppgAnalysis: PPGDetailedAnalysis,
    personalInfo: PersonalInfo
  ): Promise<BurnoutRiskAssessment> {
    // 생체신호 기반 번아웃 지표 계산
    const biomarkers = this.calculateBurnoutBiomarkers(eegAnalysis, ppgAnalysis);
    
    // 원본 위험도 점수 계산 (직업별 가중치 적용)
    const rawScore = this.calculateBurnoutRawScore(biomarkers, personalInfo);
    
    // 표준화된 점수 생성
    let score = await this.scoreNormalizationService.normalizeScore(
      rawScore,
      'burnoutRisk',
      personalInfo.gender as 'male' | 'female',
      this.calculateAge(personalInfo)
    );

    // 직업별 가중치 적용
    score = this.scoreNormalizationService.applyOccupationalAdjustment(score, personalInfo.occupation);

    const riskLevel = this.determineRiskLevel(score.percentile);
    const confidence = this.calculateConfidence(eegAnalysis.confidence, ppgAnalysis.confidence);

    // 번아웃 특이적 지표 분석
    const burnoutDimensions = this.analyzeBurnoutDimensions(biomarkers, personalInfo);
    const physiologicalMarkers = this.analyzeBurnoutPhysiologicalMarkers(biomarkers);

    return {
      riskLevel,
      score,
      confidence,
      indicators: this.generateBurnoutIndicators(biomarkers, eegAnalysis, ppgAnalysis),
      clinicalNotes: this.generateBurnoutClinicalNotes(score, biomarkers, personalInfo),
      severity: this.determineSeverity(score.percentile),
      urgency: this.determineUrgency(score.percentile, riskLevel),
      burnoutDimensions,
      physiologicalMarkers
    };
  }

  /**
   * 충동성 위험도 평가
   */
  static async assessImpulsivityRisk(
    eegAnalysis: EEGDetailedAnalysis,
    ppgAnalysis: PPGDetailedAnalysis,
    personalInfo: PersonalInfo
  ): Promise<ImpulsivityRiskAssessment> {
    // 생체신호 기반 충동성 지표 계산
    const biomarkers = this.calculateImpulsivityBiomarkers(eegAnalysis, ppgAnalysis);
    
    // 원본 위험도 점수 계산
    const rawScore = this.calculateImpulsivityRawScore(biomarkers, personalInfo);
    
    // 표준화된 점수 생성
    const score = await this.scoreNormalizationService.normalizeScore(
      rawScore,
      'impulsivityRisk',
      personalInfo.gender as 'male' | 'female',
      this.calculateAge(personalInfo)
    );

    const riskLevel = this.determineRiskLevel(score.percentile);
    const confidence = this.calculateConfidence(eegAnalysis.confidence, ppgAnalysis.confidence);

    // 충동성 특이적 지표 분석
    const impulsivityTypes = this.analyzeImpulsivityTypes(biomarkers, eegAnalysis);
    const neurobiologicalMarkers = this.analyzeImpulsivityNeurobiologicalMarkers(biomarkers);

    return {
      riskLevel,
      score,
      confidence,
      indicators: this.generateImpulsivityIndicators(biomarkers, eegAnalysis, ppgAnalysis),
      clinicalNotes: this.generateImpulsivityClinicalNotes(score, biomarkers, personalInfo),
      severity: this.determineSeverity(score.percentile),
      urgency: this.determineUrgency(score.percentile, riskLevel),
      impulsivityTypes,
      neurobiologicalMarkers
    };
  }

  /**
   * 스트레스 위험도 평가 (기존 StressAnalysisService 로직 통합)
   */
  static async assessStressRisk(
    eegAnalysis: EEGDetailedAnalysis,
    ppgAnalysis: PPGDetailedAnalysis,
    personalInfo: PersonalInfo
  ): Promise<StressRiskAssessment> {
    // 생체신호 기반 스트레스 지표 계산
    const biomarkers = this.calculateStressBiomarkers(eegAnalysis, ppgAnalysis);
    
    // 원본 위험도 점수 계산
    const rawScore = this.calculateStressRawScore(biomarkers, personalInfo);
    
    // 표준화된 점수 생성
    const mainScore = await this.scoreNormalizationService.normalizeScore(
      rawScore,
      'stressRisk',
      personalInfo.gender as 'male' | 'female',
      this.calculateAge(personalInfo)
    );

    // 기존 스트레스 분석과의 호환성을 위한 세부 점수들
    const stressIndex = await this.scoreNormalizationService.normalizeScore(
      biomarkers.stressIndex,
      'stressIndex',
      personalInfo.gender as 'male' | 'female',
      this.calculateAge(personalInfo)
    );

    const autonomicBalance = await this.scoreNormalizationService.normalizeScore(
      biomarkers.autonomicBalance * 100,
      'autonomicBalance',
      personalInfo.gender as 'male' | 'female',
      this.calculateAge(personalInfo)
    );

    const fatigueLevel = await this.scoreNormalizationService.normalizeScore(
      biomarkers.fatigueLevel,
      'fatigueLevel',
      personalInfo.gender as 'male' | 'female',
      this.calculateAge(personalInfo)
    );

    const resilience = await this.scoreNormalizationService.normalizeScore(
      biomarkers.resilience,
      'resilience',
      personalInfo.gender as 'male' | 'female',
      this.calculateAge(personalInfo)
    );

    const riskLevel = this.determineRiskLevel(mainScore.percentile);
    const confidence = this.calculateConfidence(eegAnalysis.confidence, ppgAnalysis.confidence);

    // 스트레스 특이적 지표 분석
    const stressTypes = this.analyzeStressTypes(biomarkers, eegAnalysis, ppgAnalysis);
    const physiologicalMarkers = this.analyzeStressPhysiologicalMarkers(biomarkers);

    return {
      riskLevel,
      score: mainScore,
      confidence,
      indicators: this.generateStressIndicators(biomarkers, eegAnalysis, ppgAnalysis),
      clinicalNotes: this.generateStressClinicalNotes(mainScore, biomarkers, personalInfo),
      severity: this.determineSeverity(mainScore.percentile),
      urgency: this.determineUrgency(mainScore.percentile, riskLevel),
      stressTypes,
      physiologicalMarkers,
      // 기존 호환성 유지
      stressIndex,
      autonomicBalance,
      fatigueLevel,
      resilience
    };
  }

  /**
   * AI 기반 종합 정신건강 위험도 분석
   */
  private static async generateComprehensiveMentalHealthAnalysis(
    eegAnalysis: EEGDetailedAnalysis,
    ppgAnalysis: PPGDetailedAnalysis,
    personalInfo: PersonalInfo,
    individualRisks: {
      depressionRisk: DepressionRiskAssessment;
      adhdFocusRisk: ADHDFocusRiskAssessment;
      burnoutRisk: BurnoutRiskAssessment;
      impulsivityRisk: ImpulsivityRiskAssessment;
      stressRisk: StressRiskAssessment;
    }
  ): Promise<any> {
    const maxRetries = this.CONFIG.maxRetries;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 AI 종합 정신건강 분석 시도 ${attempt}/${maxRetries}`);

        const prompt = this.generateMentalHealthRiskPrompt(
          eegAnalysis,
          ppgAnalysis,
          personalInfo,
          individualRisks
        );

        const response = await this.makeRequest(prompt);
        const result = await this.parseMentalHealthRiskResponse(response, attempt);

        console.log(`✅ AI 종합 정신건강 분석 성공 (시도 ${attempt})`);
        return result;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`❌ AI 종합 정신건강 분석 시도 ${attempt} 실패:`, lastError.message);

        if (attempt < maxRetries) {
          const waitTime = attempt * this.CONFIG.retryDelay;
          console.log(`⏳ ${waitTime}ms 대기 후 재시도...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // 모든 시도 실패 시 기본 분석 제공
    console.warn('⚠️ AI 종합 정신건강 분석 실패, 기본 분석 제공');
    return this.createFallbackMentalHealthAnalysis(individualRisks, personalInfo);
  }

  /**
   * 정신건강 위험도 분석 프롬프트 생성
   */
  private static generateMentalHealthRiskPrompt(
    eegAnalysis: EEGDetailedAnalysis,
    ppgAnalysis: PPGDetailedAnalysis,
    personalInfo: PersonalInfo,
    individualRisks: any
  ): string {
    const age = this.calculateAge(personalInfo);
    const genderText = personalInfo.gender === 'male' ? '남성' : '여성';

    return REDESIGNED_PROMPTS.MENTAL_HEALTH_RISK_ANALYSIS
      .replace(/\$\{age\}/g, age.toString())
      .replace(/\$\{genderText\}/g, genderText)
      .replace(/\$\{personalInfo\.gender\}/g, personalInfo.gender)
      .replace(/\$\{personalInfo\.occupation\}/g, personalInfo.occupation)
      .replace(/\$\{Date\.now\(\)\}/g, Date.now().toString()) +
      `

## 제공된 분석 데이터

### 개인 정보
- 나이: ${age}세
- 성별: ${genderText}
- 직업: ${personalInfo.occupation}

### EEG 상세 분석 결과
${JSON.stringify(eegAnalysis, null, 2)}

### PPG 상세 분석 결과
${JSON.stringify(ppgAnalysis, null, 2)}

### 개별 위험도 분석 결과
${JSON.stringify(individualRisks, null, 2)}

위 데이터를 종합하여 정신건강 위험도를 분석하고 JSON 형식으로 응답해주세요.`;
  }

  // ============================================================================
  // 유틸리티 메서드들
  // ============================================================================

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
    
    return 30; // 기본값
  }

  /**
   * 위험도 수준 결정
   */
  private static determineRiskLevel(percentile: number): 'low' | 'moderate' | 'high' | 'critical' {
    if (percentile >= 95) return 'critical';
    if (percentile >= 75) return 'high';
    if (percentile >= 25) return 'moderate';
    return 'low';
  }

  /**
   * 심각도 결정
   */
  private static determineSeverity(percentile: number): 'mild' | 'moderate' | 'severe' {
    if (percentile >= 90) return 'severe';
    if (percentile >= 70) return 'moderate';
    return 'mild';
  }

  /**
   * 긴급도 결정
   */
  private static determineUrgency(percentile: number, riskLevel: string): 'routine' | 'priority' | 'urgent' {
    if (riskLevel === 'critical' || percentile >= 95) return 'urgent';
    if (riskLevel === 'high' || percentile >= 85) return 'priority';
    return 'routine';
  }

  /**
   * 신뢰도 계산
   */
  private static calculateConfidence(eegConfidence: number, ppgConfidence: number): number {
    return (eegConfidence + ppgConfidence) / 2;
  }

  /**
   * 전체 신뢰도 계산
   */
  private static calculateOverallConfidence(confidences: number[]): number {
    return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  }

  /**
   * 전체 정신건강 점수 계산
   */
  private static async calculateOverallMentalHealthScore(
    depressionRisk: DepressionRiskAssessment,
    adhdFocusRisk: ADHDFocusRiskAssessment,
    burnoutRisk: BurnoutRiskAssessment,
    impulsivityRisk: ImpulsivityRiskAssessment,
    stressRisk: StressRiskAssessment,
    personalInfo: PersonalInfo
  ): Promise<StandardizedScore> {
    // 위험도 점수들을 건강 점수로 변환 (100 - 위험도)
    const healthScores = [
      { score: this.convertRiskToHealthScore(depressionRisk.score), weight: 0.25 },
      { score: this.convertRiskToHealthScore(adhdFocusRisk.score), weight: 0.20 },
      { score: this.convertRiskToHealthScore(burnoutRisk.score), weight: 0.25 },
      { score: this.convertRiskToHealthScore(impulsivityRisk.score), weight: 0.15 },
      { score: this.convertRiskToHealthScore(stressRisk.score), weight: 0.15 }
    ];

    return this.scoreNormalizationService.calculateWeightedAverage(healthScores);
  }

  /**
   * 위험도 점수를 건강 점수로 변환
   */
  private static convertRiskToHealthScore(riskScore: StandardizedScore): StandardizedScore {
    return {
      raw: 100 - riskScore.raw,
      standardized: 100 - riskScore.standardized,
      percentile: 100 - riskScore.percentile,
      grade: riskScore.grade,
      gradeDescription: `정신건강 ${riskScore.gradeDescription}`,
      ageGenderAdjusted: riskScore.ageGenderAdjusted
    };
  }

  // ============================================================================
  // 생체신호 기반 바이오마커 계산 메서드들
  // ============================================================================

  /**
   * 우울 바이오마커 계산
   */
  private static calculateDepressionBiomarkers(
    eegAnalysis: EEGDetailedAnalysis,
    ppgAnalysis: PPGDetailedAnalysis
  ): any {
    return {
      alphaAsymmetry: this.calculateAlphaAsymmetry(eegAnalysis),
      thetaActivity: this.calculateThetaActivity(eegAnalysis),
      hrvDepression: this.calculateHRVDepression(ppgAnalysis),
      autonomicImbalance: this.calculateAutonomicImbalance(ppgAnalysis),
      emotionalStability: eegAnalysis.emotionalStability.raw,
      heartRateVariability: ppgAnalysis.hrvScore.raw
    };
  }

  /**
   * ADHD 바이오마커 계산
   */
  private static calculateADHDBiomarkers(
    eegAnalysis: EEGDetailedAnalysis,
    ppgAnalysis: PPGDetailedAnalysis
  ): any {
    return {
      thetaBetaRatio: this.calculateThetaBetaRatio(eegAnalysis),
      focusStability: eegAnalysis.focusIndex.raw,
      attentionControl: this.calculateAttentionControl(eegAnalysis),
      autonomicRegulation: ppgAnalysis.autonomicBalanceScore.raw,
      cognitiveLoad: eegAnalysis.cognitiveLoad.raw,
      variability: this.calculateVariability(ppgAnalysis)
    };
  }

  /**
   * 번아웃 바이오마커 계산
   */
  private static calculateBurnoutBiomarkers(
    eegAnalysis: EEGDetailedAnalysis,
    ppgAnalysis: PPGDetailedAnalysis
  ): any {
    return {
      mentalFatigue: this.calculateMentalFatigue(eegAnalysis),
      chronicStress: this.calculateChronicStress(ppgAnalysis),
      recoveryCapacity: this.calculateRecoveryCapacity(ppgAnalysis),
      emotionalExhaustion: this.calculateEmotionalExhaustion(eegAnalysis),
      physicalFatigue: this.calculatePhysicalFatigue(ppgAnalysis),
      resilience: this.calculateResilience(eegAnalysis, ppgAnalysis)
    };
  }

  /**
   * 충동성 바이오마커 계산
   */
  private static calculateImpulsivityBiomarkers(
    eegAnalysis: EEGDetailedAnalysis,
    ppgAnalysis: PPGDetailedAnalysis
  ): any {
    return {
      inhibitoryControl: this.calculateInhibitoryControl(eegAnalysis),
      impulsiveReactivity: this.calculateImpulsiveReactivity(ppgAnalysis),
      prefrontalActivity: this.calculatePrefrontalActivity(eegAnalysis),
      arousalLevel: this.calculateArousalLevel(ppgAnalysis),
      behavioralControl: this.calculateBehavioralControl(eegAnalysis),
      rewardSensitivity: this.calculateRewardSensitivity(ppgAnalysis)
    };
  }

  /**
   * 스트레스 바이오마커 계산
   */
  private static calculateStressBiomarkers(
    eegAnalysis: EEGDetailedAnalysis,
    ppgAnalysis: PPGDetailedAnalysis
  ): any {
    return {
      stressIndex: this.calculateStressIndex(eegAnalysis, ppgAnalysis),
      autonomicBalance: this.calculateAutonomicBalanceRatio(ppgAnalysis),
      fatigueLevel: this.calculateFatigueLevel(eegAnalysis, ppgAnalysis),
      resilience: this.calculateResilience(eegAnalysis, ppgAnalysis),
      cortisol: this.calculateCortisolIndicator(eegAnalysis, ppgAnalysis),
      inflammation: this.calculateInflammationIndicator(ppgAnalysis)
    };
  }

  // ============================================================================
  // 구체적인 계산 메서드들 (실제 생체신호 데이터 기반)
  // ============================================================================

  private static calculateAlphaAsymmetry(eegAnalysis: EEGDetailedAnalysis): number {
    // 좌우 반구 알파파 비대칭성 계산
    const asymmetry = eegAnalysis.frequencyAnalysis.alpha.asymmetry;
    return Math.abs(asymmetry) * 100; // 0-100 범위로 정규화
  }

  private static calculateThetaActivity(eegAnalysis: EEGDetailedAnalysis): number {
    // 세타파 활동도 계산
    return eegAnalysis.frequencyAnalysis.theta.relativePower * 100;
  }

  private static calculateHRVDepression(ppgAnalysis: PPGDetailedAnalysis): number {
    // HRV 기반 우울 지표 계산
    const rmssd = ppgAnalysis.heartRateVariability.timeDomain.rmssd;
    const sdnn = ppgAnalysis.heartRateVariability.timeDomain.sdnn;
    return Math.max(0, 100 - (rmssd + sdnn) / 2); // 낮을수록 우울 위험 증가
  }

  private static calculateAutonomicImbalance(ppgAnalysis: PPGDetailedAnalysis): number {
    // 자율신경 불균형 계산
    const lfHfRatio = ppgAnalysis.heartRateVariability.frequencyDomain.lfHfRatio;
    const idealRatio = 1.5; // 이상적인 LF/HF 비율
    return Math.abs(lfHfRatio - idealRatio) * 50; // 0-100 범위
  }

  private static calculateThetaBetaRatio(eegAnalysis: EEGDetailedAnalysis): number {
    // 세타/베타 비율 계산 (ADHD 지표)
    const thetaPower = eegAnalysis.frequencyAnalysis.theta.relativePower;
    const betaPower = eegAnalysis.frequencyAnalysis.beta.relativePower;
    return (thetaPower / betaPower) * 100;
  }

  private static calculateAttentionControl(eegAnalysis: EEGDetailedAnalysis): number {
    // 주의력 조절 능력 계산
    const focusIndex = eegAnalysis.focusIndex.raw;
    const cognitiveLoad = eegAnalysis.cognitiveLoad.raw;
    return Math.max(0, focusIndex - cognitiveLoad); // 집중력 - 인지부하
  }

  private static calculateMentalFatigue(eegAnalysis: EEGDetailedAnalysis): number {
    // 정신적 피로도 계산
    const alphaPower = eegAnalysis.frequencyAnalysis.alpha.relativePower;
    const betaPower = eegAnalysis.frequencyAnalysis.beta.relativePower;
    return Math.max(0, 100 - (alphaPower * 100) + (betaPower * 50));
  }

  private static calculateChronicStress(ppgAnalysis: PPGDetailedAnalysis): number {
    // 만성 스트레스 지표 계산
    const hrvScore = ppgAnalysis.hrvScore.raw;
    const autonomicBalance = ppgAnalysis.autonomicBalanceScore.raw;
    return Math.max(0, 100 - (hrvScore + autonomicBalance) / 2);
  }

  private static calculateRecoveryCapacity(ppgAnalysis: PPGDetailedAnalysis): number {
    // 회복 능력 계산
    const cardiovascularFitness = ppgAnalysis.cardiovascularFitnessScore.raw;
    const heartRateVariability = ppgAnalysis.hrvScore.raw;
    return (cardiovascularFitness + heartRateVariability) / 2;
  }

  private static calculateEmotionalExhaustion(eegAnalysis: EEGDetailedAnalysis): number {
    // 정서적 소진 계산
    const emotionalStability = eegAnalysis.emotionalStability.raw;
    return Math.max(0, 100 - emotionalStability);
  }

  private static calculatePhysicalFatigue(ppgAnalysis: PPGDetailedAnalysis): number {
    // 신체적 피로도 계산
    const cardiovascularFitness = ppgAnalysis.cardiovascularFitnessScore.raw;
    const heartRateScore = ppgAnalysis.heartRateScore.raw;
    return Math.max(0, 100 - (cardiovascularFitness + heartRateScore) / 2);
  }

  private static calculateResilience(eegAnalysis: EEGDetailedAnalysis, ppgAnalysis: PPGDetailedAnalysis): number {
    // 회복탄력성 계산
    const emotionalStability = eegAnalysis.emotionalStability.raw;
    const recoveryCapacity = this.calculateRecoveryCapacity(ppgAnalysis);
    return (emotionalStability + recoveryCapacity) / 2;
  }

  private static calculateInhibitoryControl(eegAnalysis: EEGDetailedAnalysis): number {
    // 억제 조절 능력 계산
    const hemisphericBalance = eegAnalysis.hemisphericBalance.raw;
    const focusIndex = eegAnalysis.focusIndex.raw;
    return (hemisphericBalance + focusIndex) / 2;
  }

  private static calculateImpulsiveReactivity(ppgAnalysis: PPGDetailedAnalysis): number {
    // 충동적 반응성 계산
    const autonomicBalance = ppgAnalysis.autonomicBalanceScore.raw;
    return Math.max(0, 100 - autonomicBalance);
  }

  private static calculatePrefrontalActivity(eegAnalysis: EEGDetailedAnalysis): number {
    // 전두엽 활동 계산
    const betaPower = eegAnalysis.frequencyAnalysis.beta.relativePower;
    const gammaPower = eegAnalysis.frequencyAnalysis.gamma.relativePower;
    return (betaPower + gammaPower) * 50;
  }

  private static calculateArousalLevel(ppgAnalysis: PPGDetailedAnalysis): number {
    // 각성 수준 계산
    const heartRate = ppgAnalysis.heartRateScore.raw;
    const autonomicBalance = ppgAnalysis.autonomicBalanceScore.raw;
    return Math.abs(heartRate - autonomicBalance);
  }

  private static calculateBehavioralControl(eegAnalysis: EEGDetailedAnalysis): number {
    // 행동 조절 능력 계산
    const focusIndex = eegAnalysis.focusIndex.raw;
    const emotionalStability = eegAnalysis.emotionalStability.raw;
    return (focusIndex + emotionalStability) / 2;
  }

  private static calculateRewardSensitivity(ppgAnalysis: PPGDetailedAnalysis): number {
    // 보상 민감성 계산
    const cardiovascularFitness = ppgAnalysis.cardiovascularFitnessScore.raw;
    return Math.max(0, 100 - cardiovascularFitness);
  }

  private static calculateStressIndex(eegAnalysis: EEGDetailedAnalysis, ppgAnalysis: PPGDetailedAnalysis): number {
    // 종합 스트레스 지수 계산
    const betaPower = eegAnalysis.frequencyAnalysis.beta.relativePower * 100;
    const hrvStress = Math.max(0, 100 - ppgAnalysis.hrvScore.raw);
    return (betaPower + hrvStress) / 2;
  }

  private static calculateAutonomicBalanceRatio(ppgAnalysis: PPGDetailedAnalysis): number {
    // 자율신경 균형 비율
    return ppgAnalysis.autonomicBalanceScore.raw / 100; // 0-1 범위로 정규화
  }

  private static calculateFatigueLevel(eegAnalysis: EEGDetailedAnalysis, ppgAnalysis: PPGDetailedAnalysis): number {
    // 피로 수준 계산
    const mentalFatigue = this.calculateMentalFatigue(eegAnalysis);
    const physicalFatigue = this.calculatePhysicalFatigue(ppgAnalysis);
    return (mentalFatigue + physicalFatigue) / 2;
  }

  private static calculateCortisolIndicator(eegAnalysis: EEGDetailedAnalysis, ppgAnalysis: PPGDetailedAnalysis): number {
    // 코티솔 지표 계산 (추정)
    const stressIndex = this.calculateStressIndex(eegAnalysis, ppgAnalysis);
    const autonomicImbalance = this.calculateAutonomicImbalance(ppgAnalysis);
    return (stressIndex + autonomicImbalance) / 2;
  }

  private static calculateInflammationIndicator(ppgAnalysis: PPGDetailedAnalysis): number {
    // 염증 지표 계산 (추정)
    const hrvScore = ppgAnalysis.hrvScore.raw;
    const cardiovascularFitness = ppgAnalysis.cardiovascularFitnessScore.raw;
    return Math.max(0, 100 - (hrvScore + cardiovascularFitness) / 2);
  }

  private static calculateVariability(ppgAnalysis: PPGDetailedAnalysis): number {
    // 변동성 계산
    return ppgAnalysis.heartRateVariability.timeDomain.hrVariability * 100;
  }

  // ============================================================================
  // 위험도 점수 계산 메서드들
  // ============================================================================

  /**
   * 우울 위험도 원본 점수 계산
   */
  private static calculateDepressionRawScore(biomarkers: any, personalInfo: PersonalInfo): number {
    const weights = {
      alphaAsymmetry: 0.25,
      thetaActivity: 0.20,
      hrvDepression: 0.25,
      autonomicImbalance: 0.15,
      emotionalStability: 0.15
    };

    let score = 0;
    score += biomarkers.alphaAsymmetry * weights.alphaAsymmetry;
    score += biomarkers.thetaActivity * weights.thetaActivity;
    score += biomarkers.hrvDepression * weights.hrvDepression;
    score += biomarkers.autonomicImbalance * weights.autonomicImbalance;
    score += (100 - biomarkers.emotionalStability) * weights.emotionalStability;

    // 성별/연령별 조정
    const age = this.calculateAge(personalInfo);
    if (personalInfo.gender === 'female') score += 3; // 여성 우울 위험 약간 높음
    if (age > 40) score += 2; // 40세 이상 위험 증가

    return Math.max(0, Math.min(100, score));
  }

  /**
   * ADHD 위험도 원본 점수 계산
   */
  private static calculateADHDRawScore(biomarkers: any, personalInfo: PersonalInfo): number {
    const weights = {
      thetaBetaRatio: 0.30,
      focusStability: 0.25,
      attentionControl: 0.20,
      autonomicRegulation: 0.15,
      cognitiveLoad: 0.10
    };

    let score = 0;
    score += biomarkers.thetaBetaRatio * weights.thetaBetaRatio;
    score += (100 - biomarkers.focusStability) * weights.focusStability;
    score += (100 - biomarkers.attentionControl) * weights.attentionControl;
    score += (100 - biomarkers.autonomicRegulation) * weights.autonomicRegulation;
    score += biomarkers.cognitiveLoad * weights.cognitiveLoad;

    // 성별 조정 (남성이 ADHD 위험 더 높음)
    if (personalInfo.gender === 'male') score += 4;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 번아웃 위험도 원본 점수 계산
   */
  private static calculateBurnoutRawScore(biomarkers: any, personalInfo: PersonalInfo): number {
    const weights = {
      mentalFatigue: 0.25,
      chronicStress: 0.25,
      recoveryCapacity: 0.20,
      emotionalExhaustion: 0.20,
      physicalFatigue: 0.10
    };

    let score = 0;
    score += biomarkers.mentalFatigue * weights.mentalFatigue;
    score += biomarkers.chronicStress * weights.chronicStress;
    score += (100 - biomarkers.recoveryCapacity) * weights.recoveryCapacity;
    score += biomarkers.emotionalExhaustion * weights.emotionalExhaustion;
    score += biomarkers.physicalFatigue * weights.physicalFatigue;

    // 연령별 조정 (40대가 번아웃 위험 최고)
    const age = this.calculateAge(personalInfo);
    if (age >= 40 && age < 50) score += 5;
    else if (age >= 30 && age < 40) score += 3;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 충동성 위험도 원본 점수 계산
   */
  private static calculateImpulsivityRawScore(biomarkers: any, personalInfo: PersonalInfo): number {
    const weights = {
      inhibitoryControl: 0.30,
      impulsiveReactivity: 0.25,
      prefrontalActivity: 0.20,
      arousalLevel: 0.15,
      behavioralControl: 0.10
    };

    let score = 0;
    score += (100 - biomarkers.inhibitoryControl) * weights.inhibitoryControl;
    score += biomarkers.impulsiveReactivity * weights.impulsiveReactivity;
    score += (100 - biomarkers.prefrontalActivity) * weights.prefrontalActivity;
    score += biomarkers.arousalLevel * weights.arousalLevel;
    score += (100 - biomarkers.behavioralControl) * weights.behavioralControl;

    // 연령별 조정 (젊을수록 충동성 높음)
    const age = this.calculateAge(personalInfo);
    if (age < 30) score += 3;
    else if (age >= 50) score -= 2;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 스트레스 위험도 원본 점수 계산
   */
  private static calculateStressRawScore(biomarkers: any, personalInfo: PersonalInfo): number {
    const weights = {
      stressIndex: 0.30,
      autonomicBalance: 0.25,
      fatigueLevel: 0.20,
      resilience: 0.15,
      cortisol: 0.10
    };

    let score = 0;
    score += biomarkers.stressIndex * weights.stressIndex;
    score += (100 - biomarkers.autonomicBalance * 100) * weights.autonomicBalance;
    score += biomarkers.fatigueLevel * weights.fatigueLevel;
    score += (100 - biomarkers.resilience) * weights.resilience;
    score += biomarkers.cortisol * weights.cortisol;

    // 성별 조정 (여성이 스트레스 반응 더 높음)
    if (personalInfo.gender === 'female') score += 2;

    return Math.max(0, Math.min(100, score));
  }

  // ============================================================================
  // API 통신 및 응답 처리 메서드들
  // ============================================================================

  /**
   * API 요청 수행
   */
  private static async makeRequest(prompt: string): Promise<any> {
    const apiKey = APIKeyManager.getAPIKey(this.API_KEY_ID);
    if (!apiKey) {
      throw new Error('Gemini API 키가 설정되지 않았습니다.');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.CONFIG.timeout);

    try {
      const response = await fetch(
        `${this.API_BASE_URL}/${this.CONFIG.model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.3,
              topK: 40,
              topP: 0.8,
              maxOutputTokens: 8192,
            }
          }),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('API 요청 타임아웃');
      }
      
      throw error;
    }
  }

  /**
   * 정신건강 위험도 분석 응답 파싱
   */
  private static async parseMentalHealthRiskResponse(response: any, attempt: number): Promise<any> {
    try {
      const content = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        throw new Error('응답에서 콘텐츠를 찾을 수 없습니다.');
      }

      // JSON 추출 및 정제
      const sanitizedContent = JSONSanitizer.sanitizeJSON(content);
      const parsedResult = JSON.parse(sanitizedContent.sanitizedText);

      // 응답 유효성 검증
      ResponseValidator.validateMentalHealthRiskResponse(parsedResult);

      return parsedResult;

    } catch (error) {
      console.error(`정신건강 위험도 분석 응답 파싱 실패 (시도 ${attempt}):`, error);
      throw new Error(`응답 파싱 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * 폴백 정신건강 분석 생성
   */
  private static createFallbackMentalHealthAnalysis(individualRisks: any, personalInfo: PersonalInfo): any {
    return {
      overallAssessment: "생체신호 기반 정신건강 위험도 분석이 완료되었습니다.",
      keyFindings: [
        "개별 위험도 분석 결과를 종합하여 평가했습니다.",
        "전문적인 상담이 필요한 경우 전문가와 상의하시기 바랍니다."
      ],
      recommendations: [
        "규칙적인 생활 패턴 유지",
        "적절한 휴식과 수면",
        "스트레스 관리 기법 활용"
      ],
      riskSummary: "종합적인 정신건강 관리가 필요합니다.",
      confidence: 0.7
    };
  }

  // ============================================================================
  // 지표 분석 메서드들 (각 위험도별 세부 분석)
  // ============================================================================

  /**
   * 기분 지표 분석 (우울)
   */
  private static analyzeMoodIndicators(biomarkers: any, eegAnalysis: EEGDetailedAnalysis, ppgAnalysis: PPGDetailedAnalysis): any {
    return {
      lowMoodSigns: biomarkers.alphaAsymmetry > 50 ? ["전두엽 알파파 비대칭성 증가"] : [],
      anhedoniaIndicators: biomarkers.emotionalStability < 50 ? ["정서적 안정성 저하"] : [],
      energyLevelMarkers: biomarkers.hrvDepression > 60 ? ["에너지 수준 저하 징후"] : ["정상적인 에너지 수준"],
      cognitiveSymptoms: biomarkers.thetaActivity > 70 ? ["인지 기능 저하 징후"] : []
    };
  }

  /**
   * 우울 신경생물학적 마커 분석
   */
  private static analyzeDepressionNeurobiologicalMarkers(biomarkers: any): any {
    return {
      alphaAsymmetry: biomarkers.alphaAsymmetry / 100,
      betaActivity: Math.min(1, biomarkers.thetaActivity / 100),
      hrvReduction: biomarkers.hrvDepression / 100
    };
  }

  /**
   * 주의력 지표 분석 (ADHD)
   */
  private static analyzeAttentionIndicators(biomarkers: any, eegAnalysis: EEGDetailedAnalysis): any {
    return {
      focusStability: biomarkers.focusStability / 100,
      distractibility: Math.max(0, 1 - biomarkers.attentionControl / 100),
      taskPersistence: biomarkers.focusStability / 100,
      cognitiveFlexibility: eegAnalysis.hemisphericBalance.raw / 100
    };
  }

  /**
   * ADHD 신경생물학적 마커 분석
   */
  private static analyzeADHDNeurobiologicalMarkers(biomarkers: any): any {
    return {
      thetaBetaRatio: biomarkers.thetaBetaRatio / 100,
      frontolimbicActivity: biomarkers.attentionControl / 100,
      executiveFunctionMarkers: biomarkers.focusStability / 100
    };
  }

  /**
   * 번아웃 차원 분석
   */
  private static analyzeBurnoutDimensions(biomarkers: any, personalInfo: PersonalInfo): any {
    return {
      emotionalExhaustion: biomarkers.emotionalExhaustion / 100,
      depersonalization: Math.min(1, biomarkers.mentalFatigue / 100),
      personalAccomplishment: Math.max(0, 1 - biomarkers.recoveryCapacity / 100),
      cynicism: Math.min(1, biomarkers.chronicStress / 100)
    };
  }

  /**
   * 번아웃 생리학적 마커 분석
   */
  private static analyzeBurnoutPhysiologicalMarkers(biomarkers: any): any {
    return {
      chronicStressIndicators: biomarkers.chronicStress / 100,
      autonomicImbalance: Math.min(1, biomarkers.mentalFatigue / 100),
      recoveryCapacity: biomarkers.recoveryCapacity / 100
    };
  }

  /**
   * 충동성 유형 분석
   */
  private static analyzeImpulsivityTypes(biomarkers: any, eegAnalysis: EEGDetailedAnalysis): any {
    return {
      motorImpulsivity: Math.min(1, biomarkers.impulsiveReactivity / 100),
      cognitiveImpulsivity: Math.max(0, 1 - biomarkers.inhibitoryControl / 100),
      nonPlanningImpulsivity: Math.max(0, 1 - biomarkers.behavioralControl / 100)
    };
  }

  /**
   * 충동성 신경생물학적 마커 분석
   */
  private static analyzeImpulsivityNeurobiologicalMarkers(biomarkers: any): any {
    return {
      prefrontalActivity: biomarkers.prefrontalActivity / 100,
      inhibitoryControl: biomarkers.inhibitoryControl / 100,
      rewardSensitivity: biomarkers.rewardSensitivity / 100
    };
  }

  /**
   * 스트레스 유형 분석
   */
  private static analyzeStressTypes(biomarkers: any, eegAnalysis: EEGDetailedAnalysis, ppgAnalysis: PPGDetailedAnalysis): any {
    return {
      acuteStress: Math.min(1, biomarkers.stressIndex / 100),
      chronicStress: Math.min(1, biomarkers.fatigueLevel / 100),
      traumaticStress: Math.min(0.5, biomarkers.cortisol / 200) // 보수적 추정
    };
  }

  /**
   * 스트레스 생리학적 마커 분석
   */
  private static analyzeStressPhysiologicalMarkers(biomarkers: any): any {
    return {
      cortisol: biomarkers.cortisol / 100,
      autonomicActivation: Math.max(0, 1 - biomarkers.autonomicBalance),
      inflammatoryResponse: biomarkers.inflammation / 100
    };
  }

  // ============================================================================
  // 지표 생성 및 임상 노트 메서드들
  // ============================================================================

  /**
   * 우울 지표 생성
   */
  private static generateDepressionIndicators(biomarkers: any, eegAnalysis: EEGDetailedAnalysis, ppgAnalysis: PPGDetailedAnalysis): string[] {
    const indicators: string[] = [];
    
    if (biomarkers.alphaAsymmetry > 60) indicators.push("전두엽 알파파 비대칭성 증가");
    if (biomarkers.thetaActivity > 70) indicators.push("세타파 활동 증가");
    if (biomarkers.hrvDepression > 65) indicators.push("심박변이도 저하");
    if (biomarkers.emotionalStability < 40) indicators.push("정서적 안정성 저하");
    if (indicators.length === 0) indicators.push("정상적인 기분 상태 지표");
    
    return indicators;
  }

  /**
   * 우울 임상 노트 생성
   */
  private static generateDepressionClinicalNotes(score: StandardizedScore, biomarkers: any, personalInfo: PersonalInfo): string {
    const age = this.calculateAge(personalInfo);
    const genderText = personalInfo.gender === 'male' ? '남성' : '여성';
    
    if (score.grade === 'attention' || score.grade === 'borderline') {
      return `${age}세 ${genderText}의 우울 위험도가 ${score.gradeDescription}입니다. 전문가 상담을 권장합니다.`;
    } else if (score.grade === 'normal') {
      return `현재 우울 위험도는 정상 범위이나 지속적인 모니터링이 필요합니다.`;
    } else {
      return `우울 위험도가 낮은 양호한 상태입니다.`;
    }
  }

  /**
   * ADHD 지표 생성
   */
  private static generateADHDIndicators(biomarkers: any, eegAnalysis: EEGDetailedAnalysis, ppgAnalysis: PPGDetailedAnalysis): string[] {
    const indicators: string[] = [];
    
    if (biomarkers.thetaBetaRatio > 80) indicators.push("세타/베타 비율 증가");
    if (biomarkers.focusStability < 40) indicators.push("집중력 안정성 저하");
    if (biomarkers.attentionControl < 45) indicators.push("주의력 조절 어려움");
    if (biomarkers.cognitiveLoad > 70) indicators.push("높은 인지 부하");
    if (indicators.length === 0) indicators.push("정상적인 주의력 집중 능력");
    
    return indicators;
  }

  /**
   * ADHD 임상 노트 생성
   */
  private static generateADHDClinicalNotes(score: StandardizedScore, biomarkers: any, personalInfo: PersonalInfo): string {
    if (score.grade === 'attention' || score.grade === 'borderline') {
      return `주의력 집중에 어려움이 관찰되며, ADHD 평가를 위한 전문가 상담이 필요할 수 있습니다.`;
    } else if (score.grade === 'normal') {
      return `주의력 집중 능력은 평균 수준이나, 환경적 요인 관리가 도움이 될 수 있습니다.`;
    } else {
      return `주의력 집중 능력이 양호한 상태입니다.`;
    }
  }

  /**
   * 번아웃 지표 생성
   */
  private static generateBurnoutIndicators(biomarkers: any, eegAnalysis: EEGDetailedAnalysis, ppgAnalysis: PPGDetailedAnalysis): string[] {
    const indicators: string[] = [];
    
    if (biomarkers.mentalFatigue > 70) indicators.push("정신적 피로도 증가");
    if (biomarkers.chronicStress > 65) indicators.push("만성 스트레스 징후");
    if (biomarkers.recoveryCapacity < 40) indicators.push("회복 능력 저하");
    if (biomarkers.emotionalExhaustion > 60) indicators.push("정서적 소진 징후");
    if (indicators.length === 0) indicators.push("양호한 업무 스트레스 관리 상태");
    
    return indicators;
  }

  /**
   * 번아웃 임상 노트 생성
   */
  private static generateBurnoutClinicalNotes(score: StandardizedScore, biomarkers: any, personalInfo: PersonalInfo): string {
    if (score.grade === 'attention' || score.grade === 'borderline') {
      return `번아웃 위험도가 높아 업무량 조절과 휴식이 필요합니다.`;
    } else if (score.grade === 'normal') {
      return `번아웃 위험도는 평균 수준이나, 예방적 관리가 중요합니다.`;
    } else {
      return `번아웃 위험도가 낮은 건강한 상태입니다.`;
    }
  }

  /**
   * 충동성 지표 생성
   */
  private static generateImpulsivityIndicators(biomarkers: any, eegAnalysis: EEGDetailedAnalysis, ppgAnalysis: PPGDetailedAnalysis): string[] {
    const indicators: string[] = [];
    
    if (biomarkers.inhibitoryControl < 45) indicators.push("억제 조절 능력 저하");
    if (biomarkers.impulsiveReactivity > 65) indicators.push("충동적 반응성 증가");
    if (biomarkers.prefrontalActivity < 50) indicators.push("전두엽 활동 저하");
    if (biomarkers.behavioralControl < 50) indicators.push("행동 조절 어려움");
    if (indicators.length === 0) indicators.push("양호한 충동 조절 능력");
    
    return indicators;
  }

  /**
   * 충동성 임상 노트 생성
   */
  private static generateImpulsivityClinicalNotes(score: StandardizedScore, biomarkers: any, personalInfo: PersonalInfo): string {
    if (score.grade === 'attention' || score.grade === 'borderline') {
      return `충동성 조절에 어려움이 있어 행동 조절 기법 학습이 도움이 될 수 있습니다.`;
    } else if (score.grade === 'normal') {
      return `충동성 수준은 정상 범위이나, 스트레스 상황에서 주의가 필요합니다.`;
    } else {
      return `충동성 조절이 잘 되는 안정된 상태입니다.`;
    }
  }

  /**
   * 스트레스 지표 생성
   */
  private static generateStressIndicators(biomarkers: any, eegAnalysis: EEGDetailedAnalysis, ppgAnalysis: PPGDetailedAnalysis): string[] {
    const indicators: string[] = [];
    
    if (biomarkers.stressIndex > 70) indicators.push("높은 스트레스 지수");
    if (biomarkers.autonomicBalance < 0.4) indicators.push("자율신경 불균형");
    if (biomarkers.fatigueLevel > 65) indicators.push("피로도 증가");
    if (biomarkers.cortisol > 60) indicators.push("스트레스 호르몬 수준 상승");
    if (indicators.length === 0) indicators.push("적절한 스트레스 관리 상태");
    
    return indicators;
  }

  /**
   * 스트레스 임상 노트 생성
   */
  private static generateStressClinicalNotes(score: StandardizedScore, biomarkers: any, personalInfo: PersonalInfo): string {
    if (score.grade === 'attention' || score.grade === 'borderline') {
      return `스트레스 수준이 높아 적극적인 스트레스 관리가 필요합니다.`;
    } else if (score.grade === 'normal') {
      return `스트레스 수준은 일반적이나, 지속적인 관리가 중요합니다.`;
    } else {
      return `스트레스가 잘 관리되고 있는 양호한 상태입니다.`;
    }
  }

  // ============================================================================
  // 위험 요소 및 보호 요소 분석
  // ============================================================================

  /**
   * 위험 요소 및 보호 요소 분석
   */
  private static analyzeRiskAndProtectiveFactors(
    depressionRisk: DepressionRiskAssessment,
    adhdFocusRisk: ADHDFocusRiskAssessment,
    burnoutRisk: BurnoutRiskAssessment,
    impulsivityRisk: ImpulsivityRiskAssessment,
    stressRisk: StressRiskAssessment,
    eegAnalysis: EEGDetailedAnalysis,
    ppgAnalysis: PPGDetailedAnalysis
  ): { riskFactors: string[]; protectiveFactors: string[] } {
    const riskFactors: string[] = [];
    const protectiveFactors: string[] = [];

    // 위험 요소 분석
    if (depressionRisk.score.grade === 'attention' || depressionRisk.score.grade === 'borderline') {
      riskFactors.push("우울 위험 징후");
    }
    if (adhdFocusRisk.score.grade === 'attention' || adhdFocusRisk.score.grade === 'borderline') {
      riskFactors.push("주의력 집중 어려움");
    }
    if (burnoutRisk.score.grade === 'attention' || burnoutRisk.score.grade === 'borderline') {
      riskFactors.push("번아웃 위험 증가");
    }
    if (impulsivityRisk.score.grade === 'attention' || impulsivityRisk.score.grade === 'borderline') {
      riskFactors.push("충동성 조절 어려움");
    }
    if (stressRisk.score.grade === 'attention' || stressRisk.score.grade === 'borderline') {
      riskFactors.push("높은 스트레스 수준");
    }

    // 보호 요소 분석
    if (eegAnalysis.emotionalStability.grade === 'good' || eegAnalysis.emotionalStability.grade === 'excellent') {
      protectiveFactors.push("양호한 정서적 안정성");
    }
    if (ppgAnalysis.cardiovascularFitnessScore.grade === 'good' || ppgAnalysis.cardiovascularFitnessScore.grade === 'excellent') {
      protectiveFactors.push("건강한 심혈관 기능");
    }
    if (eegAnalysis.focusIndex.grade === 'good' || eegAnalysis.focusIndex.grade === 'excellent') {
      protectiveFactors.push("우수한 집중력");
    }
    if (ppgAnalysis.autonomicBalanceScore.grade === 'good' || ppgAnalysis.autonomicBalanceScore.grade === 'excellent') {
      protectiveFactors.push("균형잡힌 자율신경 기능");
    }

    // 기본값 설정
    if (riskFactors.length === 0) {
      riskFactors.push("특별한 위험 요소 없음");
    }
    if (protectiveFactors.length === 0) {
      protectiveFactors.push("기본적인 건강 기능 유지");
    }

    return { riskFactors, protectiveFactors };
  }

  // ============================================================================
  // 개인 맞춤형 권고사항 생성
  // ============================================================================

  /**
   * 개인 맞춤형 권고사항 생성
   */
  private static generatePersonalizedRecommendations(
    personalInfo: PersonalInfo,
    depressionRisk: DepressionRiskAssessment,
    adhdFocusRisk: ADHDFocusRiskAssessment,
    burnoutRisk: BurnoutRiskAssessment,
    impulsivityRisk: ImpulsivityRiskAssessment,
    stressRisk: StressRiskAssessment,
    overallScore: StandardizedScore
  ): any {
    const age = this.calculateAge(personalInfo);
    const isHighRisk = overallScore.grade === 'attention' || overallScore.grade === 'borderline';

    return {
      immediate: {
        lifestyle: this.generateLifestyleRecommendations(personalInfo, isHighRisk),
        exercise: this.generateExerciseRecommendations(age, personalInfo.gender, isHighRisk),
        mindfulness: this.generateMindfulnessRecommendations(stressRisk, adhdFocusRisk),
        sleep: this.generateSleepRecommendations(age, stressRisk)
      },
      shortTerm: {
        behavioralChanges: this.generateBehavioralRecommendations(impulsivityRisk, adhdFocusRisk),
        stressManagement: this.generateStressManagementRecommendations(stressRisk, burnoutRisk),
        socialSupport: this.generateSocialSupportRecommendations(depressionRisk, personalInfo),
        professionalHelp: this.generateProfessionalHelpRecommendations(
          depressionRisk, adhdFocusRisk, burnoutRisk, impulsivityRisk, stressRisk
        )
      },
      longTerm: {
        mentalCare: this.generateMentalCareRecommendations(overallScore, personalInfo),
        preventiveMeasures: this.generatePreventiveMeasures(personalInfo, age),
        monitoringPlan: this.generateMonitoringPlan(overallScore),
        treatmentOptions: this.generateTreatmentOptions(
          depressionRisk, adhdFocusRisk, burnoutRisk, impulsivityRisk, stressRisk
        )
      },
      occupationSpecific: {
        workplaceStrategies: this.generateWorkplaceStrategies(personalInfo.occupation, burnoutRisk),
        timeManagement: this.generateTimeManagementRecommendations(adhdFocusRisk, burnoutRisk),
        boundarySettings: this.generateBoundaryRecommendations(burnoutRisk, stressRisk),
        careerGuidance: this.generateCareerGuidance(personalInfo, overallScore)
      }
    };
  }

  /**
   * 생활습관 권고사항
   */
  private static generateLifestyleRecommendations(personalInfo: PersonalInfo, isHighRisk: boolean): string[] {
    const recommendations = ["규칙적인 수면 패턴 유지", "균형잡힌 식단 섭취"];
    
    if (isHighRisk) {
      recommendations.push("금주 또는 음주량 제한", "카페인 섭취 조절");
    }
    
    if (personalInfo.gender === 'female') {
      recommendations.push("철분과 비타민 D 충분히 섭취");
    }
    
    return recommendations;
  }

  /**
   * 운동 권고사항
   */
  private static generateExerciseRecommendations(age: number, gender: string, isHighRisk: boolean): string[] {
    const recommendations = [];
    
    if (age < 40) {
      recommendations.push("일주일 3-4회 중강도 유산소 운동", "근력 운동 주 2회");
    } else {
      recommendations.push("일주일 3회 가벼운 유산소 운동", "스트레칭과 요가");
    }
    
    if (isHighRisk) {
      recommendations.push("산책이나 가벼운 운동부터 시작");
    }
    
    return recommendations;
  }

  /**
   * 마음챙김 권고사항
   */
  private static generateMindfulnessRecommendations(stressRisk: StressRiskAssessment, adhdRisk: ADHDFocusRiskAssessment): string[] {
    const recommendations = [];
    
    if (stressRisk.score.grade === 'attention' || stressRisk.score.grade === 'borderline') {
      recommendations.push("일일 15분 명상", "심호흡 연습");
    } else {
      recommendations.push("일일 10분 마음챙김 명상");
    }
    
    if (adhdRisk.score.grade === 'attention' || adhdRisk.score.grade === 'borderline') {
      recommendations.push("집중력 향상 명상", "단계별 주의력 훈련");
    }
    
    return recommendations;
  }

  /**
   * 수면 권고사항
   */
  private static generateSleepRecommendations(age: number, stressRisk: StressRiskAssessment): string[] {
    const recommendations = [];
    
    if (age < 30) {
      recommendations.push("7-9시간 충분한 수면", "23:00 이전 취침");
    } else if (age < 50) {
      recommendations.push("7-8시간 규칙적인 수면", "22:30 이전 취침");
    } else {
      recommendations.push("6-8시간 안정적인 수면", "수면 환경 개선");
    }
    
    if (stressRisk.score.grade === 'attention' || stressRisk.score.grade === 'borderline') {
      recommendations.push("취침 전 디지털 기기 사용 금지", "수면 의식 만들기");
    }
    
    return recommendations;
  }

  /**
   * 행동 변화 권고사항
   */
  private static generateBehavioralRecommendations(impulsivityRisk: ImpulsivityRiskAssessment, adhdRisk: ADHDFocusRiskAssessment): string[] {
    const recommendations = [];
    
    if (impulsivityRisk.score.grade === 'attention' || impulsivityRisk.score.grade === 'borderline') {
      recommendations.push("충동 조절 기법 학습", "일시정지 기법 연습");
    }
    
    if (adhdRisk.score.grade === 'attention' || adhdRisk.score.grade === 'borderline') {
      recommendations.push("업무 환경 정리정돈", "할 일 목록 작성 습관");
    }
    
    if (recommendations.length === 0) {
      recommendations.push("현재 행동 패턴 유지");
    }
    
    return recommendations;
  }

  /**
   * 스트레스 관리 권고사항
   */
  private static generateStressManagementRecommendations(stressRisk: StressRiskAssessment, burnoutRisk: BurnoutRiskAssessment): string[] {
    const recommendations = [];
    
    if (stressRisk.score.grade === 'attention' || stressRisk.score.grade === 'borderline') {
      recommendations.push("스트레스 관리 기법 학습", "이완 기법 연습");
    }
    
    if (burnoutRisk.score.grade === 'attention' || burnoutRisk.score.grade === 'borderline') {
      recommendations.push("업무량 조절", "정기적인 휴식 시간 확보");
    }
    
    if (recommendations.length === 0) {
      recommendations.push("현재 스트레스 관리 방법 유지");
    }
    
    return recommendations;
  }

  /**
   * 사회적 지지 권고사항
   */
  private static generateSocialSupportRecommendations(depressionRisk: DepressionRiskAssessment, personalInfo: PersonalInfo): string[] {
    const recommendations = [];
    
    if (depressionRisk.score.grade === 'attention' || depressionRisk.score.grade === 'borderline') {
      recommendations.push("가족, 친구와의 소통 증진", "사회 활동 참여");
    } else {
      recommendations.push("기존 인간관계 유지", "새로운 사람들과의 만남");
    }
    
    return recommendations;
  }

  /**
   * 전문가 도움 권고사항
   */
  private static generateProfessionalHelpRecommendations(
    depressionRisk: DepressionRiskAssessment,
    adhdRisk: ADHDFocusRiskAssessment,
    burnoutRisk: BurnoutRiskAssessment,
    impulsivityRisk: ImpulsivityRiskAssessment,
    stressRisk: StressRiskAssessment
  ): string[] {
    const recommendations = [];
    
    if (depressionRisk.score.grade === 'attention') {
      recommendations.push("정신건강 전문가 상담 권장");
    }
    
    if (adhdRisk.score.grade === 'attention') {
      recommendations.push("ADHD 전문의 평가 고려");
    }
    
    if (burnoutRisk.score.grade === 'attention') {
      recommendations.push("직업 상담사 또는 심리상담사 상담");
    }
    
    if (stressRisk.score.grade === 'attention') {
      recommendations.push("스트레스 클리닉 방문 고려");
    }
    
    return recommendations;
  }

  /**
   * 정신건강 관리 권고사항
   */
  private static generateMentalCareRecommendations(overallScore: StandardizedScore, personalInfo: PersonalInfo): string[] {
    const recommendations = [];
    
    if (overallScore.grade === 'attention' || overallScore.grade === 'borderline') {
      recommendations.push("월 1회 정신건강 자가 평가", "3개월마다 전문가 상담");
    } else {
      recommendations.push("6개월마다 정신건강 체크", "연 1회 종합 평가");
    }
    
    return recommendations;
  }

  /**
   * 예방 조치 권고사항
   */
  private static generatePreventiveMeasures(personalInfo: PersonalInfo, age: number): string[] {
    const recommendations = ["정기적인 건강 검진", "스트레스 예방 교육"];
    
    if (age > 40) {
      recommendations.push("중년기 정신건강 관리", "호르몬 변화 모니터링");
    }
    
    return recommendations;
  }

  /**
   * 모니터링 계획 권고사항
   */
  private static generateMonitoringPlan(overallScore: StandardizedScore): string[] {
    const recommendations = [];
    
    if (overallScore.grade === 'attention' || overallScore.grade === 'borderline') {
      recommendations.push("주 1회 기분 상태 기록", "월 1회 자가 평가");
    } else {
      recommendations.push("월 1회 정신건강 자가 체크", "분기별 종합 평가");
    }
    
    return recommendations;
  }

  /**
   * 치료 옵션 권고사항
   */
  private static generateTreatmentOptions(
    depressionRisk: DepressionRiskAssessment,
    adhdRisk: ADHDFocusRiskAssessment,
    burnoutRisk: BurnoutRiskAssessment,
    impulsivityRisk: ImpulsivityRiskAssessment,
    stressRisk: StressRiskAssessment
  ): string[] {
    const recommendations = [];
    
    const hasHighRisk = [depressionRisk, adhdRisk, burnoutRisk, impulsivityRisk, stressRisk]
      .some(risk => risk.score.grade === 'attention');
    
    if (hasHighRisk) {
      recommendations.push("인지행동치료 고려", "약물치료 전문의 상담");
    } else {
      recommendations.push("예방적 상담 프로그램 참여");
    }
    
    return recommendations;
  }

  /**
   * 직장 전략 권고사항
   */
  private static generateWorkplaceStrategies(occupation: string, burnoutRisk: BurnoutRiskAssessment): string[] {
    const recommendations = [];
    
    if (burnoutRisk.score.grade === 'attention' || burnoutRisk.score.grade === 'borderline') {
      recommendations.push("업무 우선순위 재설정", "동료와의 업무 분담");
    }
    
    // 직업별 맞춤 권고사항
    if (occupation === 'office_worker') {
      recommendations.push("정기적인 휴식 시간 확보", "업무 환경 개선");
    } else if (occupation === 'healthcare') {
      recommendations.push("감정 노동 관리", "동료 지지 시스템 활용");
    } else if (occupation === 'teacher') {
      recommendations.push("수업 부담 조절", "학생 관리 스트레스 완화");
    }
    
    return recommendations;
  }

  /**
   * 시간 관리 권고사항
   */
  private static generateTimeManagementRecommendations(adhdRisk: ADHDFocusRiskAssessment, burnoutRisk: BurnoutRiskAssessment): string[] {
    const recommendations = [];
    
    if (adhdRisk.score.grade === 'attention' || adhdRisk.score.grade === 'borderline') {
      recommendations.push("포모도로 기법 활용", "업무 세분화");
    }
    
    if (burnoutRisk.score.grade === 'attention' || burnoutRisk.score.grade === 'borderline') {
      recommendations.push("업무 시간 제한", "휴식 시간 의무화");
    }
    
    if (recommendations.length === 0) {
      recommendations.push("현재 시간 관리 방법 유지");
    }
    
    return recommendations;
  }

  /**
   * 경계 설정 권고사항
   */
  private static generateBoundaryRecommendations(burnoutRisk: BurnoutRiskAssessment, stressRisk: StressRiskAssessment): string[] {
    const recommendations = [];
    
    if (burnoutRisk.score.grade === 'attention' || burnoutRisk.score.grade === 'borderline') {
      recommendations.push("일과 생활의 명확한 분리", "퇴근 후 업무 차단");
    }
    
    if (stressRisk.score.grade === 'attention' || stressRisk.score.grade === 'borderline') {
      recommendations.push("개인 시간 확보", "스트레스 요인 차단");
    }
    
    if (recommendations.length === 0) {
      recommendations.push("건강한 경계 유지");
    }
    
    return recommendations;
  }

  /**
   * 경력 지도 권고사항
   */
  private static generateCareerGuidance(personalInfo: PersonalInfo, overallScore: StandardizedScore): string[] {
    const recommendations = [];
    
    if (overallScore.grade === 'attention' || overallScore.grade === 'borderline') {
      recommendations.push("업무 스트레스 관리 교육", "직업 적성 재평가");
    } else if (overallScore.grade === 'good' || overallScore.grade === 'excellent') {
      recommendations.push("리더십 역량 개발", "새로운 도전 기회 모색");
    }
    
    return recommendations;
  }
} 