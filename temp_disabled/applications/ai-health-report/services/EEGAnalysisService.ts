/**
 * EEG 분석 전용 서비스
 * - 뇌파 데이터 분석
 * - 정신건강 상태 평가
 * - 신경과학 기반 해석
 */

import { APIKeyManager } from '../../../services/APIKeyManager';
import { PersonalInfo, MeasurementData } from '../types/index';
import { JSONSanitizer } from '../utils/JSONSanitizer';
import { ResponseValidator } from '../utils/ResponseValidator';

export interface EEGAnalysisResult {
  score: number;
  status: string;
  analysis: string;
  keyMetrics: Record<string, string>;
  recommendations: string[];
  concerns: string[];
}

export class EEGAnalysisService {
  private static readonly API_KEY_ID = 'gemini-api';
  private static readonly API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
  
  private static readonly CONFIG = {
    model: 'gemini-2.5-flash',
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 90000
  };

  /**
   * EEG 데이터 기반 정신건강 분석
   */
  static async analyzeEEG(
    personalInfo: PersonalInfo,
    measurementData: MeasurementData
  ): Promise<EEGAnalysisResult> {
    console.log('🧠 EEG 분석 시작...');
    
    const prompt = this.generateEEGAnalysisPrompt(personalInfo, measurementData);
    
    try {
      const response = await this.makeRequest(prompt);
      const result = await this.parseEEGResponse(response);
      
      console.log('✅ EEG 분석 완료:', result);
      return result;
    } catch (error) {
      console.error('❌ EEG 분석 실패:', error);
      throw error;
    }
  }

