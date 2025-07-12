import { PPGDataPoint } from './SimpleCircularBuffer';

// BiquadFilters 라이브러리 추가 - EEG와 동일한 방식
// @ts-ignore - biquadjs는 타입 선언이 없으므로 타입 체크 무시
import { makeBandpassFilter } from 'biquadjs';

/**
 * PPG 전용 간단 신호 처리기
 * 
 * 역할:
 * - PPG 데이터 기본 필터링
 * - 신호 품질 분석 (SQI 계산) - 백분율로 표시
 * - 기본 심박수 계산 (피크 검출)
 * - 간단한 HRV 계산
 * - SpO2 추정 (Red/IR 비율)
 */
export class PPGSignalProcessor {
  private readonly channelNames = ['Red', 'IR'] as const;
  private readonly ppgSamplingRate: number = 50; // Hz
  
  constructor() {}
  
  /**
   * PPG 데이터 처리 메인 함수
   */
  async processPPGData(data: PPGDataPoint[]): Promise<{
    filteredData: PPGDataPoint[];
    signalQuality: {
      overall: number;
      red: number;
      ir: number;
      sqi: number[];
      redSQI: number[];
      irSQI: number[];
      overallSQI: number[];
    };
    vitals: {
      heartRate: number;
      hrv: number;
      spo2?: number;
    };
    peakInfo: {
      peakCount: number;
      avgPeakInterval: number;
      peakQuality: number;
    };
    advancedHRV: {
      sdnn: number;
      pnn50: number;
      lfPower: number;
      hfPower: number;
      lfHfRatio: number;
      stressIndex: number;
      avnn: number;
      pnn20: number;
      sdsd: number;
      hrMax: number;
      hrMin: number;
    };
    rrIntervals: number[]; // 🔧 RR 간격 추가 (LF/HF 계산용)
  }> {

    
    if (data.length === 0) {
      throw new Error('PPG 데이터가 없습니다');
    }

    try {
      // PPG 세그먼트 처리
      const result = this.processPPGSegment(data);
      
      // 피크 정보 분석
      const peakInfo = await this.analyzePeaks(result.filteredRawData);
      
      return {
        filteredData: result.filteredRawData,
        signalQuality: {
          overall: result.signalQuality,
          red: result.redSQI.reduce((sum, val) => sum + val, 0) / result.redSQI.length,
          ir: result.irSQI.reduce((sum, val) => sum + val, 0) / result.irSQI.length,
          sqi: result.overallSQI,
          redSQI: result.redSQI,
          irSQI: result.irSQI,
          overallSQI: result.overallSQI
        },
        vitals: {
          heartRate: result.heartRate,
          hrv: result.hrv,
          spo2: result.spo2
        },
        peakInfo,
        advancedHRV: result.advancedHRV,
        rrIntervals: result.rrIntervals || [] // 🔧 RR 간격 추가
      };
      
    } catch (error) {
      // PPG 데이터 처리 중 치명적 오류 발생 시 기본값 반환
      
      // 에러 발생 시 기본값 반환하여 프로세스 중단 방지
      const fallbackResult = {
        filteredData: data || [],
        signalQuality: {
          overall: 0,
          red: 0,
          ir: 0,
          sqi: [],
          redSQI: [],
          irSQI: [],
          overallSQI: []
        },
        vitals: {
          heartRate: 0,
          hrv: 0,
          spo2: 0
        },
        peakInfo: {
          peakCount: 0,
          avgPeakInterval: 0,
          peakQuality: 0
        },
        advancedHRV: {
          sdnn: 0,
          pnn50: 0,
          lfPower: 0,
          hfPower: 0,
          lfHfRatio: 0,
          stressIndex: 0,
          avnn: 0,
          pnn20: 0,
          sdsd: 0,
          hrMax: 0,
          hrMin: 0
        },
        rrIntervals: [] // 🔧 RR 간격 추가
      };
      

      return fallbackResult;
    }
  }

  /**
   * PPG 세그먼트 처리 (간단 버전)
   */
  private processPPGSegment(data: PPGDataPoint[]): { 
    filteredRawData: PPGDataPoint[]; 
    heartRate: number; 
    hrv: number; 
    signalQuality: number;
    spo2?: number;
    redSQI: number[];
    irSQI: number[];
    overallSQI: number[];
    advancedHRV: {
      sdnn: number;
      pnn50: number;
      lfPower: number;
      hfPower: number;
      lfHfRatio: number;
      stressIndex: number;
      avnn: number;
      pnn20: number;
      sdsd: number;
      hrMax: number;
      hrMin: number;
    };
    rrIntervals: number[]; // 🔧 RR 간격 추가
  } {
    if (data.length === 0) {
      throw new Error('Empty PPG data segment');
    }

    try {

    // 🔧 1600샘플 처리: 앞의 100샘플 제외하고 1400샘플 사용
    let processedData = data;
    if (data.length === 500) {
      processedData = data.slice(100, 500); // 100~1499 인덱스 사용 (1400샘플)
    } else if (data.length > 500) {
      processedData = data.slice(100, data.length - 100); // 앞뒤 100샘플씩 제외
    }

    // Red와 IR 채널 데이터 분리
    const redData = processedData.map(point => point.red);
    const irData = processedData.map(point => point.ir);
    
    // 1. 간단한 필터링 적용
    const filteredRed = this.applySimpleFilter(redData);
    const filteredIR = this.applySimpleFilter(irData);
    
    // 2. 신호 품질 분석 (SQI 계산) - 백분율로 표시
    const redSQI = this.calculatePPGSQI(filteredRed);
    const irSQI = this.calculatePPGSQI(filteredIR);
    const overallSQI = redSQI.map((red, idx) => (red + irSQI[idx]) / 2);
    
    // 3. 전체 신호 품질 점수 계산
    const avgSQI = overallSQI.reduce((sum, val) => sum + val, 0) / overallSQI.length;
    
    // 4. 심박수 계산 (개선된 알고리즘)
    const heartRate = this.calculateHeartRate(filteredIR);
    
    // 5. HRV 계산 (BasicSignalProcessor.ts와 동일한 RMSSD 방식)
    const hrv = this.calculateHRV(filteredIR);
    
    // 6. SpO2 계산
    const spo2 = this.calculateSpO2(redData, irData);
    
    // 🔧 7. 고급 HRV 분석 추가 (에러 처리 포함)

    
    let advancedHRV;
    let rrIntervals: number[] = []; // 🔧 RR 간격 추출용
    
    try {
      advancedHRV = this.calculateAdvancedHRV(filteredIR);
      
      // 🔧 RR 간격 추출 (LF/HF 계산용) - 원시 IR 데이터 사용
      // ⚠️ 중요: HRV 계산에는 밴드패스 필터를 거치지 않은 원시 데이터 사용
      // LF(0.04-0.15Hz), HF(0.15-0.4Hz) 대역이 1.0Hz 하이패스로 제거되지 않도록
      const peaks = this.detectPeaksForHRV(irData);
      if (peaks.length >= 2) {
        for (let i = 1; i < peaks.length; i++) {
          const interval = (peaks[i] - peaks[i-1]) * (1000 / this.ppgSamplingRate);
          if (interval >= 300 && interval <= 1200) {
            rrIntervals.push(interval);
          }
        }
      }
      

    } catch (error) {
      // PPG 고급 HRV 분석 실패 시 기본값 사용
      advancedHRV = {
        sdnn: 0, pnn50: 0, lfPower: 0, hfPower: 0, lfHfRatio: 0,
        stressIndex: 0, avnn: 0, pnn20: 0, sdsd: 0, hrMax: 0, hrMin: 0
      };
      rrIntervals = [];
    }
    
    // 필터링된 데이터 재구성
    const filteredRawData: PPGDataPoint[] = processedData.map((point, idx) => ({
      timestamp: point.timestamp,
      red: filteredRed[idx] || point.red,
      ir: filteredIR[idx] || point.ir,
      leadOff: point.leadOff || false
    }));

    return {
      filteredRawData,
      heartRate,
      hrv,
      signalQuality: avgSQI,
      spo2,
      redSQI,
      irSQI,
      overallSQI,
      advancedHRV,
      rrIntervals // 🔧 RR 간격 반환
    };
    
    } catch (error) {
      // PPG 세그먼트 처리 중 치명적 오류 발생 시 기본값 반환
      
      // 에러 발생 시 기본값 반환하여 프로세스 중단 방지
      const fallbackData: PPGDataPoint[] = data || [];
      return {
        filteredRawData: fallbackData,
        heartRate: 0,
        hrv: 0,
        signalQuality: 0,
        spo2: 0,
        redSQI: [],
        irSQI: [],
        overallSQI: [],
        advancedHRV: {
          sdnn: 0,
          pnn50: 0,
          lfPower: 0,
          hfPower: 0,
          lfHfRatio: 0,
          stressIndex: 0,
          avnn: 0,
          pnn20: 0,
          sdsd: 0,
          hrMax: 0,
          hrMin: 0
        },
        rrIntervals: [] // 🔧 RR 간격 추가
      };
    }
  }

