/**
 * 사용자 관리 서비스
 * 
 * 조직 멤버, 측정 사용자 관리 등을 담당합니다.
 */

import { BaseAdminService } from '../core/BaseAdminService'
import { Permission } from '../../core/types/AdminTypes'
import { 
  collection, 
  doc as firestoreDoc, 
  getDocs, 
  getDoc, 
  updateDoc,
  deleteDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp,
  runTransaction,
  writeBatch
} from 'firebase/firestore'
import { db, auth } from '@core/services/firebase'
import { deleteUser } from 'firebase/auth'

export interface UserSummary {
  id: string
  email?: string
  name: string
  type: 'member' | 'measurement'
  organizationId?: string
  organizationName?: string
  role?: string
  status: 'active' | 'inactive' | 'suspended'
  lastActivity?: Date
  createdAt: Date
  totalMeasurements?: number
  lastMeasurement?: Date
  deviceCount?: number
}

export interface UserDetails extends UserSummary {
  personalInfo?: {
    birthDate?: Date
    gender?: string
    height?: number
    weight?: number
  }
  activityStats: {
    totalSessions: number
    totalReports: number
    lastSession?: Date
    averageSessionDuration: number
    favoriteDevice?: string
  }
  creditUsage: {
    totalUsed: number
    monthlyUsage: number
    averagePerReport: number
  }
}

export interface UserManagementAction {
  userId: string
  action: 'activate' | 'suspend' | 'delete' | 'reset_password' | 'change_role'
  parameters?: {
    reason?: string
    newRole?: string
    notifyUser?: boolean
  }
}

export interface BulkUserImport {
  organizationId: string
  users: Array<{
    email: string
    name: string
    role?: string
  }>
  sendInvites: boolean
}

export class UserAdminService extends BaseAdminService {
  protected getServiceName(): string {
    return 'UserAdminService'
  }
  
  /**
   * 모든 사용자 조회 (조직 멤버 + 측정 사용자)
   */
  async getAllUsers(
    filters?: {
      organizationId?: string
      type?: 'member' | 'measurement'
      status?: string
      searchTerm?: string
    },
    pagination?: {
      page: number
      pageSize: number
    }
  ): Promise<{
    users: UserSummary[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }> {
    await this.requirePermission(Permission.READ_USERS)
    
    try {
        metadata: { filters }
      
      const users: UserSummary[] = []
      
      // 조직 멤버 조회
      if (!filters?.type || filters.type === 'member') {
        const membersQuery = filters?.organizationId
          ? query(
              collection(db, 'organization_members'),
              where('organizationId', '==', filters.organizationId)
            )
          : collection(db, 'organization_members')
        
        const membersSnapshot = await getDocs(membersQuery)
        
        for (const doc of membersSnapshot.docs) {
          const data = doc.data()
          
          // 필터링
          if (filters?.status && data.status !== filters.status) continue
          if (filters?.searchTerm && 
              !data.name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) &&
              !data.email?.toLowerCase().includes(filters.searchTerm.toLowerCase())) continue
          
          // 조직 정보 조회
          let organizationName = ''
          if (data.organizationId) {
            const orgDoc = await getDoc(firestoreDoc(db, 'organizations', data.organizationId))
            organizationName = orgDoc.exists() ? orgDoc.data().name : ''
          }
          
          users.push({
            id: doc.id,
            email: data.email,
            name: data.name,
            type: 'member',
            organizationId: data.organizationId,
            organizationName,
            role: data.role,
            status: data.status || 'active',
            lastActivity: this.convertTimestamp(data.lastActivity) || undefined,
            createdAt: this.convertTimestamp(data.createdAt) || new Date()
          })
        }
      }
      
      // 측정 사용자 조회
      if (!filters?.type || filters.type === 'measurement') {
        const measurementQuery = filters?.organizationId
          ? query(
              collection(db, 'measurement_users'),
              where('organizationId', '==', filters.organizationId)
            )
          : collection(db, 'measurement_users')
        
        const measurementSnapshot = await getDocs(measurementQuery)
        
        for (const doc of measurementSnapshot.docs) {
          const data = doc.data()
          
          // 필터링
          if (filters?.searchTerm && 
              !data.name?.toLowerCase().includes(filters.searchTerm.toLowerCase())) continue
          
          // 조직 정보 조회
          let organizationName = ''
          if (data.organizationId) {
            const orgDoc = await getDoc(firestoreDoc(db, 'organizations', data.organizationId))
            organizationName = orgDoc.exists() ? orgDoc.data().name : ''
          }
          
          // 측정 통계
          const sessionsQuery = query(
            collection(db, 'measurement_sessions'),
            where('userId', '==', doc.id)
          )
          const sessionsSnapshot = await getDocs(sessionsQuery)
          
          const lastSession = sessionsSnapshot.docs.length > 0
            ? this.convertTimestamp(
                sessionsSnapshot.docs
                  .sort((a, b) => b.data().createdAt.seconds - a.data().createdAt.seconds)[0]
                  .data().createdAt
              )
            : undefined
          
          users.push({
            id: doc.id,
            name: data.name,
            type: 'measurement',
            organizationId: data.organizationId,
            organizationName,
            status: 'active',
            createdAt: this.convertTimestamp(data.createdAt) || new Date(),
            totalMeasurements: sessionsSnapshot.size,
            lastMeasurement: lastSession || undefined
          })
        }
      }
      
      // 정렬
      users.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      
      // 페이지네이션
      const page = pagination?.page || 1
      const pageSize = pagination?.pageSize || 50
      const start = (page - 1) * pageSize
      const paginatedUsers = users.slice(start, start + pageSize)
      
        metadata: { count: users.length }
      
      return {
        users: paginatedUsers,
        total: users.length,
        page,
        pageSize,
        totalPages: Math.ceil(users.length / pageSize)
      }
      
    } catch (error) {
      throw error
    }
  }
  
