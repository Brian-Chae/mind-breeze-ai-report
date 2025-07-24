/**
 * 통합 디바이스 관리 시스템 타입 정의
 * 
 * 시스템 관리자 디바이스 배정과 기업 디바이스 관리 간의 완전 통합을 위한 타입 시스템
 * 설계 문서: DEVICE_MANAGEMENT_INTEGRATION_DESIGN.md 참조
 */

// ============================================================================
// 1. Core Device Master (중앙 디바이스 마스터) - 단일 진실의 원천
// ============================================================================

/**
 * 디바이스 생애주기 상태
 * 모든 디바이스는 이 상태들을 순차적으로 거쳐감
 */
export type DeviceLifecycleStatus = 
  | 'INVENTORY'      // 재고 (배정 가능)
  | 'ALLOCATED'      // 기업 할당됨
  | 'IN_USE'         // 실제 사용 중
  | 'MAINTENANCE'    // 점검/수리 중
  | 'RECALLED'       // 회수됨
  | 'RETIRED'        // 폐기됨
  | 'LOST'          // 분실됨

/**
 * 중앙 디바이스 마스터
 * 시스템 전체에서 디바이스의 단일 진실의 원천
 */
export interface DeviceMaster {
  // 기본 정보
  id: string                        // LXB-YYYYMMDD-XXX
  serialNumber: string
  deviceType: 'LINK_BAND_2.0' | 'LINK_BAND_3.0'
  model: string
  firmwareVersion: string
  
  // 제조/구매 정보
  manufacturingDate: Date
  purchaseCost: number
  supplier: string
  warrantyPeriodMonths: number
  registrationDate: Date
  
  // 현재 상태
  currentStatus: DeviceLifecycleStatus
  currentLocation: string
  lastStatusUpdate: Date
  
  // 할당 정보
  currentAllocation?: DeviceAllocation
  allocationHistory: DeviceAllocation[]
  
  // 기술적 상태
  batteryHealth: number             // 0-100
  lastCalibration: Date
  nextMaintenanceDate: Date
  
  // 메타데이터
  tags: string[]
  notes: string
  createdAt: Date
  updatedAt: Date
}

/**
 * 디바이스 마스터 생성 요청
 */
export interface CreateDeviceMasterRequest {
  deviceType?: 'LINK_BAND_2.0' | 'LINK_BAND_3.0'
  model: string
  firmwareVersion?: string
  manufacturingDate?: Date
  purchaseCost: number
  supplier: string
  warrantyPeriodMonths?: number      // 기본값: 12
  notes?: string
  tags?: string[]
}

// ============================================================================
// 2. Device Allocation (디바이스 할당 정보) - 할당 관계 관리
// ============================================================================

/**
 * 할당 상태
 */
export type AllocationStatus = 
  | 'ACTIVE'         // 활성 할당
  | 'PENDING_SETUP'  // 설정 대기
  | 'SUSPENDED'      // 일시 중단
  | 'EXPIRED'        // 기간 만료
  | 'TERMINATED'     // 조기 종료

/**
 * 할당 타입
 */
export type AllocationType = 'RENTAL' | 'SALE'

/**
 * 디바이스 할당 정보
 * 시스템 관리자가 기업에 할당한 디바이스의 모든 정보
 */
export interface DeviceAllocation {
  id: string
  deviceId: string
  organizationId: string
  organizationName: string
  
  // 할당 타입 및 조건
  allocationType: AllocationType
  
  // 렌탈 정보 (allocationType === 'RENTAL')
  rentalPeriodMonths?: number
  monthlyFee?: number
  rentalStartDate?: Date
  rentalEndDate?: Date
  
  // 판매 정보 (allocationType === 'SALE')
  salePrice?: number
  saleDate?: Date
  warrantyEndDate?: Date
  
  // 계약 정보
  contractId: string
  contactPerson: {
    name: string
    email: string
    phone: string
    role: string
  }
  
  // 상태 및 추적
  status: AllocationStatus
  assignedUserId?: string      // 기업 내 사용자 할당
  assignedUserName?: string
  location?: string            // 기업 내 위치
  lastAssignmentUpdate?: Date  // 마지막 사용자 할당 변경 시간
  
  // 메타데이터
  createdAt: Date
  updatedAt: Date
  createdBy: string           // 시스템 관리자 ID
}

