# Mind Breeze AI 데이터 아키텍처 리팩토링 기획서

## 📋 프로젝트 개요

### 목표
현재 Mind Breeze AI 시스템의 데이터 불일치 문제를 해결하고, 확장 가능한 데이터 아키텍처를 구축하여 안정적이고 일관된 사용자 경험을 제공한다.

### 배경
현재 시스템은 Firestore와 Zustand Store 간의 데이터 흐름이 일관되지 않아 다음과 같은 문제가 발생하고 있다:
- 동일한 엔티티에 대한 중복된 타입 정의
- 데이터베이스 접근 패턴의 혼재
- React 상태 관리 패턴 위반
- 서비스 레이어의 비일관성

---

## 🚨 현재 문제점 분석

### 1. ~~Firebase DataConnect vs Firestore 중복 구조~~ ✅ **해결됨**

#### 문제 상황
```typescript
// schema.gql에는 정의되어 있지만 실제로는 사용되지 않음
type User @table {
  email: String
  userType: UserType!
  organizationId: UUID
}

// 실제로는 Firestore Collections를 직접 사용
await getDoc(doc(db, 'users', userId))        // EnterpriseAuthService
await setDoc(doc(db, 'users', firebaseUser.uid), userDoc) // EnterpriseAuthService
```

**영향도**: 🔴 높음
- 개발자 혼란 가중
- 스키마 정합성 보장 불가
- 유지보수 복잡도 증가

### 2. 타입 정의 혼재 및 불일치

#### 문제 상황
```typescript
// src/core/types/business.ts
interface EnterpriseUser {
  id: string;
  email?: string;
  userType: UserType;
  organizationId?: string;
}

// src/domains/organization/types/organization.ts  
interface Organization {
  id: string;
  name: string;
  industry: string;
  // 완전히 다른 구조
}

// schema.gql
type User @table {
  displayName: String
  userType: UserType!
  // 또 다른 구조
}
```

**영향도**: 🔴 높음
- 타입 안정성 부족
- 런타임 에러 발생 위험
- 개발 생산성 저하

### 3. Zustand Store 완전 미활용

#### 문제 상황
```typescript
// 센서 데이터용 Store만 존재
useEEGDataStore, useRawDataStore, useSensorDataStore

// 사용자/조직 정보용 Store는 없음!
// 대신 서비스에서 직접 Firestore 접근
const currentContext = enterpriseAuthService.getCurrentContext()
```

**영향도**: 🟡 중간
- 상태 관리 패턴 불일치
- 컴포넌트 간 데이터 공유 비효율
- 캐싱 및 최적화 기회 상실

### 4. 데이터 흐름 패턴 혼재

#### 문제 상황
```typescript
// 모든 컴포넌트가 Service를 직접 호출 (React 패턴 위반)
// AppRouter.tsx
const enterpriseContext = enterpriseAuthService.getCurrentContext();

// DashboardSection.tsx  
const currentContext = enterpriseAuthService.getCurrentContext()

// OrganizationSection.tsx
const currentContext = enterpriseAuthService.getCurrentContext()
```

**영향도**: 🟡 중간
- 컴포넌트-서비스 강결합
- 테스트 어려움
- 상태 동기화 문제

### 5. 서비스 레이어 중복 구조

#### 문제 상황
```typescript
// EnterpriseAuthService - Firestore 직접 접근
await getDoc(doc(db, 'users', userId))

// OrganizationService - 별도 Firestore 접근  
await getDoc(doc(db, 'organizations', orgId))

// MemberManagementService - 또 다른 방식
const q = query(collection(db, 'users'), where(...))
```

**영향도**: 🟡 중간
- 코드 중복
- 데이터 접근 패턴 불일치
- 캐싱 전략 부재

---

## 🎯 해결 방안 및 전략

### 전략 선택: 점진적 개선 접근법

**이유**:
- 현재 운영 중인 시스템의 안정성 보장
- 단계별 검증을 통한 리스크 최소화
- 팀의 학습 곡선 고려

### Phase 1: 데이터베이스 통합 전략 수립

#### 1.1 ✅ **완료: Firestore 완전 통일 구조**

**최종 결정**: **Firestore 완전 통일** (DataConnect 완전 제거)

