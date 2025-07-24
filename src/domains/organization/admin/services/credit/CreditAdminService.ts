/**
 * 크레딧 관리 서비스
 * 
 * 크레딧 부여, 사용 현황, 통계 등 크레딧 관련 모든 관리 기능을 담당합니다.
 */

import { BaseAdminService } from '../core/BaseAdminService'
import { Permission } from '../../core/types/AdminTypes'
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
  serverTimestamp,
  Timestamp,
  runTransaction,
  increment
} from 'firebase/firestore'
import { db } from '@core/services/firebase'

export interface OrganizationCreditInfo {
  organizationId: string
  organizationName: string
  currentBalance: number
  monthlyUsage: number
  totalGranted: number
  totalPurchased: number
  totalUsed: number
  lastTransaction: Date | null
  creditStatus: 'healthy' | 'low' | 'depleted'
  usageVelocity: number // 일일 평균 사용량
  estimatedDaysRemaining: number
}

export interface CreditManagementAction {
  organizationId: string
  organizationName?: string
  actionType: 'grant' | 'revoke' | 'adjust'
  amount: number
  reason: string
  metadata?: Record<string, any>
}

export interface CreditTransaction {
  id: string
  organizationId: string
  organizationName: string
  type: 'grant' | 'purchase' | 'use' | 'revoke' | 'adjustment'
  amount: number
  balance: number
  description: string
  createdAt: Date
  createdBy?: string
  metadata?: Record<string, any>
}

export interface CreditAnalytics {
  totalCredits: number
  usedCredits: number
  availableCredits: number
  organizationBreakdown: Array<{
    organizationId: string
    organizationName: string
    balance: number
    percentage: number
  }>
  usageTrend: Array<{
    date: Date
    usage: number
    cumulative: number
  }>
  topConsumers: Array<{
    organizationId: string
    organizationName: string
    usage: number
    percentage: number
  }>
}

export class CreditAdminService extends BaseAdminService {
  protected getServiceName(): string {
    return 'CreditAdminService'
  }
  
  /**
   * 모든 조직의 크레딧 정보 조회
   */
  async getAllOrganizationCredits(): Promise<OrganizationCreditInfo[]> {
    await this.requirePermission(Permission.READ_CREDITS)
    
    try {
      
      // 모든 조직 조회
      const orgsSnapshot = await getDocs(collection(db, 'organizations'))
      const creditInfos: OrganizationCreditInfo[] = []
      
      for (const orgDoc of orgsSnapshot.docs) {
        try {
          const orgData = orgDoc.data()
          const creditInfo = await this.calculateOrganizationCreditInfo(
            orgDoc.id,
            orgData.name,
            orgData.creditBalance || 0
          )
          creditInfos.push(creditInfo)
        } catch (error) {
            metadata: { organizationId: orgDoc.id }
        }
      }
      
      // 크레딧 잔액 기준 내림차순 정렬
      creditInfos.sort((a, b) => b.currentBalance - a.currentBalance)
      
        metadata: { count: creditInfos.length }
      
      return creditInfos
      
    } catch (error) {
      throw error
    }
  }
  
  /**
   * 크레딧 부여/조정
   */
  async grantCredits(actions: CreditManagementAction[]): Promise<{
    success: number
    failed: number
    results: Array<{ organizationId: string; success: boolean; error?: string }>
  }> {
    await this.requirePermission(Permission.MANAGE_CREDITS)
    
    const results = {
      success: 0,
      failed: 0,
      results: [] as Array<{ organizationId: string; success: boolean; error?: string }>
    }
    
      metadata: { actionCount: actions.length }
    
    for (const action of actions) {
      try {
        await this.processCreditAction(action)
        results.success++
        results.results.push({
          organizationId: action.organizationId,
          success: true
        })
      } catch (error) {
        results.failed++
        results.results.push({
          organizationId: action.organizationId,
          success: false,
          error: (error as Error).message
        })
        
          metadata: { action }
      }
    }
    
    await this.createAuditLog('grant_credits', 'credit', 
      results.failed === 0 ? 'success' : 'failure',
      { results }
    )
    
      metadata: results
    
    return results
  }
  
  /**
   * 크레딧 사용 추세 분석
   */
  async getCreditTrendsAnalysis(): Promise<{
    daily: Array<{ date: Date; granted: number; used: number; net: number }>
    weekly: Array<{ week: string; granted: number; used: number; net: number }>
    monthly: Array<{ month: string; granted: number; used: number; net: number }>
    predictions: {
      estimatedMonthlyUsage: number
      criticalOrganizations: Array<{
        organizationId: string
        organizationName: string
        daysUntilDepletion: number
        currentBalance: number
      }>
    }
  }> {
    await this.requirePermission(Permission.VIEW_ANALYTICS)
    
    try {
      // 최근 90일 크레딧 거래 조회
      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
      
      const transactionsQuery = query(
        collection(db, 'credit_transactions'),
        where('createdAt', '>=', Timestamp.fromDate(ninetyDaysAgo)),
        orderBy('createdAt', 'asc')
      )
      
      const snapshot = await getDocs(transactionsQuery)
      const transactions = snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: this.convertTimestamp(doc.data().createdAt)
      })) as CreditTransaction[]
      
      // 일별 분석
      const daily = this.analyzeDailyCredits(transactions)
      
      // 주별 분석
      const weekly = this.analyzeWeeklyCredits(transactions)
      
      // 월별 분석
      const monthly = this.analyzeMonthlyCredits(transactions)
      
      // 예측 분석
      const predictions = await this.predictCreditUsage(transactions)
      
      return {
        daily,
        weekly,
        monthly,
        predictions
      }
      
    } catch (error) {
      throw error
    }
  }
  
  /**
   * 크레딧 거래 내역 조회
   */
  async getCreditTransactions(
    filters?: {
      organizationId?: string
      type?: CreditTransaction['type']
      startDate?: Date
      endDate?: Date
    },
    pagination?: {
      page: number
      pageSize: number
    }
  ): Promise<{
    transactions: CreditTransaction[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }> {
    await this.requirePermission(Permission.READ_CREDITS)
    
    try {
      let transactionQuery = query(collection(db, 'credit_transactions'))
      
      // 필터 적용
      if (filters?.organizationId) {
        transactionQuery = query(transactionQuery, 
          where('organizationId', '==', filters.organizationId)
        )
      }
      
      if (filters?.type) {
        transactionQuery = query(transactionQuery, 
          where('type', '==', filters.type)
        )
      }
      
      if (filters?.startDate) {
        transactionQuery = query(transactionQuery,
          where('createdAt', '>=', Timestamp.fromDate(filters.startDate))
        )
      }
      
      if (filters?.endDate) {
        transactionQuery = query(transactionQuery,
          where('createdAt', '<=', Timestamp.fromDate(filters.endDate))
        )
      }
      
      transactionQuery = query(transactionQuery, orderBy('createdAt', 'desc'))
      
      // 페이지네이션 적용
      const page = pagination?.page || 1
      const pageSize = pagination?.pageSize || 50
      
      const result = await this.paginateQuery<CreditTransaction>(
        transactionQuery,
        page,
        pageSize,
        (doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: this.convertTimestamp(doc.data().createdAt)
        } as CreditTransaction)
      )
      
      return {
        transactions: result.data,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages
      }
      
    } catch (error) {
      throw error
    }
  }
  
  // Private 헬퍼 메서드들
  
  private async calculateOrganizationCreditInfo(
    organizationId: string,
    organizationName: string,
    currentBalance: number
  ): Promise<OrganizationCreditInfo> {
    // 이번 달 사용량
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    
    const usageQuery = query(
      collection(db, 'credit_transactions'),
      where('organizationId', '==', organizationId),
      where('type', '==', 'use'),
      where('createdAt', '>=', Timestamp.fromDate(monthStart))
    )
    const usageSnapshot = await getDocs(usageQuery)
    const monthlyUsage = usageSnapshot.docs.reduce((sum, doc) => 
      sum + Math.abs(doc.data().amount || 0), 0
    )
    
    // 전체 통계
    const allTransactionsQuery = query(
      collection(db, 'credit_transactions'),
      where('organizationId', '==', organizationId)
    )
    const allSnapshot = await getDocs(allTransactionsQuery)
    
    let totalGranted = 0
    let totalPurchased = 0
    let totalUsed = 0
    let lastTransactionDate: Date | null = null
    
    allSnapshot.docs.forEach(doc => {
      const data = doc.data()
      const amount = Math.abs(data.amount || 0)
      
      switch (data.type) {
        case 'grant':
          totalGranted += amount
          break
        case 'purchase':
          totalPurchased += amount
          break
        case 'use':
          totalUsed += amount
          break
      }
      
      const createdAt = this.convertTimestamp(data.createdAt)
      if (createdAt && (!lastTransactionDate || createdAt > lastTransactionDate)) {
        lastTransactionDate = createdAt
      }
    })
    
    // 일일 평균 사용량 (최근 30일 기준)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentUsageQuery = query(
      collection(db, 'credit_transactions'),
      where('organizationId', '==', organizationId),
      where('type', '==', 'use'),
      where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo))
    )
    const recentUsageSnapshot = await getDocs(recentUsageQuery)
    const recentUsage = recentUsageSnapshot.docs.reduce((sum, doc) => 
      sum + Math.abs(doc.data().amount || 0), 0
    )
    const usageVelocity = recentUsage / 30
    
    // 예상 소진 일수
    const estimatedDaysRemaining = usageVelocity > 0 
      ? Math.floor(currentBalance / usageVelocity)
      : 999
    
    // 크레딧 상태
    let creditStatus: OrganizationCreditInfo['creditStatus'] = 'healthy'
    if (currentBalance <= 0) {
      creditStatus = 'depleted'
    } else if (currentBalance < 10 || estimatedDaysRemaining < 7) {
      creditStatus = 'low'
    }
    
    return {
      organizationId,
      organizationName,
      currentBalance,
      monthlyUsage,
      totalGranted,
      totalPurchased,
      totalUsed,
      lastTransaction: lastTransactionDate,
      creditStatus,
      usageVelocity,
      estimatedDaysRemaining
    }
  }
  
  private async processCreditAction(action: CreditManagementAction): Promise<void> {
    const { organizationId, actionType, amount, reason } = action
    
    await runTransaction(db, async (transaction) => {
      const orgRef = doc(db, 'organizations', organizationId)
      const orgDoc = await transaction.get(orgRef)
      
      if (!orgDoc.exists()) {
        throw new Error('조직을 찾을 수 없습니다')
      }
      
      const currentBalance = orgDoc.data().creditBalance || 0
      let newBalance = currentBalance
      
      switch (actionType) {
        case 'grant':
          newBalance = currentBalance + amount
          break
        case 'revoke':
          newBalance = Math.max(0, currentBalance - amount)
          break
        case 'adjust':
          newBalance = amount
          break
      }
      
      // 조직 크레딧 업데이트
      transaction.update(orgRef, {
        creditBalance: newBalance,
        creditUpdatedAt: serverTimestamp()
      })
      
      // 거래 기록 생성
      const transactionRef = doc(collection(db, 'credit_transactions'))
      transaction.set(transactionRef, {
        organizationId,
        organizationName: orgDoc.data().name,
        type: actionType,
        amount: actionType === 'grant' ? amount : -amount,
        balance: newBalance,
        description: reason,
        createdAt: serverTimestamp(),
        createdBy: this.context?.userId,
        metadata: {
          ...action.metadata,
          previousBalance: currentBalance,
          adminAction: true
        }
      })
    })
    
      metadata: { organizationId, actionType, amount }
  }
  
  private analyzeDailyCredits(transactions: CreditTransaction[]) {
    const dailyMap = new Map<string, { granted: number; used: number }>()
    
    transactions.forEach(tx => {
      if (!tx.createdAt) return
      
      const dateKey = tx.createdAt.toISOString().split('T')[0]
      const existing = dailyMap.get(dateKey) || { granted: 0, used: 0 }
      
      if (tx.type === 'grant') {
        existing.granted += Math.abs(tx.amount)
      } else if (tx.type === 'use') {
        existing.used += Math.abs(tx.amount)
      }
      
      dailyMap.set(dateKey, existing)
    })
    
    // 최근 30일 데이터 반환
    const result = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]
      
      const data = dailyMap.get(dateKey) || { granted: 0, used: 0 }
      result.push({
        date,
        granted: data.granted,
        used: data.used,
        net: data.granted - data.used
      })
    }
    
    return result
  }
  
  private analyzeWeeklyCredits(transactions: CreditTransaction[]) {
    const weeklyMap = new Map<string, { granted: number; used: number }>()
    
    transactions.forEach(tx => {
      if (!tx.createdAt) return
      
      const weekKey = this.getWeekKey(tx.createdAt)
      const existing = weeklyMap.get(weekKey) || { granted: 0, used: 0 }
      
      if (tx.type === 'grant') {
        existing.granted += Math.abs(tx.amount)
      } else if (tx.type === 'use') {
        existing.used += Math.abs(tx.amount)
      }
      
      weeklyMap.set(weekKey, existing)
    })
    
    // 최근 12주 데이터 반환
    const result = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i * 7)
      const weekKey = this.getWeekKey(date)
      
      const data = weeklyMap.get(weekKey) || { granted: 0, used: 0 }
      result.push({
        week: weekKey,
        granted: data.granted,
        used: data.used,
        net: data.granted - data.used
      })
    }
    
    return result
  }
  
  private analyzeMonthlyCredits(transactions: CreditTransaction[]) {
    const monthlyMap = new Map<string, { granted: number; used: number }>()
    
    transactions.forEach(tx => {
      if (!tx.createdAt) return
      
      const monthKey = tx.createdAt.toISOString().substring(0, 7)
      const existing = monthlyMap.get(monthKey) || { granted: 0, used: 0 }
      
      if (tx.type === 'grant') {
        existing.granted += Math.abs(tx.amount)
      } else if (tx.type === 'use') {
        existing.used += Math.abs(tx.amount)
      }
      
      monthlyMap.set(monthKey, existing)
    })
    
    // 최근 3개월 데이터 반환
    const result = []
    for (let i = 2; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = date.toISOString().substring(0, 7)
      
      const data = monthlyMap.get(monthKey) || { granted: 0, used: 0 }
      result.push({
        month: monthKey,
        granted: data.granted,
        used: data.used,
        net: data.granted - data.used
      })
    }
    
    return result
  }
  
  private async predictCreditUsage(transactions: CreditTransaction[]) {
    // 최근 30일 사용 패턴 분석
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentUsage = transactions
      .filter(tx => tx.createdAt && tx.createdAt > thirtyDaysAgo && tx.type === 'use')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
    
    const dailyAverage = recentUsage / 30
    const estimatedMonthlyUsage = dailyAverage * 30
    
    // 조직별 잔액 및 사용률 계산
    const orgUsageMap = new Map<string, { balance: number; dailyUsage: number; name: string }>()
    
    // 현재 잔액 조회
    const orgsSnapshot = await getDocs(collection(db, 'organizations'))
    orgsSnapshot.docs.forEach(doc => {
      const data = doc.data()
      orgUsageMap.set(doc.id, {
        balance: data.creditBalance || 0,
        dailyUsage: 0,
        name: data.name
      })
    })
    
    // 조직별 일일 사용량 계산
    transactions
      .filter(tx => tx.createdAt && tx.createdAt > thirtyDaysAgo && tx.type === 'use')
      .forEach(tx => {
        const org = orgUsageMap.get(tx.organizationId)
        if (org) {
          org.dailyUsage += Math.abs(tx.amount) / 30
        }
      })
    
    // 위험 조직 식별
    const criticalOrganizations = Array.from(orgUsageMap.entries())
      .filter(([_, org]) => org.dailyUsage > 0)
      .map(([id, org]) => ({
        organizationId: id,
        organizationName: org.name,
        daysUntilDepletion: org.balance / org.dailyUsage,
        currentBalance: org.balance
      }))
      .filter(org => org.daysUntilDepletion < 30)
      .sort((a, b) => a.daysUntilDepletion - b.daysUntilDepletion)
    
    return {
      estimatedMonthlyUsage,
      criticalOrganizations
    }
  }
  
  private getWeekKey(date: Date): string {
    const year = date.getFullYear()
    const weekNumber = Math.ceil((date.getDate() + new Date(year, date.getMonth(), 1).getDay()) / 7)
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`
  }
}