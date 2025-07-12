import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { 
  Brain, 
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { StoredReport } from '../../services/ReportStorage';
import { AIAnalysisMarkdownRenderer } from '../AIAnalysisMarkdownRenderer';

interface MentalHealthRiskReportProps {
  report: StoredReport;
  analysisResult: any;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  MentalHealthRiskChart: React.ComponentType<{ value: number; label: string }>;
}

const MentalHealthRiskReport: React.FC<MentalHealthRiskReportProps> = ({
  report,
  analysisResult,
  isExpanded,
  onToggleExpanded,
  MentalHealthRiskChart
}) => {
  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-200"
        onClick={onToggleExpanded}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="text-purple-600 font-semibold text-sm">3</span>
            </div>
            <div>
              <CardTitle className="text-lg text-gray-900">정신 건강 위험도 분석</CardTitle>
              <CardDescription className="text-gray-600">
                우울, ADHD, 번아웃, 충동성 위험도 평가
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
            {/* 종합 위험도 평가 */}
            <Card className="border border-gray-200">
              <CardHeader className="bg-white border-b border-gray-200">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  종합 위험도 평가
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* 전체 위험도 점수 계산 - PDF와 동일한 방식 */}
                  {(() => {
                    const riskData = {
                      depression: analysisResult.detailedAnalysis?.mentalHealthRisk?.depression?.riskScore || 25,
                      adhd: analysisResult.detailedAnalysis?.mentalHealthRisk?.adhd?.riskScore || 30,
                      burnout: analysisResult.detailedAnalysis?.mentalHealthRisk?.burnout?.riskScore || 35,
                      impulsivity: analysisResult.detailedAnalysis?.mentalHealthRisk?.impulsivity?.riskScore || 28
                    };
                    const overallRisk = Math.max(...Object.values(riskData));
                    const riskLevel = overallRisk < 5 ? '위험' : overallRisk < 25 ? '경계' : overallRisk < 75 ? '보통' : overallRisk < 95 ? '양호' : '우수';
                    const riskColor = overallRisk < 5 ? 'text-red-600' : overallRisk < 25 ? 'text-orange-600' : overallRisk < 75 ? 'text-yellow-600' : overallRisk < 95 ? 'text-green-600' : 'text-blue-600';
                    
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">전체 위험도 점수</span>
                          <span className={`text-lg font-bold ${riskColor}`}>
                            {overallRisk.toFixed(1)}/100
                          </span>
                        </div>
                        {/* 개선된 Progress Bar */}
                        <div className="space-y-2">
                          <div className="relative">
                            {/* 전체 구간 색상 표시 (고정) */}
                            <div className="w-full h-4 overflow-hidden bg-gradient-to-r from-red-500 via-orange-400 via-yellow-400 via-green-400 to-blue-500">
                              {/* 구간 경계선 - 5단계 */}
                              <div className="absolute top-0 left-[5%] w-px h-4 bg-white opacity-50"></div>
                              <div className="absolute top-0 left-[25%] w-px h-4 bg-white opacity-50"></div>
                              <div className="absolute top-0 left-[75%] w-px h-4 bg-white opacity-50"></div>
                              <div className="absolute top-0 left-[95%] w-px h-4 bg-white opacity-50"></div>
                            </div>
                            
                            {/* 현재 위치 마커 */}
                            <div 
                              className="absolute top-0 w-1 h-4 bg-gray-900 transition-all duration-500 shadow-lg"
                              style={{ left: `${overallRisk}%`, transform: 'translateX(-50%)' }}
                            />
                            
                            {/* 현재 위치 표시점 */}
                            <div 
                              className="absolute top-1/2 w-3 h-3 bg-white border-2 border-gray-900 transition-all duration-500 shadow-lg"
                              style={{ left: `${overallRisk}%`, transform: 'translate(-50%, -50%)' }}
                            />
                            
                            {/* 점수 및 상태 표시 툴팁 */}
                            <div 
                              className="absolute -top-12 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap transition-all duration-500"
                              style={{ left: `${overallRisk}%`, transform: 'translateX(-50%)' }}
                            >
                              <div className="text-center">
                                <div className="font-bold">{overallRisk.toFixed(1)}점</div>
                                <div className="text-xs opacity-90">
                                  {overallRisk < 5 ? '위험' : overallRisk < 25 ? '경계' : overallRisk < 75 ? '보통' : overallRisk < 95 ? '양호' : '우수'}
                                </div>
                              </div>
                              {/* 화살표 */}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                          
                          {/* 구간 라벨 */}
                          <div className="flex justify-between text-xs text-gray-600 px-1">
                            <span className="text-red-600 font-medium">위험 (0-5)</span>
                            <span className="text-orange-600 font-medium">경계 (5-25)</span>
                            <span className="text-yellow-600 font-medium">보통 (25-75)</span>
                            <span className="text-green-600 font-medium">양호 (75-95)</span>
                            <span className="text-blue-600 font-medium">우수 (95-100)</span>
                          </div>
                        </div>
                        <div className={`text-sm font-medium ${riskColor}`}>
                          위험 수준: {riskLevel}
                        </div>
                        
                        <div className="bg-purple-50 rounded-lg p-3">
                          <h5 className="font-medium text-purple-800 mb-2">🧠 정신건강 전문가 권장사항</h5>
                          <div className="prose prose-sm max-w-none prose-purple mb-3">
                            <AIAnalysisMarkdownRenderer 
                              content="**종합 위험도 평가:** 현재 정신건강 상태는 다각적 모니터링이 필요한 수준입니다. 뇌파(EEG) 및 심혈관(PPG) 바이오마커를 종합하여 개인별 맞춤형 관리 방안을 제시합니다."
                              variant="compact"
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 gap-3 text-sm">
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <div className="font-medium text-blue-800 mb-1">🔵 우울 예방 관리</div>
                              <div className="prose prose-xs max-w-none prose-blue">
                                <AIAnalysisMarkdownRenderer 
                                  content="전두엽 알파 비대칭성과 세타파 활동 패턴을 통한 조기 감지 및 인지행동치료 기반 개입"
                                  variant="compact"
                                />
                              </div>
                            </div>
                            
                            <div className="bg-green-50 p-3 rounded-lg">
                              <div className="font-medium text-green-800 mb-1">🎯 집중력 향상 관리</div>
                              <div className="prose prose-xs max-w-none prose-green">
                                <AIAnalysisMarkdownRenderer 
                                  content="주의집중 지수와 과활성 지수 최적화를 통한 실행기능 강화 및 자기조절능력 향상"
                                  variant="compact"
                                />
                              </div>
                            </div>
                            
                            <div className="bg-orange-50 p-3 rounded-lg">
                              <div className="font-medium text-orange-800 mb-1">🔥 번아웃 예방 관리</div>
                              <div className="prose prose-xs max-w-none prose-orange">
                                <AIAnalysisMarkdownRenderer 
                                  content="스트레스 호르몬 조절과 회복탄력성 강화를 통한 만성 피로 및 정서적 소진 예방"
                                  variant="compact"
                                />
                              </div>
                            </div>
                            
                            <div className="bg-purple-50 p-3 rounded-lg">
                              <div className="font-medium text-purple-800 mb-1">⚡ 충동성 조절 관리</div>
                              <div className="prose prose-xs max-w-none prose-purple">
                                <AIAnalysisMarkdownRenderer 
                                  content="전전두피질 활성화 훈련과 억제 조절 능력 향상을 통한 행동 조절력 강화"
                                  variant="compact"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* 개별 위험도 분석 - 2x2 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 우울 위험도 */}
              {analysisResult.detailedAnalysis?.mentalHealthRisk?.depression && (
                <Card className={`${
                  analysisResult.detailedAnalysis.mentalHealthRisk.depression.riskScore > 50 
                    ? 'bg-red-50 border-red-200' 
                    : analysisResult.detailedAnalysis.mentalHealthRisk.depression.riskScore > 30 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-white border-gray-200'
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className={`flex items-center gap-2 ${
                          analysisResult.detailedAnalysis.mentalHealthRisk.depression.riskScore > 50 
                            ? 'text-red-900' 
                            : analysisResult.detailedAnalysis.mentalHealthRisk.depression.riskScore > 30 
                            ? 'text-yellow-900' 
                            : 'text-gray-900'
                        }`}>
                          <Brain className={`w-5 h-5 ${
                            analysisResult.detailedAnalysis.mentalHealthRisk.depression.riskScore > 50 
                              ? 'text-red-600' 
                              : analysisResult.detailedAnalysis.mentalHealthRisk.depression.riskScore > 30 
                              ? 'text-yellow-600' 
                              : 'text-gray-600'
                          }`} />
                          우울 위험도 분석
                        </CardTitle>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {Math.round(analysisResult.detailedAnalysis.mentalHealthRisk.depression.riskScore)}/100
                        </div>
                        <Badge 
                          variant="outline" 
                          className={
                            analysisResult.detailedAnalysis.mentalHealthRisk.depression.riskScore <= 30
                              ? 'border-green-300 text-green-700 bg-green-50' 
                              : analysisResult.detailedAnalysis.mentalHealthRisk.depression.riskScore <= 50
                              ? 'border-yellow-300 text-yellow-700 bg-yellow-50'
                              : 'border-red-300 text-red-700 bg-red-50'
                          }
                        >
                          {analysisResult.detailedAnalysis.mentalHealthRisk.depression.status ||
                          (analysisResult.detailedAnalysis.mentalHealthRisk.depression.riskScore > 50 ? '위험' :
                          analysisResult.detailedAnalysis.mentalHealthRisk.depression.riskScore > 30 ? '경계' : '정상')}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 그래프 */}
                    <div className="flex justify-center">
                      <div className="w-96 h-96">
                        <MentalHealthRiskChart
                          value={analysisResult.detailedAnalysis.mentalHealthRisk.depression.riskScore}
                          label="우울"
                        />
                      </div>
                    </div>
                    
                    {/* 하단: 해석 */}
                    <div className="border-t border-gray-200 pt-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">의학적 해석</h5>
                      <p className="text-sm text-gray-600 leading-relaxed">
                      <AIAnalysisMarkdownRenderer content={analysisResult.detailedAnalysis.mentalHealthRisk.depression.analysis} />
                      </p>
                    </div>
                    
                    {/* 뇌파 기반 바이오마커 평가 */}
                    <div className={`border-t pt-3 ${
                      analysisResult.detailedAnalysis.mentalHealthRisk.depression.riskScore > 50 
                        ? 'border-red-100' 
                        : analysisResult.detailedAnalysis.mentalHealthRisk.depression.riskScore > 30 
                        ? 'border-yellow-100' 
                        : 'border-gray-100'
                    }`}>
                      <h4 className={`text-sm font-medium mb-2 ${
                        analysisResult.detailedAnalysis.mentalHealthRisk.depression.riskScore > 50 
                          ? 'text-red-900' 
                          : analysisResult.detailedAnalysis.mentalHealthRisk.depression.riskScore > 30 
                          ? 'text-yellow-900' 
                          : 'text-gray-900'
                      }`}>뇌파 기반 바이오마커 평가</h4>
                      <div className="prose prose-sm max-w-none prose-gray">
                        <AIAnalysisMarkdownRenderer content={`**전두엽 알파 비대칭:** ${report.measurementData.eegMetrics.hemisphericBalance?.value || -0.04} - 좌우뇌 활성도 균형\n\n**세타파 활동:** ${report.measurementData.eegMetrics.relaxationIndex?.value || 0.2} - 정서 조절 능력\n\n**우울 지수:** ${report.measurementData.eegMetrics.stressIndex?.value > 3.5 ? '높음' : '정상'} - 기분 상태 평가`} />
                      </div>
                    </div>
                    
                    {/* PPG 기반 바이오마커 평가 */}
                    <div className={`border-t pt-3 ${
                      analysisResult.detailedAnalysis.mentalHealthRisk.depression.riskScore > 50 
                        ? 'border-red-100' 
                        : analysisResult.detailedAnalysis.mentalHealthRisk.depression.riskScore > 30 
                        ? 'border-yellow-100' 
                        : 'border-gray-100'
                    }`}>
                      <h4 className={`text-sm font-medium mb-2 ${
                        analysisResult.detailedAnalysis.mentalHealthRisk.depression.riskScore > 50 
                          ? 'text-red-900' 
                          : analysisResult.detailedAnalysis.mentalHealthRisk.depression.riskScore > 30 
                          ? 'text-yellow-900' 
                          : 'text-gray-900'
                      }`}>PPG 기반 바이오마커 평가</h4>
                      <div className="prose prose-sm max-w-none prose-gray">
                        <AIAnalysisMarkdownRenderer content={`**심박변이도(HRV):** ${report.measurementData.ppgMetrics.rmssd?.value < 50 ? '낮음' : '정상'} - 자율신경 활성도\n\n**회복탄력성:** ${report.measurementData.ppgMetrics.rmssd?.value || 120} ms - 스트레스 회복 능력\n\n**우울 관련 생리지표:** ${report.measurementData.ppgMetrics.lfHfRatio?.value > 15 ? '위험' : '정상'} - 자율신경 불균형`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ADHD 위험도 */}
              {analysisResult.detailedAnalysis?.mentalHealthRisk?.adhd && (
                <Card className={`${
                  analysisResult.detailedAnalysis.mentalHealthRisk.adhd.riskScore > 50 
                    ? 'bg-red-50 border-red-200' 
                    : analysisResult.detailedAnalysis.mentalHealthRisk.adhd.riskScore > 30 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-white border-gray-200'
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className={`flex items-center gap-2 ${
                          analysisResult.detailedAnalysis.mentalHealthRisk.adhd.riskScore > 50 
                            ? 'text-red-900' 
                            : analysisResult.detailedAnalysis.mentalHealthRisk.adhd.riskScore > 30 
                            ? 'text-yellow-900' 
                            : 'text-gray-900'
                        }`}>
                          <Brain className={`w-5 h-5 ${
                            analysisResult.detailedAnalysis.mentalHealthRisk.adhd.riskScore > 50 
                              ? 'text-red-600' 
                              : analysisResult.detailedAnalysis.mentalHealthRisk.adhd.riskScore > 30 
                              ? 'text-yellow-600' 
                              : 'text-gray-600'
                          }`} />
                          ADHD 위험도 분석
                        </CardTitle>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {Math.round(analysisResult.detailedAnalysis.mentalHealthRisk.adhd.riskScore)}/100
                        </div>
                        <Badge 
                          variant="outline" 
                          className={
                            analysisResult.detailedAnalysis.mentalHealthRisk.adhd.riskScore <= 30
                              ? 'border-green-300 text-green-700 bg-green-50' 
                              : analysisResult.detailedAnalysis.mentalHealthRisk.adhd.riskScore <= 50
                              ? 'border-yellow-300 text-yellow-700 bg-yellow-50'
                              : 'border-red-300 text-red-700 bg-red-50'
                          }
                        >
                          {analysisResult.detailedAnalysis.mentalHealthRisk.adhd.status ||
                          (analysisResult.detailedAnalysis.mentalHealthRisk.adhd.riskScore > 50 ? '위험' :
                          analysisResult.detailedAnalysis.mentalHealthRisk.adhd.riskScore > 30 ? '경계' : '정상')}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 그래프 */}
                    <div className="flex justify-center">
                      <div className="w-96 h-96">
                        <MentalHealthRiskChart
                          value={analysisResult.detailedAnalysis.mentalHealthRisk.adhd.riskScore}
                          label="ADHD"
                        />
                      </div>
                    </div>
                    
                    {/* 하단: 해석 */}
                    <div className="border-t border-gray-200 pt-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">의학적 해석</h5>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        <AIAnalysisMarkdownRenderer content={analysisResult.detailedAnalysis.mentalHealthRisk.adhd.analysis} />
                      </p>
                    </div>
                    
                    {/* 뇌파 기반 바이오마커 평가 */}
                    <div className={`border-t pt-3 ${
                      analysisResult.detailedAnalysis.mentalHealthRisk.adhd.riskScore > 50 
                        ? 'border-red-100' 
                        : analysisResult.detailedAnalysis.mentalHealthRisk.adhd.riskScore > 30 
                        ? 'border-yellow-100' 
                        : 'border-gray-100'
                    }`}>
                      <h4 className={`text-sm font-medium mb-2 ${
                        analysisResult.detailedAnalysis.mentalHealthRisk.adhd.riskScore > 50 
                          ? 'text-red-900' 
                          : analysisResult.detailedAnalysis.mentalHealthRisk.adhd.riskScore > 30 
                          ? 'text-yellow-900' 
                          : 'text-gray-900'
                      }`}>뇌파 기반 바이오마커 평가</h4>
                      <div className="prose prose-sm max-w-none prose-gray">
                        <AIAnalysisMarkdownRenderer content={`**주의집중 지수:** ${report.measurementData.eegMetrics.focusIndex?.value || 1.8} - 집중 능력 평가\n\n**과활성 지수:** ${report.measurementData.eegMetrics.stressIndex?.value > 3.0 ? '높음' : '정상'} - 충동성 및 과활성\n\n**실행기능 평가:** ${report.measurementData.eegMetrics.hemisphericBalance?.value || -0.04} - 인지적 조절 능력`} />
                      </div>
                    </div>
                    
                    {/* PPG 기반 바이오마커 평가 */}
                    <div className={`border-t pt-3 ${
                      analysisResult.detailedAnalysis.mentalHealthRisk.adhd.riskScore > 50 
                        ? 'border-red-100' 
                        : analysisResult.detailedAnalysis.mentalHealthRisk.adhd.riskScore > 30 
                        ? 'border-yellow-100' 
                        : 'border-gray-100'
                    }`}>
                      <h4 className={`text-sm font-medium mb-2 ${
                        analysisResult.detailedAnalysis.mentalHealthRisk.adhd.riskScore > 50 
                          ? 'text-red-900' 
                          : analysisResult.detailedAnalysis.mentalHealthRisk.adhd.riskScore > 30 
                          ? 'text-yellow-900' 
                          : 'text-gray-900'
                      }`}>PPG 기반 바이오마커 평가</h4>
                      <div className="prose prose-sm max-w-none prose-gray">
                        <AIAnalysisMarkdownRenderer content={`**자율신경 과활성:** ${report.measurementData.ppgMetrics.lfHfRatio?.value > 10 ? '높음' : '정상'} - 각성 상태 평가\n\n**주의력 관련 HRV:** ${report.measurementData.ppgMetrics.sdnn?.value < 50 ? '낮음' : '정상'} - 주의집중 생리지표\n\n**행동조절 능력:** ${report.measurementData.ppgMetrics.rmssd?.value || 120} ms - 충동 억제 능력`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 번아웃 위험도 */}
              {analysisResult.detailedAnalysis?.mentalHealthRisk?.burnout && (
                <Card className={`${
                  analysisResult.detailedAnalysis.mentalHealthRisk.burnout.riskScore > 50 
                    ? 'bg-red-50 border-red-200' 
                    : analysisResult.detailedAnalysis.mentalHealthRisk.burnout.riskScore > 30 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-white border-gray-200'
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className={`flex items-center gap-2 ${
                          analysisResult.detailedAnalysis.mentalHealthRisk.burnout.riskScore > 50 
                            ? 'text-red-900' 
                            : analysisResult.detailedAnalysis.mentalHealthRisk.burnout.riskScore > 30 
                            ? 'text-yellow-900' 
                            : 'text-gray-900'
                        }`}>
                          <Brain className={`w-5 h-5 ${
                            analysisResult.detailedAnalysis.mentalHealthRisk.burnout.riskScore > 50 
                              ? 'text-red-600' 
                              : analysisResult.detailedAnalysis.mentalHealthRisk.burnout.riskScore > 30 
                              ? 'text-yellow-600' 
                              : 'text-gray-600'
                          }`} />
                          번아웃 위험도 분석
                        </CardTitle>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {Math.round(analysisResult.detailedAnalysis.mentalHealthRisk.burnout.riskScore)}/100
                        </div>
                        <Badge 
                          variant="outline" 
                          className={
                            analysisResult.detailedAnalysis.mentalHealthRisk.burnout.riskScore <= 30
                              ? 'border-green-300 text-green-700 bg-green-50' 
                              : analysisResult.detailedAnalysis.mentalHealthRisk.burnout.riskScore <= 50
                              ? 'border-yellow-300 text-yellow-700 bg-yellow-50'
                              : 'border-red-300 text-red-700 bg-red-50'
                          }
                        >
                          {analysisResult.detailedAnalysis.mentalHealthRisk.burnout.status ||
                          (analysisResult.detailedAnalysis.mentalHealthRisk.burnout.riskScore > 50 ? '위험' :
                          analysisResult.detailedAnalysis.mentalHealthRisk.burnout.riskScore > 30 ? '경계' : '정상')}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 그래프 */}
                    <div className="flex justify-center">
                      <div className="w-96 h-96">
                        <MentalHealthRiskChart
                          value={analysisResult.detailedAnalysis.mentalHealthRisk.burnout.riskScore}
                          label="번아웃"
                        />
                      </div>
                    </div>
                    
                    {/* 하단: 해석 */}
                    <div className="border-t border-gray-200 pt-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">의학적 해석</h5>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        <AIAnalysisMarkdownRenderer content={analysisResult.detailedAnalysis.mentalHealthRisk.burnout.analysis} />
                      </p>
                    </div>
                    
                    {/* 뇌파 기반 바이오마커 평가 */}
                    <div className={`border-t pt-3 ${
                      analysisResult.detailedAnalysis.mentalHealthRisk.burnout.riskScore > 50 
                        ? 'border-red-100' 
                        : analysisResult.detailedAnalysis.mentalHealthRisk.burnout.riskScore > 30 
                        ? 'border-yellow-100' 
                        : 'border-gray-100'
                    }`}>
                      <h4 className={`text-sm font-medium mb-2 ${
                        analysisResult.detailedAnalysis.mentalHealthRisk.burnout.riskScore > 50 
                          ? 'text-red-900' 
                          : analysisResult.detailedAnalysis.mentalHealthRisk.burnout.riskScore > 30 
                          ? 'text-yellow-900' 
                          : 'text-gray-900'
                      }`}>뇌파 기반 바이오마커 평가</h4>
                      <div className="prose prose-sm max-w-none prose-gray">
                        <AIAnalysisMarkdownRenderer content={`**만성피로 지수:** ${report.measurementData.eegMetrics.relaxationIndex?.value < 0.15 ? '높음' : '정상'} - 정신적 소진 상태\n\n**회복력 지수:** ${report.measurementData.eegMetrics.relaxationIndex?.value || 0.2} - 스트레스 회복 능력\n\n**정서적 소진도:** ${report.measurementData.eegMetrics.stressIndex?.value > 4.0 ? '높음' : '정상'} - 감정적 고갈 평가`} />
                      </div>
                    </div>
                    
                    {/* PPG 기반 바이오마커 평가 */}
                    <div className={`border-t pt-3 ${
                      analysisResult.detailedAnalysis.mentalHealthRisk.burnout.riskScore > 50 
                        ? 'border-red-100' 
                        : analysisResult.detailedAnalysis.mentalHealthRisk.burnout.riskScore > 30 
                        ? 'border-yellow-100' 
                        : 'border-gray-100'
                    }`}>
                      <h4 className={`text-sm font-medium mb-2 ${
                        analysisResult.detailedAnalysis.mentalHealthRisk.burnout.riskScore > 50 
                          ? 'text-red-900' 
                          : analysisResult.detailedAnalysis.mentalHealthRisk.burnout.riskScore > 30 
                          ? 'text-yellow-900' 
                          : 'text-gray-900'
                      }`}>PPG 기반 바이오마커 평가</h4>
                      <div className="prose prose-sm max-w-none prose-gray">
                        <AIAnalysisMarkdownRenderer content={`**자율신경 소진:** ${report.measurementData.ppgMetrics.sdnn?.value < 40 ? '높음' : '정상'} - 번아웃 관련 생리지표\n\n**회복탄력성:** ${report.measurementData.ppgMetrics.rmssd?.value < 80 ? '낮음' : '정상'} - 만성 피로 대응 능력\n\n**스트레스 호르몬:** ${report.measurementData.ppgMetrics.lfHfRatio?.value > 12 ? '높음' : '정상'} - 코르티솔 관련 지표`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 충동성 위험도 */}
              {analysisResult.detailedAnalysis?.mentalHealthRisk?.impulsivity && (
                <Card className={`${
                  analysisResult.detailedAnalysis.mentalHealthRisk.impulsivity.riskScore > 50 
                    ? 'bg-red-50 border-red-200' 
                    : analysisResult.detailedAnalysis.mentalHealthRisk.impulsivity.riskScore > 30 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-white border-gray-200'
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className={`flex items-center gap-2 ${
                          analysisResult.detailedAnalysis.mentalHealthRisk.impulsivity.riskScore > 50 
                            ? 'text-red-900' 
                            : analysisResult.detailedAnalysis.mentalHealthRisk.impulsivity.riskScore > 30 
                            ? 'text-yellow-900' 
                            : 'text-gray-900'
                        }`}>
                          <Brain className={`w-5 h-5 ${
                            analysisResult.detailedAnalysis.mentalHealthRisk.impulsivity.riskScore > 50 
                              ? 'text-red-600' 
                              : analysisResult.detailedAnalysis.mentalHealthRisk.impulsivity.riskScore > 30 
                              ? 'text-yellow-600' 
                              : 'text-gray-600'
                          }`} />
                          충동성 위험도 분석
                        </CardTitle>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {Math.round(analysisResult.detailedAnalysis.mentalHealthRisk.impulsivity.riskScore)}/100
                        </div>
                        <Badge 
                          variant="outline" 
                          className={
                            analysisResult.detailedAnalysis.mentalHealthRisk.impulsivity.riskScore <= 30
                              ? 'border-green-300 text-green-700 bg-green-50' 
                              : analysisResult.detailedAnalysis.mentalHealthRisk.impulsivity.riskScore <= 50
                              ? 'border-yellow-300 text-yellow-700 bg-yellow-50'
                              : 'border-red-300 text-red-700 bg-red-50'
                          }
                        >
                          {analysisResult.detailedAnalysis.mentalHealthRisk.impulsivity.status ||
                          (analysisResult.detailedAnalysis.mentalHealthRisk.impulsivity.riskScore > 50 ? '위험' :
                          analysisResult.detailedAnalysis.mentalHealthRisk.impulsivity.riskScore > 30 ? '경계' : '정상')}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 그래프 */}
                    <div className="flex justify-center">
                      <div className="w-96 h-96">
                        <MentalHealthRiskChart
                          value={analysisResult.detailedAnalysis.mentalHealthRisk.impulsivity.riskScore}
                          label="충동성"
                        />
                      </div>
                    </div>
                    
                    {/* 하단: 해석 */}
                    <div className="border-t border-gray-200 pt-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">의학적 해석</h5>
                      <p className="text-sm text-gray-600 leading-relaxed">
                      <AIAnalysisMarkdownRenderer content={analysisResult.detailedAnalysis.mentalHealthRisk.impulsivity.analysis} />
                      </p>
                    </div>
                    
                    {/* 뇌파 기반 바이오마커 평가 */}
                    <div className={`border-t pt-3 ${
                      analysisResult.detailedAnalysis.mentalHealthRisk.impulsivity.riskScore > 50 
                        ? 'border-red-100' 
                        : analysisResult.detailedAnalysis.mentalHealthRisk.impulsivity.riskScore > 30 
                        ? 'border-yellow-100' 
                        : 'border-gray-100'
                    }`}>
                      <h4 className={`text-sm font-medium mb-2 ${
                        analysisResult.detailedAnalysis.mentalHealthRisk.impulsivity.riskScore > 50 
                          ? 'text-red-900' 
                          : analysisResult.detailedAnalysis.mentalHealthRisk.impulsivity.riskScore > 30 
                          ? 'text-yellow-900' 
                          : 'text-gray-900'
                      }`}>뇌파 기반 바이오마커 평가</h4>
                      <div className="prose prose-sm max-w-none prose-gray">
                        <AIAnalysisMarkdownRenderer content={`**전전두피질 활성도:** ${report.measurementData.eegMetrics.focusIndex?.value < 1.8 ? '저하' : '정상'} - 억제 조절 능력\n\n**충동 억제 지수:** ${report.measurementData.eegMetrics.hemisphericBalance?.value || -0.04} - 행동 조절 능력 평가\n\n**감정 조절 능력:** ${report.measurementData.eegMetrics.relaxationIndex?.value || 0.2} - 정서적 충동성 관리`} />
                      </div>
                    </div>
                    
                    {/* PPG 기반 바이오마커 평가 */}
                    <div className={`border-t pt-3 ${
                      analysisResult.detailedAnalysis.mentalHealthRisk.impulsivity.riskScore > 50 
                        ? 'border-red-100' 
                        : analysisResult.detailedAnalysis.mentalHealthRisk.impulsivity.riskScore > 30 
                        ? 'border-yellow-100' 
                        : 'border-gray-100'
                    }`}>
                      <h4 className={`text-sm font-medium mb-2 ${
                        analysisResult.detailedAnalysis.mentalHealthRisk.impulsivity.riskScore > 50 
                          ? 'text-red-900' 
                          : analysisResult.detailedAnalysis.mentalHealthRisk.impulsivity.riskScore > 30 
                          ? 'text-yellow-900' 
                          : 'text-gray-900'
                      }`}>PPG 기반 바이오마커 평가</h4>
                      <div className="prose prose-sm max-w-none prose-gray">
                        <AIAnalysisMarkdownRenderer content={`**심박수 변동성:** ${report.measurementData.ppgMetrics.heartRate?.value > 90 ? '높음' : '정상'} - 각성 상태 평가\n\n**교감신경 과활성:** ${report.measurementData.ppgMetrics.lfHfRatio?.value > 12 ? '높음' : '정상'} - 충동적 반응성\n\n**자기조절 능력:** ${report.measurementData.ppgMetrics.rmssd?.value > 150 ? '우수' : '보통'} - 행동 조절력 평가`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 스트레스 위험도 */}
              {analysisResult.detailedAnalysis?.mentalHealthRisk && (
                <Card className={`${
                  75 >= 80 ? 'bg-white border-gray-200' : 75 >= 70 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className={`flex items-center gap-2 ${
                          75 >= 80 ? 'text-gray-900' : 75 >= 70 ? 'text-yellow-900' : 'text-red-900'
                        }`}>
                          <Zap className={`w-5 h-5 ${
                            75 >= 80 ? 'text-gray-600' : 75 >= 70 ? 'text-yellow-600' : 'text-red-600'
                          }`} />
                          스트레스 위험도 분석
                        </CardTitle>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {Math.round(100 - 75)}/100
                        </div>
                        <Badge 
                          variant="outline" 
                          className={
                            75 >= 80
                              ? 'border-green-300 text-green-700 bg-green-50' 
                              : 75 >= 70
                              ? 'border-yellow-300 text-yellow-700 bg-yellow-50'
                              : 'border-red-300 text-red-700 bg-red-50'
                          }
                        >
                          {75 >= 80 ? '정상' : 75 >= 70 ? '경계' : '위험'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 그래프 */}
                    <div className="flex justify-center">
                      <div className="w-96 h-96">
                        <MentalHealthRiskChart
                          value={100 - 75}
                          label="스트레스"
                        />
                      </div>
                    </div>
                    
                    {/* 하단: 해석 */}
                    <div className="border-t border-gray-200 pt-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">의학적 해석</h5>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        <AIAnalysisMarkdownRenderer content="뇌파 스트레스 지수와 자율신경 균형 상태를 종합적으로 분석하여 스트레스 관련 위험도를 평가합니다. 베타파와 감마파의 비율, HRV 지표를 통해 정신적 긴장도와 회복력을 측정합니다." />
                      </p>
                    </div>
                    
                    {/* 뇌파 기반 바이오마커 평가 */}
                    <div className={`border-t pt-3 ${
                      75 >= 80 ? 'border-gray-100' : 75 >= 70 ? 'border-yellow-100' : 'border-red-100'
                    }`}>
                      <h4 className={`text-sm font-medium mb-2 ${
                        75 >= 80 ? 'text-gray-900' : 75 >= 70 ? 'text-yellow-900' : 'text-red-900'
                      }`}>뇌파 기반 바이오마커 평가</h4>
                      <div className="prose prose-sm max-w-none prose-gray">
                        <AIAnalysisMarkdownRenderer content={`**스트레스 지수:** ${report.measurementData.eegMetrics.stressIndex?.value || 3.2} - 만성 스트레스 상태 평가\n\n**피로도 지수:** ${report.measurementData.eegMetrics.relaxationIndex?.value < 0.18 ? '높음' : '정상'} - 정신적 피로 상태\n\n**회복력 지수:** ${report.measurementData.eegMetrics.relaxationIndex?.value || 0.2} - 스트레스 회복 능력 평가`} />
                      </div>
                    </div>
                    
                    {/* PPG 기반 바이오마커 평가 */}
                    <div className={`border-t pt-3 ${
                      75 >= 80 ? 'border-gray-100' : 75 >= 70 ? 'border-yellow-100' : 'border-red-100'
                    }`}>
                      <h4 className={`text-sm font-medium mb-2 ${
                        75 >= 80 ? 'text-gray-900' : 75 >= 70 ? 'text-yellow-900' : 'text-red-900'
                      }`}>PPG 기반 바이오마커 평가</h4>
                      <div className="prose prose-sm max-w-none prose-gray">
                        <AIAnalysisMarkdownRenderer content={`**자율신경 균형:** ${report.measurementData.ppgMetrics.lfHfRatio?.value > 10 ? '높음' : '정상'} - 스트레스 호르몬 활성도\n\n**회복탄력성:** ${report.measurementData.ppgMetrics.rmssd?.value > 100 ? '우수' : '보통'} - 만성 피로 대응 능력\n\n**자율신경 소진도:** ${report.measurementData.ppgMetrics.sdnn?.value < 50 ? '높음' : '정상'} - 번아웃 관련 생리적 지표`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default MentalHealthRiskReport; 