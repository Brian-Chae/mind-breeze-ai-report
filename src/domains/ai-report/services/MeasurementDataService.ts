/**
 * 측정 데이터 관리 서비스
 * 1분 측정 데이터의 저장, 조회, 검증을 담당
 */

import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { BaseService } from '../../../core/services/BaseService';
import { 
  MeasurementData, 
  DataQuality, 
  EEGMetrics, 
  PPGMetrics, 
  ACCMetrics,
  AIReportError 
} from '../types';

class AIReportErrorClass extends Error implements AIReportError {
  code: string;
  stage: 'VALIDATION' | 'ENGINE_EXECUTION' | 'RENDERING' | 'STORAGE';
  details?: any;
  retryable: boolean;

  constructor(errorInfo: AIReportError) {
    super(errorInfo.message);
    this.code = errorInfo.code;
    this.stage = errorInfo.stage;
    this.details = errorInfo.details;
    this.retryable = errorInfo.retryable;
  }
}

export class MeasurementDataService extends BaseService {
  private static readonly COLLECTION_NAME = 'measurementData';
  private static readonly MIN_DATA_QUALITY_THRESHOLD = 60; // 최소 품질 임계값
  
  /**
   * 측정 데이터 저장
   */
  async saveMeasurementData(data: Omit<MeasurementData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // 데이터 품질 검증
      const qualityValidation = this.validateDataQuality(data.dataQuality);
      if (!qualityValidation.isValid) {
        throw new Error(`Data quality validation failed: ${qualityValidation.reason}`);
      }
      
      // 메트릭 데이터 검증
      this.validateMetrics(data.eegMetrics, data.ppgMetrics, data.accMetrics);
      
      // Firestore 문서 생성
      const measurementDoc = {
        ...data,
        measurementDate: Timestamp.fromDate(data.measurementDate),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const docRef = doc(collection(this.db, MeasurementDataService.COLLECTION_NAME));
      await setDoc(docRef, measurementDoc);
      const docId = docRef.id;
      
      console.log(`Measurement data saved with ID: ${docId}`);
      return docId;
      
    } catch (error: any) {
      console.error('Failed to save measurement data:', error);
      throw new AIReportErrorClass({
        code: 'MEASUREMENT_DATA_SAVE_FAILED',
        message: `Failed to save measurement data: ${error.message}`,
        stage: 'STORAGE',
        details: { data },
        retryable: true
      });
    }
  }
  
  /**
   * 측정 데이터 조회
   */
  async getMeasurementData(measurementId: string): Promise<MeasurementData | null> {
    try {
      const docSnap = await getDoc(
        doc(this.db, MeasurementDataService.COLLECTION_NAME, measurementId)
      );
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        measurementDate: data.measurementDate.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as MeasurementData;
      
    } catch (error: any) {
      console.error('Failed to get measurement data:', error);
      throw new AIReportErrorClass({
        code: 'MEASUREMENT_DATA_GET_FAILED',
        message: `Failed to get measurement data: ${error.message}`,
        stage: 'STORAGE',
        details: { measurementId },
        retryable: true
      });
    }
  }
  
