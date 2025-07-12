import { create } from 'zustand';
import type { 
  ProcessedEEGData, 
  BandPowers, 
  BrainStateAnalysis, 
  SignalQuality
} from '../types/eeg';

// 🔧 Visualizer용 실시간 데이터 타입 정의
interface ChannelData {
  timestamp: number;
  value: number;
}

interface RealtimeEEGData {
  channels: {
    FP1: ChannelData[];
    FP2: ChannelData[];
  };
  maxBufferSize: number;
}

interface RealtimePPGData {
  channels: {
    RED: ChannelData[];
    IR: ChannelData[];
  };
  maxBufferSize: number;
}

interface RealtimeACCData {
  channels: {
    X: ChannelData[];
    Y: ChannelData[];
    Z: ChannelData[];
    MAGNITUDE: ChannelData[];
  };
  maxBufferSize: number;
}

interface SQIData {
  timestamp: number;
  value: number;
}

interface EEGSQIData {
  ch1SQI: SQIData[];
  ch2SQI: SQIData[];
  maxBufferSize: number;
}

interface PPGSQIData {
  redSQI: SQIData[];
  irSQI: SQIData[];
  overallSQI: SQIData[];
  maxBufferSize: number;
}

interface PPGIndices {
  heartRate: number;
  rmssd: number;
  sdnn: number;
  pnn50: number;
  lfPower: number;
  hfPower: number;
  lfHfRatio: number;
  stressIndex: number;
  timestamp: number;
}

interface ProcessedACCData {
  avgMovement: number;
  stdMovement: number;
  maxMovement: number;
  activityState: string;
  timestamp: number;
}

/**
 * SensorDataStore - 센서 데이터 세션 관리 및 실시간 데이터 저장
 * 
 * 역할:
 * - 레코딩 세션 관리 (시작/중지/저장)
 * - 데이터 히스토리 관리 (과거 세션 데이터)
 * - 분석 결과 조회 (평균값, 통계 등)
 * - 실시간 EEG/PPG/ACC 분석 결과 저장 (Visualizer용)
 * - SystemStore에서만 호출되는 내부 액션들
 */
interface SensorDataStore {
  // 연결 상태
  isConnected: boolean;
  
  // 세션 상태
  isRecording: boolean;
  sessionStartTime: Date | null;
  sessionDuration: number; // 초
  currentSessionId: string | null;
  
  // 데이터 히스토리 (저장된 세션들)
  dataHistory: ProcessedEEGData[];
  maxHistorySize: number;
  
  // 🔧 실시간 EEG 분석 결과 (Visualizer용)
  currentEEGData: ProcessedEEGData | null;
  currentData: ProcessedEEGData | null; // BandPowersChart 호환성
  eegIndices: {
    focusIndex: number;
    relaxationIndex: number;
    stressIndex: number;
    meditationIndex: number;
    attentionIndex: number;
    totalPower?: number;
    hemisphericBalance?: number;
    cognitiveLoad?: number;
    emotionalStability?: number;
  };
  frequencySpectrum: {
    frequencies: number[];
    power: number[];
    dominantFrequency: number;
  } | null;
  
  // 🔧 실시간 그래프 데이터 (Visualizer용)
  processedEEGData: RealtimeEEGData | null;
  processedPPGData: RealtimePPGData | null;
  realTimeACCData: RealtimeACCData | null;
  
  // 🔧 신호 품질 데이터
  eegSQIData: EEGSQIData | null;
  ppgSQIData: PPGSQIData | null;
  
  // 🔧 PPG 분석 결과
  ppgIndices: PPGIndices | null;
  
  // 🔧 ACC 분석 결과
  processedACCData: ProcessedACCData | null;
  
  // 분석 설정
  samplingRate: number;
  analysisSettings: {
    windowSize: number; // 분석 윈도우 크기 (초)
    overlapRatio: number; // 겹침 비율
    enableFiltering: boolean;
  };
  
  // 내부 액션 (SystemStore에서만 호출)
  startRecording: (sessionId?: string) => void;
  stopRecording: () => void;
  addToHistory: (data: ProcessedEEGData) => void;
  
  // 🔧 연결 상태 업데이트
  setConnectionState: (connected: boolean) => void;
  
  // 🔧 실시간 EEG 분석 결과 업데이트
  updateCurrentEEGData: (data: ProcessedEEGData) => void;
  updateEEGIndices: (indices: Partial<SensorDataStore['eegIndices']>) => void;
  updateFrequencySpectrum: (spectrum: SensorDataStore['frequencySpectrum']) => void;
  
  // 🔧 실시간 그래프 데이터 업데이트
  updateProcessedEEGData: (fp1Data: ChannelData[], fp2Data: ChannelData[]) => void;
  updateProcessedPPGData: (redData: ChannelData[], irData: ChannelData[]) => void;
  updateRealtimeACCData: (xData: ChannelData[], yData: ChannelData[], zData: ChannelData[], magnitudeData: ChannelData[]) => void;
  
