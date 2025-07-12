/**
 * AI 응답 다층 검증 시스템
 * 구조, 타입, 범위, 내용 검증을 통한 AI 응답 품질 보장
 */

import { ComprehensiveAnalysisResult } from '../services/ComprehensiveAnalysisService';
import { 
  MentalHealthRiskAnalysis, 
  StandardizedScore, 
  ScoreGrade 
} from '../types/redesigned-architecture';

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100, 응답 품질 점수
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

export interface ValidationError {
  type: 'structure' | 'type' | 'range' | 'content' | 'medical' | 'consistency';
  field: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface ValidationWarning {
  type: 'quality' | 'consistency' | 'completeness';
  field: string;
  message: string;
}

export class ResponseValidator {
  /**
   * 🆕 정신건강 위험도 분석 응답 검증
   */
  static validateMentalHealthRiskResponse(data: any): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      score: 100,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // 1. 기본 구조 검증
    this.validateMentalHealthStructure(data, result);

    // 2. 표준화된 점수 검증
    this.validateStandardizedScores(data, result);

    // 3. 위험도 평가 검증
    this.validateRiskAssessments(data, result);

    // 4. 권고사항 검증
    this.validateRecommendations(data, result);

    // 5. 일관성 검증
    this.validateMentalHealthConsistency(data, result);

    // 최종 점수 계산
    result.score = this.calculateQualityScore(result);
    result.isValid = result.score >= 70 && result.errors.filter(e => e.severity === 'critical').length === 0;

    return result;
  }

  /**
   * 정신건강 위험도 분석 구조 검증
   */
  private static validateMentalHealthStructure(data: any, result: ValidationResult): void {
    const requiredFields = [
      'depressionRisk',
      'adhdFocusRisk', 
      'burnoutRisk',
      'impulsivityRisk',
      'stressRisk',
      'overallMentalHealthScore',
      'riskFactors',
      'protectiveFactors',
      'recommendations',
      'analysisTimestamp',
      'confidence',
      'clinicalValidation'
    ];

    for (const field of requiredFields) {
      if (!(field in data) || data[field] === undefined || data[field] === null) {
        result.errors.push({
          type: 'structure',
          field,
          message: `필수 필드 '${field}'가 누락되었습니다.`,
          severity: 'critical'
        });
      }
    }

    // 각 위험도 평가 구조 검증
    const riskFields = ['depressionRisk', 'adhdFocusRisk', 'burnoutRisk', 'impulsivityRisk', 'stressRisk'];
    for (const riskField of riskFields) {
      if (data[riskField]) {
        this.validateRiskAssessmentStructure(data[riskField], riskField, result);
      }
    }

    // 권고사항 구조 검증
    if (data.recommendations) {
      this.validateRecommendationsStructure(data.recommendations, result);
    }
  }

  /**
   * 위험도 평가 구조 검증
   */
  private static validateRiskAssessmentStructure(riskData: any, fieldName: string, result: ValidationResult): void {
    const requiredRiskFields = [
      'riskLevel',
      'score',
      'confidence',
      'indicators',
      'clinicalNotes',
      'severity',
      'urgency'
    ];

    for (const field of requiredRiskFields) {
      if (!(field in riskData) || riskData[field] === undefined || riskData[field] === null) {
        result.errors.push({
          type: 'structure',
          field: `${fieldName}.${field}`,
          message: `위험도 평가 필수 필드 '${field}'가 누락되었습니다.`,
          severity: 'high'
        });
      }
    }

    // 표준화된 점수 구조 검증
    if (riskData.score) {
      this.validateStandardizedScoreStructure(riskData.score, `${fieldName}.score`, result);
    }
  }

  /**
   * 표준화된 점수 구조 검증
   */
  private static validateStandardizedScoreStructure(scoreData: any, fieldName: string, result: ValidationResult): void {
    const requiredScoreFields = [
      'raw',
      'standardized',
      'percentile',
      'grade',
      'gradeDescription',
      'ageGenderAdjusted'
    ];

    for (const field of requiredScoreFields) {
      if (!(field in scoreData) || scoreData[field] === undefined || scoreData[field] === null) {
        result.errors.push({
          type: 'structure',
          field: `${fieldName}.${field}`,
          message: `표준화된 점수 필수 필드 '${field}'가 누락되었습니다.`,
          severity: 'high'
        });
      }
    }
  }

