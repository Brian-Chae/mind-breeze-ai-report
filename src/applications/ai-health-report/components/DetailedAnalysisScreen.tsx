import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ReferenceLine
} from 'recharts';
import { 
  Brain, 
  Heart, 
  Activity, 
  TrendingUp, 
  AlertCircle, 
  Info, 
  Target, 
  Waves, 
  BarChart3,
  ArrowLeft,
  Download,
  Share2,
  Zap,
  Gauge,
  CheckCircle,
  AlertTriangle,
  Star,
  Award,
  FileText,
  Clock
} from 'lucide-react';
import { AIAnalysisResult, MeasurementData } from '../types';
import { AIAnalysisMarkdownRenderer } from './AIAnalysisMarkdownRenderer';

interface DetailedAnalysisScreenProps {
  analysisResult: AIAnalysisResult;
  measurementData: MeasurementData;
  onBack: () => void;
}

// EEG 지표 정상 범위 정의 (실제 측정 데이터 기반)
const EEG_NORMAL_RANGES = {
  focusIndex: { min: 1.8, max: 2.4, unit: '', description: '집중력 지수' },
  relaxationIndex: { min: 0.18, max: 0.22, unit: '', description: '이완도 지수' },
  stressIndex: { min: 2.0, max: 4.0, unit: '', description: '스트레스 지수' },
  hemisphericBalance: { min: -0.1, max: 0.1, unit: '', description: '좌우뇌 균형' },
  cognitiveLoad: { min: 0.3, max: 0.8, unit: '', description: '인지 부하' },
  emotionalStability: { min: 0.4, max: 0.8, unit: '', description: '정서 안정성' },
  totalPower: { min: 850, max: 1150, unit: 'µV²', description: '총 뇌파 파워' }
};

// PPG 지표 정상 범위 정의 (실제 측정 데이터 기반)
const PPG_NORMAL_RANGES = {
  heartRate: { min: 60, max: 100, unit: 'bpm', description: '심박수' },
  rmssd: { min: 20, max: 50, unit: 'ms', description: '심박변이도 (RMSSD)' },
  sdnn: { min: 30, max: 100, unit: 'ms', description: '심박변이도 (SDNN)' },
  pnn50: { min: 5, max: 25, unit: '%', description: 'PNN50' },
  pnn20: { min: 20, max: 40, unit: '%', description: 'PNN20' },
  lfPower: { min: 2, max: 12, unit: 'ms²', description: 'LF Power' },
  hfPower: { min: 0.8, max: 40, unit: 'ms²', description: 'HF Power' },
  lfHfRatio: { min: 1.0, max: 10.0, unit: '', description: 'LF/HF 비율' },
  spo2: { min: 95, max: 100, unit: '%', description: '산소포화도' },
  avnn: { min: 700, max: 1000, unit: 'ms', description: 'AVNN' },
  sdsd: { min: 15, max: 35, unit: 'ms', description: 'SDSD' },
  hrMax: { min: 80, max: 150, unit: 'bpm', description: '최대 심박수' },
  hrMin: { min: 50, max: 70, unit: 'bpm', description: '최소 심박수' }
};

