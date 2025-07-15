// Core Business Stores - Phase 2 Implementation
export { useUserStore } from './userStore';
export { useOrganizationStore } from './organizationStore';

// EEG Data Stores - Existing
export { useEEGDataStore } from './eegDataStore';
export { useRawDataStore } from './rawDataStore';
export { useSensorDataStore } from './sensorDataStore';
export { useProcessedDataStore } from './processedDataStore';

// System Stores - Existing
export { useDeviceStore } from './deviceStore';
export { useStorageStore } from './storageStore';
export { useSettingsStore } from './settingsStore';

// UI Stores - Existing  
export { useUIStore } from './uiStore';
export { useLanguageStore } from './languageStore';

// Re-export types for convenience
export type { 
  UserSession, 
  UserPermissions 
} from './userStore';

export type { 
  OrganizationMetrics, 
  OrganizationSettings,
  ExtendedOrganizationMember,
  MemberRole,
  MemberStatus 
} from './organizationStore';

export type { Language } from './languageStore';
export type { MenuId, Notification } from './uiStore'; 