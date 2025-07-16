# AI 엔진 개발 가이드

## 개요

Mind Breeze AI Report 시스템에서 새로운 AI 엔진을 개발하기 위한 종합적인 가이드입니다.

## 필수 요구사항

### 1. 기본 메타정보 (필수)

모든 AI 엔진은 다음 정보를 반드시 포함해야 합니다:

```typescript
readonly id: string;              // 고유 식별자 (예: 'basic-gemini-v1')
readonly name: string;            // 사용자에게 표시될 이름 (예: '기본 Gemini 분석')
readonly description: string;     // 엔진 설명 (예: 'Google Gemini API를 사용한 기본적인 건강 분석 엔진')
readonly version: string;         // 버전 (예: '1.0.0')
readonly provider: string;        // 제공업체 ('gemini' | 'openai' | 'claude' | 'custom')
readonly costPerAnalysis: number; // 분석당 소모 크레딧 (정수)
```

### 2. 지원 기능 정의

```typescript
readonly supportedDataTypes: MeasurementDataType; // EEG, PPG, ACC 지원 여부
readonly capabilities: EngineCapabilities;        // 언어, 데이터 길이 등 능력
readonly recommendedRenderers: string[];          // 권장 렌더러 ID 목록
```

### 3. 필수 메서드 구현

```typescript
validate(data: any): Promise<ValidationResult>     // 데이터 유효성 검증
analyze(data: any, options?: AnalysisOptions): Promise<AnalysisResult> // AI 분석 수행
```

## 엔진 개발 단계별 가이드

### Step 1: 프로젝트 구조 이해

```
src/domains/ai-report/
├── ai-engines/
│   ├── YourNewEngine.ts          # 새 엔진 파일
│   ├── BasicGeminiV1Engine.ts    # 참조용 기존 엔진
│   └── index.ts                  # 엔진 등록
├── core/
│   ├── interfaces/IAIEngine.ts   # 엔진 인터페이스
│   └── registry/AIEngineRegistry.ts # 레지스트리
└── report-renderers/             # 결과 렌더러들
```

### Step 2: 엔진 클래스 생성

```typescript
// YourNewEngine.ts
import { IAIEngine, MeasurementDataType, ValidationResult, AnalysisOptions, AnalysisResult, EngineCapabilities } from '../core/interfaces/IAIEngine';

export class YourNewEngine implements IAIEngine {
  // 1. 필수 메타정보 정의
  readonly id = 'your-engine-id';
  readonly name = '엔진 이름';
  readonly description = '엔진 설명';
  readonly version = '1.0.0';
  readonly provider = 'custom'; // 또는 해당하는 provider
  readonly costPerAnalysis = 1; // 크레딧 비용
  
  // 2. 지원 기능 정의
  readonly supportedDataTypes: MeasurementDataType = {
    eeg: true,   // EEG 데이터 지원 여부
    ppg: true,   // PPG 데이터 지원 여부
    acc: false   // ACC 데이터 지원 여부
  };
  
  readonly capabilities: EngineCapabilities = {
    supportedLanguages: ['ko', 'en'],
    maxDataDuration: 300,        // 최대 처리 가능한 데이터 길이 (초)
    minDataQuality: 30,          // 최소 요구 데이터 품질 (%)
    supportedOutputFormats: ['json'],
    realTimeProcessing: false
  };
  
  readonly recommendedRenderers = ['your-renderer-id'];
  
  // 3. 생성자 (API 키 등 설정)
  constructor(apiKey?: string) {
    // 초기화 로직
  }
  
  // 4. 필수 메서드 구현
  async validate(data: any): Promise<ValidationResult> {
    // 데이터 유효성 검증 로직
  }
  
  async analyze(data: any, options?: AnalysisOptions): Promise<AnalysisResult> {
    // AI 분석 로직
  }
  
  // 5. 선택적 메서드 (권장)
  getHealthMetrics?(): string[] {
    return ['overall_health', 'stress_level', 'focus_level'];
  }
  
  getRecommendationCategories?(): string[] {
    return ['exercise', 'nutrition', 'sleep'];
  }
  
  getSamplePrompts?(): string[] {
    return ['기본 건강 분석', '스트레스 중심 분석'];
  }
}
```

### Step 3: 데이터 검증 구현

```typescript
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

    // 각 데이터 타입별 검증
    if (this.supportedDataTypes.eeg && data.eeg) {
      if (!data.eeg.rawData || data.eeg.rawData.length === 0) {
        errors.push('EEG 원시 데이터가 없습니다.');
      } else {
        qualityScore += 40;
      }
    }

    // 품질 점수 계산
    if (data.qualityMetrics?.signalQuality < 0.3) {
      warnings.push('신호 품질이 낮습니다.');
      qualityScore *= 0.7;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      qualityScore: Math.min(100, Math.max(0, qualityScore))
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [`검증 오류: ${error}`],
      warnings,
      qualityScore: 0
    };
  }
}
```

### Step 4: AI 분석 구현

