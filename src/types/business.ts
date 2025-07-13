// B2B/B2C Mind Breeze AI Report - Business Types
// 조직 기반 사용자 관리 및 크레딧 시스템

export type UserType = 
  | 'SYSTEM_ADMIN'           // 시스템 관리자
  | 'ORGANIZATION_ADMIN'     // 조직 관리자 
  | 'ORGANIZATION_MEMBER'    // 조직 구성원
  | 'INDIVIDUAL_USER';       // 개인 사용자

export type VolumeDiscountTier = 
  | 'TIER_0'    // 1-99명 (할인 없음)
  | 'TIER_1'    // 100-499명 (10% 할인)
  | 'TIER_2'    // 500-999명 (20% 할인)
  | 'TIER_3'    // 1000-4999명 (25% 할인)
  | 'TIER_4';   // 5000명+ (30% 할인)

export type TrialType = 
  | 'FREE_TRIAL'    // 무료 체험 (디바이스 구매시 5회 무료)
  | 'PAID_TRIAL';   // 유료 체험 (10만원으로 10회 체험)

export type CreditTransactionType = 
  | 'PURCHASE'         // 크레딧 구매
  | 'TRIAL_GRANT'      // 체험 크레딧 지급
  | 'BONUS_GRANT'      // 보너스 크레딧 지급
  | 'REPORT_USAGE'     // 리포트 생성 사용
  | 'CONSULTATION_USAGE' // 상담 사용
  | 'REFUND'           // 환불
  | 'EXPIRY';          // 만료

export type OrganizationStatus = 
  | 'ACTIVE'           // 활성
  | 'TRIAL'            // 체험중
  | 'SUSPENDED'        // 일시정지
  | 'TERMINATED';      // 해지

export type ServicePackageType = 
  | 'BASIC'            // 기본 (리포트 + 기본상담)
  | 'PREMIUM'          // 프리미엄 (리포트 + 고급상담 + 추가기능)
  | 'ENTERPRISE';      // 엔터프라이즈 (맞춤형)

// === 조직 관련 타입 ===

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
  basePrice: number;          // 7,900원
  discountedPrice: number;    // 할인 적용된 가격
  
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
  adminUserId: string;
  
  // 메타데이터
  createdAt: Date;
  updatedAt: Date;
  
  // 설정
  settings: {
    autoRenew: boolean;
    notificationEnabled: boolean;
    reportLanguage: 'ko' | 'en' | 'jp';
    measurementFrequency: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL';
  };
}

export interface OrganizationMember {
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

// === 사용자 관련 타입 ===

export interface EnterpriseUser {
  id: string;
  email?: string;           // 개인 사용자만 필수
  employeeId?: string;      // 조직 구성원만 필수
  organizationId?: string;  // 조직 구성원/관리자만
  userType: UserType;
  
  displayName: string;
  profileImage?: string;
  
  // 조직 관련 정보 (조직 사용자만)
  department?: string;
  position?: string;
  
  // 개인 크레딧 (개인 사용자만)
  personalCreditBalance?: number;
  
  // 권한
  permissions: string[];
  
  // 메타데이터
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

// === 크레딧 관련 타입 ===

export interface CreditTransaction {
  id: string;
  organizationId?: string;  // 조직 크레딧인 경우
  userId?: string;          // 개인 크레딧인 경우
  
  amount: number;           // 양수: 충전, 음수: 사용
  balanceAfter: number;     // 거래 후 잔액
  
  type: CreditTransactionType;
  description: string;
  
  // 추가 정보
  metadata?: {
    reportId?: string;
    consultationId?: string;
    paymentId?: string;
    originalPrice?: number;
    discountApplied?: number;
  };
  
  createdAt: Date;
  createdBy: string;        // 사용자 ID
}

export interface CreditPackage {
  id: string;
  name: string;
  description: string;
  creditAmount: number;
  price: number;            // 원
  validityDays: number;     // 유효기간 (일)
  isActive: boolean;
  
  // 할인 조건
  volumeDiscounts: {
    minQuantity: number;
    discountPercent: number;
  }[];
}

// === 체험 서비스 관련 타입 ===

export interface TrialService {
  id: string;
  organizationId: string;
  trialType: TrialType;
  
  // 체험 조건
  maxCredits: number;       // 최대 사용 가능 크레딧
  validityDays: number;     // 유효 기간
  
  // 현재 상태
  creditsUsed: number;
  remainingCredits: number;
  
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  
  // 결과
  conversionDate?: Date;    // 정식 계약 전환일
  conversionDiscount?: number; // 전환시 추가 할인
  