  /**
   * PPG 밴드패스 필터 (1.0-5.0Hz) - EEG와 동일한 BiquadFilters 라이브러리 사용
   */
  private applySimpleFilter(data: number[]): number[] {
    try {
      // DC 성분 제거 (평균값 빼기)
      const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
      const dcRemoved = data.map(val => val - mean);
      

      
      // EEG와 동일한 BiquadFilters 라이브러리 사용 (1.0-5.0Hz)
      const bandpassFilter = makeBandpassFilter(1.0, 5.0, this.ppgSamplingRate);
      const filtered = new Array(dcRemoved.length);
      
      for (let i = 0; i < dcRemoved.length; i++) {
        filtered[i] = bandpassFilter.applyFilter(dcRemoved[i]);
      }
      

      
      return filtered;
    } catch (error) {
      // BiquadFilters PPG 밴드패스 필터 실패 시 fallback 사용
      return this.fallbackPPGBandpassFilter(data);
    }
  }

  /**
   * PPG 밴드패스 필터 (fallback) - 기본 구현
   */
  private fallbackPPGBandpassFilter(data: number[]): number[] {
    // DC 성분 제거 (평균값 빼기)
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const dcRemoved = data.map(val => val - mean);
    
    // 간단한 이동평균 필터 (기존 방식)
    const windowSize = 3;
    const filtered: number[] = [];
    
    for (let i = 0; i < dcRemoved.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(dcRemoved.length, i + Math.floor(windowSize / 2) + 1);
      
      let sum = 0;
      for (let j = start; j < end; j++) {
        sum += dcRemoved[j];
      }
      
      filtered.push(sum / (end - start));
    }
    
    return filtered;
  }

  /**
   * 빠른 품질 체크 (간단 버전)
   */
  async quickQualityCheck(data: PPGDataPoint[]): Promise<{
    isGoodQuality: boolean;
    qualityScore: number;
    issues: string[];
  }> {
    if (data.length < 10) {
      return {
        isGoodQuality: false,
        qualityScore: 0,
        issues: ['데이터 부족']
      };
    }

    const issues: string[] = [];
    let qualityScore = 1.0;

    // Lead-off 상태 확인
    const leadOffCount = data.filter(point => point.leadOff).length;
    
    if (leadOffCount > data.length * 0.1) {
      issues.push('센서 접촉 불량');
      qualityScore *= 0.5;
    }

    // 신호 범위 확인
    const redValues = data.map(point => Math.abs(point.red));
    const irValues = data.map(point => Math.abs(point.ir));
    const maxRed = Math.max(...redValues);
    const maxIR = Math.max(...irValues);

    if (maxRed > 500 || maxIR > 500) {
      issues.push('신호 포화');
      qualityScore *= 0.3;
    }

    if (maxRed < 10 || maxIR < 10) {
      issues.push('신호 약함');
      qualityScore *= 0.6;
    }

    // 신호 변동성 확인
    const redVariance = this.computeVariance(data.map(point => point.red));
    const irVariance = this.computeVariance(data.map(point => point.ir));
    
    if (redVariance < 1 && irVariance < 1) {
      issues.push('신호 변동 부족');
      qualityScore *= 0.4;
    }

    return {
      isGoodQuality: qualityScore >= 0.7,
      qualityScore,
      issues
    };
  }

  /**
   * 피크 분석
   */
  private async analyzePeaks(data: PPGDataPoint[]): Promise<{
    peakCount: number;
    avgPeakInterval: number;
    peakQuality: number;
  }> {
    if (data.length < 25) {
      return {
        peakCount: 0,
        avgPeakInterval: 0,
        peakQuality: 0
      };
    }

    const redData = data.map(point => point.red);
    const peaks = this.detectPeaks(redData);
    
    let avgPeakInterval = 0;
    if (peaks.length > 1) {
      const intervals = [];
      for (let i = 1; i < peaks.length; i++) {
        intervals.push(peaks[i] - peaks[i-1]);
      }
      avgPeakInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    }

    // 피크 품질 평가 (간격의 일관성)
    let peakQuality = 0;
    if (peaks.length >= 3) {
      const intervals = [];
      for (let i = 1; i < peaks.length; i++) {
        intervals.push(peaks[i] - peaks[i-1]);
      }
      const intervalMean = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
      const intervalVariance = intervals.reduce((sum, val) => sum + Math.pow(val - intervalMean, 2), 0) / intervals.length;
      const intervalStd = Math.sqrt(intervalVariance);
      
      // 변동 계수가 낮을수록 품질이 좋음
      const cv = intervalStd / intervalMean;
      peakQuality = Math.max(0, Math.min(1, 1 - cv));
    }

    return {
      peakCount: peaks.length,
      avgPeakInterval,
      peakQuality
    };
  }
  /**
   * PPG SQI 계산 (EEG와 동일한 방식: 절대값 250 기준)
   */
  private calculatePPGSQI(data: number[]): number[] {
    const windowSize = 25; // 0.5초 윈도우 (50Hz * 0.5s)
    const sqi: number[] = new Array(data.length).fill(0);
    const threshold = 250; // 고정 기준선 (150 → 250으로 확대)
    
    for (let i = 0; i <= data.length - windowSize; i++) {
      const window = data.slice(i, i + windowSize);
      
      // 각 샘플에 대해 개별 품질 점수 계산 (EEG와 동일한 방식)
      const qualityScores = window.map(sample => {
        const absValue = Math.abs(sample);
        
        if (absValue <= threshold) {
          // 기준선 이하: 100% 품질
          return 1.0;
        } else {
          // 기준선 초과: 점진적 품질 감소
          // 250을 넘으면 선형적으로 감소, 500에서 0%가 됨
          const excess = absValue - threshold;
          const maxExcess = threshold; // 250 이상 초과시 0%
          const qualityReduction = Math.min(excess / maxExcess, 1.0);
          return Math.max(0, 1.0 - qualityReduction);
        }
      });
      
      // 윈도우 내 평균 품질 점수 계산
      const windowSQI = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
      
      // 윈도우 내 모든 샘플에 SQI 값 할당
      for (let j = i; j < i + windowSize; j++) {
        sqi[j] = windowSQI;
      }
    }
    
    // 🔧 백분율로 변환 (0-100 범위)
    return sqi.map(value => value * 100);
  }

