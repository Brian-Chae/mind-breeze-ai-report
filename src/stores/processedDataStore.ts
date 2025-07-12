import { create } from 'zustand';

/**
 * ProcessedDataStore - 처리된 분석 데이터 관리 전용 스토어
 * 
 * 역할:
 * - 그래프 표시용 처리된 데이터 관리
 * - 신호 품질 및 분석 결과 관리
 * - 실시간 차트 업데이트 데이터 관리
 * - Visualizer용 추가 분석 결과 관리
 * - SystemStore에서만 호출되는 내부 액션들
 */

// 그래프 데이터 포인트 타입
export interface GraphDataPoint {
  timestamp: number;
  value: number;
}

// 신호 품질 분석 결과
export interface SignalQualityAnalysis {
  overall: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
  eegQuality: number; // 0-100
  ppgQuality: number; // 0-100
  noiseLevel: number; // 0-100
  artifactDetection: {
    eyeBlink: boolean;
    movement: boolean;
    powerLine: boolean;
  };
  lastUpdated: number;
}

// 실시간 분석 결과
export interface RealtimeAnalysis {
  heartRate: number | null;
  hrv: number | null; // Heart Rate Variability
  stressLevel: number | null; // 0-100
  focusLevel: number | null; // 0-100
  relaxationLevel: number | null; // 0-100
  lastUpdated: number;
}

// 디바이스 상태 정보
export interface DeviceStatus {
  batteryLevel: number | null;
  connectionDuration: number; // 초
  isSensorContacted: boolean;
  lastBatteryUpdate: number | null;
  errors: string[];
}

// 🔧 EEG 분석 결과 (Visualizer용)
export interface EEGAnalysisResult {
  bandPowers: {
    delta: number;
    theta: number;
    alpha: number;
    beta: number;
    gamma: number;
  } | null;
  brainState: {
    attention: number;
    meditation: number;
    relaxation: number;
    focus: number;
    stress: number;
  } | null;
  indices: {
    focusIndex: number;
    relaxationIndex: number;
    stressIndex: number;
    meditationIndex: number;
    attentionIndex: number;
    totalPower: number;
    hemisphericBalance: number;
    cognitiveLoad: number;
    emotionalStability: number;
  } | null;
  frequencySpectrum: {
    frequencies: number[];
    ch1Power: number[];
    ch2Power: number[];
    dominantFrequency: number;
  } | null;
  lastUpdated: number;
}

// 🔧 PPG 분석 결과 (Visualizer용)
export interface PPGAnalysisResult {
  indices: {
    heartRate: number;
    rmssd: number;
    sdnn: number;
    pnn50: number;
    lfPower: number;
    hfPower: number;
    lfHfRatio: number;
    stressIndex: number;
    spo2: number;
  } | null;
  sqi: {
    redSQI: GraphDataPoint[];
    irSQI: GraphDataPoint[];
    overallSQI: GraphDataPoint[];
  };
  lastUpdated: number;
}

// 🔧 ACC 분석 결과 (Visualizer용)
export interface ACCAnalysisResult {
  magnitude: GraphDataPoint[];
  indices: {
    activity: number;
    stability: number;
    intensity: number;
    balance: number;
    activityState: string;
    avgMovement: number;
    stdMovement: number;
    maxMovement: number;
  } | null;
  lastUpdated: number;
  // 🔧 ACC 원시 버퍼 데이터 추가
  rawBufferData: any[];
}

// 🔧 신호 품질 지수 (SQI) 데이터
export interface SQIData {
  eegSQI: {
    ch1SQI: GraphDataPoint[];
    ch2SQI: GraphDataPoint[];
  };
  ppgSQI: {
    redSQI: GraphDataPoint[];
    irSQI: GraphDataPoint[];
    overallSQI: GraphDataPoint[];
  };
  lastUpdated: number;
}