```typescript
async analyze(data: any, options: AnalysisOptions = {}): Promise<AnalysisResult> {
  const startTime = Date.now();
  const analysisId = `${this.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    // 1. 데이터 검증
    const validation = await this.validate(data);
    if (!validation.isValid) {
      throw new Error(`데이터 검증 실패: ${validation.errors.join(', ')}`);
    }

    // 2. AI API 호출 (각 엔진별 구현)
    const analysisResult = await this.callAIAPI(data, options);
    
    // 3. 결과 파싱 및 표준화
    const processingTime = Date.now() - startTime;

    return {
      engineId: this.id,
      engineVersion: this.version,
      timestamp: new Date().toISOString(),
      analysisId,
      
      // 분석 결과 (0-100 스케일)
      overallScore: analysisResult.overallScore || 70,
      stressLevel: analysisResult.stressLevel || 50,
      focusLevel: analysisResult.focusLevel || 60,
      
      // 상세 분석
      insights: {
        summary: analysisResult.summary || '기본 분석 결과',
        detailedAnalysis: analysisResult.detailedAnalysis || '',
        recommendations: analysisResult.recommendations || [],
        warnings: validation.warnings
      },
      
      // 생체 지표
      metrics: this.extractMetrics(data),
      
      // 메타 정보
      processingTime,
      costUsed: this.costPerAnalysis,
      rawData: analysisResult.rawData
    };
  } catch (error) {
    // 오류 처리
    return this.createErrorResult(analysisId, error, Date.now() - startTime);
  }
}
```

### Step 5: 엔진 등록

```typescript
// src/domains/ai-report/ai-engines/index.ts 에 추가

import { YourNewEngine } from './YourNewEngine';

export function registerAllEngines(): void {
  try {
    // 기존 엔진들...
    
    // 새 엔진 등록
    const yourEngine = new YourNewEngine();
    aiEngineRegistry.register(yourEngine);
    
    console.log('✅ All AI engines registered successfully');
  } catch (error) {
    console.error('❌ Failed to register AI engines:', error);
  }
}
```

## 모범 사례

### 1. 명명 규칙

- **엔진 ID**: `provider-name-version` 형식 (예: `gemini-basic-v1`)
- **클래스명**: `ProviderNameEngine` 형식 (예: `BasicGeminiV1Engine`)
- **파일명**: `ProviderNameEngine.ts` 형식

### 2. 에러 처리

```typescript
// 견고한 에러 처리
try {
  const result = await this.callAIAPI(data);
  return this.processResult(result);
} catch (error) {
  console.error(`${this.id} 분석 오류:`, error);
  return this.createFallbackResult(error);
}
```

### 3. 로깅

```typescript
// 적절한 로깅
console.log(`${this.name}: 분석 시작`);
console.log(`${this.name}: 데이터 검증 완료 (품질: ${validation.qualityScore}%)`);
console.log(`${this.name}: 분석 완료 (처리시간: ${processingTime}ms)`);
```

### 4. 설정 관리

```typescript
// 환경변수나 설정을 통한 API 키 관리
constructor(apiKey?: string) {
  this.apiKey = apiKey || 
    import.meta.env?.VITE_YOUR_API_KEY || 
    process.env.YOUR_API_KEY || 
    '';
    
  if (!this.apiKey) {
    console.warn(`${this.name}: API 키가 설정되지 않았습니다.`);
  }
}
```

## 테스트 가이드

### 1. 단위 테스트

```typescript
// YourNewEngine.test.ts
describe('YourNewEngine', () => {
  let engine: YourNewEngine;
  
  beforeEach(() => {
    engine = new YourNewEngine('test-api-key');
  });
  
  test('메타정보가 올바르게 설정되어야 함', () => {
    expect(engine.id).toBe('your-engine-id');
    expect(engine.name).toBeTruthy();
    expect(engine.costPerAnalysis).toBeGreaterThan(0);
  });
  
  test('데이터 검증이 작동해야 함', async () => {
    const result = await engine.validate({});
    expect(result.isValid).toBe(false);
  });
});
```

### 2. 통합 테스트

```typescript
// 실제 데이터로 엔드투엔드 테스트
test('실제 측정 데이터로 분석 수행', async () => {
  const sampleData = loadSampleMeasurementData();
  const result = await engine.analyze(sampleData);
  
  expect(result.overallScore).toBeGreaterThanOrEqual(0);
  expect(result.overallScore).toBeLessThanOrEqual(100);
  expect(result.insights.summary).toBeTruthy();
});
```

## 체크리스트

개발 완료 전 다음 사항들을 확인하세요:

- [ ] 모든 필수 메타정보가 정의되었는가?
- [ ] `IAIEngine` 인터페이스를 완전히 구현했는가?
- [ ] 데이터 검증 로직이 견고한가?
- [ ] 에러 처리가 적절히 구현되었는가?
- [ ] API 키 등 민감한 정보가 안전하게 관리되는가?
- [ ] 단위 테스트가 작성되었는가?
- [ ] 엔진이 레지스트리에 등록되었는가?
- [ ] 문서화가 완료되었는가?

## 참고 자료

- [IAIEngine 인터페이스](./core/interfaces/IAIEngine.ts)
- [BasicGeminiV1Engine 예제](./BasicGeminiV1Engine.ts)
- [AIEngineRegistry](./core/registry/AIEngineRegistry.ts)

## 도움이 필요하시면

1. 기존 `BasicGeminiV1Engine.ts` 파일을 참조하세요
2. 프로젝트 팀에 문의하세요
3. 테스트 환경에서 충분히 검증 후 배포하세요 