/**
 * 처리된 측정 데이터 시계열 저장 서비스
 * 1분간의 처리된 메트릭 시계열 데이터를 저장하고 관리
 */

import { 
  doc, 
  setDoc, 
  getDoc,
  Timestamp 
} from 'firebase/firestore';
import { BaseService } from '../../../core/services/BaseService';

/**
 * 처리된 EEG 시계열 데이터
 * 각 메트릭의 1분간 변화 추이를 저장
 */
export interface ProcessedEEGTimeSeries {
  // 주파수 밴드 파워 시계열 (초당 1개, 60개)
  deltaPower: number[];      // 0.5-4 Hz
  thetaPower: number[];      // 4-8 Hz
  alphaPower: number[];      // 8-13 Hz
  betaPower: number[];       // 13-30 Hz
  gammaPower: number[];      // 30-100 Hz
  
  // 파생 지표 시계열
  focusIndex: number[];      // 집중도 지수
  relaxationIndex: number[]; // 이완 지수
  stressIndex: number[];     // 스트레스 지수
  attentionLevel: number[];  // 주의력 레벨
  meditationLevel: number[]; // 명상 레벨
  
  // 추가 분석 지표
  hemisphericBalance: number[];  // 좌우뇌 균형
  cognitiveLoad: number[];       // 인지 부하
  emotionalStability: number[];  // 정서 안정성
  
  // 신호 품질 시계열
  signalQuality: number[];   // 신호 품질 (0-1)
  artifactRatio: number[];   // 아티팩트 비율
  
  // 타임스탬프
  timestamps: number[];      // Unix timestamps (ms)
}

/**
 * 처리된 PPG 시계열 데이터
 * 심박 및 혈류 관련 메트릭의 시계열
 */
export interface ProcessedPPGTimeSeries {
  // 심박 관련 시계열
  heartRate: number[];           // 심박수 (BPM)
  hrv: number[];                 // 심박 변이도 (RMSSD)
  rrIntervals: number[][];       // RR 간격 배열 (각 초마다의 RR intervals)
  
  // HRV 시간 도메인 지표 시계열
  rmssd: number[];               // Root Mean Square of Successive Differences
  pnn50: number[];               // NN50 count divided by total NN count
  sdnn: number[];                // Standard Deviation of NN intervals
  
  // HRV 주파수 도메인 지표 시계열
  vlf: number[];                 // Very Low Frequency (0.003-0.04 Hz) - 대사/온도 조절
  lf: number[];                  // Low Frequency (0.04-0.15 Hz) - 교감신경 + 부교감신경
  hf: number[];                  // High Frequency (0.15-0.4 Hz) - 부교감신경 (호흡)
  lfNorm: number[];              // LF normalized (LF/(Total-VLF)*100)
  hfNorm: number[];              // HF normalized (HF/(Total-VLF)*100)
  lfHfRatio: number[];           // LF/HF ratio - 자율신경계 균형
  totalPower: number[];          // Total spectral power (VLF+LF+HF)
  
  // 스트레스 및 자율신경계 지표
  stressLevel: number[];         // 스트레스 레벨 (0-100)
  recoveryIndex: number[];       // 회복 지수
  autonomicBalance: number[];    // 자율신경계 균형 (LF/HF 기반)
  cardiacCoherence: number[];    // 심장 일관성
  
  // 호흡 및 산소포화도
  respiratoryRate: number[];     // 호흡률
  oxygenSaturation: number[];    // SpO2
  
  // 혈관 건강 지표
  perfusionIndex: number[];      // 관류 지수
  vascularTone: number[];        // 혈관 긴장도
  bloodPressureTrend: {          // 혈압 추세 (추정치)
    systolic: number[];
    diastolic: number[];
  };
  
  // 심장 효율성
  cardiacEfficiency: number[];   // 심장 효율성
  metabolicRate: number[];       // 대사율 추정
  
  // 신호 품질
  signalQuality: number[];       // 신호 품질 (0-1)
  motionArtifact: number[];      // 움직임 아티팩트
  
  // 타임스탬프
  timestamps: number[];          // Unix timestamps (ms)
}

/**
 * 처리된 ACC 시계열 데이터
 * 움직임 및 자세 관련 메트릭의 시계열
 */
