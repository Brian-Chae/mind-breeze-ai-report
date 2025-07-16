/**
 * Gemini V1용 기본 웹 렌더러
 * BasicGeminiV1Engine의 분석 결과를 HTML/React 컴포넌트 형태로 렌더링
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

export class BasicGeminiV1WebRenderer implements IReportRenderer {
  // 기본 정보
  readonly id = 'basic-gemini-v1-web';
  readonly name = 'Gemini V1 웹 렌더러';
  readonly description = 'BasicGeminiV1Engine 결과를 HTML/React 형태로 렌더링하는 웹 렌더러';
  readonly version = '1.0.0';
  readonly outputFormat: OutputFormat = 'web';
  
  // 비용 및 기능
  readonly costPerRender = 0; // 무료
  readonly supportedEngines = ['basic-gemini-v1']; // BasicGeminiV1Engine 전용
  
  readonly capabilities: RendererCapabilities = {
    supportedFormats: ['web'],
    supportedLanguages: ['ko', 'en'],
    maxContentSize: 5 * 1024 * 1024, // 5MB
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

      // HTML 생성
      const htmlContent = this.generateHTML(analysis, options);
      
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
        costUsed: 0
      };
    }
  }

  /**
   * 분석 결과 유효성 검증
   */
  async validateAnalysis(analysis: AnalysisResult): Promise<boolean> {
    try {
      // 필수 필드 검증
      if (!analysis.engineId || !analysis.timestamp || !analysis.insights) {
        return false;
      }

      // 점수 범위 검증
      if (analysis.overallScore < 0 || analysis.overallScore > 100) {
        return false;
      }

      if (analysis.stressLevel < 0 || analysis.stressLevel > 100) {
        return false;
      }

      if (analysis.focusLevel < 0 || analysis.focusLevel > 100) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Analysis validation error:', error);
      return false;
    }
  }

  /**
   * 리포트 템플릿 조회
   */
  getTemplate(): ReportTemplate {
    return {
      id: 'basic-web-template',
      name: '기본 웹 템플릿',
      description: '깔끔하고 읽기 쉬운 기본 웹 리포트 템플릿',
      supportedFormats: ['web'],
      sections: [
        {
          id: 'header',
          name: '헤더',
          type: 'header',
          required: true,
          customizable: true,
          defaultContent: 'AI 건강 분석 리포트'
        },
        {
          id: 'summary',
          name: '요약',
          type: 'summary',
          required: true,
          customizable: false
        },
        {
          id: 'scores',
          name: '점수',
          type: 'charts',
          required: true,
          customizable: true
        },
        {
          id: 'analysis',
          name: '상세 분석',
          type: 'analysis',
          required: true,
          customizable: false
        },
        {
          id: 'recommendations',
          name: '권장사항',
          type: 'recommendations',
          required: true,
          customizable: true
        },
        {
          id: 'footer',
          name: '푸터',
          type: 'footer',
          required: false,
          customizable: true,
          defaultContent: 'Mind Breeze AI Report System'
        }
      ]
    };
  }

  /**
   * HTML 생성
   */
  private generateHTML(analysis: AnalysisResult, options: RenderOptions): string {
    const theme = options.webOptions?.theme || 'light';
    const language = options.language || 'ko';
    const organizationName = options.organizationName || 'Mind Breeze';
    
    return `
<!DOCTYPE html>
<html lang="${language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
    <meta name="format-detection" content="telephone=no">
    <meta name="theme-color" content="${options.brandColors?.primary || '#3B82F6'}">
    <title>${this.getTitle(language)} - ${organizationName}</title>
    <style>
        ${this.getCSS(theme, options)}
    </style>
</head>
<body>
    <div class="report-container">
        ${this.generateHeader(analysis, options)}
        ${this.generateSummary(analysis, options)}
        ${this.generateScores(analysis, options)}
        ${this.generateAnalysis(analysis, options)}
        ${this.generateRecommendations(analysis, options)}
        ${this.generateFooter(analysis, options)}
    </div>
    
    <script>
        ${this.getJavaScript(options)}
    </script>
</body>
</html>`;
  }

  /**
   * 헤더 생성
   */
  private generateHeader(analysis: AnalysisResult, options: RenderOptions): string {
    const organizationName = options.organizationName || 'Mind Breeze';
    const language = options.language || 'ko';
    
    return `
    <header class="report-header">
        ${options.organizationLogo ? `<img src="${options.organizationLogo}" alt="${organizationName}" class="logo">` : ''}
        <h1 class="report-title">${this.getTitle(language)}</h1>
        <div class="report-meta">
            <span class="analysis-date">${new Date(analysis.timestamp).toLocaleString(language === 'ko' ? 'ko-KR' : 'en-US')}</span>
            <span class="engine-info">${analysis.engineId} v${analysis.engineVersion}</span>
        </div>
    </header>`;
  }

  /**
   * 요약 생성
   */
  private generateSummary(analysis: AnalysisResult, options: RenderOptions): string {
    const language = options.language || 'ko';
    
    return `
    <section class="summary-section">
        <h2>${language === 'ko' ? '분석 요약' : 'Analysis Summary'}</h2>
        <div class="summary-content">
            <p class="summary-text">${analysis.insights.summary}</p>
        </div>
    </section>`;
  }

  /**
   * 점수 섹션 생성
   */
  private generateScores(analysis: AnalysisResult, options: RenderOptions): string {
    const language = options.language || 'ko';
    
    const scores = [
      {
        label: language === 'ko' ? '전체 건강 점수' : 'Overall Health Score',
        value: analysis.overallScore,
        color: this.getScoreColor(analysis.overallScore)
      },
      {
        label: language === 'ko' ? '스트레스 수준' : 'Stress Level',
        value: analysis.stressLevel,
        color: this.getStressColor(analysis.stressLevel)
      },
      {
        label: language === 'ko' ? '집중력 수준' : 'Focus Level',
        value: analysis.focusLevel,
        color: this.getFocusColor(analysis.focusLevel)
      }
    ];

    return `
    <section class="scores-section">
        <h2>${language === 'ko' ? '건강 지표' : 'Health Metrics'}</h2>
        <div class="scores-grid">
            ${scores.map(score => `
                <div class="score-card">
                    <h3 class="score-label">${score.label}</h3>
                    <div class="score-value" style="color: ${score.color}">
                        ${score.value}
                        <span class="score-unit">/100</span>
                    </div>
                    <div class="score-bar">
                        <div class="score-fill" style="width: ${score.value}%; background-color: ${score.color}"></div>
                    </div>
                </div>
            `).join('')}
        </div>
    </section>`;
  }

  /**
   * 상세 분석 생성
   */
  private generateAnalysis(analysis: AnalysisResult, options: RenderOptions): string {
    const language = options.language || 'ko';
    
    return `
    <section class="analysis-section">
        <h2>${language === 'ko' ? '상세 분석' : 'Detailed Analysis'}</h2>
        <div class="analysis-content">
            <div class="analysis-text">
                ${analysis.insights.detailedAnalysis.split('\n').map(paragraph => 
                  paragraph.trim() ? `<p>${paragraph}</p>` : ''
                ).join('')}
            </div>
            
            ${this.generateMetrics(analysis, options)}
            
            ${analysis.insights.warnings.length > 0 ? `
            <div class="warnings-box">
                <h3>${language === 'ko' ? '주의사항' : 'Warnings'}</h3>
                <ul class="warnings-list">
                    ${analysis.insights.warnings.map(warning => `<li>${warning}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
        </div>
    </section>`;
  }

  /**
   * 생체 지표 생성
   */
  private generateMetrics(analysis: AnalysisResult, options: RenderOptions): string {
    const language = options.language || 'ko';
    const metrics = analysis.metrics;
    
    if (!metrics || (!metrics.eeg && !metrics.ppg && !metrics.acc)) {
      return '';
    }

    return `
    <div class="metrics-section">
        <h3>${language === 'ko' ? '생체 지표' : 'Biometric Metrics'}</h3>
        <div class="metrics-grid">
            ${metrics.eeg ? `
            <div class="metric-group">
                <h4>${language === 'ko' ? 'EEG (뇌파)' : 'EEG (Brain Waves)'}</h4>
                <div class="metric-items">
                    <div class="metric-item">
                        <span class="metric-label">Alpha</span>
                        <span class="metric-value">${metrics.eeg.alpha.toFixed(2)}</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">Beta</span>
                        <span class="metric-value">${metrics.eeg.beta.toFixed(2)}</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">Gamma</span>
                        <span class="metric-value">${metrics.eeg.gamma.toFixed(2)}</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">Theta</span>
                        <span class="metric-value">${metrics.eeg.theta.toFixed(2)}</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">Delta</span>
                        <span class="metric-value">${metrics.eeg.delta.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            ` : ''}
            
            ${metrics.ppg ? `
            <div class="metric-group">
                <h4>${language === 'ko' ? 'PPG (심박)' : 'PPG (Heart Rate)'}</h4>
                <div class="metric-items">
                    <div class="metric-item">
                        <span class="metric-label">${language === 'ko' ? '심박수' : 'Heart Rate'}</span>
                        <span class="metric-value">${metrics.ppg.heartRate} BPM</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">HRV</span>
                        <span class="metric-value">${metrics.ppg.hrv}</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">${language === 'ko' ? '스트레스 지수' : 'Stress Index'}</span>
                        <span class="metric-value">${metrics.ppg.stressIndex}</span>
                    </div>
                </div>
            </div>
            ` : ''}
            
            ${metrics.acc ? `
            <div class="metric-group">
                <h4>${language === 'ko' ? 'ACC (움직임)' : 'ACC (Movement)'}</h4>
                <div class="metric-items">
                    <div class="metric-item">
                        <span class="metric-label">${language === 'ko' ? '움직임 수준' : 'Movement Level'}</span>
                        <span class="metric-value">${metrics.acc.movementLevel}</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">${language === 'ko' ? '안정성' : 'Stability'}</span>
                        <span class="metric-value">${metrics.acc.stability}</span>
                    </div>
                </div>
            </div>
            ` : ''}
        </div>
    </div>`;
  }

  /**
   * 권장사항 생성
   */
  private generateRecommendations(analysis: AnalysisResult, options: RenderOptions): string {
    const language = options.language || 'ko';
    
    return `
    <section class="recommendations-section">
        <h2>${language === 'ko' ? '권장사항' : 'Recommendations'}</h2>
        <div class="recommendations-content">
            <ul class="recommendations-list">
                ${analysis.insights.recommendations.map(recommendation => `
                    <li class="recommendation-item">
                        <span class="recommendation-text">${recommendation}</span>
                    </li>
                `).join('')}
            </ul>
        </div>
    </section>`;
  }

  /**
   * 푸터 생성
   */
  private generateFooter(analysis: AnalysisResult, options: RenderOptions): string {
    const language = options.language || 'ko';
    const organizationName = options.organizationName || 'Mind Breeze';
    const footerContent = options.organizationName ? 
      `${organizationName} AI Report System` : 
      'Mind Breeze AI Report System';
    
    return `
    <footer class="report-footer">
        <div class="footer-content">
            <p class="footer-text">${footerContent}</p>
            <p class="footer-meta">
                ${language === 'ko' ? '분석 시간' : 'Analysis Time'}: ${analysis.processingTime}ms | 
                ${language === 'ko' ? '분석 ID' : 'Analysis ID'}: ${analysis.analysisId}
            </p>
            <p class="disclaimer">
                ${language === 'ko' ? 
                  '본 분석 결과는 의학적 진단이 아닌 건강 관리 참고용입니다.' : 
                  'This analysis is for health management reference only, not medical diagnosis.'
                }
            </p>
        </div>
    </footer>`;
  }

  /**
   * CSS 스타일 생성
   */
  private getCSS(theme: string, options: RenderOptions): string {
    const primaryColor = options.brandColors?.primary || '#3B82F6';
    const secondaryColor = options.brandColors?.secondary || '#6B7280';
    const accentColor = options.brandColors?.accent || '#10B981';
    
    const isDark = theme === 'dark';
    const bgColor = isDark ? '#1F2937' : '#FFFFFF';
    const textColor = isDark ? '#F9FAFB' : '#111827';
    const cardBg = isDark ? '#374151' : '#F9FAFB';
    
    return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: ${textColor};
            background-color: ${bgColor};
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            -webkit-text-size-adjust: 100%;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
        }
        
        .report-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .report-header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px;
            background: ${cardBg};
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .logo {
            height: 60px;
            margin-bottom: 20px;
        }
        
        .report-title {
            font-size: 2.5rem;
            font-weight: 700;
            color: ${primaryColor};
            margin-bottom: 10px;
        }
        
        .report-meta {
            display: flex;
            justify-content: center;
            gap: 20px;
            color: ${secondaryColor};
            font-size: 0.9rem;
        }
        
        section {
            margin-bottom: 40px;
            padding: 30px;
            background: ${cardBg};
            border-radius: 12px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        h2 {
            font-size: 1.8rem;
            font-weight: 600;
            color: ${primaryColor};
            margin-bottom: 20px;
            border-bottom: 2px solid ${primaryColor};
            padding-bottom: 10px;
        }
        
        h3 {
            font-size: 1.3rem;
            font-weight: 600;
            color: ${textColor};
            margin-bottom: 15px;
        }
        
        h4 {
            font-size: 1.1rem;
            font-weight: 600;
            color: ${secondaryColor};
            margin-bottom: 10px;
        }
        
        .summary-text {
            font-size: 1.1rem;
            line-height: 1.8;
            color: ${textColor};
        }
        
        .scores-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }
        
        .score-card {
            background: ${isDark ? '#4B5563' : '#FFFFFF'};
            padding: 25px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            min-height: 140px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .score-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .score-label {
            font-size: 1rem;
            font-weight: 500;
            color: ${secondaryColor};
            margin-bottom: 10px;
        }
        
        .score-value {
            font-size: 3rem;
            font-weight: 700;
            margin-bottom: 15px;
        }
        
        .score-unit {
            font-size: 1.2rem;
            font-weight: 400;
            opacity: 0.7;
        }
        
        .score-bar {
            width: 100%;
            height: 8px;
            background: ${isDark ? '#6B7280' : '#E5E7EB'};
            border-radius: 4px;
            overflow: hidden;
        }
        
        .score-fill {
            height: 100%;
            border-radius: 4px;
            transition: width 0.8s ease;
        }
        
        .analysis-text p {
            margin-bottom: 15px;
            line-height: 1.7;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .metric-group {
            background: ${isDark ? '#4B5563' : '#FFFFFF'};
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .metric-items {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .metric-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid ${isDark ? '#6B7280' : '#E5E7EB'};
        }
        
        .metric-item:last-child {
            border-bottom: none;
        }
        
        .metric-label {
            font-weight: 500;
            color: ${secondaryColor};
        }
        
        .metric-value {
            font-weight: 600;
            color: ${textColor};
        }
        
        .warnings-box {
            background: #FEF3C7;
            border: 1px solid #F59E0B;
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
        }
        
        .warnings-list {
            list-style: none;
            margin-top: 10px;
        }
        
        .warnings-list li {
            padding: 5px 0;
            color: #92400E;
        }
        
        .warnings-list li::before {
            content: "⚠️ ";
            margin-right: 8px;
        }
        
        .recommendations-list {
            list-style: none;
        }
        
        .recommendation-item {
            padding: 15px;
            margin-bottom: 10px;
            background: ${isDark ? '#4B5563' : '#FFFFFF'};
            border-radius: 8px;
            border-left: 4px solid ${accentColor};
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            min-height: 44px; /* 터치 친화적 최소 높이 */
            display: flex;
            align-items: center;
        }
        
        .recommendation-item::before {
            content: "💡 ";
            margin-right: 10px;
        }
        
        .recommendation-text {
            font-weight: 500;
            line-height: 1.6;
        }
        
        .report-footer {
            text-align: center;
            padding: 30px;
            background: ${cardBg};
            border-radius: 12px;
            margin-top: 40px;
        }
        
        .footer-text {
            font-weight: 600;
            color: ${primaryColor};
            margin-bottom: 10px;
        }
        
        .footer-meta {
            font-size: 0.9rem;
            color: ${secondaryColor};
            margin-bottom: 10px;
        }
        
        .disclaimer {
            font-size: 0.8rem;
            color: ${secondaryColor};
            font-style: italic;
        }
        
        /* 모바일 (작은 화면) */
        @media (max-width: 480px) {
            .report-container {
                padding: 8px;
                margin: 0;
            }
            
            .report-header {
                padding: 15px;
                margin-bottom: 20px;
            }
            
            .report-title {
                font-size: 1.5rem;
                margin-bottom: 8px;
            }
            
            .logo {
                height: 40px;
                margin-bottom: 10px;
            }
            
            section {
                padding: 15px;
                margin-bottom: 20px;
            }
            
            h2 {
                font-size: 1.3rem;
                margin-bottom: 15px;
            }
            
            .scores-grid {
                grid-template-columns: 1fr;
                gap: 15px;
            }
            
            .score-card {
                padding: 15px;
            }
            
            .score-value {
                font-size: 2rem;
                margin-bottom: 10px;
            }
            
            .metrics-grid {
                grid-template-columns: 1fr;
                gap: 15px;
            }
            
            .metric-group {
                padding: 15px;
            }
            
            .recommendation-item {
                padding: 12px;
                margin-bottom: 8px;
            }
            
            .report-meta {
                flex-direction: column;
                gap: 3px;
                font-size: 0.8rem;
            }
            
            .report-footer {
                padding: 20px;
                margin-top: 20px;
            }
        }
        
        /* 태블릿 (중간 화면) */
        @media (min-width: 481px) and (max-width: 768px) {
            .report-container {
                padding: 12px;
            }
            
            .report-header {
                padding: 20px;
                margin-bottom: 30px;
            }
            
            .report-title {
                font-size: 1.8rem;
            }
            
            .logo {
                height: 50px;
                margin-bottom: 15px;
            }
            
            section {
                padding: 20px;
                margin-bottom: 30px;
            }
            
            h2 {
                font-size: 1.5rem;
            }
            
            .scores-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 18px;
            }
            
            .score-card {
                padding: 20px;
            }
            
            .score-value {
                font-size: 2.5rem;
            }
            
            .metrics-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 18px;
            }
            
            .report-meta {
                flex-direction: row;
                justify-content: center;
                gap: 15px;
                flex-wrap: wrap;
            }
        }
        
        /* 데스크탑 (큰 화면) */
        @media (min-width: 769px) and (max-width: 1024px) {
            .report-container {
                padding: 16px;
            }
            
            .scores-grid {
                grid-template-columns: repeat(3, 1fr);
            }
            
            .metrics-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
        
        /* 대형 데스크탑 */
        @media (min-width: 1025px) {
            .report-container {
                padding: 20px;
            }
            
            .scores-grid {
                grid-template-columns: repeat(3, 1fr);
            }
            
            .metrics-grid {
                grid-template-columns: repeat(3, 1fr);
            }
        }
        
        /* 세로/가로 모드 대응 */
        @media (orientation: landscape) and (max-height: 600px) {
            .report-header {
                padding: 15px;
                margin-bottom: 20px;
            }
            
            .report-title {
                font-size: 1.5rem;
            }
            
            section {
                padding: 15px;
                margin-bottom: 20px;
            }
            
            .score-value {
                font-size: 2rem;
            }
        }
        
        /* 다크모드에서의 추가 스타일 */
        @media (prefers-color-scheme: dark) {
            .warnings-box {
                background: #451A03;
                border-color: #92400E;
            }
            
            .warnings-list li {
                color: #FBBF24;
            }
        }
        
        /* 고대비 모드 지원 */
        @media (prefers-contrast: high) {
            .score-card, .metric-group, .recommendation-item {
                border: 2px solid ${isDark ? '#FFFFFF' : '#000000'};
            }
        }
        
        /* 애니메이션 감소 모드 */
        @media (prefers-reduced-motion: reduce) {
            .score-fill {
                transition: none;
            }
            
            * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        }
    `;
  }

  /**
   * JavaScript 코드 생성
   */
  private getJavaScript(options: RenderOptions): string {
    const interactive = options.webOptions?.interactive !== false;
    
    if (!interactive) {
      return '';
    }

    return `
        // 점수 바 애니메이션
        document.addEventListener('DOMContentLoaded', function() {
            const scoreFills = document.querySelectorAll('.score-fill');
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const fill = entry.target;
                        const width = fill.style.width;
                        fill.style.width = '0%';
                        setTimeout(() => {
                            fill.style.width = width;
                        }, 100);
                    }
                });
            });
            
            scoreFills.forEach(fill => observer.observe(fill));
        });
        
        // 인쇄 기능
        function printReport() {
            window.print();
        }
        
        // 소셜 공유 (기본 구현)
        function shareReport() {
            if (navigator.share) {
                navigator.share({
                    title: document.title,
                    url: window.location.href
                });
            } else {
                // 복사 기능 fallback
                navigator.clipboard.writeText(window.location.href);
                alert('링크가 클립보드에 복사되었습니다.');
            }
        }
    `;
  }

  /**
   * 에러 HTML 생성
   */
  private generateErrorHTML(errorMessage: string): string {
    return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>리포트 오류</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background-color: #F9FAFB;
        }
        .error-container {
            text-align: center;
            padding: 40px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 500px;
        }
        .error-icon {
            font-size: 4rem;
            margin-bottom: 20px;
        }
        .error-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: #DC2626;
            margin-bottom: 15px;
        }
        .error-message {
            color: #6B7280;
            margin-bottom: 30px;
            line-height: 1.6;
        }
        .retry-button {
            background: #3B82F6;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
        }
        .retry-button:hover {
            background: #2563EB;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-icon">⚠️</div>
        <h1 class="error-title">리포트 생성 오류</h1>
        <p class="error-message">${errorMessage}</p>
        <button class="retry-button" onclick="window.location.reload()">다시 시도</button>
    </div>
</body>
</html>`;
  }

  /**
   * 유틸리티 메서드들
   */
  private getTitle(language: string): string {
    return language === 'ko' ? 'AI 건강 분석 리포트' : 'AI Health Analysis Report';
  }

  private getScoreColor(score: number): string {
    if (score >= 80) return '#10B981'; // 초록
    if (score >= 60) return '#F59E0B'; // 노랑
    return '#EF4444'; // 빨강
  }

  private getStressColor(stress: number): string {
    if (stress <= 30) return '#10B981'; // 낮음 - 초록
    if (stress <= 60) return '#F59E0B'; // 보통 - 노랑
    return '#EF4444'; // 높음 - 빨강
  }

  private getFocusColor(focus: number): string {
    if (focus >= 70) return '#10B981'; // 높음 - 초록
    if (focus >= 40) return '#F59E0B'; // 보통 - 노랑
    return '#EF4444'; // 낮음 - 빨강
  }
}

export default BasicGeminiV1WebRenderer; 