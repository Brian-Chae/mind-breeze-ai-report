/**
 * System Admin Service
 * 시스템 관리자가 AI 엔진과 뷰어 권한을 관리하는 서비스
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy,
  updateDoc,
  addDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  setDoc
} from 'firebase/firestore';
import { db } from '@core/services/firebase';
import { 
  AIEngine, 
  ReportViewer, 
  OrganizationPermission, 
  UsageAnalytics 
} from './AIEnginePermissionService';

export interface PermissionConfig {
  limitations?: {
    maxAnalysesPerMonth: number;
    maxConcurrentAnalyses: number;
  };
  customPricing?: {
    costPerAnalysis: number;
    billingType: 'per_analysis' | 'monthly' | 'yearly';
  };
  reason?: string;
}

export interface SystemAdminLog {
  id: string;
  adminUserId: string;
  action: string;
  targetOrganizationId: string;
  resourceType: string;
  resourceId: string;
  changes: {
    before: any;
    after: any;
  };
  reason?: string;
  timestamp: Date;
}

class SystemAdminService {
  private readonly COLLECTIONS = {
    AI_ENGINES: 'ai_engines',
    REPORT_VIEWERS: 'report_viewers',
    ORGANIZATION_PERMISSIONS: 'organization_ai_permissions',
    ENGINE_VIEWER_COMPATIBILITY: 'engine_viewer_compatibility',
    USAGE_ANALYTICS: 'usage_analytics',
    SYSTEM_ADMIN_LOGS: 'system_admin_logs'
  };

  /**
   * 모든 AI 엔진 목록 조회
   */
  async getAllEngines(): Promise<AIEngine[]> {
    try {
      const enginesQuery = query(
        collection(db, this.COLLECTIONS.AI_ENGINES),
        orderBy('name')
      );

      const enginesSnapshot = await getDocs(enginesQuery);
      return enginesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AIEngine[];

    } catch (error) {
      console.error('Error fetching all engines:', error);
      throw new Error('모든 AI 엔진 목록을 불러오는데 실패했습니다.');
    }
  }

  /**
   * 모든 뷰어 목록 조회
   */
  async getAllViewers(): Promise<ReportViewer[]> {
    try {
      const viewersQuery = query(
        collection(db, this.COLLECTIONS.REPORT_VIEWERS),
        orderBy('name')
      );

      const viewersSnapshot = await getDocs(viewersQuery);
      return viewersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ReportViewer[];

    } catch (error) {
      console.error('Error fetching all viewers:', error);
      throw new Error('모든 뷰어 목록을 불러오는데 실패했습니다.');
    }
  }

  /**
   * 특정 기업의 현재 권한 조회
   */
  async getOrganizationPermissions(organizationId: string): Promise<OrganizationPermission | null> {
    try {
      const permissionsQuery = query(
        collection(db, this.COLLECTIONS.ORGANIZATION_PERMISSIONS),
        where('organizationId', '==', organizationId)
      );

      const permissionsSnapshot = await getDocs(permissionsQuery);
      if (permissionsSnapshot.empty) {
        return null;
      }

      const doc = permissionsSnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as OrganizationPermission;

    } catch (error) {
      console.error('Error fetching organization permissions:', error);
      throw new Error('기업 권한 정보를 불러오는데 실패했습니다.');
    }
  }

  /**
   * 기업에게 AI 엔진 권한 부여
   */
  async grantEngineAccess(
    organizationId: string, 
    engineId: string, 
    config: PermissionConfig,
    adminUserId: string
  ): Promise<void> {
    try {
      // 1. 기존 권한 조회
      let permissions = await this.getOrganizationPermissions(organizationId);
      const currentTime = new Date();

      const newEnginePermission = {
        engineId,
        enabled: true,
        grantedAt: currentTime,
        grantedBy: adminUserId,
        ...config
      };

      if (!permissions) {
        // 새 권한 문서 생성
        const newPermissions: Omit<OrganizationPermission, 'id'> = {
          organizationId,
          allowedEngines: [newEnginePermission],
          allowedViewers: [],
          createdAt: currentTime,
          updatedAt: currentTime,
          lastModifiedBy: adminUserId
        };

        const docRef = await addDoc(collection(db, this.COLLECTIONS.ORGANIZATION_PERMISSIONS), newPermissions);
        
        // 로그 기록
        await this.logAdminAction({
          adminUserId,
          action: 'grant_engine_access',
          targetOrganizationId: organizationId,
          resourceType: 'ai_engine',
          resourceId: engineId,
          changes: {
            before: null,
            after: newEnginePermission
          },
          reason: config.reason
        });

      } else {
        // 기존 권한 업데이트
        const existingIndex = permissions.allowedEngines.findIndex(
          engine => engine.engineId === engineId
        );

        const beforeState = existingIndex >= 0 ? permissions.allowedEngines[existingIndex] : null;

        if (existingIndex >= 0) {
          permissions.allowedEngines[existingIndex] = newEnginePermission;
        } else {
          permissions.allowedEngines.push(newEnginePermission);
        }

        await updateDoc(doc(db, this.COLLECTIONS.ORGANIZATION_PERMISSIONS, permissions.id), {
          allowedEngines: permissions.allowedEngines,
          updatedAt: currentTime,
          lastModifiedBy: adminUserId
        });

        // 로그 기록
        await this.logAdminAction({
          adminUserId,
          action: existingIndex >= 0 ? 'update_engine_access' : 'grant_engine_access',
          targetOrganizationId: organizationId,
          resourceType: 'ai_engine',
          resourceId: engineId,
          changes: {
            before: beforeState,
            after: newEnginePermission
          },
          reason: config.reason
        });
      }

    } catch (error) {
      console.error('Error granting engine access:', error);
      throw new Error('AI 엔진 권한 부여에 실패했습니다.');
    }
  }

  /**
   * 기업의 AI 엔진 권한 해제
   */
  async revokeEngineAccess(
    organizationId: string, 
    engineId: string, 
    adminUserId: string,
    reason?: string
  ): Promise<void> {
    try {
      const permissions = await this.getOrganizationPermissions(organizationId);
      if (!permissions) {
        throw new Error('해당 기업의 권한 정보가 없습니다.');
      }

      const engineIndex = permissions.allowedEngines.findIndex(
        engine => engine.engineId === engineId
      );

      if (engineIndex === -1) {
        throw new Error('해당 엔진에 대한 권한이 없습니다.');
      }

      const beforeState = permissions.allowedEngines[engineIndex];
      permissions.allowedEngines.splice(engineIndex, 1);

      await updateDoc(doc(db, this.COLLECTIONS.ORGANIZATION_PERMISSIONS, permissions.id), {
        allowedEngines: permissions.allowedEngines,
        updatedAt: new Date(),
        lastModifiedBy: adminUserId
      });

      // 로그 기록
      await this.logAdminAction({
        adminUserId,
        action: 'revoke_engine_access',
        targetOrganizationId: organizationId,
        resourceType: 'ai_engine',
        resourceId: engineId,
        changes: {
          before: beforeState,
          after: null
        },
        reason
      });

    } catch (error) {
      console.error('Error revoking engine access:', error);
      throw new Error('AI 엔진 권한 해제에 실패했습니다.');
    }
  }

  /**
   * 기업에게 뷰어 권한 부여
   */
  async grantViewerAccess(
    organizationId: string, 
    viewerId: string, 
    customizations: any,
    adminUserId: string,
    reason?: string
  ): Promise<void> {
    try {
      let permissions = await this.getOrganizationPermissions(organizationId);
      const currentTime = new Date();

      const newViewerPermission = {
        viewerId,
        enabled: true,
        customizations
      };

      if (!permissions) {
        // 새 권한 문서 생성
        const newPermissions: Omit<OrganizationPermission, 'id'> = {
          organizationId,
          allowedEngines: [],
          allowedViewers: [newViewerPermission],
          createdAt: currentTime,
          updatedAt: currentTime,
          lastModifiedBy: adminUserId
        };

        await addDoc(collection(db, this.COLLECTIONS.ORGANIZATION_PERMISSIONS), newPermissions);
      } else {
        // 기존 권한 업데이트
        const existingIndex = permissions.allowedViewers.findIndex(
          viewer => viewer.viewerId === viewerId
        );

        if (existingIndex >= 0) {
          permissions.allowedViewers[existingIndex] = newViewerPermission;
        } else {
          permissions.allowedViewers.push(newViewerPermission);
        }

        await updateDoc(doc(db, this.COLLECTIONS.ORGANIZATION_PERMISSIONS, permissions.id), {
          allowedViewers: permissions.allowedViewers,
          updatedAt: currentTime,
          lastModifiedBy: adminUserId
        });
      }

      // 로그 기록
      await this.logAdminAction({
        adminUserId,
        action: 'grant_viewer_access',
        targetOrganizationId: organizationId,
        resourceType: 'viewer',
        resourceId: viewerId,
        changes: {
          before: null,
          after: newViewerPermission
        },
        reason
      });

    } catch (error) {
      console.error('Error granting viewer access:', error);
      throw new Error('뷰어 권한 부여에 실패했습니다.');
    }
  }

  /**
   * 기업별 사용량 분석 조회
   */
  async getUsageAnalytics(organizationId: string, period?: string): Promise<UsageAnalytics[]> {
    try {
      let usageQuery = query(
        collection(db, this.COLLECTIONS.USAGE_ANALYTICS),
        where('organizationId', '==', organizationId),
        orderBy('period', 'desc')
      );

      if (period) {
        usageQuery = query(
          collection(db, this.COLLECTIONS.USAGE_ANALYTICS),
          where('organizationId', '==', organizationId),
          where('period', '==', period)
        );
      }

      const usageSnapshot = await getDocs(usageQuery);
      return usageSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UsageAnalytics[];

    } catch (error) {
      console.error('Error fetching usage analytics:', error);
      throw new Error('사용량 분석 데이터를 불러오는데 실패했습니다.');
    }
  }

  /**
   * 모든 기업의 사용량 요약 조회
   */
  async getAllOrganizationsUsage(period: string): Promise<Record<string, UsageAnalytics>> {
    try {
      const usageQuery = query(
        collection(db, this.COLLECTIONS.USAGE_ANALYTICS),
        where('period', '==', period)
      );

      const usageSnapshot = await getDocs(usageQuery);
      const usageByOrg: Record<string, UsageAnalytics> = {};

      usageSnapshot.docs.forEach(doc => {
        const data = doc.data() as UsageAnalytics;
        usageByOrg[data.organizationId] = { ...data, id: doc.id };
      });

      return usageByOrg;

    } catch (error) {
      console.error('Error fetching all organizations usage:', error);
      throw new Error('전체 기업 사용량 데이터를 불러오는데 실패했습니다.');
    }
  }

  /**
   * AI 엔진 추가/업데이트
   */
  async upsertEngine(engineData: Omit<AIEngine, 'id'>, adminUserId: string): Promise<string> {
    try {
      const engineRef = doc(collection(db, this.COLLECTIONS.AI_ENGINES));
      await setDoc(engineRef, {
        ...engineData,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: adminUserId
      });

      // 로그 기록
      await this.logAdminAction({
        adminUserId,
        action: 'create_engine',
        targetOrganizationId: 'system',
        resourceType: 'ai_engine',
        resourceId: engineRef.id,
        changes: {
          before: null,
          after: engineData
        }
      });

      return engineRef.id;

    } catch (error) {
      console.error('Error upserting engine:', error);
      throw new Error('AI 엔진 생성/업데이트에 실패했습니다.');
    }
  }

  /**
   * 뷰어 추가/업데이트
   */
  async upsertViewer(viewerData: Omit<ReportViewer, 'id'>, adminUserId: string): Promise<string> {
    try {
      const viewerRef = doc(collection(db, this.COLLECTIONS.REPORT_VIEWERS));
      await setDoc(viewerRef, {
        ...viewerData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // 로그 기록
      await this.logAdminAction({
        adminUserId,
        action: 'create_viewer',
        targetOrganizationId: 'system',
        resourceType: 'viewer',
        resourceId: viewerRef.id,
        changes: {
          before: null,
          after: viewerData
        }
      });

      return viewerRef.id;

    } catch (error) {
      console.error('Error upserting viewer:', error);
      throw new Error('뷰어 생성/업데이트에 실패했습니다.');
    }
  }

  /**
   * 시스템 관리자 액션 로그 기록
   */
  private async logAdminAction(logData: Omit<SystemAdminLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      await addDoc(collection(db, this.COLLECTIONS.SYSTEM_ADMIN_LOGS), {
        ...logData,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error logging admin action:', error);
      // 로그 실패는 전체 작업을 중단시키지 않음
    }
  }

  /**
   * 시스템 관리자 로그 조회
   */
  async getAdminLogs(
    filters?: {
      adminUserId?: string;
      organizationId?: string;
      action?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<SystemAdminLog[]> {
    try {
      let logsQuery = query(
        collection(db, this.COLLECTIONS.SYSTEM_ADMIN_LOGS),
        orderBy('timestamp', 'desc')
      );

      // 필터 적용 로직은 복잡하므로 기본 쿼리만 구현
      const logsSnapshot = await getDocs(logsQuery);
      return logsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SystemAdminLog[];

    } catch (error) {
      console.error('Error fetching admin logs:', error);
      throw new Error('관리자 로그를 불러오는데 실패했습니다.');
    }
  }

  /**
   * 시스템 통계 조회
   */
  async getSystemStats(): Promise<{
    totalEngines: number;
    totalViewers: number;
    totalOrganizations: number;
    activeEngines: number;
    activeViewers: number;
  }> {
    try {
      const [engines, viewers, permissions] = await Promise.all([
        this.getAllEngines(),
        this.getAllViewers(),
        this.getAllOrganizationPermissions()
      ]);

      return {
        totalEngines: engines.length,
        totalViewers: viewers.length,
        totalOrganizations: permissions.length,
        activeEngines: engines.filter(e => e.status === 'active').length,
        activeViewers: viewers.filter(v => v.status === 'active').length
      };

    } catch (error) {
      console.error('Error fetching system stats:', error);
      throw new Error('시스템 통계를 불러오는데 실패했습니다.');
    }
  }

  /**
   * 모든 기업의 권한 정보 조회
   */
  private async getAllOrganizationPermissions(): Promise<OrganizationPermission[]> {
    try {
      const permissionsSnapshot = await getDocs(collection(db, this.COLLECTIONS.ORGANIZATION_PERMISSIONS));
      return permissionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as OrganizationPermission[];

    } catch (error) {
      console.error('Error fetching all organization permissions:', error);
      return [];
    }
  }
}

export default new SystemAdminService(); 