import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Organization, 
  OrganizationMember,
  OrganizationStatus,
  ServicePackageType
} from '../core/types/unified';

// Define custom types for organization store functionality
export type MemberRole = 'ADMIN' | 'MEMBER' | 'VIEWER';
export type MemberStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED';

export interface OrganizationMetrics {
  totalMembers: number;
  activeMembers: number;
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  monthlyUsage: number;
  lastUpdated: Date;
}

export interface OrganizationSettings {
  allowMemberInvites: boolean;
  requireAdminApproval: boolean;
  maxMembersPerPlan: number;
  dataRetentionDays: number;
  enableAuditLogs: boolean;
  customSettings: Record<string, any>;
}

// Extended member interface for store purposes
export interface ExtendedOrganizationMember extends OrganizationMember {
  email?: string;
  role?: MemberRole;
  status?: MemberStatus;
  createdAt?: string;
  updatedAt?: string;
}

interface OrganizationState {
  // Core organization data
  currentOrganization: Organization | null;
  members: ExtendedOrganizationMember[];
  currentMember: ExtendedOrganizationMember | null;
  metrics: OrganizationMetrics | null;
  settings: OrganizationSettings | null;
  
  // Loading and error states
  isLoading: boolean;
  membersLoading: boolean;
  error: string | null;
  
  // Actions - Organization
  setOrganization: (organization: Organization) => void;
  updateOrganization: (updates: Partial<Organization>) => void;
  clearOrganization: () => void;
  
  // Actions - Members
  setMembers: (members: ExtendedOrganizationMember[]) => void;
  addMember: (member: ExtendedOrganizationMember) => void;
  updateMember: (memberId: string, updates: Partial<ExtendedOrganizationMember>) => void;
  removeMember: (memberId: string) => void;
  setCurrentMember: (member: ExtendedOrganizationMember | null) => void;
  
  // Actions - Member management
  inviteMember: (email: string, role: MemberRole) => void;
  approveMemberRequest: (memberId: string) => void;
  rejectMemberRequest: (memberId: string) => void;
  changeMemberRole: (memberId: string, newRole: MemberRole) => void;
  suspendMember: (memberId: string) => void;
  reactivateMember: (memberId: string) => void;
  
  // Actions - Metrics and Settings
  setMetrics: (metrics: OrganizationMetrics) => void;
  updateMetrics: (updates: Partial<OrganizationMetrics>) => void;
  setSettings: (settings: OrganizationSettings) => void;
  updateSettings: (updates: Partial<OrganizationSettings>) => void;
  
  // Actions - Loading and Error
  setLoading: (loading: boolean) => void;
  setMembersLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Utility functions
  getMemberByUserId: (userId: string) => ExtendedOrganizationMember | undefined;
  getMembersByRole: (role: MemberRole) => ExtendedOrganizationMember[];
  getActiveMembers: () => ExtendedOrganizationMember[];
  getPendingMembers: () => ExtendedOrganizationMember[];
  isUserAdmin: (userId: string) => boolean;
  isUserMember: (userId: string) => boolean;
  canInviteMembers: () => boolean;
  
  // Reset
  reset: () => void;
}

const defaultMetrics: OrganizationMetrics = {
  totalMembers: 0,
  activeMembers: 0,
  totalCredits: 0,
  usedCredits: 0,
  remainingCredits: 0,
  monthlyUsage: 0,
  lastUpdated: new Date(),
};

