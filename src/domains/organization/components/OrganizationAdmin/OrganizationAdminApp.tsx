/**
 * 조직 관리자 전용 앱
 * 
 * /org-admin/* 경로로 접근하는 조직 관리자를 위한 전용 인터페이스
 */

import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import enterpriseAuthService from '../../services/EnterpriseAuthService'
import { performLogout } from '../../utils/auth-utils'

// 통합 컴포넌트들 임포트 (기존 UnifiedAdmin 재사용)
import UnifiedAdminSidebar from '../UnifiedAdmin/components/UnifiedAdminSidebar'
import UnifiedAdminHeader from '../UnifiedAdmin/components/UnifiedAdminHeader'
import OrganizationAdminContentRenderer from './components/OrganizationAdminContentRenderer'

// 훅들 임포트
import useOrganizationAdminNavigation from './hooks/useOrganizationAdminNavigation'
import useAdminPermissions from '../UnifiedAdmin/hooks/useAdminPermissions'
import useUnifiedAdminState from '../UnifiedAdmin/hooks/useUnifiedAdminState'

export default function OrganizationAdminApp() {
  const location = useLocation()
  const navigate = useNavigate()
  const currentContext = enterpriseAuthService.getCurrentContext()

  // 훅들
  const navigation = useOrganizationAdminNavigation()
  const permissions = useAdminPermissions()
  const adminState = useUnifiedAdminState()

  // URL이 /org-admin으로만 되어있으면 /org-admin/dashboard로 리디렉션
  useEffect(() => {
    if (location.pathname === '/org-admin') {
      navigate('/org-admin/dashboard', { replace: true })
    }
  }, [location.pathname, navigate])

  // 조직 관리자가 아니면 접근 거부
  if (!['ORGANIZATION_ADMIN', 'ORGANIZATION_MEMBER'].includes(currentContext.user?.userType || '')) {
    return (
      <div className="h-screen flex bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-600 mb-2">접근 권한 없음</h3>
            <p className="text-gray-600">조직 관리자만 접근할 수 있습니다.</p>
          </div>
        </div>
      </div>
    )
  }

  // 사용자가 로그인되어 있지 않으면 로딩 상태 표시
  if (!currentContext.user) {
    return (
      <div className="h-screen flex bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">사용자 정보 로드 중</h3>
            <p className="text-gray-600">잠시만 기다려주세요...</p>
          </div>
        </div>
      </div>
    )
  }

  const userInfo = {
    displayName: currentContext.user.displayName,
    email: currentContext.user.email,
    userType: currentContext.user.userType as 'ORGANIZATION_ADMIN' | 'ORGANIZATION_MEMBER',
    organizationName: currentContext.organization?.name
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* 조직 관리자 전용 사이드바 */}
      <UnifiedAdminSidebar
        activeMenu={navigation.activeMenu}
        onMenuChange={(menuId) => {
          navigation.setActiveMenu(menuId)
          navigation.navigateToMenu(menuId)
        }}
        userType={currentContext.user.userType as any}
        menuItems={navigation.menuItems}
        systemHealth={adminState.systemHealth}
        notifications={adminState.notifications}
        onLogout={() => performLogout(navigate, '/', '조직 관리자')}
      />
      
      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 헤더 */}
        <UnifiedAdminHeader
          currentSectionTitle={navigation.currentSectionTitle}
          searchQuery={adminState.searchQuery}
          onSearchChange={adminState.setSearchQuery}
          userInfo={userInfo}
          onLogout={() => performLogout(navigate, '/', '조직 관리자 (헤더)')}
        />
        
        {/* 콘텐츠 영역 */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <OrganizationAdminContentRenderer
            activeMenu={navigation.activeMenu}
            searchQuery={adminState.searchQuery}
            onNavigate={navigation.navigateToMenu}
          />
        </main>
      </div>
    </div>
  )
}