  /**
   * EEG 분석 프롬프트 생성
   */
  private static generateEEGAnalysisPrompt(
    personalInfo: PersonalInfo,
    measurementData: MeasurementData
  ): string {
    const age = this.calculateAge(personalInfo);
    const occupationLabel = this.getOccupationLabel(personalInfo.occupation, personalInfo.customOccupation);
    const qualityAssessment = this.assessMeasurementQuality(measurementData.accMetrics);

    // 실제 EEG 메트릭 값들을 미리 계산
    const eegMetrics = measurementData.eegMetrics;
    const focusIndexValue = eegMetrics.focusIndex?.value?.toFixed(3) || 'N/A';
    const relaxationIndexValue = eegMetrics.relaxationIndex?.value?.toFixed(3) || 'N/A';
    const stressIndexValue = eegMetrics.stressIndex?.value?.toFixed(3) || 'N/A';
    const cognitiveLoadValue = eegMetrics.cognitiveLoad?.value?.toFixed(3) || 'N/A';
    const emotionalStabilityValue = eegMetrics.emotionalStability?.value?.toFixed(3) || 'N/A';
    const hemisphericBalanceValue = eegMetrics.hemisphericBalance?.value?.toFixed(3) || 'N/A';
    const totalPowerValue = eegMetrics.totalPower?.value?.toFixed(3) || 'N/A';
    
    // 추가 메트릭들
    const meditationIndexValue = (eegMetrics as any).meditationIndex?.value?.toFixed(3) || 'N/A';
    const attentionIndexValue = (eegMetrics as any).attentionIndex?.value?.toFixed(3) || 'N/A';

    return `
당신은 신경과학 박사 학위를 보유한 뇌파(EEG) 분석 전문 건강 분석 AI입니다. 15년 이상의 연구 경험과 최신 뇌과학 연구를 바탕으로 정신건강 상태를 종합적으로 분석해주세요.

**중요 지침:**
- 이 분석은 의료 정보 수준의 건강 참고 자료이며, 의료 진단이나 치료를 대체하지 않습니다.
- 특정 제품명, 브랜드명, 앱 이름 등은 절대 언급하지 마세요.
- 일반적인 건강 관리 방법과 생활습관 개선 방안만 제시하세요.
- "전문가 소견", "정신 건강 평가", "정신 건강 관리 가이드" 등의 의료 행위 관련 표현은 사용하지 마세요.
- 분석 결과에서 직업을 언급할 때는 반드시 "${occupationLabel}"로 표기하고, "military_medic" 같은 원본 코드는 절대 사용하지 마세요.

## 개인 정보 및 맥락 분석
- 이름: ${personalInfo.name}
- 나이: ${age}세 (${this.getAgeGroup(age)} 연령대 특성 고려)
- 성별: ${personalInfo.gender === 'male' ? '남성' : '여성'} (성별 특이적 뇌파 패턴 고려)
- 직업: ${occupationLabel} (직업적 인지 부하 및 스트레스 요인 고려)

## 뇌파(EEG) 정밀 분석 데이터 (MetricWithContext 구조)
### 인지 기능 지표
- **집중력 지수**: ${focusIndexValue} 
  * 정상범위: ${eegMetrics.focusIndex?.normalRange || '1.8-2.4'}
  * 해석: ${eegMetrics.focusIndex?.interpretation || '베타파 기반 집중도 지수'}
  * 공식: ${eegMetrics.focusIndex?.formula || '베타파 파워 / (알파파 + 세타파)'}
  * 건강 의미: 
    - 정상 미만: ${eegMetrics.focusIndex?.clinicalMeaning?.belowNormal || '주의력 관리 필요'}
    - 정상 범위: ${eegMetrics.focusIndex?.clinicalMeaning?.withinNormal || '건강한 집중력'}
    - 정상 초과: ${eegMetrics.focusIndex?.clinicalMeaning?.aboveNormal || '과도한 긴장'}

- **인지 부하**: ${cognitiveLoadValue}
  * 정상범위: ${eegMetrics.cognitiveLoad?.normalRange || '0.3-0.8'}
  * 해석: ${eegMetrics.cognitiveLoad?.interpretation || '작업 기억 부하 지수'}
  * 공식: ${eegMetrics.cognitiveLoad?.formula || '세타파 / 알파파'}
  * 건강 의미:
    - 정상 미만: ${eegMetrics.cognitiveLoad?.clinicalMeaning?.belowNormal || '인지 여유'}
    - 정상 범위: ${eegMetrics.cognitiveLoad?.clinicalMeaning?.withinNormal || '적절한 인지 부하'}
    - 정상 초과: ${eegMetrics.cognitiveLoad?.clinicalMeaning?.aboveNormal || '인지 과부하'}

### 정서 및 스트레스 지표
- **이완도 지수**: ${relaxationIndexValue}
  * 정상범위: ${eegMetrics.relaxationIndex?.normalRange || '0.18-0.22'}
  * 해석: ${eegMetrics.relaxationIndex?.interpretation || '알파파 기반 이완 지수'}
  * 공식: ${eegMetrics.relaxationIndex?.formula || '알파파 파워 / 전체 파워'}
  * 건강 의미:
    - 정상 미만: ${eegMetrics.relaxationIndex?.clinicalMeaning?.belowNormal || '긴장 상태'}
    - 정상 범위: ${eegMetrics.relaxationIndex?.clinicalMeaning?.withinNormal || '적절한 이완'}
    - 정상 초과: ${eegMetrics.relaxationIndex?.clinicalMeaning?.aboveNormal || '과도한 이완'}

- **스트레스 지수**: ${stressIndexValue}
  * 정상범위: ${eegMetrics.stressIndex?.normalRange || '3.0-4.0'}
  * 해석: ${eegMetrics.stressIndex?.interpretation || '베타파 기반 스트레스 지수'}
  * 공식: ${eegMetrics.stressIndex?.formula || '베타파 파워 / 알파파 파워'}
  * 건강 의미:
    - 정상 미만: ${eegMetrics.stressIndex?.clinicalMeaning?.belowNormal || '스트레스 반응 저하'}
    - 정상 범위: ${eegMetrics.stressIndex?.clinicalMeaning?.withinNormal || '적절한 스트레스 반응'}
    - 정상 초과: ${eegMetrics.stressIndex?.clinicalMeaning?.aboveNormal || '만성 스트레스'}

- **정서 안정성**: ${emotionalStabilityValue}
  * 정상범위: ${eegMetrics.emotionalStability?.normalRange || '0.6-0.8'}
  * 해석: ${eegMetrics.emotionalStability?.interpretation || '전두엽 기반 감정 조절 지수'}
  * 공식: ${eegMetrics.emotionalStability?.formula || '알파파 / (베타파 + 세타파)'}
  * 건강 의미:
    - 정상 미만: ${eegMetrics.emotionalStability?.clinicalMeaning?.belowNormal || '감정 조절 관리 필요'}
    - 정상 범위: ${eegMetrics.emotionalStability?.clinicalMeaning?.withinNormal || '안정적 감정 조절'}
    - 정상 초과: ${eegMetrics.emotionalStability?.clinicalMeaning?.aboveNormal || '과도한 감정 억제'}

### 뇌 기능 균형 지표
- **좌우뇌 균형**: ${hemisphericBalanceValue}
  * 정상범위: ${eegMetrics.hemisphericBalance?.normalRange || '-0.1~0.1'}
  * 해석: ${eegMetrics.hemisphericBalance?.interpretation || '좌우 반구 활성도 균형'}
  * 공식: ${eegMetrics.hemisphericBalance?.formula || '(좌뇌 파워 - 우뇌 파워) / 전체 파워'}
  * 건강 의미:
    - 정상 미만: ${eegMetrics.hemisphericBalance?.clinicalMeaning?.belowNormal || '우뇌 우세'}
    - 정상 범위: ${eegMetrics.hemisphericBalance?.clinicalMeaning?.withinNormal || '균형적 뇌 활성'}
    - 정상 초과: ${eegMetrics.hemisphericBalance?.clinicalMeaning?.aboveNormal || '좌뇌 우세'}

- **전체 뇌 활성도**: ${totalPowerValue}
  * 정상범위: ${eegMetrics.totalPower?.normalRange || '100-300'}
  * 해석: ${eegMetrics.totalPower?.interpretation || '전체 뇌파 파워'}
  * 공식: ${eegMetrics.totalPower?.formula || '모든 주파수 대역의 파워 합'}
  * 건강 의미:
    - 정상 미만: ${eegMetrics.totalPower?.clinicalMeaning?.belowNormal || '뇌 활성도 저하'}
    - 정상 범위: ${eegMetrics.totalPower?.clinicalMeaning?.withinNormal || '정상 뇌 활성도'}
    - 정상 초과: ${eegMetrics.totalPower?.clinicalMeaning?.aboveNormal || '뇌 과활성'}

## 신경과학적 해석 기준
### 뇌파 주파수 대역별 의미
- **Delta (0.5-4Hz)**: 깊은 수면, 뇌 회복 과정, 무의식 처리
- **Theta (4-8Hz)**: 창의성, 직관, 명상 상태, 기억 통합
- **Alpha (8-13Hz)**: 이완된 각성, 집중, 인지 효율성
- **Beta (13-30Hz)**: 각성, 논리적 사고, 과도 시 스트레스
- **Gamma (30-100Hz)**: 고차원 인지, 의식 통합, 신경 동기화

### 뇌 영역별 기능 연관성
- **전전두엽**: 실행 기능, 의사결정, 감정 조절, 작업 기억
- **측두엽**: 장기 기억, 언어 처리, 감정 처리 (해마, 편도체)
- **두정엽**: 공간 인지, 주의 집중, 감각 통합
- **후두엽**: 시각 정보 처리, 인지 부하 반영

## 측정 품질 및 신뢰도 평가
${qualityAssessment.assessment}
신뢰도: ${qualityAssessment.reliability}
**데이터 해석 가능성**: ${measurementData.signalQuality.eeg >= 70 ? '높음 - 건강 분석 가능' : measurementData.signalQuality.eeg >= 50 ? '보통 - 참고용 해석' : '낮음 - 재측정 권장'}

## 🎯 중요: 응답 형식 지침

**반드시 다음 JSON 형식으로만 응답하세요:**

\`\`\`json
{
  "score": 숫자 (0-100),
  "status": "문자열 (양호/보통/주의)",
  "analysis": "상세 분석 내용 (마크다운 형식 가능, 따옴표 내부에서 개행은 \\n 사용)",
  "keyMetrics": {
    "집중력 지수": "값과 해석",
    "이완도 지수": "값과 해석",
    "스트레스 지수": "값과 해석",
    "인지 부하": "값과 해석",
    "정서 안정성": "값과 해석"
  },
  "recommendations": [
    "권장사항 1",
    "권장사항 2",
    "권장사항 3"
  ],
  "concerns": [
    "주의사항 1 (있는 경우)",
    "주의사항 2 (있는 경우)"
  ]
}

**중요한 JSON 형식 규칙:**
1. 모든 문자열은 반드시 큰따옴표("")로 감싸세요
2. 문자열 내부의 개행은 \\n으로 표현하세요
3. 문자열 내부의 따옴표는 \\"로 이스케이프하세요
4. 마지막 속성 뒤에는 콤마를 붙이지 마세요
5. 배열과 객체의 모든 괄호를 정확히 닫아주세요
6. 코드 블록 마커는 사용하지 마세요

## 종합 정신건강 분석 요구사항

### 1. 신경과학적 해석
- 각 지표를 뇌 영역별 기능과 연결하여 해석
- 신경 전달물질 (도파민, 세로토닌, 노르에피네프린) 활성도 추정
- 뇌파 패턴의 건강 의미 및 정상 변이 구분

### 2. 개인화된 평가
- 연령대별 뇌 발달 및 노화 특성 고려
- 성별 특이적 뇌파 패턴 및 호르몬 영향 분석
- 직업적 요구사항과 뇌 기능 매칭 평가

### 3. 건강 상태 평가 및 위험도 분석
- 정신건강 상태 평가 (참고 목적)
- 인지 기능 관리 필요성 평가
- 스트레스 관련 건강 위험 인자 평가

### 4. 개선 가능성 및 관리 방안
- 뇌 건강 개선 가능성 평가
- 생활습관 개선 방법별 효과 예측
- 장기적 뇌 건강 유지 전략

### 5. 🎯 정확한 점수 계산 (필수)
**현재 측정값을 기반으로 정규분포를 따르는 점수 계산:**

#### 집중력 지수 (${focusIndexValue})
- 정상범위: ${eegMetrics.focusIndex?.normalRange || '1.8-2.4'}
- 현재값 평가 및 점수 기여도 계산

#### 이완도 지수 (${relaxationIndexValue})
- 정상범위: ${eegMetrics.relaxationIndex?.normalRange || '0.18-0.22'}
- 현재값 평가 및 점수 기여도 계산

#### 스트레스 지수 (${stressIndexValue})
- 정상범위: ${eegMetrics.stressIndex?.normalRange || '3.0-4.0'}
- 현재값 평가 및 점수 기여도 계산

#### 인지 부하 (${cognitiveLoadValue})
- 정상범위: ${eegMetrics.cognitiveLoad?.normalRange || '0.3-0.8'}
- 현재값 평가 및 점수 기여도 계산

#### 정서 안정성 (${emotionalStabilityValue})
- 정상범위: ${eegMetrics.emotionalStability?.normalRange || '0.4-0.8'}
- 현재값 평가 및 점수 기여도 계산

**최종 점수는 위 분포 기준에 따라 정확히 계산하여 제시하세요.**

다음 형식으로 상세한 JSON 응답을 제공해주세요:
{
  "score": 67,
  "status": "보통",
  "analysis": "**뇌파 기반 인지 기능 평가:**\\n- 집중력 지수: ${focusIndexValue} (정상범위 ${eegMetrics.focusIndex?.normalRange || '1.8-2.4'})\\n  베타파와 SMR파의 비율로 주의집중 능력을 평가한 결과입니다.\\n- 인지 부하: ${cognitiveLoadValue} (정상범위 ${eegMetrics.cognitiveLoad?.normalRange || '0.3-0.8'})\\n  정신적 작업 부하와 인지적 피로도를 나타내는 지표입니다.\\n- 좌우뇌 균형: ${hemisphericBalanceValue}\\n  좌뇌와 우뇌의 활성도 균형 상태를 평가합니다.\\n\\n**정서 안정성 및 스트레스 평가:**\\n- 이완도: ${relaxationIndexValue} (정상범위 ${eegMetrics.relaxationIndex?.normalRange || '0.18-0.22'})\\n  알파파 활성도를 통해 정신적 이완 상태를 평가합니다.\\n- 스트레스 지수: ${stressIndexValue} (정상범위 ${eegMetrics.stressIndex?.normalRange || '3.0-4.0'})\\n  베타파와 감마파의 비율로 정신적 스트레스 수준을 평가합니다.\\n- 정서 안정성: ${emotionalStabilityValue} (정상범위 ${eegMetrics.emotionalStability?.normalRange || '0.4-0.8'})\\n  감정 조절 능력과 정서적 안정성을 나타내는 지표입니다.\\n\\n**뇌 기능 종합 평가:**\\n현재 뇌 기능 상태는 ${age}세 ${personalInfo.gender === 'male' ? '남성' : '여성'} ${occupationLabel}의 일반적인 뇌파 패턴과 비교하여 평가되었습니다. 측정된 각 뇌파 지표를 종합한 결과, 전체 인구 대비 상대적 위치를 고려한 점수입니다."
  "keyMetrics": {
    "concentration": "집중력 ${focusIndexValue}: [베타파 기반 주의 집중 능력, 인지 효율성, 작업 수행 능력 평가]",
    "relaxation": "이완도 ${relaxationIndexValue}: [알파파 기반 정신적 이완 능력, 스트레스 해소 능력, 회복력 평가]",
    "brainBalance": "뇌 균형 ${hemisphericBalanceValue}: [좌우뇌 활성도 균형, 통합적 사고 능력, 뇌 기능 조화]",
    "cognitiveLoad": "인지 부하 ${cognitiveLoadValue}: [작업 기억 부하, 정보 처리 능력, 정신적 피로도 평가]",
    "emotionalStability": "정서 안정성 ${emotionalStabilityValue}: [감정 조절 능력, 심리적 안정성, 스트레스 대응력]"
  },
  "recommendations": [
    "🧘‍♀️ 마음챙김 명상: [뇌파 최적화, 집중력 향상, 정서 안정성 증진 효과]",
    "🌿 자연 속 산책: [알파파 증가, 스트레스 감소, 뇌 회복 촉진]",
    "📚 독서 및 학습: [인지 기능 향상, 뇌 가소성 증진, 집중력 강화]",
    "🎵 음악 감상: [뇌파 조절, 정서 안정, 창의성 향상 효과]",
    "💤 규칙적 수면: [뇌 회복, 기억 정리, 인지 기능 최적화]"
  ],
  "concerns": [
    "⚠️ 인지 과부하 위험: [지속적인 정신적 피로, 집중력 저하, 스트레스 누적]",
    "🔴 정서 불안정성: [감정 조절 어려움, 스트레스 대응력 부족, 심리적 불균형]",
    "🟡 뇌 기능 불균형: [좌우뇌 활성도 차이, 통합적 사고 제한, 인지 효율성 저하]"
  ]
}

**중요**: 모든 분석은 최신 신경과학 연구를 기반으로 하며, 건강 참고 목적으로만 사용하시고 전문의 상담이 필요한 경우 의료기관을 방문하시기 바랍니다.
`;
  }