  /**
   * 진폭 기반 SQI 계산 (EEG 방식과 동일한 구조)
   */
  private calculateAmplitudeBasedSQI_EEGStyle(data: number[], windowSize: number): number[] {
    const sqi = new Array(data.length).fill(0);
    
    for (let i = 0; i <= data.length - windowSize; i++) {
      const window = data.slice(i, i + windowSize);
      
      // 각 샘플에 대해 절대값 기반 품질 점수 계산
      const qualityScores = window.map(sample => {
        const absValue = Math.abs(sample);
        
        // PPG 신호의 적절한 범위 기준 (EEG 150μV 기준을 PPG에 맞게 조정)
        const optimalThreshold = 30000; // PPG 신호의 적절한 임계값
        
        if (absValue <= optimalThreshold) {
          // 임계값 이하: 100% 품질
          return 1.0;
        } else {
          // 임계값 초과: 점진적 품질 감소
          // 임계값을 넘으면 선형적으로 감소, 2배 값에서 0%가 됨
          const excess = absValue - optimalThreshold;
          const maxExcess = optimalThreshold; // 임계값 이상 초과시 0%
          const qualityReduction = Math.min(excess / maxExcess, 1.0);
          return Math.max(0, 1.0 - qualityReduction);
        }
      });
      
      // 윈도우 내 평균 품질 점수 계산
      const qualityScore = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
      
      // 윈도우 내 모든 샘플에 동일한 품질 점수 적용
      for (let j = i; j < i + windowSize && j < data.length; j++) {
        sqi[j] = qualityScore;
      }
    }
    
    return sqi;
  }

  /**
   * 주파수 기반 SQI 계산 (EEG 방식과 동일한 구조)
   */
  private calculateFrequencyBasedSQI_EEGStyle(data: number[], windowSize: number): number[] {
    const sqi = new Array(data.length).fill(0);
    
    for (let i = 0; i <= data.length - windowSize; i++) {
      const window = data.slice(i, i + windowSize);
      const variance = this.calculateVariance(window);
      
      // PPG 신호에 맞는 분산 기준 설정 (EEG 1000 기준을 PPG에 맞게 조정)
      const maxVariance = 1000000000; // PPG 신호의 최대 허용 분산
      const qualityScore = Math.max(0, Math.min(1, 1.0 - variance / maxVariance));
      
      // 윈도우 내 모든 샘플에 동일한 품질 점수 적용
      for (let j = i; j < i + windowSize && j < data.length; j++) {
        sqi[j] = qualityScore;
      }
    }
    
    return sqi;
  }

  /**
   * 복합 SQI 계산 (EEG 방식과 동일한 구조)
   */
  private calculateCombinedSQI_EEGStyle(amplitudeSQI: number[], frequencySQI: number[]): number[] {
    const combinedSQI = new Array(amplitudeSQI.length);
    
    for (let i = 0; i < amplitudeSQI.length; i++) {
      // EEG와 동일한 가중치: 진폭 70% + 주파수 30%
      combinedSQI[i] = 0.7 * amplitudeSQI[i] + 0.3 * frequencySQI[i];
    }
    
    return combinedSQI;
  }

  /**
   * 분산 계산 (EEG 방식과 동일)
   */
  private calculateVariance(data: number[]): number {
    if (data.length === 0) return 0;
    
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    
    return variance;
  }

  /**
   * 심박수 계산 (개선된 알고리즘)
   * 다중 방법론을 통한 정확도 및 안정성 향상
   */
  private calculateHeartRate(data: number[]): number {
    if (data.length < 50) return 0; // 최소 1초 데이터 필요 (50Hz * 1s)
    
    // BPM 계산 시작
    
    // 1. 전처리: 신호 스무딩 및 정규화
    const preprocessed = this.preprocessForHeartRate(data);
    if (preprocessed.length === 0) {
      // BPM 계산 실패: 전처리 실패
      return 0;
    }
    
    // 🚀 핵심 최적화: 가장 빠른 피크 검출 방법만 사용
    const startTime = Date.now();
    const bestPeaks = this.detectPeaksAdaptiveThreshold(preprocessed);
    const peakDetectionTime = Date.now() - startTime;
    
    // BPM 피크 검출 결과 (최적화)
    
    if (bestPeaks.length < 2) {
      // BPM 계산 실패: 유효한 피크 부족
      return 0;
    }
    
    // 4. RR 간격 계산 및 이상값 제거
    const rrIntervals = this.calculateRRIntervalsWithOutlierRemoval(bestPeaks);
    
    if (rrIntervals.length === 0) {
      // BPM 계산 실패: 유효한 RR 간격 없음
      return 0;
    }
    
    // 5. 심박수 계산 (가중평균 사용)
    const heartRate = this.calculateWeightedHeartRate(rrIntervals);
    
    // 6. 최종 검증 및 스무딩
    const finalHeartRate = this.validateAndSmoothHeartRate(heartRate, rrIntervals);
    
    // BPM 계산 완료
    
    return finalHeartRate;
  }

  /**
   * 심박수 계산을 위한 전처리
   */
  private preprocessForHeartRate(data: number[]): number[] {
    // 1. 이동평균 필터로 고주파 노이즈 제거
    const smoothed = this.applySmoothingFilter(data, 3);
    
    // 2. 신호 정규화 (zero-mean)
    const mean = smoothed.reduce((sum, val) => sum + val, 0) / smoothed.length;
    const normalized = smoothed.map(val => val - mean);
    
    // 3. 신호 품질 확인
    const std = Math.sqrt(this.calculateVariance(normalized));
    if (std < 10) {
      // BPM 전처리 실패: 신호 변동성 부족
      return [];
    }
    
    return normalized;
  }

  /**
   * 적응형 임계값 기반 피크 검출
   */
  private detectPeaksAdaptiveThreshold(data: number[]): number[] {
    const peaks: number[] = [];
    const windowSize = Math.floor(this.ppgSamplingRate * 0.5); // 0.5초 윈도우
    const minPeakDistance = Math.floor(this.ppgSamplingRate * 0.4); // 0.4초 최소 간격 (150 BPM 대응)
    
    for (let i = windowSize; i < data.length - windowSize; i++) {
      // 지역 윈도우에서 동적 임계값 계산
      const window = data.slice(i - windowSize, i + windowSize);
      const localMax = Math.max(...window);
      const localMean = window.reduce((sum, val) => sum + val, 0) / window.length;
      const threshold = localMean + (localMax - localMean) * 0.6; // 60% 임계값
      
      // 피크 조건 확인
      if (data[i] > threshold && 
          data[i] > data[i-1] && 
          data[i] > data[i+1] &&
          data[i] > data[i-2] && 
          data[i] > data[i+2]) {
        
        // 최소 거리 확인
        if (peaks.length === 0 || i - peaks[peaks.length - 1] >= minPeakDistance) {
          peaks.push(i);
        }
      }
    }
    
    return peaks;
  }

