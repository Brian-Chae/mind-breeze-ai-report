import React, { useEffect, useState, useMemo } from 'react';
import { useDeviceStore } from '../../../stores/deviceStore';
import { useACCAnalysis, useConnectionState, useACCBufferData } from '../../../stores/processedDataStore';
import { useSensorContactStatus } from '../../../stores/systemStore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip';
import { indexGuides } from '../../../constants/indexGuides';
import { AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';

const ACCIndexesChart: React.FC = () => {
  const { connectionState } = useDeviceStore();
  const accAnalysis = useACCAnalysis();
  const isConnected = useConnectionState();
  const { isSensorContacted, leadOffStatus } = useSensorContactStatus();
  const accBufferData = useACCBufferData();
  const [currentTime, setCurrentTime] = useState(Date.now());

  // 시간 업데이트 (1초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 버퍼 데이터 기반 실시간 통계
  const bufferStats = useMemo(() => {
    if (!accBufferData || accBufferData.length === 0) {
      return { count: 0, recentActivity: 0, indexRange: '0-0', totalActivity: 0 };
    }

    // 최근 10개 샘플의 평균 활동도 (중력 제거)
    const recentData = accBufferData.slice(-10);
    const recentActivity = recentData.reduce((sum, sample) => {
      const magnitude = sample.magnitude || Math.sqrt(sample.x ** 2 + sample.y ** 2 + sample.z ** 2);
      // 🔧 중력 가속도(1g) 제거 후 절대값으로 계산
      const adjustedMagnitude = Math.abs(magnitude - 1);
      return sum + adjustedMagnitude;
    }, 0) / recentData.length;

    // 전체 버퍼의 평균 활동도 (중력 제거)
    const totalActivity = accBufferData.reduce((sum, sample) => {
      const magnitude = sample.magnitude || Math.sqrt(sample.x ** 2 + sample.y ** 2 + sample.z ** 2);
      // 🔧 중력 가속도(1g) 제거 후 절대값으로 계산
      const adjustedMagnitude = Math.abs(magnitude - 1);
      return sum + adjustedMagnitude;
    }, 0) / accBufferData.length;

    return {
      count: accBufferData.length,
      recentActivity: recentActivity.toFixed(2),
      totalActivity: totalActivity.toFixed(2),
      indexRange: `0-${accBufferData.length - 1}`
    };
  }, [accBufferData]);

  // 분석 지수 데이터 (PPG와 동일한 카드 스타일)
  const indexData = useMemo(() => {
    const indices = accAnalysis?.indices;
    const avgMovement = indices?.avgMovement || 0;
    
    // Average Movement 값을 기반으로 활동 상태 결정
    const getActivityStateFromAvgMovement = (avgMovement: number): string => {
      if (avgMovement < 5) return 'stationary';
      if (avgMovement < 10) return 'sitting';
      if (avgMovement < 20) return 'walking';
      return 'running';
    };
    
    return {
      activity: indices?.activity || 0,
      stability: indices?.stability || 0,
      intensity: indices?.intensity || 0,
      balance: indices?.balance || 0,
      activityState: getActivityStateFromAvgMovement(avgMovement),
      avgMovement: avgMovement,
      stdMovement: indices?.stdMovement || 0,
      maxMovement: indices?.maxMovement || 0
    };
  }, [accAnalysis]);

  // 활동 상태별 색상 정의
  const getActivityColor = (state: string) => {
    switch (state.toLowerCase()) {
      case 'stationary': return 'text-blue-400'; // 파란색
      case 'sitting': return 'text-green-400'; // 초록색
      case 'walking': return 'text-yellow-400'; // 노란색
      case 'running': return 'text-red-400'; // 빨간색
      default: return 'text-gray-400'; // 회색 (기본값)
    }
  };

  // 활동 상태별 배경 색상 정의
  const getActivityBgColor = (state: string) => {
    switch (state.toLowerCase()) {
      case 'stationary': return 'bg-blue-500/20'; // 파란색 배경
      case 'sitting': return 'bg-green-500/20'; // 초록색 배경
      case 'walking': return 'bg-yellow-500/20'; // 노란색 배경
      case 'running': return 'bg-red-500/20'; // 빨간색 배경
      default: return 'bg-gray-500/20'; // 회색 배경 (기본값)
    }
  };

  // 지수 상태 평가 함수 (PPG/EEG와 동일한 패턴)
  const getIndexStatus = (label: string, value: number) => {
    switch (label) {
      case '안정성':
        if (value < 30) return { status: 'low', color: 'text-red-400', message: '매우 불안정 (균형 장애 가능성)' };
        if (value < 50) return { status: 'low', color: 'text-yellow-400', message: '불안정한 자세 (주의 필요)' };
        if (value < 70) return { status: 'normal', color: 'text-blue-400', message: '정상 안정성 (양호한 상태)' };
        return { status: 'high', color: 'text-blue-400', message: '매우 안정적인 자세' };
      
      case '강도':
        if (value < 25) return { status: 'low', color: 'text-blue-400', message: '저강도 활동 (휴식, 수면)' };
        if (value < 50) return { status: 'normal', color: 'text-green-400', message: '중저강도 활동 (일상 생활)' };
        if (value < 75) return { status: 'high', color: 'text-yellow-400', message: '중고강도 활동 (운동, 작업)' };
        return { status: 'very_high', color: 'text-red-400', message: '고강도 활동 (격렬한 운동)' };
      
      case 'Average Movement':
        if (value < 5) return { status: 'low', color: 'text-blue-400', message: 'Stationary (정지 상태)' };
        if (value < 10) return { status: 'normal', color: 'text-green-400', message: 'Sitting (앉기)' };
        if (value < 20) return { status: 'high', color: 'text-yellow-400', message: 'Walking (걷기)' };
        return { status: 'very_high', color: 'text-red-400', message: 'Running (달리기)' };
      
      case 'Max Movement':
        if (value < 5) return { status: 'low', color: 'text-blue-400', message: 'Stationary (정지 상태)' };
        if (value < 10) return { status: 'normal', color: 'text-green-400', message: 'Sitting (앉기)' };
        if (value < 20) return { status: 'high', color: 'text-yellow-400', message: 'Walking (걷기)' };
        return { status: 'very_high', color: 'text-red-400', message: 'Running (달리기)' };
      
      default:
        return { status: 'unknown', color: 'text-gray-400', message: '상태 분석 중...' };
    }
  };

  // 데이터 품질 평가 (버퍼 상태 기반)
  const dataQuality = useMemo(() => {
    const minSamples = 50; // 최소 필요 샘플 수
    const hasEnoughData = bufferStats.count >= minSamples;
    
    return {
      overall: hasEnoughData,
      sampleCount: bufferStats.count,
      isStabilized: bufferStats.count >= 100 // 안정화 기준: 100개 샘플
    };
  }, [bufferStats.count]);

  // 카드 데이터 정의 (PPG/EEG와 동일한 패턴으로 업데이트)
  const cardData = [
    {
      label: '안정성',
      value: indexData.stability,
      unit: '%',
      color: 'bg-green-500',
      description: '자세 안정성 지수',
      historyLength: bufferStats.count
    },
    {
      label: '강도',
      value: indexData.intensity,
      unit: '%',
      color: 'bg-red-500',
      description: '움직임 강도 수준',
      historyLength: bufferStats.count
    },
    {
      label: 'Average Movement',
      value: indexData.avgMovement,
      unit: 'g',
      color: 'bg-cyan-500',
      description: '평균 움직임 크기',
      historyLength: bufferStats.count
    },
    {
      label: 'Max Movement',
      value: indexData.maxMovement,
      unit: 'g',
      color: 'bg-orange-500',
      description: '최대 움직임 크기',
      historyLength: bufferStats.count
    }
  ];

  // 카드 렌더링 함수 (PPG/EEG와 동일한 패턴)
  const renderCard = (card: any, index: number) => {
    const isValidValue = card.value !== null && card.value !== undefined && !isNaN(card.value);
    const indexStatus = getIndexStatus(card.label, card.value || 0);
    const isStabilized = dataQuality.isStabilized;
    const cardOpacity = dataQuality.overall ? 'opacity-100' : 'opacity-75';
    
    // 마커 색상 결정 (상태에 따라)
    const getMarkerColor = () => {
      if (!dataQuality.overall) return 'bg-gray-500';
      
      // 안정성 카드의 경우 정상 범위에서 파란색 표시
      if (card.label === '안정성') {
        switch (indexStatus.status) {
          case 'low': 
            return card.value < 30 ? 'bg-red-500' : 'bg-yellow-500';
          case 'normal': return 'bg-blue-500'; // 정상 범위 - 파란색
          case 'high': return 'bg-blue-500';   // 매우 안정적 - 파란색
          default: return 'bg-gray-500';
        }
      }
      
      // 다른 카드들은 기존 로직 유지
      switch (indexStatus.status) {
        case 'low': return 'bg-blue-500';
        case 'normal': return 'bg-green-500';
        case 'high': return 'bg-yellow-500';
        case 'very_high': return 'bg-orange-500';
        case 'extreme': return 'bg-red-500';
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
                {isValidValue ? (card.unit === 'g' 
                  ? card.value.toFixed(2)
                  : card.value.toFixed(1)
                ) : '--'}
                <span className="text-sm text-gray-400 ml-1">{card.unit}</span>
              </div>
              {/* 상태 메시지 */}
              <div className={`text-xs font-medium mb-1 ${indexStatus.color}`}>
                {indexStatus.message}
              </div>
              {/* 히스토리 정보 */}
              {isStabilized && (
                <div className="text-xs text-gray-500">
                  {card.historyLength}개 샘플 분석
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
                    .replace(/측정 방법:/g, '<span class="text-cyan-300 font-medium">측정 방법:</span>')
                    .replace(/분류 기준:/g, '<span class="text-yellow-300 font-medium">분류 기준:</span>')
                    .replace(/단위:/g, '<span class="text-green-300 font-medium">단위:</span>')
                }}
              />
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

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
              ACC 분석 정확도가 저하될 수 있습니다
            </div>
          </div>
        </div>
      )}

      {/* 활동 상태 표시 */}
      <div className={`border border-gray-700 rounded-lg p-4 ${getActivityBgColor(indexData.activityState)}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-200">현재 활동 상태</h3>
            <p className={`text-2xl font-bold mt-1 ${getActivityColor(indexData.activityState)}`}>
              {indexData.activityState}
            </p>
          </div>
          <div className="text-right text-sm text-gray-400">
            <p>전체 샘플: {bufferStats.count}개</p>
            <p>최근 활동도: {bufferStats.recentActivity}g</p>
            <p>전체 활동도: {bufferStats.totalActivity}g</p>
            <p>인덱스 범위: {bufferStats.indexRange}</p>
          </div>
        </div>
      </div>

      {/* 분석 지수 카드들 (PPG/EEG와 동일한 스타일) */}
      <div className="grid grid-cols-4 gap-4">
        {cardData.map((card, index) => renderCard(card, index))}
      </div>

      {/* 연결 상태 표시 */}
      {(!isConnected || connectionState.status !== 'connected') && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-sm">
            디바이스 연결이 필요합니다
          </div>
        </div>
      )}
    </div>
  );
};

export default ACCIndexesChart; 