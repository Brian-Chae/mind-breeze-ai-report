/**
 * 권한 시스템 마이그레이션 가이드
 * 
 * 기존 string 기반 권한에서 새로운 Permission enum으로 마이그레이션하는 매핑
 */

import { Permission } from '../types/AdminTypes'

// 기존 권한 문자열을 새로운 Permission enum으로 매핑
export const PERMISSION_MIGRATION_MAP: Record<string, Permission> = {
  // 시스템 관리 권한
  'system.manage': Permission.SYSTEM_ADMIN,
  'system.monitor': Permission.VIEW_ANALYTICS,
  'system.analytics': Permission.VIEW_ANALYTICS,
  
  // 조직 관리 권한
  'organization.manage': Permission.WRITE_ORGANIZATIONS,
  'organization.view': Permission.READ_ORGANIZATIONS,
  
  // 사용자 관리 권한
  'users.manage': Permission.WRITE_USERS,
  'users.view': Permission.READ_USERS,
  
  // 디바이스 관리 권한
  'devices.manage': Permission.WRITE_DEVICES,
  'devices.view': Permission.READ_DEVICES,
  
  // 리포트 관리 권한
  'reports.manage': Permission.WRITE_REPORTS,
  'reports.view': Permission.READ_REPORTS,
  
  // 크레딧 관리 권한
  'credits.manage': Permission.MANAGE_CREDITS,
  'credits.view': Permission.READ_CREDITS,
}

/**
 * 기존 권한 문자열을 새로운 Permission enum으로 변환
 */
export function migratePermission(oldPermission: string): Permission | null {
  return PERMISSION_MIGRATION_MAP[oldPermission] || null
}

/**
 * 기존 권한 배열을 새로운 Permission enum 배열로 변환
 */
export function migratePermissions(oldPermissions: string[]): Permission[] {
  return oldPermissions
    .map(migratePermission)
    .filter((p): p is Permission => p !== null)
}

/**
 * 메뉴 아이템의 권한을 마이그레이션
 */
export function migrateMenuItemPermissions(menuItem: any): any {
  if (!menuItem.permissions) return menuItem
  
  return {
    ...menuItem,
    permissions: migratePermissions(menuItem.permissions),
    children: menuItem.children?.map(migrateMenuItemPermissions)
  }
}

/**
 * 역방향 매핑 - 새로운 Permission을 기존 문자열로 변환 (호환성을 위해)
 */
export const PERMISSION_REVERSE_MAP: Record<Permission, string[]> = {
  // System level permissions
  [Permission.MANAGE_SYSTEM]: ['system.manage'],
  [Permission.VIEW_ALL_ORGANIZATIONS]: ['system.organizations'],
  [Permission.MANAGE_ALL_ORGANIZATIONS]: ['system.organizations.manage'],
  [Permission.VIEW_ALL_USERS]: ['system.users'],
  [Permission.MANAGE_ALL_USERS]: ['system.users.manage'],
  [Permission.VIEW_ALL_DEVICES]: ['system.devices'],
  [Permission.MANAGE_ALL_DEVICES]: ['system.devices.manage'],
  [Permission.MANAGE_SYSTEM_CONFIG]: ['system.config'],
  [Permission.VIEW_SYSTEM_LOGS]: ['system.logs'],
  [Permission.MANAGE_API_KEYS]: ['system.api_keys'],
  [Permission.SYSTEM_ADMIN]: ['system.manage'],
  [Permission.VIEW_ANALYTICS]: ['system.monitor', 'system.analytics'],
  [Permission.VIEW_AUDIT_LOGS]: [],
  [Permission.MANAGE_SETTINGS]: [],
  
  // Organization level permissions
  [Permission.VIEW_ORGANIZATION]: ['organization.view'],
  [Permission.READ_ORGANIZATIONS]: ['organization.view'],
  [Permission.WRITE_ORGANIZATIONS]: ['organization.manage'],
  [Permission.DELETE_ORGANIZATIONS]: [],
  [Permission.MANAGE_ORGANIZATION]: ['organization.manage'],
  [Permission.MANAGE_ORGANIZATION_USERS]: ['organization.users'],
  [Permission.MANAGE_ORGANIZATION_DEVICES]: ['organization.devices'],
  [Permission.MANAGE_ORGANIZATION_CREDITS]: ['organization.credits'],
  [Permission.VIEW_ORGANIZATION_REPORTS]: ['organization.reports'],
  
  // User permissions
  [Permission.READ_USERS]: ['users.view'],
  [Permission.WRITE_USERS]: ['users.manage'],
  [Permission.DELETE_USERS]: [],
  [Permission.INVITE_USERS]: [],
  
  // Device permissions
  [Permission.READ_DEVICES]: ['devices.view'],
  [Permission.WRITE_DEVICES]: ['devices.manage'],
  [Permission.DELETE_DEVICES]: [],
  [Permission.ASSIGN_DEVICES]: [],
  [Permission.UNASSIGN_DEVICES]: [],
  
  // Report permissions
  [Permission.GENERATE_REPORTS]: ['reports.generate'],
  [Permission.VIEW_REPORTS]: ['reports.view'],
  [Permission.READ_REPORTS]: ['reports.view'],
  [Permission.WRITE_REPORTS]: ['reports.manage'],
  [Permission.SHARE_REPORTS]: ['reports.share'],
  [Permission.DELETE_REPORTS]: [],
  [Permission.EXPORT_REPORTS]: [],
  
  // Credit permissions
  [Permission.READ_CREDITS]: ['credits.view'],
  [Permission.MANAGE_CREDITS]: ['credits.manage'],
  [Permission.PURCHASE_CREDITS]: [],
}

/**
 * 새로운 Permission을 기존 문자열로 변환 (호환성 유지)
 */
export function reversePermission(permission: Permission): string[] {
  return PERMISSION_REVERSE_MAP[permission] || []
}