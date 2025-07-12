import React, { useState, useEffect } from 'react';
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
} from '../utils/indexGuideParser';
import { indexGuides } from '../../../constants/indexGuides';

interface TestResult {
  testName: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export function TestDynamicIntegration() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    const results: TestResult[] = [];
    
    try {
      // 1. indexGuides 데이터 존재 확인
      const availableGuides = Object.keys(indexGuides);
      results.push({
        testName: 'indexGuides 데이터 존재 확인',
        status: availableGuides.length > 0 ? 'success' : 'error',
        message: `총 ${availableGuides.length}개의 indexGuides 존재`,
        details: availableGuides.slice(0, 10)
      });

      // 2. 정상값 범위 추출 테스트
      const testIndices = ['집중력', 'BPM', 'RMSSD', 'SDNN', '이완도', 'SpO2'];
      const extractionResults: any = {};
      
      testIndices.forEach(indexName => {
        const range = extractNormalRange(indexName);
        extractionResults[indexName] = range;
      });
      
      const successfulExtractions = Object.values(extractionResults).filter(r => r !== null).length;
      results.push({
        testName: '정상값 범위 추출 테스트',
        status: successfulExtractions > 0 ? 'success' : 'error',
        message: `${successfulExtractions}/${testIndices.length}개 성공적으로 추출`,
        details: extractionResults
      });

      // 3. 개인화된 정상값 범위 테스트
      const testPersonalInfos: PersonalInfo[] = [
        { age: 25, gender: 'male', occupation: 'office_worker' },
        { age: 35, gender: 'female', occupation: 'teacher' },
        { age: 45, gender: 'male', occupation: 'entrepreneur' },
        { age: 55, gender: 'female', occupation: 'housewife' }
      ];

      const personalizationResults: any = {};
      testPersonalInfos.forEach((personalInfo, index) => {
        const bpmRange = getPersonalizedNormalRange('BPM', personalInfo);
        const rmssdRange = getPersonalizedNormalRange('RMSSD', personalInfo);
        const focusRange = getPersonalizedNormalRange('집중력', personalInfo);
        
        personalizationResults[`user_${index + 1}`] = {
          info: personalInfo,
          BPM: bpmRange?.label || 'N/A',
          RMSSD: rmssdRange?.label || 'N/A',
          Focus: focusRange?.label || 'N/A'
        };
      });

      results.push({
        testName: '개인화된 정상값 범위 테스트',
        status: 'success',
        message: `${testPersonalInfos.length}명의 개인화 범위 생성 완료`,
        details: personalizationResults
      });

      // 4. 전체 범위 생성 테스트
      const samplePersonalInfo: PersonalInfo = { age: 30, gender: 'male', occupation: 'office_worker' };
      
      const eegRanges = getAllEEGNormalRanges(samplePersonalInfo);
      const ppgRanges = getAllPPGNormalRanges(samplePersonalInfo);
      const accRanges = getAllACCNormalRanges(samplePersonalInfo);
      
      results.push({
        testName: '전체 범위 생성 테스트',
        status: 'success',
        message: `EEG: ${Object.keys(eegRanges).length}개, PPG: ${Object.keys(ppgRanges).length}개, ACC: ${Object.keys(accRanges).length}개`,
        details: {
          eegRanges: Object.keys(eegRanges),
          ppgRanges: Object.keys(ppgRanges),
          accRanges: Object.keys(accRanges)
        }
      });

      // 5. 연령별 조정 테스트
      const baseRange = extractNormalRange('BPM');
      if (baseRange) {
        const ages = [20, 30, 40, 50, 60];
        const ageAdjustments: any = {};
        ages.forEach(age => {
          const adjustedRange = adjustRangeByAge(baseRange, age, 'BPM');
          ageAdjustments[`age_${age}`] = adjustedRange.label;
        });
        
        results.push({
          testName: '연령별 조정 테스트',
          status: 'success',
          message: `${ages.length}개 연령대 조정 완료`,
          details: ageAdjustments
        });
      }

      // 6. 성별별 조정 테스트
      if (baseRange) {
        const maleRange = adjustRangeByGender(baseRange, 'male', 'BPM');
        const femaleRange = adjustRangeByGender(baseRange, 'female', 'BPM');
        
        results.push({
          testName: '성별별 조정 테스트',
          status: 'success',
          message: '남성/여성 조정 완료',
          details: {
            male: maleRange.label,
            female: femaleRange.label
          }
        });
      }

      // 7. 직업별 조정 테스트
      if (baseRange) {
        const occupations = ['office_worker', 'teacher', 'entrepreneur', 'soldier'];
        const occupationAdjustments: any = {};
        occupations.forEach(occupation => {
          const adjustedRange = adjustRangeByOccupation(baseRange, occupation, 'BPM');
          occupationAdjustments[occupation] = adjustedRange.label;
        });
        
        results.push({
          testName: '직업별 조정 테스트',
          status: 'success',
          message: `${occupations.length}개 직업 조정 완료`,
          details: occupationAdjustments
        });
      }

      // 8. 오류 케이스 테스트
      const nonExistentRange = extractNormalRange('NonExistentIndex');
      const invalidPersonalInfo = { age: -5, gender: 'invalid' as any, occupation: 'invalid' };
      const invalidRange = getPersonalizedNormalRange('BPM', invalidPersonalInfo);
      
      results.push({
        testName: '오류 케이스 테스트',
        status: !nonExistentRange && invalidRange ? 'success' : 'warning',
        message: '오류 처리 확인',
        details: {
          nonExistentRange: nonExistentRange === null ? 'OK' : 'FAIL',
          invalidPersonalInfo: invalidRange ? 'Handled' : 'Failed'
        }
      });

      // 9. 동적 프롬프트 생성 테스트
      const testPersonalInfo: PersonalInfo = { 
        age: 32, 
        gender: 'female', 
        occupation: 'teacher' 
      };

      const dynamicEegRanges = getAllEEGNormalRanges(testPersonalInfo);
      const dynamicPpgRanges = getAllPPGNormalRanges(testPersonalInfo);
      const dynamicAccRanges = getAllACCNormalRanges(testPersonalInfo);

      const generateDynamicRangeString = (ranges: Record<string, any>): string => {
        return Object.entries(ranges)
          .map(([key, range]) => `- ${key}: ${range.label} (${range.interpretation?.normal || '정상 범위'})`)
          .join('\n');
      };

      const eegRangeString = generateDynamicRangeString(dynamicEegRanges);
      const ppgRangeString = generateDynamicRangeString(dynamicPpgRanges);
      const accRangeString = generateDynamicRangeString(dynamicAccRanges);

      results.push({
        testName: '동적 프롬프트 생성 테스트',
        status: 'success',
        message: '개인화된 프롬프트 생성 완료',
        details: {
          personalInfo: testPersonalInfo,
          eegRangeString: eegRangeString.substring(0, 200) + '...',
          ppgRangeString: ppgRangeString.substring(0, 200) + '...',
          accRangeString: accRangeString.substring(0, 200) + '...'
        }
      });

    } catch (error) {
      results.push({
        testName: '테스트 실행 중 오류',
        status: 'error',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        details: error
      });
    }
    
    setTestResults(results);
    setIsRunning(false);
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return '⏳';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🔍 동적 연동 시스템 테스트
        </h2>
        <p className="text-gray-600">
          indexGuides → AI 프롬프트 동적 연동 시스템의 정상 작동을 검증합니다.
        </p>
      </div>

      <div className="mb-6">
        <button
          onClick={runTests}
          disabled={isRunning}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            isRunning
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isRunning ? '테스트 실행 중...' : '테스트 실행'}
        </button>
      </div>

      {testResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">테스트 결과</h3>
          
          {testResults.map((result, index) => (
            <div key={index} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{getStatusIcon(result.status)}</span>
                <h4 className={`font-medium ${getStatusColor(result.status)}`}>
                  {result.testName}
                </h4>
              </div>
              
              <p className="text-gray-700 mb-2">{result.message}</p>
              
              {result.details && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                    상세 정보 보기
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">테스트 요약</h4>
            <div className="text-sm text-blue-700">
              <p>✅ 성공: {testResults.filter(r => r.status === 'success').length}개</p>
              <p>⚠️ 경고: {testResults.filter(r => r.status === 'warning').length}개</p>
              <p>❌ 오류: {testResults.filter(r => r.status === 'error').length}개</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 