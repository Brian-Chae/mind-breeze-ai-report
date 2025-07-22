# 기업 관리 페이지 설계서

## 1. 개요

기업 관리자가 조직 정보를 효과적으로 관리할 수 있는 통합 관리 페이지 설계

### 1.1 목표
- 시스템 관리자 > 기업 관리 페이지와 동일한 디자인 시스템 적용
- Hero Section + 탭 구조 + 각 탭별 컴포넌트로 구성
- 완성도 높은 CRUD 시스템 구축
- 실시간 데이터 동기화 및 유효성 검증

### 1.2 주요 기능
- 기업 정보 관리 (수정, 업데이트)
- 조직 구조 관리 (부서, 팀, 계층 구조)
- 구성원 관리 (초대, 권한 설정, 비활성화)
- 조직도 시각화

## 2. UI/UX 디자인

### 2.1 페이지 구조

```
┌─────────────────────────────────────────────────────────┐
│                    Hero Section                          │
│  - 기업 로고 / 아이콘                                    │
│  - 기업명 (대제목)                                       │
│  - 기업 설명 (부제목)                                    │
│  - 주요 통계 (구성원 수, 부서 수, 활성 사용자 등)        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    Tab Navigation                        │
│  [기업 정보] [조직 구조] [구성원 관리] [권한 설정]        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    Tab Content Area                      │
│  각 탭별 상세 컨텐츠                                     │
└─────────────────────────────────────────────────────────┘
```

### 2.2 디자인 시스템

#### 색상 팔레트
- Primary: `bg-gradient-to-br from-blue-500 to-cyan-600` (기업 아이덴티티)
- Background: `bg-gradient-to-br from-slate-50 to-slate-100`
- Card: `bg-white rounded-2xl shadow-lg border border-slate-200`
- Active Tab: `data-[state=active]:bg-white data-[state=active]:shadow-sm`

#### 타이포그래피
- Hero Title: `text-3xl font-bold text-slate-900`
- Hero Subtitle: `text-lg text-slate-600`
- Tab Label: `font-medium`
- Tab Description: `text-xs text-slate-500`

#### 레이아웃
- Max Width: `max-w-7xl mx-auto`
- Spacing: `space-y-8` (섹션 간), `p-6` (컨텐츠 패딩)
- Grid: `grid-cols-3` (탭), `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` (카드)

## 3. Firestore 데이터베이스 구조

### 3.1 Organizations Collection
```typescript
interface Organization {
  id: string;
  organizationCode: string;
  
  // 기본 정보
  organizationName: string;
  businessNumber?: string;
  industry: string;
  establishedDate?: Timestamp;
  
  // 연락처 정보
  contactEmail: string;
  contactPhone: string;
  address: string;
  website?: string;
  
  // 추가 정보
  description?: string;
  logoUrl?: string;
  size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE'; // 1-50, 51-200, 201-1000, 1000+
  
  // 관리 정보
  adminUserId: string;
  adminEmail: string;
  
  // 계약 정보
  servicePackage: 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  paymentStatus: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'TERMINATED';
  
  // 통계
  totalMembers: number;
  activeMembers: number;
  totalDepartments: number;
  
  // 메타데이터
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 3.2 Departments Collection (Sub-collection of Organizations)
```typescript
interface Department {
  id: string;
  parentId?: string; // 상위 부서 ID (계층 구조)
  
  // 기본 정보
  name: string;
  code: string; // 부서 코드
  description?: string;
  level: number; // 조직도 레벨 (0: 최상위)
  
  // 관리자 정보
  managerId?: string;
  managerName?: string;
  managerEmail?: string;
  
  // 통계
  memberCount: number;
  childDepartmentCount: number;
  
  // 메타데이터
  isActive: boolean;
  sortOrder: number; // 정렬 순서
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
}
```

### 3.3 OrganizationMembers Collection (Sub-collection of Organizations)
```typescript
interface OrganizationMember {
  id: string;
  userId: string;
  
  // 개인 정보
  employeeId: string;
  displayName: string;
  email: string;
  phone?: string;
  profilePhotoUrl?: string;
  
  // 조직 정보
  departmentId?: string;
  departmentName?: string;
  position: string; // 직위
  jobTitle?: string; // 직무
  
  // 권한 정보
  role: 'ADMIN' | 'MANAGER' | 'MEMBER';
  permissions: string[]; // 세부 권한 목록
  
  // 상태 정보
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'RESIGNED';
  invitationToken?: string;
  invitationExpiry?: Timestamp;
  
  // 메타데이터
  joinedAt: Timestamp;
  lastActiveAt?: Timestamp;
  resignedAt?: Timestamp;
}
```

### 3.4 OrganizationInvitations Collection
```typescript
interface OrganizationInvitation {
  id: string;
  organizationId: string;
  
  // 초대 정보
  email: string;
  name: string;
  departmentId?: string;
  position?: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER';
  
  // 초대 상태
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  invitationToken: string;
  
  // 메타데이터
  invitedBy: string;
  invitedAt: Timestamp;
  acceptedAt?: Timestamp;
  expiresAt: Timestamp;
}
```

## 4. CRUD 시스템 설계

### 4.1 OrganizationManagementService
```typescript
class OrganizationManagementService {
  // 기업 정보 CRUD
  async updateOrganizationInfo(organizationId: string, data: Partial<Organization>): Promise<void>
  async uploadOrganizationLogo(organizationId: string, file: File): Promise<string>
  
