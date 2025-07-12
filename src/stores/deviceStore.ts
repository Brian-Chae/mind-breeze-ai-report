import { create } from 'zustand';
import type { EEGDevice, ConnectionState } from '../types/eeg';

/**
 * 디바이스별 저장 설정
 */
export interface DeviceStorageSettings {
  autoRecord: boolean; // 연결 시 자동 녹화 시작
  defaultFormat: 'jsonl' | 'csv' | 'binary'; // 기본 저장 형식
  sessionNameTemplate: string; // 세션 이름 템플릿 (예: "{deviceName}_{date}_{time}")
  maxSessionDuration: number; // 최대 세션 지속 시간 (분)
  compressionEnabled: boolean; // 압축 활성화
  saveLocation: string; // 저장 위치 (상대 경로)
  
  // 자동 저장 설정
  autoSaveInterval: number; // 자동 저장 간격 (초)
  memoryThreshold: number; // 메모리 임계값 (MB)
  
  // 품질 관리
  minSignalQuality: number; // 최소 신호 품질 (0-100)
  pauseOnLowQuality: boolean; // 낮은 품질 시 일시정지
}

/**
 * 등록된 디바이스 정보
 */
interface RegisteredDevice {
  id: string;
  name: string;
  nickname?: string; // 사용자가 설정한 별명
  registeredAt: number; // 등록 시간
  lastConnectedAt?: number; // 마지막 연결 시간
  connectionCount: number; // 총 연결 횟수
  totalUsageDuration: number; // 총 연결 시간 (밀리초)
  
  // 디바이스별 저장 설정
  storageSettings: DeviceStorageSettings;
  
  // 연결 히스토리 (최근 10개 세션만 유지)
  connectionHistory: Array<{
    startTime: number;
    endTime?: number;
    duration: number; // 밀리초
  }>;
}

/**
 * 센서별 샘플링 레이트 정보
 */
interface SensorSamplingRates {
  eeg: number; // 실제 EEG 샘플링 레이트 (Hz)
  ppg: number; // 실제 PPG 샘플링 레이트 (Hz)
  acc: number; // 실제 ACC 샘플링 레이트 (Hz)
  lastUpdated: number; // 마지막 업데이트 시간
}

/**
 * 배터리 모니터링 정보
 */
interface BatteryInfo {
  level: number; // 현재 배터리 레벨 (0-100%)
  voltage?: number; // 배터리 전압 (V)
  lastUpdated: number; // 마지막 업데이트 시간
  
  // 배터리 감소 속도 계산을 위한 히스토리
  history: Array<{
    timestamp: number;
    level: number;
  }>;
  
  // 계산된 값들
  decreaseRate: number; // 배터리 감소 속도 (%/hour)
  estimatedTimeRemaining: number; // 예상 남은 시간 (minutes)
}

/**
 * 연결된 디바이스 상태 정보
 */
interface ConnectedDeviceStatus {
  device: EEGDevice;
  connectionStartTime: number; // 연결 시작 시간
  connectionDuration: number; // 연결 지속 시간 (ms)
  
  // 센서 모니터링
  samplingRates: SensorSamplingRates;
  
  // 배터리 모니터링
  battery: BatteryInfo;
  
  // 신호 품질
  signalQuality: {
    eeg: number; // 0-100
    ppg: number; // 0-100
    acc: number; // 0-100
    overall: number; // 0-100
  };
  
  // 데이터 통계
  dataStats: {
    totalSamplesReceived: {
      eeg: number;
      ppg: number;
      acc: number;
    };
    lastDataReceived: {
      eeg: number;
      ppg: number;
      acc: number;
    };
  };
}

/**
 * DeviceStore - 확장된 디바이스 관리 전용 스토어
 * 
 * 역할:
 * - 등록된 디바이스 관리 (사용자 편의)
 * - 스캔된 디바이스 목록 관리
 * - 연결된 디바이스 상태 모니터링
 * - 배터리 및 성능 모니터링
 */
interface DeviceStore {
  // === 기본 상태 ===
  registeredDevices: RegisteredDevice[]; // 등록된 디바이스 목록
  availableDevices: EEGDevice[]; // 스캔된 디바이스 목록
  connectedDevice: ConnectedDeviceStatus | null; // 연결된 디바이스 상태
  
  connectionState: ConnectionState; // 연결 상태
  isScanning: boolean; // 스캔 중 여부
  
  // === Computed values (removed - will be computed in selectors) ===
  
