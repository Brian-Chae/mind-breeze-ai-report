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
    shortTermGoals: string[];
    longTermGoals: string[];
    actionItems: string[];
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
      const htmlContent = this.generateMobileHTML(analysis, options);
      
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
   * 모바일 최적화 HTML 생성
   */
  private generateMobileHTML(analysis: AnalysisResult, options: RenderOptions): string {
    const theme = options.webOptions?.theme || 'light';
    const language = options.language || 'ko';
    const organizationName = options.organizationName || 'Mind Breeze';
    
    return `
<!DOCTYPE html>
<html lang="${language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <meta name="format-detection" content="telephone=no">
    <meta name="theme-color" content="${options.brandColors?.primary || '#3B82F6'}">
    <title>${this.getTitle(language)} - ${organizationName}</title>
    <style>
        ${this.getMobileCSS(theme, options)}
    </style>
</head>
<body>
    <div class="mobile-report-container">
        ${this.generateMobileHeader(analysis, options)}
        ${this.generateMobileScoreSummary(analysis, options)}
        ${this.generateMobileAnalysisList(analysis, options)}
        ${this.generateMobileFooter(analysis, options)}
    </div>
    
    <script>
        ${this.getMobileJavaScript(options)}
    </script>
</body>
</html>`;
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
        
        .mobile-report-container {
            width: 100%;
            min-height: 100vh;
            padding: 0;
            background-color: ${bgColor};
        }
        
        /* 모바일 헤더 */
        .mobile-header {
            background: linear-gradient(135deg, ${primaryColor}, ${accentColor});
            color: white;
            padding: 20px 16px;
            text-align: center;
            position: sticky;
            top: 0;
            z-index: 100;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .mobile-header .logo {
            height: 32px;
            margin-bottom: 8px;
        }
        
        .mobile-header .title {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 4px;
            line-height: 1.3;
        }
        
        .mobile-header .subtitle {
            font-size: 12px;
            opacity: 0.9;
            font-weight: 400;
        }
        
        /* 점수 요약 섹션 */
        .score-summary {
            background: ${cardBg};
            padding: 20px 16px;
            margin: 0;
            border-bottom: 1px solid ${borderColor};
        }
        
        .overall-score {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .score-circle {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            margin: 0 auto 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: 700;
            color: white;
            position: relative;
        }
        
        .score-circle.excellent {
            background: linear-gradient(135deg, #10B981, #059669);
        }
        
        .score-circle.good {
            background: linear-gradient(135deg, #3B82F6, #2563EB);
        }
        
        .score-circle.average {
            background: linear-gradient(135deg, #F59E0B, #D97706);
        }
        
        .score-circle.poor {
            background: linear-gradient(135deg, #EF4444, #DC2626);
        }
        
        .score-label {
            font-size: 14px;
            font-weight: 600;
            color: ${textColor};
            margin-bottom: 4px;
        }
        
        .score-description {
            font-size: 12px;
            color: ${secondaryColor};
            line-height: 1.4;
        }
        
        /* 분석 리스트 */
        .analysis-list {
            background: ${bgColor};
            padding: 0;
        }
        
        .analysis-item {
            background: ${cardBg};
            margin: 8px 16px;
            border-radius: 12px;
            padding: 16px;
            border: 1px solid ${borderColor};
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .analysis-item:first-child {
            margin-top: 16px;
        }
        
        .analysis-item:last-child {
            margin-bottom: 16px;
        }
        
        .item-header {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid ${borderColor};
        }
        
        .item-icon {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
            font-size: 16px;
            color: white;
        }
        
        .item-icon.eeg {
            background: linear-gradient(135deg, #8B5CF6, #7C3AED);
        }
        
        .item-icon.ppg {
            background: linear-gradient(135deg, #EF4444, #DC2626);
        }
        
        .item-icon.demographic {
            background: linear-gradient(135deg, #06B6D4, #0891B2);
        }
        
        .item-icon.occupation {
            background: linear-gradient(135deg, #F59E0B, #D97706);
        }
        
        .item-icon.improvement {
            background: linear-gradient(135deg, #10B981, #059669);
        }
        
        .item-title {
            font-size: 15px;
            font-weight: 600;
            color: ${textColor};
            line-height: 1.3;
        }
        
        .item-score {
            margin-left: auto;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            color: white;
        }
        
        .item-content {
            margin-top: 12px;
        }
        
        .item-description {
            font-size: 13px;
            color: ${textColor};
            line-height: 1.5;
            margin-bottom: 12px;
        }
        
        .findings-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .findings-list li {
            font-size: 12px;
            color: ${secondaryColor};
            padding: 6px 0;
            padding-left: 16px;
            position: relative;
            border-bottom: 1px solid ${borderColor};
            line-height: 1.4;
        }
        
        .findings-list li:last-child {
            border-bottom: none;
        }
        
        .findings-list li:before {
            content: '•';
            position: absolute;
            left: 0;
            color: ${primaryColor};
            font-weight: 600;
        }
        
        /* 차트 컨테이너 */
        .chart-container {
            background: ${isDark ? '#2D3748' : '#F7FAFC'};
            border-radius: 8px;
            padding: 12px;
            margin: 12px 0;
            text-align: center;
            min-height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .chart-placeholder {
            color: ${secondaryColor};
            font-size: 12px;
            font-style: italic;
        }
        
        /* 개선 계획 특별 스타일 */
        .improvement-goals {
            margin-top: 12px;
        }
        
        .goal-category {
            margin-bottom: 12px;
        }
        
        .goal-category-title {
            font-size: 13px;
            font-weight: 600;
            color: ${primaryColor};
            margin-bottom: 6px;
        }
        
        .goal-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .goal-list li {
            font-size: 12px;
            color: ${textColor};
            padding: 4px 0;
            padding-left: 16px;
            position: relative;
            line-height: 1.4;
        }
        
        .goal-list li:before {
            content: '✓';
            position: absolute;
            left: 0;
            color: ${accentColor};
            font-weight: 600;
        }
        
        /* 푸터 */
        .mobile-footer {
            background: ${cardBg};
            padding: 16px;
            text-align: center;
            border-top: 1px solid ${borderColor};
            margin-top: 20px;
        }
        
        .footer-text {
            font-size: 11px;
            color: ${secondaryColor};
            line-height: 1.4;
        }
        
        .footer-text strong {
            color: ${textColor};
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
   * 모바일 헤더 생성
   */
  private generateMobileHeader(analysis: AnalysisResult, options: RenderOptions): string {
    const organizationName = options.organizationName || 'Mind Breeze';
    const language = options.language || 'ko';
    
    return `
    <header class="mobile-header">
        ${options.organizationLogo ? `<img src="${options.organizationLogo}" alt="${organizationName}" class="logo">` : ''}
        <div class="title">${this.getTitle(language)}</div>
        <div class="subtitle">${new Date(analysis.timestamp).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US')}</div>
    </header>`;
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
            <div class="item-icon eeg">🧠</div>
            <div class="item-title">${title}</div>
            <div class="item-score ${scoreClass}">${Math.round(eegAnalysis.score)}</div>
        </div>
        <div class="item-content">
            <div class="item-description">${eegAnalysis.interpretation}</div>
            <div class="chart-container">
                <div class="chart-placeholder">EEG 데이터 시각화</div>
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
            <div class="item-icon ppg">❤️</div>
            <div class="item-title">${title}</div>
            <div class="item-score ${scoreClass}">${Math.round(ppgAnalysis.score)}</div>
        </div>
        <div class="item-content">
            <div class="item-description">${ppgAnalysis.interpretation}</div>
            <div class="chart-container">
                <div class="chart-placeholder">PPG 데이터 시각화</div>
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
                ${improvementPlan.shortTermGoals?.length ? `
                <div class="goal-category">
                    <div class="goal-category-title">단기 목표</div>
                    <ul class="goal-list">
                        ${improvementPlan.shortTermGoals.map((goal: string) => `<li>${goal}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
                ${improvementPlan.longTermGoals?.length ? `
                <div class="goal-category">
                    <div class="goal-category-title">장기 목표</div>
                    <ul class="goal-list">
                        ${improvementPlan.longTermGoals.map((goal: string) => `<li>${goal}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
                ${improvementPlan.actionItems?.length ? `
                <div class="goal-category">
                    <div class="goal-category-title">실행 계획</div>
                    <ul class="goal-list">
                        ${improvementPlan.actionItems.map((item: string) => `<li>${item}</li>`).join('')}
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
        });
    `;
  }
} 