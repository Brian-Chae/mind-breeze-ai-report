import { db, auth } from './firebase';
import { Firestore, Timestamp } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { 
  errorHandler, 
  ServiceError, 
  ValidationError,
  NetworkError,
  PermissionError,
  ErrorCodes,
  ErrorSeverity,
  ErrorContext,
  createServiceError,
  createValidationError
} from '../utils/ErrorHandler';
import { 
  LogLevel,
  LogCategory,
  LogContext
} from '../utils/Logger';
import {
  Cache,
  cacheManager,
  CacheStrategy,
  CacheStorage
} from '../utils/Cache';

/**
 * 모든 서비스 클래스의 기반이 되는 추상 클래스
 * 공통 기능들을 제공하여 코드 중복을 방지하고 일관성을 유지합니다.
 * 
 * v3.0 업데이트:
 * - 체계적인 ErrorHandler 시스템 통합
 * - 고급 Logger 시스템 통합
 * - 고급 Cache 시스템 통합
 * - 향상된 에러 처리 및 로깅
 * - Firebase 에러 특화 처리
 * - 재시도 로직 지원
 * - 성능 측정 및 사용자 활동 추적
 * - 지능형 캐싱 전략
 */
export abstract class BaseService {
  protected db: Firestore;
  protected auth: Auth;
  protected serviceName: string;
  protected cache: Cache;
  protected logger: any;

  constructor() {
    this.db = db;
    this.auth = auth;
    this.serviceName = this.constructor.name;
    
    // 간단한 logger 구현 (console 사용)
    this.logger = {
      log: (...args: any[]) => console.log(`[${this.serviceName}]`, ...args),
      info: (...args: any[]) => console.info(`[${this.serviceName}]`, ...args),
      warn: (...args: any[]) => console.warn(`[${this.serviceName}]`, ...args),
      error: (...args: any[]) => console.error(`[${this.serviceName}]`, ...args),
      debug: (...args: any[]) => console.debug(`[${this.serviceName}]`, ...args)
    };
    
    // 서비스별 전용 캐시 인스턴스 생성
    this.cache = cacheManager.getCache(`service_${this.serviceName.toLowerCase()}`, {
      strategy: CacheStrategy.LRU,
      storage: CacheStorage.MEMORY,
      maxSize: 500,
      defaultTTL: 5 * 60 * 1000, // 5분
      enableStats: true,
      autoCleanup: true
    });
    
  }

  // === 향상된 에러 핸들링 ===

  /**
   * 에러를 체계적으로 처리합니다
   * @param error 원본 에러
   * @param context 에러 발생 컨텍스트
   * @param additionalContext 추가 컨텍스트 정보
   * @returns 처리된 ServiceError (항상 throw됨)
   */
  protected handleError(
    error: any, 
    context: string, 
    additionalContext?: Record<string, any>
  ): never {
    const errorContext: ErrorContext = {
      action: context,
      metadata: {
        service: this.serviceName,
        ...additionalContext
      },
      timestamp: new Date()
    };

    // Firebase 에러인 경우 특별 처리
    if (error?.code && typeof error.code === 'string' && error.code.includes('/')) {
      const serviceError = errorHandler.handleFirebaseError(error, errorContext);
      throw serviceError;
    }

    // 일반 에러 처리
    const serviceError = errorHandler.handleError(error, errorContext);
    throw serviceError;
  }

  /**
   * Firebase 에러를 특별히 처리합니다
   * @param firebaseError Firebase 에러
   * @param context 에러 컨텍스트
   * @param additionalContext 추가 컨텍스트
   */
  protected handleFirebaseError(
    firebaseError: any,
    context: string,
    additionalContext?: Record<string, any>
  ): never {
    const errorContext: ErrorContext = {
      action: context,
      metadata: {
        service: this.serviceName,
        ...additionalContext
      }
    };

    const serviceError = errorHandler.handleFirebaseError(firebaseError, errorContext);
    throw serviceError;
  }

