import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { systemAdminMenuItems } from '../config/system-admin-menu'

export default function useSystemAdminNavigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const [activeMenu, setActiveMenu] = useState('dashboard')

  // URL 경로에서 활성 메뉴 추출
  useEffect(() => {
    const pathSegments = location.pathname.split('/')
    const menuSegment = pathSegments[2] // /system-admin/[menuSegment]
    
    if (menuSegment) {
      setActiveMenu(menuSegment)
    }
  }, [location.pathname])

  // 메뉴로 이동
  const navigateToMenu = (menuId: string) => {
    const menuItem = systemAdminMenuItems.find(item => item.id === menuId)
    if (menuItem) {
      navigate(menuItem.path)
    }
  }

  // 현재 섹션 제목 가져오기
  const currentSectionTitle = systemAdminMenuItems.find(
    item => item.id === activeMenu
  )?.title || '시스템 관리'

  return {
    activeMenu,
    setActiveMenu,
    navigateToMenu,
    currentSectionTitle,
    menuItems: systemAdminMenuItems
  }
}