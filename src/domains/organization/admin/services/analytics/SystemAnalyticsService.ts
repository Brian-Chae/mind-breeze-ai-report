/**
 * 시스템 분석 서비스
 * 
 * 시스템 전체 통계, 사용량 분석, 성능 메트릭 등을 담당합니다.
 */

import { BaseAdminService } from '../core/BaseAdminService'
import { Permission } from '../../core/types/AdminTypes'
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp,
  limit as firestoreLimit,
  DocumentData
} from 'firebase/firestore'
import { db } from '@core/services/firebase'

// Firestore 문서 타입 정의
interface FirestoreOrganization {
  id: string
  creditBalance?: number
  [key: string]: any
}

interface FirestoreMember {
  id: string
  lastActivity?: Timestamp
  [key: string]: any
}

interface FirestoreMeasurementUser {
  id: string
  createdAt?: Timestamp
  organizationId?: string
  organizationName?: string
  name?: string
  [key: string]: any
}

interface FirestoreAIReport {
  id: string
  createdAt?: Timestamp
  reportType?: string
  processingTime?: number
  engineId?: string
  organizationId?: string
  organizationName?: string
  [key: string]: any
}

interface FirestoreMeasurementSession {
  id: string
  createdAt?: Timestamp
  userId?: string
  [key: string]: any
}

interface FirestoreCreditTransaction {
  id: string
  type?: 'use' | 'purchase'
  amount?: number
  createdAt?: Timestamp
  organizationId: string
  organizationName?: string
  metadata?: {
    paymentMethod?: string
    [key: string]: any
  }
  [key: string]: any
}

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

export interface UsageAnalytics {
  period: 'today' | 'week' | 'month' | 'year'
  measurements: {
    total: number
    averagePerDay: number
    growthRate: number
    peakDay: { date: Date; count: number }
  }
  reports: {
    total: number
    averagePerDay: number
    byType: Record<string, number>
    averageProcessingTime: number
  }
  users: {
    newUsers: number
    activeUsers: number
    retentionRate: number
    averageSessionsPerUser: number
  }
  credits: {
    totalUsed: number
    averagePerReport: number
    byOrganization: Array<{
      organizationId: string
      organizationName: string
      used: number
      percentage: number
    }>
  }
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

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'error'
  services: {
    database: { status: 'up' | 'down'; latency: number }
    auth: { status: 'up' | 'down'; latency: number }
    storage: { status: 'up' | 'down'; usage: number }
    ai: { status: 'up' | 'down'; quota: number }
  }
  performance: {
    avgResponseTime: number
    errorRate: number
    throughput: number
  }
  alerts: Array<{
    type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    message: string
    timestamp: Date
  }>
}

export interface PerformanceMetrics {
  responseTime: {
    p50: number
    p90: number
    p95: number
    p99: number
  }
  throughput: {
    requestsPerMinute: number
    dataProcessedPerMinute: number // MB
  }
  errorRate: {
    rate: number
    topErrors: Array<{
      message: string
      count: number
      percentage: number
    }>
  }
  resourceUsage: {
    cpu: number
    memory: number
    storage: number
    bandwidth: number
  }
}

export class SystemAnalyticsService extends BaseAdminService {
  protected getServiceName(): string {
    return 'SystemAnalyticsService'
  }
  
  /**
   * 시스템 전체 통계 조회
   */
  async getSystemStats(): Promise<SystemStats> {
    await this.requirePermission(Permission.VIEW_ANALYTICS)
    
    try {
      
      // 병렬로 모든 통계 수집
      const [
        organizations,
        allMembers,
        measurementUsers,
        reports,
        sessions,
        credits
      ] = await Promise.all([
        this.getAllOrganizations(),
        this.getAllMembers(),
        this.getAllMeasurementUsers(),
        this.getAllAIReports(),
        this.getAllMeasurementSessions(),
        this.getAllCreditTransactions()
      ])
      
      // 활성 사용자 계산 (최근 7일 내 활동)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const activeUsers = allMembers.filter(member => {
        const lastActivity = this.convertTimestamp(member.lastActivity)
        return lastActivity && lastActivity > sevenDaysAgo
      }).length
      
