/**
 * 조직 디바이스 뷰 서비스
 * 
 * 기업 사용자를 위한 읽기 전용 디바이스 관리 기능 제공
 * 조직 관점에서의 디바이스 현황, 사용자 할당, A/S 요청 등을 관리
 */

import { BaseService } from '../../../core/services/BaseService'
import {
  OrganizationDeviceView,
  DeviceAllocation,
  ServiceRequest,
  CreateServiceRequestRequest,
  DeviceUsageStatistics,
  DeviceNotification,
  NotificationType,
  NotificationPriority,
  ServiceRequestFilters,
  PaginatedResult,
  SortOptions,
  PaginationOptions,
  IntegratedDeviceError,
  IntegratedDeviceErrorCodes
} from '../types/integrated-device'
import { DeviceSynchronizationService } from './DeviceSynchronizationService'
import { DeviceAllocationService } from './DeviceAllocationService'
import { ServiceRequestService } from './ServiceRequestService'

interface OrganizationDeviceFilters {
  currentStatus?: string[]
  allocationType?: 'RENTAL' | 'SALE'
  assignedUserId?: string
  location?: string
  batteryLevelMin?: number
  batteryLevelMax?: number
  hasActiveServiceRequest?: boolean
  isWarrantyActive?: boolean
  deviceType?: string
  utilizationRateMin?: number
  utilizationRateMax?: number
}

interface UserAssignmentRequest {
  deviceId: string
  userId: string
  userName: string
  location?: string
  notes?: string
}

interface BulkUserAssignmentRequest {
  assignments: UserAssignmentRequest[]
  assignedBy: string
}

interface OrganizationDeviceDashboard {
  totalDevices: number
  activeDevices: number
  availableDevices: number
  maintenanceDevices: number
  lowBatteryDevices: number
  
  // 렌탈/판매 현황
  rentalDevices: number
  saleDevices: number
  expiringRentals: OrganizationDeviceView[]
  
  // 사용자 할당 현황
  assignedDevices: number
  unassignedDevices: number
  topUsers: Array<{
    userId: string
    userName: string
    deviceCount: number
    utilizationRate: number
  }>
  
  // 서비스 현황
  activeServiceRequests: number
  pendingApprovals: number
  recentNotifications: DeviceNotification[]
  
  // 사용 통계
  averageUtilizationRate: number
  totalUsageHours: number
  costSummary: {
    monthlyRentalCost: number
    maintenanceCost: number
    pendingApprovals: number
  }
}

export class OrganizationDeviceViewService extends BaseService {
  private deviceSynchronizationService: DeviceSynchronizationService
  private deviceAllocationService: DeviceAllocationService
  private serviceRequestService: ServiceRequestService

  constructor() {
    super()
    this.deviceSynchronizationService = new DeviceSynchronizationService()
    this.deviceAllocationService = new DeviceAllocationService()
    this.serviceRequestService = new ServiceRequestService()
