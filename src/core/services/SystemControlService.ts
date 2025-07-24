import { bluetoothService } from '../../utils/bluetoothService';
import { StreamProcessor } from '../../utils/StreamProcessor';
import { SessionManager } from '../../utils/SessionManager';
import { StreamingStorageService } from '../../domains/ai-report/services/StreamingStorageService';

/**
 * SystemControlService
 * 
 * 역할: 모든 하위 서비스들의 중앙 컨트롤러 (순수 프로세스 제어)
 * - BluetoothService 관리 (디바이스 연결/해제)
 * - StreamProcessor 관리 (실시간 데이터 처리)
 * - SessionManager 관리 (데이터 저장/로드)
 * - 서비스 간 조정 및 동기화
 * - 상태 관리는 SystemStore에서 담당
 * 
 * Phase 3: 분리된 스토어들과의 데이터 흐름 연결
 */
export class SystemControlService {
  private streamProcessor: StreamProcessor;
  private sessionManager: SessionManager;
  private streamingStorageService: StreamingStorageService;
  private isInitialized = false;
  private isConnected = false;
  private isStreaming = false;
  private isRecording = false;
  private currentDeviceId: string | null = null;

  // 모니터링 관련 타이머
  private monitoringInterval: NodeJS.Timeout | null = null;
  private batteryUpdateInterval: NodeJS.Timeout | null = null;
  private samplingRateUpdateInterval: NodeJS.Timeout | null = null;
  
  // 샘플링 레이트 히스토리 (10초 평균 계산용)
  private samplingRateHistory: {
    eeg: number[];
    ppg: number[];
    acc: number[];
  } = {
    eeg: [],
    ppg: [],
    acc: []
  };

  // 스토어 참조 (동적 import로 순환 참조 방지)
  private storeRefs: {
    rawDataStore?: any;
    processedDataStore?: any;
    deviceStore?: any;
    sensorDataStore?: any;
    storageStore?: any;
  } = {};

  constructor() {
    this.streamProcessor = new StreamProcessor();
    this.sessionManager = new SessionManager();
    this.streamingStorageService = StreamingStorageService.getInstance();
  }

  /**
   * 시스템 초기화
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // 1. Store 참조 로드
      await this.loadStoreReferences();
      
      // 2. 데이터 플로우 설정 (StreamProcessor ↔ StreamingStorageService)
      await this.setupDataFlow();
      
      // 3. 초기화 완료
      this.isInitialized = true;
      

    } catch (error) {
      throw error;
    }
  }

  /**
   * 스토어 참조 동적 로드 (순환 참조 방지)
   */
  private async loadStoreReferences(): Promise<void> {
    try {
      const [
        { useRawDataStore },
        { useProcessedDataStore },
        { useDeviceStore },
        { useSensorDataStore },
        { useStorageStore }
      ] = await Promise.all([
        import('../../stores/rawDataStore'),
        import('../../stores/processedDataStore'),
        import('../../stores/deviceStore'),
        import('../../stores/sensorDataStore'),
        import('../../stores/storageStore')
      ]);

      this.storeRefs = {
        rawDataStore: useRawDataStore,
        processedDataStore: useProcessedDataStore,
        deviceStore: useDeviceStore,
        sensorDataStore: useSensorDataStore,
        storageStore: useStorageStore
      };
      

    } catch (error) {
      throw error;
    }
  }

  /**
   * StreamProcessor 데이터 흐름 설정
   */
  private async setupDataFlow(): Promise<void> {
    if (!this.storeRefs.rawDataStore || !this.storeRefs.processedDataStore) {
      throw new Error('Store references not loaded');
    }

    // StreamProcessor에 StreamingStorageService 콜백 설정
    const streamingCallbacks = {
      onEEGData: (data: any[]) => {
        // StreamingStorageService로 EEG 데이터 전달
        if (this.streamingStorageService) {
          this.streamingStorageService.writeEEGData(data);
        } else {
        }
      },
      onPPGData: (data: any[]) => {
        // StreamingStorageService로 PPG 데이터 전달
        if (this.streamingStorageService) {
          this.streamingStorageService.writePPGData(data);
        } else {
        }
      },
      onACCData: (data: any[]) => {
        // StreamingStorageService로 ACC 데이터 전달
        if (this.streamingStorageService) {
          this.streamingStorageService.writeACCData(data);
        } else {
        }
      }
    };

    this.streamProcessor.setCallbacks(streamingCallbacks);
    

  }

