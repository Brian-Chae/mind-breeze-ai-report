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

// 개인 정보 인터페이스
interface PersonalInfo {
  name: string;
  age: number;
  gender: 'male' | 'female';
  occupation: string;
}

// 측정 데이터 인터페이스
interface MeasurementData {
  eegMetrics: {
    focusIndex?: { value: number };
    relaxationIndex?: { value: number };
    stressIndex?: { value: number };
    hemisphericBalance?: { value: number };
    cognitiveLoad?: { value: number };
    totalPower?: { value: number };
  };
  ppgMetrics: {
    heartRate?: { value: number };
    spo2?: { value: number };
    rmssd?: { value: number };
    sdnn?: { value: number };
    lfHfRatio?: { value: number };
    lfPower?: { value: number };
    hfPower?: { value: number };
  };
  qualityMetrics?: {
    signalQuality: number;
    measurementDuration: number;
  };
}

// 상세 분석 결과 인터페이스
interface DetailedAnalysisResult {
  overallScore: number;
  overallInterpretation: string;
  
  eegAnalysis: {
    score: number;
    interpretation: string;
    keyFindings: string[];
    concerns: string[];
  };
  
  ppgAnalysis: {
    score: number;
    interpretation: string;
    keyFindings: string[];
    concerns: string[];
  };
  
  demographicAnalysis: {
    ageSpecific: string;
    genderSpecific: string;
    combinedInsights: string[];
  };
  
  occupationalAnalysis: {
    jobSpecificRisks: string[];
    workplaceRecommendations: string[];
    careerHealthTips: string[];
  };
  
  improvementPlan: {
    immediate: string[]; // 즉시 실행 가능
    shortTerm: string[]; // 1-4주
    longTerm: string[]; // 1-6개월
  };
}

export class BasicGeminiV1Engine implements IAIEngine {
  // 기본 정보
  readonly id = 'basic-gemini-v1';
  readonly name = '기본 Gemini 분석';
  readonly description = 'Google Gemini API를 사용한 맞춤형 건강 분석 엔진 - 연령, 성별, 직업 특성을 고려한 종합 분석';
  readonly version = '1.1.0';
  readonly provider = 'gemini';
  
  // 지원 기능
  readonly supportedDataTypes: MeasurementDataType = {
    eeg: true,
    ppg: true,
    acc: true
  };
  
  readonly costPerAnalysis = 2; // 2 크레딧 (더 상세한 분석으로 인해 증가)
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

      // 개인 정보 검증
      if (!data.personalInfo) {
        errors.push('개인 정보가 필요합니다.');
      } else {
        if (!data.personalInfo.age || data.personalInfo.age < 5 || data.personalInfo.age > 100) {
          warnings.push('나이 정보가 부정확할 수 있습니다.');
        }
        if (!data.personalInfo.gender) {
          warnings.push('성별 정보가 없어 일반적인 분석을 제공합니다.');
        }
        if (!data.personalInfo.occupation) {
          warnings.push('직업 정보가 없어 직업별 맞춤 분석이 제한됩니다.');
        }
      }

      // EEG 데이터 검증
      if (data.measurementData?.eegMetrics) {
        const eeg = data.measurementData.eegMetrics;
        if (eeg.focusIndex?.value >= 0) qualityScore += 15;
        if (eeg.relaxationIndex?.value >= 0) qualityScore += 15;
        if (eeg.stressIndex?.value >= 0) qualityScore += 10;
        if (eeg.hemisphericBalance?.value !== undefined) qualityScore += 5;
        if (eeg.cognitiveLoad?.value >= 0) qualityScore += 5;
      } else {
        warnings.push('EEG 데이터가 없어 뇌파 분석이 제한됩니다.');
      }

      // PPG 데이터 검증
      if (data.measurementData?.ppgMetrics) {
        const ppg = data.measurementData.ppgMetrics;
        if (ppg.heartRate?.value > 0) qualityScore += 15;
        if (ppg.spo2?.value > 0) qualityScore += 10;
        if (ppg.rmssd?.value >= 0) qualityScore += 10;
        if (ppg.sdnn?.value >= 0) qualityScore += 5;
        if (ppg.lfHfRatio?.value >= 0) qualityScore += 10;
      } else {
        warnings.push('PPG 데이터가 없어 심혈관 분석이 제한됩니다.');
      }

