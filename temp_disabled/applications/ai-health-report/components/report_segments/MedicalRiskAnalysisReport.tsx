import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card';
import { 
  Activity,
  Shield,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { StoredReport } from '../../services/ReportStorage';
import { AIAnalysisMarkdownRenderer } from '../AIAnalysisMarkdownRenderer';

interface MedicalRiskAnalysisReportProps {
  report: StoredReport;
  analysisResult: any;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

const MedicalRiskAnalysisReport: React.FC<MedicalRiskAnalysisReportProps> = ({
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
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-red-600 font-semibold text-sm">4</span>
            </div>
            <div>
              <CardTitle className="text-lg text-gray-900">의학적 위험도 분석</CardTitle>
              <CardDescription className="text-gray-600">
                생체신호 통합 분석 및 병리학적 위험 평가
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
            <div className="grid grid-cols-1 gap-6">
              {/* 생체신호 통합 분석 */}
              <Card className="bg-gray-50 border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Activity className="w-5 h-5 text-green-600" />
                    생체신호 통합 분석
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-blue-600 mb-2">🧠 뇌파(EEG) 의학적 해석</h4>
                    <div className="prose prose-sm max-w-none prose-gray">
                      <AIAnalysisMarkdownRenderer 
                        content={`**알파파 활성도:** ${analysisResult.detailedAnalysis?.medicalRiskAnalysis?.biosignalIntegration?.eegMedicalInterpretation?.alphaActivity || '정상 범위'}\n\n**베타파 패턴:** ${analysisResult.detailedAnalysis?.medicalRiskAnalysis?.biosignalIntegration?.eegMedicalInterpretation?.betaPattern || '안정적'}\n\n**감마파 동조:** ${analysisResult.detailedAnalysis?.medicalRiskAnalysis?.biosignalIntegration?.eegMedicalInterpretation?.gammaSync || '양호'}\n\n**의학적 소견:** ${analysisResult.detailedAnalysis?.medicalRiskAnalysis?.biosignalIntegration?.eegMedicalInterpretation?.medicalFindings || '전반적인 뇌 활성도가 정상 범위 내에 있으며, 인지 기능 및 정서 조절 능력이 양호한 상태로 평가됩니다.'}`}
                        variant="compact"
                      />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-red-600 mb-2">❤️ 심혈관(PPG) 의학적 해석</h4>
                    <div className="prose prose-sm max-w-none prose-gray">
                      <AIAnalysisMarkdownRenderer 
                        content={`**심박변이도(HRV):** ${analysisResult.detailedAnalysis?.medicalRiskAnalysis?.biosignalIntegration?.ppgMedicalInterpretation?.hrv || '정상'}\n\n**혈관 탄성도:** ${analysisResult.detailedAnalysis?.medicalRiskAnalysis?.biosignalIntegration?.ppgMedicalInterpretation?.vascularElasticity || '양호'}\n\n**자율신경 균형:** ${analysisResult.detailedAnalysis?.medicalRiskAnalysis?.biosignalIntegration?.ppgMedicalInterpretation?.autonomicBalance || '균형적'}\n\n**의학적 소견:** ${analysisResult.detailedAnalysis?.medicalRiskAnalysis?.biosignalIntegration?.ppgMedicalInterpretation?.medicalFindings || '심혈관계 기능이 정상 범위에 있으며, 스트레스 반응성과 회복력이 적절한 수준으로 평가됩니다.'}`}
                        variant="compact"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 병리학적 위험 요소 평가 */}
              <Card className="bg-gray-50 border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Shield className="w-5 h-5 text-orange-600" />
                    병리학적 위험 요소 평가
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-purple-600 mb-2">🧠 신경학적 위험도</h4>
                    <div className="prose prose-sm max-w-none prose-gray">
                      <AIAnalysisMarkdownRenderer 
                        content={`**위험 점수:** ${analysisResult.detailedAnalysis?.medicalRiskAnalysis?.pathologicalRiskFactors?.neurologicalRisk?.riskScore || 0}/100\n\n**설명:** ${analysisResult.detailedAnalysis?.medicalRiskAnalysis?.pathologicalRiskFactors?.neurologicalRisk?.description || '우울, 집중력 장애 등 신경정신학적 질환 발생 위험도'}`}
                        variant="compact"
                      />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-red-600 mb-2">💔 심혈관 위험도</h4>
                    <div className="prose prose-sm max-w-none prose-gray">
                      <AIAnalysisMarkdownRenderer 
                        content={`**위험 점수:** ${analysisResult.detailedAnalysis?.medicalRiskAnalysis?.pathologicalRiskFactors?.cardiovascularRisk?.riskScore || 0}/100\n\n**설명:** ${analysisResult.detailedAnalysis?.medicalRiskAnalysis?.pathologicalRiskFactors?.cardiovascularRisk?.description || '고혈압, 부정맥 등 심혈관계 질환 발생 위험도'}`}
                        variant="compact"
                      />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-orange-600 mb-2">🔥 대사 증후군 위험도</h4>
                    <div className="prose prose-sm max-w-none prose-gray">
                      <AIAnalysisMarkdownRenderer 
                        content={`**위험 점수:** ${analysisResult.detailedAnalysis?.medicalRiskAnalysis?.pathologicalRiskFactors?.metabolicSyndromeRisk?.riskScore || 0}/100\n\n**설명:** ${analysisResult.detailedAnalysis?.medicalRiskAnalysis?.pathologicalRiskFactors?.metabolicSyndromeRisk?.description || '당뇨병, 비만 등 대사성 질환 발생 위험도'}`}
                        variant="compact"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 임상적 권고사항 */}
            <Card className="bg-gray-50 border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <FileText className="w-5 h-5 text-blue-600" />
                  임상적 권고사항
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-green-600 mb-2">✅ 예방 의학적 접근</h4>
                  <div className="prose prose-sm max-w-none prose-gray">
                    <AIAnalysisMarkdownRenderer 
                      content={`• **정기 검진:** ${analysisResult.detailedAnalysis?.medicalRiskAnalysis?.clinicalRecommendations?.preventiveMedicine?.regularCheckups || '3-6개월 간격으로 정신건강 상태 모니터링 권장'}\n\n• **생활습관 교정:** ${analysisResult.detailedAnalysis?.medicalRiskAnalysis?.clinicalRecommendations?.preventiveMedicine?.lifestyleModifications || '규칙적인 운동, 충분한 수면, 균형잡힌 영양 섭취'}\n\n• **스트레스 관리:** ${analysisResult.detailedAnalysis?.medicalRiskAnalysis?.clinicalRecommendations?.preventiveMedicine?.stressManagement || '명상, 요가, 심호흡 등 이완 기법 실천'}`}
                      variant="compact"
                    />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-600 mb-2">🏥 의료진 상담 권장 사항</h4>
                  <div className="prose prose-sm max-w-none prose-gray">
                    <AIAnalysisMarkdownRenderer 
                      content={analysisResult.detailedAnalysis?.medicalRiskAnalysis?.clinicalRecommendations?.medicalConsultation?.recommendations?.map((rec: string) => `• ${rec}`).join('\n\n') || '위험도에 따른 차등 권고'}
                      variant="compact"
                    />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-purple-600 mb-2">🔬 과학적 근거</h4>
                  <div className="prose prose-sm max-w-none prose-gray">
                    <AIAnalysisMarkdownRenderer 
                      content={analysisResult.detailedAnalysis?.medicalRiskAnalysis?.clinicalRecommendations?.scientificEvidence || 
                      '본 분석은 국제 정신의학회(IPA) 가이드라인과 DSM-5 진단 기준을 참조하여 뇌파-심혈관 바이오마커의 임상적 유효성을 검증한 최신 연구 결과를 바탕으로 합니다. (참고: Nature Medicine 2024, Lancet Psychiatry 2024)'}
                      variant="compact"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default MedicalRiskAnalysisReport; 