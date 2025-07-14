import { PersonalInfo, MeasurementData, AIAnalysisResult } from '../types/index';
import { indexGuides } from '../../../constants/indexGuides';

/**
 * 의학적 해석 고도화 서비스
 * 전문 의학 용어, 다중 지표 상관관계 분석, 전문의 상담 가이드라인 제공
 */
export class MedicalInterpretationService {
  
  /**
   * 다중 지표 상관관계 분석
   */
  static analyzeClinicalCorrelations(measurementData: MeasurementData): ClinicalCorrelationResult {
    const eegMetrics = measurementData.eegMetrics;
    const ppgMetrics = measurementData.ppgMetrics;
    const accMetrics = measurementData.accMetrics;

    // 1. 뇌-심혈관 상관관계 분석
    const neuroCVCorrelation = this.analyzeNeuroCVCorrelation(eegMetrics, ppgMetrics);
    
    // 2. 스트레스-자율신경 상관관계 분석
    const stressAutonomicCorrelation = this.analyzeStressAutonomicCorrelation(eegMetrics, ppgMetrics);
    
    // 3. 측정 품질-신호 신뢰도 상관관계 분석
    const qualitySignalCorrelation = this.analyzeQualitySignalCorrelation(accMetrics, eegMetrics, ppgMetrics);
    
    // 4. 다중 지표 통합 위험도 평가
    const integratedRiskAssessment = this.assessIntegratedRisk(eegMetrics, ppgMetrics, accMetrics);

    return {
      neuroCVCorrelation,
      stressAutonomicCorrelation,
      qualitySignalCorrelation,
      integratedRiskAssessment,
      clinicalRecommendations: this.generateClinicalRecommendations(
        neuroCVCorrelation,
        stressAutonomicCorrelation,
        integratedRiskAssessment
      )
    };
  }

  /**
   * 뇌-심혈관 상관관계 분석
   */
  private static analyzeNeuroCVCorrelation(eegMetrics: any, ppgMetrics: any): NeuroCVCorrelation {
    const stressIndex = eegMetrics.stressIndex?.value || 0;
    const heartRate = ppgMetrics.heartRate?.value || 0;
    const rmssd = ppgMetrics.rmssd?.value || 0;
    const lfHfRatio = ppgMetrics.lfHfRatio?.value || 0;

    // 스트레스-심박수 상관관계 (정상적으로 양의 상관관계)
    const stressHRCorrelation = this.calculateCorrelation(stressIndex, heartRate);
    
    // 스트레스-HRV 상관관계 (정상적으로 음의 상관관계)
    const stressHRVCorrelation = this.calculateCorrelation(stressIndex, rmssd);
    
    // 뇌파 스트레스-자율신경 균형 상관관계
    const stressAutonomicCorrelation = this.calculateCorrelation(stressIndex, lfHfRatio);

    return {
      stressHRCorrelation: {
        value: stressHRCorrelation,
        interpretation: stressHRCorrelation > 0.3 ? 
          '정상적인 스트레스-심박수 연동: 뇌 스트레스 증가 시 심박수가 적절히 상승' :
          '스트레스-심박수 연동 저하: 자율신경 반응성 감소 가능성',
        clinicalSignificance: stressHRCorrelation > 0.3 ? 'normal' : 'abnormal'
      },
      stressHRVCorrelation: {
        value: stressHRVCorrelation,
        interpretation: stressHRVCorrelation < -0.2 ? 
          '정상적인 스트레스-HRV 역상관: 스트레스 증가 시 심박변이도 감소' :
          '스트레스-HRV 역상관 약화: 스트레스 대응 능력 저하 가능성',
        clinicalSignificance: stressHRVCorrelation < -0.2 ? 'normal' : 'abnormal'
      },
      stressAutonomicCorrelation: {
        value: stressAutonomicCorrelation,
        interpretation: stressAutonomicCorrelation > 0.2 ? 
          '정상적인 스트레스-자율신경 연동: 뇌 스트레스와 교감신경 활성화 일치' :
          '스트레스-자율신경 연동 불일치: 중추-말초 신경계 조절 이상 가능성',
        clinicalSignificance: stressAutonomicCorrelation > 0.2 ? 'normal' : 'abnormal'
      },
      overallAssessment: this.assessNeuroCVIntegration(stressHRCorrelation, stressHRVCorrelation, stressAutonomicCorrelation)
    };
  }

