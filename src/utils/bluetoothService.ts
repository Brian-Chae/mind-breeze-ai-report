import type { EEGDevice } from '../types/eeg';
import { StreamProcessor } from './StreamProcessor';
// import { useSystemStore } from '../stores/systemStore';

// LINK BAND EEG 디바이스 블루투스 서비스
// Python SDK device.py를 참고하여 구현

// LINK BAND 실제 UUID (Python SDK에서 확인된 값들)
const LINK_BAND_UUIDs = {
  // EEG 서비스
  EEG_SERVICE: 'df7b5d95-3afe-00a1-084c-b50895ef4f95',
  EEG_CHARACTERISTIC: '00ab4d15-66b4-0d8a-824f-8d6f8966c6e5',
  
  // PPG 서비스  
  PPG_SERVICE: '1cc50ec0-6967-9d84-a243-c2267f924d1f',
  PPG_CHARACTERISTIC: '6c739642-23ba-818b-2045-bfe8970263f6',
  
  // 가속도계 서비스
  ACCELEROMETER_SERVICE: '75c276c3-8f97-20bc-a143-b354244886d4',
  ACCELEROMETER_CHARACTERISTIC: 'd3d46a35-4394-e9aa-5a43-e7921120aaed',
  
  // 배터리 서비스 (표준 BLE)
  BATTERY_SERVICE: '0000180f-0000-1000-8000-00805f9b34fb',
  BATTERY_CHARACTERISTIC: '00002a19-0000-1000-8000-00805f9b34fb'
};

// 샘플링 레이트 (Python SDK 참고)
const SAMPLING_RATES = {
  EEG: 250,   // 250Hz
  PPG: 50,    // 50Hz  
  ACC: 30     // 30Hz
};

// 실시간 샘플링 레이트 계산을 위한 추가 상수
const SAMPLING_RATE_CALCULATION = {
  WINDOW_SIZE: 10000,  // 10초 윈도우
  UPDATE_INTERVAL: 1000, // 1초마다 업데이트
  MIN_SAMPLES_FOR_CALCULATION: 10, // 최소 샘플 수
  HISTORY_SIZE: 10 // 최근 10개 측정값 저장
};

// 타임스탬프 클럭 (32.768kHz)
const TIMESTAMP_CLOCK = 32768.0;

export interface BluetoothEEGService {
  scan(): Promise<EEGDevice[]>;
  connect(deviceId: string): Promise<BluetoothDevice>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  onConnectionLost(callback: () => void): void;
  getBatteryLevel(): Promise<number>;
  getDeviceName(): string;
  getDeviceId(): string;
  clearDeviceCache(): void;
}

interface EEGDataSample {
  timestamp: number;
  ch1: number;    // 채널 1 (μV)
  ch2: number;    // 채널 2 (μV)
  leadoff_ch1: boolean;  // 채널 1 전극 접촉 상태
  leadoff_ch2: boolean;  // 채널 2 전극 접촉 상태
}

interface PPGDataSample {
  timestamp: number;
  red: number;    // Red LED 값
  ir: number;     // IR LED 값
}

interface AccDataSample {
  timestamp: number;
  x: number;      // X축 가속도 (g)
  y: number;      // Y축 가속도 (g)
  z: number;      // Z축 가속도 (g)
}



class LinkBandBluetoothService implements BluetoothEEGService {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private eegService: BluetoothRemoteGATTService | null = null;
  private ppgService: BluetoothRemoteGATTService | null = null;
  private accelerometerService: BluetoothRemoteGATTService | null = null;
  private batteryService: BluetoothRemoteGATTService | null = null;
  
  private eegCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private ppgCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private accelerometerCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private batteryCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

  private connectionLostCallback: (() => void) | null = null;

  // StreamProcessor 인스턴스
  private streamProcessor: StreamProcessor;

  // 데이터 수신 콜백
  public onDataReceived: ((data: any) => void) | null = null;

  // 배터리 레벨
  private batteryLevel: number = 0;
  
  // 배터리 예측 시스템
  private batteryHistory: Array<{
    level: number;
    timestamp: number;
  }> = [];
  
  private batteryPrediction: {
    mode: 'charging' | 'discharging' | 'unknown';
    ratePerMinute: number; // %/분
    estimatedTimeRemaining: number; // 분 단위
    lastCalculation: number;
  } = {
    mode: 'unknown',
    ratePerMinute: 0,
    estimatedTimeRemaining: 0,
    lastCalculation: 0
  };
  
  // 연결 시작 시간
  private connectionStartTime: number = 0;
  
  // 현재 연결 지속 시간 (실시간 계산)
  private currentConnectionDuration: number = 0;

  // 스캔된 디바이스 캐시
  private scannedDevices: Map<string, BluetoothDevice> = new Map();

