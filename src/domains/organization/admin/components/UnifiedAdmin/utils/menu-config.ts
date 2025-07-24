import {
  LayoutDashboard,
  BarChart3,
  Monitor,
  CreditCard,
  Building2,
  Smartphone,
  FileText,
  Database,
  Users,
  Settings,
  Building,
  User,
  Brain,
  TrendingUp,
  Activity,
  Shield
} from 'lucide-react'

import { MenuItem, Permission } from '../../../core/types/AdminTypes'

/**
 * 시스템 관리자 메뉴 설정
 */
export const systemAdminMenuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: '대시보드',
    title: '대시보드',
    icon: LayoutDashboard,
    path: '/admin/dashboard',
    permissions: [Permission.READ_ORGANIZATIONS],
  },
  {
    id: 'enterprises',
    label: '기업관리',
    title: '기업관리',
    icon: Building2,
    path: '/admin/enterprises',
    permissions: [Permission.WRITE_ORGANIZATIONS],
  },
  {
    id: 'devices',
    label: '디바이스관리',
    title: '디바이스관리',
    icon: Smartphone,
    path: '/admin/devices',
    permissions: [Permission.WRITE_DEVICES],
  },
  {
    id: 'users',
    label: '사용자관리',
    title: '사용자관리',
    icon: Users,
    path: '/admin/users',
    permissions: [Permission.WRITE_USERS],
  },
  {
    id: 'reports',
    label: '리포트관리',
    title: '리포트관리',
    icon: FileText,
    path: '/admin/reports',
    permissions: [Permission.WRITE_REPORTS],
  },
  {
    id: 'measurements',
    label: '측정데이터관리',
    title: '측정데이터관리',
    icon: Database,
    path: '/admin/measurements',
    permissions: [Permission.SYSTEM_ADMIN],
  },
  {
    id: 'credits',
    label: '크래딧관리',
    title: '크래딧관리',
    icon: CreditCard,
    path: '/admin/credits',
    permissions: [Permission.MANAGE_CREDITS],
  },
  {
    id: 'analytics',
    label: '사용량 분석',
    title: '사용량 분석',
    icon: BarChart3,
    path: '/admin/analytics',
    permissions: [Permission.VIEW_ANALYTICS],
  },
  {
    id: 'monitoring',
    label: '시스템 모니터링',
    title: '시스템 모니터링',
    icon: Monitor,
    path: '/admin/monitoring',
    permissions: [Permission.SYSTEM_ADMIN],
  }
]

/**
 * 조직 관리자 메뉴 설정
 */
export const organizationAdminMenuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: '대시보드',
    title: '대시보드',
    icon: LayoutDashboard,
    path: '/admin/dashboard',
    permissions: [Permission.READ_ORGANIZATIONS],
  },
  {
    id: 'ai-reports',
    label: 'AI 리포트',
    title: 'AI 리포트',
    icon: Brain,
    path: '/admin/ai-reports',
    permissions: [Permission.READ_REPORTS],
  },
  {
    id: 'organization',
    label: '기업관리',
    title: '기업관리',
    icon: Building2,
    path: '/admin/organization',
    permissions: [Permission.READ_ORGANIZATIONS],
  },
  {
    id: 'devices',
    label: '디바이스관리',
    title: '디바이스관리',
    icon: Smartphone,
    path: '/admin/devices',
    permissions: [Permission.READ_DEVICES],
  },
  {
    id: 'credits',
    label: '크레딧관리',
    title: '크레딧관리',
    icon: CreditCard,
    path: '/admin/credits',
    permissions: [Permission.READ_CREDITS],
  },
  {
    id: 'users',
    label: '사용자관리',
    title: '사용자관리',
    icon: Users,
    path: '/admin/users',
    permissions: [Permission.READ_USERS],
  }
]

/**
 * 조직 구성원 메뉴 설정 (제한적 접근)
 */
export const organizationMemberMenuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: '대시보드',
    title: '대시보드',
    icon: LayoutDashboard,
    path: '/admin/dashboard',
    permissions: [Permission.READ_ORGANIZATIONS],
  },
  {
    id: 'users',
    label: '사용자관리',
    title: '사용자관리',
    icon: Users,
    path: '/admin/users',
    permissions: [Permission.READ_USERS],
  },
  {
    id: 'ai-reports',
    label: 'AI 리포트',
    title: 'AI 리포트',
    icon: Brain,
    path: '/admin/ai-reports',
    permissions: [Permission.READ_REPORTS],
  }
]

/**
 * 메뉴 아이템을 ID로 찾기
 */
export const findMenuItemById = (menuId: string, menuItems: MenuItem[]): MenuItem | undefined => {
  return menuItems.find(item => item.id === menuId)
}

/**
 * 권한에 따른 메뉴 필터링
 */
export const filterMenuByPermissions = (
  menuItems: MenuItem[], 
  userPermissions: Permission[]
): MenuItem[] => {
  return menuItems.filter(item => {
    // 메뉴 아이템에 권한 정보가 없으면 표시
    if (!item.permissions || item.permissions.length === 0) {
      return true
    }
    
    // 메뉴 아이템의 권한 중 하나라도 보유하고 있으면 표시
    return item.permissions.some(permission => userPermissions.includes(permission))
  })
}