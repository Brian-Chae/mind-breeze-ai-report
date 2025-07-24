/**
 * 🏭 디바이스 재고 관리 서비스
 * 
 * Phase 1 핵심 기능:
 * - 디바이스 재고 등록/조회/수정/삭제
 * - 재고 통계 및 현황 분석
 * - 벌크 등록 지원
 * - 상태 변경 추적
 * - 검색 및 필터링
 */

import { BaseService } from '../../../core/services/BaseService';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  setDoc,
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  writeBatch,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { 
  DeviceInventory,
  CreateDeviceInventoryRequest,
  InventoryStats,
  DeviceSearchFilters,
  PaginationOptions,
  ApiResponse,
  BulkOperationResult,
  DeviceManagementError,
  ErrorCodes
} from '../types/device';

class DeviceInventoryService extends BaseService {
  private readonly COLLECTION_NAME = 'deviceInventory';
  private readonly DEFAULT_DEVICE_TYPE = 'LINK_BAND_2.0';
  private readonly DEFAULT_WARRANTY_PERIOD = 12; // 개월

  constructor() {
    super();
    this.serviceName = 'DeviceInventoryService';
  }

  // ============================================================================
  // 기본 CRUD 작업
  // ============================================================================

  /**
   * 새로운 디바이스 재고 등록
   */
  async createDevice(
    deviceData: CreateDeviceInventoryRequest,
    customDeviceId?: string
  ): Promise<DeviceInventory> {
    return await this.measureAndLog('createDevice', async () => {

      // 사용자 지정 ID인 경우 중복 검사
      if (customDeviceId) {
        const existingDevice = await getDoc(doc(this.db, this.COLLECTION_NAME, customDeviceId));
        if (existingDevice.exists()) {
          throw new Error(`디바이스 이름 '${customDeviceId}'는 이미 존재합니다.`);
        }
      }
      
      // 기본값 설정
      const now = new Date();
      const deviceInventoryData = {
        deviceType: deviceData.deviceType || this.DEFAULT_DEVICE_TYPE,
        registrationDate: deviceData.registrationDate || now,
        status: 'AVAILABLE' as const,
        purchaseCost: deviceData.purchaseCost,
        supplier: deviceData.supplier,
        warrantyPeriod: deviceData.warrantyPeriod || this.DEFAULT_WARRANTY_PERIOD,
        notes: deviceData.notes,
        createdAt: now,
        updatedAt: now
      };

      // undefined 값들을 제거하는 함수
      const removeUndefinedFields = (obj: any): any => {
        return Object.fromEntries(
          Object.entries(obj).filter(([_, value]) => value !== undefined && value !== null)
        );
      };

      const cleanedData = removeUndefinedFields(deviceInventoryData);

      // ID 생성
      const deviceId = customDeviceId || await this.generateDeviceId();
      
      // Firestore에 저장
      const docRef = doc(this.db, this.COLLECTION_NAME, deviceId);
      await setDoc(docRef, {
        ...cleanedData,
        registrationDate: Timestamp.fromDate(cleanedData.registrationDate),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      const result: DeviceInventory = {
        id: deviceId,
        ...cleanedData
      };

      // 캐시 무효화
      await this.cache.delete(`${this.COLLECTION_NAME}:stats`);
      await this.cache.delete(`${this.COLLECTION_NAME}:available`);
      
      this.logger.info('디바이스 등록 완료', { deviceId });
      return result;
    });
  }

  /**
   * 디바이스 ID 자동 생성
   * 형식: LXB-YYYYMMDD-XXX (예: LXB-20240115-001)
   */
  private async generateDeviceId(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // 오늘 등록된 디바이스 수를 확인하여 시퀀스 번호 생성
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const todayQuery = query(
      collection(this.db, this.COLLECTION_NAME),
      where('registrationDate', '>=', Timestamp.fromDate(todayStart)),
      where('registrationDate', '<', Timestamp.fromDate(todayEnd))
    );

    const snapshot = await getDocs(todayQuery);
    const sequence = (snapshot.size + 1).toString().padStart(3, '0');
    
    return `LXB-${dateStr}-${sequence}`;
  }

  /**
   * 디바이스 조회 (ID로)
   */
  async getDeviceById(deviceId: string): Promise<DeviceInventory | null> {
    try {
      const cacheKey = `${this.COLLECTION_NAME}:device:${deviceId}`;
      
      // 캐시에서 먼저 확인
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return cached as DeviceInventory;
      }

      const docRef = doc(this.db, this.COLLECTION_NAME, deviceId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      const device: DeviceInventory = {
        id: docSnap.id,
        ...data,
        registrationDate: data.registrationDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as DeviceInventory;

      // 캐시에 저장 (5분)
      await this.cache.set(cacheKey, device, 5 * 60 * 1000);

      return device;

    } catch (error) {
      this.handleError(error, 'getDeviceById', { deviceId });
      throw error;
    }
  }
  
  /**
   * 디바이스 목록 조회 (필터링 및 페이지네이션)
   */
  async getDevices(
    filters?: DeviceSearchFilters,
    pagination?: PaginationOptions
  ): Promise<ApiResponse<DeviceInventory[]>> {
    return await this.measureAndLog('getDevices', async () => {
      // 쿼리 구성
      const constraints: any[] = [];

      // 필터 적용
      if (filters?.status) {
        constraints.push(where('status', '==', filters.status));
      }
      if (filters?.deviceType) {
        constraints.push(where('deviceType', '==', filters.deviceType));
      }

      // 정렬
      const sortBy = pagination?.sortBy || 'registrationDate';
      const sortOrder = pagination?.sortOrder || 'desc';
      constraints.push(orderBy(sortBy, sortOrder));

      // 페이지네이션
      if (pagination?.limit) {
        constraints.push(limit(pagination.limit));
      }

      const finalQuery = query(collection(this.db, this.COLLECTION_NAME), ...constraints);
      const snapshot = await getDocs(finalQuery);

      const devices: DeviceInventory[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          registrationDate: data.registrationDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as DeviceInventory;
      });

      const result: ApiResponse<DeviceInventory[]> = {
        success: true,
        data: devices,
        pagination: pagination ? {
          total: snapshot.size,
          page: pagination.page || 1,
          limit: pagination.limit || 20,
          totalPages: Math.ceil(snapshot.size / (pagination.limit || 20))
        } : undefined
      };

      return result;
    });
  }

  /**
   * 사용 가능한 디바이스 목록 조회
   */
  async getAvailableDevices(): Promise<DeviceInventory[]> {
    try {
      const cacheKey = `${this.COLLECTION_NAME}:available`;
      
      // 캐시에서 먼저 확인
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return cached as DeviceInventory[];
      }

      const availableQuery = query(
        collection(this.db, this.COLLECTION_NAME),
        where('status', '==', 'AVAILABLE'),
        orderBy('registrationDate', 'desc')
      );

      const snapshot = await getDocs(availableQuery);
      const devices: DeviceInventory[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          registrationDate: data.registrationDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as DeviceInventory;
      });

      // 캐시에 저장 (2분)
      await this.cache.set(cacheKey, devices, 2 * 60 * 1000);

      return devices;

    } catch (error) {
      this.handleError(error, 'getAvailableDevices');
      throw error;
    }
  }
  
