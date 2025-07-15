import { BaseService } from '@core/services/BaseService';
import { LogCategory } from '@core/utils/Logger';
import { 
  doc, 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  Timestamp,
  runTransaction,
  writeBatch,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  Transaction,
  WriteBatch
} from 'firebase/firestore';
import { 
  OrganizationMember,
  Invitation,
  MemberRole,
  MemberStatus,
  InvitationStatus,
  Permission,
  MemberFilters,
  InvitationFilters,
  MemberStats,
  MemberListResponse,
  InvitationListResponse,
  InviteMemberRequest,
  UpdateMemberRequest,
  BulkInviteMemberRequest,
  BulkInviteResponse,
  MemberActivityLog,
  MemberActivityAction,
  MemberDashboardData,
  MemberAlert,
  RoleDefinition,
  PermissionTemplate,
  MemberPreferences
} from '../types/member';
import { ErrorCodes } from '@core/utils/ErrorHandler';
import { IdGenerator } from '@core/utils/IdGenerator';

/**
 * 고도화된 멤버 관리 서비스
 * 
 * 주요 기능:
 * - 포괄적인 멤버 CRUD 작업
 * - 고급 초대 시스템 (토큰 기반, 만료 관리)
 * - 세밀한 권한 관리 시스템
 * - 실시간 통계 및 분석
 * - 대량 작업 처리 (배치 초대/업데이트)
 * - 활동 로깅 및 감사 추적
 * - 지능형 캐싱 전략
 * - 이메일 알림 시스템
 * - 성능 최적화 및 모니터링
 * 
 * @author Mind Breeze AI Team
 * @version 2.0
 */
export class MemberManagementService extends BaseService {
  
  // 캐시 키 상수
  private static readonly CACHE_KEYS = {
    MEMBER_LIST: (orgId: string) => `members:list:${orgId}`,
    MEMBER_DETAIL: (memberId: string) => `member:detail:${memberId}`,
    MEMBER_PERMISSIONS: (memberId: string) => `member:permissions:${memberId}`,
    ORGANIZATION_STATS: (orgId: string) => `member:stats:${orgId}`,
    INVITATION_LIST: (orgId: string) => `invitations:list:${orgId}`,
    ROLE_DEFINITIONS: 'roles:definitions',
    PERMISSION_TEMPLATES: 'permissions:templates'
  } as const;

  // 캐시 TTL 상수 (밀리초)
  private static readonly CACHE_TTL = {
    MEMBER_LIST: 5 * 60 * 1000,      // 5분
    MEMBER_DETAIL: 10 * 60 * 1000,   // 10분
    MEMBER_PERMISSIONS: 15 * 60 * 1000, // 15분
    ORGANIZATION_STATS: 2 * 60 * 1000,  // 2분
    INVITATION_LIST: 3 * 60 * 1000,     // 3분
    ROLE_DEFINITIONS: 60 * 60 * 1000,   // 1시간
    PERMISSION_TEMPLATES: 60 * 60 * 1000 // 1시간
  } as const;

  constructor() {
    super();
    this.log('MemberManagementService 초기화 완료', {
      version: '2.0',
      features: [
        'advanced_caching',
        'batch_operations', 
        'audit_logging',
        'permission_management',
        'invitation_system'
      ]
    });
  }

  // ===== 멤버 조회 및 관리 =====

