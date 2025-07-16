import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card';
import { Progress } from '@ui/progress';
import { Badge } from '@ui/badge';
import { Alert, AlertDescription } from '@ui/alert';
import { CheckCircle2, AlertCircle, Activity, Brain, Heart, Move3d, Clock } from 'lucide-react';

// 기존 hook들 import
import { 
  useEEGGraphData, 
  usePPGGraphData, 
  useACCAnalysis,
  useConnectionState,
  useEEGSQIData,
  usePPGSQIData,
  useDeviceStatus
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
  const { isSensorContacted } = useDeviceStatus();
  const eegGraphData = useEEGGraphData();
  const ppgGraphData = usePPGGraphData();
  const accAnalysis = useACCAnalysis();
  const eegSQIData = useEEGSQIData();
  const ppgSQIData = usePPGSQIData();

  // 신호 품질 계산
  const signalQuality = useMemo(() => {
    try {
      // EEG SQI: ch1, ch2 SQI 평균값 (최근 100개 샘플)
      let eegQuality = 0;
      if (eegSQIData?.ch1SQI?.length > 0 && eegSQIData?.ch2SQI?.length > 0) {
        const recentCh1 = eegSQIData.ch1SQI.slice(-100);
        const recentCh2 = eegSQIData.ch2SQI.slice(-100);
        
        const avgCh1 = recentCh1.reduce((sum, p) => sum + p.value, 0) / recentCh1.length;
        const avgCh2 = recentCh2.reduce((sum, p) => sum + p.value, 0) / recentCh2.length;
        
        eegQuality = (avgCh1 + avgCh2) / 2;
      }

      // PPG SQI: overallSQI 평균값 (최근 100개 샘플)
      let ppgQuality = 0;
      if (ppgSQIData?.overallSQI?.length > 0) {
        const recentOverall = ppgSQIData.overallSQI.slice(-100);
        ppgQuality = recentOverall.reduce((sum, p) => sum + p.value, 0) / recentOverall.length;
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

  // 품질 기준 체크 (80% 이상)
  const qualityThreshold = 80;
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
    if (quality >= 80) return { 
      status: 'good', 
      color: 'text-green-400 bg-green-500/20', 
      icon: CheckCircle2,
      label: '양호'
    };
    if (quality >= 60) return { 
      status: 'medium', 
      color: 'text-yellow-400 bg-yellow-500/20', 
      icon: AlertCircle,
      label: '보통'
    };
    return { 
      status: 'poor', 
      color: 'text-red-400 bg-red-500/20', 
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
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-200 mb-2">
          🔍 디바이스 착용 및 신호 품질 확인
        </h1>
        <p className="text-gray-400">
          정확한 측정을 위해 센서 접촉과 신호 품질을 확인해주세요.
        </p>
      </div>

      {/* 연결 상태 확인 */}
      {!isConnected && (
        <Alert className="mb-6 border-red-500/30 bg-red-500/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-300">
            디바이스가 연결되지 않았습니다. 이전 단계로 돌아가서 디바이스를 연결해주세요.
          </AlertDescription>
        </Alert>
      )}

      {/* 센서 접촉 상태 경고 */}
      {isConnected && !isSensorContacted && (
        <Alert className="mb-6 border-red-500/30 bg-red-500/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-300">
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
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4 text-blue-400" />
              EEG 신호
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-200 mb-1">
              {signalQuality.eeg.toFixed(0)}%
            </div>
            <Badge className={getQualityStatus(signalQuality.eeg).color}>
              {getQualityStatus(signalQuality.eeg).label}
            </Badge>
          </CardContent>
        </Card>

        {/* PPG 품질 */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-400" />
              PPG 신호
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-200 mb-1">
              {signalQuality.ppg.toFixed(0)}%
            </div>
            <Badge className={getQualityStatus(signalQuality.ppg).color}>
              {getQualityStatus(signalQuality.ppg).label}
            </Badge>
          </CardContent>
        </Card>

        {/* ACC 상태 */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Move3d className="h-4 w-4 text-green-400" />
              움직임 상태
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-gray-200 mb-1">
              {signalQuality.accStatus}
            </div>
            <Badge className={signalQuality.acc >= 80 ? 'text-green-400 bg-green-500/20' : 'text-red-400 bg-red-500/20'}>
              {accAnalysis?.indices?.activityState || 'unknown'}
            </Badge>
          </CardContent>
        </Card>

        {/* 전체 품질 */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-400" />
              전체 품질
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-200 mb-1">
              {signalQuality.overall.toFixed(0)}%
            </div>
            <Badge className={getQualityStatus(signalQuality.overall).color}>
              {getQualityStatus(signalQuality.overall).label}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* 실시간 신호 그래프들 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 flex-1">
        {/* EEG 신호 그래프 */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-400" />
              EEG 뇌파 신호 (FP1, FP2)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-300 text-sm">
              FP1: {eegGraphData?.fp1?.length > 0 ? `${eegGraphData.fp1[eegGraphData.fp1.length - 1].value.toFixed(2)} μV` : '데이터 없음'}
            </div>
            <div className="text-gray-300 text-sm">
              FP2: {eegGraphData?.fp2?.length > 0 ? `${eegGraphData.fp2[eegGraphData.fp2.length - 1].value.toFixed(2)} μV` : '데이터 없음'}
            </div>
            <div className="mt-2 text-xs text-gray-400">
              신호 품질: {signalQuality.eeg.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        {/* PPG 신호 그래프 */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-400" />
              PPG 심박 신호 (IR, Red)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-300 text-sm">
              IR: {ppgGraphData?.ir?.length > 0 ? `${ppgGraphData.ir[ppgGraphData.ir.length - 1].value.toFixed(2)}` : '데이터 없음'}
            </div>
            <div className="text-gray-300 text-sm">
              Red: {ppgGraphData?.red?.length > 0 ? `${ppgGraphData.red[ppgGraphData.red.length - 1].value.toFixed(2)}` : '데이터 없음'}
            </div>
            <div className="mt-2 text-xs text-gray-400">
              신호 품질: {signalQuality.ppg.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        {/* ACC 움직임 그래프 */}
        <Card className="bg-gray-800 border-gray-700 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Move3d className="h-5 w-5 text-green-400" />
              움직임 총량 (가속도계)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-300 text-sm">
              활동 상태: {accAnalysis?.indices?.activityState || 'unknown'}
            </div>
            <div className="text-gray-300 text-sm">
              평균 움직임: {accAnalysis?.indices?.avgMovement?.toFixed(2) || '0.00'} g
            </div>
            <div className="text-gray-300 text-sm">
              최대 움직임: {accAnalysis?.indices?.maxMovement?.toFixed(2) || '0.00'} g
            </div>
            <div className="mt-2 text-xs text-gray-400">
              움직임 상태: {signalQuality.accStatus}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 품질 확인 진행 상황 */}
      {isGoodQuality && (
        <Card className="bg-green-900/20 border-green-500/30 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-green-400" />
              <div className="flex-1">
                <div className="font-medium text-green-300">
                  신호 품질 안정화 확인 중... ({qualityTimer}/10초)
                </div>
                <Progress 
                  value={(qualityTimer / 10) * 100} 
                  className="mt-2 h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 컨트롤 버튼들 */}
      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline">
          이전 단계
        </Button>
        
        <Button 
          onClick={handleConfirm}
          disabled={!isConnected || qualityTimer < 10 || !isGoodQuality}
          className="bg-blue-600 hover:bg-blue-700"
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