  /**
   * 권고사항 구조 검증
   */
  private static validateRecommendationsStructure(recommendations: any, result: ValidationResult): void {
    const requiredCategories = ['immediate', 'shortTerm', 'longTerm', 'occupationSpecific'];
    
    for (const category of requiredCategories) {
      if (!(category in recommendations)) {
        result.errors.push({
          type: 'structure',
          field: `recommendations.${category}`,
          message: `권고사항 카테고리 '${category}'가 누락되었습니다.`,
          severity: 'medium'
        });
      }
    }

    // immediate 하위 구조 검증
    if (recommendations.immediate) {
      const immediateFields = ['lifestyle', 'exercise', 'mindfulness', 'sleep'];
      for (const field of immediateFields) {
        if (!(field in recommendations.immediate)) {
          result.warnings.push({
            type: 'completeness',
            field: `recommendations.immediate.${field}`,
            message: `즉시 권고사항 '${field}'가 누락되었습니다.`
          });
        }
      }
    }
  }

  /**
   * 표준화된 점수들 검증
   */
  private static validateStandardizedScores(data: any, result: ValidationResult): void {
    const scoreFields = [
      'depressionRisk.score',
      'adhdFocusRisk.score',
      'burnoutRisk.score',
      'impulsivityRisk.score',
      'stressRisk.score',
      'overallMentalHealthScore'
    ];

    for (const fieldPath of scoreFields) {
      const scoreData = this.getNestedValue(data, fieldPath);
      if (scoreData) {
        this.validateStandardizedScore(scoreData, fieldPath, result);
      }
    }
  }

  /**
   * 개별 표준화된 점수 검증
   */
  private static validateStandardizedScore(scoreData: any, fieldName: string, result: ValidationResult): void {
    // 원본 점수 범위 검증 (0-100)
    if (typeof scoreData.raw === 'number') {
      if (scoreData.raw < 0 || scoreData.raw > 100) {
        result.errors.push({
          type: 'range',
          field: `${fieldName}.raw`,
          message: '원본 점수는 0-100 범위여야 합니다.',
          severity: 'high'
        });
      }
    }

    // 표준화된 점수 범위 검증 (0-100)
    if (typeof scoreData.standardized === 'number') {
      if (scoreData.standardized < 0 || scoreData.standardized > 100) {
        result.errors.push({
          type: 'range',
          field: `${fieldName}.standardized`,
          message: '표준화된 점수는 0-100 범위여야 합니다.',
          severity: 'high'
        });
      }
    }

    // 백분위수 범위 검증 (0-100)
    if (typeof scoreData.percentile === 'number') {
      if (scoreData.percentile < 0 || scoreData.percentile > 100) {
        result.errors.push({
          type: 'range',
          field: `${fieldName}.percentile`,
          message: '백분위수는 0-100 범위여야 합니다.',
          severity: 'high'
        });
      }
    }

    // 등급 값 검증
    const validGrades: ScoreGrade[] = ['excellent', 'good', 'normal', 'borderline', 'attention'];
    if (typeof scoreData.grade === 'string' && !validGrades.includes(scoreData.grade as ScoreGrade)) {
      result.errors.push({
        type: 'type',
        field: `${fieldName}.grade`,
        message: '유효하지 않은 점수 등급입니다.',
        severity: 'medium'
      });
    }

    // 등급과 백분위수 일관성 검증
    if (typeof scoreData.percentile === 'number' && typeof scoreData.grade === 'string') {
      this.validateGradePercentileConsistency(scoreData.percentile, scoreData.grade, fieldName, result);
    }

    // 등급 설명 존재 여부 검증
    if (typeof scoreData.gradeDescription !== 'string' || scoreData.gradeDescription.length < 10) {
      result.warnings.push({
        type: 'completeness',
        field: `${fieldName}.gradeDescription`,
        message: '등급 설명이 부족합니다.'
      });
    }

    // 성별/나이 보정 여부 검증
    if (typeof scoreData.ageGenderAdjusted !== 'boolean') {
      result.warnings.push({
        type: 'quality',
        field: `${fieldName}.ageGenderAdjusted`,
        message: '성별/나이 보정 여부가 명확하지 않습니다.'
      });
    }
  }

