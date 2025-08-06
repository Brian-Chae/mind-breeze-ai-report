/**
 * 분석 파이프라인 오케스트레이터
 * EEG, PPG, 통합 분석을 순차적/병렬적으로 실행하는 시스템
 */

import { IAIEngine } from '../core/interfaces/IAIEngine';
import { aiEngineRegistry } from '../core/registry/AIEngineRegistry';
import { PersonalInfo, IntegratedAnalysisInput } from '../ai-engines/IntegratedAdvancedGeminiEngine';

// 파이프라인 설정 인터페이스
export interface PipelineConfig {
  personalInfo: PersonalInfo;
  measurementData: {
    eeg?: any; // EEG 데이터
    ppg?: any; // PPG 데이터
  };
  processedTimeSeries?: any; // 실제 시계열 데이터
  options?: {
    skipEEG?: boolean;
    skipPPG?: boolean;
    includeDetailedAnalysis?: boolean;
    preferredEngines?: {
      eeg?: string;
      ppg?: string;
      integrated?: string;
    };
  };
}

// 파이프라인 상태
export enum PipelineStatus {
  IDLE = 'idle',
  RUNNING_EEG = 'running_eeg',
  RUNNING_PPG = 'running_ppg',
  RUNNING_INTEGRATED = 'running_integrated',
  COMPLETED = 'completed',
  ERROR = 'error'
}

// 파이프라인 결과 인터페이스
export interface PipelineResult {
  eegAnalysis?: any; // EEGAdvancedAnalysisResult
  ppgAnalysis?: any; // PPGAdvancedAnalysisResult
  integratedAnalysis: any; // IntegratedAnalysisResult
  metadata: {
    totalDuration: number;
    apiCalls: number;
    timestamp: string;
    pipelineId: string;
    status: PipelineStatus;
    errors?: string[];
  };
}

// 파이프라인 진행 상황 콜백
export type PipelineProgressCallback = (status: PipelineStatus, progress: number, message: string) => void;

export class AnalysisPipelineOrchestrator {
  private eegEngine: IAIEngine | null = null;
  private ppgEngine: IAIEngine | null = null;
  private integratedEngine: IAIEngine | null = null;
  private currentStatus: PipelineStatus = PipelineStatus.IDLE;
  private progressCallback?: PipelineProgressCallback;
  private enginesInitialized = false;

  constructor() {
    // 생성자에서는 engines 초기화를 하지 않음 (지연 초기화)
  }

  /**
   * 엔진 초기화 (지연 초기화)
   */
  private ensureEnginesInitialized(): void {
    if (this.enginesInitialized) {
      return;
    }

    // engines가 아직 등록되지 않았다면 초기화 시도
    const engineCount = aiEngineRegistry.getStats().totalEngines;
    if (engineCount === 0) {
      console.log('🔄 Engines not found, attempting to initialize...');
      try {
        // engines 초기화 함수를 동적으로 import하여 실행
        const { initializeEngines } = require('../ai-engines');
        initializeEngines();
      } catch (error) {
        console.error('❌ Engine initialization failed:', error);
      }
    }

    // 기본 엔진 설정
    this.eegEngine = aiEngineRegistry.get('eeg-advanced-gemini-v1');
    this.ppgEngine = aiEngineRegistry.get('ppg-advanced-gemini-v1');
    this.integratedEngine = aiEngineRegistry.get('integrated-advanced-gemini-v1');

    if (!this.eegEngine) {
      console.warn('⚠️ EEG Advanced 엔진을 찾을 수 없습니다.');
    }
    if (!this.ppgEngine) {
      console.warn('⚠️ PPG Advanced 엔진을 찾을 수 없습니다.');
    }
    if (!this.integratedEngine) {
      console.error('❌ Integrated Advanced 엔진을 찾을 수 없습니다!');
      throw new Error('통합 분석 엔진이 등록되지 않았습니다.');
    }

    this.enginesInitialized = true;
    console.log('✅ Pipeline engines initialized successfully');
  }

  /**
   * 진행 상황 콜백 설정
   */
  public setProgressCallback(callback: PipelineProgressCallback): void {
    this.progressCallback = callback;
  }

  /**
   * 진행 상황 업데이트
   */
  private updateProgress(status: PipelineStatus, progress: number, message: string): void {
    this.currentStatus = status;
    if (this.progressCallback) {
      this.progressCallback(status, progress, message);
    }
    console.log(`📊 파이프라인 진행: [${status}] ${progress}% - ${message}`);
  }

