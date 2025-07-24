/**
 * 관리자 서비스 모듈 통합 export
 */

// 코어 서비스
export { BaseAdminService } from './core/BaseAdminService'
export type { AuditLogEntry, ServiceContext } from './core/BaseAdminService'

// 조직 관리 서비스
export { OrganizationAdminService } from './organization/OrganizationAdminService'
export type { 
  OrganizationSummary, 
  EnterpriseOverview, 
  EnterpriseManagementAction 
} from './organization/OrganizationAdminService'

// 크레딧 관리 서비스
export { CreditAdminService } from './credit/CreditAdminService'
export type { 
  OrganizationCreditInfo, 
  CreditManagementAction, 
  CreditTransaction, 
  CreditAnalytics 
} from './credit/CreditAdminService'

// 시스템 분석 서비스
export { SystemAnalyticsService } from './analytics/SystemAnalyticsService'
export type { 
  SystemStats, 
  UsageAnalytics, 
  SystemActivity, 
  SystemHealth, 
  PerformanceMetrics 
} from './analytics/SystemAnalyticsService'

// 리포트 관리 서비스
export { ReportAdminService } from './report/ReportAdminService'
export type { 
  AIReportSummary, 
  ReportStatistics, 
  ReportSearchFilters, 
  BulkReportAction 
} from './report/ReportAdminService'

// 디바이스 관리 서비스
export { DeviceAdminService } from './device/DeviceAdminService'
export type { 
  DeviceSummary, 
  DeviceAllocation, 
  DeviceStatistics, 
  BulkDeviceAction 
} from './device/DeviceAdminService'

// 사용자 관리 서비스
export { UserAdminService } from './user/UserAdminService'
export type { 
  UserSummary, 
  UserDetails, 
  UserManagementAction, 
  BulkUserImport 
} from './user/UserAdminService'

// 서비스 임포트 (adminServices 객체 생성용)
import { OrganizationAdminService as OrgAdminService } from './organization/OrganizationAdminService'
import { CreditAdminService as CreditAdminSvc } from './credit/CreditAdminService'
import { SystemAnalyticsService as AnalyticsService } from './analytics/SystemAnalyticsService'
import { ReportAdminService as ReportAdminSvc } from './report/ReportAdminService'
import { DeviceAdminService as DeviceAdminSvc } from './device/DeviceAdminService'
import { UserAdminService as UserAdminSvc } from './user/UserAdminService'

// 서비스 인스턴스 생성 헬퍼
export const adminServices = {
  organization: new OrgAdminService(),
  credit: new CreditAdminSvc(),
  analytics: new AnalyticsService(),
  report: new ReportAdminSvc(),
  device: new DeviceAdminSvc(),
  user: new UserAdminSvc()
}