export interface ProcessedACCTimeSeries {
  // 활동 수준 시계열
  activityLevel: number[];       // 활동 레벨 (0-100)
  movementIntensity: number[];   // 움직임 강도 (0-1)
  
  // 자세 정보 시계열
  posture: string[];             // 자세 ('SITTING', 'STANDING', 'LYING', 'MOVING')
  posturalStability: number[];   // 자세 안정성 (0-1)
  posturalTransitions: number[]; // 자세 전환 횟수
  
  // 움직임 패턴
  stepCount: number[];           // 걸음 수 (누적)
  stepRate: number[];            // 분당 걸음 수
  movementQuality: number[];     // 움직임 품질
  energyExpenditure: number[];   // 에너지 소비 (칼로리)
  
  // 움직임 이벤트
  movementEvents: {
    timestamp: number;
    type: 'start' | 'stop' | 'transition';
    intensity: number;
  }[];
  
  // 신호 품질
  signalQuality: number[];       // 신호 품질
  
  // 타임스탬프
  timestamps: number[];          // Unix timestamps (ms)
}

/**
 * 통합 처리된 데이터 시계열
 */
export interface ProcessedDataTimeSeries {
  sessionId: string;
  measurementId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // seconds
  
  // 각 센서별 시계열 데이터
  eeg: ProcessedEEGTimeSeries;
  ppg: ProcessedPPGTimeSeries;
  acc: ProcessedACCTimeSeries;
  
  // 통합 메트릭 (센서 융합)
  fusedMetrics?: {
    overallStress: number[];     // EEG + PPG 융합 스트레스
    cognitiveStress: number[];   // 인지적 스트레스
    physicalStress: number[];    // 신체적 스트레스
    fatigueLevel: number[];      // 피로도
    alertnessLevel: number[];    // 각성도
    wellbeingScore: number[];    // 전반적 웰빙 점수
  };
  
  // 메타데이터
  metadata: {
    samplingRate: {
      eeg: number;  // Hz
      ppg: number;  // Hz
      acc: number;  // Hz
    };
    processingVersion: string;
    qualityScore: number;
  };
}

export class ProcessedDataStorageService extends BaseService {
  private static readonly COLLECTION_NAME = 'processedDataTimeSeries';
  
  /**
   * 처리된 시계열 데이터 저장
   */
  async saveProcessedTimeSeries(
    data: ProcessedDataTimeSeries
  ): Promise<string> {
    try {
      const docId = `${data.sessionId}_processed`;
      
      // Firestore는 배열 크기 제한이 있으므로 데이터 분할 저장
      await this.saveDataInChunks(docId, data);
      
      // 메타데이터 저장
      await setDoc(
        doc(this.db, ProcessedDataStorageService.COLLECTION_NAME, docId),
        {
          sessionId: data.sessionId,
          measurementId: data.measurementId,
          startTime: Timestamp.fromDate(data.startTime),
          endTime: Timestamp.fromDate(data.endTime),
          duration: data.duration,
          metadata: data.metadata,
          hasEEGData: true,
          hasPPGData: true,
          hasACCData: true,
          hasFusedMetrics: !!data.fusedMetrics,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        }
      );
      
      console.log(`Processed time series data saved: ${docId}`);
      return docId;
      
    } catch (error) {
      console.error('Failed to save processed time series:', error);
      throw error;
    }
  }
  
  /**
   * 처리된 시계열 데이터 로드
   */
  async loadProcessedTimeSeries(
    sessionId: string
  ): Promise<ProcessedDataTimeSeries | null> {
    try {
      const docId = `${sessionId}_processed`;
      
      // 메타데이터 로드
      const metaDoc = await getDoc(
        doc(this.db, ProcessedDataStorageService.COLLECTION_NAME, docId)
      );
      
      if (!metaDoc.exists()) {
        return null;
      }
      
      const metadata = metaDoc.data();
      
      // 청크 데이터 로드
      const eegData = await this.loadChunkedData(docId, 'eeg');
      const ppgData = await this.loadChunkedData(docId, 'ppg');
      const accData = await this.loadChunkedData(docId, 'acc');
      const fusedData = metadata.hasFusedMetrics 
        ? await this.loadChunkedData(docId, 'fused')
        : null;
      
      return {
        sessionId: metadata.sessionId,
        measurementId: metadata.measurementId,
        startTime: metadata.startTime.toDate(),
        endTime: metadata.endTime.toDate(),
        duration: metadata.duration,
        eeg: eegData as ProcessedEEGTimeSeries,
        ppg: ppgData as ProcessedPPGTimeSeries,
        acc: accData as ProcessedACCTimeSeries,
        fusedMetrics: fusedData,
        metadata: metadata.metadata
      };
      
    } catch (error) {
      console.error('Failed to load processed time series:', error);
      return null;
    }
  }
  
