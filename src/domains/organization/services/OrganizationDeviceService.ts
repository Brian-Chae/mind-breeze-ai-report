import { BaseService } from '@core/services/BaseService'
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp 
} from 'firebase/firestore'
import { db } from '@core/services/firebase'
import { 
  OrganizationDevice, 
  RentalDevice, 
  PurchaseDevice, 
  RentalAction, 
  PurchaseAction, 
  OrganizationServiceRequest, 
  OrganizationDeviceStats, 
  DeviceUsageAnalytics,
  DeviceFilterOptions,
  DeviceSearchOptions
} from '../types/organization-device'

class OrganizationDeviceService extends BaseService {
  constructor() {
    super()
  }

  // 1. 전체 기기 관리 - 전체 기기 목록 조회
  async getAllDevices(organizationId: string, filters?: DeviceFilterOptions, search?: DeviceSearchOptions): Promise<OrganizationDevice[]> {
    return this.withCache(
      `all_devices_${organizationId}_${JSON.stringify(filters)}_${JSON.stringify(search)}`,
      async () => {
        try {
          let q = query(
            collection(db, 'organizationDevices'),
            where('organizationId', '==', organizationId),
            orderBy('registrationDate', 'desc')
          )

          const querySnapshot = await getDocs(q)
          let devices = querySnapshot.docs.map(doc => 
            this.convertFirestoreDevice(doc.data())
          )

          // 필터 적용
          if (filters) {
            devices = this.applyFilters(devices, filters)
          }

          // 검색 적용
          if (search) {
            devices = this.applySearch(devices, search)
          }

          this.log('전체 기기 목록 조회 완료', { organizationId, count: devices.length })
          return devices
        } catch (error) {
          this.error('전체 기기 목록 조회 실패', error as Error, { organizationId })
          return []
        }
      },
      300 // 5분 캐시
    )
  }

  // 2. 렌탈 관리 - 렌탈 기기 목록 조회
  async getRentalDevices(organizationId: string): Promise<RentalDevice[]> {
    return this.withCache(
      `rental_devices_${organizationId}`,
      async () => {
        try {
          const q = query(
            collection(db, 'organizationDevices'),
            where('organizationId', '==', organizationId),
            where('acquisitionType', '==', 'RENTAL'),
            orderBy('rentalEndDate', 'asc')
          )

          const querySnapshot = await getDocs(q)
          const devices = querySnapshot.docs.map(doc => 
            this.convertFirestoreDevice(doc.data()) as RentalDevice
          )

          this.log('렌탈 기기 목록 조회 완료', { organizationId, count: devices.length })
          return devices
        } catch (error) {
          this.error('렌탈 기기 목록 조회 실패', error as Error, { organizationId })
          return []
        }
      },
      300
    )
  }

  // 3. 구매 관리 - 구매 기기 목록 조회
  async getPurchaseDevices(organizationId: string): Promise<PurchaseDevice[]> {
    return this.withCache(
      `purchase_devices_${organizationId}`,
      async () => {
        try {
          const q = query(
            collection(db, 'organizationDevices'),
            where('organizationId', '==', organizationId),
            where('acquisitionType', '==', 'PURCHASE'),
            orderBy('purchaseDate', 'desc')
          )

          const querySnapshot = await getDocs(q)
          const devices = querySnapshot.docs.map(doc => 
            this.convertFirestoreDevice(doc.data()) as PurchaseDevice
          )

          this.log('구매 기기 목록 조회 완료', { organizationId, count: devices.length })
          return devices
        } catch (error) {
          this.error('구매 기기 목록 조회 실패', error as Error, { organizationId })
          return []
        }
      },
      300
    )
  }

  // 4. 렌탈 액션 처리
  async processRentalAction(action: Omit<RentalAction, 'requestDate' | 'status'>): Promise<boolean> {
    return this.measureAndLog('processRentalAction', async () => {
      try {
        const actionWithDefaults: RentalAction = {
          ...action,
          requestDate: new Date(),
          status: 'PENDING'
        }

        await addDoc(collection(db, 'rentalActions'), {
          ...actionWithDefaults,
          requestDate: Timestamp.fromDate(actionWithDefaults.requestDate)
        })

        this.log('렌탈 액션 처리 완료', action)
        return true
      } catch (error) {
        this.error('렌탈 액션 처리 실패', error as Error, action)
        return false
      }
    })
  }

