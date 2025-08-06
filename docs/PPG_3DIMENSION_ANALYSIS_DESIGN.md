# PPG 3대 건강 지표 중심 고급 분석 시스템 설계서

## 1. 개요

PPG(Photoplethysmography) 분석을 3대 핵심 건강 지표에 집중하여 EEG와 동일한 수준의 상세함과 전문성으로 제공하기 위한 시스템 설계서입니다.

## 2. PPG 3대 건강 지표 정의

### 2.1 스트레스 건강도 (Stress Health)
- **정의**: 심박변이도와 자율신경계 활성도를 기반으로 한 스트레스 관리 능력
- **계산식**: (Mean HR × SD HR) / RMSSD
- **정상범위**: 30-70
- **해석**: 100점에 가까울수록 건강한 스트레스 관리 상태

### 2.2 자율신경 균형 (Autonomic Balance)
- **정의**: 교감신경과 부교감신경의 균형 상태
- **계산식**: LF/HF Ratio 기반
- **정상범위**: 0.5-2.0
- **해석**: 1.0에 가까울수록 균형잡힌 상태

### 2.3 심박변이도 (Heart Rate Variability)
- **정의**: 심장 박동 간격의 변이성으로 신체 적응력과 회복력을 반영
- **주요지표**: SDNN, RMSSD, pNN50
- **정상범위**: SDNN 30-100ms, RMSSD 20-80ms
- **해석**: 높을수록 좋은 신체 적응력과 회복력

## 3. PPG 데이터 구조 및 통계 분석

### 3.1 핵심 통계 데이터 구조

```typescript
export interface PPGStatistics {
  mean: number;
  std: number;
  min: number;
  max: number;
}

export interface PPGTimeSeriesStats {
  heartRate: PPGStatistics;
  hrvTimeMetrics: {
    sdnn: number;      // HRV의 핵심 지표
    rmssd: number;     // 부교감신경 활성도
    pnn50: number;     // HRV 복잡성
    pnn20: number;     // HRV 민감도
  };
  hrvFrequencyMetrics: {
    lfPower: number;   // 교감신경 활성도
    hfPower: number;   // 부교감신경 활성도
    lfHfRatio: number; // 자율신경 균형
    stressIndex: number; // 스트레스 지수
  };
  qualityMetrics: {
    signalQuality: number;
    measurementDuration: number;
    dataCompleteness: number;
  };
}
```

### 3.2 3대 지표 계산 함수

```typescript
// 스트레스 건강도 계산
function calculateStressHealthScore(stressIndex: number): number {
  // 30-70이 정상범위, 50이 최적
  if (stressIndex <= 30) return 100;
  if (stressIndex >= 70) return 0;
  if (stressIndex <= 50) {
    return 100 - ((50 - stressIndex) / 20) * 20; // 30-50 구간
  } else {
    return 80 - ((stressIndex - 50) / 20) * 80; // 50-70 구간
  }
}

// 자율신경 균형 점수 계산
function calculateAutonomicBalanceScore(lfHfRatio: number): number {
  // 0.5-2.0이 정상범위, 1.0이 최적
  const optimalRatio = 1.0;
  const deviation = Math.abs(lfHfRatio - optimalRatio);
  
  if (lfHfRatio < 0.5 || lfHfRatio > 2.0) {
    return Math.max(0, 50 - deviation * 20);
  }
  return Math.max(0, 100 - deviation * 50);
}

// HRV 건강도 계산
function calculateHRVHealthScore(sdnn: number, rmssd: number): number {
  // SDNN과 RMSSD를 종합하여 점수 계산
  let sdnnScore = 0;
  if (sdnn >= 30 && sdnn <= 100) {
    sdnnScore = 50 + (sdnn - 30) / 70 * 50;
  } else if (sdnn > 100) {
    sdnnScore = 100;
  } else {
    sdnnScore = (sdnn / 30) * 50;
  }
  
  let rmssdScore = 0;
  if (rmssd >= 20 && rmssd <= 80) {
    rmssdScore = 50 + (rmssd - 20) / 60 * 50;
  } else if (rmssd > 80) {
    rmssdScore = 100;
  } else {
    rmssdScore = (rmssd / 20) * 50;
  }
  
  return (sdnnScore + rmssdScore) / 2;
}
```