  /**
   * 등급과 백분위수 일관성 검증
   */
  private static validateGradePercentileConsistency(percentile: number, grade: string, fieldName: string, result: ValidationResult): void {
    const expectedGrade = this.getExpectedGrade(percentile);
    
    if (grade !== expectedGrade) {
      result.errors.push({
        type: 'consistency',
        field: `${fieldName}.grade`,
        message: `백분위수 ${percentile}%에 대한 등급이 일치하지 않습니다. 예상: ${expectedGrade}, 실제: ${grade}`,
        severity: 'medium'
      });
    }
  }

  /**
   * 백분위수에 따른 예상 등급 계산
   */
  private static getExpectedGrade(percentile: number): ScoreGrade {
    if (percentile >= 95) return 'excellent';
    if (percentile >= 75) return 'good';
    if (percentile >= 25) return 'normal';
    if (percentile >= 5) return 'borderline';
    return 'attention';
  }

  /**
   * 위험도 평가들 검증
   */
  private static validateRiskAssessments(data: any, result: ValidationResult): void {
    const riskFields = ['depressionRisk', 'adhdFocusRisk', 'burnoutRisk', 'impulsivityRisk', 'stressRisk'];
    
    for (const riskField of riskFields) {
      const riskData = data[riskField];
      if (riskData) {
        this.validateRiskAssessment(riskData, riskField, result);
      }
    }
  }

  /**
   * 개별 위험도 평가 검증
   */
  private static validateRiskAssessment(riskData: any, fieldName: string, result: ValidationResult): void {
    // 위험도 수준 검증
    const validRiskLevels = ['low', 'moderate', 'high', 'critical'];
    if (typeof riskData.riskLevel === 'string' && !validRiskLevels.includes(riskData.riskLevel)) {
      result.errors.push({
        type: 'type',
        field: `${fieldName}.riskLevel`,
        message: '유효하지 않은 위험도 수준입니다.',
        severity: 'medium'
      });
    }

    // 신뢰도 범위 검증 (0-1)
    if (typeof riskData.confidence === 'number') {
      if (riskData.confidence < 0 || riskData.confidence > 1) {
        result.errors.push({
          type: 'range',
          field: `${fieldName}.confidence`,
          message: '신뢰도는 0-1 범위여야 합니다.',
          severity: 'medium'
        });
      }
    }

    // 심각도 검증
    const validSeverities = ['mild', 'moderate', 'severe'];
    if (typeof riskData.severity === 'string' && !validSeverities.includes(riskData.severity)) {
      result.errors.push({
        type: 'type',
        field: `${fieldName}.severity`,
        message: '유효하지 않은 심각도입니다.',
        severity: 'low'
      });
    }

    // 긴급도 검증
    const validUrgencies = ['routine', 'priority', 'urgent'];
    if (typeof riskData.urgency === 'string' && !validUrgencies.includes(riskData.urgency)) {
      result.errors.push({
        type: 'type',
        field: `${fieldName}.urgency`,
        message: '유효하지 않은 긴급도입니다.',
        severity: 'low'
      });
    }

    // 지표 배열 검증
    if (Array.isArray(riskData.indicators)) {
      if (riskData.indicators.length === 0) {
        result.warnings.push({
          type: 'completeness',
          field: `${fieldName}.indicators`,
          message: '위험도 지표가 비어있습니다.'
        });
      }
    }

    // 임상 노트 검증
    if (typeof riskData.clinicalNotes === 'string' && riskData.clinicalNotes.length < 20) {
      result.warnings.push({
        type: 'completeness',
        field: `${fieldName}.clinicalNotes`,
        message: '임상 노트가 너무 짧습니다.'
      });
    }
  }

  /**
   * 권고사항 검증
   */
  private static validateRecommendations(data: any, result: ValidationResult): void {
    if (!data.recommendations) return;

    const recommendations = data.recommendations;
    
    // 각 카테고리별 권고사항 개수 검증
    const categories = ['immediate', 'shortTerm', 'longTerm', 'occupationSpecific'];
    
    for (const category of categories) {
      if (recommendations[category]) {
        this.validateRecommendationCategory(recommendations[category], `recommendations.${category}`, result);
      }
    }
  }

