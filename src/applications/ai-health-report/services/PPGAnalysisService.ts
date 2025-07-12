/**
 * PPG 분석 전용 서비스
 * - 심박 데이터 분석
 * - 신체건강 상태 평가
 * - 심혈관계 기반 해석
 */

import { APIKeyManager } from '../../../services/APIKeyManager';
import { PersonalInfo, MeasurementData } from '../types/index';
import { JSONSanitizer } from '../utils/JSONSanitizer';
import { ResponseValidator } from '../utils/ResponseValidator';

export interface PPGAnalysisResult {
  score: number;
  status: string;
  analysis: string;
  keyMetrics: Record<string, string>;
  recommendations: string[];
  concerns: string[];
}

export class PPGAnalysisService {
  private static readonly API_KEY_ID = 'gemini-api';
  private static readonly API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
  
  private static readonly CONFIG = {
    model: 'gemini-2.5-flash',
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 90000
  };

  /**
   * PPG 데이터 기반 신체건강 분석
   */
  static async analyzePPG(
    personalInfo: PersonalInfo,
    measurementData: MeasurementData
  ): Promise<PPGAnalysisResult> {
    console.log('❤️ PPG 분석 시작...');
    
    const prompt = this.generatePPGAnalysisPrompt(personalInfo, measurementData);
    
    try {
      const response = await this.makeRequest(prompt);
      const result = await this.parsePPGResponse(response);
      
      console.log('✅ PPG 분석 완료:', result);
      return result;
    } catch (error) {
      console.error('❌ PPG 분석 실패:', error);
      throw error;
    }
  }

