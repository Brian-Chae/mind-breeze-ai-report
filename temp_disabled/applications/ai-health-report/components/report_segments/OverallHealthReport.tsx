import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { 
  ChevronDown,
  ChevronUp,
  Activity,
  BarChart3,
  FileText
} from 'lucide-react';
import { StoredReport } from '../../services/ReportStorage';
import { AIAnalysisMarkdownRenderer } from '../AIAnalysisMarkdownRenderer';

interface OverallHealthReportProps {
  report: StoredReport;
  analysisResult: any;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  EEGMetricChart: React.ComponentType<{
    value: number;
    normalRange: { min: number; max: number };
    label: string;
    unit?: string;
    status: 'low' | 'normal' | 'high';
    customLabels?: { low: string; normal: string; high: string };
  }>;
}

const OverallHealthReport: React.FC<OverallHealthReportProps> = ({
  report,
  analysisResult,
  isExpanded,
  onToggleExpanded,
  EEGMetricChart
}) => {
  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-200"
        onClick={onToggleExpanded}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">1</span>
            </div>
            <div>
              <CardTitle className="text-lg text-gray-900">전체 건강 개요</CardTitle>
              <CardDescription className="text-gray-600">
                종합 건강 점수 및 개인 정보
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
          <div className="space-y-6">
            {/* 종합 건강 현황 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 왼쪽: 종합 건강 점수 */}
              <Card className="bg-gray-50 border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 justify-center">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                    종합 건강 점수
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center space-y-4">
                  {/* EEGMetricChart 형태의 게이지 차트 */}
                  <div className="flex justify-center">
                    <div className="w-96 h-96">
                      <EEGMetricChart
                        value={analysisResult.overallHealth.score}
                        normalRange={{ min: 70, max: 100 }}
                        label="종합 건강 점수"
                        unit=""
                        status={
                          analysisResult.overallHealth.score >= 80 ? 'normal' :
                          analysisResult.overallHealth.score >= 60 ? 'high' : 'low'
                        }
                        customLabels={{
                          low: '주의',
                          high: '보통', 
                          normal: '양호'
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 오른쪽: 건강 요소별 현황 */}
              <Card className="bg-gray-50 border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Activity className="w-5 h-5 text-blue-600" />
                    건강 요소별 현황
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* 뇌파 건강도 */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">뇌파 건강도</span>
                        <Badge className={`text-xs px-2 py-1 ${
                          (analysisResult.detailedAnalysis?.mentalHealth?.score || 78) >= 80 ? 'bg-green-100 text-green-800' :
                          (analysisResult.detailedAnalysis?.mentalHealth?.score || 78) >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {(analysisResult.detailedAnalysis?.mentalHealth?.score || 78) >= 80 ? '양호' :
                           (analysisResult.detailedAnalysis?.mentalHealth?.score || 78) >= 70 ? '보통' : '주의'}
                        </Badge>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {analysisResult.detailedAnalysis?.mentalHealth?.score || 78}/100
                      </span>
                    </div>
                    <div className="relative">
                      {/* 배경 영역 표시 (주의-보통-양호 순서) */}
                      <div className="flex w-full h-3 rounded-full overflow-hidden">
                        <div className="w-[70%] bg-red-200"></div>
                        <div className="w-[10%] bg-yellow-200"></div>
                        <div className="w-[20%] bg-green-200"></div>
                      </div>
                      {/* 마커 */}
                      <div 
                        className="absolute top-0 h-3 w-1 bg-gray-800 rounded-full"
                        style={{ left: `${analysisResult.detailedAnalysis?.mentalHealth?.score || 78}%`, transform: 'translateX(-50%)' }}
                      />
                      {/* 영역 구분선 */}
                      <div className="absolute top-0 h-3 w-0.5 bg-white" style={{ left: '70%' }}></div>
                      <div className="absolute top-0 h-3 w-0.5 bg-white" style={{ left: '80%' }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>주의</span>
                      <span>보통</span>
                      <span>양호</span>
                    </div>
                  </div>

                  {/* 맥파 건강도 */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">맥파 건강도</span>
                        <Badge className={`text-xs px-2 py-1 ${
                          (analysisResult.detailedAnalysis?.physicalHealth?.score || 82) >= 80 ? 'bg-green-100 text-green-800' :
                          (analysisResult.detailedAnalysis?.physicalHealth?.score || 82) >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {(analysisResult.detailedAnalysis?.physicalHealth?.score || 82) >= 80 ? '양호' :
                           (analysisResult.detailedAnalysis?.physicalHealth?.score || 82) >= 70 ? '보통' : '주의'}
                        </Badge>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {analysisResult.detailedAnalysis?.physicalHealth?.score || 82}/100
                      </span>
                    </div>
                    <div className="relative">
                      {/* 배경 영역 표시 (주의-보통-양호 순서) */}
                      <div className="flex w-full h-3 rounded-full overflow-hidden">
                        <div className="w-[70%] bg-red-200"></div>
                        <div className="w-[10%] bg-yellow-200"></div>
                        <div className="w-[20%] bg-green-200"></div>
                      </div>
                      {/* 마커 */}
                      <div 
                        className="absolute top-0 h-3 w-1 bg-gray-800 rounded-full"
                        style={{ left: `${analysisResult.detailedAnalysis?.physicalHealth?.score || 82}%`, transform: 'translateX(-50%)' }}
                      />
                      {/* 영역 구분선 */}
                      <div className="absolute top-0 h-3 w-0.5 bg-white" style={{ left: '70%' }}></div>
                      <div className="absolute top-0 h-3 w-0.5 bg-white" style={{ left: '80%' }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>주의</span>
                      <span>보통</span>
                      <span>양호</span>
                    </div>
                  </div>

                  {/* 우울 */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">우울</span>
                        <Badge className={`text-xs px-2 py-1 ${
                          Math.round(analysisResult.detailedAnalysis?.mentalHealthRisk?.depression?.riskScore || 45) <= 20 ? 'bg-green-100 text-green-800' :
                          Math.round(analysisResult.detailedAnalysis?.mentalHealthRisk?.depression?.riskScore || 45) <= 35 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {Math.round(analysisResult.detailedAnalysis?.mentalHealthRisk?.depression?.riskScore || 45) <= 20 ? '양호' :
                           Math.round(analysisResult.detailedAnalysis?.mentalHealthRisk?.depression?.riskScore || 45) <= 35 ? '보통' : '주의'}
                        </Badge>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {Math.round(analysisResult.detailedAnalysis?.mentalHealthRisk?.depression?.riskScore || 45)}% 위험도
                      </span>
                    </div>
                    <div className="relative">
                      {/* 배경 영역 표시 (위험도 기준: 낮을수록 좋음) */}
                      <div className="flex w-full h-3 rounded-full overflow-hidden">
                        <div className="w-[20%] bg-green-200"></div>
                        <div className="w-[15%] bg-yellow-200"></div>
                        <div className="w-[65%] bg-red-200"></div>
                      </div>
                      {/* 마커 */}
                      <div 
                        className="absolute top-0 h-3 w-1 bg-gray-800 rounded-full"
                        style={{ left: `${Math.round(analysisResult.detailedAnalysis?.mentalHealthRisk?.depression?.riskScore || 45)}%`, transform: 'translateX(-50%)' }}
                      />
                      {/* 영역 구분선 */}
                      <div className="absolute top-0 h-3 w-0.5 bg-white" style={{ left: '20%' }}></div>
                      <div className="absolute top-0 h-3 w-0.5 bg-white" style={{ left: '35%' }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>양호</span>
                      <span>보통</span>
                      <span>주의</span>
                    </div>
                  </div>

                  {/* 집중력 */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">집중력</span>
                        <Badge className={`text-xs px-2 py-1 ${
                          Math.round(analysisResult.detailedAnalysis?.mentalHealthRisk?.adhd?.riskScore || 54) <= 20 ? 'bg-green-100 text-green-800' :
                          Math.round(analysisResult.detailedAnalysis?.mentalHealthRisk?.adhd?.riskScore || 54) <= 35 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {Math.round(analysisResult.detailedAnalysis?.mentalHealthRisk?.adhd?.riskScore || 54) <= 20 ? '양호' :
                           Math.round(analysisResult.detailedAnalysis?.mentalHealthRisk?.adhd?.riskScore || 54) <= 35 ? '보통' : '주의'}
                        </Badge>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {Math.round(analysisResult.detailedAnalysis?.mentalHealthRisk?.adhd?.riskScore || 54)}% 위험도
                      </span>
                    </div>
                    <div className="relative">
                      {/* 배경 영역 표시 (위험도 기준: 낮을수록 좋음) */}
                      <div className="flex w-full h-3 rounded-full overflow-hidden">
                        <div className="w-[20%] bg-green-200"></div>
                        <div className="w-[15%] bg-yellow-200"></div>
                        <div className="w-[65%] bg-red-200"></div>
                      </div>
                      {/* 마커 */}
                      <div 
                        className="absolute top-0 h-3 w-1 bg-gray-800 rounded-full"
                        style={{ left: `${Math.round(analysisResult.detailedAnalysis?.mentalHealthRisk?.adhd?.riskScore || 54)}%`, transform: 'translateX(-50%)' }}
                      />
                      {/* 영역 구분선 */}
                      <div className="absolute top-0 h-3 w-0.5 bg-white" style={{ left: '20%' }}></div>
                      <div className="absolute top-0 h-3 w-0.5 bg-white" style={{ left: '35%' }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>양호</span>
                      <span>보통</span>
                      <span>주의</span>
                    </div>
                  </div>

                  {/* 번아웃 */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">번아웃</span>
                        <Badge className={`text-xs px-2 py-1 ${
                          Math.round(analysisResult.detailedAnalysis?.mentalHealthRisk?.burnout?.riskScore || 36) <= 20 ? 'bg-green-100 text-green-800' :
                          Math.round(analysisResult.detailedAnalysis?.mentalHealthRisk?.burnout?.riskScore || 36) <= 35 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {Math.round(analysisResult.detailedAnalysis?.mentalHealthRisk?.burnout?.riskScore || 36) <= 20 ? '양호' :
                           Math.round(analysisResult.detailedAnalysis?.mentalHealthRisk?.burnout?.riskScore || 36) <= 35 ? '보통' : '주의'}
                        </Badge>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {Math.round(analysisResult.detailedAnalysis?.mentalHealthRisk?.burnout?.riskScore || 36)}% 위험도
                      </span>
                    </div>
                    <div className="relative">
                      {/* 배경 영역 표시 (위험도 기준: 낮을수록 좋음) */}
                      <div className="flex w-full h-3 rounded-full overflow-hidden">
                        <div className="w-[20%] bg-green-200"></div>
                        <div className="w-[15%] bg-yellow-200"></div>
                        <div className="w-[65%] bg-red-200"></div>
                      </div>
                      {/* 마커 */}
                      <div 
                        className="absolute top-0 h-3 w-1 bg-gray-800 rounded-full"
                        style={{ left: `${Math.round(analysisResult.detailedAnalysis?.mentalHealthRisk?.burnout?.riskScore || 36)}%`, transform: 'translateX(-50%)' }}
                      />
                      {/* 영역 구분선 */}
                      <div className="absolute top-0 h-3 w-0.5 bg-white" style={{ left: '20%' }}></div>
                      <div className="absolute top-0 h-3 w-0.5 bg-white" style={{ left: '35%' }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>양호</span>
                      <span>보통</span>
                      <span>주의</span>
                    </div>
                  </div>

                  {/* 충동성 */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">충동성</span>
                        <Badge className={`text-xs px-2 py-1 ${
                          Math.round(analysisResult.detailedAnalysis?.mentalHealthRisk?.impulsivity?.riskScore || 28) <= 20 ? 'bg-green-100 text-green-800' :
                          Math.round(analysisResult.detailedAnalysis?.mentalHealthRisk?.impulsivity?.riskScore || 28) <= 35 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {Math.round(analysisResult.detailedAnalysis?.mentalHealthRisk?.impulsivity?.riskScore || 28) <= 20 ? '양호' :
                           Math.round(analysisResult.detailedAnalysis?.mentalHealthRisk?.impulsivity?.riskScore || 28) <= 35 ? '보통' : '주의'}
                        </Badge>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {Math.round(analysisResult.detailedAnalysis?.mentalHealthRisk?.impulsivity?.riskScore || 28)}% 위험도
                      </span>
                    </div>
                    <div className="relative">
                      {/* 배경 영역 표시 (위험도 기준: 낮을수록 좋음) */}
                      <div className="flex w-full h-3 rounded-full overflow-hidden">
                        <div className="w-[20%] bg-green-200"></div>
                        <div className="w-[15%] bg-yellow-200"></div>
                        <div className="w-[65%] bg-red-200"></div>
                      </div>
                      {/* 마커 */}
                      <div 
                        className="absolute top-0 h-3 w-1 bg-gray-800 rounded-full"
                        style={{ left: `${Math.round(analysisResult.detailedAnalysis?.mentalHealthRisk?.impulsivity?.riskScore || 28)}%`, transform: 'translateX(-50%)' }}
                      />
                      {/* 영역 구분선 */}
                      <div className="absolute top-0 h-3 w-0.5 bg-white" style={{ left: '20%' }}></div>
                      <div className="absolute top-0 h-3 w-0.5 bg-white" style={{ left: '35%' }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>양호</span>
                      <span>보통</span>
                      <span>주의</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 종합 분석 결과 */}
            {analysisResult.overallHealth?.detailedComprehensiveSummary && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  종합 분석 결과
                </h3>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="prose prose-sm max-w-none prose-gray">
                    <AIAnalysisMarkdownRenderer 
                      content={analysisResult.overallHealth.detailedComprehensiveSummary}
                      variant="compact"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default OverallHealthReport; 