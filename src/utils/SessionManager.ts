import type { EEGDataPoint, PPGDataPoint, ACCDataPoint } from './SimpleCircularBuffer';
import type { ProcessedEEGData } from '../types/eeg';
import JSZip from 'jszip';
import { createSessionStartTime, type TimezoneType } from './timeUtils';
import { StreamingStorageService } from '../services/StreamingStorageService';

// 처리된 PPG 데이터 타입
export interface ProcessedPPGData {
  timestamp: number;
  heartRate: number;
  hrv: number;
  spo2?: number;
  signalQuality: number;
}

// 처리된 ACC 데이터 타입  
export interface ProcessedACCData {
  timestamp: number;
  magnitude: number;
  activity: number;
  steps?: number;
  orientation: {
    pitch: number;
    roll: number;
    yaw: number;
  };
}

/**
 * 성능 모니터링 유틸리티
 */
class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, {
    totalTime: number;
    executionCount: number;
    maxTime: number;
    lastTime: number;
  }> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(label: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      this.recordExecution(label, executionTime);
      
      // 성능 경고 (50ms 이상)
      if (executionTime > 50) {
        console.warn(`⚠️ ${label} took ${executionTime.toFixed(2)}ms`);
      }
    };
  }

  private recordExecution(label: string, executionTime: number): void {
    const existing = this.metrics.get(label) || {
      totalTime: 0,
      executionCount: 0,
      maxTime: 0,
      lastTime: 0
    };

    existing.totalTime += executionTime;
    existing.executionCount++;
    existing.maxTime = Math.max(existing.maxTime, executionTime);
    existing.lastTime = executionTime;

    this.metrics.set(label, existing);
  }

  getMetrics(label: string) {
    const metric = this.metrics.get(label);
    if (!metric) return null;

    return {
      averageTime: metric.totalTime / metric.executionCount,
      maxTime: metric.maxTime,
      lastTime: metric.lastTime,
      executionCount: metric.executionCount
    };
  }

  getAllMetrics() {
    const result: Record<string, any> = {};
    this.metrics.forEach((value, key) => {
      result[key] = {
        averageTime: value.totalTime / value.executionCount,
        maxTime: value.maxTime,
        lastTime: value.lastTime,
        executionCount: value.executionCount
      };
    });
    return result;
  }

  logPerformanceReport(): void {
    console.group('📊 Performance Report');
    this.metrics.forEach((value, key) => {
      const avg = value.totalTime / value.executionCount;
      console.log(`${key}: avg=${avg.toFixed(2)}ms, max=${value.maxTime.toFixed(2)}ms, count=${value.executionCount}`);
    });
    console.groupEnd();
  }
}

// 전역 성능 모니터 인스턴스
const performanceMonitor = PerformanceMonitor.getInstance();

/**
 * Phase 1: localStorage 기반 세션 관리
 * 나중에 IndexedDB로 업그레이드 예정
 */

export interface SessionMetadata {
  id: string;
  name: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // seconds
  deviceName: string;
  deviceId: string;
  samplingRate: number;
  dataCount: {
    eeg: number;
    ppg: number;
    acc: number;
    eegProcessed: number;
    ppgProcessed: number;
    accProcessed: number;
  };
  totalSamples?: number; // 전체 샘플 수
  estimatedSize?: number; // 추정 파일 크기 (bytes)
  notes?: string;
  saveOptions: {
    eegRaw: boolean;
    ppgRaw: boolean;
    accRaw: boolean;
    eegProcessed: boolean;
    ppgProcessed: boolean;
    accProcessed: boolean;
  };
}

export interface SessionData {
  metadata: SessionMetadata;
  eegData: EEGDataPoint[];
  ppgData: PPGDataPoint[];
  accData: ACCDataPoint[];
  systemLogs: string[]; // CSV 형태의 시스템 로그
}

export class SessionManager {
  private readonly STORAGE_PREFIX = 'linkband_session_';
  private readonly METADATA_KEY = 'linkband_sessions_metadata';
  private readonly MAX_SESSIONS = 10; // localStorage 용량 제한
  private readonly MAX_DATA_POINTS = 50000; // 세션당 최대 데이터 포인트

  private currentSession: SessionData | null = null;
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private readonly AUTO_SAVE_INTERVAL = 60000; // 60초마다 자동 저장 (성능 최적화)
  
  // 성능 최적화: 증분 저장을 위한 상태 추적
  private lastSavedDataCount = {
    eeg: 0,
    ppg: 0,
    acc: 0,
    eegProcessed: 0,
    ppgProcessed: 0,
    accProcessed: 0
  };
  
  // 성능 최적화: 저장 스로틀링
  private isSaving = false;
  private pendingSave = false;

