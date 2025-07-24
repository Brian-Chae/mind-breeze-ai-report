/**
 * 디바이스 관리 서비스
 * 
 * 블루투스 디바이스 관리, 할당, 인벤토리 관리 등을 담당합니다.
 */

import { BaseAdminService } from '../core/BaseAdminService'
import { Permission } from '../../core/types/AdminTypes'
import { 
  collection, 
  doc as firestoreDoc, 
  getDocs, 
  getDoc, 
  updateDoc,
  deleteDoc,
  addDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp,
  writeBatch,
  runTransaction
} from 'firebase/firestore'
import { db } from '@core/services/firebase'

export interface DeviceSummary {
  id: string
  serialNumber: string
  macAddress: string
  modelName: string
  firmwareVersion: string
  organizationId?: string
  organizationName?: string
  assignedTo?: string
  assignedUserName?: string
  status: 'active' | 'inactive' | 'maintenance' | 'retired'
  connectionStatus: 'connected' | 'disconnected' | 'unknown'
  lastConnected?: Date
  batteryLevel?: number
  signalStrength?: number
  totalMeasurements: number
  createdAt: Date
  updatedAt?: Date
}

export interface DeviceAllocation {
  deviceId: string
  organizationId: string
  assignedTo?: string
  assignedAt?: Date
  assignedBy?: string
}

export interface DeviceStatistics {
  totalDevices: number
  activeDevices: number
  assignedDevices: number
  unassignedDevices: number
  devicesByStatus: Record<string, number>
  devicesByModel: Record<string, number>
  averageBatteryLevel: number
  lowBatteryDevices: number
  recentActivity: Array<{
    deviceId: string
    serialNumber: string
    activity: string
    timestamp: Date
  }>
}

export interface BulkDeviceAction {
  deviceIds: string[]
  action: 'assign' | 'unassign' | 'activate' | 'deactivate' | 'retire'
  parameters?: {
    organizationId?: string
    userId?: string
    reason?: string
  }
}

export class DeviceAdminService extends BaseAdminService {
  protected getServiceName(): string {
    return 'DeviceAdminService'
  }
  