  /**
   * 파이프라인 실행
   */
  public async runPipeline(config: PipelineConfig): Promise<PipelineResult> {
    // engines 초기화 확인
    this.ensureEnginesInitialized();
    
    const startTime = Date.now();
    const pipelineId = `pipeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const results: Partial<PipelineResult> = {
      metadata: {
        totalDuration: 0,
        apiCalls: 0,
        timestamp: new Date().toISOString(),
        pipelineId,
        status: PipelineStatus.IDLE,
        errors: []
      }
    };

    try {
      this.updateProgress(PipelineStatus.IDLE, 0, '파이프라인 시작 준비 중...');

      // 선호 엔진 설정
      if (config.options?.preferredEngines) {
        if (config.options.preferredEngines.eeg) {
          const customEEGEngine = aiEngineRegistry.get(config.options.preferredEngines.eeg);
          if (customEEGEngine) this.eegEngine = customEEGEngine;
        }
        if (config.options.preferredEngines.ppg) {
          const customPPGEngine = aiEngineRegistry.get(config.options.preferredEngines.ppg);
          if (customPPGEngine) this.ppgEngine = customPPGEngine;
        }
        if (config.options.preferredEngines.integrated) {
          const customIntegratedEngine = aiEngineRegistry.get(config.options.preferredEngines.integrated);
          if (customIntegratedEngine) this.integratedEngine = customIntegratedEngine;
        }
      }

      // Step 1 & 2: EEG와 PPG 분석 병렬 실행
      const analysisPromises: Promise<any>[] = [];
      
      if (!config.options?.skipEEG && config.measurementData.eeg && this.eegEngine) {
        this.updateProgress(PipelineStatus.RUNNING_EEG, 10, 'EEG 분석 시작...');
        // EEG 엔진이 기대하는 형식으로 데이터 변환
        const eegData = config.measurementData.eeg;
        
        // processedTimeSeries가 있으면 해당 데이터를 사용하고, 없으면 eegData 사용
        let eegTimeSeriesStats;
        
        if (config.processedTimeSeries) {
          console.log('📊 processedTimeSeries 데이터 활용');
          // processedTimeSeries가 직접 데이터를 포함하거나 eeg 하위에 있는 경우 모두 처리
          const timeSeriesData = config.processedTimeSeries.eeg || config.processedTimeSeries;
          
          // 이미 통계 형태인지 시계열 배열인지 확인
          if (timeSeriesData.bandPowers) {
            // 이미 통계 형태
            eegTimeSeriesStats = timeSeriesData;
          } else if (timeSeriesData.AlphaPower || timeSeriesData.alphaPower || 
                     timeSeriesData.DeltaPower || timeSeriesData.deltaPower ||
                     timeSeriesData.ThetaPower || timeSeriesData.thetaPower ||
                     timeSeriesData.BetaPower || timeSeriesData.betaPower ||
                     timeSeriesData.GammaPower || timeSeriesData.gammaPower) {
            // 시계열 배열 형태 - 실제 데이터에서 통계 계산
            console.log('🔍 시계열 데이터에서 실제 통계 계산');
            eegTimeSeriesStats = this.calculateEEGStatsFromTimeSeries(timeSeriesData);
          } else {
            // 기본 구조
            eegTimeSeriesStats = eegData;
          }
        } else {
          // bandPowers와 eegIndices가 최상위에 없으면 구조 재구성
          eegTimeSeriesStats = {
            bandPowers: eegData.bandPowers || {
              delta: { 
                mean: eegData.delta?.mean || 100, 
                std: eegData.delta?.std || 20, 
                min: eegData.delta?.min || 50, 
                max: eegData.delta?.max || 150 
              },
              theta: { 
                mean: eegData.theta?.mean || 100, 
                std: eegData.theta?.std || 20, 
                min: eegData.theta?.min || 50, 
                max: eegData.theta?.max || 150 
              },
              alpha: { 
                mean: eegData.alpha?.mean || 100, 
                std: eegData.alpha?.std || 20, 
                min: eegData.alpha?.min || 50, 
                max: eegData.alpha?.max || 150 
              },
              beta: { 
                mean: eegData.beta?.mean || 100, 
                std: eegData.beta?.std || 20, 
                min: eegData.beta?.min || 50, 
                max: eegData.beta?.max || 150 
              },
              gamma: { 
                mean: eegData.gamma?.mean || 100, 
                std: eegData.gamma?.std || 20, 
                min: eegData.gamma?.min || 50, 
                max: eegData.gamma?.max || 150 
              }
            },
            eegIndices: eegData.eegIndices || {
              engagementIndex: { 
                mean: eegData.engagementIndex?.mean || 50, 
                std: eegData.engagementIndex?.std || 15, 
                min: eegData.engagementIndex?.min || 20, 
                max: eegData.engagementIndex?.max || 80 
              },
              relaxationIndex: { 
                mean: eegData.relaxationIndex?.mean || 0.2, 
                std: eegData.relaxationIndex?.std || 0.02, 
                min: eegData.relaxationIndex?.min || 0.18, 
                max: eegData.relaxationIndex?.max || 0.22 
              },
              focusIndex: { 
                mean: eegData.focusIndex?.mean || 2.25, 
                std: eegData.focusIndex?.std || 0.5, 
                min: eegData.focusIndex?.min || 1.5, 
                max: eegData.focusIndex?.max || 3.0 
              },
              stressIndex: { 
                mean: eegData.stressIndex?.mean || 3.4, 
                std: eegData.stressIndex?.std || 0.6, 
                min: eegData.stressIndex?.min || 2.8, 
                max: eegData.stressIndex?.max || 4.0 
              },
              fatigueIndex: { 
                mean: eegData.fatigueIndex?.mean || 50, 
                std: eegData.fatigueIndex?.std || 15, 
                min: eegData.fatigueIndex?.min || 20, 
                max: eegData.fatigueIndex?.max || 80 
              },
              hemisphericBalance: { 
                mean: eegData.hemisphericBalance?.mean || eegData.hemisphericBalance || 0.0,
                std: eegData.hemisphericBalance?.std || 0.05,
                min: eegData.hemisphericBalance?.min || -0.1,
                max: eegData.hemisphericBalance?.max || 0.1
              },
              cognitiveLoad: { 
                mean: eegData.cognitiveLoad?.mean || eegData.cognitiveLoad || 1.5,
                std: eegData.cognitiveLoad?.std || 0.5,
                min: eegData.cognitiveLoad?.min || 0.5,
                max: eegData.cognitiveLoad?.max || 2.5
              },
              emotionalStability: { 
                mean: eegData.emotionalStability?.mean || eegData.emotionalStability || 0.8,
                std: eegData.emotionalStability?.std || 0.2,
                min: eegData.emotionalStability?.min || 0.4,
                max: eegData.emotionalStability?.max || 1.2
              }
            },
            qualityMetrics: eegData.qualityMetrics || {
              signalQuality: 80,
              artifactRatio: 0.1,
              validSegments: 90
            }
          };
        }
        
        const eegAnalysisData = {
          personalInfo: config.personalInfo,
          measurementData: {
            eegMetrics: eegTimeSeriesStats
          },
          eegTimeSeriesStats: eegTimeSeriesStats,
          // processedTimeSeries 데이터 추가
          processedTimeSeries: config.processedTimeSeries,
          // 원본 데이터 전달 (추가 디버깅용)
          rawData: config
        };
        
        console.log('🔍 EEG 분석 데이터 구조:', {
          hasProcessedTimeSeries: !!eegAnalysisData.processedTimeSeries,
          processedTimeSeriesKeys: eegAnalysisData.processedTimeSeries ? Object.keys(eegAnalysisData.processedTimeSeries) : [],
          hasEegTimeSeriesStats: !!eegAnalysisData.eegTimeSeriesStats,
          bandPowerSample: eegAnalysisData.eegTimeSeriesStats?.bandPowers?.alpha
        });
        analysisPromises.push(this.runEEGAnalysis(eegAnalysisData));
      }

      if (!config.options?.skipPPG && config.measurementData.ppg && this.ppgEngine) {
        this.updateProgress(PipelineStatus.RUNNING_PPG, 10, 'PPG 분석 시작...');
        
        // PPG 엔진이 기대하는 형식으로 데이터 변환
        const ppgData = config.measurementData.ppg;
        
        console.log('🔍 PPG 파이프라인 - processedTimeSeries 확인:', {
          hasProcessedTimeSeries: !!config.processedTimeSeries,
          processedTimeSeriesKeys: config.processedTimeSeries ? Object.keys(config.processedTimeSeries) : [],
          ppgDataKeys: Object.keys(ppgData),
          ppgTimeSeriesStatsExists: !!ppgData.ppgTimeSeriesStats
        });
        
        // processedTimeSeries에서 PPG 데이터 추출
        let ppgTimeSeriesStats;
        if (config.processedTimeSeries?.ppg) {
          console.log('✅ processedTimeSeries.ppg 데이터 사용');
          const processedPPGData = config.processedTimeSeries.ppg;
          
          // processedTimeSeries에서 실제 시계열 데이터로 통계 계산
          const heartRateStats = this.calculateStatistics(processedPPGData.heartRate || []);
          const rmssdStats = this.calculateStatistics(processedPPGData.rmssd || []);
          const sdnnStats = this.calculateStatistics(processedPPGData.sdnn || []);
          const pnn50Stats = this.calculateStatistics(processedPPGData.pnn50 || []);
          const pnn20Stats = this.calculateStatistics(processedPPGData.pnn20 || []);
          const avnnStats = this.calculateStatistics(processedPPGData.avnn || []);
          const sdsdStats = this.calculateStatistics(processedPPGData.sdsd || []);
          const lfStats = this.calculateStatistics(processedPPGData.lf || []);
          const hfStats = this.calculateStatistics(processedPPGData.hf || []);
          const vlfStats = this.calculateStatistics(processedPPGData.vlf || []);
          const totalPowerStats = this.calculateStatistics(processedPPGData.totalPower || []);
          const lfHfRatioStats = this.calculateStatistics(processedPPGData.lfHfRatio || []);
          const autonomicBalanceStats = this.calculateStatistics(processedPPGData.autonomicBalance || []);
          const stressLevelStats = this.calculateStatistics(processedPPGData.stressLevel || []);
          
          ppgTimeSeriesStats = {
            heartRate: {
              mean: heartRateStats.mean,
              std: heartRateStats.std,
              min: heartRateStats.min,
              max: heartRateStats.max
            },
            hrvTimeMetrics: {
              sdnn: sdnnStats.mean,
              rmssd: rmssdStats.mean,
              pnn50: pnn50Stats.mean,
              pnn20: pnn20Stats.mean,
              avnn: avnnStats.mean,
              sdsd: sdsdStats.mean
            },
            hrvFrequencyMetrics: {
              vlfPower: vlfStats.mean,
              lfPower: lfStats.mean,
              hfPower: hfStats.mean,
              totalPower: totalPowerStats.mean,
              lfHfRatio: lfHfRatioStats.mean,
              autonomicBalance: autonomicBalanceStats.mean,
              stressIndex: stressLevelStats.mean
            }
          };
          
          console.log('📊 processedTimeSeries 기반 PPG 통계:', {
            heartRate: ppgTimeSeriesStats.heartRate.mean,
            rmssd: ppgTimeSeriesStats.hrvTimeMetrics.rmssd,
            sdnn: ppgTimeSeriesStats.hrvTimeMetrics.sdnn,
            lfPower: ppgTimeSeriesStats.hrvFrequencyMetrics.lfPower,
            hfPower: ppgTimeSeriesStats.hrvFrequencyMetrics.hfPower
          });
        } else if (ppgData.ppgTimeSeriesStats) {
          console.log('✅ ppgTimeSeriesStats 구조화된 데이터 사용');
          // ppgTimeSeriesStats에서 mean 값 추출
          ppgTimeSeriesStats = {
            heartRate: ppgData.ppgTimeSeriesStats.heartRate || { mean: 75, std: 10, min: 50, max: 100 },
            hrvTimeMetrics: {
              sdnn: ppgData.ppgTimeSeriesStats.hrvTimeMetrics?.sdnn?.mean || ppgData.ppgTimeSeriesStats.hrvTimeMetrics?.sdnn || 50,
              rmssd: ppgData.ppgTimeSeriesStats.hrvTimeMetrics?.rmssd?.mean || ppgData.ppgTimeSeriesStats.hrvTimeMetrics?.rmssd || 40,
              pnn50: ppgData.ppgTimeSeriesStats.hrvTimeMetrics?.pnn50?.mean || ppgData.ppgTimeSeriesStats.hrvTimeMetrics?.pnn50 || 25,
              pnn20: ppgData.ppgTimeSeriesStats.hrvTimeMetrics?.pnn20?.mean || ppgData.ppgTimeSeriesStats.hrvTimeMetrics?.pnn20 || 50,
              avnn: ppgData.ppgTimeSeriesStats.hrvTimeMetrics?.avnn?.mean || ppgData.ppgTimeSeriesStats.hrvTimeMetrics?.avnn || 830,
              sdsd: ppgData.ppgTimeSeriesStats.hrvTimeMetrics?.sdsd?.mean || ppgData.ppgTimeSeriesStats.hrvTimeMetrics?.sdsd || 35
            },
            hrvFrequencyMetrics: {
              vlfPower: ppgData.ppgTimeSeriesStats.hrvFrequencyMetrics?.vlfPower?.mean || ppgData.ppgTimeSeriesStats.hrvFrequencyMetrics?.vlfPower || 300,
              lfPower: ppgData.ppgTimeSeriesStats.hrvFrequencyMetrics?.lfPower?.mean || ppgData.ppgTimeSeriesStats.hrvFrequencyMetrics?.lfPower || 1200,
              hfPower: ppgData.ppgTimeSeriesStats.hrvFrequencyMetrics?.hfPower?.mean || ppgData.ppgTimeSeriesStats.hrvFrequencyMetrics?.hfPower || 800,
              totalPower: ppgData.ppgTimeSeriesStats.hrvFrequencyMetrics?.totalPower?.mean || ppgData.ppgTimeSeriesStats.hrvFrequencyMetrics?.totalPower || 2300,
              lfHfRatio: ppgData.ppgTimeSeriesStats.hrvFrequencyMetrics?.lfHfRatio?.mean || ppgData.ppgTimeSeriesStats.hrvFrequencyMetrics?.lfHfRatio || 1.5,
              autonomicBalance: ppgData.ppgTimeSeriesStats.hrvFrequencyMetrics?.autonomicBalance?.mean || ppgData.ppgTimeSeriesStats.hrvFrequencyMetrics?.autonomicBalance || 1.5,
              stressIndex: ppgData.ppgTimeSeriesStats.hrvFrequencyMetrics?.stressIndex?.mean || ppgData.ppgTimeSeriesStats.hrvFrequencyMetrics?.stressIndex || 45
            }
          };
        } else {
          console.log('⚠️ PPG 데이터 구조 정규화 - 폴백 값 사용');
          // PPG 데이터 구조 정규화 - PPGAdvancedGeminiEngine 인터페이스에 맞게 숫자 값으로 변환
          ppgTimeSeriesStats = {
            hrvTimeMetrics: ppgData.hrvTimeMetrics || {
              sdnn: ppgData.sdnn?.mean || ppgData.hrvTimeMetrics?.sdnn || 50,
              rmssd: ppgData.rmssd?.mean || ppgData.hrvTimeMetrics?.rmssd || 40,
              pnn50: ppgData.pnn50?.mean || ppgData.hrvTimeMetrics?.pnn50 || 25,
              pnn20: ppgData.pnn20?.mean || ppgData.hrvTimeMetrics?.pnn20 || 50,
              avnn: ppgData.avnn?.mean || ppgData.hrvTimeMetrics?.avnn || 830,
              sdsd: ppgData.sdsd?.mean || ppgData.hrvTimeMetrics?.sdsd || 35
            },
            heartRate: { 
              mean: ppgData.heartRate?.mean || 75, 
              std: ppgData.heartRate?.std || 10, 
              min: ppgData.heartRate?.min || 50, 
              max: ppgData.heartRate?.max || 100 
            },
            hrvFrequencyMetrics: ppgData.hrvFrequencyMetrics || {
              vlfPower: ppgData.vlf?.mean || ppgData.vlfPower || 300,
              lfPower: ppgData.lf?.mean || ppgData.lfPower || 1200,
              hfPower: ppgData.hf?.mean || ppgData.hfPower || 800,
              totalPower: ppgData.totalPower?.mean || ppgData.totalPower || 2300,
              lfHfRatio: ppgData.lfHfRatio?.mean || ppgData.lfHfRatio || 1.5,
              autonomicBalance: ppgData.autonomicBalance?.mean || ppgData.autonomicBalance || ppgData.lfHfRatio?.mean || ppgData.lfHfRatio || 1.5,
              stressIndex: ppgData.stressLevel?.mean || ppgData.stressIndex?.mean || ppgData.stressIndex || 45
            }
          };
        }
        
        // 나머지 PPG 메트릭 추가
        const finalPPGTimeSeriesStats = {
          ...ppgTimeSeriesStats,
          oxygenSaturation: { 
            mean: ppgData.oxygenSaturation?.mean || 97, 
            std: ppgData.oxygenSaturation?.std || 1.5, 
            min: ppgData.oxygenSaturation?.min || 95, 
            max: ppgData.oxygenSaturation?.max || 100 
          },
          pulseWaveMetrics: ppgData.pulseWaveMetrics || {
            amplitude: { mean: 1.0, std: 0.2, min: 0.5, max: 1.5 },
            peakTime: { mean: 150, std: 20, min: 100, max: 200 },
            augmentationIndex: { mean: 20, std: 10, min: -10, max: 50 }
          },
          bloodPressureEstimates: ppgData.bloodPressureEstimates || {
            systolic: { mean: 120, std: 15, min: 90, max: 160 },
            diastolic: { mean: 80, std: 10, min: 60, max: 100 }
          },
          qualityMetrics: ppgData.qualityMetrics || {
            signalQuality: 0.8,
            measurementDuration: 60
          },
          // RR intervals 데이터 추가
          rrIntervals: ppgData.rrIntervals ? {
            values: Array.isArray(ppgData.rrIntervals) ? ppgData.rrIntervals : ppgData.rrIntervals.values || [],
            timestamps: ppgData.rrIntervals.timestamps,
            count: Array.isArray(ppgData.rrIntervals) ? ppgData.rrIntervals.length : ppgData.rrIntervals.count || ppgData.rrIntervals.values?.length || 0,
            quality: {
              validCount: ppgData.rrIntervals.quality?.validCount || (Array.isArray(ppgData.rrIntervals) ? ppgData.rrIntervals.length : ppgData.rrIntervals.values?.length || 0),
              artifactCount: ppgData.rrIntervals.quality?.artifactCount || 0,
              coverage: ppgData.rrIntervals.quality?.coverage || 1.0
            }
          } : undefined
        };
        
        const ppgAnalysisData = {
          personalInfo: config.personalInfo,
          measurementData: {
            ppgMetrics: finalPPGTimeSeriesStats
          },
          ppgTimeSeriesStats: finalPPGTimeSeriesStats
        };
        analysisPromises.push(this.runPPGAnalysis(ppgAnalysisData));
      }

      // 병렬 실행 및 결과 수집
      const analysisResults = await Promise.all(analysisPromises);
      
      // 결과 분리
      let eegResult = null;
      let ppgResult = null;
      let currentIndex = 0;

      if (!config.options?.skipEEG && config.measurementData.eeg && this.eegEngine) {
        eegResult = analysisResults[currentIndex++];
        results.eegAnalysis = eegResult;
        results.metadata!.apiCalls++;
        this.updateProgress(PipelineStatus.RUNNING_EEG, 40, 'EEG 분석 완료');
      }

      if (!config.options?.skipPPG && config.measurementData.ppg && this.ppgEngine) {
        ppgResult = analysisResults[currentIndex++];
        results.ppgAnalysis = ppgResult;
        results.metadata!.apiCalls++;
        this.updateProgress(PipelineStatus.RUNNING_PPG, 40, 'PPG 분석 완료');
      }

      // Step 3: 통합 분석
      this.updateProgress(PipelineStatus.RUNNING_INTEGRATED, 50, '통합 분석 시작...');
      
      // 디버깅: 통합 분석에 전달할 데이터 구조 확인
      console.log('🔍 파이프라인 오케스트레이터 - 통합 분석 전 데이터 확인:');
      console.log('EEG 분석 결과:', results.eegAnalysis ? '존재' : '없음');
      if (results.eegAnalysis) {
        console.log('EEG Analysis Keys:', Object.keys(results.eegAnalysis));
        console.log('EEG Analysis Type:', typeof results.eegAnalysis);
        if (results.eegAnalysis.analysisResult) {
          console.log('EEG analysisResult Keys:', Object.keys(results.eegAnalysis.analysisResult));
        }
        if (results.eegAnalysis.rawData) {
          console.log('EEG rawData Keys:', Object.keys(results.eegAnalysis.rawData));
        }
      }
      
      console.log('PPG 분석 결과:', results.ppgAnalysis ? '존재' : '없음');
      if (results.ppgAnalysis) {
        console.log('PPG Analysis Keys:', Object.keys(results.ppgAnalysis));
        console.log('PPG Analysis Type:', typeof results.ppgAnalysis);
        if (results.ppgAnalysis.analysisResult) {
          console.log('PPG analysisResult Keys:', Object.keys(results.ppgAnalysis.analysisResult));
        }
        if (results.ppgAnalysis.rawData) {
          console.log('PPG rawData Keys:', Object.keys(results.ppgAnalysis.rawData));
        }
      }
      
      const integratedInput: IntegratedAnalysisInput = {
        eegAnalysis: results.eegAnalysis,
        ppgAnalysis: results.ppgAnalysis,
        personalInfo: config.personalInfo,
        metadata: {
          measurementDuration: this.calculateMeasurementDuration(config.measurementData),
          measurementTime: new Date().toISOString(),
          deviceInfo: {
            eeg: config.measurementData.eeg?.deviceInfo,
            ppg: config.measurementData.ppg?.deviceInfo
          }
        }
      };

      const integratedResult = await this.runIntegratedAnalysis(integratedInput);
      results.integratedAnalysis = integratedResult;
      results.metadata!.apiCalls++;

      // 완료
      this.updateProgress(PipelineStatus.COMPLETED, 100, '파이프라인 완료!');
      
      // 메타데이터 업데이트
      results.metadata!.totalDuration = Date.now() - startTime;
      results.metadata!.status = PipelineStatus.COMPLETED;

      console.log('✅ 파이프라인 실행 완료:', {
        pipelineId,
        duration: `${results.metadata!.totalDuration}ms`,
        apiCalls: results.metadata!.apiCalls
      });

      return results as PipelineResult;

    } catch (error) {
      console.error('❌ 파이프라인 실행 중 오류:', error);
      
      this.updateProgress(PipelineStatus.ERROR, 0, `오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      
      results.metadata!.status = PipelineStatus.ERROR;
      results.metadata!.errors!.push(error instanceof Error ? error.message : '알 수 없는 오류');
      results.metadata!.totalDuration = Date.now() - startTime;
      
      // 오류가 발생해도 부분적인 결과는 반환
      if (!results.integratedAnalysis) {
        // 통합 분석이 실패한 경우 기본값 제공
        results.integratedAnalysis = {
          type: 'integrated-analysis',
          summary: '분석 중 오류가 발생했습니다.',
          overallSummary: {
            healthScore: 0,
            mainFindings: ['분석을 완료할 수 없습니다.'],
            urgentIssues: [],
            positiveAspects: []
          },
          personalizedAnalysis: {
            ageGenderAnalysis: {
              comparison: '분석 불가',
              risks: [],
              recommendations: []
            }
          },
          improvementPlan: {
            immediate: [],
            shortTerm: [],
            longTerm: []
          },
          confidence: 0,
          metadata: {
            analysisDate: new Date().toISOString(),
            engineVersion: '1.0.0',
            processingTime: 0,
            dataQuality: 'poor'
          }
        };
      }
      
      return results as PipelineResult;
    }
  }

  /**
   * EEG 분석 실행
   */
  private async runEEGAnalysis(data: any): Promise<any> {
    if (!this.eegEngine) {
      throw new Error('EEG 엔진이 초기화되지 않았습니다.');
    }

    console.log('🧠 EEG 분석 실행 중...');
    
    try {
      const result = await this.eegEngine.analyze(data);
      console.log('✅ EEG 분석 완료');
      return result;
    } catch (error) {
      console.error('❌ EEG 분석 실패:', error);
      throw error;
    }
  }

  /**
   * PPG 분석 실행
   */
  private async runPPGAnalysis(data: any): Promise<any> {
    if (!this.ppgEngine) {
      throw new Error('PPG 엔진이 초기화되지 않았습니다.');
    }

    console.log('💓 PPG 분석 실행 중...');
    
    try {
      const result = await this.ppgEngine.analyze(data);
      console.log('✅ PPG 분석 완료');
      return result;
    } catch (error) {
      console.error('❌ PPG 분석 실패:', error);
      throw error;
    }
  }

  /**
   * 통합 분석 실행
   */
  private async runIntegratedAnalysis(input: IntegratedAnalysisInput): Promise<any> {
    if (!this.integratedEngine) {
      throw new Error('통합 분석 엔진이 초기화되지 않았습니다.');
    }

    console.log('🔄 통합 분석 실행 중...');
    
    try {
      const result = await this.integratedEngine.analyze(input);
      console.log('✅ 통합 분석 완료');
      return result;
    } catch (error) {
      console.error('❌ 통합 분석 실패:', error);
      throw error;
    }
  }

  /**
   * 시계열 EEG 데이터에서 통계 계산
   */
  private calculateEEGStatsFromTimeSeries(timeSeriesData: any): any {
    console.log('📊 시계열 데이터에서 실제 통계 계산 시작');
    
    // 통계 계산 함수
    const calculateStats = (data: number[]) => {
      if (!Array.isArray(data) || data.length === 0) {
        return { mean: 0, std: 0, min: 0, max: 0 };
      }
      
      const mean = data.reduce((a, b) => a + b, 0) / data.length;
      const variance = data.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / data.length;
      const std = Math.sqrt(variance);
      const min = Math.min(...data);
      const max = Math.max(...data);
      
      return { mean, std, min, max };
    };

    // Band Powers 통계 계산
    const bandPowers: any = {};
    
    // Delta
    const deltaData = timeSeriesData.DeltaPower || timeSeriesData.deltaPower;
    if (deltaData && Array.isArray(deltaData)) {
      bandPowers.delta = calculateStats(deltaData);
      console.log('📊 Delta 통계:', bandPowers.delta);
    }
    
    // Theta
    const thetaData = timeSeriesData.ThetaPower || timeSeriesData.thetaPower;
    if (thetaData && Array.isArray(thetaData)) {
      bandPowers.theta = calculateStats(thetaData);
      console.log('📊 Theta 통계:', bandPowers.theta);
    }
    
    // Alpha  
    const alphaData = timeSeriesData.AlphaPower || timeSeriesData.alphaPower;
    if (alphaData && Array.isArray(alphaData)) {
      bandPowers.alpha = calculateStats(alphaData);
      console.log('📊 Alpha 통계:', bandPowers.alpha);
    }
    
    // Beta
    const betaData = timeSeriesData.BetaPower || timeSeriesData.betaPower;
    if (betaData && Array.isArray(betaData)) {
      bandPowers.beta = calculateStats(betaData);
      console.log('📊 Beta 통계:', bandPowers.beta);
    }
    
    // Gamma
    const gammaData = timeSeriesData.GammaPower || timeSeriesData.gammaPower;
    if (gammaData && Array.isArray(gammaData)) {
      bandPowers.gamma = calculateStats(gammaData);
      console.log('📊 Gamma 통계:', bandPowers.gamma);
    }

    // EEG Indices 통계 계산
    const eegIndices: any = {};
    
    // Focus Index
    const focusData = timeSeriesData.FocusIndex || timeSeriesData.focusIndex;
    if (focusData && Array.isArray(focusData)) {
      eegIndices.focusIndex = calculateStats(focusData);
      console.log('📊 Focus Index 통계:', eegIndices.focusIndex);
    }
    
    // Relaxation Index
    const relaxationData = timeSeriesData.RelaxationIndex || timeSeriesData.relaxationIndex;
    if (relaxationData && Array.isArray(relaxationData)) {
      eegIndices.relaxationIndex = calculateStats(relaxationData);
      console.log('📊 Relaxation Index 통계:', eegIndices.relaxationIndex);
    }
    
    // Stress Index
    const stressData = timeSeriesData.StressIndex || timeSeriesData.stressIndex;
    if (stressData && Array.isArray(stressData)) {
      eegIndices.stressIndex = calculateStats(stressData);
      console.log('📊 Stress Index 통계:', eegIndices.stressIndex);
    }
    
    // Hemispheric Balance
    const hemisphericData = timeSeriesData.HemisphericBalance || timeSeriesData.hemisphericBalance;
    if (hemisphericData && Array.isArray(hemisphericData)) {
      eegIndices.hemisphericBalance = calculateStats(hemisphericData);
      console.log('📊 Hemispheric Balance 통계:', eegIndices.hemisphericBalance);
    }
    
    // Cognitive Load
    const cognitiveData = timeSeriesData.CognitiveLoad || timeSeriesData.cognitiveLoad;
    if (cognitiveData && Array.isArray(cognitiveData)) {
      eegIndices.cognitiveLoad = calculateStats(cognitiveData);
      console.log('📊 Cognitive Load 통계:', eegIndices.cognitiveLoad);
    }
    
    // Emotional Stability
    const emotionalData = timeSeriesData.EmotionalStability || timeSeriesData.emotionalStability;
    if (emotionalData && Array.isArray(emotionalData)) {
      eegIndices.emotionalStability = calculateStats(emotionalData);
      console.log('📊 Emotional Stability 통계:', eegIndices.emotionalStability);
    }

    const result = {
      bandPowers,
      eegIndices,
      qualityMetrics: timeSeriesData.qualityMetrics || {
        signalQuality: 80,
        artifactRatio: 0.1,
        validSegments: 90
      }
    };
    
    console.log('✅ 시계열 통계 계산 완료:', result);
    return result;
  }

  /**
   * 배열 데이터의 통계 계산
   */
  private calculateStatistics(data: number[]): { mean: number; std: number; min: number; max: number } {
    if (!data || data.length === 0) {
      return { mean: 0, std: 0, min: 0, max: 0 };
    }
    
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const std = Math.sqrt(variance);
    const min = Math.min(...data);
    const max = Math.max(...data);
    
    return { mean, std, min, max };
  }

  /**
   * 측정 시간 계산
   */
  private calculateMeasurementDuration(measurementData: any): number {
    let duration = 0;
    
    if (measurementData.eeg?.duration) {
      duration = Math.max(duration, measurementData.eeg.duration);
    }
    
    if (measurementData.ppg?.duration) {
      duration = Math.max(duration, measurementData.ppg.duration);
    }
    
    return duration || 60; // 기본값 60초
  }

  /**
   * 현재 파이프라인 상태 조회
   */
  public getCurrentStatus(): PipelineStatus {
    return this.currentStatus;
  }

  /**
   * 파이프라인 재설정
   */
  public reset(): void {
    this.currentStatus = PipelineStatus.IDLE;
    this.progressCallback = undefined;
  }
}

// 싱글톤 인스턴스 export
export const pipelineOrchestrator = new AnalysisPipelineOrchestrator();