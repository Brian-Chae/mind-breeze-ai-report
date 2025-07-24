import { BaseService } from '@core/services/BaseService';
import { db } from '@core/services/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit 
} from 'firebase/firestore';

export interface SystemDeviceOverview {
  totalDevices: number;
  availableDevices: number;
  allocatedDevices: number;
  inUseDevices: number;
  maintenanceDevices: number;
  retiredDevices: number;
  devicesByType: Array<{
    type: string;
    count: number;
    available: number;
    allocated: number;
  }>;
  allocationsByOrganization: Array<{
    organizationId: string;
    organizationName: string;
    allocatedCount: number;
    inUseCount: number;
  }>;
  utilizationRate: number; // 0-100
  maintenanceScheduled: number;
  averageDeviceAge: number; // months
}

export interface OrganizationDeviceBreakdown {
  organizationId: string;
  organizationName: string;
  totalAllocated: number;
  currentlyInUse: number;
  availableForUse: number;
  maintenanceRequired: number;
  devicesByType: Array<{
    type: string;
    allocated: number;
    inUse: number;
    available: number;
  }>;
  usageHistory: Array<{
    date: Date;
    devicesUsed: number;
    utilizationRate: number;
  }>;
  topUsers: Array<{
    userId: string;
    userName: string;
    devicesUsed: number;
    lastUsed: Date;
  }>;
}

export interface DeviceUsageAnalytics {
  organizationId: string;
  timeRange: 'week' | 'month' | 'quarter';
  totalSessions: number;
  averageSessionDuration: number;
  mostUsedDevices: Array<{
    deviceId: string;
    deviceModel: string;
    sessionsCount: number;
    totalHours: number;
  }>;
  usageTrends: Array<{
    date: Date;
    sessionsCount: number;
    totalHours: number;
    uniqueUsers: number;
  }>;
  peakUsageHours: Array<{
    hour: number;
    sessionsCount: number;
  }>;
  deviceReliability: Array<{
    deviceId: string;
    deviceModel: string;
    successRate: number; // 0-100
    errorCount: number;
  }>;
}

export interface DeviceManagementAction {
  type: 'assign' | 'unassign' | 'retire' | 'maintenance' | 'repair';
  deviceId: string;
  organizationId?: string;
  userId?: string;
  reason?: string;
  scheduledDate?: Date;
}

export interface DeviceUsageStatusItem {
  deviceId: string;
  deviceModel: string;
  deviceType: string;
  status: 'available' | 'allocated' | 'in_use' | 'maintenance' | 'retired';
  organizationId?: string;
  organizationName?: string;
  currentUserId?: string;
  currentUserName?: string;
  lastUsed: Date;
  totalUsageHours: number;
  reliabilityScore: number; // 0-100
  maintenanceScheduled?: Date;
}

export interface RentalStatistics {
  totalActiveRentals: number;
  totalRentalRevenue: number;
  monthlyRentalRevenue: number;
  averageRentalDuration: number; // days
  topRentingOrganizations: Array<{
    organizationId: string;
    organizationName: string;
    activeRentals: number;
    totalRevenue: number;
  }>;
  rentalsByType: Array<{
    deviceType: string;
    activeCount: number;
    totalRevenue: number;
  }>;
  upcomingReturns: Array<{
    deviceId: string;
    organizationId: string;
    returnDate: Date;
    penaltyAmount: number;
  }>;
}

export interface ScheduledReturn {
  deviceId: string;
  deviceModel: string;
  organizationId: string;
  organizationName: string;
  rentalStartDate: Date;
  scheduledReturnDate: Date;
  isOverdue: boolean;
  daysPastDue: number;
  penaltyAmount: number;
  contactEmail: string;
  lastReminderSent?: Date;
}

/**
 * 시스템 디바이스 관리 전담 서비스
 * SystemAdminService에서 분리된 디바이스 관련 기능
 */
export class SystemDeviceManagementService extends BaseService {
  private static instance: SystemDeviceManagementService | null = null;

  constructor() {
    super();
  }

  static getInstance(): SystemDeviceManagementService {
    if (!SystemDeviceManagementService.instance) {
      SystemDeviceManagementService.instance = new SystemDeviceManagementService();
    }
    return SystemDeviceManagementService.instance;
  }

