import { SimpleCircularBuffer, EEGDataPoint, PPGDataPoint, ACCDataPoint } from './SimpleCircularBuffer';

/**
 * Phase 1.5: 스마트 원형 버퍼
 * 
 * 기존 SimpleCircularBuffer의 문제점:
 * - 매번 필터링 수행으로 인한 CPU 오버헤드
 * - 고정 크기로 인한 메모리 비효율성
 * - 필터링 상태 관리 부족
 * 
 * 개선 사항:
 * - 지연 필터링 (Lazy Filtering)
 * - 메모리 풀링 및 자동 크기 조정
 * - 스마트 캐싱 시스템
 * - 성능 메트릭 추적
 */

export interface BufferMetrics {
  rawDataSize: number;
  filteredDataSize: number;
  memoryUsage: number;
  filteringTime: number;
  cacheHitRate: number;
  lastFilterTime: number;
}

export interface FilterOptions {
  enabled: boolean;
  type: 'none' | 'moving_average' | 'butterworth' | 'custom';
  windowSize?: number;
  cutoffFrequency?: number;
  customFilter?: (data: any[]) => any[];
}

/**
 * 스마트 원형 버퍼 기본 클래스
 * 지연 필터링과 메모리 최적화를 제공
 */
export class SmartCircularBuffer<T> {
  protected rawBuffer: T[];
  protected filteredBuffer: T[] | null = null;
  protected capacity: number;
  protected head: number = 0;
  protected tail: number = 0;
  protected size: number = 0;
  
  // 필터링 상태
  protected isDirty: boolean = false;
  protected isFiltering: boolean = false;
  protected filterOptions: FilterOptions;
  
  // 성능 메트릭
  protected metrics: BufferMetrics;
  
  // 메모리 풀링
  protected readonly MIN_CAPACITY = 100;
  protected readonly MAX_CAPACITY = 10000;
  protected readonly GROWTH_FACTOR = 1.5;
  
  constructor(initialCapacity: number, filterOptions: FilterOptions = { enabled: false, type: 'none' }) {
    this.capacity = Math.max(initialCapacity, this.MIN_CAPACITY);
    this.rawBuffer = new Array(this.capacity);
    this.filterOptions = filterOptions;
    
    this.metrics = {
      rawDataSize: 0,
      filteredDataSize: 0,
      memoryUsage: 0,
      filteringTime: 0,
      cacheHitRate: 0,
      lastFilterTime: 0
    };
  }
  
  /**
   * 데이터 추가 (스마트 메모리 관리)
   */
  push(item: T): void {
    // 버퍼 확장이 필요한 경우
    if (this.size >= this.capacity * 0.9) {
      this.expandBuffer();
    }
    
    this.rawBuffer[this.tail] = item;
    
    if (this.size < this.capacity) {
      this.size++;
    } else {
      this.head = (this.head + 1) % this.capacity;
    }
    
    this.tail = (this.tail + 1) % this.capacity;
    
    // 필터링이 필요함을 표시
    this.isDirty = true;
    this.filteredBuffer = null; // 캐시 무효화
    
    this.updateMetrics();
  }
  
  /**
   * 필터링된 데이터 반환 (지연 필터링)
   */
  getFiltered(): T[] {
    if (!this.filterOptions.enabled) {
      return this.toArray();
    }
    
    // 캐시된 필터링 결과가 유효한 경우
    if (!this.isDirty && this.filteredBuffer !== null) {
      this.metrics.cacheHitRate += 1;
      return this.filteredBuffer;
    }
    
    // 필터링 수행
    if (!this.isFiltering) {
      this.performFiltering();
    }
    
    return this.filteredBuffer || this.toArray();
  }
  
  /**
   * 원시 데이터 반환
   */
  toArray(): T[] {
    if (this.size === 0) return [];
    
    const result: T[] = [];
    let current = this.head;
    
    for (let i = 0; i < this.size; i++) {
      result.push(this.rawBuffer[current]);
      current = (current + 1) % this.capacity;
    }
    
    return result;
  }
  
  /**
   * 최신 n개 데이터 반환 (필터링 적용)
   */
  getLatest(count: number, filtered: boolean = true): T[] {
    const data = filtered ? this.getFiltered() : this.toArray();
    return data.slice(-count);
  }
  
