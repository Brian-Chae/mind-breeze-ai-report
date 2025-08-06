# PPG 기본 HRV 분석 설계 (1분 측정 전용)

## 1. 개요

1분 측정 데이터로 신뢰할 수 있는 기본 HRV 분석만 제공하는 실용적인 설계입니다.

## 2. 1분 측정에 적합한 3대 PPG 건강 지표

### 2.1 스트레스 건강도 (Stress Health)
- **핵심 지표**: 스트레스 지수 (심박수 변동성 기반)
- **계산**: RMSSD와 평균 심박수 활용
- **신뢰도**: 높음 (단기 측정에 적합)

### 2.2 자율신경 균형 (Autonomic Balance)
- **핵심 지표**: 심박수 패턴 분석
- **계산**: RMSSD/SDNN 비율 (주파수 분석 대신)
- **신뢰도**: 중간 (경향성 파악 가능)

### 2.3 심박변이도 (Heart Rate Variability)
- **핵심 지표**: RMSSD (단기 HRV의 표준)
- **계산**: 연속 RR 간격 차이의 제곱평균제곱근
- **신뢰도**: 높음 (1분 측정에 최적)

## 3. 기본 HRV 시각화 (1분 측정 최적화)

### 3.1 간소화된 주파수 스펙트럼 분석

```tsx
interface SimpleFrequencySpectrumData {
  lfPower: number;      // 교감신경 활성도
  hfPower: number;      // 부교감신경 활성도
  lfHfRatio: number;    // 자율신경 균형
  totalPower: number;   // 전체 파워
}

const SimpleFrequencySpectrum: React.FC<{data: SimpleFrequencySpectrumData}> = ({data}) => {
  const lfPercentage = (data.lfPower / (data.lfPower + data.hfPower)) * 100;
  const hfPercentage = (data.hfPower / (data.lfPower + data.hfPower)) * 100;
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-green-600" />
          자율신경 균형 분석
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* LF/HF 균형 막대 */}
        <div>
          <div className="flex justify-between mb-2 text-sm">
            <span className="font-medium">교감신경 (LF)</span>
            <span className="font-medium">부교감신경 (HF)</span>
          </div>
          <div className="relative h-12 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="absolute h-full bg-blue-500 flex items-center justify-center"
              style={{ width: `${lfPercentage}%` }}
            >
              {lfPercentage > 20 && (
                <span className="text-white font-medium text-sm">
                  {lfPercentage.toFixed(0)}%
                </span>
              )}
            </div>
            <div 
              className="absolute h-full bg-green-500 flex items-center justify-center"
              style={{ 
                left: `${lfPercentage}%`,
                width: `${hfPercentage}%` 
              }}
            >
              {hfPercentage > 20 && (
                <span className="text-white font-medium text-sm">
                  {hfPercentage.toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* 주요 지표 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded">
            <div className="text-xs text-gray-600">LF Power</div>
            <div className="text-lg font-bold text-blue-600">
              {data.lfPower.toFixed(0)}
            </div>
            <div className="text-xs text-gray-500">ms²</div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded">
            <div className="text-xs text-gray-600">HF Power</div>
            <div className="text-lg font-bold text-green-600">
              {data.hfPower.toFixed(0)}
            </div>
            <div className="text-xs text-gray-500">ms²</div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded">
            <div className="text-xs text-gray-600">LF/HF</div>
            <div className="text-lg font-bold text-purple-600">
              {data.lfHfRatio.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">ratio</div>
          </div>
        </div>
        
        {/* 해석 */}
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-sm text-gray-700">
            {data.lfHfRatio < 0.5 ? 
              "부교감신경이 우세한 상태입니다. 충분한 휴식 상태를 나타냅니다." :
              data.lfHfRatio > 2.0 ?
              "교감신경이 우세한 상태입니다. 스트레스나 긴장 상태일 수 있습니다." :
              "교감신경과 부교감신경이 균형잡힌 상태입니다."}
          </p>
        </div>
        
      </CardContent>
    </Card>
  );
};
```

### 3.2 간소화된 Poincaré Plot

