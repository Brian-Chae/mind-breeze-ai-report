/**
 * ACC 기반 고급 측정 품질 평가 시스템
 * - 신호 안정성 분석
 * - 노이즈 레벨 평가
 * - 움직임 패턴 분석
 * - 종합 품질 점수 계산
 */

export interface QualityMetrics {
  stability: number;
  intensity: number;
  averageMovement: number;
  maxMovement: number;
  tremor: number;
  postureStability: number;
  rawData?: number[]; // 원시 가속도 데이터 (선택적)
}

export interface AdvancedQualityResult {
  overallScore: number; // 0-100 종합 품질 점수
  reliability: 'excellent' | 'good' | 'fair' | 'poor';
  confidenceLevel: number; // 0-100 신뢰도 수준
  
  qualityFactors: {
    signalStability: number; // 신호 안정성 점수
    noiseLevel: number; // 노이즈 레벨 점수
    movementConsistency: number; // 움직임 일관성 점수
    postureQuality: number; // 자세 품질 점수
    dataIntegrity: number; // 데이터 무결성 점수
  };
  
  detailedAnalysis: {
    stabilityAnalysis: string;
    noiseAnalysis: string;
    movementAnalysis: string;
    postureAnalysis: string;
    integrityAnalysis: string;
  };
  
  warnings: string[];
  recommendations: string[];
  
  // 측정 환경 분석
  environmentalFactors: {
    ambientMovement: 'low' | 'medium' | 'high';
    measurementConsistency: 'excellent' | 'good' | 'fair' | 'poor';
    externalInterference: 'none' | 'minimal' | 'moderate' | 'significant';
  };
  
  // 재측정 권고사항
  remeasurementSuggestions: {
    isRecommended: boolean;
    reasons: string[];
    improvementTips: string[];
  };
}

export class AdvancedQualityAssessmentService {
  
  /**
   * 종합 품질 평가 수행
   */
  static assessQuality(accMetrics: QualityMetrics): AdvancedQualityResult {
    const qualityFactors = this.calculateQualityFactors(accMetrics);
    const overallScore = this.calculateOverallScore(qualityFactors);
    const reliability = this.determineReliability(overallScore);
    const confidenceLevel = this.calculateConfidenceLevel(qualityFactors);
    
    const detailedAnalysis = this.generateDetailedAnalysis(accMetrics, qualityFactors);
    const warnings = this.generateWarnings(accMetrics, qualityFactors);
    const recommendations = this.generateRecommendations(accMetrics, qualityFactors);
    
    const environmentalFactors = this.analyzeEnvironmentalFactors(accMetrics);
    const remeasurementSuggestions = this.generateRemeasurementSuggestions(
      overallScore, 
      qualityFactors, 
      warnings
    );
    
    return {
      overallScore,
      reliability,
      confidenceLevel,
      qualityFactors,
      detailedAnalysis,
      warnings,
      recommendations,
      environmentalFactors,
      remeasurementSuggestions
    };
  }
  
  /**
   * 품질 요소별 점수 계산
   */
  private static calculateQualityFactors(accMetrics: QualityMetrics): AdvancedQualityResult['qualityFactors'] {
    return {
      signalStability: this.calculateSignalStability(accMetrics),
      noiseLevel: this.calculateNoiseLevel(accMetrics),
      movementConsistency: this.calculateMovementConsistency(accMetrics),
      postureQuality: this.calculatePostureQuality(accMetrics),
      dataIntegrity: this.calculateDataIntegrity(accMetrics)
    };
  }
  
  /**
   * 신호 안정성 점수 계산
   */
  private static calculateSignalStability(accMetrics: QualityMetrics): number {
    const stability = accMetrics.stability || 0;
    const tremor = accMetrics.tremor || 0;
    
    // 기본 안정성 점수 (0-100) - 20점 완화
    let stabilityScore = Math.min(stability + 20, 100);
    
    // 떨림 정도에 따른 감점 - 완화 (최대 10점 감점)
    const tremorPenalty = Math.min(tremor * 0.3, 10);
    stabilityScore = Math.max(stabilityScore - tremorPenalty, 0);
    
    // 안정성 구간별 가중치 적용 - 완화
    if (stabilityScore >= 70) { // 90 → 70
      return Math.min(stabilityScore * 1.1, 100); // 우수한 안정성 보너스
    } else if (stabilityScore >= 50) { // 70 → 50
      return stabilityScore;
    } else if (stabilityScore >= 30) { // 50 → 30
      return stabilityScore * 0.95; // 보통 안정성 감점 완화
    } else {
      return stabilityScore * 0.9; // 낮은 안정성 감점 완화
    }
  }
  
