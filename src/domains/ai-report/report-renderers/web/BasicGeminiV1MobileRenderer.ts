/**
 * Gemini V1용 모바일 전용 렌더러
 * BasicGeminiV1Engine의 분석 결과를 모바일에 최적화된 HTML 형태로 렌더링
 */

import { 
  IReportRenderer, 
  OutputFormat,
  RenderOptions, 
  RenderedReport, 
  ReportTemplate, 
  RendererCapabilities 
} from '../../core/interfaces/IReportRenderer';
import { AnalysisResult } from '../../core/interfaces/IAIEngine';
import { BasicGeminiV1WebRenderer } from './BasicGeminiV1WebRenderer';

// 상세 분석 결과 인터페이스 (웹 렌더러와 동일)
interface DetailedAnalysisResult {
  overallScore: number;
  overallInterpretation: string;
  
  markdownContent?: string;
  
  eegAnalysis?: {
    score: number;
    interpretation: string;
    keyFindings: string[];
    concerns: string[];
  };
  
  ppgAnalysis?: {
    score: number;
    interpretation: string;
    keyFindings: string[];
    concerns: string[];
  };
  
  demographicAnalysis?: {
    ageSpecific: string;
    genderSpecific: string;
    combinedInsights: string[];
  };
  
  occupationalAnalysis?: {
    jobSpecificRisks: string[];
    workplaceRecommendations: string[];
    careerHealthTips: string[];
  };
  
  improvementPlan?: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

export class BasicGeminiV1MobileRenderer implements IReportRenderer {
  // 기본 정보
  readonly id = 'basic-gemini-v1-mobile';
  readonly name = 'Gemini V1 모바일 렌더러';
  readonly description = 'BasicGeminiV1Engine 결과를 모바일에 최적화된 HTML 리포트로 렌더링하는 모바일 전용 렌더러';
  readonly version = '1.0.0';
  readonly outputFormat: OutputFormat = 'web';
  
  // 비용 및 기능
  readonly costPerRender = 0; // 무료
  readonly supportedEngines = ['basic-gemini-v1']; // BasicGeminiV1Engine 전용
  
  readonly capabilities: RendererCapabilities = {
    supportedFormats: ['web'],
    supportedLanguages: ['ko', 'en'],
    maxContentSize: 5 * 1024 * 1024, // 5MB (모바일 최적화)
    supportsInteractivity: true,
    supportsBranding: true,
    supportsCharts: true
  };

