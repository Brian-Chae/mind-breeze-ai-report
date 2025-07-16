/**
 * Basic Gemini V1 AI 엔진 구현체
 * 기본적인 건강 분석 리포트 생성
 */

import { 
  AIAnalysisResult, 
  EngineExecutionContext, 
  MeasurementData 
} from '../types';

interface AIEngineExecutor {
  execute(context: EngineExecutionContext): Promise<AIAnalysisResult>;
  validate(measurementData: MeasurementData): boolean;
}

export class BasicGeminiV1Engine implements AIEngineExecutor {
  private readonly apiKey: string;
  private readonly modelName = 'gemini-1.5-flash';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  /**
   * AI 엔진 실행
   */
  async execute(context: EngineExecutionContext): Promise<AIAnalysisResult> {
    try {
      // 1. 프롬프트 생성
      const prompt = this.generatePrompt(context.measurementData);
      
      // 2. Gemini API 호출
      const rawOutput = await this.callGeminiAPI(prompt);
      
      // 3. 결과 파싱
      const parsedResult = this.parseResponse(rawOutput);
      
      return {
        rawOutput,
        parsedResult: {
          overallScore: parsedResult.overallScore,
          riskLevel: parsedResult.riskLevel,
          stressAnalysis: parsedResult.stressAnalysis,
          focusAnalysis: parsedResult.focusAnalysis,
          recommendations: parsedResult.recommendations,
          warnings: parsedResult.warnings,
          confidence: parsedResult.confidence || 0.85,
          analysisVersion: 'basic_gemini_v1.0'
        }
      };
      
    } catch (error: any) {
      console.error('BasicGeminiV1Engine execution failed:', error);
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }
  
  /**
   * 측정 데이터 검증
   */
  validate(measurementData: MeasurementData): boolean {
    // 기본 품질 요구사항
    if (measurementData.dataQuality.overallScore < 50) {
      return false;
    }
    
    // EEG와 PPG 데이터 필수
    if (!measurementData.eegMetrics || !measurementData.ppgMetrics) {
      return false;
    }
    
    // 심박수 유효성 확인
    if (measurementData.ppgMetrics.heartRate <= 0 || 
        measurementData.ppgMetrics.heartRate > 200) {
      return false;
    }
    
    return true;
  }
  
  /**
   * 프롬프트 생성
   */
  private generatePrompt(measurementData: MeasurementData): string {
    const { eegMetrics, ppgMetrics, accMetrics, dataQuality } = measurementData;
    
    return `
## 생체신호 분석 요청

당신은 전문 의료진과 AI 전문가로 구성된 팀의 일원입니다. 다음 1분간 측정된 생체신호 데이터를 분석하여 건강 상태를 평가해주세요.

### 측정 데이터
**측정 일시**: ${measurementData.measurementDate.toISOString()}
**측정 기간**: ${measurementData.duration}초
**디바이스**: ${measurementData.deviceInfo.model}

### EEG (뇌파) 데이터
- Delta 파워: ${eegMetrics.delta.toFixed(2)}
- Theta 파워: ${eegMetrics.theta.toFixed(2)}
- Alpha 파워: ${eegMetrics.alpha.toFixed(2)}
- Beta 파워: ${eegMetrics.beta.toFixed(2)}
- Gamma 파워: ${eegMetrics.gamma.toFixed(2)}

**뇌파 지표**:
- 집중도 지수: ${eegMetrics.attentionIndex}/100
- 명상 지수: ${eegMetrics.meditationIndex}/100
- 스트레스 지수: ${eegMetrics.stressIndex}/100
- 피로도 지수: ${eegMetrics.fatigueIndex}/100
- 신호 품질: ${(eegMetrics.signalQuality * 100).toFixed(1)}%

### PPG (심박) 데이터
- 심박수: ${ppgMetrics.heartRate} BPM
- 심박변이도 (HRV): ${ppgMetrics.heartRateVariability.toFixed(2)} ms
- 스트레스 점수: ${ppgMetrics.stressScore}/100
- 자율신경균형: ${ppgMetrics.autonomicBalance.toFixed(2)}
- 신호 품질: ${(ppgMetrics.signalQuality * 100).toFixed(1)}%

### 활동 데이터
- 활동 수준: ${accMetrics.activityLevel}/100
- 움직임 강도: ${(accMetrics.movementIntensity * 100).toFixed(1)}%
- 자세: ${accMetrics.posture}
- 자세 안정성: ${(accMetrics.postureStability * 100).toFixed(1)}%

### 데이터 품질
- 전체 품질: ${dataQuality.overallScore}/100
- EEG 품질: ${dataQuality.eegQuality}/100
- PPG 품질: ${dataQuality.ppgQuality}/100
- 움직임 간섭: ${dataQuality.motionInterference}/100

## 분석 요구사항

다음 형식의 JSON으로 분석 결과를 제공해주세요:

\`\`\`json
{
  "overallScore": 85,
  "riskLevel": "LOW",
  "stressAnalysis": {
    "stressLevel": "보통",
    "stressFactors": ["업무 스트레스", "수면 부족"],
    "autonomicBalance": "양호",
    "recommendation": "규칙적인 휴식과 명상 권장"
  },
  "focusAnalysis": {
    "concentrationLevel": "높음",
    "attentionSpan": "양호",
    "cognitiveLoad": "적정",
    "recommendation": "현재 집중력 상태 유지"
  },
  "recommendations": [
    "하루 20분 이상 명상 또는 심호흡 연습",
    "규칙적인 수면 패턴 유지 (7-8시간)",
    "적당한 강도의 유산소 운동 (주 3회)"
  ],
  "warnings": [
    "스트레스 지수가 다소 높게 측정됨"
  ],
  "confidence": 0.87
}
\`\`\`

### 분석 지침
1. **전체 점수 (overallScore)**: 0-100점으로 전반적인 건강 상태 평가
2. **위험도 (riskLevel)**: LOW, MEDIUM, HIGH, CRITICAL 중 선택
3. **스트레스 분석**: EEG 스트레스 지수와 PPG 자율신경 데이터 종합 분석
4. **집중력 분석**: EEG 집중도 지수와 관련 뇌파 패턴 분석
5. **추천사항**: 구체적이고 실행 가능한 3-5개 권장사항
6. **주의사항**: 주의깊게 관찰해야 할 이상 징후나 패턴
7. **신뢰도**: 분석 결과의 신뢰도 (0.0-1.0)

분석은 의학적 진단이 아닌 건강 관리 참고용입니다.
`;
  }
  
  /**
   * Gemini API 호출
   */
  private async callGeminiAPI(prompt: string): Promise<any> {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response from Gemini API');
      }
      
      const text = data.candidates[0].content.parts[0].text;
      return text;
      
    } catch (error: any) {
      console.error('Gemini API call failed:', error);
      throw new Error(`API call failed: ${error.message}`);
    }
  }
  
  /**
   * API 응답 파싱
   */
  private parseResponse(rawOutput: string): any {
    try {
      // JSON 블록 추출
      const jsonMatch = rawOutput.match(/```json\n([\s\S]*?)\n```/);
      
      if (!jsonMatch) {
        // JSON 블록이 없는 경우 전체 텍스트에서 JSON 추출 시도
        const jsonStart = rawOutput.indexOf('{');
        const jsonEnd = rawOutput.lastIndexOf('}');
        
        if (jsonStart === -1 || jsonEnd === -1) {
          throw new Error('No valid JSON found in response');
        }
        
        const jsonText = rawOutput.substring(jsonStart, jsonEnd + 1);
        return JSON.parse(jsonText);
      }
      
      const jsonText = jsonMatch[1];
      const parsed = JSON.parse(jsonText);
      
      // 필수 필드 검증
      this.validateParsedResponse(parsed);
      
      return parsed;
      
    } catch (error: any) {
      console.error('Failed to parse AI response:', error);
      
      // 파싱 실패 시 기본 응답 반환
      return this.createFallbackResponse();
    }
  }
  
  /**
   * 파싱된 응답 검증
   */
  private validateParsedResponse(parsed: any): void {
    const required = ['overallScore', 'riskLevel', 'recommendations'];
    
    for (const field of required) {
      if (!(field in parsed)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    if (parsed.overallScore < 0 || parsed.overallScore > 100) {
      throw new Error('Invalid overallScore range');
    }
    
    if (!['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(parsed.riskLevel)) {
      throw new Error('Invalid riskLevel');
    }
    
    if (!Array.isArray(parsed.recommendations) || parsed.recommendations.length === 0) {
      throw new Error('Invalid recommendations format');
    }
  }
  
  /**
   * 파싱 실패 시 기본 응답 생성
   */
  private createFallbackResponse(): any {
    return {
      overallScore: 75,
      riskLevel: 'MEDIUM',
      stressAnalysis: {
        stressLevel: '보통',
        stressFactors: ['측정 데이터 품질 이슈'],
        autonomicBalance: '평가 불가',
        recommendation: '재측정 권장'
      },
      focusAnalysis: {
        concentrationLevel: '평가 불가',
        attentionSpan: '데이터 부족',
        cognitiveLoad: '평가 불가',
        recommendation: '재측정 권장'
      },
      recommendations: [
        '측정 환경을 개선하여 재측정하시기 바랍니다',
        '디바이스 연결 상태와 착용 상태를 확인해주세요',
        '측정 중 움직임을 최소화해주세요'
      ],
      warnings: [
        '데이터 품질 이슈로 인해 정확한 분석이 어려움',
        '결과 해석 시 주의 필요'
      ],
      confidence: 0.3
    };
  }
} 