const DetailedAnalysisScreen: React.FC<DetailedAnalysisScreenProps> = ({ 
  analysisResult, 
  measurementData, 
  onBack 
}) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'eeg' | 'ppg'>('overview');

  // 메트릭 상태 판단 함수
  function getMetricStatus(value: number, range: { min: number; max: number }) {
    if (value < range.min) return 'low';
    if (value > range.max) return 'high';
    return 'normal';
  }

  // 전체 건강 점수 계산
  const overallHealthScore = useMemo(() => {
    return analysisResult.overallHealth?.score || 0;
  }, [analysisResult]);

  // EEG 점수 계산
  const eegScore = useMemo(() => {
    return analysisResult.detailedAnalysis?.mentalHealth?.score || 0;
  }, [analysisResult]);

  // PPG 점수 계산
  const ppgScore = useMemo(() => {
    return analysisResult.detailedAnalysis?.physicalHealth?.score || 0;
  }, [analysisResult]);

  // EEG 메트릭 데이터 준비
  const eegMetrics = useMemo(() => {
    if (!measurementData.eegMetrics) return [];
    
    const metrics = measurementData.eegMetrics;
    return [
      {
        name: '집중력 지수',
        value: metrics.focusIndex?.value || 0,
        normalRange: EEG_NORMAL_RANGES.focusIndex,
        status: getMetricStatus(metrics.focusIndex?.value || 0, EEG_NORMAL_RANGES.focusIndex),
        interpretation: metrics.focusIndex?.interpretation || '',
        clinicalMeaning: metrics.focusIndex?.clinicalMeaning || {}
      },
      {
        name: '이완도 지수',
        value: metrics.relaxationIndex?.value || 0,
        normalRange: EEG_NORMAL_RANGES.relaxationIndex,
        status: getMetricStatus(metrics.relaxationIndex?.value || 0, EEG_NORMAL_RANGES.relaxationIndex),
        interpretation: metrics.relaxationIndex?.interpretation || '',
        clinicalMeaning: metrics.relaxationIndex?.clinicalMeaning || {}
      },
      {
        name: '스트레스 지수',
        value: metrics.stressIndex?.value || 0,
        normalRange: EEG_NORMAL_RANGES.stressIndex,
        status: getMetricStatus(metrics.stressIndex?.value || 0, EEG_NORMAL_RANGES.stressIndex),
        interpretation: metrics.stressIndex?.interpretation || '',
        clinicalMeaning: metrics.stressIndex?.clinicalMeaning || {}
      },
      {
        name: '좌우뇌 균형',
        value: metrics.hemisphericBalance?.value || 0,
        normalRange: EEG_NORMAL_RANGES.hemisphericBalance,
        status: getMetricStatus(metrics.hemisphericBalance?.value || 0, EEG_NORMAL_RANGES.hemisphericBalance),
        interpretation: metrics.hemisphericBalance?.interpretation || '',
        clinicalMeaning: metrics.hemisphericBalance?.clinicalMeaning || {}
      },
      {
        name: '인지 부하',
        value: metrics.cognitiveLoad?.value || 0,
        normalRange: EEG_NORMAL_RANGES.cognitiveLoad,
        status: getMetricStatus(metrics.cognitiveLoad?.value || 0, EEG_NORMAL_RANGES.cognitiveLoad),
        interpretation: metrics.cognitiveLoad?.interpretation || '',
        clinicalMeaning: metrics.cognitiveLoad?.clinicalMeaning || {}
      },
      {
        name: '정서 안정성',
        value: metrics.emotionalStability?.value || 0,
        normalRange: EEG_NORMAL_RANGES.emotionalStability,
        status: getMetricStatus(metrics.emotionalStability?.value || 0, EEG_NORMAL_RANGES.emotionalStability),
        interpretation: metrics.emotionalStability?.interpretation || '',
        clinicalMeaning: metrics.emotionalStability?.clinicalMeaning || {}
      },
      {
        name: '총 뇌파 파워',
        value: metrics.totalPower?.value || 0,
        normalRange: EEG_NORMAL_RANGES.totalPower,
        status: getMetricStatus(metrics.totalPower?.value || 0, EEG_NORMAL_RANGES.totalPower),
        interpretation: metrics.totalPower?.interpretation || '',
        clinicalMeaning: metrics.totalPower?.clinicalMeaning || {}
      }
    ];
  }, [measurementData.eegMetrics]);

  // PPG 메트릭 데이터 준비
  const ppgMetrics = useMemo(() => {
    if (!measurementData.ppgMetrics) return [];
    
    const metrics = measurementData.ppgMetrics;
    return [
      {
        name: '심박수',
        value: metrics.heartRate?.value || 0,
        normalRange: PPG_NORMAL_RANGES.heartRate,
        status: getMetricStatus(metrics.heartRate?.value || 0, PPG_NORMAL_RANGES.heartRate),
        interpretation: metrics.heartRate?.interpretation || '',
        clinicalMeaning: metrics.heartRate?.clinicalMeaning || {}
      },
      {
        name: 'RMSSD',
        value: metrics.rmssd?.value || 0,
        normalRange: PPG_NORMAL_RANGES.rmssd,
        status: getMetricStatus(metrics.rmssd?.value || 0, PPG_NORMAL_RANGES.rmssd),
        interpretation: metrics.rmssd?.interpretation || '',
        clinicalMeaning: metrics.rmssd?.clinicalMeaning || {}
      },
      {
        name: 'SDNN',
        value: metrics.sdnn?.value || 0,
        normalRange: PPG_NORMAL_RANGES.sdnn,
        status: getMetricStatus(metrics.sdnn?.value || 0, PPG_NORMAL_RANGES.sdnn),
        interpretation: metrics.sdnn?.interpretation || '',
        clinicalMeaning: metrics.sdnn?.clinicalMeaning || {}
      },
      {
        name: 'PNN50',
        value: metrics.pnn50?.value || 0,
        normalRange: PPG_NORMAL_RANGES.pnn50,
        status: getMetricStatus(metrics.pnn50?.value || 0, PPG_NORMAL_RANGES.pnn50),
        interpretation: metrics.pnn50?.interpretation || '',
        clinicalMeaning: metrics.pnn50?.clinicalMeaning || {}
      },
      {
        name: 'PNN20',
        value: (metrics as any).pnn20?.value || 0,
        normalRange: PPG_NORMAL_RANGES.pnn20,
        status: getMetricStatus((metrics as any).pnn20?.value || 0, PPG_NORMAL_RANGES.pnn20),
        interpretation: (metrics as any).pnn20?.interpretation || '',
        clinicalMeaning: (metrics as any).pnn20?.clinicalMeaning || {}
      },
      {
        name: 'LF Power',
        value: metrics.lfPower?.value || 0,
        normalRange: PPG_NORMAL_RANGES.lfPower,
        status: getMetricStatus(metrics.lfPower?.value || 0, PPG_NORMAL_RANGES.lfPower),
        interpretation: metrics.lfPower?.interpretation || '',
        clinicalMeaning: metrics.lfPower?.clinicalMeaning || {}
      },
      {
        name: 'HF Power',
        value: metrics.hfPower?.value || 0,
        normalRange: PPG_NORMAL_RANGES.hfPower,
        status: getMetricStatus(metrics.hfPower?.value || 0, PPG_NORMAL_RANGES.hfPower),
        interpretation: metrics.hfPower?.interpretation || '',
        clinicalMeaning: metrics.hfPower?.clinicalMeaning || {}
      },
      {
        name: 'LF/HF 비율',
        value: metrics.lfHfRatio?.value || 0,
        normalRange: PPG_NORMAL_RANGES.lfHfRatio,
        status: getMetricStatus(metrics.lfHfRatio?.value || 0, PPG_NORMAL_RANGES.lfHfRatio),
        interpretation: metrics.lfHfRatio?.interpretation || '',
        clinicalMeaning: metrics.lfHfRatio?.clinicalMeaning || {}
      },
      {
        name: '산소포화도',
        value: metrics.spo2?.value || 0,
        normalRange: PPG_NORMAL_RANGES.spo2,
        status: getMetricStatus(metrics.spo2?.value || 0, PPG_NORMAL_RANGES.spo2),
        interpretation: metrics.spo2?.interpretation || '',
        clinicalMeaning: metrics.spo2?.clinicalMeaning || {}
      },
      {
        name: 'AVNN',
        value: (metrics as any).avnn?.value || 0,
        normalRange: PPG_NORMAL_RANGES.avnn,
        status: getMetricStatus((metrics as any).avnn?.value || 0, PPG_NORMAL_RANGES.avnn),
        interpretation: (metrics as any).avnn?.interpretation || '',
        clinicalMeaning: (metrics as any).avnn?.clinicalMeaning || {}
      },
      {
        name: 'SDSD',
        value: (metrics as any).sdsd?.value || 0,
        normalRange: PPG_NORMAL_RANGES.sdsd,
        status: getMetricStatus((metrics as any).sdsd?.value || 0, PPG_NORMAL_RANGES.sdsd),
        interpretation: (metrics as any).sdsd?.interpretation || '',
        clinicalMeaning: (metrics as any).sdsd?.clinicalMeaning || {}
      },
      {
        name: '최대 심박수',
        value: (metrics as any).hrMax?.value || 0,
        normalRange: PPG_NORMAL_RANGES.hrMax,
        status: getMetricStatus((metrics as any).hrMax?.value || 0, PPG_NORMAL_RANGES.hrMax),
        interpretation: (metrics as any).hrMax?.interpretation || '',
        clinicalMeaning: (metrics as any).hrMax?.clinicalMeaning || {}
      },
      {
        name: '최소 심박수',
        value: (metrics as any).hrMin?.value || 0,
        normalRange: PPG_NORMAL_RANGES.hrMin,
        status: getMetricStatus((metrics as any).hrMin?.value || 0, PPG_NORMAL_RANGES.hrMin),
        interpretation: (metrics as any).hrMin?.interpretation || '',
        clinicalMeaning: (metrics as any).hrMin?.clinicalMeaning || {}
      }
    ];
  }, [measurementData.ppgMetrics]);

  // 상태별 색상 반환
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-600';
      case 'low': return 'text-blue-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-green-50 border-green-200';
      case 'low': return 'bg-blue-50 border-blue-200';
      case 'high': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'normal': return <Badge className="bg-green-100 text-green-800">정상</Badge>;
      case 'low': return <Badge className="bg-blue-100 text-blue-800">낮음</Badge>;
      case 'high': return <Badge className="bg-red-100 text-red-800">높음</Badge>;
      default: return <Badge variant="outline">알 수 없음</Badge>;
    }
  };

  // 점수별 색상 반환
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreStatus = (score: number) => {
    if (score >= 80) return { status: '우수', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> };
    if (score >= 60) return { status: '양호', color: 'bg-yellow-100 text-yellow-800', icon: <AlertTriangle className="w-4 h-4" /> };
    return { status: '주의', color: 'bg-red-100 text-red-800', icon: <AlertCircle className="w-4 h-4" /> };
  };

  // EEG 분포 차트 데이터 (주요 지표)
  const eegKeyMetricsData = useMemo(() => {
    const keyMetrics = eegMetrics.filter(metric => 
      ['집중력 지수', '이완도 지수', '스트레스 지수', '좌우뇌 균형'].includes(metric.name)
    );
    return keyMetrics.map(metric => ({
      name: metric.name,
      value: metric.value,
      normalMin: metric.normalRange.min,
      normalMax: metric.normalRange.max,
      status: metric.status
    }));
  }, [eegMetrics]);

  // EEG 전체 분포 차트 데이터
  const eegAllMetricsData = useMemo(() => {
    return eegMetrics.map(metric => ({
      name: metric.name,
      value: metric.value,
      normalMin: metric.normalRange.min,
      normalMax: metric.normalRange.max,
      status: metric.status
    }));
  }, [eegMetrics]);

  // PPG 분포 차트 데이터 (주요 지표)
  const ppgKeyMetricsData = useMemo(() => {
    const keyMetrics = ppgMetrics.filter(metric => 
      ['심박수', 'RMSSD', 'SDNN', 'LF/HF 비율', '산소포화도'].includes(metric.name)
    );
    return keyMetrics.map(metric => ({
      name: metric.name,
      value: metric.value,
      normalMin: metric.normalRange.min,
      normalMax: metric.normalRange.max,
      status: metric.status
    }));
  }, [ppgMetrics]);

  // EEG 레이더 차트 데이터
  const eegRadarData = useMemo(() => {
    const keyMetrics = eegMetrics.filter(metric => 
      ['집중력 지수', '이완도 지수', '스트레스 지수', '인지 부하', '정서 안정성'].includes(metric.name)
    );
    return keyMetrics.map(metric => ({
      subject: metric.name,
      value: metric.value,
      fullMark: metric.normalRange.max
    }));
  }, [eegMetrics]);

  return (
    <div className="min-h-full bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              돌아가기
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">상세 분석 리포트</h1>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {new Date().toLocaleDateString('ko-KR', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              다운로드
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              공유
            </Button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              AI 종합 분석
            </TabsTrigger>
            <TabsTrigger value="eeg" className="flex items-center gap-2">
              <Waves className="w-4 h-4" />
              EEG 분석 결과
            </TabsTrigger>
            <TabsTrigger value="ppg" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              PPG 분석 결과
            </TabsTrigger>
          </TabsList>

          {/* AI 종합 분석 탭 */}
          <TabsContent value="overview" className="space-y-6">
            {/* 전체 건강 점수 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600" />
                  전체 건강 점수
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold text-blue-600">{overallHealthScore}</div>
                    <div className="text-lg text-gray-500">/ 100</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getScoreStatus(overallHealthScore).icon}
                    <Badge className={getScoreStatus(overallHealthScore).color}>
                      {getScoreStatus(overallHealthScore).status}
                    </Badge>
                  </div>
                </div>
                <Progress value={overallHealthScore} className="h-3 mb-4" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-semibold text-blue-600">{eegScore}</div>
                    <div className="text-sm text-blue-700">정신 건강</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-semibold text-red-600">{ppgScore}</div>
                    <div className="text-sm text-red-700">신체 건강</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI 종합 분석 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI 종합 분석
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AIAnalysisMarkdownRenderer 
                  content={analysisResult.overallHealth?.summary || '분석 결과를 불러오는 중입니다...'}
                />
              </CardContent>
            </Card>

            {/* 주요 발견사항 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    주요 발견사항
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysisResult.overallHealth?.keyFindings?.map((finding, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm">{finding}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="w-5 h-5" />
                    위험 요소
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysisResult.overallHealth?.riskFactors?.map((risk, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm">{risk}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <Star className="w-5 h-5" />
                    강점
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysisResult.overallHealth?.strengths?.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* EEG 분석 결과 탭 */}
          <TabsContent value="eeg" className="space-y-6">
            {/* EEG 전체 점수 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  EEG 분석 점수
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold text-blue-600">{eegScore}</div>
                    <div className="text-lg text-gray-500">/ 100</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getScoreStatus(eegScore).icon}
                    <Badge className={getScoreStatus(eegScore).color}>
                      {getScoreStatus(eegScore).status}
                    </Badge>
                  </div>
                </div>
                <Progress value={eegScore} className="h-3" />
              </CardContent>
            </Card>

            {/* EEG 요약 설명 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  요약 설명
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AIAnalysisMarkdownRenderer 
                  content={analysisResult.detailedAnalysis?.mentalHealth?.analysis || 'EEG 분석 결과를 불러오는 중입니다...'}
                />
              </CardContent>
            </Card>

            {/* 주요 지표 분포 그래프 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  주요 지표 분포
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={eegKeyMetricsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#3b82f6" name="측정값" />
                      <Line type="monotone" dataKey="normalMin" stroke="#10b981" name="정상 최소" />
                      <Line type="monotone" dataKey="normalMax" stroke="#ef4444" name="정상 최대" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* 전체 지표 분포 그래프 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  전체 지표 분포
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={eegAllMetricsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#6366f1" name="측정값" />
                        <Line type="monotone" dataKey="normalMin" stroke="#10b981" name="정상 최소" />
                        <Line type="monotone" dataKey="normalMax" stroke="#ef4444" name="정상 최대" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={eegRadarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis />
                        <Radar
                          name="EEG 지표"
                          dataKey="value"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.6}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 상세 지표 테이블 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  상세 지표 분석
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {eegMetrics.map((metric, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${getStatusBg(metric.status)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{metric.name}</h3>
                        {getStatusBadge(metric.status)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">측정값</p>
                          <p className={`text-lg font-bold ${getStatusColor(metric.status)}`}>
                            {metric.value.toFixed(3)} {metric.normalRange.unit}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">정상 범위</p>
                          <p className="text-sm font-medium">
                            {metric.normalRange.min} - {metric.normalRange.max} {metric.normalRange.unit}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">생리학적 의미</p>
                          <p className="text-sm">
                            {metric.status === 'normal' 
                              ? metric.clinicalMeaning.withinNormal 
                              : metric.status === 'low' 
                              ? metric.clinicalMeaning.belowNormal 
                              : metric.clinicalMeaning.aboveNormal}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PPG 분석 결과 탭 */}
          <TabsContent value="ppg" className="space-y-6">
            {/* PPG 전체 점수 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  PPG 분석 점수
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold text-red-600">{ppgScore}</div>
                    <div className="text-lg text-gray-500">/ 100</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getScoreStatus(ppgScore).icon}
                    <Badge className={getScoreStatus(ppgScore).color}>
                      {getScoreStatus(ppgScore).status}
                    </Badge>
                  </div>
                </div>
                <Progress value={ppgScore} className="h-3" />
              </CardContent>
            </Card>

            {/* PPG 요약 설명 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  요약 설명
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AIAnalysisMarkdownRenderer 
                  content={analysisResult.detailedAnalysis?.physicalHealth?.analysis || 'PPG 분석 결과를 불러오는 중입니다...'}
                />
              </CardContent>
            </Card>

            {/* 주요 지표 분포 그래프 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  주요 지표 분포
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={ppgKeyMetricsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#ef4444" name="측정값" />
                      <Line type="monotone" dataKey="normalMin" stroke="#10b981" name="정상 최소" />
                      <Line type="monotone" dataKey="normalMax" stroke="#f59e0b" name="정상 최대" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* 전체 지표 상세 분석 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  전체 지표 상세 분석
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ppgMetrics.map((metric, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${getStatusBg(metric.status)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{metric.name}</h3>
                        {getStatusBadge(metric.status)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">측정값</p>
                          <p className={`text-lg font-bold ${getStatusColor(metric.status)}`}>
                            {metric.value.toFixed(2)} {metric.normalRange.unit}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">정상 범위</p>
                          <p className="text-sm font-medium">
                            {metric.normalRange.min} - {metric.normalRange.max} {metric.normalRange.unit}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">해석</p>
                          <p className="text-sm">{metric.interpretation}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">생리학적 의미</p>
                          <p className="text-sm">
                            {metric.status === 'normal' 
                              ? metric.clinicalMeaning.withinNormal 
                              : metric.status === 'low' 
                              ? metric.clinicalMeaning.belowNormal 
                              : metric.clinicalMeaning.aboveNormal}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DetailedAnalysisScreen; 