  /**
   * 리포트 렌더링
   */
  async render(analysis: AnalysisResult, options: RenderOptions = {}): Promise<RenderedReport> {
    const startTime = Date.now();
    const reportId = `${this.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // 분석 결과 검증
      const isValid = await this.validateAnalysis(analysis);
      if (!isValid) {
        throw new Error('분석 결과가 유효하지 않습니다.');
      }

      // 모바일 최적화 HTML 생성
      const htmlContent = await this.generateMobileHTML(analysis, options);
      
      const renderTime = Date.now() - startTime;

      return {
        rendererId: this.id,
        rendererVersion: this.version,
        timestamp: new Date().toISOString(),
        reportId,
        
        format: this.outputFormat,
        content: htmlContent,
        mimeType: 'text/html',
        
        fileSize: new Blob([htmlContent]).size,
        renderTime,
        costUsed: this.costPerRender
      };

    } catch (error) {
      const renderTime = Date.now() - startTime;
      
      // 오류 발생 시 기본 에러 페이지 반환
      const errorHTML = this.generateErrorHTML(error?.toString() || '알 수 없는 오류');
      
      return {
        rendererId: this.id,
        rendererVersion: this.version,
        timestamp: new Date().toISOString(),
        reportId,
        
        format: this.outputFormat,
        content: errorHTML,
        mimeType: 'text/html',
        
        fileSize: new Blob([errorHTML]).size,
        renderTime,
        costUsed: this.costPerRender
      };
    }
  }

  /**
   * 분석 결과 검증
   */
  async validateAnalysis(analysis: AnalysisResult): Promise<boolean> {
    if (!analysis) return false;
    if (!analysis.rawData) return false;
    
    return true;
  }

  /**
   * 지원하는 엔진인지 확인
   */
  supportsEngine(engineId: string): boolean {
    return this.supportedEngines.includes(engineId);
  }

  /**
   * 템플릿 가져오기
   */
  getTemplate(): ReportTemplate {
    return {
      id: 'mobile-comprehensive-template',
      name: '모바일 종합 건강 템플릿',
      description: '모바일에 최적화된 리스트형 레이아웃의 종합 건강 리포트 템플릿',
      supportedFormats: ['web'],
      sections: [
        {
          id: 'mobile-header',
          name: '모바일 헤더',
          type: 'header',
          required: true,
          customizable: true,
          defaultContent: 'AI 건강 분석 리포트'
        },
        {
          id: 'score-summary',
          name: '점수 요약',
          type: 'summary',
          required: true,
          customizable: false
        },
        {
          id: 'analysis-list',
          name: '분석 리스트',
          type: 'analysis',
          required: true,
          customizable: true
        },
        {
          id: 'mobile-footer',
          name: '모바일 푸터',
          type: 'footer',
          required: true,
          customizable: false
        }
      ]
    };
  }

  /**
   * 사용 가능한 템플릿 목록
   */
  getAvailableTemplates(): ReportTemplate[] {
    return [this.getTemplate()];
  }

  /**
   * 모바일 최적화 HTML 생성 (웹 렌더러 기반)
   */
  private async generateMobileHTML(analysis: AnalysisResult, options: RenderOptions): Promise<string> {
    // 웹 렌더러 인스턴스 생성
    const webRenderer = new BasicGeminiV1WebRenderer();
    
    // 웹 렌더러로 HTML 생성
    const webResult = await webRenderer.render(analysis, options);
    
    // content를 string으로 변환
    const webHTMLContent = typeof webResult.content === 'string' 
      ? webResult.content 
      : webResult.content.toString();
    
    // HTML에서 CSS 부분만 모바일용으로 교체
    const mobileHTML = this.convertWebToMobileHTML(webHTMLContent, options);
    
    return mobileHTML;
  }

  /**
   * 웹 HTML을 모바일용으로 변환
   */
  private convertWebToMobileHTML(webHTML: string, options: RenderOptions): string {
    const theme = options.webOptions?.theme || 'light';
    
    // 웹 렌더러의 CSS를 모바일 CSS로 교체
    const mobileHTML = webHTML.replace(
      /<style>[\s\S]*?<\/style>/,
      `<style>${this.getMobileCSS(theme, options)}</style>`
    );
    
    // viewport 메타 태그를 모바일에 최적화
    return mobileHTML.replace(
      /<meta name="viewport"[^>]*>/,
      '<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">'
    );
  }

  /**
   * 모바일 전용 CSS
   */
  private getMobileCSS(theme: string, options: RenderOptions): string {
    const primaryColor = options.brandColors?.primary || '#3B82F6';
    const secondaryColor = options.brandColors?.secondary || '#6B7280';
    const accentColor = options.brandColors?.accent || '#10B981';
    
    const isDark = theme === 'dark';
    const bgColor = isDark ? '#1F2937' : '#F8FAFC';
    const textColor = isDark ? '#F9FAFB' : '#1F2937';
    const cardBg = isDark ? '#374151' : '#FFFFFF';
    const borderColor = isDark ? '#4B5563' : '#E5E7EB';
    
    return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.5;
            color: ${textColor};
            background-color: ${bgColor};
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            font-size: 14px;
            overflow-x: hidden;
        }
        
        .report-container {
            max-width: 100%;
            margin: 0;
            padding: 16px;
            width: 100%;
            box-sizing: border-box;
            overflow-x: hidden;
        }
        
        /* 헤더 */
        .report-header {
            text-align: center;
            margin-bottom: 24px;
            padding: 20px 16px;
            background: linear-gradient(135deg, ${primaryColor}, ${accentColor});
            color: white;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .report-header .logo {
            height: 32px;
            margin-bottom: 12px;
        }
        
        .report-title {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 8px;
            line-height: 1.3;
            color: white;
        }
        
        .report-meta {
            display: flex;
            flex-direction: column;
            gap: 4px;
            font-size: 0.85rem;
            opacity: 0.9;
        }
        
        /* 섹션 공통 스타일 */
        section {
            background: ${cardBg};
            padding: 20px 16px;
            margin-bottom: 16px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            border: 1px solid ${borderColor};
        }
        
        section h2 {
            font-size: 1.3rem;
            font-weight: 700;
            color: ${textColor};
            margin-bottom: 16px;
            line-height: 1.3;
        }
        
        section h3 {
            font-size: 1.1rem;
            font-weight: 600;
            color: ${textColor};
            margin-bottom: 12px;
        }
        
        /* 점수 카드 섹션 */
        .scores-section {
            margin-bottom: 20px;
        }
        
        .scores-grid {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .score-card {
            background: ${isDark ? '#374151' : '#F8FAFC'};
            padding: 16px;
            border-radius: 10px;
            text-align: center;
            border: 1px solid ${borderColor};
        }
        
        .score-label {
            font-size: 0.9rem;
            font-weight: 500;
            color: ${secondaryColor};
            margin-bottom: 8px;
        }
        
        .score-value {
            font-size: 1.8rem;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .score-unit {
            font-size: 1rem;
            font-weight: 400;
            opacity: 0.7;
        }
        
        .score-subtitle {
            font-size: 0.8rem;
            color: ${secondaryColor};
            margin-bottom: 10px;
        }
        
        .score-bar {
            width: 100%;
            height: 6px;
            background: ${isDark ? '#6B7280' : '#E5E7EB'};
            border-radius: 3px;
            overflow: hidden;
            margin-bottom: 8px;
        }
        
        .score-fill {
            height: 100%;
            border-radius: 3px;
            transition: width 0.6s ease;
        }
        
        /* 종합 요약 그리드 */
        .summary-main-grid {
            display: flex;
            flex-direction: column;
            gap: 16px;
            margin-bottom: 20px;
        }
        
        /* 건강 점수 섹션 */
        .health-score-section {
            background: ${isDark ? '#374151' : '#F9FAFB'};
            border-radius: 12px;
            padding: 20px;
            text-align: center;
        }
        
        .score-gauge-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
        }
        
        .gauge-chart {
            position: relative;
            width: 120px;
            height: 120px;
            margin: 0 auto;
        }
        
        .gauge-chart svg {
            width: 100%;
            height: 100%;
        }
        
        .gauge-center {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
        }
        
        .gauge-value {
            font-size: 1.8rem;
            font-weight: 700;
            color: ${textColor};
        }
        
        .gauge-max {
            font-size: 0.9rem;
            color: ${secondaryColor};
        }
        
        .score-status {
            text-align: center;
        }
        
        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .status-good {
            background: #DCFCE7;
            color: #166534;
        }
        
        .status-medium {
            background: #FEF3C7;
            color: #92400E;
        }
        
        .status-bad {
            background: #FEE2E2;
            color: #991B1B;
        }
        
        .score-description {
            font-size: 0.85rem;
            color: ${secondaryColor};
            line-height: 1.5;
            margin-top: 8px;
        }
        
        /* 건강 요소별 현황 */
        .health-elements-section {
            background: ${isDark ? '#374151' : '#F9FAFB'};
            border-radius: 12px;
            padding: 20px;
        }
        
        .health-elements-grid {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-top: 12px;
        }
        
        .risk-elements-grid {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-top: 12px;
        }
        
        /* 위험도 분석 섹션 */
        .risk-analysis-section {
            background: ${isDark ? '#7F1D1D' : '#FEF2F2'};
            border: 1px solid ${isDark ? '#991B1B' : '#FECACA'};
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .risk-analysis-section .subsection-title {
            color: ${isDark ? '#FEE2E2' : '#991B1B'};
            font-weight: 700;
        }
        
        .health-element {
            background: ${cardBg};
            padding: 12px;
            border-radius: 8px;
            border: 1px solid ${borderColor};
        }
        
        .element-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .element-label-group {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        
        .element-label {
            font-size: 0.9rem;
            font-weight: 600;
            color: ${textColor};
        }
        
        .element-badge {
            font-size: 0.7rem;
            padding: 2px 6px;
            border-radius: 10px;
            font-weight: 500;
        }
        
        .element-badge.status-good {
            background: #DCFCE7;
            color: #166534;
        }
        
        .element-badge.status-medium {
            background: #FEF3C7;
            color: #92400E;
        }
        
        .element-badge.status-bad {
            background: #FEE2E2;
            color: #991B1B;
        }
        
        .element-value {
            font-size: 0.9rem;
            font-weight: 600;
            color: ${textColor};
        }
        
        /* 아이템 설명 */
        .item-description {
            font-size: 14px;
            line-height: 1.5;
            color: ${secondaryColor};
            text-align: left;
        }
        
        /* 주요 발견사항 - Chip/Badge 스타일 */
        .key-findings-section {
            margin: 16px 0;
        }
        
        .findings-grid {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 8px !important;
            margin-top: 12px !important;
        }
        
        .finding-item {
            display: inline-flex !important;
            align-items: center !important;
            background: linear-gradient(135deg, #FEF3C7, #FFFBEB) !important;
            border: none !important;
            border-radius: 16px !important;
            padding: 8px 12px !important;
            font-size: 13px !important;
            font-weight: 600 !important;
            color: #8B5A00 !important;
            line-height: 1.2 !important;
            max-width: fit-content !important;
            margin: 0 !important;
            gap: 6px !important;
            box-shadow: 0 2px 6px rgba(251, 191, 36, 0.15) !important;
            transition: all 0.2s ease !important;
            white-space: nowrap !important;
        }
        
        .finding-item:nth-child(2n) {
            background: linear-gradient(135deg, #E0F2FE, #F0F9FF) !important;
            color: #0369A1 !important;
            box-shadow: 0 2px 6px rgba(59, 130, 246, 0.15) !important;
        }
        
        .finding-item:nth-child(3n) {
            background: linear-gradient(135deg, #F0FDF4, #ECFDF5) !important;
            color: #166534 !important;
            box-shadow: 0 2px 6px rgba(34, 197, 94, 0.15) !important;
        }
        
        .finding-item:nth-child(4n) {
            background: linear-gradient(135deg, #FDF2F8, #FCE7F3) !important;
            color: #BE185D !important;
            box-shadow: 0 2px 6px rgba(236, 72, 153, 0.15) !important;
        }
        
        .finding-item:active {
            transform: scale(0.95) !important;
        }
        
        .finding-icon {
            font-size: 14px !important;
            margin: 0 !important;
            flex-shrink: 0 !important;
        }
        
        .finding-text {
            font-size: 13px !important;
            color: inherit !important;
            line-height: 1.2 !important;
            margin: 0 !important;
            font-weight: 600 !important;
            max-width: 180px !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
        }

        
        /* 분석 섹션 */
        .analysis-section {
            margin-bottom: 20px;
        }
        
        /* 점수 차트 섹션 */
        .score-chart-section {
            background: ${isDark ? '#374151' : '#F9FAFB'};
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 16px;
            border: 1px solid ${borderColor};
        }
        
        .analysis-content {
            padding: 0;
        }

        /* 분석 내용 섹션 스타일 */
        .analysis-content-section {
            margin: 16px 0;
        }

        .analysis-text {
            font-size: 0.9rem;
            line-height: 1.6;
            color: ${textColor};
            margin-bottom: 16px;
        }

        .findings-section {
            margin: 16px 0;
            padding: 16px;
            background: ${cardBg};
            border-radius: 8px;
            border-left: 4px solid #10B981;
        }

        .concerns-section {
            margin: 16px 0;
            padding: 16px;
            background: ${cardBg};
            border-radius: 8px;
            border-left: 4px solid #EF4444;
        }

        .findings-list {
            list-style: none;
            margin: 10px 0;
            padding: 0;
        }

        .findings-list li {
            padding: 6px 0;
            color: #047857;
            font-size: 0.85rem;
            line-height: 1.5;
        }

        .concerns-list {
            list-style: none;
            margin: 10px 0;
            padding: 0;
        }

        .concerns-list li {
            padding: 6px 0;
            color: #DC2626;
            font-size: 0.85rem;
            line-height: 1.5;
        }
        
        .markdown-content {
            font-size: 0.85rem;
            line-height: 1.6;
            color: ${textColor};
        }
        
        .markdown-content h2 {
            font-size: 1.1rem;
            font-weight: 600;
            color: ${textColor};
            margin: 16px 0 8px 0;
        }
        
        .markdown-content h3 {
            font-size: 1rem;
            font-weight: 600;
            color: ${textColor};
            margin: 12px 0 6px 0;
        }
        
        .markdown-content p {
            margin-bottom: 8px;
        }
        
        .markdown-content ul, .markdown-content ol {
            margin: 8px 0;
            padding-left: 20px;
        }
        
        .markdown-content li {
            margin-bottom: 4px;
            line-height: 1.5;
        }
        
        .markdown-content strong {
            font-weight: 600;
            color: ${textColor};
        }
        
        /* 개인 정보 그리드 */
        .personal-info-grid {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 16px;
        }
        
        .info-item {
            padding: 8px 12px;
            background: ${isDark ? '#4B5563' : '#F3F4F6'};
            border-radius: 8px;
            border: 1px solid ${borderColor};
        }
        
        .info-label {
            font-size: 0.75rem;
            font-weight: 600;
            color: ${secondaryColor};
            margin-bottom: 2px;
        }
        
        .info-value {
            font-size: 0.85rem;
            font-weight: 500;
            color: ${textColor};
        }
        
        /* 인구통계학적/직업적 분석 */
        .demographic-grid, .occupational-grid {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .demographic-card, .occupational-card {
            background: ${cardBg};
            padding: 16px;
            border-radius: 8px;
            border: 1px solid ${borderColor};
        }
        
        .demographic-card h4, .occupational-card h4 {
            font-size: 0.9rem;
            font-weight: 600;
            color: ${textColor};
            margin-bottom: 8px;
        }
        
        /* 개선 계획 */
        .plan-timeline {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .plan-card {
            background: ${cardBg};
            padding: 16px;
            border-radius: 8px;
            border-left: 4px solid;
        }
        
        .plan-card.immediate {
            border-left-color: #EF4444;
        }
        
        .plan-card.short-term {
            border-left-color: #F59E0B;
        }
        
        .plan-card.long-term {
            border-left-color: #10B981;
        }
        
        .plan-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }
        
        .plan-header h3 {
            font-size: 0.9rem;
            font-weight: 600;
            color: ${textColor};
            margin: 0;
        }
        
        .plan-period {
            font-size: 0.75rem;
            color: ${secondaryColor};
            background: ${isDark ? '#4B5563' : '#F3F4F6'};
            padding: 2px 6px;
            border-radius: 10px;
        }
        
        .plan-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .plan-list li {
            font-size: 0.8rem;
            color: ${textColor};
            padding: 4px 0;
            padding-left: 16px;
            position: relative;
            line-height: 1.4;
        }
        
        .plan-list li:before {
            content: '•';
            position: absolute;
            left: 0;
            color: ${primaryColor};
            font-weight: 600;
        }
        
        /* 푸터 */
        .report-footer {
            text-align: center;
            padding: 20px 16px;
            background: ${cardBg};
            border-radius: 12px;
            margin-top: 30px;
            border: 1px solid ${borderColor};
        }
        
        .footer-text {
            font-weight: 600;
            color: ${primaryColor};
            margin-bottom: 8px;
            font-size: 0.9rem;
        }
        
        .footer-meta {
            font-size: 0.8rem;
            color: ${secondaryColor};
            margin-bottom: 8px;
            line-height: 1.4;
        }
        
        .disclaimer {
            font-size: 0.75rem;
            color: ${secondaryColor};
            font-style: italic;
            line-height: 1.5;
        }
        
        .footer-info {
            font-size: 0.7rem;
            color: ${secondaryColor};
            line-height: 1.4;
        }
        
        .footer-info strong {
            color: ${textColor};
        }
        
        /* 진행률 바 (progress-container 등) */
        .progress-container {
            position: relative;
            height: 8px;
            border-radius: 4px;
            overflow: hidden;
            background: ${isDark ? '#4B5563' : '#E5E7EB'};
            margin: 6px 0;
        }
        
        .progress-track {
            display: flex;
            width: 100%;
            height: 100%;
        }
        
        .progress-marker {
            position: absolute;
            top: 0;
            width: 2px;
            height: 100%;
            background: ${textColor};
            border-radius: 1px;
            transform: translateX(-50%);
        }
        
        .progress-divider {
            position: absolute;
            top: 0;
            width: 1px;
            height: 100%;
            background: white;
        }
        
        .progress-labels {
            display: flex;
            justify-content: space-between;
            margin-top: 4px;
            font-size: 0.65rem;
            color: ${secondaryColor};
        }
        
        .health-segment, .risk-segment {
            height: 100%;
        }
        
        /* 일반 건강도 색상 (주의-보통-양호 순서) */
        .health-segment.bad {
            background: #FCA5A5;
            width: 70%;
        }
        
        .health-segment.medium {
            background: #FCD34D;
            width: 10%;
        }
        
        .health-segment.good {
            background: #86EFAC;
            width: 20%;
        }
        
        /* 위험도 분석 색상 (양호-보통-주의 순서) */
        .risk-segment.good {
            background: #86EFAC;
            width: 20%;
        }
        
        .risk-segment.medium {
            background: #FCD34D;
            width: 15%;
        }
        
        .risk-segment.bad {
            background: #FCA5A5;
            width: 65%;
        }
        
        /* 스크롤 최적화 */
        .mobile-report-container {
            scroll-behavior: smooth;
        }
        
        /* 터치 최적화 */
        .plan-card {
            touch-action: pan-y;
        }
        
        /* 점수별 색상 클래스 */
        .score-excellent { background: linear-gradient(135deg, #10B981, #059669); }
        .score-good { background: linear-gradient(135deg, #3B82F6, #2563EB); }
        .score-average { background: linear-gradient(135deg, #F59E0B, #D97706); }
        .score-poor { background: linear-gradient(135deg, #EF4444, #DC2626); }
    `;
  }



