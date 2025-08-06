# PPG 고급 분석 시스템 설계서

## 1. 개요

PPG(Photoplethysmography) 분석을 EEG와 동일한 수준의 상세함과 전문성으로 제공하기 위한 시스템 설계서입니다.

## 2. PPG 데이터 구조 및 통계 분석

### 2.1 PPG 통계 데이터 구조 (ppgDataTransformer.ts)

```typescript
export interface PPGStatistics {
  mean: number;
  std: number;
  min: number;
  max: number;
  median?: number;
  percentile25?: number;
  percentile75?: number;
}

export interface HeartRateStats {
  restingHR: PPGStatistics;
  activeHR: PPGStatistics;
  recoveryHR: PPGStatistics;
  circadianPattern?: {
    morning: PPGStatistics;
    afternoon: PPGStatistics;
    evening: PPGStatistics;
    night: PPGStatistics;
  };
}

export interface HRVTimeMetrics {
  sdnn: PPGStatistics;     // 전체 RR 간격의 표준편차
  rmssd: PPGStatistics;    // 연속 RR 간격 차이의 제곱평균제곱근
  pnn50: PPGStatistics;    // 50ms 이상 차이나는 RR 간격의 비율
  pnn20: PPGStatistics;    // 20ms 이상 차이나는 RR 간격의 비율
  sdsd: PPGStatistics;     // 연속 RR 간격 차이의 표준편차
  triangularIndex: PPGStatistics; // HRV 삼각 지수
}

export interface HRVFrequencyMetrics {
  vlf: PPGStatistics;      // 매우 낮은 주파수 (0.003-0.04 Hz)
  lf: PPGStatistics;       // 낮은 주파수 (0.04-0.15 Hz)
  hf: PPGStatistics;       // 높은 주파수 (0.15-0.4 Hz)
  totalPower: PPGStatistics;
  lfHfRatio: PPGStatistics;
  lfNormalized: PPGStatistics;
  hfNormalized: PPGStatistics;
}

export interface BloodPressureEstimates {
  systolic: PPGStatistics;
  diastolic: PPGStatistics;
  meanArterialPressure: PPGStatistics;
  pulsePresure: PPGStatistics;
}

export interface VascularIndices {
  arterialStiffness: PPGStatistics;
  reflectionIndex: PPGStatistics;
  augmentationIndex: PPGStatistics;
  pwv: PPGStatistics; // Pulse Wave Velocity
}

export interface TransformedPPGData {
  heartRateStats: HeartRateStats;
  hrvTimeMetrics: HRVTimeMetrics;
  hrvFrequencyMetrics: HRVFrequencyMetrics;
  bloodPressureEstimates?: BloodPressureEstimates;
  vascularIndices?: VascularIndices;
  qualityMetrics: {
    signalQuality: number;
    motionArtifacts: number;
    measurementDuration: number;
    dataCompleteness: number;
  };
}
```

### 2.2 정상 범위 정의

```typescript
export const PPG_NORMAL_RANGES = {
  heartRate: {
    resting: { min: 60, max: 100, unit: 'bpm', description: '안정시 심박수' },
    active: { min: 100, max: 170, unit: 'bpm', description: '활동시 심박수' },
    recovery: { min: 60, max: 120, unit: 'bpm', description: '회복기 심박수' }
  },
  hrvTime: {
    sdnn: { min: 30, max: 100, unit: 'ms', description: 'HRV 전체 변이성' },
    rmssd: { min: 20, max: 80, unit: 'ms', description: '부교감신경 활성' },
    pnn50: { min: 5, max: 50, unit: '%', description: 'HRV 복잡성' },
    pnn20: { min: 20, max: 70, unit: '%', description: 'HRV 민감도' }
  },
  hrvFrequency: {
    lf: { min: 200, max: 1200, unit: 'ms²', description: '교감신경 활성' },
    hf: { min: 200, max: 1200, unit: 'ms²', description: '부교감신경 활성' },
    lfHfRatio: { min: 0.5, max: 2.0, description: '자율신경 균형' },
    totalPower: { min: 1000, max: 5000, unit: 'ms²', description: '전체 자율신경 활성' }
  },
  bloodPressure: {
    systolic: { min: 90, max: 120, unit: 'mmHg', description: '수축기 혈압' },
    diastolic: { min: 60, max: 80, unit: 'mmHg', description: '이완기 혈압' },
    map: { min: 70, max: 100, unit: 'mmHg', description: '평균 동맥압' }
  },
  vascular: {
    arterialStiffness: { min: 5, max: 10, unit: 'm/s', description: '동맥 경직도' },
    reflectionIndex: { min: 20, max: 60, unit: '%', description: '혈관 반사 지수' },
    augmentationIndex: { min: -10, max: 30, unit: '%', description: '증강 지수' }
  }
};
```

