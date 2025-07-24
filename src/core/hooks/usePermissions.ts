import { useMemo } from 'react';
import { Permission, User, UserType } from '@core/types/unified';
import { PermissionUtils, createPermissionChecker } from '@core/utils/permissions';

/**
 * 권한 관리를 위한 React Hook
 * 컴포넌트에서 권한 검사를 쉽게 할 수 있도록 제공
 */
export const usePermissions = (user: User | null) => {
  return useMemo(() => createPermissionChecker(user), [user]);
};

/**
 * 특정 권한이 있는지 확인하는 Hook
 */
export const useHasPermission = (user: User | null, permission: Permission): boolean => {
  return useMemo(() => PermissionUtils.hasPermission(user, permission), [user, permission]);
};

/**
 * 여러 권한 중 하나라도 가지고 있는지 확인하는 Hook
 */
export const useHasAnyPermission = (user: User | null, permissions: Permission[]): boolean => {
  return useMemo(() => PermissionUtils.hasAnyPermission(user, permissions), [user, permissions]);
};

/**
 * 모든 권한을 가지고 있는지 확인하는 Hook
 */
export const useHasAllPermissions = (user: User | null, permissions: Permission[]): boolean => {
  return useMemo(() => PermissionUtils.hasAllPermissions(user, permissions), [user, permissions]);
};

/**
 * 사용자 타입별 권한 확인 Hook들
 */
export const useIsSystemAdmin = (user: User | null): boolean => {
  return useMemo(() => user?.userType === UserType.SYSTEM_ADMIN, [user]);
};

export const useIsOrganizationAdmin = (user: User | null): boolean => {
  return useMemo(() => user?.userType === UserType.ORGANIZATION_ADMIN, [user]);
};

export const useIsOrganizationMember = (user: User | null): boolean => {
  return useMemo(() => user?.userType === UserType.ORGANIZATION_MEMBER, [user]);
};

export const useIsIndividualUser = (user: User | null): boolean => {
  return useMemo(() => user?.userType === UserType.INDIVIDUAL_USER, [user]);
};

export const useIsMeasurementSubject = (user: User | null): boolean => {
  return useMemo(() => user?.userType === UserType.MEASUREMENT_SUBJECT, [user]);
};

/**
 * 관리자 권한 확인 (시스템 관리자 또는 조직 관리자)
 */
export const useIsAdmin = (user: User | null): boolean => {
  return useMemo(() => {
    return user?.userType === UserType.SYSTEM_ADMIN || user?.userType === UserType.ORGANIZATION_ADMIN;
  }, [user]);
};

/**
 * 조직 관련 작업 권한 확인 (시스템 관리자, 조직 관리자, 조직 구성원)
 */
export const useIsOrganizationUser = (user: User | null): boolean => {
  return useMemo(() => {
    return user?.userType === UserType.SYSTEM_ADMIN || 
           user?.userType === UserType.ORGANIZATION_ADMIN || 
           user?.userType === UserType.ORGANIZATION_MEMBER;
  }, [user]);
};

/**
 * 리소스 액세스 권한 확인 Hook
 */
export const useCanAccess = (user: User | null, resource: string, action: string): boolean => {
  return useMemo(() => PermissionUtils.canAccess(user, resource, action), [user, resource, action]);
};