**근거**:
- 현재 모든 서비스가 100% Firestore 기반으로 구현됨
- DataConnect는 설계되었으나 실제 사용되지 않음
- MVP 개발 속도 최적화 및 복잡성 제거

#### 1.2 통합 스키마 정의

```typescript
// core/types/unified-schema.ts
export interface UnifiedUser {
  id: string;
  email?: string;
  employeeId?: string;
  organizationId?: string;
  userType: UserType;
  displayName: string;
  profileImage?: string;
  department?: string;
  position?: string;
  personalCreditBalance?: number;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface UnifiedOrganization {
  id: string;
  name: string;
  businessNumber: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  creditBalance: number;
  totalMemberCount: number;
  volumeTier: VolumeDiscountTier;
  basePrice: number;
  discountedPrice: number;
  isTrialActive: boolean;
  trialType?: TrialType;
  trialStartDate?: Date;
  trialEndDate?: Date;
  trialCreditsUsed: number;
  trialCreditsTotal: number;
  contractStartDate?: Date;
  contractEndDate?: Date;
  servicePackage: ServicePackageType;
  status: OrganizationStatus;
  adminUserId: string;
  settings: OrganizationSettings;
  createdAt: Date;
  updatedAt: Date;
}
```

### Phase 2: Zustand Store 중심 상태 관리 구축

#### 2.1 사용자 인증 Store

```typescript
// stores/authStore.ts
interface AuthStore {
  // 상태
  currentUser: UnifiedUser | null;
  organization: UnifiedOrganization | null;
  memberInfo: OrganizationMember | null;
  permissions: string[];
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // 액션
  setUser: (user: UnifiedUser | null) => void;
  setOrganization: (org: UnifiedOrganization | null) => void;
  setMemberInfo: (member: OrganizationMember | null) => void;
  updatePermissions: (permissions: string[]) => void;
  
  // 계산된 값
  hasPermission: (permission: string) => boolean;
  isOrganizationAdmin: () => boolean;
  isOrganizationMember: () => boolean;
  isIndividualUser: () => boolean;
}
```

#### 2.2 조직 관리 Store

```typescript
// stores/organizationStore.ts
interface OrganizationStore {
  // 상태
  members: OrganizationMember[];
  departments: Department[];
  memberStats: MemberStats | null;
  creditTransactions: CreditTransaction[];
  
  // 액션
  loadMembers: (organizationId: string) => Promise<void>;
  addMember: (member: OrganizationMember) => Promise<void>;
  updateMember: (id: string, updates: Partial<OrganizationMember>) => Promise<void>;
  removeMember: (id: string) => Promise<void>;
  
  // 필터링 및 검색
  searchMembers: (query: string) => OrganizationMember[];
  filterByDepartment: (department: string) => OrganizationMember[];
}
```

### Phase 3: 서비스 레이어 리팩토링

#### 3.1 Repository 패턴 도입

```typescript
// repositories/UserRepository.ts
export class UserRepository {
  private collectionName = 'users';
  
  async findById(id: string): Promise<UnifiedUser | null> {
    // Firestore 접근 로직
  }
  
  async findByEmail(email: string): Promise<UnifiedUser | null> {
    // Firestore 접근 로직
  }
  
  async create(user: CreateUserInput): Promise<UnifiedUser> {
    // Firestore 접근 로직
  }
  
  async update(id: string, updates: UpdateUserInput): Promise<void> {
    // Firestore 접근 로직
  }
}

// repositories/OrganizationRepository.ts
export class OrganizationRepository {
  // 조직 관련 데이터 접근 로직
}
```

#### 3.2 Service Layer 재설계

```typescript
// services/AuthService.ts
export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private organizationRepository: OrganizationRepository,
    private authStore: AuthStore
  ) {}
  
  async signIn(credentials: LoginCredentials): Promise<void> {
    const user = await this.userRepository.findByEmail(credentials.email);
    // Store 업데이트
    this.authStore.setUser(user);
    
    if (user.organizationId) {
      const org = await this.organizationRepository.findById(user.organizationId);
      this.authStore.setOrganization(org);
    }
  }
}
```

### Phase 4: React 컴포넌트 레이어 개선

#### 4.1 Custom Hooks 패턴

