/**
 * 통합 디바이스 관리 서비스
 * 
 * 모든 디바이스 관련 서비스들을 통합하는 Facade 패턴 구현
 * 시스템 관리자와 기업 사용자 모두에게 일관된 API 제공
 */

import { BaseService } from '../../../core/services/BaseService'
import { SystemHealthIssue } from '../types/system-health'
import {
  DeviceMaster,
  CreateDeviceMasterRequest,
  DeviceAllocation,
  DeviceAllocationRequest,
  OrganizationDeviceView,
  ServiceRequest,
  CreateServiceRequestRequest,
  DeviceLifecycleStatus,
  AllocationStatus,
  ServiceStatus,
  DeviceMasterFilters,
  ServiceRequestFilters,
  PaginatedResult,
  SortOptions,
  PaginationOptions,
  IntegratedDeviceError,
  IntegratedDeviceErrorCodes
} from '../types/integrated-device'
import { DeviceMasterService } from './DeviceMasterService'
import { DeviceAllocationService } from './DeviceAllocationService'
import { ServiceRequestService } from './ServiceRequestService'
import { DeviceSynchronizationService } from './DeviceSynchronizationService'

interface UnifiedDeviceStatistics {
  // 디바이스 마스터 통계
  totalDevices: number
  availableDevices: number
  allocatedDevices: number
  inUseDevices: number
  maintenanceDevices: number
  retiredDevices: number
  
  // 할당 통계
  totalAllocations: number
  activeAllocations: number
  activeRentals: number
  activeSales: number
  
  // 서비스 요청 통계
  totalServiceRequests: number
  pendingServiceRequests: number
  inProgressServiceRequests: number
  completedServiceRequests: number
  warrantyServiceRequests: number
  paidServiceRequests: number
  
  // 조직별 통계
  organizationsWithDevices: number
  averageDevicesPerOrganization: number
  
  // 성능 지표
  averageServiceResolutionTime: number
  deviceUtilizationRate: number
  customerSatisfactionAverage: number
}

interface DeviceHealthCheck {
  deviceId: string
  serialNumber: string
  currentStatus: DeviceLifecycleStatus
  batteryHealth: number
  maintenanceStatus: 'OVERDUE' | 'DUE_SOON' | 'CURRENT'
  organizationId?: string
  organizationName?: string
  lastConnected?: Date
  issues: string[]
  recommendedActions: string[]
}

export class UnifiedDeviceManagementService extends BaseService {
  private deviceMasterService: DeviceMasterService
  private deviceAllocationService: DeviceAllocationService
  private serviceRequestService: ServiceRequestService
  private deviceSynchronizationService: DeviceSynchronizationService

  constructor() {
    super()
    this.deviceMasterService = new DeviceMasterService()
    this.deviceAllocationService = new DeviceAllocationService()
    this.serviceRequestService = new ServiceRequestService()
    this.deviceSynchronizationService = new DeviceSynchronizationService()
  }
}