// Moving Average 데이터 인터페이스
export interface MovingAverageData {
  eegMovingAverage: {
    history: {
      totalPower: number[];
      focusIndex: number[];
      relaxationIndex: number[];
      stressIndex: number[];
      hemisphericBalance: number[];
      cognitiveLoad: number[];
      emotionalStability: number[];
      attentionLevel: number[];
      meditationLevel: number[];
    };
    stabilizedValues: {
      totalPower: number;
      focusIndex: number;
      relaxationIndex: number;
      stressIndex: number;
      hemisphericBalance: number;
      cognitiveLoad: number;
      emotionalStability: number;
      attentionLevel: number;
      meditationLevel: number;
    };
    lastUpdated: number;
  };
  ppgMovingAverage: {
    history: {
      heartRate: number[];
      rmssd: number[];
      sdnn: number[];
      pnn50: number[];
      lfPower: number[];
      hfPower: number[];
      lfHfRatio: number[];
      stressIndex: number[];
      spo2: number[];
      // 새로운 HRV 지표들 추가
      avnn: number[];
      pnn20: number[];
      sdsd: number[];
      hrMax: number[];
      hrMin: number[];
    };
    stabilizedValues: {
      heartRate: number;
      rmssd: number;
      sdnn: number;
      pnn50: number;
      lfPower: number;
      hfPower: number;
      lfHfRatio: number;
      stressIndex: number;
      spo2: number;
      // 새로운 HRV 지표들 추가
      avnn: number;
      pnn20: number;
      sdsd: number;
      hrMax: number;
      hrMin: number;
    };
    lastUpdated: number;
  };
}

interface ProcessedDataStore {
  // 기본 그래프 데이터
  eegGraphData: {
    fp1: GraphDataPoint[];
    fp2: GraphDataPoint[];
  };
  ppgGraphData: {
    red: GraphDataPoint[];
    ir: GraphDataPoint[];
  };
  accGraphData: {
    x: GraphDataPoint[];
    y: GraphDataPoint[];
    z: GraphDataPoint[];
  };
  
  // 기본 분석 결과
  signalQuality: SignalQualityAnalysis;
  realtimeAnalysis: RealtimeAnalysis;
  deviceStatus: DeviceStatus;
  
  // 🔧 추가 분석 결과 (Visualizer용)
  eegAnalysis: EEGAnalysisResult;
  ppgAnalysis: PPGAnalysisResult;
  accAnalysis: ACCAnalysisResult;
  sqiData: SQIData;
  
  // Moving Average 데이터
  movingAverageData: MovingAverageData;
  
  // 연결 상태
  isConnected: boolean;
  
  // 그래프 설정
  graphSettings: {
    maxDataPoints: number;
    timeWindow: number; // 초
    autoScale: boolean;
  };
  
  // 기본 내부 액션 (SystemStore에서만 호출)
  updateEEGGraphData: (fp1: GraphDataPoint[], fp2: GraphDataPoint[]) => void;
  updatePPGGraphData: (red: GraphDataPoint[], ir: GraphDataPoint[]) => void;
  updateACCGraphData: (x: GraphDataPoint[], y: GraphDataPoint[], z: GraphDataPoint[]) => void;
  
  updateSignalQuality: (quality: Partial<SignalQualityAnalysis>) => void;
  updateRealtimeAnalysis: (analysis: Partial<RealtimeAnalysis>) => void;
  updateDeviceStatus: (status: Partial<DeviceStatus>) => void;
  
  // 🔧 추가 분석 결과 업데이트 액션 (Visualizer용)
  updateEEGAnalysis: (analysis: Partial<EEGAnalysisResult>) => void;
  updatePPGAnalysis: (analysis: Partial<PPGAnalysisResult>) => void;
  updateACCAnalysis: (analysis: Partial<ACCAnalysisResult>) => void;
  updateEEGSQI: (eegSQI: Partial<SQIData['eegSQI']>) => void;
  updatePPGSQI: (ppgSQI: Partial<SQIData['ppgSQI']>) => void;
  
  // Moving Average 업데이트 액션
  updateEEGMovingAverage: (eegIndices: any, sqiQuality: boolean) => void;
  updatePPGMovingAverage: (ppgIndices: any, sqiQuality: boolean) => void;
  
