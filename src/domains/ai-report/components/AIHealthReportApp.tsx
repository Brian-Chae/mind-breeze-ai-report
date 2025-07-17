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
import { auth, storage } from '../../../core/services/firebase';
import { signInAnonymously } from 'firebase/auth';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

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

interface AnalysisResults {
  mentalHealthScore: number;
  physicalHealthScore: number;
  stressLevel: number;
  recommendations: string[];
  detailedAnalysis: string;
}

export interface AIAnalysisResponse {
  reportId: string;
  personalInfo: any;
  analysisResults: AnalysisResults;
  generatedAt: Date;
  reliability: string;
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
      console.log('🚀🚀🚀 handleMeasurementComplete 함수 호출됨!');
      console.log('🔧 측정 데이터:', measurementData);
      console.log('🔧 Firebase auth 상태:', auth.currentUser ? '로그인됨' : '로그인되지 않음');
      console.log('🔧 현재 개인정보:', state.personalInfo);
      
      // 현재 사용자 정보 가져오기 (Firebase auth 사용)
      let currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('🔧 익명 인증으로 로그인 시도...');
        try {
          const userCredential = await signInAnonymously(auth);
          currentUser = userCredential.user;
          console.log('✅ 익명 인증 성공:', currentUser.uid);
        } catch (authError) {
          console.error('❌ 익명 인증 실패:', authError);
          setState(prev => ({ ...prev, error: '인증 실패: 데이터를 저장할 수 없습니다' }));
          return;
        }
      }

      console.log('✅ 현재 사용자:', currentUser.uid, currentUser.isAnonymous ? '(익명)' : currentUser.email);

      // 🔧 Storage에 센서 데이터 저장
      let storageUrl = '';
      let storagePath = '';
      try {
        console.log('🔧 Storage에 센서 데이터 저장 시작...');
        const sessionId = `measurement_${Date.now()}_${currentUser.uid.substring(0, 8)}`;
        
        // 센서 데이터 JSON 생성
        const sensorData = {
          sessionId,
          measurementInfo: measurementData.measurementInfo,
          rawData: {
            eeg: {
              summary: measurementData.eegSummary,
              dataPoints: 60 * 256, // 가정: 256Hz 샘플링으로 1분
              qualityScore: measurementData.eegSummary?.averageSQI || 80
            },
            ppg: {
              summary: measurementData.ppgSummary,
              dataPoints: 60 * 125, // 가정: 125Hz 샘플링으로 1분
              qualityScore: 90
            },
            acc: {
              summary: measurementData.accSummary,
              dataPoints: 60 * 50, // 가정: 50Hz 샘플링으로 1분
              qualityScore: 95
            }
          },
          qualitySummary: measurementData.qualitySummary,
          collectedAt: new Date().toISOString(),
          userId: currentUser.uid,
          subjectInfo: {
            name: state.personalInfo?.name || '알 수 없음',
            email: state.personalInfo?.email,
            gender: state.personalInfo?.gender,
            birthDate: state.personalInfo?.birthDate,
            occupation: state.personalInfo?.occupation,
            department: state.personalInfo?.department
          }
        };

        // Storage 경로: measurements/{userId}/{sessionId}/sensor_data.json
        storagePath = `measurements/${currentUser.uid}/${sessionId}/sensor_data.json`;
        const storageRef = ref(storage, storagePath);
        
        // JSON 문자열로 변환하여 업로드
        const jsonString = JSON.stringify(sensorData, null, 2);
        await uploadString(storageRef, jsonString, 'raw', {
          contentType: 'application/json'
        });
        
        // 다운로드 URL 얻기
        storageUrl = await getDownloadURL(storageRef);
        console.log('✅ Storage에 센서 데이터 저장 완료:', storageUrl);
        
      } catch (storageError) {
        console.error('❌ Storage 저장 실패:', storageError);
        // Storage 저장 실패해도 계속 진행
      }

      // 🔧 실제 personalInfo 데이터 사용
      const personalInfo = state.personalInfo;
      if (!personalInfo) {
        console.error('❌ 개인정보가 없습니다');
        setState(prev => ({ ...prev, error: '개인정보가 누락되었습니다' }));
        return;
      }

      // 1. MeasurementSession 저장
      const sessionDataRaw = {
        // 🔧 실제 입력된 개인정보 사용
        subjectName: personalInfo.name,
        subjectEmail: personalInfo.email,
        subjectGender: personalInfo.gender,
        subjectBirthDate: personalInfo.birthDate,
        subjectOccupation: personalInfo.occupation,
        subjectDepartment: personalInfo.department,
        
        // 측정 실행자 정보
        measuredByUserId: currentUser.uid,
        measuredByUserName: currentUser.isAnonymous ? '익명 사용자' : (currentUser.displayName || currentUser.email),
        isAnonymousUser: currentUser.isAnonymous || false,
        
        // 세션 정보
        sessionDate: new Date(measurementData.measurementInfo?.startTime || Date.now()),
        duration: measurementData.measurementInfo?.duration || 60,
        
        // 🔧 Storage URL 추가
        storageUrl: storageUrl || null,
        storagePath: storageUrl ? storagePath : null,
        
        // 분석 결과 요약
        overallScore: Math.round(measurementData.qualitySummary?.qualityPercentage || 0),
        stressLevel: measurementData.eegSummary?.stressIndex ? measurementData.eegSummary.stressIndex / 100 : 0,
        focusLevel: measurementData.eegSummary?.focusIndex ? measurementData.eegSummary.focusIndex / 100 : 0,
        relaxationLevel: measurementData.eegSummary?.relaxationIndex ? measurementData.eegSummary.relaxationIndex / 100 : 0,
        
        // 상태
        status: 'COMPLETED',
        reportGenerated: false
      };

      // 🔧 undefined 값들 제거 (Firebase는 undefined를 허용하지 않음)
      const sessionData = Object.fromEntries(
        Object.entries(sessionDataRaw).filter(([key, value]) => value !== undefined)
      );

      console.log('🔧 저장할 세션 데이터:', sessionData);

      let sessionId = '';
      try {
        sessionId = await FirebaseService.saveMeasurementSession(sessionData);
        console.log('✅ MeasurementSession 저장 완료:', sessionId);
      } catch (sessionError) {
        console.error('❌ MeasurementSession 저장 실패:', sessionError);
        console.error('❌ sessionError 상세:', sessionError instanceof Error ? sessionError.message : sessionError);
        throw sessionError;
      }

      // 2. 상세 측정 데이터 저장 (MeasurementDataService 사용)
      try {
        console.log('🔧 MeasurementDataService 생성 시작...');
        const measurementDataService = new MeasurementDataService();
        console.log('✅ MeasurementDataService 생성 완료');
        
        const detailedMeasurementData = {
          sessionId: sessionId,
          userId: currentUser.uid,
          measurementDate: new Date(measurementData.measurementInfo?.startTime || Date.now()),
          duration: measurementData.measurementInfo?.duration || 60,
          
          // 🔧 Storage 정보 추가
          storageUrl: storageUrl || null,
          
          deviceInfo: {
            serialNumber: 'LINKBAND_SIMULATOR',
            model: 'LINK_BAND_V4' as const,
            firmwareVersion: '1.0.0',
            batteryLevel: 85
          },
          
          eegMetrics: {
            delta: measurementData.eegSummary?.deltaPower || 0.25,
            theta: measurementData.eegSummary?.thetaPower || 0.30,
            alpha: measurementData.eegSummary?.alphaPower || 0.35,
            beta: measurementData.eegSummary?.betaPower || 0.40,
            gamma: measurementData.eegSummary?.gammaPower || 0.15,
            
            attentionIndex: measurementData.eegSummary?.attentionLevel || measurementData.eegSummary?.focusIndex || 75,
            meditationIndex: measurementData.eegSummary?.meditationLevel || measurementData.eegSummary?.relaxationIndex || 80,
            stressIndex: measurementData.eegSummary?.stressIndex || 25,
            fatigueIndex: (100 - (measurementData.eegSummary?.focusIndex || 75)),
            
            signalQuality: (measurementData.eegSummary?.averageSQI || 85) / 100,
            artifactRatio: 0.1
          },
          
          ppgMetrics: {
            heartRate: measurementData.ppgSummary?.bpm || 72,
            heartRateVariability: measurementData.ppgSummary?.rmssd || 45,
            rrIntervals: [],
            
            stressScore: 30,
            autonomicBalance: 0.8,
            
            signalQuality: 0.9,
            motionArtifact: 0.1
          },
          
          accMetrics: {
            activityLevel: measurementData.accSummary?.intensity || 20,
            movementVariability: measurementData.accSummary?.avgMovement || 15,
            postureStability: measurementData.accSummary?.stability || 85,
            movementIntensity: measurementData.accSummary?.intensity || 20,
            posture: 'UNKNOWN' as const,
            movementEvents: []
          },
          
          dataQuality: {
            overallScore: measurementData.qualitySummary?.qualityPercentage || 85,
            eegQuality: measurementData.eegSummary?.averageSQI || 85,
            ppgQuality: 90,
            motionInterference: 20,
            usableForAnalysis: (measurementData.qualitySummary?.qualityPercentage || 85) >= 70,
            qualityIssues: [],
            overallQuality: measurementData.qualitySummary?.qualityPercentage || 85,
            sensorContact: true,
            signalStability: measurementData.qualitySummary?.measurementReliability === 'high' ? 1.0 : 
                            measurementData.qualitySummary?.measurementReliability === 'medium' ? 0.7 : 0.4,
            artifactLevel: 0.1
          },
          
          processingVersion: '1.0.0',
          
          // 🔧 개인정보 추가 (AI 분석에서 사용)
          personalInfo: {
            name: state.personalInfo?.name || '알 수 없음',
            age: state.personalInfo?.birthDate ? new Date().getFullYear() - state.personalInfo.birthDate.getFullYear() : 30,
            gender: state.personalInfo?.gender === 'MALE' ? 'male' : state.personalInfo?.gender === 'FEMALE' ? 'female' : 'male',
            occupation: state.personalInfo?.occupation || 'office_worker',
            birthDate: state.personalInfo?.birthDate ? state.personalInfo.birthDate.toISOString().split('T')[0] : null
          }
        };

        console.log('🔧 저장할 상세 측정 데이터:', detailedMeasurementData);

        const measurementId = await measurementDataService.saveMeasurementData(detailedMeasurementData);
        console.log('✅ MeasurementData 저장 완료:', measurementId);
        
      } catch (detailError) {
        console.error('❌ MeasurementData 저장 실패:', detailError);
        console.error('❌ detailError 상세:', detailError instanceof Error ? detailError.message : detailError);
        console.error('❌ detailError stack:', detailError instanceof Error ? detailError.stack : 'No stack');
        // 세션은 저장되었으므로 계속 진행
      }

      // 3. 상태 업데이트 및 다음 단계로 이동
      setState(prev => ({
        ...prev,
        measurementData: {
          ...measurementData,
          sessionId: sessionId,
          storageUrl: storageUrl,
          savedAt: new Date()
        },
      }));
      
      console.log('✅ 측정 데이터 저장 프로세스 완료 - 분석 단계로 이동');
      navigateToStep('analysis');
      
    } catch (error) {
      console.error('❌ 전체 측정 데이터 저장 실패:', error);
      console.error('❌ error 상세:', error instanceof Error ? error.message : error);
      console.error('❌ error stack:', error instanceof Error ? error.stack : 'No stack');
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
                className="px-6 py-2 bg-white border-2 border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:border-gray-300 disabled:text-gray-400"
              >
                이전
              </Button>
              
              <Button
                variant="outline"
                onClick={onClose}
                className="px-6 py-2 bg-white border-2 border-gray-400 text-gray-700 hover:bg-gray-50 hover:border-gray-500"
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