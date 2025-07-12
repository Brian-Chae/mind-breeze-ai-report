import { create } from 'zustand';
import type { 
  ProcessedEEGData, 
  BandPowers, 
  BrainStateAnalysis, 
  SignalQuality,
  RealTimeEEGData,
  ChartDataPoint,
  FrequencySpectrumData
} from '../types/eeg';
import { IntegratedDataService } from '../services/IntegratedDataService';
import type { EEGDataPoint, PPGDataPoint, ACCDataPoint } from '../utils/SimpleCircularBuffer';

interface EEGDataStore {
  // 상태
  currentData: ProcessedEEGData | null;
  realTimeData: RealTimeEEGData;
  frequencySpectrum: FrequencySpectrumData | null;
  isRecording: boolean;
  sessionStartTime: Date | null;
  dataHistory: ProcessedEEGData[];
  maxHistorySize: number;
  samplingRate: number;
  
  // Phase 1: 제거됨 - StreamProcessor 사용
  isConnected: boolean;
  isStreaming: boolean;
  
  // 액션
  updateCurrentData: (data: ProcessedEEGData) => void;
  addRealTimePoint: (channel: string, point: ChartDataPoint) => void;
  updateFrequencySpectrum: (spectrum: FrequencySpectrumData) => void;
  startRecording: () => void;
  stopRecording: () => void;
  clearData: () => void;
  setMaxHistorySize: (size: number) => void;
  setSamplingRate: (rate: number) => void;
  getAverageData: (timeRange: number) => {
    bandPowers: BandPowers;
    brainState: BrainStateAnalysis;
    signalQuality: SignalQuality;
  } | null;
  
  // Phase 1: 제거됨 - StreamProcessor 사용
  updateRealTimeEEGData: (data: EEGDataPoint[]) => void;
}

const initialRealTimeData: RealTimeEEGData = {
  channels: {
    'FP1': [],  // LINK BAND 전전두엽 좌측 채널
    'FP2': []   // LINK BAND 전전두엽 우측 채널
  },
  maxPoints: 1250 // 약 5초 분량 (250Hz 기준)
};

export const useEEGDataStore = create<EEGDataStore>((set, get) => ({
  // 초기 상태
  currentData: null,
  realTimeData: initialRealTimeData,
  frequencySpectrum: null,
  isRecording: false,
  sessionStartTime: null,
  dataHistory: [],
  maxHistorySize: 3600, // 1시간 분량 (1초당 1개 데이터 기준)
  samplingRate: 250, // Phase 1: LINK BAND 기본 샘플링 레이트
  
  // Phase 1: 제거됨 - StreamProcessor 사용
  isConnected: false,
  isStreaming: false,

  // 액션
  updateCurrentData: (data) => set((state) => {
    const newHistory = [...state.dataHistory, data];
    
    // 최대 히스토리 크기 유지
    if (newHistory.length > state.maxHistorySize) {
      newHistory.shift();
    }

    return {
      currentData: data,
      dataHistory: newHistory
    };
  }),

  addRealTimePoint: (channel, point) => set((state) => {
    const channelData = [...(state.realTimeData.channels[channel] || []), point];
    
    // 최대 포인트 수 유지
    if (channelData.length > state.realTimeData.maxPoints) {
      channelData.shift();
    }

    return {
      realTimeData: {
        ...state.realTimeData,
        channels: {
          ...state.realTimeData.channels,
          [channel]: channelData
        }
      }
    };
  }),

  updateFrequencySpectrum: (spectrum) => set({ frequencySpectrum: spectrum }),

  startRecording: () => set({ 
    isRecording: true, 
    sessionStartTime: new Date(),
    dataHistory: [] // 새 세션 시작 시 히스토리 초기화
  }),

  stopRecording: () => set({ isRecording: false }),

  clearData: () => set({
    currentData: null,
    realTimeData: initialRealTimeData,
    frequencySpectrum: null,
    dataHistory: [],
    sessionStartTime: null
  }),

  setMaxHistorySize: (maxHistorySize) => set((state) => {
    const newHistory = [...state.dataHistory];
    
    // 새로운 크기에 맞게 히스토리 조정
    if (newHistory.length > maxHistorySize) {
      newHistory.splice(0, newHistory.length - maxHistorySize);
    }
    
    return {
      maxHistorySize,
      dataHistory: newHistory
    };
  }),

  setSamplingRate: (rate) => set({ samplingRate: rate }),

  getAverageData: (timeRange) => {
    const { dataHistory } = get();
    const now = Date.now();
    const cutoffTime = now - (timeRange * 1000); // timeRange는 초 단위
    
    const recentData = dataHistory.filter(data => data.timestamp >= cutoffTime);
    
    if (recentData.length === 0) return null;

    // 평균 계산
    const avgBandPowers: BandPowers = {
      delta: recentData.reduce((sum, data) => sum + data.bandPowers.delta, 0) / recentData.length,
      theta: recentData.reduce((sum, data) => sum + data.bandPowers.theta, 0) / recentData.length,
      alpha: recentData.reduce((sum, data) => sum + data.bandPowers.alpha, 0) / recentData.length,
      beta: recentData.reduce((sum, data) => sum + data.bandPowers.beta, 0) / recentData.length,
      gamma: recentData.reduce((sum, data) => sum + data.bandPowers.gamma, 0) / recentData.length
    };

    const avgSignalQuality: SignalQuality = {
      overall: recentData.reduce((sum, data) => sum + data.signalQuality.overall, 0) / recentData.length,
      channels: recentData[0].signalQuality.channels.map((_, index) =>
        recentData.reduce((sum, data) => sum + data.signalQuality.channels[index], 0) / recentData.length
      ),
      artifacts: {
        movement: recentData.some(data => data.signalQuality.artifacts.movement),
        eyeBlink: recentData.some(data => data.signalQuality.artifacts.eyeBlink),
        muscleNoise: recentData.some(data => data.signalQuality.artifacts.muscleNoise)
      }
    };

    // 가장 최근의 뇌파 상태 분석 (평균보다는 최신 상태가 더 의미있음)
    const latestBrainState = recentData[recentData.length - 1].brainState;

    return {
      bandPowers: avgBandPowers,
      signalQuality: avgSignalQuality,
      brainState: latestBrainState
    };
  },

  updateRealTimeEEGData: (data: EEGDataPoint[]) => set((state) => {
    const newRealTimeData = { ...state.realTimeData };
    
    // EEG 데이터를 채널별로 분리하여 차트 데이터 형식으로 변환
    data.forEach(point => {
      // FP1, FP2 채널 데이터 추출
      const fp1Point: ChartDataPoint = {
        timestamp: point.timestamp,
        value: point.fp1
      };
      const fp2Point: ChartDataPoint = {
        timestamp: point.timestamp,
        value: point.fp2
      };
      
      // 버퍼에 추가
      newRealTimeData.channels['FP1'] = [...(newRealTimeData.channels['FP1'] || []), fp1Point];
      newRealTimeData.channels['FP2'] = [...(newRealTimeData.channels['FP2'] || []), fp2Point];
      
      // 최대 포인트 수 유지
      if (newRealTimeData.channels['FP1'].length > newRealTimeData.maxPoints) {
        newRealTimeData.channels['FP1'].shift();
      }
      if (newRealTimeData.channels['FP2'].length > newRealTimeData.maxPoints) {
        newRealTimeData.channels['FP2'].shift();
      }
    });
    
    return { realTimeData: newRealTimeData };
  })
})); 