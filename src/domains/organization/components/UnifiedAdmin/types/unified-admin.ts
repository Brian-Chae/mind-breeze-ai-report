/**
 * 통합 관리자 앱을 위한 타입 정의
 */

import { LucideIcon } from 'lucide-react'

// 사용자 역할 타입
export type AdminUserType = 
  | 'SYSTEM_ADMIN'
  | 'ORGANIZATION_ADMIN'
  | 'ORGANIZATION_MEMBER'

// 권한 타입
export type AdminPermission = 
  // 시스템 관리 권한
  | 'system.manage'
  | 'system.monitor'
  | 'system.analytics'
  // 조직 관리 권한
  | 'organization.manage'
  | 'organization.view'
  // 사용자 관리 권한
  | 'users.manage'
  | 'users.view'
  // 디바이스 관리 권한
  | 'devices.manage'
  | 'devices.view'
  // 리포트 관리 권한
  | 'reports.manage'
  | 'reports.view'
  // 크레딧 관리 권한
  | 'credits.manage'
  | 'credits.view'

// 메뉴 아이템 인터페이스
export interface UnifiedMenuItem {
  id: string
  title: string
  icon: LucideIcon
  path: string
  component: string
  permissions: AdminPermission[]
  badge?: number | string
  badgeVariant?: 'default' | 'destructive' | 'outline' | 'secondary'
  description?: string
  children?: UnifiedMenuItem[]
}

// 사이드바 프롭스
export interface UnifiedAdminSidebarProps {
  activeMenu: string
  onMenuChange: (menuId: string) => void
  userType: AdminUserType
  systemHealth?: 'healthy' | 'warning' | 'error'
  notifications?: Record<string, number>
  onLogout?: () => void
}

// 헤더 프롭스
export interface UnifiedAdminHeaderProps {
  currentSectionTitle: string
  searchQuery: string
  onSearchChange: (query: string) => void
  onLogout?: () => void
  userInfo?: {
    displayName?: string
    email?: string
    userType: AdminUserType
    organizationName?: string
  }
}

// 콘텐츠 렌더러 프롭스
export interface UnifiedContentRendererProps {
  activeMenu: string
  userType: AdminUserType
  searchQuery?: string
  onNavigate?: (menuId: string, subMenuId?: string) => void
}

// 관리자 앱 메인 프롭스
export interface UnifiedAdminAppProps {
  onLogout?: () => void
}

// 권한 관리 훅 반환 타입
export interface AdminPermissionsHook {
  hasPermission: (permission: AdminPermission) => boolean
  hasAnyPermission: (permissions: AdminPermission[]) => boolean
  filterMenuByPermissions: (menu: UnifiedMenuItem[]) => UnifiedMenuItem[]
}

// 네비게이션 훅 반환 타입
export interface AdminNavigationHook {
  activeMenu: string
  setActiveMenu: (menuId: string) => void
  currentSectionTitle: string
  getCurrentPath: () => string
  navigateToMenu: (menuId: string, subMenuId?: string) => void
}

// 통합 상태 타입
export interface UnifiedAdminState {
  activeMenu: string
  searchQuery: string
  systemHealth: 'healthy' | 'warning' | 'error'
  notifications: Record<string, number>
  isLoading: boolean
  error?: string
}

// 알림 타입
export interface AdminNotification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  timestamp: Date
  read: boolean
  actions?: {
    label: string
    action: () => void
  }[]
}