  /**
   * 사용자별 측정 데이터 목록 조회
   */
  async getUserMeasurementData(
    userId: string, 
    limitCount: number = 20,
    organizationId?: string
  ): Promise<MeasurementData[]> {
    try {
      const constraints = [
        where('userId', '==', userId),
        orderBy('measurementDate', 'desc'),
        limit(limitCount)
      ];
      
      if (organizationId) {
        constraints.unshift(where('organizationId', '==', organizationId));
      }
      
      const q = query(
        collection(this.db, MeasurementDataService.COLLECTION_NAME),
        ...constraints
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        measurementDate: doc.data().measurementDate.toDate(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      })) as MeasurementData[];
      
    } catch (error: any) {
      console.error('Failed to get user measurement data:', error);
      throw new AIReportErrorClass({
        code: 'USER_MEASUREMENT_DATA_GET_FAILED',
        message: `Failed to get user measurement data: ${error.message}`,
        stage: 'STORAGE',
        details: { userId, organizationId },
        retryable: true
      });
    }
  }
  
  /**
   * 세션별 측정 데이터 조회
   */
  async getSessionMeasurementData(sessionId: string): Promise<MeasurementData[]> {
    try {
      const q = query(
        collection(this.db, MeasurementDataService.COLLECTION_NAME),
        where('sessionId', '==', sessionId),
        orderBy('measurementDate', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        measurementDate: doc.data().measurementDate.toDate(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      })) as MeasurementData[];
      
    } catch (error: any) {
      console.error('Failed to get session measurement data:', error);
      throw new AIReportErrorClass({
        code: 'SESSION_MEASUREMENT_DATA_GET_FAILED',
        message: `Failed to get session measurement data: ${error.message}`,
        stage: 'STORAGE',
        details: { sessionId },
        retryable: true
      });
    }
  }
  
  /**
   * 분석 가능한 품질의 데이터인지 검증
   */
  isAnalyzable(measurementData: MeasurementData): boolean {
    return measurementData.dataQuality.usableForAnalysis &&
           measurementData.dataQuality.overallScore >= MeasurementDataService.MIN_DATA_QUALITY_THRESHOLD;
  }
  
  /**
   * 측정 데이터를 분석용 포맷으로 변환
   */
  formatForAnalysis(measurementData: MeasurementData): any {
    return {
      // 기본 정보
      measurementInfo: {
        date: measurementData.measurementDate,
        duration: measurementData.duration,
        deviceModel: measurementData.deviceInfo.model,
        processingVersion: measurementData.processingVersion
      },
      
      // EEG 메트릭
      eeg: {
        bandPowers: {
          delta: measurementData.eegMetrics.delta,
          theta: measurementData.eegMetrics.theta,
          alpha: measurementData.eegMetrics.alpha,
          beta: measurementData.eegMetrics.beta,
          gamma: measurementData.eegMetrics.gamma
        },
        indices: {
          attention: measurementData.eegMetrics.attentionIndex,
          meditation: measurementData.eegMetrics.meditationIndex,
          stress: measurementData.eegMetrics.stressIndex,
          fatigue: measurementData.eegMetrics.fatigueIndex
        },
        quality: {
          signalQuality: measurementData.eegMetrics.signalQuality,
          artifactRatio: measurementData.eegMetrics.artifactRatio
        }
      },
      
      // PPG 메트릭
      ppg: {
        cardiac: {
          heartRate: measurementData.ppgMetrics.heartRate,
          hrv: measurementData.ppgMetrics.heartRateVariability,
          rrIntervals: measurementData.ppgMetrics.rrIntervals
        },
        bloodPressure: {
          systolic: measurementData.ppgMetrics.systolicBP,
          diastolic: measurementData.ppgMetrics.diastolicBP
        },
        stress: {
          stressScore: measurementData.ppgMetrics.stressScore,
          autonomicBalance: measurementData.ppgMetrics.autonomicBalance
        },
        quality: {
          signalQuality: measurementData.ppgMetrics.signalQuality,
          motionArtifact: measurementData.ppgMetrics.motionArtifact
        }
      },
      
      // ACC 메트릭
      movement: {
        activity: {
          level: measurementData.accMetrics.activityLevel,
          intensity: measurementData.accMetrics.movementIntensity
        },
        posture: {
          position: measurementData.accMetrics.posture,
          stability: measurementData.accMetrics.postureStability
        },
        events: measurementData.accMetrics.movementEvents
      },
      
      // 품질 정보
      dataQuality: measurementData.dataQuality,
      
      // 환경 정보 (있는 경우)
      environment: measurementData.environmentInfo
    };
  }
  
  /**
   * 데이터 품질 검증
   */
  private validateDataQuality(quality: DataQuality): { isValid: boolean; reason?: string } {
    if (!quality.usableForAnalysis) {
      return { isValid: false, reason: 'Data marked as not usable for analysis' };
    }
    
    if (quality.overallScore < 30) {
      return { isValid: false, reason: `Overall quality too low: ${quality.overallScore}%` };
    }
    
    if (quality.eegQuality < 40 || quality.ppgQuality < 40) {
      return { isValid: false, reason: 'EEG or PPG quality below minimum threshold' };
    }
    
    if (quality.motionInterference > 80) {
      return { isValid: false, reason: 'Excessive motion interference detected' };
    }
    
    return { isValid: true };
  }
  
  /**
   * 메트릭 데이터 검증
   */
  private validateMetrics(eeg: EEGMetrics, ppg: PPGMetrics, acc: ACCMetrics): void {
    // EEG 검증
    if (eeg.signalQuality < 0 || eeg.signalQuality > 1) {
      throw new Error('EEG signal quality must be between 0 and 1');
    }
    
    if (eeg.attentionIndex < 0 || eeg.attentionIndex > 100) {
      throw new Error('EEG attention index must be between 0 and 100');
    }
    
    // PPG 검증
    if (ppg.heartRate <= 0 || ppg.heartRate > 300) {
      throw new Error('Invalid heart rate value');
    }
    
    if (ppg.signalQuality < 0 || ppg.signalQuality > 1) {
      throw new Error('PPG signal quality must be between 0 and 1');
    }
    
    // ACC 검증
    if (acc.activityLevel < 0 || acc.activityLevel > 100) {
      throw new Error('Activity level must be between 0 and 100');
    }
    
    if (acc.movementIntensity < 0 || acc.movementIntensity > 1) {
      throw new Error('Movement intensity must be between 0 and 1');
    }
  }
  
  /**
   * 품질 이슈 분석
   */
  analyzeQualityIssues(measurementData: MeasurementData): string[] {
    const issues: string[] = [];
    
    const { dataQuality, eegMetrics, ppgMetrics, accMetrics } = measurementData;
    
    if (dataQuality.eegQuality < 60) {
      issues.push(`EEG 신호 품질이 낮습니다 (${dataQuality.eegQuality}%)`);
    }
    
    if (dataQuality.ppgQuality < 60) {
      issues.push(`PPG 신호 품질이 낮습니다 (${dataQuality.ppgQuality}%)`);
    }
    
    if (dataQuality.motionInterference > 60) {
      issues.push(`움직임으로 인한 간섭이 많습니다 (${dataQuality.motionInterference}%)`);
    }
    
    if (eegMetrics.artifactRatio > 0.3) {
      issues.push('EEG 신호에 아티팩트가 많이 포함되어 있습니다');
    }
    
    if (ppgMetrics.motionArtifact > 0.4) {
      issues.push('PPG 신호에 움직임 아티팩트가 많습니다');
    }
    
    if (accMetrics.postureStability < 0.6) {
      issues.push('측정 중 자세가 불안정했습니다');
    }
    
    return issues;
  }
} 