  // ACC timestamp 동기화를 위한 변수들
  private lastAccTimestamp: number = 0;
  private accPacketCount: number = 0;

  // 실시간 샘플링 레이트 계산을 위한 변수들
  private samplingRateCounters = {
    eeg: { samples: 0, lastReset: Date.now(), currentRate: 0, history: [] as number[] },
    ppg: { samples: 0, lastReset: Date.now(), currentRate: 0, history: [] as number[] },
    acc: { samples: 0, lastReset: Date.now(), currentRate: 0, history: [] as number[] }
  };
  
  // 샘플링 레이트 모니터링 타이머
  private samplingRateMonitor: NodeJS.Timeout | null = null;

  constructor() {
    this.streamProcessor = new StreamProcessor();
  }

  /**
   * StreamProcessor에 Store 콜백 설정
   */
  setStoreCallbacks(callbacks: any): void {
    this.streamProcessor.setStoreCallbacks(callbacks);
  }

  /**
   * 실시간 샘플링 레이트 모니터링 시작
   */
  private startSamplingRateMonitoring(): void {
    this.samplingRateMonitor = setInterval(() => {
      this.calculateAndUpdateSamplingRates();
      this.updateConnectionDuration();
    }, SAMPLING_RATE_CALCULATION.UPDATE_INTERVAL);
  }

  /**
   * 실시간 샘플링 레이트 모니터링 중지
   */
  private stopSamplingRateMonitoring(): void {
    if (this.samplingRateMonitor) {
      clearInterval(this.samplingRateMonitor);
      this.samplingRateMonitor = null;
    }
  }

  /**
   * 샘플링 레이트 계산 및 업데이트 (최근 10초 평균)
   */
  private calculateAndUpdateSamplingRates(): void {
    const now = Date.now();
    
    Object.keys(this.samplingRateCounters).forEach(sensor => {
      const counter = this.samplingRateCounters[sensor as keyof typeof this.samplingRateCounters];
      const timeDiff = (now - counter.lastReset) / 1000; // 초 단위
      
      if (timeDiff > 0 && counter.samples >= SAMPLING_RATE_CALCULATION.MIN_SAMPLES_FOR_CALCULATION) {
        // 현재 측정값 계산 (소수점 한자리까지)
        const currentRate = Math.round((counter.samples / timeDiff) * 10) / 10;
        
        // 히스토리에 추가
        counter.history.push(currentRate);
        
        // 히스토리 크기 제한 (최근 10개 측정값만 유지)
        if (counter.history.length > SAMPLING_RATE_CALCULATION.HISTORY_SIZE) {
          counter.history.shift();
        }
        
        // 최근 10초 평균 계산 (소수점 한자리까지)
        const averageRate = counter.history.reduce((sum, rate) => sum + rate, 0) / counter.history.length;
        counter.currentRate = Math.round(averageRate * 10) / 10;
        
        // 카운터 리셋
        counter.samples = 0;
        counter.lastReset = now;
      }
    });
  }

  /**
   * 연결 지속 시간 업데이트
   */
  private updateConnectionDuration(): void {
    if (this.isConnected() && this.connectionStartTime > 0) {
      this.currentConnectionDuration = Date.now() - this.connectionStartTime;
    }
  }

  // SystemControlService 콜백 함수들 (배터리 정보만 유지)
  private systemCallbacks: {
    onBatteryUpdate?: (level: number, voltage?: number) => void;
  } = {};

  /**
   * SystemControlService 콜백 설정
   */
  setSystemCallbacks(callbacks: {
    onBatteryUpdate?: (level: number, voltage?: number) => void;
  }): void {
    this.systemCallbacks = callbacks;
  }

  /**
   * 배터리 상태 업데이트 (SystemControlService에 콜백)
   */
  private updateBatteryStatus(level: number, voltage?: number): void {
    if (this.systemCallbacks.onBatteryUpdate) {
      this.systemCallbacks.onBatteryUpdate(level, voltage);
    }
  }

  /**
   * 배터리 히스토리에 새로운 데이터 추가
   */
  private addBatteryHistory(level: number): void {
    const now = Date.now();
    
    // 새로운 히스토리 항목 추가
    this.batteryHistory.push({
      level,
      timestamp: now
    });
    
    // 최근 10개 항목만 유지 (메모리 관리)
    if (this.batteryHistory.length > 10) {
      this.batteryHistory.shift();
    }
    
    // 배터리 예측 계산
    this.calculateBatteryPrediction();
  }

