# PPG 전문 HRV 시각화 및 분석 설계

## 1. 전문 HRV 분석 그래프 종류

### 1.1 Poincaré Plot (푸앵카레 도표)
연속된 RR 간격을 2차원 산점도로 표현하여 HRV의 단기/장기 변동성을 시각화

```tsx
interface PoincarePlotData {
  points: Array<{x: number, y: number}>; // RR(n) vs RR(n+1)
  sd1: number; // 단기 변동성 (Short-term variability)
  sd2: number; // 장기 변동성 (Long-term variability)
  ellipse: {
    center: {x: number, y: number};
    width: number;  // 2 * SD2
    height: number; // 2 * SD1
    rotation: number; // 45도
  };
}

const PoincarePlot: React.FC<{data: PoincarePlotData}> = ({data}) => {
  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScatterChart className="w-5 h-5 text-purple-600" />
          Poincaré Plot - HRV 패턴 분석
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 산점도 */}
          <div className="aspect-square">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="x" 
                  name="RR(n)" 
                  unit="ms"
                  domain={[400, 1200]}
                />
                <YAxis 
                  dataKey="y" 
                  name="RR(n+1)" 
                  unit="ms"
                  domain={[400, 1200]}
                />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter 
                  name="RR intervals" 
                  data={data.points} 
                  fill="#8b5cf6"
                  fillOpacity={0.6}
                />
                {/* 타원 오버레이 */}
                <ReferenceDot 
                  x={data.ellipse.center.x} 
                  y={data.ellipse.center.y}
                  r={0}
                  stroke="#ef4444"
                  strokeWidth={2}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          
          {/* 해석 패널 */}
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">HRV 패턴 지표</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                  <span className="text-sm font-medium">SD1 (단기 변동성)</span>
                  <span className="text-lg font-bold text-purple-600">{data.sd1.toFixed(1)} ms</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                  <span className="text-sm font-medium">SD2 (장기 변동성)</span>
                  <span className="text-lg font-bold text-blue-600">{data.sd2.toFixed(1)} ms</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm font-medium">SD2/SD1 비율</span>
                  <span className="text-lg font-bold">{(data.sd2/data.sd1).toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-medium mb-2">패턴 해석</h5>
              <p className="text-sm text-gray-700">
                {data.sd1 > 20 ? 
                  "단기 변동성이 양호하여 부교감신경 활성도가 건강합니다." :
                  "단기 변동성이 낮아 부교감신경 활성화가 필요합니다."}
                {" "}
                {data.sd2/data.sd1 > 1.5 ? 
                  "장기 변동성이 우세하여 전반적인 적응력이 좋습니다." :
                  "장단기 변동성의 균형 개선이 필요합니다."}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

### 1.2 HRV Frequency Spectrum (주파수 스펙트럼)
파워 스펙트럼 밀도(PSD) 분석을 통한 자율신경계 활성도 시각화

```tsx
interface FrequencySpectrumData {
  spectrum: Array<{
    frequency: number;
    power: number;
    band: 'VLF' | 'LF' | 'HF';
  }>;
  bandPowers: {
    vlf: {power: number; percentage: number};
    lf: {power: number; percentage: number};
    hf: {power: number; percentage: number};
    totalPower: number;
  };
}

