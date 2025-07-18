import { 
  User,
  UserType, 
  AuthStatus,
  AuthContext 
} from '../core/types/unified';
import { useUserStore, UserPermissions } from '../stores/userStore';
import { useOrganizationStore } from '../stores/organizationStore';
import enterpriseAuthService from '../domains/organization/services/EnterpriseAuthService';
import { signOut } from 'firebase/auth';
import { auth } from '@core/services/firebase';

/**
 * UserStoreService - User Store와 Firebase 서비스 간의 브릿지
 * Store 중심 데이터 흐름을 구현하는 서비스 어댑터
 */
export class UserStoreService {
  private static instance: UserStoreService;
  private authService: typeof enterpriseAuthService;

  private constructor() {
    this.authService = enterpriseAuthService;
  }

  public static getInstance(): UserStoreService {
    if (!UserStoreService.instance) {
      UserStoreService.instance = new UserStoreService();
    }
    return UserStoreService.instance;
  }

  /**
   * 사용자 로그인 및 Store 업데이트
   */
  async loginUser(email: string, password: string): Promise<AuthContext> {
    const userStore = useUserStore.getState();
    const organizationStore = useOrganizationStore.getState();

    try {
      userStore.setLoading(true);
      userStore.setError(null);

      // Firebase Auth를 통한 로그인
      const user = await this.authService.signIn({ email, password });

      if (user) {
        // User Store 업데이트
        userStore.setUser(user);
        userStore.setUserType(user.userType);
        userStore.setAuthStatus('AUTHENTICATED');
        userStore.startSession();

        // 사용자 타입에 따른 권한 설정
        const permissions = this.generatePermissions(user.userType, user.permissions);
        userStore.setPermissions(permissions);

        // Organization Store 업데이트 (조직 사용자인 경우)
        // TODO: 조직 정보는 별도로 로드해야 함
        const organization = null;
        const memberInfo = null;

        const authContext: AuthContext = {
          user,
          organization,
          memberInfo,
          permissions: user.permissions,
          isLoading: false,
        };

        return authContext;
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      userStore.setError(errorMessage);
      userStore.setAuthStatus('UNAUTHENTICATED');
      
      throw error;
    } finally {
      userStore.setLoading(false);
    }
  }

  /**
   * 사용자 로그아웃 및 Store 초기화
   */
  async logoutUser(): Promise<void> {
    const userStore = useUserStore.getState();
    const organizationStore = useOrganizationStore.getState();

    try {
      // Firebase Auth 로그아웃
      await signOut(auth);

      // Store 초기화
      userStore.endSession();
      userStore.clearUser();
      organizationStore.clearOrganization();
    } catch (error) {
      console.error('Logout error:', error);
      // 에러가 발생해도 로컬 Store는 초기화
      userStore.reset();
      organizationStore.reset();
    }
  }

  /**
   * 현재 사용자 세션 확인 및 Store 동기화
   */
  async validateSession(): Promise<AuthContext | null> {
    const userStore = useUserStore.getState();
    const organizationStore = useOrganizationStore.getState();

    try {
      userStore.setLoading(true);

      // 세션 유효성 검사
      if (!userStore.isSessionValid()) {
        await this.logoutUser();
        return null;
      }

      // Firebase에서 현재 사용자 정보 조회
      const authContext = this.authService.getCurrentContext();

      if (authContext.user) {
        const { user, organization, memberInfo } = authContext;

        // Store 동기화
        userStore.setUser(user);
        userStore.updateActivity();

        if (organization && memberInfo) {
          organizationStore.setOrganization(organization);
          organizationStore.setCurrentMember(memberInfo);
        }

        return {
          user,
          organization,
          memberInfo,
          permissions: user.permissions,
          isLoading: false,
        };
      }

      return null;
    } catch (error) {
      console.error('Session validation error:', error);
      await this.logoutUser();
      return null;
    } finally {
      userStore.setLoading(false);
    }
  }

  /**
   * 사용자 프로필 업데이트
   */
  async updateUserProfile(updates: Partial<User>): Promise<void> {
    const userStore = useUserStore.getState();

    try {
      userStore.setLoading(true);
      userStore.setError(null);

      if (!userStore.currentUser) {
        throw new Error('No user logged in');
      }

      // Firebase에서 사용자 정보 업데이트 (임시로 주석 처리)
      // const result = await this.authService.updateUserProfile(userStore.currentUser.id, updates);

      // Store 업데이트 (임시로 직접 업데이트)
      userStore.updateUserProfile(updates);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Update failed';
      userStore.setError(errorMessage);
      throw error;
    } finally {
      userStore.setLoading(false);
    }
  }

  /**
   * 사용자 타입에 따른 권한 생성
   */
  private generatePermissions(userType: UserType, systemPermissions: string[]): UserPermissions {
    const basePermissions: UserPermissions = {
      canAccessAdmin: false,
      canManageOrganization: false,
      canViewReports: true,
      canExportData: false,
      canManageMembers: false,
      customPermissions: systemPermissions,
    };

    switch (userType) {
      case 'ORGANIZATION_ADMIN':
        return {
          ...basePermissions,
          canAccessAdmin: true,
          canManageOrganization: true,
          canExportData: true,
          canManageMembers: true,
        };

      case 'ORGANIZATION_MEMBER':
        return {
          ...basePermissions,
          canExportData: true,
        };

      case 'SYSTEM_ADMIN':
        return {
          ...basePermissions,
          canAccessAdmin: true,
          canManageOrganization: true,
          canExportData: true,
          canManageMembers: true,
        };

      case 'INDIVIDUAL_USER':
      case 'MEASUREMENT_SUBJECT':
      default:
        return basePermissions;
    }
  }

  /**
   * 권한 확인 헬퍼 메서드들
   */
  hasPermission(permission: keyof UserPermissions): boolean {
    const userStore = useUserStore.getState();
    return Boolean(userStore.permissions[permission]);
  }

  canAccessRoute(routePath: string): boolean {
    const userStore = useUserStore.getState();
    
    if (!userStore.currentUser) return false;

    // 라우트별 권한 검사 로직
    if (routePath.startsWith('/admin')) {
      return userStore.permissions.canAccessAdmin;
    }

    if (routePath.startsWith('/organization')) {
      return userStore.userType === 'ORGANIZATION_ADMIN' || userStore.userType === 'ORGANIZATION_MEMBER';
    }

    return true; // 기본적으로 허용
  }

  /**
   * Store 상태 조회 헬퍼들
   */
  getCurrentUser(): User | null {
    return useUserStore.getState().currentUser;
  }

  getUserType(): UserType | null {
    return useUserStore.getState().userType;
  }

  isAuthenticated(): boolean {
    const userStore = useUserStore.getState();
    return userStore.session.isAuthenticated && userStore.isSessionValid();
  }

  isLoading(): boolean {
    return useUserStore.getState().isLoading;
  }

  getError(): string | null {
    return useUserStore.getState().error;
  }
} 