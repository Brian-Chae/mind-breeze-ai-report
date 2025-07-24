import { useMemo } from 'react';
import { User, Permission, UserType } from '@core/types/unified';
import { usePermissions } from './usePermissions';

/**
 * 관리자 설정 및 권한 정보를 제공하는 Hook
 * 복잡한 삼중 관리자 구조를 단순화하고 통합된 인터페이스 제공
 */
export const useAdminConfig = (user: User | null) => {
  const permissions = usePermissions(user);
  
  return useMemo(() => {
    if (!user) {
      return {
        // 권한 정보
        isAuthenticated: false,
        isSystemAdmin: false,
        isOrganizationAdmin: false,
        isAnyAdmin: false,
        isOrganizationMember: false,
        isIndividualUser: false,
        isMeasurementSubject: false,
        
        // 접근 가능한 관리 영역
        canAccessSystemAdmin: false,
        canAccessOrganizationAdmin: false,
        canAccessUnifiedAdmin: false,
        
        // 세부 권한
        canManageOrganization: false,
        canManageMembers: false,
        canManageDevices: false,
        canViewAnalytics: false,
        canManageCredits: false,
        canManageSettings: false,
        canViewReports: false,
        canGenerateReports: false,
        canAccessConsultation: false,
        
        // 사용자 정보
        userType: null,
        organizationId: null,
        displayName: null,
        email: null,
        
        // 권한 검사 함수들
        hasPermission: () => false,
        hasAnyPermission: () => false,
        hasAllPermissions: () => false,
        canAccess: () => false,
        
        // 관리 페이지 접근 권한
        adminRoutes: {
          systemAdmin: false,
          organizationAdmin: false,
          unifiedAdmin: false,
          deviceManagement: false,
          memberManagement: false,
          creditManagement: false,
          analytics: false,
          settings: false
        }
      };
    }
    
    const isSystemAdmin = user.userType === UserType.SYSTEM_ADMIN;
    const isOrganizationAdmin = user.userType === UserType.ORGANIZATION_ADMIN;
    const isOrganizationMember = user.userType === UserType.ORGANIZATION_MEMBER;
    const isIndividualUser = user.userType === UserType.INDIVIDUAL_USER;
    const isMeasurementSubject = user.userType === UserType.MEASUREMENT_SUBJECT;
    const isAnyAdmin = isSystemAdmin || isOrganizationAdmin;
    
    return {
      // 권한 정보
      isAuthenticated: true,
      isSystemAdmin,
      isOrganizationAdmin,
      isAnyAdmin,
      isOrganizationMember,
      isIndividualUser,
      isMeasurementSubject,
      
      // 접근 가능한 관리 영역
      canAccessSystemAdmin: isSystemAdmin,
      canAccessOrganizationAdmin: isOrganizationAdmin || isSystemAdmin,
      canAccessUnifiedAdmin: isAnyAdmin,
      
      // 세부 권한
      canManageOrganization: permissions.hasAnyPermission([
        Permission.ORGANIZATION_ALL,
        Permission.ORGANIZATION_UPDATE,
        Permission.ORGANIZATION_SETTINGS
      ]),
      canManageMembers: permissions.hasAnyPermission([
        Permission.MEMBER_ALL,
        Permission.MEMBER_INVITE,
        Permission.MEMBER_UPDATE,
        Permission.MEMBER_DELETE
      ]),
      canManageDevices: permissions.hasAnyPermission([
        Permission.DEVICE_ALL,
        Permission.DEVICE_REGISTER,
        Permission.DEVICE_ASSIGN,
        Permission.DEVICE_DELETE
      ]),
      canViewAnalytics: permissions.hasAnyPermission([
        Permission.ANALYTICS_ALL,
        Permission.ANALYTICS_VIEW,
        Permission.ANALYTICS_DASHBOARD
      ]),
      canManageCredits: permissions.hasAnyPermission([
        Permission.CREDIT_ALL,
        Permission.CREDIT_PURCHASE,
        Permission.CREDIT_VIEW
      ]),
      canManageSettings: permissions.hasAnyPermission([
        Permission.SETTINGS_ALL,
        Permission.SETTINGS_SYSTEM,
        Permission.SETTINGS_ORGANIZATION
      ]),
      canViewReports: permissions.hasAnyPermission([
        Permission.REPORT_ALL,
        Permission.REPORT_VIEW
      ]),
      canGenerateReports: permissions.hasAnyPermission([
        Permission.REPORT_ALL,
        Permission.REPORT_GENERATE
      ]),
      canAccessConsultation: permissions.hasAnyPermission([
        Permission.CONSULTATION_ACCESS,
        Permission.CONSULTATION_MANAGE
      ]),
      
      // 사용자 정보
      userType: user.userType,
      organizationId: user.organizationId || null,
      displayName: user.displayName || null,
      email: user.email || null,
      
      // 권한 검사 함수들
      hasPermission: permissions.hasPermission,
      hasAnyPermission: permissions.hasAnyPermission,
      hasAllPermissions: permissions.hasAllPermissions,
      canAccess: permissions.canAccess,
      
      // 관리 페이지 접근 권한
      adminRoutes: {
        systemAdmin: isSystemAdmin,
        organizationAdmin: isOrganizationAdmin || isSystemAdmin,
        unifiedAdmin: isAnyAdmin,
        deviceManagement: permissions.hasAnyPermission([
          Permission.DEVICE_ALL,
          Permission.DEVICE_VIEW
        ]),
        memberManagement: permissions.hasAnyPermission([
          Permission.MEMBER_ALL,
          Permission.MEMBER_READ
        ]),
        creditManagement: permissions.hasAnyPermission([
          Permission.CREDIT_ALL,
          Permission.CREDIT_VIEW
        ]),
        analytics: permissions.hasAnyPermission([
          Permission.ANALYTICS_ALL,
          Permission.ANALYTICS_VIEW
        ]),
        settings: permissions.hasAnyPermission([
          Permission.SETTINGS_ALL,
          Permission.SETTINGS_SYSTEM,
          Permission.SETTINGS_ORGANIZATION
        ])
      }
    };
  }, [user, permissions]);
};

