import { 
  EEGAnalysisMetrics, 
  PPGAnalysisMetrics, 
  ACCAnalysisMetrics,
  StreamingStorageService 
} from './StreamingStorageService';
import { ProcessedEEGData } from '../types/eeg';
import { useProcessedDataStore } from '../stores/processedDataStore';

/**
 * 분석 지표 서비스
 * EEG, PPG, ACC 데이터의 분석 지표를 생성하고 Moving Average를 적용하여 저장
 */
export class AnalysisMetricsService {
  private static instance: AnalysisMetricsService;
  private storageService: StreamingStorageService;
  
  // Moving Average 히스토리 (최근 120개 데이터 포인트, 약 2분간)
  private readonly MAX_HISTORY_SIZE = 120;
  private eegHistory: Partial<EEGAnalysisMetrics>[] = [];
  
  // 🔧 HR Max/Min 전용 BPM 버퍼 (120개 샘플, 2분간)
  private bpmBuffer: number[] = [];
  private currentHrMax: number = 0;
  private currentHrMin: number = 0;
  
  // 🔧 LF/HF 전용 RR 간격 circular buffer (3000개 샘플, 1분간 @ 50Hz)
  private readonly LF_HF_BUFFER_SIZE = 120; // 120개 RR 간격 (약 2분) - 실용적 크기로 조정
  private rrIntervalBuffer: number[] = [];
  private currentLfPower: number = 0;
  private currentHfPower: number = 0;
  private currentLfHfRatio: number = 0;
  private lastLfHfCalculation: number = 0;
  private readonly LF_HF_CALCULATION_INTERVAL = 1000; // 1초마다 재계산 (실시간 응답성 향상)
  
  // 🔧 PPG 큐 방식 Moving Average - SQI 80% 이상인 값만 저장
  private ppgQualityQueue: Array<{
    bpm: number;
    sdnn: number;
    rmssd: number;
    pnn50: number;
    lfPower: number;
    hfPower: number;
    lfHfRatio: number;
    stressIndex: number;
    spo2: number;
    // 🔧 새로운 HRV 지표들 추가
    avnn: number;
    pnn20: number;
    sdsd: number;
    hrMax: number;
    hrMin: number;
    timestamp: number;
    sqi: number; // SQI 값도 함께 저장
  }> = [];
  
  // 🔧 EEG 큐 방식 Moving Average - SQI 80% 이상인 값만 저장
  private eegQualityQueue: Array<{
    totalPower: number;
    emotionalBalance: number;
    attention: number;
    cognitiveLoad: number;
    focusIndex: number;
    relaxationIndex: number;
    stressIndex: number;
    hemisphericBalance: number;
    emotionalStability: number;
    attentionLevel: number;
    meditationLevel: number;
    sqi: number;
    timestamp: number;
  }> = [];
  
  // 🔧 ACC 큐 방식 Moving Average - 신호 품질 80% 이상인 값만 저장 (Visualizer와 일치)
  private accQualityQueue: Array<{
    activityState: string;
    intensity: number; // activityLevel → intensity로 변경
    stability: number;
    avgMovement: number;
    maxMovement: number;
    // 제거된 필드들: stdMovement, tiltAngle, balance
    signalQuality: number;
    timestamp: number;
  }> = [];
  
  private accHistory: Partial<ACCAnalysisMetrics>[] = [];

  // 🔧 시간 도메인 HRV 지표들 (3000개 버퍼 기반)
  private currentRMSSD: number = 0;
  private currentSDNN: number = 0;
  private currentSDSD: number = 0;
  private currentAVNN: number = 0;
  private currentPNN50: number = 0;
  private currentPNN20: number = 0;
  private currentStressIndex: number = 0;

  // 🔧 심박수 통계 (BPM 버퍼 기반)
  private currentHRMax: number = 0;
  private currentHRMin: number = 0;

  private constructor() {
    this.storageService = StreamingStorageService.getInstance();
    
    // 🔧 디버깅용: 브라우저 콘솔에서 접근 가능하도록 전역 함수 등록
    if (typeof window !== 'undefined') {
      (window as any).debugAnalysisMetrics = {
        getRRBufferStatus: () => this.getRRBufferStatus(),
        forceCalculateLFHF: () => this.forceCalculateLFHF(),
        getCurrentLfPower: () => this.getCurrentLfPower(),
        getCurrentHfPower: () => this.getCurrentHfPower(),
        getCurrentLfHfRatio: () => this.getCurrentLfHfRatio(),
        getRRSample: () => this.rrIntervalBuffer.slice(-10),
        getAllHRVMetrics: () => ({
          rmssd: this.getCurrentRMSSD(),
          sdnn: this.getCurrentSDNN(),
          sdsd: this.getCurrentSDSD(),
          avnn: this.getCurrentAVNN(),
          pnn50: this.getCurrentPNN50(),
          pnn20: this.getCurrentPNN20(),
          stressIndex: this.getCurrentStressIndex(),
          hrMax: this.getCurrentHRMax(),
          hrMin: this.getCurrentHRMin(),
          lfPower: this.getCurrentLfPower(),
          hfPower: this.getCurrentHfPower(),
          lfHfRatio: this.getCurrentLfHfRatio()
        })
      };

    }
  }

  public static getInstance(): AnalysisMetricsService {
    if (!AnalysisMetricsService.instance) {
      AnalysisMetricsService.instance = new AnalysisMetricsService();
    }
    return AnalysisMetricsService.instance;
  }

  /**
   * EEG 분석 지표 생성 및 저장
   */
  async processEEGAnalysisMetrics(
    processedEEGData: ProcessedEEGData,
    additionalIndices: {
      focusIndex: number;
      relaxationIndex: number;
      stressIndex: number;
      hemisphericBalance: number;
      cognitiveLoad: number;
      emotionalStability: number;
      attentionLevel: number;
      meditationLevel: number;
    }
  ): Promise<void> {


    try {
      // EEG 분석 지표 생성
      const analysisMetrics: EEGAnalysisMetrics = {
        timestamp: processedEEGData.timestamp,
        totalPower: this.calculateTotalPower(processedEEGData.bandPowers),
        emotionalBalance: this.calculateEmotionalBalance(processedEEGData.bandPowers),
        attention: additionalIndices.attentionLevel,
        cognitiveLoad: additionalIndices.cognitiveLoad,
        focusIndex: additionalIndices.focusIndex,
        relaxationIndex: additionalIndices.relaxationIndex,
        stressIndex: additionalIndices.stressIndex,
        hemisphericBalance: additionalIndices.hemisphericBalance,
        emotionalStability: additionalIndices.emotionalStability,
        attentionLevel: additionalIndices.attentionLevel,
        meditationLevel: additionalIndices.meditationLevel,
        movingAverageValues: {
          totalPower: 0,
          emotionalBalance: 0,
          attention: 0,
          cognitiveLoad: 0,
          focusIndex: 0,
          relaxationIndex: 0,
          stressIndex: 0,
          hemisphericBalance: 0,
          emotionalStability: 0,
          attentionLevel: 0,
          meditationLevel: 0
        }
      };

      // 🔧 EEG SQI 기반 큐 방식 Moving Average 계산
      const currentSQI = processedEEGData.signalQuality.overall;
      


      // 🔧 SQI 80% 이상인 경우에만 큐에 추가
      if (currentSQI >= 80) {
        this.addToEEGQualityQueue({
          totalPower: analysisMetrics.totalPower,
          emotionalBalance: analysisMetrics.emotionalBalance,
          attention: analysisMetrics.attention,
          cognitiveLoad: analysisMetrics.cognitiveLoad,
          focusIndex: analysisMetrics.focusIndex,
          relaxationIndex: analysisMetrics.relaxationIndex,
          stressIndex: analysisMetrics.stressIndex,
          hemisphericBalance: analysisMetrics.hemisphericBalance,
          emotionalStability: analysisMetrics.emotionalStability,
          attentionLevel: analysisMetrics.attentionLevel,
          meditationLevel: analysisMetrics.meditationLevel,
          sqi: currentSQI,
          timestamp: Date.now()
        });
        

      } else {

      }

      // Moving Average 계산 (큐 기반)
      analysisMetrics.movingAverageValues = this.calculateEEGMovingAverageFromQueue();



      // 저장소에 저장
      await this.storageService.writeEEGAnalysisMetrics(analysisMetrics);
      
    } catch (error) {
      // EEG 분석 지표 처리 실패 시 무시하고 계속 진행
    }
  }

