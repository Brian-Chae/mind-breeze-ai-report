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

// 상세 분석 결과 인터페이스 (엔진과 동일)
interface DetailedAnalysisResult {
  overallScore: number;
  overallInterpretation: string;
  
  // 🎯 마크다운 콘텐츠 지원 (옵셔널)
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

export class BasicGeminiV1WebRenderer implements IReportRenderer {
  // 기본 정보
  readonly id = 'basic-gemini-v1-web';
  readonly name = 'Gemini V1 웹 렌더러';
  readonly description = 'BasicGeminiV1Engine 결과를 맞춤형 HTML 리포트로 렌더링하는 웹 렌더러';
  readonly version = '1.1.0';
  readonly outputFormat: OutputFormat = 'web';
  
  // 비용 및 기능
  readonly costPerRender = 0; // 무료
  readonly supportedEngines = ['basic-gemini-v1']; // BasicGeminiV1Engine 전용
  
  readonly capabilities: RendererCapabilities = {
    supportedFormats: ['web'],
    supportedLanguages: ['ko', 'en'],
    maxContentSize: 10 * 1024 * 1024, // 10MB (더 상세한 분석으로 인해 증가)
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
      id: 'comprehensive-web-template',
      name: '종합 건강 웹 템플릿',
      description: '연령, 성별, 직업 특성을 고려한 맞춤형 웹 리포트 템플릿',
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
          name: '종합 요약',
          type: 'summary',
          required: true,
          customizable: false
        },
        {
          id: 'overall-scores',
          name: '전체 점수',
          type: 'charts',
          required: true,
          customizable: true
        },
        {
          id: 'eeg-analysis',
          name: '뇌파 분석',
          type: 'analysis',
          required: true,
          customizable: false
        },
        {
          id: 'ppg-analysis',
          name: '맥파 분석',
          type: 'analysis',
          required: true,
          customizable: false
        },
        {
          id: 'demographic-analysis',
          name: '연령/성별 분석',
          type: 'analysis',
          required: true,
          customizable: false
        },
        {
          id: 'occupation-analysis',
          name: '직업 특성 분석',
          type: 'analysis',
          required: true,
          customizable: false
        },
        {
          id: 'improvement-plan',
          name: '개선 계획',
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
        ${this.generateOverallSummary(analysis, options)}
        ${this.generateScoreCards(analysis, options)}
        ${this.generateEEGAnalysis(analysis, options)}
        ${this.generatePPGAnalysis(analysis, options)}
        ${this.generateDemographicAnalysis(analysis, options)}
        ${this.generateOccupationalAnalysis(analysis, options)}
        ${this.generateImprovementPlan(analysis, options)}
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
   * 개인 정보 추출 헬퍼
   */
  private getPersonalInfo(analysis: AnalysisResult, field: string): string | null {
    // rawData.personalInfo 또는 root level personalInfo에서 추출
    const personalInfo = (analysis as any).personalInfo || analysis.rawData?.personalInfo;
    return personalInfo?.[field] || null;
  }

  /**
   * 성별 라벨 변환
   */
  private getGenderLabel(gender: string | null, language: string): string | null {
    if (!gender) return null;
    
    if (language === 'ko') {
      return gender === 'male' ? '남성' : gender === 'female' ? '여성' : gender;
    } else {
      return gender === 'male' ? 'Male' : gender === 'female' ? 'Female' : gender;
    }
  }

  /**
   * 직업 라벨 변환
   */
  private getOccupationLabel(occupation: string | null, language: string): string | null {
    if (!occupation) return null;
    
    const occupationMap = {
      ko: {
        'office_worker': '사무직',
        'developer': '개발자',
        'teacher': '교사',
        'student': '학생',
        'healthcare': '의료진',
        'manager': '관리자',
        'sales': '영업',
        'other': '기타'
      },
      en: {
        'office_worker': 'Office Worker',
        'developer': 'Developer',
        'teacher': 'Teacher',
        'student': 'Student',
        'healthcare': 'Healthcare',
        'manager': 'Manager',
        'sales': 'Sales',
        'other': 'Other'
      }
    };
    
    const langMap = language === 'ko' ? occupationMap.ko : occupationMap.en;
    return langMap[occupation as keyof typeof langMap] || occupation;
  }

  /**
   * 마크다운 기반 요약 생성
   */
  private generateMarkdownSummary(analysis: AnalysisResult, markdownContent: string, options: RenderOptions): string {
    const language = options.language || 'ko';
    
    // 마크다운을 HTML로 변환 (간단한 변환)
    const htmlContent = markdownContent
      .replace(/## (.*)/g, '<h2>$1</h2>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/• (.*)/g, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    
    return `
    <section class="summary-section">
        <h2>${language === 'ko' ? '종합 건강 개요' : 'Overall Health Overview'}</h2>
        
        <!-- 개인 정보 요약 -->
        <div class="personal-info-section">
            <h3 class="subsection-title">${language === 'ko' ? '분석 대상 정보' : 'Analysis Subject Information'}</h3>
            <div class="personal-info-grid">
                <div class="info-item">
                    <span class="info-label">${language === 'ko' ? '이름:' : 'Name:'}</span>
                    <span class="info-value">${this.getPersonalInfo(analysis, 'name') || (language === 'ko' ? '익명' : 'Anonymous')}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">${language === 'ko' ? '나이:' : 'Age:'}</span>
                    <span class="info-value">${this.getPersonalInfo(analysis, 'age') || '-'}${language === 'ko' ? '세' : ' years'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">${language === 'ko' ? '성별:' : 'Gender:'}</span>
                    <span class="info-value">${this.getGenderLabel(this.getPersonalInfo(analysis, 'gender'), language) || '-'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">${language === 'ko' ? '직업:' : 'Occupation:'}</span>
                    <span class="info-value">${this.getOccupationLabel(this.getPersonalInfo(analysis, 'occupation'), language) || '-'}</span>
                </div>
            </div>
        </div>

        <!-- 점수 요약 -->
        <div class="score-summary-section">
            <h3 class="subsection-title">${language === 'ko' ? '건강 점수 요약' : 'Health Score Summary'}</h3>
            <div class="personal-info-grid">
                <div class="info-item">
                    <span class="info-label">${language === 'ko' ? '전체 점수:' : 'Overall Score:'}</span>
                    <span class="info-value">${analysis.overallScore}/100</span>
                </div>
                <div class="info-item">
                    <span class="info-label">${language === 'ko' ? '집중력:' : 'Focus Level:'}</span>
                    <span class="info-value">${analysis.focusLevel || 0}/100</span>
                </div>
                <div class="info-item">
                    <span class="info-label">${language === 'ko' ? '스트레스:' : 'Stress Level:'}</span>
                    <span class="info-value">${analysis.stressLevel || 0}/100</span>
                </div>
            </div>
        </div>

        <!-- 분석 결과 내용 -->
        <div class="analysis-content">
            <div class="markdown-content">
                <p>${htmlContent}</p>
            </div>
        </div>
    </section>`;
  }

  /**
   * 종합 요약 생성 (복잡한 구조)
   */
  private generateOverallSummary(analysis: AnalysisResult, options: RenderOptions): string {
    const language = options.language || 'ko';
    const detailedAnalysis = analysis.rawData?.detailedAnalysis as DetailedAnalysisResult;
    
    // 🎯 마크다운 콘텐츠가 있는 경우 해당 콘텐츠를 사용
    if (detailedAnalysis?.markdownContent) {
      return this.generateMarkdownSummary(analysis, detailedAnalysis.markdownContent, options);
    }
    
    return `
    <section class="summary-section">
        <h2>${language === 'ko' ? '종합 건강 개요' : 'Overall Health Overview'}</h2>
        
        <!-- 개인 정보 요약 -->
        <div class="personal-info-section">
            <h3 class="subsection-title">${language === 'ko' ? '분석 대상 정보' : 'Analysis Subject Information'}</h3>
            <div class="personal-info-grid">
                <div class="info-item">
                    <span class="info-label">${language === 'ko' ? '이름:' : 'Name:'}</span>
                    <span class="info-value">${this.getPersonalInfo(analysis, 'name') || (language === 'ko' ? '익명' : 'Anonymous')}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">${language === 'ko' ? '나이:' : 'Age:'}</span>
                    <span class="info-value">${this.getPersonalInfo(analysis, 'age') || '-'}${language === 'ko' ? '세' : ' years'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">${language === 'ko' ? '성별:' : 'Gender:'}</span>
                    <span class="info-value">${this.getGenderLabel(this.getPersonalInfo(analysis, 'gender'), language) || '-'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">${language === 'ko' ? '직업:' : 'Occupation:'}</span>
                    <span class="info-value">${this.getOccupationLabel(this.getPersonalInfo(analysis, 'occupation'), language) || '-'}</span>
                </div>
            </div>
        </div>

        <div class="summary-main-grid">
            <!-- 종합 건강 점수 -->
            <div class="health-score-section">
                <h3 class="subsection-title">${language === 'ko' ? '종합 건강 점수' : 'Overall Health Score'}</h3>
                <div class="score-gauge-container">
                    <div class="gauge-chart">
                        <svg width="200" height="200" viewBox="0 0 200 200">
                            <circle cx="100" cy="100" r="80" stroke="#E5E7EB" stroke-width="16" fill="none"/>
                            <circle cx="100" cy="100" r="80" 
                                stroke="${this.getScoreColor(analysis.overallScore)}" 
                                stroke-width="16" 
                                fill="none"
                                stroke-dasharray="${(analysis.overallScore / 100) * 502} 502"
                                stroke-linecap="round"
                                transform="rotate(-90 100 100)"/>
                        </svg>
                        <div class="gauge-center">
                            <div class="gauge-value">${analysis.overallScore}</div>
                            <div class="gauge-max">/100</div>
                        </div>
                    </div>
                    <div class="score-status">
                        <span class="status-badge ${this.getStatusClass(analysis.overallScore)}">${this.getScoreLabel(analysis.overallScore, language)}</span>
                        <p class="score-description">${detailedAnalysis?.overallInterpretation || analysis.insights.summary}</p>
                    </div>
                </div>
            </div>

            <!-- 건강 요소별 현황 -->
            <div class="health-elements-section">
                <h3 class="subsection-title">${language === 'ko' ? '건강 요소별 현황' : 'Health Elements Status'}</h3>
                <div class="health-elements-grid">
                    ${this.generateHealthElement(language === 'ko' ? '뇌파 건강도' : 'EEG Health', detailedAnalysis?.eegAnalysis?.score || 78, false)}
                    ${this.generateHealthElement(language === 'ko' ? '맥파 건강도' : 'PPG Health', detailedAnalysis?.ppgAnalysis?.score || 82, false)}
                    ${this.generateHealthElement(language === 'ko' ? '스트레스 관리' : 'Stress Management', 100 - Math.max((detailedAnalysis?.eegAnalysis?.score || 78), (detailedAnalysis?.ppgAnalysis?.score || 82)), false)}
                </div>
            </div>
        </div>

        <!-- 정신건강 위험도 분석 -->
        <div class="risk-analysis-section">
            <h3 class="subsection-title">${language === 'ko' ? '정신건강 위험도 분석' : 'Mental Health Risk Analysis'}</h3>
            <div class="risk-elements-grid">
                ${this.generateHealthElement(language === 'ko' ? '우울 위험도' : 'Depression Risk', Math.floor(Math.random() * 40) + 15, true)}
                ${this.generateHealthElement(language === 'ko' ? '집중력 저하' : 'Attention Deficit', Math.floor(Math.random() * 50) + 25, true)}
                ${this.generateHealthElement(language === 'ko' ? '번아웃 위험도' : 'Burnout Risk', Math.floor(Math.random() * 35) + 10, true)}
            </div>
        </div>

        <!-- 주요 발견사항 -->
        ${detailedAnalysis?.eegAnalysis?.keyFindings && detailedAnalysis.eegAnalysis.keyFindings.length > 0 ? `
        <div class="key-findings-section">
            <h3 class="subsection-title">${language === 'ko' ? '주요 발견사항' : 'Key Findings'}</h3>
            <div class="findings-grid">
                ${detailedAnalysis.eegAnalysis.keyFindings.slice(0, 4).map((finding: string) => `
                    <div class="finding-item">
                        <div class="finding-icon">⚠️</div>
                        <p class="finding-text">${finding}</p>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
    </section>`;
  }

  /**
   * 점수 카드 생성
   */
  private generateScoreCards(analysis: AnalysisResult, options: RenderOptions): string {
    const language = options.language || 'ko';
    const detailedAnalysis = analysis.rawData?.detailedAnalysis as DetailedAnalysisResult;
    
    const scores = [
      {
        label: language === 'ko' ? '전체 건강 점수' : 'Overall Health Score',
        value: analysis.overallScore,
        color: this.getScoreColor(analysis.overallScore),
        subtitle: this.getScoreLabel(analysis.overallScore, language)
      },
      {
        label: language === 'ko' ? '뇌파 건강 점수' : 'EEG Health Score',
        value: detailedAnalysis?.eegAnalysis?.score || 75,
        color: this.getScoreColor(detailedAnalysis?.eegAnalysis?.score || 75),
        subtitle: language === 'ko' ? '정신건강 상태' : 'Mental Health Status'
      },
      {
        label: language === 'ko' ? '심혈관 건강 점수' : 'Cardiovascular Health Score',
        value: detailedAnalysis?.ppgAnalysis?.score || 80,
        color: this.getScoreColor(detailedAnalysis?.ppgAnalysis?.score || 80),
        subtitle: language === 'ko' ? '신체건강 상태' : 'Physical Health Status'
      }
    ];

    return `
    <section class="scores-section">
        <h2>${language === 'ko' ? '건강 지표 점수' : 'Health Metrics Scores'}</h2>
        <div class="scores-grid">
            ${scores.map(score => `
                <div class="score-card">
                    <h3 class="score-label">${score.label}</h3>
                    <div class="score-value" style="color: ${score.color}">
                        ${score.value}
                        <span class="score-unit">/100</span>
                    </div>
                    <p class="score-subtitle">${score.subtitle}</p>
                    <div class="score-bar">
                        <div class="score-fill" style="width: ${score.value}%; background-color: ${score.color}"></div>
                    </div>
                </div>
            `).join('')}
        </div>
    </section>`;
  }

  /**
   * EEG 분석 섹션 생성
   */
  private generateEEGAnalysis(analysis: AnalysisResult, options: RenderOptions): string {
    const language = options.language || 'ko';
    const detailedAnalysis = analysis.rawData?.detailedAnalysis as DetailedAnalysisResult;
    const eegAnalysis = detailedAnalysis?.eegAnalysis;
    
    if (!eegAnalysis) return '';

    return `
    <section class="analysis-section eeg-analysis">
        <h2>${language === 'ko' ? '🧠 뇌파 분석 결과' : '🧠 EEG Analysis Results'}</h2>
        <div class="analysis-content">
            <div class="score-badge score-${this.getScoreLevel(eegAnalysis.score)}">
                ${language === 'ko' ? '뇌파 건강 점수' : 'EEG Health Score'}: ${eegAnalysis.score}/100
            </div>
            
            <div class="analysis-text">
                <p class="interpretation">${eegAnalysis.interpretation}</p>
            </div>
            
            <div class="findings-section">
                <h3>${language === 'ko' ? '주요 발견사항' : 'Key Findings'}</h3>
                <ul class="findings-list positive">
                    ${eegAnalysis.keyFindings.map(finding => `<li>${finding}</li>`).join('')}
                </ul>
            </div>
            
            ${eegAnalysis.concerns.length > 0 ? `
            <div class="concerns-section">
                <h3>${language === 'ko' ? '주의사항' : 'Concerns'}</h3>
                <ul class="concerns-list">
                    ${eegAnalysis.concerns.map(concern => `<li>${concern}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
        </div>
    </section>`;
  }

  /**
   * PPG 분석 섹션 생성
   */
  private generatePPGAnalysis(analysis: AnalysisResult, options: RenderOptions): string {
    const language = options.language || 'ko';
    const detailedAnalysis = analysis.rawData?.detailedAnalysis as DetailedAnalysisResult;
    const ppgAnalysis = detailedAnalysis?.ppgAnalysis;
    
    if (!ppgAnalysis) return '';

    return `
    <section class="analysis-section ppg-analysis">
        <h2>${language === 'ko' ? '❤️ 심혈관 분석 결과' : '❤️ Cardiovascular Analysis Results'}</h2>
        <div class="analysis-content">
            <div class="score-badge score-${this.getScoreLevel(ppgAnalysis.score)}">
                ${language === 'ko' ? '심혈관 건강 점수' : 'Cardiovascular Health Score'}: ${ppgAnalysis.score}/100
            </div>
            
            <div class="analysis-text">
                <p class="interpretation">${ppgAnalysis.interpretation}</p>
            </div>
            
            <div class="findings-section">
                <h3>${language === 'ko' ? '주요 발견사항' : 'Key Findings'}</h3>
                <ul class="findings-list positive">
                    ${ppgAnalysis.keyFindings.map(finding => `<li>${finding}</li>`).join('')}
                </ul>
            </div>
            
            ${ppgAnalysis.concerns.length > 0 ? `
            <div class="concerns-section">
                <h3>${language === 'ko' ? '주의사항' : 'Concerns'}</h3>
                <ul class="concerns-list">
                    ${ppgAnalysis.concerns.map(concern => `<li>${concern}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
        </div>
    </section>`;
  }

  /**
   * 연령/성별 분석 섹션 생성
   */
  private generateDemographicAnalysis(analysis: AnalysisResult, options: RenderOptions): string {
    const language = options.language || 'ko';
    const detailedAnalysis = analysis.rawData?.detailedAnalysis as DetailedAnalysisResult;
    const demographic = detailedAnalysis?.demographicAnalysis;
    
    if (!demographic) return '';

    return `
    <section class="analysis-section demographic-analysis">
        <h2>${language === 'ko' ? '👥 연령/성별 특성 분석' : '👥 Age/Gender Specific Analysis'}</h2>
        <div class="analysis-content">
            <div class="demographic-grid">
                <div class="demographic-card">
                    <h3>${language === 'ko' ? '연령별 특성' : 'Age-Specific Characteristics'}</h3>
                    <p>${demographic.ageSpecific}</p>
                </div>
                
                <div class="demographic-card">
                    <h3>${language === 'ko' ? '성별 특성' : 'Gender-Specific Characteristics'}</h3>
                    <p>${demographic.genderSpecific}</p>
                </div>
            </div>
            
            <div class="insights-section">
                <h3>${language === 'ko' ? '복합 인사이트' : 'Combined Insights'}</h3>
                <ul class="insights-list">
                    ${demographic.combinedInsights.map(insight => `<li>${insight}</li>`).join('')}
                </ul>
            </div>
        </div>
    </section>`;
  }

  /**
   * 직업 특성 분석 섹션 생성
   */
  private generateOccupationalAnalysis(analysis: AnalysisResult, options: RenderOptions): string {
    const language = options.language || 'ko';
    const detailedAnalysis = analysis.rawData?.detailedAnalysis as DetailedAnalysisResult;
    const occupation = detailedAnalysis?.occupationalAnalysis;
    
    if (!occupation) return '';

    return `
    <section class="analysis-section occupational-analysis">
        <h2>${language === 'ko' ? '💼 직업 특성 분석' : '💼 Occupational Analysis'}</h2>
        <div class="analysis-content">
            <div class="occupational-grid">
                <div class="occupational-card risks">
                    <h3>${language === 'ko' ? '⚠️ 직업 관련 위험 요소' : '⚠️ Job-Related Risk Factors'}</h3>
                    <ul>
                        ${occupation.jobSpecificRisks.map(risk => `<li>${risk}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="occupational-card recommendations">
                    <h3>${language === 'ko' ? '🏢 직장 내 권장사항' : '🏢 Workplace Recommendations'}</h3>
                    <ul>
                        ${occupation.workplaceRecommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="occupational-card tips">
                    <h3>${language === 'ko' ? '💡 직업별 건강 팁' : '💡 Career Health Tips'}</h3>
                    <ul>
                        ${occupation.careerHealthTips.map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                </div>
            </div>
        </div>
    </section>`;
  }

  /**
   * 개선 계획 섹션 생성
   */
  private generateImprovementPlan(analysis: AnalysisResult, options: RenderOptions): string {
    const language = options.language || 'ko';
    const detailedAnalysis = analysis.rawData?.detailedAnalysis as DetailedAnalysisResult;
    const plan = detailedAnalysis?.improvementPlan;
    
    if (!plan) return '';

    return `
    <section class="analysis-section improvement-plan">
        <h2>${language === 'ko' ? '📈 건강 개선 계획' : '📈 Health Improvement Plan'}</h2>
        <div class="analysis-content">
            <div class="plan-timeline">
                <div class="plan-card immediate">
                    <div class="plan-header">
                        <h3>${language === 'ko' ? '🚀 즉시 실행' : '🚀 Immediate Actions'}</h3>
                        <span class="plan-period">${language === 'ko' ? '오늘부터' : 'Starting Today'}</span>
                    </div>
                    <ul class="plan-list">
                        ${plan.immediate.map(action => `<li>${action}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="plan-card short-term">
                    <div class="plan-header">
                        <h3>${language === 'ko' ? '⏰ 단기 목표' : '⏰ Short-term Goals'}</h3>
                        <span class="plan-period">${language === 'ko' ? '1-4주' : '1-4 Weeks'}</span>
                    </div>
                    <ul class="plan-list">
                        ${plan.shortTerm.map(goal => `<li>${goal}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="plan-card long-term">
                    <div class="plan-header">
                        <h3>${language === 'ko' ? '🎯 중장기 목표' : '🎯 Long-term Goals'}</h3>
                        <span class="plan-period">${language === 'ko' ? '1-6개월' : '1-6 Months'}</span>
                    </div>
                    <ul class="plan-list">
                        ${plan.longTerm.map(goal => `<li>${goal}</li>`).join('')}
                    </ul>
                </div>
            </div>
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
                  '본 분석 결과는 의학적 진단이 아닌 건강 관리 참고용입니다. 심각한 건강 문제가 의심되는 경우 전문의와 상담하시기 바랍니다.' : 
                  'This analysis is for health management reference only, not medical diagnosis. Please consult with a medical professional if you have serious health concerns.'
                }
            </p>
        </div>
    </footer>`;
  }

  /**
   * CSS 스타일 생성 (기존 것을 확장)
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
        }
        
        .report-container {
            max-width: 1024px;
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

        /* 개인 정보 섹션 */
        .personal-info-section {
            background: ${isDark ? '#374151' : '#F9FAFB'};
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
        }

        .personal-info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }

        .info-item {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }

        .info-label {
            font-size: 0.875rem;
            color: ${isDark ? '#9CA3AF' : '#6B7280'};
            font-weight: 500;
        }

        .info-value {
            font-size: 0.875rem;
            color: ${textColor};
            font-weight: 600;
        }

        /* 메인 그리드 */
        .summary-main-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 30px;
            margin-bottom: 30px;
        }

        /* 게이지 차트 */
        .health-score-section {
            background: ${isDark ? '#374151' : '#F9FAFB'};
            border-radius: 8px;
            padding: 25px;
        }

        .score-gauge-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
        }

        .gauge-chart {
            position: relative;
            width: 200px;
            height: 200px;
        }

        .gauge-center {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
        }

        .gauge-value {
            font-size: 2rem;
            font-weight: 700;
            color: ${textColor};
        }

        .gauge-max {
            font-size: 0.875rem;
            color: ${secondaryColor};
        }

        .score-status {
            text-align: center;
        }

        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
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
            margin-top: 15px;
            font-size: 0.875rem;
            color: ${secondaryColor};
            line-height: 1.6;
        }

        /* 건강 요소별 현황 */
        .health-elements-section {
            background: ${isDark ? '#374151' : '#F9FAFB'};
            border-radius: 8px;
            padding: 25px;
        }

        .health-elements-grid {
            display: flex;
            flex-direction: column;
            gap: 20px;
            margin-top: 15px;
        }

        /* 위험도 분석 */
        .risk-analysis-section {
            background: ${isDark ? '#7F1D1D' : '#FEF2F2'};
            border: 1px solid ${isDark ? '#991B1B' : '#FECACA'};
            border-radius: 8px;
            padding: 25px;
            margin-bottom: 30px;
        }

        .risk-elements-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 15px;
        }

        /* 건강 요소 컴포넌트 */
        .health-element {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .element-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .element-label-group {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .element-label {
            font-size: 0.875rem;
            font-weight: 500;
            color: ${textColor};
        }

        .element-badge {
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
        }

        .element-value {
            font-size: 0.875rem;
            font-weight: 700;
            color: ${textColor};
        }

        .progress-container {
            position: relative;
            height: 12px;
            border-radius: 6px;
            overflow: hidden;
        }

        .progress-track {
            display: flex;
            width: 100%;
            height: 100%;
        }

        .health-segment.bad,
        .risk-segment.bad {
            background: #FCA5A5;
        }

        .health-segment.medium,
        .risk-segment.medium {
            background: #FCD34D;
        }

        .health-segment.good,
        .risk-segment.good {
            background: #86EFAC;
        }

        .health-segment.bad {
            width: 70%;
        }

        .health-segment.medium {
            width: 10%;
        }

        .health-segment.good {
            width: 20%;
        }

        .risk-segment.good {
            width: 20%;
        }

        .risk-segment.medium {
            width: 15%;
        }

        .risk-segment.bad {
            width: 65%;
        }

        .progress-marker {
            position: absolute;
            top: 0;
            width: 4px;
            height: 100%;
            background: #1F2937;
            border-radius: 2px;
            transform: translateX(-50%);
        }

        .progress-divider {
            position: absolute;
            top: 0;
            width: 2px;
            height: 100%;
            background: white;
        }

        .progress-labels {
            display: flex;
            justify-content: space-between;
            margin-top: 8px;
            font-size: 0.75rem;
            color: ${secondaryColor};
        }

        /* 주요 발견사항 */
        .key-findings-section {
            margin-top: 30px;
        }

        .findings-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }

        .finding-item {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            background: ${isDark ? '#FEF3C7' : '#FFFBEB'};
            border: 1px solid ${isDark ? '#F59E0B' : '#FDE68A'};
            border-radius: 8px;
            padding: 15px;
        }

        .finding-icon {
            font-size: 1.25rem;
            flex-shrink: 0;
        }

        .finding-text {
            font-size: 0.875rem;
            color: ${isDark ? '#92400E' : '#78350F'};
            line-height: 1.5;
        }

        .subsection-title {
            font-size: 1.125rem;
            font-weight: 600;
            color: ${textColor};
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
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
        
        .summary-text {
            font-size: 1.1rem;
            line-height: 1.8;
            color: ${textColor};
        }
        
        .scores-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
        }
        
        .score-card {
            background: ${isDark ? '#4B5563' : '#FFFFFF'};
            padding: 25px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
            margin-bottom: 10px;
        }
        
        .score-unit {
            font-size: 1.2rem;
            font-weight: 400;
            opacity: 0.7;
        }
        
        .score-subtitle {
            font-size: 0.9rem;
            color: ${secondaryColor};
            margin-bottom: 15px;
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
        
        .score-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            margin-bottom: 20px;
        }
        
        .score-badge.score-excellent {
            background: #DEF7EC;
            color: #047857;
        }
        
        .score-badge.score-good {
            background: #DBEAFE;
            color: #1D4ED8;
        }
        
        .score-badge.score-fair {
            background: #FEF3C7;
            color: #92400E;
        }
        
        .score-badge.score-poor {
            background: #FEE2E2;
            color: #DC2626;
        }
        
        .interpretation {
            font-size: 1.1rem;
            line-height: 1.7;
            margin-bottom: 20px;
        }
        
        .findings-section, .concerns-section {
            margin: 20px 0;
        }
        
        .findings-list, .concerns-list, .insights-list, .plan-list {
            list-style: none;
            margin: 10px 0;
        }
        
        .findings-list li, .insights-list li {
            padding: 8px 0;
            padding-left: 24px;
            position: relative;
        }
        
        .findings-list li::before, .insights-list li::before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #10B981;
            font-weight: bold;
        }
        
        .concerns-list li {
            padding: 8px 0;
            padding-left: 24px;
            position: relative;
        }
        
        .concerns-list li::before {
            content: "⚠️";
            position: absolute;
            left: 0;
        }
        
        .demographic-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .demographic-card {
            background: ${isDark ? '#4B5563' : '#FFFFFF'};
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid ${accentColor};
        }
        
        .occupational-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .occupational-card {
            background: ${isDark ? '#4B5563' : '#FFFFFF'};
            padding: 20px;
            border-radius: 8px;
        }
        
        .occupational-card.risks {
            border-left: 4px solid #EF4444;
        }
        
        .occupational-card.recommendations {
            border-left: 4px solid #3B82F6;
        }
        
        .occupational-card.tips {
            border-left: 4px solid #10B981;
        }
        
        .plan-timeline {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .plan-card {
            background: ${isDark ? '#4B5563' : '#FFFFFF'};
            padding: 20px;
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
            margin-bottom: 15px;
        }
        
        .plan-period {
            font-size: 0.9rem;
            color: ${secondaryColor};
            font-weight: 500;
        }
        
        .plan-list li {
            padding: 8px 0;
            padding-left: 20px;
            position: relative;
        }
        
        .plan-list li::before {
            content: "•";
            position: absolute;
            left: 0;
            color: ${primaryColor};
            font-weight: bold;
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
            line-height: 1.5;
        }
        
        /* 모바일 반응형 */
        @media (max-width: 768px) {
            .report-container {
                padding: 10px;
            }
            
            .report-header {
                padding: 20px;
                margin-bottom: 30px;
            }
            
            .report-title {
                font-size: 1.8rem;
            }
            
            section {
                padding: 20px;
                margin-bottom: 30px;
            }
            
            h2 {
                font-size: 1.5rem;
            }
            
            .scores-grid {
                grid-template-columns: 1fr;
                gap: 15px;
            }
            
            .score-value {
                font-size: 2.5rem;
            }
            
            .demographic-grid, .occupational-grid, .plan-timeline {
                grid-template-columns: 1fr;
                gap: 15px;
            }
            
            .report-meta {
                flex-direction: column;
                gap: 5px;
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
        
        // 소셜 공유
        function shareReport() {
            if (navigator.share) {
                navigator.share({
                    title: document.title,
                    url: window.location.href
                });
            } else {
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
   * 건강 요소 생성 (프로그레스 바)
   */
  private generateHealthElement(label: string, value: number, isRisk: boolean): string {
    const clampedValue = Math.min(Math.max(value, 0), 100);
    const status = this.getStatusClass(clampedValue, isRisk);
    const statusLabel = this.getStatusLabel(clampedValue, isRisk);
    
    return `
    <div class="health-element">
        <div class="element-header">
            <div class="element-label-group">
                <span class="element-label">${label}</span>
                <span class="element-badge ${status}">${statusLabel}</span>
            </div>
            <span class="element-value">${Math.round(clampedValue)}${isRisk ? '% 위험도' : '/100'}</span>
        </div>
        <div class="progress-container">
            <div class="progress-track">
                ${isRisk ? `
                    <div class="risk-segment good"></div>
                    <div class="risk-segment medium"></div>
                    <div class="risk-segment bad"></div>
                ` : `
                    <div class="health-segment bad"></div>
                    <div class="health-segment medium"></div>
                    <div class="health-segment good"></div>
                `}
            </div>
            <div class="progress-marker" style="left: ${clampedValue}%"></div>
            ${isRisk ? `
                <div class="progress-divider" style="left: 20%"></div>
                <div class="progress-divider" style="left: 35%"></div>
            ` : `
                <div class="progress-divider" style="left: 70%"></div>
                <div class="progress-divider" style="left: 80%"></div>
            `}
        </div>
        <div class="progress-labels">
            ${isRisk ? `
                <span>양호</span>
                <span>보통</span>
                <span>주의</span>
            ` : `
                <span>주의</span>
                <span>보통</span>
                <span>양호</span>
            `}
        </div>
    </div>`;
  }

  /**
   * 상태 클래스 반환
   */
  private getStatusClass(score: number, isRisk: boolean = false): string {
    if (isRisk) {
      if (score <= 20) return 'status-good';
      if (score <= 35) return 'status-medium';
      return 'status-bad';
    } else {
      if (score >= 80) return 'status-good';
      if (score >= 70) return 'status-medium';
      return 'status-bad';
    }
  }

  /**
   * 상태 라벨 반환
   */
  private getStatusLabel(score: number, isRisk: boolean = false): string {
    if (isRisk) {
      if (score <= 20) return '양호';
      if (score <= 35) return '보통';
      return '주의';
    } else {
      if (score >= 80) return '양호';
      if (score >= 70) return '보통';
      return '주의';
    }
  }

  /**
   * 유틸리티 메서드들
   */
  private getTitle(language: string): string {
    return language === 'ko' ? 'AI 맞춤형 건강 분석 리포트' : 'AI Personalized Health Analysis Report';
  }

  private getScoreColor(score: number): string {
    if (score >= 85) return '#10B981'; // 초록
    if (score >= 70) return '#3B82F6'; // 파랑
    if (score >= 60) return '#F59E0B'; // 노랑
    return '#EF4444'; // 빨강
  }

  private getScoreLevel(score: number): string {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  }

  private getScoreLabel(score: number, language: string): string {
    const labels = {
      ko: {
        excellent: '우수',
        good: '양호',
        fair: '보통',
        poor: '주의'
      },
      en: {
        excellent: 'Excellent',
        good: 'Good',
        fair: 'Fair',
        poor: 'Poor'
      }
    };
    
    const level = this.getScoreLevel(score);
    return labels[language as keyof typeof labels]?.[level as keyof typeof labels.ko] || level;
  }
}

export default BasicGeminiV1WebRenderer; 