  // 5. 구매 액션 처리
  async processPurchaseAction(action: Omit<PurchaseAction, 'requestDate' | 'status'>): Promise<boolean> {
    return this.measureAndLog('processPurchaseAction', async () => {
      try {
        const actionWithDefaults: PurchaseAction = {
          ...action,
          requestDate: new Date(),
          status: 'PENDING'
        }

        await addDoc(collection(db, 'purchaseActions'), {
          ...actionWithDefaults,
          requestDate: Timestamp.fromDate(actionWithDefaults.requestDate)
        })

        this.log('구매 액션 처리 완료', action)
        return true
      } catch (error) {
        this.error('구매 액션 처리 실패', error as Error, action)
        return false
      }
    })
  }

  // 6. A/S 및 환불 현황 조회
  async getServiceRequests(organizationId: string, type?: 'SERVICE' | 'REFUND'): Promise<OrganizationServiceRequest[]> {
    return this.withCache(
      `service_requests_${organizationId}_${type || 'all'}`,
      async () => {
        try {
          let q = query(
            collection(db, 'organizationServiceRequests'),
            where('organizationId', '==', organizationId),
            orderBy('requestDate', 'desc')
          )

          if (type) {
            q = query(
              collection(db, 'organizationServiceRequests'),
              where('organizationId', '==', organizationId),
              where('type', '==', type),
              orderBy('requestDate', 'desc')
            )
          }

          const querySnapshot = await getDocs(q)
          const requests = querySnapshot.docs.map(doc => 
            this.convertFirestoreServiceRequest(doc.data())
          )

          this.log('서비스 요청 조회 완료', { organizationId, type, count: requests.length })
          return requests
        } catch (error) {
          this.error('서비스 요청 조회 실패', error as Error, { organizationId, type })
          return []
        }
      },
      180 // 3분 캐시
    )
  }

  // 7. 디바이스 통계 조회
  async getDeviceStats(organizationId: string): Promise<OrganizationDeviceStats> {
    return this.withCache(
      `device_stats_${organizationId}`,
      async () => {
        try {
          const devices = await this.getAllDevices(organizationId)
          const serviceRequests = await this.getServiceRequests(organizationId)
          
          const stats: OrganizationDeviceStats = {
            totalDevices: devices.length,
            rentalDevices: devices.filter(d => d.acquisitionType === 'RENTAL').length,
            purchaseDevices: devices.filter(d => d.acquisitionType === 'PURCHASE').length,
            activeDevices: devices.filter(d => d.status === 'ACTIVE').length,
            inactiveDevices: devices.filter(d => d.status === 'INACTIVE').length,
            maintenanceDevices: devices.filter(d => d.status === 'MAINTENANCE').length,
            serviceDevices: devices.filter(d => d.status === 'SERVICE').length,
            totalMeasurements: devices.reduce((sum, d) => sum + d.totalMeasurements, 0),
            monthlyUsage: this.calculateMonthlyUsage(devices),
            expiringSoonRentals: this.getExpiringSoonRentals(devices),
            pendingRentalActions: 0, // TODO: 실제 데이터로 구현
            warrantyExpiringSoon: this.getWarrantyExpiringSoon(devices),
            pendingPurchaseActions: 0, // TODO: 실제 데이터로 구현
            pendingServiceRequests: serviceRequests.filter(r => r.status === 'PENDING').length,
            inProgressServiceRequests: serviceRequests.filter(r => r.status === 'IN_PROGRESS').length,
            pendingRefundRequests: serviceRequests.filter(r => r.type === 'REFUND' && r.status === 'PENDING').length,
          }

          this.log('디바이스 통계 조회 완료', { organizationId, stats })
          return stats
        } catch (error) {
          this.error('디바이스 통계 조회 실패', error as Error, { organizationId })
          return this.getDefaultStats()
        }
      },
      300
    )
  }

