/**
 * AI Health Report 메인 애플리케이션 컴포넌트
 */

import React, { useState, useEffect } from 'react';
import { ApplicationProps } from '../../shared/types';
import { HomeScreen } from './HomeScreen';
import { PersonalInfoScreen } from './PersonalInfoScreen';
import { MeasurementScreen } from './MeasurementScreen';
import AnalysisScreen from './AnalysisScreen';
import HistoryScreen from './HistoryScreen';
import ReportDetailScreen from './ReportDetailScreen';
import TrendsAnalysisScreen from './TrendsAnalysisScreen';
import EEGAnalysisScreen from './EEGAnalysisScreen';
import PPGAnalysisScreen from './PPGAnalysisScreen';
import { PersonalInfo, MeasurementData, AIAnalysisResult } from '../types';
import { GeminiAIService } from '../services/GeminiAIService';
import ReportStorage from '../services/ReportStorage';
import { Brain, Heart, Clock, Zap, Target } from 'lucide-react';
import { runAllDynamicIntegrationTests } from '../utils/testDynamicIntegration';
import { TestDynamicIntegration } from './TestDynamicIntegration';
import { toast } from 'sonner';

type Screen = 'home' | 'personalInfo' | 'measurement' | 'analysis' | 'history' | 'reportDetail' | 'trends' | 'eegAnalysis' | 'ppgAnalysis' | 'testDynamicIntegration';

