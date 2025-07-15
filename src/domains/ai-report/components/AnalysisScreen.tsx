import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card';
import { Activity, Loader } from 'lucide-react';

import type { PersonalInfo, AggregatedMeasurementData, AIAnalysisResponse } from '../types';

interface AnalysisScreenProps {
  onComplete: (result: AIAnalysisResponse) => void;
  onError: (error: string) => void;
  personalInfo: PersonalInfo;
  measurementData: AggregatedMeasurementData;
}

export function AnalysisScreen({ onComplete, onError, personalInfo, measurementData }: AnalysisScreenProps) {
  useEffect(() => {
    // 2초 후 더미 분석 결과 생성
    const timer = setTimeout(() => {
      const dummyResult: AIAnalysisResponse = {
        reportId: 'report-' + Date.now(),
        personalInfo,
        analysisResults: {
          mentalHealthScore: 78,
          physicalHealthScore: 82,
          stressLevel: 25,
          recommendations: [
            '매일 10분간 명상을 실천해보세요',
            '일주일에 3회 이상 운동하시기 바랍니다',
            '스트레스 관리를 위한 취미 활동을 늘려보세요',
            '충분한 수면을 취하세요'
          ],
          detailedAnalysis: `${personalInfo.name}님의 1분간 측정 결과를 분석했습니다. 전반적으로 양호한 상태를 보이고 있습니다. 뇌파 분석에서는 집중력과 이완 상태가 균형있게 나타났으며, 심박변이도는 정상 범위 내에 있습니다.`
        },
        generatedAt: new Date(),
        reliability: 'high'
      };

      onComplete(dummyResult);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete, personalInfo, measurementData]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Activity className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          AI 분석 중
        </h2>
        <p className="text-gray-700">
          측정된 데이터를 AI가 분석하고 있습니다.
        </p>
      </div>

      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">분석 진행 상황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Loader className="w-8 h-8 text-blue-500 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600 mb-2">AI가 데이터를 분석하고 있습니다...</p>
            <p className="text-sm text-gray-500">잠시만 기다려주세요</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center text-gray-700">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <span>데이터 품질 검증 완료</span>
            </div>
            <div className="flex items-center text-gray-700">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <span>뇌파 신호 분석 완료</span>
            </div>
            <div className="flex items-center text-gray-700">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <span>심박변이도 분석 완료</span>
            </div>
            <div className="flex items-center text-blue-600">
              <Loader className="w-4 h-4 mr-3 animate-spin" />
              <span>개인 맞춤 리포트 생성 중...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 