  /**
   * 재시도 가능한 작업을 실행합니다
   * @param operation 실행할 작업
   * @param maxRetries 최대 재시도 횟수
   * @param delayMs 재시도 간격 (ms)
   * @returns 작업 결과
   */
  protected async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    return errorHandler.retryOperation(operation, maxRetries, delayMs);
  }

  // === 고급 로깅 시스템 ===

  /**
   * 정보 로그를 출력합니다
   * @param message 로그 메시지
   * @param context 로그 컨텍스트
   * @param category 로그 카테고리
   */
  protected log(
    message: string, 
    context: Record<string, any> = {},
    category: LogCategory = LogCategory.SERVICE
  ): void {
    const logContext: LogContext = {
      metadata: {
        service: this.serviceName,
        ...context
      }
    };
  }

  /**
   * 디버그 로그를 출력합니다 (개발 환경에서만)
   * @param message 로그 메시지
   * @param context 로그 컨텍스트
   */
  protected debug(
    message: string, 
    context: Record<string, any> = {}
  ): void {
    const logContext: LogContext = {
      metadata: {
        service: this.serviceName,
        ...context
      }
    };
  }

  /**
   * 경고 로그를 출력합니다
   * @param message 로그 메시지
   * @param context 로그 컨텍스트
   * @param category 로그 카테고리
   */
  protected warn(
    message: string, 
    context: Record<string, any> = {},
    category: LogCategory = LogCategory.SERVICE
  ): void {
    const logContext: LogContext = {
      metadata: {
        service: this.serviceName,
        ...context
      }
    };
  }

  /**
   * 에러 로그를 출력합니다
   * @param message 로그 메시지
   * @param error 에러 객체
   * @param context 로그 컨텍스트
   * @param category 로그 카테고리
   */
  protected error(
    message: string, 
    error?: Error,
    context: Record<string, any> = {},
    category: LogCategory = LogCategory.SERVICE
  ): void {
    const logContext: LogContext = {
      metadata: {
        service: this.serviceName,
        ...context
      }
    };
  }

  /**
   * 치명적 에러 로그를 출력합니다
   * @param message 로그 메시지
   * @param error 에러 객체
   * @param context 로그 컨텍스트
   */
  protected critical(
    message: string, 
    error?: Error,
    context: Record<string, any> = {}
  ): void {
    const logContext: LogContext = {
      metadata: {
        service: this.serviceName,
        ...context
      }
    };
  }

  /**
   * 성능 메트릭을 로깅합니다
   * @param operation 작업명
   * @param duration 소요 시간 (ms)
   * @param success 성공 여부
   * @param details 추가 정보
   */
  protected logPerformance(
    operation: string,
    duration: number,
    success: boolean = true,
    details?: Record<string, any>
  ): void {
  }

  /**
   * 사용자 활동을 로깅합니다
   * @param userId 사용자 ID
   * @param action 수행한 작업
   * @param resource 대상 리소스
   * @param result 결과
   * @param organizationId 조직 ID
   * @param details 추가 정보
   */
  protected logUserActivity(
    userId: string,
    action: string,
    resource: string,
    result: 'success' | 'failure' | 'partial' = 'success',
    organizationId?: string,
    details?: Record<string, any>
  ): void {
  }

  /**
   * 보안 관련 로그를 출력합니다
   * @param message 로그 메시지
   * @param context 로그 컨텍스트
   * @param severity 심각도
   */
  protected logSecurity(
    message: string,
    context: Record<string, any> = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): void {
    const logContext: LogContext = {
      metadata: {
        service: this.serviceName,
        ...context
      }
    };
    
  }

  /**
   * 데이터베이스 작업을 로깅합니다
   * @param operation 작업명
   * @param collection 컬렉션명
   * @param documentId 문서 ID
   * @param success 성공 여부
   * @param duration 소요 시간
   */
  protected logDatabaseOperation(
    operation: string,
    collection: string,
    documentId?: string,
    success: boolean = true,
    duration?: number
  ): void {
    const context: LogContext = {
      metadata: {
        service: this.serviceName,
        operation,
        collection,
        documentId,
        success,
        duration
      }
    };
    
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    const message = `Database ${operation} on ${collection}${documentId ? `/${documentId}` : ''} ${success ? 'succeeded' : 'failed'}`;
    
  }

  /**
   * 작업 시간을 측정하고 로깅하는 래퍼
   * @param operation 작업명
   * @param task 실행할 작업
   * @returns 작업 결과
   */
  protected async measureAndLog<T>(
    operation: string,
    task: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    let success = true;
    let result: T;
    
    try {
      result = await task();
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = Date.now() - startTime;
    }
  }

  // === 향상된 유효성 검사 ===

  /**
   * 필수 값을 검증합니다
   * @param value 검증할 값
   * @param fieldName 필드명
   * @throws ValidationError 값이 없는 경우
   */
  protected validateRequired(value: any, fieldName: string): void {
    if (value === null || value === undefined || value === '') {
      throw createValidationError(
        fieldName,
        value,
        `${fieldName}은(는) 필수입니다.`,
        { metadata: { service: this.serviceName } }
      );
    }
  }

  /**
   * ID 값을 검증합니다
   * @param id 검증할 ID
   * @param fieldName 필드명
   * @throws ValidationError ID가 유효하지 않은 경우
   */
  protected validateId(id: string, fieldName: string = 'ID'): void {
    this.validateRequired(id, fieldName);
    if (typeof id !== 'string' || id.trim().length === 0) {
      throw createValidationError(
        fieldName,
        id,
        `${fieldName}는 유효한 문자열이어야 합니다.`,
        { metadata: { service: this.serviceName } }
      );
    }
  }

  /**
   * 이메일 형식을 검증합니다
   * @param email 검증할 이메일
   * @param fieldName 필드명
   * @throws ValidationError 이메일이 유효하지 않은 경우
   */
  protected validateEmail(email: string, fieldName: string = '이메일'): void {
    this.validateRequired(email, fieldName);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw createValidationError(
        fieldName,
        email,
        '유효한 이메일 주소를 입력해주세요.',
        { metadata: { service: this.serviceName } }
      );
    }
  }

  /**
   * 전화번호 형식을 검증합니다
   * @param phone 검증할 전화번호
   * @param fieldName 필드명
   * @throws ValidationError 전화번호가 유효하지 않은 경우
   */
  protected validatePhone(phone: string, fieldName: string = '전화번호'): void {
    this.validateRequired(phone, fieldName);
    const phoneRegex = /^[0-9-+().\s]+$/;
    if (!phoneRegex.test(phone) || phone.length < 10) {
      throw createValidationError(
        fieldName,
        phone,
        '유효한 전화번호를 입력해주세요.',
        { metadata: { service: this.serviceName } }
      );
    }
  }

  /**
   * 날짜 형식을 검증합니다
   * @param date 검증할 날짜
   * @param fieldName 필드명
   * @throws ValidationError 날짜가 유효하지 않은 경우
   */
  protected validateDate(date: Date | string | number, fieldName: string = '날짜'): Date {
    this.validateRequired(date, fieldName);
    
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw createValidationError(
        fieldName,
        date,
        '유효한 날짜를 입력해주세요.',
        { metadata: { service: this.serviceName } }
      );
    }
    
    return parsedDate;
  }

  /**
   * 숫자 범위를 검증합니다
   * @param value 검증할 값
   * @param min 최소값
   * @param max 최대값
   * @param fieldName 필드명
   * @throws ValidationError 값이 범위를 벗어난 경우
   */
  protected validateRange(
    value: number, 
    min: number, 
    max: number, 
    fieldName: string = '값'
  ): void {
    this.validateRequired(value, fieldName);
    if (typeof value !== 'number' || value < min || value > max) {
      throw createValidationError(
        fieldName,
        value,
        `${fieldName}는 ${min}과 ${max} 사이의 값이어야 합니다.`,
        { metadata: { service: this.serviceName, min, max } }
      );
    }
  }

  // === 공통 데이터 변환 ===

  /**
   * 캐싱이 적용된 데이터 변환 메서드
   */
  protected toDate(timestamp: any): Date {
    if (!timestamp) return new Date();
    
    if (timestamp instanceof Date) {
      return timestamp;
    }
    
    if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    
    return new Date(timestamp);
  }

  /**
   * 캐싱이 적용된 Timestamp 변환 메서드
   */
  protected toTimestamp(date: Date | string | number): Timestamp {
    if (date instanceof Date) {
      return Timestamp.fromDate(date);
    }
    
    if (typeof date === 'string' || typeof date === 'number') {
      return Timestamp.fromDate(new Date(date));
    }
    
    return Timestamp.now();
  }

  /**
   * 현재 시간 Timestamp 반환
   */
  protected now(): Timestamp {
    return Timestamp.now();
  }

  // === 공통 권한 검사 ===

  /**
   * 현재 사용자가 조직에 속해있는지 확인
   * @param organizationId 조직 ID
   * @param userId 사용자 ID
   */
  protected async validateOrganizationAccess(organizationId: string, userId: string): Promise<void> {
    this.validateRequired(organizationId, '조직 ID');
    this.validateRequired(userId, '사용자 ID');
    
    // TODO: 실제 권한 검사 로직 구현
    // 현재는 기본 검증만 수행
  }

  /**
   * 관리자 권한 확인
   * @param userId 사용자 ID
   * @param organizationId 조직 ID (선택)
   */
  protected async validateAdminAccess(userId: string, organizationId?: string): Promise<void> {
    this.validateRequired(userId, '사용자 ID');
    
    // TODO: 실제 관리자 권한 검사 로직 구현
  }

  // === 고급 캐싱 시스템 ===

  /**
   * 캐시에서 값 조회
   * @param key 캐시 키
   * @returns 캐시된 값 또는 null
   */
  protected async getCache<T>(key: string): Promise<T | null> {
    try {
      const cacheKey = this.buildCacheKey(key);
      const result = await this.cache.get(cacheKey);
      
      
      return result as T | null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 캐시에 값 저장
   * @param key 캐시 키
   * @param value 저장할 값
   * @param ttl TTL (milliseconds, 선택적)
   * @param tags 태그 (선택적)
   */
  protected async setCache<T>(
    key: string, 
    value: T, 
    ttl?: number, 
    tags?: string[]
  ): Promise<void> {
    try {
      const cacheKey = this.buildCacheKey(key);
      await this.cache.set(cacheKey, value, ttl, tags);
      
    } catch (error) {
    }
  }

  /**
   * 캐시에서 키 삭제
   * @param key 캐시 키
   */
  protected async clearCache(key: string): Promise<void> {
    try {
      const cacheKey = this.buildCacheKey(key);
      await this.cache.delete(cacheKey);
      
    } catch (error) {
    }
  }

  /**
   * 패턴으로 캐시 무효화
   * @param pattern 정규식 패턴
   */
  protected async clearCachePattern(pattern: string): Promise<void> {
    try {
      const regex = new RegExp(`^${this.serviceName}:${pattern}`);
      const deletedCount = await this.cache.deleteByPattern(regex);
      
    } catch (error) {
    }
  }

  /**
   * 태그로 캐시 무효화
   * @param tag 태그
   */
  protected async clearCacheByTag(tag: string): Promise<void> {
    try {
      const deletedCount = await this.cache.deleteByTag(tag);
      
    } catch (error) {
    }
  }

  /**
   * 캐시 기능이 포함된 작업 실행
   * @param key 캐시 키
   * @param operation 실행할 작업
   * @param ttl TTL (선택적)
   * @param tags 태그 (선택적)
   * @returns 작업 결과 (캐시에서 또는 새로 실행)
   */
  protected async withCache<T>(
    key: string,
    operation: () => Promise<T>,
    ttl?: number,
    tags?: string[]
  ): Promise<T> {
    // 캐시에서 먼저 조회
    const cachedResult = await this.getCache<T>(key);
    if (cachedResult !== null) {
      return cachedResult;
    }

    // 캐시 미스 시 작업 실행
    const result = await operation();
    
    // 결과를 캐시에 저장
    await this.setCache(key, result, ttl, tags);
    
    return result;
  }

  /**
   * 서비스별 캐시 키 생성
   * @param key 원본 키
   * @returns 서비스 네임스페이스가 포함된 캐시 키
   */
  private buildCacheKey(key: string): string {
    return `${this.serviceName}:${key}`;
  }

  /**
   * 캐시 통계 조회
   * @returns 캐시 통계
   */
  protected getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * 캐시 정리 (만료된 항목 제거)
   */
  protected async cleanupCache(): Promise<void> {
    try {
      const cleanedCount = await this.cache.cleanup();
    } catch (error) {
    }
  }

  // === 공통 페이지네이션 ===

  /**
   * 페이지네이션 파라미터 검증 및 기본값 설정
   * @param page 페이지 번호 (1부터 시작)
   * @param limit 페이지 크기
   */
  protected validatePagination(page?: number, limit?: number): { page: number; limit: number; offset: number } {
    const validatedPage = Math.max(1, page || 1);
    const validatedLimit = Math.min(100, Math.max(1, limit || 20)); // 최대 100개까지
    const offset = (validatedPage - 1) * validatedLimit;
    
    return {
      page: validatedPage,
      limit: validatedLimit,
      offset
    };
  }

  // === 공통 배치 처리 ===



  /**
   * 배치 작업 수행 (캐시 고려)
   * @param items 처리할 아이템 배열
   * @param batchSize 배치 크기
   * @param processor 각 배치를 처리할 함수
   * @returns 모든 결과
   */
  protected async processBatch<T, R>(
    items: T[],
    batchSize: number,
    processor: (batch: T[]) => Promise<R[]>
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      try {
        const batchResults = await processor(batch);
        results.push(...batchResults);
        
      } catch (error) {
        this.handleError(error, 'processBatch', { 
          chunkIndex: Math.floor(i / batchSize), 
          chunkSize: batch.length 
        });
      }
    }
    
    return results;
  }

  /**
   * 페이지네이션 헬퍼 (캐시 지원)
   * @param collection 컬렉션 이름
   * @param page 페이지 번호
   * @param limit 페이지 크기
   * @param cacheMinutes 캐시 시간 (분)
   * @returns 페이지네이션 정보
   */
  protected buildPaginationInfo(
    collection: string,
    page: number = 1,
    limit: number = 10,
    cacheMinutes: number = 5
  ): {
    offset: number;
    limit: number;
    cacheKey: string;
    cacheTTL: number;
  } {
    return {
      offset: (page - 1) * limit,
      limit,
      cacheKey: `${collection}:page:${page}:limit:${limit}`,
      cacheTTL: cacheMinutes * 60 * 1000
    };
  }

  /**
   * 서비스 종료 시 정리 작업
   */
  protected async cleanup(): Promise<void> {
    try {
      // 캐시 정리
      await this.cleanupCache();
      
    } catch (error) {
    }
  }
}

export default BaseService; 