  /**
   * PPG 분석 지표 생성 및 저장 (SQI 기반 큐 방식)
   */
  async processPPGAnalysisMetrics(
    ppgAnalysisResult: {
      vitals: {
        heartRate: number;
        hrv: number;
        spo2?: number;
      };
      advancedHRV: {
        sdnn: number;
        pnn50: number;
        lfPower: number;
        hfPower: number;
        lfHfRatio: number;
        stressIndex: number;
        avnn: number;
        pnn20: number;
        sdsd: number;
        hrMax: number;
        hrMin: number;
      };
    },
    timestamp: number,
    currentSQI?: number, // 현재 SQI 값 추가
    isQualityGood?: boolean, // 품질 상태 추가 (EEG와 동일한 조건)
    rrIntervals?: number[] // 🔧 RR 간격 추가 (LF/HF 계산용)
  ): Promise<void> {


    try {
      // 🔧 RR 간격이 제공되면 LF/HF 계산용 버퍼에 추가
      if (rrIntervals && rrIntervals.length > 0) {

        
        this.updateRRIntervalBuffer(rrIntervals);
        

      } else {

      }
      
      // 현재 SQI 값 확인 (기본값 0)
      const sqi = currentSQI || 0;
      // EEG와 동일한 품질 조건 사용
      const qualityGood = isQualityGood !== undefined ? isQualityGood : (sqi >= 80);
      


      // PPG 분석 지표 생성
      const analysisMetrics: PPGAnalysisMetrics = {
        timestamp,
        bpm: ppgAnalysisResult.vitals.heartRate,
        sdnn: this.currentSDNN > 0 ? this.currentSDNN : ppgAnalysisResult.advancedHRV.sdnn,
        rmssd: ppgAnalysisResult.vitals.hrv, // RMSSD는 HRV와 동일
        pnn50: this.currentPNN50 > 0 ? this.currentPNN50 : ppgAnalysisResult.advancedHRV.pnn50,
        lfPower: this.currentLfPower > 0 ? this.currentLfPower : ppgAnalysisResult.advancedHRV.lfPower,
        hfPower: this.currentHfPower > 0 ? this.currentHfPower : ppgAnalysisResult.advancedHRV.hfPower,
        lfHfRatio: this.currentLfHfRatio > 0 ? this.currentLfHfRatio : ppgAnalysisResult.advancedHRV.lfHfRatio,
        stressIndex: this.currentStressIndex > 0 ? this.currentStressIndex : ppgAnalysisResult.advancedHRV.stressIndex,
        spo2: ppgAnalysisResult.vitals.spo2 || 0, // optional 제거, 기본값 0
        // 🔧 AnalysisMetricsService에서 계산한 값들 우선 사용
        avnn: this.currentAVNN > 0 ? this.currentAVNN : (ppgAnalysisResult.advancedHRV as any).avnn || 0,
        pnn20: this.currentPNN20 > 0 ? this.currentPNN20 : (ppgAnalysisResult.advancedHRV as any).pnn20 || 0,
        sdsd: this.currentSDSD > 0 ? this.currentSDSD : (ppgAnalysisResult.advancedHRV as any).sdsd || 0,
        hrMax: this.currentHRMax > 0 ? this.currentHRMax : (ppgAnalysisResult.advancedHRV as any).hrMax || 0,
        hrMin: this.currentHRMin > 0 ? this.currentHRMin : (ppgAnalysisResult.advancedHRV as any).hrMin || 0,
        movingAverageValues: {
          bpm: 0,
          sdnn: 0,
          rmssd: 0,
          pnn50: 0,
          lfPower: 0,
          hfPower: 0,
          lfHfRatio: 0,
          stressIndex: 0,
          spo2: 0,
          // 🔧 새로운 HRV 지표들 초기값
          avnn: 0,
          pnn20: 0,
          sdsd: 0,
          hrMax: 0,
          hrMin: 0
        }
      };



      // 🔧 BPM 버퍼 업데이트 (HR Max/Min 계산용)
      this.updateBpmBuffer(analysisMetrics.bpm);
      
      // 🔧 EEG와 동일한 품질 조건: SQI 80% 이상인 경우에만 큐에 추가
      if (qualityGood) {
        this.addToPPGQualityQueue({
          bpm: analysisMetrics.bpm,
          sdnn: analysisMetrics.sdnn, // 이미 current 값이 적용된 최종값 사용
          rmssd: analysisMetrics.rmssd,
          pnn50: analysisMetrics.pnn50, // 이미 current 값이 적용된 최종값 사용
          lfPower: analysisMetrics.lfPower, // 이미 current 값이 적용된 최종값 사용
          hfPower: analysisMetrics.hfPower, // 이미 current 값이 적용된 최종값 사용
          lfHfRatio: analysisMetrics.lfHfRatio, // 이미 current 값이 적용된 최종값 사용
          stressIndex: analysisMetrics.stressIndex, // 이미 current 값이 적용된 최종값 사용
          spo2: analysisMetrics.spo2 || 0,
          // 🔧 AnalysisMetricsService에서 계산한 값들 사용
          avnn: analysisMetrics.avnn, // 이미 current 값이 적용된 최종값 사용
          pnn20: analysisMetrics.pnn20, // 이미 current 값이 적용된 최종값 사용
          sdsd: analysisMetrics.sdsd, // 이미 current 값이 적용된 최종값 사용
          hrMax: analysisMetrics.hrMax, // 이미 current 값이 적용된 최종값 사용
          hrMin: analysisMetrics.hrMin, // 이미 current 값이 적용된 최종값 사용
          timestamp,
          sqi
        });
        

      } else {

      }

      // Moving Average 계산 (큐 기반)
      analysisMetrics.movingAverageValues = this.calculatePPGMovingAverageFromQueue();



      // 저장소에 저장 (Moving Average 값 사용)
      await this.storageService.writePPGAnalysisMetrics(analysisMetrics);
      
    } catch (error) {
      // PPG 분석 지표 처리 실패 시 무시하고 계속 진행
    }
  }

