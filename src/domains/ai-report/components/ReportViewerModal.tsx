/**
 * AI 리포트 뷰어 모달 컴포넌트
 * 선택된 뷰어를 사용해서 리포트를 표시하는 모달
 */

import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
import { rendererRegistry } from '../core/registry/RendererRegistry';
import { selectBestRenderer } from '../core/utils/EngineRendererMatcher';
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
  X,
  Smartphone
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
  const [actualRenderer, setActualRenderer] = useState<any>(null);
  const [rendererName, setRendererName] = useState(viewerName || '웹 뷰어');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportContent, setReportContent] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  
  // 실제 렌더러 찾기
  useEffect(() => {
    if (report && isOpen) {
      try {
        // report에서 engineId를 가져와서 적절한 렌더러 찾기
        const engineId = report.engineId || report.engineName || 'basic-gemini-v1';
        const bestRenderer = selectBestRenderer(engineId, 'web');
        
        if (bestRenderer) {
          setActualRenderer(bestRenderer);
          setRendererName(bestRenderer.name);
          console.log('🎯 선택된 렌더러:', bestRenderer.name, '(ID:', bestRenderer.id, ')');
        } else {
          // 기본 렌더러 사용
          const allRenderers = rendererRegistry.getAll();
          const defaultRenderer = allRenderers.find(r => r.outputFormat === 'web');
          if (defaultRenderer) {
            setActualRenderer(defaultRenderer);
            setRendererName(defaultRenderer.name);
          }
        }
      } catch (error) {
        console.warn('렌더러 선택 중 오류:', error);
        setRendererName('기본 웹 뷰어');
      }
    }
  }, [report, isOpen]);

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


### 측정 데이터 목록

