/**
 * 표준화된 점수 계산 서비스
 * 
 * 기능:
 * - 성별/나이별 기준값 적용
 * - Z-score 기반 표준화
 * - 5단계 등급 평가 (우수/양호/보통/경계/주의)
 * - 백분위수 계산
 */

import { 
  StandardizedScore, 
  ScoreGrade, 
  DemographicNorms, 
  ScoreDistribution,
  ScoreNormalizationConfig 
} from '../types/redesigned-architecture';

interface NormData {
  metric: string;
  gender: 'male' | 'female';
  ageGroup: string;
  mean: number;
  standardDeviation: number;
  sampleSize: number;
}

export class ScoreNormalizationService {
  private static instance: ScoreNormalizationService;
  private normDatabase: NormData[] = [];
  private scoreDistribution!: ScoreDistribution;

  constructor() {
    this.initializeNormDatabase();
    this.initializeScoreDistribution();
  }

  public static getInstance(): ScoreNormalizationService {
    if (!ScoreNormalizationService.instance) {
      ScoreNormalizationService.instance = new ScoreNormalizationService();
    }
    return ScoreNormalizationService.instance;
  }

  /**
   * 원본 점수를 표준화된 점수로 변환
   */
  public async normalizeScore(
    rawScore: number,
    metric: string,
    gender: 'male' | 'female',
    age: number
  ): Promise<StandardizedScore> {
    const ageGroup = this.getAgeGroup(age);
    const norms = this.getDemographicNorms(metric, gender, age);
    
    if (!norms) {
      // 기준값이 없는 경우 기본 처리
      return this.createDefaultScore(rawScore, metric);
    }

    // Z-score 계산
    const zScore = (rawScore - norms.mean) / norms.standardDeviation;
    
    // 백분위수 계산 (표준정규분포 기반)
    const percentile = this.zScoreToPercentile(zScore);
    
    // 0-100 표준화 점수 계산
    const standardized = Math.max(0, Math.min(100, percentile));
    
    // 등급 결정
    const grade = this.getScoreGrade(percentile);
    const gradeDescription = this.getGradeDescription(grade, gender, ageGroup, percentile);

    return {
      raw: rawScore,
      standardized,
      percentile,
      grade,
      gradeDescription,
      ageGenderAdjusted: true
    };
  }

  /**
   * 백분위수를 기반으로 5단계 등급 결정
   */
  public getScoreGrade(percentile: number): ScoreGrade {
    if (percentile >= 95) return 'excellent';
    if (percentile >= 75) return 'good';
    if (percentile >= 25) return 'normal';
    if (percentile >= 5) return 'borderline';
    return 'attention';
  }

  /**
   * 등급별 설명 생성
   */
  public getGradeDescription(
    grade: ScoreGrade, 
    gender: 'male' | 'female',
    ageGroup: string, 
    percentile: number
  ): string {
    const genderText = gender === 'male' ? '남성' : '여성';
    const percentileText = Math.round(100 - percentile);

    switch (grade) {
      case 'excellent':
        return `같은 연령대 ${genderText} 상위 ${Math.round(100 - percentile)}%에 해당하는 우수한 상태`;
      case 'good':
        return `같은 연령대 ${genderText} 상위 ${percentileText}%에 해당하는 양호한 상태`;
      case 'normal':
        return `같은 연령대 ${genderText} 평균 수준의 정상 상태`;
      case 'borderline':
        return `같은 연령대 ${genderText} 하위 ${percentileText}%로 주의 관찰이 필요한 상태`;
      case 'attention':
        return `같은 연령대 ${genderText} 하위 ${percentileText}%로 적극적 관리가 필요한 상태`;
      default:
        return '평가 불가';
    }
  }

  /**
   * 성별/나이별 기준값 조회
   */
  public getDemographicNorms(
    metric: string, 
    gender: 'male' | 'female', 
    age: number
  ): DemographicNorms | null {
    const ageGroup = this.getAgeGroup(age);
    
    const norm = this.normDatabase.find(n => 
      n.metric === metric && 
      n.gender === gender && 
      n.ageGroup === ageGroup
    );

    if (!norm) return null;

    return {
      gender: norm.gender,
      ageGroup: norm.ageGroup as any,
      mean: norm.mean,
      standardDeviation: norm.standardDeviation,
      sampleSize: norm.sampleSize
    };
  }

