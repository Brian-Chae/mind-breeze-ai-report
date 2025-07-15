// ===== 멤버 역할 및 상태 타입들 =====

export type MemberRole = 
  | 'ORGANIZATION_ADMIN'    // 조직 관리자
  | 'ORGANIZATION_MEMBER'   // 조직 구성원
  | 'DEPARTMENT_MANAGER'    // 부서 관리자
  | 'TEAM_LEADER'          // 팀 리더
  | 'SUPERVISOR'           // 감독자
  | 'EMPLOYEE';            // 일반 직원

export type MemberStatus = 
  | 'ACTIVE'      // 활성
  | 'INACTIVE'    // 비활성
  | 'PENDING'     // 대기 중 (초대 수락 대기)
  | 'SUSPENDED'   // 정지
  | 'RESIGNED';   // 퇴사

export type InvitationStatus = 
  | 'PENDING'    // 초대 대기 중
  | 'ACCEPTED'   // 수락됨
  | 'EXPIRED'    // 만료됨
  | 'CANCELLED'  // 취소됨
  | 'RESENT';    // 재전송됨

// ===== 권한 관련 타입들 =====

export type PermissionAction = 
  | 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'MANAGE';

export type PermissionResource = 
  | 'ORGANIZATION'        // 조직 관리
  | 'DEPARTMENT'         // 부서 관리
  | 'MEMBER'            // 멤버 관리
  | 'USER'              // 사용자 관리
  | 'DEVICE'            // 디바이스 관리
  | 'MEASUREMENT'       // 측정 관리
  | 'REPORT'            // 리포트 관리
  | 'CREDIT'            // 크레딧 관리
  | 'SETTINGS'          // 설정 관리
  | 'ANALYTICS'         // 분석 조회
  | 'INVITATION'        // 초대 관리
  | 'BILLING';          // 결제 관리

export interface Permission {
  id: string;
  resource: PermissionResource;
  actions: PermissionAction[];
  description: string;
  constraints?: PermissionConstraint[];
}

export interface PermissionConstraint {
  type: 'DEPARTMENT' | 'TIME' | 'IP' | 'CUSTOM';
  value: string;
  description?: string;
}

// ===== 조직 멤버 타입들 =====

/**
 * 조직 멤버 정보
 */
export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  
  // 기본 정보
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  
  // 역할 및 권한
  role: MemberRole;
  status: MemberStatus;
  permissions: Permission[];
  customPermissions?: Permission[]; // 개별 커스텀 권한
  
  // 조직 내 정보
  departments: string[]; // 소속 부서 ID 목록
  primaryDepartmentId?: string; // 주 소속 부서
  employeeId?: string;
  position?: string; // 직급/직책
  jobTitle?: string; // 업무 분야
  
  // 연락처
  phoneNumber?: string;
  extension?: string; // 내선번호
  officeLocation?: string;
  
  // 근무 정보
  startDate?: Date; // 입사일
  endDate?: Date; // 퇴사일
  workingHours?: {
    start: string; // "09:00"
    end: string;   // "18:00"
    daysOfWeek: number[]; // [1,2,3,4,5]
    timezone: string;
  };
  
  // 초대 및 활동 정보
  invitedAt: Date;
  invitedBy: string; // 초대한 사람의 ID
  joinedAt?: Date;
  lastActiveAt?: Date;
  lastLoginAt?: Date;
  loginCount: number;
  
  // 설정
  preferences: MemberPreferences;
  
  // 메타데이터
  createdAt: Date;
  updatedAt: Date;
  notes?: string; // 관리자 메모
}

export interface MemberPreferences {
  language: 'ko' | 'en' | 'jp';
  timezone: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    reportGenerated: boolean;
    measurementReminder: boolean;
    systemAlerts: boolean;
  };
  dashboard: {
    defaultView: string;
    chartPreferences: Record<string, any>;
  };
}

// ===== 초대 관련 타입들 =====

/**
 * 멤버 초대 정보
 */
export interface Invitation {
  id: string;
  organizationId: string;
  
  // 초대 대상
  email: string;
  role: MemberRole;
  departments?: string[];
  permissions?: Permission[];
  
  // 초대 상태
  status: InvitationStatus;
  token: string; // 초대 토큰
  expiresAt: Date;
  
  // 초대자 정보
  invitedBy: string;
  invitedByName: string;
  personalMessage?: string; // 개인 메시지
  
  // 수락 정보
  acceptedAt?: Date;
  acceptedBy?: string; // 수락한 사용자 ID
  
  // 이력
  sentAt: Date;
  resentAt?: Date;
  resentCount: number;
  
