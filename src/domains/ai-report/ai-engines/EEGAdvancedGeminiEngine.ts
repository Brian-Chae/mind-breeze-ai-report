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
        console.log('🔍 EEG 지수 원본 데이터:', data.eegTimeSeriesStats.eegIndices);
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
              focusIndex: eegMetrics.focusIndex?.value || eegMetrics.focusIndex || 2.5,
              relaxationIndex: eegMetrics.relaxationIndex?.value || eegMetrics.relaxationIndex || 0.2,
              stressIndex: eegMetrics.stressIndex?.value || eegMetrics.stressIndex || 3.2,
              hemisphericBalance: eegMetrics.hemisphericBalance?.value || eegMetrics.hemisphericBalance || 0.05,
              cognitiveLoad: eegMetrics.cognitiveLoad?.value || eegMetrics.cognitiveLoad || 1.8,
              emotionalStability: eegMetrics.emotionalStability?.value || eegMetrics.emotionalStability || 0.75
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
            stressIndex: 3.2,
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

## 4대 뇌파 분석 지표

### 1. Arousal (뇌파 각성도)
- **Beta/Alpha Ratio**: ${(eegTimeSeriesStats.bandPowers.beta.mean / eegTimeSeriesStats.bandPowers.alpha.mean).toFixed(2)}
- **계산 공식**: Beta Power / Alpha Power
- **정상범위**: 0.8-1.5
- **해석**: 뇌의 전반적인 활성화 수준 (Beta파↑ = 각성도↑, Alpha파↑ = 이완상태)
- **임상적 의미**: 높으면 과각성, 낮으면 저각성 상태

### 2. Valence (감정균형도)  
- **Hemispheric Balance**: ${eegTimeSeriesStats.eegIndices.hemisphericBalance.toFixed(3)}
- **계산 공식**: (Left Alpha - Right Alpha) / (Left Alpha + Right Alpha)
- **정상범위**: -0.1 ~ 0.1
- **해석**: 좌우뇌 활성 균형 (양수=좌뇌우세/긍정적, 음수=우뇌우세/부정적)
- **임상적 의미**: 절댓값 0.1 초과시 감정 편향성 시사

### 3. Focus (뇌파 집중도)
- **Focus Index**: ${eegTimeSeriesStats.eegIndices.focusIndex.toFixed(2)}
- **계산 공식**: Beta Power / (Alpha Power + Theta Power)
- **정상범위**: 1.5-3.0
- **해석**: 주의력과 인지적 집중 능력 (Beta파=집중, Alpha+Theta파=이완/몽상)
- **임상적 의미**: 높으면 과집중, 낮으면 주의력 부족

### 4. Stress (스트레스 수준)
- **Stress Index**: ${eegTimeSeriesStats.eegIndices.stressIndex.toFixed(2)}
- **계산 공식**: (Beta Power + Gamma Power) / (Alpha Power + Theta Power)
- **정상범위**: 2.8-4.0
- **해석**: 정신적/신체적 스트레스 부하 (고주파수파=스트레스, 저주파수파=안정)
- **임상적 의미**: 높으면 스트레스 과부하, 낮으면 무기력 상태

### 보조 지표
- Relaxation Index: ${eegTimeSeriesStats.eegIndices.relaxationIndex.toFixed(2)} (정상범위: 0.18-0.22)
- Cognitive Load: ${eegTimeSeriesStats.eegIndices.cognitiveLoad.toFixed(2)} (인지 부하)
- Emotional Stability: ${eegTimeSeriesStats.eegIndices.emotionalStability.toFixed(2)} (정서 안정성)

## 데이터 품질
- 신호 품질: ${(eegTimeSeriesStats.qualityMetrics.signalQuality * 100).toFixed(1)}%
- 측정 시간: ${eegTimeSeriesStats.qualityMetrics.measurementDuration}초
- 데이터 완성도: ${(eegTimeSeriesStats.qualityMetrics.dataCompleteness * 100).toFixed(1)}%

