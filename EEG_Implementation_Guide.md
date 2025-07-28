# EEG 고급 분석 엔진 구현 가이드

## 1. 구현 아키텍처

### 1.1 새로운 엔진 클래스 구조
```typescript
EEGAdvancedGeminiEngine extends IAIEngine
├── 개인정보 기반 정상범위 계산기
├── EEG 지표 의학적 해석기  
├── 과학적 근거 데이터베이스
├── 맞춤형 프롬프트 생성기
└── 구조화된 응답 파서
```

### 1.2 주요 컴포넌트

#### A. 개인화 분석 모듈
```typescript
interface PersonalizedAnalysisContext {
  normalRanges: AgeGenderNormalRanges;
  occupationalFactors: OccupationalEEGProfile;
  clinicalThresholds: ClinicalSignificanceThresholds;
}

class PersonalizationEngine {
  calculateNormalRanges(age: number, gender: string): NormalRanges;
  getOccupationalProfile(occupation: string): OccupationalProfile;
  assessClinicalSignificance(deviation: number): ClinicalLevel;
}
```

#### B. 의학적 해석 모듈
```typescript
interface MedicalInterpretation {
  bandPowerAnalysis: BandPowerInterpretation;
  eegIndicesAnalysis: EEGIndicesInterpretation;
  cognitiveStateAssessment: CognitiveStateAnalysis;
}

class MedicalInterpreter {
  interpretBandPowers(data: BandPowerData, context: PersonalizedContext): BandPowerInterpretation;
  analyzeEEGIndices(indices: EEGIndices, context: PersonalizedContext): EEGIndicesInterpretation;
  assessCognitiveState(allData: EEGData, context: PersonalizedContext): CognitiveStateAnalysis;
}
```

#### C. 과학적 근거 데이터베이스
```typescript
interface ScientificReference {
  referenceType: 'research' | 'clinical' | 'guideline' | 'meta-analysis';
  title: string;
  summary: string;
  relevance: string;
  confidence: number;
}

class ScientificEvidenceDB {
  findRelevantReferences(finding: string, context: PersonalizedContext): ScientificReference[];
  validateInterpretation(interpretation: string): ValidationResult;
  getClinicalGuidelines(symptom: string): ClinicalGuideline[];
}
```

## 2. 데이터 구조 정의

### 2.1 입력 데이터 인터페이스
```typescript
interface EEGAnalysisInput {
  personalInfo: {
    age: number;
    gender: 'male' | 'female';
    occupation: string;
  };
  
  eegTimeSeriesStats: {
    bandPowers: {
      delta: StatisticalData;    // mean, std, min, max
      theta: StatisticalData;
      alpha: StatisticalData;
      beta: StatisticalData;
      gamma: StatisticalData;
    };
    
    eegIndices: {
      focusIndex: number;
      relaxationIndex: number;
      stressIndex: number;
      hemisphericBalance: number;
      cognitiveLoad: number;
      emotionalStability: number;
    };
    
    qualityMetrics: {
      signalQuality: number;      // 0-1
      measurementDuration: number; // seconds
      dataCompleteness: number;   // 0-1
    };
  };
}

interface StatisticalData {
  mean: number;
  std: number;
  min: number;
  max: number;
}
```

### 2.2 출력 데이터 인터페이스
```typescript
interface EEGAdvancedAnalysisResult {
  analysisResults: CoreAnalysisResult[];    // 3개의 핵심 의견
  detailedDataAnalysis: DetailedDataAnalysis;
  metadata: AnalysisMetadata;
}

interface CoreAnalysisResult {
  priority: 1 | 2 | 3;
  coreOpinion: {
    title: string;
    summary: string;
    clinicalSignificance: 'normal' | 'mild' | 'moderate' | 'severe';
    personalizedInterpretation: string;
  };
  dataEvidence: {
    primaryMetrics: MetricEvidence[];
    supportingMetrics: MetricEvidence[];
    statisticalAnalysis: {
      correlationAnalysis: string;
      demographicComparison: string;
    };
  };
  validityOpinion: {
    scientificBasis: string;
    clinicalReferences: ScientificReference[];
    limitationsAndCaveats: string;
  };
}
```

