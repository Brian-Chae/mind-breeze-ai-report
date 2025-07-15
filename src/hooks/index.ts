// Phase 4: Component Layer 리팩토링 - Custom Hooks
export { useUser, useAuthGuard, usePermissionGuard } from './useUser';
export { 
  useOrganization, 
  useOrganizationMember, 
  useOrganizationStats 
} from './useOrganization';

// Existing hooks - re-export for convenience
export { usePWAUpdate } from './usePWAUpdate';
export { useStorageAutoRestore } from './useStorageAutoRestore';

/**
 * Phase 4: Component Layer 리팩토링 완료
 * 
 * 구현된 Custom Hooks:
 * 
 * 1. User Management Hooks:
 *    - useUser: 사용자 인증, 세션, 권한 관리
 *    - useAuthGuard: 인증 필요 컴포넌트 보호
 *    - usePermissionGuard: 권한 기반 컴포넌트 접근 제어
 * 
 * 2. Organization Management Hooks:
 *    - useOrganization: 조직 및 멤버 관리
 *    - useOrganizationMember: 개별 멤버 관리
 *    - useOrganizationStats: 조직 통계 및 메트릭스
 * 
 * 주요 특징:
 * - Component에서 Store/Service 직접 호출 제거
 * - Hook 패턴을 통한 로직 재사용성 증대
 * - 상태 관리와 비즈니스 로직의 완전한 분리
 * - 타입 안전성과 개발자 경험 향상
 * - 테스트 가능성 증대
 * 
 * 사용 예시:
 * 
 * ```tsx
 * // 인증이 필요한 페이지
 * function ProfilePage() {
 *   const { user, updateProfile, isLoading } = useUser();
 *   const { shouldRedirect } = useAuthGuard();
 *   
 *   if (shouldRedirect) return <Navigate to="/login" />;
 *   
 *   return <div>Welcome {user?.displayName}</div>;
 * }
 * 
 * // 조직 관리 페이지
 * function OrganizationPage() {
 *   const { 
 *     organization, 
 *     members, 
 *     inviteMember, 
 *     loadOrganization 
 *   } = useOrganization();
 *   
 *   useEffect(() => {
 *     if (organization?.id) {
 *       loadOrganization(organization.id);
 *     }
 *   }, [organization?.id]);
 *   
 *   return <MemberList members={members} onInvite={inviteMember} />;
 * }
 * 
 * // 권한 기반 컴포넌트
 * function AdminPanel() {
 *   const { canAccess } = usePermissionGuard('canAccessAdmin');
 *   
 *   if (!canAccess) return <AccessDenied />;
 *   
 *   return <AdminContent />;
 * }
 * ```
 */ 