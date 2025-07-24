import { EEGDataPoint, PPGDataPoint, ACCDataPoint } from '../../../utils/SimpleCircularBuffer';
import { ProcessedEEGData } from '../types/eeg';

// PPG와 ACC 처리된 데이터 타입 정의 (임시)
export interface ProcessedPPGData {
  timestamp: number;
  heartRate: number;
  hrv: number;
  spo2: number;
  signalQuality: number;
}

export interface ProcessedACCData {
  timestamp: number;
  magnitude: number;
  activity: string;
  steps: number;
  orientation: {
    pitch: number;
    roll: number;
    yaw: number;
  };
}

// 🔧 새로운 분석 지표 데이터 타입 정의
export interface EEGAnalysisMetrics {
  timestamp: number;
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
  // Moving Average 적용된 최종값
  movingAverageValues: {
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
  };
}

export interface PPGAnalysisMetrics {
  timestamp: number;
  bpm: number;
  sdnn: number;
  rmssd: number;
  pnn50: number;
  lfPower: number;
  hfPower: number;
  lfHfRatio: number;
  stressIndex: number;
  spo2: number; // optional 제거 (Visualizer에서 사용)
  // 새로운 HRV 지표들 추가
  avnn: number; // optional 제거 (Visualizer에서 사용)
  pnn20: number; // optional 제거 (Visualizer에서 사용)
  sdsd: number; // optional 제거 (Visualizer에서 사용)
  hrMax: number; // optional 제거 (Visualizer에서 사용)
  hrMin: number; // optional 제거 (Visualizer에서 사용)
  // Moving Average 적용된 최종값
  movingAverageValues: {
    bpm: number;
    sdnn: number;
    rmssd: number;
    pnn50: number;
    lfPower: number;
    hfPower: number;
    lfHfRatio: number;
    stressIndex: number;
    spo2: number; // optional 제거
    // 새로운 HRV 지표들 추가
    avnn: number; // optional 제거
    pnn20: number; // optional 제거
    sdsd: number; // optional 제거
    hrMax: number; // optional 제거
    hrMin: number; // optional 제거
  };
}

export interface ACCAnalysisMetrics {
  timestamp: number;
  activityState: string; // 'stationary', 'sitting', 'walking', 'running'
  intensity: number; // activityLevel → intensity로 변경 (Visualizer와 일치)
  stability: number;
  avgMovement: number;
  maxMovement: number;
  // 제거된 필드들: stdMovement, tiltAngle, balance (Visualizer에서 사용하지 않음)
  // Moving Average 적용된 최종값
  movingAverageValues: {
    intensity: number; // activityLevel → intensity로 변경
    stability: number;
    avgMovement: number;
    maxMovement: number;
    // 제거된 필드들: stdMovement, tiltAngle, balance
  };
}

/**
 * 스트리밍 저장 서비스
 * 메모리 효율적인 실시간 파일 저장을 제공
 * 목표: 메모리 사용량 50MB 이하 유지
 */

export interface StreamingSessionMetadata {
  id: string;
  name: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  deviceName: string;
  deviceId: string;
  samplingRate: number;
  totalSamples: number;
  estimatedSize: number;
  dataQuality: {
    eegQuality: number;
    ppgQuality: number;
    accQuality: number;
  };
  saveFormats: string[];
  notes?: string;
}

export interface StreamingSessionConfig {
  sessionName: string;
  deviceName: string;
  deviceId: string;
  saveFormats: ('json' | 'csv' | 'binary')[];
  dataTypes: {
    eegRaw: boolean;
    ppgRaw: boolean;
    accRaw: boolean;
    // 🔧 processed 데이터 타입 제거 - 복잡성으로 인해 제외
    // eegProcessed: boolean;
    // ppgProcessed: boolean;
    // accProcessed: boolean;
    // 🔧 분석 지표 데이터 타입만 유지
    eegAnalysisMetrics: boolean;
    ppgAnalysisMetrics: boolean;
    accAnalysisMetrics: boolean;
  };
  compression: boolean;
  chunkSize: number; // bytes
}

export interface FormatWriter {
  write(data: any): Promise<void>;
  close(): Promise<void>;
  getSize(): number;
}

