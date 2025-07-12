/**
 * ApplicationContext - 애플리케이션에서 SDK Store들에 접근할 수 있는 컨텍스트
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { ApplicationContext as IApplicationContext, ApplicationMode } from '../types';

// ❌ Store hooks import 제거 - 각 컴포넌트에서 직접 사용하도록 변경
// import { useProcessedDataStore } from '../../../stores/processedDataStore';
// import { useRawDataStore } from '../../../stores/rawDataStore';
// import { useSensorDataStore } from '../../../stores/sensorDataStore';
// import { useDeviceStore } from '../../../stores/deviceStore';

interface ApplicationContextProviderProps {
  children: ReactNode;
  mode: ApplicationMode;
  onClose: () => void;
  onModeChange: (mode: ApplicationMode) => void;
}

const ApplicationContext = createContext<IApplicationContext | null>(null);

export function ApplicationContextProvider({ 
  children, 
  mode, 
  onClose, 
  onModeChange 
}: ApplicationContextProviderProps) {
  // ✅ Store 스냅샷 제거 - 각 컴포넌트에서 직접 Store hooks 사용
  // const processedDataStore = useProcessedDataStore();  // ❌ 정적 스냅샷 제거
  // const rawDataStore = useRawDataStore();
  // const sensorDataStore = useSensorDataStore();
  // const deviceStore = useDeviceStore();

  const contextValue: IApplicationContext = {
    stores: {
      // ✅ Store 참조 제거 - 각 컴포넌트에서 직접 hooks 사용
      processedDataStore: null,
      systemStore: null,
      rawDataStore: null,
      sensorDataStore: null,
      deviceStore: null,
    },
    mode,
    onClose,
    onModeChange,
  };

  return (
    <ApplicationContext.Provider value={contextValue}>
      {children}
    </ApplicationContext.Provider>
  );
}

export function useApplicationContext(): IApplicationContext {
  const context = useContext(ApplicationContext);
  if (!context) {
    throw new Error('useApplicationContext must be used within ApplicationContextProvider');
  }
  return context;
}

// ❌ Store 접근 편의 훅들 제거 - 각 컴포넌트에서 직접 Store hooks 사용
// export function useApplicationStores() {
//   const { stores } = useApplicationContext();
//   return stores;
// }

export function useApplicationMode() {
  const { mode, onModeChange } = useApplicationContext();
  return { mode, onModeChange };
}

export function useApplicationControls() {
  const { onClose, onModeChange } = useApplicationContext();
  return { onClose, onModeChange };
} 