      // 품질 점수 검증
      if (data.measurementData?.qualityMetrics) {
        const quality = data.measurementData.qualityMetrics.signalQuality;
        if (quality < 0.3) {
          warnings.push('신호 품질이 낮습니다. 분석 결과의 정확도가 떨어질 수 있습니다.');
          qualityScore *= 0.7;
        } else if (quality > 0.8) {
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

      let analysisData: DetailedAnalysisResult;

      // API 키가 있으면 실제 AI 분석, 없으면 목업 데이터
      if (this.apiKey) {
        // AI 분석 요청 준비
        const analysisPrompt = this.generateAnalysisPrompt(data, options);
        const geminiResponse = await this.callGeminiAPI(analysisPrompt, options);
        
        // 결과 파싱
        analysisData = this.parseGeminiResponse(geminiResponse, data);
      } else {
        // 목업 데이터 생성
        analysisData = this.generateMockAnalysis(data);
      }
      
      const processingTime = Date.now() - startTime;

      return {
        engineId: this.id,
        engineVersion: this.version,
        timestamp: new Date().toISOString(),
        analysisId,
        
        // 분석 결과
        overallScore: analysisData.overallScore,
        stressLevel: this.calculateStressLevel(data.measurementData),
        focusLevel: this.calculateFocusLevel(data.measurementData),
        
        // 상세 분석
        insights: {
          summary: analysisData.overallInterpretation,
          detailedAnalysis: this.formatDetailedAnalysis(analysisData),
          recommendations: [
            ...analysisData.improvementPlan.immediate,
            ...analysisData.improvementPlan.shortTerm.slice(0, 2),
            ...analysisData.improvementPlan.longTerm.slice(0, 1)
          ],
          warnings: validation.warnings
        },
        
        // 생체 지표
        metrics: {
          eeg: data.measurementData?.eegMetrics ? {
            alpha: data.measurementData.eegMetrics.focusIndex?.value || 0,
            beta: data.measurementData.eegMetrics.relaxationIndex?.value || 0,
            gamma: data.measurementData.eegMetrics.stressIndex?.value || 0,
            theta: data.measurementData.eegMetrics.hemisphericBalance?.value || 0,
            delta: data.measurementData.eegMetrics.cognitiveLoad?.value || 0
          } : undefined,
          ppg: data.measurementData?.ppgMetrics ? {
            heartRate: data.measurementData.ppgMetrics.heartRate?.value || 70,
            hrv: data.measurementData.ppgMetrics.rmssd?.value || 30,
            stressIndex: data.measurementData.ppgMetrics.lfHfRatio?.value || 2.5
          } : undefined
        },
        
        // 메타 정보 및 상세 분석 데이터 추가
        processingTime,
        costUsed: this.costPerAnalysis,
        rawData: {
          detailedAnalysis: analysisData,
          qualityScore: validation.qualityScore
        }
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
   * Gemini API 분석 프롬프트 생성 (개선된 버전)
   */
  private generateAnalysisPrompt(data: any, options: AnalysisOptions): string {
    const { personalInfo, measurementData } = data;
    const language = options.outputLanguage || 'ko';
    
    return `
당신은 생체신호 분석 전문가이자 건강 관리 전문의입니다. 
다음 개인의 생체 데이터를 종합적으로 분석하여 맞춤형 건강 리포트를 작성해주세요.

## 개인 정보
- 이름: ${personalInfo.name}
- 나이: ${personalInfo.age}세
- 성별: ${personalInfo.gender === 'male' ? '남성' : '여성'}
- 직업: ${personalInfo.occupation}

## 측정 데이터

### EEG (뇌파) 지표
${measurementData.eegMetrics ? `
- 집중력 지수: ${measurementData.eegMetrics.focusIndex?.value || 'N/A'}
- 이완도 지수: ${measurementData.eegMetrics.relaxationIndex?.value || 'N/A'}
- 스트레스 지수: ${measurementData.eegMetrics.stressIndex?.value || 'N/A'}
- 좌우뇌 균형: ${measurementData.eegMetrics.hemisphericBalance?.value || 'N/A'}
- 인지 부하: ${measurementData.eegMetrics.cognitiveLoad?.value || 'N/A'}
- 총 뇌파 파워: ${measurementData.eegMetrics.totalPower?.value || 'N/A'}
` : '뇌파 데이터 없음'}

### PPG (심혈관) 지표
${measurementData.ppgMetrics ? `
- 심박수: ${measurementData.ppgMetrics.heartRate?.value || 'N/A'} BPM
- 산소포화도: ${measurementData.ppgMetrics.spo2?.value || 'N/A'}%
- RMSSD: ${measurementData.ppgMetrics.rmssd?.value || 'N/A'} ms
- SDNN: ${measurementData.ppgMetrics.sdnn?.value || 'N/A'} ms
- LF/HF 비율: ${measurementData.ppgMetrics.lfHfRatio?.value || 'N/A'}
` : '심혈관 데이터 없음'}

## 분석 요구사항

1. **종합 점수 및 해석** (0-100점)
   - 전반적인 건강 상태 평가
   - 주요 발견사항과 위험 요소

2. **뇌파 분석 결과**
   - 각 지표의 의학적 의미 해석
   - 정신건강 상태 평가
   - 인지 기능 평가

3. **맥파 분석 결과**
   - 심혈관 건강 상태 평가
   - 자율신경계 균형 분석
   - 신체적 건강 상태

4. **연령별/성별별 특성 맞춤형 분석**
   - ${personalInfo.age}세 ${personalInfo.gender === 'male' ? '남성' : '여성'}의 일반적 특성
   - 해당 인구집단과 비교한 현재 상태
   - 연령/성별 특화 권장사항

5. **직업적 특성 맞춤형 분석**
   - ${personalInfo.occupation} 직업의 건강 위험 요소
   - 직업 환경에서 실행 가능한 건강 관리법
   - 직업 특화 예방 조치

6. **향후 개선 방향**
   - 즉시 실행 가능한 방안 (오늘부터)
   - 단기 목표 (1-4주)
   - 중장기 목표 (1-6개월)

## 출력 형식
반드시 JSON 형태로만 응답하세요:

{
  "overallScore": 숫자,
  "overallInterpretation": "종합 해석",
  "eegAnalysis": {
    "score": 숫자,
    "interpretation": "뇌파 분석 해석",
    "keyFindings": ["주요 발견사항1", "주요 발견사항2"],
    "concerns": ["우려사항1", "우려사항2"]
  },
  "ppgAnalysis": {
    "score": 숫자,
    "interpretation": "맥파 분석 해석",
    "keyFindings": ["주요 발견사항1", "주요 발견사항2"],
    "concerns": ["우려사항1", "우려사항2"]
  },
  "demographicAnalysis": {
    "ageSpecific": "연령별 특성 분석",
    "genderSpecific": "성별 특성 분석",
    "combinedInsights": ["복합 인사이트1", "복합 인사이트2"]
  },
  "occupationalAnalysis": {
    "jobSpecificRisks": ["직업 위험요소1", "직업 위험요소2"],
    "workplaceRecommendations": ["직장 내 권장사항1", "직장 내 권장사항2"],
    "careerHealthTips": ["직업별 건강팁1", "직업별 건강팁2"]
  },
  "improvementPlan": {
    "immediate": ["즉시 실행 방안1", "즉시 실행 방안2"],
    "shortTerm": ["단기 목표1", "단기 목표2"],
    "longTerm": ["중장기 목표1", "중장기 목표2"]
  }
}
`;
  }

  /**
   * 목업 분석 데이터 생성
   */
  private generateMockAnalysis(data: any): DetailedAnalysisResult {
    const { personalInfo, measurementData } = data;
    
    // 직업별 특화 분석
    const getOccupationInsights = (occupation: string) => {
      const occupationData = {
        'developer': {
          risks: ['장시간 앉아서 작업으로 인한 혈액순환 저하', '화면 집중으로 인한 눈의 피로', '키보드/마우스 사용으로 인한 손목 부담'],
          workplace: ['1시간마다 5분씩 스트레칭', '20-20-20 규칙 적용 (20분마다 20초간 20피트 거리 응시)', '모니터 높이 조절로 목 부담 감소'],
          tips: ['점심시간 산책으로 혈액순환 개선', '업무 외 시간 디지털 디톡스', '개발자 커뮤니티 활동으로 스트레스 해소']
        },
        'office_worker': {
          risks: ['장시간 사무실 근무로 인한 운동 부족', '업무 스트레스로 인한 정신적 피로', '에어컨 환경으로 인한 건조함'],
          workplace: ['점심시간 활용한 가벼운 운동', '업무 중 정기적인 수분 섭취', '동료와의 건전한 소통으로 스트레스 해소'],
          tips: ['출퇴근 시간 활용한 걷기 운동', '사무실 내 식물 키우기', '취미 활동으로 워라밸 실현']
        },
        'student': {
          risks: ['학업 스트레스로 인한 정신적 부담', '장시간 공부로 인한 자세 문제', '불규칙한 생활 패턴'],
          workplace: ['공부 시간 50분 후 10분 휴식', '올바른 학습 자세 유지', '정기적인 체육 활동 참여'],
          tips: ['규칙적인 수면 패턴 유지', '친구들과의 건전한 관계 유지', '스트레스 해소를 위한 취미 활동']
        }
      };
      
      return occupationData[occupation as keyof typeof occupationData] || {
        risks: ['직업 특성상 발생할 수 있는 스트레스', '업무 환경으로 인한 건강 위험'],
        workplace: ['규칙적인 휴식 시간 확보', '업무 스트레스 관리'],
        tips: ['건강한 생활 습관 유지', '정기적인 건강 검진']
      };
    };

    const occupationInsights = getOccupationInsights(personalInfo.occupation);
    
    // 개인 정보에 따른 동적 점수 생성
    const baseScore = 75;
    const ageBonus = personalInfo.age >= 20 && personalInfo.age <= 35 ? 5 : 0;
    const genderBonus = Math.random() > 0.5 ? 3 : 0;
    const occupationBonus = ['student', 'teacher', 'healthcare'].includes(personalInfo.occupation) ? 2 : 0;
    const overallScore = Math.min(95, baseScore + ageBonus + genderBonus + occupationBonus + Math.floor(Math.random() * 8));

    return {
      overallScore,
      overallInterpretation: `${personalInfo.name}님(${personalInfo.age}세, ${personalInfo.gender === 'male' ? '남성' : '여성'})의 전반적인 건강 상태는 ${overallScore >= 85 ? '매우 우수한' : overallScore >= 75 ? '양호한' : overallScore >= 65 ? '보통' : '주의가 필요한'} 편입니다. 측정된 생체신호 분석 결과, 대부분의 지표가 연령대 평균 범위에 있으며, 특히 심혈관 건강이 ${overallScore >= 80 ? '우수한' : '양호한'} 상태를 보이고 있습니다. ${personalInfo.occupation} 직업의 특성상 몇 가지 주의해야 할 건강 관리 포인트가 있어 맞춤형 관리 방안을 제시드립니다.`,
      
      eegAnalysis: {
        score: Math.max(65, Math.min(90, overallScore - 3 + Math.floor(Math.random() * 10))),
        interpretation: `뇌파 분석 결과 집중력과 이완도가 ${overallScore >= 80 ? '우수한' : '연령대 평균'} 수준을 유지하고 있습니다. 집중력 지수 ${measurementData.eegMetrics?.focusIndex?.value?.toFixed(2) || '2.1'}는 ${measurementData.eegMetrics?.focusIndex?.value >= 2.0 ? '우수한' : '적절한'} 수준이며, 이완도 ${measurementData.eegMetrics?.relaxationIndex?.value?.toFixed(3) || '0.20'}도 양호합니다. 좌우뇌 균형 ${measurementData.eegMetrics?.hemisphericBalance?.value?.toFixed(3) || '0.02'}는 균형적인 상태를 보이고 있어 인지 기능이 원활하게 작동하고 있습니다.`,
        keyFindings: [
          `집중력 지수 ${measurementData.eegMetrics?.focusIndex?.value?.toFixed(2) || '2.1'}가 ${measurementData.eegMetrics?.focusIndex?.value >= 2.5 ? '우수한' : '연령대 평균'} 범위에 있음`,
          '좌우뇌 활성도 균형이 양호함',
          '전반적인 뇌파 활성도가 안정적임',
          `인지 부하 지수 ${measurementData.eegMetrics?.cognitiveLoad?.value?.toFixed(2) || '1.8'}로 ${measurementData.eegMetrics?.cognitiveLoad?.value <= 2.0 ? '정상' : '약간 높음'} 수준`
        ],
        concerns: overallScore < 75 ? [
          '인지 부하가 약간 높아 정신적 피로 관리 필요',
          '스트레스 지수 모니터링 필요',
          '집중력 향상을 위한 뇌 훈련 권장'
        ] : [
          '현재 상태 유지를 위한 지속적 관리 필요'
        ]
      },
      
      ppgAnalysis: {
        score: Math.max(70, Math.min(95, overallScore + 2 + Math.floor(Math.random() * 8))),
        interpretation: `심혈관 건강 지표가 전반적으로 ${overallScore >= 85 ? '우수한' : '양호한'} 상태입니다. 심박수 ${measurementData.ppgMetrics?.heartRate?.value || 72}BPM은 ${(measurementData.ppgMetrics?.heartRate?.value || 72) >= 60 && (measurementData.ppgMetrics?.heartRate?.value || 72) <= 100 ? '정상' : '주의'} 범위에 있으며, 심박변이도 지표인 RMSSD ${measurementData.ppgMetrics?.rmssd?.value || 30}ms와 SDNN ${measurementData.ppgMetrics?.sdnn?.value || 50}ms는 자율신경계의 균형이 ${(measurementData.ppgMetrics?.rmssd?.value || 30) >= 25 ? '잘' : '적절히'} 유지되고 있음을 보여줍니다. 산소포화도 ${measurementData.ppgMetrics?.spo2?.value || 98}%도 ${(measurementData.ppgMetrics?.spo2?.value || 98) >= 95 ? '우수한' : '정상'} 수준입니다.`,
        keyFindings: [
          `심박수 ${measurementData.ppgMetrics?.heartRate?.value || 72}BPM이 정상 범위 내에서 안정적임`,
          `RMSSD ${measurementData.ppgMetrics?.rmssd?.value || 30}ms로 심박변이도가 ${(measurementData.ppgMetrics?.rmssd?.value || 30) >= 30 ? '우수함' : '양호함'}`,
          `LF/HF 비율 ${measurementData.ppgMetrics?.lfHfRatio?.value?.toFixed(2) || '2.5'}로 자율신경계 균형 ${(measurementData.ppgMetrics?.lfHfRatio?.value || 2.5) <= 3.0 ? '양호' : '주의'}`,
          '산소포화도가 우수한 수준 유지',
          personalInfo.age <= 30 ? '젊은 연령대의 우수한 심혈관 기능' : '연령을 고려한 양호한 심혈관 상태'
        ],
        concerns: overallScore < 80 ? [
          '정기적인 심혈관 건강 모니터링 권장',
          '유산소 운동을 통한 심혈관 기능 개선 필요',
          '스트레스 관리로 자율신경계 균형 유지'
        ] : [
          '현재의 우수한 상태 유지를 위한 정기 모니터링 권장'
        ]
      },
      
      demographicAnalysis: {
        ageSpecific: `${personalInfo.age}세 연령대는 신체적으로 가장 활발한 시기이며, 동시에 사회적 책임과 스트레스가 증가하는 시기입니다. 이 연령대의 평균적인 건강 지표와 비교할 때 전반적으로 양호한 상태를 보이고 있습니다.`,
        genderSpecific: `${personalInfo.gender === 'male' ? '남성의 경우 일반적으로 심혈관 질환 위험이 높으나, 현재 심혈관 지표는 우수한 상태입니다. 지속적인 관리를 통해 건강한 상태를 유지할 수 있습니다.' : '여성의 경우 호르몬 변화와 스트레스에 민감하게 반응할 수 있으나, 현재 스트레스 관리가 잘 되고 있는 상태입니다.'}`,
        combinedInsights: [
          `${personalInfo.age}세 ${personalInfo.gender === 'male' ? '남성' : '여성'}의 건강 관리 골든타임을 잘 활용하고 있음`,
          '예방 중심의 건강 관리로 장기적 건강 유지 가능'
        ]
      },
      
      occupationalAnalysis: {
        jobSpecificRisks: occupationInsights.risks,
        workplaceRecommendations: occupationInsights.workplace,
        careerHealthTips: occupationInsights.tips
      },
      
      improvementPlan: {
        immediate: [
          '매시간 5분씩 심호흡과 간단한 스트레칭',
          `충분한 수분 섭취 (하루 ${personalInfo.age <= 30 ? '2.5L' : '2L'} 이상)`,
          '정기적인 자세 점검 및 교정',
          ...(overallScore < 75 ? ['명상 앱 활용한 10분 마음챙김 연습'] : [])
        ],
        shortTerm: [
          `주 ${personalInfo.age <= 40 ? '4회' : '3회'} 이상 30분 유산소 운동 실시`,
          `수면 패턴 개선 (${personalInfo.age <= 30 ? '7-9' : '7-8'}시간 숙면)`,
          '스트레스 관리 기법 학습 및 적용',
          '정기적인 건강 모니터링 습관화',
          ...(personalInfo.occupation === 'developer' ? ['블루라이트 차단 안경 착용', '인체공학적 키보드/마우스 사용'] : []),
          ...(personalInfo.gender === 'female' ? ['호르몬 균형을 위한 규칙적인 생활패턴'] : []),
          ...(overallScore < 80 ? ['주말 자연 환경에서의 활동 증가'] : [])
        ],
        longTerm: [
          `${personalInfo.age >= 40 ? '연 2회' : '연 1회'} 종합 건강검진을 통한 전문적 평가`,
          '개인 맞춤형 운동 프로그램 개발',
          `${personalInfo.occupation} 직업 특성을 고려한 장기 건강 관리 계획 수립`,
          '정신건강 관리를 위한 전문가 상담 체계 구축',
          ...(personalInfo.age >= 35 ? ['노화 방지를 위한 항산화 영양소 섭취'] : []),
          ...(overallScore >= 85 ? ['현재 우수한 상태 유지를 위한 라이프스타일 최적화'] : ['건강 지표 개선을 위한 단계적 목표 설정'])
        ]
      }
    };
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
        maxOutputTokens: 4096, // 더 상세한 분석을 위해 증가
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
  private parseGeminiResponse(response: any, originalData: any): DetailedAnalysisResult {
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
        const parsedResult = JSON.parse(jsonMatch[0]);
        
        // 파싱된 결과 검증 및 기본값 설정
        return {
          overallScore: parsedResult.overallScore || 70,
          overallInterpretation: parsedResult.overallInterpretation || '분석 중 오류가 발생했습니다.',
          eegAnalysis: parsedResult.eegAnalysis || {
            score: 70,
            interpretation: 'EEG 분석 데이터가 부족합니다.',
            keyFindings: ['데이터 부족'],
            concerns: ['분석 제한']
          },
          ppgAnalysis: parsedResult.ppgAnalysis || {
            score: 70,
            interpretation: 'PPG 분석 데이터가 부족합니다.',
            keyFindings: ['데이터 부족'],
            concerns: ['분석 제한']
          },
          demographicAnalysis: parsedResult.demographicAnalysis || {
            ageSpecific: '연령별 분석 데이터가 부족합니다.',
            genderSpecific: '성별 분석 데이터가 부족합니다.',
            combinedInsights: ['분석 제한']
          },
          occupationalAnalysis: parsedResult.occupationalAnalysis || {
            jobSpecificRisks: ['직업별 분석 제한'],
            workplaceRecommendations: ['일반적인 권장사항 적용'],
            careerHealthTips: ['기본 건강 관리 팁']
          },
          improvementPlan: parsedResult.improvementPlan || {
            immediate: ['기본 건강 관리'],
            shortTerm: ['정기적인 운동'],
            longTerm: ['전문가 상담']
          }
        };
      }

      // JSON 파싱 실패 시 목업 데이터 반환
      return this.generateMockAnalysis(originalData);

    } catch (error) {
      console.error('Gemini 응답 파싱 오류:', error);
      return this.generateMockAnalysis(originalData);
    }
  }

  /**
   * 유틸리티 메서드들
   */
  private calculateStressLevel(measurementData: MeasurementData): number {
    const stressIndex = measurementData.eegMetrics?.stressIndex?.value || 3.0;
    const lfHfRatio = measurementData.ppgMetrics?.lfHfRatio?.value || 2.5;
    
    // 스트레스 수준 계산 (0-100, 높을수록 스트레스 많음)
    const normalizedStress = Math.min(100, Math.max(0, (stressIndex - 2.0) * 25));
    const normalizedHF = Math.min(100, Math.max(0, (lfHfRatio - 1.0) * 10));
    
    return Math.round((normalizedStress + normalizedHF) / 2);
  }

  private calculateFocusLevel(measurementData: MeasurementData): number {
    const focusIndex = measurementData.eegMetrics?.focusIndex?.value || 2.0;
    const cognitiveLoad = measurementData.eegMetrics?.cognitiveLoad?.value || 0.5;
    
    // 집중력 수준 계산 (0-100, 높을수록 집중력 좋음)
    const normalizedFocus = Math.min(100, Math.max(0, focusIndex * 40));
    const adjustedFocus = cognitiveLoad > 0.8 ? normalizedFocus * 0.8 : normalizedFocus;
    
    return Math.round(adjustedFocus);
  }

  private formatDetailedAnalysis(analysisData: DetailedAnalysisResult): string {
    return `
## 뇌파 분석 결과
${analysisData.eegAnalysis.interpretation}

**주요 발견사항:**
${analysisData.eegAnalysis.keyFindings.map(finding => `• ${finding}`).join('\n')}

## 맥파 분석 결과  
${analysisData.ppgAnalysis.interpretation}

**주요 발견사항:**
${analysisData.ppgAnalysis.keyFindings.map(finding => `• ${finding}`).join('\n')}

## 연령/성별 특성 분석
**연령별 특성:** ${analysisData.demographicAnalysis.ageSpecific}

**성별 특성:** ${analysisData.demographicAnalysis.genderSpecific}

## 직업적 특성 분석
**주요 위험 요소:**
${analysisData.occupationalAnalysis.jobSpecificRisks.map(risk => `• ${risk}`).join('\n')}

**직장 내 권장사항:**
${analysisData.occupationalAnalysis.workplaceRecommendations.map(rec => `• ${rec}`).join('\n')}
    `.trim();
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
      'age_gender_analysis',
      'occupation_analysis'
    ];
  }

  /**
   * 권장사항 카테고리 목록
   */
  getRecommendationCategories(): string[] {
    return [
      'immediate_actions',
      'short_term_goals',
      'long_term_strategy',
      'occupation_specific',
      'age_gender_specific',
      'lifestyle_improvement'
    ];
  }

  /**
   * 샘플 프롬프트 목록
   */
  getSamplePrompts(): string[] {
    return [
      '연령대별 맞춤형 건강 관리 방안',
      '직업 특성을 고려한 스트레스 관리',
      '성별 특성을 반영한 건강 개선 계획',
      '종합적인 생활 습관 개선 로드맵'
    ];
  }
}

export default BasicGeminiV1Engine; 