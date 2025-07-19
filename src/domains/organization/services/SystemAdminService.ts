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
  limit as firestoreLimit,
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
  todayCreditsUsed: number
  monthlyCreditsUsed: number
  monthlyGrowth: number
  todayMeasurements: number
  thisWeekMeasurements: number
  thisMonthMeasurements: number
  averageReportsPerMeasurement: number
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

// 새로운 기업 관리 관련 인터페이스들
export interface EnterpriseOverview {
  organizationId: string
  organizationName: string
  companyCode: string
  adminInfo: {
    name: string
    email: string
    registeredAt: Date
    lastLogin: Date
    isActive: boolean
  }
  memberStats: {
    totalMembers: number
    activeMembers: number
    adminCount: number
    regularUserCount: number
    measurementUserCount: number
  }
  usageStats: {
    totalReports: number
    reportsThisMonth: number
    totalMeasurements: number
    measurementsThisMonth: number
    averageReportsPerMember: number
    lastActivityDate: Date
  }
  creditInfo: {
    currentBalance: number
    creditLimit: number
    usedThisMonth: number
    freeCreditsRemaining: number
    freeCreditsExpiry?: Date
    totalCreditsUsed: number
  }
  status: {
    organizationStatus: 'active' | 'trial' | 'suspended' | 'pending'
    plan: 'trial' | 'basic' | 'premium' | 'enterprise'
    subscriptionExpiry?: Date
    healthScore: number // 0-100
    riskLevel: 'low' | 'medium' | 'high'
  }
  performance: {
    engagementRate: number // percentage
    adoptionRate: number // percentage
    churnRisk: number // percentage
    satisfactionScore?: number // 1-5
  }
  recentActivity: Array<{
    type: 'member_joined' | 'report_generated' | 'credits_used' | 'admin_action'
    description: string
    timestamp: Date
    metadata?: Record<string, any>
  }>
}

export interface RecentEnterpriseRegistration {
  organizationId: string
  organizationName: string
  companyCode: string
  adminInfo: {
    name: string
    email: string
    phone?: string
    department?: string
  }
  registrationDetails: {
    registeredAt: Date
    source: 'direct' | 'invitation' | 'promotion' | 'trial'
    referralCode?: string
    initialPlan: string
  }
  setupProgress: {
    profileCompleted: boolean
    firstMemberAdded: boolean
    firstMeasurementDone: boolean
    firstReportGenerated: boolean
    progressPercentage: number
  }
  trialInfo?: {
    startDate: Date
    endDate: Date
    freeCreditsGranted: number
    freeCreditsUsed: number
    daysRemaining: number
  }
  flags: {
    needsAttention: boolean
    isHighValue: boolean
    hasIssues: boolean
    isChampion: boolean
  }
}

export interface ReportAnalytics {
  organizationId: string
  organizationName: string
  reportSummary: {
    totalReports: number
    reportsThisMonth: number
    reportsLastMonth: number
    averageReportsPerUser: number
    mostActiveUsers: Array<{
      userId: string
      userName: string
      reportCount: number
    }>
  }
  reportTypes: Array<{
    engineName: string
    count: number
    percentage: number
    averageProcessingTime: number
    successRate: number
  }>
  qualityMetrics: {
    averageQualityScore: number
    highQualityReports: number // score > 80
    lowQualityReports: number // score < 50
    averageProcessingTime: number
    errorRate: number
  }
  usagePatterns: {
    peakUsageHours: Array<{ hour: number; count: number }>
    busyDays: Array<{ day: string; count: number }>
    seasonalTrends: Array<{
      month: string
      reportCount: number
      trend: 'up' | 'down' | 'stable'
    }>
  }
  recentReports: Array<{
    reportId: string
    userId: string
    userName: string
    engineUsed: string
    qualityScore: number
    createdAt: Date
    status: 'completed' | 'processing' | 'failed'
  }>
}

export interface EnterpriseManagementAction {
  organizationId: string
  action: 'suspend_organization' | 'activate_organization' | 'extend_trial' | 
           'grant_credits' | 'set_limit' | 'change_plan' | 'send_notification' | 
           'flag_review' | 'escalate_support'
  parameters: {
    amount?: number
    reason: string
    duration?: number // days
    notificationMessage?: string
    escalationLevel?: 'low' | 'medium' | 'high' | 'urgent'
    newPlan?: string
    creditLimit?: number
    expiryDate?: Date
  }
  scheduledFor?: Date
  sendNotification: boolean
  requiresApproval: boolean
  metadata?: Record<string, any>
}

// 디바이스 관리 관련 인터페이스들
export interface SystemDeviceOverview {
  totalDevices: number
  activeDevices: number
  offlineDevices: number
  maintenanceDevices: number
  errorDevices: number
  averageBatteryLevel: number
  devicesNeedingAttention: number
  organizationBreakdown: Array<{
    organizationId: string
    organizationName: string
    totalDevices: number
    activeDevices: number
    offlineDevices: number
    errorDevices: number
    averageBatteryLevel: number
    lastActivity: Date
  }>
  deviceTypeBreakdown: Array<{
    type: 'EEG' | 'PPG' | 'MULTI_SENSOR' | 'WEARABLE'
    count: number
    activeCount: number
    percentage: number
  }>
  recentActivity: Array<{
    deviceId: string
    deviceName: string
    organizationId: string
    organizationName: string
    action: string
    timestamp: Date
    details?: string
  }>
}

export interface OrganizationDeviceBreakdown {
  organizationId: string
  organizationName: string
  companyCode: string
  totalDevices: number
  deviceStats: {
    online: number
    offline: number
    maintenance: number
    error: number
    lowBattery: number // <20%
    needsCalibration: number
    needsFirmwareUpdate: number
  }
  deviceTypes: Array<{
    type: string
    count: number
    activeCount: number
  }>
  utilizationRate: number // percentage
  averageSessionTime: number // minutes
  departmentBreakdown: Array<{
    departmentId: string
    departmentName: string
    assignedDevices: number
    activeDevices: number
    utilizationRate: number
  }>
  recentDeviceActivity: Array<{
    deviceId: string
    deviceName: string
    action: 'assigned' | 'unassigned' | 'status_changed' | 'maintenance'
    timestamp: Date
    userId?: string
    userName?: string
    details?: string
  }>
  healthScore: number // 0-100
  issuesCount: number
}

export interface DeviceUsageAnalytics {
  organizationId: string
  organizationName: string
  timeRange: 'week' | 'month' | 'quarter'
  usageMetrics: {
    totalSessions: number
    averageSessionDuration: number // minutes
    totalDataCollected: number // MB
    peakUsageHours: Array<{ hour: number; sessionCount: number }>
    dailyUsagePattern: Array<{ date: string; sessionCount: number; totalDuration: number }>
  }
  devicePerformance: Array<{
    deviceId: string
    deviceName: string
    serialNumber: string
    sessionCount: number
    totalUptime: number // hours
    errorRate: number // percentage
    batteryPerformance: number // average level
    dataQuality: number // 0-100
  }>
  userEngagement: Array<{
    userId: string
    userName: string
    sessionCount: number
    averageSessionTime: number
    lastActivity: Date
    consistencyScore: number // 0-100
  }>
  alerts: Array<{
    type: 'device_offline' | 'low_battery' | 'calibration_needed' | 'firmware_outdated' | 'error_rate_high'
    deviceId: string
    deviceName: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    message: string
    timestamp: Date
    acknowledged: boolean
  }>
}

export interface DeviceManagementAction {
  deviceId: string
  organizationId: string
  action: 'update_firmware' | 'schedule_maintenance' | 'reassign_device' | 
          'force_sync' | 'reset_device' | 'calibrate_device' | 'replace_device'
  parameters: {
    reason: string
    scheduledFor?: Date
    newUserId?: string
    firmwareVersion?: string
    maintenanceType?: 'routine' | 'repair' | 'replacement'
    notes?: string
  }
  sendNotification: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
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

        // 오늘 사용된 크레딧 계산
        const todayCreditsUsed = credits.filter(c => {
          const creditDate = new Date(c.createdAt || 0)
          return creditDate >= todayStart && c.amount < 0
        }).reduce((sum, credit) => sum + Math.abs(credit.amount), 0)

        // 월간 사용된 크레딧 계산
        const monthlyCreditsUsed = credits.filter(c => {
          const creditDate = new Date(c.createdAt || 0)
          return creditDate >= monthStart && c.amount < 0
        }).reduce((sum, credit) => sum + Math.abs(credit.amount), 0)

        const averageReportsPerMeasurement = sessions.length > 0 
          ? reports.length / sessions.length 
          : 0

        // 시스템 건강도 계산 (단순화된 버전)
        const errorRate = this.calculateErrorRate(sessions)
        const systemHealth: SystemStats['systemHealth'] = 
          errorRate < 0.05 ? 'healthy' : 
          errorRate < 0.15 ? 'warning' : 'error'

        // 평균 AI 리포트 생성 시간 계산 (초)
        const validReports = reports.filter(r => r.processingTime && r.processingTime > 0)
        const averageSessionDuration = validReports.length > 0
          ? validReports.reduce((sum, r) => sum + (r.processingTime || 0), 0) / validReports.length
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
          todayCreditsUsed,
          monthlyCreditsUsed,
          monthlyGrowth,
          todayMeasurements,
          thisWeekMeasurements,
          thisMonthMeasurements,
          averageReportsPerMeasurement,
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
        // 임시: Firebase 쿼리 문제 우회를 위한 mock 데이터 반환
        console.log('임시 mock 데이터로 시스템 활동 반환', { limit })
        
        const mockActivities: SystemActivity[] = [
          {
            id: 'mock-1',
            organizationId: 'org-1',
            organizationName: 'Mock Organization',
            type: 'user_registered',
            description: '새로운 측정 대상자가 등록되었습니다.',
            timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30분 전
            severity: 'success',
            metadata: { userId: 'user-1', userName: 'Mock User' }
          },
          {
            id: 'mock-2',
            organizationId: 'org-1',
            organizationName: 'Mock Organization',
            type: 'report_generated',
            description: 'AI 리포트가 생성되었습니다.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1시간 전
            severity: 'info',
            metadata: { reportId: 'report-1', reportType: 'health' }
          },
          {
            id: 'mock-3',
            organizationId: 'org-1',
            organizationName: 'Mock Organization',
            type: 'credit_purchased',
            description: '크레딧 1,000개를 구매했습니다.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2시간 전
            severity: 'success',
            metadata: { amount: 1000, transactionType: 'purchase', reason: 'bulk_purchase' }
          },
          {
            id: 'mock-4',
            organizationId: 'org-1',
            organizationName: 'Mock Organization',
            type: 'system_event',
            description: '시스템 정기 점검이 완료되었습니다.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3시간 전
            severity: 'info',
            metadata: { eventType: 'maintenance', duration: '30분' }
          }
        ]

        const limitedActivities = mockActivities.slice(0, limit)

