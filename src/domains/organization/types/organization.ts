// ===== 기본 공통 타입들 =====

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  position?: string;
}

// ===== 조직 관련 타입들 =====

export type OrganizationSize = 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE';
export type OrganizationStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TRIAL';
export type Currency = 'KRW' | 'USD' | 'EUR' | 'JPY';
export type Timezone = 'Asia/Seoul' | 'America/New_York' | 'Europe/London' | 'Asia/Tokyo';

export interface OrganizationSettings {
  timezone: Timezone;
  language: 'ko' | 'en' | 'jp';
  currency: Currency;
  measurementUnit: 'metric' | 'imperial';
  workingHours: {
    start: string; // "09:00"
    end: string;   // "18:00"
    daysOfWeek: number[]; // [1,2,3,4,5] (월-금)
  };
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export interface SubscriptionInfo {
  planType: 'TRIAL' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
  startDate: Date;
  endDate: Date;
  maxUsers: number;
  maxDevices: number;
  features: string[];
  billingCycle: 'MONTHLY' | 'YEARLY';
  nextBillingDate?: Date;
  lastPaymentDate?: Date;
}

/**
 * 조직 (기업) 정보
 */
export interface Organization {
  id: string;
  name: string;
  industry: string;
  size: OrganizationSize;
  employeeCount?: number;
  businessRegistrationNumber?: string; // 사업자등록번호
  website?: string;
  
  // 주소 및 연락처
  address: Address;
  contact: ContactInfo;
  
  // 설정 및 구독
  settings: OrganizationSettings;
  subscription: SubscriptionInfo;
  status: OrganizationStatus;
  
  // 크레딧 관련
  creditBalance: number;
  isTrialActive: boolean;
  trialType?: 'FREE_TRIAL' | 'PAID_TRIAL';
  trialStartDate?: Date;
  trialEndDate?: Date;
  trialCreditsTotal?: number;
  
  // 계약 정보
  contractStartDate?: Date;
  contractEndDate?: Date;
  contractDocument?: string; // 파일 URL
  
  // 메타데이터
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // 생성자 ID
  logo?: string; // 로고 이미지 URL
  description?: string;
}

// ===== 부서 관련 타입들 =====

export interface Department {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  code?: string; // 부서 코드 (예: "HR", "IT", "SALES")
  
  // 조직 구조
  parentId?: string; // 상위 부서 ID
  managerId?: string; // 부서장 ID
  level: number; // 조직 계층 레벨 (0: 최상위)
  order: number; // 같은 레벨 내 정렬 순서
  
  // 통계
  memberCount: number;
  activeMemberCount: number;
  maxMembers?: number; // 최대 인원 제한
  
  // 설정
  active: boolean;
  isHeadquarter: boolean; // 본사 여부
  location?: string; // 위치 정보
  budget?: number; // 예산
  
  // 메타데이터
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * 조직 구조 트리 표현
 */
export interface OrganizationTree {
  department: Department;
  children: OrganizationTree[];
  memberCount: number;
  totalMemberCount: number; // 하위 부서 포함
}

// ===== 통계 관련 타입들 =====

export interface OrganizationStats {
  // 기본 현황
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  pendingMembers: number;
  
  // 측정 관련
  totalMeasurements: number;
  recentMeasurements: number; // 최근 30일
  averageMeasurementsPerUser: number;
  
  // 위험도 관리
  riskMembers: number;
  highRiskMembers: number;
  mediumRiskMembers: number;
  
  // 크레딧 관리
  creditBalance: number;
  creditUsageThisMonth: number;
  creditUsageLastMonth: number;
  averageCreditPerMeasurement: number;
  
  // 디바이스 관련
  totalDevices: number;
  activeDevices: number;
  availableDevices: number;
  maintenanceDevices: number;
  
  // 리포트 관련
  totalReports: number;
  reportsThisMonth: number;
  pendingReports: number;
  averageReportGenerationTime: number; // 분 단위
  
  // 사용률 통계
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  userEngagementRate: number; // 참여율 (%)
  
  // 부서별 통계
  departmentStats: DepartmentStats[];
  
