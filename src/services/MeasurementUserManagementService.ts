/**
 * 측정 대상자(MEASUREMENT_USER) 관리 서비스
 * 
 * ORGANIZATION_ADMIN과 ORGANIZATION_MEMBER가 측정 대상자를 등록, 관리하는 기능 제공
 * - ORGANIZATION_ADMIN: 모든 측정 대상자 관리 (전체 접근)
 * - ORGANIZATION_MEMBER: 자신이 등록한 측정 대상자만 관리 (제한된 접근)
 */

import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import enterpriseAuthService from './EnterpriseAuthService';

export interface MeasurementUser {
  id: string;
  email: string;
  displayName: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  phone?: string;
  address?: string;
  
  // 조직 관련
  organizationId: string;
  createdByUserId: string;        // 등록한 운영자 ID
  createdByUserName: string;      // 등록한 운영자 이름
  
  // 측정 관련
  measurementCount: number;       // 총 측정 횟수
  lastMeasurementDate?: Date;     // 마지막 측정 일시
  nextScheduledDate?: Date;       // 다음 예정 측정 일시
  
  // 리포트 관련
  reportIds: string[];            // 생성된 리포트 ID 목록
  lastReportDate?: Date;         // 마지막 리포트 생성 일시
  
  // 상태
  isActive: boolean;             // 활성 상태
  status: 'REGISTERED' | 'MEASURING' | 'COMPLETED' | 'INACTIVE';
  
  // 토큰 관련 (MEASUREMENT_SUBJECT로 접속할 때)
  accessToken?: string;
  tokenExpiresAt?: Date;
  
  // 메타데이터
  createdAt: Date;
  updatedAt: Date;
  notes?: string;               // 특이사항 메모
}

export interface CreateMeasurementUserData {
  email: string;
  displayName: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  phone?: string;
  address?: string;
  notes?: string;
  nextScheduledDate?: Date;
}

export interface MeasurementUserFilter {
  organizationId?: string;
  createdByUserId?: string;      // ORGANIZATION_MEMBER의 경우 자신이 등록한 것만
  status?: string;
  isActive?: boolean;
  searchTerm?: string;          // 이름, 이메일 검색
}

export interface MeasurementUserStats {
  totalCount: number;
  activeCount: number;
  measuringCount: number;
  completedCount: number;
  thisMonthNewUsers: number;
  thisMonthMeasurements: number;
  averageMeasurementsPerUser: number;
}

class MeasurementUserManagementService {
  private collectionName = 'measurementUsers';

