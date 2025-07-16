/**
 * AI Engine & Viewer Permission Management Service
 * 기업별 AI 엔진과 뷰어 권한 관리를 담당하는 서비스
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
  deleteDoc 
} from 'firebase/firestore';
import { db } from '@core/services/firebase';

// 타입 정의
export interface AIEngine {
  id: string;
  name: string;
  description: string;
  version: string;
  provider: string;
  
  supportedDataTypes: {
    eeg: boolean;
    ppg: boolean;
    acc: boolean;
  };
  
  capabilities: {
    supportedLanguages: string[];
    maxDataDuration: number;
    minDataQuality: number;
    supportedOutputFormats: string[];
    realTimeProcessing: boolean;
  };
  
  pricing: {
    costPerAnalysis: number;
    tier: 'basic' | 'premium' | 'enterprise';
    billingType: 'per_analysis' | 'monthly' | 'yearly';
  };
  
  compatibleViewers: string[];
  status: 'active' | 'deprecated' | 'maintenance';
  isPublic: boolean;
  
  specializations: string[];
  targetAudience: string[];
  
  limitations: {
    maxConcurrentAnalyses: number;
    rateLimitPerMinute: number;
  };
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ReportViewer {
  id: string;
  name: string;
  description: string;
  version: string;
  type: 'web' | 'pdf' | 'mobile' | 'api';
  
  compatibleEngines: string[];
  supportedFormats: string[];
  
  features: {
    interactive: boolean;
    exportable: boolean;
    shareable: boolean;
    customizable: boolean;
    realTimeUpdate: boolean;
  };
  
  pricing: {
    costPerView: number;
    tier: 'basic' | 'premium' | 'enterprise';
    billingType: 'free' | 'per_view' | 'monthly';
  };
  
  status: 'active' | 'deprecated' | 'maintenance';
  isPublic: boolean;
  
  uiConfig: {
    theme: string;
    layout: string;
    customCss?: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationPermission {
  id: string;
  organizationId: string;
  
  allowedEngines: Array<{
    engineId: string;
    enabled: boolean;
    customPricing?: {
      costPerAnalysis: number;
      billingType: string;
    };
    limitations?: {
      maxAnalysesPerMonth: number;
      maxConcurrentAnalyses: number;
    };
    grantedAt: Date;
    grantedBy: string;
    reason?: string;
  }>;
  
  allowedViewers: Array<{
    viewerId: string;
    enabled: boolean;
    customizations?: {
      brandingEnabled: boolean;
      logoUrl?: string;
      customTheme?: string;
    };
  }>;
  
  createdAt: Date;
  updatedAt: Date;
  lastModifiedBy: string;
}

export interface EngineViewerCompatibility {
  id: string;
  engineId: string;
  viewerId: string;
  
  compatibility: {
    fullyCompatible: boolean;
    requiredEngineVersion: string;
    requiredViewerVersion: string;
    deprecationDate?: Date;
  };
  
  mappingConfig: {
    dataFieldMappings: Record<string, string>;
    renderingOptions: {
      chartTypes: string[];
      colorScheme: string;
    };
  };
  
  performance: {
    averageRenderTime: number;
    supportedDataSize: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageAnalytics {
  id: string;
  organizationId: string;
  period: string;
  
  engineUsage: Record<string, {
    totalAnalyses: number;
    totalCost: number;
    averageProcessingTime: number;
    successRate: number;
  }>;
  
  viewerUsage: Record<string, {
    totalViews: number;
    totalExports: number;
    averageViewTime: number;
  }>;
  
  createdAt: Date;
}

class AIEnginePermissionService {
  private readonly COLLECTIONS = {
    AI_ENGINES: 'ai_engines',
    REPORT_VIEWERS: 'report_viewers',
    ORGANIZATION_PERMISSIONS: 'organization_ai_permissions',
    ENGINE_VIEWER_COMPATIBILITY: 'engine_viewer_compatibility',
    USAGE_ANALYTICS: 'usage_analytics'
  };

  /**
   * 기업이 사용 가능한 AI 엔진 목록 조회
   */
  async getAvailableEngines(organizationId: string): Promise<AIEngine[]> {
    try {
      // 1. 모든 공개 엔진 조회
      const enginesQuery = query(
        collection(db, this.COLLECTIONS.AI_ENGINES),
        where('status', '==', 'active'),
        orderBy('name')
      );
      
      const enginesSnapshot = await getDocs(enginesQuery);
      const allEngines = enginesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AIEngine[];

      // 2. 기업별 권한 조회
      const permissions = await this.getOrganizationPermissions(organizationId);
      
      if (!permissions) {
        // 권한 설정이 없으면 공개 엔진만 반환
        return allEngines.filter(engine => engine.isPublic);
      }

      // 3. 허용된 엔진만 필터링
      const allowedEngineIds = permissions.allowedEngines
        .filter(permission => permission.enabled)
        .map(permission => permission.engineId);

      const allowedEngines = allEngines.filter(engine => 
        engine.isPublic || allowedEngineIds.includes(engine.id)
      );

             // 4. 커스텀 가격 정보 적용
       return allowedEngines.map(engine => {
         const permission = permissions.allowedEngines.find(p => p.engineId === engine.id);
         if (permission?.customPricing) {
           return {
             ...engine,
             pricing: {
               ...engine.pricing,
               costPerAnalysis: permission.customPricing.costPerAnalysis,
               billingType: permission.customPricing.billingType as 'per_analysis' | 'monthly' | 'yearly'
             }
           };
         }
         return engine;
       });

    } catch (error) {
      console.error('Error fetching available engines:', error);
      throw new Error('AI 엔진 목록을 불러오는데 실패했습니다.');
    }
  }

  /**
   * 기업이 사용 가능한 뷰어 목록 조회
   */
  async getAvailableViewers(organizationId: string, engineId?: string): Promise<ReportViewer[]> {
    try {
      // 1. 모든 공개 뷰어 조회
      let viewersQuery = query(
        collection(db, this.COLLECTIONS.REPORT_VIEWERS),
        where('status', '==', 'active'),
        orderBy('name')
      );

      const viewersSnapshot = await getDocs(viewersQuery);
      let allViewers = viewersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ReportViewer[];

      // 2. 특정 엔진과 호환되는 뷰어만 필터링 (엔진 ID가 제공된 경우)
      if (engineId) {
        allViewers = allViewers.filter(viewer => 
          viewer.compatibleEngines.includes(engineId)
        );
      }

      // 3. 기업별 권한 조회
      const permissions = await this.getOrganizationPermissions(organizationId);
      
      if (!permissions) {
        return allViewers.filter(viewer => viewer.isPublic);
      }

      // 4. 허용된 뷰어만 필터링
      const allowedViewerIds = permissions.allowedViewers
        .filter(permission => permission.enabled)
        .map(permission => permission.viewerId);

      return allViewers.filter(viewer => 
        viewer.isPublic || allowedViewerIds.includes(viewer.id)
      );

    } catch (error) {
      console.error('Error fetching available viewers:', error);
      throw new Error('뷰어 목록을 불러오는데 실패했습니다.');
    }
  }

  /**
   * AI 엔진 사용 권한 확인
   */
  async checkEnginePermission(organizationId: string, engineId: string): Promise<boolean> {
    try {
      // 1. 엔진이 공개 엔진인지 확인
      const engineDoc = await getDoc(doc(db, this.COLLECTIONS.AI_ENGINES, engineId));
      if (!engineDoc.exists()) {
        return false;
      }

      const engine = engineDoc.data() as AIEngine;
      if (engine.isPublic && engine.status === 'active') {
        return true;
      }

      // 2. 기업별 권한 확인
      const permissions = await this.getOrganizationPermissions(organizationId);
      if (!permissions) {
        return false;
      }

      const enginePermission = permissions.allowedEngines.find(
        permission => permission.engineId === engineId
      );

      return enginePermission?.enabled || false;

    } catch (error) {
      console.error('Error checking engine permission:', error);
      return false;
    }
  }

  /**
   * 뷰어 사용 권한 확인
   */
  async checkViewerPermission(organizationId: string, viewerId: string): Promise<boolean> {
    try {
      // 1. 뷰어가 공개 뷰어인지 확인
      const viewerDoc = await getDoc(doc(db, this.COLLECTIONS.REPORT_VIEWERS, viewerId));
      if (!viewerDoc.exists()) {
        return false;
      }

      const viewer = viewerDoc.data() as ReportViewer;
      if (viewer.isPublic && viewer.status === 'active') {
        return true;
      }

      // 2. 기업별 권한 확인
      const permissions = await this.getOrganizationPermissions(organizationId);
      if (!permissions) {
        return false;
      }

      const viewerPermission = permissions.allowedViewers.find(
        permission => permission.viewerId === viewerId
      );

      return viewerPermission?.enabled || false;

    } catch (error) {
      console.error('Error checking viewer permission:', error);
      return false;
    }
  }

  /**
   * 특정 엔진과 호환 가능한 뷰어 조회
   */
  async getCompatibleViewers(engineId: string): Promise<ReportViewer[]> {
    try {
      const compatibilityQuery = query(
        collection(db, this.COLLECTIONS.ENGINE_VIEWER_COMPATIBILITY),
        where('engineId', '==', engineId),
        where('compatibility.fullyCompatible', '==', true)
      );

      const compatibilitySnapshot = await getDocs(compatibilityQuery);
      const compatibleViewerIds = compatibilitySnapshot.docs.map(doc => 
        doc.data().viewerId
      );

      if (compatibleViewerIds.length === 0) {
        return [];
      }

      // 호환 가능한 뷰어들의 상세 정보 조회
      const viewersQuery = query(
        collection(db, this.COLLECTIONS.REPORT_VIEWERS),
        where('status', '==', 'active')
      );

      const viewersSnapshot = await getDocs(viewersQuery);
      const compatibleViewers = viewersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(viewer => compatibleViewerIds.includes(viewer.id)) as ReportViewer[];

      return compatibleViewers;

    } catch (error) {
      console.error('Error fetching compatible viewers:', error);
      throw new Error('호환 가능한 뷰어 목록을 불러오는데 실패했습니다.');
    }
  }

  /**
   * 사용량 제한 확인
   */
  async checkUsageLimit(organizationId: string, engineId: string): Promise<boolean> {
    try {
      const permissions = await this.getOrganizationPermissions(organizationId);
      if (!permissions) {
        return false;
      }

      const enginePermission = permissions.allowedEngines.find(
        permission => permission.engineId === engineId
      );

      if (!enginePermission || !enginePermission.enabled) {
        return false;
      }

      // 사용량 제한이 설정되지 않았으면 허용
      if (!enginePermission.limitations?.maxAnalysesPerMonth) {
        return true;
      }

      // 현재 월 사용량 조회
      const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
      const currentUsage = await this.getCurrentMonthUsage(organizationId, engineId, currentPeriod);

      return currentUsage < enginePermission.limitations.maxAnalysesPerMonth;

    } catch (error) {
      console.error('Error checking usage limit:', error);
      return false;
    }
  }

  /**
   * 사용량 증가
   */
  async incrementUsage(organizationId: string, engineId: string, cost: number = 1): Promise<void> {
    try {
      const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
      const usageDocId = `usage-${currentPeriod}-${organizationId}`;
      
      const usageDocRef = doc(db, this.COLLECTIONS.USAGE_ANALYTICS, usageDocId);
      const usageDoc = await getDoc(usageDocRef);

      if (usageDoc.exists()) {
        // 기존 사용량 업데이트
        const currentData = usageDoc.data() as UsageAnalytics;
        const engineUsage = currentData.engineUsage[engineId] || {
          totalAnalyses: 0,
          totalCost: 0,
          averageProcessingTime: 0,
          successRate: 1
        };

        await updateDoc(usageDocRef, {
          [`engineUsage.${engineId}`]: {
            ...engineUsage,
            totalAnalyses: engineUsage.totalAnalyses + 1,
            totalCost: engineUsage.totalCost + cost
          }
        });
      } else {
        // 새 사용량 문서 생성
        await addDoc(collection(db, this.COLLECTIONS.USAGE_ANALYTICS), {
          organizationId,
          period: currentPeriod,
          engineUsage: {
            [engineId]: {
              totalAnalyses: 1,
              totalCost: cost,
              averageProcessingTime: 0,
              successRate: 1
            }
          },
          viewerUsage: {},
          createdAt: new Date()
        });
      }

    } catch (error) {
      console.error('Error incrementing usage:', error);
      throw new Error('사용량 업데이트에 실패했습니다.');
    }
  }

  /**
   * 기업별 권한 정보 조회 (private method)
   */
  private async getOrganizationPermissions(organizationId: string): Promise<OrganizationPermission | null> {
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
      return null;
    }
  }

  /**
   * 현재 월 사용량 조회 (private method)
   */
  private async getCurrentMonthUsage(organizationId: string, engineId: string, period: string): Promise<number> {
    try {
      const usageQuery = query(
        collection(db, this.COLLECTIONS.USAGE_ANALYTICS),
        where('organizationId', '==', organizationId),
        where('period', '==', period)
      );

      const usageSnapshot = await getDocs(usageQuery);
      if (usageSnapshot.empty) {
        return 0;
      }

      const usageData = usageSnapshot.docs[0].data() as UsageAnalytics;
      return usageData.engineUsage[engineId]?.totalAnalyses || 0;

    } catch (error) {
      console.error('Error fetching current month usage:', error);
      return 0;
    }
  }
}

export default new AIEnginePermissionService(); 