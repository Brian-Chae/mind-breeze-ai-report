import { create } from 'zustand';
import { SimpleCircularBuffer, EEGDataPoint, PPGDataPoint, ACCDataPoint } from '../utils/SimpleCircularBuffer';

/**
 * RawDataStore - 원시 데이터 버퍼 관리 전용 스토어
 * 
 * 역할:
 * - EEG/PPG/ACC 원시 데이터 CircularBuffer 관리
 * - 실시간 데이터 추가 및 조회
 * - 버퍼 크기 및 상태 관리
 * - SystemStore에서만 호출되는 내부 액션들
 */
interface RawDataStore {
  // 원시 데이터 버퍼
  eegBuffer: SimpleCircularBuffer<EEGDataPoint>;
  ppgBuffer: SimpleCircularBuffer<PPGDataPoint>;
  accBuffer: SimpleCircularBuffer<ACCDataPoint>;
  
  // 버퍼 상태
  bufferSizes: {
    eeg: number;
    ppg: number;
    acc: number;
  };
  
  // 데이터 통계
  dataStats: {
    eegSamplesReceived: number;
    ppgSamplesReceived: number;
    accSamplesReceived: number;
    lastEEGTimestamp: number | null;
    lastPPGTimestamp: number | null;
    lastACCTimestamp: number | null;
  };
  
  // 내부 액션 (SystemStore에서만 호출)
  addEEGData: (data: EEGDataPoint[]) => void;
  addPPGData: (data: PPGDataPoint[]) => void;
  addACCData: (data: ACCDataPoint[]) => void;
  
  // 버퍼 관리
  clearBuffers: () => void;
  resizeBuffers: (sizes: { eeg?: number; ppg?: number; acc?: number }) => void;
  
  // 데이터 조회 (읽기 전용)
  getEEGData: (count?: number) => EEGDataPoint[];
  getPPGData: (count?: number) => PPGDataPoint[];
  getACCData: (count?: number) => ACCDataPoint[];
  
  // 초기화
  reset: () => void;
}

// 기본 버퍼 크기 설정
const DEFAULT_BUFFER_SIZES = {
  eeg: 5000,  // 20초 분량 (250Hz)
  ppg: 2500,  // 50초 분량 (50Hz)  
  acc: 1500   // 50초 분량 (30Hz)
};

const createInitialState = () => ({
  eegBuffer: new SimpleCircularBuffer<EEGDataPoint>(DEFAULT_BUFFER_SIZES.eeg),
  ppgBuffer: new SimpleCircularBuffer<PPGDataPoint>(DEFAULT_BUFFER_SIZES.ppg),
  accBuffer: new SimpleCircularBuffer<ACCDataPoint>(DEFAULT_BUFFER_SIZES.acc),
  
  bufferSizes: { ...DEFAULT_BUFFER_SIZES },
  
  dataStats: {
    eegSamplesReceived: 0,
    ppgSamplesReceived: 0,
    accSamplesReceived: 0,
    lastEEGTimestamp: null,
    lastPPGTimestamp: null,
    lastACCTimestamp: null
  }
});

