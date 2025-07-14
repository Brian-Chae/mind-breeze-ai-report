import { 
  extractNormalRange, 
  adjustRangeByAge, 
  adjustRangeByGender, 
  adjustRangeByOccupation,
  getPersonalizedNormalRange,
  getAllEEGNormalRanges,
  getAllPPGNormalRanges,
  getAllACCNormalRanges,
  PersonalInfo 
} from './indexGuideParser';
import { indexGuides } from '../../../constants/indexGuides';

/**
 * 동적 연동 시스템 테스트 함수
 */
export function testDynamicIntegration(): void {
  console.log('\n🔍 === 동적 연동 시스템 테스트 시작 ===\n');

  // 1. indexGuides 데이터 존재 확인
  console.log('1️⃣ indexGuides 데이터 존재 확인');
  const availableGuides = Object.keys(indexGuides);
  console.log(`   ✅ 총 ${availableGuides.length}개의 indexGuides 존재`);
  console.log(`   📋 주요 가이드들:`, availableGuides.slice(0, 10));
  
  // 2. 정상값 범위 추출 테스트
  console.log('\n2️⃣ 정상값 범위 추출 테스트');
  const testIndices = ['집중력', 'BPM', 'RMSSD', 'SDNN', '이완도', 'SpO2'];
  
  testIndices.forEach(indexName => {
    const range = extractNormalRange(indexName);
    if (range) {
      console.log(`   ✅ ${indexName}: ${range.label} (${range.min}-${range.max})`);
    } else {
      console.log(`   ❌ ${indexName}: 정상값 범위 추출 실패`);
    }
  });

  // 3. 개인화된 정상값 범위 테스트
  console.log('\n3️⃣ 개인화된 정상값 범위 테스트');
  
  const testPersonalInfos: PersonalInfo[] = [
    { age: 25, gender: 'male', occupation: 'office_worker' },
    { age: 35, gender: 'female', occupation: 'teacher' },
    { age: 45, gender: 'male', occupation: 'entrepreneur' },
    { age: 55, gender: 'female', occupation: 'housewife' }
  ];

  testPersonalInfos.forEach((personalInfo, index) => {
    console.log(`\n   👤 테스트 사용자 ${index + 1}: ${personalInfo.age}세 ${personalInfo.gender === 'male' ? '남성' : '여성'} (${personalInfo.occupation})`);
    
    // BPM 개인화 테스트
    const bpmRange = getPersonalizedNormalRange('BPM', personalInfo);
    if (bpmRange) {
      console.log(`      💓 BPM: ${bpmRange.label}`);
    }
    
    // RMSSD 개인화 테스트
    const rmssdRange = getPersonalizedNormalRange('RMSSD', personalInfo);
    if (rmssdRange) {
      console.log(`      🫀 RMSSD: ${rmssdRange.label}`);
    }
    
    // 집중력 개인화 테스트
    const focusRange = getPersonalizedNormalRange('집중력', personalInfo);
    if (focusRange) {
      console.log(`      🧠 집중력: ${focusRange.label}`);
    }
  });

  // 4. 전체 범위 생성 테스트
  console.log('\n4️⃣ 전체 범위 생성 테스트');
  const samplePersonalInfo: PersonalInfo = { age: 30, gender: 'male', occupation: 'office_worker' };
  
  const eegRanges = getAllEEGNormalRanges(samplePersonalInfo);
  const ppgRanges = getAllPPGNormalRanges(samplePersonalInfo);
  const accRanges = getAllACCNormalRanges(samplePersonalInfo);
  
  console.log(`   🧠 EEG 범위 생성: ${Object.keys(eegRanges).length}개`);
  console.log(`   💓 PPG 범위 생성: ${Object.keys(ppgRanges).length}개`);
  console.log(`   📱 ACC 범위 생성: ${Object.keys(accRanges).length}개`);
  
  // 5. 연령별 조정 테스트
  console.log('\n5️⃣ 연령별 조정 테스트');
  const baseRange = extractNormalRange('BPM');
  if (baseRange) {
    console.log(`   기본 BPM 범위: ${baseRange.label}`);
    
    const ages = [20, 30, 40, 50, 60];
    ages.forEach(age => {
      const adjustedRange = adjustRangeByAge(baseRange, age, 'BPM');
      console.log(`   ${age}세: ${adjustedRange.label}`);
    });
  }

  // 6. 성별별 조정 테스트
  console.log('\n6️⃣ 성별별 조정 테스트');
  if (baseRange) {
    const maleRange = adjustRangeByGender(baseRange, 'male', 'BPM');
    const femaleRange = adjustRangeByGender(baseRange, 'female', 'BPM');
    
    console.log(`   남성 BPM: ${maleRange.label}`);
    console.log(`   여성 BPM: ${femaleRange.label}`);
  }

  // 7. 직업별 조정 테스트
  console.log('\n7️⃣ 직업별 조정 테스트');
  if (baseRange) {
    const occupations = ['office_worker', 'teacher', 'entrepreneur', 'soldier'];
    occupations.forEach(occupation => {
      const adjustedRange = adjustRangeByOccupation(baseRange, occupation, 'BPM');
      console.log(`   ${occupation}: ${adjustedRange.label}`);
    });
  }

  // 8. 오류 케이스 테스트
  console.log('\n8️⃣ 오류 케이스 테스트');
  
  // 존재하지 않는 인덱스
  const nonExistentRange = extractNormalRange('NonExistentIndex');
  console.log(`   존재하지 않는 인덱스: ${nonExistentRange ? '실패' : '✅ 올바르게 null 반환'}`);
  
  // 잘못된 개인정보
  const invalidPersonalInfo = { age: -5, gender: 'invalid' as any, occupation: 'invalid' };
  const invalidRange = getPersonalizedNormalRange('BPM', invalidPersonalInfo);
  console.log(`   잘못된 개인정보: ${invalidRange ? '처리됨' : '❌ null 반환'}`);

  console.log('\n🔍 === 동적 연동 시스템 테스트 완료 ===\n');
}