export function AIHealthReportApp({ context }: ApplicationProps) {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null);
  const [measurementData, setMeasurementData] = useState<MeasurementData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [currentAnalysisStep, setCurrentAnalysisStep] = useState(0);
  
  // 🆕 에러 상태 관리
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  
  // 🆕 저장 상태 관리
  const [isSaving, setIsSaving] = useState(false);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  
  // ReportStorage 인스턴스
  const reportStorage = ReportStorage.getInstance();

  // 현재 화면에 따라 이전 버튼 표시 여부 결정
  const shouldShowBackButton = currentScreen !== 'home';
  
  // window 객체를 통해 상태 공유 (ApplicationRunner에서 사용)
  useEffect(() => {
    (window as any).__aiHealthReportAppState = {
      currentScreen,
      shouldShowBackButton,
      handleBack
    };
  }, [currentScreen, shouldShowBackButton]);

  // 🔧 개발 환경에서 테스트 함수를 전역으로 노출
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      (window as any).testDynamicIntegration = runAllDynamicIntegrationTests;
      (window as any).showTestScreen = () => setCurrentScreen('testDynamicIntegration');
      console.log('🧪 테스트 함수가 전역으로 노출되었습니다.');
      console.log('- testDynamicIntegration(): 콘솔에서 테스트 실행');
      console.log('- showTestScreen(): 테스트 화면 표시');
    }
  }, []);

  const handleStartNewMeasurement = () => {
    setCurrentScreen('personalInfo');
  };

  const handleViewHistory = () => {
    setCurrentScreen('history');
  };

  const handleViewTrends = () => {
    setCurrentScreen('trends');
  };

  const handleViewEEGAnalysis = () => {
    setCurrentScreen('eegAnalysis');
  };

  const handleViewPPGAnalysis = () => {
    setCurrentScreen('ppgAnalysis');
  };

  const handleViewReport = (reportId: string) => {
    setSelectedReportId(reportId);
    setCurrentScreen('reportDetail');
  };

  // 🆕 분석 결과 자동 저장 함수
  const saveAnalysisResult = async (result: AIAnalysisResult, currentPersonalInfo?: PersonalInfo, currentMeasurementData?: MeasurementData) => {
    const infoToUse = currentPersonalInfo || personalInfo;
    const dataToUse = currentMeasurementData || measurementData;
    
    if (!infoToUse || !dataToUse) {
      console.error('🚨 저장 실패: 개인정보 또는 측정 데이터가 없습니다.');
      console.log('🔍 디버그 정보:', { 
        infoToUse: !!infoToUse, 
        dataToUse: !!dataToUse, 
        personalInfo: !!personalInfo, 
        measurementData: !!measurementData 
      });
      return;
    }

    try {
      setIsSaving(true);
      console.log('💾 리포트 저장 시작...');
      
      // 태그 생성 (점수 기반)
      const tags = [];
      const score = result.overallHealth.score;
      if (score >= 80) tags.push('우수');
      else if (score >= 60) tags.push('보통');
      else tags.push('주의');
      
      if (result.detailedAnalysis.stressLevel.score < 40) tags.push('고스트레스');
      if (result.detailedAnalysis.mentalHealth.score >= 80) tags.push('정신건강양호');
      if (result.detailedAnalysis.physicalHealth.score >= 80) tags.push('신체건강양호');
      
      // 리포트 저장
      const reportId = await reportStorage.saveReport(
        infoToUse,
        result,
        dataToUse,
        tags,
        isUsingFallback ? '테스트 분석 결과 (AI 분석 실패로 인한 대체)' : undefined
      );
      
      setSavedReportId(reportId);
      console.log('✅ 리포트 저장 완료:', reportId);
      
      // 성공 알림
      toast.success('건강 리포트가 저장되었습니다!', {
        description: '히스토리에서 언제든지 다시 확인할 수 있습니다.',
        duration: 4000,
      });
      
    } catch (error) {
      console.error('🚨 리포트 저장 실패:', error);
      toast.error('리포트 저장에 실패했습니다.', {
        description: '다시 시도해주세요.',
        duration: 4000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackToHistory = () => {
    setSelectedReportId(null);
    setCurrentScreen('history');
  };

  const handlePersonalInfoComplete = (info: PersonalInfo) => {
    setPersonalInfo(info);
    setCurrentScreen('measurement');
  };

  const handleMeasurementComplete = async (data: MeasurementData) => {
    console.log('🚀 handleMeasurementComplete 호출됨 - 분석 시작');
    console.log('🚀 측정 데이터:', data);
    
    setMeasurementData(data);
    setCurrentScreen('analysis');
    setIsAnalyzing(true);
    setCurrentAnalysisStep(0);
    // 🆕 에러 상태 초기화
    setAnalysisError(null);
    setIsUsingFallback(false);
    
    // 🎯 로딩 화면 최소 표시 시간 보장 (4단계 애니메이션 완료를 위해)
    const minLoadingTime = 8000; // 8초 최소 표시
    const startTime = Date.now();
    
    // 🎯 단계별 진행 상황 시뮬레이션
    const progressSteps = [
      { step: 1, delay: 1500, name: '정신건강 분석' },
      { step: 2, delay: 3000, name: '신체건강 분석' },
      { step: 3, delay: 4500, name: '스트레스 분석' },
      { step: 4, delay: 6000, name: '맞춤형 추천 생성' }
    ];
    
    // 단계별 진행 상황 업데이트
    progressSteps.forEach(({ step, delay }) => {
      setTimeout(() => {
        setCurrentAnalysisStep(step);
      }, delay);
    });
    
    try {
      console.log('🚀 AI 분석 시작 - GeminiAIService.analyzeHealth 호출');
      // AI 분석 실행
      const result = await GeminiAIService.analyzeHealth(personalInfo!, data);
      console.log('🚀 AI 분석 완료 - 결과:', result);
      
      // 🎯 최소 로딩 시간 보장
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      
      if (remainingTime > 0) {
        console.log(`⏳ 로딩 화면 추가 표시 중... (${remainingTime}ms 남음)`);
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      
      setAnalysisResult(result);
      
      // 🆕 분석 완료 후 자동 저장
      await saveAnalysisResult(result, personalInfo!, data);
    } catch (error) {
      console.error('🚨 AI 분석 실패:', error);
      
      // 🆕 Gemini AI 에러 메시지 저장
      const errorMessage = error instanceof Error ? error.message : String(error);
      setAnalysisError(errorMessage);
      setIsUsingFallback(true);
      
      console.log('🚀 테스트 분석으로 대체 - GeminiAIService.testAnalysis 호출');
      
      // 에러 발생 시 테스트 분석 사용
      const dummyResult = await GeminiAIService.testAnalysis(personalInfo!, data);
      console.log('🚀 테스트 분석 완료 - 결과:', dummyResult);
      
      // 🎯 최소 로딩 시간 보장 (테스트 분석의 경우에도)
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      
      if (remainingTime > 0) {
        console.log(`⏳ 로딩 화면 추가 표시 중... (${remainingTime}ms 남음)`);
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      
      setAnalysisResult(dummyResult);
      
      // 🆕 테스트 분석 결과도 자동 저장
      await saveAnalysisResult(dummyResult, personalInfo!, data);
    } finally {
      console.log('🚀 분석 완료 - isAnalyzing을 false로 설정');
      setIsAnalyzing(false);
      setCurrentAnalysisStep(0); // 분석 완료 후 상태 리셋
    }
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
    setPersonalInfo(null);
    setMeasurementData(null);
    setAnalysisResult(null);
    setSelectedReportId(null);
    // 🆕 에러 상태 초기화
    setAnalysisError(null);
    setIsUsingFallback(false);
    // 🆕 저장 상태 초기화
    setIsSaving(false);
    setSavedReportId(null);
  };

  const handleBackToPersonalInfo = () => {
    setCurrentScreen('personalInfo');
  };

  const handleBack = () => {
    switch (currentScreen) {
      case 'personalInfo':
        handleBackToHome();
        break;
      case 'measurement':
        handleBackToPersonalInfo();
        break;
      case 'analysis':
        handleBackToHome();
        break;
      case 'history':
        handleBackToHome();
        break;
      case 'trends':
        handleBackToHome();
        break;
      case 'eegAnalysis':
        setCurrentScreen('analysis');
        break;
      case 'ppgAnalysis':
        setCurrentScreen('analysis');
        break;
      case 'reportDetail':
        handleBackToHistory();
        break;
      default:
        break;
    }
  };

  // 컴포넌트 언마운트 시 window 객체 정리
  useEffect(() => {
    return () => {
      delete (window as any).__aiHealthReportAppState;
    };
  }, []);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <HomeScreen
            onStartNewMeasurement={handleStartNewMeasurement}
            onViewHistory={handleViewHistory}
            onViewTrends={handleViewTrends}
          />
        );
      
      case 'personalInfo':
        return (
          <PersonalInfoScreen
            onNext={handlePersonalInfoComplete}
            onBack={handleBackToHome}
          />
        );
      
      case 'measurement':
        return personalInfo ? (
          <MeasurementScreen
            personalInfo={personalInfo}
            onComplete={handleMeasurementComplete}
            onBack={handleBackToPersonalInfo}
          />
        ) : null;
      
      case 'analysis':
        return (
          <AnalysisScreen
            personalInfo={personalInfo}
            measurementData={measurementData}
            analysisResult={analysisResult}
            isAnalyzing={isAnalyzing}
            currentAnalysisStep={currentAnalysisStep}
            onBack={handleBack}
            onViewEEGAnalysis={handleViewEEGAnalysis}
            onViewPPGAnalysis={handleViewPPGAnalysis}
            // 🆕 에러 정보 전달
            analysisError={analysisError}
            isUsingFallback={isUsingFallback}
          />
        );
        
        if (analysisResult && personalInfo && measurementData) {
          return (
            <AnalysisScreen
              analysisResult={analysisResult}
              personalInfo={personalInfo}
              measurementData={measurementData}
              onReturnToHome={handleBackToHome}
              onViewEEGAnalysis={handleViewEEGAnalysis}
              onViewPPGAnalysis={handleViewPPGAnalysis}
            />
          );
        } else {
          return (
            <div className="min-h-full bg-black p-6 pt-8 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white mb-2">분석 결과를 불러오는 중...</h1>
                <p className="text-gray-400">잠시만 기다려주세요.</p>
                <div className="text-xs text-gray-500 mt-4 p-4 bg-gray-800 rounded">
                  <p>디버깅 정보:</p>
                  <p>분석 결과: {analysisResult ? '있음' : '없음'}</p>
                  <p>개인 정보: {personalInfo ? '있음' : '없음'}</p>
                  <p>측정 데이터: {measurementData ? '있음' : '없음'}</p>
                </div>
              </div>
            </div>
          );
        }
      
      case 'history':
        return (
          <HistoryScreen
            onViewReport={handleViewReport}
            onBackToHome={handleBackToHome}
          />
        );
      
      case 'trends':
        return (
          <TrendsAnalysisScreen
            onBack={handleBackToHome}
          />
        );
      
      case 'eegAnalysis':
        return analysisResult && measurementData ? (
          <EEGAnalysisScreen
            analysisResult={analysisResult}
            measurementData={measurementData}
            onBack={handleBack}
          />
        ) : null;
      
      case 'ppgAnalysis':
        return analysisResult && measurementData ? (
          <PPGAnalysisScreen
            analysisResult={analysisResult}
            measurementData={measurementData}
            onBack={handleBack}
          />
        ) : null;
      
      case 'reportDetail':
        return selectedReportId ? (
          <ReportDetailScreen
            reportId={selectedReportId}
            onBack={handleBackToHistory}
          />
        ) : null;
      
      case 'testDynamicIntegration':
        return process.env.NODE_ENV === 'development' ? (
          <div>
            <div className="mb-4">
              <button
                onClick={handleBackToHome}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                ← 홈으로 돌아가기
              </button>
            </div>
            <TestDynamicIntegration />
          </div>
        ) : null;
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-full bg-black" style={{ backgroundColor: '#000000' }}>
      {renderScreen()}
    </div>
  );
} 