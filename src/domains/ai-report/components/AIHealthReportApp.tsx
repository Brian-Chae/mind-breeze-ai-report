import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card';
import { Button } from '@ui/button';

import { AlertCircle, CheckCircle2, Clock, Activity, X } from 'lucide-react';

import { PersonalInfoScreen } from './PersonalInfoScreen';
import { DeviceConnectionScreen } from './DeviceConnectionScreen';
import { DataQualityScreen } from './DataQualityScreen';
import { MeasurementScreen } from './MeasurementScreen';
import { AnalysisScreen } from './AnalysisScreen';
import { ReportScreen } from './ReportScreen';

// 🔧 Firebase 저장을 위한 import 추가
import { FirebaseService } from '../../../core/services/FirebaseService';
import { MeasurementDataService } from '../services/MeasurementDataService';
import { auth } from '../../../core/services/firebase';

// 🔧 타입 정의 추가 (누락된 타입들)
export type AIReportStep = 'personal-info' | 'device-connection' | 'data-quality' | 'measurement' | 'analysis' | 'report';

export interface PersonalInfo {
  name: string;
  email?: string;
  birthDate?: Date;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  occupation?: string;
  department?: string;
  healthConditions?: string[];
}

export interface AggregatedMeasurementData {
  eegSummary?: {
    deltaPower?: number;
    thetaPower?: number;
    alphaPower?: number;
    betaPower?: number;
    gammaPower?: number;
    focusIndex?: number;
    relaxationIndex?: number;
    stressIndex?: number;
    hemisphericBalance?: number;
    cognitiveLoad?: number;
    emotionalStability?: number;
    attentionLevel?: number;
    meditationLevel?: number;
    averageSQI?: number;
    dataCount?: number;
  };
  ppgSummary?: {
    bpm?: number;
    sdnn?: number;
    rmssd?: number;
    pnn50?: number;
    lfPower?: number;
    hfPower?: number;
    lfHfRatio?: number;
    stressIndex?: number;
    spo2?: number;
    avnn?: number;
    pnn20?: number;
    sdsd?: number;
    hrMax?: number;
    hrMin?: number;
  };
  accSummary?: {
    activityState?: string;
    intensity?: number;
    stability?: number;
    avgMovement?: number;
    maxMovement?: number;
  };
  qualitySummary?: {
    totalDataPoints?: number;
    highQualityDataPoints?: number;
    qualityPercentage?: number;
    measurementReliability?: 'high' | 'medium' | 'low';
  };
  measurementInfo?: {
    startTime?: Date;
    endTime?: Date;
    duration?: number;
    environment?: string;
    notes?: string;
  };
  sessionId?: string;
  savedAt?: Date;
}

export interface AIAnalysisResponse {
  id: string;
  content: string;
  recommendations?: string[];
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  overallScore?: number;
  generatedAt?: Date;
}

