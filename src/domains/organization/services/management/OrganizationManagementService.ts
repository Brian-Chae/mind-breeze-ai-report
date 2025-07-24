/**
 * 조직 관리 서비스
 * 
 * 조직 정보, 부서, 구성원 관리를 위한 서비스
 */

import { BaseService } from '@core/services/BaseService'
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  writeBatch,
  increment,
  arrayUnion,
  arrayRemove,
  onSnapshot
} from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@core/services/firebase'
import enterpriseAuthService from '../EnterpriseAuthService'
import type { 
  Organization, 
  Department, 
  OrganizationMember,
  OrganizationInvitation,
  UpdateOrganizationData,
  CreateDepartmentData,
  InviteMemberData,
  CreatePendingMemberData,
  PendingMember,
  OrganizationStats,
  DepartmentNode,
  BulkInviteResult,
  CSVParseResult
} from '../../types/management/organization-management'

class OrganizationManagementService extends BaseService {
  constructor() {
    super()
  }

  /**
   * 조직 생성 시 관리자 구성원 자동 추가
   */
  async createAdminMember(
    organizationId: string,
    adminData: {
      userId: string
      email: string
      displayName: string
      employeeId?: string
    }
  ): Promise<void> {
    return this.measureAndLog('createAdminMember', async () => {
      try {
        const currentTime = Timestamp.now()
        
        const adminMemberData: Omit<OrganizationMember, 'id'> = {
          userId: adminData.userId,
          employeeId: adminData.employeeId || 'ADMIN001',
          displayName: adminData.displayName,
          email: adminData.email,
          role: 'ORGANIZATION_ADMIN',
          permissions: this.calculatePermissionsByRole('ORGANIZATION_ADMIN'),
          status: 'ACTIVE',
          position: '조직 관리자',
          joinedAt: currentTime
        }

        // 관리자 구성원 생성
        const memberRef = await addDoc(
          collection(db, 'organizations', organizationId, 'members'),
          adminMemberData
        )

        // 조직 통계 업데이트
        await updateDoc(doc(db, 'organizations', organizationId), {
          totalMembers: increment(1),
          activeMembers: increment(1),
          updatedAt: currentTime
        });
      } catch (error) {
        console.error('사용자 등록 중 오류:', error);
        throw error;
      }
    })
  }

  /**
   * 조직 정보 조회
   */
  async getOrganization(organizationId: string): Promise<Organization | null> {
    return this.measureAndLog('getOrganization', async () => {
      try {
        const docRef = doc(db, 'organizations', organizationId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          return null;
        }
        
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Organization;
      } catch (error) {
        console.error('조직 정보 조회 중 오류:', error);
        throw error;
      }
    });
  }

  /**
   * 조직 정보 실시간 구독
   */
  subscribeToOrganizationChanges(
    organizationId: string, 
    onUpdate: (organization: Organization | null) => void
  ): () => void {
    const docRef = doc(db, 'organizations', organizationId);
    
    const unsubscribe = onSnapshot(docRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          onUpdate({
            id: docSnap.id,
            ...docSnap.data()
          } as Organization);
        } else {
          onUpdate(null);
        }
      },
      (error) => {
        console.error('조직 정보 구독 중 오류:', error);
        onUpdate(null);
      }
    );
    
    return unsubscribe;
  }

  /**
   * 조직 통계 정보 조회
   */
  async getOrganizationStats(organizationId: string): Promise<OrganizationStats> {
    return this.measureAndLog('getOrganizationStats', async () => {
      try {
        // 조직 정보 조회
        const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
        if (!orgDoc.exists()) {
          throw new Error('조직을 찾을 수 없습니다');
        }

        const orgData = orgDoc.data();

        // 구성원 수 조회
        const membersQuery = query(
          collection(db, 'organizations', organizationId, 'members'),
          where('status', '==', 'ACTIVE')
        );
        const membersSnapshot = await getDocs(membersQuery);
        const activeMemberCount = membersSnapshot.size;

        // 부서 수 조회
        const departmentsQuery = query(
          collection(db, 'organizations', organizationId, 'departments')
        );
        const departmentsSnapshot = await getDocs(departmentsQuery);
        const departmentCount = departmentsSnapshot.size;

        // 최근 활동 계산 (예: 최근 30일간 활동한 사용자)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        let recentlyActiveCount = 0;
        membersSnapshot.forEach((doc) => {
          const member = doc.data();
          if (member.lastActivityAt && member.lastActivityAt.toDate() > thirtyDaysAgo) {
            recentlyActiveCount++;
          }
        });

        return {
          totalMembers: orgData.totalMembers || 0,
          activeMembers: activeMemberCount,
          departments: departmentCount,
          pendingInvitations: orgData.pendingInvitations || 0,
          recentlyActive: recentlyActiveCount,
          storageUsed: orgData.storageUsed || 0,
          storageLimit: orgData.storageLimit || 100 * 1024 * 1024 * 1024, // 100GB default
          lastUpdated: new Date()
        };
      } catch (error) {
        console.error('조직 통계 조회 중 오류:', error);
        throw error;
      }
    });
  }
}

export default new OrganizationManagementService();