## 3. PPG 전문 분석 프롬프트 설계

### 3.1 4대 차원 분석 체계

EEG의 4대 차원과 유사하게 PPG도 4대 핵심 차원으로 분석:

1. **심혈관 건강도 (Cardiovascular Health)**
   - 심박수 패턴 분석
   - 혈압 추정치 평가
   - 혈관 탄성도 분석

2. **자율신경 균형 (Autonomic Balance)**
   - 교감/부교감 신경 활성도
   - HRV 시간/주파수 분석
   - 스트레스 반응성

3. **신체 회복력 (Physical Recovery)**
   - 운동 후 회복 패턴
   - 수면 중 HRV 변화
   - 일주기 리듬 분석

4. **대사 건강 (Metabolic Health)**
   - 혈류 패턴 분석
   - 산소포화도 변동성
   - 미세순환 평가

### 3.2 Gemini 프롬프트 템플릿

```typescript
const generatePPGAnalysisPrompt = (data: TransformedPPGData, personalInfo: PersonalInfo) => {
  const { age, gender, occupation } = personalInfo;
  
  return `
당신은 심혈관 및 자율신경계 전문의입니다. ${age}세 ${gender === 'male' ? '남성' : '여성'} ${occupation}의 PPG 측정 데이터를 분석하여 전문적이고 상세한 건강 평가를 제공해주세요.

# 개인 정보
- 연령: ${age}세
- 성별: ${gender === 'male' ? '남성' : '여성'}
- 직업: ${occupation}

# PPG 측정 데이터

## 심박수 통계
- 안정시 심박수: ${data.heartRateStats.restingHR.mean.toFixed(1)} ± ${data.heartRateStats.restingHR.std.toFixed(1)} bpm (정상: 60-100)
- 활동시 심박수: ${data.heartRateStats.activeHR.mean.toFixed(1)} ± ${data.heartRateStats.activeHR.std.toFixed(1)} bpm
- 회복기 심박수: ${data.heartRateStats.recoveryHR.mean.toFixed(1)} ± ${data.heartRateStats.recoveryHR.std.toFixed(1)} bpm

## HRV 시간 영역 분석
- SDNN: ${data.hrvTimeMetrics.sdnn.mean.toFixed(1)} ms (정상: 30-100)
- RMSSD: ${data.hrvTimeMetrics.rmssd.mean.toFixed(1)} ms (정상: 20-80)
- pNN50: ${data.hrvTimeMetrics.pnn50.mean.toFixed(1)}% (정상: 5-50)
- pNN20: ${data.hrvTimeMetrics.pnn20.mean.toFixed(1)}% (정상: 20-70)

## HRV 주파수 영역 분석
- LF Power: ${data.hrvFrequencyMetrics.lf.mean.toFixed(0)} ms² (정상: 200-1200)
- HF Power: ${data.hrvFrequencyMetrics.hf.mean.toFixed(0)} ms² (정상: 200-1200)
- LF/HF Ratio: ${data.hrvFrequencyMetrics.lfHfRatio.mean.toFixed(2)} (정상: 0.5-2.0)
- Total Power: ${data.hrvFrequencyMetrics.totalPower.mean.toFixed(0)} ms² (정상: 1000-5000)

