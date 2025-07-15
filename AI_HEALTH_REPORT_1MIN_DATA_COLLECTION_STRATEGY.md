# AI Health Report 1분간 데이터 수집 및 집계 전략

## 🔍 현재 데이터 흐름 분석

### 전체 데이터 흐름 구조
```
Bluetooth → StreamProcessor → SignalProcessor → AnalysisMetricsService → 품질 기반 큐 시스템
```

### 핵심 발견사항
1. **AnalysisMetricsService**가 모든 분석 지표의 중앙 허브 역할
2. **품질 기반 큐 시스템**으로 SQI ≥ 80% 데이터만 저장
3. **실시간 Moving Average** 계산 시스템 완비
4. **120개 데이터 포인트** (약 2분간) 버퍼 유지

## 📊 데이터 수집 지점 매핑

### 1. EEG 분석 지표 (StreamProcessor.ts → AnalysisMetricsService)
```typescript
// 호출 위치: StreamProcessor.performAdvancedEEGProcessing()
await this.analysisMetricsService.processEEGAnalysisMetrics(
  processedEEGData: ProcessedEEGData,
  additionalIndices: {
    focusIndex, relaxationIndex, stressIndex,
    hemisphericBalance, cognitiveLoad, emotionalStability,
    attentionLevel, meditationLevel
  }
);

// 저장 위치: AnalysisMetricsService.eegQualityQueue[]
// 조건: currentSQI >= 80
// 데이터: totalPower, emotionalBalance, attention, cognitiveLoad,
//        focusIndex, relaxationIndex, stressIndex, hemisphericBalance,
//        emotionalStability, attentionLevel, meditationLevel
```

### 2. PPG 분석 지표 (StreamProcessor.ts → AnalysisMetricsService)
```typescript
// 호출 위치: StreamProcessor.performAdvancedPPGProcessing()
await this.analysisMetricsService.processPPGAnalysisMetrics(
  ppgAnalysisResult: {
    vitals: { heartRate, hrv, spo2 },
    advancedHRV: { sdnn, pnn50, lfPower, hfPower, lfHfRatio,
                   stressIndex, avnn, pnn20, sdsd, hrMax, hrMin }
  },
  timestamp, currentSQI, isQualityGood, rrIntervals
);

// 저장 위치: AnalysisMetricsService.ppgQualityQueue[]
// 조건: isQualityGood (SQI >= 80)
// 데이터: bpm, sdnn, rmssd, pnn50, lfPower, hfPower, lfHfRatio,
//        stressIndex, spo2, avnn, pnn20, sdsd, hrMax, hrMin
```

### 3. ACC 분석 지표 (StreamProcessor.ts → AnalysisMetricsService)
```typescript
// 호출 위치: StreamProcessor.performAdvancedACCProcessing()
await this.analysisMetricsService.processACCAnalysisMetrics(
  accAnalysisResult: {
    activity: { type, confidence, intensity },
    movement: { avgMovement, stdMovement, maxMovement },
    posture: { tiltAngle, stability, balance }
  },
  timestamp
);

// 저장 위치: AnalysisMetricsService.accQualityQueue[]
// 조건: signalQuality >= 80
// 데이터: activityState, intensity, stability, avgMovement, maxMovement
```

## 🎯 1분간 데이터 수집 핵심 전략

### 핵심 아이디어
**AnalysisMetricsService의 품질 큐에서 1분간 누적된 고품질 데이터를 집계하여 AI 모델에 전송**

### 데이터 집계 접근 방법

#### 방법 1: 큐 스냅샷 방식 (권장)
```typescript
// 1분 측정 시작 시 큐 상태 기록
const startSnapshot = {
  eegQueueLength: analysisMetricsService.getEEGQueueLength(),
  ppgQueueLength: analysisMetricsService.getPPGQueueLength(),
  accQueueLength: analysisMetricsService.getACCQueueLength()
};

// 1분 측정 완료 시 새로 추가된 데이터만 집계
const measurementData = analysisMetricsService.getDataSinceSnapshot(startSnapshot);
```

#### 방법 2: 시간 기반 필터링 방식
```typescript
// 1분간 timestamp 기반으로 데이터 필터링
const oneMinuteAgo = Date.now() - 60000;
const recentData = analysisMetricsService.getDataSinceTimestamp(oneMinuteAgo);
```

#### 방법 3: 전용 측정 세션 방식 (최종 권장)
```typescript
// 측정 시작 시 전용 큐 생성
const measurementSession = analysisMetricsService.startMeasurementSession();

// 1분간 전용 큐에 데이터 수집
// 측정 완료 시 전용 큐에서 집계
const aggregatedData = measurementSession.getAggregatedResults();
```

