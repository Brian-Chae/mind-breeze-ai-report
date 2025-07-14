import { useDeviceStore } from '../stores/deviceStore';
import { bluetoothService } from '../utils/bluetoothService';
import type { SystemStats } from '../stores/deviceStore';

/**
 * 디바이스 상태 모니터링 서비스
 * 성능 최적화: 작업별 다른 주기 적용 및 비동기 처리
 */
export class DeviceStatusMonitor {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private statisticsInterval: NodeJS.Timeout | null = null;
  private loggingInterval: NodeJS.Timeout | null = null;
  
  private isRunning = false;
  
  // Phase 1.6: 타이머 기반 모니터링 (배터리는 이벤트 기반으로 변경됨)
  private readonly MAIN_INTERVAL = 2000;      // 2초 - 기본 모니터링
  private readonly STATISTICS_INTERVAL = 1000; // 1초 - 데이터 통계
  private readonly LOGGING_INTERVAL = 5000;   // 5초 - 로깅
  
  // 데이터 카운터
  private sampleCounters = {
    eeg: 0,
    ppg: 0, 
    acc: 0,
    lastReset: Date.now()
  };

  // 성능 모니터링
  private performanceMetrics = {
    lastExecutionTime: 0,
    averageExecutionTime: 0,
    maxExecutionTime: 0,
    executionCount: 0
  };

  constructor() {
    this.bindMethods();
  }

  private bindMethods() {
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.monitorDeviceStatus = this.monitorDeviceStatus.bind(this);
    this.handleBatteryEvent = this.handleBatteryEvent.bind(this);
    this.updateDataStatistics = this.updateDataStatistics.bind(this);
    this.logSystemStatus = this.logSystemStatus.bind(this);
  }

  /**
   * Phase 1.6: 이벤트 기반 디바이스 상태 모니터링 시작
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    useDeviceStore.getState().startSystemMonitoring();
    
    // Phase 1.6: 배터리 이벤트 리스너 등록
    bluetoothService.addEventListener('battery_data', this.handleBatteryEvent.bind(this));
    
    // 기존 타이머 기반 모니터링 (배터리 제외)
    this.monitoringInterval = setInterval(this.monitorDeviceStatus, this.MAIN_INTERVAL);
    this.statisticsInterval = setInterval(this.updateDataStatistics, this.STATISTICS_INTERVAL);
    this.loggingInterval = setInterval(this.logSystemStatus, this.LOGGING_INTERVAL);
  }

  /**
   * Phase 1.6: 이벤트 기반 디바이스 상태 모니터링 중지
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    useDeviceStore.getState().stopSystemMonitoring();
    
    // Phase 1.6: 배터리 이벤트 리스너 제거 (향후 개선 필요)
    // 현재는 bind된 함수로 인해 정확한 제거가 어려움
    
    // 타이머 정리 (배터리 제외)
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    if (this.statisticsInterval) {
      clearInterval(this.statisticsInterval);
      this.statisticsInterval = null;
    }
    if (this.loggingInterval) {
      clearInterval(this.loggingInterval);
      this.loggingInterval = null;
    }
  }

  /**
   * 데이터 수신 카운터 업데이트 (외부에서 호출)
   */
  updateDataCounter(type: 'eeg' | 'ppg' | 'acc', count: number): void {
    this.sampleCounters[type] += count;
  }