  /**
   * 노이즈 레벨 점수 계산
   */
  private static calculateNoiseLevel(accMetrics: QualityMetrics): number {
    const intensity = accMetrics.intensity || 0;
    const maxMovement = accMetrics.maxMovement || 0;
    const averageMovement = accMetrics.averageMovement || 0;
    
    // 강도 기반 노이즈 평가 - 완화
    let noiseScore = 100;
    
    // 강도가 높을수록 노이즈 증가 - 기준 완화
    if (intensity > 85) { // 75 → 85
      noiseScore -= 25; // 심각한 노이즈 (40 → 25)
    } else if (intensity > 65) { // 50 → 65
      noiseScore -= 15; // 중간 노이즈 (25 → 15)
    } else if (intensity > 40) { // 25 → 40
      noiseScore -= 5; // 경미한 노이즈 (10 → 5)
    }
    
    // 최대 움직임 vs 평균 움직임 비율로 노이즈 스파이크 감지 - 완화
    const movementRatio = averageMovement > 0 ? maxMovement / averageMovement : 1;
    if (movementRatio > 8) { // 5 → 8
      noiseScore -= 10; // 큰 스파이크 감지 (20 → 10)
    } else if (movementRatio > 5) { // 3 → 5
      noiseScore -= 5; // 중간 스파이크 감지 (10 → 5)
    }
    
    return Math.max(noiseScore, 0);
  }
  
  /**
   * 움직임 일관성 점수 계산 - 극도로 완화 (편안한 앉은 자세에서 90점대 달성)
   */
  private static calculateMovementConsistency(accMetrics: QualityMetrics): number {
    const averageMovement = accMetrics.averageMovement || 0;
    const maxMovement = accMetrics.maxMovement || 0;
    const tremor = accMetrics.tremor || 0;
    
    // 기본 점수를 95점으로 시작 (편안한 상태에서 높은 점수 보장)
    let consistencyScore = 95;
    
    // 평균 움직임 기준 평가 - 극도로 완화 (일상적인 미세 움직임 완전 허용)
    if (averageMovement > 2.0) { // 1.0 → 2.0 (매우 심한 움직임만 감점)
      consistencyScore -= 10; // 과도한 움직임 (15 → 10)
    } else if (averageMovement > 1.0) { // 0.5 → 1.0 (중간 수준 움직임)
      consistencyScore -= 3; // 중간 움직임 (5 → 3)
    } else if (averageMovement > 0.6) { // 0.3 → 0.6 (경미한 움직임)
      consistencyScore -= 1; // 경미한 움직임 (1점 유지)
    }
    // 0.6g 이하는 완전히 정상적인 미세 움직임으로 간주하여 감점 없음
    
    // 움직임 변동성 평가 - 극도로 완화
    const movementVariability = maxMovement - averageMovement;
    if (movementVariability > 2.5) { // 1.5 → 2.5 (매우 큰 변동성만 감점)
      consistencyScore -= 5; // 높은 변동성 (10 → 5)
    } else if (movementVariability > 1.5) { // 0.8 → 1.5 (중간 변동성)
      consistencyScore -= 2; // 중간 변동성 (3 → 2)
    }
    // 1.5g 이하 변동성은 완전히 정상 범위로 간주
    
    // 떨림 정도 반영 - 극도로 완화 (자연스러운 생리적 떨림 완전 허용)
    if (tremor > 80) { // 50 → 80 (매우 심각한 떨림만 감점)
      consistencyScore -= Math.min((tremor - 80) * 0.05, 3); // 최대 3점만 감점 (5 → 3)
    }
    
    return Math.max(consistencyScore, 0);
  }
  