  // === 등록된 디바이스 관리 ===
  registerDevice: (device: EEGDevice, nickname?: string) => void;
  unregisterDevice: (deviceId: string) => void;
  updateRegisteredDevice: (deviceId: string, updates: Partial<RegisteredDevice>) => void;
  renameDevice: (deviceId: string, nickname: string) => void;
  isDeviceRegistered: (deviceId: string) => boolean;
  
  // === 디바이스별 저장 설정 관리 ===
  updateDeviceStorageSettings: (deviceId: string, settings: Partial<DeviceStorageSettings>) => void;
  getDeviceStorageSettings: (deviceId: string) => DeviceStorageSettings | null;
  resetDeviceStorageSettings: (deviceId: string) => void;
  
  // === 스캔된 디바이스 관리 ===
  setAvailableDevices: (devices: EEGDevice[]) => void;
  addDevice: (device: EEGDevice) => void;
  updateDevice: (deviceId: string, updates: Partial<EEGDevice>) => void;
  setScanning: (isScanning: boolean) => void;
  
  // === 연결 상태 관리 ===
  setConnectionState: (state: ConnectionState) => void;
  startDeviceConnection: (device: EEGDevice) => void;
  updateConnectedDeviceStatus: (updates: Partial<ConnectedDeviceStatus>) => void;
  disconnectDevice: () => void;
  
  // === 모니터링 데이터 업데이트 ===
  updateSamplingRates: (rates: Partial<SensorSamplingRates>) => void;
  updateBatteryInfo: (level: number, voltage?: number) => void;
  updateSignalQuality: (quality: Partial<ConnectedDeviceStatus['signalQuality']>) => void;
  updateDataStats: (stats: Partial<ConnectedDeviceStatus['dataStats']>) => void;
  
  // === 유틸리티 ===
  getRegisteredDeviceByName: (name: string) => RegisteredDevice | null;
  getConnectionHistory: () => Array<{ deviceId: string; timestamp: number; duration: number }>;
  
  // 초기화
  reset: () => void;
}

// localStorage에서 등록된 디바이스 로드
const loadRegisteredDevices = (): RegisteredDevice[] => {
  try {
    const saved = localStorage.getItem('registeredDevices');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Failed to load registered devices:', error);
    return [];
  }
};

// localStorage에 등록된 디바이스 저장
const saveRegisteredDevices = (devices: RegisteredDevice[]) => {
  try {
    localStorage.setItem('registeredDevices', JSON.stringify(devices));
  } catch (error) {
    console.error('Failed to save registered devices:', error);
  }
};

const initialState = {
  registeredDevices: loadRegisteredDevices(),
  availableDevices: [],
  connectedDevice: null,
  connectionState: {
    status: 'disconnected' as const
  },
  isScanning: false
};

// 배터리 감소 속도 계산 함수
const calculateBatteryDecreaseRate = (history: BatteryInfo['history']): { decreaseRate: number; estimatedTime: number } => {
  if (history.length < 2) {
    return { decreaseRate: 0, estimatedTime: 0 };
  }
  
  // 최근 1시간 데이터만 사용 (더 정확한 계산)
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const recentHistory = history.filter(h => h.timestamp >= oneHourAgo);
  
  if (recentHistory.length < 2) {
    return { decreaseRate: 0, estimatedTime: 0 };
  }
  
  // 선형 회귀를 통한 감소 속도 계산
  const firstPoint = recentHistory[0];
  const lastPoint = recentHistory[recentHistory.length - 1];
  
  const timeDiffHours = (lastPoint.timestamp - firstPoint.timestamp) / (1000 * 60 * 60);
  const levelDiff = firstPoint.level - lastPoint.level;
  
  if (timeDiffHours <= 0 || levelDiff <= 0) {
    return { decreaseRate: 0, estimatedTime: 0 };
  }
  
  const decreaseRate = levelDiff / timeDiffHours; // %/hour
  const estimatedTime = lastPoint.level / decreaseRate * 60; // minutes
  
  return { 
    decreaseRate: Math.round(decreaseRate * 100) / 100, 
    estimatedTime: Math.max(0, Math.round(estimatedTime)) 
  };
};

// 시간 포맷 함수
const formatDuration = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const formatBatteryTime = (minutes: number): string => {
  if (minutes <= 0) return '0m';
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  
  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  } else {
    return `${remainingMinutes}m`;
  }
};

// 기본 디바이스 저장 설정
const getDefaultStorageSettings = (): DeviceStorageSettings => ({
  autoRecord: false,
  defaultFormat: 'jsonl',
  sessionNameTemplate: '{deviceName}_{date}_{time}',
  maxSessionDuration: 60, // 60분
  compressionEnabled: true,
  saveLocation: 'sessions',
  autoSaveInterval: 5, // 5초
  memoryThreshold: 50, // 50MB
  minSignalQuality: 70, // 70%
  pauseOnLowQuality: false,
});

