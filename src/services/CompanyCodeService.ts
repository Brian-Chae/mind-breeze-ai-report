/**
 * 기업 코드 생성 및 관리 서비스
 * 
 * 6자리 기업 코드 규칙:
 * - 형식: MB + 연도(2자리) + 순번(2자리) (예: MB2401, MB2402)
 * - 중복 방지 및 유효성 검증
 * - 생성 및 검증 기능 제공
 */

import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';

export interface CompanyCodeValidation {
  isValid: boolean;
  error?: string;
  company?: {
    id: string;
    companyName: string;
    address: string;
    employeeCount: number;
  };
}

export interface CompanyCodeGeneration {
  success: boolean;
  companyCode?: string;
  error?: string;
}

export class CompanyCodeService {
  private static readonly CODE_PREFIX = 'MB';
  private static readonly CODE_LENGTH = 6;
  private static readonly MAX_ATTEMPTS = 100;

  /**
   * 6자리 기업 코드 생성
   * @returns Promise<CompanyCodeGeneration>
   */
  static async generateCompanyCode(): Promise<CompanyCodeGeneration> {
    try {
      const currentYear = new Date().getFullYear().toString().slice(-2);
      let attempts = 0;
      
      while (attempts < this.MAX_ATTEMPTS) {
        // 순번 생성 (00-99)
        const sequence = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        const candidateCode = `${this.CODE_PREFIX}${currentYear}${sequence}`;
        
        // 중복 확인
        const isDuplicate = await this.checkCodeExists(candidateCode);
        
        if (!isDuplicate) {
          return {
            success: true,
            companyCode: candidateCode
          };
        }
        
        attempts++;
      }
      
      // 모든 시도가 실패한 경우 (매우 희귀한 경우)
      return {
        success: false,
        error: '코드 생성에 실패했습니다. 잠시 후 다시 시도해주세요.'
      };
      
    } catch (error) {
      console.error('기업 코드 생성 오류:', error);
      return {
        success: false,
        error: '코드 생성 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 기업 코드 존재 여부 확인
   * @param code 확인할 기업 코드
   * @returns Promise<boolean>
   */
  private static async checkCodeExists(code: string): Promise<boolean> {
    try {
      const companiesRef = collection(db, 'companies');
      const q = query(companiesRef, where('companyCode', '==', code));
      const querySnapshot = await getDocs(q);
      
      return !querySnapshot.empty;
      
    } catch (error) {
      console.error('기업 코드 중복 확인 오류:', error);
      throw error;
    }
  }

  /**
   * 기업 코드 유효성 검증
   * @param code 검증할 기업 코드
   * @returns Promise<CompanyCodeValidation>
   */
  static async validateCompanyCode(code: string): Promise<CompanyCodeValidation> {
    try {
      // 형식 검증
      if (!this.isValidFormat(code)) {
        return {
          isValid: false,
          error: '올바른 기업 코드 형식이 아닙니다. (예: MB2401)'
        };
      }

      // 데이터베이스에서 기업 정보 조회
      const companiesRef = collection(db, 'companies');
      const q = query(companiesRef, where('companyCode', '==', code));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return {
          isValid: false,
          error: '존재하지 않는 기업 코드입니다.'
        };
      }

      const companyDoc = querySnapshot.docs[0];
      const companyData = companyDoc.data();

      // 기업 상태 확인
      if (companyData.paymentStatus === 'TERMINATED') {
        return {
          isValid: false,
          error: '해지된 기업의 코드입니다.'
        };
      }

      if (companyData.paymentStatus === 'SUSPENDED') {
        return {
          isValid: false,
          error: '일시 중단된 기업의 코드입니다.'
        };
      }

      return {
        isValid: true,
        company: {
          id: companyDoc.id,
          companyName: companyData.companyName,
          address: companyData.address,
          employeeCount: companyData.employeeCount
        }
      };

    } catch (error) {
      console.error('기업 코드 검증 오류:', error);
      return {
        isValid: false,
        error: '코드 검증 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 기업 코드 형식 검증
   * @param code 검증할 코드
   * @returns boolean
   */
  private static isValidFormat(code: string): boolean {
    // 길이 검증
    if (code.length !== this.CODE_LENGTH) {
      return false;
    }

    // 접두사 검증
    if (!code.startsWith(this.CODE_PREFIX)) {
      return false;
    }

    // 연도 부분 검증 (숫자 2자리)
    const yearPart = code.slice(2, 4);
    if (!/^\d{2}$/.test(yearPart)) {
      return false;
    }

    // 순번 부분 검증 (숫자 2자리)
    const sequencePart = code.slice(4, 6);
    if (!/^\d{2}$/.test(sequencePart)) {
      return false;
    }

    return true;
  }

  /**
   * 기업 코드 정규화 (대소문자 통일)
   * @param code 정규화할 코드
   * @returns string
   */
  static normalizeCode(code: string): string {
    return code.toUpperCase().trim();
  }

  /**
   * 기업 코드 마스킹 (보안용)
   * @param code 마스킹할 코드
   * @returns string
   */
  static maskCode(code: string): string {
    if (code.length !== this.CODE_LENGTH) {
      return code;
    }
    
    return `${code.slice(0, 2)}****`;
  }

  /**
   * 연도별 기업 코드 통계
   * @param year 조회할 연도 (2자리)
   * @returns Promise<{ year: string; count: number }>
   */
  static async getCodeStatsByYear(year: string): Promise<{ year: string; count: number }> {
    try {
      const companiesRef = collection(db, 'companies');
      const yearPrefix = `${this.CODE_PREFIX}${year}`;
      
      // 해당 연도로 시작하는 코드들을 조회
      const q = query(
        companiesRef,
        where('companyCode', '>=', yearPrefix),
        where('companyCode', '<', yearPrefix + '\uf8ff')
      );
      
      const querySnapshot = await getDocs(q);
      
      return {
        year: `20${year}`,
        count: querySnapshot.size
      };
      
    } catch (error) {
      console.error('기업 코드 통계 조회 오류:', error);
      return {
        year: `20${year}`,
        count: 0
      };
    }
  }

  /**
   * 최근 생성된 기업 코드 조회
   * @param limitCount 조회할 개수
   * @returns Promise<string[]>
   */
  static async getRecentCodes(limitCount: number = 10): Promise<string[]> {
    try {
      const companiesRef = collection(db, 'companies');
      const q = query(
        companiesRef,
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => doc.data().companyCode);
      
    } catch (error) {
      console.error('최근 기업 코드 조회 오류:', error);
      return [];
    }
  }

  /**
   * 기업 코드 Rate Limiting 체크
   * @param ipAddress 요청 IP 주소
   * @returns Promise<boolean>
   */
  static async checkRateLimit(ipAddress: string): Promise<boolean> {
    try {
      // 실제 구현에서는 Redis나 다른 캐시 시스템을 사용할 수 있음
      // 여기서는 간단한 예시로 메모리 캐시 사용
      const rateLimitKey = `rate_limit_${ipAddress}`;
      const attempts = this.getFromCache(rateLimitKey) || 0;
      
      if (attempts >= 5) { // 5분 동안 5번 제한
        return false;
      }
      
      this.setToCache(rateLimitKey, attempts + 1, 300); // 5분 TTL
      return true;
      
    } catch (error) {
      console.error('Rate limiting 확인 오류:', error);
      return true; // 오류 시 허용
    }
  }

  // 간단한 메모리 캐시 (실제 구현에서는 Redis 등 사용)
  private static cache: Map<string, { value: any; expiry: number }> = new Map();

  private static getFromCache(key: string): any {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  private static setToCache(key: string, value: any, ttlSeconds: number): void {
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expiry });
  }
}

export default CompanyCodeService; 