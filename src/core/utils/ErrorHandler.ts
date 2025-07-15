/**
 * 체계적인 에러 처리 시스템
 * 
 * 기능:
 * - 다양한 에러 타입 지원
 * - 에러 코드 체계화
 * - 사용자 친화적 메시지 변환
 * - 에러 로깅 및 추적
 * - 재시도 로직
 * - Firebase 에러 처리 특화
 */

// === 에러 타입 정의 ===

export enum ErrorCodes {
  // 조직 관리 에러
  ORGANIZATION_NOT_FOUND = 'ORG_001',
  ORGANIZATION_ALREADY_EXISTS = 'ORG_002',
  ORGANIZATION_INACTIVE = 'ORG_003',
  ORGANIZATION_EXPIRED = 'ORG_004',
  
  // 멤버 관리 에러
  MEMBER_NOT_FOUND = 'MEM_001',
  MEMBER_ALREADY_EXISTS = 'MEM_002',
  MEMBER_INACTIVE = 'MEM_003',
  MEMBER_PERMISSION_DENIED = 'MEM_004',
  INVITATION_EXPIRED = 'MEM_005',
  INVITATION_ALREADY_USED = 'MEM_006',
  
  // 크레딧 관리 에러
  CREDIT_INSUFFICIENT = 'CRD_001',
  CREDIT_INVALID_AMOUNT = 'CRD_002',
  CREDIT_TRANSACTION_FAILED = 'CRD_003',
  CREDIT_REFUND_FAILED = 'CRD_004',
  
  // 디바이스 관리 에러
  DEVICE_NOT_FOUND = 'DEV_001',
  DEVICE_NOT_AVAILABLE = 'DEV_002',
  DEVICE_CONNECTION_FAILED = 'DEV_003',
  DEVICE_OFFLINE = 'DEV_004',
  
  // 인증 및 권한 에러
  PERMISSION_DENIED = 'AUTH_001',
  AUTHENTICATION_REQUIRED = 'AUTH_002',
  INVALID_CREDENTIALS = 'AUTH_003',
  SESSION_EXPIRED = 'AUTH_004',
  
  // 데이터 검증 에러
  VALIDATION_FAILED = 'VAL_001',
  INVALID_EMAIL = 'VAL_002',
  INVALID_PHONE = 'VAL_003',
  REQUIRED_FIELD_MISSING = 'VAL_004',
  INVALID_DATE_FORMAT = 'VAL_005',
  
  // 네트워크 및 서비스 에러
  NETWORK_ERROR = 'NET_001',
  SERVICE_UNAVAILABLE = 'NET_002',
  TIMEOUT_ERROR = 'NET_003',
  RATE_LIMIT_EXCEEDED = 'NET_004',
  
  // AI 리포트 에러
  REPORT_GENERATION_FAILED = 'RPT_001',
  REPORT_NOT_FOUND = 'RPT_002',
  REPORT_INVALID_DATA = 'RPT_003',
  REPORT_QUOTA_EXCEEDED = 'RPT_004',
  
  // 시스템 에러
  INTERNAL_SERVER_ERROR = 'SYS_001',
  DATABASE_ERROR = 'SYS_002',
  CONFIGURATION_ERROR = 'SYS_003',
  UNKNOWN_ERROR = 'SYS_999'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorContext {
  userId?: string;
  organizationId?: string;
  action?: string;
  resource?: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
  requestId?: string;
}

export interface ErrorLogEntry {
  id: string;
  code: ErrorCodes;
  message: string;
  severity: ErrorSeverity;
  context: ErrorContext;
  originalError?: any;
  stackTrace?: string;
  timestamp: Date;
  resolved?: boolean;
  retryCount?: number;
}

// === 커스텀 에러 클래스들 ===

/**
 * 기본 서비스 에러 클래스
 */
export class ServiceError extends Error {
  public readonly code: ErrorCodes;
  public readonly severity: ErrorSeverity;
  public readonly context: ErrorContext;
  public readonly isRetryable: boolean;
  public readonly userMessage: string;
  
  constructor(
    code: ErrorCodes,
    message: string,
    context: ErrorContext = {},
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    isRetryable: boolean = false,
    userMessage?: string
  ) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.severity = severity;
    this.context = { ...context, timestamp: new Date() };
    this.isRetryable = isRetryable;
    this.userMessage = userMessage || ErrorHandler.getDefaultUserMessage(code);
  }
}

/**
 * 검증 에러 클래스
 */
export class ValidationError extends ServiceError {
  public readonly field: string;
  public readonly value: any;
  
