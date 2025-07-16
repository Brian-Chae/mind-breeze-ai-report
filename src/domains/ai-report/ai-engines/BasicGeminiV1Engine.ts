/**
 * Basic Gemini V1 AI 엔진 구현체
 * 기본적인 건강 분석 리포트 생성을 위한 Gemini API 엔진
 */

import { 
  IAIEngine, 
  MeasurementDataType, 
  ValidationResult, 
  AnalysisOptions, 
  AnalysisResult, 
  EngineCapabilities 
} from '../core/interfaces/IAIEngine';

export class BasicGeminiV1Engine implements IAIEngine {
  // 기본 정보
  readonly id = 'basic-gemini-v1';
  readonly name = '기본 Gemini 분석';
  readonly description = 'Google Gemini API를 사용한 기본적인 건강 분석 엔진';
  readonly version = '1.0.0';
  readonly provider = 'gemini';
  
  // 지원 기능
  readonly supportedDataTypes: MeasurementDataType = {
    eeg: true,
    ppg: true,
    acc: true
  };
  
  readonly costPerAnalysis = 1; // 1 크레딧
  readonly recommendedRenderers = ['basic-gemini-v1-web']; // 매칭되는 렌더러 ID
  
  readonly capabilities: EngineCapabilities = {
    supportedLanguages: ['ko', 'en'],
    maxDataDuration: 300, // 5분
    minDataQuality: 30, // 30% 이상
    supportedOutputFormats: ['json', 'text'],
    realTimeProcessing: false
  };

  private readonly apiKey: string;
  private readonly modelName = 'gemini-1.5-flash';
  
  constructor(apiKey?: string) {
    // 브라우저 환경에서는 import.meta.env 사용
    let envApiKey = '';
    try {
      envApiKey = import.meta.env?.VITE_GOOGLE_GEMINI_API_KEY || '';
    } catch (e) {
      // 환경변수 접근 실패시 무시
    }
    
    this.apiKey = apiKey || envApiKey || '';
    if (!this.apiKey) {
      console.warn('Gemini API key not provided. Engine will not function properly.');
    }
  }

  /**
   * 측정 데이터 유효성 검증
   */
  async validate(data: any): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let qualityScore = 0;

