/**
 * 디바이스 동기화 서비스
 * 
 * 시스템 관리자 액션과 기업 디바이스 뷰 간의 실시간 동기화 담당
 * 디바이스 마스터 변경사항을 조직별 뷰에 자동 반영
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  writeBatch,
  runTransaction,
  Timestamp
} from 'firebase/firestore'
import { BaseService } from '../../../core/services/BaseService'
import {
  DeviceMaster,
  DeviceAllocation,
  OrganizationDeviceView,
  DeviceLifecycleStatus,
  UsageEvent,
  DeviceUsageStatistics,
  DeviceNotification,
  NotificationType,
  NotificationPriority,
  IntegratedDeviceError,
  IntegratedDeviceErrorCodes
} from '../types/integrated-device'
import { DeviceMasterService } from './DeviceMasterService'
import { DeviceAllocationService } from './DeviceAllocationService'

interface SyncEvent {
  id: string
  type: 'DEVICE_STATUS_CHANGED' | 'ALLOCATION_UPDATED' | 'USER_ASSIGNED' | 'LOCATION_UPDATED'
  deviceId: string
  organizationId?: string
  data: Record<string, any>
  timestamp: Date
  processed: boolean
}

interface SyncResult {
  success: boolean
  syncedViews: number
  errors: Array<{
    organizationId: string
    error: string
  }>
  duration: number
}

export class DeviceSynchronizationService extends BaseService {
  private static readonly SYNC_EVENTS_COLLECTION = 'deviceSyncEvents'
  private static readonly ORGANIZATION_DEVICE_VIEWS_COLLECTION = 'organizationDeviceViews'
  private static readonly DEVICE_NOTIFICATIONS_COLLECTION = 'deviceNotifications'
  private static readonly USAGE_EVENTS_COLLECTION = 'deviceUsageEvents'
  
  private deviceMasterService: DeviceMasterService
  private deviceAllocationService: DeviceAllocationService
  private syncListeners: Map<string, () => void> = new Map()

  constructor() {
    super()
    this.deviceMasterService = new DeviceMasterService()
    this.deviceAllocationService = new DeviceAllocationService()