  /**
   * 연령대 구분
   */
  private getAgeGroup(age: number): string {
    if (age < 30) return '20-29';
    if (age < 40) return '30-39';
    if (age < 50) return '40-49';
    if (age < 60) return '50-59';
    return '60+';
  }

  /**
   * Z-score를 백분위수로 변환
   */
  private zScoreToPercentile(zScore: number): number {
    // 표준정규분포 누적분포함수 근사
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = zScore < 0 ? -1 : 1;
    const x = Math.abs(zScore) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return Math.round((0.5 * (1.0 + sign * y)) * 100);
  }

  /**
   * 기본 점수 생성 (기준값이 없는 경우)
   */
  private createDefaultScore(rawScore: number, metric: string): StandardizedScore {
    // 단순히 원본 점수를 그대로 사용
    const standardized = Math.max(0, Math.min(100, rawScore));
    const percentile = standardized;
    const grade = this.getScoreGrade(percentile);

    return {
      raw: rawScore,
      standardized,
      percentile,
      grade,
      gradeDescription: `${metric} 점수 ${rawScore}점`,
      ageGenderAdjusted: false
    };
  }

  /**
   * 기준값 데이터베이스 초기화
   */
  private initializeNormDatabase(): void {
    this.normDatabase = [
      // EEG 지표 기준값
      // 집중지수 (Focus Index)
      { metric: 'focusIndex', gender: 'male', ageGroup: '20-29', mean: 68, standardDeviation: 12, sampleSize: 500 },
      { metric: 'focusIndex', gender: 'male', ageGroup: '30-39', mean: 65, standardDeviation: 13, sampleSize: 450 },
      { metric: 'focusIndex', gender: 'male', ageGroup: '40-49', mean: 62, standardDeviation: 14, sampleSize: 400 },
      { metric: 'focusIndex', gender: 'male', ageGroup: '50-59', mean: 58, standardDeviation: 15, sampleSize: 350 },
      { metric: 'focusIndex', gender: 'male', ageGroup: '60+', mean: 55, standardDeviation: 16, sampleSize: 300 },
      
      { metric: 'focusIndex', gender: 'female', ageGroup: '20-29', mean: 70, standardDeviation: 11, sampleSize: 520 },
      { metric: 'focusIndex', gender: 'female', ageGroup: '30-39', mean: 67, standardDeviation: 12, sampleSize: 480 },
      { metric: 'focusIndex', gender: 'female', ageGroup: '40-49', mean: 64, standardDeviation: 13, sampleSize: 420 },
      { metric: 'focusIndex', gender: 'female', ageGroup: '50-59', mean: 60, standardDeviation: 14, sampleSize: 380 },
      { metric: 'focusIndex', gender: 'female', ageGroup: '60+', mean: 57, standardDeviation: 15, sampleSize: 320 },

      // 이완지수 (Relaxation Index)
      { metric: 'relaxationIndex', gender: 'male', ageGroup: '20-29', mean: 72, standardDeviation: 15, sampleSize: 500 },
      { metric: 'relaxationIndex', gender: 'male', ageGroup: '30-39', mean: 70, standardDeviation: 14, sampleSize: 450 },
      { metric: 'relaxationIndex', gender: 'male', ageGroup: '40-49', mean: 68, standardDeviation: 16, sampleSize: 400 },
      { metric: 'relaxationIndex', gender: 'male', ageGroup: '50-59', mean: 65, standardDeviation: 17, sampleSize: 350 },
      { metric: 'relaxationIndex', gender: 'male', ageGroup: '60+', mean: 62, standardDeviation: 18, sampleSize: 300 },
      
      { metric: 'relaxationIndex', gender: 'female', ageGroup: '20-29', mean: 75, standardDeviation: 13, sampleSize: 520 },
      { metric: 'relaxationIndex', gender: 'female', ageGroup: '30-39', mean: 73, standardDeviation: 14, sampleSize: 480 },
      { metric: 'relaxationIndex', gender: 'female', ageGroup: '40-49', mean: 70, standardDeviation: 15, sampleSize: 420 },
      { metric: 'relaxationIndex', gender: 'female', ageGroup: '50-59', mean: 67, standardDeviation: 16, sampleSize: 380 },
      { metric: 'relaxationIndex', gender: 'female', ageGroup: '60+', mean: 64, standardDeviation: 17, sampleSize: 320 },

      // PPG 지표 기준값
      // 심박변이도 (HRV RMSSD)
      { metric: 'hrvRMSSD', gender: 'male', ageGroup: '20-29', mean: 42, standardDeviation: 18, sampleSize: 600 },
      { metric: 'hrvRMSSD', gender: 'male', ageGroup: '30-39', mean: 35, standardDeviation: 16, sampleSize: 550 },
      { metric: 'hrvRMSSD', gender: 'male', ageGroup: '40-49', mean: 28, standardDeviation: 14, sampleSize: 500 },
      { metric: 'hrvRMSSD', gender: 'male', ageGroup: '50-59', mean: 23, standardDeviation: 12, sampleSize: 450 },
      { metric: 'hrvRMSSD', gender: 'male', ageGroup: '60+', mean: 19, standardDeviation: 10, sampleSize: 400 },
      
      { metric: 'hrvRMSSD', gender: 'female', ageGroup: '20-29', mean: 45, standardDeviation: 20, sampleSize: 620 },
      { metric: 'hrvRMSSD', gender: 'female', ageGroup: '30-39', mean: 38, standardDeviation: 18, sampleSize: 580 },
      { metric: 'hrvRMSSD', gender: 'female', ageGroup: '40-49', mean: 31, standardDeviation: 16, sampleSize: 520 },
      { metric: 'hrvRMSSD', gender: 'female', ageGroup: '50-59', mean: 26, standardDeviation: 14, sampleSize: 480 },
      { metric: 'hrvRMSSD', gender: 'female', ageGroup: '60+', mean: 22, standardDeviation: 12, sampleSize: 420 },

      // 안정시 심박수
      { metric: 'restingHR', gender: 'male', ageGroup: '20-29', mean: 66, standardDeviation: 8, sampleSize: 800 },
      { metric: 'restingHR', gender: 'male', ageGroup: '30-39', mean: 68, standardDeviation: 8, sampleSize: 750 },
      { metric: 'restingHR', gender: 'male', ageGroup: '40-49', mean: 70, standardDeviation: 9, sampleSize: 700 },
      { metric: 'restingHR', gender: 'male', ageGroup: '50-59', mean: 71, standardDeviation: 9, sampleSize: 650 },
      { metric: 'restingHR', gender: 'male', ageGroup: '60+', mean: 72, standardDeviation: 10, sampleSize: 600 },
      
      { metric: 'restingHR', gender: 'female', ageGroup: '20-29', mean: 70, standardDeviation: 7, sampleSize: 820 },
      { metric: 'restingHR', gender: 'female', ageGroup: '30-39', mean: 72, standardDeviation: 8, sampleSize: 780 },
      { metric: 'restingHR', gender: 'female', ageGroup: '40-49', mean: 73, standardDeviation: 8, sampleSize: 720 },
      { metric: 'restingHR', gender: 'female', ageGroup: '50-59', mean: 74, standardDeviation: 9, sampleSize: 680 },
      { metric: 'restingHR', gender: 'female', ageGroup: '60+', mean: 75, standardDeviation: 9, sampleSize: 620 },

      // 정신건강 위험도 기준값
      // 우울 위험도
      { metric: 'depressionRisk', gender: 'male', ageGroup: '20-29', mean: 15, standardDeviation: 8, sampleSize: 1000 },
      { metric: 'depressionRisk', gender: 'male', ageGroup: '30-39', mean: 18, standardDeviation: 9, sampleSize: 950 },
      { metric: 'depressionRisk', gender: 'male', ageGroup: '40-49', mean: 22, standardDeviation: 11, sampleSize: 900 },
      { metric: 'depressionRisk', gender: 'male', ageGroup: '50-59', mean: 25, standardDeviation: 12, sampleSize: 850 },
      { metric: 'depressionRisk', gender: 'male', ageGroup: '60+', mean: 25, standardDeviation: 12, sampleSize: 800 },
      
      { metric: 'depressionRisk', gender: 'female', ageGroup: '20-29', mean: 18, standardDeviation: 9, sampleSize: 1050 },
      { metric: 'depressionRisk', gender: 'female', ageGroup: '30-39', mean: 22, standardDeviation: 10, sampleSize: 1000 },
      { metric: 'depressionRisk', gender: 'female', ageGroup: '40-49', mean: 25, standardDeviation: 12, sampleSize: 950 },
      { metric: 'depressionRisk', gender: 'female', ageGroup: '50-59', mean: 28, standardDeviation: 13, sampleSize: 900 },
      { metric: 'depressionRisk', gender: 'female', ageGroup: '60+', mean: 28, standardDeviation: 13, sampleSize: 850 },

      // ADHD 위험도
      { metric: 'adhdRisk', gender: 'male', ageGroup: '20-29', mean: 20, standardDeviation: 12, sampleSize: 800 },
      { metric: 'adhdRisk', gender: 'male', ageGroup: '30-39', mean: 20, standardDeviation: 12, sampleSize: 750 },
      { metric: 'adhdRisk', gender: 'male', ageGroup: '40-49', mean: 20, standardDeviation: 12, sampleSize: 700 },
      { metric: 'adhdRisk', gender: 'male', ageGroup: '50-59', mean: 20, standardDeviation: 12, sampleSize: 650 },
      { metric: 'adhdRisk', gender: 'male', ageGroup: '60+', mean: 20, standardDeviation: 12, sampleSize: 600 },
      
      { metric: 'adhdRisk', gender: 'female', ageGroup: '20-29', mean: 16, standardDeviation: 10, sampleSize: 820 },
      { metric: 'adhdRisk', gender: 'female', ageGroup: '30-39', mean: 16, standardDeviation: 10, sampleSize: 780 },
      { metric: 'adhdRisk', gender: 'female', ageGroup: '40-49', mean: 16, standardDeviation: 10, sampleSize: 720 },
      { metric: 'adhdRisk', gender: 'female', ageGroup: '50-59', mean: 16, standardDeviation: 10, sampleSize: 680 },
      { metric: 'adhdRisk', gender: 'female', ageGroup: '60+', mean: 16, standardDeviation: 10, sampleSize: 620 },

      // 번아웃 위험도
      { metric: 'burnoutRisk', gender: 'male', ageGroup: '20-29', mean: 25, standardDeviation: 15, sampleSize: 600 },
      { metric: 'burnoutRisk', gender: 'male', ageGroup: '30-39', mean: 35, standardDeviation: 18, sampleSize: 700 },
      { metric: 'burnoutRisk', gender: 'male', ageGroup: '40-49', mean: 42, standardDeviation: 20, sampleSize: 650 },
      { metric: 'burnoutRisk', gender: 'male', ageGroup: '50-59', mean: 32, standardDeviation: 17, sampleSize: 550 },
      { metric: 'burnoutRisk', gender: 'male', ageGroup: '60+', mean: 32, standardDeviation: 17, sampleSize: 500 },
      
      { metric: 'burnoutRisk', gender: 'female', ageGroup: '20-29', mean: 28, standardDeviation: 16, sampleSize: 620 },
      { metric: 'burnoutRisk', gender: 'female', ageGroup: '30-39', mean: 38, standardDeviation: 19, sampleSize: 720 },
      { metric: 'burnoutRisk', gender: 'female', ageGroup: '40-49', mean: 45, standardDeviation: 21, sampleSize: 680 },
      { metric: 'burnoutRisk', gender: 'female', ageGroup: '50-59', mean: 35, standardDeviation: 18, sampleSize: 580 },
      { metric: 'burnoutRisk', gender: 'female', ageGroup: '60+', mean: 35, standardDeviation: 18, sampleSize: 520 },

      // 스트레스 위험도
      { metric: 'stressRisk', gender: 'male', ageGroup: '20-29', mean: 30, standardDeviation: 15, sampleSize: 900 },
      { metric: 'stressRisk', gender: 'male', ageGroup: '30-39', mean: 30, standardDeviation: 15, sampleSize: 850 },
      { metric: 'stressRisk', gender: 'male', ageGroup: '40-49', mean: 30, standardDeviation: 15, sampleSize: 800 },
      { metric: 'stressRisk', gender: 'male', ageGroup: '50-59', mean: 30, standardDeviation: 15, sampleSize: 750 },
      { metric: 'stressRisk', gender: 'male', ageGroup: '60+', mean: 30, standardDeviation: 15, sampleSize: 700 },
      
      { metric: 'stressRisk', gender: 'female', ageGroup: '20-29', mean: 35, standardDeviation: 16, sampleSize: 920 },
      { metric: 'stressRisk', gender: 'female', ageGroup: '30-39', mean: 35, standardDeviation: 16, sampleSize: 880 },
      { metric: 'stressRisk', gender: 'female', ageGroup: '40-49', mean: 35, standardDeviation: 16, sampleSize: 820 },
      { metric: 'stressRisk', gender: 'female', ageGroup: '50-59', mean: 35, standardDeviation: 16, sampleSize: 780 },
      { metric: 'stressRisk', gender: 'female', ageGroup: '60+', mean: 35, standardDeviation: 16, sampleSize: 720 },
    ];
  }

