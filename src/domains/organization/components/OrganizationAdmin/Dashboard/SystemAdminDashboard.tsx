import React, { useState, useEffect } from 'react'
import SystemAdminSidebar, { SystemAdminMenuItem } from './SystemAdminSidebar'
import {
  SystemDashboardContent,
  SystemAnalyticsContent,
  SystemMonitoringContent,
  CreditManagementContent,
  EnterpriseManagementContent,
  DeviceManagementContent,
  ReportManagementContent,
  MeasurementDataContent
} from './contents'

export default function SystemAdminDashboard() {
  const [activeMenu, setActiveMenu] = useState<SystemAdminMenuItem>('dashboard')
  const [systemHealth, setSystemHealth] = useState<'healthy' | 'warning' | 'error'>('healthy')
  const [notifications, setNotifications] = useState({
    credits: 0,
    devices: 0,
    enterprises: 0
  })

  useEffect(() => {
    // 시스템 상태 및 알림 정보 로드
    loadSystemStatus()
  }, [])

  const loadSystemStatus = async () => {
    try {
      // 실제 API 호출 대신 임시 데이터 사용
      setSystemHealth('healthy')
      setNotifications({
        credits: 3,   // 크레딧 부족 기업 수
        devices: 2,   // 주의 필요 디바이스 수
        enterprises: 1 // 주의 필요 기업 수
      })
    } catch (error) {
      console.error('시스템 상태 로드 실패:', error)
      setSystemHealth('error')
    }
  }

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <SystemDashboardContent />
      case 'analytics':
        return <SystemAnalyticsContent systemStats={{
          totalOrganizations: 45,
          totalUsers: 1250,
          activeUsers: 980,
          totalReports: 8450,
          systemHealth: systemHealth,
          uptime: '99.9%',
          totalCreditsUsed: 125000,
          monthlyGrowth: 12.5,
          todayMeasurements: 145,
          thisWeekMeasurements: 892,
          thisMonthMeasurements: 3456,
          averageReportsPerUser: 6.8,
          totalStorageUsed: 2800,
          averageSessionDuration: 25.5
        }} />
      case 'monitoring':
        return <SystemMonitoringContent isVisible={true} onClose={() => setActiveMenu('dashboard')} />
      case 'credits':
        return <CreditManagementContent isVisible={true} onClose={() => setActiveMenu('dashboard')} />
      case 'enterprises':
        return <EnterpriseManagementContent onClose={() => setActiveMenu('dashboard')} />
      case 'devices':
        return <DeviceManagementContent onClose={() => setActiveMenu('dashboard')} />
      case 'reports':
        return <ReportManagementContent />
      case 'measurements':
        return <MeasurementDataContent />
      default:
        return <SystemDashboardContent />
    }
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* 사이드바 */}
      <SystemAdminSidebar
        activeMenu={activeMenu}
        onMenuChange={setActiveMenu}
        systemHealth={systemHealth}
        notifications={notifications}
      />
      
      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 콘텐츠 */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
} 