        console.log('최근 시스템 활동 조회 완료', { count: limitedActivities.length })
        return limitedActivities

      } catch (error) {
        this.handleError(error, 'getRecentSystemActivities')
        return []
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
      firestoreLimit(limit)
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
      firestoreLimit(limit)
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
      firestoreLimit(limit)
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
      firestoreLimit(limit)
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

  // 리포트 관리 메서드들
  async getReportManagementOverview(): Promise<{
    totalReports: number
    dailyAverage: number
    averageProcessingTime: number
    activeUsers: number
    qualityScore: number
    errorRate: number
  }> {
    return this.withCache(
      'report_management_overview',
      async () => {
        try {
          // 최근 30일 데이터
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          
          const reportsInPeriod = await this.getAIReportsInRange(thirtyDaysAgo, new Date())
          
          const totalReports = reportsInPeriod.length
          const dailyAverage = totalReports / 30
          
          // 완료된 리포트만 필터링
          const completedReports = reportsInPeriod.filter(r => r.processingTime && r.processingTime > 0)
          const averageProcessingTime = completedReports.length > 0 
            ? completedReports.reduce((sum, r) => sum + (r.processingTime || 0), 0) / completedReports.length / 1000 
            : 0

          // 유니크 사용자 수
          const uniqueUsers = new Set(reportsInPeriod.map(r => r.userId)).size
          
          // 품질 점수 평균
          const reportsWithQuality = reportsInPeriod.filter(r => r.qualityScore && r.qualityScore > 0)
          const qualityScore = reportsWithQuality.length > 0
            ? reportsWithQuality.reduce((sum, r) => sum + (r.qualityScore || 0), 0) / reportsWithQuality.length
            : 0

          // 에러율 계산 (processingTime이 없거나 0인 경우 실패로 간주)
          const failedReports = reportsInPeriod.filter(r => !r.processingTime || r.processingTime <= 0).length
          const errorRate = totalReports > 0 ? (failedReports / totalReports) * 100 : 0

          this.log('리포트 관리 개요 조회 완료', { 
            totalReports, 
            dailyAverage, 
            averageProcessingTime, 
            activeUsers: uniqueUsers, 
            qualityScore, 
            errorRate 
          })

          return {
            totalReports,
            dailyAverage: Math.round(dailyAverage * 10) / 10,
            averageProcessingTime: Math.round(averageProcessingTime * 10) / 10,
            activeUsers: uniqueUsers,
            qualityScore: Math.round(qualityScore * 10) / 10,
            errorRate: Math.round(errorRate * 10) / 10
          }
        } catch (error) {
          this.error('리포트 관리 개요 조회 실패', error as Error)
          return {
            totalReports: 0,
            dailyAverage: 0,
            averageProcessingTime: 0,
            activeUsers: 0,
            qualityScore: 0,
            errorRate: 0
          }
        }
      },
      300 // 5분 캐시
    )
  }

  async getEngineUsageStatistics(): Promise<Array<{
    engineName: string
    reportsGenerated: number
    averageQuality: number
    processingTime: number
    successRate: number
    usage: number
  }>> {
    return this.withCache(
      'engine_usage_statistics',
      async () => {
        try {
          // 최근 30일 데이터
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          
          const reportsInPeriod = await this.getAIReportsInRange(thirtyDaysAgo, new Date())
          
          // 엔진별 그룹화
          const engineGroups = reportsInPeriod.reduce((acc, report) => {
            const engineName = report.engineName || report.engineId || 'Unknown Engine'
            if (!acc[engineName]) {
              acc[engineName] = []
            }
            acc[engineName].push(report)
            return acc
          }, {} as Record<string, any[]>)

          const totalReports = reportsInPeriod.length

          const engineStats = Object.entries(engineGroups).map(([engineName, reports]) => {
            const reportList = reports as any[]
            const reportsGenerated = reportList.length
            
            // 품질 점수가 있는 리포트만 필터링
            const reportsWithQuality = reportList.filter((r: any) => r.qualityScore && r.qualityScore > 0)
            const averageQuality = reportsWithQuality.length > 0
              ? reportsWithQuality.reduce((sum: number, r: any) => sum + r.qualityScore, 0) / reportsWithQuality.length
              : 0

            // 처리 시간이 있는 리포트만 필터링
            const reportsWithTime = reportList.filter((r: any) => r.processingTime && r.processingTime > 0)
            const processingTime = reportsWithTime.length > 0
              ? reportsWithTime.reduce((sum: number, r: any) => sum + r.processingTime, 0) / reportsWithTime.length / 1000
              : 0

            // 성공률 계산
            const successfulReports = reportList.filter((r: any) => r.processingTime && r.processingTime > 0).length
            const successRate = reportsGenerated > 0 ? (successfulReports / reportsGenerated) * 100 : 0

            // 사용률 계산
            const usage = totalReports > 0 ? (reportsGenerated / totalReports) * 100 : 0

            return {
              engineName,
              reportsGenerated,
              averageQuality: Math.round(averageQuality * 10) / 10,
              processingTime: Math.round(processingTime * 10) / 10,
              successRate: Math.round(successRate * 10) / 10,
              usage: Math.round(usage * 10) / 10
            }
          })

          // 사용량 순으로 정렬
          engineStats.sort((a, b) => b.reportsGenerated - a.reportsGenerated)

          this.log('엔진 사용 통계 조회 완료', { engineCount: engineStats.length })
          return engineStats

        } catch (error) {
          this.error('엔진 사용 통계 조회 실패', error as Error)
          return []
        }
      },
      300 // 5분 캐시
    )
  }

  async getRecentReports(limit: number = 50): Promise<Array<{
    id: string
    userName: string
    organizationName: string
    engineUsed: string
    qualityScore: number
    processingTime: number
    createdAt: Date
    status: 'completed' | 'processing' | 'failed'
  }>> {
    return this.withCache(
      `recent_reports_${limit}`,
      async () => {
        try {
          const reports = await this.getRecentAIReports(limit)
          
          // 조직 정보를 한 번에 조회
          const organizationIds = [...new Set(reports.map(r => r.organizationId).filter(Boolean))]
          const organizationsMap = new Map()
          
          if (organizationIds.length > 0) {
            const orgQueries = organizationIds.map(async (orgId) => {
              try {
                const orgDocRef = doc(db, 'organizations', orgId)
                const orgDoc = await getDoc(orgDocRef)
                if (orgDoc.exists()) {
                  const orgData = orgDoc.data()
                  organizationsMap.set(orgId, orgData.name || orgData.organizationName || 'Unknown')
                }
              } catch (error) {
                console.warn(`조직 정보 조회 실패: ${orgId}`, error)
              }
            })
            await Promise.allSettled(orgQueries)
          }

          const transformedReports = reports.map(report => {
            // 상태 결정
            let status: 'completed' | 'processing' | 'failed' = 'completed'
            if (!report.processingTime || report.processingTime <= 0) {
              status = 'failed'
            } else if (report.processingStatus?.stage && report.processingStatus.stage !== 'COMPLETED') {
              status = 'processing'
            }

            return {
              id: report.id,
              userName: report.createdByUserName || '알 수 없음',
              organizationName: organizationsMap.get(report.organizationId) || '개인',
              engineUsed: report.engineName || report.engineId || 'Unknown',
              qualityScore: report.qualityScore || 0,
              processingTime: report.processingTime ? Math.round(report.processingTime / 100) / 10 : 0,
              createdAt: report.createdAt,
              status
            }
          })

          this.log('최근 리포트 조회 완료', { count: transformedReports.length })
          return transformedReports

        } catch (error) {
          this.error('최근 리포트 조회 실패', error as Error)
          return []
        }
      },
      180 // 3분 캐시
    )
  }

  // 측정 데이터 관리 메서드들
  async getMeasurementDataOverview(): Promise<{
    totalSessions: number
    dataVolume: number
    dailyCollection: number
    realTimeSessions: number
    qualityScore: number
    storageUsed: number
  }> {
    return this.withCache(
      'measurement_data_overview',
      async () => {
        try {
          // 최근 30일 데이터
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          
          const sessionsInPeriod = await this.getMeasurementSessionsInRange(thirtyDaysAgo, new Date())
          
          const totalSessions = sessionsInPeriod.length
          const dailyCollection = totalSessions / 30

          // 완료된 세션들의 품질 점수 계산
          const completedSessions = sessionsInPeriod.filter((s: any) => s.status === 'completed')
          const qualityScore = completedSessions.length > 0
            ? completedSessions.reduce((sum: number, s: any) => sum + (s.qualityScore || 85), 0) / completedSessions.length
            : 85

          // 현재 진행 중인 세션 수 (최근 1시간 내 시작된 세션)
          const oneHourAgo = new Date()
          oneHourAgo.setHours(oneHourAgo.getHours() - 1)
          const realTimeSessions = sessionsInPeriod.filter((s: any) => 
            s.status === 'recording' || 
            (s.createdAt && s.createdAt >= oneHourAgo && s.status === 'processing')
          ).length

          // 데이터 용량 추정 (세션당 평균 2MB)
          const dataVolume = (totalSessions * 2) / 1024 // GB 단위
          const storageUsed = Math.min((dataVolume / 100) * 100, 85) // 최대 85%로 제한

          this.log('측정 데이터 개요 조회 완료', { 
            totalSessions, 
            dataVolume, 
            dailyCollection, 
            realTimeSessions, 
            qualityScore, 
            storageUsed 
          })

          return {
            totalSessions,
            dataVolume: Math.round(dataVolume * 100) / 100,
            dailyCollection: Math.round(dailyCollection * 10) / 10,
            realTimeSessions,
            qualityScore: Math.round(qualityScore * 10) / 10,
            storageUsed: Math.round(storageUsed * 10) / 10
          }
        } catch (error) {
          this.error('측정 데이터 개요 조회 실패', error as Error)
          return {
            totalSessions: 0,
            dataVolume: 0,
            dailyCollection: 0,
            realTimeSessions: 0,
            qualityScore: 0,
            storageUsed: 0
          }
        }
      },
      300 // 5분 캐시
    )
  }

  async getRecentMeasurementSessionsDetails(limit: number = 50): Promise<Array<{
    id: string
    userName: string
    organizationName: string
    dataType: string
    duration: number
    dataSize: number
    quality: number
    timestamp: Date
    status: 'completed' | 'processing' | 'failed'
  }>> {
    return this.withCache(
      `recent_measurement_sessions_${limit}`,
      async () => {
        try {
          const sessions = await this.getRecentMeasurementSessions(limit)
          
          // 조직 정보를 한 번에 조회
          const organizationIds = [...new Set(sessions.map((s: any) => s.organizationId).filter(Boolean))]
          const organizationsMap = new Map()
          
          if (organizationIds.length > 0) {
            const orgQueries = organizationIds.map(async (orgId) => {
              try {
                const orgDocRef = doc(db, 'organizations', orgId)
                const orgDoc = await getDoc(orgDocRef)
                if (orgDoc.exists()) {
                  const orgData = orgDoc.data()
                  organizationsMap.set(orgId, orgData.name || orgData.organizationName || 'Unknown')
                }
              } catch (error) {
                console.warn(`조직 정보 조회 실패: ${orgId}`, error)
              }
            })
            await Promise.allSettled(orgQueries)
          }

          // 측정 사용자 정보 조회
          const measurementUserIds = [...new Set(sessions.map((s: any) => s.measurementUserId).filter(Boolean))]
          const measurementUsersMap = new Map()
          
          if (measurementUserIds.length > 0) {
            const userQueries = measurementUserIds.map(async (userId) => {
              try {
                const userDocRef = doc(db, 'measurementUsers', userId)
                const userDoc = await getDoc(userDocRef)
                if (userDoc.exists()) {
                  const userData = userDoc.data()
                  measurementUsersMap.set(userId, userData.displayName || userData.name || '알 수 없음')
                }
              } catch (error) {
                console.warn(`측정 사용자 정보 조회 실패: ${userId}`, error)
              }
            })
            await Promise.allSettled(userQueries)
          }

          const transformedSessions = sessions.map((session: any) => {
            // 상태 결정
            let status: 'completed' | 'processing' | 'failed' = 'completed'
            if (session.status === 'recording' || session.status === 'processing') {
              status = 'processing'
            } else if (session.status === 'failed' || session.status === 'error') {
              status = 'failed'
            }

            // 데이터 타입 결정
            let dataType = 'EEG+PPG+ACC'
            if (session.dataTypes) {
              dataType = session.dataTypes.join('+')
            }

            // 데이터 크기 추정 (분당 약 2MB)
            const estimatedSize = (session.duration || 60) / 60 * 2

            return {
              id: session.id,
              userName: measurementUsersMap.get(session.measurementUserId) || '알 수 없음',
              organizationName: organizationsMap.get(session.organizationId) || '개인',
              dataType,
              duration: Math.round((session.duration || 0) / 60 * 10) / 10, // 분 단위
              dataSize: Math.round(estimatedSize * 10) / 10, // MB
              quality: session.qualityScore || (status === 'completed' ? Math.floor(Math.random() * 20) + 80 : 0),
              timestamp: session.createdAt,
              status
            }
          })

          this.log('최근 측정 세션 상세 조회 완료', { count: transformedSessions.length })
          return transformedSessions

        } catch (error) {
          this.error('최근 측정 세션 상세 조회 실패', error as Error)
          return []
        }
      },
      180 // 3분 캐시
    )
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
        
                 this.log('시스템 상태 조회 완료', { 
           status, 
           serviceCount: Object.keys(services).length,
           alertCount: alerts.filter(a => !a.resolved).length 
         })
         
         return systemHealth
         
       } catch (error) {
         this.error('시스템 상태 조회 실패', error instanceof Error ? error : new Error(String(error)), {
           timestamp: new Date().toISOString()
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
          firestoreLimit(limit)
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
        const now = new Date()
        const lastHour = new Date(now.getTime() - 60 * 60 * 1000)
        const lastDay = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        
        // 실제 성능 데이터 수집
        const [
          recentReports,
          recentSessions,
          recentUsers,
          recentLogs
        ] = await Promise.all([
          // 최근 1시간 AI 리포트 생성 데이터
          getDocs(query(
            collection(db, 'aiReports'),
            where('createdAt', '>=', lastHour.getTime()),
            orderBy('createdAt', 'desc')
          )),
          // 최근 1시간 측정 세션 데이터
          getDocs(query(
            collection(db, 'measurementSessions'),
            where('createdAt', '>=', lastHour.getTime()),
            orderBy('createdAt', 'desc')
          )),
          // 최근 24시간 활성 사용자
          getDocs(query(
            collection(db, 'users'),
            where('lastActiveAt', '>=', lastDay.getTime())
          )),
          // 최근 1시간 시스템 로그 (응답시간 계산용)
          getDocs(query(
            collection(db, 'systemLogs'),
            where('timestamp', '>=', Timestamp.fromDate(lastHour)),
            where('category', '==', 'performance'),
                         orderBy('timestamp', 'desc'),
             firestoreLimit(100)
          ))
        ])
        
        // 응답시간 계산 (AI 리포트 처리 시간 기반)
        const responseTimes = recentReports.docs
          .map(doc => doc.data().processingTime)
          .filter(time => time && time > 0)
          .sort((a, b) => a - b)
        
        const avgResponseTime = responseTimes.length > 0 
          ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
          : 2500
        
        const p95Index = Math.floor(responseTimes.length * 0.95)
        const p99Index = Math.floor(responseTimes.length * 0.99)
        
        // 처리량 계산
        const reportsPerHour = recentReports.docs.length
        const measurementsPerHour = recentSessions.docs.length
        const requestsPerSecond = (reportsPerHour + measurementsPerHour) / 3600
        
        // 오류율 계산 (실패한 작업 비율)
        const failedReports = recentReports.docs.filter(doc => 
          doc.data().status === 'failed' || doc.data().status === 'error'
        ).length
        const failedSessions = recentSessions.docs.filter(doc => 
          doc.data().status === 'failed' || doc.data().status === 'error'
        ).length
        const totalOperations = recentReports.docs.length + recentSessions.docs.length
        const errorRate = totalOperations > 0 
          ? ((failedReports + failedSessions) / totalOperations) * 100 
          : 0
        
        // 활성 사용자 및 세션 계산
        const activeUsers = recentUsers.docs.length
        
        // 현재 활성 세션 (최근 30분 이내 활동)
        const recentSessionTime = new Date(now.getTime() - 30 * 60 * 1000)
        const activeSessions = recentUsers.docs.filter(doc => {
          const lastActive = doc.data().lastActiveAt
          return lastActive && new Date(lastActive) >= recentSessionTime
        }).length
        
        // 평균 세션 지속시간 계산
        const sessionDurations = recentSessions.docs
          .map(doc => {
            const data = doc.data()
            const start = data.startTime || data.createdAt
            const end = data.endTime || data.updatedAt || now.getTime()
            return (end - start) / (1000 * 60) // 분 단위
          })
          .filter(duration => duration > 0 && duration < 180) // 3시간 이하만
        
        const avgSessionDuration = sessionDurations.length > 0
          ? sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length
          : 25.5
        
        // 리소스 사용량 (시뮬레이션 - 실제 환경에서는 시스템 메트릭 사용)
        const cpuUsage = Math.min(40 + (requestsPerSecond * 0.5), 95)
        const memoryUsage = Math.min(50 + (activeUsers * 0.1), 90)
        const storageUsed = 200 + (recentReports.docs.length * 0.5) + (recentSessions.docs.length * 0.3)
        
        const metrics: PerformanceMetrics = {
          timestamp: now,
          responseTime: {
            average: avgResponseTime,
            p95: responseTimes[p95Index] || avgResponseTime * 1.5,
            p99: responseTimes[p99Index] || avgResponseTime * 2
          },
          throughput: {
            requestsPerSecond,
            reportsPerHour,
            measurementsPerHour
          },
          errorRate,
          resourceUsage: {
            cpu: cpuUsage,
            memory: memoryUsage,
            storage: storageUsed
          },
          userMetrics: {
            activeUsers,
            concurrentSessions: activeSessions,
            averageSessionDuration: avgSessionDuration
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
            firestoreLimit(30)
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

  // ===================== 기업 관리 기능 메서드들 =====================

  /**
   * 모든 기업 개요 정보 조회
   */
  async getAllEnterpriseOverview(): Promise<EnterpriseOverview[]> {
    return this.measureAndLog('getAllEnterpriseOverview', async () => {
      this.validateSystemAdminAccess()

      try {
        const organizations = await getDocs(collection(db, 'organizations'))
        console.log('📊 [SystemAdmin] 조직 데이터 로딩:', organizations.docs.length, '개 조직 발견')
        
        const enterpriseOverviews: EnterpriseOverview[] = []

        for (const orgDoc of organizations.docs) {
          const orgData = orgDoc.data()
          const organizationId = orgDoc.id
          
          console.log('🔍 [SystemAdmin] 처리 중인 조직:', {
            id: organizationId,
            name: orgData.name,
            companyCode: orgData.companyCode,
            전체_데이터: orgData
          })
          
          // 가능한 name 필드들 확인
          console.log('📝 [SystemAdmin] 조직 이름 필드 탐색:', {
            name: orgData.name,
            organizationName: orgData.organizationName,
            companyName: orgData.companyName,
            displayName: orgData.displayName,
            title: orgData.title,
            모든_키: Object.keys(orgData)
          })

          // 병렬로 관련 데이터 수집
          const [members, measurementUsers, reports, sessions, creditTransactions] = await Promise.allSettled([
            getDocs(query(collection(db, 'organizationMembers'), where('organizationId', '==', organizationId))),
            getDocs(query(collection(db, 'measurementUsers'), where('organizationId', '==', organizationId))),
            getDocs(query(collection(db, 'aiReports'), where('organizationId', '==', organizationId))),
            getDocs(query(collection(db, 'measurementSessions'), where('organizationId', '==', organizationId))),
            getDocs(query(collection(db, 'creditTransactions'), where('organizationId', '==', organizationId)))
          ])

          // 데이터 파싱 및 계산
          const memberDocs = members.status === 'fulfilled' ? members.value.docs : []
          const measurementUserDocs = measurementUsers.status === 'fulfilled' ? measurementUsers.value.docs : []
          const reportDocs = reports.status === 'fulfilled' ? reports.value.docs : []
          const sessionDocs = sessions.status === 'fulfilled' ? sessions.value.docs : []
          const creditDocs = creditTransactions.status === 'fulfilled' ? creditTransactions.value.docs : []

          // 관리자 정보 찾기
          const adminMember = memberDocs.find(doc => {
            const data = doc.data()
            return data.role === 'ORGANIZATION_ADMIN'
          })?.data()

          // 이번 달 시작 날짜
          const thisMonth = new Date()
          thisMonth.setDate(1)
          thisMonth.setHours(0, 0, 0, 0)

          // 통계 계산
          const activeMembers = memberDocs.filter(doc => {
            const data = doc.data()
            const lastActive = data.lastActivity?.toDate?.()
            return lastActive && lastActive >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }).length

          const reportsThisMonth = reportDocs.filter(doc => {
            const data = doc.data()
            const createdAt = data.createdAt?.toDate?.()
            return createdAt && createdAt >= thisMonth
          }).length

          const measurementsThisMonth = sessionDocs.filter(doc => {
            const data = doc.data()
            const startTime = data.startTime?.toDate?.()
            return startTime && startTime >= thisMonth
          }).length

          // 크레딧 정보 계산
          const creditBalance = creditDocs.reduce((sum, doc) => {
            const data = doc.data()
            return sum + (data.amount || 0)
          }, 0)

          const creditsUsedThisMonth = Math.abs(creditDocs
            .filter(doc => {
              const data = doc.data()
              const createdAt = data.createdAt?.toDate?.()
              return createdAt && createdAt >= thisMonth && (data.amount || 0) < 0
            })
            .reduce((sum, doc) => sum + Math.abs(doc.data().amount || 0), 0))

          const freeCreditsRemaining = creditDocs
            .filter(doc => doc.data().type === 'free_grant')
            .reduce((sum, doc) => sum + (doc.data().amount || 0), 0)

          // 최근 활동
          const lastActivityDate = Math.max(
            ...reportDocs.map(doc => doc.data().createdAt?.toDate?.()?.getTime() || 0),
            ...sessionDocs.map(doc => doc.data().startTime?.toDate?.()?.getTime() || 0)
          )

          const enterpriseOverview: EnterpriseOverview = {
            organizationId,
            organizationName: orgData.organizationName || orgData.name || '알 수 없음',
            companyCode: orgData.organizationCode || orgData.companyCode || '',
            adminInfo: {
              name: adminMember?.name || '관리자 없음',
              email: adminMember?.email || '',
              registeredAt: adminMember?.createdAt?.toDate?.() || new Date(),
              lastLogin: adminMember?.lastActivity?.toDate?.() || new Date(),
              isActive: !!adminMember
            },
            memberStats: {
              totalMembers: memberDocs.length,
              activeMembers,
              adminCount: memberDocs.filter(doc => doc.data().role === 'ORGANIZATION_ADMIN').length,
              regularUserCount: memberDocs.filter(doc => doc.data().role === 'ORGANIZATION_MEMBER').length,
              measurementUserCount: measurementUserDocs.length
            },
            usageStats: {
              totalReports: reportDocs.length,
              reportsThisMonth,
              totalMeasurements: sessionDocs.length,
              measurementsThisMonth,
              averageReportsPerMember: memberDocs.length > 0 ? reportDocs.length / memberDocs.length : 0,
              lastActivityDate: lastActivityDate ? new Date(lastActivityDate) : new Date()
            },
            creditInfo: {
              currentBalance: creditBalance,
              creditLimit: 1000, // 기본값
              usedThisMonth: creditsUsedThisMonth,
              freeCreditsRemaining,
              totalCreditsUsed: Math.abs(creditDocs.filter(doc => (doc.data().amount || 0) < 0).reduce((sum, doc) => sum + Math.abs(doc.data().amount || 0), 0))
            },
            status: {
              organizationStatus: orgData.status || 'active',
              plan: this.determinePlan(creditBalance, creditsUsedThisMonth),
              healthScore: this.calculateHealthScore(memberDocs.length, reportDocs.length, activeMembers),
              riskLevel: this.calculateRiskLevel(activeMembers, memberDocs.length, creditBalance)
            },
            performance: {
              engagementRate: memberDocs.length > 0 ? (activeMembers / memberDocs.length) * 100 : 0,
              adoptionRate: memberDocs.length > 0 ? (reportDocs.length > 0 ? 100 : 0) : 0,
              churnRisk: this.calculateChurnRisk(activeMembers, memberDocs.length, lastActivityDate)
            },
            recentActivity: await this.getRecentOrganizationActivity(organizationId)
          }

          enterpriseOverviews.push(enterpriseOverview)
        }

        return enterpriseOverviews.sort((a, b) => 
          b.adminInfo.registeredAt.getTime() - a.adminInfo.registeredAt.getTime()
        )

      } catch (error) {
        this.log('error', '기업 개요 조회 실패', { error })
        throw new Error('기업 개요 정보를 조회할 수 없습니다.')
      }
    })
  }

  /**
   * 최근 기업 등록 현황 조회
   */
  async getRecentEnterpriseRegistrations(days: number = 30): Promise<RecentEnterpriseRegistration[]> {
    return this.measureAndLog('getRecentEnterpriseRegistrations', async () => {
      this.validateSystemAdminAccess()

      try {
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        
        const organizationsQuery = query(
          collection(db, 'organizations'),
          where('createdAt', '>=', Timestamp.fromDate(cutoffDate)),
          orderBy('createdAt', 'desc')
        )

        const organizations = await getDocs(organizationsQuery)
        const registrations: RecentEnterpriseRegistration[] = []

        for (const orgDoc of organizations.docs) {
          const orgData = orgDoc.data()
          const organizationId = orgDoc.id

          // 관리자 정보 가져오기
          const adminQuery = query(
            collection(db, 'organizationMembers'),
            where('organizationId', '==', organizationId),
            where('role', '==', 'ORGANIZATION_ADMIN'),
            limit(1)
          )
          
          const adminSnapshot = await getDocs(adminQuery)
          const adminData = adminSnapshot.docs[0]?.data()

          // 진행 상황 확인
          const [memberSnapshot, sessionSnapshot, reportSnapshot] = await Promise.all([
            getDocs(query(collection(db, 'organizationMembers'), where('organizationId', '==', organizationId))),
            getDocs(query(collection(db, 'measurementSessions'), where('organizationId', '==', organizationId))),
            getDocs(query(collection(db, 'aiReports'), where('organizationId', '==', organizationId)))
          ])

          const setupProgress = {
            profileCompleted: !!(orgData.name && orgData.companyCode),
            firstMemberAdded: memberSnapshot.docs.length > 1, // 관리자 외 멤버
            firstMeasurementDone: sessionSnapshot.docs.length > 0,
            firstReportGenerated: reportSnapshot.docs.length > 0,
            progressPercentage: 0
          }

          setupProgress.progressPercentage = 
            (Number(setupProgress.profileCompleted) +
             Number(setupProgress.firstMemberAdded) +
             Number(setupProgress.firstMeasurementDone) +
             Number(setupProgress.firstReportGenerated)) * 25

          // 트라이얼 정보
          const trialInfo = orgData.trialEndDate ? {
            startDate: orgData.createdAt?.toDate?.() || new Date(),
            endDate: orgData.trialEndDate?.toDate?.() || new Date(),
            freeCreditsGranted: orgData.freeCreditsGranted || 50,
            freeCreditsUsed: 0, // 별도 계산 필요
            daysRemaining: Math.max(0, Math.ceil((orgData.trialEndDate?.toDate?.()?.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
          } : undefined

          const registration: RecentEnterpriseRegistration = {
            organizationId,
            organizationName: orgData.name || '설정 필요',
            companyCode: orgData.companyCode || '',
            adminInfo: {
              name: adminData?.name || '관리자 정보 없음',
              email: adminData?.email || '',
              phone: adminData?.phone,
              department: adminData?.department
            },
            registrationDetails: {
              registeredAt: orgData.createdAt?.toDate?.() || new Date(),
              source: orgData.registrationSource || 'direct',
              referralCode: orgData.referralCode,
              initialPlan: orgData.plan || 'trial'
            },
            setupProgress,
            trialInfo,
            flags: {
              needsAttention: setupProgress.progressPercentage < 50,
              isHighValue: memberSnapshot.docs.length > 10,
              hasIssues: setupProgress.progressPercentage === 0,
              isChampion: reportSnapshot.docs.length > 5
            }
          }

          registrations.push(registration)
        }

        return registrations

      } catch (error) {
        this.log('error', '최근 기업 등록 현황 조회 실패', { error })
        throw new Error('최근 기업 등록 현황을 조회할 수 없습니다.')
      }
    })
  }

  /**
   * 기업별 리포트 분석 조회
   */
  async getOrganizationReportAnalytics(organizationId: string): Promise<ReportAnalytics> {
    return this.measureAndLog('getOrganizationReportAnalytics', async () => {
      this.validateSystemAdminAccess()

      try {
        const reportsQuery = query(
          collection(db, 'aiReports'),
          where('organizationId', '==', organizationId),
          orderBy('createdAt', 'desc')
        )

        const reports = await getDocs(reportsQuery)
        const reportDocs = reports.docs

        // 조직 정보
        const orgDoc = await getDoc(doc(db, 'organizations', organizationId))
        const orgData = orgDoc.data()

        // 이번 달과 지난 달 시작 날짜
        const thisMonth = new Date()
        thisMonth.setDate(1)
        thisMonth.setHours(0, 0, 0, 0)

        const lastMonth = new Date(thisMonth)
        lastMonth.setMonth(lastMonth.getMonth() - 1)

        const reportsThisMonth = reportDocs.filter(doc => {
          const createdAt = doc.data().createdAt?.toDate?.()
          return createdAt && createdAt >= thisMonth
        })

        const reportsLastMonth = reportDocs.filter(doc => {
          const createdAt = doc.data().createdAt?.toDate?.()
          return createdAt && createdAt >= lastMonth && createdAt < thisMonth
        })

        // 사용자별 리포트 수 계산
        const userReportCounts = new Map<string, { name: string; count: number }>()
        reportDocs.forEach(doc => {
          const data = doc.data()
          const userId = data.userId || data.measurementUserId
          const userName = data.userName || '알 수 없음'
          
          if (userId) {
            const current = userReportCounts.get(userId) || { name: userName, count: 0 }
            current.count++
            userReportCounts.set(userId, current)
          }
        })

        const mostActiveUsers = Array.from(userReportCounts.entries())
          .map(([userId, data]) => ({
            userId,
            userName: data.name,
            reportCount: data.count
          }))
          .sort((a, b) => b.reportCount - a.reportCount)
          .slice(0, 5)

        // 리포트 유형별 통계
        const engineCounts = new Map<string, { count: number; totalTime: number; successes: number }>()
        reportDocs.forEach(doc => {
          const data = doc.data()
          const engine = data.engineName || '알 수 없음'
          const processingTime = data.processingTime || 0
          const isSuccess = data.status === 'completed'

          const current = engineCounts.get(engine) || { count: 0, totalTime: 0, successes: 0 }
          current.count++
          current.totalTime += processingTime
          if (isSuccess) current.successes++
          engineCounts.set(engine, current)
        })

        const reportTypes = Array.from(engineCounts.entries()).map(([engineName, stats]) => ({
          engineName,
          count: stats.count,
          percentage: reportDocs.length > 0 ? (stats.count / reportDocs.length) * 100 : 0,
          averageProcessingTime: stats.count > 0 ? stats.totalTime / stats.count : 0,
          successRate: stats.count > 0 ? (stats.successes / stats.count) * 100 : 0
        }))

        // 품질 지표
        const qualityScores = reportDocs
          .map(doc => doc.data().qualityScore || 0)
          .filter(score => score > 0)

        const qualityMetrics = {
          averageQualityScore: qualityScores.length > 0 ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length : 0,
          highQualityReports: qualityScores.filter(score => score > 80).length,
          lowQualityReports: qualityScores.filter(score => score < 50).length,
          averageProcessingTime: reportDocs.length > 0 ? reportDocs.reduce((sum, doc) => sum + (doc.data().processingTime || 0), 0) / reportDocs.length : 0,
          errorRate: reportDocs.length > 0 ? (reportDocs.filter(doc => doc.data().status === 'failed').length / reportDocs.length) * 100 : 0
        }

        // 사용 패턴 분석
        const hourCounts = new Array(24).fill(0)
        const dayCounts = new Map<string, number>()

        reportDocs.forEach(doc => {
          const createdAt = doc.data().createdAt?.toDate?.()
          if (createdAt) {
            // 시간별 카운트
            hourCounts[createdAt.getHours()]++
            
            // 요일별 카운트
            const dayName = createdAt.toLocaleDateString('ko-KR', { weekday: 'long' })
            dayCounts.set(dayName, (dayCounts.get(dayName) || 0) + 1)
          }
        })

        const peakUsageHours = hourCounts
          .map((count, hour) => ({ hour, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)

        const busyDays = Array.from(dayCounts.entries())
          .map(([day, count]) => ({ day, count }))
          .sort((a, b) => b.count - a.count)

        // 최근 리포트
        const recentReports = reportDocs.slice(0, 10).map(doc => {
          const data = doc.data()
          return {
            reportId: doc.id,
            userId: data.userId || data.measurementUserId || '',
            userName: data.userName || '알 수 없음',
            engineUsed: data.engineName || '',
            qualityScore: data.qualityScore || 0,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            status: data.status || 'completed'
          }
        })

        const analytics: ReportAnalytics = {
          organizationId,
          organizationName: orgData?.name || '알 수 없음',
          reportSummary: {
            totalReports: reportDocs.length,
            reportsThisMonth: reportsThisMonth.length,
            reportsLastMonth: reportsLastMonth.length,
            averageReportsPerUser: mostActiveUsers.length > 0 ? reportDocs.length / mostActiveUsers.length : 0,
            mostActiveUsers
          },
          reportTypes,
          qualityMetrics,
          usagePatterns: {
            peakUsageHours,
            busyDays,
            seasonalTrends: [] // 구현 필요시 추가
          },
          recentReports
        }

        return analytics

      } catch (error) {
        this.log('error', '리포트 분석 조회 실패', { error })
        throw new Error('리포트 분석 정보를 조회할 수 없습니다.')
      }
    })
  }

  /**
   * 기업 관리 액션 실행
   */
  async executeEnterpriseManagementAction(action: EnterpriseManagementAction): Promise<boolean> {
    return this.measureAndLog('executeEnterpriseManagementAction', async () => {
      this.validateSystemAdminAccess()

      try {
        const { organizationId, action: actionType, parameters } = action

        switch (actionType) {
          case 'suspend_organization':
            await this.updateDocument(doc(db, 'organizations', organizationId), {
              status: 'suspended',
              suspendedAt: Timestamp.now(),
              suspensionReason: parameters.reason
            })
            break

          case 'activate_organization':
            await this.updateDocument(doc(db, 'organizations', organizationId), {
              status: 'active',
              activatedAt: Timestamp.now(),
              suspendedAt: null,
              suspensionReason: null
            })
            break

          case 'grant_credits':
            if (parameters.amount) {
              await this.addDocument(collection(db, 'creditTransactions'), {
                organizationId,
                amount: parameters.amount,
                type: 'admin_grant',
                reason: parameters.reason,
                createdAt: Timestamp.now(),
                expiryDate: parameters.expiryDate ? Timestamp.fromDate(parameters.expiryDate) : null
              })
            }
            break

          case 'extend_trial':
            if (parameters.duration) {
              const newEndDate = new Date(Date.now() + parameters.duration * 24 * 60 * 60 * 1000)
              await this.updateDocument(doc(db, 'organizations', organizationId), {
                trialEndDate: Timestamp.fromDate(newEndDate),
                trialExtended: true,
                trialExtensionReason: parameters.reason
              })
            }
            break

          case 'change_plan':
            if (parameters.newPlan) {
              await this.updateDocument(doc(db, 'organizations', organizationId), {
                plan: parameters.newPlan,
                planChangedAt: Timestamp.now(),
                planChangeReason: parameters.reason
              })
            }
            break

          case 'set_limit':
            if (parameters.creditLimit) {
              await this.updateDocument(doc(db, 'organizations', organizationId), {
                creditLimit: parameters.creditLimit,
                limitSetAt: Timestamp.now(),
                limitReason: parameters.reason
              })
            }
            break
        }

        // 활동 기록
        await this.recordSystemActivity({
          organizationId,
          type: 'system_event',
          description: `관리자 액션: ${actionType} - ${parameters.reason}`,
          timestamp: new Date(),
          severity: 'info',
          metadata: { action: actionType, parameters }
        })

        return true

      } catch (error) {
        this.log('error', '기업 관리 액션 실행 실패', { error })
        throw new Error('기업 관리 액션을 실행할 수 없습니다.')
      }
    })
  }

  // ===================== 헬퍼 메서드들 =====================

  private calculateHealthScore(memberCount: number, reportCount: number, activeMembers: number): number {
    let score = 0
    
    // 멤버 수 점수 (30점)
    if (memberCount > 20) score += 30
    else if (memberCount > 10) score += 20
    else if (memberCount > 5) score += 15
    else if (memberCount > 0) score += 10

    // 활동성 점수 (40점)
    const activityRate = memberCount > 0 ? (activeMembers / memberCount) * 100 : 0
    if (activityRate > 80) score += 40
    else if (activityRate > 60) score += 30
    else if (activityRate > 40) score += 20
    else if (activityRate > 20) score += 10

    // 리포트 활용도 점수 (30점)
    const reportsPerMember = memberCount > 0 ? reportCount / memberCount : 0
    if (reportsPerMember > 5) score += 30
    else if (reportsPerMember > 3) score += 25
    else if (reportsPerMember > 1) score += 20
    else if (reportsPerMember > 0) score += 15

    return Math.min(100, score)
  }

  private calculateRiskLevel(activeMembers: number, totalMembers: number, creditBalance: number): 'low' | 'medium' | 'high' {
    const activityRate = totalMembers > 0 ? (activeMembers / totalMembers) * 100 : 0
    
    if (creditBalance <= 0 || activityRate < 20) return 'high'
    if (creditBalance < 50 || activityRate < 50) return 'medium'
    return 'low'
  }

  private calculateChurnRisk(activeMembers: number, totalMembers: number, lastActivity: number): number {
    const activityRate = totalMembers > 0 ? (activeMembers / totalMembers) * 100 : 0
    const daysSinceLastActivity = (Date.now() - lastActivity) / (24 * 60 * 60 * 1000)
    
    let risk = 0
    
    // 활동률 기반 위험도
    if (activityRate < 20) risk += 40
    else if (activityRate < 50) risk += 20
    else if (activityRate < 80) risk += 10

    // 마지막 활동 기반 위험도
    if (daysSinceLastActivity > 30) risk += 30
    else if (daysSinceLastActivity > 14) risk += 20
    else if (daysSinceLastActivity > 7) risk += 10

    return Math.min(100, risk)
  }

  private async getRecentOrganizationActivity(organizationId: string): Promise<EnterpriseOverview['recentActivity']> {
    try {
      const activitiesQuery = query(
        collection(db, 'systemActivities'),
        where('organizationId', '==', organizationId),
        orderBy('timestamp', 'desc'),
                    firestoreLimit(5)
      )

      const activities = await getDocs(activitiesQuery)
      
      return activities.docs.map(doc => {
        const data = doc.data()
        return {
          type: data.type || 'admin_action',
          description: data.description || '',
          timestamp: data.timestamp?.toDate?.() || new Date(),
          metadata: data.metadata
        }
      })
    } catch (error) {
      this.log('error', '최근 활동 조회 실패', { organizationId, error })
      return []
    }
  }

  // ===================== 디바이스 관리 기능 메서드들 =====================

  /**
   * 전체 시스템 디바이스 현황 조회
   */
  async getSystemDeviceOverview(): Promise<SystemDeviceOverview> {
    return this.measureAndLog('getSystemDeviceOverview', async () => {
      this.validateSystemAdminAccess()

      try {
        // 모든 조직의 디바이스 정보 수집
        const organizationsSnapshot = await getDocs(collection(db, 'organizations'))
        const organizations = organizationsSnapshot.docs

        const organizationBreakdown = []
        let totalDevices = 0
        let activeDevices = 0
        let offlineDevices = 0
        let maintenanceDevices = 0
        let errorDevices = 0
        let totalBatteryLevel = 0
        let deviceCount = 0

        const deviceTypeCounts = new Map<string, { total: number; active: number }>()
        const recentActivity = []

        // 각 조직별로 디바이스 정보 수집
        for (const orgDoc of organizations) {
          const orgData = orgDoc.data()
          const organizationId = orgDoc.id

          // 조직의 디바이스 조회
          const devicesQuery = query(
            collection(db, 'devices'),
            where('organizationId', '==', organizationId),
            where('isActive', '==', true)
          )

          const devicesSnapshot = await getDocs(devicesQuery)
          const orgDevices = devicesSnapshot.docs

          // 조직별 통계 계산
          let orgActiveDevices = 0
          let orgOfflineDevices = 0
          let orgErrorDevices = 0
          let orgTotalBattery = 0
          let orgLastActivity = new Date(0)

          orgDevices.forEach(deviceDoc => {
            const device = deviceDoc.data()
            totalDevices++
            deviceCount++

            // 상태별 카운트
            switch (device.status) {
              case 'online':
                activeDevices++
                orgActiveDevices++
                break
              case 'offline':
                offlineDevices++
                orgOfflineDevices++
                break
              case 'maintenance':
                maintenanceDevices++
                break
              case 'error':
                errorDevices++
                orgErrorDevices++
                break
            }

            // 배터리 레벨 집계
            if (device.batteryLevel) {
              totalBatteryLevel += device.batteryLevel
              orgTotalBattery += device.batteryLevel
            }

            // 디바이스 타입별 집계
            const deviceType = device.type || 'WEARABLE'
            const typeCounts = deviceTypeCounts.get(deviceType) || { total: 0, active: 0 }
            typeCounts.total++
            if (device.status === 'online') typeCounts.active++
            deviceTypeCounts.set(deviceType, typeCounts)

            // 마지막 활동 시간 추적
            const lastSync = device.lastSyncAt?.toDate?.() || device.updatedAt?.toDate?.()
            if (lastSync && lastSync > orgLastActivity) {
              orgLastActivity = lastSync
            }
          })

          // 조직별 정보 추가
          organizationBreakdown.push({
            organizationId,
            organizationName: orgData.name || '알 수 없음',
            totalDevices: orgDevices.length,
            activeDevices: orgActiveDevices,
            offlineDevices: orgOfflineDevices,
            errorDevices: orgErrorDevices,
            averageBatteryLevel: orgDevices.length > 0 ? Math.round(orgTotalBattery / orgDevices.length) : 0,
            lastActivity: orgLastActivity
          })
        }

        // 디바이스 타입별 백분율 계산
        const deviceTypeBreakdown = Array.from(deviceTypeCounts.entries()).map(([type, counts]) => ({
          type: type as 'EEG' | 'PPG' | 'MULTI_SENSOR' | 'WEARABLE',
          count: counts.total,
          activeCount: counts.active,
          percentage: totalDevices > 0 ? Math.round((counts.total / totalDevices) * 100) : 0
        }))

        // 최근 디바이스 활동 조회
        const recentActivitiesQuery = query(
          collection(db, 'deviceActivities'),
          orderBy('timestamp', 'desc'),
          limit(10)
        )

        const recentActivitiesSnapshot = await getDocs(recentActivitiesQuery)
        const recentDeviceActivity = recentActivitiesSnapshot.docs.map(doc => {
          const data = doc.data()
          return {
            deviceId: data.deviceId || '',
            deviceName: data.deviceName || '알 수 없음',
            organizationId: data.organizationId || '',
            organizationName: data.organizationName || '알 수 없음',
            action: data.action || '',
            timestamp: data.timestamp?.toDate?.() || new Date(),
            details: data.details
          }
        })

        const overview: SystemDeviceOverview = {
          totalDevices,
          activeDevices,
          offlineDevices,
          maintenanceDevices,
          errorDevices,
          averageBatteryLevel: deviceCount > 0 ? Math.round(totalBatteryLevel / deviceCount) : 0,
          devicesNeedingAttention: errorDevices + maintenanceDevices,
          organizationBreakdown: organizationBreakdown.sort((a, b) => b.totalDevices - a.totalDevices),
          deviceTypeBreakdown,
          recentActivity: recentDeviceActivity
        }

        return overview

      } catch (error) {
        this.log('error', '시스템 디바이스 현황 조회 실패', { error })
        throw new Error('시스템 디바이스 현황을 조회할 수 없습니다.')
      }
    })
  }

  /**
   * 특정 조직의 상세 디바이스 현황 조회
   */
  async getOrganizationDeviceBreakdown(organizationId: string): Promise<OrganizationDeviceBreakdown> {
    return this.measureAndLog('getOrganizationDeviceBreakdown', async () => {
      this.validateSystemAdminAccess()

      try {
        // 조직 정보 조회
        const orgDoc = await getDoc(doc(db, 'organizations', organizationId))
        if (!orgDoc.exists()) {
          throw new Error('조직을 찾을 수 없습니다.')
        }
        const orgData = orgDoc.data()

        // 디바이스 목록 조회
        const devicesQuery = query(
          collection(db, 'devices'),
          where('organizationId', '==', organizationId),
          where('isActive', '==', true)
        )

        const devicesSnapshot = await getDocs(devicesQuery)
        const devices = devicesSnapshot.docs

        // 디바이스 통계 계산
        const deviceStats = {
          online: 0,
          offline: 0,
          maintenance: 0,
          error: 0,
          lowBattery: 0,
          needsCalibration: 0,
          needsFirmwareUpdate: 0
        }

        const deviceTypeCounts = new Map<string, { total: number; active: number }>()
        let totalSessions = 0
        let totalSessionTime = 0

        devices.forEach(deviceDoc => {
          const device = deviceDoc.data()

          // 상태별 통계
          switch (device.status) {
            case 'online': deviceStats.online++; break
            case 'offline': deviceStats.offline++; break
            case 'maintenance': deviceStats.maintenance++; break
            case 'error': deviceStats.error++; break
          }

          // 기타 통계
          if (device.batteryLevel && device.batteryLevel < 20) deviceStats.lowBattery++
          if (!device.isCalibrated) deviceStats.needsCalibration++
          if (this.needsFirmwareUpdate(device)) deviceStats.needsFirmwareUpdate++

          // 디바이스 타입별 통계
          const deviceType = device.type || 'WEARABLE'
          const typeCounts = deviceTypeCounts.get(deviceType) || { total: 0, active: 0 }
          typeCounts.total++
          if (device.status === 'online') typeCounts.active++
          deviceTypeCounts.set(deviceType, typeCounts)
        })

        // 디바이스 타입별 배열 생성
        const deviceTypes = Array.from(deviceTypeCounts.entries()).map(([type, counts]) => ({
          type,
          count: counts.total,
          activeCount: counts.active
        }))

        // 부서별 디바이스 할당 현황 조회
        const departmentsQuery = query(
          collection(db, 'departments'),
          where('organizationId', '==', organizationId)
        )

        const departmentsSnapshot = await getDocs(departmentsQuery)
        const departmentBreakdown = []

        for (const deptDoc of departmentsSnapshot.docs) {
          const deptData = deptDoc.data()
          const departmentId = deptDoc.id

          // 부서에 할당된 디바이스 조회
          const deptDevicesQuery = query(
            collection(db, 'devices'),
            where('organizationId', '==', organizationId),
            where('assignedLocation', '==', deptData.name)
          )

          const deptDevicesSnapshot = await getDocs(deptDevicesQuery)
          const assignedDevices = deptDevicesSnapshot.docs.length
          const activeDevices = deptDevicesSnapshot.docs.filter(doc => 
            doc.data().status === 'online'
          ).length

          departmentBreakdown.push({
            departmentId,
            departmentName: deptData.name || '알 수 없음',
            assignedDevices,
            activeDevices,
            utilizationRate: assignedDevices > 0 ? Math.round((activeDevices / assignedDevices) * 100) : 0
          })
        }

        // 최근 디바이스 활동 조회
        const recentActivityQuery = query(
          collection(db, 'deviceActivities'),
          where('organizationId', '==', organizationId),
          orderBy('timestamp', 'desc'),
          limit(10)
        )

        const recentActivitySnapshot = await getDocs(recentActivityQuery)
        const recentDeviceActivity = recentActivitySnapshot.docs.map(doc => {
          const data = doc.data()
          return {
            deviceId: data.deviceId || '',
            deviceName: data.deviceName || '알 수 없음',
            action: data.action || 'assigned',
            timestamp: data.timestamp?.toDate?.() || new Date(),
            userId: data.userId,
            userName: data.userName,
            details: data.details
          }
        })

        // 전체 활용률 계산
        const utilizationRate = devices.length > 0 ? 
          Math.round((deviceStats.online / devices.length) * 100) : 0

        // 건강 점수 계산 (에러가 적고, 배터리가 충분하고, 활용률이 높을수록 높은 점수)
        const healthScore = this.calculateDeviceHealthScore(
          devices.length,
          deviceStats.online,
          deviceStats.error,
          deviceStats.lowBattery
        )

        const breakdown: OrganizationDeviceBreakdown = {
          organizationId,
          organizationName: orgData.name || '알 수 없음',
          companyCode: orgData.companyCode || '',
          totalDevices: devices.length,
          deviceStats,
          deviceTypes,
          utilizationRate,
          averageSessionTime: totalSessions > 0 ? Math.round(totalSessionTime / totalSessions) : 0,
          departmentBreakdown,
          recentDeviceActivity,
          healthScore,
          issuesCount: deviceStats.error + deviceStats.lowBattery + deviceStats.needsCalibration
        }

        return breakdown

      } catch (error) {
        this.log('error', '조직 디바이스 현황 조회 실패', { organizationId, error })
        throw new Error('조직 디바이스 현황을 조회할 수 없습니다.')
      }
    })
  }

  /**
   * 디바이스 사용 분석 조회
   */
  async getDeviceUsageAnalytics(organizationId: string, timeRange: 'week' | 'month' | 'quarter' = 'month'): Promise<DeviceUsageAnalytics> {
    return this.measureAndLog('getDeviceUsageAnalytics', async () => {
      this.validateSystemAdminAccess()

      try {
        // 조직 정보 조회
        const orgDoc = await getDoc(doc(db, 'organizations', organizationId))
        const orgData = orgDoc.data()

        // 시간 범위 설정
        const endDate = new Date()
        const startDate = new Date()
        switch (timeRange) {
          case 'week':
            startDate.setDate(endDate.getDate() - 7)
            break
          case 'month':
            startDate.setMonth(endDate.getMonth() - 1)
            break
          case 'quarter':
            startDate.setMonth(endDate.getMonth() - 3)
            break
        }

        // 측정 세션 데이터 조회
        const sessionsQuery = query(
          collection(db, 'measurementSessions'),
          where('organizationId', '==', organizationId),
          where('startTime', '>=', Timestamp.fromDate(startDate)),
          where('startTime', '<=', Timestamp.fromDate(endDate))
        )

        const sessionsSnapshot = await getDocs(sessionsQuery)
        const sessions = sessionsSnapshot.docs

        // 사용 지표 계산
        const usageMetrics = {
          totalSessions: sessions.length,
          averageSessionDuration: 0,
          totalDataCollected: 0,
          peakUsageHours: [] as Array<{ hour: number; sessionCount: number }>,
          dailyUsagePattern: [] as Array<{ date: string; sessionCount: number; totalDuration: number }>
        }

        // 세션별 분석
        const hourCounts = new Array(24).fill(0)
        const dailyCounts = new Map<string, { count: number; duration: number }>()
        let totalDuration = 0

        sessions.forEach(sessionDoc => {
          const session = sessionDoc.data()
          const startTime = session.startTime?.toDate?.()
          const duration = session.duration || 0

          if (startTime) {
            // 시간별 카운트
            hourCounts[startTime.getHours()]++

            // 일별 카운트
            const dateKey = startTime.toISOString().split('T')[0]
            const dayData = dailyCounts.get(dateKey) || { count: 0, duration: 0 }
            dayData.count++
            dayData.duration += duration
            dailyCounts.set(dateKey, dayData)

            totalDuration += duration
          }
        })

        usageMetrics.averageSessionDuration = sessions.length > 0 ? Math.round(totalDuration / sessions.length) : 0
        usageMetrics.peakUsageHours = hourCounts
          .map((count, hour) => ({ hour, sessionCount: count }))
          .sort((a, b) => b.sessionCount - a.sessionCount)
          .slice(0, 5)

        usageMetrics.dailyUsagePattern = Array.from(dailyCounts.entries()).map(([date, data]) => ({
          date,
          sessionCount: data.count,
          totalDuration: data.duration
        }))

        // 디바이스 성능 분석 (모의 데이터)
        const devicePerformance = sessions
          .reduce((acc, sessionDoc) => {
            const session = sessionDoc.data()
            const deviceId = session.deviceId || 'unknown'
            
            if (!acc[deviceId]) {
              acc[deviceId] = {
                sessionCount: 0,
                totalUptime: 0,
                errorCount: 0
              }
            }
            
            acc[deviceId].sessionCount++
            acc[deviceId].totalUptime += session.duration || 0
            if (session.hasError) acc[deviceId].errorCount++
            
            return acc
          }, {} as Record<string, any>)

        // 사용자 참여 분석 (모의 데이터)
        const userEngagement = sessions
          .reduce((acc, sessionDoc) => {
            const session = sessionDoc.data()
            const userId = session.userId || session.measurementUserId || 'unknown'
            const userName = session.userName || '알 수 없음'
            
            if (!acc[userId]) {
              acc[userId] = {
                userName,
                sessionCount: 0,
                totalDuration: 0,
                lastActivity: new Date(0)
              }
            }
            
            acc[userId].sessionCount++
            acc[userId].totalDuration += session.duration || 0
            
            const sessionDate = session.startTime?.toDate?.()
            if (sessionDate && sessionDate > acc[userId].lastActivity) {
              acc[userId].lastActivity = sessionDate
            }
            
            return acc
          }, {} as Record<string, any>)

        // 알림 생성 (모의 데이터)
        const alerts = [] // 실제 구현에서는 디바이스 상태 기반으로 알림 생성

        const analytics: DeviceUsageAnalytics = {
          organizationId,
          organizationName: orgData?.name || '알 수 없음',
          timeRange,
          usageMetrics,
          devicePerformance: Object.entries(devicePerformance).map(([deviceId, data]: [string, any]) => ({
            deviceId,
            deviceName: `Device-${deviceId.slice(0, 8)}`,
            serialNumber: `SN${deviceId.slice(-6)}`,
            sessionCount: data.sessionCount,
            totalUptime: Math.round(data.totalUptime / 60), // hours
            errorRate: data.sessionCount > 0 ? Math.round((data.errorCount / data.sessionCount) * 100) : 0,
            batteryPerformance: 85, // 모의 데이터
            dataQuality: 92 // 모의 데이터
          })),
          userEngagement: Object.entries(userEngagement).map(([userId, data]: [string, any]) => ({
            userId,
            userName: data.userName,
            sessionCount: data.sessionCount,
            averageSessionTime: data.sessionCount > 0 ? Math.round(data.totalDuration / data.sessionCount) : 0,
            lastActivity: data.lastActivity,
            consistencyScore: 85 // 모의 데이터
          })),
          alerts
        }

        return analytics

      } catch (error) {
        this.log('error', '디바이스 사용 분석 조회 실패', { organizationId, error })
        throw new Error('디바이스 사용 분석을 조회할 수 없습니다.')
      }
    })
  }

  /**
   * 디바이스 관리 액션 실행
   */
  async executeDeviceManagementAction(action: DeviceManagementAction): Promise<boolean> {
    return this.measureAndLog('executeDeviceManagementAction', async () => {
      this.validateSystemAdminAccess()

      try {
        const { deviceId, organizationId, action: actionType, parameters } = action

        // 디바이스 존재 확인
        const deviceDoc = await getDoc(doc(db, 'devices', deviceId))
        if (!deviceDoc.exists()) {
          throw new Error('디바이스를 찾을 수 없습니다.')
        }

        const deviceData = deviceDoc.data()

        switch (actionType) {
          case 'update_firmware':
            // 펌웨어 업데이트 스케줄링
            await this.updateDocument(doc(db, 'devices', deviceId), {
              firmwareVersion: parameters.firmwareVersion,
              maintenanceScheduledAt: parameters.scheduledFor ? Timestamp.fromDate(parameters.scheduledFor) : Timestamp.now(),
              status: 'maintenance',
              updatedAt: Timestamp.now()
            })
            break

          case 'schedule_maintenance':
            // 유지보수 스케줄링
            await this.updateDocument(doc(db, 'devices', deviceId), {
              maintenanceScheduledAt: parameters.scheduledFor ? Timestamp.fromDate(parameters.scheduledFor) : Timestamp.now(),
              status: 'maintenance',
              updatedAt: Timestamp.now()
            })
            break

          case 'reassign_device':
            // 디바이스 재할당
            if (parameters.newUserId) {
              await this.updateDocument(doc(db, 'devices', deviceId), {
                assignedUserId: parameters.newUserId,
                pairedAt: Timestamp.now(),
                isPaired: true,
                updatedAt: Timestamp.now()
              })
            }
            break

          case 'force_sync':
            // 강제 동기화
            await this.updateDocument(doc(db, 'devices', deviceId), {
              lastSyncAt: Timestamp.now(),
              updatedAt: Timestamp.now()
            })
            break

          case 'calibrate_device':
            // 디바이스 캘리브레이션
            await this.updateDocument(doc(db, 'devices', deviceId), {
              isCalibrated: true,
              calibrationDate: Timestamp.now(),
              updatedAt: Timestamp.now()
            })
            break
        }

        // 활동 기록 생성
        await this.addDocument(collection(db, 'deviceActivities'), {
          deviceId,
          organizationId,
          deviceName: deviceData.name || '알 수 없음',
          action: actionType,
          details: parameters.reason,
          timestamp: Timestamp.now(),
          performedBy: 'system_admin',
          priority: action.priority,
          metadata: parameters
        })

        return true

      } catch (error) {
        this.log('error', '디바이스 관리 액션 실행 실패', { error })
        throw new Error('디바이스 관리 액션을 실행할 수 없습니다.')
      }
    })
  }

  // ===================== 디바이스 관리 헬퍼 메서드들 =====================

  private needsFirmwareUpdate(device: any): boolean {
    // 간단한 펌웨어 버전 체크 (실제로는 더 복잡한 로직 필요)
    const currentVersion = device.firmwareVersion || '1.0.0'
    const latestVersion = '2.1.0' // 하드코딩된 최신 버전
    
    return currentVersion < latestVersion
  }

  private calculateDeviceHealthScore(
    totalDevices: number,
    onlineDevices: number,
    errorDevices: number,
    lowBatteryDevices: number
  ): number {
    if (totalDevices === 0) return 100

    let score = 100

    // 온라인 비율 (40점)
    const onlineRatio = onlineDevices / totalDevices
    score -= (1 - onlineRatio) * 40

    // 에러 디바이스 비율 (30점)
    const errorRatio = errorDevices / totalDevices
    score -= errorRatio * 30

    // 저배터리 디바이스 비율 (30점)
    const lowBatteryRatio = lowBatteryDevices / totalDevices
    score -= lowBatteryRatio * 30

    return Math.max(0, Math.round(score))
  }

  /**
   * 크레딧 트렌드 분석 데이터 조회
   */
  async getCreditTrendsAnalysis(): Promise<{
    dailyUsage: Array<{ date: string; credits: number; revenue: number }>
    monthlyRevenue: Array<{ month: string; revenue: number; transactions: number }>
    topSpendingOrganizations: Array<{ 
      organizationId: string
      organizationName: string
      totalSpent: number
      avgMonthlySpent: number
      creditBalance: number
    }>
    revenueGrowth: {
      thisMonth: number
      lastMonth: number
      growthRate: number
    }
  }> {
    return this.measureAndLog('getCreditTrendsAnalysis', async () => {
      this.validateSystemAdminAccess()
      
      try {
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        
        // 최근 30일 크레딧 사용량 조회
        const recentTransactionsQuery = query(
          collection(db, 'creditTransactions'),
          where('createdAt', '>=', thirtyDaysAgo.getTime()),
          where('amount', '<', 0), // 사용량만 (음수)
          orderBy('createdAt', 'desc')
        )
        const recentTransactions = await getDocs(recentTransactionsQuery)
        
        // 일별 사용량 집계
        const dailyUsage = new Map<string, { credits: number; revenue: number }>()
        
        recentTransactions.docs.forEach(doc => {
          const data = doc.data()
          const date = new Date(data.createdAt).toISOString().split('T')[0]
          const credits = Math.abs(data.amount)
          const revenue = credits * 15 // 크레딧당 15원 가정
          
          const current = dailyUsage.get(date) || { credits: 0, revenue: 0 }
          dailyUsage.set(date, {
            credits: current.credits + credits,
            revenue: current.revenue + revenue
          })
        })
        
        // 최근 6개월 월별 수익 조회
        const monthlyRevenue: Array<{ month: string; revenue: number; transactions: number }> = []
        for (let i = 5; i >= 0; i--) {
          const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
          
          const monthQuery = query(
            collection(db, 'creditTransactions'),
            where('createdAt', '>=', monthStart.getTime()),
            where('createdAt', '<=', monthEnd.getTime()),
            where('amount', '<', 0)
          )
          const monthTransactions = await getDocs(monthQuery)
          
          const totalCredits = monthTransactions.docs.reduce((sum, doc) => 
            sum + Math.abs(doc.data().amount), 0
          )
          
          monthlyRevenue.push({
            month: monthStart.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' }),
            revenue: totalCredits * 15,
            transactions: monthTransactions.docs.length
          })
        }
        
        // 최고 소비 조직 분석
        const orgsSnapshot = await getDocs(collection(db, 'organizations'))
        const topSpendingOrganizations = []
        
        for (const orgDoc of orgsSnapshot.docs) {
          const orgData = orgDoc.data()
          
          const orgTransactionsQuery = query(
            collection(db, 'creditTransactions'),
            where('organizationId', '==', orgDoc.id),
            where('amount', '<', 0)
          )
          const orgTransactions = await getDocs(orgTransactionsQuery)
          
          const totalSpent = orgTransactions.docs.reduce((sum, doc) => 
            sum + Math.abs(doc.data().amount), 0
          )
          
          if (totalSpent > 0) {
            // 최근 3개월 평균 계산
            const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
            const recentOrgTransactions = orgTransactions.docs.filter(doc => 
              doc.data().createdAt >= threeMonthsAgo.getTime()
            )
            const recentSpent = recentOrgTransactions.reduce((sum, doc) => 
              sum + Math.abs(doc.data().amount), 0
            )
            const avgMonthlySpent = recentSpent / 3
            
            topSpendingOrganizations.push({
              organizationId: orgDoc.id,
              organizationName: orgData.name || '조직명 없음',
              totalSpent,
              avgMonthlySpent,
              creditBalance: orgData.creditBalance || 0
            })
          }
        }
        
        // 수익 성장률 계산
        const thisMonthRevenue = monthlyRevenue[monthlyRevenue.length - 1]?.revenue || 0
        const lastMonthRevenue = monthlyRevenue[monthlyRevenue.length - 2]?.revenue || 0
        const growthRate = lastMonthRevenue > 0 
          ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
          : 0
        
        return {
          dailyUsage: Array.from(dailyUsage.entries()).map(([date, data]) => ({
            date,
            credits: data.credits,
            revenue: data.revenue
          })).sort((a, b) => a.date.localeCompare(b.date)),
          monthlyRevenue,
          topSpendingOrganizations: topSpendingOrganizations
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 10),
          revenueGrowth: {
            thisMonth: thisMonthRevenue,
            lastMonth: lastMonthRevenue,
            growthRate
          }
        }
        
      } catch (error) {
        this.log('error', '크레딧 트렌드 분석 실패', { error })
        throw error
      }
    })
  }

  /**
   * 기업별 실시간 성과 대시보드 데이터 조회
   */
  async getEnterprisePerformanceDashboard(organizationId: string): Promise<{
    realTimeMetrics: {
      onlineUsers: number
      activeSessions: number
      recentReports: number
      errorRate: number
    }
    weeklyTrends: Array<{
      date: Date
      measurements: number
      reports: number
      credits: number
      activeUsers: number
    }>
    riskMetrics: {
      creditDepletionDays: number
      inactivityScore: number
      errorTrend: 'increasing' | 'decreasing' | 'stable'
      supportTickets: number
    }
    memberActivity: Array<{
      memberName: string
      lastActivity: Date
      measurementsCount: number
      reportsCount: number
      status: 'active' | 'inactive' | 'new'
    }>
  }> {
    return this.measureAndLog('getEnterprisePerformanceDashboard', async () => {
      this.validateSystemAdminAccess()

      try {
        const now = new Date()
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const last30Minutes = new Date(now.getTime() - 30 * 60 * 1000)

        // 병렬로 데이터 수집
        const [
          members,
          recentSessions,
          recentReports,
          creditTransactions,
          weeklyActivities,
          recentErrors
        ] = await Promise.all([
          // 조직 멤버들
          getDocs(query(
            collection(db, 'organizationMembers'),
            where('organizationId', '==', organizationId)
          )),
          // 최근 24시간 세션
          getDocs(query(
            collection(db, 'measurementSessions'),
            where('organizationId', '==', organizationId),
            where('startTime', '>=', Timestamp.fromDate(last24Hours))
          )),
          // 최근 24시간 리포트
          getDocs(query(
            collection(db, 'aiReports'),
            where('organizationId', '==', organizationId),
            where('createdAt', '>=', last24Hours.getTime()),
            orderBy('createdAt', 'desc')
          )),
          // 크레딧 거래
          getDocs(query(
            collection(db, 'creditTransactions'),
            where('organizationId', '==', organizationId),
            where('createdAt', '>=', Timestamp.fromDate(lastWeek)),
            orderBy('createdAt', 'desc')
          )),
          // 지난 주 활동 (사용자별)
          getDocs(query(
            collection(db, 'users'),
            where('organizationId', '==', organizationId),
            where('lastActiveAt', '>=', lastWeek.getTime())
          )),
          // 최근 에러 로그
          getDocs(query(
            collection(db, 'systemLogs'),
            where('organizationId', '==', organizationId),
            where('level', '==', 'error'),
            where('timestamp', '>=', Timestamp.fromDate(last24Hours)),
            limit(50)
          ))
        ])

        // 실시간 지표 계산
        const onlineUsers = members.docs.filter(doc => {
          const lastActive = doc.data().lastActivity?.toDate?.()
          return lastActive && lastActive >= last30Minutes
        }).length

        const activeSessions = recentSessions.docs.filter(doc => {
          const data = doc.data()
          return !data.endTime || data.endTime?.toDate?.() >= last30Minutes
        }).length

        const recentReportsCount = recentReports.docs.length
        const errorRate = recentErrors.docs.length / Math.max(recentSessions.docs.length, 1) * 100

        // 주간 트렌드 계산
        const weeklyTrends = []
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
          const dayStart = new Date(date)
          dayStart.setHours(0, 0, 0, 0)
          const dayEnd = new Date(date)
          dayEnd.setHours(23, 59, 59, 999)

          const dayMeasurements = recentSessions.docs.filter(doc => {
            const startTime = doc.data().startTime?.toDate?.()
            return startTime && startTime >= dayStart && startTime <= dayEnd
          }).length

          const dayReports = recentReports.docs.filter(doc => {
            const createdAt = new Date(doc.data().createdAt)
            return createdAt >= dayStart && createdAt <= dayEnd
          }).length

          const dayCredits = Math.abs(creditTransactions.docs
            .filter(doc => {
              const createdAt = doc.data().createdAt?.toDate?.()
              return createdAt && createdAt >= dayStart && createdAt <= dayEnd && doc.data().amount < 0
            })
            .reduce((sum, doc) => sum + Math.abs(doc.data().amount || 0), 0))

          const dayActiveUsers = weeklyActivities.docs.filter(doc => {
            const lastActive = new Date(doc.data().lastActiveAt)
            return lastActive >= dayStart && lastActive <= dayEnd
          }).length

          weeklyTrends.push({
            date: dayStart,
            measurements: dayMeasurements,
            reports: dayReports,
            credits: dayCredits,
            activeUsers: dayActiveUsers
          })
        }

        // 위험 지표 계산
        const currentBalance = creditTransactions.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0)
        const avgDailyCreditUsage = Math.abs(creditTransactions.docs
          .filter(doc => doc.data().amount < 0)
          .reduce((sum, doc) => sum + Math.abs(doc.data().amount || 0), 0)) / 7

        const creditDepletionDays = avgDailyCreditUsage > 0 ? Math.floor(currentBalance / avgDailyCreditUsage) : 999

        const recentActivity = members.docs.filter(doc => {
          const lastActive = doc.data().lastActivity?.toDate?.()
          return lastActive && lastActive >= lastWeek
        }).length

        const inactivityScore = Math.max(0, 100 - (recentActivity / members.docs.length) * 100)

        // 에러 트렌드 분석
        const recentErrorsCount = recentErrors.docs.filter(doc => {
          const timestamp = doc.data().timestamp?.toDate?.()
          return timestamp && timestamp >= new Date(now.getTime() - 12 * 60 * 60 * 1000)
        }).length

        const olderErrorsCount = recentErrors.docs.filter(doc => {
          const timestamp = doc.data().timestamp?.toDate?.()
          const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000)
          return timestamp && timestamp >= last24Hours && timestamp < twelveHoursAgo
        }).length

        let errorTrend: 'increasing' | 'decreasing' | 'stable' = 'stable'
        if (recentErrorsCount > olderErrorsCount * 1.2) errorTrend = 'increasing'
        else if (recentErrorsCount < olderErrorsCount * 0.8) errorTrend = 'decreasing'

        // 멤버 활동 분석
        const memberActivity = await Promise.all(
          members.docs.map(async (memberDoc) => {
            const memberData = memberDoc.data()
            const userId = memberData.userId

            const [userSessions, userReports] = await Promise.all([
              getDocs(query(
                collection(db, 'measurementSessions'),
                where('userId', '==', userId),
                where('startTime', '>=', Timestamp.fromDate(lastWeek))
              )),
              getDocs(query(
                collection(db, 'aiReports'),
                where('userId', '==', userId),
                where('createdAt', '>=', lastWeek.getTime())
              ))
            ])

            const lastActivity = memberData.lastActivity?.toDate?.() || new Date(0)
            const isNewMember = memberData.createdAt?.toDate?.() >= lastWeek
            
            let status: 'active' | 'inactive' | 'new' = 'inactive'
            if (isNewMember) status = 'new'
            else if (lastActivity >= new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)) status = 'active'

            return {
              memberName: memberData.name || memberData.email || '알 수 없음',
              lastActivity,
              measurementsCount: userSessions.docs.length,
              reportsCount: userReports.docs.length,
              status
            }
          })
        )

        return {
          realTimeMetrics: {
            onlineUsers,
            activeSessions,
            recentReports: recentReportsCount,
            errorRate
          },
          weeklyTrends,
          riskMetrics: {
            creditDepletionDays,
            inactivityScore,
            errorTrend,
            supportTickets: 0 // TODO: 지원 티켓 시스템 구현 시 연결
          },
          memberActivity: memberActivity.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())
        }

      } catch (error) {
        this.log('error', '기업 성과 대시보드 조회 실패', {
          organizationId,
          error: error instanceof Error ? error.message : String(error)
        })
        throw error
      }
    })
  }

  /**
   * 기업별 비교 분석 데이터 조회
   */
  async getEnterpriseComparisonAnalytics(): Promise<{
    topPerformers: Array<{
      organizationId: string
      organizationName: string
      score: number
      metrics: {
        reportsPerMember: number
        averageSessionTime: number
        memberRetentionRate: number
        creditEfficiency: number
      }
    }>
    industryBenchmarks: {
      avgReportsPerMember: number
      avgSessionTime: number
      avgMemberRetentionRate: number
      avgCreditEfficiency: number
    }
    growthTrends: Array<{
      organizationId: string
      organizationName: string
      monthlyGrowth: {
        members: number
        reports: number
        sessions: number
      }
    }>
  }> {
    return this.measureAndLog('getEnterpriseComparisonAnalytics', async () => {
      this.validateSystemAdminAccess()

      try {
        const now = new Date()
        const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

        // 모든 조직 데이터 수집
        const organizations = await getDocs(collection(db, 'organizations'))
        const performanceData = []

        for (const orgDoc of organizations.docs) {
          const orgData = orgDoc.data()
          const organizationId = orgDoc.id

          // 병렬로 데이터 수집
          const [
            members,
            reports,
            sessions,
            creditTransactions,
            oldMembers,
            oldReports,
            oldSessions
          ] = await Promise.all([
            getDocs(query(collection(db, 'organizationMembers'), where('organizationId', '==', organizationId))),
            getDocs(query(collection(db, 'aiReports'), where('organizationId', '==', organizationId), where('createdAt', '>=', lastMonth.getTime()))),
            getDocs(query(collection(db, 'measurementSessions'), where('organizationId', '==', organizationId), where('startTime', '>=', Timestamp.fromDate(lastMonth)))),
            getDocs(query(collection(db, 'creditTransactions'), where('organizationId', '==', organizationId), where('amount', '<', 0))),
            // 2개월 전 데이터
            getDocs(query(collection(db, 'organizationMembers'), where('organizationId', '==', organizationId), where('createdAt', '<=', Timestamp.fromDate(twoMonthsAgo)))),
            getDocs(query(collection(db, 'aiReports'), where('organizationId', '==', organizationId), where('createdAt', '>=', twoMonthsAgo.getTime()), where('createdAt', '<', lastMonth.getTime()))),
            getDocs(query(collection(db, 'measurementSessions'), where('organizationId', '==', organizationId), where('startTime', '>=', Timestamp.fromDate(twoMonthsAgo)), where('startTime', '<', Timestamp.fromDate(lastMonth))))
          ])

          // 메트릭 계산
          const reportsPerMember = members.docs.length > 0 ? reports.docs.length / members.docs.length : 0
          
          const sessionDurations = sessions.docs.map(doc => {
            const data = doc.data()
            const start = data.startTime?.toDate?.()?.getTime() || 0
            const end = data.endTime?.toDate?.()?.getTime() || start + (5 * 60 * 1000) // 기본 5분
            return (end - start) / (1000 * 60) // 분 단위
          }).filter(duration => duration > 0 && duration < 120) // 2시간 이하만

          const averageSessionTime = sessionDurations.length > 0 
            ? sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length 
            : 0

          // 멤버 유지율 (30일 이상 활동한 멤버 비율)
          const retainedMembers = members.docs.filter(doc => {
            const lastActivity = doc.data().lastActivity?.toDate?.()
            const joinDate = doc.data().createdAt?.toDate?.()
            return lastActivity && joinDate && 
                   lastActivity >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) &&
                   joinDate <= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          }).length

          const eligibleMembers = members.docs.filter(doc => {
            const joinDate = doc.data().createdAt?.toDate?.()
            return joinDate && joinDate <= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          }).length

          const memberRetentionRate = eligibleMembers > 0 ? (retainedMembers / eligibleMembers) * 100 : 0

          // 크레딧 효율성 (리포트당 크레딧 사용량)
          const totalCreditsUsed = creditTransactions.docs.reduce((sum, doc) => sum + Math.abs(doc.data().amount || 0), 0)
          const creditEfficiency = reports.docs.length > 0 ? totalCreditsUsed / reports.docs.length : 0

          // 성과 점수 계산 (0-100)
          const score = Math.min(100, 
            (reportsPerMember * 10) +
            (Math.min(averageSessionTime, 30) / 30 * 20) +
            (memberRetentionRate * 0.3) +
            (Math.max(0, 50 - creditEfficiency) * 0.5)
          )

          // 성장률 계산
          const memberGrowth = oldMembers.docs.length > 0 
            ? ((members.docs.length - oldMembers.docs.length) / oldMembers.docs.length) * 100 
            : 0

          const reportGrowth = oldReports.docs.length > 0 
            ? ((reports.docs.length - oldReports.docs.length) / oldReports.docs.length) * 100 
            : 0

          const sessionGrowth = oldSessions.docs.length > 0 
            ? ((sessions.docs.length - oldSessions.docs.length) / oldSessions.docs.length) * 100 
            : 0

          performanceData.push({
            organizationId,
            organizationName: orgData.name || '알 수 없음',
            score,
            metrics: {
              reportsPerMember,
              averageSessionTime,
              memberRetentionRate,
              creditEfficiency
            },
            monthlyGrowth: {
              members: memberGrowth,
              reports: reportGrowth,
              sessions: sessionGrowth
            }
          })
        }

        // 상위 성과자 정렬
        const topPerformers = performanceData
          .sort((a, b) => b.score - a.score)
          .slice(0, 10)

        // 업계 벤치마크 계산
        const industryBenchmarks = {
          avgReportsPerMember: performanceData.reduce((sum, org) => sum + org.metrics.reportsPerMember, 0) / performanceData.length,
          avgSessionTime: performanceData.reduce((sum, org) => sum + org.metrics.averageSessionTime, 0) / performanceData.length,
          avgMemberRetentionRate: performanceData.reduce((sum, org) => sum + org.metrics.memberRetentionRate, 0) / performanceData.length,
          avgCreditEfficiency: performanceData.reduce((sum, org) => sum + org.metrics.creditEfficiency, 0) / performanceData.length
        }

        // 성장 트렌드 정렬
        const growthTrends = performanceData
          .sort((a, b) => {
            const aGrowth = a.monthlyGrowth.members + a.monthlyGrowth.reports + a.monthlyGrowth.sessions
            const bGrowth = b.monthlyGrowth.members + b.monthlyGrowth.reports + b.monthlyGrowth.sessions
            return bGrowth - aGrowth
          })
          .slice(0, 15)

        return {
          topPerformers,
          industryBenchmarks,
          growthTrends
        }

      } catch (error) {
        this.log('error', '기업 비교 분석 조회 실패', {
          error: error instanceof Error ? error.message : String(error)
        })
        throw error
      }
    })
  }
}

const systemAdminService = new SystemAdminService()
export default systemAdminService 