import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card';
import { Progress } from '@ui/progress';
import { Loader2, Brain, Heart, Activity } from 'lucide-react';

import type { PersonalInfo, AggregatedMeasurementData, AIAnalysisResponse } from '../types';

interface AnalysisScreenProps {
  onComplete: (analysisResult: AIAnalysisResponse) => void;
  onError: (error: string) => void;
  personalInfo: PersonalInfo;
  measurementData: AggregatedMeasurementData;
}

export function AnalysisScreen({ onComplete, onError, personalInfo, measurementData }: AnalysisScreenProps) {
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('preparing');
  
  const analysisSteps = [
    { key: 'preparing', label: '데이터 준비 중...', icon: Activity },
    { key: 'eeg_analysis', label: '뇌파 신호 분석 중...', icon: Brain },
    { key: 'ppg_analysis', label: '심박 신호 분석 중...', icon: Heart },
    { key: 'ai_processing', label: 'AI 모델 분석 중...', icon: Loader2 },
    { key: 'report_generation', label: '리포트 생성 중...', icon: Activity }
  ];

  const performAnalysis = useCallback(async () => {
    try {
      for (let i = 0; i < analysisSteps.length; i++) {
        setCurrentStep(analysisSteps[i].key);
        
        // 각 단계별 시뮬레이션
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 200));
          setAnalysisProgress((i * 100 + progress) / analysisSteps.length);
        }
      }

      // 분석 완료 - 실제로는 AI 서비스 호출
      const mockResult: AIAnalysisResponse = {
        reportId: `report_${Date.now()}`,
        personalInfo,
        analysisResults: {
          mentalHealthScore: Math.round(Math.random() * 40 + 60), // 60-100
          physicalHealthScore: Math.round(Math.random() * 40 + 60), // 60-100
          stressLevel: Math.round(Math.random() * 50 + 25), // 25-75
          recommendations: [
            '규칙적인 수면 패턴을 유지하세요',
            '스트레스 관리를 위한 명상이나 요가를 추천합니다',
            '적절한 운동으로 심혈관 건강을 개선하세요',
            '충분한 수분 섭취를 권장합니다'
          ],
          detailedAnalysis: `${personalInfo.name}님의 1분간 측정 결과를 분석한 결과, 전반적으로 양호한 상태를 보이고 있습니다. 뇌파 분석에서는 집중력과 이완 상태가 균형있게 나타났으며, 심박변이도는 정상 범위 내에 있습니다. 다만, 약간의 스트레스 지표가 관찰되므로 충분한 휴식과 스트레스 관리가 필요합니다.`
        },
        generatedAt: new Date(),
        reliability: measurementData.qualitySummary.qualityPercentage >= 80 ? 'high' : 'medium'
      };

      onComplete(mockResult);
    } catch (error) {
      onError(`분석 중 오류가 발생했습니다: ${error}`);
    }
  }, [analysisSteps, personalInfo, measurementData, onComplete, onError]);

  useEffect(() => {
    performAnalysis();
  }, [performAnalysis]);

  const currentStepInfo = analysisSteps.find(step => step.key === currentStep);
  const CurrentIcon = currentStepInfo?.icon || Loader2;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="relative">
          <CurrentIcon className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          AI 분석 진행 중
        </h2>
        <p className="text-gray-600">
          수집된 데이터를 AI가 분석하여 건강 리포트를 생성하고 있습니다.
        </p>
      </div>

      {/* 전체 진행률 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">분석 진행률</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {Math.round(analysisProgress)}%
            </div>
            <p className="text-sm text-gray-600">
              {currentStepInfo?.label || '분석 중...'}
            </p>
          </div>
          
          <Progress value={analysisProgress} className="w-full h-3" />
          
          <div className="text-xs text-gray-500 text-center">
            예상 소요 시간: 약 30-60초
          </div>
        </CardContent>
      </Card>

      {/* 분석 단계 */}
      <Card>
        <CardHeader>
          <CardTitle>분석 단계</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysisSteps.map((step, index) => {
              const isActive = step.key === currentStep;
              const isCompleted = analysisSteps.findIndex(s => s.key === currentStep) > index;
              const StepIcon = step.icon;
              
              return (
                <div key={step.key} className="flex items-center space-x-3">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    ${isActive ? 'bg-blue-500 text-white' : 
                      isCompleted ? 'bg-green-500 text-white' : 
                      'bg-gray-200 text-gray-500'}
                  `}>
                    {isCompleted ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <StepIcon className={`w-4 h-4 ${isActive ? 'animate-spin' : ''}`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                      {step.label}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {isCompleted ? '완료' : isActive ? '진행 중' : '대기'}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 분석 데이터 요약 */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">분석 데이터 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-blue-600">
                {measurementData.qualitySummary.totalDataPoints}
              </div>
              <div className="text-xs text-blue-700">총 데이터 포인트</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-600">
                {measurementData.qualitySummary.qualityPercentage}%
              </div>
              <div className="text-xs text-blue-700">데이터 품질</div>
            </div>
            <div>
              <div className="text-xl font-bold text-purple-600">
                {measurementData.measurementInfo.duration}초
              </div>
              <div className="text-xs text-blue-700">측정 시간</div>
            </div>
            <div>
              <div className="text-xl font-bold text-orange-600">
                {measurementData.qualitySummary.measurementReliability === 'high' ? '높음' : '보통'}
              </div>
              <div className="text-xs text-blue-700">신뢰도</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 분석 정보 */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              <strong>{personalInfo.name}</strong>님의 데이터를 분석하고 있습니다.
            </p>
            <p className="text-xs text-gray-500">
              분석이 완료되면 자동으로 리포트 화면으로 이동합니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 