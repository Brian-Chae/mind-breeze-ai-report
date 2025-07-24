/**
 * Mind Breeze AI - 통합 타입 시스템
 * 
 * 모든 데이터 타입의 단일 소스 진실(Single Source of Truth)
 * Firestore 기반 데이터 구조와 완전 일치하는 TypeScript 인터페이스
 */

// ============================================================================
// 기본 Enum 타입들 (Firestore 컬렉션 구조 기반)
// ============================================================================

export enum UserType {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  ORGANIZATION_ADMIN = 'ORGANIZATION_ADMIN',
  ORGANIZATION_MEMBER = 'ORGANIZATION_MEMBER',
  INDIVIDUAL_USER = 'INDIVIDUAL_USER',
  MEASUREMENT_SUBJECT = 'MEASUREMENT_SUBJECT'
}

export type VolumeDiscountTier = 
  | 'TIER_0'  // 1-99명
  | 'TIER_1'  // 100-499명  
  | 'TIER_2'  // 500-999명
  | 'TIER_3'  // 1000-4999명
  | 'TIER_4'; // 5000명+

export type TrialType = 
  | 'FREE_TRIAL'
  | 'PAID_TRIAL';

export type OrganizationStatus = 
  | 'ACTIVE'
  | 'TRIAL'
  | 'SUSPENDED'
  | 'TERMINATED';

export type CompanyPaymentStatus = 
  | 'PENDING'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'TERMINATED';

export type ServicePackageType = 
  | 'BASIC'
  | 'PREMIUM'
  | 'ENTERPRISE';

export type AuthStatus = 
  | 'AUTHENTICATED'
  | 'UNAUTHENTICATED';

export type CreditTransactionType = 
  | 'PURCHASE'
  | 'TRIAL_GRANT'
  | 'BONUS_GRANT'
  | 'REPORT_USAGE'
  | 'CONSULTATION_USAGE'
  | 'REFUND'
  | 'EXPIRY';

// ============================================================================
// 핵심 엔티티 인터페이스들 (Firestore 컬렉션 구조 기반)
// ============================================================================

/**
 * 통합 사용자 인터페이스 (Firestore users 컬렉션 기반)
 */
export interface User {
  id: string;                    // 사용자 고유 ID (Firebase UID)
  
  // 기본 사용자 정보
  email?: string;
  displayName?: string;
  createdAt: Date;
  lastLoginAt?: Date;
  
  // B2B/B2C 확장 필드
  employeeId?: string;           // 조직 구성원용 직원 ID
  organizationId?: string;       // 조직 참조 (조직 사용자만)
  organizationCode?: string;     // 6자리 조직 코드
  userType: UserType;            // 사용자 유형
  department?: string;           // 부서 (조직 사용자만)
  position?: string;             // 직책 (조직 사용자만)
  personalCreditBalance?: number; // 개인 크레딧 (개인 사용자만)
  isActive: boolean;             // 활성 상태
  profileImage?: string;         // 프로필 이미지 URL
  
  // 연락처 정보
  phone?: string;                // 전화번호
  address?: string;              // 주소 (우편물 받아볼 주소)
  
  // 권한 (JSON 배열로 저장)
  permissions: string[];         // JSON string array
  
  // MEASUREMENT_SUBJECT 전용 필드
  accessToken?: string;          // 이메일 링크 접속용 토큰
  tokenExpiresAt?: Date;         // 토큰 만료 시간
  
  updatedAt?: Date;
}

/**
 * 조직 인터페이스 (Firestore organizations 컬렉션 기반)
 */
export interface Organization {
  id: string;
  name: string;
  businessNumber: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  
  // 크레딧 관리
  creditBalance: number;
  totalMemberCount: number;
  volumeTier: VolumeDiscountTier;
  basePrice: number;              // 7900원
  discountedPrice: number;        // 할인 적용된 가격
  
  // 체험 서비스
  isTrialActive: boolean;
  trialType?: TrialType;
  trialStartDate?: Date;
  trialEndDate?: Date;
  trialCreditsUsed: number;
  trialCreditsTotal: number;
  
  // 계약 정보
  contractStartDate?: Date;
  contractEndDate?: Date;
  servicePackage: ServicePackageType;
  status: OrganizationStatus;
  
  // 관리자 정보
  adminUserId: string;            // 기업 관리자 사용자 ID
  
  // 설정 (JSON으로 저장)
  settings?: string;              // JSON settings object
  
  // 메타데이터
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 조직 멤버 인터페이스 (Firestore organizationMembers 컬렉션 기반)
 */
export interface OrganizationMember {
  id: string;
  userId: string;
  organizationId: string;
  employeeId: string;
  department?: string;
  position?: string;
  joinedAt: Date;
  isActive: boolean;
  
  // 사용 통계
  reportsGenerated: number;
  consultationsUsed: number;
  lastActivityAt?: Date;
}

/**
 * 크레딧 거래 인터페이스 (Firestore creditTransactions 컬렉션 기반)
 */
export interface CreditTransaction {
  id: string;
  organizationId?: string;        // 조직 크레딧인 경우
  companyId?: string;            // 기업 크레딧인 경우  
  userId?: string;               // 개인 크레딧인 경우
  
