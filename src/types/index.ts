// EEG 디바이스 관련 타입
export interface EEGDevice {
  id: string;
  name: string;
  connected: boolean;
  batteryLevel?: number;
  signalQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

// 블루투스 연결 인터페이스
export interface BluetoothConnection {
  connect(): Promise<EEGDevice>;
  disconnect(): void;
  getConnectionStatus(): boolean;
  onDataReceived(callback: (data: Float32Array) => void): void;
  onConnectionLost(callback: () => void): void;
}

// EEG 샘플 데이터
export interface EEGSample {
  timestamp: number;
  channels: Float32Array; // [FP1, FP2, etc.]
  sampleRate: number;
  sequenceNumber: number;
}

// PPG 샘플 데이터
export interface PPGSample {
  timestamp: number;
  red: number;    // Red LED 값
  ir: number;     // IR LED 값
}

// 가속도계 샘플 데이터
export interface AccSample {
  timestamp: number;
  x: number;      // X축 가속도 (g)
  y: number;      // Y축 가속도 (g)
  z: number;      // Z축 가속도 (g)
}

// 신호 품질
export interface SignalQuality {
  overall: number; // 0-100
  channels: number[]; // 각 채널별 품질
  artifacts: {
    movement: boolean;
    eyeBlink: boolean;
    muscleNoise: boolean;
  };
}

// 처리된 EEG 데이터
export interface ProcessedEEGData {
  bandPowers: BandPowers;
  signalQuality: SignalQuality;
  brainState: BrainStateAnalysis;
  timestamp: number;
}

// EEG 처리기 인터페이스
export interface EEGProcessor {
  processSample(sample: EEGSample): ProcessedEEGData;
  getSignalQuality(): SignalQuality;
  calibrate(): Promise<void>;
}

// 주파수 대역별 파워
export interface BandPowers {
  delta: number;    // 0.5-4Hz (깊은 수면)
  theta: number;    // 4-8Hz (명상, 창의성)
  alpha: number;    // 8-13Hz (이완, 집중)
  beta: number;     // 13-30Hz (각성, 인지)
  gamma: number;    // 30-50Hz (고차 인지)
}

// 뇌파 상태
export const BrainState = {
  STRESSED: 'stressed',      // 높은 Beta, 낮은 Alpha
  RELAXED: 'relaxed',        // 높은 Alpha, 낮은 Beta
  FOCUSED: 'focused',        // 균형잡힌 Alpha/Beta
  DROWSY: 'drowsy',          // 높은 Theta/Delta
  ACTIVE: 'active',          // 높은 Beta/Gamma
  UNKNOWN: 'unknown'         // 신호 품질 불량
} as const;

export type BrainStateType = typeof BrainState[keyof typeof BrainState];

// 뇌파 상태 분석
export interface BrainStateAnalysis {
  currentState: BrainStateType;
  confidence: number;        // 0-1
  stateHistory: BrainStateType[];
  metrics: {
    arousal: number;         // 각성도 (0-1)
    valence: number;         // 정서가 (0-1)
    attention: number;       // 집중도 (0-1)
    relaxation: number;      // 이완도 (0-1)
  };
  recommendations?: string[]; // 추천사항 (선택적)
}

// 연결 상태
export interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  device?: EEGDevice;
  error?: string;
  lastConnected?: Date;
}

// 차트 데이터 포인트
export interface ChartDataPoint {
  timestamp: number;
  value: number;
}

// 실시간 EEG 차트 데이터
export interface RealTimeEEGData {
  channels: {
    [channelName: string]: ChartDataPoint[];
  };
  maxPoints: number;
}

// 주파수 스펙트럼 데이터
export interface FrequencySpectrumData {
  frequencies: number[];
  magnitudes: number[];
  timestamp: number;
}

// 블루투스 EEG 서비스 인터페이스
export interface BluetoothEEGService {
  scan(): Promise<EEGDevice[]>;
  connect(deviceId: string): Promise<BluetoothDevice>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  onDataReceived(callback: (data: Float32Array) => void): void;
  onConnectionLost(callback: () => void): void;
  getBatteryLevel(): Promise<number>;
} 