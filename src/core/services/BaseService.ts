import { db, auth } from './firebase';
import { Firestore, Timestamp } from 'firebase/firestore';
import { Auth } from 'firebase/auth';

/**
 * 모든 서비스 클래스의 기반이 되는 추상 클래스
 * 공통 기능들을 제공하여 코드 중복을 방지하고 일관성을 유지합니다.
 */
export abstract class BaseService {
  protected db: Firestore;
  protected auth: Auth;
  protected serviceName: string;

  constructor() {
    this.db = db;
    this.auth = auth;
    this.serviceName = this.constructor.name;
  }

  // === 공통 에러 핸들링 ===

  /**
   * 에러를 처리하고 통일된 형식으로 던집니다
   * @param error 원본 에러
   * @param context 에러 발생 컨텍스트
   * @param data 추가 데이터
   */
  protected handleError(error: any, context: string, data?: any): never {
    const errorMessage = error?.message || '알 수 없는 오류가 발생했습니다.';
    const fullContext = `${this.serviceName}.${context}`;
    
    console.error(`❌ [${fullContext}] 오류:`, {
      error: errorMessage,
      data,
      stack: error?.stack
    });
    
    // 사용자 친화적인 에러 메시지로 변환
    const userMessage = this.getUserFriendlyErrorMessage(error, context);
    throw new Error(userMessage);
  }

  /**
   * 사용자 친화적인 에러 메시지로 변환
   */
  private getUserFriendlyErrorMessage(error: any, context: string): string {
    const errorCode = error?.code;
    
    // Firebase 에러 코드별 메시지 변환
    switch (errorCode) {
      case 'permission-denied':
        return '접근 권한이 없습니다.';
      case 'not-found':
        return '요청한 데이터를 찾을 수 없습니다.';
      case 'already-exists':
        return '이미 존재하는 데이터입니다.';
      case 'resource-exhausted':
        return '서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해주세요.';
      case 'unauthenticated':
        return '인증이 필요합니다. 다시 로그인해주세요.';
      default:
        return `${context}에 실패했습니다: ${error?.message || '알 수 없는 오류'}`;
    }
  }

  // === 공통 로깅 ===

  /**
   * 정보 로그를 출력합니다
   * @param message 로그 메시지
   * @param data 추가 데이터
   */
  protected log(message: string, data?: any): void {
    console.log(`✅ [${this.serviceName}] ${message}`, data || '');
  }

  /**
   * 경고 로그를 출력합니다
   * @param message 로그 메시지
   * @param data 추가 데이터
   */
  protected warn(message: string, data?: any): void {
    console.warn(`⚠️ [${this.serviceName}] ${message}`, data || '');
  }

