import React from 'react'

// 조직 관리자 콘텐츠 컴포넌트들 임포트
import DashboardSection from '../Dashboard/DashboardSection'
import {
  OrganizationManagementContent,
  OrganizationUserManagementContent,
  OrganizationDeviceManagementContent,
  AIReportManagementContent,
  OrganizationCreditManagementContent
} from '../../UnifiedAdmin/contents'

interface OrganizationAdminContentRendererProps {
  activeMenu: string
  searchQuery: string
  onNavigate: (menuId: string) => void
}

/**
 * 조직 관리자 전용 콘텐츠 렌더러
 */
export default function OrganizationAdminContentRenderer({
  activeMenu,
  searchQuery,
  onNavigate
}: OrganizationAdminContentRendererProps) {
  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <DashboardSection />
      
      case 'organization':
        return <OrganizationManagementContent />
      
      case 'users':
        return <OrganizationUserManagementContent />
      
      case 'devices':
        return <OrganizationDeviceManagementContent />
      
      case 'ai-reports':
        return <AIReportManagementContent />
      
      case 'credits':
        return <OrganizationCreditManagementContent />
      
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