## 3. 구현 단계별 가이드

### 3.1 Phase 1: 기본 엔진 구조 구현

#### Step 1: 엔진 클래스 생성
```typescript
// src/domains/ai-report/ai-engines/EEGAdvancedGeminiEngine.ts

export class EEGAdvancedGeminiEngine implements IAIEngine {
  readonly id = 'eeg-advanced-gemini-v1';
  readonly name = 'EEG 전문 분석 엔진';
  readonly description = 'EEG 데이터 전문 해석을 위한 고급 Gemini 엔진';
  readonly version = '1.0.0';
  readonly provider = 'gemini';
  
  readonly supportedDataTypes: MeasurementDataType = {
    eeg: true,
    ppg: false,  // EEG 전용
    acc: false
  };
  
  readonly costPerAnalysis = 5; // 고급 분석으로 더 높은 비용
  readonly recommendedRenderers = ['eeg-advanced-web'];
  
  private readonly personalizationEngine: PersonalizationEngine;
  private readonly medicalInterpreter: MedicalInterpreter;
  private readonly evidenceDB: ScientificEvidenceDB;
  
  constructor(apiKey?: string) {
    // 초기화 로직
    this.personalizationEngine = new PersonalizationEngine();
    this.medicalInterpreter = new MedicalInterpreter();
    this.evidenceDB = new ScientificEvidenceDB();
  }
}
```

#### Step 2: 유효성 검증 로직
```typescript
async validate(data: EEGAnalysisInput): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let qualityScore = 0;

  // 개인정보 필수 체크
  if (!data.personalInfo?.age || data.personalInfo.age < 18 || data.personalInfo.age > 80) {
    errors.push('유효한 나이 정보가 필요합니다 (18-80세)');
  }
  
  if (!data.personalInfo?.gender || !['male', 'female'].includes(data.personalInfo.gender)) {
    errors.push('성별 정보가 필요합니다');
  }
  
  if (!data.personalInfo?.occupation) {
    warnings.push('직업 정보가 없어 일반적인 분석을 제공합니다');
  }

  // EEG 데이터 품질 체크
  if (!data.eegTimeSeriesStats?.bandPowers) {
    errors.push('Band Power 데이터가 필요합니다');
  } else {
    // 각 밴드의 통계 데이터 유효성 검증
    const bands = ['delta', 'theta', 'alpha', 'beta', 'gamma'];
    for (const band of bands) {
      const bandData = data.eegTimeSeriesStats.bandPowers[band];
      if (!bandData || typeof bandData.mean !== 'number') {
        errors.push(`${band} 밴드 데이터가 올바르지 않습니다`);
      } else {
        qualityScore += 10; // 각 밴드당 10점
      }
    }
  }

  // EEG 지수 검증
  if (!data.eegTimeSeriesStats?.eegIndices) {
    warnings.push('EEG 지수 데이터가 없어 해석이 제한됩니다');
  } else {
    const indices = ['focusIndex', 'relaxationIndex', 'stressIndex', 
                    'hemisphericBalance', 'cognitiveLoad', 'emotionalStability'];
    for (const index of indices) {
      if (typeof data.eegTimeSeriesStats.eegIndices[index] === 'number') {
        qualityScore += 5; // 각 지수당 5점
      }
    }
  }

  // 신호 품질 평가
  const signalQuality = data.eegTimeSeriesStats?.qualityMetrics?.signalQuality;
  if (signalQuality && signalQuality < 0.5) {
    warnings.push('신호 품질이 낮습니다. 분석 결과의 신뢰도가 떨어질 수 있습니다');
    qualityScore *= 0.8;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    qualityScore: Math.min(100, qualityScore)
  };
}
```

### 3.2 Phase 2: 개인화된 분석 컨텍스트 구현

