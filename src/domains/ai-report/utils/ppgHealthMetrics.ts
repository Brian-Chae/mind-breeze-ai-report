/**
 * PPG 3대 건강지표 계산 유틸리티
 * 1분 측정 데이터에 최적화된 건강 점수 계산
 */

// PPG 통계 데이터 타입 (PPGAdvancedGeminiEngine과 동일)
interface PPGTimeSeriesStats {
  heartRate: {
    mean: number;
    std: number;
    min: number;
    max: number;
  };
  hrvTimeMetrics: {
    sdnn: number;
    rmssd: number;
    pnn50: number;
    pnn20: number;
  };
  hrvFrequencyMetrics: {
    lfPower: number;
    hfPower: number;
    lfHfRatio: number;
    stressIndex: number;
  };
}

// 3대 건강지표 결과 타입
export interface PPGHealthScores {
  stress: {
    score: number;        // 0-100
    level: 'excellent' | 'good' | 'fair' | 'poor';
    value: number;        // 원시 스트레스 지수 값
  };
  autonomic: {
    score: number;        // 0-100
    level: 'balanced' | 'slightly_imbalanced' | 'imbalanced' | 'severely_imbalanced';
    value: number;        // LF/HF 비율
  };
  hrv: {
    score: number;        // 0-100
    level: 'excellent' | 'good' | 'fair' | 'poor';
    value: number;        // RMSSD 값
  };
  overall: number;        // 3대 지표 평균 점수
}

/**
 * 스트레스 건강도 점수 계산
 * 스트레스 지수 30-70이 정상범위, 50이 최적
 */
export function calculateStressHealthScore(stressIndex: number): number {
  // 30-70이 정상범위
  if (stressIndex <= 30) return 100;
  if (stressIndex >= 70) return 0;
  
  // 50이 최적점
  if (stressIndex <= 50) {
    // 30-50 구간: 100 → 80점
    return 100 - ((50 - stressIndex) / 20) * 20;
  } else {
    // 50-70 구간: 80 → 0점
    return 80 - ((stressIndex - 50) / 20) * 80;
  }
}

/**
 * 자율신경 균형 점수 계산
 * LF/HF 비율 0.5-2.0이 정상범위, 1.0이 최적
 */
export function calculateAutonomicBalanceScore(lfHfRatio: number): number {
  const optimalRatio = 1.0;
  const deviation = Math.abs(lfHfRatio - optimalRatio);
  
  // 0.5-2.0이 정상범위
  if (lfHfRatio < 0.5 || lfHfRatio > 2.0) {
    // 정상범위 벗어남
    return Math.max(0, 50 - deviation * 20);
  }
  
  // 정상범위 내에서 1.0에 가까울수록 높은 점수
  return Math.max(0, 100 - deviation * 50);
}

/**
 * HRV 건강도 점수 계산
 * RMSSD와 SDNN을 종합하여 점수 계산
 */
export function calculateHRVHealthScore(rmssd: number, sdnn: number): number {
  // RMSSD 점수 계산 (20-80ms가 정상)
  let rmssdScore = 0;
  if (rmssd >= 20 && rmssd <= 80) {
    rmssdScore = 50 + (rmssd - 20) / 60 * 50;
  } else if (rmssd > 80) {
    rmssdScore = 100;
  } else {
    rmssdScore = (rmssd / 20) * 50;
  }
  
  // SDNN 점수 계산 (30-100ms가 정상)
  let sdnnScore = 0;
  if (sdnn >= 30 && sdnn <= 100) {
    sdnnScore = 50 + (sdnn - 30) / 70 * 50;
  } else if (sdnn > 100) {
    sdnnScore = 100;
  } else {
    sdnnScore = (sdnn / 30) * 50;
  }
  
  // RMSSD가 1분 측정에서 더 신뢰할 수 있으므로 가중치 높게
  return rmssdScore * 0.7 + sdnnScore * 0.3;
}

/**
 * 레벨 결정 함수들
 */
