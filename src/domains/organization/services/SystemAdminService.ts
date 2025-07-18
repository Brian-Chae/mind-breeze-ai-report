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

// 새로운 타입 정의들 - 4단계 3,4번용
export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  uptime: number // seconds
  services: {
    database: 'up' | 'down' | 'degraded'
    storage: 'up' | 'down' | 'degraded'
    authentication: 'up' | 'down' | 'degraded'
    aiEngine: 'up' | 'down' | 'degraded'
  }
  performance: {
    cpuUsage: number // percentage
    memoryUsage: number // percentage
    diskUsage: number // percentage
    networkLatency: number // ms
  }
  alerts: Array<{
    id: string
    type: 'warning' | 'error' | 'critical'
    message: string
    timestamp: Date
    resolved: boolean
  }>
  lastCheck: Date
}

export interface ErrorLog {
  id: string
  timestamp: Date
  level: 'error' | 'warning' | 'info'
  service: string
  message: string
  stackTrace?: string
  organizationId?: string
  userId?: string
  metadata?: Record<string, any>
  resolved: boolean
  resolvedBy?: string
  resolvedAt?: Date
}

export interface PerformanceMetrics {
  timestamp: Date
  responseTime: {
    average: number // ms
    p95: number // ms
    p99: number // ms
  }
  throughput: {
    requestsPerSecond: number
    reportsPerHour: number
    measurementsPerHour: number
  }
  errorRate: number // percentage
  resourceUsage: {
    cpu: number // percentage
    memory: number // percentage
    storage: number // GB
  }
  userMetrics: {
    activeUsers: number
    concurrentSessions: number
    averageSessionDuration: number // minutes
  }
}

export interface OrganizationCreditInfo {
  organizationId: string
  organizationName: string
  creditBalance: number
  creditLimit: number
  usageThisMonth: number
  freeCreditsGranted: number
  freeCreditsUsed: number
  freeCreditsExpiry?: Date
  plan: 'trial' | 'basic' | 'premium' | 'enterprise'
  autoRecharge: boolean
  autoRechargeThreshold: number
  status: 'active' | 'suspended' | 'limitReached'
  lastActivity: Date
  usageHistory: Array<{
    date: Date
    creditsUsed: number
    reportCount: number
    averageCostPerReport: number
  }>
  alerts: Array<{
    type: 'lowBalance' | 'limitReached' | 'unusualUsage'
    message: string
    timestamp: Date
    acknowledged: boolean
  }>
}

export interface CreditManagementAction {
  organizationId: string
  action: 'grant' | 'suspend' | 'limit' | 'alert'
  amount?: number
  reason: string
  expiryDate?: Date
  sendNotification: boolean
}