const defaultSettings: OrganizationSettings = {
  allowMemberInvites: true,
  requireAdminApproval: false,
  maxMembersPerPlan: 10,
  dataRetentionDays: 90,
  enableAuditLogs: true,
  customSettings: {},
};

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentOrganization: null,
      members: [],
      currentMember: null,
      metrics: null,
      settings: null,
      isLoading: false,
      membersLoading: false,
      error: null,

      // Organization actions
      setOrganization: (organization: Organization) => {
        set({ 
          currentOrganization: organization,
          error: null 
        });
      },

      updateOrganization: (updates: Partial<Organization>) => {
        set((state) => ({
          currentOrganization: state.currentOrganization ? {
            ...state.currentOrganization,
            ...updates,
            updatedAt: new Date(),
          } : null
        }));
      },

      clearOrganization: () => {
        set({
          currentOrganization: null,
          members: [],
          currentMember: null,
          metrics: null,
          settings: null,
          error: null,
        });
      },

      // Member actions
      setMembers: (members: ExtendedOrganizationMember[]) => {
        set({ members, membersLoading: false });
      },

      addMember: (member: ExtendedOrganizationMember) => {
        set((state) => ({
          members: [...state.members, member]
        }));
      },

      updateMember: (memberId: string, updates: Partial<ExtendedOrganizationMember>) => {
        set((state) => ({
          members: state.members.map(member =>
            member.id === memberId
              ? { ...member, ...updates, updatedAt: new Date().toISOString() }
              : member
          )
        }));
      },

      removeMember: (memberId: string) => {
        set((state) => ({
          members: state.members.filter(member => member.id !== memberId)
        }));
      },

      setCurrentMember: (member: ExtendedOrganizationMember | null) => {
        set({ currentMember: member });
      },

      // Member management actions
      inviteMember: (email: string, role: MemberRole) => {
        // This would typically call a service
        const newMember: ExtendedOrganizationMember = {
          id: `temp-${Date.now()}`,
          userId: '',
          organizationId: get().currentOrganization?.id || '',
          employeeId: '',
          joinedAt: new Date(),
          isActive: false,
          reportsGenerated: 0,
          consultationsUsed: 0,
          email,
          role,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        get().addMember(newMember);
      },

      approveMemberRequest: (memberId: string) => {
        get().updateMember(memberId, { status: 'ACTIVE', isActive: true });
      },

      rejectMemberRequest: (memberId: string) => {
        get().removeMember(memberId);
      },

      changeMemberRole: (memberId: string, newRole: MemberRole) => {
        get().updateMember(memberId, { role: newRole });
      },

      suspendMember: (memberId: string) => {
        get().updateMember(memberId, { status: 'SUSPENDED', isActive: false });
      },

      reactivateMember: (memberId: string) => {
        get().updateMember(memberId, { status: 'ACTIVE', isActive: true });
      },

      // Metrics and settings actions
      setMetrics: (metrics: OrganizationMetrics) => {
        set({ metrics });
      },

      updateMetrics: (updates: Partial<OrganizationMetrics>) => {
        set((state) => ({
          metrics: state.metrics ? {
            ...state.metrics,
            ...updates,
            lastUpdated: new Date(),
          } : null
        }));
      },

      setSettings: (settings: OrganizationSettings) => {
        set({ settings });
      },

      updateSettings: (updates: Partial<OrganizationSettings>) => {
        set((state) => ({
          settings: state.settings ? {
            ...state.settings,
            ...updates,
          } : null
        }));
      },

      // Loading and error actions
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setMembersLoading: (loading: boolean) => set({ membersLoading: loading }),
      setError: (error: string | null) => set({ error }),

      // Utility functions
      getMemberByUserId: (userId: string) => {
        return get().members.find(member => member.userId === userId);
      },

      getMembersByRole: (role: MemberRole) => {
        return get().members.filter(member => member.role === role);
      },

      getActiveMembers: () => {
        return get().members.filter(member => member.status === 'ACTIVE' || member.isActive);
      },

      getPendingMembers: () => {
        return get().members.filter(member => member.status === 'PENDING');
      },

      isUserAdmin: (userId: string) => {
        const member = get().getMemberByUserId(userId);
        return member?.role === 'ADMIN' && (member?.status === 'ACTIVE' || member?.isActive);
      },

      isUserMember: (userId: string) => {
        const member = get().getMemberByUserId(userId);
        return Boolean(member?.status === 'ACTIVE' || member?.isActive);
      },

      canInviteMembers: () => {
        const { settings, metrics } = get();
        if (!settings || !metrics) return false;
        
        return settings.allowMemberInvites && 
               metrics.totalMembers < settings.maxMembersPerPlan;
      },

      // Reset
      reset: () => {
        set({
          currentOrganization: null,
          members: [],
          currentMember: null,
          metrics: null,
          settings: null,
          isLoading: false,
          membersLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'organization-storage',
      // Persist organization and member data
      partialize: (state) => ({
        currentOrganization: state.currentOrganization,
        members: state.members,
        currentMember: state.currentMember,
        settings: state.settings,
      }),
    }
  )
); 