  /**
   * 자세 품질 점수 계산 - 극도로 완화 (편안한 앉은 자세에서 90점대 달성)
   */
  private static calculatePostureQuality(accMetrics: QualityMetrics): number {
    const postureStability = accMetrics.postureStability || 0;
    const averageMovement = accMetrics.averageMovement || 0;
    
    // 기본 자세 점수 극도로 완화 (40점 보너스 추가)
    let postureScore = Math.min(postureStability + 40, 100);
    
    // 평균 움직임이 자세 안정성에 미치는 영향 - 극도로 완화
    if (averageMovement > 1.5) { // 0.8 → 1.5 (매우 큰 움직임만 영향)
      postureScore *= 0.97; // 움직임으로 인한 자세 불안정 (0.95 → 0.97)
    } else if (averageMovement > 1.0) { // 0.5 → 1.0 (중간 움직임)
      postureScore *= 0.99; // 경미한 자세 불안정 (0.98 → 0.99)
    }
    // 1.0g 이하 움직임은 자세에 완전히 영향 없음으로 간주
    
    // 자세 안정성 구간별 평가 - 극도로 완화
    if (postureScore >= 50) { // 60 → 50 (더욱 관대한 기준)
      return Math.min(postureScore * 1.15, 100); // 우수한 자세 보너스 증가 (1.1 → 1.15)
    } else if (postureScore >= 25) { // 30 → 25 (더욱 관대한 기준)
      return Math.min(postureScore * 1.1, 100); // 보통 자세에도 더 많은 보너스 (1.05 → 1.1)
    } else {
      return postureScore * 0.99; // 불안정한 자세 감점 최소화 (0.98 → 0.99)
    }
  }
  
  /**
   * 데이터 무결성 점수 계산
   */
  private static calculateDataIntegrity(accMetrics: QualityMetrics): number {
    let integrityScore = 100;
    
    // 필수 데이터 존재 여부 확인 - 완화
    const requiredFields = ['stability', 'intensity', 'averageMovement', 'postureStability'];
    const missingFields = requiredFields.filter(field => 
      accMetrics[field as keyof QualityMetrics] === undefined || 
      accMetrics[field as keyof QualityMetrics] === null
    );
    
    integrityScore -= missingFields.length * 8; // 필드당 감점 완화 (15 → 8)
    
    // 데이터 범위 유효성 검사 - 완화
    if (accMetrics.stability < 0 || accMetrics.stability > 100) {
      integrityScore -= 5; // 10 → 5
    }
    if (accMetrics.intensity < 0 || accMetrics.intensity > 100) {
      integrityScore -= 5; // 10 → 5
    }
    if (accMetrics.averageMovement < 0 || accMetrics.averageMovement > 10) {
      integrityScore -= 5; // 10 → 5
    }
    
    // 데이터 논리적 일관성 검사 - 완화
    if (accMetrics.maxMovement < accMetrics.averageMovement) {
      integrityScore -= 8; // 논리적 불일치 (15 → 8)
    }
    
    return Math.max(integrityScore, 0);
  }
  
  /**
   * 종합 품질 점수 계산
   */
  private static calculateOverallScore(qualityFactors: AdvancedQualityResult['qualityFactors']): number {
    const weights = {
      signalStability: 0.3,
      noiseLevel: 0.25,
      movementConsistency: 0.2,
      postureQuality: 0.15,
      dataIntegrity: 0.1
    };
    
    const weightedScore = 
      qualityFactors.signalStability * weights.signalStability +
      qualityFactors.noiseLevel * weights.noiseLevel +
      qualityFactors.movementConsistency * weights.movementConsistency +
      qualityFactors.postureQuality * weights.postureQuality +
      qualityFactors.dataIntegrity * weights.dataIntegrity;
    
    return Math.round(Math.max(Math.min(weightedScore, 100), 0));
  }
  
  /**
   * 신뢰도 등급 결정 - 극도로 완화 (편안한 앉은 자세에서 excellent 달성)
   */
  private static determineReliability(overallScore: number): AdvancedQualityResult['reliability'] {
    if (overallScore >= 75) return 'excellent'; // 80 → 75 (더욱 관대한 기준)
    if (overallScore >= 60) return 'good'; // 65 → 60
    if (overallScore >= 40) return 'fair'; // 45 → 40
    return 'poor';
  }
  
  /**
   * 신뢰도 수준 계산
   */
  private static calculateConfidenceLevel(qualityFactors: AdvancedQualityResult['qualityFactors']): number {
    const minScore = Math.min(...Object.values(qualityFactors));
    const avgScore = Object.values(qualityFactors).reduce((a, b) => a + b, 0) / Object.values(qualityFactors).length;
    
    // 최소 점수와 평균 점수를 고려한 신뢰도
    const confidenceLevel = (minScore * 0.4 + avgScore * 0.6);
    
    return Math.round(Math.max(Math.min(confidenceLevel, 100), 0));
  }
  
