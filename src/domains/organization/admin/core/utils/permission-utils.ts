/**
 * 권한 관련 유틸리티 함수들
 * 
 * 권한 체크와 관련된 다양한 헬퍼 함수들을 제공합니다.
 */

import { UserType, Permission, FEATURE_PERMISSIONS, DEFAULT_PERMISSIONS, SystemRole } from '../types/AdminTypes'

/**
 * 사용자 타입에 해당하는 권한 목록을 반환
 */
export function getPermissionsForUserType(userType: UserType): Permission[] {
  switch (userType) {
    case 'SYSTEM_ADMIN':
      return DEFAULT_PERMISSIONS[SystemRole.SYSTEM_ADMIN] || []
    case 'ORGANIZATION_ADMIN':
      return DEFAULT_PERMISSIONS[SystemRole.ORGANIZATION_ADMIN] || []
    case 'ORGANIZATION_MEMBER':
      return DEFAULT_PERMISSIONS[SystemRole.ORGANIZATION_MEMBER] || []
    default:
      return []
  }
}

/**
 * 특정 기능에 필요한 권한 목록을 반환
 */
export function getRequiredPermissions(feature: string): Permission[] {
  return FEATURE_PERMISSIONS[feature] || []
}

/**
 * 권한 이름을 사람이 읽기 쉬운 형태로 변환
 */
export function getPermissionDisplayName(permission: Permission): string {
  const permissionNames: Record<Permission, string> = {
    // System level permissions
    [Permission.MANAGE_SYSTEM]: '시스템 관리',
    [Permission.VIEW_ALL_ORGANIZATIONS]: '모든 조직 조회',
    [Permission.MANAGE_ALL_ORGANIZATIONS]: '모든 조직 관리',
    [Permission.VIEW_ALL_USERS]: '모든 사용자 조회',
    [Permission.MANAGE_ALL_USERS]: '모든 사용자 관리',
    [Permission.VIEW_ALL_DEVICES]: '모든 디바이스 조회',
    [Permission.MANAGE_ALL_DEVICES]: '모든 디바이스 관리',
    [Permission.MANAGE_SYSTEM_CONFIG]: '시스템 설정 관리',
    [Permission.VIEW_SYSTEM_LOGS]: '시스템 로그 조회',
    [Permission.MANAGE_API_KEYS]: 'API 키 관리',
    [Permission.SYSTEM_ADMIN]: '시스템 관리',
    [Permission.VIEW_ANALYTICS]: '분석 대시보드 조회',
    [Permission.VIEW_AUDIT_LOGS]: '감사 로그 조회',
    [Permission.MANAGE_SETTINGS]: '설정 관리',
    
    // Organization level permissions
    [Permission.VIEW_ORGANIZATION]: '조직 정보 조회',
    [Permission.READ_ORGANIZATIONS]: '조직 정보 조회',
    [Permission.WRITE_ORGANIZATIONS]: '조직 정보 수정',
    [Permission.DELETE_ORGANIZATIONS]: '조직 삭제',
    [Permission.MANAGE_ORGANIZATION]: '조직 관리',
    [Permission.MANAGE_ORGANIZATION_USERS]: '조직 사용자 관리',
    [Permission.MANAGE_ORGANIZATION_DEVICES]: '조직 디바이스 관리',
    [Permission.MANAGE_ORGANIZATION_CREDITS]: '조직 크레딧 관리',
    [Permission.VIEW_ORGANIZATION_REPORTS]: '조직 리포트 조회',
    
    // User permissions
    [Permission.READ_USERS]: '사용자 조회',
    [Permission.WRITE_USERS]: '사용자 관리',
    [Permission.DELETE_USERS]: '사용자 삭제',
    [Permission.INVITE_USERS]: '사용자 초대',
    
    // Device permissions
    [Permission.READ_DEVICES]: '디바이스 조회',
    [Permission.WRITE_DEVICES]: '디바이스 관리',
    [Permission.DELETE_DEVICES]: '디바이스 삭제',
    [Permission.ASSIGN_DEVICES]: '디바이스 할당',
    [Permission.UNASSIGN_DEVICES]: '디바이스 할당 해제',
    
    // Report permissions
    [Permission.GENERATE_REPORTS]: '리포트 생성',
    [Permission.VIEW_REPORTS]: '리포트 조회',
    [Permission.READ_REPORTS]: '리포트 조회',
    [Permission.WRITE_REPORTS]: '리포트 생성',
    [Permission.SHARE_REPORTS]: '리포트 공유',
    [Permission.DELETE_REPORTS]: '리포트 삭제',
    [Permission.EXPORT_REPORTS]: '리포트 내보내기',
    
    // Credit permissions
    [Permission.READ_CREDITS]: '크레딧 조회',
    [Permission.MANAGE_CREDITS]: '크레딧 관리',
    [Permission.PURCHASE_CREDITS]: '크레딧 구매'
  }
  
  return permissionNames[permission] || permission
}

/**
 * 사용자 타입을 사람이 읽기 쉬운 형태로 변환
 */
export function getUserTypeDisplayName(userType: UserType): string {
  const userTypeNames: Record<UserType, string> = {
    'SYSTEM_ADMIN': '시스템 관리자',
    'ORGANIZATION_ADMIN': '조직 관리자', 
    'ORGANIZATION_MEMBER': '조직 구성원',
    'INDIVIDUAL_USER': '개인 사용자',
    'MEASUREMENT_SUBJECT': '측정 대상자'
  }
  
  return userTypeNames[userType] || userType
}

/**
 * 권한 그룹별로 분류
 */
export function groupPermissionsByCategory(permissions: Permission[]): Record<string, Permission[]> {
  const groups: Record<string, Permission[]> = {
    '조직 관리': [],
    '디바이스 관리': [],
    '사용자 관리': [],
    '리포트 관리': [],
    '크레딧 관리': [],
    '시스템 관리': []
  }
  
  permissions.forEach(permission => {
    if (permission.includes('organizations')) {
      groups['조직 관리'].push(permission)
    } else if (permission.includes('devices')) {
      groups['디바이스 관리'].push(permission)
    } else if (permission.includes('users')) {
      groups['사용자 관리'].push(permission)
    } else if (permission.includes('reports')) {
      groups['리포트 관리'].push(permission)
    } else if (permission.includes('credits')) {
      groups['크레딧 관리'].push(permission)
    } else {
      groups['시스템 관리'].push(permission)
    }
  })
  
  // 빈 그룹 제거
  Object.keys(groups).forEach(key => {
    if (groups[key].length === 0) {
      delete groups[key]
    }
  })
  
  return groups
}

/**
 * 두 권한 배열을 비교하여 차이점 반환
 */
export function comparePermissions(current: Permission[], required: Permission[]): {
  missing: Permission[]
  extra: Permission[]
} {
  const missing = required.filter(p => !current.includes(p))
  const extra = current.filter(p => !required.includes(p))
  
  return { missing, extra }
}

/**
 * 권한 체크 결과를 로그 친화적인 문자열로 변환
 */
export function formatPermissionCheckResult(
  hasPermission: boolean,
  required: Permission[],
  current: Permission[]
): string {
  if (hasPermission) {
    return `권한 체크 성공: [${required.map(getPermissionDisplayName).join(', ')}]`
  }
  
  const { missing } = comparePermissions(current, required)
  return `권한 부족: 필요한 권한 [${missing.map(getPermissionDisplayName).join(', ')}]`
}