  /**
   * 사용자 상세 정보 조회
   */
  async getUserDetails(userId: string, userType: 'member' | 'measurement'): Promise<UserDetails> {
    await this.requirePermission(Permission.READ_USERS)
    
    try {
      const collection_name = userType === 'member' ? 'organization_members' : 'measurement_users'
      const userDoc = await getDoc(firestoreDoc(db, collection_name, userId))
      
      if (!userDoc.exists()) {
        throw new Error('사용자를 찾을 수 없습니다')
      }
      
      const userData = userDoc.data()
      
      // 기본 정보
      const userSummary: UserSummary = {
        id: userDoc.id,
        email: userData.email,
        name: userData.name,
        type: userType,
        organizationId: userData.organizationId,
        organizationName: await this.getOrganizationName(userData.organizationId),
        role: userData.role,
        status: userData.status || 'active',
        lastActivity: this.convertTimestamp(userData.lastActivity) || undefined,
        createdAt: this.convertTimestamp(userData.createdAt) || new Date()
      }
      
      // 활동 통계
      const activityStats = await this.getUserActivityStats(userId)
      
      // 크레딧 사용량
      const creditUsage = await this.getUserCreditUsage(userId)
      
      // 개인 정보 (측정 사용자만)
      const personalInfo = userType === 'measurement' ? {
        birthDate: this.convertTimestamp(userData.birthDate) || undefined,
        gender: userData.gender,
        height: userData.height,
        weight: userData.weight
      } : undefined
      
      await this.createAuditLog('view_user', 'user', 'success', {
        userId,
        userType
      })
      
      return {
        ...userSummary,
        personalInfo,
        activityStats,
        creditUsage
      }
      
    } catch (error) {
        metadata: { userId, userType }
      
      await this.createAuditLog('view_user', 'user', 'failure', {
        userId,
        userType,
        error: (error as Error).message
      })
      
      throw error
    }
  }
  
  /**
   * 사용자 관리 액션 실행
   */
  async executeUserAction(action: UserManagementAction): Promise<boolean> {
    await this.requirePermission(Permission.WRITE_USERS)
    
    try {
        metadata: { userId: action.userId, action: action.action }
      
      switch (action.action) {
        case 'activate':
          await this.activateUser(action.userId)
          break
          
        case 'suspend':
          await this.suspendUser(action.userId, action.parameters?.reason)
          break
          
        case 'delete':
          await this.deleteUser(action.userId)
          break
          
        case 'reset_password':
          await this.resetUserPassword(action.userId)
          break
          
        case 'change_role':
          if (!action.parameters?.newRole) {
            throw new Error('새 역할이 지정되지 않았습니다')
          }
          await this.changeUserRole(action.userId, action.parameters.newRole)
          break
      }
      
      await this.createAuditLog(`user_${action.action}`, 'user', 'success', {
        action
      })
      
      return true
      
    } catch (error) {
        metadata: { action }
      
      await this.createAuditLog(`user_${action.action}`, 'user', 'failure', {
        action,
        error: (error as Error).message
      })
      
      throw error
    }
  }
  