  /**
   * 상세 분석 생성
   */
  private static generateDetailedAnalysis(
    accMetrics: QualityMetrics, 
    qualityFactors: AdvancedQualityResult['qualityFactors']
  ): AdvancedQualityResult['detailedAnalysis'] {
    return {
      stabilityAnalysis: this.generateStabilityAnalysis(accMetrics, qualityFactors.signalStability),
      noiseAnalysis: this.generateNoiseAnalysis(accMetrics, qualityFactors.noiseLevel),
      movementAnalysis: this.generateMovementAnalysis(accMetrics, qualityFactors.movementConsistency),
      postureAnalysis: this.generatePostureAnalysis(accMetrics, qualityFactors.postureQuality),
      integrityAnalysis: this.generateIntegrityAnalysis(accMetrics, qualityFactors.dataIntegrity)
    };
  }
  
  private static generateStabilityAnalysis(accMetrics: QualityMetrics, score: number): string {
    const stability = accMetrics.stability || 0;
    const tremor = accMetrics.tremor || 0;
    
    if (score >= 90) {
      return `매우 안정적인 측정 환경입니다. 안정성 ${stability.toFixed(1)}%, 떨림 ${tremor.toFixed(1)}%로 최적의 측정 조건을 유지했습니다.`;
    } else if (score >= 70) {
      return `안정적인 측정 환경입니다. 안정성 ${stability.toFixed(1)}%로 신뢰할 수 있는 측정이 이루어졌습니다.`;
    } else if (score >= 50) {
      return `보통 수준의 안정성입니다. 안정성 ${stability.toFixed(1)}%, 떨림 ${tremor.toFixed(1)}%로 일부 움직임이 감지되었습니다.`;
    } else {
      return `불안정한 측정 환경입니다. 안정성 ${stability.toFixed(1)}%로 상당한 움직임이 감지되어 결과 해석에 주의가 필요합니다.`;
    }
  }
  
  private static generateNoiseAnalysis(accMetrics: QualityMetrics, score: number): string {
    const intensity = accMetrics.intensity || 0;
    const maxMovement = accMetrics.maxMovement || 0;
    
    if (score >= 90) {
      return `매우 낮은 노이즈 레벨입니다. 강도 ${intensity.toFixed(1)}%로 깨끗한 신호가 측정되었습니다.`;
    } else if (score >= 70) {
      return `낮은 노이즈 레벨입니다. 강도 ${intensity.toFixed(1)}%로 양호한 신호 품질을 보입니다.`;
    } else if (score >= 50) {
      return `중간 수준의 노이즈가 감지되었습니다. 강도 ${intensity.toFixed(1)}%, 최대 움직임 ${maxMovement.toFixed(3)}g로 일부 간섭이 있었습니다.`;
    } else {
      return `높은 노이즈 레벨입니다. 강도 ${intensity.toFixed(1)}%로 상당한 신호 간섭이 감지되었습니다.`;
    }
  }
  
  private static generateMovementAnalysis(accMetrics: QualityMetrics, score: number): string {
    const averageMovement = accMetrics.averageMovement || 0;
    const maxMovement = accMetrics.maxMovement || 0;
    
    if (score >= 90) {
      return `매우 일관된 움직임 패턴입니다. 평균 움직임 ${averageMovement.toFixed(3)}g로 이상적인 정적 상태를 유지했습니다.`;
    } else if (score >= 80) {
      return `우수한 움직임 일관성입니다. 평균 움직임 ${averageMovement.toFixed(3)}g로 안정적인 측정이 이루어졌습니다.`;
    } else if (score >= 70) {
      return `양호한 움직임 패턴입니다. 평균 움직임 ${averageMovement.toFixed(3)}g로 신뢰할 수 있는 측정 상태입니다.`;
    } else if (score >= 50) {
      return `보통 수준의 움직임 변동성입니다. 평균 ${averageMovement.toFixed(3)}g, 최대 ${maxMovement.toFixed(3)}g로 일부 움직임이 있었습니다.`;
    } else {
      return `높은 움직임 변동성입니다. 평균 ${averageMovement.toFixed(3)}g, 최대 ${maxMovement.toFixed(3)}g로 상당한 움직임이 감지되었습니다.`;
    }
  }
  
