# OrganizationManagementService 구현 계획

## 1. 서비스 아키텍처

### 1.1 BaseService 상속
```typescript
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
  Timestamp,
  writeBatch,
  increment,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@core/services/firebase'
```

### 1.2 인터페이스 정의

```typescript
// 조직 정보 업데이트
export interface UpdateOrganizationData {
  organizationName?: string
  businessNumber?: string
  industry?: string
  size?: 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE'
  contactEmail?: string
  contactPhone?: string
  address?: string
  website?: string
  description?: string
  establishedDate?: Date
}

// 부서 생성
export interface CreateDepartmentData {
  name: string
  code: string
  parentId?: string
  managerId?: string
  description?: string
  sortOrder?: number
}

// 구성원 초대
export interface InviteMemberData {
  email: string
  name: string
  departmentId?: string
  position?: string
  role: 'ADMIN' | 'MANAGER' | 'MEMBER'
  sendInvitation?: boolean
}

// 조직 통계
export interface OrganizationStats {
  totalMembers: number
  activeMembers: number
  totalDepartments: number
  activeDepartments: number
  memberGrowthRate: number // 전월 대비 증가율
  activityRate: number // 활성 사용자 비율
  departmentDistribution: DepartmentDistribution[]
}

export interface DepartmentDistribution {
  departmentId: string
  departmentName: string
  memberCount: number
  percentage: number
}

// 부서 노드 (계층 구조)
export interface DepartmentNode {
  id: string
  name: string
  code: string
  level: number
  managerId?: string
  managerName?: string
  memberCount: number
  children: DepartmentNode[]
  isExpanded?: boolean // UI 상태
}
```

## 2. 핵심 메서드 구현

### 2.1 조직 정보 관리

```typescript
class OrganizationManagementService extends BaseService {
  constructor() {
    super()
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
        const orgRef = doc(db, 'organizations', organizationId)
        
        // 권한 확인
        await this.checkAdminPermission(organizationId)
        
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
        const storageRef = ref(storage, `organizations/${organizationId}/logo/${Date.now()}_${file.name}`)
        
        // 업로드
        const snapshot = await uploadBytes(storageRef, file)
        const downloadURL = await getDownloadURL(snapshot.ref)
        
        // DB 업데이트
        await updateDoc(doc(db, 'organizations', organizationId), {
          logoUrl: downloadURL,
          updatedAt: Timestamp.now()
        })
        
        this.log('로고 업로드 완료', { organizationId, url: downloadURL })
        return downloadURL
      } catch (error) {
        this.error('로고 업로드 실패', error as Error, { organizationId })
        throw error
      }
    })
  }
}
```

### 2.2 부서 관리

```typescript
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
        
        const departmentData = {
          ...data,
          level,
          memberCount: 0,
          childDepartmentCount: 0,
          isActive: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          createdBy: this.getCurrentUserId(),
          updatedBy: this.getCurrentUserId()
        }
        
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
          totalDepartments: increment(1)
        })
        
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
```

### 2.3 구성원 관리

```typescript
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
        
        // 초대 정보 저장
        const invitationData = {
          organizationId,
          ...data,
          status: 'PENDING' as const,
          invitationToken,
          invitedBy: this.getCurrentUserId(),
          invitedAt: Timestamp.now(),
          expiresAt: Timestamp.fromDate(expiresAt)
        }
        
        await addDoc(collection(db, 'organizationInvitations'), invitationData)
        
        // 이메일 발송
        if (data.sendInvitation) {
          await this.sendInvitationEmail(data.email, data.name, invitationToken)
        }
        
        this.log('구성원 초대 완료', { organizationId, email: data.email })
      } catch (error) {
        this.error('구성원 초대 실패', error as Error, { organizationId, data })
        throw error
      }
    })
  }

  /**
   * 구성원 역할 변경
   */
  async updateMemberRole(
    organizationId: string, 
    memberId: string, 
    role: 'ADMIN' | 'MANAGER' | 'MEMBER'
  ): Promise<void> {
    return this.measureAndLog('updateMemberRole', async () => {
      try {
        await this.checkAdminPermission(organizationId)
        
        const memberRef = doc(db, 'organizations', organizationId, 'members', memberId)
        
        await updateDoc(memberRef, {
          role,
          updatedAt: Timestamp.now(),
          updatedBy: this.getCurrentUserId()
        })
        
        // 권한 재계산
        const permissions = this.calculatePermissionsByRole(role)
        await updateDoc(memberRef, { permissions })
        
        this.log('구성원 역할 변경 완료', { organizationId, memberId, role })
      } catch (error) {
        this.error('구성원 역할 변경 실패', error as Error, { organizationId, memberId, role })
        throw error
      }
    })
  }

  /**
   * 구성원 일괄 초대 (CSV)
   */
  async bulkInviteMembers(
    organizationId: string, 
    csvData: string
  ): Promise<BulkInviteResult> {
    // CSV 파싱 및 검증
    const { valid, invalid, data } = await this.parseAndValidateCSV(csvData)
    
    const results: BulkInviteResult = {
      total: data.length,
      success: 0,
      failed: 0,
      errors: []
    }
    
    // 배치 처리
    const batch = writeBatch(db)
    const batchSize = 100
    
    for (let i = 0; i < valid.length; i += batchSize) {
      const chunk = valid.slice(i, i + batchSize)
      
      for (const member of chunk) {
        try {
          // 각 구성원 초대 처리
          await this.inviteMember(organizationId, member)
          results.success++
        } catch (error) {
          results.failed++
          results.errors.push({
            email: member.email,
            error: (error as Error).message
          })
        }
      }
    }
    
    return results
  }
```