  // 연결 상태 업데이트
  setConnectionState: (connected: boolean) => void;
  
  // 그래프 설정 관리
  setGraphSettings: (settings: Partial<ProcessedDataStore['graphSettings']>) => void;
  
  // 에러 관리
  addError: (error: string) => void;
  clearErrors: () => void;
  
  // 초기화
  reset: () => void;
}

const createInitialState = () => ({
  eegGraphData: {
    fp1: [],
    fp2: []
  },
  ppgGraphData: {
    red: [],
    ir: []
  },
  accGraphData: {
    x: [],
    y: [],
    z: []
  },
  
  signalQuality: {
    overall: 'unknown' as const,
    eegQuality: 0,
    ppgQuality: 0,
    noiseLevel: 0,
    artifactDetection: {
      eyeBlink: false,
      movement: false,
      powerLine: false
    },
    lastUpdated: 0
  },
  
  realtimeAnalysis: {
    heartRate: null,
    hrv: null,
    stressLevel: null,
    focusLevel: null,
    relaxationLevel: null,
    lastUpdated: 0
  },
  
  deviceStatus: {
    batteryLevel: null,
    connectionDuration: 0,
    isSensorContacted: false,
    lastBatteryUpdate: null,
    errors: []
  },
  
  // 🔧 추가 분석 결과 초기값
  eegAnalysis: {
    bandPowers: null,
    brainState: null,
    indices: null,
    frequencySpectrum: null,
    lastUpdated: 0
  },
  
  ppgAnalysis: {
    indices: null,
    sqi: {
      redSQI: [],
      irSQI: [],
      overallSQI: []
    },
    lastUpdated: 0
  },
  
  accAnalysis: {
    magnitude: [],
    indices: null,
    lastUpdated: 0,
    // 🔧 ACC 원시 버퍼 데이터 초기화
    rawBufferData: []
  },
  
  sqiData: {
    eegSQI: {
      ch1SQI: [],
      ch2SQI: []
    },
    ppgSQI: {
      redSQI: [],
      irSQI: [],
      overallSQI: []
    },
    lastUpdated: 0
  },
  
  movingAverageData: {
    eegMovingAverage: {
      history: {
        totalPower: [],
        focusIndex: [],
        relaxationIndex: [],
        stressIndex: [],
        hemisphericBalance: [],
        cognitiveLoad: [],
        emotionalStability: [],
        attentionLevel: [],
        meditationLevel: []
      },
      stabilizedValues: {
        totalPower: 0,
        focusIndex: 0,
        relaxationIndex: 0,
        stressIndex: 0,
        hemisphericBalance: 0,
        cognitiveLoad: 0,
        emotionalStability: 0,
        attentionLevel: 0,
        meditationLevel: 0
      },
      lastUpdated: 0
    },
    ppgMovingAverage: {
      history: {
        heartRate: [],
        rmssd: [],
        sdnn: [],
        pnn50: [],
        lfPower: [],
        hfPower: [],
        lfHfRatio: [],
        stressIndex: [],
        spo2: [],
        // 새로운 HRV 지표들 초기화
        avnn: [],
        pnn20: [],
        sdsd: [],
        hrMax: [],
        hrMin: []
      },
      stabilizedValues: {
        heartRate: 0,
        rmssd: 0,
        sdnn: 0,
        pnn50: 0,
        lfPower: 0,
        hfPower: 0,
        lfHfRatio: 0,
        stressIndex: 0,
        spo2: 0,
        // 새로운 HRV 지표들 초기화
        avnn: 0,
        pnn20: 0,
        sdsd: 0,
        hrMax: 0,
        hrMin: 0
      },
      lastUpdated: 0
    }
  },
  
  isConnected: false,
  
  graphSettings: {
    maxDataPoints: 1000,
    timeWindow: 10, // 10초
    autoScale: true
  }
});