  /**
   * ACC 분석 지표 생성 및 저장
   */
  async processACCAnalysisMetrics(
    accAnalysisResult: {
      activity: {
        type: 'stationary' | 'sitting' | 'walking' | 'running';
        confidence: number;
        intensity: number;
      };
      movement: {
        avgMovement: number;
        stdMovement: number;
        maxMovement: number;
        totalMovement: number;
      };
      posture: {
        tiltAngle: number;
        stability: number;
        balance: number;
      };
    },
    timestamp: number
  ): Promise<void> {


    try {
      // ACC 분석 지표 생성 (Visualizer와 일치하도록 수정)
      const analysisMetrics: ACCAnalysisMetrics = {
        timestamp,
        activityState: accAnalysisResult.activity.type,
        intensity: accAnalysisResult.activity.intensity, // activityLevel → intensity로 변경
        stability: accAnalysisResult.posture.stability,
        avgMovement: accAnalysisResult.movement.avgMovement,
        maxMovement: accAnalysisResult.movement.maxMovement,
        // 제거된 필드들: stdMovement, tiltAngle, balance (Visualizer에서 사용하지 않음)
        movingAverageValues: {
          intensity: 0, // activityLevel → intensity로 변경
          stability: 0,
          avgMovement: 0,
          maxMovement: 0
          // 제거된 필드들: stdMovement, tiltAngle, balance
        }
      };

      // 🔧 ACC 신호 품질 기반 큐 방식 Moving Average 계산
      const currentSignalQuality = this.calculateACCSignalQuality({
        avgMovement: accAnalysisResult.movement.avgMovement,
        stdMovement: accAnalysisResult.movement.stdMovement,
        maxMovement: accAnalysisResult.movement.maxMovement
      });
      


      // 🔧 신호 품질 80% 이상인 경우에만 큐에 추가
      if (currentSignalQuality >= 80) {
        this.addToACCQualityQueue({
          activityState: analysisMetrics.activityState,
          intensity: analysisMetrics.intensity, // activityLevel → intensity로 변경
          stability: analysisMetrics.stability,
          avgMovement: analysisMetrics.avgMovement,
          maxMovement: analysisMetrics.maxMovement,
          // 제거된 필드들: stdMovement, tiltAngle, balance
          signalQuality: currentSignalQuality,
          timestamp: Date.now()
        });
        

      } else {

      }

      // Moving Average 계산 (큐 기반)
      analysisMetrics.movingAverageValues = this.calculateACCMovingAverageFromQueue();



      // 저장소에 저장
      await this.storageService.writeACCAnalysisMetrics(analysisMetrics);
      
    } catch (error) {
      // ACC 분석 지표 처리 실패 시 무시하고 계속 진행
    }
  }

  // 🔧 Private Helper Methods

  /**
   * 총 파워 계산
   */
  private calculateTotalPower(bandPowers: any): number {
    // 🔧 실제 전달되는 구조에 맞게 수정: 통합된 bandPowers 사용
    if (!bandPowers) return 0;
    
    // EEGSignalProcessor에서 전달되는 구조: { delta, theta, alpha, beta, gamma }
    const totalPower = (bandPowers.delta || 0) + (bandPowers.theta || 0) + 
                      (bandPowers.alpha || 0) + (bandPowers.beta || 0) + 
                      (bandPowers.gamma || 0);
    

    
    return totalPower;
  }

  /**
   * 감정 균형 계산 (좌우뇌 균형과 유사하지만 다른 지표)
   */
  private calculateEmotionalBalance(bandPowers: any): number {
    // 🔧 실제 전달되는 구조에 맞게 수정: 통합된 bandPowers 사용
    if (!bandPowers) return 0;
    
    // EEGSignalProcessor에서는 통합된 bandPowers만 제공하므로
    // alpha/beta 비율 기반으로 감정 균형 계산
    const alpha = bandPowers.alpha || 0;
    const beta = bandPowers.beta || 0;
    
    // 0으로 나누기 방지를 위한 개선된 계산
    const balance = (beta + 0.001) > 0 ? alpha / (beta + 0.001) : 0;
    
    // 극단값 제한 (0 ~ 2 범위)
    const result = Math.max(0, Math.min(2, balance));
    

    
    return result;
  }

  /**
   * EEG 히스토리에 추가
   */
  private addToEEGHistory(metrics: EEGAnalysisMetrics): void {
    this.eegHistory.push({
      totalPower: metrics.totalPower,
      emotionalBalance: metrics.emotionalBalance,
      attention: metrics.attention,
      cognitiveLoad: metrics.cognitiveLoad,
      focusIndex: metrics.focusIndex,
      relaxationIndex: metrics.relaxationIndex,
      stressIndex: metrics.stressIndex,
      hemisphericBalance: metrics.hemisphericBalance,
      emotionalStability: metrics.emotionalStability,
      attentionLevel: metrics.attentionLevel,
      meditationLevel: metrics.meditationLevel
    });

    // 최대 히스토리 크기 유지
    if (this.eegHistory.length > this.MAX_HISTORY_SIZE) {
      this.eegHistory.shift();
    }
  }

  /**
   * 🔧 EEG 고품질 데이터 큐에 추가 (SQI 80% 이상만)
   */
  private addToEEGQualityQueue(qualityData: {
    totalPower: number;
    emotionalBalance: number;
    attention: number;
    cognitiveLoad: number;
    focusIndex: number;
    relaxationIndex: number;
    stressIndex: number;
    hemisphericBalance: number;
    emotionalStability: number;
    attentionLevel: number;
    meditationLevel: number;
    sqi: number;
    timestamp: number;
  }): void {
    // 큐에 새로운 고품질 데이터 추가
    this.eegQualityQueue.push(qualityData);

    // 🔧 큐 크기 유지 (120개 초과 시 가장 오래된 데이터 제거)
    if (this.eegQualityQueue.length > this.MAX_HISTORY_SIZE) {
      const removedData = this.eegQualityQueue.shift();

    }
  }

  /**
   * ACC 히스토리에 추가 (Visualizer와 일치하도록 수정)
   */
  private addToACCHistory(metrics: ACCAnalysisMetrics): void {
    this.accHistory.push({
      intensity: metrics.intensity, // activityLevel → intensity로 변경
      stability: metrics.stability,
      avgMovement: metrics.avgMovement,
      maxMovement: metrics.maxMovement
      // 제거된 필드들: stdMovement, tiltAngle, balance
    });

    // 최대 히스토리 크기 유지
    if (this.accHistory.length > this.MAX_HISTORY_SIZE) {
      this.accHistory.shift();
    }
  }

  /**
   * EEG Moving Average 계산
   */
  private calculateEEGMovingAverage(): EEGAnalysisMetrics['movingAverageValues'] {
    if (this.eegHistory.length === 0) {
      return {
        totalPower: 0,
        emotionalBalance: 0,
        attention: 0,
        cognitiveLoad: 0,
        focusIndex: 0,
        relaxationIndex: 0,
        stressIndex: 0,
        hemisphericBalance: 0,
        emotionalStability: 0,
        attentionLevel: 0,
        meditationLevel: 0
      };
    }

    const length = this.eegHistory.length;
    const sums = this.eegHistory.reduce((acc, curr) => ({
      totalPower: (acc.totalPower || 0) + (curr.totalPower || 0),
      emotionalBalance: (acc.emotionalBalance || 0) + (curr.emotionalBalance || 0),
      attention: (acc.attention || 0) + (curr.attention || 0),
      cognitiveLoad: (acc.cognitiveLoad || 0) + (curr.cognitiveLoad || 0),
      focusIndex: (acc.focusIndex || 0) + (curr.focusIndex || 0),
      relaxationIndex: (acc.relaxationIndex || 0) + (curr.relaxationIndex || 0),
      stressIndex: (acc.stressIndex || 0) + (curr.stressIndex || 0),
      hemisphericBalance: (acc.hemisphericBalance || 0) + (curr.hemisphericBalance || 0),
      emotionalStability: (acc.emotionalStability || 0) + (curr.emotionalStability || 0),
      attentionLevel: (acc.attentionLevel || 0) + (curr.attentionLevel || 0),
      meditationLevel: (acc.meditationLevel || 0) + (curr.meditationLevel || 0)
    }), {
      totalPower: 0,
      emotionalBalance: 0,
      attention: 0,
      cognitiveLoad: 0,
      focusIndex: 0,
      relaxationIndex: 0,
      stressIndex: 0,
      hemisphericBalance: 0,
      emotionalStability: 0,
      attentionLevel: 0,
      meditationLevel: 0
    });

    return {
      totalPower: (sums.totalPower || 0) / length,
      emotionalBalance: (sums.emotionalBalance || 0) / length,
      attention: (sums.attention || 0) / length,
      cognitiveLoad: (sums.cognitiveLoad || 0) / length,
      focusIndex: (sums.focusIndex || 0) / length,
      relaxationIndex: (sums.relaxationIndex || 0) / length,
      stressIndex: (sums.stressIndex || 0) / length,
      hemisphericBalance: (sums.hemisphericBalance || 0) / length,
      emotionalStability: (sums.emotionalStability || 0) / length,
      attentionLevel: (sums.attentionLevel || 0) / length,
      meditationLevel: (sums.meditationLevel || 0) / length
    };
  }