  /**
   * 모든 디바이스 조회
   */
  async getAllDevices(
    filters?: {
      organizationId?: string
      status?: string
      assigned?: boolean
    },
    pagination?: {
      page: number
      pageSize: number
    }
  ): Promise<{
    devices: DeviceSummary[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }> {
    await this.requirePermission(Permission.READ_DEVICES)
    
    try {
        metadata: { filters }
      
      let deviceQuery = query(collection(db, 'devices'))
      
      // 필터 적용
      if (filters?.organizationId) {
        deviceQuery = query(deviceQuery, 
          where('organizationId', '==', filters.organizationId)
        )
      }
      
      if (filters?.status) {
        deviceQuery = query(deviceQuery, 
          where('status', '==', filters.status)
        )
      }
      
      if (filters?.assigned !== undefined) {
        if (filters.assigned) {
          deviceQuery = query(deviceQuery, 
            where('assignedTo', '!=', null)
          )
        }
      }
      
      deviceQuery = query(deviceQuery, orderBy('createdAt', 'desc'))
      
      const page = pagination?.page || 1
      const pageSize = pagination?.pageSize || 50
      
      // 먼저 전체 데이터를 가져옵니다
      const allDocsSnapshot = await getDocs(deviceQuery)
      const allDocs = allDocsSnapshot.docs
      
      // 페이지네이션 계산
      const start = (page - 1) * pageSize
      const end = start + pageSize
      const paginatedDocs = allDocs.slice(start, end)
      
      // 각 문서를 비동기적으로 변환
      const transformedData = await Promise.all(
        paginatedDocs.map(async (doc) => {
          const data = doc.data() as any
          
          // 조직 정보 조회
          let organizationName = ''
          if (data.organizationId) {
            const orgRef = firestoreDoc(db, 'organizations', data.organizationId)
            const orgDoc = await getDoc(orgRef)
            organizationName = orgDoc.exists() ? (orgDoc.data() as any)?.name || '' : ''
          }
          
          // 사용자 정보 조회
          let assignedUserName = ''
          if (data.assignedTo) {
            const userRef = firestoreDoc(db, 'measurement_users', data.assignedTo)
            const userDoc = await getDoc(userRef)
            assignedUserName = userDoc.exists() ? (userDoc.data() as any)?.name || '' : ''
          }
          
          // 측정 횟수 조회
          const measurementsQuery = query(
            collection(db, 'measurement_sessions'),
            where('deviceId', '==', doc.id)
          )
          const measurementsSnapshot = await getDocs(measurementsQuery)
          
          // null을 undefined로 변환
          const lastConnected = this.convertTimestamp(data.lastConnected)
          const createdAt = this.convertTimestamp(data.createdAt)
          const updatedAt = this.convertTimestamp(data.updatedAt)
          
          return {
            id: doc.id,
            serialNumber: data.serialNumber || '',
            macAddress: data.macAddress || '',
            modelName: data.modelName || '',
            firmwareVersion: data.firmwareVersion || '',
            organizationId: data.organizationId,
            organizationName,
            assignedTo: data.assignedTo,
            assignedUserName,
            status: data.status || 'inactive',
            connectionStatus: data.connectionStatus || 'unknown',
            lastConnected: lastConnected || undefined,
            batteryLevel: data.batteryLevel,
            signalStrength: data.signalStrength,
            totalMeasurements: measurementsSnapshot.size,
            createdAt: createdAt || new Date(),
            updatedAt: updatedAt || undefined
          } as DeviceSummary
        })
      )
      
      const result = {
        devices: transformedData,
        total: allDocs.length,
        page,
        pageSize,
        totalPages: Math.ceil(allDocs.length / pageSize)
      }
      
        metadata: { count: result.devices.length }
      
      return result
      
    } catch (error) {
      throw error
    }
  }
  
  /**
   * 디바이스 상세 정보 조회
   */
  async getDeviceDetails(deviceId: string): Promise<{
    device: DeviceSummary
    measurements: Array<{
      id: string
      userId: string
      userName: string
      createdAt: Date
      duration: number
    }>
    maintenanceHistory: Array<{
      id: string
      type: string
      description: string
      performedAt: Date
      performedBy: string
    }>
  }> {
    await this.requirePermission(Permission.READ_DEVICES)
    
    try {
      // 디바이스 조회
      const deviceDoc = await getDoc(firestoreDoc(db, 'devices', deviceId))
      if (!deviceDoc.exists()) {
        throw new Error('디바이스를 찾을 수 없습니다')
      }
      
      const deviceData = deviceDoc.data() as any
      
      // 조직 및 사용자 정보 조회
      const [organizationName, assignedUserName] = await Promise.all([
        deviceData.organizationId ? this.getOrganizationName(deviceData.organizationId) : '',
        deviceData.assignedTo ? this.getUserName(deviceData.assignedTo) : ''
      ])
      
      // 측정 기록 조회
      const measurementsQuery = query(
        collection(db, 'measurement_sessions'),
        where('deviceId', '==', deviceId),
        orderBy('createdAt', 'desc')
      )
      const measurementsSnapshot = await getDocs(measurementsQuery)
      
      const measurements = await Promise.all(
        measurementsSnapshot.docs.slice(0, 10).map(async (doc) => {
          const data = doc.data() as any
          const userName = await this.getUserName(data.userId)
          
          const updatedItem = {
            id: doc.id,
            userId: data.userId,
            userName,
            createdAt: this.convertTimestamp(data.createdAt) || new Date(),
            duration: data.duration || 0
          }
          return updatedItem
        })
      )
      
      // 유지보수 기록 조회 (예시)
      const maintenanceHistory: any[] = []
      
      // null을 undefined로 변환
      const lastConnected = this.convertTimestamp(deviceData.lastConnected)
      const createdAt = this.convertTimestamp(deviceData.createdAt)
      const updatedAt = this.convertTimestamp(deviceData.updatedAt)
      
      const device: DeviceSummary = {
        id: deviceDoc.id,
        serialNumber: deviceData.serialNumber || '',
        macAddress: deviceData.macAddress || '',
        modelName: deviceData.modelName || '',
        firmwareVersion: deviceData.firmwareVersion || '',
        organizationId: deviceData.organizationId,
        organizationName,
        assignedTo: deviceData.assignedTo,
        assignedUserName,
        status: deviceData.status || 'inactive',
        connectionStatus: deviceData.connectionStatus || 'unknown',
        lastConnected: lastConnected || undefined,
        batteryLevel: deviceData.batteryLevel,
        signalStrength: deviceData.signalStrength,
        totalMeasurements: measurementsSnapshot.size,
        createdAt: createdAt || new Date(),
        updatedAt: updatedAt || undefined
      }
      
      await this.createAuditLog('view_device', 'device', 'success', {
        deviceId
      })
      
      return {
        device,
        measurements,
        maintenanceHistory
      }
      
    } catch (error) {
        metadata: { deviceId }
      
      await this.createAuditLog('view_device', 'device', 'failure', {
        deviceId,
        error: (error as Error).message
      })
      
      throw error
    }
  }
  
  /**
   * 디바이스 통계 조회
   */
  async getDeviceStatistics(): Promise<DeviceStatistics> {
    await this.requirePermission(Permission.VIEW_ANALYTICS)
    
    try {
      const devicesSnapshot = await getDocs(collection(db, 'devices'))
      const devices = devicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      // 통계 계산
      const statistics: DeviceStatistics = {
        totalDevices: devices.length,
        activeDevices: 0,
        assignedDevices: 0,
        unassignedDevices: 0,
        devicesByStatus: {},
        devicesByModel: {},
        averageBatteryLevel: 0,
        lowBatteryDevices: 0,
        recentActivity: []
      }
      
      let totalBattery = 0
      let batteryCount = 0
      
      devices.forEach((device: any) => {
        // 상태별 집계
        if (device.status === 'active') statistics.activeDevices++
        
        const status = device.status || 'unknown'
        statistics.devicesByStatus[status] = (statistics.devicesByStatus[status] || 0) + 1
        
        // 할당 상태
        if (device.assignedTo) {
          statistics.assignedDevices++
        } else {
          statistics.unassignedDevices++
        }
        
        // 모델별 집계
        const model = device.modelName || 'unknown'
        statistics.devicesByModel[model] = (statistics.devicesByModel[model] || 0) + 1
        
        // 배터리 레벨
        if (device.batteryLevel !== undefined) {
          totalBattery += device.batteryLevel
          batteryCount++
          
          if (device.batteryLevel < 20) {
            statistics.lowBatteryDevices++
          }
        }
      })
      
      statistics.averageBatteryLevel = batteryCount > 0 
        ? totalBattery / batteryCount 
        : 0
      
      // 최근 활동 조회
      const recentActivityQuery = query(
        collection(db, 'device_activities'),
        orderBy('timestamp', 'desc')
      )
      const activitySnapshot = await getDocs(recentActivityQuery)
      
      statistics.recentActivity = activitySnapshot.docs.slice(0, 10).map(doc => {
        const data = doc.data() as any
        return {
          deviceId: data.deviceId,
          serialNumber: data.serialNumber || '',
          activity: data.activity,
          timestamp: this.convertTimestamp(data.timestamp) || new Date()
        }
      })
      
      return statistics
      
    } catch (error) {
      throw error
    }
  }
  
  /**
   * 디바이스 할당/해제
   */
  async allocateDevice(allocation: DeviceAllocation): Promise<boolean> {
    await this.requirePermission(Permission.ASSIGN_DEVICES)
    
    try {
      const { deviceId, organizationId, assignedTo } = allocation
      
      await runTransaction(db, async (transaction) => {
        const deviceRef = firestoreDoc(db, 'devices', deviceId)
        const deviceDoc = await transaction.get(deviceRef)
        
        if (!deviceDoc.exists()) {
          throw new Error('디바이스를 찾을 수 없습니다')
        }
        
        const updates: any = {
          organizationId,
          updatedAt: serverTimestamp()
        }
        
        if (assignedTo) {
          // 사용자 할당
          const userDoc = await transaction.get(firestoreDoc(db, 'measurement_users', assignedTo))
          if (!userDoc.exists()) {
            throw new Error('사용자를 찾을 수 없습니다')
          }
          
          updates.assignedTo = assignedTo
          updates.assignedAt = serverTimestamp()
          updates.assignedBy = this.context?.userId
        } else {
          // 할당 해제
          updates.assignedTo = null
          updates.assignedAt = null
          updates.assignedBy = null
        }
        
        transaction.update(deviceRef, updates)
        
        // 활동 기록
        const activityRef = firestoreDoc(collection(db, 'device_activities'))
        transaction.set(activityRef, {
          deviceId,
          serialNumber: (deviceDoc.data() as any).serialNumber,
          activity: assignedTo ? 'assigned' : 'unassigned',
          organizationId,
          userId: assignedTo,
          performedBy: this.context?.userId,
          timestamp: serverTimestamp()
        })
      })
      
      await this.createAuditLog('allocate_device', 'device', 'success', {
        allocation
      })
      
        metadata: { allocation }
      
      return true
      
    } catch (error) {
        metadata: { allocation }
      
      await this.createAuditLog('allocate_device', 'device', 'failure', {
        allocation,
        error: (error as Error).message
      })
      
      throw error
    }
  }
  
  /**
   * 디바이스 일괄 작업
   */
  async executeBulkAction(action: BulkDeviceAction): Promise<{
    success: number
    failed: number
    results: Array<{ deviceId: string; success: boolean; error?: string }>
  }> {
    await this.requirePermission(Permission.WRITE_DEVICES)
    
    const results = {
      success: 0,
      failed: 0,
      results: [] as Array<{ deviceId: string; success: boolean; error?: string }>
    }
    
      metadata: { action: action.action, count: action.deviceIds.length }
    
    for (const deviceId of action.deviceIds) {
      try {
        switch (action.action) {
          case 'assign':
            await this.allocateDevice({
              deviceId,
              organizationId: action.parameters?.organizationId || '',
              assignedTo: action.parameters?.userId
            })
            break
            
          case 'unassign':
            await this.unassignDevice(deviceId)
            break
            
          case 'activate':
            await this.updateDeviceStatus(deviceId, 'active')
            break
            
          case 'deactivate':
            await this.updateDeviceStatus(deviceId, 'inactive')
            break
            
          case 'retire':
            await this.retireDevice(deviceId, action.parameters?.reason)
            break
        }
        
        results.success++
        results.results.push({
          deviceId,
          success: true
        })
      } catch (error) {
        results.failed++
        results.results.push({
          deviceId,
          success: false,
          error: (error as Error).message
        })
        
          metadata: { deviceId, action: action.action }
      }
    }
    
    await this.createAuditLog(`bulk_${action.action}_devices`, 'device', 
      results.failed === 0 ? 'success' : 'failure',
      { action, results }
    )
    
      metadata: results
    
    return results
  }
  
  /**
   * 디바이스 펌웨어 업데이트 관리
   */
  async manageFirmwareUpdate(
    deviceIds: string[],
    firmwareVersion: string
  ): Promise<{
    scheduled: number
    failed: number
    results: Array<{ deviceId: string; scheduled: boolean; error?: string }>
  }> {
    await this.requirePermission(Permission.WRITE_DEVICES)
    
    const results = {
      scheduled: 0,
      failed: 0,
      results: [] as Array<{ deviceId: string; scheduled: boolean; error?: string }>
    }
    
    const batch = writeBatch(db)
    
    for (const deviceId of deviceIds) {
      try {
        const deviceRef = firestoreDoc(db, 'devices', deviceId)
        const updateRef = firestoreDoc(collection(db, 'firmware_updates'))
        
        batch.set(updateRef, {
          deviceId,
          targetVersion: firmwareVersion,
          status: 'scheduled',
          scheduledAt: serverTimestamp(),
          scheduledBy: this.context?.userId
        })
        
        batch.update(deviceRef, {
          pendingFirmwareUpdate: firmwareVersion,
          updatedAt: serverTimestamp()
        })
        
        results.scheduled++
        results.results.push({
          deviceId,
          scheduled: true
        })
      } catch (error) {
        results.failed++
        results.results.push({
          deviceId,
          scheduled: false,
          error: (error as Error).message
        })
      }
    }
    
    await batch.commit()
    
    await this.createAuditLog('schedule_firmware_update', 'device', 
      results.failed === 0 ? 'success' : 'failure',
      { deviceIds, firmwareVersion, results }
    )
    
    return results
  }
  
  // Private 헬퍼 메서드들
  
  private async getOrganizationName(organizationId: string): Promise<string> {
    try {
      const orgDoc = await getDoc(firestoreDoc(db, 'organizations', organizationId))
      return orgDoc.exists() ? (orgDoc.data() as any)?.name || '' : ''
    } catch {
      return ''
    }
  }
  
  private async getUserName(userId: string): Promise<string> {
    try {
      const userDoc = await getDoc(firestoreDoc(db, 'measurement_users', userId))
      return userDoc.exists() ? (userDoc.data() as any)?.name || '' : ''
    } catch {
      return ''
    }
  }
  
  private async unassignDevice(deviceId: string): Promise<void> {
    const deviceRef = firestoreDoc(db, 'devices', deviceId)
    
    await updateDoc(deviceRef, {
      assignedTo: null,
      assignedAt: null,
      assignedBy: null,
      updatedAt: serverTimestamp()
    })
  }
  
  private async updateDeviceStatus(deviceId: string, status: string): Promise<void> {
    const deviceRef = firestoreDoc(db, 'devices', deviceId)
    
    await updateDoc(deviceRef, {
      status,
      updatedAt: serverTimestamp()
    })
  }
  
  private async retireDevice(deviceId: string, reason?: string): Promise<void> {
    await this.requirePermission(Permission.DELETE_DEVICES)
    
    const deviceRef = firestoreDoc(db, 'devices', deviceId)
    
    await updateDoc(deviceRef, {
      status: 'retired',
      retiredAt: serverTimestamp(),
      retiredBy: this.context?.userId,
      retiredReason: reason,
      assignedTo: null,
      organizationId: null,
      updatedAt: serverTimestamp()
    })
  }
}