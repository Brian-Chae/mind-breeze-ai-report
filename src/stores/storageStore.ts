import { create } from 'zustand';
import { StreamingStorageService, StreamingSessionMetadata, StreamingSessionConfig } from '../services/StreamingStorageService';
import { systemControlService } from '../services/SystemControlService';
import { 
  saveStorageDirectory, 
  restoreStorageDirectory, 
  getStoredDirectoryInfo,
  removeStorageDirectory,
  isStoragePersistenceSupported 
} from '../utils/StoragePersistence';
import { 
  detectOS, 
  generateSmartPath, 
  isValidAbsolutePath, 
  formatPathForSystem,
  getCurrentUsername 
} from '../utils/pathUtils';
import { useSettingsStore } from './settingsStore';

/**
 * 통합 저장소 Store
 * 스트리밍 저장 서비스와 연동하여 상태 관리
 */

export interface StorageStats {
  available: string;
  used: string;
  sessions: number;
  totalSize: string;
}

export interface StorageSettings {
  autoSave: boolean;
  defaultFormats: string[];
  compression: boolean;
  backupInterval: 'none' | 'daily' | 'weekly' | 'monthly';
  maxSessionSize: number; // MB
  cleanupOldSessions: boolean;
  maxStorageSize: number; // GB
}

export interface StorageStatus {
  isWriting: boolean;
  writeSpeed: number; // MB/s
  savedData: number; // MB
  currentFormats: string[];
  queueLength: number;
  memoryUsage: number; // MB
}

export interface SessionInfo {
  id: string;
  name: string;
  date: string;
  time: string;
  duration: string;
  formats: string[];
  totalSize: string;
  avgFileSize: string;
  quality: number;
  deviceName: string;
  deviceId: string;
  size: string;
  notes: string;
  handle: FileSystemDirectoryHandle;
}

export interface StorageConfig {
  storageDirectory: FileSystemDirectoryHandle | null;
  storageDirectoryName?: string; // 저장소 디렉토리 이름 (표시용)
  storageDirectoryAbsolutePath?: string; // 저장소 디렉토리 절대 경로 (사용자 입력)
  defaultFormat: 'jsonl' | 'csv' | 'binary';
  autoSaveInterval: number; // milliseconds
  memoryThreshold: number; // bytes
  retentionDays: number;
  compressionEnabled: boolean;
  backupEnabled: boolean;
  defaultSaveOptions?: {
    eegRaw?: boolean;
    ppgRaw?: boolean;
    accRaw?: boolean;
    // 🔧 processed 데이터 타입 제거 - 복잡성으로 인해 제외
    // eegProcessed?: boolean;
    // ppgProcessed?: boolean;
    // accProcessed?: boolean;
    // 🔧 분석 지표 옵션만 유지
    eegAnalysisMetrics?: boolean;
    ppgAnalysisMetrics?: boolean;
    accAnalysisMetrics?: boolean;
  };
}

export interface StorageStore {
  // 저장소 상태
  isInitialized: boolean;
  storageDirectoryPath: string;
  storageStats: StorageStats;
  storageSettings: StorageSettings;
  storageStatus: StorageStatus;
  
  // 새로운 설정 인터페이스
  config: StorageConfig;
  updateConfig: (config: Partial<StorageConfig>) => void;
  requestStorageDirectory: () => Promise<void>;
  isStorageReady: boolean;
  
  // 세션 관리
  sessions: SessionInfo[];
  currentSession: StreamingSessionMetadata | null;
  selectedSessions: string[];
  
  // 저장소 관리
  selectStorageDirectory: () => Promise<boolean>;
  changeStorageDirectory: () => Promise<boolean>;
  initializeStorage: () => Promise<void>;
  
  // 세션 관리
  startRecording: (config: StreamingSessionConfig) => Promise<string>;
  stopRecording: () => Promise<void>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  
  // 세션 조회
  loadSessions: () => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  deleteSessions: (sessionIds: string[]) => Promise<void>;
  exportSession: (sessionId: string, format: string, targetDirHandle?: FileSystemDirectoryHandle) => Promise<void>;
  exportSessions: (sessionIds: string[], format: string) => Promise<void>;
  
  // 선택 관리
  selectSession: (sessionId: string) => void;
  selectAllSessions: () => void;
  clearSelection: () => void;
  
  // 설정 관리
  updateStorageSettings: (settings: Partial<StorageSettings>) => void;
  
  // 상태 업데이트
  updateStorageStatus: (status: Partial<StorageStatus>) => void;
  updateStorageStats: () => Promise<void>;
  
  // 세션 상태 관리 (SystemControlService용)
  setCurrentSession: (sessionId: string | null) => void;
  setIsRecording: (isRecording: boolean) => void;
  
  // 내부 메서드
  startStatusMonitoring: () => void;
  loadSessionsFromStorage: () => Promise<SessionInfo[]>;
  loadFromStandardStructure: (sessionsDir: FileSystemDirectoryHandle) => Promise<SessionInfo[]>;
  loadFromDirectStructure: (directoryHandle: FileSystemDirectoryHandle) => Promise<SessionInfo[]>;
  loadFromFallbackStructure: (directoryHandle: FileSystemDirectoryHandle) => Promise<SessionInfo[]>;
  loadSessionMetadata: (sessionName: string, sessionHandle: FileSystemDirectoryHandle) => Promise<SessionInfo | null>;
  parseSessionDate: (sessionName: string) => string;
  parseSessionTime: (sessionName: string) => string;
  formatDuration: (seconds: number) => string;
  formatFileSize: (bytes: number) => string;
  detectFormats: (sessionHandle: FileSystemDirectoryHandle) => Promise<string[]>;
  
  // 저장소 설정 확인 및 복원 시도
  checkAndRestoreStorage: () => Promise<boolean>;
  
  // 내부 유틸리티 메서드
  calculateDirectorySize: (directoryHandle: FileSystemDirectoryHandle) => Promise<number>;
  exportSessionAsZip: (sessionInfo: SessionInfo, targetDirHandle: FileSystemDirectoryHandle) => Promise<void>;
  exportSessionFiles: (sessionInfo: SessionInfo, targetDirHandle: FileSystemDirectoryHandle, format: string) => Promise<void>;
}

// 기본 설정값
const defaultStorageSettings: StorageSettings = {
  autoSave: true,
  defaultFormats: ['json', 'csv'],
  compression: true,
  backupInterval: 'weekly',
  maxSessionSize: 500, // 500MB
  cleanupOldSessions: true,
  maxStorageSize: 10 // 10GB
};

const defaultStorageStats: StorageStats = {
  available: '0 GB',
  used: '0 GB',
  sessions: 0,
  totalSize: '0 MB'
};

const defaultStorageStatus: StorageStatus = {
  isWriting: false,
  writeSpeed: 0,
  savedData: 0,
  currentFormats: [],
  queueLength: 0,
  memoryUsage: 0
};

const defaultStorageConfig: StorageConfig = {
  storageDirectory: null,
  storageDirectoryName: undefined,
  defaultFormat: 'jsonl',
  autoSaveInterval: 5000, // 5 seconds
  memoryThreshold: 50 * 1024 * 1024, // 50MB
  retentionDays: 30,
  compressionEnabled: true,
  backupEnabled: false,
  defaultSaveOptions: {
    eegRaw: true,
    ppgRaw: true,
    accRaw: true,
    // 🔧 분석 지표 옵션만 유지
    eegAnalysisMetrics: true,
    ppgAnalysisMetrics: true,
    accAnalysisMetrics: true,
  },
};

// 저장소 설정 영구 저장 키
const STORAGE_CONFIG_KEY = 'linkband_storage_config';

// 타임존 유틸리티 함수
const getTimezoneOffset = (timezone: 'system' | 'korea' | 'utc'): number => {
  switch (timezone) {
    case 'korea':
      return 9 * 60; // KST는 UTC+9 (분 단위)
    case 'utc':
      return 0;
    case 'system':
    default:
      return new Date().getTimezoneOffset() * -1; // 시스템 타임존 (분 단위)
  }
};

const convertToTimezone = (dateTime: Date, timezone: 'system' | 'korea' | 'utc'): Date => {
  const targetOffset = getTimezoneOffset(timezone);
  const systemOffset = new Date().getTimezoneOffset() * -1;
  const offsetDiff = targetOffset - systemOffset;
  
  return new Date(dateTime.getTime() + offsetDiff * 60 * 1000);
};

// localStorage에서 저장소 설정 로드
const loadStorageConfig = (): Partial<StorageConfig> => {
  try {
    const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (saved) {
      const config = JSON.parse(saved);
      // storageDirectory는 FileSystemDirectoryHandle이므로 복원 불가
      // 대신 저장소 경로 정보만 저장
      return {
        ...config,
        storageDirectory: null, // 매번 새로 선택해야 함
      };
    }
  } catch (error) {
    console.error('저장소 설정 로드 실패:', error);
  }
  return {};
};

// localStorage에 저장소 설정 저장
const saveStorageConfig = (config: StorageConfig) => {
  try {
    // FileSystemDirectoryHandle은 직렬화할 수 없으므로 제외
    const { storageDirectory, ...serializableConfig } = config;
    const configToSave = {
      ...serializableConfig,
      storageDirectoryName: storageDirectory?.name || null, // 디렉토리 이름만 저장
    };
    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(configToSave));
  } catch (error) {
    console.error('저장소 설정 저장 실패:', error);
  }
};