  amount: number;                // 양수: 충전, 음수: 사용
  balanceAfter: number;          // 거래 후 잔액
  
  type: CreditTransactionType;
  description: string;
  
  // 추가 정보 (JSON으로 저장)
  metadata?: string;             // JSON metadata object
  
  createdAt: Date;
  createdBy: string;             // 트랜잭션 생성자 ID
}

// ============================================================================
// 확장 인터페이스들 (기존 도메인 타입들 통합)
// ============================================================================

/**
 * 사용자 인증 컨텍스트
 */
export interface AuthContext {
  user: User | null;
  organization: Organization | null;
  memberInfo: OrganizationMember | null;
  permissions: string[];
  isLoading: boolean;
  isTokenAccess?: boolean;  // 토큰 기반 접속 여부
}

/**
 * 로그인 자격증명
 */
export interface LoginCredentials {
  email?: string;           // 개인 사용자용
  employeeId?: string;      // 조직 구성원용
  organizationId?: string;  // 조직 구성원용
  password: string;
}

/**
 * 회원가입 데이터
 */
export interface RegistrationData {
  userType: UserType;
  email?: string;           // 개인 사용자 및 조직 관리자용
  employeeId?: string;      // 조직 구성원용
  organizationId?: string;  // 조직 구성원용
  displayName: string;
  password: string;
  
  // 개인 정보
  phone?: string;           // 전화번호
  address?: string;         // 주소
  
  // 조직 관련 (조직 사용자만)
  department?: string;
  position?: string;
  
  // 조직 생성 (조직 관리자만)
  organizationData?: {
    name: string;
    businessNumber: string;
    contactEmail: string;
    contactPhone?: string;
    address?: string;
    initialMemberCount: number;
    servicePackage: ServicePackageType;
  };
}

// ============================================================================
// Repository 패턴을 위한 응답 타입들
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// 상수 정의
// ============================================================================

export const DEFAULT_BASE_PRICE = 7900;

// 볼륨 할인 계층 구조 (배열 형태 - iterate 가능)
export const VOLUME_DISCOUNT_TIERS: { tier: VolumeDiscountTier; min: number; max: number; discount: number }[] = [
  { tier: 'TIER_0', min: 1, max: 99, discount: 0 },
  { tier: 'TIER_1', min: 100, max: 499, discount: 0.1 },
  { tier: 'TIER_2', min: 500, max: 999, discount: 0.2 },
  { tier: 'TIER_3', min: 1000, max: 4999, discount: 0.25 },
  { tier: 'TIER_4', min: 5000, max: 999999, discount: 0.3 }
];

// 볼륨 할인 계층 구조 (Record 형태 - 직접 접근 가능)
export const VOLUME_DISCOUNT_TIERS_MAP: Record<VolumeDiscountTier, { min: number; max: number; discount: number }> = {
  TIER_0: { min: 1, max: 99, discount: 0 },
  TIER_1: { min: 100, max: 499, discount: 0.1 },
  TIER_2: { min: 500, max: 999, discount: 0.2 },
  TIER_3: { min: 1000, max: 4999, discount: 0.25 },
  TIER_4: { min: 5000, max: 999999, discount: 0.3 }
};

// ============================================================================
// 통합 권한 시스템 (Permission System)
// ============================================================================

/**
 * 시스템 권한 정의
 * 계층적 구조: 도메인:액션:리소스 형태
 */
export enum Permission {
  // System Administration (시스템 관리)
  SYSTEM_ALL = 'system:all',
  SYSTEM_READ = 'system:read',
  SYSTEM_CONFIG = 'system:config',
  SYSTEM_LOGS = 'system:logs',
  SYSTEM_MAINTENANCE = 'system:maintenance',
  
  // Organization Management (조직 관리)
  ORGANIZATION_ALL = 'organization:all',
  ORGANIZATION_CREATE = 'organization:create',
  ORGANIZATION_READ = 'organization:read',
  ORGANIZATION_UPDATE = 'organization:update',
  ORGANIZATION_DELETE = 'organization:delete',
  ORGANIZATION_SETTINGS = 'organization:settings',
  
  // Member Management (구성원 관리)
  MEMBER_ALL = 'member:all',
  MEMBER_INVITE = 'member:invite',
  MEMBER_READ = 'member:read',
  MEMBER_UPDATE = 'member:update',
  MEMBER_DELETE = 'member:delete',
  MEMBER_ROLE_ASSIGN = 'member:role:assign',
  
  // Credit Management (크레딧 관리)
  CREDIT_ALL = 'credit:all',
  CREDIT_PURCHASE = 'credit:purchase',
  CREDIT_VIEW = 'credit:view',
  CREDIT_TRANSFER = 'credit:transfer',
  CREDIT_REFUND = 'credit:refund',
  