export const useDeviceStore = create<DeviceStore>((set, get) => ({
  ...initialState,

  // === Computed values removed - computed in Hook selectors ===

  // === 등록된 디바이스 관리 ===
  registerDevice: (device, nickname) => set((state) => {
    const existingIndex = state.registeredDevices.findIndex(d => d.id === device.id);
    const registeredDevice: RegisteredDevice = {
      id: device.id,
      name: device.name || 'Unknown Device',
      nickname,
      registeredAt: Date.now(),
      connectionCount: 0,
      totalUsageDuration: 0,
      storageSettings: getDefaultStorageSettings(),
      connectionHistory: []
    };
    
    let updatedDevices: RegisteredDevice[];
    if (existingIndex >= 0) {
      // 기존 디바이스 업데이트
      updatedDevices = [...state.registeredDevices];
      updatedDevices[existingIndex] = { ...updatedDevices[existingIndex], ...registeredDevice };
    } else {
      // 새 디바이스 추가
      updatedDevices = [...state.registeredDevices, registeredDevice];
    }
    
    // localStorage에 저장
    saveRegisteredDevices(updatedDevices);
    
    return { registeredDevices: updatedDevices };
  }),
  
  unregisterDevice: (deviceId) => set((state) => {
    const updatedDevices = state.registeredDevices.filter(d => d.id !== deviceId);
    saveRegisteredDevices(updatedDevices);
    return { registeredDevices: updatedDevices };
  }),
  
  updateRegisteredDevice: (deviceId, updates) => set((state) => {
    const updatedDevices = state.registeredDevices.map(device => 
      device.id === deviceId ? { ...device, ...updates } : device
    );
    saveRegisteredDevices(updatedDevices);
    return { registeredDevices: updatedDevices };
  }),
  
  renameDevice: (deviceId, nickname) => set((state) => {
    const updatedDevices = state.registeredDevices.map(device => 
      device.id === deviceId ? { ...device, nickname: nickname.trim() || undefined } : device
    );
    saveRegisteredDevices(updatedDevices);
    return { registeredDevices: updatedDevices };
  }),
  
  isDeviceRegistered: (deviceId) => {
    return get().registeredDevices.some(d => d.id === deviceId);
  },
  
  // === 디바이스별 저장 설정 관리 ===
  updateDeviceStorageSettings: (deviceId, settings) => set((state) => {
    const updatedDevices = state.registeredDevices.map(device => 
      device.id === deviceId 
        ? { ...device, storageSettings: { ...device.storageSettings, ...settings } }
        : device
    );
    saveRegisteredDevices(updatedDevices);
    return { registeredDevices: updatedDevices };
  }),
  
  getDeviceStorageSettings: (deviceId) => {
    const device = get().registeredDevices.find(d => d.id === deviceId);
    return device?.storageSettings || null;
  },
  
  resetDeviceStorageSettings: (deviceId) => set((state) => {
    const updatedDevices = state.registeredDevices.map(device => 
      device.id === deviceId 
        ? { ...device, storageSettings: getDefaultStorageSettings() }
        : device
    );
    saveRegisteredDevices(updatedDevices);
    return { registeredDevices: updatedDevices };
  }),

  // === 스캔된 디바이스 관리 ===
  setAvailableDevices: (availableDevices) => set({ availableDevices }),
  
  addDevice: (device) => set((state) => ({
    availableDevices: [...state.availableDevices.filter(d => d.id !== device.id), device]
  })),
  
  updateDevice: (deviceId, updates) => set((state) => ({
    availableDevices: state.availableDevices.map(device => 
      device.id === deviceId ? { ...device, ...updates } : device
    )
  })),
  
  setScanning: (isScanning) => set({ isScanning }),

  // === 연결 상태 관리 ===
  setConnectionState: (connectionState) => set({ connectionState }),
  
  startDeviceConnection: (device) => {
    const now = Date.now();
    const connectedDevice: ConnectedDeviceStatus = {
      device,
      connectionStartTime: now,
      connectionDuration: 0,
      
      samplingRates: {
        eeg: 250, // 기본값
        ppg: 50,  // 기본값
        acc: 30,  // 기본값
        lastUpdated: now
      },
      
      battery: {
        level: device.batteryLevel || 0,
        lastUpdated: now,
        history: [{
          timestamp: now,
          level: device.batteryLevel || 0
        }],
        decreaseRate: 0,
        estimatedTimeRemaining: 0
      },
      
      signalQuality: {
        eeg: 0,
        ppg: 0,
        acc: 0,
        overall: 0
      },
      
      dataStats: {
        totalSamplesReceived: {
          eeg: 0,
          ppg: 0,
          acc: 0
        },
        lastDataReceived: {
          eeg: 0,
          ppg: 0,
          acc: 0
        }
      }
    };
    
    set({ 
      connectedDevice,
      connectionState: {
        status: 'connected',
        device
      }
    });
    
    // 등록된 디바이스 연결 횟수 및 히스토리 업데이트
    const state = get();
    const registeredDevice = state.registeredDevices.find(d => d.id === device.id);
    if (registeredDevice) {
      const newConnectionHistory = [
        ...registeredDevice.connectionHistory,
        {
          startTime: now,
          duration: 0 // 연결 해제 시 업데이트됨
        }
      ];
      
      // 최근 10개 세션만 유지
      if (newConnectionHistory.length > 10) {
        newConnectionHistory.splice(0, newConnectionHistory.length - 10);
      }
      
      state.updateRegisteredDevice(device.id, {
        lastConnectedAt: now,
        connectionCount: registeredDevice.connectionCount + 1,
        connectionHistory: newConnectionHistory
      });
    }
  },
  
  updateConnectedDeviceStatus: (updates) => set((state) => {
    if (!state.connectedDevice) return state;
    
    return {
      connectedDevice: {
        ...state.connectedDevice,
        ...updates,
        connectionDuration: Date.now() - state.connectedDevice.connectionStartTime
      }
    };
  }),
  
  disconnectDevice: () => set((state) => {
    const now = Date.now();
    let newState = { 
      connectedDevice: null,
      connectionState: { status: 'disconnected' as const }
    };
    
    // 연결된 디바이스가 있고 등록된 디바이스라면 히스토리 업데이트
    if (state.connectedDevice) {
      const deviceId = state.connectedDevice.device.id;
      const connectionDuration = now - state.connectedDevice.connectionStartTime;
      
      const registeredDeviceIndex = state.registeredDevices.findIndex(d => d.id === deviceId);
      if (registeredDeviceIndex >= 0) {
        const registeredDevice = state.registeredDevices[registeredDeviceIndex];
        const updatedHistory = [...registeredDevice.connectionHistory];
        
        // 마지막 연결 세션 완료
        if (updatedHistory.length > 0 && !updatedHistory[updatedHistory.length - 1].endTime) {
          updatedHistory[updatedHistory.length - 1] = {
            ...updatedHistory[updatedHistory.length - 1],
            endTime: now,
            duration: connectionDuration
          };
        }
        
        // 최근 10개 세션만 유지
        if (updatedHistory.length > 10) {
          updatedHistory.splice(0, updatedHistory.length - 10);
        }
        
        const updatedRegisteredDevices = [...state.registeredDevices];
        updatedRegisteredDevices[registeredDeviceIndex] = {
          ...registeredDevice,
          totalUsageDuration: registeredDevice.totalUsageDuration + connectionDuration,
          connectionHistory: updatedHistory
        };
        
        // localStorage에 저장
        saveRegisteredDevices(updatedRegisteredDevices);
        
        return {
          ...newState,
          registeredDevices: updatedRegisteredDevices
        };
      }
    }
    
    return newState;
  }),

  // === 모니터링 데이터 업데이트 ===
  updateSamplingRates: (rates) => set((state) => {
    if (!state.connectedDevice) return state;
    
    return {
      connectedDevice: {
        ...state.connectedDevice,
        samplingRates: {
          ...state.connectedDevice.samplingRates,
          ...rates,
          lastUpdated: Date.now()
        }
      }
    };
  }),
  
  updateBatteryInfo: (level, voltage) => set((state) => {
    if (!state.connectedDevice) return state;
    
    const now = Date.now();
    const newHistory = [
      ...state.connectedDevice.battery.history,
      { timestamp: now, level }
    ];
    
    // 최근 2시간 데이터만 유지 (메모리 최적화)
    const twoHoursAgo = now - 2 * 60 * 60 * 1000;
    const filteredHistory = newHistory.filter(h => h.timestamp >= twoHoursAgo);
    
    const { decreaseRate, estimatedTime } = calculateBatteryDecreaseRate(filteredHistory);
    
    return {
      connectedDevice: {
        ...state.connectedDevice,
        battery: {
          level,
          voltage,
          lastUpdated: now,
          history: filteredHistory,
          decreaseRate,
          estimatedTimeRemaining: estimatedTime
        }
      }
    };
  }),
  
  updateSignalQuality: (quality) => set((state) => {
    if (!state.connectedDevice) return state;
    
    const newQuality = {
      ...state.connectedDevice.signalQuality,
      ...quality
    };
    
    // 전체 신호 품질 계산 (평균)
    newQuality.overall = Math.round((newQuality.eeg + newQuality.ppg + newQuality.acc) / 3);
    
    return {
      connectedDevice: {
        ...state.connectedDevice,
        signalQuality: newQuality
      }
    };
  }),
  
  updateDataStats: (stats) => set((state) => {
    if (!state.connectedDevice) return state;
    
    const now = Date.now();
    return {
      connectedDevice: {
        ...state.connectedDevice,
        dataStats: {
          totalSamplesReceived: {
            ...state.connectedDevice.dataStats.totalSamplesReceived,
            ...stats.totalSamplesReceived
          },
          lastDataReceived: {
            ...state.connectedDevice.dataStats.lastDataReceived,
            ...stats.lastDataReceived,
            ...(stats.lastDataReceived && Object.keys(stats.lastDataReceived).reduce((acc, key) => {
              acc[key as keyof typeof acc] = now;
              return acc;
            }, {} as any))
          }
        }
      }
    };
  }),

  // === 유틸리티 ===
  getRegisteredDeviceByName: (name) => {
    return get().registeredDevices.find(d => d.name === name || d.nickname === name) || null;
  },
  
  getConnectionHistory: () => {
    // 향후 구현: localStorage에서 연결 히스토리 조회
    return [];
  },
  
  reset: () => set(initialState)
}));

