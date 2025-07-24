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
        })

