/**
 * 🏭 디바이스 관리 시스템 타입 정의
 * 완전한 디바이스 라이프사이클 관리를 위한 타입 시스템
 */

// ============================================================================
// 1. 디바이스 재고 (DeviceInventory) - 재고 관리 탭
// ============================================================================

export interface DeviceInventory {
  id: string; // 디바이스 시리얼 넘버 (예: "LXB-010414")
  deviceType: 'LINK_BAND_2.0' | 'LINK_BAND_3.0' | string; // 기본값: LINK_BAND_2.0
  registrationDate: Date; // 등록일자 (기본값: 오늘)
  status: 'AVAILABLE' | 'ASSIGNED' | 'IN_USE' | 'MAINTENANCE' | 'RETURNED' | 'DISPOSED';
  purchaseCost?: number; // 구매 비용
  supplier?: string; // 공급업체
  warrantyPeriod?: number; // 보증 기간 (개월)
  notes?: string; // 메모
  createdAt: Date;
  updatedAt: Date;
}

// 재고 등록 요청 데이터
export interface CreateDeviceInventoryRequest {
  deviceType?: string; // 기본값: 'LINK_BAND_2.0'
  registrationDate?: Date; // 기본값: 오늘
  purchaseCost?: number;
  supplier?: string;
  warrantyPeriod?: number; // 기본값: 12개월
  notes?: string;
}

// 재고 통계
export interface InventoryStats {
  total: number;
  available: number;
  assigned: number;
  inUse: number;
  maintenance: number;
  returned: number;
  disposed: number;
}

// ============================================================================
// 2. 디바이스 배정 (DeviceAssignment) - 배정 탭
// ============================================================================

