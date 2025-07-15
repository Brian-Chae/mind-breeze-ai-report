import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserType, AuthStatus } from '../core/types/unified';

export interface UserSession {
  isAuthenticated: boolean;
  authStatus: AuthStatus;
  loginTime?: Date;
  lastActivity?: Date;
  sessionTimeout?: number; // milliseconds
}

export interface UserPermissions {
  canAccessAdmin: boolean;
  canManageOrganization: boolean;
  canViewReports: boolean;
  canExportData: boolean;
  canManageMembers: boolean;
  customPermissions: string[];
}

interface UserState {
  // Core user data
  currentUser: User | null;
  userType: UserType | null;
  session: UserSession;
  permissions: UserPermissions;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User) => void;
  setUserType: (userType: UserType) => void;
  setAuthStatus: (status: AuthStatus) => void;
  setPermissions: (permissions: Partial<UserPermissions>) => void;
  updateUserProfile: (updates: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Session management
  startSession: () => void;
  endSession: () => void;
  updateActivity: () => void;
  isSessionValid: () => boolean;
  
  // Reset
  clearUser: () => void;
  reset: () => void;
}

const defaultPermissions: UserPermissions = {
  canAccessAdmin: false,
  canManageOrganization: false,
  canViewReports: true,
  canExportData: false,
  canManageMembers: false,
  customPermissions: [],
};

const defaultSession: UserSession = {
  isAuthenticated: false,
  authStatus: 'UNAUTHENTICATED',
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentUser: null,
      userType: null,
      session: defaultSession,
      permissions: defaultPermissions,
      isLoading: false,
      error: null,

      // Core actions
      setUser: (user: User) => {
        set({ 
          currentUser: user,
          error: null 
        });
      },

      setUserType: (userType: UserType) => {
        set({ userType });
        
        // Update permissions based on user type
        const { permissions } = get();
        const updatedPermissions: UserPermissions = {
          ...permissions,
          canAccessAdmin: userType === 'ORGANIZATION_ADMIN',
          canManageOrganization: userType === 'ORGANIZATION_ADMIN',
          canManageMembers: userType === 'ORGANIZATION_ADMIN',
          canExportData: userType !== 'INDIVIDUAL_USER',
        };
        
        set({ permissions: updatedPermissions });
      },

      setAuthStatus: (status: AuthStatus) => {
        set((state) => ({
          session: {
            ...state.session,
            authStatus: status,
            isAuthenticated: status === 'AUTHENTICATED',
            ...(status === 'AUTHENTICATED' && !state.session.loginTime && {
              loginTime: new Date(),
              lastActivity: new Date(),
            }),
          }
        }));
      },

      setPermissions: (permissions: Partial<UserPermissions>) => {
        set((state) => ({
          permissions: { ...state.permissions, ...permissions }
        }));
      },

      updateUserProfile: (updates: Partial<User>) => {
        set((state) => ({
          currentUser: state.currentUser ? {
            ...state.currentUser,
            ...updates,
            updatedAt: new Date(),
          } : null
        }));
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),
      
      setError: (error: string | null) => set({ error }),

      // Session management
      startSession: () => {
        const now = new Date();
        set((state) => ({
          session: {
            ...state.session,
            isAuthenticated: true,
            authStatus: 'AUTHENTICATED',
            loginTime: now,
            lastActivity: now,
          }
        }));
      },

      endSession: () => {
        set({
          session: {
            ...defaultSession,
            authStatus: 'UNAUTHENTICATED',
          }
        });
      },

      updateActivity: () => {
        set((state) => ({
          session: {
            ...state.session,
            lastActivity: new Date(),
          }
        }));
      },

      isSessionValid: () => {
        const { session } = get();
        if (!session.isAuthenticated || !session.lastActivity || !session.sessionTimeout) {
          return false;
        }
        
        const now = new Date().getTime();
        const lastActivity = new Date(session.lastActivity).getTime();
        return (now - lastActivity) < session.sessionTimeout;
      },

      // Reset functions
      clearUser: () => {
        set({
          currentUser: null,
          userType: null,
          permissions: defaultPermissions,
          error: null,
        });
      },

      reset: () => {
        set({
          currentUser: null,
          userType: null,
          session: defaultSession,
          permissions: defaultPermissions,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'user-storage',
      // Only persist essential user data, not session data
      partialize: (state) => ({
        currentUser: state.currentUser,
        userType: state.userType,
        permissions: state.permissions,
      }),
    }
  )
); 