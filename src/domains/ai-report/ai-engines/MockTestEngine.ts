/**
 * Mock Test AI 엔진 구현체
 * 개발 및 테스트용 가상 AI 엔진
 */

import { 
  IAIEngine, 
  MeasurementDataType, 
  ValidationResult, 
  AnalysisOptions, 
  AnalysisResult, 
  EngineCapabilities 
} from '../core/interfaces/IAIEngine';

export class MockTestEngine implements IAIEngine {
  // 기본 정보 (표준화된 형식)
  readonly id = 'mock-test-v1';
  readonly name = 'Mock 테스트 엔진';
  readonly description = '개발 및 테스트용 가상 AI 분석 엔진';
  readonly version = '1.0.0';
  readonly provider = 'custom';
  
  // 지원 기능 (표준화된 형식)
  readonly supportedDataTypes: MeasurementDataType = {
    eeg: true,
    ppg: true,
    acc: true
  };
  
  readonly costPerAnalysis = 0; // 테스트용이므로 무료
  readonly recommendedRenderers = ['mock-test-web'];
  
  readonly capabilities: EngineCapabilities = {
    supportedLanguages: ['ko', 'en'],
    maxDataDuration: 600, // 10분
    minDataQuality: 10, // 낮은 품질도 허용 (테스트용)
    supportedOutputFormats: ['json', 'text'],
    realTimeProcessing: true // 테스트용으로 실시간 처리 지원
  };

  constructor() {
    console.log(`${this.name} 초기화됨 - 테스트 환경용`);
  }

  /**
   * 측정 데이터 유효성 검증 (관대한 검증)
   */
  async validate(data: any): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let qualityScore = 100; // 테스트용으로 기본 만점

