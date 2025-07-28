/**
 * EEG Advanced Gemini Engine v1
 * EEG 데이터 전문 해석을 위한 고급 Gemini 엔진
 */

import { 
  IAIEngine, 
  MeasurementDataType, 
  ValidationResult, 
  AnalysisOptions, 
  AnalysisResult, 
  EngineCapabilities 
} from '../core/interfaces/IAIEngine';

// EEG 전용 입력 데이터 인터페이스
interface EEGAnalysisInput {
  personalInfo: {
    name: string;
    age: number;
    gender: 'male' | 'female';
    occupation: string;
  };
  eegTimeSeriesStats: {
    bandPowers: {
      delta: { mean: number; std: number; min: number; max: number };
      theta: { mean: number; std: number; min: number; max: number };
      alpha: { mean: number; std: number; min: number; max: number };
      beta: { mean: number; std: number; min: number; max: number };
      gamma: { mean: number; std: number; min: number; max: number };
    };
    eegIndices: {
      focusIndex: number;
      relaxationIndex: number;
      stressIndex: number;
      hemisphericBalance: number;
      cognitiveLoad: number;
      emotionalStability: number;
    };
    qualityMetrics: {
      signalQuality: number;
      measurementDuration: number;
      dataCompleteness: number;
    };
  };
}

// EEG 고급 분석 결과 인터페이스
interface EEGAdvancedAnalysisResult {
  analysisResults: CoreAnalysisResult[];
  detailedDataAnalysis: DetailedDataAnalysis;
  metadata: AnalysisMetadata;
}

interface CoreAnalysisResult {
  priority: 1 | 2 | 3;
  coreOpinion: {
    title: string;
    summary: string;
    clinicalSignificance: 'normal' | 'mild' | 'moderate' | 'severe';
    personalizedInterpretation: string;
  };
  dataEvidence: {
    primaryMetrics: MetricEvidence[];
    supportingMetrics: MetricEvidence[];
    statisticalAnalysis: {
      correlationAnalysis: string;
      demographicComparison: string;
    };
  };
  validityOpinion: {
    scientificBasis: string;
    clinicalReferences: ScientificReference[];
    limitationsAndCaveats: string;
  };
}

interface MetricEvidence {
  metricName: string;
  observedValue: number;
  normalRange: string;
  deviation: 'normal' | 'mildly_high' | 'mildly_low' | 'significantly_high' | 'significantly_low';
  interpretation: string;
}

interface ScientificReference {
  referenceType: 'research' | 'clinical' | 'guideline' | 'meta-analysis';
  summary: string;
  relevance: string;
}

interface DetailedDataAnalysis {
  bandPowerAnalysis: {
    [key: string]: {
      interpretation: string;
      evidence: string;
      clinicalSignificance: string;
    };
  };
  eegIndicesAnalysis: {
    [key: string]: {
      interpretation: string;
      evidence: string;
      recommendations: string[];
    };
  };
  cognitiveStateAnalysis: {
    overallAssessment: string;
    attentionPatterns: string;
    mentalFatigue: string;
    neurologicalIndicators: string;
  };
}

interface AnalysisMetadata {
  analysisTimestamp: string;
  personalInfo: {
    age: number;
    gender: string;
    occupation: string;
  };
  dataQuality: {
    signalQuality: number;
    measurementDuration: number;
    dataCompleteness: number;
  };
  analysisEngine: {
    engineId: string;
    version: string;
    processingTime: number;
  };
}

export class EEGAdvancedGeminiEngine implements IAIEngine {
  readonly id = 'eeg-advanced-gemini-v1';
  readonly name = 'EEG 전문 분석 v1';
  readonly description = 'EEG 데이터 전문 해석을 위한 고급 Gemini 엔진 - 의료급 분석과 개인 맞춤형 해석 제공';
  readonly version = '1.0.0';
  readonly provider = 'gemini';
  
  readonly supportedDataTypes: MeasurementDataType = {
    eeg: true,
    ppg: false,  // EEG 전용
    acc: false
  };
  
  readonly costPerAnalysis = 5; // 고급 분석으로 더 높은 비용
  readonly recommendedRenderers = ['eeg-advanced-json-viewer'];
  
  readonly capabilities: EngineCapabilities = {
    supportedLanguages: ['ko', 'en'],
    maxDataDuration: 600, // 10분
    minDataQuality: 40, // 40% 이상
    supportedOutputFormats: ['json'],
    realTimeProcessing: false
  };

  private readonly apiKey: string;
  private readonly modelName = 'gemini-1.5-flash';
  private analysisStartTime: number = 0;
  