export const useProcessedDataStore = create<ProcessedDataStore>((set, get) => ({
  ...createInitialState(),

  // 연결 상태 업데이트
  setConnectionState: (connected) => set({ isConnected: connected }),

  // 기본 내부 액션들 (SystemStore에서만 사용)
  updateEEGGraphData: (fp1, fp2) => {
    const { maxDataPoints } = get().graphSettings;
    
    set((state) => ({
      eegGraphData: {
        fp1: [...state.eegGraphData.fp1, ...fp1].slice(-maxDataPoints),
        fp2: [...state.eegGraphData.fp2, ...fp2].slice(-maxDataPoints)
      }
    }));
  },
  
  updatePPGGraphData: (red, ir) => {
    const { maxDataPoints } = get().graphSettings;
    
    set((state) => ({
      ppgGraphData: {
        red: [...state.ppgGraphData.red, ...red].slice(-maxDataPoints),
        ir: [...state.ppgGraphData.ir, ...ir].slice(-maxDataPoints)
      }
    }));
  },
  
  updateACCGraphData: (x, y, z) => {
    const { maxDataPoints } = get().graphSettings;
    
    set((state) => ({
      accGraphData: {
        x: [...state.accGraphData.x, ...x].slice(-maxDataPoints),
        y: [...state.accGraphData.y, ...y].slice(-maxDataPoints),
        z: [...state.accGraphData.z, ...z].slice(-maxDataPoints)
      }
    }));
  },
  
  updateSignalQuality: (quality) => {
    set((state) => ({
      signalQuality: {
        ...state.signalQuality,
        ...quality,
        lastUpdated: Date.now()
      }
    }));
  },
  
  updateRealtimeAnalysis: (analysis) => {
    set((state) => ({
      realtimeAnalysis: {
        ...state.realtimeAnalysis,
        ...analysis,
        lastUpdated: Date.now()
      }
    }));
  },
  
  updateDeviceStatus: (status) => {
    set((state) => ({
      deviceStatus: {
        ...state.deviceStatus,
        ...status
      }
    }));
  },
  
  // 🔧 추가 분석 결과 업데이트 액션들
  updateEEGAnalysis: (analysis) => {
    set((state) => ({
      eegAnalysis: {
        ...state.eegAnalysis,
        ...analysis,
        lastUpdated: Date.now()
      }
    }));
  },
  
  updatePPGAnalysis: (analysis) => {
    try {
      set((state) => ({
        ppgAnalysis: {
          ...state.ppgAnalysis,
          ...analysis,
          lastUpdated: Date.now()
        }
      }));
    } catch (error) {
      // 에러 발생 시에도 기본값으로 업데이트 시도
      try {
        set((state) => ({
          ppgAnalysis: {
            ...state.ppgAnalysis,
            lastUpdated: Date.now()
          }
        }));
      } catch (fallbackError) {
        // 에러 복구 실패 시에도 무시하고 계속 진행
      }
    }
  },
  
  updateACCAnalysis: (analysis) => {
    set((state) => ({
      accAnalysis: {
        ...state.accAnalysis,
        ...analysis,
        lastUpdated: Date.now()
      }
    }));
  },
  
  updateEEGSQI: (eegSQI) => {
    const { maxDataPoints } = get().graphSettings;
    
    set((state) => ({
      sqiData: {
        ...state.sqiData,
        eegSQI: {
          ...state.sqiData.eegSQI,
          ...eegSQI,
          ch1SQI: eegSQI.ch1SQI ? [...state.sqiData.eegSQI.ch1SQI, ...eegSQI.ch1SQI].slice(-maxDataPoints) : state.sqiData.eegSQI.ch1SQI,
          ch2SQI: eegSQI.ch2SQI ? [...state.sqiData.eegSQI.ch2SQI, ...eegSQI.ch2SQI].slice(-maxDataPoints) : state.sqiData.eegSQI.ch2SQI
        },
        lastUpdated: Date.now()
      }
    }));
  },
  
  updatePPGSQI: (ppgSQI) => {
    const { maxDataPoints } = get().graphSettings;
    
    set((state) => ({
      sqiData: {
        ...state.sqiData,
        ppgSQI: {
          ...state.sqiData.ppgSQI,
          ...ppgSQI,
          // 🔧 PPG SQI는 StreamProcessor에서 완전한 데이터셋을 보내므로 교체 방식 사용
          redSQI: ppgSQI.redSQI ? ppgSQI.redSQI : state.sqiData.ppgSQI.redSQI,
          irSQI: ppgSQI.irSQI ? ppgSQI.irSQI : state.sqiData.ppgSQI.irSQI,
          overallSQI: ppgSQI.overallSQI ? ppgSQI.overallSQI : state.sqiData.ppgSQI.overallSQI
        },
        lastUpdated: Date.now()
      }
    }));
  },
  
  setGraphSettings: (settings) => {
    set((state) => ({
      graphSettings: {
        ...state.graphSettings,
        ...settings
      }
    }));
  },
  
  addError: (error) => {
    set((state) => ({
      deviceStatus: {
        ...state.deviceStatus,
        errors: [...state.deviceStatus.errors.slice(-9), error] // 최대 10개 에러 유지
      }
    }));
  },
  
  clearErrors: () => {
    set((state) => ({
      deviceStatus: {
        ...state.deviceStatus,
        errors: []
      }
    }));
  },
  
  // Moving Average 업데이트 액션들
  updateEEGMovingAverage: (eegIndices, sqiQuality) => {
    if (!eegIndices || !sqiQuality) return;
    
    const MAX_HISTORY = 120; // 2분간 데이터 (30Hz 기준)
    
    set((state) => {
      const currentHistory = state.movingAverageData.eegMovingAverage.history;
      
      // 새로운 히스토리 데이터 추가
      const newHistory = {
        totalPower: [...currentHistory.totalPower, eegIndices.totalPower].slice(-MAX_HISTORY),
        focusIndex: [...currentHistory.focusIndex, eegIndices.focusIndex].slice(-MAX_HISTORY),
        relaxationIndex: [...currentHistory.relaxationIndex, eegIndices.relaxationIndex].slice(-MAX_HISTORY),
        stressIndex: [...currentHistory.stressIndex, eegIndices.stressIndex].slice(-MAX_HISTORY),
        hemisphericBalance: [...currentHistory.hemisphericBalance, eegIndices.hemisphericBalance].slice(-MAX_HISTORY),
        cognitiveLoad: [...currentHistory.cognitiveLoad, eegIndices.cognitiveLoad].slice(-MAX_HISTORY),
        emotionalStability: [...currentHistory.emotionalStability, eegIndices.emotionalStability].slice(-MAX_HISTORY),
        attentionLevel: [...currentHistory.attentionLevel, eegIndices.attentionIndex].slice(-MAX_HISTORY),
        meditationLevel: [...currentHistory.meditationLevel, eegIndices.meditationIndex].slice(-MAX_HISTORY)
      };
      
      // Moving Average 계산
      const calculateAverage = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
      
      const stabilizedValues = {
        totalPower: calculateAverage(newHistory.totalPower),
        focusIndex: calculateAverage(newHistory.focusIndex),
        relaxationIndex: calculateAverage(newHistory.relaxationIndex),
        stressIndex: calculateAverage(newHistory.stressIndex),
        hemisphericBalance: calculateAverage(newHistory.hemisphericBalance),
        cognitiveLoad: calculateAverage(newHistory.cognitiveLoad),
        emotionalStability: calculateAverage(newHistory.emotionalStability),
        attentionLevel: calculateAverage(newHistory.attentionLevel),
        meditationLevel: calculateAverage(newHistory.meditationLevel)
      };
      

      
      return {
        movingAverageData: {
          ...state.movingAverageData,
          eegMovingAverage: {
            history: newHistory,
            stabilizedValues,
            lastUpdated: Date.now()
          }
        }
      };
    });
  },
  
  updatePPGMovingAverage: (ppgIndices, sqiQuality) => {
    if (!ppgIndices || !sqiQuality) return;
    
    const MAX_HISTORY = 120; // 2분간 데이터
    
    set((state) => {
      const currentHistory = state.movingAverageData.ppgMovingAverage.history;
      
      // 🔧 오류 값 필터링: 0이나 비정상 값일 때 이전 값 유지
      const getValidValue = (newValue: number, history: number[], fallback: number = 0): number => {
        // LF/HF 지표는 0이면 이전 값 유지
        if ((newValue === 0 || !newValue || isNaN(newValue)) && history.length > 0) {
          const lastValidValue = history[history.length - 1];
          return lastValidValue;
        }
        return newValue || fallback;
      };
      
      // 새로운 히스토리 데이터 추가 (오류 값 필터링 적용)
      const newHistory = {
        heartRate: [...currentHistory.heartRate, getValidValue(ppgIndices.heartRate, currentHistory.heartRate, 0)].slice(-MAX_HISTORY),
        rmssd: [...currentHistory.rmssd, getValidValue(ppgIndices.rmssd, currentHistory.rmssd, 0)].slice(-MAX_HISTORY),
        sdnn: [...currentHistory.sdnn, getValidValue(ppgIndices.sdnn, currentHistory.sdnn, 0)].slice(-MAX_HISTORY),
        pnn50: [...currentHistory.pnn50, getValidValue(ppgIndices.pnn50, currentHistory.pnn50, 0)].slice(-MAX_HISTORY),
        lfPower: [...currentHistory.lfPower, getValidValue(ppgIndices.lfPower, currentHistory.lfPower, 0)].slice(-MAX_HISTORY),
        hfPower: [...currentHistory.hfPower, getValidValue(ppgIndices.hfPower, currentHistory.hfPower, 0)].slice(-MAX_HISTORY),
        lfHfRatio: [...currentHistory.lfHfRatio, getValidValue(ppgIndices.lfHfRatio, currentHistory.lfHfRatio, 0)].slice(-MAX_HISTORY),
        stressIndex: [...currentHistory.stressIndex, getValidValue(ppgIndices.stressIndex, currentHistory.stressIndex, 0)].slice(-MAX_HISTORY),
        spo2: [...currentHistory.spo2, getValidValue(ppgIndices.spo2, currentHistory.spo2, 0)].slice(-MAX_HISTORY),
        // 새로운 HRV 지표들 추가
        avnn: [...currentHistory.avnn, getValidValue(ppgIndices.avnn, currentHistory.avnn, 0)].slice(-MAX_HISTORY),
        pnn20: [...currentHistory.pnn20, getValidValue(ppgIndices.pnn20, currentHistory.pnn20, 0)].slice(-MAX_HISTORY),
        sdsd: [...currentHistory.sdsd, getValidValue(ppgIndices.sdsd, currentHistory.sdsd, 0)].slice(-MAX_HISTORY),
        hrMax: [...currentHistory.hrMax, getValidValue(ppgIndices.hrMax, currentHistory.hrMax, 0)].slice(-MAX_HISTORY),
        hrMin: [...currentHistory.hrMin, getValidValue(ppgIndices.hrMin, currentHistory.hrMin, 0)].slice(-MAX_HISTORY)
      };
      
      // Moving Average 계산
      const calculateAverage = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
      
      const stabilizedValues = {
        heartRate: calculateAverage(newHistory.heartRate),
        rmssd: calculateAverage(newHistory.rmssd),
        sdnn: calculateAverage(newHistory.sdnn),
        pnn50: calculateAverage(newHistory.pnn50),
        lfPower: calculateAverage(newHistory.lfPower),
        hfPower: calculateAverage(newHistory.hfPower),
        lfHfRatio: calculateAverage(newHistory.lfHfRatio),
        stressIndex: calculateAverage(newHistory.stressIndex),
        spo2: calculateAverage(newHistory.spo2),
        // 새로운 HRV 지표들 추가
        avnn: calculateAverage(newHistory.avnn),
        pnn20: calculateAverage(newHistory.pnn20),
        sdsd: calculateAverage(newHistory.sdsd),
        hrMax: calculateAverage(newHistory.hrMax),
        hrMin: calculateAverage(newHistory.hrMin)
      };
      

      
      return {
        movingAverageData: {
          ...state.movingAverageData,
          ppgMovingAverage: {
            history: newHistory,
            stabilizedValues,
            lastUpdated: Date.now()
          }
        }
      };
    });
  },
  
  reset: () => set(createInitialState())
}));