/**
 * 관리자 네비게이션 설정을 제공하는 Hook
 */
export const useAdminNavigation = (user: User | null) => {
  const adminConfig = useAdminConfig(user);
  
  return useMemo(() => {
    const navItems = [];
    
    // 시스템 관리자 메뉴
    if (adminConfig.canAccessSystemAdmin) {
      navItems.push({
        id: 'system-admin',
        label: '시스템 관리',
        path: '/system-admin',
        icon: 'Settings',
        description: '시스템 전체 관리 및 설정',
        permissions: [Permission.SYSTEM_ALL]
      });
    }
    
    // 조직 관리자 메뉴
    if (adminConfig.canAccessOrganizationAdmin) {
      navItems.push({
        id: 'organization-admin',
        label: '조직 관리',
        path: '/org-admin',
        icon: 'Building',
        description: '조직 설정 및 구성원 관리',
        permissions: [Permission.ORGANIZATION_ALL, Permission.MEMBER_ALL]
      });
    }
    
    // 통합 관리자 메뉴
    if (adminConfig.canAccessUnifiedAdmin) {
      navItems.push({
        id: 'unified-admin',
        label: '통합 관리',
        path: '/unified-admin',
        icon: 'Dashboard',
        description: '통합 관리 대시보드',
        permissions: [Permission.ORGANIZATION_ALL, Permission.MEMBER_ALL]
      });
    }
    
    // 디바이스 관리 메뉴
    if (adminConfig.canManageDevices) {
      navItems.push({
        id: 'device-management',
        label: '디바이스 관리',
        path: '/admin/devices',
        icon: 'Smartphone',
        description: '디바이스 등록, 할당, 관리',
        permissions: [Permission.DEVICE_ALL, Permission.DEVICE_VIEW]
      });
    }
    
    // 구성원 관리 메뉴
    if (adminConfig.canManageMembers) {
      navItems.push({
        id: 'member-management',
        label: '구성원 관리',
        path: '/admin/members',
        icon: 'Users',
        description: '조직 구성원 초대 및 관리',
        permissions: [Permission.MEMBER_ALL, Permission.MEMBER_READ]
      });
    }
    
    // 크레딧 관리 메뉴
    if (adminConfig.canManageCredits) {
      navItems.push({
        id: 'credit-management',
        label: '크레딧 관리',
        path: '/admin/credits',
        icon: 'CreditCard',
        description: '크레딧 구매 및 사용량 관리',
        permissions: [Permission.CREDIT_ALL, Permission.CREDIT_VIEW]
      });
    }
    
    // 분석 및 리포트 메뉴
    if (adminConfig.canViewAnalytics) {
      navItems.push({
        id: 'analytics',
        label: '분석 및 리포트',
        path: '/admin/analytics',
        icon: 'BarChart3',
        description: '사용량 분석 및 리포트 관리',
        permissions: [Permission.ANALYTICS_ALL, Permission.ANALYTICS_VIEW]
      });
    }
    
    // 설정 메뉴
    if (adminConfig.canManageSettings) {
      navItems.push({
        id: 'settings',
        label: '설정',
        path: '/admin/settings',
        icon: 'Settings',
        description: '시스템 및 조직 설정',
        permissions: [Permission.SETTINGS_ALL, Permission.SETTINGS_ORGANIZATION]
      });
    }
    
    return navItems;
  }, [adminConfig]);
};