export const useStorageStore = create<StorageStore>((set, get) => {
  const streamingService = StreamingStorageService.getInstance();
  
  // 저장된 설정 로드
  const savedConfig = loadStorageConfig();
  const initialConfig = { ...defaultStorageConfig, ...savedConfig };
  
  return {
    // 초기 상태
    isInitialized: false,
    storageDirectoryPath: savedConfig.storageDirectoryName || '',
    storageStats: defaultStorageStats,
    storageSettings: defaultStorageSettings,
    storageStatus: defaultStorageStatus,
    sessions: [],
    currentSession: null,
    selectedSessions: [],
    
    // 새로운 설정 인터페이스
    config: initialConfig,
    isStorageReady: false,
    
    updateConfig: (newConfig: Partial<StorageConfig>) => {
      const updatedConfig = { ...get().config, ...newConfig };
      set((state) => ({
        config: updatedConfig,
        isStorageReady: newConfig.storageDirectory !== null ? true : state.isStorageReady
      }));
      
      // 설정 저장
      saveStorageConfig(updatedConfig);
    },
    
    requestStorageDirectory: async () => {
      try {
        if ('showDirectoryPicker' in window) {
          const dirHandle = await (window as any).showDirectoryPicker({
            mode: 'readwrite',
            startIn: 'downloads'
          });
          const updatedConfig = { ...get().config, storageDirectory: dirHandle };
          
          set((state) => ({
            config: updatedConfig,
            isStorageReady: true,
            storageDirectoryPath: dirHandle.name || 'Selected Directory'
          }));
          
          // 설정 저장
          saveStorageConfig(updatedConfig);
        }
      } catch (error) {
        console.error('Failed to select directory:', error);
      }
    },

    // 저장소 디렉토리 선택
    selectStorageDirectory: async (): Promise<boolean> => {
      try {
        console.log('[REPOSITORY] 📁 저장소 디렉토리 선택 시작');
        
        if (!('showDirectoryPicker' in window)) {
          throw new Error('File System Access API가 지원되지 않습니다.');
        }

        const directoryHandle = await (window as any).showDirectoryPicker({
          mode: 'readwrite',
          startIn: 'downloads'
        });

        console.log(`[REPOSITORY] ✅ 디렉토리 선택됨: ${directoryHandle.name}`);
        
        // 플랫폼별 스마트 기본 경로 생성
        const os = detectOS();
        const currentUser = getCurrentUsername();
        const smartDefaultPath = generateSmartPath(directoryHandle.name, 'downloads');
        
        console.log(`[REPOSITORY] 🖥️ 감지된 OS: ${os}`);
        console.log(`[REPOSITORY] 👤 감지된 사용자: ${currentUser}`);
        console.log(`[REPOSITORY] 📍 스마트 기본 경로: ${smartDefaultPath}`);
        
        let estimatedAbsolutePath = '';
        try {
          // 플랫폼별 예시 경로 생성
          let examplePaths = [];
          switch (os) {
            case 'windows':
              examplePaths = [
                `C:\\Users\\${currentUser}\\Documents\\${directoryHandle.name}`,
                `C:\\Users\\${currentUser}\\Downloads\\${directoryHandle.name}`,
                `C:\\Users\\${currentUser}\\Desktop\\${directoryHandle.name}`
              ];
              break;
            case 'macos':
              examplePaths = [
                `/Users/${currentUser}/Documents/${directoryHandle.name}`,
                `/Users/${currentUser}/Downloads/${directoryHandle.name}`,
                `/Users/${currentUser}/Desktop/${directoryHandle.name}`
              ];
              break;
            case 'linux':
              examplePaths = [
                `/home/${currentUser}/Documents/${directoryHandle.name}`,
                `/home/${currentUser}/Downloads/${directoryHandle.name}`,
                `/home/${currentUser}/Desktop/${directoryHandle.name}`
              ];
              break;
            default:
              examplePaths = [
                `${currentUser}/Documents/${directoryHandle.name}`,
                `${currentUser}/Downloads/${directoryHandle.name}`,
                `${currentUser}/Desktop/${directoryHandle.name}`
              ];
          }
          
                  // 사용자에게 절대 경로 확인 요청
        const userPath = prompt(
          `선택한 폴더의 절대 경로를 입력해주세요.\n\n` +
          `폴더명: ${directoryHandle.name}\n` +
          `운영체제: ${os.toUpperCase()}\n\n` +
          `일반적인 위치 예시:\n` +
          examplePaths.map(path => `• ${path}`).join('\n') + '\n\n' +
          `정확한 절대 경로를 입력하면 파일 경로 복사 시 올바른 경로가 제공됩니다.\n\n` +
          `취소하면 추정된 경로를 사용합니다.`,
          smartDefaultPath
        );
          
          if (userPath && userPath.trim()) {
            const inputPath = userPath.trim();
            if (isValidAbsolutePath(inputPath)) {
              estimatedAbsolutePath = formatPathForSystem(inputPath);
              console.log(`[REPOSITORY] 📍 사용자 입력 절대 경로: ${estimatedAbsolutePath}`);
            } else {
              console.warn(`[REPOSITORY] ⚠️ 잘못된 절대 경로 형식: ${inputPath}, 기본값 사용`);
              estimatedAbsolutePath = smartDefaultPath;
            }
          } else {
            // 스마트 기본값 사용
            estimatedAbsolutePath = smartDefaultPath;
            console.log(`[REPOSITORY] 📍 스마트 기본 절대 경로 사용: ${estimatedAbsolutePath}`);
          }
        } catch (error) {
          console.warn('[REPOSITORY] ⚠️ 절대 경로 추정 실패, 기본값 사용:', error);
          estimatedAbsolutePath = smartDefaultPath;
        }
        
        // 영구 저장 시도
        try {
          if (isStoragePersistenceSupported()) {
            await saveStorageDirectory(directoryHandle);
            console.log('[REPOSITORY] 💾 디렉토리 권한 영구 저장 완료');
          } else {
            console.log('[REPOSITORY] ⚠️ 브라우저가 영구 저장을 지원하지 않음');
          }
        } catch (saveError) {
          console.warn('[REPOSITORY] ⚠️ 디렉토리 영구 저장 실패 (기능은 정상 동작):', saveError);
        }

        // 상태 업데이트 전 현재 상태 로그
        console.log('[REPOSITORY] 🔄 상태 업데이트 전:', {
          isInitialized: get().isInitialized,
          storageDirectoryPath: get().storageDirectoryPath,
          configDirectory: get().config.storageDirectory ? 'SET' : 'NULL'
        });

        // 저장소 설정 업데이트
        set({
          config: {
            ...get().config,
            storageDirectory: directoryHandle,
            storageDirectoryName: directoryHandle.name,
            storageDirectoryAbsolutePath: estimatedAbsolutePath
          },
          isInitialized: true,
          isStorageReady: true,
          storageDirectoryPath: estimatedAbsolutePath || directoryHandle.name
        });
        
        console.log('[REPOSITORY] ✅ 저장소 상태 업데이트 완료');
        console.log('[REPOSITORY] 🔍 업데이트된 상태:', {
          isInitialized: get().isInitialized,
          storageDirectoryPath: get().storageDirectoryPath,
          configDirectory: get().config.storageDirectory ? 'SET' : 'NULL'
        });
        
        // 상태 업데이트 확인을 위한 추가 검증
        const verifyState = get();
        console.log('[REPOSITORY] 🔍 상태 검증:', {
          isInitialized: verifyState.isInitialized,
          configStorageDirectory: verifyState.config.storageDirectory ? 'VERIFIED_SET' : 'VERIFIED_NULL',
          directoryName: verifyState.config.storageDirectory?.name || 'NO_NAME'
        });

        // 로컬 스토리지에도 설정 저장 (백업용)
        const config = get().config;
        saveStorageConfig(config);

        // 저장소 초기화 전 상태 확인
        console.log('[REPOSITORY] 🔄 initializeStorage 호출 전 상태:', {
          isInitialized: get().isInitialized,
          configDirectory: get().config.storageDirectory ? 'SET' : 'NULL'
        });
        
        // 저장소 초기화
        await get().initializeStorage();
        
        // 저장소 초기화 후 상태 확인
        console.log('[REPOSITORY] 🔄 initializeStorage 호출 후 상태:', {
          isInitialized: get().isInitialized,
          configDirectory: get().config.storageDirectory ? 'SET' : 'NULL'
        });
        
        // 세션 목록 로드
        await get().loadSessions();
        
        // 저장소 통계 업데이트
        await get().updateStorageStats();
        
        console.log('[REPOSITORY] ✅ 저장소 선택 및 설정 완료');
        return true;

      } catch (error) {
        console.error('[REPOSITORY] ❌ 저장소 디렉토리 선택 실패:', error);
        
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            console.log('[REPOSITORY] 🚫 사용자가 디렉토리 선택을 취소함');
          } else {
            console.error('[REPOSITORY] ❌ 디렉토리 선택 오류:', error.message);
          }
        }
        
        return false;
      }
    },

    // 저장소 변경 (경고 포함)
    changeStorageDirectory: async (): Promise<boolean> => {
      try {
        // 사용자에게 경고 표시
        const confirmed = window.confirm(
          '⚠️ 저장소 변경 경고\n\n' +
          '저장소를 변경하면 다음과 같은 변경사항이 적용됩니다:\n\n' +
          '• 현재 세션이 종료됩니다\n' +
          '• 모든 저장소 관련 설정이 초기화됩니다\n' +
          '• 이전 저장소의 데이터는 그대로 유지됩니다\n' +
          '• 새로운 저장소에서 새로 시작됩니다\n\n' +
          '계속하시겠습니까?'
        );

        if (!confirmed) {
          return false;
        }

        // 현재 세션 정리
        if (get().storageStatus.isWriting) {
          await get().stopRecording();
        }

        // 저장소 초기화
        set({
          isInitialized: false,
          storageDirectoryPath: '',
          storageStats: { ...defaultStorageStats },
          storageStatus: { ...defaultStorageStatus },
          sessions: [],
          currentSession: null,
          selectedSessions: [],
          config: { ...defaultStorageConfig }
        });

        // 새 저장소 선택
        const success = await get().selectStorageDirectory();
        
        if (success) {
          console.log('✅ 저장소 변경 완료');
          // 새 저장소의 세션 로드
          await get().loadSessions();
        }

        return success;
      } catch (error) {
        console.error('❌ 저장소 변경 실패:', error);
        return false;
      }
    },

    // 저장소 초기화
    initializeStorage: async (): Promise<void> => {
      try {
        console.log('[REPOSITORY] 🔧 저장소 초기화 시작');
        
        // 설정 로드 (localStorage에서)
        const savedSettings = localStorage.getItem('linkband_storage_settings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          set({ storageSettings: { ...defaultStorageSettings, ...settings } });
        }

        // 현재 저장소가 이미 설정되어 있는지 확인
        const currentConfig = get().config;
        if (currentConfig.storageDirectory) {
          console.log('[REPOSITORY] 🔧 저장소가 이미 설정됨, localStorage 덮어쓰기 건너뛰기');
          console.log('[REPOSITORY] ✅ 저장소 초기화 완료 (기존 설정 유지)');
          return;
        }

        // 저장된 저장소 설정이 있는지 확인 (storageDirectory가 없을 때만)
        const savedConfig = loadStorageConfig();
        if (savedConfig.storageDirectoryName) {
          // 저장된 저장소 정보가 있지만 FileSystemDirectoryHandle은 복원할 수 없으므로
          // 사용자에게 저장소 재선택을 요청
          console.log('[REPOSITORY] 💾 저장된 저장소 설정 발견:', savedConfig.storageDirectoryName);
          console.log('[REPOSITORY] 🔄 브라우저 보안상 저장소를 다시 선택해주세요.');
          
          // storageDirectory는 제외하고 다른 설정만 적용
          const { storageDirectory, ...configWithoutDirectory } = savedConfig;
          
          // 저장된 절대 경로 검증 및 수정
          let displayPath = savedConfig.storageDirectoryAbsolutePath || savedConfig.storageDirectoryName || '';
          if (displayPath.includes('/Users/user/Documents/') || displayPath.includes('/Users/user/')) {
            console.log(`[REPOSITORY] 🔧 잘못된 저장된 경로 감지: ${displayPath}`);
            // 올바른 사용자 이름으로 수정
            const correctPath = `/Users/brian_chae/Downloads/${savedConfig.storageDirectoryName}`;
            console.log(`[REPOSITORY] 🔧 올바른 경로로 수정: ${correctPath}`);
            displayPath = correctPath;
            
            // 수정된 설정 저장
            const updatedConfig = { ...configWithoutDirectory, storageDirectoryAbsolutePath: correctPath };
            saveStorageConfig(updatedConfig as StorageConfig);
          }
          
          // 저장소 경로만 표시용으로 설정 (절대 경로 우선)
          set({ 
            storageDirectoryPath: displayPath,
            config: { ...get().config, ...configWithoutDirectory }
          });
        }

        console.log('[REPOSITORY] ✅ 저장소 초기화 완료');
      } catch (error) {
        console.error('[REPOSITORY] ❌ 저장소 초기화 실패:', error);
        throw error;
      }
    },

    // 저장소 설정 확인 및 복원 시도
    checkAndRestoreStorage: async (): Promise<boolean> => {
      try {
        console.log('[REPOSITORY] 🔄 저장소 복원 시도...');
        
        // 영구 저장 시스템 지원 여부 확인
        if (!isStoragePersistenceSupported()) {
          console.log('[REPOSITORY] ⚠️ 브라우저가 영구 저장을 지원하지 않음');
          return false;
        }
        console.log('[REPOSITORY] ✅ 영구 저장 시스템 지원됨');
        
        // 저장된 디렉토리 정보 확인
        const storedInfo = await getStoredDirectoryInfo();
        if (!storedInfo) {
          console.log('[REPOSITORY] 📭 저장된 디렉토리 정보 없음');
          return false;
        }
        
        console.log(`[REPOSITORY] 📂 저장된 디렉토리 발견: ${storedInfo.name} (${new Date(storedInfo.timestamp).toLocaleString()})`);
        
        // 저장된 디렉토리 핸들 복원 시도
        console.log('[REPOSITORY] 🔄 디렉토리 핸들 복원 시도...');
        const restoredHandle = await restoreStorageDirectory();
        if (!restoredHandle) {
          console.log('[REPOSITORY] ❌ 디렉토리 핸들 복원 실패');
          return false;
        }
        
        console.log(`[REPOSITORY] ✅ 디렉토리 핸들 복원 성공: ${restoredHandle.name}`);
        
        // 복원된 핸들로 저장소 설정 업데이트
        console.log('[REPOSITORY] 🔄 저장소 상태 업데이트 중...');
        
        // 저장된 절대 경로 복원 시도 및 검증
        const savedConfig = loadStorageConfig();
        let absolutePath = savedConfig.storageDirectoryAbsolutePath || restoredHandle.name;
        
        // 저장된 절대 경로가 잘못된 경우 (예: /Users/user/Documents/...) 수정
        if (absolutePath.includes('/Users/user/Documents/') || absolutePath.includes('/Users/user/')) {
          console.log(`[REPOSITORY] 🔧 잘못된 절대 경로 감지: ${absolutePath}`);
          // 올바른 사용자 이름으로 수정
          const correctPath = `/Users/brian_chae/Downloads/${restoredHandle.name}`;
          console.log(`[REPOSITORY] 🔧 올바른 절대 경로로 수정: ${correctPath}`);
          absolutePath = correctPath;
          
          // 수정된 경로를 저장
          const updatedConfig = { ...savedConfig, storageDirectoryAbsolutePath: correctPath };
          saveStorageConfig(updatedConfig as StorageConfig);
        }
        
        set({
          config: {
            ...get().config,
            storageDirectory: restoredHandle,
            storageDirectoryName: restoredHandle.name,
            storageDirectoryAbsolutePath: absolutePath
          },
          isInitialized: true,
          isStorageReady: true,
          storageDirectoryPath: absolutePath
        });
        
        console.log('[REPOSITORY] ✅ 저장소 상태 업데이트 완료');
        console.log('[REPOSITORY] 🔍 업데이트된 상태:', {
          isInitialized: get().isInitialized,
          storageDirectoryPath: get().storageDirectoryPath,
          configDirectory: get().config.storageDirectory ? 'SET' : 'NULL'
        });
        
        // 세션 목록 로드
        console.log('[REPOSITORY] 🔄 세션 목록 로드 시작...');
        await get().loadSessions();
        
        // 저장소 통계 업데이트
        console.log('[REPOSITORY] 🔄 저장소 통계 업데이트 시작...');
        await get().updateStorageStats();
        
        console.log('[REPOSITORY] ✅ 저장소 자동 복원 완료');
        return true;
      } catch (error) {
        console.error('[REPOSITORY] ❌ 저장소 복원 실패:', error);
        return false;
      }
    },

    // 레코딩 시작
    startRecording: async (config: StreamingSessionConfig): Promise<string> => {
      try {
        console.log('🔧 StorageStore.startRecording 시작');
        console.log('🔧 현재 저장소 상태:', {
          isInitialized: get().isInitialized,
          configStorageDirectory: get().config.storageDirectory ? 'SET' : 'NULL',
          storageDirectoryName: get().config.storageDirectory?.name || 'null'
        });
        console.log('🔧 전달받은 config:', config);

        // 저장소 디렉토리 확인
        if (!get().config.storageDirectory) {
          throw new Error('저장소 디렉토리가 설정되지 않았습니다. Data Center에서 저장소를 먼저 설정해주세요.');
        }

        // SystemControlService를 통해 레코딩 시작 (저장소 디렉토리 동기화 포함)
        console.log('🔧 SystemControlService.startRecording 호출, config 전달');
        const sessionId = await systemControlService.startRecording(config.sessionName, config);
        
        // 현재 세션 정보 업데이트
        const currentSession = streamingService.getCurrentSession();
        
        set({ 
          currentSession,
          storageStatus: {
            ...get().storageStatus,
            isWriting: true,
            currentFormats: config.saveFormats
          }
        });

        // 실시간 상태 업데이트 시작
        get().startStatusMonitoring();

        console.log('✅ 레코딩 시작 완료:', sessionId);
        return sessionId;
      } catch (error) {
        console.error('❌ 레코딩 시작 실패:', error);
        throw error;
      }
    },

    // 레코딩 중지
    stopRecording: async (): Promise<void> => {
      try {
        await streamingService.endStreamingSession();
        
        set({ 
          currentSession: null,
          storageStatus: {
            ...get().storageStatus,
            isWriting: false,
            writeSpeed: 0,
            currentFormats: [],
            savedData: 0,
            memoryUsage: 0
          }
        });

        // 세션 목록 새로고침 - 실제 저장된 세션 로드
        await get().loadSessions();
        await get().updateStorageStats();

        console.log('✅ 레코딩 중지');
      } catch (error) {
        console.error('❌ 레코딩 중지 실패:', error);
        throw error;
      }
    },

    // 레코딩 일시정지 (추후 구현)
    pauseRecording: async (): Promise<void> => {
      console.log('⏸️ 레코딩 일시정지 (추후 구현)');
    },

    // 레코딩 재개 (추후 구현)
    resumeRecording: async (): Promise<void> => {
      console.log('▶️ 레코딩 재개 (추후 구현)');
    },

    // 세션 로드
    loadSessions: async (): Promise<void> => {
      console.log('[REPOSITORY] 🔧 loadSessions 시작');
      console.log('[REPOSITORY] 🔧 현재 저장소 상태:', {
        isInitialized: get().isInitialized,
        storageDirectoryPath: get().storageDirectoryPath,
        configStorageDirectory: get().config.storageDirectory ? 'SET' : 'NULL'
      });
      
      if (!get().isInitialized || !get().config.storageDirectory) {
        console.log('[REPOSITORY] 🔧 저장소가 초기화되지 않음');
        console.log('[REPOSITORY] 🔧 - isInitialized:', get().isInitialized);
        console.log('[REPOSITORY] 🔧 - config.storageDirectory:', get().config.storageDirectory ? 'SET' : 'NULL');
        return;
      }

      try {
        console.log('[REPOSITORY] 🔧 세션 로드 시작...');
        
        // 현재 시간 기록 (성능 측정)
        const startTime = Date.now();
        
        const sessions = await get().loadSessionsFromStorage();
        console.log(`[REPOSITORY] 🔧 로드된 세션 수: ${sessions.length}`);
        console.log('[REPOSITORY] 🔧 로드된 세션들:', sessions.map(s => ({ id: s.id, name: s.name, path: s.id })));
        
        // 성능 로그
        const loadTime = Date.now() - startTime;
        console.log(`[REPOSITORY] 🔧 세션 로드 소요 시간: ${loadTime}ms`);
        
        set({ sessions });
        await get().updateStorageStats();
        
        console.log('[REPOSITORY] ✅ 세션 로드 완료');
      } catch (error) {
        console.error('[REPOSITORY] ❌ 세션 로드 실패:', error);
      }
    },

    // 저장소에서 세션 로드 (다중 구조 지원)
    loadSessionsFromStorage: async (): Promise<SessionInfo[]> => {
      const storageDirectory = get().config.storageDirectory;
      if (!storageDirectory) {
        console.log('[REPOSITORY] 🔧 저장소 디렉토리가 없음');
        return [];
      }

      console.log('[REPOSITORY] 🔧 저장소에서 세션 로드 시작');
      
      try {
        // 1. 표준 구조 시도: LinkBand-Data/sessions/년도/월/세션
        try {
          console.log('[REPOSITORY] 🔧 표준 구조 시도: LinkBand-Data/sessions 디렉토리 접근');
          const linkBandDataDir = await storageDirectory.getDirectoryHandle('LinkBand-Data');
          console.log('[REPOSITORY] 🔧 LinkBand-Data 디렉토리 접근 성공');
          
          const sessionsDir = await linkBandDataDir.getDirectoryHandle('sessions');
          console.log('[REPOSITORY] 🔧 sessions 디렉토리 접근 성공');
          
          const sessions = await get().loadFromStandardStructure(sessionsDir);
          console.log(`[REPOSITORY] 🔧 표준 구조에서 ${sessions.length}개 세션 발견`);
          
          if (sessions.length > 0) {
            console.log(`[REPOSITORY] 🔧 표준 구조 성공: ${sessions.length}개 세션 반환`);
            return sessions;
          } else {
            console.log('[REPOSITORY] 🔧 표준 구조에서 세션을 찾지 못함, 다음 구조 시도');
          }
        } catch (error) {
          console.log('[REPOSITORY] 🔧 표준 구조 접근 실패:', error);
        }

        // 2. 직접 구조 시도: 루트에 바로 session- 접두사 디렉토리
        try {
          console.log('[REPOSITORY] 🔧 직접 구조 시도: 루트에서 session- 접두사 검색');
          const sessions = await get().loadFromDirectStructure(storageDirectory);
          if (sessions.length > 0) {
            console.log(`[REPOSITORY] 🔧 직접 구조에서 ${sessions.length}개 세션 발견`);
            return sessions;
          }
        } catch (error) {
          console.log('[REPOSITORY] 🔧 직접 구조 접근 실패:', error);
        }

        // 3. 루트 세션 구조 시도: 루트에 sessions 디렉토리
        try {
          console.log('[REPOSITORY] 🔧 루트 세션 구조 시도: 루트/sessions');
          const sessionsDir = await storageDirectory.getDirectoryHandle('sessions');
          const sessions = await get().loadFromStandardStructure(sessionsDir);
          if (sessions.length > 0) {
            console.log(`[REPOSITORY] 🔧 루트 세션 구조에서 ${sessions.length}개 세션 발견`);
            return sessions;
          }
        } catch (error) {
          console.log('[REPOSITORY] 🔧 루트 세션 구조 접근 실패:', error);
        }

        // 4. 최후 수단: 모든 디렉토리를 세션으로 간주
        console.log('[REPOSITORY] 🔧 최후 수단: 모든 디렉토리를 세션으로 간주');
        const sessions = await get().loadFromFallbackStructure(storageDirectory);
        console.log(`[REPOSITORY] 🔧 최후 수단에서 ${sessions.length}개 세션 발견`);
        return sessions;

      } catch (error) {
        console.error('[REPOSITORY] 🔧 저장소 세션 로드 실패:', error);
        return [];
      }
    },

    // 표준 구조에서 세션 로드 (sessions/년도/월/세션)
    loadFromStandardStructure: async (sessionsDir: FileSystemDirectoryHandle): Promise<SessionInfo[]> => {
      const sessions: SessionInfo[] = [];
      
      try {
        // 년도별 디렉토리 순회
        const yearEntries = [];
        for await (const [yearName, yearHandle] of (sessionsDir as any).entries()) {
          if (yearHandle.kind === 'directory') {
            yearEntries.push({ name: yearName, handle: yearHandle });
          }
        }
        
        console.log('🔧 발견된 년도 디렉토리:', yearEntries.map(e => e.name));
        
        for (const yearEntry of yearEntries) {
          console.log(`🔧 년도 ${yearEntry.name} 처리 중`);
          
          try {
            // 월별 디렉토리 순회
            const monthEntries = [];
            for await (const [monthName, monthHandle] of (yearEntry.handle as any).entries()) {
              if (monthHandle.kind === 'directory') {
                monthEntries.push({ name: monthName, handle: monthHandle });
              }
            }
            
            console.log(`🔧 년도 ${yearEntry.name}의 월 디렉토리:`, monthEntries.map(e => e.name));
            
            for (const monthEntry of monthEntries) {
              console.log(`🔧 월 ${monthEntry.name} 처리 중`);
              
              try {
                // 세션별 디렉토리 순회
                const sessionEntries = [];
                for await (const [sessionName, sessionHandle] of (monthEntry.handle as any).entries()) {
                  if (sessionHandle.kind === 'directory') {
                    sessionEntries.push({ name: sessionName, handle: sessionHandle });
                  }
                }
                
                console.log(`🔧 월 ${monthEntry.name}의 세션 디렉토리:`, sessionEntries.map(e => e.name));
                
                for (const sessionEntry of sessionEntries) {
                  const sessionInfo = await get().loadSessionMetadata(sessionEntry.name, sessionEntry.handle);
                  if (sessionInfo) {
                    sessions.push(sessionInfo);
                  }
                }
              } catch (monthError) {
                console.error(`🔧 월 ${monthEntry.name} 처리 실패:`, monthError);
              }
            }
          } catch (yearError) {
            console.error(`🔧 년도 ${yearEntry.name} 처리 실패:`, yearError);
          }
        }
      } catch (error) {
        console.error('🔧 표준 구조 로드 실패:', error);
        throw error;
      }
      
      return sessions;
    },

    // 직접 구조에서 세션 로드 (루트에 바로 세션 디렉토리)
    loadFromDirectStructure: async (directoryHandle: FileSystemDirectoryHandle): Promise<SessionInfo[]> => {
      const sessions: SessionInfo[] = [];
      
      try {
        console.log('🔧 직접 구조에서 세션 검색 시작');
        
        for await (const [name, handle] of (directoryHandle as any).entries()) {
          if (handle.kind === 'directory' && name.startsWith('session-')) {
            console.log(`🔧 세션 디렉토리 발견: ${name}`);
            const sessionInfo = await get().loadSessionMetadata(name, handle);
            if (sessionInfo) {
              sessions.push(sessionInfo);
            }
          }
        }
      } catch (error) {
        console.error('🔧 직접 구조 로드 실패:', error);
        throw error;
      }
      
      return sessions;
    },

    // 최후 수단: 모든 디렉토리를 세션으로 간주 (시스템 디렉토리 제외)
    loadFromFallbackStructure: async (directoryHandle: FileSystemDirectoryHandle): Promise<SessionInfo[]> => {
      const sessions: SessionInfo[] = [];
      
      try {
        console.log('🔧 최후 수단: 모든 디렉토리를 세션으로 간주');
        
        // 시스템/설정 디렉토리 목록 (세션이 아닌 디렉토리들)
        const systemDirs = ['LinkBand-Data', 'sessions', '.git', 'node_modules', 'dist', 'build'];
        
        for await (const [name, handle] of (directoryHandle as any).entries()) {
          if (handle.kind === 'directory') {
            console.log(`🔧 디렉토리 발견: ${name}`);
            
            // 시스템 디렉토리는 건너뛰기
            if (systemDirs.includes(name)) {
              console.log(`🔧 시스템 디렉토리 건너뛰기: ${name}`);
              continue;
            }
            
            const sessionInfo = await get().loadSessionMetadata(name, handle);
            if (sessionInfo) {
              sessions.push(sessionInfo);
            }
          }
        }
      } catch (error) {
        console.error('🔧 최후 수단 로드 실패:', error);
        throw error;
      }
      
      return sessions;
    },

    // 세션 메타데이터 로드
    loadSessionMetadata: async (sessionName: string, sessionHandle: FileSystemDirectoryHandle): Promise<SessionInfo | null> => {
      try {
        console.log(`🔧 세션 ${sessionName} 메타데이터 로드 시도`);
        
        let metadata: any = null;
        let metadataText: string = '';
        let sessionInfo: SessionInfo;
        
        // 메타데이터 파일 읽기 시도
        try {
          const metadataHandle = await sessionHandle.getFileHandle('metadata.json');
          const metadataFile = await metadataHandle.getFile();
          metadataText = await metadataFile.text();
          console.log(`[REPOSITORY] 🔧 세션 ${sessionName} 메타데이터 원본 텍스트:`, metadataText);
          
          // 빈 파일 체크
          if (!metadataText.trim()) {
            console.log(`[REPOSITORY] 🔧 세션 ${sessionName} 메타데이터 파일이 비어있음`);
            throw new Error('Empty metadata file');
          }
          
          // 불완전한 JSON 배열 수정 시도
          let fixedMetadataText = metadataText.trim();
          
          // 배열로 시작하지만 닫히지 않은 경우 수정
          if (fixedMetadataText.startsWith('[') && !fixedMetadataText.endsWith(']')) {
            console.log(`[REPOSITORY] 🔧 세션 ${sessionName} 불완전한 JSON 배열 감지, 수정 시도`);
            // 마지막 쉼표 제거 후 배열 종료 추가
            fixedMetadataText = fixedMetadataText.replace(/,\s*$/, '') + '\n]';
            console.log(`[REPOSITORY] 🔧 수정된 메타데이터:`, fixedMetadataText);
          }
          
          metadata = JSON.parse(fixedMetadataText);
          console.log(`[REPOSITORY] 🔧 세션 ${sessionName} 메타데이터 파싱 완료:`, metadata);
          console.log(`[REPOSITORY] 🔧 메타데이터 타입: ${Array.isArray(metadata) ? 'Array' : 'Object'}`);
          
          // 메타데이터가 배열로 저장된 경우 첫 번째 요소 사용 (기존 호환성)
          // 메타데이터가 객체로 저장된 경우 직접 사용 (새로운 형태)
          const sessionMetadata = Array.isArray(metadata) ? metadata[0] : metadata;
          console.log(`[REPOSITORY] 🔧 세션 ${sessionName} 실제 메타데이터:`, sessionMetadata);
          
          // 메타데이터 구조 검증
          if (!sessionMetadata || typeof sessionMetadata !== 'object') {
            console.error(`[REPOSITORY] 🔧 세션 ${sessionName} 메타데이터 구조 오류:`, sessionMetadata);
            throw new Error('Invalid metadata structure');
          }
          
          // 각 필드별로 상세 로그
          console.log(`[REPOSITORY] 🔧 deviceName: ${sessionMetadata.deviceName}, deviceId: ${sessionMetadata.deviceId}`);
          console.log(`[REPOSITORY] 🔧 duration: ${sessionMetadata.duration} (타입: ${typeof sessionMetadata.duration})`);
          console.log(`[REPOSITORY] 🔧 startTime: ${sessionMetadata.startTime}, endTime: ${sessionMetadata.endTime}`);
          console.log(`[REPOSITORY] 🔧 estimatedSize: ${sessionMetadata.estimatedSize} (타입: ${typeof sessionMetadata.estimatedSize})`);
          console.log(`[REPOSITORY] 🔧 saveFormats: ${JSON.stringify(sessionMetadata.saveFormats)}`);
          
          // 필수 필드 검증
          const hasDeviceName = sessionMetadata.deviceName && sessionMetadata.deviceName !== 'Unknown Device';
          const hasDeviceId = sessionMetadata.deviceId && sessionMetadata.deviceId !== 'LB001';
          const hasDuration = sessionMetadata.duration && typeof sessionMetadata.duration === 'number' && sessionMetadata.duration > 0;
          const hasSize = sessionMetadata.estimatedSize && typeof sessionMetadata.estimatedSize === 'number' && sessionMetadata.estimatedSize > 0;
          
          console.log(`[REPOSITORY] ${hasDeviceName ? '✅' : '❌'} 디바이스 이름: ${sessionMetadata.deviceName}`);
          console.log(`[REPOSITORY] ${hasDeviceId ? '✅' : '❌'} 디바이스 ID: ${sessionMetadata.deviceId}`);
          console.log(`[REPOSITORY] ${hasDuration ? '✅' : '❌'} 지속 시간: ${sessionMetadata.duration}`);
          console.log(`[REPOSITORY] ${hasSize ? '✅' : '❌'} 파일 크기: ${sessionMetadata.estimatedSize}`);
          
          // 🔧 데이터 품질 계산 개선
          let calculatedQuality = 0;
          
          if (sessionMetadata.dataQuality) {
            // 실제 데이터 품질 정보가 있는 경우 사용
            const { eegQuality, ppgQuality, accQuality } = sessionMetadata.dataQuality;
            calculatedQuality = Math.round((eegQuality + ppgQuality + accQuality) / 3);
            console.log(`[REPOSITORY] 🔧 실제 데이터 품질 사용: EEG=${eegQuality}, PPG=${ppgQuality}, ACC=${accQuality}, 평균=${calculatedQuality}`);
          } else {
            // 데이터 품질 정보가 없는 경우 세션 정보를 기반으로 추정
            const duration = sessionMetadata.duration || 0;
            const size = sessionMetadata.estimatedSize || 0;
            const deviceName = sessionMetadata.deviceName || '';
            
            // 기본 품질 점수 (75점)
            let estimatedQuality = 75;
            
            // 세션 지속 시간 기반 보정 (30초 이상이면 양호)
            if (duration >= 30) {
              estimatedQuality += 10; // 85점
            } else if (duration >= 10) {
              estimatedQuality += 5; // 80점
            } else if (duration < 5) {
              estimatedQuality -= 15; // 60점
            }
            
            // 파일 크기 기반 보정 (1MB 이상이면 데이터가 충분함)
            if (size >= 1024 * 1024) { // 1MB 이상
              estimatedQuality += 5; // +5점
            } else if (size >= 100 * 1024) { // 100KB 이상
              estimatedQuality += 2; // +2점
            } else if (size < 10 * 1024) { // 10KB 미만
              estimatedQuality -= 10; // -10점
            }
            
            // 디바이스 이름 기반 보정 (실제 디바이스 이름이 있으면 양호)
            if (deviceName !== 'Unknown Device' && deviceName.includes('LXB')) {
              estimatedQuality += 5; // +5점
            }
            
            // 품질 점수 범위 제한 (0-100)
            calculatedQuality = Math.max(0, Math.min(100, estimatedQuality));
            
            console.log(`[REPOSITORY] 🔧 추정 데이터 품질 계산: 기본=${75}, 지속시간=${duration}s, 크기=${size}bytes, 디바이스=${deviceName}, 최종=${calculatedQuality}`);
          }

          // 세션 정보 객체 생성
          sessionInfo = {
            id: sessionName,
            name: sessionName,
            date: get().parseSessionDate(sessionName),
            time: get().parseSessionTime(sessionName),
            duration: get().formatDuration(sessionMetadata.duration || 0),
            formats: sessionMetadata.saveFormats || ['unknown'],
            totalSize: get().formatFileSize(sessionMetadata.estimatedSize || 0),
            avgFileSize: get().formatFileSize((sessionMetadata.estimatedSize || 0) / Math.max(1, sessionMetadata.totalSamples || 1)),
            quality: calculatedQuality,
            deviceName: sessionMetadata.deviceName || 'Unknown Device',
            deviceId: sessionMetadata.deviceId || 'unknown',
            size: get().formatFileSize(sessionMetadata.estimatedSize || 0),
            notes: sessionMetadata.notes || '',
            handle: sessionHandle
          };
          
        } catch (parseError) {
          console.log(`[REPOSITORY] 🔧 세션 ${sessionName} 메타데이터 파싱 실패:`, parseError);
          console.log(`[REPOSITORY] 🔧 원본 메타데이터 텍스트:`, metadataText);
          
          // 메타데이터 파일이 없거나 손상된 경우 기본값으로 세션 정보 생성
          console.log(`[REPOSITORY] 🔧 세션 ${sessionName} 기본 정보로 복원 시도`);
          
          // 디렉토리 크기 계산 시도
          let estimatedSize = 0;
          try {
            estimatedSize = await get().calculateDirectorySize(sessionHandle);
          } catch (sizeError) {
            console.warn(`[REPOSITORY] 🔧 세션 ${sessionName} 크기 계산 실패:`, sizeError);
          }
          
          // 파일 형식 감지 시도
          const detectedFormats = await get().detectFormats(sessionHandle);
          
          // 🔧 메타데이터 없는 경우 품질 추정
          let fallbackQuality = 50; // 기본값 50점 (보통)
          
          // 파일 크기 기반 품질 추정
          if (estimatedSize >= 1024 * 1024) { // 1MB 이상
            fallbackQuality = 70; // 양호
          } else if (estimatedSize >= 100 * 1024) { // 100KB 이상
            fallbackQuality = 60; // 보통
          } else if (estimatedSize < 10 * 1024) { // 10KB 미만
            fallbackQuality = 30; // 불량
          }
          
          // 감지된 파일 형식 수에 따른 보정
          if (detectedFormats.length >= 2) {
            fallbackQuality += 10; // 여러 형식이 있으면 +10점
          }
          
          // 세션 이름 패턴 기반 보정 (정상적인 타임스탬프가 있으면 +10점)
          if (sessionName.match(/\d{4}-\d{2}-\d{2}/)) {
            fallbackQuality += 10;
          }
          
          fallbackQuality = Math.max(0, Math.min(100, fallbackQuality));
          
          console.log(`[REPOSITORY] 🔧 메타데이터 없음 - 추정 품질: 크기=${estimatedSize}bytes, 형식=${detectedFormats.length}개, 최종=${fallbackQuality}`);

          // 기본 세션 정보 생성
          sessionInfo = {
            id: sessionName,
            name: sessionName,
            date: get().parseSessionDate(sessionName),
            time: get().parseSessionTime(sessionName),
            duration: '알 수 없음',
            formats: detectedFormats,
            totalSize: get().formatFileSize(estimatedSize),
            avgFileSize: get().formatFileSize(estimatedSize / Math.max(1, detectedFormats.length)),
            quality: fallbackQuality,
            deviceName: 'Unknown Device',
            deviceId: 'unknown',
            size: get().formatFileSize(estimatedSize),
            notes: '메타데이터 파일 손상 또는 누락',
            handle: sessionHandle
          };
          
          console.log(`[REPOSITORY] 🔧 세션 ${sessionName} 기본 정보로 복원 완료:`, sessionInfo);
        }
        
        return sessionInfo;
        
      } catch (error) {
        console.warn(`🔧 세션 ${sessionName} 메타데이터 로드 실패:`, error);
        
        // 완전히 실패한 경우에도 최소한의 정보 제공
        try {
          const detectedFormats = await get().detectFormats(sessionHandle);
          const estimatedSize = await get().calculateDirectorySize(sessionHandle);
          
          // 🔧 완전 실패 케이스에서도 품질 추정
          let emergencyQuality = 40; // 기본값 40점 (불량에 가까운 보통)
          
          if (estimatedSize >= 500 * 1024) { // 500KB 이상이면 어느 정도 데이터가 있음
            emergencyQuality = 55;
          } else if (estimatedSize < 50 * 1024) { // 50KB 미만이면 거의 데이터 없음
            emergencyQuality = 25;
          }
          
          if (detectedFormats.length > 0) {
            emergencyQuality += 5; // 파일이 있으면 +5점
          }
          
          console.log(`[REPOSITORY] 🔧 완전 실패 케이스 - 추정 품질: 크기=${estimatedSize}bytes, 형식=${detectedFormats.length}개, 최종=${emergencyQuality}`);
          
          return {
            id: sessionName,
            name: sessionName,
            date: get().parseSessionDate(sessionName),
            time: get().parseSessionTime(sessionName),
            duration: '알 수 없음',
            formats: detectedFormats,
            totalSize: get().formatFileSize(estimatedSize),
            avgFileSize: get().formatFileSize(estimatedSize / Math.max(1, detectedFormats.length)),
            quality: emergencyQuality,
            deviceName: 'Unknown Device',
            deviceId: 'unknown',
            size: get().formatFileSize(estimatedSize),
            notes: '세션 정보 복원 실패',
            handle: sessionHandle
          };
        } catch (fallbackError) {
          console.error(`🔧 세션 ${sessionName} 완전 복원 실패:`, fallbackError);
          return null;
        }
      }
    },

    // 세션 이름에서 날짜 파싱 (타임존 고려)
    parseSessionDate: (sessionName: string): string => {
      // session-2025-07-05T02-30-01 형식에서 날짜/시간 추출
      const match = sessionName.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})/);
      if (match) {
        try {
          // Settings에서 타임존 설정 가져오기
          const timezone = (useSettingsStore.getState?.() || { timezone: 'korea' }).timezone;
          
          // UTC 시간으로 파싱 (세션 이름은 UTC 기준으로 저장됨)
          const utcDate = new Date(`${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}.000Z`);
          
          // 설정된 타임존으로 변환
          const localDate = convertToTimezone(utcDate, timezone);
          
          // YYYY-MM-DD 형식으로 반환
          return localDate.toISOString().split('T')[0];
        } catch (error) {
          console.warn('날짜 파싱 중 오류:', error);
          // 원본 날짜 반환
          return `${match[1]}-${match[2]}-${match[3]}`;
        }
      }
      return new Date().toISOString().split('T')[0];
    },

    // 세션 이름에서 시간 파싱 (타임존 고려)
    parseSessionTime: (sessionName: string): string => {
      // session-2025-07-05T02-30-01 형식에서 날짜/시간 추출
      const match = sessionName.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})/);
      if (match) {
        try {
          // Settings에서 타임존 설정 가져오기
          const timezone = (useSettingsStore.getState?.() || { timezone: 'korea' }).timezone;
          
          // UTC 시간으로 파싱 (세션 이름은 UTC 기준으로 저장됨)
          const utcDate = new Date(`${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}.000Z`);
          
          // 설정된 타임존으로 변환
          const localDate = convertToTimezone(utcDate, timezone);
          
          // HH:MM:SS 형식으로 반환
          const hours = localDate.getHours().toString().padStart(2, '0');
          const minutes = localDate.getMinutes().toString().padStart(2, '0');
          const seconds = localDate.getSeconds().toString().padStart(2, '0');
          
          return `${hours}:${minutes}:${seconds}`;
        } catch (error) {
          console.warn('시간 파싱 중 오류:', error);
          // 원본 시간 반환
          return `${match[4]}:${match[5]}:${match[6]}`;
        }
      }
      return '00:00:00';
    },

    // 지속 시간 포맷팅
    formatDuration: (seconds: number): string => {
      if (seconds <= 0) return '0초';
      
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
      } else if (minutes > 0) {
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
      } else {
        return `${remainingSeconds}초`;
      }
    },

    // 세션 디렉토리에서 파일 형식 감지
    detectFormats: async (sessionHandle: FileSystemDirectoryHandle): Promise<string[]> => {
      const formats: string[] = [];
      
      try {
        for await (const [name, handle] of (sessionHandle as any).entries()) {
          if (handle.kind === 'file') {
            const extension = name.split('.').pop()?.toLowerCase();
            if (extension && !formats.includes(extension)) {
              formats.push(extension);
            }
          }
        }
      } catch (error) {
        console.warn('파일 형식 감지 실패:', error);
      }
      
      return formats.length > 0 ? formats : ['unknown'];
    },

    // 세션 삭제
    deleteSession: async (sessionId: string): Promise<void> => {
      try {
        console.log(`[REPOSITORY] 🗑️ 세션 삭제 시작: ${sessionId}`);
        
        // 세션 정보 찾기
        const sessionInfo = get().sessions.find(s => s.id === sessionId);
        if (!sessionInfo) {
          throw new Error(`세션을 찾을 수 없습니다: ${sessionId}`);
        }

        // 사용자 확인
        const confirmed = window.confirm(
          `⚠️ 세션 삭제 확인\n\n` +
          `세션명: ${sessionInfo.name}\n` +
          `크기: ${sessionInfo.size}\n` +
          `생성일: ${sessionInfo.date} ${sessionInfo.time}\n\n` +
          `이 세션을 완전히 삭제하시겠습니까?\n` +
          `이 작업은 되돌릴 수 없습니다.`
        );

        if (!confirmed) {
          console.log(`[REPOSITORY] 🗑️ 세션 삭제 취소: ${sessionId}`);
          return;
        }

        console.log(`[REPOSITORY] 🗑️ 세션 디렉토리 삭제 시작: ${sessionId}`);
        
        // 🔧 개선된 세션 디렉토리 삭제 로직
        let deletionSuccess = false;
        const storageDirectory = get().config.storageDirectory;
        
        if (storageDirectory && sessionInfo.handle) {
          try {
            // 방법 1: 부모 디렉토리에서 직접 삭제 시도 (가장 확실한 방법)
            console.log(`[REPOSITORY] 🗑️ 방법 1: 부모 디렉토리에서 직접 삭제 시도`);
            
            // 다양한 저장소 구조에서 부모 디렉토리 찾기
            const possibleParentPaths = [
              // 표준 구조: LinkBand-Data/sessions/년도/월/
              ['LinkBand-Data', 'sessions'],
              // 루트 세션 구조: sessions/
              ['sessions'],
              // 직접 구조: 루트/
              []
            ];
            
            let parentFound = false;
            for (const pathSegments of possibleParentPaths) {
              try {
                let currentDir = storageDirectory;
                
                // 경로 세그먼트를 따라 이동
                for (const segment of pathSegments) {
                  currentDir = await currentDir.getDirectoryHandle(segment);
                }
                
                // 년도/월 구조인 경우 추가로 탐색
                if (pathSegments.includes('sessions')) {
                  // 년도 디렉토리 찾기
                  const sessionDate = get().parseSessionDate(sessionId);
                  const year = sessionDate.split('-')[0];
                  const month = sessionDate.split('-')[1];
                  
                  try {
                    const yearDir = await currentDir.getDirectoryHandle(year);
                    const monthDir = await yearDir.getDirectoryHandle(month);
                    currentDir = monthDir;
                  } catch {
                    // 년도/월 구조가 아닌 경우 sessions 디렉토리에서 직접 찾기
                  }
                }
                
                // 세션 디렉토리 삭제 시도
                console.log(`[REPOSITORY] 🗑️ 부모 디렉토리에서 세션 삭제 시도: ${sessionId}`);
                await (currentDir as any).removeEntry(sessionId, { recursive: true });
                console.log(`[REPOSITORY] ✅ 부모 디렉토리에서 세션 삭제 성공: ${sessionId}`);
                deletionSuccess = true;
                parentFound = true;
                break;
                
              } catch (pathError) {
                console.log(`[REPOSITORY] 🗑️ 경로 ${pathSegments.join('/')}에서 삭제 실패:`, pathError);
                continue;
              }
            }
            
            if (!parentFound) {
              throw new Error('부모 디렉토리를 찾을 수 없습니다');
            }
            
          } catch (directDeleteError) {
            console.warn(`[REPOSITORY] ⚠️ 방법 1 실패:`, directDeleteError);
            
            // 방법 2: 세션 디렉토리 내용을 모두 삭제한 후 빈 디렉토리 삭제
            console.log(`[REPOSITORY] 🗑️ 방법 2: 내용 삭제 후 빈 디렉토리 삭제`);
            
            try {
              // 삭제할 파일과 디렉토리 목록 수집
              const entriesToDelete: { name: string; kind: string }[] = [];
              
              for await (const [name, handle] of (sessionInfo.handle as any).entries()) {
                entriesToDelete.push({ name, kind: handle.kind });
              }
              
              console.log(`[REPOSITORY] 🗑️ 삭제할 항목 ${entriesToDelete.length}개 발견`);
              
              // 모든 파일과 하위 디렉토리 삭제
              for (const entry of entriesToDelete) {
                try {
                  if (entry.kind === 'directory') {
                    // 하위 디렉토리는 재귀적으로 삭제
                    await (sessionInfo.handle as any).removeEntry(entry.name, { recursive: true });
                  } else {
                    // 파일 삭제
                    await (sessionInfo.handle as any).removeEntry(entry.name);
                  }
                  console.log(`[REPOSITORY] 🗑️ 항목 삭제 성공: ${entry.name} (${entry.kind})`);
                } catch (entryError) {
                  console.error(`[REPOSITORY] ❌ 항목 삭제 실패: ${entry.name}`, entryError);
                }
              }
              
              console.log(`[REPOSITORY] ✅ 세션 내용 삭제 완료: ${sessionId}`);
              deletionSuccess = true;
              
            } catch (contentDeleteError) {
              console.error(`[REPOSITORY] ❌ 세션 내용 삭제 실패:`, contentDeleteError);
              throw new Error(`세션 파일 삭제 중 오류가 발생했습니다: ${contentDeleteError instanceof Error ? contentDeleteError.message : '알 수 없는 오류'}`);
            }
          }
        }

        if (!deletionSuccess) {
          throw new Error('세션 디렉토리 삭제에 실패했습니다');
        }

        // 세션 목록에서 제거
        const updatedSessions = get().sessions.filter(s => s.id !== sessionId);
        set({ sessions: updatedSessions });

        // 선택된 세션에서도 제거
        const selectedSessions = get().selectedSessions.filter(id => id !== sessionId);
        set({ selectedSessions });

        // 저장소 통계 업데이트
        await get().updateStorageStats();
        
        console.log(`[REPOSITORY] ✅ 세션 삭제 완료: ${sessionId}`);
        
        // 성공 알림
        alert(`✅ 세션이 성공적으로 삭제되었습니다.\n세션명: ${sessionInfo.name}`);
        
      } catch (error) {
        console.error(`[REPOSITORY] ❌ 세션 삭제 실패: ${sessionId}`, error);
        alert(`❌ 세션 삭제 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        throw error;
      }
    },

    // 다중 세션 삭제
    deleteSessions: async (sessionIds: string[]): Promise<void> => {
      try {
        for (const sessionId of sessionIds) {
          await get().deleteSession(sessionId);
        }
        set({ selectedSessions: [] });
      } catch (error) {
        console.error('❌ 다중 세션 삭제 실패:', error);
        throw error;
      }
    },

    // 세션 내보내기 (디렉토리 핸들 전달 받음)
    exportSession: async (sessionId: string, format: string, targetDirHandle?: FileSystemDirectoryHandle): Promise<void> => {
      try {
        console.log(`[REPOSITORY] 📤 세션 내보내기 시작: ${sessionId}, 형식: ${format}`);
        
        // 세션 정보 찾기
        const sessionInfo = get().sessions.find(s => s.id === sessionId);
        if (!sessionInfo) {
          throw new Error(`세션을 찾을 수 없습니다: ${sessionId}`);
        }

        if (!sessionInfo.handle) {
          throw new Error(`세션 파일 핸들을 찾을 수 없습니다: ${sessionId}`);
        }

        // 디렉토리 핸들이 제공되지 않은 경우에만 사용자에게 선택 요청
        let dirHandle = targetDirHandle;
        if (!dirHandle) {
          dirHandle = await (window as any).showDirectoryPicker({
            mode: 'readwrite',
            startIn: 'downloads'
          });
        }

        if (format === 'zip' || format === 'all') {
          // ZIP 형태로 전체 세션 내보내기
          await get().exportSessionAsZip(sessionInfo, dirHandle!);
        } else {
          // 개별 파일 형태로 내보내기
          await get().exportSessionFiles(sessionInfo, dirHandle!, format);
        }

        console.log(`[REPOSITORY] ✅ 세션 내보내기 완료: ${sessionId}`);
        
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log(`[REPOSITORY] 📤 세션 내보내기 취소: ${sessionId}`);
          return;
        }
        console.error(`[REPOSITORY] ❌ 세션 내보내기 실패: ${sessionId}`, error);
        throw error;
      }
    },

    // 다중 세션 내보내기
    exportSessions: async (sessionIds: string[], format: string): Promise<void> => {
      try {
        for (const sessionId of sessionIds) {
          await get().exportSession(sessionId, format);
        }
      } catch (error) {
        console.error('❌ 다중 세션 내보내기 실패:', error);
        throw error;
      }
    },

    // 세션 선택
    selectSession: (sessionId: string): void => {
      const selectedSessions = get().selectedSessions;
      const isSelected = selectedSessions.includes(sessionId);
      
      if (isSelected) {
        set({ selectedSessions: selectedSessions.filter(id => id !== sessionId) });
      } else {
        set({ selectedSessions: [...selectedSessions, sessionId] });
      }
    },

    // 모든 세션 선택
    selectAllSessions: (): void => {
      const allSessionIds = get().sessions.map(s => s.id);
      set({ selectedSessions: allSessionIds });
    },

    // 선택 해제
    clearSelection: (): void => {
      set({ selectedSessions: [] });
    },

    // 저장소 설정 업데이트
    updateStorageSettings: (settings: Partial<StorageSettings>): void => {
      const newSettings = { ...get().storageSettings, ...settings };
      set({ storageSettings: newSettings });
      
      // localStorage에 저장
      localStorage.setItem('linkband_storage_settings', JSON.stringify(newSettings));
    },

    // 저장소 상태 업데이트
    updateStorageStatus: (status: Partial<StorageStatus>): void => {
      set({ storageStatus: { ...get().storageStatus, ...status } });
    },

    // 저장소 통계 업데이트
    updateStorageStats: async (): Promise<void> => {
      try {
        console.log('[REPOSITORY] 📊 저장소 통계 업데이트 시작');
        
        const storageDirectory = get().config.storageDirectory;
        const sessions = get().sessions;
        
        let actualUsedBytes = 0;
        let estimatedAvailableGB = 8.5; // 기본값
        let totalStorageGB = 10; // 기본값
        
        if (storageDirectory) {
          try {
            // 실제 저장소 디렉토리의 전체 크기 계산
            console.log('[REPOSITORY] 📊 저장소 디렉토리 크기 계산 중...');
            actualUsedBytes = await get().calculateDirectorySize(storageDirectory);
            console.log(`[REPOSITORY] 📊 실제 사용량: ${actualUsedBytes} bytes`);
            
            // Navigator Storage API를 사용하여 사용 가능한 공간 추정 (지원되는 경우)
            if ('storage' in navigator && 'estimate' in navigator.storage) {
              try {
                const estimate = await navigator.storage.estimate();
                console.log('[REPOSITORY] 📊 Raw Storage API estimate:', estimate);
                
                if (estimate.quota && estimate.usage) {
                  const quotaBytes = estimate.quota; // 브라우저 할당량
                  const usedBytes = estimate.usage; // 브라우저 사용량
                  const availableBytes = quotaBytes - usedBytes;
                  
                  console.log('[REPOSITORY] 📊 Raw values:');
                  console.log(`[REPOSITORY] 📊 - quotaBytes: ${quotaBytes}`);
                  console.log(`[REPOSITORY] 📊 - usedBytes: ${usedBytes}`);
                  console.log(`[REPOSITORY] 📊 - availableBytes: ${availableBytes}`);
                  
                  // 실제 디스크 전체 크기 추정 
                  // 브라우저는 보통 디스크의 50-80%를 할당받으므로 역산하여 전체 디스크 크기 추정
                  const estimatedDiskSizeBytes = quotaBytes * 2; // 보수적 추정 (할당량의 2배)
                  totalStorageGB = estimatedDiskSizeBytes / (1024 * 1024 * 1024);
                  
                  // Available은 실제 디스크 여유 공간으로 계산
                  // 브라우저 사용률이 낮을 때는 실용적인 접근으로 Total의 70%를 Available로 설정
                  const browserUsageRatio = usedBytes / quotaBytes; // 브라우저 할당량 대비 사용률
                  
                  if (browserUsageRatio < 0.1) {
                    // 브라우저 사용률이 10% 미만이면 일반적인 디스크 사용률 가정 (30% 사용, 70% 여유)
                    estimatedAvailableGB = totalStorageGB * 0.7;
                    console.log(`[REPOSITORY] 📊 브라우저 사용률이 낮아서 Available을 Total의 70%로 설정`);
                  } else {
                    // 브라우저 사용률을 기반으로 전체 시스템 사용량 추정
                    const estimatedSystemUsageBytes = estimatedDiskSizeBytes * browserUsageRatio;
                    const estimatedRealAvailableBytes = Math.max(0, estimatedDiskSizeBytes - estimatedSystemUsageBytes);
                    estimatedAvailableGB = estimatedRealAvailableBytes / (1024 * 1024 * 1024);
                  }
                  
                  console.log(`[REPOSITORY] 📊 계산된 값들:`);
                  console.log(`[REPOSITORY] 📊 - browserUsageRatio: ${browserUsageRatio}`);
                  
                  // 만약 계산된 Available이 Total의 90% 이상이면 더 현실적인 값으로 조정
                  if (estimatedAvailableGB > totalStorageGB * 0.9) {
                    // 일반적으로 디스크의 70-80% 정도가 사용 가능하다고 가정
                    estimatedAvailableGB = totalStorageGB * 0.75;
                    console.log(`[REPOSITORY] 📊 Available 값이 너무 커서 75%로 조정: ${estimatedAvailableGB.toFixed(1)} GB`);
                  }
                  
                  console.log(`[REPOSITORY] 📊 Storage API 정보:`);
                  console.log(`[REPOSITORY] 📊 - 브라우저 할당량: ${(quotaBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`);
                  console.log(`[REPOSITORY] 📊 - 브라우저 사용중: ${(usedBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`);
                  console.log(`[REPOSITORY] 📊 - 브라우저 사용가능: ${(availableBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`);
                  console.log(`[REPOSITORY] 📊 - 추정 디스크 전체: ${totalStorageGB.toFixed(1)} GB`);
                  console.log(`[REPOSITORY] 📊 - 추정 디스크 여유: ${estimatedAvailableGB.toFixed(1)} GB`);
                } else {
                  console.warn('[REPOSITORY] 📊 Storage API estimate에 quota 또는 usage 정보 없음');
                }
              } catch (storageApiError) {
                console.warn('[REPOSITORY] 📊 Storage API 사용 실패:', storageApiError);
              }
            } else {
              console.warn('[REPOSITORY] 📊 Navigator Storage API 지원되지 않음');
            }
            
          } catch (error) {
            console.warn('[REPOSITORY] 📊 실제 크기 계산 실패, 세션 크기 합산으로 대체:', error);
            
            // 실제 크기 계산 실패 시 세션 크기 합산으로 대체
            actualUsedBytes = sessions.reduce((total, session) => {
              // session.size에서 숫자 추출 (예: "7.01 KB" -> 7180 bytes)
              const sizeStr = session.size;
              const match = sizeStr.match(/([\d.]+)\s*(B|KB|MB|GB)/i);
              if (match) {
                const value = parseFloat(match[1]);
                const unit = match[2].toUpperCase();
                switch (unit) {
                  case 'GB': return total + (value * 1024 * 1024 * 1024);
                  case 'MB': return total + (value * 1024 * 1024);
                  case 'KB': return total + (value * 1024);
                  case 'B': return total + value;
                  default: return total;
                }
              }
              return total;
            }, 0);
          }
        } else {
          console.log('[REPOSITORY] 📊 저장소 디렉토리 없음, 세션 크기 합산');
          // 저장소 디렉토리가 없는 경우 세션 크기 합산
          actualUsedBytes = sessions.reduce((total, session) => {
            const sizeStr = session.size;
            const match = sizeStr.match(/([\d.]+)\s*(B|KB|MB|GB)/i);
            if (match) {
              const value = parseFloat(match[1]);
              const unit = match[2].toUpperCase();
              switch (unit) {
                case 'GB': return total + (value * 1024 * 1024 * 1024);
                case 'MB': return total + (value * 1024 * 1024);
                case 'KB': return total + (value * 1024);
                case 'B': return total + value;
                default: return total;
              }
            }
            return total;
          }, 0);
        }

        // 포맷팅된 크기 문자열 생성
        const usedFormatted = get().formatFileSize(actualUsedBytes);
        const totalSizeFormatted = `${totalStorageGB.toFixed(1)} GB`; // 추정 총 디스크 용량
        
        // Available은 Navigator Storage API에서 제공하는 실제 사용 가능한 공간
        // (브라우저가 실제로 사용할 수 있는 디스크 여유 공간)
        const availableFormatted = `${estimatedAvailableGB.toFixed(1)} GB`;

        console.log(`[REPOSITORY] 📊 저장소 통계 업데이트 완료:`);
        console.log(`[REPOSITORY] 📊 - 총 용량: ${totalSizeFormatted}`);
        console.log(`[REPOSITORY] 📊 - 사용량: ${usedFormatted} (${actualUsedBytes} bytes)`);
        console.log(`[REPOSITORY] 📊 - 사용가능: ${availableFormatted}`);
        console.log(`[REPOSITORY] 📊 - 세션 수: ${sessions.length}`);

        set({
          storageStats: {
            available: availableFormatted,
            used: usedFormatted,
            sessions: sessions.length,
            totalSize: totalSizeFormatted
          }
        });
        
      } catch (error) {
        console.error('[REPOSITORY] ❌ 저장소 통계 업데이트 실패:', error);
        
        // 오류 발생 시 기본값 설정
        set({
          storageStats: {
            available: '알 수 없음',
            used: '계산 실패',
            sessions: get().sessions.length,
            totalSize: '알 수 없음'
          }
        });
      }
    },

    // 세션 상태 관리 (SystemControlService용)
    setCurrentSession: (sessionId: string | null) => {
      if (sessionId === null) {
        set({ currentSession: null });
      } else {
        // 현재 세션 정보를 가져와서 설정
        const currentSession = streamingService.getCurrentSession();
        if (currentSession && currentSession.id === sessionId) {
          set({ currentSession });
        } else {
          // 새로운 세션 메타데이터 생성
          const sessionMetadata: StreamingSessionMetadata = {
            id: sessionId,
            name: sessionId,
            startTime: new Date(),
            duration: 0,
            deviceName: 'Unknown Device',
            deviceId: 'unknown',
            samplingRate: 250,
            totalSamples: 0,
            estimatedSize: 0,
            dataQuality: {
              eegQuality: 0,
              ppgQuality: 0,
              accQuality: 0
            },
            saveFormats: ['json', 'csv'],
            notes: ''
          };
          set({ currentSession: sessionMetadata });
        }
      }
    },
    setIsRecording: (isRecording: boolean) => {
      set({ storageStatus: { ...get().storageStatus, isWriting: isRecording } });
    },

    // 실시간 상태 모니터링 시작
    startStatusMonitoring: (): void => {
      const updateStatus = () => {
        const status = streamingService.getStorageStatus();
        const currentSession = streamingService.getCurrentSession();
        const storeCurrentSession = get().currentSession;
        
        get().updateStorageStatus({
          isWriting: status.isWriting,
          queueLength: status.queueLength,
          memoryUsage: Math.round(status.memoryUsage / 1024 / 1024 * 100) / 100, // MB
          writeSpeed: status.queueLength > 0 ? 0.1 : 0, // 임시 쓰기 속도
          savedData: currentSession ? Math.round(currentSession.estimatedSize / 1024 / 1024 * 100) / 100 : 0 // MB
        });

        // 현재 세션 정보 업데이트 - estimatedSize나 기타 중요 필드가 변경되었을 때만 업데이트
        if (currentSession && (!storeCurrentSession || 
            currentSession.id !== storeCurrentSession.id ||
            currentSession.estimatedSize !== storeCurrentSession.estimatedSize ||
            currentSession.totalSamples !== storeCurrentSession.totalSamples ||
            currentSession.duration !== storeCurrentSession.duration)) {
          console.log('🔧 currentSession 업데이트:', {
            estimatedSize: currentSession.estimatedSize,
            totalSamples: currentSession.totalSamples,
            duration: currentSession.duration
          });
          set({ currentSession });
        }

        if (status.isWriting || currentSession) {
          setTimeout(updateStatus, 1000); // 1초마다 업데이트
        }
      };

      updateStatus();
    },

    formatFileSize: (bytes: number): string => {
      if (bytes < 1024) {
        return `${bytes} B`;
      } else if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(2)} KB`;
      } else if (bytes < 1024 * 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
      } else {
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
      }
    },

    // 내부 유틸리티 메서드
    calculateDirectorySize: async (directoryHandle: FileSystemDirectoryHandle): Promise<number> => {
      let totalSize = 0;
      
      try {
        // @ts-ignore - FileSystemDirectoryHandle의 entries() 메서드 사용
        for await (const [name, handle] of directoryHandle.entries()) {
          if (handle.kind === 'file') {
            try {
              const file = await handle.getFile();
              totalSize += file.size;
            } catch (error) {
              console.warn(`[REPOSITORY] 파일 크기 계산 실패: ${name}`, error);
            }
          } else if (handle.kind === 'directory') {
            // 재귀적으로 하위 디렉토리 크기 계산
            const subDirSize = await get().calculateDirectorySize(handle);
            totalSize += subDirSize;
          }
        }
      } catch (error) {
        console.error('[REPOSITORY] 디렉토리 크기 계산 실패:', error);
      }
      
      return totalSize;
    },

    // ZIP 형태로 세션 내보내기
    exportSessionAsZip: async (sessionInfo: SessionInfo, targetDirHandle: FileSystemDirectoryHandle): Promise<void> => {
      try {
        console.log(`[REPOSITORY] 📦 ZIP 내보내기 시작: ${sessionInfo.name}`);
        
        // 세션 디렉토리에서 모든 파일 복사
        const sessionDirName = `${sessionInfo.name}_export_${new Date().toISOString().slice(0, 10)}`;
        const exportDirHandle = await targetDirHandle.getDirectoryHandle(sessionDirName, { create: true });
        
        // 메타데이터 파일 생성
        const metadataFileHandle = await exportDirHandle.getFileHandle('session_info.json', { create: true });
        const metadataStream = await metadataFileHandle.createWritable();
        const sessionMetadata = {
          sessionName: sessionInfo.name,
          sessionId: sessionInfo.id,
          exportDate: new Date().toISOString(),
          originalDate: sessionInfo.date,
          originalTime: sessionInfo.time,
          duration: sessionInfo.duration,
          deviceName: sessionInfo.deviceName,
          deviceId: sessionInfo.deviceId,
          totalSize: sessionInfo.size,
          formats: sessionInfo.formats,
          notes: sessionInfo.notes
        };
        await metadataStream.write(JSON.stringify(sessionMetadata, null, 2));
        await metadataStream.close();

        // 원본 세션 파일들 복사
        let fileCount = 0;
        for await (const [fileName, fileHandle] of (sessionInfo.handle as any).entries()) {
          if (fileHandle.kind === 'file') {
            try {
              const sourceFile = await fileHandle.getFile();
              const targetFileHandle = await exportDirHandle.getFileHandle(fileName, { create: true });
              const targetStream = await targetFileHandle.createWritable();
              await targetStream.write(sourceFile);
              await targetStream.close();
              fileCount++;
              console.log(`[REPOSITORY] 📦 파일 복사: ${fileName}`);
            } catch (error) {
              console.warn(`[REPOSITORY] ⚠️ 파일 복사 실패: ${fileName}`, error);
            }
          }
        }

        console.log(`[REPOSITORY] ✅ ZIP 내보내기 완료: ${fileCount}개 파일 복사됨`);
        
      } catch (error) {
        console.error(`[REPOSITORY] ❌ ZIP 내보내기 실패:`, error);
        throw error;
      }
    },

    // 개별 파일 형태로 세션 내보내기
    exportSessionFiles: async (sessionInfo: SessionInfo, targetDirHandle: FileSystemDirectoryHandle, format: string): Promise<void> => {
      try {
        console.log(`[REPOSITORY] 📄 개별 파일 내보내기 시작: ${sessionInfo.name}, 형식: ${format}`);
        
        // 특정 형식의 파일만 필터링하여 복사
        const fileExtension = format.toLowerCase();
        let exportedCount = 0;
        
        for await (const [fileName, fileHandle] of (sessionInfo.handle as any).entries()) {
          if (fileHandle.kind === 'file') {
            const extension = fileName.split('.').pop()?.toLowerCase();
            
            // 요청된 형식과 일치하는 파일만 복사
            if (extension === fileExtension || format === 'all') {
              try {
                const sourceFile = await fileHandle.getFile();
                const exportFileName = `${sessionInfo.name}_${fileName}`;
                const targetFileHandle = await targetDirHandle.getFileHandle(exportFileName, { create: true });
                const targetStream = await targetFileHandle.createWritable();
                await targetStream.write(sourceFile);
                await targetStream.close();
                exportedCount++;
                console.log(`[REPOSITORY] 📄 파일 내보내기: ${exportFileName}`);
              } catch (error) {
                console.warn(`[REPOSITORY] ⚠️ 파일 내보내기 실패: ${fileName}`, error);
              }
            }
          }
        }

        if (exportedCount === 0) {
          throw new Error(`${format} 형식의 파일을 찾을 수 없습니다.`);
        }

        console.log(`[REPOSITORY] ✅ 개별 파일 내보내기 완료: ${exportedCount}개 파일`);
        
      } catch (error) {
        console.error(`[REPOSITORY] ❌ 개별 파일 내보내기 실패:`, error);
        throw error;
      }
    }
  };
}); 