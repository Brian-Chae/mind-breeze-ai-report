/**
 * AI Health Report 트렌드 분석 화면
 * - 시간에 따른 건강 데이터 트렌드 분석
 * - 차트를 통한 데이터 시각화
 * - 개선 추이 및 패턴 분석
 * - 맞춤형 인사이트 제공
 */

import React, { useState, useEffect, useMemo } from 'react';
import { format, subDays, subWeeks, subMonths, isAfter, isBefore } from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Brain,
  Heart,
  Zap,
  Target,
  Award,
  AlertCircle,
  CheckCircle,
  Info,
  Filter,
  Download
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

import useReportHistory from '../hooks/useReportHistory';
import { StoredReport } from '../services/ReportStorage';

interface TrendsAnalysisScreenProps {
  onBack: () => void;
}

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';
type ChartType = 'line' | 'bar' | 'area';

interface TrendData {
  date: string;
  timestamp: number;
  overallScore: number;
  mentalHealth: number;
  physicalHealth: number;
  stressLevel: number;
  reportId: string;
}

interface InsightData {
  type: 'improvement' | 'decline' | 'stable' | 'warning';
  title: string;
  description: string;
  value?: number;
  trend?: number;
}

const TrendsAnalysisScreen: React.FC<TrendsAnalysisScreenProps> = ({ onBack }) => {
  const { reports, isLoading, error } = useReportHistory();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [chartType, setChartType] = useState<ChartType>('line');
  const [selectedMetric, setSelectedMetric] = useState<'overall' | 'mental' | 'physical' | 'stress'>('overall');

  // 시간 범위에 따른 데이터 필터링
  const filteredReports = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '7d':
        startDate = subDays(now, 7);
        break;
      case '30d':
        startDate = subDays(now, 30);
        break;
      case '90d':
        startDate = subDays(now, 90);
        break;
      case '1y':
        startDate = subDays(now, 365);
        break;
      default:
        return reports;
    }

    return reports.filter(report => isAfter(new Date(report.timestamp), startDate));
  }, [reports, timeRange]);

  // 차트 데이터 변환
  const chartData = useMemo(() => {
    return filteredReports
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(report => ({
        date: format(new Date(report.timestamp), 'MM/dd', { locale: ko }),
        timestamp: report.timestamp,
        overallScore: report.analysisResult.overallHealth.score,
        mentalHealth: report.analysisResult.detailedAnalysis.mentalHealth.score,
        physicalHealth: report.analysisResult.detailedAnalysis.physicalHealth.score,
        stressLevel: report.analysisResult.detailedAnalysis.stressLevel.score,
        reportId: report.id
      }));
  }, [filteredReports]);

  // 인사이트 데이터 생성
  const insights = useMemo(() => {
    if (chartData.length < 2) return [];

    const insights: InsightData[] = [];
    const latest = chartData[chartData.length - 1];
    const previous = chartData[chartData.length - 2];

    // 전체 점수 트렌드
    const overallTrend = latest.overallScore - previous.overallScore;
    if (Math.abs(overallTrend) > 5) {
      insights.push({
        type: overallTrend > 0 ? 'improvement' : 'decline',
        title: overallTrend > 0 ? '전체 건강 점수 개선' : '전체 건강 점수 하락',
        description: `이전 측정 대비 ${Math.abs(overallTrend).toFixed(1)}점 ${overallTrend > 0 ? '상승' : '하락'}했습니다.`,
        value: latest.overallScore,
        trend: overallTrend
      });
    }

    // 정신건강 트렌드
    const mentalTrend = latest.mentalHealth - previous.mentalHealth;
    if (Math.abs(mentalTrend) > 5) {
      insights.push({
        type: mentalTrend > 0 ? 'improvement' : 'decline',
        title: mentalTrend > 0 ? '정신건강 개선' : '정신건강 주의',
        description: `정신건강 점수가 ${Math.abs(mentalTrend).toFixed(1)}점 ${mentalTrend > 0 ? '개선' : '하락'}되었습니다.`,
        value: latest.mentalHealth,
        trend: mentalTrend
      });
    }

    // 스트레스 레벨 경고
    if (latest.stressLevel < 60) {
      insights.push({
        type: 'warning',
        title: '스트레스 레벨 주의',
        description: '최근 스트레스 지수가 높습니다. 휴식과 스트레스 관리가 필요합니다.',
        value: latest.stressLevel
      });
    }

    // 일관성 체크
    const scores = chartData.slice(-5).map(d => d.overallScore);
    const variance = scores.reduce((acc, score) => acc + Math.pow(score - (scores.reduce((a, b) => a + b) / scores.length), 2), 0) / scores.length;
    
    if (variance < 25) {
      insights.push({
        type: 'stable',
        title: '안정적인 건강 상태',
        description: '최근 건강 상태가 일관되게 유지되고 있습니다.',
      });
    }

    return insights;
  }, [chartData]);

  // 통계 데이터
  const statistics = useMemo(() => {
    if (chartData.length === 0) return null;

    const scores = chartData.map(d => d.overallScore);
    const mentalScores = chartData.map(d => d.mentalHealth);
    const physicalScores = chartData.map(d => d.physicalHealth);
    const stressScores = chartData.map(d => d.stressLevel);

    return {
      averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      improvementRate: chartData.length > 1 ? ((scores[scores.length - 1] - scores[0]) / scores[0]) * 100 : 0,
      mentalAverage: mentalScores.reduce((a, b) => a + b, 0) / mentalScores.length,
      physicalAverage: physicalScores.reduce((a, b) => a + b, 0) / physicalScores.length,
      stressAverage: stressScores.reduce((a, b) => a + b, 0) / stressScores.length,
      totalMeasurements: chartData.length
    };
  }, [chartData]);

  // 차트 색상
  const colors = {
    overall: '#3b82f6',
    mental: '#8b5cf6',
    physical: '#10b981',
    stress: '#f59e0b'
  };

  const getInsightIcon = (type: InsightData['type']) => {
    switch (type) {
      case 'improvement':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'decline':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'stable':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getInsightColor = (type: InsightData['type']) => {
    switch (type) {
      case 'improvement':
        return 'border-green-200 bg-green-50';
      case 'decline':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'stable':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>선택한 기간에 데이터가 없습니다.</p>
          </div>
        </div>
      );
    }

    const ChartComponent = chartType === 'line' ? LineChart : chartType === 'bar' ? BarChart : AreaChart;

    return (
      <ResponsiveContainer width="100%" height={400}>
        <ChartComponent data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={[0, 100]} />
          <Tooltip 
            formatter={(value: number, name: string) => [
              `${value.toFixed(1)}점`,
              name === 'overallScore' ? '전체 점수' :
              name === 'mentalHealth' ? '정신건강' :
              name === 'physicalHealth' ? '신체건강' : '스트레스 관리'
            ]}
            labelFormatter={(label) => `측정일: ${label}`}
          />
          <Legend />
          
          {chartType === 'area' ? (
            <>
              <Area
                type="monotone"
                dataKey={selectedMetric === 'overall' ? 'overallScore' : 
                         selectedMetric === 'mental' ? 'mentalHealth' :
                         selectedMetric === 'physical' ? 'physicalHealth' : 'stressLevel'}
                stroke={colors[selectedMetric]}
                fill={colors[selectedMetric]}
                fillOpacity={0.3}
                name={selectedMetric === 'overall' ? '전체 점수' : 
                      selectedMetric === 'mental' ? '정신건강' :
                      selectedMetric === 'physical' ? '신체건강' : '스트레스 관리'}
              />
            </>
          ) : chartType === 'line' ? (
            <>
              {selectedMetric === 'overall' && (
                <Line type="monotone" dataKey="overallScore" stroke={colors.overall} strokeWidth={2} name="전체 점수" />
              )}
              {selectedMetric === 'mental' && (
                <Line type="monotone" dataKey="mentalHealth" stroke={colors.mental} strokeWidth={2} name="정신건강" />
              )}
              {selectedMetric === 'physical' && (
                <Line type="monotone" dataKey="physicalHealth" stroke={colors.physical} strokeWidth={2} name="신체건강" />
              )}
              {selectedMetric === 'stress' && (
                <Line type="monotone" dataKey="stressLevel" stroke={colors.stress} strokeWidth={2} name="스트레스 관리" />
              )}
            </>
          ) : (
            <>
              <Bar
                dataKey={selectedMetric === 'overall' ? 'overallScore' : 
                         selectedMetric === 'mental' ? 'mentalHealth' :
                         selectedMetric === 'physical' ? 'physicalHealth' : 'stressLevel'}
                fill={colors[selectedMetric]}
                name={selectedMetric === 'overall' ? '전체 점수' : 
                      selectedMetric === 'mental' ? '정신건강' :
                      selectedMetric === 'physical' ? '신체건강' : '스트레스 관리'}
              />
            </>
          )}
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-full bg-black p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-white mb-2">데이터 분석 중...</h1>
          <p className="text-gray-400">건강 데이터를 분석하고 있습니다.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full bg-black p-6 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            데이터를 불러오는 중 오류가 발생했습니다: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-black p-6" style={{ backgroundColor: '#000000' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-white hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              뒤로가기
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">건강 트렌드 분석</h1>
              <p className="text-gray-400">시간에 따른 건강 데이터 변화를 분석합니다</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">최근 7일</SelectItem>
                <SelectItem value="30d">최근 30일</SelectItem>
                <SelectItem value="90d">최근 90일</SelectItem>
                <SelectItem value="1y">최근 1년</SelectItem>
                <SelectItem value="all">전체 기간</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              내보내기
            </Button>
          </div>
        </div>

        {/* 통계 카드 */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">평균 점수</CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.averageScore.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">
                  {statistics.improvementRate > 0 ? '+' : ''}{statistics.improvementRate.toFixed(1)}% 변화
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">최고 점수</CardTitle>
                <Award className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.highestScore}</div>
                <p className="text-xs text-muted-foreground">
                  개인 최고 기록
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">측정 횟수</CardTitle>
                <Activity className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.totalMeasurements}</div>
                <p className="text-xs text-muted-foreground">
                  선택한 기간 내
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">스트레스 평균</CardTitle>
                <Zap className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.stressAverage.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">
                  스트레스 관리 점수
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 차트 및 인사이트 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 차트 영역 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>건강 점수 추이</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="overall">전체 점수</SelectItem>
                        <SelectItem value="mental">정신건강</SelectItem>
                        <SelectItem value="physical">신체건강</SelectItem>
                        <SelectItem value="stress">스트레스</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="line">선 그래프</SelectItem>
                        <SelectItem value="bar">막대 그래프</SelectItem>
                        <SelectItem value="area">영역 그래프</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {renderChart()}
              </CardContent>
            </Card>
          </div>

          {/* 인사이트 영역 */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  AI 인사이트
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {insights.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    더 많은 데이터가 필요합니다. 정기적으로 측정하여 트렌드를 확인하세요.
                  </p>
                ) : (
                  insights.map((insight, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${getInsightColor(insight.type)}`}>
                      <div className="flex items-start gap-3">
                        {getInsightIcon(insight.type)}
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{insight.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                          {insight.value && (
                            <div className="mt-2">
                              <Progress value={insight.value} className="h-2" />
                              <p className="text-xs text-gray-500 mt-1">{insight.value.toFixed(1)}점</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* 건강 영역별 평균 */}
            {statistics && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5" />
                    영역별 평균
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-purple-500" />
                      <span className="text-sm">정신건강</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{statistics.mentalAverage.toFixed(1)}</span>
                      <Progress value={statistics.mentalAverage} className="w-16 h-2" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span className="text-sm">신체건강</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{statistics.physicalAverage.toFixed(1)}</span>
                      <Progress value={statistics.physicalAverage} className="w-16 h-2" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">스트레스 관리</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{statistics.stressAverage.toFixed(1)}</span>
                      <Progress value={statistics.stressAverage} className="w-16 h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendsAnalysisScreen; 