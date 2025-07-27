import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card';
import { Button } from '@ui/button';
import { FileText, RotateCcw, Download, X } from 'lucide-react';

// 실제 사용 중인 분석 결과 타입 정의
interface AnalysisResults {
  mentalHealthScore: number;
  physicalHealthScore: number;
  stressLevel: number;
  recommendations: string[];
  detailedAnalysis: string;
}

interface AIAnalysisResponse {
  reportId: string;
  personalInfo: any;
  analysisResults: AnalysisResults;
  generatedAt: Date;
  reliability: string;
}

interface ReportScreenProps {
  analysisResult: AIAnalysisResponse;
  onRestart: () => void;
  onClose?: () => void;
}

export function ReportScreen({ analysisResult, onRestart, onClose }: ReportScreenProps) {
  const navigate = useNavigate();

  const handleDownload = () => {
    // 임시 다운로드 기능
    console.log('리포트 다운로드 기능 구현 예정');
  };

  const handleClose = () => {
    // /org-admin/ai-reports로 이동
    navigate('/org-admin/ai-reports');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <FileText className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          AI Health Report 완성
        </h2>
        <p className="text-gray-700">
          개인 맞춤형 건강 리포트가 생성되었습니다.
        </p>
      </div>

      {/* 전체 점수 */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">종합 건강 점수</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {analysisResult.analysisResults.mentalHealthScore}
              </div>
              <div className="text-sm text-gray-600">정신 건강</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {analysisResult.analysisResults.physicalHealthScore}
              </div>
              <div className="text-sm text-gray-600">신체 건강</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 스트레스 레벨 */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">스트레스 수준</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-700">현재 스트레스 레벨</span>
            <span className={`text-xl font-bold ${
              analysisResult.analysisResults.stressLevel <= 30 ? 'text-green-600' :
              analysisResult.analysisResults.stressLevel <= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {analysisResult.analysisResults.stressLevel}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full ${
                analysisResult.analysisResults.stressLevel <= 30 ? 'bg-green-500' :
                analysisResult.analysisResults.stressLevel <= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${analysisResult.analysisResults.stressLevel}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>

      {/* 상세 분석 */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">상세 분석</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed">
            {analysisResult.analysisResults.detailedAnalysis}
          </p>
        </CardContent>
      </Card>

      {/* 권장사항 */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">개인 맞춤 권장사항</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {analysisResult.analysisResults.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-gray-700">{recommendation}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* 리포트 정보 */}
      <Card className="border border-gray-200 shadow-sm bg-gray-50">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>리포트 ID: {analysisResult.reportId}</span>
            <span>생성일: {analysisResult.generatedAt.toLocaleDateString()}</span>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            <span>데이터 신뢰도: {analysisResult.reliability === 'high' ? '높음' : '보통'}</span>
          </div>
        </CardContent>
      </Card>

      {/* 액션 버튼 */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Button
          onClick={handleDownload}
          className="px-6 py-3 text-white bg-blue-500 hover:bg-blue-600"
        >
          <Download className="w-4 h-4 mr-2" />
          PDF 다운로드
        </Button>
        
        <Button
          onClick={onRestart}
          variant="outline"
          className="px-6 py-3 border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          새 측정 시작
        </Button>
        
        {onClose && (
          <Button
            onClick={handleClose}
            variant="outline"
            className="px-6 py-3 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <X className="w-4 h-4 mr-2" />
            닫기
          </Button>
        )}
      </div>
    </div>
  );
} 