## 🔧 구현 계획

### Phase 1: AnalysisMetricsService 확장
```typescript
// src/domains/ai-report/services/AnalysisMetricsService.ts

export class AnalysisMetricsService {
  // 기존 큐들...
  private eegQualityQueue: Array<EEGQualityData> = [];
  private ppgQualityQueue: Array<PPGQualityData> = [];
  private accQualityQueue: Array<ACCQualityData> = [];
  
  // 🆕 측정 세션 관리
  private measurementSessions: Map<string, MeasurementSession> = new Map();
  
  /**
   * 1분 측정 세션 시작
   */
  startMeasurementSession(sessionId: string): MeasurementSession {
    const session = new MeasurementSession(sessionId);
    this.measurementSessions.set(sessionId, session);
    return session;
  }
  
  /**
   * 측정 세션 종료 및 집계
   */
  finalizeMeasurementSession(sessionId: string): AggregatedMeasurementData {
    const session = this.measurementSessions.get(sessionId);
    if (!session) throw new Error('Session not found');
    
    const aggregatedData = session.getAggregatedResults();
    this.measurementSessions.delete(sessionId);
    return aggregatedData;
  }
  
  /**
   * 현재 큐 상태 조회 (디버깅용)
   */
  getQueueStatus(): {
    eegQueue: { length: number; latestSQI: number };
    ppgQueue: { length: number; latestSQI: number };
    accQueue: { length: number; latestSignalQuality: number };
  } {
    return {
      eegQueue: {
        length: this.eegQualityQueue.length,
        latestSQI: this.eegQualityQueue[this.eegQualityQueue.length - 1]?.sqi || 0
      },
      ppgQueue: {
        length: this.ppgQualityQueue.length,
        latestSQI: this.ppgQualityQueue[this.ppgQualityQueue.length - 1]?.sqi || 0
      },
      accQueue: {
        length: this.accQualityQueue.length,
        latestSignalQuality: this.accQualityQueue[this.accQualityQueue.length - 1]?.signalQuality || 0
      }
    };
  }
}
```