  private static generatePostureAnalysis(accMetrics: QualityMetrics, score: number): string {
    const postureStability = accMetrics.postureStability || 0;
    
    if (score >= 90) {
      return `매우 안정적인 자세입니다. 자세 안정성 ${postureStability.toFixed(1)}%로 이상적인 측정 자세를 유지했습니다.`;
    } else if (score >= 80) {
      return `우수한 자세 안정성입니다. 자세 안정성 ${postureStability.toFixed(1)}%로 매우 좋은 측정 환경이었습니다.`;
    } else if (score >= 70) {
      return `양호한 자세입니다. 자세 안정성 ${postureStability.toFixed(1)}%로 안정적인 측정이 이루어졌습니다.`;
    } else if (score >= 50) {
      return `보통 수준의 자세 안정성입니다. 자세 안정성 ${postureStability.toFixed(1)}%로 일부 자세 변화가 있었습니다.`;
    } else {
      return `불안정한 자세입니다. 자세 안정성 ${postureStability.toFixed(1)}%로 상당한 자세 변화가 감지되었습니다.`;
    }
  }
  
  private static generateIntegrityAnalysis(accMetrics: QualityMetrics, score: number): string {
    if (score >= 95) {
      return `완벽한 데이터 무결성입니다. 모든 측정값이 정상 범위 내에 있고 논리적으로 일관됩니다.`;
    } else if (score >= 80) {
      return `높은 데이터 무결성입니다. 측정 데이터가 신뢰할 수 있는 수준입니다.`;
    } else if (score >= 60) {
      return `보통 수준의 데이터 무결성입니다. 일부 데이터 이상이 감지되었으나 분석 가능합니다.`;
    } else {
      return `낮은 데이터 무결성입니다. 데이터 이상이 감지되어 결과 해석에 주의가 필요합니다.`;
    }
  }
  
  /**
   * 경고사항 생성
   */
  private static generateWarnings(
    accMetrics: QualityMetrics, 
    qualityFactors: AdvancedQualityResult['qualityFactors']
  ): string[] {
    const warnings: string[] = [];
    
    if (qualityFactors.signalStability < 50) {
      warnings.push('신호 안정성이 낮습니다. 측정 중 과도한 움직임이 감지되었습니다.');
    }
    
    if (qualityFactors.noiseLevel < 60) {
      warnings.push('높은 노이즈 레벨이 감지되었습니다. 측정 환경을 개선해주세요.');
    }
    
    if (qualityFactors.movementConsistency < 40) { // 60 → 40 (완화)
      warnings.push('움직임 일관성이 낮습니다. 더 정적인 상태에서 측정해주세요.');
    }
    
    if (qualityFactors.postureQuality < 40) { // 60 → 40 (완화)
      warnings.push('자세 안정성이 부족합니다. 편안한 자세로 재측정을 권장합니다.');
    }
    
    if (qualityFactors.dataIntegrity < 80) {
      warnings.push('데이터 무결성 문제가 감지되었습니다. 측정 결과 해석에 주의해주세요.');
    }
    
    if (accMetrics.intensity > 75) {
      warnings.push('측정 중 강한 외부 간섭이 감지되었습니다.');
    }
    
    if (accMetrics.averageMovement > 0.8) { // 0.3 → 0.8 (완화)
      warnings.push('측정 중 활발한 움직임이 감지되었습니다. 정적 상태 유지가 필요합니다.');
    }
    
    return warnings;
  }
  
  /**
   * 권장사항 생성
   */
  private static generateRecommendations(
    accMetrics: QualityMetrics, 
    qualityFactors: AdvancedQualityResult['qualityFactors']
  ): string[] {
    const recommendations: string[] = [];
    
    if (qualityFactors.signalStability < 70) {
      recommendations.push('측정 시 편안한 자세로 앉아 움직임을 최소화해주세요.');
    }
    
    if (qualityFactors.noiseLevel < 70) {
      recommendations.push('조용하고 안정적인 환경에서 측정해주세요.');
    }
    
    if (qualityFactors.movementConsistency < 50) { // 70 → 50 (완화)
      recommendations.push('측정 중 일정한 자세를 유지하고 갑작스러운 움직임을 피해주세요.');
    }
    
    if (qualityFactors.postureQuality < 50) { // 70 → 50 (완화)
      recommendations.push('등받이가 있는 의자에 편안히 앉아 측정해주세요.');
    }
    
    if (accMetrics.tremor > 30) {
      recommendations.push('손목과 팔의 긴장을 풀고 자연스러운 자세로 측정해주세요.');
    }
    
    if (accMetrics.intensity > 50) {
      recommendations.push('측정 중 외부 진동이나 충격을 피해주세요.');
    }
    
    // 일반적인 권장사항
    if (recommendations.length === 0) {
      recommendations.push('현재 측정 품질이 우수합니다. 동일한 환경에서 지속적으로 측정해주세요.');
    }
    
    return recommendations;
  }
  