  /**
   * 데이터를 청크로 분할하여 저장
   */
  private async saveDataInChunks(
    docId: string,
    data: ProcessedDataTimeSeries
  ): Promise<void> {
    // EEG 데이터 저장
    await setDoc(
      doc(this.db, `${ProcessedDataStorageService.COLLECTION_NAME}_chunks`, `${docId}_eeg`),
      {
        ...data.eeg,
        chunkType: 'eeg',
        createdAt: Timestamp.now()
      }
    );
    
    // PPG 데이터 저장
    await setDoc(
      doc(this.db, `${ProcessedDataStorageService.COLLECTION_NAME}_chunks`, `${docId}_ppg`),
      {
        ...data.ppg,
        chunkType: 'ppg',
        createdAt: Timestamp.now()
      }
    );
    
    // ACC 데이터 저장
    await setDoc(
      doc(this.db, `${ProcessedDataStorageService.COLLECTION_NAME}_chunks`, `${docId}_acc`),
      {
        ...data.acc,
        chunkType: 'acc',
        createdAt: Timestamp.now()
      }
    );
    
    // 융합 메트릭 저장 (있는 경우)
    if (data.fusedMetrics) {
      await setDoc(
        doc(this.db, `${ProcessedDataStorageService.COLLECTION_NAME}_chunks`, `${docId}_fused`),
        {
          ...data.fusedMetrics,
          chunkType: 'fused',
          createdAt: Timestamp.now()
        }
      );
    }
  }
  
  /**
   * 청크 데이터 로드
   */
  private async loadChunkedData(
    docId: string,
    chunkType: 'eeg' | 'ppg' | 'acc' | 'fused'
  ): Promise<any> {
    const chunkDoc = await getDoc(
      doc(this.db, `${ProcessedDataStorageService.COLLECTION_NAME}_chunks`, `${docId}_${chunkType}`)
    );
    
    if (!chunkDoc.exists()) {
      return null;
    }
    
    const data = chunkDoc.data();
    // createdAt 등 메타데이터 제거
    delete data.chunkType;
    delete data.createdAt;
    
    return data;
  }
  
  /**
   * 시계열 데이터에서 통계 계산
   */
  calculateStatistics(timeSeries: number[]): {
    mean: number;
    std: number;
    min: number;
    max: number;
    median: number;
    percentile25: number;
    percentile75: number;
  } {
    const sorted = [...timeSeries].sort((a, b) => a - b);
    const n = sorted.length;
    
    const mean = timeSeries.reduce((a, b) => a + b, 0) / n;
    const std = Math.sqrt(
      timeSeries.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / n
    );
    
    return {
      mean,
      std,
      min: sorted[0],
      max: sorted[n - 1],
      median: sorted[Math.floor(n / 2)],
      percentile25: sorted[Math.floor(n * 0.25)],
      percentile75: sorted[Math.floor(n * 0.75)]
    };
  }
  
  /**
   * 시계열 데이터 다운샘플링
   */
  downsampleTimeSeries(
    timeSeries: number[],
    targetLength: number
  ): number[] {
    if (timeSeries.length <= targetLength) {
      return timeSeries;
    }
    
    const ratio = timeSeries.length / targetLength;
    const downsampled: number[] = [];
    
    for (let i = 0; i < targetLength; i++) {
      const start = Math.floor(i * ratio);
      const end = Math.floor((i + 1) * ratio);
      
      // 구간 평균 계산
      let sum = 0;
      for (let j = start; j < end; j++) {
        sum += timeSeries[j];
      }
      downsampled.push(sum / (end - start));
    }
    
    return downsampled;
  }
  