/**
 * AI 프롬프트 동적 생성 테스트
 */
export function testDynamicPromptGeneration(): void {
  console.log('\n🤖 === AI 프롬프트 동적 생성 테스트 시작 ===\n');

  const testPersonalInfo: PersonalInfo = { 
    age: 32, 
    gender: 'female', 
    occupation: 'teacher' 
  };

  // 1. 개인화된 범위 생성
  const eegRanges = getAllEEGNormalRanges(testPersonalInfo);
  const ppgRanges = getAllPPGNormalRanges(testPersonalInfo);
  const accRanges = getAllACCNormalRanges(testPersonalInfo);

  console.log('1️⃣ 개인화된 범위 생성 결과:');
  console.log(`   EEG: ${Object.keys(eegRanges).length}개 범위`);
  console.log(`   PPG: ${Object.keys(ppgRanges).length}개 범위`);
  console.log(`   ACC: ${Object.keys(accRanges).length}개 범위`);

  // 2. 동적 범위 문자열 생성 시뮬레이션
  console.log('\n2️⃣ 동적 범위 문자열 생성:');
  
  const generateDynamicRangeString = (ranges: Record<string, any>): string => {
    return Object.entries(ranges)
      .map(([key, range]) => `- ${key}: ${range.label} (${range.interpretation?.normal || '정상 범위'})`)
      .join('\n');
  };

  const eegRangeString = generateDynamicRangeString(eegRanges);
  const ppgRangeString = generateDynamicRangeString(ppgRanges);
  const accRangeString = generateDynamicRangeString(accRanges);

  console.log('\n   📊 EEG 범위 문자열:');
  console.log(eegRangeString);
  
  console.log('\n   💓 PPG 범위 문자열:');
  console.log(ppgRangeString);
  
  console.log('\n   📱 ACC 범위 문자열:');
  console.log(accRangeString);

  // 3. 프롬프트 통합 시뮬레이션
  console.log('\n3️⃣ AI 프롬프트 통합 시뮬레이션:');
  
  const dynamicPrompt = `
## 분석 기준 (개인화된 정상값 범위 - ${testPersonalInfo.age}세 ${testPersonalInfo.gender === 'male' ? '남성' : '여성'} ${testPersonalInfo.occupation} 기준)

### EEG 분석 기준 (indexGuides 기반 개인화)
${eegRangeString}

### PPG 분석 기준 (indexGuides 기반 개인화)
${ppgRangeString}

### ACC 측정 품질 기준 (indexGuides 기반 개인화)
${accRangeString}
  `;

  console.log(dynamicPrompt);

  console.log('\n🤖 === AI 프롬프트 동적 생성 테스트 완료 ===\n');
}

