/**
 * 시스템 관리자 서비스 모듈
 * 
 * SystemAdminService에서 분리된 도메인별 전담 서비스들:
 * - SystemStatsService: 시스템 통계, 모니터링, 헬스 체크
 * - SystemOrganizationManagementService: 조직 관리, 기업 개요, 리포트 분석
 * - SystemDeviceManagementService: 디바이스 관리, 사용량 분석, 렌탈 관리
 * - SystemCreditManagementService: 크레딧 관리, 사용량 분석, 트렌드 분석
 */

// Service Exports
export { default as SystemStatsService } from './SystemStatsService';
export { default as SystemOrganizationManagementService } from './OrganizationManagementService';
export { default as SystemDeviceManagementService } from './DeviceManagementService';
export { default as SystemCreditManagementService } from './CreditManagementService';

// Type Exports - SystemStatsService
export type {
  SystemStats,
  SystemActivity,
  SystemHealth,
  ErrorLog,
  PerformanceMetrics
} from './SystemStatsService';

// Type Exports - OrganizationManagementService
export type {
  OrganizationSummary,
  OrganizationComparison,
  EnterpriseOverview,
  RecentEnterpriseRegistration,
  EnterpriseManagementAction,
  ReportAnalytics
} from './OrganizationManagementService';

// Type Exports - DeviceManagementService
export type {
  SystemDeviceOverview,
  OrganizationDeviceBreakdown,
  DeviceUsageAnalytics,
  DeviceManagementAction,
  DeviceUsageStatusItem,
  RentalStatistics,
  ScheduledReturn
} from './DeviceManagementService';

// Type Exports - CreditManagementService
export type {
  OrganizationCreditInfo,
  CreditManagementAction,
  CreditTrendsAnalysis,
  UsageAnalytics
} from './CreditManagementService';

/**
 * 통합 시스템 관리자 서비스 클래스
 * 각 전담 서비스를 조합하여 기존 SystemAdminService와 호환되는 인터페이스 제공
 */
export class UnifiedSystemAdminService {
  constructor(
    private statsService = SystemStatsService,
    private orgService = SystemOrganizationManagementService, 
    private deviceService = SystemDeviceManagementService,
    private creditService = SystemCreditManagementService
  ) {}

  // SystemStatsService methods
  getSystemStats = this.statsService.getSystemStats.bind(this.statsService);
  getRecentSystemActivities = this.statsService.getRecentSystemActivities.bind(this.statsService);
  getSystemHealth = this.statsService.getSystemHealth.bind(this.statsService);
  getErrorLogs = this.statsService.getErrorLogs.bind(this.statsService);
  getPerformanceMetrics = this.statsService.getPerformanceMetrics.bind(this.statsService);

  // SystemOrganizationManagementService methods
  getAllOrganizationSummaries = this.orgService.getAllOrganizationSummaries.bind(this.orgService);
  getOrganizationComparison = this.orgService.getOrganizationComparison.bind(this.orgService);
  getAllEnterpriseOverview = this.orgService.getAllEnterpriseOverview.bind(this.orgService);
  getRecentEnterpriseRegistrations = this.orgService.getRecentEnterpriseRegistrations.bind(this.orgService);
  getOrganizationReportAnalytics = this.orgService.getOrganizationReportAnalytics.bind(this.orgService);
  executeEnterpriseManagementAction = this.orgService.executeEnterpriseManagementAction.bind(this.orgService);

  // SystemDeviceManagementService methods
  getSystemDeviceOverview = this.deviceService.getSystemDeviceOverview.bind(this.deviceService);
  getOrganizationDeviceBreakdown = this.deviceService.getOrganizationDeviceBreakdown.bind(this.deviceService);
  getDeviceUsageAnalytics = this.deviceService.getDeviceUsageAnalytics.bind(this.deviceService);
  executeDeviceManagementAction = this.deviceService.executeDeviceManagementAction.bind(this.deviceService);
  getDeviceUsageStatusList = this.deviceService.getDeviceUsageStatusList.bind(this.deviceService);
  getRentalStatistics = this.deviceService.getRentalStatistics.bind(this.deviceService);
  getScheduledReturns = this.deviceService.getScheduledReturns.bind(this.deviceService);
  updateOverdueRentals = this.deviceService.updateOverdueRentals.bind(this.deviceService);

  // SystemCreditManagementService methods
  getAllOrganizationCredits = this.creditService.getAllOrganizationCredits.bind(this.creditService);
  grantFreeCredits = this.creditService.grantFreeCredits.bind(this.creditService);
  getCreditTrendsAnalysis = this.creditService.getCreditTrendsAnalysis.bind(this.creditService);
  getUsageAnalytics = this.creditService.getUsageAnalytics.bind(this.creditService);
}

// 기본 통합 서비스 인스턴스 생성 및 export
export const unifiedSystemAdminService = new UnifiedSystemAdminService();