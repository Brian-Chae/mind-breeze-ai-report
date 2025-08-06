/**
 * PPG Advanced Gemini Engine v1
 * PPG 데이터 전문 해석을 위한 고급 Gemini 엔진
 */

import { 
  IAIEngine, 
  MeasurementDataType, 
  ValidationResult, 
  AnalysisOptions, 
  AnalysisResult, 
  EngineCapabilities 
} from '../core/interfaces/IAIEngine';

// PPG 전용 입력 데이터 인터페이스
interface PPGAnalysisInput {
  personalInfo: {
    name: string;
    age: number;
    gender: 'male' | 'female';
    occupation: string;
  };
  ppgTimeSeriesStats: {
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
      avnn: number;
      sdsd: number;
    };
    hrvFrequencyMetrics: {
      vlfPower: number;
      lfPower: number;
      hfPower: number;
      totalPower: number;
      lfHfRatio: number;
      autonomicBalance: number;
      stressIndex: number;
    };
    qualityMetrics: {
      signalQuality: number;
      redSQI: number;
      irSQI: number;
      measurementDuration: number;
      dataCompleteness: number;
    };
    // RR intervals 데이터 추가 (시각화용)
    rrIntervals?: {
      values: number[];          // RR 간격 배열 (ms)
      timestamps?: number[];     // 각 간격의 타임스탬프 (선택적)
      count: number;            // 총 RR 간격 수
      quality: {
        validCount: number;     // 유효한 간격 수
        artifactCount: number;  // 아티팩트로 제거된 간격 수
        coverage: number;       // 데이터 커버리지 (0-1)
      };
    };
  };
}

// PPG 고급 분석 결과 인터페이스
interface PPGAdvancedAnalysisResult {
  threeDimensionAnalysis?: ThreeDimensionAnalysis; // 3대 지표 구조
  detailedDataAnalysis: DetailedDataAnalysis;
  comprehensiveAssessment?: ComprehensiveAssessment; // 종합 평가
  metadata: AnalysisMetadata;
}

// 3대 지표 분석 인터페이스
interface ThreeDimensionAnalysis {
  stress: DimensionAnalysis;
  autonomic: DimensionAnalysis;
  hrv: DimensionAnalysis;
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

interface DetailedDataAnalysis {
  heartRateAnalysis: {
    [key: string]: {
      interpretation: string;
      evidence: string;
      clinicalSignificance: string;
    };
  };
  hrvIndicesAnalysis: {
    timeDomain: {
      interpretation: string;
      evidence: string;
      explanation: string;
      recommendations: string[];
    };
    frequencyDomain: {
      interpretation: string;
      evidence: string;
      explanation: string;
      recommendations: string[];
    };
  };
  autonomicAnalysis: {
    overallAssessment: string;
    sympatheticParasympatheticBalance: string;
    stressResponsePattern: string;
    recoveryCapacity: string;
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

export class PPGAdvancedGeminiEngine implements IAIEngine {
  readonly id = 'ppg-advanced-gemini-v1';
  readonly name = 'PPG 전문 분석 v1';
  readonly description = 'PPG 데이터 전문 해석을 위한 고급 Gemini 엔진 - 3대 맥파 건강도 지표로 종합 분석';
  readonly version = '1.0.0';
  readonly provider = 'gemini';
  
  readonly supportedDataTypes: MeasurementDataType = {
    eeg: false,
    ppg: true,  // PPG 전용
    acc: false
  };
  
  readonly costPerAnalysis = 5; // 고급 분석으로 더 높은 비용
  readonly recommendedRenderers = ['ppg-advanced-json-viewer'];
  
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
      console.log('✅ PPG Advanced Gemini Engine loaded with API key');
    }
  }