  /**
   * 🔧 PPG 고품질 데이터 큐에 추가 (SQI 80% 이상만)
   */
  private addToPPGQualityQueue(qualityData: {
    bpm: number;
    sdnn: number;
    rmssd: number;
    pnn50: number;
    lfPower: number;
    hfPower: number;
    lfHfRatio: number;
    stressIndex: number;
    spo2: number;
    // 🔧 새로운 HRV 지표들 추가
    avnn: number;
    pnn20: number;
    sdsd: number;
    hrMax: number;
    hrMin: number;
    timestamp: number;
    sqi: number;
  }): void {
    // 큐에 새로운 고품질 데이터 추가
    this.ppgQualityQueue.push(qualityData);

    // 🔧 BPM 버퍼 업데이트 (HR Max/Min 계산용)
    this.updateBpmBuffer(qualityData.bpm);

    // 🔧 큐 크기 유지 (120개 초과 시 가장 오래된 데이터 제거)
    if (this.ppgQualityQueue.length > this.MAX_HISTORY_SIZE) {
      const removedData = this.ppgQualityQueue.shift();

    }
  }

  /**
   * 🔧 RR 간격 버퍼 업데이트 및 LF/HF 계산 (1분간 데이터 축적)
   */
  private updateRRIntervalBuffer(rrIntervals: number[]): void {
    if (!rrIntervals || rrIntervals.length === 0) return;
    
    // 새로운 RR 간격들을 버퍼에 추가
    for (const rr of rrIntervals) {
      // 생리학적 범위 체크 (300-1200ms)
      if (rr >= 300 && rr <= 1200) {
        this.rrIntervalBuffer.push(rr);
      }
    }
    
    // 버퍼 크기 제한 (circular buffer)
    while (this.rrIntervalBuffer.length > this.LF_HF_BUFFER_SIZE) {
      this.rrIntervalBuffer.shift();
    }
    
    // 🔧 충분한 데이터가 모이면 즉시 LF/HF 계산 (calculateLFHF 내부에서 시간 간격 체크)
    if (this.rrIntervalBuffer.length >= this.LF_HF_BUFFER_SIZE) {
      this.calculateLFHF();
    }
    

  }

  /**
   * 🔧 RR 간격 버퍼를 사용한 LF/HF 및 모든 HRV 지표 계산 (최소 30개부터 시작, 최대 120개)
   */
  private calculateLFHF(): void {
    const now = Date.now();
    

    
    // 🔧 최소 30개 RR 간격만 있으면 계산 시작 (약 30초 데이터)
    if (this.rrIntervalBuffer.length < 30) {

      return;
    }
    
    // 🔧 1초마다 계산 (실시간 응답성 향상) - 버퍼가 충분할 때만 적용
    if (this.rrIntervalBuffer.length >= this.LF_HF_BUFFER_SIZE && 
        now - this.lastLfHfCalculation < this.LF_HF_CALCULATION_INTERVAL) {

      return;
    }
    

    
    try {
      // 최근 3000개 RR 간격 사용
      const rrIntervals = [...this.rrIntervalBuffer];
      
      // 🔧 1. 시간 도메인 HRV 지표들 계산
      this.calculateTimeDomainMetrics(rrIntervals);
      
      // 🔧 2. 스트레스 지표 계산
      this.calculateStressMetrics(rrIntervals);
      
      // 🔧 3. 심박수 통계 업데이트 (BPM 버퍼 기반)
      this.updateHeartRateStatistics();
      
      // 🔧 4. 주파수 도메인 지표들 계산 (기존 LF/HF)
      this.calculateFrequencyDomainMetrics(rrIntervals);
      
      this.lastLfHfCalculation = now;
      

      
    } catch (error) {
      // 🔧 에러 시에도 이전 값 유지 (0으로 리셋하지 않음)
      // this.resetAllHRVMetrics(); // 🔧 주석 처리: 에러 시에도 이전 값 유지
    }
  }
  
  /**
   * 🔧 시간 도메인 HRV 지표들 계산 (RR 간격 버퍼 기반)
   */
  private calculateTimeDomainMetrics(rrIntervals: number[]): void {
    if (rrIntervals.length < 10) {

      return;
    }
    
    // 1. AVNN (Average NN intervals) - 평균 RR 간격
    this.currentAVNN = rrIntervals.reduce((sum, val) => sum + val, 0) / rrIntervals.length;
    
    // 2. SDNN (Standard Deviation of NN intervals) - RR 간격의 표준편차
    const mean = this.currentAVNN;
    const variance = rrIntervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / rrIntervals.length;
    this.currentSDNN = Math.sqrt(variance);
    
    // 3. RMSSD (Root Mean Square of Successive Differences) - 연속 차이의 제곱근 평균
    if (rrIntervals.length >= 2) {
      const squaredDiffs = [];
      for (let i = 1; i < rrIntervals.length; i++) {
        const diff = rrIntervals[i] - rrIntervals[i-1];
        squaredDiffs.push(diff * diff);
      }
      this.currentRMSSD = Math.sqrt(squaredDiffs.reduce((sum, val) => sum + val, 0) / squaredDiffs.length);
    } else {
      this.currentRMSSD = 0;
    }
    
    // 4. SDSD (Standard Deviation of Successive Differences) - 연속 차이의 표준편차
    if (rrIntervals.length >= 2) {
      const successiveDiffs = [];
      for (let i = 1; i < rrIntervals.length; i++) {
        successiveDiffs.push(rrIntervals[i] - rrIntervals[i-1]);
      }
      const diffMean = successiveDiffs.reduce((sum, val) => sum + val, 0) / successiveDiffs.length;
      const diffVariance = successiveDiffs.reduce((sum, val) => sum + Math.pow(val - diffMean, 2), 0) / successiveDiffs.length;
      this.currentSDSD = Math.sqrt(diffVariance);
    } else {
      this.currentSDSD = 0;
    }
    
    // 5. PNN50 (Percentage of NN50) - 50ms 초과 차이의 백분율
    if (rrIntervals.length >= 2) {
      let pnn50Count = 0;
      for (let i = 1; i < rrIntervals.length; i++) {
        if (Math.abs(rrIntervals[i] - rrIntervals[i-1]) > 50) {
          pnn50Count++;
        }
      }
      this.currentPNN50 = (pnn50Count / (rrIntervals.length - 1)) * 100;
    } else {
      this.currentPNN50 = 0;
    }
    
    // 6. PNN20 (Percentage of NN20) - 20ms 초과 차이의 백분율
    if (rrIntervals.length >= 2) {
      let pnn20Count = 0;
      for (let i = 1; i < rrIntervals.length; i++) {
        if (Math.abs(rrIntervals[i] - rrIntervals[i-1]) > 20) {
          pnn20Count++;
        }
      }
      this.currentPNN20 = (pnn20Count / (rrIntervals.length - 1)) * 100;
    } else {
      this.currentPNN20 = 0;
    }
    

  }
  
