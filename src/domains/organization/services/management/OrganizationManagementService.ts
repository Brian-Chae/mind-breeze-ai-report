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

        this.log('관리자 구성원 생성 완료', { 
          organizationId, 
          memberId: memberRef.id, 
          email: adminData.email 
        })
      } catch (error) {
        this.error('관리자 구성원 생성 실패', error as Error, { organizationId, adminData })
        throw error
      }
    })
  }

  /**
   * 기존 조직에 관리자 구성원 추가 (데이터 마이그레이션용)
   */
  async addAdminMemberToExistingOrganization(organizationId: string): Promise<void> {
    return this.measureAndLog('addAdminMemberToExistingOrganization', async () => {
      try {
        // 조직 정보 조회
        const organization = await this.getOrganization(organizationId)
        if (!organization) {
          throw new Error('조직을 찾을 수 없습니다.')
        }

        // 이미 구성원이 있는지 확인
        const existingMembers = await this.getMembers(organizationId)
        if (existingMembers.length > 0) {
          this.log('이미 구성원이 존재하는 조직입니다.', { organizationId })
          return
        }

        // 관리자 정보로 구성원 생성
        await this.createAdminMember(organizationId, {
          userId: organization.adminUserId,
          email: organization.adminEmail,
          displayName: organization.adminEmail.split('@')[0], // 이메일에서 이름 추출
          employeeId: 'ADMIN001'
        })

        this.log('기존 조직에 관리자 구성원 추가 완료', { organizationId })
      } catch (error) {
        this.error('기존 조직 관리자 구성원 추가 실패', error as Error, { organizationId })
        throw error
      }
    })
  }

  /**
   * 조직 정보 조회
   */
  async getOrganization(organizationId: string): Promise<Organization | null> {
    return this.withCache(
      `organization_${organizationId}`,
      async () => {
        try {
          const docRef = doc(db, 'organizations', organizationId)
          const docSnap = await getDoc(docRef)
          
          if (!docSnap.exists()) {
            return null
          }
          
          return {
            id: docSnap.id,
            ...docSnap.data()
          } as Organization
        } catch (error) {
          this.error('조직 정보 조회 실패', error as Error, { organizationId })
          return null
        }
      },
      300 // 5분 캐시
    )
  }

  /**
   * 조직 정보 업데이트
   */
  async updateOrganizationInfo(
    organizationId: string, 
    data: UpdateOrganizationData
  ): Promise<void> {
    return this.measureAndLog('updateOrganizationInfo', async () => {
      try {
        // 권한 확인
        await this.checkAdminPermission(organizationId)
        
        const orgRef = doc(db, 'organizations', organizationId)
        
        // 업데이트 데이터 준비
        const updateData: any = {
          ...data,
          updatedAt: Timestamp.now()
        }
        
        // 날짜 필드 변환
        if (data.establishedDate) {
          updateData.establishedDate = Timestamp.fromDate(data.establishedDate)
        }
        
        await updateDoc(orgRef, updateData)
        
        // 캐시 무효화
        this.clearCache(`organization_${organizationId}`)
        
        this.log('조직 정보 업데이트 완료', { organizationId, fields: Object.keys(data) })
      } catch (error) {
        this.error('조직 정보 업데이트 실패', error as Error, { organizationId })
        throw error
      }
    })
  }

  /**
   * 조직 로고 업로드
   */
  async uploadOrganizationLogo(
    organizationId: string, 
    file: File
  ): Promise<string> {
    return this.measureAndLog('uploadOrganizationLogo', async () => {
      try {
        // 파일 검증
        if (!file.type.startsWith('image/')) {
          throw new Error('이미지 파일만 업로드 가능합니다.')
        }
        
        if (file.size > 5 * 1024 * 1024) { // 5MB
          throw new Error('파일 크기는 5MB 이하여야 합니다.')
        }
        
        // Storage 경로
        const timestamp = Date.now()
        const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
        const storageRef = ref(storage, `organizations/${organizationId}/logo/${fileName}`)
        
        // 업로드
        const snapshot = await uploadBytes(storageRef, file)
        const downloadURL = await getDownloadURL(snapshot.ref)
        
        // DB 업데이트
        await updateDoc(doc(db, 'organizations', organizationId), {
          logoUrl: downloadURL,
          updatedAt: Timestamp.now()
        })
        
        // 캐시 무효화
        this.clearCache(`organization_${organizationId}`)
        
        this.log('로고 업로드 완료', { organizationId, url: downloadURL })
        return downloadURL
      } catch (error) {
        this.error('로고 업로드 실패', error as Error, { organizationId })
        throw error
      }
    })
  }

  /**
   * 부서 목록 조회
   */
  async getDepartments(organizationId: string): Promise<Department[]> {
    return this.withCache(
      `departments_${organizationId}`,
      async () => {
        try {
          const q = query(
            collection(db, 'organizations', organizationId, 'departments'),
            where('isActive', '==', true)
          )
          
          const snapshot = await getDocs(q)
          
          // Sort client-side to avoid index requirements
          const departments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Department))
          
          return departments.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        } catch (error) {
          this.error('부서 목록 조회 실패', error as Error, { organizationId })
          return []
        }
      },
      300 // 5분 캐시
    )
  }

  /**
   * 부서 생성
   */
  async createDepartment(
    organizationId: string, 
    data: CreateDepartmentData
  ): Promise<Department> {
    return this.measureAndLog('createDepartment', async () => {
      try {
        await this.checkAdminPermission(organizationId)
        
        // 부서 코드 중복 확인
        const existingDept = await this.getDepartmentByCode(organizationId, data.code)
        if (existingDept) {
          throw new Error('이미 사용 중인 부서 코드입니다.')
        }
        
        // 레벨 계산
        let level = 0
        if (data.parentId) {
          const parentDept = await this.getDepartment(organizationId, data.parentId)
          level = (parentDept?.level || 0) + 1
        }
        
        const currentUser = this.getCurrentUser()
        const departmentData: any = {
          name: data.name,
          code: data.code,
          level,
          memberCount: 0,
          childDepartmentCount: 0,
          isActive: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          createdBy: currentUser?.id || 'system',
          updatedBy: currentUser?.id || 'system'
        }
        
        // Only add optional fields if they have values
        if (data.description) {
          departmentData.description = data.description
        }
        if (data.parentId) {
          departmentData.parentId = data.parentId
        }
        if (data.managerId) {
          departmentData.managerId = data.managerId
        }
        // Always set sortOrder with default of 0
        departmentData.sortOrder = data.sortOrder || 0
        
        // 부서 생성
        const docRef = await addDoc(
          collection(db, 'organizations', organizationId, 'departments'),
          departmentData
        )
        
        // 상위 부서의 자식 수 증가
        if (data.parentId) {
          await this.incrementDepartmentChildCount(organizationId, data.parentId, 1)
        }
        
        // 조직 전체 부서 수 증가
        await updateDoc(doc(db, 'organizations', organizationId), {
          totalDepartments: increment(1),
          updatedAt: Timestamp.now()
        })
        
        // 캐시 무효화
        this.clearCache(`departments_${organizationId}`)
        this.clearCache(`dept_hierarchy_${organizationId}`)
        this.clearCache(`org_stats_${organizationId}`)
        
        this.log('부서 생성 완료', { organizationId, departmentId: docRef.id })
        
        return {
          id: docRef.id,
          ...departmentData
        } as Department
      } catch (error) {
        this.error('부서 생성 실패', error as Error, { organizationId, data })
        throw error
      }
    })
  }

  /**
   * 부서 업데이트
   */
  async updateDepartment(
    organizationId: string, 
    departmentId: string, 
    data: Partial<Department>
  ): Promise<void> {
    return this.measureAndLog('updateDepartment', async () => {
      try {
        await this.checkAdminPermission(organizationId)
        
        const currentUser = this.getCurrentUser()
        const updateData: any = {
          updatedAt: Timestamp.now(),
          updatedBy: currentUser?.id || 'system'
        }
        
        // Only add fields that are provided
        if (data.name !== undefined) updateData.name = data.name
        if (data.code !== undefined) updateData.code = data.code
        if (data.description !== undefined) updateData.description = data.description
        if (data.parentId !== undefined) updateData.parentId = data.parentId
        if (data.managerId !== undefined) updateData.managerId = data.managerId
        if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder
        if (data.level !== undefined) updateData.level = data.level
        if (data.isActive !== undefined) updateData.isActive = data.isActive
        
        await updateDoc(
          doc(db, 'organizations', organizationId, 'departments', departmentId),
          updateData
        )
        
        // 캐시 무효화
        this.invalidateDepartmentCache(organizationId)
        
        this.log('부서 업데이트 완료', { organizationId, departmentId })
      } catch (error) {
        this.error('부서 업데이트 실패', error as Error, { organizationId, departmentId })
        throw error
      }
    })
  }

  /**
   * 부서 삭제
   */
  async deleteDepartment(
    organizationId: string, 
    departmentId: string
  ): Promise<void> {
    return this.measureAndLog('deleteDepartment', async () => {
      try {
        await this.checkAdminPermission(organizationId)
        
        const dept = await this.getDepartment(organizationId, departmentId)
        if (!dept) {
          throw new Error('부서를 찾을 수 없습니다.')
        }
        
        // 하위 부서 확인
        if (dept.childDepartmentCount > 0) {
          throw new Error('하위 부서가 있는 부서는 삭제할 수 없습니다.')
        }
        
        // 구성원 확인
        if (dept.memberCount > 0) {
          throw new Error('구성원이 있는 부서는 삭제할 수 없습니다.')
        }
        
        // 부서 삭제 (소프트 삭제)
        await updateDoc(
          doc(db, 'organizations', organizationId, 'departments', departmentId),
          {
            isActive: false,
            updatedAt: Timestamp.now()
          }
        )
        
        // 상위 부서의 자식 수 감소
        if (dept.parentId) {
          await this.incrementDepartmentChildCount(organizationId, dept.parentId, -1)
        }
        
        // 조직 전체 부서 수 감소
        await updateDoc(doc(db, 'organizations', organizationId), {
          totalDepartments: increment(-1),
          updatedAt: Timestamp.now()
        })
        
        // 캐시 무효화
        this.invalidateDepartmentCache(organizationId)
        
        this.log('부서 삭제 완료', { organizationId, departmentId })
      } catch (error) {
        this.error('부서 삭제 실패', error as Error, { organizationId, departmentId })
        throw error
      }
    })
  }

  /**
   * 부서 계층 구조 조회
   */
  async getDepartmentHierarchy(organizationId: string): Promise<DepartmentNode[]> {
    return this.withCache(
      `dept_hierarchy_${organizationId}`,
      async () => {
        try {
          const departments = await this.getDepartments(organizationId)
          
          // 계층 구조 구성
          const rootNodes: DepartmentNode[] = []
          const nodeMap = new Map<string, DepartmentNode>()
          
          // 노드 맵 생성
          departments.forEach(dept => {
            nodeMap.set(dept.id, {
              id: dept.id,
              name: dept.name,
              code: dept.code,
              level: dept.level,
              managerId: dept.managerId,
              managerName: dept.managerName,
              memberCount: dept.memberCount,
              children: []
            })
          })
          
          // 계층 구조 구성
          departments.forEach(dept => {
            const node = nodeMap.get(dept.id)!
            if (dept.parentId) {
              const parentNode = nodeMap.get(dept.parentId)
              if (parentNode) {
                parentNode.children.push(node)
              }
            } else {
              rootNodes.push(node)
            }
          })
          
          // 정렬
          const sortNodes = (nodes: DepartmentNode[]) => {
            nodes.sort((a, b) => a.name.localeCompare(b.name))
            nodes.forEach(node => sortNodes(node.children))
          }
          
          sortNodes(rootNodes)
          
          return rootNodes
        } catch (error) {
          this.error('부서 계층 구조 조회 실패', error as Error, { organizationId })
          return []
        }
      },
      300 // 5분 캐시
    )
  }

  /**
   * 대기 구성원 목록 조회
   */
  async getPendingMembers(organizationId: string): Promise<PendingMember[]> {
    return this.withCache(
      `pending_members_${organizationId}`,
      async () => {
        try {
          // 단순한 쿼리로 변경 (인덱스 없이 동작)
          const q = query(
            collection(db, 'pendingMembers'),
            where('organizationId', '==', organizationId)
          )
          
          const snapshot = await getDocs(q)
          let pendingMembers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as PendingMember))
          
          // 클라이언트 사이드에서 필터링 및 정렬
          pendingMembers = pendingMembers
            .filter(member => member.status === 'PENDING')
            .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
          
          return pendingMembers
        } catch (error) {
          this.error('대기 구성원 목록 조회 실패', error as Error, { organizationId })
          return []
        }
      },
      60 // 1분 캐시
    )
  }

  /**
   * 구성원 목록 조회
   */
  async getMembers(
    organizationId: string, 
    filters?: {
      departmentId?: string
      status?: string
      role?: string
    }
  ): Promise<OrganizationMember[]> {
    return this.withCache(
      `members_${organizationId}_${JSON.stringify(filters)}`,
      async () => {
        try {
          let q = query(
            collection(db, 'organizations', organizationId, 'members'),
            orderBy('displayName', 'asc')
          )
          
          // 필터 적용은 클라이언트 사이드에서
          const snapshot = await getDocs(q)
          let members = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as OrganizationMember))
          
          // 클라이언트 사이드 필터링
          if (filters?.departmentId) {
            members = members.filter(m => m.departmentId === filters.departmentId)
          }
          if (filters?.status) {
            members = members.filter(m => m.status === filters.status)
          }
          if (filters?.role) {
            members = members.filter(m => m.role === filters.role)
          }
          
          return members
        } catch (error) {
          this.error('구성원 목록 조회 실패', error as Error, { organizationId })
          return []
        }
      },
      60 // 1분 캐시
    )
  }

  /**
   * 구성원 초대
   */
  async inviteMember(
    organizationId: string, 
    data: InviteMemberData
  ): Promise<void> {
    return this.measureAndLog('inviteMember', async () => {
      try {
        await this.checkAdminPermission(organizationId)
        
        // 이메일 중복 확인
        const existingMember = await this.getMemberByEmail(organizationId, data.email)
        if (existingMember) {
          throw new Error('이미 조직에 속한 이메일입니다.')
        }
        
        // 초대 토큰 생성
        const invitationToken = this.generateInvitationToken()
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7) // 7일 유효
        
        const currentUser = this.getCurrentUser()
        
        // 초대 정보 저장
        const invitationData: Omit<OrganizationInvitation, 'id'> = {
          organizationId,
          ...data,
          status: 'PENDING',
          invitationToken,
          invitedBy: currentUser?.id || 'system',
          invitedAt: Timestamp.now(),
          expiresAt: Timestamp.fromDate(expiresAt)
        }
        
        await addDoc(collection(db, 'organizationInvitations'), invitationData)
        
        // 이메일 발송
        if (data.sendInvitation) {
          // TODO: 이메일 발송 서비스 연동
          this.log('초대 이메일 발송 예정', { email: data.email })
        }
        
        this.log('구성원 초대 완료', { organizationId, email: data.email })
      } catch (error) {
        this.error('구성원 초대 실패', error as Error, { organizationId, data })
        throw error
      }
    })
  }

  /**
   * 대기 구성원 생성 (사전 등록 방식)
   */
  async createPendingMember(
    organizationId: string,
    data: CreatePendingMemberData
  ): Promise<void> {
    return this.measureAndLog('createPendingMember', async () => {
      try {
        await this.checkAdminPermission(organizationId)
        
        // 이메일 중복 확인 (기존 멤버)
        const existingMember = await this.getMemberByEmail(organizationId, data.email)
        if (existingMember) {
          throw new Error('이미 조직에 속한 이메일입니다.')
        }
        
        // 대기 중인 멤버 중복 확인
        const pendingMembersQuery = query(
          collection(db, 'pendingMembers'),
          where('organizationId', '==', organizationId),
          where('email', '==', data.email)
        )
        const pendingSnapshot = await getDocs(pendingMembersQuery)
        
        if (!pendingSnapshot.empty) {
          throw new Error('이미 등록 대기 중인 이메일입니다.')
        }
        
        // 비밀번호 해시 (클라이언트에서 해시하는 것은 보안상 권장되지 않지만, 임시방편으로 사용)
        const passwordHash = await this.hashPassword(data.temporaryPassword)
        
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30) // 30일 유효
        
        const currentUser = this.getCurrentUser()
        
        // 대기 멤버 정보 저장
        const pendingMemberData: Omit<PendingMember, 'id'> = {
          organizationId,
          email: data.email,
          name: data.name,
          temporaryPasswordHash: passwordHash,
          role: data.role,
          ...(data.departmentId && { departmentId: data.departmentId }),
          ...(data.position && { position: data.position }),
          status: 'PENDING',
          createdBy: currentUser?.uid || 'system',
          createdAt: Timestamp.now(),
          expiresAt: Timestamp.fromDate(expiresAt)
        }
        
        await addDoc(collection(db, 'pendingMembers'), pendingMemberData)
        
        // 캐시 무효화
        this.clearCache(`pending_members_${organizationId}`)
        
        this.log('대기 구성원 생성 완료', { organizationId, email: data.email })
      } catch (error) {
        this.error('대기 구성원 생성 실패', error as Error, { organizationId, data })
        throw error
      }
    })
  }

  /**
   * 비밀번호 해시 생성 (간단한 해시, 실제로는 서버에서 해야 함)
   */
  private async hashPassword(password: string): Promise<string> {
    // 실제 환경에서는 서버에서 bcrypt 등을 사용해야 함
    // 여기서는 임시로 btoa를 사용 (보안 목적이 아님)
    return btoa(password + 'mind-breeze-salt')
  }

  /**
   * 비밀번호 검증
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    const testHash = await this.hashPassword(password)
    return testHash === hash
  }

  /**
   * 구성원 역할 변경
   */
  async updateMemberRole(
    organizationId: string, 
    memberId: string, 
    role: 'ORGANIZATION_ADMIN' | 'DEPARTMENT_MANAGER' | 'TEAM_LEADER' | 'SUPERVISOR' | 'EMPLOYEE' | 'ORGANIZATION_MEMBER' | 'ADMIN' | 'MANAGER' | 'MEMBER'
  ): Promise<void> {
    return this.measureAndLog('updateMemberRole', async () => {
      try {
        await this.checkAdminPermission(organizationId)
        
        const memberRef = doc(db, 'organizations', organizationId, 'members', memberId)
        
        await updateDoc(memberRef, {
          role,
          updatedAt: Timestamp.now()
        })
        
        // 권한 재계산
        const permissions = this.calculatePermissionsByRole(role)
        await updateDoc(memberRef, { permissions })
        
        // 캐시 무효화
        this.clearCache(`members_${organizationId}`)
        
        this.log('구성원 역할 변경 완료', { organizationId, memberId, role })
      } catch (error) {
        this.error('구성원 역할 변경 실패', error as Error, { organizationId, memberId, role })
        throw error
      }
    })
  }

  /**
   * 구성원 상태 변경
   */
  async updateMemberStatus(
    organizationId: string, 
    memberId: string, 
    status: 'ACTIVE' | 'SUSPENDED'
  ): Promise<void> {
    return this.measureAndLog('updateMemberStatus', async () => {
      try {
        await this.checkAdminPermission(organizationId)
        
        await updateDoc(
          doc(db, 'organizations', organizationId, 'members', memberId),
          {
            status,
            updatedAt: Timestamp.now()
          }
        )
        
        // 캐시 무효화
        this.clearCache(`members_${organizationId}`)
        
        this.log('구성원 상태 변경 완료', { organizationId, memberId, status })
      } catch (error) {
        this.error('구성원 상태 변경 실패', error as Error, { organizationId, memberId, status })
        throw error
      }
    })
  }

  /**
   * 조직 통계 조회
   */
  async getOrganizationStats(organizationId: string): Promise<OrganizationStats> {
    return this.withCache(
      `org_stats_${organizationId}`,
      async () => {
        try {
          // 전체 구성원 수
          const membersSnapshot = await getDocs(
            collection(db, 'organizations', organizationId, 'members')
          )
          const totalMembers = membersSnapshot.size
          
          // 활성 구성원 수
          const activeMembers = membersSnapshot.docs.filter(
            doc => doc.data().status === 'ACTIVE'
          ).length
          
          // 부서 정보
          const departments = await this.getDepartments(organizationId)
          const totalDepartments = departments.length
          const activeDepartments = departments.filter(d => d.isActive).length
          
          // 부서별 분포
          const departmentDistribution = departments.map(dept => ({
            departmentId: dept.id,
            departmentName: dept.name,
            memberCount: dept.memberCount,
            percentage: totalMembers > 0 ? (dept.memberCount / totalMembers) * 100 : 0
          }))
          
          // 전월 대비 증가율 계산
          const lastMonth = new Date()
          lastMonth.setMonth(lastMonth.getMonth() - 1)
          
          const lastMonthMembersQuery = query(
            collection(db, 'organizations', organizationId, 'members'),
            where('joinedAt', '>=', Timestamp.fromDate(lastMonth))
          )
          const lastMonthMembers = await getDocs(lastMonthMembersQuery)
          const memberGrowthRate = totalMembers > 0 
            ? (lastMonthMembers.size / totalMembers) * 100 
            : 0
          
          return {
            totalMembers,
            activeMembers,
            totalDepartments,
            activeDepartments,
            memberGrowthRate,
            activityRate: totalMembers > 0 ? (activeMembers / totalMembers) * 100 : 0,
            departmentDistribution
          }
        } catch (error) {
          this.error('조직 통계 조회 실패', error as Error, { organizationId })
          throw error
        }
      },
      60 // 1분 캐시
    )
  }

  /**
   * 실시간 구독 - 조직 정보 변경
   */
  subscribeToOrganizationChanges(
    organizationId: string, 
    callback: (org: Organization) => void
  ): () => void {
    const unsubscribe = onSnapshot(
      doc(db, 'organizations', organizationId),
      (doc) => {
        if (doc.exists()) {
          callback({ id: doc.id, ...doc.data() } as Organization)
        }
      }
    )
    
    return unsubscribe
  }

  /**
   * 실시간 구독 - 부서 변경
   */
  subscribeToDepartmentChanges(
    organizationId: string,
    callback: (departments: Department[]) => void
  ): () => void {
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'organizations', organizationId, 'departments'),
        where('isActive', '==', true)
      ),
      (snapshot) => {
        const departments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Department[]
        
        callback(departments)
      }
    )
    
    return unsubscribe
  }

  // === 유틸리티 메서드 ===

  /**
   * 권한 확인
   */
  private async checkAdminPermission(organizationId: string): Promise<void> {
    const currentUser = this.getCurrentUser()
    if (!currentUser) {
      throw new Error('로그인이 필요합니다.')
    }
    
    // 시스템 관리자는 모든 권한 보유
    if (currentUser.userType === 'SYSTEM_ADMIN') {
      return
    }
    
    // 조직 관리자 확인
    if (currentUser.userType === 'ORGANIZATION_ADMIN' && currentUser.organizationId === organizationId) {
      return
    }
    
    throw new Error('관리자 권한이 필요합니다.')
  }

  /**
   * 현재 사용자 정보
   */
  private getCurrentUser() {
    return enterpriseAuthService.getCurrentContext().user
  }

  /**
   * 초대 토큰 생성
   */
  private generateInvitationToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) +
           Date.now().toString(36)
  }

  /**
   * 역할별 권한 계산
   */
  private calculatePermissionsByRole(role: string): string[] {
    const permissionMap: Record<string, string[]> = {
      ORGANIZATION_ADMIN: [
        'organization.manage',
        'members.manage',
        'departments.manage',
        'reports.manage',
        'devices.manage',
        'credits.manage',
        'system.admin'
      ],
      DEPARTMENT_MANAGER: [
        'organization.view',
        'members.manage',
        'departments.manage',
        'reports.manage',
        'devices.manage'
      ],
      TEAM_LEADER: [
        'organization.view',
        'members.view',
        'departments.view',
        'reports.manage',
        'devices.view'
      ],
      SUPERVISOR: [
        'organization.view',
        'members.view',
        'departments.view',
        'reports.view',
        'devices.view'
      ],
      EMPLOYEE: [
        'organization.view',
        'members.view',
        'departments.view',
        'reports.view'
      ],
      ORGANIZATION_MEMBER: [
        'organization.view',
        'members.view',
        'departments.view',
        'reports.view'
      ],
      // 기존 호환성을 위한 매핑
      ADMIN: [
        'organization.manage',
        'members.manage',
        'departments.manage',
        'reports.manage',
        'devices.manage',
        'credits.manage'
      ],
      MANAGER: [
        'organization.view',
        'members.view',
        'departments.view',
        'reports.manage',
        'devices.manage'
      ],
      MEMBER: [
        'organization.view',
        'members.view',
        'departments.view',
        'reports.view'
      ]
    }
    
    return permissionMap[role] || permissionMap.ORGANIZATION_MEMBER
  }

  /**
   * 부서 코드로 조회
   */
  private async getDepartmentByCode(
    organizationId: string, 
    code: string
  ): Promise<Department | null> {
    try {
      const q = query(
        collection(db, 'organizations', organizationId, 'departments'),
        where('code', '==', code),
        where('isActive', '==', true),
        limit(1)
      )
      
      const snapshot = await getDocs(q)
      
      if (snapshot.empty) {
        return null
      }
      
      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      } as Department
    } catch (error) {
      this.error('부서 코드 조회 실패', error as Error, { organizationId, code })
      return null
    }
  }

  /**
   * 부서 단일 조회
   */
  private async getDepartment(
    organizationId: string, 
    departmentId: string
  ): Promise<Department | null> {
    try {
      const docRef = doc(db, 'organizations', organizationId, 'departments', departmentId)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) {
        return null
      }
      
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Department
    } catch (error) {
      this.error('부서 조회 실패', error as Error, { organizationId, departmentId })
      return null
    }
  }

  /**
   * 이메일로 구성원 조회
   */
  private async getMemberByEmail(
    organizationId: string, 
    email: string
  ): Promise<OrganizationMember | null> {
    try {
      const q = query(
        collection(db, 'organizations', organizationId, 'members'),
        where('email', '==', email),
        limit(1)
      )
      
      const snapshot = await getDocs(q)
      
      if (snapshot.empty) {
        return null
      }
      
      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      } as OrganizationMember
    } catch (error) {
      this.error('이메일로 구성원 조회 실패', error as Error, { organizationId, email })
      return null
    }
  }

  /**
   * 부서 자식 수 증감
   */
  private async incrementDepartmentChildCount(
    organizationId: string, 
    departmentId: string, 
    delta: number
  ): Promise<void> {
    try {
      await updateDoc(
        doc(db, 'organizations', organizationId, 'departments', departmentId),
        {
          childDepartmentCount: increment(delta),
          updatedAt: Timestamp.now()
        }
      )
    } catch (error) {
      this.error('부서 자식 수 업데이트 실패', error as Error, { organizationId, departmentId, delta })
    }
  }

  /**
   * 캐시 무효화 - 조직
   */
  private async invalidateOrganizationCache(organizationId: string): Promise<void> {
    const cacheKeys = [
      `organization_${organizationId}`,
      `org_stats_${organizationId}`
    ]
    
    cacheKeys.forEach(key => this.clearCache(key))
  }

  /**
   * 캐시 무효화 - 부서
   */
  private async invalidateDepartmentCache(organizationId: string): Promise<void> {
    this.clearCache(`departments_${organizationId}`)
    this.clearCache(`dept_hierarchy_${organizationId}`)
    this.clearCache(`org_stats_${organizationId}`)
  }
}

const organizationManagementService = new OrganizationManagementService()
export default organizationManagementService