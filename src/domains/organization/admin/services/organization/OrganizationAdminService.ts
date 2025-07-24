/**
 * 조직 관리 서비스
 * 
 * 조직(기업) 관련 모든 관리 기능을 담당합니다.
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
  serverTimestamp,
  Timestamp,
  runTransaction
} from 'firebase/firestore'
import { db } from '@core/services/firebase'
import { OrganizationInfo } from '../../../services/CompanyService'
import { OrganizationSize } from '../../../types/organization'

export interface OrganizationSummary {
  id: string
  name: string
  memberCount: number
  activeUsers: number
  measurementUsers: number
  creditBalance: number
  creditsUsedThisMonth: number
  status: 'active' | 'trial' | 'suspended'
  lastActivity: Date
  createdAt: Date
  plan: string
  totalReports: number
  avgReportsPerUser: number
  healthScore: number // 0-100
}

export interface EnterpriseOverview {
  id: string
  organizationName: string
  adminEmail: string
  createdAt: Date
  memberStats: {
    totalMembers: number
    activeMembers: number
    measurementUsers: number
    adminCount: number
  }
  creditStats: {
    balance: number
    monthlyUsage: number
    lastPurchase: Date | null
    grantedCredits: number
  }
  deviceStats: {
    totalDevices: number
    assignedDevices: number
    activeDevices: number
  }
  reportStats: {
    totalReports: number
    monthlyReports: number
    avgReportsPerUser: number
  }
  status: 'active' | 'trial' | 'suspended'
  plan: string
  recentActivity: {
    lastMeasurement: Date | null
    lastReport: Date | null
    lastLogin: Date | null
  }
}

export interface EnterpriseManagementAction {
  organizationId: string
  actionType: 'suspend' | 'activate' | 'grant_credits' | 'extend_trial' | 'change_plan'
  parameters?: {
    amount?: number
    duration?: number
    newPlan?: string
    reason?: string
  }
}

export class OrganizationAdminService extends BaseAdminService {
  protected getServiceName(): string {
    return 'OrganizationAdminService'
  }
  
  /**
   * 모든 조직 요약 정보 조회
   */
  async getAllOrganizationSummaries(): Promise<OrganizationSummary[]> {
    await this.requirePermission(Permission.READ_ORGANIZATIONS)
    
    try {
      
      const organizations = await this.getAllOrganizations()
      const summaries: OrganizationSummary[] = []
      
      for (const org of organizations) {
        try {
          const summary = await this.buildOrganizationSummary(org)
          summaries.push(summary)
        } catch (error) {
            metadata: { organizationId: org.id }
        }
      }
      
        metadata: { count: summaries.length }
      
      return summaries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      
    } catch (error) {
      throw error
    }
  }
  
  /**
   * 조직 상세 정보 조회
   */
  async getOrganizationDetails(organizationId: string): Promise<EnterpriseOverview> {
    await this.requirePermission(Permission.READ_ORGANIZATIONS)
    
    try {
      const orgDoc = await getDoc(doc(db, 'organizations', organizationId))
      if (!orgDoc.exists()) {
        throw new Error('조직을 찾을 수 없습니다')
      }
      
      const orgData = orgDoc.data() as OrganizationInfo
      const overview = await this.buildEnterpriseOverview(organizationId, orgData)
      
      await this.createAuditLog('view_organization', 'organization', 'success', {
        organizationId
      })
      
      return overview
      
    } catch (error) {
        metadata: { organizationId }
      
      await this.createAuditLog('view_organization', 'organization', 'failure', {
        organizationId,
        error: (error as Error).message
      })
      
      throw error
    }
  }
  
  /**
   * 조직 관리 액션 실행
   */
  async executeManagementAction(action: EnterpriseManagementAction): Promise<boolean> {
    await this.requirePermission(Permission.WRITE_ORGANIZATIONS)
    
    const { organizationId, actionType, parameters } = action
    
    try {
        metadata: { organizationId, actionType }
      
      const result = await runTransaction(db, async (transaction) => {
        const orgRef = doc(db, 'organizations', organizationId)
        const orgDoc = await transaction.get(orgRef)
        
        if (!orgDoc.exists()) {
          throw new Error('조직을 찾을 수 없습니다')
        }
        
        const updates: any = {
          updatedAt: serverTimestamp()
        }
        
        switch (actionType) {
          case 'suspend':
            updates.status = 'suspended'
            updates.suspendedAt = serverTimestamp()
            updates.suspendReason = parameters?.reason || 'System admin action'
            break
            
          case 'activate':
            updates.status = 'active'
            updates.suspendedAt = null
            updates.suspendReason = null
            break
            
          case 'change_plan':
            if (!parameters?.newPlan) {
              throw new Error('새 플랜이 지정되지 않았습니다')
            }
            updates.plan = parameters.newPlan
            break
        }
        
        transaction.update(orgRef, updates)
        return true
      })
      
      await this.createAuditLog(`organization_${actionType}`, 'organization', 'success', {
        organizationId,
        parameters
      })
      
      return result
      
    } catch (error) {
        metadata: { organizationId, actionType }
      
      await this.createAuditLog(`organization_${actionType}`, 'organization', 'failure', {
        organizationId,
        parameters,
        error: (error as Error).message
      })
      
      throw error
    }
  }
  
  /**
   * 최근 조직 등록 현황
   */
  async getRecentRegistrations(days: number = 30): Promise<Array<{
    id: string
    name: string
    adminEmail: string
    registeredAt: Date
    size: OrganizationSize
    plan: string
    initialCredits: number
  }>> {
    await this.requirePermission(Permission.READ_ORGANIZATIONS)
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    try {
      const orgsQuery = query(
        collection(db, 'organizations'),
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        orderBy('createdAt', 'desc')
      )
      
      const snapshot = await getDocs(orgsQuery)
      const registrations = []
      
      for (const doc of snapshot.docs) {
        const data = doc.data() as OrganizationInfo
        
        // 관리자 정보 가져오기
        const adminsQuery = query(
          collection(db, 'organization_members'),
          where('organizationId', '==', doc.id),
          where('role', '==', 'admin')
        )
        const adminsSnapshot = await getDocs(adminsQuery)
        const adminEmail = adminsSnapshot.docs[0]?.data()?.email || 'Unknown'
        
        registrations.push({
          id: doc.id,
          name: data.name,
          adminEmail,
          registeredAt: this.convertTimestamp(data.createdAt) || new Date(),
          size: data.size,
          plan: data.plan || 'trial',
          initialCredits: 100 // TODO: 실제 초기 크레딧 정보 조회
        })
      }
      
      return registrations
      
    } catch (error) {
      throw error
    }
  }
  
  // Private 헬퍼 메서드들
  
  private async getAllOrganizations(): Promise<any[]> {
    const snapshot = await getDocs(collection(db, 'organizations'))
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  }
  
  private async buildOrganizationSummary(org: any): Promise<OrganizationSummary> {
    // 멤버 수 조회
    const membersQuery = query(
      collection(db, 'organization_members'),
      where('organizationId', '==', org.id)
    )
    const membersSnapshot = await getDocs(membersQuery)
    const memberCount = membersSnapshot.size
    
    // 활성 사용자 수 (최근 7일 내 활동)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    let activeUsers = 0
    membersSnapshot.docs.forEach(doc => {
      const lastActivity = this.convertTimestamp(doc.data().lastActivity)
      if (lastActivity && lastActivity > sevenDaysAgo) {
        activeUsers++
      }
    })
    
    // 측정 사용자 수
    const measurementUsersQuery = query(
      collection(db, 'measurement_users'),
      where('organizationId', '==', org.id)
    )
    const measurementUsersSnapshot = await getDocs(measurementUsersQuery)
    const measurementUsers = measurementUsersSnapshot.size
    
    // 크레딧 정보
    const creditBalance = org.creditBalance || 0
    const creditsUsedThisMonth = await this.getMonthlyCreditsUsed(org.id)
    
    // 리포트 통계
    const reportsQuery = query(
      collection(db, 'ai_analysis_results'),
      where('organizationId', '==', org.id)
    )
    const reportsSnapshot = await getDocs(reportsQuery)
    const totalReports = reportsSnapshot.size
    const avgReportsPerUser = measurementUsers > 0 ? totalReports / measurementUsers : 0
    
    // 건강 점수 계산
    const healthScore = this.calculateOrganizationHealthScore({
      activeUserRatio: memberCount > 0 ? activeUsers / memberCount : 0,
      creditBalance,
      recentActivity: org.lastActivity,
      avgReportsPerUser
    })
    
    return {
      id: org.id,
      name: org.name,
      memberCount,
      activeUsers,
      measurementUsers,
      creditBalance,
      creditsUsedThisMonth,
      status: org.status || 'active',
      lastActivity: this.convertTimestamp(org.lastActivity) || new Date(),
      createdAt: this.convertTimestamp(org.createdAt) || new Date(),
      plan: org.plan || 'trial',
      totalReports,
      avgReportsPerUser,
      healthScore
    }
  }
  
  private async buildEnterpriseOverview(organizationId: string, orgData: OrganizationInfo): Promise<EnterpriseOverview> {
    // 멤버 통계
    const memberStats = await this.getOrganizationMemberStats(organizationId)
    
    // 크레딧 통계
    const creditStats = await this.getOrganizationCreditStats(organizationId, orgData)
    
    // 디바이스 통계
    const deviceStats = await this.getOrganizationDeviceStats(organizationId)
    
    // 리포트 통계
    const reportStats = await this.getOrganizationReportStats(organizationId)
    
    // 최근 활동
    const recentActivity = await this.getRecentOrganizationActivity(organizationId)
    
    return {
      id: organizationId,
      organizationName: orgData.name,
      adminEmail: '', // TODO: 관리자 이메일 조회
      createdAt: this.convertTimestamp(orgData.createdAt) || new Date(),
      memberStats,
      creditStats,
      deviceStats,
      reportStats,
      status: orgData.status || 'active',
      plan: orgData.plan || 'trial',
      recentActivity
    }
  }
  
  private async getMonthlyCreditsUsed(organizationId: string): Promise<number> {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const creditsQuery = query(
      collection(db, 'credit_transactions'),
      where('organizationId', '==', organizationId),
      where('type', '==', 'use'),
      where('createdAt', '>=', Timestamp.fromDate(startOfMonth))
    )
    
    const snapshot = await getDocs(creditsQuery)
    return snapshot.docs.reduce((sum, doc) => sum + Math.abs(doc.data().amount || 0), 0)
  }
  
  private calculateOrganizationHealthScore(factors: {
    activeUserRatio: number
    creditBalance: number
    recentActivity: any
    avgReportsPerUser: number
  }): number {
    let score = 0
    
    // 활성 사용자 비율 (30점)
    score += factors.activeUserRatio * 30
    
    // 크레딧 잔액 (20점)
    if (factors.creditBalance >= 100) score += 20
    else if (factors.creditBalance >= 50) score += 15
    else if (factors.creditBalance >= 20) score += 10
    else if (factors.creditBalance >= 10) score += 5
    
    // 최근 활동 (30점)
    const lastActivity = this.convertTimestamp(factors.recentActivity)
    if (lastActivity) {
      const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceActivity < 1) score += 30
      else if (daysSinceActivity < 7) score += 20
      else if (daysSinceActivity < 30) score += 10
    }
    
    // 사용자당 평균 리포트 수 (20점)
    if (factors.avgReportsPerUser >= 5) score += 20
    else if (factors.avgReportsPerUser >= 3) score += 15
    else if (factors.avgReportsPerUser >= 1) score += 10
    else if (factors.avgReportsPerUser > 0) score += 5
    
    return Math.round(score)
  }
  
  private async getOrganizationMemberStats(organizationId: string) {
    const membersQuery = query(
      collection(db, 'organization_members'),
      where('organizationId', '==', organizationId)
    )
    const snapshot = await getDocs(membersQuery)
    
    const stats = {
      totalMembers: snapshot.size,
      activeMembers: 0,
      measurementUsers: 0,
      adminCount: 0
    }
    
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    snapshot.docs.forEach(doc => {
      const data = doc.data()
      if (data.role === 'admin') stats.adminCount++
      
      const lastActivity = this.convertTimestamp(data.lastActivity)
      if (lastActivity && lastActivity > sevenDaysAgo) {
        stats.activeMembers++
      }
    })
    
    // 측정 사용자 수
    const measurementUsersQuery = query(
      collection(db, 'measurement_users'),
      where('organizationId', '==', organizationId)
    )
    const measurementSnapshot = await getDocs(measurementUsersQuery)
    stats.measurementUsers = measurementSnapshot.size
    
    return stats
  }
  
  private async getOrganizationCreditStats(organizationId: string, orgData: any) {
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    
    // 이번 달 사용량
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
    
    // 마지막 구매
    const purchaseQuery = query(
      collection(db, 'credit_transactions'),
      where('organizationId', '==', organizationId),
      where('type', '==', 'purchase'),
      orderBy('createdAt', 'desc')
    )
    const purchaseSnapshot = await getDocs(purchaseQuery)
    const lastPurchase = purchaseSnapshot.docs[0]
      ? this.convertTimestamp(purchaseSnapshot.docs[0].data().createdAt)
      : null
    
    // 부여된 크레딧
    const grantQuery = query(
      collection(db, 'credit_transactions'),
      where('organizationId', '==', organizationId),
      where('type', '==', 'grant')
    )
    const grantSnapshot = await getDocs(grantQuery)
    const grantedCredits = grantSnapshot.docs.reduce((sum, doc) => 
      sum + Math.abs(doc.data().amount || 0), 0
    )
    
    return {
      balance: orgData.creditBalance || 0,
      monthlyUsage,
      lastPurchase,
      grantedCredits
    }
  }
  
  private async getOrganizationDeviceStats(organizationId: string) {
    const devicesQuery = query(
      collection(db, 'organization_devices'),
      where('organizationId', '==', organizationId)
    )
    const snapshot = await getDocs(devicesQuery)
    
    const stats = {
      totalDevices: snapshot.size,
      assignedDevices: 0,
      activeDevices: 0
    }
    
    snapshot.docs.forEach(doc => {
      const data = doc.data()
      if (data.assignedTo) stats.assignedDevices++
      if (data.status === 'active') stats.activeDevices++
    })
    
    return stats
  }
  
  private async getOrganizationReportStats(organizationId: string) {
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    
    // 전체 리포트
    const allReportsQuery = query(
      collection(db, 'ai_analysis_results'),
      where('organizationId', '==', organizationId)
    )
    const allReportsSnapshot = await getDocs(allReportsQuery)
    
    // 이번 달 리포트
    const monthlyReportsQuery = query(
      collection(db, 'ai_analysis_results'),
      where('organizationId', '==', organizationId),
      where('createdAt', '>=', Timestamp.fromDate(monthStart))
    )
    const monthlyReportsSnapshot = await getDocs(monthlyReportsQuery)
    
    // 측정 사용자 수
    const measurementUsersQuery = query(
      collection(db, 'measurement_users'),
      where('organizationId', '==', organizationId)
    )
    const measurementUsersSnapshot = await getDocs(measurementUsersQuery)
    const measurementUsers = measurementUsersSnapshot.size
    
    return {
      totalReports: allReportsSnapshot.size,
      monthlyReports: monthlyReportsSnapshot.size,
      avgReportsPerUser: measurementUsers > 0 
        ? allReportsSnapshot.size / measurementUsers 
        : 0
    }
  }
  
  private async getRecentOrganizationActivity(organizationId: string) {
    // 최근 측정
    const measurementQuery = query(
      collection(db, 'measurement_sessions'),
      where('organizationId', '==', organizationId),
      orderBy('createdAt', 'desc')
    )
    const measurementSnapshot = await getDocs(measurementQuery)
    const lastMeasurement = measurementSnapshot.docs[0]
      ? this.convertTimestamp(measurementSnapshot.docs[0].data().createdAt)
      : null
    
    // 최근 리포트
    const reportQuery = query(
      collection(db, 'ai_analysis_results'),
      where('organizationId', '==', organizationId),
      orderBy('createdAt', 'desc')
    )
    const reportSnapshot = await getDocs(reportQuery)
    const lastReport = reportSnapshot.docs[0]
      ? this.convertTimestamp(reportSnapshot.docs[0].data().createdAt)
      : null
    
    // 최근 로그인 (멤버들의 최근 활동)
    const memberQuery = query(
      collection(db, 'organization_members'),
      where('organizationId', '==', organizationId),
      orderBy('lastActivity', 'desc')
    )
    const memberSnapshot = await getDocs(memberQuery)
    const lastLogin = memberSnapshot.docs[0]
      ? this.convertTimestamp(memberSnapshot.docs[0].data().lastActivity)
      : null
    
    return {
      lastMeasurement,
      lastReport,
      lastLogin
    }
  }
}