// 기본 UI Hook 함수들
export const useEEGGraphData = () => useProcessedDataStore(state => state.eegGraphData);
export const usePPGGraphData = () => useProcessedDataStore(state => state.ppgGraphData);
export const useACCGraphData = () => useProcessedDataStore(state => state.accGraphData);

export const useSignalQuality = () => useProcessedDataStore(state => state.signalQuality);
export const useRealtimeAnalysis = () => useProcessedDataStore(state => state.realtimeAnalysis);
export const useDeviceStatus = () => useProcessedDataStore(state => state.deviceStatus);

// 🔧 추가 분석 결과 조회 Hook들 (Visualizer용)
export const useEEGAnalysis = () => useProcessedDataStore(state => state.eegAnalysis);
export const usePPGAnalysis = () => useProcessedDataStore(state => state.ppgAnalysis);
export const useACCAnalysis = () => useProcessedDataStore(state => state.accAnalysis);
export const useSQIData = () => useProcessedDataStore(state => state.sqiData);

// 연결 상태 조회
export const useConnectionState = () => useProcessedDataStore(state => state.isConnected);

export const useGraphSettings = () => useProcessedDataStore(state => state.graphSettings);

// 특정 데이터 조회 Hook들
export const useHeartRate = () => useProcessedDataStore(state => state.realtimeAnalysis.heartRate);
export const useBatteryLevel = () => useProcessedDataStore(state => state.deviceStatus.batteryLevel);
export const useConnectionDuration = () => useProcessedDataStore(state => state.deviceStatus.connectionDuration);
export const useSignalQualityOverall = () => useProcessedDataStore(state => state.signalQuality.overall);