export class StreamingStorageService {
  private static instance: StreamingStorageService;
  private storageDirectoryHandle: FileSystemDirectoryHandle | null = null;
  private currentSession: StreamingSessionMetadata | null = null;
  private fileStreams: Map<string, FileSystemWritableFileStream> = new Map();
  private formatWriters: Map<string, FormatWriter> = new Map();
  private memoryUsage: number = 0;
  private readonly MAX_MEMORY_USAGE = 50 * 1024 * 1024; // 50MB
  private readonly CHUNK_SIZE = 1024; // 1KB
  private isWriting = false;
  private writeQueue: Array<{ type: string; data: any }> = [];
  private compressionWorker: Worker | null = null;

  private constructor() {
    this.initializeCompressionWorker();
  }

  public static getInstance(): StreamingStorageService {
    if (!StreamingStorageService.instance) {
      StreamingStorageService.instance = new StreamingStorageService();
    }
    return StreamingStorageService.instance;
  }

  /**
   * 저장소 디렉토리 설정 (외부에서 호출)
   */
  async setStorageDirectoryHandle(directoryHandle: FileSystemDirectoryHandle): Promise<void> {
    this.storageDirectoryHandle = directoryHandle;
    
    // 저장소 구조 초기화
    try {
      await this.initializeStorageStructure();
    } catch (error) {
      throw error;
    }
  }