const HRVFrequencySpectrum: React.FC<{data: FrequencySpectrumData}> = ({data}) => {
  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-green-600" />
          HRV 주파수 스펙트럼 분석
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* 스펙트럼 그래프 */}
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.spectrum}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="frequency" 
                label={{ value: '주파수 (Hz)', position: 'insideBottom', offset: -5 }}
                domain={[0, 0.4]}
              />
              <YAxis 
                label={{ value: '파워 (ms²/Hz)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip />
              <defs>
                <linearGradient id="vlfGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="lfGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="hfGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="power" 
                stroke="#8b5cf6" 
                fillOpacity={1}
                fill="url(#lfGradient)"
              />
              {/* 주파수 대역 구분선 */}
              <ReferenceLine x={0.04} stroke="#dc2626" strokeDasharray="5 5" />
              <ReferenceLine x={0.15} stroke="#3b82f6" strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>

          {/* 주파수 대역별 분석 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-sm font-medium text-red-700">VLF (0.003-0.04 Hz)</div>
              <div className="text-2xl font-bold text-red-600 mt-2">
                {data.bandPowers.vlf.power.toFixed(0)} ms²
              </div>
              <div className="text-sm text-red-600">
                {data.bandPowers.vlf.percentage.toFixed(1)}%
              </div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-700">LF (0.04-0.15 Hz)</div>
              <div className="text-2xl font-bold text-blue-600 mt-2">
                {data.bandPowers.lf.power.toFixed(0)} ms²
              </div>
              <div className="text-sm text-blue-600">
                {data.bandPowers.lf.percentage.toFixed(1)}%
              </div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-sm font-medium text-green-700">HF (0.15-0.4 Hz)</div>
              <div className="text-2xl font-bold text-green-600 mt-2">
                {data.bandPowers.hf.power.toFixed(0)} ms²
              </div>
              <div className="text-sm text-green-600">
                {data.bandPowers.hf.percentage.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* 자율신경 균형 바 */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">교감신경 (LF)</span>
              <span className="text-sm font-medium">부교감신경 (HF)</span>
            </div>
            <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="absolute h-full bg-blue-500"
                style={{ width: `${data.bandPowers.lf.percentage}%` }}
              />
              <div 
                className="absolute h-full bg-green-500"
                style={{ 
                  left: `${data.bandPowers.lf.percentage}%`,
                  width: `${data.bandPowers.hf.percentage}%` 
                }}
              />
            </div>
            <div className="text-center mt-2">
              <span className="text-lg font-bold">
                LF/HF 비율: {(data.bandPowers.lf.power / data.bandPowers.hf.power).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

### 1.3 RR Interval Tachogram (RR 간격 시계열)
시간에 따른 심박 간격 변화를 보여주는 기본적이면서도 중요한 그래프

```tsx
interface TachogramData {
  intervals: Array<{
    time: number;      // 초
    rrInterval: number; // ms
    heartRate: number;  // bpm
  }>;
  statistics: {
    meanRR: number;
    sdnn: number;
    rmssd: number;
    nn50: number;
    pnn50: number;
  };
}

const RRIntervalTachogram: React.FC<{data: TachogramData}> = ({data}) => {
  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          RR Interval Tachogram - 심박 간격 변화
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* RR 간격 그래프 */}
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.intervals}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                label={{ value: '시간 (초)', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                yAxisId="rr"
                orientation="left"
                label={{ value: 'RR 간격 (ms)', angle: -90, position: 'insideLeft' }}
                domain={[400, 1200]}
              />
              <YAxis 
                yAxisId="hr"
                orientation="right"
                label={{ value: '심박수 (bpm)', angle: 90, position: 'insideRight' }}
                domain={[50, 150]}
              />
              <Tooltip />
              <Line 
                yAxisId="rr"
                type="monotone" 
                dataKey="rrInterval" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={false}
                name="RR 간격"
              />
              <Line 
                yAxisId="hr"
                type="monotone" 
                dataKey="heartRate" 
                stroke="#ef4444" 
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name="심박수"
              />
              {/* 평균선 */}
              <ReferenceLine 
                yAxisId="rr"
                y={data.statistics.meanRR} 
                stroke="#10b981" 
                strokeDasharray="5 5"
                label="평균 RR"
              />
            </LineChart>
          </ResponsiveContainer>

          {/* 통계 지표 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gray-50 p-3 rounded text-center">
              <div className="text-xs text-gray-600">평균 RR</div>
              <div className="text-lg font-bold">{data.statistics.meanRR.toFixed(0)} ms</div>
            </div>
            <div className="bg-blue-50 p-3 rounded text-center">
              <div className="text-xs text-gray-600">SDNN</div>
              <div className="text-lg font-bold text-blue-600">{data.statistics.sdnn.toFixed(1)} ms</div>
            </div>
            <div className="bg-green-50 p-3 rounded text-center">
              <div className="text-xs text-gray-600">RMSSD</div>
              <div className="text-lg font-bold text-green-600">{data.statistics.rmssd.toFixed(1)} ms</div>
            </div>
            <div className="bg-purple-50 p-3 rounded text-center">
              <div className="text-xs text-gray-600">NN50</div>
              <div className="text-lg font-bold text-purple-600">{data.statistics.nn50}</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded text-center">
              <div className="text-xs text-gray-600">pNN50</div>
              <div className="text-lg font-bold text-yellow-600">{data.statistics.pnn50.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

### 1.4 HRV Time Domain Histogram (시간 영역 히스토그램)
RR 간격의 분포를 보여주는 히스토그램

```tsx
interface HRVHistogramData {
  distribution: Array<{
    range: string;    // "600-650ms"
    count: number;
    percentage: number;
  }>;
  normalCurve: Array<{
    x: number;
    y: number;
  }>;
  statistics: {
    mean: number;
    std: number;
    skewness: number;
    kurtosis: number;
  };
}

const HRVHistogram: React.FC<{data: HRVHistogramData}> = ({data}) => {
  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart className="w-5 h-5 text-purple-600" />
          HRV 분포 히스토그램
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* 히스토그램 */}
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data.distribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="range" 
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                yAxisId="count"
                orientation="left"
                label={{ value: '빈도', angle: -90, position: 'insideLeft' }}
              />
              <YAxis 
                yAxisId="curve"
                orientation="right"
                hide
              />
              <Tooltip />
              <Bar 
                yAxisId="count"
                dataKey="count" 
                fill="#8b5cf6"
                fillOpacity={0.7}
                name="RR 간격 분포"
              />
              <Line 
                yAxisId="curve"
                type="monotone"
                data={data.normalCurve}
                dataKey="y"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                name="정규분포 곡선"
              />
            </ComposedChart>
          </ResponsiveContainer>

          {/* 분포 특성 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-xs text-gray-600">평균</div>
              <div className="text-lg font-bold text-blue-600">
                {data.statistics.mean.toFixed(0)} ms
              </div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="text-xs text-gray-600">표준편차</div>
              <div className="text-lg font-bold text-green-600">
                {data.statistics.std.toFixed(1)} ms
              </div>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <div className="text-xs text-gray-600">왜도</div>
              <div className="text-lg font-bold text-purple-600">
                {data.statistics.skewness.toFixed(2)}
              </div>
            </div>
            <div className="bg-yellow-50 p-3 rounded">
              <div className="text-xs text-gray-600">첨도</div>
              <div className="text-lg font-bold text-yellow-600">
                {data.statistics.kurtosis.toFixed(2)}
              </div>
            </div>
          </div>

          {/* 해석 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium mb-2">분포 해석</h5>
            <p className="text-sm text-gray-700">
              {data.statistics.skewness > 0.5 ? 
                "분포가 오른쪽으로 치우쳐 있어 간헐적인 긴 RR 간격이 나타납니다." :
                data.statistics.skewness < -0.5 ?
                "분포가 왼쪽으로 치우쳐 있어 간헐적인 짧은 RR 간격이 나타납니다." :
                "분포가 대칭적이어서 안정적인 심박 패턴을 보입니다."}
              {" "}
              {data.statistics.kurtosis > 3 ?
                "첨도가 높아 RR 간격이 평균 주변에 집중되어 있습니다." :
                "첨도가 정상 범위로 다양한 RR 간격 변동을 보입니다."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

### 1.5 Detrended Fluctuation Analysis (DFA)
심박변이의 프랙탈 특성을 분석하는 고급 기법

```tsx
interface DFAData {
  alpha1: number;  // 단기 스케일링 지수 (4-16 beats)
  alpha2: number;  // 장기 스케일링 지수 (16-64 beats)
  plotData: Array<{
    logN: number;
    logF: number;
  }>;
}

const DFAAnalysis: React.FC<{data: DFAData}> = ({data}) => {
  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-orange-600" />
          DFA (Detrended Fluctuation Analysis)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* DFA 플롯 */}
          <div>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="logN" 
                  name="log(n)"
                  label={{ value: 'log(n)', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  dataKey="logF"
                  name="log(F(n))"
                  label={{ value: 'log(F(n))', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter 
                  name="DFA" 
                  data={data.plotData} 
                  fill="#f97316"
                />
                {/* 회귀선 추가 */}
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* DFA 지수 해석 */}
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-3">프랙탈 스케일링 지수</h4>
              
              <div className="space-y-3">
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">α1 (단기)</span>
                    <span className="text-xl font-bold text-orange-600">
                      {data.alpha1.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    정상범위: 0.5 - 1.5
                  </div>
                  <Progress 
                    value={(data.alpha1 / 1.5) * 100} 
                    className="mt-2"
                  />
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">α2 (장기)</span>
                    <span className="text-xl font-bold text-blue-600">
                      {data.alpha2.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    정상범위: 0.7 - 1.3
                  </div>
                  <Progress 
                    value={(data.alpha2 / 1.3) * 100} 
                    className="mt-2"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-medium mb-2">임상적 의미</h5>
              <div className="text-sm text-gray-700 space-y-2">
                <p>
                  <strong>α1 = {data.alpha1.toFixed(2)}:</strong>
                  {data.alpha1 < 0.5 ? " 과도한 무작위성, 심장 조절 기능 저하" :
                   data.alpha1 > 1.5 ? " 과도한 규칙성, 적응력 감소" :
                   " 정상적인 프랙탈 특성"}
                </p>
                <p>
                  <strong>α2 = {data.alpha2.toFixed(2)}:</strong>
                  {data.alpha2 < 0.7 ? " 장기 상관관계 약화" :
                   data.alpha2 > 1.3 ? " 과도한 장기 의존성" :
                   " 건강한 장기 변동성"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

## 2. PPG 리포트에 전문 HRV 분석 통합

### 2.1 리포트 구조 업데이트

```
┌─────────────────────────────────────────────────────────────┐
│                      PPG 리포트 헤더                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    3대 건강 지표 대시보드                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    전문 HRV 분석 섹션                          │
│  ┌─────────────────────────┐ ┌─────────────────────────┐    │
│  │    Poincaré Plot        │ │   Frequency Spectrum    │    │
│  └─────────────────────────┘ └─────────────────────────┘    │
│  ┌─────────────────────────┐ ┌─────────────────────────┐    │
│  │    RR Tachogram         │ │    HRV Histogram        │    │
│  └─────────────────────────┘ └─────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              DFA Analysis (고급)                      │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  3대 지표 상세 분석                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   종합 건강 평가                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 전문 HRV 섹션 컴포넌트

```tsx
const ProfessionalHRVSection: React.FC<{data: PPGAnalysisData}> = ({data}) => {
  const [selectedView, setSelectedView] = useState<'basic' | 'advanced'>('basic');
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">전문 HRV 분석</h2>
        <div className="flex gap-2">
          <Button
            variant={selectedView === 'basic' ? 'default' : 'outline'}
            onClick={() => setSelectedView('basic')}
          >
            기본 분석
          </Button>
          <Button
            variant={selectedView === 'advanced' ? 'default' : 'outline'}
            onClick={() => setSelectedView('advanced')}
          >
            고급 분석
          </Button>
        </div>
      </div>

      {selectedView === 'basic' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PoincarePlot data={data.poincarePlot} />
          <HRVFrequencySpectrum data={data.frequencySpectrum} />
          <RRIntervalTachogram data={data.tachogram} />
          <HRVHistogram data={data.histogram} />
        </div>
      ) : (
        <div className="space-y-6">
          <DFAAnalysis data={data.dfa} />
          {/* 추가 고급 분석들 */}
        </div>
      )}
      
      {/* 전문가 해석 섹션 */}
      <Card className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle>전문가 HRV 종합 해석</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">
              {data.professionalInterpretation}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
```

## 3. 데이터 변환 및 계산

### 3.1 Poincaré Plot 계산

```typescript
function calculatePoincarePlot(rrIntervals: number[]): PoincarePlotData {
  const points = [];
  for (let i = 0; i < rrIntervals.length - 1; i++) {
    points.push({
      x: rrIntervals[i],
      y: rrIntervals[i + 1]
    });
  }
  
  // SD1, SD2 계산
  const diffs = [];
  const sums = [];
  for (let i = 0; i < rrIntervals.length - 1; i++) {
    diffs.push(rrIntervals[i + 1] - rrIntervals[i]);
    sums.push(rrIntervals[i + 1] + rrIntervals[i]);
  }
  
  const sd1 = Math.sqrt(variance(diffs) / 2);
  const sd2 = Math.sqrt(2 * variance(rrIntervals) - variance(diffs) / 2);
  
  return {
    points,
    sd1,
    sd2,
    ellipse: {
      center: { x: mean(rrIntervals), y: mean(rrIntervals) },
      width: 2 * sd2,
      height: 2 * sd1,
      rotation: 45
    }
  };
}
```

### 3.2 주파수 스펙트럼 계산

```typescript
function calculateFrequencySpectrum(rrIntervals: number[]): FrequencySpectrumData {
  // FFT를 사용한 파워 스펙트럼 계산
  const spectrum = performFFT(rrIntervals);
  
  // 주파수 대역별 파워 계산
  const vlfPower = integratePower(spectrum, 0.003, 0.04);
  const lfPower = integratePower(spectrum, 0.04, 0.15);
  const hfPower = integratePower(spectrum, 0.15, 0.4);
  const totalPower = vlfPower + lfPower + hfPower;
  
  return {
    spectrum: spectrum.map(s => ({
      frequency: s.frequency,
      power: s.power,
      band: s.frequency < 0.04 ? 'VLF' : 
            s.frequency < 0.15 ? 'LF' : 'HF'
    })),
    bandPowers: {
      vlf: { 
        power: vlfPower, 
        percentage: (vlfPower / totalPower) * 100 
      },
      lf: { 
        power: lfPower, 
        percentage: (lfPower / totalPower) * 100 
      },
      hf: { 
        power: hfPower, 
        percentage: (hfPower / totalPower) * 100 
      },
      totalPower
    }
  };
}
```

## 4. Gemini 프롬프트 업데이트

전문 HRV 분석 결과를 포함하도록 프롬프트 확장:

```typescript
# 전문 HRV 분석 데이터

## Poincaré Plot 분석
- SD1: ${sd1.toFixed(1)} ms (단기 변동성)
- SD2: ${sd2.toFixed(1)} ms (장기 변동성)
- SD2/SD1 비율: ${(sd2/sd1).toFixed(2)}

## 주파수 스펙트럼 분석
- VLF Power: ${vlfPower.toFixed(0)} ms² (${vlfPercentage.toFixed(1)}%)
- LF Power: ${lfPower.toFixed(0)} ms² (${lfPercentage.toFixed(1)}%)
- HF Power: ${hfPower.toFixed(0)} ms² (${hfPercentage.toFixed(1)}%)
- Total Power: ${totalPower.toFixed(0)} ms²

## DFA 분석 (프랙탈 특성)
- α1 (단기): ${alpha1.toFixed(2)}
- α2 (장기): ${alpha2.toFixed(2)}

이러한 전문적인 HRV 분석 결과를 바탕으로 심도 있는 해석을 제공해주세요.
특히 각 그래프가 나타내는 생리학적 의미와 건강 상태를 상세히 설명해주세요.
```

## 5. RR Interval 저장 및 활용 방안

### 5.1 현재 상황 분석

현재 PPGSignalProcessor.ts에서 RR intervals를 계산하지만, ppgTimeSeriesStats에 저장되지 않고 있습니다. 전문 HRV 시각화를 위해서는 이를 개선해야 합니다.

### 5.2 RR Interval 저장 구조 제안

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
  hrvFrequencyMetrics: {
    lfPower: number;
    hfPower: number;
    lfHfRatio: number;
    stressIndex: number;
  };
  
  // 🔧 RR Interval 데이터 추가
  rrIntervals: {
    values: number[];          // 원시 RR 간격 배열 (ms)
    timestamps: number[];      // 각 RR 간격의 시간 정보
    statistics: PPGStatistics; // RR 간격의 통계값
    quality: {
      artifactCount: number;   // 아티팩트 수
      validIntervals: number;  // 유효한 간격 수
      coverage: number;        // 데이터 커버리지 (0-1)
    };
  };
}
```

### 5.3 구현 우선순위

#### Phase 1: RR Interval 저장 (필수)
1. PPGSignalProcessor의 RR intervals를 ppgTimeSeriesStats에 포함
2. AnalysisPipelineOrchestrator에서 RR intervals 전달 확인
3. PPGAdvancedGeminiEngine이 RR intervals 접근 가능하도록 수정

#### Phase 2: 기본 HRV 시각화 (핵심)
1. Poincaré Plot - 가장 직관적인 HRV 패턴 시각화
2. RR Interval Tachogram - 시간에 따른 변화 추적
3. HRV Frequency Spectrum - 자율신경계 분석

#### Phase 3: 고급 HRV 분석 (선택)
1. HRV Distribution Histogram
2. DFA (Detrended Fluctuation Analysis)
3. 추가 고급 분석 기법들

### 5.4 데이터 흐름 개선

```
PPGSignalProcessor
    ↓ (RR intervals 계산)
ppgTimeSeriesStats
    ↓ (RR intervals 포함)
AnalysisPipelineOrchestrator  
    ↓ (전체 데이터 전달)
PPGAdvancedGeminiEngine
    ↓ (RR intervals 활용)
PPGAdvancedReactRenderer
    ↓ (전문 HRV 시각화)
사용자 리포트
```

### 5.5 메모리 및 성능 고려사항

1. **데이터 크기**: 5분 측정 시 약 300개의 RR intervals (약 2.4KB)
2. **저장 전략**: 
   - 단기 분석: 전체 RR intervals 저장
   - 장기 저장: 통계값과 주요 특징만 저장
3. **시각화 최적화**:
   - Canvas 기반 렌더링 고려 (많은 데이터 포인트)
   - 점진적 렌더링으로 초기 로딩 개선

## 6. 기대 효과

1. **전문성 향상**: 의료 전문가들도 인정할 수 있는 수준의 HRV 분석
2. **시각적 이해도**: 복잡한 HRV 데이터를 직관적으로 이해 가능
3. **깊이 있는 통찰**: 단순 수치를 넘어 패턴과 관계성 파악
4. **맞춤형 권장사항**: 개인의 HRV 패턴에 기반한 구체적 조언
5. **과학적 신뢰성**: 검증된 HRV 분석 방법론 사용

## 7. 결론

RR intervals를 저장하지 않는 현재 상황은 전문 HRV 시각화 구현에 제약이 됩니다. 하지만 PPGSignalProcessor에서 이미 계산하고 있으므로, 데이터 구조를 확장하여 저장하는 것은 비교적 간단한 작업입니다. 

권장사항:
1. **즉시 구현**: RR intervals 저장 구조 추가
2. **단계적 구현**: 기본 시각화부터 시작하여 점진적 확장
3. **성능 최적화**: 대용량 데이터 처리를 위한 최적화 고려