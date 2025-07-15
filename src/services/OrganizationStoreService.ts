import { 
  Organization,
  OrganizationMember,
  OrganizationStatus 
} from '../core/types/unified';
import { 
  useOrganizationStore, 
  OrganizationMetrics, 
  OrganizationSettings,
  ExtendedOrganizationMember,
  MemberRole,
  MemberStatus 
} from '../stores/organizationStore';
import { useUserStore } from '../stores/userStore';

/**
 * OrganizationStoreService - Organization Store와 Firebase 서비스 간의 브릿지
 * Store 중심 조직 관리 데이터 흐름을 구현하는 서비스 어댑터
 * 
 * Phase 3: Service Layer 리팩토링 - Store 중심 데이터 흐름 구현
 * 
 * TODO: 실제 Firebase 서비스와의 타입 호환성 조정 필요
 */
export class OrganizationStoreService {
  private static instance: OrganizationStoreService;

  private constructor() {
    // 추후 실제 서비스 인스턴스 연결
  }

  public static getInstance(): OrganizationStoreService {
    if (!OrganizationStoreService.instance) {
      OrganizationStoreService.instance = new OrganizationStoreService();
    }
    return OrganizationStoreService.instance;
  }

  /**
   * 조직 정보 로드 및 Store 업데이트
   */
  async loadOrganization(organizationId: string): Promise<void> {
    const organizationStore = useOrganizationStore.getState();

    try {
      organizationStore.setLoading(true);
      organizationStore.setError(null);

      // TODO: 실제 Firebase 서비스 호출로 교체
      // const organization = await this.organizationService.getOrganization(organizationId);
      
      // 임시 Mock 데이터로 Store 패턴 시연
      const mockOrganization: Organization = {
        id: organizationId,
        name: 'Mock Organization',
        businessNumber: '123-45-67890',
        contactEmail: 'admin@mock.com',
        creditBalance: 1000,
        totalMemberCount: 10,
        volumeTier: 'TIER_0',
        basePrice: 7900,
        discountedPrice: 7900,
        isTrialActive: true,
        trialCreditsUsed: 5,
        trialCreditsTotal: 10,
        servicePackage: 'BASIC',
        status: 'TRIAL',
        adminUserId: 'admin-user-id',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      organizationStore.setOrganization(mockOrganization);

      // 조직 메트릭스와 설정도 함께 로드
      await Promise.all([
        this.loadOrganizationMetrics(organizationId),
        this.loadOrganizationSettings(organizationId)
      ]);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      organizationStore.setError(errorMessage);
      throw error;
    } finally {
      organizationStore.setLoading(false);
    }
  }

  /**
   * 조직 멤버 목록 로드 및 Store 업데이트
   */
  async loadOrganizationMembers(organizationId: string): Promise<void> {
    const organizationStore = useOrganizationStore.getState();

    try {
      organizationStore.setMembersLoading(true);

      // TODO: 실제 Firebase 서비스 호출로 교체
      // const membersResponse = await this.memberService.getOrganizationMembers(organizationId);
      
      // 임시 Mock 데이터로 Store 패턴 시연
      const mockMembers: ExtendedOrganizationMember[] = [
        {
          id: 'member-1',
          userId: 'user-1',
          organizationId,
          employeeId: 'EMP001',
          joinedAt: new Date(),
          isActive: true,
          reportsGenerated: 5,
          consultationsUsed: 2,
          email: 'member1@test.com',
          role: 'ADMIN',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      organizationStore.setMembers(mockMembers);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      organizationStore.setError(errorMessage);
      throw error;
    } finally {
      organizationStore.setMembersLoading(false);
    }
  }

  /**
   * 새 멤버 초대
   */
  async inviteMember(email: string, role: MemberRole): Promise<void> {
    const organizationStore = useOrganizationStore.getState();
    const userStore = useUserStore.getState();

    if (!organizationStore.currentOrganization || !userStore.currentUser) {
      throw new Error('Organization or user not loaded');
    }

    try {
      organizationStore.setLoading(true);

      // TODO: 실제 Firebase 서비스 호출로 교체
      // await this.memberService.inviteMember(inviteRequest);

      // Store의 임시 멤버 추가 (실제 멤버는 수락 후 추가됨)
      organizationStore.inviteMember(email, role);
      
      // 메트릭스 업데이트
      await this.loadOrganizationMetrics(organizationStore.currentOrganization.id);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invitation failed';
      organizationStore.setError(errorMessage);
      throw error;
    } finally {
      organizationStore.setLoading(false);
    }
  }

  /**
   * 멤버 역할 변경
   */
  async changeMemberRole(memberId: string, newRole: MemberRole): Promise<void> {
    const organizationStore = useOrganizationStore.getState();

    try {
      organizationStore.setLoading(true);

      // TODO: 실제 Firebase 서비스 호출로 교체
      // await this.memberService.updateMember(memberId, { role: newRole });

      // Store 업데이트
      organizationStore.changeMemberRole(memberId, newRole);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Role change failed';
      organizationStore.setError(errorMessage);
      throw error;
    } finally {
      organizationStore.setLoading(false);
    }
  }

  /**
   * 멤버 제거/정지
   */
  async suspendMember(memberId: string): Promise<void> {
    const organizationStore = useOrganizationStore.getState();

    try {
      organizationStore.setLoading(true);

      // TODO: 실제 Firebase 서비스 호출로 교체
      // await this.memberService.updateMember(memberId, { status: 'SUSPENDED' });

      organizationStore.suspendMember(memberId);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Suspend failed';
      organizationStore.setError(errorMessage);
      throw error;
    } finally {
      organizationStore.setLoading(false);
    }
  }

  /**
   * 조직 정보 업데이트
   */
  async updateOrganization(updates: Partial<Organization>): Promise<void> {
    const organizationStore = useOrganizationStore.getState();
    const userStore = useUserStore.getState();

    if (!organizationStore.currentOrganization || !userStore.currentUser) {
      throw new Error('No organization or user loaded');
    }

    try {
      organizationStore.setLoading(true);

      // TODO: 실제 Firebase 서비스 호출로 교체
      // await this.organizationService.updateOrganization(organizationId, updates, userId);

      organizationStore.updateOrganization(updates);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Update failed';
      organizationStore.setError(errorMessage);
      throw error;
    } finally {
      organizationStore.setLoading(false);
    }
  }

  /**
   * 조직 메트릭스 로드
   */
  private async loadOrganizationMetrics(organizationId: string): Promise<void> {
    try {
      // TODO: 실제 Firebase 서비스 호출로 교체
      // const stats = await this.organizationService.getOrganizationStats(organizationId);
      
      // 임시 Mock 데이터
      const metrics: OrganizationMetrics = {
        totalMembers: 10,
        activeMembers: 8,
        totalCredits: 1000,
        usedCredits: 200,
        remainingCredits: 800,
        monthlyUsage: 50,
        lastUpdated: new Date(),
      };

      useOrganizationStore.getState().setMetrics(metrics);

    } catch (error) {
      console.error('Failed to load organization metrics:', error);
    }
  }

  /**
   * 조직 설정 로드
   */
  private async loadOrganizationSettings(organizationId: string): Promise<void> {
    try {
      // TODO: 실제 Firebase 서비스 호출로 교체
      
      const defaultSettings: OrganizationSettings = {
        allowMemberInvites: true,
        requireAdminApproval: false,
        maxMembersPerPlan: 50,
        dataRetentionDays: 90,
        enableAuditLogs: true,
        customSettings: {},
      };

      useOrganizationStore.getState().setSettings(defaultSettings);

    } catch (error) {
      console.error('Failed to load organization settings:', error);
    }
  }

  /**
   * Store 상태 조회 헬퍼들
   */
  getCurrentOrganization(): Organization | null {
    return useOrganizationStore.getState().currentOrganization;
  }

  getMembers(): ExtendedOrganizationMember[] {
    return useOrganizationStore.getState().members;
  }

  getActiveMembers(): ExtendedOrganizationMember[] {
    return useOrganizationStore.getState().getActiveMembers();
  }

  isLoading(): boolean {
    return useOrganizationStore.getState().isLoading;
  }

  isMembersLoading(): boolean {
    return useOrganizationStore.getState().membersLoading;
  }

  getError(): string | null {
    return useOrganizationStore.getState().error;
  }

  /**
   * 권한 체크 헬퍼들
   */
  canInviteMembers(): boolean {
    return useOrganizationStore.getState().canInviteMembers();
  }

  isUserOrgAdmin(userId: string): boolean {
    return useOrganizationStore.getState().isUserAdmin(userId);
  }
} 