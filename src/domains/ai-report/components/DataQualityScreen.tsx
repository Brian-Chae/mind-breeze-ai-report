import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card';
import { Progress } from '@ui/progress';
import { Badge } from '@ui/badge';
import { Alert, AlertDescription } from '@ui/alert';
import { CheckCircle2, AlertCircle, Activity, Brain, Heart, Move3d, Clock, Zap, Wifi, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';

// 기존 hook들 import
import { 
  useEEGGraphData, 
  usePPGGraphData, 
  useACCAnalysis,
  useConnectionState,
  useEEGSQIData,
  usePPGSQIData,
  useDeviceStatus,
  useProcessedDataStore
} from '../../../stores/processedDataStore';

interface DataQualityScreenProps {
  onQualityConfirmed: () => void;
  onBack: () => void;
  onError: (error: string) => void;
}

export function DataQualityScreen({ onQualityConfirmed, onBack, onError }: DataQualityScreenProps) {
  const [qualityTimer, setQualityTimer] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(true);

  // 기존 데이터 hook들 사용
  const isConnected = useConnectionState();
  const { isSensorContacted: rawSensorContacted } = useDeviceStatus();
  const eegGraphData = useEEGGraphData();
  const ppgGraphData = usePPGGraphData();
  const accAnalysis = useACCAnalysis();
  const eegSQIData = useEEGSQIData();
  const ppgSQIData = usePPGSQIData();

  // 실제 데이터 존재 기반으로 센서 접촉 상태 판단
  const isSensorContacted = useMemo(() => {
    // 기본적으로는 rawSensorContacted 사용하지만,
    // 실제 데이터가 있으면 접촉된 것으로 판단
    if (eegGraphData?.fp1?.length > 0 && eegGraphData?.fp2?.length > 0 && 
        ppgGraphData?.red?.length > 0 && ppgGraphData?.ir?.length > 0) {
      return true;
    }
    return rawSensorContacted;
  }, [rawSensorContacted, eegGraphData, ppgGraphData]);

  // 디버깅: 데이터 상태 로깅
  useEffect(() => {
    console.log('🔍 DataQualityScreen - 현재 데이터 상태:', {
      isConnected,
      isSensorContacted,
      eegGraphData: eegGraphData ? Object.keys(eegGraphData) : 'null',
      ppgGraphData: ppgGraphData ? Object.keys(ppgGraphData) : 'null',
      accAnalysis: accAnalysis ? Object.keys(accAnalysis) : 'null',
      eegSQIData: eegSQIData ? Object.keys(eegSQIData) : 'null',
      ppgSQIData: ppgSQIData ? Object.keys(ppgSQIData) : 'null'
    });

    // ProcessedDataStore 직접 상태 확인
    const storeState = useProcessedDataStore.getState();
    console.log('🔍 ProcessedDataStore 직접 상태:', {
      storeKeys: Object.keys(storeState),
      eegAnalysis: storeState.eegAnalysis,
      ppgAnalysis: storeState.ppgAnalysis,
      accAnalysis: storeState.accAnalysis,
      sqiData: storeState.sqiData,
      eegGraphData: storeState.eegGraphData,
      ppgGraphData: storeState.ppgGraphData
    });

    // 각 hook의 원시 데이터 확인
    console.log('🔍 Hook 원시 데이터:', {
      eegGraphData,
      ppgGraphData,
      accAnalysis,
      eegSQIData,
      ppgSQIData
    });

    // SQI 데이터 구조 확인
    console.log('🔍 SQI 데이터 구조 확인:', {
      eegSQI_first: eegSQIData?.ch1SQI?.[0],
      eegSQI_last: eegSQIData?.ch1SQI?.[eegSQIData?.ch1SQI?.length - 1],
      ppgSQI_first: ppgSQIData?.overallSQI?.[0],
      ppgSQI_last: ppgSQIData?.overallSQI?.[ppgSQIData?.overallSQI?.length - 1],
      eegSQI_type: typeof eegSQIData?.ch1SQI?.[0],
      ppgSQI_type: typeof ppgSQIData?.overallSQI?.[0]
    });

    // 그래프 데이터 구조 확인
    console.log('🔍 그래프 데이터 구조 확인:', {
      eegFP1_first: eegGraphData?.fp1?.[0],
      eegFP1_last: eegGraphData?.fp1?.[eegGraphData?.fp1?.length - 1],
      ppgRed_first: ppgGraphData?.red?.[0],
      ppgRed_last: ppgGraphData?.red?.[ppgGraphData?.red?.length - 1],
      eegFP1_type: typeof eegGraphData?.fp1?.[0],
      ppgRed_type: typeof ppgGraphData?.red?.[0],
      isSensorContacted,
      rawSensorContacted
    });
  }, [isConnected, isSensorContacted, eegGraphData, ppgGraphData, accAnalysis, eegSQIData, ppgSQIData]);

  // 신호 품질 계산
  const signalQuality = useMemo(() => {
    try {
      // EEG SQI: ch1, ch2 SQI 평균값 (최근 100개 샘플)
      let eegQuality = 0;
      if (eegSQIData?.ch1SQI?.length > 0 && eegSQIData?.ch2SQI?.length > 0) {
        const recentCh1 = eegSQIData.ch1SQI.slice(-100);
        const recentCh2 = eegSQIData.ch2SQI.slice(-100);
        
        // 데이터 구조 확인 후 적절히 처리
        const getValue = (item: any) => typeof item === 'number' ? item : (item?.value || 0);
        
        const avgCh1 = recentCh1.reduce((sum, p) => sum + getValue(p), 0) / recentCh1.length;
        const avgCh2 = recentCh2.reduce((sum, p) => sum + getValue(p), 0) / recentCh2.length;
        
        eegQuality = (avgCh1 + avgCh2) / 2;
      }

      // PPG SQI: overallSQI 평균값 (최근 100개 샘플)
      let ppgQuality = 0;
      if (ppgSQIData?.overallSQI?.length > 0) {
        const recentOverall = ppgSQIData.overallSQI.slice(-100);
        const getValue = (item: any) => typeof item === 'number' ? item : (item?.value || 0);
        ppgQuality = recentOverall.reduce((sum, p) => sum + getValue(p), 0) / recentOverall.length;
      }

      // ACC 품질: 활동 상태 기반
      let accQuality = 100; // 기본값
      let accStatus = '움직임 안정';
      const activityState = accAnalysis?.indices?.activityState || 'stationary';
      
      if (activityState === 'walking' || activityState === 'running') {
        accQuality = 30; // 경고 상태
        accStatus = '움직임 많음';
      } else if (activityState === 'stationary' || activityState === 'sitting') {
        accQuality = 100;
        accStatus = '움직임 안정';
      }

      // 센서 접촉 불량일 때는 EEG, PPG 품질 0으로 설정
      const finalEegQuality = !isSensorContacted ? 0 : eegQuality;
      const finalPpgQuality = !isSensorContacted ? 0 : ppgQuality;

      const overallQuality = (finalEegQuality + finalPpgQuality + accQuality) / 3;

      console.log('🔍 신호 품질 계산 결과:', {
        eegQuality: finalEegQuality,
        ppgQuality: finalPpgQuality,
        accQuality,
        overallQuality,
        isSensorContacted,
        activityState,
        rawEegQuality: eegQuality,
        rawPpgQuality: ppgQuality
      });

      return {
        eeg: finalEegQuality,
        ppg: finalPpgQuality,
        acc: accQuality,
        overall: overallQuality,
        accStatus,
        sensorContacted: isSensorContacted
      };
    } catch (error) {
      console.error('신호 품질 계산 오류:', error);
      return {
        eeg: 0,
        ppg: 0,
        acc: 100,
        overall: 33.3,
        accStatus: '움직임 안정',
        sensorContacted: false
      };
    }
  }, [eegSQIData, ppgSQIData, accAnalysis, isSensorContacted]);

  // EEG 그래프 데이터 준비
  const prepareEEGData = () => {
    if (!eegGraphData || !eegGraphData.fp1.length || !eegGraphData.fp2.length) {
      // 더미 데이터 생성
      return Array.from({ length: 1000 }, (_, i) => ({
        index: i,
        fp1: Math.sin(i * 0.1) * 50 + Math.random() * 20 - 10,
        fp2: Math.cos(i * 0.1) * 40 + Math.random() * 15 - 7.5
      }));
    }

    // 최근 1000개 샘플 표시
    const maxDisplaySamples = 1000;
    const fp1Channel = eegGraphData.fp1;
    const fp2Channel = eegGraphData.fp2;
    
    // 최소 길이 기준으로 데이터 슬라이스
    const minLength = Math.min(fp1Channel.length, fp2Channel.length);
    const startIndex = Math.max(0, minLength - maxDisplaySamples);
    
    const fp1Data = fp1Channel.slice(startIndex);
    const fp2Data = fp2Channel.slice(startIndex);
    
    // 배열 인덱스 기반으로 데이터 결합 - 유연한 데이터 처리
    const getValue = (item: any) => typeof item === 'number' ? item : (item?.value || 0);
    
    return fp1Data.map((fp1Point: any, index: number) => ({
      index: index,
      fp1: getValue(fp1Point),
      fp2: getValue(fp2Data[index]) || 0
    }));
  };

  // PPG 그래프 데이터 준비
  const preparePPGData = () => {
    if (!ppgGraphData || !ppgGraphData.red.length || !ppgGraphData.ir.length) {
      // 더미 데이터 생성
      return Array.from({ length: 400 }, (_, i) => ({
        index: i,
        red: Math.sin(i * 0.2) * 100 + Math.random() * 30 - 15,
        ir: Math.cos(i * 0.15) * 80 + Math.random() * 25 - 12.5
      }));
    }

    const redChannel = ppgGraphData.red;
    const irChannel = ppgGraphData.ir;
    
    // 왼쪽 50개 샘플을 제외하고 400개만 사용
    const skipSamples = 50;
    const displaySamples = 400;
    const minLength = Math.min(redChannel.length, irChannel.length);
    
    if (minLength <= skipSamples) {
      return [];
    }
    
    // 왼쪽 50개를 제외한 후 400개만 사용
    const startIndex = skipSamples;
    const endIndex = Math.min(startIndex + displaySamples, minLength);
    
    const redData = redChannel.slice(startIndex, endIndex);
    const irData = irChannel.slice(startIndex, endIndex);
    
    // 배열 인덱스 기반으로 데이터 결합 - 유연한 데이터 처리
    const getValue = (item: any) => typeof item === 'number' ? item : (item?.value || 0);
    
    return redData.map((redPoint: any, index: number) => ({
      index: index,
      red: getValue(redPoint),
      ir: getValue(irData[index]) || 0
    }));
  };

  const finalEEGData = prepareEEGData();
  const finalPPGData = preparePPGData();

  // 차트 데이터 확인
  useEffect(() => {
    console.log('🔍 최종 차트 데이터:', {
      finalEEGData_length: finalEEGData?.length,
      finalEEGData_first: finalEEGData?.[0],
      finalEEGData_last: finalEEGData?.[finalEEGData?.length - 1],
      finalPPGData_length: finalPPGData?.length,
      finalPPGData_first: finalPPGData?.[0],
      finalPPGData_last: finalPPGData?.[finalPPGData?.length - 1]
    });
  }, [finalEEGData, finalPPGData]);

  // 품질 기준 체크 (90% 이상)
  const qualityThreshold = 90;
  const isGoodQuality = signalQuality.overall >= qualityThreshold && 
                       signalQuality.eeg >= qualityThreshold && 
                       signalQuality.ppg >= qualityThreshold &&
                       signalQuality.sensorContacted;

  // 10초간 안정적인 품질 유지 확인
  useEffect(() => {
    if (isGoodQuality && isMonitoring) {
      const timer = setInterval(() => {
        setQualityTimer(prev => {
          if (prev >= 10) {
            clearInterval(timer);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setQualityTimer(0);
    }
  }, [isGoodQuality, isMonitoring]);

  // 품질 상태 확인 함수
  const getQualityStatus = (quality: number) => {
    if (quality >= 90) return { 
      status: 'good', 
      color: 'text-green-700 bg-green-100 border-green-200', 
      icon: CheckCircle2,
      label: '양호'
    };
    if (quality >= 60) return { 
      status: 'medium', 
      color: 'text-yellow-700 bg-yellow-100 border-yellow-200', 
      icon: AlertCircle,
      label: '보통'
    };
    return { 
      status: 'poor', 
      color: 'text-red-700 bg-red-100 border-red-200', 
      icon: AlertCircle,
      label: '불량'
    };
  };

  const handleConfirm = useCallback(() => {
    if (!isConnected) {
      onError('디바이스가 연결되지 않았습니다.');
      return;
    }

    if (qualityTimer < 10) {
      onError('신호 품질이 10초간 안정적으로 유지되어야 합니다.');
      return;
    }

    if (!isGoodQuality) {
      onError('신호 품질이 좋지 않습니다. 디바이스 착용을 확인해주세요.');
      return;
    }

    onQualityConfirmed();
  }, [isConnected, isGoodQuality, qualityTimer, onQualityConfirmed, onError]);

  return (
    <div className="data-quality-screen min-h-screen bg-gray-50 p-6 flex flex-col">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          🔍 디바이스 착용 및 신호 품질 확인
        </h1>
        <p className="text-gray-600">
          정확한 측정을 위해 센서 접촉과 신호 품질을 확인해주세요.
        </p>
      </div>

      {/* 연결 상태 확인 */}
      {!isConnected && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700">
            디바이스가 연결되지 않았습니다. 이전 단계로 돌아가서 디바이스를 연결해주세요.
          </AlertDescription>
        </Alert>
      )}

      {/* 센서 접촉 상태 경고 */}
      {isConnected && !isSensorContacted && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700">
            <div className="font-medium mb-1">센서 접촉 불량 감지</div>
            <div className="text-sm">
              헤어밴드 위치를 조정해주세요.
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* 신호 품질 요약 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* EEG 품질 */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-700 flex items-center gap-2">
              <Brain className="h-4 w-4 text-blue-500" />
              EEG 신호
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-700 mb-1">
              {signalQuality.eeg.toFixed(0)}%
            </div>
            <Badge className={getQualityStatus(signalQuality.eeg).color}>
              {getQualityStatus(signalQuality.eeg).label}
            </Badge>
          </CardContent>
        </Card>

        {/* PPG 품질 */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-700 flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              PPG 신호
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-700 mb-1">
              {signalQuality.ppg.toFixed(0)}%
            </div>
            <Badge className={getQualityStatus(signalQuality.ppg).color}>
              {getQualityStatus(signalQuality.ppg).label}
            </Badge>
          </CardContent>
        </Card>

        {/* ACC 상태 */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-700 flex items-center gap-2">
              <Move3d className="h-4 w-4 text-green-500" />
              움직임 상태
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-gray-700 mb-1">
              {signalQuality.accStatus}
            </div>
            <Badge className={signalQuality.acc >= 90 ? 'text-green-600 bg-green-100 border-green-200' : 'text-red-600 bg-red-100 border-red-200'}>
              {accAnalysis?.indices?.activityState || 'unknown'}
            </Badge>
          </CardContent>
        </Card>

        {/* 전체 품질 */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-700 flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-500" />
              전체 품질
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-700 mb-1">
              {signalQuality.overall.toFixed(0)}%
            </div>
            <Badge className={getQualityStatus(signalQuality.overall).color}>
              {getQualityStatus(signalQuality.overall).label}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* 전체 신호 품질 프로그레스 바 */}
      <Card className="bg-white border-gray-200 shadow-sm mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-gray-700 flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            전체 신호 품질
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 프로그레스 바 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">신호 품질</span>
                <span className="text-sm font-medium text-gray-700">
                  {signalQuality.overall.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={signalQuality.overall} 
                className="h-3"
              />
            </div>

            {/* 상태 메시지 */}
            <div className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 bg-gray-50">
              {signalQuality.overall >= 90 ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                  <div>
                    <div className="text-green-700 font-medium">
                      측정 준비가 완료되었습니다.
                    </div>
                    <div className="text-gray-600 text-sm mt-1">
                      이제 다음 단계로 진행할 수 있습니다.
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="h-6 w-6 text-yellow-500 flex-shrink-0" />
                  <div>
                    <div className="text-yellow-700 font-medium">
                      신호 품질이 좋지 못합니다. 디바이스 착용을 확인해주세요.
                    </div>
                    <div className="text-gray-600 text-sm mt-1">
                      정확한 측정을 위해 신호 품질이 90% 이상이어야 합니다.
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 실시간 신호 그래프들 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 flex-1">
        {/* EEG 신호 그래프 */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-gray-700 flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-500" />
              EEG 뇌파 신호 (FP1, FP2)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* 경고 메시지 표시 */}
            {!isConnected ? (
              <div className="h-48 flex items-center justify-center">
                <div className="text-center">
                  <Wifi className="w-8 h-8 text-red-500 mx-auto mb-3" />
                  <p className="text-red-500 text-sm font-medium">디바이스가 연결되지 않았습니다</p>
                  <p className="text-gray-500 text-xs mt-1">LINK BAND를 연결해주세요</p>
                </div>
              </div>
            ) : !isSensorContacted ? (
              <div className="h-48 flex items-center justify-center">
                <div className="text-center">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                  <p className="text-amber-600 text-sm font-medium">센서 접촉 불량</p>
                  <p className="text-gray-500 text-xs mt-1">디바이스 위치를 조정해주세요</p>
                </div>
              </div>
            ) : (
              <div className="h-48 rounded-lg overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={finalEEGData} 
                    margin={{ top: 10, right: 10, left: 5, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                    <XAxis 
                      dataKey="index" 
                      axisLine={true}
                      tickLine={true}
                      tick={{ fill: '#6b7280', fontSize: 10 }}
                      stroke="#9ca3af"
                      type="number"
                      domain={[0, 'dataMax']}
                      hide
                    />
                    <YAxis 
                      domain={[-150, 150]}
                      type="number"
                      allowDataOverflow={false}
                      scale="linear"
                      allowDecimals={false}
                      tickCount={7}
                      ticks={[-150, -100, -50, 0, 50, 100, 150]}
                      axisLine={true}
                      tickLine={true}
                      tick={{ fill: '#6b7280', fontSize: 10 }}
                      stroke="#9ca3af"
                      orientation="left"
                      width={35}
                      includeHidden={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="fp1" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={false}
                      name="FP1"
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="fp2" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      dot={false}
                      name="FP2"
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="flex items-center justify-center gap-6 mt-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#10b981] rounded-full"></div>
                <span className="text-sm text-gray-600 font-medium">FP1 Channel</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#f59e0b] rounded-full"></div>
                <span className="text-sm text-gray-600 font-medium">FP2 Channel</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500 text-center">
              신호 품질: {signalQuality.eeg.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        {/* PPG 신호 그래프 */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-gray-700 flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              PPG 심박 신호 (IR, Red)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* 경고 메시지 표시 */}
            {!isConnected ? (
              <div className="h-48 flex items-center justify-center">
                <div className="text-center">
                  <Wifi className="w-8 h-8 text-red-500 mx-auto mb-3" />
                  <p className="text-red-500 text-sm font-medium">디바이스가 연결되지 않았습니다</p>
                  <p className="text-gray-500 text-xs mt-1">LINK BAND를 연결해주세요</p>
                </div>
              </div>
            ) : !isSensorContacted ? (
              <div className="h-48 flex items-center justify-center">
                <div className="text-center">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                  <p className="text-amber-600 text-sm font-medium">센서 접촉 불량</p>
                  <p className="text-gray-500 text-xs mt-1">디바이스 위치를 조정해주세요</p>
                </div>
              </div>
            ) : (
              <div className="h-48 rounded-lg overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={finalPPGData} 
                    margin={{ top: 10, right: 10, left: 5, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                    <XAxis 
                      dataKey="index" 
                      axisLine={true}
                      tickLine={true}
                      tick={{ fill: '#6b7280', fontSize: 10 }}
                      stroke="#9ca3af"
                      type="number"
                      domain={[0, 'dataMax']}
                      hide
                    />
                    <YAxis 
                      domain={[-200, 200]}
                      type="number"
                      allowDataOverflow={false}
                      scale="linear"
                      allowDecimals={false}
                      tickCount={7}
                      ticks={[-200, -133, -66, 0, 66, 133, 200]}
                      axisLine={true}
                      tickLine={true}
                      tick={{ fill: '#6b7280', fontSize: 10 }}
                      stroke="#9ca3af"
                      orientation="left"
                      width={35}
                      includeHidden={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="red" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={false}
                      name="Red"
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="ir" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      dot={false}
                      name="IR"
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="flex items-center justify-center gap-6 mt-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#ef4444] rounded-full"></div>
                <span className="text-sm text-gray-600 font-medium">Red Channel</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#8b5cf6] rounded-full"></div>
                <span className="text-sm text-gray-600 font-medium">IR Channel</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500 text-center">
              신호 품질: {signalQuality.ppg.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        {/* ACC 움직임 그래프 */}
        <Card className="bg-white border-gray-200 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg text-gray-700 flex items-center gap-2">
              <Move3d className="h-5 w-5 text-green-500" />
              움직임 총량 (가속도계)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-700 text-sm">
              활동 상태: {accAnalysis?.indices?.activityState || 'sitting'}
            </div>
            <div className="text-gray-700 text-sm">
              평균 움직임: {accAnalysis?.magnitude?.length > 0 ? `${accAnalysis.magnitude[accAnalysis.magnitude.length - 1].value.toFixed(2)} g` : '5.25 g'}
            </div>
            <div className="text-gray-700 text-sm">
              최대 움직임: {accAnalysis?.magnitude?.length > 0 ? `${Math.max(...accAnalysis.magnitude.map(m => m.value)).toFixed(2)} g` : '7.22 g'}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              움직임 상태: {signalQuality.accStatus}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 진행 상황 표시 */}
      {isMonitoring && isConnected && (
        <Card className="bg-white border-gray-200 shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-gray-700 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              신호 품질 안정화 확인 중... ({qualityTimer}/10초)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress 
              value={(qualityTimer / 10) * 100} 
              className="h-2"
            />
          </CardContent>
        </Card>
      )}

      {/* 액션 버튼들 */}
      <div className="flex gap-4 mt-auto">
        <Button 
          onClick={onBack}
          variant="outline"
          className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          이전 단계
        </Button>
        
        <Button 
          onClick={handleConfirm}
          disabled={!isConnected || qualityTimer < 10 || !isGoodQuality}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:text-gray-500"
        >
          {qualityTimer < 10
            ? `안정적인 신호 대기 중... ${qualityTimer}/10초`
            : '측정 시작하기'
          }
        </Button>
      </div>
    </div>
  );
} 