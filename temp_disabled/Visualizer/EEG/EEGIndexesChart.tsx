import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useEEGAnalysis, useConnectionState, useProcessedDataStore, useEEGMovingAverage } from '../../../stores/processedDataStore';
import { useDeviceStore } from '../../../stores/deviceStore';
import { useSensorContactStatus } from '../../../stores/systemStore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip';
import { indexGuides } from '../../../constants/indexGuides';
import { AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';

// EEG 분석 지수 타입 정의 (Store 기반으로 변경됨)

const EEGIndexesChart: React.FC = () => {
  const { connectionState } = useDeviceStore();
  const eegAnalysis = useEEGAnalysis();
  const isConnected = useConnectionState();
  const { isSensorContacted, leadOffStatus } = useSensorContactStatus();
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // Store 기반 Moving Average 데이터 사용
  const eegMovingAverage = useEEGMovingAverage();

  // processedDataStore에서 EEG 인덱스 데이터 사용
  const eegIndices = eegAnalysis?.indices;
  
  // 실제 신호 품질 정보 확인 (ProcessedDataStore에서 가져오기)
  const signalQualityData = useProcessedDataStore(state => state.signalQuality);

  // processedDataStore에서 EEG SQI 데이터 가져오기
  const eegSQIData = useProcessedDataStore(state => state.sqiData.eegSQI);

  // 데이터 품질 상태 계산 (실제 SQI 기반)
  const dataQuality = useMemo(() => {
    const sensorOk = isSensorContacted;
    const bothChannelsOk = !leadOffStatus.fp1 && !leadOffStatus.fp2;
    
    // SQI 값 확인 (80% 이상을 양호로 판단)
    const sqiThreshold = 80;
    
    // 최신 SQI 값 확인
    const latestCh1SQI = eegSQIData?.ch1SQI?.[eegSQIData.ch1SQI.length - 1]?.value || 0;
    const latestCh2SQI = eegSQIData?.ch2SQI?.[eegSQIData.ch2SQI.length - 1]?.value || 0;
    const averageSQI = (latestCh1SQI + latestCh2SQI) / 2;
    const eegQualityOk = averageSQI >= sqiThreshold;
    
    // 전체 품질 = 센서 접촉 + 채널 품질 + SQI 품질
    const overall = sensorOk && bothChannelsOk && eegQualityOk;
    
    console.log('🔍 EEG 품질 상태 체크 (실제 SQI):', {
      sensorOk,
      bothChannelsOk,
      latestCh1SQI: latestCh1SQI.toFixed(1) + '%',
      latestCh2SQI: latestCh2SQI.toFixed(1) + '%',
      averageSQI: averageSQI.toFixed(1) + '%',
      sqiThreshold: sqiThreshold + '%',
      eegQualityOk,
      overall,
      signalQualityOverall: signalQualityData?.overall || 'unknown',
      leadOffStatus,
      eegAnalysisExists: !!eegAnalysis,
      lastUpdated: eegAnalysis?.lastUpdated || 0
    });
    
    return {
      sensorContact: sensorOk,
      channelQuality: bothChannelsOk,
      eegQuality: eegQualityOk,
      averageSQI: averageSQI,
      overall: overall,
      fp1Status: !leadOffStatus.fp1,
      fp2Status: !leadOffStatus.fp2
    };
  }, [isSensorContacted, leadOffStatus, eegAnalysis, eegSQIData]);

  // Store 기반 EEG Moving Average 업데이트
  useEffect(() => {
    if (!eegIndices || !isConnected || !dataQuality.overall) {
      console.log('🧠 EEG Moving Average 업데이트 스킵:', {
        reason: !eegIndices ? 'no indices' : !isConnected ? 'not connected' : 'poor data quality'
      });
      return;
    }

    // SQI 품질이 80% 이상인지 확인
    const sqiQuality = dataQuality.averageSQI >= 80;
    
    // Store의 updateEEGMovingAverage 액션 호출
    const updateEEGMovingAverage = useProcessedDataStore.getState().updateEEGMovingAverage;
    updateEEGMovingAverage(eegIndices, sqiQuality);
    
    console.log('🧠 EEG Moving Average 업데이트 (Store 기반):', {
      sqiQuality,
      averageSQI: dataQuality.averageSQI.toFixed(1) + '%',
      eegIndicesValues: {
        totalPower: eegIndices.totalPower?.toFixed(2),
        focusIndex: eegIndices.focusIndex?.toFixed(2),
        relaxationIndex: eegIndices.relaxationIndex?.toFixed(2),
        emotionalStability: eegIndices.emotionalStability?.toFixed(2)
      }
    });
  }, [eegIndices, isConnected, dataQuality.overall, dataQuality.averageSQI]);

  // Store 기반 EEG 인덱스 데이터 사용
  const indexData = useMemo(() => {
    console.log(`🧠 EEG 인덱스 차트 데이터 확인:`, {
      hasEEGAnalysis: !!eegAnalysis,
      hasEEGIndices: !!eegIndices,
      dataQuality: dataQuality.overall,
      sensorContact: dataQuality.sensorContact,
      channelQuality: dataQuality.channelQuality,
      fp1Status: dataQuality.fp1Status,
      fp2Status: dataQuality.fp2Status,
      isConnected,
      connectionState,
      hasMovingAverageData: eegMovingAverage.history.focusIndex.length >= 10
    });
    
    if (!eegIndices || !isConnected) {
      console.log(`⚠️ EEG 인덱스 데이터 없음 - 연결상태: ${isConnected}, 인덱스: ${!!eegIndices}`);
      return {
        totalPower: 0,
        focusIndex: 0,
        relaxationIndex: 0,
        stressIndex: 0,
        hemisphericBalance: 0,
        cognitiveLoad: 0,
        emotionalStability: 0,
        attentionLevel: 0,
        meditationLevel: 0,
        hasData: false
      };
    }
    
    // 품질이 좋고 충분한 히스토리가 있으면 안정화된 값 사용, 아니면 원본 값 사용
    const useStabilized = dataQuality.overall && eegMovingAverage.history.focusIndex.length >= 10;
    const values = useStabilized ? eegMovingAverage.stabilizedValues : {
      totalPower: eegIndices.totalPower || 0,
      focusIndex: eegIndices.focusIndex || 0,
      relaxationIndex: eegIndices.relaxationIndex || 0,
      stressIndex: eegIndices.stressIndex || 0,
      hemisphericBalance: eegIndices.hemisphericBalance || 0,
      cognitiveLoad: eegIndices.cognitiveLoad || 0,
      emotionalStability: eegIndices.emotionalStability || 0,
      attentionLevel: ((eegIndices.focusIndex || 0) * 0.8 + (eegIndices.totalPower || 0) * 0.2),
      meditationLevel: ((eegIndices.relaxationIndex || 0) * 0.7 + (1 - (eegIndices.stressIndex || 0)) * 0.3)
    };
    
    console.log(`✅ EEG 인덱스 차트 데이터 준비 완료 (${useStabilized ? '안정화된 값' : '원본 값'})`);
    
    return {
      ...values,
      hasData: true
    };
  }, [eegAnalysis, eegIndices, isConnected, connectionState, dataQuality, eegMovingAverage]);

  // 블루투스 데이터 청크가 들어올 때마다 즉시 업데이트
  useEffect(() => {
    setCurrentTime(Date.now());
  }, [eegAnalysis]);

  // 각 지표별 정상 범위 정의
  const getIndexStatus = (label: string, value: number) => {
    switch (label) {
      case '집중력 (Focus)':
        if (value < 1.8) return { status: 'low', color: 'text-yellow-400', message: '주의력 결핍 혹은 졸음' };
        if (value >= 2.4) return { status: 'high', color: 'text-red-400', message: '과도한 집중 혹은 스트레스' };
        return { status: 'normal', color: 'text-green-400', message: '정상 범위' };
      
      case '이완및긴장도 (Arousal)':
        if (value < 0.18) return { status: 'low', color: 'text-yellow-400', message: '긴장 및 스트레스 상태' };
        if (value > 0.22) return { status: 'high', color: 'text-red-400', message: '과도한 이완' };
        return { status: 'normal', color: 'text-green-400', message: '정상적인 긴장 상태' };
      
      case '스트레스 (Stress)':
        if (value < 2.0) return { status: 'low', color: 'text-blue-400', message: '매우 낮은 스트레스' };
        if (value < 3.0) return { status: 'low', color: 'text-green-400', message: '낮은 스트레스' };
        if (value < 4.0) return { status: 'normal', color: 'text-green-400', message: '정상 범위' };
        if (value < 5.0) return { status: 'high', color: 'text-orange-400', message: '높은 스트레스' };
        return { status: 'high', color: 'text-red-400', message: '심각한 스트레스' };
      
      case '좌우뇌 균형':
        // NaN이나 Infinity 체크
        if (!isFinite(value) || isNaN(value)) {
          return { status: 'normal', color: 'text-gray-400', message: '측정 중' };
        }
        if (value <= -0.1) return { status: 'low', color: 'text-blue-400', message: '창의적 (우뇌 우세)' };
        if (value >= 0.1) return { status: 'low', color: 'text-purple-400', message: '논리적 (좌뇌 우세)' };
        return { status: 'normal', color: 'text-green-400', message: '균형 상태' };
      
      case '인지 부하':
        if (value < 0.3) return { status: 'low', color: 'text-yellow-400', message: '낮은 참여도' };
        if (value > 1.2) return { status: 'high', color: 'text-red-400', message: '과부하 상태' };
        if (value > 0.8) return { status: 'high', color: 'text-red-400', message: '높은 인지 부하' };
        return { status: 'normal', color: 'text-green-400', message: '최적 부하' };
      
      case '정서안정성 (Valence)':
        if (value < 0.4) return { status: 'low', color: 'text-yellow-400', message: '정서 불안정, 과도한 각성' };
        if (value > 0.8) return { status: 'high', color: 'text-red-400', message: '정서 둔화, 과도한 억제' };
        return { status: 'normal', color: 'text-green-400', message: '정상 범위' };
      
      case '총 파워':
      case '신경활동성':
        if (value >= 1150) return { status: 'high', color: 'text-red-400', message: '과도한 신경 활동' };
        if (value < 850) return { status: 'low', color: 'text-yellow-400', message: '억제된 신경 활동' };
        return { status: 'normal', color: 'text-green-400', message: '정상 범위' };
      
      default:
        return { status: 'normal', color: 'text-green-400', message: '정상 범위' };
    }
  };

  // 카드 데이터 정의 (새로운 배치 순서)
  const cardData = [
    // 1행: 이완및긴장도, 정서안정성, 집중력, 스트레스
    {
      label: '이완및긴장도 (Arousal)',
      value: indexData.relaxationIndex,
      unit: '',
      color: 'bg-green-500',
      description: '알파파 기반 이완 상태',
      historyLength: eegMovingAverage.history.relaxationIndex.length
    },
    {
      label: '정서안정성 (Valence)',
      value: indexData.emotionalStability,
      unit: '',
      color: 'bg-pink-500',
      description: '감마파 기반 정서 안정도',
      historyLength: eegMovingAverage.history.emotionalStability.length
    },
    {
      label: '집중력 (Focus)',
      value: indexData.focusIndex,
      unit: '',
      color: 'bg-blue-500',
      description: '베타파 기반 집중도 지수',
      historyLength: eegMovingAverage.history.focusIndex.length
    },
    {
      label: '스트레스 (Stress)',
      value: indexData.stressIndex,
      unit: '',
      color: 'bg-red-500',
      description: '고주파 활동 기반 스트레스',
      historyLength: eegMovingAverage.history.stressIndex.length
    },
    // 2행: 신경활동성, 인지부하, 좌우뇌균형
    {
      label: '신경활동성',
      value: indexData.totalPower,
      unit: 'μV²',
      color: 'bg-purple-500',
      description: '전체 뇌파 활동 강도',
      historyLength: eegMovingAverage.history.totalPower.length
    },
    {
      label: '인지 부하',
      value: indexData.cognitiveLoad,
      unit: '',
      color: 'bg-yellow-500',
      description: '세타/알파 비율 기반 인지 부하',
      historyLength: eegMovingAverage.history.cognitiveLoad.length
    },
    {
      label: '좌우뇌 균형',
      value: indexData.hemisphericBalance,
      unit: '',
      color: 'bg-cyan-500',
      description: '반구간 활동 균형 지표',
      historyLength: eegMovingAverage.history.hemisphericBalance.length
    }
  ];

  // 카드 렌더링 함수
  const renderCard = (card: any) => {
    const isStabilized = dataQuality.overall && card.historyLength >= 10;
    const cardOpacity = dataQuality.overall ? 'opacity-100' : 'opacity-60';
    
    // 상태별 색상과 설명 가져오기 (좌우뇌 균형은 0값도 유효)
    const isValidValue = card.value !== null && card.value !== undefined && 
      (card.label === '좌우뇌 균형' ? 
        isFinite(card.value) && !isNaN(card.value) && Math.abs(card.value) <= 1 : // -1 ~ 1 범위 체크
        card.value > 0);
    
    const indexStatus = isValidValue
      ? getIndexStatus(card.label, card.value) 
      : { status: 'normal', color: 'text-gray-400', message: '데이터 없음' };
    
    // 상태별 마커 색상 결정
    const getMarkerColor = () => {
      if (!isValidValue) {
        return 'bg-gray-500'; // 데이터 없음
      }
      switch (indexStatus.status) {
        case 'low': return 'bg-yellow-500';
        case 'high': return 'bg-red-500';
        case 'normal': return 'bg-green-500';
        default: return 'bg-gray-500';
      }
    };
    
    return (
      <TooltipProvider key={card.label}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-700 transition-colors ${cardOpacity}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getMarkerColor()}`} />
                  <span className="text-sm font-medium text-gray-300">{card.label}</span>
                  {/* 안정화 상태 표시 */}
                  {isStabilized && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-900/30 text-blue-300 border border-blue-500/30 rounded text-xs">
                      <CheckCircle className="w-2.5 h-2.5" />
                      <span className="text-xs">안정화</span>
                    </div>
                  )}
                </div>
                {/* 품질 상태 표시 */}
                {!dataQuality.overall && (
                  <Clock className="w-3 h-3 text-gray-500" />
                )}
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {isValidValue
                  ? card.value.toFixed(2) 
                  : '--'
                }
                <span className="text-sm text-gray-400 ml-1">{card.unit}</span>
              </div>
              {/* 상태 설명 */}
              <div className={`text-xs font-medium mb-1 ${indexStatus.color}`}>
                {indexStatus.message}
              </div>
              {/* 히스토리 정보 */}
              {isStabilized && (
                <div className="text-xs text-gray-500">
                  {card.historyLength}개 샘플 평균
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-neutral-700 border-neutral-600 shadow-xl">
            <div className="max-w-lg p-4 bg-neutral-700 rounded-lg">
              <div 
                className="text-sm leading-relaxed space-y-2 [&>strong]:text-blue-300 [&>strong]:font-semibold [&>br]:block [&>br]:mb-1"
                style={{
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                }}
                dangerouslySetInnerHTML={{ 
                  __html: (indexGuides[card.label] || `<strong>${card.label}</strong><br/>상세 정보가 준비 중입니다.`)
                    .replace(/<strong>/g, '<strong class="text-blue-300 font-semibold">')
                    .replace(/공식:/g, '<span class="text-green-300 font-medium">공식:</span>')
                    .replace(/정상 범위:/g, '<span class="text-yellow-300 font-medium">정상 범위:</span>')
                    .replace(/해석:/g, '<span class="text-orange-300 font-medium">해석:</span>')
                    .replace(/참고문헌:/g, '<span class="text-purple-300 font-medium">참고문헌:</span>')
                    .replace(/설명:/g, '<span class="text-cyan-300 font-medium">설명:</span>')
                }}
              />
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // 연결되지 않았거나 데이터가 없는 경우 메시지 표시
  if (!isConnected || !indexData.hasData) {
    return (
      <div className="w-full space-y-6">
      <div className="w-full h-80 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">🧠</div>
          <div className="text-lg text-gray-300">
            그래프에 표시할 데이터가 없습니다
          </div>
          <div className="text-sm text-gray-400">
            LINK BAND 디바이스를 연결해주세요
          </div>
          <div className="text-xs text-gray-500 mt-2">
            연결 후 뇌파 분석 지수를 실시간으로 확인할 수 있습니다
          </div>
          <div className="text-xs text-gray-600 mt-3 p-2 bg-gray-800 rounded">
              processedDataStore EEG 분석 결과 기반 지수 계산 중...
            </div>
          </div>
        </div>
      </div>
    );
  }

    return (
    <div className="w-full space-y-6">

      {/* 센서 접촉 상태 경고 */}
      {isConnected && !isSensorContacted && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <div className="text-red-300">
            <div className="font-medium">전극 접촉 불량 감지</div>
            <div className="text-sm">
              FP1: {leadOffStatus.fp1 ? '접촉 불량' : '정상'}, 
              FP2: {leadOffStatus.fp2 ? '접촉 불량' : '정상'} - 
              뇌파 지수 정확도가 저하될 수 있습니다
          </div>
          </div>
        </div>
      )}

      {/* 타이틀과 연결 상태 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-200">
          뇌파 분석 지수
        </h3>
        {(!isConnected || connectionState.status !== 'connected') && (
          <span className="text-sm text-gray-400">
            (디바이스 연결이 필요합니다.)
          </span>
        )}
      </div>

      {/* EEG 지수 카드들 - 위에 4개, 아래 3개 */}
      <div className="space-y-4">
        {/* 상단 4개 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cardData.slice(0, 4).map((card) => renderCard(card))}
        </div>
        
        {/* 하단 3개 카드 */}
        <div className="grid grid-cols-3 gap-4">
          {cardData.slice(4, 7).map((card) => renderCard(card))}
        </div>
      </div>
    </div>
  );
};

export default EEGIndexesChart; 