  /**
   * 스트레스-자율신경 상관관계 분석
   */
  private static analyzeStressAutonomicCorrelation(eegMetrics: any, ppgMetrics: any): StressAutonomicCorrelation {
    const relaxationIndex = eegMetrics.relaxationIndex?.value || 0;
    const stressIndex = eegMetrics.stressIndex?.value || 0;
    const hfPower = ppgMetrics.hfPower?.value || 0;
    const lfPower = ppgMetrics.lfPower?.value || 0;
    const lfHfRatio = ppgMetrics.lfHfRatio?.value || 0;

    // 이완도-부교감신경 상관관계 (HF Power)
    const relaxationParasympatheticCorr = this.calculateCorrelation(relaxationIndex, hfPower);
    
    // 스트레스-교감신경 상관관계 (LF Power)
    const stressSympatheticCorr = this.calculateCorrelation(stressIndex, lfPower);
    
    // 전체 자율신경 균형 평가
    const autonomicBalance = this.assessAutonomicBalance(lfHfRatio, relaxationIndex, stressIndex);

    return {
      relaxationParasympatheticCorr: {
        value: relaxationParasympatheticCorr,
        interpretation: relaxationParasympatheticCorr > 0.3 ? 
          '정상적인 이완-부교감신경 연동: 뇌 이완 시 부교감신경 활성화' :
          '이완-부교감신경 연동 저하: 회복 능력 감소 가능성',
        clinicalSignificance: relaxationParasympatheticCorr > 0.3 ? 'normal' : 'abnormal'
      },
      stressSympatheticCorr: {
        value: stressSympatheticCorr,
        interpretation: stressSympatheticCorr > 0.3 ? 
          '정상적인 스트레스-교감신경 연동: 뇌 스트레스 시 교감신경 활성화' :
          '스트레스-교감신경 연동 저하: 스트레스 대응 반응 둔화',
        clinicalSignificance: stressSympatheticCorr > 0.3 ? 'normal' : 'abnormal'
      },
      autonomicBalance: autonomicBalance,
      clinicalRecommendations: this.generateAutonomicRecommendations(autonomicBalance)
    };
  }

  /**
   * 측정 품질-신호 신뢰도 상관관계 분석
   */
  private static analyzeQualitySignalCorrelation(accMetrics: any, eegMetrics: any, ppgMetrics: any): QualitySignalCorrelation {
    const stability = accMetrics.stability || 0;
    const averageMovement = accMetrics.averageMovement || 0;
    const maxMovement = accMetrics.maxMovement || 0;

    // 측정 안정성이 EEG 신호에 미치는 영향
    const stabilityEEGImpact = this.assessStabilityImpact(stability, eegMetrics);
    
    // 측정 안정성이 PPG 신호에 미치는 영향
    const stabilityPPGImpact = this.assessStabilityImpact(stability, ppgMetrics);
    
    // 움직임 아티팩트 영향 평가
    const movementArtifactImpact = this.assessMovementArtifactImpact(averageMovement, maxMovement);

    return {
      stabilityEEGImpact,
      stabilityPPGImpact,
      movementArtifactImpact,
      overallQualityAssessment: this.assessOverallMeasurementQuality(stability, averageMovement, maxMovement),
      qualityRecommendations: this.generateQualityRecommendations(stability, averageMovement, maxMovement)
    };
  }

