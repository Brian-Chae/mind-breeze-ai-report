import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@ui/card';
import { Badge } from '@ui/badge';
import { 
  ChevronDown,
  ChevronUp,
  Activity,
  BarChart3,
  FileText
} from 'lucide-react';

interface OverallHealthReportProps {
  analysisResult: any;
  personalInfo: any;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

const OverallHealthReport: React.FC<OverallHealthReportProps> = ({
  analysisResult,
  personalInfo,
  isExpanded,
  onToggleExpanded
}) => {
  // 점수에 따른 상태 계산
  const getHealthStatus = (score: number) => {
    if (score >= 80) return { status: 'normal', label: '양호', color: 'bg-green-100 text-green-800' };
    if (score >= 70) return { status: 'high', label: '보통', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'low', label: '주의', color: 'bg-red-100 text-red-800' };
  };

  const getRiskStatus = (riskScore: number) => {
    if (riskScore <= 20) return { status: 'normal', label: '양호', color: 'bg-green-100 text-green-800' };
    if (riskScore <= 35) return { status: 'medium', label: '보통', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'high', label: '주의', color: 'bg-red-100 text-red-800' };
  };

  // 게이지 차트 컴포넌트
  const GaugeChart = ({ value, max = 100, label, status }: { value: number; max?: number; label: string; status: string }) => {
    const percentage = (value / max) * 100;
    const strokeColor = status === 'normal' ? '#10B981' : status === 'high' ? '#F59E0B' : '#EF4444';
    
    return (
      <div className="flex flex-col items-center">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#E5E7EB"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke={strokeColor}
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${percentage * 2.51} 251`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{value}</div>
              <div className="text-xs text-gray-500">/{max}</div>
            </div>
          </div>
        </div>
        <div className="mt-2 text-sm font-medium text-gray-700">{label}</div>
      </div>
    );
  };

  // 프로그레스 바 컴포넌트
  const ProgressBar = ({ value, label, isRisk = false }: { value: number; label: string; isRisk?: boolean }) => {
    const status = isRisk ? getRiskStatus(value) : getHealthStatus(value);
    
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <Badge className={`text-xs px-2 py-1 ${status.color}`}>
              {status.label}
            </Badge>
          </div>
          <span className="text-sm font-bold text-gray-900">
            {Math.round(value)}{isRisk ? '% 위험도' : '/100'}
          </span>
        </div>
        <div className="relative">
          <div className="flex w-full h-3 rounded-full overflow-hidden">
            {isRisk ? (
              <>
                <div className="w-[20%] bg-green-200"></div>
                <div className="w-[15%] bg-yellow-200"></div>
                <div className="w-[65%] bg-red-200"></div>
              </>
            ) : (
              <>
                <div className="w-[70%] bg-red-200"></div>
                <div className="w-[10%] bg-yellow-200"></div>
                <div className="w-[20%] bg-green-200"></div>
              </>
            )}
          </div>
          <div 
            className="absolute top-0 h-3 w-1 bg-gray-800 rounded-full"
            style={{ left: `${Math.min(Math.max(value, 0), 100)}%`, transform: 'translateX(-50%)' }}
          />
          {isRisk ? (
            <>
              <div className="absolute top-0 h-3 w-0.5 bg-white" style={{ left: '20%' }}></div>
              <div className="absolute top-0 h-3 w-0.5 bg-white" style={{ left: '35%' }}></div>
            </>
          ) : (
            <>
              <div className="absolute top-0 h-3 w-0.5 bg-white" style={{ left: '70%' }}></div>
              <div className="absolute top-0 h-3 w-0.5 bg-white" style={{ left: '80%' }}></div>
            </>
          )}
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          {isRisk ? (
            <>
              <span>양호</span>
              <span>보통</span>
              <span>주의</span>
            </>
          ) : (
            <>
              <span>주의</span>
              <span>보통</span>
              <span>양호</span>
            </>
          )}
        </div>
      </div>
    );
  };

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
                종합 건강 점수 및 주요 지표 분석
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
            {/* 개인 정보 요약 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">분석 대상 정보</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">이름:</span>
                  <div className="font-medium">{personalInfo?.name || '익명'}</div>
                </div>
                <div>
                  <span className="text-gray-500">나이:</span>
                  <div className="font-medium">{personalInfo?.age || '-'}세</div>
                </div>
                <div>
                  <span className="text-gray-500">성별:</span>
                  <div className="font-medium">{personalInfo?.gender === 'male' ? '남성' : personalInfo?.gender === 'female' ? '여성' : '-'}</div>
                </div>
                <div>
                  <span className="text-gray-500">직업:</span>
                  <div className="font-medium">{personalInfo?.occupation || '-'}</div>
                </div>
              </div>
            </div>

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
                  <GaugeChart
                    value={analysisResult?.overallHealth?.score || 75}
                    label="전체 점수"
                    status={getHealthStatus(analysisResult?.overallHealth?.score || 75).status}
                  />
                  <div className="text-center">
                    <Badge className={`${getHealthStatus(analysisResult?.overallHealth?.score || 75).color} px-3 py-1`}>
                      {getHealthStatus(analysisResult?.overallHealth?.score || 75).label}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-2">
                      {analysisResult?.overallHealth?.grade || '보통'} 등급
                    </p>
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
                  <ProgressBar
                    value={analysisResult?.detailedAnalysis?.mentalHealth?.score || 78}
                    label="뇌파 건강도"
                  />
                  <ProgressBar
                    value={analysisResult?.detailedAnalysis?.physicalHealth?.score || 82}
                    label="맥파 건강도"
                  />
                  <ProgressBar
                    value={analysisResult?.detailedAnalysis?.stressLevel?.score || 65}
                    label="스트레스 관리"
                  />
                </CardContent>
              </Card>
            </div>

            {/* 위험도 분석 */}
            <Card className="bg-red-50 border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Activity className="w-5 h-5 text-red-600" />
                  정신건강 위험도 분석
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <ProgressBar
                  value={Math.random() * 50 + 10} // 임시 데이터
                  label="우울 위험도"
                  isRisk={true}
                />
                <ProgressBar
                  value={Math.random() * 60 + 20} // 임시 데이터
                  label="집중력 저하"
                  isRisk={true}
                />
                <ProgressBar
                  value={Math.random() * 40 + 15} // 임시 데이터
                  label="번아웃 위험도"
                  isRisk={true}
                />
              </CardContent>
            </Card>

            {/* 종합 분석 결과 */}
            {analysisResult?.overallHealth?.summary && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  종합 분석 결과
                </h3>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="prose prose-sm max-w-none prose-gray">
                    <p className="text-gray-700 leading-relaxed">
                      {analysisResult.overallHealth.summary}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 주요 발견사항 */}
            {analysisResult?.overallHealth?.keyFindings && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">주요 발견사항</h3>
                <div className="flex flex-col gap-3">
                  {analysisResult.overallHealth.keyFindings.slice(0, 4).map((finding: string, index: number) => (
                    <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4 border-l-4 border-l-green-500 flex items-start gap-3">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                      <p className="text-sm text-green-800 font-medium leading-relaxed">{finding}</p>
                    </div>
                  ))}
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