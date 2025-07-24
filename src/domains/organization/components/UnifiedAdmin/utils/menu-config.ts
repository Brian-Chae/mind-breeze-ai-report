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

import { UnifiedMenuItem, AdminUserType } from '../types/unified-admin'

/**
 * 시스템 관리자 메뉴 설정
 */
export const systemAdminMenuItems: UnifiedMenuItem[] = [
  {
    id: 'dashboard',
    title: '대시보드',
    icon: LayoutDashboard,
    path: '/admin/dashboard',
    component: 'SystemDashboardContent',
    permissions: ['system.manage'],
    description: '전체 시스템 현황'
  },
  {
    id: 'enterprises',
    title: '기업관리',
    icon: Building2,
    path: '/admin/enterprises',
    component: 'EnterpriseManagementContent',
    permissions: ['organization.manage'],
    description: '기업 현황 및 관리'
  },
  {
    id: 'devices',
    title: '디바이스관리',
    icon: Smartphone,
    path: '/admin/devices',
    component: 'DeviceManagementContent',
    permissions: ['devices.manage'],
    description: 'LINK BAND 디바이스 관리'
  },
  {
    id: 'users',
    title: '사용자관리',
    icon: Users,
    path: '/admin/users',
    component: 'UserManagementContent',
    permissions: ['users.manage'],
    description: '전체 사용자 관리'
  },
  {
    id: 'reports',
    title: '리포트관리',
    icon: FileText,
    path: '/admin/reports',
    component: 'ReportManagementContent',
    permissions: ['reports.manage'],
    description: 'AI 리포트 현황'
  },
  {
    id: 'measurements',
    title: '측정데이터관리',
    icon: Database,
    path: '/admin/measurements',
    component: 'MeasurementDataContent',
    permissions: ['system.manage'],
    description: '측정 데이터 현황'
  },
  {
    id: 'credits',
    title: '크래딧관리',
    icon: CreditCard,
    path: '/admin/credits',
    component: 'CreditManagementContent',
    permissions: ['credits.manage'],
    description: '기업별 크레딧 현황'
  },
  {
    id: 'analytics',
    title: '사용량 분석',
    icon: BarChart3,
    path: '/admin/analytics',
    component: 'SystemAnalyticsContent',
    permissions: ['system.analytics'],
    description: '상세 분석 및 인사이트'
  },
  {
    id: 'monitoring',
    title: '시스템 모니터링',
    icon: Monitor,
    path: '/admin/monitoring',
    component: 'SystemMonitoringContent',
    permissions: ['system.monitor'],
    description: '실시간 시스템 상태',
    badgeVariant: 'secondary'
  }
]

/**
 * 조직 관리자 메뉴 설정
 */
export const organizationAdminMenuItems: UnifiedMenuItem[] = [
  {
    id: 'dashboard',
    title: '대시보드',
    icon: LayoutDashboard,
    path: '/admin/dashboard',
    component: 'OrganizationDashboardContent',
    permissions: ['organization.view'],
    description: '조직 현황 요약'
  },
  {
    id: 'ai-reports',
    title: 'AI 리포트',
    icon: Brain,
    path: '/admin/ai-reports',
    component: 'AIReportManagementContent',
    permissions: ['reports.manage'],
    description: '리포트 생성 및 관리'
  },
  {
    id: 'organization',
    title: '기업관리',
    icon: Building2,
    path: '/admin/organization',
    component: 'OrganizationManagementContent',
    permissions: ['organization.manage'],
    description: '기업 정보 및 조직 구조'
  },
  {
    id: 'devices',
    title: '디바이스관리',
    icon: Smartphone,
    path: '/admin/devices',
    component: 'OrganizationDeviceManagementContent',
    permissions: ['devices.manage'],
    description: '디바이스 배치 및 모니터링'
  },
  {
    id: 'credits',
    title: '크레딧관리',
    icon: CreditCard,
    path: '/admin/credits',
    component: 'OrganizationCreditManagementContent',
    permissions: ['credits.view'],
    description: '크레딧 현황 및 구매'
  },
  {
    id: 'users',
    title: '사용자관리',
    icon: Users,
    path: '/admin/users',
    component: 'OrganizationUserManagementContent',
    permissions: ['users.manage'],
    description: '조직 내 사용자 관리'
  }
]

/**
 * 조직 구성원 메뉴 설정 (제한적 접근)
 */
export const organizationMemberMenuItems: UnifiedMenuItem[] = [
  {
    id: 'dashboard',
    title: '대시보드',
    icon: LayoutDashboard,
    path: '/admin/dashboard',
    component: 'MemberDashboardContent',
    permissions: ['organization.view'],
    description: '내 활동 현황'
  },
  {
    id: 'users',
    title: '사용자관리',
    icon: Users,
    path: '/admin/users',
    component: 'MemberUserManagementContent',
    permissions: ['users.view'],
    description: '담당 사용자 관리'
  },
  {
    id: 'ai-reports',
    title: 'AI 리포트',
    icon: Brain,
    path: '/admin/ai-reports',
    component: 'MemberAIReportContent',
    permissions: ['reports.view'],
    description: '리포트 조회'
  }
]

/**
 * 사용자 타입에 따른 메뉴 항목 반환
 */
export const getMenuItemsByUserType = (userType: AdminUserType): UnifiedMenuItem[] => {
  switch (userType) {
    case 'SYSTEM_ADMIN':
      return systemAdminMenuItems
    case 'ORGANIZATION_ADMIN':
      return organizationAdminMenuItems
    case 'ORGANIZATION_MEMBER':
      return organizationMemberMenuItems
    default:
      return organizationMemberMenuItems
  }
}

/**
 * 메뉴 아이템을 ID로 찾기
 */
export const findMenuItemById = (menuId: string, userType: AdminUserType): UnifiedMenuItem | undefined => {
  const menuItems = getMenuItemsByUserType(userType)
  return menuItems.find(item => item.id === menuId)
}

/**
 * 권한에 따른 메뉴 필터링 (추후 Phase 1.3에서 구현)
 */
export const filterMenuByPermissions = (
  menuItems: UnifiedMenuItem[], 
  userPermissions: string[]
): UnifiedMenuItem[] => {
  // 현재는 모든 메뉴 반환, 추후 권한 체크 로직 구현
  return menuItems
}