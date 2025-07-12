import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card';
import { 
  CheckCircle,
  Target,
  TrendingUp,
  Briefcase,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { StoredReport } from '../../services/ReportStorage';
import { AIAnalysisMarkdownRenderer } from '../AIAnalysisMarkdownRenderer';

interface PersonalizedRecommendationsReportProps {
  report: StoredReport;
  analysisResult: any;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

const PersonalizedRecommendationsReport: React.FC<PersonalizedRecommendationsReportProps> = ({
  report,
  analysisResult,
  isExpanded,
  onToggleExpanded
}) => {
  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-200"
        onClick={onToggleExpanded}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
              <span className="text-yellow-600 font-semibold text-sm">5</span>
            </div>
            <div>
              <CardTitle className="text-lg text-gray-900">맞춤형 추천사항</CardTitle>
              <CardDescription className="text-gray-600">
                개인 맞춤형 건강 관리 가이드
              </CardDescription>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="p-6 bg-white">
          {analysisResult.personalizedRecommendations ? (
            <div className="space-y-6">
              {/* 즉시 실행 가능한 조치 */}
              <Card className="bg-gray-50 border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    즉시 실행 가능한 조치
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-blue-600 mb-2">생활습관</h4>
                    <div className="prose prose-sm max-w-none prose-gray">
                      <AIAnalysisMarkdownRenderer 
                        content={analysisResult.personalizedRecommendations.immediate.lifestyle.join('\n\n')}
                        variant="compact"
                      />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-green-600 mb-2">운동</h4>
                    <div className="prose prose-sm max-w-none prose-gray">
                      <AIAnalysisMarkdownRenderer 
                        content={analysisResult.personalizedRecommendations.immediate.exercise.join('\n\n')}
                        variant="compact"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 단기 목표 */}
              <Card className="bg-gray-50 border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Target className="w-5 h-5 text-orange-600" />
                    단기 목표 (1-4주)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-blue-600 mb-2">생활습관</h4>
                    <div className="prose prose-sm max-w-none prose-gray">
                      <AIAnalysisMarkdownRenderer 
                        content={analysisResult.personalizedRecommendations.shortTerm.lifestyle.join('\n\n')}
                        variant="compact"
                      />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-orange-600 mb-2">스트레스 관리</h4>
                    <div className="prose prose-sm max-w-none prose-gray">
                      <AIAnalysisMarkdownRenderer 
                        content={analysisResult.personalizedRecommendations.shortTerm.stressManagement.join('\n\n')}
                        variant="compact"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 장기 목표 */}
              <Card className="bg-gray-50 border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    장기 목표 (1-3개월)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-purple-600 mb-2">정신건강 관리</h4>
                    <div className="prose prose-sm max-w-none prose-gray">
                      <AIAnalysisMarkdownRenderer 
                        content={analysisResult.personalizedRecommendations.longTerm.mentalCare.join('\n\n')}
                        variant="compact"
                      />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-pink-600 mb-2">사회적 지원</h4>
                    <div className="prose prose-sm max-w-none prose-gray">
                      <AIAnalysisMarkdownRenderer 
                        content={analysisResult.personalizedRecommendations.longTerm.socialSupport.join('\n\n')}
                        variant="compact"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 직업별 특화 추천 */}
              <Card className="bg-gray-50 border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Briefcase className="w-5 h-5 text-teal-600" />
                    직업별 특화 추천
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-indigo-600 mb-2">직장 전략</h4>
                    <div className="prose prose-sm max-w-none prose-gray">
                      <AIAnalysisMarkdownRenderer 
                        content={analysisResult.personalizedRecommendations.occupationSpecific.workplaceStrategies.join('\n\n')}
                        variant="compact"
                      />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-teal-600 mb-2">시간 관리</h4>
                    <div className="prose prose-sm max-w-none prose-gray">
                      <AIAnalysisMarkdownRenderer 
                        content={analysisResult.personalizedRecommendations.occupationSpecific.timeManagement.join('\n\n')}
                        variant="compact"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none prose-gray">
              <AIAnalysisMarkdownRenderer 
                content="추천사항이 없습니다."
                variant="compact"
              />
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default PersonalizedRecommendationsReport; 