export interface DeviceAssignment {
  id: string;
  deviceId: string; // DeviceInventory.id 참조
  organizationId: string; // 배정된 기업
  organizationName?: string; // 빠른 조회용 기업명
  assignmentType: 'RENTAL' | 'PURCHASE'; // 렌탈 or 구매
  rentalPeriod?: 1 | 3 | 6 | 12; // 렌탈 기간 (개월)
  startDate: Date; // 시작일 (기본값: 오늘)
  endDate?: Date; // 종료일 (렌탈의 경우 자동 계산)
  monthlyFee?: number; // 월 렌탈비
  purchasePrice?: number; // 구매 가격
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';
  assignedBy: string; // 배정한 관리자
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 배정 요청 데이터
export interface CreateDeviceAssignmentRequest {
  deviceId: string;
  organizationId: string;
  assignmentType: 'RENTAL' | 'PURCHASE';
  rentalPeriod?: 1 | 3 | 6 | 12;
  startDate?: Date; // 기본값: 오늘
  monthlyFee?: number;
  purchasePrice?: number;
  notes?: string;
}

// ============================================================================
// 3. 디바이스 사용 추적 (DeviceUsageTracking) - 사용 현황 탭
// ============================================================================

export interface DeviceUsageTracking {
  id: string;
  deviceId: string;
  assignmentId: string;
  organizationId: string;
  usageDate: Date;
  sessionCount: number; // 일일 세션 수
  totalUsageMinutes: number; // 총 사용 시간 (분)
  uniqueUsers: number; // 고유 사용자 수
  dataQuality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'; // 데이터 품질
  lastSyncTime: Date; // 마지막 동기화 시간
  batteryLevel?: number; // 배터리 잔량 (0-100)
  firmwareVersion?: string; // 펌웨어 버전
  isOnline: boolean; // 현재 온라인 상태
  createdAt: Date;
}

// 사용량 분석 결과
export interface UsageAnalytics {
  totalSessions: number;
  totalMinutes: number;
  uniqueUsers: number;
  averageQuality: string;
  onlineDevices: number;
  activeToday: number;
}

// ============================================================================
// 4. 렌탈 관리 (RentalManagement) - 렌탈관리 탭
// ============================================================================

export interface RentalManagement {
  id: string;
  assignmentId: string;
  deviceId: string;
  organizationId: string;
  organizationName?: string; // 빠른 조회용
  rentalStartDate: Date;
  rentalEndDate: Date;
  returnScheduledDate: Date;
  actualReturnDate?: Date;
  returnStatus: 'SCHEDULED' | 'OVERDUE' | 'RETURNED' | 'EXTENDED';
  extensionRequests?: Array<{
    requestDate: Date;
    newEndDate: Date;
    reason: string;
    approved: boolean;
    approvedBy?: string;
    approvedAt?: Date;
  }>;
  returnCondition?: 'EXCELLENT' | 'GOOD' | 'DAMAGED' | 'LOST';
  returnNotes?: string;
  totalRentalFee: number;
  paidAmount: number;
  outstandingAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

// 회수 처리 요청
export interface ProcessReturnRequest {
  rentalId: string;
  actualReturnDate: Date;
  returnCondition: 'EXCELLENT' | 'GOOD' | 'DAMAGED' | 'LOST';
  returnNotes?: string;
}

// 연장 요청
export interface ExtensionRequest {
  rentalId: string;
  newEndDate: Date;
  reason: string;
}

// 렌탈 현황 통계
export interface RentalStats {
  activeRentals: number;
  upcomingReturns: number; // 이번주 회수 예정
  overdueRentals: number; // 연체 디바이스
  extensionRequests: number; // 연장 요청 대기
  totalOutstanding: number; // 총 미수금
}

// ============================================================================
// 5. A/S 관리 (ServiceManagement) - A/S 탭
// ============================================================================

export interface ServiceManagement {
  id: string;
  deviceId: string;
  organizationId: string;
  organizationName?: string; // 빠른 조회용
  assignmentId: string;
  serviceType: 'WARRANTY' | 'REPAIR' | 'REPLACEMENT' | 'MAINTENANCE' | 'UPGRADE';
  issueDescription: string;
  reportedDate: Date;
  reportedBy: string; // 신고자
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'REPORTED' | 'DIAGNOSED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assignedTechnician?: string;
  estimatedCost?: number;
  actualCost?: number;
  serviceStartDate?: Date;
  serviceCompletionDate?: Date;
  replacementDeviceId?: string; // 교체 디바이스
  serviceNotes?: string;
  customerSatisfaction?: 1 | 2 | 3 | 4 | 5; // 고객 만족도
  createdAt: Date;
  updatedAt: Date;
}

// A/S 접수 요청
export interface CreateServiceRequest {
  deviceId: string;
  organizationId: string;
  assignmentId: string;
  serviceType: 'WARRANTY' | 'REPAIR' | 'REPLACEMENT' | 'MAINTENANCE' | 'UPGRADE';
  issueDescription: string;
  reportedBy: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimatedCost?: number;
}

// A/S 완료 처리
export interface CompleteServiceRequest {
  serviceId: string;
  actualCost?: number;
  customerSatisfaction?: 1 | 2 | 3 | 4 | 5;
  serviceNotes?: string;
  replacementDeviceId?: string;
}

// A/S 통계
export interface ServiceStats {
  totalRequests: number;
  newToday: number; // 금일 신규 접수
  inProgress: number; // 현재 처리 중
  completedThisWeek: number; // 금주 완료
  averageSatisfaction: number; // 평균 고객 만족도
}

// ============================================================================
// 6. 전체 현황 (Dashboard) - 전체 현황 탭
// ============================================================================

export interface DeviceManagementDashboard {
  // 핵심 지표
  totalInventory: number;
  assignmentRate: number; // (배정된 디바이스 / 전체 재고) × 100
  usageRate: number; // 실제 사용 중인 디바이스 비율
  monthlyRevenue: number; // 렌탈 + 구매 월간 수익
  
  // 상태별 분포
  deviceStatusDistribution: {
    available: number;
    assigned: number;
    inUse: number;
    maintenance: number;
    returned: number;
  };
  
