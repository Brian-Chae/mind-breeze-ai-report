import React from 'react';
import { Permission, User } from '@core/types/unified';
import { PermissionUtils } from '@core/utils/permissions';
import { usePermissions } from '@core/hooks/usePermissions';

interface PermissionGuardProps {
  children: React.ReactNode;
  user: User | null;
  
  // 권한 검사 방식 (하나만 선택)
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean; // permissions 배열의 모든 권한 필요 (기본: false - 하나라도 있으면 됨)
  
  // 리소스/액션 기반 검사
  resource?: string;
  action?: string;
  
  // 사용자 타입 기반 검사
  userTypes?: string[];
  
  // 권한이 없을 때 표시할 내용
  fallback?: React.ReactNode;
  
  // 로딩 상태일 때 표시할 내용
  loading?: React.ReactNode;
  
  // 권한 검사 실패 시 호출할 콜백
  onAccessDenied?: (user: User | null) => void;
}

/**
 * 권한 기반 접근 제어 컴포넌트
 * 사용자의 권한에 따라 자식 컴포넌트를 조건부 렌더링
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  user,
  permission,
  permissions,
  requireAll = false,
  resource,
  action,
  userTypes,
  fallback = null,
  loading = null,
  onAccessDenied
}) => {
  const permissionChecker = usePermissions(user);
  
  // 로딩 상태 처리
  if (user === undefined) {
    return <>{loading}</>;
  }
  
  // 권한 검사 로직
  const hasAccess = React.useMemo(() => {
    // 사용자가 없으면 접근 거부
    if (!user) return false;
    
    // 단일 권한 검사
    if (permission) {
      return permissionChecker.hasPermission(permission);
    }
    
    // 복수 권한 검사
    if (permissions && permissions.length > 0) {
      return requireAll 
        ? permissionChecker.hasAllPermissions(permissions)
        : permissionChecker.hasAnyPermission(permissions);
    }
    
    // 리소스/액션 기반 검사
    if (resource && action) {
      return permissionChecker.canAccess(resource, action);
    }
    
    // 사용자 타입 검사
    if (userTypes && userTypes.length > 0) {
      return userTypes.includes(user.userType);
    }
    
    // 조건이 명시되지 않았으면 접근 허용
    return true;
  }, [user, permission, permissions, requireAll, resource, action, userTypes, permissionChecker]);
  
  // 접근 권한이 있으면 자식 컴포넌트 렌더링
  if (hasAccess) {
    return <>{children}</>;
  }
  
  // 접근 권한이 없으면 콜백 호출
  React.useEffect(() => {
    if (!hasAccess && onAccessDenied) {
      onAccessDenied(user);
    }
  }, [hasAccess, user, onAccessDenied]);
  
  // 권한이 없으면 fallback 렌더링
  return <>{fallback}</>;
};

// 편의를 위한 미리 정의된 가드 컴포넌트들

/**
 * 시스템 관리자만 접근 가능한 가드
 */
export const SystemAdminGuard: React.FC<{
  children: React.ReactNode;
  user: User | null;
  fallback?: React.ReactNode;
}> = ({ children, user, fallback }) => (
  <PermissionGuard
    user={user}
    userTypes={['SYSTEM_ADMIN']}
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

/**
 * 조직 관리자만 접근 가능한 가드
 */
export const OrganizationAdminGuard: React.FC<{
  children: React.ReactNode;
  user: User | null;
  fallback?: React.ReactNode;
}> = ({ children, user, fallback }) => (
  <PermissionGuard
    user={user}
    userTypes={['ORGANIZATION_ADMIN']}
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

/**
 * 관리자 권한 가드 (시스템 관리자 또는 조직 관리자)
 */
export const AdminGuard: React.FC<{
  children: React.ReactNode;
  user: User | null;
  fallback?: React.ReactNode;
}> = ({ children, user, fallback }) => (
  <PermissionGuard
    user={user}
    userTypes={['SYSTEM_ADMIN', 'ORGANIZATION_ADMIN']}
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

/**
 * 조직 구성원 가드 (시스템 관리자, 조직 관리자, 조직 구성원)
 */
export const OrganizationGuard: React.FC<{
  children: React.ReactNode;
  user: User | null;
  fallback?: React.ReactNode;
}> = ({ children, user, fallback }) => (
  <PermissionGuard
    user={user}
    userTypes={['SYSTEM_ADMIN', 'ORGANIZATION_ADMIN', 'ORGANIZATION_MEMBER']}
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

/**
 * 디바이스 관리 권한 가드
 */
export const DeviceManagementGuard: React.FC<{
  children: React.ReactNode;
  user: User | null;
  fallback?: React.ReactNode;
}> = ({ children, user, fallback }) => (
  <PermissionGuard
    user={user}
    permissions={[Permission.DEVICE_ALL, Permission.DEVICE_VIEW]}
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

/**
 * 구성원 관리 권한 가드
 */
export const MemberManagementGuard: React.FC<{
  children: React.ReactNode;
  user: User | null;
  fallback?: React.ReactNode;
}> = ({ children, user, fallback }) => (
  <PermissionGuard
    user={user}
    permissions={[Permission.MEMBER_ALL, Permission.MEMBER_READ]}
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

/**
 * 분석 데이터 접근 권한 가드
 */
export const AnalyticsGuard: React.FC<{
  children: React.ReactNode;
  user: User | null;
  fallback?: React.ReactNode;
}> = ({ children, user, fallback }) => (
  <PermissionGuard
    user={user}
    permissions={[Permission.ANALYTICS_ALL, Permission.ANALYTICS_VIEW]}
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

// HOC (Higher-Order Component) 버전
export const withPermissionGuard = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  guardProps: Omit<PermissionGuardProps, 'children'>
) => {
  return (props: P) => (
    <PermissionGuard {...guardProps}>
      <WrappedComponent {...props} />
    </PermissionGuard>
  );
};