/**
 * 디바이스 할당 요청 (시스템 관리자용)
 */
export interface DeviceAllocationRequest {
  deviceId: string
  organizationId: string
  organizationName: string
  allocationType: AllocationType
  
  // 렌탈 정보 (필요시)
  rentalPeriodMonths?: number
  monthlyFee?: number
  rentalStartDate?: Date
  
  // 판매 정보 (필요시)
  salePrice?: number
  warrantyPeriodMonths?: number  // 기본값: 12
  
  // 계약 정보
  contactPerson: {
    name: string
    email: string
    phone: string
    role: string
  }
  
  notes?: string
}

// ============================================================================
// 3. Service Request (A/S 요청 통합) - 통합 A/S 관리
// ============================================================================

/**
 * 서비스 요청 타입
 */
export type ServiceRequestType = 
  | 'REPAIR'           // 수리
  | 'REPLACEMENT'      // 교체
  | 'CALIBRATION'      // 캘리브레이션
  | 'FIRMWARE_UPDATE'  // 펌웨어 업데이트
  | 'PREVENTIVE'       // 예방 점검
  | 'RETURN'           // 반납
  | 'REFUND'           // 환불

/**
 * 이슈 카테고리
 */
export type IssueCategory = 
  | 'HARDWARE'         // 하드웨어 문제
  | 'SOFTWARE'         // 소프트웨어 문제
  | 'CONNECTIVITY'     // 연결 문제
  | 'BATTERY'          // 배터리 문제
  | 'SENSOR'           // 센서 문제
  | 'USER_ERROR'       // 사용자 오류

/**
 * 서비스 상태
 */
export type ServiceStatus = 
  | 'PENDING'          // 대기 중
  | 'ACKNOWLEDGED'     // 접수 확인
  | 'DIAGNOSED'        // 진단 완료
  | 'IN_PROGRESS'      // 처리 중
  | 'WAITING_PARTS'    // 부품 대기
  | 'TESTING'          // 테스트 중
  | 'COMPLETED'        // 완료
  | 'CANCELLED'        // 취소
  | 'ESCALATED'        // 에스컬레이션

/**
 * 서비스 우선순위
 */
export type ServicePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

/**
 * 비용 승인 상태
 */
export type CostApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

/**
 * 서비스 상태 히스토리
 */
export interface ServiceStatusHistory {
  id: string
  status: ServiceStatus
  changedAt: Date
  changedBy: string
  notes?: string
}

/**
 * 서비스 첨부파일
 */
export interface ServiceAttachment {
  id: string
  fileName: string
  fileUrl: string
  fileType: string
  uploadedAt: Date
  uploadedBy: string
}

/**
 * 통합 서비스 요청
 * 기업에서 시스템 관리자로의 A/S 요청 통합 관리
 */
export interface ServiceRequest {
  id: string
  deviceId: string
  organizationId: string
  allocationId: string        // 할당 정보 참조
  
  // 요청 정보
  requestType: ServiceRequestType
  priority: ServicePriority
  description: string
  issueCategory: IssueCategory[]
  
  // 요청자 정보 (기업 사용자)
  requestedBy: {
    userId: string
    name: string
    email: string
    phone: string
    role: string
  }
  
  // 처리 정보
  status: ServiceStatus
  assignedTechnician?: string
  estimatedResolutionDate?: Date
  actualResolutionDate?: Date
  
  // 비용 및 워런티
  isWarrantyEligible: boolean
  estimatedCost?: number
  actualCost?: number
  costApprovalStatus?: CostApprovalStatus
  costApprovedBy?: string
  costApprovedAt?: Date
  
  // 추적 정보
  statusHistory: ServiceStatusHistory[]
  attachments: ServiceAttachment[]
  internalNotes: string[]      // 시스템 관리자 전용
  customerNotes: string[]      // 고객 관련 메모
  
  // 해결 정보
  resolutionSummary?: string
  replacementDeviceId?: string
  customerSatisfactionRating?: number  // 1-5점
  customerFeedback?: string
  
  createdAt: Date
  updatedAt: Date
}

/**
 * 서비스 요청 생성 (기업용)
 */