  /**
   * 새로운 측정 대상자 등록
   */
  async createMeasurementUser(data: CreateMeasurementUserData): Promise<MeasurementUser> {
    try {
      const currentUser = enterpriseAuthService.getCurrentContext().user;
      const organization = enterpriseAuthService.getCurrentContext().organization;
      
      if (!currentUser || !organization) {
        throw new Error('로그인이 필요합니다.');
      }

      // 권한 확인
      if (!enterpriseAuthService.hasPermission('measurement_users.create')) {
        throw new Error('측정 대상자 등록 권한이 없습니다.');
      }

      // 이메일 중복 확인
      const existingUser = await this.findByEmail(data.email, organization.id);
      if (existingUser) {
        throw new Error('이미 등록된 이메일입니다.');
      }

      // 토큰 생성
      const accessToken = this.generateAccessToken();
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 90); // 90일 유효

      const now = new Date();
      const measurementUserData = {
        email: data.email,
        displayName: data.displayName,
        age: data.age,
        gender: data.gender,
        phone: data.phone,
        address: data.address,
        
        organizationId: organization.id,
        createdByUserId: currentUser.id,
        createdByUserName: currentUser.displayName,
        
        measurementCount: 0,
        reportIds: [],
        
        isActive: true,
        status: 'REGISTERED' as const,
        
        accessToken,
        tokenExpiresAt: Timestamp.fromDate(tokenExpiresAt),
        
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
        notes: data.notes || '',
        
        ...(data.nextScheduledDate && {
          nextScheduledDate: Timestamp.fromDate(data.nextScheduledDate)
        })
      };

      const docRef = await addDoc(collection(db, this.collectionName), measurementUserData);
      
      console.log('✅ 측정 대상자 등록 완료:', data.displayName);
      
      return {
        id: docRef.id,
        ...data,
        organizationId: organization.id,
        createdByUserId: currentUser.id,
        createdByUserName: currentUser.displayName,
        measurementCount: 0,
        reportIds: [],
        isActive: true,
        status: 'REGISTERED',
        accessToken,
        tokenExpiresAt,
        createdAt: now,
        updatedAt: now
      } as MeasurementUser;

    } catch (error) {
      console.error('❌ 측정 대상자 등록 실패:', error);
      throw error;
    }
  }

  /**
   * 측정 대상자 목록 조회 (권한별 필터링)
   */
  async getMeasurementUsers(filter: MeasurementUserFilter = {}): Promise<MeasurementUser[]> {
    try {
      const currentUser = enterpriseAuthService.getCurrentContext().user;
      const organization = enterpriseAuthService.getCurrentContext().organization;
      
      if (!currentUser || !organization) {
        throw new Error('로그인이 필요합니다.');
      }

      let queryConstraints = [
        where('organizationId', '==', organization.id)
      ];

      // 권한에 따른 필터링
      if (enterpriseAuthService.hasPermission('measurement_users.view.all')) {
        // ORGANIZATION_ADMIN: 모든 데이터 접근 가능
      } else if (enterpriseAuthService.hasPermission('measurement_users.view.own')) {
        // ORGANIZATION_MEMBER: 자신이 등록한 것만
        queryConstraints.push(where('createdByUserId', '==', currentUser.id));
      } else {
        throw new Error('측정 대상자 조회 권한이 없습니다.');
      }

      // 추가 필터링
      if (filter.createdByUserId) {
        queryConstraints.push(where('createdByUserId', '==', filter.createdByUserId));
      }
      
      if (filter.status) {
        queryConstraints.push(where('status', '==', filter.status));
      }
      
      if (filter.isActive !== undefined) {
        queryConstraints.push(where('isActive', '==', filter.isActive));
      }

      // 쿼리 생성 (where 조건들만 먼저)
      const whereConstraints = queryConstraints;
      const q = query(
        collection(db, this.collectionName), 
        ...whereConstraints,
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      let users: MeasurementUser[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastMeasurementDate: doc.data().lastMeasurementDate?.toDate(),
        nextScheduledDate: doc.data().nextScheduledDate?.toDate(),
        lastReportDate: doc.data().lastReportDate?.toDate(),
        tokenExpiresAt: doc.data().tokenExpiresAt?.toDate()
      })) as MeasurementUser[];

      // 클라이언트 사이드 텍스트 검색
      if (filter.searchTerm) {
        const searchLower = filter.searchTerm.toLowerCase();
        users = users.filter(user => 
          user.displayName.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
        );
      }

      return users;

    } catch (error) {
      console.error('❌ 측정 대상자 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 측정 대상자 상세 조회
   */
  async getMeasurementUser(userId: string): Promise<MeasurementUser | null> {
    try {
      const docRef = doc(db, this.collectionName, userId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const userData = docSnap.data();
      const currentUser = enterpriseAuthService.getCurrentContext().user;
      
      // 권한 확인
      if (!enterpriseAuthService.hasPermission('measurement_users.view.all') && 
          userData.createdByUserId !== currentUser?.id) {
        throw new Error('해당 측정 대상자에 대한 접근 권한이 없습니다.');
      }

      return {
        id: docSnap.id,
        ...userData,
        createdAt: userData.createdAt?.toDate(),
        updatedAt: userData.updatedAt?.toDate(),
        lastMeasurementDate: userData.lastMeasurementDate?.toDate(),
        nextScheduledDate: userData.nextScheduledDate?.toDate(),
        lastReportDate: userData.lastReportDate?.toDate(),
        tokenExpiresAt: userData.tokenExpiresAt?.toDate()
      } as MeasurementUser;

    } catch (error) {
      console.error('❌ 측정 대상자 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 측정 대상자 정보 수정
   */
  async updateMeasurementUser(userId: string, updates: Partial<CreateMeasurementUserData>): Promise<void> {
    try {
      const existing = await this.getMeasurementUser(userId);
      if (!existing) {
        throw new Error('측정 대상자를 찾을 수 없습니다.');
      }

      // 권한 확인
      const hasEditAll = enterpriseAuthService.hasPermission('measurement_users.edit.all');
      const hasEditOwn = enterpriseAuthService.hasPermission('measurement_users.edit.own');
      const currentUser = enterpriseAuthService.getCurrentContext().user;
      
      if (!hasEditAll && !(hasEditOwn && existing.createdByUserId === currentUser?.id)) {
        throw new Error('수정 권한이 없습니다.');
      }

      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date())
      };

      if (updates.nextScheduledDate) {
        updateData.nextScheduledDate = Timestamp.fromDate(updates.nextScheduledDate);
      }

      await updateDoc(doc(db, this.collectionName, userId), updateData);
      
      console.log('✅ 측정 대상자 정보 수정 완료:', userId);

    } catch (error) {
      console.error('❌ 측정 대상자 수정 실패:', error);
      throw error;
    }
  }

  /**
   * 측정 대상자 삭제
   */
  async deleteMeasurementUser(userId: string): Promise<void> {
    try {
      const existing = await this.getMeasurementUser(userId);
      if (!existing) {
        throw new Error('측정 대상자를 찾을 수 없습니다.');
      }

      // 권한 확인
      const hasDeleteAll = enterpriseAuthService.hasPermission('measurement_users.delete.all');
      const hasDeleteOwn = enterpriseAuthService.hasPermission('measurement_users.delete.own');
      const currentUser = enterpriseAuthService.getCurrentContext().user;
      
      if (!hasDeleteAll && !(hasDeleteOwn && existing.createdByUserId === currentUser?.id)) {
        throw new Error('삭제 권한이 없습니다.');
      }

      await deleteDoc(doc(db, this.collectionName, userId));
      
      console.log('✅ 측정 대상자 삭제 완료:', userId);

    } catch (error) {
      console.error('❌ 측정 대상자 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 측정 대상자 통계 조회
   */
  async getMeasurementUserStats(): Promise<MeasurementUserStats> {
    try {
      const users = await this.getMeasurementUsers();
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const stats = {
        totalCount: users.length,
        activeCount: users.filter(u => u.isActive).length,
        measuringCount: users.filter(u => u.status === 'MEASURING').length,
        completedCount: users.filter(u => u.status === 'COMPLETED').length,
        thisMonthNewUsers: users.filter(u => u.createdAt >= thisMonth).length,
        thisMonthMeasurements: users.reduce((sum, u) => {
          if (u.lastMeasurementDate && u.lastMeasurementDate >= thisMonth) {
            return sum + u.measurementCount;
          }
          return sum;
        }, 0),
        averageMeasurementsPerUser: users.length > 0 
          ? users.reduce((sum, u) => sum + u.measurementCount, 0) / users.length 
          : 0
      };

      return stats;

    } catch (error) {
      console.error('❌ 측정 대상자 통계 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 이메일로 측정 대상자 검색
   */
  private async findByEmail(email: string, organizationId: string): Promise<MeasurementUser | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('email', '==', email),
        where('organizationId', '==', organizationId),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastMeasurementDate: doc.data().lastMeasurementDate?.toDate(),
        nextScheduledDate: doc.data().nextScheduledDate?.toDate(),
        lastReportDate: doc.data().lastReportDate?.toDate(),
        tokenExpiresAt: doc.data().tokenExpiresAt?.toDate()
      } as MeasurementUser;

    } catch (error) {
      console.error('❌ 이메일로 측정 대상자 검색 실패:', error);
      return null;
    }
  }

  /**
   * 접속 토큰 생성
   */
  private generateAccessToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) +
           Date.now().toString(36);
  }

  /**
   * 측정 완료 처리
   */
  async recordMeasurement(userId: string, reportId?: string): Promise<void> {
    try {
      const updateData: any = {
        measurementCount: (await this.getMeasurementUser(userId))!.measurementCount + 1,
        lastMeasurementDate: Timestamp.fromDate(new Date()),
        status: 'MEASURING',
        updatedAt: Timestamp.fromDate(new Date())
      };

      if (reportId) {
        const existing = await this.getMeasurementUser(userId);
        updateData.reportIds = [...(existing?.reportIds || []), reportId];
        updateData.lastReportDate = Timestamp.fromDate(new Date());
      }

      await updateDoc(doc(db, this.collectionName, userId), updateData);
      
      console.log('✅ 측정 기록 완료:', userId);

    } catch (error) {
      console.error('❌ 측정 기록 실패:', error);
      throw error;
    }
  }

  /**
   * 접속 링크 생성
   */
  generateAccessLink(accessToken: string): string {
    return `${window.location.origin}/measurement-access?token=${accessToken}`;
  }
}

const measurementUserManagementService = new MeasurementUserManagementService();
export default measurementUserManagementService; 