  /**
   * 모바일 점수 요약 생성
   */
  private generateMobileScoreSummary(analysis: AnalysisResult, options: RenderOptions): string {
    const detailedResult = analysis.rawData?.detailedAnalysis as DetailedAnalysisResult;
    const overallScore = detailedResult?.overallScore || analysis.overallScore || 0;
    const language = options.language || 'ko';
    
    const scoreClass = this.getScoreClass(overallScore);
    const scoreLabel = this.getScoreLabel(overallScore, language);
    
    return `
    <section class="score-summary">
        <div class="overall-score">
            <div class="score-circle ${scoreClass}">
                ${Math.round(overallScore)}
            </div>
            <div class="score-label">${scoreLabel}</div>
            <div class="score-description">
                ${detailedResult?.overallInterpretation || analysis.insights?.summary || '종합적인 건강 상태를 평가했습니다.'}
            </div>
        </div>
    </section>`;
  }

  /**
   * 모바일 분석 리스트 생성
   */
  private generateMobileAnalysisList(analysis: AnalysisResult, options: RenderOptions): string {
    const detailedResult = analysis.rawData?.detailedAnalysis as DetailedAnalysisResult;
    const language = options.language || 'ko';
    
    let content = '<div class="analysis-list">';
    

    
    // 개선 계획
    if (detailedResult?.improvementPlan) {
      content += this.generateImprovementPlanItem(detailedResult.improvementPlan, language);
    }
    
    content += '</div>';
    return content;
  }





