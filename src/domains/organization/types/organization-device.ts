// 조직 관리자용 디바이스 관리 타입 정의

export interface OrganizationDevice {
  id: string
  deviceId: string // LXB-024821
  deviceName: string
  deviceModel: string // 'LINK BAND 2.0'
  registrationDate: Date
  acquisitionType: 'RENTAL' | 'PURCHASE'
  totalMeasurements: number
  lastUsedDate: Date | null
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'SERVICE'
  batteryLevel?: number
  firmwareVersion?: string
  organizationId: string
  assignedUserId?: string
  assignedUserName?: string
}

export interface RentalDevice extends OrganizationDevice {
  acquisitionType: 'RENTAL'
  rentalStartDate: Date
  rentalEndDate: Date
  monthlyFee: number
  isExtensionRequested: boolean
  isPurchaseConversionRequested: boolean
  isReturnRequested: boolean
}

export interface PurchaseDevice extends OrganizationDevice {
  acquisitionType: 'PURCHASE'
  purchaseDate: Date
  purchasePrice: number
  warrantyStartDate: Date
  warrantyEndDate: Date
  isRefundRequested: boolean
}

// 렌탈 관리 액션
export interface RentalAction {
  type: 'EXTEND_RENTAL' | 'CONVERT_TO_PURCHASE' | 'REQUEST_RETURN' | 'REQUEST_SERVICE'
  deviceId: string
  requestDate: Date
  requestedBy: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
  notes?: string
  // 렌탈 연장 전용
  extensionPeriod?: number // 개월
  newEndDate?: Date
  // 구매 전환 전용
  conversionPrice?: number
  // 반납 신청 전용
  returnReason?: string
  requestedReturnDate?: Date
}

// 구매 관리 액션
export interface PurchaseAction {
  type: 'REQUEST_REFUND' | 'REQUEST_SERVICE'
  deviceId: string
  requestDate: Date
  requestedBy: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
  notes?: string
  // 환불 신청 전용
  refundReason?: string
  refundAmount?: number
}

// A/S 및 환불 현황
export interface OrganizationServiceRequest {
  id: string
  type: 'SERVICE' | 'REFUND'
  deviceId: string
  deviceName: string
  requestDate: Date
  requestedBy: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  issue?: string
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  // A/S 전용
  serviceType?: 'REPAIR' | 'REPLACEMENT' | 'MAINTENANCE'
  estimatedCompletionDate?: Date
  actualCompletionDate?: Date
  // 환불 전용  
  refundReason?: string
  refundAmount?: number
  refundStatus?: 'REQUESTED' | 'PROCESSING' | 'APPROVED' | 'COMPLETED' | 'REJECTED'
}

// 디바이스 통계
export interface OrganizationDeviceStats {
  totalDevices: number
  rentalDevices: number
  purchaseDevices: number
  activeDevices: number
  inactiveDevices: number
  maintenanceDevices: number
  serviceDevices: number
  totalMeasurements: number
  monthlyUsage: number
  // 렌탈 관련
  expiringSoonRentals: number // 30일 이내 만료
  pendingRentalActions: number
  // 구매 관련
  warrantyExpiringSoon: number
  pendingPurchaseActions: number
  // A/S 관련
  pendingServiceRequests: number
  inProgressServiceRequests: number
  pendingRefundRequests: number
}

// 사용량 분석
export interface DeviceUsageAnalytics {
  deviceId: string
  deviceName: string
  dailyUsage: Array<{
    date: Date
    measurements: number
    duration: number // 분
  }>
  weeklyTrend: Array<{
    week: string
    measurements: number
    averageDaily: number
  }>
  monthlyTrend: Array<{
    month: string
    measurements: number
    averageDaily: number
  }>
  peakUsageHours: Array<{
    hour: number
    usage: number
  }>
  userEngagement: {
    activeUsers: number
    totalSessions: number
    averageSessionDuration: number
  }
}

// 필터 및 검색 옵션
export interface DeviceFilterOptions {
  status?: string[]
  acquisitionType?: ('RENTAL' | 'PURCHASE')[]
  deviceModel?: string[]
  assignedUser?: string[]
  registrationDateRange?: {
    start: Date
    end: Date
  }
  lastUsedDateRange?: {
    start: Date
    end: Date
  }
}

export interface DeviceSearchOptions {
  query: string
  fields: ('deviceId' | 'deviceName' | 'deviceModel' | 'assignedUserName')[]
} 