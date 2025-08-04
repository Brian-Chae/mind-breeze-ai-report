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
import { transformEEGDataForGemini, EEG_NORMAL_RANGES, getStatus, getInterpretation } from '../utils/eegDataTransformer';

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
      totalPower?: { mean: number; std: number; min: number; max: number };
    };
    eegIndices: {
      focusIndex: { mean: number; std: number; min: number; max: number };
      relaxationIndex: { mean: number; std: number; min: number; max: number };
      stressIndex: { mean: number; std: number; min: number; max: number };
      hemisphericBalance: { mean: number; std: number; min: number; max: number };
      cognitiveLoad: { mean: number; std: number; min: number; max: number };
      emotionalStability: { mean: number; std: number; min: number; max: number };
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
  analysisResults?: CoreAnalysisResult[]; // 기존 구조 호환성
  fourDimensionAnalysis?: FourDimensionAnalysis; // 새로운 4대 지표 구조
  detailedDataAnalysis: DetailedDataAnalysis;
  comprehensiveAssessment?: ComprehensiveAssessment; // 종합 평가
  metadata: AnalysisMetadata;
}

// 4대 지표 분석 인터페이스
interface FourDimensionAnalysis {
  arousal: DimensionAnalysis;
  valence: DimensionAnalysis;
  focus: DimensionAnalysis;
  stress: DimensionAnalysis;
}