  /**
   * 환경 요인 분석
   */
  private static analyzeEnvironmentalFactors(accMetrics: QualityMetrics): AdvancedQualityResult['environmentalFactors'] {
    const averageMovement = accMetrics.averageMovement || 0;
    const intensity = accMetrics.intensity || 0;
    const stability = accMetrics.stability || 0;
    
    // 주변 움직임 수준 - 완화
    let ambientMovement: 'low' | 'medium' | 'high';
    if (averageMovement < 0.3) { // 0.05 → 0.3 (완화)
      ambientMovement = 'low';
    } else if (averageMovement < 0.8) { // 0.2 → 0.8 (완화)
      ambientMovement = 'medium';
    } else {
      ambientMovement = 'high';
    }
    
    // 측정 일관성
    let measurementConsistency: 'excellent' | 'good' | 'fair' | 'poor';
    if (stability >= 90) {
      measurementConsistency = 'excellent';
    } else if (stability >= 70) {
      measurementConsistency = 'good';
    } else if (stability >= 50) {
      measurementConsistency = 'fair';
    } else {
      measurementConsistency = 'poor';
    }
    
    // 외부 간섭 수준
    let externalInterference: 'none' | 'minimal' | 'moderate' | 'significant';
    if (intensity < 20) {
      externalInterference = 'none';
    } else if (intensity < 40) {
      externalInterference = 'minimal';
    } else if (intensity < 60) {
      externalInterference = 'moderate';
    } else {
      externalInterference = 'significant';
    }
    
    return {
      ambientMovement,
      measurementConsistency,
      externalInterference
    };
  }
  
  /**
   * 재측정 권고사항 생성
   */
  private static generateRemeasurementSuggestions(
    overallScore: number,
    qualityFactors: AdvancedQualityResult['qualityFactors'],
    warnings: string[]
  ): AdvancedQualityResult['remeasurementSuggestions'] {
    const isRecommended = overallScore < 40 || qualityFactors.signalStability < 30; // 60 → 40, 50 → 30 (완화)
    const reasons: string[] = [];
    const improvementTips: string[] = [];
    
    if (isRecommended) {
      if (overallScore < 40) { // 60 → 40 (완화)
        reasons.push('전반적인 측정 품질이 낮습니다');
      }
      if (qualityFactors.signalStability < 30) { // 50 → 30 (완화)
        reasons.push('신호 안정성이 부족합니다');
      }
      if (qualityFactors.noiseLevel < 30) { // 50 → 30 (완화)
        reasons.push('높은 노이즈 레벨이 감지되었습니다');
      }
      if (qualityFactors.movementConsistency < 30) { // 50 → 30 (완화)
        reasons.push('움직임 일관성이 낮습니다');
      }
      
      // 개선 팁
      improvementTips.push('조용하고 안정적인 환경에서 측정하세요');
      improvementTips.push('편안한 자세로 앉아 움직임을 최소화하세요');
      improvementTips.push('측정 중 대화나 다른 활동을 피하세요');
      improvementTips.push('디바이스를 안정적으로 착용하세요');
      improvementTips.push('측정 전 충분한 휴식을 취하세요');
    }
    
    return {
      isRecommended,
      reasons,
      improvementTips
    };
  }
  
  /**
   * 품질 점수를 텍스트로 변환
   */
  static getQualityGrade(score: number): string {
    if (score >= 90) return 'A+ (최우수)';
    if (score >= 80) return 'A (우수)';
    if (score >= 70) return 'B (양호)';
    if (score >= 60) return 'C (보통)';
    if (score >= 50) return 'D (미흡)';
    return 'F (불량)';
  }
  
  /**
   * 신뢰도를 한국어로 변환
   */
  static getReliabilityText(reliability: AdvancedQualityResult['reliability']): string {
    const reliabilityMap = {
      'excellent': '매우 높음',
      'good': '높음',
      'fair': '보통',
      'poor': '낮음'
    };
    return reliabilityMap[reliability];
  }
} 