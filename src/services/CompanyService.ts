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
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch,
  orderBy,
  limit,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  sendEmailVerification 
} from 'firebase/auth';
import { db, auth } from './firebase';
import { Organization, EnterpriseUser, UserType } from '../types/business';
import OrganizationCodeService from './CompanyCodeService';

export interface OrganizationRegistrationData {
  organizationName: string;
  businessNumber: string;
  industry: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  
  // 관리자 정보
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  adminPhone: string;
  adminAddress: string;
  adminEmployeeId: string;
  adminDepartment: string;
  adminPosition: string;
  
  // 계약 정보
  initialMemberCount: number;
  servicePackage: 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
}

export interface OrganizationInfo {
  id: string;
  organizationCode: string;
  organizationName: string;
  businessNumber: string;
  industry: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  
  adminUserId: string;
  adminEmail: string;
  
  initialMemberCount: number;
  servicePackage: string;
  
  isActive: boolean;
  paymentStatus: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'TERMINATED';
  
  createdAt: any;
  updatedAt: any;
}

export interface OrganizationRegistrationResult {
  success: boolean;
  organizationId?: string;
  organizationCode?: string;
  message?: string;
  error?: string;
}

export interface OrganizationMemberInfo {
  userId: string;
  employeeId: string;
  organizationId: string;
  
  displayName: string;
  email: string;
  phone: string;
  address: string;
  department: string;
  position: string;
  
  isActive: boolean;
  joinedAt: any;
}