// === UI Hook 함수들 ===
export const useRegisteredDevices = () => useDeviceStore(state => state.registeredDevices);
export const useDeviceList = () => useDeviceStore(state => state.availableDevices);
export const useConnectionState = () => useDeviceStore(state => state.connectionState);
export const useConnectedDevice = () => useDeviceStore(state => state.connectedDevice);
export const useIsScanning = () => useDeviceStore(state => state.isScanning);
export const useIsConnected = () => useDeviceStore(state => state.connectionState.status === 'connected');
export const useCurrentDevice = () => useDeviceStore(state => state.connectedDevice?.device || null);

// === 모니터링 Hook 함수들 ===
export const useDeviceMonitoring = () => useDeviceStore(state => {
  const connectedDevice = state.connectedDevice;
  const connectionDuration = connectedDevice 
    ? formatDuration(Date.now() - connectedDevice.connectionStartTime)
    : '00:00:00';
  const batteryTimeRemaining = connectedDevice 
    ? formatBatteryTime(connectedDevice.battery.estimatedTimeRemaining)
    : '0m';
    
  return {
    connectionDuration,
    batteryLevel: connectedDevice?.battery.level || 0,
    batteryDecreaseRate: connectedDevice?.battery.decreaseRate || 0,
    batteryTimeRemaining,
    samplingRates: connectedDevice?.samplingRates,
    signalQuality: connectedDevice?.signalQuality,
    dataStats: connectedDevice?.dataStats
  };
});

