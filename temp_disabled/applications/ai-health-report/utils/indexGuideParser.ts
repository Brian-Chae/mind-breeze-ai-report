import { indexGuides } from '../../../constants/indexGuides';

export interface NormalRange {
  min: number;
  max: number;
  label: string;
  interpretation: {
    low: string;
    normal: string;
    high: string;
  };
}

export interface PersonalInfo {
  age: number;
  gender: 'male' | 'female';
  occupation: string;
}

/**
 * indexGuides에서 정상값 범위를 추출하는 함수
 */
export function extractNormalRange(indexName: string): NormalRange | null {
  const guide = indexGuides[indexName];
  if (!guide) return null;

  // 정상 범위 패턴 매칭
  const normalRangePatterns = [
    /정상 범위:<\/strong>\s*([0-9.-]+)\s*-\s*([0-9.-]+)/,
    /정상 범위:<\/strong>\s*([0-9.-]+)~([0-9.-]+)/,
    /정상:<\/strong>\s*([0-9.-]+)\s*-\s*([0-9.-]+)/,
    /(\d+\.?\d*)\s*-\s*(\d+\.?\d*)\s*\(정상/,
    /(\d+\.?\d*)\s*-\s*(\d+\.?\d*)\s*BPM.*정상/,
    /(\d+\.?\d*)-(\d+\.?\d*)\s*%.*정상/,
    /(\d+\.?\d*)-(\d+\.?\d*)\s*ms.*정상/,
  ];

  let min: number | null = null;
  let max: number | null = null;

  for (const pattern of normalRangePatterns) {
    const match = guide.match(pattern);
    if (match) {
      min = parseFloat(match[1]);
      max = parseFloat(match[2]);
      break;
    }
  }

  if (min === null || max === null) return null;

  // 해석 추출
  const interpretation = extractInterpretation(guide);

  return {
    min,
    max,
    label: `${min}-${max}`,
    interpretation
  };
}

/**
 * 해석 정보를 추출하는 함수
 */
function extractInterpretation(guide: string): { low: string; normal: string; high: string } {
  const interpretation = {
    low: '정상 범위 미만',
    normal: '정상 범위',
    high: '정상 범위 초과'
  };

  // 해석 패턴 매칭
  const interpretationPatterns = [
    /(\d+\.?\d*)\s*미만:\s*([^<>]+)/g,
    /(\d+\.?\d*)\s*이하:\s*([^<>]+)/g,
    /(\d+\.?\d*)\s*초과:\s*([^<>]+)/g,
    /(\d+\.?\d*)\s*이상:\s*([^<>]+)/g,
  ];

  let match;
  interpretationPatterns.forEach(pattern => {
    while ((match = pattern.exec(guide)) !== null) {
      const value = parseFloat(match[1]);
      const desc = match[2].trim();
      
      if (match[0].includes('미만') || match[0].includes('이하')) {
        interpretation.low = desc;
      } else if (match[0].includes('초과') || match[0].includes('이상')) {
        interpretation.high = desc;
      }
    }
  });

  return interpretation;
}

/**
 * 연령별 정상값 조정 함수
 */
export function adjustRangeByAge(baseRange: NormalRange, age: number, indexName: string): NormalRange {
  const adjustedRange = { ...baseRange };

  // 연령별 조정 로직
  switch (indexName) {
    case '집중력':
    case '집중력 (Focus)':
      if (age < 20) {
        adjustedRange.min *= 0.9;
        adjustedRange.max *= 0.9;
      } else if (age > 60) {
        adjustedRange.min *= 0.95;
        adjustedRange.max *= 0.95;
      }
      break;

    case '이완도':
    case '이완및긴장도 (Arousal)':
      if (age < 30) {
        adjustedRange.min *= 0.95;
        adjustedRange.max *= 1.05;
      } else if (age > 50) {
        adjustedRange.min *= 1.05;
        adjustedRange.max *= 0.95;
      }
      break;

    case 'BPM':
      if (age < 30) {
        adjustedRange.min = 60;
        adjustedRange.max = 100;
      } else if (age < 50) {
        adjustedRange.min = 60;
        adjustedRange.max = 95;
      } else {
        adjustedRange.min = 55;
        adjustedRange.max = 90;
      }
      break;

    case 'RMSSD':
      if (age < 30) {
        adjustedRange.min = 25;
        adjustedRange.max = 55;
      } else if (age < 50) {
        adjustedRange.min = 20;
        adjustedRange.max = 50;
      } else {
        adjustedRange.min = 15;
        adjustedRange.max = 45;
      }
      break;

    case 'SDNN':
      if (age < 30) {
        adjustedRange.min = 35;
        adjustedRange.max = 105;
      } else if (age < 50) {
        adjustedRange.min = 30;
        adjustedRange.max = 100;
      } else {
        adjustedRange.min = 25;
        adjustedRange.max = 95;
      }
      break;
  }

  adjustedRange.label = `${adjustedRange.min.toFixed(1)}-${adjustedRange.max.toFixed(1)}`;
  return adjustedRange;
}

/**
 * 성별별 정상값 조정 함수
 */
export function adjustRangeByGender(baseRange: NormalRange, gender: 'male' | 'female', indexName: string): NormalRange {
  const adjustedRange = { ...baseRange };

  // 성별별 조정 로직
  switch (indexName) {
    case 'BPM':
      if (gender === 'female') {
        adjustedRange.min += 5;
        adjustedRange.max += 5;
      }
      break;

    case 'RMSSD':
    case 'SDNN':
      if (gender === 'female') {
        adjustedRange.min *= 1.1;
        adjustedRange.max *= 1.1;
      }
      break;

    case '집중력':
    case '집중력 (Focus)':
      // 성별 차이는 미미하므로 조정하지 않음
      break;
  }

  adjustedRange.label = `${adjustedRange.min.toFixed(1)}-${adjustedRange.max.toFixed(1)}`;
  return adjustedRange;
}

/**
 * 직업별 정상값 조정 함수
 */
export function adjustRangeByOccupation(baseRange: NormalRange, occupation: string, indexName: string): NormalRange {
  const adjustedRange = { ...baseRange };

  // 직업별 조정 로직
  const occupationCategory = getOccupationCategory(occupation);

  switch (indexName) {
    case '스트레스':
    case '스트레스 (Stress)':
      if (occupationCategory === 'high-stress') {
        adjustedRange.max *= 1.2; // 고스트레스 직업군은 스트레스 허용 범위 확대
      } else if (occupationCategory === 'low-stress') {
        adjustedRange.max *= 0.9; // 저스트레스 직업군은 스트레스 허용 범위 축소
      }
      break;

    case '집중력':
    case '집중력 (Focus)':
      if (occupationCategory === 'cognitive') {
        adjustedRange.min *= 1.1; // 인지 집약적 직업은 집중력 기준 상향
        adjustedRange.max *= 1.1;
      }
      break;

    case 'BPM':
      if (occupationCategory === 'physical') {
        adjustedRange.min -= 5; // 신체 활동 직업은 안정시 심박수 낮을 수 있음
        adjustedRange.max -= 5;
      }
      break;
  }

  adjustedRange.label = `${adjustedRange.min.toFixed(1)}-${adjustedRange.max.toFixed(1)}`;
  return adjustedRange;
}

/**
 * 직업 카테고리 분류 함수
 */
function getOccupationCategory(occupation: string): 'high-stress' | 'low-stress' | 'cognitive' | 'physical' | 'general' {
  const highStressOccupations = ['의료진', '교사', '관리자', '영업', '서비스업', '금융'];
  const lowStressOccupations = ['연구원', '예술가', '자영업', '프리랜서'];
  const cognitiveOccupations = ['개발자', '연구원', '분석가', '기획자', '디자이너'];
  const physicalOccupations = ['운동선수', '건설업', '제조업', '운송업'];

  if (highStressOccupations.some(cat => occupation.includes(cat))) return 'high-stress';
  if (lowStressOccupations.some(cat => occupation.includes(cat))) return 'low-stress';
  if (cognitiveOccupations.some(cat => occupation.includes(cat))) return 'cognitive';
  if (physicalOccupations.some(cat => occupation.includes(cat))) return 'physical';
  
  return 'general';
}

/**
 * 개인정보 기반 정상값 범위 생성 함수
 */
export function getPersonalizedNormalRange(indexName: string, personalInfo: PersonalInfo): NormalRange | null {
  let range = extractNormalRange(indexName);
  if (!range) return null;

  // 연령별 조정
  range = adjustRangeByAge(range, personalInfo.age, indexName);
  
  // 성별별 조정
  range = adjustRangeByGender(range, personalInfo.gender, indexName);
  
  // 직업별 조정
  range = adjustRangeByOccupation(range, personalInfo.occupation, indexName);

  return range;
}

/**
 * 모든 EEG 지표의 정상값 범위를 가져오는 함수
 */
export function getAllEEGNormalRanges(personalInfo: PersonalInfo): Record<string, NormalRange> {
  const eegIndices = [
    '집중력', '집중력 (Focus)',
    '이완도', '이완및긴장도 (Arousal)',
    '스트레스', '스트레스 (Stress)',
    '좌우뇌 균형',
    '인지 부하',
    '정서 안정성', '정서안정성 (Valence)',
    '신경활동성'
  ];

  const ranges: Record<string, NormalRange> = {};
  
  eegIndices.forEach(index => {
    const range = getPersonalizedNormalRange(index, personalInfo);
    if (range) {
      ranges[index] = range;
    }
  });

  return ranges;
}

/**
 * 모든 PPG 지표의 정상값 범위를 가져오는 함수
 */
export function getAllPPGNormalRanges(personalInfo: PersonalInfo): Record<string, NormalRange> {
  const ppgIndices = [
    'BPM', 'SpO2', 'Stress', 'SDNN', 'RMSSD', 'PNN50',
    'LF', 'HF', 'LF/HF', 'SDSD', 'AVNN', 'PNN20', 'HR Max'
  ];

  const ranges: Record<string, NormalRange> = {};
  
  ppgIndices.forEach(index => {
    const range = getPersonalizedNormalRange(index, personalInfo);
    if (range) {
      ranges[index] = range;
    }
  });

  return ranges;
}

/**
 * 모든 ACC 지표의 정상값 범위를 가져오는 함수
 */
export function getAllACCNormalRanges(personalInfo: PersonalInfo): Record<string, NormalRange> {
  const accIndices = [
    'Activity State', '안정성', '강도', '균형',
    'Average Movement', 'Standard Deviation Movement', 'Max Movement'
  ];

  const ranges: Record<string, NormalRange> = {};
  
  accIndices.forEach(index => {
    const range = getPersonalizedNormalRange(index, personalInfo);
    if (range) {
      ranges[index] = range;
    }
  });

  return ranges;
} 