export interface SystemSettings {
  maintenanceMode: boolean
  globalCreditLimits: {
    maxFreeCredits: number
    maxCreditBalance: number
    defaultAutoRechargeThreshold: number
  }
  alertThresholds: {
    errorRate: number // percentage
    responseTime: number // ms
    lowCreditBalance: number // credits
    unusualUsage: number // multiplier
  }
  systemLimits: {
    maxUsersPerOrganization: number
    maxReportsPerMonth: number
    maxStoragePerOrganization: number // GB
  }
  businessRules: {
    freeTrialDuration: number // days
    freeTrialCredits: number
    creditPricing: Record<string, number>
    volumeDiscounts: Array<{
      minCredits: number
      discountPercentage: number
    }>
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

  // ============================================
  // 4단계 3번: 시스템 모니터링 기능
  // ============================================

  /**
   * 시스템 상태 및 건강도 조회
   */
  async getSystemHealth(): Promise<SystemHealth> {
    return this.measureAndLog('getSystemHealth', async () => {
      this.validateSystemAdminAccess()
      
      try {
        // 시스템 서비스 상태 체크
        const services = await this.checkSystemServices()
        
        // 성능 지표 체크
        const performance = await this.getSystemPerformance()
        
        // 활성 알림 조회
        const alerts = await this.getActiveAlerts()
        
        // 전체 시스템 상태 결정
        const status = this.determineSystemStatus(services, performance, alerts)
        
        const systemHealth: SystemHealth = {
          status,
          uptime: this.calculateUptime(),
          services,
          performance,
          alerts,
          lastCheck: new Date()
        }
        
                 this.log('info', '시스템 상태 조회 완료', { 
           status, 
           serviceCount: Object.keys(services).length,
           alertCount: alerts.filter(a => !a.resolved).length 
         })
         
         return systemHealth
         
       } catch (error) {
         this.log('error', '시스템 상태 조회 실패', { 
           error: error instanceof Error ? error.message : String(error) 
         })
         throw error
      }
    })
  }

  /**
   * 에러 로그 조회
   */
  async getErrorLogs(timeRange: { start: Date; end: Date }, limit: number = 100): Promise<ErrorLog[]> {
    return this.measureAndLog('getErrorLogs', async () => {
      this.validateSystemAdminAccess()
      
      try {
        // Firestore에서 에러 로그 조회 (실제 구현에서는 전용 로깅 시스템 사용)
        const q = query(
          collection(db, 'systemLogs'),
          where('level', 'in', ['error', 'warning']),
          where('timestamp', '>=', Timestamp.fromDate(timeRange.start)),
          where('timestamp', '<=', Timestamp.fromDate(timeRange.end)),
          orderBy('timestamp', 'desc'),
          limit(limit)
        )
        
        const snapshot = await getDocs(q)
        const errorLogs: ErrorLog[] = snapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            timestamp: this.toDate(data.timestamp)
          } as ErrorLog
        })
        
        this.log('info', '에러 로그 조회 완료', { 
          count: errorLogs.length,
          timeRange: `${timeRange.start.toISOString()} ~ ${timeRange.end.toISOString()}`
        })
        
        return errorLogs
        
             } catch (error) {
         this.log('error', '에러 로그 조회 실패', { 
           error: error instanceof Error ? error.message : String(error) 
         })
         // 에러 시 빈 배열 반환
         return []
       }
    })
  }

  /**
   * 성능 지표 조회
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    return this.measureAndLog('getPerformanceMetrics', async () => {
      this.validateSystemAdminAccess()
      
      try {
        // 실제 구현에서는 모니터링 시스템(New Relic, DataDog 등)에서 데이터 조회
        // 여기서는 시뮬레이션 데이터 제공
        const metrics: PerformanceMetrics = {
          timestamp: new Date(),
          responseTime: {
            average: Math.random() * 500 + 200, // 200-700ms
            p95: Math.random() * 800 + 500,     // 500-1300ms
            p99: Math.random() * 1200 + 800     // 800-2000ms
          },
          throughput: {
            requestsPerSecond: Math.random() * 100 + 50,    // 50-150 req/s
            reportsPerHour: Math.random() * 200 + 100,      // 100-300 reports/h
            measurementsPerHour: Math.random() * 500 + 300  // 300-800 measurements/h
          },
          errorRate: Math.random() * 2, // 0-2%
          resourceUsage: {
            cpu: Math.random() * 30 + 40,      // 40-70%
            memory: Math.random() * 25 + 50,   // 50-75%
            storage: Math.random() * 100 + 200 // 200-300GB
          },
          userMetrics: {
            activeUsers: Math.floor(Math.random() * 200 + 100),    // 100-300 users
            concurrentSessions: Math.floor(Math.random() * 50 + 20), // 20-70 sessions
            averageSessionDuration: Math.random() * 20 + 15         // 15-35 minutes
          }
        }
        
        this.log('info', '성능 지표 조회 완료', { 
          avgResponseTime: metrics.responseTime.average,
          errorRate: metrics.errorRate,
          activeUsers: metrics.userMetrics.activeUsers
        })
        
        return metrics
        
             } catch (error) {
         this.log('error', '성능 지표 조회 실패', { 
           error: error instanceof Error ? error.message : String(error) 
         })
         throw error
       }
    })
  }

  // ============================================
  // 4단계 4번: 기업별 크레딧 관리 기능
  // ============================================

  /**
   * 모든 조직의 크레딧 정보 조회
   */
  async getAllOrganizationCredits(): Promise<OrganizationCreditInfo[]> {
    return this.measureAndLog('getAllOrganizationCredits', async () => {
      this.validateSystemAdminAccess()
      
      try {
        // 조직 목록 조회
        const orgsSnapshot = await getDocs(collection(db, 'organizations'))
        const creditInfos: OrganizationCreditInfo[] = []
        
        for (const orgDoc of orgsSnapshot.docs) {
          const orgData = orgDoc.data()
          
          // 크레딧 트랜잭션 조회
          const creditQuery = query(
            collection(db, 'creditTransactions'),
            where('organizationId', '==', orgDoc.id),
            orderBy('createdAt', 'desc'),
            limit(30)
          )
          const creditSnapshot = await getDocs(creditQuery)
          const transactions = creditSnapshot.docs.map(doc => doc.data())
          
          // 크레딧 정보 계산
          const creditInfo = await this.calculateOrganizationCreditInfo(
            orgDoc.id,
            orgData.name || '조직명 없음',
            transactions
          )
          
          creditInfos.push(creditInfo)
        }
        
        this.log('info', '조직별 크레딧 정보 조회 완료', { 
          organizationCount: creditInfos.length,
          totalCredits: creditInfos.reduce((sum, info) => sum + info.creditBalance, 0)
        })
        
        return creditInfos.sort((a, b) => b.creditBalance - a.creditBalance)
        
      } catch (error) {
        this.log('error', '조직별 크레딧 정보 조회 실패', { error })
        throw error
      }
    })
  }

  /**
   * 무료 크레딧 지급
   */
  async grantFreeCredits(actions: CreditManagementAction[]): Promise<{ success: number; failed: number; results: any[] }> {
    return this.measureAndLog('grantFreeCredits', async () => {
      this.validateSystemAdminAccess()
      
      const results: any[] = []
      let success = 0
      let failed = 0
      
      for (const action of actions) {
        try {
          const result = await this.processCreditAction(action)
          results.push({ organizationId: action.organizationId, success: true, result })
          success++
          
                     this.log('info', '무료 크레딧 지급 성공', {
             organizationId: action.organizationId,
             amount: action.amount,
             reason: action.reason
           })
           
         } catch (error) {
           const errorMessage = error instanceof Error ? error.message : String(error)
           results.push({ organizationId: action.organizationId, success: false, error: errorMessage })
           failed++
           
           this.log('error', '무료 크레딧 지급 실패', {
             organizationId: action.organizationId,
             error: errorMessage
           })
        }
      }
      
      this.log('info', '무료 크레딧 지급 배치 처리 완료', { success, failed, total: actions.length })
      
      return { success, failed, results }
    })
  }

  /**
   * 조직 크레딧 상태 업데이트 (정지/제한)
   */
  async updateOrganizationCreditStatus(
    organizationId: string, 
    status: 'active' | 'suspended' | 'limitReached',
    reason: string
  ): Promise<void> {
    return this.measureAndLog('updateOrganizationCreditStatus', async () => {
      this.validateSystemAdminAccess()
      
      try {
        // 조직 문서 업데이트
        const orgRef = doc(db, 'organizations', organizationId)
        const updateData = {
          creditStatus: status,
          creditStatusReason: reason,
          creditStatusUpdatedAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        }
        
        await this.updateDocument(orgRef, updateData)
        
        // 활동 로그 기록
        await this.recordSystemActivity({
          organizationId,
          type: 'system_event',
          description: `조직 크레딧 상태 변경: ${status} (${reason})`,
          severity: status === 'suspended' ? 'warning' : 'info',
          metadata: { status, reason }
        })
        
        this.log('info', '조직 크레딧 상태 업데이트 완료', {
          organizationId,
          status,
          reason
        })
        
      } catch (error) {
        this.log('error', '조직 크레딧 상태 업데이트 실패', { error })
        throw error
      }
    })
  }

  /**
   * 시스템 설정 조회
   */
  async getSystemSettings(): Promise<SystemSettings> {
    return this.measureAndLog('getSystemSettings', async () => {
      this.validateSystemAdminAccess()
      
      try {
        const settingsDoc = await getDoc(doc(db, 'systemSettings', 'global'))
        
        const defaultSettings: SystemSettings = {
          maintenanceMode: false,
          globalCreditLimits: {
            maxFreeCredits: 100,
            maxCreditBalance: 10000,
            defaultAutoRechargeThreshold: 50
          },
          alertThresholds: {
            errorRate: 5.0,
            responseTime: 2000,
            lowCreditBalance: 10,
            unusualUsage: 3.0
          },
          systemLimits: {
            maxUsersPerOrganization: 1000,
            maxReportsPerMonth: 5000,
            maxStoragePerOrganization: 100
          },
          businessRules: {
            freeTrialDuration: 30,
            freeTrialCredits: 50,
            creditPricing: {
              basic: 1.0,
              premium: 0.8,
              enterprise: 0.6
            },
            volumeDiscounts: [
              { minCredits: 100, discountPercentage: 5 },
              { minCredits: 500, discountPercentage: 10 },
              { minCredits: 1000, discountPercentage: 15 }
            ]
          }
        }
        
        if (settingsDoc.exists()) {
          const data = settingsDoc.data()
          return { ...defaultSettings, ...data } as SystemSettings
        }
        
        return defaultSettings
        
      } catch (error) {
        this.log('error', '시스템 설정 조회 실패', { error })
        throw error
      }
    })
  }

  /**
   * 시스템 설정 업데이트
   */
  async updateSystemSettings(settings: Partial<SystemSettings>): Promise<void> {
    return this.measureAndLog('updateSystemSettings', async () => {
      this.validateSystemAdminAccess()
      
      try {
        const settingsRef = doc(db, 'systemSettings', 'global')
        await this.updateDocument(settingsRef, {
          ...settings,
          updatedAt: Timestamp.now()
        })
        
        this.log('info', '시스템 설정 업데이트 완료', { settings })
        
      } catch (error) {
        this.log('error', '시스템 설정 업데이트 실패', { error })
        throw error
      }
    })
  }

  // ============================================
  // 헬퍼 메서드들
  // ============================================

  private async checkSystemServices(): Promise<SystemHealth['services']> {
    // 실제 구현에서는 각 서비스의 헬스 체크 엔드포인트 호출
    return {
      database: Math.random() > 0.1 ? 'up' : 'degraded',
      storage: Math.random() > 0.05 ? 'up' : 'degraded', 
      authentication: Math.random() > 0.02 ? 'up' : 'down',
      aiEngine: Math.random() > 0.15 ? 'up' : 'degraded'
    }
  }

  private async getSystemPerformance(): Promise<SystemHealth['performance']> {
    return {
      cpuUsage: Math.random() * 30 + 40,    // 40-70%
      memoryUsage: Math.random() * 25 + 50, // 50-75%
      diskUsage: Math.random() * 20 + 60,   // 60-80%
      networkLatency: Math.random() * 50 + 20 // 20-70ms
    }
  }

  private async getActiveAlerts(): Promise<SystemHealth['alerts']> {
    // 실제 구현에서는 알림 시스템에서 조회
    const alerts: SystemHealth['alerts'] = []
    
    // 시뮬레이션 알림 생성
    if (Math.random() > 0.7) {
      alerts.push({
        id: this.generateId(),
        type: 'warning',
        message: '높은 CPU 사용률 감지됨',
        timestamp: new Date(),
        resolved: false
      })
    }
    
    return alerts
  }

  private determineSystemStatus(
    services: SystemHealth['services'],
    performance: SystemHealth['performance'],
    alerts: SystemHealth['alerts']
  ): SystemHealth['status'] {
    const downServices = Object.values(services).filter(status => status === 'down').length
    const degradedServices = Object.values(services).filter(status => status === 'degraded').length
    const criticalAlerts = alerts.filter(alert => alert.type === 'critical' && !alert.resolved).length
    
    if (downServices > 0 || criticalAlerts > 0) return 'critical'
    if (degradedServices > 1 || performance.cpuUsage > 80 || performance.memoryUsage > 90) return 'warning'
    return 'healthy'
  }

  private calculateUptime(): number {
    // 실제 구현에서는 시스템 시작 시간부터 계산
    return Math.floor(Math.random() * 86400 * 30) // 0-30일 랜덤
  }

  private async calculateOrganizationCreditInfo(
    organizationId: string,
    organizationName: string,
    transactions: any[]
  ): Promise<OrganizationCreditInfo> {
    const currentBalance = transactions
      .reduce((sum, t) => sum + (t.amount || 0), 0)
    
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)
    
    const monthlyUsage = transactions
      .filter(t => t.createdAt?.toDate?.() >= thisMonth && (t.amount || 0) < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0)
    
    const freeCreditsGranted = transactions
      .filter(t => t.type === 'free_grant')
      .reduce((sum, t) => sum + (t.amount || 0), 0)
    
    const freeCreditsUsed = Math.min(freeCreditsGranted, monthlyUsage)
    
    // 사용량 히스토리 생성 (최근 7일)
    const usageHistory = this.generateUsageHistory(transactions)
    
    // 알림 생성
    const alerts = this.generateCreditAlerts(currentBalance, monthlyUsage, freeCreditsGranted)
    
    return {
      organizationId,
      organizationName,
      creditBalance: Math.max(0, currentBalance),
      creditLimit: 5000, // 기본 한도
      usageThisMonth: monthlyUsage,
      freeCreditsGranted,
      freeCreditsUsed,
      freeCreditsExpiry: freeCreditsGranted > 0 ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined,
      plan: this.determinePlan(currentBalance, monthlyUsage),
      autoRecharge: false,
      autoRechargeThreshold: 50,
      status: this.determineCreditStatus(currentBalance, monthlyUsage),
      lastActivity: transactions.length > 0 ? transactions[0].createdAt?.toDate?.() || new Date() : new Date(),
      usageHistory,
      alerts
    }
  }

  private async processCreditAction(action: CreditManagementAction): Promise<any> {
    const { organizationId, action: actionType, amount, reason, expiryDate } = action
    
    // 크레딧 트랜잭션 기록
    const transactionData = {
      organizationId,
      amount: amount || 0,
      type: actionType === 'grant' ? 'free_grant' : 'system_action',
      reason,
      createdAt: Timestamp.now(),
      expiryDate: expiryDate ? Timestamp.fromDate(expiryDate) : null,
      createdBy: 'SYSTEM_ADMIN'
    }
    
    await this.addDocument(collection(db, 'creditTransactions'), transactionData)
    
    // 조직 문서 업데이트
    if (actionType === 'grant' && amount) {
      const orgRef = doc(db, 'organizations', organizationId)
      const orgDoc = await getDoc(orgRef)
      
      if (orgDoc.exists()) {
        const currentBalance = orgDoc.data().creditBalance || 0
        await this.updateDocument(orgRef, {
          creditBalance: currentBalance + amount,
          lastCreditUpdate: Timestamp.now(),
          updatedAt: Timestamp.now()
        })
      }
    }
    
    return { success: true, transactionId: this.generateId() }
  }

  private generateUsageHistory(transactions: any[]): OrganizationCreditInfo['usageHistory'] {
    const history: OrganizationCreditInfo['usageHistory'] = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const dayTransactions = transactions.filter(t => {
        const tDate = t.createdAt?.toDate?.()
        return tDate && tDate >= date && tDate < new Date(date.getTime() + 24 * 60 * 60 * 1000)
      })
      
      const creditsUsed = dayTransactions
        .filter(t => (t.amount || 0) < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0)
      
      const reportCount = dayTransactions.filter(t => t.type === 'report_generation').length
      
      history.push({
        date,
        creditsUsed,
        reportCount,
        averageCostPerReport: reportCount > 0 ? creditsUsed / reportCount : 0
      })
    }
    
    return history
  }

  private generateCreditAlerts(
    balance: number,
    monthlyUsage: number,
    freeCredits: number
  ): OrganizationCreditInfo['alerts'] {
    const alerts: OrganizationCreditInfo['alerts'] = []
    
    if (balance < 10) {
      alerts.push({
        type: 'lowBalance',
        message: '크레딧 잔액이 부족합니다.',
        timestamp: new Date(),
        acknowledged: false
      })
    }
    
    if (balance <= 0) {
      alerts.push({
        type: 'limitReached',
        message: '크레딧이 모두 소진되었습니다.',
        timestamp: new Date(),
        acknowledged: false
      })
    }
    
    if (monthlyUsage > 200) {
      alerts.push({
        type: 'unusualUsage',
        message: '이번 달 사용량이 평소보다 높습니다.',
        timestamp: new Date(),
        acknowledged: false
      })
    }
    
    return alerts
  }

  private determinePlan(balance: number, usage: number): OrganizationCreditInfo['plan'] {
    if (usage === 0 && balance <= 50) return 'trial'
    if (usage < 100) return 'basic'
    if (usage < 500) return 'premium'
    return 'enterprise'
  }

  private determineCreditStatus(balance: number, usage: number): OrganizationCreditInfo['status'] {
    if (balance <= 0) return 'limitReached'
    if (balance < 10) return 'suspended'
    return 'active'
  }

  private async recordSystemActivity(activity: Omit<SystemActivity, 'id' | 'organizationName'>): Promise<void> {
    try {
      const organizationName = await this.getOrganizationName(activity.organizationId)
      
      const activityData = {
        ...activity,
        organizationName,
        timestamp: Timestamp.now()
      }
      
      await this.addDocument(collection(db, 'systemActivities'), activityData)
    } catch (error) {
      this.log('error', '시스템 활동 기록 실패', { error })
    }
  }
}

const systemAdminService = new SystemAdminService()
export default systemAdminService 