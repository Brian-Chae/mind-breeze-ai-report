# 데이터 소스 표시 기능 사용 가이드

## 개요
측정 데이터가 실제 측정값인지 fallback(기본값)인지 구분하여 표시하는 기능입니다.

## 컴포넌트 구성

### 1. DataSourceIndicator
- 개별 값의 데이터 소스를 아이콘으로 표시
- 실제 측정값: ⚡ (초록색 번개 아이콘)
- 기본값: 🗄️ (회색 데이터베이스 아이콘)
- 툴팁으로 상세 정보 제공

### 2. ValueWithDataSource
- 값과 데이터 소스 표시를 함께 렌더링하는 래퍼 컴포넌트

## 사용 방법

### 1. Import 추가
```tsx
import { ValueWithDataSource } from './ValueWithDataSource';
```

### 2. 기존 테이블 셀 수정

기존 코드:
```tsx
<td className="text-center">{formatValue(eegData.deltaPower)}</td>
```

수정된 코드:
```tsx
<td className="text-center">
  <ValueWithDataSource
    value={eegData.deltaPower}
    metricName="Delta Power"
    metricType="eeg"
    formatValue={formatValue}
  />
</td>
```

### 3. 각 센서별 메트릭 타입
- EEG 센서: `metricType="eeg"`
- PPG 센서: `metricType="ppg"`
- ACC 센서: `metricType="acc"`

### 4. 메트릭 이름 매핑

#### EEG 메트릭
- deltaPower → "Delta Power"
- thetaPower → "Theta Power"
- alphaPower → "Alpha Power"
- betaPower → "Beta Power"
- gammaPower → "Gamma Power"
- totalPower → "Total Power"
- focusIndex → "Focus"
- relaxationIndex → "Arousal"
- stressIndex → "Stress Index"
- attentionLevel → "Attention Level"
- meditationLevel → "Meditation Level"
- hemisphericBalance → "Hemispheric Balance"
- cognitiveLoad → "Cognitive Load"
- emotionalStability → "Emotional Stability"
- signalQuality → "Signal Quality"
- artifactRatio → "Artifact Ratio"

#### PPG 메트릭
- heartRate → "BPM"
- hrv → "HRV (ms)"
- rmssd → "RMSSD"
- pnn50 → "PNN50"
- sdnn → "SDNN"
- vlfPower → "VLF Power"
- lfPower → "LF Power"
- hfPower → "HF Power"
- lfNorm → "LF Norm"
- hfNorm → "HF Norm"
- lfHfRatio → "LF/HF"
- totalPower → "Total Power"
- stressLevel → "Stress Level"
- recoveryIndex → "Recovery Index"
- autonomicBalance → "Autonomic Balance"
- cardiacCoherence → "Cardiac Coherence"
- respiratoryRate → "Respiratory Rate"
- oxygenSaturation → "SpO2"
- perfusionIndex → "Perfusion Index"
- vascularTone → "Vascular Tone"
- systolicBP → "Systolic BP"
- diastolicBP → "Diastolic BP"
- cardiacEfficiency → "Cardiac Efficiency"
- metabolicRate → "Metabolic Rate"
- avnn → "AVNN"
- pnn20 → "PNN20"
- sdsd → "SDSD"
- hrMax → "HR Max"
- hrMin → "HR Min"
- signalQuality → "PPG Signal Quality"
- motionArtifact → "Motion Artifact"

#### ACC 메트릭
- activityLevel → "Activity Level"
- movementIntensity → "Movement Intensity"
- posturalStability → "Postural Stability"
- activityState → "Activity State"
- stability → "Stability"
- intensity → "Intensity"
- balance → "Balance"
- averageMovement → "Average Movement"
- standardDeviationMovement → "Standard Deviation Movement"
- maxMovement → "Max Movement"

## 스타일링
- 아이콘은 값 오른쪽에 작게 표시됩니다
- 툴팁은 마우스 호버 시 나타납니다
- 색상 구분:
  - 실제 측정값: text-green-500
  - 기본값: text-gray-400

## 주의사항
1. metricName은 DEFAULT_VALUES 객체의 키와 정확히 일치해야 합니다
2. 새로운 메트릭 추가 시 DataSourceIndicator.tsx의 DEFAULT_VALUES 업데이트 필요
3. 성능을 위해 값 비교는 정확한 일치(===)를 사용합니다