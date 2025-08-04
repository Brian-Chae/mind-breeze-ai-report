import React from 'react';
import { Heart, Activity, AlertCircle, CheckCircle, Info, TrendingUp, Radio, BarChart3, HelpCircle, Target, Shield, Zap } from 'lucide-react';
import { Card } from '@ui/card';
import { Badge } from '@ui/badge';
import { Progress } from '@ui/progress';

/**
 * PPG Advanced Gemini 엔진용 React 렌더러
 * 상세한 PPG 분석 결과를 React 컴포넌트로 시각화
 */

interface PPGAdvancedReportProps {
  report: any;
}

export const PPGAdvancedReportComponent: React.FC<PPGAdvancedReportProps> = ({ report }) => {
  const analysisData = report.analysisResult || {};
  
  // 새로운 3대 지표 구조 지원
  const threeDimensionAnalysis = analysisData.threeDimensionAnalysis || {};
  const hasNewStructure = Object.keys(threeDimensionAnalysis).length > 0;
  
  const detailedAnalysis = analysisData.detailedDataAnalysis || {};
  const comprehensiveAssessment = analysisData.comprehensiveAssessment || {};
  const metadata = analysisData.metadata || {};

  const getSignificanceColor = (significance: string): string => {
    switch (significance) {
      case 'normal': return 'bg-green-100 text-green-800';
      case 'mild': return 'bg-yellow-100 text-yellow-800';
      case 'moderate': return 'bg-orange-100 text-orange-800';
      case 'severe': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-red-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">PPG 고급 맥파 분석 결과</h2>
              <p className="text-gray-600 mt-1">
                {metadata.personalInfo?.age}세 {metadata.personalInfo?.gender === 'male' ? '남성' : '여성'} 
                {metadata.personalInfo?.occupation && `, ${metadata.personalInfo.occupation}`}
              </p>
            </div>
          </div>
          <Badge className="bg-red-600 text-white">
            신호 품질: {(metadata.dataQuality?.signalQuality * 100 || 0).toFixed(0)}%
          </Badge>
        </div>
      </div>

      {/* 3대 맥파 분석 지표 카드 (새로운 구조) */}
      {hasNewStructure && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(threeDimensionAnalysis).map(([key, dimension]: [string, any]) => (
            <Card key={key} className="p-5">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getDimensionIcon(dimension.dimension)}
                    <h3 className="font-semibold text-lg">{dimension.dimension}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getSignificanceColor(dimension.clinicalSignificance)}>
                      {getSignificanceLabel(dimension.clinicalSignificance)}
                    </Badge>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-red-600">{dimension.score}</div>
                      <div className="text-xs text-gray-500">건강도</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">수준:</span>
                    <Badge variant="outline" className="text-sm">
                      {dimension.level}
                    </Badge>
                  </div>
                  <Progress value={dimension.score} className="w-full h-2" />
                </div>
                
                <p className="text-gray-700 text-sm">{dimension.interpretation}</p>
                
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>개인 맞춤 해석:</strong> {dimension.personalizedInterpretation}
                  </p>
                </div>
                
                {dimension.recommendations && dimension.recommendations.length > 0 && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-green-800 mb-2">권장사항:</p>
                    <ul className="text-sm text-green-700 space-y-1">
                      {dimension.recommendations.map((rec: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 심박수 분석 */}
      {detailedAnalysis.heartRateAnalysis && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-600" />
            심박수 분석
          </h3>
          <div className="space-y-4">
            {Object.entries(detailedAnalysis.heartRateAnalysis).map(([metric, analysis]: [string, any]) => (
              <div key={metric} className="border-l-4 border-red-500 pl-4">
                <h4 className="font-medium">{formatMetricName(metric)}</h4>
                <p className="text-sm text-gray-700 mt-1">{analysis.interpretation}</p>
                <p className="text-xs text-gray-500 mt-1">{analysis.evidence}</p>
                {analysis.clinicalSignificance && (
                  <p className="text-sm text-red-600 mt-1">
                    임상적 의미: {analysis.clinicalSignificance}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* HRV 지표 분석 */}
      {detailedAnalysis.hrvIndicesAnalysis && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            HRV 지표 분석
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(detailedAnalysis.hrvIndicesAnalysis).map(([domain, analysis]: [string, any]) => (
              <div key={domain} className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium capitalize mb-2">{formatMetricName(domain)}</h4>
                <p className="text-sm text-gray-700">{analysis.interpretation}</p>
                <p className="text-xs text-gray-500 mt-2">{analysis.evidence}</p>
                
                {analysis.explanation && (
                  <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-800">
                    <strong>설명:</strong> {analysis.explanation}
                  </div>
                )}
                
                {analysis.recommendations && analysis.recommendations.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-blue-700 mb-1">권장사항:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {analysis.recommendations.map((rec: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-blue-500">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 자율신경계 종합 분석 */}
      {detailedAnalysis.autonomicAnalysis && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            자율신경계 종합 분석
          </h3>
          <div className="space-y-3">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">전반적 평가</h4>
              <p className="text-gray-700">{detailedAnalysis.autonomicAnalysis.overallAssessment}</p>
            </div>
            
            {detailedAnalysis.autonomicAnalysis.sympatheticParasympatheticBalance && (
              <div>
                <h4 className="font-medium text-sm mb-1">교감/부교감 신경 균형</h4>
                <p className="text-sm text-gray-600">{detailedAnalysis.autonomicAnalysis.sympatheticParasympatheticBalance}</p>
              </div>
            )}
            
            {detailedAnalysis.autonomicAnalysis.stressResponsePattern && (
              <div>
                <h4 className="font-medium text-sm mb-1">스트레스 반응 패턴</h4>
                <p className="text-sm text-gray-600">{detailedAnalysis.autonomicAnalysis.stressResponsePattern}</p>
              </div>
            )}
            
            {detailedAnalysis.autonomicAnalysis.recoveryCapacity && (
              <div>
                <h4 className="font-medium text-sm mb-1">회복 능력</h4>
                <p className="text-sm text-gray-600">{detailedAnalysis.autonomicAnalysis.recoveryCapacity}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 종합 의견 */}
      {comprehensiveAssessment && Object.keys(comprehensiveAssessment).length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            종합 의견 및 권장사항
          </h3>
          
          {/* 전체 요약 */}
          {comprehensiveAssessment.overallSummary && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">전체 요약</h4>
              <p className="text-red-700">{comprehensiveAssessment.overallSummary}</p>
              {comprehensiveAssessment.overallScore && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-red-700">종합 점수</span>
                    <span className="text-lg font-bold text-red-800">{comprehensiveAssessment.overallScore}점</span>
                  </div>
                  <Progress value={comprehensiveAssessment.overallScore} className="h-2" />
                </div>
              )}
            </div>
          )}

          {/* 주요 발견사항 */}
          {comprehensiveAssessment.keyFindings && comprehensiveAssessment.keyFindings.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                주요 발견사항
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {comprehensiveAssessment.keyFindings.map((finding: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{finding}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 주요 문제점 */}
          {comprehensiveAssessment.primaryConcerns && comprehensiveAssessment.primaryConcerns.length > 0 && comprehensiveAssessment.primaryConcerns[0] !== "현재 특별한 문제점 없음" && (
            <div className="mb-6">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                주요 문제점
              </h4>
              <div className="space-y-2">
                {comprehensiveAssessment.primaryConcerns.map((concern: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-orange-800">{concern}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 연령 및 성별 분석 */}
          {comprehensiveAssessment.ageGenderAnalysis && (
            <div className="mb-6 p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-800 mb-3">연령 및 성별 기준 분석</h4>
              <div className="space-y-2">
                {comprehensiveAssessment.ageGenderAnalysis.ageComparison && (
                  <p className="text-sm text-purple-700">
                    <strong>연령대 비교:</strong> {comprehensiveAssessment.ageGenderAnalysis.ageComparison}
                  </p>
                )}
                {comprehensiveAssessment.ageGenderAnalysis.genderConsiderations && (
                  <p className="text-sm text-purple-700">
                    <strong>성별 특성:</strong> {comprehensiveAssessment.ageGenderAnalysis.genderConsiderations}
                  </p>
                )}
                {comprehensiveAssessment.ageGenderAnalysis.developmentalContext && (
                  <p className="text-sm text-purple-700">
                    <strong>발달적 맥락:</strong> {comprehensiveAssessment.ageGenderAnalysis.developmentalContext}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 직업적 특성 분석 */}
          {comprehensiveAssessment.occupationalAnalysis && (
            <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
              <h4 className="font-medium text-indigo-800 mb-3">직업적 특성에 따른 분석</h4>
              <div className="space-y-2">
                {comprehensiveAssessment.occupationalAnalysis.jobDemands && (
                  <p className="text-sm text-indigo-700">
                    <strong>업무 요구사항:</strong> {comprehensiveAssessment.occupationalAnalysis.jobDemands}
                  </p>
                )}
                {comprehensiveAssessment.occupationalAnalysis.workRelatedPatterns && (
                  <p className="text-sm text-indigo-700">
                    <strong>업무 관련 패턴:</strong> {comprehensiveAssessment.occupationalAnalysis.workRelatedPatterns}
                  </p>
                )}
                {comprehensiveAssessment.occupationalAnalysis.professionalRecommendations && comprehensiveAssessment.occupationalAnalysis.professionalRecommendations.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-indigo-800 mb-1">직업별 권장사항:</p>
                    <ul className="text-sm text-indigo-700 space-y-1">
                      {comprehensiveAssessment.occupationalAnalysis.professionalRecommendations.map((rec: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-indigo-500">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 향후 개선 방향 */}
          {comprehensiveAssessment.improvementPlan && (
            <div className="mb-6">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                향후 개선 방향
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {comprehensiveAssessment.improvementPlan.shortTermGoals && comprehensiveAssessment.improvementPlan.shortTermGoals.length > 0 && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h5 className="font-medium text-green-800 mb-2">단기 목표 (1-4주)</h5>
                    <ul className="text-sm text-green-700 space-y-1">
                      {comprehensiveAssessment.improvementPlan.shortTermGoals.map((goal: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Target className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{goal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {comprehensiveAssessment.improvementPlan.longTermGoals && comprehensiveAssessment.improvementPlan.longTermGoals.length > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h5 className="font-medium text-blue-800 mb-2">장기 목표 (3-6개월)</h5>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {comprehensiveAssessment.improvementPlan.longTermGoals.map((goal: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <TrendingUp className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>{goal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              {comprehensiveAssessment.improvementPlan.actionItems && comprehensiveAssessment.improvementPlan.actionItems.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <h5 className="font-medium text-yellow-800 mb-2">구체적 실행 계획</h5>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {comprehensiveAssessment.improvementPlan.actionItems.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {comprehensiveAssessment.improvementPlan.monitoringPlan && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h5 className="font-medium text-gray-800 mb-2">모니터링 계획</h5>
                  <p className="text-sm text-gray-700">{comprehensiveAssessment.improvementPlan.monitoringPlan}</p>
                </div>
              )}
            </div>
          )}

          {/* 위험도 평가 */}
          {comprehensiveAssessment.riskAssessment && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h4 className="font-medium text-orange-800 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                위험도 평가
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-orange-700">위험 수준:</span>
                  <Badge className={
                    comprehensiveAssessment.riskAssessment.level === 'high' ? 'bg-red-100 text-red-800' :
                    comprehensiveAssessment.riskAssessment.level === 'moderate' ? 'bg-orange-100 text-orange-800' :
                    'bg-green-100 text-green-800'
                  }>
                    {comprehensiveAssessment.riskAssessment.level === 'high' ? '높음' :
                     comprehensiveAssessment.riskAssessment.level === 'moderate' ? '중간' : '낮음'}
                  </Badge>
                </div>
                
                {comprehensiveAssessment.riskAssessment.factors && comprehensiveAssessment.riskAssessment.factors.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-orange-800 mb-1">위험 요소:</p>
                    <ul className="text-sm text-orange-700 space-y-1">
                      {comprehensiveAssessment.riskAssessment.factors.map((factor: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <AlertCircle className="w-3 h-3 text-orange-600 mt-0.5 flex-shrink-0" />
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {comprehensiveAssessment.riskAssessment.preventiveMeasures && comprehensiveAssessment.riskAssessment.preventiveMeasures.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-orange-800 mb-1">예방 조치:</p>
                    <ul className="text-sm text-orange-700 space-y-1">
                      {comprehensiveAssessment.riskAssessment.preventiveMeasures.map((measure: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Shield className="w-3 h-3 text-orange-600 mt-0.5 flex-shrink-0" />
                          <span>{measure}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 임상 권장사항 */}
          {comprehensiveAssessment.clinicalRecommendation && (
            <div className="p-4 bg-gray-50 border-l-4 border-gray-400 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">임상 권장사항</h4>
              <p className="text-sm text-gray-700">{comprehensiveAssessment.clinicalRecommendation}</p>
            </div>
          )}
        </Card>
      )}

      {/* 메타데이터 */}
      <div className="text-xs text-gray-500 text-center">
        분석 일시: {new Date(metadata.analysisTimestamp).toLocaleString('ko-KR')} | 
        처리 시간: {(metadata.analysisEngine?.processingTime / 1000).toFixed(1)}초 | 
        엔진 버전: v{metadata.analysisEngine?.version}
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