function getStressLevel(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

function getAutonomicLevel(score: number): 'balanced' | 'slightly_imbalanced' | 'imbalanced' | 'severely_imbalanced' {
  if (score >= 80) return 'balanced';
  if (score >= 60) return 'slightly_imbalanced';
  if (score >= 40) return 'imbalanced';
  return 'severely_imbalanced';
}

function getHRVLevel(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

/**
 * PPG 3대 건강지표 통합 계산
 */
export function calculatePPGHealthScores(stats: PPGTimeSeriesStats): PPGHealthScores {
  // 1. 스트레스 건강도
  const stressScore = calculateStressHealthScore(stats.hrvFrequencyMetrics.stressIndex);
  
  // 2. 자율신경 균형
  const autonomicScore = calculateAutonomicBalanceScore(stats.hrvFrequencyMetrics.lfHfRatio);
  
  // 3. HRV 건강도
  const hrvScore = calculateHRVHealthScore(
    stats.hrvTimeMetrics.rmssd, 
    stats.hrvTimeMetrics.sdnn
  );
  
  // 종합 점수 (3대 지표 평균)
  const overallScore = (stressScore + autonomicScore + hrvScore) / 3;
  
  return {
    stress: {
      score: Math.round(stressScore),
      level: getStressLevel(stressScore),
      value: stats.hrvFrequencyMetrics.stressIndex
    },
    autonomic: {
      score: Math.round(autonomicScore),
      level: getAutonomicLevel(autonomicScore),
      value: stats.hrvFrequencyMetrics.lfHfRatio
    },
    hrv: {
      score: Math.round(hrvScore),
      level: getHRVLevel(hrvScore),
      value: stats.hrvTimeMetrics.rmssd
    },
    overall: Math.round(overallScore)
  };
}

/**
 * Poincaré Plot 데이터 계산
 * RR intervals로부터 SD1(단기 변동성)과 SD2(장기 변동성) 계산
 */
export function calculatePoincarePlotData(rrIntervals: number[]): {
  points: Array<{x: number, y: number}>;
  sd1: number;
  sd2: number;
  meanRR: number;
  ellipse: {
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    angle: number;
  };
} {
  if (!rrIntervals || rrIntervals.length < 2) {
    return { 
      points: [], 
      sd1: 0, 
      sd2: 0, 
      meanRR: 0,
      ellipse: { cx: 0, cy: 0, rx: 0, ry: 0, angle: 45 }
    };
  }
  
  // Poincaré plot 포인트 생성
  const points = [];
  for (let i = 0; i < rrIntervals.length - 1; i++) {
    points.push({
      x: rrIntervals[i],
      y: rrIntervals[i + 1]
    });
  }
  
  // 평균 RR 간격
  const meanRR = rrIntervals.reduce((sum, rr) => sum + rr, 0) / rrIntervals.length;
  
  // SD1 계산 (단기 변동성) - 45도 회전된 축의 표준편차
  let sd1Sum = 0;
  for (let i = 0; i < rrIntervals.length - 1; i++) {
    const diff = (rrIntervals[i + 1] - rrIntervals[i]) / Math.sqrt(2);
    sd1Sum += diff * diff;
  }
  const sd1 = Math.sqrt(sd1Sum / (rrIntervals.length - 1));
  
  // SD2 계산 (장기 변동성) - 45도 회전된 축의 표준편차
  let sd2Sum = 0;
  for (let i = 0; i < rrIntervals.length - 1; i++) {
    const sum = (rrIntervals[i + 1] + rrIntervals[i]) / 2;
    const diff = sum - meanRR;
    sd2Sum += diff * diff;
  }
  const sd2 = Math.sqrt(sd2Sum / (rrIntervals.length - 1)) * Math.sqrt(2);
  
  // 타원 파라미터 계산 (SD1, SD2를 기반으로)
  const ellipse = {
    cx: meanRR,
    cy: meanRR,
    rx: sd2 * 2,  // 장축 반경
    ry: sd1 * 2,  // 단축 반경
    angle: 45     // 45도 회전
  };
  
  return { points, sd1, sd2, meanRR, ellipse };
}

/**
 * RR Interval 시계열 데이터 준비
 * 1분 측정 데이터를 시각화용으로 변환
 */
export function prepareRRIntervalTimeSeries(rrIntervals: number[]): Array<{
  time: number;
  rrInterval: number;
  heartRate: number;
}> {
  if (!rrIntervals || rrIntervals.length === 0) {
    return [];
  }
  
  const timeSeries = [];
  let cumulativeTime = 0;
  
  for (let i = 0; i < rrIntervals.length; i++) {
    const rrInterval = rrIntervals[i];
    const heartRate = 60000 / rrInterval; // ms to bpm
    
    timeSeries.push({
      time: cumulativeTime / 1000, // ms to seconds
      rrInterval,
      heartRate
    });
    
    cumulativeTime += rrInterval;
  }
  
  return timeSeries;
}