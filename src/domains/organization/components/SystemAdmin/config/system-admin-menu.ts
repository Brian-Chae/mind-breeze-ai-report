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
} from 'lucide-react'

import { UnifiedMenuItem } from '../../UnifiedAdmin/types/unified-admin'

/**
 * 시스템 관리자 전용 메뉴 설정
 */
export const systemAdminMenuItems: UnifiedMenuItem[] = [
  {
    id: 'dashboard',
    title: '대시보드',
    icon: LayoutDashboard,
    path: '/system-admin/dashboard',
    component: 'SystemDashboardContent',
    permissions: ['system.manage'],
    description: '전체 시스템 현황'
  },
  {
    id: 'enterprises',
    title: '기업관리',
    icon: Building2,
    path: '/system-admin/enterprises',
    component: 'EnterpriseManagementContent',
    permissions: ['organization.manage'],
    description: '기업 현황 및 관리'
  },
  {
    id: 'devices',
    title: '디바이스관리',
    icon: Smartphone,
    path: '/system-admin/devices',
    component: 'DeviceManagementContent',
    permissions: ['devices.manage'],
    description: 'LINK BAND 디바이스 관리'
  },
  {
    id: 'users',
    title: '사용자관리',
    icon: Users,
    path: '/system-admin/users',
    component: 'UserManagementContent',
    permissions: ['users.manage'],
    description: '전체 사용자 관리'
  },
  {
    id: 'reports',
    title: '리포트관리',
    icon: FileText,
    path: '/system-admin/reports',
    component: 'ReportManagementContent',
    permissions: ['reports.manage'],
    description: 'AI 리포트 현황'
  },
  {
    id: 'measurements',
    title: '측정데이터관리',
    icon: Database,
    path: '/system-admin/measurements',
    component: 'MeasurementDataContent',
    permissions: ['system.manage'],
    description: '측정 데이터 현황'
  },
  {
    id: 'credits',
    title: '크래딧관리',
    icon: CreditCard,
    path: '/system-admin/credits',
    component: 'CreditManagementContent',
    permissions: ['credits.manage'],
    description: '기업별 크레딧 현황'
  },
  {
    id: 'analytics',
    title: '사용량 분석',
    icon: BarChart3,
    path: '/system-admin/analytics',
    component: 'SystemAnalyticsContent',
    permissions: ['system.analytics'],
    description: '상세 분석 및 인사이트'
  },
  {
    id: 'monitoring',
    title: '시스템 모니터링',
    icon: Monitor,
    path: '/system-admin/monitoring',
    component: 'SystemMonitoringContent',
    permissions: ['system.monitor'],
    description: '실시간 시스템 상태',
    badgeVariant: 'secondary'
  }
]