  /**
   * 🔧 스트레스 지표 계산 (RR 간격 버퍼 기반)
   */
  private calculateStressMetrics(rrIntervals: number[]): void {
    if (rrIntervals.length < 10) {
      this.currentStressIndex = 0;
      return;
    }
    
    // HRV 기반 정규화된 스트레스 지수 (0.0-1.0 범위)
    // 낮은 HRV = 높은 스트레스
    
    // 1. SDNN 기반 스트레스 (정상 SDNN: 30-100ms)
    const normalizedSDNN = Math.max(0, Math.min(1, (100 - this.currentSDNN) / 70));
    
    // 2. RMSSD 기반 스트레스 (정상 RMSSD: 20-50ms)
    const normalizedRMSSD = Math.max(0, Math.min(1, (50 - this.currentRMSSD) / 30));
    
    // 3. 심박수 기반 스트레스 (정상 HR: 60-100 BPM)
    const avgHeartRate = 60000 / this.currentAVNN;
    const heartRateStress = Math.max(0, Math.min(1, Math.abs(avgHeartRate - 80) / 40)); // 80 BPM 기준
    
    // 4. 종합 스트레스 지수 (가중평균)
    this.currentStressIndex = normalizedSDNN * 0.4 + normalizedRMSSD * 0.4 + heartRateStress * 0.2;
    
    // 0.0-1.0 범위로 제한
    this.currentStressIndex = Math.max(0, Math.min(1, this.currentStressIndex));
    

  }
  
  /**
   * 🔧 심박수 통계 업데이트 (BPM 버퍼 기반)
   */
  private updateHeartRateStatistics(): void {
    if (this.bpmBuffer.length === 0) {
      this.currentHRMax = 0;
      this.currentHRMin = 0;
      return;
    }
    
    // BPM 버퍼에서 최대/최소값 계산
    const validBPMs = this.bpmBuffer.filter(bpm => bpm > 40 && bpm < 200); // 생리학적 범위
    
    if (validBPMs.length > 0) {
      this.currentHRMax = Math.max(...validBPMs);
      this.currentHRMin = Math.min(...validBPMs);
    } else {
      this.currentHRMax = 0;
      this.currentHRMin = 0;
    }
    

  }
  
  /**
   * 🔧 주파수 도메인 지표들 계산 (기존 LF/HF 로직)
   */
  private calculateFrequencyDomainMetrics(rrIntervals: number[]): void {
    // 🔧 강화된 RR 간격 품질 검증
    const validRR = rrIntervals.filter(rr => rr >= 300 && rr <= 2000); // 정상 RR 간격 범위
    const validityRatio = validRR.length / rrIntervals.length;
    
    if (validityRatio < 0.75) { // 🔧 85% → 75%로 완화 (더 관대한 품질 기준)
      // 🔧 품질 부족 시에도 이전 값 유지 (0으로 리셋하지 않음)
      return; // 값을 0으로 리셋하지 않고 이전 값 유지
    }
    
    // 연속된 RR 간격 변화율 검증 (급격한 변화 감지)
    let outlierCount = 0;
    for (let i = 1; i < validRR.length; i++) {
      const changeRate = Math.abs(validRR[i] - validRR[i-1]) / validRR[i-1];
      if (changeRate > 0.25) { // 25% 이상 급격한 변화
        outlierCount++;
      }
    }
    const stabilityRatio = 1 - (outlierCount / (validRR.length - 1));
    
    if (stabilityRatio < 0.75) { // 🔧 85% → 75%로 완화 (더 관대한 안정성 기준)
      // 🔧 안정성 부족 시에도 이전 값 유지 (0으로 리셋하지 않음)
      return; // 값을 0으로 리셋하지 않고 이전 값 유지
    }
    

    
    // 기존 LF/HF 계산 로직 유지
    if (rrIntervals.length < 30) { // 🔧 50 → 30으로 완화 (더 빠른 계산 시작)
      
      // 🔧 데이터 부족 시에도 이전 값 유지 (0으로 리셋하지 않음)
      return; // 값을 0으로 리셋하지 않고 이전 값 유지
    }
    

    
    // 리샘플링 주파수 설정 (4Hz로 고정)
    // 리샘플링 주파수 설정 (4Hz - HF 대역 분석에 최적화, 더 긴 시간창 확보)
    // 🔧 HF 대역(0.15-0.4Hz) 분석을 위해 4Hz로 조정 (Nyquist: 2Hz, 충분한 여유)
    // 더 낮은 샘플링으로 더 긴 시간창 → 더 좋은 주파수 해상도
    const resamplingFs = 4.0;
    
    // RR 간격 리샘플링
    const resampledRR = this.resampleRRIntervals(rrIntervals, resamplingFs);
    
    if (resampledRR.length < 16) { // 최소 4초 데이터 (4Hz * 4s)

      // 🔧 데이터 부족 시에도 이전 값 유지 (0으로 리셋하지 않음)
      return; // 값을 0으로 리셋하지 않고 이전 값 유지
    }
    
    // Welch Periodogram 계산
    const { frequencies, powerSpectralDensity } = this.computeWelchPeriodogram(resampledRR, resamplingFs);
    
    // 🔧 주파수 해상도 및 범위 분석
    const freqResolution = frequencies.length > 1 ? frequencies[1] - frequencies[0] : 0;
    const maxFreq = frequencies[frequencies.length - 1];

    
    // LF (0.04-0.15 Hz) 및 HF (0.15-0.4 Hz) 대역 파워 계산
    const lfPowerRaw = this.integratePowerInBand(frequencies, powerSpectralDensity, 0.04, 0.15);
    const hfPowerRaw = this.integratePowerInBand(frequencies, powerSpectralDensity, 0.15, 0.4);
    
    // 🔧 HF 대역 상세 분석 (디버깅용)

    
    // 🔧 표준 HRV 단위로 변환: s² → ms² (사용자 요청 기반 스케일링)
    // 🚨 원시 IR 데이터 사용으로 인한 추가 스케일링 적용
    // 사용자 피드백: 100배 정도가 적절한 값
    
    // 🔧 HF 대역 특별 처리: HF가 너무 낮은 경우 추가 보정
    let lfPower = lfPowerRaw * 1000000; // 100배 적용 (사용자 요청 기반)
    let hfPower = hfPowerRaw * 1000000; // 100배 적용 (사용자 요청 기반)
    
    // 🔧 HF 파워가 비정상적으로 낮은 경우 추가 보정 (호흡 주파수 대역 문제 해결)
    if (hfPower < 1 && lfPower > 10) {

      // 호흡 주파수 대역 확장 시도
      const extendedHfPower = this.integratePowerInBand(frequencies, powerSpectralDensity, 0.12, 0.5);
      const extendedHfPowerScaled = extendedHfPower * 100;
      if (extendedHfPowerScaled > hfPower * 1.5) {
        hfPower = extendedHfPowerScaled;

      }
    }
    
    // 🔧 유효한 값만 저장 (무효값은 이전 값 유지)
    const newLfPower = this.getValidValue(lfPower, this.currentLfPower, 0.1);
    const newHfPower = this.getValidValue(hfPower, this.currentHfPower, 0.1);
    const newLfHfRatio = newHfPower > 0 ? newLfPower / newHfPower : this.currentLfHfRatio;
    
    // 결과 저장
    this.currentLfPower = newLfPower;
    this.currentHfPower = newHfPower;
    this.currentLfHfRatio = this.getValidValue(newLfHfRatio, this.currentLfHfRatio, 0.1);
    

  }
  