  /**
   * 점수 분포 구간 초기화
   */
  private initializeScoreDistribution(): void {
    this.scoreDistribution = {
      excellent: { min: 95, max: 100 },
      good: { min: 75, max: 94 },
      normal: { min: 25, max: 74 },
      borderline: { min: 5, max: 24 },
      attention: { min: 0, max: 4 }
    };
  }

  /**
   * 점수 분포 정보 조회
   */
  public getScoreDistribution(): ScoreDistribution {
    return this.scoreDistribution;
  }

  /**
   * 직업별 가중치 적용
   */
  public applyOccupationalAdjustment(
    score: StandardizedScore, 
    occupation: string
  ): StandardizedScore {
    const adjustments: { [key: string]: number } = {
      'office_worker': 5,      // 사무직 +5점
      'healthcare': 10,        // 의료진 +10점
      'teacher': 7,           // 교육자 +7점
      'engineer': 3,          // 엔지니어 +3점
      'manager': 8,           // 관리직 +8점
      'student': -2,          // 학생 -2점
      'retired': -5,          // 은퇴자 -5점
    };

    const adjustment = adjustments[occupation] || 0;
    const adjustedRaw = score.raw + adjustment;
    
    // 재계산이 필요한 경우 새로운 점수 생성
    if (adjustment !== 0) {
      return {
        ...score,
        raw: adjustedRaw,
        standardized: Math.max(0, Math.min(100, score.standardized + adjustment * 0.5)),
        gradeDescription: `${score.gradeDescription} (직업 특성 반영)`
      };
    }

    return score;
  }

  /**
   * 여러 점수의 가중평균 계산
   */
  public calculateWeightedAverage(
    scores: { score: StandardizedScore; weight: number }[]
  ): StandardizedScore {
    const totalWeight = scores.reduce((sum, item) => sum + item.weight, 0);
    
    const weightedRaw = scores.reduce((sum, item) => 
      sum + (item.score.raw * item.weight), 0) / totalWeight;
    
    const weightedStandardized = scores.reduce((sum, item) => 
      sum + (item.score.standardized * item.weight), 0) / totalWeight;
    
    const weightedPercentile = scores.reduce((sum, item) => 
      sum + (item.score.percentile * item.weight), 0) / totalWeight;

    const grade = this.getScoreGrade(weightedPercentile);
    
    return {
      raw: Math.round(weightedRaw * 10) / 10,
      standardized: Math.round(weightedStandardized),
      percentile: Math.round(weightedPercentile),
      grade,
      gradeDescription: `종합 ${this.getGradeDescription(grade, 'male', '30-39', weightedPercentile)}`,
      ageGenderAdjusted: scores.every(s => s.score.ageGenderAdjusted)
    };
  }
} 