/**
 * AI 리포트 뷰어 모달 컴포넌트
 * 선택된 뷰어를 사용해서 리포트를 표시하는 모달
 */

import React, { useState, useEffect } from 'react';
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
import JsonViewer from './JsonViewer';
import { 
  Brain, 
  Eye, 
  Download,
  Camera, 
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
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [actualRenderer, setActualRenderer] = useState<any>(null);
  const [rendererName, setRendererName] = useState(viewerName || '웹 뷰어');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportContent, setReportContent] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  // 모바일 기기 자동 감지
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>(() => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      return isMobile ? 'mobile' : 'desktop';
    }
    return 'desktop';
  });

  /**
   * 전체화면 모드 토글
   */
  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  // 실제 렌더러 찾기 (viewMode에 따라 모바일/웹 렌더러 선택)
  useEffect(() => {
    console.log('렌더러 찾는 중...');
    if (report && isOpen) {
      try {
        // report에서 engineId를 가져와서 적절한 렌더러 찾기
        const engineId = report.engineId || report.engineName || 'basic-gemini-v1';
        
        // 모든 등록된 렌더러 확인
        const allRenderers = rendererRegistry.getAll();
        
        // 🎯 viewMode에 따라 적절한 렌더러 선택
        let targetRenderer = null;
        
        
        // 1. engineId가 basic-gemini-v1이면 viewMode에 따라 렌더러 선택
        if (engineId === 'basic-gemini-v1') {
          if (viewMode === 'mobile') {
            targetRenderer = rendererRegistry.get('basic-gemini-v1-mobile');
            if (targetRenderer) {
              console.log('모바일 렌더러 찾음');
            } else {
              console.log('모바일 렌더러 못 찾음');
            }
          } else {
            targetRenderer = rendererRegistry.get('basic-gemini-v1-web');
          }
        }
        
        // 2. 전용 렌더러가 없으면 selectBestRenderer 시도
        if (!targetRenderer) {
          targetRenderer = selectBestRenderer(engineId, 'web');
        }
        
        // 3. 여전히 없으면 첫 번째 웹 렌더러 사용
        if (!targetRenderer) {
          targetRenderer = allRenderers.find(r => r.outputFormat === 'web');
        }
        
        if (targetRenderer) {
          setActualRenderer(targetRenderer);
          setRendererName(targetRenderer.name);
        } else {
          console.error('렌더러를 찾을 수 없습니다.');
        }
      } catch (error) {
        console.error('렌더러 초기화 중 오류:', error);
        setRendererName('기본 웹 뷰어');
      }
    }
  }, [report, isOpen, viewMode]); // viewMode 추가

  // 리포트 데이터 로드
  useEffect(() => {
    if (isOpen && report && actualRenderer) {
      loadReportContent();
    }
  }, [isOpen, report, viewerId, actualRenderer]);

  // report 유효성 재검증
  useEffect(() => {
    if (isOpen && !report) {
      onClose();
    }
  }, [isOpen, report, onClose]);

  const loadReportContent = async () => {
    console.log('리포트 컨텐츠 로딩 시작');
    // 🔍 실제 받은 report 데이터 구조 확인
    console.log('리포트 데이터 구조:', {
      reportKeys: Object.keys(report || {}),
      hasPersonalInfo: !!report?.personalInfo,
      hasInsights: !!report?.insights,
      hasRawData: !!report?.rawData,
      hasAnalysisResults: !!report?.analysisResults
    });
    setIsLoading(true);
    setError(null);
    
    try {
      // EEG Advanced 엔진 결과는 JSON 뷰어로 표시
      const engineId = report.engineId || report.engineName || 'basic-gemini-v1';
      if (engineId === 'eeg-advanced-gemini-v1') {
        console.log('🧠 EEG Advanced 결과를 JSON으로 표시');
        
        // EEG Advanced 분석 결과 추출
        const eegAdvancedData = report.rawData?.eegAdvancedAnalysis || report;
        
        setReportContent({
          isEEGAdvanced: true,
          jsonData: eegAdvancedData,
          metadata: {
            analysisDate: new Date().toLocaleDateString(),
            engineName: 'EEG Advanced Gemini v1',
            processingTime: `${report?.processingTime || 0}ms`,
            dataQuality: '우수',
            engineId: engineId
          }
        });
        
        setIsLoading(false);
        return;
      }
      
      if (actualRenderer && (actualRenderer.id === 'basic-gemini-v1-web' || actualRenderer.id === 'basic-gemini-v1-mobile')) {
        
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
        console.log('리포트 상세 구조:', {
          reportKeys: Object.keys(report || {}),
          hasInsights: !!report?.insights,
          hasRawData: !!report?.rawData,
          hasAnalysisResults: !!report?.analysisResults,
          insightsDetailedAnalysisType: typeof report?.insights?.detailedAnalysis,
          rawDataDetailedAnalysisType: typeof report?.rawData?.detailedAnalysis,
          hasRawDataDetailedAnalysis: !!report?.rawData?.detailedAnalysis
        });
        
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
            personalInfo: report.personalInfo, // 🔥 personalInfo 추가!
            insights: {
              summary: report.insights?.summary || "분석 결과를 확인하세요.",
              detailedAnalysis: report.insights?.detailedAnalysis || '',
              recommendations: report.insights?.recommendations || []
            },
            metrics: report.metrics || {},
            processingTime: report.processingTime || 1000,
            rawData: {
              detailedAnalysis: report.rawData.detailedAnalysis,
              personalInfo: report.personalInfo // 🔥 rawData에도 personalInfo 추가!
            }
          };
          
        } else if (report?.insights?.detailedAnalysis && typeof report.insights.detailedAnalysis === 'string') {
          // 문자열로 저장된 상세 분석 결과를 파싱하여 사용 (fallback)
          try {
            // insights.detailedAnalysis는 이미 마크다운 문자열이므로 그대로 사용
            actualAnalysisResult = {
              engineId: report.engineId || 'basic-gemini-v1',
              engineVersion: report.engineVersion || '1.1.0',
              timestamp: report.timestamp || new Date().toISOString(),
              analysisId: report.analysisId || 'unknown',
              overallScore: report.overallScore || 78,
              stressLevel: report.stressLevel || 45,
              focusLevel: report.focusLevel || 82,
              personalInfo: report.personalInfo, // 🔥 personalInfo 추가!
              insights: {
                summary: report.insights?.summary || "분석 결과를 확인하세요.",
                detailedAnalysis: report.insights.detailedAnalysis,
                recommendations: report.insights?.recommendations || []
              },
              metrics: report.metrics || {},
              processingTime: report.processingTime || 1000,
              rawData: {
                detailedAnalysis: {
                  // 마크다운을 구조화된 데이터로 변환하는 대신 기본값 제공
                  overallScore: report.overallScore || 78,
                  overallInterpretation: report.insights.summary || "전반적인 건강 상태를 확인하세요.",
                  markdownContent: report.insights.detailedAnalysis
                },
                personalInfo: report.personalInfo // 🔥 rawData에도 personalInfo 추가!
              }
            };
          } catch (parseError) {
            actualAnalysisResult = null;
          }
        } else {
          // 둘 다 없으면 기존 저장된 데이터에서 기본 정보라도 사용
          console.log('상세 분석 데이터 없음, 기본 정보 사용');
          
          // 기본 필드들이라도 있다면 활용
          if (report.overallScore || report.insights?.summary) {
            actualAnalysisResult = {
              engineId: report.engineId || 'basic-gemini-v1',
              engineVersion: report.engineVersion || '1.1.0',
              timestamp: report.timestamp || new Date().toISOString(),
              analysisId: report.analysisId || 'unknown',
              overallScore: report.overallScore || 78,
              stressLevel: report.stressLevel || 45,
              focusLevel: report.focusLevel || 82,
              personalInfo: report.personalInfo, // 🔥 personalInfo 추가!
              insights: {
                summary: report.insights?.summary || "분석 결과를 확인하세요.",
                detailedAnalysis: report.insights?.detailedAnalysis || '',
                recommendations: report.insights?.recommendations || []
              },
              metrics: report.metrics || {},
              processingTime: report.processingTime || 1000,
              rawData: {
                detailedAnalysis: {
                  overallScore: report.overallScore || 78,
                  overallInterpretation: "기존 저장된 데이터를 기반으로 표시하고 있습니다.",
                  markdownContent: `## 분석 결과\n전체 점수: ${report.overallScore || 78}점\n집중력: ${report.focusLevel || 0}점\n스트레스: ${report.stressLevel || 0}점\n\n기존 저장된 데이터에서 상세 분석 결과를 찾을 수 없습니다.`
                }
              }
            };
          } else {
            actualAnalysisResult = null;
          }
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
        console.log('렌더러 호출 중:', actualRenderer.id);
        
        const renderedReport = await actualRenderer.render(analysisResult, renderOptions);
        
        console.log('렌더링 완료:', {
          rendererId: renderedReport.rendererId,
          renderTime: renderedReport.renderTime
        });
        
        const reportContentData = {
          htmlContent: renderedReport.content,
          isRawHTML: true,
          metadata: {
            analysisDate: new Date().toLocaleDateString(),
            engineName: 'BasicGeminiV1',
            processingTime: `${renderedReport.renderTime}ms`,
            dataQuality: '우수',
            rendererId: renderedReport.rendererId
          }
        };
        
        console.log('리포트 컨텐츠 설정 완료');
        
        setReportContent(reportContentData);
        
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
      console.error('리포트 컨텐츠 로딩 중 오류:', error);
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

      // 폰트 로딩 대기 (텍스트 렌더링 품질 향상)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 실제 요소 크기 감지 (간단하고 정확한 방법)
      const elementRect = reportElement.getBoundingClientRect();
      const elementWidth = Math.max(elementRect.width, reportElement.scrollWidth);
      
      // 간단하고 정확한 높이 계산
      const elementHeight = Math.max(
        reportElement.offsetHeight,
        reportElement.scrollHeight,
        elementRect.height
      );
      
      // 디버깅: 높이 정보 출력
      console.log('보고서 요소 높이 정보:', {
        offsetHeight: reportElement.offsetHeight,
        scrollHeight: reportElement.scrollHeight,
        rectHeight: elementRect.height,
        finalElementHeight: elementHeight
      });

      // 고정된 캔버스 크기로 중앙 정렬 보장
      const canvasWidth = viewMode === 'mobile' ? 480 : 1050; // 고정 너비 (중앙정렬 최적화)
      const canvasHeight = elementHeight + 20; // 최소한의 여백만 추가
      
      // 디버깅: 캔버스 크기 정보 출력
      console.log('캔버스 크기 정보:', {
        canvasWidth,
        canvasHeight,
        viewMode,
        heightDifference: canvasHeight - elementHeight
      });

      // HTML을 캔버스로 변환 (고화질)
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: canvasWidth,
        height: canvasHeight,
        windowWidth: canvasWidth,
        windowHeight: canvasHeight,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        foreignObjectRendering: false,
        removeContainer: true,
        imageTimeout: 5000,
        onclone: (clonedDoc) => {
          // 복제된 문서에서 스타일 최적화
          const clonedBody = clonedDoc.body;
          if (clonedBody) {
            // body 완전 초기화 및 중앙 정렬 설정
            clonedBody.style.cssText = `
              margin: 0;
              padding: 0;
              width: ${canvasWidth}px;
              height: ${canvasHeight}px;
              background: #ffffff;
              display: flex;
              justify-content: center;
              align-items: flex-start;
              box-sizing: border-box;
              overflow: visible;
            `;
            
            // report-content 요소 정확한 중앙정렬
            const reportContent = clonedDoc.getElementById('report-content');
            if (reportContent) {
              // 캔버스 크기에 맞춰 콘텐츠 크기 조정 (중앙정렬 최적화)
              const contentWidth = viewMode === 'mobile' ? (canvasWidth - 1) : (canvasWidth - 1);
              const contentPadding = viewMode === 'mobile' ? '10px' : '40px';
              
              reportContent.style.cssText = `
                position: relative;
                margin: 0 auto;
                padding: ${contentPadding};
                width: ${contentWidth}px;
                max-width: none;
                box-sizing: border-box;
                background: transparent;
              `;
            }
            
            // 텍스트 렌더링 품질 개선 (최소한)
            const allElements = clonedBody.querySelectorAll('*');
            allElements.forEach((el: any) => {
              if (el.style) {
                el.style.lineHeight = '1.6';
                el.style.textRendering = 'optimizeLegibility';
                el.style.fontKerning = 'normal';
                el.style.webkitFontSmoothing = 'antialiased';
                el.style.mozOsxFontSmoothing = 'grayscale';
                
                // 텍스트 컨테이너 높이 자동 조정
                if (el.textContent && el.textContent.trim()) {
                  el.style.height = 'auto';
                  el.style.overflow = 'visible';
                }
                
                // Badge/Chip 요소의 텍스트 중앙정렬 처리 (강력한 버전)
                const className = (el.className && typeof el.className === 'string') ? el.className : '';
                if (className && (className.includes('badge') || className.includes('chip'))) {
                  // 현재 높이 저장
                  const currentHeight = el.offsetHeight;
                  const currentPadding = window.getComputedStyle(el).padding;
                  
                                     // 배지 컨테이너는 기본 flexbox만, 텍스트만 강제로 위로 이동
                   const originalCssText = el.style.cssText;
                   el.style.cssText = `
                     ${originalCssText}
                     display: inline-flex;
                     align-items: center;
                     justify-content: center;
                     line-height: 1;
                     vertical-align: middle;
                     text-align: center;
                     box-sizing: border-box;
                     ${currentHeight > 0 ? `height: ${currentHeight}px; min-height: ${currentHeight}px;` : ''}
                   `;
                   
                   // 주요 발견사항 섹션인지 확인
                   const isInFindingsSection = el.closest('.findings-grid') || 
                                             el.closest('.key-findings-section') ||
                                             el.closest('[class*="finding"]');
                   
                   // 텍스트만 강제로 위로 이동 (주요 발견사항 섹션의 모바일에서는 더 많이 이동)
                   let moveDistance = '-6px';
                   if (isInFindingsSection && viewMode === 'mobile') {
                     moveDistance = '-12px';
                   }
                   
                   const textNodes = Array.from(el.childNodes).filter((node: any) => node.nodeType === Node.TEXT_NODE);
                   textNodes.forEach((textNode: any) => {
                     if (textNode.textContent && textNode.textContent.trim()) {
                       const span = clonedDoc.createElement('span');
                       span.textContent = textNode.textContent;
                       span.style.cssText = `
                         display: inline-block;
                         transform: translateY(${moveDistance});
                         line-height: 1;
                         margin-top: -2px;
                       `;
                       el.replaceChild(span, textNode);
                     }
                   });
                }
                
                // 건강 요소의 라벨과 점수 텍스트 위치 조정 (배지와 정렬)
                if (className && (className.includes('element-label') || className.includes('element-value'))) {
                  el.style.transform = 'translateY(-4px)';
                }
                
                // 건강 요소별 현황에서 뇌파 건강도 "보통" 배지만 아래로 5px 이동 (PNG 출력용)
                let isInEEGHealthSection = false;
                let healthElementParent = el;
                while (healthElementParent && healthElementParent !== clonedDoc.body) {
                  if (healthElementParent.className && String(healthElementParent.className).includes('health-elements')) {
                    isInEEGHealthSection = true;
                    break;
                  }
                  healthElementParent = healthElementParent.parentElement;
                }
                
                if (isInEEGHealthSection) {
                  // React 컴포넌트 - Badge 클래스이면서 "뇌파 건강도"와 관련된 배지
                  if (className && className.includes('Badge')) {
                    // 같은 flex 컨테이너에서 "뇌파 건강도" 텍스트가 있는지 확인
                    const parentFlex = el.closest('.flex');
                    if (parentFlex) {
                      const textSpan = parentFlex.querySelector('span');
                      if (textSpan && textSpan.textContent && textSpan.textContent.includes('뇌파 건강도')) {
                        el.style.transform = 'translateY(5px)';
                      }
                    }
                  }
                  
                  // HTML 렌더러 - element-badge 클래스이면서 뇌파 건강도 라벨 옆의 배지
                  if (className && className.includes('element-badge')) {
                    const labelGroup = el.closest('.element-label-group');
                    if (labelGroup) {
                      const labelSpan = labelGroup.querySelector('.element-label');
                      if (labelSpan && labelSpan.textContent && labelSpan.textContent.includes('뇌파 건강도')) {
                        el.style.transform = 'translateY(5px)';
                      }
                    }
                  }
                }
                
                // 주요 발견사항 카드 전체 요소들을 위로 5px 이동 (PNG 출력용)
                const parentContainer = el.closest('div[class*="border-green-200"]') || 
                                      el.closest('div[class*="border-l-green"]') ||
                                      el.closest('.key-findings-card') ||
                                      el.closest('.finding-item') ||
                                      el.closest('.findings-grid');
                
                if (parentContainer) {
                  // React 컴포넌트 - 체크표시 원형 배경 위로 이동 (1px 아래 → 원래 위치)
                  if (className && (
                    className.includes('bg-green-500') && 
                    className.includes('rounded-full') && 
                    className.includes('flex')
                  )) {
                    el.style.transform = 'translateY(0px)';
                    
                    // 배경 안의 체크표시 텍스트 위치 조정 (-9px → -7px)
                    const checkIcon = el.querySelector('span');
                    if (checkIcon && checkIcon.textContent && checkIcon.textContent.includes('✓')) {
                      checkIcon.style.transform = 'translateY(-7px)';
                    }
                  }
                  
                  // HTML 렌더러 - 체크표시 원형 배경 위로 이동
                  if (className && className.includes('finding-icon')) {
                    el.style.transform = 'translateY(0px)';
                    el.style.position = 'relative';
                    
                    // 내부 텍스트 위치 조정 (-9px → -7px)
                    if (el.textContent && el.textContent.includes('✓')) {
                      const originalText = el.textContent;
                      el.innerHTML = `<span style="transform: translateY(-7px); display: inline-block;">${originalText}</span>`;
                    }
                  }
                  
                  // React 컴포넌트 - 주요 발견사항 텍스트도 위로 5px 이동
                  if (el.tagName === 'P' && className && (
                    className.includes('text-green-800') || 
                    className.includes('font-medium') ||
                    className.includes('leading-relaxed')
                  )) {
                    el.style.transform = 'translateY(-5px)';
                  }
                  
                  // HTML 렌더러 - 주요 발견사항 텍스트도 위로 5px 이동
                  if (className && className.includes('finding-text')) {
                    el.style.transform = 'translateY(-5px)';
                  }
                }
                

                
                // React 컴포넌트에서 건강 요소별 현황의 텍스트 위치 조정 (종합건강 점수 제외)
                const textContent = el.textContent ? el.textContent.trim() : '';
                const parentElement = el.parentElement;
                
                // 건강 요소별 현황 섹션에 있는지 확인
                let isInHealthElementsSection = false;
                let currentEl = el;
                while (currentEl && currentEl !== clonedDoc.body) {
                  if (currentEl.className && String(currentEl.className).includes('health-elements')) {
                    isInHealthElementsSection = true;
                    break;
                  }
                  currentEl = currentEl.parentElement;
                }
                
                // 종합건강 점수 섹션은 제외하고, 건강 요소별 현황 섹션의 텍스트만 조정
                if (isInHealthElementsSection && textContent && (
                  textContent.includes('뇌파 건강도') || 
                  textContent.includes('맥파 건강도') || 
                  textContent.includes('스트레스 관리') || 
                  (textContent.includes('/100') && parentElement && !String(parentElement.className || '').includes('gauge')) ||
                  textContent.includes('% 위험도')
                )) {
                  // 배지가 아닌 텍스트만 이동 (배지는 이미 위에서 처리됨)
                  if (!String(className || '').includes('badge') && !String(className || '').includes('chip')) {
                    el.style.transform = 'translateY(-4px)';
                  }
                }
              }
            });
          }
        }
      });

      // 이미지 다운로드
      const fileName = `AI_건강분석_리포트_${report?.userName || '사용자'}_${new Date().toISOString().split('T')[0]}.png`;
      
      // Canvas를 Blob으로 변환하여 다운로드
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          console.log('리포트 이미지 저장 완료:', fileName);
        }
      }, 'image/png', 1.0); // 최고 품질로 PNG 저장
      
    } catch (error) {
      console.error('이미지 생성 오류:', error);
      alert('이미지 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsDownloading(false);
    }
  };

  const renderUniversalWebViewer = () => {
    if (!reportContent) return null;

    return (
      <div id="report-content" className={`${
        viewMode === 'mobile' 
          ? 'space-y-4 p-3 w-full max-w-full overflow-hidden' 
          : 'space-y-6 p-6 w-[1024px] mx-auto'
      }`}>
        {/* 헤더 정보 */}
        <div className={`bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg border border-gray-200 shadow-sm ${
          viewMode === 'mobile' ? 'p-3' : 'p-6'
        } max-w-full overflow-hidden`}>
          <div className={`flex items-center justify-between mb-4 ${
            viewMode === 'mobile' ? 'flex-col gap-3' : ''
          }`}>
            <h1 className={`font-bold text-gray-900 break-words ${
              viewMode === 'mobile' ? 'text-lg text-center' : 'text-2xl'
            }`}>
              {reportContent.title}
            </h1>
            <Badge variant="outline" className={`text-sm bg-white text-gray-800 border-gray-300 font-medium ${
              viewMode === 'mobile' ? 'text-xs px-2 py-1' : ''
            }`}>
              {reportContent.metadata.engineName}
            </Badge>
          </div>
          
          <div className={`grid ${
            viewMode === 'mobile' 
              ? 'grid-cols-3 gap-2' 
              : 'grid-cols-3 gap-6'
          }`}>
            <div className={`text-center bg-white rounded-lg shadow-md border border-gray-200 ${
              viewMode === 'mobile' ? 'p-3' : 'p-6'
            } max-w-full`}>
              <div className={`font-bold text-green-700 ${
                viewMode === 'mobile' ? 'text-xl' : 'text-4xl'
              }`}>
                {reportContent.overallScore}
              </div>
              <div className={`text-gray-700 font-medium break-words ${
                viewMode === 'mobile' ? 'text-xs' : 'text-base'
              }`}>
                종합 점수
              </div>
            </div>
            <div className={`text-center bg-white rounded-lg shadow-md border border-gray-200 ${
              viewMode === 'mobile' ? 'p-3' : 'p-6'
            } max-w-full`}>
              <div className={`font-bold text-orange-600 ${
                viewMode === 'mobile' ? 'text-xl' : 'text-4xl'
              }`}>
                {reportContent.stressLevel}
              </div>
              <div className={`text-gray-700 font-medium break-words ${
                viewMode === 'mobile' ? 'text-xs' : 'text-base'
              }`}>
                스트레스
              </div>
            </div>
            <div className={`text-center bg-white rounded-lg shadow-md border border-gray-200 ${
              viewMode === 'mobile' ? 'p-3' : 'p-6'
            } max-w-full`}>
              <div className={`font-bold text-blue-700 ${
                viewMode === 'mobile' ? 'text-xl' : 'text-4xl'
              }`}>
                {reportContent.focusLevel}
              </div>
              <div className={`text-gray-700 font-medium break-words ${
                viewMode === 'mobile' ? 'text-xs' : 'text-base'
              }`}>
                집중도
              </div>
            </div>
          </div>
        </div>

        {/* 요약 */}
        <Card className="bg-white border border-gray-200 shadow-md max-w-full">
          <CardHeader className={`bg-gray-50 border-b border-gray-200 ${
            viewMode === 'mobile' ? 'p-3' : 'p-6'
          }`}>
            <CardTitle className={`flex items-center gap-2 text-gray-900 ${
              viewMode === 'mobile' ? 'text-base' : 'text-xl'
            }`}>
              <Brain className={`text-blue-600 ${
                viewMode === 'mobile' ? 'w-4 h-4' : 'w-5 h-5'
              }`} />
              분석 요약
            </CardTitle>
          </CardHeader>
          <CardContent className={`bg-white ${
            viewMode === 'mobile' ? 'p-3' : 'p-6'
          } max-w-full overflow-hidden`}>
            <p className={`text-gray-800 leading-relaxed break-words ${
              viewMode === 'mobile' ? 'text-sm' : 'text-base'
            }`}>
              {reportContent.summary}
            </p>
          </CardContent>
        </Card>

        {/* 상세 분석 */}
        <Card className="bg-white border border-gray-200 shadow-md max-w-full">
          <CardHeader className={`bg-gray-50 border-b border-gray-200 ${
            viewMode === 'mobile' ? 'p-3' : 'p-6'
          }`}>
            <CardTitle className={`flex items-center gap-2 text-gray-900 ${
              viewMode === 'mobile' ? 'text-base' : 'text-xl'
            }`}>
              <FileText className={`text-green-600 ${
                viewMode === 'mobile' ? 'w-4 h-4' : 'w-5 h-5'
              }`} />
              상세 분석 결과
            </CardTitle>
          </CardHeader>
          <CardContent className={`bg-white ${
            viewMode === 'mobile' ? 'p-3' : 'p-6'
          } max-w-full overflow-hidden`}>
            <div className="prose max-w-none text-gray-800">
              <div 
                className={`leading-relaxed break-words ${
                  viewMode === 'mobile' ? 'text-sm' : 'text-base'
                }`}
                style={{
                  color: '#374151',
                  lineHeight: '1.75',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word'
                }}
                dangerouslySetInnerHTML={{ 
                  __html: (reportContent.detailedAnalysis || '')
                    .replace(/\n/g, '<br>')
                    .replace(/### /g, `<h3 style="color: #1f2937; font-weight: 600; margin: 1rem 0 0.5rem 0; font-size: ${viewMode === 'mobile' ? '0.9rem' : '1.1rem'}; word-wrap: break-word;">`)
                    .replace(/## /g, `<h2 style="color: #111827; font-weight: 700; margin: 1.5rem 0 0.75rem 0; font-size: ${viewMode === 'mobile' ? '1rem' : '1.25rem'}; word-wrap: break-word;">`)
                    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #1f2937;">$1</strong>')
                    .replace(/- /g, '• ')
                }} 
              />
            </div>
          </CardContent>
        </Card>

        {/* 메타데이터 */}
        <Card className="bg-white border border-gray-200 shadow-md max-w-full">
          <CardHeader className={`bg-gray-50 border-b border-gray-200 ${
            viewMode === 'mobile' ? 'p-3' : 'p-6'
          }`}>
            <CardTitle className={`flex items-center gap-2 text-gray-900 ${
              viewMode === 'mobile' ? 'text-base' : 'text-xl'
            }`}>
              <Settings className={`text-gray-600 ${
                viewMode === 'mobile' ? 'w-4 h-4' : 'w-5 h-5'
              }`} />
              분석 정보
            </CardTitle>
          </CardHeader>
          <CardContent className={`bg-white ${
            viewMode === 'mobile' ? 'p-3' : 'p-6'
          } max-w-full overflow-hidden`}>
            <div className={`grid gap-3 ${
              viewMode === 'mobile' 
                ? 'grid-cols-1 text-xs' 
                : 'grid-cols-1 md:grid-cols-3 text-sm'
            }`}>
              <div className="break-words">
                <span className="font-semibold text-gray-700">분석 일시:</span>
                <div className="text-gray-800 mt-1">{reportContent.metadata.analysisDate}</div>
              </div>
              <div className="break-words">
                <span className="font-semibold text-gray-700">분석 엔진 버전:</span>
                <div className="text-gray-800 mt-1">basic-gemini-v1</div>
              </div>
              <div className="break-words">
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
    console.log('BasicGemini 뷰어 렌더링:', {
      hasReportContent: !!reportContent,
      isRawHTML: reportContent?.isRawHTML,
      hasHtmlContent: !!reportContent?.htmlContent,
      actualRendererId: actualRenderer?.id
    });
    // BasicGemini 전용 뷰어 (복잡한 리포트 렌더러 사용)
    if (reportContent?.isRawHTML && reportContent?.htmlContent) {
      // 모바일 렌더러가 생성한 완전한 HTML 문서에서 body 내용과 스타일 추출
      if (actualRenderer?.id === 'basic-gemini-v1-mobile') {
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(reportContent.htmlContent, 'text/html');
        
        console.log('모바일 렌더러 HTML 파싱 완료');
        
        // 스타일 추출
        const styles = Array.from(doc.querySelectorAll('style'))
          .map(style => style.innerHTML)
          .join('\n');
          
        // body 내용 추출
        const bodyContent = doc.body?.innerHTML || reportContent.htmlContent;
        
        return (
          <div id="report-content" className="w-full">
            {/* 모바일 렌더러 스타일 삽입 */}
            <style dangerouslySetInnerHTML={{ __html: styles }} />
            {/* body 내용 렌더링 */}
            <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
          </div>
        );
      } else {
        // 일반 웹 렌더러의 경우 그대로 표시
        return (
          <div 
            id="report-content" 
            className="w-full"
            dangerouslySetInnerHTML={{ __html: reportContent.htmlContent }}
          />
        );
      }
    } else {
      console.log('데이터가 없어 fallback 사용');
    }
    
    // 데이터가 없는 경우 안내 메시지
    if (actualRenderer?.id === 'basic-gemini-v1-mobile') {
      return (
        <div className="flex items-center justify-center py-12 bg-white rounded-lg m-6 border border-blue-200 shadow-sm">
          <div className="text-center">
            <Smartphone className="w-12 h-12 mx-auto mb-4 text-blue-600" />
            <p className="text-blue-700 font-semibold mb-2">모바일 최적화 리포트 준비 중</p>
            <p className="text-gray-600 text-sm">모바일에 최적화된 리포트를 생성하고 있습니다.</p>
          </div>
        </div>
      );
    }
    
    // 일반 뷰어로 fallback
    return renderUniversalWebViewer();
  };

  const renderReportContent = () => {
    console.log('리포트 컨텐츠 렌더링 시작');
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

    // EEG Advanced 결과는 JSON 뷰어로 표시
    if (reportContent?.isEEGAdvanced) {
      return (
        <div id="report-content" className="p-6 space-y-6">
          <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">
                EEG 전문 분석 결과
              </h1>
              <Badge variant="outline" className="text-sm bg-white text-gray-800 border-gray-300 font-medium">
                {reportContent.metadata.engineName}
              </Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-6 mt-4">
              <div className="text-center bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="text-2xl font-bold text-blue-700">JSON</div>
                <div className="text-gray-700 font-medium">데이터 형식</div>
              </div>
              <div className="text-center bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="text-2xl font-bold text-green-700">{reportContent.metadata.processingTime}</div>
                <div className="text-gray-700 font-medium">처리 시간</div>
              </div>
              <div className="text-center bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="text-2xl font-bold text-purple-700">{reportContent.metadata.dataQuality}</div>
                <div className="text-gray-700 font-medium">데이터 품질</div>
              </div>
            </div>
          </div>
          
          <JsonViewer 
            data={reportContent.jsonData} 
            title="EEG 전문 분석 결과"
            className="shadow-lg"
          />
        </div>
      );
    }

    // 실제 선택된 렌더러 기준으로 렌더링
    console.log('렌더러 선택:', actualRenderer?.id);
    if (actualRenderer && (actualRenderer.id === 'basic-gemini-v1-web' || actualRenderer.id === 'basic-gemini-v1-mobile')) {
      return renderBasicGeminiViewer();
    }

    // 기본 Universal Web Viewer 사용
    return renderUniversalWebViewer();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`${
          isFullscreen 
            ? 'max-w-[100vw] max-h-[100vh] !rounded-none !m-0' 
            : viewMode === 'mobile'
              ? '!w-[390px] !max-w-[390px] max-h-[90vh]'
              : '!w-[1180px] !max-w-none max-h-[95vh]'
        } overflow-hidden flex flex-col bg-white border border-gray-200 shadow-2xl`}
        style={{
          width: isFullscreen 
            ? '100vw' 
            : viewMode === 'mobile' 
              ? '390px' 
              : '1180px',
          height: isFullscreen 
            ? '100vh' 
            : undefined,
          maxWidth: isFullscreen 
            ? '100vw' 
            : viewMode === 'mobile' 
              ? '390px' 
              : 'none',
          maxHeight: isFullscreen 
            ? '100vh' 
            : undefined,
          borderRadius: isFullscreen 
            ? '0' 
            : undefined,
          margin: isFullscreen 
            ? '0' 
            : undefined
        }}
      >
        <DialogHeader className="flex-shrink-0 pb-4 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-gray-900">
                <Monitor className="w-5 h-5 text-blue-600" />
                {rendererName}
              </DialogTitle>
              {!isFullscreen && (
                <>
                  <DialogDescription className="text-base text-gray-700 font-medium mt-1">
                    {(report?.title) || (report?.engineName ? `${report.engineName} 분석 리포트` : '분석 리포트')}
                  </DialogDescription>
                  {actualRenderer && (
                    <div className="text-sm text-gray-500 mt-1">
                      {actualRenderer.description.length > 20 ? actualRenderer.description.substring(0, 20) + '...' : actualRenderer.description}
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="flex items-center gap-1 justify-end flex-wrap">
              {/* 뷰 모드 전환 버튼 */}
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'desktop' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('desktop')}
                  className={`px-2 py-1 text-xs rounded-none ${
                    viewMode === 'desktop' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Monitor className="w-3 h-3" />
                </Button>
                <Button
                  variant={viewMode === 'mobile' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('mobile')}
                  className={`px-2 py-1 text-xs rounded-none ${
                    viewMode === 'mobile' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Smartphone className="w-3 h-3" />
                </Button>
              </div>

              {/* 이미지 저장 버튼 */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadReport}
                disabled={isDownloading}
                className="flex items-center gap-1 px-2 py-1 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50"
                title="이미지로 저장"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                  {isDownloading ? '생성중...' : '저장'}
                </span>
              </Button>
              
              {/* 전체화면 보기 버튼 */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleFullscreen}
                className="flex items-center gap-1 px-2 py-1 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                title={isFullscreen ? "일반 크기로 보기" : "전체화면으로 보기"}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                  {isFullscreen ? "일반" : "전체"}
                </span>
              </Button>

            </div>
          </div>
        </DialogHeader>

        {/* 스크롤 가능한 콘텐츠 영역 */}
        <div 
          className={`flex-1 overflow-y-auto bg-gray-50 ${
            viewMode === 'mobile' ? 'px-1' : 'pr-2'
          }`}
        >
          {renderReportContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
} 