  /**
   * 새 세션 시작
   */
  startSession(
    deviceName: string, 
    deviceId: string, 
    sessionName?: string,
    saveOptions: { eegRaw: boolean; ppgRaw: boolean; accRaw: boolean; eegProcessed: boolean; ppgProcessed: boolean; accProcessed: boolean } = { eegRaw: true, ppgRaw: true, accRaw: true, eegProcessed: true, ppgProcessed: true, accProcessed: true },
    timezone: TimezoneType = 'system'
  ): string {
    // 기존 세션이 있으면 종료
    if (this.currentSession) {
      this.endSession();
    }

    const sessionId = this.generateSessionId();
    const now = createSessionStartTime(timezone);

    const metadata: SessionMetadata = {
      id: sessionId,
      name: sessionName || `Session ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
      startTime: now,
      duration: 0,
      deviceName,
      deviceId,
      samplingRate: 250, // LINK BAND 기본값
      dataCount: {
        eeg: 0,
        ppg: 0,
        acc: 0,
        eegProcessed: 0,
        ppgProcessed: 0,
        accProcessed: 0
      },
      saveOptions
    };

    this.currentSession = {
      metadata,
      eegData: [],
      ppgData: [],
      accData: [],
      systemLogs: []
    };

    // 자동 저장 시작
    this.startAutoSave();


    return sessionId;
  }

  /**
   * 현재 세션 종료
   */
  endSession(): boolean {
    if (!this.currentSession) {
      console.warn('종료할 활성 세션이 없습니다');
      return false;
    }

    // 종료 시간 설정
    const endTime = new Date();
    this.currentSession.metadata.endTime = endTime;
    this.currentSession.metadata.duration = Math.floor(
      (endTime.getTime() - this.currentSession.metadata.startTime.getTime()) / 1000
    );

    // 최종 저장
    this.saveCurrentSession();

    // 자동 저장 중지
    this.stopAutoSave();


    this.currentSession = null;

    return true;
  }

  /**
   * EEG 데이터 추가
   */
  addEEGData(data: EEGDataPoint[]): void {
    if (!this.currentSession || !this.currentSession.metadata.saveOptions.eegRaw) return;

    // 용량 제한 확인
    if (this.currentSession.eegData.length + data.length > this.MAX_DATA_POINTS) {
      // 오래된 데이터 제거 (FIFO)
      const removeCount = this.currentSession.eegData.length + data.length - this.MAX_DATA_POINTS;
      this.currentSession.eegData.splice(0, removeCount);
    }

    this.currentSession.eegData.push(...data);
    this.currentSession.metadata.dataCount.eeg = this.currentSession.eegData.length;
  }

  /**
   * PPG 데이터 추가
   */
  addPPGData(data: PPGDataPoint[]): void {
    if (!this.currentSession || !this.currentSession.metadata.saveOptions.ppgRaw) return;

    if (this.currentSession.ppgData.length + data.length > this.MAX_DATA_POINTS) {
      const removeCount = this.currentSession.ppgData.length + data.length - this.MAX_DATA_POINTS;
      this.currentSession.ppgData.splice(0, removeCount);
    }

    this.currentSession.ppgData.push(...data);
    this.currentSession.metadata.dataCount.ppg = this.currentSession.ppgData.length;
  }

  /**
   * 가속도계 데이터 추가
   */
  addACCData(data: ACCDataPoint[]): void {
    if (!this.currentSession || !this.currentSession.metadata.saveOptions.accRaw) return;

    if (this.currentSession.accData.length + data.length > this.MAX_DATA_POINTS) {
      const removeCount = this.currentSession.accData.length + data.length - this.MAX_DATA_POINTS;
      this.currentSession.accData.splice(0, removeCount);
    }

    this.currentSession.accData.push(...data);
    this.currentSession.metadata.dataCount.acc = this.currentSession.accData.length;
  }

  /**
   * 처리된 데이터 추가 (하위 호환성)
   */
  addProcessedData(data: ProcessedEEGData): void {
    // 🔧 processed 데이터 메소드 제거 - 복잡성으로 인해 제외
  }

  /**
   * 시스템 로그 추가
   */
  addSystemLog(logEntry: string): void {
    if (!this.currentSession) return;

    this.currentSession.systemLogs.push(logEntry);

    // 시스템 로그는 더 많이 보관 (최대 10000개)
    if (this.currentSession.systemLogs.length > 10000) {
      this.currentSession.systemLogs.shift();
    }
  }

  /**
   * 현재 세션 정보 반환
   */
  getCurrentSession(): SessionData | null {
    return this.currentSession;
  }

  /**
   * 모든 세션 메타데이터 반환
   */
  getAllSessions(): SessionMetadata[] {
    try {
      const metadataJson = localStorage.getItem(this.METADATA_KEY);
      if (!metadataJson) return [];

      const metadata: SessionMetadata[] = JSON.parse(metadataJson);
      
      // Date 객체 복원 및 누락된 필드 기본값 설정
      return metadata.map(session => ({
        ...session,
        startTime: session.startTime ? new Date(session.startTime) : new Date(),
        endTime: session.endTime ? new Date(session.endTime) : undefined,
        duration: session.duration || 0,
        deviceName: session.deviceName || 'Unknown Device',
        deviceId: session.deviceId || 'unknown',
        samplingRate: session.samplingRate || 250,
        dataCount: {
          eeg: session.dataCount?.eeg || 0,
          ppg: session.dataCount?.ppg || 0,
          acc: session.dataCount?.acc || 0,
          eegProcessed: session.dataCount?.eegProcessed || 0,
          ppgProcessed: session.dataCount?.ppgProcessed || 0,
          accProcessed: session.dataCount?.accProcessed || 0
        },
        saveOptions: session.saveOptions || {
          eegRaw: true,
          ppgRaw: true,
          accRaw: true,
          eegProcessed: true,
          ppgProcessed: true,
          accProcessed: true
        }
      }));
    } catch (error) {
      console.error('세션 메타데이터 로드 실패:', error);
      return [];
    }
  }

  /**
   * 특정 세션 로드
   */
  loadSession(sessionId: string): SessionData | null {
    try {
      const sessionJson = localStorage.getItem(this.STORAGE_PREFIX + sessionId);
      if (!sessionJson) {
        console.warn(`세션을 찾을 수 없습니다: ${sessionId}`);
        return null;
      }

      const sessionData: SessionData = JSON.parse(sessionJson);
      
      // Date 객체 복원 및 누락된 필드 기본값 설정
      sessionData.metadata.startTime = sessionData.metadata.startTime ? new Date(sessionData.metadata.startTime) : new Date();
      if (sessionData.metadata.endTime) {
        sessionData.metadata.endTime = new Date(sessionData.metadata.endTime);
      }
      
      // 누락된 필드 기본값 설정
      sessionData.metadata.duration = sessionData.metadata.duration || 0;
      sessionData.metadata.deviceName = sessionData.metadata.deviceName || 'Unknown Device';
      sessionData.metadata.deviceId = sessionData.metadata.deviceId || 'unknown';
      sessionData.metadata.samplingRate = sessionData.metadata.samplingRate || 250;
      
      if (!sessionData.metadata.dataCount) {
        sessionData.metadata.dataCount = {
          eeg: 0,
          ppg: 0,
          acc: 0,
          eegProcessed: 0,
          ppgProcessed: 0,
          accProcessed: 0
        };
      } else {
        sessionData.metadata.dataCount = {
          eeg: sessionData.metadata.dataCount.eeg || 0,
          ppg: sessionData.metadata.dataCount.ppg || 0,
          acc: sessionData.metadata.dataCount.acc || 0,
          eegProcessed: sessionData.metadata.dataCount.eegProcessed || 0,
          ppgProcessed: sessionData.metadata.dataCount.ppgProcessed || 0,
          accProcessed: sessionData.metadata.dataCount.accProcessed || 0
        };
      }
      
      if (!sessionData.metadata.saveOptions) {
        sessionData.metadata.saveOptions = {
          eegRaw: true,
          ppgRaw: true,
          accRaw: true,
          eegProcessed: true,
          ppgProcessed: true,
          accProcessed: true
        };
      }

      // 데이터 배열 초기화 (존재하지 않는 경우)
      if (!sessionData) {
        console.error('세션 데이터가 존재하지 않습니다');
        return null;
      }
      
      // 필수 배열들이 존재하는지 확인하고 초기화
      if (!sessionData.eegData) sessionData.eegData = [];
      if (!sessionData.ppgData) sessionData.ppgData = [];
      if (!sessionData.accData) sessionData.accData = [];
      if (!sessionData.systemLogs) sessionData.systemLogs = [];
      
      // 🔧 processed 데이터 배열 초기화 제거 - 복잡성으로 인해 제외
      
      // 실제 데이터 배열 길이로 dataCount 동기화
      sessionData.metadata.dataCount = {
        eeg: sessionData.eegData.length,
        ppg: sessionData.ppgData.length,
        acc: sessionData.accData.length,
        // 🔧 processed 데이터 카운트 제거 - 복잡성으로 인해 제외
        eegProcessed: 0,
        ppgProcessed: 0,
        accProcessed: 0
      };

              console.log(`세션 로드 완료: ${sessionId}`, {
        dataCount: sessionData.metadata.dataCount,
        actualLengths: {
          eeg: sessionData.eegData.length,
          ppg: sessionData.ppgData.length,
          acc: sessionData.accData.length,
          eegProcessed: 0, // Processed data not stored in SessionData
          ppgProcessed: 0, // Processed data not stored in SessionData
          accProcessed: 0  // Processed data not stored in SessionData
        }
      });
      return sessionData;
    } catch (error) {
      console.error(`세션 로드 실패: ${sessionId}`, error);
      return null;
    }
  }

  /**
   * 세션 삭제
   */
  deleteSession(sessionId: string): boolean {
    try {
      // 세션 데이터 삭제
      localStorage.removeItem(this.STORAGE_PREFIX + sessionId);

      // 메타데이터에서 제거
      const allSessions = this.getAllSessions();
      const updatedSessions = allSessions.filter(session => session.id !== sessionId);
      this.saveSessionsMetadata(updatedSessions);

  
      return true;
    } catch (error) {
      console.error(`세션 삭제 실패: ${sessionId}`, error);
      return false;
    }
  }

  /**
   * CSV 내보내기
   */
  exportToCSV(sessionId: string, dataType: 'eeg' | 'ppg' | 'acc' | 'system' = 'eeg'): string | null {
    const session = sessionId === 'current' ? this.currentSession : this.loadSession(sessionId);
    if (!session) {
      console.error('내보낼 세션을 찾을 수 없습니다');
      return null;
    }

    try {
      let csvContent = '';

      switch (dataType) {
        case 'eeg':
          csvContent = this.generateEEGCSV(session.eegData, session.metadata);
          break;
        case 'ppg':
          csvContent = this.generatePPGCSV(session.ppgData, session.metadata);
          break;
        case 'acc':
          csvContent = this.generateACCCSV(session.accData, session.metadata);
          break;
        // 🔧 processed 데이터 케이스 제거 - 복잡성으로 인해 제외
        case 'system':
          csvContent = this.generateSystemCSV(session.systemLogs, session.metadata);
          break;
        default:
          throw new Error(`지원되지 않는 데이터 타입: ${dataType}`);
      }

      return csvContent;
    } catch (error) {
      console.error('CSV 내보내기 실패:', error);
      return null;
    }
  }

  /**
   * 모든 데이터를 ZIP 파일로 다운로드
   */
  async downloadAllAsZip(sessionId: string, targetDirHandle?: FileSystemDirectoryHandle): Promise<boolean> {
    console.log(`🔧 SessionManager.downloadAllAsZip 호출됨 - sessionId: ${sessionId}`);
    console.log(`🔧 Target directory handle:`, targetDirHandle ? `${targetDirHandle.name}` : 'undefined (기본 다운로드)');
    
    let session: SessionData | null = null;
    
    if (sessionId === 'current') {
      // 현재 세션은 localStorage에서 가져오기
      session = this.currentSession;
    } else {
      // 저장된 세션은 먼저 localStorage에서 시도
      session = this.loadSession(sessionId);
      
      if (!session) {
        // localStorage에 없으면 StorageStore에서 메타데이터 가져와서 가상 세션 생성
        console.log(`🔧 localStorage에서 세션을 찾을 수 없음, StorageStore에서 메타데이터 검색: ${sessionId}`);
        try {
          const { useStorageStore } = await import('../stores/storageStore');
          const storageStore = useStorageStore.getState();
          const sessionInfo = storageStore.sessions.find(s => s.id === sessionId);
          
          if (sessionInfo) {
            console.log(`🔧 StorageStore에서 세션 메타데이터 발견: ${sessionInfo.name}`);
            // StorageStore 세션을 SessionData 형태로 변환
            session = {
              metadata: {
                id: sessionInfo.id,
                name: sessionInfo.name,
                startTime: new Date(sessionInfo.date + ' ' + sessionInfo.time),
                endTime: undefined, // StorageStore에서는 endTime 정보가 없음
                duration: this.parseDurationString(sessionInfo.duration),
                deviceName: sessionInfo.deviceName || 'Unknown Device',
                deviceId: sessionInfo.deviceId || 'unknown',
                samplingRate: 250,
                dataCount: {
                  eeg: 0,
                  ppg: 0,
                  acc: 0,
                  eegProcessed: 0,
                  ppgProcessed: 0,
                  accProcessed: 0
                },
                saveOptions: {
                  eegRaw: true,
                  ppgRaw: true,
                  accRaw: true,
                  eegProcessed: true,
                  ppgProcessed: true,
                  accProcessed: true
                }
              },
              eegData: [],
              ppgData: [],
              accData: [],
              systemLogs: []
            };
          }
        } catch (error) {
          console.error('❌ StorageStore에서 세션 정보 가져오기 실패:', error);
        }
      }
    }
    
    if (!session) {
      console.error('❌ SessionManager.downloadAllAsZip - 세션을 찾을 수 없습니다');
      return false;
    }

    try {
      console.log(`🔧 SessionManager.downloadAllAsZip - 세션 발견: ${session.metadata.name}`);
      const zip = new JSZip();
      
      // 세션 정보 파일 추가
      const sessionInfo = this.generateSessionInfoText(session.metadata);
      zip.file('session_info.txt', sessionInfo);

      // 세션 메타데이터 JSON 파일 추가
      const metadataJson = JSON.stringify(session.metadata, null, 2);
      zip.file('metadata.json', metadataJson);

      // Raw 데이터 파일들 추가 (StorageStore 세션의 경우 파일 시스템에서 확인해야 하므로 항상 시도)
      const isStorageStoreSession = sessionId !== 'current' && session.eegData.length === 0 && session.ppgData.length === 0 && session.accData.length === 0;
      console.log(`🔧 세션 타입 확인: ${isStorageStoreSession ? 'StorageStore 세션' : 'localStorage 세션'}`);
      
      const rawDataTypes: Array<{ type: 'eeg' | 'ppg' | 'acc' | 'system', filename: string, hasData: boolean }> = [
        { type: 'eeg', filename: 'raw-data/eeg_raw_data.csv', hasData: isStorageStoreSession || session.eegData.length > 0 },
        { type: 'ppg', filename: 'raw-data/ppg_raw_data.csv', hasData: isStorageStoreSession || session.ppgData.length > 0 },
        { type: 'acc', filename: 'raw-data/acc_raw_data.csv', hasData: isStorageStoreSession || session.accData.length > 0 },
        { type: 'system', filename: 'system_logs.csv', hasData: isStorageStoreSession || session.systemLogs.length > 0 }
      ];

      // Raw 데이터 파일들 추가 (실제 저장된 파일들 우선, 없으면 localStorage 데이터 사용)
      await this.addRawDataToZip(zip, session.metadata, rawDataTypes, sessionId);

      // Analytics metrics 파일들 추가 (StreamingStorageService에서 저장된 파일들)
      await this.addAnalyticsMetricsToZip(zip, session.metadata);

      // ZIP 파일 생성
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipFileName = `${session.metadata.name}_complete_data_${Date.now()}.zip`;

      // 사용자가 선택한 폴더에 저장 또는 기본 다운로드
      if (targetDirHandle) {
        console.log(`🔧 사용자 선택 폴더에 저장: ${targetDirHandle.name}`);
        try {
          // 사용자가 선택한 폴더에 ZIP 파일 저장
          const fileHandle = await targetDirHandle.getFileHandle(zipFileName, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(zipBlob);
          await writable.close();
          console.log(`✅ ZIP 파일이 선택한 폴더에 저장됨: ${zipFileName}`);
        } catch (writeError) {
          console.error('❌ 선택한 폴더에 파일 저장 실패, 기본 다운로드로 대체:', writeError);
          // 폴더 저장 실패 시 기본 다운로드로 대체
          this.downloadZipBlob(zipBlob, zipFileName);
        }
      } else {
        console.log(`🔧 기본 다운로드 폴더에 저장`);
        // 기본 다운로드 방식 사용
        this.downloadZipBlob(zipBlob, zipFileName);
      }

      console.log('✅ ZIP 파일 다운로드 완료');
      return true;
    } catch (error) {
      console.error('ZIP 다운로드 실패:', error);
      return false;
    }
  }

  /**
   * ZIP blob을 기본 다운로드 방식으로 다운로드
   */
  private downloadZipBlob(zipBlob: Blob, fileName: string): void {
    const link = document.createElement('a');
    const url = URL.createObjectURL(zipBlob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Analytics metrics 파일들을 ZIP에 추가
   */
  private async addAnalyticsMetricsToZip(zip: JSZip, metadata: SessionMetadata): Promise<void> {
    try {
      console.log('🔧 Analytics metrics 파일들을 ZIP에 추가 시작...');
      
      // StorageStore에서 저장소 디렉토리 가져오기
      const { useStorageStore } = await import('../stores/storageStore');
      const storageStore = useStorageStore.getState();
      const storageDirectory = storageStore.config.storageDirectory;
      
      if (!storageDirectory) {
        console.warn('⚠️ 저장소 디렉토리가 없어서 샘플 analytics metrics 파일 생성');
        await this.addSampleAnalyticsMetrics(zip, metadata);
        return;
      }

      try {
        // 세션 디렉토리 경로 구성
        const sessionDate = metadata.startTime;
        const year = sessionDate.getFullYear().toString();
        const month = (sessionDate.getMonth() + 1).toString().padStart(2, '0');
        
        // 실제 저장된 analytics metrics 파일들 찾기
        const linkBandDataDir = await storageDirectory.getDirectoryHandle('LinkBand-Data');
        const sessionsDir = await linkBandDataDir.getDirectoryHandle('sessions');
        const yearDir = await sessionsDir.getDirectoryHandle(year);
        const monthDir = await yearDir.getDirectoryHandle(month);
        const sessionDir = await monthDir.getDirectoryHandle(metadata.id);
        const analyticsMetricsDir = await sessionDir.getDirectoryHandle('analysis-metrics');
        
        console.log('🔧 Analytics metrics 디렉토리 찾음:', analyticsMetricsDir.name);
        
        // analytics-metrics 디렉토리 내의 파일들 읽기
        const analyticsDir = 'analysis-metrics/';
        let filesAdded = 0;
        
        for await (const [name, handle] of (analyticsMetricsDir as any).entries()) {
          if (handle.kind === 'file' && name.endsWith('.csv')) {
            try {
              const file = await handle.getFile();
              const content = await file.text();
              zip.file(analyticsDir + name, content);
              filesAdded++;
              console.log(`✅ Analytics metrics 파일 추가됨: ${name} (${content.length} bytes)`);
            } catch (fileError) {
              console.warn(`⚠️ Analytics metrics 파일 읽기 실패: ${name}`, fileError);
            }
          }
        }
        
        if (filesAdded === 0) {
          console.warn('⚠️ Analytics metrics 파일이 없어서 샘플 파일 생성');
          await this.addSampleAnalyticsMetrics(zip, metadata);
        } else {
          console.log(`✅ ${filesAdded}개의 실제 analytics metrics 파일이 ZIP에 추가됨`);
        }
        
      } catch (dirError) {
        console.warn('⚠️ Analytics metrics 디렉토리 접근 실패, 샘플 파일 생성:', dirError);
        await this.addSampleAnalyticsMetrics(zip, metadata);
      }
      
    } catch (error) {
      console.error('❌ Analytics metrics 파일 추가 실패:', error);
      // 오류 발생 시에도 샘플 파일이라도 추가
      await this.addSampleAnalyticsMetrics(zip, metadata);
    }
  }

  /**
   * Raw data 파일들을 ZIP에 추가 (StorageStore 파일 시스템 우선)
   */
  private async addRawDataToZip(
    zip: JSZip, 
    metadata: SessionMetadata, 
    rawDataTypes: Array<{ type: 'eeg' | 'ppg' | 'acc' | 'system', filename: string, hasData: boolean }>,
    sessionId: string
  ): Promise<void> {
    try {
      console.log('🔧 Raw data 파일들을 ZIP에 추가 시작...');
      
      // StorageStore 세션인 경우 실제 파일 시스템에서 CSV 파일 읽기 시도
      if (sessionId !== 'current') {
        console.log('🔧 StorageStore 세션 - 실제 파일 시스템에서 CSV 파일 읽기 시도');
        const filesAdded = await this.addStorageStoreRawData(zip, metadata, rawDataTypes, sessionId);
        
        if (filesAdded > 0) {
          console.log(`✅ ${filesAdded}개의 실제 raw data 파일이 ZIP에 추가됨`);
          return;
        } else {
          console.warn('⚠️ 실제 파일을 찾을 수 없어서 빈 CSV 파일 생성');
        }
      }
      console.log('🔧 Raw data 파일들을 ZIP에 추가 시작...');
      
      // StorageStore에서 저장소 디렉토리 가져오기 (더 확실함)
      const { useStorageStore } = await import('../stores/storageStore');
      const storageStore = useStorageStore.getState();
      const storageDirectory = storageStore.config.storageDirectory;
      
      if (!storageDirectory) {
        console.warn('⚠️ 저장소 디렉토리가 없어서 localStorage 데이터 사용');
        await this.addLocalStorageRawData(zip, rawDataTypes, sessionId);
        return;
      }

      try {
        // 세션 디렉토리 경로 구성
        const sessionDate = metadata.startTime;
        const year = sessionDate.getFullYear().toString();
        const month = (sessionDate.getMonth() + 1).toString().padStart(2, '0');
        
        // 실제 저장된 raw data 파일들 찾기
        const linkBandDataDir = await storageDirectory.getDirectoryHandle('LinkBand-Data');
        const sessionsDir = await linkBandDataDir.getDirectoryHandle('sessions');
        const yearDir = await sessionsDir.getDirectoryHandle(year);
        const monthDir = await yearDir.getDirectoryHandle(month);
        const sessionDir = await monthDir.getDirectoryHandle(metadata.id);
        const rawDataDir = await sessionDir.getDirectoryHandle('raw-data');
        
        console.log('🔧 Raw data 디렉토리 찾음:', rawDataDir.name);
        
        // raw-data 디렉토리 내의 파일들 읽기
        let filesAdded = 0;
        
        for await (const [name, handle] of (rawDataDir as any).entries()) {
          if (handle.kind === 'file' && name.endsWith('.csv')) {
            try {
              const file = await handle.getFile();
              const content = await file.text();
              zip.file('raw-data/' + name, content);
              filesAdded++;
              console.log(`✅ Raw data 파일 추가됨: ${name} (${content.length} bytes)`);
            } catch (fileError) {
              console.warn(`⚠️ Raw data 파일 읽기 실패: ${name}`, fileError);
            }
          }
        }
        
        if (filesAdded === 0) {
          console.warn('⚠️ Raw data 파일이 없어서 localStorage 데이터 사용');
          await this.addLocalStorageRawData(zip, rawDataTypes, sessionId);
        } else {
          console.log(`✅ ${filesAdded}개의 실제 raw data 파일이 ZIP에 추가됨`);
        }
        
      } catch (dirError) {
        console.warn('⚠️ Raw data 디렉토리 접근 실패, localStorage 데이터 사용:', dirError);
        await this.addLocalStorageRawData(zip, rawDataTypes, sessionId);
      }
      
    } catch (error) {
      console.error('❌ Raw data 파일 추가 실패:', error);
      // 오류 발생 시에도 localStorage 데이터라도 추가
      await this.addLocalStorageRawData(zip, rawDataTypes, sessionId);
    }
  }

  /**
   * StorageStore 파일 시스템에서 실제 Raw data CSV 파일들을 ZIP에 추가
   */
  private async addStorageStoreRawData(
    zip: JSZip, 
    metadata: SessionMetadata, 
    rawDataTypes: Array<{ type: 'eeg' | 'ppg' | 'acc' | 'system', filename: string, hasData: boolean }>,
    sessionId: string
  ): Promise<number> {
    let filesAdded = 0;
    
    try {
      console.log('🔧 StorageStore Raw Data 읽기 시작...');
      
      // StorageStore에서 저장소 디렉토리 핸들 가져오기
      const { useStorageStore } = await import('../stores/storageStore');
      const storageStore = useStorageStore.getState();
      const storageDirectory = storageStore.config.storageDirectory;
      
      console.log('🔧 StorageStore 상태 확인:', {
        isInitialized: storageStore.isInitialized,
        storageDirectoryExists: storageDirectory ? 'YES' : 'NO',
        storageDirectoryName: storageDirectory?.name || 'null',
        storageDirectoryPath: storageStore.storageDirectoryPath
      });
      
      if (!storageDirectory) {
        console.warn('⚠️ StorageStore에 저장소 디렉토리가 없음');
        return 0;
      }
      
      return await this.processStorageDirectory(zip, storageDirectory, metadata, rawDataTypes, sessionId);
      
    } catch (error) {
      console.error('❌ StorageStore Raw Data 읽기 실패:', error);
      return 0;
    }
  }

  /**
   * 저장소 디렉토리에서 실제 파일들을 처리
   */
  private async processStorageDirectory(
    zip: JSZip,
    storageDirectory: FileSystemDirectoryHandle,
    metadata: SessionMetadata,
    rawDataTypes: Array<{ type: 'eeg' | 'ppg' | 'acc' | 'system', filename: string, hasData: boolean }>,
    sessionId: string
  ): Promise<number> {
    let filesAdded = 0;
    
    try {
      console.log(`🔧 저장소 디렉토리에서 세션 파일 찾기 시작: ${sessionId}`);
      console.log(`🔧 저장소 디렉토리 이름: ${storageDirectory.name}`);

      // 세션 디렉토리 경로 구성
      const sessionDate = metadata.startTime;
      const year = sessionDate.getFullYear().toString();
      const month = (sessionDate.getMonth() + 1).toString().padStart(2, '0');
      
      console.log(`🔧 세션 날짜 정보: ${year}년 ${month}월`);
      
      try {
        // 실제 저장된 raw data 파일들 찾기 - 더 안전한 방식으로 접근
        let sessionDir: FileSystemDirectoryHandle | null = null;
        
        // 여러 경로 패턴 시도
        const possiblePaths = [
          ['LinkBand-Data', 'sessions', year, month, sessionId],
          ['sessions', year, month, sessionId],
          [year, month, sessionId],
          [sessionId]
        ];
        
        for (const pathSegments of possiblePaths) {
          try {
            let currentDir = storageDirectory;
            console.log(`🔧 경로 시도: ${pathSegments.join(' -> ')}`);
            
            for (const segment of pathSegments) {
              currentDir = await currentDir.getDirectoryHandle(segment);
              console.log(`🔧 디렉토리 찾음: ${segment}`);
            }
            
            sessionDir = currentDir;
            console.log(`🔧 세션 디렉토리 찾음: ${sessionDir.name}`);
            break;
            
          } catch (pathError) {
            const errorMessage = pathError instanceof Error ? pathError.message : String(pathError);
            console.log(`🔧 경로 실패: ${pathSegments.join(' -> ')} - ${errorMessage}`);
            continue;
          }
        }
        
        if (!sessionDir) {
          throw new Error(`세션 디렉토리를 찾을 수 없음: ${sessionId}`);
        }
        
        // raw-data 디렉토리 찾기
        let rawDataDir: FileSystemDirectoryHandle | null = null;
        try {
          rawDataDir = await sessionDir.getDirectoryHandle('raw-data');
          console.log('🔧 raw-data 디렉토리 찾음');
        } catch (error) {
          console.log('🔧 raw-data 디렉토리가 없음, 세션 루트에서 CSV 파일 찾기 시도');
          rawDataDir = sessionDir; // 세션 루트 디렉토리에서 직접 찾기
        }
        
        // 각 데이터 타입별로 실제 CSV 파일 읽기
        for (const dataType of rawDataTypes) {
          if (!dataType.hasData) continue;
          
          try {
            let csvFileName = '';
            switch (dataType.type) {
              case 'eeg':
                csvFileName = 'eeg_raw_data.csv';
                break;
              case 'ppg':
                csvFileName = 'ppg_raw_data.csv';
                break;
              case 'acc':
                csvFileName = 'acc_raw_data.csv';
                break;
              case 'system':
                csvFileName = 'system_logs.csv';
                break;
            }
            
            const csvFileHandle = await rawDataDir!.getFileHandle(csvFileName);
            const csvFile = await csvFileHandle.getFile();
            const csvContent = await csvFile.text();
            
            if (csvContent.trim()) {
              zip.file(dataType.filename, csvContent);
              filesAdded++;
              console.log(`✅ 실제 Raw data 파일 추가됨: ${csvFileName} (${csvContent.length} bytes)`);
            } else {
              console.warn(`⚠️ ${csvFileName} 파일이 비어있음`);
            }
            
          } catch (fileError) {
            console.warn(`⚠️ ${dataType.type} raw data 파일 읽기 실패:`, fileError);
          }
        }
        
              } catch (dirError) {
          const errorMessage = dirError instanceof Error ? dirError.message : String(dirError);
          console.warn('⚠️ 세션 디렉토리 접근 실패:', errorMessage);
        }
      
    } catch (error) {
      console.error('❌ StorageStore raw data 파일 읽기 실패:', error);
    }
    
    return filesAdded;
  }

  /**
   * localStorage에서 Raw data를 CSV로 변환하여 ZIP에 추가 (fallback)
   */
  private async addLocalStorageRawData(
    zip: JSZip, 
    rawDataTypes: Array<{ type: 'eeg' | 'ppg' | 'acc' | 'system', filename: string, hasData: boolean }>,
    sessionId: string
  ): Promise<void> {
    console.log(`🔧 localStorage 데이터 fallback 시작 - sessionId: ${sessionId}`);
    
    // StorageStore 세션의 경우 빈 CSV 파일이라도 생성
    const isStorageStoreSession = sessionId !== 'current';
    
    for (const dataType of rawDataTypes) {
      if (dataType.hasData) {
        const csvContent = this.exportToCSV(sessionId, dataType.type);
        if (csvContent && csvContent.length > 0) {
          zip.file(dataType.filename, csvContent);
          console.log(`✅ ${dataType.filename} 파일 추가됨 (localStorage) (${csvContent.length} bytes)`);
        } else if (isStorageStoreSession) {
          // StorageStore 세션의 경우 빈 CSV 파일이라도 헤더와 함께 생성
          const emptyCSV = this.generateEmptyCSV(dataType.type);
          zip.file(dataType.filename, emptyCSV);
          console.log(`⚠️ ${dataType.filename} 빈 파일 추가됨 (StorageStore 세션)`);
        }
      }
    }
  }

  /**
   * 빈 CSV 파일 생성 (헤더만 포함)
   */
  private generateEmptyCSV(dataType: 'eeg' | 'ppg' | 'acc' | 'system'): string {
    switch (dataType) {
      case 'eeg':
        return 'timestamp,ch1,ch2,ch3,ch4,ch5,ch6,ch7,ch8,battery,temperature,accelerometer_x,accelerometer_y,accelerometer_z,gyroscope_x,gyroscope_y,gyroscope_z\n';
      case 'ppg':
        return 'timestamp,ppg_red,ppg_ir,ppg_green,ambient_light,temperature\n';
      case 'acc':
        return 'timestamp,x,y,z,magnitude\n';
      case 'system':
        return 'timestamp,event,details\n';
      default:
        return 'timestamp,data\n';
    }
  }

  /**
   * 샘플 Analytics metrics 파일들을 ZIP에 추가 (fallback)
   */
  private async addSampleAnalyticsMetrics(zip: JSZip, metadata: SessionMetadata): Promise<void> {
    const analyticsDir = 'analysis-metrics/';
    
    // EEG Analytics Metrics 샘플 생성
    const eegAnalyticsHeader = `# LINK BAND EEG Analysis Metrics - Session: ${metadata.name}\n`;
    const eegAnalyticsContent = eegAnalyticsHeader + 
      `timestamp,total_power,emotional_balance,attention,cognitive_load,focus_index,relaxation_index,stress_index,hemispheric_balance,emotional_stability,attention_level,meditation_level,` +
      `ma_total_power,ma_emotional_balance,ma_attention,ma_cognitive_load,ma_focus_index,ma_relaxation_index,ma_stress_index,ma_hemispheric_balance,ma_emotional_stability,ma_attention_level,ma_meditation_level\n`;
    
    // PPG Analytics Metrics 샘플 생성
    const ppgAnalyticsHeader = `# LINK BAND PPG Analysis Metrics - Session: ${metadata.name}\n`;
    const ppgAnalyticsContent = ppgAnalyticsHeader + 
      `timestamp,bpm,sdnn,rmssd,pnn50,lf_power,hf_power,lf_hf_ratio,stress_index,spo2,` +
      `ma_bpm,ma_sdnn,ma_rmssd,ma_pnn50,ma_lf_power,ma_hf_power,ma_lf_hf_ratio,ma_stress_index,ma_spo2\n`;
    
    // ACC Analytics Metrics 샘플 생성  
    const accAnalyticsHeader = `# LINK BAND ACC Analysis Metrics - Session: ${metadata.name}\n`;
    const accAnalyticsContent = accAnalyticsHeader + 
      `timestamp,activity_state,activity_level,stability,avg_movement,std_movement,max_movement,tilt_angle,balance,` +
      `ma_activity_level,ma_stability,ma_avg_movement,ma_std_movement,ma_max_movement,ma_tilt_angle,ma_balance\n`;

    // Analytics metrics 파일들을 ZIP에 추가
    zip.file(analyticsDir + 'eeg-analysis-metrics.csv', eegAnalyticsContent);
    zip.file(analyticsDir + 'ppg-analysis-metrics.csv', ppgAnalyticsContent);
    zip.file(analyticsDir + 'acc-analysis-metrics.csv', accAnalyticsContent);
    
    console.log('✅ 샘플 Analytics metrics 파일들이 ZIP에 추가됨');
  }

  /**
   * CSV 파일 다운로드
   */
  downloadCSV(sessionId: string, dataType: 'eeg' | 'ppg' | 'acc' | 'system' = 'eeg'): boolean {
    const csvContent = this.exportToCSV(sessionId, dataType);
    if (!csvContent) return false;

    try {
      const session = sessionId === 'current' ? this.currentSession : this.loadSession(sessionId);
      if (!session) return false;

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${session.metadata.name}_${dataType}_${Date.now()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

  
      return true;
    } catch (error) {
      console.error('CSV 다운로드 실패:', error);
      return false;
    }
  }

  /**
   * 저장소 용량 정보
   */
  getStorageInfo(): { used: number; available: number; sessions: number } {
    let used = 0;
    const sessions = this.getAllSessions().length;

    // localStorage 사용량 계산
    for (let key in localStorage) {
      if (key.startsWith(this.STORAGE_PREFIX) || key === this.METADATA_KEY) {
        used += localStorage[key].length;
      }
    }

    // 대략적인 사용 가능 용량 (5MB 가정)
    const available = 5 * 1024 * 1024 - used;

    return { used, available, sessions };
  }

  /**
   * 오래된 세션 정리
   */
  cleanupOldSessions(): void {
    const allSessions = this.getAllSessions();
    
    if (allSessions.length <= this.MAX_SESSIONS) return;

    // 시작 시간 기준으로 정렬 (오래된 순)
    allSessions.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    // 오래된 세션들 삭제
    const sessionsToDelete = allSessions.slice(0, allSessions.length - this.MAX_SESSIONS);
    
    for (const session of sessionsToDelete) {
      this.deleteSession(session.id);
    }


  }

  // Private methods

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionInfoText(metadata: SessionMetadata): string {
    let info = `LINK BAND Session Information\n`;
    info += `================================\n\n`;
    info += `Session Name: ${metadata.name}\n`;
    info += `Session ID: ${metadata.id}\n`;
    info += `Device: ${metadata.deviceName} (${metadata.deviceId})\n`;
    info += `Start Time: ${metadata.startTime.toISOString()}\n`;
    if (metadata.endTime) {
      info += `End Time: ${metadata.endTime.toISOString()}\n`;
    }
    info += `Duration: ${metadata.duration} seconds\n`;
    info += `Sampling Rate: ${metadata.samplingRate} Hz\n\n`;
    
    info += `Data Summary:\n`;
    info += `-------------\n`;
    info += `EEG Raw Data: ${metadata.dataCount.eeg.toLocaleString()} points\n`;
    info += `PPG Raw Data: ${metadata.dataCount.ppg.toLocaleString()} points\n`;
    info += `ACC Raw Data: ${metadata.dataCount.acc.toLocaleString()} points\n`;
    info += `EEG Processed Data: ${metadata.dataCount.eegProcessed.toLocaleString()} points\n`;
    info += `PPG Processed Data: ${metadata.dataCount.ppgProcessed.toLocaleString()} points\n`;
    info += `ACC Processed Data: ${metadata.dataCount.accProcessed.toLocaleString()} points\n\n`;
    
    info += `Save Options:\n`;
    info += `-------------\n`;
    info += `EEG Raw: ${metadata.saveOptions.eegRaw ? 'Enabled' : 'Disabled'}\n`;
    info += `PPG Raw: ${metadata.saveOptions.ppgRaw ? 'Enabled' : 'Disabled'}\n`;
    info += `ACC Raw: ${metadata.saveOptions.accRaw ? 'Enabled' : 'Disabled'}\n`;
    info += `EEG Processed: ${metadata.saveOptions.eegProcessed ? 'Enabled' : 'Disabled'}\n`;
    info += `PPG Processed: ${metadata.saveOptions.ppgProcessed ? 'Enabled' : 'Disabled'}\n`;
    info += `ACC Processed: ${metadata.saveOptions.accProcessed ? 'Enabled' : 'Disabled'}\n\n`;
    
    if (metadata.notes) {
      info += `Notes:\n`;
      info += `------\n`;
      info += `${metadata.notes}\n\n`;
    }
    
    info += `Generated: ${new Date().toISOString()}\n`;
    
    return info;
  }

  private startAutoSave(): void {
    this.stopAutoSave(); // 기존 타이머 정리
    
    this.autoSaveInterval = setInterval(() => {
      const endTimer = performanceMonitor.startTimer('SessionManager.autoSave');
      
      try {
        if (this.currentSession && !this.isSaving) {
          this.saveCurrentSessionOptimized();
        } else if (this.currentSession && this.isSaving) {
          // 저장 중이면 다음 주기에 저장하도록 플래그 설정
          this.pendingSave = true;
        }
      } finally {
        endTimer();
      }
    }, this.AUTO_SAVE_INTERVAL);
  }

  private stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
    this.pendingSave = false;
  }

  /**
   * 성능 최적화된 세션 저장 (증분 저장 + 비동기 처리)
   */
  private async saveCurrentSessionOptimized(): Promise<void> {
    if (!this.currentSession || this.isSaving) return;

    const endTimer = performanceMonitor.startTimer('SessionManager.saveOptimized');
    this.isSaving = true;
    
    try {
      // 변경된 데이터만 확인
      const currentDataCount = {
        eeg: this.currentSession.eegData.length,
        ppg: this.currentSession.ppgData.length,
        acc: this.currentSession.accData.length,
        eegProcessed: 0, // Processed data not stored in SessionData
        ppgProcessed: 0, // Processed data not stored in SessionData
        accProcessed: 0  // Processed data not stored in SessionData
      };

      // 변경사항이 없으면 저장 스킵
      const hasChanges = Object.keys(currentDataCount).some(key => 
        currentDataCount[key as keyof typeof currentDataCount] !== 
        this.lastSavedDataCount[key as keyof typeof this.lastSavedDataCount]
      );

      if (!hasChanges) {
        return;
      }
      
      // 비동기적으로 저장 (메인 스레드 블로킹 방지)
      await new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          const saveTimer = performanceMonitor.startTimer('SessionManager.localStorage');
          try {
            this.saveCurrentSession();
            
            // 저장된 데이터 카운트 업데이트
            this.lastSavedDataCount = { ...currentDataCount };
            
            resolve();
          } catch (error) {
            console.error('세션 저장 오류:', error);
            reject(error);
          } finally {
            saveTimer();
          }
        }, 0);
      });

    } catch (error) {
      console.error('최적화된 세션 저장 실패:', error);
    } finally {
      this.isSaving = false;
      endTimer();
      
      // 저장 중에 추가 저장 요청이 있었다면 다음 주기에 처리
      if (this.pendingSave) {
        this.pendingSave = false;
        setTimeout(() => this.saveCurrentSessionOptimized(), 1000);
      }
    }
  }

  private saveCurrentSession(): void {
    if (!this.currentSession) return;

    try {
      // 메타데이터 업데이트 (지속 시간 계산)
      const now = new Date();
      this.currentSession.metadata.duration = Math.floor(
        (now.getTime() - this.currentSession.metadata.startTime.getTime()) / 1000
      );
      
      // 데이터 카운트 업데이트
      this.currentSession.metadata.dataCount = {
        eeg: this.currentSession.eegData.length,
        ppg: this.currentSession.ppgData.length,
        acc: this.currentSession.accData.length,
        eegProcessed: 0, // Processed data not stored in SessionData
        ppgProcessed: 0, // Processed data not stored in SessionData
        accProcessed: 0  // Processed data not stored in SessionData
      };

      // 큰 데이터 세트의 경우 압축된 형태로 저장 고려
      const sessionData = this.currentSession;
      const dataSize = JSON.stringify(sessionData).length;
      
      if (dataSize > 5 * 1024 * 1024) { // 5MB 이상
        console.warn(`⚠️ 세션 데이터 크기가 큼: ${(dataSize / 1024 / 1024).toFixed(2)}MB`);
        
        // 큰 데이터의 경우 최신 데이터만 유지
        this.trimSessionData(sessionData);
      }

      // 현재 세션 저장
      const sessionJson = JSON.stringify(sessionData);
      localStorage.setItem(this.STORAGE_PREFIX + sessionData.metadata.id, sessionJson);

      // 메타데이터 업데이트
      const allSessions = this.getAllSessions();
      const existingIndex = allSessions.findIndex(s => s.id === sessionData.metadata.id);
      
      if (existingIndex >= 0) {
        allSessions[existingIndex] = sessionData.metadata;
      } else {
        allSessions.push(sessionData.metadata);
      }

      this.saveSessionsMetadata(allSessions);

      // 용량 관리
      this.cleanupOldSessions();

    } catch (error) {
      console.error('세션 저장 실패:', error);
      
      // 저장 공간 부족 시 오래된 세션 정리
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.cleanupOldSessions();
        // 재시도
        try {
          const sessionJson = JSON.stringify(this.currentSession);
          localStorage.setItem(this.STORAGE_PREFIX + this.currentSession.metadata.id, sessionJson);
        } catch (retryError) {
          console.error('세션 저장 재시도 실패:', retryError);
        }
      }
    }
  }

  /**
   * 지속시간 문자열을 초 단위로 변환
   */
  private parseDurationString(durationStr: string): number {
    if (!durationStr) return 0;
    
    // "16초", "1분 30초", "1시간 5분" 등의 형태를 파싱
    const timeUnits = [
      { unit: '시간', multiplier: 3600 },
      { unit: '분', multiplier: 60 },
      { unit: '초', multiplier: 1 }
    ];
    
    let totalSeconds = 0;
    
    for (const { unit, multiplier } of timeUnits) {
      const regex = new RegExp(`(\\d+)${unit}`);
      const match = durationStr.match(regex);
      if (match) {
        totalSeconds += parseInt(match[1]) * multiplier;
      }
    }
    
    return totalSeconds || 0;
  }

  /**
   * 큰 세션 데이터 정리 (메모리 최적화)
   */
  private trimSessionData(sessionData: SessionData): void {
    const maxPoints = 10000; // 각 데이터 타입당 최대 포인트 수
    
    if (sessionData.eegData.length > maxPoints) {
      sessionData.eegData = sessionData.eegData.slice(-maxPoints);
    }
    if (sessionData.ppgData.length > maxPoints) {
      sessionData.ppgData = sessionData.ppgData.slice(-maxPoints);
    }
    if (sessionData.accData.length > maxPoints) {
      sessionData.accData = sessionData.accData.slice(-maxPoints);
    }
    // Processed data not stored in SessionData - no trimming needed
  }

  private saveSessionsMetadata(sessions: SessionMetadata[]): void {
    try {
      const metadataJson = JSON.stringify(sessions);
      localStorage.setItem(this.METADATA_KEY, metadataJson);
    } catch (error) {
      console.error('세션 메타데이터 저장 실패:', error);
    }
  }

  private generateEEGCSV(data: EEGDataPoint[], metadata: SessionMetadata): string {
    let csv = `# LINK BAND EEG Data Export\n`;
    csv += `# Session: ${metadata.name}\n`;
    csv += `# Device: ${metadata.deviceName} (${metadata.deviceId})\n`;
    csv += `# Start Time: ${metadata.startTime.toISOString()}\n`;
    csv += `# Duration: ${metadata.duration}s\n`;
    csv += `# Sampling Rate: ${metadata.samplingRate}Hz\n`;
    csv += `# Data Points: ${data.length}\n`;
    csv += `#\n`;
    csv += `timestamp,fp1,fp2\n`;

    for (const point of data) {
      csv += `${point.timestamp},${point.fp1},${point.fp2}\n`;
    }

    return csv;
  }

  private generatePPGCSV(data: PPGDataPoint[], metadata: SessionMetadata): string {
    let csv = `# LINK BAND PPG Data Export\n`;
    csv += `# Session: ${metadata.name}\n`;
    csv += `timestamp,red,ir\n`;

    for (const point of data) {
      csv += `${point.timestamp},${point.red},${point.ir}\n`;
    }

    return csv;
  }

  private generateACCCSV(data: ACCDataPoint[], metadata: SessionMetadata): string {
    let csv = `# LINK BAND Accelerometer Data Export\n`;
    csv += `# Session: ${metadata.name}\n`;
    csv += `timestamp,x,y,z\n`;

    for (const point of data) {
      csv += `${point.timestamp},${point.x},${point.y},${point.z}\n`;
    }

    return csv;
  }

  private generateProcessedEEGCSV(data: ProcessedEEGData[], metadata: SessionMetadata): string {
    let csv = `# LINK BAND Processed EEG Data Export\n`;
    csv += `# Session: ${metadata.name}\n`;
    csv += `timestamp,delta,theta,alpha,beta,gamma,signal_quality,brain_state,confidence\n`;

    for (const point of data) {
      csv += `${point.timestamp},${point.bandPowers.delta},${point.bandPowers.theta},${point.bandPowers.alpha},${point.bandPowers.beta},${point.bandPowers.gamma},${point.signalQuality.overall},${point.brainState.currentState},${point.brainState.confidence}\n`;
    }

    return csv;
  }

  private generateProcessedPPGCSV(data: ProcessedPPGData[], metadata: SessionMetadata): string {
    let csv = `# LINK BAND Processed PPG Data Export\n`;
    csv += `# Session: ${metadata.name}\n`;
    csv += `timestamp,heart_rate,hrv,spo2,signal_quality\n`;

    for (const point of data) {
      csv += `${point.timestamp},${point.heartRate},${point.hrv},${point.spo2},${point.signalQuality}\n`;
    }

    return csv;
  }

  private generateProcessedACCCSV(data: ProcessedACCData[], metadata: SessionMetadata): string {
    let csv = `# LINK BAND Processed Accelerometer Data Export\n`;
    csv += `# Session: ${metadata.name}\n`;
    csv += `timestamp,magnitude,activity,steps,pitch,roll,yaw\n`;

    for (const point of data) {
      csv += `${point.timestamp},${point.magnitude},${point.activity},${point.steps},${point.orientation.pitch},${point.orientation.roll},${point.orientation.yaw}\n`;
    }

    return csv;
  }

  private generateSystemCSV(logs: string[], metadata: SessionMetadata): string {
    let csv = `# LINK BAND System Logs Export\n`;
    csv += `# Session: ${metadata.name}\n`;
    csv += `# Log Entries: ${logs.length}\n`;
    csv += `#\n`;

    for (const log of logs) {
      csv += log + '\n';
    }

    return csv;
  }

  /**
   * 성능 리포트 출력
   */
  getPerformanceReport() {
    return performanceMonitor.getAllMetrics();
  }

  /**
   * 성능 리포트 로깅
   */
  logPerformanceReport(): void {
    performanceMonitor.logPerformanceReport();
  }
}

// 싱글톤 인스턴스
export const sessionManager = new SessionManager(); 