  constructor(apiKey?: string) {
    // 브라우저 환경에서는 import.meta.env 사용
    let envApiKey = '';
    try {
      envApiKey = import.meta.env?.VITE_GOOGLE_GEMINI_API_KEY || '';
    } catch (e) {
      // 환경변수 접근 실패시 무시
    }
    
    this.apiKey = apiKey || envApiKey || '';
    if (!this.apiKey) {
      console.warn('⚠️ Gemini API key not provided. Engine will use mock data.');
    } else {
      console.log('✅ EEG Advanced Gemini Engine loaded with API key');
    }
  }

  /**
   * EEG 데이터 유효성 검증
   */
  async validate(data: any): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let qualityScore = 0;

    try {
      // 기본 구조 검증
      if (!data) {
        errors.push('측정 데이터가 없습니다.');
        return { isValid: false, errors, warnings, qualityScore: 0 };
      }

      // 개인정보 검증
      if (!data.personalInfo) {
        errors.push('개인 정보가 필요합니다.');
      } else {
        const { age, gender, occupation } = data.personalInfo;
        
        if (!age || age < 18 || age > 80) {
          errors.push('유효한 나이 정보가 필요합니다 (18-80세)');
        } else {
          qualityScore += 10;
        }
        
        if (!gender || !['male', 'female'].includes(gender)) {
          errors.push('성별 정보가 필요합니다 (male/female)');
        } else {
          qualityScore += 10;
        }
        
        if (!occupation) {
          warnings.push('직업 정보가 없어 일반적인 분석을 제공합니다.');
        } else {
          qualityScore += 5;
        }
      }

      // EEG 데이터 구조 검증
      if (!data.measurementData?.eegMetrics && !data.eegTimeSeriesStats) {
        errors.push('EEG 데이터가 필요합니다.');
      } else {
        // Band Power 데이터 검증
        const bandPowers = data.eegTimeSeriesStats?.bandPowers || {};
        const bands = ['delta', 'theta', 'alpha', 'beta', 'gamma'];
        
        for (const band of bands) {
          const bandData = bandPowers[band];
          if (bandData && typeof bandData.mean === 'number') {
            qualityScore += 8; // 각 밴드당 8점
          } else {
            warnings.push(`${band} 밴드 데이터가 부족합니다.`);
          }
        }

        // EEG 지수 검증
        const eegIndices = data.eegTimeSeriesStats?.eegIndices || {};
        const indices = ['focusIndex', 'relaxationIndex', 'stressIndex', 'hemisphericBalance', 'cognitiveLoad', 'emotionalStability'];
        
        for (const index of indices) {
          const indexData = eegIndices[index];
          // 객체 형태로 저장된 경우 value 속성 확인, 직접 숫자로 저장된 경우도 확인
          if ((indexData && typeof indexData.value === 'number') || typeof indexData === 'number') {
            qualityScore += 5; // 각 지수당 5점
          } else {
            warnings.push(`${index} 지수 데이터가 부족합니다.`);
          }
        }

        // 신호 품질 평가
        const qualityMetrics = data.eegTimeSeriesStats?.qualityMetrics;
        if (qualityMetrics) {
          const signalQuality = qualityMetrics.signalQuality;
          console.log('📊 신호 품질 검증:', { signalQuality, qualityMetrics });
          
          // 신호 품질이 0-1 범위가 아닌 경우 정규화
          const normalizedSignalQuality = signalQuality > 1 ? signalQuality / 100 : signalQuality;
          
          if (normalizedSignalQuality < 0.4) {
            warnings.push('신호 품질이 낮습니다. 분석 결과의 신뢰도가 떨어질 수 있습니다.');
            qualityScore *= 0.7;
          } else if (normalizedSignalQuality > 0.8) {
            qualityScore *= 1.1;
          }
          
          if (qualityMetrics.measurementDuration < 60) {
            warnings.push('측정 시간이 짧습니다. 더 긴 측정을 권장합니다.');
            qualityScore *= 0.9;
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        qualityScore: Math.min(100, Math.max(0, qualityScore))
      };

    } catch (error) {
      console.error('EEG 데이터 검증 오류:', error);
      return {
        isValid: false,
        errors: ['데이터 검증 중 오류가 발생했습니다.'],
        warnings,
        qualityScore: 0
      };
    }
  }

  /**
   * EEG 고급 분석 수행
   */
  async analyze(data: any, options: AnalysisOptions = {}): Promise<AnalysisResult> {
    this.analysisStartTime = Date.now();
    const analysisId = `${this.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      console.log('🧠 EEG Advanced Analysis 시작:', analysisId);
      
      // 데이터 유효성 검증
      const validation = await this.validate(data);
      if (!validation.isValid) {
        throw new Error(`데이터 검증 실패: ${validation.errors.join(', ')}`);
      }

      let analysisResult: EEGAdvancedAnalysisResult;

      // API 키가 있으면 실제 AI 분석, 없으면 목업 데이터
      if (this.apiKey) {
        console.log('🌐 Gemini API 호출 중...');
        const prompt = this.generateEEGAnalysisPrompt(data);
        const geminiResponse = await this.callGeminiAPI(prompt, options);
        analysisResult = this.parseGeminiResponse(geminiResponse, data);
      } else {
        console.log('🔧 Mock 데이터로 분석 진행');
        analysisResult = this.generateMockEEGAnalysis(data);
      }

      const processingTime = Date.now() - this.analysisStartTime;

      // 기존 AnalysisResult 형식으로 변환
      return {
        engineId: this.id,
        engineVersion: this.version,
        timestamp: new Date().toISOString(),
        analysisId,
        overallScore: this.calculateOverallScore(analysisResult),
        stressLevel: this.extractStressLevel(analysisResult),
        focusLevel: this.extractFocusLevel(analysisResult),
        
        insights: {
          summary: this.generateSummary(analysisResult),
          detailedAnalysis: JSON.stringify(analysisResult, null, 2), // JSON 형태로 제공
          recommendations: this.extractRecommendations(analysisResult),
          warnings: validation.warnings
        },
        
        metrics: {
          eeg: {
            alpha: data.eegTimeSeriesStats?.bandPowers?.alpha?.mean || 0,
            beta: data.eegTimeSeriesStats?.bandPowers?.beta?.mean || 0,
            gamma: data.eegTimeSeriesStats?.bandPowers?.gamma?.mean || 0,
            theta: data.eegTimeSeriesStats?.bandPowers?.theta?.mean || 0,
            delta: data.eegTimeSeriesStats?.bandPowers?.delta?.mean || 0
          }
        },
        
        processingTime,
        costUsed: this.costPerAnalysis,
        
        // EEG Advanced 전용 데이터
        rawData: {
          eegAdvancedAnalysis: analysisResult,
          qualityScore: validation.qualityScore,
          inputData: data
        }
      };

    } catch (error) {
      console.error('🚨 EEG Advanced Analysis 오류:', error);
      const processingTime = Date.now() - this.analysisStartTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        engineId: this.id,
        engineVersion: this.version,
        timestamp: new Date().toISOString(),
        analysisId,
        overallScore: 0,
        stressLevel: 0,
        focusLevel: 0,
        
        insights: {
          summary: '분석 중 오류가 발생했습니다.',
          detailedAnalysis: `오류 내용: ${errorMessage}`,
          recommendations: ['나중에 다시 시도해주세요.'],
          warnings: ['분석 실패']
        },
        
        metrics: {},
        processingTime,
        costUsed: 0
      };
    }
  }

  /**
   * 구조화된 EEG 데이터에서 분석 입력 데이터 추출
   */
  private extractEEGDataFromReport(data: any): EEGAnalysisInput | null {
    try {
      console.log('🔍 EEG 데이터 추출 시작:', data);
      
      // 구조화된 데이터가 이미 있는 경우 (AIReportSection에서 전달된 경우)
      if (data.eegTimeSeriesStats && data.personalInfo) {
        console.log('✅ 구조화된 EEG 데이터 사용');
        return {
          personalInfo: {
            name: data.personalInfo.name,
            age: data.personalInfo.age,
            gender: data.personalInfo.gender,
            occupation: data.personalInfo.occupation
          },
          eegTimeSeriesStats: {
            bandPowers: {
              delta: {
                mean: data.eegTimeSeriesStats.bandPowers.delta.mean,
                std: data.eegTimeSeriesStats.bandPowers.delta.std,
                min: data.eegTimeSeriesStats.bandPowers.delta.min,
                max: data.eegTimeSeriesStats.bandPowers.delta.max
              },
              theta: {
                mean: data.eegTimeSeriesStats.bandPowers.theta.mean,
                std: data.eegTimeSeriesStats.bandPowers.theta.std,
                min: data.eegTimeSeriesStats.bandPowers.theta.min,
                max: data.eegTimeSeriesStats.bandPowers.theta.max
              },
              alpha: {
                mean: data.eegTimeSeriesStats.bandPowers.alpha.mean,
                std: data.eegTimeSeriesStats.bandPowers.alpha.std,
                min: data.eegTimeSeriesStats.bandPowers.alpha.min,
                max: data.eegTimeSeriesStats.bandPowers.alpha.max
              },
              beta: {
                mean: data.eegTimeSeriesStats.bandPowers.beta.mean,
                std: data.eegTimeSeriesStats.bandPowers.beta.std,
                min: data.eegTimeSeriesStats.bandPowers.beta.min,
                max: data.eegTimeSeriesStats.bandPowers.beta.max
              },
              gamma: {
                mean: data.eegTimeSeriesStats.bandPowers.gamma.mean,
                std: data.eegTimeSeriesStats.bandPowers.gamma.std,
                min: data.eegTimeSeriesStats.bandPowers.gamma.min,
                max: data.eegTimeSeriesStats.bandPowers.gamma.max
              }
            },
            eegIndices: {
              focusIndex: data.eegTimeSeriesStats.eegIndices.focusIndex?.value || data.eegTimeSeriesStats.eegIndices.focusIndex || 2.0,
              relaxationIndex: data.eegTimeSeriesStats.eegIndices.relaxationIndex?.value || data.eegTimeSeriesStats.eegIndices.relaxationIndex || 0.2,
              stressIndex: data.eegTimeSeriesStats.eegIndices.stressIndex?.value || data.eegTimeSeriesStats.eegIndices.stressIndex || 3.2,
              hemisphericBalance: data.eegTimeSeriesStats.eegIndices.hemisphericBalance?.value || data.eegTimeSeriesStats.eegIndices.hemisphericBalance || 0.05,
              cognitiveLoad: data.eegTimeSeriesStats.eegIndices.cognitiveLoad?.value || data.eegTimeSeriesStats.eegIndices.cognitiveLoad || 0.5,
              emotionalStability: data.eegTimeSeriesStats.eegIndices.emotionalStability?.value || data.eegTimeSeriesStats.eegIndices.emotionalStability || 0.8
            },
            qualityMetrics: {
              signalQuality: data.eegTimeSeriesStats.qualityMetrics.signalQuality,
              measurementDuration: data.eegTimeSeriesStats.qualityMetrics.measurementDuration,
              dataCompleteness: data.eegTimeSeriesStats.qualityMetrics.dataCompleteness
            }
          }
        };
      }

      // personalInfo 추출 (fallback)
      const personalInfo = data.personalInfo || {
        name: data.userName || data.subjectName || '익명',
        age: data.userAge || 30,
        gender: data.userGender === '남성' ? 'male' : data.userGender === '여성' ? 'female' : 'male',
        occupation: data.userOccupation || 'unknown'
      };

      // EEG 데이터가 measurementData에 있는 경우 (기존 방식)
      if (data.measurementData?.eegMetrics) {
        console.log('📊 measurementData에서 EEG 메트릭 추출');
        const eegMetrics = data.measurementData.eegMetrics;
        
        return {
          personalInfo,
          eegTimeSeriesStats: {
            bandPowers: {
              delta: { mean: eegMetrics.deltaStats?.mean || 120, std: 25, min: 80, max: 180 },
              theta: { mean: eegMetrics.thetaStats?.mean || 150, std: 30, min: 100, max: 220 },
              alpha: { mean: eegMetrics.alphaStats?.mean || 280, std: 40, min: 180, max: 450 },
              beta: { mean: eegMetrics.betaStats?.mean || 320, std: 60, min: 240, max: 450 },
              gamma: { mean: eegMetrics.gammaStats?.mean || 55, std: 15, min: 35, max: 85 }
            },
            eegIndices: {
              focusIndex: eegMetrics.focusIndex?.value || 2.5,
              relaxationIndex: eegMetrics.relaxationIndex?.value || 0.2,
              stressIndex: eegMetrics.stressIndex?.value || 0.6,
              hemisphericBalance: eegMetrics.hemisphericBalance?.value || 0.05,
              cognitiveLoad: eegMetrics.cognitiveLoad?.value || 1.8,
              emotionalStability: eegMetrics.emotionalStability?.value || 0.75
            },
            qualityMetrics: {
              signalQuality: data.measurementData.qualityMetrics?.signalQuality || 0.85,
              measurementDuration: data.measurementData.qualityMetrics?.measurementDuration || 300,
              dataCompleteness: data.measurementData.qualityMetrics?.dataCompleteness || 0.9
            }
          }
        };
      }

      // 기본 구조로 fallback
      console.log('⚠️ 기본 fallback 데이터 사용');
      return {
        personalInfo,
        eegTimeSeriesStats: {
          bandPowers: {
            delta: { mean: 120, std: 25, min: 80, max: 180 },
            theta: { mean: 150, std: 30, min: 100, max: 220 },
            alpha: { mean: 280, std: 40, min: 180, max: 450 },
            beta: { mean: 320, std: 60, min: 240, max: 450 },
            gamma: { mean: 55, std: 15, min: 35, max: 85 }
          },
          eegIndices: {
            focusIndex: 2.5,
            relaxationIndex: 0.2,
            stressIndex: 0.6,
            hemisphericBalance: 0.05,
            cognitiveLoad: 1.8,
            emotionalStability: 0.75
          },
          qualityMetrics: {
            signalQuality: 0.85,
            measurementDuration: 300,
            dataCompleteness: 0.9
          }
        }
      };

    } catch (error) {
      console.error('EEG 데이터 추출 오류:', error);
      return null;
    }
  }

  /**
   * EEG 전용 프롬프트 생성 (구조화된 데이터 기반)
   */
  private generateEEGAnalysisPrompt(data: any): string {
    const eegData = this.extractEEGDataFromReport(data);
    if (!eegData) {
      throw new Error('EEG 데이터 추출 실패');
    }

    const { personalInfo, eegTimeSeriesStats } = eegData;
    
    // 구조화된 데이터에서 상세 정보 추출
    const originalData = data.eegTimeSeriesStats || {};
    const bandPowers = originalData.bandPowers || {};
    const eegIndices = originalData.eegIndices || {};
    
    return `
당신은 EEG 분석 전문가입니다. 다음 상세한 EEG 시계열 통계 데이터를 분석하여 의료급 JSON 형식으로 응답해주세요.

## 개인정보
- 이름: ${personalInfo.name}
- 나이: ${personalInfo.age}세
- 성별: ${personalInfo.gender === 'male' ? '남성' : '여성'}
- 직업: ${personalInfo.occupation}

## EEG Band Powers 분석 (μV²)

### Delta Power (0.5-4Hz)
- 측정값: ${eegTimeSeriesStats.bandPowers.delta.mean.toFixed(2)}μV² (표준편차: ${eegTimeSeriesStats.bandPowers.delta.std.toFixed(2)})
- 범위: ${eegTimeSeriesStats.bandPowers.delta.min.toFixed(2)} - ${eegTimeSeriesStats.bandPowers.delta.max.toFixed(2)}μV²
- 정상범위: ${bandPowers.delta?.normalRange || '50-150μV²'}
- 상태: ${bandPowers.delta?.status || '정상'}
- 해석: ${bandPowers.delta?.interpretation || '깊은 수면과 무의식 상태의 뇌파'}

### Theta Power (4-8Hz)
- 측정값: ${eegTimeSeriesStats.bandPowers.theta.mean.toFixed(2)}μV² (표준편차: ${eegTimeSeriesStats.bandPowers.theta.std.toFixed(2)})
- 범위: ${eegTimeSeriesStats.bandPowers.theta.min.toFixed(2)} - ${eegTimeSeriesStats.bandPowers.theta.max.toFixed(2)}μV²
- 정상범위: ${bandPowers.theta?.normalRange || '80-200μV²'}
- 상태: ${bandPowers.theta?.status || '정상'}
- 해석: ${bandPowers.theta?.interpretation || '창의적 사고와 직관적 상태의 뇌파'}

### Alpha Power (8-13Hz)
- 측정값: ${eegTimeSeriesStats.bandPowers.alpha.mean.toFixed(2)}μV² (표준편차: ${eegTimeSeriesStats.bandPowers.alpha.std.toFixed(2)})
- 범위: ${eegTimeSeriesStats.bandPowers.alpha.min.toFixed(2)} - ${eegTimeSeriesStats.bandPowers.alpha.max.toFixed(2)}μV²
- 정상범위: ${bandPowers.alpha?.normalRange || '200-500μV²'}
- 상태: ${bandPowers.alpha?.status || '정상'}
- 해석: ${bandPowers.alpha?.interpretation || '이완된 각성 상태 또는 명상적 휴식'}

### Beta Power (13-30Hz)
- 측정값: ${eegTimeSeriesStats.bandPowers.beta.mean.toFixed(2)}μV² (표준편차: ${eegTimeSeriesStats.bandPowers.beta.std.toFixed(2)})
- 범위: ${eegTimeSeriesStats.bandPowers.beta.min.toFixed(2)} - ${eegTimeSeriesStats.bandPowers.beta.max.toFixed(2)}μV²
- 정상범위: ${bandPowers.beta?.normalRange || '100-300μV²'}
- 상태: ${bandPowers.beta?.status || '정상'}
- 해석: ${bandPowers.beta?.interpretation || '집중적 사고 또는 논리적 활동'}

### Gamma Power (30-100Hz)
- 측정값: ${eegTimeSeriesStats.bandPowers.gamma.mean.toFixed(2)}μV² (표준편차: ${eegTimeSeriesStats.bandPowers.gamma.std.toFixed(2)})
- 범위: ${eegTimeSeriesStats.bandPowers.gamma.min.toFixed(2)} - ${eegTimeSeriesStats.bandPowers.gamma.max.toFixed(2)}μV²
- 정상범위: ${bandPowers.gamma?.normalRange || '30-80μV²'}
- 상태: ${bandPowers.gamma?.status || '정상'}
- 해석: ${bandPowers.gamma?.interpretation || '복잡한 인지 처리 및 의식 통합'}

## EEG 지수 분석

### Focus Index (집중도 지수)
- 측정값: ${eegTimeSeriesStats.eegIndices.focusIndex.toFixed(2)}
- 정상범위: ${eegIndices.focusIndex?.normalRange || '1.5-3.0'}
- 상태: ${eegIndices.focusIndex?.status || '정상'}
- 해석: ${eegIndices.focusIndex?.interpretation || '집중력 상태를 나타냄'}

### Relaxation Index (이완도 지수)
- 측정값: ${eegTimeSeriesStats.eegIndices.relaxationIndex.toFixed(2)}
- 정상범위: ${eegIndices.relaxationIndex?.normalRange || '0.18-0.22'}
- 상태: ${eegIndices.relaxationIndex?.status || '정상'}
- 해석: ${eegIndices.relaxationIndex?.interpretation || '정신적 이완 상태를 나타냄'}

### Stress Index (스트레스 지수)
- 측정값: ${eegTimeSeriesStats.eegIndices.stressIndex.toFixed(2)}
- 정상범위: ${eegIndices.stressIndex?.normalRange || '2.8-4.0'}
- 상태: ${eegIndices.stressIndex?.status || '정상'}
- 해석: ${eegIndices.stressIndex?.interpretation || '스트레스 수준을 나타냄'}

### Hemispheric Balance (좌우뇌 균형)
- 측정값: ${eegTimeSeriesStats.eegIndices.hemisphericBalance.toFixed(3)}
- 정상범위: ${eegIndices.hemisphericBalance?.normalRange || '-0.1~0.1'}
- 상태: ${eegIndices.hemisphericBalance?.status || '정상'}
- 해석: ${eegIndices.hemisphericBalance?.interpretation || '좌우뇌 활성도 균형'}

## 데이터 품질
- 신호 품질: ${(eegTimeSeriesStats.qualityMetrics.signalQuality * 100).toFixed(1)}%
- 측정 시간: ${eegTimeSeriesStats.qualityMetrics.measurementDuration}초
- 데이터 완성도: ${(eegTimeSeriesStats.qualityMetrics.dataCompleteness * 100).toFixed(1)}%

## 분석 요청사항
위의 상세한 EEG 데이터를 바탕으로 다음 JSON 형식으로 의료급 분석 결과를 제공해주세요:

{
  "analysisResults": [
    {
      "priority": 1,
      "coreOpinion": {
        "title": "핵심 소견 (실제 측정값 기반)",
        "summary": "측정된 Band Power와 EEG 지수를 종합한 요약",
        "clinicalSignificance": "normal|mild|moderate|severe",
        "personalizedInterpretation": "${personalInfo.age}세 ${personalInfo.occupation}의 특성을 고려한 해석"
      },
      "dataEvidence": {
        "primaryMetrics": [실제 측정값과 정상범위를 비교한 주요 지표들],
        "supportingMetrics": [보조 지표들],
        "statisticalAnalysis": {
          "correlationAnalysis": "Band Power 간 상관관계 분석",
          "demographicComparison": "${personalInfo.age}세 ${personalInfo.gender === 'male' ? '남성' : '여성'} 평균과 비교"
        }
      },
      "validityOpinion": {
        "scientificBasis": "EEG 연구 기반 과학적 근거",
        "clinicalReferences": [관련 연구 및 임상 가이드라인],
        "limitationsAndCaveats": "측정 환경 및 개인차 고려사항"
      }
    }
  ],
  "detailedDataAnalysis": {
    "bandPowerAnalysis": {
      "각 주파수 밴드별": {"interpretation": "실제 측정값 기반 해석", "evidence": "수치적 근거", "clinicalSignificance": "임상적 의미"}
    },
    "eegIndicesAnalysis": {
      "각 지수별": {"interpretation": "실제 측정값 기반 해석", "evidence": "수치적 근거", "recommendations": ["개인 맞춤 권장사항"]}
    },
    "cognitiveStateAnalysis": {
      "overallAssessment": "전반적인 뇌 기능 상태 평가",
      "attentionPatterns": "집중력 패턴 분석",
      "mentalFatigue": "정신적 피로도 평가",
      "neurologicalIndicators": "신경학적 지표 해석"
    }
  }
}`;
  }

  /**
   * Gemini API 호출
   */
  private async callGeminiAPI(prompt: string, options: AnalysisOptions): Promise<any> {
    const requestBody = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 1,
        maxOutputTokens: 8192,
      },
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API 호출 실패: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  }

  /**
   * Gemini 응답 파싱
   */
  private parseGeminiResponse(response: any, inputData: any): EEGAdvancedAnalysisResult {
    try {
      const content = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        throw new Error('Gemini 응답에서 컨텐츠를 찾을 수 없습니다');
      }

      // JSON 추출
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       content.match(/{\s*"analysisResults"[\s\S]*}/);
      
      if (!jsonMatch) {
        console.warn('JSON 형식을 찾을 수 없어 Mock 데이터를 사용합니다');
        return this.generateMockEEGAnalysis(inputData);
      }

      const parsedResult = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      
      // 메타데이터 추가
      parsedResult.metadata = {
        analysisTimestamp: new Date().toISOString(),
        personalInfo: inputData.personalInfo,
        dataQuality: inputData.eegTimeSeriesStats.qualityMetrics,
        analysisEngine: {
          engineId: this.id,
          version: this.version,
          processingTime: Date.now() - this.analysisStartTime
        }
      };

      return parsedResult;
      
    } catch (error) {
      console.error('Gemini 응답 파싱 오류:', error);
      return this.generateMockEEGAnalysis(inputData);
    }
  }

  /**
   * Mock EEG 분석 데이터 생성
   */
  private generateMockEEGAnalysis(data: any): EEGAdvancedAnalysisResult {
    const eegData = this.extractEEGDataFromReport(data);
    if (!eegData) {
      throw new Error('EEG 데이터 추출 실패');
    }

    const { personalInfo, eegTimeSeriesStats } = eegData;
    
    return {
      analysisResults: [
        {
          priority: 1,
          coreOpinion: {
            title: "Beta 과활성과 스트레스 지수 상승",
            summary: `${personalInfo.age}세 ${personalInfo.gender === 'male' ? '남성' : '여성'}의 Beta Power가 정상 범위를 초과하여 과도한 집중 상태를 시사합니다.`,
            clinicalSignificance: "moderate" as const,
            personalizedInterpretation: `${personalInfo.occupation} 직업 특성상 높은 인지 부하가 예상되나, 현재 수준은 주의가 필요합니다.`
          },
          dataEvidence: {
            primaryMetrics: [
              {
                metricName: "Beta Power",
                observedValue: eegTimeSeriesStats.bandPowers.beta.mean,
                normalRange: "90-280 μV²",
                deviation: eegTimeSeriesStats.bandPowers.beta.mean > 280 ? "significantly_high" : "normal",
                interpretation: "과도한 집중 상태 또는 스트레스 반응"
              }
            ],
            supportingMetrics: [
              {
                metricName: "Stress Index",
                observedValue: eegTimeSeriesStats.eegIndices.stressIndex,
                normalRange: "0.3-0.7",
                deviation: eegTimeSeriesStats.eegIndices.stressIndex > 0.7 ? "mildly_high" : "normal",
                interpretation: "스트레스 수준 평가"
              }
            ],
            statisticalAnalysis: {
              correlationAnalysis: "Beta Power와 Stress Index 간 양의 상관관계 관찰",
              demographicComparison: `동일 연령대 ${personalInfo.occupation} 평균 대비 분석`
            }
          },
          validityOpinion: {
            scientificBasis: "Beta파 과활성은 전전두엽 피질의 과도한 활성화를 반영",
            clinicalReferences: [
              {
                referenceType: "research" as const,
                summary: "직업적 스트레스와 Beta파 활성 간 상관관계 연구",
                relevance: "현재 패턴과 직업적 특성이 일치"
              }
            ],
            limitationsAndCaveats: "단일 시점 측정으로 일시적 상태일 가능성"
          }
        }
      ],
      detailedDataAnalysis: {
        bandPowerAnalysis: {
          alpha: {
            interpretation: `Alpha Power ${eegTimeSeriesStats.bandPowers.alpha.mean}μV²는 이완 상태를 나타냅니다.`,
            evidence: `측정값 ${eegTimeSeriesStats.bandPowers.alpha.mean}μV², 정상범위 180-450μV²`,
            clinicalSignificance: "정상적인 휴식 상태의 뇌파 활동"
          },
          beta: {
            interpretation: `Beta Power ${eegTimeSeriesStats.bandPowers.beta.mean}μV²는 집중 상태를 나타냅니다.`,
            evidence: `측정값 ${eegTimeSeriesStats.bandPowers.beta.mean}μV², 정상범위 90-280μV²`,
            clinicalSignificance: eegTimeSeriesStats.bandPowers.beta.mean > 280 ? "과도한 집중 또는 스트레스" : "정상적인 집중 상태"
          }
        },
        eegIndicesAnalysis: {
          focus: {
            interpretation: `Focus Index ${eegTimeSeriesStats.eegIndices.focusIndex}는 집중력 상태를 나타냅니다.`,
            evidence: `측정값 ${eegTimeSeriesStats.eegIndices.focusIndex}, 정상범위 1.5-3.0`,
            recommendations: ["정기적인 휴식", "주의력 분산 활동", "스트레스 관리"]
          },
          stress: {
            interpretation: `Stress Index ${eegTimeSeriesStats.eegIndices.stressIndex}는 스트레스 수준을 나타냅니다.`,
            evidence: `측정값 ${eegTimeSeriesStats.eegIndices.stressIndex}, 정상범위 0.3-0.7`,
            recommendations: ["이완 훈련", "규칙적 운동", "충분한 수면"]
          }
        },
        cognitiveStateAnalysis: {
          overallAssessment: `${personalInfo.age}세 ${personalInfo.occupation}의 전반적인 뇌 기능은 양호하나 스트레스 관리가 필요합니다.`,
          attentionPatterns: "지속적인 집중 패턴이 관찰되며, 적절한 휴식이 권장됩니다.",
          mentalFatigue: "중등도의 정신적 피로 징후가 나타납니다.",
          neurologicalIndicators: "특별한 신경학적 이상 소견은 관찰되지 않습니다."
        }
      },
      metadata: {
        analysisTimestamp: new Date().toISOString(),
        personalInfo: {
          age: personalInfo.age,
          gender: personalInfo.gender,
          occupation: personalInfo.occupation
        },
        dataQuality: eegTimeSeriesStats.qualityMetrics,
        analysisEngine: {
          engineId: this.id,
          version: this.version,
          processingTime: Date.now() - this.analysisStartTime
        }
      }
    };
  }

  // 헬퍼 메서드들
  private calculateOverallScore(result: EEGAdvancedAnalysisResult): number {
    // 임상적 중요도 기반 점수 계산
    const significanceScores = {
      'normal': 85,
      'mild': 75,
      'moderate': 60,
      'severe': 40
    };
    
    const avgScore = result.analysisResults.reduce((sum, analysis) => 
      sum + significanceScores[analysis.coreOpinion.clinicalSignificance], 0
    ) / result.analysisResults.length;
    
    return Math.round(avgScore);
  }

  private extractStressLevel(result: EEGAdvancedAnalysisResult): number {
    const stressAnalysis = result.analysisResults.find(r => 
      r.coreOpinion.title.toLowerCase().includes('스트레스') ||
      r.coreOpinion.title.toLowerCase().includes('stress')
    );
    
    if (!stressAnalysis) return 50; // normal
    
    switch (stressAnalysis.coreOpinion.clinicalSignificance) {
      case 'severe': return 80; // high
      case 'moderate': return 65; // elevated
      case 'mild': return 55; // slight
      default: return 50; // normal
    }
  }

  private extractFocusLevel(result: EEGAdvancedAnalysisResult): number {
    const focusAnalysis = result.analysisResults.find(r => 
      r.coreOpinion.title.toLowerCase().includes('집중') ||
      r.coreOpinion.title.toLowerCase().includes('focus')
    );
    
    if (!focusAnalysis) return 70; // normal
    
    switch (focusAnalysis.coreOpinion.clinicalSignificance) {
      case 'severe': return 30; // impaired
      case 'moderate': return 50; // reduced
      case 'mild': return 60; // slightly_reduced
      default: return 70; // normal
    }
  }

  private generateSummary(result: EEGAdvancedAnalysisResult): string {
    return result.analysisResults.map((analysis, index) => 
      `${index + 1}. ${analysis.coreOpinion.title}: ${analysis.coreOpinion.summary}`
    ).join('\n\n');
  }

  private extractRecommendations(result: EEGAdvancedAnalysisResult): string[] {
    const recommendations: string[] = [];
    
    Object.values(result.detailedDataAnalysis.eegIndicesAnalysis).forEach(analysis => {
      if (analysis.recommendations) {
        recommendations.push(...analysis.recommendations);
      }
    });
    
    return [...new Set(recommendations)]; // 중복 제거
  }
}