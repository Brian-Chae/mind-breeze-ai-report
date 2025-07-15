import { useEffect, useCallback } from 'react';
import { 
  useOrganizationStore, 
  OrganizationMetrics, 
  OrganizationSettings,
  ExtendedOrganizationMember,
  MemberRole,
  MemberStatus 
} from '../stores/organizationStore';
import { OrganizationStoreService } from '../services/OrganizationStoreService';
import { Organization } from '../core/types/unified';

/**
 * useOrganization Hook - 조직 관련 모든 기능을 제공하는 커스텀 훅
 * 
 * Phase 4: Component Layer 리팩토링 - Hook 패턴 적용
 * Component에서 Store와 Service를 직접 사용하지 않고 Hook을 통해 추상화
 */
export const useOrganization = () => {
  // Store 상태 구독
  const {
    currentOrganization,
    members,
    currentMember,
    metrics,
    settings,
    isLoading,
    membersLoading,
    error,
    
    // Store Actions (내부에서만 사용)
    setOrganization,
    updateOrganization: updateOrganizationStore,
    clearOrganization,
    setMembers,
    addMember,
    updateMember,
    removeMember,
    setCurrentMember,
    inviteMember: inviteMemberStore,
    approveMemberRequest,
    rejectMemberRequest,
    changeMemberRole: changeMemberRoleStore,
    suspendMember: suspendMemberStore,
    reactivateMember,
    setMetrics,
    updateMetrics,
    setSettings,
    updateSettings,
    setLoading,
    setMembersLoading,
    setError,
    
    // Utility functions
    getMemberByUserId,
    getMembersByRole,
    getActiveMembers,
    getPendingMembers,
    isUserAdmin,
    isUserMember,
    canInviteMembers,
    reset
  } = useOrganizationStore();

  // Service 인스턴스
  const organizationService = OrganizationStoreService.getInstance();

  /**
   * 조직 정보 로드
   */
  const loadOrganization = useCallback(async (organizationId: string): Promise<void> => {
    try {
      await organizationService.loadOrganization(organizationId);
    } catch (error) {
      throw error;
    }
  }, [organizationService]);

  /**
   * 조직 멤버 목록 로드
   */
  const loadMembers = useCallback(async (organizationId: string): Promise<void> => {
    try {
      await organizationService.loadOrganizationMembers(organizationId);
    } catch (error) {
      throw error;
    }
  }, [organizationService]);

  /**
   * 새 멤버 초대
   */
  const inviteMember = useCallback(async (email: string, role: MemberRole): Promise<void> => {
    try {
      await organizationService.inviteMember(email, role);
    } catch (error) {
      throw error;
    }
  }, [organizationService]);

  /**
   * 멤버 역할 변경
   */
  const changeMemberRole = useCallback(async (memberId: string, newRole: MemberRole): Promise<void> => {
    try {
      await organizationService.changeMemberRole(memberId, newRole);
    } catch (error) {
      throw error;
    }
  }, [organizationService]);

  /**
   * 멤버 정지
   */
  const suspendMember = useCallback(async (memberId: string): Promise<void> => {
    try {
      await organizationService.suspendMember(memberId);
    } catch (error) {
      throw error;
    }
  }, [organizationService]);

  /**
   * 조직 정보 업데이트
   */
  const updateOrganization = useCallback(async (updates: Partial<Organization>): Promise<void> => {
    try {
      await organizationService.updateOrganization(updates);
    } catch (error) {
      throw error;
    }
  }, [organizationService]);

  /**
   * 에러 초기화
   */
  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  /**
   * 멤버 검색
   */
  const searchMembers = useCallback((query: string): ExtendedOrganizationMember[] => {
    if (!query.trim()) return members;
    
    const lowerQuery = query.toLowerCase();
    return members.filter(member => 
      member.email?.toLowerCase().includes(lowerQuery) ||
      member.employeeId?.toLowerCase().includes(lowerQuery) ||
      member.department?.toLowerCase().includes(lowerQuery) ||
      member.position?.toLowerCase().includes(lowerQuery)
    );
  }, [members]);

  /**
   * 역할별 멤버 수 계산
   */
  const getMemberCountByRole = useCallback((role: MemberRole): number => {
    return getMembersByRole(role).length;
  }, [getMembersByRole]);

  /**
   * 상태별 멤버 수 계산
   */
  const getMemberCountByStatus = useCallback((status: MemberStatus): number => {
    return members.filter(member => member.status === status).length;
  }, [members]);

  // 편의 속성들
  const hasOrganization = !!currentOrganization;
  const organizationName = currentOrganization?.name || '';
  const organizationId = currentOrganization?.id || null;
  const totalMembers = members.length;
  const activeMembersCount = getActiveMembers().length;
  const pendingMembersCount = getPendingMembers().length;
  const adminMembersCount = getMemberCountByRole('ADMIN');
  const regularMembersCount = getMemberCountByRole('MEMBER');

  // 권한 확인
  const canManageMembers = canInviteMembers();
  const canUpdateOrganization = hasOrganization; // 실제로는 더 세밀한 권한 체크 필요

  return {
    // 기본 상태
    organization: currentOrganization,
    members,
    currentMember,
    metrics,
    settings,
    isLoading,
    membersLoading,
    error,
    
    // 계산된 상태
    hasOrganization,
    organizationName,
    organizationId,
    totalMembers,
    activeMembersCount,
    pendingMembersCount,
    adminMembersCount,
    regularMembersCount,
    
    // 권한
    canManageMembers,
    canUpdateOrganization,
    
    // Actions
    loadOrganization,
    loadMembers,
    inviteMember,
    changeMemberRole,
    suspendMember,
    updateOrganization,
    
    // 멤버 관리
    approveMemberRequest,
    rejectMemberRequest,
    reactivateMember,
    
    // 유틸리티 함수들
    searchMembers,
    getMemberByUserId,
    getMembersByRole,
    getActiveMembers,
    getPendingMembers,
    getMemberCountByRole,
    getMemberCountByStatus,
    isUserAdmin,
    isUserMember,
    
    // 기타
    clearError,
    reset
  };
};

