/**
 * 시스템 관리자 전용 앱
 * 
 * /system-admin/* 경로로 접근하는 시스템 관리자를 위한 전용 인터페이스
 */

import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import enterpriseAuthService from '../../services/EnterpriseAuthService'
import { performLogout } from '../../utils/auth-utils'

// 통합 컴포넌트들 임포트 (기존 UnifiedAdmin 재사용)
import UnifiedAdminSidebar from '../UnifiedAdmin/components/UnifiedAdminSidebar'
import UnifiedAdminHeader from '../UnifiedAdmin/components/UnifiedAdminHeader'
import SystemAdminContentRenderer from './components/SystemAdminContentRenderer'

// 훅들 임포트
import useSystemAdminNavigation from './hooks/useSystemAdminNavigation'
import useAdminPermissions from '../UnifiedAdmin/hooks/useAdminPermissions'
import useUnifiedAdminState from '../UnifiedAdmin/hooks/useUnifiedAdminState'

export default function SystemAdminApp() {
  const location = useLocation()
  const navigate = useNavigate()
  const currentContext = enterpriseAuthService.getCurrentContext()

  // 훅들
  const navigation = useSystemAdminNavigation()
  const permissions = useAdminPermissions()
  const adminState = useUnifiedAdminState()

  // URL이 /system-admin으로만 되어있으면 /system-admin/dashboard로 리디렉션
  useEffect(() => {
    if (location.pathname === '/system-admin') {
      navigate('/system-admin/dashboard', { replace: true })
    }
  }, [location.pathname, navigate])

  // 시스템 관리자가 아니면 접근 거부
  if (currentContext.user?.userType !== 'SYSTEM_ADMIN') {
    return (
      <div className="h-screen flex bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-600 mb-2">접근 권한 없음</h3>
            <p className="text-gray-600">시스템 관리자만 접근할 수 있습니다.</p>
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
    userType: 'SYSTEM_ADMIN' as const,
    organizationName: undefined
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* 시스템 관리자 전용 사이드바 */}
      <UnifiedAdminSidebar
        activeMenu={navigation.activeMenu}
        onMenuChange={(menuId) => {
          navigation.setActiveMenu(menuId)
          navigation.navigateToMenu(menuId)
        }}
        userType="SYSTEM_ADMIN"
        menuItems={navigation.menuItems}
        systemHealth={adminState.systemHealth}
        notifications={adminState.notifications}
        onLogout={() => performLogout(navigate, '/', '시스템 관리자')}
      />
      
      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 헤더 */}
        <UnifiedAdminHeader
          currentSectionTitle={navigation.currentSectionTitle}
          searchQuery={adminState.searchQuery}
          onSearchChange={adminState.setSearchQuery}
          userInfo={userInfo}
          onLogout={() => performLogout(navigate, '/', '시스템 관리자 (헤더)')}
        />
        
        {/* 콘텐츠 영역 */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <SystemAdminContentRenderer
            activeMenu={navigation.activeMenu}
            searchQuery={adminState.searchQuery}
            onNavigate={navigation.navigateToMenu}
          />
        </main>
      </div>
    </div>
  )
}