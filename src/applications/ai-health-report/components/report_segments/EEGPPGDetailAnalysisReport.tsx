import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { 
  ChevronDown,
  ChevronUp,
  Brain,
  Heart,
  Users,
  Briefcase,
  Zap,
  Target,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { StoredReport } from '../../services/ReportStorage';
import { AIAnalysisMarkdownRenderer } from '../AIAnalysisMarkdownRenderer';

interface EEGPPGDetailAnalysisReportProps {
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
  getScoreBadgeColor: (score: number) => string;
  getOccupationLabel: (occupation: string) => string;
  ScoreDistributionBar: React.ComponentType<{
    score: number;
    label: string;
    className?: string;
  }>;
  mentalHealthComprehensive: any;
  physicalHealthComprehensive: any;
  loadingComprehensive: boolean;
  preparePPGMetrics: () => any;
  getMetricStatus: (value: number, normalRange: { min: number; max: number }) => 'low' | 'normal' | 'high';
  getEEGCardBackgroundClass: (status: 'low' | 'normal' | 'high') => string;
}

const EEGPPGDetailAnalysisReport: React.FC<EEGPPGDetailAnalysisReportProps> = ({
  report,
  analysisResult,
  isExpanded,
  onToggleExpanded,
  EEGMetricChart,
  getScoreBadgeColor,
  getOccupationLabel,
  ScoreDistributionBar,
  mentalHealthComprehensive,
  physicalHealthComprehensive,
  loadingComprehensive,
  preparePPGMetrics,
  getMetricStatus,
  getEEGCardBackgroundClass
}) => {
  const ppgMetricsArray = preparePPGMetrics();
  
  // 배열을 객체로 변환하여 기존 코드와 호환성 유지
  const ppgMetrics = {
    heartRate: ppgMetricsArray.find((m: any) => m.id === 'heartRate') || { value: 0, normalRange: { min: 60, max: 100 }, status: 'normal' },
    rmssd: ppgMetricsArray.find((m: any) => m.id === 'rmssd') || { value: 0, normalRange: { min: 20, max: 50 }, status: 'normal' },
    sdnn: ppgMetricsArray.find((m: any) => m.id === 'sdnn') || { value: 0, normalRange: { min: 30, max: 100 }, status: 'normal' },
    spo2: ppgMetricsArray.find((m: any) => m.id === 'spo2') || { value: 0, normalRange: { min: 95, max: 100 }, status: 'normal' },
    lfHfRatio: ppgMetricsArray.find((m: any) => m.id === 'lfHfRatio') || { value: 0, normalRange: { min: 1.0, max: 10.0 }, status: 'normal' }
  };

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-200"
        onClick={onToggleExpanded}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-600 font-semibold text-sm">2</span>
            </div>
            <div>
              <CardTitle className="text-lg text-gray-900">상세 분석 결과</CardTitle>
              <CardDescription className="text-gray-600">
                EEG, PPG 생체신호 분석 결과
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
          <div className="space-y-8">
            {/* 기존 분석 결과들 */}
            <div className="grid grid-cols-1 gap-6">
              {/* 정신건강 분석 */}
              {analysisResult.detailedAnalysis?.mentalHealth && (
                <Card className="bg-gray-50 border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <Brain className="w-5 h-5 text-purple-600" />
                      🧠 뇌파 분석 결과
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    
                    {/* 1. 정신 건강 분석 종합 해석 */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                        뇌파 분석 종합 해석
                      </h3>
                      
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="text-sm text-purple-600 font-medium mb-1">
                              뇌파 기반 정신건강 점수
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                              {analysisResult.detailedAnalysis.mentalHealth.score}점
                            </div>
                          </div>
                          <div>
                            <Badge className={getScoreBadgeColor(analysisResult.detailedAnalysis.mentalHealth.score)}>
                              {analysisResult.detailedAnalysis.mentalHealth.status}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* 점수 분포 표시 */}
                        <ScoreDistributionBar 
                          score={analysisResult.detailedAnalysis.mentalHealth.score} 
                          label="정신건강 점수"
                        />
                        
                        <div className="mt-4 prose prose-sm max-w-none prose-gray">
                          <h4 className="text-base font-semibold text-gray-900 mb-2">해석</h4>
                          {loadingComprehensive ? (
                            <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
                              <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                              <span className="text-sm text-gray-600">정신건강 종합 해석을 분석하고 있습니다...</span>
                            </div>
                          ) : mentalHealthComprehensive ? (
                            <AIAnalysisMarkdownRenderer content={mentalHealthComprehensive.comprehensiveInterpretation} />
                          ) : (
                            <AIAnalysisMarkdownRenderer content={
                              `🧠 **뇌 기능 종합 분석**\n\n집중력 지수 ${report.measurementData.eegMetrics.focusIndex?.value?.toFixed(3) || 'N/A'}와 이완도 ${report.measurementData.eegMetrics.relaxationIndex?.value?.toFixed(3) || 'N/A'}는 현재 뇌 기능이 양호하게 유지되고 있음을 보여주나, 스트레스 지수 ${report.measurementData.eegMetrics.stressIndex?.value?.toFixed(3) || 'N/A'}과 인지 부하 ${report.measurementData.eegMetrics.cognitiveLoad?.value?.toFixed(3) || 'N/A'}는 정신적 긴장과 뇌 활동량 증가를 나타냅니다. 정서 안정성 ${report.measurementData.eegMetrics.emotionalStability?.value?.toFixed(3) || 'N/A'}은 감정 조절 능력이 비교적 잘 유지되고 있음을 시사합니다.`
                            } />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 2. 개별 지표 상세 분석 */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                        개별 지표 상세 분석
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 스트레스 지수 */}
                        <div className={`${getEEGCardBackgroundClass(
                          getMetricStatus(
                            report.measurementData.eegMetrics.stressIndex?.value || 0,
                            { min: 0.15, max: 0.25 }
                          )
                        )}`}>
                          <Card className="bg-white border-gray-200">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <CardTitle className="text-base font-semibold text-gray-900">
                                    스트레스 지수
                                  </CardTitle>
                                  <p className="text-sm text-gray-500">Stress Index</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-gray-900">
                                    {report.measurementData.eegMetrics.stressIndex?.value?.toFixed(3) || 'N/A'}
                                  </div>
                                  <Badge 
                                    variant="outline" 
                                    className={
                                      (report.measurementData.eegMetrics.stressIndex?.value || 0) >= 0.15 && 
                                      (report.measurementData.eegMetrics.stressIndex?.value || 0) <= 0.25
                                        ? 'border-green-300 text-green-700 bg-green-50' 
                                        : (report.measurementData.eegMetrics.stressIndex?.value || 0) > 0.25
                                        ? 'border-red-300 text-red-700 bg-red-50'
                                        : 'border-yellow-300 text-yellow-700 bg-yellow-50'
                                    }
                                  >
                                    {(report.measurementData.eegMetrics.stressIndex?.value || 0) >= 0.15 && 
                                     (report.measurementData.eegMetrics.stressIndex?.value || 0) <= 0.25 ? '정상' : 
                                     (report.measurementData.eegMetrics.stressIndex?.value || 0) > 0.25 ? '높음' : '낮음'}
                                  </Badge>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {/* 그래프 */}
                                <div className="flex justify-center">
                                  <div className="w-96 h-96">
                                    <EEGMetricChart
                                      value={report.measurementData.eegMetrics.stressIndex?.value || 0}
                                      normalRange={{ min: 0.15, max: 0.25 }}
                                      label="스트레스 지수"
                                      unit=""
                                      status={
                                        (report.measurementData.eegMetrics.stressIndex?.value || 0) >= 0.15 && 
                                        (report.measurementData.eegMetrics.stressIndex?.value || 0) <= 0.25 ? 'normal' : 
                                        (report.measurementData.eegMetrics.stressIndex?.value || 0) > 0.25 ? 'high' : 'low'
                                      }
                                    />
                                  </div>
                                </div>
                                
                                {/* 하단: 해석 */}
                                <div className="border-t border-gray-100 pt-3">
                                  <h5 className="text-sm font-medium text-gray-700 mb-2">의학적 해석</h5>
                                  <p className="text-sm text-gray-600 leading-relaxed">
                                    베타파 기반 스트레스 수준을 나타내며, 정신적 긴장도와 스트레스 반응을 평가합니다.
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* 정신적 이완도 */}
                        <div className={`${getEEGCardBackgroundClass(
                          getMetricStatus(
                            report.measurementData.eegMetrics.relaxationIndex?.value || 0,
                            { min: 0.18, max: 0.22 }
                          )
                        )}`}>
                          <Card className="bg-white border-gray-200">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <CardTitle className="text-base font-semibold text-gray-900">
                                    정신적 이완도
                                  </CardTitle>
                                  <p className="text-sm text-gray-500">Mental Relaxation</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-gray-900">
                                    {report.measurementData.eegMetrics.relaxationIndex?.value?.toFixed(3) || 'N/A'}
                                  </div>
                                  <Badge 
                                    variant="outline" 
                                    className={
                                      (report.measurementData.eegMetrics.relaxationIndex?.value || 0) >= 0.18 && 
                                      (report.measurementData.eegMetrics.relaxationIndex?.value || 0) <= 0.22
                                        ? 'border-green-300 text-green-700 bg-green-50' 
                                        : (report.measurementData.eegMetrics.relaxationIndex?.value || 0) > 0.22
                                        ? 'border-red-300 text-red-700 bg-red-50'
                                        : 'border-yellow-300 text-yellow-700 bg-yellow-50'
                                    }
                                  >
                                    {(report.measurementData.eegMetrics.relaxationIndex?.value || 0) >= 0.18 && 
                                     (report.measurementData.eegMetrics.relaxationIndex?.value || 0) <= 0.22 ? '정상' : 
                                     (report.measurementData.eegMetrics.relaxationIndex?.value || 0) > 0.22 ? '높음' : '낮음'}
                                  </Badge>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {/* 그래프 */}
                                <div className="flex justify-center">
                                  <div className="w-96 h-96">
                                    <EEGMetricChart
                                      value={report.measurementData.eegMetrics.relaxationIndex?.value || 0}
                                      normalRange={{ min: 0.18, max: 0.22 }}
                                      label="정신적 이완도"
                                      unit=""
                                      status={
                                        (report.measurementData.eegMetrics.relaxationIndex?.value || 0) >= 0.18 && 
                                        (report.measurementData.eegMetrics.relaxationIndex?.value || 0) <= 0.22 ? 'normal' : 
                                        (report.measurementData.eegMetrics.relaxationIndex?.value || 0) > 0.22 ? 'high' : 'low'
                                      }
                                    />
                                  </div>
                                </div>
                                
                                {/* 하단: 해석 */}
                                <div className="border-t border-gray-100 pt-3">
                                  <h5 className="text-sm font-medium text-gray-700 mb-2">의학적 해석</h5>
                                  <p className="text-sm text-gray-600 leading-relaxed">
                                    알파파 기반 정신적 이완 능력을 나타내며, 스트레스 해소 능력을 평가합니다.
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 심혈관 건강 분석 */}
              {analysisResult.detailedAnalysis?.physicalHealth && (
                <Card className="bg-gray-50 border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <Heart className="w-5 h-5 text-red-600" />
                      ❤️ 심혈관 분석 결과
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    
                    {/* 1. 심혈관 건강 분석 종합 해석 */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                        심혈관 분석 종합 해석
                      </h3>
                      
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="text-sm text-red-600 font-medium mb-1">
                              PPG 기반 심혈관 건강 점수
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                              {analysisResult.detailedAnalysis.physicalHealth.score}점
                            </div>
                          </div>
                          <div>
                            <Badge className={getScoreBadgeColor(analysisResult.detailedAnalysis.physicalHealth.score)}>
                              {analysisResult.detailedAnalysis.physicalHealth.status}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* 점수 분포 표시 */}
                        <ScoreDistributionBar 
                          score={analysisResult.detailedAnalysis.physicalHealth.score} 
                          label="심혈관 건강 점수"
                        />
                        
                        <div className="mt-4 prose prose-sm max-w-none prose-gray">
                          <h4 className="text-base font-semibold text-gray-900 mb-2">해석</h4>
                          {loadingComprehensive ? (
                            <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
                              <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                              <span className="text-sm text-gray-600">심혈관 건강 종합 해석을 분석하고 있습니다...</span>
                            </div>
                          ) : physicalHealthComprehensive ? (
                            <AIAnalysisMarkdownRenderer content={physicalHealthComprehensive.comprehensiveInterpretation} />
                          ) : (
                            <AIAnalysisMarkdownRenderer content={
                              `❤️ **심혈관 기능 종합 분석**\n\n심박수 ${ppgMetrics.heartRate.value}bpm과 HRV 지표들(RMSSD: ${ppgMetrics.rmssd.value}ms, SDNN: ${ppgMetrics.sdnn.value}ms)을 통해 현재 심혈관 건강 상태를 평가한 결과, 자율신경계 균형과 심혈관 적응성이 ${analysisResult.detailedAnalysis.physicalHealth.status} 수준으로 나타납니다. LF/HF 비율 ${ppgMetrics.lfHfRatio.value}은 교감/부교감 신경계 균형 상태를 반영하며, 전반적인 심혈관 건강 관리가 필요한 상황입니다.`
                            } />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 2. 개별 지표 상세 분석 */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                        개별 지표 상세 분석
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 심박수 */}
                        <div className={`${getEEGCardBackgroundClass(ppgMetrics.heartRate.status)}`}>
                          <Card className="bg-white border-gray-200">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <CardTitle className="text-base font-semibold text-gray-900">
                                    심박수
                                  </CardTitle>
                                  <p className="text-sm text-gray-500">Heart Rate</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-gray-900">
                                    {ppgMetrics.heartRate.value}bpm
                                  </div>
                                  <Badge 
                                    variant="outline" 
                                    className={
                                      ppgMetrics.heartRate.status === 'normal'
                                        ? 'border-green-300 text-green-700 bg-green-50' 
                                        : ppgMetrics.heartRate.status === 'high'
                                        ? 'border-red-300 text-red-700 bg-red-50'
                                        : 'border-yellow-300 text-yellow-700 bg-yellow-50'
                                    }
                                  >
                                    {ppgMetrics.heartRate.status === 'normal' ? '정상' : 
                                     ppgMetrics.heartRate.status === 'high' ? '빈맥' : '서맥'}
                                  </Badge>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {/* 그래프 */}
                                <div className="flex justify-center">
                                  <div className="w-96 h-96">
                                    <EEGMetricChart
                                      value={parseFloat(ppgMetrics.heartRate.value)}
                                      normalRange={ppgMetrics.heartRate.normalRange}
                                      label="심박수"
                                      unit="bpm"
                                      status={ppgMetrics.heartRate.status}
                                      customLabels={{ low: '서맥', normal: '정상', high: '빈맥' }}
                                    />
                                  </div>
                                </div>
                                
                                {/* 하단: 해석 */}
                                <div className="border-t border-gray-100 pt-3">
                                  <h5 className="text-sm font-medium text-gray-700 mb-2">의학적 해석</h5>
                                  <p className="text-sm text-gray-600 leading-relaxed">
                                    안정시 심박수로 심혈관 건강과 체력 수준을 나타내는 기본 지표입니다.
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* 스트레스 회복력 */}
                        <div className={`${getEEGCardBackgroundClass(ppgMetrics.rmssd.status)}`}>
                          <Card className="bg-white border-gray-200">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <CardTitle className="text-base font-semibold text-gray-900">
                                    스트레스 회복력
                                  </CardTitle>
                                  <p className="text-sm text-gray-500">RMSSD</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-gray-900">
                                    {ppgMetrics.rmssd.value}ms
                                  </div>
                                  <Badge 
                                    variant="outline" 
                                    className={
                                      ppgMetrics.rmssd.status === 'normal'
                                        ? 'border-green-300 text-green-700 bg-green-50' 
                                        : ppgMetrics.rmssd.status === 'high'
                                        ? 'border-red-300 text-red-700 bg-red-50'
                                        : 'border-yellow-300 text-yellow-700 bg-yellow-50'
                                    }
                                  >
                                    {ppgMetrics.rmssd.status === 'normal' ? '정상' : 
                                     ppgMetrics.rmssd.status === 'high' ? '높음' : '낮음'}
                                  </Badge>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {/* 그래프 */}
                                <div className="flex justify-center">
                                  <div className="w-96 h-96">
                                    <EEGMetricChart
                                      value={parseFloat(ppgMetrics.rmssd.value)}
                                      normalRange={ppgMetrics.rmssd.normalRange}
                                      label="RMSSD"
                                      unit="ms"
                                      status={ppgMetrics.rmssd.status}
                                    />
                                  </div>
                                </div>
                                
                                {/* 하단: 해석 */}
                                <div className="border-t border-gray-100 pt-3">
                                  <h5 className="text-sm font-medium text-gray-700 mb-2">의학적 해석</h5>
                                  <p className="text-sm text-gray-600 leading-relaxed">
                                    부교감신경 활성도를 나타내며, 스트레스 회복 능력과 심혈관 건강을 평가합니다.
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
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

export default EEGPPGDetailAnalysisReport; 