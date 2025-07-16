/**
 * 커스텀 렌더러 관리 서비스
 * B2B 고객을 위한 조직별 전용 렌더러 등록, 관리, 비용 책정 시스템
 * 예: KAIST 전용 리포트, 삼성전자 브랜딩 렌더러 등
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '@core/services/firebase';

/**
 * 커스텀 렌더러 정보 타입
 */
export interface CustomRenderer {
  id: string;
  organizationId: string;
  organizationName: string;
  
  // 렌더러 기본 정보
  rendererId: string;
  name: string;
  description: string;
  version: string;
  
  // 기술적 사양
  outputFormat: 'web' | 'pdf' | 'email' | 'mobile';
  supportedEngines: string[];
  templateUrl?: string; // 커스텀 템플릿 URL
  brandingAssets?: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    headerTemplate?: string;
    footerTemplate?: string;
  };
  
  // 비즈니스 모델
  accessLevel: 'private' | 'shared' | 'public';
  creditCostPerRender: number;
  subscriptionTier: 'basic' | 'premium' | 'enterprise';
  
  // 사용 제한
  maxRendersPerMonth?: number;
  allowedDataTypes: string[];
  securityLevel: 'standard' | 'high' | 'enterprise';
  
  // 메타데이터
  status: 'active' | 'pending' | 'deprecated' | 'maintenance';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  usageCount: number;
  lastUsed?: Date;
  
  // 승인 및 검토
  approvalStatus: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
  notes?: string;
}

/**
 * 렌더러 접근 권한 정보
 */
export interface RendererAccess {
  id: string;
  rendererId: string;
  organizationId: string;
  userId?: string; // 특정 사용자 제한
  
  accessType: 'owner' | 'licensed' | 'trial' | 'shared';
  validFrom: Date;
  validUntil?: Date;
  
  usageLimit?: number;
  usageCount: number;
  costPerRender: number;
  
  permissions: {
    canView: boolean;
    canUse: boolean;
    canModify: boolean;
    canShare: boolean;
  };
  
  createdAt: Date;
  lastAccessed?: Date;
}

/**
 * 렌더러 사용 통계
 */
export interface RendererUsageStats {
  rendererId: string;
  organizationId: string;
  period: 'daily' | 'weekly' | 'monthly';
  date: string;
  
  renderCount: number;
  uniqueUsers: number;
  totalCreditsUsed: number;
  averageRenderTime: number;
  
  successRate: number;
  errorCount: number;
  popularDataTypes: string[];
  
  createdAt: Date;
}

class CustomRendererService {
  private readonly COLLECTIONS = {
    CUSTOM_RENDERERS: 'customRenderers',
    RENDERER_ACCESS: 'rendererAccess',
    RENDERER_USAGE_STATS: 'rendererUsageStats',
    RENDERER_TEMPLATES: 'rendererTemplates'
  };