  /**
   * 저장소 디렉토리 선택
   */
  async selectStorageDirectory(): Promise<boolean> {
    try {
      if ('showDirectoryPicker' in window) {
        this.storageDirectoryHandle = await (window as any).showDirectoryPicker({
          mode: 'readwrite',
          startIn: 'documents'
        });
        
        // 저장소 구조 초기화
        await this.initializeStorageStructure();
        
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * 저장소 구조 초기화
   */
  private async initializeStorageStructure(): Promise<void> {
    if (!this.storageDirectoryHandle) return;

    try {
      // LinkBand-Data 루트 디렉토리 생성
      const rootDir = await this.storageDirectoryHandle.getDirectoryHandle('LinkBand-Data', { create: true });
      
      // 하위 디렉토리 생성
      await rootDir.getDirectoryHandle('config', { create: true });
      await rootDir.getDirectoryHandle('sessions', { create: true });
      await rootDir.getDirectoryHandle('exports', { create: true });
      await rootDir.getDirectoryHandle('backups', { create: true });
      await rootDir.getDirectoryHandle('temp', { create: true });
      await rootDir.getDirectoryHandle('logs', { create: true });

      // 현재 년도/월 디렉토리 생성
      const now = new Date();
      const year = now.getFullYear().toString();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      
      const sessionsDir = await rootDir.getDirectoryHandle('sessions', { create: true });
      const yearDir = await sessionsDir.getDirectoryHandle(year, { create: true });
      await yearDir.getDirectoryHandle(month, { create: true });

    } catch (error) {
      throw error;
    }
  }

  /**
   * 스트리밍 세션 시작
   */
  async startStreamingSession(config: StreamingSessionConfig): Promise<string> {
    if (!this.storageDirectoryHandle) {
      const errorMessage = '저장소 디렉토리가 선택되지 않았습니다. Data Center에서 저장소를 먼저 설정해주세요.';
      throw new Error(errorMessage);
    }

    // 기존 세션 종료
    if (this.currentSession) {
      await this.endStreamingSession();
    }

    try {
      const sessionId = this.generateSessionId();
      const now = new Date();

      // 세션 메타데이터 생성
      this.currentSession = {
        id: sessionId,
        name: config.sessionName,
        startTime: now,
        duration: 0,
        deviceName: config.deviceName,
        deviceId: config.deviceId,
        samplingRate: 250,
        totalSamples: 0,
        estimatedSize: 0,
        dataQuality: {
          eegQuality: 0,
          ppgQuality: 0,
          accQuality: 0
        },
        saveFormats: config.saveFormats,
        notes: ''
      };

      // 세션 디렉토리 생성
      const sessionDir = await this.createSessionDirectory(sessionId);
      
      // 파일 스트림 초기화
      await this.initializeFileStreams(sessionDir, config);

      return sessionId;
    } catch (error) {
      this.currentSession = null;
      throw error;
    }
  }

  /**
   * 세션 디렉토리 생성
   */
  private async createSessionDirectory(sessionId: string): Promise<FileSystemDirectoryHandle> {
    if (!this.storageDirectoryHandle) {
      throw new Error('저장소 디렉토리가 없습니다');
    }

    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');

    const rootDir = await this.storageDirectoryHandle.getDirectoryHandle('LinkBand-Data', { create: true });
    const sessionsDir = await rootDir.getDirectoryHandle('sessions', { create: true });
    const yearDir = await sessionsDir.getDirectoryHandle(year, { create: true });
    const monthDir = await yearDir.getDirectoryHandle(month, { create: true });
    
    // 세션 디렉토리 생성
    const sessionDir = await monthDir.getDirectoryHandle(sessionId, { create: true });
    
    // 하위 디렉토리 생성
    await sessionDir.getDirectoryHandle('raw-data', { create: true });
    await sessionDir.getDirectoryHandle('processed-data', { create: true });
    await sessionDir.getDirectoryHandle('analysis-results', { create: true });
    await sessionDir.getDirectoryHandle('exports', { create: true });

    return sessionDir;
  }

  /**
   * 파일 스트림 초기화
   */
  private async initializeFileStreams(
    sessionDir: FileSystemDirectoryHandle, 
    config: StreamingSessionConfig
  ): Promise<void> {
    const rawDataDir = await sessionDir.getDirectoryHandle('raw-data', { create: true });
    const processedDataDir = await sessionDir.getDirectoryHandle('processed-data', { create: true });
    // 🔧 분석 지표 데이터 디렉토리 추가
    const analysisMetricsDir = await sessionDir.getDirectoryHandle('analysis-metrics', { create: true });

    // 각 데이터 타입별로 파일 스트림 생성
    for (const format of config.saveFormats) {
      if (config.dataTypes.eegRaw) {
        await this.createFileStream(rawDataDir, `eeg-raw.${format}`, `eeg-raw-${format}`);
      }
      if (config.dataTypes.ppgRaw) {
        await this.createFileStream(rawDataDir, `ppg-raw.${format}`, `ppg-raw-${format}`);
      }
      if (config.dataTypes.accRaw) {
        await this.createFileStream(rawDataDir, `acc-raw.${format}`, `acc-raw-${format}`);
      }
      if (config.dataTypes.eegAnalysisMetrics) {
        await this.createFileStream(analysisMetricsDir, `eeg-analysis-metrics.${format}`, `eeg-analysis-metrics-${format}`);
      }
      if (config.dataTypes.ppgAnalysisMetrics) {
        await this.createFileStream(analysisMetricsDir, `ppg-analysis-metrics.${format}`, `ppg-analysis-metrics-${format}`);
      }
      if (config.dataTypes.accAnalysisMetrics) {
        await this.createFileStream(analysisMetricsDir, `acc-analysis-metrics.${format}`, `acc-analysis-metrics-${format}`);
      }
    }

    // 메타데이터 파일 생성
    await this.createFileStream(sessionDir, 'metadata.json', 'metadata');
  }

  /**
   * 파일 스트림 생성
   */
  private async createFileStream(
    directory: FileSystemDirectoryHandle,
    filename: string,
    streamKey: string
  ): Promise<void> {
    try {
      const fileHandle = await directory.getFileHandle(filename, { create: true });
      const stream = await fileHandle.createWritable();
      this.fileStreams.set(streamKey, stream);
      
      // 파일 헤더 작성 (형식에 따라)
      await this.writeFileHeader(stream, filename);
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * 파일 헤더 작성
   */
  private async writeFileHeader(stream: FileSystemWritableFileStream, filename: string): Promise<void> {
    const extension = filename.split('.').pop()?.toLowerCase();
    const now = new Date().toISOString();
    
    let header = '';
    
    switch (extension) {
      case 'csv':
        if (filename.includes('eeg-raw')) {
          header = `# LINK BAND EEG Raw Data - Generated: ${now}\ntimestamp,fp1,fp2,quality,leadoff_ch1,leadoff_ch2\n`;
        } else if (filename.includes('ppg-raw')) {
          header = `# LINK BAND PPG Raw Data - Generated: ${now}\ntimestamp,red,ir,quality\n`;
        } else if (filename.includes('acc-raw')) {
          header = `# LINK BAND ACC Raw Data - Generated: ${now}\ntimestamp,x,y,z,magnitude\n`;
        } else if (filename.includes('eeg-analysis-metrics')) {
          header = `# LINK BAND EEG Analysis Metrics - Generated: ${now}\n`;
          header += `timestamp,total_power,emotional_balance,attention,cognitive_load,focus_index,relaxation_index,stress_index,hemispheric_balance,emotional_stability,attention_level,meditation_level,`;
          header += `ma_total_power,ma_emotional_balance,ma_attention,ma_cognitive_load,ma_focus_index,ma_relaxation_index,ma_stress_index,ma_hemispheric_balance,ma_emotional_stability,ma_attention_level,ma_meditation_level\n`;
        } else if (filename.includes('ppg-analysis-metrics')) {
          header = `# LINK BAND PPG Analysis Metrics - Generated: ${now}\n`;
          header += `timestamp,bpm,sdnn,rmssd,pnn50,lf_power,hf_power,lf_hf_ratio,stress_index,spo2,avnn,pnn20,sdsd,hr_max,hr_min,`;
          header += `ma_bpm,ma_sdnn,ma_rmssd,ma_pnn50,ma_lf_power,ma_hf_power,ma_lf_hf_ratio,ma_stress_index,ma_spo2,ma_avnn,ma_pnn20,ma_sdsd,ma_hr_max,ma_hr_min\n`;
        } else if (filename.includes('acc-analysis-metrics')) {
          header = `# LINK BAND ACC Analysis Metrics - Generated: ${now}\n`;
          header += `timestamp,activity_state,intensity,stability,avg_movement,max_movement,`;
          header += `ma_intensity,ma_stability,ma_avg_movement,ma_max_movement\n`;
        }
        break;
      case 'json':
        // 메타데이터 파일은 단일 객체로 저장, 다른 JSON 파일은 배열로 저장
        if (filename === 'metadata.json') {
          header = ''; // 메타데이터는 헤더 없음 (단일 객체)
        } else {
          header = '[\n'; // 데이터 파일은 배열로 저장
        }
        break;
      case 'jsonl':
        header = ''; // JSON Lines는 헤더 없음
        break;
    }
    
    if (header) {
      await stream.write(new TextEncoder().encode(header));
    }
  }

  /**
   * EEG 데이터 스트리밍 저장
   */
  async writeEEGData(data: EEGDataPoint[]): Promise<void> {
    if (!this.currentSession) {
      return;
    }

    // 메모리 사용량 체크
    if (this.memoryUsage > this.MAX_MEMORY_USAGE) {
      await this.triggerGarbageCollection();
    }

    // 큐에 추가하여 비동기 처리
    this.writeQueue.push({ type: 'eeg-raw', data });
    
    if (!this.isWriting) {
      this.processWriteQueue();
    }

    // 메타데이터 업데이트
    if (this.currentSession) {
      this.currentSession.totalSamples += data.length;
      this.currentSession.estimatedSize += this.estimateDataSize(data);
    }
  }

  /**
   * PPG 데이터 스트리밍 저장
   */
  async writePPGData(data: PPGDataPoint[]): Promise<void> {
    if (!this.currentSession) {
      return;
    }

    this.writeQueue.push({ type: 'ppg-raw', data });
    
    if (!this.isWriting) {
      this.processWriteQueue();
    }

    // 메타데이터 업데이트
    if (this.currentSession) {
      this.currentSession.totalSamples += data.length;
      this.currentSession.estimatedSize += this.estimateDataSize(data);
    }
  }

  /**
   * ACC 데이터 스트리밍 저장
   */
  async writeACCData(data: ACCDataPoint[]): Promise<void> {
    if (!this.currentSession) return;

    // 원시 데이터 큐에 추가
    this.writeQueue.push({ type: 'acc-raw', data });
    
    if (!this.isWriting) {
      this.processWriteQueue();
    }

    // 메타데이터 업데이트
    if (this.currentSession) {
      this.currentSession.totalSamples += data.length;
      this.currentSession.estimatedSize += this.estimateDataSize(data);
    }
  }

  // 🔧 새로운 분석 지표 데이터 저장 메소드들
  /**
   * EEG 분석 지표 데이터 스트리밍 저장
   */
  async writeEEGAnalysisMetrics(data: EEGAnalysisMetrics): Promise<void> {
    if (!this.currentSession) {
      return;
    }

    this.writeQueue.push({ type: 'eeg-analysis-metrics', data: [data] });
    
    if (!this.isWriting) {
      this.processWriteQueue();
    }

    // 메타데이터 업데이트
    if (this.currentSession) {
      this.currentSession.estimatedSize += this.estimateDataSize([data]);
    }
  }

  /**
   * PPG 분석 지표 데이터 스트리밍 저장
   */
  async writePPGAnalysisMetrics(data: PPGAnalysisMetrics): Promise<void> {
    if (!this.currentSession) {
      return;
    }

    this.writeQueue.push({ type: 'ppg-analysis-metrics', data: [data] });
    
    if (!this.isWriting) {
      this.processWriteQueue();
    }

    // 메타데이터 업데이트
    if (this.currentSession) {
      this.currentSession.estimatedSize += this.estimateDataSize([data]);
    }
  }

  /**
   * ACC 분석 지표 데이터 스트리밍 저장
   */
  async writeACCAnalysisMetrics(data: ACCAnalysisMetrics): Promise<void> {
    if (!this.currentSession) {
      return;
    }

    this.writeQueue.push({ type: 'acc-analysis-metrics', data: [data] });
    
    if (!this.isWriting) {
      this.processWriteQueue();
    }

    // 메타데이터 업데이트
    if (this.currentSession) {
      this.currentSession.estimatedSize += this.estimateDataSize([data]);
    }
  }

  /**
   * 쓰기 큐 처리 (비동기)
   */
  private async processWriteQueue(): Promise<void> {
    if (this.isWriting || this.writeQueue.length === 0) {
      return;
    }

    this.isWriting = true;

    try {
      while (this.writeQueue.length > 0) {
        const item = this.writeQueue.shift();
        if (item) {
          await this.writeDataToStreams(item.type, item.data);
          
          // 메모리 사용량 업데이트
          this.memoryUsage += this.estimateDataSize(item.data);
        }
      }
    } catch (error) {
    } finally {
      this.isWriting = false;
    }
  }

  /**
   * 데이터를 스트림에 쓰기
   */
    private async writeDataToStreams(type: string, data: any[]): Promise<void> {
    // CSV 형식으로 저장
    const csvStream = this.fileStreams.get(`${type}-csv`);
    if (csvStream) {
      const csvData = this.convertToCSV(type, data);
      await csvStream.write(new TextEncoder().encode(csvData));
    } else {
      // CSV 스트림을 찾을 수 없음
    }

    // JSON Lines 형식으로 저장
    const jsonStream = this.fileStreams.get(`${type}-json`);
    if (jsonStream) {
      const jsonData = this.convertToJSONLines(data);
      await jsonStream.write(new TextEncoder().encode(jsonData));
    } else {
      // JSON 스트림을 찾을 수 없음
    }

    // Binary 형식으로 저장
    const binaryStream = this.fileStreams.get(`${type}-binary`);
    if (binaryStream) {
      const binaryData = this.convertToBinary(type, data);
      await binaryStream.write(binaryData);
    } else {
      // Binary 스트림을 찾을 수 없음
    }
  }

  /**
   * CSV 형식 변환
   */
  private convertToCSV(type: string, data: any[]): string {
    let csv = '';
    
    for (const item of data) {
      switch (type) {
        case 'eeg-raw':
          csv += `${item.timestamp},${item.fp1},${item.fp2},${item.signalQuality},${item.leadOff.ch1},${item.leadOff.ch2}\n`;
          break;
        case 'ppg-raw':
          csv += `${item.timestamp},${item.red},${item.ir},${item.signalQuality}\n`;
          break;
        case 'acc-raw':
          csv += `${item.timestamp},${item.x},${item.y},${item.z},${item.magnitude}\n`;
          break;
        case 'eeg-analysis-metrics':
          const eegItem = item as EEGAnalysisMetrics;
          csv += `${eegItem.timestamp},${eegItem.totalPower},${eegItem.emotionalBalance},${eegItem.attention},${eegItem.cognitiveLoad},${eegItem.focusIndex},${eegItem.relaxationIndex},${eegItem.stressIndex},${eegItem.hemisphericBalance},${eegItem.emotionalStability},${eegItem.attentionLevel},${eegItem.meditationLevel},`;
          csv += `${eegItem.movingAverageValues.totalPower},${eegItem.movingAverageValues.emotionalBalance},${eegItem.movingAverageValues.attention},${eegItem.movingAverageValues.cognitiveLoad},${eegItem.movingAverageValues.focusIndex},${eegItem.movingAverageValues.relaxationIndex},${eegItem.movingAverageValues.stressIndex},${eegItem.movingAverageValues.hemisphericBalance},${eegItem.movingAverageValues.emotionalStability},${eegItem.movingAverageValues.attentionLevel},${eegItem.movingAverageValues.meditationLevel}\n`;
          break;
        case 'ppg-analysis-metrics':
          const ppgItem = item as PPGAnalysisMetrics;
          csv += `${ppgItem.timestamp},${ppgItem.bpm},${ppgItem.sdnn},${ppgItem.rmssd},${ppgItem.pnn50},${ppgItem.lfPower},${ppgItem.hfPower},${ppgItem.lfHfRatio},${ppgItem.stressIndex},${ppgItem.spo2},${ppgItem.avnn},${ppgItem.pnn20},${ppgItem.sdsd},${ppgItem.hrMax},${ppgItem.hrMin},`;
          csv += `${ppgItem.movingAverageValues.bpm},${ppgItem.movingAverageValues.sdnn},${ppgItem.movingAverageValues.rmssd},${ppgItem.movingAverageValues.pnn50},${ppgItem.movingAverageValues.lfPower},${ppgItem.movingAverageValues.hfPower},${ppgItem.movingAverageValues.lfHfRatio},${ppgItem.movingAverageValues.stressIndex},${ppgItem.movingAverageValues.spo2},${ppgItem.movingAverageValues.avnn},${ppgItem.movingAverageValues.pnn20},${ppgItem.movingAverageValues.sdsd},${ppgItem.movingAverageValues.hrMax},${ppgItem.movingAverageValues.hrMin}\n`;
          break;
        case 'acc-analysis-metrics':
          const accItem = item as ACCAnalysisMetrics;
          csv += `${accItem.timestamp},${accItem.activityState},${accItem.intensity},${accItem.stability},${accItem.avgMovement},${accItem.maxMovement},`;
          csv += `${accItem.movingAverageValues.intensity},${accItem.movingAverageValues.stability},${accItem.movingAverageValues.avgMovement},${accItem.movingAverageValues.maxMovement}\n`;
          break;
      }
    }
    
    return csv;
  }

  /**
   * JSON Lines 형식 변환
   */
  private convertToJSONLines(data: any[]): string {
    return data.map(item => JSON.stringify(item)).join('\n') + '\n';
  }

  /**
   * Binary 형식 변환
   */
  private convertToBinary(type: string, data: any[]): ArrayBuffer {
    // 간단한 바이너리 형식 (실제로는 더 복잡한 구조 필요)
    const buffer = new ArrayBuffer(data.length * 32); // 32 bytes per sample
    const view = new DataView(buffer);
    
    data.forEach((item, index) => {
      const offset = index * 32;
      view.setFloat64(offset, item.timestamp, true);
      
      if (type === 'eeg-raw') {
        view.setFloat32(offset + 8, item.fp1, true);
        view.setFloat32(offset + 12, item.fp2, true);
        view.setFloat32(offset + 16, item.signalQuality, true);
      }
      // 다른 타입들도 유사하게 처리
    });
    
    return buffer;
  }

  /**
   * 스트리밍 세션 종료
   */
  async endStreamingSession(): Promise<void> {
    if (!this.currentSession) return;

    try {
      // 남은 쓰기 큐 처리
      await this.processWriteQueue();

      // 메타데이터 업데이트
      this.currentSession.endTime = new Date();
      this.currentSession.duration = Math.floor(
        (this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime()) / 1000
      );

      // 실제 디렉토리 크기 계산 및 업데이트
      if (this.storageDirectoryHandle) {
        try {
          // 현재 세션 디렉토리 핸들 가져오기
          const linkBandDataDir = await this.storageDirectoryHandle.getDirectoryHandle('LinkBand-Data');
          const sessionsDir = await linkBandDataDir.getDirectoryHandle('sessions');
          const year = this.currentSession.startTime.getFullYear().toString();
          const month = (this.currentSession.startTime.getMonth() + 1).toString().padStart(2, '0');
          const yearDir = await sessionsDir.getDirectoryHandle(year);
          const monthDir = await yearDir.getDirectoryHandle(month);
          const sessionDir = await monthDir.getDirectoryHandle(this.currentSession.id);
          
          // 실제 디렉토리 크기 계산
          const actualSize = await this.calculateDirectorySize(sessionDir);
          this.currentSession.estimatedSize = actualSize;
          
        } catch (error) {
        }
      }

      // 메타데이터 저장
      await this.saveSessionMetadata();

      // 파일 스트림 닫기
      await this.closeAllStreams();

      this.currentSession = null;

    } catch (error) {
      throw error;
    }
  }

  /**
   * 세션 메타데이터 저장
   */
  private async saveSessionMetadata(): Promise<void> {
    if (!this.currentSession) return;

    const metadataStream = this.fileStreams.get('metadata');
    if (metadataStream) {
      const metadata = JSON.stringify(this.currentSession, null, 2);
      await metadataStream.write(new TextEncoder().encode(metadata));
    }
  }

  /**
   * 모든 스트림 닫기
   */
  private async closeAllStreams(): Promise<void> {
    const closePromises = Array.from(this.fileStreams.values()).map(stream => stream.close());
    await Promise.all(closePromises);
    this.fileStreams.clear();
  }

  /**
   * 메모리 사용량 추정
   */
  private estimateMemoryUsage(): number {
    return this.writeQueue.length * 1024; // 큐의 아이템당 1KB로 추정
  }

  /**
   * 데이터 크기 추정
   */
  private estimateDataSize(data: any[]): number {
    return JSON.stringify(data).length;
  }

  /**
   * 가비지 컬렉션 트리거
   */
  private async triggerGarbageCollection(): Promise<void> {
    // 쓰기 큐 강제 처리
    await this.processWriteQueue();
    
    // 메모리 사용량 리셋
    this.memoryUsage = 0;
    

  }

  /**
   * 압축 워커 초기화
   */
  private initializeCompressionWorker(): void {
    // 실제 구현에서는 별도의 워커 파일 필요
    // 실제 구현에서는 별도의 워커 파일 필요
  }

  /**
   * 세션 ID 생성
   */
  private generateSessionId(): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `session-${timestamp}`;
  }

  /**
   * 현재 세션 정보 반환
   */
  getCurrentSession(): StreamingSessionMetadata | null {
    return this.currentSession;
  }

  /**
   * 저장소 디렉토리 핸들 반환
   */
  getStorageDirectoryHandle(): FileSystemDirectoryHandle | null {
    return this.storageDirectoryHandle;
  }

  /**
   * 메모리 사용량 반환
   */
  getMemoryUsage(): number {
    return this.memoryUsage;
  }

  /**
   * 저장 상태 반환
   */
  getStorageStatus(): {
    isWriting: boolean;
    queueLength: number;
    memoryUsage: number;
    currentSession: StreamingSessionMetadata | null;
  } {
    return {
      isWriting: this.isWriting,
      queueLength: this.writeQueue.length,
      memoryUsage: this.memoryUsage,
      currentSession: this.currentSession
    };
  }

  /**
   * 디렉토리의 실제 크기를 계산합니다 (모든 파일 크기 합계)
   */
  private async calculateDirectorySize(directoryHandle: FileSystemDirectoryHandle): Promise<number> {
    let totalSize = 0;
    
    try {
      // @ts-ignore - FileSystemDirectoryHandle의 entries() 메서드 사용
      for await (const [name, handle] of directoryHandle.entries()) {
        if (handle.kind === 'file') {
          try {
            const file = await handle.getFile();
            totalSize += file.size;
          } catch (error) {
          }
        } else if (handle.kind === 'directory') {
          // 재귀적으로 하위 디렉토리 크기 계산
          const subDirSize = await this.calculateDirectorySize(handle);
          totalSize += subDirSize;
        }
      }
    } catch (error) {
    }
    
    return totalSize;
  }
} 