  /**
   * 디버그 로그를 출력합니다 (개발 환경에서만)
   * @param message 로그 메시지
   * @param data 추가 데이터
   */
  protected debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`🔍 [${this.serviceName}] ${message}`, data || '');
    }
  }

  // === 공통 유효성 검사 ===

  /**
   * 필수 값 검증
   * @param value 검증할 값
   * @param fieldName 필드명
   */
  protected validateRequired(value: any, fieldName: string): void {
    if (value === null || value === undefined || value === '') {
      throw new Error(`${fieldName}은(는) 필수입니다.`);
    }
  }

  /**
   * 이메일 형식 검증
   * @param email 이메일 주소
   */
  protected validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('올바른 이메일 형식이 아닙니다.');
    }
  }

  /**
   * UUID 형식 검증
   * @param id UUID 문자열
   * @param fieldName 필드명
   */
  protected validateId(id: string, fieldName: string = 'ID'): void {
    this.validateRequired(id, fieldName);
    // UUID v4 형식 검증 (선택적)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (id.length < 10) { // Firebase 자동 생성 ID는 보통 20자 이상
      throw new Error(`${fieldName} 형식이 올바르지 않습니다.`);
    }
  }

  /**
   * 전화번호 형식 검증 (한국 형식)
   * @param phoneNumber 전화번호
   */
  protected validatePhoneNumber(phoneNumber: string): void {
    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    if (!phoneRegex.test(phoneNumber.replace(/[^0-9]/g, ''))) {
      throw new Error('올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)');
    }
  }

  // === 공통 데이터 변환 ===

  /**
   * JavaScript Date를 Firestore Timestamp로 변환
   * @param date JavaScript Date 객체
   */
  protected toTimestamp(date: Date): Timestamp {
    return Timestamp.fromDate(date);
  }

  /**
   * Firestore Timestamp를 JavaScript Date로 변환
   * @param timestamp Firestore Timestamp
   */
  protected toDate(timestamp: any): Date {
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    return timestamp instanceof Date ? timestamp : new Date(timestamp);
  }

  /**
   * 현재 시간의 Timestamp 반환
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
    this.debug('조직 접근 권한 확인', { organizationId, userId });
  }

  /**
   * 관리자 권한 확인
   * @param userId 사용자 ID
   * @param organizationId 조직 ID (선택)
   */
  protected async validateAdminAccess(userId: string, organizationId?: string): Promise<void> {
    this.validateRequired(userId, '사용자 ID');
    
    // TODO: 실제 관리자 권한 검사 로직 구현
    this.debug('관리자 권한 확인', { userId, organizationId });
  }

  // === 공통 캐시 기능 ===

  private static cache = new Map<string, { data: any; expiry: number }>();

  /**
   * 데이터를 캐시에 저장
   * @param key 캐시 키
   * @param data 저장할 데이터
   * @param ttl TTL (밀리초, 기본 5분)
   */
  protected setCache(key: string, data: any, ttl: number = 300000): void {
    const cacheKey = `${this.serviceName}:${key}`;
    BaseService.cache.set(cacheKey, {
      data,
      expiry: Date.now() + ttl
    });
    this.debug(`캐시 저장: ${cacheKey}`);
  }

  /**
   * 캐시에서 데이터 조회
   * @param key 캐시 키
   */
  protected getCache<T>(key: string): T | null {
    const cacheKey = `${this.serviceName}:${key}`;
    const cached = BaseService.cache.get(cacheKey);
    
    if (!cached || Date.now() > cached.expiry) {
      BaseService.cache.delete(cacheKey);
      this.debug(`캐시 만료: ${cacheKey}`);
      return null;
    }
    
    this.debug(`캐시 히트: ${cacheKey}`);
    return cached.data;
  }

  /**
   * 캐시 삭제
   * @param key 캐시 키
   */
  protected clearCache(key: string): void {
    const cacheKey = `${this.serviceName}:${key}`;
    BaseService.cache.delete(cacheKey);
    this.debug(`캐시 삭제: ${cacheKey}`);
  }

  /**
   * 특정 패턴의 캐시 모두 삭제
   * @param pattern 패턴 (startsWith)
   */
  protected clearCachePattern(pattern: string): void {
    const fullPattern = `${this.serviceName}:${pattern}`;
    const keysToDelete = [];
    
    for (const key of BaseService.cache.keys()) {
      if (key.startsWith(fullPattern)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => BaseService.cache.delete(key));
    this.debug(`패턴 캐시 삭제: ${fullPattern} (${keysToDelete.length}개)`);
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
   * 배열을 청크로 나누어 배치 처리
   * @param items 처리할 아이템 배열
   * @param processor 각 청크를 처리할 함수
   * @param chunkSize 청크 크기 (기본 10)
   */
  protected async processBatch<T, R>(
    items: T[],
    processor: (chunk: T[]) => Promise<R[]>,
    chunkSize: number = 10
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      this.debug(`배치 처리 중: ${i + 1}-${Math.min(i + chunkSize, items.length)}/${items.length}`);
      
      try {
        const chunkResults = await processor(chunk);
        results.push(...chunkResults);
      } catch (error) {
        this.handleError(error, 'processBatch', { chunkIndex: Math.floor(i / chunkSize), chunkSize: chunk.length });
      }
    }
    
    this.log(`배치 처리 완료: ${results.length}개 결과`);
    return results;
  }
}

export default BaseService; 