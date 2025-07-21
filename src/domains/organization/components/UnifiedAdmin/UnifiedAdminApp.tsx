import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { UnifiedAdminAppProps, AdminUserType } from './types/unified-admin'
import enterpriseAuthService from '../../services/EnterpriseAuthService'

// 통합 컴포넌트들 임포트
import UnifiedAdminSidebar from './components/UnifiedAdminSidebar'
import UnifiedAdminHeader from './components/UnifiedAdminHeader'
import UnifiedContentRenderer from './components/UnifiedContentRenderer'

// 훅들 임포트
import useAdminNavigation from './hooks/useAdminNavigation'
import useAdminPermissions from './hooks/useAdminPermissions'
import useUnifiedAdminState from './hooks/useUnifiedAdminState'

/**
 * 통합 관리자 앱 메인 컴포넌트
 * 시스템 관리자와 조직 관리자를 위한 통합된 인터페이스 제공
 */
export default function UnifiedAdminApp({ onLogout }: UnifiedAdminAppProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const currentContext = enterpriseAuthService.getCurrentContext()

  // 훅들
  const navigation = useAdminNavigation()
  const permissions = useAdminPermissions()
  const adminState = useUnifiedAdminState()

  // URL이 /admin으로만 되어있으면 /admin/dashboard로 리디렉션
  useEffect(() => {
    if (location.pathname === '/admin') {
      navigate('/admin/dashboard', { replace: true })
    }
  }, [location.pathname, navigate])

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

  const userType = currentContext.user.userType as AdminUserType
  const userInfo = {
    displayName: currentContext.user.displayName,
    email: currentContext.user.email,
    userType,
    organizationName: currentContext.organization?.name
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* 통합 사이드바 */}
      <UnifiedAdminSidebar
        activeMenu={navigation.activeMenu}
        onMenuChange={(menuId) => {
          navigation.setActiveMenu(menuId)
          navigation.navigateToMenu(menuId)
        }}
        userType={userType}
        systemHealth={adminState.systemHealth}
        notifications={adminState.notifications}
        onLogout={onLogout}
      />
      
      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 통합 헤더 */}
        <UnifiedAdminHeader
          currentSectionTitle={navigation.currentSectionTitle}
          searchQuery={adminState.searchQuery}
          onSearchChange={adminState.setSearchQuery}
          onLogout={onLogout}
          userInfo={userInfo}
        />

        {/* 통합 콘텐츠 렌더러 */}
        <UnifiedContentRenderer
          activeMenu={navigation.activeMenu}
          userType={userType}
          searchQuery={adminState.searchQuery}
          onNavigate={navigation.navigateToMenu}
        />
      </div>

      {/* 로딩 오버레이 */}
      {adminState.isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-900">데이터를 불러오는 중...</p>
          </div>
        </div>
      )}

      {/* 에러 메시지 */}
      {adminState.error && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          <p>{adminState.error}</p>
          <button 
            onClick={() => adminState.setError(undefined)}
            className="ml-4 text-red-200 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}