import { useMemo } from 'react'
import { AdminPermissionsHook, UnifiedMenuItem } from '../types/unified-admin'
import { useAdminConfig } from '../../../admin/core/hooks/useAdminConfig'
import { Permission } from '../../../admin/core/types/AdminTypes'

/**
 * 관리자 권한 관리 훅
 * 사용자의 권한을 확인하고 메뉴를 필터링하는 기능 제공
 * 
 * @deprecated 새로운 useAdminConfig 훅을 사용하세요
 * 하위 호환성을 위해 유지되며, 내부적으로 새로운 Permission 시스템을 사용합니다
 */
export const useAdminPermissions = (): AdminPermissionsHook => {
  const adminConfig = useAdminConfig()
  
  
  // 기존 string 권한을 새로운 Permission enum으로 매핑
  const stringToPermissionMap: Record<string, Permission> = useMemo(() => ({
    'system.manage': Permission.SYSTEM_ADMIN,
    'system.monitor': Permission.SYSTEM_ADMIN,
    'system.analytics': Permission.VIEW_ANALYTICS,
    'organization.manage': Permission.WRITE_ORGANIZATIONS,
    'organization.view': Permission.READ_ORGANIZATIONS,
    'users.manage': Permission.WRITE_USERS,
    'users.view': Permission.READ_USERS,
    'devices.manage': Permission.WRITE_DEVICES,
    'devices.view': Permission.READ_DEVICES,
    'reports.manage': Permission.WRITE_REPORTS,
    'reports.view': Permission.READ_REPORTS,
    'credits.manage': Permission.MANAGE_CREDITS,
    'credits.view': Permission.READ_CREDITS,
  }), [])

  /**
   * 특정 권한을 보유하고 있는지 확인
   */
  const hasPermission = (permission: string): boolean => {
    const mappedPermission = stringToPermissionMap[permission]
    if (!mappedPermission) {
        metadata: { permission } 
      return false
    }
    
    return adminConfig.hasPermission(mappedPermission)
  }

  /**
   * 여러 권한 중 하나라도 보유하고 있는지 확인
   */
  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission))
  }

  /**
   * 권한에 따른 메뉴 필터링
   */
  const filterMenuByPermissions = (menu: UnifiedMenuItem[]): UnifiedMenuItem[] => {
    return menu.filter(item => {
      // 메뉴 아이템에 권한 정보가 없으면 표시
      if (!item.permissions || item.permissions.length === 0) {
        return true
      }
      
      // 메뉴 아이템의 권한 중 하나라도 보유하고 있으면 표시
      return hasAnyPermission(item.permissions)
    })
  }

  return {
    hasPermission,
    hasAnyPermission,
    filterMenuByPermissions
  }
}

export default useAdminPermissions