      // 오늘 통계
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const todayCredits = credits.filter(credit => {
        const createdAt = this.convertTimestamp(credit.createdAt)
        return createdAt && createdAt >= today && credit.type === 'use'
      })
      
      const todayMeasurements = sessions.filter(session => {
        const createdAt = this.convertTimestamp(session.createdAt)
        return createdAt && createdAt >= today
      }).length
      
      // 이번 주 통계
      const weekStart = new Date(today)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      
      const thisWeekMeasurements = sessions.filter(session => {
        const createdAt = this.convertTimestamp(session.createdAt)
        return createdAt && createdAt >= weekStart
      }).length
      
      // 이번 달 통계
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      
      const thisMonthMeasurements = sessions.filter(session => {
        const createdAt = this.convertTimestamp(session.createdAt)
        return createdAt && createdAt >= monthStart
      }).length
      
      const monthlyCredits = credits.filter(credit => {
        const createdAt = this.convertTimestamp(credit.createdAt)
        return createdAt && createdAt >= monthStart && credit.type === 'use'
      })
      
      // 저번 달 대비 성장률
      const lastMonthStart = new Date(monthStart)
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 1)
      const lastMonthEnd = new Date(monthStart)
      lastMonthEnd.setDate(lastMonthEnd.getDate() - 1)
      
      const lastMonthMeasurements = sessions.filter(session => {
        const createdAt = this.convertTimestamp(session.createdAt)
        return createdAt && createdAt >= lastMonthStart && createdAt <= lastMonthEnd
      }).length
      
      const monthlyGrowth = lastMonthMeasurements > 0
        ? ((thisMonthMeasurements - lastMonthMeasurements) / lastMonthMeasurements) * 100
        : 0
      
      // 평균 계산
      const averageReportsPerMeasurement = sessions.length > 0
        ? reports.length / sessions.length
        : 0
      
      // 총 크레딧 사용량
      const totalCreditsUsed = credits
        .filter(c => c.type === 'use')
        .reduce((sum, c) => sum + Math.abs(c.amount || 0), 0)
      
      const todayCreditsUsed = todayCredits
        .reduce((sum, c) => sum + Math.abs(c.amount || 0), 0)
      
      const monthlyCreditsUsed = monthlyCredits
        .reduce((sum, c) => sum + Math.abs(c.amount || 0), 0)
      
      // 스토리지 사용량 (예시)
      const totalStorageUsed = sessions.length * 0.001 // 각 세션당 1MB 가정
      
      // 평균 세션 시간 (예시)
      const averageSessionDuration = 5 // 5분 가정
      
      // 시스템 상태
      const systemHealth = await this.checkSystemHealth()
      
      const stats: SystemStats = {
        totalOrganizations: organizations.length,
        totalUsers: allMembers.length + measurementUsers.length,
        activeUsers,
        totalReports: reports.length,
        systemHealth: systemHealth.status,
        uptime: this.calculateUptime(),
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
      
        metadata: { stats }
      
      return stats
      
    } catch (error) {
      throw error
    }
  }
  
  /**
   * 사용량 분석
   */
  async getUsageAnalytics(period: UsageAnalytics['period']): Promise<UsageAnalytics> {
    await this.requirePermission(Permission.VIEW_ANALYTICS)
    
    try {
      const { start, end } = this.getDateRange(period)
      
      // 기간별 데이터 조회
      const [
        measurementSessions,
        aiReports,
        measurementUsers,
        creditTransactions
      ] = await Promise.all([
        this.getMeasurementSessionsInRange(start, end),
        this.getAIReportsInRange(start, end),
        this.getMeasurementUsersInRange(start, end),
        this.getCreditTransactionsInRange(start, end)
      ])
      
      // 일수 계산
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      
      // 측정 분석
      const measurementsByDay = new Map<string, number>()
      let peakDay = { date: new Date(), count: 0 }
      
      measurementSessions.forEach(session => {
        const date = this.convertTimestamp(session.createdAt)
        if (date) {
          const dateKey = date.toISOString().split('T')[0]
          const count = (measurementsByDay.get(dateKey) || 0) + 1
          measurementsByDay.set(dateKey, count)
          
          if (count > peakDay.count) {
            peakDay = { date, count }
          }
        }
      })
      
      // 리포트 분석
      const reportsByType = aiReports.reduce((acc, report) => {
        const type = report.reportType || 'unknown'
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      const totalProcessingTime = aiReports.reduce((sum, report) => 
        sum + (report.processingTime || 0), 0
      )
      
      // 사용자 분석
      const uniqueActiveUsers = new Set<string>()
      measurementSessions.forEach(session => {
        if (session.userId) uniqueActiveUsers.add(session.userId)
      })
      
      // 이전 기간 데이터 (성장률 계산용)
      const prevStart = new Date(start)
      prevStart.setTime(prevStart.getTime() - (end.getTime() - start.getTime()))
      const prevMeasurements = await this.getMeasurementSessionsInRange(prevStart, start)
      
      const growthRate = prevMeasurements.length > 0
        ? ((measurementSessions.length - prevMeasurements.length) / prevMeasurements.length) * 100
        : 0
      
      // 크레딧 분석
      const creditsByOrg = new Map<string, { name: string; used: number }>()
      let totalCreditsUsed = 0
      
      creditTransactions
        .filter(tx => tx.type === 'use')
        .forEach(tx => {
          const amount = Math.abs(tx.amount || 0)
          totalCreditsUsed += amount
          
          const existing = creditsByOrg.get(tx.organizationId) || { 
            name: tx.organizationName || 'Unknown',
            used: 0 
          }
          existing.used += amount
          creditsByOrg.set(tx.organizationId, existing)
        })
      
      const creditsByOrgArray = Array.from(creditsByOrg.entries())
        .map(([id, data]) => ({
          organizationId: id,
          organizationName: data.name,
          used: data.used,
          percentage: totalCreditsUsed > 0 ? (data.used / totalCreditsUsed) * 100 : 0
        }))
        .sort((a, b) => b.used - a.used)
        .slice(0, 10) // Top 10
      
      return {
        period,
        measurements: {
          total: measurementSessions.length,
          averagePerDay: measurementSessions.length / days,
          growthRate,
          peakDay
        },
        reports: {
          total: aiReports.length,
          averagePerDay: aiReports.length / days,
          byType: reportsByType,
          averageProcessingTime: aiReports.length > 0 
            ? totalProcessingTime / aiReports.length 
            : 0
        },
        users: {
          newUsers: measurementUsers.length,
          activeUsers: uniqueActiveUsers.size,
          retentionRate: 0, // TODO: 실제 리텐션 계산
          averageSessionsPerUser: uniqueActiveUsers.size > 0
            ? measurementSessions.length / uniqueActiveUsers.size
            : 0
        },
        credits: {
          totalUsed: totalCreditsUsed,
          averagePerReport: aiReports.length > 0
            ? totalCreditsUsed / aiReports.length
            : 0,
          byOrganization: creditsByOrgArray
        }
      }
      
    } catch (error) {
      throw error
    }
  }
  
  /**
   * 최근 시스템 활동 조회
   */
  async getRecentSystemActivities(limit: number = 50): Promise<SystemActivity[]> {
    await this.requirePermission(Permission.VIEW_ANALYTICS)
    
    try {
      // 다양한 소스에서 활동 수집
      const activities: SystemActivity[] = []
      
      // 최근 사용자 등록
      const recentUsers = await this.getRecentMeasurementUsers(10)
      recentUsers.forEach(user => {
        activities.push({
          id: `user_${user.id}`,
          organizationId: user.organizationId || '',
          organizationName: user.organizationName || 'Personal',
          type: 'user_registered',
          description: `새 사용자 등록: ${user.name}`,
          timestamp: this.convertTimestamp(user.createdAt) || new Date(),
          severity: 'success'
        })
      })
      
      // 최근 리포트 생성
      const recentReports = await this.getRecentAIReports(20)
      recentReports.forEach(report => {
        activities.push({
          id: `report_${report.id}`,
          organizationId: report.organizationId || '',
          organizationName: report.organizationName || 'Personal',
          type: 'report_generated',
          description: `AI 리포트 생성 (${report.engineId})`,
          timestamp: this.convertTimestamp(report.createdAt) || new Date(),
          severity: 'info',
          metadata: {
            reportType: report.reportType,
            processingTime: report.processingTime
          }
        })
      })
      
      // 최근 크레딧 구매
      const recentCredits = await this.getRecentCreditTransactions(10)
      recentCredits
        .filter(tx => tx.type === 'purchase')
        .forEach(tx => {
          activities.push({
            id: `credit_${tx.id}`,
            organizationId: tx.organizationId,
            organizationName: tx.organizationName || 'Unknown',
            type: 'credit_purchased',
            description: `크레딧 구매: ${tx.amount}개`,
            timestamp: this.convertTimestamp(tx.createdAt) || new Date(),
            severity: 'success',
            metadata: {
              amount: tx.amount,
              method: tx.metadata?.paymentMethod
            }
          })
        })
      
      // 활동 정렬 및 제한
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      
      return activities.slice(0, limit)
      
    } catch (error) {
      return []
    }
  }
  
  /**
   * 시스템 상태 확인
   */
  async getSystemHealth(): Promise<SystemHealth> {
    await this.requirePermission(Permission.SYSTEM_ADMIN)
    
    try {
      const [services, performance, alerts] = await Promise.all([
        this.checkSystemServices(),
        this.getSystemPerformance(),
        this.getActiveAlerts()
      ])
      
      // 전체 상태 결정
      let status: SystemHealth['status'] = 'healthy'
      
      if (alerts.some(a => a.severity === 'critical')) {
        status = 'error'
      } else if (alerts.some(a => a.severity === 'high') || 
                 performance.errorRate > 5 ||
                 Object.values(services).some(s => s.status === 'down')) {
        status = 'warning'
      }
      
      return {
        status,
        services,
        performance,
        alerts
      }
      
    } catch (error) {
      throw error
    }
  }
  
  /**
   * 성능 메트릭 조회
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    await this.requirePermission(Permission.VIEW_ANALYTICS)
    
    try {
      // 최근 1시간 데이터 기준
      const oneHourAgo = new Date()
      oneHourAgo.setHours(oneHourAgo.getHours() - 1)
      
      // 응답 시간 (예시 데이터)
      const responseTime = {
        p50: 120,  // ms
        p90: 250,
        p95: 400,
        p99: 1000
      }
      
      // 처리량
      const sessions = await this.getMeasurementSessionsInRange(oneHourAgo, new Date())
      const reports = await this.getAIReportsInRange(oneHourAgo, new Date())
      
      const throughput = {
        requestsPerMinute: (sessions.length + reports.length) / 60,
        dataProcessedPerMinute: sessions.length * 0.5 // MB 추정
      }
      
      // 에러율 (예시)
      const errorRate = {
        rate: 0.5, // %
        topErrors: [
          { message: 'Network timeout', count: 5, percentage: 40 },
          { message: 'Invalid input', count: 3, percentage: 24 },
          { message: 'Database connection error', count: 2, percentage: 16 }
        ]
      }
      
      // 리소스 사용량 (예시)
      const resourceUsage = {
        cpu: 45,      // %
        memory: 62,   // %
        storage: 30,  // %
        bandwidth: 15 // %
      }
      
      return {
        responseTime,
        throughput,
        errorRate,
        resourceUsage
      }
      
    } catch (error) {
      throw error
    }
  }
  
  // Private 헬퍼 메서드들
  
  private async getAllOrganizations(): Promise<FirestoreOrganization[]> {
    const snapshot = await getDocs(collection(db, 'organizations'))
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() as DocumentData
    }) as FirestoreOrganization)
  }
  
  private async getAllMembers(): Promise<FirestoreMember[]> {
    const snapshot = await getDocs(collection(db, 'organization_members'))
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() as DocumentData
    }) as FirestoreMember)
  }
  
  private async getAllMeasurementUsers(): Promise<FirestoreMeasurementUser[]> {
    const snapshot = await getDocs(collection(db, 'measurement_users'))
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() as DocumentData
    }) as FirestoreMeasurementUser)
  }
  
  private async getAllAIReports(): Promise<FirestoreAIReport[]> {
    const snapshot = await getDocs(collection(db, 'ai_analysis_results'))
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() as DocumentData
    }) as FirestoreAIReport)
  }
  
  private async getAllMeasurementSessions(): Promise<FirestoreMeasurementSession[]> {
    const snapshot = await getDocs(collection(db, 'measurement_sessions'))
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() as DocumentData
    }) as FirestoreMeasurementSession)
  }
  
  private async getAllCreditTransactions(): Promise<FirestoreCreditTransaction[]> {
    const snapshot = await getDocs(collection(db, 'credit_transactions'))
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() as DocumentData
    }) as FirestoreCreditTransaction)
  }
  
  private async getRecentMeasurementUsers(limit: number): Promise<FirestoreMeasurementUser[]> {
    const q = query(
      collection(db, 'measurement_users'),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() as DocumentData
    }) as FirestoreMeasurementUser)
  }
  
  private async getRecentAIReports(limit: number): Promise<FirestoreAIReport[]> {
    const q = query(
      collection(db, 'ai_analysis_results'),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() as DocumentData
    }) as FirestoreAIReport)
  }
  
  private async getRecentCreditTransactions(limit: number): Promise<FirestoreCreditTransaction[]> {
    const q = query(
      collection(db, 'credit_transactions'),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() as DocumentData
    }) as FirestoreCreditTransaction)
  }
  
  private async getMeasurementSessionsInRange(start: Date, end: Date): Promise<FirestoreMeasurementSession[]> {
    const q = query(
      collection(db, 'measurement_sessions'),
      where('createdAt', '>=', Timestamp.fromDate(start)),
      where('createdAt', '<=', Timestamp.fromDate(end))
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() as DocumentData
    }) as FirestoreMeasurementSession)
  }
  
  private async getAIReportsInRange(start: Date, end: Date): Promise<FirestoreAIReport[]> {
    const q = query(
      collection(db, 'ai_analysis_results'),
      where('createdAt', '>=', Timestamp.fromDate(start)),
      where('createdAt', '<=', Timestamp.fromDate(end))
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() as DocumentData
    }) as FirestoreAIReport)
  }
  
  private async getMeasurementUsersInRange(start: Date, end: Date): Promise<FirestoreMeasurementUser[]> {
    const q = query(
      collection(db, 'measurement_users'),
      where('createdAt', '>=', Timestamp.fromDate(start)),
      where('createdAt', '<=', Timestamp.fromDate(end))
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() as DocumentData
    }) as FirestoreMeasurementUser)
  }
  
  private async getCreditTransactionsInRange(start: Date, end: Date): Promise<FirestoreCreditTransaction[]> {
    const q = query(
      collection(db, 'credit_transactions'),
      where('createdAt', '>=', Timestamp.fromDate(start)),
      where('createdAt', '<=', Timestamp.fromDate(end))
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() as DocumentData
    }) as FirestoreCreditTransaction)
  }
  
  private async checkSystemHealth() {
    // 예시 구현
    return {
      status: 'healthy' as const
    }
  }
  
  private async checkSystemServices(): Promise<SystemHealth['services']> {
    // 예시 구현
    return {
      database: { status: 'up' as const, latency: 25 },
      auth: { status: 'up' as const, latency: 15 },
      storage: { status: 'up' as const, usage: 30 },
      ai: { status: 'up' as const, quota: 85 }
    }
  }
  
  private async getSystemPerformance(): Promise<SystemHealth['performance']> {
    // 예시 구현
    return {
      avgResponseTime: 150,
      errorRate: 0.5,
      throughput: 1000
    }
  }
  
  private async getActiveAlerts(): Promise<SystemHealth['alerts']> {
    // 예시 구현
    const alerts = []
    
    // 크레딧 부족 경고
    const lowCreditOrgs = await this.checkLowCreditOrganizations()
    if (lowCreditOrgs.length > 0) {
      alerts.push({
        type: 'credit_warning',
        severity: 'medium' as const,
        message: `${lowCreditOrgs.length}개 조직이 크레딧 부족 상태입니다`,
        timestamp: new Date()
      })
    }
    
    return alerts
  }
  
  private async checkLowCreditOrganizations() {
    const orgs = await this.getAllOrganizations()
    return orgs.filter(org => (org.creditBalance || 0) < 10)
  }
  
  private calculateUptime(): string {
    // 예시: 시스템 시작 시간을 가정
    const startTime = new Date('2024-01-01')
    const now = new Date()
    const diff = now.getTime() - startTime.getTime()
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    return `${days}일 ${hours}시간`
  }
}