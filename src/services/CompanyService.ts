/**
 * 기업 관리 서비스
 * 
 * 기업 등록, 조회, 관리 기능을 제공합니다.
 * - 신규 기업 등록
 * - 기업 정보 조회
 * - 기업 상태 관리
 * - 기업 멤버 관리
 */

import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { CompanyCodeService } from './CompanyCodeService';

export interface CompanyRegistrationData {
  companyName: string;
  businessRegistrationNumber: string;
  address: string;
  employeeCount: number;
  industry?: string;
  contactPhone: string;
  contactEmail: string;
  adminUserData: {
    name: string;
    email: string;
    password: string;
    position: string;
    phone: string;
    address: string;
  };
}

export interface CompanyInfo {
  id: string;
  companyCode: string;
  companyName: string;
  businessRegistrationNumber: string;
  address: string;
  employeeCount: number;
  industry?: string;
  contactPhone: string;
  contactEmail: string;
  paymentStatus: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
  creditBalance: number;
  servicePackage: 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  adminUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyRegistrationResult {
  success: boolean;
  companyId?: string;
  companyCode?: string;
  adminUserId?: string;
  error?: string;
}

export interface CompanyMemberInfo {
  id: string;
  userId: string;
  companyId: string;
  employeeId?: string;
  department?: string;
  position?: string;
  joinedAt: Date;
  isActive: boolean;
  reportsGenerated: number;
  consultationsUsed: number;
  lastActivityAt?: Date;
}

export class CompanyService {
  /**
   * 신규 기업 등록
   * @param registrationData 기업 등록 데이터
   * @returns Promise<CompanyRegistrationResult>
   */
  static async registerCompany(
    registrationData: CompanyRegistrationData
  ): Promise<CompanyRegistrationResult> {
    try {
      // 1. 기업 코드 생성
      const codeGeneration = await CompanyCodeService.generateCompanyCode();
      if (!codeGeneration.success || !codeGeneration.companyCode) {
        return {
          success: false,
          error: codeGeneration.error || '기업 코드 생성에 실패했습니다.'
        };
      }

      const companyCode = codeGeneration.companyCode;

      // 2. 사업자 등록번호 중복 확인
      const isDuplicate = await this.checkBusinessNumberExists(
        registrationData.businessRegistrationNumber
      );
      if (isDuplicate) {
        return {
          success: false,
          error: '이미 등록된 사업자 등록번호입니다.'
        };
      }

      // 3. 관리자 이메일 중복 확인
      const emailExists = await this.checkEmailExists(registrationData.adminUserData.email);
      if (emailExists) {
        return {
          success: false,
          error: '이미 사용 중인 이메일입니다.'
        };
      }

      // 4. Firestore 배치 작업으로 기업과 관리자 동시 생성
      const batch = writeBatch(db);
      
      // 기업 문서 생성
      const companyRef = doc(collection(db, 'companies'));
      const companyData = {
        companyCode,
        companyName: registrationData.companyName,
        businessRegistrationNumber: registrationData.businessRegistrationNumber,
        address: registrationData.address,
        employeeCount: registrationData.employeeCount,
        industry: registrationData.industry || null,
        contactPhone: registrationData.contactPhone,
        contactEmail: registrationData.contactEmail,
        paymentStatus: 'PENDING',
        creditBalance: 0,
        servicePackage: 'BASIC',
        adminUserId: '', // 아래에서 업데이트
        settings: JSON.stringify({}),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      batch.set(companyRef, companyData);

      // 관리자 사용자 문서 생성
      const adminUserRef = doc(collection(db, 'users'));
      const adminUserData = {
        email: registrationData.adminUserData.email,
        displayName: registrationData.adminUserData.name,
        companyId: companyRef.id,
        companyCode: companyCode,
        userType: 'ORGANIZATION_ADMIN',
        position: registrationData.adminUserData.position,
        department: null,
        personalCreditBalance: 0,
        isActive: true,
        phone: registrationData.adminUserData.phone,
        address: registrationData.adminUserData.address,
        permissions: JSON.stringify(['ADMIN_ALL']),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      batch.set(adminUserRef, adminUserData);

      // 기업 문서의 adminUserId 업데이트
      batch.update(companyRef, { adminUserId: adminUserRef.id });

      // 배치 실행
      await batch.commit();

      return {
        success: true,
        companyId: companyRef.id,
        companyCode: companyCode,
        adminUserId: adminUserRef.id
      };

    } catch (error) {
      console.error('기업 등록 오류:', error);
      return {
        success: false,
        error: '기업 등록 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 기업 정보 조회 (코드 기반)
   * @param companyCode 기업 코드
   * @returns Promise<CompanyInfo | null>
   */
  static async getCompanyByCode(companyCode: string): Promise<CompanyInfo | null> {
    try {
      const companiesRef = collection(db, 'companies');
      const q = query(companiesRef, where('companyCode', '==', companyCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const companyDoc = querySnapshot.docs[0];
      const data = companyDoc.data();

      return {
        id: companyDoc.id,
        companyCode: data.companyCode,
        companyName: data.companyName,
        businessRegistrationNumber: data.businessRegistrationNumber,
        address: data.address,
        employeeCount: data.employeeCount,
        industry: data.industry,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        paymentStatus: data.paymentStatus,
        creditBalance: data.creditBalance,
        servicePackage: data.servicePackage,
        adminUserId: data.adminUserId,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      };

    } catch (error) {
      console.error('기업 정보 조회 오류:', error);
      return null;
    }
  }

  /**
   * 기업 정보 조회 (ID 기반)
   * @param companyId 기업 ID
   * @returns Promise<CompanyInfo | null>
   */
  static async getCompanyById(companyId: string): Promise<CompanyInfo | null> {
    try {
      const companyDoc = await getDoc(doc(db, 'companies', companyId));
      
      if (!companyDoc.exists()) {
        return null;
      }

      const data = companyDoc.data();
      
      return {
        id: companyDoc.id,
        companyCode: data.companyCode,
        companyName: data.companyName,
        businessRegistrationNumber: data.businessRegistrationNumber,
        address: data.address,
        employeeCount: data.employeeCount,
        industry: data.industry,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        paymentStatus: data.paymentStatus,
        creditBalance: data.creditBalance,
        servicePackage: data.servicePackage,
        adminUserId: data.adminUserId,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      };

    } catch (error) {
      console.error('기업 정보 조회 오류:', error);
      return null;
    }
  }

  /**
   * 기업 멤버 추가
   * @param companyId 기업 ID
   * @param userId 사용자 ID
   * @param memberData 멤버 데이터
   * @returns Promise<boolean>
   */
  static async addCompanyMember(
    companyId: string,
    userId: string,
    memberData: {
      employeeId?: string;
      department?: string;
      position?: string;
    }
  ): Promise<boolean> {
    try {
      const companyMemberRef = collection(db, 'companyMembers');
      
      await addDoc(companyMemberRef, {
        userId,
        companyId,
        employeeId: memberData.employeeId || null,
        department: memberData.department || null,
        position: memberData.position || null,
        joinedAt: Timestamp.now(),
        isActive: true,
        reportsGenerated: 0,
        consultationsUsed: 0,
        lastActivityAt: null
      });

      return true;

    } catch (error) {
      console.error('기업 멤버 추가 오류:', error);
      return false;
    }
  }

  /**
   * 기업 멤버 목록 조회
   * @param companyId 기업 ID
   * @returns Promise<CompanyMemberInfo[]>
   */
  static async getCompanyMembers(companyId: string): Promise<CompanyMemberInfo[]> {
    try {
      const membersRef = collection(db, 'companyMembers');
      const q = query(
        membersRef,
        where('companyId', '==', companyId),
        where('isActive', '==', true),
        orderBy('joinedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          companyId: data.companyId,
          employeeId: data.employeeId,
          department: data.department,
          position: data.position,
          joinedAt: data.joinedAt.toDate(),
          isActive: data.isActive,
          reportsGenerated: data.reportsGenerated,
          consultationsUsed: data.consultationsUsed,
          lastActivityAt: data.lastActivityAt?.toDate()
        };
      });

    } catch (error) {
      console.error('기업 멤버 목록 조회 오류:', error);
      return [];
    }
  }

  /**
   * 기업 상태 업데이트
   * @param companyId 기업 ID
   * @param status 새로운 상태
   * @returns Promise<boolean>
   */
  static async updateCompanyStatus(
    companyId: string,
    status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED'
  ): Promise<boolean> {
    try {
      const companyRef = doc(db, 'companies', companyId);
      await updateDoc(companyRef, {
        paymentStatus: status,
        updatedAt: Timestamp.now()
      });

      return true;

    } catch (error) {
      console.error('기업 상태 업데이트 오류:', error);
      return false;
    }
  }

  /**
   * 기업 크레딧 업데이트
   * @param companyId 기업 ID
   * @param creditAmount 크레딧 변경량 (음수 가능)
   * @returns Promise<boolean>
   */
  static async updateCompanyCredit(
    companyId: string,
    creditAmount: number
  ): Promise<boolean> {
    try {
      const companyRef = doc(db, 'companies', companyId);
      const companyDoc = await getDoc(companyRef);
      
      if (!companyDoc.exists()) {
        return false;
      }

      const currentBalance = companyDoc.data().creditBalance || 0;
      const newBalance = Math.max(0, currentBalance + creditAmount);

      await updateDoc(companyRef, {
        creditBalance: newBalance,
        updatedAt: Timestamp.now()
      });

      return true;

    } catch (error) {
      console.error('기업 크레딧 업데이트 오류:', error);
      return false;
    }
  }

  /**
   * 사업자 등록번호 중복 확인
   * @param businessNumber 사업자 등록번호
   * @returns Promise<boolean>
   */
  private static async checkBusinessNumberExists(businessNumber: string): Promise<boolean> {
    try {
      const companiesRef = collection(db, 'companies');
      const q = query(
        companiesRef,
        where('businessRegistrationNumber', '==', businessNumber)
      );
      const querySnapshot = await getDocs(q);
      
      return !querySnapshot.empty;

    } catch (error) {
      console.error('사업자 등록번호 중복 확인 오류:', error);
      return false;
    }
  }

  /**
   * 이메일 중복 확인
   * @param email 이메일 주소
   * @returns Promise<boolean>
   */
  private static async checkEmailExists(email: string): Promise<boolean> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      return !querySnapshot.empty;

    } catch (error) {
      console.error('이메일 중복 확인 오류:', error);
      return false;
    }
  }

  /**
   * 최근 등록된 기업 목록 조회
   * @param limitCount 조회할 개수
   * @returns Promise<CompanyInfo[]>
   */
  static async getRecentCompanies(limitCount: number = 10): Promise<CompanyInfo[]> {
    try {
      const companiesRef = collection(db, 'companies');
      const q = query(
        companiesRef,
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          companyCode: data.companyCode,
          companyName: data.companyName,
          businessRegistrationNumber: data.businessRegistrationNumber,
          address: data.address,
          employeeCount: data.employeeCount,
          industry: data.industry,
          contactPhone: data.contactPhone,
          contactEmail: data.contactEmail,
          paymentStatus: data.paymentStatus,
          creditBalance: data.creditBalance,
          servicePackage: data.servicePackage,
          adminUserId: data.adminUserId,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        };
      });

    } catch (error) {
      console.error('최근 기업 목록 조회 오류:', error);
      return [];
    }
  }
}

export default CompanyService; 