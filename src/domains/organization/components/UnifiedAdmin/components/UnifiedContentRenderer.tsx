import React from 'react'
import { UnifiedContentRendererProps } from '../types/unified-admin'

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

// 조직 관리자 콘텐츠 임포트 
import DashboardSection from '../../OrganizationAdmin/Dashboard/DashboardSection'

// 통합 조직 관리자 콘텐츠들 임포트
import {
  OrganizationManagementContent,
  OrganizationUserManagementContent,
  OrganizationDeviceManagementContent,
  AIReportManagementContent,
  OrganizationCreditManagementContent
} from '../contents'

/**
 * 통합 콘텐츠 렌더러 컴포넌트
 * 선택된 메뉴에 따라 적절한 콘텐츠 컴포넌트를 렌더링
 */
export const UnifiedContentRenderer: React.FC<UnifiedContentRendererProps> = ({
  activeMenu,
  userType,
  searchQuery,
  onNavigate
}) => {
  const renderContent = () => {
    // Phase 2: 시스템 관리자 컴포넌트 연결 완료
    // Phase 3: 조직 관리자 컴포넌트 연결 예정
    switch (activeMenu) {
      case 'dashboard':
        if (userType === 'SYSTEM_ADMIN') {
          return <SystemDashboardContent />
        } else {
          return <DashboardSection />
        }
      
      case 'enterprises':
        return <EnterpriseManagementContent />
      
      case 'devices':
        if (userType === 'SYSTEM_ADMIN') {
          return <DeviceManagementContent />
        } else {
          return <OrganizationDeviceManagementContent />
        }
      
      case 'users':
        if (userType === 'SYSTEM_ADMIN') {
          return <UserManagementContent />
        } else {
          return <OrganizationUserManagementContent />
        }
      
      case 'reports':
        return <ReportManagementContent />
      
      case 'measurements':
        return <MeasurementDataContent />
      
      case 'credits':
        if (userType === 'SYSTEM_ADMIN') {
          return <CreditManagementContent />
        } else {
          return <OrganizationCreditManagementContent />
        }
      
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
      
      // 조직 관리자 전용 메뉴들 (Phase 3에서 구현 완료)
      case 'organization':
        return <OrganizationManagementContent />
      
      case 'ai-reports':
        return <AIReportManagementContent />
      
      default:
        return <DefaultPlaceholder activeMenu={activeMenu} />
    }
  }

  return (
    <main className="flex-1 overflow-auto">
      <div className="p-6">
        {renderContent()}
      </div>
    </main>
  )
}

// 플레이스홀더 컴포넌트들 (Phase 1용)
const DashboardPlaceholder: React.FC<{ userType: string }> = ({ userType }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">
      {userType === 'SYSTEM_ADMIN' ? '시스템 대시보드' : '조직 대시보드'}
    </h2>
    <p className="text-gray-600">
      Phase 2-3에서 실제 대시보드 컴포넌트가 연결됩니다.
    </p>
  </div>
)

const EnterprisePlaceholder: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">기업 관리</h2>
    <p className="text-gray-600">기업 관리 컴포넌트가 여기에 표시됩니다.</p>
  </div>
)

const DevicesPlaceholder: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">디바이스 관리</h2>
    <p className="text-gray-600">디바이스 관리 컴포넌트가 여기에 표시됩니다.</p>
  </div>
)

const UsersPlaceholder: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">사용자 관리</h2>
    <p className="text-gray-600">사용자 관리 컴포넌트가 여기에 표시됩니다.</p>
  </div>
)

const ReportsPlaceholder: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">리포트 관리</h2>
    <p className="text-gray-600">리포트 관리 컴포넌트가 여기에 표시됩니다.</p>
  </div>
)

const MeasurementsPlaceholder: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">측정데이터 관리</h2>
    <p className="text-gray-600">측정데이터 관리 컴포넌트가 여기에 표시됩니다.</p>
  </div>
)

const CreditsPlaceholder: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">크레딧 관리</h2>
    <p className="text-gray-600">크레딧 관리 컴포넌트가 여기에 표시됩니다.</p>
  </div>
)

const AnalyticsPlaceholder: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">사용량 분석</h2>
    <p className="text-gray-600">사용량 분석 컴포넌트가 여기에 표시됩니다.</p>
  </div>
)

const MonitoringPlaceholder: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">시스템 모니터링</h2>
    <p className="text-gray-600">시스템 모니터링 컴포넌트가 여기에 표시됩니다.</p>
  </div>
)

const OrganizationPlaceholder: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">조직 관리</h2>
    <p className="text-gray-600">조직 관리 컴포넌트가 여기에 표시됩니다.</p>
  </div>
)

const AIReportsPlaceholder: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">AI 리포트</h2>
    <p className="text-gray-600">AI 리포트 컴포넌트가 여기에 표시됩니다.</p>
  </div>
)

const DefaultPlaceholder: React.FC<{ activeMenu: string }> = ({ activeMenu }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">개발 중</h2>
    <p className="text-gray-600">
      '{activeMenu}' 메뉴는 현재 개발 중입니다.
    </p>
  </div>
)

export default UnifiedContentRenderer