```typescript
// hooks/useAuth.ts
export function useAuth() {
  const authStore = useAuthStore();
  
  return {
    user: authStore.currentUser,
    organization: authStore.organization,
    isLoading: authStore.isLoading,
    hasPermission: authStore.hasPermission,
    signIn: (credentials: LoginCredentials) => authService.signIn(credentials),
    signOut: () => authService.signOut(),
  };
}

// hooks/useOrganizationMembers.ts
export function useOrganizationMembers(organizationId?: string) {
  const organizationStore = useOrganizationStore();
  
  useEffect(() => {
    if (organizationId) {
      organizationStore.loadMembers(organizationId);
    }
  }, [organizationId]);
  
  return {
    members: organizationStore.members,
    loading: organizationStore.isLoading,
    searchMembers: organizationStore.searchMembers,
    addMember: organizationStore.addMember,
  };
}
```

#### 4.2 컴포넌트 리팩토링

```typescript
// Before
export default function DashboardSection() {
  const currentContext = enterpriseAuthService.getCurrentContext();
  // ...
}

// After
export default function DashboardSection() {
  const { user, organization, hasPermission } = useAuth();
  const { members, loading } = useOrganizationMembers(organization?.id);
  // ...
}
```

---

## 📅 구현 로드맵

### Week 1-2: Phase 1 - 기반 구조 수립
- [ ] 통합 타입 시스템 구축 (`core/types/unified-schema.ts`)
- [ ] 기존 타입 정의들을 통합 타입으로 마이그레이션
- [ ] Repository 패턴 기본 구조 구현

### Week 3-4: Phase 2 - Store 레이어 구축
- [ ] AuthStore 구현 및 테스트
- [ ] OrganizationStore 구현 및 테스트
- [ ] 기존 EnterpriseAuthService와 Store 연동

### Week 5-6: Phase 3 - Service 레이어 개선
- [ ] UserRepository, OrganizationRepository 구현
- [ ] AuthService 리팩토링
- [ ] 기존 서비스들과의 호환성 보장

### Week 7-8: Phase 4 - 컴포넌트 레이어 개선
- [ ] Custom Hooks 구현
- [ ] 주요 컴포넌트들 리팩토링 (DashboardSection, OrganizationSection 등)
- [ ] E2E 테스트 및 버그 수정

### Week 9-10: 최적화 및 마무리
- [ ] 성능 최적화
- [ ] 문서화 업데이트
- [ ] 코드 리뷰 및 최종 검증

---

## 🧪 테스트 전략

### 단위 테스트
- Repository 계층 테스트
- Store 액션 및 상태 변화 테스트
- Custom Hooks 테스트

### 통합 테스트
- Service-Repository 연동 테스트
- Store-Service 연동 테스트
- 전체 인증 플로우 테스트

### E2E 테스트
- 사용자 로그인 시나리오
- 조직 관리 시나리오
- 권한별 접근 제어 시나리오

---

## 🎯 성공 지표

### 기술적 지표
- [ ] 타입 안정성: TypeScript 에러 0개 달성
- [ ] 코드 중복도: 현재 대비 30% 감소
- [ ] 테스트 커버리지: 80% 이상 달성

### 사용자 경험 지표
- [ ] 페이지 로딩 시간: 현재 대비 20% 개선
- [ ] 런타임 에러: 90% 감소
- [ ] 개발자 생산성: 새 기능 개발 시간 단축

---

## 🚨 리스크 관리

### 높은 리스크
- **데이터 마이그레이션 오류**: 단계별 백업 및 검증 프로세스 구축
- **서비스 다운타임**: Blue-Green 배포 전략 적용

### 중간 리스크
- **개발 일정 지연**: 주간 진행 상황 체크 및 조기 이슈 발견
- **팀 학습 곡선**: 지속적인 교육 및 페어 프로그래밍

### 낮은 리스크
- **성능 저하**: 모니터링 시스템 구축 및 프로파일링

---

## 📚 참고 자료

### 아키텍처 패턴
- Repository Pattern
- Service Layer Pattern
- State Management Best Practices

### 기술 문서
- ~~Firebase DataConnect Documentation~~ (제거됨)
- Firestore Best Practices
- Zustand State Management Guide
- React Custom Hooks Patterns

---

**작성일**: 2024년 12월 19일  
**작성자**: Mind Breeze AI 개발팀  
**버전**: 1.0  
**다음 리뷰**: 2024년 12월 26일 