/**
 * 조직 관리 타입 정의
 * 
 * 조직, 부서, 구성원 관리를 위한 타입 인터페이스
 */

import { Timestamp } from 'firebase/firestore'

/**
 * 조직 정보
 */
export interface Organization {
  id: string
  organizationCode: string
  
  // 기본 정보
  organizationName: string
  businessNumber?: string
  industry: string
  size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE' // 1-50, 51-200, 201-1000, 1000+
  establishedDate?: Timestamp
  
  // 연락처 정보
  contactEmail: string
  contactPhone: string
  address: string
  website?: string
  
  // 추가 정보
  description?: string
  logoUrl?: string
  
  // 관리 정보
  adminUserId: string
  adminEmail: string
  
  // 계약 정보
  servicePackage: 'BASIC' | 'PREMIUM' | 'ENTERPRISE'
  paymentStatus: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'TERMINATED'
  
  // 통계
  totalMembers: number
  activeMembers: number
  totalDepartments: number
  
  // 메타데이터
  isActive: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

/**
 * 부서 정보
 */
export interface Department {
  id: string
  parentId?: string // 상위 부서 ID (계층 구조)
  
  // 기본 정보
  name: string
  code: string // 부서 코드
  description?: string
  level: number // 조직도 레벨 (0: 최상위)
  
  // 관리자 정보
  managerId?: string
  managerName?: string
  managerEmail?: string
  
  // 통계
  memberCount: number
  childDepartmentCount: number
  
  // 메타데이터
  isActive: boolean
  sortOrder: number // 정렬 순서
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy: string
  updatedBy: string
}

/**
 * 조직 구성원
 */
export interface OrganizationMember {
  id: string
  userId: string
  
  // 개인 정보
  employeeId: string
  displayName: string
  email: string
  phone?: string
  profilePhotoUrl?: string
  
  // 조직 정보
  departmentId?: string
  departmentName?: string
  position: string // 직위
  jobTitle?: string // 직무
  
  // 권한 정보
  role: 'ADMIN' | 'MANAGER' | 'MEMBER'
  permissions: string[] // 세부 권한 목록
  
  // 상태 정보
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'RESIGNED'
  invitationToken?: string
  invitationExpiry?: Timestamp
  
  // 메타데이터
  joinedAt: Timestamp
  lastActiveAt?: Timestamp
  resignedAt?: Timestamp
}

/**
 * 조직 초대
 */
export interface OrganizationInvitation {
  id: string
  organizationId: string
  
  // 초대 정보
  email: string
  name: string
  departmentId?: string
  position?: string
  role: 'ADMIN' | 'MANAGER' | 'MEMBER'
  
  // 초대 상태
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
  invitationToken: string
  
  // 메타데이터
  invitedBy: string
  invitedAt: Timestamp
  acceptedAt?: Timestamp
  expiresAt: Timestamp
}

/**
 * 조직 정보 업데이트 데이터
 */
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

/**
 * 부서 생성 데이터
 */
export interface CreateDepartmentData {
  name: string
  code: string
  parentId?: string
  managerId?: string
  description?: string
  sortOrder?: number
}

/**
 * 구성원 초대 데이터
 */
export interface InviteMemberData {
  email: string
  name: string
  departmentId?: string
  position?: string
  role: 'ADMIN' | 'MANAGER' | 'MEMBER'
  sendInvitation?: boolean
}

/**
 * 대기 중인 구성원 (사전 등록)
 */
export interface PendingMember {
  id: string
  organizationId: string
  
  // 개인 정보
  email: string
  name: string
  temporaryPasswordHash: string
  
  // 조직 정보
  departmentId?: string
  position?: string
  role: 'ADMIN' | 'MANAGER' | 'MEMBER'
  
  // 상태 정보
  status: 'PENDING'
  
  // 메타데이터
  createdBy: string
  createdAt: Timestamp
  expiresAt: Timestamp
}

/**
 * 대기 구성원 생성 데이터
 */
export interface CreatePendingMemberData {
  email: string
  name: string
  temporaryPassword: string
  departmentId?: string
  position?: string
  role: 'ADMIN' | 'MANAGER' | 'MEMBER'
}

/**
 * 조직 통계
 */
export interface OrganizationStats {
  totalMembers: number
  activeMembers: number
  totalDepartments: number
  activeDepartments: number
  memberGrowthRate: number // 전월 대비 증가율
  activityRate: number // 활성 사용자 비율
  departmentDistribution: DepartmentDistribution[]
}

/**
 * 부서별 분포
 */
export interface DepartmentDistribution {
  departmentId: string
  departmentName: string
  memberCount: number
  percentage: number
}

/**
 * 부서 노드 (계층 구조 표시용)
 */
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

/**
 * 대량 초대 결과
 */
export interface BulkInviteResult {
  total: number
  success: number
  failed: number
  errors: {
    email: string
    error: string
  }[]
}

/**
 * CSV 파싱 결과
 */
export interface CSVParseResult {
  valid: InviteMemberData[]
  invalid: any[]
  data: any[]
}