#### Step 3: 정상 범위 계산기
```typescript
class PersonalizationEngine {
  calculateNormalRanges(age: number, gender: string): NormalRanges {
    const baseRanges = this.getBaseNormalRanges();
    
    // 연령별 조정
    const ageMultipliers = this.getAgeMultipliers(age);
    
    // 성별별 조정  
    const genderMultipliers = this.getGenderMultipliers(gender);
    
    return {
      delta: this.adjustRange(baseRanges.delta, ageMultipliers.delta, genderMultipliers.delta),
      theta: this.adjustRange(baseRanges.theta, ageMultipliers.theta, genderMultipliers.theta),
      alpha: this.adjustRange(baseRanges.alpha, ageMultipliers.alpha, genderMultipliers.alpha),
      beta: this.adjustRange(baseRanges.beta, ageMultipliers.beta, genderMultipliers.beta),
      gamma: this.adjustRange(baseRanges.gamma, ageMultipliers.gamma, genderMultipliers.gamma),
      
      focusIndex: this.adjustIndexRange(baseRanges.focusIndex, age, gender),
      relaxationIndex: this.adjustIndexRange(baseRanges.relaxationIndex, age, gender),
      stressIndex: this.adjustIndexRange(baseRanges.stressIndex, age, gender),
      // ... 기타 지수들
    };
  }
  
  private getAgeMultipliers(age: number) {
    // 연령대별 뇌파 특성 반영
    if (age >= 20 && age < 30) {
      return { delta: 1.0, theta: 1.0, alpha: 1.2, beta: 1.1, gamma: 1.0 };
    } else if (age >= 30 && age < 40) {
      return { delta: 1.1, theta: 1.0, alpha: 1.0, beta: 1.0, gamma: 0.95 };
    } else if (age >= 40 && age < 50) {
      return { delta: 1.2, theta: 1.1, alpha: 0.9, beta: 0.95, gamma: 0.9 };
    } else {
      return { delta: 1.3, theta: 1.2, alpha: 0.8, beta: 0.9, gamma: 0.85 };
    }
  }
  
  getOccupationalProfile(occupation: string): OccupationalProfile {
    const profiles = {
      'developer': {
        expectedPatterns: {
          highBeta: true,
          leftBrainDominance: true,
          sustainedAttention: true,
          stressRisk: 'moderate'
        },
        riskFactors: ['mental_fatigue', 'attention_deficit', 'stress_accumulation'],
        recommendations: [
          '규칙적인 휴식으로 뇌피로 방지',
          '우뇌 활성화 활동 (음악, 미술) 권장',
          '명상이나 이완 훈련으로 스트레스 관리'
        ]
      },
      'healthcare': {
        expectedPatterns: {
          highStress: true,
          alertness: true,
          emotionalStability: 'variable'
        },
        riskFactors: ['burnout', 'emotional_exhaustion', 'irregular_sleep'],
        recommendations: [
          '충분한 수면과 규칙적인 생활패턴',
          '감정적 스트레스 관리 프로그램',
          '동료와의 지지적 관계 유지'
        ]
      },
      // ... 기타 직업군
    };
    
    return profiles[occupation] || profiles['default'];
  }
}
```

### 3.3 Phase 3: 프롬프트 생성 및 응답 파싱

#### Step 4: 고급 프롬프트 생성기
```typescript
private generateEEGAnalysisPrompt(data: EEGAnalysisInput): string {
  const { personalInfo, eegTimeSeriesStats } = data;
  const normalRanges = this.personalizationEngine.calculateNormalRanges(
    personalInfo.age, 
    personalInfo.gender
  );
  const occupationalProfile = this.personalizationEngine.getOccupationalProfile(
    personalInfo.occupation
  );

  return `
# EEG 전문 분석 요청

당신은 세계적 수준의 EEG 분석 전문가이자 신경과 전문의입니다. 
다음 개인의 뇌파 데이터를 의료급 수준으로 분석하여 종합적인 해석을 제공해주세요.

## 개인 정보
- 나이: ${personalInfo.age}세
- 성별: ${personalInfo.gender === 'male' ? '남성' : '여성'}  
- 직업: ${personalInfo.occupation}

## 개인별 정상 범위 (${personalInfo.age}세 ${personalInfo.gender === 'male' ? '남성' : '여성'} 기준)
- Delta Power: ${normalRanges.delta.min}-${normalRanges.delta.max} μV²
- Theta Power: ${normalRanges.theta.min}-${normalRanges.theta.max} μV²
- Alpha Power: ${normalRanges.alpha.min}-${normalRanges.alpha.max} μV²
- Beta Power: ${normalRanges.beta.min}-${normalRanges.beta.max} μV²
- Gamma Power: ${normalRanges.gamma.min}-${normalRanges.gamma.max} μV²

