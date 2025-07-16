/**
 * Mind Breeze AI - 통합 타입 시스템
 * 
 * 모든 데이터 타입의 단일 소스 진실(Single Source of Truth)
 * Firestore 기반 데이터 구조와 완전 일치하는 TypeScript 인터페이스
 */

// ============================================================================
// 기본 Enum 타입들 (Firestore 컬렉션 구조 기반)
// ============================================================================

export type UserType = 
  | 'SYSTEM_ADMIN'
  | 'ORGANIZATION_ADMIN'  
  | 'ORGANIZATION_MEMBER'
  | 'INDIVIDUAL_USER'
  | 'MEASUREMENT_SUBJECT';

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

export const DEFAULT_PERMISSIONS_BY_USER_TYPE: Record<UserType, string[]> = {
  SYSTEM_ADMIN: ['*'],
  ORGANIZATION_ADMIN: [
    'ORGANIZATION_MANAGE',
    'MEMBER_MANAGE', 
    'CREDIT_MANAGE',
    'REPORT_VIEW',
    'CONSULTATION_ACCESS',
    'ANALYTICS_VIEW'
  ],
  ORGANIZATION_MEMBER: [
    'REPORT_VIEW',
    'CONSULTATION_ACCESS',
    'MEASUREMENT_CREATE'
  ],
  INDIVIDUAL_USER: [
    'REPORT_VIEW',
    'CONSULTATION_ACCESS'
  ],
  MEASUREMENT_SUBJECT: [
    'MEASUREMENT_PARTICIPATE'
  ]
}; 