  /**
   * 시계열 데이터를 분석용 포맷으로 변환
   */
  formatForAIAnalysis(data: ProcessedDataTimeSeries): any {
    return {
      // 기본 정보
      sessionInfo: {
        sessionId: data.sessionId,
        duration: data.duration,
        startTime: data.startTime,
        endTime: data.endTime
      },
      
      // EEG 시계열 데이터
      eegTimeSeries: {
        bandPowers: {
          delta: data.eeg.deltaPower,
          theta: data.eeg.thetaPower,
          alpha: data.eeg.alphaPower,
          beta: data.eeg.betaPower,
          gamma: data.eeg.gammaPower
        },
        mentalStates: {
          focus: data.eeg.focusIndex,
          relaxation: data.eeg.relaxationIndex,
          stress: data.eeg.stressIndex,
          attention: data.eeg.attentionLevel,
          meditation: data.eeg.meditationLevel
        },
        cognitiveMetrics: {
          hemisphericBalance: data.eeg.hemisphericBalance,
          cognitiveLoad: data.eeg.cognitiveLoad,
          emotionalStability: data.eeg.emotionalStability
        },
        quality: data.eeg.signalQuality
      },
      
      // PPG 시계열 데이터
      ppgTimeSeries: {
        cardiac: {
          heartRate: data.ppg.heartRate,
          hrv: data.ppg.hrv,
          rmssd: data.ppg.rmssd,
          pnn50: data.ppg.pnn50,
          sdnn: data.ppg.sdnn
        },
        hrvFrequencyDomain: {
          vlf: data.ppg.vlf,
          lf: data.ppg.lf,
          hf: data.ppg.hf,
          lfNorm: data.ppg.lfNorm,
          hfNorm: data.ppg.hfNorm,
          lfHfRatio: data.ppg.lfHfRatio,
          totalPower: data.ppg.totalPower
        },
        stress: {
          stressLevel: data.ppg.stressLevel,
          recoveryIndex: data.ppg.recoveryIndex,
          autonomicBalance: data.ppg.autonomicBalance,
          cardiacCoherence: data.ppg.cardiacCoherence
        },
        physiological: {
          respiratoryRate: data.ppg.respiratoryRate,
          oxygenSaturation: data.ppg.oxygenSaturation,
          perfusionIndex: data.ppg.perfusionIndex,
          metabolicRate: data.ppg.metabolicRate
        },
        quality: data.ppg.signalQuality
      },
      
      // ACC 시계열 데이터
      accTimeSeries: {
        activity: {
          level: data.acc.activityLevel,
          intensity: data.acc.movementIntensity,
          stepRate: data.acc.stepRate,
          energyExpenditure: data.acc.energyExpenditure
        },
        posture: {
          states: data.acc.posture,
          stability: data.acc.posturalStability,
          transitions: data.acc.posturalTransitions
        },
        quality: data.acc.signalQuality
      },
      
      // 융합 메트릭 (있는 경우)
      fusedMetrics: data.fusedMetrics,
      
      // 통계 요약
      statistics: {
        eeg: {
          focusIndex: this.calculateStatistics(data.eeg.focusIndex),
          stressIndex: this.calculateStatistics(data.eeg.stressIndex),
          attentionLevel: this.calculateStatistics(data.eeg.attentionLevel)
        },
        ppg: {
          heartRate: this.calculateStatistics(data.ppg.heartRate),
          hrv: this.calculateStatistics(data.ppg.hrv),
          stressLevel: this.calculateStatistics(data.ppg.stressLevel),
          lfHfRatio: this.calculateStatistics(data.ppg.lfHfRatio),
          hf: this.calculateStatistics(data.ppg.hf),
          lf: this.calculateStatistics(data.ppg.lf)
        },
        acc: {
          activityLevel: this.calculateStatistics(data.acc.activityLevel),
          posturalStability: this.calculateStatistics(data.acc.posturalStability)
        }
      }
    };
  }
}

// 싱글톤 인스턴스
export const processedDataStorageService = new ProcessedDataStorageService();