<table style="width: 100%; border-collapse: collapse; margin: 1rem 0; border: 1px solid #e5e7eb;">
<thead>
<tr style="background-color: #f9fafb;">
<th style="padding: 0.75rem; border: 1px solid #e5e7eb; text-align: left;">측정 시간</th>
<th style="padding: 0.75rem; border: 1px solid #e5e7eb; text-align: center;">심박수 (BPM)</th>
<th style="padding: 0.75rem; border: 1px solid #e5e7eb; text-align: center;">스트레스 지수</th>
<th style="padding: 0.75rem; border: 1px solid #e5e7eb; text-align: center;">집중도</th>
<th style="padding: 0.75rem; border: 1px solid #e5e7eb; text-align: center;">데이터 품질</th>
</tr>
</thead>
<tbody>
<tr>
<td style="padding: 0.75rem; border: 1px solid #e5e7eb;">00:00-00:15</td>
<td style="padding: 0.75rem; border: 1px solid #e5e7eb; text-align: center;">74</td>
<td style="padding: 0.75rem; border: 1px solid #e5e7eb; text-align: center;">42</td>
<td style="padding: 0.75rem; border: 1px solid #e5e7eb; text-align: center;">78</td>
<td style="padding: 0.75rem; border: 1px solid #e5e7eb; text-align: center;">우수</td>
</tr>
<tr style="background-color: #fafafa;">
<td style="padding: 0.75rem; border: 1px solid #e5e7eb;">00:15-00:30</td>
<td style="padding: 0.75rem; border: 1px solid #e5e7eb; text-align: center;">71</td>
<td style="padding: 0.75rem; border: 1px solid #e5e7eb; text-align: center;">46</td>
<td style="padding: 0.75rem; border: 1px solid #e5e7eb; text-align: center;">81</td>
<td style="padding: 0.75rem; border: 1px solid #e5e7eb; text-align: center;">우수</td>
</tr>
<tr>
<td style="padding: 0.75rem; border: 1px solid #e5e7eb;">00:30-00:45</td>
<td style="padding: 0.75rem; border: 1px solid #e5e7eb; text-align: center;">73</td>
<td style="padding: 0.75rem; border: 1px solid #e5e7eb; text-align: center;">43</td>
<td style="padding: 0.75rem; border: 1px solid #e5e7eb; text-align: center;">84</td>
<td style="padding: 0.75rem; border: 1px solid #e5e7eb; text-align: center;">양호</td>
</tr>
<tr style="background-color: #fafafa;">
<td style="padding: 0.75rem; border: 1px solid #e5e7eb;">00:45-01:00</td>
<td style="padding: 0.75rem; border: 1px solid #e5e7eb; text-align: center;">70</td>
<td style="padding: 0.75rem; border: 1px solid #e5e7eb; text-align: center;">47</td>
<td style="padding: 0.75rem; border: 1px solid #e5e7eb; text-align: center;">85</td>
<td style="padding: 0.75rem; border: 1px solid #e5e7eb; text-align: center;">우수</td>
</tr>
</tbody>
</table>

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

  const handleDownloadReport = async () => {
    if (!reportContent) return;
    
    setIsDownloading(true);
    try {
      // 리포트 콘텐츠 영역을 캔버스로 변환
      const reportElement = document.getElementById('report-content');
      if (!reportElement) {
        throw new Error('리포트 콘텐츠를 찾을 수 없습니다.');
      }

      // HTML을 캔버스로 변환 (고화질)
      const canvas = await html2canvas(reportElement, {
        scale: 2, // 고화질을 위한 스케일 증가
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: viewMode === 'mobile' ? 375 : 1024,
        windowWidth: viewMode === 'mobile' ? 375 : 1200
      });

      // PDF 생성
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // A4 크기 계산
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20; // 여백 10mm씩
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let position = 10; // 상단 여백

      // 이미지가 페이지를 넘어가면 페이지 분할
      if (imgHeight <= pageHeight - 20) {
        // 한 페이지에 모두 들어감
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      } else {
        // 여러 페이지로 분할
        let remainingHeight = imgHeight;
        let sourceY = 0;
        
        while (remainingHeight > 0) {
          const pageContentHeight = pageHeight - 20; // 상하 여백
          const currentPageHeight = Math.min(remainingHeight, pageContentHeight);
          
          // 현재 페이지에 이미지 추가
          pdf.addImage(
            imgData, 
            'PNG', 
            10, 
            10, 
            imgWidth, 
            currentPageHeight
          );
          
          remainingHeight -= currentPageHeight;
          sourceY += currentPageHeight;
          
          if (remainingHeight > 0) {
            pdf.addPage();
          }
        }
      }

      // PDF 다운로드
      const fileName = `AI_건강분석_리포트_${report?.userName || '사용자'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      console.log('✅ PDF 다운로드 완료:', fileName);
      
    } catch (error) {
      console.error('❌ PDF 생성 실패:', error);
      alert('PDF 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsDownloading(false);
    }
  };

  const renderUniversalWebViewer = () => {
    if (!reportContent) return null;

    return (
      <div id="report-content" className={`${
        viewMode === 'mobile' 
          ? 'space-y-4 p-4 w-full' 
          : 'space-y-6 p-6 w-[1024px] mx-auto'
      }`}>
        {/* 헤더 정보 */}
        <div className={`bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg border border-gray-200 shadow-sm ${
          viewMode === 'mobile' ? 'p-4' : 'p-6'
        }`}>
          <div className={`flex items-center justify-between mb-4 ${
            viewMode === 'mobile' ? 'flex-col gap-3' : ''
          }`}>
            <h1 className={`font-bold text-gray-900 ${
              viewMode === 'mobile' ? 'text-xl text-center' : 'text-2xl'
            }`}>
              {reportContent.title}
            </h1>
            <Badge variant="outline" className="text-sm bg-white text-gray-800 border-gray-300 font-medium">
              {reportContent.metadata.engineName}
            </Badge>
          </div>
          
          <div className={`grid ${
            viewMode === 'mobile' 
              ? 'grid-cols-1 gap-3' 
              : 'grid-cols-3 gap-6'
          }`}>
            <div className={`text-center bg-white rounded-lg shadow-md border border-gray-200 ${
              viewMode === 'mobile' ? 'p-4' : 'p-6'
            }`}>
              <div className={`font-bold text-green-700 ${
                viewMode === 'mobile' ? 'text-2xl' : 'text-4xl'
              }`}>
                {reportContent.overallScore}
              </div>
              <div className={`text-gray-700 font-medium ${
                viewMode === 'mobile' ? 'text-sm' : 'text-base'
              }`}>
                종합 점수
              </div>
            </div>
            <div className={`text-center bg-white rounded-lg shadow-md border border-gray-200 ${
              viewMode === 'mobile' ? 'p-4' : 'p-6'
            }`}>
              <div className={`font-bold text-orange-600 ${
                viewMode === 'mobile' ? 'text-2xl' : 'text-4xl'
              }`}>
                {reportContent.stressLevel}
              </div>
              <div className={`text-gray-700 font-medium ${
                viewMode === 'mobile' ? 'text-sm' : 'text-base'
              }`}>
                스트레스
              </div>
            </div>
            <div className={`text-center bg-white rounded-lg shadow-md border border-gray-200 ${
              viewMode === 'mobile' ? 'p-4' : 'p-6'
            }`}>
              <div className={`font-bold text-blue-700 ${
                viewMode === 'mobile' ? 'text-2xl' : 'text-4xl'
              }`}>
                {reportContent.focusLevel}
              </div>
              <div className={`text-gray-700 font-medium ${
                viewMode === 'mobile' ? 'text-sm' : 'text-base'
              }`}>
                집중도
              </div>
            </div>
          </div>
        </div>

        {/* 요약 */}
        <Card className="bg-white border border-gray-200 shadow-md">
          <CardHeader className={`bg-gray-50 border-b border-gray-200 ${
            viewMode === 'mobile' ? 'p-4' : 'p-6'
          }`}>
            <CardTitle className={`flex items-center gap-2 text-gray-900 ${
              viewMode === 'mobile' ? 'text-lg' : 'text-xl'
            }`}>
              <Brain className={`text-blue-600 ${
                viewMode === 'mobile' ? 'w-4 h-4' : 'w-5 h-5'
              }`} />
              분석 요약
            </CardTitle>
          </CardHeader>
          <CardContent className={`bg-white ${
            viewMode === 'mobile' ? 'p-4' : 'p-6'
          }`}>
            <p className={`text-gray-800 leading-relaxed ${
              viewMode === 'mobile' ? 'text-sm' : 'text-base'
            }`}>
              {reportContent.summary}
            </p>
          </CardContent>
        </Card>

        {/* 상세 분석 */}
        <Card className="bg-white border border-gray-200 shadow-md">
          <CardHeader className={`bg-gray-50 border-b border-gray-200 ${
            viewMode === 'mobile' ? 'p-4' : 'p-6'
          }`}>
            <CardTitle className={`flex items-center gap-2 text-gray-900 ${
              viewMode === 'mobile' ? 'text-lg' : 'text-xl'
            }`}>
              <FileText className={`text-green-600 ${
                viewMode === 'mobile' ? 'w-4 h-4' : 'w-5 h-5'
              }`} />
              상세 분석 결과
            </CardTitle>
          </CardHeader>
          <CardContent className={`bg-white ${
            viewMode === 'mobile' ? 'p-4' : 'p-6'
          }`}>
            <div className="prose max-w-none text-gray-800">
              <div 
                className={`leading-relaxed ${
                  viewMode === 'mobile' ? 'text-sm' : 'text-base'
                }`}
                style={{
                  color: '#374151',
                  lineHeight: '1.75'
                }}
                dangerouslySetInnerHTML={{ 
                  __html: reportContent.detailedAnalysis
                    .replace(/\n/g, '<br>')
                    .replace(/### /g, `<h3 style="color: #1f2937; font-weight: 600; margin: 1rem 0 0.5rem 0; font-size: ${viewMode === 'mobile' ? '1rem' : '1.1rem'};">`)
                    .replace(/## /g, `<h2 style="color: #111827; font-weight: 700; margin: 1.5rem 0 0.75rem 0; font-size: ${viewMode === 'mobile' ? '1.1rem' : '1.25rem'};">`)
                    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #1f2937;">$1</strong>')
                    .replace(/- /g, '• ')
                }} 
              />
            </div>
          </CardContent>
        </Card>

        {/* 메타데이터 */}
        <Card className="bg-white border border-gray-200 shadow-md">
          <CardHeader className={`bg-gray-50 border-b border-gray-200 ${
            viewMode === 'mobile' ? 'p-4' : 'p-6'
          }`}>
            <CardTitle className={`flex items-center gap-2 text-gray-900 ${
              viewMode === 'mobile' ? 'text-lg' : 'text-xl'
            }`}>
              <Settings className={`text-gray-600 ${
                viewMode === 'mobile' ? 'w-4 h-4' : 'w-5 h-5'
              }`} />
              분석 정보
            </CardTitle>
          </CardHeader>
          <CardContent className={`bg-white ${
            viewMode === 'mobile' ? 'p-4' : 'p-6'
          }`}>
            <div className={`grid gap-4 ${
              viewMode === 'mobile' 
                ? 'grid-cols-1 text-xs' 
                : 'grid-cols-1 md:grid-cols-3 text-sm'
            }`}>
              <div>
                <span className="font-semibold text-gray-700">분석 일시:</span>
                <div className="text-gray-800 mt-1">{reportContent.metadata.analysisDate}</div>
              </div>
              <div>
                <span className="font-semibold text-gray-700">분석 엔진 버전:</span>
                <div className="text-gray-800 mt-1">basic-gemini-v1</div>
              </div>
              <div>
                <span className="font-semibold text-gray-700">데이터 품질:</span>
                <div className="text-gray-800 mt-1">{reportContent.metadata.dataQuality}</div>
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
        <div className="flex items-center justify-center py-12 bg-white rounded-lg m-6 border border-gray-200 shadow-sm">
          <div className="text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
            <p className="text-gray-800 font-medium">리포트를 불러오는 중...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center py-12 bg-white rounded-lg m-6 border border-red-200 shadow-sm">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
            <p className="text-red-700 font-semibold mb-2">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadReportContent}
              className="mt-4 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
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
      <DialogContent 
        className={`${
          isFullscreen 
            ? 'max-w-[95vw] max-h-[95vh]' 
            : viewMode === 'mobile'
              ? '!w-[375px] !max-w-[375px] max-h-[90vh]'
              : '!w-[1180px] !max-w-none max-h-[95vh]'
        } overflow-hidden flex flex-col bg-white border border-gray-200 shadow-2xl`}
        style={{
          width: isFullscreen 
            ? '95vw' 
            : viewMode === 'mobile' 
              ? '375px' 
              : '1180px',
          maxWidth: isFullscreen 
            ? '95vw' 
            : viewMode === 'mobile' 
              ? '375px' 
              : 'none'
        }}
      >
        <DialogHeader className="flex-shrink-0 pb-4 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-gray-900">
                <Monitor className="w-5 h-5 text-blue-600" />
                {rendererName}
              </DialogTitle>
              <DialogDescription className="text-base text-gray-700 font-medium mt-1">
                {(report?.title) || (report?.engineName ? `${report.engineName} 분석 리포트` : '분석 리포트')}
              </DialogDescription>
              {actualRenderer && (
                <div className="text-sm text-gray-500 mt-1">
                  {actualRenderer.description.length > 20 ? actualRenderer.description.substring(0, 20) + '...' : actualRenderer.description}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              {/* 뷰 모드 전환 버튼 */}
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'desktop' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('desktop')}
                  className={`px-3 py-1 text-xs rounded-none ${
                    viewMode === 'desktop' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Monitor className="w-3 h-3 mr-1" />
                  데스크톱
                </Button>
                <Button
                  variant={viewMode === 'mobile' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('mobile')}
                  className={`px-3 py-1 text-xs rounded-none ${
                    viewMode === 'mobile' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Smartphone className="w-3 h-3 mr-1" />
                  모바일
                </Button>
              </div>

              {/* PDF 다운로드 버튼 */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadReport}
                disabled={isDownloading}
                className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {isDownloading ? 'PDF 생성중...' : 'PDF 다운로드'}
              </Button>
              
              {/* 전체화면 버튼 */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="flex items-center gap-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
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
        <div className="flex-1 overflow-y-auto pr-2 bg-gray-50">
          {renderReportContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
} 