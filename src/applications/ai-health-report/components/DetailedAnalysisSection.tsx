import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { 
  Users, 
  Briefcase, 
  Zap, 
  Target, 
  TrendingUp, 
  Loader2 
} from 'lucide-react';
import { AIAnalysisMarkdownRenderer } from './AIAnalysisMarkdownRenderer';
import ScoreDistributionBar from './ScoreDistributionBar';
import MetricChart from './MetricChart';

// 타입 정의
interface MetricData {
  id: string;
  title: string;
  subtitle: string;
  value: number;
  normalRange: { min: number; max: number };
  unit?: string;
  status: 'low' | 'normal' | 'high';
  normalRangeText: string;
  currentState: string;
  interpretation: string;
  customLabels?: { low: string; normal: string; high: string };
}

interface PersonalizedAnalysis {
  ageGenderAnalysis: string;
  occupationalAnalysis: string;
  loading?: boolean;
}

interface ComprehensiveAnalysis {
  interpretation: string;
  loading?: boolean;
}

interface Recommendations {
  immediate?: string[];
  shortTerm?: string[];
  longTerm?: string[];
}

interface PersonalInfo {
  age: number;
  gender: 'male' | 'female' | 'other' | '';
  occupation: string;
}

interface DetailedAnalysisSectionProps {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  analysisData: {
    score: number;
    status: string;
    analysis?: string;
    keyMetrics?: any;
  };
  comprehensiveAnalysis?: ComprehensiveAnalysis;
  personalizedAnalysis?: PersonalizedAnalysis;
  detailedMetrics?: MetricData[];
  recommendations?: Recommendations;
  personalInfo?: PersonalInfo;
  measurementData?: any;
  showPersonalizedAnalysis?: boolean;
  showDetailedMetrics?: boolean;
  showRecommendations?: boolean;
}