export class OrganizationService {
  /**
   * 새로운 조직 등록
   * @param registrationData 조직 등록 데이터
   * @returns Promise<OrganizationRegistrationResult>
   */
  static async registerOrganization(
    registrationData: OrganizationRegistrationData
  ): Promise<OrganizationRegistrationResult> {
    try {
      // 조직 코드 생성
      const codeGeneration = await OrganizationCodeService.generateOrganizationCode();
      if (!codeGeneration.success || !codeGeneration.organizationCode) {
        return {
          success: false,
          error: codeGeneration.error || '조직 코드 생성에 실패했습니다.'
        };
      }

      const organizationCode = codeGeneration.organizationCode;

      // 사업자 등록번호 중복 확인
      const isDuplicate = await this.checkBusinessNumberExists(
        registrationData.businessNumber
      );
      if (isDuplicate) {
        return {
          success: false,
          error: '이미 등록된 사업자 등록번호입니다.'
        };
      }

      // 관리자 이메일 중복 확인
      const emailExists = await this.checkEmailExists(registrationData.adminEmail);
      if (emailExists) {
        return {
          success: false,
          error: '이미 사용 중인 이메일입니다.'
        };
      }

      // 4. Firestore 배치 작업으로 조직과 관리자 동시 생성
      const batch = writeBatch(db);
      
      // 조직 문서 생성
      const organizationRef = doc(collection(db, 'organizations'));
      const organizationData = {
        organizationCode,
        organizationName: registrationData.organizationName,
        businessNumber: registrationData.businessNumber,
        industry: registrationData.industry,
        contactEmail: registrationData.contactEmail,
        contactPhone: registrationData.contactPhone,
        address: registrationData.address,
        initialMemberCount: registrationData.initialMemberCount,
        servicePackage: registrationData.servicePackage,
        paymentStatus: 'TRIAL', // 초기 상태는 TRIAL
        adminUserId: '', // 아래에서 업데이트
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      batch.set(organizationRef, organizationData);

      // 관리자 사용자 문서 생성
      const adminUserRef = doc(collection(db, 'users'));
      const adminUserData = {
        email: registrationData.adminEmail,
        displayName: registrationData.adminName,
        organizationId: organizationRef.id,
        organizationCode: organizationCode,
        userType: 'ORGANIZATION_ADMIN',
        position: registrationData.adminPosition,
        department: registrationData.adminDepartment,
        personalCreditBalance: 0,
        isActive: true,
        phone: registrationData.adminPhone,
        address: registrationData.adminAddress,
        permissions: JSON.stringify(['ADMIN_ALL']),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      batch.set(adminUserRef, adminUserData);

      // 조직 문서의 adminUserId 업데이트
      batch.update(organizationRef, { adminUserId: adminUserRef.id });

      // 배치 실행
      await batch.commit();

      return {
        success: true,
        organizationId: organizationRef.id,
        organizationCode: organizationCode,
        message: '조직이 성공적으로 등록되었습니다.'
      };

    } catch (error) {
      console.error('조직 등록 오류:', error);
      return {
        success: false,
        error: '조직 등록 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 조직 정보 조회 (코드 기반)
   * @param organizationCode 조직 코드
   * @returns Promise<OrganizationInfo | null>
   */
  static async getOrganizationByCode(organizationCode: string): Promise<OrganizationInfo | null> {
    try {
      const organizationsRef = collection(db, 'organizations');
      const q = query(organizationsRef, where('organizationCode', '==', organizationCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const organizationDoc = querySnapshot.docs[0];
      const data = organizationDoc.data();

      return {
        id: organizationDoc.id,
        organizationCode: data.organizationCode,
        organizationName: data.organizationName,
        businessNumber: data.businessNumber,
        industry: data.industry,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        address: data.address,
        adminUserId: data.adminUserId,
        adminEmail: data.adminEmail,
        initialMemberCount: data.initialMemberCount,
        servicePackage: data.servicePackage,
        isActive: data.isActive,
        paymentStatus: data.paymentStatus,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      };

    } catch (error) {
      console.error('조직 정보 조회 오류:', error);
      return null;
    }
  }

  /**
   * 조직 정보 조회 (ID 기반)
   * @param organizationId 조직 ID
   * @returns Promise<OrganizationInfo | null>
   */
  static async getOrganizationById(organizationId: string): Promise<OrganizationInfo | null> {
    try {
      const organizationDoc = await getDoc(doc(db, 'organizations', organizationId));
      
      if (!organizationDoc.exists()) {
        return null;
      }

      const data = organizationDoc.data();
      
      return {
        id: organizationDoc.id,
        organizationCode: data.organizationCode,
        organizationName: data.organizationName,
        businessNumber: data.businessNumber,
        industry: data.industry,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        address: data.address,
        adminUserId: data.adminUserId,
        adminEmail: data.adminEmail,
        initialMemberCount: data.initialMemberCount,
        servicePackage: data.servicePackage,
        isActive: data.isActive,
        paymentStatus: data.paymentStatus,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      };

    } catch (error) {
      console.error('조직 정보 조회 오류:', error);
      return null;
    }
  }

  /**
   * 조직 멤버 추가
   * @param organizationId 조직 ID
   * @param userId 사용자 ID
   * @param memberData 멤버 데이터
   * @returns Promise<boolean>
   */
  static async addOrganizationMember(
    organizationId: string,
    userId: string,
    memberData: {
      employeeId?: string;
      department?: string;
      position?: string;
    }
  ): Promise<boolean> {
    try {
      const organizationMemberRef = collection(db, 'organizationMembers');
      
      await addDoc(organizationMemberRef, {
        userId,
        organizationId,
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
      console.error('조직 멤버 추가 오류:', error);
      return false;
    }
  }

  /**
   * 조직 멤버 목록 조회
   * @param organizationId 조직 ID
   * @returns Promise<OrganizationMemberInfo[]>
   */
  static async getOrganizationMembers(organizationId: string): Promise<OrganizationMemberInfo[]> {
    try {
      const membersRef = collection(db, 'organizationMembers');
      const q = query(
        membersRef,
        where('organizationId', '==', organizationId),
        where('isActive', '==', true),
        orderBy('joinedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          userId: data.userId,
          employeeId: data.employeeId,
          organizationId: data.organizationId,
          displayName: data.displayName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          department: data.department,
          position: data.position,
          isActive: data.isActive,
          joinedAt: data.joinedAt.toDate()
        };
      });

    } catch (error) {
      console.error('조직 멤버 목록 조회 오류:', error);
      return [];
    }
  }

  /**
   * 조직 상태 업데이트
   * @param organizationId 조직 ID
   * @param status 새로운 상태
   * @returns Promise<boolean>
   */
  static async updateOrganizationStatus(
    organizationId: string,
    status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'TERMINATED'
  ): Promise<boolean> {
    try {
      const organizationRef = doc(db, 'organizations', organizationId);
      await setDoc(organizationRef, {
        paymentStatus: status,
        updatedAt: Timestamp.now()
      }, { merge: true });

      return true;

    } catch (error) {
      console.error('조직 상태 업데이트 오류:', error);
      return false;
    }
  }

  /**
   * 조직 크레딧 업데이트
   * @param organizationId 조직 ID
   * @param creditAmount 크레딧 변경량 (음수 가능)
   * @returns Promise<boolean>
   */
  static async updateOrganizationCredit(
    organizationId: string,
    creditAmount: number
  ): Promise<boolean> {
    try {
      const organizationRef = doc(db, 'organizations', organizationId);
      const organizationDoc = await getDoc(organizationRef);
      
      if (!organizationDoc.exists()) {
        return false;
      }

      const currentBalance = organizationDoc.data().creditBalance || 0;
      const newBalance = Math.max(0, currentBalance + creditAmount);

      await setDoc(organizationRef, {
        creditBalance: newBalance,
        updatedAt: Timestamp.now()
      }, { merge: true });

      return true;

    } catch (error) {
      console.error('조직 크레딧 업데이트 오류:', error);
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
      const organizationsRef = collection(db, 'organizations');
      const q = query(
        organizationsRef,
        where('businessNumber', '==', businessNumber)
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
   * 최근 등록된 조직 목록 조회
   * @param limitCount 조회할 개수
   * @returns Promise<OrganizationInfo[]>
   */
  static async getRecentOrganizations(limitCount: number = 10): Promise<OrganizationInfo[]> {
    try {
      const organizationsRef = collection(db, 'organizations');
      const q = query(
        organizationsRef,
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          organizationCode: data.organizationCode,
          organizationName: data.organizationName,
          businessNumber: data.businessNumber,
          industry: data.industry,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          address: data.address,
          adminUserId: data.adminUserId,
          adminEmail: data.adminEmail,
          initialMemberCount: data.initialMemberCount,
          servicePackage: data.servicePackage,
          isActive: data.isActive,
          paymentStatus: data.paymentStatus,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        };
      });

    } catch (error) {
      console.error('최근 조직 목록 조회 오류:', error);
      return [];
    }
  }

  /**
   * 테스트용 조직 데이터 추가 (개발용)
   * @returns Promise<OrganizationRegistrationResult>
   */
  static async createTestOrganization(): Promise<OrganizationRegistrationResult> {
    const testOrganizationData: OrganizationRegistrationData = {
      organizationName: '테스트 조직',
      businessNumber: '123-45-67890',
      industry: 'IT',
      contactEmail: 'admin@testorganization.com',
      contactPhone: '02-1234-5678',
      address: '서울시 강남구 테헤란로 123',
      adminName: '관리자',
      adminEmail: 'admin@testorganization.com',
      adminPassword: 'test123!',
      adminPhone: '010-1234-5678',
      adminAddress: '서울시 강남구 테헤란로 123',
      adminEmployeeId: 'EMP001',
      adminDepartment: 'IT',
      adminPosition: '대표',
      initialMemberCount: 10,
      servicePackage: 'BASIC'
    };

    return await this.registerOrganization(testOrganizationData);
  }

  /**
   * 테스트용 조직 데이터를 직접 Firebase에 추가 (빠른 테스트용)
   * @returns Promise<string> 조직 코드
   */
  static async addTestOrganizationDirectly(): Promise<string> {
    try {
      const organizationsRef = collection(db, 'organizations');
      const organizationCode = 'ORG123';
      
      const organizationDoc = await addDoc(organizationsRef, {
        organizationCode,
        organizationName: '테스트 조직',
        businessNumber: '123-45-67890',
        industry: 'IT',
        contactEmail: 'admin@testorganization.com',
        contactPhone: '02-1234-5678',
        address: '서울시 강남구 테헤란로 123',
        initialMemberCount: 10,
        servicePackage: 'BASIC',
        paymentStatus: 'ACTIVE',
        adminUserId: 'test-admin-id',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      console.log('✅ 테스트 조직 데이터 생성 완료:', organizationCode);
      return organizationCode;
    } catch (error) {
      console.error('❌ 테스트 조직 데이터 생성 실패:', error);
      throw error;
    }
  }
}

export default OrganizationService; 