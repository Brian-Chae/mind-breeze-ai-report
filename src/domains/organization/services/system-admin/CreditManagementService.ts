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

export interface OrganizationCreditInfo {
  organizationId: string;
  organizationName: string;
  currentBalance: number;
  totalPurchased: number;
  totalUsed: number;
  monthlyUsage: number;
  lastPurchaseDate: Date;
  lastUsageDate: Date;
  averageMonthlyUsage: number;
  projectedDepletion: Date | null; // null if sufficient credits
  status: 'healthy' | 'warning' | 'critical';
  plan: string;
}

export interface CreditManagementAction {
  type: 'grant_free' | 'adjust_balance' | 'reset_usage' | 'extend_trial';
  organizationId: string;
  amount: number;
  reason: string;
  expiryDate?: Date;
}

export interface CreditTrendsAnalysis {
  totalCreditsInSystem: number;
  totalCreditsUsedThisMonth: number;
  totalCreditsUsedLastMonth: number;
  growthRate: number; // percentage
  topSpendingOrganizations: Array<{
    organizationId: string;
    organizationName: string;
    creditsUsedThisMonth: number;
    percentageOfTotal: number;
  }>;
  usageByServiceType: Array<{
    serviceType: string;
    creditsUsed: number;
    percentage: number;
  }>;
  monthlyTrends: Array<{
    month: Date;
    totalPurchased: number;
    totalUsed: number;
    netChange: number;
    activeOrganizations: number;
  }>;
  forecastNextMonth: {
    expectedUsage: number;
    recommendedPurchases: number;
    potentialRevenue: number;
  };
}

export interface UsageAnalytics {
  period: 'today' | 'week' | 'month' | 'year';
  measurements: {
    total: number;
    successful: number;
    failed: number;
    averagePerUser: number;
  };
  reports: {
    generated: number;
    avgPerMeasurement: number;
    byType: Array<{
      type: string;
      count: number;
      percentage: number;
    }>;
  };
  users: {
    activeCount: number;
    newRegistrations: number;
    retentionRate: number;
  };
  organizations: {
    activeCount: number;
    totalMembers: number;
    avgMembersPerOrg: number;
  };
  credits: {
    used: number;
    purchased: number;
    balance: number;
    avgCostPerReport: number;
  };
}

/**
 * 시스템 크레딧 관리 전담 서비스
 * SystemAdminService에서 분리된 크레딧 관련 기능
 */
export class SystemCreditManagementService extends BaseService {
  private static instance: SystemCreditManagementService | null = null;

  constructor() {
    super();
  }

  static getInstance(): SystemCreditManagementService {
    if (!SystemCreditManagementService.instance) {
      SystemCreditManagementService.instance = new SystemCreditManagementService();
    }
    return SystemCreditManagementService.instance;
  }

  /**
   * 모든 조직의 크레딧 정보 조회
   */
  async getAllOrganizationCredits(): Promise<OrganizationCreditInfo[]> {
    try {

      // TODO: PRODUCTION ISSUE - Firebase 쿼리 문제 해결 후 실제 데이터 반환 구현 필요
      if (import.meta.env.DEV) {
      }

      // Mock 데이터 - 실제 구현 시 Firebase 쿼리로 교체 필요
      return Array.from({ length: 15 }, (_, index) => {
        const currentBalance = 1000 + index * 500 - (index * 200);
        const monthlyUsage = 150 + index * 50;
        const projectedDepletion = currentBalance > monthlyUsage * 2 
          ? null 
          : new Date(Date.now() + (currentBalance / monthlyUsage) * 30 * 86400000);
        
        let status: 'healthy' | 'warning' | 'critical' = 'healthy';
        if (currentBalance < monthlyUsage) {
          status = 'critical';
        } else if (currentBalance < monthlyUsage * 2) {
          status = 'warning';
        }

        return {
          organizationId: `org-${index + 1}`,
          organizationName: `조직 ${index + 1}`,
          currentBalance,
          totalPurchased: 5000 + index * 1000,
          totalUsed: 4000 + index * 800,
          monthlyUsage,
          lastPurchaseDate: new Date(Date.now() - (index + 1) * 86400000 * 7),
          lastUsageDate: new Date(Date.now() - index * 3600000),
          averageMonthlyUsage: monthlyUsage * 0.9,
          projectedDepletion,
          status,
          plan: ['basic', 'premium', 'enterprise'][index % 3]
        };
      });

    } catch (error) {
      throw error;
    }
  }