  /**
   * PPG 분석 프롬프트 생성
   */
  private static generatePPGAnalysisPrompt(
    personalInfo: PersonalInfo,
    measurementData: MeasurementData
  ): string {
    const age = this.calculateAge(personalInfo);
    const occupationLabel = this.getOccupationLabel(personalInfo.occupation, personalInfo.customOccupation);
    const qualityAssessment = this.assessMeasurementQuality(measurementData.accMetrics);

    // 실제 PPG 메트릭 값들을 미리 계산
    const ppgMetrics = measurementData.ppgMetrics;
    const heartRateValue = Math.round(ppgMetrics.heartRate?.value || 0);
    const rmssdValue = Math.round(ppgMetrics.rmssd?.value || 0);
    const sdnnValue = Math.round(ppgMetrics.sdnn?.value || 0);
    const pnn50Value = Math.round(ppgMetrics.pnn50?.value || 0);
    const spo2Value = Math.round(ppgMetrics.spo2?.value || 0);
    const lfPowerValue = ppgMetrics.lfPower?.value?.toFixed(2) || 'N/A';
    const hfPowerValue = ppgMetrics.hfPower?.value?.toFixed(2) || 'N/A';
    const lfHfRatioValue = ppgMetrics.lfHfRatio?.value?.toFixed(2) || 'N/A';
    
    // 추가 HRV 메트릭들
    const sdsdValue = Math.round((ppgMetrics as any).sdsd?.value || 0);
    const avnnValue = Math.round((ppgMetrics as any).avnn?.value || 0);
    const pnn20Value = ((ppgMetrics as any).pnn20?.value || 0).toFixed(1);
    const hrMaxValue = Math.round((ppgMetrics as any).hrMax?.value || 0);
    const hrMinValue = Math.round((ppgMetrics as any).hrMin?.value || 0);

    return `
당신은 심혈관 생리학 박사 학위를 보유한 심박변이도(HRV) 및 PPG 분석 전문 건강 분석 AI입니다. 15년 이상의 연구 경험과 최신 심혈관 생리학 연구를 바탕으로 신체건강 상태를 종합적으로 분석해주세요.

**중요 지침:**
- 이 분석은 의료 정보 수준의 건강 참고 자료이며, 의료 진단이나 치료를 대체하지 않습니다.
- 특정 제품명, 브랜드명, 앱 이름 등은 절대 언급하지 마세요.
- 일반적인 건강 관리 방법과 생활습관 개선 방안만 제시하세요.
- "전문가 소견", "정신 건강 평가", "정신 건강 관리 가이드" 등의 의료 행위 관련 표현은 사용하지 마세요.
- 분석 결과에서 직업을 언급할 때는 반드시 "${occupationLabel}"로 표기하고, "military_medic" 같은 원본 코드는 절대 사용하지 마세요.

## 개인 정보 및 맥락 분석
- 이름: ${personalInfo.name}
- 나이: ${age}세 (${this.getAgeGroup(age)} 연령대 심혈관 특성 고려)
- 성별: ${personalInfo.gender === 'male' ? '남성' : '여성'} (성별 특이적 심혈관 패턴 고려)
- 직업: ${occupationLabel} (직업적 신체적 부하 및 스트레스 요인 고려)

## 심박변이도(HRV) 및 PPG 정밀 분석 데이터
### 심박 기본 지표
- **심박수**: ${heartRateValue} bpm
  * 정상범위: ${ppgMetrics.heartRate?.normalRange || '60-100 bpm'}
  * 해석: ${ppgMetrics.heartRate?.interpretation || '안정시 심박수'}
  * 건강 의미:
    - 정상 미만: ${ppgMetrics.heartRate?.clinicalMeaning?.belowNormal || '서맥, 운동 선수 또는 부정맥'}
    - 정상 범위: ${ppgMetrics.heartRate?.clinicalMeaning?.withinNormal || '정상 심박수'}
    - 정상 초과: ${ppgMetrics.heartRate?.clinicalMeaning?.aboveNormal || '빈맥, 스트레스 또는 흥분'}

### 심박변이도(HRV) 지표
- **RMSSD**: ${rmssdValue} ms
  * 정상범위: ${ppgMetrics.rmssd?.normalRange || '20-50 ms'}
  * 해석: ${ppgMetrics.rmssd?.interpretation || '부교감신경 활성도 지표'}
  * 건강 의미:
    - 정상 미만: ${ppgMetrics.rmssd?.clinicalMeaning?.belowNormal || '부교감신경 활성도 저하'}
    - 정상 범위: ${ppgMetrics.rmssd?.clinicalMeaning?.withinNormal || '건강한 자율신경 기능'}
    - 정상 초과: ${ppgMetrics.rmssd?.clinicalMeaning?.aboveNormal || '높은 부교감신경 활성도'}

- **SDNN**: ${sdnnValue} ms
  * 정상범위: ${ppgMetrics.sdnn?.normalRange || '30-100 ms'}
  * 해석: ${ppgMetrics.sdnn?.interpretation || '전체 자율신경 활성도'}
  * 건강 의미:
    - 정상 미만: ${ppgMetrics.sdnn?.clinicalMeaning?.belowNormal || '자율신경 기능 저하'}
    - 정상 범위: ${ppgMetrics.sdnn?.clinicalMeaning?.withinNormal || '건강한 자율신경 균형'}
    - 정상 초과: ${ppgMetrics.sdnn?.clinicalMeaning?.aboveNormal || '높은 자율신경 활성도'}

- **pNN50**: ${pnn50Value}%
  * 정상범위: ${ppgMetrics.pnn50?.normalRange || '5-25%'}
  * 해석: ${ppgMetrics.pnn50?.interpretation || '심박변이도 일관성 지표'}
  * 건강 의미:
    - 정상 미만: ${ppgMetrics.pnn50?.clinicalMeaning?.belowNormal || '심박변이도 감소'}
    - 정상 범위: ${ppgMetrics.pnn50?.clinicalMeaning?.withinNormal || '적절한 심박변이도'}
    - 정상 초과: ${ppgMetrics.pnn50?.clinicalMeaning?.aboveNormal || '높은 심박변이도'}

### 산소포화도 및 순환 지표
- **산소포화도(SpO2)**: ${spo2Value}%
  * 정상범위: ${ppgMetrics.spo2?.normalRange || '95-100%'}
  * 해석: ${ppgMetrics.spo2?.interpretation || '혈중 산소 포화도'}
  * 건강 의미:
    - 정상 미만: ${ppgMetrics.spo2?.clinicalMeaning?.belowNormal || '산소 공급 부족'}
    - 정상 범위: ${ppgMetrics.spo2?.clinicalMeaning?.withinNormal || '정상 산소 공급'}
    - 정상 초과: ${ppgMetrics.spo2?.clinicalMeaning?.aboveNormal || '과포화 상태'}

### 주파수 영역 분석
- **LF Power**: ${lfPowerValue} ms²
  * 정상범위: ${ppgMetrics.lfPower?.normalRange || '300-1000 ms²'}
  * 해석: ${ppgMetrics.lfPower?.interpretation || '교감신경 활성도 지표'}
  * 건강 의미:
    - 정상 미만: ${ppgMetrics.lfPower?.clinicalMeaning?.belowNormal || '교감신경 활성도 저하'}
    - 정상 범위: ${ppgMetrics.lfPower?.clinicalMeaning?.withinNormal || '적절한 교감신경 활성도'}
    - 정상 초과: ${ppgMetrics.lfPower?.clinicalMeaning?.aboveNormal || '높은 교감신경 활성도'}

- **HF Power**: ${hfPowerValue} ms²
  * 정상범위: ${ppgMetrics.hfPower?.normalRange || '300-1500 ms²'}
  * 해석: ${ppgMetrics.hfPower?.interpretation || '부교감신경 활성도 지표'}
  * 건강 의미:
    - 정상 미만: ${ppgMetrics.hfPower?.clinicalMeaning?.belowNormal || '부교감신경 활성도 저하'}
    - 정상 범위: ${ppgMetrics.hfPower?.clinicalMeaning?.withinNormal || '건강한 부교감신경 활성도'}
    - 정상 초과: ${ppgMetrics.hfPower?.clinicalMeaning?.aboveNormal || '높은 부교감신경 활성도'}

- **LF/HF 비율**: ${lfHfRatioValue}
  * 정상범위: ${ppgMetrics.lfHfRatio?.normalRange || '0.5-2.0'}
  * 해석: ${ppgMetrics.lfHfRatio?.interpretation || '자율신경 균형 지표'}
  * 건강 의미:
    - 정상 미만: ${ppgMetrics.lfHfRatio?.clinicalMeaning?.belowNormal || '부교감신경 우세'}
    - 정상 범위: ${ppgMetrics.lfHfRatio?.clinicalMeaning?.withinNormal || '자율신경 균형'}
    - 정상 초과: ${ppgMetrics.lfHfRatio?.clinicalMeaning?.aboveNormal || '교감신경 우세'}

## 심혈관 생리학적 해석 기준
### 자율신경계 기능 평가
- **교감신경계**: 스트레스 반응, 각성 상태, 심박수 증가, 혈압 상승
- **부교감신경계**: 휴식 반응, 회복 상태, 심박수 감소, 소화 촉진
- **자율신경 균형**: 교감/부교감 신경의 적절한 균형 상태

### 심혈관 적응 능력
- **심박변이도**: 심장의 자율신경 조절 능력 및 적응성
- **회복력**: 스트레스 후 정상 상태로의 회복 능력
- **순환 효율성**: 혈액 순환 및 산소 공급 효율성

## 🎯 중요: 정규분포 기반 점수 분포 시스템

### 점수 분포 기준 (정규분포 적용)
**0-100점 척도에서 다음 분포를 따라야 합니다:**

#### 위험군 (0-30점): 5% (하위 5%)
- 0-10점: 심각한 위험 (1%)
- 11-20점: 높은 위험 (2%) 
- 21-30점: 위험 (2%)

#### 경계군 (31-50점): 20% (하위 6-25%)
- 31-40점: 경계 위험 (10%)
- 41-50점: 주의 필요 (10%)

#### 보통 (51-70점): 50% (26-75%)
- 51-60점: 보통 하위 (25%)
- 61-70점: 보통 상위 (25%)

#### 양호 (71-85점): 20% (76-95%)
- 71-80점: 양호 (15%)
- 81-85점: 우수 (5%)

#### 매우 우수 (86-100점): 5% (상위 5%)
- 86-95점: 매우 우수 (4%)
- 96-100점: 최우수 (1%)

### 🔥 점수 계산 지침
**다음 생체신호 데이터를 분석하여 위 분포에 맞는 점수를 계산하세요:**

1. **각 지표별 정상 범위 대비 평가**
   - 정상 범위 내: 기본 50-70점대
   - 정상 범위 초과(긍정적): 71-85점대
   - 정상 범위 미만(부정적): 30-50점대

2. **복합 지표 고려**
   - 모든 지표가 우수: 80-90점대
   - 대부분 지표가 양호: 70-80점대
   - 일부 지표에 문제: 50-70점대
   - 여러 지표에 문제: 30-50점대
   - 심각한 문제: 30점 미만

3. **개인화 요소 반영**
   - 연령대별 기준 적용
   - 성별 특성 고려
   - 직업적 요구사항 반영

### ⚠️ 중요 지침
- **78-85점대 집중 현상을 피하세요**
- **실제 측정값을 기반으로 정확한 점수 계산**
- **정규분포를 따르는 현실적인 점수 부여**
- **명확한 근거와 함께 점수 제시**

## 측정 품질 및 신뢰도 평가
${qualityAssessment.assessment}
신뢰도: ${qualityAssessment.reliability}
**데이터 해석 가능성**: ${measurementData.signalQuality.ppg >= 70 ? '높음 - 건강 분석 가능' : measurementData.signalQuality.ppg >= 50 ? '보통 - 참고용 해석' : '낮음 - 재측정 권장'}

## 종합 신체건강 분석 요구사항

### 1. 심혈관 생리학적 해석
- 심박수 변이도(HRV) 분석을 통한 자율신경 기능 평가
- 혈관 탄성도 및 순환 기능 평가
- 산소 포화도 기반 호흡 및 순환 효율성 분석

### 2. 개인화된 평가
- 연령대별 심혈관 기능 특성 고려
- 성별 특이적 심혈관 패턴 및 호르몬 영향 분석
- 직업적 신체 활동 요구사항과 심혈관 기능 매칭

### 3. 건강 상태 평가 및 위험도 분석
- 심혈관 질환 위험 인자 분석
- 자율신경 기능 관리 필요성 평가
- 심혈관 질환 위험 인자 분석

### 4. 개선 가능성 및 관리 방안
- 심혈관 건강 개선 가능성 평가
- 운동 및 생활습관 개선 방법별 효과 예측
- 장기적 심혈관 건강 유지 전략

### 5. 🎯 정확한 점수 계산 (필수)
**현재 측정값을 기반으로 정규분포를 따르는 점수 계산:**

#### 심박수 (${heartRateValue} bpm)
- 정상범위: 60-100 bpm (연령별 조정)
- 현재값 평가 및 점수 기여도 계산

#### 심박변이도 RMSSD (${rmssdValue} ms)
- 정상범위: 연령별 차등 (20대: 30-50ms, 30대: 25-45ms, 40대: 20-40ms)
- 현재값 평가 및 점수 기여도 계산

#### 심박변이도 SDNN (${sdnnValue} ms)
- 정상범위: 연령별 차등 (20대: 40-60ms, 30대: 35-55ms, 40대: 30-50ms)
- 현재값 평가 및 점수 기여도 계산

#### 자율신경 균형 LF/HF (${lfHfRatioValue})
- 정상범위: 0.5-2.0 (균형적 자율신경 활성)
- 현재값 평가 및 점수 기여도 계산

#### 산소포화도 (${spo2Value}%)
- 정상범위: 95-100%
- 현재값 평가 및 점수 기여도 계산

**최종 점수는 위 분포 기준에 따라 정확히 계산하여 제시하세요.**

다음 형식으로 상세한 JSON 응답을 제공해주세요:

\`\`\`json
{
  "score": 58,
  "status": "보통",
  "analysis": "**심혈관 기능 평가:**\\n- 심박수: ${heartRateValue} bpm (정상범위 60-100 bpm)\\n  안정시 심박수로 심혈관 효율성과 운동 능력을 평가합니다.\\n- 심박변이도 RMSSD: ${rmssdValue} ms\\n  부교감신경 활성도와 스트레스 대응력을 나타내는 지표입니다.\\n- 심박변이도 SDNN: ${sdnnValue} ms\\n  전반적인 자율신경 기능과 심혈관 적응력을 평가합니다.\\n- 자율신경 균형 LF/HF: ${lfHfRatioValue} (정상범위 0.5-2.0)\\n  교감신경과 부교감신경의 균형 상태를 평가합니다.\\n\\n**순환 및 산소 공급 평가:**\\n- 산소포화도: ${spo2Value}% (정상범위 95-100%)\\n  혈중 산소 공급 상태와 호흡 효율성을 나타냅니다.\\n\\n**심혈관 건강 종합 평가:**\\n현재 심혈관 건강 상태는 ${age}세 ${personalInfo.gender === 'male' ? '남성' : '여성'} ${occupationLabel}의 일반적인 심혈관 패턴과 비교하여 평가되었습니다. 측정된 각 심혈관 지표를 종합한 결과, 전체 인구 대비 상대적 위치를 고려한 점수입니다."
  "keyMetrics": {
    "heartRate": "심박수 ${heartRateValue}: [안정시 심박수, 심혈관 효율성, 운동 능력 지표]",
    "hrv": "심박변이도 ${rmssdValue}: [자율신경 기능, 스트레스 대응력, 회복 능력 평가]",
    "autonomicBalance": "자율신경 균형 ${lfHfRatioValue}: [교감/부교감 신경 균형, 적응 능력, 건강 상태]",
    "oxygenSaturation": "산소포화도 ${spo2Value}: [혈중 산소 공급, 호흡 효율성, 순환 기능]",
    "circulation": "순환 효율성: [혈액 순환, 조직 산소 공급, 심혈관 건강 종합 평가]"
  },
  "recommendations": [
    "🏃‍♂️ 유산소 운동: [심혈관 기능 향상, 심박변이도 개선, 자율신경 균형 효과]",
    "🧘‍♀️ 심호흡 운동: [부교감신경 활성화, 스트레스 감소, 심박변이도 향상]",
    "💪 근력 운동: [심혈관 적응력 향상, 대사 개선, 전신 건강 증진]",
    "🌊 수영: [전신 순환 개선, 심폐 기능 강화, 관절 부담 최소화]",
    "😴 충분한 휴식: [심혈관 회복, 자율신경 재조정, 스트레스 해소]"
  ],
  "concerns": [
    "⚠️ 자율신경 불균형: [교감신경 과활성, 스트레스 반응 증가, 회복력 저하]",
    "🔴 순환 기능 저하: [혈액 순환 장애, 조직 산소 공급 부족, 피로감 증가]",
    "🟡 심혈관 적응력 부족: [스트레스 대응력 저하, 운동 능력 제한, 회복 지연]"
  ]
}
\`\`\`

**중요**: 모든 분석은 최신 심혈관 생리학 연구를 기반으로 하며, 건강 참고 목적으로만 사용하시고 전문의 상담이 필요한 경우 의료기관을 방문하시기 바랍니다.
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
  private static async parsePPGResponse(response: any): Promise<PPGAnalysisResult> {
    const text = response.candidates[0].content.parts[0].text;
    console.log('❤️ PPG 분석 응답 파싱 시작. 원본 길이:', text.length);
    
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
        console.log(`📝 PPG 패턴 ${i + 1} 매치 성공`);
        
        try {
          const jsonText = match[1] || match[0];
          console.log('🔍 PPG JSON 원본 길이:', jsonText.length);
          
          let result: PPGAnalysisResult;
          
          // 1단계: 원본 JSON 파싱 시도
          try {
            result = JSON.parse(jsonText);
            console.log('✅ PPG 원본 JSON 파싱 성공');
          } catch (originalError) {
            console.warn('⚠️ PPG 원본 JSON 파싱 실패, JSONSanitizer 적용:', originalError);
            lastError = originalError as Error;
            
            // 2단계: JSONSanitizer 적용 후 파싱 시도
            const sanitizationResult = JSONSanitizer.sanitizeJSON(jsonText);
            
            console.log('🔧 PPG JSON 정리 결과:', {
              success: sanitizationResult.success,
              appliedFixes: sanitizationResult.appliedFixes,
              errors: sanitizationResult.errors,
              warnings: sanitizationResult.warnings
            });
            
            if (sanitizationResult.success) {
              try {
                result = JSON.parse(sanitizationResult.sanitizedText);
                console.log('✅ PPG 정리된 JSON 파싱 성공');
              } catch (sanitizedError) {
                console.error('❌ PPG 정리된 JSON도 파싱 실패:', sanitizedError);
                throw originalError; // 원본 오류를 다시 던짐
              }
            } else {
              console.error('❌ PPG JSONSanitizer 적용 실패:', sanitizationResult.errors);
              throw originalError; // 원본 오류를 다시 던짐
            }
          }
          
          // 3단계: 기본 구조 검증
          if (!this.isValidPPGStructure(result)) {
            console.warn('⚠️ PPG 응답 구조가 불완전함, 보완 시도');
            result = this.repairPPGStructure(result);
          }
          
          // 4단계: 응답 검증
          const validationResult = ResponseValidator.validatePPGResponse(result);
          
          console.log('🔍 PPG 응답 검증 결과:', {
            isValid: validationResult.isValid,
            score: validationResult.score,
            errorCount: validationResult.errors.length
          });
          
          // 검증 경고 및 오류 로깅
          if (validationResult.errors.length > 0) {
            console.warn('⚠️ PPG 검증 오류:', validationResult.errors);
          }
          
          // 치명적 오류가 있으면 예외 발생
          const criticalErrors = validationResult.errors.filter((e: any) => e.severity === 'critical');
          if (criticalErrors.length > 0) {
            console.error('🚨 PPG 치명적 검증 오류:', criticalErrors);
            throw new Error(`PPG 응답 검증 실패: ${criticalErrors.map((e: any) => e.message).join(', ')}`);
          }
          
          console.log('✅ PPG 분석 응답 파싱 및 검증 완료. 품질 점수:', validationResult.score);
          return result;
          
        } catch (error) {
          console.warn(`❌ PPG 패턴 ${i + 1} JSON 파싱 실패, 다음 패턴 시도:`, error);
          lastError = error as Error;
          
          // JSON 오류 상세 분석
          if (error instanceof SyntaxError) {
            const errorAnalysis = JSONSanitizer.analyzeJSONError(match[1] || match[0]);
            if (errorAnalysis) {
              console.error('📍 PPG JSON 오류 위치:', {
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
    console.error('❌ PPG 분석 응답 파싱 실패. 응답 텍스트:', text.substring(0, 500) + '...');
    
    if (lastError) {
      console.error('❌ 마지막 오류:', lastError.message);
    }
    
    // 최후의 수단: 폴백 응답 생성
    console.warn('🔄 PPG 폴백 응답 생성 시도');
    const fallbackResult = this.createFallbackPPGResult(text);
    if (fallbackResult) {
      console.log('✅ PPG 폴백 응답 생성 성공');
      return fallbackResult;
    }
    
    throw new Error('PPG 분석 응답에서 JSON 형식을 찾을 수 없습니다.');
  }

  /**
   * PPG 응답 구조 유효성 검사
   */
  private static isValidPPGStructure(result: any): boolean {
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
   * 불완전한 PPG 응답 구조 보완
   */
  private static repairPPGStructure(result: any): PPGAnalysisResult {
    const repaired: PPGAnalysisResult = {
      score: typeof result.score === 'number' ? result.score : 65,
      status: typeof result.status === 'string' ? result.status : '보통',
      analysis: typeof result.analysis === 'string' ? result.analysis : '심혈관 분석을 수행했으나 상세 결과를 표시하는데 기술적 문제가 발생했습니다.',
      keyMetrics: result.keyMetrics && typeof result.keyMetrics === 'object' ? result.keyMetrics : {},
      recommendations: Array.isArray(result.recommendations) ? result.recommendations : ['전문가와 상담하시기 바랍니다.'],
      concerns: Array.isArray(result.concerns) ? result.concerns : []
    };

    console.log('🔧 PPG 응답 구조 보완 완료');
    return repaired;
  }

  /**
   * 폴백 PPG 응답 생성
   */
  private static createFallbackPPGResult(originalText: string): PPGAnalysisResult | null {
    try {
      // 원본 텍스트에서 점수나 상태 정보 추출 시도
      const scoreMatch = originalText.match(/(?:score|점수)[":\s]*(\d+)/i);
      const statusMatch = originalText.match(/(?:status|상태)[":\s]*["']?([^"',\n]+)["']?/i);
      
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 65;
      const status = statusMatch ? statusMatch[1].trim() : '보통';
      
      // 분석 내용 추출 시도
      let analysis = '심혈관 분석을 수행했으나 상세 결과를 표시하는데 기술적 문제가 발생했습니다.';
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
      console.error('❌ PPG 폴백 응답 생성 실패:', error);
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