  // 유틸리티 메서드들
  private convertFirestoreDevice(data: any): OrganizationDevice {
    return {
      id: data.id,
      deviceId: data.deviceId,
      deviceName: data.deviceName,
      deviceModel: data.deviceModel,
      registrationDate: data.registrationDate?.toDate() || new Date(),
      acquisitionType: data.acquisitionType,
      totalMeasurements: data.totalMeasurements || 0,
      lastUsedDate: data.lastUsedDate?.toDate() || null,
      status: data.status,
      batteryLevel: data.batteryLevel,
      firmwareVersion: data.firmwareVersion,
      organizationId: data.organizationId,
      assignedUserId: data.assignedUserId,
      assignedUserName: data.assignedUserName,
      // 렌탈 전용 필드들
      ...(data.acquisitionType === 'RENTAL' && {
        rentalStartDate: data.rentalStartDate?.toDate(),
        rentalEndDate: data.rentalEndDate?.toDate(),
        monthlyFee: data.monthlyFee,
        isExtensionRequested: data.isExtensionRequested || false,
        isPurchaseConversionRequested: data.isPurchaseConversionRequested || false,
        isReturnRequested: data.isReturnRequested || false,
      }),
      // 구매 전용 필드들
      ...(data.acquisitionType === 'PURCHASE' && {
        purchaseDate: data.purchaseDate?.toDate(),
        purchasePrice: data.purchasePrice,
        warrantyStartDate: data.warrantyStartDate?.toDate(),
        warrantyEndDate: data.warrantyEndDate?.toDate(),
        isRefundRequested: data.isRefundRequested || false,
      })
    }
  }

  private convertFirestoreServiceRequest(data: any): OrganizationServiceRequest {
    return {
      id: data.id,
      type: data.type,
      deviceId: data.deviceId,
      deviceName: data.deviceName,
      requestDate: data.requestDate?.toDate() || new Date(),
      requestedBy: data.requestedBy,
      status: data.status,
      issue: data.issue,
      urgency: data.urgency,
      serviceType: data.serviceType,
      estimatedCompletionDate: data.estimatedCompletionDate?.toDate(),
      actualCompletionDate: data.actualCompletionDate?.toDate(),
      refundReason: data.refundReason,
      refundAmount: data.refundAmount,
      refundStatus: data.refundStatus
    }
  }

  private applyFilters(devices: OrganizationDevice[], filters: DeviceFilterOptions): OrganizationDevice[] {
    let filtered = devices

    if (filters.status?.length) {
      filtered = filtered.filter(d => filters.status!.includes(d.status))
    }

    if (filters.acquisitionType?.length) {
      filtered = filtered.filter(d => filters.acquisitionType!.includes(d.acquisitionType))
    }

    if (filters.deviceModel?.length) {
      filtered = filtered.filter(d => filters.deviceModel!.includes(d.deviceModel))
    }

    return filtered
  }

  private applySearch(devices: OrganizationDevice[], search: DeviceSearchOptions): OrganizationDevice[] {
    if (!search.query) return devices

    return devices.filter(device => {
      return search.fields.some(field => {
        const value = device[field]
        return value && value.toString().toLowerCase().includes(search.query.toLowerCase())
      })
    })
  }

  private calculateMonthlyUsage(devices: OrganizationDevice[]): number {
    const thisMonth = new Date()
    thisMonth.setDate(1)
    
    return devices
      .filter(d => d.lastUsedDate && d.lastUsedDate >= thisMonth)
      .reduce((sum, d) => sum + d.totalMeasurements, 0)
  }

  private getExpiringSoonRentals(devices: OrganizationDevice[]): number {
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    return devices.filter(device => {
      if (device.acquisitionType === 'RENTAL') {
        const rental = device as RentalDevice
        return rental.rentalEndDate <= thirtyDaysFromNow
      }
      return false
    }).length
  }

  private getWarrantyExpiringSoon(devices: OrganizationDevice[]): number {
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    return devices.filter(device => {
      if (device.acquisitionType === 'PURCHASE') {
        const purchase = device as PurchaseDevice
        return purchase.warrantyEndDate <= thirtyDaysFromNow
      }
      return false
    }).length
  }

  private getDefaultStats(): OrganizationDeviceStats {
    return {
      totalDevices: 0,
      rentalDevices: 0,
      purchaseDevices: 0,
      activeDevices: 0,
      inactiveDevices: 0,
      maintenanceDevices: 0,
      serviceDevices: 0,
      totalMeasurements: 0,
      monthlyUsage: 0,
      expiringSoonRentals: 0,
      pendingRentalActions: 0,
      warrantyExpiringSoon: 0,
      pendingPurchaseActions: 0,
      pendingServiceRequests: 0,
      inProgressServiceRequests: 0,
      pendingRefundRequests: 0
    }
  }
}

export default new OrganizationDeviceService() 