## 4. PPG 3대 지표 중심 Gemini 프롬프트 설계

```typescript
const generatePPG3DimensionAnalysisPrompt = (data: PPGTimeSeriesStats, personalInfo: PersonalInfo) => {
  const { age, gender, occupation } = personalInfo;
  
  return `
당신은 심혈관 및 자율신경계 전문의입니다. ${age}세 ${gender === 'male' ? '남성' : '여성'} ${occupation}의 PPG 측정 데이터를 분석하여 3대 핵심 건강 지표를 중심으로 전문적이고 상세한 평가를 제공해주세요.

# 개인 정보
- 연령: ${age}세
- 성별: ${gender === 'male' ? '남성' : '여성'}
- 직업: ${occupation}

# PPG 3대 건강 지표 측정값

## 1. 스트레스 건강도 관련 데이터
- 스트레스 지수: ${data.hrvFrequencyMetrics.stressIndex.toFixed(2)} (정상: 30-70)
- 평균 심박수: ${data.heartRate.mean.toFixed(1)} bpm
- 심박수 표준편차: ${data.heartRate.std.toFixed(2)} bpm
- RMSSD: ${data.hrvTimeMetrics.rmssd.toFixed(1)} ms

## 2. 자율신경 균형 관련 데이터
- LF Power: ${data.hrvFrequencyMetrics.lfPower.toFixed(0)} ms² (교감신경)
- HF Power: ${data.hrvFrequencyMetrics.hfPower.toFixed(0)} ms² (부교감신경)
- LF/HF Ratio: ${data.hrvFrequencyMetrics.lfHfRatio.toFixed(2)} (정상: 0.5-2.0)

## 3. 심박변이도(HRV) 관련 데이터
- SDNN: ${data.hrvTimeMetrics.sdnn.toFixed(1)} ms (정상: 30-100)
- RMSSD: ${data.hrvTimeMetrics.rmssd.toFixed(1)} ms (정상: 20-80)
- pNN50: ${data.hrvTimeMetrics.pnn50.toFixed(1)}% (정상: 5-50)
- pNN20: ${data.hrvTimeMetrics.pnn20.toFixed(1)}% (정상: 20-70)

## 측정 품질
- 신호 품질: ${(data.qualityMetrics.signalQuality * 100).toFixed(0)}%
- 측정 시간: ${data.qualityMetrics.measurementDuration}초
- 데이터 완성도: ${(data.qualityMetrics.dataCompleteness * 100).toFixed(0)}%

# 분석 요청사항

다음 형식의 JSON으로 3대 건강 지표를 중심으로 전문적이고 상세한 분석 결과를 제공해주세요:

{
  "threeDimensionAnalysis": {
    "stress": {
      "dimension": "스트레스 건강도",
      "level": "우수/양호/주의/경계 중 하나",
      "score": 0-100 사이의 점수 (100에 가까울수록 건강한 스트레스 관리),
      "interpretation": "${age}세 ${gender === 'male' ? '남성' : '여성'} ${occupation}의 스트레스 관리 능력에 대한 전문적 해석. 스트레스 지수 ${data.hrvFrequencyMetrics.stressIndex.toFixed(2)}의 의미와 심박수 변동성과의 관계, 일상생활에서의 영향을 3-4문장으로 상세히 설명",
      "evidence": {
        "stressIndex": ${data.hrvFrequencyMetrics.stressIndex.toFixed(2)},
        "heartRateVariability": ${data.heartRate.std.toFixed(2)},
        "rmssd": ${data.hrvTimeMetrics.rmssd.toFixed(1)},
        "physiologicalMeaning": "스트레스 지수의 생리학적 의미 설명"
      },
      "clinicalSignificance": "normal/mild/moderate/severe 중 하나",
      "personalizedInterpretation": "${occupation} 직업 특성상 ${age}세 연령대에서 나타나는 스트레스 패턴과 관리 방안에 대한 맞춤형 해석",
      "recommendations": [
        "${occupation} 업무 중 실천 가능한 스트레스 관리법",
        "심박변이도 개선을 위한 호흡법이나 운동법",
        "생활습관 개선 방안 2-3가지"
      ]
    },
    "autonomic": {
      "dimension": "자율신경 균형",
      "level": "균형/약간 교감 우세/약간 부교감 우세/불균형 중 하나",
      "score": 0-100 사이의 점수 (100에 가까울수록 이상적인 균형),
      "interpretation": "LF/HF 비율 ${data.hrvFrequencyMetrics.lfHfRatio.toFixed(2)}에 대한 전문적 해석. 교감신경(${data.hrvFrequencyMetrics.lfPower.toFixed(0)} ms²)과 부교감신경(${data.hrvFrequencyMetrics.hfPower.toFixed(0)} ms²)의 활성도 분석, ${age}세 ${gender}의 정상 범위와 비교하여 3-4문장으로 설명",
      "evidence": {
        "lfPower": ${data.hrvFrequencyMetrics.lfPower.toFixed(0)},
        "hfPower": ${data.hrvFrequencyMetrics.hfPower.toFixed(0)},
        "lfHfRatio": ${data.hrvFrequencyMetrics.lfHfRatio.toFixed(2)},
        "balanceAssessment": "자율신경계 균형 상태에 대한 평가"
      },
      "clinicalSignificance": "normal/mild/moderate/severe 중 하나",
      "personalizedInterpretation": "${age}세 ${gender}의 자율신경계 특성과 ${occupation} 직업이 미치는 영향을 고려한 맞춤형 해석",
      "recommendations": [
        "자율신경 균형 개선을 위한 생활 리듬 조절법",
        "교감/부교감 신경 활성화를 위한 구체적 방법",
        "${occupation} 업무 특성에 맞는 자율신경 관리법"
      ]
    },
    "hrv": {
      "dimension": "심박변이도",
      "level": "우수/양호/보통/저하 중 하나",
      "score": 0-100 사이의 점수 (높을수록 좋은 적응력과 회복력),
      "interpretation": "SDNN ${data.hrvTimeMetrics.sdnn.toFixed(1)}ms와 RMSSD ${data.hrvTimeMetrics.rmssd.toFixed(1)}ms 수치에 대한 종합적 해석. ${age}세 ${gender}의 정상 범위와 비교, 신체 적응력과 회복력 평가를 3-4문장으로 상세히 설명",
      "evidence": {
        "sdnn": ${data.hrvTimeMetrics.sdnn.toFixed(1)},
        "rmssd": ${data.hrvTimeMetrics.rmssd.toFixed(1)},
        "pnn50": ${data.hrvTimeMetrics.pnn50.toFixed(1)},
        "adaptabilityScore": "신체 적응력 점수화"
      },
      "clinicalSignificance": "normal/mild/moderate/severe 중 하나",
      "personalizedInterpretation": "${occupation}의 활동 패턴과 ${age}세 연령을 고려한 HRV 수준 평가 및 개선 가능성",
      "recommendations": [
        "HRV 향상을 위한 유산소 운동 권장사항",
        "회복력 증진을 위한 수면 개선 방법",
        "${age}세에 적합한 심폐 기능 강화 운동"
      ]
    }
  },
  "detailedDataAnalysis": {
    "stressAnalysis": {
      "currentStatus": {
        "interpretation": "현재 스트레스 지수 ${data.hrvFrequencyMetrics.stressIndex.toFixed(2)}의 상세 분석",
        "evidence": "심박수 패턴과 HRV 지표들의 상관관계 설명",
        "dailyPattern": "일상생활에서의 스트레스 패턴 예측"
      },
      "trends": {
        "interpretation": "스트레스 지표의 변화 가능성과 영향 요인",
        "riskFactors": "${occupation} 직업의 스트레스 위험 요인",
        "protectiveFactors": "스트레스 완화에 도움이 되는 요인들"
      }
    },
    "autonomicAnalysis": {
      "sympatheticActivity": {
        "interpretation": "교감신경 활성도(LF: ${data.hrvFrequencyMetrics.lfPower.toFixed(0)} ms²) 분석",
        "clinicalMeaning": "일상생활에서의 의미와 영향",
        "optimization": "최적화 방안"
      },
      "parasympatheticActivity": {
        "interpretation": "부교감신경 활성도(HF: ${data.hrvFrequencyMetrics.hfPower.toFixed(0)} ms²) 분석",
        "recoveryCapacity": "회복 능력 평가",
        "enhancement": "활성화 방법"
      }
    },
    "hrvDetailedAnalysis": {
      "timeDomain": {
        "interpretation": "SDNN, RMSSD, pNN50 등 시간 영역 지표 종합 분석",
        "ageComparison": "${age}세 ${gender} 평균과의 비교",
        "clinicalImplications": "임상적 의미와 건강 영향"
      },
      "adaptability": {
        "interpretation": "환경 변화에 대한 신체 적응력 평가",
        "resilience": "스트레스 회복탄력성 분석",
        "improvement": "적응력 향상 방안"
      }
    },
    "auxiliaryMetrics": {
      "coherenceRatio": {
        "value": ${(data.hrvFrequencyMetrics.hfPower / (data.hrvFrequencyMetrics.lfPower + data.hrvFrequencyMetrics.hfPower) * 100).toFixed(1)},
        "interpretation": "심장 리듬 일관성에 대한 전문적 해석. 높을수록 안정적인 심장 리듬을 의미하며, ${occupation}의 업무 특성상 필요한 수준과 비교 분석"
      },
      "recoveryIndex": {
        "value": ${data.hrvTimeMetrics.rmssd.toFixed(1)},
        "interpretation": "회복 지수(RMSSD)에 대한 상세 해석. ${age}세 ${gender}의 회복 능력 평가와 개선 방안"
      },
      "vitalityScore": {
        "value": ${((data.hrvTimeMetrics.sdnn + data.hrvTimeMetrics.rmssd) / 2).toFixed(1)},
        "interpretation": "전반적인 활력도 점수에 대한 해석. 신체 에너지 수준과 일상 활동 능력 평가"
      }
    }
  },
  "comprehensiveAssessment": {
    "overallHealthScore": 0-100 사이의 종합 점수 (3대 지표 평균),
    "primaryConcerns": [
      "가장 주의가 필요한 건강 지표와 그 이유",
      "개선 우선순위가 높은 영역 2-3개"
    ],
    "strengthAreas": [
      "건강한 상태를 보이는 지표들",
      "유지하면 좋은 생활 패턴"
    ],
    "integratedRecommendations": {
      "immediate": [
        "즉시 실천 가능한 개선 방안 2-3개",
        "일상에서 쉽게 적용할 수 있는 방법"
      ],
      "shortTerm": [
        "1-3개월 내 목표로 삼을 개선 사항",
        "측정 가능한 구체적 목표"
      ],
      "lifestyle": {
        "exercise": "${age}세 ${gender}에게 적합하고 ${occupation} 일정에 맞는 운동 계획",
        "stressManagement": "효과적인 스트레스 관리 기법 3가지",
        "workLifeBalance": "${occupation} 직업 특성을 고려한 일과 휴식의 균형 방안",
        "breathingExercises": "자율신경 균형을 위한 호흡법"
      }
    },
    "followUpSuggestions": {
      "monitoringPlan": "정기적으로 확인해야 할 지표들",
      "expectedImprovement": "권장사항 실천 시 예상되는 개선 효과",
      "warningSignals": "주의해야 할 증상이나 변화"
    }
  },
  "metadata": {
    "analysisTimestamp": "분석 시간",
    "confidenceLevel": "high/medium/low",
    "dataQuality": "excellent/good/fair",
    "limitations": [
      "PPG 측정의 한계점",
      "추가 검사가 필요한 경우"
    ]
  }
}