## 분석 요청사항
위의 상세한 EEG 데이터를 바탕으로 다음 JSON 형식으로 4대 뇌파 분석 지표 중심의 의료급 분석 결과를 제공해주세요:

{
  "fourDimensionAnalysis": {
    "arousal": {
      "dimension": "뇌파 각성 건강도",
      "level": "우수|양호|개선필요",
      "score": 0-100,
      "interpretation": "뇌 활성화의 적절성 수준 해석 (100점에 가까울수록 건강한 각성 상태)",
      "evidence": {
        "betaAlphaRatio": ${(eegTimeSeriesStats.bandPowers.beta.mean / eegTimeSeriesStats.bandPowers.alpha.mean).toFixed(2)},
        "gammaActivity": ${eegTimeSeriesStats.bandPowers.gamma.mean.toFixed(2)},
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
        "hemisphericBalance": ${eegTimeSeriesStats.eegIndices.hemisphericBalance.toFixed(3)},
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
        "focusIndex": ${eegTimeSeriesStats.eegIndices.focusIndex.toFixed(2)},
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
        "stressIndex": ${eegTimeSeriesStats.eegIndices.stressIndex.toFixed(2)},
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
      "relaxationIndex": {"value": ${eegTimeSeriesStats.eegIndices.relaxationIndex.toFixed(2)}, "interpretation": "이완 상태 보조 지표"},
      "cognitiveLoad": {"value": ${eegTimeSeriesStats.eegIndices.cognitiveLoad.toFixed(2)}, "interpretation": "인지 부하 보조 지표"},
      "emotionalStability": {"value": ${eegTimeSeriesStats.eegIndices.emotionalStability.toFixed(2)}, "interpretation": "정서 안정성 보조 지표"}
    }
  },
  "comprehensiveAssessment": {
    "overallSummary": "4가지 축(Arousal, Valence, Focus, Stress)을 종합한 전체적인 뇌 기능 상태 평가",
    "keyFindings": ["주요 발견사항 1", "주요 발견사항 2", "주요 발견사항 3"],
    "primaryConcerns": ["주요 문제점이나 개선이 필요한 영역"],
    "ageGenderAnalysis": {
      "ageComparison": "${personalInfo.age}세 연령대 평균과 비교한 분석",
      "genderConsiderations": "${personalInfo.gender} 성별 특성을 고려한 해석",
      "developmentalContext": "연령대별 뇌파 특성과 정상 발달 범위 내 평가"
    },
    "occupationalAnalysis": {
      "jobDemands": "${personalInfo.occupation} 직업의 인지적 요구사항 분석",
      "workRelatedPatterns": "업무 스트레스 및 집중도 패턴 해석",
      "professionalRecommendations": "직업적 특성을 고려한 맞춤형 권장사항"
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
    "overallScore": "0-100점 범위의 종합 점수",
    "clinicalRecommendation": "전문의 상담 필요성 여부 및 추가 검사 권장사항"
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
    
    const betaAlphaRatio = eegTimeSeriesStats.bandPowers.beta.mean / eegTimeSeriesStats.bandPowers.alpha.mean;
    
    return {
      fourDimensionAnalysis: {
        arousal: {
          dimension: "뇌파 각성 건강도",
          level: this.calculateHealthLevel(betaAlphaRatio, 0.8, 1.5),
          score: this.calculateArousalHealthScore(betaAlphaRatio),
          interpretation: `Beta/Alpha 비율 ${betaAlphaRatio.toFixed(2)}로 ${this.calculateHealthLevel(betaAlphaRatio, 0.8, 1.5) === '우수' ? '최적의 뇌파 각성 건강도' : this.calculateHealthLevel(betaAlphaRatio, 0.8, 1.5) === '양호' ? '양호한 뇌파 각성 건강도' : '뇌파 각성 개선 필요'}를 보입니다.`,
          evidence: {
            betaAlphaRatio: betaAlphaRatio,
            gammaActivity: eegTimeSeriesStats.bandPowers.gamma.mean,
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
          level: this.calculateHealthLevel(Math.abs(eegTimeSeriesStats.eegIndices.hemisphericBalance), 0, 0.1),
          score: this.calculateValenceHealthScore(eegTimeSeriesStats.eegIndices.hemisphericBalance),
          interpretation: `좌우뇌 균형 ${eegTimeSeriesStats.eegIndices.hemisphericBalance.toFixed(3)}으로 ${Math.abs(eegTimeSeriesStats.eegIndices.hemisphericBalance) < 0.05 ? '최적의 감정균형도' : Math.abs(eegTimeSeriesStats.eegIndices.hemisphericBalance) < 0.1 ? '양호한 감정균형도' : '감정균형도 개선 필요'}를 보입니다.`,
          evidence: {
            hemisphericBalance: eegTimeSeriesStats.eegIndices.hemisphericBalance,
            leftBrainDominance: eegTimeSeriesStats.eegIndices.hemisphericBalance > 0 ? "좌뇌 우세" : "우뇌 우세",
            calculationFormula: "(Left Alpha - Right Alpha) / (Left Alpha + Right Alpha)",
            explanation: "좌뇌는 논리와 언어를, 우뇌는 창의와 감정을 담당합니다. 좌뇌 Alpha파 우세(양수)는 긍정적 감정을, 우뇌 Alpha파 우세(음수)는 창의적/내성적 성향을 나타냅니다.",
            normalRange: "-0.1~0.1"
          },
          clinicalSignificance: Math.abs(eegTimeSeriesStats.eegIndices.hemisphericBalance) > 0.15 ? "moderate" as const : Math.abs(eegTimeSeriesStats.eegIndices.hemisphericBalance) > 0.1 ? "mild" as const : "normal" as const,
          personalizedInterpretation: `현재 감정 상태는 ${Math.abs(eegTimeSeriesStats.eegIndices.hemisphericBalance) < 0.05 ? '매우 균형잡힌' : '안정적인'} 상태입니다.`,
          recommendations: Math.abs(eegTimeSeriesStats.eegIndices.hemisphericBalance) > 0.1
            ? ["좌우뇌 균형 훈련", "명상", "창의적-논리적 활동 균형"]
            : ["현재 균형 상태 유지", "다양한 뇌 활동 지속"]
        },
        focus: {
          dimension: "뇌파 집중 건강도",
          level: this.calculateHealthLevel(eegTimeSeriesStats.eegIndices.focusIndex, 1.5, 3.0),
          score: this.calculateFocusHealthScore(eegTimeSeriesStats.eegIndices.focusIndex),
          interpretation: `Focus Index ${eegTimeSeriesStats.eegIndices.focusIndex.toFixed(2)}로 ${this.calculateHealthLevel(eegTimeSeriesStats.eegIndices.focusIndex, 1.5, 3.0) === '우수' ? '최적의 뇌파 집중 건강도' : this.calculateHealthLevel(eegTimeSeriesStats.eegIndices.focusIndex, 1.5, 3.0) === '양호' ? '양호한 뇌파 집중 건강도' : '뇌파 집중 개선 필요'}를 보입니다.`,
          evidence: {
            focusIndex: eegTimeSeriesStats.eegIndices.focusIndex,
            calculationFormula: "Beta Power / (Alpha Power + Theta Power)",
            explanation: "Beta파는 집중과 인지 활동을, Alpha파와 Theta파는 이완과 몽상 상태를 나타냅니다. 이 비율이 높을수록 집중도가 높음을 의미합니다.",
            normalRange: "1.5-3.0",
            betaActivity: `Beta 활동 ${eegTimeSeriesStats.bandPowers.beta.mean.toFixed(1)}μV²`
          },
          clinicalSignificance: eegTimeSeriesStats.eegIndices.focusIndex > 3.5 || eegTimeSeriesStats.eegIndices.focusIndex < 1.0 ? "moderate" as const : eegTimeSeriesStats.eegIndices.focusIndex > 3.0 || eegTimeSeriesStats.eegIndices.focusIndex < 1.5 ? "mild" as const : "normal" as const,
          personalizedInterpretation: `${personalInfo.occupation} 업무에 ${eegTimeSeriesStats.eegIndices.focusIndex > 2.5 ? '필요 이상의 집중력을 보이고 있어' : '적절한 집중력을 유지하고 있어'} 효율적인 작업이 가능합니다.`,
          recommendations: this.calculateHealthLevel(eegTimeSeriesStats.eegIndices.focusIndex, 1.5, 3.0) === '개선필요'
            ? eegTimeSeriesStats.eegIndices.focusIndex > 3.0 
              ? ["정기적인 휴식", "과집중 방지", "멘탈 브레이크"]
              : ["집중력 훈련", "명상", "주의력 개선 운동"]
            : ["현재 뇌파 집중 건강도 유지", "균형잡힌 활동"]
        },
        stress: {
          dimension: "스트레스 건강도",
          level: this.calculateHealthLevel(eegTimeSeriesStats.eegIndices.stressIndex, 2.8, 4.0),
          score: this.calculateStressHealthScore(eegTimeSeriesStats.eegIndices.stressIndex),
          interpretation: `Stress Index ${eegTimeSeriesStats.eegIndices.stressIndex.toFixed(2)}로 ${this.calculateHealthLevel(eegTimeSeriesStats.eegIndices.stressIndex, 2.8, 4.0) === '우수' ? '최적의 스트레스 건강도' : this.calculateHealthLevel(eegTimeSeriesStats.eegIndices.stressIndex, 2.8, 4.0) === '양호' ? '양호한 스트레스 건강도' : '스트레스 개선 필요'}를 보입니다.`,
          evidence: {
            stressIndex: eegTimeSeriesStats.eegIndices.stressIndex,
            calculationFormula: "(Beta Power + Gamma Power) / (Alpha Power + Theta Power)",
            explanation: "Beta파와 Gamma파는 스트레스와 각성을, Alpha파와 Theta파는 이완과 안정을 나타냅니다. 이 비율이 높을수록 스트레스 수준이 높음을 의미합니다.",
            normalRange: "2.8-4.0",
            physiologicalMarkers: "고주파수(스트레스) / 저주파수(이완) 비율 기반"
          },
          clinicalSignificance: eegTimeSeriesStats.eegIndices.stressIndex > 5.0 || eegTimeSeriesStats.eegIndices.stressIndex < 2.0 ? "moderate" as const : eegTimeSeriesStats.eegIndices.stressIndex > 4.5 || eegTimeSeriesStats.eegIndices.stressIndex < 2.5 ? "mild" as const : "normal" as const,
          personalizedInterpretation: `현재 스트레스 수준은 ${eegTimeSeriesStats.eegIndices.stressIndex > 4.0 ? '관리가 필요한 수준으로 적극적인 스트레스 관리가 권장됩니다' : '건강한 수준을 유지하고 있습니다'}.`,
          recommendations: this.calculateHealthLevel(eegTimeSeriesStats.eegIndices.stressIndex, 2.8, 4.0) === '개선필요'
            ? eegTimeSeriesStats.eegIndices.stressIndex > 4.0
              ? ["스트레스 관리", "이완 훈련", "충분한 수면", "규칙적 운동"]
              : ["적절한 자극 제공", "활동성 증가", "목표 설정"]
            : ["현재 스트레스 건강도 유지", "예방적 케어"]
        }
      },
      detailedDataAnalysis: {
        bandPowerAnalysis: {
          frontalNeuroActivity: {
            interpretation: `전두엽 신경활성도 ${(eegTimeSeriesStats.bandPowers.delta.mean + eegTimeSeriesStats.bandPowers.theta.mean + eegTimeSeriesStats.bandPowers.alpha.mean + eegTimeSeriesStats.bandPowers.beta.mean + eegTimeSeriesStats.bandPowers.gamma.mean).toFixed(2)}μV²는 전두엽 신경 네트워크의 전반적인 활성화 수준을 나타냅니다.`,
            evidence: `측정값 ${(eegTimeSeriesStats.bandPowers.delta.mean + eegTimeSeriesStats.bandPowers.theta.mean + eegTimeSeriesStats.bandPowers.alpha.mean + eegTimeSeriesStats.bandPowers.beta.mean + eegTimeSeriesStats.bandPowers.gamma.mean).toFixed(2)}μV², 정상범위 800-2000μV²`,
            clinicalSignificance: (eegTimeSeriesStats.bandPowers.delta.mean + eegTimeSeriesStats.bandPowers.theta.mean + eegTimeSeriesStats.bandPowers.alpha.mean + eegTimeSeriesStats.bandPowers.beta.mean + eegTimeSeriesStats.bandPowers.gamma.mean) > 2000 ? "과도한 전두엽 신경 활성화" : (eegTimeSeriesStats.bandPowers.delta.mean + eegTimeSeriesStats.bandPowers.theta.mean + eegTimeSeriesStats.bandPowers.alpha.mean + eegTimeSeriesStats.bandPowers.beta.mean + eegTimeSeriesStats.bandPowers.gamma.mean) < 800 ? "전두엽 신경 활동 저하" : "정상적인 전두엽 신경 활성도"
          },
          delta: {
            interpretation: `Delta Power ${eegTimeSeriesStats.bandPowers.delta.mean.toFixed(2)}μV²는 깊은 수면과 뇌 회복 상태를 나타냅니다.`,
            evidence: `측정값 ${eegTimeSeriesStats.bandPowers.delta.mean.toFixed(2)}μV², 정상범위 200-600μV²`,
            clinicalSignificance: eegTimeSeriesStats.bandPowers.delta.mean > 600 ? "과도한 뇌 억제 또는 병리적 상태" : eegTimeSeriesStats.bandPowers.delta.mean < 200 ? "뇌 회복 부족" : "정상적인 뇌 회복 상태"
          },
          theta: {
            interpretation: `Theta Power ${eegTimeSeriesStats.bandPowers.theta.mean.toFixed(2)}μV²는 창의성과 기억 처리 상태를 나타냅니다.`,
            evidence: `측정값 ${eegTimeSeriesStats.bandPowers.theta.mean.toFixed(2)}μV², 정상범위 150-400μV²`,
            clinicalSignificance: eegTimeSeriesStats.bandPowers.theta.mean > 400 ? "과도한 몽상 또는 주의력 결핍" : eegTimeSeriesStats.bandPowers.theta.mean < 150 ? "창의성 억제" : "정상적인 창의적 사고 상태"
          },
          alpha: {
            interpretation: `Alpha Power ${eegTimeSeriesStats.bandPowers.alpha.mean.toFixed(2)}μV²는 이완 상태를 나타냅니다.`,
            evidence: `측정값 ${eegTimeSeriesStats.bandPowers.alpha.mean.toFixed(2)}μV², 정상범위 180-450μV²`,
            clinicalSignificance: eegTimeSeriesStats.bandPowers.alpha.mean > 450 ? "과도한 이완 또는 졸음" : eegTimeSeriesStats.bandPowers.alpha.mean < 180 ? "긴장 상태" : "정상적인 휴식 상태의 뇌파 활동"
          },
          beta: {
            interpretation: `Beta Power ${eegTimeSeriesStats.bandPowers.beta.mean.toFixed(2)}μV²는 집중 상태를 나타냅니다.`,
            evidence: `측정값 ${eegTimeSeriesStats.bandPowers.beta.mean.toFixed(2)}μV², 정상범위 90-280μV²`,
            clinicalSignificance: eegTimeSeriesStats.bandPowers.beta.mean > 280 ? "과도한 집중 또는 스트레스" : eegTimeSeriesStats.bandPowers.beta.mean < 90 ? "집중력 부족" : "정상적인 집중 상태"
          },
          gamma: {
            interpretation: `Gamma Power ${eegTimeSeriesStats.bandPowers.gamma.mean.toFixed(2)}μV²는 고차원적 인지 처리를 나타냅니다.`,
            evidence: `측정값 ${eegTimeSeriesStats.bandPowers.gamma.mean.toFixed(2)}μV², 정상범위 30-80μV²`,
            clinicalSignificance: eegTimeSeriesStats.bandPowers.gamma.mean > 80 ? "과도한 인지 부하" : eegTimeSeriesStats.bandPowers.gamma.mean < 30 ? "인지 기능 저하" : "정상적인 고차원 인지 처리"
          }
        },
        eegIndicesAnalysis: {
          focusIndex: {
            interpretation: `Focus Index ${eegTimeSeriesStats.eegIndices.focusIndex.toFixed(2)}는 ${eegTimeSeriesStats.eegIndices.focusIndex > 2.5 ? '높은' : eegTimeSeriesStats.eegIndices.focusIndex < 2.0 ? '낮은' : '적절한'} 집중력 상태를 나타냅니다.`,
            evidence: `측정값 ${eegTimeSeriesStats.eegIndices.focusIndex.toFixed(2)}, 정상범위 1.5-3.0, Beta/Alpha 비율 기반 계산`,
            recommendations: eegTimeSeriesStats.eegIndices.focusIndex > 2.5 
              ? ["정기적인 휴식", "과집중 방지", "멘탈 브레이크 활용"]
              : eegTimeSeriesStats.eegIndices.focusIndex < 2.0
              ? ["집중력 훈련", "명상", "카페인 섭취 조절"]
              : ["현재 수준 유지", "규칙적인 휴식"]
          },
          relaxationIndex: {
            interpretation: `Relaxation Index ${eegTimeSeriesStats.eegIndices.relaxationIndex.toFixed(3)}는 ${eegTimeSeriesStats.eegIndices.relaxationIndex > 0.22 ? '높은' : eegTimeSeriesStats.eegIndices.relaxationIndex < 0.18 ? '낮은' : '적절한'} 이완 상태를 보여줍니다.`,
            evidence: `측정값 ${eegTimeSeriesStats.eegIndices.relaxationIndex.toFixed(3)}, 정상범위 0.18-0.22, Alpha/Beta 비율 기반`,
            recommendations: eegTimeSeriesStats.eegIndices.relaxationIndex < 0.18
              ? ["이완 기법 연습", "요가 또는 명상", "스트레스 관리"]
              : eegTimeSeriesStats.eegIndices.relaxationIndex > 0.22
              ? ["활동성 증가", "각성도 향상", "적절한 자극"]
              : ["현재 이완 상태 유지", "균형 잡힌 활동"]
          },
          stressIndex: {
            interpretation: `Stress Index ${eegTimeSeriesStats.eegIndices.stressIndex.toFixed(2)}는 ${eegTimeSeriesStats.eegIndices.stressIndex > 4.0 ? '높은' : eegTimeSeriesStats.eegIndices.stressIndex < 2.8 ? '낮은' : '적절한'} 스트레스 수준을 나타냅니다.`,
            evidence: `측정값 ${eegTimeSeriesStats.eegIndices.stressIndex.toFixed(2)}, 정상범위 2.8-4.0, Beta/(Alpha+Theta) 비율 기반`,
            recommendations: eegTimeSeriesStats.eegIndices.stressIndex > 4.0
              ? ["스트레스 관리", "이완 훈련", "충분한 수면", "규칙적 운동"]
              : eegTimeSeriesStats.eegIndices.stressIndex < 2.8
              ? ["적절한 자극 제공", "활동성 증가", "목표 설정"]
              : ["현재 스트레스 수준 관리", "예방적 케어"]
          },
          hemisphericBalance: {
            interpretation: `Hemispheric Balance ${eegTimeSeriesStats.eegIndices.hemisphericBalance.toFixed(3)}는 ${Math.abs(eegTimeSeriesStats.eegIndices.hemisphericBalance) > 0.1 ? '불균형' : '균형잡힌'} 좌우뇌 활성도를 보여줍니다.`,
            evidence: `측정값 ${eegTimeSeriesStats.eegIndices.hemisphericBalance.toFixed(3)}, 정상범위 -0.1~0.1, 좌뇌(${eegTimeSeriesStats.eegIndices.hemisphericBalance > 0 ? '우세' : '열세'})`,
            recommendations: Math.abs(eegTimeSeriesStats.eegIndices.hemisphericBalance) > 0.1
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
        overallSummary: `${personalInfo.age}세 ${personalInfo.occupation}의 뇌파 분석 결과, 4대 지표 평균 건강도 ${Math.round((this.calculateArousalHealthScore(betaAlphaRatio) + this.calculateValenceHealthScore(eegTimeSeriesStats.eegIndices.hemisphericBalance) + this.calculateFocusHealthScore(eegTimeSeriesStats.eegIndices.focusIndex) + this.calculateStressHealthScore(eegTimeSeriesStats.eegIndices.stressIndex)) / 4)}점으로 ${Math.round((this.calculateArousalHealthScore(betaAlphaRatio) + this.calculateValenceHealthScore(eegTimeSeriesStats.eegIndices.hemisphericBalance) + this.calculateFocusHealthScore(eegTimeSeriesStats.eegIndices.focusIndex) + this.calculateStressHealthScore(eegTimeSeriesStats.eegIndices.stressIndex)) / 4) > 80 ? '우수한 뇌 건강 상태' : Math.round((this.calculateArousalHealthScore(betaAlphaRatio) + this.calculateValenceHealthScore(eegTimeSeriesStats.eegIndices.hemisphericBalance) + this.calculateFocusHealthScore(eegTimeSeriesStats.eegIndices.focusIndex) + this.calculateStressHealthScore(eegTimeSeriesStats.eegIndices.stressIndex)) / 4) > 70 ? '양호한 뇌 건강 상태' : '개선이 필요한 뇌 건강 상태'}입니다.`,
        keyFindings: [
          `뇌파 각성 건강도: ${this.calculateHealthLevel(betaAlphaRatio, 0.8, 1.5)} (${this.calculateArousalHealthScore(betaAlphaRatio)}점)`,
          `감정균형도: ${this.calculateHealthLevel(Math.abs(eegTimeSeriesStats.eegIndices.hemisphericBalance), 0, 0.1)} (${this.calculateValenceHealthScore(eegTimeSeriesStats.eegIndices.hemisphericBalance)}점)`,
          `뇌파 집중 건강도: ${this.calculateHealthLevel(eegTimeSeriesStats.eegIndices.focusIndex, 1.5, 3.0)} (${this.calculateFocusHealthScore(eegTimeSeriesStats.eegIndices.focusIndex)}점)`,
          `스트레스 건강도: ${this.calculateHealthLevel(eegTimeSeriesStats.eegIndices.stressIndex, 2.8, 4.0)} (${this.calculateStressHealthScore(eegTimeSeriesStats.eegIndices.stressIndex)}점)`
        ],
        primaryConcerns: this.calculateStressHealthScore(eegTimeSeriesStats.eegIndices.stressIndex) < 70 || this.calculateArousalHealthScore(betaAlphaRatio) < 70 ? 
          ["스트레스 건강도 개선 필요", "각성도 건강도 조절 필요"] : 
          this.calculateFocusHealthScore(eegTimeSeriesStats.eegIndices.focusIndex) < 70 ? ["뇌파 집중 건강도 개선 필요"] : 
          ["현재 특별한 문제점 없음"],
        ageGenderAnalysis: {
          ageComparison: `${personalInfo.age}세 연령대 평균 대비 ${this.calculateArousalHealthScore(betaAlphaRatio) > 80 ? '우수한' : this.calculateArousalHealthScore(betaAlphaRatio) > 70 ? '양호한' : '개선이 필요한'} 각성도 건강도를 보입니다.`,
          genderConsiderations: `${personalInfo.gender === 'male' ? '남성' : '여성'} 특성상 ${this.calculateValenceHealthScore(eegTimeSeriesStats.eegIndices.hemisphericBalance) > 80 ? '우수한 감정균형도' : '정상 범위 내 감정균형도'}를 보입니다.`,
          developmentalContext: `${personalInfo.age < 30 ? '청년기' : personalInfo.age < 50 ? '중년기' : '장년기'} 뇌파 특성에 부합하는 전반적으로 양호한 건강도 패턴입니다.`
        },
        occupationalAnalysis: {
          jobDemands: `${personalInfo.occupation} 업무는 ${personalInfo.occupation.includes('개발') || personalInfo.occupation.includes('연구') ? '높은 집중력과 논리적 사고' : '균형잡힌 인지 능력'}을 요구합니다.`,
          workRelatedPatterns: `업무 특성상 뇌파 집중 건강도 ${this.calculateFocusHealthScore(eegTimeSeriesStats.eegIndices.focusIndex)}점으로 ${this.calculateFocusHealthScore(eegTimeSeriesStats.eegIndices.focusIndex) > 80 ? '우수한 수준' : this.calculateFocusHealthScore(eegTimeSeriesStats.eegIndices.focusIndex) > 70 ? '양호한 수준' : '개선이 필요한 수준'}이며, 스트레스 건강도 ${this.calculateStressHealthScore(eegTimeSeriesStats.eegIndices.stressIndex)}점으로 ${this.calculateStressHealthScore(eegTimeSeriesStats.eegIndices.stressIndex) > 80 ? '우수한 관리 상태' : this.calculateStressHealthScore(eegTimeSeriesStats.eegIndices.stressIndex) > 70 ? '양호한 관리 상태' : '관리가 필요한 상태'}입니다.`,
          professionalRecommendations: personalInfo.occupation.includes('개발') ? 
            ["정기적인 휴식", "눈의 피로 관리", "업무 집중도 최적화"] :
            ["업무-휴식 균형", "스트레스 관리", "인지 능력 향상"]
        },
        improvementPlan: {
          shortTermGoals: this.calculateStressHealthScore(eegTimeSeriesStats.eegIndices.stressIndex) < 70 ? 
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
          level: this.calculateStressHealthScore(eegTimeSeriesStats.eegIndices.stressIndex) < 50 || this.calculateArousalHealthScore(betaAlphaRatio) < 50 ? "moderate" as const : 
                 this.calculateStressHealthScore(eegTimeSeriesStats.eegIndices.stressIndex) < 70 || this.calculateArousalHealthScore(betaAlphaRatio) < 70 ? "low" as const : "low" as const,
          factors: this.calculateStressHealthScore(eegTimeSeriesStats.eegIndices.stressIndex) < 70 || this.calculateArousalHealthScore(betaAlphaRatio) < 70 ? 
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
          (this.calculateValenceHealthScore(eegTimeSeriesStats.eegIndices.hemisphericBalance) * 0.25) +
          (this.calculateFocusHealthScore(eegTimeSeriesStats.eegIndices.focusIndex) * 0.25) +
          (this.calculateStressHealthScore(eegTimeSeriesStats.eegIndices.stressIndex) * 0.25)
        ),
        clinicalRecommendation: this.calculateStressHealthScore(eegTimeSeriesStats.eegIndices.stressIndex) < 50 || this.calculateArousalHealthScore(betaAlphaRatio) < 50 ?
          "전문의 상담 권장, 뇌 건강 정밀 검진 고려" :
          this.calculateStressHealthScore(eegTimeSeriesStats.eegIndices.stressIndex) < 70 || this.calculateArousalHealthScore(betaAlphaRatio) < 70 ?
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
        dataQuality: eegTimeSeriesStats.qualityMetrics,
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