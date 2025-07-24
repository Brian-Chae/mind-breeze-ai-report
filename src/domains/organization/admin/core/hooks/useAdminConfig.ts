/**
 * 관리자 설정 Hook
 * 
 * 현재 사용자의 권한과 사용 가능한 기능을 제공합니다.
 * 사용자 타입에 따라 적절한 권한과 메뉴를 자동으로 설정합니다.
 */

import { useMemo, useCallback } from 'react'
import enterpriseAuthService from '../../../services/EnterpriseAuthService'
import { 
  UserType, 
  Permission, 
  AdminConfig, 
  MenuItem,
  PermissionCheck,
  DEFAULT_PERMISSIONS,
  RESTRICTED_FEATURES,
  FEATURE_PERMISSIONS,
  SystemRole
} from '../types/AdminTypes'

// 사용자 타입별 메뉴 import
import { 
  systemAdminMenuItems, 
  organizationAdminMenuItems, 
  organizationMemberMenuItems 
} from '../../components/UnifiedAdmin/utils/menu-config'

export function useAdminConfig(): AdminConfig & { 
  hasPermission: PermissionCheck,
  canAccessFeature: (feature: string) => boolean
} {
  const currentContext = enterpriseAuthService.getCurrentContext()
  
  // 현재 사용자의 권한 설정 계산
  const config = useMemo<AdminConfig>(() => {
    const userType = currentContext.user?.userType
    
    if (!userType) {
      
      // 기본값 반환 (권한 없음)
      return {
        userType: UserType.ORGANIZATION_MEMBER,
        permissions: [],
        availableMenus: [],
        restrictedFeatures: Object.keys(FEATURE_PERMISSIONS),
        organizationId: currentContext.organization?.id,
        organizationName: currentContext.organization?.name
      }
    }
    
    // 메뉴 결정
    let availableMenus: MenuItem[] = []
    switch (userType) {
      case UserType.SYSTEM_ADMIN:
        availableMenus = systemAdminMenuItems
        break
      case UserType.ORGANIZATION_ADMIN:
        availableMenus = organizationAdminMenuItems
        break
      case UserType.ORGANIZATION_MEMBER:
        availableMenus = organizationMemberMenuItems
        break
      default:
        availableMenus = []
    }
    
    // 권한 할당
    const permissions = (() => {
      switch (userType) {
        case UserType.SYSTEM_ADMIN:
          return DEFAULT_PERMISSIONS[SystemRole.SYSTEM_ADMIN] || []
        case UserType.ORGANIZATION_ADMIN:
          return DEFAULT_PERMISSIONS[SystemRole.ORGANIZATION_ADMIN] || []
        case UserType.ORGANIZATION_MEMBER:
          return DEFAULT_PERMISSIONS[SystemRole.ORGANIZATION_MEMBER] || []
        default:
          return []
      }
    })()
    
    // 제한된 기능
    const restrictedFeatures = (() => {
      const allFeatures = Object.keys(FEATURE_PERMISSIONS)
      switch (userType) {
        case UserType.SYSTEM_ADMIN:
          return [] // 시스템 관리자는 모든 기능 접근 가능
        case UserType.ORGANIZATION_ADMIN:
          return allFeatures.filter(feature => !['organizations', 'users', 'devices', 'reports', 'credits'].includes(feature))
        case UserType.ORGANIZATION_MEMBER:
          return allFeatures.filter(feature => !['reports'].includes(feature))
        default:
          return allFeatures // 기본적으로 모든 기능 제한
      }
    })()
    
    
    return {
      userType: userType as UserType,
      permissions,
      availableMenus,
      restrictedFeatures,
      organizationId: currentContext.organization?.id,
      organizationName: currentContext.organization?.name
    }
  }, [currentContext.user?.userType, currentContext.organization])
  
  // 권한 체크 함수
  const hasPermission = useCallback<PermissionCheck>((permission) => {
    const requiredPermissions = Array.isArray(permission) ? permission : [permission]
    const hasAllPermissions = requiredPermissions.every(p => config.permissions.includes(p))
    
    if (!hasAllPermissions) {
    }
    
    return hasAllPermissions
  }, [config.permissions, config.userType])
  
  // 기능 접근 가능 여부 체크
  const canAccessFeature = useCallback((feature: string) => {
    // 제한된 기능인지 체크
    if (config.restrictedFeatures && config.restrictedFeatures.includes(feature)) {
      return false
    }
    
    // 필요한 권한이 있는지 체크
    const requiredPermissions = FEATURE_PERMISSIONS[feature]
    if (requiredPermissions) {
      return hasPermission(requiredPermissions)
    }
    
    // 특별히 정의된 권한이 없으면 허용
    return true
  }, [config.restrictedFeatures, config.userType, hasPermission])
  
  return {
    ...config,
    hasPermission,
    canAccessFeature
  }
}

// 권한 체크를 위한 편의 hooks
export function usePermission(permission: Permission | Permission[]): boolean {
  const { hasPermission } = useAdminConfig()
  return hasPermission(permission)
}

export function useFeatureAccess(feature: string): boolean {
  const { canAccessFeature } = useAdminConfig()
  return canAccessFeature(feature)
}