export interface CreateServiceRequestRequest {
  deviceId: string
  requestType: ServiceRequestType
  priority: ServicePriority
  description: string
  issueCategory: IssueCategory[]
  attachments?: File[]
}

/**
 * 서비스 요청 업데이트 (시스템 관리자용)
 */
export interface UpdateServiceRequestRequest {
  status?: ServiceStatus
  assignedTechnician?: string
  estimatedResolutionDate?: Date
  estimatedCost?: number
  internalNotes?: string
  resolutionSummary?: string
  replacementDeviceId?: string
}

// ============================================================================
// 4. Organization Device View (기업 디바이스 뷰) - 읽기 전용 뷰
// ============================================================================

/**
 * 기업 디바이스 뷰
 * 기업에서 보는 디바이스 정보 (읽기 전용, 자동 동기화)
 */
export interface OrganizationDeviceView {
  // 디바이스 기본 정보 (DeviceMaster에서 동기화)
  deviceId: string
  serialNumber: string
  deviceType: string
  model: string
  firmwareVersion: string
  
  // 할당 정보 (DeviceAllocation에서 동기화)
  allocationId: string
  allocationType: AllocationType
  allocationStatus: AllocationStatus
  
  // 렌탈/판매 정보
  rentalEndDate?: Date
  monthlyFee?: number
  salePrice?: number
  warrantyEndDate?: Date
  isWarrantyActive: boolean
  
  // 현재 상태
  currentStatus: DeviceLifecycleStatus
  batteryLevel?: number
  lastConnected?: Date
  isOnline: boolean
  
  // 기업 내 할당 정보
  assignedUserId?: string
  assignedUserName?: string
  assignedUserEmail?: string
  location?: string
  assignedAt?: Date
  
  // 사용 통계 (실시간 업데이트)
  totalUsageHours: number
  lastUsedAt?: Date
  utilizationRate: number      // 가동률 %
  
  // A/S 관련 정보
  activeServiceRequests: number
  lastServiceDate?: Date
  nextMaintenanceDate?: Date
  
  // 메타데이터 (동기화됨)
  createdAt: Date
  updatedAt: Date
  lastSyncAt: Date            // 마지막 동기화 시간
}

// ============================================================================
// 5. Usage Analytics (사용 분석) - 사용 현황 추적
// ============================================================================

/**
 * 사용 이벤트
 */
export interface UsageEvent {
  id: string
  deviceId: string
  organizationId: string
  userId?: string
  eventType: 'USER_ASSIGNMENT' | 'SESSION_START' | 'SESSION_END' | 'LOCATION_UPDATE' | 'STATUS_CHANGE'
  eventData: Record<string, any>
  timestamp: Date
  createdAt: Date
}

/**
 * 디바이스 사용 통계
 */
export interface DeviceUsageStatistics {
  deviceId: string
  organizationId: string
  
  // 기본 통계
  totalSessions: number
  totalUsageHours: number
  averageSessionDuration: number  // 분
  
  // 시간별 분석
  dailyAverageHours: number
  weeklyAverageHours: number
  utilizationRate: number         // 가동률 %
  
  // 사용자 분석
  uniqueUsers: number
  primaryUserId?: string          // 주 사용자
  primaryUserUsageHours: number
  
  // 최근 사용
  lastUsedAt?: Date
  daysSinceLastUse: number
  
  // 품질 지표
  averageDataQuality: number      // 0-100
  connectivityIssues: number
  
  calculatedAt: Date
}

// ============================================================================
// 6. Notification & Alert System (알림 시스템)
// ============================================================================

/**
 * 알림 타입
 */
export type NotificationType = 
  | 'DEVICE_ALLOCATED'         // 디바이스 할당됨
  | 'DEVICE_STATUS_CHANGED'    // 디바이스 상태 변경
  | 'SERVICE_REQUEST_CREATED'  // A/S 요청 생성
  | 'SERVICE_REQUEST_UPDATE'   // A/S 요청 업데이트
  | 'SERVICE_REQUEST_COMPLETED'// A/S 요청 완료
  | 'MAINTENANCE_DUE'          // 점검 필요
  | 'WARRANTY_EXPIRING'        // 워런티 만료 임박
  | 'RENTAL_EXPIRING'          // 렌탈 만료 임박
  | 'BATTERY_LOW'              // 배터리 부족
  | 'DEVICE_OFFLINE'           // 디바이스 오프라인