  /**
   * 디바이스 스캔
   */
  async scanDevices(): Promise<any[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const devices = await bluetoothService.scan();
      return devices;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 디바이스 연결
   */
  async connectDevice(deviceId: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.isConnected) {
      throw new Error('다른 디바이스가 이미 연결되어 있습니다.');
    }

    try {
      // 1. BluetoothService에 콜백 설정 (배터리 정보만)
      bluetoothService.setSystemCallbacks({
        onBatteryUpdate: (level: number, voltage?: number) => {
          if (this.storeRefs.deviceStore) {
            this.storeRefs.deviceStore.getState().updateBatteryInfo(level, voltage);
          }
        }
      });

      // 2. Bluetooth 연결
      await bluetoothService.connect(deviceId);
      
      // 3. 연결된 디바이스 정보 생성
      const deviceInfo = {
        id: deviceId,
        name: bluetoothService.getDeviceName() || 'Unknown Device',
        batteryLevel: bluetoothService.getBatteryLevel() || 0
      };
      
      // 4. DeviceStore에 연결된 디바이스 상태 업데이트
      if (this.storeRefs.deviceStore) {
        this.storeRefs.deviceStore.getState().startDeviceConnection(deviceInfo);
      }
      
      // 5. StreamProcessor에 BluetoothService 연결
      this.streamProcessor.setBluetoothService(bluetoothService);
      
      // 6. 연결 상태 업데이트 (내부 상태만)
      this.isConnected = true;
      this.currentDeviceId = deviceId;
      
      // 7. ProcessedDataStore 연결 상태 업데이트
      this.storeRefs.processedDataStore?.getState().setConnectionState(true);
      
      // 8. 모니터링 시작
      this.startConnectionMonitoring();
      
      // 9. 🔧 자동 스트리밍 시작 (디바이스 연결 후 바로 데이터 수집 시작)
      try {
        await this.startStreaming();
      } catch (streamError) {
        // 스트리밍 실패해도 연결은 유지
      }
    } catch (error) {
      this.isConnected = false;
      this.currentDeviceId = null;
      throw error;
    }
  }

  /**
   * 등록된 디바이스 관리
   */
  async registerDevice(device: any, nickname?: string): Promise<void> {
    try {
      this.storeRefs.deviceStore?.getState().registerDevice(device, nickname);

    } catch (error) {
      throw error;
    }
  }

  async unregisterDevice(deviceId: string): Promise<void> {
    try {
      this.storeRefs.deviceStore?.getState().unregisterDevice(deviceId);

    } catch (error) {
      throw error;
    }
  }