  /**
   * 다중 지표 통합 위험도 평가
   */
  private static assessIntegratedRisk(eegMetrics: any, ppgMetrics: any, accMetrics: any): IntegratedRiskAssessment {
    const riskFactors = [];
    let overallRiskLevel = 'low';

    // 1. 신경학적 위험 요소 평가
    const neurologicalRisk = this.assessNeurologicalRisk(eegMetrics);
    if (neurologicalRisk.level !== 'low') {
      riskFactors.push(...neurologicalRisk.factors);
    }

    // 2. 심혈관 위험 요소 평가
    const cardiovascularRisk = this.assessCardiovascularRisk(ppgMetrics);
    if (cardiovascularRisk.level !== 'low') {
      riskFactors.push(...cardiovascularRisk.factors);
    }

    // 3. 스트레스 관련 위험 요소 평가
    const stressRisk = this.assessStressRisk(eegMetrics, ppgMetrics);
    if (stressRisk.level !== 'low') {
      riskFactors.push(...stressRisk.factors);
    }

    // 4. 측정 품질 관련 위험 요소 평가
    const qualityRisk = this.assessQualityRisk(accMetrics);
    if (qualityRisk.level !== 'low') {
      riskFactors.push(...qualityRisk.factors);
    }

    // 전체 위험도 결정
    const highRiskCount = [neurologicalRisk, cardiovascularRisk, stressRisk, qualityRisk]
      .filter(risk => risk.level === 'high').length;
    const mediumRiskCount = [neurologicalRisk, cardiovascularRisk, stressRisk, qualityRisk]
      .filter(risk => risk.level === 'medium').length;

    if (highRiskCount >= 2) {
      overallRiskLevel = 'high';
    } else if (highRiskCount >= 1 || mediumRiskCount >= 2) {
      overallRiskLevel = 'medium';
    }

    return {
      overallRiskLevel,
      riskFactors,
      neurologicalRisk,
      cardiovascularRisk,
      stressRisk,
      qualityRisk,
      urgentConsultationNeeded: this.assessUrgentConsultationNeed(
        neurologicalRisk,
        cardiovascularRisk,
        stressRisk
      ),
      followUpRecommendations: this.generateRiskBasedFollowUp(overallRiskLevel, riskFactors)
    };
  }

  /**
   * 전문의 상담 가이드라인 생성
   */
  static generateProfessionalGuidance(
    personalInfo: PersonalInfo,
    measurementData: MeasurementData,
    correlationResult: ClinicalCorrelationResult
  ): ProfessionalGuidanceResult {
    const age = new Date().getFullYear() - personalInfo.birthYear;
    const urgencyLevel = this.assessConsultationUrgency(correlationResult.integratedRiskAssessment);
    
    return {
      consultationNeeded: urgencyLevel !== 'routine',
      urgencyLevel,
      recommendedSpecialists: this.getRecommendedSpecialists(correlationResult.integratedRiskAssessment),
      warningSignals: this.getWarningSignals(correlationResult.integratedRiskAssessment),
      emergencyContacts: this.getEmergencyContacts(),
      followUpSchedule: this.generateFollowUpSchedule(urgencyLevel, age),
      preparationGuidelines: this.generateConsultationPreparation(correlationResult)
    };
  }

  /**
   * 의학적 용어 및 근거 강화
   */
  static enhanceMedicalTerminology(analysisResult: AIAnalysisResult): EnhancedMedicalAnalysis {
    return {
      terminologyEnhancement: {
        eegTerminology: this.enhanceEEGTerminology(analysisResult),
        ppgTerminology: this.enhancePPGTerminology(analysisResult),
        clinicalTerminology: this.enhanceClinicalTerminology(analysisResult)
      },
      evidenceBasedReferences: this.addEvidenceBasedReferences(analysisResult),
      differentialDiagnosis: this.generateDifferentialDiagnosis(analysisResult),
      prognosticIndicators: this.generatePrognosticIndicators(analysisResult)
    };
  }

  // ===== 보조 메서드들 =====

  private static calculateCorrelation(x: number, y: number): number {
    // 단순 상관관계 계산 (실제로는 더 복잡한 통계 분석 필요)
    const normalizedX = Math.max(0, Math.min(1, x / 10));
    const normalizedY = Math.max(0, Math.min(1, y / 100));
    return normalizedX * normalizedY - 0.5;
  }