  // Device Management (디바이스 관리)
  DEVICE_ALL = 'device:all',
  DEVICE_REGISTER = 'device:register',
  DEVICE_ASSIGN = 'device:assign',
  DEVICE_UNASSIGN = 'device:unassign',
  DEVICE_DELETE = 'device:delete',
  DEVICE_VIEW = 'device:view',
  
  // Report & Analysis (리포트 및 분석)
  REPORT_ALL = 'report:all',
  REPORT_GENERATE = 'report:generate',
  REPORT_VIEW = 'report:view',
  REPORT_SHARE = 'report:share',
  REPORT_DELETE = 'report:delete',
  
  // Analytics (분석)
  ANALYTICS_ALL = 'analytics:all',
  ANALYTICS_VIEW = 'analytics:view',
  ANALYTICS_EXPORT = 'analytics:export',
  ANALYTICS_DASHBOARD = 'analytics:dashboard',
  
  // Measurement (측정)
  MEASUREMENT_CREATE = 'measurement:create',
  MEASUREMENT_PARTICIPATE = 'measurement:participate',
  MEASUREMENT_VIEW_OWN = 'measurement:view:own',
  MEASUREMENT_VIEW_ALL = 'measurement:view:all',
  
  // Consultation (상담)
  CONSULTATION_ACCESS = 'consultation:access',
  CONSULTATION_BOOK = 'consultation:book',
  CONSULTATION_MANAGE = 'consultation:manage',
  
  // User Management (사용자 관리)
  USER_ALL = 'user:all',
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_IMPERSONATE = 'user:impersonate',
  
  // Settings (설정)
  SETTINGS_ALL = 'settings:all',
  SETTINGS_SYSTEM = 'settings:system',
  SETTINGS_ORGANIZATION = 'settings:organization',
  SETTINGS_PERSONAL = 'settings:personal'
}

/**
 * 권한 그룹 정의 (자주 사용되는 권한 조합)
 */
export const PERMISSION_GROUPS = {
  // 시스템 관리자 - 모든 권한
  SYSTEM_ADMIN_PERMISSIONS: [Permission.SYSTEM_ALL] as Permission[],
  
  // 조직 관리자 - 조직 내 모든 관리 권한
  ORGANIZATION_ADMIN_PERMISSIONS: [
    Permission.ORGANIZATION_READ,
    Permission.ORGANIZATION_UPDATE,
    Permission.ORGANIZATION_SETTINGS,
    Permission.MEMBER_ALL,
    Permission.CREDIT_ALL,
    Permission.DEVICE_ALL,
    Permission.REPORT_VIEW,
    Permission.ANALYTICS_ALL,
    Permission.CONSULTATION_MANAGE,
    Permission.SETTINGS_ORGANIZATION
  ] as Permission[],
  
  // 조직 구성원 - 기본 업무 권한
  ORGANIZATION_MEMBER_PERMISSIONS: [
    Permission.REPORT_GENERATE,
    Permission.REPORT_VIEW,
    Permission.MEASUREMENT_CREATE,
    Permission.MEASUREMENT_VIEW_OWN,
    Permission.CONSULTATION_ACCESS,
    Permission.CONSULTATION_BOOK,
    Permission.SETTINGS_PERSONAL
  ] as Permission[],
  
  // 개인 사용자 - 개인 서비스 이용 권한
  INDIVIDUAL_USER_PERMISSIONS: [
    Permission.REPORT_GENERATE,
    Permission.REPORT_VIEW,
    Permission.CONSULTATION_ACCESS,
    Permission.CONSULTATION_BOOK,
    Permission.SETTINGS_PERSONAL
  ] as Permission[],
  
  // 측정 대상자 - 측정 참여만 가능
  MEASUREMENT_SUBJECT_PERMISSIONS: [
    Permission.MEASUREMENT_PARTICIPATE,
    Permission.MEASUREMENT_VIEW_OWN
  ] as Permission[]
};

/**
 * 사용자 유형별 기본 권한 매핑
 * 확장된 Permission enum 기반으로 재정의
 */
export const DEFAULT_PERMISSIONS_BY_USER_TYPE: Record<UserType, Permission[]> = {
  [UserType.SYSTEM_ADMIN]: PERMISSION_GROUPS.SYSTEM_ADMIN_PERMISSIONS,
  [UserType.ORGANIZATION_ADMIN]: PERMISSION_GROUPS.ORGANIZATION_ADMIN_PERMISSIONS,
  [UserType.ORGANIZATION_MEMBER]: PERMISSION_GROUPS.ORGANIZATION_MEMBER_PERMISSIONS,
  [UserType.INDIVIDUAL_USER]: PERMISSION_GROUPS.INDIVIDUAL_USER_PERMISSIONS,
  [UserType.MEASUREMENT_SUBJECT]: PERMISSION_GROUPS.MEASUREMENT_SUBJECT_PERMISSIONS
};

/**
 * 권한 검사를 위한 유틸리티 타입
 */
export type PermissionCheck = {
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  canAccess: (resource: string, action: string) => boolean;
}; 