  /**
   * 시스템 전체 디바이스 개요
   */
  async getSystemDeviceOverview(): Promise<SystemDeviceOverview> {
    try {

      // TODO: PRODUCTION ISSUE - Firebase 쿼리 문제 해결 후 실제 데이터 반환 구현 필요
      if (import.meta.env.DEV) {
      }

      // Mock 데이터 - 실제 구현 시 Firebase 쿼리로 교체 필요
      return {
        totalDevices: 450,
        availableDevices: 123,
        allocatedDevices: 287,
        inUseDevices: 156,
        maintenanceDevices: 28,
        retiredDevices: 12,
        devicesByType: [
          { type: 'EEG', count: 200, available: 65, allocated: 120 },
          { type: 'PPG', count: 150, available: 38, allocated: 97 },
          { type: 'Combined', count: 100, available: 20, allocated: 70 }
        ],
        allocationsByOrganization: [
          { organizationId: 'org1', organizationName: '조직 1', allocatedCount: 45, inUseCount: 23 },
          { organizationId: 'org2', organizationName: '조직 2', allocatedCount: 38, inUseCount: 19 },
          { organizationId: 'org3', organizationName: '조직 3', allocatedCount: 32, inUseCount: 16 }
        ],
        utilizationRate: 68.5,
        maintenanceScheduled: 15,
        averageDeviceAge: 18.2
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * 조직별 디바이스 상세 분석
   */
  async getOrganizationDeviceBreakdown(organizationId: string): Promise<OrganizationDeviceBreakdown> {
    try {

      // TODO: PRODUCTION ISSUE - Firebase 쿼리 문제 해결 후 실제 데이터 반환 구현 필요
      if (import.meta.env.DEV) {
      }

      // Mock 데이터 - 실제 구현 시 Firebase 쿼리로 교체 필요
      return {
        organizationId,
        organizationName: `조직 ${organizationId}`,
        totalAllocated: 45,
        currentlyInUse: 23,
        availableForUse: 22,
        maintenanceRequired: 3,
        devicesByType: [
          { type: 'EEG', allocated: 20, inUse: 12, available: 8 },
          { type: 'PPG', allocated: 15, inUse: 7, available: 8 },
          { type: 'Combined', allocated: 10, inUse: 4, available: 6 }
        ],
        usageHistory: Array.from({ length: 30 }, (_, index) => ({
          date: new Date(Date.now() - (29 - index) * 86400000),
          devicesUsed: Math.floor(Math.random() * 10) + 15,
          utilizationRate: Math.floor(Math.random() * 30) + 50
        })),
        topUsers: [
          { userId: 'user1', userName: '사용자 1', devicesUsed: 8, lastUsed: new Date(Date.now() - 3600000) },
          { userId: 'user2', userName: '사용자 2', devicesUsed: 6, lastUsed: new Date(Date.now() - 7200000) },
          { userId: 'user3', userName: '사용자 3', devicesUsed: 5, lastUsed: new Date(Date.now() - 10800000) }
        ]
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * 디바이스 사용량 분석
   */
  async getDeviceUsageAnalytics(organizationId: string, timeRange: 'week' | 'month' | 'quarter' = 'month'): Promise<DeviceUsageAnalytics> {
    try {

      // TODO: PRODUCTION ISSUE - Firebase 쿼리 문제 해결 후 실제 데이터 반환 구현 필요
      if (import.meta.env.DEV) {
      }

      const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;

      // Mock 데이터 - 실제 구현 시 Firebase 쿼리로 교체 필요
      return {
        organizationId,
        timeRange,
        totalSessions: 234,
        averageSessionDuration: 45.5,
        mostUsedDevices: [
          { deviceId: 'dev1', deviceModel: 'EEG Pro', sessionsCount: 45, totalHours: 38.5 },
          { deviceId: 'dev2', deviceModel: 'PPG Advanced', sessionsCount: 38, totalHours: 32.1 },
          { deviceId: 'dev3', deviceModel: 'Combined Plus', sessionsCount: 29, totalHours: 24.8 }
        ],
        usageTrends: Array.from({ length: days }, (_, index) => ({
          date: new Date(Date.now() - (days - 1 - index) * 86400000),
          sessionsCount: Math.floor(Math.random() * 15) + 5,
          totalHours: Math.floor(Math.random() * 25) + 10,
          uniqueUsers: Math.floor(Math.random() * 8) + 3
        })),
        peakUsageHours: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          sessionsCount: Math.floor(Math.random() * 10) + (hour >= 9 && hour <= 17 ? 5 : 1)
        })),
        deviceReliability: [
          { deviceId: 'dev1', deviceModel: 'EEG Pro', successRate: 95.2, errorCount: 3 },
          { deviceId: 'dev2', deviceModel: 'PPG Advanced', successRate: 92.8, errorCount: 5 },
          { deviceId: 'dev3', deviceModel: 'Combined Plus', successRate: 97.1, errorCount: 2 }
        ]
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * 디바이스 관리 액션 실행
   */
  async executeDeviceManagementAction(action: DeviceManagementAction): Promise<boolean> {
    try {

      // TODO: PRODUCTION ISSUE - Firebase 업데이트 로직 구현 필요
      if (import.meta.env.DEV) {
      }

      // Mock 처리 - 실제 구현 시 Firebase 업데이트 로직으로 교체 필요
      await new Promise(resolve => setTimeout(resolve, 1000)); // 네트워크 지연 시뮬레이션

      return true;

    } catch (error) {
      return false;
    }
  }

  /**
   * 디바이스 사용 상태 목록 조회
   */
  async getDeviceUsageStatusList(): Promise<DeviceUsageStatusItem[]> {
    try {

      // TODO: PRODUCTION ISSUE - Firebase 쿼리 문제 해결 후 실제 데이터 반환 구현 필요
      if (import.meta.env.DEV) {
      }

      // Mock 데이터 - 실제 구현 시 Firebase 쿼리로 교체 필요
      return Array.from({ length: 20 }, (_, index) => ({
        deviceId: `device-${index + 1}`,
        deviceModel: `${['EEG Pro', 'PPG Advanced', 'Combined Plus'][index % 3]}`,
        deviceType: ['EEG', 'PPG', 'Combined'][index % 3],
        status: ['available', 'allocated', 'in_use', 'maintenance'][index % 4] as any,
        organizationId: index % 2 === 0 ? `org-${Math.floor(index / 2) + 1}` : undefined,
        organizationName: index % 2 === 0 ? `조직 ${Math.floor(index / 2) + 1}` : undefined,
        currentUserId: index % 3 === 0 ? `user-${index + 1}` : undefined,
        currentUserName: index % 3 === 0 ? `사용자 ${index + 1}` : undefined,
        lastUsed: new Date(Date.now() - index * 3600000),
        totalUsageHours: 100 + index * 25,
        reliabilityScore: 85 + (index % 15),
        maintenanceScheduled: index % 5 === 0 ? new Date(Date.now() + index * 86400000) : undefined
      }));

    } catch (error) {
      throw error;
    }
  }

  /**
   * 렌탈 통계 조회
   */
  async getRentalStatistics(): Promise<RentalStatistics> {
    try {

      // TODO: PRODUCTION ISSUE - Firebase 쿼리 문제 해결 후 실제 데이터 반환 구현 필요
      if (import.meta.env.DEV) {
      }

      // Mock 데이터 - 실제 구현 시 Firebase 쿼리로 교체 필요
      return {
        totalActiveRentals: 287,
        totalRentalRevenue: 5400000,
        monthlyRentalRevenue: 1200000,
        averageRentalDuration: 45.5,
        topRentingOrganizations: [
          { organizationId: 'org1', organizationName: '조직 1', activeRentals: 45, totalRevenue: 850000 },
          { organizationId: 'org2', organizationName: '조직 2', activeRentals: 38, totalRevenue: 720000 },
          { organizationId: 'org3', organizationName: '조직 3', activeRentals: 32, totalRevenue: 610000 }
        ],
        rentalsByType: [
          { deviceType: 'EEG', activeCount: 120, totalRevenue: 2300000 },
          { deviceType: 'PPG', activeCount: 97, totalRevenue: 1850000 },
          { deviceType: 'Combined', activeCount: 70, totalRevenue: 1250000 }
        ],
        upcomingReturns: [
          { deviceId: 'device-1', organizationId: 'org1', returnDate: new Date(Date.now() + 86400000 * 3), penaltyAmount: 0 },
          { deviceId: 'device-2', organizationId: 'org2', returnDate: new Date(Date.now() + 86400000 * 7), penaltyAmount: 0 },
          { deviceId: 'device-3', organizationId: 'org3', returnDate: new Date(Date.now() - 86400000 * 2), penaltyAmount: 50000 }
        ]
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * 예정된 반납 목록 조회
   */
  async getScheduledReturns(): Promise<ScheduledReturn[]> {
    try {

      // TODO: PRODUCTION ISSUE - Firebase 쿼리 문제 해결 후 실제 데이터 반환 구현 필요
      if (import.meta.env.DEV) {
      }

      const now = new Date();

      // Mock 데이터 - 실제 구현 시 Firebase 쿼리로 교체 필요
      return Array.from({ length: 10 }, (_, index) => {
        const returnDate = new Date(now.getTime() + (index - 5) * 86400000);
        const isOverdue = returnDate < now;
        const daysPastDue = isOverdue ? Math.floor((now.getTime() - returnDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

        return {
          deviceId: `device-${index + 1}`,
          deviceModel: `${['EEG Pro', 'PPG Advanced', 'Combined Plus'][index % 3]}`,
          organizationId: `org-${index + 1}`,
          organizationName: `조직 ${index + 1}`,
          rentalStartDate: new Date(now.getTime() - (30 + index) * 86400000),
          scheduledReturnDate: returnDate,
          isOverdue,
          daysPastDue,
          penaltyAmount: isOverdue ? daysPastDue * 10000 : 0,
          contactEmail: `contact${index + 1}@organization.com`,
          lastReminderSent: isOverdue ? new Date(now.getTime() - 86400000) : undefined
        };
      });

    } catch (error) {
      throw error;
    }
  }

  /**
   * 연체 렌탈 업데이트
   */
  async updateOverdueRentals(): Promise<void> {
    try {

      // TODO: PRODUCTION ISSUE - Firebase 업데이트 로직 구현 필요
      if (import.meta.env.DEV) {
      }

      // Mock 처리 - 실제 구현 시 Firebase 업데이트 로직으로 교체 필요
      await new Promise(resolve => setTimeout(resolve, 2000)); // 네트워크 지연 시뮬레이션


    } catch (error) {
      throw error;
    }
  }
}

// 싱글톤 인스턴스 export
export default SystemDeviceManagementService.getInstance();