    try {
      // 기본 구조 검증
      if (!data) {
        errors.push('측정 데이터가 없습니다.');
        return { isValid: false, errors, warnings, qualityScore: 0 };
      }

      // 각 데이터 타입 존재 여부 확인 (관대한 검증)
      if (!data.eeg && !data.ppg && !data.acc) {
        warnings.push('모든 생체 데이터가 누락되었습니다. 기본값으로 처리합니다.');
        qualityScore = 50;
      }

      // EEG 데이터 간단 검증
      if (data.eeg) {
        if (!data.eeg.rawData || data.eeg.rawData.length === 0) {
          warnings.push('EEG 원시 데이터가 없어 샘플 데이터로 대체됩니다.');
          qualityScore *= 0.8;
        }
      }

      // PPG 데이터 간단 검증
      if (data.ppg) {
        if (!data.ppg.rawData || data.ppg.rawData.length === 0) {
          warnings.push('PPG 원시 데이터가 없어 샘플 데이터로 대체됩니다.');
          qualityScore *= 0.8;
        }
      }

      // ACC 데이터 간단 검증
      if (data.acc) {
        if (!data.acc.rawData || data.acc.rawData.length === 0) {
          warnings.push('ACC 원시 데이터가 없어 샘플 데이터로 대체됩니다.');
          qualityScore *= 0.9;
        }
      }

      qualityScore = Math.min(100, Math.max(0, qualityScore));

      return {
        isValid: true, // Mock 엔진은 항상 통과
        errors,
        warnings,
        qualityScore
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [`Mock 엔진 검증 오류: ${error}`],
        warnings,
        qualityScore: 0
      };
    }
  }

  /**
   * Mock AI 분석 수행 (시뮬레이션)
   */
  async analyze(data: any, options: AnalysisOptions = {}): Promise<AnalysisResult> {
    const startTime = Date.now();
    const analysisId = `${this.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // 데이터 유효성 검증
      const validation = await this.validate(data);
      
      // Mock 분석 처리 시간 시뮬레이션 (100-500ms)
      const simulationTime = Math.random() * 400 + 100;
      await new Promise(resolve => setTimeout(resolve, simulationTime));

      // Mock 분석 결과 생성
      const mockResults = this.generateMockResults(data, options);
      
      const processingTime = Date.now() - startTime;

      return {
        engineId: this.id,
        engineVersion: this.version,
        timestamp: new Date().toISOString(),
        analysisId,
        
        // Mock 분석 결과
        overallScore: mockResults.overallScore,
        stressLevel: mockResults.stressLevel,
        focusLevel: mockResults.focusLevel,
        
        // 상세 분석
        insights: {
          summary: mockResults.summary,
          detailedAnalysis: mockResults.detailedAnalysis,
          recommendations: mockResults.recommendations,
          warnings: validation.warnings
        },
        
        // Mock 생체 지표
        metrics: mockResults.metrics,
        
        // 메타 정보
        processingTime,
        costUsed: this.costPerAnalysis,
        rawData: { 
          mockEngine: true, 
          simulatedProcessingTime: simulationTime,
          inputDataSummary: this.summarizeInputData(data)
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      return {
        engineId: this.id,
        engineVersion: this.version,
        timestamp: new Date().toISOString(),
        analysisId,
        
        overallScore: 0,
        stressLevel: 0,
        focusLevel: 0,
        
        insights: {
          summary: 'Mock 엔진 분석 중 오류가 발생했습니다.',
          detailedAnalysis: `오류 내용: ${error}`,
          recommendations: ['Mock 엔진 설정을 확인해주세요.'],
          warnings: ['Mock 엔진 오류']
        },
        
        metrics: {},
        
        processingTime,
        costUsed: 0,
        rawData: { error: error?.toString(), mockEngine: true }
      };
    }
  }

  /**
   * Mock 분석 결과 생성
   */
  private generateMockResults(data: any, options: AnalysisOptions): any {
    const language = options.outputLanguage || 'ko';
    
    // 랜덤하지만 일관성 있는 Mock 데이터 생성
    const seed = data ? JSON.stringify(data).length : 42;
    const random = (this.seededRandom(seed) + 1) / 2; // 0-1 범위
    
    const overallScore = Math.round(random * 40 + 60); // 60-100 범위
    const stressLevel = Math.round((1 - random) * 30 + 20); // 20-50 범위  
    const focusLevel = Math.round(random * 30 + 70); // 70-100 범위

    const results = {
      overallScore,
      stressLevel,
      focusLevel,
      summary: language === 'ko' 
        ? `Mock 분석 결과: 전반적으로 ${overallScore >= 80 ? '매우 좋은' : overallScore >= 60 ? '양호한' : '개선이 필요한'} 상태입니다.`
        : `Mock Analysis: Overall ${overallScore >= 80 ? 'excellent' : overallScore >= 60 ? 'good' : 'needs improvement'} condition.`,
      detailedAnalysis: language === 'ko'
        ? `Mock 테스트 엔진을 통한 시뮬레이션 분석입니다.\n\n주요 지표:\n- 전체 점수: ${overallScore}/100\n- 스트레스 수준: ${stressLevel}/100\n- 집중력 수준: ${focusLevel}/100\n\n이는 실제 AI 분석이 아닌 테스트용 가상 결과입니다.`
        : `Simulation analysis through Mock Test Engine.\n\nKey metrics:\n- Overall Score: ${overallScore}/100\n- Stress Level: ${stressLevel}/100\n- Focus Level: ${focusLevel}/100\n\nThis is a mock result for testing, not actual AI analysis.`,
      recommendations: language === 'ko' 
        ? [
            '정기적인 운동을 하세요 (Mock 권장사항)',
            '충분한 수면을 취하세요 (Mock 권장사항)', 
            '스트레스 관리 기법을 실천하세요 (Mock 권장사항)'
          ]
        : [
            'Exercise regularly (Mock recommendation)',
            'Get sufficient sleep (Mock recommendation)',
            'Practice stress management techniques (Mock recommendation)'
          ],
      metrics: {
        eeg: data?.eeg ? {
          alpha: random * 20 + 10,
          beta: random * 15 + 8,
          gamma: random * 8 + 2,
          theta: random * 12 + 5,
          delta: random * 6 + 2
        } : undefined,
        ppg: data?.ppg ? {
          heartRate: Math.round(random * 20 + 70),
          hrv: Math.round(random * 30 + 40),
          stressIndex: Math.round((1 - random) * 40 + 20)
        } : undefined,
        acc: data?.acc ? {
          movementLevel: Math.round(random * 40 + 10),
          stability: Math.round(random * 30 + 70)
        } : undefined
      }
    };

    return results;
  }

  /**
   * 입력 데이터 요약
   */
  private summarizeInputData(data: any): any {
    if (!data) return { empty: true };
    
    return {
      hasEEG: !!data.eeg,
      hasPPG: !!data.ppg,
      hasACC: !!data.acc,
      eegDataPoints: data.eeg?.rawData?.length || 0,
      ppgDataPoints: data.ppg?.rawData?.length || 0,
      accDataPoints: data.acc?.rawData?.length || 0
    };
  }

  /**
   * 시드 기반 랜덤 함수 (일관성 있는 Mock 결과를 위해)
   */
  private seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  /**
   * 지원하는 건강 지표 목록
   */
  getHealthMetrics(): string[] {
    return [
      'overall_health',
      'stress_level',
      'focus_level',
      'heart_rate',
      'hrv',
      'brain_waves',
      'movement_analysis',
      'mock_metric'
    ];
  }

  /**
   * 권장사항 카테고리 목록
   */
  getRecommendationCategories(): string[] {
    return [
      'exercise',
      'nutrition', 
      'sleep',
      'stress_management',
      'mental_health',
      'lifestyle',
      'testing'
    ];
  }

  /**
   * 샘플 프롬프트 목록
   */
  getSamplePrompts(): string[] {
    return [
      'Mock 기본 분석',
      'Mock 스트레스 중심 분석',
      'Mock 집중력 평가',
      'Mock 전체 건강 상태 분석'
    ];
  }
}

export default MockTestEngine; 