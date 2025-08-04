/**
 * EEG 전문 분석 v1 리포트 뷰어
 * 의료 전문가용 뇌파 분석 결과를 시각화하는 React 컴포넌트
 */

import React from 'react';
import { 
  Brain, Activity, AlertCircle, CheckCircle, Info, TrendingUp, 
  Heart, BrainCircuit, Zap, BarChart3, Target, Smile, Focus, 
  Shield, Timer, Calendar, User, AlertTriangle, Lightbulb,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card';
import { Badge } from '@ui/badge';
import { Progress } from '@ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/tabs';
import { cn } from '@ui/utils';

/**
 * EEG 전문 분석용 색상 체계
 */
const EEG_COLORS = {
  primary: '#6366f1',      // 보라색 - 뇌파 메인
  arousal: '#f59e0b',      // 주황색 - 각성도
  valence: '#10b981',      // 녹색 - 감정균형
  focus: '#3b82f6',        // 파란색 - 집중력
  stress: '#ef4444',       // 빨간색 - 스트레스
  
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
    case 'mild': return '경미';
    case 'moderate': return '중등도';
    case 'severe': return '심각';
    default: return '평가중';
  }
};

const getDimensionIcon = (dimension: string): React.ReactElement => {
  if (dimension.includes('각성') || dimension.includes('arousal')) {
    return <Zap className="w-6 h-6 text-orange-500" />;
  } else if (dimension.includes('감정균형도') || dimension.includes('정서가') || dimension.includes('valence')) {
    return <Smile className="w-6 h-6 text-green-500" />;
  } else if (dimension.includes('집중') || dimension.includes('focus')) {
    return <Focus className="w-6 h-6 text-blue-500" />;
  } else if (dimension.includes('스트레스') || dimension.includes('stress')) {
    return <Shield className="w-6 h-6 text-red-500" />;
  }
  return <Brain className="w-6 h-6 text-purple-500" />;
};

const formatBandName = (band: string): string => {
  const bandNameMap: Record<string, string> = {
    frontalNeuroActivity: '전두엽 신경활성도',
    totalPower: '총 전력',
    delta: 'Delta (0.5-4 Hz)',
    theta: 'Theta (4-8 Hz)', 
    alpha: 'Alpha (8-12 Hz)',
    beta: 'Beta (12-30 Hz)',
    gamma: 'Gamma (30-100 Hz)'
  };
  return bandNameMap[band] || band;
};

const getBandFrequency = (band: string): string => {
  const freqMap: Record<string, string> = {
    delta: '0.5-4 Hz',
    theta: '4-8 Hz',
    alpha: '8-12 Hz',
    beta: '12-30 Hz',
    gamma: '30-100 Hz'
  };
  return freqMap[band] || '';
};

const formatIndexName = (index: string): string => {
  const nameMap: Record<string, string> = {
    focusIndex: '집중력 지수',
    stressIndex: '스트레스 지수',
    relaxationIndex: '이완 지수',
    hemisphericBalance: '좌우뇌 균형',
    cognitiveLoad: '인지 부하',
    emotionalStability: '정서 안정성'
  };
  return nameMap[index] || index;
};

/**
 * EEG 리포트 헤더 컴포넌트
 */
