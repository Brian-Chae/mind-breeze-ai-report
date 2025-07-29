import React from 'react';
import { Brain, Activity, AlertCircle, CheckCircle, Info, TrendingUp, Heart, BrainCircuit, Zap, BarChart3, HelpCircle, Target, Smile, Focus, Shield } from 'lucide-react';
import { Card } from '@ui/card';
import { Badge } from '@ui/badge';
import { Progress } from '@ui/progress';

/**
 * EEG Advanced Gemini 엔진용 React 렌더러
 * 상세한 EEG 분석 결과를 React 컴포넌트로 시각화
 */

interface EEGAdvancedReportProps {
  report: any;
}

export const EEGAdvancedReportComponent: React.FC<EEGAdvancedReportProps> = ({ report }) => {
  const analysisData = report.analysisResult || {};
  
  // 새로운 4대 지표 구조 지원
  const fourDimensionAnalysis = analysisData.fourDimensionAnalysis || {};
  const hasNewStructure = Object.keys(fourDimensionAnalysis).length > 0;
  
  // 기존 구조 호환성
  const analysisResults = analysisData.analysisResults || [];
  const detailedAnalysis = analysisData.detailedDataAnalysis || {};
  const comprehensiveAssessment = analysisData.comprehensiveAssessment || {};
  const metadata = analysisData.metadata || {};

  const getIconForAnalysis = (title: string): React.ReactElement => {
    if (title.includes('스트레스') || title.includes('stress')) {
      return <Heart className="w-5 h-5 text-red-500" />;
    } else if (title.includes('집중') || title.includes('focus')) {
      return <Activity className="w-5 h-5 text-blue-500" />;
    } else if (title.includes('인지') || title.includes('cognitive')) {
      return <BrainCircuit className="w-5 h-5 text-purple-500" />;
    } else if (title.includes('균형') || title.includes('balance')) {
      return <TrendingUp className="w-5 h-5 text-green-500" />;
    }
    return <Brain className="w-5 h-5 text-gray-500" />;
  };

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
    if (dimension.includes('각성') || dimension.includes('arousal')) {
      return <Zap className="w-5 h-5 text-yellow-500" />;
    } else if (dimension.includes('감정균형도') || dimension.includes('정서가') || dimension.includes('valence')) {
      return <Smile className="w-5 h-5 text-green-500" />;
    } else if (dimension.includes('집중') || dimension.includes('focus')) {
      return <Target className="w-5 h-5 text-blue-500" />;
    } else if (dimension.includes('스트레스') || dimension.includes('stress')) {
      return <Shield className="w-5 h-5 text-red-500" />;
    }
    return <Brain className="w-5 h-5 text-gray-500" />;
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

  const formatBandName = (band: string): string => {
    const bandNameMap: Record<string, string> = {
      frontalNeuroActivity: '전두엽 신경활성도',
      totalPower: '총 전력', // 기존 호환성
      delta: 'Delta',
      theta: 'Theta', 
      alpha: 'Alpha',
      beta: 'Beta',
      gamma: 'Gamma'
    };
    return bandNameMap[band] || band;
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">EEG 고급 뇌파 분석 결과</h2>
              <p className="text-gray-600 mt-1">
                {metadata.personalInfo?.age}세 {metadata.personalInfo?.gender === 'male' ? '남성' : '여성'} 
                {metadata.personalInfo?.occupation && `, ${metadata.personalInfo.occupation}`}
              </p>
            </div>
          </div>
          <Badge className="bg-purple-600 text-white">
            신호 품질: {(metadata.dataQuality?.signalQuality * 100 || 0).toFixed(0)}%
          </Badge>
        </div>
      </div>

      {/* 4대 뇌파 분석 지표 카드 (새로운 구조) */}
      {hasNewStructure && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(fourDimensionAnalysis).map(([key, dimension]: [string, any]) => (
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
                      <div className="text-2xl font-bold text-blue-600">{dimension.score}</div>
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

      {/* 기존 구조 호환성: 주요 분석 결과 카드 */}
      {!hasNewStructure && analysisResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysisResults.map((result: any, index: number) => (
            <Card key={index} className="p-5">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getIconForAnalysis(result.coreOpinion.title)}
                    <h3 className="font-semibold text-lg">{result.coreOpinion.title}</h3>
                  </div>
                  <Badge className={getSignificanceColor(result.coreOpinion.clinicalSignificance)}>
                    {getSignificanceLabel(result.coreOpinion.clinicalSignificance)}
                  </Badge>
                </div>
                
                <p className="text-gray-700">{result.coreOpinion.summary}</p>
                
                {result.coreOpinion.evidence && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>근거:</strong> {result.coreOpinion.evidence}
                    </p>
                  </div>
                )}
                
                {result.coreOpinion.urgentAction && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-sm text-red-800">{result.coreOpinion.urgentAction}</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Band Power 분석 */}
      {detailedAnalysis.bandPowerAnalysis && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            주파수 대역별 분석
          </h3>
          <div className="space-y-4">
            {Object.entries(detailedAnalysis.bandPowerAnalysis).map(([band, analysis]: [string, any]) => (
              <div key={band} className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium">{formatBandName(band)}{!['frontalNeuroActivity', 'totalPower'].includes(band) ? ' 파' : ''}</h4>
                <p className="text-sm text-gray-700 mt-1">{analysis.interpretation}</p>
                <p className="text-xs text-gray-500 mt-1">{analysis.evidence}</p>
                {analysis.clinicalSignificance && (
                  <p className="text-sm text-blue-600 mt-1">
                    임상적 의미: {analysis.clinicalSignificance}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* EEG 지수 분석 */}
      {detailedAnalysis.eegIndicesAnalysis && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-purple-600" />
            뇌파 지수 분석
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(detailedAnalysis.eegIndicesAnalysis).map(([index, analysis]: [string, any]) => (
              <div key={index} className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium capitalize mb-2">{formatIndexName(index)}</h4>
                <p className="text-sm text-gray-700">{analysis.interpretation}</p>
                <p className="text-xs text-gray-500 mt-2">{analysis.evidence}</p>
                
                {analysis.recommendations && analysis.recommendations.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-purple-700 mb-1">권장사항:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {analysis.recommendations.map((rec: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-purple-500">•</span>
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

      {/* 인지 상태 종합 분석 */}
      {detailedAnalysis.cognitiveStateAnalysis && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            인지 상태 종합 분석
          </h3>
          <div className="space-y-3">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">전반적 평가</h4>
              <p className="text-gray-700">{detailedAnalysis.cognitiveStateAnalysis.overallAssessment}</p>
            </div>
            
            {detailedAnalysis.cognitiveStateAnalysis.attentionPatterns && (
              <div>
                <h4 className="font-medium text-sm mb-1">주의력 패턴</h4>
                <p className="text-sm text-gray-600">{detailedAnalysis.cognitiveStateAnalysis.attentionPatterns}</p>
              </div>
            )}
            
            {detailedAnalysis.cognitiveStateAnalysis.mentalFatigue && (
              <div>
                <h4 className="font-medium text-sm mb-1">정신적 피로도</h4>
                <p className="text-sm text-gray-600">{detailedAnalysis.cognitiveStateAnalysis.mentalFatigue}</p>
              </div>
            )}
            
            {detailedAnalysis.cognitiveStateAnalysis.neurologicalIndicators && (
              <div>
                <h4 className="font-medium text-sm mb-1">신경학적 지표</h4>
                <p className="text-sm text-gray-600">{detailedAnalysis.cognitiveStateAnalysis.neurologicalIndicators}</p>
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
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">전체 요약</h4>
              <p className="text-blue-700">{comprehensiveAssessment.overallSummary}</p>
              {comprehensiveAssessment.overallScore && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-blue-700">종합 점수</span>
                    <span className="text-lg font-bold text-blue-800">{comprehensiveAssessment.overallScore}점</span>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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