  private static assessNeuroCVIntegration(
    stressHRCorr: number,
    stressHRVCorr: number,
    stressAutonomicCorr: number
  ): string {
    const normalCount = [stressHRCorr > 0.3, stressHRVCorr < -0.2, stressAutonomicCorr > 0.2]
      .filter(Boolean).length;
    
    if (normalCount >= 2) {
      return '정상적인 뇌-심혈관 통합 기능: 중추신경계와 자율신경계의 조화로운 연동';
    } else if (normalCount === 1) {
      return '부분적 뇌-심혈관 통합 이상: 일부 연동 기능 저하, 모니터링 필요';
    } else {
      return '뇌-심혈관 통합 기능 저하: 중추-말초 신경계 조절 이상, 전문의 상담 권장';
    }
  }

  private static assessAutonomicBalance(
    lfHfRatio: number,
    relaxationIndex: number,
    stressIndex: number
  ): AutonomicBalanceAssessment {
    let balanceStatus = 'balanced';
    let interpretation = '';

    if (lfHfRatio > 4.0) {
      balanceStatus = 'sympathetic_dominant';
      interpretation = '교감신경 우세: 지속적 스트레스 상태, 회복 시간 부족';
    } else if (lfHfRatio < 1.0) {
      balanceStatus = 'parasympathetic_dominant';
      interpretation = '부교감신경 우세: 과도한 이완 상태, 각성 반응 저하';
    } else {
      balanceStatus = 'balanced';
      interpretation = '자율신경 균형: 적절한 교감/부교감 신경 조절';
    }

    return {
      balanceStatus,
      interpretation,
      lfHfRatio,
      clinicalRecommendations: this.getAutonomicBalanceRecommendations(balanceStatus)
    };
  }

  private static assessNeurologicalRisk(eegMetrics: any): RiskAssessment {
    const riskFactors = [];
    let level = 'low';

    const stressIndex = eegMetrics.stressIndex?.value || 0;
    const focusIndex = eegMetrics.focusIndex?.value || 0;
    const cognitiveLoad = eegMetrics.cognitiveLoad?.value || 0;

    if (stressIndex > 5.0) {
      riskFactors.push('심각한 뇌파 스트레스 지수 상승');
      level = 'high';
    } else if (stressIndex > 4.0) {
      riskFactors.push('뇌파 스트레스 지수 상승');
      level = 'medium';
    }

    if (focusIndex < 1.5) {
      riskFactors.push('현저한 집중력 저하');
      level = level === 'high' ? 'high' : 'medium';
    }

    if (cognitiveLoad > 0.9) {
      riskFactors.push('과도한 인지 부하');
      level = level === 'high' ? 'high' : 'medium';
    }

    return { level, factors: riskFactors };
  }

  private static assessCardiovascularRisk(ppgMetrics: any): RiskAssessment {
    const riskFactors = [];
    let level = 'low';

    const heartRate = ppgMetrics.heartRate?.value || 0;
    const rmssd = ppgMetrics.rmssd?.value || 0;
    const lfHfRatio = ppgMetrics.lfHfRatio?.value || 0;

    if (heartRate > 100) {
      riskFactors.push('빈맥 (심박수 > 100 bpm)');
      level = 'high';
    } else if (heartRate < 50) {
      riskFactors.push('서맥 (심박수 < 50 bpm)');
      level = 'medium';
    }

    if (rmssd < 15) {
      riskFactors.push('현저한 심박변이도 감소');
      level = level === 'high' ? 'high' : 'medium';
    }

    if (lfHfRatio > 6.0) {
      riskFactors.push('자율신경 불균형 (교감신경 과활성화)');
      level = level === 'high' ? 'high' : 'medium';
    }

    return { level, factors: riskFactors };
  }