  /**
   * 디바이스 상태 변경
   */
  async updateDeviceStatus(
    deviceId: string,
    status: DeviceInventory['status'],
    notes?: string
  ): Promise<void> {
    return await this.measureAndLog('updateDeviceStatus', async () => {
      // 디바이스 존재 확인
      const device = await this.getDeviceById(deviceId);
      if (!device) {
        const error = new Error('디바이스를 찾을 수 없습니다');
        throw error;
      }
      
      const docRef = doc(this.db, this.COLLECTION_NAME, deviceId);
      const updateData: any = {
        status,
        updatedAt: serverTimestamp()
      };

      if (notes) {
        updateData.notes = notes;
      }

      await updateDoc(docRef, updateData);

      // 캐시 무효화
      await this.cache.delete(`${this.COLLECTION_NAME}:device:${deviceId}`);
      await this.cache.delete(`${this.COLLECTION_NAME}:stats`);
      await this.cache.delete(`${this.COLLECTION_NAME}:available`);
      
      this.logger.info('디바이스 상태 변경', { deviceId, status });
    });
  }

  /**
   * 디바이스 렌탈/판매 처리 업데이트
   */
  async updateDeviceAssignment(
    deviceId: string, 
    organizationId: string,
    organizationName: string,
    organizationCode: string,
    businessType: 'rental' | 'sale' = 'rental',
    contactInfo?: {
      contactName?: string;
      contactEmail?: string;
      contactPhone?: string;
      salePrice?: number;
    }
  ): Promise<void> {
    return await this.measureAndLog('updateDeviceAssignment', async () => {

      // 디바이스 존재 확인
      const device = await this.getDeviceById(deviceId);
      if (!device) {
        const error = new Error('디바이스를 찾을 수 없습니다');
        throw error;
      }
      
      const docRef = doc(this.db, this.COLLECTION_NAME, deviceId);
      
      // 비즈니스 유형에 따라 다른 상태와 필드 설정
      const updateData: any = {
        updatedAt: serverTimestamp()
      };

      if (businessType === 'rental') {
        // 렌탈 처리
        updateData.status = 'RENTED';
        updateData.businessType = 'RENTAL';
        updateData.rentalOrganizationId = organizationId;
        updateData.rentalOrganizationName = organizationName;
        updateData.rentalOrganizationCode = organizationCode;
        updateData.rentalStartDate = serverTimestamp();
        
        // 🔄 하위 호환성을 위해 기존 필드도 유지
        updateData.assignedOrganizationId = organizationId;
        updateData.assignedOrganizationName = organizationName;
        updateData.assignedOrganizationCode = organizationCode;
        updateData.assignedAt = serverTimestamp();
      } else if (businessType === 'sale') {
        // 판매 처리
        updateData.status = 'SOLD';
        updateData.businessType = 'SALE';
        updateData.soldToOrganizationId = organizationId;
        updateData.soldToOrganizationName = organizationName;
        updateData.soldToOrganizationCode = organizationCode;
        updateData.saleDate = serverTimestamp();
        
        // 🎯 판매 담당자 정보 저장
        if (contactInfo?.contactName) updateData.contactName = contactInfo.contactName;
        if (contactInfo?.contactEmail) updateData.contactEmail = contactInfo.contactEmail;
        if (contactInfo?.contactPhone) updateData.contactPhone = contactInfo.contactPhone;
        if (contactInfo?.salePrice) updateData.salePrice = contactInfo.salePrice;
        
        // 🔄 하위 호환성을 위해 기존 필드도 유지
        updateData.assignedOrganizationId = organizationId;
        updateData.assignedOrganizationName = organizationName;
        updateData.assignedOrganizationCode = organizationCode;
        updateData.assignedAt = serverTimestamp();
      }

      await updateDoc(docRef, updateData);

      // 캐시 무효화
      await this.cache.delete(`${this.COLLECTION_NAME}:device:${deviceId}`);
      await this.cache.delete(`${this.COLLECTION_NAME}:stats`);
      await this.cache.delete(`${this.COLLECTION_NAME}:available`);
      
      this.logger.info('디바이스 할당 업데이트', { deviceId, organizationId, businessType });
    });
  }

