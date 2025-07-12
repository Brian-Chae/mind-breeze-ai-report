/**
 * AI 분석 결과 화면
 * - ReportDetailViewer를 사용하여 일관된 UI 제공
 * - 즉시 분석용 추가 기능 (저장, 공유, 상세 분석) 지원
 */

import React, { useState, useMemo, useEffect } from 'react';
import ReportDetailViewer from './ReportDetailViewer';
import { StoredReport, ReportStorage } from '../services/ReportStorage';
import { AdvancedQualityAssessmentService } from '../services/AdvancedQualityAssessmentService';
import { toast } from 'sonner';

interface AnalysisScreenProps {
  analysisResult: any;
  personalInfo?: any;
  measurementData?: any;
  onBackToMeasurement?: () => void;
  onReturnToHome?: () => void;
  onViewEEGAnalysis?: () => void;
  onViewPPGAnalysis?: () => void;
  // 🆕 에러 관련 props 추가
  analysisError?: string | null;
  isUsingFallback?: boolean;
  // 🆕 로딩 상태 관련 props 추가
  isAnalyzing?: boolean;
  currentAnalysisStep?: number;
  onBack?: () => void;
}

const AnalysisScreen: React.FC<AnalysisScreenProps> = ({ 
  analysisResult, 
  personalInfo,
  measurementData,
  onBackToMeasurement,
  onReturnToHome,
  onViewEEGAnalysis,
  onViewPPGAnalysis,
  // 🆕 에러 관련 props 추가
  analysisError,
  isUsingFallback,
  // 🆕 로딩 상태 관련 props 추가
  isAnalyzing,
  currentAnalysisStep,
  onBack
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // 🕐 분석 진행 시간 타이머
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isAnalyzing) {
      // 분석 시작 시 타이머 시작
      timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      // 분석 완료 시 타이머 리셋
      setElapsedTime(0);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isAnalyzing]);

  // 🕐 시간 포맷팅 함수
  const formatElapsedTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  // 🔧 고급 ACC 품질 평가 수행
  const qualityAssessment = useMemo(() => {
    if (!measurementData?.accMetrics) return null;
    
    const accMetrics = {
      stability: measurementData.accMetrics.stability || 80,
      intensity: measurementData.accMetrics.intensity || 10,
      averageMovement: measurementData.accMetrics.averageMovement || 0.05,
      maxMovement: measurementData.accMetrics.maxMovement || 0.1,
      tremor: measurementData.accMetrics.tremor || 5,
      postureStability: measurementData.accMetrics.postureStability || 85
    };

    return AdvancedQualityAssessmentService.assessQuality(accMetrics);
  }, [measurementData]);

  // 🆕 StoredReport 형태로 변환
  const convertToStoredReport = (): StoredReport => {
    return {
      id: `analysis_${Date.now()}`,
      timestamp: Date.now(),
      analysisResult,
      personalInfo: personalInfo || {
        name: '사용자',
        age: 30,
        gender: 'male',
        occupation: 'office_worker'
      },
      measurementData: measurementData || {},
      tags: [],
      notes: qualityAssessment ? `품질 평가: ${qualityAssessment.reliability}` : undefined
    };
  };

  // 🆕 저장 핸들러
  const handleSave = async () => {
    try {
      setIsSaving(true);
      const report = convertToStoredReport();
      
      const storage = ReportStorage.getInstance();
      await storage.saveReport(
        report.personalInfo,
        report.analysisResult,
        report.measurementData,
        report.tags,
        report.notes
      );
      
      setSaveSuccess(true);
      toast.success('분석 결과가 저장되었습니다.');
      
      // 3초 후 저장 성공 상태 초기화
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('저장 실패:', error);
      toast.error('저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 🆕 공유 핸들러
  const handleShare = async () => {
    try {
      const report = convertToStoredReport();
      const shareData = {
        title: `${personalInfo?.name || '사용자'}님의 AI 건강 리포트`,
        text: `종합 건강 점수: ${analysisResult?.overallHealth?.score || 0}점`,
        url: window.location.href
      };

      if (navigator.share) {
        await navigator.share(shareData);
        toast.success('공유되었습니다.');
                        } else {
        // 폴백: 클립보드에 복사
        await navigator.clipboard.writeText(
          `${shareData.title}\n${shareData.text}\n${shareData.url}`
        );
        toast.success('링크가 클립보드에 복사되었습니다.');
      }
    } catch (error) {
      console.error('공유 실패:', error);
      toast.error('공유에 실패했습니다.');
    }
  };

  // 🆕 뒤로가기 핸들러
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (onBackToMeasurement) {
      onBackToMeasurement();
    } else if (onReturnToHome) {
      onReturnToHome();
    }
  };

  // 로딩 중이거나 분석 결과가 없는 경우
  if (isAnalyzing || !analysisResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-8">
          {/* 메인 로딩 애니메이션 */}
          <div className="relative">
            <div className="w-24 h-24 mx-auto relative">
            {/* 외부 회전 링 */}
              <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
              {/* 내부 펄스 원 */}
              <div className="absolute inset-2 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            {/* 주변 떠다니는 점들 */}
            <div className="absolute -top-2 -left-2 w-3 h-3 bg-purple-400 rounded-full animate-bounce"></div>
            <div className="absolute -top-1 -right-3 w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
            <div className="absolute -bottom-2 -left-3 w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce delay-200"></div>
            <div className="absolute -bottom-1 -right-2 w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-300"></div>
          </div>
          
          {/* 제목과 설명 */}
            <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">
              🧠 AI 분석 진행 중
            </h2>
            <p className="text-gray-600 text-lg">
              고급 알고리즘으로 건강 상태를 분석하고 있습니다
            </p>
          </div>
          
          {/* 진행 단계 표시 */}
        <div className="space-y-4">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>단계 {currentAnalysisStep || 1}/4</span>
              <div className="flex items-center space-x-2">
                <span>{Math.round(((currentAnalysisStep || 1) / 4) * 100)}%</span>
                <span className="text-blue-600 font-medium">⏱️ {formatElapsedTime(elapsedTime)}</span>
                  </div>
                  </div>
            
            {/* 진행률 바 */}
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentAnalysisStep || 1) / 4) * 100}%` }}
              ></div>
                      </div>
                      
            {/* 현재 단계 설명 */}
            <div className="space-y-2">
              {[
                { step: 1, title: "🧠 뇌파 데이터 분석", desc: "EEG 신호 패턴 해석" },
                { step: 2, title: "❤️ 심혈관 데이터 분석", desc: "PPG 신호 및 심박변이도 분석" },
                { step: 3, title: "🎯 스트레스 평가", desc: "정신적 스트레스 수준 측정" },
                { step: 4, title: "📊 종합 리포트 생성", desc: "개인 맞춤형 건강 보고서 작성" }
              ].map((item, index) => (
                <div 
                  key={item.step}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                    (currentAnalysisStep || 1) >= item.step 
                      ? 'bg-blue-100 border-l-4 border-blue-500' 
                      : (currentAnalysisStep || 1) === item.step - 1
                        ? 'bg-yellow-50 border-l-4 border-yellow-400'
                        : 'bg-gray-50 border-l-4 border-gray-300'
                  }`}
                >
                  <div className={`text-lg ${
                    (currentAnalysisStep || 1) >= item.step ? 'opacity-100' : 'opacity-50'
                  }`}>
                    {(currentAnalysisStep || 1) >= item.step ? '✅' : 
                     (currentAnalysisStep || 1) === item.step - 1 ? '⏳' : '⏸️'}
                        </div>
                  <div className="flex-1 text-left">
                    <div className={`font-medium ${
                      (currentAnalysisStep || 1) >= item.step ? 'text-blue-800' : 'text-gray-600'
                    }`}>
                      {item.title}
                        </div>
                    <div className={`text-sm ${
                      (currentAnalysisStep || 1) >= item.step ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {item.desc}
                        </div>
                            </div>
                                </div>
              ))}
                            </div>
                          </div>
                          
          {/* 하단 팁 */}
          <div className="bg-white bg-opacity-70 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-50">
                        <div className="space-y-2">
              <p className="text-sm text-gray-600">
                💡 <strong>팁:</strong> 분석이 완료되면 개인 맞춤형 건강 조언과 함께 상세한 리포트를 확인할 수 있습니다.
              </p>
              <p className="text-xs text-gray-500">
                ⏱️ 일반적으로 분석은 1-2분 내에 완료됩니다 • 현재 경과: <span className="font-medium text-blue-600">{formatElapsedTime(elapsedTime)}</span>
              </p>
                            </div>
                                </div>
                              </div>
                            </div>
    );
  }

  return (
    <ReportDetailViewer
      report={convertToStoredReport()}
      onBack={handleBack}
      
      // 🆕 즉시 분석용 기능 활성화
      isCurrentAnalysis={true}
      showSaveButton={true}
      showShareButton={true}
      onSave={handleSave}
      onShare={handleShare}
      
      // 🆕 상세 분석 버튼
      showEEGButton={!!onViewEEGAnalysis}
      showPPGButton={!!onViewPPGAnalysis}
      onViewEEGAnalysis={onViewEEGAnalysis}
      onViewPPGAnalysis={onViewPPGAnalysis}
      
      // 🆕 상태 표시
      isSaving={isSaving}
      saveSuccess={saveSuccess}
    />
  );
};

export default AnalysisScreen; 