```tsx
interface SimplePoincarePlotData {
  points: Array<{x: number, y: number}>; // 60-80개 포인트
  sd1: number;  // 단기 변동성 (신뢰도 높음)
  meanRR: number; // 중심점
  interpretation: 'stable' | 'variable' | 'irregular';
}

const SimplePoincarePlot: React.FC<{data: SimplePoincarePlotData}> = ({data}) => {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScatterChart className="w-5 h-5 text-purple-600" />
          심박 패턴 분석
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 산점도 - 포인트 크기 증가로 시각적 밀도 개선 */}
          <div className="aspect-square">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" name="RR(n)" unit="ms" />
                <YAxis dataKey="y" name="RR(n+1)" unit="ms" />
                <Tooltip />
                <Scatter 
                  data={data.points} 
                  fill="#8b5cf6"
                  fillOpacity={0.6}
                  r={4} // 큰 포인트 크기
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          
          {/* 해석 패널 */}
          <div className="space-y-4">
            <div className="p-4 bg-purple-50 rounded">
              <div className="text-sm text-gray-600 mb-1">단기 변동성 (SD1)</div>
              <div className="text-2xl font-bold text-purple-600">
                {data.sd1.toFixed(1)} ms
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {data.sd1 > 20 ? '양호' : '낮음'}
              </div>
            </div>
            
            <div className="text-sm text-gray-700">
              <p className="font-medium mb-1">패턴 해석:</p>
              <p>
                {data.interpretation === 'stable' && 
                  "안정적인 심박 패턴을 보이고 있습니다."}
                {data.interpretation === 'variable' && 
                  "건강한 심박 변동성을 보이고 있습니다."}
                {data.interpretation === 'irregular' && 
                  "불규칙한 패턴이 감지됩니다."}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

### 3.2 RR Interval 시계열 (1분)

```tsx
interface RRIntervalTimeSeriesData {
  intervals: Array<{
    time: number;      // 0-60초
    rrInterval: number; // ms
    heartRate: number;  // bpm
  }>;
  statistics: {
    meanRR: number;
    rmssd: number;
    minRR: number;
    maxRR: number;
  };
}