/**
 * 알림 우선순위
 */
export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

/**
 * 디바이스 알림
 */
export interface DeviceNotification {
  id: string
  type: NotificationType
  priority: NotificationPriority
  
  // 대상 정보
  organizationId: string
  deviceId: string
  userId?: string              // 특정 사용자에게만 (선택사항)
  
  // 알림 내용
  title: string
  message: string
  actionRequired: boolean
  actionUrl?: string
  
  // 메타데이터
  data: Record<string, any>
  
  // 상태
  isRead: boolean
  readAt?: Date
  isArchived: boolean
  
  createdAt: Date
  expiresAt?: Date
}

// ============================================================================
// 7. Statistics & Dashboard (통계 및 대시보드)
// ============================================================================

/**
 * 디바이스 마스터 통계
 */
export interface DeviceMasterStatistics {
  // 전체 현황
  totalDevices: number
  availableDevices: number
  allocatedDevices: number
  inUseDevices: number
  maintenanceDevices: number
  retiredDevices: number
  
  // 할당 현황
  totalAllocations: number
  activeRentals: number
  activeSales: number
  pendingSetup: number
  expiredAllocations: number
  
  // 수익 분석 (월간)
  monthlyRentalRevenue: number
  monthlySalesRevenue: number
  totalMonthlyRevenue: number
  
  // A/S 현황
  totalServiceRequests: number
  pendingServiceRequests: number
  inProgressServiceRequests: number
  completedServiceRequests: number
  
  // 트렌드 데이터
  allocationTrend: Array<{
    month: string
    rentals: number
    sales: number
    revenue: number
  }>
  
  // Top 기업
  topOrganizations: Array<{
    organizationId: string
    organizationName: string
    deviceCount: number
    monthlyRevenue: number
    utilizationRate: number
  }>
}

/**
 * 조직 디바이스 대시보드
 */
export interface OrganizationDeviceDashboard {
  organizationId: string
  
  // 디바이스 현황
  totalDevices: number
  activeDevices: number
  onlineDevices: number
  lowBatteryDevices: number
  
  // 사용 통계
  totalUsageHours: number
  averageUtilizationRate: number
  averageSessionDuration: number
  
  // A/S 현황
  activeServiceRequests: number
  completedServiceRequests: number
  averageResolutionTime: number
  
  // 비용 정보
  monthlyRentalCost: number
  totalDeviceValue: number
  
  // 알림
  unreadNotifications: number
  urgentAlerts: number
  
  // 최근 활동
  recentDeviceActivities: Array<{
    deviceId: string
    activityType: string
    description: string
    timestamp: Date
  }>
}

// ============================================================================
// 8. Search & Filter (검색 및 필터)
// ============================================================================

/**
 * 디바이스 마스터 필터
 */
export interface DeviceMasterFilters {
  deviceType?: string
  currentStatus?: DeviceLifecycleStatus[]
  organizationId?: string
  allocationType?: AllocationType
  batteryHealthMin?: number
  batteryHealthMax?: number
  lastMaintenanceBefore?: Date
  lastMaintenanceAfter?: Date
  tags?: string[]
  searchTerm?: string
}

/**
 * 서비스 요청 필터
 */
export interface ServiceRequestFilters {
  status?: ServiceStatus[]
  priority?: ServicePriority[]
  requestType?: ServiceRequestType[]
  organizationId?: string
  deviceId?: string
  assignedTechnician?: string
  isWarrantyEligible?: boolean
  createdAfter?: Date
  createdBefore?: Date
  searchTerm?: string
}

/**
 * 정렬 옵션
 */
export interface SortOptions {
  field: string
  direction: 'asc' | 'desc'
}

/**
 * 페이지네이션 옵션
 */
export interface PaginationOptions {
  page: number
  limit: number
  offset?: number
}

/**
 * 페이지네이션된 결과
 */
export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

// ============================================================================
// 9. Error Handling (에러 처리)
// ============================================================================

/**
 * 통합 디바이스 관리 에러
 */
export class IntegratedDeviceError extends Error {
  constructor(
    message: string,
    public code: string,
    public deviceId?: string,
    public organizationId?: string,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'IntegratedDeviceError'
  }
}