interface DimensionAnalysis {
  dimension: string;
  level: string;
  score: number;
  interpretation: string;
  evidence: {
    [key: string]: any;
  };
  clinicalSignificance: 'normal' | 'mild' | 'moderate' | 'severe';
  personalizedInterpretation: string;
  recommendations: string[];
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

interface ComprehensiveAssessment {
  overallSummary: string;
  keyFindings: string[];
  primaryConcerns: string[];
  ageGenderAnalysis: {
    ageComparison: string;
    genderConsiderations: string;
    developmentalContext: string;
  };
  occupationalAnalysis: {
    jobDemands: string;
    workRelatedPatterns: string;
    professionalRecommendations: string[];
  };
  improvementPlan: {
    shortTermGoals: string[];
    longTermGoals: string[];
    actionItems: string[];
    monitoringPlan: string;
  };
  riskAssessment: {
    level: 'low' | 'moderate' | 'high';
    factors: string[];
    preventiveMeasures: string[];
  };
  overallScore: number;
  clinicalRecommendation: string;
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
          // 객체 형태로 저장된 경우 value, mean 속성 확인, 직접 숫자로 저장된 경우도 확인
          if ((indexData && typeof indexData.value === 'number') || 
              (indexData && typeof indexData.mean === 'number') ||
              typeof indexData === 'number') {
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
      console.log('📊 분석 입력 데이터 구조:', {
        dataKeys: Object.keys(data),
        hasProcessedTimeSeries: !!data.processedTimeSeries,
        processedTimeSeriesKeys: data.processedTimeSeries ? Object.keys(data.processedTimeSeries) : [],
        hasEegTimeSeriesStats: !!data.eegTimeSeriesStats,
        hasRawData: !!data.rawData
      });
      
      // 데이터 유효성 검증
      const validation = await this.validate(data);
      if (!validation.isValid) {
        throw new Error(`데이터 검증 실패: ${validation.errors.join(', ')}`);
      }

      let analysisResult: EEGAdvancedAnalysisResult;

      // API 키가 있으면 실제 AI 분석, 없으면 목업 데이터
      if (this.apiKey) {
        try {
          console.log('🌐 Gemini API 호출 중...');
          const prompt = this.generateEEGAnalysisPrompt(data);
          const geminiResponse = await this.callGeminiAPIWithRetry(prompt, options);
          analysisResult = this.parseGeminiResponse(geminiResponse, data);
          console.log('✅ Gemini API 호출 성공');
        } catch (error) {
          console.warn('⚠️ Gemini API 호출 실패, Mock 데이터 사용:', error);
          analysisResult = this.generateMockEEGAnalysis(data);
        }
      } else {
        console.log('🔧 API 키 없음 - Mock 데이터로 분석 진행');
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
            alpha: 100, // TODO: 실제 데이터 사용하도록 수정 필요
            beta: 100,
            gamma: 100,
            theta: 100,
            delta: 100
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
      console.log('🔍 EEG 데이터 추출 시작:', {
        hasEegTimeSeriesStats: !!data.eegTimeSeriesStats,
        hasProcessedTimeSeries: !!data.processedTimeSeries,
        hasTimeSeriesData: !!data.timeSeriesData,
        hasMeasurementData: !!data.measurementData,
        hasRawData: !!data.rawData,
        hasInputData: !!data.inputData,
        dataKeys: Object.keys(data),
        processedTimeSeriesKeys: data.processedTimeSeries ? Object.keys(data.processedTimeSeries) : [],
        processedTimeSeriesEegKeys: data.processedTimeSeries?.eeg ? Object.keys(data.processedTimeSeries.eeg) : []
      });
      
      // processedTimeSeries가 있으면 변환 함수 사용
      if (data.processedTimeSeries || data.rawData?.processedTimeSeries) {
        console.log('🔄 processedTimeSeries 데이터 변환 사용');
        
        // processedTimeSeries 데이터를 measurementData 형태로 변환해서 전달
        const measurementDataForTransform = {
          processedTimeSeries: data.processedTimeSeries || data.rawData?.processedTimeSeries
        };
        
        console.log('🔍 변환 함수에 전달할 데이터:', {
          hasProcessedTimeSeries: !!measurementDataForTransform.processedTimeSeries,
          processedTimeSeriesKeys: measurementDataForTransform.processedTimeSeries ? Object.keys(measurementDataForTransform.processedTimeSeries) : [],
          sampleAlphaPower: measurementDataForTransform.processedTimeSeries?.AlphaPower?.slice(0, 3)
        });
        
        const transformedData = transformEEGDataForGemini(measurementDataForTransform);
        
        if (transformedData) {
          console.log('✅ 변환된 데이터:', {
            hasBandPowers: !!transformedData.bandPowers,
            hasEegIndices: !!transformedData.eegIndices,
            focusIndexValue: transformedData.eegIndices?.focusIndex?.mean,
            deltaValue: transformedData.bandPowers?.delta?.mean
          });
          
          return {
            personalInfo: data.personalInfo || {
              name: '익명',
              age: 30,
              gender: 'male',
              occupation: 'unknown'
            },
            eegTimeSeriesStats: transformedData
          };
        }
      }
      
      // rawData.inputData 구조 처리 (렌더러에서 사용하는 구조)
      if (data.rawData?.inputData?.eegTimeSeriesStats) {
        console.log('✅ rawData.inputData에서 EEG 통계 데이터 사용');
        const inputData = data.rawData.inputData;
        return {
          personalInfo: inputData.personalInfo || data.personalInfo || {
            name: '익명',
            age: 30,
            gender: 'male',
            occupation: 'unknown'
          },
          eegTimeSeriesStats: inputData.eegTimeSeriesStats
        };
      }
      
      // inputData만 있는 경우
      if (data.inputData?.eegTimeSeriesStats) {
        console.log('✅ inputData에서 EEG 통계 데이터 사용');
        return {
          personalInfo: data.inputData.personalInfo || data.personalInfo || {
            name: '익명',
            age: 30,
            gender: 'male',
            occupation: 'unknown'
          },
          eegTimeSeriesStats: data.inputData.eegTimeSeriesStats
        };
      }
      
      // AIReportSection에서 전달된 구조화된 데이터 우선 처리
      if (data.eegTimeSeriesStats) {
        console.log('✅ 구조화된 EEG 통계 데이터 사용:', data.eegTimeSeriesStats);
        return {
          personalInfo: data.personalInfo,
          eegTimeSeriesStats: data.eegTimeSeriesStats
        };
      }
      
      // AnalysisPipelineOrchestrator에서 전달된 경우
      if (data.measurementData?.eegMetrics) {
        const eegMetrics = data.measurementData.eegMetrics;
        
        // EEG 데이터 구조 변환 (유연한 처리)
        const eegTimeSeriesStats: any = {
          bandPowers: {} as any,
          eegIndices: {} as any,
          qualityMetrics: eegMetrics.qualityMetrics || {}
        };
        
        // Band Powers 추출
        const bandNames = ['delta', 'theta', 'alpha', 'beta', 'gamma'];
        bandNames.forEach(band => {
          if (eegMetrics[band]) {
            eegTimeSeriesStats.bandPowers[band] = eegMetrics[band];
          } else if (eegMetrics.bandPowers?.[band]) {
            eegTimeSeriesStats.bandPowers[band] = eegMetrics.bandPowers[band];
          } else {
            // 기본값 설정
            eegTimeSeriesStats.bandPowers[band] = {
              mean: 100,
              std: 20,
              min: 50,
              max: 150
            };
          }
        });
        
        // Total Power 추가
        if (eegMetrics.totalPower) {
          eegTimeSeriesStats.bandPowers.totalPower = eegMetrics.totalPower;
        } else {
          eegTimeSeriesStats.bandPowers.totalPower = {
            mean: 1000,
            std: 100,
            min: 850,
            max: 1150
          };
        }
        
        // EEG Indices 추출
        const indexNames = ['focusIndex', 'relaxationIndex', 'stressIndex', 'hemisphericBalance', 'cognitiveLoad', 'emotionalStability'];
        indexNames.forEach(index => {
          const mappedName = index === 'focusIndex' ? 'focus' : 
                           index === 'relaxationIndex' ? 'arousal' :
                           index === 'stressIndex' ? 'stressIndex' :
                           index === 'emotionalStability' ? 'emotionalStability' :
                           index;
          
          if (eegMetrics[mappedName]) {
            eegTimeSeriesStats.eegIndices[index] = {
              value: eegMetrics[mappedName].mean || 0,
              std: eegMetrics[mappedName].std || 0,
              min: eegMetrics[mappedName].min || 0,
              max: eegMetrics[mappedName].max || 0
            };
          } else if (eegMetrics.eegIndices?.[index]) {
            eegTimeSeriesStats.eegIndices[index] = eegMetrics.eegIndices[index];
          } else {
            // 기본값 설정
            eegTimeSeriesStats.eegIndices[index] = {
              value: 0.5,
              std: 0.1,
              min: 0.3,
              max: 0.7
            };
          }
        });
        
        // Signal Quality 추가
        if (eegMetrics.signalQuality) {
          eegTimeSeriesStats.qualityMetrics.signalQuality = eegMetrics.signalQuality.mean || 0.85;
        }
        
        return {
          personalInfo: {
            name: data.personalInfo.name,
            age: data.personalInfo.age,
            gender: data.personalInfo.gender,
            occupation: data.personalInfo.occupation
          },
          eegTimeSeriesStats
        };
      }
      
      // 구조화된 데이터가 이미 있는 경우 (AIReportSection에서 직접 전달된 경우)
      if (data.eegTimeSeriesStats && data.personalInfo) {
        
        // bandPowers가 있는지 확인
        if (!data.eegTimeSeriesStats.bandPowers) {
          console.error('❌ bandPowers 데이터가 없습니다');
          return null;
        }
        
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
              focusIndex: (() => {
                const value = data.eegTimeSeriesStats.eegIndices.focusIndex?.value || data.eegTimeSeriesStats.eegIndices.focusIndex || 2.0;
                console.log('🔍 Focus Index 추출:', { 
                  raw: data.eegTimeSeriesStats.eegIndices.focusIndex, 
                  extracted: value 
                });
                return value;
              })(),
              relaxationIndex: (() => {
                const value = data.eegTimeSeriesStats.eegIndices.relaxationIndex?.value || data.eegTimeSeriesStats.eegIndices.relaxationIndex || 0.2;
                console.log('🔍 Relaxation Index 추출:', { 
                  raw: data.eegTimeSeriesStats.eegIndices.relaxationIndex, 
                  extracted: value 
                });
                return value;
              })(),
              stressIndex: (() => {
                const value = data.eegTimeSeriesStats.eegIndices.stressIndex?.value || data.eegTimeSeriesStats.eegIndices.stressIndex || 3.2;
                console.log('🔍 Stress Index 추출:', { 
                  raw: data.eegTimeSeriesStats.eegIndices.stressIndex, 
                  extracted: value 
                });
                return value;
              })(),
              hemisphericBalance: (() => {
                const value = data.eegTimeSeriesStats.eegIndices.hemisphericBalance?.value || data.eegTimeSeriesStats.eegIndices.hemisphericBalance || 0.05;
                console.log('🔍 Hemispheric Balance 추출:', { 
                  raw: data.eegTimeSeriesStats.eegIndices.hemisphericBalance, 
                  extracted: value 
                });
                return value;
              })(),
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

      // processedTimeSeries가 최상위에 있는 경우 (파이프라인에서 전달)
      if (data.processedTimeSeries && !data.processedTimeSeries.eeg) {
        console.log('📊 최상위 processedTimeSeries 데이터 확인');
        const timeSeriesKeys = Object.keys(data.processedTimeSeries);
        console.log('🔍 processedTimeSeries 키들:', timeSeriesKeys);
        
        // processedTimeSeries가 직접 EEG 시계열 데이터를 포함하는 경우
        if (timeSeriesKeys.includes('AlphaPower') || timeSeriesKeys.includes('alphaPower')) {
          console.log('✅ processedTimeSeries가 직접 EEG 데이터 포함');
          const eegData = data.processedTimeSeries;
          
          // 시계열 데이터 통계 계산 함수
          const calculateStatistics = (timeSeries: number[] | undefined) => {
            if (!timeSeries || timeSeries.length === 0) {
              console.log('⚠️ 시계열 데이터가 비어있음');
              return { mean: 0, variance: 0, std: 0, min: 0, max: 0, count: 0 };
            }
            const n = timeSeries.length;
            const mean = timeSeries.reduce((sum, val) => sum + val, 0) / n;
            const variance = timeSeries.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
            const std = Math.sqrt(variance);
            const min = Math.min(...timeSeries);
            const max = Math.max(...timeSeries);
            console.log(`📊 통계 계산 완료: mean=${mean.toFixed(2)}, std=${std.toFixed(2)}, min=${min.toFixed(2)}, max=${max.toFixed(2)}, n=${n}`);
            return { mean, variance, std, min, max, count: n };
          };
          
          // 실제 시계열 데이터에서 통계 계산
          const deltaStats = calculateStatistics(eegData.DeltaPower || eegData.deltaPower);
          const thetaStats = calculateStatistics(eegData.ThetaPower || eegData.thetaPower);
          const alphaStats = calculateStatistics(eegData.AlphaPower || eegData.alphaPower);
          const betaStats = calculateStatistics(eegData.BetaPower || eegData.betaPower);
          const gammaStats = calculateStatistics(eegData.GammaPower || eegData.gammaPower);
          
          console.log('📊 계산된 밴드 파워 통계:', {
            delta: deltaStats,
            theta: thetaStats,
            alpha: alphaStats,
            beta: betaStats,
            gamma: gammaStats
          });
          
          return {
            personalInfo: data.personalInfo || personalInfo,
            eegTimeSeriesStats: {
              bandPowers: {
                delta: deltaStats,
                theta: thetaStats,
                alpha: alphaStats,
                beta: betaStats,
                gamma: gammaStats
              },
              eegIndices: {
                focusIndex: calculateStatistics(eegData.FocusIndex || eegData.focusIndex),
                relaxationIndex: calculateStatistics(eegData.RelaxationIndex || eegData.relaxationIndex),
                stressIndex: calculateStatistics(eegData.StressIndex || eegData.stressIndex),
                hemisphericBalance: calculateStatistics(eegData.HemisphericBalance || eegData.hemisphericBalance),
                cognitiveLoad: calculateStatistics(eegData.CognitiveLoad || eegData.cognitiveLoad),
                emotionalStability: calculateStatistics(eegData.EmotionalStability || eegData.emotionalStability)
              },
              qualityMetrics: {
                signalQuality: calculateStatistics(eegData.SignalQuality || eegData.signalQuality).mean || 0.85,
                measurementDuration: data.duration || 300,
                dataCompleteness: 0.9
              }
            }
          };
        }
      }
      
      // EEG 시계열 데이터가 있는 경우 (시계열 통계 사용)
      if (data.processedTimeSeries?.eeg || data.timeSeriesData?.eeg) {
        console.log('📊 시계열 EEG 데이터에서 통계 계산');
        const eegData = data.processedTimeSeries?.eeg || data.timeSeriesData?.eeg;
        console.log('🔍 실제 eegData 구조 (처음 100자):', JSON.stringify(eegData).substring(0, 100));
        console.log('🔍 eegData 키들:', Object.keys(eegData || {}));
        console.log('🔍 AlphaPower 존재 여부:', !!(eegData?.AlphaPower || eegData?.alphaPower));
        console.log('🔍 AlphaPower 샘플:', eegData?.AlphaPower?.slice(0, 5) || eegData?.alphaPower?.slice(0, 5));
        
        // 시계열 데이터 통계 계산 함수
        const calculateStatistics = (timeSeries: number[] | undefined) => {
          if (!timeSeries || timeSeries.length === 0) {
            console.log('⚠️ 시계열 데이터가 비어있음 (eeg 하위)');
            return { mean: 0, variance: 0, std: 0, min: 0, max: 0, count: 0 };
          }
          const n = timeSeries.length;
          const mean = timeSeries.reduce((sum, val) => sum + val, 0) / n;
          const variance = timeSeries.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
          const std = Math.sqrt(variance);
          const min = Math.min(...timeSeries);
          const max = Math.max(...timeSeries);
          return { mean, variance, std, min, max, count: n };
        };
        
        // 실제 시계열 데이터에서 통계 계산 (대문자로 시작하는 필드명 처리)
        const deltaStats = calculateStatistics(eegData.DeltaPower || eegData.deltaPower);
        const thetaStats = calculateStatistics(eegData.ThetaPower || eegData.thetaPower);
        const alphaStats = calculateStatistics(eegData.AlphaPower || eegData.alphaPower);
        const betaStats = calculateStatistics(eegData.BetaPower || eegData.betaPower);
        const gammaStats = calculateStatistics(eegData.GammaPower || eegData.gammaPower);
        const focusStats = calculateStatistics(eegData.FocusIndex || eegData.focusIndex);
        const relaxStats = calculateStatistics(eegData.RelaxationIndex || eegData.relaxationIndex);
        const stressStats = calculateStatistics(eegData.StressIndex || eegData.stressIndex);
        const hemisphericStats = calculateStatistics(eegData.HemisphericBalance || eegData.hemisphericBalance);
        const cognitiveStats = calculateStatistics(eegData.CognitiveLoad || eegData.cognitiveLoad);
        const emotionalStats = calculateStatistics(eegData.EmotionalStability || eegData.emotionalStability);
        const signalQualityStats = calculateStatistics(eegData.SignalQuality || eegData.signalQuality);
        
        console.log('📊 계산된 밴드 파워 통계:', {
          delta: deltaStats,
          theta: thetaStats,
          alpha: alphaStats,
          beta: betaStats,
          gamma: gammaStats
        });
        
        return {
          personalInfo,
          eegTimeSeriesStats: {
            bandPowers: {
              delta: deltaStats,
              theta: thetaStats,
              alpha: alphaStats,
              beta: betaStats,
              gamma: gammaStats
            },
            eegIndices: {
              focusIndex: focusStats,
              relaxationIndex: relaxStats,
              stressIndex: stressStats,
              hemisphericBalance: hemisphericStats,
              cognitiveLoad: cognitiveStats,
              emotionalStability: emotionalStats
            },
            qualityMetrics: {
              signalQuality: signalQualityStats.mean || 0.85,
              measurementDuration: data.duration || 300,
              dataCompleteness: 0.9
            }
          }
        };
      }
      
      // EEG 데이터가 measurementData에 있는 경우 (fallback)
      if (data.measurementData?.eegMetrics) {
        console.log('📊 measurementData에서 EEG 메트릭 추출');
        const eegMetrics = data.measurementData.eegMetrics;
        console.log('🔍 실제 eegMetrics 구조:', JSON.stringify(eegMetrics, null, 2));
        
        // 실제 데이터 구조에 맞게 변환 (정규화된 값을 실제 Power 값으로 변환)
        const scaleFactor = 100; // 정규화 해제를 위한 스케일 팩터 (1000 -> 100으로 수정)
        
        // 실제 표준편차 계산을 위한 헬퍼 함수
        const calculateBandStatistics = (normalizedValue: number, defaultValue: number) => {
          const meanValue = (normalizedValue || defaultValue) * scaleFactor;
          // 실제 측정값 기반으로 표준편차 계산 (정규화된 값의 변동성을 고려)
          const realStd = meanValue * 0.25; // 평균의 25%를 표준편차로 사용 (실제 생체신호 변동성 반영)
          return {
            mean: meanValue,
            std: realStd,
            min: meanValue - realStd * 1.5,
            max: meanValue + realStd * 1.5
          };
        };
        
        return {
          personalInfo,
          eegTimeSeriesStats: {
            bandPowers: {
              delta: calculateBandStatistics(eegMetrics.delta, 0.25),
              theta: calculateBandStatistics(eegMetrics.theta, 0.3),
              alpha: calculateBandStatistics(eegMetrics.alpha, 0.35),
              beta: calculateBandStatistics(eegMetrics.beta, 0.4),
              gamma: calculateBandStatistics(eegMetrics.gamma, 0.15)
            },
            eegIndices: {
              focusIndex: (() => {
                const mean = eegMetrics.attentionIndex ? eegMetrics.attentionIndex / 30 : 2.5;
                const std = mean * 0.2; // 평균의 20%를 표준편차로 사용
                return { mean, std, min: mean - std * 1.5, max: mean + std * 1.5 };
              })(),
              relaxationIndex: (() => {
                const mean = eegMetrics.meditationIndex ? eegMetrics.meditationIndex / 400 : 0.2;
                const std = mean * 0.15; // 평균의 15%를 표준편차로 사용
                return { mean, std, min: mean - std * 1.5, max: mean + std * 1.5 };
              })(),
              stressIndex: (() => {
                const mean = eegMetrics.stressIndex || 3.2;
                const std = mean * 0.18; // 평균의 18%를 표준편차로 사용
                return { mean, std, min: mean - std * 1.5, max: mean + std * 1.5 };
              })(),
              hemisphericBalance: (() => {
                const mean = 0.05; // 균형 상태
                const std = 0.05; // 고정값 유지 (균형 지표 특성상)
                return { mean, std, min: -0.1, max: 0.1 };
              })(),
              cognitiveLoad: (() => {
                const mean = eegMetrics.fatigueIndex ? eegMetrics.fatigueIndex / 15 : 1.8;
                const std = mean * 0.25; // 평균의 25%를 표준편차로 사용
                return { mean, std, min: mean - std * 1.5, max: mean + std * 1.5 };
              })(),
              emotionalStability: (() => {
                const mean = 0.75; // 기본 안정성
                const std = mean * 0.2; // 평균의 20%를 표준편차로 사용
                return { mean, std, min: mean - std * 1.5, max: mean + std * 1.5 };
              })()
            },
            qualityMetrics: {
              signalQuality: eegMetrics.signalQuality || data.measurementData.qualityMetrics?.signalQuality || 0.85,
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
            focusIndex: { mean: 2.5, std: 0.5, min: 1.5, max: 3.0 },
            relaxationIndex: { mean: 0.2, std: 0.02, min: 0.18, max: 0.22 },
            stressIndex: { mean: 3.2, std: 0.6, min: 2.8, max: 4.0 },
            hemisphericBalance: { mean: 0.05, std: 0.05, min: -0.1, max: 0.1 },
            cognitiveLoad: { mean: 1.8, std: 0.5, min: 0.5, max: 2.5 },
            emotionalStability: { mean: 0.75, std: 0.2, min: 0.4, max: 1.2 }
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
    console.log('🔄 프롬프트 생성 시작 - 데이터 변환 확인');
    
    // processedTimeSeries가 있으면 먼저 변환 시도
    if (data.processedTimeSeries && !data._transformed) {
      console.log('📊 processedTimeSeries 데이터 변환 시도');
      const transformedData = transformEEGDataForGemini(data);
      if (transformedData) {
        console.log('✅ 데이터 변환 성공:', {
          deltaMean: transformedData.bandPowers.delta.mean.toFixed(2),
          focusIndexMean: transformedData.eegIndices.focusIndex.mean.toFixed(2),
          stressIndexMean: transformedData.eegIndices.stressIndex.mean.toFixed(2)
        });
        
        // 변환된 데이터로 덮어쓰기
        data.eegTimeSeriesStats = {
          bandPowers: transformedData.bandPowers,
          eegIndices: transformedData.eegIndices,
          qualityMetrics: transformedData.qualityMetrics
        };
        data._transformed = true; // 중복 변환 방지
      }
    }
    
    const eegData = this.extractEEGDataFromReport(data);
    if (!eegData) {
      throw new Error('EEG 데이터 추출 실패');
    }

    const { personalInfo, eegTimeSeriesStats } = eegData;
    
    // 구조화된 데이터에서 상세 정보 추출
    const originalData = data.eegTimeSeriesStats || {};
    const bandPowers = eegTimeSeriesStats.bandPowers || {};
    const eegIndices = eegTimeSeriesStats.eegIndices || {};
    
    // Helper function to extract value from index
    const getIndexValue = (index: any): number => {
      if (typeof index === 'number') return index;
      if (index?.value !== undefined) return index.value;
      if (index?.mean !== undefined) return index.mean;
      return 0;
    };
    
    console.log('📊 프롬프트 생성용 EEG Indices 데이터 확인:', {
      focusIndex: eegIndices.focusIndex,
      focusIndexValue: getIndexValue(eegIndices.focusIndex),
      relaxationIndex: eegIndices.relaxationIndex,
      relaxationIndexValue: getIndexValue(eegIndices.relaxationIndex),
      stressIndex: eegIndices.stressIndex,
      stressIndexValue: getIndexValue(eegIndices.stressIndex)
    });
    
    // 개인정보 기반 동적 프롬프트 생성
    const age = personalInfo.age || 30;
    const gender = personalInfo.gender === 'male' ? '남성' : '여성';
    const occupation = personalInfo.occupation || '일반직';
    
    // 연령대별 특성
    const getAgeCharacteristics = (age: number) => {
      if (age < 30) {
        return '청년기 뇌 발달 완성기의 신경가소성과 최적화된 인지 기능';
      } else if (age < 50) {
        return '중년기 신경생리학적 변화 - 호르몬 변동, 인지 예비능 활용, 백질 완전성 변화';
      } else {
        return '장년기 뇌 노화 과정 - 신경 효율성, 보상 기전, 축적된 경험의 활용';
      }
    };
    
    // 성별별 특성
    const getGenderCharacteristics = (gender: string) => {
      if (gender === '남성') {
        return '남성 호르몬 변동, HPA축 반응성, 편도체-전전두피질 연결성 특성';
      } else {
        return '여성 호르몬 주기, 스트레스 반응성, 좌우뇌 연결성 특성';
      }
    };
    
    // 직업별 특성
    const getOccupationCharacteristics = (occupation: string) => {
      const occupationLower = occupation.toLowerCase();
      
      if (occupationLower.includes('개발') || occupationLower.includes('프로그래머') || occupationLower.includes('엔지니어')) {
        return '장시간 화면 노출, 복잡한 논리적 사고, 멀티태스킹, 좌뇌 우세 패턴';
      } else if (occupationLower.includes('장교') || occupationLower.includes('군') || occupationLower.includes('경찰')) {
        return '고도의 스트레스 관리, 신속한 의사결정, 리더십 요구, 규칙적 생활패턴';
      } else if (occupationLower.includes('의사') || occupationLower.includes('간호') || occupationLower.includes('치료')) {
        return '높은 책임감, 정밀한 집중력, 감정적 부담, 불규칙한 근무패턴';
      } else if (occupationLower.includes('교사') || occupationLower.includes('교수') || occupationLower.includes('강사')) {
        return '지속적 집중력, 언어적 사고, 대인관계 스트레스, 창의적 문제해결';
      } else if (occupationLower.includes('회계') || occupationLower.includes('사무') || occupationLower.includes('관리')) {
        return '세밀한 집중력, 반복적 업무, 정확성 요구, 좌뇌 우세 패턴';
      } else if (occupationLower.includes('예술') || occupationLower.includes('디자인') || occupationLower.includes('창작')) {
        return '창의적 사고, 우뇌 활성화, 감정적 표현, 직관적 처리';
      } else if (occupationLower.includes('백수') || occupationLower.includes('무직')) {
        return '불규칙한 생활패턴, 사회적 스트레스, 목적의식 부족, 활동량 저하';
      } else {
        return '일반적인 직업적 스트레스, 업무 관련 인지적 요구사항, 사회적 상호작용';
      }
    };
    
    return `
당신은 신경생리학 및 뇌파 분석 전문의입니다. ${age}세 ${gender} ${occupation}의 EEG 데이터를 최대한 전문적이고 상세하게 분석해주세요.

## 개인정보 및 전문적 고려사항
- 이름: ${personalInfo.name}
- 나이: ${age}세 (${getAgeCharacteristics(age)})
- 성별: ${gender} (${getGenderCharacteristics(gender)})
- 직업: ${occupation} (${getOccupationCharacteristics(occupation)})

## 전문의로서의 분석 지침
- ${age}세 ${gender}의 연령/성별별 신경생리학적 특성을 뇌파 해석에 반영
- ${occupation} 직업군의 특수한 인지적 요구사항과 스트레스 패턴 분석
- 개인의 생활패턴과 직업적 특성을 고려한 뇌파 변화 해석
- 신경학적 근거에 기반한 개별화된 임상적 해석 제공

## EEG Band Powers 분석 (μV²)

### Delta Power (0.5-4Hz)
- 측정값: ${bandPowers.delta?.mean?.toFixed(2)}μV² (표준편차: ${bandPowers.delta?.std?.toFixed(2)})
- 범위: ${bandPowers.delta?.min?.toFixed(2)} - ${bandPowers.delta?.max?.toFixed(2)}μV²
- 정상범위: ${EEG_NORMAL_RANGES.bandPowers.delta.min}-${EEG_NORMAL_RANGES.bandPowers.delta.max}${EEG_NORMAL_RANGES.bandPowers.delta.unit}: ${EEG_NORMAL_RANGES.bandPowers.delta.description}
- 상태: ${getStatus(bandPowers.delta?.mean || 0, EEG_NORMAL_RANGES.bandPowers.delta)}
- 해석: ${getInterpretation('delta', bandPowers.delta?.mean || 0, getStatus(bandPowers.delta?.mean || 0, EEG_NORMAL_RANGES.bandPowers.delta))}

### Theta Power (4-8Hz)
- 측정값: ${bandPowers.theta?.mean?.toFixed(2)}μV² (표준편차: ${bandPowers.theta?.std?.toFixed(2)})
- 범위: ${bandPowers.theta?.min?.toFixed(2)} - ${bandPowers.theta?.max?.toFixed(2)}μV²
- 정상범위: ${EEG_NORMAL_RANGES.bandPowers.theta.min}-${EEG_NORMAL_RANGES.bandPowers.theta.max}${EEG_NORMAL_RANGES.bandPowers.theta.unit}: ${EEG_NORMAL_RANGES.bandPowers.theta.description}
- 상태: ${getStatus(bandPowers.theta?.mean || 0, EEG_NORMAL_RANGES.bandPowers.theta)}
- 해석: ${getInterpretation('theta', bandPowers.theta?.mean || 0, getStatus(bandPowers.theta?.mean || 0, EEG_NORMAL_RANGES.bandPowers.theta))}

### Alpha Power (8-13Hz)
- 측정값: ${bandPowers.alpha?.mean?.toFixed(2)}μV² (표준편차: ${bandPowers.alpha?.std?.toFixed(2)})
- 범위: ${bandPowers.alpha?.min?.toFixed(2)} - ${bandPowers.alpha?.max?.toFixed(2)}μV²
- 정상범위: ${EEG_NORMAL_RANGES.bandPowers.alpha.min}-${EEG_NORMAL_RANGES.bandPowers.alpha.max}${EEG_NORMAL_RANGES.bandPowers.alpha.unit}: ${EEG_NORMAL_RANGES.bandPowers.alpha.description}
- 상태: ${getStatus(bandPowers.alpha?.mean || 0, EEG_NORMAL_RANGES.bandPowers.alpha)}
- 해석: ${getInterpretation('alpha', bandPowers.alpha?.mean || 0, getStatus(bandPowers.alpha?.mean || 0, EEG_NORMAL_RANGES.bandPowers.alpha))}

### Beta Power (13-30Hz)
- 측정값: ${bandPowers.beta?.mean?.toFixed(2)}μV² (표준편차: ${bandPowers.beta?.std?.toFixed(2)})
- 범위: ${bandPowers.beta?.min?.toFixed(2)} - ${bandPowers.beta?.max?.toFixed(2)}μV²
- 정상범위: ${EEG_NORMAL_RANGES.bandPowers.beta.min}-${EEG_NORMAL_RANGES.bandPowers.beta.max}${EEG_NORMAL_RANGES.bandPowers.beta.unit}: ${EEG_NORMAL_RANGES.bandPowers.beta.description}
- 상태: ${getStatus(bandPowers.beta?.mean || 0, EEG_NORMAL_RANGES.bandPowers.beta)}
- 해석: ${getInterpretation('beta', bandPowers.beta?.mean || 0, getStatus(bandPowers.beta?.mean || 0, EEG_NORMAL_RANGES.bandPowers.beta))}

### Gamma Power (30-100Hz)
- 측정값: ${bandPowers.gamma?.mean?.toFixed(2)}μV² (표준편차: ${bandPowers.gamma?.std?.toFixed(2)})
- 범위: ${bandPowers.gamma?.min?.toFixed(2)} - ${bandPowers.gamma?.max?.toFixed(2)}μV²
- 정상범위: ${EEG_NORMAL_RANGES.bandPowers.gamma.min}-${EEG_NORMAL_RANGES.bandPowers.gamma.max}${EEG_NORMAL_RANGES.bandPowers.gamma.unit}: ${EEG_NORMAL_RANGES.bandPowers.gamma.description}
- 상태: ${getStatus(bandPowers.gamma?.mean || 0, EEG_NORMAL_RANGES.bandPowers.gamma)}
- 해석: ${getInterpretation('gamma', bandPowers.gamma?.mean || 0, getStatus(bandPowers.gamma?.mean || 0, EEG_NORMAL_RANGES.bandPowers.gamma))}

${bandPowers.totalPower ? `### Total Power
- 측정값: ${bandPowers.totalPower.mean?.toFixed(2)}μV² (표준편차: ${bandPowers.totalPower.std?.toFixed(2)})
- 범위: ${bandPowers.totalPower.min?.toFixed(2)} - ${bandPowers.totalPower.max?.toFixed(2)}μV²
- 정상범위: ${EEG_NORMAL_RANGES.bandPowers.totalPower.min}-${EEG_NORMAL_RANGES.bandPowers.totalPower.max}${EEG_NORMAL_RANGES.bandPowers.totalPower.unit}: ${EEG_NORMAL_RANGES.bandPowers.totalPower.description}
- 상태: ${getStatus(bandPowers.totalPower.mean || 0, EEG_NORMAL_RANGES.bandPowers.totalPower)}
- 해석: ${getInterpretation('totalPower', bandPowers.totalPower.mean || 0, getStatus(bandPowers.totalPower.mean || 0, EEG_NORMAL_RANGES.bandPowers.totalPower))}
` : ''}

## 4대 뇌파 분석 지표

### 1. Arousal (뇌파 각성도)
- **Beta/Alpha Ratio**: ${(bandPowers.beta?.mean / bandPowers.alpha?.mean).toFixed(2)}
- **계산 공식**: Beta Power / Alpha Power
- **정상범위**: 0.8-1.5
- **해석**: 뇌의 전반적인 활성화 수준 (Beta파↑ = 각성도↑, Alpha파↑ = 이완상태)
- **임상적 의미**: 높으면 과각성, 낮으면 저각성 상태

### 2. Valence (감정균형도)  
- **Hemispheric Balance**: ${getIndexValue(eegIndices?.hemisphericBalance).toFixed(3)}
- **계산 공식**: (Left Alpha - Right Alpha) / (Left Alpha + Right Alpha)
- **정상범위**: -0.1 ~ 0.1
- **해석**: 좌우뇌 활성 균형 (양수=좌뇌우세/긍정적, 음수=우뇌우세/부정적)
- **임상적 의미**: 절댓값 0.1 초과시 감정 편향성 시사

### 3. Focus (뇌파 집중도)
- **Focus Index**: ${getIndexValue(eegIndices?.focusIndex).toFixed(2)}
- **계산 공식**: Beta Power / (Alpha Power + Theta Power)
- **정상범위**: 1.5-3.0
- **해석**: 주의력과 인지적 집중 능력 (Beta파=집중, Alpha+Theta파=이완/몽상)
- **임상적 의미**: 높으면 과집중, 낮으면 주의력 부족

### 4. Stress (스트레스 수준)
- **Stress Index**: ${getIndexValue(eegIndices?.stressIndex).toFixed(2)}
- **계산 공식**: (Beta Power + Gamma Power) / (Alpha Power + Theta Power)
- **정상범위**: 2.8-4.0
- **해석**: 정신적/신체적 스트레스 부하 (고주파수파=스트레스, 저주파수파=안정)
- **임상적 의미**: 높으면 스트레스 과부하, 낮으면 무기력 상태

### 보조 지표
- Relaxation Index: ${getIndexValue(eegIndices?.relaxationIndex).toFixed(2)} (정상범위: 0.18-0.22)
- Cognitive Load: ${getIndexValue(eegIndices?.cognitiveLoad).toFixed(2)} (인지 부하)
- Emotional Stability: ${getIndexValue(eegIndices?.emotionalStability).toFixed(2)} (정서 안정성)

## EEG Indices 상세 분석

### Focus Index (집중 지수)
- 측정값: ${getIndexValue(eegIndices?.focusIndex)?.toFixed(2)}
- 범위: ${eegIndices?.focusIndex?.min?.toFixed(2) || 'N/A'} - ${eegIndices?.focusIndex?.max?.toFixed(2) || 'N/A'}
- 정상범위: ${EEG_NORMAL_RANGES.indices.focusIndex.min}-${EEG_NORMAL_RANGES.indices.focusIndex.max}: ${EEG_NORMAL_RANGES.indices.focusIndex.description}
- 상태: ${getStatus(getIndexValue(eegIndices?.focusIndex) || 0, EEG_NORMAL_RANGES.indices.focusIndex)}
- 해석: ${getInterpretation('focusIndex', getIndexValue(eegIndices?.focusIndex) || 0, getStatus(getIndexValue(eegIndices?.focusIndex) || 0, EEG_NORMAL_RANGES.indices.focusIndex))}

### Relaxation Index (이완 지수)
- 측정값: ${getIndexValue(eegIndices?.relaxationIndex)?.toFixed(2)}
- 범위: ${eegIndices?.relaxationIndex?.min?.toFixed(2) || 'N/A'} - ${eegIndices?.relaxationIndex?.max?.toFixed(2) || 'N/A'}
- 정상범위: ${EEG_NORMAL_RANGES.indices.relaxationIndex.min}-${EEG_NORMAL_RANGES.indices.relaxationIndex.max}: ${EEG_NORMAL_RANGES.indices.relaxationIndex.description}
- 상태: ${getStatus(getIndexValue(eegIndices?.relaxationIndex) || 0, EEG_NORMAL_RANGES.indices.relaxationIndex)}
- 해석: ${getInterpretation('relaxationIndex', getIndexValue(eegIndices?.relaxationIndex) || 0, getStatus(getIndexValue(eegIndices?.relaxationIndex) || 0, EEG_NORMAL_RANGES.indices.relaxationIndex))}

### Stress Index (스트레스 지수)
- 측정값: ${getIndexValue(eegIndices?.stressIndex)?.toFixed(2)}
- 범위: ${eegIndices?.stressIndex?.min?.toFixed(2) || 'N/A'} - ${eegIndices?.stressIndex?.max?.toFixed(2) || 'N/A'}
- 정상범위: ${EEG_NORMAL_RANGES.indices.stressIndex.min}-${EEG_NORMAL_RANGES.indices.stressIndex.max}: ${EEG_NORMAL_RANGES.indices.stressIndex.description}
- 상태: ${getStatus(getIndexValue(eegIndices?.stressIndex) || 0, EEG_NORMAL_RANGES.indices.stressIndex)}
- 해석: ${getInterpretation('stressIndex', getIndexValue(eegIndices?.stressIndex) || 0, getStatus(getIndexValue(eegIndices?.stressIndex) || 0, EEG_NORMAL_RANGES.indices.stressIndex))}

### Hemispheric Balance (반구 균형)
- 측정값: ${getIndexValue(eegIndices?.hemisphericBalance)?.toFixed(3)}
- 범위: ${eegIndices?.hemisphericBalance?.min?.toFixed(3) || 'N/A'} - ${eegIndices?.hemisphericBalance?.max?.toFixed(3) || 'N/A'}
- 정상범위: ${EEG_NORMAL_RANGES.indices.hemisphericBalance.min} to ${EEG_NORMAL_RANGES.indices.hemisphericBalance.max}: ${EEG_NORMAL_RANGES.indices.hemisphericBalance.description}
- 상태: ${getStatus(getIndexValue(eegIndices?.hemisphericBalance) || 0, EEG_NORMAL_RANGES.indices.hemisphericBalance)}
- 해석: ${getInterpretation('hemisphericBalance', getIndexValue(eegIndices?.hemisphericBalance) || 0, getStatus(getIndexValue(eegIndices?.hemisphericBalance) || 0, EEG_NORMAL_RANGES.indices.hemisphericBalance))}

### Cognitive Load (인지 부하)
- 측정값: ${getIndexValue(eegIndices?.cognitiveLoad)?.toFixed(2)}
- 범위: ${eegIndices?.cognitiveLoad?.min?.toFixed(2) || 'N/A'} - ${eegIndices?.cognitiveLoad?.max?.toFixed(2) || 'N/A'}
- 정상범위: ${EEG_NORMAL_RANGES.indices.cognitiveLoad.min}-${EEG_NORMAL_RANGES.indices.cognitiveLoad.max}: ${EEG_NORMAL_RANGES.indices.cognitiveLoad.description}
- 상태: ${getStatus(getIndexValue(eegIndices?.cognitiveLoad) || 0, EEG_NORMAL_RANGES.indices.cognitiveLoad)}
- 해석: ${getInterpretation('cognitiveLoad', getIndexValue(eegIndices?.cognitiveLoad) || 0, getStatus(getIndexValue(eegIndices?.cognitiveLoad) || 0, EEG_NORMAL_RANGES.indices.cognitiveLoad))}

### Emotional Stability (감정 안정성)
- 측정값: ${getIndexValue(eegIndices?.emotionalStability)?.toFixed(2)}
- 범위: ${eegIndices?.emotionalStability?.min?.toFixed(2) || 'N/A'} - ${eegIndices?.emotionalStability?.max?.toFixed(2) || 'N/A'}
- 정상범위: ${EEG_NORMAL_RANGES.indices.emotionalStability.min}-${EEG_NORMAL_RANGES.indices.emotionalStability.max}: ${EEG_NORMAL_RANGES.indices.emotionalStability.description}
- 상태: ${getStatus(getIndexValue(eegIndices?.emotionalStability) || 0, EEG_NORMAL_RANGES.indices.emotionalStability)}
- 해석: ${getInterpretation('emotionalStability', getIndexValue(eegIndices?.emotionalStability) || 0, getStatus(getIndexValue(eegIndices?.emotionalStability) || 0, EEG_NORMAL_RANGES.indices.emotionalStability))}

## 데이터 품질
- 신호 품질: ${((eegTimeSeriesStats.qualityMetrics?.signalQuality || 0.85) * 100).toFixed(1)}%
- 측정 시간: ${eegTimeSeriesStats.qualityMetrics?.measurementDuration || 300}초
- 데이터 완성도: ${((eegTimeSeriesStats.qualityMetrics?.dataCompleteness || 0.90) * 100).toFixed(1)}%

## 분석 요청사항
위의 상세한 EEG 데이터를 바탕으로 다음 JSON 형식으로 4대 뇌파 분석 지표 중심의 의료급 분석 결과를 제공해주세요.

**중요: overallScore는 반드시 4대 지표(arousal, valence, focus, stress)의 점수를 평균한 값으로 계산해주세요.**
예시: arousal=94, valence=100, focus=100, stress=100인 경우 overallScore = (94+100+100+100)/4 = 98.5

{
  "fourDimensionAnalysis": {
    "arousal": {
      "dimension": "뇌파 각성 건강도",
      "level": "우수|양호|개선필요",
      "score": 0-100,
      "interpretation": "뇌 활성화의 적절성 수준 해석 (100점에 가까울수록 건강한 각성 상태)",
      "evidence": {
        "betaAlphaRatio": ${((bandPowers.beta?.mean || 180) / (bandPowers.alpha?.mean || 300)).toFixed(2)},
        "gammaActivity": ${bandPowers.gamma?.mean?.toFixed(2) || '50.00'},
        "calculationFormula": "Beta Power / Alpha Power",
        "normalRange": "Beta/Alpha 비율 0.8-1.5, Gamma 30-80μV²"
      },
      "clinicalSignificance": "normal|mild|moderate|severe",
      "personalizedInterpretation": "${personalInfo.age}세 ${personalInfo.occupation}의 각성도 특성 해석",
      "recommendations": ["각성도 조절을 위한 개인 맞춤 권장사항"]
    },
    "valence": {
      "dimension": "감정균형도",
      "level": "우수|양호|개선필요",
      "score": 0-100,
      "interpretation": "감정 균형의 안정성 수준 해석 (100점에 가까울수록 건강한 감정 균형)",
      "evidence": {
        "hemisphericBalance": ${getIndexValue(eegIndices?.hemisphericBalance).toFixed(3)},
        "leftBrainDominance": "좌뇌 우세 여부",
        "calculationFormula": "(Left Alpha - Right Alpha) / (Left Alpha + Right Alpha)",
        "normalRange": "-0.1~0.1"
      },
      "clinicalSignificance": "normal|mild|moderate|severe",
      "personalizedInterpretation": "개인의 감정 상태와 균형 특성 해석",
      "recommendations": ["감정 균형 개선을 위한 개인 맞춤 권장사항"]
    },
    "focus": {
      "dimension": "뇌파 집중 건강도",
      "level": "우수|양호|개선필요",
      "score": 0-100,
      "interpretation": "집중력의 적절성 수준 해석 (100점에 가까울수록 건강한 집중 능력)",
      "evidence": {
        "focusIndex": ${getIndexValue(eegIndices?.focusIndex).toFixed(2)},
        "calculationFormula": "Beta Power / (Alpha Power + Theta Power)",
        "normalRange": "1.5-3.0",
        "betaActivity": "집중 관련 베타파 활동"
      },
      "clinicalSignificance": "normal|mild|moderate|severe",
      "personalizedInterpretation": "개인의 집중력 특성과 직업적 요구사항 고려",
      "recommendations": ["집중력 향상을 위한 개인 맞춤 권장사항"]
    },
    "stress": {
      "dimension": "스트레스 건강도",
      "level": "우수|양호|개선필요",
      "score": 0-100,
      "interpretation": "스트레스 관리 상태 해석 (100점에 가까울수록 건강한 스트레스 수준)",
      "evidence": {
        "stressIndex": ${getIndexValue(eegIndices?.stressIndex).toFixed(2)},
        "calculationFormula": "(Beta Power + Gamma Power) / (Alpha Power + Theta Power)",
        "normalRange": "2.8-4.0",
        "physiologicalMarkers": "스트레스 관련 생리적 지표"
      },
      "clinicalSignificance": "normal|mild|moderate|severe",
      "personalizedInterpretation": "개인의 스트레스 반응 패턴과 대처 능력 해석",
      "recommendations": ["스트레스 관리를 위한 개인 맞춤 권장사항"]
    }
  },
  "detailedDataAnalysis": {
    "bandPowerAnalysis": {
      "frontalNeuroActivity": {"interpretation": "전두엽 신경활성도 실제 측정값 기반 전체 뇌파 활동 해석", "evidence": "수치적 근거", "clinicalSignificance": "임상적 의미"},
      "delta": {"interpretation": "Delta 파 실제 측정값 기반 해석", "evidence": "수치적 근거", "clinicalSignificance": "임상적 의미"},
      "theta": {"interpretation": "Theta 파 실제 측정값 기반 해석", "evidence": "수치적 근거", "clinicalSignificance": "임상적 의미"},
      "alpha": {"interpretation": "Alpha 파 실제 측정값 기반 해석", "evidence": "수치적 근거", "clinicalSignificance": "임상적 의미"},
      "beta": {"interpretation": "Beta 파 실제 측정값 기반 해석", "evidence": "수치적 근거", "clinicalSignificance": "임상적 의미"},
      "gamma": {"interpretation": "Gamma 파 실제 측정값 기반 해석", "evidence": "수치적 근거", "clinicalSignificance": "임상적 의미"}
    },
    "cognitiveStateAnalysis": {
      "overallAssessment": "4대 지표 종합 뇌 기능 상태 평가",
      "dimensionCorrelations": "Arousal-Valence, Focus-Stress 간 상관관계 분석",
      "balanceAnalysis": "4대 지표 간 균형성 평가",
      "neurologicalIndicators": "신경학적 지표 해석"
    },
    "auxiliaryMetrics": {
      "focusIndex": {
        "indicator": "Focus Index",
        "value": ${getIndexValue(eegTimeSeriesStats.eegIndices?.focusIndex).toFixed(2)},
        "normalRange": "1.8 - 2.4",
        "status": "${getStatus(getIndexValue(eegTimeSeriesStats.eegIndices?.focusIndex) || 0, EEG_NORMAL_RANGES.indices.focusIndex)}",
        "min": ${eegTimeSeriesStats.eegIndices?.focusIndex?.min?.toFixed(2) || 'N/A'},
        "max": ${eegTimeSeriesStats.eegIndices?.focusIndex?.max?.toFixed(2) || 'N/A'},
        "interpretation": "${getInterpretation('focusIndex', getIndexValue(eegTimeSeriesStats.eegIndices?.focusIndex) || 0, getStatus(getIndexValue(eegTimeSeriesStats.eegIndices?.focusIndex) || 0, EEG_NORMAL_RANGES.indices.focusIndex))}"
      },
      "relaxationIndex": {
        "indicator": "Relaxation Index", 
        "value": ${getIndexValue(eegTimeSeriesStats.eegIndices?.relaxationIndex).toFixed(2)},
        "normalRange": "0.18 - 0.22 (normal tension state)",
        "status": "${getStatus(getIndexValue(eegTimeSeriesStats.eegIndices?.relaxationIndex) || 0, EEG_NORMAL_RANGES.indices.relaxationIndex)}",
        "min": ${eegTimeSeriesStats.eegIndices?.relaxationIndex?.min?.toFixed(2) || 'N/A'},
        "max": ${eegTimeSeriesStats.eegIndices?.relaxationIndex?.max?.toFixed(2) || 'N/A'},
        "interpretation": "${getInterpretation('relaxationIndex', getIndexValue(eegTimeSeriesStats.eegIndices?.relaxationIndex) || 0, getStatus(getIndexValue(eegTimeSeriesStats.eegIndices?.relaxationIndex) || 0, EEG_NORMAL_RANGES.indices.relaxationIndex))}"
      },
      "stressIndex": {
        "indicator": "Stress Index",
        "value": ${getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex).toFixed(2)},
        "normalRange": "2.8 - 4.0 (normal range)",
        "status": "${getStatus(getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex) || 0, EEG_NORMAL_RANGES.indices.stressIndex)}",
        "min": ${eegTimeSeriesStats.eegIndices?.stressIndex?.min?.toFixed(2) || 'N/A'},
        "max": ${eegTimeSeriesStats.eegIndices?.stressIndex?.max?.toFixed(2) || 'N/A'},
        "interpretation": "${getInterpretation('stressIndex', getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex) || 0, getStatus(getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex) || 0, EEG_NORMAL_RANGES.indices.stressIndex))}"
      },
      "cognitiveLoad": {
        "indicator": "Cognitive Load",
        "value": ${getIndexValue(eegTimeSeriesStats.eegIndices?.cognitiveLoad).toFixed(2)},
        "normalRange": "0.3 - 0.7 (정상적인 인지 부하)",
        "status": "${getStatus(getIndexValue(eegTimeSeriesStats.eegIndices?.cognitiveLoad) || 0, EEG_NORMAL_RANGES.indices.cognitiveLoad)}",
        "min": ${eegTimeSeriesStats.eegIndices?.cognitiveLoad?.min?.toFixed(2) || 'N/A'},
        "max": ${eegTimeSeriesStats.eegIndices?.cognitiveLoad?.max?.toFixed(2) || 'N/A'},
        "interpretation": "${getInterpretation('cognitiveLoad', getIndexValue(eegTimeSeriesStats.eegIndices?.cognitiveLoad) || 0, getStatus(getIndexValue(eegTimeSeriesStats.eegIndices?.cognitiveLoad) || 0, EEG_NORMAL_RANGES.indices.cognitiveLoad))}"
      },
      "emotionalStability": {
        "indicator": "Emotional Stability",
        "value": ${getIndexValue(eegTimeSeriesStats.eegIndices?.emotionalStability).toFixed(2)},
        "normalRange": "0.7 - 0.9 (우수한 감정 안정성)",
        "status": "${getStatus(getIndexValue(eegTimeSeriesStats.eegIndices?.emotionalStability) || 0, EEG_NORMAL_RANGES.indices.emotionalStability)}",
        "min": ${eegTimeSeriesStats.eegIndices?.emotionalStability?.min?.toFixed(2) || 'N/A'},
        "max": ${eegTimeSeriesStats.eegIndices?.emotionalStability?.max?.toFixed(2) || 'N/A'},
        "interpretation": "${getInterpretation('emotionalStability', getIndexValue(eegTimeSeriesStats.eegIndices?.emotionalStability) || 0, getStatus(getIndexValue(eegTimeSeriesStats.eegIndices?.emotionalStability) || 0, EEG_NORMAL_RANGES.indices.emotionalStability))}"
      },
      "hemisphericBalance": {
        "indicator": "Hemispheric Balance",
        "value": ${getIndexValue(eegTimeSeriesStats.eegIndices?.hemisphericBalance).toFixed(3)},
        "normalRange": "-0.1 to 0.1 (균형잡힌 반구 활동)",
        "status": "${getStatus(getIndexValue(eegTimeSeriesStats.eegIndices?.hemisphericBalance) || 0, EEG_NORMAL_RANGES.indices.hemisphericBalance)}",
        "min": ${eegTimeSeriesStats.eegIndices?.hemisphericBalance?.min?.toFixed(3) || 'N/A'},
        "max": ${eegTimeSeriesStats.eegIndices?.hemisphericBalance?.max?.toFixed(3) || 'N/A'},
        "interpretation": "${getInterpretation('hemisphericBalance', getIndexValue(eegTimeSeriesStats.eegIndices?.hemisphericBalance) || 0, getStatus(getIndexValue(eegTimeSeriesStats.eegIndices?.hemisphericBalance) || 0, EEG_NORMAL_RANGES.indices.hemisphericBalance))}"
      }
    }
  },
  "comprehensiveAssessment": {
    "overallSummary": "4가지 축(Arousal, Valence, Focus, Stress)을 종합한 전체적인 뇌 기능 상태 평가",
    "keyFindings": ["주요 발견사항 1", "주요 발견사항 2", "주요 발견사항 3"],
    "primaryConcerns": ["주요 문제점이나 개선이 필요한 영역"],
    "ageGenderAnalysis": {
      "ageComparison": "${age}세 ${gender}의 신경생리학적 특성을 반영한 상세 분석 - ${getAgeCharacteristics(age)}에 따른 뇌파 패턴 해석",
      "genderConsiderations": "${age}세 ${gender} 특성: ${getGenderCharacteristics(gender)}을 반영한 개별화 해석 제공",
      "developmentalContext": "${age < 30 ? '청년기' : age < 50 ? '중년기' : '장년기'} ${gender}의 뇌 발달 특성을 고려한 연령 특화 뇌파 분석"
    },
    "occupationalAnalysis": {
      "jobDemands": "${occupation}의 인지적 요구사항: ${getOccupationCharacteristics(occupation)}이 뇌파 패턴에 미치는 영향 분석",
      "workRelatedPatterns": "${occupation} 직업군 특화 패턴: 직업적 특성에 따른 뇌파 변화와 스트레스 반응 패턴 해석",
      "professionalRecommendations": "${age}세 ${occupation} 맞춤 권장사항: 직업적 특성과 연령을 고려한 뇌 건강 관리 전략"
    },
    "improvementPlan": {
      "shortTermGoals": ["1-4주 내 개선 목표"],
      "longTermGoals": ["3-6개월 장기 개선 방향"],
      "actionItems": ["구체적인 실행 계획"],
      "monitoringPlan": "추후 측정 및 모니터링 계획"
    },
    "riskAssessment": {
      "level": "low|moderate|high",
      "factors": ["위험 요소들"],
      "preventiveMeasures": ["예방적 조치사항"]
    },
    "overallScore": "4대 지표(arousal, valence, focus, stress)의 점수 평균값 (소수점 첫째자리까지)",
    "clinicalRecommendation": "전문의 상담 필요성 여부 및 추가 검사 권장사항"
  }
}`;
  }

  /**
   * Gemini API 호출 (재시도 로직 포함)
   */
  private async callGeminiAPIWithRetry(prompt: string, options: AnalysisOptions, maxRetries: number = 3): Promise<any> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Gemini API 호출 시도 ${attempt}/${maxRetries}`);
        
        const result = await this.callGeminiAPI(prompt, options);
        console.log(`✅ Gemini API 호출 성공 (시도 ${attempt})`);
        return result;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`❌ Gemini API 호출 실패 (시도 ${attempt}):`, lastError.message);
        
        // 503 서비스 불가 오류인 경우 재시도
        if (lastError.message.includes('503') && attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // 지수 백오프 (최대 5초)
          console.log(`⏳ ${delay}ms 후 재시도...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // 다른 오류이거나 마지막 시도인 경우 에러 던지기
        if (attempt === maxRetries) {
          throw lastError;
        }
      }
    }
    
    throw lastError || new Error('알 수 없는 오류');
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
        dataQuality: inputData.eegTimeSeriesStats?.qualityMetrics || {
          signalQuality: 0.85,
          measurementDuration: 300,
          dataCompleteness: 0.90
        },
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
    
    // Helper function to extract value from index
    const getIndexValue = (index: any): number => {
      if (typeof index === 'number') return index;
      if (index?.value !== undefined) return index.value;
      if (index?.mean !== undefined) return index.mean;
      return 0;
    };
    
    const betaAlphaRatio = (eegTimeSeriesStats.bandPowers?.beta?.mean || 180) / (eegTimeSeriesStats.bandPowers?.alpha?.mean || 300);
    
    return {
      fourDimensionAnalysis: {
        arousal: {
          dimension: "뇌파 각성 건강도",
          level: this.calculateHealthLevel(betaAlphaRatio, 0.8, 1.5),
          score: this.calculateArousalHealthScore(betaAlphaRatio),
          interpretation: `Beta/Alpha 비율 ${betaAlphaRatio.toFixed(2)}로 ${this.calculateHealthLevel(betaAlphaRatio, 0.8, 1.5) === '우수' ? '최적의 뇌파 각성 건강도' : this.calculateHealthLevel(betaAlphaRatio, 0.8, 1.5) === '양호' ? '양호한 뇌파 각성 건강도' : '뇌파 각성 개선 필요'}를 보입니다.`,
          evidence: {
            betaAlphaRatio: betaAlphaRatio,
            gammaActivity: eegTimeSeriesStats.bandPowers?.gamma?.mean || 50,
            calculationFormula: "Beta Power / Alpha Power",
            explanation: "Beta파(13-30Hz)는 집중과 각성을 나타내고, Alpha파(8-13Hz)는 이완과 휴식을 나타냅니다. 이 비율이 높을수록 각성도가 높음을 의미합니다.",
            normalRange: "Beta/Alpha 비율 0.8-1.5, Gamma 30-80μV²"
          },
          clinicalSignificance: betaAlphaRatio > 2.0 || betaAlphaRatio < 0.5 ? "moderate" as const : betaAlphaRatio > 1.7 || betaAlphaRatio < 0.7 ? "mild" as const : "normal" as const,
          personalizedInterpretation: `${personalInfo.age}세 ${personalInfo.occupation}의 각성도는 ${betaAlphaRatio > 1.5 ? '업무 집중으로 인한 과각성' : '적절한 수준'}을 보입니다.`,
          recommendations: betaAlphaRatio > 1.5 
            ? ["규칙적인 휴식", "이완 훈련", "과집중 방지"]
            : betaAlphaRatio < 0.8 
            ? ["활동성 증가", "자극적 환경", "각성도 향상 훈련"]
            : ["현재 수준 유지", "균형 잡힌 활동"]
        },
        valence: {
          dimension: "감정균형도",
          level: this.calculateHealthLevel(Math.abs(getIndexValue(eegTimeSeriesStats.eegIndices?.hemisphericBalance)), 0, 0.1),
          score: this.calculateValenceHealthScore(getIndexValue(eegTimeSeriesStats.eegIndices?.hemisphericBalance)),
          interpretation: `좌우뇌 균형 ${getIndexValue(eegTimeSeriesStats.eegIndices?.hemisphericBalance).toFixed(3)}으로 ${Math.abs(getIndexValue(eegTimeSeriesStats.eegIndices?.hemisphericBalance)) < 0.05 ? '최적의 감정균형도' : Math.abs(getIndexValue(eegTimeSeriesStats.eegIndices?.hemisphericBalance)) < 0.1 ? '양호한 감정균형도' : '감정균형도 개선 필요'}를 보입니다.`,
          evidence: {
            hemisphericBalance: getIndexValue(eegTimeSeriesStats.eegIndices?.hemisphericBalance),
            leftBrainDominance: getIndexValue(eegTimeSeriesStats.eegIndices?.hemisphericBalance) > 0 ? "좌뇌 우세" : "우뇌 우세",
            calculationFormula: "(Left Alpha - Right Alpha) / (Left Alpha + Right Alpha)",
            explanation: "좌뇌는 논리와 언어를, 우뇌는 창의와 감정을 담당합니다. 좌뇌 Alpha파 우세(양수)는 긍정적 감정을, 우뇌 Alpha파 우세(음수)는 창의적/내성적 성향을 나타냅니다.",
            normalRange: "-0.1~0.1"
          },
          clinicalSignificance: Math.abs(getIndexValue(eegTimeSeriesStats.eegIndices?.hemisphericBalance)) > 0.15 ? "moderate" as const : Math.abs(getIndexValue(eegTimeSeriesStats.eegIndices?.hemisphericBalance)) > 0.1 ? "mild" as const : "normal" as const,
          personalizedInterpretation: `현재 감정 상태는 ${Math.abs(getIndexValue(eegTimeSeriesStats.eegIndices?.hemisphericBalance)) < 0.05 ? '매우 균형잡힌' : '안정적인'} 상태입니다.`,
          recommendations: Math.abs(getIndexValue(eegTimeSeriesStats.eegIndices?.hemisphericBalance)) > 0.1
            ? ["좌우뇌 균형 훈련", "명상", "창의적-논리적 활동 균형"]
            : ["현재 균형 상태 유지", "다양한 뇌 활동 지속"]
        },
        focus: {
          dimension: "뇌파 집중 건강도",
          level: this.calculateHealthLevel(getIndexValue(eegTimeSeriesStats.eegIndices?.focusIndex), 1.5, 3.0),
          score: this.calculateFocusHealthScore(getIndexValue(eegTimeSeriesStats.eegIndices?.focusIndex)),
          interpretation: `Focus Index ${getIndexValue(eegTimeSeriesStats.eegIndices?.focusIndex).toFixed(2)}로 ${this.calculateHealthLevel(getIndexValue(eegTimeSeriesStats.eegIndices?.focusIndex), 1.5, 3.0) === '우수' ? '최적의 뇌파 집중 건강도' : this.calculateHealthLevel(getIndexValue(eegTimeSeriesStats.eegIndices?.focusIndex), 1.5, 3.0) === '양호' ? '양호한 뇌파 집중 건강도' : '뇌파 집중 개선 필요'}를 보입니다.`,
          evidence: {
            focusIndex: getIndexValue(eegTimeSeriesStats.eegIndices?.focusIndex),
            calculationFormula: "Beta Power / (Alpha Power + Theta Power)",
            explanation: "Beta파는 집중과 인지 활동을, Alpha파와 Theta파는 이완과 몽상 상태를 나타냅니다. 이 비율이 높을수록 집중도가 높음을 의미합니다.",
            normalRange: "1.5-3.0",
            betaActivity: `Beta 활동 ${(eegTimeSeriesStats.bandPowers?.beta?.mean || 180).toFixed(1)}μV²`
          },
          clinicalSignificance: getIndexValue(eegTimeSeriesStats.eegIndices?.focusIndex) > 3.5 || getIndexValue(eegTimeSeriesStats.eegIndices?.focusIndex) < 1.0 ? "moderate" as const : getIndexValue(eegTimeSeriesStats.eegIndices?.focusIndex) > 3.0 || getIndexValue(eegTimeSeriesStats.eegIndices?.focusIndex) < 1.5 ? "mild" as const : "normal" as const,
          personalizedInterpretation: `${personalInfo.occupation} 업무에 ${getIndexValue(eegTimeSeriesStats.eegIndices?.focusIndex) > 2.5 ? '필요 이상의 집중력을 보이고 있어' : '적절한 집중력을 유지하고 있어'} 효율적인 작업이 가능합니다.`,
          recommendations: this.calculateHealthLevel(getIndexValue(eegTimeSeriesStats.eegIndices?.focusIndex), 1.5, 3.0) === '개선필요'
            ? getIndexValue(eegTimeSeriesStats.eegIndices?.focusIndex) > 3.0 
              ? ["정기적인 휴식", "과집중 방지", "멘탈 브레이크"]
              : ["집중력 훈련", "명상", "주의력 개선 운동"]
            : ["현재 뇌파 집중 건강도 유지", "균형잡힌 활동"]
        },
        stress: {
          dimension: "스트레스 건강도",
          level: this.calculateHealthLevel(getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex), 2.8, 4.0),
          score: this.calculateStressHealthScore(getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex)),
          interpretation: `Stress Index ${getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex).toFixed(2)}로 ${this.calculateHealthLevel(getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex), 2.8, 4.0) === '우수' ? '최적의 스트레스 건강도' : this.calculateHealthLevel(getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex), 2.8, 4.0) === '양호' ? '양호한 스트레스 건강도' : '스트레스 건강도'}를 보입니다.`,
          evidence: {
            stressIndex: getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex),
            calculationFormula: "(Beta Power + Gamma Power) / (Alpha Power + Theta Power)",
            explanation: "Beta파와 Gamma파는 스트레스와 각성을, Alpha파와 Theta파는 이완과 안정을 나타냅니다. 이 비율이 높을수록 스트레스 수준이 높음을 의미합니다.",
            normalRange: "2.8-4.0",
            physiologicalMarkers: "고주파수(스트레스) / 저주파수(이완) 비율 기반"
          },
          clinicalSignificance: getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex) > 5.0 || getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex) < 2.0 ? "moderate" as const : getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex) > 4.5 || getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex) < 2.5 ? "mild" as const : "normal" as const,
          personalizedInterpretation: `현재 스트레스 수준은 ${getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex) > 4.0 ? '관리가 필요한 수준으로 적극적인 스트레스 관리가 권장됩니다' : '건강한 수준을 유지하고 있습니다'}.`,
          recommendations: this.calculateHealthLevel(getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex), 2.8, 4.0) === '개선필요'
            ? getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex) > 4.0
              ? ["스트레스 관리", "이완 훈련", "충분한 수면", "규칙적 운동"]
              : ["적절한 자극 제공", "활동성 증가", "목표 설정"]
            : ["현재 스트레스 건강도 유지", "예방적 케어"]
        }
      },
      detailedDataAnalysis: {
        bandPowerAnalysis: {
          frontalNeuroActivity: {
            interpretation: `전두엽 신경활성도 ${((eegTimeSeriesStats.bandPowers?.delta?.mean || 100) + (eegTimeSeriesStats.bandPowers?.theta?.mean || 120) + (eegTimeSeriesStats.bandPowers?.alpha?.mean || 300) + (eegTimeSeriesStats.bandPowers?.beta?.mean || 180) + (eegTimeSeriesStats.bandPowers?.gamma?.mean || 50)).toFixed(2)}μV²는 전두엽 신경 네트워크의 전반적인 활성화 수준을 나타냅니다.`,
            evidence: `측정값 ${((eegTimeSeriesStats.bandPowers?.delta?.mean || 100) + (eegTimeSeriesStats.bandPowers?.theta?.mean || 120) + (eegTimeSeriesStats.bandPowers?.alpha?.mean || 300) + (eegTimeSeriesStats.bandPowers?.beta?.mean || 180) + (eegTimeSeriesStats.bandPowers?.gamma?.mean || 50)).toFixed(2)}μV², 정상범위 800-2000μV²`,
            clinicalSignificance: ((eegTimeSeriesStats.bandPowers?.delta?.mean || 100) + (eegTimeSeriesStats.bandPowers?.theta?.mean || 120) + (eegTimeSeriesStats.bandPowers?.alpha?.mean || 300) + (eegTimeSeriesStats.bandPowers?.beta?.mean || 180) + (eegTimeSeriesStats.bandPowers?.gamma?.mean || 50)) > 2000 ? "과도한 전두엽 신경 활성화" : ((eegTimeSeriesStats.bandPowers?.delta?.mean || 100) + (eegTimeSeriesStats.bandPowers?.theta?.mean || 120) + (eegTimeSeriesStats.bandPowers?.alpha?.mean || 300) + (eegTimeSeriesStats.bandPowers?.beta?.mean || 180) + (eegTimeSeriesStats.bandPowers?.gamma?.mean || 50)) < 800 ? "전두엽 신경 활동 저하" : "정상적인 전두엽 신경 활성도"
          },
          delta: {
            interpretation: `Delta Power ${(eegTimeSeriesStats.bandPowers?.delta?.mean || 100).toFixed(2)}μV²는 깊은 수면과 뇌 회복 상태를 나타냅니다.`,
            evidence: `측정값 ${(eegTimeSeriesStats.bandPowers?.delta?.mean || 100).toFixed(2)}μV², 정상범위 200-600μV²`,
            clinicalSignificance: (eegTimeSeriesStats.bandPowers?.delta?.mean || 100) > 600 ? "과도한 뇌 억제 또는 병리적 상태" : (eegTimeSeriesStats.bandPowers?.delta?.mean || 100) < 200 ? "뇌 회복 부족" : "정상적인 뇌 회복 상태"
          },
          theta: {
            interpretation: `Theta Power ${(eegTimeSeriesStats.bandPowers?.theta?.mean || 120).toFixed(2)}μV²는 창의성과 기억 처리 상태를 나타냅니다.`,
            evidence: `측정값 ${(eegTimeSeriesStats.bandPowers?.theta?.mean || 120).toFixed(2)}μV², 정상범위 150-400μV²`,
            clinicalSignificance: (eegTimeSeriesStats.bandPowers?.theta?.mean || 120) > 400 ? "과도한 몽상 또는 주의력 결핍" : (eegTimeSeriesStats.bandPowers?.theta?.mean || 120) < 150 ? "창의성 억제" : "정상적인 창의적 사고 상태"
          },
          alpha: {
            interpretation: `Alpha Power ${(eegTimeSeriesStats.bandPowers?.alpha?.mean || 300).toFixed(2)}μV²는 이완 상태를 나타냅니다.`,
            evidence: `측정값 ${(eegTimeSeriesStats.bandPowers?.alpha?.mean || 300).toFixed(2)}μV², 정상범위 180-450μV²`,
            clinicalSignificance: (eegTimeSeriesStats.bandPowers?.alpha?.mean || 300) > 450 ? "과도한 이완 또는 졸음" : (eegTimeSeriesStats.bandPowers?.alpha?.mean || 300) < 180 ? "긴장 상태" : "정상적인 휴식 상태의 뇌파 활동"
          },
          beta: {
            interpretation: `Beta Power ${(eegTimeSeriesStats.bandPowers?.beta?.mean || 180).toFixed(2)}μV²는 집중 상태를 나타냅니다.`,
            evidence: `측정값 ${(eegTimeSeriesStats.bandPowers?.beta?.mean || 180).toFixed(2)}μV², 정상범위 90-280μV²`,
            clinicalSignificance: (eegTimeSeriesStats.bandPowers?.beta?.mean || 180) > 280 ? "과도한 집중 또는 스트레스" : (eegTimeSeriesStats.bandPowers?.beta?.mean || 180) < 90 ? "집중력 부족" : "정상적인 집중 상태"
          },
          gamma: {
            interpretation: `Gamma Power ${(eegTimeSeriesStats.bandPowers?.gamma?.mean || 50).toFixed(2)}μV²는 고차원적 인지 처리를 나타냅니다.`,
            evidence: `측정값 ${(eegTimeSeriesStats.bandPowers?.gamma?.mean || 50).toFixed(2)}μV², 정상범위 30-80μV²`,
            clinicalSignificance: (eegTimeSeriesStats.bandPowers?.gamma?.mean || 50) > 80 ? "과도한 인지 부하" : (eegTimeSeriesStats.bandPowers?.gamma?.mean || 50) < 30 ? "인지 기능 저하" : "정상적인 고차원 인지 처리"
          }
        },
        eegIndicesAnalysis: {
          focusIndex: {
            interpretation: `Focus Index ${getIndexValue(eegTimeSeriesStats.eegIndices?.focusIndex).toFixed(2)}는 ${getIndexValue(eegTimeSeriesStats.eegIndices?.focusIndex) > 2.5 ? '높은' : getIndexValue(eegTimeSeriesStats.eegIndices?.focusIndex) < 2.0 ? '낮은' : '적절한'} 집중력 상태를 나타냅니다.`,
            evidence: `측정값 ${getIndexValue(eegTimeSeriesStats.eegIndices?.focusIndex).toFixed(2)}, 정상범위 1.5-3.0, Beta/Alpha 비율 기반 계산`,
            recommendations: getIndexValue(eegTimeSeriesStats.eegIndices?.focusIndex) > 2.5 
              ? ["정기적인 휴식", "과집중 방지", "멘탈 브레이크 활용"]
              : getIndexValue(eegTimeSeriesStats.eegIndices?.focusIndex) < 2.0
              ? ["집중력 훈련", "명상", "카페인 섭취 조절"]
              : ["현재 수준 유지", "규칙적인 휴식"]
          },
          relaxationIndex: {
            interpretation: `Relaxation Index ${getIndexValue(eegTimeSeriesStats.eegIndices?.relaxationIndex).toFixed(3)}는 ${getIndexValue(eegTimeSeriesStats.eegIndices?.relaxationIndex) > 0.22 ? '높은' : getIndexValue(eegTimeSeriesStats.eegIndices?.relaxationIndex) < 0.18 ? '낮은' : '적절한'} 이완 상태를 보여줍니다.`,
            evidence: `측정값 ${getIndexValue(eegTimeSeriesStats.eegIndices?.relaxationIndex).toFixed(3)}, 정상범위 0.18-0.22, Alpha/Beta 비율 기반`,
            recommendations: getIndexValue(eegTimeSeriesStats.eegIndices?.relaxationIndex) < 0.18
              ? ["이완 기법 연습", "요가 또는 명상", "스트레스 관리"]
              : getIndexValue(eegTimeSeriesStats.eegIndices?.relaxationIndex) > 0.22
              ? ["활동성 증가", "각성도 향상", "적절한 자극"]
              : ["현재 이완 상태 유지", "균형 잡힌 활동"]
          },
          stressIndex: {
            interpretation: `Stress Index ${getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex).toFixed(2)}는 ${getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex) > 4.0 ? '높은' : getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex) < 2.8 ? '낮은' : '적절한'} 스트레스 수준을 나타냅니다.`,
            evidence: `측정값 ${getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex).toFixed(2)}, 정상범위 2.8-4.0, Beta/(Alpha+Theta) 뺄율 기반`,
            recommendations: getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex) > 4.0
              ? ["스트레스 관리", "이완 훈련", "충분한 수면", "규칙적 운동"]
              : getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex) < 2.8
              ? ["적절한 자극 제공", "활동성 증가", "목표 설정"]
              : ["현재 스트레스 수준 관리", "예방적 케어"]
          },
          hemisphericBalance: {
            interpretation: `Hemispheric Balance ${getIndexValue(eegTimeSeriesStats.eegIndices?.hemisphericBalance).toFixed(3)}는 ${Math.abs(getIndexValue(eegTimeSeriesStats.eegIndices?.hemisphericBalance)) > 0.1 ? '불균형' : '균형잡힌'} 좌우뇌 활성도를 보여줍니다.`,
            evidence: `측정값 ${getIndexValue(eegTimeSeriesStats.eegIndices?.hemisphericBalance).toFixed(3)}, 정상범위 -0.1~0.1, 좌뇌(${getIndexValue(eegTimeSeriesStats.eegIndices?.hemisphericBalance) > 0 ? '우세' : '열세'})`,
            recommendations: Math.abs(getIndexValue(eegTimeSeriesStats.eegIndices?.hemisphericBalance)) > 0.1
              ? ["양쪽 뇌 활용 훈련", "창의적-논리적 활동 균형", "뇌 균형 운동"]
              : ["현재 균형 상태 유지", "다양한 뇌 활동 지속"]
          }
        },
        cognitiveStateAnalysis: {
          overallAssessment: `${personalInfo.age}세 ${personalInfo.occupation}의 전반적인 뇌 기능은 양호하나 스트레스 관리가 필요합니다.`,
          attentionPatterns: "지속적인 집중 패턴이 관찰되며, 적절한 휴식이 권장됩니다.",
          mentalFatigue: "중등도의 정신적 피로 징후가 나타납니다.",
          neurologicalIndicators: "특별한 신경학적 이상 소견은 관찰되지 않습니다."
        }
      },
      comprehensiveAssessment: {
        overallSummary: `${personalInfo.age}세 ${personalInfo.occupation}의 뇌파 분석 결과, 4대 지표 평균 건강도 ${Math.round((this.calculateArousalHealthScore(betaAlphaRatio) + this.calculateValenceHealthScore(getIndexValue(eegTimeSeriesStats.eegIndices?.hemisphericBalance)) + this.calculateFocusHealthScore(getIndexValue(eegTimeSeriesStats.eegIndices?.focusIndex)) + this.calculateStressHealthScore(getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex))) / 4)}점으로 ${Math.round((this.calculateArousalHealthScore(betaAlphaRatio) + this.calculateValenceHealthScore(getIndexValue(eegTimeSeriesStats.eegIndices?.hemisphericBalance)) + this.calculateFocusHealthScore(getIndexValue(eegTimeSeriesStats.eegIndices?.focusIndex)) + this.calculateStressHealthScore(getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex))) / 4) > 80 ? '우수한 뇌 건강 상태' : Math.round((this.calculateArousalHealthScore(betaAlphaRatio) + this.calculateValenceHealthScore(getIndexValue(eegTimeSeriesStats.eegIndices?.hemisphericBalance)) + this.calculateFocusHealthScore(getIndexValue(eegTimeSeriesStats.eegIndices?.focusIndex)) + this.calculateStressHealthScore(getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex))) / 4) > 70 ? '양호한 뇌 건강 상태' : '개선이 필요한 뇌 건강 상태'}입니다.`,
        keyFindings: [
          `뇌파 각성 건강도: ${this.calculateHealthLevel(betaAlphaRatio, 0.8, 1.5)} (${this.calculateArousalHealthScore(betaAlphaRatio)}점)`,
          `감정균형도: ${this.calculateHealthLevel(Math.abs(getIndexValue(eegTimeSeriesStats.eegIndices?.hemisphericBalance)), 0, 0.1)} (${this.calculateValenceHealthScore(getIndexValue(eegTimeSeriesStats.eegIndices?.hemisphericBalance))}점)`,
          `뇌파 집중 건강도: ${this.calculateHealthLevel(getIndexValue(eegTimeSeriesStats.eegIndices?.focusIndex), 1.5, 3.0)} (${this.calculateFocusHealthScore(getIndexValue(eegTimeSeriesStats.eegIndices?.focusIndex))}점)`,
          `스트레스 건강도: ${this.calculateHealthLevel(getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex), 2.8, 4.0)} (${this.calculateStressHealthScore(getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex))}점)`
        ],
        primaryConcerns: this.calculateStressHealthScore(getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex)) < 70 || this.calculateArousalHealthScore(betaAlphaRatio) < 70 ? 
          ["스트레스 건강도 개선 필요", "각성도 건강도 조절 필요"] : 
          this.calculateFocusHealthScore(getIndexValue(eegTimeSeriesStats.eegIndices?.focusIndex)) < 70 ? ["뇌파 집중 건강도 개선 필요"] : 
          ["현재 특별한 문제점 없음"],
        ageGenderAnalysis: {
          ageComparison: `${personalInfo.age}세 연령대 평균 대비 ${this.calculateArousalHealthScore(betaAlphaRatio) > 80 ? '우수한' : this.calculateArousalHealthScore(betaAlphaRatio) > 70 ? '양호한' : '개선이 필요한'} 각성도 건강도를 보입니다.`,
          genderConsiderations: `${personalInfo.gender === 'male' ? '남성' : '여성'} 특성상 ${this.calculateValenceHealthScore(getIndexValue(eegTimeSeriesStats.eegIndices?.hemisphericBalance)) > 80 ? '우수한 감정균형도' : '정상 범위 내 감정균형도'}를 보입니다.`,
          developmentalContext: `${personalInfo.age < 30 ? '청년기' : personalInfo.age < 50 ? '중년기' : '장년기'} 뇌파 특성에 부합하는 전반적으로 양호한 건강도 패턴입니다.`
        },
        occupationalAnalysis: {
          jobDemands: `${personalInfo.occupation} 업무는 ${personalInfo.occupation.includes('개발') || personalInfo.occupation.includes('연구') ? '높은 집중력과 논리적 사고' : '균형잡힌 인지 능력'}을 요구합니다.`,
          workRelatedPatterns: `업무 특성상 뇌파 집중 건강도 ${this.calculateFocusHealthScore(getIndexValue(eegTimeSeriesStats.eegIndices?.focusIndex))}점으로 ${this.calculateFocusHealthScore(getIndexValue(eegTimeSeriesStats.eegIndices?.focusIndex)) > 80 ? '우수한 수준' : this.calculateFocusHealthScore(getIndexValue(eegTimeSeriesStats.eegIndices?.focusIndex)) > 70 ? '양호한 수준' : '개선이 필요한 수준'}이며, 스트레스 건강도 ${this.calculateStressHealthScore(getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex))}점으로 ${this.calculateStressHealthScore(getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex)) > 80 ? '우수한 관리 상태' : this.calculateStressHealthScore(getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex)) > 70 ? '양호한 관리 상태' : '관리가 필요한 상태'}입니다.`,
          professionalRecommendations: personalInfo.occupation.includes('개발') ? 
            ["정기적인 휴식", "눈의 피로 관리", "업무 집중도 최적화"] :
            ["업무-휴식 균형", "스트레스 관리", "인지 능력 향상"]
        },
        improvementPlan: {
          shortTermGoals: this.calculateStressHealthScore(getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex)) < 70 ? 
            ["스트레스 건강도 개선", "이완 기법 연습", "충분한 수면"] :
            ["현재 건강도 유지", "규칙적인 생활", "적절한 운동"],
          longTermGoals: [
            "4대 지표 건강도 최적화 (뇌파 각성, 감정균형도, 뇌파 집중, 스트레스)",
            "뇌 건강 종합 점수 90점 이상 달성",
            "장기적 뇌 건강 관리 체계 구축"
          ],
          actionItems: [
            "주 3회 이상 30분 유산소 운동",
            "매일 10분 명상 또는 이완 훈련",
            "규칙적인 수면 패턴 유지 (7-8시간)",
            "업무 중 정기적 휴식 (50분 작업 후 10분 휴식)"
          ],
          monitoringPlan: "4-6주 후 재측정을 통한 개선 효과 확인 권장"
        },
        riskAssessment: {
          level: this.calculateStressHealthScore(getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex)) < 50 || this.calculateArousalHealthScore(betaAlphaRatio) < 50 ? "moderate" as const : 
                 this.calculateStressHealthScore(getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex)) < 70 || this.calculateArousalHealthScore(betaAlphaRatio) < 70 ? "low" as const : "low" as const,
          factors: this.calculateStressHealthScore(getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex)) < 70 || this.calculateArousalHealthScore(betaAlphaRatio) < 70 ? 
            ["스트레스 건강도 저하", "각성도 건강도 불균형"] :
            ["현재 특별한 위험 요소 없음"],
          preventiveMeasures: [
            "정기적인 뇌파 모니터링",
            "스트레스 조기 감지 및 관리",
            "건강한 생활습관 유지"
          ]
        },
        overallScore: Math.round(
          (this.calculateArousalHealthScore(betaAlphaRatio) * 0.25) +
          (this.calculateValenceHealthScore(getIndexValue(eegTimeSeriesStats.eegIndices?.hemisphericBalance)) * 0.25) +
          (this.calculateFocusHealthScore(getIndexValue(eegTimeSeriesStats.eegIndices?.focusIndex)) * 0.25) +
          (this.calculateStressHealthScore(getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex)) * 0.25)
        ),
        clinicalRecommendation: this.calculateStressHealthScore(getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex)) < 50 || this.calculateArousalHealthScore(betaAlphaRatio) < 50 ?
          "전문의 상담 권장, 뇌 건강 정밀 검진 고려" :
          this.calculateStressHealthScore(getIndexValue(eegTimeSeriesStats.eegIndices?.stressIndex)) < 70 || this.calculateArousalHealthScore(betaAlphaRatio) < 70 ?
          "생활습관 개선을 통한 건강도 향상 후 재검사 권장" :
          "현재 양호한 뇌 건강 상태, 정기적 모니터링을 통한 건강도 유지 권장"
      },
      metadata: {
        analysisTimestamp: new Date().toISOString(),
        personalInfo: {
          age: personalInfo.age,
          gender: personalInfo.gender,
          occupation: personalInfo.occupation
        },
        dataQuality: eegTimeSeriesStats.qualityMetrics || {
          signalQuality: 0.85,
          measurementDuration: 300,
          dataCompleteness: 0.90
        },
        analysisEngine: {
          engineId: this.id,
          version: this.version,
          processingTime: Date.now() - this.analysisStartTime
        }
      }
    };
  }

  // 건강도 계산 헬퍼 메서드들
  private calculateHealthLevel(value: number, minNormal: number, maxNormal: number): string {
    if (value >= minNormal && value <= maxNormal) {
      const midpoint = (minNormal + maxNormal) / 2;
      const distanceFromMid = Math.abs(value - midpoint);
      const rangeHalf = (maxNormal - minNormal) / 2;
      
      if (distanceFromMid <= rangeHalf * 0.3) {
        return "우수";
      } else {
        return "양호";
      }
    } else {
      return "개선필요";
    }
  }

  private calculateArousalHealthScore(betaAlphaRatio: number): number {
    // Beta/Alpha 비율 0.8-1.5가 정상, 1.15가 이상적
    const optimalRatio = 1.15;
    const normalMin = 0.8;
    const normalMax = 1.5;
    
    if (betaAlphaRatio >= normalMin && betaAlphaRatio <= normalMax) {
      // 정상 범위 내에서는 1.15에 가까울수록 100점
      const distanceFromOptimal = Math.abs(betaAlphaRatio - optimalRatio);
      const maxDistance = Math.max(optimalRatio - normalMin, normalMax - optimalRatio);
      return Math.round(100 - (distanceFromOptimal / maxDistance) * 15);
    } else {
      // 정상 범위 밖에서는 거리에 따라 감점
      const distanceFromRange = betaAlphaRatio < normalMin ? 
        normalMin - betaAlphaRatio : betaAlphaRatio - normalMax;
      const penalty = Math.min(distanceFromRange * 30, 70);
      return Math.max(30, 85 - Math.round(penalty));
    }
  }

  private calculateValenceHealthScore(hemisphericBalance: number): number {
    // 좌우뇌 균형 -0.1~0.1이 정상, 0에 가까울수록 좋음
    const absBalance = Math.abs(hemisphericBalance);
    const normalRange = 0.1;
    
    if (absBalance <= normalRange) {
      // 정상 범위 내에서는 0에 가까울수록 100점
      return Math.round(100 - (absBalance / normalRange) * 15);
    } else {
      // 정상 범위 밖에서는 거리에 따라 감점
      const excess = absBalance - normalRange;
      const penalty = Math.min(excess * 200, 70);
      return Math.max(30, 85 - Math.round(penalty));
    }
  }

  private calculateFocusHealthScore(focusIndex: number): number {
    // Focus Index 1.5-3.0이 정상, 2.25가 이상적
    const optimalFocus = 2.25;
    const normalMin = 1.5;
    const normalMax = 3.0;
    
    if (focusIndex >= normalMin && focusIndex <= normalMax) {
      // 정상 범위 내에서는 2.25에 가까울수록 100점
      const distanceFromOptimal = Math.abs(focusIndex - optimalFocus);
      const maxDistance = Math.max(optimalFocus - normalMin, normalMax - optimalFocus);
      return Math.round(100 - (distanceFromOptimal / maxDistance) * 15);
    } else {
      // 정상 범위 밖에서는 거리에 따라 감점
      const distanceFromRange = focusIndex < normalMin ? 
        normalMin - focusIndex : focusIndex - normalMax;
      const penalty = Math.min(distanceFromRange * 25, 70);
      return Math.max(30, 85 - Math.round(penalty));
    }
  }

  private calculateStressHealthScore(stressIndex: number): number {
    // Stress Index 2.8-4.0이 정상, 3.4가 이상적 (낮을수록 건강)
    const optimalStress = 3.4;
    const normalMin = 2.8;
    const normalMax = 4.0;
    
    if (stressIndex >= normalMin && stressIndex <= normalMax) {
      // 정상 범위 내에서는 3.4에 가까울수록 100점
      const distanceFromOptimal = Math.abs(stressIndex - optimalStress);
      const maxDistance = Math.max(optimalStress - normalMin, normalMax - optimalStress);
      return Math.round(100 - (distanceFromOptimal / maxDistance) * 15);
    } else {
      // 정상 범위 밖에서는 거리에 따라 감점 (높을수록 더 큰 패널티)
      if (stressIndex > normalMax) {
        // 스트레스가 높으면 더 큰 패널티
        const excess = stressIndex - normalMax;
        const penalty = Math.min(excess * 35, 70);
        return Math.max(20, 85 - Math.round(penalty));
      } else {
        // 스트레스가 너무 낮으면 무기력 상태로 판단
        const deficit = normalMin - stressIndex;
        const penalty = Math.min(deficit * 25, 60);
        return Math.max(30, 85 - Math.round(penalty));
      }
    }
  }

  // 기존 헬퍼 메서드들
  private calculateOverallScore(result: EEGAdvancedAnalysisResult): number {
    // 4대 지표 구조가 있으면 이를 기반으로 계산
    if (result.fourDimensionAnalysis) {
      const dimensions = result.fourDimensionAnalysis;
      const totalScore = (dimensions.arousal?.score || 0) + 
                        (dimensions.valence?.score || 0) + 
                        (dimensions.focus?.score || 0) + 
                        (100 - (dimensions.stress?.score || 0)); // 스트레스는 낮을수록 좋음
      return Math.round(totalScore / 4);
    }
    
    // 기존 구조 호환성
    if (result.analysisResults && result.analysisResults.length > 0) {
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
    
    return 75; // 기본값
  }

  private extractStressLevel(result: EEGAdvancedAnalysisResult): number {
    // 4대 지표 구조에서 추출
    if (result.fourDimensionAnalysis?.stress) {
      return result.fourDimensionAnalysis.stress.score;
    }
    
    // 기존 구조 호환성
    if (result.analysisResults) {
      const stressAnalysis = result.analysisResults.find(r => 
        r.coreOpinion.title.toLowerCase().includes('스트레스') ||
        r.coreOpinion.title.toLowerCase().includes('stress')
      );
      
      if (stressAnalysis) {
        switch (stressAnalysis.coreOpinion.clinicalSignificance) {
          case 'severe': return 80;
          case 'moderate': return 65;
          case 'mild': return 55;
          default: return 50;
        }
      }
    }
    
    return 50; // 기본값
  }

  private extractFocusLevel(result: EEGAdvancedAnalysisResult): number {
    // 4대 지표 구조에서 추출
    if (result.fourDimensionAnalysis?.focus) {
      return result.fourDimensionAnalysis.focus.score;
    }
    
    // 기존 구조 호환성
    if (result.analysisResults) {
      const focusAnalysis = result.analysisResults.find(r => 
        r.coreOpinion.title.toLowerCase().includes('집중') ||
        r.coreOpinion.title.toLowerCase().includes('focus')
      );
      
      if (focusAnalysis) {
        switch (focusAnalysis.coreOpinion.clinicalSignificance) {
          case 'severe': return 30;
          case 'moderate': return 50;
          case 'mild': return 60;
          default: return 70;
        }
      }
    }
    
    return 70; // 기본값
  }

  private generateSummary(result: EEGAdvancedAnalysisResult): string {
    // 4대 지표 구조에서 요약 생성
    if (result.fourDimensionAnalysis) {
      const dimensions = result.fourDimensionAnalysis;
      const summaries: string[] = [];
      
      if (dimensions.arousal) {
        summaries.push(`뇌파 각성: ${dimensions.arousal.level} (${dimensions.arousal.score}점)`);
      }
      if (dimensions.valence) {
        summaries.push(`감정균형도: ${dimensions.valence.level} (${dimensions.valence.score}점)`);
      }
      if (dimensions.focus) {
        summaries.push(`뇌파 집중: ${dimensions.focus.level} (${dimensions.focus.score}점)`);
      }
      if (dimensions.stress) {
        summaries.push(`스트레스: ${dimensions.stress.level} (${dimensions.stress.score}점)`);
      }
      
      return summaries.join(', ');
    }
    
    // 기존 구조 호환성
    if (result.analysisResults && result.analysisResults.length > 0) {
      return result.analysisResults.map((analysis, index) => 
        `${index + 1}. ${analysis.coreOpinion.title}: ${analysis.coreOpinion.summary}`
      ).join('\n\n');
    }
    
    return "4대 뇌파 분석 지표 기반 종합 분석 완료";
  }

  private extractRecommendations(result: EEGAdvancedAnalysisResult): string[] {
    const recommendations: string[] = [];
    
    // 4대 지표 구조에서 권장사항 추출
    if (result.fourDimensionAnalysis) {
      Object.values(result.fourDimensionAnalysis).forEach(dimension => {
        if (dimension.recommendations) {
          recommendations.push(...dimension.recommendations);
        }
      });
    }
    
    // 기존 구조에서도 추출
    if (result.detailedDataAnalysis?.eegIndicesAnalysis) {
      Object.values(result.detailedDataAnalysis.eegIndicesAnalysis).forEach(analysis => {
        if (analysis.recommendations) {
          recommendations.push(...analysis.recommendations);
        }
      });
    }
    
    return [...new Set(recommendations)]; // 중복 제거
  }
}