  // 🔧 신호 품질 데이터 업데이트
  updateEEGSQI: (ch1SQI: SQIData[], ch2SQI: SQIData[]) => void;
  updatePPGSQI: (redSQI: SQIData[], irSQI: SQIData[], overallSQI: SQIData[]) => void;
  
  // 🔧 PPG 분석 결과 업데이트
  updatePPGIndices: (indices: PPGIndices) => void;
  
  // 🔧 ACC 분석 결과 업데이트
  updateProcessedACCData: (data: ProcessedACCData) => void;
  
  // 설정 관리
  setMaxHistorySize: (size: number) => void;
  setSamplingRate: (rate: number) => void;
  setAnalysisSettings: (settings: Partial<SensorDataStore['analysisSettings']>) => void;
  
  // 데이터 조회 (읽기 전용)
  getAverageData: (timeRange: number) => any | null;
  getSessionData: (sessionId: string) => ProcessedEEGData[] | null;
  getAllSessions: () => ProcessedEEGData[];
  
  // 초기화
  clearData: () => void;
  reset: () => void;
}

const createInitialState = () => ({
  isConnected: false,
  
  isRecording: false,
  sessionStartTime: null,
  sessionDuration: 0,
  currentSessionId: null,
  
  dataHistory: [],
  maxHistorySize: 1000,
  
  // 🔧 실시간 EEG 분석 결과 초기값
  currentEEGData: null,
  currentData: null, // BandPowersChart 호환성
  eegIndices: {
    focusIndex: 0,
    relaxationIndex: 0,
    stressIndex: 0,
    meditationIndex: 0,
    attentionIndex: 0,
    totalPower: 0,
    hemisphericBalance: 0,
    cognitiveLoad: 0,
    emotionalStability: 0
  },
  frequencySpectrum: null,
  
  // 🔧 실시간 그래프 데이터 초기값
  processedEEGData: null,
  processedPPGData: null,
  realTimeACCData: null,
  
  // 🔧 신호 품질 데이터 초기값
  eegSQIData: null,
  ppgSQIData: null,
  
  // 🔧 PPG 분석 결과 초기값
  ppgIndices: null,
  
  // 🔧 ACC 분석 결과 초기값
  processedACCData: null,
  
  samplingRate: 250, // 기본 EEG 샘플링 레이트
  analysisSettings: {
    windowSize: 4, // 4초 윈도우
    overlapRatio: 0.5, // 50% 겹침
    enableFiltering: true
  }
});