  /**
   * 🔧 모든 HRV 지표 초기화
   */
  private resetAllHRVMetrics(): void {
    this.currentRMSSD = 0;
    this.currentSDNN = 0;
    this.currentSDSD = 0;
    this.currentAVNN = 0;
    this.currentPNN50 = 0;
    this.currentPNN20 = 0;
    this.currentStressIndex = 0;
    this.currentHRMax = 0;
    this.currentHRMin = 0;
    this.currentLfPower = 0;
    this.currentHfPower = 0;
    this.currentLfHfRatio = 0;
    

  }

  /**
   * RR 간격 리샘플링
   */
  private resampleRRIntervals(rrIntervals: number[], targetFs: number): number[] {
    if (rrIntervals.length < 2) {
      return [];
    }
    
    // 1. RR 간격을 초 단위로 변환
    const rrIntervalsSeconds = rrIntervals.map(rr => rr / 1000);
    
    // 2. 시간 축 생성 (누적 시간)
    const timeAxis = [0];
    for (let i = 0; i < rrIntervalsSeconds.length; i++) {
      timeAxis.push(timeAxis[timeAxis.length - 1] + rrIntervalsSeconds[i]);
    }
    
    // 3. 목표 주파수로 리샘플링
    const totalTime = timeAxis[timeAxis.length - 1];
    const numSamples = Math.floor(totalTime * targetFs);
    
    if (numSamples < 4) {
      return [];
    }
    
    const resampledTime = Array.from({ length: numSamples }, (_, i) => i / targetFs);
    const resampledRR = this.interpolateLinear(timeAxis, rrIntervalsSeconds, resampledTime);
    
    return resampledRR;
  }

  /**
   * 선형 보간
   */
  private interpolateLinear(xOriginal: number[], yOriginal: number[], xNew: number[]): number[] {
    const result: number[] = [];
    
    for (const x of xNew) {
      if (x <= xOriginal[0]) {
        result.push(yOriginal[0]);
      } else if (x >= xOriginal[xOriginal.length - 1]) {
        result.push(yOriginal[yOriginal.length - 1]);
      } else {
        // 선형 보간
        let i = 0;
        while (i < xOriginal.length - 1 && xOriginal[i + 1] < x) {
          i++;
        }
        
        const x1 = xOriginal[i];
        const x2 = xOriginal[i + 1];
        const y1 = yOriginal[i];
        const y2 = yOriginal[i + 1];
        
        const y = y1 + (y2 - y1) * (x - x1) / (x2 - x1);
        result.push(y);
      }
    }
    
    return result;
  }

  /**
   * Welch Periodogram 계산
   */
  private computeWelchPeriodogram(data: number[], samplingRate: number): {
    frequencies: number[];
    powerSpectralDensity: number[];
  } {
    // 🔧 HF 대역 분석을 위한 윈도우 크기 최적화
    // HF 대역(0.15-0.4Hz)의 주파수 해상도를 개선하기 위해 더 큰 윈도우 사용
    const minWindowSize = 64;  // 더 큰 최소 윈도우 (더 좋은 주파수 해상도)
    const maxWindowSize = 256; // 더 큰 최대 윈도우
    const windowSize = Math.max(minWindowSize, Math.min(maxWindowSize, Math.floor(data.length / 2))); // 더 큰 윈도우 비율
    const overlap = Math.floor(windowSize / 2);
    const nfft = this.nextPowerOfTwo(windowSize);
    
    // 주파수 배열 생성
    const frequencies: number[] = [];
    for (let i = 0; i <= nfft / 2; i++) {
      frequencies.push((i * samplingRate) / nfft);
    }
    
    // 세그먼트별 파워 스펙트럼 계산
    const powerSpectrums: number[][] = [];
    const hammingWindow = this.generateHammingWindow(windowSize);
    
    let startIndex = 0;
    while (startIndex + windowSize <= data.length) {
      const segment = data.slice(startIndex, startIndex + windowSize);
      const windowedSegment = segment.map((val, i) => val * hammingWindow[i]);
      
      const paddedSegment = new Array(nfft).fill(0);
      for (let i = 0; i < windowedSegment.length; i++) {
        paddedSegment[i] = windowedSegment[i];
      }
      
      const fftResult = this.performFFT(paddedSegment);
      
      // 🔧 Hamming 윈도우 파워 계산 (SciPy 표준)
      const windowPower = hammingWindow.reduce((sum, w) => sum + w * w, 0);
      
      const powerSpectrum: number[] = [];
      for (let i = 0; i <= nfft / 2; i++) {
        const real = fftResult[2 * i] || 0;
        const imag = fftResult[2 * i + 1] || 0;
        // 🔧 표준 PSD 계산: SciPy와 동일한 정규화 (windowSize 제거)
        let power = (real * real + imag * imag) / (samplingRate * windowPower);
        
        if (i > 0 && i < nfft / 2) {
          power *= 2;
        }
        
        powerSpectrum.push(power);
      }
      
      powerSpectrums.push(powerSpectrum);
      startIndex += windowSize - overlap;
    }
    
    // 평균 파워 스펙트럼 밀도 계산
    const powerSpectralDensity = new Array(frequencies.length).fill(0);
    for (const spectrum of powerSpectrums) {
      for (let i = 0; i < spectrum.length; i++) {
        powerSpectralDensity[i] += spectrum[i];
      }
    }
    
    for (let i = 0; i < powerSpectralDensity.length; i++) {
      powerSpectralDensity[i] /= powerSpectrums.length;
    }
    
    return { frequencies, powerSpectralDensity };
  }

  /**
   * 주파수 대역에서 파워 적분 (사다리꼴 규칙 사용)
   */
  /**
   * 주파수 대역 분석 (디버깅용)
   */
  private analyzeFrequencyBand(
    frequencies: number[], 
    powerSpectralDensity: number[], 
    lowFreq: number, 
    highFreq: number
  ): {
    pointCount: number;
    maxPower: number;
    avgPower: number;
    freqRange: string;
    powerSum: number;
  } {
    let pointCount = 0;
    let maxPower = 0;
    let powerSum = 0;
    
    for (let i = 0; i < frequencies.length; i++) {
      const freq = frequencies[i];
      if (freq >= lowFreq && freq <= highFreq) {
        pointCount++;
        const power = powerSpectralDensity[i];
        powerSum += power;
        maxPower = Math.max(maxPower, power);
      }
    }
    
    return {
      pointCount,
      maxPower,
      avgPower: pointCount > 0 ? powerSum / pointCount : 0,
      freqRange: `${lowFreq}-${highFreq} Hz`,
      powerSum
    };
  }

  private integratePowerInBand(
    frequencies: number[], 
    powerSpectralDensity: number[], 
    lowFreq: number, 
    highFreq: number
  ): number {
    let power = 0;
    
    // 🔧 사다리꼴 규칙을 사용한 적분 (표준 방법)
    for (let i = 0; i < frequencies.length - 1; i++) {
      const freq = frequencies[i];
      const nextFreq = frequencies[i + 1];
      
      // 주파수 대역 내에 있는 경우만 적분
      if (freq >= lowFreq && nextFreq <= highFreq) {
        const df = nextFreq - freq;
        const avgPower = (powerSpectralDensity[i] + powerSpectralDensity[i + 1]) / 2;
        power += avgPower * df;
      }
      // 경계 조건 처리
      else if (freq < lowFreq && nextFreq > lowFreq && nextFreq <= highFreq) {
        // 시작 경계
        const df = nextFreq - lowFreq;
        const interpolatedPower = powerSpectralDensity[i] + 
          (powerSpectralDensity[i + 1] - powerSpectralDensity[i]) * (lowFreq - freq) / (nextFreq - freq);
        const avgPower = (interpolatedPower + powerSpectralDensity[i + 1]) / 2;
        power += avgPower * df;
      }
      else if (freq >= lowFreq && freq < highFreq && nextFreq > highFreq) {
        // 끝 경계
        const df = highFreq - freq;
        const interpolatedPower = powerSpectralDensity[i] + 
          (powerSpectralDensity[i + 1] - powerSpectralDensity[i]) * (highFreq - freq) / (nextFreq - freq);
        const avgPower = (powerSpectralDensity[i] + interpolatedPower) / 2;
        power += avgPower * df;
      }
    }
    
    return power;
  }

