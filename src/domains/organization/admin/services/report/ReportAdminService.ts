/**
 * 리포트 관리 서비스
 * 
 * AI 리포트 관리, 통계, 검색, 삭제 등을 담당합니다.
 */

import { BaseAdminService } from '../core/BaseAdminService'
import { Permission } from '../../core/types/AdminTypes'
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  updateDoc,
  Timestamp,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore'
import { db } from '@core/services/firebase'

export interface AIReportSummary {
  id: string
  userId: string
  userName: string
  organizationId?: string
  organizationName?: string
  reportType: string
  engineId: string
  createdAt: Date
  processingTime: number
  creditUsed: number
  status: 'completed' | 'failed' | 'pending'
  errorMessage?: string
}

export interface ReportStatistics {
  totalReports: number
  reportsByType: Record<string, number>
  reportsByEngine: Record<string, number>
  averageProcessingTime: number
  totalCreditsUsed: number
  successRate: number
  errorRate: number
  topErrors: Array<{
    message: string
    count: number
    percentage: number
  }>
}

export interface ReportSearchFilters {
  organizationId?: string
  userId?: string
  reportType?: string
  engineId?: string
  status?: 'completed' | 'failed' | 'pending'
  startDate?: Date
  endDate?: Date
  searchTerm?: string
}

export interface BulkReportAction {
  reportIds: string[]
  action: 'delete' | 'export' | 'archive'
  reason?: string
}

export class ReportAdminService extends BaseAdminService {
  protected getServiceName(): string {
    return 'ReportAdminService'
  }
  
  /**
   * 리포트 검색 및 조회
   */
  async searchReports(
    filters?: ReportSearchFilters,
    pagination?: {
      page: number
      pageSize: number
    }
  ): Promise<{
    reports: AIReportSummary[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }> {
    await this.requirePermission(Permission.READ_REPORTS)
    
    try {
        metadata: { filters, pagination }
      
      let reportQuery = query(collection(db, 'ai_analysis_results'))
      
      // 필터 적용
      if (filters?.organizationId) {
        reportQuery = query(reportQuery, 
          where('organizationId', '==', filters.organizationId)
        )
      }
      
      if (filters?.userId) {
        reportQuery = query(reportQuery, 
          where('userId', '==', filters.userId)
        )
      }
      
      if (filters?.reportType) {
        reportQuery = query(reportQuery, 
          where('reportType', '==', filters.reportType)
        )
      }
      
      if (filters?.engineId) {
        reportQuery = query(reportQuery, 
          where('engineId', '==', filters.engineId)
        )
      }
      
      if (filters?.status) {
        reportQuery = query(reportQuery, 
          where('status', '==', filters.status)
        )
      }
      
      if (filters?.startDate) {
        reportQuery = query(reportQuery,
          where('createdAt', '>=', Timestamp.fromDate(filters.startDate))
        )
      }
      
      if (filters?.endDate) {
        reportQuery = query(reportQuery,
          where('createdAt', '<=', Timestamp.fromDate(filters.endDate))
        )
      }
      
      reportQuery = query(reportQuery, orderBy('createdAt', 'desc'))
      
      const page = pagination?.page || 1
      const pageSize = pagination?.pageSize || 50
      
      const result = await this.paginateQuery<AIReportSummary>(
        reportQuery,
        page,
        pageSize,
        (doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: this.convertTimestamp(doc.data().createdAt),
          processingTime: doc.data().processingTime || 0,
          creditUsed: doc.data().creditUsed || 0
        } as AIReportSummary)
      )
      
      // 검색어 필터 (메모리에서)
      if (filters?.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase()
        result.data = result.data.filter(report => 
          report.userName?.toLowerCase().includes(searchTerm) ||
          report.organizationName?.toLowerCase().includes(searchTerm) ||
          report.reportType?.toLowerCase().includes(searchTerm)
        )
      }
      
        metadata: { count: result.data.length, total: result.total }
      
      return result
      
    } catch (error) {
      throw error
    }
  }
  