export const useSensorDataStore = create<SensorDataStore>((set, get) => ({
  ...createInitialState(),

  // 🔧 연결 상태 업데이트
  setConnectionState: (connected) => set({ isConnected: connected }),

  // 내부 액션들 (SystemStore에서만 사용)
  startRecording: (sessionId) => {
    const id = sessionId || `session_${Date.now()}`;
    set({
      isRecording: true,
      sessionStartTime: new Date(),
      sessionDuration: 0,
      currentSessionId: id
    });
    
    // 세션 시간 업데이트 타이머 시작
    const timer = setInterval(() => {
      const state = get();
      if (state.isRecording && state.sessionStartTime) {
        const duration = Math.floor((Date.now() - state.sessionStartTime.getTime()) / 1000);
        set({ sessionDuration: duration });
      } else {
        clearInterval(timer);
      }
    }, 1000);
  },
  
  stopRecording: () => {
    set({
      isRecording: false,
      sessionStartTime: null,
      sessionDuration: 0,
      currentSessionId: null
    });
  },
  
  addToHistory: (data) => {
    const { maxHistorySize } = get();
    set((state) => ({
      dataHistory: [...state.dataHistory, data].slice(-maxHistorySize)
    }));
  },
  
  // 🔧 실시간 EEG 분석 결과 업데이트 메서드들
  updateCurrentEEGData: (data) => {
    set({ 
      currentEEGData: data,
      currentData: data // BandPowersChart 호환성
    });
    
    // 레코딩 중이면 히스토리에도 추가
    const state = get();
    if (state.isRecording) {
      state.addToHistory(data);
    }
  },
  
  updateEEGIndices: (indices) => {
    set((state) => ({
      eegIndices: {
        ...state.eegIndices,
        ...indices
      }
    }));
  },
  
  updateFrequencySpectrum: (spectrum) => {
    set({ frequencySpectrum: spectrum });
  },
  
  // 🔧 실시간 그래프 데이터 업데이트 메서드들
  updateProcessedEEGData: (fp1Data, fp2Data) => {
    const maxBufferSize = 1000; // 4초 분량 (250Hz 기준)
    
    set({
      processedEEGData: {
        channels: {
          FP1: fp1Data.slice(-maxBufferSize),
          FP2: fp2Data.slice(-maxBufferSize)
        },
        maxBufferSize
      }
    });
  },
  
  updateProcessedPPGData: (redData, irData) => {
    const maxBufferSize = 400; // 8초 분량 (50Hz 기준)
    
    set({
      processedPPGData: {
        channels: {
          RED: redData.slice(-maxBufferSize),
          IR: irData.slice(-maxBufferSize)
        },
        maxBufferSize
      }
    });
  },
  
  updateRealtimeACCData: (xData, yData, zData, magnitudeData) => {
    const maxBufferSize = 500; // 10초 분량 (50Hz 기준)
    
    set({
      realTimeACCData: {
        channels: {
          X: xData.slice(-maxBufferSize),
          Y: yData.slice(-maxBufferSize),
          Z: zData.slice(-maxBufferSize),
          MAGNITUDE: magnitudeData.slice(-maxBufferSize)
        },
        maxBufferSize
      }
    });
  },
  
  // 🔧 신호 품질 데이터 업데이트 메서드들
  updateEEGSQI: (ch1SQI, ch2SQI) => {
    const maxBufferSize = 100; // 최근 100개 SQI 값
    
    set({
      eegSQIData: {
        ch1SQI: ch1SQI.slice(-maxBufferSize),
        ch2SQI: ch2SQI.slice(-maxBufferSize),
        maxBufferSize
      }
    });
  },
  
  updatePPGSQI: (redSQI, irSQI, overallSQI) => {
    const maxBufferSize = 100; // 최근 100개 SQI 값
    
    set({
      ppgSQIData: {
        redSQI: redSQI.slice(-maxBufferSize),
        irSQI: irSQI.slice(-maxBufferSize),
        overallSQI: overallSQI.slice(-maxBufferSize),
        maxBufferSize
      }
    });
  },
  
  // 🔧 PPG 분석 결과 업데이트
  updatePPGIndices: (indices) => {
    set({ ppgIndices: indices });
  },
  
  // 🔧 ACC 분석 결과 업데이트
  updateProcessedACCData: (data) => {
    set({ processedACCData: data });
  },
  
  // 설정 관리
  setMaxHistorySize: (maxHistorySize) => set({ maxHistorySize }),
  
  setSamplingRate: (samplingRate) => set({ samplingRate }),
  
  setAnalysisSettings: (settings) => {
    set((state) => ({
      analysisSettings: {
        ...state.analysisSettings,
        ...settings
      }
    }));
  },
  
  // 데이터 조회 (읽기 전용) - 임시 단순화
  getAverageData: (timeRange) => {
    const { dataHistory } = get();
    if (dataHistory.length === 0) return null;
    
    // 임시로 첫 번째 데이터 반환 (타입 문제 해결을 위해)
    return dataHistory[0] || null;
  },
  
  getSessionData: (sessionId) => {
    const { dataHistory } = get();
    return dataHistory.filter(d => (d as any).sessionId === sessionId);
  },
  
  getAllSessions: () => {
    return get().dataHistory;
  },
  
  clearData: () => {
    set({
      dataHistory: [],
      sessionDuration: 0,
      processedEEGData: null,
      processedPPGData: null,
      realTimeACCData: null,
      eegSQIData: null,
      ppgSQIData: null,
      ppgIndices: null,
      processedACCData: null
    });
  },
  
  reset: () => set(createInitialState())
}));

// UI Hook 함수들
export const useRecordingState = () => useSensorDataStore(state => ({
  isRecording: state.isRecording,
  sessionStartTime: state.sessionStartTime,
  sessionDuration: state.sessionDuration,
  currentSessionId: state.currentSessionId
}));

export const useDataHistory = () => useSensorDataStore(state => state.dataHistory);
export const useAnalysisSettings = () => useSensorDataStore(state => state.analysisSettings);
export const useSamplingRate = () => useSensorDataStore(state => state.samplingRate);

// 🔧 실시간 EEG 분석 결과 조회 Hook들 (Visualizer용)
export const useCurrentEEGData = () => useSensorDataStore(state => state.currentEEGData);
export const useEEGIndices = () => useSensorDataStore(state => state.eegIndices);
export const useFrequencySpectrum = () => useSensorDataStore(state => state.frequencySpectrum);

// 🔧 실시간 그래프 데이터 조회 Hook들 (Visualizer용)
export const useProcessedEEGData = () => useSensorDataStore(state => state.processedEEGData);
export const useProcessedPPGData = () => useSensorDataStore(state => state.processedPPGData);
export const useRealtimeACCData = () => useSensorDataStore(state => state.realTimeACCData);

// 🔧 신호 품질 데이터 조회 Hook들 (Visualizer용)
export const useEEGSQIData = () => useSensorDataStore(state => state.eegSQIData);
export const usePPGSQIData = () => useSensorDataStore(state => state.ppgSQIData);

// 🔧 PPG 분석 결과 조회 Hook (Visualizer용)
export const usePPGIndices = () => useSensorDataStore(state => state.ppgIndices);

// 🔧 ACC 분석 결과 조회 Hook (Visualizer용)
export const useProcessedACCData = () => useSensorDataStore(state => state.processedACCData);

// 🔧 연결 상태 조회 Hook (Visualizer용)
export const useConnectionState = () => useSensorDataStore(state => state.isConnected);

// 분석 결과 조회 Hook들
export const useAverageData = (timeRange: number = 60) => 
  useSensorDataStore(state => state.getAverageData(timeRange));
export const useSessionData = (sessionId: string) => 
  useSensorDataStore(state => state.getSessionData(sessionId));
export const useAllSessions = () => 
  useSensorDataStore(state => state.getAllSessions()); 