## EEG 측정 데이터 통계
### Band Power Analysis (μV²)
- Delta Power (0.5-4Hz): 평균 ${eegTimeSeriesStats.bandPowers.delta.mean}, 표준편차 ${eegTimeSeriesStats.bandPowers.delta.std}, 최소 ${eegTimeSeriesStats.bandPowers.delta.min}, 최대 ${eegTimeSeriesStats.bandPowers.delta.max}
- Theta Power (4-8Hz): 평균 ${eegTimeSeriesStats.bandPowers.theta.mean}, 표준편차 ${eegTimeSeriesStats.bandPowers.theta.std}, 최소 ${eegTimeSeriesStats.bandPowers.theta.min}, 최대 ${eegTimeSeriesStats.bandPowers.theta.max}
- Alpha Power (8-13Hz): 평균 ${eegTimeSeriesStats.bandPowers.alpha.mean}, 표준편차 ${eegTimeSeriesStats.bandPowers.alpha.std}, 최소 ${eegTimeSeriesStats.bandPowers.alpha.min}, 최대 ${eegTimeSeriesStats.bandPowers.alpha.max}
- Beta Power (13-30Hz): 평균 ${eegTimeSeriesStats.bandPowers.beta.mean}, 표준편차 ${eegTimeSeriesStats.bandPowers.beta.std}, 최소 ${eegTimeSeriesStats.bandPowers.beta.min}, 최대 ${eegTimeSeriesStats.bandPowers.beta.max}
- Gamma Power (30-100Hz): 평균 ${eegTimeSeriesStats.bandPowers.gamma.mean}, 표준편차 ${eegTimeSeriesStats.bandPowers.gamma.std}, 최소 ${eegTimeSeriesStats.bandPowers.gamma.min}, 최대 ${eegTimeSeriesStats.bandPowers.gamma.max}

### EEG 지수 분석
- Focus Index: ${eegTimeSeriesStats.eegIndices.focusIndex} (집중력 지수)
- Relaxation Index: ${eegTimeSeriesStats.eegIndices.relaxationIndex} (이완도 지수)
- Stress Index: ${eegTimeSeriesStats.eegIndices.stressIndex} (스트레스 지수)
- Hemispheric Balance: ${eegTimeSeriesStats.eegIndices.hemisphericBalance} (좌우뇌 균형)
- Cognitive Load: ${eegTimeSeriesStats.eegIndices.cognitiveLoad} (인지 부하)
- Emotional Stability: ${eegTimeSeriesStats.eegIndices.emotionalStability} (정서 안정성)

## ${personalInfo.occupation} 직업의 EEG 특성
예상 패턴: ${JSON.stringify(occupationalProfile.expectedPatterns)}
위험 요소: ${occupationalProfile.riskFactors.join(', ')}

${this.getDetailedAnalysisRequirements()}

반드시 다음 JSON 형식으로 응답해주세요:
${this.getResponseJSONSchema()}
`;
}

private getDetailedAnalysisRequirements(): string {
  return `
## 분석 요구사항

### 1. 3대 핵심 의견 도출 (우선순위 순)
각 의견에 대해 다음을 포함:

**우선순위별 분석:**
1. 가장 임상적으로 중요한 소견
2. 두 번째로 중요한 발견사항  
3. 추가적으로 고려할 소견

각 우선순위별로:
- 핵심 의견: 명확하고 구체적인 소견
- 데이터 근거: 실제 측정값과 정상범위 비교, 통계적 분석
- 타당성: 과학적 근거, 관련 연구, 해석 한계점

### 2. 상세 데이터 분석
- Band Power별 의학적 해석
- EEG 지수별 상태 평가 및 개선방안
- 전반적 인지상태 종합 평가

모든 해석은 제공된 개인별 정상범위를 기준으로 하고,
${personalInfo.age}세 ${personalInfo.gender === 'male' ? '남성' : '여성'} ${personalInfo.occupation}의 특성을 반영해주세요.
`;
}
```