  /**
   * 디바이스 삭제
   */
  async deleteDevice(deviceId: string): Promise<void> {
    return await this.measureAndLog('deleteDevice', async () => {
      const device = await this.getDeviceById(deviceId);
      if (!device) {
        const error = new Error('디바이스를 찾을 수 없습니다');
        throw error;
      }
      
      const docRef = doc(this.db, this.COLLECTION_NAME, deviceId);
      await deleteDoc(docRef);

      // 캐시 무효화
      await this.cache.delete(`${this.COLLECTION_NAME}:device:${deviceId}`);
      await this.cache.delete(`${this.COLLECTION_NAME}:stats`);
      await this.cache.delete(`${this.COLLECTION_NAME}:available`);
      
      this.logger.info('디바이스 삭제 완료', { deviceId });
    });
  }

  /**
   * 디바이스 배정 해제
   */
  async unassignDevice(deviceId: string): Promise<void> {
    return await this.measureAndLog('unassignDevice', async () => {
      const device = await this.getDeviceById(deviceId);
      if (!device) {
        const error = new Error('디바이스를 찾을 수 없습니다');
        throw error;
      }
      
      const docRef = doc(this.db, this.COLLECTION_NAME, deviceId);
      const updateData: any = {
        status: 'AVAILABLE',
        updatedAt: serverTimestamp(),
        // 🔄 기존 필드들 제거 (하위 호환성)
        assignedOrganizationId: null,
        assignedOrganizationName: null,
        assignedOrganizationCode: null,
        assignedAt: null,
        // 🎯 새로운 필드들 제거
        businessType: null,
        rentalOrganizationId: null,
        rentalOrganizationName: null,
        rentalOrganizationCode: null,
        rentalStartDate: null,
        rentalEndDate: null,
        soldToOrganizationId: null,
        soldToOrganizationName: null,
        soldToOrganizationCode: null,
        saleDate: null,
        salePrice: null
      };

      await updateDoc(docRef, updateData);

      // 🎯 렌탈 계약이 있는 경우 상태 업데이트
      if (device.businessType === 'RENTAL' || device.status === 'RENTED') {
        try {
          // deviceRentals 컬렉션에서 해당 디바이스의 활성 렌탈 찾아서 완료 처리
          const rentalsQuery = query(
            collection(this.db, 'deviceRentals'),
            where('deviceId', '==', deviceId),
            where('status', 'in', ['ACTIVE', 'SCHEDULED_RETURN', 'OVERDUE'])
          );
          
          const rentalsSnapshot = await getDocs(rentalsQuery);
          
          if (!rentalsSnapshot.empty) {
            const batch = writeBatch(this.db);
            
            rentalsSnapshot.docs.forEach((rentalDoc) => {
              batch.update(rentalDoc.ref, {
                status: 'RETURNED', // 반납 완료 상태로 변경
                actualReturnDate: serverTimestamp(),
                returnProcessedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
            });
            
            await batch.commit();
          // 렌탈 계약 업데이트가 실패해도 디바이스 상태 변경은 완료되었으므로 에러를 던지지 않음
          } catch (rentalError) {
            this.logger.warn('렌탈 계약 업데이트 실패', { deviceId, error: rentalError });
          }
        }
      }

      // 캐시 무효화
      await this.cache.delete(`${this.COLLECTION_NAME}:device:${deviceId}`);
      await this.cache.delete(`${this.COLLECTION_NAME}:stats`);
      await this.cache.delete(`${this.COLLECTION_NAME}:available`);
      
      this.logger.info('디바이스 배정 해제', { deviceId });
    });
  }

  // ============================================================================
  // 통계 및 분석
  // ============================================================================

  /**
   * 재고 통계 조회
   */
  async getInventoryStats(): Promise<InventoryStats> {
    try {
      const cacheKey = `${this.COLLECTION_NAME}:stats`;
      
      // 캐시에서 먼저 확인
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return cached as InventoryStats;
      }

      const snapshot = await getDocs(collection(this.db, this.COLLECTION_NAME));
      
      const stats: InventoryStats = {
        total: 0,
        available: 0,
        rented: 0,
        sold: 0,
        inUse: 0,
        maintenance: 0,
        returned: 0,
        disposed: 0,
        // 🔄 하위 호환성을 위해 유지
        assigned: 0
      };

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        stats.total++;
        
        switch (data.status) {
          case 'AVAILABLE':
            stats.available++;
            break;
          case 'RENTED':
            stats.rented++;
            break;
          case 'SOLD':
            stats.sold++;
            break;
          case 'ASSIGNED':
            // 🔄 기존 ASSIGNED 상태도 처리 (하위 호환성)
            stats.assigned++;
            break;
          case 'IN_USE':
            stats.inUse++;
            break;
          case 'MAINTENANCE':
            stats.maintenance++;
            break;
          case 'RETURNED':
            stats.returned++;
            break;
          case 'DISPOSED':
            stats.disposed++;
            break;
        }
      });

      // 캐시에 저장 (5분)
      await this.cache.set(cacheKey, stats, 5 * 60 * 1000);

      return stats;

    } catch (error) {
      this.handleError(error, 'getInventoryStats');
      throw error;
    }
  }
  
  /**
   * 대량 디바이스 등록
   */
  async bulkCreateDevices(devicesData: CreateDeviceInventoryRequest[]): Promise<BulkOperationResult<DeviceInventory>> {
    return await this.measureAndLog('bulkCreateDevices', async () => {
      const batch = writeBatch(this.db);
      const successful: DeviceInventory[] = [];
      const failed: Array<{ data: Partial<DeviceInventory>; error: string }> = [];

      for (const deviceData of devicesData) {
        try {
          const deviceId = await this.generateDeviceId();
          const now = new Date();
          
          const deviceInventory: Omit<DeviceInventory, 'id'> = {
            deviceType: deviceData.deviceType || this.DEFAULT_DEVICE_TYPE,
            registrationDate: deviceData.registrationDate || now,
            status: 'AVAILABLE',
            purchaseCost: deviceData.purchaseCost,
            supplier: deviceData.supplier,
            warrantyPeriod: deviceData.warrantyPeriod || this.DEFAULT_WARRANTY_PERIOD,
            notes: deviceData.notes,
            createdAt: now,
            updatedAt: now
          };

          const docRef = doc(this.db, this.COLLECTION_NAME, deviceId);
          batch.set(docRef, {
            ...deviceInventory,
            registrationDate: Timestamp.fromDate(deviceInventory.registrationDate),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });

          successful.push({
            id: deviceId,
            ...deviceInventory
          });

        } catch (error) {
          failed.push({
            data: deviceData,
            error: error instanceof Error ? error.message : '알 수 없는 오류'
          });
        }
      }

      // 배치 실행
      if (successful.length > 0) {
        await batch.commit();
        
        // 캐시 무효화
        await this.cache.delete(`${this.COLLECTION_NAME}:stats`);
        await this.cache.delete(`${this.COLLECTION_NAME}:available`);
      }

      const result: BulkOperationResult<DeviceInventory> = {
        successful,
        failed,
        summary: {
          total: devicesData.length,
          successful: successful.length,
          failed: failed.length
        }
      };
      
      this.logger.info('대량 디바이스 등록 완료', result.summary);
      return result;
    });
  }

  // ============================================================================
  // 유틸리티 메서드
  // ============================================================================

  /**
   * 디바이스 존재 여부 확인
   */
  async deviceExists(deviceId: string): Promise<boolean> {
    try {
      const device = await this.getDeviceById(deviceId);
      return device !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * 특정 상태의 디바이스 수 조회
   */
  async getDeviceCountByStatus(status: DeviceInventory['status']): Promise<number> {
    try {
      const statusQuery = query(
        collection(this.db, this.COLLECTION_NAME),
        where('status', '==', status)
      );
      
      const snapshot = await getDocs(statusQuery);
      return snapshot.size;

    } catch (error) {
      this.logger.error('디바이스 상태별 수 조회 실패', { status, error });
      return 0;
    }
  }
}

// 싱글톤 인스턴스 생성 및 export
export const deviceInventoryService = new DeviceInventoryService();