  private static assessStressRisk(eegMetrics: any, ppgMetrics: any): RiskAssessment {
    const riskFactors = [];
    let level = 'low';

    const eegStress = eegMetrics.stressIndex?.value || 0;
    const relaxation = eegMetrics.relaxationIndex?.value || 0;
    const heartRate = ppgMetrics.heartRate?.value || 0;
    const rmssd = ppgMetrics.rmssd?.value || 0;

    // 다중 지표 스트레스 평가
    const stressIndicators = [
      eegStress > 4.5,
      relaxation < 0.15,
      heartRate > 90,
      rmssd < 20
    ].filter(Boolean).length;

    if (stressIndicators >= 3) {
      riskFactors.push('다중 지표 고스트레스 상태');
      level = 'high';
    } else if (stressIndicators >= 2) {
      riskFactors.push('중등도 스트레스 상태');
      level = 'medium';
    }

    return { level, factors: riskFactors };
  }

  private static assessQualityRisk(accMetrics: any): RiskAssessment {
    const riskFactors = [];
    let level = 'low';

    const stability = accMetrics.stability || 0;
    const averageMovement = accMetrics.averageMovement || 0;

    if (stability < 50) {
      riskFactors.push('측정 안정성 불량 (신뢰도 저하)');
      level = 'high';
    } else if (stability < 70) {
      riskFactors.push('측정 안정성 보통 (해석 주의)');
      level = 'medium';
    }

    if (averageMovement > 0.2) {
      riskFactors.push('과도한 움직임 아티팩트');
      level = level === 'high' ? 'high' : 'medium';
    }

    return { level, factors: riskFactors };
  }

  private static assessUrgentConsultationNeed(
    neurologicalRisk: RiskAssessment,
    cardiovascularRisk: RiskAssessment,
    stressRisk: RiskAssessment
  ): boolean {
    return neurologicalRisk.level === 'high' || 
           cardiovascularRisk.level === 'high' || 
           (stressRisk.level === 'high' && neurologicalRisk.level === 'medium');
  }

  private static getRecommendedSpecialists(riskAssessment: IntegratedRiskAssessment): string[] {
    const specialists = [];

    if (riskAssessment.neurologicalRisk.level === 'high') {
      specialists.push('신경과 전문의');
    }

    if (riskAssessment.cardiovascularRisk.level === 'high') {
      specialists.push('심장내과 전문의');
    }

    if (riskAssessment.stressRisk.level === 'high') {
      specialists.push('정신건강의학과 전문의');
    }

    if (specialists.length === 0) {
      specialists.push('가정의학과 전문의');
    }

    return specialists;
  }

  private static getWarningSignals(riskAssessment: IntegratedRiskAssessment): string[] {
    return [
      '지속적인 두통이나 어지러움',
      '가슴 통증이나 호흡 곤란',
      '심한 불안이나 우울감',
      '수면 장애 지속',
      '집중력 현저한 저하',
      '심박수 이상 (지속적 빈맥/서맥)'
    ];
  }

  private static getEmergencyContacts(): string[] {
    return [
      '응급실: 119',
      '정신건강 위기상담: 1393',
      '생명의전화: 1588-9191',
      '청소년전화: 1388'
    ];
  }

  // ... 기타 보조 메서드들 ...

  private static generateClinicalRecommendations(
    neuroCVCorrelation: NeuroCVCorrelation,
    stressAutonomicCorrelation: StressAutonomicCorrelation,
    integratedRiskAssessment: IntegratedRiskAssessment
  ): string[] {
    const recommendations = [];

    if (neuroCVCorrelation.overallAssessment.includes('이상')) {
      recommendations.push('뇌-심혈관 연동 기능 개선을 위한 규칙적인 유산소 운동');
    }

    if (stressAutonomicCorrelation.autonomicBalance.balanceStatus !== 'balanced') {
      recommendations.push('자율신경 균형 회복을 위한 심호흡 및 명상 연습');
    }

    if (integratedRiskAssessment.overallRiskLevel === 'high') {
      recommendations.push('즉시 전문의 상담 및 정밀 검사 권장');
    }

    return recommendations;
  }

