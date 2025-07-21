import { useState, useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AdminNavigationHook } from '../types/unified-admin'
import { findMenuItemById } from '../utils/menu-config'
import enterpriseAuthService from '../../../services/EnterpriseAuthService'

/**
 * 관리자 네비게이션 관리 훅
 * 현재 활성 메뉴와 네비게이션 상태를 관리
 */
export const useAdminNavigation = (): AdminNavigationHook => {
  const location = useLocation()
  const navigate = useNavigate()
  const currentContext = enterpriseAuthService.getCurrentContext()

  // URL에서 현재 활성 메뉴 추출
  const getCurrentMenuFromURL = useCallback(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    if (pathSegments.length >= 2) {
      // /admin/ai-reports -> ai-reports
      return pathSegments[1]
    }
    return 'dashboard'
  }, [location.pathname])

  const [activeMenu, setActiveMenuState] = useState<string>(getCurrentMenuFromURL())

  // 활성 메뉴 변경
  const setActiveMenu = useCallback((menuId: string) => {
    setActiveMenuState(menuId)
  }, [])

  // 현재 섹션 제목 계산
  const currentSectionTitle = useMemo(() => {
    if (!currentContext.user) return '관리자 대시보드'
    
    const userType = currentContext.user.userType
    const menuItem = findMenuItemById(activeMenu, userType)
    
    if (menuItem) {
      return menuItem.title
    }
    
    // 기본 제목
    switch (userType) {
      case 'SYSTEM_ADMIN':
        return '시스템 관리자 대시보드'
      case 'ORGANIZATION_ADMIN':
        return '기업 관리자 대시보드'
      case 'ORGANIZATION_MEMBER':
        return '구성원 대시보드'
      default:
        return '관리자 대시보드'
    }
  }, [activeMenu, currentContext.user])

  // 현재 경로 가져오기
  const getCurrentPath = useCallback(() => {
    return location.pathname
  }, [location.pathname])

  // 메뉴로 네비게이션
  const navigateToMenu = useCallback((menuId: string, subMenuId?: string) => {
    setActiveMenu(menuId)
    
    if (subMenuId) {
      navigate(`/admin/${menuId}/${subMenuId}`)
    } else {
      navigate(`/admin/${menuId}`)
    }
  }, [navigate, setActiveMenu])

  // URL 변경 시 활성 메뉴 동기화
  useState(() => {
    const currentMenu = getCurrentMenuFromURL()
    if (currentMenu !== activeMenu) {
      setActiveMenuState(currentMenu)
    }
  })

  return {
    activeMenu,
    setActiveMenu,
    currentSectionTitle,
    getCurrentPath,
    navigateToMenu
  }
}

export default useAdminNavigation