#### Step 5: 응답 파싱 및 검증
```typescript
private parseEEGAnalysisResponse(response: string, inputData: EEGAnalysisInput): EEGAdvancedAnalysisResult {
  try {
    // JSON 추출 및 파싱
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                     response.match(/{\s*"analysisResults"[\s\S]*}/);
    
    if (!jsonMatch) {
      throw new Error('JSON 응답을 찾을 수 없습니다');
    }

    const parsedResult = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    
    // 응답 구조 검증
    this.validateResponseStructure(parsedResult);
    
    // 데이터 일관성 검증
    this.validateDataConsistency(parsedResult, inputData);
    
    // 메타데이터 추가
    parsedResult.metadata = {
      analysisTimestamp: new Date().toISOString(),
      personalInfo: inputData.personalInfo,
      dataQuality: inputData.eegTimeSeriesStats.qualityMetrics,
      analysisEngine: {
        engineId: this.id,
        version: this.version,
        processingTime: Date.now() - this.analysisStartTime
      }
    };

    return parsedResult;
    
  } catch (error) {
    console.error('EEG 분석 응답 파싱 오류:', error);
    return this.generateFallbackResponse(inputData, error.message);
  }
}

private validateResponseStructure(response: any): void {
  const requiredFields = [
    'analysisResults',
    'detailedDataAnalysis'
  ];
  
  for (const field of requiredFields) {
    if (!response[field]) {
      throw new Error(`필수 필드 누락: ${field}`);
    }
  }
  
  // analysisResults 배열 검증
  if (!Array.isArray(response.analysisResults) || response.analysisResults.length !== 3) {
    throw new Error('analysisResults는 3개의 항목을 가진 배열이어야 합니다');
  }
  
  // 각 분석 결과의 구조 검증
  response.analysisResults.forEach((result, index) => {
    if (!result.priority || !result.coreOpinion || !result.dataEvidence || !result.validityOpinion) {
      throw new Error(`분석 결과 ${index + 1}의 구조가 올바르지 않습니다`);
    }
  });
}

private validateDataConsistency(response: any, inputData: EEGAnalysisInput): void {
  // 응답에서 언급된 수치값들이 입력 데이터와 일치하는지 검증
  const inputValues = this.extractInputValues(inputData);
  
  response.analysisResults.forEach(result => {
    result.dataEvidence.primaryMetrics.forEach(metric => {
      const inputValue = inputValues[metric.metricName];
      if (inputValue !== undefined && Math.abs(metric.observedValue - inputValue) > 0.01) {
        console.warn(`데이터 불일치: ${metric.metricName} - 입력: ${inputValue}, 응답: ${metric.observedValue}`);
      }
    });
  });
}
```

## 4. 통합 및 테스트 가이드

### 4.1 엔진 등록
```typescript
// src/domains/ai-report/core/registry/AIEngineRegistry.ts에 추가

import { EEGAdvancedGeminiEngine } from '../ai-engines/EEGAdvancedGeminiEngine';

// 엔진 등록
AIEngineRegistry.register(new EEGAdvancedGeminiEngine());
```

### 4.2 렌더러 개발
```typescript
// src/domains/ai-report/report-renderers/web/EEGAdvancedWebRenderer.ts

export class EEGAdvancedWebRenderer implements IReportRenderer {
  readonly id = 'eeg-advanced-web';
  readonly name = 'EEG 전문 분석 웹 렌더러';
  readonly compatibleEngines = ['eeg-advanced-gemini-v1'];
  
  render(analysisResult: EEGAdvancedAnalysisResult): string {
    return `
      <div class="eeg-advanced-report">
        ${this.renderCoreFindings(analysisResult.analysisResults)}
        ${this.renderDetailedAnalysis(analysisResult.detailedDataAnalysis)}
        ${this.renderMetadata(analysisResult.metadata)}
      </div>
    `;
  }
  
  private renderCoreFindings(results: CoreAnalysisResult[]): string {
    return results.map((result, index) => `
      <div class="core-finding priority-${result.priority}">
        <h3>핵심 소견 ${result.priority}: ${result.coreOpinion.title}</h3>
        <div class="clinical-significance ${result.coreOpinion.clinicalSignificance}">
          ${result.coreOpinion.clinicalSignificance}
        </div>
        <p>${result.coreOpinion.summary}</p>
        
        <div class="data-evidence">
          <h4>데이터 근거</h4>
          ${this.renderEvidence(result.dataEvidence)}
        </div>
        
        <div class="scientific-validity">
          <h4>과학적 근거</h4>
          <p>${result.validityOpinion.scientificBasis}</p>
          ${this.renderReferences(result.validityOpinion.clinicalReferences)}
        </div>
      </div>
    `).join('');
  }
}
```

