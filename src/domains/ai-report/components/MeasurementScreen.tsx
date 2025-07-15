import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card';
import { Progress } from '@ui/progress';
import { Clock, Play, Pause, Square } from 'lucide-react';

import type { MeasurementProgress, AggregatedMeasurementData } from '../types';

interface MeasurementScreenProps {
  onComplete: (measurementData: AggregatedMeasurementData) => void;
  onError: (error: string) => void;
  progress: MeasurementProgress;
}

export function MeasurementScreen({ onComplete, onError, progress }: MeasurementScreenProps) {
  const [currentProgress, setCurrentProgress] = useState(progress);
  const [dataCollected, setDataCollected] = useState(0);

  const handleStart = useCallback(() => {
    setCurrentProgress(prev => ({
      ...prev,
      isActive: true,
      startTime: new Date(),
      duration: 0
    }));
  }, []);

  const handleStop = useCallback(() => {
    setCurrentProgress(prev => ({
      ...prev,
      isActive: false
    }));
  }, []);

  const handleComplete = useCallback(() => {
    // TODO: 실제 1분간 수집된 데이터를 집계하여 전송
    const mockData: AggregatedMeasurementData = {
      eegSummary: {
        deltaPower: 0, thetaPower: 0, alphaPower: 0, betaPower: 0, gammaPower: 0,
        focusIndex: 0, relaxationIndex: 0, stressIndex: 0, hemisphericBalance: 0,
        cognitiveLoad: 0, emotionalStability: 0, attentionLevel: 0, meditationLevel: 0,
        averageSQI: 0, dataCount: 0
      },
      ppgSummary: {
        heartRate: 0, hrv: 0, rmssd: 0, pnn50: 0, stressLevel: 0,
        recoveryIndex: 0, autonomicBalance: 0, cardiacCoherence: 0, respiratoryRate: 0,
        oxygenSaturation: 0, perfusionIndex: 0, vascularTone: 0, cardiacEfficiency: 0,
        metabolicRate: 0, averageSQI: 0, dataCount: 0
      },
      accSummary: {
        activityLevel: 0, motionPattern: 0, posturalStability: 0,
        movementQuality: 0, energyExpenditure: 0, averageQuality: 0, dataCount: 0
      },
      qualitySummary: {
        totalDataPoints: dataCollected,
        highQualityDataPoints: Math.round(dataCollected * 0.85),
        qualityPercentage: 85,
        measurementReliability: 'high'
      },
      measurementInfo: {
        startTime: currentProgress.startTime || new Date(),
        endTime: new Date(),
        duration: 60,
        environment: 'controlled'
      }
    };
    
    onComplete(mockData);
  }, [currentProgress.startTime, dataCollected, onComplete]);

  useEffect(() => {
    if (!currentProgress.isActive) return;

    const interval = setInterval(() => {
      setCurrentProgress(prev => {
        const newDuration = prev.duration + 1;
        const newProgress = (newDuration / prev.targetDuration) * 100;
        
        if (newDuration >= prev.targetDuration) {
          handleComplete();
          return { ...prev, isActive: false, duration: prev.targetDuration, progress: 100 };
        }
        
        return { ...prev, duration: newDuration, progress: newProgress };
      });
      
      setDataCollected(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentProgress.isActive, handleComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const remainingTime = currentProgress.targetDuration - currentProgress.duration;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Clock className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          1분 데이터 측정
        </h2>
        <p className="text-gray-600">
          1분간 가만히 앉아서 데이터를 측정합니다.
        </p>
      </div>

      {/* 메인 타이머 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">측정 진행률</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 원형 진행률 표시 */}
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center w-32 h-32">
              {/* 배경 원 */}
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="transparent"
                  className="text-gray-200"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - currentProgress.progress / 100)}`}
                  className="text-blue-500 transition-all duration-300 ease-in-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-800">
                  {formatTime(remainingTime)}
                </span>
                <span className="text-sm text-gray-500">남은 시간</span>
              </div>
            </div>
          </div>

          {/* 선형 진행률 바 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>진행률</span>
              <span>{Math.round(currentProgress.progress)}%</span>
            </div>
            <Progress value={currentProgress.progress} className="w-full h-3" />
          </div>

          {/* 측정 상태 */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {formatTime(currentProgress.duration)}
              </div>
              <div className="text-sm text-gray-500">경과 시간</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {dataCollected}
              </div>
              <div className="text-sm text-gray-500">수집된 데이터</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((dataCollected / 60) * 100)}%
              </div>
              <div className="text-sm text-gray-500">목표 달성률</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 측정 안내 */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="font-semibold text-blue-800 mb-2">측정 중 주의사항</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 편안한 자세로 앉아 있어주세요</li>
              <li>• 가능한 한 움직임을 최소화해주세요</li>
              <li>• 자연스럽게 호흡하세요</li>
              <li>• 스마트폰이나 기타 기기를 만지지 말아주세요</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 컨트롤 버튼 */}
      <div className="flex justify-center space-x-4">
        {!currentProgress.isActive && currentProgress.duration === 0 && (
          <Button onClick={handleStart} className="px-8">
            <Play className="w-4 h-4 mr-2" />
            측정 시작
          </Button>
        )}
        
        {currentProgress.isActive && (
          <Button onClick={handleStop} variant="outline" className="px-8">
            <Pause className="w-4 h-4 mr-2" />
            일시 정지
          </Button>
        )}
        
        {!currentProgress.isActive && currentProgress.duration > 0 && currentProgress.duration < currentProgress.targetDuration && (
          <Button onClick={handleStart} className="px-8">
            <Play className="w-4 h-4 mr-2" />
            재개
          </Button>
        )}
      </div>
    </div>
  );
} 