  /**
   * 커스텀 렌더러 등록
   */
  async registerCustomRenderer(rendererData: Omit<CustomRenderer, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'approvalStatus'>): Promise<string> {
    try {
      const rendererId = `custom-${rendererData.organizationId}-${Date.now()}`;
      
      const customRenderer: CustomRenderer = {
        ...rendererData,
        id: rendererId,
        usageCount: 0,
        approvalStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(doc(db, this.COLLECTIONS.CUSTOM_RENDERERS, rendererId), customRenderer);
      
      // 오너 접근 권한 생성
      await this.grantRendererAccess({
        rendererId,
        organizationId: rendererData.organizationId,
        accessType: 'owner',
        validFrom: new Date(),
        usageCount: 0,
        costPerRender: rendererData.creditCostPerRender,
        permissions: {
          canView: true,
          canUse: true,
          canModify: true,
          canShare: true
        }
      });

      console.log(`✅ 커스텀 렌더러 등록 완료: ${rendererId}`);
      return rendererId;

    } catch (error) {
      console.error('❌ 커스텀 렌더러 등록 실패:', error);
      throw new Error('커스텀 렌더러 등록에 실패했습니다.');
    }
  }

  /**
   * 조직의 커스텀 렌더러 목록 조회
   */
  async getOrganizationRenderers(organizationId: string): Promise<CustomRenderer[]> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.CUSTOM_RENDERERS),
        where('organizationId', '==', organizationId),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastUsed: doc.data().lastUsed?.toDate()
      })) as CustomRenderer[];

    } catch (error) {
      console.error('❌ 조직 렌더러 조회 실패:', error);
      throw new Error('조직의 렌더러 목록을 불러오는데 실패했습니다.');
    }
  }

  /**
   * 조직이 접근 가능한 모든 렌더러 조회 (자체 + 공유받은)
   */
  async getAccessibleRenderers(organizationId: string): Promise<CustomRenderer[]> {
    try {
      // 1. 접근 권한이 있는 렌더러 ID 조회
      const accessQuery = query(
        collection(db, this.COLLECTIONS.RENDERER_ACCESS),
        where('organizationId', '==', organizationId)
      );

      const accessSnapshot = await getDocs(accessQuery);
      const accessibleRendererIds = accessSnapshot.docs.map(doc => doc.data().rendererId);

      if (accessibleRendererIds.length === 0) {
        return [];
      }

      // 2. 렌더러 상세 정보 조회
      const renderersQuery = query(
        collection(db, this.COLLECTIONS.CUSTOM_RENDERERS),
        where('status', '==', 'active')
      );

      const renderersSnapshot = await getDocs(renderersQuery);
      const accessibleRenderers = renderersSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          lastUsed: doc.data().lastUsed?.toDate()
        }))
        .filter(renderer => accessibleRendererIds.includes(renderer.id)) as CustomRenderer[];

      return accessibleRenderers;

    } catch (error) {
      console.error('❌ 접근 가능한 렌더러 조회 실패:', error);
      throw new Error('접근 가능한 렌더러 목록을 불러오는데 실패했습니다.');
    }
  }

  /**
   * 렌더러 접근 권한 부여
   */
  async grantRendererAccess(accessData: Omit<RendererAccess, 'id' | 'createdAt'>): Promise<string> {
    try {
      const accessId = `access-${accessData.rendererId}-${accessData.organizationId}-${Date.now()}`;
      
      const rendererAccess: RendererAccess = {
        ...accessData,
        id: accessId,
        createdAt: new Date()
      };

      await setDoc(doc(db, this.COLLECTIONS.RENDERER_ACCESS, accessId), rendererAccess);
      
      console.log(`✅ 렌더러 접근 권한 부여: ${accessId}`);
      return accessId;

    } catch (error) {
      console.error('❌ 렌더러 접근 권한 부여 실패:', error);
      throw new Error('렌더러 접근 권한 부여에 실패했습니다.');
    }
  }

  /**
   * 렌더러 사용 기록
   */
  async recordRendererUsage(rendererId: string, organizationId: string, userId: string): Promise<void> {
    try {
      // 1. 렌더러 사용 횟수 증가
      const rendererRef = doc(db, this.COLLECTIONS.CUSTOM_RENDERERS, rendererId);
      await updateDoc(rendererRef, {
        usageCount: (await getDoc(rendererRef)).data()?.usageCount + 1 || 1,
        lastUsed: new Date(),
        updatedAt: new Date()
      });

      // 2. 접근 권한 사용 횟수 증가
      const accessQuery = query(
        collection(db, this.COLLECTIONS.RENDERER_ACCESS),
        where('rendererId', '==', rendererId),
        where('organizationId', '==', organizationId)
      );

      const accessSnapshot = await getDocs(accessQuery);
      if (!accessSnapshot.empty) {
        const accessDoc = accessSnapshot.docs[0];
        await updateDoc(accessDoc.ref, {
          usageCount: (accessDoc.data().usageCount || 0) + 1,
          lastAccessed: new Date()
        });
      }

      // 3. 통계 데이터 업데이트 (일일 기준)
      const today = new Date().toISOString().split('T')[0];
      const statsId = `${rendererId}-${organizationId}-${today}`;
      
      const statsRef = doc(db, this.COLLECTIONS.RENDERER_USAGE_STATS, statsId);
      const statsDoc = await getDoc(statsRef);
      
      if (statsDoc.exists()) {
        const currentStats = statsDoc.data() as RendererUsageStats;
        await updateDoc(statsRef, {
          renderCount: currentStats.renderCount + 1,
          // uniqueUsers는 별도 로직 필요
        });
      } else {
        const newStats: RendererUsageStats = {
          rendererId,
          organizationId,
          period: 'daily',
          date: today,
          renderCount: 1,
          uniqueUsers: 1,
          totalCreditsUsed: 0, // 별도 계산 필요
          averageRenderTime: 0,
          successRate: 100,
          errorCount: 0,
          popularDataTypes: [],
          createdAt: new Date()
        };
        
        await setDoc(statsRef, newStats);
      }

      console.log(`✅ 렌더러 사용 기록 완료: ${rendererId}`);

    } catch (error) {
      console.error('❌ 렌더러 사용 기록 실패:', error);
      throw new Error('렌더러 사용 기록에 실패했습니다.');
    }
  }

  /**
   * 커스텀 렌더러 승인/거부
   */
  async approveRenderer(rendererId: string, reviewerId: string, approved: boolean, notes?: string): Promise<void> {
    try {
      const rendererRef = doc(db, this.COLLECTIONS.CUSTOM_RENDERERS, rendererId);
      
      await updateDoc(rendererRef, {
        approvalStatus: approved ? 'approved' : 'rejected',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        notes: notes || '',
        updatedAt: new Date()
      });

      console.log(`✅ 렌더러 승인 처리 완료: ${rendererId} (${approved ? '승인' : '거부'})`);

    } catch (error) {
      console.error('❌ 렌더러 승인 처리 실패:', error);
      throw new Error('렌더러 승인 처리에 실패했습니다.');
    }
  }

  /**
   * 렌더러 사용 통계 조회
   */
  async getRendererStats(rendererId: string, organizationId: string, period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<RendererUsageStats[]> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.RENDERER_USAGE_STATS),
        where('rendererId', '==', rendererId),
        where('organizationId', '==', organizationId),
        where('period', '==', period),
        orderBy('date', 'desc'),
        limit(30)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      })) as RendererUsageStats[];

    } catch (error) {
      console.error('❌ 렌더러 통계 조회 실패:', error);
      throw new Error('렌더러 사용 통계를 불러오는데 실패했습니다.');
    }
  }

  /**
   * 승인 대기 중인 렌더러 목록 (관리자용)
   */
  async getPendingRenderers(): Promise<CustomRenderer[]> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.CUSTOM_RENDERERS),
        where('approvalStatus', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as CustomRenderer[];

    } catch (error) {
      console.error('❌ 승인 대기 렌더러 조회 실패:', error);
      throw new Error('승인 대기 중인 렌더러 목록을 불러오는데 실패했습니다.');
    }
  }

  /**
   * 렌더러 삭제
   */
  async deleteRenderer(rendererId: string, organizationId: string): Promise<void> {
    try {
      // 1. 렌더러 삭제
      await deleteDoc(doc(db, this.COLLECTIONS.CUSTOM_RENDERERS, rendererId));
      
      // 2. 관련 접근 권한 삭제
      const accessQuery = query(
        collection(db, this.COLLECTIONS.RENDERER_ACCESS),
        where('rendererId', '==', rendererId)
      );
      
      const accessSnapshot = await getDocs(accessQuery);
      const deletePromises = accessSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      console.log(`✅ 렌더러 삭제 완료: ${rendererId}`);

    } catch (error) {
      console.error('❌ 렌더러 삭제 실패:', error);
      throw new Error('렌더러 삭제에 실패했습니다.');
    }
  }
}

// 싱글톤 인스턴스 생성
const customRendererService = new CustomRendererService();
export default customRendererService; 