/**
 * 고급 로깅 시스템
 * 
 * 기능:
 * - 다양한 로그 레벨 지원
 * - 구조화된 로깅 (JSON)
 * - 환경별 로깅 전략
 * - 로그 필터링 및 포맷팅
 * - 성능 메트릭 로깅
 * - 사용자 활동 추적
 * - 외부 로깅 서비스 연동 준비
 */

// === 로그 타입 정의 ===

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

export enum LogCategory {
  SYSTEM = 'system',
  AUTH = 'auth',
  DATABASE = 'database',
  API = 'api',
  USER_ACTION = 'user_action',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  BUSINESS = 'business',
  DEBUG = 'debug',
  DEVICE = 'device',
  SERVICE = 'service'
}

export interface LogContext {
  userId?: string;
  organizationId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
  action?: string;
  resource?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  category: LogCategory;
  service: string;
  message: string;
  context: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  environment: 'development' | 'production' | 'test';
  version?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableRemote: boolean;
  maxFileSize: number;
  maxFiles: number;
  remoteEndpoint?: string;
  enablePerformanceLogging: boolean;
  enableUserTracking: boolean;
  sensitiveFields?: string[];
}

export interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  details?: Record<string, any>;
}

export interface UserActivity {
  userId: string;
  organizationId?: string;
  action: string;
  resource: string;
  timestamp: Date;
  details?: Record<string, any>;
  result: 'success' | 'failure' | 'partial';
}

// === 로거 메인 클래스 ===