const DetailedAnalysisSection: React.FC<DetailedAnalysisSectionProps> = ({
  title,
  icon,
  iconColor,
  analysisData,
  comprehensiveAnalysis,
  personalizedAnalysis,
  detailedMetrics = [],
  recommendations,
  personalInfo,
  measurementData,
  showPersonalizedAnalysis = true,
  showDetailedMetrics = true,
  showRecommendations = true
}) => {
  // 점수 배지 색상 결정
  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-700 border-green-300';
    if (score >= 60) return 'bg-blue-100 text-blue-700 border-blue-300';
    if (score >= 40) return 'bg-orange-100 text-orange-700 border-orange-300';
    return 'bg-red-100 text-red-700 border-red-300';
  };

  // 직업 라벨 변환
  const getOccupationLabel = (occupation: string) => {
    const labels: { [key: string]: string } = {
      'teacher': '교사',
      'military_medic': '의무병사',
      'military_career': '직업군인',
      'elementary': '초등학생',
      'middle_school': '중학생',
      'high_school': '고등학생',
      'university': '대학생',
      'housewife': '전업주부',
      'parent': '학부모',
      'firefighter': '소방공무원',
      'police': '경찰공무원',
      'developer': '개발자',
      'designer': '디자이너',
      'office_worker': '일반 사무직',
      'manager': '관리자',
      'general_worker': '일반 직장인',
      'entrepreneur': '사업가',
      'other': '그외'
    };
    return labels[occupation] || occupation;
  };

  // 메트릭 카드 배경색 결정
  const getMetricCardBackgroundClass = (status: 'low' | 'normal' | 'high') => {
    switch (status) {
      case 'normal':
        return 'bg-white border-gray-200';
      case 'low':
        return 'bg-yellow-50 border-yellow-200';
      case 'high':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  // 메트릭 배지 색상 결정
  const getMetricBadgeColor = (status: 'low' | 'normal' | 'high') => {
    switch (status) {
      case 'normal':
        return 'border-green-300 text-green-700 bg-green-50';
      case 'low':
        return 'border-yellow-300 text-yellow-700 bg-yellow-50';
      case 'high':
        return 'border-red-300 text-red-700 bg-red-50';
      default:
        return 'border-gray-300 text-gray-700 bg-gray-50';
    }
  };

  return (
    <Card className="bg-gray-50 border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <span className={iconColor}>{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        
        {/* 1. 종합 해석 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            {title.includes('뇌파') ? '뇌파 분석 종합 해석' : 
             title.includes('신체') ? '신체건강 종합 해석' : 
             title.includes('스트레스') ? '스트레스 종합 해석' : '종합 해석'}
          </h3>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-medium mb-1" style={{ color: iconColor.replace('text-', '') }}>
                  {title.includes('뇌파') ? '뇌파 기반 정신건강 점수' : 
                   title.includes('신체') ? '신체건강 점수' : 
                   title.includes('스트레스') ? '스트레스 점수' : '분석 점수'}
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {analysisData.score}점
                </div>
              </div>
              <div>
                <Badge className={getScoreBadgeColor(analysisData.score)}>
                  {analysisData.status}
                </Badge>
              </div>
            </div>
            
            {/* 점수 분포 표시 */}
            <ScoreDistributionBar 
              score={analysisData.score} 
              label={title.includes('뇌파') ? '정신건강 점수' : 
                     title.includes('신체') ? '신체건강 점수' : 
                     title.includes('스트레스') ? '스트레스 점수' : '분석 점수'}
            />
            
            <div className="mt-4 prose prose-sm max-w-none prose-gray">
              <h4 className="text-base font-semibold text-gray-900 mb-2">해석</h4>
              {comprehensiveAnalysis?.loading ? (
                <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                  <span className="text-sm text-gray-600">종합 해석을 분석하고 있습니다...</span>
                </div>
              ) : (
                <AIAnalysisMarkdownRenderer 
                  content={comprehensiveAnalysis?.interpretation || analysisData.analysis || '분석 결과가 없습니다.'} 
                />
              )}
            </div>
          </div>
        </div>

        {/* 2. 개인화된 분석 평가 */}
        {showPersonalizedAnalysis && personalizedAnalysis && personalInfo && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              개인화된 {title.includes('뇌파') ? '뇌파 분석' : 
                       title.includes('신체') ? '신체건강' : 
                       title.includes('스트레스') ? '스트레스' : '분석'} 평가
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 연령별/성별별 특성분석 */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  연령별/성별별 특성분석
                </h4>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>연령대:</span>
                    <span className="font-medium">{personalInfo.age}세</span>
                  </div>
                  <div className="flex justify-between">
                    <span>성별:</span>
                    <span className="font-medium">{personalInfo.gender === 'male' ? '남성' : '여성'}</span>
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    {personalizedAnalysis.loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                        <span className="text-sm text-blue-800">분석 중...</span>
                      </div>
                    ) : (
                      <p className="text-sm text-blue-800">
                        {personalizedAnalysis.ageGenderAnalysis}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 직업적 특성 분석 */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-green-600" />
                  직업적 특성 분석
                </h4>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>직업:</span>
                    <span className="font-medium">{getOccupationLabel(personalInfo.occupation)}</span>
                  </div>
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    {personalizedAnalysis.loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin text-green-600" />
                        <span className="text-sm text-green-800">분석 중...</span>
                      </div>
                    ) : (
                      <p className="text-sm text-green-800">
                        {personalizedAnalysis.occupationalAnalysis}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. 지표 상세 해석 */}
        {showDetailedMetrics && detailedMetrics.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              {title.includes('뇌파') ? '뇌파 지표 상세 해석' : 
               title.includes('신체') ? '신체건강 지표 상세 해석' : 
               title.includes('스트레스') ? '스트레스 지표 상세 해석' : '지표 상세 해석'}
            </h3>
            
            {/* 2x3 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {detailedMetrics.map((metric) => (
                <Card key={metric.id} className={`${getMetricCardBackgroundClass(metric.status)} shadow-sm`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base font-semibold text-gray-900">
                          {metric.title}
                        </CardTitle>
                        <p className="text-sm text-gray-500">{metric.subtitle}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {metric.value.toFixed(metric.value < 10 ? 2 : 1)}
                          {metric.unit && <span className="text-sm text-gray-500 ml-1">{metric.unit}</span>}
                        </div>
                        <Badge variant="outline" className={getMetricBadgeColor(metric.status)}>
                          {metric.currentState}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      {/* 왼쪽: 그래프 */}
                      <div className="flex-shrink-0">
                        <MetricChart
                          value={metric.value}
                          normalRange={metric.normalRange}
                          label={metric.title}
                          unit={metric.unit}
                          status={metric.status}
                          customLabels={metric.customLabels}
                        />
                      </div>
                      
                      {/* 오른쪽: 설명 */}
                      <div className="flex-1 space-y-3">
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-1">정상 범위</h5>
                          <p className="text-sm text-gray-600">{metric.normalRangeText}</p>
                        </div>
                        
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-1">현재 상태</h5>
                          <p className="text-sm text-gray-600">{metric.currentState}</p>
                        </div>
                        
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-1">해석</h5>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {metric.interpretation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 4. 권장 사항 및 개선 방향 */}
        {showRecommendations && recommendations && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              권장 사항 및 개선 방향
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              {/* 즉시 실행 가능한 조치 */}
              {recommendations.immediate && recommendations.immediate.length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-red-600" />
                    즉시 실행 가능한 조치
                  </h4>
                  <ul className="space-y-2">
                    {recommendations.immediate.map((action, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* 단기 목표 (1-4주) */}
              {recommendations.shortTerm && recommendations.shortTerm.length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    단기 목표 (1-4주)
                  </h4>
                  <ul className="space-y-2">
                    {recommendations.shortTerm.map((goal, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{goal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* 장기 전략 (1-6개월) */}
              {recommendations.longTerm && recommendations.longTerm.length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    장기 전략 (1-6개월)
                  </h4>
                  <ul className="space-y-2">
                    {recommendations.longTerm.map((strategy, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-purple-500 mt-1">•</span>
                        <span>{strategy}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
};

export default DetailedAnalysisSection; 