### 4.3 테스트 시나리오
```typescript
// __tests__/EEGAdvancedGeminiEngine.test.ts

describe('EEGAdvancedGeminiEngine', () => {
  const engine = new EEGAdvancedGeminiEngine(process.env.TEST_GEMINI_API_KEY);
  
  const sampleData: EEGAnalysisInput = {
    personalInfo: {
      age: 32,
      gender: 'male',
      occupation: 'developer'
    },
    eegTimeSeriesStats: {
      bandPowers: {
        delta: { mean: 120, std: 25, min: 80, max: 180 },
        theta: { mean: 150, std: 30, min: 100, max: 220 },
        alpha: { mean: 165, std: 40, min: 120, max: 250 }, // 정상범위 하한
        beta: { mean: 320, std: 60, min: 240, max: 450 },  // 정상범위 상한 초과
        gamma: { mean: 55, std: 15, min: 35, max: 85 }
      },
      eegIndices: {
        focusIndex: 2.8,           // 높음
        relaxationIndex: 0.12,     // 낮음  
        stressIndex: 0.75,         // 높음
        hemisphericBalance: 0.15,  // 좌뇌 편향
        cognitiveLoad: 2.3,        // 높음
        emotionalStability: 0.65   // 보통
      },
      qualityMetrics: {
        signalQuality: 0.85,
        measurementDuration: 300,
        dataCompleteness: 0.92
      }
    }
  };

  test('데이터 유효성 검증', async () => {
    const validation = await engine.validate(sampleData);
    expect(validation.isValid).toBe(true);
    expect(validation.qualityScore).toBeGreaterThan(80);
  });

  test('분석 결과 구조 검증', async () => {
    const result = await engine.analyze(sampleData);
    
    expect(result.analysisResults).toHaveLength(3);
    expect(result.analysisResults[0].priority).toBe(1);
    expect(result.analysisResults[1].priority).toBe(2);
    expect(result.analysisResults[2].priority).toBe(3);
    
    // 각 핵심 의견이 개발자 직업 특성을 반영하는지 확인
    const findings = result.analysisResults.map(r => r.coreOpinion.title.toLowerCase());
    expect(findings.some(f => f.includes('집중') || f.includes('베타') || f.includes('스트레스'))).toBe(true);
  });

  test('개인화된 정상범위 적용 확인', async () => {
    const result = await engine.analyze(sampleData);
    
    // 32세 남성 개발자의 특성이 반영되었는지 확인
    const alphaAnalysis = result.analysisResults.find(r => 
      r.coreOpinion.personalizedInterpretation.includes('32세') ||
      r.coreOpinion.personalizedInterpretation.includes('남성') ||
      r.coreOpinion.personalizedInterpretation.includes('개발자')
    );
    
    expect(alphaAnalysis).toBeDefined();
  });
});
```

## 5. 배포 및 모니터링

### 5.1 점진적 배포 전략
1. **Alpha 테스트**: 내부 테스트 계정으로 제한된 테스트
2. **Beta 테스트**: 특정 조직에 옵션으로 제공
3. **Production 배포**: 전체 사용자에게 새로운 엔진 옵션으로 제공

### 5.2 성능 모니터링
```typescript
// 분석 품질 메트릭
interface AnalysisQualityMetrics {
  responseTime: number;
  tokenUsage: number;
  validationScore: number;
  userSatisfactionRating?: number;
}

// 비용 추적
interface CostMetrics {
  apiCallCost: number;
  processingTime: number;
  creditConsumption: number;
}
```

이 구현 가이드를 통해 의료급 수준의 EEG 전문 분석 엔진을 단계적으로 개발할 수 있습니다.