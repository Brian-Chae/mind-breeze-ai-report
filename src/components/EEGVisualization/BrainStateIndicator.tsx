import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useEEGAnalysis, useConnectionState } from '../../stores/processedDataStore';
import { useDeviceStore } from '../../stores/deviceStore';
import { useSensorContactStatus } from '../../stores/systemStore';
import { Brain, Zap, Heart, Shield, Activity, Eye } from 'lucide-react';

// EEG 상태 히스토리 타입
interface StateHistory {
  focusIndex: number[];
  relaxationIndex: number[];
  stressIndex: number[];
  attentionLevel: number[];
  meditationLevel: number[];
  cognitiveLoad: number[];
}

// 뇌파 상태 레벨 정의
interface BrainState {
  focus: 'low' | 'medium' | 'high';
  relaxation: 'low' | 'medium' | 'high';
  stress: 'low' | 'medium' | 'high';
  attention: 'low' | 'medium' | 'high';
  meditation: 'low' | 'medium' | 'high';
  cognitiveLoad: 'low' | 'medium' | 'high';
}

const BrainStateIndicator: React.FC = () => {
  const { connectionState } = useDeviceStore();
  const eegAnalysis = useEEGAnalysis();
  const isConnected = useConnectionState();
  const { isSensorContacted, leadOffStatus } = useSensorContactStatus();
  
  // Moving Average를 위한 히스토리 저장
  const historyRef = useRef<StateHistory>({
    focusIndex: [],
    relaxationIndex: [],
    stressIndex: [],
    attentionLevel: [],
    meditationLevel: [],
    cognitiveLoad: []
  });
  
  // 안정화된 뇌파 상태
  const [brainState, setBrainState] = useState<BrainState>({
    focus: 'low',
    relaxation: 'low',
    stress: 'low',
    attention: 'low',
    meditation: 'low',
    cognitiveLoad: 'low'
  });

  // 데이터 품질 상태
  const dataQuality = useMemo(() => {
    const sensorOk = isSensorContacted;
    const bothChannelsOk = !leadOffStatus.fp1 && !leadOffStatus.fp2;
    return sensorOk && bothChannelsOk;
  }, [isSensorContacted, leadOffStatus]);

  // Moving Average 계산 함수
  const calculateMovingAverage = useCallback((values: number[], maxSize: number = 100): number => {
    const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v) && isFinite(v));
    if (validValues.length === 0) return 0;
    
    const recentValues = validValues.slice(-maxSize);
    return recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
  }, []);

  // 값을 레벨로 변환하는 함수
  const getLevel = useCallback((value: number, thresholds: [number, number]): 'low' | 'medium' | 'high' => {
    if (value < thresholds[0]) return 'low';
    if (value < thresholds[1]) return 'medium';
    return 'high';
  }, []);

  // EEG 데이터 업데이트 및 상태 계산
  useEffect(() => {
    if (!eegAnalysis?.indices || !isConnected || !dataQuality) {
      return;
    }

    const indices = eegAnalysis.indices;
    const history = historyRef.current;

    // 히스토리 업데이트
    if (indices.focusIndex !== null && indices.focusIndex !== undefined) {
      history.focusIndex.push(indices.focusIndex);
      if (history.focusIndex.length > 120) history.focusIndex.shift();
    }
    
    if (indices.relaxationIndex !== null && indices.relaxationIndex !== undefined) {
      history.relaxationIndex.push(indices.relaxationIndex);
      if (history.relaxationIndex.length > 120) history.relaxationIndex.shift();
    }
    
    if (indices.stressIndex !== null && indices.stressIndex !== undefined) {
      history.stressIndex.push(indices.stressIndex);
      if (history.stressIndex.length > 120) history.stressIndex.shift();
    }
    
    if (indices.cognitiveLoad !== null && indices.cognitiveLoad !== undefined) {
      history.cognitiveLoad.push(indices.cognitiveLoad);
      if (history.cognitiveLoad.length > 120) history.cognitiveLoad.shift();
    }

    // 복합 지수 계산
    const attentionLevel = (indices.focusIndex || 0) * 0.8 + (indices.totalPower || 0) * 0.2;
    const meditationLevel = (indices.relaxationIndex || 0) * 0.7 + (1 - (indices.stressIndex || 0)) * 0.3;
    
    if (attentionLevel > 0) {
      history.attentionLevel.push(attentionLevel);
      if (history.attentionLevel.length > 120) history.attentionLevel.shift();
    }
    
    if (meditationLevel > 0) {
      history.meditationLevel.push(meditationLevel);
      if (history.meditationLevel.length > 120) history.meditationLevel.shift();
    }

    // 충분한 데이터가 있을 때만 상태 업데이트
    if (history.focusIndex.length >= 10) {
      const avgFocus = calculateMovingAverage(history.focusIndex);
      const avgRelaxation = calculateMovingAverage(history.relaxationIndex);
      const avgStress = calculateMovingAverage(history.stressIndex);
      const avgAttention = calculateMovingAverage(history.attentionLevel);
      const avgMeditation = calculateMovingAverage(history.meditationLevel);
      const avgCognitiveLoad = calculateMovingAverage(history.cognitiveLoad);

      setBrainState({
        focus: getLevel(avgFocus, [0.3, 0.7]),
        relaxation: getLevel(avgRelaxation, [0.3, 0.7]),
        stress: getLevel(avgStress, [0.3, 0.7]),
        attention: getLevel(avgAttention, [0.3, 0.7]),
        meditation: getLevel(avgMeditation, [0.3, 0.7]),
        cognitiveLoad: getLevel(avgCognitiveLoad, [0.3, 0.7])
      });
    }

  }, [eegAnalysis, isConnected, dataQuality, calculateMovingAverage, getLevel]);

  // 상태별 색상 및 스타일 정의
  const getStateStyle = (level: 'low' | 'medium' | 'high', type: 'focus' | 'relaxation' | 'stress' | 'attention' | 'meditation' | 'cognitiveLoad') => {
    const baseStyles = {
      focus: {
        low: 'bg-blue-900/20 border-blue-500/30 text-blue-300',
        medium: 'bg-blue-600/30 border-blue-400/50 text-blue-200',
        high: 'bg-blue-500/40 border-blue-300/70 text-blue-100'
      },
      relaxation: {
        low: 'bg-green-900/20 border-green-500/30 text-green-300',
        medium: 'bg-green-600/30 border-green-400/50 text-green-200',
        high: 'bg-green-500/40 border-green-300/70 text-green-100'
      },
      stress: {
        low: 'bg-green-900/20 border-green-500/30 text-green-300',
        medium: 'bg-yellow-600/30 border-yellow-400/50 text-yellow-200',
        high: 'bg-red-500/40 border-red-300/70 text-red-100'
      },
      attention: {
        low: 'bg-purple-900/20 border-purple-500/30 text-purple-300',
        medium: 'bg-purple-600/30 border-purple-400/50 text-purple-200',
        high: 'bg-purple-500/40 border-purple-300/70 text-purple-100'
      },
      meditation: {
        low: 'bg-teal-900/20 border-teal-500/30 text-teal-300',
        medium: 'bg-teal-600/30 border-teal-400/50 text-teal-200',
        high: 'bg-teal-500/40 border-teal-300/70 text-teal-100'
      },
      cognitiveLoad: {
        low: 'bg-gray-900/20 border-gray-500/30 text-gray-300',
        medium: 'bg-yellow-600/30 border-yellow-400/50 text-yellow-200',
        high: 'bg-orange-500/40 border-orange-300/70 text-orange-100'
      }
    };

    return baseStyles[type][level];
  };

  // 상태별 아이콘 정의
  const getStateIcon = (type: 'focus' | 'relaxation' | 'stress' | 'attention' | 'meditation' | 'cognitiveLoad') => {
    const icons = {
      focus: <Eye className="w-5 h-5" />,
      relaxation: <Heart className="w-5 h-5" />,
      stress: <Zap className="w-5 h-5" />,
      attention: <Brain className="w-5 h-5" />,
      meditation: <Shield className="w-5 h-5" />,
      cognitiveLoad: <Activity className="w-5 h-5" />
    };

    return icons[type];
  };

  // 상태별 레이블 정의
  const getStateLabel = (level: 'low' | 'medium' | 'high') => {
    const labels = {
      low: '낮음',
      medium: '보통',
      high: '높음'
    };

    return labels[level];
  };

  // 연결되지 않은 경우
  if (!isConnected || !dataQuality) {
    return (
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-6 h-6 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-200">뇌파 상태 인디케이터</h3>
        </div>
        
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            {!isConnected ? '디바이스 연결 필요' : '센서 접촉 상태 확인 필요'}
          </div>
          <div className="text-sm text-gray-500">
            LINK BAND 디바이스를 연결하고 센서를 올바르게 접촉시켜 주세요
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-6 h-6 text-blue-400" />
        <h3 className="text-lg font-semibold text-gray-200">뇌파 상태 인디케이터</h3>
        <div className="ml-auto text-xs text-gray-500">
          Moving Average 기반 안정화
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* 집중력 */}
        <div className={`p-4 rounded-lg border transition-all duration-300 ${getStateStyle(brainState.focus, 'focus')}`}>
          <div className="flex items-center gap-2 mb-2">
            {getStateIcon('focus')}
            <span className="text-sm font-medium">집중력</span>
          </div>
          <div className="text-lg font-bold">{getStateLabel(brainState.focus)}</div>
        </div>

        {/* 이완도 */}
        <div className={`p-4 rounded-lg border transition-all duration-300 ${getStateStyle(brainState.relaxation, 'relaxation')}`}>
          <div className="flex items-center gap-2 mb-2">
            {getStateIcon('relaxation')}
            <span className="text-sm font-medium">이완도</span>
          </div>
          <div className="text-lg font-bold">{getStateLabel(brainState.relaxation)}</div>
        </div>

        {/* 스트레스 */}
        <div className={`p-4 rounded-lg border transition-all duration-300 ${getStateStyle(brainState.stress, 'stress')}`}>
          <div className="flex items-center gap-2 mb-2">
            {getStateIcon('stress')}
            <span className="text-sm font-medium">스트레스</span>
          </div>
          <div className="text-lg font-bold">{getStateLabel(brainState.stress)}</div>
        </div>

        {/* 주의력 */}
        <div className={`p-4 rounded-lg border transition-all duration-300 ${getStateStyle(brainState.attention, 'attention')}`}>
          <div className="flex items-center gap-2 mb-2">
            {getStateIcon('attention')}
            <span className="text-sm font-medium">주의력</span>
          </div>
          <div className="text-lg font-bold">{getStateLabel(brainState.attention)}</div>
        </div>

        {/* 명상 수준 */}
        <div className={`p-4 rounded-lg border transition-all duration-300 ${getStateStyle(brainState.meditation, 'meditation')}`}>
          <div className="flex items-center gap-2 mb-2">
            {getStateIcon('meditation')}
            <span className="text-sm font-medium">명상 수준</span>
          </div>
          <div className="text-lg font-bold">{getStateLabel(brainState.meditation)}</div>
        </div>

        {/* 인지 부하 */}
        <div className={`p-4 rounded-lg border transition-all duration-300 ${getStateStyle(brainState.cognitiveLoad, 'cognitiveLoad')}`}>
          <div className="flex items-center gap-2 mb-2">
            {getStateIcon('cognitiveLoad')}
            <span className="text-sm font-medium">인지 부하</span>
          </div>
          <div className="text-lg font-bold">{getStateLabel(brainState.cognitiveLoad)}</div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        실시간 뇌파 데이터 기반 • 15개 샘플 Moving Average 안정화
      </div>
    </div>
  );
};

export default BrainStateIndicator; 