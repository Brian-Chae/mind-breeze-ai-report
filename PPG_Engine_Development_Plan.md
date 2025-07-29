# PPG 건강 분석 Gemini Engine 개발 계획서

## 1. 프로젝트 개요

### 1.1 목적
EEG Advanced Gemini Engine의 성공적인 구조를 기반으로 PPG(Photoplethysmography) 전용 고급 분석 엔진을 구축하여, 3대 핵심 건강도 지표를 통한 종합적인 건강 분석 시스템을 구현합니다.

### 1.2 핵심 목표
- PPG 신호 기반 3대 건강도 지표 분석 (스트레스, 자율신경, 심박변이)
- EEG 엔진과 일관된 사용자 경험 제공
- 과학적 근거 기반의 신뢰할 수 있는 분석 결과
- 개인 맞춤형 건강 권장사항 제공

## 2. PPG 3대 건강도 지표 체계

### 2.1 스트레스 건강도 (Stress Health)
- **정의**: 신체적, 정신적 스트레스에 대한 관리 능력
- **주요 지표**: 
  - Stress Index
  - LF/HF Ratio의 변화 패턴
  - RMSSD 감소율
- **계산 공식**: 
  ```
  Stress Index = (Mean HR × SD HR) / RMSSD
  ```
- **정상 범위**: 30-70
- **건강도 점수**: 100점에 가까울수록 스트레스 관리 우수

### 2.2 자율신경 건강도 (Autonomic Health)
- **정의**: 교감/부교감 신경계의 균형 상태
- **주요 지표**:
  - LF/HF Ratio
  - SDNN
  - pNN50
- **계산 공식**:
  ```
  LF/HF Ratio = Low Frequency Power (0.04-0.15Hz) / High Frequency Power (0.15-0.4Hz)
  ```
- **정상 범위**: 0.5-2.0
- **건강도 점수**: 100점에 가까울수록 자율신경계 균형

### 2.3 심박변이 건강도 (HRV Health)
- **정의**: 심박 간격의 변동성과 적응력
- **주요 지표**:
  - RMSSD
  - pNN50
  - pNN20
  - SDNN
- **계산 공식**:
  ```
  RMSSD = √(Σ(RRi+1 - RRi)² / N)
  ```
- **정상 범위**: RMSSD 20-100ms
- **건강도 점수**: 100점에 가까울수록 심박 변이성 우수

## 3. 기술 구현 계획

### 3.1 Phase 1: 기본 구조 구축 (1주차)

#### 3.1.1 PPGAdvancedGeminiEngine 클래스 생성
```typescript
// 파일 위치: src/domains/ai-report/ai-engines/PPGAdvancedGeminiEngine.ts

export class PPGAdvancedGeminiEngine implements IAIEngine {
  readonly id = 'ppg-advanced-gemini-v1';
  readonly name = 'PPG 전문 분석 v1';
  readonly description = 'PPG 데이터 전문 해석을 위한 고급 Gemini 엔진';
  
  readonly supportedDataTypes: MeasurementDataType = {
    eeg: false,
    ppg: true,
    acc: false
  };
}
```

#### 3.1.2 데이터 인터페이스 정의
```typescript
interface PPGAnalysisInput {
  personalInfo: {
    name: string;
    age: number;
    gender: 'male' | 'female';
    occupation: string;
  };
  ppgTimeSeriesStats: {
    heartRate: {
      mean: number;
      std: number;
      min: number;
      max: number;
    };
    hrvTimeMetrics: {
      sdnn: number;
      rmssd: number;
      pnn50: number;
      pnn20: number;
      avnn: number;
      sdsd: number;
    };
    hrvFrequencyMetrics: {
      lfPower: number;
      hfPower: number;
      lfHfRatio: number;
      stressIndex: number;
    };
    qualityMetrics: {
      signalQuality: number;
      redSQI: number;
      irSQI: number;
      measurementDuration: number;
      dataCompleteness: number;
    };
  };
}
```

### 3.2 Phase 2: 핵심 기능 구현 (2-3주차)