  /**
   * 무료 크레딧 지급
   */
  async grantFreeCredits(actions: CreditManagementAction[]): Promise<{ success: number; failed: number; results: any[] }> {
    try {

      // TODO: PRODUCTION ISSUE - Firebase 업데이트 로직 구현 필요
      if (import.meta.env.DEV) {
      }

      const results = [];
      let success = 0;
      let failed = 0;

      // Mock 처리 - 실제 구현 시 Firebase 업데이트 로직으로 교체 필요
      for (const action of actions) {
        try {
          await new Promise(resolve => setTimeout(resolve, 100)); // 네트워크 지연 시뮬레이션
          
          // 90% 성공률 시뮬레이션
          if (Math.random() > 0.1) {
            results.push({
              organizationId: action.organizationId,
              success: true,
              message: `${action.amount} 크레딧이 성공적으로 지급되었습니다.`
            });
            success++;
          } else {
            results.push({
              organizationId: action.organizationId,
              success: false,
              message: '크레딧 지급에 실패했습니다.'
            });
            failed++;
          }
        } catch (error) {
          results.push({
            organizationId: action.organizationId,
            success: false,
            message: '처리 중 오류가 발생했습니다.'
          });
          failed++;
        }
      }

      return { success, failed, results };

    } catch (error) {
      throw error;
    }
  }

  /**
   * 크레딧 트렌드 분석
   */
  async getCreditTrendsAnalysis(): Promise<CreditTrendsAnalysis> {
    try {

      // TODO: PRODUCTION ISSUE - Firebase 쿼리 문제 해결 후 실제 데이터 반환 구현 필요
      if (import.meta.env.DEV) {
      }

      // Mock 데이터 - 실제 구현 시 Firebase 쿼리로 교체 필요
      return {
        totalCreditsInSystem: 450000,
        totalCreditsUsedThisMonth: 25000,
        totalCreditsUsedLastMonth: 22000,
        growthRate: 13.6,
        topSpendingOrganizations: [
          { organizationId: 'org1', organizationName: '조직 1', creditsUsedThisMonth: 3500, percentageOfTotal: 14.0 },
          { organizationId: 'org2', organizationName: '조직 2', creditsUsedThisMonth: 2800, percentageOfTotal: 11.2 },
          { organizationId: 'org3', organizationName: '조직 3', creditsUsedThisMonth: 2300, percentageOfTotal: 9.2 }
        ],
        usageByServiceType: [
          { serviceType: '정신건강 리포트', creditsUsed: 12500, percentage: 50.0 },
          { serviceType: '의학적 위험도', creditsUsed: 8750, percentage: 35.0 },
          { serviceType: '종합건강', creditsUsed: 3750, percentage: 15.0 }
        ],
        monthlyTrends: Array.from({ length: 12 }, (_, index) => ({
          month: new Date(new Date().getFullYear(), new Date().getMonth() - 11 + index, 1),
          totalPurchased: 35000 + index * 2000 + Math.floor(Math.random() * 5000),
          totalUsed: 18000 + index * 1500 + Math.floor(Math.random() * 3000),
          netChange: 17000 + index * 500 + Math.floor(Math.random() * 2000),
          activeOrganizations: 45 + index * 3
        })),
        forecastNextMonth: {
          expectedUsage: 27500,
          recommendedPurchases: 40000,
          potentialRevenue: 3200000
        }
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * 사용량 분석
   */
  async getUsageAnalytics(period: UsageAnalytics['period']): Promise<UsageAnalytics> {
    try {

      // TODO: PRODUCTION ISSUE - Firebase 쿼리 문제 해결 후 실제 데이터 반환 구현 필요
      if (import.meta.env.DEV) {
      }

      // Mock 데이터 - 실제 구현 시 Firebase 쿼리로 교체 필요
      const multiplier = period === 'today' ? 1 : period === 'week' ? 7 : period === 'month' ? 30 : 365;
      const baseValue = period === 'today' ? 50 : period === 'week' ? 300 : period === 'month' ? 1200 : 12000;

      return {
        period,
        measurements: {
          total: baseValue * 2,
          successful: Math.floor(baseValue * 1.85),
          failed: Math.floor(baseValue * 0.15),
          averagePerUser: 2.3
        },
        reports: {
          generated: Math.floor(baseValue * 2.1),
          avgPerMeasurement: 2.1,
          byType: [
            { type: '정신건강', count: Math.floor(baseValue * 1.05), percentage: 50.0 },
            { type: '의학적 위험도', count: Math.floor(baseValue * 0.735), percentage: 35.0 },
            { type: '종합건강', count: Math.floor(baseValue * 0.315), percentage: 15.0 }
          ]
        },
        users: {
          activeCount: Math.floor(baseValue * 0.8),
          newRegistrations: Math.floor(baseValue * 0.1),
          retentionRate: 78.5
        },
        organizations: {
          activeCount: Math.floor(baseValue * 0.05),
          totalMembers: Math.floor(baseValue * 1.2),
          avgMembersPerOrg: 24.5
        },
        credits: {
          used: Math.floor(baseValue * 15),
          purchased: Math.floor(baseValue * 20),
          balance: Math.floor(baseValue * 25),
          avgCostPerReport: 7.2
        }
      };

    } catch (error) {
      throw error;
    }
  }
}

// 싱글톤 인스턴스 export
export default SystemCreditManagementService.getInstance();