  /**
   * 사용자 일괄 가져오기
   */
  async importUsers(importData: BulkUserImport): Promise<{
    imported: number
    failed: number
    results: Array<{ email: string; success: boolean; error?: string }>
  }> {
    await this.requirePermission([Permission.WRITE_USERS, Permission.INVITE_USERS])
    
    const results = {
      imported: 0,
      failed: 0,
      results: [] as Array<{ email: string; success: boolean; error?: string }>
    }
    
      metadata: { organizationId: importData.organizationId, count: importData.users.length }
    
    for (const userData of importData.users) {
      try {
        // 이메일 중복 확인
        const existingQuery = query(
          collection(db, 'organization_members'),
          where('email', '==', userData.email),
          where('organizationId', '==', importData.organizationId)
        )
        const existingSnapshot = await getDocs(existingQuery)
        
        if (!existingSnapshot.empty) {
          throw new Error('이미 존재하는 이메일입니다')
        }
        
        // 사용자 생성
        await runTransaction(db, async (transaction) => {
          const memberRef = firestoreDoc(collection(db, 'organization_members'))
          
          transaction.set(memberRef, {
            email: userData.email,
            name: userData.name,
            role: userData.role || 'member',
            organizationId: importData.organizationId,
            status: 'pending',
            invitedAt: serverTimestamp(),
            invitedBy: this.context?.userId,
            createdAt: serverTimestamp()
          })
          
          if (importData.sendInvites) {
            // TODO: 초대 이메일 발송
          }
        })
        
        results.imported++
        results.results.push({
          email: userData.email,
          success: true
        })
      } catch (error) {
        results.failed++
        results.results.push({
          email: userData.email,
          success: false,
          error: (error as Error).message
        })
      }
    }
    
    await this.createAuditLog('import_users', 'user', 
      results.failed === 0 ? 'success' : 'failure',
      { importData, results }
    )
    
      metadata: results
    
    return results
  }
  