  /**
   * 버퍼 확장 (메모리 풀링)
   */
  private expandBuffer(): void {
    const newCapacity = Math.min(
      Math.floor(this.capacity * this.GROWTH_FACTOR),
      this.MAX_CAPACITY
    );
    
    if (newCapacity <= this.capacity) return;
    
    // 새 버퍼 생성 및 데이터 복사
    const newBuffer = new Array(newCapacity);
    const currentData = this.toArray();
    
    for (let i = 0; i < currentData.length; i++) {
      newBuffer[i] = currentData[i];
    }
    
    this.rawBuffer = newBuffer;
    this.capacity = newCapacity;
    this.head = 0;
    this.tail = this.size;
    
    console.log(`SmartBuffer 확장: ${this.capacity} → ${newCapacity}`);
  }
  
  /**
   * 필터링 수행 (비동기적으로 처리 가능)
   */
  private performFiltering(): void {
    if (this.isFiltering || this.size === 0) return;
    
    this.isFiltering = true;
    const startTime = performance.now();
    
    try {
      const rawData = this.toArray();
      this.filteredBuffer = this.applyFilter(rawData);
      this.isDirty = false;
      this.metrics.lastFilterTime = Date.now();
    } catch (error) {
      console.error('SmartBuffer 필터링 오류:', error);
      this.filteredBuffer = this.toArray(); // 폴백
    } finally {
      this.isFiltering = false;
      this.metrics.filteringTime = performance.now() - startTime;
    }
  }
  
  /**
   * 필터 적용 (하위 클래스에서 오버라이드)
   */
  protected applyFilter(data: T[]): T[] {
    switch (this.filterOptions.type) {
      case 'moving_average':
        return this.applyMovingAverage(data);
      case 'custom':
        return this.filterOptions.customFilter ? this.filterOptions.customFilter(data) : data;
      default:
        return data;
    }
  }
  
  /**
   * 이동평균 필터
   */
  protected applyMovingAverage(data: T[]): T[] {
    const windowSize = this.filterOptions.windowSize || 5;
    if (data.length < windowSize) return data;
    
    // 이 메서드는 하위 클래스에서 타입별로 구현
    return data;
  }
  
  /**
   * 성능 메트릭 업데이트
   */
  private updateMetrics(): void {
    this.metrics.rawDataSize = this.size;
    this.metrics.filteredDataSize = this.filteredBuffer?.length || 0;
    this.metrics.memoryUsage = this.capacity * 32; // 추정값 (바이트)
  }
  
  /**
   * 필터 옵션 업데이트
   */
  setFilterOptions(options: Partial<FilterOptions>): void {
    this.filterOptions = { ...this.filterOptions, ...options };
    this.isDirty = true;
    this.filteredBuffer = null;
  }
  
  /**
   * 성능 메트릭 반환
   */
  getMetrics(): BufferMetrics {
    return { ...this.metrics };
  }
  
  /**
   * 버퍼 초기화
   */
  clear(): void {
    this.head = 0;
    this.tail = 0;
    this.size = 0;
    this.isDirty = false;
    this.filteredBuffer = null;
    this.updateMetrics();
  }
  
  /**
   * 현재 상태 정보
   */
  getStatus(): {
    size: number;
    capacity: number;
    utilizationRate: number;
    isDirty: boolean;
    isFiltering: boolean;
    hasFilteredCache: boolean;
  } {
    return {
      size: this.size,
      capacity: this.capacity,
      utilizationRate: this.size / this.capacity,
      isDirty: this.isDirty,
      isFiltering: this.isFiltering,
      hasFilteredCache: this.filteredBuffer !== null
    };
  }
  
  getSize(): number {
    return this.size;
  }
  
  getCapacity(): number {
    return this.capacity;
  }
  
  isEmpty(): boolean {
    return this.size === 0;
  }
  
  isFull(): boolean {
    return this.size >= this.capacity * 0.9; // 90% 이상이면 가득 참으로 간주
  }
}

/**
 * EEG 전용 스마트 버퍼
 */
export class SmartEEGBuffer extends SmartCircularBuffer<EEGDataPoint> {
  constructor(durationSeconds: number, samplingRate: number = 250) {
    const capacity = durationSeconds * samplingRate;
    super(capacity, {
      enabled: true,
      type: 'moving_average',
      windowSize: 5
    });
  }
  
