import { db } from '@core/services/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  Timestamp,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import {
  VolumeDiscountTier,
  VolumeDiscountConfig,
  VOLUME_DISCOUNT_TIERS,
  DEFAULT_BASE_PRICE,
  DEFAULT_CREDIT_PER_REPORT,
  DEFAULT_CREDIT_PER_CONSULTATION,
  TRIAL_CONFIGS,
  TrialType,
  CreditTransactionType,
  CreditTransaction,
  PricingCalculation,
  Organization,
  TrialService
} from '@core/types/business';
import { toast } from 'sonner';

export interface CreditUsageOptions {
  userId: string;
  organizationId?: string;
  amount: number;
  type: CreditTransactionType;
  description: string;
  metadata?: {
    reportId?: string;
    consultationId?: string;
    reportType?: string;
    consultationType?: string;
  };
}

export interface CreditPurchaseOptions {
  organizationId?: string;
  userId?: string;
  amount: number;
  paymentId?: string;
  description: string;
  purchaseType?: 'REGULAR' | 'TRIAL' | 'BONUS';
}

export interface VolumeDiscountCalculationResult {
  memberCount: number;
  basePrice: number;
  volumeTier: VolumeDiscountTier;
  discountPercent: number;
  discountedPrice: number;
  totalServiceCost: number;
  savingsAmount: number;
  
  // 디바이스 비용 정보
  deviceOptions: {
    rental: {
      oneMonth: number;
      threeMonths: number;
      sixMonths: number;
    };
    purchase: {
      cost: number;
      freeCredits: number;
    };
  };
  
  // 체험 서비스 정보
  trialOptions: {
    free: {
      description: string;
      credits: number;
      value: number;
    };
    paid: {
      cost: number;
      credits: number;
      value: number;
      discountPercent: number;
    };
  };
}

class CreditManagementService {
  
  // === 개발 환경 지원 ===

  /**
   * 개발 환경에서 크레딧 체크 우회 여부 확인
   */
  private isDevelopmentMode(): boolean {
    return process.env.NODE_ENV === 'development' || 
           process.env.REACT_APP_ENV === 'development' ||
           window.location.hostname === 'localhost' ||
           window.location.hostname.includes('127.0.0.1');
  }

  // === 볼륨 할인 계산 ===

  calculateVolumeDiscount(memberCount: number): VolumeDiscountCalculationResult {
    const tier = this.getVolumeTier(memberCount);
    const discountConfig = VOLUME_DISCOUNT_TIERS.find(t => t.tier === tier)!;
    
    const basePrice = DEFAULT_BASE_PRICE;
    const discountPercent = discountConfig.discountPercent;
    const discountedPrice = Math.round(basePrice * (100 - discountPercent) / 100);
    const totalServiceCost = discountedPrice * memberCount;
    const savingsAmount = (basePrice - discountedPrice) * memberCount;

    // 체험 서비스 가치 계산
    const freeTrialValue = TRIAL_CONFIGS.FREE_TRIAL.credits * discountedPrice;
    const paidTrialValue = TRIAL_CONFIGS.PAID_TRIAL.credits * discountedPrice;
    const paidTrialDiscount = Math.round(
      ((paidTrialValue - TRIAL_CONFIGS.PAID_TRIAL.cost) / paidTrialValue) * 100
    );

    return {
      memberCount,
      basePrice,
      volumeTier: tier,
      discountPercent,
      discountedPrice,
      totalServiceCost,
      savingsAmount,
      
      deviceOptions: {
        rental: {
          oneMonth: 70000,
          threeMonths: 150000,
          sixMonths: 210000
        },
        purchase: {
          cost: 297000,
          freeCredits: 5
        }
      },
      
      trialOptions: {
        free: {
          description: "디바이스 구매시 5회 무료 체험",
          credits: TRIAL_CONFIGS.FREE_TRIAL.credits,
          value: freeTrialValue
        },
        paid: {
          cost: TRIAL_CONFIGS.PAID_TRIAL.cost,
          credits: TRIAL_CONFIGS.PAID_TRIAL.credits,
          value: paidTrialValue,
          discountPercent: paidTrialDiscount
        }
      }
    };
  }

  private getVolumeTier(memberCount: number): VolumeDiscountTier {
    for (const tier of VOLUME_DISCOUNT_TIERS) {
      if (memberCount >= tier.minMembers && 
          (!tier.maxMembers || memberCount <= tier.maxMembers)) {
        return tier.tier;
      }
    }
    return 'TIER_0';
  }

  calculateEstimatedMonthlyCost(memberCount: number, usageRate: number = 1.0): number {
    const calculation = this.calculateVolumeDiscount(memberCount);
    const expectedReportsPerMonth = memberCount * usageRate; // 월 1회 기본
    const expectedConsultationsPerMonth = memberCount * usageRate * 0.5; // 상담은 50% 비율
    
    const reportCost = expectedReportsPerMonth * DEFAULT_CREDIT_PER_REPORT * calculation.discountedPrice;
    const consultationCost = expectedConsultationsPerMonth * DEFAULT_CREDIT_PER_CONSULTATION * calculation.discountedPrice;
    
    return Math.round(reportCost + consultationCost);
  }

  // === 크레딧 관리 ===

  async getCreditBalance(organizationId?: string, userId?: string): Promise<number> {
    try {
      if (organizationId) {
        // 조직 크레딧 조회
        const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
        return orgDoc.exists() ? (orgDoc.data().creditBalance || 0) : 0;
      } else if (userId) {
        // 개인 크레딧 조회
        const userDoc = await getDoc(doc(db, 'users', userId));
        return userDoc.exists() ? (userDoc.data().personalCreditBalance || 0) : 0;
      }
      return 0;
    } catch (error) {
      console.error('❌ 크레딧 잔액 조회 실패:', error);
      toast.error('크레딧 잔액을 조회할 수 없습니다.');
      throw new Error('크레딧 잔액을 조회할 수 없습니다.');
    }
  }

  async useCredits(options: CreditUsageOptions): Promise<CreditTransaction> {
    return await runTransaction(db, async (transaction) => {
      try {
        let balanceDoc;
        let currentBalance: number;
        
        if (options.organizationId) {
          // 조직 크레딧 사용
          balanceDoc = doc(db, 'organizations', options.organizationId);
          const orgSnap = await transaction.get(balanceDoc);
          if (!orgSnap.exists()) {
            throw new Error('조직을 찾을 수 없습니다.');
          }
          currentBalance = orgSnap.data().creditBalance || 0;
        } else {
          // 개인 크레딧 사용
          balanceDoc = doc(db, 'users', options.userId);
          const userSnap = await transaction.get(balanceDoc);
          if (!userSnap.exists()) {
            throw new Error('사용자를 찾을 수 없습니다.');
          }
          currentBalance = userSnap.data().personalCreditBalance || 0;
        }

        // 잔액 확인 (개발 환경에서는 우회)
        if (!this.isDevelopmentMode() && currentBalance < options.amount) {
          const errorMessage = `크레딧이 부족합니다. (현재: ${currentBalance}, 필요: ${options.amount})`;
          toast.error(errorMessage);
          throw new Error(errorMessage);
        }

        // 개발 환경에서 크레딧이 부족하면 자동으로 충전
        if (this.isDevelopmentMode() && currentBalance < options.amount) {
          console.log(`🚀 개발 환경: 크레딧 부족으로 자동 충전 (현재: ${currentBalance}, 필요: ${options.amount})`);
          const autoChargeAmount = Math.max(99999999, options.amount * 100);
          
          // 자동 충전
          if (options.organizationId) {
            transaction.update(balanceDoc, { 
              creditBalance: autoChargeAmount,
              updatedAt: Timestamp.now()
            });
          } else {
            transaction.update(balanceDoc, { 
              personalCreditBalance: autoChargeAmount,
              updatedAt: Timestamp.now()
            });
          }
          
          currentBalance = autoChargeAmount;
          console.log(`✅ 개발용 크레딧 자동 충전 완료: ${autoChargeAmount} 크레딧`);
          toast.success(`🚀 개발 환경: 크레딧 자동 충전! ${autoChargeAmount.toLocaleString()} 크레딧 추가`);
        }

        const newBalance = currentBalance - options.amount;

        // 잔액 업데이트
        if (options.organizationId) {
          transaction.update(balanceDoc, { 
            creditBalance: newBalance,
            updatedAt: Timestamp.now()
          });
        } else {
          transaction.update(balanceDoc, { 
            personalCreditBalance: newBalance,
            updatedAt: Timestamp.now()
          });
        }

        // 트랜잭션 기록 생성
        const transactionData: Omit<CreditTransaction, 'id'> = {
          organizationId: options.organizationId,
          userId: options.userId,
          amount: -options.amount, // 음수로 저장 (사용)
          balanceAfter: newBalance,
          type: options.type,
          description: options.description,
          metadata: options.metadata,
          createdAt: new Date(),
          createdBy: options.userId
        };

        const transactionRef = doc(collection(db, 'creditTransactions'));
        transaction.set(transactionRef, {
          ...transactionData,
          createdAt: Timestamp.now()
        });

        console.log(`✅ 크레딧 사용 완료: ${options.amount} (잔액: ${newBalance})`);
        
        return {
          id: transactionRef.id,
          ...transactionData
        };

      } catch (error) {
        console.error('❌ 크레딧 사용 실패:', error);
        if (error instanceof Error && !error.message.includes('크레딧이 부족합니다')) {
          toast.error(`크레딧 사용 실패: ${error.message}`);
        }
        throw error;
      }
    });
  }

  async addCredits(options: CreditPurchaseOptions): Promise<CreditTransaction> {
    return await runTransaction(db, async (transaction) => {
      try {
        let balanceDoc;
        let currentBalance: number;
        
        if (options.organizationId) {
          // 조직 크레딧 충전
          balanceDoc = doc(db, 'organizations', options.organizationId);
          const orgSnap = await transaction.get(balanceDoc);
          if (!orgSnap.exists()) {
            throw new Error('조직을 찾을 수 없습니다.');
          }
          currentBalance = orgSnap.data().creditBalance || 0;
        } else if (options.userId) {
          // 개인 크레딧 충전
          balanceDoc = doc(db, 'users', options.userId);
          const userSnap = await transaction.get(balanceDoc);
          if (!userSnap.exists()) {
            throw new Error('사용자를 찾을 수 없습니다.');
          }
          currentBalance = userSnap.data().personalCreditBalance || 0;
        } else {
          throw new Error('조직ID 또는 사용자ID가 필요합니다.');
        }

        const newBalance = currentBalance + options.amount;

        // 잔액 업데이트
        if (options.organizationId) {
          transaction.update(balanceDoc, { 
            creditBalance: newBalance,
            updatedAt: Timestamp.now()
          });
        } else {
          transaction.update(balanceDoc, { 
            personalCreditBalance: newBalance,
            updatedAt: Timestamp.now()
          });
        }

        // 트랜잭션 타입 결정
        let transactionType: CreditTransactionType;
        switch (options.purchaseType) {
          case 'TRIAL':
            transactionType = 'TRIAL_GRANT';
            break;
          case 'BONUS':
            transactionType = 'BONUS_GRANT';
            break;
          default:
            transactionType = 'PURCHASE';
        }

        // 트랜잭션 기록 생성
        const transactionData: Omit<CreditTransaction, 'id'> = {
          organizationId: options.organizationId,
          userId: options.userId,
          amount: options.amount, // 양수로 저장 (충전)
          balanceAfter: newBalance,
          type: transactionType,
          description: options.description,
          metadata: options.paymentId ? { paymentId: options.paymentId } : undefined,
          createdAt: new Date(),
          createdBy: options.userId || 'system'
        };

        const transactionRef = doc(collection(db, 'creditTransactions'));
        transaction.set(transactionRef, {
          ...transactionData,
          createdAt: Timestamp.now()
        });

        console.log(`✅ 크레딧 충전 완료: ${options.amount} (잔액: ${newBalance})`);
        toast.success(`✅ 크레딧 충전 완료! ${options.amount.toLocaleString()} 크레딧 추가`);
        
        return {
          id: transactionRef.id,
          ...transactionData
        };

      } catch (error) {
        console.error('❌ 크레딧 충전 실패:', error);
        toast.error(`크레딧 충전 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        throw error;
      }
    });
  }

  async getCreditHistory(
    organizationId?: string, 
    userId?: string, 
    limitCount: number = 50
  ): Promise<CreditTransaction[]> {
    try {
      let q;
      
      if (organizationId) {
        // 인덱스 오류 방지를 위해 orderBy를 제거하고 클라이언트 측에서 정렬
        q = query(
          collection(db, 'creditTransactions'),
          where('organizationId', '==', organizationId),
          limit(limitCount * 2) // 정렬 전이므로 더 많은 데이터를 가져옴
        );
      } else if (userId) {
        q = query(
          collection(db, 'creditTransactions'),
          where('userId', '==', userId),
          limit(limitCount * 2)
        );
      } else {
        throw new Error('조직ID 또는 사용자ID가 필요합니다.');
      }

      const querySnapshot = await getDocs(q);
      const transactions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      } as CreditTransaction));

      // 클라이언트 측에서 정렬하고 제한
      return transactions
        .sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return b.createdAt.getTime() - a.createdAt.getTime();
          }
          return 0;
        })
        .slice(0, limitCount);

    } catch (error) {
      console.error('❌ 크레딧 히스토리 조회 실패:', error);
      throw new Error('크레딧 히스토리를 조회할 수 없습니다.');
    }
  }

  // === 체험 서비스 관리 ===

  async startTrialService(
    organizationId: string,
    trialType: TrialType,
    adminUserId: string
  ): Promise<TrialService> {
    try {
      const trialConfig = TRIAL_CONFIGS[trialType];
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + trialConfig.validityDays * 24 * 60 * 60 * 1000);

      const trialServiceData = {
        organizationId,
        trialType,
        maxCredits: trialConfig.credits,
        validityDays: trialConfig.validityDays,
        creditsUsed: 0,
        remainingCredits: trialConfig.credits,
        startDate,
        endDate,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // TrialService 문서 생성
      const trialRef = doc(collection(db, 'trialServices'));
      await setDoc(trialRef, {
        ...trialServiceData,
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      // 조직에 체험 서비스 크레딧 추가
      await this.addCredits({
        organizationId,
        userId: adminUserId,
        amount: trialConfig.credits,
        description: `${trialType === 'FREE_TRIAL' ? '무료' : '유료'} 체험 서비스 크레딧 지급`,
        purchaseType: 'TRIAL'
      });

      // 조직 상태 업데이트
      await updateDoc(doc(db, 'organizations', organizationId), {
        isTrialActive: true,
        trialType,
        trialStartDate: Timestamp.fromDate(startDate),
        trialEndDate: Timestamp.fromDate(endDate),
        trialCreditsTotal: trialConfig.credits,
        status: 'TRIAL',
        updatedAt: Timestamp.now()
      });

      console.log(`✅ ${trialType} 체험 서비스 시작: ${trialConfig.credits} 크레딧`);
      
      return {
        id: trialRef.id,
        ...trialServiceData
      };

    } catch (error) {
      console.error('❌ 체험 서비스 시작 실패:', error);
      throw new Error('체험 서비스를 시작할 수 없습니다.');
    }
  }

  async getActiveTrialService(organizationId: string): Promise<TrialService | null> {
    try {
      const q = query(
        collection(db, 'trialServices'),
        where('organizationId', '==', organizationId),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        organizationId: data.organizationId,
        trialType: data.trialType,
        maxCredits: data.maxCredits,
        validityDays: data.validityDays,
        creditsUsed: data.creditsUsed,
        remainingCredits: data.remainingCredits,
        startDate: data.startDate?.toDate(),
        endDate: data.endDate?.toDate(),
        isActive: data.isActive,
        conversionDate: data.conversionDate?.toDate(),
        conversionDiscount: data.conversionDiscount,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      };

    } catch (error) {
      console.error('❌ 활성 체험 서비스 조회 실패:', error);
      return null;
    }
  }

  async convertTrialToFullService(
    organizationId: string,
    conversionDiscount: number = 10 // 10% 추가 할인
  ): Promise<void> {
    return await runTransaction(db, async (transaction) => {
      try {
        // 활성 체험 서비스 조회
        const trial = await this.getActiveTrialService(organizationId);
        if (!trial) {
          throw new Error('활성 체험 서비스를 찾을 수 없습니다.');
        }

        // 체험 서비스 종료
        const trialRef = doc(db, 'trialServices', trial.id);
        transaction.update(trialRef, {
          isActive: false,
          conversionDate: Timestamp.now(),
          conversionDiscount,
          updatedAt: Timestamp.now()
        });

        // 조직 상태 업데이트
        const orgRef = doc(db, 'organizations', organizationId);
        transaction.update(orgRef, {
          isTrialActive: false,
          status: 'ACTIVE',
          contractStartDate: Timestamp.now(),
          updatedAt: Timestamp.now()
        });

        console.log(`✅ 체험 서비스 → 정식 서비스 전환 완료 (${conversionDiscount}% 추가 할인)`);

      } catch (error) {
        console.error('❌ 체험 서비스 전환 실패:', error);
        throw error;
      }
    });
  }

  // === 리포트/상담 크레딧 계산 ===

  getReportCreditCost(reportType: 'BASIC' | 'DETAILED' | 'COMPREHENSIVE'): number {
    switch (reportType) {
      case 'BASIC':
        return 1;
      case 'DETAILED':
        return 2;
      case 'COMPREHENSIVE':
        return 3;
      default:
        return DEFAULT_CREDIT_PER_REPORT;
    }
  }

  getConsultationCreditCost(consultationType: 'BASIC' | 'PREMIUM'): number {
    switch (consultationType) {
      case 'BASIC':
        return 1;
      case 'PREMIUM':
        return 2;
      default:
        return DEFAULT_CREDIT_PER_CONSULTATION;
    }
  }

  async useReportCredits(
    userId: string,
    organizationId: string | undefined,
    reportType: 'BASIC' | 'DETAILED' | 'COMPREHENSIVE',
    reportId: string
  ): Promise<CreditTransaction> {
    const creditCost = this.getReportCreditCost(reportType);
    
    return await this.useCredits({
      userId,
      organizationId,
      amount: creditCost,
      type: 'REPORT_USAGE',
      description: `${reportType} 리포트 생성`,
      metadata: {
        reportId,
        reportType
      }
    });
  }

  async useConsultationCredits(
    userId: string,
    organizationId: string | undefined,
    consultationType: 'BASIC' | 'PREMIUM',
    consultationId: string
  ): Promise<CreditTransaction> {
    const creditCost = this.getConsultationCreditCost(consultationType);
    
    return await this.useCredits({
      userId,
      organizationId,
      amount: creditCost,
      type: 'CONSULTATION_USAGE',
      description: `${consultationType} AI 상담`,
      metadata: {
        consultationId,
        consultationType
      }
    });
  }

  // === 통계 및 분석 ===

  async getCreditUsageStats(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalCreditsUsed: number;
    reportCredits: number;
    consultationCredits: number;
    averageDaily: number;
    topUsers: { userId: string; credits: number; displayName?: string }[];
  }> {
    try {
      const q = query(
        collection(db, 'creditTransactions'),
        where('organizationId', '==', organizationId),
        where('type', 'in', ['REPORT_USAGE', 'CONSULTATION_USAGE']),
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate)),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const transactions = querySnapshot.docs.map(doc => doc.data());

      const totalCreditsUsed = transactions.reduce(
        (sum, t) => sum + Math.abs(t.amount), 0
      );
      
      const reportCredits = transactions
        .filter(t => t.type === 'REPORT_USAGE')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      const consultationCredits = transactions
        .filter(t => t.type === 'CONSULTATION_USAGE')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const daysDiff = Math.max(1, Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ));
      const averageDaily = Math.round(totalCreditsUsed / daysDiff);

      // 사용자별 통계
      const userStats: { [userId: string]: number } = {};
      transactions.forEach(t => {
        userStats[t.createdBy] = (userStats[t.createdBy] || 0) + Math.abs(t.amount);
      });

      const topUsers = Object.entries(userStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([userId, credits]) => ({ userId, credits }));

      return {
        totalCreditsUsed,
        reportCredits,
        consultationCredits,
        averageDaily,
        topUsers
      };

    } catch (error) {
      console.error('❌ 크레딧 사용 통계 조회 실패:', error);
      throw new Error('크레딧 사용 통계를 조회할 수 없습니다.');
    }
  }

  // === 만료 크레딧 관리 ===

  async expireCredits(organizationId: string, amount: number, reason: string): Promise<void> {
    await this.useCredits({
      userId: 'system',
      organizationId,
      amount,
      type: 'EXPIRY',
      description: reason
    });
  }

  // === 환불 처리 ===

  async refundCredits(
    transactionId: string,
    refundAmount: number,
    reason: string,
    adminUserId: string
  ): Promise<CreditTransaction> {
    try {
      // 원본 트랜잭션 조회
      const originalTransactionDoc = await getDoc(doc(db, 'creditTransactions', transactionId));
      if (!originalTransactionDoc.exists()) {
        throw new Error('원본 트랜잭션을 찾을 수 없습니다.');
      }

      const originalTransaction = originalTransactionDoc.data();
      
      return await this.addCredits({
        organizationId: originalTransaction.organizationId,
        userId: originalTransaction.userId,
        amount: refundAmount,
        description: `환불: ${reason}`,
        purchaseType: 'BONUS' // 환불은 보너스로 처리
      });

    } catch (error) {
      console.error('❌ 크레딧 환불 실패:', error);
      throw new Error('크레딧 환불을 처리할 수 없습니다.');
    }
  }
}

// 싱글톤 인스턴스
export const creditManagementService = new CreditManagementService();
export default creditManagementService; 