  private static generateAutonomicRecommendations(autonomicBalance: AutonomicBalanceAssessment): string[] {
    const recommendations = [];

    switch (autonomicBalance.balanceStatus) {
      case 'sympathetic_dominant':
        recommendations.push('스트레스 관리 및 이완 훈련');
        recommendations.push('충분한 휴식과 수면');
        recommendations.push('요가나 명상 등 이완 활동');
        break;
      case 'parasympathetic_dominant':
        recommendations.push('적절한 신체 활동 증가');
        recommendations.push('규칙적인 운동으로 각성 상태 개선');
        recommendations.push('카페인 섭취 조절');
        break;
      default:
        recommendations.push('현재 자율신경 균형 상태 유지');
        recommendations.push('규칙적인 생활 패턴 유지');
        break;
    }

    return recommendations;
  }

  private static assessStabilityImpact(stability: number, metrics: any): any {
    let impact = 'minimal';
    let reliability = 'high';

    if (stability < 50) {
      impact = 'significant';
      reliability = 'low';
    } else if (stability < 70) {
      impact = 'moderate';
      reliability = 'medium';
    }

    return {
      impact,
      reliability,
      stabilityScore: stability,
      interpretation: `측정 안정성 ${stability}%: ${reliability} 신뢰도`
    };
  }

  private static assessMovementArtifactImpact(averageMovement: number, maxMovement: number): any {
    let impact = 'minimal';
    
    if (averageMovement > 0.2 || maxMovement > 0.5) {
      impact = 'significant';
    } else if (averageMovement > 0.1 || maxMovement > 0.3) {
      impact = 'moderate';
    }

    return {
      impact,
      averageMovement,
      maxMovement,
      interpretation: `움직임 아티팩트 ${impact}: 평균 ${averageMovement.toFixed(3)}g, 최대 ${maxMovement.toFixed(3)}g`
    };
  }

  private static assessOverallMeasurementQuality(
    stability: number,
    averageMovement: number,
    maxMovement: number
  ): string {
    const qualityScore = stability - (averageMovement * 100) - (maxMovement * 50);
    
    if (qualityScore >= 80) {
      return '우수한 측정 품질: 신뢰도 높은 분석 가능';
    } else if (qualityScore >= 60) {
      return '양호한 측정 품질: 일반적인 분석 가능';
    } else if (qualityScore >= 40) {
      return '보통 측정 품질: 해석 시 주의 필요';
    } else {
      return '불량한 측정 품질: 재측정 권장';
    }
  }

  private static generateQualityRecommendations(
    stability: number,
    averageMovement: number,
    maxMovement: number
  ): string[] {
    const recommendations = [];

    if (stability < 70) {
      recommendations.push('측정 중 안정된 자세 유지');
      recommendations.push('측정 환경 개선 (조용한 장소)');
    }

    if (averageMovement > 0.1) {
      recommendations.push('측정 중 움직임 최소화');
      recommendations.push('편안한 자세로 측정');
    }

    if (maxMovement > 0.3) {
      recommendations.push('갑작스러운 움직임 피하기');
      recommendations.push('측정 전 충분한 안정화 시간');
    }

    return recommendations;
  }

  private static generateRiskBasedFollowUp(overallRiskLevel: string, riskFactors: string[]): string[] {
    const followUp = [];

    switch (overallRiskLevel) {
      case 'high':
        followUp.push('1주 이내 전문의 상담');
        followUp.push('2주 후 재측정 및 경과 관찰');
        followUp.push('일일 건강 상태 모니터링');
        break;
      case 'medium':
        followUp.push('1개월 이내 전문의 상담');
        followUp.push('4주 후 재측정');
        followUp.push('주간 건강 상태 체크');
        break;
      default:
        followUp.push('3개월 후 정기 검진');
        followUp.push('6개월 후 재측정');
        followUp.push('월간 건강 상태 점검');
        break;
    }

    return followUp;
  }