export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private userActivities: UserActivity[] = [];
  private sessionId: string;
  
  // 로그 통계
  private logStats: Map<LogLevel, number> = new Map();
  private errorPatterns: Map<string, number> = new Map();
  
  // 필터링 및 샘플링
  private logFilters: ((entry: LogEntry) => boolean)[] = [];
  private samplingRates: Map<LogCategory, number> = new Map();

  /**
   * 환경 안전 감지 메서드
   */
  private getEnvironment(): 'development' | 'production' | 'test' {
    try {
      // Vite 환경 (브라우저)
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        const mode = import.meta.env.MODE;
        if (mode === 'production' || mode === 'test') return mode;
        return 'development';
      }
      
      // Node.js 환경
      if (typeof process !== 'undefined' && process.env) {
        const env = process.env.NODE_ENV;
        if (env === 'production' || env === 'test') return env;
        return 'development';
      }
      
      // 기본값
      return 'development';
    } catch {
      return 'development';
    }
  }

  /**
   * 앱 버전 안전 감지 메서드
   */
  private getVersion(): string | undefined {
    try {
      // Vite 환경 (브라우저)
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        return import.meta.env.VITE_APP_VERSION;
      }
      
      // Node.js 환경
      if (typeof process !== 'undefined' && process.env) {
        return process.env.REACT_APP_VERSION;
      }
      
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * 프로세스 이벤트 리스너 안전 등록
   */
  private setupProcessHandlers(): void {
    try {
      if (typeof process !== 'undefined' && process.on) {
        process.on('exit', () => this.flushLogs());
        process.on('SIGINT', () => this.flushLogs());
        process.on('SIGTERM', () => this.flushLogs());
      } else {
        // 브라우저 환경에서는 beforeunload 이벤트 사용
        if (typeof window !== 'undefined') {
          window.addEventListener('beforeunload', () => this.flushLogs());
        }
      }
    } catch (error) {
      // 이벤트 리스너 등록 실패 시 무시
    }
  }

  private constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: this.getEnvironment() === 'production' ? LogLevel.WARN : LogLevel.DEBUG,
      enableConsole: true,
      enableFile: false,
      enableRemote: false,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      enablePerformanceLogging: true,
      enableUserTracking: true,
      sensitiveFields: ['password', 'token', 'apiKey', 'secret'],
      ...config
    };
    
    this.sessionId = this.generateSessionId();
    
    // 로그 레벨별 통계 초기화
    Object.values(LogLevel).forEach(level => {
      if (typeof level === 'number') {
        this.logStats.set(level, 0);
      }
    });
    
    // 기본 샘플링 레이트 설정
    
    // 버퍼 플러시 타이머 설정
    setInterval(() => this.flushLogs(), 5000);
    
    // 프로세스 종료 시 로그 플러시
    this.setupProcessHandlers();
  }

  public static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    }
    return Logger.instance;
  }

  // === 기본 로깅 메서드 ===

  /**
   * 디버그 로그
   */
  public debug(
    service: string,
    message: string,
    context: LogContext = {},
    category: LogCategory = LogCategory.DEBUG
  ): void {
  }

  /**
   * 경고 로그
   */
  public warn(
    service: string,
    message: string,
    context: LogContext = {},
    category: LogCategory = LogCategory.SYSTEM
  ): void {
  }

  /**
   * 치명적 에러 로그
   */
  public critical(
    service: string,
    message: string,
    error?: Error,
    context: LogContext = {},
    category: LogCategory = LogCategory.SYSTEM
  ): void {
    const logContext = { ...context };
    
    if (error) {
      logContext.metadata = {
        ...logContext.metadata,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      };
    }
    
  }

  // === 특수 로깅 메서드 ===

  /**
   * 성능 메트릭 로그
   */
  public performance(
    operation: string,
    duration: number,
    success: boolean = true,
    details?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: new Date(),
      success,
      details
    };
    
    this.performanceMetrics.push(metric);
    
    if (this.config.enablePerformanceLogging) {
    }
  }

  /**
   * 사용자 활동 로그
   */
  public userActivity(
    userId: string,
    action: string,
    resource: string,
    result: 'success' | 'failure' | 'partial' = 'success',
    organizationId?: string,
    details?: Record<string, any>
  ): void {
    const activity: UserActivity = {
      userId,
      organizationId,
      action,
      resource,
      timestamp: new Date(),
      details,
      result
    };
    
    this.userActivities.push(activity);
    
    if (this.config.enableUserTracking) {
    }
  }

  /**
   * 보안 관련 로그
   */
  public security(
    service: string,
    message: string,
    context: LogContext = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): void {
    const level = severity === 'critical' ? LogLevel.CRITICAL : 
                  severity === 'high' ? LogLevel.ERROR :
                  severity === 'medium' ? LogLevel.WARN : LogLevel.INFO;
    
    
    // 높은 보안 이벤트는 즉시 플러시
    if (severity === 'critical' || severity === 'high') {
      this.flushLogs();
    }
  }

  /**
   * API 요청/응답 로그
   */
  public apiLog(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context: LogContext = {}
  ): void {
    const level = statusCode >= 500 ? LogLevel.ERROR :
                  statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    
  }

  // === 핵심 로깅 로직 ===

  /**
   * 메인 로깅 메서드
   */
  private log(
    level: LogLevel,
    service: string,
    message: string,
    context: LogContext,
    category: LogCategory,
    error?: Error
  ): void {
    // 로그 레벨 필터링
    if (level < this.config.level) {
      return;
    }
    
    // 샘플링 적용
    if (!this.shouldLog(category)) {
      return;
    }
    
    // 민감한 데이터 마스킹
    const sanitizedContext = this.sanitizeContext(context);
    
    // 로그 엔트리 생성
    const logEntry: LogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      level,
      category,
      service,
      message,
      context: sanitizedContext,
      environment: this.getEnvironment(),
      version: this.getVersion()
    };
    
    // 에러 정보 추가
    if (context.metadata?.error) {
      logEntry.error = context.metadata.error;
    }
    
    // 커스텀 필터 적용
    if (!this.passesFilters(logEntry)) {
      return;
    }
    
    // 로그 버퍼에 추가
    this.logBuffer.push(logEntry);
    
    // 통계 업데이트
    this.updateStats(level, logEntry);
    
    // 콘솔 출력 (개발 환경 또는 설정 시)
    if (this.config.enableConsole) {
      this.outputToConsole(logEntry);
    }
    
    // 긴급한 로그는 즉시 플러시
    if (level >= LogLevel.ERROR) {
      this.flushLogs();
    }
  }

  // === 유틸리티 메서드 ===

  /**
   * 샘플링 여부 결정
   */
  private shouldLog(category: LogCategory): boolean {
    const rate = this.samplingRates.get(category) || 1.0;
    return Math.random() < rate;
  }

  /**
   * 민감한 데이터 마스킹
   */
  private sanitizeContext(context: LogContext): LogContext {
    const sanitized = { ...context };
    
    if (sanitized.metadata) {
      sanitized.metadata = { ...sanitized.metadata };
      
      this.config.sensitiveFields?.forEach(field => {
        if (sanitized.metadata![field]) {
          sanitized.metadata![field] = '***MASKED***';
        }
      });
    }
    
    return sanitized;
  }

  /**
   * 커스텀 필터 통과 여부 확인
   */
  private passesFilters(entry: LogEntry): boolean {
    return this.logFilters.every(filter => filter(entry));
  }

  /**
   * 통계 업데이트
   */
  private updateStats(level: LogLevel, entry: LogEntry): void {
    const count = this.logStats.get(level) || 0;
    this.logStats.set(level, count + 1);
    
    // 에러 패턴 추적
    if (level >= LogLevel.ERROR && entry.error) {
      const pattern = entry.error.name;
      const patternCount = this.errorPatterns.get(pattern) || 0;
      this.errorPatterns.set(pattern, patternCount + 1);
    }
  }

  /**
   * 콘솔 출력
   */
  private outputToConsole(entry: LogEntry): void {
    const emoji = this.getLevelEmoji(entry.level);
    const timestamp = entry.timestamp.toISOString();
    const prefix = `${emoji} [${timestamp}] [${entry.service}]`;
    
    const logData = {
      message: entry.message,
      category: entry.category,
      context: entry.context,
      ...(entry.error && { error: entry.error })
    };
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, logData);
        break;
      case LogLevel.INFO:
        console.log(prefix, logData);
        break;
      case LogLevel.WARN:
        console.warn(prefix, logData);
        break;
      case LogLevel.ERROR:
        console.error(prefix, logData);
        break;
      case LogLevel.CRITICAL:
        console.error(`🚨 CRITICAL ${prefix}`, logData);
        break;
    }
  }

  /**
   * 로그 레벨별 이모지
   */
  private getLevelEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '🔍';
      case LogLevel.INFO: return '✅';
      case LogLevel.WARN: return '⚠️';
      case LogLevel.ERROR: return '❌';
      case LogLevel.CRITICAL: return '🚨';
      default: return '📝';
    }
  }

  /**
   * 로그 플러시 (외부 서비스로 전송)
   */
  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) {
      return;
    }
    
    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];
    
    try {
      // 파일 출력
      if (this.config.enableFile) {
        await this.writeToFile(logsToFlush);
      }
      
      // 원격 서비스 전송
      if (this.config.enableRemote && this.config.remoteEndpoint) {
        await this.sendToRemote(logsToFlush);
      }
      
    } catch (error) {
      console.error('로그 플러시 실패:', error);
      // 실패한 로그들을 버퍼에 다시 추가
      this.logBuffer.unshift(...logsToFlush);
    }
  }

  /**
   * 파일에 로그 쓰기
   */
  private async writeToFile(logs: LogEntry[]): Promise<void> {
    // TODO: 파일 시스템 접근이 가능한 환경에서 구현
    // 브라우저 환경에서는 IndexedDB 사용 고려
    console.debug('File logging not implemented in browser environment');
  }

  /**
   * 원격 서비스로 로그 전송
   */
  private async sendToRemote(logs: LogEntry[]): Promise<void> {
    if (!this.config.remoteEndpoint) {
      return;
    }
    
    try {
      const response = await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error(`Remote logging failed: ${response.status}`);
      }
      
    } catch (error) {
      console.error('원격 로깅 실패:', error);
      throw error;
    }
  }

  // === 설정 및 제어 메서드 ===

  /**
   * 로그 레벨 변경
   */
  public setLogLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * 커스텀 필터 추가
   */
  public addFilter(filter: (entry: LogEntry) => boolean): void {
    this.logFilters.push(filter);
  }

  /**
   * 샘플링 레이트 설정
   */
  public setSamplingRate(category: LogCategory, rate: number): void {
    this.samplingRates.set(category, Math.max(0, Math.min(1, rate)));
  }

  /**
   * 설정 업데이트
   */
  public updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // === 조회 메서드 ===

  /**
   * 로그 통계 조회
   */
  public getStats(): Map<LogLevel, number> {
    return new Map(this.logStats);
  }

  /**
   * 에러 패턴 조회
   */
  public getErrorPatterns(): Map<string, number> {
    return new Map(this.errorPatterns);
  }

  /**
   * 성능 메트릭 조회
   */
  public getPerformanceMetrics(limit: number = 100): PerformanceMetric[] {
    return this.performanceMetrics.slice(-limit);
  }

  /**
   * 사용자 활동 조회
   */
  public getUserActivities(limit: number = 100): UserActivity[] {
    return this.userActivities.slice(-limit);
  }

  /**
   * 현재 버퍼 상태 조회
   */
  public getBufferStatus(): { count: number; size: number } {
    return {
      count: this.logBuffer.length,
      size: JSON.stringify(this.logBuffer).length
    };
  }

  // === ID 생성 ===

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// === 편의 함수들 ===