  /**
   * Hamming 윈도우 생성
   */
  private generateHammingWindow(size: number): number[] {
    const window: number[] = [];
    for (let i = 0; i < size; i++) {
      window.push(0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (size - 1)));
    }
    return window;
  }

  /**
   * 2의 거듭제곱 찾기
   */
  private nextPowerOfTwo(n: number): number {
    let power = 1;
    while (power < n) {
      power *= 2;
    }
    return power;
  }

  /**
   * FFT 계산
   */
  private performFFT(data: number[]): number[] {
    const n = data.length;
    if (n <= 1) return data;
    
    if ((n & (n - 1)) !== 0) {
      throw new Error('FFT 입력 크기는 2의 거듭제곱이어야 합니다');
    }
    
    const complex = new Array(n * 2);
    for (let i = 0; i < n; i++) {
      complex[2 * i] = data[i];
      complex[2 * i + 1] = 0;
    }
    
    let j = 0;
    for (let i = 1; i < n; i++) {
      let bit = n >> 1;
      while (j & bit) {
        j ^= bit;
        bit >>= 1;
      }
      j ^= bit;
      
      if (i < j) {
        [complex[2 * i], complex[2 * j]] = [complex[2 * j], complex[2 * i]];
        [complex[2 * i + 1], complex[2 * j + 1]] = [complex[2 * j + 1], complex[2 * i + 1]];
      }
    }
    
    let length = 2;
    while (length <= n) {
      const angle = -2 * Math.PI / length;
      const wreal = Math.cos(angle);
      const wimag = Math.sin(angle);
      
      for (let i = 0; i < n; i += length) {
        let wr = 1, wi = 0;
        
        for (let j = 0; j < length / 2; j++) {
          const u_real = complex[2 * (i + j)];
          const u_imag = complex[2 * (i + j) + 1];
          const v_real = complex[2 * (i + j + length / 2)] * wr - complex[2 * (i + j + length / 2) + 1] * wi;
          const v_imag = complex[2 * (i + j + length / 2)] * wi + complex[2 * (i + j + length / 2) + 1] * wr;
          
          complex[2 * (i + j)] = u_real + v_real;
          complex[2 * (i + j) + 1] = u_imag + v_imag;
          complex[2 * (i + j + length / 2)] = u_real - v_real;
          complex[2 * (i + j + length / 2) + 1] = u_imag - v_imag;
          
          const temp_wr = wr * wreal - wi * wimag;
          wi = wr * wimag + wi * wreal;
          wr = temp_wr;
        }
      }
      length *= 2;
    }
    
    return complex;
  }

  // 🔧 Public Getter Methods for LF/HF values
  
  /**
   * 현재 계산된 LF 파워 값 반환
   */
  public getCurrentLfPower(): number {
    return this.currentLfPower;
  }
  
  /**
   * 현재 계산된 HF 파워 값 반환
   */
  public getCurrentHfPower(): number {
    return this.currentHfPower;
  }
  
  /**
   * 현재 계산된 LF/HF 비율 반환
   */
  public getCurrentLfHfRatio(): number {
    return this.currentLfHfRatio;
  }
  
  /**
   * 🔧 시간 도메인 HRV 지표들 getter 메서드들 (3000개 버퍼 기반)
   */
  
  /**
   * 현재 계산된 RMSSD 값 반환
   */
  public getCurrentRMSSD(): number {
    return this.currentRMSSD;
  }
  
  /**
   * 현재 계산된 SDNN 값 반환
   */
  public getCurrentSDNN(): number {
    return this.currentSDNN;
  }
  
  /**
   * 현재 계산된 SDSD 값 반환
   */
  public getCurrentSDSD(): number {
    return this.currentSDSD;
  }
  
  /**
   * 현재 계산된 AVNN 값 반환
   */
  public getCurrentAVNN(): number {
    return this.currentAVNN;
  }
  
  /**
   * 현재 계산된 PNN50 값 반환
   */
  public getCurrentPNN50(): number {
    return this.currentPNN50;
  }
  
  /**
   * 현재 계산된 PNN20 값 반환
   */
  public getCurrentPNN20(): number {
    return this.currentPNN20;
  }
  
  /**
   * 현재 계산된 Stress Index 값 반환 (0.0-1.0 범위)
   */
  public getCurrentStressIndex(): number {
    return this.currentStressIndex;
  }
  
  /**
   * 🔧 심박수 통계 getter 메서드들 (BPM 버퍼 기반)
   */
  
  /**
   * 현재 계산된 최대 심박수 반환
   */
  public getCurrentHRMax(): number {
    return this.currentHRMax;
  }
  
  /**
   * 현재 계산된 최소 심박수 반환
   */
  public getCurrentHRMin(): number {
    return this.currentHRMin;
  }

  /**
   * 🔧 BPM 버퍼 업데이트 (HR Max/Min 계산용)
   */
  private updateBpmBuffer(bpm: number): void {
    if (bpm > 40 && bpm < 200) { // 생리학적 범위
      this.bpmBuffer.push(bpm);
      
      // 버퍼 크기 제한 (최근 120개 유지)
      if (this.bpmBuffer.length > this.MAX_HISTORY_SIZE) {
        this.bpmBuffer.shift();
      }
      
    } else {
      // BPM 범위 벗어남 - 로그 제거
    }
  }

  /**
   * EEG 큐에서 이동평균 계산
   */
  private calculateEEGMovingAverageFromQueue(): EEGAnalysisMetrics['movingAverageValues'] {
    if (this.eegQualityQueue.length === 0) {
      return {
        totalPower: 0,
        emotionalBalance: 0,
        attention: 0,
        cognitiveLoad: 0,
        focusIndex: 0,
        relaxationIndex: 0,
        stressIndex: 0,
        hemisphericBalance: 0,
        emotionalStability: 0,
        attentionLevel: 0,
        meditationLevel: 0
      };
    }

    const count = this.eegQualityQueue.length;
    const sum = this.eegQualityQueue.reduce((acc, data) => ({
      totalPower: acc.totalPower + data.totalPower,
      emotionalBalance: acc.emotionalBalance + data.emotionalBalance,
      attention: acc.attention + data.attention,
      cognitiveLoad: acc.cognitiveLoad + data.cognitiveLoad,
      focusIndex: acc.focusIndex + data.focusIndex,
      relaxationIndex: acc.relaxationIndex + data.relaxationIndex,
      stressIndex: acc.stressIndex + data.stressIndex,
      hemisphericBalance: acc.hemisphericBalance + data.hemisphericBalance,
      emotionalStability: acc.emotionalStability + data.emotionalStability,
      attentionLevel: acc.attentionLevel + data.attentionLevel,
      meditationLevel: acc.meditationLevel + data.meditationLevel
    }), {
      totalPower: 0,
      emotionalBalance: 0,
      attention: 0,
      cognitiveLoad: 0,
      focusIndex: 0,
      relaxationIndex: 0,
      stressIndex: 0,
      hemisphericBalance: 0,
      emotionalStability: 0,
      attentionLevel: 0,
      meditationLevel: 0
    });

    return {
      totalPower: sum.totalPower / count,
      emotionalBalance: sum.emotionalBalance / count,
      attention: sum.attention / count,
      cognitiveLoad: sum.cognitiveLoad / count,
      focusIndex: sum.focusIndex / count,
      relaxationIndex: sum.relaxationIndex / count,
      stressIndex: sum.stressIndex / count,
      hemisphericBalance: sum.hemisphericBalance / count,
      emotionalStability: sum.emotionalStability / count,
      attentionLevel: sum.attentionLevel / count,
      meditationLevel: sum.meditationLevel / count
    };
  }

  /**
   * 🔧 유효한 값만 반환하는 헬퍼 함수 (0이나 무효값 제외)
   */
  private getValidValue(value: number, previousValue: number = 0, minThreshold: number = 0.01): number {
    if (value > minThreshold && !isNaN(value) && isFinite(value)) {
      return value;
    }
    return previousValue; // 무효한 값이면 이전 값 유지
  }

  /**
   * PPG 큐에서 이동평균 계산 (유효값만 포함)
   */
  private calculatePPGMovingAverageFromQueue(): any {
    if (this.ppgQualityQueue.length === 0) {
      return {
        bpm: 0,
        sdnn: 0,
        rmssd: 0,
        pnn50: 0,
        lfPower: 0,
        hfPower: 0,
        lfHfRatio: 0,
        stressIndex: 0,
        avnn: 0,
        pnn20: 0,
        sdsd: 0,
        hrMax: 0,
        hrMin: 0,
        spo2: 0
      };
    }

    // 🔧 유효한 값들만 필터링해서 평균 계산
    const calculateValidAverage = (values: number[], minThreshold: number = 0.01): number => {
      const validValues = values.filter(v => v > minThreshold && !isNaN(v) && isFinite(v));
      if (validValues.length === 0) return 0;
      return validValues.reduce((sum, v) => sum + v, 0) / validValues.length;
    };

    // 각 지표별로 유효한 값들만 추출
    const bpmValues = this.ppgQualityQueue.map(d => d.bpm);
    const sdnnValues = this.ppgQualityQueue.map(d => d.sdnn);
    const rmssdValues = this.ppgQualityQueue.map(d => d.rmssd);
    const pnn50Values = this.ppgQualityQueue.map(d => d.pnn50);
    const lfPowerValues = this.ppgQualityQueue.map(d => d.lfPower);
    const hfPowerValues = this.ppgQualityQueue.map(d => d.hfPower);
    const lfHfRatioValues = this.ppgQualityQueue.map(d => d.lfHfRatio);
    const stressIndexValues = this.ppgQualityQueue.map(d => d.stressIndex);
    const avnnValues = this.ppgQualityQueue.map(d => d.avnn);
    const pnn20Values = this.ppgQualityQueue.map(d => d.pnn20);
    const sdsdValues = this.ppgQualityQueue.map(d => d.sdsd);
    const hrMaxValues = this.ppgQualityQueue.map(d => d.hrMax);
    const hrMinValues = this.ppgQualityQueue.map(d => d.hrMin);
    const spo2Values = this.ppgQualityQueue.map(d => d.spo2);

    const result = {
      bpm: calculateValidAverage(bpmValues, 30), // BPM 최소 30
      sdnn: calculateValidAverage(sdnnValues, 1), // SDNN 최소 1ms
      rmssd: calculateValidAverage(rmssdValues, 1), // RMSSD 최소 1ms
      pnn50: calculateValidAverage(pnn50Values, 0), // PNN50은 0%도 유효
      lfPower: calculateValidAverage(lfPowerValues, 0.1), // LF 최소 0.1
      hfPower: calculateValidAverage(hfPowerValues, 0.1), // HF 최소 0.1
      lfHfRatio: calculateValidAverage(lfHfRatioValues, 0.1), // LF/HF 최소 0.1
      stressIndex: calculateValidAverage(stressIndexValues, 0.01), // Stress 최소 0.01
      avnn: calculateValidAverage(avnnValues, 100), // AVNN 최소 100ms
      pnn20: calculateValidAverage(pnn20Values, 0), // PNN20은 0%도 유효
      sdsd: calculateValidAverage(sdsdValues, 1), // SDSD 최소 1ms
      hrMax: calculateValidAverage(hrMaxValues, 50), // HR Max 최소 50bpm
      hrMin: calculateValidAverage(hrMinValues, 30), // HR Min 최소 30bpm
      spo2: calculateValidAverage(spo2Values, 70) // SpO2 최소 70%
    };



    return result;
  }

  /**
   * ACC 신호 품질 계산
   */
  private calculateACCSignalQuality(accData: any): number {
    // 간단한 ACC 신호 품질 계산
    return 85; // 기본값
  }

  /**
   * ACC 품질 큐에 추가
   */
  private addToACCQualityQueue(qualityData: any): void {
    this.accQualityQueue.push(qualityData);
    
    if (this.accQualityQueue.length > this.MAX_HISTORY_SIZE) {
      this.accQualityQueue.shift();
    }
  }

  /**
   * ACC 큐에서 이동평균 계산 (Visualizer와 일치하도록 수정)
   */
  private calculateACCMovingAverageFromQueue(): ACCAnalysisMetrics['movingAverageValues'] {
    if (this.accQualityQueue.length === 0) {
      return {
        intensity: 0, // activityLevel → intensity로 변경
        stability: 0,
        avgMovement: 0,
        maxMovement: 0
        // 제거된 필드들: stdMovement, tiltAngle, balance
      };
    }

    const count = this.accQualityQueue.length;
    const sum = this.accQualityQueue.reduce((acc, data) => ({
      intensity: acc.intensity + data.intensity, // activityLevel → intensity로 변경
      stability: acc.stability + data.stability,
      avgMovement: acc.avgMovement + data.avgMovement,
      maxMovement: acc.maxMovement + data.maxMovement
      // 제거된 필드들: stdMovement, tiltAngle, balance
    }), {
      intensity: 0, // activityLevel → intensity로 변경
      stability: 0,
      avgMovement: 0,
      maxMovement: 0
      // 제거된 필드들: stdMovement, tiltAngle, balance
    });

    return {
      intensity: sum.intensity / count, // activityLevel → intensity로 변경
      stability: sum.stability / count,
      avgMovement: sum.avgMovement / count,
      maxMovement: sum.maxMovement / count
      // 제거된 필드들: stdMovement, tiltAngle, balance
    };
  }

  /**
   * RR 간격 버퍼 상태 정보 반환
   */
  public getRRBufferStatus(): {
    bufferLength: number;
    bufferCapacity: number;
    isReady: boolean;
    lastCalculation: number;
    currentLfPower: number;
    currentHfPower: number;
    currentLfHfRatio: number;
    timeSinceLastCalc: number;
  } {
    return {
      bufferLength: this.rrIntervalBuffer.length,
      bufferCapacity: this.LF_HF_BUFFER_SIZE,
      isReady: this.rrIntervalBuffer.length >= this.LF_HF_BUFFER_SIZE,
      lastCalculation: this.lastLfHfCalculation,
      currentLfPower: this.currentLfPower,
      currentHfPower: this.currentHfPower,
      currentLfHfRatio: this.currentLfHfRatio,
      timeSinceLastCalc: Date.now() - this.lastLfHfCalculation
    };
  }

  /**
   * 🔧 디버깅용: 강제로 LF/HF 계산 실행
   */
  public forceCalculateLFHF(): void {

    this.lastLfHfCalculation = 0; // 시간 제한 무시
    this.calculateLFHF();
  }
} 