## 혈압 추정치 (PPG 기반)
- 수축기 혈압: ${data.bloodPressureEstimates?.systolic.mean.toFixed(0)} mmHg (정상: 90-120)
- 이완기 혈압: ${data.bloodPressureEstimates?.diastolic.mean.toFixed(0)} mmHg (정상: 60-80)
- 평균 동맥압: ${data.bloodPressureEstimates?.meanArterialPressure.mean.toFixed(0)} mmHg (정상: 70-100)

## 혈관 건강 지표
- 동맥 경직도: ${data.vascularIndices?.arterialStiffness.mean.toFixed(1)} m/s (정상: 5-10)
- 반사 지수: ${data.vascularIndices?.reflectionIndex.mean.toFixed(1)}% (정상: 20-60)
- 증강 지수: ${data.vascularIndices?.augmentationIndex.mean.toFixed(1)}% (정상: -10-30)

## 측정 품질
- 신호 품질: ${(data.qualityMetrics.signalQuality * 100).toFixed(0)}%
- 모션 아티팩트: ${(data.qualityMetrics.motionArtifacts * 100).toFixed(0)}%
- 측정 시간: ${data.qualityMetrics.measurementDuration}초
- 데이터 완성도: ${(data.qualityMetrics.dataCompleteness * 100).toFixed(0)}%

# 분석 요청사항

다음 형식의 JSON으로 전문적이고 상세한 분석 결과를 제공해주세요:

{
  "fourDimensionAnalysis": {
    "cardiovascular": {
      "dimension": "심혈관 건강도",
      "level": "양호/주의/경계/위험 중 하나",
      "score": 0-100 사이의 점수,
      "interpretation": "${age}세 ${gender === 'male' ? '남성' : '여성'} ${occupation}의 심혈관 건강 상태에 대한 전문적 해석 (3-4문장)",
      "evidence": {
        "heartRatePattern": "심박수 패턴 분석 결과",
        "bloodPressure": "혈압 추정치 평가",
        "vascularHealth": "혈관 건강 지표 해석"
      },
      "clinicalSignificance": "normal/mild/moderate/severe 중 하나",
      "personalizedInterpretation": "${occupation} 직업 특성을 고려한 맞춤형 해석",
      "recommendations": ["구체적 권장사항 3-4개"]
    },
    "autonomic": {
      "dimension": "자율신경 균형",
      "level": "균형/약간 불균형/불균형/심각한 불균형 중 하나",
      "score": 0-100 사이의 점수,
      "interpretation": "교감/부교감 신경 균형 상태 전문 해석",
      "evidence": {
        "sympathetic": "교감신경 활성도 분석",
        "parasympathetic": "부교감신경 활성도 분석",
        "balance": "LF/HF 비율 해석"
      },
      "clinicalSignificance": "normal/mild/moderate/severe 중 하나",
      "personalizedInterpretation": "${age}세 연령과 ${occupation} 특성 고려 해석",
      "recommendations": ["자율신경 균형 개선 방안 3-4개"]
    },
    "recovery": {
      "dimension": "신체 회복력",
      "level": "우수/양호/보통/부족 중 하나",
      "score": 0-100 사이의 점수,
      "interpretation": "HRV와 회복 패턴 기반 회복력 평가",
      "evidence": {
        "hrvRecovery": "HRV 회복 패턴",
        "restingMetrics": "안정시 지표",
        "adaptability": "적응력 평가"
      },
      "clinicalSignificance": "normal/mild/moderate/severe 중 하나",
      "personalizedInterpretation": "${occupation} 활동 수준 고려 해석",
      "recommendations": ["회복력 향상 방안 3-4개"]
    },
    "metabolic": {
      "dimension": "대사 건강",
      "level": "건강/양호/주의/위험 중 하나",
      "score": 0-100 사이의 점수,
      "interpretation": "혈류 패턴과 대사 건강 상태 평가",
      "evidence": {
        "bloodFlow": "혈류 패턴 분석",
        "oxygenation": "산소포화도 변동성",
        "microcirculation": "미세순환 평가"
      },
      "clinicalSignificance": "normal/mild/moderate/severe 중 하나",
      "personalizedInterpretation": "${age}세 ${gender} 대사 특성 고려",
      "recommendations": ["대사 건강 개선 방안 3-4개"]
    }
  },
  "detailedDataAnalysis": {
    "heartRateAnalysis": {
      "restingHR": {
        "interpretation": "안정시 심박수 ${data.heartRateStats.restingHR.mean.toFixed(1)}bpm에 대한 상세 해석",
        "evidence": "생리학적 근거와 임상적 의미",
        "clinicalSignificance": "정상/경계/이상 판정과 그 이유"
      },
      "hrvPatterns": {
        "interpretation": "HRV 패턴 종합 분석",
        "evidence": "시간 및 주파수 영역 통합 해석",
        "clinicalSignificance": "자율신경계 건강 상태 평가"
      }
    },
    "bloodPressureAnalysis": {
      "systolicBP": {
        "interpretation": "수축기 혈압 추정치 해석",
        "evidence": "PPG 파형 분석 근거",
        "recommendations": "혈압 관리 권장사항"
      },
      "diastolicBP": {
        "interpretation": "이완기 혈압 추정치 해석",
        "evidence": "혈관 탄성도와의 연관성",
        "recommendations": "생활습관 개선 방안"
      }
    },
    "vascularHealthAnalysis": {
      "arterialStiffness": {
        "interpretation": "동맥 경직도 평가",
        "evidence": "PWV 및 반사파 분석",
        "ageRelatedAssessment": "${age}세 기준 평가"
      },
      "endothelialFunction": {
        "interpretation": "혈관 내피 기능 추정",
        "evidence": "PPG 파형 특성 분석",
        "riskAssessment": "심혈관 위험도 평가"
      }
    },
    "auxiliaryMetrics": {
      "stressIndex": {
        "value": ${data.hrvFrequencyMetrics.lfHfRatio.mean.toFixed(2)},
        "interpretation": "스트레스 지수에 대한 상세하고 전문적인 해석 (2-3문장)"
      },
      "fatigueIndex": {
        "value": ${(1 / data.hrvTimeMetrics.sdnn.mean * 100).toFixed(2)},
        "interpretation": "피로도 지수에 대한 생리학적 해석과 ${occupation} 직업 특성 고려 분석"
      },
      "cardiovascularAge": {
        "value": ${age + (data.vascularIndices?.arterialStiffness.mean || 7 - 7) * 2},
        "interpretation": "혈관 나이 추정치와 실제 나이(${age}세) 비교 분석"
      },
      "recoveryCapacity": {
        "value": ${data.hrvTimeMetrics.rmssd.mean.toFixed(1)},
        "interpretation": "회복 능력 지표(RMSSD)에 대한 전문적 해석과 개선 방안"
      }
    }
  },
  "comprehensiveAssessment": {
    "overallHealthScore": 0-100 사이의 종합 점수,
    "primaryConcerns": ["주요 건강 우려사항 3-5개"],
    "strengthAreas": ["건강한 부분 2-3개"],
    "riskFactors": {
      "cardiovascular": "심혈관 위험 요인 평가",
      "metabolic": "대사 위험 요인 평가",
      "stress": "스트레스 관련 위험 평가"
    },
    "recommendations": {
      "immediate": ["즉시 실천 가능한 권장사항 2-3개"],
      "shortTerm": ["1-3개월 내 개선 목표 2-3개"],
      "longTerm": ["장기적 건강 관리 방안 2-3개"],
      "lifestyle": {
        "exercise": "${occupation} 특성에 맞는 운동 권장사항",
        "diet": "심혈관 건강을 위한 식단 조언",
        "sleep": "수면과 회복 개선 방안",
        "stressManagement": "스트레스 관리 기법"
      }
    },
    "followUpSuggestions": {
      "timing": "다음 측정 권장 시기",
      "focusAreas": ["중점 모니터링 항목들"],
      "additionalTests": ["추가 검사 권장사항"]
    }
  },
  "metadata": {
    "analysisTimestamp": "분석 시간",
    "confidenceLevel": "high/medium/low",
    "dataQuality": "excellent/good/fair/poor",
    "limitations": ["분석의 한계점이나 주의사항"]
  }
}

