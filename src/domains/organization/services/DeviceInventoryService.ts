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
      this.log('디바이스 등록 시작', { deviceData });

      // 사용자 지정 ID가 있으면 사용, 없으면 자동 생성
      const deviceId = customDeviceId || await this.generateDeviceId();

      // 사용자 지정 ID인 경우 중복 검사
      if (customDeviceId) {
        const existingDevice = await getDoc(doc(this.db, this.COLLECTION_NAME, customDeviceId));
        if (existingDevice.exists()) {
          throw new Error(`디바이스 이름 '${customDeviceId}'는 이미 존재합니다.`);
        }
      }
      
      // 기본값 설정
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

      // Firestore에 저장
      const docRef = doc(this.db, this.COLLECTION_NAME, deviceId);
      await setDoc(docRef, {
        ...deviceInventory,
        registrationDate: Timestamp.fromDate(deviceInventory.registrationDate),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      const result: DeviceInventory = {
        id: deviceId,
        ...deviceInventory
      };

      // 캐시 무효화
      await this.cache.delete(`${this.COLLECTION_NAME}:stats`);
      await this.cache.delete(`${this.COLLECTION_NAME}:available`);

      this.log('디바이스 등록 성공', { deviceId });
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
      this.error('디바이스 조회 실패', error as Error, { deviceId });
      throw error;
    }
  }

  /**
   * 전체 재고 목록 조회
   */
  async getAllInventory(
    filters?: DeviceSearchFilters,
    pagination?: PaginationOptions
  ): Promise<ApiResponse<DeviceInventory[]>> {
    return await this.measureAndLog('getAllInventory', async () => {
      this.log('재고 목록 조회 시작', { filters, pagination });

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
          page: pagination.page,
          limit: pagination.limit,
          totalPages: Math.ceil(snapshot.size / pagination.limit)
        } : undefined
      };

      this.log('재고 목록 조회 성공', { count: devices.length });
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
      this.error('사용 가능한 디바이스 조회 실패', error as Error);
      throw error;
    }
  }

  /**
   * 디바이스 상태 업데이트
   */
  async updateDeviceStatus(
    deviceId: string, 
    status: DeviceInventory['status'],
    notes?: string
  ): Promise<void> {
    return await this.measureAndLog('updateDeviceStatus', async () => {
      this.log('디바이스 상태 업데이트 시작', { deviceId, status, notes });

      // 디바이스 존재 확인
      const device = await this.getDeviceById(deviceId);
      if (!device) {
        const error = new Error('디바이스를 찾을 수 없습니다');
        this.error('디바이스를 찾을 수 없음', error, { deviceId });
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

      this.log('디바이스 상태 업데이트 성공', { deviceId, status });
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
        assigned: 0,
        inUse: 0,
        maintenance: 0,
        returned: 0,
        disposed: 0
      };

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        stats.total++;
        
        switch (data.status) {
          case 'AVAILABLE':
            stats.available++;
            break;
          case 'ASSIGNED':
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
      this.error('재고 통계 조회 실패', error as Error);
      throw error;
    }
  }

  // ============================================================================
  // 벌크 작업
  // ============================================================================

  /**
   * 여러 디바이스 일괄 등록
   */
  async bulkCreateDevices(
    devicesData: CreateDeviceInventoryRequest[]
  ): Promise<BulkOperationResult<DeviceInventory>> {
    return await this.measureAndLog('bulkCreateDevices', async () => {
      this.log('디바이스 일괄 등록 시작', { count: devicesData.length });

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

      this.log('디바이스 일괄 등록 완료', result.summary);
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
      this.error('상태별 디바이스 수 조회 실패', error as Error, { status });
      return 0;
    }
  }

  /**
   * 캐시 초기화
   */
  async clearCache(): Promise<void> {
    try {
      await this.cache.delete(`${this.COLLECTION_NAME}:stats`);
      await this.cache.delete(`${this.COLLECTION_NAME}:available`);
      this.log('디바이스 재고 캐시 초기화 완료');
    } catch (error) {
      this.error('캐시 초기화 실패', error as Error);
    }
  }
}

// 싱글톤 인스턴스 생성 및 export
export const deviceInventoryService = new DeviceInventoryService(); 