### Phase 2: MeasurementSession 클래스 구현
```typescript
// src/domains/ai-report/utils/MeasurementSession.ts

export class MeasurementSession {
  private sessionId: string;
  private startTime: number;
  private endTime: number | null = null;
  
  // 측정 세션 전용 데이터 수집기
  private eegData: EEGQualityData[] = [];
  private ppgData: PPGQualityData[] = [];
  private accData: ACCQualityData[] = [];
  
  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.startTime = Date.now();
  }
  
  /**
   * EEG 데이터 추가 (품질 기준 통과 시에만)
   */
  addEEGData(data: EEGQualityData): void {
    if (this.isSessionActive() && data.sqi >= 80) {
      this.eegData.push(data);
    }
  }
  
  /**
   * PPG 데이터 추가 (품질 기준 통과 시에만)
   */
  addPPGData(data: PPGQualityData): void {
    if (this.isSessionActive() && data.sqi >= 80) {
      this.ppgData.push(data);
    }
  }
  
  /**
   * ACC 데이터 추가 (품질 기준 통과 시에만)
   */
  addACCData(data: ACCQualityData): void {
    if (this.isSessionActive() && data.signalQuality >= 80) {
      this.accData.push(data);
    }
  }
  
  /**
   * 1분간 수집된 데이터 집계
   */
  getAggregatedResults(): AggregatedMeasurementData {
    if (!this.endTime) {
      this.endTime = Date.now();
    }
    
    return {
      sessionId: this.sessionId,
      duration: this.endTime - this.startTime,
      eegSummary: this.aggregateEEGData(),
      ppgSummary: this.aggregatePPGData(),
      accSummary: this.aggregateACCData(),
      qualitySummary: this.calculateQualitySummary(),
      timestamp: this.endTime
    };
  }
  
  private aggregateEEGData(): EEGSummary {
    if (this.eegData.length === 0) {
      return this.getDefaultEEGSummary();
    }
    
    const validData = this.eegData.filter(d => this.isValidEEGData(d));
    if (validData.length === 0) {
      return this.getDefaultEEGSummary();
    }
    
    return {
      totalPower: this.calculateAverage(validData.map(d => d.totalPower)),
      emotionalBalance: this.calculateAverage(validData.map(d => d.emotionalBalance)),
      attention: this.calculateAverage(validData.map(d => d.attention)),
      cognitiveLoad: this.calculateAverage(validData.map(d => d.cognitiveLoad)),
      focusIndex: this.calculateAverage(validData.map(d => d.focusIndex)),
      relaxationIndex: this.calculateAverage(validData.map(d => d.relaxationIndex)),
      stressIndex: this.calculateAverage(validData.map(d => d.stressIndex)),
      hemisphericBalance: this.calculateAverage(validData.map(d => d.hemisphericBalance)),
      emotionalStability: this.calculateAverage(validData.map(d => d.emotionalStability)),
      attentionLevel: this.calculateAverage(validData.map(d => d.attentionLevel)),
      meditationLevel: this.calculateAverage(validData.map(d => d.meditationLevel)),
      sampleCount: validData.length,
      averageSQI: this.calculateAverage(validData.map(d => d.sqi))
    };
  }
  
  private aggregatePPGData(): PPGSummary {
    if (this.ppgData.length === 0) {
      return this.getDefaultPPGSummary();
    }
    
    const validData = this.ppgData.filter(d => this.isValidPPGData(d));
    if (validData.length === 0) {
      return this.getDefaultPPGSummary();
    }
    
    return {
      bpm: this.calculateAverage(validData.map(d => d.bpm)),
      sdnn: this.calculateAverage(validData.map(d => d.sdnn)),
      rmssd: this.calculateAverage(validData.map(d => d.rmssd)),
      pnn50: this.calculateAverage(validData.map(d => d.pnn50)),
      lfPower: this.calculateAverage(validData.map(d => d.lfPower)),
      hfPower: this.calculateAverage(validData.map(d => d.hfPower)),
      lfHfRatio: this.calculateAverage(validData.map(d => d.lfHfRatio)),
      stressIndex: this.calculateAverage(validData.map(d => d.stressIndex)),
      spo2: this.calculateAverage(validData.map(d => d.spo2)),
      avnn: this.calculateAverage(validData.map(d => d.avnn)),
      pnn20: this.calculateAverage(validData.map(d => d.pnn20)),
      sdsd: this.calculateAverage(validData.map(d => d.sdsd)),
      hrMax: Math.max(...validData.map(d => d.hrMax).filter(v => v > 0)),
      hrMin: Math.min(...validData.map(d => d.hrMin).filter(v => v > 0)),
      sampleCount: validData.length,
      averageSQI: this.calculateAverage(validData.map(d => d.sqi))
    };
  }
  
  private aggregateACCData(): ACCSummary {
    if (this.accData.length === 0) {
      return this.getDefaultACCSummary();
    }
    
    const validData = this.accData.filter(d => this.isValidACCData(d));
    if (validData.length === 0) {
      return this.getDefaultACCSummary();
    }
    
    // 가장 빈번한 활동 상태 계산
    const activityStates = validData.map(d => d.activityState);
    const activityMode = this.getMostFrequent(activityStates);
    
    return {
      activityState: activityMode,
      intensity: this.calculateAverage(validData.map(d => d.intensity)),
      stability: this.calculateAverage(validData.map(d => d.stability)),
      avgMovement: this.calculateAverage(validData.map(d => d.avgMovement)),
      maxMovement: Math.max(...validData.map(d => d.maxMovement)),
      sampleCount: validData.length,
      averageSignalQuality: this.calculateAverage(validData.map(d => d.signalQuality))
    };
  }
  
  private calculateQualitySummary(): QualitySummary {
    return {
      eegQuality: this.eegData.length > 0 ? 
        this.calculateAverage(this.eegData.map(d => d.sqi)) : 0,
      ppgQuality: this.ppgData.length > 0 ? 
        this.calculateAverage(this.ppgData.map(d => d.sqi)) : 0,
      accQuality: this.accData.length > 0 ? 
        this.calculateAverage(this.accData.map(d => d.signalQuality)) : 0,
      overallQuality: 0, // 위 3개의 평균으로 계산
      totalSamples: this.eegData.length + this.ppgData.length + this.accData.length,
      eegSamples: this.eegData.length,
      ppgSamples: this.ppgData.length,
      accSamples: this.accData.length
    };
  }
}
```