export const useRawDataStore = create<RawDataStore>((set, get) => ({
  ...createInitialState(),

  // 내부 액션들 (SystemStore에서만 사용)
  addEEGData: (data) => {
    const state = get();
    data.forEach((point: EEGDataPoint) => state.eegBuffer.push(point));
    
    set((state) => ({
      dataStats: {
        ...state.dataStats,
        eegSamplesReceived: state.dataStats.eegSamplesReceived + data.length,
        lastEEGTimestamp: data.length > 0 ? data[data.length - 1].timestamp : state.dataStats.lastEEGTimestamp
      }
    }));
  },
  
  addPPGData: (data) => {
    const state = get();
    data.forEach((point: PPGDataPoint) => state.ppgBuffer.push(point));
    
    set((state) => ({
      dataStats: {
        ...state.dataStats,
        ppgSamplesReceived: state.dataStats.ppgSamplesReceived + data.length,
        lastPPGTimestamp: data.length > 0 ? data[data.length - 1].timestamp : state.dataStats.lastPPGTimestamp
      }
    }));
  },
  
  addACCData: (data) => {
    const state = get();
    data.forEach((point: ACCDataPoint) => state.accBuffer.push(point));
    
    set((state) => ({
      dataStats: {
        ...state.dataStats,
        accSamplesReceived: state.dataStats.accSamplesReceived + data.length,
        lastACCTimestamp: data.length > 0 ? data[data.length - 1].timestamp : state.dataStats.lastACCTimestamp
      }
    }));
  },
  
  // 버퍼 관리
  clearBuffers: () => {
    const state = get();
    state.eegBuffer.clear();
    state.ppgBuffer.clear();
    state.accBuffer.clear();
    
    set((state) => ({
      dataStats: {
        ...state.dataStats,
        eegSamplesReceived: 0,
        ppgSamplesReceived: 0,
        accSamplesReceived: 0
      }
    }));
  },
  
  resizeBuffers: (sizes) => {
    const currentState = get();
    const newState: any = {};
    
    if (sizes.eeg && sizes.eeg !== currentState.bufferSizes.eeg) {
      const oldData = currentState.eegBuffer.toArray();
      newState.eegBuffer = new SimpleCircularBuffer<EEGDataPoint>(sizes.eeg);
      oldData.slice(-sizes.eeg).forEach((point: EEGDataPoint) => newState.eegBuffer.push(point));
      newState.bufferSizes = { ...currentState.bufferSizes, eeg: sizes.eeg };
    }
    
    if (sizes.ppg && sizes.ppg !== currentState.bufferSizes.ppg) {
      const oldData = currentState.ppgBuffer.toArray();
      newState.ppgBuffer = new SimpleCircularBuffer<PPGDataPoint>(sizes.ppg);
      oldData.slice(-sizes.ppg).forEach((point: PPGDataPoint) => newState.ppgBuffer.push(point));
      newState.bufferSizes = { ...currentState.bufferSizes, ppg: sizes.ppg };
    }
    
    if (sizes.acc && sizes.acc !== currentState.bufferSizes.acc) {
      const oldData = currentState.accBuffer.toArray();
      newState.accBuffer = new SimpleCircularBuffer<ACCDataPoint>(sizes.acc);
      oldData.slice(-sizes.acc).forEach((point: ACCDataPoint) => newState.accBuffer.push(point));
      newState.bufferSizes = { ...currentState.bufferSizes, acc: sizes.acc };
    }
    
    if (Object.keys(newState).length > 0) {
      set(newState);
    }
  },
  
  // 데이터 조회 (읽기 전용)
  getEEGData: (count) => {
    const buffer = get().eegBuffer;
    return count ? buffer.getLatest(count) : buffer.toArray();
  },
  
  getPPGData: (count) => {
    const buffer = get().ppgBuffer;
    return count ? buffer.getLatest(count) : buffer.toArray();
  },
  
  getACCData: (count) => {
    const buffer = get().accBuffer;
    return count ? buffer.getLatest(count) : buffer.toArray();
  },
  
  reset: () => set(createInitialState())
}));

// UI Hook 함수들
export const useEEGBuffer = () => useRawDataStore(state => state.eegBuffer);
export const usePPGBuffer = () => useRawDataStore(state => state.ppgBuffer);
export const useACCBuffer = () => useRawDataStore(state => state.accBuffer);
export const useDataStats = () => useRawDataStore(state => state.dataStats);
export const useBufferSizes = () => useRawDataStore(state => state.bufferSizes);

// 실시간 데이터 조회 Hook들
export const useLatestEEGData = (count: number = 1000) => 
  useRawDataStore(state => state.getEEGData(count));
export const useLatestPPGData = (count: number = 500) => 
  useRawDataStore(state => state.getPPGData(count));
export const useLatestACCData = (count: number = 300) => 
  useRawDataStore(state => state.getACCData(count)); 