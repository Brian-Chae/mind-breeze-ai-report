import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { organizationAdminMenuItems, organizationMemberMenuItems } from '../config/organization-admin-menu'
import enterpriseAuthService from '../../../services/EnterpriseAuthService'

export default function useOrganizationAdminNavigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const currentContext = enterpriseAuthService.getCurrentContext()

  // 사용자 타입에 따른 메뉴 아이템 선택
  const menuItems = currentContext.user?.userType === 'ORGANIZATION_ADMIN' 
    ? organizationAdminMenuItems 
    : organizationMemberMenuItems

  // URL 경로에서 활성 메뉴 추출
  useEffect(() => {
    const pathSegments = location.pathname.split('/')
    const menuSegment = pathSegments[2] // /org-admin/[menuSegment]
    
    if (menuSegment) {
      setActiveMenu(menuSegment)
    }
  }, [location.pathname])

  // 메뉴로 이동
  const navigateToMenu = (menuId: string) => {
    const menuItem = menuItems.find(item => item.id === menuId)
    if (menuItem) {
      navigate(menuItem.path)
    }
  }

  // 현재 섹션 제목 가져오기
  const currentSectionTitle = menuItems.find(
    item => item.id === activeMenu
  )?.title || '조직 관리'

  return {
    activeMenu,
    setActiveMenu,
    navigateToMenu,
    currentSectionTitle,
    menuItems
  }
}