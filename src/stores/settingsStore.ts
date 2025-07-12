import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SettingsStore {
  // Theme settings
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  // Language settings
  language: 'en' | 'ko' | 'ja';
  setLanguage: (language: 'en' | 'ko' | 'ja') => void;
  
  // Connection settings
  autoConnect: boolean;
  setAutoConnect: (autoConnect: boolean) => void;
  
  // Notification settings
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  
  // Data settings
  dataRetentionDays: number;
  setDataRetentionDays: (days: number) => void;
  
  // Processing settings
  samplingRate: number;
  setSamplingRate: (rate: number) => void;
  
  bufferSize: number;
  setBufferSize: (size: number) => void;
  
  // Export settings
  exportFormat: 'csv' | 'json' | 'mat' | 'edf';
  setExportFormat: (format: 'csv' | 'json' | 'mat' | 'edf') => void;
  
  // Streaming recording format settings
  streamingRecordingFormat: 'csv' | 'json' | 'binary' | 'jsonl';
  setStreamingRecordingFormat: (format: 'csv' | 'json' | 'binary' | 'jsonl') => void;
  
  compressionEnabled: boolean;
  setCompressionEnabled: (enabled: boolean) => void;
  
  // Debug settings
  debugMode: boolean;
  setDebugMode: (enabled: boolean) => void;
  
  // Time zone settings
  timezone: 'system' | 'korea' | 'utc';
  setTimezone: (timezone: 'system' | 'korea' | 'utc') => void;
  
  // Reset function
  resetToDefaults: () => void;
}

const defaultSettings = {
  theme: 'system' as const,
  language: 'en' as const,
  autoConnect: true,
  notificationsEnabled: true,
  dataRetentionDays: 30,
  samplingRate: 250,
  bufferSize: 1024,
  exportFormat: 'csv' as const,
  streamingRecordingFormat: 'csv' as const,
  compressionEnabled: true,
  debugMode: false,
  timezone: 'korea' as const,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      // Initial state
      ...defaultSettings,
      
      // Theme actions
      setTheme: (theme) => set({ theme }),
      
      // Language actions
      setLanguage: (language) => set({ language }),
      
      // Connection actions
      setAutoConnect: (autoConnect) => set({ autoConnect }),
      
      // Notification actions
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      
      // Data actions
      setDataRetentionDays: (dataRetentionDays) => set({ dataRetentionDays }),
      
      // Processing actions
      setSamplingRate: (samplingRate) => set({ samplingRate }),
      setBufferSize: (bufferSize) => set({ bufferSize }),
      
      // Export actions
      setExportFormat: (exportFormat) => set({ exportFormat }),
      setStreamingRecordingFormat: (streamingRecordingFormat) => set({ streamingRecordingFormat }),
      setCompressionEnabled: (compressionEnabled) => set({ compressionEnabled }),
      
      // Debug actions
      setDebugMode: (debugMode) => set({ debugMode }),
      
      // Time zone actions
      setTimezone: (timezone) => set({ timezone }),
      
      // Reset function
      resetToDefaults: () => set(defaultSettings),
    }),
    {
      name: 'linkband-settings',
      version: 1,
    }
  )
); 