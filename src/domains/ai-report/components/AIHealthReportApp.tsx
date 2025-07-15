import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card';
import { Button } from '@ui/button';
import { Progress } from '@ui/progress';
import { AlertCircle, CheckCircle2, Clock, Activity, X } from 'lucide-react';

import { PersonalInfoScreen } from './PersonalInfoScreen';
import { DeviceConnectionScreen } from './DeviceConnectionScreen';
import { DataQualityScreen } from './DataQualityScreen';
import { MeasurementScreen } from './MeasurementScreen';
import { AnalysisScreen } from './AnalysisScreen';
import { ReportScreen } from './ReportScreen';

import type { 
  AIReportStep, 
  AIReportState, 
  PersonalInfo,
  AggregatedMeasurementData,
  AIAnalysisResponse 
} from '../types';

const STEPS: { key: AIReportStep; title: string; description: string; icon: React.ComponentType }[] = [
  { 
    key: 'personal-info', 
    title: '사용자 정보', 
    description: '개인 정보를 입력해주세요',
    icon: Activity
  },
  { 
    key: 'device-connection', 
    title: '디바이스 연결', 
    description: 'LINK BAND를 연결해주세요',
    icon: Activity
  },
  { 
    key: 'data-quality', 
    title: '착용 확인', 
    description: '디바이스 착용 상태를 확인해주세요',
    icon: CheckCircle2
  },
  { 
    key: 'measurement', 
    title: '1분 측정', 
    description: '1분간 데이터를 측정합니다',
    icon: Clock
  },
  { 
    key: 'analysis', 
    title: 'AI 분석', 
    description: 'AI가 데이터를 분석중입니다',
    icon: Activity
  },
  { 
    key: 'report', 
    title: '리포트 확인', 
    description: '생성된 건강 리포트를 확인하세요',
    icon: CheckCircle2
  }
];

interface AIHealthReportAppProps {
  onClose?: () => void;
}

export function AIHealthReportApp({ onClose }: AIHealthReportAppProps) {
  const [state, setState] = useState<AIReportState>({
    currentStep: 'personal-info',
    deviceStatus: {
      isConnected: false
    },
    dataQuality: {
      eegQuality: 0,
      ppgQuality: 0,
      accQuality: 0,
      overallQuality: 0
    },
    measurementProgress: {
      isActive: false,
      duration: 0,
      targetDuration: 60,
      progress: 0
    }
  });

  // 초기 상태
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null);
  
  // 더미 개인정보 (테스트용)
  const dummyPersonalInfo: PersonalInfo = {
    name: '홍길동',
    gender: 'male',
    birthDate: '1990-01-01',
    occupation: '소프트웨어 개발자',
    workConcerns: '장시간 코딩으로 인한 목과 어깨 통증, 야근으로 인한 수면 부족과 집중력 저하가 주요 고민입니다.'
  };

  const currentStepIndex = STEPS.findIndex(step => step.key === state.currentStep);
  const progressPercentage = ((currentStepIndex + 1) / STEPS.length) * 100;

  // 단계 이동 핸들러들
  const handlePersonalInfoComplete = useCallback((personalInfo: PersonalInfo) => {
    setState(prev => ({
      ...prev,
      personalInfo,
      currentStep: 'device-connection'
    }));
  }, []);

  const handleDeviceConnected = useCallback(() => {
    setState(prev => ({
      ...prev,
      deviceStatus: { ...prev.deviceStatus, isConnected: true },
      currentStep: 'data-quality'
    }));
  }, []);

  const handleDataQualityConfirmed = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: 'measurement'
    }));
  }, []);

  const handleMeasurementComplete = useCallback((measurementData: AggregatedMeasurementData) => {
    setState(prev => ({
      ...prev,
      measurementData,
      currentStep: 'analysis'
    }));
  }, []);

  const handleAnalysisComplete = useCallback((analysisResult: AIAnalysisResponse) => {
    setState(prev => ({
      ...prev,
      analysisResult,
      currentStep: 'report'
    }));
  }, []);

  const handleBack = useCallback(() => {
    const prevStepIndex = Math.max(0, currentStepIndex - 1);
    const prevStep = STEPS[prevStepIndex];
    setState(prev => ({
      ...prev,
      currentStep: prevStep.key,
      error: undefined
    }));
  }, [currentStepIndex]);

  const handleError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      error
    }));
  }, []);

  // 현재 단계에 따른 컴포넌트 렌더링
  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 'personal-info':
        return (
          <PersonalInfoScreen
            onComplete={handlePersonalInfoComplete}
            onError={handleError}
            initialData={state.personalInfo}
          />
        );
      
      case 'device-connection':
        return (
          <DeviceConnectionScreen
            onConnected={handleDeviceConnected}
            onError={handleError}
            deviceStatus={state.deviceStatus}
          />
        );
      
      case 'data-quality':
        return (
          <DataQualityScreen
            onQualityConfirmed={handleDataQualityConfirmed}
            onError={handleError}
            dataQuality={state.dataQuality}
          />
        );
      
      case 'measurement':
        return (
          <MeasurementScreen
            onComplete={handleMeasurementComplete}
            onError={handleError}
            progress={state.measurementProgress}
          />
        );
      
      case 'analysis':
        return (
          <AnalysisScreen
            onComplete={handleAnalysisComplete}
            onError={handleError}
            personalInfo={state.personalInfo!}
            measurementData={state.measurementData!}
          />
        );
      
      case 'report':
        return (
          <ReportScreen
            analysisResult={state.analysisResult!}
            onRestart={() => setState(prev => ({ ...prev, currentStep: 'personal-info' }))}
            onClose={onClose}
          />
        );
      
      default:
        return <div>알 수 없는 단계입니다.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <Card className="mb-6 bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-gray-900">
                AI Health Report 생성
              </CardTitle>
              {onClose && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </Button>
              )}
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>진행률</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} />
            </div>
          </CardHeader>
        </Card>

        {/* 단계 표시기 */}
        <Card className="mb-6 bg-white border border-gray-200 shadow-sm">
          <CardContent className="py-6">
            <div className="flex justify-between items-center overflow-x-auto">
              {STEPS.map((step, index) => {
                const isActive = step.key === state.currentStep;
                const isCompleted = index < currentStepIndex;
                const IconComponent = step.icon;
                
                return (
                  <div key={step.key} className="flex flex-col items-center flex-1 min-w-[100px]">
                    <div 
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-300
                        ${isActive ? 'bg-blue-600 text-white shadow-md' : 
                          isCompleted ? 'bg-green-500 text-white shadow-md' : 
                          'bg-gray-100 text-gray-400 border border-gray-200'}
                      `}
                    >
                      <IconComponent />
                    </div>
                    <div className="text-center">
                      <div className={`text-sm font-semibold mb-1 ${
                        isActive ? 'text-blue-600' : 
                        isCompleted ? 'text-green-600' : 
                        'text-gray-500'
                      }`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-500 leading-tight px-2">
                        {step.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 에러 표시 */}
        {state.error && (
          <Card className="mb-6 bg-red-50 border border-red-200 shadow-sm">
            <CardContent className="py-4">
              <div className="flex items-center text-red-700">
                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="font-medium">{state.error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 현재 단계 컴포넌트 */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-8">
            {renderCurrentStep()}
          </CardContent>
        </Card>

        {/* 하단 네비게이션 */}
        <Card className="mt-6 bg-white border border-gray-200 shadow-sm">
          <CardContent className="py-4">
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStepIndex === 0}
                className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                이전
              </Button>
              
              <Button
                variant="outline"
                onClick={onClose}
                className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                취소
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 