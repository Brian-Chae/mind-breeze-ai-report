import { BaseService } from '@core/services/BaseService'
import { db, auth } from '@core/services/firebase'
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
  DocumentData,
  addDoc,
  updateDoc,
  writeBatch,
  runTransaction,
  serverTimestamp,
  increment
} from 'firebase/firestore'
import { createUserWithEmailAndPassword, updateProfile, deleteUser } from 'firebase/auth'
import enterpriseAuthService from './EnterpriseAuthService'
import { OrganizationInfo, OrganizationService } from './CompanyService'
import { OrganizationMember } from '../types/member'
import { MeasurementUser } from '@domains/individual/services/MeasurementUserManagementService'
import { OrganizationSize } from '../types/organization'
import { 
  DeviceSale, 
  ServiceRequest,
  SalesStatistics,
  SalesListItem,
  CreateSaleRequest,
  CreateServiceRequestData,
  CompleteServiceRequestData,
  SalesSearchFilters,
  SalesPaginationOptions,
  calculateWarrantyRemainingDays,
  getWarrantyStatus
} from '../types/sales'
import { 
  DeviceSaleDocument,
  ServiceRequestDocument,
  transformSaleToDocument,
  transformServiceRequestToDocument,
  FIRESTORE_COLLECTIONS,
  getCollectionPath
} from '../types/sales-firestore'

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

        return stats
      } catch (error) {
        console.error('Failed to get system stats:', error)
        throw error
      }
    })
  }

  /**
   * 기업 개요 목록 조회
   */
  async getEnterpriseOverviewList(): Promise<EnterpriseOverview[]> {
    return this.measureAndLog('getEnterpriseOverviewList', async () => {
      this.validateSystemAdminAccess()

      try {
        const enterpriseOverviews: EnterpriseOverview[] = []
        const organizations = await getDocs(collection(db, 'organizations'))

        for (const orgDoc of organizations.docs) {
          const orgData = orgDoc.data()
          const organizationId = orgDoc.id

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
        console.error('Failed to get enterprise overview:', error)
        throw error
      }
    })
  }

  /**
   * 디바이스 사용 목록 조회
   */
  async getDeviceUsageList(): Promise<any[]> {
    return this.measureAndLog('getDeviceUsageList', async () => {
      this.validateSystemAdminAccess()

      try {
        const deviceUsageList: any[] = []
        
        // 디바이스 인벤토리에서 조회
        const inventorySnapshot = await getDocs(collection(db, 'deviceInventory'))
        
        for (const deviceDoc of inventorySnapshot.docs) {
          const device = deviceDoc.data()
          const deviceId = deviceDoc.id

          // 조직명 조회
          let organizationName = '미할당'
          if (device.organizationId) {
            try {
              const orgDoc = await getDoc(doc(db, 'organizations', device.organizationId))
              if (orgDoc.exists()) {
                const orgData = orgDoc.data()
                organizationName = orgData.name || orgData.organizationName || '알 수 없음'
              }
            } catch (error) {
              console.error('Failed to get organization name:', error)
              organizationName = '조회 실패'
            }
          }

          // 측정 세션 수 조회
          let totalMeasurements = 0
          try {
            const sessionsQuery = query(
              collection(db, 'measurementSessions'),
              where('deviceId', '==', deviceId)
            )
            const sessionsSnapshot = await getDocs(sessionsQuery)
            totalMeasurements = sessionsSnapshot.size
          } catch (error) {
            console.error('Failed to get device measurements:', error)
          }

          // 마지막 사용일 계산
          let lastUsedDate = new Date(0)
          if (device.assignedAt) {
            lastUsedDate = device.assignedAt.toDate?.() || new Date(device.assignedAt)
          } else if (device.updatedAt) {
            lastUsedDate = device.updatedAt.toDate?.() || new Date(device.updatedAt)
          } else if (device.registrationDate) {
            lastUsedDate = device.registrationDate.toDate?.() || new Date(device.registrationDate)
          }

          // 사용 방식 결정 (인벤토리는 모두 구매로 가정)
          const usageType: 'purchase' | 'rental' = 'purchase'
          const rentalPeriod = undefined

          // 상태 결정
          let status: 'active' | 'inactive' | 'maintenance' = 'inactive'
          if (device.status === 'IN_USE' || device.status === 'ASSIGNED') {
            status = 'active'
          } else if (device.status === 'MAINTENANCE') {
            status = 'maintenance'
          }

          deviceUsageList.push({
            deviceId,
            deviceName: deviceId, // 시리얼 넘버가 ID
            deviceType: device.deviceType || 'LINK_BAND_2.0',
            organizationName,
            usageType,
            rentalPeriod,
            totalMeasurements,
            lastUsedDate,
            status
          })
        }

        // 최근 사용일 기준으로 정렬
        deviceUsageList.sort((a, b) => b.lastUsedDate.getTime() - a.lastUsedDate.getTime())
        
        return deviceUsageList
      } catch (error) {
        console.error('Failed to get device usage list:', error)
        throw error
      }
    })
  }

  /**
   * 예정된 반납 목록 조회
   */
  async getScheduledReturns(): Promise<any[]> {
    return this.measureAndLog('getScheduledReturns', async () => {
      this.validateSystemAdminAccess()

      try {
        const scheduledReturns: any[] = []
        const now = new Date()
        
        // 렌탈 정보에서 조회
        const rentalsSnapshot = await getDocs(collection(db, 'deviceRentals'))
        
        rentalsSnapshot.forEach((doc) => {
          const rental = doc.data()
          
          // 활성 렌탈만 처리
          const activeStatuses = ['ACTIVE', 'SCHEDULED_RETURN', 'OVERDUE']
          if (!activeStatuses.includes(rental.status)) {
            return
          }
          
          if (rental.returnScheduledDate) {
            const scheduledDate = rental.returnScheduledDate.toDate()
            const diffTime = scheduledDate.getTime() - now.getTime()
            const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            
            const returnItem = {
              id: rental.deviceId || doc.id,
              deviceId: rental.deviceId,
              organization: rental.organizationName || '알 수 없음',
              contact: rental.contactName || '담당자 미정',
              contactPhone: rental.contactPhone,
              contactEmail: rental.contactEmail,
              scheduledDate,
              daysUntil,
              isOverdue: daysUntil < 0
            }
            
            scheduledReturns.push(returnItem)
          }
        })
        
        // 예정일 기준으로 정렬 (가까운 순)
        scheduledReturns.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())
        
        return scheduledReturns
      } catch (error) {
        console.error('Failed to get scheduled returns:', error)
        throw error
      }
    })
  }

  /**
   * 모든 조직 조회
   */
  private async getAllOrganizations(): Promise<any[]> {
    try {
      const snapshot = await getDocs(collection(db, 'organizations'))
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Failed to get organizations:', error)
      return []
    }
  }

  /**
   * 모든 멤버 조회
   */
  private async getAllMembers(): Promise<any[]> {
    try {
      const snapshot = await getDocs(collection(db, 'organizationMembers'))
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Failed to get members:', error)
      return []
    }
  }

  /**
   * 모든 측정 사용자 조회
   */
  private async getAllMeasurementUsers(): Promise<any[]> {
    try {
      const snapshot = await getDocs(collection(db, 'measurementUsers'))
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Failed to get measurement users:', error)
      return []
    }
  }

  /**
   * 모든 AI 리포트 조회
   */
  private async getAllAIReports(): Promise<any[]> {
    try {
      const snapshot = await getDocs(collection(db, 'aiReports'))
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Failed to get AI reports:', error)
      return []
    }
  }

  /**
   * 모든 측정 세션 조회
   */
  private async getAllMeasurementSessions(): Promise<any[]> {
    try {
      const snapshot = await getDocs(collection(db, 'measurementSessions'))
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Failed to get measurement sessions:', error)
      return []
    }
  }

  /**
   * 모든 크레딧 거래 조회
   */
  private async getAllCreditTransactions(): Promise<any[]> {
    try {
      const snapshot = await getDocs(collection(db, 'creditTransactions'))
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Failed to get credit transactions:', error)
      return []
    }
  }

  /**
   * 오류율 계산
   */
  private calculateErrorRate(sessions: any[]): number {
    if (sessions.length === 0) return 0
    const errorSessions = sessions.filter(s => s.status === 'failed' || s.status === 'error')
    return errorSessions.length / sessions.length
  }

  /**
   * 플랜 결정
   */
  private determinePlan(creditBalance: number, creditsUsedThisMonth: number): string {
    if (creditsUsedThisMonth > 1000) return 'enterprise'
    if (creditsUsedThisMonth > 500) return 'premium'
    if (creditsUsedThisMonth > 100) return 'basic'
    return 'trial'
  }

  /**
   * 건강도 점수 계산
   */
  private calculateHealthScore(memberCount: number, reportCount: number, activeMembers: number): number {
    if (memberCount === 0) return 0
    const activityRate = activeMembers / memberCount
    const usageRate = memberCount > 0 ? Math.min(reportCount / memberCount / 10, 1) : 0
    return Math.round((activityRate * 0.6 + usageRate * 0.4) * 100)
  }

  /**
   * 위험도 계산
   */
  private calculateRiskLevel(activeMembers: number, totalMembers: number, creditBalance: number): 'low' | 'medium' | 'high' {
    const activityRate = totalMembers > 0 ? activeMembers / totalMembers : 0
    if (activityRate < 0.2 || creditBalance < 10) return 'high'
    if (activityRate < 0.5 || creditBalance < 50) return 'medium'
    return 'low'
  }

  /**
   * 이탈 위험 계산
   */
  private calculateChurnRisk(activeMembers: number, totalMembers: number, lastActivityTime: number): number {
    const activityRate = totalMembers > 0 ? activeMembers / totalMembers : 0
    const daysSinceLastActivity = (Date.now() - lastActivityTime) / (1000 * 60 * 60 * 24)
    
    let risk = 0
    if (activityRate < 0.2) risk += 40
    if (daysSinceLastActivity > 30) risk += 30
    if (daysSinceLastActivity > 7) risk += 20
    
    return Math.min(risk, 100)
  }

  /**
   * 최근 조직 활동 조회
   */
  private async getRecentOrganizationActivity(organizationId: string): Promise<any[]> {
    try {
      // 실제 구현에서는 활동 로그를 조회해야 함
      return []
    } catch (error) {
      console.error('Failed to get recent organization activity:', error)
      return []
    }
  }
}