/**
 * 에러 코드
 */
export const IntegratedDeviceErrorCodes = {
  // 디바이스 관련
  DEVICE_NOT_FOUND: 'DEVICE_NOT_FOUND',
  DEVICE_ALREADY_ALLOCATED: 'DEVICE_ALREADY_ALLOCATED',
  DEVICE_NOT_AVAILABLE: 'DEVICE_NOT_AVAILABLE',
  DEVICE_STATUS_INVALID: 'DEVICE_STATUS_INVALID',
  
  // 할당 관련
  ALLOCATION_NOT_FOUND: 'ALLOCATION_NOT_FOUND',
  ALLOCATION_ALREADY_EXISTS: 'ALLOCATION_ALREADY_EXISTS',
  ALLOCATION_TYPE_MISMATCH: 'ALLOCATION_TYPE_MISMATCH',
  
  // 조직 관련
  ORGANIZATION_NOT_FOUND: 'ORGANIZATION_NOT_FOUND',
  ORGANIZATION_ACCESS_DENIED: 'ORGANIZATION_ACCESS_DENIED',
  
  // 서비스 관련
  SERVICE_REQUEST_NOT_FOUND: 'SERVICE_REQUEST_NOT_FOUND',
  SERVICE_REQUEST_INVALID_STATUS: 'SERVICE_REQUEST_INVALID_STATUS',
  WARRANTY_EXPIRED: 'WARRANTY_EXPIRED',
  
  // 동기화 관련
  SYNC_FAILED: 'SYNC_FAILED',
  DATA_INCONSISTENCY: 'DATA_INCONSISTENCY',
  
  // 권한 관련
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS'
} as const

export type IntegratedDeviceErrorCode = typeof IntegratedDeviceErrorCodes[keyof typeof IntegratedDeviceErrorCodes]

// ============================================================================
// 10. Constants & Enums (상수 및 열거형)
// ============================================================================

/**
 * 디바이스 생애주기 상태 라벨
 */
export const DeviceLifecycleStatusLabels: Record<DeviceLifecycleStatus, string> = {
  INVENTORY: '📦 재고',
  ALLOCATED: '🏢 할당됨',
  IN_USE: '🔄 사용중',
  MAINTENANCE: '🔧 점검중',
  RECALLED: '🔙 회수됨',
  RETIRED: '❌ 폐기됨',
  LOST: '❓ 분실됨'
}

/**
 * 할당 상태 라벨
 */
export const AllocationStatusLabels: Record<AllocationStatus, string> = {
  ACTIVE: '🟢 활성',
  PENDING_SETUP: '⏳ 설정대기',
  SUSPENDED: '⏸️ 일시중단',
  EXPIRED: '⚠️ 만료됨',
  TERMINATED: '🔴 종료됨'
}

/**
 * 서비스 상태 라벨
 */
export const ServiceStatusLabels: Record<ServiceStatus, string> = {
  PENDING: '⏳ 대기중',
  ACKNOWLEDGED: '👀 접수됨',
  DIAGNOSED: '🔍 진단완료',
  IN_PROGRESS: '🔄 처리중',
  WAITING_PARTS: '📦 부품대기',
  TESTING: '🧪 테스트중',
  COMPLETED: '✅ 완료',
  CANCELLED: '❌ 취소됨',
  ESCALATED: '⬆️ 에스컬레이션'
}

/**
 * 서비스 우선순위 라벨
 */
export const ServicePriorityLabels: Record<ServicePriority, string> = {
  LOW: '🟢 낮음',
  MEDIUM: '🟡 보통',
  HIGH: '🟠 높음',
  CRITICAL: '🔴 긴급'
}

/**
 * 기본 설정값
 */
export const IntegratedDeviceDefaults = {
  WARRANTY_PERIOD_MONTHS: 12,
  DEFAULT_DEVICE_TYPE: 'LINK_BAND_2.0' as const,
  DEFAULT_RENTAL_PERIOD_MONTHS: 12,
  BATTERY_LOW_THRESHOLD: 20,
  MAINTENANCE_INTERVAL_DAYS: 90,
  SERVICE_REQUEST_AUTO_ESCALATION_DAYS: 3,
  PAGINATION_DEFAULT_LIMIT: 20,
  PAGINATION_MAX_LIMIT: 100
}