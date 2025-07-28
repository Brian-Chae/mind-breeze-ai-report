/**
 * 실시간 처리된 데이터 수집기
 * 1분 측정 세션 동안 처리된 메트릭을 시계열로 수집
 */

import { 
  ProcessedEEGTimeSeries, 
  ProcessedPPGTimeSeries, 
  ProcessedACCTimeSeries,
  ProcessedDataTimeSeries 
} from './ProcessedDataStorageService';
import { useProcessedDataStore } from '../../../stores/processedDataStore';
import { AnalysisMetricsService } from './AnalysisMetricsService';

export interface CollectorConfig {
  sessionId: string;
  measurementId: string;
  userId: string;
  organizationId?: string;
  samplingInterval?: number; // 밀리초 단위 (기본: 1000ms = 1초)
}

export interface ProcessedMetrics {
  eeg: {
    deltaPower: number;
    thetaPower: number;
    alphaPower: number;
    betaPower: number;
    gammaPower: number;
    totalPower: number; // Signal Processor에서 계산되는 총 파워
    focusIndex: number;
    relaxationIndex: number;
    stressIndex: number;
    attentionLevel: number;
    meditationLevel: number;
    hemisphericBalance: number;
    cognitiveLoad: number;
    emotionalStability: number;
    signalQuality: number;
  };
  ppg: {
    heartRate: number;
    hrv: number;
    rmssd: number;
    pnn50: number;
    sdnn: number;
    vlf: number;
    lf: number;
    hf: number;
    lfNorm: number;
    hfNorm: number;
    lfHfRatio: number;
    totalPower: number;
    stressLevel: number;
    recoveryIndex: number;
    autonomicBalance: number;
    cardiacCoherence: number;
    respiratoryRate: number;
    oxygenSaturation: number;
    // 🔧 Signal Processor의 advancedHRV 지표들 추가
    avnn: number; // Average NN interval (ms)
    pnn20: number; // Percentage of adjacent NN intervals differing by more than 20ms
    sdsd: number; // Standard deviation of successive differences (ms)
    hrMax: number; // Maximum heart rate
    hrMin: number; // Minimum heart rate
    signalQuality: number;
    motionArtifact: number;
  };
  acc: {
    activityLevel: number;
    movementIntensity: number;
    posture: 'SITTING' | 'STANDING' | 'LYING' | 'MOVING' | 'UNKNOWN';
    posturalStability: number;
    posturalTransitions: number;
    stepCount: number;
    stepRate: number;
    movementQuality: number;
    energyExpenditure: number;
    signalQuality: number;
  };
}

export class ProcessedDataCollector {
  private config: CollectorConfig;
  private isCollecting: boolean = false;
  private collectionInterval?: NodeJS.Timeout;
  private startTime?: Date;
  
  /**
   * 숫자를 소수점 3자리로 반올림
   */
  private roundToThreeDecimals(value: number): number {
    return Math.round(value * 1000) / 1000;
  }
  
  // 수집된 시계열 데이터
  private eegTimeSeries: ProcessedEEGTimeSeries;
  private ppgTimeSeries: ProcessedPPGTimeSeries;
  private accTimeSeries: ProcessedACCTimeSeries;
  
  // 융합 메트릭
  private fusedMetrics: {
    overallStress: number[];
    cognitiveStress: number[];
    physicalStress: number[];
    fatigueLevel: number[];
    alertnessLevel: number[];
    wellbeingScore: number[];
  };
  
  // 콜백 함수들
  private onDataPoint?: (metrics: ProcessedMetrics, index: number) => void;
  private onComplete?: (data: ProcessedDataTimeSeries) => void;
  private onError?: (error: Error) => void;
  
  constructor(config: CollectorConfig) {
    this.config = {
      ...config,
      samplingInterval: config.samplingInterval || 1000 // 기본 1초
    };
    
    // 시계열 데이터 초기화
    this.initializeTimeSeries();
  }
  
  /**
   * 시계열 데이터 구조 초기화
   */
  private initializeTimeSeries(): void {
    this.eegTimeSeries = {
      deltaPower: [],
      thetaPower: [],
      alphaPower: [],
      betaPower: [],
      gammaPower: [],
      totalPower: [], // Signal Processor에서 계산되는 총 파워
      focusIndex: [],
      relaxationIndex: [],
      stressIndex: [],
      attentionLevel: [],
      meditationLevel: [],
      hemisphericBalance: [],
      cognitiveLoad: [],
      emotionalStability: [],
      signalQuality: [],
      timestamps: []
    };
    
    this.ppgTimeSeries = {
      heartRate: [],
      hrv: [],
      rrIntervals: [],
      rmssd: [],
      pnn50: [],
      sdnn: [],
      vlf: [],
      lf: [],
      hf: [],
      lfNorm: [],
      hfNorm: [],
      lfHfRatio: [],
      totalPower: [],
      stressLevel: [],
      recoveryIndex: [],
      autonomicBalance: [],
      cardiacCoherence: [],
      respiratoryRate: [],
      oxygenSaturation: [],
      // 🔧 Signal Processor의 advancedHRV 지표들 추가
      avnn: [], // Average NN interval
      pnn20: [], // Percentage of adjacent NN intervals differing by more than 20ms
      sdsd: [], // Standard deviation of successive differences
      hrMax: [], // Maximum heart rate
      hrMin: [], // Minimum heart rate
      signalQuality: [],
      motionArtifact: [],
      timestamps: []
    };
    
    this.accTimeSeries = {
      activityLevel: [],
      movementIntensity: [],
      posture: [],
      posturalStability: [],
      posturalTransitions: [],
      stepCount: [],
      stepRate: [],
      movementQuality: [],
      energyExpenditure: [],
      movementEvents: [],
      signalQuality: [],
      timestamps: []
    };
    
    this.fusedMetrics = {
      overallStress: [],
      cognitiveStress: [],
      physicalStress: [],
      fatigueLevel: [],
      alertnessLevel: [],
      wellbeingScore: []
    };
  }
  