  /**
   * 디바이스 모니터링 정보 조회 (BluetoothService에서 직접 조회)
   */
  getDeviceMonitoringInfo(): any {
    if (!this.isConnected || !this.currentDeviceId) {
      return null;
    }

    try {
      return {
        deviceId: bluetoothService.getDeviceId(),
        deviceName: bluetoothService.getDeviceName(),
        batteryLevel: bluetoothService.getBatteryLevel(),
        connectionDuration: bluetoothService.getConnectionDuration(),
        connectionStartTime: bluetoothService.getConnectionStartTime(),
        samplingRates: bluetoothService.getCurrentSamplingRates()
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * 실시간 샘플링 레이트 조회
   */
  getCurrentSamplingRates(): { eeg: number; ppg: number; acc: number } | null {
    try {
      return bluetoothService.getCurrentSamplingRates();
    } catch (error) {
      return null;
    }
  }

  /**
   * 배터리 정보 조회
   */
  async getBatteryInfo(): Promise<{ level: number; decreaseRate: number; timeRemaining: string } | null> {
    const deviceStore = this.storeRefs.deviceStore?.getState();
    if (!deviceStore || !deviceStore.connectedDevice) {
      return null;
    }

    const battery = deviceStore.connectedDevice.battery;
    return {
      level: battery.level,
      decreaseRate: battery.decreaseRate,
      timeRemaining: deviceStore.batteryTimeRemainingFormatted
    };
  }

  /**
   * 디바이스 연결 해제
   */
  async disconnectDevice(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      // 1. 모니터링 중지
      this.stopConnectionMonitoring();

      // 2. 스트리밍 중지
      if (this.isStreaming) {
        await this.stopStreaming();
      }

      // 3. 레코딩 중지
      if (this.isRecording) {
        await this.stopRecording();
      }

      // 4. StreamProcessor 정리
      this.streamProcessor.cleanup();

      // 5. Bluetooth 연결 해제
      await bluetoothService.disconnect();
      
      // 6. 추가 대기 시간 (완전한 연결 해제 보장)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 7. 연결 상태 업데이트 (내부 상태만)
      this.isConnected = false;
      this.currentDeviceId = null;
      this.isStreaming = false;
      this.isRecording = false;
      
      // 8. ProcessedDataStore 연결 상태 업데이트
      this.storeRefs.processedDataStore?.getState().setConnectionState(false);
      
      // 9. RawDataStore 정리
      this.storeRefs.rawDataStore?.getState().reset();
      
      // 10. 샘플링 레이트 히스토리 초기화
      this.samplingRateHistory = {
        eeg: [],
        ppg: [],
        acc: []
      };
      

    } catch (error) {
      
      // 에러가 발생해도 상태는 초기화
      this.isConnected = false;
      this.currentDeviceId = null;
      this.isStreaming = false;
      this.isRecording = false;
      
      // 강제로 Bluetooth 캐시 정리
      try {
        bluetoothService.clearDeviceCache();
      } catch (cleanupError) {
      }
      
      throw error;
    }
  }

  /**
   * 스트리밍 시작
   */
  async startStreaming(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('디바이스가 연결되지 않았습니다.');
    }

    if (this.isStreaming) {
      return;
    }

    try {
      // BluetoothService 상태 확인
      if (!bluetoothService.isConnected()) {
        throw new Error('BluetoothService가 연결되지 않았습니다.');
      }

      // StreamProcessor에 BluetoothService가 설정되어 있는지 확인
      if (!this.streamProcessor) {
        throw new Error('StreamProcessor가 초기화되지 않았습니다.');
      }



      // StreamProcessor 시작 (실시간 데이터 처리)
      await this.streamProcessor.start();
      
      // 스트리밍 상태 업데이트 (내부 상태만)
      this.isStreaming = true;
      

    } catch (error) {
      this.isStreaming = false;
      throw error;
    }
  }

  /**
   * 스트리밍 중지
   */
  async stopStreaming(): Promise<void> {
    if (!this.isStreaming) {
      return;
    }

    try {
      // StreamProcessor 중지
      await this.streamProcessor.stop();
      
      // 스트리밍 상태 업데이트 (내부 상태만)
      this.isStreaming = false;
      

    } catch (error) {
      throw error;
    }
  }

  /**
   * 레코딩 시작
   */
  async startRecording(sessionName?: string, customConfig?: any): Promise<string> {
    if (!this.isConnected) {
      throw new Error('디바이스가 연결되지 않았습니다.');
    }

    if (this.isRecording) {
      return this.streamingStorageService.getCurrentSession()?.id || 'current_session';
    }

    try {


      // 1. 스트리밍이 시작되지 않았으면 시작
      if (!this.isStreaming) {
        await this.startStreaming();
      }

      // 2. StreamingStorageService 상태 확인
      if (!this.streamingStorageService) {
        throw new Error('StreamingStorageService가 초기화되지 않았습니다.');
      }

      // 2-1. 저장소 디렉토리 설정 확인
      const storageDirectoryHandle = this.streamingStorageService.getStorageDirectoryHandle();
      if (!storageDirectoryHandle) {
        
        // StorageStore를 통해 저장소 설정 확인
        const storageStore = this.storeRefs.storageStore?.getState();
        if (!storageStore?.config?.storageDirectory) {
          throw new Error('저장소 디렉토리가 설정되지 않았습니다. Data Center에서 저장소를 먼저 설정해주세요.');
        }
        
        // StorageStore에 저장소가 설정되어 있지만 StreamingStorageService에는 없는 경우
        // StreamingStorageService에 저장소 디렉토리 설정
        try {
          await this.streamingStorageService.setStorageDirectoryHandle(storageStore.config.storageDirectory);
        } catch (error) {
          throw new Error('저장소 디렉토리 설정에 실패했습니다. Data Center에서 저장소를 다시 설정해주세요.');
        }
      }

      // 3. 연결된 디바이스 정보 확인
      const deviceInfo = await this.getConnectedDeviceInfo();
      if (!deviceInfo) {
        throw new Error('연결된 디바이스 정보를 찾을 수 없습니다.');
      }



      // 4. StreamingStorageService 세션 시작
      const sessionId = sessionName || `session_${Date.now()}`;
      
      // customConfig가 있으면 사용하고, 없으면 기본값 사용
      const streamingConfig = customConfig || {
        sessionName: sessionId,
        deviceName: deviceInfo?.name || 'Unknown Device',
        deviceId: deviceInfo?.id || 'unknown',
        saveFormats: ['json', 'csv'] as ('json' | 'csv' | 'binary')[],
        dataTypes: {
          eegRaw: true,
          ppgRaw: true,
          accRaw: true,
          eegProcessed: true,
          ppgProcessed: true,
          accProcessed: true
        },
        compression: false,
        chunkSize: 1024
      };


      // 🔧 StreamingStorageService 세션 시작
      const actualSessionId = await this.streamingStorageService.startStreamingSession(streamingConfig);

      // 5. StorageStore 상태 업데이트
      if (this.storeRefs.storageStore) {
        this.storeRefs.storageStore.getState().setCurrentSession(actualSessionId);
        this.storeRefs.storageStore.getState().setIsRecording(true);
      }

      // 6. SensorDataStore에 레코딩 시작 알림
      this.storeRefs.sensorDataStore?.getState().startRecording(actualSessionId);
      
      // 7. 레코딩 상태 업데이트 (내부 상태만)
      this.isRecording = true;
      

      return actualSessionId;
    } catch (error) {
      this.isRecording = false;
      
      // 더 자세한 에러 정보 제공
      if (error instanceof Error) {
        throw new Error(`레코딩 시작 실패: ${error.message}`);
      } else {
        throw new Error('레코딩 시작 중 알 수 없는 오류가 발생했습니다.');
      }
    }
  }

  /**
   * 레코딩 중지
   */
  async stopRecording(): Promise<void> {
    if (!this.isRecording) {
      return;
    }

    try {
      // 1. StreamingStorageService 세션 종료
      await this.streamingStorageService.endStreamingSession();

      // 2. StorageStore 상태 업데이트
      if (this.storeRefs.storageStore) {
        this.storeRefs.storageStore.getState().setCurrentSession(null);
        this.storeRefs.storageStore.getState().setIsRecording(false);
      }

      // 3. SensorDataStore에 레코딩 중지 알림
      this.storeRefs.sensorDataStore?.getState().stopRecording();
      
      // 4. 레코딩 상태 업데이트 (내부 상태만)
      this.isRecording = false;
      

    } catch (error) {
      throw error;
    }
  }

  /**
   * 현재 상태 조회
   */
  getStatus(): {
    isInitialized: boolean;
    isConnected: boolean;
    isStreaming: boolean;
    isRecording: boolean;
    currentDeviceId: string | null;
  } {
    return {
      isInitialized: this.isInitialized,
      isConnected: this.isConnected,
      isStreaming: this.isStreaming,
      isRecording: this.isRecording,
      currentDeviceId: this.currentDeviceId
    };
  }

  /**
   * 연결된 디바이스 정보 조회
   */
  async getConnectedDeviceInfo(): Promise<{ id: string; name: string; batteryLevel: number } | null> {
    if (!this.isConnected || !this.currentDeviceId) {
      return null;
    }

    try {
      // BluetoothService에서 디바이스 정보 조회
      const deviceId = bluetoothService.getDeviceId();
      const deviceName = bluetoothService.getDeviceName();
      const batteryLevel = await bluetoothService.getBatteryLevel();



      // DeviceStore에서 디바이스 정보 조회 (보조)
      const deviceStore = this.storeRefs.deviceStore?.getState();
      const connectedDevice = deviceStore?.connectedDevice;



      return {
        id: deviceId || this.currentDeviceId,
        name: deviceName || connectedDevice?.name || 'Unknown Device',
        batteryLevel: batteryLevel || connectedDevice?.battery?.level || 0
      };
    } catch (error) {
      
      // 기본값 반환
      return {
        id: this.currentDeviceId,
        name: 'Unknown Device',
        batteryLevel: 0
      };
    }
  }

  /**
   * 세션 목록 조회
   */
  async getSessionList(): Promise<any[]> {
    // SessionManager 또는 SensorDataStore에서 세션 목록 조회
    return this.storeRefs.sensorDataStore?.getState().getAllSessions() || [];
  }

  /**
   * 세션 로드
   */
  async loadSession(sessionId: string): Promise<any> {
    return this.storeRefs.sensorDataStore?.getState().getSessionData(sessionId) || null;
  }

  /**
   * 세션 삭제
   */
  async deleteSession(sessionId: string): Promise<void> {
    // 실제 삭제 로직은 추후 구현
    // 실제 삭제 로직은 추후 구현
  }

  /**
   * 연결 모니터링 시작 (배터리 폴링 제거됨)
   */
  private startConnectionMonitoring(): void {
    if (this.monitoringInterval) {
      return; // 이미 모니터링 중
    }

    // 1초마다 연결 상태 및 샘플링 레이트 확인
    this.monitoringInterval = setInterval(() => {
      // 연결 상태 확인
      if (!bluetoothService.isConnected()) {
        this.handleConnectionLoss();
        return;
      }

      // 샘플링 레이트 업데이트
      try {
        const samplingRates = bluetoothService.getCurrentSamplingRates();
        if (this.storeRefs.deviceStore && samplingRates) {
          this.storeRefs.deviceStore.getState().updateSamplingRates(samplingRates);
        }
      } catch (error) {
      }
    }, 1000); // 1초마다 업데이트


  }

  /**
   * 연결 끊김 처리
   */
  private handleConnectionLoss(): void {
    this.isConnected = false;
    this.currentDeviceId = null;
    this.stopConnectionMonitoring();
    
    // DeviceStore에 연결 해제 알림
    if (this.storeRefs.deviceStore) {
      this.storeRefs.deviceStore.getState().disconnectDevice();
    }
  }

  /**
   * 연결 모니터링 중지
   */
  private stopConnectionMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.batteryUpdateInterval) {
      clearInterval(this.batteryUpdateInterval);
      this.batteryUpdateInterval = null;
    }