  createdAt: Date;
  updatedAt: Date;
}

// === 볼륨 할인 관련 타입 ===

export interface VolumeDiscountConfig {
  tier: VolumeDiscountTier;
  minMembers: number;
  maxMembers?: number;
  discountPercent: number;
  description: string;
}

export const VOLUME_DISCOUNT_TIERS: VolumeDiscountConfig[] = [
  {
    tier: 'TIER_0',
    minMembers: 1,
    maxMembers: 99,
    discountPercent: 0,
    description: '1-99명 (기본가격)'
  },
  {
    tier: 'TIER_1', 
    minMembers: 100,
    maxMembers: 499,
    discountPercent: 10,
    description: '100-499명 (10% 할인)'
  },
  {
    tier: 'TIER_2',
    minMembers: 500, 
    maxMembers: 999,
    discountPercent: 20,
    description: '500-999명 (20% 할인)'
  },
  {
    tier: 'TIER_3',
    minMembers: 1000,
    maxMembers: 4999, 
    discountPercent: 25,
    description: '1000-4999명 (25% 할인)'
  },
  {
    tier: 'TIER_4',
    minMembers: 5000,
    discountPercent: 30,
    description: '5000명+ (30% 할인)'
  }
];

// === 가격 계산 관련 타입 ===

export interface PricingCalculation {
  memberCount: number;
  basePrice: number;        // 7,900원
  volumeTier: VolumeDiscountTier;
  discountPercent: number;
  discountedPrice: number;  // 인당 할인된 가격
  totalServiceCost: number; // 총 서비스 비용
  
  // 디바이스 비용 (별도)
  deviceCost: {
    rental?: {
      period: '1M' | '3M' | '6M';
      cost: number;
    };
    purchase?: {
      cost: number;
      freeCredits: number;
    };
  };
  
  // 체험 서비스
  trialOptions?: {
    freeOption: {
      description: string;
      value: number;
    };
    paidOption: {
      cost: number;
      credits: number;
      value: number;
      discountPercent: number;
    };
  };
}

// === 리포트 및 상담 관련 타입 ===

export interface AIReportUsage {
  id: string;
  userId: string;
  organizationId?: string;
  
  reportType: 'BASIC' | 'DETAILED' | 'COMPREHENSIVE';
  creditCost: number;
  
  sessionDataId: string;
  reportContent: string;
  generatedAt: Date;
  
  // 품질 평가
  qualityScore?: number;
  feedback?: string;
}

export interface ConsultationUsage {
  id: string;
  userId: string;
  organizationId?: string;
  
  consultationType: 'BASIC' | 'PREMIUM';
  creditCost: number;
  
  messages: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }[];
  
  startedAt: Date;
  endedAt?: Date;
  duration?: number;        // 초 단위
  
  // 만족도 평가
  satisfaction?: number;    // 1-5점
  feedback?: string;
}

// === 비즈니스 메트릭 타입 ===

export interface BusinessMetrics {
  organizationId: string;
  period: {
    start: Date;
    end: Date;
  };
  
  // 사용량 메트릭
  reportsGenerated: number;
  consultationsSessions: number;
  creditsConsumed: number;
  
  // 참여도 메트릭
  activeMemberCount: number;
  totalMemberCount: number;
  participationRate: number;    // %
  
  // 완료율 메트릭
  completedMeasurements: number;
  scheduledMeasurements: number;
  completionRate: number;       // %
  
  // 만족도 메트릭
  avgReportRating: number;
  avgConsultationRating: number;
  npsScore?: number;            // Net Promoter Score
  
  generatedAt: Date;
}

// === 계약 및 결제 관련 타입 ===

export interface Contract {
  id: string;
  organizationId: string;
  
  servicePackage: ServicePackageType;
  memberCount: number;
  pricePerMember: number;
  totalAmount: number;
  
  startDate: Date;
  endDate: Date;
  renewalTerms: {
    autoRenew: boolean;
    noticePeriodDays: number;
  };
  
  // 결제 정보
  paymentMethod: 'BANK_TRANSFER' | 'CREDIT_CARD' | 'CORPORATE_CARD';
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  
  createdAt: Date;
  updatedAt: Date;
  signedBy: string;             // 서명자 사용자 ID
}

// === 헬퍼 함수 타입 ===

export interface VolumeDiscountCalculator {
  calculateTier: (memberCount: number) => VolumeDiscountTier;
  calculatePrice: (memberCount: number, basePrice: number) => PricingCalculation;
  calculateTrialValue: (memberCount: number) => number;
}

export interface CreditCalculator {
  calculateReportCost: (reportType: string) => number;
  calculateConsultationCost: (consultationType: string) => number;
  estimateMonthlyUsage: (memberCount: number) => number;
}

// === API 응답 타입 ===

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// 기본 값들 Export
export const DEFAULT_BASE_PRICE = 7900;  // 원
export const DEFAULT_CREDIT_PER_REPORT = 1;
export const DEFAULT_CREDIT_PER_CONSULTATION = 1;

export const TRIAL_CONFIGS = {
  FREE_TRIAL: {
    credits: 5,
    validityDays: 90,
    cost: 0
  },
  PAID_TRIAL: {
    credits: 10,
    validityDays: 30,
    cost: 100000  // 10만원
  }
} as const; 