  // 부서 관리 CRUD
  async createDepartment(organizationId: string, data: CreateDepartmentData): Promise<Department>
  async updateDepartment(organizationId: string, departmentId: string, data: Partial<Department>): Promise<void>
  async deleteDepartment(organizationId: string, departmentId: string): Promise<void>
  async getDepartments(organizationId: string): Promise<Department[]>
  async getDepartmentHierarchy(organizationId: string): Promise<DepartmentNode[]>
  
  // 구성원 관리 CRUD
  async inviteMember(organizationId: string, data: InviteMemberData): Promise<void>
  async updateMemberInfo(organizationId: string, memberId: string, data: Partial<OrganizationMember>): Promise<void>
  async suspendMember(organizationId: string, memberId: string): Promise<void>
  async reactivateMember(organizationId: string, memberId: string): Promise<void>
  async removeMember(organizationId: string, memberId: string): Promise<void>
  
  // 권한 관리
  async updateMemberRole(organizationId: string, memberId: string, role: string): Promise<void>
  async updateMemberPermissions(organizationId: string, memberId: string, permissions: string[]): Promise<void>
  
  // 통계 및 분석
  async getOrganizationStats(organizationId: string): Promise<OrganizationStats>
  async getDepartmentStats(organizationId: string, departmentId: string): Promise<DepartmentStats>
}
```

## 5. UI 컴포넌트 설계

### 5.1 컴포넌트 구조
```
OrganizationManagementContent/
├── index.tsx (메인 컨테이너)
├── components/
│   ├── OrganizationHero.tsx (Hero Section)
│   ├── tabs/
│   │   ├── CompanyInfoTab.tsx
│   │   ├── OrganizationStructureTab.tsx
│   │   ├── MemberManagementTab.tsx
│   │   └── PermissionSettingsTab.tsx
│   ├── forms/
│   │   ├── CompanyInfoForm.tsx
│   │   ├── DepartmentForm.tsx
│   │   └── MemberInviteForm.tsx
│   ├── cards/
│   │   ├── DepartmentCard.tsx
│   │   ├── MemberCard.tsx
│   │   └── StatCard.tsx
│   └── visualizations/
│       └── OrganizationChart.tsx
```

### 5.2 주요 컴포넌트 상세

#### OrganizationHero Component
```typescript
interface OrganizationHeroProps {
  organization: Organization;
  stats: OrganizationStats;
  onLogoUpload?: (file: File) => void;
}

// 주요 기능
- 기업 로고 표시 및 업로드
- 기업명 및 설명
- 주요 통계 카드 (구성원 수, 부서 수, 활성률 등)
- 빠른 액션 버튼 (구성원 초대, 부서 추가 등)
```

#### CompanyInfoTab Component
```typescript
interface CompanyInfoTabProps {
  organization: Organization;
  onUpdate: (data: Partial<Organization>) => Promise<void>;
  loading?: boolean;
}

// 주요 기능
- 기업 정보 폼 (편집/읽기 모드 전환)
- 실시간 유효성 검증
- 변경사항 추적 및 저장
- 이미지 업로드 (로고)
```

#### OrganizationStructureTab Component
```typescript
interface OrganizationStructureTabProps {
  departments: Department[];
  onCreateDepartment: (data: CreateDepartmentData) => Promise<void>;
  onUpdateDepartment: (id: string, data: Partial<Department>) => Promise<void>;
  onDeleteDepartment: (id: string) => Promise<void>;
}

// 주요 기능
- 조직도 시각화 (트리 구조)
- 부서 CRUD 작업
- 드래그 앤 드롭으로 조직 구조 변경
- 부서별 통계 표시
```

## 6. 구현 계획

### Phase 1: 기초 인프라 구축 (2-3일)
1. Firestore 데이터 구조 구현
2. OrganizationManagementService 구현
3. 기본 CRUD 함수 작성

### Phase 2: UI 컴포넌트 개발 (3-4일)
1. OrganizationManagementContent 메인 컴포넌트
2. Hero Section 구현
3. 각 탭 컴포넌트 구현
4. 폼 컴포넌트 및 유효성 검증

### Phase 3: 고급 기능 구현 (2-3일)
1. 조직도 시각화
2. 실시간 업데이트
3. 권한 관리 시스템
4. 대량 작업 (벌크 초대 등)

### Phase 4: 테스트 및 최적화 (1-2일)
1. 단위 테스트 작성
2. 성능 최적화
3. 접근성 검증
4. 반응형 디자인 검증

## 7. 보안 고려사항

1. **권한 검증**: 모든 CRUD 작업에 대한 권한 검증
2. **데이터 유효성**: 클라이언트/서버 양측 유효성 검증
3. **감사 로그**: 모든 변경사항에 대한 로그 기록
4. **민감 정보 보호**: 개인정보 암호화 및 접근 제한

## 8. 성능 최적화

1. **페이지네이션**: 대량 데이터 처리 시 페이지네이션 적용
2. **캐싱**: 자주 조회되는 데이터 캐싱
3. **Lazy Loading**: 필요 시점에 데이터 로드
4. **Debouncing**: 입력 필드 변경 시 과도한 API 호출 방지
5. **Optimistic UI**: 즉각적인 UI 피드백 제공