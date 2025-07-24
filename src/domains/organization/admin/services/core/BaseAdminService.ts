/**
 * 관리자 서비스 기본 클래스
 * 
 * 모든 관리자 서비스가 상속받는 추상 클래스로,
 * 공통 기능과 보안 체크를 제공합니다.
 */

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
  increment,
  DocumentReference
} from 'firebase/firestore'
import enterpriseAuthService from '../../../services/EnterpriseAuthService'
import { Permission, UserType } from '../../core/types/AdminTypes'

export interface AuditLogEntry {
  id?: string
  userId: string
  userEmail: string
  organizationId?: string
  organizationName?: string
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, any>
  timestamp: Date
  ip?: string
  userAgent?: string
  result: 'success' | 'failure'
  errorMessage?: string
}

export interface ServiceContext {
  userId: string
  userEmail: string
  userType: UserType
  organizationId?: string
  organizationName?: string
  permissions: Permission[]
}

export abstract class BaseAdminService extends BaseService {
  protected context: ServiceContext | null = null
  
  constructor() {
    super()
    this.initializeContext()
  }
  
  /**
   * 서비스 컨텍스트 초기화
   */
  protected initializeContext(): void {
    const currentContext = enterpriseAuthService.getCurrentContext()
    const currentUser = currentContext.user
    
    if (!currentUser) {
      this.context = null
      return
    }
    
    this.context = {
      userId: currentUser.id,
      userEmail: currentUser.email || '',
      userType: currentUser.userType as UserType,
      organizationId: currentContext.organization?.id,
      organizationName: currentContext.organization?.name,
      permissions: [] // TODO: 실제 권한 로드
    }
  }
  
  /**
   * 권한 체크
   */
  protected async checkPermission(permission: Permission | Permission[]): Promise<boolean> {
    if (!this.context) {
      return false
    }
    
    const requiredPermissions = Array.isArray(permission) ? permission : [permission]
    
    // 시스템 관리자는 모든 권한 보유
    if (this.context.userType === UserType.SYSTEM_ADMIN) {
      return true
    }
    
    // TODO: 실제 권한 체크 로직
    const hasAllPermissions = requiredPermissions.every(p => 
      this.context!.permissions.includes(p)
    )
    
    if (!hasAllPermissions) {
    }
    
    return hasAllPermissions
  }
  
  /**
   * 권한 확인 및 예외 발생
   */
  protected async requirePermission(permission: Permission | Permission[]): Promise<void> {
    const hasPermission = await this.checkPermission(permission)
    if (!hasPermission) {
      throw new Error('권한이 없습니다')
    }
  }
  
  /**
   * 감사 로그 생성
   */
  protected async createAuditLog(
    action: string, 
    resource: string, 
    result: 'success' | 'failure',
    details?: Record<string, any>
  ): Promise<void> {
    if (!this.context) return
    
    try {
      const auditLog: Omit<AuditLogEntry, 'id'> = {
        userId: this.context.userId,
        userEmail: this.context.userEmail,
        organizationId: this.context.organizationId,
        organizationName: this.context.organizationName,
        action,
        resource,
        details,
        timestamp: new Date(),
        result,
        userAgent: navigator?.userAgent
      }
      
      await addDoc(collection(db, 'audit_logs'), {
        ...auditLog,
        timestamp: serverTimestamp()
      })
      
      
    } catch (error) {
    }
  }
  
  /**
   * 트랜잭션 실행 및 로깅
   */
  protected async executeTransaction<T>(
    operation: string,
    transactionFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now()
    
    try {
      
      const result = await transactionFn()
      
      const duration = Date.now() - startTime
      
      await this.createAuditLog(operation, 'transaction', 'success', { duration })
      
      return result
      
    } catch (error) {
      const duration = Date.now() - startTime
      
      await this.createAuditLog(operation, 'transaction', 'failure', { 
        duration, 
        error: (error as Error).message 
      })
      
      throw error
    }
  }
  
  /**
   * 배치 작업 실행
   */
  protected async executeBatch<T>(
    operation: string,
    items: T[],
    batchSize: number = 500,
    processFn: (item: T, batch: any) => Promise<void>
  ): Promise<{ success: number; failed: number; errors: any[] }> {
    const results = { success: 0, failed: 0, errors: [] as any[] }
    
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = writeBatch(db)
      const batchItems = items.slice(i, i + batchSize)
      
      try {
        for (const item of batchItems) {
          await processFn(item, batch)
        }
        
        await batch.commit()
        results.success += batchItems.length
        
      } catch (error) {
        results.failed += batchItems.length
        results.errors.push({
          batchIndex: i / batchSize,
          error: (error as Error).message
        })
        
      }
    }
    
    
    await this.createAuditLog(operation, 'batch', 
      results.failed === 0 ? 'success' : 'failure', 
      results
    )
    
    return results
  }
  
  /**
   * 페이지네이션 헬퍼
   */
  protected async paginateQuery<T>(
    baseQuery: any,
    page: number = 1,
    pageSize: number = 20,
    transformFn?: (doc: any) => T
  ): Promise<{
    data: T[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }> {
    // 전체 개수 조회
    const totalSnapshot = await getDocs(baseQuery)
    const total = totalSnapshot.size
    
    // 페이지네이션 적용
    const offset = (page - 1) * pageSize
    const paginatedQuery = query(baseQuery, firestoreLimit(pageSize))
    const snapshot = await getDocs(paginatedQuery)
    
    const data = snapshot.docs
      .slice(offset, offset + pageSize)
      .map(doc => transformFn ? transformFn(doc) : doc.data() as T)
    
    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  }
  
  /**
   * 날짜 범위 헬퍼
   */
  protected getDateRange(period: 'today' | 'week' | 'month' | 'year'): { start: Date; end: Date } {
    const end = new Date()
    const start = new Date()
    
    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0)
        break
      case 'week':
        start.setDate(start.getDate() - 7)
        break
      case 'month':
        start.setMonth(start.getMonth() - 1)
        break
      case 'year':
        start.setFullYear(start.getFullYear() - 1)
        break
    }
    
    return { start, end }
  }
  
  /**
   * Timestamp 변환 헬퍼
   */
  protected convertTimestamp(timestamp: any): Date | null {
    if (!timestamp) return null
    
    if (timestamp instanceof Date) return timestamp
    
    if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate()
    }
    
    if (timestamp?.seconds) {
      return new Date(timestamp.seconds * 1000)
    }
    
    return null
  }
  
  /**
   * 서비스 이름 반환 (각 서비스에서 오버라이드)
   */
  protected abstract getServiceName(): string
}