  // 메타데이터
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

// ===== 요청 타입들 =====

export interface InviteMemberRequest {
  organizationId: string;
  email: string;
  role: MemberRole;
  departments?: string[];
  permissions?: Permission[];
  personalMessage?: string;
  employeeId?: string;
  position?: string;
  jobTitle?: string;
  startDate?: Date;
  workingHours?: {
    start: string;
    end: string;
    daysOfWeek: number[];
  };
}

export interface UpdateMemberRequest {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  role?: MemberRole;
  status?: MemberStatus;
  departments?: string[];
  primaryDepartmentId?: string;
  permissions?: Permission[];
  employeeId?: string;
  position?: string;
  jobTitle?: string;
  phoneNumber?: string;
  extension?: string;
  officeLocation?: string;
  startDate?: Date;
  endDate?: Date;
  workingHours?: {
    start: string;
    end: string;
    daysOfWeek: number[];
    timezone: string;
  };
  preferences?: Partial<MemberPreferences>;
  notes?: string;
}

export interface BulkInviteMemberRequest {
  organizationId: string;
  members: {
    email: string;
    role: MemberRole;
    departments?: string[];
    employeeId?: string;
    displayName?: string;
    position?: string;
    jobTitle?: string;
  }[];
  defaultPermissions?: Permission[];
  personalMessage?: string;
}

// ===== 응답 타입들 =====

export interface MemberListResponse {
  members: OrganizationMember[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface InvitationListResponse {
  invitations: Invitation[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface BulkInviteResponse {
  success: boolean;
  successCount: number;
  failureCount: number;
  results: {
    email: string;
    success: boolean;
    invitationId?: string;
    error?: string;
  }[];
  failedEmails: string[];
}

// ===== 검색 및 필터 타입들 =====

export interface MemberFilters {
  role?: MemberRole;
  status?: MemberStatus;
  departments?: string[];
  position?: string;
  invitedAfter?: Date;
  invitedBefore?: Date;
  joinedAfter?: Date;
  joinedBefore?: Date;
  lastActiveAfter?: Date;
  lastActiveBefore?: Date;
  hasPermission?: PermissionResource;
  searchQuery?: string; // 이름, 이메일, 직원번호 검색
}

export interface InvitationFilters {
  status?: InvitationStatus;
  role?: MemberRole;
  invitedBy?: string;
  invitedAfter?: Date;
  invitedBefore?: Date;
  expiringBefore?: Date;
  searchQuery?: string; // 이메일 검색
}

// ===== 통계 타입들 =====

export interface MemberStats {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  pendingCount: number;
  suspendedCount: number;
  resignedCount: number;
  
  byRole: {
    role: MemberRole;
    count: number;
  }[];
  
  byDepartment: {
    departmentId: string;
    departmentName: string;
    count: number;
    activeCount: number;
  }[];
  
  recentJoins: OrganizationMember[]; // 최근 7일
  recentActivity: {
    date: string;
    activeMembers: number;
    logins: number;
    invitationsSent: number;
    membersJoined: number;
  }[];
  
  invitationStats: {
    totalSent: number;
    pending: number;
    accepted: number;
    expired: number;
    cancelled: number;
    acceptanceRate: number; // 수락률 (%)
    averageAcceptanceTime: number; // 평균 수락 시간 (시간)
  };
}

// ===== 역할 및 권한 관리 타입들 =====

export interface RoleDefinition {
  role: MemberRole;
  displayName: string;
  description: string;
  level: number; // 권한 레벨 (높을수록 상위)
  defaultPermissions: Permission[];
  canManageRoles: MemberRole[]; // 관리할 수 있는 역할들
  isCustomizable: boolean; // 커스텀 권한 추가 가능 여부
}

export interface PermissionTemplate {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  applicableRoles: MemberRole[];
  isDefault: boolean;
}

// ===== 멤버 활동 로그 타입들 =====

export interface MemberActivityLog {
  id: string;
  memberId: string;
  organizationId: string;
  
  action: MemberActivityAction;
  description: string;
  details?: Record<string, any>;
  
  // 대상 정보
  targetType?: 'MEMBER' | 'DEPARTMENT' | 'DEVICE' | 'REPORT' | 'SETTINGS';
  targetId?: string;
  targetName?: string;
  
  // 결과
  success: boolean;
  errorMessage?: string;
  
  // 컨텍스트
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  
  // 메타데이터
  timestamp: Date;
  duration?: number; // 작업 수행 시간 (ms)
}

export type MemberActivityAction = 
  | 'LOGIN' | 'LOGOUT' | 'PASSWORD_CHANGE' | 'PROFILE_UPDATE'
  | 'MEMBER_INVITE' | 'MEMBER_UPDATE' | 'MEMBER_ACTIVATE' | 'MEMBER_DEACTIVATE'
  | 'PERMISSION_GRANT' | 'PERMISSION_REVOKE'
  | 'DEPARTMENT_JOIN' | 'DEPARTMENT_LEAVE'
  | 'MEASUREMENT_CREATE' | 'REPORT_GENERATE' | 'REPORT_VIEW'
  | 'DEVICE_ASSIGN' | 'DEVICE_RELEASE'
  | 'SETTINGS_UPDATE' | 'CREDIT_USE'
  | 'ORGANIZATION_UPDATE' | 'BULK_OPERATION';

// ===== 대시보드 데이터 타입들 =====

export interface MemberDashboardData {
  stats: MemberStats;
  recentMembers: OrganizationMember[];
  pendingInvitations: Invitation[];
  recentActivity: MemberActivityLog[];
  departmentBreakdown: {
    departmentId: string;
    departmentName: string;
    memberCount: number;
    activeCount: number;
    recentJoins: number;
  }[];
  roleDistribution: {
    role: MemberRole;
    count: number;
    percentage: number;
  }[];
}

// ===== 알림 타입들 =====

export interface MemberAlert {
  id: string;
  type: 'INVITATION_EXPIRING' | 'MEMBER_INACTIVE' | 'PERMISSION_CHANGE' | 'BULK_OPERATION_COMPLETE';
  severity: 'INFO' | 'WARNING' | 'ERROR';
  title: string;
  message: string;
  memberId?: string;
  memberEmail?: string;
  actionRequired: boolean;
  actionUrl?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

// ===== 내보내기 =====
// 모든 타입들은 named export로 내보냅니다. 