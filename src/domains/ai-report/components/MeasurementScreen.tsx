import React from 'react';
import { Button } from '@ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card';
import { Clock } from 'lucide-react';

import type { MeasurementProgress, AggregatedMeasurementData } from '../types';

interface MeasurementScreenProps {
  onComplete: (data: AggregatedMeasurementData) => void;
  onBack: () => void;
  onError: (error: string) => void;
  progress: MeasurementProgress;
}

export function MeasurementScreen({ onComplete, onBack, onError, progress }: MeasurementScreenProps) {
  const handleStartMeasurement = () => {
    // 임시 더미 데이터 (타입에 맞게 간단히)
    const dummyData: AggregatedMeasurementData = {
      eegSummary: {
        deltaPower: 0.25,
        thetaPower: 0.30,
        alphaPower: 0.35,
        betaPower: 0.40,
        gammaPower: 0.15,
        focusIndex: 75,
        relaxationIndex: 80,
        stressIndex: 25,
        hemisphericBalance: 0.95,
        cognitiveLoad: 60,
        emotionalStability: 85,
        attentionLevel: 82,
        meditationLevel: 75,
        averageSQI: 88,
        dataCount: 158
      },
      ppgSummary: {
        heartRate: 72,
        hrv: 45.2,
        rmssd: 38.5,
        pnn50: 15.8,
        stressLevel: 30,
        recoveryIndex: 85,
        autonomicBalance: 0.8,
        cardiacCoherence: 75,
        respiratoryRate: 16,
        oxygenSaturation: 98,
        perfusionIndex: 2.1,
        vascularTone: 80,
        cardiacEfficiency: 88,
        metabolicRate: 1800,
        averageSQI: 92,
        dataCount: 165
      },
      accSummary: {
        activityLevel: 1.2,
        motionPattern: 95,
        posturalStability: 90,
        movementQuality: 85,
        energyExpenditure: 120,
        averageQuality: 98,
        dataCount: 180
      },
      qualitySummary: {
        totalDataPoints: 180,
        highQualityDataPoints: 165,
        qualityPercentage: 93,
        measurementReliability: 'high'
      },
      measurementInfo: {
        startTime: new Date(),
        endTime: new Date(Date.now() + 60000),
        duration: 60,
        environment: 'quiet'
      }
    };

    setTimeout(() => {
      onComplete(dummyData);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Clock className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          1분 측정
        </h2>
        <p className="text-gray-700">
          1분간 안정된 자세를 유지하며 측정을 진행합니다.
        </p>
      </div>

      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">측정 진행</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-500 mb-4">1:00</div>
            <p className="text-gray-600 mb-6">측정을 시작하려면 버튼을 눌러주세요</p>
            <Button 
              onClick={handleStartMeasurement}
              className="px-8 py-3 text-white bg-blue-500 hover:bg-blue-600"
            >
              측정 시작
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 