  /**
   * 개선 계획 아이템 생성
   */
  private generateImprovementPlanItem(improvementPlan: any, language: string): string {
    const title = language === 'ko' ? '건강 개선 계획' : 'Health Improvement Plan';
    
    return `
    <div class="plan-timeline">
        <div class="plan-header" style="margin-bottom: 16px;">
            <h3 style="font-size: 1.1rem;">📈 ${title}</h3>
        </div>
        ${improvementPlan.immediate?.length ? `
        <div class="plan-card immediate">
            <div class="plan-header">
                <h3>🚀 즉시 실행</h3>
                <div class="plan-period">오늘부터</div>
            </div>
            <ul class="plan-list">
                ${improvementPlan.immediate.map((action: string) => `<li>${action}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
        ${improvementPlan.shortTerm?.length ? `
        <div class="plan-card short-term">
            <div class="plan-header">
                <h3>🎯 단기 목표</h3>
                <div class="plan-period">1-4주</div>
            </div>
            <ul class="plan-list">
                ${improvementPlan.shortTerm.map((goal: string) => `<li>${goal}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
        ${improvementPlan.longTerm?.length ? `
        <div class="plan-card long-term">
            <div class="plan-header">
                <h3>🎊 중장기 목표</h3>
                <div class="plan-period">1-6개월</div>
            </div>
            <ul class="plan-list">
                ${improvementPlan.longTerm.map((goal: string) => `<li>${goal}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
    </div>`;
  }

  /**
   * 모바일 푸터 생성
   */
  private generateMobileFooter(analysis: AnalysisResult, options: RenderOptions): string {
    const organizationName = options.organizationName || 'Mind Breeze';
    const language = options.language || 'ko';
    
    const disclaimerText = language === 'ko' 
      ? '이 리포트는 AI 분석 결과이며 의료진의 진단을 대체할 수 없습니다.'
      : 'This report is an AI analysis result and cannot replace medical diagnosis.';
      
    return `
    <footer class="mobile-footer">
        <div class="footer-text">
            <strong>${organizationName}</strong><br>
            ${disclaimerText}<br>
            Generated: ${new Date().toLocaleString(language === 'ko' ? 'ko-KR' : 'en-US')}
        </div>
    </footer>`;
  }

  /**
   * 에러 HTML 생성
   */
  private generateErrorHTML(error: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>리포트 오류</title>
        <style>
            body { font-family: sans-serif; padding: 20px; text-align: center; }
            .error { color: #DC2626; margin: 20px 0; }
        </style>
    </head>
    <body>
        <h1>리포트 생성 오류</h1>
        <div class="error">${error}</div>
        <p>잠시 후 다시 시도해주세요.</p>
    </body>
    </html>`;
  }

  /**
   * 제목 가져오기
   */
  private getTitle(language: string): string {
    return language === 'ko' ? 'AI 건강 분석 리포트' : 'AI Health Analysis Report';
  }

  /**
   * 점수 클래스 결정
   */
  private getScoreClass(score: number): string {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'average';
    return 'poor';
  }

  /**
   * 점수 라벨 가져오기
   */
  private getScoreLabel(score: number, language: string): string {
    if (language === 'ko') {
      if (score >= 80) return '우수';
      if (score >= 60) return '양호';
      if (score >= 40) return '보통';
      return '주의';
    } else {
      if (score >= 80) return 'Excellent';
      if (score >= 60) return 'Good';
      if (score >= 40) return 'Average';
      return 'Poor';
    }
  }



  /**
   * 모바일 자바스크립트
   */
  private getMobileJavaScript(options: RenderOptions): string {
    return `
        // 모바일 터치 이벤트 최적화
        document.addEventListener('DOMContentLoaded', function() {
            // 스크롤 성능 최적화
            let ticking = false;
            
            function updateScrollPosition() {
                // 스크롤 관련 최적화 로직
                ticking = false;
            }
            
            window.addEventListener('scroll', function() {
                if (!ticking) {
                    requestAnimationFrame(updateScrollPosition);
                    ticking = true;
                }
            });
            
            // 터치 피드백
            const items = document.querySelectorAll('.plan-card');
            items.forEach(item => {
                item.addEventListener('touchstart', function() {
                    this.style.transform = 'scale(0.98)';
                    this.style.transition = 'transform 0.1s ease';
                });
                
                item.addEventListener('touchend', function() {
                    this.style.transform = 'scale(1)';
                });
            });
        });
    `;
  }
} 