    try {
      // 기본 구조 검증
      if (!data) {
        errors.push('측정 데이터가 없습니다.');
        return { isValid: false, errors, warnings, qualityScore: 0 };
      }

      // EEG 데이터 검증
      if (data.eeg) {
        if (!data.eeg.rawData || data.eeg.rawData.length === 0) {
          errors.push('EEG 원시 데이터가 없습니다.');
        } else if (data.eeg.rawData.length < 3600) { // 최소 1분 데이터
          warnings.push('EEG 데이터가 짧습니다. 더 정확한 분석을 위해 더 긴 측정을 권장합니다.');
        }
        qualityScore += 40;
      }

      // PPG 데이터 검증
      if (data.ppg) {
        if (!data.ppg.rawData || data.ppg.rawData.length === 0) {
          errors.push('PPG 원시 데이터가 없습니다.');
        } else if (data.ppg.rawData.length < 3600) {
          warnings.push('PPG 데이터가 짧습니다.');
        }
        qualityScore += 40;
      }

      // ACC 데이터 검증
      if (data.acc) {
        if (!data.acc.rawData || data.acc.rawData.length === 0) {
          warnings.push('ACC 데이터가 없습니다. 움직임 분석이 제한될 수 있습니다.');
        }
        qualityScore += 20;
      }

      // 품질 점수 계산
      if (data.qualityMetrics) {
        if (data.qualityMetrics.signalQuality < 0.3) {
          warnings.push('신호 품질이 낮습니다.');
          qualityScore *= 0.7;
        } else if (data.qualityMetrics.signalQuality > 0.8) {
          qualityScore *= 1.1;
        }
      }

      qualityScore = Math.min(100, Math.max(0, qualityScore));

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        qualityScore
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [`데이터 검증 중 오류 발생: ${error}`],
        warnings,
        qualityScore: 0
      };
    }
  }

  /**
   * AI 분석 수행
   */
  async analyze(data: any, options: AnalysisOptions = {}): Promise<AnalysisResult> {
    const startTime = Date.now();
    const analysisId = `${this.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // 데이터 유효성 검증
      const validation = await this.validate(data);
      if (!validation.isValid) {
        throw new Error(`데이터 검증 실패: ${validation.errors.join(', ')}`);
      }

      // AI 분석 요청 준비
      const analysisPrompt = this.generateAnalysisPrompt(data, options);
      const geminiResponse = await this.callGeminiAPI(analysisPrompt, options);
      
      // 결과 파싱
      const analysisData = this.parseGeminiResponse(geminiResponse);
      
      const processingTime = Date.now() - startTime;

      return {
        engineId: this.id,
        engineVersion: this.version,
        timestamp: new Date().toISOString(),
        analysisId,
        
        // 분석 결과
        overallScore: analysisData.overallScore || 70,
        stressLevel: analysisData.stressLevel || 50,
        focusLevel: analysisData.focusLevel || 60,
        
        // 상세 분석
        insights: {
          summary: analysisData.summary || '기본 건강 상태가 양호합니다.',
          detailedAnalysis: analysisData.detailedAnalysis || '상세 분석 데이터가 부족합니다.',
          recommendations: analysisData.recommendations || ['규칙적인 운동을 하세요.', '충분한 수면을 취하세요.'],
          warnings: validation.warnings
        },
        
        // 생체 지표
        metrics: {
          eeg: data.eeg ? {
            alpha: data.eeg.alpha || 0,
            beta: data.eeg.beta || 0,
            gamma: data.eeg.gamma || 0,
            theta: data.eeg.theta || 0,
            delta: data.eeg.delta || 0
          } : undefined,
          ppg: data.ppg ? {
            heartRate: data.ppg.heartRate || 70,
            hrv: data.ppg.hrv || 50,
            stressIndex: data.ppg.stressIndex || 30
          } : undefined,
          acc: data.acc ? {
            movementLevel: data.acc.movementLevel || 20,
            stability: data.acc.stability || 80
          } : undefined
        },
        
        // 메타 정보
        processingTime,
        costUsed: this.costPerAnalysis,
        rawData: geminiResponse
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      // 오류 발생 시 기본 결과 반환
      return {
        engineId: this.id,
        engineVersion: this.version,
        timestamp: new Date().toISOString(),
        analysisId,
        
        overallScore: 0,
        stressLevel: 0,
        focusLevel: 0,
        
        insights: {
          summary: '분석 중 오류가 발생했습니다.',
          detailedAnalysis: `오류 내용: ${error}`,
          recommendations: ['나중에 다시 시도해주세요.'],
          warnings: ['분석 실패']
        },
        
        metrics: {},
        
        processingTime,
        costUsed: 0,
        rawData: { error: error?.toString() }
      };
    }
  }

  /**
   * Gemini API 분석 프롬프트 생성
   */
  private generateAnalysisPrompt(data: any, options: AnalysisOptions): string {
    const language = options.outputLanguage || 'ko';
    const depth = options.analysisDepth || 'basic';
    
    let prompt = '';
    
    if (language === 'ko') {
      prompt = `
당신은 전문 의료진이자 건강 분석 전문가입니다. 
다음 생체 데이터를 분석하여 사용자의 건강 상태를 평가해주세요.

## 측정 데이터:
${JSON.stringify(data, null, 2)}

## 분석 요청사항:
- 전반적인 건강 점수 (0-100점)
- 스트레스 수준 (0-100점, 높을수록 스트레스 많음)
- 집중력 수준 (0-100점, 높을수록 집중력 좋음)
- 상세 분석 및 해석
- 개선 방향 및 권장사항

## 출력 형식:
JSON 형태로 다음 구조에 맞춰 응답해주세요:
{
  "overallScore": 점수,
  "stressLevel": 점수,
  "focusLevel": 점수,
  "summary": "한줄 요약",
  "detailedAnalysis": "상세 분석 내용",
  "recommendations": ["권장사항1", "권장사항2", "권장사항3"]
}
`;
    } else {
      prompt = `
You are a medical professional and health analysis expert.
Please analyze the following biometric data to evaluate the user's health status.

## Measurement Data:
${JSON.stringify(data, null, 2)}

## Analysis Requirements:
- Overall health score (0-100)
- Stress level (0-100, higher means more stressed)
- Focus level (0-100, higher means better focus)
- Detailed analysis and interpretation
- Improvement directions and recommendations

## Output Format:
Please respond in JSON format with the following structure:
{
  "overallScore": score,
  "stressLevel": score,
  "focusLevel": score,
  "summary": "one-line summary",
  "detailedAnalysis": "detailed analysis content",
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
}
`;
    }

    if (options.customPrompt) {
      prompt += `\n\n추가 요청사항: ${options.customPrompt}`;
    }

    return prompt;
  }

  /**
   * Gemini API 호출
   */
  private async callGeminiAPI(prompt: string, options: AnalysisOptions): Promise<any> {
    if (!this.apiKey) {
      throw new Error('Gemini API key가 설정되지 않았습니다.');
    }

    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.1, // 일관성 있는 결과를 위해 낮은 temperature
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      },
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API 호출 실패: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  }

  /**
   * Gemini 응답 파싱
   */
  private parseGeminiResponse(response: any): any {
    try {
      if (!response.candidates || response.candidates.length === 0) {
        throw new Error('Gemini API에서 유효한 응답을 받지 못했습니다.');
      }

      const text = response.candidates[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Gemini API 응답에서 텍스트를 찾을 수 없습니다.');
      }

      // JSON 파싱 시도
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // JSON이 없으면 기본 구조로 파싱
      return {
        overallScore: 70,
        stressLevel: 50,
        focusLevel: 60,
        summary: text.substring(0, 100) + '...',
        detailedAnalysis: text,
        recommendations: ['정기적인 건강 검진을 받으세요.']
      };

    } catch (error) {
      console.error('Gemini 응답 파싱 오류:', error);
      return {
        overallScore: 50,
        stressLevel: 60,
        focusLevel: 40,
        summary: '응답 파싱에 실패했습니다.',
        detailedAnalysis: '응답을 처리하는 중 문제가 발생했습니다.',
        recommendations: ['나중에 다시 시도해주세요.']
      };
    }
  }

  /**
   * 지원하는 건강 지표 목록
   */
  getHealthMetrics(): string[] {
    return [
      'overall_health',
      'stress_level', 
      'focus_level',
      'heart_rate',
      'hrv',
      'brain_waves',
      'movement_analysis'
    ];
  }

  /**
   * 권장사항 카테고리 목록
   */
  getRecommendationCategories(): string[] {
    return [
      'exercise',
      'nutrition',
      'sleep',
      'stress_management',
      'mental_health',
      'lifestyle'
    ];
  }

  /**
   * 샘플 프롬프트 목록
   */
  getSamplePrompts(): string[] {
    return [
      '스트레스 관리에 중점을 둔 분석',
      '수면 패턴 개선 방안 중심 분석',
      '운동 계획 수립을 위한 분석',
      '업무 집중력 향상 방안 분석'
    ];
  }
}

export default BasicGeminiV1Engine; 