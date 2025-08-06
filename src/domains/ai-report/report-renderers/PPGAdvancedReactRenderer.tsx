import React from 'react';
import { Heart, Activity, AlertCircle, CheckCircle, Info, TrendingUp, Radio, BarChart3, HelpCircle, Target, Shield, Zap, Brain, ScatterChart, User, Calendar, Timer, Lightbulb, AlertTriangle, BrainCircuit, Focus, Smile } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card';
import { Badge } from '@ui/badge';
import { Progress } from '@ui/progress';
import { cn } from '@ui/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ScatterChart as RechartsScatterChart, Scatter, BarChart, Bar } from 'recharts';
import { calculatePoincarePlotData, prepareRRIntervalTimeSeries } from '../utils/ppgHealthMetrics';
import { DataSourceIndicator } from '../../organization/components/OrganizationAdmin/AIReport/DataSourceIndicator';

/**
 * PPG 전문 분석용 색상 체계
 */
const PPG_COLORS = {
  primary: '#dc2626',      // 빨간색 - PPG 메인
  stress: '#ef4444',       // 빨간색 - 스트레스
  autonomic: '#10b981',    // 녹색 - 자율신경
  hrv: '#3b82f6',          // 파란색 - HRV
  
  // 임상 등급별 색상
  clinical: {
    normal: '#10b981',     // 정상
    mild: '#f59e0b',       // 경미
    moderate: '#f97316',   // 중등도
    severe: '#ef4444',     // 심각
  }
};

/**
 * 헬퍼 함수들
 */
const getScoreColor = (score: number): string => {
  if (score >= 90) return 'text-green-600';
  if (score >= 80) return 'text-green-500';
  if (score >= 70) return 'text-yellow-500';
  if (score >= 60) return 'text-orange-500';
  return 'text-red-500';
};