  /**
   * 미분 기반 피크 검출
   */
  private detectPeaksDerivativeBased(data: number[]): number[] {
    const peaks: number[] = [];
    const minPeakDistance = Math.floor(this.ppgSamplingRate * 0.4);
    
    // 1차 미분 계산
    const firstDerivative = [];
    for (let i = 1; i < data.length; i++) {
      firstDerivative.push(data[i] - data[i-1]);
    }
    
    // 2차 미분 계산
    const secondDerivative = [];
    for (let i = 1; i < firstDerivative.length; i++) {
      secondDerivative.push(firstDerivative[i] - firstDerivative[i-1]);
    }
    
    // 영점 교차 및 피크 검출
    for (let i = 2; i < data.length - 2; i++) {
      const idx = i - 2; // 미분 인덱스 조정
      
      if (idx >= 0 && idx < firstDerivative.length - 1 && idx < secondDerivative.length) {
        // 1차 미분 영점 교차 (양수에서 음수로)
        if (firstDerivative[idx] > 0 && firstDerivative[idx + 1] <= 0) {
          // 2차 미분이 음수 (극대값)
          if (secondDerivative[idx] < 0) {
            // 신호 강도 확인
            const localWindow = data.slice(Math.max(0, i-10), Math.min(data.length, i+10));
            const localMax = Math.max(...localWindow);
            const localMean = localWindow.reduce((sum, val) => sum + val, 0) / localWindow.length;
            
            if (data[i] > localMean + (localMax - localMean) * 0.3) {
              // 최소 거리 확인
              if (peaks.length === 0 || i - peaks[peaks.length - 1] >= minPeakDistance) {
                peaks.push(i);
              }
            }
          }
        }
      }
    }
    
    return peaks;
  }

  /**
   * 템플릿 매칭 기반 피크 검출
   */
  private detectPeaksTemplateMatching(data: number[]): number[] {
    const peaks: number[] = [];
    const minPeakDistance = Math.floor(this.ppgSamplingRate * 0.4);
    
    // 간단한 PPG 템플릿 생성 (가우시안 형태)
    const templateSize = Math.floor(this.ppgSamplingRate * 0.2); // 0.2초 템플릿
    const template = this.generatePPGTemplate(templateSize);
    
    // 정규화된 상관관계 계산
    for (let i = 0; i <= data.length - templateSize; i++) {
      const segment = data.slice(i, i + templateSize);
      const correlation = this.calculateNormalizedCorrelation(segment, template);
      
      // 높은 상관관계를 가진 중심점을 피크로 간주
      if (correlation > 0.7) { // 70% 이상 유사도
        const peakIndex = i + Math.floor(templateSize / 2);
        
        // 최소 거리 확인
        if (peaks.length === 0 || peakIndex - peaks[peaks.length - 1] >= minPeakDistance) {
          peaks.push(peakIndex);
        }
      }
    }
    
    return peaks;
  }

  /**
   * PPG 템플릿 생성
   */
  private generatePPGTemplate(size: number): number[] {
    const template = [];
    const center = size / 2;
    const sigma = size / 6; // 표준편차
    
    for (let i = 0; i < size; i++) {
      // 가우시안 함수 + 비대칭성 추가
      const x = i - center;
      const gaussian = Math.exp(-(x * x) / (2 * sigma * sigma));
      
      // PPG 신호의 특징적인 비대칭 형태 (급상승, 완만한 하강)
      const asymmetry = x < 0 ? 1.0 : Math.exp(-x / (sigma * 2));
      
      template.push(gaussian * asymmetry);
    }
    
    return template;
  }

  /**
   * 정규화된 상관관계 계산
   */
  private calculateNormalizedCorrelation(signal1: number[], signal2: number[]): number {
    if (signal1.length !== signal2.length) return 0;
    
    const mean1 = signal1.reduce((sum, val) => sum + val, 0) / signal1.length;
    const mean2 = signal2.reduce((sum, val) => sum + val, 0) / signal2.length;
    
    let numerator = 0;
    let denominator1 = 0;
    let denominator2 = 0;
    
    for (let i = 0; i < signal1.length; i++) {
      const diff1 = signal1[i] - mean1;
      const diff2 = signal2[i] - mean2;
      
      numerator += diff1 * diff2;
      denominator1 += diff1 * diff1;
      denominator2 += diff2 * diff2;
    }
    
    const denominator = Math.sqrt(denominator1 * denominator2);
    return denominator > 0 ? numerator / denominator : 0;
  }

  /**
   * 최적 피크 세트 선택
   */
  private selectBestPeakSet(peakSets: Array<{peaks: number[], method: string}>, data: number[]): number[] {
    if (peakSets.length === 0) return [];
    
    let bestScore = -1;
    let bestPeaks: number[] = [];
    
    for (const peakSet of peakSets) {
      if (peakSet.peaks.length < 2) continue;
      
      // 피크 품질 평가
      const score = this.evaluatePeakQuality(peakSet.peaks, data);
      
      // BPM 피크 품질 평가
      
      if (score > bestScore) {
        bestScore = score;
        bestPeaks = peakSet.peaks;
      }
    }
    
    return bestPeaks;
  }

  /**
   * 피크 품질 평가
   */
  private evaluatePeakQuality(peaks: number[], data: number[]): number {
    if (peaks.length < 2) return 0;
    
    // 1. RR 간격 일관성 평가
    const rrIntervals = [];
    for (let i = 1; i < peaks.length; i++) {
      const interval = peaks[i] - peaks[i-1];
      rrIntervals.push(interval);
    }
    
    const meanRR = rrIntervals.reduce((sum, val) => sum + val, 0) / rrIntervals.length;
    const rrVariance = rrIntervals.reduce((sum, val) => sum + Math.pow(val - meanRR, 2), 0) / rrIntervals.length;
    const rrCV = Math.sqrt(rrVariance) / meanRR; // 변동계수
    
    const consistencyScore = Math.max(0, 1 - rrCV); // CV가 낮을수록 높은 점수
    
    // 2. 피크 강도 평가
    const peakAmplitudes = peaks.map(idx => data[idx]);
    const meanAmplitude = peakAmplitudes.reduce((sum, val) => sum + val, 0) / peakAmplitudes.length;
    const amplitudeScore = Math.min(1, meanAmplitude / (Math.max(...data) * 0.5)); // 최대값의 50% 이상
    
    // 3. 생리학적 타당성 평가
    const avgHeartRate = 60 / (meanRR / this.ppgSamplingRate);
    const physiologyScore = (avgHeartRate >= 40 && avgHeartRate <= 200) ? 1 : 0;
    
    // 종합 점수 (가중평균)
    return consistencyScore * 0.5 + amplitudeScore * 0.3 + physiologyScore * 0.2;
  }