  /**
   * 리포트 상세 조회
   */
  async getReportDetails(reportId: string): Promise<{
    report: any
    session?: any
    user?: any
    organization?: any
  }> {
    await this.requirePermission(Permission.READ_REPORTS)
    
    try {
      // 리포트 조회
      const reportDoc = await getDoc(doc(db, 'ai_analysis_results', reportId))
      if (!reportDoc.exists()) {
        throw new Error('리포트를 찾을 수 없습니다')
      }
      
      const reportData = {
        id: reportDoc.id,
        ...reportDoc.data(),
        createdAt: this.convertTimestamp(reportDoc.data().createdAt)
      }
      
      // 관련 데이터 조회
      const [session, user, organization] = await Promise.all([
        reportData.sessionId ? this.getSession(reportData.sessionId) : null,
        reportData.userId ? this.getUser(reportData.userId) : null,
        reportData.organizationId ? this.getOrganization(reportData.organizationId) : null
      ])
      
      await this.createAuditLog('view_report', 'report', 'success', {
        reportId
      })
      
      return {
        report: reportData,
        session,
        user,
        organization
      }
      
    } catch (error) {
        metadata: { reportId }
      
      await this.createAuditLog('view_report', 'report', 'failure', {
        reportId,
        error: (error as Error).message
      })
      
      throw error
    }
  }
  
