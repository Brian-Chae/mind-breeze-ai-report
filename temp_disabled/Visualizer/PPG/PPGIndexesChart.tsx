import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useDeviceStore } from '../../../stores/deviceStore';
import { usePPGAnalysis, useConnectionState, usePPGSQIData, usePPGMovingAverage, useProcessedDataStore } from '../../../stores/processedDataStore';
import { useSensorContactStatus } from '../../../stores/systemStore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip';
import { indexGuides } from '../../../constants/indexGuides';
import { AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { AnalysisMetricsService } from '../../../services/AnalysisMetricsService';

// HRV 분석 지수 타입 정의
interface PPGIndexes {
  heartRate: number;
  rmssd: number;
  sdnn: number;
  pnn50: number;
  lfPower: number;
  hfPower: number;
  lfHfRatio: number;
  stressIndex: number;
  spo2?: number;
  avnn: number;
  pnn20: number;
  sdsd: number;
  hrMax: number;
  hrMin: number;
}

const PPGIndexesChart: React.FC = () => {
  const { connectionState } = useDeviceStore();
  const ppgAnalysis = usePPGAnalysis();
  const ppgSQIData = usePPGSQIData();
  const isConnected = useConnectionState();
  const { isSensorContacted, leadOffStatus } = useSensorContactStatus();
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // Store 기반 Moving Average 데이터 사용
  const ppgMovingAverage = usePPGMovingAverage();

  // processedDataStore에서 PPG 인덱스 데이터 사용
  const ppgIndices = ppgAnalysis.indices;

  // 신호 품질 상태 계산 (80% 기준)
  const signalQuality = useMemo(() => {
    if (!ppgSQIData.overallSQI || ppgSQIData.overallSQI.length === 0) {
      return { average: 0, isGood: false };
    }
    
    // 최근 10개 샘플의 평균 SQI 계산
    const recentSQI = ppgSQIData.overallSQI.slice(-10);
    const average = recentSQI.reduce((sum, point) => sum + point.value, 0) / recentSQI.length;
    const isGood = average >= 80; // 80% 이상 조건
    
    return { average, isGood };
  }, [ppgSQIData.overallSQI]);

  // 데이터 품질 상태 (센서 접촉 + 신호 품질)
  const dataQuality = useMemo(() => {
    const sensorOk = isSensorContacted;
    const sqiOk = signalQuality.isGood;
    const bothOk = sensorOk && sqiOk;
    
    console.log('🔍 PPG 품질 상태 체크:', {
      sensorOk,
      sqiOk,
      sqiValue: signalQuality.average.toFixed(1) + '%',
      bothOk,
      ppgAnalysisExists: !!ppgAnalysis,
      lastUpdated: ppgAnalysis?.lastUpdated || 0
    });
    
    return {
      sensorContact: sensorOk,
      signalQuality: sqiOk,
      overall: bothOk,
      sqiValue: signalQuality.average
    };
  }, [isSensorContacted, signalQuality, ppgAnalysis]);

  // Store 기반 PPG Moving Average 업데이트
  useEffect(() => {
    if (!ppgIndices || !isConnected || !dataQuality.overall) {
      console.log('💓 PPG Moving Average 업데이트 스킵:', {
        reason: !ppgIndices ? 'no indices' : !isConnected ? 'not connected' : 'poor data quality'
      });
      return;
    }

    // SQI 품질이 80% 이상인지 확인
    const sqiQuality = dataQuality.sqiValue >= 80;
    
    // Store의 updatePPGMovingAverage 액션 호출
    const updatePPGMovingAverage = useProcessedDataStore.getState().updatePPGMovingAverage;
    updatePPGMovingAverage(ppgIndices, sqiQuality);
    
    console.log('💓 PPG Moving Average 업데이트 (Store 기반):', {
      sqiQuality,
      sqiValue: dataQuality.sqiValue.toFixed(1) + '%',
      ppgIndicesValues: {
        heartRate: ppgIndices.heartRate?.toFixed(1),
        rmssd: ppgIndices.rmssd?.toFixed(1),
        sdnn: ppgIndices.sdnn?.toFixed(1),
        stressIndex: ppgIndices.stressIndex?.toFixed(2)
      }
    });
  }, [ppgIndices, isConnected, dataQuality.overall, dataQuality.sqiValue]);

  // 🔧 AnalysisMetricsService의 3000개 버퍼 기반 HRV 지표들 사용
  const analysisService = AnalysisMetricsService.getInstance();
  
  // Store 기반 PPG 인덱스 데이터 사용
  const indexData = useMemo((): PPGIndexes => {
    console.log(`💓 PPG 인덱스 차트 데이터 확인:`, {
      hasPPGAnalysis: !!ppgAnalysis,
      hasPPGIndices: !!ppgIndices,
      dataQuality: dataQuality.overall,
      sensorContact: dataQuality.sensorContact,
      signalQuality: dataQuality.signalQuality,
      sqiValue: dataQuality.sqiValue.toFixed(1),
      isConnected,
      connectionState,
      hasMovingAverageData: ppgMovingAverage.history.heartRate.length >= 10
    });
    
    if (!ppgIndices || !isConnected) {
      console.log(`⚠️ PPG 인덱스 데이터 없음 - 연결상태: ${isConnected}, 인덱스: ${!!ppgIndices}`);
      return {
        heartRate: 0,
        rmssd: 0,
        sdnn: 0,
        pnn50: 0,
        lfPower: 0,
        hfPower: 0,
        lfHfRatio: 0,
        stressIndex: 0,
        avnn: 0,
        pnn20: 0,
        sdsd: 0,
        hrMax: 0,
        hrMin: 0
      };
    }
    
    // 🔧 AnalysisMetricsService에서 3000개 버퍼 기반 HRV 지표들 가져오기
    const bufferStatus = analysisService.getRRBufferStatus();
    const serviceRMSSD = analysisService.getCurrentRMSSD();
    const serviceSDNN = analysisService.getCurrentSDNN();
    const serviceSDSD = analysisService.getCurrentSDSD();
    const serviceAVNN = analysisService.getCurrentAVNN();
    const servicePNN50 = analysisService.getCurrentPNN50();
    const servicePNN20 = analysisService.getCurrentPNN20();
    const serviceStressIndex = analysisService.getCurrentStressIndex();
    const serviceHRMax = analysisService.getCurrentHRMax();
    const serviceHRMin = analysisService.getCurrentHRMin();
    const serviceLfPower = analysisService.getCurrentLfPower();
    const serviceHfPower = analysisService.getCurrentHfPower();
    const serviceLfHfRatio = analysisService.getCurrentLfHfRatio();
    
    // 🔧 120개 버퍼가 준비되었거나 일부 값이라도 있으면 AnalysisMetricsService 값 우선 사용
    const useAnalysisServiceData = bufferStatus.isReady || (
      serviceRMSSD > 0 || serviceSDNN > 0 || serviceLfPower > 0 || serviceHfPower > 0 || 
      serviceStressIndex > 0 || serviceAVNN > 0 || servicePNN50 > 0 || servicePNN20 > 0
    );
    
    console.log('🔧 PPG HRV 데이터 소스 선택:', {
      bufferReady: bufferStatus.isReady,
      bufferLength: bufferStatus.bufferLength,
      bufferCapacity: bufferStatus.bufferCapacity,
      serviceHasData: useAnalysisServiceData,
      serviceValues: {
        rmssd: serviceRMSSD.toFixed(2),
        sdnn: serviceSDNN.toFixed(2),
        lfPower: serviceLfPower.toFixed(2),
        hfPower: serviceHfPower.toFixed(2),
        stressIndex: serviceStressIndex.toFixed(3)
      },
      fallbackToStore: !useAnalysisServiceData
    });
    
    const finalData: PPGIndexes = {
      // 🔧 BPM도 moving average 우선 사용 (SpO2와 동일한 방식)
      heartRate: ppgMovingAverage.stabilizedValues.heartRate !== null && ppgMovingAverage.stabilizedValues.heartRate > 0 
        ? ppgMovingAverage.stabilizedValues.heartRate 
        : (ppgIndices.heartRate || 0),
      rmssd: ppgMovingAverage.stabilizedValues.rmssd !== null && ppgMovingAverage.stabilizedValues.rmssd > 0 
        ? ppgMovingAverage.stabilizedValues.rmssd 
        : (useAnalysisServiceData ? serviceRMSSD : (ppgIndices.rmssd || 0)),
      sdnn: ppgMovingAverage.stabilizedValues.sdnn !== null && ppgMovingAverage.stabilizedValues.sdnn > 0 
        ? ppgMovingAverage.stabilizedValues.sdnn 
        : (useAnalysisServiceData ? serviceSDNN : (ppgIndices.sdnn || 0)),
      pnn50: ppgMovingAverage.stabilizedValues.pnn50 !== null && ppgMovingAverage.stabilizedValues.pnn50 > 0 
        ? ppgMovingAverage.stabilizedValues.pnn50 
        : (useAnalysisServiceData ? servicePNN50 : (ppgIndices.pnn50 || 0)),
      // 🔧 LF/HF 값들도 moving average 우선 사용
      lfPower: ppgMovingAverage.stabilizedValues.lfPower !== null && ppgMovingAverage.stabilizedValues.lfPower > 0 
        ? ppgMovingAverage.stabilizedValues.lfPower 
        : (useAnalysisServiceData ? serviceLfPower : (ppgIndices.lfPower || 0)),
      hfPower: ppgMovingAverage.stabilizedValues.hfPower !== null && ppgMovingAverage.stabilizedValues.hfPower > 0 
        ? ppgMovingAverage.stabilizedValues.hfPower 
        : (useAnalysisServiceData ? serviceHfPower : (ppgIndices.hfPower || 0)),
      lfHfRatio: ppgMovingAverage.stabilizedValues.lfHfRatio !== null && ppgMovingAverage.stabilizedValues.lfHfRatio > 0 
        ? ppgMovingAverage.stabilizedValues.lfHfRatio 
        : (useAnalysisServiceData ? serviceLfHfRatio : (ppgIndices.lfHfRatio || 0)),
      stressIndex: ppgMovingAverage.stabilizedValues.stressIndex !== null && ppgMovingAverage.stabilizedValues.stressIndex > 0 
        ? ppgMovingAverage.stabilizedValues.stressIndex 
        : (useAnalysisServiceData ? serviceStressIndex : (ppgIndices.stressIndex || 0)),
      avnn: ppgMovingAverage.stabilizedValues.avnn !== null && ppgMovingAverage.stabilizedValues.avnn > 0 
        ? ppgMovingAverage.stabilizedValues.avnn 
        : (useAnalysisServiceData ? serviceAVNN : ((ppgIndices as any).avnn || 0)),
      pnn20: ppgMovingAverage.stabilizedValues.pnn20 !== null && ppgMovingAverage.stabilizedValues.pnn20 > 0 
        ? ppgMovingAverage.stabilizedValues.pnn20 
        : (useAnalysisServiceData ? servicePNN20 : ((ppgIndices as any).pnn20 || 0)),
      sdsd: ppgMovingAverage.stabilizedValues.sdsd !== null && ppgMovingAverage.stabilizedValues.sdsd > 0 
        ? ppgMovingAverage.stabilizedValues.sdsd 
        : (useAnalysisServiceData ? serviceSDSD : ((ppgIndices as any).sdsd || 0)),
      hrMax: ppgMovingAverage.stabilizedValues.hrMax !== null && ppgMovingAverage.stabilizedValues.hrMax > 0 
        ? ppgMovingAverage.stabilizedValues.hrMax 
        : (useAnalysisServiceData ? serviceHRMax : ((ppgIndices as any).hrMax || 0)),
      hrMin: ppgMovingAverage.stabilizedValues.hrMin !== null && ppgMovingAverage.stabilizedValues.hrMin > 0 
        ? ppgMovingAverage.stabilizedValues.hrMin 
        : (useAnalysisServiceData ? serviceHRMin : ((ppgIndices as any).hrMin || 0)),
      spo2: ppgMovingAverage.stabilizedValues.spo2 !== null ? ppgMovingAverage.stabilizedValues.spo2 : ((ppgIndices as any).spo2 || 0)
    };
    
    // 🔧 BPM, LF/HF 및 SpO2 값 디버깅 로그
    console.log('🔧 PPG 인덱스 차트 값 디버깅 (Moving Average 우선):', {
      useAnalysisServiceData,
      bpm: {
        movingAverageValue: ppgMovingAverage.stabilizedValues.heartRate,
        rawPpgValue: ppgIndices?.heartRate || 0,
        finalBPMValue: finalData.heartRate,
        historyLength: ppgMovingAverage.history.heartRate.length,
        usingMovingAverage: ppgMovingAverage.stabilizedValues.heartRate !== null && ppgMovingAverage.stabilizedValues.heartRate > 0
      },
      lfhf: {
        movingAverageLfPower: ppgMovingAverage.stabilizedValues.lfPower,
        movingAverageHfPower: ppgMovingAverage.stabilizedValues.hfPower,
        movingAverageLfHfRatio: ppgMovingAverage.stabilizedValues.lfHfRatio,
        serviceLfPower: `${serviceLfPower.toFixed(1)} ms²`,
        serviceHfPower: `${serviceHfPower.toFixed(1)} ms²`,
        serviceLfHfRatio: serviceLfHfRatio.toFixed(3),
        ppgLfPower: `${(ppgIndices?.lfPower || 0).toFixed(6)} (raw)`,
        ppgHfPower: `${(ppgIndices?.hfPower || 0).toFixed(6)} (raw)`,
        ppgLfHfRatio: (ppgIndices?.lfHfRatio || 0).toFixed(6),
        finalLfPower: `${finalData.lfPower.toFixed(1)} ms²`,
        finalHfPower: `${finalData.hfPower.toFixed(1)} ms²`,
        finalLfHfRatio: finalData.lfHfRatio.toFixed(3),
        usingMovingAverageLF: ppgMovingAverage.stabilizedValues.lfPower !== null && ppgMovingAverage.stabilizedValues.lfPower > 0,
        usingMovingAverageHF: ppgMovingAverage.stabilizedValues.hfPower !== null && ppgMovingAverage.stabilizedValues.hfPower > 0,
        usingMovingAverageRatio: ppgMovingAverage.stabilizedValues.lfHfRatio !== null && ppgMovingAverage.stabilizedValues.lfHfRatio > 0
      },
      spo2: {
        movingAverageValue: ppgMovingAverage.stabilizedValues.spo2,
        rawPpgValue: (ppgIndices as any)?.spo2 || 0,
        finalSpO2Value: finalData.spo2,
        historyLength: ppgMovingAverage.history.spo2.length,
        usingMovingAverage: ppgMovingAverage.stabilizedValues.spo2 !== null
      },
      movingAverageHistoryLengths: {
        lfPower: ppgMovingAverage.history.lfPower?.length || 0,
        hfPower: ppgMovingAverage.history.hfPower?.length || 0,
        lfHfRatio: ppgMovingAverage.history.lfHfRatio?.length || 0,
        rmssd: ppgMovingAverage.history.rmssd?.length || 0,
        sdnn: ppgMovingAverage.history.sdnn?.length || 0
      }
    });
    
    return finalData;
  }, [ppgIndices, isConnected, dataQuality.overall, dataQuality.sqiValue, analysisService]);

  // 블루투스 데이터 청크가 들어올 때마다 즉시 업데이트
  useEffect(() => {
    setCurrentTime(Date.now());
  }, [ppgAnalysis]);

  // 각 지표별 정상 범위 정의
  const getIndexStatus = (label: string, value: number) => {
    switch (label) {
      case 'BPM':
        if (value < 60) return { status: 'low', color: 'text-blue-400', message: '서맥 (낮은 심박수)' };
        if (value > 100) return { status: 'high', color: 'text-red-400', message: '빈맥 (높은 심박수)' };
        return { status: 'normal', color: 'text-green-400', message: '정상 범위' };
      
      case 'SpO2':
        if (value === 0) return { status: 'low', color: 'text-gray-400', message: '측정 불가 (신호 부족)' };
        if (value < 90) return { status: 'high', color: 'text-red-400', message: '심각한 저산소증 (의료진 상담 필요)' };
        if (value < 95) return { status: 'high', color: 'text-orange-400', message: '경미한 저산소증' };
        if (value < 98) return { status: 'normal', color: 'text-green-400', message: '정상 범위 (하한)' };
        return { status: 'normal', color: 'text-green-400', message: '정상 산소포화도' };
      
      case 'RMSSD':
        if (value < 20) return { status: 'low', color: 'text-yellow-400', message: '긴장 상태 (휴식이 필요한 상태)' };
        if (value > 50) return { status: 'high', color: 'text-blue-400', message: '편안한 상태 (회복력 좋음)' };
        return { status: 'normal', color: 'text-green-400', message: '정상 범위' };
      
      case 'SDNN':
        if (value < 30) return { status: 'low', color: 'text-yellow-400', message: '심박 리듬 일정함 (스트레스나 피로 상태)' };
        if (value > 100) return { status: 'high', color: 'text-blue-400', message: '심박 리듬 다양함 (건강한 상태)' };
        return { status: 'normal', color: 'text-green-400', message: '정상 범위' };
      
      case 'PNN50':
        if (value < 10) return { status: 'low', color: 'text-yellow-400', message: '심박 리듬 규칙적 (긴장이나 피로 상태)' };
        if (value > 30) return { status: 'high', color: 'text-blue-400', message: '심박 리듬 유연함 (건강한 상태)' };
        return { status: 'normal', color: 'text-green-400', message: '정상 범위' };
      
      case 'Stress':
        if (value < 0.30) return { status: 'low', color: 'text-blue-400', message: '매우 낮은 스트레스 (과도한 이완)' };
        if (value < 0.50) return { status: 'normal', color: 'text-green-400', message: '낮은 스트레스 (이완 상태)' };
        if (value < 0.70) return { status: 'normal', color: 'text-green-400', message: '정상 범위 (균형 상태)' };
        if (value < 0.90) return { status: 'high', color: 'text-orange-400', message: '높은 스트레스 (긴장 상태)' };
        return { status: 'high', color: 'text-red-400', message: '매우 높은 스트레스 (심각한 긴장)' };
      
      // 새로운 지표들 추가
      case 'AVNN':
        if (value < 600) return { status: 'high', color: 'text-red-400', message: '빠른 심박 (활동적이거나 긴장 상태)' };
        if (value > 1000) return { status: 'low', color: 'text-blue-400', message: '느린 심박 (휴식 상태나 운동선수형)' };
        return { status: 'normal', color: 'text-green-400', message: '안정적인 심박 리듬' };
      
      case 'PNN20':
        if (value < 20) return { status: 'low', color: 'text-yellow-400', message: '심박 리듬 일정함 (긴장이나 피로)' };
        if (value > 60) return { status: 'high', color: 'text-blue-400', message: '심박 리듬 유연함 (건강한 상태)' };
        return { status: 'normal', color: 'text-green-400', message: '적절한 심박 변화' };
      
      case 'SDSD':
        if (value < 15) return { status: 'low', color: 'text-yellow-400', message: '심박 변화 적음 (스트레스나 피로)' };
        if (value > 40) return { status: 'high', color: 'text-blue-400', message: '심박 변화 활발함 (회복력 좋음)' };
        return { status: 'normal', color: 'text-green-400', message: '정상적인 심박 변화' };
      
      case 'HR Max':
        if (value < 80) return { status: 'low', color: 'text-yellow-400', message: '낮은 최대 심박수' };
        if (value > 150) return { status: 'high', color: 'text-red-400', message: '높은 최대 심박수' };
        return { status: 'normal', color: 'text-green-400', message: '정상 최대 심박수' };
      
      case 'HR Min':
        if (value < 50) return { status: 'low', color: 'text-blue-400', message: '낮은 최소 심박수' };
        if (value > 80) return { status: 'high', color: 'text-orange-400', message: '높은 최소 심박수' };
        return { status: 'normal', color: 'text-green-400', message: '정상 최소 심박수' };
      
      // 주파수 도메인 분석 지표들 (100배 스케일링 기반 정상 범위)
      case 'LF':
        if (value < 2) return { status: 'low', color: 'text-yellow-400', message: '낮은 교감신경 활동 (과도한 휴식)' };
        if (value > 12) return { status: 'high', color: 'text-red-400', message: '높은 교감신경 활동 (스트레스나 긴장)' };
        return { status: 'normal', color: 'text-green-400', message: '적절한 교감신경 활동' };
      
      case 'HF':
        if (value < 0.8) return { status: 'low', color: 'text-yellow-400', message: '낮은 부교감신경 활동 (스트레스나 피로)' };
        if (value > 40) return { status: 'high', color: 'text-blue-400', message: '높은 부교감신경 활동 (깊은 휴식)' };
        return { status: 'normal', color: 'text-green-400', message: '적절한 부교감신경 활동' };
      
      case 'LF/HF':
        if (value < 1.0) return { status: 'low', color: 'text-blue-400', message: '부교감신경 우세 (깊은 휴식 상태)' };
        if (value > 10.0) return { status: 'high', color: 'text-red-400', message: '교감신경 우세 (스트레스나 활동)' };
        return { status: 'normal', color: 'text-green-400', message: '자율신경 균형 상태' };
      
      default:
        return { status: 'normal', color: 'text-green-400', message: '정상 범위' };
    }
  };

  // 안정화 상태 계산 (EEG 방식과 동일)
  const stabilizationStatus = useMemo(() => {
    const hasEnoughSamples = ppgMovingAverage.history.heartRate.length >= 10;
    const isQualityGood = dataQuality.overall;
    const isStabilized = hasEnoughSamples && isQualityGood;
    
    return {
      isStabilized,
      hasEnoughSamples,
      isQualityGood,
      sampleCount: ppgMovingAverage.history.heartRate.length,
      requiredSamples: 10
    };
  }, [ppgMovingAverage.history.heartRate.length, dataQuality.overall]);

  // 카드 데이터 정의 - 새로운 배치 순서 적용
  const cardData = [
    // 1행: BPM, SpO2, HR Max, HR Min (4개)
    {
      label: 'BPM',
      value: indexData.heartRate,
      unit: 'BPM',
      color: 'bg-red-500',
      description: '심박수',
      historyLength: ppgMovingAverage.history.heartRate.length
    },
    {
      label: 'SpO2',
      value: indexData.spo2,
      unit: '%',
      color: 'bg-cyan-500',
      description: '혈중 산소 포화도',
      historyLength: ppgMovingAverage.history.spo2.length
    },
    {
      label: 'HR Max',
      value: (indexData as any).hrMax || 0,
      unit: 'BPM',
      color: 'bg-rose-500',
      description: '측정 기간 최고 심박수 (2분간)',
      historyLength: ppgMovingAverage.history.hrMax.length
    },
    {
      label: 'HR Min',
      value: (indexData as any).hrMin || 0,
      unit: 'BPM',
      color: 'bg-emerald-500',
      description: '측정 기간 최저 심박수 (2분간)',
      historyLength: ppgMovingAverage.history.hrMin.length
    },
    // 2행: Stress, RMSSD, SDNN, SDSD (4개)
    {
      label: 'Stress',
      value: indexData.stressIndex,
      unit: '',
      color: 'bg-purple-500',
      description: '스트레스 지수',
      historyLength: ppgMovingAverage.history.stressIndex.length
    },
    {
      label: 'RMSSD',
      value: indexData.rmssd,
      unit: 'ms',
      color: 'bg-blue-500',
      description: '연속 RR간격 차이의 제곱근',
      historyLength: ppgMovingAverage.history.rmssd.length
    },
    {
      label: 'SDNN',
      value: indexData.sdnn,
      unit: 'ms',
      color: 'bg-green-500',
      description: 'RR간격의 표준편차',
      historyLength: ppgMovingAverage.history.sdnn.length
    },
    {
      label: 'SDSD',
      value: (indexData as any).sdsd || 0,
      unit: 'ms',
      color: 'bg-teal-500',
      description: '연속 차이의 표준편차',
      historyLength: ppgMovingAverage.history.sdsd.length
    },
    // 3행: LF, HF, LF/HF (3개) - 주파수 도메인 분석
    {
      label: 'LF',
      value: indexData.lfPower || 0,
      unit: 'ms²',
      color: 'bg-violet-500',
      description: '저주파 성분 (교감신경 활동)',
      historyLength: ppgMovingAverage.history.lfPower.length
    },
    {
      label: 'HF',
      value: indexData.hfPower || 0,
      unit: 'ms²',
      color: 'bg-pink-500',
      description: '고주파 성분 (부교감신경 활동)',
      historyLength: ppgMovingAverage.history.hfPower.length
    },
    {
      label: 'LF/HF',
      value: indexData.lfHfRatio || 0,
      unit: '',
      color: 'bg-amber-500',
      description: '교감/부교감 균형 비율',
      historyLength: ppgMovingAverage.history.lfHfRatio.length
    },
    // 4행: AVNN, PNN50, PNN20 (3개)
    {
      label: 'AVNN',
      value: (indexData as any).avnn || 0,
      unit: 'ms',
      color: 'bg-indigo-500',
      description: '평균 NN간격 (심박주기)',
      historyLength: ppgMovingAverage.history.avnn.length
    },
    {
      label: 'PNN50',
      value: indexData.pnn50,
      unit: '%',
      color: 'bg-yellow-500',
      description: '50ms 이상 차이나는 RR간격 비율',
      historyLength: ppgMovingAverage.history.pnn50.length
    },
    {
      label: 'PNN20',
      value: (indexData as any).pnn20 || 0,
      unit: '%',
      color: 'bg-orange-500',
      description: '20ms 이상 차이나는 RR간격 비율',
      historyLength: ppgMovingAverage.history.pnn20.length
    }
  ];

  // 카드 렌더링 함수 (EEG 방식과 동일)
  const renderCard = (card: any) => {
    const isStabilized = dataQuality.overall && card.historyLength >= 10;
    const cardOpacity = dataQuality.overall ? 'opacity-100' : 'opacity-60';
    
    // 상태별 색상과 설명 가져오기
    const isValidValue = card.value !== null && card.value !== undefined && card.value > 0;
    
    const indexStatus = isValidValue
      ? getIndexStatus(card.label, card.value) 
      : { status: 'normal', color: 'text-gray-400', message: '데이터 없음' };
    
    // 상태별 마커 색상 결정 (지표별 개별 매핑)
    const getMarkerColor = () => {
      if (!isValidValue) {
        return 'bg-gray-500'; // 데이터 없음
      }
      
      // 지표별 색상 매핑 (상태 메시지와 일치하도록)
      switch (card.label) {
        case 'BPM':
          if (indexStatus.status === 'low') return 'bg-blue-500';    // 서맥 (낮은 심박수)
          if (indexStatus.status === 'high') return 'bg-red-500';   // 빈맥 (높은 심박수)
          return 'bg-green-500'; // 정상
          
        case 'SpO2':
          if (indexStatus.status === 'low') return 'bg-gray-500';   // 측정 불가
          if (indexStatus.status === 'high') return 'bg-red-500';  // 저산소증
          return 'bg-green-500'; // 정상
          
        case 'Stress':
          if (indexStatus.status === 'low') return 'bg-blue-500';   // 과도한 이완
          if (indexStatus.status === 'high') return 'bg-red-500';  // 높은 스트레스
          return 'bg-green-500'; // 정상
          
        case 'RMSSD':
        case 'SDNN':
        case 'PNN50':
        case 'PNN20':
        case 'SDSD':
          if (indexStatus.status === 'low') return 'bg-yellow-500';  // 긴장/피로 상태
          if (indexStatus.status === 'high') return 'bg-blue-500';   // 건강한 상태 (좋음)
          return 'bg-green-500'; // 정상
          
        case 'AVNN':
          if (indexStatus.status === 'low') return 'bg-blue-500';   // 느린 심박 (좋음)
          if (indexStatus.status === 'high') return 'bg-red-500';  // 빠른 심박
          return 'bg-green-500'; // 정상
          
        case 'HR Max':
          if (indexStatus.status === 'low') return 'bg-yellow-500'; // 낮은 최대 심박수
          if (indexStatus.status === 'high') return 'bg-red-500';  // 높은 최대 심박수
          return 'bg-green-500'; // 정상
          
        case 'HR Min':
          if (indexStatus.status === 'low') return 'bg-blue-500';   // 낮은 최소 심박수 (좋음)
          if (indexStatus.status === 'high') return 'bg-orange-500'; // 높은 최소 심박수
          return 'bg-green-500'; // 정상
          
        case 'LF':
          if (indexStatus.status === 'low') return 'bg-yellow-500'; // 과도한 휴식
          if (indexStatus.status === 'high') return 'bg-red-500';  // 스트레스/긴장
          return 'bg-green-500'; // 정상
          
        case 'HF':
          if (indexStatus.status === 'low') return 'bg-yellow-500'; // 스트레스/피로
          if (indexStatus.status === 'high') return 'bg-blue-500';  // 깊은 휴식 (좋음)
          return 'bg-green-500'; // 정상
          
        case 'LF/HF':
          if (indexStatus.status === 'low') return 'bg-blue-500';   // 부교감신경 우세 (좋음)
          if (indexStatus.status === 'high') return 'bg-red-500';  // 교감신경 우세 (스트레스)
          return 'bg-green-500'; // 균형 상태
          
        default:
          // 기본 로직 (이전과 동일)
          switch (indexStatus.status) {
            case 'low': return 'bg-yellow-500';
            case 'high': return 'bg-red-500';
            case 'normal': return 'bg-green-500';
            default: return 'bg-gray-500';
          }
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
                {isValidValue ? card.value.toFixed(
                  card.label === 'BPM' ? 0 : 
                  card.label === 'Stress' ? 2 : 
                  card.label === 'LF' || card.label === 'HF' ? 1 : // LF/HF는 소수점 1자리 (ms² 단위)
                  card.label === 'LF/HF' ? 2 : 1  // LF/HF 비율은 소수점 2자리
                ) : '--'}
                <span className="text-sm text-gray-400 ml-1">{card.unit}</span>
              </div>
              {/* 상태 메시지 */}
              <div className={`text-xs ${indexStatus.color} mb-1`}>
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

  // 데이터 품질에 따른 배경색 결정
  const getQualityBackgroundColor = () => {
    if (!indexData || !isConnected) {
      return 'bg-gray-50 dark:bg-gray-900';
    }
    
    // SQI 기반 품질 평가
    if (dataQuality.sqiValue >= 80) {
      return 'bg-green-50 dark:bg-green-950';
    } else if (dataQuality.sqiValue >= 60) {
      return 'bg-yellow-50 dark:bg-yellow-950';
    } else {
      return 'bg-red-50 dark:bg-red-950';
    }
  };

  // 연결되지 않았거나 데이터가 없는 경우 메시지 표시
  if (!isConnected || !indexData) {
    return (
      <div className="w-full space-y-6">
        <div className="w-full h-80 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4">💓</div>
            <div className="text-lg text-gray-300">
              그래프에 표시할 데이터가 없습니다
            </div>
            <div className="text-sm text-gray-400">
              LINK BAND 디바이스를 연결해주세요
            </div>
            <div className="text-xs text-gray-500 mt-2">
              연결 후 심박변이도 분석 지수를 실시간으로 확인할 수 있습니다
            </div>
            <div className="text-xs text-gray-600 mt-3 p-2 bg-gray-800 rounded">
              processedDataStore PPG 분석 결과 기반 지수 계산 중...
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
              PPG 분석 정확도가 저하될 수 있습니다
            </div>
          </div>
        </div>
      )}

      {/* 타이틀과 연결 상태 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-200">
            심박변이도 분석 지수
          </h3>
          {/* 안정화 상태 표시 (EEG 방식과 동일) */}
          {stabilizationStatus.isStabilized ? (
            <div className="flex items-center gap-1 px-2 py-1 bg-green-900/30 text-green-300 border border-green-500/30 rounded-full text-xs">
              <CheckCircle className="w-3 h-3" />
              <span>안정화됨 ({stabilizationStatus.sampleCount}개 샘플)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-900/30 text-yellow-300 border border-yellow-500/30 rounded-full text-xs">
              <Clock className="w-3 h-3" />
              <span>
                {!stabilizationStatus.isQualityGood 
                  ? '신호 품질 개선 필요' 
                  : `안정화 중 (${stabilizationStatus.sampleCount}/${stabilizationStatus.requiredSamples})`
                }
              </span>
            </div>
          )}
        </div>
        {(!isConnected || connectionState.status !== 'connected') && (
          <span className="text-sm text-gray-400">
            (디바이스 연결이 필요합니다.)
          </span>
        )}
      </div>

      {/* PPG 지수 카드들 - 새로운 배치 (4-4-3-3) */}
      <div className="space-y-4">
        {/* 1행: BPM, SpO2, HR Max, HR Min (4개) */}
        <div className="grid grid-cols-4 gap-4">
          {cardData.slice(0, 4).map((card) => renderCard(card))}
        </div>
        
        {/* 2행: Stress, RMSSD, SDNN, SDSD (4개) */}
        <div className="grid grid-cols-4 gap-4">
          {cardData.slice(4, 8).map((card) => renderCard(card))}
        </div>

        {/* 3행: LF, HF, LF/HF (3개, 꽉 차게) */}
        <div className="grid grid-cols-3 gap-4">
          {cardData.slice(8, 11).map((card) => renderCard(card))}
        </div>

        {/* 4행: AVNN, PNN50, PNN20 (3개, 꽉 차게) */}
        <div className="grid grid-cols-3 gap-4">
          {cardData.slice(11, 14).map((card) => renderCard(card))}
        </div>
      </div>
    </div>
  );
};

export default PPGIndexesChart; 