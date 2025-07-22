import React from 'react'

// 기존 시스템 관리자 콘텐츠 컴포넌트들 임포트
import {
  SystemDashboardContent,
  SystemAnalyticsContent,
  SystemMonitoringContent,
  CreditManagementContent,
  EnterpriseManagementContent,
  DeviceManagementContent,
  ReportManagementContent,
  MeasurementDataContent,
  UserManagementContent
} from '../../OrganizationAdmin/Dashboard/contents'

interface SystemAdminContentRendererProps {
  activeMenu: string
  searchQuery: string
  onNavigate: (menuId: string) => void
}

/**
 * 시스템 관리자 전용 콘텐츠 렌더러
 */
export default function SystemAdminContentRenderer({
  activeMenu,
  searchQuery,
  onNavigate
}: SystemAdminContentRendererProps) {
  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <SystemDashboardContent />
      
      case 'enterprises':
        return <EnterpriseManagementContent />
      
      case 'devices':
        return <DeviceManagementContent />
      
      case 'users':
        return <UserManagementContent />
      
      case 'reports':
        return <ReportManagementContent />
      
      case 'measurements':
        return <MeasurementDataContent />
      
      case 'credits':
        return <CreditManagementContent />
      
      case 'analytics':
        return (
          <SystemAnalyticsContent 
            systemStats={{
              totalOrganizations: 45,
              totalUsers: 1250,
              activeUsers: 980,
              totalReports: 8450,
              systemHealth: 'healthy',
              uptime: '99.9%',
              totalCreditsUsed: 125000,
              monthlyGrowth: 12.5,
              todayMeasurements: 145,
              thisWeekMeasurements: 892,
              thisMonthMeasurements: 3456,
              totalStorageUsed: 2800,
              averageSessionDuration: 25.5
            }} 
          />
        )
      
      case 'monitoring':
        return <SystemMonitoringContent />
      
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                페이지를 찾을 수 없습니다
              </h3>
              <p className="text-gray-600">
                요청하신 페이지가 존재하지 않습니다.
              </p>
            </div>
          </div>
        )
    }
  }

  return <>{renderContent()}</>
}