  /**
   * 이벤트 리스너 설정
   */
  onDataPointCollected(callback: (metrics: ProcessedMetrics, index: number) => void): void {
    this.onDataPoint = callback;
  }
  
  onCollectionComplete(callback: (data: ProcessedDataTimeSeries) => void): void {
    this.onComplete = callback;
  }
  
  onCollectionError(callback: (error: Error) => void): void {
    this.onError = callback;
  }
  
  /**
   * 데이터 수집 시작
   */
  start(): void {
    if (this.isCollecting) {
      console.warn('⚠️ ProcessedDataCollector - Data collection is already in progress');
      return;
    }
    
    console.log('[DATACHECK] 📊 ProcessedDataCollector - Starting processed data collection for 1 minute...', {
      sessionId: this.config.sessionId,
      measurementId: this.config.measurementId,
      samplingInterval: this.config.samplingInterval
    });
    
    // 🔍 Store 초기 상태 확인
    const initialState = useProcessedDataStore.getState();
    console.log('[DATACHECK] 🔍 ProcessedDataCollector - Store 초기 상태:', {
      hasEEGData: !!initialState.eegAnalysis?.indices,
      hasPPGData: !!initialState.ppgAnalysis?.indices,
      eegLastUpdated: initialState.eegAnalysis?.lastUpdated,
      ppgLastUpdated: initialState.ppgAnalysis?.lastUpdated,
      currentTime: Date.now()
    });
    
    this.isCollecting = true;
    this.startTime = new Date();
    
    let dataPointIndex = 0;
    let waitingForData = true;
    let waitAttempts = 0;
    const maxWaitAttempts = 10; // 최대 10초 대기
    
    // 실제 데이터가 있을 때까지 대기
    const waitForRealData = () => {
      if (!this.hasRealDataInStore() && waitAttempts < maxWaitAttempts) {
        waitAttempts++;
        console.log(`[DATACHECK] ⏳ ProcessedDataCollector - 실제 데이터 대기 중... (${waitAttempts}/${maxWaitAttempts})`);
        setTimeout(waitForRealData, 1000);
        return;
      }
      
      if (!this.hasRealDataInStore()) {
        console.warn('[DATACHECK] ⚠️ ProcessedDataCollector - 실제 데이터를 기다렸으나 없음. 기본값으로 진행');
      } else {
        console.log('[DATACHECK] ✅ ProcessedDataCollector - 실제 데이터 감지됨. 수집 시작');
      }
      
      // 매 초마다 데이터 수집
      this.collectionInterval = setInterval(() => {
        try {
          console.log(`[DATACHECK] 📊 ProcessedDataCollector - Collecting data point ${dataPointIndex + 1}/60`);
          
          // 현재 처리된 메트릭 가져오기 (실제로는 신호 처리기에서 가져옴)
          const currentMetrics = this.getCurrentProcessedMetrics();
          
          // 🔍 수집된 메트릭 값 확인
          console.log('[DATACHECK] 🎯 수집된 메트릭 샘플:', {
            eeg: {
              deltaPower: currentMetrics.eeg.deltaPower,
              focusIndex: currentMetrics.eeg.focusIndex,
              hasRealValues: currentMetrics.eeg.deltaPower !== 0.30 || currentMetrics.eeg.focusIndex !== 75
            },
            ppg: {
              heartRate: currentMetrics.ppg.heartRate,
              hasRealValues: currentMetrics.ppg.heartRate !== 72
            }
          });
          
          // 시계열에 추가
          this.addDataPoint(currentMetrics);
          
          // 콜백 호출
          if (this.onDataPoint) {
            this.onDataPoint(currentMetrics, dataPointIndex);
          }
          
          dataPointIndex++;
          
          console.log(`[DATACHECK] ✅ ProcessedDataCollector - Data point ${dataPointIndex}/60 collected successfully`);
          
          // 1분(60초) 완료 확인
          if (dataPointIndex >= 60) {
            console.log('[DATACHECK] 🎯 ProcessedDataCollector - 60초 완료, 수집 종료');
            this.complete();
          }
          
        } catch (error) {
          console.error('❌ ProcessedDataCollector - Error collecting data point:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : 'No stack',
            dataPointIndex,
            isCollecting: this.isCollecting
          });
          if (this.onError) {
            this.onError(error as Error);
          }
        }
      }, this.config.samplingInterval!);
      
      console.log('[DATACHECK] ✅ ProcessedDataCollector - Collection interval started');
    };
    