  // 트렌드 데이터
  monthlyAssignmentTrend: Array<{
    month: string;
    assignments: number;
    revenue: number;
  }>;
  
  // TOP 기업
  topOrganizations: Array<{
    organizationId: string;
    organizationName: string;
    deviceCount: number;
    monthlyUsage: number;
    revenue: number;
  }>;
  
  // 긴급 알림
  urgentAlerts: {
    overdueRentals: number;
    criticalServices: number;
    lowBatteryDevices: number;
    maintenanceRequired: number;
  };
  
  // 오늘의 일정
  todaySchedule: {
    newRegistrations: number;
    scheduledReturns: number;
    serviceAppointments: number;
  };
}

// ============================================================================
// 7. 공통 유틸리티 타입
// ============================================================================

// 디바이스 상태 라벨
export const DeviceStatusLabels = {
  AVAILABLE: '🟢 대기',
  ASSIGNED: '🔵 배정완료',
  IN_USE: '🟡 사용중',
  MAINTENANCE: '🔧 점검중',
  RETURNED: '🔄 반납완료',
  DISPOSED: '❌ 폐기'
} as const;

// 배정 상태 라벨
export const AssignmentStatusLabels = {
  ACTIVE: '🟢 활성',
  COMPLETED: '✅ 완료',
  CANCELLED: '❌ 취소',
  OVERDUE: '🔴 연체'
} as const;

// 데이터 품질 라벨
export const DataQualityLabels = {
  EXCELLENT: '🟢 우수',
  GOOD: '🟡 양호',
  FAIR: '🟠 보통',
  POOR: '🔴 불량'
} as const;

// 우선순위 라벨
export const PriorityLabels = {
  LOW: '🟢 낮음',
  MEDIUM: '🟡 보통',
  HIGH: '🟠 높음',
  CRITICAL: '🔴 긴급'
} as const;

// 검색 및 필터 옵션
export interface DeviceSearchFilters {
  deviceType?: string;
  status?: DeviceInventory['status'];
  assignmentType?: DeviceAssignment['assignmentType'];
  organizationId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// 페이지네이션
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// API 응답 래퍼
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// 벌크 작업 결과
export interface BulkOperationResult<T> {
  successful: T[];
  failed: Array<{
    data: Partial<T>;
    error: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

// ============================================================================
// 8. 에러 타입
// ============================================================================

export class DeviceManagementError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'DeviceManagementError';
  }
}

export const ErrorCodes = {
  DEVICE_NOT_FOUND: 'DEVICE_NOT_FOUND',
  DEVICE_ALREADY_ASSIGNED: 'DEVICE_ALREADY_ASSIGNED',
  ASSIGNMENT_NOT_FOUND: 'ASSIGNMENT_NOT_FOUND',
  INVALID_RENTAL_PERIOD: 'INVALID_RENTAL_PERIOD',
  ORGANIZATION_NOT_FOUND: 'ORGANIZATION_NOT_FOUND',
  INVALID_RETURN_CONDITION: 'INVALID_RETURN_CONDITION',
  SERVICE_REQUEST_FAILED: 'SERVICE_REQUEST_FAILED',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS'
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes]; 

// ============================================================================
// 7. A/S 관리 (ServiceManagement) - A/S 탭 
// ============================================================================

export type ServiceRequestStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ServiceRequest {
  id: string;
  requestDate: Date;
  status: ServiceRequestStatus;
  
  // 요청자 정보 (기업 관리자)
  organizationId: string;
  organizationName: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string;
  
  // 디바이스 정보
  deviceId: string;
  deviceModel: string;
  deviceSerialNumber: string;
  
  // 요청 내용
  issueDescription: string;
  urgencyLevel: UrgencyLevel;
  
  // 대응 정보 (시스템 관리자)
  responseDate?: Date;
  responseMessage?: string;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  
  // 완료 정보
  completionDate?: Date;
  defectDescription?: string;  // 결함 내용
  resolutionMethod?: string;   // 대응 방법 (기본: "리퍼제품 교환")
  resolutionNotes?: string;    // 메모
  replacementDeviceId?: string; // 교체된 리퍼 제품 ID
  
  // 시스템 정보
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceRequestData {
  organizationId: string;
  organizationName: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string;
  deviceId: string;
  deviceModel: string;
  deviceSerialNumber: string;
  issueDescription: string;
  urgencyLevel: UrgencyLevel;
}

export interface ServiceResponseData {
  responseMessage: string;
  assignedTechnicianId: string;
  assignedTechnicianName: string;
}

export interface ServiceCompletionData {
  defectDescription: string;
  resolutionMethod: string;
  resolutionNotes?: string;
  replacementDeviceId?: string;
}

export interface ServiceStatistics {
  totalRequests: number;
  pendingRequests: number;
  inProgressRequests: number;
  completedRequests: number;
  averageResolutionTime: number; // 평균 처리 시간 (일)
  urgentRequests: number;
  monthlyRequestTrend: Array<{
    month: string;
    requests: number;
    completed: number;
  }>;
  topIssueTypes: Array<{
    issueType: string;
    count: number;
    percentage: number;
  }>;
}

export interface ServiceRequestFilters {
  status?: ServiceRequestStatus;
  urgencyLevel?: UrgencyLevel;
  organizationId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
}

export interface PaginatedServiceRequests {
  requests: ServiceRequest[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// 8. 사용현황 데이터 (UsageData) - 사용 현황 탭
// ============================================================================

export interface DeviceUsageData {
  deviceId: string;
  organizationId: string;
  organizationName: string;
  totalSessions: number;
  totalUsageHours: number;
  averageSessionDuration: number; // 분
  lastUsedAt: Date;
  utilizationRate: number; // 가동률 %
}

export interface UsageStatistics {
  totalUsageHours: number;
  averageUtilizationRate: number;
  averageSessionDuration: number;
  activeDevicesCount: number;
  topOrganizations: Array<{
    organizationId: string;
    organizationName: string;
    usageHours: number;
    utilizationRate: number;
  }>;
  hourlyUsagePattern: Array<{
    hour: number;
    sessionCount: number;
    avgDuration: number;
  }>;
  weeklyTrend: Array<{
    week: string;
    totalHours: number;
    sessionCount: number;
  }>;
}

// ============================================================================
// 9. 렌탈 관리 (RentalManagement) - 렌탈관리 탭
// ============================================================================

export type RentalStatus = 'ACTIVE' | 'RETURNED' | 'OVERDUE' | 'SCHEDULED_RETURN';

export interface RentalContract {
  id: string;
  deviceId: string;
  deviceSerialNumber: string;
  organizationId: string;
  organizationName: string;
  
  // 렌탈 정보
  startDate: Date;
  plannedEndDate: Date;
  actualEndDate?: Date;
  status: RentalStatus;
  
  // 계약 정보
  monthlyRate: number;
  totalAmount: number;
  deposit: number;
  
  // 담당자 정보
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  
  // 회수 정보
  returnScheduledDate?: Date;
  returnActualDate?: Date;
  returnCondition?: string;
  returnNotes?: string;
  
  // 연체 정보
  overdueDays?: number;
  overdueAmount?: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface RentalStatistics {
  totalContracts: number;
  activeRentals: number;
  scheduledReturns: number;
  overdueRentals: number;
  monthlyRevenue: number;
  averageRentalPeriod: number; // 일
  returnedThisWeek: number;
  monthlyTrend: Array<{
    month: string;
    newContracts: number;
    returns: number;
    revenue: number;
  }>;
}

export interface ScheduledReturn {
  contractId: string;
  deviceId: string;
  organizationName: string;
  contactName: string;
  scheduledDate: Date;
  daysUntilReturn: number;
  isOverdue: boolean;
} 