export const useBatteryInfo = () => useDeviceStore(state => {
  const connectedDevice = state.connectedDevice;
  const timeRemaining = connectedDevice 
    ? formatBatteryTime(connectedDevice.battery.estimatedTimeRemaining)
    : '0m';
    
  return {
    level: connectedDevice?.battery.level || 0,
    decreaseRate: connectedDevice?.battery.decreaseRate || 0,
    timeRemaining,
    voltage: connectedDevice?.battery.voltage
  };
});

export const useSamplingRates = () => useDeviceStore(state => state.connectedDevice?.samplingRates);

export const useDeviceActions = () => useDeviceStore(state => ({
  registerDevice: state.registerDevice,
  unregisterDevice: state.unregisterDevice,
  updateRegisteredDevice: state.updateRegisteredDevice,
  renameDevice: state.renameDevice,
  isDeviceRegistered: state.isDeviceRegistered,
  updateDeviceStorageSettings: state.updateDeviceStorageSettings,
  getDeviceStorageSettings: state.getDeviceStorageSettings,
  resetDeviceStorageSettings: state.resetDeviceStorageSettings,
  getRegisteredDeviceByName: state.getRegisteredDeviceByName
}));

// 디바이스별 저장 설정 관련 훅
export const useDeviceStorageSettings = (deviceId: string) => useDeviceStore(state => 
  state.registeredDevices.find(d => d.id === deviceId)?.storageSettings || null
); 