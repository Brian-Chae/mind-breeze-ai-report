import { db } from '@core/services/firebase';
import { 
  doc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  Timestamp,
  runTransaction
} from 'firebase/firestore';
import { UserType, EnterpriseUser } from '@core/types/business';

export interface MemberManagementData {
  userId: string;
  displayName: string;
  email?: string;
  employeeId?: string;
  userType: UserType;
  department?: string;
  position?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
}

export interface MemberUpdateData {
  displayName?: string;
  department?: string;
  position?: string;
  isActive?: boolean;
  userType?: UserType;
}

export class MemberManagementService {
  
  // 조직의 모든 멤버 조회
  async getOrganizationMembers(organizationId: string): Promise<MemberManagementData[]> {
    try {
      const membersQuery = query(
        collection(db, 'users'),
        where('organizationId', '==', organizationId)
      );
      
      const querySnapshot = await getDocs(membersQuery);
      const members: MemberManagementData[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        members.push({
          userId: doc.id,
          displayName: data.displayName || '이름 없음',
          email: data.email,
          employeeId: data.employeeId,
          userType: data.userType,
          department: data.department,
          position: data.position,
          isActive: data.isActive ?? true,
          lastLoginAt: data.lastLoginAt?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date()
        });
      });
      
      return members.sort((a, b) => {
        // ORGANIZATION_ADMIN을 먼저 정렬
        if (a.userType === 'ORGANIZATION_ADMIN' && b.userType !== 'ORGANIZATION_ADMIN') return -1;
        if (a.userType !== 'ORGANIZATION_ADMIN' && b.userType === 'ORGANIZATION_ADMIN') return 1;
        
        // 그 다음 이름 순
        return a.displayName.localeCompare(b.displayName);
      });
      
    } catch (error) {
      console.error('❌ 멤버 조회 실패:', error);
      throw new Error('멤버 목록을 불러오는데 실패했습니다.');
    }
  }
  
  // 멤버 권한 변경
  async changeMemberRole(
    userId: string, 
    newRole: UserType,
    adminUserId: string
  ): Promise<void> {
    try {
      // 관리자 권한 확인
      const adminDoc = await getDoc(doc(db, 'users', adminUserId));
      if (!adminDoc.exists() || adminDoc.data().userType !== 'ORGANIZATION_ADMIN') {
        throw new Error('관리자 권한이 없습니다.');
      }
      
      // 대상 사용자 권한 업데이트
      await updateDoc(doc(db, 'users', userId), {
        userType: newRole,
        updatedAt: Timestamp.now()
      });
      
      console.log(`✅ 사용자 ${userId}의 권한이 ${newRole}로 변경되었습니다.`);
      
    } catch (error) {
      console.error('❌ 권한 변경 실패:', error);
      throw new Error('권한 변경에 실패했습니다.');
    }
  }
  
  // 멤버 정보 업데이트
  async updateMemberInfo(
    userId: string, 
    updateData: MemberUpdateData,
    adminUserId: string
  ): Promise<void> {
    try {
      // 관리자 권한 확인
      const adminDoc = await getDoc(doc(db, 'users', adminUserId));
      if (!adminDoc.exists() || adminDoc.data().userType !== 'ORGANIZATION_ADMIN') {
        throw new Error('관리자 권한이 없습니다.');
      }
      
      // 멤버 정보 업데이트
      await updateDoc(doc(db, 'users', userId), {
        ...updateData,
        updatedAt: Timestamp.now()
      });
      
      console.log(`✅ 사용자 ${userId}의 정보가 업데이트되었습니다.`);
      
    } catch (error) {
      console.error('❌ 멤버 정보 업데이트 실패:', error);
      throw new Error('멤버 정보 업데이트에 실패했습니다.');
    }
  }
  
  // 멤버 비활성화/활성화
  async toggleMemberStatus(
    userId: string, 
    isActive: boolean,
    adminUserId: string
  ): Promise<void> {
    try {
      // 관리자 권한 확인
      const adminDoc = await getDoc(doc(db, 'users', adminUserId));
      if (!adminDoc.exists() || adminDoc.data().userType !== 'ORGANIZATION_ADMIN') {
        throw new Error('관리자 권한이 없습니다.');
      }
      
      // 자기 자신을 비활성화하려는 경우 방지
      if (userId === adminUserId && !isActive) {
        throw new Error('자기 자신을 비활성화할 수 없습니다.');
      }
      
      await updateDoc(doc(db, 'users', userId), {
        isActive,
        updatedAt: Timestamp.now()
      });
      
      console.log(`✅ 사용자 ${userId}가 ${isActive ? '활성화' : '비활성화'}되었습니다.`);
      
    } catch (error) {
      console.error('❌ 멤버 상태 변경 실패:', error);
      throw new Error('멤버 상태 변경에 실패했습니다.');
    }
  }
  
  // 멤버 삭제 (조직에서 제거)
  async removeMemberFromOrganization(
    userId: string,
    adminUserId: string
  ): Promise<void> {
    return await runTransaction(db, async (transaction) => {
      try {
        // 관리자 권한 확인
        const adminDoc = await getDoc(doc(db, 'users', adminUserId));
        if (!adminDoc.exists() || adminDoc.data().userType !== 'ORGANIZATION_ADMIN') {
          throw new Error('관리자 권한이 없습니다.');
        }
        
        // 자기 자신을 삭제하려는 경우 방지
        if (userId === adminUserId) {
          throw new Error('자기 자신을 삭제할 수 없습니다.');
        }
        
        // 대상 사용자 확인
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) {
          throw new Error('존재하지 않는 사용자입니다.');
        }
        
        const userData = userDoc.data();
        
        // 관리자를 삭제하려는 경우 방지
        if (userData.userType === 'ORGANIZATION_ADMIN') {
          throw new Error('다른 관리자를 삭제할 수 없습니다.');
        }
        
        // 사용자 삭제
        await deleteDoc(doc(db, 'users', userId));
        
        // 연관된 OrganizationMember 데이터도 삭제
        const memberQuery = query(
          collection(db, 'organizationMembers'),
          where('userId', '==', userId),
          where('organizationId', '==', userData.organizationId)
        );
        
        const memberSnapshot = await getDocs(memberQuery);
        memberSnapshot.forEach(async (memberDoc) => {
          await deleteDoc(memberDoc.ref);
        });
        
        console.log(`✅ 사용자 ${userId}가 조직에서 제거되었습니다.`);
        
      } catch (error) {
        console.error('❌ 멤버 삭제 실패:', error);
        throw new Error('멤버 삭제에 실패했습니다.');
      }
    });
  }
  
  // 멤버 권한 승격 (ORGANIZATION_MEMBER → ORGANIZATION_ADMIN)
  async promoteMemberToAdmin(
    userId: string,
    adminUserId: string
  ): Promise<void> {
    try {
      await this.changeMemberRole(userId, 'ORGANIZATION_ADMIN', adminUserId);
      
      // 관리자 권한 추가
      await updateDoc(doc(db, 'users', userId), {
        permissions: JSON.stringify([
          'organization.manage',
          'members.manage',
          'credits.view',
          'reports.view',
          'metrics.view'
        ])
      });
      
      console.log(`✅ 사용자 ${userId}가 관리자로 승격되었습니다.`);
      
    } catch (error) {
      console.error('❌ 관리자 승격 실패:', error);
      throw new Error('관리자 승격에 실패했습니다.');
    }
  }
  
  // 관리자 권한 해제 (ORGANIZATION_ADMIN → ORGANIZATION_MEMBER)
  async demoteAdminToMember(
    userId: string,
    adminUserId: string
  ): Promise<void> {
    try {
      // 자기 자신을 강등하려는 경우 방지
      if (userId === adminUserId) {
        throw new Error('자기 자신의 관리자 권한을 해제할 수 없습니다.');
      }
      
      await this.changeMemberRole(userId, 'ORGANIZATION_MEMBER', adminUserId);
      
      // 멤버 권한으로 변경
      await updateDoc(doc(db, 'users', userId), {
        permissions: JSON.stringify([
          'reports.generate',
          'consultation.use',
          'profile.view',
          'profile.edit'
        ])
      });
      
      console.log(`✅ 사용자 ${userId}의 관리자 권한이 해제되었습니다.`);
      
    } catch (error) {
      console.error('❌ 관리자 권한 해제 실패:', error);
      throw new Error('관리자 권한 해제에 실패했습니다.');
    }
  }
}

// 싱글톤 인스턴스
export const memberManagementService = new MemberManagementService();
export default memberManagementService; 