const RRIntervalTimeSeries: React.FC<{data: RRIntervalTimeSeriesData}> = ({data}) => {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          심박 간격 변화 (1분)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data.intervals}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="time" 
              label={{ value: '시간 (초)', position: 'insideBottom', offset: -5 }}
              domain={[0, 60]}
            />
            <YAxis 
              label={{ value: 'RR 간격 (ms)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="rrInterval" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ r: 2 }}
              animationDuration={300}
            />
            {/* 평균선 */}
            <ReferenceLine 
              y={data.statistics.meanRR} 
              stroke="#10b981" 
              strokeDasharray="5 5"
              label="평균"
            />
          </LineChart>
        </ResponsiveContainer>
        
        {/* 간단한 통계 */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-600">평균</div>
            <div className="font-bold">{data.statistics.meanRR.toFixed(0)}ms</div>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded">
            <div className="text-xs text-gray-600">RMSSD</div>
            <div className="font-bold text-blue-600">{data.statistics.rmssd.toFixed(1)}ms</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-600">최소</div>
            <div className="font-bold">{data.statistics.minRR.toFixed(0)}ms</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-600">최대</div>
            <div className="font-bold">{data.statistics.maxRR.toFixed(0)}ms</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

### 3.4 기본 HRV 대시보드

```tsx
const BasicHRVDashboard: React.FC<{data: PPGAnalysisData}> = ({data}) => {
  return (
    <div className="space-y-6">
      {/* 3대 건강 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="스트레스 건강도"
          value={data.stress.score}
          unit="점"
          status={data.stress.level}
          icon={<Brain className="w-6 h-6" />}
          color="blue"
        />
        <MetricCard
          title="자율신경 균형"
          value={data.autonomic.score}
          unit="점"
          status={data.autonomic.level}
          icon={<Activity className="w-6 h-6" />}
          color="green"
        />
        <MetricCard
          title="심박변이도"
          value={data.hrv.score}
          unit="점"
          status={data.hrv.level}
          icon={<Heart className="w-6 h-6" />}
          color="purple"
        />
      </div>
      
      {/* 기본 시각화 - 3종 */}
      <div className="space-y-6">
        {/* 주파수 분석 - 전체 너비 */}
        <SimpleFrequencySpectrum data={data.frequencySpectrum} />
        
        {/* RR 시계열과 Poincaré Plot - 2열 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RRIntervalTimeSeries data={data.rrTimeSeries} />
          <SimplePoincarePlot data={data.poincarePlot} />
        </div>
      </div>
      
    </div>
  );
};
```

## 4. 데이터 구조 (1분 측정 최적화)

```typescript
export interface PPGBasicAnalysisData {
  // 3대 건강 지표
  threeDimensionAnalysis: {
    stress: {
      score: number;
      level: string;
      evidence: {
        stressIndex: number;
        rmssd: number;
      };
    };
    autonomic: {
      score: number;
      level: string;
      evidence: {
        lfPower: number;
        hfPower: number;
        lfHfRatio: number; // 이미 사용 중인 LF/HF 비율
      };
    };
    hrv: {
      score: number;
      level: string;
      evidence: {
        rmssd: number;
        sdnn: number;
      };
    };
  };
  
  // 기본 시각화 데이터
  visualizations: {
    frequencySpectrum: SimpleFrequencySpectrumData; // 추가
    rrTimeSeries: RRIntervalTimeSeriesData;
    poincarePlot: SimplePoincarePlotData;
  };
  
  // 간단한 통계
  basicStats: {
    measurementDuration: number; // 60초
    totalHeartBeats: number;
    averageHeartRate: number;
    hrvMetrics: {
      rmssd: number;
      sdnn: number;
      meanRR: number;
    };
  };
}
```

## 5. Gemini 프롬프트 (1분 측정용 간소화)

```typescript
const generatePPGBasicAnalysisPrompt = (data: PPGTimeSeriesStats, personalInfo: PersonalInfo) => {
  return `
당신은 심박변이도 전문가입니다. 1분간 측정된 PPG 데이터를 분석하여 실용적인 건강 평가를 제공해주세요.

# 개인 정보
- 연령: ${personalInfo.age}세
- 성별: ${personalInfo.gender}
- 직업: ${personalInfo.occupation}

# PPG 측정 데이터
- 평균 심박수: ${data.heartRate.mean} bpm
- RMSSD: ${data.hrvTimeMetrics.rmssd} ms
- SDNN: ${data.hrvTimeMetrics.sdnn} ms  
- LF Power: ${data.hrvFrequencyMetrics.lfPower} ms²
- HF Power: ${data.hrvFrequencyMetrics.hfPower} ms²
- LF/HF Ratio: ${data.hrvFrequencyMetrics.lfHfRatio}
- 스트레스 지수: ${data.hrvFrequencyMetrics.stressIndex}

# 분석 요청
다음 3가지 건강 지표를 중심으로 전문적이고 실용적인 평가를 제공하세요:

1. 스트레스 건강도 (스트레스 지수와 RMSSD 기반)
2. 자율신경 균형 (LF/HF 비율 기반)
3. 심박변이도 (RMSSD와 SDNN 기반)

각 지표는 0-100점으로 평가하고, ${personalInfo.age}세 ${personalInfo.gender}의 특성을 고려하여 해석과 개선 방안을 제시하세요.
`;
};
```

## 6. 구현 우선순위

1. **즉시 구현**:
   - RR intervals 저장 (시각화용)
   - RMSSD 기반 3대 건강 지표 계산
   - 기본 시각화 3종:
     - 간소화된 주파수 스펙트럼 (LF/HF 시각화)
     - RR Interval 시계열
     - 간소화된 Poincaré Plot

2. **제외 항목**:
   - 상세 주파수 스펙트럼 (VLF 포함)
   - DFA 분석
   - 5분 측정 옵션
   - 복잡한 통계 분석

## 7. 장점

- **단순명료**: 사용자가 이해하기 쉬운 기본 지표만 제공
- **신뢰성**: 1분 측정에서도 정확한 RMSSD 기반 분석
- **실용성**: 이미 계산되는 LF/HF 데이터를 시각화로 활용
- **빠른 피드백**: 1분만에 건강 상태 체크 가능
- **직관적 UI**: 자율신경 균형을 시각적으로 즉시 파악
- **업계 표준**: 다른 HRV 분석 서비스들과 동일한 접근