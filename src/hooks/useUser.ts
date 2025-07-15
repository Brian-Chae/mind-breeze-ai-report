import { useEffect, useCallback } from 'react';
import { useUserStore, UserPermissions } from '../stores/userStore';
import { UserStoreService } from '../services/UserStoreService';
import { User, UserType, AuthContext } from '../core/types/unified';

/**
 * useUser Hook - 사용자 관련 모든 기능을 제공하는 커스텀 훅
 * 
 * Phase 4: Component Layer 리팩토링 - Hook 패턴 적용
 * Component에서 Store와 Service를 직접 사용하지 않고 Hook을 통해 추상화
 */
export const useUser = () => {
  // Store 상태 구독
  const {
    currentUser,
    userType,
    session,
    permissions,
    isLoading,
    error,
    
    // Store Actions (직접 노출하지 않고 Hook 내부에서만 사용)
    setUser,
    setUserType,
    setAuthStatus,
    setPermissions,
    updateUserProfile: updateUserProfileStore,
    setLoading,
    setError,
    startSession,
    endSession,
    updateActivity,
    isSessionValid,
    clearUser,
    reset
  } = useUserStore();

  // Service 인스턴스
  const userService = UserStoreService.getInstance();

  // 세션 유효성 자동 체크
  useEffect(() => {
    if (currentUser && !isSessionValid()) {
      handleLogout();
    }
  }, [currentUser]);

  // 활동 자동 업데이트 (페이지 이동, 클릭 등에서 호출)
  useEffect(() => {
    if (session.isAuthenticated) {
      updateActivity();
    }
  }, [session.isAuthenticated]);

  /**
   * 로그인
   */
  const login = useCallback(async (email: string, password: string): Promise<AuthContext> => {
    try {
      const authContext = await userService.loginUser(email, password);
      return authContext;
    } catch (error) {
      throw error;
    }
  }, [userService]);

  /**
   * 로그아웃
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await userService.logoutUser();
    } catch (error) {
      console.error('Logout error:', error);
      // 에러가 발생해도 로컬 상태는 초기화
      reset();
    }
  }, [userService, reset]);

  /**
   * 세션 검증 및 사용자 정보 갱신
   */
  const validateSession = useCallback(async (): Promise<AuthContext | null> => {
    try {
      return await userService.validateSession();
    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }, [userService]);

  /**
   * 사용자 프로필 업데이트
   */
  const updateProfile = useCallback(async (updates: Partial<User>): Promise<void> => {
    try {
      await userService.updateUserProfile(updates);
    } catch (error) {
      throw error;
    }
  }, [userService]);

  /**
   * 권한 확인
   */
  const hasPermission = useCallback((permission: keyof UserPermissions): boolean => {
    return userService.hasPermission(permission);
  }, [userService]);

  /**
   * 라우트 접근 권한 확인
   */
  const canAccessRoute = useCallback((routePath: string): boolean => {
    return userService.canAccessRoute(routePath);
  }, [userService]);

  /**
   * 에러 초기화
   */
  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  /**
   * 로그아웃 핸들러 (내부 사용)
   */
  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  // 편의 속성들
  const isAuthenticated = session.isAuthenticated && isSessionValid();
  const isAdmin = userType === 'ORGANIZATION_ADMIN' || userType === 'SYSTEM_ADMIN';
  const isOrganizationUser = userType === 'ORGANIZATION_ADMIN' || userType === 'ORGANIZATION_MEMBER';
  const isIndividualUser = userType === 'INDIVIDUAL_USER';

  return {
    // 상태
    user: currentUser,
    userType,
    session,
    permissions,
    isLoading,
    error,
    
    // 계산된 상태
    isAuthenticated,
    isAdmin,
    isOrganizationUser, 
    isIndividualUser,
    
    // Actions
    login,
    logout,
    validateSession,
    updateProfile,
    
    // 권한 체크
    hasPermission,
    canAccessRoute,
    
    // 유틸리티
    clearError,
    
    // 사용자 정보 헬퍼들
    displayName: currentUser?.displayName || currentUser?.email || 'Unknown User',
    email: currentUser?.email || '',
    organizationId: currentUser?.organizationId || null,
    organizationCode: currentUser?.organizationCode || null,
  };
};

/**
 * useAuthGuard Hook - 인증이 필요한 컴포넌트에서 사용
 */
export const useAuthGuard = (requireAuth: boolean = true) => {
  const { isAuthenticated, isLoading, user } = useUser();

  useEffect(() => {
    if (requireAuth && !isLoading && !isAuthenticated) {
      // 리다이렉트 로직은 상위 컴포넌트에서 처리
      console.warn('Authentication required but user is not authenticated');
    }
  }, [requireAuth, isLoading, isAuthenticated]);

  return {
    isAuthenticated,
    isLoading,
    user,
    shouldRedirect: requireAuth && !isLoading && !isAuthenticated
  };
};

/**
 * usePermissionGuard Hook - 특정 권한이 필요한 컴포넌트에서 사용
 */
export const usePermissionGuard = (requiredPermission: keyof UserPermissions) => {
  const { hasPermission, isLoading, isAuthenticated } = useUser();

  const hasRequiredPermission = isAuthenticated && hasPermission(requiredPermission);

  return {
    hasPermission: hasRequiredPermission,
    isLoading,
    isAuthenticated,
    canAccess: isAuthenticated && hasRequiredPermission
  };
}; 