  /**
   * 이상값 제거를 포함한 RR 간격 계산
   */
  private calculateRRIntervalsWithOutlierRemoval(peaks: number[]): number[] {
    if (peaks.length < 2) return [];
    
    // 1. 기본 RR 간격 계산 (밀리초)
    const rrIntervals = [];
    for (let i = 1; i < peaks.length; i++) {
      const interval = (peaks[i] - peaks[i-1]) * (1000 / this.ppgSamplingRate);
      rrIntervals.push(interval);
    }
    
    // 2. 생리학적 범위 필터링 (300-1500ms)
    const validRR = rrIntervals.filter(rr => rr >= 300 && rr <= 1500);
    
    if (validRR.length < 2) return validRR;
    
    // 3. 통계적 이상값 제거 (IQR 방법)
    const sortedRR = [...validRR].sort((a, b) => a - b);
    const q1 = sortedRR[Math.floor(sortedRR.length * 0.25)];
    const q3 = sortedRR[Math.floor(sortedRR.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    const filteredRR = validRR.filter(rr => rr >= lowerBound && rr <= upperBound);
    
    // BPM RR 간격 필터링
    
    return filteredRR;
  }

  /**
   * 가중평균 기반 심박수 계산
   */
  private calculateWeightedHeartRate(rrIntervals: number[]): number {
    if (rrIntervals.length === 0) return 0;
    
    if (rrIntervals.length === 1) {
      return 60000 / rrIntervals[0];
    }
    
    // 최근 값에 더 높은 가중치 부여
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (let i = 0; i < rrIntervals.length; i++) {
      const weight = (i + 1) / rrIntervals.length; // 선형 가중치 (최근일수록 높음)
      weightedSum += (60000 / rrIntervals[i]) * weight;
      totalWeight += weight;
    }
    
    return weightedSum / totalWeight;
  }

  /**
   * 심박수 검증 및 스무딩
   */
  private validateAndSmoothHeartRate(heartRate: number, rrIntervals: number[]): number {
    // 1. 생리학적 범위 확인
    if (heartRate < 40 || heartRate > 200) {
      // BPM 검증 실패: 생리학적 범위 벗어남
      return 0;
    }
    
    // 2. RR 간격 일관성 확인
    if (rrIntervals.length >= 3) {
      const rrMean = rrIntervals.reduce((sum, val) => sum + val, 0) / rrIntervals.length;
      const rrStd = Math.sqrt(rrIntervals.reduce((sum, val) => sum + Math.pow(val - rrMean, 2), 0) / rrIntervals.length);
      const cv = rrStd / rrMean;
      
      // 변동계수가 너무 크면 신뢰도 낮음
      if (cv > 0.5) {
        // BPM 검증 경고: 높은 변동성
        // 완전히 거부하지 않고 보정된 값 반환
        return Math.round(heartRate * 0.9); // 10% 감소
      }
    }
    
    // 3. 최종 반올림
    return Math.round(heartRate);
  }

  /**
   * HRV 계산 (BasicSignalProcessor.ts와 동일한 RMSSD 방식)
   */
  private calculateHRV(data: number[]): number {
    if (data.length < 30) return 0; // 최소 데이터 요구사항 완화 (100 → 30)
    
    // 피크 검출 (심박수 계산과 동일한 방식)
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const normalized = data.map(val => val - mean);
    const threshold = Math.max(...normalized) * 0.5; // 임계값 완화 (0.6 → 0.5)
    const peaks: number[] = [];
    
    for (let i = 1; i < normalized.length - 1; i++) {
      if (normalized[i] > threshold && 
          normalized[i] > normalized[i-1] && 
          normalized[i] > normalized[i+1]) {
        if (peaks.length === 0 || i - peaks[peaks.length - 1] >= 15) { // 간격 완화
          peaks.push(i);
        }
      }
    }
    
    if (peaks.length < 2) return 0; // 최소 피크 요구사항 완화 (3 → 2)
    
    // RR 간격 계산 (밀리초)
    const rrIntervals = [];
    for (let i = 1; i < peaks.length; i++) {
      const interval = (peaks[i] - peaks[i-1]) * (1000 / this.ppgSamplingRate);
      if (interval >= 300 && interval <= 1500) { // 합리적인 범위
        rrIntervals.push(interval);
      }
    }
    
    if (rrIntervals.length < 1) return 0; // 최소 간격 요구사항 완화 (2 → 1)
    
    // RMSSD 계산
    if (rrIntervals.length === 1) return 0; // 간격이 1개면 HRV 계산 불가
    
    const squaredDiffs = [];
    for (let i = 1; i < rrIntervals.length; i++) {
      const diff = rrIntervals[i] - rrIntervals[i-1];
      squaredDiffs.push(diff * diff);
    }
    
    const meanSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / squaredDiffs.length;
    return Math.sqrt(meanSquaredDiff);
  }

  /**
   * SpO2 계산 (개선된 알고리즘)
   * Beer-Lambert 법칙과 실제 맥박산소측정법 원리 적용
   */
  private calculateSpO2(redData: number[], irData: number[]): number {
    if (redData.length === 0 || irData.length === 0 || redData.length !== irData.length) return 0;
    
    // SpO2 계산 시작
    
    // 1. 신호 품질 확인
    const redStd = Math.sqrt(this.calculateVariance(redData));
    const irStd = Math.sqrt(this.calculateVariance(irData));
    
    if (redStd < 10 || irStd < 10) {
      // SpO2 계산 실패: 신호 변동성 부족
      return 0;
    }
    
    // 2. 맥박 성분 추출 (피크-투-피크 방식)
    const redAC = this.calculatePulsatileComponent(redData);
    const irAC = this.calculatePulsatileComponent(irData);
    
    // 3. DC 성분 계산 (평균값)
    const redDC = this.calculateDCComponent(redData);
    const irDC = this.calculateDCComponent(irData);
    
    // SpO2 AC/DC 성분
    
    if (redDC === 0 || irDC === 0 || redAC === 0 || irAC === 0) {
      // SpO2 계산 실패: AC 또는 DC 성분이 0
      return 0;
    }
    
    // 4. 정규화된 맥박 강도 계산
    const redRatio = redAC / redDC;
    const irRatio = irAC / irDC;
    
    if (irRatio === 0) {
      // SpO2 계산 실패: IR 비율이 0
      return 0;
    }
    
    // 5. R 값 계산 (Red/IR 비율)
    const R = redRatio / irRatio;
    
    // SpO2 비율 계산
    
    // 6. 개선된 SpO2 계산 공식 (실제 맥박산소측정법 기반)
    // 여러 연구 결과를 종합한 보정된 공식
    let spo2;
    
    if (R < 0.5) {
      // 매우 높은 산소포화도 영역
      spo2 = 100;
    } else if (R < 0.7) {
      // 정상 범위 (선형 보간)
      spo2 = 104 - 17 * R;
    } else if (R < 1.0) {
      // 중간 범위 (비선형 보정)
      spo2 = 112 - 25 * R;
    } else if (R < 2.0) {
      // 낮은 산소포화도 영역
      spo2 = 120 - 35 * R;
    } else {
      // 매우 낮은 산소포화도
      spo2 = Math.max(70, 100 - 15 * R);
    }
    
    // 7. 신호 품질 기반 보정
    const qualityFactor = Math.min(redStd, irStd) / Math.max(redStd, irStd);
    if (qualityFactor < 0.5) {
      // 신호 품질이 낮으면 더 보수적인 값으로 조정
      spo2 = spo2 * 0.95 + 95 * 0.05; // 95%로 수렴
    }
    
    // 8. 최종 범위 제한 및 반올림
    const finalSpO2 = Math.round(Math.max(85, Math.min(100, spo2)));
    
    // SpO2 계산 완료
    
    return finalSpO2;
  }

  /**
   * AC 성분 계산 (기존 방식 - 표준편차)
   */
  private calculateACComponent(data: number[]): number {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    return Math.sqrt(variance);
  }

  /**
   * 맥박 성분 추출 (개선된 AC 성분 계산)
   * 피크-투-피크 방식으로 실제 맥박 진폭을 측정
   */
  private calculatePulsatileComponent(data: number[]): number {
    if (data.length < 10) return 0;
    
    // 1. 신호 스무딩 (이동평균)
    const smoothed = this.applySmoothingFilter(data, 3);
    
    // 2. 피크와 밸리 검출
    const peaks = [];
    const valleys = [];
    
    for (let i = 1; i < smoothed.length - 1; i++) {
      // 피크 검출 (극대값)
      if (smoothed[i] > smoothed[i-1] && smoothed[i] > smoothed[i+1]) {
        peaks.push(smoothed[i]);
      }
      // 밸리 검출 (극소값)
      if (smoothed[i] < smoothed[i-1] && smoothed[i] < smoothed[i+1]) {
        valleys.push(smoothed[i]);
      }
    }
    
    // 3. 피크-투-피크 진폭 계산
    if (peaks.length === 0 || valleys.length === 0) {
      // 피크/밸리가 없으면 범위 기반 계산
      return Math.max(...smoothed) - Math.min(...smoothed);
    }
    
    // 평균 피크와 평균 밸리의 차이
    const avgPeak = peaks.reduce((sum, val) => sum + val, 0) / peaks.length;
    const avgValley = valleys.reduce((sum, val) => sum + val, 0) / valleys.length;
    
    return Math.abs(avgPeak - avgValley);
  }

  /**
   * 스무딩 필터 (단순 이동평균)
   */
  private applySmoothingFilter(data: number[], windowSize: number): number[] {
    if (windowSize <= 1) return [...data];
    
    const smoothed = [];
    const halfWindow = Math.floor(windowSize / 2);
    
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - halfWindow);
      const end = Math.min(data.length - 1, i + halfWindow);
      
      let sum = 0;
      let count = 0;
      
      for (let j = start; j <= end; j++) {
        sum += data[j];
        count++;
      }
      
      smoothed.push(sum / count);
    }
    
    return smoothed;
  }

