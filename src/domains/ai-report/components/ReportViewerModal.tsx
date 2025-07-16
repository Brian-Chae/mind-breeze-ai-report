/**
 * AI 리포트 뷰어 모달 컴포넌트
 * 선택된 뷰어를 사용해서 리포트를 표시하는 모달
 */

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@ui/dialog';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card';
import { 
  Brain, 
  Eye, 
  Download, 
  Maximize2,
  Minimize2,
  RefreshCw,
  Settings,
  FileText,
  Monitor,
  Loader2,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';

interface ReportViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: any; // 리포트 데이터
  viewerId: string; // 선택된 뷰어 ID
  viewerName: string; // 선택된 뷰어 이름
}

export function ReportViewerModal({ 
  isOpen, 
  onClose, 
  report,
  viewerId,
  viewerName
}: ReportViewerModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportContent, setReportContent] = useState<any>(null);

  // 리포트 데이터 로드
  useEffect(() => {
    if (isOpen && report) {
      loadReportContent();
    }
  }, [isOpen, report, viewerId]);

  // report 유효성 재검증
  useEffect(() => {
    if (isOpen && !report) {
      console.warn('ReportViewerModal: report가 null입니다. 모달을 닫습니다.');
      onClose();
    }
  }, [isOpen, report, onClose]);

  const loadReportContent = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 실제로는 Firebase에서 리포트 데이터를 가져와야 함
      // 지금은 시뮬레이션 데이터 사용
      await new Promise(resolve => setTimeout(resolve, 1000)); // 로딩 시뮬레이션
      
      const mockReportContent = {
        title: (report?.title) || (report?.engineName ? `${report.engineName} 분석 리포트` : '분석 리포트'),
        summary: "전반적인 건강 상태가 양호하며, 스트레스 수준은 보통입니다.",
        overallScore: 78,
        stressLevel: 45,
        focusLevel: 82,
        detailedAnalysis: `
## 종합 분석 결과

### 🧠 뇌파 분석
- **집중도**: 82점 (우수)
- **스트레스**: 45점 (보통)
- **안정도**: 76점 (양호)

### ❤️ 심박 분석  
- **평균 심박수**: 72 BPM (정상)
- **심박 변이도**: 42ms (양호)
- **자율신경균형**: 안정적

### 🏃‍♂️ 활동 분석
- **움직임 수준**: 보통
- **자세 안정성**: 85점 (우수)

## 개선 권장사항

1. **스트레스 관리**
   - 규칙적인 명상이나 깊은 호흡 연습
   - 충분한 휴식과 수면

2. **집중력 향상** 
   - 집중력이 좋은 상태를 유지하기 위한 규칙적인 운동
   - 적절한 업무-휴식 균형

3. **전반적 건강**
   - 현재 상태가 양호하므로 현재 생활습관 유지
   - 정기적인 건강 체크 권장

## 추가 분석 데이터

### 상세 지표
- **Delta파**: 15%
- **Theta파**: 20%  
- **Alpha파**: 35%
- **Beta파**: 25%
- **Gamma파**: 5%

### 시계열 데이터
측정 기간 동안의 변화 패턴이 안정적으로 유지되었습니다.
        `,
        recommendations: [
          "규칙적인 명상이나 깊은 호흡 연습을 통한 스트레스 관리",
          "집중력 유지를 위한 규칙적인 운동",
          "현재 생활습관 유지 및 정기적인 건강 체크"
        ],
        metadata: {
          analysisDate: new Date().toLocaleDateString(),
          engineName: report?.engineName || '기본 분석',
          processingTime: `${report?.processingTime || 3.2}초`,
          dataQuality: '우수'
        }
      };
      
      setReportContent(mockReportContent);
    } catch (error) {
      console.error('리포트 로드 실패:', error);
      setError('리포트를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // report가 null이면 렌더링하지 않음
  if (!report) {
    return null;
  }

  const handleDownloadReport = () => {
    // PDF 다운로드 기능 구현
    console.log('리포트 다운로드:', report.id);
    // TODO: 실제 PDF 생성 및 다운로드 로직
  };

  const renderUniversalWebViewer = () => {
    if (!reportContent) return null;

    return (
      <div className="space-y-6">
        {/* 헤더 정보 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{reportContent.title}</h1>
            <Badge variant="outline" className="text-sm">
              {reportContent.metadata.engineName}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-green-600">{reportContent.overallScore}</div>
              <div className="text-sm text-gray-600">종합 점수</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-yellow-600">{reportContent.stressLevel}</div>
              <div className="text-sm text-gray-600">스트레스</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{reportContent.focusLevel}</div>
              <div className="text-sm text-gray-600">집중도</div>
            </div>
          </div>
        </div>

        {/* 요약 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-500" />
              분석 요약
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">{reportContent.summary}</p>
          </CardContent>
        </Card>

        {/* 상세 분석 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-500" />
              상세 분석 결과
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ 
                __html: reportContent.detailedAnalysis.replace(/\n/g, '<br>').replace(/###/g, '<h3>').replace(/##/g, '<h2>') 
              }} />
            </div>
          </CardContent>
        </Card>

        {/* 메타데이터 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-500" />
              분석 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">분석 일시:</span>
                <div>{reportContent.metadata.analysisDate}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600">분석 엔진:</span>
                <div>{reportContent.metadata.engineId}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600">데이터 품질:</span>
                <div>{reportContent.metadata.dataQuality}%</div>
              </div>
              <div>
                <span className="font-medium text-gray-600">버전:</span>
                <div>{reportContent.metadata.version}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderBasicGeminiViewer = () => {
    // BasicGemini 전용 뷰어 (더 상세한 분석 표시)
    return renderUniversalWebViewer(); // 지금은 동일하게 처리
  };

  const renderReportContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-500" />
            <p className="text-gray-600">리포트를 불러오는 중...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <p className="text-red-600 font-medium">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadReportContent}
              className="mt-4"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              다시 시도
            </Button>
          </div>
        </div>
      );
    }

    // 뷰어별 렌더링
    switch (viewerId) {
      case 'universal-web-viewer':
        return renderUniversalWebViewer();
      case 'basic-gemini-v1-web':
        return renderBasicGeminiViewer();
      default:
        return renderUniversalWebViewer();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isFullscreen ? 'max-w-[95vw] max-h-[95vh]' : 'max-w-4xl max-h-[90vh]'} overflow-hidden flex flex-col`}>
        <DialogHeader className="flex-shrink-0 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Monitor className="w-5 h-5 text-blue-500" />
                {viewerName}
              </DialogTitle>
              <DialogDescription className="text-base">
                {(report?.title) || (report?.engineName ? `${report.engineName} 분석 리포트` : '분석 리포트')}
              </DialogDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadReport}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                PDF 다운로드
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="flex items-center gap-2"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* 스크롤 가능한 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto pr-2">
          {renderReportContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
} 