/**
 * useOrganizationMember Hook - 특정 멤버 정보를 관리하는 훅
 */
export const useOrganizationMember = (memberId?: string) => {
  const { getMemberByUserId, members, changeMemberRole, suspendMember, reactivateMember } = useOrganization();
  
  const member = memberId ? getMemberByUserId(memberId) : null;
  const isActive = member?.status === 'ACTIVE' || member?.isActive;
  const isPending = member?.status === 'PENDING';
  const isSuspended = member?.status === 'SUSPENDED';
  const isAdmin = member?.role === 'ADMIN';

  return {
    member,
    isActive,
    isPending,
    isSuspended,
    isAdmin,
    
    // Actions for this specific member
    changeRole: (newRole: MemberRole) => changeMemberRole(memberId!, newRole),
    suspend: () => suspendMember(memberId!),
    reactivate: () => reactivateMember(memberId!),
  };
};

/**
 * useOrganizationStats Hook - 조직 통계 정보를 제공하는 훅
 */
export const useOrganizationStats = () => {
  const { metrics, members } = useOrganization();

  // 실시간 계산되는 통계들
  const stats = {
    totalMembers: members.length,
    activeMembers: members.filter(m => m.status === 'ACTIVE' || m.isActive).length,
    pendingMembers: members.filter(m => m.status === 'PENDING').length,
    suspendedMembers: members.filter(m => m.status === 'SUSPENDED').length,
    adminMembers: members.filter(m => m.role === 'ADMIN').length,
    regularMembers: members.filter(m => m.role === 'MEMBER').length,
    
    // 메트릭스에서 가져오는 통계들
    totalCredits: metrics?.totalCredits || 0,
    usedCredits: metrics?.usedCredits || 0,
    remainingCredits: metrics?.remainingCredits || 0,
    monthlyUsage: metrics?.monthlyUsage || 0,
    lastUpdated: metrics?.lastUpdated || new Date(),
  };

  // 비율 계산
  const activeRate = stats.totalMembers > 0 ? (stats.activeMembers / stats.totalMembers) * 100 : 0;
  const creditUsageRate = stats.totalCredits > 0 ? (stats.usedCredits / stats.totalCredits) * 100 : 0;

  return {
    ...stats,
    activeRate,
    creditUsageRate,
    metrics
  };
}; 