### Phase 3: AI 모델 전송 데이터 형식
```typescript
// src/domains/ai-report/types/measurement.ts

export interface AggregatedMeasurementData {
  sessionId: string;
  duration: number; // 밀리초
  eegSummary: EEGSummary;
  ppgSummary: PPGSummary;
  accSummary: ACCSummary;
  qualitySummary: QualitySummary;
  timestamp: number;
}

export interface AIReportRequest {
  personalInfo: PersonalInfo;
  measurementData: AggregatedMeasurementData;
  timestamp: number;
}

// 개별 센서 요약 데이터
export interface EEGSummary {
  totalPower: number;
  emotionalBalance: number;
  attention: number;
  cognitiveLoad: number;
  focusIndex: number;
  relaxationIndex: number;
  stressIndex: number;
  hemisphericBalance: number;
  emotionalStability: number;
  attentionLevel: number;
  meditationLevel: number;
  sampleCount: number;
  averageSQI: number;
}

export interface PPGSummary {
  bpm: number;
  sdnn: number;
  rmssd: number;
  pnn50: number;
  lfPower: number;
  hfPower: number;
  lfHfRatio: number;
  stressIndex: number;
  spo2: number;
  avnn: number;
  pnn20: number;
  sdsd: number;
  hrMax: number;
  hrMin: number;
  sampleCount: number;
  averageSQI: number;
}

export interface ACCSummary {
  activityState: string;
  intensity: number;
  stability: number;
  avgMovement: number;
  maxMovement: number;
  sampleCount: number;
  averageSignalQuality: number;
}

export interface QualitySummary {
  eegQuality: number;
  ppgQuality: number;
  accQuality: number;
  overallQuality: number;
  totalSamples: number;
  eegSamples: number;
  ppgSamples: number;
  accSamples: number;
}
```

### Phase 4: 측정 세션 관리 서비스
```typescript
// src/domains/ai-report/services/MeasurementSessionService.ts

export class MeasurementSessionService {
  private static instance: MeasurementSessionService;
  private analysisMetricsService: AnalysisMetricsService;
  private currentSession: MeasurementSession | null = null;
  
  constructor() {
    this.analysisMetricsService = AnalysisMetricsService.getInstance();
  }
  
  /**
   * 1분 측정 시작
   */
  startMeasurement(): MeasurementSession {
    if (this.currentSession) {
      throw new Error('Measurement already in progress');
    }
    
    const sessionId = `measurement_${Date.now()}`;
    this.currentSession = this.analysisMetricsService.startMeasurementSession(sessionId);
    
    // 1분 후 자동 종료 타이머 설정
    setTimeout(() => {
      this.completeMeasurement();
    }, 60000);
    
    return this.currentSession;
  }
  
  /**
   * 측정 완료 및 데이터 집계
   */
  completeMeasurement(): AggregatedMeasurementData | null {
    if (!this.currentSession) {
      return null;
    }
    
    const aggregatedData = this.analysisMetricsService.finalizeMeasurementSession(
      this.currentSession.sessionId
    );
    
    this.currentSession = null;
    return aggregatedData;
  }
  
  /**
   * 현재 측정 진행 상황
   */
  getMeasurementProgress(): {
    isActive: boolean;
    elapsed: number;
    remaining: number;
    dataQuality: QualitySummary;
  } | null {
    if (!this.currentSession) {
      return null;
    }
    
    const elapsed = Date.now() - this.currentSession.startTime;
    const remaining = Math.max(0, 60000 - elapsed);
    
    return {
      isActive: true,
      elapsed,
      remaining,
      dataQuality: this.currentSession.getCurrentQuality()
    };
  }
}
```

## 🚨 주의사항 및 최적화

### 1. 메모리 관리
- 측정 완료 시 즉시 세션 데이터 정리
- 큐 크기 제한 (120개) 유지
- 불필요한 데이터 복사 방지

### 2. 데이터 품질 보장
- SQI 80% 미만 데이터 제외
- 최소 샘플 수 확보 (각 센서별 최소 10개)
- 이상치 제거 로직 적용

### 3. 에러 처리
- 측정 중단 시 부분 데이터 보존
- 네트워크 오류 시 로컬 저장
- 디바이스 연결 해제 시 재연결 로직

### 4. 성능 최적화
- 실시간 계산 최소화
- 배치 처리 활용
- 백그라운드 스레드 활용

## 🎯 구현 우선순위

1. **High Priority**: MeasurementSession 클래스 구현
2. **High Priority**: AnalysisMetricsService 확장
3. **Medium Priority**: MeasurementSessionService 구현
4. **Medium Priority**: 데이터 집계 및 검증 로직
5. **Low Priority**: 성능 최적화 및 에러 처리 강화

이 전략으로 1분간 데이터 수집의 복잡성을 완전히 해결할 수 있습니다! 