// 🔧 Visualizer 호환성을 위한 추가 Hook들
export const useCurrentData = () => useProcessedDataStore(state => state.eegAnalysis);
export const useEEGIndices = () => useProcessedDataStore(state => state.eegAnalysis.indices);
export const useFrequencySpectrum = () => useProcessedDataStore(state => state.eegAnalysis.frequencySpectrum);
export const usePPGIndices = () => useProcessedDataStore(state => state.ppgAnalysis.indices);
export const useProcessedEEGData = () => useProcessedDataStore(state => ({ 
  channels: { 
    FP1: state.eegGraphData.fp1, 
    FP2: state.eegGraphData.fp2 
  } 
}));
export const useProcessedPPGData = () => useProcessedDataStore(state => ({ 
  channels: { 
    RED: state.ppgGraphData.red, 
    IR: state.ppgGraphData.ir 
  } 
}));
export const useRealtimeACCData = () => useProcessedDataStore(state => ({ 
  channels: { 
    X: state.accGraphData.x, 
    Y: state.accGraphData.y, 
    Z: state.accGraphData.z,
    MAGNITUDE: state.accAnalysis.magnitude 
  } 
}));
export const useEEGSQIData = () => useProcessedDataStore(state => state.sqiData.eegSQI);
export const usePPGSQIData = () => useProcessedDataStore(state => state.sqiData.ppgSQI);
export const useProcessedACCData = () => useProcessedDataStore(state => state.accAnalysis.indices);

// 🔧 ACC 원시 버퍼 데이터 Hook 추가
export const useACCBufferData = (): any[] => {
  return useProcessedDataStore(state => state.accAnalysis.rawBufferData);
};

// Moving Average 데이터 조회 Hook들
export const useEEGMovingAverage = () => useProcessedDataStore(state => state.movingAverageData.eegMovingAverage);
export const usePPGMovingAverage = () => useProcessedDataStore(state => state.movingAverageData.ppgMovingAverage);
export const useMovingAverageData = () => useProcessedDataStore(state => state.movingAverageData); 