  /**
   * EEG 전용 이동평균 필터
   */
  protected applyMovingAverage(data: EEGDataPoint[]): EEGDataPoint[] {
    const windowSize = this.filterOptions.windowSize || 5;
    if (data.length < windowSize) return data;
    
    const filtered: EEGDataPoint[] = [];
    
    for (let i = windowSize - 1; i < data.length; i++) {
      let fp1Sum = 0, fp2Sum = 0;
      let qualitySum = 0;
      
      for (let j = i - windowSize + 1; j <= i; j++) {
        fp1Sum += data[j].fp1;
        fp2Sum += data[j].fp2;
        qualitySum += data[j].signalQuality;
      }
      
      filtered.push({
        timestamp: data[i].timestamp,
        fp1: fp1Sum / windowSize,
        fp2: fp2Sum / windowSize,
        signalQuality: qualitySum / windowSize,
        leadOff: data[i].leadOff // 최신 상태 유지
      });
    }
    
    return filtered;
  }
  
  /**
   * 신호 품질 기반 자동 필터링
   */
  getQualityFilteredData(minQuality: number = 0.5): EEGDataPoint[] {
    const data = this.getFiltered();
    return data.filter(point => point.signalQuality >= minQuality);
  }
  
  /**
   * 채널별 데이터 추출
   */
  getChannelData(channel: 'fp1' | 'fp2'): [number, number][] {
    const data = this.getFiltered();
    return data.map(point => [point.timestamp, point[channel]]);
  }
  
  /**
   * 평균 신호 품질 계산
   */
  getAverageSignalQuality(): number {
    const data = this.getFiltered();
    if (data.length === 0) return 0;
    
    const sum = data.reduce((acc, point) => acc + point.signalQuality, 0);
    return sum / data.length;
  }
}

/**
 * PPG 전용 스마트 버퍼
 */
export class SmartPPGBuffer extends SmartCircularBuffer<PPGDataPoint> {
  constructor(durationSeconds: number, samplingRate: number = 50) {
    const capacity = durationSeconds * samplingRate;
    super(capacity, {
      enabled: true,
      type: 'moving_average',
      windowSize: 3
    });
  }
  
  /**
   * PPG 전용 이동평균 필터
   */
  protected applyMovingAverage(data: PPGDataPoint[]): PPGDataPoint[] {
    const windowSize = this.filterOptions.windowSize || 3;
    if (data.length < windowSize) return data;
    
    const filtered: PPGDataPoint[] = [];
    
    for (let i = windowSize - 1; i < data.length; i++) {
      let redSum = 0, irSum = 0;
      
      for (let j = i - windowSize + 1; j <= i; j++) {
        redSum += data[j].red;
        irSum += data[j].ir;
      }
      
      filtered.push({
        timestamp: data[i].timestamp,
        red: redSum / windowSize,
        ir: irSum / windowSize,
        leadOff: data[i].leadOff
      });
    }
    
    return filtered;
  }
  
  /**
   * 채널별 데이터 추출
   */
  getChannelData(channel: 'red' | 'ir'): [number, number][] {
    const data = this.getFiltered();
    return data.map(point => [point.timestamp, point[channel]]);
  }
  
  /**
   * 심박수 추정 (간단한 피크 검출)
   */
  estimateHeartRate(): number {
    const data = this.getFiltered();
    if (data.length < 50) return 0;
    
    // 최근 10초 데이터 사용
    const recentData = data.slice(-500); // 50Hz * 10초
    const irValues = recentData.map(point => point.ir);
    
    // 간단한 피크 검출
    let peaks = 0;
    for (let i = 1; i < irValues.length - 1; i++) {
      if (irValues[i] > irValues[i-1] && irValues[i] > irValues[i+1]) {
        peaks++;
      }
    }
    
    // BPM 계산 (10초 데이터 기준)
    return Math.round((peaks * 6));
  }
}

/**
 * ACC 전용 스마트 버퍼
 */
export class SmartACCBuffer extends SmartCircularBuffer<ACCDataPoint> {
  constructor(durationSeconds: number, samplingRate: number = 30) {
    const capacity = durationSeconds * samplingRate;
    super(capacity, {
      enabled: true,
      type: 'moving_average',
      windowSize: 3
    });
  }
  