  /**
   * 리포트 통계 조회
   */
  async getReportStatistics(
    period: 'today' | 'week' | 'month' | 'year' = 'month'
  ): Promise<ReportStatistics> {
    await this.requirePermission(Permission.VIEW_ANALYTICS)
    
    try {
      const { start, end } = this.getDateRange(period)
      
      const reportsQuery = query(
        collection(db, 'ai_analysis_results'),
        where('createdAt', '>=', Timestamp.fromDate(start)),
        where('createdAt', '<=', Timestamp.fromDate(end))
      )
      
      const snapshot = await getDocs(reportsQuery)
      const reports = snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: this.convertTimestamp(doc.data().createdAt)
      }))
      
      // 통계 계산
      const reportsByType: Record<string, number> = {}
      const reportsByEngine: Record<string, number> = {}
      const errorMessages: Record<string, number> = {}
      let totalProcessingTime = 0
      let totalCreditsUsed = 0
      let successCount = 0
      let failCount = 0
      
      reports.forEach(report => {
        // 타입별 집계
        const type = report.reportType || 'unknown'
        reportsByType[type] = (reportsByType[type] || 0) + 1
        
        // 엔진별 집계
        const engine = report.engineId || 'unknown'
        reportsByEngine[engine] = (reportsByEngine[engine] || 0) + 1
        
        // 처리 시간 합계
        totalProcessingTime += report.processingTime || 0
        
        // 크레딧 사용량 합계
        totalCreditsUsed += report.creditUsed || 0
        
        // 성공/실패 카운트
        if (report.status === 'completed') {
          successCount++
        } else if (report.status === 'failed') {
          failCount++
          if (report.errorMessage) {
            errorMessages[report.errorMessage] = 
              (errorMessages[report.errorMessage] || 0) + 1
          }
        }
      })
      
      const totalReports = reports.length
      const successRate = totalReports > 0 ? (successCount / totalReports) * 100 : 0
      const errorRate = totalReports > 0 ? (failCount / totalReports) * 100 : 0
      
      // 상위 에러 메시지
      const topErrors = Object.entries(errorMessages)
        .map(([message, count]) => ({
          message,
          count,
          percentage: failCount > 0 ? (count / failCount) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
      
      return {
        totalReports,
        reportsByType,
        reportsByEngine,
        averageProcessingTime: totalReports > 0 
          ? totalProcessingTime / totalReports 
          : 0,
        totalCreditsUsed,
        successRate,
        errorRate,
        topErrors
      }
      
    } catch (error) {
      throw error
    }
  }
  
  /**
   * 리포트 일괄 작업
   */
  async executeBulkAction(action: BulkReportAction): Promise<{
    success: number
    failed: number
    results: Array<{ reportId: string; success: boolean; error?: string }>
  }> {
    await this.requirePermission(Permission.WRITE_REPORTS)
    
    const results = {
      success: 0,
      failed: 0,
      results: [] as Array<{ reportId: string; success: boolean; error?: string }>
    }
    
      metadata: { action: action.action, count: action.reportIds.length }
    
    for (const reportId of action.reportIds) {
      try {
        switch (action.action) {
          case 'delete':
            await this.deleteReport(reportId, action.reason)
            break
          case 'archive':
            await this.archiveReport(reportId)
            break
          case 'export':
            // TODO: 익스포트 구현
            break
        }
        
        results.success++
        results.results.push({
          reportId,
          success: true
        })
      } catch (error) {
        results.failed++
        results.results.push({
          reportId,
          success: false,
          error: (error as Error).message
        })
        
          metadata: { reportId, action: action.action }
      }
    }
    
    await this.createAuditLog(`bulk_${action.action}_reports`, 'report', 
      results.failed === 0 ? 'success' : 'failure',
      { action, results }
    )
    
      metadata: results
    
    return results
  }
  
  /**
   * 리포트 재생성 가능 여부 확인
   */
  async checkReportRegeneration(reportId: string): Promise<{
    canRegenerate: boolean
    reason?: string
    sessionData?: any
    creditRequired: number
  }> {
    await this.requirePermission(Permission.WRITE_REPORTS)
    
    try {
      const reportDoc = await getDoc(doc(db, 'ai_analysis_results', reportId))
      if (!reportDoc.exists()) {
        return {
          canRegenerate: false,
          reason: '리포트를 찾을 수 없습니다',
          creditRequired: 0
        }
      }
      
      const reportData = reportDoc.data()
      
      // 세션 데이터 확인
      if (!reportData.sessionId) {
        return {
          canRegenerate: false,
          reason: '원본 측정 데이터가 없습니다',
          creditRequired: 0
        }
      }
      
      const sessionDoc = await getDoc(doc(db, 'measurement_sessions', reportData.sessionId))
      if (!sessionDoc.exists()) {
        return {
          canRegenerate: false,
          reason: '측정 세션을 찾을 수 없습니다',
          creditRequired: 0
        }
      }
      
      const sessionData = sessionDoc.data()
      
      // 조직 크레딧 확인
      if (reportData.organizationId) {
        const orgDoc = await getDoc(doc(db, 'organizations', reportData.organizationId))
        if (orgDoc.exists()) {
          const creditBalance = orgDoc.data().creditBalance || 0
          if (creditBalance < 1) {
            return {
              canRegenerate: false,
              reason: '크레딧이 부족합니다',
              sessionData,
              creditRequired: 1
            }
          }
        }
      }
      
      return {
        canRegenerate: true,
        sessionData,
        creditRequired: 1
      }
      
    } catch (error) {
        metadata: { reportId }
      throw error
    }
  }
  
  // Private 헬퍼 메서드들
  
  private async deleteReport(reportId: string, reason?: string): Promise<void> {
    await this.requirePermission(Permission.DELETE_REPORTS)
    
    const reportRef = doc(db, 'ai_analysis_results', reportId)
    
    // 삭제 전 백업 (감사 로그에 포함)
    const reportDoc = await getDoc(reportRef)
    if (!reportDoc.exists()) {
      throw new Error('리포트를 찾을 수 없습니다')
    }
    
    const reportData = reportDoc.data()
    
    // 리포트 삭제
    await deleteDoc(reportRef)
    
    // 감사 로그
    await this.createAuditLog('delete_report', 'report', 'success', {
      reportId,
      reason,
      deletedData: reportData
    })
    
      metadata: { reportId, reason }
  }
  
  private async archiveReport(reportId: string): Promise<void> {
    const reportRef = doc(db, 'ai_analysis_results', reportId)
    
    await updateDoc(reportRef, {
      archived: true,
      archivedAt: serverTimestamp(),
      archivedBy: this.context?.userId
    })
    
      metadata: { reportId }
  }
  
  private async getSession(sessionId: string): Promise<any> {
    try {
      const sessionDoc = await getDoc(doc(db, 'measurement_sessions', sessionId))
      if (sessionDoc.exists()) {
        return {
          id: sessionDoc.id,
          ...sessionDoc.data(),
          createdAt: this.convertTimestamp(sessionDoc.data().createdAt)
        }
      }
    } catch (error) {
        metadata: { sessionId }
    }
    return null
  }
  
  private async getUser(userId: string): Promise<any> {
    try {
      const userDoc = await getDoc(doc(db, 'measurement_users', userId))
      if (userDoc.exists()) {
        return {
          id: userDoc.id,
          ...userDoc.data()
        }
      }
    } catch (error) {
        metadata: { userId }
    }
    return null
  }
  
  private async getOrganization(organizationId: string): Promise<any> {
    try {
      const orgDoc = await getDoc(doc(db, 'organizations', organizationId))
      if (orgDoc.exists()) {
        return {
          id: orgDoc.id,
          ...orgDoc.data()
        }
      }
    } catch (error) {
        metadata: { organizationId }
    }
    return null
  }
}