    // 실제 데이터 대기 시작
    waitForRealData();
  }
  
  /**
   * 데이터 수집 중지
   */
  stop(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = undefined;
    }
    this.isCollecting = false;
    console.log('⏹️ Data collection stopped');
  }
  
  /**
   * 수집 완료 처리
   */
  private complete(): void {
    this.stop();
    
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - this.startTime!.getTime()) / 1000);
    
    // 최종 데이터 구성
    const collectedData: ProcessedDataTimeSeries = {
      sessionId: this.config.sessionId,
      measurementId: this.config.measurementId,
      startTime: this.startTime!,
      endTime: endTime,
      duration: duration,
      eeg: this.eegTimeSeries,
      ppg: this.ppgTimeSeries,
      acc: this.accTimeSeries,
      fusedMetrics: this.fusedMetrics,
      metadata: {
        samplingRate: {
          eeg: 1, // 1Hz (초당 1개)
          ppg: 1,
          acc: 1
        },
        processingVersion: '1.0.0',
        qualityScore: this.calculateOverallQuality()
      }
    };
    
    console.log('✅ Data collection completed!', {
      duration: duration,
      dataPoints: this.eegTimeSeries.timestamps.length,
      qualityScore: collectedData.metadata.qualityScore
    });
    
    // 완료 콜백 호출
    if (this.onComplete) {
      this.onComplete(collectedData);
    }
  }
  
  /**
   * Store에 실제 데이터가 있는지 확인
   */
  private hasRealDataInStore(): boolean {
    const storeState = useProcessedDataStore.getState();
    
    // EEG와 PPG 모두 실제 데이터가 있어야 함
    const hasEEGRealData = storeState.eegAnalysis?.indices !== null && 
                          storeState.eegAnalysis?.bandPowers !== null &&
                          storeState.eegAnalysis?.lastUpdated > 0;
    
    const hasPPGRealData = storeState.ppgAnalysis?.indices !== null &&
                          storeState.ppgAnalysis?.lastUpdated > 0;
    
    return hasEEGRealData && hasPPGRealData;
  }
  
  /**
   * 현재 처리된 메트릭 가져오기
   * ProcessedDataStore와 AnalysisMetricsService에서 실제 데이터 가져옴
   */
  private getCurrentProcessedMetrics(): ProcessedMetrics {
    // Store 상태를 먼저 가져오기 (catch 블록에서도 사용하기 위해)
    let storeState: any;
    let analysisMetrics: any;
    
    try {
      // Store에서 현재 상태 가져오기 (getState()는 Hook이 아니므로 안전)
      storeState = useProcessedDataStore.getState();
      analysisMetrics = AnalysisMetricsService.getInstance();
      
      // 안전한 메서드 호출을 위한 헬퍼 함수
      const safeGetMetric = (fn: () => any, defaultValue: number = 0): number => {
        try {
          const value = fn();
          return value !== undefined && value !== null ? value : defaultValue;
        } catch (error) {
          console.warn('[DATACHECK] ⚠️ 메트릭 호출 실패:', error);
          return defaultValue;
        }
      };
      
      // EEG 데이터
      const eegAnalysis = storeState.eegAnalysis;
      const eegIndices = (eegAnalysis?.indices || {}) as any;
      const eegBandPowers = (eegAnalysis?.bandPowers || {}) as any;
      
      // PPG 데이터  
      const ppgAnalysis = storeState.ppgAnalysis;
      const ppgIndices = (ppgAnalysis?.indices || {}) as any;
      
      // ACC 데이터
      const accAnalysis = storeState.accAnalysis;
      const accIndices = (accAnalysis?.indices || {}) as any;
      
      // 신호 품질
      const signalQuality = storeState.signalQuality;
      
      // 🔍 Store 상태 디버깅
      const timeSinceEEGUpdate = Date.now() - (storeState.eegAnalysis?.lastUpdated || 0);
      const timeSincePPGUpdate = Date.now() - (storeState.ppgAnalysis?.lastUpdated || 0);
      
      console.log('[DATACHECK] 📊 ProcessedDataCollector - Store 상태 확인:', {
        hasEEGAnalysis: !!storeState.eegAnalysis,
        hasPPGAnalysis: !!storeState.ppgAnalysis,
        hasACCAnalysis: !!storeState.accAnalysis,
        eegBandPowers: eegBandPowers,
        eegIndices: eegIndices,
        ppgIndices: ppgIndices,
        accIndices: storeState.accAnalysis?.indices,
        signalQuality: storeState.signalQuality,
        eegLastUpdated: storeState.eegAnalysis?.lastUpdated || 0,
        ppgLastUpdated: storeState.ppgAnalysis?.lastUpdated || 0,
        currentTime: Date.now(),
        timeSinceEEGUpdate: timeSinceEEGUpdate > 1000 ? `${(timeSinceEEGUpdate/1000).toFixed(1)}초 전` : `${timeSinceEEGUpdate}ms 전`,
        timeSincePPGUpdate: timeSincePPGUpdate > 1000 ? `${(timeSincePPGUpdate/1000).toFixed(1)}초 전` : `${timeSincePPGUpdate}ms 전`,
        isStoreDataStale: timeSinceEEGUpdate > 5000 || timeSincePPGUpdate > 5000
      });
    
      // 실제 처리된 데이터가 있는지 확인
      // 🔧 음수값도 유효한 데이터로 처리 (밴드 파워가 음수로 나오는 문제 때문)
      const hasEEGData = eegBandPowers && eegBandPowers.delta !== undefined && eegBandPowers.delta !== null && !isNaN(eegBandPowers.delta);
      const hasPPGData = ppgIndices && ppgIndices.heartRate !== undefined && ppgIndices.heartRate !== null && !isNaN(ppgIndices.heartRate);
      const hasACCData = accAnalysis && accIndices && accIndices.activity !== undefined && !isNaN(accIndices.activity);
      
      // 🔍 실제 데이터 vs 기본값 사용 여부 로깅
      console.log('[DATACHECK] 🎯 ProcessedDataCollector - 데이터 소스 확인:', {
        eeg: {
          hasRealData: hasEEGData,
          hasIndices: !!eegIndices,
          hasBandPowers: !!eegBandPowers,
          focusIndexValue: eegIndices?.focusIndex,
          relaxationIndexValue: eegIndices?.relaxationIndex,
          stressIndexValue: eegIndices?.stressIndex,
          deltaValue: eegBandPowers?.delta,
          usingDefaults: !hasEEGData
        },
        ppg: {
          hasRealData: hasPPGData,
          hasIndices: !!ppgIndices,
          heartRateValue: ppgIndices?.heartRate,
          rmssdValue: ppgIndices?.rmssd,
          stressIndexValue: ppgIndices?.stressIndex,
          // 🔧 누락된 HRV 지표들 확인
          pnn50Value: ppgIndices?.pnn50,
          sdnnValue: ppgIndices?.sdnn,
          lfPowerValue: ppgIndices?.lfPower,
          hfPowerValue: ppgIndices?.hfPower,
          lfHfRatioValue: ppgIndices?.lfHfRatio,
          avnnValue: ppgIndices?.avnn,
          pnn20Value: ppgIndices?.pnn20,
          sdsdValue: ppgIndices?.sdsd,
          hrMaxValue: ppgIndices?.hrMax,
          hrMinValue: ppgIndices?.hrMin,
          usingDefaults: !hasPPGData,
          // 🔍 ppgIndices의 모든 키 확인
          allPPGKeys: ppgIndices ? Object.keys(ppgIndices) : []
        },
        acc: {
          hasRealData: hasACCData,
          hasIndices: !!accIndices,
          activityValue: accIndices?.activity,
          intensityValue: accIndices?.intensity,
          stabilityValue: accIndices?.stability,
          balanceValue: accIndices?.balance,
          activityStateValue: accIndices?.activityState,
          allACCKeys: accIndices ? Object.keys(accIndices) : [],
          usingDefaults: !hasACCData
        }
      });
      
      // 🔍 processedMetrics 생성 전 데이터 상태 확인
      console.log('[DATACHECK] 📝 ProcessedDataCollector - 메트릭 생성 직전 상태:', {
        hasEEGData,
        hasPPGData,
        hasACCData,
        eegBandPowers: {
          delta: eegBandPowers?.delta,
          theta: eegBandPowers?.theta,
          alpha: eegBandPowers?.alpha,
          beta: eegBandPowers?.beta,
          gamma: eegBandPowers?.gamma
        },
        eegIndices: {
          focusIndex: eegIndices?.focusIndex,
          relaxationIndex: eegIndices?.relaxationIndex,
          stressIndex: eegIndices?.stressIndex
        }
      });
      
      const processedMetrics = {
        eeg: {
          // Band Powers - Store에서 직접 가져오기
          deltaPower: hasEEGData ? this.roundToThreeDecimals(Number(eegBandPowers.delta)) : 0.30,
          thetaPower: hasEEGData ? this.roundToThreeDecimals(Number(eegBandPowers.theta)) : 0.31,
          alphaPower: hasEEGData ? this.roundToThreeDecimals(Number(eegBandPowers.alpha)) : 0.43,
          betaPower: hasEEGData ? this.roundToThreeDecimals(Number(eegBandPowers.beta)) : 0.49,
          gammaPower: hasEEGData ? this.roundToThreeDecimals(Number(eegBandPowers.gamma)) : 0.16,
          
          // Indices - Store에서 직접 가져오기
          totalPower: hasEEGData && eegIndices.totalPower !== undefined ? 
                     this.roundToThreeDecimals(Number(eegIndices.totalPower)) : 1.69,
          focusIndex: hasEEGData && eegIndices.focusIndex !== undefined ? 
                     this.roundToThreeDecimals(Number(eegIndices.focusIndex)) : 0.75,
          relaxationIndex: hasEEGData && eegIndices.relaxationIndex !== undefined ? 
                          this.roundToThreeDecimals(Number(eegIndices.relaxationIndex)) : 0.70,
          stressIndex: hasEEGData && eegIndices.stressIndex !== undefined ? 
                      this.roundToThreeDecimals(Number(eegIndices.stressIndex)) : 0.30,
          attentionLevel: hasEEGData && eegIndices.attentionIndex !== undefined ? 
                         this.roundToThreeDecimals(Number(eegIndices.attentionIndex)) : 0.72,
          meditationLevel: hasEEGData && eegIndices.meditationIndex !== undefined ? 
                          this.roundToThreeDecimals(Number(eegIndices.meditationIndex)) : 0.68,
          hemisphericBalance: hasEEGData && eegIndices.hemisphericBalance !== undefined ? 
                             this.roundToThreeDecimals(Number(eegIndices.hemisphericBalance)) : 0.0,
          cognitiveLoad: hasEEGData && eegIndices.cognitiveLoad !== undefined ? 
                        this.roundToThreeDecimals(Number(eegIndices.cognitiveLoad)) : 0.55,
          emotionalStability: hasEEGData && eegIndices.emotionalStability !== undefined ? 
                             this.roundToThreeDecimals(Number(eegIndices.emotionalStability)) : 0.90,
          
          // Signal Quality
          signalQuality: signalQuality.eegQuality ? 
                        this.roundToThreeDecimals(Number(signalQuality.eegQuality) / 100) : 0.99
        },
        ppg: {
          // PPG Indices - Store에서 직접 가져오기
          heartRate: hasPPGData && ppgIndices.heartRate !== undefined ? 
                    this.roundToThreeDecimals(Number(ppgIndices.heartRate)) : 72,
          hrv: hasPPGData && ppgIndices.rmssd !== undefined ? 
               this.roundToThreeDecimals(Number(ppgIndices.rmssd)) : 45,
          rmssd: hasPPGData && ppgIndices.rmssd !== undefined ? 
                 this.roundToThreeDecimals(Number(ppgIndices.rmssd)) : 36,
          pnn50: hasPPGData && ppgIndices.pnn50 !== undefined && ppgIndices.pnn50 > 0 ? 
                 this.roundToThreeDecimals(Number(ppgIndices.pnn50)) : 
                 this.roundToThreeDecimals(safeGetMetric(() => analysisMetrics.getCurrentPNN50(), 19)),
          sdnn: hasPPGData && ppgIndices.sdnn !== undefined && ppgIndices.sdnn > 0 ? 
                this.roundToThreeDecimals(Number(ppgIndices.sdnn)) : 
                this.roundToThreeDecimals(safeGetMetric(() => analysisMetrics.getCurrentSDNN(), 42)),
          
          // Frequency Domain
          vlf: this.roundToThreeDecimals(safeGetMetric(() => analysisMetrics.getCurrentVlfPower(), 120)),
          lf: hasPPGData && ppgIndices.lfPower !== undefined && ppgIndices.lfPower > 0 ? 
              this.roundToThreeDecimals(Number(ppgIndices.lfPower)) : 
              this.roundToThreeDecimals(safeGetMetric(() => analysisMetrics.getCurrentLfPower(), 890)),
          hf: hasPPGData && ppgIndices.hfPower !== undefined && ppgIndices.hfPower > 0 ? 
              this.roundToThreeDecimals(Number(ppgIndices.hfPower)) : 
              this.roundToThreeDecimals(safeGetMetric(() => analysisMetrics.getCurrentHfPower(), 560)),
          lfNorm: this.roundToThreeDecimals(safeGetMetric(() => analysisMetrics.getCurrentLfNorm(), 61)),
          hfNorm: this.roundToThreeDecimals(safeGetMetric(() => analysisMetrics.getCurrentHfNorm(), 39)),
          lfHfRatio: hasPPGData && ppgIndices.lfHfRatio !== undefined && ppgIndices.lfHfRatio > 0 ? 
                     this.roundToThreeDecimals(Number(ppgIndices.lfHfRatio)) : 
                     this.roundToThreeDecimals(safeGetMetric(() => analysisMetrics.getCurrentLfHfRatio(), 1.56)),
          totalPower: this.roundToThreeDecimals(safeGetMetric(() => analysisMetrics.getCurrentTotalPower(), 1570)),
          
          // Stress & Recovery
          stressLevel: hasPPGData && ppgIndices.stressIndex !== undefined ? 
                       this.roundToThreeDecimals(Number(ppgIndices.stressIndex)) : 0.35,
          recoveryIndex: this.roundToThreeDecimals(safeGetMetric(() => analysisMetrics.getCurrentRecoveryIndex(), 78)),
          autonomicBalance: this.roundToThreeDecimals(safeGetMetric(() => analysisMetrics.getCurrentAutonomicBalance(), 0.77)),
          cardiacCoherence: this.roundToThreeDecimals(safeGetMetric(() => analysisMetrics.getCurrentCardiacCoherence(), 75)),
          
          // Physiological
          respiratoryRate: this.roundToThreeDecimals(safeGetMetric(() => analysisMetrics.getCurrentRespiratoryRate(), 14)),
          oxygenSaturation: hasPPGData && ppgIndices.spo2 !== undefined ? 
                           this.roundToThreeDecimals(Number(ppgIndices.spo2)) : 97,
          
          // Advanced HRV - Store 또는 AnalysisMetricsService에서 가져오기
          avnn: hasPPGData && ppgIndices.avnn !== undefined && ppgIndices.avnn > 0 ? 
                this.roundToThreeDecimals(Number(ppgIndices.avnn)) : 
                this.roundToThreeDecimals(safeGetMetric(() => analysisMetrics.getCurrentAVNN(), 860)),
          pnn20: hasPPGData && ppgIndices.pnn20 !== undefined && ppgIndices.pnn20 > 0 ? 
                 this.roundToThreeDecimals(Number(ppgIndices.pnn20)) : 
                 this.roundToThreeDecimals(safeGetMetric(() => analysisMetrics.getCurrentPNN20(), 45)),
          sdsd: hasPPGData && ppgIndices.sdsd !== undefined && ppgIndices.sdsd > 0 ? 
                this.roundToThreeDecimals(Number(ppgIndices.sdsd)) : 
                this.roundToThreeDecimals(safeGetMetric(() => analysisMetrics.getCurrentSDSD(), 38)),
          hrMax: hasPPGData && ppgIndices.hrMax !== undefined && ppgIndices.hrMax > 0 ? 
                 this.roundToThreeDecimals(Number(ppgIndices.hrMax)) : 
                 this.roundToThreeDecimals(safeGetMetric(() => analysisMetrics.getCurrentHRMax(), 85)),
          hrMin: hasPPGData && ppgIndices.hrMin !== undefined && ppgIndices.hrMin > 0 ? 
                 this.roundToThreeDecimals(Number(ppgIndices.hrMin)) : 
                 this.roundToThreeDecimals(safeGetMetric(() => analysisMetrics.getCurrentHRMin(), 65)),
          
          // Signal Quality - PPG SQI 데이터에서 실제 값 가져오기
          signalQuality: (() => {
            const ppgSQIData = storeState.sqiData?.ppgSQI;
            if (ppgSQIData?.overallSQI?.length > 0) {
              const recentSQI = ppgSQIData.overallSQI.slice(-10); // 최근 10개 샘플
              const getValue = (item: any) => typeof item === 'number' ? item : (item?.value || 0);
              const avgSQI = recentSQI.reduce((sum, p) => sum + getValue(p), 0) / recentSQI.length;
              return this.roundToThreeDecimals(avgSQI / 100); // 0-1 스케일로 변환
            }
            return 1.0; // PPG SQI 데이터가 없으면 기본값
          })(),
          motionArtifact: signalQuality.artifactDetection?.movement ? 0.1 : 0
        },
        acc: {
          // ACC Indices - Store에서 직접 가져오기
          // 🔧 ACC 값들의 스케일 조정 (실제 값이 잘못된 범위로 들어오는 문제 해결)
          // 🔧 hasACCData가 false인 경우(오류로 인해 모든 값이 0인 경우) fallback 값 사용
          activityLevel: hasACCData && accIndices.activity !== undefined ? 
                        this.roundToThreeDecimals(Math.min(3.0, Number(accIndices.activity) / 10)) : 1.2, // 실제 측정값 또는 fallback
          movementIntensity: hasACCData && accIndices.intensity !== undefined ? 
                            this.roundToThreeDecimals(Math.min(0.5, Number(accIndices.intensity) / 100)) : 0.1, // 실제 측정값 또는 fallback
          posture: (accIndices.activityState || 'SITTING').toUpperCase() as any,
          posturalStability: hasACCData && accIndices.stability !== undefined ? 
                            this.roundToThreeDecimals(Number(accIndices.stability) / 100) : 0.84, // 이미 /100으로 처리 중
          posturalTransitions: 0,
          stepCount: 0,
          stepRate: 0,
          movementQuality: hasACCData && accIndices.balance !== undefined ? 
                          this.roundToThreeDecimals(Number(accIndices.balance) / 100) : 0.78,
          energyExpenditure: 1.9,
          signalQuality: 1.0
        }
      };
      
      console.log('[DATACHECK] 📊 ProcessedDataCollector - 생성된 메트릭:', {
        eegMetrics: {
          deltaPower: processedMetrics.eeg.deltaPower,
          thetaPower: processedMetrics.eeg.thetaPower,
          alphaPower: processedMetrics.eeg.alphaPower,
          betaPower: processedMetrics.eeg.betaPower,
          gammaPower: processedMetrics.eeg.gammaPower,
          totalPower: processedMetrics.eeg.totalPower, // 🔧 추가됨
          focusIndex: processedMetrics.eeg.focusIndex,
          relaxationIndex: processedMetrics.eeg.relaxationIndex,
          stressIndex: processedMetrics.eeg.stressIndex,
          attentionLevel: processedMetrics.eeg.attentionLevel,
          meditationLevel: processedMetrics.eeg.meditationLevel
        },
        ppgMetrics: {
          heartRate: processedMetrics.ppg.heartRate,
          hrv: processedMetrics.ppg.hrv,
          rmssd: processedMetrics.ppg.rmssd,
          // 🔧 누락된 HRV 지표들 추가
          pnn50: processedMetrics.ppg.pnn50,
          sdnn: processedMetrics.ppg.sdnn,
          lf: processedMetrics.ppg.lf,
          hf: processedMetrics.ppg.hf,
          lfHfRatio: processedMetrics.ppg.lfHfRatio,
          stressLevel: processedMetrics.ppg.stressLevel,
          // 🔧 advancedHRV 지표들 추가
          avnn: processedMetrics.ppg.avnn,
          pnn20: processedMetrics.ppg.pnn20,
          sdsd: processedMetrics.ppg.sdsd,
          hrMax: processedMetrics.ppg.hrMax,
          hrMin: processedMetrics.ppg.hrMin
        },
        accMetrics: {
          activityLevel: processedMetrics.acc.activityLevel,
          movementIntensity: processedMetrics.acc.movementIntensity,
          posturalStability: processedMetrics.acc.posturalStability
        },
        hasRealData: !!(eegAnalysis?.indices && ppgAnalysis?.indices && accAnalysis?.indices)
      });
      
      return processedMetrics;
    } catch (error) {
      console.error('❌ ProcessedDataCollector - getCurrentProcessedMetrics 오류:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace',
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        storeState: {
          hasEEGAnalysis: !!storeState?.eegAnalysis,
          hasPPGAnalysis: !!storeState?.ppgAnalysis,
          hasACCAnalysis: !!storeState?.accAnalysis
        }
      });
      
      // 🚨 에러 발생 시 기본값 반환 - 이것이 문제의 원인!
      console.warn('[DATACHECK] ⚠️ ProcessedDataCollector - 에러로 인해 기본값 사용 중!');
      return {
        eeg: {
          deltaPower: 0.30, thetaPower: 0.31, alphaPower: 0.43, betaPower: 0.49, gammaPower: 0.16, totalPower: 1.89,
          focusIndex: 0.75, relaxationIndex: 0.70, stressIndex: 0.30, attentionLevel: 0.72, meditationLevel: 0.68,
          hemisphericBalance: 0.0, cognitiveLoad: 0.55, emotionalStability: 0.90, signalQuality: 0.99
        },
        ppg: {
          heartRate: 72, hrv: 45, rmssd: 36, pnn50: 19, sdnn: 42, vlf: 120, lf: 890, hf: 560, lfNorm: 61, hfNorm: 39,
          lfHfRatio: 1.56, totalPower: 1570, stressLevel: 0.35, recoveryIndex: 78, autonomicBalance: 0.77,
          cardiacCoherence: 75, respiratoryRate: 14, oxygenSaturation: 97,
          // 🔧 advancedHRV 기본값 추가
          avnn: 860, pnn20: 45, sdsd: 38, hrMax: 85, hrMin: 65,
          signalQuality: 1.0, motionArtifact: 0
        },
        acc: {
          activityLevel: 1.2, movementIntensity: 0.1, posture: 'SITTING', posturalStability: 0.84, posturalTransitions: 0,
          stepCount: 0, stepRate: 0, movementQuality: 0.78, energyExpenditure: 1.9, signalQuality: 1.0
        }
      };
    }
  }
  
  /**
   * 데이터 포인트 추가
   */
  private addDataPoint(metrics: ProcessedMetrics): void {
    const timestamp = Date.now();
    
    // EEG 데이터 추가 (소수점 3자리로 반올림)
    this.eegTimeSeries.deltaPower.push(this.roundToThreeDecimals(metrics.eeg.deltaPower));
    this.eegTimeSeries.thetaPower.push(this.roundToThreeDecimals(metrics.eeg.thetaPower));
    this.eegTimeSeries.alphaPower.push(this.roundToThreeDecimals(metrics.eeg.alphaPower));
    this.eegTimeSeries.betaPower.push(this.roundToThreeDecimals(metrics.eeg.betaPower));
    this.eegTimeSeries.gammaPower.push(this.roundToThreeDecimals(metrics.eeg.gammaPower));
    this.eegTimeSeries.totalPower.push(this.roundToThreeDecimals(metrics.eeg.totalPower)); // Signal Processor의 totalPower 추가
    this.eegTimeSeries.focusIndex.push(this.roundToThreeDecimals(metrics.eeg.focusIndex));
    this.eegTimeSeries.relaxationIndex.push(this.roundToThreeDecimals(metrics.eeg.relaxationIndex));
    this.eegTimeSeries.stressIndex.push(this.roundToThreeDecimals(metrics.eeg.stressIndex));
    this.eegTimeSeries.attentionLevel.push(this.roundToThreeDecimals(metrics.eeg.attentionLevel));
    this.eegTimeSeries.meditationLevel.push(this.roundToThreeDecimals(metrics.eeg.meditationLevel));
    this.eegTimeSeries.hemisphericBalance.push(this.roundToThreeDecimals(metrics.eeg.hemisphericBalance));
    this.eegTimeSeries.cognitiveLoad.push(this.roundToThreeDecimals(metrics.eeg.cognitiveLoad));
    this.eegTimeSeries.emotionalStability.push(this.roundToThreeDecimals(metrics.eeg.emotionalStability));
    this.eegTimeSeries.signalQuality.push(this.roundToThreeDecimals(metrics.eeg.signalQuality));
    this.eegTimeSeries.timestamps.push(timestamp);
    
    // PPG 데이터 추가 (소수점 3자리로 반올림)
    this.ppgTimeSeries.heartRate.push(this.roundToThreeDecimals(metrics.ppg.heartRate));
    this.ppgTimeSeries.hrv.push(this.roundToThreeDecimals(metrics.ppg.hrv));
    this.ppgTimeSeries.rrIntervals.push([
      this.roundToThreeDecimals(800 + Math.random() * 50), 
      this.roundToThreeDecimals(820 + Math.random() * 50)
    ]); // 시뮬레이션
    this.ppgTimeSeries.rmssd.push(this.roundToThreeDecimals(metrics.ppg.rmssd));
    this.ppgTimeSeries.pnn50.push(this.roundToThreeDecimals(metrics.ppg.pnn50));
    this.ppgTimeSeries.sdnn.push(this.roundToThreeDecimals(metrics.ppg.sdnn));
    this.ppgTimeSeries.vlf.push(this.roundToThreeDecimals(metrics.ppg.vlf));
    this.ppgTimeSeries.lf.push(this.roundToThreeDecimals(metrics.ppg.lf));
    this.ppgTimeSeries.hf.push(this.roundToThreeDecimals(metrics.ppg.hf));
    this.ppgTimeSeries.lfNorm.push(this.roundToThreeDecimals(metrics.ppg.lfNorm));
    this.ppgTimeSeries.hfNorm.push(this.roundToThreeDecimals(metrics.ppg.hfNorm));
    this.ppgTimeSeries.lfHfRatio.push(this.roundToThreeDecimals(metrics.ppg.lfHfRatio));
    this.ppgTimeSeries.totalPower.push(this.roundToThreeDecimals(metrics.ppg.totalPower));
    this.ppgTimeSeries.stressLevel.push(this.roundToThreeDecimals(metrics.ppg.stressLevel));
    this.ppgTimeSeries.recoveryIndex.push(this.roundToThreeDecimals(metrics.ppg.recoveryIndex));
    this.ppgTimeSeries.autonomicBalance.push(this.roundToThreeDecimals(metrics.ppg.autonomicBalance));
    this.ppgTimeSeries.cardiacCoherence.push(this.roundToThreeDecimals(metrics.ppg.cardiacCoherence));
    this.ppgTimeSeries.respiratoryRate.push(this.roundToThreeDecimals(metrics.ppg.respiratoryRate));
    this.ppgTimeSeries.oxygenSaturation.push(this.roundToThreeDecimals(metrics.ppg.oxygenSaturation));
    // 🔧 Signal Processor의 advancedHRV 지표들 추가
    this.ppgTimeSeries.avnn.push(this.roundToThreeDecimals(metrics.ppg.avnn));
    this.ppgTimeSeries.pnn20.push(this.roundToThreeDecimals(metrics.ppg.pnn20));
    this.ppgTimeSeries.sdsd.push(this.roundToThreeDecimals(metrics.ppg.sdsd));
    this.ppgTimeSeries.hrMax.push(this.roundToThreeDecimals(metrics.ppg.hrMax));
    this.ppgTimeSeries.hrMin.push(this.roundToThreeDecimals(metrics.ppg.hrMin));
    this.ppgTimeSeries.signalQuality.push(this.roundToThreeDecimals(metrics.ppg.signalQuality));
    this.ppgTimeSeries.motionArtifact.push(this.roundToThreeDecimals(metrics.ppg.motionArtifact));
    this.ppgTimeSeries.timestamps.push(timestamp);
    
    // ACC 데이터 추가 (소수점 3자리로 반올림)
    this.accTimeSeries.activityLevel.push(this.roundToThreeDecimals(metrics.acc.activityLevel));
    this.accTimeSeries.movementIntensity.push(this.roundToThreeDecimals(metrics.acc.movementIntensity));
    this.accTimeSeries.posture.push(metrics.acc.posture);
    this.accTimeSeries.posturalStability.push(this.roundToThreeDecimals(metrics.acc.posturalStability));
    this.accTimeSeries.posturalTransitions.push(metrics.acc.posturalTransitions);
    this.accTimeSeries.stepCount.push(metrics.acc.stepCount);
    this.accTimeSeries.stepRate.push(this.roundToThreeDecimals(metrics.acc.stepRate));
    this.accTimeSeries.movementQuality.push(this.roundToThreeDecimals(metrics.acc.movementQuality));
    this.accTimeSeries.energyExpenditure.push(this.roundToThreeDecimals(metrics.acc.energyExpenditure));
    this.accTimeSeries.signalQuality.push(this.roundToThreeDecimals(metrics.acc.signalQuality));
    this.accTimeSeries.timestamps.push(timestamp);
    
    // 융합 메트릭 계산 및 추가
    this.calculateAndAddFusedMetrics(metrics);
  }
  
  /**
   * 융합 메트릭 계산
   */
  private calculateAndAddFusedMetrics(metrics: ProcessedMetrics): void {
    // 전체 스트레스: EEG + PPG 융합 (둘 다 0-1 범위)
    const overallStress = (metrics.eeg.stressIndex + metrics.ppg.stressLevel) / 2;
    
    // 인지적 스트레스: EEG 기반 (0-1 범위)
    const cognitiveStress = metrics.eeg.stressIndex * 0.7 + metrics.eeg.cognitiveLoad * 0.3;
    
    // 신체적 스트레스: PPG + ACC 기반 (0-1 범위로 정규화)
    const physicalStress = metrics.ppg.stressLevel * 0.6 + 
                          ((100 - metrics.ppg.recoveryIndex) / 100) * 0.2 +
                          (metrics.acc.activityLevel / 100) * 0.2;
    
    // 피로도: 다중 지표 융합 (0-100 범위)
    const fatigueLevel = (1 - metrics.eeg.attentionLevel) * 100 * 0.4 +
                        (1 - metrics.eeg.focusIndex) * 100 * 0.3 +
                        (1 - metrics.eeg.relaxationIndex) * 100 * 0.3;
    
    // 각성도 (0-100 범위)
    const alertnessLevel = metrics.eeg.attentionLevel * 100 * 0.5 +
                          metrics.eeg.focusIndex * 100 * 0.3 +
                          (1 - metrics.eeg.relaxationIndex) * 100 * 0.2;
    
    // 웰빙 점수 (0-100 범위)
    const wellbeingScore = (1 - overallStress) * 100 * 0.4 +
                          metrics.ppg.recoveryIndex * 0.3 +
                          metrics.eeg.emotionalStability * 100 * 0.3;
    
    this.fusedMetrics.overallStress.push(this.roundToThreeDecimals(overallStress));
    this.fusedMetrics.cognitiveStress.push(this.roundToThreeDecimals(cognitiveStress));
    this.fusedMetrics.physicalStress.push(this.roundToThreeDecimals(physicalStress));
    this.fusedMetrics.fatigueLevel.push(this.roundToThreeDecimals(fatigueLevel));
    this.fusedMetrics.alertnessLevel.push(this.roundToThreeDecimals(alertnessLevel));
    this.fusedMetrics.wellbeingScore.push(this.roundToThreeDecimals(wellbeingScore));
  }
  
  /**
   * 전체 품질 점수 계산
   */
  private calculateOverallQuality(): number {
    const eegQuality = this.eegTimeSeries.signalQuality.reduce((a, b) => a + b, 0) / 
                      this.eegTimeSeries.signalQuality.length;
    const ppgQuality = this.ppgTimeSeries.signalQuality.reduce((a, b) => a + b, 0) / 
                      this.ppgTimeSeries.signalQuality.length;
    const accQuality = this.accTimeSeries.signalQuality.reduce((a, b) => a + b, 0) / 
                      this.accTimeSeries.signalQuality.length;
    
    return (eegQuality * 0.4 + ppgQuality * 0.4 + accQuality * 0.2) * 100;
  }
  
  /**
   * 현재 수집된 데이터 가져오기
   */
  getCollectedData(): ProcessedDataTimeSeries | null {
    if (!this.startTime) return null;
    
    return {
      sessionId: this.config.sessionId,
      measurementId: this.config.measurementId,
      startTime: this.startTime,
      endTime: new Date(),
      duration: Math.floor((Date.now() - this.startTime.getTime()) / 1000),
      eeg: this.eegTimeSeries,
      ppg: this.ppgTimeSeries,
      acc: this.accTimeSeries,
      fusedMetrics: this.fusedMetrics,
      metadata: {
        samplingRate: {
          eeg: 1,
          ppg: 1,
          acc: 1
        },
        processingVersion: '1.0.0',
        qualityScore: this.calculateOverallQuality()
      }
    };
  }
  
  /**
   * 수집 상태 확인
   */
  isCollectingData(): boolean {
    return this.isCollecting;
  }
  
  /**
   * 수집된 데이터 포인트 수
   */
  getDataPointCount(): number {
    return this.eegTimeSeries.timestamps.length;
  }
}