  /**
   * ACC 전용 이동평균 필터
   */
  protected applyMovingAverage(data: ACCDataPoint[]): ACCDataPoint[] {
    const windowSize = this.filterOptions.windowSize || 3;
    if (data.length < windowSize) return data;
    
    const filtered: ACCDataPoint[] = [];
    
    for (let i = windowSize - 1; i < data.length; i++) {
      let xSum = 0, ySum = 0, zSum = 0;
      
      for (let j = i - windowSize + 1; j <= i; j++) {
        xSum += data[j].x;
        ySum += data[j].y;
        zSum += data[j].z;
      }
      
      const avgX = xSum / windowSize;
      const avgY = ySum / windowSize;
      const avgZ = zSum / windowSize;
      
      filtered.push({
        timestamp: data[i].timestamp,
        x: avgX,
        y: avgY,
        z: avgZ,
        magnitude: Math.sqrt(avgX * avgX + avgY * avgY + avgZ * avgZ)
      });
    }
    
    return filtered;
  }
  
  /**
   * 축별 데이터 추출
   */
  getAxisData(axis: 'x' | 'y' | 'z' | 'magnitude'): [number, number][] {
    const data = this.getFiltered();
    return data.map(point => [point.timestamp, point[axis]]);
  }
  
  /**
   * 움직임 강도 계산
   */
  getMovementIntensity(): number {
    const data = this.getFiltered();
    if (data.length < 10) return 0;
    
    // 최근 데이터의 magnitude 변화량 계산
    const recentData = data.slice(-30); // 최근 1초
    const magnitudes = recentData.map(point => point.magnitude);
    
    let totalVariation = 0;
    for (let i = 1; i < magnitudes.length; i++) {
      totalVariation += Math.abs(magnitudes[i] - magnitudes[i-1]);
    }
    
    return totalVariation / (magnitudes.length - 1);
  }
  
  /**
   * 활동 상태 분류
   */
  getActivityState(): 'rest' | 'light' | 'moderate' | 'vigorous' {
    const intensity = this.getMovementIntensity();
    
    if (intensity < 0.1) return 'rest';
    if (intensity < 0.3) return 'light';
    if (intensity < 0.6) return 'moderate';
    return 'vigorous';
  }
}

/**
 * 멀티 센서 스마트 버퍼 관리자
 */
export class SmartBufferManager {
  private eegBuffer: SmartEEGBuffer;
  private ppgBuffer: SmartPPGBuffer;
  private accBuffer: SmartACCBuffer;
  
  constructor(durationSeconds: number = 10) {
    this.eegBuffer = new SmartEEGBuffer(durationSeconds);
    this.ppgBuffer = new SmartPPGBuffer(durationSeconds);
    this.accBuffer = new SmartACCBuffer(durationSeconds);
  }
  
  /**
   * 모든 버퍼의 성능 메트릭 반환
   */
  getAllMetrics(): {
    eeg: BufferMetrics;
    ppg: BufferMetrics;
    acc: BufferMetrics;
    total: {
      totalMemoryUsage: number;
      totalDataPoints: number;
      averageFilteringTime: number;
    };
  } {
    const eegMetrics = this.eegBuffer.getMetrics();
    const ppgMetrics = this.ppgBuffer.getMetrics();
    const accMetrics = this.accBuffer.getMetrics();
    
    return {
      eeg: eegMetrics,
      ppg: ppgMetrics,
      acc: accMetrics,
      total: {
        totalMemoryUsage: eegMetrics.memoryUsage + ppgMetrics.memoryUsage + accMetrics.memoryUsage,
        totalDataPoints: eegMetrics.rawDataSize + ppgMetrics.rawDataSize + accMetrics.rawDataSize,
        averageFilteringTime: (eegMetrics.filteringTime + ppgMetrics.filteringTime + accMetrics.filteringTime) / 3
      }
    };
  }
  
  /**
   * 모든 버퍼 초기화
   */
  clearAll(): void {
    this.eegBuffer.clear();
    this.ppgBuffer.clear();
    this.accBuffer.clear();
  }
  
  /**
   * 개별 버퍼 접근자
   */
  getEEGBuffer(): SmartEEGBuffer {
    return this.eegBuffer;
  }
  
  getPPGBuffer(): SmartPPGBuffer {
    return this.ppgBuffer;
  }
  
  getACCBuffer(): SmartACCBuffer {
    return this.accBuffer;
  }
} 