  /**
   * 권고사항 카테고리 검증
   */
  private static validateRecommendationCategory(categoryData: any, fieldName: string, result: ValidationResult): void {
    if (typeof categoryData !== 'object' || categoryData === null) {
      result.errors.push({
        type: 'type',
        field: fieldName,
        message: '권고사항 카테고리는 객체여야 합니다.',
        severity: 'medium'
      });
      return;
    }

    // 각 하위 카테고리가 배열인지 확인
    for (const [key, value] of Object.entries(categoryData)) {
      if (!Array.isArray(value)) {
        result.errors.push({
          type: 'type',
          field: `${fieldName}.${key}`,
          message: '권고사항은 배열이어야 합니다.',
          severity: 'medium'
        });
      } else if ((value as any[]).length === 0) {
        result.warnings.push({
          type: 'completeness',
          field: `${fieldName}.${key}`,
          message: '권고사항이 비어있습니다.'
        });
      } else if ((value as any[]).some(item => typeof item !== 'string' || item.length < 5)) {
        result.warnings.push({
          type: 'quality',
          field: `${fieldName}.${key}`,
          message: '권고사항 내용이 부족합니다.'
        });
      }
    }
  }

  /**
   * 정신건강 분석 일관성 검증
   */
  private static validateMentalHealthConsistency(data: any, result: ValidationResult): void {
    // 전체 점수와 개별 위험도 점수 일관성 검증
    if (data.overallMentalHealthScore && data.overallMentalHealthScore.percentile) {
      const overallPercentile = data.overallMentalHealthScore.percentile;
      
      // 개별 위험도들의 평균과 전체 점수 비교
      const individualScores = [
        data.depressionRisk?.score?.percentile,
        data.adhdFocusRisk?.score?.percentile,
        data.burnoutRisk?.score?.percentile,
        data.impulsivityRisk?.score?.percentile,
        data.stressRisk?.score?.percentile
      ].filter(score => typeof score === 'number');

      if (individualScores.length > 0) {
        // 위험도를 건강 점수로 변환 (100 - 위험도)
        const healthScores = individualScores.map(score => 100 - score);
        const averageHealthScore = healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length;
        
        const difference = Math.abs(overallPercentile - averageHealthScore);
        if (difference > 20) {
          result.warnings.push({
            type: 'consistency',
            field: 'overallMentalHealthScore',
            message: `전체 정신건강 점수와 개별 위험도 점수들 간의 차이가 큽니다 (차이: ${difference.toFixed(1)}점)`
          });
        }
      }
    }

    // 위험 요소와 보호 요소 균형 검증
    if (Array.isArray(data.riskFactors) && Array.isArray(data.protectiveFactors)) {
      const riskCount = data.riskFactors.length;
      const protectiveCount = data.protectiveFactors.length;
      
      if (riskCount > protectiveCount * 3) {
        result.warnings.push({
          type: 'consistency',
          field: 'riskFactors',
          message: '위험 요소에 비해 보호 요소가 너무 적습니다.'
        });
      }
    }

    // 신뢰도 일관성 검증
    if (typeof data.confidence === 'number') {
      const individualConfidences = [
        data.depressionRisk?.confidence,
        data.adhdFocusRisk?.confidence,
        data.burnoutRisk?.confidence,
        data.impulsivityRisk?.confidence,
        data.stressRisk?.confidence
      ].filter(conf => typeof conf === 'number');

      if (individualConfidences.length > 0) {
        const averageConfidence = individualConfidences.reduce((sum, conf) => sum + conf, 0) / individualConfidences.length;
        const difference = Math.abs(data.confidence - averageConfidence);
        
        if (difference > 0.2) {
          result.warnings.push({
            type: 'consistency',
            field: 'confidence',
            message: `전체 신뢰도와 개별 신뢰도들 간의 차이가 큽니다 (차이: ${difference.toFixed(2)})`
          });
        }
      }
    }
  }

  /**
   * EEG 분석 응답 검증
   */
  static validateEEGResponse(data: any): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      score: 100,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // 구조 검증
    this.validateBasicStructure(data, ['score', 'status', 'analysis'], result);
    
