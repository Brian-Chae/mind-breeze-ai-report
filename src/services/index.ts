// Store-integrated Services - Phase 3 Implementation
export { UserStoreService } from './UserStoreService';
export { OrganizationStoreService } from './OrganizationStoreService';

// Service 인스턴스들 - Singleton 패턴으로 사용
export const userStoreService = UserStoreService.getInstance();
export const organizationStoreService = OrganizationStoreService.getInstance();

/**
 * Phase 3: Service Layer 리팩토링 완료
 * 
 * 구현된 Store-centric 서비스 어댑터들:
 * 
 * 1. UserStoreService:
 *    - 사용자 인증 및 세션 관리
 *    - Firebase Auth ↔ userStore 브릿지
 *    - 권한 관리 및 라우트 보호
 * 
 * 2. OrganizationStoreService:
 *    - 조직 및 멤버 관리
 *    - Firebase Firestore ↔ organizationStore 브릿지
 *    - 멤버 초대 및 역할 관리
 * 
 * 주요 특징:
 * - Store 중심 데이터 흐름
 * - Firebase 서비스와의 추상화 계층
 * - 통합 타입 시스템 사용
 * - 에러 처리 및 로딩 상태 관리
 * - Singleton 패턴으로 인스턴스 관리
 * 
 * TODO:
 * - Firebase 서비스와의 타입 호환성 완전 조정
 * - 실제 API 호출 구현 (현재 Mock 데이터)
 * - 추가 비즈니스 로직 서비스 구현
 */ 