export interface AIReportState {
  currentStep: AIReportStep;
  personalInfo?: PersonalInfo;
  deviceStatus: { isConnected: boolean };
  measurementData?: AggregatedMeasurementData;
  analysisResult?: AIAnalysisResponse;
  measurementProgress?: number;
  error?: string;
}

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
  const navigate = useNavigate();
  const params = useParams();

  // 상태 관리
  const [state, setState] = useState<AIReportState>({
    currentStep: 'personal-info',
    deviceStatus: { isConnected: false },
  });

  // URL에서 현재 단계 가져오기
  const getCurrentStepFromUrl = (): AIReportStep => {
    const urlStep = params.step as AIReportStep;
    const validSteps: AIReportStep[] = ['personal-info', 'device-connection', 'data-quality', 'measurement', 'analysis', 'report'];
    return validSteps.includes(urlStep) ? urlStep : 'personal-info';
  };

  // 현재 단계 인덱스
  const currentStepIndex = STEPS.findIndex(step => step.key === state.currentStep);

  // 초기화 시 URL에서 단계 설정
  useEffect(() => {
    const urlStep = getCurrentStepFromUrl();
    setState(prev => ({
      ...prev,
      currentStep: urlStep
    }));
  }, [params.step]);

  // 단계 이동 함수 (URL 업데이트)
  const navigateToStep = useCallback((step: AIReportStep) => {
    setState(prev => ({
      ...prev,
      currentStep: step,
      error: undefined
    }));
    navigate(`/ai-report/${step}`);
  }, [navigate]);

  // 단계 이동 핸들러들
  const handlePersonalInfoComplete = useCallback((personalInfo: PersonalInfo) => {
    setState(prev => ({
      ...prev,
      personalInfo,
    }));
    navigateToStep('device-connection');
  }, [navigateToStep]);

  const handleDeviceConnected = useCallback(() => {
    setState(prev => ({
      ...prev,
      deviceStatus: { ...prev.deviceStatus, isConnected: true },
    }));
    navigateToStep('data-quality');
  }, [navigateToStep]);

  const handleDataQualityConfirmed = useCallback(() => {
    navigateToStep('measurement');
  }, [navigateToStep]);

  const handleDataQualityModeChange = useCallback((mode: 'quality' | 'measurement') => {
    // DataQualityScreen에서 measurement 모드로 전환될 때 단계 표시만 변경
    if (mode === 'measurement' && state.currentStep === 'data-quality') {
      setState(prev => ({
        ...prev,
        currentStep: 'measurement'
      }));
      // URL은 변경하지 않고 내부 상태만 변경
    }
  }, [state.currentStep]);

  const handleMeasurementComplete = useCallback(async (measurementData: AggregatedMeasurementData) => {
    try {
      console.log('🔧 측정 완료 - Firebase 저장 시작:', measurementData);
      
      // 현재 사용자 정보 가져오기 (Firebase auth 사용)
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('❌ 사용자 정보가 없어서 저장할 수 없습니다');
        setState(prev => ({ ...prev, error: '사용자 정보가 없어서 저장할 수 없습니다' }));
        return;
      }

      // 1. MeasurementSession 저장
      const sessionData = {
        subjectName: state.personalInfo?.name || '알 수 없음',
        subjectEmail: state.personalInfo?.email,
        subjectGender: state.personalInfo?.gender,
        subjectBirthDate: state.personalInfo?.birthDate,
        
        // 측정 실행자 정보
        measuredByUserId: currentUser.uid,
        measuredByUserName: currentUser.displayName || currentUser.email,
        
        // 세션 정보
        sessionDate: new Date(measurementData.measurementInfo?.startTime || Date.now()),
        duration: measurementData.measurementInfo?.duration || 60,
        
        // 분석 결과 요약
        overallScore: Math.round(measurementData.qualitySummary?.qualityPercentage || 0),
        stressLevel: measurementData.eegSummary?.stressIndex ? measurementData.eegSummary.stressIndex / 100 : 0,
        focusLevel: measurementData.eegSummary?.focusIndex ? measurementData.eegSummary.focusIndex / 100 : 0,
        relaxationLevel: measurementData.eegSummary?.relaxationIndex ? measurementData.eegSummary.relaxationIndex / 100 : 0,
        
        // 상태
        status: 'COMPLETED',
        reportGenerated: false
      };

      const sessionId = await FirebaseService.saveMeasurementSession(sessionData);
      console.log('✅ MeasurementSession 저장 완료:', sessionId);

      // 2. 상세 측정 데이터 저장 (MeasurementDataService 사용)
      try {
        const measurementDataService = new MeasurementDataService();
        
        const detailedMeasurementData = {
          sessionId,
          userId: currentUser.uid,
          measurementDate: new Date(measurementData.measurementInfo?.startTime || Date.now()),
          duration: measurementData.measurementInfo?.duration || 60,
          
          deviceInfo: {
            serialNumber: 'LINKBAND_SIMULATOR', // 실제 디바이스 연결 시 실제 값으로 변경
            model: 'LINK_BAND_V4' as const,
            firmwareVersion: '1.0.0',
            batteryLevel: 85
          },
          
          eegMetrics: {
            delta: measurementData.eegSummary?.deltaPower || 0,
            theta: measurementData.eegSummary?.thetaPower || 0,
            alpha: measurementData.eegSummary?.alphaPower || 0,
            beta: measurementData.eegSummary?.betaPower || 0,
            gamma: measurementData.eegSummary?.gammaPower || 0,
            
            attentionIndex: measurementData.eegSummary?.attentionLevel || 0,
            meditationIndex: measurementData.eegSummary?.meditationLevel || 0,
            stressIndex: measurementData.eegSummary?.stressIndex || 0,
            fatigueIndex: (100 - (measurementData.eegSummary?.focusIndex || 50)), // 역산으로 계산
            
            signalQuality: measurementData.eegSummary?.averageSQI ? measurementData.eegSummary.averageSQI / 100 : 0,
            artifactRatio: 0.1 // 기본값
          },
          
          ppgMetrics: {
            heartRate: measurementData.ppgSummary?.bpm || 0,
            heartRateVariability: measurementData.ppgSummary?.rmssd || 0,
            rrIntervals: [], // 실제 RR 간격 데이터는 추가 구현 필요
            
            stressScore: measurementData.ppgSummary?.stressIndex || 0,
            autonomicBalance: measurementData.ppgSummary?.lfHfRatio || 0,
            
            signalQuality: 0.8, // 기본값 - 실제 PPG SQI 데이터로 변경 필요
            motionArtifact: 0.1
          },
          
          accMetrics: {
            activityLevel: measurementData.accSummary?.intensity || 0,
            movementVariability: measurementData.accSummary?.avgMovement || 0,
            postureStability: measurementData.accSummary?.stability || 0,
            movementIntensity: measurementData.accSummary?.intensity || 0,
            posture: 'UNKNOWN' as const, // 기본값
            movementEvents: [] // 기본값
          },
          
          dataQuality: {
            overallScore: measurementData.qualitySummary?.qualityPercentage || 0,
            eegQuality: measurementData.eegSummary?.averageSQI || 80,
            ppgQuality: 80, // 기본값 - 실제 PPG SQI 데이터로 변경 필요
            motionInterference: 20, // 기본값
            usableForAnalysis: (measurementData.qualitySummary?.qualityPercentage || 0) >= 70,
            qualityIssues: [],
            overallQuality: measurementData.qualitySummary?.qualityPercentage || 0,
            sensorContact: true, // 기본값
            signalStability: measurementData.qualitySummary?.measurementReliability === 'high' ? 1.0 : 
                            measurementData.qualitySummary?.measurementReliability === 'medium' ? 0.7 : 0.4,
            artifactLevel: 0.1 // 기본값
          },
          
          processingVersion: '1.0.0' // 필수 필드 추가
        };

        const measurementId = await measurementDataService.saveMeasurementData(detailedMeasurementData);
        console.log('✅ MeasurementData 저장 완료:', measurementId);
        
      } catch (detailError) {
        console.error('❌ MeasurementData 저장 실패 (세션은 저장됨):', detailError);
        // 세션은 저장되었으므로 계속 진행
      }

      // 3. 상태 업데이트 및 다음 단계로 이동
      setState(prev => ({
        ...prev,
        measurementData: {
          ...measurementData,
          sessionId, // sessionId 추가
          savedAt: new Date()
        },
      }));
      
      console.log('✅ 측정 데이터 저장 완료 - 분석 단계로 이동');
      navigateToStep('analysis');
      
    } catch (error) {
      console.error('❌ 측정 데이터 저장 실패:', error);
      setState(prev => ({ 
        ...prev, 
        error: `데이터 저장 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}` 
      }));
      
      // 저장은 실패했지만 분석은 계속 진행할 수 있도록 함
      setState(prev => ({
        ...prev,
        measurementData,
      }));
      navigateToStep('analysis');
    }
  }, [navigateToStep, state.personalInfo]);

  const handleAnalysisComplete = useCallback((analysisResult: AIAnalysisResponse) => {
    setState(prev => ({
      ...prev,
      analysisResult,
    }));
    navigateToStep('report');
  }, [navigateToStep]);

  const handleBack = useCallback(() => {
    const prevStepIndex = Math.max(0, currentStepIndex - 1);
    const prevStep = STEPS[prevStepIndex];
    navigateToStep(prevStep.key);
  }, [currentStepIndex, navigateToStep]);

  const handleError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      error,
    }));
  }, []);

  const handleRestart = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: 'personal-info',
      personalInfo: undefined,
      measurementData: undefined,
      analysisResult: undefined,
      error: undefined
    }));
    navigateToStep('personal-info');
  }, [navigateToStep]);

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
            onConnectionSuccess={handleDeviceConnected}
            onBack={handleBack}
            onError={handleError}
          />
        );
      
      case 'data-quality':
        return (
          <DataQualityScreen
            onQualityConfirmed={handleDataQualityConfirmed}
            onBack={handleBack}
            onError={handleError}
            onModeChange={handleDataQualityModeChange}
            onMeasurementComplete={handleMeasurementComplete}
          />
        );
        
      case 'measurement':
        // DataQualityScreen에서 measurement 모드로 전환된 경우 계속 DataQualityScreen 표시
        if (state.currentStep === 'measurement' && !state.measurementData) {
          return (
            <DataQualityScreen
              onQualityConfirmed={handleDataQualityConfirmed}
              onBack={handleBack}
              onError={handleError}
              onModeChange={handleDataQualityModeChange}
              onMeasurementComplete={handleMeasurementComplete}
            />
          );
        }
        // 정상적인 measurement 단계인 경우 MeasurementScreen 표시
        return (
          <MeasurementScreen
            onComplete={handleMeasurementComplete}
            onBack={handleBack}
            onError={handleError}
            progress={state.measurementProgress}
          />
        );
      
      case 'analysis':
        return (
          <AnalysisScreen
            onComplete={handleAnalysisComplete}
            onBack={handleBack}
            onError={handleError}
            personalInfo={state.personalInfo!}
            measurementData={state.measurementData!}
          />
        );
      
      case 'report':
        return (
          <ReportScreen
            analysisResult={state.analysisResult!}
            onRestart={handleRestart}
            onClose={onClose}
          />
        );
      
      default:
        return <div className="text-gray-900">알 수 없는 단계입니다.</div>;
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
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/admin/ai-report')}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </Button>
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