    // 점수 범위 검증
    if (typeof data.score === 'number') {
      if (data.score < 0 || data.score > 100) {
        result.errors.push({
          type: 'range',
          field: 'score',
          message: 'EEG 점수는 0-100 범위여야 합니다',
          severity: 'high'
        });
      }
    }

    // 상태 값 검증
    const validStatuses = ['매우 양호', '양호', '보통', '주의 필요', '위험'];
    if (typeof data.status === 'string' && !validStatuses.includes(data.status)) {
      result.warnings.push({
        type: 'quality',
        field: 'status',
        message: '표준 상태 값이 아닙니다'
      });
    }

    // 분석 내용 길이 검증
    if (typeof data.analysis === 'string' && data.analysis.length < 100) {
      result.warnings.push({
        type: 'completeness',
        field: 'analysis',
        message: 'EEG 분석 내용이 너무 짧습니다'
      });
    }

    // 최종 점수 계산
    result.score = Math.max(0, 100 - (result.errors.length * 20) - (result.warnings.length * 5));
    result.isValid = result.errors.filter(e => e.severity === 'critical').length === 0;

    return result;
  }

  /**
   * PPG 분석 응답 검증
   */
  static validatePPGResponse(data: any): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      score: 100,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // 구조 검증
    this.validateBasicStructure(data, ['score', 'status', 'analysis'], result);
    
    // 점수 범위 검증
    if (typeof data.score === 'number') {
      if (data.score < 0 || data.score > 100) {
        result.errors.push({
          type: 'range',
          field: 'score',
          message: 'PPG 점수는 0-100 범위여야 합니다',
          severity: 'high'
        });
      }
    }

    // 최종 점수 계산
    result.score = Math.max(0, 100 - (result.errors.length * 20) - (result.warnings.length * 5));
    result.isValid = result.errors.filter(e => e.severity === 'critical').length === 0;

    return result;
  }

  /**
   * Stress 분석 응답 검증
   */
  static validateStressResponse(data: any): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      score: 100,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // 구조 검증
    this.validateBasicStructure(data, ['score', 'status', 'analysis'], result);
    
    // 점수 범위 검증
    if (typeof data.score === 'number') {
      if (data.score < 0 || data.score > 100) {
        result.errors.push({
          type: 'range',
          field: 'score',
          message: 'Stress 점수는 0-100 범위여야 합니다',
          severity: 'high'
        });
      }
    }

    // 최종 점수 계산
    result.score = Math.max(0, 100 - (result.errors.length * 20) - (result.warnings.length * 5));
    result.isValid = result.errors.filter(e => e.severity === 'critical').length === 0;

    return result;
  }

  /**
   * 종합 분석 응답 검증
   */
  static validateComprehensiveResponse(data: any): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      score: 100,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // 1. 구조 검증
    this.validateStructure(data, result);

    // 2. 타입 검증
    this.validateTypes(data, result);

    // 3. 범위 검증
    this.validateRanges(data, result);

    // 4. 내용 검증
    this.validateContent(data, result);

    // 5. 의학적 타당성 검증
    this.validateMedicalContent(data, result);

    // 6. 일관성 검증
    this.validateConsistency(data, result);

    // 최종 점수 계산
    result.score = this.calculateQualityScore(result);
    result.isValid = result.score >= 70 && result.errors.filter(e => e.severity === 'critical').length === 0;

    return result;
  }

  /**
   * 기본 구조 검증 - EEG/PPG/Stress용
   */
  private static validateBasicStructure(data: any, requiredFields: string[], result: ValidationResult): void {
    for (const field of requiredFields) {
      if (!(field in data) || data[field] === undefined || data[field] === null) {
        result.errors.push({
          type: 'structure',
          field,
          message: `필수 필드 '${field}'가 누락되었습니다.`,
          severity: 'critical'
        });
      }
    }
  }

  /**
   * 1. 구조 검증 - 필수 필드 존재 여부 (종합분석용)
   */
  private static validateStructure(data: any, result: ValidationResult): void {
    const requiredFields = [
      'overallScore',
      'healthStatus', 
      'analysis',
      'keyFindings',
      'problemAreas',
      'immediate',
      'shortTerm',
      'longTerm',
      'followUpPlan'
    ];

    for (const field of requiredFields) {
      if (!(field in data) || data[field] === undefined || data[field] === null) {
        result.errors.push({
          type: 'structure',
          field,
          message: `필수 필드 '${field}'가 누락되었습니다.`,
          severity: 'critical'
        });
      }
    }

    // keyFindings 하위 필드 검증
    if (data.keyFindings) {
      const keyFindingsFields = ['mentalHealth', 'physicalHealth', 'stressManagement', 'mentalHealthRisk', 'overallBalance'];
      for (const field of keyFindingsFields) {
        if (!(field in data.keyFindings)) {
          result.errors.push({
            type: 'structure',
            field: `keyFindings.${field}`,
            message: `keyFindings의 필수 필드 '${field}'가 누락되었습니다.`,
            severity: 'high'
          });
        }
      }
    }

    // followUpPlan 하위 필드 검증
    if (data.followUpPlan) {
      const followUpFields = ['monitoring', 'adjustments', 'professional'];
      for (const field of followUpFields) {
        if (!(field in data.followUpPlan)) {
          result.errors.push({
            type: 'structure',
            field: `followUpPlan.${field}`,
            message: `followUpPlan의 필수 필드 '${field}'가 누락되었습니다.`,
            severity: 'medium'
          });
        }
      }
    }
  }

  /**
   * 2. 타입 검증 - 각 필드의 데이터 타입
   */
  private static validateTypes(data: any, result: ValidationResult): void {
    // 숫자 필드 검증
    if (data.overallScore !== undefined && typeof data.overallScore !== 'number') {
      result.errors.push({
        type: 'type',
        field: 'overallScore',
        message: `overallScore는 숫자여야 합니다. 현재: ${typeof data.overallScore}`,
        severity: 'critical'
      });
    }

    // 문자열 필드 검증
    const stringFields = ['healthStatus', 'analysis'];
    for (const field of stringFields) {
      if (data[field] !== undefined && typeof data[field] !== 'string') {
        result.errors.push({
          type: 'type',
          field,
          message: `${field}는 문자열이어야 합니다. 현재: ${typeof data[field]}`,
          severity: 'high'
        });
      }
    }

    // 배열 필드 검증
    const arrayFields = ['problemAreas', 'immediate', 'shortTerm', 'longTerm'];
    for (const field of arrayFields) {
      if (data[field] !== undefined && !Array.isArray(data[field])) {
        result.errors.push({
          type: 'type',
          field,
          message: `${field}는 배열이어야 합니다. 현재: ${typeof data[field]}`,
          severity: 'high'
        });
      }
    }

    // problemAreas 배열 요소 구조 검증
    if (Array.isArray(data.problemAreas)) {
      data.problemAreas.forEach((item: any, index: number) => {
        if (typeof item !== 'object' || item === null) {
          result.errors.push({
            type: 'type',
            field: `problemAreas[${index}]`,
            message: `problemAreas의 각 요소는 객체여야 합니다.`,
            severity: 'high'
          });
          return;
        }

        const requiredProblemFields = ['problem', 'severity', 'description', 'solutions'];
        for (const field of requiredProblemFields) {
          if (!(field in item)) {
            result.errors.push({
              type: 'structure',
              field: `problemAreas[${index}].${field}`,
              message: `problemAreas 요소의 필수 필드 '${field}'가 누락되었습니다.`,
              severity: 'medium'
            });
          }
        }

        // solutions 하위 구조 검증
        if (item.solutions && typeof item.solutions === 'object') {
          const solutionFields = ['immediate', 'shortTerm', 'longTerm'];
          for (const field of solutionFields) {
            if (!(field in item.solutions) || !Array.isArray(item.solutions[field])) {
              result.errors.push({
                type: 'structure',
                field: `problemAreas[${index}].solutions.${field}`,
                message: `solutions의 '${field}' 필드는 배열이어야 합니다.`,
                severity: 'medium'
              });
            }
          }
        }
      });
    }
  }

  /**
   * 3. 범위 검증 - 값의 유효 범위
   */
  private static validateRanges(data: any, result: ValidationResult): void {
    // overallScore 범위 검증 (0-100)
    if (typeof data.overallScore === 'number') {
      if (data.overallScore < 0 || data.overallScore > 100) {
        result.errors.push({
          type: 'range',
          field: 'overallScore',
          message: `overallScore는 0-100 범위여야 합니다. 현재: ${data.overallScore}`,
          severity: 'critical'
        });
      }
    }

    // 배열 길이 검증
    const arrayLimits = {
      problemAreas: { max: 5, min: 1 },
      immediate: { max: 10, min: 1 },
      shortTerm: { max: 8, min: 1 },
      longTerm: { max: 6, min: 1 }
    };

    for (const [field, limits] of Object.entries(arrayLimits)) {
      if (Array.isArray(data[field])) {
        if (data[field].length > limits.max) {
          result.warnings.push({
            type: 'quality',
            field,
            message: `${field} 배열이 너무 깁니다. 권장: 최대 ${limits.max}개, 현재: ${data[field].length}개`
          });
        }
        if (data[field].length < limits.min) {
          result.errors.push({
            type: 'range',
            field,
            message: `${field} 배열이 너무 짧습니다. 최소 ${limits.min}개 필요, 현재: ${data[field].length}개`,
            severity: 'medium'
          });
        }
      }
    }

    // 문자열 길이 검증
    if (typeof data.analysis === 'string') {
      if (data.analysis.length < 200) {
        result.warnings.push({
          type: 'completeness',
          field: 'analysis',
          message: `분석 내용이 너무 짧습니다. 현재: ${data.analysis.length}자`
        });
      }
      if (data.analysis.length > 5000) {
        result.warnings.push({
          type: 'quality',
          field: 'analysis',
          message: `분석 내용이 너무 깁니다. 현재: ${data.analysis.length}자`
        });
      }
    }
  }

  /**
   * 4. 내용 검증 - 내용의 적절성
   */
  private static validateContent(data: any, result: ValidationResult): void {
    // 건강 상태 유효성 검증
    if (typeof data.healthStatus === 'string') {
      const validStatuses = ['매우 양호', '양호', '보통', '주의 필요', '관리 필요', '즉시 관리 필요'];
      if (!validStatuses.some(status => data.healthStatus.includes(status))) {
        result.warnings.push({
          type: 'quality',
          field: 'healthStatus',
          message: `건강 상태가 표준 형식과 다릅니다: ${data.healthStatus}`
        });
      }
    }

    // 심각도 유효성 검증
    if (Array.isArray(data.problemAreas)) {
      data.problemAreas.forEach((item: any, index: number) => {
        if (typeof item.severity === 'string') {
          const validSeverities = ['낮음', '보통', '높음', '매우 높음', '긴급'];
          if (!validSeverities.includes(item.severity)) {
            result.warnings.push({
              type: 'quality',
              field: `problemAreas[${index}].severity`,
              message: `심각도가 표준 형식과 다릅니다: ${item.severity}`
            });
          }
        }
      });
    }

    // 빈 문자열 검증
    const textFields = ['healthStatus', 'analysis'];
    for (const field of textFields) {
      if (typeof data[field] === 'string' && data[field].trim().length === 0) {
        result.errors.push({
          type: 'content',
          field,
          message: `${field}가 비어있습니다.`,
          severity: 'high'
        });
      }
    }

    // 배열 요소 빈 값 검증
    const arrayTextFields = ['immediate', 'shortTerm', 'longTerm'];
    for (const field of arrayTextFields) {
      if (Array.isArray(data[field])) {
        data[field].forEach((item: any, index: number) => {
          if (typeof item === 'string' && item.trim().length === 0) {
            result.errors.push({
              type: 'content',
              field: `${field}[${index}]`,
              message: `${field} 배열에 빈 문자열이 있습니다.`,
              severity: 'medium'
            });
          }
        });
      }
    }
  }

  /**
   * 5. 의학적 타당성 검증
   */
  private static validateMedicalContent(data: any, result: ValidationResult): void {
    // 위험한 의학적 조언 감지
    const dangerousAdvice = [
      '약물 복용 중단',
      '의사 진료 불필요',
      '병원 방문 금지',
      '처방약 변경',
      '수술 불필요'
    ];

    const allText = JSON.stringify(data).toLowerCase();
    for (const dangerous of dangerousAdvice) {
      if (allText.includes(dangerous.toLowerCase())) {
        result.errors.push({
          type: 'medical',
          field: 'content',
          message: `위험한 의학적 조언이 포함되어 있습니다: ${dangerous}`,
          severity: 'critical'
        });
      }
    }

    // 부적절한 의학적 용어 감지
    const inappropriateTerms = [
      '진단',
      '치료',
      '처방',
      '의학적 판단',
      '질병 확진'
    ];

    for (const term of inappropriateTerms) {
      if (allText.includes(term.toLowerCase())) {
        result.warnings.push({
          type: 'quality',
          field: 'content',
          message: `의료행위로 오해될 수 있는 용어가 포함되어 있습니다: ${term}`
        });
      }
    }

    // 건강 점수와 상태 일치성 검증
    if (typeof data.overallScore === 'number' && typeof data.healthStatus === 'string') {
      const score = data.overallScore;
      const status = data.healthStatus.toLowerCase();

      if (score >= 90 && !status.includes('매우 양호') && !status.includes('우수')) {
        result.warnings.push({
          type: 'consistency',
          field: 'healthStatus',
          message: `높은 점수(${score})에 비해 건강 상태 표현이 보수적입니다.`
        });
      }
      
      if (score <= 50 && (status.includes('양호') || status.includes('우수'))) {
        result.errors.push({
          type: 'content',
          field: 'healthStatus',
          message: `낮은 점수(${score})와 건강 상태가 일치하지 않습니다.`,
          severity: 'high'
        });
      }
    }
  }

  /**
   * 6. 일관성 검증
   */
  private static validateConsistency(data: any, result: ValidationResult): void {
    // keyFindings와 problemAreas 일관성 검증
    if (data.keyFindings && Array.isArray(data.problemAreas)) {
      const findings = JSON.stringify(data.keyFindings).toLowerCase();
      const problems = JSON.stringify(data.problemAreas).toLowerCase();

      // 주요 발견사항에서 언급된 문제가 problemAreas에도 있는지 확인
      const keyIssues = ['스트레스', '집중력', '심박', '수면', '피로'];
      for (const issue of keyIssues) {
        if (findings.includes(issue) && !problems.includes(issue)) {
          result.warnings.push({
            type: 'consistency',
            field: 'problemAreas',
            message: `주요 발견사항에서 언급된 '${issue}' 문제가 문제 영역에서 누락되었습니다.`
          });
        }
      }
    }

    // 추천사항 중복 검증
    const allRecommendations = [
      ...(Array.isArray(data.immediate) ? data.immediate : []),
      ...(Array.isArray(data.shortTerm) ? data.shortTerm : []),
      ...(Array.isArray(data.longTerm) ? data.longTerm : [])
    ];

    const duplicates = allRecommendations.filter((item, index) => 
      allRecommendations.indexOf(item) !== index
    );

    if (duplicates.length > 0) {
      result.warnings.push({
        type: 'quality',
        field: 'recommendations',
        message: `추천사항에 중복이 있습니다: ${duplicates.length}개`
      });
    }
  }

  /**
   * 품질 점수 계산
   */
  private static calculateQualityScore(result: ValidationResult): number {
    let score = 100;

    // 오류에 따른 점수 차감
    for (const error of result.errors) {
      switch (error.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    }

    // 경고에 따른 점수 차감
    for (const warning of result.warnings) {
      score -= 3;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 검증 결과 요약
   */
  static summarizeValidation(result: ValidationResult): string {
    const criticalErrors = result.errors.filter(e => e.severity === 'critical').length;
    const highErrors = result.errors.filter(e => e.severity === 'high').length;
    const totalErrors = result.errors.length;
    const totalWarnings = result.warnings.length;

    if (criticalErrors > 0) {
      return `심각한 오류 ${criticalErrors}개로 인해 응답이 유효하지 않습니다.`;
    }
    
    if (highErrors > 0) {
      return `높은 수준 오류 ${highErrors}개가 있어 주의가 필요합니다.`;
    }

    if (totalErrors > 0 || totalWarnings > 0) {
      return `오류 ${totalErrors}개, 경고 ${totalWarnings}개가 있습니다. 품질 점수: ${result.score}점`;
    }

    return `검증 통과. 품질 점수: ${result.score}점`;
  }

  /**
   * 중첩된 객체 값 가져오기
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }
} 