  /**
   * 배터리 사용/충전 패턴 분석 및 예측 계산
   */
  private calculateBatteryPrediction(): void {
    const now = Date.now();
    
    // 최소 2개의 데이터 포인트가 필요
    if (this.batteryHistory.length < 2) {
      this.batteryPrediction = {
        mode: 'unknown',
        ratePerMinute: 0,
        estimatedTimeRemaining: 0,
        lastCalculation: now
      };
      return;
    }
    
    // 가장 최근 2개 데이터 포인트 사용
    const latest = this.batteryHistory[this.batteryHistory.length - 1];
    const previous = this.batteryHistory[this.batteryHistory.length - 2];
    
    // 시간 차이 (분 단위)
    const timeDiffMinutes = (latest.timestamp - previous.timestamp) / (1000 * 60);
    
    // 시간 차이가 너무 작으면 계산하지 않음 (최소 30초)
    if (timeDiffMinutes < 0.5) {
      return;
    }
    
    // 배터리 레벨 변화량
    const levelDiff = latest.level - previous.level;
    
    // 분당 변화율 계산
    const ratePerMinute = levelDiff / timeDiffMinutes;
    
    // 모드 결정 및 예상 시간 계산
    let mode: 'charging' | 'discharging' | 'unknown';
    let estimatedTimeRemaining: number;
    
    if (ratePerMinute > 0.1) {
      // 충전 중 (분당 0.1% 이상 증가)
      mode = 'charging';
      const remainingToFull = 100 - latest.level;
      estimatedTimeRemaining = Math.round(remainingToFull / ratePerMinute);
    } else if (ratePerMinute < -0.1) {
      // 방전 중 (분당 0.1% 이상 감소)
      mode = 'discharging';
      estimatedTimeRemaining = Math.round(latest.level / Math.abs(ratePerMinute));
    } else {
      // 변화가 거의 없음
      mode = 'unknown';
      estimatedTimeRemaining = 0;
    }
    
    // 예측 결과 업데이트
    this.batteryPrediction = {
      mode,
      ratePerMinute: Math.abs(ratePerMinute),
      estimatedTimeRemaining: Math.max(0, estimatedTimeRemaining),
      lastCalculation: now
    };
  }

  /**
   * 배터리 예측 정보 조회
   */
  getBatteryPrediction(): {
    currentLevel: number;
    mode: 'charging' | 'discharging' | 'unknown';
    ratePerMinute: number;
    estimatedTimeRemaining: number;
    timeRemainingFormatted: string;
  } {
    const prediction = this.batteryPrediction;
    
    // 시간을 시:분 형식으로 포맷팅
    let timeRemainingFormatted: string;
    
    if (prediction.mode === 'unknown' || prediction.estimatedTimeRemaining === 0) {
      timeRemainingFormatted = 'Unknown';
    } else {
      const hours = Math.floor(prediction.estimatedTimeRemaining / 60);
      const minutes = Math.round(prediction.estimatedTimeRemaining % 60);
      
      if (hours > 0) {
        timeRemainingFormatted = `${hours}h ${minutes}m`;
      } else {
        timeRemainingFormatted = `${minutes}m`;
      }
      
      // 모드에 따른 설명 추가
      if (prediction.mode === 'charging') {
        timeRemainingFormatted += ' to full';
      } else {
        timeRemainingFormatted += ' remaining';
      }
    }
    
    return {
      currentLevel: this.batteryLevel,
      mode: prediction.mode,
      ratePerMinute: prediction.ratePerMinute,
      estimatedTimeRemaining: prediction.estimatedTimeRemaining,
      timeRemainingFormatted
    };
  }

  async scan(): Promise<EEGDevice[]> {
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth API가 지원되지 않습니다.');
    }

