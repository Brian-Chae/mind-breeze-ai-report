/**
 * AI Health Report 상세 화면
 * - ReportDetailViewer를 사용하여 저장된 리포트 표시
 * - 일관된 UI 경험 제공
 */

import React, { useEffect } from 'react';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import ReportDetailViewer from './ReportDetailViewer';
import useReportHistory from '../hooks/useReportHistory';

interface ReportDetailScreenProps {
  reportId: string;
  onBack: () => void;
  onEdit?: () => void;
}

const ReportDetailScreen: React.FC<ReportDetailScreenProps> = ({
  reportId,
  onBack,
  onEdit
}) => {
  const {
    currentReport,
    isLoading,
    error,
    loadReport,
    clearError
  } = useReportHistory();

  useEffect(() => {
    loadReport(reportId);
  }, [reportId, loadReport]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="text-xl font-semibold text-gray-900">
            리포트 로딩 중...
          </h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button variant="ghost" size="sm" onClick={clearError} className="ml-2">
                닫기
              </Button>
            </AlertDescription>
          </Alert>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로 가기
          </Button>
        </div>
      </div>
    );
  }

  if (!currentReport) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            리포트를 찾을 수 없습니다
          </h2>
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              뒤로 가기
            </Button>
        </div>
      </div>
    );
  }

  return (
    <ReportDetailViewer
      report={currentReport}
      onBack={onBack}
      
      // 저장된 리포트이므로 즉시 분석용 기능 비활성화
      isCurrentAnalysis={false}
      showSaveButton={false}
      showShareButton={true}
      onShare={async () => {
        const shareData = {
          title: `${currentReport.personalInfo.name}님의 건강 리포트`,
          text: `건강 점수: ${currentReport.analysisResult.overallHealth.score}점`,
          url: window.location.href
        };
        
        if (navigator.share) {
          try {
            await navigator.share(shareData);
          } catch (error) {
            console.log('공유 취소됨');
          }
        } else {
          await navigator.clipboard.writeText(
            `${shareData.title}\n${shareData.text}\n${shareData.url}`
          );
          alert('클립보드에 복사되었습니다!');
        }
      }}
    />
  );
};

export default ReportDetailScreen; 