/**
 * 관리자 대시보드 위젯 설정을 제공하는 Hook
 */
export const useAdminDashboard = (user: User | null) => {
  const adminConfig = useAdminConfig(user);
  
  return useMemo(() => {
    const widgets = [];
    
    // 시스템 관리자용 위젯
    if (adminConfig.isSystemAdmin) {
      widgets.push(
        { id: 'system-overview', title: '시스템 개요', component: 'SystemOverviewWidget' },
        { id: 'organization-list', title: '조직 목록', component: 'OrganizationListWidget' },
        { id: 'user-statistics', title: '사용자 통계', component: 'UserStatisticsWidget' },
        { id: 'system-logs', title: '시스템 로그', component: 'SystemLogsWidget' }
      );
    }
    
    // 조직 관리자용 위젯
    if (adminConfig.isOrganizationAdmin) {
      widgets.push(
        { id: 'organization-info', title: '조직 정보', component: 'OrganizationInfoWidget' },
        { id: 'member-summary', title: '구성원 현황', component: 'MemberSummaryWidget' },
        { id: 'device-status', title: '디바이스 현황', component: 'DeviceStatusWidget' },
        { id: 'credit-balance', title: '크레딧 현황', component: 'CreditBalanceWidget' },
        { id: 'usage-analytics', title: '사용량 분석', component: 'UsageAnalyticsWidget' }
      );
    }
    
    return widgets;
  }, [adminConfig]);
};

/**
 * 권한별 액션 버튼 설정을 제공하는 Hook
 */
export const useAdminActions = (user: User | null) => {
  const adminConfig = useAdminConfig(user);
  
  return useMemo(() => ({
    // 조직 관리 액션
    organizationActions: {
      create: adminConfig.hasPermission(Permission.ORGANIZATION_CREATE),
      update: adminConfig.hasPermission(Permission.ORGANIZATION_UPDATE),
      delete: adminConfig.hasPermission(Permission.ORGANIZATION_DELETE),
      settings: adminConfig.hasPermission(Permission.ORGANIZATION_SETTINGS)
    },
    
    // 구성원 관리 액션
    memberActions: {
      invite: adminConfig.hasPermission(Permission.MEMBER_INVITE),
      update: adminConfig.hasPermission(Permission.MEMBER_UPDATE),
      delete: adminConfig.hasPermission(Permission.MEMBER_DELETE),
      assignRole: adminConfig.hasPermission(Permission.MEMBER_ROLE_ASSIGN)
    },
    
    // 디바이스 관리 액션
    deviceActions: {
      register: adminConfig.hasPermission(Permission.DEVICE_REGISTER),
      assign: adminConfig.hasPermission(Permission.DEVICE_ASSIGN),
      unassign: adminConfig.hasPermission(Permission.DEVICE_UNASSIGN),
      delete: adminConfig.hasPermission(Permission.DEVICE_DELETE)
    },
    
    // 크레딧 관리 액션
    creditActions: {
      purchase: adminConfig.hasPermission(Permission.CREDIT_PURCHASE),
      transfer: adminConfig.hasPermission(Permission.CREDIT_TRANSFER),
      refund: adminConfig.hasPermission(Permission.CREDIT_REFUND)
    },
    
    // 리포트 관련 액션
    reportActions: {
      generate: adminConfig.hasPermission(Permission.REPORT_GENERATE),
      share: adminConfig.hasPermission(Permission.REPORT_SHARE),
      delete: adminConfig.hasPermission(Permission.REPORT_DELETE)
    }
  }), [adminConfig]);
};