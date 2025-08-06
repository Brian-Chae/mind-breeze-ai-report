# RR Interval 저장 구현 계획

## 현재 상황

PPGSignalProcessor.ts에서 RR intervals를 계산하고 있으나, 최종 ppgTimeSeriesStats에는 저장되지 않고 있습니다. 전문 HRV 시각화(Poincaré Plot, 주파수 스펙트럼 등)를 구현하려면 RR intervals 데이터가 필요합니다.

## 구현 계획

### 1. 데이터 구조 수정

#### PPGTimeSeriesStats 인터페이스 확장
```typescript
export interface PPGTimeSeriesStats {
  // 기존 필드들...
  heartRate: PPGStatistics;
  hrvTimeMetrics: {
    sdnn: number;
    rmssd: number;
    pnn50: number;
    pnn20: number;
  };
  
  // 🔧 새로 추가할 RR Interval 필드
  rrIntervals?: {
    values: number[];          // RR 간격 배열 (ms)
    timestamps?: number[];     // 선택적: 각 간격의 타임스탬프
    count: number;            // 총 RR 간격 수
    quality: {
      validCount: number;     // 유효한 간격 수
      artifactCount: number;  // 아티팩트로 제거된 간격 수
      coverage: number;       // 데이터 커버리지 (0-1)
    };
  };
}
```

### 2. 구현 위치

1. **PPGSignalProcessor.ts**
   - 이미 `rrIntervals` 계산 중
   - 반환 데이터에 포함되도록 확인

2. **AnalysisPipelineOrchestrator.ts**
   - PPG 데이터 정규화 시 RR intervals 포함
   - ppgTimeSeriesStats에 추가

3. **PPGAdvancedGeminiEngine.ts**
   - RR intervals 데이터 활용은 선택적
   - 주로 렌더러에서 시각화용으로 사용

### 3. 메모리 및 성능 고려사항

- **5분 측정 기준**: 약 300-400개 RR intervals (약 3KB)
- **저장 전략**: 
  - 실시간 분석: 전체 배열 저장
  - 장기 저장: 통계값만 저장, 원시 데이터는 제거
- **시각화 최적화**: 
  - 1000개 이상 포인트 시 다운샘플링
  - Canvas 기반 렌더링 고려

### 4. 구현 우선순위

1. **즉시**: ppgTimeSeriesStats 구조에 rrIntervals 필드 추가
2. **다음**: AnalysisPipelineOrchestrator에서 RR intervals 전달
3. **이후**: 전문 HRV 시각화 컴포넌트 구현

## 결론

RR intervals 저장은 전문 HRV 분석을 위해 필수적이며, 이미 계산되고 있는 데이터를 저장 구조에 포함시키는 것은 간단한 작업입니다. 메모리 사용량도 크지 않아 즉시 구현 가능합니다.