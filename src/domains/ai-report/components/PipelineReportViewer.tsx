/**
 * 파이프라인 통합 분석 리포트 뷰어
 * 3단계 분석 결과 (EEG, PPG, 통합)를 종합적으로 표시
 */

import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/tabs';
import { Badge } from '@ui/badge';
import { Progress } from '@ui/progress';
import { Button } from '@ui/button';
import { 
  Brain, 
  Heart, 
  Sparkles, 
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  AlertCircle,
  CheckCircle,
  Info,
  Calendar,
  Clock,
  User,
  Download,
  Share2,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PipelineReportViewerProps {
  report: any; // PipelineReport 타입
  onClose?: () => void;
}

export const PipelineReportViewer: React.FC<PipelineReportViewerProps> = ({ 
  report, 
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    eeg: true,
    ppg: true,
    integrated: true
  });

  // 섹션 토글
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 건강 점수에 따른 색상 결정
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // 건강 점수에 따른 배경색 결정
  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50';
    if (score >= 60) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  // 파이프라인 메타데이터
  const metadata = report.metadata || {};
  const integratedResult = report.integratedAnalysisResult || {};
  const eegResult = report.eegAnalysisResult || {};
  const ppgResult = report.ppgAnalysisResult || {};

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">통합 건강 분석 리포트</h1>
              <p className="text-white/80">AI 기반 종합 건강 상태 분석</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="secondary" 
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-0"
            >
              <Share2 className="w-4 h-4 mr-1" />
              공유
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-0"
            >
              <Download className="w-4 h-4 mr-1" />
              다운로드
            </Button>
          </div>
        </div>

        {/* 메타 정보 */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
              <User className="w-4 h-4" />
              분석 대상
            </div>
            <p className="font-semibold">{report.personalInfo?.name || '익명'}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
              <Calendar className="w-4 h-4" />
              분석 일시
            </div>
            <p className="font-semibold">
              {new Date(metadata.timestamp || Date.now()).toLocaleDateString('ko-KR')}
            </p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
              <Clock className="w-4 h-4" />
              소요 시간
            </div>
            <p className="font-semibold">{Math.round((metadata.totalDuration || 0) / 1000)}초</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
              <Zap className="w-4 h-4" />
              분석 단계
            </div>
            <p className="font-semibold">{metadata.apiCalls || 3}단계 완료</p>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">종합 요약</TabsTrigger>
          <TabsTrigger value="details">상세 분석</TabsTrigger>
          <TabsTrigger value="recommendations">개선 방안</TabsTrigger>
          <TabsTrigger value="timeline">분석 이력</TabsTrigger>
        </TabsList>

        {/* 종합 요약 탭 */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* 전체 건강 점수 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                종합 건강 점수
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className={cn(
                  "text-6xl font-bold mb-2",
                  getScoreColor(integratedResult.overallSummary?.healthScore || 0)
                )}>
                  {integratedResult.overallSummary?.healthScore || 0}점
                </div>
                <Progress 
                  value={integratedResult.overallSummary?.healthScore || 0} 
                  className="h-3 mb-4"
                />
                <p className="text-gray-600">
                  {integratedResult.overallSummary?.healthScore >= 80 
                    ? '전반적으로 건강한 상태입니다.' 
                    : integratedResult.overallSummary?.healthScore >= 60
                    ? '주의가 필요한 부분이 있습니다.'
                    : '건강 관리가 필요합니다.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 주요 발견사항 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                주요 발견사항
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {integratedResult.overallSummary?.mainFindings?.map((finding: string, index: number) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">{finding}</p>
                  </div>
                ))}
              </div>

              {integratedResult.overallSummary?.urgentIssues?.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    주의 필요 사항
                  </h4>
                  <div className="space-y-2">
                    {integratedResult.overallSummary.urgentIssues.map((issue: string, index: number) => (
                      <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-800">{issue}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3단계 분석 요약 */}
          <div className="grid grid-cols-3 gap-4">
            {/* EEG 분석 요약 */}
            <Card className="border-purple-200">
              <CardHeader className="bg-purple-50">
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <Brain className="w-5 h-5" />
                  뇌파 분석
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">스트레스 지수</p>
                    <Progress 
                      value={integratedResult.eegReport?.summary?.stressLevel || 0} 
                      className="h-2 mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {integratedResult.eegReport?.summary?.stressLevel || 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">집중력 지수</p>
                    <Progress 
                      value={integratedResult.eegReport?.summary?.focusLevel || 0} 
                      className="h-2 mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {integratedResult.eegReport?.summary?.focusLevel || 0}%
                    </p>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium text-purple-700">
                      {integratedResult.eegReport?.summary?.overallStatus || '분석 중'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PPG 분석 요약 */}
            <Card className="border-red-200">
              <CardHeader className="bg-red-50">
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <Heart className="w-5 h-5" />
                  심박 분석
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">심박수</p>
                    <p className="text-2xl font-bold text-red-600">
                      {integratedResult.ppgReport?.summary?.avgHeartRate || 0} BPM
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">심박 변이도</p>
                    <p className="text-lg font-semibold text-gray-700">
                      {integratedResult.ppgReport?.summary?.hrvScore || 0} ms
                    </p>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium text-red-700">
                      {integratedResult.ppgReport?.summary?.overallStatus || '분석 중'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 통합 분석 요약 */}
            <Card className="border-blue-200">
              <CardHeader className="bg-blue-50">
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Sparkles className="w-5 h-5" />
                  통합 분석
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">신체-정신 균형</p>
                    <Progress 
                      value={integratedResult.overallSummary?.balanceScore || 75} 
                      className="h-2 mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {integratedResult.overallSummary?.balanceScore || 75}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">회복력 지수</p>
                    <Progress 
                      value={integratedResult.overallSummary?.resilienceScore || 70} 
                      className="h-2 mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {integratedResult.overallSummary?.resilienceScore || 70}%
                    </p>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium text-blue-700">
                      종합 건강 상태 양호
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 상세 분석 탭 */}
        <TabsContent value="details" className="space-y-6 mt-6">
          {/* EEG 상세 분석 */}
          <Card>
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleSection('eeg')}
            >
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  뇌파(EEG) 상세 분석
                </div>
                <ChevronRight 
                  className={cn(
                    "w-5 h-5 transition-transform",
                    expandedSections.eeg && "rotate-90"
                  )}
                />
              </CardTitle>
            </CardHeader>
            {expandedSections.eeg && (
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  {/* 주파수 대역별 분석 */}
                  <div>
                    <h4 className="font-semibold mb-3">주파수 대역별 활성도</h4>
                    <div className="space-y-2">
                      {Object.entries(integratedResult.eegReport?.bandPowers || {}).map(([band, value]) => (
                        <div key={band}>
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">{band}</span>
                            <span>{value}%</span>
                          </div>
                          <Progress value={value as number} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 인지 지표 */}
                  <div>
                    <h4 className="font-semibold mb-3">인지 능력 지표</h4>
                    <div className="space-y-3">
                      {integratedResult.eegReport?.cognitiveIndicators?.map((indicator: any, index: number) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{indicator.name}</span>
                            <Badge variant={indicator.status === 'normal' ? 'default' : 'destructive'}>
                              {indicator.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{indicator.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* PPG 상세 분석 */}
          <Card>
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleSection('ppg')}
            >
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-600" />
                  심박(PPG) 상세 분석
                </div>
                <ChevronRight 
                  className={cn(
                    "w-5 h-5 transition-transform",
                    expandedSections.ppg && "rotate-90"
                  )}
                />
              </CardTitle>
            </CardHeader>
            {expandedSections.ppg && (
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  {/* 심박 지표 */}
                  <div>
                    <h4 className="font-semibold mb-3">심박 변이도 지표</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm">RMSSD</span>
                        <span className="font-semibold">{integratedResult.ppgReport?.metrics?.rmssd || 0} ms</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm">SDNN</span>
                        <span className="font-semibold">{integratedResult.ppgReport?.metrics?.sdnn || 0} ms</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm">LF/HF 비율</span>
                        <span className="font-semibold">{integratedResult.ppgReport?.metrics?.lfHfRatio || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* 자율신경계 균형 */}
                  <div>
                    <h4 className="font-semibold mb-3">자율신경계 균형</h4>
                    <div className="bg-gradient-to-r from-blue-50 to-red-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-blue-700">부교감신경</span>
                        <span className="text-sm text-red-700">교감신경</span>
                      </div>
                      <Progress 
                        value={integratedResult.ppgReport?.autonomicBalance || 50} 
                        className="h-3"
                      />
                      <p className="text-center text-sm text-gray-600 mt-2">
                        {integratedResult.ppgReport?.autonomicBalance > 60 
                          ? '부교감신경 우세' 
                          : integratedResult.ppgReport?.autonomicBalance < 40
                          ? '교감신경 우세'
                          : '균형 상태'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* 개선 방안 탭 */}
        <TabsContent value="recommendations" className="space-y-6 mt-6">
          {/* 즉시 실천 사항 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                즉시 실천 가능한 개선 방안
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {integratedResult.improvementPlan?.immediate?.map((item: any, index: number) => (
                  <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">{item.title}</h4>
                    <p className="text-sm text-green-700">{item.description}</p>
                    {item.expectedBenefit && (
                      <p className="text-xs text-green-600 mt-2">
                        예상 효과: {item.expectedBenefit}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 단기 목표 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                단기 목표 (1-4주)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {integratedResult.improvementPlan?.shortTerm?.map((item: any, index: number) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-gray-800">{item.goal}</h4>
                    <p className="text-sm text-gray-600 mt-1">{item.method}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-gray-500">주 {item.frequency}회</span>
                      <span className="text-xs text-gray-500">{item.duration}분</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 장기 목표 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                장기 목표 (1-3개월)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {integratedResult.improvementPlan?.longTerm?.map((item: any, index: number) => (
                  <div key={index} className="bg-purple-50 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-800">{item.objective}</h4>
                    <p className="text-sm text-purple-700 mt-2">{item.approach}</p>
                    {item.milestones && (
                      <div className="mt-3 space-y-1">
                        {item.milestones.map((milestone: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-purple-600">
                            <CheckCircle className="w-3 h-3" />
                            {milestone}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 분석 이력 탭 */}
        <TabsContent value="timeline" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-600" />
                분석 파이프라인 실행 이력
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* EEG 분석 단계 */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">EEG 분석 완료</h4>
                    <p className="text-sm text-gray-600">
                      뇌파 데이터 분석 및 인지 지표 계산
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                      <span>엔진: {eegResult.engineId || 'EEG Advanced Gemini'}</span>
                      <span>처리 시간: {eegResult.processingTime || '2.3'}초</span>
                    </div>
                  </div>
                </div>

                {/* 연결선 */}
                <div className="ml-5 border-l-2 border-gray-200 h-6"></div>

                {/* PPG 분석 단계 */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Heart className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">PPG 분석 완료</h4>
                    <p className="text-sm text-gray-600">
                      심박 데이터 분석 및 자율신경계 평가
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                      <span>엔진: {ppgResult.engineId || 'PPG Advanced Gemini'}</span>
                      <span>처리 시간: {ppgResult.processingTime || '1.8'}초</span>
                    </div>
                  </div>
                </div>

                {/* 연결선 */}
                <div className="ml-5 border-l-2 border-gray-200 h-6"></div>

                {/* 통합 분석 단계 */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">통합 분석 완료</h4>
                    <p className="text-sm text-gray-600">
                      종합 건강 상태 평가 및 개선 방안 도출
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                      <span>엔진: Integrated Advanced Gemini</span>
                      <span>처리 시간: {metadata.totalDuration ? (metadata.totalDuration / 1000).toFixed(1) : '5.2'}초</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 전체 실행 정보 */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-gray-600">총 API 호출</p>
                    <p className="font-semibold text-lg">{metadata.apiCalls || 3}회</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">전체 소요 시간</p>
                    <p className="font-semibold text-lg">
                      {metadata.totalDuration ? (metadata.totalDuration / 1000).toFixed(1) : '9.3'}초
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">파이프라인 상태</p>
                    <Badge variant="default" className="mt-1">
                      {metadata.status === 'completed' ? '완료' : metadata.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};