## 주의사항:
1. 3대 지표(스트레스, 자율신경, HRV)에 집중하여 깊이 있는 분석을 제공하세요
2. ${age}세 ${gender === 'male' ? '남성' : '여성'} ${occupation}의 특성을 모든 해석에 반영하세요
3. 의학적 근거와 최신 연구를 바탕으로 전문적이면서도 이해하기 쉬운 설명을 제공하세요
4. 각 지표 간의 상호 연관성을 설명하여 통합적인 건강 상태를 이해할 수 있도록 하세요
5. overallHealthScore는 반드시 3대 지표 점수의 평균으로 계산하세요
`;
};
```

## 5. PPG 3대 지표 중심 리포트 렌더러 UI/UX 설계

### 5.1 전체 구조

```
┌─────────────────────────────────────────────────────────────┐
│                      PPG 리포트 헤더                           │
│  - 개인정보, 측정일시, 신호품질, 분석엔진 정보                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    3대 건강 지표 대시보드                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ 스트레스건강도 │ │ 자율신경균형  │ │  심박변이도   │           │
│  │    85점     │ │    72점      │ │    78점      │           │
│  │    우수     │ │  약간 교감우세 │ │    양호      │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                   종합 건강 점수: 78점                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 스트레스 건강도 상세 분석                       │
│  - 스트레스 지수 시각화 (게이지 차트)                           │
│  - 정상 범위 표시 및 현재 위치                                │
│  - 일상생활 영향도 설명                                       │
│  - 개선 권장사항                                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  자율신경 균형 상세 분석                        │
│  - LF/HF 비율 시각화 (균형 막대 차트)                          │
│  - 교감/부교감 신경 활성도 비교                               │
│  - 시간대별 변화 패턴                                        │
│  - 균형 개선 방법                                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  심박변이도(HRV) 상세 분석                     │
│  - SDNN, RMSSD 등 주요 지표 카드                            │
│  - 연령/성별 대비 비교 차트                                   │
│  - 신체 적응력 평가                                          │
│  - HRV 향상 운동법                                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     보조 건강 지표                            │
│  - 심장 리듬 일관성 (Coherence Ratio)                        │
│  - 회복 지수 (Recovery Index)                               │
│  - 활력도 점수 (Vitality Score)                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   종합 건강 평가 및 권장사항                    │
│  - 주요 우려사항과 강점                                       │
│  - 즉시 실천 사항                                           │
│  - 중장기 건강 관리 계획                                      │
│  - 맞춤형 라이프스타일 가이드                                 │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 주요 UI 컴포넌트

#### 5.2.1 3대 건강 지표 대시보드
```tsx
const ThreeDimensionDashboard: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 스트레스 건강도 카드 */}
        <Card className="border-l-4 border-l-blue-500 shadow-xl hover:shadow-2xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-blue-600" />
                <h3 className="text-xl font-bold">스트레스 건강도</h3>
              </div>
              <Badge className={getScoreBadgeClass(data.stress.score)}>
                {data.stress.level}
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">
                {data.stress.score}
              </div>
              <div className="text-sm text-gray-600">
                스트레스 지수: {data.stress.evidence.stressIndex}
              </div>
            </div>
            <Progress value={data.stress.score} className="mt-4" />
          </CardContent>
        </Card>

        {/* 자율신경 균형 카드 */}
        <Card className="border-l-4 border-l-green-500 shadow-xl hover:shadow-2xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-green-600" />
                <h3 className="text-xl font-bold">자율신경 균형</h3>
              </div>
              <Badge className={getScoreBadgeClass(data.autonomic.score)}>
                {data.autonomic.level}
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-green-600 mb-2">
                {data.autonomic.score}
              </div>
              <div className="text-sm text-gray-600">
                LF/HF: {data.autonomic.evidence.lfHfRatio}
              </div>
            </div>
            <AutonomicBalanceBar lfPower={data.autonomic.evidence.lfPower} 
                                hfPower={data.autonomic.evidence.hfPower} />
          </CardContent>
        </Card>

        {/* 심박변이도 카드 */}
        <Card className="border-l-4 border-l-purple-500 shadow-xl hover:shadow-2xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Heart className="w-8 h-8 text-purple-600" />
                <h3 className="text-xl font-bold">심박변이도</h3>
              </div>
              <Badge className={getScoreBadgeClass(data.hrv.score)}>
                {data.hrv.level}
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-purple-600 mb-2">
                {data.hrv.score}
              </div>
              <div className="text-sm text-gray-600">
                SDNN: {data.hrv.evidence.sdnn}ms
              </div>
            </div>
            <Progress value={data.hrv.score} className="mt-4" />
          </CardContent>
        </Card>
      </div>

      {/* 종합 점수 */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-6 text-center">
          <h3 className="text-2xl font-bold mb-2">종합 건강 점수</h3>
          <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            {Math.round((data.stress.score + data.autonomic.score + data.hrv.score) / 3)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
```

#### 5.2.2 스트레스 건강도 상세 분석
```tsx
const StressHealthDetail: React.FC<{ data: any }> = ({ data }) => {
  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-blue-600" />
          스트레스 건강도 상세 분석
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 스트레스 지수 게이지 */}
        <div className="flex justify-center">
          <GaugeChart 
            value={data.evidence.stressIndex}
            min={0}
            max={100}
            normalMin={30}
            normalMax={70}
            label="스트레스 지수"
            unit=""
          />
        </div>

        {/* 해석 */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h4 className="font-semibold mb-2">전문가 해석</h4>
          <p className="text-gray-700 leading-relaxed">
            {data.interpretation}
          </p>
        </div>

        {/* 근거 데이터 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded">
            <div className="text-sm text-gray-600">심박수 변동성</div>
            <div className="text-xl font-bold">{data.evidence.heartRateVariability}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <div className="text-sm text-gray-600">RMSSD</div>
            <div className="text-xl font-bold">{data.evidence.rmssd} ms</div>
          </div>
        </div>

        {/* 권장사항 */}
        <div>
          <h4 className="font-semibold mb-3">개선 권장사항</h4>
          <ul className="space-y-2">
            {data.recommendations.map((rec: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <span className="text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
```

### 5.3 색상 테마 및 스타일 가이드

- **3대 지표별 색상**:
  - 스트레스 건강도: Blue (#3b82f6)
  - 자율신경 균형: Green (#10b981)  
  - 심박변이도: Purple (#8b5cf6)

- **상태별 색상**:
  - 우수/균형: Green (#10b981)
  - 양호/약간 불균형: Blue (#3b82f6)
  - 주의/불균형: Yellow (#f59e0b)
  - 경계/심각: Red (#ef4444)

## 6. PPG-EEG 통합 분석 연계

### 6.1 3대 지표 기반 연계
- **스트레스**: EEG 스트레스 지수 + PPG 스트레스 건강도
- **자율신경**: EEG 이완 지수 + PPG 자율신경 균형
- **적응력**: EEG 집중도 + PPG 심박변이도

### 6.2 통합 건강 점수
- EEG 4대 지표 평균 + PPG 3대 지표 평균 → 종합 심신 건강 점수
- 상호 보완적 해석 제공
- 통합 권장사항 생성

## 7. 구현 우선순위

1. **Phase 1**: PPG 3대 지표 계산 함수 구현
2. **Phase 2**: Gemini 프롬프트 업데이트 (3대 지표 중심)
3. **Phase 3**: 3대 지표 대시보드 UI 구현
4. **Phase 4**: 각 지표별 상세 분석 컴포넌트
5. **Phase 5**: 통합 분석 및 최적화