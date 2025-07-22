import {
  LayoutDashboard,
  Building2,
  Users,
  Smartphone,
  Brain,
  CreditCard,
} from 'lucide-react'

import { UnifiedMenuItem } from '../../UnifiedAdmin/types/unified-admin'

/**
 * 조직 관리자 전용 메뉴 설정
 */
export const organizationAdminMenuItems: UnifiedMenuItem[] = [
  {
    id: 'dashboard',
    title: '대시보드',
    icon: LayoutDashboard,
    path: '/org-admin/dashboard',
    component: 'OrganizationDashboardContent',
    permissions: ['organization.view'],
    description: '조직 현황 요약'
  },
  {
    id: 'organization',
    title: '기업관리',
    icon: Building2,
    path: '/org-admin/organization',
    component: 'OrganizationManagementContent',
    permissions: ['organization.manage'],
    description: '기업 정보 및 조직 구조'
  },
  {
    id: 'users',
    title: '사용자관리',
    icon: Users,
    path: '/org-admin/users',
    component: 'OrganizationUserManagementContent',
    permissions: ['users.manage'],
    description: '조직 내 사용자 관리'
  },
  {
    id: 'devices',
    title: '디바이스관리',
    icon: Smartphone,
    path: '/org-admin/devices',
    component: 'OrganizationDeviceManagementContent',
    permissions: ['devices.manage'],
    description: '디바이스 배치 및 모니터링'
  },
  {
    id: 'ai-reports',
    title: 'AI 리포트',
    icon: Brain,
    path: '/org-admin/ai-reports',
    component: 'AIReportManagementContent',
    permissions: ['reports.manage'],
    description: '리포트 생성 및 관리'
  },
  {
    id: 'credits',
    title: '크레딧관리',
    icon: CreditCard,
    path: '/org-admin/credits',
    component: 'OrganizationCreditManagementContent',
    permissions: ['credits.view'],
    description: '크레딧 현황 및 구매'
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
    path: '/org-admin/dashboard',
    component: 'MemberDashboardContent',
    permissions: ['organization.view'],
    description: '내 활동 현황'
  },
  {
    id: 'users',
    title: '사용자관리',
    icon: Users,
    path: '/org-admin/users',
    component: 'MemberUserManagementContent',
    permissions: ['users.view'],
    description: '담당 사용자 관리'
  },
  {
    id: 'ai-reports',
    title: 'AI 리포트',
    icon: Brain,
    path: '/org-admin/ai-reports',
    component: 'MemberAIReportContent',
    permissions: ['reports.view'],
    description: '리포트 조회'
  }
]