  /**
   * DC 성분 계산
   */
  private calculateDCComponent(data: number[]): number {
    return data.reduce((sum, val) => sum + val, 0) / data.length;
  }

  /**
   * 피크 검출 (BasicSignalProcessor.ts와 동일한 방식으로 업데이트)
   */
  private detectPeaks(data: number[]): number[] {
    const peaks: number[] = [];
    const minPeakDistance = 10; // 최소 피크 간격 (0.2초) - BasicSignalProcessor.ts와 동일
    
    // 신호 정규화 (BasicSignalProcessor.ts와 동일)
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const normalized = data.map(val => val - mean);
    
    // 동적 임계값 설정 (BasicSignalProcessor.ts와 동일)
    const max = Math.max(...normalized);
    const threshold = max * 0.4; // 임계값 완화 (0.5 → 0.4)
    
    for (let i = 1; i < normalized.length - 1; i++) {
      if (normalized[i] > threshold && 
          normalized[i] > normalized[i-1] && 
          normalized[i] > normalized[i+1]) {
        // 최소 거리 확인
        if (peaks.length === 0 || i - peaks[peaks.length - 1] >= minPeakDistance) {
          peaks.push(i);
        }
      }
    }
    
    return peaks;
  }

  /**
   * 분산 계산
   */
  private computeVariance(data: number[]): number {
    if (data.length === 0) return 0;
    
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    
    return variance;
  }

  /**
   * 고급 HRV 분석 (🔧 AnalysisMetricsService에서 3000개 버퍼로 계산)
   */
  private calculateAdvancedHRV(data: number[]): {
    sdnn: number;
    pnn50: number;
    lfPower: number;
    hfPower: number;
    lfHfRatio: number;
    stressIndex: number;
    // 새로운 지표들 추가
    avnn: number;
    pnn20: number;
    sdsd: number;
    hrMax: number;
    hrMin: number;
  } {
    // PPG HRV 계산 - AnalysisMetricsService로 이관됨
    
    // 🔧 모든 HRV 지표들은 AnalysisMetricsService에서 3000개 버퍼로 정확하게 계산됩니다.
    // PPGSignalProcessor는 더 이상 HRV 계산을 하지 않고, 기본값만 반환합니다.
    return {
      sdnn: 0, // AnalysisMetricsService.getCurrentSDNN()에서 가져옴
      pnn50: 0, // AnalysisMetricsService.getCurrentPNN50()에서 가져옴
      lfPower: 0, // AnalysisMetricsService.getCurrentLfPower()에서 가져옴
      hfPower: 0, // AnalysisMetricsService.getCurrentHfPower()에서 가져옴
      lfHfRatio: 0, // AnalysisMetricsService.getCurrentLfHfRatio()에서 가져옴
      stressIndex: 0, // AnalysisMetricsService.getCurrentStressIndex()에서 가져옴
      avnn: 0, // AnalysisMetricsService.getCurrentAVNN()에서 가져옴
      pnn20: 0, // AnalysisMetricsService.getCurrentPNN20()에서 가져옴
      sdsd: 0, // AnalysisMetricsService.getCurrentSDSD()에서 가져옴
      hrMax: 0, // AnalysisMetricsService.getCurrentHRMax()에서 가져옴
      hrMin: 0  // AnalysisMetricsService.getCurrentHRMin()에서 가져옴
    };
  }

  /**
   * HRV용 피크 검출 (Python 코어 방식 참고)
   */
  private detectPeaksForHRV(data: number[]): number[] {
    // 1. 신호 정규화
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const normalized = data.map(val => val - mean);
    
    // 2. 동적 임계값 설정 (Python 코어와 동일)
    const max = Math.max(...normalized);
    const min = Math.min(...normalized);
    const range = max - min;
    const threshold = max * 0.5; // 50% 임계값
    
    // PPG 피크 검출 파라미터

    const peaks: number[] = [];
    const minPeakDistance = Math.floor(this.ppgSamplingRate * 0.4); // 0.4초 최소 간격 (150 BPM 대응)
    
    for (let i = 1; i < normalized.length - 1; i++) {
      if (normalized[i] > threshold && 
          normalized[i] > normalized[i-1] && 
          normalized[i] > normalized[i+1]) {
        // 최소 거리 확인
        if (peaks.length === 0 || i - peaks[peaks.length - 1] >= minPeakDistance) {
          peaks.push(i);
        }
      }
    }
    
    // PPG 피크 검출 결과
    
    return peaks;
  }