// 싱글톤 인스턴스
let defaultLogger: Logger | null = null;

/**
 * 기본 로거 인스턴스 가져오기
 */
export function getDefaultLogger(): Logger {
  if (!defaultLogger) {
    defaultLogger = Logger.getInstance();
  }
  return defaultLogger;
}

/**
 * 성능 측정 데코레이터
 */
export function logPerformance(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  
  descriptor.value = async function (...args: any[]) {
    const logger = getDefaultLogger();
    const start = Date.now();
    let success = true;
    
    try {
      const result = await originalMethod.apply(this, args);
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = Date.now() - start;
      logger.performance(
        `${target.constructor.name}.${propertyKey}`,
        duration,
        success,
        { args: args.length }
      );
    }
  };
  
  return descriptor;
}

/**
 * 간편 로깅 함수들
 */
export const log = {
  debug: (service: string, message: string, context?: LogContext) => 
    getDefaultLogger().debug(service, message, context),
  
  info: (service: string, message: string, context?: LogContext) => 
    getDefaultLogger().info(service, message, context),
  
  warn: (service: string, message: string, context?: LogContext) => 
    getDefaultLogger().warn(service, message, context),
  
  error: (service: string, message: string, error?: Error, context?: LogContext) => 
    getDefaultLogger().error(service, message, error, context),
  
  critical: (service: string, message: string, error?: Error, context?: LogContext) => 
    getDefaultLogger().critical(service, message, error, context),
  
  performance: (operation: string, duration: number, success?: boolean, details?: Record<string, any>) =>
    getDefaultLogger().performance(operation, duration, success, details),
  
  userActivity: (userId: string, action: string, resource: string, result?: 'success' | 'failure' | 'partial', organizationId?: string, details?: Record<string, any>) =>
    getDefaultLogger().userActivity(userId, action, resource, result, organizationId, details),
  
  security: (service: string, message: string, context?: LogContext, severity?: 'low' | 'medium' | 'high' | 'critical') =>
    getDefaultLogger().security(service, message, context, severity),
  
  api: (method: string, url: string, statusCode: number, duration: number, context?: LogContext) =>
    getDefaultLogger().apiLog(method, url, statusCode, duration, context)
};

// 기본 로거 인스턴스 내보내기
export const logger = getDefaultLogger(); 