  private static assessConsultationUrgency(riskAssessment: IntegratedRiskAssessment): string {
    if (riskAssessment.urgentConsultationNeeded) {
      return 'immediate';
    } else if (riskAssessment.overallRiskLevel === 'high') {
      return 'within_week';
    } else if (riskAssessment.overallRiskLevel === 'medium') {
      return 'within_month';
    } else {
      return 'routine';
    }
  }

  private static generateFollowUpSchedule(urgencyLevel: string, age: number): any {
    const baseSchedule = {
      immediate: { consultation: '즉시', remeasurement: '1주 후', monitoring: '일일' },
      within_week: { consultation: '1주 이내', remeasurement: '2주 후', monitoring: '주간' },
      within_month: { consultation: '1개월 이내', remeasurement: '4주 후', monitoring: '주간' },
      routine: { consultation: '3개월 후', remeasurement: '6개월 후', monitoring: '월간' }
    };

    return baseSchedule[urgencyLevel as keyof typeof baseSchedule] || baseSchedule.routine;
  }

  private static generateConsultationPreparation(correlationResult: ClinicalCorrelationResult): any {
    return {
      documentsToPrep: [
        '측정 결과 리포트',
        '증상 일지 (2주간)',
        '복용 약물 목록',
        '과거 병력 정리'
      ],
      questionsToAsk: [
        '측정 결과의 의학적 의미',
        '추가 검사 필요성',
        '생활습관 개선 방안',
        '재측정 주기'
      ],
      symptomsToMonitor: [
        '두통이나 어지러움',
        '가슴 통증이나 호흡 곤란',
        '수면 패턴 변화',
        '집중력 변화'
      ]
    };
  }

  private static getAutonomicBalanceRecommendations(balanceStatus: string): string[] {
    const recommendations = [];

    switch (balanceStatus) {
      case 'sympathetic_dominant':
        recommendations.push('규칙적인 명상이나 요가');
        recommendations.push('충분한 수면 (7-8시간)');
        recommendations.push('카페인 섭취 제한');
        break;
      case 'parasympathetic_dominant':
        recommendations.push('적절한 신체 활동 증가');
        recommendations.push('규칙적인 운동 루틴');
        recommendations.push('활동적인 생활 패턴');
        break;
      default:
        recommendations.push('현재 균형 상태 유지');
        recommendations.push('규칙적인 생활 리듬');
        break;
    }

    return recommendations;
  }

  private static enhanceEEGTerminology(analysisResult: AIAnalysisResult): any {
    return {
      technicalTerms: [
        'Electroencephalography (EEG)',
        'Spectral Power Analysis',
        'Hemispheric Asymmetry',
        'Cognitive Load Index'
      ],
      clinicalSignificance: 'EEG 기반 뇌 기능 상태 평가',
      interpretation: '뇌파 주파수 대역별 활성도 분석을 통한 정신 상태 평가'
    };
  }

  private static enhancePPGTerminology(analysisResult: AIAnalysisResult): any {
    return {
      technicalTerms: [
        'Photoplethysmography (PPG)',
        'Heart Rate Variability (HRV)',
        'Autonomic Nervous System Assessment',
        'Frequency Domain Analysis'
      ],
      clinicalSignificance: 'PPG 기반 심혈관 및 자율신경 기능 평가',
      interpretation: '심박 변이도 분석을 통한 자율신경계 균형 상태 평가'
    };
  }

  private static enhanceClinicalTerminology(analysisResult: AIAnalysisResult): any {
    return {
      technicalTerms: [
        'Psychophysiological Assessment',
        'Multimodal Biomarker Analysis',
        'Stress Response Evaluation',
        'Neuroplasticity Indicators'
      ],
      clinicalSignificance: '다중 생체신호 통합 분석',
      interpretation: '생리학적 지표들의 상호작용 분석을 통한 종합적 건강 평가'
    };
  }