  /**
   * 가벼운 디바이스 상태 모니터링 (2초마다 실행)
   */
  private async monitorDeviceStatus(): Promise<void> {
    const startTime = performance.now();
    
    try {
      const deviceStore = useDeviceStore.getState();
      
      // 연결 상태 확인
      if (!deviceStore.isConnected) {
        return;
      }

      // 1. 연결 지속 시간 업데이트 (가벼운 작업)
      deviceStore.updateConnectionDuration();

      // 2. 신호 품질 평가 (계산 기반, Bluetooth 통신 없음)
      this.updateSignalQuality();

    } catch (error) {
      console.error('Error in device status monitoring:', error);
      useDeviceStore.getState().addSystemError(
        `Monitoring error: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      this.updatePerformanceMetrics(performance.now() - startTime);
    }
  }

  /**
   * Phase 1.6: 배터리 이벤트 핸들러 (폴링 제거)
   */
  private handleBatteryEvent(event: Event): void {
    try {
      const customEvent = event as CustomEvent;
      const batteryData = customEvent.detail;
      
      if (batteryData && typeof batteryData.level === 'number') {
        useDeviceStore.getState().updateBatteryLevel(batteryData.level);
      }
      
    } catch (error) {
      console.error('배터리 이벤트 처리 오류:', error);
    }
  }

  /**
   * 데이터 수신 통계 업데이트 (1초마다 실행)
   */
  private updateDataStatistics(): void {
    const now = Date.now();
    const timeDiff = (now - this.sampleCounters.lastReset) / 1000; // 초 단위

    if (timeDiff >= 1.0) { // 1초마다 통계 업데이트
      const stats: Partial<SystemStats> = {
        eegSamplesPerSecond: Math.round(this.sampleCounters.eeg / timeDiff),
        ppgSamplesPerSecond: Math.round(this.sampleCounters.ppg / timeDiff),
        accSamplesPerSecond: Math.round(this.sampleCounters.acc / timeDiff),
        totalDataReceived: this.sampleCounters.eeg + this.sampleCounters.ppg + this.sampleCounters.acc
      };

      useDeviceStore.getState().updateDataStats(stats);

      // 카운터 리셋
      this.sampleCounters = {
        eeg: 0,
        ppg: 0,
        acc: 0,
        lastReset: now
      };
    }
  }

  /**
   * 신호 품질 평가 (계산 기반, Bluetooth 통신 없음)
   */
  private updateSignalQuality(): void {
    const { systemStatus } = useDeviceStore.getState();
    const { dataStats } = systemStatus;
    
    let quality: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown' = 'unknown';

    // EEG 샘플링 레이트를 기준으로 신호 품질 평가
    const expectedEegRate = 250; // LINK BAND의 기대 EEG 샘플링 레이트
    const eegEfficiency = dataStats.eegSamplesPerSecond / expectedEegRate;

    if (eegEfficiency >= 0.95) {
      quality = 'excellent';
    } else if (eegEfficiency >= 0.85) {
      quality = 'good';
    } else if (eegEfficiency >= 0.70) {
      quality = 'fair';
    } else if (eegEfficiency > 0) {
      quality = 'poor';
    } else {
      quality = 'unknown';
    }

    // 배터리 레벨도 고려
    if (systemStatus.batteryLevel !== null && systemStatus.batteryLevel < 20) {
      if (quality === 'excellent') quality = 'good';
      else if (quality === 'good') quality = 'fair';
    }

    useDeviceStore.getState().updateSignalQuality(quality);
  }

  /**
   * 시스템 상태 로깅 (5초마다 실행, 성능 최적화)
   */
  private logSystemStatus(): void {
    try {
      const { systemStatus, connectionState } = useDeviceStore.getState();
      
      const logEntry = {
        timestamp: new Date().toISOString(),
        deviceId: connectionState.device?.id || 'unknown',
        deviceName: connectionState.device?.name || 'unknown',
        connectionStatus: connectionState.status,
        connectionDuration: systemStatus.connectionDuration,
        batteryLevel: systemStatus.batteryLevel,
        signalQuality: systemStatus.signalQuality,
        eegSamplesPerSecond: systemStatus.dataStats.eegSamplesPerSecond,
        ppgSamplesPerSecond: systemStatus.dataStats.ppgSamplesPerSecond,
        accSamplesPerSecond: systemStatus.dataStats.accSamplesPerSecond,
        totalDataReceived: systemStatus.dataStats.totalDataReceived,
        errorCount: systemStatus.errors.length,
        avgExecutionTime: this.performanceMetrics.averageExecutionTime
      };

      // 비동기적으로 localStorage에 저장 (메인 스레드 블로킹 방지)
      setTimeout(() => this.saveSystemLogToStorage(logEntry), 0);
      
    } catch (error) {
      console.error('Failed to log system status:', error);
    }
  }

  /**
   * 성능 메트릭 업데이트
   */
  private updatePerformanceMetrics(executionTime: number): void {
    this.performanceMetrics.lastExecutionTime = executionTime;
    this.performanceMetrics.executionCount++;
    
    // 최대 실행 시간 업데이트
    if (executionTime > this.performanceMetrics.maxExecutionTime) {
      this.performanceMetrics.maxExecutionTime = executionTime;
    }
    
    // 평균 실행 시간 계산 (이동 평균)
    const alpha = 0.1; // 평활화 계수
    this.performanceMetrics.averageExecutionTime = 
      alpha * executionTime + (1 - alpha) * this.performanceMetrics.averageExecutionTime;
    
    // 성능 경고 (중요한 경고만 유지)
    if (executionTime > 100) { // 100ms 이상
      console.warn(`DeviceStatusMonitor execution took ${executionTime.toFixed(2)}ms`);
    }
  }

  /**
   * 시스템 로그를 localStorage에 저장 (비동기 처리)
   */
  private saveSystemLogToStorage(logEntry: any): void {
    try {
      const existingLogs = JSON.parse(localStorage.getItem('linkband_system_logs') || '[]');
      existingLogs.push(logEntry);
      
      // 최대 500개 로그만 유지 (메모리 최적화)
      if (existingLogs.length > 500) {
        existingLogs.splice(0, existingLogs.length - 500);
      }
      
      localStorage.setItem('linkband_system_logs', JSON.stringify(existingLogs));
    } catch (error) {
      console.error('Failed to save system log:', error);
    }
  }

  /**
   * 시스템 로그를 CSV 형태로 내보내기
   */
  exportSystemLogsAsCSV(): string {
    try {
      const logs = JSON.parse(localStorage.getItem('linkband_system_logs') || '[]');
      
      if (logs.length === 0) {
        return '';
      }

      // CSV 헤더
      const headers = Object.keys(logs[0]).join(',');
      
      // CSV 데이터
      const csvData = logs.map((log: any) => 
        Object.values(log).map(value => 
          typeof value === 'string' ? `"${value}"` : value
        ).join(',')
      ).join('\n');

      return headers + '\n' + csvData;
    } catch (error) {
      console.error('Failed to export system logs:', error);
      return '';
    }
  }

  /**
   * 시스템 로그 다운로드
   */
  downloadSystemLogs(): void {
    const csv = this.exportSystemLogsAsCSV();
    if (!csv) {
      console.warn('No system logs to download');
      return;
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `linkband_system_logs_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * 현재 실행 상태 확인
   */
  get running(): boolean {
    return this.isRunning;
  }
}

// 싱글톤 인스턴스
export const deviceStatusMonitor = new DeviceStatusMonitor(); 