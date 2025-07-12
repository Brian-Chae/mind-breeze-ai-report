import React from 'react';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { systemControlService } from '../services/SystemControlService';
import { useDeviceStore } from './deviceStore';
import { useRawDataStore } from './rawDataStore';
import { useProcessedDataStore } from './processedDataStore';
import { useSensorDataStore } from './sensorDataStore';

/**
 * SystemStore - 중앙 상태 관리 시스템
 * 
 * 역할:
 * - 시스템 전체 상태 관리 (UI 상태, 연결 상태, 스트리밍 상태 등)
 * - UI Hook 제공 (React 컴포넌트에서 사용)
 * - SystemControlService와 UI 사이의 상태 브리지
 * - 비즈니스 로직은 SystemControlService에 위임
 */

// 시스템 상태 타입 정의
interface SystemState {
  // 시스템 초기화 상태
  isInitialized: boolean;
  systemStatus: 'idle' | 'initializing' | 'ready' | 'error';
  systemError: string | null;
  
  // 디바이스 연결 상태
  isConnected: boolean;
  currentDeviceId: string | null;
  deviceName: string | null;
  batteryLevel: number;
  
  // 센서 접촉 상태 (새로 추가)
  isSensorContacted: boolean;
  leadOffStatus: {
    fp1: boolean; // true면 접촉 불량
    fp2: boolean; // true면 접촉 불량
  };
  
  // 스트리밍 상태
  isStreaming: boolean;
  streamingError: string | null;
  
  // 레코딩 상태
  isRecording: boolean;
  currentSessionName: string | null;
  recordingError: string | null;
  
  // UI 상태
  isScanning: boolean;
  scanError: string | null;
  availableDevices: any[];
  
  // 성능 모니터링
  lastUpdateTime: number;
  updateCount: number;
}

// 시스템 액션 타입 정의
interface SystemActions {
  // 시스템 제어 액션 (SystemControlService 호출)
  initializeSystem: () => Promise<void>;
  shutdownSystem: () => Promise<void>;
  
  // 디바이스 제어 액션
  scanDevices: () => Promise<void>;
  connectDevice: (deviceId: string) => Promise<void>;
  disconnectDevice: () => Promise<void>;
  
  // 디바이스 관리 액션 (새로 추가)
  registerDevice: (device: any, nickname?: string) => Promise<void>;
  unregisterDevice: (deviceId: string) => Promise<void>;
  
  // 스트리밍 제어 액션
  startStreaming: () => Promise<void>;
  stopStreaming: () => Promise<void>;
  
  // 레코딩 제어 액션
  startRecording: (sessionName?: string) => Promise<void>;
  stopRecording: () => Promise<void>;
  
  // 상태 업데이트 액션 (내부용)
  updateSystemStatus: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // 센서 접촉 상태 액션 (새로 추가)
  updateSensorContactStatus: (fp1LeadOff: boolean, fp2LeadOff: boolean) => void;
  
  // UI 상태 액션
  setScanningState: (isScanning: boolean) => void;
  setAvailableDevices: (devices: any[]) => void;
}

type SystemStore = SystemState & SystemActions;