#### 3.2.1 건강도 계산 헬퍼 함수
```typescript
// 스트레스 건강도 계산
private calculateStressHealthScore(stressIndex: number): number {
  const optimalStress = 50;
  const normalMin = 30;
  const normalMax = 70;
  
  if (stressIndex >= normalMin && stressIndex <= normalMax) {
    const distanceFromOptimal = Math.abs(stressIndex - optimalStress);
    const maxDistance = Math.max(optimalStress - normalMin, normalMax - optimalStress);
    return Math.round(100 - (distanceFromOptimal / maxDistance) * 15);
  } else {
    const distanceFromRange = stressIndex < normalMin ? 
      normalMin - stressIndex : stressIndex - normalMax;
    const penalty = Math.min(distanceFromRange * 30, 70);
    return Math.max(20, 85 - Math.round(penalty));
  }
}

// 자율신경 건강도 계산
private calculateAutonomicHealthScore(lfHfRatio: number): number {
  const optimalRatio = 1.0;
  const normalMin = 0.5;
  const normalMax = 2.0;
  
  if (lfHfRatio >= normalMin && lfHfRatio <= normalMax) {
    const distanceFromOptimal = Math.abs(lfHfRatio - optimalRatio);
    const maxDistance = Math.max(optimalRatio - normalMin, normalMax - optimalRatio);
    return Math.round(100 - (distanceFromOptimal / maxDistance) * 15);
  } else {
    const distanceFromRange = lfHfRatio < normalMin ? 
      normalMin - lfHfRatio : lfHfRatio - normalMax;
    const penalty = Math.min(distanceFromRange * 40, 70);
    return Math.max(20, 85 - Math.round(penalty));
  }
}

// 심박변이 건강도 계산
private calculateHRVHealthScore(rmssd: number, age: number): number {
  // 연령별 정상 범위 조정
  const ageAdjustedMax = 100 - (age - 20) * 0.5;
  const normalMin = 20;
  const normalMax = Math.min(100, ageAdjustedMax);
  
  if (rmssd >= normalMin && rmssd <= normalMax) {
    return Math.round(85 + (rmssd - normalMin) / (normalMax - normalMin) * 15);
  } else if (rmssd > normalMax) {
    return 100;
  } else {
    const deficit = normalMin - rmssd;
    const penalty = Math.min(deficit * 2, 65);
    return Math.max(20, 85 - Math.round(penalty));
  }
}
```

#### 3.2.2 PPG 데이터 추출 및 매핑
```typescript
private extractPPGDataFromReport(data: any): PPGAnalysisInput | null {
  try {
    // ProcessedDataCollector에서 수집된 PPG 데이터 구조 매핑
    if (data.ppgTimeSeriesStats && data.personalInfo) {
      return {
        personalInfo: {
          name: data.personalInfo.name,
          age: data.personalInfo.age,
          gender: data.personalInfo.gender,
          occupation: data.personalInfo.occupation
        },
        ppgTimeSeriesStats: {
          heartRate: {
            mean: data.ppgTimeSeriesStats.heartRate.mean,
            std: data.ppgTimeSeriesStats.heartRate.std,
            min: data.ppgTimeSeriesStats.heartRate.min,
            max: data.ppgTimeSeriesStats.heartRate.max
          },
          hrvTimeMetrics: {
            sdnn: data.ppgTimeSeriesStats.hrvMetrics.sdnn,
            rmssd: data.ppgTimeSeriesStats.hrvMetrics.rmssd,
            pnn50: data.ppgTimeSeriesStats.hrvMetrics.pnn50,
            pnn20: data.ppgTimeSeriesStats.hrvMetrics.pnn20,
            avnn: data.ppgTimeSeriesStats.hrvMetrics.avnn,
            sdsd: data.ppgTimeSeriesStats.hrvMetrics.sdsd
          },
          hrvFrequencyMetrics: {
            lfPower: data.ppgTimeSeriesStats.hrvMetrics.lfPower,
            hfPower: data.ppgTimeSeriesStats.hrvMetrics.hfPower,
            lfHfRatio: data.ppgTimeSeriesStats.hrvMetrics.lfHfRatio,
            stressIndex: data.ppgTimeSeriesStats.hrvMetrics.stressIndex
          },
          qualityMetrics: {
            signalQuality: data.ppgTimeSeriesStats.qualityMetrics.signalQuality,
            redSQI: data.ppgTimeSeriesStats.qualityMetrics.redSQI,
            irSQI: data.ppgTimeSeriesStats.qualityMetrics.irSQI,
            measurementDuration: data.ppgTimeSeriesStats.qualityMetrics.measurementDuration,
            dataCompleteness: data.ppgTimeSeriesStats.qualityMetrics.dataCompleteness
          }
        }
      };
    }
    return null;
  } catch (error) {
    console.error('PPG 데이터 추출 오류:', error);
    return null;
  }
}
```

### 3.3 Phase 3: Gemini 프롬프트 및 분석 (4주차)