  /**
   * SDNN 계산 (Python 코어와 동일)
   */
  private computeSDNN(rrIntervals: number[]): number {
    if (rrIntervals.length < 2) return 0;
    
    const mean = rrIntervals.reduce((sum, val) => sum + val, 0) / rrIntervals.length;
    const variance = rrIntervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / rrIntervals.length;
    const sdnn = Math.sqrt(variance);
    
    // SDNN 계산
    
    return sdnn;
  }

  /**
   * PNN50 계산 (Python 코어와 동일)
   */
  private computePNN50(rrIntervals: number[]): number {
    if (rrIntervals.length < 2) return 0;
    
    let pnn50Count = 0;
    for (let i = 1; i < rrIntervals.length; i++) {
      if (Math.abs(rrIntervals[i] - rrIntervals[i-1]) > 50) {
        pnn50Count++;
      }
    }
    
    const pnn50 = (pnn50Count / (rrIntervals.length - 1)) * 100; // 백분율로 변환
    
    // PNN50 계산
    
    return pnn50;
  }

  /**
   * AVNN 계산 (Average NN Intervals)
   * NN 간격의 평균값 - 평균 심박주기
   */
  private computeAVNN(rrIntervals: number[]): number {
    if (rrIntervals.length === 0) return 0;
    
    const avnn = rrIntervals.reduce((sum, val) => sum + val, 0) / rrIntervals.length;
    
    // AVNN 계산
    
    return avnn;
  }

  /**
   * PNN20 계산 (Percentage of NN20)
   * 20ms 초과 차이의 백분율 - pNN50보다 민감한 지표
   */
  private computePNN20(rrIntervals: number[]): number {
    if (rrIntervals.length < 2) return 0;
    
    let pnn20Count = 0;
    for (let i = 1; i < rrIntervals.length; i++) {
      if (Math.abs(rrIntervals[i] - rrIntervals[i-1]) > 20) {
        pnn20Count++;
      }
    }
    
    const pnn20 = (pnn20Count / (rrIntervals.length - 1)) * 100; // 백분율로 변환
    
    // PNN20 계산
    
    return pnn20;
  }

  /**
   * SDSD 계산 (Standard Deviation of Successive Differences)
   * 연속 차이의 표준편차 - RMSSD와 유사하지만 표준편차 사용
   */
  private computeSDSD(rrIntervals: number[]): number {
    if (rrIntervals.length < 2) return 0;
    
    // 1. 연속 차이 계산
    const successiveDiffs = [];
    for (let i = 1; i < rrIntervals.length; i++) {
      successiveDiffs.push(rrIntervals[i] - rrIntervals[i-1]);
    }
    
    // 2. 표준편차 계산
    const mean = successiveDiffs.reduce((sum, val) => sum + val, 0) / successiveDiffs.length;
    const variance = successiveDiffs.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / successiveDiffs.length;
    const sdsd = Math.sqrt(variance);
    
    // SDSD 계산
    
    return sdsd;
  }

  /**
   * HR Max/Min 계산 (Heart Rate Maximum/Minimum)
   * 🔧 AnalysisMetricsService의 BPM 버퍼에서 계산되므로 여기서는 0 반환
   */
  private computeHRMaxMin(rrIntervals: number[]): { hrMax: number; hrMin: number } {
    // 🔧 AnalysisMetricsService의 BPM 버퍼에서 실시간으로 Max/Min 추적
    // 여기서는 0을 반환하여 큐 합계 계산에 영향주지 않음
    // HR Max/Min 계산 스킵 - AnalysisMetricsService BPM 버퍼에서 처리
    
    return { hrMax: 0, hrMin: 0 };
  }

  /**
   * Stress Index 계산 (HRV 기반 정규화된 스트레스 지수)
   * 툴팁 설명에 맞게 0.0-1.0 범위로 정규화
   */
  private computeStressIndex(rrIntervals: number[]): number {
    if (rrIntervals.length < 5) return 0;
    
    // 1. SDNN 계산 (전체 변동성)
    const mean = rrIntervals.reduce((sum, val) => sum + val, 0) / rrIntervals.length;
    const variance = rrIntervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / rrIntervals.length;
    const sdnn = Math.sqrt(variance);
    
    // 2. RMSSD 계산 (단기 변동성)
    let rmssd = 0;
    if (rrIntervals.length > 1) {
      const squaredDiffs = [];
      for (let i = 1; i < rrIntervals.length; i++) {
        const diff = rrIntervals[i] - rrIntervals[i-1];
        squaredDiffs.push(diff * diff);
      }
      rmssd = Math.sqrt(squaredDiffs.reduce((sum, val) => sum + val, 0) / squaredDiffs.length);
    }
    
    // 3. 심박수 변동성 기반 스트레스 지수 계산
    // 낮은 HRV = 높은 스트레스
    // 정상 SDNN: 30-100ms, 정상 RMSSD: 20-50ms
    const normalizedSDNN = Math.max(0, Math.min(1, (100 - sdnn) / 70)); // SDNN이 낮을수록 스트레스 높음
    const normalizedRMSSD = Math.max(0, Math.min(1, (50 - rmssd) / 30)); // RMSSD가 낮을수록 스트레스 높음
    
    // 4. 심박수 기반 추가 스트레스 지표
    const avgHeartRate = 60000 / mean; // BPM 계산
    const heartRateStress = Math.max(0, Math.min(1, (avgHeartRate - 60) / 40)); // 60-100 BPM 정상 범위
    
    // 5. 종합 스트레스 지수 (0.0-1.0 범위)
    const stressIndex = (normalizedSDNN * 0.4 + normalizedRMSSD * 0.4 + heartRateStress * 0.2);
    
    // 정규화된 Stress Index 계산
    
    // 0.0-1.0 범위로 제한
    return Math.max(0, Math.min(1, stressIndex));
  }

  /**
   * RR 간격을 지정된 주파수로 리샘플링
   */
  private resampleRRIntervals(rrIntervals: number[], targetFs: number): number[] {
    if (rrIntervals.length < 2) {
      // RR 리샘플링 실패: RR 간격 부족
      return [];
    }
    
    // RR 리샘플링 시작
    
    // 1. RR 간격을 초 단위로 변환
    const rrIntervalsSeconds = rrIntervals.map(rr => rr / 1000.0);
    
    // 2. 시간 축 생성 (누적 시간)
    const timeAxis = [0];
    for (let i = 0; i < rrIntervalsSeconds.length; i++) {
      timeAxis.push(timeAxis[timeAxis.length - 1] + rrIntervalsSeconds[i]);
    }
    
    // 3. 목표 주파수로 리샘플링
    const totalTime = timeAxis[timeAxis.length - 1];
    const numSamples = Math.floor(totalTime * targetFs);
    
    // RR 리샘플링 계산
    
    if (numSamples < 4) {
      // RR 리샘플링 실패: 샘플 수 부족
      return [];
    }
    
    const resampledTime = Array.from({ length: numSamples }, (_, i) => i / targetFs);
    const resampledRR = this.interpolateLinear(timeAxis, rrIntervalsSeconds, resampledTime);
    
    // RR 리샘플링 완료
    
    return resampledRR;
  }