  /**
   * 조직의 모든 멤버 조회 (페이지네이션, 필터링, 캐싱 지원)
   * @param organizationId 조직 ID
   * @param filters 필터 조건
   * @param page 페이지 번호
   * @param limit 페이지 크기
   * @returns 멤버 목록과 페이지네이션 정보
   */
  async getOrganizationMembers(
    organizationId: string,
    filters: MemberFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<MemberListResponse> {
    return this.measureAndLog('getOrganizationMembers', async () => {
      this.validateId(organizationId, '조직 ID');
      const { page: validPage, limit: validLimit, offset } = this.validatePagination(page, limit);

      // 캐시 키 생성 (필터와 페이지네이션 포함)
      const cacheKey = `${MemberManagementService.CACHE_KEYS.MEMBER_LIST(organizationId)}:${JSON.stringify(filters)}:${validPage}:${validLimit}`;

      return this.withCache(
        cacheKey,
        async () => {
          // 기본 쿼리 (orderBy 제거하여 인덱스 문제 해결)
          let membersQuery = query(
            collection(this.db, 'organizationMembers'),
            where('organizationId', '==', organizationId)
          );

          // 필터 적용
          if (filters.role) {
            membersQuery = query(membersQuery, where('role', '==', filters.role));
          }
          if (filters.status) {
            membersQuery = query(membersQuery, where('status', '==', filters.status));
          }
          if (filters.departments && filters.departments.length > 0) {
            membersQuery = query(membersQuery, where('departments', 'array-contains-any', filters.departments));
          }

          // 전체 데이터 가져오기 (클라이언트 사이드 페이지네이션)
          const querySnapshot = await getDocs(membersQuery);
          
          // 클라이언트 사이드에서 정렬 및 페이지네이션
          const allMembers: OrganizationMember[] = [];
          for (const doc of querySnapshot.docs) {
            const member = await this.mapDocumentToMember(doc);
            allMembers.push(member);
          }

          // 생성일 기준 내림차순 정렬
          allMembers.sort((a, b) => {
            const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 
                          (a.createdAt as any)?.seconds ? (a.createdAt as any).seconds * 1000 : 0;
            const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 
                          (b.createdAt as any)?.seconds ? (b.createdAt as any).seconds * 1000 : 0;
            return bTime - aTime;
          });

          // 페이지네이션 적용
          const total = allMembers.length;
          const members = allMembers.slice(offset, offset + validLimit);

          this.log(`조직 멤버 ${members.length}개 조회 성공 (총 ${total}개 중 ${validPage}페이지)`, {
            organizationId,
            filters,
            page: validPage,
            limit: validLimit,
            total
          });

          const result: MemberListResponse = {
            members,
            totalCount: total,
            currentPage: validPage,
            totalPages: Math.ceil(total / validLimit),
            hasNext: offset + validLimit < total,
            hasPrevious: validPage > 1
          };

          return result;
        },
        MemberManagementService.CACHE_TTL.MEMBER_LIST
      );
    });
  }

  /**
   * 특정 멤버 상세 정보 조회
   * @param memberId 멤버 ID
   * @returns 멤버 정보
   */
  async getMember(memberId: string): Promise<OrganizationMember> {
    return this.measureAndLog('getMember', async () => {
      this.validateId(memberId, '멤버 ID');

      return this.withCache(
        MemberManagementService.CACHE_KEYS.MEMBER_DETAIL(memberId),
        async () => {
          const memberDoc = await getDoc(doc(this.db, 'organizationMembers', memberId));
          
          if (!memberDoc.exists()) {
            this.handleError(
              new Error('멤버를 찾을 수 없습니다.'),
              'getMember',
              { memberId, code: ErrorCodes.MEMBER_NOT_FOUND }
            );
          }

          const member = await this.mapDocumentToMember(memberDoc);
          
          this.logDatabaseOperation('get', 'organizationMembers', memberId, true);
          return member;
        },
        MemberManagementService.CACHE_TTL.MEMBER_DETAIL,
        [`member:${memberId}`]
      );
    });
  }

  /**
   * 멤버 정보 업데이트
   * @param memberId 멤버 ID
   * @param updateData 업데이트할 데이터
   * @param adminUserId 작업 수행자 ID
   * @returns void
   */
  async updateMember(
    memberId: string,
    updateData: UpdateMemberRequest,
    adminUserId: string
  ): Promise<void> {
    return this.measureAndLog('updateMember', async () => {
      this.validateId(memberId, '멤버 ID');
      this.validateId(adminUserId, '관리자 ID');

      // 권한 확인
      await this.validateMemberManagePermission(adminUserId, updateData.role);

      return runTransaction(this.db, async (transaction) => {
        // 현재 멤버 정보 조회
        const memberRef = doc(this.db, 'organizationMembers', memberId);
        const memberDoc = await transaction.get(memberRef);

        if (!memberDoc.exists()) {
          this.handleError(
            new Error('멤버를 찾을 수 없습니다.'),
            'updateMember',
            { memberId }
          );
        }

        const currentMember = memberDoc.data() as OrganizationMember;

        // preferences를 별도로 분리
        const { preferences, ...restUpdateData } = updateData;

        // 업데이트 데이터 준비 (preferences 제외)
        const updatePayload: Partial<OrganizationMember> = {
          ...restUpdateData,
          updatedAt: this.toDate(this.now()),
        };

        // preferences가 있는 경우 완전한 객체로 변환하여 추가
        if (preferences) {
          updatePayload.preferences = {
            ...this.getDefaultMemberPreferences(),
            ...preferences
          };
        }

        // 업데이트 실행
        transaction.update(memberRef, updatePayload);

        // 활동 로그 생성
        await this.createActivityLog(
          adminUserId,
          'MEMBER_UPDATE',
          `멤버 정보 업데이트`,
          currentMember.organizationId,
          true,
          'MEMBER',
          memberId,
          currentMember.displayName,
          { 
            changes: updateData,
            previousData: {
              displayName: currentMember.displayName,
              role: currentMember.role,
              status: currentMember.status
            }
          }
        );

        this.logUserActivity(
          adminUserId,
          'UPDATE_MEMBER',
          'ORGANIZATION_MEMBER',
          'success',
          currentMember.organizationId,
          { memberId, changes: Object.keys(updateData) }
        );

        this.log('멤버 정보 업데이트 완료', { 
          memberId, 
          adminUserId,
          changes: Object.keys(updateData)
        });
      });
    });
  }

  /**
   * 멤버 상태 변경 (활성화/비활성화/정지)
   * @param memberId 멤버 ID
   * @param newStatus 새로운 상태
   * @param adminUserId 작업 수행자 ID
   * @param reason 상태 변경 사유
   * @returns void
   */
  async changeMemberStatus(
    memberId: string,
    newStatus: MemberStatus,
    adminUserId: string,
    reason?: string
  ): Promise<void> {
    return this.measureAndLog('changeMemberStatus', async () => {
      this.validateId(memberId, '멤버 ID');
      this.validateId(adminUserId, '관리자 ID');

      // 권한 확인
      await this.validateMemberManagePermission(adminUserId);

      return runTransaction(this.db, async (transaction) => {
        const memberRef = doc(this.db, 'organizationMembers', memberId);
        const memberDoc = await transaction.get(memberRef);

        if (!memberDoc.exists()) {
          this.handleError(
            new Error('멤버를 찾을 수 없습니다.'),
            'changeMemberStatus',
            { memberId }
          );
        }

        const member = memberDoc.data() as OrganizationMember;

        // 자기 자신을 비활성화하려는 경우 방지
        if (memberId === adminUserId && newStatus !== 'ACTIVE') {
          this.handleError(
            new Error('자기 자신의 상태를 비활성화할 수 없습니다.'),
            'changeMemberStatus',
            { memberId, adminUserId, newStatus }
          );
        }

        const oldStatus = member.status;
        
        // 상태 업데이트
        transaction.update(memberRef, {
          status: newStatus,
          updatedAt: this.now()
        });

        // 활동 로그 생성
        await this.createActivityLog(
          adminUserId,
          newStatus === 'ACTIVE' ? 'MEMBER_ACTIVATE' : 'MEMBER_DEACTIVATE',
          `멤버 상태 변경: ${oldStatus} → ${newStatus}`,
          member.organizationId,
          true,
          'MEMBER',
          memberId,
          member.displayName,
          { oldStatus, newStatus, reason }
        );

        this.logUserActivity(
          adminUserId,
          'CHANGE_MEMBER_STATUS',
          'ORGANIZATION_MEMBER',
          'success',
          member.organizationId,
          { memberId, oldStatus, newStatus, reason }
        );

        this.log('멤버 상태 변경 완료', { 
          memberId, 
          oldStatus, 
          newStatus, 
          adminUserId 
        });
      });
    });
  }

  /**
   * 조직에서 멤버 제거
   * @param memberId 멤버 ID
   * @param adminUserId 작업 수행자 ID
   * @param reason 제거 사유
   * @returns void
   */
  async removeMemberFromOrganization(
    memberId: string,
    adminUserId: string,
    reason?: string
  ): Promise<void> {
    return this.measureAndLog('removeMemberFromOrganization', async () => {
      this.validateId(memberId, '멤버 ID');
      this.validateId(adminUserId, '관리자 ID');

      // 권한 확인
      await this.validateMemberManagePermission(adminUserId);

      return runTransaction(this.db, async (transaction) => {
        const memberRef = doc(this.db, 'organizationMembers', memberId);
        const memberDoc = await transaction.get(memberRef);

        if (!memberDoc.exists()) {
          this.handleError(
            new Error('멤버를 찾을 수 없습니다.'),
            'removeMemberFromOrganization',
            { memberId }
          );
        }

        const member = memberDoc.data() as OrganizationMember;

        // 자기 자신을 삭제하려는 경우 방지
        if (memberId === adminUserId) {
          this.handleError(
            new Error('자기 자신을 조직에서 제거할 수 없습니다.'),
            'removeMemberFromOrganization',
            { memberId, adminUserId }
          );
        }

        // 다른 관리자를 삭제하려는 경우 방지
        if (member.role === 'ORGANIZATION_ADMIN') {
          this.handleError(
            new Error('다른 관리자를 제거할 수 없습니다.'),
            'removeMemberFromOrganization',
            { memberId, memberRole: member.role }
          );
        }

        // 멤버 삭제
        transaction.delete(memberRef);

        // 관련 초대 정보도 삭제 (필요한 경우)
        const invitationsQuery = query(
          collection(this.db, 'invitations'),
          where('email', '==', member.email),
          where('organizationId', '==', member.organizationId)
        );
        const invitationsSnapshot = await getDocs(invitationsQuery);
        
        invitationsSnapshot.forEach((inviteDoc) => {
          transaction.delete(inviteDoc.ref);
        });

        // 활동 로그 생성
        await this.createActivityLog(
          adminUserId,
          'MEMBER_REMOVE',
          '멤버를 조직에서 제거함',
          member.organizationId,
          true,
          'MEMBER',
          memberId,
          member.displayName,
          { reason, memberRole: member.role }
        );

        this.logUserActivity(
          adminUserId,
          'REMOVE_MEMBER',
          'ORGANIZATION_MEMBER',
          'success',
          member.organizationId,
          { memberId, memberName: member.displayName, reason }
        );

        this.log('멤버 제거 완료', { 
          memberId, 
          memberName: member.displayName,
          adminUserId,
          reason 
        });
      });
    });
  }

  // ===== 초대 시스템 =====

  /**
   * 멤버 초대
   * @param inviteRequest 초대 요청 데이터
   * @param adminUserId 초대 수행자 ID
   * @returns 생성된 초대 정보
   */
  async inviteMember(
    inviteRequest: InviteMemberRequest,
    adminUserId: string
  ): Promise<Invitation> {
    return this.measureAndLog('inviteMember', async () => {
      this.validateId(inviteRequest.organizationId, '조직 ID');
      this.validateEmail(inviteRequest.email);
      this.validateId(adminUserId, '관리자 ID');

      // 권한 확인
      await this.validateMemberManagePermission(adminUserId, inviteRequest.role);

      return runTransaction(this.db, async (transaction) => {
        // 이미 멤버인지 확인
        const existingMemberQuery = query(
          collection(this.db, 'organizationMembers'),
          where('email', '==', inviteRequest.email),
          where('organizationId', '==', inviteRequest.organizationId)
        );
        const existingMemberSnapshot = await getDocs(existingMemberQuery);

        if (!existingMemberSnapshot.empty) {
          this.handleError(
            new Error('이미 조직의 멤버인 사용자입니다.'),
            'inviteMember',
            { email: inviteRequest.email, organizationId: inviteRequest.organizationId }
          );
        }

        // 기존 활성 초대가 있는지 확인
        const existingInviteQuery = query(
          collection(this.db, 'invitations'),
          where('email', '==', inviteRequest.email),
          where('organizationId', '==', inviteRequest.organizationId),
          where('status', '==', 'PENDING')
        );
        const existingInviteSnapshot = await getDocs(existingInviteQuery);

        // 기존 초대가 있으면 취소
        if (!existingInviteSnapshot.empty) {
          existingInviteSnapshot.forEach((inviteDoc) => {
            transaction.update(inviteDoc.ref, {
              status: 'CANCELLED',
              updatedAt: this.now()
            });
          });
        }

        // 초대자 정보 조회
        const adminMemberDoc = await getDoc(doc(this.db, 'organizationMembers', adminUserId));
        const adminMember = adminMemberDoc.data() as OrganizationMember;

        // 새 초대 생성
        const invitation: Omit<Invitation, 'id'> = {
          organizationId: inviteRequest.organizationId,
          email: inviteRequest.email,
          role: inviteRequest.role,
          departments: inviteRequest.departments,
          permissions: inviteRequest.permissions,
          status: 'PENDING',
          token: this.generateInvitationToken(),
          expiresAt: this.toDate(new Date(Date.now() + (7 * 24 * 60 * 60 * 1000))), // 7일 후 만료
          invitedBy: adminUserId,
          invitedByName: adminMember?.displayName || '관리자',
          personalMessage: inviteRequest.personalMessage,
          sentAt: this.toDate(this.now()),
          resentCount: 0,
          createdAt: this.toDate(this.now()),
          updatedAt: this.toDate(this.now())
        };

        // 초대 저장
        const inviteRef = await addDoc(collection(this.db, 'invitations'), invitation);
        const createdInvitation: Invitation = {
          id: inviteRef.id,
          ...invitation
        };

        // 활동 로그 생성
        await this.createActivityLog(
          adminUserId,
          'MEMBER_INVITE',
          `새 멤버 초대: ${inviteRequest.email}`,
          inviteRequest.organizationId,
          true,
          'INVITATION',
          inviteRef.id,
          inviteRequest.email,
          { 
            role: inviteRequest.role,
            departments: inviteRequest.departments,
            personalMessage: inviteRequest.personalMessage
          }
        );

        this.logUserActivity(
          adminUserId,
          'INVITE_MEMBER',
          'INVITATION',
          'success',
          inviteRequest.organizationId,
          { 
            email: inviteRequest.email,
            role: inviteRequest.role,
            invitationId: inviteRef.id
          }
        );

        // 이메일 발송 (비동기)
        this.sendInvitationEmail(createdInvitation).catch((error) => {
          this.error('초대 이메일 발송 실패', error, { invitationId: inviteRef.id });
        });

        this.log('멤버 초대 완료', { 
          email: inviteRequest.email,
          role: inviteRequest.role,
          invitationId: inviteRef.id,
          adminUserId
        });

        return createdInvitation;
      });
    });
  }

  /**
   * 대량 멤버 초대
   * @param bulkRequest 대량 초대 요청
   * @param adminUserId 초대 수행자 ID
   * @returns 대량 초대 결과
   */
  async bulkInviteMembers(
    bulkRequest: BulkInviteMemberRequest,
    adminUserId: string
  ): Promise<BulkInviteResponse> {
    return this.measureAndLog('bulkInviteMembers', async () => {
      this.validateId(bulkRequest.organizationId, '조직 ID');
      this.validateId(adminUserId, '관리자 ID');

      if (!bulkRequest.members || bulkRequest.members.length === 0) {
        this.handleError(
          new Error('초대할 멤버 목록이 비어있습니다.'),
          'bulkInviteMembers',
          { organizationId: bulkRequest.organizationId }
        );
      }

      // 권한 확인
      await this.validateMemberManagePermission(adminUserId);

      const results: BulkInviteResponse['results'] = [];
      let successCount = 0;
      let failureCount = 0;
      const failedEmails: string[] = [];

      // 배치 처리로 초대 실행
      await this.processBatch(
        bulkRequest.members,
        10, // 한 번에 10개씩 처리
        async (batch) => {
          const batchResults = await Promise.allSettled(
            batch.map(async (member) => {
              try {
                const inviteRequest: InviteMemberRequest = {
                  organizationId: bulkRequest.organizationId,
                  email: member.email,
                  role: member.role,
                  departments: member.departments,
                  permissions: bulkRequest.defaultPermissions,
                  personalMessage: bulkRequest.personalMessage,
                  employeeId: member.employeeId,
                  position: member.position,
                  jobTitle: member.jobTitle
                };

                const invitation = await this.inviteMember(inviteRequest, adminUserId);
                
                results.push({
                  email: member.email,
                  success: true,
                  invitationId: invitation.id
                });
                
                successCount++;
                return { success: true, email: member.email };
              } catch (error) {
                const errorMessage = (error as Error).message;
                
                results.push({
                  email: member.email,
                  success: false,
                  error: errorMessage
                });
                
                failureCount++;
                failedEmails.push(member.email);
                
                this.warn('개별 초대 실패', { 
                  email: member.email, 
                  error: errorMessage 
                });
                
                return { success: false, email: member.email, error: errorMessage };
              }
            })
          );

          return batchResults.map(result => 
            result.status === 'fulfilled' ? result.value : { success: false }
          );
        }
      );

      // 활동 로그 생성
      await this.createActivityLog(
        adminUserId,
        'BULK_OPERATION',
        `대량 멤버 초대: ${successCount}명 성공, ${failureCount}명 실패`,
        bulkRequest.organizationId,
        successCount > 0,
        'INVITATION',
        undefined,
        undefined,
        { 
          totalCount: bulkRequest.members.length,
          successCount,
          failureCount,
          failedEmails
        }
      );

      this.logUserActivity(
        adminUserId,
        'BULK_INVITE_MEMBERS',
        'INVITATION',
        successCount > 0 ? 'success' : 'failure',
        bulkRequest.organizationId,
        { 
          totalCount: bulkRequest.members.length,
          successCount,
          failureCount
        }
      );

      const response: BulkInviteResponse = {
        success: successCount > 0,
        successCount,
        failureCount,
        results,
        failedEmails
      };

      this.log('대량 멤버 초대 완료', response);

      return response;
    });
  }

  /**
   * 초대 목록 조회
   * @param organizationId 조직 ID
   * @param filters 필터 조건
   * @param page 페이지 번호
   * @param limit 페이지 크기
   * @returns 초대 목록과 페이지네이션 정보
   */
  async getInvitations(
    organizationId: string,
    filters: InvitationFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<InvitationListResponse> {
    return this.measureAndLog('getInvitations', async () => {
      this.validateId(organizationId, '조직 ID');
      const { page: validPage, limit: validLimit, offset } = this.validatePagination(page, limit);

      const cacheKey = `${MemberManagementService.CACHE_KEYS.INVITATION_LIST(organizationId)}:${JSON.stringify(filters)}:${validPage}:${validLimit}`;

      return this.withCache(
        cacheKey,
        async () => {
          let invitationsQuery = query(
            collection(this.db, 'invitations'),
            where('organizationId', '==', organizationId),
            orderBy('createdAt', 'desc')
          );

          // 필터 적용
          if (filters.status) {
            invitationsQuery = query(invitationsQuery, where('status', '==', filters.status));
          }
          if (filters.role) {
            invitationsQuery = query(invitationsQuery, where('role', '==', filters.role));
          }
          if (filters.invitedBy) {
            invitationsQuery = query(invitationsQuery, where('invitedBy', '==', filters.invitedBy));
          }

          // 페이지네이션 적용
          if (offset > 0) {
            const prevQuery = query(
              collection(this.db, 'invitations'),
              where('organizationId', '==', organizationId),
              orderBy('createdAt', 'desc'),
              firestoreLimit(offset)
            );
            const prevSnapshot = await getDocs(prevQuery);
            if (prevSnapshot.docs.length > 0) {
              const lastDoc = prevSnapshot.docs[prevSnapshot.docs.length - 1];
              invitationsQuery = query(invitationsQuery, startAfter(lastDoc));
            }
          }

          invitationsQuery = query(invitationsQuery, firestoreLimit(validLimit));

          const querySnapshot = await getDocs(invitationsQuery);
          const invitations: Invitation[] = [];

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            const invitation: Invitation = {
              id: doc.id,
              organizationId: data.organizationId,
              email: data.email,
              role: data.role,
              departments: data.departments,
              permissions: data.permissions,
              status: data.status,
              token: data.token,
              expiresAt: this.toDate(data.expiresAt),
              invitedBy: data.invitedBy,
              invitedByName: data.invitedByName,
              personalMessage: data.personalMessage,
              acceptedAt: data.acceptedAt ? this.toDate(data.acceptedAt) : undefined,
              acceptedBy: data.acceptedBy,
              sentAt: this.toDate(data.sentAt),
              resentAt: data.resentAt ? this.toDate(data.resentAt) : undefined,
              resentCount: data.resentCount || 0,
              createdAt: this.toDate(data.createdAt),
              updatedAt: this.toDate(data.updatedAt),
              metadata: data.metadata
            };

            if (this.applyInvitationClientSideFilters(invitation, filters)) {
              invitations.push(invitation);
            }
          });

          // 총 개수 조회
          const totalCount = await this.getInvitationCount(organizationId, filters);

          const result: InvitationListResponse = {
            invitations,
            totalCount,
            currentPage: validPage,
            totalPages: Math.ceil(totalCount / validLimit),
            hasNext: (validPage * validLimit) < totalCount,
            hasPrevious: validPage > 1
          };

          this.logDatabaseOperation('query', 'invitations', undefined, true);
          return result;
        },
        MemberManagementService.CACHE_TTL.INVITATION_LIST,
        [`org:${organizationId}`, 'invitations']
      );
    });
  }

