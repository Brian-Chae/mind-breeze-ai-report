import { BaseService } from '@core/services/BaseService';
import { LogCategory } from '@core/utils/Logger';
import { 
  doc, 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  Timestamp,
  runTransaction,
  writeBatch,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  Transaction,
  WriteBatch
} from 'firebase/firestore';
import { ErrorCodes } from '@core/utils/ErrorHandler';
import { IdGenerator } from '@core/utils/IdGenerator';

// 디바이스 관련 타입 정의
export interface Device {
  id: string;
  organizationId: string;
  serialNumber: string;
  name: string;
  model: string;
  type: 'EEG' | 'PPG' | 'MULTI_SENSOR' | 'WEARABLE';
  manufacturer: string;
  firmwareVersion: string;
  batteryLevel: number;
  signalStrength: 'weak' | 'medium' | 'strong';
  status: 'online' | 'offline' | 'maintenance' | 'error';
  assignedUserId?: string;
  assignedUserName?: string;
  assignedLocation?: string;
  locationId?: string;
  lastSyncAt?: Date;
  lastDataReceived?: Date;
  pairedAt?: Date;
  maintenanceScheduledAt?: Date;
  calibrationDate?: Date;
  warrantyExpiresAt?: Date;
  isActive: boolean;
  isCalibrated: boolean;
  isPaired: boolean;
  configuration: DeviceConfiguration;
  metadata: DeviceMetadata;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface DeviceConfiguration {
  samplingRate: number;
  measurementDuration: number;
  autoSync: boolean;
  lowBatteryThreshold: number;
  dataRetentionDays: number;
  notifications: {
    lowBattery: boolean;
    connectionLost: boolean;
    calibrationNeeded: boolean;
    firmwareUpdate: boolean;
  };
}

export interface DeviceMetadata {
  purchaseDate?: Date;
  purchasePrice?: number;
  vendor?: string;
  warrantyProvider?: string;
  supportContact?: string;
  notes?: string;
}

export interface DeviceStats {
  totalDevices: number;
  activeDevices: number;
  offlineDevices: number;
  maintenanceDevices: number;
  errorDevices: number;
  averageBatteryLevel: number;
  devicesNeedingCalibration: number;
  devicesNeedingFirmwareUpdate: number;
  totalMeasurements: number;
  dailyMeasurements: number;
  weeklyMeasurements: number;
  monthlyMeasurements: number;
}

export interface DeviceFilters {
  type?: string;
  status?: string;
  assignedUserId?: string;
  locationId?: string;
  batteryLevelBelow?: number;
  needsCalibration?: boolean;
  needsFirmwareUpdate?: boolean;
  lastSyncBefore?: Date;
  lastSyncAfter?: Date;
  searchQuery?: string;
}

export interface DeviceListResponse {
  devices: Device[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface CreateDeviceRequest {
  organizationId: string;
  serialNumber: string;
  name: string;
  model: string;
  type: Device['type'];
  manufacturer: string;
  firmwareVersion?: string;
  assignedUserId?: string;
  assignedLocation?: string;
  locationId?: string;
  configuration?: Partial<DeviceConfiguration>;
  metadata?: Partial<DeviceMetadata>;
}

export interface UpdateDeviceRequest {
  name?: string;
  assignedUserId?: string;
  assignedUserName?: string;
  assignedLocation?: string;
  locationId?: string;
  firmwareVersion?: string;
  configuration?: Partial<DeviceConfiguration>;
  metadata?: Partial<DeviceMetadata>;
  isActive?: boolean;
}

export interface DeviceStatusUpdate {
  status: Device['status'];
  batteryLevel?: number;
  signalStrength?: Device['signalStrength'];
  lastSyncAt?: Date;
  lastDataReceived?: Date;
}

export interface DeviceAssignment {
  deviceId: string;
  userId: string;
  userName: string;
  assignedAt: Date;
  assignedBy: string;
  location?: string;
  notes?: string;
}

export interface DeviceActivity {
  id: string;
  deviceId: string;
  action: 'assigned' | 'unassigned' | 'status_changed' | 'calibrated' | 'maintenance' | 'firmware_updated';
  description: string;
  performedBy: string;
  performedAt: Date;
  metadata?: Record<string, any>;
}

export interface DeviceDashboardData {
  stats: DeviceStats;
  recentActivity: DeviceActivity[];
  alertDevices: Device[];
  assignmentHistory: DeviceAssignment[];
  maintenanceSchedule: Device[];
  firmwareUpdates: {
    deviceId: string;
    currentVersion: string;
    availableVersion: string;
    updateAvailable: boolean;
  }[];
}

/**
 * 고도화된 디바이스 관리 서비스
 * 
 * 주요 기능:
 * - 포괄적인 디바이스 CRUD 작업
 * - 실시간 디바이스 상태 모니터링
 * - 사용자 할당 및 위치 관리
 * - 펌웨어 및 교정 관리
 * - 통계 및 분석 대시보드
 * - 유지보수 스케줄링
 * - 알림 및 경고 시스템
 * - 성능 최적화 및 캐싱
 * 
 * @author Mind Breeze AI Team
 * @version 1.0
 */
export class DeviceManagementService extends BaseService {
  
  // 캐시 키 상수
  private static readonly CACHE_KEYS = {
    DEVICE_LIST: (orgId: string) => `devices:list:${orgId}`,
    DEVICE_DETAIL: (deviceId: string) => `device:detail:${deviceId}`,
    DEVICE_STATS: (orgId: string) => `device:stats:${orgId}`,
    DEVICE_ASSIGNMENTS: (orgId: string) => `device:assignments:${orgId}`,
    DEVICE_ACTIVITY: (deviceId: string) => `device:activity:${deviceId}`
  } as const;

  // 캐시 TTL 상수 (밀리초)
  private static readonly CACHE_TTL = {
    DEVICE_LIST: 3 * 60 * 1000,      // 3분
    DEVICE_DETAIL: 5 * 60 * 1000,    // 5분
    DEVICE_STATS: 2 * 60 * 1000,     // 2분
    DEVICE_ASSIGNMENTS: 10 * 60 * 1000, // 10분
    DEVICE_ACTIVITY: 5 * 60 * 1000   // 5분
  } as const;

  // 컬렉션 이름
  private readonly DEVICES_COLLECTION = 'devices';
  private readonly DEVICE_ASSIGNMENTS_COLLECTION = 'deviceAssignments';
  private readonly DEVICE_ACTIVITIES_COLLECTION = 'deviceActivities';

  constructor() {
    super();
    this.log('DeviceManagementService 초기화 완료', {
      version: '1.0',
      features: [
        'device_crud',
        'status_monitoring',
        'user_assignment',
        'firmware_management',
        'statistics',
        'maintenance_scheduling'
      ]
    });
  }

  // ===== 디바이스 조회 및 관리 =====

  /**
   * 조직의 모든 디바이스 조회 (페이지네이션, 필터링, 캐싱 지원)
   * @param organizationId 조직 ID
   * @param filters 필터 조건
   * @param page 페이지 번호
   * @param limit 페이지 크기
   * @returns 디바이스 목록과 페이지네이션 정보
   */
  async getOrganizationDevices(
    organizationId: string,
    filters: DeviceFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<DeviceListResponse> {
    return this.measureAndLog('getOrganizationDevices', async () => {
      this.validateId(organizationId, '조직 ID');
      const { page: validPage, limit: validLimit, offset } = this.validatePagination(page, limit);

      // 캐시 키 생성 (필터와 페이지네이션 포함)
      const cacheKey = `${DeviceManagementService.CACHE_KEYS.DEVICE_LIST(organizationId)}:${JSON.stringify(filters)}:${validPage}:${validLimit}`;

      return this.withCache(
        cacheKey,
        async () => {
          // 기본 쿼리
          let devicesQuery = query(
            collection(this.db, this.DEVICES_COLLECTION),
            where('organizationId', '==', organizationId)
          );

          // 필터 적용
          if (filters.type) {
            devicesQuery = query(devicesQuery, where('type', '==', filters.type));
          }
          if (filters.status) {
            devicesQuery = query(devicesQuery, where('status', '==', filters.status));
          }
          if (filters.assignedUserId) {
            devicesQuery = query(devicesQuery, where('assignedUserId', '==', filters.assignedUserId));
          }
          if (filters.locationId) {
            devicesQuery = query(devicesQuery, where('locationId', '==', filters.locationId));
          }

          // 전체 데이터 가져오기
          const querySnapshot = await getDocs(devicesQuery);
          
          // 클라이언트 사이드에서 추가 필터링 및 정렬
          const allDevices: Device[] = [];
          for (const doc of querySnapshot.docs) {
            const device = await this.mapDocumentToDevice(doc);
            
            // 클라이언트 사이드 필터 적용
            if (this.applyClientSideFilters(device, filters)) {
              allDevices.push(device);
            }
          }

          // 업데이트 시간 기준 내림차순 정렬
          allDevices.sort((a, b) => {
            const aTime = a.updatedAt instanceof Date ? a.updatedAt.getTime() : 0;
            const bTime = b.updatedAt instanceof Date ? b.updatedAt.getTime() : 0;
            return bTime - aTime;
          });

          // 페이지네이션 적용
          const total = allDevices.length;
          const devices = allDevices.slice(offset, offset + validLimit);

          this.log(`조직 디바이스 ${devices.length}개 조회 성공 (총 ${total}개 중 ${validPage}페이지)`, {
            organizationId,
            filters,
            page: validPage,
            limit: validLimit,
            total
          });

          const result: DeviceListResponse = {
            devices,
            totalCount: total,
            currentPage: validPage,
            totalPages: Math.ceil(total / validLimit),
            hasNext: offset + validLimit < total,
            hasPrevious: validPage > 1
          };

          return result;
        },
        DeviceManagementService.CACHE_TTL.DEVICE_LIST
      );
    });
  }

  /**
   * 특정 디바이스 상세 정보 조회
   * @param deviceId 디바이스 ID
   * @returns 디바이스 정보
   */
  async getDevice(deviceId: string): Promise<Device> {
    return this.measureAndLog('getDevice', async () => {
      this.validateId(deviceId, '디바이스 ID');

      return this.withCache(
        DeviceManagementService.CACHE_KEYS.DEVICE_DETAIL(deviceId),
        async () => {
          const deviceDoc = await getDoc(doc(this.db, this.DEVICES_COLLECTION, deviceId));
          
          if (!deviceDoc.exists()) {
            this.handleError(
              new Error('디바이스를 찾을 수 없습니다.'),
              'getDevice',
              { deviceId, code: ErrorCodes.DEVICE_NOT_FOUND }
            );
          }

          const device = await this.mapDocumentToDevice(deviceDoc);
          
          this.logDatabaseOperation('get', this.DEVICES_COLLECTION, deviceId, true);
          return device;
        },
        DeviceManagementService.CACHE_TTL.DEVICE_DETAIL,
        [`device:${deviceId}`]
      );
    });
  }

  /**
   * 새 디바이스 등록
   * @param createRequest 디바이스 생성 요청
   * @param createdBy 생성자 ID
   * @returns 생성된 디바이스 정보
   */
  async createDevice(
    createRequest: CreateDeviceRequest,
    createdBy: string
  ): Promise<Device> {
    return this.measureAndLog('createDevice', async () => {
      this.validateRequired(createRequest.serialNumber, '시리얼 번호');
      this.validateRequired(createRequest.name, '디바이스 이름');
      this.validateId(createRequest.organizationId, '조직 ID');
      this.validateId(createdBy, '생성자 ID');

      // 시리얼 번호 중복 확인
      await this.validateUniqueSerialNumber(createRequest.serialNumber, createRequest.organizationId);

      const now = this.now();
      const deviceData: Omit<Device, 'id'> = {
        organizationId: createRequest.organizationId,
        serialNumber: createRequest.serialNumber,
        name: createRequest.name,
        model: createRequest.model,
        type: createRequest.type,
        manufacturer: createRequest.manufacturer,
        firmwareVersion: createRequest.firmwareVersion || '1.0.0',
        batteryLevel: 100, // 초기 배터리 레벨
        signalStrength: 'medium',
        status: 'offline', // 초기 상태
        assignedUserId: createRequest.assignedUserId,
        assignedUserName: createRequest.assignedUserId ? await this.getUserName(createRequest.assignedUserId) : undefined,
        assignedLocation: createRequest.assignedLocation,
        locationId: createRequest.locationId,
        lastSyncAt: undefined,
        lastDataReceived: undefined,
        pairedAt: undefined,
        maintenanceScheduledAt: undefined,
        calibrationDate: now.toDate(),
        warrantyExpiresAt: undefined,
        isActive: true,
        isCalibrated: true,
        isPaired: false,
        configuration: {
          ...this.getDefaultDeviceConfiguration(),
          ...createRequest.configuration
        },
        metadata: {
          ...createRequest.metadata,
          purchaseDate: new Date()
        },
        createdAt: now.toDate(),
        updatedAt: now.toDate(),
        createdBy
      };

      const docRef = doc(collection(this.db, this.DEVICES_COLLECTION));
      await setDoc(docRef, {
        ...deviceData,
        createdAt: now,
        updatedAt: now,
        calibrationDate: now
      });

      // 할당이 있는 경우 할당 기록 생성
      if (createRequest.assignedUserId) {
        await this.createAssignmentRecord(docRef.id, createRequest.assignedUserId, createdBy);
      }

      // 활동 로그 생성
      await this.createActivityLog(
        docRef.id,
        'assigned',
        `디바이스 생성 및 등록`,
        createdBy
      );

      // 캐시 무효화
      this.clearCachePattern(`devices:list:${createRequest.organizationId}`);

      this.log('디바이스 생성 완료', {
        deviceId: docRef.id,
        serialNumber: createRequest.serialNumber,
        organizationId: createRequest.organizationId
      });

      return { ...deviceData, id: docRef.id };
    });
  }

  /**
   * 디바이스 정보 업데이트
   * @param deviceId 디바이스 ID
   * @param updateData 업데이트할 데이터
   * @param updatedBy 업데이트 수행자 ID
   * @returns void
   */
  async updateDevice(
    deviceId: string,
    updateData: UpdateDeviceRequest,
    updatedBy: string
  ): Promise<void> {
    return this.measureAndLog('updateDevice', async () => {
      this.validateId(deviceId, '디바이스 ID');
      this.validateId(updatedBy, '업데이트 수행자 ID');

      return runTransaction(this.db, async (transaction) => {
        // 현재 디바이스 정보 조회
        const deviceRef = doc(this.db, this.DEVICES_COLLECTION, deviceId);
        const deviceDoc = await transaction.get(deviceRef);

        if (!deviceDoc.exists()) {
          this.handleError(
            new Error('디바이스를 찾을 수 없습니다.'),
            'updateDevice',
            { deviceId }
          );
        }

        const currentDevice = deviceDoc.data() as Device;

        // 업데이트 데이터 준비
        const updatePayload: any = {
          ...updateData,
          updatedAt: this.now()
        };

        // 사용자 할당 변경 처리
        if (updateData.assignedUserId !== undefined) {
          if (updateData.assignedUserId !== currentDevice.assignedUserId) {
            // 할당 변경 로직
            if (updateData.assignedUserId) {
              updatePayload.assignedUserName = await this.getUserName(updateData.assignedUserId);
              updatePayload.pairedAt = this.now();
              updatePayload.isPaired = true;
              
              // 새 할당 기록 생성
              await this.createAssignmentRecord(deviceId, updateData.assignedUserId, updatedBy);
            } else {
              // 할당 해제
              updatePayload.assignedUserName = null;
              updatePayload.pairedAt = null;
              updatePayload.isPaired = false;
            }
          }
        }

        // 업데이트 실행
        transaction.update(deviceRef, updatePayload);

        // 활동 로그 생성
        await this.createActivityLog(
          deviceId,
          updateData.assignedUserId ? 'assigned' : 'unassigned',
          `디바이스 정보 업데이트`,
          updatedBy,
          updateData
        );

        // 캐시 무효화
        this.clearCache(DeviceManagementService.CACHE_KEYS.DEVICE_DETAIL(deviceId));
        this.clearCachePattern(`devices:list:${currentDevice.organizationId}`);

        this.log('디바이스 업데이트 완료', {
          deviceId,
          changes: Object.keys(updateData),
          updatedBy
        });
      });
    });
  }

  /**
   * 디바이스 상태 업데이트 (실시간 상태 변경)
   * @param deviceId 디바이스 ID
   * @param statusUpdate 상태 업데이트 정보
   * @returns void
   */
  async updateDeviceStatus(
    deviceId: string,
    statusUpdate: DeviceStatusUpdate
  ): Promise<void> {
    return this.measureAndLog('updateDeviceStatus', async () => {
      this.validateId(deviceId, '디바이스 ID');

      const deviceRef = doc(this.db, this.DEVICES_COLLECTION, deviceId);
      const updateData: any = {
        status: statusUpdate.status,
        updatedAt: this.now()
      };

      if (statusUpdate.batteryLevel !== undefined) {
        updateData.batteryLevel = statusUpdate.batteryLevel;
      }
      if (statusUpdate.signalStrength !== undefined) {
        updateData.signalStrength = statusUpdate.signalStrength;
      }
      if (statusUpdate.lastSyncAt !== undefined) {
        updateData.lastSyncAt = this.toTimestamp(statusUpdate.lastSyncAt);
      }
      if (statusUpdate.lastDataReceived !== undefined) {
        updateData.lastDataReceived = this.toTimestamp(statusUpdate.lastDataReceived);
      }

      await updateDoc(deviceRef, updateData);

      // 상태 변경 로그 생성
      await this.createActivityLog(
        deviceId,
        'status_changed',
        `디바이스 상태 변경: ${statusUpdate.status}`,
        'system',
        { previousStatus: statusUpdate.status, ...statusUpdate }
      );

      // 캐시 무효화
      this.clearCache(DeviceManagementService.CACHE_KEYS.DEVICE_DETAIL(deviceId));

      this.log('디바이스 상태 업데이트 완료', {
        deviceId,
        status: statusUpdate.status,
        batteryLevel: statusUpdate.batteryLevel
      });
    });
  }

  /**
   * 디바이스 삭제 (비활성화)
   * @param deviceId 디바이스 ID
   * @param deletedBy 삭제 수행자 ID
   * @returns void
   */
  async deleteDevice(deviceId: string, deletedBy: string): Promise<void> {
    return this.measureAndLog('deleteDevice', async () => {
      this.validateId(deviceId, '디바이스 ID');
      this.validateId(deletedBy, '삭제 수행자 ID');

      const device = await this.getDevice(deviceId);

      // 할당된 사용자가 있으면 할당 해제
      if (device.assignedUserId) {
        await this.updateDevice(deviceId, { assignedUserId: undefined }, deletedBy);
      }

      // 비활성화 (실제 삭제하지 않음)
      await updateDoc(doc(this.db, this.DEVICES_COLLECTION, deviceId), {
        isActive: false,
        status: 'offline',
        updatedAt: this.now()
      });

      // 활동 로그 생성
      await this.createActivityLog(
        deviceId,
        'maintenance',
        `디바이스 비활성화`,
        deletedBy
      );

      // 캐시 무효화
      this.clearCache(DeviceManagementService.CACHE_KEYS.DEVICE_DETAIL(deviceId));
      this.clearCachePattern(`devices:list:${device.organizationId}`);

      this.log('디바이스 삭제 완료', { deviceId, deletedBy });
    });
  }

  // ===== 통계 및 대시보드 =====

  /**
   * 조직 디바이스 통계 조회
   * @param organizationId 조직 ID
   * @returns 디바이스 통계 정보
   */
  async getDeviceStats(organizationId: string): Promise<DeviceStats> {
    return this.measureAndLog('getDeviceStats', async () => {
      this.validateId(organizationId, '조직 ID');

      return this.withCache(
        DeviceManagementService.CACHE_KEYS.DEVICE_STATS(organizationId),
        async () => {
          const devices = await this.getOrganizationDevices(organizationId, {}, 1, 1000);
          const deviceList = devices.devices;

          const stats: DeviceStats = {
            totalDevices: deviceList.length,
            activeDevices: deviceList.filter(d => d.status === 'online').length,
            offlineDevices: deviceList.filter(d => d.status === 'offline').length,
            maintenanceDevices: deviceList.filter(d => d.status === 'maintenance').length,
            errorDevices: deviceList.filter(d => d.status === 'error').length,
            averageBatteryLevel: deviceList.length > 0 ? 
              Math.round(deviceList.reduce((sum, d) => sum + d.batteryLevel, 0) / deviceList.length) : 0,
            devicesNeedingCalibration: deviceList.filter(d => !d.isCalibrated).length,
            devicesNeedingFirmwareUpdate: deviceList.filter(d => this.needsFirmwareUpdate(d)).length,
            totalMeasurements: await this.getTotalMeasurements(organizationId),
            dailyMeasurements: await this.getDailyMeasurements(organizationId),
            weeklyMeasurements: await this.getWeeklyMeasurements(organizationId),
            monthlyMeasurements: await this.getMonthlyMeasurements(organizationId)
          };

          this.log('디바이스 통계 조회 완료', {
            organizationId,
            totalDevices: stats.totalDevices,
            activeDevices: stats.activeDevices
          });

          return stats;
        },
        DeviceManagementService.CACHE_TTL.DEVICE_STATS
      );
    });
  }

  /**
   * 디바이스 대시보드 데이터 조회
   * @param organizationId 조직 ID
   * @returns 대시보드 데이터
   */
  async getDeviceDashboardData(organizationId: string): Promise<DeviceDashboardData> {
    return this.measureAndLog('getDeviceDashboardData', async () => {
      this.validateId(organizationId, '조직 ID');

      const [
        stats,
        recentActivity,
        alertDevices,
        assignmentHistory,
        maintenanceSchedule,
        firmwareUpdates
      ] = await Promise.all([
        this.getDeviceStats(organizationId),
        this.getRecentDeviceActivity(organizationId, 10),
        this.getAlertDevices(organizationId),
        this.getRecentAssignments(organizationId, 5),
        this.getMaintenanceSchedule(organizationId),
        this.getFirmwareUpdateStatus(organizationId)
      ]);

      const dashboardData: DeviceDashboardData = {
        stats,
        recentActivity,
        alertDevices,
        assignmentHistory,
        maintenanceSchedule,
        firmwareUpdates
      };

      this.log('디바이스 대시보드 데이터 조회 완료', {
        organizationId,
        totalDevices: stats.totalDevices,
        alertDevicesCount: alertDevices.length
      });

      return dashboardData;
    });
  }

  // ===== 유틸리티 메서드들 =====

  /**
   * 문서를 Device 객체로 변환
   */
  private async mapDocumentToDevice(doc: QueryDocumentSnapshot | DocumentSnapshot): Promise<Device> {
    const data = doc.data();
    if (!data) {
      throw new Error('디바이스 데이터가 없습니다.');
    }

    return {
      id: doc.id,
      organizationId: data.organizationId,
      serialNumber: data.serialNumber,
      name: data.name,
      model: data.model,
      type: data.type,
      manufacturer: data.manufacturer,
      firmwareVersion: data.firmwareVersion,
      batteryLevel: data.batteryLevel || 0,
      signalStrength: data.signalStrength || 'medium',
      status: data.status || 'offline',
      assignedUserId: data.assignedUserId,
      assignedUserName: data.assignedUserName,
      assignedLocation: data.assignedLocation,
      locationId: data.locationId,
      lastSyncAt: data.lastSyncAt ? this.toDate(data.lastSyncAt) : undefined,
      lastDataReceived: data.lastDataReceived ? this.toDate(data.lastDataReceived) : undefined,
      pairedAt: data.pairedAt ? this.toDate(data.pairedAt) : undefined,
      maintenanceScheduledAt: data.maintenanceScheduledAt ? this.toDate(data.maintenanceScheduledAt) : undefined,
      calibrationDate: data.calibrationDate ? this.toDate(data.calibrationDate) : undefined,
      warrantyExpiresAt: data.warrantyExpiresAt ? this.toDate(data.warrantyExpiresAt) : undefined,
      isActive: data.isActive ?? true,
      isCalibrated: data.isCalibrated ?? true,
      isPaired: data.isPaired ?? false,
      configuration: data.configuration || this.getDefaultDeviceConfiguration(),
      metadata: data.metadata || {},
      createdAt: this.toDate(data.createdAt),
      updatedAt: this.toDate(data.updatedAt),
      createdBy: data.createdBy
    };
  }

  /**
   * 클라이언트 사이드 필터 적용
   */
  private applyClientSideFilters(device: Device, filters: DeviceFilters): boolean {
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const searchFields = [
        device.name,
        device.serialNumber,
        device.model,
        device.manufacturer,
        device.assignedUserName
      ].filter(Boolean).map(field => field!.toLowerCase());

      if (!searchFields.some(field => field.includes(query))) {
        return false;
      }
    }

    if (filters.batteryLevelBelow && device.batteryLevel >= filters.batteryLevelBelow) {
      return false;
    }

    if (filters.needsCalibration && device.isCalibrated) {
      return false;
    }

    if (filters.needsFirmwareUpdate && !this.needsFirmwareUpdate(device)) {
      return false;
    }

    if (filters.lastSyncBefore && device.lastSyncAt && device.lastSyncAt > filters.lastSyncBefore) {
      return false;
    }

    if (filters.lastSyncAfter && device.lastSyncAt && device.lastSyncAt < filters.lastSyncAfter) {
      return false;
    }

    return true;
  }

  /**
   * 기본 디바이스 설정 반환
   */
  private getDefaultDeviceConfiguration(): DeviceConfiguration {
    return {
      samplingRate: 250,
      measurementDuration: 300, // 5분
      autoSync: true,
      lowBatteryThreshold: 20,
      dataRetentionDays: 30,
      notifications: {
        lowBattery: true,
        connectionLost: true,
        calibrationNeeded: true,
        firmwareUpdate: true
      }
    };
  }

  /**
   * 시리얼 번호 중복 확인
   */
  private async validateUniqueSerialNumber(serialNumber: string, organizationId: string): Promise<void> {
    const existingDeviceQuery = query(
      collection(this.db, this.DEVICES_COLLECTION),
      where('serialNumber', '==', serialNumber),
      where('organizationId', '==', organizationId),
      where('isActive', '==', true)
    );

    const existingDeviceSnapshot = await getDocs(existingDeviceQuery);
    if (!existingDeviceSnapshot.empty) {
      this.handleError(
        new Error('이미 등록된 시리얼 번호입니다.'),
        'validateUniqueSerialNumber',
        { serialNumber, organizationId }
      );
    }
  }

  /**
   * 사용자 이름 조회
   */
  private async getUserName(userId: string): Promise<string> {
    try {
      const userDoc = await getDoc(doc(this.db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.displayName || userData.email || '알 수 없는 사용자';
      }
      return '알 수 없는 사용자';
    } catch (error) {
      this.warn('사용자 이름 조회 실패', { userId });
      return '알 수 없는 사용자';
    }
  }

  /**
   * 할당 기록 생성
   */
  private async createAssignmentRecord(
    deviceId: string,
    userId: string,
    assignedBy: string,
    location?: string
  ): Promise<void> {
    const userName = await this.getUserName(userId);
    const assignmentData: Omit<DeviceAssignment, 'id'> = {
      deviceId,
      userId,
      userName,
      assignedAt: new Date(),
      assignedBy,
      location,
      notes: `디바이스가 ${userName}에게 할당되었습니다.`
    };

    await addDoc(collection(this.db, this.DEVICE_ASSIGNMENTS_COLLECTION), {
      ...assignmentData,
      assignedAt: this.toTimestamp(assignmentData.assignedAt)
    });
  }

  /**
   * 활동 로그 생성
   */
  private async createActivityLog(
    deviceId: string,
    action: DeviceActivity['action'],
    description: string,
    performedBy: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const activityData: Omit<DeviceActivity, 'id'> = {
      deviceId,
      action,
      description,
      performedBy,
      performedAt: new Date(),
      metadata
    };

    await addDoc(collection(this.db, this.DEVICE_ACTIVITIES_COLLECTION), {
      ...activityData,
      performedAt: this.toTimestamp(activityData.performedAt)
    });
  }

  /**
   * 펌웨어 업데이트 필요 여부 확인
   */
  private needsFirmwareUpdate(device: Device): boolean {
    // TODO: 실제 펌웨어 버전 비교 로직 구현
    // 현재는 임의의 로직으로 구현
    const currentVersion = device.firmwareVersion;
    const latestVersion = '2.0.0'; // 실제로는 외부 서비스에서 조회
    return currentVersion < latestVersion;
  }

  // TODO: 실제 측정 데이터 서비스와 연동하여 구현
  private async getTotalMeasurements(organizationId: string): Promise<number> {
    return 0; // 임시값
  }

  private async getDailyMeasurements(organizationId: string): Promise<number> {
    return 0; // 임시값
  }

  private async getWeeklyMeasurements(organizationId: string): Promise<number> {
    return 0; // 임시값
  }

  private async getMonthlyMeasurements(organizationId: string): Promise<number> {
    return 0; // 임시값
  }

  private async getRecentDeviceActivity(organizationId: string, limit: number): Promise<DeviceActivity[]> {
    // TODO: 실제 활동 로그 조회 구현
    return []; // 임시값
  }

  private async getAlertDevices(organizationId: string): Promise<Device[]> {
    // TODO: 경고가 필요한 디바이스 조회 구현
    return []; // 임시값
  }

  private async getRecentAssignments(organizationId: string, limit: number): Promise<DeviceAssignment[]> {
    // TODO: 최근 할당 기록 조회 구현
    return []; // 임시값
  }

  private async getMaintenanceSchedule(organizationId: string): Promise<Device[]> {
    // TODO: 유지보수 스케줄 조회 구현
    return []; // 임시값
  }

  private async getFirmwareUpdateStatus(organizationId: string): Promise<DeviceDashboardData['firmwareUpdates']> {
    // TODO: 펌웨어 업데이트 상태 조회 구현
    return []; // 임시값
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const deviceManagementService = new DeviceManagementService();
export default deviceManagementService; 