  /**
   * 선형 보간
   */
  private interpolateLinear(xOriginal: number[], yOriginal: number[], xNew: number[]): number[] {
    const result: number[] = [];
    
    for (const x of xNew) {
      if (x <= xOriginal[0]) {
        result.push(yOriginal[0]);
      } else if (x >= xOriginal[xOriginal.length - 1]) {
        result.push(yOriginal[yOriginal.length - 1]);
      } else {
        // 선형 보간
        let i = 0;
        while (i < xOriginal.length - 1 && xOriginal[i + 1] < x) {
          i++;
        }
        
        const x1 = xOriginal[i];
        const x2 = xOriginal[i + 1];
        const y1 = yOriginal[i];
        const y2 = yOriginal[i + 1];
        
        const y = y1 + (y2 - y1) * (x - x1) / (x2 - x1);
        result.push(y);
      }
    }
    
    return result;
  }

  /**
   * Welch's Periodogram 계산 (HRV 분석 표준 방법)
   * 참고: scipy.signal.welch와 동일한 방식
   */
  private computeWelchPeriodogram(data: number[], samplingRate: number): {
    frequencies: number[];
    powerSpectralDensity: number[];
  } {
    // Welch Periodogram 계산 시작
    
    // 작은 데이터에 맞게 윈도우 크기 조정
    const minWindowSize = 8; // 최소 윈도우 크기
    const maxWindowSize = 64; // 최대 윈도우 크기 (원래 256에서 축소)
    const windowSize = Math.max(minWindowSize, Math.min(maxWindowSize, Math.floor(data.length / 2))); // 윈도우 크기
    const overlap = Math.floor(windowSize / 2); // 50% 오버랩
    const nfft = this.nextPowerOfTwo(windowSize); // FFT 크기
    
    // Welch Periodogram 파라미터
    
    // 주파수 배열 생성
    const frequencies: number[] = [];
    for (let i = 0; i <= nfft / 2; i++) {
      frequencies.push((i * samplingRate) / nfft);
    }
    
    // 세그먼트별 파워 스펙트럼 계산
    const powerSpectrums: number[][] = [];
    const hammingWindow = this.generateHammingWindow(windowSize);
    
    // 세그먼트 처리 시작
    let startIndex = 0;
    let segmentCount = 0;
    while (startIndex + windowSize <= data.length) {
      segmentCount++;
      
      // 세그먼트 추출 및 윈도우 적용
      const segment = data.slice(startIndex, startIndex + windowSize);
      const windowedSegment = segment.map((val, i) => val * hammingWindow[i]);
      
      // 제로 패딩
      const paddedSegment = new Array(nfft).fill(0);
      for (let i = 0; i < windowedSegment.length; i++) {
        paddedSegment[i] = windowedSegment[i];
      }
      
      // FFT 계산
      const fftResult = this.performFFT(paddedSegment);
      
      // 파워 스펙트럼 계산 (단면 스펙트럼)
      const powerSpectrum: number[] = [];
      for (let i = 0; i <= nfft / 2; i++) {
        const real = fftResult[2 * i] || 0;
        const imag = fftResult[2 * i + 1] || 0;
        let power = (real * real + imag * imag) / (samplingRate * windowSize);
        
        // DC와 Nyquist 주파수가 아닌 경우 2배 (양쪽 스펙트럼 합치기)
        if (i > 0 && i < nfft / 2) {
          power *= 2;
        }
        
        powerSpectrum.push(power);
      }
      
      powerSpectrums.push(powerSpectrum);
      startIndex += windowSize - overlap;
    }
    
    // Welch Periodogram 세그먼트 처리
    
    // 평균 파워 스펙트럼 밀도 계산
    const powerSpectralDensity = new Array(frequencies.length).fill(0);
    for (const spectrum of powerSpectrums) {
      for (let i = 0; i < spectrum.length; i++) {
        powerSpectralDensity[i] += spectrum[i];
      }
    }
    
    for (let i = 0; i < powerSpectralDensity.length; i++) {
      powerSpectralDensity[i] /= powerSpectrums.length;
    }
    
    return { frequencies, powerSpectralDensity };
  }

  /**
   * 주파수 대역에서 파워 적분
   */
  private integratePowerInBand(
    frequencies: number[], 
    powerSpectralDensity: number[], 
    lowFreq: number, 
    highFreq: number
  ): number {
    let power = 0;
    let count = 0;
    
    for (let i = 0; i < frequencies.length; i++) {
      const freq = frequencies[i];
      if (freq >= lowFreq && freq <= highFreq) {
        power += powerSpectralDensity[i];
        count++;
      }
    }
    
    // 주파수 해상도로 적분 (사다리꼴 규칙)
    const freqResolution = frequencies.length > 1 ? frequencies[1] - frequencies[0] : 1;
    return power * freqResolution;
  }

  /**
   * Hamming 윈도우 생성
   */
  private generateHammingWindow(size: number): number[] {
    const window: number[] = [];
    for (let i = 0; i < size; i++) {
      window.push(0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (size - 1)));
    }
    return window;
  }

  /**
   * 2의 거듭제곱 중 가장 가까운 큰 수 찾기
   */
  private nextPowerOfTwo(n: number): number {
    let power = 1;
    while (power < n) {
      power *= 2;
    }
    return power;
  }

  /**
   * FFT 계산 (실수 입력, 복소수 출력)
   */
  private performFFT(data: number[]): number[] {
    const n = data.length;
    if (n <= 1) return data;
    
    // 2의 거듭제곱인지 확인
    if ((n & (n - 1)) !== 0) {
      throw new Error('FFT 입력 크기는 2의 거듭제곱이어야 합니다');
    }
    
    // 복소수 배열 초기화 (실수부, 허수부 교대로 저장)
    const complex = new Array(n * 2);
    for (let i = 0; i < n; i++) {
      complex[2 * i] = data[i];     // 실수부
      complex[2 * i + 1] = 0;       // 허수부
    }
    
    // Bit-reversal permutation
    let j = 0;
    for (let i = 1; i < n; i++) {
      let bit = n >> 1;
      while (j & bit) {
        j ^= bit;
        bit >>= 1;
      }
      j ^= bit;
      
      if (i < j) {
        [complex[2 * i], complex[2 * j]] = [complex[2 * j], complex[2 * i]];
        [complex[2 * i + 1], complex[2 * j + 1]] = [complex[2 * j + 1], complex[2 * i + 1]];
      }
    }
    
    // FFT 계산
    let length = 2;
    while (length <= n) {
      const angle = -2 * Math.PI / length;
      const wreal = Math.cos(angle);
      const wimag = Math.sin(angle);
      
      for (let i = 0; i < n; i += length) {
        let wr = 1, wi = 0;
        
        for (let j = 0; j < length / 2; j++) {
          const u_real = complex[2 * (i + j)];
          const u_imag = complex[2 * (i + j) + 1];
          const v_real = complex[2 * (i + j + length / 2)] * wr - complex[2 * (i + j + length / 2) + 1] * wi;
          const v_imag = complex[2 * (i + j + length / 2)] * wi + complex[2 * (i + j + length / 2) + 1] * wr;
          
          complex[2 * (i + j)] = u_real + v_real;
          complex[2 * (i + j) + 1] = u_imag + v_imag;
          complex[2 * (i + j + length / 2)] = u_real - v_real;
          complex[2 * (i + j + length / 2) + 1] = u_imag - v_imag;
          
          const temp_wr = wr * wreal - wi * wimag;
          wi = wr * wimag + wi * wreal;
          wr = temp_wr;
        }
      }
      length *= 2;
    }
    
    return complex;
  }
} 