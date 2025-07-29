/**
 * 통합 고급 분석 결과 렌더러
 * EEG와 PPG 통합 분석 결과를 시각적으로 표현
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card';
import { Badge } from '@ui/badge';
import { Progress } from '@ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@ui/alert';
import { 
  Brain, 
  Heart, 
  Activity, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Target,
  Calendar,
  Briefcase,
  User,
  Clock,
  ChevronRight
} from 'lucide-react';

import { IReportRenderer } from '../core/interfaces/IReportRenderer';
import { IntegratedAnalysisResult } from '../ai-engines/IntegratedAdvancedGeminiEngine';

export class IntegratedAdvancedReactRenderer implements IReportRenderer {
  id = 'integrated-advanced-react-renderer';
  name = '통합 고급 분석 리포트 렌더러';
  supportedEngines = ['integrated-advanced-gemini-v1'];
  
  canRender(engineId: string): boolean {
    return this.supportedEngines.includes(engineId);
  }
  
  render(result: IntegratedAnalysisResult): React.ReactElement {
    return <IntegratedAnalysisReport result={result} />;
  }
}

interface IntegratedAnalysisReportProps {
  result: IntegratedAnalysisResult;
}

const IntegratedAnalysisReport: React.FC<IntegratedAnalysisReportProps> = ({ result }) => {
  const getHealthScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };
  
  const getHealthScoreBgColor = (score: number): string => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    if (score >= 40) return 'bg-orange-100';
    return 'bg-red-100';
  };
  
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'default';
    }
  };
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'lifestyle': return <Activity className="w-4 h-4" />;
      case 'exercise': return <TrendingUp className="w-4 h-4" />;
      case 'mental': return <Brain className="w-4 h-4" />;
      case 'medical': return <Heart className="w-4 h-4" />;
      case 'work': return <Briefcase className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };
  
  return (
    <div className="space-y-6">
      {/* 헤더 - 종합 건강 점수 */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">종합 건강 분석 결과</h2>
              <p className="text-gray-600">EEG와 PPG 데이터를 통합한 심층 분석</p>
            </div>
            <div className="text-center">
              <div className={`text-5xl font-bold ${getHealthScoreColor(result.overallSummary.healthScore)}`}>
                {result.overallSummary.healthScore}
              </div>
              <div className="text-sm text-gray-600 mt-1">종합 점수</div>
            </div>
          </div>
          
          {/* 주요 발견사항 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {/* 긍정적 측면 */}
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-green-900">긍정적 측면</h4>
              </div>
              <ul className="space-y-1">
                {result.overallSummary.positiveAspects.map((aspect, idx) => (
                  <li key={idx} className="text-sm text-green-800 flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>{aspect}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* 주의 사항 */}
            {result.overallSummary.urgentIssues.length > 0 && (
              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <h4 className="font-semibold text-red-900">주의 필요</h4>
                </div>
                <ul className="space-y-1">
                  {result.overallSummary.urgentIssues.map((issue, idx) => (
                    <li key={idx} className="text-sm text-red-800 flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* 탭 컨텐츠 */}
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="summary">분석 요약</TabsTrigger>
          <TabsTrigger value="personalized">맞춤 분석</TabsTrigger>
          <TabsTrigger value="improvement">개선 방향</TabsTrigger>
          <TabsTrigger value="details">상세 수치</TabsTrigger>
        </TabsList>
        
        {/* 분석 요약 탭 */}
        <TabsContent value="summary" className="space-y-4">
          {/* EEG 요약 */}
          {result.eegSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  EEG 분석 요약
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold">전체 점수</span>
                  <span className={`text-2xl font-bold ${getHealthScoreColor(result.eegSummary.overallScore)}`}>
                    {result.eegSummary.overallScore}점
                  </span>
                </div>
                
                {/* 4대 지표 */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">감정균형도</span>
                      <span className="text-sm font-medium">{result.eegSummary.dimensionScores.emotionalBalance}%</span>
                    </div>
                    <Progress value={result.eegSummary.dimensionScores.emotionalBalance} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">뇌파 집중 건강도</span>
                      <span className="text-sm font-medium">{result.eegSummary.dimensionScores.brainFocus}%</span>
                    </div>
                    <Progress value={result.eegSummary.dimensionScores.brainFocus} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">뇌파 각성 건강도</span>
                      <span className="text-sm font-medium">{result.eegSummary.dimensionScores.brainArousal}%</span>
                    </div>
                    <Progress value={result.eegSummary.dimensionScores.brainArousal} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">스트레스</span>
                      <span className="text-sm font-medium">{result.eegSummary.dimensionScores.stressLevel}%</span>
                    </div>
                    <Progress value={result.eegSummary.dimensionScores.stressLevel} />
                  </div>
                </div>
                
                {/* 주요 발견사항 */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h5 className="font-medium text-gray-900 mb-2">주요 발견사항</h5>
                  <ul className="space-y-1">
                    {result.eegSummary.keyFindings.map((finding, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* PPG 요약 */}
          {result.ppgSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-600" />
                  PPG 분석 요약
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold">전체 점수</span>
                  <span className={`text-2xl font-bold ${getHealthScoreColor(result.ppgSummary.overallScore)}`}>
                    {result.ppgSummary.overallScore}점
                  </span>
                </div>
                
                {/* 3대 축 */}
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">스트레스 건강도</span>
                      <span className="text-sm font-medium">{result.ppgSummary.axisScores.stressHealth}%</span>
                    </div>
                    <Progress value={result.ppgSummary.axisScores.stressHealth} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">자율신경 건강도</span>
                      <span className="text-sm font-medium">{result.ppgSummary.axisScores.autonomicHealth}%</span>
                    </div>
                    <Progress value={result.ppgSummary.axisScores.autonomicHealth} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">심박변이 건강도</span>
                      <span className="text-sm font-medium">{result.ppgSummary.axisScores.hrvHealth}%</span>
                    </div>
                    <Progress value={result.ppgSummary.axisScores.hrvHealth} />
                  </div>
                </div>
                
                {/* 주요 발견사항 */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h5 className="font-medium text-gray-900 mb-2">주요 발견사항</h5>
                  <ul className="space-y-1">
                    {result.ppgSummary.keyFindings.map((finding, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* 맞춤 분석 탭 */}
        <TabsContent value="personalized" className="space-y-4">
          {/* 연령/성별 분석 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                연령/성별 맞춤 분석
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-gray-900 font-medium mb-2">
                    {result.personalizedAnalysis.ageGenderAnalysis.comparison}
                  </p>
                </div>
                
                {/* 위험 요소 */}
                {result.personalizedAnalysis.ageGenderAnalysis.risks.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                      주의해야 할 위험 요소
                    </h5>
                    <ul className="space-y-2">
                      {result.personalizedAnalysis.ageGenderAnalysis.risks.map((risk, idx) => (
                        <li key={idx} className="bg-orange-50 rounded p-2 text-sm text-orange-900">
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* 권고사항 */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    맞춤 권고사항
                  </h5>
                  <ul className="space-y-2">
                    {result.personalizedAnalysis.ageGenderAnalysis.recommendations.map((rec, idx) => (
                      <li key={idx} className="bg-green-50 rounded p-2 text-sm text-green-900">
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* 직업별 분석 */}
          {result.personalizedAnalysis.occupationAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-purple-600" />
                  직업 특화 분석
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-gray-900">
                      {result.personalizedAnalysis.occupationAnalysis.workStressImpact}
                    </p>
                  </div>
                  
                  {/* 직업 관련 위험 */}
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">직업 관련 건강 위험</h5>
                    <ul className="space-y-2">
                      {result.personalizedAnalysis.occupationAnalysis.occupationalRisks.map((risk, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* 일과 삶의 균형 */}
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">일과 삶의 균형</h5>
                    <ul className="space-y-2">
                      {result.personalizedAnalysis.occupationAnalysis.workLifeBalance.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <Target className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* 개선 방향 탭 */}
        <TabsContent value="improvement" className="space-y-4">
          {/* 즉시 실천 사항 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-red-600" />
                즉시 실천 사항
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.improvementPlan.immediate.map((item, idx) => (
                  <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(item.category)}
                        <h5 className="font-medium text-gray-900">{item.action}</h5>
                      </div>
                      <Badge variant={getPriorityColor(item.priority)}>
                        {item.priority === 'high' ? '높음' : item.priority === 'medium' ? '중간' : '낮음'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{item.expectedBenefit}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{item.timeframe}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* 단기 계획 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-yellow-600" />
                단기 계획 (1-4주)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.improvementPlan.shortTerm.map((item, idx) => (
                  <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(item.category)}
                        <h5 className="font-medium text-gray-900">{item.action}</h5>
                      </div>
                      <Badge variant={getPriorityColor(item.priority)}>
                        {item.priority === 'high' ? '높음' : item.priority === 'medium' ? '중간' : '낮음'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{item.expectedBenefit}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{item.timeframe}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* 장기 계획 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                장기 계획 (1-3개월)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.improvementPlan.longTerm.map((item, idx) => (
                  <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(item.category)}
                        <h5 className="font-medium text-gray-900">{item.action}</h5>
                      </div>
                      <Badge variant={getPriorityColor(item.priority)}>
                        {item.priority === 'high' ? '높음' : item.priority === 'medium' ? '중간' : '낮음'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{item.expectedBenefit}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{item.timeframe}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* 의료 권고사항 */}
          {result.medicalRecommendations && result.medicalRecommendations.consultationNeeded && (
            <Alert variant={result.medicalRecommendations.urgency === 'immediate' ? 'destructive' : 'default'}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>의료 상담 권고</AlertTitle>
              <AlertDescription className="mt-2">
                <p className="mb-2">
                  긴급도: {
                    result.medicalRecommendations.urgency === 'immediate' ? '즉시' :
                    result.medicalRecommendations.urgency === 'soon' ? '빠른 시일 내' : '정기 검진 시'
                  }
                </p>
                <p>권장 진료과: {result.medicalRecommendations.specialties.join(', ')}</p>
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
        
        {/* 상세 수치 탭 */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>메타데이터</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">분석 일시:</span>
                  <span className="ml-2 font-medium">
                    {new Date(result.metadata.analysisDate).toLocaleString('ko-KR')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">엔진 버전:</span>
                  <span className="ml-2 font-medium">{result.metadata.engineVersion}</span>
                </div>
                <div>
                  <span className="text-gray-600">처리 시간:</span>
                  <span className="ml-2 font-medium">{result.metadata.processingTime}ms</span>
                </div>
                <div>
                  <span className="text-gray-600">데이터 품질:</span>
                  <span className="ml-2">
                    <Badge className={
                      result.metadata.dataQuality === 'excellent' ? 'bg-green-100 text-green-800' :
                      result.metadata.dataQuality === 'good' ? 'bg-blue-100 text-blue-800' :
                      result.metadata.dataQuality === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {result.metadata.dataQuality === 'excellent' ? '우수' :
                       result.metadata.dataQuality === 'good' ? '양호' :
                       result.metadata.dataQuality === 'fair' ? '보통' : '낮음'}
                    </Badge>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegratedAdvancedReactRenderer;