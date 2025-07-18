import { BaseService } from '@core/services/BaseService'
import { db } from '@core/services/firebase'
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  QuerySnapshot,
  DocumentData 
} from 'firebase/firestore'
import enterpriseAuthService from './EnterpriseAuthService'
import { OrganizationInfo } from './CompanyService'
import { OrganizationMember } from '../types/member'
import { MeasurementUser } from '@domains/individual/services/MeasurementUserManagementService'

export interface SystemStats {
  totalOrganizations: number
  totalUsers: number
  activeUsers: number
  totalReports: number
  systemHealth: 'healthy' | 'warning' | 'error'
  uptime: string
  totalCreditsUsed: number
  monthlyGrowth: number
  todayMeasurements: number
  thisWeekMeasurements: number
  thisMonthMeasurements: number
  averageReportsPerUser: number
  totalStorageUsed: number // GB
  averageSessionDuration: number // minutes
}

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

export interface SystemActivity {
  id: string
  organizationId: string
  organizationName: string
  type: 'user_registered' | 'report_generated' | 'credit_purchased' | 'system_event' | 'error'
  description: string
  timestamp: Date
  severity: 'info' | 'warning' | 'error' | 'success'
  metadata?: Record<string, any>
}

export interface UsageAnalytics {
  period: 'today' | 'week' | 'month' | 'year'
  measurements: {
    total: number
    successful: number
    failed: number
    averageDuration: number
  }
  reports: {
    total: number
    generated: number
    downloaded: number
    shared: number
  }
  users: {
    total: number
    active: number
    newRegistrations: number
    churnRate: number
  }
  credits: {
    totalUsed: number
    averagePerReport: number
    totalRevenue: number
    topSpendingOrganizations: Array<{
      organizationId: string
      organizationName: string
      creditsUsed: number
      revenue: number
    }>
  }
  performance: {
    averageResponseTime: number // ms
    errorRate: number // percentage
    systemLoad: number // percentage
    peakUsageHour: number // 0-23
  }
}

export interface OrganizationComparison {
  organizationId: string
  organizationName: string
  metrics: {
    usersCount: number
    measurementsThisMonth: number
    reportsGenerated: number
    creditsUsed: number
    activityScore: number // 0-100
    engagementRate: number // percentage
    averageSessionLength: number // minutes
  }
  ranking: {
    overall: number
    byActivity: number
    byUsage: number
    byEngagement: number
  }
  trends: {
    userGrowth: number // percentage
    usageGrowth: number // percentage
    engagementTrend: 'up' | 'down' | 'stable'
  }
}

export class SystemAdminService extends BaseService {
  constructor() {
    super()
  }

  /**
   * 시스템 권한 확인
   */
  private validateSystemAdminAccess(): void {
    const currentUser = enterpriseAuthService.getCurrentContext().user
    if (!currentUser || currentUser.userType !== 'SYSTEM_ADMIN') {
      throw new Error('시스템 관리자 권한이 필요합니다.')
    }
  }

  /**
   * 전체 시스템 통계 조회
   */
  async getSystemStats(): Promise<SystemStats> {
    return this.measureAndLog('getSystemStats', async () => {
      this.validateSystemAdminAccess()

      try {
        // 병렬로 모든 데이터 수집
        const [
          organizations,
          allMembers,
          allMeasurementUsers,
          allReports,
          allSessions,
          creditTransactions
        ] = await Promise.allSettled([
          this.getAllOrganizations(),
          this.getAllMembers(),
          this.getAllMeasurementUsers(),
          this.getAllAIReports(),
          this.getAllMeasurementSessions(),
          this.getAllCreditTransactions()
        ])

        const orgs = organizations.status === 'fulfilled' ? organizations.value : []
        const members = allMembers.status === 'fulfilled' ? allMembers.value : []
        const users = allMeasurementUsers.status === 'fulfilled' ? allMeasurementUsers.value : []
        const reports = allReports.status === 'fulfilled' ? allReports.value : []
        const sessions = allSessions.status === 'fulfilled' ? allSessions.value : []
        const credits = creditTransactions.status === 'fulfilled' ? creditTransactions.value : []

        // 날짜 계산
        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

        // 통계 계산
        const activeUsers = users.filter(u => u.isActive && 
          u.lastMeasurementDate && 
          new Date(u.lastMeasurementDate) >= weekStart
        ).length

        const todayMeasurements = sessions.filter(s => 
          new Date(s.createdAt || s.sessionDate || 0) >= todayStart
        ).length

        const thisWeekMeasurements = sessions.filter(s => 
          new Date(s.createdAt || s.sessionDate || 0) >= weekStart
        ).length

        const thisMonthMeasurements = sessions.filter(s => 
          new Date(s.createdAt || s.sessionDate || 0) >= monthStart
        ).length

        const lastMonthMeasurements = sessions.filter(s => {
          const date = new Date(s.createdAt || s.sessionDate || 0)
          return date >= lastMonthStart && date < monthStart
        }).length

        const monthlyGrowth = lastMonthMeasurements > 0 
          ? ((thisMonthMeasurements - lastMonthMeasurements) / lastMonthMeasurements) * 100 
          : 0

        const totalCreditsUsed = credits.reduce((sum, credit) => 
          sum + (credit.amount < 0 ? Math.abs(credit.amount) : 0), 0
        )

        const averageReportsPerUser = users.length > 0 
          ? reports.length / users.length 
          : 0

        // 시스템 건강도 계산 (단순화된 버전)
        const errorRate = this.calculateErrorRate(sessions)
        const systemHealth: SystemStats['systemHealth'] = 
          errorRate < 0.05 ? 'healthy' : 
          errorRate < 0.15 ? 'warning' : 'error'

        // 평균 세션 지속시간 계산 (분)
        const validSessions = sessions.filter(s => s.duration && s.duration > 0)
        const averageSessionDuration = validSessions.length > 0
          ? validSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / validSessions.length
          : 0

        // 저장공간 사용량 계산 (GB) - 예상치
        const totalStorageUsed = (sessions.length * 2.5) / 1024 // 평균 2.5MB per session

        const stats: SystemStats = {
          totalOrganizations: orgs.length,
          totalUsers: users.length,
          activeUsers,
          totalReports: reports.length,
          systemHealth,
          uptime: '99.9%', // TODO: 실제 업타임 계산 구현 필요
          totalCreditsUsed,
          monthlyGrowth,
          todayMeasurements,
          thisWeekMeasurements,
          thisMonthMeasurements,
          averageReportsPerUser,
          totalStorageUsed,
          averageSessionDuration
        }

        this.log('시스템 통계 조회 완료', { stats })
        return stats

      } catch (error) {
        this.handleError(error, 'getSystemStats')
      }
    })
  }

  /**
   * 모든 조직 요약 정보 조회
   */
  async getAllOrganizationSummaries(): Promise<OrganizationSummary[]> {
    return this.measureAndLog('getAllOrganizationSummaries', async () => {
      this.validateSystemAdminAccess()

      try {
        const [organizations, allMembers, allUsers, allReports, allCredits] = await Promise.all([
          this.getAllOrganizations(),
          this.getAllMembers(),
          this.getAllMeasurementUsers(), 
          this.getAllAIReports(),
          this.getAllCreditTransactions()
        ])

        const summaries: OrganizationSummary[] = organizations.map(org => {
          // 조직별 멤버 필터링
          const orgMembers = allMembers.filter(m => m.organizationId === org.id)
          const orgUsers = allUsers.filter(u => u.organizationId === org.id)
          const orgReports = allReports.filter(r => r.organizationId === org.id)
          const orgCredits = allCredits.filter(c => c.organizationId === org.id)

          // 이번 달 시작 날짜
          const thisMonth = new Date()
          thisMonth.setDate(1)
          thisMonth.setHours(0, 0, 0, 0)

          // 활성 사용자 (최근 1주일 내 활동)
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          const activeUsers = orgUsers.filter(u => 
            u.isActive && 
            u.lastMeasurementDate && 
            new Date(u.lastMeasurementDate) >= weekAgo
          ).length

          // 이번 달 크레딧 사용량
          const creditsUsedThisMonth = orgCredits
            .filter(c => 
              c.amount < 0 && // 사용 트랜잭션
              new Date(c.createdAt) >= thisMonth
            )
            .reduce((sum, c) => sum + Math.abs(c.amount), 0)

          // 현재 크레딧 잔액
          const creditBalance = orgCredits.reduce((sum, c) => sum + c.amount, 0)

          // 평균 리포트 수
          const avgReportsPerUser = orgUsers.length > 0 
            ? orgReports.length / orgUsers.length 
            : 0

          // 건강도 점수 계산 (0-100)
          const healthScore = this.calculateOrganizationHealthScore({
            activeUserRatio: orgUsers.length > 0 ? activeUsers / orgUsers.length : 0,
            avgReportsPerUser,
            creditBalance,
            recentActivity: activeUsers > 0
          })

          // 마지막 활동 시간
          const lastActivity = this.getLastActivityDate(orgUsers, orgReports)

          return {
            id: org.id,
            name: org.organizationName || org.companyName || '알 수 없음',
            memberCount: orgMembers.length,
            activeUsers,
            measurementUsers: orgUsers.length,
            creditBalance,
            creditsUsedThisMonth,
            status: this.determineOrganizationStatus(org, creditBalance, activeUsers),
            lastActivity,
            createdAt: new Date(org.createdAt),
            plan: org.subscriptionPlan || 'standard',
            totalReports: orgReports.length,
            avgReportsPerUser,
            healthScore
          }
        })

        // 건강도 점수순으로 정렬
        summaries.sort((a, b) => b.healthScore - a.healthScore)

        this.log('조직 요약 정보 조회 완료', { count: summaries.length })
        return summaries

      } catch (error) {
        this.handleError(error, 'getAllOrganizationSummaries')
      }
    })
  }

  /**
   * 최근 시스템 활동 조회
   */
  async getRecentSystemActivities(limit: number = 50): Promise<SystemActivity[]> {
    return this.measureAndLog('getRecentSystemActivities', async () => {
      this.validateSystemAdminAccess()

      try {
        // 최근 활동들을 병렬로 조회
        const [recentUsers, recentReports, recentCredits, recentSessions] = await Promise.all([
          this.getRecentMeasurementUsers(limit),
          this.getRecentAIReports(limit),
          this.getRecentCreditTransactions(limit),
          this.getRecentMeasurementSessions(limit)
        ])

        const activities: SystemActivity[] = []

        // 새 사용자 등록 활동
        recentUsers.forEach(user => {
          activities.push({
            id: `user-${user.id}`,
            organizationId: user.organizationId,
            organizationName: this.getOrganizationNameFromCache(user.organizationId),
            type: 'user_registered',
            description: `새로운 측정 대상자 "${user.displayName}"가 등록되었습니다.`,
            timestamp: new Date(user.createdAt),
            severity: 'success',
            metadata: { userId: user.id, userName: user.displayName }
          })
        })

        // 리포트 생성 활동
        recentReports.forEach(report => {
          activities.push({
            id: `report-${report.id}`,
            organizationId: report.organizationId || 'unknown',
            organizationName: this.getOrganizationNameFromCache(report.organizationId),
            type: 'report_generated',
            description: `AI 리포트가 생성되었습니다: ${report.title || '제목 없음'}`,
            timestamp: new Date(report.createdAt || report.timestamp),
            severity: 'info',
            metadata: { reportId: report.id, reportType: report.reportType }
          })
        })

        // 크레딧 구매 활동
        recentCredits
          .filter(credit => credit.amount > 0) // 구매만
          .forEach(credit => {
            activities.push({
              id: `credit-${credit.id}`,
              organizationId: credit.organizationId,
              organizationName: this.getOrganizationNameFromCache(credit.organizationId),
              type: 'credit_purchased',
              description: `크레딧 ${credit.amount.toLocaleString()}개를 구매했습니다.`,
              timestamp: new Date(credit.createdAt),
              severity: 'success',
              metadata: { 
                amount: credit.amount, 
                transactionType: credit.transactionType,
                reason: credit.reason 
              }
            })
          })

        // 시간순으로 정렬
        activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

        // 최대 개수 제한
        const limitedActivities = activities.slice(0, limit)

        this.log('최근 시스템 활동 조회 완료', { count: limitedActivities.length })
        return limitedActivities

      } catch (error) {
        this.handleError(error, 'getRecentSystemActivities')
      }
    })
  }

  /**
   * 사용량 분석 데이터 조회
   */
  async getUsageAnalytics(period: UsageAnalytics['period']): Promise<UsageAnalytics> {
    return this.measureAndLog('getUsageAnalytics', async () => {
      this.validateSystemAdminAccess()

      try {
        // 기간별 날짜 범위 계산
        const dateRange = this.calculateDateRange(period)
        
        const [sessions, reports, users, credits] = await Promise.all([
          this.getMeasurementSessionsInRange(dateRange.start, dateRange.end),
          this.getAIReportsInRange(dateRange.start, dateRange.end),
          this.getMeasurementUsersInRange(dateRange.start, dateRange.end),
          this.getCreditTransactionsInRange(dateRange.start, dateRange.end)
        ])

        // 측정 통계
        const measurements = {
          total: sessions.length,
          successful: sessions.filter(s => s.status === 'completed').length,
          failed: sessions.filter(s => s.status === 'failed').length,
          averageDuration: this.calculateAverageDuration(sessions)
        }

        // 리포트 통계
        const reportsStats = {
          total: reports.length,
          generated: reports.filter(r => r.status === 'completed').length,
          downloaded: reports.reduce((sum, r) => sum + (r.downloadCount || 0), 0),
          shared: reports.filter(r => r.sharedWith && r.sharedWith.length > 0).length
        }

        // 사용자 통계
        const userStats = {
          total: users.length,
          active: users.filter(u => u.isActive).length,
          newRegistrations: users.filter(u => 
            new Date(u.createdAt) >= dateRange.start
          ).length,
          churnRate: this.calculateChurnRate(users, dateRange)
        }

        // 크레딧 통계
        const creditStats = await this.calculateCreditAnalytics(credits)

        // 성능 지표 (모의 데이터 - 실제 구현 시 모니터링 시스템 연동 필요)
        const performance = {
          averageResponseTime: Math.random() * 500 + 200, // 200-700ms
          errorRate: Math.random() * 5, // 0-5%
          systemLoad: Math.random() * 80 + 20, // 20-100%
          peakUsageHour: Math.floor(Math.random() * 24) // 0-23
        }

        const analytics: UsageAnalytics = {
          period,
          measurements,
          reports: reportsStats,
          users: userStats,
          credits: creditStats,
          performance
        }

        this.log('사용량 분석 완료', { period, analytics })
        return analytics

      } catch (error) {
        this.handleError(error, 'getUsageAnalytics')
      }
    })
  }

  /**
   * 조직 비교 분석
   */
  async getOrganizationComparison(): Promise<OrganizationComparison[]> {
    return this.measureAndLog('getOrganizationComparison', async () => {
      this.validateSystemAdminAccess()

      try {
        const summaries = await this.getAllOrganizationSummaries()
        
        const comparisons: OrganizationComparison[] = summaries.map((org, index) => {
          // 활동 점수 계산 (0-100)
          const activityScore = this.calculateActivityScore(org)
          
          // 참여율 계산
          const engagementRate = org.measurementUsers > 0 
            ? (org.activeUsers / org.measurementUsers) * 100 
            : 0

          // 평균 세션 길이 (모의 데이터)
          const averageSessionLength = Math.random() * 20 + 10 // 10-30분

          return {
            organizationId: org.id,
            organizationName: org.name,
            metrics: {
              usersCount: org.measurementUsers,
              measurementsThisMonth: org.creditsUsedThisMonth, // 근사치
              reportsGenerated: org.totalReports,
              creditsUsed: org.creditsUsedThisMonth,
              activityScore,
              engagementRate,
              averageSessionLength
            },
            ranking: {
              overall: index + 1,
              byActivity: this.calculateRanking(summaries, 'activity', org.id),
              byUsage: this.calculateRanking(summaries, 'usage', org.id),
              byEngagement: this.calculateRanking(summaries, 'engagement', org.id)
            },
            trends: {
              userGrowth: Math.random() * 40 - 10, // -10% to +30%
              usageGrowth: Math.random() * 50 - 5, // -5% to +45%
              engagementTrend: this.calculateEngagementTrend(org)
            }
          }
        })

        this.log('조직 비교 분석 완료', { count: comparisons.length })
        return comparisons

      } catch (error) {
        this.handleError(error, 'getOrganizationComparison')
      }
    })
  }

  // ========================
  // Private Helper Methods
  // ========================

  private async getAllOrganizations(): Promise<any[]> {
    const snapshot = await getDocs(collection(db, 'organizations'))
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  }

  private async getAllMembers(): Promise<OrganizationMember[]> {
    const snapshot = await getDocs(collection(db, 'members'))
    return snapshot.docs.map(doc => {
      const data = doc.data()
      return { 
        id: doc.id, 
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date()
      } as OrganizationMember
    })
  }

  // Helper function to convert Firebase timestamp to Date
  private convertTimestamp(timestamp: any): Date {
    if (!timestamp) return new Date()
    if (timestamp instanceof Date) return timestamp
    if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate()
    }
    return new Date(timestamp)
  }

  private async getAllMeasurementUsers(): Promise<MeasurementUser[]> {
    const snapshot = await getDocs(collection(db, 'measurementUsers'))
    return snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: this.convertTimestamp(data.createdAt),
        updatedAt: this.convertTimestamp(data.updatedAt),
        lastMeasurementDate: data.lastMeasurementDate ? this.convertTimestamp(data.lastMeasurementDate) : undefined,
        nextScheduledDate: data.nextScheduledDate ? this.convertTimestamp(data.nextScheduledDate) : undefined,
        lastReportDate: data.lastReportDate ? this.convertTimestamp(data.lastReportDate) : undefined,
        tokenExpiresAt: data.tokenExpiresAt ? this.convertTimestamp(data.tokenExpiresAt) : undefined
      } as MeasurementUser
    })
  }

  private async getAllAIReports(): Promise<any[]> {
    const snapshot = await getDocs(collection(db, 'ai_analysis_results'))
    return snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: this.convertTimestamp(data.createdAt || data.timestamp)
      }
    })
  }

  private async getAllMeasurementSessions(): Promise<any[]> {
    const snapshot = await getDocs(collection(db, 'measurementSessions'))
    return snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: this.convertTimestamp(data.createdAt),
        sessionDate: data.sessionDate ? this.convertTimestamp(data.sessionDate) : undefined
      }
    })
  }

  private async getAllCreditTransactions(): Promise<any[]> {
    const snapshot = await getDocs(collection(db, 'creditTransactions'))
    return snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: this.convertTimestamp(data.createdAt)
      }
    })
  }

  private calculateErrorRate(sessions: any[]): number {
    if (sessions.length === 0) return 0
    const failedSessions = sessions.filter(s => s.status === 'failed').length
    return failedSessions / sessions.length
  }

  private calculateOrganizationHealthScore(factors: {
    activeUserRatio: number
    avgReportsPerUser: number
    creditBalance: number
    recentActivity: boolean
  }): number {
    let score = 0
    
    // 활성 사용자 비율 (40점)
    score += factors.activeUserRatio * 40
    
    // 평균 리포트 수 (30점) - 10개 이상이면 만점
    score += Math.min(factors.avgReportsPerUser / 10, 1) * 30
    
    // 크레딧 잔액 (20점) - 1000개 이상이면 만점
    score += Math.min(factors.creditBalance / 1000, 1) * 20
    
    // 최근 활동 여부 (10점)
    score += factors.recentActivity ? 10 : 0
    
    return Math.round(score)
  }

  private getLastActivityDate(users: MeasurementUser[], reports: any[]): Date {
    const userDates = users
      .map(u => u.lastMeasurementDate)
      .filter(d => d)
      .map(d => new Date(d!))
    
    const reportDates = reports
      .map(r => r.createdAt)
      .filter(d => d)
      .map(d => new Date(d))
    
    const allDates = [...userDates, ...reportDates]
    
    return allDates.length > 0 
      ? new Date(Math.max(...allDates.map(d => d.getTime())))
      : new Date()
  }

  private determineOrganizationStatus(
    org: any, 
    creditBalance: number, 
    activeUsers: number
  ): OrganizationSummary['status'] {
    if (org.status === 'suspended') return 'suspended'
    if (org.subscriptionPlan === 'trial' || creditBalance < 100) return 'trial'
    return 'active'
  }

  private getOrganizationNameFromCache(organizationId: string): string {
    // TODO: 조직 이름 캐시 구현
    return '조직명 조회 중...'
  }

  private async getRecentMeasurementUsers(limit: number): Promise<MeasurementUser[]> {
    const q = query(
      collection(db, 'measurementUsers'),
      orderBy('createdAt', 'desc'),
      limit(limit)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date()
      } as MeasurementUser
    })
  }

  private async getRecentAIReports(limit: number): Promise<any[]> {
    const q = query(
      collection(db, 'ai_analysis_results'),
      orderBy('createdAt', 'desc'),
      limit(limit)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: this.toDate(doc.data().createdAt)
    }))
  }

  private async getRecentCreditTransactions(limit: number): Promise<any[]> {
    const q = query(
      collection(db, 'creditTransactions'),
      orderBy('createdAt', 'desc'),
      limit(limit)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: this.toDate(doc.data().createdAt)
    }))
  }

  private async getRecentMeasurementSessions(limit: number): Promise<any[]> {
    const q = query(
      collection(db, 'measurementSessions'),
      orderBy('createdAt', 'desc'),
      limit(limit)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: this.toDate(doc.data().createdAt)
    }))
  }

  private calculateDateRange(period: UsageAnalytics['period']): { start: Date; end: Date } {
    const now = new Date()
    const end = new Date(now)
    let start = new Date(now)

    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0)
        break
      case 'week':
        start.setDate(now.getDate() - 7)
        break
      case 'month':
        start.setMonth(now.getMonth() - 1)
        break
      case 'year':
        start.setFullYear(now.getFullYear() - 1)
        break
    }

    return { start, end }
  }

  private async getMeasurementSessionsInRange(start: Date, end: Date): Promise<any[]> {
    const q = query(
      collection(db, 'measurementSessions'),
      where('createdAt', '>=', Timestamp.fromDate(start)),
      where('createdAt', '<=', Timestamp.fromDate(end))
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: this.toDate(doc.data().createdAt)
    }))
  }

  private async getAIReportsInRange(start: Date, end: Date): Promise<any[]> {
    const q = query(
      collection(db, 'ai_analysis_results'),
      where('createdAt', '>=', Timestamp.fromDate(start)),
      where('createdAt', '<=', Timestamp.fromDate(end))
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: this.toDate(doc.data().createdAt)
    }))
  }

  private async getMeasurementUsersInRange(start: Date, end: Date): Promise<MeasurementUser[]> {
    const q = query(
      collection(db, 'measurementUsers'),
      where('createdAt', '>=', Timestamp.fromDate(start)),
      where('createdAt', '<=', Timestamp.fromDate(end))
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: this.toDate(doc.data().createdAt)
    } as MeasurementUser))
  }

  private async getCreditTransactionsInRange(start: Date, end: Date): Promise<any[]> {
    const q = query(
      collection(db, 'creditTransactions'),
      where('createdAt', '>=', Timestamp.fromDate(start)),
      where('createdAt', '<=', Timestamp.fromDate(end))
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: this.toDate(doc.data().createdAt)
    }))
  }

  private calculateAverageDuration(sessions: any[]): number {
    const validSessions = sessions.filter(s => s.duration && s.duration > 0)
    if (validSessions.length === 0) return 0
    
    const totalDuration = validSessions.reduce((sum, s) => sum + s.duration, 0)
    return totalDuration / validSessions.length
  }

  private calculateChurnRate(users: MeasurementUser[], dateRange: { start: Date; end: Date }): number {
    // 단순화된 이탈률 계산
    const inactiveUsers = users.filter(u => !u.isActive).length
    return users.length > 0 ? (inactiveUsers / users.length) * 100 : 0
  }

  private async calculateCreditAnalytics(credits: any[]): Promise<UsageAnalytics['credits']> {
    const totalUsed = credits
      .filter(c => c.amount < 0)
      .reduce((sum, c) => sum + Math.abs(c.amount), 0)

    const reportCount = credits.filter(c => c.reason?.includes('report')).length
    const averagePerReport = reportCount > 0 ? totalUsed / reportCount : 0

    const totalRevenue = credits
      .filter(c => c.amount > 0)
      .reduce((sum, c) => sum + (c.amount * 7.9), 0) // 평균 7,900원 per credit

    // 조직별 지출 통계 (상위 5개)
    const orgSpending = new Map<string, { name: string; credits: number; revenue: number }>()
    
    credits.forEach(credit => {
      if (credit.amount < 0 && credit.organizationId) {
        const current = orgSpending.get(credit.organizationId) || 
          { name: '조직명 조회 중...', credits: 0, revenue: 0 }
        
        current.credits += Math.abs(credit.amount)
        current.revenue += Math.abs(credit.amount) * 7.9
        
        orgSpending.set(credit.organizationId, current)
      }
    })

    const topSpendingOrganizations = Array.from(orgSpending.entries())
      .map(([orgId, data]) => ({
        organizationId: orgId,
        organizationName: data.name,
        creditsUsed: data.credits,
        revenue: data.revenue
      }))
      .sort((a, b) => b.creditsUsed - a.creditsUsed)
      .slice(0, 5)

    return {
      totalUsed,
      averagePerReport,
      totalRevenue,
      topSpendingOrganizations
    }
  }

  private calculateActivityScore(org: OrganizationSummary): number {
    // 활동 점수는 여러 요소를 종합하여 계산
    let score = 0
    
    // 사용자 활동 (40점)
    if (org.measurementUsers > 0) {
      score += (org.activeUsers / org.measurementUsers) * 40
    }
    
    // 리포트 생성 활동 (30점)
    score += Math.min(org.avgReportsPerUser / 5, 1) * 30
    
    // 크레딧 사용 활동 (20점)
    score += Math.min(org.creditsUsedThisMonth / 1000, 1) * 20
    
    // 최근 활동 (10점)
    const daysSinceLastActivity = (Date.now() - org.lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    score += Math.max(0, (7 - daysSinceLastActivity) / 7) * 10
    
    return Math.round(score)
  }

  private calculateRanking(
    summaries: OrganizationSummary[], 
    type: 'activity' | 'usage' | 'engagement', 
    orgId: string
  ): number {
    let sortedOrgs: OrganizationSummary[]
    
    switch (type) {
      case 'activity':
        sortedOrgs = [...summaries].sort((a, b) => 
          this.calculateActivityScore(b) - this.calculateActivityScore(a)
        )
        break
      case 'usage':
        sortedOrgs = [...summaries].sort((a, b) => 
          b.creditsUsedThisMonth - a.creditsUsedThisMonth
        )
        break
      case 'engagement':
        sortedOrgs = [...summaries].sort((a, b) => {
          const aEngagement = a.measurementUsers > 0 ? a.activeUsers / a.measurementUsers : 0
          const bEngagement = b.measurementUsers > 0 ? b.activeUsers / b.measurementUsers : 0
          return bEngagement - aEngagement
        })
        break
    }
    
    return sortedOrgs.findIndex(org => org.id === orgId) + 1
  }

  private calculateEngagementTrend(org: OrganizationSummary): 'up' | 'down' | 'stable' {
    // 단순화된 트렌드 계산 (실제로는 이전 기간과 비교 필요)
    const engagementRate = org.measurementUsers > 0 ? org.activeUsers / org.measurementUsers : 0
    
    if (engagementRate > 0.7) return 'up'
    if (engagementRate < 0.3) return 'down'
    return 'stable'
  }
}

const systemAdminService = new SystemAdminService()
export default systemAdminService 