  constructor(
    field: string,
    value: any,
    message: string,
    context: ErrorContext = {}
  ) {
    super(
      ErrorCodes.VALIDATION_FAILED,
      message,
      { 
        ...context, 
        metadata: { 
          ...context.metadata,
          field, 
          value 
        } 
      },
      ErrorSeverity.LOW,
      false,
      message
    );
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

/**
 * 네트워크 에러 클래스
 */
export class NetworkError extends ServiceError {
  public readonly statusCode?: number;
  public readonly url?: string;
  
  constructor(
    message: string,
    statusCode?: number,
    url?: string,
    context: ErrorContext = {}
  ) {
    super(
      ErrorCodes.NETWORK_ERROR,
      message,
      { 
        ...context, 
        metadata: { 
          ...context.metadata,
          statusCode, 
          url 
        } 
      },
      ErrorSeverity.HIGH,
      true,
      '네트워크 연결을 확인해주세요.'
    );
    this.name = 'NetworkError';
    this.statusCode = statusCode;
    this.url = url;
  }
}

/**
 * 권한 에러 클래스
 */
export class PermissionError extends ServiceError {
  public readonly requiredPermission: string;
  public readonly currentRole?: string;
  
  constructor(
    requiredPermission: string,
    currentRole?: string,
    context: ErrorContext = {}
  ) {
    super(
      ErrorCodes.PERMISSION_DENIED,
      `권한이 부족합니다. 필요 권한: ${requiredPermission}`,
      { 
        ...context, 
        metadata: { 
          ...context.metadata,
          requiredPermission, 
          currentRole 
        } 
      },
      ErrorSeverity.MEDIUM,
      false,
      '이 작업을 수행할 권한이 없습니다.'
    );
    this.name = 'PermissionError';
    this.requiredPermission = requiredPermission;
    this.currentRole = currentRole;
  }
}

// === 에러 핸들러 메인 클래스 ===

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLogs: Map<string, ErrorLogEntry> = new Map();
  private errorStats: Map<ErrorCodes, number> = new Map();
  private retryableErrors: Set<ErrorCodes> = new Set([
    ErrorCodes.NETWORK_ERROR,
    ErrorCodes.SERVICE_UNAVAILABLE,
    ErrorCodes.TIMEOUT_ERROR,
    ErrorCodes.DATABASE_ERROR
  ]);

  private constructor() {
    // 싱글톤 패턴
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * 에러를 처리하고 로깅
   * @param error 원본 에러
   * @param context 에러 컨텍스트
   * @returns 처리된 ServiceError
   */
  public handleError(error: any, context: ErrorContext = {}): ServiceError {
    let serviceError: ServiceError;

    if (error instanceof ServiceError) {
      serviceError = error;
    } else {
      // 일반 에러를 ServiceError로 변환
      serviceError = this.convertToServiceError(error, context);
    }

    // 에러 로깅
    this.logError(serviceError);
    
    // 통계 업데이트
    this.updateErrorStats(serviceError.code);

    return serviceError;
  }

  /**
   * Firebase 에러를 ServiceError로 변환
   * @param firebaseError Firebase 에러
   * @param context 에러 컨텍스트
   * @returns 변환된 ServiceError
   */
  public handleFirebaseError(firebaseError: any, context: ErrorContext = {}): ServiceError {
    const errorCode = firebaseError?.code;
    let serviceErrorCode: ErrorCodes;
    let userMessage: string;
    let severity: ErrorSeverity = ErrorSeverity.MEDIUM;

    switch (errorCode) {
      case 'permission-denied':
        serviceErrorCode = ErrorCodes.PERMISSION_DENIED;
        userMessage = '접근 권한이 없습니다.';
        break;
      case 'not-found':
        serviceErrorCode = ErrorCodes.ORGANIZATION_NOT_FOUND;
        userMessage = '요청한 데이터를 찾을 수 없습니다.';
        break;
      case 'already-exists':
        serviceErrorCode = ErrorCodes.ORGANIZATION_ALREADY_EXISTS;
        userMessage = '이미 존재하는 데이터입니다.';
        break;
      case 'resource-exhausted':
        serviceErrorCode = ErrorCodes.RATE_LIMIT_EXCEEDED;
        userMessage = '서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해주세요.';
        severity = ErrorSeverity.HIGH;
        break;
      case 'unauthenticated':
        serviceErrorCode = ErrorCodes.AUTHENTICATION_REQUIRED;
        userMessage = '인증이 필요합니다. 다시 로그인해주세요.';
        break;
      case 'unavailable':
        serviceErrorCode = ErrorCodes.SERVICE_UNAVAILABLE;
        userMessage = '서비스가 일시적으로 사용할 수 없습니다.';
        severity = ErrorSeverity.HIGH;
        break;
      default:
        serviceErrorCode = ErrorCodes.DATABASE_ERROR;
        userMessage = '데이터베이스 오류가 발생했습니다.';
        severity = ErrorSeverity.HIGH;
    }

    return new ServiceError(
      serviceErrorCode,
      firebaseError?.message || '알 수 없는 Firebase 오류',
      { 
        ...context, 
        metadata: { 
          ...context.metadata,
          firebaseCode: errorCode 
        } 
      },
      severity,
      this.retryableErrors.has(serviceErrorCode),
      userMessage
    );
  }

  /**
   * 일반 에러를 ServiceError로 변환
   */
  private convertToServiceError(error: any, context: ErrorContext): ServiceError {
    if (error instanceof Error) {
      // 네트워크 에러 감지
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return new NetworkError(error.message, undefined, undefined, context);
      }
      
      // 검증 에러 감지
      if (error.message.includes('validation') || error.message.includes('required')) {
        return new ValidationError('unknown', undefined, error.message, context);
      }
      
      return new ServiceError(
        ErrorCodes.UNKNOWN_ERROR,
        error.message,
        context,
        ErrorSeverity.MEDIUM,
        false
      );
    }

    return new ServiceError(
      ErrorCodes.UNKNOWN_ERROR,
      String(error),
      context,
      ErrorSeverity.MEDIUM,
      false
    );
  }

  /**
   * 에러 로깅
   */
  private logError(error: ServiceError): void {
    const logEntry: ErrorLogEntry = {
      id: this.generateErrorId(),
      code: error.code,
      message: error.message,
      severity: error.severity,
      context: error.context,
      originalError: error,
      stackTrace: error.stack,
      timestamp: new Date(),
      resolved: false,
      retryCount: 0
    };

    this.errorLogs.set(logEntry.id, logEntry);

    // 콘솔 로깅 (개발 환경)
    if (process.env.NODE_ENV === 'development') {
      const logMethod = this.getLogMethod(error.severity);
      logMethod(`🚨 [${error.code}] ${error.message}`, {
        context: error.context,
        severity: error.severity,
        userMessage: error.userMessage,
        isRetryable: error.isRetryable
      });
    }

    // 프로덕션 환경에서는 외부 로깅 서비스로 전송
    if (process.env.NODE_ENV === 'production' && error.severity === ErrorSeverity.CRITICAL) {
      this.sendToExternalLogging(logEntry);
    }
  }

  /**
   * 에러 통계 업데이트
   */
  private updateErrorStats(code: ErrorCodes): void {
    const count = this.errorStats.get(code) || 0;
    this.errorStats.set(code, count + 1);
  }

  /**
   * 에러 재시도 가능 여부 확인
   */
  public isRetryable(error: ServiceError): boolean {
    return error.isRetryable && this.retryableErrors.has(error.code);
  }

  /**
   * 에러 재시도 실행
   */
  public async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: ServiceError | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = this.handleError(error);
        
        if (!this.isRetryable(lastError) || attempt === maxRetries) {
          throw lastError;
        }
        
        // 지수 백오프 지연
        const delay = delayMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * 에러 통계 조회
   */
  public getErrorStats(): Map<ErrorCodes, number> {
    return new Map(this.errorStats);
  }

  /**
   * 최근 에러 로그 조회
   */
  public getRecentErrors(limit: number = 10): ErrorLogEntry[] {
    return Array.from(this.errorLogs.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * 기본 사용자 메시지 반환
   */
  public static getDefaultUserMessage(code: ErrorCodes): string {
    const messages: Record<ErrorCodes, string> = {
      [ErrorCodes.ORGANIZATION_NOT_FOUND]: '조직을 찾을 수 없습니다.',
      [ErrorCodes.ORGANIZATION_ALREADY_EXISTS]: '이미 존재하는 조직입니다.',
      [ErrorCodes.ORGANIZATION_INACTIVE]: '비활성화된 조직입니다.',
      [ErrorCodes.ORGANIZATION_EXPIRED]: '만료된 조직입니다.',
      
      [ErrorCodes.MEMBER_NOT_FOUND]: '멤버를 찾을 수 없습니다.',
      [ErrorCodes.MEMBER_ALREADY_EXISTS]: '이미 존재하는 멤버입니다.',
      [ErrorCodes.MEMBER_INACTIVE]: '비활성화된 멤버입니다.',
      [ErrorCodes.MEMBER_PERMISSION_DENIED]: '멤버 권한이 부족합니다.',
      [ErrorCodes.INVITATION_EXPIRED]: '초대가 만료되었습니다.',
      [ErrorCodes.INVITATION_ALREADY_USED]: '이미 사용된 초대입니다.',
      
      [ErrorCodes.CREDIT_INSUFFICIENT]: '크레딧이 부족합니다.',
      [ErrorCodes.CREDIT_INVALID_AMOUNT]: '유효하지 않은 크레딧 금액입니다.',
      [ErrorCodes.CREDIT_TRANSACTION_FAILED]: '크레딧 거래에 실패했습니다.',
      [ErrorCodes.CREDIT_REFUND_FAILED]: '크레딧 환불에 실패했습니다.',
      
      [ErrorCodes.DEVICE_NOT_FOUND]: '디바이스를 찾을 수 없습니다.',
      [ErrorCodes.DEVICE_NOT_AVAILABLE]: '사용할 수 없는 디바이스입니다.',
      [ErrorCodes.DEVICE_CONNECTION_FAILED]: '디바이스 연결에 실패했습니다.',
      [ErrorCodes.DEVICE_OFFLINE]: '디바이스가 오프라인 상태입니다.',
      
      [ErrorCodes.PERMISSION_DENIED]: '권한이 없습니다.',
      [ErrorCodes.AUTHENTICATION_REQUIRED]: '로그인이 필요합니다.',
      [ErrorCodes.INVALID_CREDENTIALS]: '잘못된 인증 정보입니다.',
      [ErrorCodes.SESSION_EXPIRED]: '세션이 만료되었습니다.',
      
      [ErrorCodes.VALIDATION_FAILED]: '입력값 검증에 실패했습니다.',
      [ErrorCodes.INVALID_EMAIL]: '유효하지 않은 이메일 형식입니다.',
      [ErrorCodes.INVALID_PHONE]: '유효하지 않은 전화번호 형식입니다.',
      [ErrorCodes.REQUIRED_FIELD_MISSING]: '필수 입력값이 누락되었습니다.',
      [ErrorCodes.INVALID_DATE_FORMAT]: '유효하지 않은 날짜 형식입니다.',
      
      [ErrorCodes.NETWORK_ERROR]: '네트워크 오류가 발생했습니다.',
      [ErrorCodes.SERVICE_UNAVAILABLE]: '서비스를 사용할 수 없습니다.',
      [ErrorCodes.TIMEOUT_ERROR]: '요청 시간이 초과되었습니다.',
      [ErrorCodes.RATE_LIMIT_EXCEEDED]: '요청 한도를 초과했습니다.',
      
      [ErrorCodes.REPORT_GENERATION_FAILED]: '리포트 생성에 실패했습니다.',
      [ErrorCodes.REPORT_NOT_FOUND]: '리포트를 찾을 수 없습니다.',
      [ErrorCodes.REPORT_INVALID_DATA]: '유효하지 않은 리포트 데이터입니다.',
      [ErrorCodes.REPORT_QUOTA_EXCEEDED]: '리포트 생성 한도를 초과했습니다.',
      
      [ErrorCodes.INTERNAL_SERVER_ERROR]: '서버 내부 오류가 발생했습니다.',
      [ErrorCodes.DATABASE_ERROR]: '데이터베이스 오류가 발생했습니다.',
      [ErrorCodes.CONFIGURATION_ERROR]: '설정 오류가 발생했습니다.',
      [ErrorCodes.UNKNOWN_ERROR]: '알 수 없는 오류가 발생했습니다.'
    };

    return messages[code] || '오류가 발생했습니다.';
  }

  // === 유틸리티 메서드들 ===

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getLogMethod(severity: ErrorSeverity): Function {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return console.error;
      case ErrorSeverity.HIGH:
        return console.error;
      case ErrorSeverity.MEDIUM:
        return console.warn;
      case ErrorSeverity.LOW:
        return console.log;
      default:
        return console.log;
    }
  }

  private async sendToExternalLogging(logEntry: ErrorLogEntry): Promise<void> {
    // TODO: 외부 로깅 서비스 (Sentry, LogRocket 등) 연동
    console.error('🚨 CRITICAL ERROR:', logEntry);
  }
}

// 싱글톤 인스턴스 내보내기
export const errorHandler = ErrorHandler.getInstance();

// 편의 함수들
export function createServiceError(
  code: ErrorCodes,
  message: string,
  context?: ErrorContext,
  severity?: ErrorSeverity,
  isRetryable?: boolean,
  userMessage?: string
): ServiceError {
  return new ServiceError(code, message, context, severity, isRetryable, userMessage);
}

export function createValidationError(
  field: string,
  value: any,
  message: string,
  context?: ErrorContext
): ValidationError {
  return new ValidationError(field, value, message, context);
}

export function createNetworkError(
  message: string,
  statusCode?: number,
  url?: string,
  context?: ErrorContext
): NetworkError {
  return new NetworkError(message, statusCode, url, context);
}

export function createPermissionError(
  requiredPermission: string,
  currentRole?: string,
  context?: ErrorContext
): PermissionError {
  return new PermissionError(requiredPermission, currentRole, context);
} 