    if (this.samplingRateUpdateInterval) {
      clearInterval(this.samplingRateUpdateInterval);
      this.samplingRateUpdateInterval = null;
    }


  }

  // 배터리 정보 업데이트, 샘플링 레이트 업데이트, 연결 지속 시간 업데이트는
  // 이제 BluetoothService에서 콜백으로 처리됩니다.

  /**
   * 시스템 정리
   */
  async cleanup(): Promise<void> {
    try {
      // 1. 모니터링 중지
      this.stopConnectionMonitoring();

      // 2. 레코딩 중지
      if (this.isRecording) {
        await this.stopRecording();
      }

      // 3. 스트리밍 중지
      if (this.isStreaming) {
        await this.stopStreaming();
      }

      // 4. 디바이스 연결 해제
      if (this.isConnected) {
        await this.disconnectDevice();
      }

      // 5. 스토어 정리
      this.storeRefs.rawDataStore?.getState().reset();
      this.storeRefs.processedDataStore?.getState().reset();
      this.storeRefs.deviceStore?.getState().reset();
      this.storeRefs.sensorDataStore?.getState().reset();

      // 6. 샘플링 레이트 히스토리 초기화
      this.samplingRateHistory = {
        eeg: [],
        ppg: [],
        acc: []
      };

      // 7. 초기화 상태 리셋
      this.isInitialized = false;
      this.storeRefs = {};
      
  
    } catch (error) {
      throw error;
    }
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const systemControlService = new SystemControlService(); 