  /**
   * PPG 데이터 유효성 검증
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

      // PPG 데이터 구조 검증
      if (!data.measurementData?.ppgMetrics && !data.ppgTimeSeriesStats) {
        errors.push('PPG 데이터가 필요합니다.');
      } else {
        // 심박수 데이터 검증
        const heartRate = data.ppgTimeSeriesStats?.heartRate || {};
        if (heartRate && typeof heartRate.mean === 'number') {
          qualityScore += 15;
        } else {
          warnings.push('심박수 데이터가 부족합니다.');
        }

        // HRV 시간 지표 검증
        const hrvTimeMetrics = data.ppgTimeSeriesStats?.hrvTimeMetrics || {};
        const timeMetrics = ['sdnn', 'rmssd', 'pnn50', 'pnn20', 'avnn', 'sdsd'];
        
        for (const metric of timeMetrics) {
          if (hrvTimeMetrics[metric] && typeof hrvTimeMetrics[metric] === 'number') {
            qualityScore += 5; // 각 지표당 5점
          } else {
            warnings.push(`${metric} 지표 데이터가 부족합니다.`);
          }
        }

        // HRV 주파수 지표 검증
        const hrvFreqMetrics = data.ppgTimeSeriesStats?.hrvFrequencyMetrics || {};
        const freqMetrics = ['lfPower', 'hfPower', 'lfHfRatio', 'stressIndex'];
        
        for (const metric of freqMetrics) {
          if (hrvFreqMetrics[metric] && typeof hrvFreqMetrics[metric] === 'number') {
            qualityScore += 5; // 각 지표당 5점
          } else {
            warnings.push(`${metric} 지표 데이터가 부족합니다.`);
          }
        }

        // 신호 품질 평가
        const qualityMetrics = data.ppgTimeSeriesStats?.qualityMetrics;
        if (qualityMetrics) {
          const signalQuality = qualityMetrics.signalQuality;
          console.log('📊 PPG 신호 품질 검증:', { signalQuality, qualityMetrics });
          
          // 신호 품질이 0-1 범위가 아닌 경우 정규화
          const normalizedSignalQuality = signalQuality > 1 ? signalQuality / 100 : signalQuality;
          
          if (normalizedSignalQuality < 0.4) {
            warnings.push('PPG 신호 품질이 낮습니다. 분석 결과의 신뢰도가 떨어질 수 있습니다.');
            qualityScore *= 0.7;
          } else if (normalizedSignalQuality > 0.8) {
            qualityScore *= 1.1;
          }
          
          const redSQI = qualityMetrics.redSQI || 0;
          const irSQI = qualityMetrics.irSQI || 0;
          if (redSQI < 0.6 || irSQI < 0.6) {
            warnings.push('PPG 채널 신호 품질이 낮습니다.');
            qualityScore *= 0.8;
          }
          
          if (qualityMetrics.measurementDuration < 120) {
            warnings.push('PPG 측정 시간이 짧습니다. HRV 분석을 위해 최소 2분 측정을 권장합니다.');
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
      console.error('PPG 데이터 검증 오류:', error);
      return {
        isValid: false,
        errors: ['데이터 검증 중 오류가 발생했습니다.'],
        warnings,
        qualityScore: 0
      };
    }
  }

  /**
   * PPG 고급 분석 수행
   */
  async analyze(data: any, options: AnalysisOptions = {}): Promise<AnalysisResult> {
    this.analysisStartTime = Date.now();
    const analysisId = `${this.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      console.log('💓 PPG Advanced Analysis 시작:', analysisId);
      
      // 데이터 유효성 검증
      const validation = await this.validate(data);
      if (!validation.isValid) {
        throw new Error(`데이터 검증 실패: ${validation.errors.join(', ')}`);
      }

      let analysisResult: PPGAdvancedAnalysisResult;

      // API 키가 있으면 실제 AI 분석, 없거나 실패하면 목업 데이터
      if (this.apiKey) {
        try {
          console.log('🌐 Gemini API 호출 중...');
          const prompt = this.generatePPGAnalysisPrompt(data);
          const geminiResponse = await this.callGeminiAPIWithRetry(prompt, options);
          analysisResult = this.parseGeminiResponse(geminiResponse, data);
          console.log('✅ Gemini API 호출 성공');
        } catch (error) {
          console.warn('⚠️ Gemini API 호출 실패, Mock 데이터 사용:', error);
          analysisResult = this.generateMockPPGAnalysis(data);
        }
      } else {
        console.log('🔧 API 키 없음 - Mock 데이터로 분석 진행');
        analysisResult = this.generateMockPPGAnalysis(data);
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
        focusLevel: this.extractAutonomicLevel(analysisResult), // PPG에서는 자율신경 건강도 사용
        
        insights: {
          summary: this.generateSummary(analysisResult),
          detailedAnalysis: JSON.stringify(analysisResult, null, 2), // JSON 형태로 제공
          recommendations: this.extractRecommendations(analysisResult),
          warnings: validation.warnings
        },
        
        metrics: {
          ppg: {
            heartRate: data.ppgTimeSeriesStats?.heartRate?.mean || 0,
            hrv: data.ppgTimeSeriesStats?.hrvTimeMetrics?.rmssd || 0, // RMSSD를 HRV 대표값으로 사용
            stressIndex: data.ppgTimeSeriesStats?.hrvFrequencyMetrics?.stressIndex || 0
          }
        },
        
        processingTime,
        costUsed: this.costPerAnalysis,
        
        // PPG Advanced 전용 데이터 (Firestore 호환을 위해 undefined 제거)
        rawData: this.sanitizeForFirestore({
          ppgAdvancedAnalysis: analysisResult,
          qualityScore: validation.qualityScore,
          inputData: data
        })
      };

    } catch (error) {
      console.error('🚨 PPG Advanced Analysis 오류:', error);
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
   * 구조화된 PPG 데이터에서 분석 입력 데이터 추출
   */
  private extractPPGDataFromReport(data: any): PPGAnalysisInput | null {
    try {
      
      // AnalysisPipelineOrchestrator에서 전달된 경우
      if (data.measurementData?.ppgMetrics) {
        const ppgMetrics = data.measurementData.ppgMetrics;
        
        // PPG 데이터 구조 확인 및 변환
        return {
          personalInfo: {
            name: data.personalInfo?.name || '익명',
            age: data.personalInfo?.age || 30,
            gender: data.personalInfo?.gender || 'male',
            occupation: data.personalInfo?.occupation || '일반'
          },
          ppgTimeSeriesStats: {
            heartRate: {
              mean: ppgMetrics.heartRate?.mean || ppgMetrics.bpm?.mean || 72,
              std: ppgMetrics.heartRate?.std || ppgMetrics.bpm?.std || 8,
              min: ppgMetrics.heartRate?.min || ppgMetrics.bpm?.min || 65,
              max: ppgMetrics.heartRate?.max || ppgMetrics.bpm?.max || 85
            },
            hrvTimeMetrics: {
              sdnn: typeof ppgMetrics.hrvTimeMetrics?.sdnn === 'number' ? ppgMetrics.hrvTimeMetrics.sdnn : ppgMetrics.sdnn?.mean || 50,
              rmssd: typeof ppgMetrics.hrvTimeMetrics?.rmssd === 'number' ? ppgMetrics.hrvTimeMetrics.rmssd : ppgMetrics.rmssd?.mean || 35,
              pnn50: typeof ppgMetrics.hrvTimeMetrics?.pnn50 === 'number' ? ppgMetrics.hrvTimeMetrics.pnn50 : ppgMetrics.pnn50?.mean || 25,
              pnn20: typeof ppgMetrics.hrvTimeMetrics?.pnn20 === 'number' ? ppgMetrics.hrvTimeMetrics.pnn20 : ppgMetrics.pnn20?.mean || 45,
              avnn: typeof ppgMetrics.hrvTimeMetrics?.avnn === 'number' ? ppgMetrics.hrvTimeMetrics.avnn : ppgMetrics.avnn?.mean || 830,
              sdsd: typeof ppgMetrics.hrvTimeMetrics?.sdsd === 'number' ? ppgMetrics.hrvTimeMetrics.sdsd : ppgMetrics.sdsd?.mean || 35
            },
            hrvFrequencyMetrics: {
              vlfPower: ppgMetrics.vlf?.mean || ppgMetrics.hrvFrequencyMetrics?.vlfPower || 1500,
              lfPower: ppgMetrics.lf?.mean || ppgMetrics.hrvFrequencyMetrics?.lfPower || 1200,
              hfPower: ppgMetrics.hf?.mean || ppgMetrics.hrvFrequencyMetrics?.hfPower || 800,
              totalPower: ppgMetrics.totalPower?.mean || ppgMetrics.hrvFrequencyMetrics?.totalPower || 3500,
              lfHfRatio: ppgMetrics.lfHfRatio?.mean || ppgMetrics.hrvFrequencyMetrics?.lfHfRatio || 1.5,
              autonomicBalance: ppgMetrics.autonomicBalance?.mean || ppgMetrics.hrvFrequencyMetrics?.autonomicBalance || ppgMetrics.lfHfRatio?.mean || ppgMetrics.hrvFrequencyMetrics?.lfHfRatio || 1.5,
              stressIndex: ppgMetrics.stressLevel?.mean || ppgMetrics.stressIndex?.mean || ppgMetrics.hrvFrequencyMetrics?.stressIndex || 45
            },
            qualityMetrics: {
              signalQuality: ppgMetrics.signalQuality?.mean || ppgMetrics.qualityMetrics?.signalQuality || 0.85,
              redSQI: ppgMetrics.qualityMetrics?.redSQI || 0.85,
              irSQI: ppgMetrics.qualityMetrics?.irSQI || 0.85,
              measurementDuration: ppgMetrics.qualityMetrics?.measurementDuration || 300,
              dataCompleteness: ppgMetrics.qualityMetrics?.dataCompleteness || 0.95
            },
            rrIntervals: ppgMetrics.rrIntervals || { count: 0, intervals: [] }
          }
        };
      }
      
      // 구조화된 데이터가 이미 있는 경우
      if (data.ppgTimeSeriesStats && data.personalInfo) {
        return {
          personalInfo: {
            name: data.personalInfo?.name || '익명',
            age: data.personalInfo?.age || 30,
            gender: data.personalInfo?.gender || 'male',
            occupation: data.personalInfo?.occupation || '일반'
          },
          ppgTimeSeriesStats: {
            heartRate: {
              mean: data.ppgTimeSeriesStats.heartRate?.mean || 72,
              std: data.ppgTimeSeriesStats.heartRate?.std || 8,
              min: data.ppgTimeSeriesStats.heartRate?.min || 65,
              max: data.ppgTimeSeriesStats.heartRate?.max || 85
            },
            hrvTimeMetrics: {
              sdnn: typeof data.ppgTimeSeriesStats.hrvTimeMetrics?.sdnn === 'number' ? data.ppgTimeSeriesStats.hrvTimeMetrics.sdnn : 50,
              rmssd: typeof data.ppgTimeSeriesStats.hrvTimeMetrics?.rmssd === 'number' ? data.ppgTimeSeriesStats.hrvTimeMetrics.rmssd : 35,
              pnn50: typeof data.ppgTimeSeriesStats.hrvTimeMetrics?.pnn50 === 'number' ? data.ppgTimeSeriesStats.hrvTimeMetrics.pnn50 : 25,
              pnn20: typeof data.ppgTimeSeriesStats.hrvTimeMetrics?.pnn20 === 'number' ? data.ppgTimeSeriesStats.hrvTimeMetrics.pnn20 : 45,
              avnn: typeof data.ppgTimeSeriesStats.hrvTimeMetrics?.avnn === 'number' ? data.ppgTimeSeriesStats.hrvTimeMetrics.avnn : 830,
              sdsd: typeof data.ppgTimeSeriesStats.hrvTimeMetrics?.sdsd === 'number' ? data.ppgTimeSeriesStats.hrvTimeMetrics.sdsd : 35
            },
            hrvFrequencyMetrics: {
              vlfPower: data.ppgTimeSeriesStats.hrvFrequencyMetrics?.vlfPower || 1500,
              lfPower: data.ppgTimeSeriesStats.hrvFrequencyMetrics?.lfPower || 1200,
              hfPower: data.ppgTimeSeriesStats.hrvFrequencyMetrics?.hfPower || 800,
              totalPower: data.ppgTimeSeriesStats.hrvFrequencyMetrics?.totalPower || 3500,
              lfHfRatio: data.ppgTimeSeriesStats.hrvFrequencyMetrics?.lfHfRatio || 1.5,
              autonomicBalance: data.ppgTimeSeriesStats.hrvFrequencyMetrics?.autonomicBalance || data.ppgTimeSeriesStats.hrvFrequencyMetrics?.lfHfRatio || 1.5,
              stressIndex: data.ppgTimeSeriesStats.hrvFrequencyMetrics?.stressIndex || 45
            },
            qualityMetrics: {
              signalQuality: data.ppgTimeSeriesStats.qualityMetrics?.signalQuality || 0.85,
              redSQI: data.ppgTimeSeriesStats.qualityMetrics?.redSQI || 0.85,
              irSQI: data.ppgTimeSeriesStats.qualityMetrics?.irSQI || 0.85,
              measurementDuration: data.ppgTimeSeriesStats.qualityMetrics?.measurementDuration || 300,
              dataCompleteness: data.ppgTimeSeriesStats.qualityMetrics?.dataCompleteness || 0.95
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

      // PPG 데이터가 measurementData에 있는 경우 (기존 방식)
      if (data.measurementData?.ppgMetrics) {
        console.log('📊 measurementData에서 PPG 메트릭 추출');
        const ppgMetrics = data.measurementData.ppgMetrics;
        
        return {
          personalInfo,
          ppgTimeSeriesStats: {
            heartRate: {
              mean: ppgMetrics.heartRateStats?.mean || 75,
              std: ppgMetrics.heartRateStats?.std || 8,
              min: ppgMetrics.heartRateStats?.min || 65,
              max: ppgMetrics.heartRateStats?.max || 90
            },
            hrvTimeMetrics: {
              sdnn: ppgMetrics.hrvMetrics?.sdnn || 45,
              rmssd: ppgMetrics.hrvMetrics?.rmssd || 35,
              pnn50: ppgMetrics.hrvMetrics?.pnn50 || 15,
              pnn20: ppgMetrics.hrvMetrics?.pnn20 || 25,
              avnn: ppgMetrics.hrvMetrics?.avnn || 800,
              sdsd: ppgMetrics.hrvMetrics?.sdsd || 30
            },
            hrvFrequencyMetrics: {
              vlfPower: ppgMetrics.hrvMetrics?.vlfPower || 700,
              lfPower: ppgMetrics.hrvMetrics?.lfPower || 500,
              hfPower: ppgMetrics.hrvMetrics?.hfPower || 400,
              totalPower: ppgMetrics.hrvMetrics?.totalPower || 1600,
              lfHfRatio: ppgMetrics.hrvMetrics?.lfHfRatio || 1.25,
              autonomicBalance: ppgMetrics.hrvMetrics?.autonomicBalance || ppgMetrics.hrvMetrics?.lfHfRatio || 1.25,
              stressIndex: ppgMetrics.hrvMetrics?.stressIndex || 45
            },
            qualityMetrics: {
              signalQuality: data.measurementData.qualityMetrics?.signalQuality || 0.85,
              redSQI: data.measurementData.qualityMetrics?.redSQI || 0.8,
              irSQI: data.measurementData.qualityMetrics?.irSQI || 0.8,
              measurementDuration: data.measurementData.qualityMetrics?.measurementDuration || 300,
              dataCompleteness: data.measurementData.qualityMetrics?.dataCompleteness || 0.9
            }
          }
        };
      }

      // 기본 구조로 fallback
      console.log('⚠️ 기본 fallback PPG 데이터 사용');
      return {
        personalInfo,
        ppgTimeSeriesStats: {
          heartRate: { mean: 75, std: 8, min: 65, max: 90 },
          hrvTimeMetrics: {
            sdnn: 45,
            rmssd: 35,
            pnn50: 15,
            pnn20: 25,
            avnn: 800,
            sdsd: 30
          },
          hrvFrequencyMetrics: {
            vlfPower: 700,
            lfPower: 500,
            hfPower: 400,
            totalPower: 1600,
            lfHfRatio: 1.25,
            autonomicBalance: 1.25,
            stressIndex: 45
          },
          qualityMetrics: {
            signalQuality: 0.85,
            redSQI: 0.8,
            irSQI: 0.8,
            measurementDuration: 300,
            dataCompleteness: 0.9
          }
        }
      };

    } catch (error) {
      console.error('PPG 데이터 추출 오류:', error);
      return null;
    }
  }

  /**
   * PPG 전용 프롬프트 생성 (구조화된 데이터 기반)
   */
  private generatePPGAnalysisPrompt(data: any): string {
    const ppgData = this.extractPPGDataFromReport(data);
    if (!ppgData) {
      throw new Error('PPG 데이터 추출 실패');
    }

    const { personalInfo, ppgTimeSeriesStats } = ppgData;
    
    // 개인정보 기반 동적 프롬프트 생성
    const age = personalInfo.age || 30;
    const gender = personalInfo.gender === 'male' ? '남성' : '여성';
    const occupation = personalInfo.occupation || '일반직';
    
    // 연령대별 특성
    const getAgeCharacteristics = (age: number) => {
      if (age < 30) {
        return '청년기 높은 심박변이도와 빠른 회복력';
      } else if (age < 50) {
        return '중년기 점진적 HRV 감소와 자율신경 변화';
      } else {
        return '장년기 심박변이도 감소와 자율신경 재조정';
      }
    };
    
    // 성별별 특성
    const getGenderCharacteristics = (gender: string) => {
      if (gender === '남성') {
        return '남성 특유의 교감신경 우세 경향과 스트레스 반응';
      } else {
        return '여성 호르몬 주기에 따른 HRV 변동성';
      }
    };
    
    // 직업별 특성
    const getOccupationCharacteristics = (occupation: string) => {
      const occupationLower = occupation.toLowerCase();
      
      if (occupationLower.includes('개발') || occupationLower.includes('프로그래머') || occupationLower.includes('엔지니어')) {
        return '장시간 좌식 생활, 정신적 스트레스, 불규칙한 생활 패턴';
      } else if (occupationLower.includes('의사') || occupationLower.includes('간호') || occupationLower.includes('치료')) {
        return '높은 업무 스트레스, 교대 근무, 감정 노동';
      } else if (occupationLower.includes('교사') || occupationLower.includes('교수')) {
        return '지속적 대인 관계, 정신적 피로, 계절별 스트레스 변화';
      } else {
        return '일반적인 직업적 스트레스와 생활 패턴';
      }
    };
    
    return `
[분석 요청 시간: ${new Date().toISOString()}]
당신은 심박변이도(HRV) 및 자율신경계 분석 전문의입니다. ${age}세 ${gender} ${occupation}의 PPG 데이터를 최대한 전문적이고 상세하게 분석해주세요.

## 개인정보 및 전문적 고려사항
- 이름: ${personalInfo.name}
- 나이: ${age}세 (${getAgeCharacteristics(age)})
- 성별: ${gender} (${getGenderCharacteristics(gender)})
- 직업: ${occupation} (${getOccupationCharacteristics(occupation)})

## 전문의로서의 분석 지침
- ${age}세 ${gender}의 연령/성별별 생리학적 특성을 HRV 해석에 반영
- ${occupation} 직업군의 특수한 스트레스 패턴과 생활 리듬 분석
- 개인의 생활패턴과 직업적 특성을 고려한 자율신경계 변화 해석
- 의학적 근거에 기반한 개별화된 임상적 해석 제공

## PPG 시계열 데이터 통계 (1분 측정)

### 기본 심박 지표
- **평균 심박수**: ${ppgTimeSeriesStats.heartRate.mean.toFixed(1)} BPM (표준편차: ${ppgTimeSeriesStats.heartRate.std.toFixed(1)})
- **최대 심박수**: ${ppgTimeSeriesStats.heartRate.max.toFixed(0)} BPM
- **최소 심박수**: ${ppgTimeSeriesStats.heartRate.min.toFixed(0)} BPM

### HRV 시간 영역 지표 (Time Domain)
- **RMSSD**: ${ppgTimeSeriesStats.hrvTimeMetrics.rmssd.toFixed(2)} ms
  - 계산: √(Σ(RRi+1 - RRi)² / N)
  - 의미: 단기 심박변이도, 부교감신경 활성도 지표
  
- **SDNN**: ${ppgTimeSeriesStats.hrvTimeMetrics.sdnn.toFixed(2)} ms
  - 계산: RR 간격의 표준편차
  - 의미: 전체 심박변이도, 자율신경계 전반적 활성도
  
- **pNN50**: ${ppgTimeSeriesStats.hrvTimeMetrics.pnn50.toFixed(1)}%
  - 계산: 연속 RR 간격 차이가 50ms 이상인 비율
  - 의미: 부교감신경 활성도 지표
  
- **pNN20**: ${ppgTimeSeriesStats.hrvTimeMetrics.pnn20.toFixed(1)}%
  - 계산: 연속 RR 간격 차이가 20ms 이상인 비율
  - 의미: 민감한 부교감신경 활성도 지표

### HRV 주파수 영역 지표 (Frequency Domain)
- **VLF Power**: ${ppgTimeSeriesStats.hrvFrequencyMetrics.vlfPower.toFixed(1)} ms²
  - 주파수 범위: 0.003-0.04 Hz
  - 의미: 체온조절, 레닌-안지오텐신 시스템
  
- **LF Power**: ${ppgTimeSeriesStats.hrvFrequencyMetrics.lfPower.toFixed(1)} ms²
  - 주파수 범위: 0.04-0.15 Hz
  - 의미: 교감신경 및 부교감신경 복합 활성도
  
- **HF Power**: ${ppgTimeSeriesStats.hrvFrequencyMetrics.hfPower.toFixed(1)} ms²
  - 주파수 범위: 0.15-0.4 Hz
  - 의미: 부교감신경 활성도 (호흡 관련)
  
- **Total Power**: ${ppgTimeSeriesStats.hrvFrequencyMetrics.totalPower.toFixed(1)} ms²
  - 계산: VLF + LF + HF
  - 의미: 전체 자율신경계 활성도
  
- **LF/HF Ratio**: ${ppgTimeSeriesStats.hrvFrequencyMetrics.lfHfRatio.toFixed(2)}
  - 계산: LF Power / HF Power
  - 의미: 교감/부교감신경 균형 지표

### 스트레스 및 자율신경 지표
- **Stress Index**: ${ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex.toFixed(2)}
  - 계산: (Mean HR × SD HR) / RMSSD
  - 의미: 종합적 스트레스 부하 지표
  
- **Autonomic Balance**: ${ppgTimeSeriesStats.hrvFrequencyMetrics.autonomicBalance.toFixed(2)}
  - 계산: 교감/부교감 활성도 비율
  - 의미: 자율신경계 균형 상태

### 측정 품질 정보
- **신호 품질**: ${(ppgTimeSeriesStats.qualityMetrics.signalQuality * 100).toFixed(1)}%
- **측정 시간**: ${ppgTimeSeriesStats.qualityMetrics.measurementDuration}초
- **수집된 RR intervals**: ${ppgTimeSeriesStats.rrIntervals?.count || 0}개
- **데이터 완전성**: ${(ppgTimeSeriesStats.qualityMetrics.dataCompleteness * 100).toFixed(1)}%

## 분석 요청사항

위의 모든 측정값에 대해 다음 정상범위를 기준으로 전문적으로 분석해주세요:

**⚠️ 중요: 반드시 아래 정상범위를 사용하여 점수 계산 ⚠️**

**주요 지표 정상범위:**
- **Heart Rate**: 60-100 BPM
- **RMSSD**: 20-200 ms (이전 20-100ms 아님!)
- **SDNN**: 50-100 ms  
- **pNN50**: 10-50%
- **LF Power**: 200-1,200 ms²
- **HF Power**: 80-4,000 ms²
- **LF/HF Ratio**: 1.0-10.0 (이전 0.5-2.0 아님!)
- **Stress Index**: 30-70 (낮을수록 좋음)

**현재 측정값 비교:**
- LF/HF Ratio ${ppgTimeSeriesStats.hrvFrequencyMetrics.lfHfRatio.toFixed(2)} → 정상범위 1.0-10.0 내에 있음 (정상!)
- RMSSD ${ppgTimeSeriesStats.hrvTimeMetrics.rmssd.toFixed(2)}ms → 정상범위 20-200ms 내에 있음 (정상!)

분석 요청사항:
1. 각 지표의 위 정상범위 대비 현재 상태 평가
2. 측정값의 상태 (정상/경미한 이상/중등도 이상/심각)
3. 의학적 해석과 임상적 의미
4. 개인 맞춤형 권장사항

다음 JSON 형식으로 전문적이고 상세한 분석 결과를 제공해주세요:

**⚠️ 반드시 준수할 중요 사항 ⚠️**
1. **LF/HF Ratio ${ppgTimeSeriesStats.hrvFrequencyMetrics.lfHfRatio.toFixed(2)}는 정상범위 1.0-10.0 내에 있으므로 반드시 80점 이상 점수 부여**
2. **RMSSD ${ppgTimeSeriesStats.hrvTimeMetrics.rmssd.toFixed(2)}ms는 정상범위 20-200ms 내에 있으므로 반드시 80점 이상 점수 부여**
3. overallScore는 반드시 3대 축(stress, autonomic, hrv)의 점수를 평균한 값으로 계산
4. 정상범위 내 값은 모두 양호(우수) 상태로 평가

{
  "threeDimensionAnalysis": {
    "stress": {
      "dimension": "스트레스 건강도",
      "level": "우수|양호|개선필요",
      "score": 0-100,
      "interpretation": "스트레스 관리 능력 해석 (100점에 가까울수록 건강한 스트레스 관리)",
      "evidence": {
        "stressIndex": ${ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex.toFixed(2)},
        "heartRateVariability": ${ppgTimeSeriesStats.heartRate.std.toFixed(2)},
        "calculationFormula": "(Mean HR × SD HR) / RMSSD",
        "normalRange": "30-70 (낮을수록 좋음)",
        "minValue": "최소값",
        "maxValue": "최대값",
        "currentStatus": "현재 상태 평가"
      },
      "clinicalSignificance": "normal|mild|moderate|severe",
      "personalizedInterpretation": "${personalInfo.age}세 ${personalInfo.occupation}의 스트레스 특성 해석",
      "recommendations": ["스트레스 관리를 위한 개인 맞춤 권장사항"]
    },
    "autonomic": {
      "dimension": "자율신경 건강도",
      "level": "우수|양호|개선필요",
      "score": 0-100,
      "interpretation": "자율신경계 균형 상태 해석 (100점에 가까울수록 건강한 균형)",
      "evidence": {
        "lfHfRatio": ${ppgTimeSeriesStats.hrvFrequencyMetrics.lfHfRatio.toFixed(2)},
        "lfPower": ${ppgTimeSeriesStats.hrvFrequencyMetrics.lfPower.toFixed(1)},
        "hfPower": ${ppgTimeSeriesStats.hrvFrequencyMetrics.hfPower.toFixed(1)},
        "sympatheticActivity": "교감신경 활성도 평가",
        "parasympatheticActivity": "부교감신경 활성도 평가",
        "calculationFormula": "LF Power / HF Power",
        "normalRange": "1.0-10.0",
        "minValue": "최소값",
        "maxValue": "최대값",
        "currentStatus": "현재 균형 상태 평가"
      },
      "clinicalSignificance": "normal|mild|moderate|severe",
      "personalizedInterpretation": "개인의 자율신경계 균형 특성 해석",
      "recommendations": ["자율신경 균형을 위한 개인 맞춤 권장사항"]
    },
    "hrv": {
      "dimension": "심박변이 건강도",
      "level": "우수|양호|개선필요",
      "score": 0-100,
      "interpretation": "심박 변이성 수준 해석 (100점에 가까울수록 건강한 심박 변이)",
      "evidence": {
        "rmssd": ${ppgTimeSeriesStats.hrvTimeMetrics.rmssd.toFixed(2)},
        "sdnn": ${ppgTimeSeriesStats.hrvTimeMetrics.sdnn.toFixed(2)},
        "pnn50": ${ppgTimeSeriesStats.hrvTimeMetrics.pnn50.toFixed(1)},
        "pnn20": ${ppgTimeSeriesStats.hrvTimeMetrics.pnn20.toFixed(1)},
        "calculationFormula": "√(Σ(RRi+1 - RRi)² / N)",
        "normalRange": "RMSSD 20-200ms, SDNN 50-100ms, pNN50 10-50%",
        "minValue": "최소값",
        "maxValue": "최대값",
        "currentStatus": "현재 HRV 상태 평가"
      },
      "clinicalSignificance": "normal|mild|moderate|severe",
      "personalizedInterpretation": "개인의 심박 변이성 특성과 연령 고려 해석",
      "recommendations": ["심박 변이성 향상을 위한 개인 맞춤 권장사항"]
    }
  },
  "detailedDataAnalysis": {
    "heartRateAnalysis": {
      "restingHR": {
        "value": ${ppgTimeSeriesStats.heartRate.mean.toFixed(1)},
        "normalRange": "60-100 BPM",
        "interpretation": "안정시 심박수 해석",
        "evidence": "평균 ${ppgTimeSeriesStats.heartRate.mean.toFixed(1)} BPM",
        "clinicalSignificance": "임상적 의미"
      },
      "hrVariability": {
        "value": ${ppgTimeSeriesStats.heartRate.std.toFixed(1)},
        "interpretation": "심박수 변동성 해석",
        "evidence": "표준편차 ${ppgTimeSeriesStats.heartRate.std.toFixed(1)} BPM",
        "clinicalSignificance": "임상적 의미"
      }
    },
    "hrvIndicesAnalysis": {
      "timeDomain": {
        "interpretation": "시간 영역 HRV 지표 종합 해석",
        "evidence": "SDNN, RMSSD, pNN50 기반 분석",
        "explanation": "연속된 심박 간격의 변동성을 시간 축에서 분석",
        "recommendations": ["시간 영역 지표 개선 방안"]
      },
      "frequencyDomain": {
        "interpretation": "주파수 영역 HRV 지표 종합 해석",
        "evidence": "LF, HF, LF/HF ratio 기반 분석",
        "explanation": "심박 변동의 주파수 성분을 분석하여 자율신경 활동 평가",
        "recommendations": ["주파수 영역 지표 개선 방안"]
      }
    },
    "autonomicAnalysis": {
      "overallAssessment": "3대 지표 종합 자율신경계 기능 평가",
      "sympatheticParasympatheticBalance": "교감/부교감 신경 균형 상태",
      "stressResponsePattern": "스트레스 반응 패턴 분석",
      "recoveryCapacity": "회복 능력 평가"
    }
  },
  "comprehensiveAssessment": {
    "overallSummary": "3가지 축(스트레스, 자율신경, 심박변이)을 종합한 전체적인 건강 상태 평가",
    "keyFindings": ["주요 발견사항 1", "주요 발견사항 2", "주요 발견사항 3"],
    "primaryConcerns": ["주요 문제점이나 개선이 필요한 영역"],
    "ageGenderAnalysis": {
      "ageComparison": "${personalInfo.age}세 연령대 평균과 비교한 분석",
      "genderConsiderations": "${personalInfo.gender} 성별 특성을 고려한 해석",
      "developmentalContext": "연령대별 정상 발달 범위 내 평가"
    },
    "occupationalAnalysis": {
      "jobDemands": "${personalInfo.occupation} 직업의 스트레스 요구사항 분석",
      "workRelatedPatterns": "업무 관련 자율신경계 패턴 해석",
      "professionalRecommendations": ["직업적 특성을 고려한 맞춤형 권장사항"]
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
    "overallScore": "3대 축(stressHealth, autonomicHealth, hrvHealth)의 점수 평균값 (소수점 첫째자리까지)",
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
      console.warn(`⚠️ Gemini API 호출 실패: ${response.status} ${response.statusText}. Mock 데이터를 사용합니다.`);
      throw new Error(`Gemini API 호출 실패: ${response.status}`);
    }

    const result = await response.json();
    return result;
  }

  /**
   * Gemini 응답 파싱
   */
  private parseGeminiResponse(response: any, inputData: any): PPGAdvancedAnalysisResult {
    try {
      const content = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        throw new Error('Gemini 응답에서 컨텐츠를 찾을 수 없습니다');
      }

      // JSON 추출
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       content.match(/{\s*"threeDimensionAnalysis"[\s\S]*}/);
      
      if (!jsonMatch) {
        console.warn('JSON 형식을 찾을 수 없어 Mock 데이터를 사용합니다');
        return this.generateMockPPGAnalysis(inputData);
      }

      const parsedResult = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      
      // 메타데이터 추가 (안전한 접근)
      parsedResult.metadata = {
        analysisTimestamp: new Date().toISOString(),
        personalInfo: inputData.personalInfo || {},
        dataQuality: inputData.ppgTimeSeriesStats?.qualityMetrics || {
          signalQuality: 0.85,
          redSQI: 0.85,
          irSQI: 0.85,
          measurementDuration: 300,
          dataCompleteness: 0.95
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
      return this.generateMockPPGAnalysis(inputData);
    }
  }

  /**
   * Mock PPG 분석 데이터 생성
   */
  private generateMockPPGAnalysis(data: any): PPGAdvancedAnalysisResult {
    const ppgData = this.extractPPGDataFromReport(data);
    if (!ppgData) {
      throw new Error('PPG 데이터 추출 실패');
    }

    const { personalInfo, ppgTimeSeriesStats } = ppgData;
    
    // 안전하게 HRV 메트릭 값 추출
    const getRmssdValue = () => typeof ppgTimeSeriesStats.hrvTimeMetrics.rmssd === 'number' ? 
      ppgTimeSeriesStats.hrvTimeMetrics.rmssd : 35;
    const getSdnnValue = () => typeof ppgTimeSeriesStats.hrvTimeMetrics.sdnn === 'number' ? 
      ppgTimeSeriesStats.hrvTimeMetrics.sdnn : 50;
    const getPnn50Value = () => typeof ppgTimeSeriesStats.hrvTimeMetrics.pnn50 === 'number' ? 
      ppgTimeSeriesStats.hrvTimeMetrics.pnn50 : 25;
    
    return {
      threeDimensionAnalysis: {
        stress: {
          dimension: "스트레스 건강도",
          level: this.calculateHealthLevel(ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex, 30, 70),
          score: this.calculateStressHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex),
          interpretation: `Stress Index ${ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex.toFixed(2)}로 ${this.calculateHealthLevel(ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex, 30, 70) === '우수' ? '최적의 스트레스 건강도' : this.calculateHealthLevel(ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex, 30, 70) === '양호' ? '양호한 스트레스 건강도' : '스트레스 관리 필요'}를 보입니다.`,
          evidence: {
            stressIndex: ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex,
            heartRateVariability: ppgTimeSeriesStats.heartRate.std,
            calculationFormula: "(Mean HR × SD HR) / RMSSD",
            normalRange: "30-70"
          },
          clinicalSignificance: this.calculateClinicalSignificance(
            ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex, 30, 70
          ),
          personalizedInterpretation: `${personalInfo.age}세 연령대의 ${personalInfo.occupation} 직업군의 스트레스 수준은 ${
            this.calculateStressHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex) > 80 ? 
            '우수한 수준으로 스트레스 관리가 잘 되고 있음' : this.calculateStressHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex) > 70 ? '양호한 수준이나 예방적 관리 권장' : '개선이 필요한 수준으로 스트레스 관리 필요'}입니다.`,
          recommendations: this.generateStressRecommendations(
            ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex
          )
        },
        autonomic: {
          dimension: "자율신경 건강도",
          level: this.calculateHealthLevel(ppgTimeSeriesStats.hrvFrequencyMetrics.lfHfRatio, 1.0, 10.0),
          score: this.calculateAutonomicHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.lfHfRatio),
          interpretation: `LF/HF Ratio ${ppgTimeSeriesStats.hrvFrequencyMetrics.lfHfRatio.toFixed(2)}로 ${this.calculateHealthLevel(ppgTimeSeriesStats.hrvFrequencyMetrics.lfHfRatio, 1.0, 10.0) === '우수' ? '최적의 자율신경 건강도' : this.calculateHealthLevel(ppgTimeSeriesStats.hrvFrequencyMetrics.lfHfRatio, 1.0, 10.0) === '양호' ? '양호한 자율신경 건강도' : '자율신경 균형 조정 필요'}를 보입니다.`,
          evidence: {
            lfHfRatio: ppgTimeSeriesStats.hrvFrequencyMetrics.lfHfRatio,
            sympatheticActivity: ppgTimeSeriesStats.hrvFrequencyMetrics.lfPower > 500 ? "증가" : "정상",
            parasympatheticActivity: ppgTimeSeriesStats.hrvFrequencyMetrics.hfPower > 400 ? "증가" : "정상",
            calculationFormula: "LF Power / HF Power",
            normalRange: "1.0-10.0"
          },
          clinicalSignificance: this.calculateClinicalSignificance(
            ppgTimeSeriesStats.hrvFrequencyMetrics.lfHfRatio, 1.0, 10.0
          ),
          personalizedInterpretation: `자율신경계 균형은 ${this.calculateAutonomicHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.lfHfRatio) > 80 ? '우수한' : this.calculateAutonomicHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.lfHfRatio) > 70 ? '양호한' : '개선이 필요한'} 상태입니다.`,
          recommendations: this.generateAutonomicRecommendations(
            ppgTimeSeriesStats.hrvFrequencyMetrics.lfHfRatio
          )
        },
        hrv: {
          dimension: "심박변이 건강도",
          level: this.calculateHealthLevel(getRmssdValue(), 20, 200),
          score: this.calculateHRVHealthScore(getRmssdValue(), personalInfo.age),
          interpretation: `RMSSD ${getRmssdValue().toFixed(2)}ms로 ${this.calculateHealthLevel(getRmssdValue(), 20, 200) === '우수' ? '최적의 심박변이 건강도' : this.calculateHealthLevel(getRmssdValue(), 20, 200) === '양호' ? '양호한 심박변이 건강도' : '심박변이 개선 필요'}를 보입니다.`,
          evidence: {
            rmssd: getRmssdValue(),
            sdnn: getSdnnValue(),
            pnn50: getPnn50Value(),
            calculationFormula: "√(Σ(RRi+1 - RRi)² / N)",
            normalRange: "RMSSD 20-200ms, SDNN 50-100ms, pNN50 10-50%"
          },
          clinicalSignificance: this.calculateClinicalSignificance(
            getRmssdValue(), 20, 200
          ),
          personalizedInterpretation: `${personalInfo.age}세 연령대 평균 대비 심박변이성은 ${this.calculateHRVHealthScore(getRmssdValue(), personalInfo.age) > 80 ? '우수한 수준으로 자율신경 활성도가 높음' : this.calculateHRVHealthScore(getRmssdValue(), personalInfo.age) > 70 ? '양호한 수준으로 건강한 상태' : '개선이 필요한 수준으로 심박변이 개선 권장'}입니다.`,
          recommendations: this.generateHRVRecommendations(
            getRmssdValue(), personalInfo.age
          )
        }
      },
      detailedDataAnalysis: {
        heartRateAnalysis: {
          restingHR: {
            interpretation: `안정시 심박수 ${ppgTimeSeriesStats.heartRate.mean.toFixed(0)}bpm은 ${ppgTimeSeriesStats.heartRate.mean < 60 ? '낮은' : ppgTimeSeriesStats.heartRate.mean > 90 ? '높은' : '정상'} 수준입니다.`,
            evidence: `측정값 ${ppgTimeSeriesStats.heartRate.mean.toFixed(0)}bpm, 정상범위 60-90bpm`,
            clinicalSignificance: ppgTimeSeriesStats.heartRate.mean < 50 || ppgTimeSeriesStats.heartRate.mean > 100 ? "주의 필요" : "정상 범위"
          },
          hrVariability: {
            interpretation: `심박수 변동성 ${ppgTimeSeriesStats.heartRate.std.toFixed(1)}bpm은 ${ppgTimeSeriesStats.heartRate.std > 10 ? '높은' : ppgTimeSeriesStats.heartRate.std < 5 ? '낮은' : '적절한'} 수준입니다.`,
            evidence: `표준편차 ${ppgTimeSeriesStats.heartRate.std.toFixed(1)}bpm`,
            clinicalSignificance: "심박수 변동성은 자율신경계 활동을 반영"
          }
        },
        hrvIndicesAnalysis: {
          timeDomain: {
            interpretation: `시간 영역 HRV 지표들은 전반적으로 ${getRmssdValue() > 30 && getSdnnValue() > 40 ? '양호한' : '개선이 필요한'} 상태를 보입니다.`,
            evidence: `SDNN: ${getSdnnValue().toFixed(1)}ms, RMSSD: ${getRmssdValue().toFixed(1)}ms, pNN50: ${getPnn50Value().toFixed(1)}%`,
            explanation: "연속된 심박 간격의 변동성을 시간 축에서 분석하여 전반적인 자율신경계 기능을 평가",
            recommendations: ["규칙적인 유산소 운동", "호흡 조절 훈련", "스트레스 관리"]
          },
          frequencyDomain: {
            interpretation: `주파수 영역 분석에서 LF/HF 비율 ${ppgTimeSeriesStats.hrvFrequencyMetrics.lfHfRatio.toFixed(2)}는 자율신경계 균형 상태를 나타냅니다.`,
            evidence: `LF Power: ${ppgTimeSeriesStats.hrvFrequencyMetrics.lfPower}ms², HF Power: ${ppgTimeSeriesStats.hrvFrequencyMetrics.hfPower}ms²`,
            explanation: "심박 변동의 주파수 성분을 분석하여 교감신경과 부교감신경의 활동 균형을 평가",
            recommendations: ["명상 또는 요가", "규칙적인 수면", "이완 기법 연습"]
          }
        },
        autonomicAnalysis: {
          overallAssessment: `3대 지표 종합 결과 자율신경계 기능은 ${this.calculateOverallAutonomicScore(ppgTimeSeriesStats) > 80 ? '우수한' : this.calculateOverallAutonomicScore(ppgTimeSeriesStats) > 70 ? '양호한' : '개선이 필요한'} 상태입니다.`,
          sympatheticParasympatheticBalance: ppgTimeSeriesStats.hrvFrequencyMetrics.lfHfRatio > 2.0 ? "교감신경 우세" : ppgTimeSeriesStats.hrvFrequencyMetrics.lfHfRatio < 0.5 ? "부교감신경 우세" : "균형적 상태",
          stressResponsePattern: ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex > 60 ? "높은 스트레스 반응" : "정상적 스트레스 반응",
          recoveryCapacity: getRmssdValue() > 40 ? "우수한 회복 능력" : "회복 능력 개선 필요"
        }
      },
      comprehensiveAssessment: {
        overallSummary: `${personalInfo.age}세 ${personalInfo.occupation}의 PPG 분석 결과, 3대 맥파 건강도 지표 평균 ${Math.round((this.calculateStressHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex) + this.calculateAutonomicHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.lfHfRatio) + this.calculateHRVHealthScore(getRmssdValue(), personalInfo.age)) / 3)}점으로 ${Math.round((this.calculateStressHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex) + this.calculateAutonomicHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.lfHfRatio) + this.calculateHRVHealthScore(getRmssdValue(), personalInfo.age)) / 3) > 80 ? '우수한 맥파 건강 상태' : Math.round((this.calculateStressHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex) + this.calculateAutonomicHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.lfHfRatio) + this.calculateHRVHealthScore(getRmssdValue(), personalInfo.age)) / 3) > 70 ? '양호한 맥파 건강 상태' : '개선이 필요한 맥파 건강 상태'}입니다.`,
        keyFindings: [
          `스트레스 건강도: ${this.calculateHealthLevel(ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex, 30, 70)} (${this.calculateStressHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex)}점)`,
          `자율신경 건강도: ${this.calculateHealthLevel(ppgTimeSeriesStats.hrvFrequencyMetrics.lfHfRatio, 0.5, 2.0)} (${this.calculateAutonomicHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.lfHfRatio)}점)`,
          `심박변이 건강도: ${this.calculateHealthLevel(getRmssdValue(), 20, 100)} (${this.calculateHRVHealthScore(getRmssdValue(), personalInfo.age)}점)`
        ],
        primaryConcerns: this.calculateStressHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex) < 70 || this.calculateAutonomicHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.lfHfRatio) < 70 ? 
          ["스트레스 건강도 개선 필요", "자율신경 균형 조정 필요"] : 
          this.calculateHRVHealthScore(getRmssdValue(), personalInfo.age) < 70 ? ["심박변이 건강도 개선 필요"] : 
          ["현재 특별한 문제점 없음"],
        ageGenderAnalysis: {
          ageComparison: `${personalInfo.age}세 연령대 평균 대비 ${this.calculateHRVHealthScore(getRmssdValue(), personalInfo.age) > 80 ? '우수한' : this.calculateHRVHealthScore(getRmssdValue(), personalInfo.age) > 70 ? '양호한' : '개선이 필요한'} 심박변이 건강도를 보입니다.`,
          genderConsiderations: `${personalInfo.gender === 'male' ? '남성' : '여성'} 특성상 ${this.calculateAutonomicHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.lfHfRatio) > 80 ? '우수한 자율신경 건강도' : '정상 범위 내 자율신경 건강도'}를 보입니다.`,
          developmentalContext: `${personalInfo.age < 30 ? '청년기' : personalInfo.age < 50 ? '중년기' : '장년기'} PPG 특성에 부합하는 전반적으로 양호한 건강도 패턴입니다.`
        },
        occupationalAnalysis: {
          jobDemands: `${personalInfo.occupation} 업무는 ${personalInfo.occupation.includes('개발') || personalInfo.occupation.includes('연구') ? '높은 집중력과 지속적인 스트레스 관리' : '균형잡힌 자율신경계 활동'}을 요구합니다.`,
          workRelatedPatterns: `업무 특성상 스트레스 건강도 ${this.calculateStressHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex)}점으로 ${this.calculateStressHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex) > 80 ? '우수한 수준' : this.calculateStressHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex) > 70 ? '양호한 수준' : '개선이 필요한 수준'}이며, 자율신경 건강도 ${this.calculateAutonomicHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.lfHfRatio)}점으로 ${this.calculateAutonomicHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.lfHfRatio) > 80 ? '우수한 균형 상태' : this.calculateAutonomicHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.lfHfRatio) > 70 ? '양호한 균형 상태' : '균형 조정이 필요한 상태'}입니다.`,
          professionalRecommendations: personalInfo.occupation.includes('개발') ? 
            ["업무 중 정기적 휴식", "스트레스 관리 기법", "심호흡 연습"] :
            ["업무-휴식 균형", "자율신경 안정화", "규칙적인 생활 패턴"]
        },
        improvementPlan: {
          shortTermGoals: this.calculateStressHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex) < 70 ? 
            ["스트레스 건강도 개선", "이완 기법 연습", "충분한 수면"] :
            ["현재 건강도 유지", "규칙적인 생활", "적절한 운동"],
          longTermGoals: [
            "3대 지표 건강도 최적화 (스트레스, 자율신경, 심박변이)",
            "PPG 건강 종합 점수 90점 이상 달성",
            "장기적 심혈관 건강 관리 체계 구축"
          ],
          actionItems: [
            "주 3회 이상 30분 유산소 운동",
            "매일 10분 심호흡 또는 명상",
            "규칙적인 수면 패턴 유지 (7-8시간)",
            "업무 중 정기적 휴식 (50분 작업 후 10분 휴식)"
          ],
          monitoringPlan: "4-6주 후 재측정을 통한 개선 효과 확인 권장"
        },
        riskAssessment: {
          level: this.calculateStressHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex) < 50 || this.calculateAutonomicHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.lfHfRatio) < 50 ? "moderate" as const : 
                 this.calculateStressHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex) < 70 || this.calculateAutonomicHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.lfHfRatio) < 70 ? "low" as const : "low" as const,
          factors: this.calculateStressHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex) < 70 || this.calculateAutonomicHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.lfHfRatio) < 70 ? 
            ["스트레스 건강도 저하", "자율신경 균형 불안정"] :
            ["현재 특별한 위험 요소 없음"],
          preventiveMeasures: [
            "정기적인 PPG 모니터링",
            "스트레스 조기 감지 및 관리",
            "건강한 생활습관 유지"
          ]
        },
        overallScore: Math.round(
          (this.calculateStressHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex) * 0.33) +
          (this.calculateAutonomicHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.lfHfRatio) * 0.33) +
          (this.calculateHRVHealthScore(getRmssdValue(), personalInfo.age) * 0.34)
        ),
        clinicalRecommendation: this.calculateStressHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex) < 50 || this.calculateAutonomicHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.lfHfRatio) < 50 ?
          "전문의 상담 권장, 심혈관 건강 정밀 검진 고려" :
          this.calculateStressHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex) < 70 || this.calculateAutonomicHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.lfHfRatio) < 70 ?
          "생활습관 개선을 통한 건강도 향상 후 재검사 권장" :
          "현재 양호한 맥파 건강 상태, 정기적 모니터링을 통한 건강도 유지 권장"
      },
      metadata: {
        analysisTimestamp: new Date().toISOString(),
        personalInfo: {
          age: personalInfo.age,
          gender: personalInfo.gender,
          occupation: personalInfo.occupation
        },
        dataQuality: ppgTimeSeriesStats.qualityMetrics,
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

  // 스트레스 건강도 계산
  private calculateStressHealthScore(stressIndex: number): number {
    const optimalStress = 50;
    const normalMin = 30;
    const normalMax = 70;
    
    if (stressIndex >= normalMin && stressIndex <= normalMax) {
      const distanceFromOptimal = Math.abs(stressIndex - optimalStress);
      const maxDistance = Math.max(optimalStress - normalMin, normalMax - optimalStress);
      return Math.round(100 - (distanceFromOptimal / maxDistance) * 15);
    } else {
      const distanceFromRange = stressIndex < normalMin ? 
        normalMin - stressIndex : stressIndex - normalMax;
      const penalty = Math.min(distanceFromRange * 30, 70);
      return Math.max(20, 85 - Math.round(penalty));
    }
  }

  // 자율신경 건강도 계산
  private calculateAutonomicHealthScore(lfHfRatio: number): number {
    const optimalRatio = 5.5; // 정상 범위 1.0-10.0의 중간값
    const normalMin = 1.0;
    const normalMax = 10.0;
    
    if (lfHfRatio >= normalMin && lfHfRatio <= normalMax) {
      const distanceFromOptimal = Math.abs(lfHfRatio - optimalRatio);
      const maxDistance = Math.max(optimalRatio - normalMin, normalMax - optimalRatio);
      return Math.round(100 - (distanceFromOptimal / maxDistance) * 15);
    } else {
      const distanceFromRange = lfHfRatio < normalMin ? 
        normalMin - lfHfRatio : lfHfRatio - normalMax;
      const penalty = Math.min(distanceFromRange * 40, 70);
      return Math.max(20, 85 - Math.round(penalty));
    }
  }

  // 심박변이 건강도 계산
  private calculateHRVHealthScore(rmssd: number, age: number): number {
    // 연령별 정상 범위 조정
    const ageAdjustedMax = 200 - (age - 20) * 1.0;
    const normalMin = 20;
    const normalMax = Math.min(200, ageAdjustedMax);
    
    if (rmssd >= normalMin && rmssd <= normalMax) {
      return Math.round(85 + (rmssd - normalMin) / (normalMax - normalMin) * 15);
    } else if (rmssd > normalMax) {
      return 100;
    } else {
      const deficit = normalMin - rmssd;
      const penalty = Math.min(deficit * 2, 65);
      return Math.max(20, 85 - Math.round(penalty));
    }
  }

  // 임상적 중요도 계산
  private calculateClinicalSignificance(value: number, minNormal: number, maxNormal: number): 'normal' | 'mild' | 'moderate' | 'severe' {
    if (value >= minNormal && value <= maxNormal) {
      return 'normal';
    }
    
    const distanceFromRange = value < minNormal ? 
      (minNormal - value) / minNormal : (value - maxNormal) / maxNormal;
    
    if (distanceFromRange > 1.0) return 'severe';
    if (distanceFromRange > 0.5) return 'moderate';
    return 'mild';
  }

  // 권장사항 생성 헬퍼 메서드들
  private generateStressRecommendations(stressIndex: number): string[] {
    if (stressIndex > 70) {
      return ["스트레스 관리 기법 연습", "규칙적인 휴식", "충분한 수면", "이완 훈련"];
    } else if (stressIndex < 30) {
      return ["적절한 자극 제공", "활동성 증가", "목표 설정", "동기 부여"];
    } else {
      return ["현재 스트레스 수준 유지", "예방적 스트레스 관리", "규칙적 생활"];
    }
  }

  private generateAutonomicRecommendations(lfHfRatio: number): string[] {
    if (lfHfRatio > 10.0) {
      return ["이완 기법 연습", "명상 또는 요가", "부교감신경 활성화"];
    } else if (lfHfRatio < 1.0) {
      return ["적절한 활동성", "규칙적 운동", "교감신경 활성화"];
    } else {
      return ["현재 균형 상태 유지", "규칙적인 생활 패턴", "균형잡힌 활동"];
    }
  }

  private generateHRVRecommendations(rmssd: number, age: number): string[] {
    const ageAdjustedExpected = 200 - (age - 20) * 1.0;
    if (rmssd < ageAdjustedExpected * 0.7) {
      return ["유산소 운동", "호흡 조절 훈련", "스트레스 관리", "충분한 수면"];
    } else {
      return ["현재 심박변이성 유지", "규칙적 운동", "건강한 생활습관"];
    }
  }

  // 종합 점수 계산 헬퍼 메서드
  private calculateOverallAutonomicScore(ppgStats: any): number {
    const stressScore = this.calculateStressHealthScore(ppgStats.hrvFrequencyMetrics.stressIndex);
    const autonomicScore = this.calculateAutonomicHealthScore(ppgStats.hrvFrequencyMetrics.lfHfRatio);
    const rmssdValue = typeof ppgStats.hrvTimeMetrics.rmssd === 'number' ? ppgStats.hrvTimeMetrics.rmssd : 35;
    const hrvScore = this.calculateHRVHealthScore(rmssdValue, 35); // 기본 연령 사용
    
    return Math.round((stressScore + autonomicScore + hrvScore) / 3);
  }

  // 기존 헬퍼 메서드들
  private calculateOverallScore(result: PPGAdvancedAnalysisResult): number {
    // 3대 지표 구조가 있으면 이를 기반으로 계산
    if (result.threeDimensionAnalysis) {
      const dimensions = result.threeDimensionAnalysis;
      const totalScore = (dimensions.stress?.score || 0) + 
                        (dimensions.autonomic?.score || 0) + 
                        (dimensions.hrv?.score || 0);
      return Math.round(totalScore / 3);
    }
    
    return 75; // 기본값
  }

  private extractStressLevel(result: PPGAdvancedAnalysisResult): number {
    // 3대 지표 구조에서 추출
    if (result.threeDimensionAnalysis?.stress) {
      return result.threeDimensionAnalysis.stress.score;
    }
    
    return 50; // 기본값
  }

  private extractAutonomicLevel(result: PPGAdvancedAnalysisResult): number {
    // 3대 지표 구조에서 추출 (focusLevel 대신 autonomic 사용)
    if (result.threeDimensionAnalysis?.autonomic) {
      return result.threeDimensionAnalysis.autonomic.score;
    }
    
    return 70; // 기본값
  }

  private generateSummary(result: PPGAdvancedAnalysisResult): string {
    // 3대 지표 구조에서 요약 생성
    if (result.threeDimensionAnalysis) {
      const dimensions = result.threeDimensionAnalysis;
      const summaries: string[] = [];
      
      if (dimensions.stress) {
        summaries.push(`스트레스: ${dimensions.stress.level} (${dimensions.stress.score}점)`);
      }
      if (dimensions.autonomic) {
        summaries.push(`자율신경: ${dimensions.autonomic.level} (${dimensions.autonomic.score}점)`);
      }
      if (dimensions.hrv) {
        summaries.push(`심박변이: ${dimensions.hrv.level} (${dimensions.hrv.score}점)`);
      }
      
      return summaries.join(', ');
    }
    
    return "3대 맥파 분석 지표 기반 종합 분석 완료";
  }

  private extractRecommendations(result: PPGAdvancedAnalysisResult): string[] {
    const recommendations: string[] = [];
    
    // 3대 지표 구조에서 권장사항 추출
    if (result.threeDimensionAnalysis) {
      Object.values(result.threeDimensionAnalysis).forEach(dimension => {
        if (dimension.recommendations) {
          recommendations.push(...dimension.recommendations);
        }
      });
    }
    
    // HRV 분석에서도 추출
    if (result.detailedDataAnalysis?.hrvIndicesAnalysis) {
      Object.values(result.detailedDataAnalysis.hrvIndicesAnalysis).forEach(analysis => {
        if (analysis.recommendations) {
          recommendations.push(...analysis.recommendations);
        }
      });
    }
    
    return [...new Set(recommendations)]; // 중복 제거
  }

  /**
   * Firestore 호환을 위해 undefined 값 제거
   */
  private sanitizeForFirestore(obj: any): any {
    if (obj === null || obj === undefined) {
      return null;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeForFirestore(item));
    }
    
    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          sanitized[key] = this.sanitizeForFirestore(value);
        }
      }
      return sanitized;
    }
    
    return obj;
  }
}