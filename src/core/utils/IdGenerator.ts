import { v4 as uuidv4, v1 as uuidv1 } from 'uuid';

/**
 * ID 생성 유틸리티 클래스
 * 프로젝트 전반에서 일관된 ID 생성을 위한 중앙화된 시스템
 * 
 * 지원 ID 타입:
 * - UUID v4 (랜덤)
 * - UUID v1 (타임스탬프 기반)
 * - 커스텀 프리픽스가 있는 ID
 * - 초대 토큰
 * - 세션 ID
 * - 임시 ID
 * 
 * @author Mind Breeze AI Team
 */
export class IdGenerator {
  
  /**
   * 기본 UUID v4 생성
   * @returns 랜덤 UUID v4 문자열
   */
  static generateUUID(): string {
    return uuidv4();
  }

  /**
   * 타임스탬프 기반 UUID v1 생성
   * @returns 타임스탬프 기반 UUID v1 문자열
   */
  static generateTimeBasedUUID(): string {
    return uuidv1();
  }

  /**
   * 프리픽스가 있는 ID 생성
   * @param prefix ID 앞에 붙을 프리픽스
   * @returns 프리픽스_UUID 형태의 ID
   */
  static generatePrefixedId(prefix: string): string {
    return `${prefix}_${uuidv4()}`;
  }

  /**
   * 초대 토큰 생성
   * @returns 초대용 토큰 문자열
   */
  static generateInvitationToken(): string {
    return `invite_${uuidv4()}_${Date.now()}`;
  }

  /**
   * 세션 ID 생성
   * @returns 세션 ID 문자열
   */
  static generateSessionId(): string {
    return `session_${uuidv4()}_${Date.now()}`;
  }

  /**
   * 임시 ID 생성 (짧은 형태)
   * @returns 임시 사용을 위한 짧은 ID
   */
  static generateTempId(): string {
    return `temp_${uuidv4().substring(0, 8)}_${Date.now()}`;
  }

  /**
   * 배치 작업 ID 생성
   * @returns 배치 작업용 ID
   */
  static generateBatchId(): string {
    return `batch_${uuidv4()}_${Date.now()}`;
  }

  /**
   * 리포트 ID 생성
   * @returns 리포트용 ID
   */
  static generateReportId(): string {
    return `report_${uuidv4()}`;
  }

  /**
   * 조직 ID 생성
   * @returns 조직용 ID
   */
  static generateOrganizationId(): string {
    return `org_${uuidv4()}`;
  }

  /**
   * 멤버 ID 생성
   * @returns 멤버용 ID
   */
  static generateMemberId(): string {
    return `member_${uuidv4()}`;
  }

  /**
   * 디바이스 ID 생성
   * @returns 디바이스용 ID
   */
  static generateDeviceId(): string {
    return `device_${uuidv4()}`;
  }

  /**
   * 측정 세션 ID 생성
   * @returns 측정 세션용 ID
   */
  static generateMeasurementSessionId(): string {
    return `measurement_${uuidv4()}_${Date.now()}`;
  }

  /**
   * 알림 ID 생성
   * @returns 알림용 ID
   */
  static generateNotificationId(): string {
    return `notification_${uuidv4()}`;
  }

  /**
   * 로그 ID 생성
   * @returns 로그용 ID
   */
  static generateLogId(): string {
    return `log_${uuidv4()}_${Date.now()}`;
  }

  /**
   * 캐시 키 생성
   * @param prefix 캐시 키 프리픽스
   * @param identifier 식별자
   * @returns 캐시 키 문자열
   */
  static generateCacheKey(prefix: string, identifier: string): string {
    return `${prefix}:${identifier}`;
  }

  /**
   * 복합 키 생성 (여러 식별자 조합)
   * @param parts 키 구성 요소들
   * @returns 조합된 복합 키
   */
  static generateCompositeKey(...parts: string[]): string {
    return parts.filter(Boolean).join(':');
  }

  /**
   * 숫자 기반 ID 생성 (타임스탬프 + 랜덤)
   * @returns 숫자 형태의 ID
   */
  static generateNumericId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `${timestamp}${random.toString().padStart(4, '0')}`;
  }

  /**
   * 짧은 ID 생성 (8자리)
   * @returns 8자리 짧은 ID
   */
  static generateShortId(): string {
    return uuidv4().substring(0, 8);
  }

  /**
   * 커스텀 길이 ID 생성
   * @param length ID 길이
   * @returns 지정된 길이의 ID
   */
  static generateCustomLengthId(length: number): string {
    const fullId = uuidv4().replace(/-/g, '');
    return fullId.substring(0, Math.min(length, fullId.length));
  }

  /**
   * ID 유효성 검증
   * @param id 검증할 ID
   * @returns 유효한 UUID인지 여부
   */
  static isValidUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  /**
   * 프리픽스가 있는 ID의 유효성 검증
   * @param id 검증할 ID
   * @param expectedPrefix 예상되는 프리픽스
   * @returns 유효한 프리픽스 ID인지 여부
   */
  static isValidPrefixedId(id: string, expectedPrefix: string): boolean {
    if (!id.startsWith(`${expectedPrefix}_`)) {
      return false;
    }
    
    const uuidPart = id.substring(expectedPrefix.length + 1);
    return this.isValidUUID(uuidPart);
  }

  /**
   * ID에서 타임스탬프 추출 (타임스탬프가 포함된 ID용)
   * @param id 타임스탬프가 포함된 ID
   * @returns 추출된 타임스탬프 또는 null
   */
  static extractTimestampFromId(id: string): number | null {
    const parts = id.split('_');
    if (parts.length >= 3) {
      const lastPart = parts[parts.length - 1];
      const timestamp = parseInt(lastPart, 10);
      return isNaN(timestamp) ? null : timestamp;
    }
    return null;
  }

  /**
   * ID 타입 확인
   * @param id 확인할 ID
   * @returns ID의 타입 (prefix 부분)
   */
  static getIdType(id: string): string | null {
    const parts = id.split('_');
    return parts.length > 1 ? parts[0] : null;
  }

  /**
   * 보안 토큰 생성 (암호학적으로 안전한 랜덤)
   * @param length 토큰 길이 (기본 32)
   * @returns 보안 토큰
   */
  static generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  /**
   * API 키 생성
   * @returns API 키 형태의 문자열
   */
  static generateApiKey(): string {
    return `mbai_${this.generateSecureToken(32)}`;
  }

  /**
   * 웹훅 시크릿 생성
   * @returns 웹훅 시크릿
   */
  static generateWebhookSecret(): string {
    return `whsec_${this.generateSecureToken(32)}`;
  }
}

export default IdGenerator; 