## 주의사항:
1. 모든 해석은 ${age}세 ${gender === 'male' ? '남성' : '여성'} ${occupation}의 특성을 반영해야 합니다
2. 의학적 근거와 최신 연구 결과를 바탕으로 전문적인 해석을 제공하세요
3. PPG 측정의 한계를 인정하고 필요시 추가 검사를 권장하세요
4. 긍정적인 부분도 함께 강조하여 균형잡힌 평가를 제공하세요
`;
};
```

## 4. PPG 상세 리포트 렌더러 UI/UX 설계

### 4.1 전체 구조

```
┌─────────────────────────────────────────────────────────────┐
│                      PPG 리포트 헤더                           │
│  - 개인정보, 측정일시, 신호품질, 분석엔진 정보                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    4대 차원 대시보드                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │ 심혈관건강도  │ │ 자율신경균형  │ │  신체회복력   │ │  대사건강    ││
│  │    85점     │ │    72점      │ │    78점      │ │    81점     ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  심박수 패턴 시각화                            │
│  - 24시간 심박수 변화 그래프                                   │
│  - 안정시/활동시/회복시 구간 표시                               │
│  - 정상범위 오버레이                                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   HRV 상세 분석                              │
│  ┌─────────────────────┐ ┌─────────────────────┐            │
│  │   시간 영역 분석      │ │   주파수 영역 분석   │            │
│  │  - SDNN: 45.2ms     │ │  - LF: 523 ms²     │            │
│  │  - RMSSD: 38.7ms    │ │  - HF: 412 ms²     │            │
│  │  - pNN50: 23.5%     │ │  - LF/HF: 1.27     │            │
│  └─────────────────────┘ └─────────────────────┘            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  혈압 추정 및 혈관 건강                         │
│  - 수축기/이완기 혈압 추정치                                   │
│  - 동맥경직도 지표                                            │
│  - 혈관나이 추정                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   보조 건강 지표                              │
│  - 스트레스 지수                                             │
│  - 피로도 평가                                               │
│  - 회복 능력                                                │
│  - 수면 품질 추정                                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  종합 건강 평가                               │
│  - 전반적 건강 점수                                           │
│  - 주요 우려사항                                             │
│  - 강점 영역                                                │
│  - 개선 권장사항                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 주요 UI 컴포넌트 설계

#### 4.2.1 PPG 리포트 헤더
```tsx
const PPGReportHeader: React.FC<{ metadata: any }> = ({ metadata }) => {
  return (
    <div className="bg-gradient-to-r from-red-50 to-pink-50 p-8 rounded-xl border border-red-200 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-red-100 rounded-full shadow-md">
            <Heart className="w-10 h-10 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              PPG 심혈관 건강 분석 결과
            </h1>
            <div className="flex items-center gap-6 text-base text-gray-700">
              <span className="font-medium">{age}세 {gender}</span>
              {occupation && <span className="font-medium">• {occupation}</span>}
              <span>• 측정일: {measurementDate}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <Badge className="bg-red-600 text-white px-4 py-2 text-base font-medium">
            신호 품질: {signalQuality}%
          </Badge>
          <div className="text-sm text-gray-600 font-medium">
            분석 엔진: PPG Advanced v1.0
          </div>
        </div>
      </div>
    </div>
  );
};
```

#### 4.2.2 심박수 패턴 시각화
```tsx
const HeartRatePatternVisualization: React.FC<{ data: any }> = ({ data }) => {
  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle>심박수 패턴 분석</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={heartRateData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis domain={[40, 180]} />
            <Tooltip />
            <Legend />
            <ReferenceLine y={60} stroke="green" strokeDasharray="5 5" />
            <ReferenceLine y={100} stroke="green" strokeDasharray="5 5" />
            <Line 
              type="monotone" 
              dataKey="heartRate" 
              stroke="#ef4444" 
              strokeWidth={2}
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="normalRange"
              fill="green"
              fillOpacity={0.1}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
```

#### 4.2.3 HRV 상세 분석 카드
```tsx
const HRVDetailedAnalysis: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* 시간 영역 분석 */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            HRV 시간 영역 분석
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(data.timeDomain).map(([metric, value]) => (
              <div key={metric} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">{formatMetricName(metric)}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-blue-600">
                    {value.mean.toFixed(1)} {value.unit}
                  </span>
                  <StatusBadge status={value.status} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 주파수 영역 분석 */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            HRV 주파수 영역 분석
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* LF/HF 비율 시각화 */}
            <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="absolute h-full bg-blue-500"
                style={{ width: `${(lf / (lf + hf)) * 100}%` }}
              />
              <div 
                className="absolute h-full bg-purple-500"
                style={{ 
                  left: `${(lf / (lf + hf)) * 100}%`,
                  width: `${(hf / (lf + hf)) * 100}%` 
                }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span>LF (교감): {lf} ms²</span>
              <span>HF (부교감): {hf} ms²</span>
            </div>
            <div className="text-center">
              <span className="text-lg font-bold">
                LF/HF 비율: {lfHfRatio.toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
```

### 4.3 색상 테마 및 스타일 가이드

- **Primary Colors**: Red/Pink 계열 (심장/혈관 연상)
  - Primary: #ef4444 (red-500)
  - Secondary: #ec4899 (pink-500)
  - Background: red-50 to pink-50 gradient

- **Status Colors**: 
  - 정상: #10b981 (green-500)
  - 주의: #f59e0b (yellow-500)
  - 경계: #f97316 (orange-500)
  - 위험: #ef4444 (red-500)

- **Typography**:
  - 제목: text-3xl font-bold
  - 부제목: text-xl font-semibold
  - 본문: text-base
  - 수치: text-2xl font-bold

## 5. PPG-EEG 통합 분석 연계 방안

### 5.1 상호 보완적 분석
- EEG: 뇌 활동, 인지 기능, 정신 건강
- PPG: 심혈관 건강, 자율신경계, 신체 스트레스
- 통합: 심신 통합 건강 상태 평가

### 5.2 연계 지표
- EEG 스트레스 지수 ↔ PPG HRV 스트레스 지수
- EEG 이완 지수 ↔ PPG 부교감신경 활성도
- EEG 집중도 ↔ PPG 심박수 변동성
- EEG 감정 안정성 ↔ PPG 자율신경 균형

### 5.3 통합 리포트 섹션
- 심신 상관관계 분석
- 스트레스 반응 패턴
- 회복력 종합 평가
- 생활습관 통합 권장사항

## 6. 구현 로드맵

1. **Phase 1**: PPG 데이터 변환기 구현 (ppgDataTransformer.ts)
2. **Phase 2**: PPG 고급 Gemini 엔진 업데이트
3. **Phase 3**: PPG 상세 리포트 렌더러 구현
4. **Phase 4**: 통합 분석 기능 추가
5. **Phase 5**: 사용자 테스트 및 최적화