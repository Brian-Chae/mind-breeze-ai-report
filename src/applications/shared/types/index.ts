/**
 * 공통 Applications 타입 정의
 */

export interface ApplicationConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'active' | 'coming_soon' | 'maintenance';
  version: string;
}

export interface ApplicationContext {
  // Store 접근
  stores: {
    processedDataStore: any;
    systemStore: any;
    rawDataStore: any;
    sensorDataStore: any;
    deviceStore: any;
  };
  
  // 애플리케이션 상태
  mode: 'fullscreen' | 'widget';
  onClose: () => void;
  onModeChange: (mode: 'fullscreen' | 'widget') => void;
}

export interface ApplicationProps {
  context: ApplicationContext;
}

export type ApplicationMode = 'fullscreen' | 'widget';

export interface ApplicationRunner {
  id: string;
  component: React.ComponentType<ApplicationProps>;
  config: ApplicationConfig;
  mode: ApplicationMode;
  isActive: boolean;
} 