const EEGReportHeader: React.FC<{ metadata: any }> = ({ metadata }) => {
  const age = metadata?.personalInfo?.age || '미입력';
  const gender = metadata?.personalInfo?.gender === 'male' ? '남성' : 
                 metadata?.personalInfo?.gender === 'female' ? '여성' : '미입력';
  const occupation = metadata?.personalInfo?.occupation;
  const signalQuality = (metadata?.dataQuality?.signalQuality * 100 || 0).toFixed(0);
  const measurementDate = metadata?.analysisTimestamp ? 
    new Date(metadata.analysisTimestamp).toLocaleDateString('ko-KR') : 
    new Date().toLocaleDateString('ko-KR');
  
  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-100 rounded-full">
            <Brain className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">EEG 전문 뇌파 분석 결과</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span>{age}세 {gender}</span>
              {occupation && <span>• {occupation}</span>}
              <span>• 측정일: {measurementDate}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge className="bg-purple-600 text-white">
            신호 품질: {signalQuality}%
          </Badge>
          <div className="text-xs text-gray-500">
            분석 엔진: EEG Advanced v1.0
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 4대 지표 대시보드 컴포넌트
 */
const FourDimensionDashboard: React.FC<{ data: any }> = ({ data }) => {
  if (!data || Object.keys(data).length === 0) return null;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Object.entries(data).map(([key, dimension]: [string, any]) => (
        <Card key={key} className="border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* 헤더 */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getDimensionIcon(dimension.dimension)}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {dimension.dimension}
                    </h3>
                    <p className="text-sm text-gray-600">{dimension.level}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-purple-600">
                    {dimension.score}
                  </div>
                  <div className="text-xs text-gray-500">건강도</div>
                </div>
              </div>
              
              {/* 점수 시각화 */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-red-500">위험</span>
                  <span className="text-green-500">정상</span>
                </div>
                <div className="relative">
                  <Progress 
                    value={dimension.score} 
                    className="h-3"
                  />
                  <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-20 rounded-full" />
                </div>
              </div>
              
              {/* 임상적 의미 */}
              <div className="mb-4">
                <Badge 
                  variant="outline" 
                  className={cn("border", getClinicalSignificanceColor(dimension.clinicalSignificance))}
                >
                  {getClinicalSignificanceLabel(dimension.clinicalSignificance)}
                </Badge>
              </div>
              
              {/* 해석 */}
              <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                {dimension.interpretation}
              </p>
              
              {/* 개인 맞춤 해석 */}
              {dimension.personalizedInterpretation && (
                <div className="bg-blue-50 p-3 rounded-lg mb-3">
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-blue-800">개인 맞춤 해석</p>
                      <p className="text-sm text-blue-700 mt-1">
                        {dimension.personalizedInterpretation}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 권장사항 */}
              {dimension.recommendations?.length > 0 && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-green-800">권장사항</p>
                      <ul className="text-sm text-green-700 mt-1 space-y-1">
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
 * 주파수 대역별 분석 컴포넌트
 */
const BandPowerAnalysis: React.FC<{ data: any, inputData?: any }> = ({ data, inputData }) => {
  if (!data) return null;
  
  // 실제 측정값 추출 (eegTimeSeriesStats에서)
  const bandPowers = inputData?.eegTimeSeriesStats?.bandPowers || inputData?.measurementData?.eegMetrics?.bandPowers || {};
  
  // 디버깅 로그
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 BandPowerAnalysis 데이터 확인:', {
      hasInputData: !!inputData,
      hasEegTimeSeriesStats: !!inputData?.eegTimeSeriesStats,
      hasBandPowers: !!bandPowers,
      bandPowersKeys: Object.keys(bandPowers),
      sampleBandData: bandPowers.delta || bandPowers.alpha
    });
  }
  
  // 정상 범위 정의
  const normalRanges = {
    delta: { min: 50, max: 150, unit: 'μV²' },
    theta: { min: 80, max: 200, unit: 'μV²' },
    alpha: { min: 200, max: 500, unit: 'μV²' },
    beta: { min: 100, max: 300, unit: 'μV²' },
    gamma: { min: 50, max: 200, unit: 'μV²' },
    frontalNeuroActivity: { min: 850, max: 1150, unit: 'μV²' } // Total Power 정상 범위
  };
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <BarChart3 className="w-5 h-5 text-purple-600" />
          뇌파 주파수 대역별 분석
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* 원하는 순서로 정렬: delta, theta, alpha, beta, gamma, frontalNeuroActivity */}
          {['delta', 'theta', 'alpha', 'beta', 'gamma', 'frontalNeuroActivity'].map((band) => {
            const analysis = data[band];
            if (!analysis) return null;
            // 실제 측정값들
            const bandData = bandPowers[band] || {};
            
            // 실제 데이터가 있는지 확인
            let hasRealData = bandData.mean !== undefined;
            
            // evidence에 측정값이 있으면 실제 데이터로 간주
            if (analysis.evidence) {
              let valueMatch = null;
              
              if (band === 'frontalNeuroActivity') {
                valueMatch = analysis.evidence.match(/Total Power:\s*([\d.]+)μV²/);
              } else {
                valueMatch = analysis.evidence.match(/^([\d.]+)μV²/);
              }
              
              if (valueMatch) {
                hasRealData = true;
              }
            }
            
            // 각 주파수 대역별 현실적인 기본값 설정 (실제 데이터가 없을 때만 사용)
            const defaultValues = {
              delta: { mean: 86.38 },
              theta: { mean: 103.88 },
              alpha: { mean: 156.25 },
              beta: { mean: 178.94 },
              gamma: { mean: 67.83 },
              frontalNeuroActivity: { mean: 1000 } // Total Power 기본값
            };
            const defaults = defaultValues[band as keyof typeof defaultValues] || { mean: 100 };
            
            // evidence에서 실제 측정값 추출
            let actualMeanValue = hasRealData ? bandData.mean : defaults.mean;
            
            if (analysis.evidence) {
              let valueMatch = null;
              
              if (band === 'frontalNeuroActivity') {
                // "Total Power: 1423.53μV²" 형태에서 숫자 추출
                valueMatch = analysis.evidence.match(/Total Power:\s*([\d.]+)μV²/);
              } else {
                // "86.38μV² (정상범위: 50-150μV²)" 형태에서 숫자 추출
                valueMatch = analysis.evidence.match(/^([\d.]+)μV²/);
              }
              
              if (valueMatch) {
                actualMeanValue = parseFloat(valueMatch[1]);
                console.log(`📊 ${band} 대역 실제값 추출: ${actualMeanValue}μV²`);
              }
            }
            
            const meanValue = actualMeanValue;
            
            // 데이터 소스 로깅 (개발 시에만)
            if (process.env.NODE_ENV === 'development') {
              console.log(`📊 ${band} 대역 데이터 소스:`, hasRealData ? '실제 측정값' : 'fallback 값', {
                mean: meanValue
              });
            }
            const normalRange = normalRanges[band as keyof typeof normalRanges];
            
            // 상태 판정 (5단계)
            let status = 'normal';
            if (normalRange) {
              const graphMax = normalRange.max * 2; // 그래프 최대값 (normalRange.max * 2)
              const graphMin = 0; // 그래프 최소값
              
              if (meanValue < graphMin) {
                status = 'veryLow'; // 매우 낮음 (그래프 범위 미만)
              } else if (meanValue < normalRange.min) {
                status = 'low'; // 낮음
              } else if (meanValue > graphMax) {
                status = 'veryHigh'; // 매우 높음 (그래프 범위 초과)
              } else if (meanValue > normalRange.max) {
                status = 'high'; // 높음
              } // else는 normal (정상)
            }
            
            return (
              <div key={band} className="border-l-4 border-purple-300 pl-4 bg-gray-50 p-4 rounded-r-lg">
                {/* 제목 */}
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-semibold text-gray-900">
                    {formatBandName(band)}
                  </h4>
                  {!hasRealData && (
                    <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-300 text-xs">
                      예상값
                    </Badge>
                  )}
                </div>
                
                {/* 평균값 (정상범위) */}
                <div className="mb-3">
                  <span className="text-lg font-bold text-purple-600">{meanValue.toFixed(2)} μV²</span>
                  {normalRange && (
                    <span className="text-sm text-gray-500 ml-2">
                      (정상범위: {normalRange.min}-{normalRange.max} {normalRange.unit})
                    </span>
                  )}
                  <Badge variant="outline" className={cn(
                    "ml-2",
                    status === 'normal' ? 'bg-green-50 text-green-700 border-green-300' :
                    status === 'high' ? 'bg-yellow-50 text-yellow-700 border-yellow-300' :
                    status === 'veryHigh' ? 'bg-red-50 text-red-700 border-red-300' :
                    status === 'low' ? 'bg-orange-50 text-orange-700 border-orange-300' :
                    status === 'veryLow' ? 'bg-purple-50 text-purple-700 border-purple-300' :
                    'bg-gray-50 text-gray-700 border-gray-300'
                  )}>
                    {status === 'normal' ? '정상' : 
                     status === 'high' ? '높음' :
                     status === 'veryHigh' ? '매우 높음' :
                     status === 'low' ? '낮음' :
                     status === 'veryLow' ? '매우 낮음' : '알 수 없음'}
                  </Badge>
                </div>
                
                {/* 해석 */}
                {(analysis.interpretation || analysis.clinicalSignificance) && (
                  <div className="mb-3 text-sm text-gray-700">
                    {analysis.interpretation || analysis.clinicalSignificance}
                  </div>
                )}
                
                {/* 그래프 */}
                <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
                  {normalRange && (
                    <>
                      {/* 정상 범위 표시 */}
                      <div 
                        className="absolute h-full bg-green-200"
                        style={{
                          left: `${(normalRange.min / (normalRange.max * 2)) * 100}%`,
                          width: `${((normalRange.max - normalRange.min) / (normalRange.max * 2)) * 100}%`
                        }}
                      />
                      {/* 평균값 표시 */}
                      <div 
                        className="absolute w-1 h-full bg-purple-600"
                        style={{
                          left: `${(meanValue / (normalRange.max * 2)) * 100}%`
                        }}
                      />
                    </>
                  )}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>{normalRange ? normalRange.max * 2 : 1000} μV²</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * 뇌파 지수 히트맵 컴포넌트
 */
const EEGIndicesHeatmap: React.FC<{ data: any }> = ({ data }) => {
  if (!data) return null;
  
  const getIndexScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Brain className="w-5 h-5 text-purple-600" />
          뇌파 지수 분석
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(data).map(([index, analysis]: [string, any]) => (
            <div key={index} className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-lg border">
              <div className="text-center mb-3">
                <div className="text-lg font-bold text-purple-700">
                  {typeof analysis === 'number' ? analysis.toFixed(2) : 
                   typeof analysis === 'object' && analysis.value !== undefined ? analysis.value.toFixed(2) :
                   'N/A'}
                </div>
                <div className="text-sm font-medium text-gray-700">
                  {formatIndexName(index)}
                </div>
              </div>
              
              {/* 점수 시각화 원형 게이지 */}
              <div className="relative w-16 h-16 mx-auto mb-3">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32" cy="32" r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-gray-200"
                  />
                  {(() => {
                    const value = typeof analysis === 'number' ? analysis : 
                                typeof analysis === 'object' && analysis.value !== undefined ? analysis.value : 0;
                    const normalizedScore = Math.min(100, Math.max(0, value * 25)); // 0-4 범위를 0-100으로 변환
                    return (
                      <circle
                        cx="32" cy="32" r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - normalizedScore / 100)}`}
                        className={getIndexScoreColor(normalizedScore)}
                      />
                    );
                  })()}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-700">
                    {(() => {
                      const value = typeof analysis === 'number' ? analysis : 
                                  typeof analysis === 'object' && analysis.value !== undefined ? analysis.value : 0;
                      const normalizedScore = Math.min(100, Math.max(0, value * 25));
                      return Math.round(normalizedScore);
                    })()}
                  </span>
                </div>
              </div>
              
              <p className="text-xs text-gray-600 text-center">
                {typeof analysis === 'object' && analysis.interpretation ? 
                  analysis.interpretation : 
                  `${formatIndexName(index)} 측정값`}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * 종합 평가 컴포넌트
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
    </div>
  );
};

/**
 * 개선 방안 액션 플랜 컴포넌트
 */
const ImprovementPlan: React.FC<{ data: any }> = ({ data }) => {
  if (!data) return null;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* 단기 목표 */}
      {data.shortTermGoals?.length > 0 && (
        <Card className="border-green-200 bg-gradient-to-b from-green-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Timer className="w-5 h-5" />
              단기 목표 (1-4주)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.shortTermGoals.map((goal: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-green-600">{idx + 1}</span>
                  </div>
                  <span className="text-sm text-green-800">{goal}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      
      {/* 장기 목표 */}
      {data.longTermGoals?.length > 0 && (
        <Card className="border-blue-200 bg-gradient-to-b from-blue-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Calendar className="w-5 h-5" />
              장기 목표 (3-6개월)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.longTermGoals.map((goal: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-blue-600">{idx + 1}</span>
                  </div>
                  <span className="text-sm text-blue-800">{goal}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      
      {/* 실행 계획 */}
      {data.actionItems?.length > 0 && (
        <Card className="border-purple-200 bg-gradient-to-b from-purple-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Zap className="w-5 h-5" />
              실행 계획
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.actionItems.map((item: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-3 h-3 text-purple-600" />
                  </div>
                  <span className="text-sm text-purple-800">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

/**
 * 메인 EEG 리포트 컴포넌트
 */
interface EEGAdvancedReportProps {
  data: any;
}

export const EEGAdvancedReportComponent: React.FC<EEGAdvancedReportProps> = ({ data }) => {
  // 데이터 유효성 검사
  if (!data) {
    return (
      <Card className="p-8">
        <CardContent className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">EEG 분석 데이터를 불러올 수 없습니다.</p>
        </CardContent>
      </Card>
    );
  }
  
  // 파이프라인 리포트에서 data.report로 전달되는 경우 처리
  const reportData = data.report || data;
  const analysisData = reportData || {};
  
  // 디버깅을 위한 로그 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 EEGAdvancedReportComponent 데이터 구조:', {
      data,
      reportData,
      analysisData,
      hasRawData: !!analysisData.rawData,
      hasEegAdvancedAnalysis: !!analysisData.rawData?.eegAdvancedAnalysis,
      detailedAnalysisInRoot: !!analysisData.insights?.detailedAnalysis
    });
  }
  
  // rawData 내부의 eegAdvancedAnalysis도 확인
  const eegAdvancedAnalysis = analysisData.rawData?.eegAdvancedAnalysis || analysisData;
  
  // insights.detailedAnalysis가 JSON 문자열인 경우 파싱
  let parsedDetailedAnalysis = {};
  if (analysisData.insights?.detailedAnalysis && typeof analysisData.insights.detailedAnalysis === 'string') {
    try {
      parsedDetailedAnalysis = JSON.parse(analysisData.insights.detailedAnalysis);
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Parsed detailedAnalysis:', parsedDetailedAnalysis);
      }
    } catch (e) {
      console.error('❌ Failed to parse detailedAnalysis:', e);
    }
  }
  
  // 새로운 4대 지표 구조 지원
  const fourDimensionAnalysis = parsedDetailedAnalysis.fourDimensionAnalysis || eegAdvancedAnalysis.fourDimensionAnalysis || analysisData.fourDimensionAnalysis || {};
  const detailedAnalysis = parsedDetailedAnalysis.detailedDataAnalysis || eegAdvancedAnalysis.detailedDataAnalysis || analysisData.detailedDataAnalysis || {};
  const comprehensiveAssessment = parsedDetailedAnalysis.comprehensiveAssessment || eegAdvancedAnalysis.comprehensiveAssessment || analysisData.comprehensiveAssessment || {};
  const metadata = parsedDetailedAnalysis.metadata || eegAdvancedAnalysis.metadata || analysisData.metadata || {};
  
  // 실제 측정값 추출 (rawData.inputData에서)
  const inputData = analysisData.rawData?.inputData || {};
  const eegTimeSeriesStats = inputData.eegTimeSeriesStats || {};
  
  // 7대 지표 분석 생성 (실제 측정값 기반)
  if (!detailedAnalysis.eegIndicesAnalysis && eegTimeSeriesStats.eegIndices) {
    detailedAnalysis.eegIndicesAnalysis = {
      focusIndex: {
        value: eegTimeSeriesStats.eegIndices.focusIndex?.mean || 0,
        interpretation: `Focus Index ${(eegTimeSeriesStats.eegIndices.focusIndex?.mean || 0).toFixed(2)}는 집중력 상태를 나타냅니다.`,
        normalRange: '1.8 - 2.4'
      },
      relaxationIndex: {
        value: eegTimeSeriesStats.eegIndices.relaxationIndex?.mean || 0,
        interpretation: `Relaxation Index ${(eegTimeSeriesStats.eegIndices.relaxationIndex?.mean || 0).toFixed(2)}는 이완 상태를 나타냅니다.`,
        normalRange: '0.18 - 0.22'
      },
      stressIndex: {
        value: eegTimeSeriesStats.eegIndices.stressIndex?.mean || 0,
        interpretation: `Stress Index ${(eegTimeSeriesStats.eegIndices.stressIndex?.mean || 0).toFixed(2)}는 스트레스 수준을 나타냅니다.`,
        normalRange: '2.8 - 4.0'
      },
      hemisphericBalance: {
        value: eegTimeSeriesStats.eegIndices.hemisphericBalance?.mean || 0,
        interpretation: `Hemispheric Balance ${(eegTimeSeriesStats.eegIndices.hemisphericBalance?.mean || 0).toFixed(3)}는 좌우뇌 균형을 나타냅니다.`,
        normalRange: '-0.1 to 0.1'
      },
      cognitiveLoad: {
        value: eegTimeSeriesStats.eegIndices.cognitiveLoad?.mean || 0,
        interpretation: `Cognitive Load ${(eegTimeSeriesStats.eegIndices.cognitiveLoad?.mean || 0).toFixed(2)}는 인지 부하를 나타냅니다.`,
        normalRange: '0.3 - 0.5'
      },
      emotionalStability: {
        value: eegTimeSeriesStats.eegIndices.emotionalStability?.mean || 0,
        interpretation: `Emotional Stability ${(eegTimeSeriesStats.eegIndices.emotionalStability?.mean || 0).toFixed(2)}는 정서적 안정성을 나타냅니다.`,
        normalRange: '0.8 - 1.2'
      }
    };
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 추출된 데이터:', {
      fourDimensionAnalysis,
      detailedAnalysis,
      hasCognitiveStateAnalysis: !!detailedAnalysis.cognitiveStateAnalysis,
      hasAuxiliaryMetrics: !!detailedAnalysis.auxiliaryMetrics,
      hasBandPowerAnalysis: !!detailedAnalysis.bandPowerAnalysis,
      hasEegIndicesAnalysis: !!detailedAnalysis.eegIndicesAnalysis,
      eegTimeSeriesStats
    });
  }
  
  return (
    <div className="space-y-8">
      {/* 헤더 섹션 */}
      <EEGReportHeader metadata={metadata} />
      
      {/* 1. 종합 분석 요약 */}
      {comprehensiveAssessment && Object.keys(comprehensiveAssessment).length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            종합 분석 요약
          </h2>
          <ComprehensiveAssessment data={comprehensiveAssessment} />
        </div>
      )}

      {/* 연령 및 성별 기준 분석 */}
      {comprehensiveAssessment.ageGenderAnalysis && (
        <Card className="shadow-lg border-t-4 border-t-purple-500">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
            <CardTitle className="flex items-center gap-3 text-purple-800 text-lg font-semibold">
              <User className="w-6 h-6" />
              연령 및 성별 기준 분석
              <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-300">
                인구학적 분석
              </Badge>
            </CardTitle>
            <p className="text-sm text-purple-600 mt-1">
              연령대별 뇌파 패턴 분석 및 성별 특성 기반 개인화 평가
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {comprehensiveAssessment.ageGenderAnalysis.ageComparison && (
                <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-25 rounded-lg border-l-4 border-l-purple-400">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <h4 className="text-base font-semibold text-purple-800">연령대 비교 분석</h4>
                  </div>
                  <p className="text-sm text-purple-700 leading-relaxed mb-2">
                    {comprehensiveAssessment.ageGenderAnalysis.ageComparison}
                  </p>
                  <div className="text-xs text-purple-600 bg-white/50 p-2 rounded border">
                    💡 <strong>임상적 의의:</strong> 동일 연령대 평균 대비 개별적 특성을 고려한 맞춤형 관리가 필요합니다.
                  </div>
                </div>
              )}
              {comprehensiveAssessment.ageGenderAnalysis.genderConsiderations && (
                <div className="p-4 bg-gradient-to-r from-indigo-50 to-indigo-25 rounded-lg border-l-4 border-l-indigo-400">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-base font-semibold text-indigo-800">성별 특성 고려사항</h4>
                  </div>
                  <p className="text-sm text-indigo-700 leading-relaxed mb-2">
                    {comprehensiveAssessment.ageGenderAnalysis.genderConsiderations}
                  </p>
                  <div className="text-xs text-indigo-600 bg-white/50 p-2 rounded border">
                    🧬 <strong>생리학적 근거:</strong> 성별에 따른 신경생리학적 반응 차이를 반영한 개별화 접근이 중요합니다.
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 직업적 특성 분석 */}
      {comprehensiveAssessment.occupationalAnalysis && (
        <Card className="shadow-lg border-t-4 border-t-indigo-500">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
            <CardTitle className="flex items-center gap-3 text-indigo-800 text-lg font-semibold">
              <BrainCircuit className="w-6 h-6" />
              직업적 특성 분석
              <Badge variant="outline" className="text-xs bg-indigo-100 text-indigo-700 border-indigo-300">
                직업건강 평가
              </Badge>
            </CardTitle>
            <p className="text-sm text-indigo-600 mt-1">
              직업군별 신경생리학적 패턴 분석 및 업무 관련 스트레스 평가
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {comprehensiveAssessment.occupationalAnalysis.jobDemands && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-25 rounded-lg border-l-4 border-l-blue-400">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    <h4 className="text-base font-semibold text-blue-800">업무 요구사항 분석</h4>
                  </div>
                  <p className="text-sm text-blue-700 leading-relaxed mb-2">
                    {comprehensiveAssessment.occupationalAnalysis.jobDemands}
                  </p>
                  <div className="text-xs text-blue-600 bg-white/50 p-2 rounded border">
                    🎯 <strong>인지부하 평가:</strong> 고집중력 업무는 전두엽 활성도 증가와 베타/감마파 상승을 유발할 수 있습니다.
                  </div>
                </div>
              )}
              {comprehensiveAssessment.occupationalAnalysis.workRelatedPatterns && (
                <div className="p-4 bg-gradient-to-r from-teal-50 to-teal-25 rounded-lg border-l-4 border-l-teal-400">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-teal-600" />
                    <h4 className="text-base font-semibold text-teal-800">업무 관련 패턴 분석</h4>
                  </div>
                  <p className="text-sm text-teal-700 leading-relaxed mb-2">
                    {comprehensiveAssessment.occupationalAnalysis.workRelatedPatterns}
                  </p>
                  <div className="text-xs text-teal-600 bg-white/50 p-2 rounded border">
                    📈 <strong>누적효과 고려:</strong> 장기간 고강도 인지작업은 만성적 각성상태와 스트레스 호르몬 분비 증가로 이어질 수 있습니다.
                  </div>
                </div>
              )}
              
              {/* 추가 전문적 해석 */}
              <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-gray-600" />
                  <h4 className="text-base font-semibold text-gray-800">종합 해석</h4>
                </div>
                <div className="space-y-2 text-sm text-gray-700">
                  <p className="leading-relaxed">
                    직업적 특성에 따른 뇌파 패턴 변화는 <strong>업무 요구도와 인지부하</strong>의 직접적 반영입니다. 
                    특히 정보처리 집약적 업무는 전전두엽 피질의 지속적 활성화를 요구하며, 
                    이는 베타파(12-30Hz) 및 감마파(30-100Hz) 증가로 나타납니다.
                  </p>
                  <div className="flex items-start gap-2 mt-3 p-2 bg-yellow-50 rounded border-l-2 border-yellow-400">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-yellow-700">
                      <strong>주의사항:</strong> 지속적인 고인지부하 상태는 HPA축(시상하부-뇌하수체-부신축) 활성화를 통해 
                      코르티솔 분비를 증가시키며, 장기적으로 신경가소성 저하와 인지기능 감소를 초래할 수 있습니다.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 2. 4대 뇌파 건강 지표 */}
      {Object.keys(fourDimensionAnalysis).length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            4대 뇌파 건강 지표
          </h2>
          <FourDimensionDashboard data={fourDimensionAnalysis} />
        </div>
      )}
      
      {/* 3. 주파수 대역 분석 */}
      {detailedAnalysis.bandPowerAnalysis && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Activity className="w-6 h-6 text-purple-600" />
            주파수 대역 분석
          </h2>
          <BandPowerAnalysis data={detailedAnalysis.bandPowerAnalysis} inputData={{ ...inputData, eegTimeSeriesStats }} />
        </div>
      )}
      
      {/* 4. 뇌파 7대 지표 상세 분석 */}
      {detailedAnalysis.eegIndicesAnalysis && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Zap className="w-6 h-6 text-purple-600" />
            뇌파 7대 지표 상세 분석
          </h2>
          
          {/* 기존 히트맵 표시 */}
          <EEGIndicesHeatmap data={detailedAnalysis.eegIndicesAnalysis || detailedAnalysis.eegIndices} />
          
          {/* 7대 지표 상세 설명 */}
          <Card className="mt-6 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">7대 지표 상세 해석</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 1. Focus Index (집중력 지수) */}
              {detailedAnalysis.eegIndicesAnalysis.focusIndex && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                    <Focus className="w-4 h-4" />
                    집중력 지수 (Focus Index)
                  </h4>
                  <p className="text-sm text-blue-700 mb-2">
                    Beta파와 Theta파의 비율로 계산되며, 주의력과 집중력 수준을 나타냅니다.
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-blue-800">
                      {typeof detailedAnalysis.eegIndicesAnalysis.focusIndex === 'number' ? 
                        detailedAnalysis.eegIndicesAnalysis.focusIndex.toFixed(2) :
                        typeof detailedAnalysis.eegIndicesAnalysis.focusIndex === 'object' && detailedAnalysis.eegIndicesAnalysis.focusIndex.value !== undefined ?
                        detailedAnalysis.eegIndicesAnalysis.focusIndex.value.toFixed(2) :
                        'N/A'
                      }
                    </span>
                    <span className="text-sm text-blue-600">
                      정상 범위: 1.8 - 2.4
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    {typeof detailedAnalysis.eegIndicesAnalysis.focusIndex === 'object' && detailedAnalysis.eegIndicesAnalysis.focusIndex.interpretation ?
                      detailedAnalysis.eegIndicesAnalysis.focusIndex.interpretation :
                      'Focus Index (집중력 지수) 분석 결과'}
                  </p>
                </div>
              )}
              
              {/* 2. Arousal Index (각성도 지수) */}
              {detailedAnalysis.eegIndicesAnalysis.arousalIndex && (
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-medium text-orange-800 mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    각성도 지수 (Arousal Index)
                  </h4>
                  <p className="text-sm text-orange-700 mb-2">
                    Alpha파와 Beta파의 상대적 활성도로 측정되며, 정신적 각성 상태를 나타냅니다.
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-orange-800">
                      {typeof detailedAnalysis.eegIndicesAnalysis.arousalIndex === 'number' ? 
                        detailedAnalysis.eegIndicesAnalysis.arousalIndex.toFixed(2) :
                        typeof detailedAnalysis.eegIndicesAnalysis.arousalIndex === 'object' && detailedAnalysis.eegIndicesAnalysis.arousalIndex.value !== undefined ?
                        detailedAnalysis.eegIndicesAnalysis.arousalIndex.value.toFixed(2) :
                        'N/A'
                      }
                    </span>
                    <span className="text-sm text-orange-600">
                      정상 범위: 0.18 - 0.22
                    </span>
                  </div>
                  <p className="text-xs text-orange-600 mt-2">
                    {typeof detailedAnalysis.eegIndicesAnalysis.arousalIndex === 'object' && detailedAnalysis.eegIndicesAnalysis.arousalIndex.interpretation ?
                      detailedAnalysis.eegIndicesAnalysis.arousalIndex.interpretation :
                      'Arousal Index (각성도 지수) 분석 결과'}
                  </p>
                </div>
              )}
              
              {/* 3. Stress Index (스트레스 지수) */}
              {detailedAnalysis.eegIndicesAnalysis.stressIndex && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    스트레스 지수 (Stress Index)
                  </h4>
                  <p className="text-sm text-red-700 mb-2">
                    High Beta와 Alpha파의 비율로 계산되며, 정신적 스트레스와 긴장 수준을 나타냅니다.
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-red-800">
                      {typeof detailedAnalysis.eegIndicesAnalysis.stressIndex === 'number' ? 
                        detailedAnalysis.eegIndicesAnalysis.stressIndex.toFixed(2) :
                        typeof detailedAnalysis.eegIndicesAnalysis.stressIndex === 'object' && detailedAnalysis.eegIndicesAnalysis.stressIndex.value !== undefined ?
                        detailedAnalysis.eegIndicesAnalysis.stressIndex.value.toFixed(2) :
                        'N/A'
                      }
                    </span>
                    <span className="text-sm text-red-600">
                      정상 범위: 2.8 - 4.0
                    </span>
                  </div>
                  <p className="text-xs text-red-600 mt-2">
                    {typeof detailedAnalysis.eegIndicesAnalysis.stressIndex === 'object' && detailedAnalysis.eegIndicesAnalysis.stressIndex.interpretation ?
                      detailedAnalysis.eegIndicesAnalysis.stressIndex.interpretation :
                      'Stress Index (스트레스 지수) 분석 결과'}
                  </p>
                </div>
              )}
              
              {/* 4. Hemispheric Balance (반구 균형도) */}
              {detailedAnalysis.eegIndicesAnalysis.hemisphericBalance && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    반구 균형도 (Hemispheric Balance)
                  </h4>
                  <p className="text-sm text-purple-700 mb-2">
                    좌뇌와 우뇌의 활동 균형을 나타내는 지표로, 1.0에 가까울수록 균형잡힌 상태입니다.
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-purple-800">
                      {typeof detailedAnalysis.eegIndicesAnalysis.hemisphericBalance === 'number' ? 
                        detailedAnalysis.eegIndicesAnalysis.hemisphericBalance.toFixed(2) :
                        typeof detailedAnalysis.eegIndicesAnalysis.hemisphericBalance === 'object' && detailedAnalysis.eegIndicesAnalysis.hemisphericBalance.value !== undefined ?
                        detailedAnalysis.eegIndicesAnalysis.hemisphericBalance.value.toFixed(2) :
                        'N/A'
                      }
                    </span>
                    <span className="text-sm text-purple-600">
                      정상 범위: 0.8 - 1.2
                    </span>
                  </div>
                  <p className="text-xs text-purple-600 mt-2">
                    {typeof detailedAnalysis.eegIndicesAnalysis.hemisphericBalance === 'object' && detailedAnalysis.eegIndicesAnalysis.hemisphericBalance.interpretation ?
                      detailedAnalysis.eegIndicesAnalysis.hemisphericBalance.interpretation :
                      'Hemispheric Balance (반구 균형도) 분석 결과'}
                  </p>
                </div>
              )}
              
              {/* 5. Mental Fatigue Index (정신 피로도 지수) */}
              {detailedAnalysis.eegIndicesAnalysis.mentalFatigueIndex && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                    <Timer className="w-4 h-4" />
                    정신 피로도 지수 (Mental Fatigue Index)
                  </h4>
                  <p className="text-sm text-yellow-700 mb-2">
                    Theta파 증가와 Alpha파 감소로 측정되며, 정신적 피로 누적 정도를 나타냅니다.
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-yellow-800">
                      {typeof detailedAnalysis.eegIndicesAnalysis.mentalFatigueIndex === 'number' ? 
                        detailedAnalysis.eegIndicesAnalysis.mentalFatigueIndex.toFixed(2) :
                        typeof detailedAnalysis.eegIndicesAnalysis.mentalFatigueIndex === 'object' && detailedAnalysis.eegIndicesAnalysis.mentalFatigueIndex.value !== undefined ?
                        detailedAnalysis.eegIndicesAnalysis.mentalFatigueIndex.value.toFixed(2) :
                        'N/A'
                      }
                    </span>
                    <span className="text-sm text-yellow-600">
                      정상 범위: 0.4 - 0.6
                    </span>
                  </div>
                  <p className="text-xs text-yellow-600 mt-2">
                    {typeof detailedAnalysis.eegIndicesAnalysis.mentalFatigueIndex === 'object' && detailedAnalysis.eegIndicesAnalysis.mentalFatigueIndex.interpretation ?
                      detailedAnalysis.eegIndicesAnalysis.mentalFatigueIndex.interpretation :
                      'Mental Fatigue Index (정신 피로도 지수) 분석 결과'}
                  </p>
                </div>
              )}
              
              {/* 6. Cognitive Load Index (인지 부하 지수) */}
              {detailedAnalysis.eegIndicesAnalysis.cognitiveLoadIndex && (
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h4 className="font-medium text-indigo-800 mb-2 flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4" />
                    인지 부하 지수 (Cognitive Load Index)
                  </h4>
                  <p className="text-sm text-indigo-700 mb-2">
                    Theta와 Gamma파의 활성도로 측정되며, 현재 처리 중인 정보의 복잡도를 나타냅니다.
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-indigo-800">
                      {typeof detailedAnalysis.eegIndicesAnalysis.cognitiveLoadIndex === 'number' ? 
                        detailedAnalysis.eegIndicesAnalysis.cognitiveLoadIndex.toFixed(2) :
                        typeof detailedAnalysis.eegIndicesAnalysis.cognitiveLoadIndex === 'object' && detailedAnalysis.eegIndicesAnalysis.cognitiveLoadIndex.value !== undefined ?
                        detailedAnalysis.eegIndicesAnalysis.cognitiveLoadIndex.value.toFixed(2) :
                        'N/A'
                      }
                    </span>
                    <span className="text-sm text-indigo-600">
                      정상 범위: 0.3 - 0.5
                    </span>
                  </div>
                  <p className="text-xs text-indigo-600 mt-2">
                    {typeof detailedAnalysis.eegIndicesAnalysis.cognitiveLoadIndex === 'object' && detailedAnalysis.eegIndicesAnalysis.cognitiveLoadIndex.interpretation ?
                      detailedAnalysis.eegIndicesAnalysis.cognitiveLoadIndex.interpretation :
                      'Cognitive Load Index (인지 부하 지수) 분석 결과'}
                  </p>
                </div>
              )}
              
              {/* 7. Emotional Balance Index (정서 균형 지수) */}
              {detailedAnalysis.eegIndicesAnalysis.emotionalBalanceIndex && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    정서 균형 지수 (Emotional Balance Index)
                  </h4>
                  <p className="text-sm text-green-700 mb-2">
                    전두엽 Alpha 비대칭성으로 측정되며, 정서적 안정성과 균형 상태를 나타냅니다.
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-green-800">
                      {typeof detailedAnalysis.eegIndicesAnalysis.emotionalBalanceIndex === 'number' ? 
                        detailedAnalysis.eegIndicesAnalysis.emotionalBalanceIndex.toFixed(2) :
                        typeof detailedAnalysis.eegIndicesAnalysis.emotionalBalanceIndex === 'object' && detailedAnalysis.eegIndicesAnalysis.emotionalBalanceIndex.value !== undefined ?
                        detailedAnalysis.eegIndicesAnalysis.emotionalBalanceIndex.value.toFixed(2) :
                        'N/A'
                      }
                    </span>
                    <span className="text-sm text-green-600">
                      정상 범위: 0.8 - 1.2
                    </span>
                  </div>
                  <p className="text-xs text-green-600 mt-2">
                    {typeof detailedAnalysis.eegIndicesAnalysis.emotionalBalanceIndex === 'object' && detailedAnalysis.eegIndicesAnalysis.emotionalBalanceIndex.interpretation ?
                      detailedAnalysis.eegIndicesAnalysis.emotionalBalanceIndex.interpretation :
                      'Emotional Balance Index (정서 균형 지수) 분석 결과'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* 5. 인지 상태 분석 */}
      {detailedAnalysis.cognitiveStateAnalysis && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-purple-600" />
            인지 상태 분석
          </h2>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <BrainCircuit className="w-5 h-5 text-purple-600" />
                인지 상태 종합 분석
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {detailedAnalysis.cognitiveStateAnalysis.overallAssessment && (
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                      <BrainCircuit className="w-4 h-4" />
                      전반적 평가
                    </h4>
                    <p className="text-purple-700 leading-relaxed">
                      {detailedAnalysis.cognitiveStateAnalysis.overallAssessment}
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {detailedAnalysis.cognitiveStateAnalysis.attentionPatterns && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                        <Focus className="w-4 h-4" />
                        주의력 패턴
                      </h4>
                      <p className="text-sm text-blue-700 leading-relaxed">
                        {detailedAnalysis.cognitiveStateAnalysis.attentionPatterns}
                      </p>
                    </div>
                  )}
                  
                  {detailedAnalysis.cognitiveStateAnalysis.mentalFatigue && (
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <h4 className="font-medium text-orange-800 mb-2 flex items-center gap-2">
                        <Timer className="w-4 h-4" />
                        정신적 피로도
                      </h4>
                      <p className="text-sm text-orange-700 leading-relaxed">
                        {detailedAnalysis.cognitiveStateAnalysis.mentalFatigue}
                      </p>
                    </div>
                  )}
                  
                  {detailedAnalysis.cognitiveStateAnalysis.arousalLevel && (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        각성 수준
                      </h4>
                      <p className="text-sm text-yellow-700 leading-relaxed">
                        {detailedAnalysis.cognitiveStateAnalysis.arousalLevel}
                      </p>
                    </div>
                  )}
                  
                  {detailedAnalysis.cognitiveStateAnalysis.emotionalState && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                        <Heart className="w-4 h-4" />
                        정서적 상태
                      </h4>
                      <p className="text-sm text-green-700 leading-relaxed">
                        {detailedAnalysis.cognitiveStateAnalysis.emotionalState}
                      </p>
                    </div>
                  )}
                </div>
                
                {detailedAnalysis.cognitiveStateAnalysis.neurologicalIndicators && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      신경학적 지표
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {detailedAnalysis.cognitiveStateAnalysis.neurologicalIndicators}
                    </p>
                  </div>
                )}

                {detailedAnalysis.cognitiveStateAnalysis.stressPatterns && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      스트레스 패턴
                    </h4>
                    <p className="text-sm text-red-700 leading-relaxed">
                      {detailedAnalysis.cognitiveStateAnalysis.stressPatterns}
                    </p>
                  </div>
                )}

                {detailedAnalysis.cognitiveStateAnalysis.cognitiveFlexibility && (
                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <h4 className="font-medium text-indigo-800 mb-2 flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      인지적 유연성
                    </h4>
                    <p className="text-sm text-indigo-700 leading-relaxed">
                      {detailedAnalysis.cognitiveStateAnalysis.cognitiveFlexibility}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* 6. 보조 지표 분석 */}
      {detailedAnalysis.auxiliaryMetrics && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            보조 지표 분석
          </h2>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                추가 뇌파 지표
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(detailedAnalysis.auxiliaryMetrics).map(([key, metric]: [string, any]) => {
                  // 상태에 따른 배경색 결정
                  const getBackgroundColor = (status: string) => {
                    switch (status) {
                      case '높음':
                        return 'bg-gradient-to-br from-red-50 to-red-100';
                      case '낮음':
                        return 'bg-gradient-to-br from-yellow-50 to-yellow-100';
                      case '정상':
                      default:
                        return 'bg-gradient-to-br from-gray-50 to-blue-50';
                    }
                  };

                  return (
                    <div key={key} className={`${getBackgroundColor(metric.status)} p-6 rounded-lg border border-gray-200`}>
                    {/* 지표명 */}
                    <div className="text-center mb-4">
                      <h4 className="text-lg font-bold text-gray-900">
                        {metric.indicator || metric.name || key}
                      </h4>
                    </div>
                    
                    {/* 측정값 */}
                    <div className="text-center mb-4">
                      <div className="text-2xl font-bold text-blue-600">
                        {typeof metric.value === 'number' ? 
                          (key === 'hemisphericBalance' ? metric.value.toFixed(3) : metric.value.toFixed(2)) 
                          : metric.value || 'N/A'}
                      </div>
                    </div>
                    
                    {/* 정상범위 및 상태 */}
                    <div className="space-y-2 mb-4">
                      {metric.normalRange && (
                        <div className="text-sm text-gray-600 text-center">
                          <span className="font-medium">정상범위:</span> {metric.normalRange}
                        </div>
                      )}
                      
                      {metric.status && (
                        <div className="text-center">
                          <Badge 
                            variant="outline" 
                            className={cn("text-sm font-medium", 
                              metric.status === '정상' ? 'text-green-600 border-green-300' :
                              metric.status === '높음' ? 'text-red-600 border-red-300' :
                              metric.status === '낮음' ? 'text-orange-600 border-orange-300' :
                              'text-gray-600 border-gray-300'
                            )}
                          >
                            {metric.status}
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    {/* 측정 범위 (최소-최대) */}
                    {(metric.min !== undefined && metric.max !== undefined && metric.min !== 'N/A' && metric.max !== 'N/A') && (
                      <div className="text-sm text-gray-500 text-center mb-3">
                        <span className="font-medium">측정범위:</span> {metric.min} - {metric.max}
                      </div>
                    )}
                    
                    {/* 해석 */}
                    {metric.interpretation && (
                      <div className="bg-white p-3 rounded border-l-4 border-blue-400">
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {metric.interpretation}
                        </p>
                      </div>
                    )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 7. 개선 방향 */}
      {comprehensiveAssessment.improvementPlan && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Target className="w-6 h-6 text-purple-600" />
            개선 방향
          </h2>
          <ImprovementPlan data={comprehensiveAssessment.improvementPlan} />
        </div>
      )}
          
      {/* 추가 분석 섹션들 */}
      
      {/* 임상 권장사항 */}
      {comprehensiveAssessment.clinicalRecommendation && (
        <Card className="shadow-lg border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-700">
              <Info className="w-5 h-5" />
              임상 권장사항
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 leading-relaxed">
              {comprehensiveAssessment.clinicalRecommendation}
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* 메타데이터 */}
      <div className="text-xs text-gray-500 text-center pt-4 border-t">
        분석 일시: {new Date(metadata.analysisTimestamp).toLocaleString('ko-KR')} | 
        처리 시간: {(metadata.analysisEngine?.processingTime / 1000 || 0).toFixed(1)}초 | 
        엔진 버전: v{metadata.analysisEngine?.version || '1.0.0'}
      </div>
    </div>
  );
};

/**
 * 렌더러 클래스
 */
export class EEGAdvancedReactRenderer {
  id = 'eeg-advanced-react-renderer';
  name = 'EEG 전문 분석 React 렌더러';
  description = 'EEG 전문 분석 결과를 의료용 React 컴포넌트로 렌더링';
  version = '2.0.0';
  supportedEngines = ['eeg-advanced-gemini-v1'];
  outputFormat = 'react';
  costPerRender = 0;
  
  async render(analysis: any, options?: any) {
    return {
      component: EEGAdvancedReportComponent,
      props: { report: analysis },
      format: 'react'
    };
  }
}