  // 시간대별 활동
  activityByHour: ActivityTimeSlot[];
  activityByDay: ActivityTimeSlot[];
  activityByWeek: ActivityTimeSlot[];
}

export interface DepartmentStats {
  departmentId: string;
  departmentName: string;
  memberCount: number;
  activeMemberCount: number;
  measurementCount: number;
  riskMemberCount: number;
  creditUsage: number;
  averageHealthScore: number;
  participationRate: number; // 측정 참여율
}

export interface ActivityTimeSlot {
  timeSlot: string; // "2024-01-01", "09:00", "Week 1" 등
  userCount: number;
  measurementCount: number;
  averageScore: number;
}

// ===== 위험도 관리 타입들 =====

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskMember {
  userId: string;
  displayName: string;
  email: string;
  department: string;
  riskLevel: RiskLevel;
  riskScore: number; // 0-100
  riskFactors: string[];
  lastMeasurementDate: Date;
  trend: 'IMPROVING' | 'STABLE' | 'WORSENING';
  recommendedActions: string[];
}

export interface HealthTrend {
  date: Date;
  averageScore: number;
  memberCount: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  topRiskFactors: string[];
}

// ===== 조직 관리 요청/응답 타입들 =====

export interface CreateOrganizationRequest {
  name: string;
  industry: string;
  size: OrganizationSize;
  employeeCount?: number;
  businessRegistrationNumber?: string;
  website?: string;
  address: Address;
  contact: ContactInfo;
  settings?: Partial<OrganizationSettings>;
}

export interface UpdateOrganizationRequest {
  name?: string;
  industry?: string;
  size?: OrganizationSize;
  employeeCount?: number;
  businessRegistrationNumber?: string;
  website?: string;
  address?: Partial<Address>;
  contact?: Partial<ContactInfo>;
  settings?: Partial<OrganizationSettings>;
  description?: string;
}

export interface CreateDepartmentRequest {
  organizationId: string;
  name: string;
  description?: string;
  code?: string;
  parentId?: string;
  managerId?: string;
  location?: string;
  maxMembers?: number;
  budget?: number;
}

export interface UpdateDepartmentRequest {
  name?: string;
  description?: string;
  code?: string;
  parentId?: string;
  managerId?: string;
  location?: string;
  maxMembers?: number;
  budget?: number;
  active?: boolean;
  order?: number;
}

// ===== 검색 및 필터 타입들 =====

export interface OrganizationFilters {
  industry?: string;
  size?: OrganizationSize;
  status?: OrganizationStatus;
  minEmployeeCount?: number;
  maxEmployeeCount?: number;
  hasActiveTrial?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface DepartmentFilters {
  parentId?: string;
  managerId?: string;
  active?: boolean;
  minMemberCount?: number;
  maxMemberCount?: number;
  level?: number;
}

export interface OrganizationSearchResult {
  organizations: Organization[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ===== 대시보드 데이터 타입 =====

export interface OrganizationDashboardData {
  organization: Organization;
  stats: OrganizationStats;
  recentActivity: RecentActivity[];
  alerts: OrganizationAlert[];
  trends: HealthTrend[];
  topRiskMembers: RiskMember[];
  departmentHealth: DepartmentHealth[];
  systemNotifications: SystemNotification[];
}

export interface RecentActivity {
  id: string;
  type: 'MEASUREMENT' | 'REPORT_GENERATED' | 'MEMBER_ADDED' | 'DEVICE_ASSIGNED' | 'CREDIT_USED';
  description: string;
  userId?: string;
  userName?: string;
  departmentName?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface OrganizationAlert {
  id: string;
  type: 'HIGH_RISK_MEMBER' | 'LOW_CREDIT' | 'DEVICE_ISSUE' | 'SUBSCRIPTION_EXPIRING' | 'SYSTEM_MAINTENANCE';
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  title: string;
  message: string;
  actionRequired: boolean;
  actionUrl?: string;
  createdAt: Date;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export interface DepartmentHealth {
  departmentId: string;
  departmentName: string;
  overallHealthScore: number; // 0-100
  riskLevel: RiskLevel;
  memberCount: number;
  participationRate: number;
  trend: 'IMPROVING' | 'STABLE' | 'WORSENING';
  lastUpdated: Date;
  topIssues: string[];
  recommendedActions: string[];
}

export interface SystemNotification {
  id: string;
  type: 'SYSTEM_UPDATE' | 'MAINTENANCE' | 'NEW_FEATURE' | 'POLICY_CHANGE';
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  targetAudience: 'ALL' | 'ADMINS' | 'MEMBERS';
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
  actionUrl?: string;
}

// ===== 내보내기 =====
// 모든 타입들은 named export로 내보냅니다. 