// Zustand Store 생성
export const useSystemStore = create<SystemStore>()(
  subscribeWithSelector((set, get) => {
    // 자동 상태 업데이트 타이머
    let statusUpdateInterval: NodeJS.Timeout | null = null;

    const startStatusMonitoring = () => {
      if (statusUpdateInterval) return;
      
      statusUpdateInterval = setInterval(() => {
        try {
          const status = systemControlService.getStatus();
          const currentState = get();
          
          // 상태가 변경되었을 때만 업데이트
          if (
            currentState.isInitialized !== status.isInitialized ||
            currentState.isConnected !== status.isConnected ||
            currentState.isStreaming !== status.isStreaming ||
            currentState.isRecording !== status.isRecording ||
            currentState.currentDeviceId !== status.currentDeviceId
          ) {
            set({ 
              isInitialized: status.isInitialized,
              isConnected: status.isConnected,
              isStreaming: status.isStreaming,
              isRecording: status.isRecording,
              currentDeviceId: status.currentDeviceId,
              lastUpdateTime: Date.now(),
              updateCount: currentState.updateCount + 1
            });
          }
        } catch (error) {
          console.error('Status monitoring error:', error);
        }
      }, 1000);
    };

    const stopStatusMonitoring = () => {
      if (statusUpdateInterval) {
        clearInterval(statusUpdateInterval);
        statusUpdateInterval = null;
      }
    };

    // 초기 모니터링 시작
    setTimeout(startStatusMonitoring, 1000);

    return ({
    // === 초기 상태 ===
    isInitialized: false,
    systemStatus: 'idle',
    systemError: null,
    
    isConnected: false,
    currentDeviceId: null,
    deviceName: null,
    batteryLevel: 0,
    
    isSensorContacted: false,
    leadOffStatus: {
      fp1: false,
      fp2: false
    },
    
    isStreaming: false,
    streamingError: null,
    
    isRecording: false,
    currentSessionName: null,
    recordingError: null,
    
    isScanning: false,
    scanError: null,
    availableDevices: [],
    
    lastUpdateTime: Date.now(),
    updateCount: 0,

    // === 시스템 제어 액션 ===
    initializeSystem: async () => {
      set({ systemStatus: 'initializing', systemError: null });
      
      try {
        await systemControlService.initialize();
        set({ 
          isInitialized: true,
          systemStatus: 'ready',
          lastUpdateTime: Date.now(),
          updateCount: get().updateCount + 1
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        set({ 
          systemStatus: 'error',
          systemError: errorMessage,
          lastUpdateTime: Date.now(),
          updateCount: get().updateCount + 1
        });
        throw error;
      }
    },

    shutdownSystem: async () => {
      try {
        await systemControlService.cleanup();
        set({
          isInitialized: false,
          systemStatus: 'idle',
          isConnected: false,
          isStreaming: false,
          isRecording: false,
          currentDeviceId: null,
          deviceName: null,
          systemError: null,
          lastUpdateTime: Date.now(),
          updateCount: get().updateCount + 1
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        set({ 
          systemError: errorMessage,
          lastUpdateTime: Date.now(),
          updateCount: get().updateCount + 1
        });
        throw error;
      }
    },

    // === 디바이스 제어 액션 ===
    scanDevices: async () => {
      set({ isScanning: true, scanError: null });
      
      // DeviceStore 업데이트
      useDeviceStore.getState().setScanning(true);
      
      try {
        const devices = await systemControlService.scanDevices();
        
        // DeviceStore 업데이트
        useDeviceStore.getState().setAvailableDevices(devices);
        useDeviceStore.getState().setScanning(false);
        
        set({ 
          availableDevices: devices,
          isScanning: false,
          lastUpdateTime: Date.now(),
          updateCount: get().updateCount + 1
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // DeviceStore 업데이트
        useDeviceStore.getState().setScanning(false);
        
        set({ 
          isScanning: false,
          scanError: errorMessage,
          lastUpdateTime: Date.now(),
          updateCount: get().updateCount + 1
        });
        throw error;
      }
    },

    // === 디바이스 관리 액션 ===
    registerDevice: async (device, nickname) => {
      try {
        await systemControlService.registerDevice(device, nickname);
        set({ 
          lastUpdateTime: Date.now(),
          updateCount: get().updateCount + 1
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        set({ 
          systemError: errorMessage,
          lastUpdateTime: Date.now(),
          updateCount: get().updateCount + 1
        });
        throw error;
      }
    },

    unregisterDevice: async (deviceId) => {
      try {
        await systemControlService.unregisterDevice(deviceId);
        set({ 
          lastUpdateTime: Date.now(),
          updateCount: get().updateCount + 1
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        set({ 
          systemError: errorMessage,
          lastUpdateTime: Date.now(),
          updateCount: get().updateCount + 1
        });
        throw error;
      }
    },

    connectDevice: async (deviceId: string) => {
      set({ systemError: null });
      
      try {
        await systemControlService.connectDevice(deviceId);
        
        // 연결 후 상태 업데이트
        const deviceInfo = systemControlService.getConnectedDeviceInfo();
        
        // DeviceStore 업데이트
        useDeviceStore.getState().setConnectionState({
          status: 'connected',
          device: deviceInfo,
          lastConnected: new Date()
        });
        
        // ProcessedDataStore 업데이트
        useProcessedDataStore.getState().updateDeviceStatus({
          batteryLevel: deviceInfo?.batteryLevel || null
        });
        
        set({ 
          isConnected: true,
          currentDeviceId: deviceId,
          deviceName: deviceInfo?.name || 'Unknown Device',
          batteryLevel: deviceInfo?.batteryLevel || 0,
          lastUpdateTime: Date.now(),
          updateCount: get().updateCount + 1
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // DeviceStore 업데이트
        useDeviceStore.getState().setConnectionState({
          status: 'error',
          error: errorMessage
        });
        
        set({ 
          systemError: errorMessage,
          isConnected: false,
          currentDeviceId: null,
          deviceName: null,
          lastUpdateTime: Date.now(),
          updateCount: get().updateCount + 1
        });
        throw error;
      }
    },

    disconnectDevice: async () => {
      try {
        await systemControlService.disconnectDevice();
        set({ 
          isConnected: false,
          currentDeviceId: null,
          deviceName: null,
          batteryLevel: 0,
          isStreaming: false,
          isRecording: false,
          lastUpdateTime: Date.now(),
          updateCount: get().updateCount + 1
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        set({ 
          systemError: errorMessage,
          lastUpdateTime: Date.now(),
          updateCount: get().updateCount + 1
        });
        throw error;
      }
    },

    // === 스트리밍 제어 액션 ===
    startStreaming: async () => {
      set({ streamingError: null });
      
      try {
        await systemControlService.startStreaming();
        set({ 
          isStreaming: true,
          lastUpdateTime: Date.now(),
          updateCount: get().updateCount + 1
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        set({ 
          streamingError: errorMessage,
          isStreaming: false,
          lastUpdateTime: Date.now(),
          updateCount: get().updateCount + 1
        });
        throw error;
      }
    },

    stopStreaming: async () => {
      try {
        await systemControlService.stopStreaming();
        set({ 
          isStreaming: false,
          streamingError: null,
          lastUpdateTime: Date.now(),
          updateCount: get().updateCount + 1
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        set({ 
          streamingError: errorMessage,
          lastUpdateTime: Date.now(),
          updateCount: get().updateCount + 1
        });
        throw error;
      }
    },

    // === 레코딩 제어 액션 ===
    startRecording: async (sessionName?: string) => {
      set({ recordingError: null });
      
      try {
        await systemControlService.startRecording(sessionName);
        set({ 
          isRecording: true,
          currentSessionName: sessionName || `Session_${Date.now()}`,
          lastUpdateTime: Date.now(),
          updateCount: get().updateCount + 1
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        set({ 
          recordingError: errorMessage,
          isRecording: false,
          lastUpdateTime: Date.now(),
          updateCount: get().updateCount + 1
        });
        throw error;
      }
    },

    stopRecording: async () => {
      try {
        await systemControlService.stopRecording();
        set({ 
          isRecording: false,
          currentSessionName: null,
          recordingError: null,
          lastUpdateTime: Date.now(),
          updateCount: get().updateCount + 1
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        set({ 
          recordingError: errorMessage,
          lastUpdateTime: Date.now(),
          updateCount: get().updateCount + 1
        });
        throw error;
      }
    },

    // === 상태 업데이트 액션 ===
    updateSystemStatus: () => {
      const status = systemControlService.getStatus();
      set({ 
        isInitialized: status.isInitialized,
        isConnected: status.isConnected,
        isStreaming: status.isStreaming,
        isRecording: status.isRecording,
        currentDeviceId: status.currentDeviceId,
        lastUpdateTime: Date.now(),
        updateCount: get().updateCount + 1
      });
    },

    setError: (error: string | null) => {
      set({ 
        systemError: error,
        lastUpdateTime: Date.now(),
        updateCount: get().updateCount + 1
      });
    },

    clearError: () => {
      set({ 
        systemError: null,
        streamingError: null,
        recordingError: null,
        scanError: null,
        lastUpdateTime: Date.now(),
        updateCount: get().updateCount + 1
      });
    },

    // === 센서 접촉 상태 액션 ===
    updateSensorContactStatus: (fp1LeadOff: boolean, fp2LeadOff: boolean) => {
      // fp1, fp2 중 하나라도 leadOff가 true면 센서 접촉 불량
      const isSensorContacted = !fp1LeadOff && !fp2LeadOff;
      
      set({ 
        isSensorContacted,
        leadOffStatus: {
          fp1: fp1LeadOff,
          fp2: fp2LeadOff
        },
        lastUpdateTime: Date.now(),
        updateCount: get().updateCount + 1
      });
    },

    // === UI 상태 액션 ===
    setScanningState: (isScanning: boolean) => {
      set({ 
        isScanning,
        lastUpdateTime: Date.now(),
        updateCount: get().updateCount + 1
      });
    },

          setAvailableDevices: (devices: any[]) => {
        set({ 
          availableDevices: devices,
          lastUpdateTime: Date.now(),
          updateCount: get().updateCount + 1
        });
      }
    });
  })
);

// === UI Hook 함수들 ===

/**
 * 시스템 상태 Hook
 */
export const useSystemStatus = () => {
  return useSystemStore(state => ({
    isInitialized: state.isInitialized,
    systemStatus: state.systemStatus,
    systemError: state.systemError,
    lastUpdateTime: state.lastUpdateTime,
    updateCount: state.updateCount
  }));
};

/**
 * 디바이스 상태 Hook
 */
export const useDeviceStatus = () => {
  return useSystemStore(state => ({
    isConnected: state.isConnected,
    currentDeviceId: state.currentDeviceId,
    deviceName: state.deviceName,
    batteryLevel: state.batteryLevel
  }));
};

/**
 * 스트리밍 상태 Hook
 */
export const useStreamingStatus = () => {
  return useSystemStore(state => ({
    isStreaming: state.isStreaming,
    streamingError: state.streamingError
  }));
};

/**
 * 레코딩 상태 Hook
 */
export const useRecordingStatus = () => {
  return useSystemStore(state => ({
    isRecording: state.isRecording,
    currentSessionName: state.currentSessionName,
    recordingError: state.recordingError
  }));
};

/**
 * 시스템 액션 Hook
 */
export const useSystemActions = () => {
  return useSystemStore(state => ({
    initializeSystem: state.initializeSystem,
    shutdownSystem: state.shutdownSystem,
    scanDevices: state.scanDevices,
    connectDevice: state.connectDevice,
    disconnectDevice: state.disconnectDevice,
    registerDevice: state.registerDevice,
    unregisterDevice: state.unregisterDevice,
    startStreaming: state.startStreaming,
    stopStreaming: state.stopStreaming,
    startRecording: state.startRecording,
    stopRecording: state.stopRecording,
    setError: state.setError,
    clearError: state.clearError,
    updateSensorContactStatus: state.updateSensorContactStatus
  }));
};

/**
 * 스캔 상태 Hook
 */
export const useScanStatus = () => {
  return useSystemStore(state => ({
    isScanning: state.isScanning,
    scanError: state.scanError,
    availableDevices: state.availableDevices
  }));
};

/**
 * 디바이스 모니터링 Hook (DeviceStore에서 직접 사용)
 */
export const useDeviceMonitoring = () => {
  // DeviceStore Hook을 직접 사용하도록 안내
  console.warn('useDeviceMonitoring: Please use useDeviceMonitoring from deviceStore directly');
  return null;
};

/**
 * 배터리 정보 Hook (DeviceStore에서 직접 사용)
 */
export const useBatteryInfo = () => {
  // DeviceStore Hook을 직접 사용하도록 안내
  console.warn('useBatteryInfo: Please use useBatteryInfo from deviceStore directly');
  return null;
};

/**
 * 샘플링 레이트 Hook (DeviceStore에서 직접 사용)
 */
export const useSamplingRates = () => {
  // DeviceStore Hook을 직접 사용하도록 안내
  console.warn('useSamplingRates: Please use useSamplingRates from deviceStore directly');
  return null;
};

/**
 * 센서 접촉 상태 Hook
 */
export const useSensorContactStatus = () => {
  const isSensorContacted = useSystemStore(state => state.isSensorContacted);
  const leadOffStatus = useSystemStore(state => state.leadOffStatus);
  
  return {
    isSensorContacted,
    leadOffStatus,
    isConnected: useSystemStore(state => state.isConnected),
    isStreaming: useSystemStore(state => state.isStreaming)
  };
};

/**
 * 샘플링 레이트 정보 Hook
 */
export const useSamplingRatesInfo = () => {
  // DeviceStore Hook을 직접 사용하도록 안내
  console.warn('useSamplingRatesInfo: Please use useSamplingRatesInfo from deviceStore directly');
  return null;
}; 