#### 3.3.1 PPG 분석 프롬프트 템플릿
```typescript
private generatePPGAnalysisPrompt(data: PPGAnalysisInput): string {
  const { personalInfo, ppgTimeSeriesStats } = data;
  
  return `
당신은 PPG(맥파) 분석 전문가입니다. 다음 상세한 PPG 시계열 통계 데이터를 분석하여 의료급 JSON 형식으로 응답해주세요.

## 개인정보
- 이름: ${personalInfo.name}
- 나이: ${personalInfo.age}세
- 성별: ${personalInfo.gender === 'male' ? '남성' : '여성'}
- 직업: ${personalInfo.occupation}

## 3대 맥파 건강도 지표 중심 분석

### 1. 스트레스 건강도 (Stress Health)
- **Stress Index**: ${ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex.toFixed(2)}
- **계산 공식**: (Mean HR × SD HR) / RMSSD
- **정상범위**: 30-70
- **해석**: 스트레스 반응 및 관리 능력 평가
- **측정값 의미**: 높을수록 스트레스 부하가 큼

### 2. 자율신경 건강도 (Autonomic Health)
- **LF/HF Ratio**: ${ppgTimeSeriesStats.hrvFrequencyMetrics.lfHfRatio.toFixed(2)}
- **계산 공식**: Low Frequency Power / High Frequency Power
- **정상범위**: 0.5-2.0
- **해석**: 교감/부교감 신경계 균형
- **측정값 의미**: 1.0에 가까울수록 균형적

### 3. 심박변이 건강도 (HRV Health)
- **RMSSD**: ${ppgTimeSeriesStats.hrvTimeMetrics.rmssd.toFixed(2)}ms
- **계산 공식**: √(Σ(RRi+1 - RRi)² / N)
- **정상범위**: 20-100ms
- **해석**: 심박 변이성 및 적응력
- **측정값 의미**: 높을수록 건강한 변이성

## 보조 지표
- SDNN: ${ppgTimeSeriesStats.hrvTimeMetrics.sdnn.toFixed(2)}ms
- pNN50: ${ppgTimeSeriesStats.hrvTimeMetrics.pnn50.toFixed(2)}%
- pNN20: ${ppgTimeSeriesStats.hrvTimeMetrics.pnn20.toFixed(2)}%
- 평균 심박수: ${ppgTimeSeriesStats.heartRate.mean.toFixed(0)}bpm

## 신호 품질
- 전체 신호 품질: ${(ppgTimeSeriesStats.qualityMetrics.signalQuality * 100).toFixed(1)}%
- 측정 시간: ${ppgTimeSeriesStats.qualityMetrics.measurementDuration}초

## 분석 요청사항
위의 PPG 데이터를 바탕으로 다음 JSON 형식으로 3대 맥파 건강도 지표 중심의 의료급 분석 결과를 제공해주세요:

{
  "threeDimensionAnalysis": {
    "stress": {
      "dimension": "스트레스 건강도",
      "level": "우수|양호|개선필요",
      "score": 0-100,
      "interpretation": "스트레스 관리 능력 해석 (100점에 가까울수록 건강한 스트레스 관리)",
      "evidence": {
        "stressIndex": ${ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex.toFixed(2)},
        "heartRateVariability": ${ppgTimeSeriesStats.heartRate.std.toFixed(2)},
        "calculationFormula": "(Mean HR × SD HR) / RMSSD",
        "normalRange": "30-70"
      },
      "clinicalSignificance": "normal|mild|moderate|severe",
      "personalizedInterpretation": "${personalInfo.age}세 ${personalInfo.occupation}의 스트레스 특성 해석",
      "recommendations": ["스트레스 관리를 위한 개인 맞춤 권장사항"]
    },
    "autonomic": {
      "dimension": "자율신경 건강도",
      "level": "우수|양호|개선필요",
      "score": 0-100,
      "interpretation": "자율신경계 균형 상태 해석 (100점에 가까울수록 건강한 균형)",
      "evidence": {
        "lfHfRatio": ${ppgTimeSeriesStats.hrvFrequencyMetrics.lfHfRatio.toFixed(2)},
        "sympatheticActivity": "교감신경 활성도",
        "parasympatheticActivity": "부교감신경 활성도",
        "calculationFormula": "LF Power / HF Power",
        "normalRange": "0.5-2.0"
      },
      "clinicalSignificance": "normal|mild|moderate|severe",
      "personalizedInterpretation": "개인의 자율신경계 균형 특성 해석",
      "recommendations": ["자율신경 균형을 위한 개인 맞춤 권장사항"]
    },
    "hrv": {
      "dimension": "심박변이 건강도",
      "level": "우수|양호|개선필요",
      "score": 0-100,
      "interpretation": "심박 변이성 수준 해석 (100점에 가까울수록 건강한 심박 변이)",
      "evidence": {
        "rmssd": ${ppgTimeSeriesStats.hrvTimeMetrics.rmssd.toFixed(2)},
        "sdnn": ${ppgTimeSeriesStats.hrvTimeMetrics.sdnn.toFixed(2)},
        "pnn50": ${ppgTimeSeriesStats.hrvTimeMetrics.pnn50.toFixed(2)},
        "calculationFormula": "√(Σ(RRi+1 - RRi)² / N)",
        "normalRange": "RMSSD 20-100ms"
      },
      "clinicalSignificance": "normal|mild|moderate|severe",
      "personalizedInterpretation": "개인의 심박 변이성 특성과 연령 고려 해석",
      "recommendations": ["심박 변이성 향상을 위한 개인 맞춤 권장사항"]
    }
  },
  "detailedDataAnalysis": {
    "heartRateAnalysis": {
      "restingHR": {"interpretation": "안정시 심박수 해석", "evidence": "수치적 근거", "clinicalSignificance": "임상적 의미"},
      "hrVariability": {"interpretation": "심박수 변동성 해석", "evidence": "수치적 근거", "clinicalSignificance": "임상적 의미"},
      "hrTrend": {"interpretation": "심박수 추세 해석", "evidence": "수치적 근거", "clinicalSignificance": "임상적 의미"}
    },
    "hrvIndicesAnalysis": {
      "timeDomin": {
        "interpretation": "시간 영역 HRV 지표 종합 해석",
        "evidence": "SDNN, RMSSD, pNN50 기반 분석",
        "explanation": "연속된 심박 간격의 변동성을 시간 축에서 분석",
        "recommendations": ["시간 영역 지표 개선 방안"]
      },
      "frequencyDomain": {
        "interpretation": "주파수 영역 HRV 지표 종합 해석",
        "evidence": "LF, HF, LF/HF ratio 기반 분석",
        "explanation": "심박 변동의 주파수 성분을 분석하여 자율신경 활동 평가",
        "recommendations": ["주파수 영역 지표 개선 방안"]
      }
    },
    "autonomicAnalysis": {
      "overallAssessment": "3대 지표 종합 자율신경계 기능 평가",
      "sympatheticParasympatheticBalance": "교감/부교감 신경 균형 상태",
      "stressResponsePattern": "스트레스 반응 패턴 분석",
      "recoveryCapacity": "회복 능력 평가"
    }
  },
  "comprehensiveAssessment": {
    "overallSummary": "3가지 축(스트레스, 자율신경, 심박변이)을 종합한 전체적인 건강 상태 평가",
    "keyFindings": ["주요 발견사항 1", "주요 발견사항 2", "주요 발견사항 3"],
    "primaryConcerns": ["주요 문제점이나 개선이 필요한 영역"],
    "ageGenderAnalysis": {
      "ageComparison": "${personalInfo.age}세 연령대 평균과 비교한 분석",
      "genderConsiderations": "${personalInfo.gender} 성별 특성을 고려한 해석",
      "developmentalContext": "연령대별 정상 발달 범위 내 평가"
    },
    "occupationalAnalysis": {
      "jobDemands": "${personalInfo.occupation} 직업의 스트레스 요구사항 분석",
      "workRelatedPatterns": "업무 관련 자율신경계 패턴 해석",
      "professionalRecommendations": ["직업적 특성을 고려한 맞춤형 권장사항"]
    },
    "improvementPlan": {
      "shortTermGoals": ["1-4주 내 개선 목표"],
      "longTermGoals": ["3-6개월 장기 개선 방향"],
      "actionItems": ["구체적인 실행 계획"],
      "monitoringPlan": "추후 측정 및 모니터링 계획"
    },
    "riskAssessment": {
      "level": "low|moderate|high",
      "factors": ["위험 요소들"],
      "preventiveMeasures": ["예방적 조치사항"]
    },
    "overallScore": "0-100점 범위의 종합 점수",
    "clinicalRecommendation": "전문의 상담 필요성 여부 및 추가 검사 권장사항"
  }
}`;
}
```

### 3.4 Phase 4: Mock 데이터 및 UI 구현 (5주차)