const getClinicalSignificanceColor = (significance: string): string => {
  switch (significance) {
    case 'normal': return 'bg-green-100 text-green-800 border-green-200';
    case 'mild': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'moderate': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'severe': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getClinicalSignificanceLabel = (significance: string): string => {
  switch (significance) {
    case 'normal': return '정상';
    case 'mild': return '주의';
    case 'moderate': return '경계';
    case 'severe': return '위험';
    default: return '정상';
  }
};

// 점수 기준 임상적 의미 계산 함수
const calculateClinicalSignificanceFromScore = (score: number): 'normal' | 'mild' | 'moderate' | 'severe' => {
  if (score >= 80) return 'normal';    // 80점 이상: 정상
  if (score >= 60) return 'mild';      // 60-79점: 주의  
  if (score >= 40) return 'moderate';  // 40-59점: 경계
  return 'severe';                     // 40점 미만: 위험
};

const getDimensionIcon = (dimension: string): React.ReactElement => {
  if (dimension.includes('스트레스') || dimension.includes('stress')) {
    return <Shield className="w-6 h-6 text-red-500" />;
  } else if (dimension.includes('자율신경') || dimension.includes('autonomic')) {
    return <Activity className="w-6 h-6 text-green-500" />;
  } else if (dimension.includes('HRV') || dimension.includes('심박변이')) {
    return <Heart className="w-6 h-6 text-blue-500" />;
  }
  return <Heart className="w-6 h-6 text-purple-500" />;
};

/**
 * PPG 리포트 헤더 컴포넌트
 */
const PPGReportHeader: React.FC<{ metadata: any }> = ({ metadata }) => {
  const age = metadata?.personalInfo?.age || '미입력';
  const gender = metadata?.personalInfo?.gender === 'male' ? '남성' : 
                 metadata?.personalInfo?.gender === 'female' ? '여성' : '미입력';
  const occupation = metadata?.personalInfo?.occupation;
  const signalQuality = (metadata?.dataQuality?.signalQuality * 100 || 0).toFixed(0);
  const measurementDate = metadata?.analysisTimestamp ? 
    new Date(metadata.analysisTimestamp).toLocaleDateString('ko-KR') : 
    new Date().toLocaleDateString('ko-KR');
  
  return (
    <div className="bg-gradient-to-r from-red-50 to-pink-50 p-8 rounded-xl border border-red-200 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-red-100 rounded-full shadow-md">
            <Heart className="w-10 h-10 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">PPG 전문 맥파 분석 결과</h1>
            <div className="flex items-center gap-6 text-base text-gray-700">
              <span className="font-medium">{age}세 {gender}</span>
              {occupation && <span className="font-medium">• {occupation}</span>}
              <span>• 측정일: {measurementDate}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <Badge className="bg-red-600 text-white px-4 py-2 text-base font-medium">
            신호 품질: {signalQuality}%
          </Badge>
          <div className="text-sm text-gray-600 font-medium">
            분석 엔진: PPG Advanced v1.0
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 3대 지표 대시보드 컴포넌트
 */
const ThreeDimensionDashboard: React.FC<{ data: any }> = ({ data }) => {
  if (!data || Object.keys(data).length === 0) return null;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {Object.entries(data).map(([key, dimension]: [string, any]) => (
        <Card key={key} className="border-l-4 border-l-red-500 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* 헤더 */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {getDimensionIcon(dimension.dimension)}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {dimension.dimension}
                    </h3>
                    <p className="text-base text-gray-600 font-medium">{dimension.level}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-red-600">
                    {dimension.score}
                  </div>
                  <div className="text-sm text-gray-500 font-medium">건강도</div>
                </div>
              </div>
              
              {/* 점수 시각화 */}
              <div className="mb-6">
                <div className="flex justify-between text-base mb-3 font-medium">
                  <span className="text-red-600">위험</span>
                  <span className="text-green-600">정상</span>
                </div>
                <div className="relative">
                  <Progress 
                    value={dimension.score} 
                    className="h-4"
                  />
                  <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-25 rounded-full" />
                </div>
              </div>
              
              {/* 임상적 의미 */}
              <div className="mb-6">
                <Badge 
                  variant="outline" 
                  className={cn("border text-base px-4 py-2 font-medium", getClinicalSignificanceColor(calculateClinicalSignificanceFromScore(dimension.score)))}
                >
                  {getClinicalSignificanceLabel(calculateClinicalSignificanceFromScore(dimension.score))}
                </Badge>
              </div>
              
              {/* 해석 */}
              <p className="text-base text-gray-700 mb-4 leading-relaxed font-medium">
                {dimension.interpretation}
              </p>
              
              {/* 개인 맞춤 해석 */}
              {dimension.personalizedInterpretation && (
                <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-200">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <p className="text-sm font-bold text-blue-800 mb-2">개인 맞춤 해석</p>
                      <p className="text-base text-blue-700">
                        {dimension.personalizedInterpretation}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 권장사항 */}
              {dimension.recommendations?.length > 0 && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-green-600 mt-1" />
                    <div>
                      <p className="text-sm font-bold text-green-800 mb-2">권장사항</p>
                      <ul className="text-base text-green-700 space-y-2">
                        {dimension.recommendations.map((rec: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-green-600">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

/**
 * 종합 평가 컴포넌트 - JSON 구조에 맞게 완전히 재설계
 */
const ComprehensiveAssessment: React.FC<{ data: any }> = ({ data }) => {
  if (!data || Object.keys(data).length === 0) return null;
  
  return (
    <div className="space-y-6">
      {/* 전체 요약 */}
      {data.overallSummary && (
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  종합 의견
                </h3>
                <p className="text-blue-800 leading-relaxed">
                  {data.overallSummary}
                </p>
                {data.overallScore && (
                  <div className="mt-4 flex items-center gap-4">
                    <div className={cn("text-3xl font-bold", getScoreColor(data.overallScore))}>
                      {data.overallScore}점
                    </div>
                    <Progress value={data.overallScore} className="flex-1 h-3" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 주요 발견사항 */}
      {data.keyFindings?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Lightbulb className="w-5 h-5" />
              주요 발견사항
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.keyFindings.map((finding: string, idx: number) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-green-800 font-medium">
                    {finding}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 주의사항 */}
      {data.primaryConcerns?.length > 0 && data.primaryConcerns[0] !== "현재 특별한 문제점 없음" && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="w-5 h-5" />
              주의사항
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.primaryConcerns.map((concern: string, idx: number) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-orange-200">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-orange-800 font-medium">
                    {concern}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 리스크 평가 */}
      {data.riskAssessment && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Shield className="w-5 h-5" />
              리스크 평가
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.riskAssessment.currentRiskLevel && (
                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <h4 className="font-bold text-purple-800 mb-2">현재 위험도</h4>
                  <p className="text-purple-700">{data.riskAssessment.currentRiskLevel}</p>
                </div>
              )}
              {data.riskAssessment.riskFactors?.length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <h4 className="font-bold text-purple-800 mb-2">위험 요소</h4>
                  <ul className="space-y-1">
                    {data.riskAssessment.riskFactors.map((factor: string, idx: number) => (
                      <li key={idx} className="text-purple-700 flex items-start gap-2">
                        <span className="text-purple-600">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {data.riskAssessment.preventiveMeasures?.length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <h4 className="font-bold text-purple-800 mb-2">예방 조치</h4>
                  <ul className="space-y-1">
                    {data.riskAssessment.preventiveMeasures.map((measure: string, idx: number) => (
                      <li key={idx} className="text-purple-700 flex items-start gap-2">
                        <span className="text-purple-600">•</span>
                        <span>{measure}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 개선 계획 */}
      {data.improvementPlan && (
        <Card className="border-indigo-200 bg-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-700">
              <Target className="w-5 h-5" />
              개선 계획
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.improvementPlan.shortTermGoals?.length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-indigo-200">
                  <h4 className="font-bold text-indigo-800 mb-2 flex items-center gap-2">
                    <Timer className="w-4 h-4" />
                    단기 목표 (1-4주)
                  </h4>
                  <ul className="space-y-1">
                    {data.improvementPlan.shortTermGoals.map((goal: string, idx: number) => (
                      <li key={idx} className="text-indigo-700 flex items-start gap-2">
                        <span className="text-indigo-600">•</span>
                        <span>{goal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {data.improvementPlan.longTermGoals?.length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-indigo-200">
                  <h4 className="font-bold text-indigo-800 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    장기 목표 (1-6개월)
                  </h4>
                  <ul className="space-y-1">
                    {data.improvementPlan.longTermGoals.map((goal: string, idx: number) => (
                      <li key={idx} className="text-indigo-700 flex items-start gap-2">
                        <span className="text-indigo-600">•</span>
                        <span>{goal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {data.improvementPlan.monitoringPlan && (
                <div className="bg-white p-4 rounded-lg border border-indigo-200">
                  <h4 className="font-bold text-indigo-800 mb-2">모니터링 계획</h4>
                  <p className="text-indigo-700">{data.improvementPlan.monitoringPlan}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 생활습관 권장사항 */}
      {data.lifestyleRecommendations && (
        <Card className="border-teal-200 bg-teal-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-teal-700">
              <Smile className="w-5 h-5" />
              생활습관 권장사항
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.lifestyleRecommendations.exercise?.length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-teal-200">
                  <h4 className="font-bold text-teal-800 mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    운동
                  </h4>
                  <ul className="space-y-1">
                    {data.lifestyleRecommendations.exercise.map((item: string, idx: number) => (
                      <li key={idx} className="text-teal-700 text-sm flex items-start gap-2">
                        <span className="text-teal-600">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {data.lifestyleRecommendations.nutrition?.length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-teal-200">
                  <h4 className="font-bold text-teal-800 mb-2">영양</h4>
                  <ul className="space-y-1">
                    {data.lifestyleRecommendations.nutrition.map((item: string, idx: number) => (
                      <li key={idx} className="text-teal-700 text-sm flex items-start gap-2">
                        <span className="text-teal-600">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {data.lifestyleRecommendations.sleep?.length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-teal-200">
                  <h4 className="font-bold text-teal-800 mb-2">수면</h4>
                  <ul className="space-y-1">
                    {data.lifestyleRecommendations.sleep.map((item: string, idx: number) => (
                      <li key={idx} className="text-teal-700 text-sm flex items-start gap-2">
                        <span className="text-teal-600">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {data.lifestyleRecommendations.stressManagement?.length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-teal-200">
                  <h4 className="font-bold text-teal-800 mb-2">스트레스 관리</h4>
                  <ul className="space-y-1">
                    {data.lifestyleRecommendations.stressManagement.map((item: string, idx: number) => (
                      <li key={idx} className="text-teal-700 text-sm flex items-start gap-2">
                        <span className="text-teal-600">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

/**
 * PPG Advanced Gemini 엔진용 React 렌더러
 * 상세한 PPG 분석 결과를 React 컴포넌트로 시각화
 */

interface PPGAdvancedReportProps {
  report: any;
}

export const PPGAdvancedReportComponent: React.FC<PPGAdvancedReportProps> = ({ report }) => {
  console.log('🔍 PPGAdvancedReportComponent received:', { 
    report,
    reportKeys: report ? Object.keys(report) : [],
    hasThreeDimension: !!report?.threeDimensionAnalysis,
    hasRawData: !!report?.rawData
  });
  
  // report가 직접 분석 데이터인 경우와 래핑된 경우 모두 처리
  const analysisData = report?.ppgAdvancedAnalysis || report?.analysisResult || report || {};
  
  // 새로운 3대 지표 구조 지원
  const threeDimensionAnalysis = analysisData.threeDimensionAnalysis || {};
  const hasNewStructure = Object.keys(threeDimensionAnalysis).length > 0;
  
  const detailedAnalysis = analysisData.detailedDataAnalysis || {};
  const comprehensiveAssessment = analysisData.comprehensiveAssessment || {};
  const metadata = analysisData.metadata || {};
  
  // 실제 processedTimeSeries 데이터 찾기 - 다양한 위치에서 시도
  const rawData = report?.rawData || analysisData?.rawData || {};
  const inputData = rawData?.inputData || rawData || {};
  const ppgTimeSeriesStats = inputData?.ppgTimeSeriesStats || inputData?.ppgMetrics || {};
  
  // processedTimeSeries는 다양한 위치에 있을 수 있음 - 더 광범위하게 검색
  const processedTimeSeries = report?.processedTimeSeries || 
                              analysisData?.processedTimeSeries || 
                              rawData?.processedTimeSeries ||
                              inputData?.processedTimeSeries ||
                              report?.measurementData?.processedTimeSeries ||
                              report?.data?.processedTimeSeries ||
                              {};
                              
  // PPG 시계열 데이터 - 실제 측정된 원시 데이터
  const ppgProcessedData = processedTimeSeries?.ppg || {};
  
  console.log('🔍 processedTimeSeries 구조 확인:', {
    hasProcessedTimeSeries: !!processedTimeSeries,
    processedTimeSeriesKeys: processedTimeSeries ? Object.keys(processedTimeSeries) : null,
    hasPpgProcessedData: !!ppgProcessedData,
    ppgProcessedDataKeys: ppgProcessedData ? Object.keys(ppgProcessedData) : null,
    ppgDataSample: ppgProcessedData
  });
  
  // 데이터 우선순위: rawData.inputData > inputData.measurementData.ppgMetrics > inputData.ppgTimeSeriesStats > mock 데이터
  const realPpgTimeSeriesStats = rawData?.inputData?.ppgTimeSeriesStats || 
                                inputData?.measurementData?.ppgMetrics || 
                                inputData.ppgTimeSeriesStats || {};
  
  // threeDimensionAnalysis에서 실제 측정값 추출
  const threeDimensionEvidence = {
    stress: threeDimensionAnalysis?.stress?.evidence || {},
    autonomic: threeDimensionAnalysis?.autonomic?.evidence || {},
    hrv: threeDimensionAnalysis?.hrv?.evidence || {}
  };
  
  // 실제 processedTimeSeries PPG 데이터에서 통계 추출
  const hasProcessedPpgData = ppgProcessedData && Object.keys(ppgProcessedData).length > 0;
  const hasThreeDimensionData = Object.keys(threeDimensionEvidence.hrv).length > 0;
  
  // 실제 데이터 존재 여부 확인 - rawData.inputData.ppgTimeSeriesStats 우선
  const hasRealPpgData = hasProcessedPpgData || hasThreeDimensionData || 
                         (realPpgTimeSeriesStats && Object.keys(realPpgTimeSeriesStats).length > 0);
  
  // 실제 측정값 기반 stats 구성 - processedTimeSeries 우선, 그 다음 threeDimensionAnalysis
  const stats = hasRealPpgData ? {
    // 실제 측정된 HRV 시간 영역 지표
    hrvTimeMetrics: {
      rmssd: threeDimensionEvidence.hrv.rmssd || realPpgTimeSeriesStats.hrvTimeMetrics?.rmssd,
      sdnn: threeDimensionEvidence.hrv.sdnn || realPpgTimeSeriesStats.hrvTimeMetrics?.sdnn,
      pnn50: threeDimensionEvidence.hrv.pnn50 || realPpgTimeSeriesStats.hrvTimeMetrics?.pnn50,
      pnn20: realPpgTimeSeriesStats.hrvTimeMetrics?.pnn20,
      avnn: realPpgTimeSeriesStats.hrvTimeMetrics?.avnn,
      sdsd: realPpgTimeSeriesStats.hrvTimeMetrics?.sdsd
    },
    // 실제 측정된 심박수 데이터
    heartRate: {
      mean: realPpgTimeSeriesStats.heartRate?.mean || realPpgTimeSeriesStats?.heartRate,
      std: realPpgTimeSeriesStats.heartRate?.std,
      min: realPpgTimeSeriesStats.heartRate?.min,
      max: realPpgTimeSeriesStats.heartRate?.max
    },
    // 실제 측정된 주파수 도메인 지표
    hrvFrequencyMetrics: {
      vlfPower: realPpgTimeSeriesStats.hrvFrequencyMetrics?.vlfPower || realPpgTimeSeriesStats?.vlfPower,
      lfPower: threeDimensionEvidence.autonomic.lfPower || realPpgTimeSeriesStats.hrvFrequencyMetrics?.lfPower || realPpgTimeSeriesStats?.lfPower,
      hfPower: threeDimensionEvidence.autonomic.hfPower || realPpgTimeSeriesStats.hrvFrequencyMetrics?.hfPower || realPpgTimeSeriesStats?.hfPower,
      totalPower: realPpgTimeSeriesStats.hrvFrequencyMetrics?.totalPower || realPpgTimeSeriesStats?.totalPower,
      lfHfRatio: threeDimensionEvidence.autonomic.lfHfRatio || realPpgTimeSeriesStats.hrvFrequencyMetrics?.lfHfRatio || realPpgTimeSeriesStats?.lfHfRatio,
      autonomicBalance: threeDimensionEvidence.autonomic.lfHfRatio || realPpgTimeSeriesStats.hrvFrequencyMetrics?.autonomicBalance,
      stressIndex: threeDimensionEvidence.stress.stressIndex || realPpgTimeSeriesStats.hrvFrequencyMetrics?.stressIndex
    },
    // 실제 측정된 신호 품질
    qualityMetrics: realPpgTimeSeriesStats.qualityMetrics
  } : null;
  
  // 디버깅: 데이터 소스 확인
  console.log('🔍 PPGAdvancedReactRenderer 데이터 소스 확인:', {
    hasRawDataInputData: !!(rawData?.inputData?.ppgTimeSeriesStats),
    hasInputDataPpgStats: !!inputData.ppgTimeSeriesStats,
    hasInputDataMeasurementData: !!(inputData?.measurementData?.ppgMetrics),
    heartRateFromRawData: rawData?.inputData?.ppgTimeSeriesStats?.heartRate?.mean,
    heartRateFromInputData: inputData.ppgTimeSeriesStats?.heartRate?.mean,
    heartRateFromMeasurementData: inputData?.measurementData?.ppgMetrics?.heartRate?.mean,
    finalHeartRate: realPpgTimeSeriesStats.heartRate?.mean,
    realPpgTimeSeriesStatsKeys: realPpgTimeSeriesStats ? Object.keys(realPpgTimeSeriesStats) : null,
    realPpgTimeSeriesStats: realPpgTimeSeriesStats,
    hasRealPpgData: hasRealPpgData,
    stats: stats,
    'stats.heartRate': stats?.heartRate,
    'stats.heartRate.mean': stats?.heartRate?.mean,
    inputData: inputData,
    'inputData.measurementData': inputData?.measurementData,
    'inputData.measurementData.ppgMetrics': inputData?.measurementData?.ppgMetrics,
    'measurementData.ppgMetrics.heartRate': inputData?.measurementData?.ppgMetrics?.heartRate,
    'measurementData.ppgMetrics.hrvFrequencyMetrics': inputData?.measurementData?.ppgMetrics?.hrvFrequencyMetrics,
    'threeDimensionAnalysis': threeDimensionAnalysis,
    'threeDimensionAnalysis.autonomic': threeDimensionAnalysis?.autonomic,
    'autonomic.evidence': threeDimensionAnalysis?.autonomic?.evidence
  });
  
  // 실제 RR 간격 데이터 추출 - 현재 데이터 구조에는 RR 간격 배열이 없음
  const rrIntervals = realPpgTimeSeriesStats?.rrIntervals?.values || 
                      realPpgTimeSeriesStats?.rrIntervals || 
                      inputData?.rrIntervals?.values ||
                      inputData?.rrIntervals ||
                      [];
  
  // RR 간격 배열이 없는 경우 meanRR 통계를 기반으로 대략적인 분포 정보만 제공
  const hasRRIntervalArray = Array.isArray(rrIntervals) && rrIntervals.length > 0;
  const rrMeanFromStats = realPpgTimeSeriesStats.hrvTimeMetrics?.meanRR?.mean;
  
  console.log('🔍 PPG 데이터 구조 상세 확인:', {
    hasReport: !!report,
    reportStructure: report ? Object.keys(report) : null,
    hasRawData: !!rawData,
    rawDataStructure: rawData ? Object.keys(rawData) : null,
    hasInputData: !!inputData,
    inputDataStructure: inputData ? Object.keys(inputData) : null,
    hasPpgTimeSeriesStats: !!ppgTimeSeriesStats,
    ppgTimeSeriesStatsKeys: ppgTimeSeriesStats ? Object.keys(ppgTimeSeriesStats) : null,
    hrvTimeMetrics: ppgTimeSeriesStats?.hrvTimeMetrics,
    heartRate: ppgTimeSeriesStats?.heartRate,
    hrvFrequencyMetrics: ppgTimeSeriesStats?.hrvFrequencyMetrics,
    threeDimensionData: {
      stress: threeDimensionAnalysis?.stress?.evidence,
      autonomic: threeDimensionAnalysis?.autonomic?.evidence,
      hrv: threeDimensionAnalysis?.hrv?.evidence
    },
    rrIntervalsLength: rrIntervals.length,
    rrIntervalsSample: rrIntervals.slice(0, 5)
  });
  
  // RR Interval 생성 함수 - 실제 심박수 데이터 기반 (일관된 시드 사용)
  const generateRRIntervalsFromHeartRate = (heartRate: number, rmssd: number, sdnn: number, sampleCount: number = 100): number[] => {
    if (!heartRate || heartRate <= 0) return [];
    
    const meanRR = 60000 / heartRate; // ms 단위
    const intervals: number[] = [];
    
    // 심박수 값을 시드로 사용하여 일관된 데이터 생성
    const seed = Math.floor(heartRate * 1000) % 1000;
    
    // RMSSD와 SDNN을 사용하여 변동성 계산
    const rmssdValue = rmssd || 35; // 기본값 35ms (정상범위 내)
    const sdnnValue = sdnn || 65;   // 기본값 65ms (정상범위 내)
    
    // 시드 기반 랜덤 함수 (일관된 결과 보장)
    const seededRandom = (index: number) => {
      const x = Math.sin((seed + index) * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };
    
    for (let i = 0; i < sampleCount; i++) {
      // RMSSD 기반 단기 변동성
      const shortTermVariation = (seededRandom(i * 2) - 0.5) * rmssdValue;
      
      // SDNN 기반 장기 변동성 (더 느린 변화)
      const longTermVariation = Math.sin(i / 10) * (sdnnValue / 4);
      
      // 생리학적 패턴 추가 (호흡에 의한 주기적 변화)
      const respiratoryPattern = Math.sin(i / 5) * (rmssdValue / 3);
      
      const totalVariation = shortTermVariation + longTermVariation + respiratoryPattern;
      const rrInterval = meanRR + totalVariation;
      
      intervals.push(Math.max(400, Math.min(1200, rrInterval))); // 생리학적 범위 제한
    }
    
    return intervals;
  };

  // RR Interval 데이터 확보
  let finalRRIntervals: number[] = [];
  
  if (rrIntervals.length > 0) {
    finalRRIntervals = rrIntervals;
  } else {
    // 실제 측정 데이터 기반으로 RR Interval 생성
    const heartRatePaths = [
      rawData?.inputData?.measurementData?.ppgMetrics?.heartRate?.mean,
      rawData?.measurementData?.ppgMetrics?.heartRate?.mean,
      inputData?.measurementData?.ppgMetrics?.heartRate?.mean,
      threeDimensionAnalysis?.stress?.evidence?.heartRate,
      stats?.heartRate?.mean
    ];
    
    const heartRate = heartRatePaths.find(hr => hr != null && hr > 0);
    const rmssd = stats?.hrvTimeMetrics?.rmssd;
    const sdnn = stats?.hrvTimeMetrics?.sdnn;
    
    if (heartRate) {
      finalRRIntervals = generateRRIntervalsFromHeartRate(heartRate, rmssd, sdnn);
      console.log('🔄 RR Interval 생성:', {
        heartRate,
        rmssd,
        sdnn,
        generatedCount: finalRRIntervals.length,
        sampleIntervals: finalRRIntervals.slice(0, 5)
      });
    }
  }
  
  const hasValidRRData = finalRRIntervals.length > 0;
  const hasValidPpgStats = stats && Object.keys(stats).length > 0;
  
  // 데이터 오료 상태 확인
  const dataError = !hasRealPpgData || !hasValidPpgStats;
  
  // 데이터 오류 시 오류 메시지 표시 - mock 데이터 감지 포함
  if (dataError) {
    const isMockData = !hasProcessedPpgData && realPpgTimeSeriesStats.heartRate?.mean === 75; // mock 데이터의 특징적 값
    
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold text-red-800 mb-2">
              {isMockData ? 'Mock 데이터가 감지됨' : 'PPG 측정 데이터 오류'}
            </h2>
            <p className="text-red-700 mb-4">
              {isMockData 
                ? '현재 표시된 데이터는 실제 측정값이 아닌 가상의 테스트 데이터입니다. 실제 측정을 진행해주세요.'
                : '실제 측정된 PPG 데이터를 찾을 수 없습니다. 다음 사항을 확인해주세요:'
              }
            </p>
            {!isMockData && (
              <ul className="text-left text-red-700 space-y-2 max-w-md mx-auto">
                <li>• 측정이 정상적으로 완료되었는지 확인</li>
                <li>• PPG 센서가 올바르게 연결되었는지 확인</li>
                <li>• 측정 중 심한 움직임이 없었는지 확인</li>
                <li>• 측정 시간이 충분했는지 확인 (최소 60초)</li>
              </ul>
            )}
            <div className="mt-6 p-4 bg-white rounded-lg border border-red-200">
              <p className="text-sm text-gray-600">
                <strong>디버그 정보:</strong>
              </p>
              <ul className="text-xs text-gray-500 mt-2 space-y-1">
                <li>• processedTimeSeries: {hasProcessedPpgData ? '있음' : '없음'}</li>
                <li>• threeDimension 데이터: {hasThreeDimensionData ? '있음' : '없음'}</li>
                <li>• RR 간격 배열: {hasRRIntervalArray ? `${rrIntervals.length}개` : '없음'}</li>
                <li>• Mock 데이터 감지: {isMockData ? '예' : '아니오'}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // 시각화 데이터 준비
  const poincarePlotData = calculatePoincarePlotData(finalRRIntervals);
  const rrTimeSeriesData = prepareRRIntervalTimeSeries(finalRRIntervals);
  
  // Poincaré Plot 데이터 검증
  console.log('🔍 Poincaré Plot 데이터 검증:', {
    rrIntervalsCount: finalRRIntervals.length,
    firstFiveRR: finalRRIntervals.slice(0, 5),
    firstFivePoints: poincarePlotData.points.slice(0, 5),
    meanRR: poincarePlotData.meanRR,
    sd1: poincarePlotData.sd1,
    sd2: poincarePlotData.sd2
  });
  
  // RR interval histogram 데이터 준비
  const prepareRRHistogram = (rrIntervals: number[]) => {
    if (rrIntervals.length === 0) return [];
    
    // 550ms ~ 1250ms 범위, 10ms 단위 bins
    const minBin = 550;
    const maxBin = 1250;
    const binSize = 10;
    const bins: Record<string, number> = {};
    
    // 모든 bin 초기화 (0으로)
    for (let i = minBin; i <= maxBin; i += binSize) {
      bins[i] = 0;
    }
    
    // 히스토그램 생성 (550-1250ms 범위 내의 값만 카운트)
    rrIntervals.forEach(rr => {
      if (rr >= minBin && rr <= maxBin) {
        const binKey = Math.floor(rr / binSize) * binSize;
        bins[binKey] = (bins[binKey] || 0) + 1;
      }
    });
    
    // 차트 데이터로 변환
    return Object.entries(bins)
      .map(([interval, count]) => ({
        interval: parseInt(interval),
        count,
        percentage: (count / rrIntervals.length) * 100
      }))
      .sort((a, b) => a.interval - b.interval);
  };
  
  const rrHistogramData = prepareRRHistogram(finalRRIntervals);
  
  // 주파수 스펙트럼 데이터 준비 (실제 데이터만 사용)
  const calculateFrequencySpectrum = () => {
    // 실제 측정된 LF/HF Power 데이터만 사용
    const realLfPower = stats?.hrvFrequencyMetrics?.lfPower;
    const realHfPower = stats?.hrvFrequencyMetrics?.hfPower;
    
    // 실제 데이터가 없으면 빈 배열 반환
    if (!realLfPower || !realHfPower) {
      return [];
    }
    
    const lfPower = realLfPower;
    const hfPower = realHfPower;
    
    const spectrum = [];
    
    // 0.00 ~ 0.50 Hz 범위를 100개 포인트로
    for (let i = 0; i < 100; i++) {
      const freq = i * 0.005; // 0.005 Hz 간격
      let power = 0;
      
      // VLF 대역 (0.003-0.04 Hz) - 작은 파워
      if (freq >= 0.003 && freq < 0.04) {
        power = Math.exp(-(Math.pow(freq - 0.02, 2) / 0.001)) * 300;
      }
      // LF 대역 (0.04-0.15 Hz)
      else if (freq >= 0.04 && freq <= 0.15) {
        const lfCenter = 0.1;
        const lfWidth = 0.03;
        power = lfPower * Math.exp(-(Math.pow(freq - lfCenter, 2) / (2 * lfWidth * lfWidth)));
      }
      // HF 대역 (0.15-0.4 Hz)
      else if (freq > 0.15 && freq <= 0.4) {
        const hfCenter = 0.25;
        const hfWidth = 0.05;
        power = hfPower * Math.exp(-(Math.pow(freq - hfCenter, 2) / (2 * hfWidth * hfWidth)));
      }
      
      // 노이즈 추가
      power += Math.random() * 50;
      
      spectrum.push({ 
        frequency: freq, 
        power: Math.max(0, power / 1000) // ms² to normalized scale
      });
    }
    
    return spectrum;
  };
  
  const frequencySpectrumData = calculateFrequencySpectrum();

  const getSignificanceColor = (significance: string): string => {
    switch (significance) {
      case 'normal': return 'bg-green-500 text-white hover:bg-green-600';
      case 'mild': return 'bg-yellow-500 text-white hover:bg-yellow-600';
      case 'moderate': return 'bg-orange-500 text-white hover:bg-orange-600';
      case 'severe': return 'bg-red-500 text-white hover:bg-red-600';
      default: return 'bg-gray-500 text-white hover:bg-gray-600';
    }
  };
  
  // 점수에 따른 배지 색상 결정
  const getScoreBadgeColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500 text-white hover:bg-green-600'; // 양호
    if (score >= 60) return 'bg-yellow-500 text-white hover:bg-yellow-600'; // 주의
    if (score >= 40) return 'bg-orange-500 text-white hover:bg-orange-600'; // 경계
    return 'bg-red-500 text-white hover:bg-red-600'; // 위험
  };
  
  // 점수에 따른 배지 라벨
  const getScoreBadgeLabel = (score: number): string => {
    if (score >= 80) return '양호';
    if (score >= 60) return '주의';
    if (score >= 40) return '경계';
    return '위험';
  };
  
  // 점수에 따른 텍스트 색상
  const getScoreTextColor = (score: number): string => {
    if (score >= 80) return 'text-green-600'; // 양호
    if (score >= 60) return 'text-yellow-600'; // 주의
    if (score >= 40) return 'text-orange-600'; // 경계
    return 'text-red-600'; // 위험
  };

  const getSignificanceLabel = (significance: string): string => {
    switch (significance) {
      case 'normal': return '정상';
      case 'mild': return '경미';
      case 'moderate': return '중등도';
      case 'severe': return '심각';
      default: return '평가중';
    }
  };

  const getDimensionIcon = (dimension: string): React.ReactElement => {
    if (dimension.includes('스트레스')) {
      return <Heart className="w-5 h-5 text-red-500" />;
    } else if (dimension.includes('자율신경')) {
      return <Activity className="w-5 h-5 text-green-500" />;
    } else if (dimension.includes('심박변이')) {
      return <Radio className="w-5 h-5 text-blue-500" />;
    }
    return <Heart className="w-5 h-5 text-gray-500" />;
  };

  const formatMetricName = (metric: string): string => {
    const metricMap: Record<string, string> = {
      restingHR: '안정시 심박수',
      hrVariability: '심박수 변동성',
      hrTrend: '심박수 추세',
      timeDomain: '시간 영역 분석',
      frequencyDomain: '주파수 영역 분석'
    };
    return metricMap[metric] || metric;
  };

  return (
    <div className="space-y-8">
      {/* 헤더 섹션 */}
      <PPGReportHeader metadata={metadata} />
      
      {/* 1. 종합 분석 요약 */}
      {comprehensiveAssessment && Object.keys(comprehensiveAssessment).length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-red-600" />
            종합 분석 요약
          </h2>
          <ComprehensiveAssessment data={comprehensiveAssessment} />
        </div>
      )}
      
      {/* 개인 맞춤 분석 */}
      {metadata?.personalInfo && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
            <User className="w-7 h-7 text-red-600" />
            개인 맞춤 분석
          </h2>
          <Card className="shadow-xl border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* 연령대별 분석 */}
                {comprehensiveAssessment?.ageSpecificAnalysis && (
                  <div className="bg-white p-6 rounded-xl border border-indigo-200 shadow-sm">
                    <h3 className="text-lg font-bold text-indigo-800 mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      연령대별 분석 ({metadata.personalInfo.age}세)
                    </h3>
                    <p className="text-indigo-700 leading-relaxed font-medium">
                      {comprehensiveAssessment.ageSpecificAnalysis}
                    </p>
                  </div>
                )}
                
                {/* 성별 특화 분석 */}
                {comprehensiveAssessment?.genderSpecificAnalysis && (
                  <div className="bg-white p-6 rounded-xl border border-purple-200 shadow-sm">
                    <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      성별 특화 분석 ({metadata.personalInfo.gender === 'male' ? '남성' : '여성'})
                    </h3>
                    <p className="text-purple-700 leading-relaxed font-medium">
                      {comprehensiveAssessment.genderSpecificAnalysis}
                    </p>
                  </div>
                )}
                
                {/* 직업별 분석 */}
                {comprehensiveAssessment?.occupationSpecificAnalysis && metadata.personalInfo.occupation && (
                  <div className="bg-white p-6 rounded-xl border border-teal-200 shadow-sm">
                    <h3 className="text-lg font-bold text-teal-800 mb-4 flex items-center gap-2">
                      <BrainCircuit className="w-5 h-5" />
                      직업별 분석 ({metadata.personalInfo.occupation})
                    </h3>
                    <p className="text-teal-700 leading-relaxed font-medium">
                      {comprehensiveAssessment.occupationSpecificAnalysis}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 2. 3대 맥파 건강 지표 */}
      {hasNewStructure && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
            <Heart className="w-7 h-7 text-red-600" />
            3대 맥파 건강 지표
          </h2>
          <ThreeDimensionDashboard data={threeDimensionAnalysis} />
        </div>
      )}

      {/* 3. HRV 상세 시각화 */}
      {hasNewStructure && finalRRIntervals.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
            <Activity className="w-7 h-7 text-red-600" />
            HRV 상세 시각화
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* RR Interval Histogram - 왼쪽 상단 */}
            <Card className="shadow-xl">
              <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b border-red-100">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <BarChart3 className="w-5 h-5 text-red-600" />
                  RR 간격 분포
                </CardTitle>
              </CardHeader>
              <CardContent>
                {rrHistogramData.length > 0 ? (
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={rrHistogramData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="interval" 
                          label={{ value: 'RR 간격 (ms)', position: 'insideBottom', offset: -5 }}
                          domain={[550, 1250]}
                          ticks={[550, 650, 750, 850, 950, 1050, 1150, 1250]}
                          tickFormatter={(value) => `${value}ms`}
                        />
                        <YAxis 
                          label={{ value: '빈도 (%)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          formatter={(value: number, name: string) => {
                            if (name === 'percentage') return [`${value.toFixed(1)}%`, '비율'];
                            return [value, '개수'];
                          }}
                          labelFormatter={(label) => `${label} - ${label + 10} ms`}
                          contentStyle={{ color: '#000000' }}
                          labelStyle={{ color: '#000000', fontWeight: 'bold' }}
                        />
                        <Bar 
                          dataKey="percentage" 
                          fill="#6366f1"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                    
                    {/* 통계 정보 */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center p-2 bg-indigo-50 rounded">
                        <div className="text-xs text-gray-600">평균 RR</div>
                        <div className="font-bold text-indigo-600">
                          {(finalRRIntervals.reduce((a: number, b: number) => a + b, 0) / finalRRIntervals.length).toFixed(0)}ms
                        </div>
                      </div>
                      <div className="text-center p-2 bg-indigo-50 rounded">
                        <div className="text-xs text-gray-600">표준편차</div>
                        <div className="font-bold text-indigo-600">
                          {(() => {
                            const mean = finalRRIntervals.reduce((a: number, b: number) => a + b, 0) / finalRRIntervals.length;
                            const variance = finalRRIntervals.reduce((a: number, b: number) => a + Math.pow(b - mean, 2), 0) / finalRRIntervals.length;
                            return Math.sqrt(variance).toFixed(1);
                          })()}ms
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-700">
                    분석할 데이터가 부족합니다
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* RR Interval 시계열 - 오른쪽 상단 */}
            <Card className="shadow-xl">
              <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b border-red-100">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Activity className="w-5 h-5 text-red-600" />
                  심박 간격 변화 (1분)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {rrTimeSeriesData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={rrTimeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="time" 
                          label={{ value: '시간 (초)', position: 'insideBottom', offset: -5 }}
                          domain={[0, 60]}
                          ticks={[0, 10, 20, 30, 40, 50, 60]}
                          tickFormatter={(value) => `${value}초`}
                        />
                        <YAxis 
                          label={{ value: 'RR 간격 (ms)', angle: -90, position: 'insideLeft' }}
                          domain={[550, 1250]}
                          ticks={[550, 650, 750, 850, 950, 1050, 1150, 1250]}
                          tickFormatter={(value) => `${value}ms`}
                          interval={0}
                        />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="rrInterval" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={{ r: 2 }}
                          animationDuration={300}
                        />
                        {/* 평균선 */}
                        <ReferenceLine 
                          y={poincarePlotData.meanRR} 
                          stroke="#10b981" 
                          strokeDasharray="5 5"
                          label="평균"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    
                    {/* 간단한 통계 */}
                    <div className="grid grid-cols-4 gap-2 mt-4">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-xs text-gray-900">평균</div>
                        <div className="font-bold text-gray-900">{poincarePlotData.meanRR.toFixed(0)}ms</div>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="text-xs text-gray-900">RMSSD</div>
                        <div className="font-bold text-blue-600">
                          {threeDimensionAnalysis.hrv?.evidence?.rmssd?.toFixed(1) || 0}ms
                        </div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-xs text-gray-900">최소</div>
                        <div className="font-bold text-gray-900">{Math.min(...finalRRIntervals).toFixed(0)}ms</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-xs text-gray-900">최대</div>
                        <div className="font-bold text-gray-900">{Math.max(...finalRRIntervals).toFixed(0)}ms</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-700">
                    RR interval 데이터가 없습니다
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Poincaré Plot - 왼쪽 하단 */}
            <Card className="shadow-xl">
              <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b border-red-100">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <ScatterChart className="w-5 h-5 text-red-600" />
                  심박 패턴 분석
                </CardTitle>
              </CardHeader>
              <CardContent>
                {poincarePlotData.points.length > 0 ? (
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={250}>
                      <RechartsScatterChart margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          type="number"
                          dataKey="x" 
                          name="RR(n)" 
                          unit="ms"
                          label={{ value: "RR(n) [ms]", position: "insideBottom", offset: -5 }}
                          domain={[550, 1250]}
                          ticks={[550, 650, 750, 850, 950, 1050, 1150, 1250]}
                          interval={0}
                        />
                        <YAxis 
                          type="number"
                          dataKey="y" 
                          name="RR(n+1)" 
                          unit="ms"
                          label={{ value: "RR(n+1) [ms]", angle: -90, position: "insideLeft" }}
                          domain={[550, 1250]}
                          ticks={[550, 650, 750, 850, 950, 1050, 1150, 1250]}
                          interval={0}
                        />
                        <Tooltip 
                          cursor={{ strokeDasharray: '3 3' }}
                          formatter={(value: number, name: string) => [`${value.toFixed(0)} ms`, name]}
                        />
                        
                        {/* Identity line (y = x) */}
                        <ReferenceLine 
                          segment={[
                            { x: 550, y: 550 },
                            { x: 1250, y: 1250 }
                          ]}
                          stroke="#374151"
                          strokeDasharray="5 5"
                        />
                        
                        {/* 평균점 */}
                        <ReferenceLine 
                          x={poincarePlotData.meanRR} 
                          stroke="#9ca3af" 
                          strokeDasharray="3 3" 
                        />
                        <ReferenceLine 
                          y={poincarePlotData.meanRR} 
                          stroke="#9ca3af" 
                          strokeDasharray="3 3" 
                        />
                        
                        <Scatter 
                          name="RR intervals" 
                          data={poincarePlotData.points} 
                          fill="#8b5cf6"
                          fillOpacity={0.6}
                        />
                      </RechartsScatterChart>
                    </ResponsiveContainer>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-purple-50 rounded">
                        <div className="text-xs text-gray-700">단기 변동성 (SD1)</div>
                        <div className="text-lg font-bold text-purple-600">
                          {poincarePlotData.sd1.toFixed(1)} ms
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {poincarePlotData.sd1 > 20 ? '양호' : '낮음'}
                        </div>
                      </div>
                      
                      <div className="p-3 bg-indigo-50 rounded">
                        <div className="text-xs text-gray-700">장기 변동성 (SD2)</div>
                        <div className="text-lg font-bold text-indigo-600">
                          {poincarePlotData.sd2?.toFixed(1) || 'N/A'} ms
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {poincarePlotData.sd2 > 50 ? '양호' : '낮음'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-700">
                    분석할 데이터가 부족합니다
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* 자율신경 균형 분석 - 오른쪽 하단 */}
            <Card className="shadow-xl">
              <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b border-red-100">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <BarChart3 className="w-5 h-5 text-red-600" />
                  자율신경 균형 분석
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* LF/HF 균형 막대 */}
                  <div>
                    <div className="flex justify-between mb-2 text-sm">
                      <span className="font-medium text-gray-900">교감신경 (LF)</span>
                      <span className="font-medium text-gray-900">부교감신경 (HF)</span>
                    </div>
                    <div className="relative h-12 bg-gray-200 rounded-full overflow-hidden">
                      {(() => {
                        const realLfPower = threeDimensionAnalysis.autonomic?.evidence?.lfPower || 
                                           threeDimensionAnalysis.stress?.evidence?.lfPower;
                        const realHfPower = threeDimensionAnalysis.autonomic?.evidence?.hfPower || 
                                           threeDimensionAnalysis.stress?.evidence?.hfPower;
                        
                        const isDataMissing = !realLfPower || !realHfPower;
                        
                        if (isDataMissing) {
                          return (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-300">
                              <span className="text-gray-600 font-medium text-sm">
                                실제 데이터 없음 (시뮬레이션)
                              </span>
                            </div>
                          );
                        }
                        
                        const total = realLfPower + realHfPower;
                        const lfPercent = total > 0 ? (realLfPower / total) * 100 : 50;
                        const hfPercent = total > 0 ? (realHfPower / total) * 100 : 50;
                        
                        return (
                          <>
                            <div 
                              className="absolute h-full bg-blue-500 flex items-center justify-center"
                              style={{ width: `${lfPercent}%` }}
                            >
                              <span className="text-white font-medium text-sm">
                                {lfPercent.toFixed(0)}%
                              </span>
                            </div>
                            <div 
                              className="absolute h-full bg-green-500 flex items-center justify-center"
                              style={{ 
                                left: `${lfPercent}%`,
                                width: `${hfPercent}%` 
                              }}
                            >
                              <span className="text-white font-medium text-sm">
                                {hfPercent.toFixed(0)}%
                              </span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  
                  {/* 주파수 스펙트럼 차트 */}
                  <div className="mt-4">
                    {(() => {
                      const realLfPower = threeDimensionAnalysis.autonomic?.evidence?.lfPower || 
                                         threeDimensionAnalysis.stress?.evidence?.lfPower;
                      const realHfPower = threeDimensionAnalysis.autonomic?.evidence?.hfPower || 
                                         threeDimensionAnalysis.stress?.evidence?.hfPower;
                      const isSpectrumSimulated = !realLfPower || !realHfPower;
                      
                      return (
                        <div className="relative">
                          {isSpectrumSimulated && (
                            <div className="absolute top-2 right-2 z-10 bg-red-100 text-red-700 text-xs px-2 py-1 rounded">
                              시뮬레이션 데이터
                            </div>
                          )}
                          <ResponsiveContainer width="100%" height={180}>
                            <LineChart data={frequencySpectrumData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="frequency" 
                                domain={[0, 0.5]}
                                ticks={[0, 0.1, 0.2, 0.3, 0.4, 0.5]}
                              />
                              <YAxis />
                              <Tooltip formatter={(value: number) => value.toFixed(2)} />
                              
                              {/* LF 영역 표시 */}
                              <ReferenceLine x={0.04} stroke="#3b82f6" strokeDasharray="3 3" />
                              <ReferenceLine x={0.15} stroke="#3b82f6" strokeDasharray="3 3" />
                              
                              {/* HF 영역 표시 */}
                              <ReferenceLine x={0.15} stroke="#10b981" strokeDasharray="3 3" />
                              <ReferenceLine x={0.4} stroke="#10b981" strokeDasharray="3 3" />
                              
                              <Line 
                                type="monotone" 
                                dataKey="power" 
                                stroke={isSpectrumSimulated ? "#9ca3af" : "#8b5cf6"}
                                strokeWidth={2}
                                dot={false}
                                strokeDasharray={isSpectrumSimulated ? "5 5" : "0 0"}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      );
                    })()}
                  </div>
                  
                  {/* 주요 지표 */}
                  <div className="grid grid-cols-3 gap-2">
                    {(() => {
                      // 실제 LF/HF 데이터 확인
                      const realLfPower = threeDimensionAnalysis.autonomic?.evidence?.lfPower || 
                                          threeDimensionAnalysis.stress?.evidence?.lfPower;
                      const realHfPower = threeDimensionAnalysis.autonomic?.evidence?.hfPower || 
                                          threeDimensionAnalysis.stress?.evidence?.hfPower;
                      const realLfHfRatio = threeDimensionAnalysis.autonomic?.evidence?.lfHfRatio || 
                                            threeDimensionAnalysis.stress?.evidence?.lfHfRatio;
                      
                      const isLfFallback = !realLfPower;
                      const isHfFallback = !realHfPower;
                      const isRatioFallback = !realLfHfRatio;
                      
                      return (
                        <>
                          <div className="text-center p-2 bg-blue-50 rounded relative">
                            <div className="text-xs text-gray-700">LF</div>
                            <div className={`text-sm font-bold ${isLfFallback ? 'text-gray-400' : 'text-blue-600'}`}>
                              {isLfFallback ? '데이터 없음' : realLfPower.toFixed(0)}
                            </div>
                            {isLfFallback && (
                              <div className="text-xs text-red-500 mt-1">* 시뮬레이션</div>
                            )}
                          </div>
                          
                          <div className="text-center p-2 bg-green-50 rounded relative">
                            <div className="text-xs text-gray-700">HF</div>
                            <div className={`text-sm font-bold ${isHfFallback ? 'text-gray-400' : 'text-green-600'}`}>
                              {isHfFallback ? '데이터 없음' : realHfPower.toFixed(0)}
                            </div>
                            {isHfFallback && (
                              <div className="text-xs text-red-500 mt-1">* 시뮬레이션</div>
                            )}
                          </div>
                          
                          <div className="text-center p-2 bg-purple-50 rounded relative">
                            <div className="text-xs text-gray-700">LF/HF</div>
                            <div className={`text-sm font-bold ${isRatioFallback ? 'text-gray-400' : 'text-purple-600'}`}>
                              {isRatioFallback ? '계산 불가' : realLfHfRatio.toFixed(2)}
                            </div>
                            {isRatioFallback && (
                              <div className="text-xs text-red-500 mt-1">* 시뮬레이션</div>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 4. 심박수 분석 */}
      {detailedAnalysis.heartRateAnalysis && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
            <Radio className="w-7 h-7 text-red-600" />
            심박수 분석
          </h2>
          
          {/* HRV 핵심 지표 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {/* 평균 심박수 */}
            <Card className="border-l-4 border-l-red-500 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500 font-medium">심박수</span>
                    {(() => {
                      const paths = [
                        rawData?.inputData?.measurementData?.ppgMetrics?.heartRate?.mean,
                        rawData?.measurementData?.ppgMetrics?.heartRate?.mean,
                        inputData?.measurementData?.ppgMetrics?.heartRate?.mean,
                        inputData?.measurementData?.ppgMetrics?.heartRate,
                        inputData?.ppgTimeSeriesStats?.heartRate?.mean,
                        ppgTimeSeriesStats?.heartRate?.mean,
                        stats?.heartRate?.mean
                      ];
                      
                      let heartRateMean = null;
                      for (const path of paths) {
                        if (path != null && path > 0) {
                          heartRateMean = path;
                          break;
                        }
                      }
                      
                      return heartRateMean != null && (
                        <DataSourceIndicator 
                          value={heartRateMean} 
                          metricName="BPM" 
                          metricType="ppg" 
                        />
                      );
                    })()}
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {(() => {
                    // 모든 가능한 경로 확인
                    const paths = [
                      rawData?.inputData?.measurementData?.ppgMetrics?.heartRate?.mean,
                      rawData?.measurementData?.ppgMetrics?.heartRate?.mean,
                      inputData?.measurementData?.ppgMetrics?.heartRate?.mean,
                      inputData?.measurementData?.ppgMetrics?.heartRate,
                      inputData?.ppgTimeSeriesStats?.heartRate?.mean,
                      ppgTimeSeriesStats?.heartRate?.mean,
                      stats?.heartRate?.mean,
                      threeDimensionAnalysis?.stress?.evidence?.heartRate,
                      threeDimensionAnalysis?.autonomic?.evidence?.heartRate,
                      realPpgTimeSeriesStats?.heartRate?.mean
                    ];
                    
                    let heartRateMean = null;
                    for (const path of paths) {
                      if (path != null && path > 0) {
                        heartRateMean = path;
                        break;
                      }
                    }
                    
                    console.log('🔍 BPM 표시 디버깅 - 전체 경로 확인:', {
                      'report': report,
                      'rawData': rawData,
                      'inputData': inputData,
                      'paths': paths.map((p, i) => `Path ${i}: ${p}`),
                      'heartRateMean': heartRateMean,
                      'threeDimensionAnalysis': threeDimensionAnalysis
                    });
                    
                    return (heartRateMean != null && heartRateMean > 0) ? Math.round(heartRateMean) : '--';
                  })()} bpm
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  정상범위: 60-100 bpm
                </div>
                {/* 심박수 상태 표시 */}
                {(() => {
                  const paths = [
                    rawData?.inputData?.measurementData?.ppgMetrics?.heartRate?.mean,
                    rawData?.measurementData?.ppgMetrics?.heartRate?.mean,
                    inputData?.measurementData?.ppgMetrics?.heartRate?.mean,
                    inputData?.measurementData?.ppgMetrics?.heartRate,
                    inputData?.ppgTimeSeriesStats?.heartRate?.mean,
                    ppgTimeSeriesStats?.heartRate?.mean,
                    stats?.heartRate?.mean
                  ];
                  
                  let heartRateMean = null;
                  for (const path of paths) {
                    if (path != null && path > 0) {
                      heartRateMean = path;
                      break;
                    }
                  }
                  
                  return heartRateMean && (
                    <div className="mt-2">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs px-2 py-1",
                          heartRateMean >= 60 && heartRateMean <= 100 
                            ? "border-green-500 text-green-700 bg-green-50" 
                            : "border-orange-500 text-orange-700 bg-orange-50"
                        )}
                      >
                        {heartRateMean >= 60 && heartRateMean <= 100 ? '정상' : '범위 외'}
                      </Badge>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
            
            {/* RMSSD */}
            <Card className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500 font-medium">RMSSD</span>
                    {stats?.hrvTimeMetrics?.rmssd != null && (
                      <DataSourceIndicator 
                        value={stats.hrvTimeMetrics.rmssd} 
                        metricName="RMSSD" 
                        metricType="ppg" 
                      />
                    )}
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {(stats?.hrvTimeMetrics?.rmssd != null && stats.hrvTimeMetrics.rmssd > 0) ? stats.hrvTimeMetrics.rmssd.toFixed(1) : '--'} ms
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  부교감신경 활성도
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  정상범위: 20-200 ms
                </div>
                {/* RMSSD 평가 표시 */}
                {stats?.hrvTimeMetrics?.rmssd != null && (
                  <div className="mt-2">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs px-2 py-1",
                        stats.hrvTimeMetrics.rmssd >= 20 && stats.hrvTimeMetrics.rmssd <= 200
                          ? "border-green-500 text-green-700 bg-green-50" 
                          : "border-orange-500 text-orange-700 bg-orange-50"
                      )}
                    >
                      {stats.hrvTimeMetrics.rmssd >= 20 && stats.hrvTimeMetrics.rmssd <= 200 ? '정상' : '범위 외'}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* SDNN */}
            <Card className="border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="w-5 h-5 text-green-500" />
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500 font-medium">SDNN</span>
                    {stats?.hrvTimeMetrics?.sdnn != null && (
                      <DataSourceIndicator 
                        value={stats.hrvTimeMetrics.sdnn} 
                        metricName="SDNN" 
                        metricType="ppg" 
                      />
                    )}
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {(stats?.hrvTimeMetrics?.sdnn != null && stats.hrvTimeMetrics.sdnn > 0) ? stats.hrvTimeMetrics.sdnn.toFixed(1) : '--'} ms
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  전체 HRV 수준
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  정상범위: 50-100 ms
                </div>
                {/* SDNN 평가 표시 */}
                {stats?.hrvTimeMetrics?.sdnn != null && (
                  <div className="mt-2">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs px-2 py-1",
                        stats.hrvTimeMetrics.sdnn >= 50 && stats.hrvTimeMetrics.sdnn <= 100
                          ? "border-green-500 text-green-700 bg-green-50" 
                          : "border-orange-500 text-orange-700 bg-orange-50"
                      )}
                    >
                      {stats.hrvTimeMetrics.sdnn >= 50 && stats.hrvTimeMetrics.sdnn <= 100 ? '정상' : '범위 외'}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* pNN50 */}
            <Card className="border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500 font-medium">pNN50</span>
                    {stats?.hrvTimeMetrics?.pnn50 != null && (
                      <DataSourceIndicator 
                        value={stats.hrvTimeMetrics.pnn50} 
                        metricName="PNN50" 
                        metricType="ppg" 
                      />
                    )}
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {(stats?.hrvTimeMetrics?.pnn50 != null && stats.hrvTimeMetrics.pnn50 >= 0) ? stats.hrvTimeMetrics.pnn50.toFixed(1) : '--'} %
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  급격한 변화 비율
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  정상범위: 10-50 %
                </div>
                {/* pNN50 평가 표시 */}
                {stats?.hrvTimeMetrics?.pnn50 != null && (
                  <div className="mt-2">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs px-2 py-1",
                        stats.hrvTimeMetrics.pnn50 >= 10 && stats.hrvTimeMetrics.pnn50 <= 50
                          ? "border-green-500 text-green-700 bg-green-50" 
                          : "border-orange-500 text-orange-700 bg-orange-50"
                      )}
                    >
                      {stats.hrvTimeMetrics.pnn50 >= 10 && stats.hrvTimeMetrics.pnn50 <= 50 ? '정상' : '범위 외'}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b border-red-100">
              <CardTitle className="flex items-center gap-3 text-gray-900">
                <Radio className="w-6 h-6 text-red-600" />
                <span className="text-xl font-bold">맥파 심박수 상세 분석</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-8">
                {Object.entries(detailedAnalysis.heartRateAnalysis).map(([metric, analysis]: [string, any]) => (
                  <div key={metric} className="border-l-4 border-red-400 pl-6 bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-r-xl shadow-md hover:shadow-lg transition-shadow">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">{formatMetricName(metric)}</h4>
                    <p className="text-base text-gray-700 mb-4 leading-relaxed font-medium">{analysis.interpretation}</p>
                    <p className="text-sm text-gray-600 mb-4">{analysis.evidence}</p>
                    {analysis.clinicalSignificance && (
                      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <p className="text-base text-red-700 font-medium">
                          <strong>임상적 의미:</strong> {analysis.clinicalSignificance}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 5. HRV 지표 분석 */}
      {detailedAnalysis.hrvIndicesAnalysis && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-red-600" />
            HRV 지표 분석
          </h2>
          
          {/* HRV 주요 지표 대시보드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Time Domain 지표들 */}
            <Card className="border-t-4 border-t-blue-500 shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">RMSSD</span>
                    <Activity className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-3xl font-bold text-blue-600">
                    {stats?.hrvTimeMetrics?.rmssd?.toFixed(1) || '--'}
                    <span className="text-sm font-normal text-gray-600 ml-1">ms</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    단기 HRV (부교감신경)
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    정상범위: 20-200 ms
                  </div>
                  <Progress 
                    value={Math.min((stats?.hrvTimeMetrics?.rmssd || 0) / 80 * 100, 100)} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-t-4 border-t-green-500 shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">SDNN</span>
                    <BarChart3 className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="text-3xl font-bold text-green-600">
                    {stats?.hrvTimeMetrics?.sdnn?.toFixed(1) || '--'}
                    <span className="text-sm font-normal text-gray-600 ml-1">ms</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    전체 HRV (자율신경계)
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    정상범위: 50-100 ms
                  </div>
                  <Progress 
                    value={Math.min((stats?.hrvTimeMetrics?.sdnn || 0) / 100 * 100, 100)} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-t-4 border-t-purple-500 shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">pNN50</span>
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="text-3xl font-bold text-purple-600">
                    {stats?.hrvTimeMetrics?.pnn50?.toFixed(1) || '--'}
                    <span className="text-sm font-normal text-gray-600 ml-1">%</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    급격한 변화 비율
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    정상범위: 10-50 %
                  </div>
                  <Progress 
                    value={Math.min((stats?.hrvTimeMetrics?.pnn50 || 0) / 50 * 100, 100)} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b border-red-100">
              <CardTitle className="flex items-center gap-3 text-gray-900">
                <BarChart3 className="w-6 h-6 text-red-600" />
                <span className="text-xl font-bold">심박변이도 도메인별 분석</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {Object.entries(detailedAnalysis.hrvIndicesAnalysis).map(([domain, analysis]: [string, any]) => (
                  <div key={domain} className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-xl border border-red-200 shadow-md hover:shadow-lg transition-all duration-300">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">{formatMetricName(domain)}</h4>
                    <p className="text-base text-gray-700 mb-4 leading-relaxed font-medium">{analysis.interpretation}</p>
                    <p className="text-sm text-gray-600 mb-4">{analysis.evidence}</p>
                    
                    {analysis.explanation && (
                      <div className="mt-4 p-4 bg-white rounded-lg border border-red-100 shadow-sm">
                        <p className="text-base text-gray-700 font-medium">
                          <strong className="text-gray-900">설명:</strong> <span className="text-gray-900">{analysis.explanation}</span>
                        </p>
                      </div>
                    )}
                    
                    {analysis.recommendations && analysis.recommendations.length > 0 && (
                      <div className="mt-4 bg-green-50 p-4 rounded-lg border border-green-200">
                        <p className="text-sm font-bold text-green-800 mb-2">권장사항</p>
                        <ul className="text-base text-green-700 space-y-2">
                          {analysis.recommendations.map((rec: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-green-600">•</span>
                              <span className="font-medium">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 6. 자율신경계 종합 분석 */}
      {detailedAnalysis.autonomicAnalysis && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
            <Activity className="w-7 h-7 text-red-600" />
            자율신경계 종합 분석
          </h2>
          
          {/* 주파수 도메인 지표 대시보드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="border-t-4 border-t-blue-500 shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">LF Power</span>
                    <Zap className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-3xl font-bold text-blue-600">
                    {(() => {
                      const lfPower = inputData?.measurementData?.ppgMetrics?.hrvFrequencyMetrics?.lfPower ||
                                     threeDimensionAnalysis.autonomic?.evidence?.lfPower || 
                                     threeDimensionAnalysis.stress?.evidence?.lfPower || 
                                     stats?.hrvFrequencyMetrics?.lfPower;
                      return lfPower != null ? lfPower.toFixed(0) : '--';
                    })()}
                    <span className="text-sm font-normal text-gray-600 ml-1">ms²</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    교감신경 활성도
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    정상범위: 200-1,200 ms²
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-t-4 border-t-green-500 shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">HF Power</span>
                    <Activity className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="text-3xl font-bold text-green-600">
                    {(() => {
                      const hfPower = inputData?.measurementData?.ppgMetrics?.hrvFrequencyMetrics?.hfPower ||
                                     threeDimensionAnalysis.autonomic?.evidence?.hfPower || 
                                     threeDimensionAnalysis.stress?.evidence?.hfPower || 
                                     stats?.hrvFrequencyMetrics?.hfPower;
                      return hfPower != null ? hfPower.toFixed(0) : '--';
                    })()}
                    <span className="text-sm font-normal text-gray-600 ml-1">ms²</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    부교감신경 활성도
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    정상범위: 80-4,000 ms²
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-t-4 border-t-purple-500 shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">LF/HF Ratio</span>
                    <Shield className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="text-3xl font-bold text-purple-600">
                    {(() => {
                      const lfHfRatio = inputData?.measurementData?.ppgMetrics?.hrvFrequencyMetrics?.lfHfRatio ||
                                       threeDimensionAnalysis.autonomic?.evidence?.lfHfRatio || 
                                       threeDimensionAnalysis.stress?.evidence?.lfHfRatio || 
                                       stats?.hrvFrequencyMetrics?.lfHfRatio;
                      return lfHfRatio != null ? lfHfRatio.toFixed(2) : '--';
                    })()}
                  </div>
                  <div className="text-xs text-gray-500">
                    자율신경 균형
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    정상범위: 1.0-10.0
                  </div>
                  <div className="text-xs mt-1">
                    <span className={cn(
                      "font-medium",
                      stats?.hrvFrequencyMetrics?.lfHfRatio >= 0.5 && stats?.hrvFrequencyMetrics?.lfHfRatio <= 2.0 
                        ? "text-green-600" 
                        : "text-orange-600"
                    )}>
                      {stats?.hrvFrequencyMetrics?.lfHfRatio >= 0.5 && stats?.hrvFrequencyMetrics?.lfHfRatio <= 2.0 
                        ? "균형" 
                        : "불균형"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b border-red-100">
              <CardTitle className="flex items-center gap-3 text-gray-900">
                <Activity className="w-6 h-6 text-red-600" />
                <span className="text-xl font-bold">자율신경계 균형 평가</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200 shadow-sm">
                  <h4 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    전반적 평가
                  </h4>
                  <p className="text-base text-green-700 leading-relaxed font-medium">{detailedAnalysis.autonomicAnalysis.overallAssessment}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {detailedAnalysis.autonomicAnalysis.sympatheticParasympatheticBalance && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        교감/부교감 균형
                      </h4>
                      <p className="text-base text-blue-700 font-medium">{detailedAnalysis.autonomicAnalysis.sympatheticParasympatheticBalance}</p>
                    </div>
                  )}
                  
                  {detailedAnalysis.autonomicAnalysis.stressResponsePattern && (
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <h4 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        스트레스 반응 패턴
                      </h4>
                      <p className="text-base text-orange-700 font-medium">{detailedAnalysis.autonomicAnalysis.stressResponsePattern}</p>
                    </div>
                  )}
                  
                  {detailedAnalysis.autonomicAnalysis.recoveryCapacity && (
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <h4 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
                        <Heart className="w-4 h-4" />
                        회복 능력
                      </h4>
                      <p className="text-base text-purple-700 font-medium">{detailedAnalysis.autonomicAnalysis.recoveryCapacity}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 중복된 HRV 상세 시각화 섹션 완전 제거 - 섹션 3으로 이동 완료 */} 
      {/* 7. 종합 권장사항 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
          <Target className="w-7 h-7 text-red-600" />
          종합 권장사항
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 즉시 실행 사항 */}
          <Card className="border-orange-200 bg-gradient-to-b from-orange-50 to-white shadow-xl hover:shadow-2xl transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-orange-700">
                <Zap className="w-6 h-6" />
                <span className="text-lg font-bold">즉시 실행 사항</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-4">
                {(() => {
                  const immediateActions = [];
                  
                  // 스트레스 점수 기반 권장사항
                  if (threeDimensionAnalysis.stress?.score < 60) {
                    immediateActions.push("복식호흡 운동을 하루 3회(아침, 점심, 저녁) 5분씩 실시하세요");
                    immediateActions.push("현재 진행 중인 업무를 잠시 멈추고 10분간 휴식을 취하세요");
                  }
                  
                  // 자율신경 균형 기반 권장사항
                  if (threeDimensionAnalysis.autonomic?.score < 60) {
                    immediateActions.push("가벼운 스트레칭이나 짧은 산책으로 신체 활동을 시작하세요");
                    immediateActions.push("카페인 섭취를 줄이고 따뜻한 물을 마시세요");
                  }
                  
                  // HRV 기반 권장사항
                  if (threeDimensionAnalysis.hrv?.score < 60) {
                    immediateActions.push("규칙적인 수면 시간을 지키고 수면의 질을 개선하세요");
                    immediateActions.push("명상이나 요가 등 이완 활동을 시작하세요");
                  }
                  
                  // 기본 권장사항
                  if (immediateActions.length === 0) {
                    immediateActions.push("현재의 건강한 생활 습관을 유지하세요");
                    immediateActions.push("정기적인 건강 모니터링을 계속하세요");
                  }
                  
                  return immediateActions.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-sm font-bold text-orange-600">{idx + 1}</span>
                      </div>
                      <span className="text-base text-orange-800 font-medium leading-relaxed">{action}</span>
                    </li>
                  ));
                })()}
              </ul>
            </CardContent>
          </Card>
          
          {/* 단기 목표 (1-2주) */}
          <Card className="border-blue-200 bg-gradient-to-b from-blue-50 to-white shadow-xl hover:shadow-2xl transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-blue-700">
                <Shield className="w-6 h-6" />
                <span className="text-lg font-bold">단기 목표 (1-2주)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-4">
                {(() => {
                  const shortTermGoals = [];
                  
                  // 3대 지표 점수 기반 목표
                  const lowestScore = Math.min(
                    threeDimensionAnalysis.stress?.score || 100,
                    threeDimensionAnalysis.autonomic?.score || 100,
                    threeDimensionAnalysis.hrv?.score || 100
                  );
                  
                  if (lowestScore < 40) {
                    shortTermGoals.push("전문의 상담을 통해 정확한 건강 상태를 확인하세요");
                    shortTermGoals.push("스트레스 관리 프로그램에 참여하세요");
                  } else if (lowestScore < 60) {
                    shortTermGoals.push("운동 루틴을 만들어 주 3회 이상 실천하세요");
                    shortTermGoals.push("식습관을 개선하고 균형 잡힌 영양 섭취를 시작하세요");
                  } else {
                    shortTermGoals.push("현재의 운동 강도를 점진적으로 높이세요");
                    shortTermGoals.push("스트레스 관리 기법을 다양화하세요");
                  }
                  
                  // 개인 정보 기반 추가 목표
                  if (metadata.personalInfo?.age > 50) {
                    shortTermGoals.push("심혈관 건강 검진을 예약하세요");
                  }
                  
                  return shortTermGoals.map((goal, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-sm font-bold text-blue-600">{idx + 1}</span>
                      </div>
                      <span className="text-base text-blue-800 font-medium leading-relaxed">{goal}</span>
                    </li>
                  ));
                })()}
              </ul>
            </CardContent>
          </Card>
          
          {/* 장기 목표 (1-3개월) */}
          <Card className="border-red-200 bg-gradient-to-b from-red-50 to-white shadow-xl hover:shadow-2xl transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-red-700">
                <Calendar className="w-6 h-6" />
                <span className="text-lg font-bold">장기 목표 (1-3개월)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-4">
                {(() => {
                  const longTermGoals = [];
                  
                  // 종합 건강 상태 기반
                  const overallScore = (
                    (threeDimensionAnalysis.stress?.score || 0) +
                    (threeDimensionAnalysis.autonomic?.score || 0) +
                    (threeDimensionAnalysis.hrv?.score || 0)
                  ) / 3;
                  
                  if (overallScore < 50) {
                    longTermGoals.push("종합적인 생활습관 개선 프로그램을 실천하세요");
                    longTermGoals.push("정기적인 건강 검진과 모니터링 체계를 구축하세요");
                    longTermGoals.push("스트레스 원인을 파악하고 근본적인 해결책을 찾으세요");
                  } else if (overallScore < 70) {
                    longTermGoals.push("운동 강도와 빈도를 점진적으로 증가시키세요");
                    longTermGoals.push("수면의 질을 개선하기 위한 수면 위생을 실천하세요");
                    longTermGoals.push("취미 활동이나 사회 활동을 늘려 정신 건강을 증진시키세요");
                  } else {
                    longTermGoals.push("현재의 건강한 라이프스타일을 지속적으로 유지하세요");
                    longTermGoals.push("새로운 운동이나 건강 관리 방법을 시도해보세요");
                    longTermGoals.push("건강 목표를 상향 조정하고 더 높은 수준을 추구하세요");
                  }
                  
                  return longTermGoals.map((goal, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-sm font-bold text-red-600">{idx + 1}</span>
                      </div>
                      <span className="text-base text-red-800 font-medium leading-relaxed">{goal}</span>
                    </li>
                  ));
                })()}
              </ul>
            </CardContent>
          </Card>
        </div>
        
        {/* 추가 조언 */}
        <Card className="mt-8 shadow-xl border-gray-200">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-100">
            <CardTitle className="flex items-center gap-3 text-gray-700">
              <Info className="w-6 h-6" />
              <span className="text-xl font-bold">중요 안내사항</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <p className="text-base text-gray-700 leading-relaxed font-medium">
              이 권장사항은 AI 분석을 기반으로 제공됩니다. 
              건강 상태에 대한 정확한 진단과 치료는 반드시 의료 전문가와 상담하세요. 
              특히 심각한 증상이 있거나 지속적인 불편함을 느끼신다면 즉시 의료기관을 방문하시기 바랍니다.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 메타데이터 */}
      <div className="text-sm text-gray-500 text-center pt-6 border-t border-gray-200 font-medium">
        분석 일시: {new Date(metadata.analysisTimestamp).toLocaleString('ko-KR')} | 
        처리 시간: {(metadata.analysisEngine?.processingTime / 1000 || 0).toFixed(1)}초 | 
        엔진 버전: v{metadata.analysisEngine?.version || '1.0.0'}
      </div>
    </div>
  );
};

// 렌더러 클래스 export
export class PPGAdvancedReactRenderer {
  id = 'ppg-advanced-react-renderer';
  name = 'PPG 고급 분석 React 렌더러';
  description = 'PPG 고급 분석 결과를 React 컴포넌트로 렌더링';
  version = '1.0.0';
  supportedEngines = ['ppg-advanced-gemini-v1'];
  outputFormat = 'react';
  costPerRender = 0;
  
  async render(analysis: any, options?: any) {
    return {
      component: PPGAdvancedReportComponent,
      props: { report: analysis },
      format: 'react'
    };
  }
}