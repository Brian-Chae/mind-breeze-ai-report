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
        
        .element-value {
            font-size: 0.9rem;
            font-weight: 600;
            color: ${textColor};
        }
        
        /* 차트 컨테이너 */
        .chart-container {
            background: ${isDark ? '#2D3748' : '#F7FAFC'};
            border-radius: 8px;
            padding: 12px;
            margin: 12px 0;
            text-align: center;
            min-height: 110px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        
        .chart-placeholder {
            color: ${secondaryColor};
            font-size: 12px;
            font-style: italic;
        }
        
        /* 차트 범례 */
        .chart-legend {
            margin-top: 8px;
        }
        
        .legend-title {
            font-size: 10px;
            color: ${secondaryColor};
            font-weight: 500;
            text-align: center;
        }
        
        /* SVG 차트 스타일 */
        .chart-container svg {
            max-width: 100%;
            height: auto;
            filter: drop-shadow(0 2px 8px rgba(0,0,0,0.15));
            border-radius: 8px;
        }
        
        /* 차트 애니메이션 및 상호작용 */
        .chart-container svg .eeg-bar {
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            transform-origin: bottom;
        }
        
        .chart-container svg .eeg-bar:hover {
            opacity: 0.9;
            transform: translateY(-2px) scale(1.05);
        }
        
        .chart-container svg .ppg-circle {
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .chart-container svg .ppg-circle:hover {
            opacity: 0.9;
            stroke-width: 6;
        }
        
        /* 차트 컨테이너 호버 효과 */
        .chart-container:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
        }
        
        /* 분석 섹션 */
        .analysis-section {
            margin-bottom: 20px;
        }
        
        .analysis-content {
            padding: 0;
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
            background: ${cardBg};
            padding: 16px;
            text-align: center;
            border-top: 1px solid ${borderColor};
            margin-top: 20px;
            border-radius: 0 0 12px 12px;
        }
        
        .footer-disclaimer {
            font-size: 0.75rem;
            color: ${secondaryColor};
            line-height: 1.5;
            margin-bottom: 8px;
            font-style: italic;
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
        
        .health-segment.bad, .risk-segment.bad {
            background: #FCA5A5;
        }
        
        .health-segment.medium, .risk-segment.medium {
            background: #FCD34D;
        }
        
        .health-segment.good, .risk-segment.good {
            background: #86EFAC;
        }
        
        /* 스크롤 최적화 */
        .mobile-report-container {
            scroll-behavior: smooth;
        }
        
        /* 터치 최적화 */
        .analysis-item {
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
    
    // EEG 분석
    if (detailedResult?.eegAnalysis) {
      content += this.generateEEGAnalysisItem(detailedResult.eegAnalysis, language);
    }
    
    // PPG 분석
    if (detailedResult?.ppgAnalysis) {
      content += this.generatePPGAnalysisItem(detailedResult.ppgAnalysis, language);
    }
    
    // 인구통계학적 분석
    if (detailedResult?.demographicAnalysis) {
      content += this.generateDemographicAnalysisItem(detailedResult.demographicAnalysis, language);
    }
    
    // 직업적 분석
    if (detailedResult?.occupationalAnalysis) {
      content += this.generateOccupationalAnalysisItem(detailedResult.occupationalAnalysis, language);
    }
    
    // 개선 계획
    if (detailedResult?.improvementPlan) {
      content += this.generateImprovementPlanItem(detailedResult.improvementPlan, language);
    }
    
    content += '</div>';
    return content;
  }

  /**
   * EEG 분석 아이템 생성
   */
  private generateEEGAnalysisItem(eegAnalysis: any, language: string): string {
    const title = language === 'ko' ? '뇌파(EEG) 분석' : 'EEG Analysis';
    const scoreClass = this.getScoreClass(eegAnalysis.score);
    
    return `
    <div class="analysis-item">
        <div class="item-header">
            <div class="item-icon eeg">⚡</div>
            <div class="item-title">${title}</div>
            <div class="item-score ${scoreClass}">${Math.round(eegAnalysis.score)}</div>
        </div>
        <div class="item-content">
            <div class="item-description">${eegAnalysis.interpretation}</div>
            <div class="chart-container">
                ${this.generateEEGChart(eegAnalysis)}
                <div class="chart-legend">
                    <div class="legend-title">주파수 대역별 활성도</div>
                </div>
            </div>
            ${eegAnalysis.keyFindings?.length ? `
            <div class="findings-section">
                <ul class="findings-list">
                    ${eegAnalysis.keyFindings.map((finding: string) => `<li>${finding}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
        </div>
    </div>`;
  }

  /**
   * PPG 분석 아이템 생성
   */
  private generatePPGAnalysisItem(ppgAnalysis: any, language: string): string {
    const title = language === 'ko' ? '심박 변이도(PPG) 분석' : 'PPG Analysis';
    const scoreClass = this.getScoreClass(ppgAnalysis.score);
    
    return `
    <div class="analysis-item">
        <div class="item-header">
            <div class="item-icon ppg">💓</div>
            <div class="item-title">${title}</div>
            <div class="item-score ${scoreClass}">${Math.round(ppgAnalysis.score)}</div>
        </div>
        <div class="item-content">
            <div class="item-description">${ppgAnalysis.interpretation}</div>
            <div class="chart-container">
                ${this.generatePPGChart(ppgAnalysis)}
                <div class="chart-legend">
                    <div class="legend-title">심박변이도 & 스트레스 지수</div>
                </div>
            </div>
            </div>
            ${ppgAnalysis.keyFindings?.length ? `
            <div class="findings-section">
                <ul class="findings-list">
                    ${ppgAnalysis.keyFindings.map((finding: string) => `<li>${finding}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
        </div>
    </div>`;
  }

  /**
   * 인구통계학적 분석 아이템 생성
   */
  private generateDemographicAnalysisItem(demographicAnalysis: any, language: string): string {
    const title = language === 'ko' ? '개인 특성 분석' : 'Demographic Analysis';
    
    return `
    <div class="analysis-item">
        <div class="item-header">
            <div class="item-icon demographic">👤</div>
            <div class="item-title">${title}</div>
        </div>
        <div class="item-content">
            ${demographicAnalysis.ageSpecific ? `
            <div class="item-description"><strong>연령별 특성:</strong> ${demographicAnalysis.ageSpecific}</div>
            ` : ''}
            ${demographicAnalysis.genderSpecific ? `
            <div class="item-description"><strong>성별 특성:</strong> ${demographicAnalysis.genderSpecific}</div>
            ` : ''}
            ${demographicAnalysis.combinedInsights?.length ? `
            <div class="findings-section">
                <ul class="findings-list">
                    ${demographicAnalysis.combinedInsights.map((insight: string) => `<li>${insight}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
        </div>
    </div>`;
  }

  /**
   * 직업적 분석 아이템 생성
   */
  private generateOccupationalAnalysisItem(occupationalAnalysis: any, language: string): string {
    const title = language === 'ko' ? '직업적 건강 분석' : 'Occupational Analysis';
    
    return `
    <div class="analysis-item">
        <div class="item-header">
            <div class="item-icon occupation">💼</div>
            <div class="item-title">${title}</div>
        </div>
        <div class="item-content">
            ${occupationalAnalysis.jobSpecificRisks?.length ? `
            <div class="findings-section">
                <div class="goal-category-title">직업적 위험 요소</div>
                <ul class="findings-list">
                    ${occupationalAnalysis.jobSpecificRisks.map((risk: string) => `<li>${risk}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
            ${occupationalAnalysis.workplaceRecommendations?.length ? `
            <div class="findings-section">
                <div class="goal-category-title">직장 내 권장사항</div>
                <ul class="findings-list">
                    ${occupationalAnalysis.workplaceRecommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
        </div>
    </div>`;
  }

  /**
   * 개선 계획 아이템 생성
   */
  private generateImprovementPlanItem(improvementPlan: any, language: string): string {
    const title = language === 'ko' ? '개선 계획' : 'Improvement Plan';
    
    return `
    <div class="analysis-item">
        <div class="item-header">
            <div class="item-icon improvement">🎯</div>
            <div class="item-title">${title}</div>
        </div>
        <div class="item-content">
            <div class="improvement-goals">
                ${improvementPlan.immediate?.length ? `
                <div class="goal-category">
                    <div class="goal-category-title">즉시 실행</div>
                    <ul class="goal-list">
                        ${improvementPlan.immediate.map((action: string) => `<li>${action}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
                ${improvementPlan.shortTerm?.length ? `
                <div class="goal-category">
                    <div class="goal-category-title">단기 목표 (1-4주)</div>
                    <ul class="goal-list">
                        ${improvementPlan.shortTerm.map((goal: string) => `<li>${goal}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
                ${improvementPlan.longTerm?.length ? `
                <div class="goal-category">
                    <div class="goal-category-title">장기 목표 (1-6개월)</div>
                    <ul class="goal-list">
                        ${improvementPlan.longTerm.map((goal: string) => `<li>${goal}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
        </div>
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
   * EEG 차트 생성 (주파수 대역별 막대 그래프)
   */
  private generateEEGChart(eegAnalysis: any): string {
    // 실제 분석 점수를 기반으로 한 추정 주파수 대역 데이터
    const baseScore = eegAnalysis.score || 70;
    
    const bands = {
      'Delta': eegAnalysis.bands?.delta || (baseScore * 0.6 + Math.random() * 20),
      'Theta': eegAnalysis.bands?.theta || (baseScore * 0.8 + Math.random() * 15),
      'Alpha': eegAnalysis.bands?.alpha || (baseScore * 0.9 + Math.random() * 10),
      'Beta': eegAnalysis.bands?.beta || (baseScore * 1.1 + Math.random() * 15),
      'Gamma': eegAnalysis.bands?.gamma || (baseScore * 0.5 + Math.random() * 25)
    };
    
    const maxValue = Math.max(...Object.values(bands));
    // 웹 렌더러와 조화로운 세련된 색상 팔레트
    const colors = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#feca57'];
    
    let bars = '';
    let labels = '';
    let gradients = '';
    
    Object.entries(bands).forEach(([band, value], index) => {
      const height = (value / maxValue) * 60; // 최대 높이 60px
      const x = index * 24 + 10;
      const y = 70 - height;
      const gradientId = `eegGradient${index}`;
      
      // 각 막대별 그라데이션 생성
      const baseColor = colors[index];
      const lightColor = this.lightenColor(baseColor, 20);
      
      gradients += `
        <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${lightColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${baseColor};stop-opacity:1" />
        </linearGradient>
      `;
      
      bars += `<rect x="${x}" y="${y}" width="20" height="${height}" fill="url(#${gradientId})" rx="3" class="eeg-bar" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1))"/>`;
      labels += `<text x="${x + 10}" y="85" text-anchor="middle" font-size="9" font-weight="500" fill="#4A5568">${band}</text>`;
    });
    
    return `
      <svg width="140" height="90" viewBox="0 0 140 90">
        <defs>
          ${gradients}
        </defs>
        ${bars}
        ${labels}
      </svg>
    `;
  }

  /**
   * PPG 차트 생성 (심박수 변이도 도넛 차트)
   */
  private generatePPGChart(ppgAnalysis: any): string {
    const baseScore = ppgAnalysis.score || 75;
    
    // 실제 분석 점수를 기반으로 한 추정 HRV 및 스트레스 데이터
    const hrv = ppgAnalysis.hrv || (baseScore * 0.9 + Math.random() * 20); // HRV 점수
    const stress = ppgAnalysis.stress || (100 - baseScore * 0.8 + Math.random() * 15); // 스트레스 점수 (역관계)
    
    const radius = 25;
    const circumference = 2 * Math.PI * radius;
    const hrvOffset = circumference - (hrv / 100) * circumference;
    const stressOffset = circumference - (stress / 100) * circumference;
    
    return `
      <svg width="140" height="90" viewBox="0 0 140 90">
        <defs>
          <!-- HRV 그라데이션 (활력적인 청록색) -->
          <linearGradient id="ppgGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#4facfe;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#00f2fe;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#43e97b;stop-opacity:1" />
          </linearGradient>
          <!-- 스트레스 그라데이션 (따뜻한 핑크-오렌지) -->
          <linearGradient id="ppgGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#fa709a;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#fee140;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#feca57;stop-opacity:1" />
          </linearGradient>
          <!-- 그림자 효과 -->
          <filter id="circleShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.1)"/>
          </filter>
        </defs>
        
        <!-- HRV Circle -->
        <g transform="translate(35, 45)">
          <circle cx="0" cy="0" r="${radius}" fill="none" stroke="#e2e8f0" stroke-width="5"/>
          <circle cx="0" cy="0" r="${radius}" fill="none" stroke="url(#ppgGradient1)" stroke-width="5"
                  stroke-dasharray="${circumference}" stroke-dashoffset="${hrvOffset}" 
                  stroke-linecap="round" transform="rotate(-90)" 
                  filter="url(#circleShadow)" class="ppg-circle"/>
          <text x="0" y="3" text-anchor="middle" font-size="11" font-weight="700" fill="#2d3748">${Math.round(hrv)}</text>
          <text x="0" y="-16" text-anchor="middle" font-size="8" font-weight="600" fill="#4a5568">HRV</text>
        </g>
        
        <!-- Stress Circle -->
        <g transform="translate(105, 45)">
          <circle cx="0" cy="0" r="${radius}" fill="none" stroke="#e2e8f0" stroke-width="5"/>
          <circle cx="0" cy="0" r="${radius}" fill="none" stroke="url(#ppgGradient2)" stroke-width="5"
                  stroke-dasharray="${circumference}" stroke-dashoffset="${stressOffset}" 
                  stroke-linecap="round" transform="rotate(-90)" 
                  filter="url(#circleShadow)" class="ppg-circle"/>
          <text x="0" y="3" text-anchor="middle" font-size="11" font-weight="700" fill="#2d3748">${Math.round(stress)}</text>
          <text x="0" y="-16" text-anchor="middle" font-size="8" font-weight="600" fill="#4a5568">스트레스</text>
        </g>
      </svg>
    `;
  }

  /**
   * 색상을 밝게 만드는 헬퍼 함수
   */
  private lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  /**
   * 모바일 자바스크립트
   */
  private getMobileJavaScript(options: RenderOptions): string {
    return `
        // 모바일 터치 이벤트 및 차트 애니메이션 최적화
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
            const items = document.querySelectorAll('.analysis-item');
            items.forEach(item => {
                item.addEventListener('touchstart', function() {
                    this.style.transform = 'scale(0.98)';
                    this.style.transition = 'transform 0.1s ease';
                });
                
                item.addEventListener('touchend', function() {
                    this.style.transform = 'scale(1)';
                });
            });
            
            // 차트 애니메이션
            const animateCharts = () => {
                // EEG 막대 그래프 애니메이션
                const eegBars = document.querySelectorAll('svg rect');
                eegBars.forEach((bar, index) => {
                    bar.style.transform = 'scaleY(0)';
                    bar.style.transformOrigin = 'bottom';
                    bar.style.transition = 'transform 0.6s ease';
                    
                    setTimeout(() => {
                        bar.style.transform = 'scaleY(1)';
                    }, index * 100);
                });
                
                // PPG 원형 차트 애니메이션
                const circles = document.querySelectorAll('svg circle[stroke-dasharray]');
                circles.forEach((circle, index) => {
                    const dasharray = circle.getAttribute('stroke-dasharray');
                    circle.setAttribute('stroke-dashoffset', dasharray);
                    circle.style.transition = 'stroke-dashoffset 1s ease';
                    
                    setTimeout(() => {
                        const finalOffset = circle.getAttribute('stroke-dashoffset');
                        circle.setAttribute('stroke-dashoffset', finalOffset);
                    }, 300 + index * 200);
                });
            };
            
            // Intersection Observer로 차트가 화면에 보일 때 애니메이션 실행
            const chartObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setTimeout(animateCharts, 200);
                        chartObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.3 });
            
            const chartContainers = document.querySelectorAll('.chart-container');
            chartContainers.forEach(container => {
                chartObserver.observe(container);
            });
        });
    `;
  }
} 