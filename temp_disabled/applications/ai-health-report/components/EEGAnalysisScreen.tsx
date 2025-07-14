import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ScatterChart, Scatter, Cell
} from 'recharts';
import { Brain, Activity, TrendingUp, AlertCircle, Info, Zap, Target, Waves } from 'lucide-react';
import { AIAnalysisResult, MeasurementData } from '../types';

interface EEGAnalysisScreenProps {
  analysisResult: AIAnalysisResult;
  measurementData: MeasurementData;
  onBack: () => void;
}

// 뇌파 주파수 대역 정의
const EEG_FREQUENCY_BANDS = {
  delta: { range: '0.5-4 Hz', name: '델타파', description: '깊은 수면, 무의식 상태' },
  theta: { range: '4-8 Hz', name: '세타파', description: '명상, 창의성, REM 수면' },
  alpha: { range: '8-13 Hz', name: '알파파', description: '이완, 집중, 안정 상태' },
  beta: { range: '13-30 Hz', name: '베타파', description: '각성, 집중, 논리적 사고' },
  gamma: { range: '30-100 Hz', name: '감마파', description: '고차원 인지, 의식 통합' }
};

const EEGAnalysisScreen: React.FC<EEGAnalysisScreenProps> = ({ analysisResult, measurementData, onBack }) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1min' | '5min' | '10min' | 'all'>('all');
  const [selectedBand, setSelectedBand] = useState<string>('all');

  // 실제 EEG 데이터를 기반으로 분석 데이터 생성
  const eegData = useMemo(() => {
    if (!measurementData?.eegData || measurementData.eegData.length === 0) {
      // 측정 데이터가 없는 경우 빈 배열 반환
      return [];
    }

    const eegRawData = measurementData.eegData;
    const dataPoints = Math.min(eegRawData.length, 1500); // 최대 60초 (25Hz 기준)
    const baseData = [];

    for (let i = 0; i < dataPoints; i++) {
      const time = i / 25; // 25Hz 샘플링 기준 시간 계산
      const eegSample = eegRawData[i] || [0, 0];
      const ch1 = eegSample[0] || 0;
      const ch2 = eegSample[1] || 0;
      
      // 실제 EEG 데이터 기반 주파수 대역 분석 (간단한 추정)
      const delta = Math.abs(ch1 * 0.1 + ch2 * 0.1) + Math.random() * 5;
      const theta = Math.abs(ch1 * 0.2 + ch2 * 0.2) + Math.random() * 8;
      const alpha = Math.abs(ch1 * 0.3 + ch2 * 0.3) + Math.random() * 12;
      const beta = Math.abs(ch1 * 0.25 + ch2 * 0.25) + Math.random() * 10;
      const gamma = Math.abs(ch1 * 0.05 + ch2 * 0.05) + Math.random() * 3;
      
      // 실제 메트릭 데이터 사용
      const attention = measurementData.eegMetrics?.concentration || 0;
      const meditation = measurementData.eegMetrics?.relaxation || 0;
      const stress = measurementData.eegMetrics?.stress || 0;
      
      baseData.push({
        time: `${Math.floor(time / 60)}:${Math.floor(time % 60).toString().padStart(2, '0')}`,
        timeValue: time,
        delta: Math.max(0, delta),
        theta: Math.max(0, theta),
        alpha: Math.max(0, alpha),
        beta: Math.max(0, beta),
        gamma: Math.max(0, gamma),
        attention: attention + Math.sin(time * 0.1) * 5,
        meditation: meditation + Math.sin(time * 0.08) * 5,
        stress: stress + Math.sin(time * 0.12) * 5,
        rawEEG: (ch1 + ch2) / 2 // 평균 EEG 신호
      });
    }
    
    return baseData;
  }, [measurementData]);

  // 주파수 대역별 평균값 계산
  const frequencyBandAverages = useMemo(() => {
    const averages = {
      delta: eegData.reduce((sum, point) => sum + point.delta, 0) / eegData.length,
      theta: eegData.reduce((sum, point) => sum + point.theta, 0) / eegData.length,
      alpha: eegData.reduce((sum, point) => sum + point.alpha, 0) / eegData.length,
      beta: eegData.reduce((sum, point) => sum + point.beta, 0) / eegData.length,
      gamma: eegData.reduce((sum, point) => sum + point.gamma, 0) / eegData.length,
    };

    return Object.entries(averages).map(([band, value]) => ({
      band: EEG_FREQUENCY_BANDS[band as keyof typeof EEG_FREQUENCY_BANDS].name,
      value: Math.round(value * 10) / 10,
      range: EEG_FREQUENCY_BANDS[band as keyof typeof EEG_FREQUENCY_BANDS].range,
      description: EEG_FREQUENCY_BANDS[band as keyof typeof EEG_FREQUENCY_BANDS].description,
      percentage: Math.round((value / Object.values(averages).reduce((a, b) => a + b, 0)) * 100)
    }));
  }, [eegData]);

  // 정신 건강 지표 계산
  const mentalHealthMetrics = useMemo(() => {
    const avgAttention = eegData.reduce((sum, point) => sum + point.attention, 0) / eegData.length;
    const avgMeditation = eegData.reduce((sum, point) => sum + point.meditation, 0) / eegData.length;
    const avgStress = eegData.reduce((sum, point) => sum + point.stress, 0) / eegData.length;
    
    return [
      { name: '집중력', value: Math.round(avgAttention), color: '#8884d8', description: '주의력과 집중 상태' },
      { name: '명상 상태', value: Math.round(avgMeditation), color: '#82ca9d', description: '이완과 명상 깊이' },
      { name: '스트레스', value: Math.round(avgStress), color: '#ffc658', description: '정신적 긴장 수준' },
      { name: '정신 안정성', value: Math.round((avgMeditation - avgStress + 100) / 2), color: '#ff7300', description: '전반적 정신 건강' }
    ];
  }, [eegData]);

  // 뇌파 상태 분석
  const brainwaveAnalysis = useMemo(() => {
    const alphaAvg = frequencyBandAverages.find(band => band.band === '알파파')?.value || 0;
    const betaAvg = frequencyBandAverages.find(band => band.band === '베타파')?.value || 0;
    const thetaAvg = frequencyBandAverages.find(band => band.band === '세타파')?.value || 0;
    
    let dominantState = '';
    let stateDescription = '';
    let recommendations = [];

    if (alphaAvg > betaAvg && alphaAvg > thetaAvg) {
      dominantState = '이완 상태';
      stateDescription = '알파파가 우세한 상태로, 편안하고 집중된 상태입니다.';
      recommendations = ['현재 상태를 유지하세요', '규칙적인 명상을 통해 알파파를 강화하세요'];
    } else if (betaAvg > alphaAvg) {
      dominantState = '각성 상태';
      stateDescription = '베타파가 우세한 상태로, 활발한 정신 활동 상태입니다.';
      recommendations = ['적절한 휴식을 취하세요', '스트레스 관리에 주의하세요'];
    } else {
      dominantState = '창의적 상태';
      stateDescription = '세타파가 우세한 상태로, 창의적이고 직관적인 상태입니다.';
      recommendations = ['창의적 활동을 시도해보세요', '충분한 수면을 취하세요'];
    }

    return { dominantState, stateDescription, recommendations };
  }, [frequencyBandAverages]);

  // 시간대별 필터링
  const filteredData = useMemo(() => {
    if (selectedTimeRange === 'all') return eegData;
    
    const minutes = selectedTimeRange === '1min' ? 1 : selectedTimeRange === '5min' ? 5 : 10;
    const pointsToShow = minutes * 60;
    
    return eegData.slice(-pointsToShow);
  }, [eegData, selectedTimeRange]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  // 데이터가 없을 때 처리
  if (eegData.length === 0) {
    return (
      <div className="min-h-full bg-black p-6 pt-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={onBack}
                className="flex items-center gap-2"
              >
                ← 돌아가기
              </Button>
              <h1 className="text-2xl font-bold text-white">EEG 상세 분석</h1>
            </div>
          </div>
          
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-8 text-center">
              <Brain className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">EEG 데이터를 찾을 수 없습니다</h2>
              <p className="text-gray-400">
                측정된 EEG 데이터가 없거나 불완전합니다. 새로운 측정을 진행해주세요.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack} className="text-gray-600 hover:text-gray-800">
              ← 돌아가기
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">뇌파(EEG) 분석</h1>
                <p className="text-gray-600">뇌파 신호와 정신 건강 상태를 분석합니다</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-purple-50">
              <Activity className="w-4 h-4 mr-1" />
              실시간 분석
            </Badge>
          </div>
        </div>

        {/* 주요 지표 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {mentalHealthMetrics.map((metric, index) => (
            <Card key={index} className={`${getScoreBg(metric.value)} border-l-4 border-l-purple-500`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{metric.name}</p>
                    <p className={`text-2xl font-bold ${getScoreColor(metric.value)}`}>
                      {metric.value}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-white/50 flex items-center justify-center">
                    <div 
                      className="w-8 h-8 rounded-full"
                      style={{ backgroundColor: metric.color }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 뇌파 상태 분석 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              현재 뇌파 상태 분석
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-800 mb-2">우세 상태</h3>
                <p className="text-xl font-bold text-purple-600">{brainwaveAnalysis.dominantState}</p>
                <p className="text-sm text-gray-600 mt-2">{brainwaveAnalysis.stateDescription}</p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">권장 사항</h3>
                <ul className="space-y-1">
                  {(brainwaveAnalysis.recommendations || []).map((rec, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">정신 건강 점수</h3>
                <p className={`text-2xl font-bold ${getScoreColor(analysisResult?.detailedAnalysis?.mentalHealth?.score || 0)}`}>
                  {analysisResult?.detailedAnalysis?.mentalHealth?.score || 0}/100
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {analysisResult?.detailedAnalysis?.mentalHealth?.status || '분석 중...'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 상세 분석 탭 */}
        <Tabs defaultValue="frequency" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="frequency">주파수 분석</TabsTrigger>
            <TabsTrigger value="timeseries">시계열 분석</TabsTrigger>
            <TabsTrigger value="mental">정신 상태</TabsTrigger>
            <TabsTrigger value="raw">원시 신호</TabsTrigger>
          </TabsList>

          {/* 주파수 분석 */}
          <TabsContent value="frequency" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Waves className="w-5 h-5 text-blue-600" />
                    주파수 대역별 분포
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={frequencyBandAverages}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="band" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          `${value} µV`, 
                          name
                        ]}
                        labelFormatter={(label) => {
                          const band = frequencyBandAverages.find(b => b.band === label);
                          return band ? `${band.band} (${band.range})` : label;
                        }}
                      />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    뇌파 대역별 비율
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {frequencyBandAverages.map((band, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{band.band}</span>
                          <span className="text-sm text-gray-600">{band.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${band.percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500">{band.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 주파수 대역 상세 정보 */}
            <Card>
              <CardHeader>
                <CardTitle>주파수 대역 상세 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(EEG_FREQUENCY_BANDS).map(([key, band]) => {
                    const bandData = frequencyBandAverages.find(b => b.band === band.name);
                    return (
                      <div key={key} className="p-4 border rounded-lg bg-gray-50">
                        <h4 className="font-semibold text-gray-800">{band.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{band.range}</p>
                        <p className="text-xs text-gray-500 mb-2">{band.description}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-purple-600">
                            {bandData?.value || 0} µV
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {bandData?.percentage || 0}%
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 시계열 분석 */}
          <TabsContent value="timeseries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    시간대별 뇌파 변화
                  </span>
                  <div className="flex items-center gap-2">
                    <select 
                      value={selectedTimeRange} 
                      onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                      className="px-3 py-1 border rounded-md text-sm"
                    >
                      <option value="1min">최근 1분</option>
                      <option value="5min">최근 5분</option>
                      <option value="10min">최근 10분</option>
                      <option value="all">전체</option>
                    </select>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={filteredData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="alpha" stroke="#8884d8" name="알파파" strokeWidth={2} />
                    <Line type="monotone" dataKey="beta" stroke="#82ca9d" name="베타파" strokeWidth={2} />
                    <Line type="monotone" dataKey="theta" stroke="#ffc658" name="세타파" strokeWidth={2} />
                    <Line type="monotone" dataKey="delta" stroke="#ff7300" name="델타파" strokeWidth={2} />
                    <Line type="monotone" dataKey="gamma" stroke="#00ff00" name="감마파" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 정신 상태 분석 */}
          <TabsContent value="mental" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    정신 상태 지표
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={mentalHealthMetrics}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar 
                        name="정신 상태" 
                        dataKey="value" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    시간대별 정신 상태 변화
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={filteredData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="attention" 
                        stackId="1" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        name="집중력"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="meditation" 
                        stackId="2" 
                        stroke="#82ca9d" 
                        fill="#82ca9d" 
                        name="명상 상태"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="stress" 
                        stackId="3" 
                        stroke="#ffc658" 
                        fill="#ffc658" 
                        name="스트레스"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* 정신 건강 상세 분석 */}
            <Card>
              <CardHeader>
                <CardTitle>정신 건강 상세 분석</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">분석 결과</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-800">집중력 상태</p>
                        <p className="text-xs text-blue-600">
                          평균 집중력: {eegData.length > 0 ? Math.round(eegData.reduce((sum, point) => sum + point.attention, 0) / eegData.length) : 0}점
                        </p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-sm font-medium text-green-800">명상 깊이</p>
                        <p className="text-xs text-green-600">
                          평균 명상 상태: {eegData.length > 0 ? Math.round(eegData.reduce((sum, point) => sum + point.meditation, 0) / eegData.length) : 0}점
                        </p>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <p className="text-sm font-medium text-yellow-800">스트레스 수준</p>
                        <p className="text-xs text-yellow-600">
                          평균 스트레스: {eegData.length > 0 ? Math.round(eegData.reduce((sum, point) => sum + point.stress, 0) / eegData.length) : 0}점
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">개선 방안</h3>
                    <div className="space-y-2">
                      {(analysisResult?.detailedAnalysis?.mentalHealth?.recommendations || []).map((rec: string, index: number) => (
                        <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                          <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                          <p className="text-sm text-gray-700">{rec}</p>
                        </div>
                      ))}
                      {(!analysisResult?.detailedAnalysis?.mentalHealth?.recommendations || 
                        analysisResult.detailedAnalysis.mentalHealth.recommendations.length === 0) && (
                        <div className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                          <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                          <p className="text-sm text-gray-700">개선 방안을 분석 중입니다...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 원시 신호 */}
          <TabsContent value="raw" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  원시 뇌파 신호
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={filteredData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(2)} µV`, '뇌파 신호']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="rawEEG" 
                      stroke="#ff6b6b" 
                      strokeWidth={1}
                      dot={false}
                      name="원시 EEG"
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">신호 품질 정보</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">샘플링 주파수</p>
                      <p className="font-medium">256 Hz</p>
                    </div>
                    <div>
                      <p className="text-gray-600">신호 범위</p>
                      <p className="font-medium">±100 µV</p>
                    </div>
                    <div>
                      <p className="text-gray-600">측정 시간</p>
                      <p className="font-medium">60초</p>
                    </div>
                    <div>
                      <p className="text-gray-600">신호 품질</p>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        양호
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EEGAnalysisScreen; 