### 2.4 통계 및 분석

```typescript
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
```

## 3. 유틸리티 메서드

```typescript
  // 권한 확인
  private async checkAdminPermission(organizationId: string): Promise<void> {
    const currentUser = this.getCurrentUser()
    if (!currentUser) {
      throw new Error('로그인이 필요합니다.')
    }
    
    const member = await this.getMemberByUserId(organizationId, currentUser.id)
    if (!member || member.role !== 'ADMIN') {
      throw new Error('관리자 권한이 필요합니다.')
    }
  }
  
  // 초대 토큰 생성
  private generateInvitationToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) +
           Date.now().toString(36)
  }
  
  // 역할별 권한 계산
  private calculatePermissionsByRole(role: string): string[] {
    const permissionMap = {
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
    
    return permissionMap[role] || permissionMap.MEMBER
  }
  
  // 현재 사용자 정보
  private getCurrentUser() {
    return enterpriseAuthService.getCurrentContext().user
  }
  
  private getCurrentUserId(): string {
    return this.getCurrentUser()?.id || 'system'
  }
```

## 4. 에러 처리 및 검증

```typescript
  // 이메일 검증
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
  
  // 전화번호 검증
  private validatePhone(phone: string): boolean {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/
    return phoneRegex.test(phone)
  }
  
  // 사업자등록번호 검증
  private validateBusinessNumber(businessNumber: string): boolean {
    const cleaned = businessNumber.replace(/[-\s]/g, '')
    return /^\d{10}$/.test(cleaned)
  }
  
  // CSV 파싱 및 검증
  private async parseAndValidateCSV(csvData: string): Promise<CSVParseResult> {
    const lines = csvData.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    
    const requiredHeaders = ['email', 'name', 'position']
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
    
    if (missingHeaders.length > 0) {
      throw new Error(`필수 헤더가 누락되었습니다: ${missingHeaders.join(', ')}`)
    }
    
    const valid: InviteMemberData[] = []
    const invalid: any[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const row: any = {}
      
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      
      // 검증
      if (!this.validateEmail(row.email)) {
        invalid.push({ ...row, error: '잘못된 이메일 형식' })
        continue
      }
      
      if (!row.name || row.name.length < 2) {
        invalid.push({ ...row, error: '이름은 2글자 이상이어야 합니다' })
        continue
      }
      
      valid.push({
        email: row.email,
        name: row.name,
        position: row.position || '사원',
        role: row.role || 'MEMBER',
        departmentId: row.departmentId
      })
    }
    
    return { valid, invalid, data: [...valid, ...invalid] }
  }
```

## 5. 캐싱 전략

```typescript
  // 캐시 무효화
  private async invalidateOrganizationCache(organizationId: string): Promise<void> {
    const cacheKeys = [
      `org_stats_${organizationId}`,
      `dept_hierarchy_${organizationId}`,
      `departments_${organizationId}`,
      `members_${organizationId}`
    ]
    
    cacheKeys.forEach(key => this.clearCache(key))
  }
  
  // 부서 변경 시 관련 캐시 무효화
  private async invalidateDepartmentCache(organizationId: string): Promise<void> {
    this.clearCache(`dept_hierarchy_${organizationId}`)
    this.clearCache(`departments_${organizationId}`)
    this.clearCache(`org_stats_${organizationId}`)
  }
```

## 6. 실시간 업데이트 (옵션)

```typescript
  // 실시간 구독
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
  
  // 부서 변경 구독
  subscribeToDepartmentChanges(
    organizationId: string,
    callback: (departments: Department[]) => void
  ): () => void {
    const unsubscribe = onSnapshot(
      collection(db, 'organizations', organizationId, 'departments'),
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
```

## 7. Export

```typescript
const organizationManagementService = new OrganizationManagementService()
export default organizationManagementService
```