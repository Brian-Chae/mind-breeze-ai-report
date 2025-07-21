import { useMemo } from 'react'
import { AdminPermissionsHook, AdminPermission, UnifiedMenuItem, AdminUserType } from '../types/unified-admin'
import enterpriseAuthService from '../../../services/EnterpriseAuthService'

/**
 * 관리자 권한 관리 훅
 * 사용자의 권한을 확인하고 메뉴를 필터링하는 기능 제공
 */
export const useAdminPermissions = (): AdminPermissionsHook => {
  // 현재 사용자 컨텍스트 가져오기
  const currentContext = enterpriseAuthService.getCurrentContext()
  
  // 사용자 권한 목록
  const userPermissions = useMemo(() => {
    if (!currentContext.user) return []
    
    // 사용자 타입에 따른 기본 권한 매핑
    const userType = currentContext.user.userType as AdminUserType
    return getUserPermissionsByType(userType)
  }, [currentContext.user])

  /**
   * 특정 권한을 보유하고 있는지 확인
   */
  const hasPermission = (permission: AdminPermission): boolean => {
    if (!currentContext.user) return false
    
    // 시스템 관리자는 모든 권한 보유
    if (currentContext.user.userType === 'SYSTEM_ADMIN') {
      return true
    }
    
    return userPermissions.includes(permission)
  }

  /**
   * 여러 권한 중 하나라도 보유하고 있는지 확인
   */
  const hasAnyPermission = (permissions: AdminPermission[]): boolean => {
    if (!currentContext.user) return false
    
    // 시스템 관리자는 모든 권한 보유
    if (currentContext.user.userType === 'SYSTEM_ADMIN') {
      return true
    }
    
    return permissions.some(permission => userPermissions.includes(permission))
  }

  /**
   * 권한에 따른 메뉴 필터링
   */
  const filterMenuByPermissions = (menu: UnifiedMenuItem[]): UnifiedMenuItem[] => {
    if (!currentContext.user) return []
    
    // 시스템 관리자는 모든 메뉴 접근 가능
    if (currentContext.user.userType === 'SYSTEM_ADMIN') {
      return menu
    }
    
    return menu.filter(item => {
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

/**
 * 사용자 타입별 권한 매핑
 */
const getUserPermissionsByType = (userType: AdminUserType): AdminPermission[] => {
  switch (userType) {
    case 'SYSTEM_ADMIN':
      // 시스템 관리자는 모든 권한 보유
      return [
        'system.manage',
        'system.monitor',
        'system.analytics',
        'organization.manage',
        'organization.view',
        'users.manage',
        'users.view',
        'devices.manage',
        'devices.view',
        'reports.manage',
        'reports.view',
        'credits.manage',
        'credits.view'
      ]
    
    case 'ORGANIZATION_ADMIN':
      // 조직 관리자는 조직 관련 권한 보유
      return [
        'organization.manage',
        'organization.view',
        'users.manage',
        'users.view',
        'devices.manage',
        'devices.view',
        'reports.manage',
        'reports.view',
        'credits.view'
      ]
    
    case 'ORGANIZATION_MEMBER':
      // 조직 구성원은 제한적 권한 보유
      return [
        'organization.view',
        'users.view',
        'devices.view',
        'reports.view'
      ]
    
    default:
      return []
  }
}

export default useAdminPermissions