    try {
      // LINK BAND 디바이스만 필터링 (LXB 접두사)
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'LXB' },           // LINK BAND 디바이스
          { namePrefix: 'LinkBand' },      // 대체 이름
          { namePrefix: 'LOOXID' }         // LOOXID 브랜드명
        ],
        optionalServices: [
          LINK_BAND_UUIDs.EEG_SERVICE,
          LINK_BAND_UUIDs.PPG_SERVICE,
          LINK_BAND_UUIDs.ACCELEROMETER_SERVICE,
          LINK_BAND_UUIDs.BATTERY_SERVICE
        ]
      });

      if (device) {
        // 스캔된 디바이스를 캐시에 저장
        this.scannedDevices.set(device.id, device);
        
        return [{
          id: device.id,
          name: device.name || 'LINK BAND',
          connected: false,
          batteryLevel: 0,
          signalQuality: 'good'
        }];
      }
      
      return [];
    } catch (error) {
      // 사용자가 취소한 경우 특별 처리 (에러로 처리하지 않음)
      if (error instanceof Error && error.name === 'NotFoundError' && 
          error.message.includes('User cancelled')) {
        throw new Error('디바이스 선택이 취소되었습니다');
      }
      
      throw new Error(`디바이스 스캔에 실패했습니다: ${error instanceof Error ? error.message : error}`);
    }
  }

  async connect(deviceId: string): Promise<BluetoothDevice> {
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth API가 지원되지 않습니다.');
    }

    try {
      // 같은 디바이스에 이미 연결되어 있다면 기존 연결 반환
      if (this.device && this.device.id === deviceId && this.device.gatt?.connected) {
        return this.device;
      }
      
      // 다른 디바이스에 연결되어 있다면 해제
      if (this.device && this.device.gatt?.connected && this.device.id !== deviceId) {
        await this.disconnect();
      }

      // 캐시된 디바이스 사용 또는 새로 스캔
      this.device = this.scannedDevices.get(deviceId) || null;
      
      if (!this.device) {
        // 디바이스 선택 및 연결
        this.device = await navigator.bluetooth.requestDevice({
          filters: [
            { namePrefix: 'LXB' },
            { namePrefix: 'LinkBand' },
            { namePrefix: 'LOOXID' }
          ],
          optionalServices: [
            LINK_BAND_UUIDs.EEG_SERVICE,
            LINK_BAND_UUIDs.PPG_SERVICE,
            LINK_BAND_UUIDs.ACCELEROMETER_SERVICE,
            LINK_BAND_UUIDs.BATTERY_SERVICE
          ]
        });
        
        // 새로 스캔한 디바이스도 캐시에 저장
        this.scannedDevices.set(this.device.id, this.device);
      }

      // 연결 시작 시간 기록
      this.connectionStartTime = Date.now();

      // 연결 해제 이벤트 리스너 등록
      this.device.addEventListener('gattserverdisconnected', this.handleDisconnect.bind(this));

      // GATT 서버 연결
      this.server = await this.device.gatt?.connect() || null;
      
      if (!this.server) {
        throw new Error('GATT 서버 연결 실패');
      }

      // 서비스 연결
      await this.connectServices();
      
      // 데이터 스트림 시작
      await this.startDataStreams();
      
      // 배터리 모니터링 시작
      await this.startBatteryMonitoring();
      
      // 샘플링 레이트 모니터링 시작
      this.startSamplingRateMonitoring();

      return this.device;

    } catch (error) {
      await this.cleanup();
      
      // 사용자가 취소한 경우 특별 처리 (에러로 처리하지 않음)
      if (error instanceof Error && error.name === 'NotFoundError' && 
          error.message.includes('User cancelled')) {
        throw new Error('디바이스 연결이 취소되었습니다');
      }
      
      throw new Error(`디바이스 연결에 실패했습니다: ${error instanceof Error ? error.message : error}`);
    }
  }



  private async connectServices(): Promise<void> {
    if (!this.server) {
      throw new Error('GATT 서버가 연결되지 않음');
    }

    try {
      // EEG 서비스 연결
      this.eegService = await this.server.getPrimaryService(LINK_BAND_UUIDs.EEG_SERVICE);
      this.eegCharacteristic = await this.eegService.getCharacteristic(LINK_BAND_UUIDs.EEG_CHARACTERISTIC);

      // PPG 서비스 연결
      try {
        this.ppgService = await this.server.getPrimaryService(LINK_BAND_UUIDs.PPG_SERVICE);
        this.ppgCharacteristic = await this.ppgService.getCharacteristic(LINK_BAND_UUIDs.PPG_CHARACTERISTIC);
      } catch (ppgError) {
        // PPG 서비스 실패해도 다른 서비스는 계속 진행
        this.ppgService = null;
        this.ppgCharacteristic = null;
      }

      // 가속도계 서비스 (선택적)
      try {
        this.accelerometerService = await this.server.getPrimaryService(LINK_BAND_UUIDs.ACCELEROMETER_SERVICE);
        this.accelerometerCharacteristic = await this.accelerometerService.getCharacteristic(LINK_BAND_UUIDs.ACCELEROMETER_CHARACTERISTIC);
      } catch (error) {
        // 가속도계 서비스는 선택적이므로 에러 무시
      }

      // 배터리 서비스 (선택적)
      try {
        this.batteryService = await this.server.getPrimaryService(LINK_BAND_UUIDs.BATTERY_SERVICE);
        this.batteryCharacteristic = await this.batteryService.getCharacteristic(LINK_BAND_UUIDs.BATTERY_CHARACTERISTIC);
      } catch (error) {
        // 배터리 서비스는 선택적이므로 에러 무시
      }

    } catch (error) {
      throw new Error(`서비스 연결 실패: ${error}`);
    }
  }

  private async startDataStreams(): Promise<void> {
    try {
      // EEG 데이터 스트림 시작
      if (this.eegCharacteristic) {
        await this.eegCharacteristic.startNotifications();
        this.eegCharacteristic.addEventListener('characteristicvaluechanged', this.handleEEGData.bind(this));
      }

      // PPG 데이터 스트림 시작
      if (this.ppgCharacteristic) {
        await this.ppgCharacteristic.startNotifications();
        this.ppgCharacteristic.addEventListener('characteristicvaluechanged', this.handlePPGData.bind(this));
      }

      // 가속도계 데이터 스트림 시작
      if (this.accelerometerCharacteristic) {
        await this.accelerometerCharacteristic.startNotifications();
        this.accelerometerCharacteristic.addEventListener('characteristicvaluechanged', this.handleAccData.bind(this));
      }

    } catch (error) {
      throw new Error(`데이터 스트림 시작 실패: ${error}`);
    }
  }

  private async startBatteryMonitoring(): Promise<void> {
    if (!this.batteryCharacteristic) {
      return;
    }

    try {
      // 현재 배터리 레벨 읽기
      const batteryData = await this.batteryCharacteristic.readValue();
      this.batteryLevel = batteryData.getUint8(0);

      // 초기 배터리 정보 업데이트
      this.updateBatteryStatus(this.batteryLevel);

      // 배터리 변경 알림 시작
      await this.batteryCharacteristic.startNotifications();
      this.batteryCharacteristic.addEventListener('characteristicvaluechanged', this.handleBatteryData.bind(this));

    } catch (error) {
      // 배터리 모니터링 실패는 무시
    }
  }

  // Python SDK의 _handle_eeg 메서드를 참고한 EEG 데이터 처리
  private handleEEGData(event: Event): void {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    const dataView = characteristic.value;
    
    if (!dataView || dataView.byteLength < 8) {
      return;
    }

    try {
      // 타임스탬프 추출 (첫 4바이트, little endian)
      const timeRaw = dataView.getUint32(0, true);
      const baseTimestamp = timeRaw / TIMESTAMP_CLOCK;
      
      // 샘플 수 계산 (7바이트 단위: 1바이트 leadoff + 3바이트 ch1 + 3바이트 ch2)
      const numSamples = Math.floor((dataView.byteLength - 4) / 7);

      const samples: EEGDataSample[] = [];
      
      for (let i = 0; i < numSamples; i++) {
        const offset = 4 + i * 7;
        
        if (offset + 7 > dataView.byteLength) {
          break;
        }

        // Lead-off 상태 (1바이트)
        const leadoffRaw = dataView.getUint8(offset);
        const leadoffCh1 = Boolean(leadoffRaw & 0x01);  // ch1 n
        const leadoffCh2 = Boolean(leadoffRaw & 0x04);  // ch2 n

        // 채널 1 (3바이트 → 24bit signed)
        const ch1Raw = (dataView.getUint8(offset + 1) << 16) | 
                       (dataView.getUint8(offset + 2) << 8) | 
                       dataView.getUint8(offset + 3);
        
        // 채널 2 (3바이트 → 24bit signed)
        const ch2Raw = (dataView.getUint8(offset + 4) << 16) | 
                       (dataView.getUint8(offset + 5) << 8) | 
                       dataView.getUint8(offset + 6);

        // 24bit signed 처리 (MSB가 1이면 음수)
        const ch1Signed = ch1Raw & 0x800000 ? ch1Raw - 0x1000000 : ch1Raw;
        const ch2Signed = ch2Raw & 0x800000 ? ch2Raw - 0x1000000 : ch2Raw;

        // 전압값(μV)로 변환 (Python SDK와 동일한 공식 사용)
        const ch1Uv = ch1Signed * 4.033 / 12 / (Math.pow(2, 23) - 1) * 1e6;
        const ch2Uv = ch2Signed * 4.033 / 12 / (Math.pow(2, 23) - 1) * 1e6;

        const sampleTimestamp = (baseTimestamp + i / SAMPLING_RATES.EEG) * 1000; // 밀리초 단위로 변환
        
        const sample: EEGDataSample = {
          timestamp: sampleTimestamp,
          ch1: ch1Uv,
          ch2: ch2Uv,
          leadoff_ch1: leadoffCh1,
          leadoff_ch2: leadoffCh2
        };
        
        samples.push(sample);
      }

      // 샘플링 레이트 카운터 업데이트
      this.samplingRateCounters.eeg.samples += samples.length;

      // StreamProcessor에 직접 EEG 데이터 전달
      if (samples.length > 0) {
        // onDataReceived 콜백을 통해 데이터 전달
        if (this.onDataReceived) {
          this.onDataReceived({
            type: 'eeg',
            samples: samples
          });
        }
        
        // 최신 샘플의 LeadOff 상태를 systemStore에 업데이트
        // const latestSample = samples[samples.length - 1];
        // useSystemStore.getState().updateSensorContactStatus(
        //   latestSample.leadoff_ch1,
        //   latestSample.leadoff_ch2
        // );
      }

    } catch (error) {
      // EEG 데이터 처리 오류는 무시하고 계속 진행
    }
  }

  // Python SDK의 _handle_ppg 메서드를 참고한 PPG 데이터 처리
  private handlePPGData(event: Event): void {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    const dataView = characteristic.value;
    
    if (!dataView || dataView.byteLength < 8) {
      return;
    }

    try {
      // 🚀 핵심 개선: 즉시 데이터를 파싱하고 버퍼에 추가
      // 타임스탬프 추출 (첫 4바이트, little endian)
      const timeRaw = dataView.getUint32(0, true);
      const baseTimestamp = timeRaw / 32.768 / 1000;  // PPG는 다른 타임스탬프 공식 사용
      
      // 샘플 수 계산 (6바이트 단위: 3바이트 red + 3바이트 ir)
      const numSamples = Math.floor((dataView.byteLength - 4) / 6);

      const samples: PPGDataSample[] = [];
      
      for (let i = 0; i < numSamples; i++) {
        const offset = 4 + i * 6;
        
        if (offset + 6 > dataView.byteLength) {
          break;
        }

        // Red (3바이트 → 24bit unsigned)
        const redRaw = (dataView.getUint8(offset) << 16) | 
                       (dataView.getUint8(offset + 1) << 8) | 
                       dataView.getUint8(offset + 2);
        
        // IR (3바이트 → 24bit unsigned)
        const irRaw = (dataView.getUint8(offset + 3) << 16) | 
                      (dataView.getUint8(offset + 4) << 8) | 
                      dataView.getUint8(offset + 5);

        const sampleTimestamp = (baseTimestamp + i / SAMPLING_RATES.PPG) * 1000; // 밀리초 단위로 변환
        
        const sample: PPGDataSample = {
          timestamp: sampleTimestamp,
          red: redRaw,
          ir: irRaw
        };
        
        samples.push(sample);
      }

      // 샘플링 레이트 카운터 업데이트
      this.samplingRateCounters.ppg.samples += samples.length;

      // PPG 처리를 비동기로 실행하여 블루투스 수신 블록킹 방지
      if (samples.length > 0) {
        // 즉시 리턴하고 PPG 처리는 비동기로 실행
        setTimeout(() => {
          try {
            if (this.onDataReceived) {
              this.onDataReceived({
                type: 'ppg',
                samples: samples
              });
            }
          } catch (asyncError) {
            // 비동기 처리 에러도 전체 시스템에 영향 주지 않도록 무시
          }
        }, 0); // 다음 이벤트 루프에서 실행
      }

    } catch (error) {
      // PPG 데이터 파싱 에러가 발생해도 다음 데이터 수신은 계속되도록 무시
      return;
    }
  }

  // 가속도계 데이터 처리
  private handleAccData(event: Event): void {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const dataView = target.value;
    const packetReceiveTime = Date.now();
    
    if (!dataView || dataView.byteLength < 10) {
      return;
    }

    try {
      // 타임스탬프 추출 (첫 4바이트, little endian)
      const timeRaw = dataView.getUint32(0, true);
      const deviceTimestamp = timeRaw / TIMESTAMP_CLOCK;
      
      // 샘플 수 계산 (6바이트 단위: 2바이트 x + 2바이트 y + 2바이트 z)
      const numSamples = Math.floor((dataView.byteLength - 4) / 6);
      
      const samples: AccDataSample[] = [];
      
      // 🔧 패킷 간 연속성 보장을 위한 개선된 timestamp 계산
      // 정밀한 샘플 간격 계산 (마이크로초 단위)
      const sampleIntervalMicros = Math.round(1000000 / SAMPLING_RATES.ACC); // 30Hz = 33333μs
      const sampleIntervalMs = sampleIntervalMicros / 1000; // 33.333ms
      
      // 🚀 핵심 개선: 이전 패킷의 마지막 timestamp를 기준으로 연속성 보장
      let baseTimestamp: number;
      
      if (this.lastAccTimestamp === 0) {
        // 첫 번째 패킷: 현재 시간을 기준으로 시작
        baseTimestamp = packetReceiveTime;
      } else {
        // 후속 패킷: 이전 패킷의 마지막 timestamp + 1 샘플 간격부터 시작
        baseTimestamp = this.lastAccTimestamp + sampleIntervalMs;
        
        // 패킷 간 간격 검증 (너무 큰 간격이면 재동기화)
        const timeSinceLastPacket = packetReceiveTime - this.lastAccTimestamp;
        const expectedPacketInterval = numSamples * sampleIntervalMs;
        
        // 패킷 간격이 예상보다 3배 이상 크면 재동기화
        if (timeSinceLastPacket > expectedPacketInterval * 3) {
          baseTimestamp = packetReceiveTime;
        }
      }
      
      this.accPacketCount++;
      
      for (let i = 0; i < numSamples; i++) {
        const offset = 4 + i * 6;
        
        if (offset + 6 > dataView.byteLength) {
          break;
        }

        // X, Y, Z 축 데이터 (각각 2바이트, signed 16bit)
        const xRaw = dataView.getInt16(offset, true);     // little endian
        const yRaw = dataView.getInt16(offset + 2, true); // little endian
        const zRaw = dataView.getInt16(offset + 4, true); // little endian

        // 가속도 값 변환 (단위: g, 1g = 9.8m/s²)
        // ADS1299 기준: ±2g 범위, 16bit signed
        const scale = 2.0 / 32768.0; // ±2g / 2^15
        const x = xRaw * scale;
        const y = yRaw * scale;
        const z = zRaw * scale;

        // 정밀한 timestamp 계산
        const sampleTimestamp = baseTimestamp + i * sampleIntervalMs;
        
        const sample: AccDataSample = {
          timestamp: sampleTimestamp,
          x: x,
          y: y,
          z: z
        };
        
        samples.push(sample);
      }

      // 마지막 timestamp 업데이트 (다음 패킷을 위해)
      if (samples.length > 0) {
        this.lastAccTimestamp = samples[samples.length - 1].timestamp;
      }

      // 샘플링 레이트 카운터 업데이트
      this.samplingRateCounters.acc.samples += samples.length;

      // StreamProcessor에 직접 ACC 데이터 전달
      if (samples.length > 0) {
        // onDataReceived 콜백을 통해 데이터 전달
        if (this.onDataReceived) {
          this.onDataReceived({
            type: 'acc',
            samples: samples
          });
        }
      }

    } catch (error) {
      // ACC 데이터 처리 오류는 무시하고 계속 진행
    }
  }

  private handleBatteryData(event: Event): void {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    const dataView = characteristic.value;
    
    if (dataView && dataView.byteLength >= 1) {
      const newBatteryLevel = dataView.getUint8(0);
      
      // 배터리 레벨이 변경된 경우에만 이벤트 발생
      if (newBatteryLevel !== this.batteryLevel) {
        this.batteryLevel = newBatteryLevel;
        
        // 배터리 히스토리 업데이트 및 예측 계산
        this.addBatteryHistory(this.batteryLevel);
        
        // SystemControlService에 배터리 정보 업데이트
        this.updateBatteryStatus(this.batteryLevel);
        
        // StreamProcessor에 직접 배터리 데이터 전달
        // onDataReceived 콜백을 통해 데이터 전달
        if (this.onDataReceived) {
          this.onDataReceived({
            type: 'battery',
            samples: [{
              timestamp: Date.now(),
              level: this.batteryLevel,
              percentage: this.batteryLevel
            }]
          });
        }
      }
    }
  }

  private handleDisconnect(): void {
    this.cleanup();
    
    if (this.connectionLostCallback) {
      this.connectionLostCallback();
    }
  }

  async disconnect(): Promise<void> {
    try {
      // 1. 샘플링 레이트 모니터링 중지
      this.stopSamplingRateMonitoring();
      
      // 2. 모든 알림 중지 (에러가 발생해도 계속 진행)
      const notificationPromises = [];
      
      if (this.eegCharacteristic) {
        notificationPromises.push(
          this.eegCharacteristic.stopNotifications().catch(() => {})
        );
      }
      if (this.ppgCharacteristic) {
        notificationPromises.push(
          this.ppgCharacteristic.stopNotifications().catch(() => {})
        );
      }
      if (this.accelerometerCharacteristic) {
        notificationPromises.push(
          this.accelerometerCharacteristic.stopNotifications().catch(() => {})
        );
      }
      if (this.batteryCharacteristic) {
        notificationPromises.push(
          this.batteryCharacteristic.stopNotifications().catch(() => {})
        );
      }
      
      // 모든 알림 중지 대기 (최대 3초)
      await Promise.race([
        Promise.all(notificationPromises),
        new Promise(resolve => setTimeout(resolve, 3000))
      ]);
      
      // 3. 이벤트 리스너 제거
      if (this.device) {
        this.device.removeEventListener('gattserverdisconnected', this.handleDisconnect.bind(this));
      }
      
      // 4. GATT 연결 해제
      if (this.server && this.server.connected) {
        try {
          this.server.disconnect();
        } catch (error) {
          // GATT 서버 연결 해제 실패는 무시
        }
      }
      
      // 5. 강제 연결 해제 대기 (브라우저가 실제로 연결을 해제할 시간 제공)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 6. DeviceStore에 연결 해제 알림
      try {
        const { useDeviceStore } = await import('../stores/deviceStore');
        useDeviceStore.getState().disconnectDevice();
      } catch (error) {
        // DeviceStore 연결 해제 알림 실패는 무시
      }
      
    } catch (error) {
      // 에러가 발생해도 cleanup은 실행
    } finally {
      // 7. 완전한 정리 작업
      this.forceCleanup();
    }
  }

  private cleanup(): void {
    this.device = null;
    this.server = null;
    this.eegService = null;
    this.ppgService = null;
    this.accelerometerService = null;
    this.batteryService = null;
    this.eegCharacteristic = null;
    this.ppgCharacteristic = null;
    this.accelerometerCharacteristic = null;
    this.batteryCharacteristic = null;
    
    // 연결 시간 초기화
    this.connectionStartTime = 0;
    this.currentConnectionDuration = 0;
    
    // 배터리 히스토리 및 예측 초기화
    this.batteryHistory = [];
    this.batteryPrediction = {
      mode: 'unknown',
      ratePerMinute: 0,
      estimatedTimeRemaining: 0,
      lastCalculation: 0
    };
    
    // ACC timestamp 동기화 변수 초기화
    this.lastAccTimestamp = 0;
    this.accPacketCount = 0;
    
    // 샘플링 레이트 카운터 초기화
    Object.keys(this.samplingRateCounters).forEach(sensor => {
      const counter = this.samplingRateCounters[sensor as keyof typeof this.samplingRateCounters];
      counter.samples = 0;
      counter.lastReset = Date.now();
      counter.currentRate = 0;
      counter.history = [];
    });
    
    // 샘플링 레이트 모니터링 중지
    this.stopSamplingRateMonitoring();
    
    // 캐시는 유지 (재연결을 위해)
    // this.scannedDevices.clear(); // 필요시에만 호출
  }

  /**
   * 강제 정리 - 연결 해제 시 완전한 정리를 위해 사용
   */
  private forceCleanup(): void {
    // 기본 cleanup 실행
    this.cleanup();
    
    // 추가적인 강제 정리 작업
    try {
      // 1. 디바이스 캐시 완전 정리 (재연결 문제 방지)
      this.scannedDevices.clear();
      
      // 2. 콜백 정리
      this.connectionLostCallback = null;
      this.onDataReceived = null;
      this.systemCallbacks = {};
      
      // 3. StreamProcessor 정리
      if (this.streamProcessor) {
        this.streamProcessor.cleanup();
      }
      
      // 4. 배터리 레벨 초기화
      this.batteryLevel = 0;
      
    } catch (error) {
      // 강제 정리 중 오류는 무시
    }
  }

  /**
   * 디바이스 캐시 강제 정리 - 재연결 문제 해결용
   */
  clearDeviceCache(): void {
    this.scannedDevices.clear();
  }

  /**
   * 연결 시작 시간 가져오기
   */
  getConnectionStartTime(): number {
    return this.connectionStartTime;
  }

  /**
   * 연결 지속 시간 가져오기 (밀리초)
   */
  getConnectionDuration(): number {
    if (this.connectionStartTime === 0) return 0;
    return this.currentConnectionDuration;
  }

  /**
   * 현재 샘플링 레이트 가져오기
   */
  getCurrentSamplingRates(): { eeg: number; ppg: number; acc: number } {
    return {
      eeg: this.samplingRateCounters.eeg.currentRate,
      ppg: this.samplingRateCounters.ppg.currentRate,
      acc: this.samplingRateCounters.acc.currentRate
    };
  }

  isConnected(): boolean {
    return this.device?.gatt?.connected ?? false;
  }

  onConnectionLost(callback: () => void): void {
    this.connectionLostCallback = callback;
  }

  async getBatteryLevel(): Promise<number> {
    // 배터리 특성이 사용 불가능한 경우 마지막 알려진 값 반환
    if (!this.batteryCharacteristic) {
      return this.batteryLevel;
    }

    try {
      const batteryData = await this.batteryCharacteristic.readValue();
      this.batteryLevel = batteryData.getUint8(0);
      return this.batteryLevel;
    } catch (error) {
      return this.batteryLevel; // 마지막 알려진 값 반환
    }
  }

  /**
   * 연결된 디바이스 이름 가져오기
   */
  getDeviceName(): string {
    if (!this.device) {
      return 'Unknown Device';
    }
    return this.device.name || 'LINK BAND';
  }

  /**
   * 연결된 디바이스 ID 가져오기
   */
  getDeviceId(): string {
    if (!this.device) {
      return '';
    }
    return this.device.id;
  }
}

// 싱글톤 인스턴스
export const bluetoothService = new LinkBandBluetoothService();

// 실제 서비스 활성화 - 실제 LINK BAND 디바이스 연결
export const eegBluetoothService = bluetoothService; 