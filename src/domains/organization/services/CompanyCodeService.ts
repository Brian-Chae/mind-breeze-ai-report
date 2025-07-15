/**
 * 조직 코드 관리 서비스
 * 
 * 조직 코드 생성, 검증, 관리 기능을 제공합니다.
 * - 고유한 6자리 조직 코드 생성
 * - 조직 코드 중복 검사
 * - 조직 코드 유효성 검증
 * - 연도별 코드 추적 및 관리
 */

import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from './firebase';

export interface OrganizationCodeValidation {
  isValid: boolean;
  errorMessage?: string;
  organization?: {
    id: string;
    organizationName: string;
    address: string;
    employeeCount: number;
  };
}

export interface OrganizationCodeGeneration {
  success: boolean;
  organizationCode?: string;
  error?: string;
}

export class OrganizationCodeService {
  // 코드 생성 관련 상수
  private static readonly CODE_PREFIX = 'ORG';
  private static readonly CODE_LENGTH = 6;
  private static readonly MAX_GENERATION_ATTEMPTS = 100;
  private static readonly YEAR_PREFIX_LENGTH = 2;

  /**
   * 새로운 조직 코드 생성
   * @returns Promise<OrganizationCodeGeneration>
   */
  static async generateOrganizationCode(): Promise<OrganizationCodeGeneration> {
    try {
      let attempts = 0;
      let candidateCode: string;

      do {
        candidateCode = this.createRandomCode();
        attempts++;

        // 중복 검사
        const isDuplicate = await this.isCodeExist(candidateCode);
        
        if (!isDuplicate) {
          console.log(`✅ 조직 코드 생성 성공: ${candidateCode} (시도 횟수: ${attempts})`);
          return {
            success: true,
            organizationCode: candidateCode
          };
        }

        if (attempts >= this.MAX_GENERATION_ATTEMPTS) {
          console.error(`❌ 조직 코드 생성 실패: 최대 시도 횟수 초과 (${this.MAX_GENERATION_ATTEMPTS}회)`);
          return {
            success: false,
            error: '조직 코드 생성에 실패했습니다. 잠시 후 다시 시도해주세요.'
          };
        }
      } while (true);

    } catch (error) {
      console.error('❌ 조직 코드 생성 중 오류:', error);
      return {
        success: false,
        error: '조직 코드 생성 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 조직 코드 중복 검사
   * @param code 검사할 코드
   * @returns Promise<boolean> true면 중복 존재
   */
  private static async isCodeExist(code: string): Promise<boolean> {
    try {
      const organizationsRef = collection(db, 'organizations');
      const q = query(organizationsRef, where('organizationCode', '==', code));
      const querySnapshot = await getDocs(q);
      
      return !querySnapshot.empty;
    } catch (error) {
      console.error('조직 코드 중복 검사 오류:', error);
      // 오류 발생 시 안전하게 중복으로 처리
      return true;
    }
  }

  /**
   * 조직 코드 유효성 검증
   * @param code 검증할 조직 코드
   * @returns Promise<OrganizationCodeValidation>
   */
  static async validateOrganizationCode(code: string): Promise<OrganizationCodeValidation> {
    try {
      // 1. 포맷 검증
      if (!this.isValidFormat(code)) {
        return {
          isValid: false,
          errorMessage: '조직 코드 형식이 올바르지 않습니다. (형식: ORG + 숫자 3자리)'
        };
      }

      // 2. DB에서 조직 정보 조회
      const organizationsRef = collection(db, 'organizations');
      const q = query(organizationsRef, where('organizationCode', '==', code));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return {
          isValid: false,
          errorMessage: '등록되지 않은 조직 코드입니다.'
        };
      }

      const organizationDoc = querySnapshot.docs[0];
      const organizationData = organizationDoc.data();

      // 3. 조직 상태 확인
      if (organizationData.paymentStatus === 'TERMINATED') {
        return {
          isValid: false,
          errorMessage: '해지된 조직입니다.'
        };
      }

      if (organizationData.paymentStatus === 'SUSPENDED') {
        return {
          isValid: false,
          errorMessage: '일시정지된 조직입니다.'
        };
      }

      return {
        isValid: true,
        organization: {
          id: organizationDoc.id,
          organizationName: organizationData.organizationName,
          address: organizationData.address,
          employeeCount: organizationData.employeeCount
        }
      };

    } catch (error) {
      console.error('조직 코드 검증 오류:', error);
      return {
        isValid: false,
        errorMessage: '조직 코드 검증 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 랜덤 조직 코드 생성
   * @returns string 생성된 코드
   */
  private static createRandomCode(): string {
    const currentYear = new Date().getFullYear().toString().slice(-2);
    const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `${this.CODE_PREFIX}${currentYear}${randomNum}`;
  }

  /**
   * 코드 형식 검증
   * @param code 검증할 코드
   * @returns boolean
   */
  private static isValidFormat(code: string): boolean {
    if (!code || typeof code !== 'string') {
      return false;
    }

    // ORG + 4자리 숫자 형식 검증
    const pattern = /^ORG\d{4}$/;
    return pattern.test(code);
  }

  /**
   * 코드 정규화 (대문자 변환, 공백 제거)
   * @param code 정규화할 코드
   * @returns string 정규화된 코드
   */
  static normalizeCode(code: string): string {
    return code.trim().toUpperCase();
  }

  /**
   * 코드 마스킹 (보안용)
   * @param code 마스킹할 코드
   * @returns string 마스킹된 코드
   */
  static maskCode(code: string): string {
    if (!code || code.length < 4) {
      return '***';
    }
    return code.substring(0, 3) + '***';
  }

  /**
   * 연도별 코드 통계
   * @param year 조회할 연도 (2자리)
   * @returns Promise<{ year: string; count: number }>
   */
  static async getCodeStatsByYear(year: string): Promise<{ year: string; count: number }> {
    try {
      const organizationsRef = collection(db, 'organizations');
      const yearPrefix = `ORG${year}`;
      
      const q = query(
        organizationsRef,
        where('organizationCode', '>=', yearPrefix),
        where('organizationCode', '<', yearPrefix + '\uf8ff')
      );
      
      const querySnapshot = await getDocs(q);
      
      return {
        year,
        count: querySnapshot.size
      };
    } catch (error) {
      console.error('연도별 통계 조회 오류:', error);
      return { year, count: 0 };
    }
  }

  /**
   * 최근 생성된 코드 목록 조회
   * @param limitCount 조회할 개수
   * @returns Promise<string[]>
   */
  static async getRecentCodes(limitCount: number = 10): Promise<string[]> {
    try {
      const organizationsRef = collection(db, 'organizations');
      const q = query(
        organizationsRef,
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data().organizationCode);
    } catch (error) {
      console.error('최근 코드 목록 조회 오류:', error);
      return [];
    }
  }
}

export default OrganizationCodeService; 