#### 3.4.1 Mock 데이터 생성 로직
```typescript
private generateMockPPGAnalysis(data: PPGAnalysisInput): PPGAdvancedAnalysisResult {
  const { personalInfo, ppgTimeSeriesStats } = data;
  
  return {
    threeDimensionAnalysis: {
      stress: {
        dimension: "스트레스 건강도",
        level: this.calculateHealthLevel(ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex, 30, 70),
        score: this.calculateStressHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex),
        interpretation: `Stress Index ${ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex.toFixed(2)}로 
          ${this.calculateHealthLevel(ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex, 30, 70) === '우수' ? 
          '최적의 스트레스 건강도' : '스트레스 관리 필요'}를 보입니다.`,
        evidence: {
          stressIndex: ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex,
          heartRateVariability: ppgTimeSeriesStats.heartRate.std,
          calculationFormula: "(Mean HR × SD HR) / RMSSD",
          normalRange: "30-70"
        },
        clinicalSignificance: this.calculateClinicalSignificance(
          ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex, 30, 70
        ),
        personalizedInterpretation: `${personalInfo.age}세 ${personalInfo.occupation}의 
          스트레스 수준은 직업적 특성을 고려할 때 ${
          this.calculateStressHealthScore(ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex) > 80 ? 
          '우수한' : '관리가 필요한'} 상태입니다.`,
        recommendations: this.generateStressRecommendations(
          ppgTimeSeriesStats.hrvFrequencyMetrics.stressIndex
        )
      },
      // autonomic, hrv 차원도 동일한 구조로 구현
    },
    // detailedDataAnalysis, comprehensiveAssessment도 EEG와 동일한 구조로 구현
  };
}
```

#### 3.4.2 PPG Advanced React Renderer
```typescript
// 파일 위치: src/domains/ai-report/report-renderers/PPGAdvancedReactRenderer.tsx

export const PPGAdvancedReportComponent: React.FC<PPGAdvancedReportProps> = ({ report }) => {
  const analysisData = report.analysisResult || {};
  const threeDimensionAnalysis = analysisData.threeDimensionAnalysis || {};
  
  const getDimensionIcon = (dimension: string): React.ReactElement => {
    if (dimension.includes('스트레스')) {
      return <Heart className="w-5 h-5 text-red-500" />;
    } else if (dimension.includes('자율신경')) {
      return <Activity className="w-5 h-5 text-green-500" />;
    } else if (dimension.includes('심박변이')) {
      return <Pulse className="w-5 h-5 text-blue-500" />;
    }
    return <Heart className="w-5 h-5 text-gray-500" />;
  };
  
  // EEG 렌더러와 동일한 구조로 UI 구현
};
```

## 4. 통합 및 테스트 계획

### 4.1 엔진 등록 (6주차)
1. PPGAdvancedGeminiEngine을 AI 엔진 레지스트리에 등록
2. 엔진 선택 모달에 PPG 전문 분석 옵션 추가
3. 데이터 타입별 엔진 자동 선택 로직 구현

### 4.2 데이터 파이프라인 연결
1. ProcessedDataCollector와 PPG 엔진 연결
2. PPGSignalProcessor 출력 데이터 매핑 검증
3. 실시간 데이터 스트림 처리 테스트

### 4.3 품질 검증
1. Mock 데이터로 기능 테스트
2. 실제 PPG 데이터로 통합 테스트
3. UI/UX 사용성 테스트
4. 성능 최적화

## 5. 일정 요약

| 주차 | 작업 내용 | 산출물 |
|------|-----------|---------|
| 1주 | 기본 구조 구축 | PPGAdvancedGeminiEngine.ts |
| 2-3주 | 핵심 기능 구현 | 건강도 계산 로직, 데이터 매핑 |
| 4주 | Gemini 프롬프트 및 분석 | 프롬프트 템플릿, Mock 데이터 |
| 5주 | UI 구현 | PPGAdvancedReactRenderer.tsx |
| 6주 | 통합 및 테스트 | 완성된 PPG 분석 시스템 |

## 6. 기대 효과

1. **통합 건강 플랫폼**: EEG + PPG를 통한 종합적인 건강 분석
2. **일관된 사용자 경험**: 동일한 UI/UX 패턴으로 학습 곡선 최소화
3. **과학적 신뢰성**: 검증된 지표와 계산식 사용
4. **확장 가능성**: 추후 다른 생체 신호 분석 엔진 추가 용이

## 7. 주의사항

1. **의료 기기 인증**: 의료 진단 목적이 아닌 웰니스 목적임을 명시
2. **데이터 보안**: 개인 건강 정보 암호화 및 안전한 저장
3. **정확도 한계**: PPG 신호의 한계와 측정 환경 영향 고려
4. **사용자 교육**: 올바른 측정 방법과 결과 해석 가이드 제공