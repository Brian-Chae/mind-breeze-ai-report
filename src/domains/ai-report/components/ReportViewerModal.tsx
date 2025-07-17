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
    console.log('🔍 렌더러 찾기 시작 - report:', !!report, 'isOpen:', isOpen);
    
    if (report && isOpen) {
      try {
        // report에서 engineId를 가져와서 적절한 렌더러 찾기
        const engineId = report.engineId || report.engineName || 'basic-gemini-v1';
        console.log('🔍 engineId:', engineId);
        
        // 모든 등록된 렌더러 확인
        const allRenderers = rendererRegistry.getAll();
        console.log('🔍 등록된 모든 렌더러:', allRenderers.map(r => ({ id: r.id, name: r.name, outputFormat: r.outputFormat })));
        
        // 🎯 직접 ID로 검색하기 (더 확실한 방법)
        let targetRenderer = null;
        
        // 1. engineId가 basic-gemini-v1이면 전용 렌더러 찾기
        if (engineId === 'basic-gemini-v1') {
          targetRenderer = rendererRegistry.get('basic-gemini-v1-web');
          console.log('🔍 basic-gemini-v1-web 렌더러 직접 검색 결과:', targetRenderer);
        }
        
        // 2. 전용 렌더러가 없으면 selectBestRenderer 시도
        if (!targetRenderer) {
          targetRenderer = selectBestRenderer(engineId, 'web');
          console.log('🔍 selectBestRenderer 결과:', targetRenderer);
        }
        
        // 3. 여전히 없으면 첫 번째 웹 렌더러 사용
        if (!targetRenderer) {
          targetRenderer = allRenderers.find(r => r.outputFormat === 'web');
          console.log('🔍 첫 번째 웹 렌더러 선택:', targetRenderer);
        }
        
        if (targetRenderer) {
          setActualRenderer(targetRenderer);
          setRendererName(targetRenderer.name);
          console.log('✅ 최종 선택된 렌더러:', targetRenderer.name, '(ID:', targetRenderer.id, ')');
        } else {
          console.error('❌ 어떤 웹 렌더러도 찾을 수 없음');
        }
      } catch (error) {
        console.error('❌ 렌더러 선택 중 오류:', error);
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
    console.log('🚀 ReportViewerModal loadReportContent 시작');
    console.log('🚀 actualRenderer:', actualRenderer);
    console.log('🚀 actualRenderer.id:', actualRenderer?.id);
    console.log('🚀 report 존재 여부:', !!report);
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (actualRenderer && actualRenderer.id === 'basic-gemini-v1-web') {
        console.log('🎯 BasicGeminiV1WebRenderer 사용하여 리포트 렌더링');
        
        // 실제 렌더러를 사용해서 HTML 생성
        const renderOptions = {
          language: 'ko',
          webOptions: {
            theme: 'light',
            interactive: true
          }
        };
        
        // 🎯 실제 리포트 데이터 사용 (report에서 가져오기)
        let actualAnalysisResult;
        
        // 📊 디버깅: 실제 report 구조 확인
        console.log('🔍 실제 report 전체 구조:', report);
        console.log('🔍 report.analysisResults:', report?.analysisResults);
        console.log('🔍 report.rawData:', report?.rawData);
        console.log('🔍 insights.detailedAnalysis 타입:', typeof report?.analysisResults?.detailedAnalysis);
        console.log('🔍 rawData.detailedAnalysis 타입:', typeof report?.rawData?.detailedAnalysis);
        console.log('🔍 rawData.detailedAnalysis 내용:', report?.rawData?.detailedAnalysis);
        
        // 🎯 우선순위: rawData.detailedAnalysis 객체 > insights.detailedAnalysis 문자열 파싱
        if (report?.rawData?.detailedAnalysis && typeof report.rawData.detailedAnalysis === 'object') {
          // rawData에 detailedAnalysis 객체가 있으면 직접 사용 (가장 완전한 데이터)
          actualAnalysisResult = {
            engineId: report.engineId || 'basic-gemini-v1',
            engineVersion: report.engineVersion || '1.1.0',
            timestamp: report.timestamp || new Date().toISOString(),
            analysisId: report.analysisId || 'unknown',
            overallScore: report.overallScore || 78,
            stressLevel: report.stressLevel || 45,
            focusLevel: report.focusLevel || 82,
            insights: {
              summary: report.analysisResults?.recommendations?.join(' ') || "분석 결과를 확인하세요."
            },
            metrics: report.metrics || {},
            processingTime: report.processingTime || 1000,
            rawData: {
              detailedAnalysis: report.rawData.detailedAnalysis
            }
          };
          console.log('✅ rawData.detailedAnalysis 객체 직접 사용:', report.rawData.detailedAnalysis);
          
        } else if (report?.analysisResults?.detailedAnalysis && typeof report.analysisResults.detailedAnalysis === 'string') {
          // 문자열로 저장된 상세 분석 결과를 파싱하여 사용 (fallback)
          try {
            const parsedDetailedAnalysis = JSON.parse(report.analysisResults.detailedAnalysis);
            actualAnalysisResult = {
              overallScore: report.analysisResults.mentalHealthScore || 78,
              insights: {
                summary: report.analysisResults.recommendations?.join(' ') || "분석 결과를 확인하세요."
              },
              rawData: {
                detailedAnalysis: parsedDetailedAnalysis
              }
            };
            console.log('✅ 파싱된 실제 분석 결과 사용:', parsedDetailedAnalysis);
          } catch (parseError) {
            console.warn('⚠️ 분석 결과 파싱 실패, null 설정:', parseError);
            actualAnalysisResult = null;
          }
        } else {
          // 둘 다 없으면 null 설정하여 fallback 데이터 사용
          console.warn('⚠️ detailedAnalysis 데이터를 찾을 수 없음, fallback 사용');
          actualAnalysisResult = null;
        }
        
        // 실제 데이터가 없으면 fallback mock 데이터 사용
        const analysisResult = actualAnalysisResult || {
          overallScore: 78,
          insights: {
            summary: "전반적인 건강 상태가 양호하며, 스트레스 수준은 보통입니다."
          },
          rawData: {
            detailedAnalysis: {
              overallScore: 78,
              overallInterpretation: "실제 분석 결과를 로드할 수 없어 기본 데이터를 표시합니다.",
              
              eegAnalysis: {
                score: 75,
                interpretation: "뇌파 분석 결과 집중력과 이완 상태가 전반적으로 양호합니다.",
                keyFindings: [
                  "알파파 활동이 안정적으로 유지됨",
                  "집중 상태에서 베타파 증가 패턴 확인"
                ],
                concerns: [
                  "스트레스 상황에서 일시적인 고주파 활동 증가"
                ]
              },
              
              ppgAnalysis: {
                score: 82,
                interpretation: "심혈관 건강 상태가 우수하며, 자율신경계 균형이 양호합니다.",
                keyFindings: [
                  "안정적인 심박변이도 패턴",
                  "정상 범위의 혈관 탄력성"
                ],
                concerns: []
              },
              
              demographicAnalysis: {
                ageSpecific: "연령대 평균보다 우수한 건강 지표를 보여줍니다.",
                genderSpecific: "성별 특성을 고려한 분석 결과 정상 범위 내에 있습니다.",
                combinedInsights: [
                  "연령과 성별을 고려했을 때 건강한 상태"
                ]
              },
              
              occupationalAnalysis: {
                jobSpecificRisks: [
                  "직업 특성상 발생할 수 있는 건강 위험"
                ],
                workplaceRecommendations: [
                  "정기적인 휴식 및 스트레칭"
                ],
                careerHealthTips: [
                  "정기적인 건강검진"
                ]
              },
              
              improvementPlan: {
                immediate: [
                  "규칙적인 깊은 호흡 연습"
                ],
                shortTerm: [
                  "주 3회 이상 규칙적인 운동"
                ],
                longTerm: [
                  "생활 패턴 개선"
                ]
              }
            }
          }
        };
        
        // 실제 렌더러로 HTML 생성
        const renderedReport = await actualRenderer.render(analysisResult, renderOptions);
        
        setReportContent({
          htmlContent: renderedReport.content,
          isRawHTML: true,
          metadata: {
            analysisDate: new Date().toLocaleDateString(),
            engineName: 'BasicGeminiV1',
            processingTime: `${renderedReport.renderTime}ms`,
            dataQuality: '우수',
            rendererId: renderedReport.rendererId
          }
        });
        
      } else {
        // 기본 mock 데이터 사용 (다른 렌더러들)
        await new Promise(resolve => setTimeout(resolve, 1000)); // 로딩 시뮬레이션
        
        const mockReportContent = {
          title: (report?.title) || (report?.engineName ? `${report.engineName} 분석 리포트` : '분석 리포트'),
          summary: "전반적인 건강 상태가 양호하며, 스트레스 수준은 보통입니다.",
          overallScore: 78,
          stressLevel: 45,
          focusLevel: 82,
          detailedAnalysis: `기본 뷰어 - 상세 분석 내용...`,
          metadata: {
            analysisDate: new Date().toLocaleDateString(),
            engineName: report?.engineName || '기본 분석',
            processingTime: `${report?.processingTime || 3.2}초`,
            dataQuality: '우수'
          }
        };
        
        setReportContent(mockReportContent);
      }
      
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
    // BasicGemini 전용 뷰어 (복잡한 리포트 렌더러 사용)
    if (reportContent?.isRawHTML && reportContent?.htmlContent) {
      return (
        <div 
          id="report-content" 
          className="w-full"
          dangerouslySetInnerHTML={{ __html: reportContent.htmlContent }}
        />
      );
    }
    
    // 일반 뷰어로 fallback
    return renderUniversalWebViewer();
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