  /**
   * Gemini API 요청
   */
  private static async makeRequest(prompt: string): Promise<any> {
    const apiKey = await APIKeyManager.getActiveGeminiAPIKey();
    if (!apiKey) {
      throw new Error('Gemini API 키가 설정되지 않았습니다.');
    }

    const response = await fetch(`${this.API_BASE_URL}/${this.CONFIG.model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    return response.json();
  }

  /**
   * 응답 파싱 (검증 시스템 적용)
   */
  private static async parseEEGResponse(response: any): Promise<EEGAnalysisResult> {
    const text = response.candidates[0].content.parts[0].text;
    console.log('🧠 EEG 분석 응답 파싱 시작. 원본 길이:', text.length);
    
    // 다양한 JSON 형식 패턴 시도 (개선된 패턴)
    const jsonPatterns = [
      // 표준 마크다운 코드 블록
      /```json\s*\n([\s\S]*?)\n\s*```/,
      /```json([\s\S]*?)```/,
      
      // 일반 코드 블록
      /```\s*\n([\s\S]*?)\n\s*```/,
      /```([\s\S]*?)```/,
      
      // JSON 라벨이 있는 경우
      /json\s*\n([\s\S]*?)(?:\n\s*$|$)/i,
      /JSON\s*\n([\s\S]*?)(?:\n\s*$|$)/i,
      
      // 중괄호로 시작하는 JSON 객체
      /(\{[\s\S]*\})/,
      
      // 전체 텍스트에서 JSON 추출
      /([\s\S]*)/
    ];
    
    let lastError: Error | null = null;
    
    for (let i = 0; i < jsonPatterns.length; i++) {
      const pattern = jsonPatterns[i];
      const match = text.match(pattern);
      
      if (match) {
        console.log(`📝 EEG 패턴 ${i + 1} 매치 성공`);
        
        try {
          const jsonText = match[1] || match[0];
          console.log('🔍 EEG JSON 원본 길이:', jsonText.length);
          
          let result: EEGAnalysisResult;
          
          // 1단계: 원본 JSON 파싱 시도
          try {
            result = JSON.parse(jsonText);
            console.log('✅ EEG 원본 JSON 파싱 성공');
          } catch (originalError) {
            console.warn('⚠️ EEG 원본 JSON 파싱 실패, JSONSanitizer 적용:', originalError);
            lastError = originalError as Error;
            
            // 2단계: JSONSanitizer 적용 후 파싱 시도
            const sanitizationResult = JSONSanitizer.sanitizeJSON(jsonText);
            
            console.log('🔧 EEG JSON 정리 결과:', {
              success: sanitizationResult.success,
              appliedFixes: sanitizationResult.appliedFixes,
              errors: sanitizationResult.errors,
              warnings: sanitizationResult.warnings
            });
            
            if (sanitizationResult.success) {
              try {
                result = JSON.parse(sanitizationResult.sanitizedText);
                console.log('✅ EEG 정리된 JSON 파싱 성공');
              } catch (sanitizedError) {
                console.error('❌ EEG 정리된 JSON도 파싱 실패:', sanitizedError);
                throw originalError; // 원본 오류를 다시 던짐
              }
            } else {
              console.error('❌ EEG JSONSanitizer 적용 실패:', sanitizationResult.errors);
              throw originalError; // 원본 오류를 다시 던짐
            }
          }
          
          // 3단계: 기본 구조 검증
          if (!this.isValidEEGStructure(result)) {
            console.warn('⚠️ EEG 응답 구조가 불완전함, 보완 시도');
            result = this.repairEEGStructure(result);
          }
          
          // 4단계: 응답 검증
          const validationResult = ResponseValidator.validateEEGResponse(result);
          
          console.log('🔍 EEG 응답 검증 결과:', {
            isValid: validationResult.isValid,
            score: validationResult.score,
            errorCount: validationResult.errors.length
          });
          
          // 검증 경고 및 오류 로깅
          if (validationResult.errors.length > 0) {
            console.warn('⚠️ EEG 검증 오류:', validationResult.errors);
          }
          
          // 치명적 오류가 있으면 예외 발생
          const criticalErrors = validationResult.errors.filter((e: any) => e.severity === 'critical');
          if (criticalErrors.length > 0) {
            console.error('🚨 EEG 치명적 검증 오류:', criticalErrors);
            throw new Error(`EEG 응답 검증 실패: ${criticalErrors.map((e: any) => e.message).join(', ')}`);
          }
          
          console.log('✅ EEG 분석 응답 파싱 및 검증 완료. 품질 점수:', validationResult.score);
          return result;
          
        } catch (error) {
          console.warn(`❌ EEG 패턴 ${i + 1} JSON 파싱 실패, 다음 패턴 시도:`, error);
          lastError = error as Error;
          
          // JSON 오류 상세 분석
          if (error instanceof SyntaxError) {
            const errorAnalysis = JSONSanitizer.analyzeJSONError(match[1] || match[0]);
            if (errorAnalysis) {
              console.error('📍 EEG JSON 오류 위치:', {
                line: errorAnalysis.line,
                column: errorAnalysis.column,
                message: errorAnalysis.message,
                context: errorAnalysis.context?.substring(0, 100) + '...'
              });
            }
          }
          continue;
        }
      }
    }
    
    // 모든 패턴 실패 시 상세한 오류 정보 제공
    console.error('❌ EEG 분석 응답 파싱 실패. 응답 텍스트:', text.substring(0, 500) + '...');
    
    if (lastError) {
      console.error('❌ 마지막 오류:', lastError.message);
    }
    
    // 최후의 수단: 폴백 응답 생성
    console.warn('🔄 EEG 폴백 응답 생성 시도');
    const fallbackResult = this.createFallbackEEGResult(text);
    if (fallbackResult) {
      console.log('✅ EEG 폴백 응답 생성 성공');
      return fallbackResult;
    }
    
    throw new Error('EEG 분석 응답에서 JSON 형식을 찾을 수 없습니다.');
  }

  /**
   * EEG 응답 구조 유효성 검사
   */
  private static isValidEEGStructure(result: any): boolean {
    return (
      result &&
      typeof result === 'object' &&
      typeof result.score === 'number' &&
      typeof result.status === 'string' &&
      typeof result.analysis === 'string' &&
      Array.isArray(result.recommendations) &&
      Array.isArray(result.concerns)
    );
  }

  /**
   * 불완전한 EEG 응답 구조 보완
   */
  private static repairEEGStructure(result: any): EEGAnalysisResult {
    const repaired: EEGAnalysisResult = {
      score: typeof result.score === 'number' ? result.score : 65,
      status: typeof result.status === 'string' ? result.status : '보통',
      analysis: typeof result.analysis === 'string' ? result.analysis : '분석 내용을 처리하는 중 오류가 발생했습니다.',
      keyMetrics: result.keyMetrics && typeof result.keyMetrics === 'object' ? result.keyMetrics : {},
      recommendations: Array.isArray(result.recommendations) ? result.recommendations : ['전문가와 상담하시기 바랍니다.'],
      concerns: Array.isArray(result.concerns) ? result.concerns : []
    };

    console.log('🔧 EEG 응답 구조 보완 완료');
    return repaired;
  }

  /**
   * 폴백 EEG 응답 생성
   */
  private static createFallbackEEGResult(originalText: string): EEGAnalysisResult | null {
    try {
      // 원본 텍스트에서 점수나 상태 정보 추출 시도
      const scoreMatch = originalText.match(/(?:score|점수)[":\s]*(\d+)/i);
      const statusMatch = originalText.match(/(?:status|상태)[":\s]*["']?([^"',\n]+)["']?/i);
      
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 65;
      const status = statusMatch ? statusMatch[1].trim() : '보통';
      
      // 분석 내용 추출 시도
      let analysis = '뇌파 분석을 수행했으나 상세 결과를 표시하는데 기술적 문제가 발생했습니다.';
      const analysisMatch = originalText.match(/(?:analysis|분석)[":\s]*["']([^"']+)["']/i);
      if (analysisMatch) {
        analysis = analysisMatch[1];
      } else {
        // 긴 텍스트 블록 찾기
        const longTextMatch = originalText.match(/["']([^"']{100,})["']/);
        if (longTextMatch) {
          analysis = longTextMatch[1].substring(0, 500) + '...';
        }
      }

      return {
        score,
        status,
        analysis,
        keyMetrics: {},
        recommendations: ['측정을 다시 시도해보시기 바랍니다.', '전문가와 상담하시기 바랍니다.'],
        concerns: ['응답 파싱 오류로 인한 불완전한 분석']
      };
    } catch (error) {
      console.error('❌ EEG 폴백 응답 생성 실패:', error);
      return null;
    }
  }

  // 헬퍼 메서드들
  private static calculateAge(personalInfo: PersonalInfo): number {
    const currentYear = new Date().getFullYear();
    if (personalInfo.birthYear) {
      return currentYear - personalInfo.birthYear;
    }
    if (personalInfo.birthDate) {
      const [year] = personalInfo.birthDate.split('-').map(Number);
      return currentYear - year;
    }
    return 0;
  }

  private static getAgeGroup(age: number): string {
    if (age < 20) return "청소년기";
    if (age < 30) return "청년기";
    if (age < 40) return "초기 성인기";
    if (age < 50) return "중년 초기";
    if (age < 60) return "중년 후기";
    if (age < 70) return "초기 노년기";
    return "후기 노년기";
  }

  private static getOccupationLabel(occupation: string, customOccupation?: string): string {
    const occupationLabels: Record<string, string> = {
      'teacher': '교사',
      'military_medic': '직업군인',
      'military_career': '직업군인',
      'elementary': '초등학생',
      'middle_school': '중학생',
      'high_school': '고등학생',
      'university': '대학생',
      'housewife': '전업주부',
      'parent': '학부모',
      'firefighter': '소방공무원',
      'police': '경찰공무원',
      'developer': '개발자',
      'designer': '디자이너',
      'office_worker': '일반 사무직',
      'manager': '관리자',
      'general_worker': '일반 직장인',
      'entrepreneur': '사업가',
      'other': customOccupation || '기타',
      '': '미분류'
    };
    
    return occupationLabels[occupation] || occupation;
  }

  private static assessMeasurementQuality(accMetrics: any): { assessment: string; reliability: string; warnings: string[] } {
    const stability = accMetrics.stability || 0;
    const movement = accMetrics.averageMovement || 0;
    const warnings: string[] = [];

    let assessment = '';
    let reliability = '';

    if (stability >= 80 && movement <= 0.1) {
      assessment = "최적 측정 환경 (안정된 자세, 최소한의 움직임)";
      reliability = "매우 높음";
    } else if (stability >= 60) {
      assessment = "양호한 측정 환경 (약간의 움직임 있음)";
      reliability = "높음";
      warnings.push("측정 중 약간의 움직임이 감지됨");
    } else {
      assessment = "부적절한 측정 환경 (과도한 움직임)";
      reliability = "낮음";
      warnings.push("측정 중 과도한 움직임으로 인한 노이즈 발생");
    }

    return { assessment, reliability, warnings };
  }
} 