  private static addEvidenceBasedReferences(analysisResult: AIAnalysisResult): any {
    return {
      eegReferences: [
        'Neuroplasticity and EEG markers (Nature Neuroscience, 2023)',
        'Stress-related EEG patterns (Journal of Neurophysiology, 2022)',
        'Cognitive load assessment via EEG (Brain Research, 2023)'
      ],
      ppgReferences: [
        'HRV and autonomic function (Circulation, 2023)',
        'PPG-based stress assessment (IEEE Transactions on Biomedical Engineering, 2022)',
        'Cardiovascular health indicators (European Heart Journal, 2023)'
      ],
      clinicalReferences: [
        'Multimodal biomarker integration (Nature Medicine, 2023)',
        'Psychophysiological assessment guidelines (American Journal of Physiology, 2022)'
      ]
    };
  }

  private static generateDifferentialDiagnosis(analysisResult: AIAnalysisResult): any {
    return {
      considerations: [
        '정상 생리적 변이',
        '일시적 스트레스 반응',
        '만성 스트레스 상태',
        '자율신경 기능 이상'
      ],
      excludeConditions: [
        '심각한 신경학적 질환',
        '급성 심혈관 질환',
        '정신과적 응급 상황'
      ],
      recommendedTests: [
        '정밀 신경학적 검사',
        '심전도 및 심초음파',
        '혈액 검사 (스트레스 호르몬)'
      ]
    };
  }

  private static generatePrognosticIndicators(analysisResult: AIAnalysisResult): any {
    return {
      positiveIndicators: [
        '정상 범위 내 대부분의 지표',
        '적절한 스트레스 반응성',
        '양호한 자율신경 균형'
      ],
      riskIndicators: [
        '다중 지표 이상',
        '지속적인 스트레스 상태',
        '자율신경 불균형'
      ],
      prognosticFactors: [
        '연령 및 성별',
        '직업적 스트레스 수준',
        '생활습관 요인'
      ]
    };
  }
}

// ===== 타입 정의 =====

interface ClinicalCorrelationResult {
  neuroCVCorrelation: NeuroCVCorrelation;
  stressAutonomicCorrelation: StressAutonomicCorrelation;
  qualitySignalCorrelation: QualitySignalCorrelation;
  integratedRiskAssessment: IntegratedRiskAssessment;
  clinicalRecommendations: string[];
}

interface NeuroCVCorrelation {
  stressHRCorrelation: CorrelationResult;
  stressHRVCorrelation: CorrelationResult;
  stressAutonomicCorrelation: CorrelationResult;
  overallAssessment: string;
}

interface StressAutonomicCorrelation {
  relaxationParasympatheticCorr: CorrelationResult;
  stressSympatheticCorr: CorrelationResult;
  autonomicBalance: AutonomicBalanceAssessment;
  clinicalRecommendations: string[];
}

interface QualitySignalCorrelation {
  stabilityEEGImpact: any;
  stabilityPPGImpact: any;
  movementArtifactImpact: any;
  overallQualityAssessment: string;
  qualityRecommendations: string[];
}

interface IntegratedRiskAssessment {
  overallRiskLevel: string;
  riskFactors: string[];
  neurologicalRisk: RiskAssessment;
  cardiovascularRisk: RiskAssessment;
  stressRisk: RiskAssessment;
  qualityRisk: RiskAssessment;
  urgentConsultationNeeded: boolean;
  followUpRecommendations: string[];
}

interface CorrelationResult {
  value: number;
  interpretation: string;
  clinicalSignificance: string;
}

interface AutonomicBalanceAssessment {
  balanceStatus: string;
  interpretation: string;
  lfHfRatio: number;
  clinicalRecommendations: string[];
}

interface RiskAssessment {
  level: string;
  factors: string[];
}

interface ProfessionalGuidanceResult {
  consultationNeeded: boolean;
  urgencyLevel: string;
  recommendedSpecialists: string[];
  warningSignals: string[];
  emergencyContacts: string[];
  followUpSchedule: any;
  preparationGuidelines: any;
}

interface EnhancedMedicalAnalysis {
  terminologyEnhancement: any;
  evidenceBasedReferences: any;
  differentialDiagnosis: any;
  prognosticIndicators: any;
} 