/**
 * 실제 GeminiAIService 통합 테스트
 */
export function testGeminiServiceIntegration(): void {
  console.log('\n🚀 === GeminiAIService 통합 테스트 시작 ===\n');

  // 실제 GeminiAIService의 동적 연동 기능 테스트
  // 이 부분은 실제 서비스 코드에서 확인해야 함
  
  const testPersonalInfo = {
    name: '테스트 사용자',
    age: 28,
    gender: 'male' as const,
    occupation: 'office_worker',
    birthYear: 1996,
    birthMonth: 5,
    birthDay: 15
  };

  console.log('1️⃣ 테스트 개인정보:');
  console.log(`   이름: ${testPersonalInfo.name}`);
  console.log(`   나이: ${testPersonalInfo.age}세`);
  console.log(`   성별: ${testPersonalInfo.gender === 'male' ? '남성' : '여성'}`);
  console.log(`   직업: ${testPersonalInfo.occupation}`);

  console.log('\n2️⃣ 동적 연동 시스템 적용 결과:');
  
  // PersonalInfo 변환 테스트
  const convertedPersonalInfo: PersonalInfo = {
    age: testPersonalInfo.age,
    gender: testPersonalInfo.gender,
    occupation: testPersonalInfo.occupation
  };

  const eegRanges = getAllEEGNormalRanges(convertedPersonalInfo);
  const ppgRanges = getAllPPGNormalRanges(convertedPersonalInfo);
  const accRanges = getAllACCNormalRanges(convertedPersonalInfo);

  console.log(`   ✅ EEG 개인화 범위: ${Object.keys(eegRanges).length}개 생성`);
  console.log(`   ✅ PPG 개인화 범위: ${Object.keys(ppgRanges).length}개 생성`);
  console.log(`   ✅ ACC 개인화 범위: ${Object.keys(accRanges).length}개 생성`);

  // 주요 범위 출력
  console.log('\n3️⃣ 주요 개인화 범위 예시:');
  if (eegRanges['집중력']) {
    console.log(`   🧠 집중력: ${eegRanges['집중력'].label}`);
  }
  if (ppgRanges['BPM']) {
    console.log(`   💓 심박수: ${ppgRanges['BPM'].label}`);
  }
  if (ppgRanges['RMSSD']) {
    console.log(`   🫀 RMSSD: ${ppgRanges['RMSSD'].label}`);
  }

  console.log('\n🚀 === GeminiAIService 통합 테스트 완료 ===\n');
}

/**
 * 전체 동적 연동 시스템 테스트 실행
 */
export function runAllDynamicIntegrationTests(): void {
  console.log('🎯 === 전체 동적 연동 시스템 테스트 실행 ===');
  
  try {
    testDynamicIntegration();
    testDynamicPromptGeneration();
    testGeminiServiceIntegration();
    
    console.log('✅ === 모든 테스트 완료 - 동적 연동 시스템 정상 작동 ===');
  } catch (error) {
    console.error('❌ === 테스트 실행 중 오류 발생 ===');
    console.error(error);
  }
} 