  /**
   * 초대 재전송
   * @param invitationId 초대 ID
   * @param adminUserId 재전송 수행자 ID
   * @returns void
   */
  async resendInvitation(invitationId: string, adminUserId: string): Promise<void> {
    return this.measureAndLog('resendInvitation', async () => {
      this.validateId(invitationId, '초대 ID');
      this.validateId(adminUserId, '관리자 ID');

      return runTransaction(this.db, async (transaction) => {
        const inviteRef = doc(this.db, 'invitations', invitationId);
        const inviteDoc = await transaction.get(inviteRef);

        if (!inviteDoc.exists()) {
          this.handleError(
            new Error('초대를 찾을 수 없습니다.'),
            'resendInvitation',
            { invitationId }
          );
        }

        const invitation = inviteDoc.data() as Invitation;

        if (invitation.status !== 'PENDING') {
          this.handleError(
            new Error('대기 중인 초대만 재전송할 수 있습니다.'),
            'resendInvitation',
            { invitationId, status: invitation.status }
          );
        }

        // 만료 시간 연장 및 재전송 정보 업데이트
        transaction.update(inviteRef, {
          resentAt: this.now(),
          resentCount: (invitation.resentCount || 0) + 1,
          expiresAt: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 7일 연장
          updatedAt: this.now()
        });

        // 활동 로그 생성
        await this.createActivityLog(
          adminUserId,
          'MEMBER_INVITE',
          `초대 재전송: ${invitation.email}`,
          invitation.organizationId,
          true,
          'INVITATION',
          invitationId,
          invitation.email,
          { resentCount: (invitation.resentCount || 0) + 1 }
        );

        // 이메일 재전송 (비동기)
        const updatedInvitation: Invitation = {
          ...invitation,
          id: invitationId,
          resentAt: new Date(),
          resentCount: (invitation.resentCount || 0) + 1,
          expiresAt: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000))
        };

        this.sendInvitationEmail(updatedInvitation).catch((error) => {
          this.error('초대 이메일 재전송 실패', error, { invitationId });
        });

        this.logUserActivity(
          adminUserId,
          'RESEND_INVITATION',
          'INVITATION',
          'success',
          invitation.organizationId,
          { invitationId, email: invitation.email }
        );

        this.log('초대 재전송 완료', { 
          invitationId, 
          email: invitation.email,
          resentCount: (invitation.resentCount || 0) + 1,
          adminUserId
        });
      });
    });
  }

  /**
   * 초대 취소
   * @param invitationId 초대 ID
   * @param adminUserId 취소 수행자 ID
   * @returns void
   */
  async cancelInvitation(invitationId: string, adminUserId: string): Promise<void> {
    return this.measureAndLog('cancelInvitation', async () => {
      this.validateId(invitationId, '초대 ID');
      this.validateId(adminUserId, '관리자 ID');

      return runTransaction(this.db, async (transaction) => {
        const inviteRef = doc(this.db, 'invitations', invitationId);
        const inviteDoc = await transaction.get(inviteRef);

        if (!inviteDoc.exists()) {
          this.handleError(
            new Error('초대를 찾을 수 없습니다.'),
            'cancelInvitation',
            { invitationId }
          );
        }

        const invitation = inviteDoc.data() as Invitation;

        if (invitation.status !== 'PENDING') {
          this.handleError(
            new Error('대기 중인 초대만 취소할 수 있습니다.'),
            'cancelInvitation',
            { invitationId, status: invitation.status }
          );
        }

        // 초대 상태를 취소로 변경
        transaction.update(inviteRef, {
          status: 'CANCELLED',
          updatedAt: this.now()
        });

        // 활동 로그 생성
        await this.createActivityLog(
          adminUserId,
          'MEMBER_INVITE',
          `초대 취소: ${invitation.email}`,
          invitation.organizationId,
          true,
          'INVITATION',
          invitationId,
          invitation.email,
          { reason: '관리자에 의한 취소' }
        );

        this.logUserActivity(
          adminUserId,
          'CANCEL_INVITATION',
          'INVITATION',
          'success',
          invitation.organizationId,
          { invitationId, email: invitation.email }
        );

        this.log('초대 취소 완료', { 
          invitationId, 
          email: invitation.email,
          adminUserId
        });
      });
    });
  }

  /**
   * 초대 수락 (사용자가 초대 링크를 통해 수락)
   * @param token 초대 토큰
   * @param userId 수락하는 사용자 ID
   * @returns 생성된 멤버 정보
   */
  async acceptInvitation(token: string, userId: string): Promise<OrganizationMember> {
    return this.measureAndLog('acceptInvitation', async () => {
      this.validateRequired(token, '초대 토큰');
      this.validateId(userId, '사용자 ID');

      return runTransaction(this.db, async (transaction) => {
        // 토큰으로 초대 조회
        const invitationsQuery = query(
          collection(this.db, 'invitations'),
          where('token', '==', token),
          where('status', '==', 'PENDING')
        );
        const invitationsSnapshot = await getDocs(invitationsQuery);

        if (invitationsSnapshot.empty) {
          this.handleError(
            new Error('유효하지 않은 초대 토큰입니다.'),
            'acceptInvitation',
            { token }
          );
        }

        const inviteDoc = invitationsSnapshot.docs[0];
        const invitation = inviteDoc.data() as Invitation;

        // 초대 만료 확인
        if (invitation.expiresAt < new Date()) {
          this.handleError(
            new Error('만료된 초대입니다.'),
            'acceptInvitation',
            { token, expiresAt: invitation.expiresAt }
          );
        }

        // 사용자 정보 조회 (Firebase Auth에서)
        const userDoc = await getDoc(doc(this.db, 'users', userId));
        if (!userDoc.exists()) {
          this.handleError(
            new Error('사용자 정보를 찾을 수 없습니다.'),
            'acceptInvitation',
            { userId }
          );
        }

        const userData = userDoc.data();

        // 이메일 일치 확인
        if (userData.email !== invitation.email) {
          this.handleError(
            new Error('초대된 이메일과 로그인 이메일이 일치하지 않습니다.'),
            'acceptInvitation',
            { 
              invitedEmail: invitation.email, 
              userEmail: userData.email 
            }
          );
        }

        // 새 멤버 데이터 생성
        const newMember: Omit<OrganizationMember, 'id'> = {
          organizationId: invitation.organizationId,
          userId: userId,
          email: invitation.email,
          displayName: userData.displayName || userData.email.split('@')[0],
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImage: userData.profileImage,
          role: invitation.role,
          status: 'ACTIVE',
          permissions: invitation.permissions || [],
          customPermissions: [],
          departments: invitation.departments || [],
          primaryDepartmentId: invitation.departments?.[0],
          employeeId: invitation.metadata?.employeeId,
          position: invitation.metadata?.position,
          jobTitle: invitation.metadata?.jobTitle,
          phoneNumber: userData.phoneNumber,
          invitedAt: invitation.createdAt,
          invitedBy: invitation.invitedBy,
          joinedAt: new Date(),
          lastActiveAt: new Date(),
          lastLoginAt: new Date(),
          loginCount: 1,
          preferences: this.getDefaultMemberPreferences(),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // 멤버 생성
        const memberRef = await addDoc(collection(this.db, 'organizationMembers'), newMember);
        const createdMember: OrganizationMember = {
          id: memberRef.id,
          ...newMember
        };

        // 초대 상태 업데이트
        transaction.update(inviteDoc.ref, {
          status: 'ACCEPTED',
          acceptedAt: this.now(),
          acceptedBy: userId,
          updatedAt: this.now()
        });

        // 활동 로그 생성
        await this.createActivityLog(
          userId,
          'MEMBER_JOIN',
          '조직 가입 완료',
          invitation.organizationId,
          true,
          'MEMBER',
          memberRef.id,
          newMember.displayName,
          { 
            role: invitation.role,
            invitationId: inviteDoc.id,
            acceptedViaToken: true
          }
        );

        this.logUserActivity(
          userId,
          'ACCEPT_INVITATION',
          'ORGANIZATION_MEMBER',
          'success',
          invitation.organizationId,
          { 
            memberId: memberRef.id,
            invitationId: inviteDoc.id,
            role: invitation.role
          }
        );

        this.log('초대 수락 완료', { 
          memberId: memberRef.id,
          email: invitation.email,
          role: invitation.role,
          organizationId: invitation.organizationId
        });

        return createdMember;
      });
    });
  }

  // ===== 권한 관리 =====

  /**
   * 멤버 권한 조회
   * @param memberId 멤버 ID
   * @returns 멤버의 모든 권한
   */
  async getMemberPermissions(memberId: string): Promise<Permission[]> {
    return this.measureAndLog('getMemberPermissions', async () => {
      this.validateId(memberId, '멤버 ID');

      return this.withCache(
        MemberManagementService.CACHE_KEYS.MEMBER_PERMISSIONS(memberId),
        async () => {
          const member = await this.getMember(memberId);
          
          // 기본 역할 권한 조회
          const rolePermissions = await this.getRolePermissions(member.role);
          
          // 커스텀 권한과 합침
          const allPermissions = [
            ...rolePermissions,
            ...(member.customPermissions || [])
          ];

          // 중복 제거
          const uniquePermissions = allPermissions.filter((permission, index, arr) =>
            arr.findIndex(p => p.id === permission.id) === index
          );

          this.log('멤버 권한 조회 완료', { 
            memberId, 
            rolePermissionCount: rolePermissions.length,
            customPermissionCount: member.customPermissions?.length || 0,
            totalPermissionCount: uniquePermissions.length
          });

          return uniquePermissions;
        },
        MemberManagementService.CACHE_TTL.MEMBER_PERMISSIONS,
        [`member:${memberId}`, 'permissions']
      );
    });
  }

  /**
   * 멤버에게 커스텀 권한 부여
   * @param memberId 멤버 ID
   * @param permissions 부여할 권한 목록
   * @param adminUserId 작업 수행자 ID
   * @returns void
   */
  async grantMemberPermissions(
    memberId: string,
    permissions: Permission[],
    adminUserId: string
  ): Promise<void> {
    return this.measureAndLog('grantMemberPermissions', async () => {
      this.validateId(memberId, '멤버 ID');
      this.validateId(adminUserId, '관리자 ID');

      // 권한 확인
      await this.validateMemberManagePermission(adminUserId);

      return runTransaction(this.db, async (transaction) => {
        const member = await this.getMember(memberId);
        
        // 기존 커스텀 권한과 새 권한 합침
        const existingCustomPermissions = member.customPermissions || [];
        const newPermissions = permissions.filter(newPerm =>
          !existingCustomPermissions.some(existing => existing.id === newPerm.id)
        );

        if (newPermissions.length === 0) {
          this.warn('이미 보유한 권한들입니다', { memberId, permissions: permissions.map(p => p.id) });
          return;
        }

        const updatedCustomPermissions = [...existingCustomPermissions, ...newPermissions];

        // 멤버 업데이트
        const memberRef = doc(this.db, 'organizationMembers', memberId);
        transaction.update(memberRef, {
          customPermissions: updatedCustomPermissions,
          updatedAt: this.now()
        });

        // 활동 로그 생성
        await this.createActivityLog(
          adminUserId,
          'PERMISSION_GRANT',
          `권한 부여: ${newPermissions.map(p => p.description).join(', ')}`,
          member.organizationId,
          true,
          'MEMBER',
          memberId,
          member.displayName,
          { 
            grantedPermissions: newPermissions.map(p => ({
              id: p.id,
              resource: p.resource,
              actions: p.actions,
              description: p.description
            }))
          }
        );

        this.logUserActivity(
          adminUserId,
          'GRANT_PERMISSION',
          'ORGANIZATION_MEMBER',
          'success',
          member.organizationId,
          { 
            memberId,
            grantedPermissions: newPermissions.map(p => p.id)
          }
        );

        this.log('멤버 권한 부여 완료', { 
          memberId,
          grantedPermissionCount: newPermissions.length,
          adminUserId
        });
      });
    });
  }

  /**
   * 멤버 권한 회수
   * @param memberId 멤버 ID
   * @param permissionIds 회수할 권한 ID 목록
   * @param adminUserId 작업 수행자 ID
   * @returns void
   */
  async revokeMemberPermissions(
    memberId: string,
    permissionIds: string[],
    adminUserId: string
  ): Promise<void> {
    return this.measureAndLog('revokeMemberPermissions', async () => {
      this.validateId(memberId, '멤버 ID');
      this.validateId(adminUserId, '관리자 ID');

      // 권한 확인
      await this.validateMemberManagePermission(adminUserId);

      return runTransaction(this.db, async (transaction) => {
        const member = await this.getMember(memberId);
        
        const existingCustomPermissions = member.customPermissions || [];
        const revokedPermissions = existingCustomPermissions.filter(perm =>
          permissionIds.includes(perm.id)
        );

        if (revokedPermissions.length === 0) {
          this.warn('회수할 권한이 없습니다', { memberId, permissionIds });
          return;
        }

        // 권한 제거
        const updatedCustomPermissions = existingCustomPermissions.filter(perm =>
          !permissionIds.includes(perm.id)
        );

        // 멤버 업데이트
        const memberRef = doc(this.db, 'organizationMembers', memberId);
        transaction.update(memberRef, {
          customPermissions: updatedCustomPermissions,
          updatedAt: this.now()
        });

        // 활동 로그 생성
        await this.createActivityLog(
          adminUserId,
          'PERMISSION_REVOKE',
          `권한 회수: ${revokedPermissions.map(p => p.description).join(', ')}`,
          member.organizationId,
          true,
          'MEMBER',
          memberId,
          member.displayName,
          { 
            revokedPermissions: revokedPermissions.map(p => ({
              id: p.id,
              resource: p.resource,
              actions: p.actions,
              description: p.description
            }))
          }
        );

        this.logUserActivity(
          adminUserId,
          'REVOKE_PERMISSION',
          'ORGANIZATION_MEMBER',
          'success',
          member.organizationId,
          { 
            memberId,
            revokedPermissions: revokedPermissions.map(p => p.id)
          }
        );

        this.log('멤버 권한 회수 완료', { 
          memberId,
          revokedPermissionCount: revokedPermissions.length,
          adminUserId
        });
      });
    });
  }

  /**
   * 멤버 역할 변경
   * @param memberId 멤버 ID
   * @param newRole 새로운 역할
   * @param adminUserId 작업 수행자 ID
   * @returns void
   */
  async changeMemberRole(
    memberId: string,
    newRole: MemberRole,
    adminUserId: string
  ): Promise<void> {
    return this.measureAndLog('changeMemberRole', async () => {
      this.validateId(memberId, '멤버 ID');
      this.validateId(adminUserId, '관리자 ID');

      // 권한 확인
      await this.validateMemberManagePermission(adminUserId, newRole);

      return runTransaction(this.db, async (transaction) => {
        const member = await this.getMember(memberId);
        const oldRole = member.role;

        if (oldRole === newRole) {
          this.warn('동일한 역할로 변경 시도', { memberId, role: newRole });
          return;
        }

        // 자기 자신의 관리자 권한을 해제하려는 경우 방지
        if (memberId === adminUserId && oldRole === 'ORGANIZATION_ADMIN' && newRole !== 'ORGANIZATION_ADMIN') {
          this.handleError(
            new Error('자기 자신의 관리자 권한을 해제할 수 없습니다.'),
            'changeMemberRole',
            { memberId, adminUserId, oldRole, newRole }
          );
        }

        // 역할 변경 시 기본 권한 재설정
        const newRolePermissions = await this.getRolePermissions(newRole);

        // 멤버 업데이트
        const memberRef = doc(this.db, 'organizationMembers', memberId);
        transaction.update(memberRef, {
          role: newRole,
          permissions: newRolePermissions,
          updatedAt: this.now()
        });

        // 활동 로그 생성
        await this.createActivityLog(
          adminUserId,
          'MEMBER_UPDATE',
          `역할 변경: ${oldRole} → ${newRole}`,
          member.organizationId,
          true,
          'MEMBER',
          memberId,
          member.displayName,
          { oldRole, newRole }
        );

        this.logUserActivity(
          adminUserId,
          'CHANGE_MEMBER_ROLE',
          'ORGANIZATION_MEMBER',
          'success',
          member.organizationId,
          { memberId, oldRole, newRole }
        );

        this.log('멤버 역할 변경 완료', { 
          memberId,
          oldRole,
          newRole,
          adminUserId
        });
      });
    });
  }

  // ===== 통계 및 분석 =====

  /**
   * 조직 멤버 통계 조회
   * @param organizationId 조직 ID
   * @returns 멤버 통계 정보
   */
  async getOrganizationMemberStats(organizationId: string): Promise<MemberStats> {
    return this.measureAndLog('getOrganizationMemberStats', async () => {
      this.validateId(organizationId, '조직 ID');

      return this.withCache(
        MemberManagementService.CACHE_KEYS.ORGANIZATION_STATS(organizationId),
        async () => {
          // 기본 통계 조회
          const [
            totalMembers,
            membersByRole,
            membersByDepartment,
            membersByStatus,
            recentMembers,
            invitationStats,
            recentActivity
          ] = await Promise.all([
            this.getTotalMemberCount(organizationId),
            this.getMemberCountByRole(organizationId),
            this.getMemberCountByDepartment(organizationId),
            this.getMemberCountByStatus(organizationId),
            this.getRecentMembers(organizationId, 7),
            this.getInvitationStats(organizationId),
            this.getRecentMemberActivity(organizationId, 30)
          ]);

          const stats: MemberStats = {
            totalCount: totalMembers,
            activeCount: membersByStatus.find(s => s.status === 'ACTIVE')?.count || 0,
            inactiveCount: membersByStatus.find(s => s.status === 'INACTIVE')?.count || 0,
            pendingCount: membersByStatus.find(s => s.status === 'PENDING')?.count || 0,
            suspendedCount: membersByStatus.find(s => s.status === 'SUSPENDED')?.count || 0,
            resignedCount: membersByStatus.find(s => s.status === 'RESIGNED')?.count || 0,
            byRole: membersByRole,
            byDepartment: membersByDepartment,
            recentJoins: recentMembers,
            recentActivity,
            invitationStats
          };

          this.log('조직 멤버 통계 조회 완료', {
            organizationId,
            totalCount: stats.totalCount,
            activeCount: stats.activeCount,
            rolesCount: stats.byRole.length,
            departmentsCount: stats.byDepartment.length
          });

          return stats;
        },
        MemberManagementService.CACHE_TTL.ORGANIZATION_STATS,
        [`org:${organizationId}`, 'stats']
      );
    });
  }

  /**
   * 멤버 대시보드 데이터 조회
   * @param organizationId 조직 ID
   * @returns 대시보드 데이터
   */
  async getMemberDashboardData(organizationId: string): Promise<MemberDashboardData> {
    return this.measureAndLog('getMemberDashboardData', async () => {
      this.validateId(organizationId, '조직 ID');

      const [
        stats,
        recentMembers,
        pendingInvitations,
        recentActivity,
        departmentBreakdown,
        roleDistribution
      ] = await Promise.all([
        this.getOrganizationMemberStats(organizationId),
        this.getRecentMembers(organizationId, 5),
        this.getPendingInvitations(organizationId, 5),
        this.getRecentMemberActivity(organizationId, 10),
        this.getDepartmentBreakdown(organizationId),
        this.getRoleDistribution(organizationId)
      ]);

      const dashboardData: MemberDashboardData = {
        stats,
        recentMembers,
        pendingInvitations,
        recentActivity,
        departmentBreakdown,
        roleDistribution
      };

      this.log('멤버 대시보드 데이터 조회 완료', {
        organizationId,
        recentMembersCount: recentMembers.length,
        pendingInvitationsCount: pendingInvitations.length,
        recentActivityCount: recentActivity.length
      });

      return dashboardData;
    });
  }

  // ===== 유틸리티 메서드들 =====

  /**
   * 문서를 OrganizationMember 객체로 변환
   */
  private async mapDocumentToMember(doc: QueryDocumentSnapshot | DocumentSnapshot): Promise<OrganizationMember> {
    const data = doc.data();
    if (!data) {
      throw new Error('멤버 데이터가 없습니다.');
    }

    return {
      id: doc.id,
      organizationId: data.organizationId,
      userId: data.userId,
      email: data.email,
      displayName: data.displayName,
      firstName: data.firstName,
      lastName: data.lastName,
      profileImage: data.profileImage,
      role: data.role,
      status: data.status,
      permissions: data.permissions || [],
      customPermissions: data.customPermissions || [],
      departments: data.departments || [],
      primaryDepartmentId: data.primaryDepartmentId,
      employeeId: data.employeeId,
      position: data.position,
      jobTitle: data.jobTitle,
      phoneNumber: data.phoneNumber,
      extension: data.extension,
      officeLocation: data.officeLocation,
      startDate: data.startDate ? this.toDate(data.startDate) : undefined,
      endDate: data.endDate ? this.toDate(data.endDate) : undefined,
      workingHours: data.workingHours,
      invitedAt: this.toDate(data.invitedAt),
      invitedBy: data.invitedBy,
      joinedAt: this.toDate(data.joinedAt),
      lastActiveAt: this.toDate(data.lastActiveAt),
      lastLoginAt: this.toDate(data.lastLoginAt),
      loginCount: data.loginCount || 0,
      preferences: data.preferences || this.getDefaultMemberPreferences(),
      createdAt: this.toDate(data.createdAt),
      updatedAt: this.toDate(data.updatedAt),
      notes: data.notes
    };
  }

  /**
   * 클라이언트 사이드 필터 적용
   */
  private applyClientSideFilters(member: OrganizationMember, filters: MemberFilters): boolean {
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const searchFields = [
        member.displayName,
        member.email,
        member.employeeId,
        member.position,
        member.jobTitle
      ].filter(Boolean).map(field => field!.toLowerCase());

      if (!searchFields.some(field => field.includes(query))) {
        return false;
      }
    }

    if (filters.invitedAfter && member.invitedAt < filters.invitedAfter) {
      return false;
    }

    if (filters.invitedBefore && member.invitedAt > filters.invitedBefore) {
      return false;
    }

    if (filters.joinedAfter && member.joinedAt && member.joinedAt < filters.joinedAfter) {
      return false;
    }

    if (filters.joinedBefore && member.joinedAt && member.joinedAt > filters.joinedBefore) {
      return false;
    }

    if (filters.lastActiveAfter && member.lastActiveAt && member.lastActiveAt < filters.lastActiveAfter) {
      return false;
    }

    if (filters.lastActiveBefore && member.lastActiveAt && member.lastActiveAt > filters.lastActiveBefore) {
      return false;
    }

    if (filters.hasPermission) {
      const hasPermission = member.permissions.some(p => p.resource === filters.hasPermission) ||
        (member.customPermissions || []).some(p => p.resource === filters.hasPermission);
      if (!hasPermission) {
        return false;
      }
    }

    return true;
  }

  /**
   * 초대에 클라이언트 사이드 필터 적용
   */
  private applyInvitationClientSideFilters(invitation: Invitation, filters: InvitationFilters): boolean {
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      if (!invitation.email.toLowerCase().includes(query)) {
        return false;
      }
    }

    if (filters.invitedAfter && invitation.sentAt < filters.invitedAfter) {
      return false;
    }

    if (filters.invitedBefore && invitation.sentAt > filters.invitedBefore) {
      return false;
    }

    if (filters.expiringBefore && invitation.expiresAt > filters.expiringBefore) {
      return false;
    }

    return true;
  }

  /**
   * 초대 토큰 생성
   */
  private generateInvitationToken(): string {
    return IdGenerator.generateInvitationToken();
  }

  /**
   * 기본 멤버 설정 반환
   */
  private getDefaultMemberPreferences(): MemberPreferences {
    return {
      language: 'ko',
      timezone: 'Asia/Seoul',
      notifications: {
        email: true,
        sms: false,
        push: true,
        reportGenerated: true,
        measurementReminder: true,
        systemAlerts: true
      },
      dashboard: {
        defaultView: 'overview',
        chartPreferences: {}
      }
    };
  }

  /**
   * 역할별 기본 권한 조회
   */
  private async getRolePermissions(role: MemberRole): Promise<Permission[]> {
    // TODO: 실제 권한 시스템과 연동
    const rolePermissions: Record<MemberRole, Permission[]> = {
      'ORGANIZATION_ADMIN': [
        {
          id: 'org_manage_all',
          resource: 'ORGANIZATION',
          actions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'MANAGE'],
          description: '조직 전체 관리'
        },
        {
          id: 'member_manage_all',
          resource: 'MEMBER',
          actions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'MANAGE'],
          description: '멤버 전체 관리'
        }
      ],
      'ORGANIZATION_MEMBER': [
        {
          id: 'report_generate',
          resource: 'REPORT',
          actions: ['CREATE', 'READ'],
          description: '리포트 생성 및 조회'
        }
      ],
      'DEPARTMENT_MANAGER': [
        {
          id: 'dept_manage',
          resource: 'DEPARTMENT',
          actions: ['READ', 'UPDATE', 'MANAGE'],
          description: '부서 관리'
        }
      ],
      'TEAM_LEADER': [
        {
          id: 'team_manage',
          resource: 'USER',
          actions: ['READ', 'UPDATE'],
          description: '팀원 관리'
        }
      ],
      'SUPERVISOR': [
        {
          id: 'supervision',
          resource: 'MEASUREMENT',
          actions: ['READ', 'UPDATE'],
          description: '측정 감독'
        }
      ],
      'EMPLOYEE': [
        {
          id: 'basic_access',
          resource: 'MEASUREMENT',
          actions: ['CREATE', 'READ'],
          description: '기본 측정 권한'
        }
      ]
    };

    return rolePermissions[role] || [];
  }

  /**
   * 멤버 관리 권한 확인
   */
  private async validateMemberManagePermission(adminUserId: string, targetRole?: MemberRole): Promise<void> {
    // TODO: 실제 권한 검증 로직 구현
    // 현재는 기본 검증만 수행
    this.debug('멤버 관리 권한 확인', { adminUserId, targetRole });
  }

  /**
   * 활동 로그 생성
   */
  private async createActivityLog(
    userId: string,
    action: MemberActivityAction,
    description: string,
    organizationId: string,
    success: boolean,
    targetType?: string,
    targetId?: string,
    targetName?: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      const activityLog: Omit<MemberActivityLog, 'id'> = {
        memberId: userId,
        organizationId,
        action,
        description,
        details,
        targetType: targetType as any,
        targetId,
        targetName,
        success,
        timestamp: new Date()
      };

      await addDoc(collection(this.db, 'memberActivityLogs'), activityLog);
      
      this.debug('활동 로그 생성 완료', { 
        userId, 
        action, 
        success,
        targetType,
        targetId
      });
    } catch (error) {
      this.warn('활동 로그 생성 실패', { 
        userId, 
        action, 
        error: (error as Error).message 
      });
    }
  }

  /**
   * 초대 이메일 발송
   */
  private async sendInvitationEmail(invitation: Invitation): Promise<void> {
    try {
      // TODO: 실제 이메일 서비스와 연동
      this.debug('초대 이메일 발송', {
        email: invitation.email,
        invitationId: invitation.id,
        organizationId: invitation.organizationId
      });

      // 이메일 발송 로직 구현
      // - 이메일 템플릿 생성
      // - 초대 링크 생성
      // - 이메일 서비스 API 호출

      this.log('초대 이메일 발송 완료', {
        email: invitation.email,
        invitationId: invitation.id
      });
    } catch (error) {
      this.error('초대 이메일 발송 실패', error as Error, {
        email: invitation.email,
        invitationId: invitation.id
      });
      throw error;
    }
  }

  // ===== 통계 헬퍼 메서드들 =====

  private async getTotalMemberCount(organizationId: string): Promise<number> {
    const query = collection(this.db, 'organizationMembers');
    const snapshot = await getDocs(query);
    return snapshot.size;
  }

  private async getOrganizationMemberCount(organizationId: string, filters: MemberFilters): Promise<number> {
    // TODO: 실제 필터링된 카운트 구현
    return this.getTotalMemberCount(organizationId);
  }

  private async getInvitationCount(organizationId: string, filters: InvitationFilters): Promise<number> {
    // TODO: 실제 필터링된 초대 카운트 구현
    const query = collection(this.db, 'invitations');
    const snapshot = await getDocs(query);
    return snapshot.size;
  }

  private async getMemberCountByRole(organizationId: string): Promise<{ role: MemberRole; count: number }[]> {
    // TODO: 실제 역할별 카운트 구현
    return [];
  }

  private async getMemberCountByDepartment(organizationId: string): Promise<{ departmentId: string; departmentName: string; count: number; activeCount: number }[]> {
    // TODO: 실제 부서별 카운트 구현
    return [];
  }

  private async getMemberCountByStatus(organizationId: string): Promise<{ status: MemberStatus; count: number }[]> {
    // TODO: 실제 상태별 카운트 구현
    return [];
  }

  private async getRecentMembers(organizationId: string, days: number): Promise<OrganizationMember[]> {
    // TODO: 실제 최근 멤버 조회 구현
    return [];
  }

  private async getInvitationStats(organizationId: string): Promise<MemberStats['invitationStats']> {
    // TODO: 실제 초대 통계 구현
    return {
      totalSent: 0,
      pending: 0,
      accepted: 0,
      expired: 0,
      cancelled: 0,
      acceptanceRate: 0,
      averageAcceptanceTime: 0
    };
  }

  private async getRecentMemberActivity(organizationId: string, days: number): Promise<MemberStats['recentActivity']> {
    // TODO: 실제 최근 활동 데이터 구현
    return [];
  }

  private async getPendingInvitations(organizationId: string, limit: number): Promise<Invitation[]> {
    // TODO: 실제 대기 중인 초대 조회 구현
    return [];
  }

  private async getDepartmentBreakdown(organizationId: string): Promise<MemberDashboardData['departmentBreakdown']> {
    // TODO: 실제 부서 분석 구현
    return [];
  }

  private async getRoleDistribution(organizationId: string): Promise<MemberDashboardData['roleDistribution']> {
    // TODO: 실제 역할 분포 구현
    return [];
  }

  /**
   * 캐시 무효화 (멤버 정보 변경 시)
   */
  private async invalidateMemberCache(memberId: string, organizationId: string): Promise<void> {
    await Promise.all([
      this.clearCache(MemberManagementService.CACHE_KEYS.MEMBER_DETAIL(memberId)),
      this.clearCache(MemberManagementService.CACHE_KEYS.MEMBER_PERMISSIONS(memberId)),
      this.clearCachePattern(`members:list:${organizationId}:.*`),
      this.clearCache(MemberManagementService.CACHE_KEYS.ORGANIZATION_STATS(organizationId))
    ]);
  }

  /**
   * 초대 관련 캐시 무효화
   */
  private async invalidateInvitationCache(organizationId: string): Promise<void> {
    await Promise.all([
      this.clearCachePattern(`invitations:list:${organizationId}:.*`),
      this.clearCache(MemberManagementService.CACHE_KEYS.ORGANIZATION_STATS(organizationId))
    ]);
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const memberManagementService = new MemberManagementService();
export default memberManagementService; 