  /**
   * 사용자 활동 통계 조회
   */
  async getUserActivitySummary(
    organizationId?: string,
    period: 'today' | 'week' | 'month' = 'month'
  ): Promise<{
    activeUsers: number
    newUsers: number
    totalSessions: number
    averageSessionsPerUser: number
    topUsers: Array<{
      userId: string
      userName: string
      sessionCount: number
      reportCount: number
    }>
  }> {
    await this.requirePermission(Permission.VIEW_ANALYTICS)
    
    try {
      const { start, end } = this.getDateRange(period)
      
      // 활성 사용자 조회
      let activeUsersQuery = query(
        collection(db, 'measurement_sessions'),
        where('createdAt', '>=', Timestamp.fromDate(start)),
        where('createdAt', '<=', Timestamp.fromDate(end))
      )
      
      if (organizationId) {
        activeUsersQuery = query(activeUsersQuery,
          where('organizationId', '==', organizationId)
        )
      }
      
      const sessionsSnapshot = await getDocs(activeUsersQuery)
      const userSessionMap = new Map<string, number>()
      const userReportMap = new Map<string, number>()
      
      sessionsSnapshot.docs.forEach(doc => {
        const userId = doc.data().userId
        userSessionMap.set(userId, (userSessionMap.get(userId) || 0) + 1)
      })
      
      // 리포트 조회
      let reportsQuery = query(
        collection(db, 'ai_analysis_results'),
        where('createdAt', '>=', Timestamp.fromDate(start)),
        where('createdAt', '<=', Timestamp.fromDate(end))
      )
      
      if (organizationId) {
        reportsQuery = query(reportsQuery,
          where('organizationId', '==', organizationId)
        )
      }
      
      const reportsSnapshot = await getDocs(reportsQuery)
      reportsSnapshot.docs.forEach(doc => {
        const userId = doc.data().userId
        userReportMap.set(userId, (userReportMap.get(userId) || 0) + 1)
      })
      
      // 신규 사용자 조회
      let newUsersQuery = query(
        collection(db, 'measurement_users'),
        where('createdAt', '>=', Timestamp.fromDate(start)),
        where('createdAt', '<=', Timestamp.fromDate(end))
      )
      
      if (organizationId) {
        newUsersQuery = query(newUsersQuery,
          where('organizationId', '==', organizationId)
        )
      }
      
      const newUsersSnapshot = await getDocs(newUsersQuery)
      
      // 상위 사용자
      const topUsers = await Promise.all(
        Array.from(userSessionMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(async ([userId, sessionCount]) => {
            const userDoc = await getDoc(firestoreDoc(db, 'measurement_users', userId))
            return {
              userId,
              userName: userDoc.exists() ? userDoc.data().name : 'Unknown',
              sessionCount,
              reportCount: userReportMap.get(userId) || 0
            }
          })
      )
      
      return {
        activeUsers: userSessionMap.size,
        newUsers: newUsersSnapshot.size,
        totalSessions: sessionsSnapshot.size,
        averageSessionsPerUser: userSessionMap.size > 0 
          ? sessionsSnapshot.size / userSessionMap.size 
          : 0,
        topUsers
      }
      
    } catch (error) {
      throw error
    }
  }
  
  // Private 헬퍼 메서드들
  
  private async getOrganizationName(organizationId?: string): Promise<string> {
    if (!organizationId) return ''
    
    try {
      const orgDoc = await getDoc(firestoreDoc(db, 'organizations', organizationId))
      return orgDoc.exists() ? orgDoc.data().name : ''
    } catch {
      return ''
    }
  }
  
  private async getUserActivityStats(userId: string) {
    // 세션 조회
    const sessionsQuery = query(
      collection(db, 'measurement_sessions'),
      where('userId', '==', userId)
    )
    const sessionsSnapshot = await getDocs(sessionsQuery)
    
    // 리포트 조회
    const reportsQuery = query(
      collection(db, 'ai_analysis_results'),
      where('userId', '==', userId)
    )
    const reportsSnapshot = await getDocs(reportsQuery)
    
    // 평균 세션 시간 계산
    let totalDuration = 0
    let lastSession: Date | undefined
    
    sessionsSnapshot.docs.forEach(doc => {
      const data = doc.data()
      totalDuration += data.duration || 0
      
      const sessionDate = this.convertTimestamp(data.createdAt)
      if (sessionDate && (!lastSession || sessionDate > lastSession)) {
        lastSession = sessionDate
      }
    })
    
    return {
      totalSessions: sessionsSnapshot.size,
      totalReports: reportsSnapshot.size,
      lastSession,
      averageSessionDuration: sessionsSnapshot.size > 0 
        ? totalDuration / sessionsSnapshot.size 
        : 0,
      favoriteDevice: undefined // TODO: 구현
    }
  }
  
  private async getUserCreditUsage(userId: string) {
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    
    // 전체 크레딧 사용량
    const allCreditsQuery = query(
      collection(db, 'credit_transactions'),
      where('userId', '==', userId),
      where('type', '==', 'use')
    )
    const allCreditsSnapshot = await getDocs(allCreditsQuery)
    
    // 이번 달 사용량
    const monthlyCreditsQuery = query(
      collection(db, 'credit_transactions'),
      where('userId', '==', userId),
      where('type', '==', 'use'),
      where('createdAt', '>=', Timestamp.fromDate(monthStart))
    )
    const monthlyCreditsSnapshot = await getDocs(monthlyCreditsQuery)
    
    const totalUsed = allCreditsSnapshot.docs.reduce((sum, doc) => 
      sum + Math.abs(doc.data().amount || 0), 0
    )
    
    const monthlyUsage = monthlyCreditsSnapshot.docs.reduce((sum, doc) => 
      sum + Math.abs(doc.data().amount || 0), 0
    )
    
    // 리포트 수
    const reportsQuery = query(
      collection(db, 'ai_analysis_results'),
      where('userId', '==', userId)
    )
    const reportsSnapshot = await getDocs(reportsQuery)
    
    return {
      totalUsed,
      monthlyUsage,
      averagePerReport: reportsSnapshot.size > 0 
        ? totalUsed / reportsSnapshot.size 
        : 0
    }
  }
  
  private async activateUser(userId: string): Promise<void> {
    const memberRef = firestoreDoc(db, 'organization_members', userId)
    
    await updateDoc(memberRef, {
      status: 'active',
      activatedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  }
  
  private async suspendUser(userId: string, reason?: string): Promise<void> {
    const memberRef = firestoreDoc(db, 'organization_members', userId)
    
    await updateDoc(memberRef, {
      status: 'suspended',
      suspendedAt: serverTimestamp(),
      suspendedReason: reason,
      updatedAt: serverTimestamp()
    })
  }
  
  private async deleteUser(userId: string): Promise<void> {
    await this.requirePermission(Permission.DELETE_USERS)
    
    // TODO: 관련 데이터 처리 (세션, 리포트 등)
    
    await deleteDoc(firestoreDoc(db, 'organization_members', userId))
  }
  
  private async resetUserPassword(userId: string): Promise<void> {
    // TODO: 비밀번호 재설정 이메일 발송
      metadata: { userId }
  }
  
  private async changeUserRole(userId: string, newRole: string): Promise<void> {
    const memberRef = firestoreDoc(db, 'organization_members', userId)
    
    await updateDoc(memberRef, {
      role: newRole,
      roleChangedAt: serverTimestamp(),
      roleChangedBy: this.context?.userId,
      updatedAt: serverTimestamp()
    })
  }
}