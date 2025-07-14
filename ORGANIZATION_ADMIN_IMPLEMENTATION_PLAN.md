# MIND BREEZE AI - 기업 관리자 서비스 구현 계획

## 1. 프로젝트 개요

### 1.1 목표
- 기업 관리자용 통합 관리 시스템 구축
- 랜딩 페이지 디자인 일관성 유지
- 사이드바 기반 직관적 네비게이션 구현
- 단계별 개발로 안정적인 서비스 출시

### 1.2 개발 범위
- DeviceManager.tsx를 기업 관리자 메인 페이지로 완전 재구성
- 7개 주요 기능 영역 개발
- 랜딩 페이지 디자인 스타일 적용
- 반응형 디자인 구현

## 2. 기술 스택

### 2.1 프론트엔드
- **React 18** + **TypeScript 4.9**
- **Tailwind CSS 3.3** (기존 랜딩 페이지와 일관성)
- **shadcn/ui** 컴포넌트 라이브러리
- **Lucide React** 아이콘 라이브러리
- **React Router Dom** 라우팅
- **Zustand** 상태 관리

### 2.2 백엔드 서비스
- **Firebase Firestore** 데이터베이스
- **Firebase Auth** 인증
- **Firebase Functions** 서버리스 함수
- **Firebase Storage** 파일 저장

### 2.3 개발 도구
- **Vite** 빌드 도구
- **ESLint** + **Prettier** 코드 품질
- **Jest** + **React Testing Library** 테스트

## 3. 파일 구조

### 3.1 신규 생성 파일
```
src/
├── components/
│   ├── OrganizationAdmin/
│   │   ├── OrganizationAdminApp.tsx          # 메인 앱 컴포넌트
│   │   ├── Sidebar/
│   │   │   ├── AdminSidebar.tsx              # 사이드바 컴포넌트
│   │   │   ├── SidebarMenuItem.tsx           # 메뉴 아이템
│   │   │   └── SidebarContext.tsx            # 사이드바 상태 관리
│   │   ├── Dashboard/
│   │   │   ├── AdminDashboard.tsx            # 대시보드 메인
│   │   │   ├── StatsCard.tsx                 # 통계 카드
│   │   │   ├── ChartCard.tsx                 # 차트 카드
│   │   │   └── RecentActivityCard.tsx        # 최근 활동
│   │   ├── Organization/
│   │   │   ├── OrganizationInfo.tsx          # 기업 정보
│   │   │   ├── OrganizationForm.tsx          # 기업 정보 수정
│   │   │   ├── DepartmentList.tsx            # 조직 목록
│   │   │   ├── DepartmentForm.tsx            # 조직 추가/수정
│   │   │   └── OrganizationStructure.tsx     # 조직 구조
│   │   ├── Members/
│   │   │   ├── MemberList.tsx                # 운영자 목록
│   │   │   ├── MemberInvite.tsx              # 운영자 초대
│   │   │   ├── MemberForm.tsx                # 운영자 정보 수정
│   │   │   └── PermissionManager.tsx         # 권한 관리
│   │   ├── Users/
│   │   │   ├── UserList.tsx                  # 사용자 목록
│   │   │   ├── UserDetail.tsx                # 사용자 상세
│   │   │   ├── UserHistory.tsx               # 사용자 이력
│   │   │   └── UserReports.tsx               # 사용자 리포트
│   │   ├── AIReport/
│   │   │   ├── ReportGeneration.tsx          # 리포트 생성
│   │   │   ├── ReportList.tsx                # 리포트 목록
│   │   │   ├── ReportDetail.tsx              # 리포트 상세
│   │   │   └── ReportQuality.tsx             # 품질 관리
│   │   ├── Device/
│   │   │   ├── DeviceInventory.tsx           # 디바이스 현황
│   │   │   ├── DeviceAssignment.tsx          # 디바이스 배치
│   │   │   ├── DeviceMonitoring.tsx          # 디바이스 모니터링
│   │   │   └── DeviceForm.tsx                # 디바이스 정보
│   │   ├── Credits/
│   │   │   ├── CreditDashboard.tsx           # 크레딧 대시보드
│   │   │   ├── CreditHistory.tsx             # 크레딧 이력
│   │   │   ├── CreditPurchase.tsx            # 크레딧 구매
│   │   │   └── AutoRechargeSettings.tsx      # 자동 충전 설정
│   │   └── Common/
│   │       ├── PageHeader.tsx                # 페이지 헤더
│   │       ├── LoadingSpinner.tsx            # 로딩 스피너
│   │       ├── ErrorBoundary.tsx             # 에러 바운더리
│   │       ├── ConfirmModal.tsx              # 확인 모달
│   │       └── TablePagination.tsx           # 테이블 페이지네이션
│   └── ui/
│       ├── data-table.tsx                    # 데이터 테이블
│       ├── chart.tsx                         # 차트 컴포넌트
│       └── loading.tsx                       # 로딩 컴포넌트
├── services/
│   ├── OrganizationAdminService.ts           # 기업 관리자 서비스
│   ├── OrganizationMemberService.ts          # 운영자 관리 서비스
│   ├── MeasurementUserService.ts             # 사용자 관리 서비스
│   ├── DeviceManagementService.ts            # 디바이스 관리 서비스
│   ├── AIReportManagementService.ts          # AI 리포트 관리 서비스
│   └── CreditManagementService.ts            # 크레딧 관리 서비스
├── stores/
│   ├── organizationStore.ts                  # 기업 상태 관리
│   ├── memberStore.ts                        # 운영자 상태 관리
│   ├── userStore.ts                          # 사용자 상태 관리
│   ├── deviceStore.ts                        # 디바이스 상태 관리
│   ├── reportStore.ts                        # 리포트 상태 관리
│   └── creditStore.ts                        # 크레딧 상태 관리
├── types/
│   ├── organization.ts                       # 기업 타입 정의
│   ├── member.ts                             # 운영자 타입 정의
│   ├── device.ts                             # 디바이스 타입 정의
│   ├── report.ts                             # 리포트 타입 정의
│   └── credit.ts                             # 크레딧 타입 정의
└── utils/
    ├── organizationUtils.ts                  # 기업 관련 유틸리티
    ├── dateUtils.ts                          # 날짜 관련 유틸리티
    ├── formatUtils.ts                        # 포맷 관련 유틸리티
    └── validationUtils.ts                    # 유효성 검증 유틸리티
```

### 3.2 기존 파일 수정
- `components/DeviceManager.tsx` → 완전 재구성
- `src/App.tsx` → 라우팅 추가
- `src/components/AppRouter.tsx` → 기업 관리자 라우트 추가

## 4. 단계별 개발 계획

### 4.1 Phase 1: 기본 구조 및 레이아웃 (1주)

#### 4.1.1 Day 1-2: 기본 구조 설정
- [x] 프로젝트 구조 설계
- [ ] 타입 정의 작성
- [ ] 기본 서비스 클래스 구조 생성
- [ ] Zustand 스토어 기본 구조 생성

#### 4.1.2 Day 3-4: 레이아웃 구현
- [ ] AdminSidebar 컴포넌트 구현
- [ ] OrganizationAdminApp 메인 컴포넌트 구현
- [ ] 랜딩 페이지 디자인 스타일 적용
- [ ] 기본 라우팅 구성

#### 4.1.3 Day 5-7: 공통 컴포넌트
- [ ] PageHeader 컴포넌트 구현
- [ ] LoadingSpinner 컴포넌트 구현
- [ ] ErrorBoundary 구현
- [ ] 기본 UI 컴포넌트 커스터마이징

### 4.2 Phase 2: 대시보드 및 기업 관리 (1주)

#### 4.2.1 Day 8-10: 대시보드 구현
- [ ] AdminDashboard 메인 컴포넌트
- [ ] StatsCard 통계 카드
- [ ] ChartCard 차트 카드
- [ ] RecentActivityCard 최근 활동
- [ ] 실시간 데이터 연동

#### 4.2.2 Day 11-14: 기업 관리 구현
- [ ] OrganizationInfo 기업 정보 조회
- [ ] OrganizationForm 기업 정보 수정
- [ ] DepartmentList 조직 목록
- [ ] DepartmentForm 조직 추가/수정
- [ ] OrganizationStructure 조직 구조

### 4.3 Phase 3: 운영자 및 사용자 관리 (1주)

#### 4.3.1 Day 15-17: 운영자 관리
- [ ] MemberList 운영자 목록
- [ ] MemberInvite 운영자 초대
- [ ] MemberForm 운영자 정보 수정
- [ ] PermissionManager 권한 관리
- [ ] 이메일 초대 시스템

#### 4.3.2 Day 18-21: 사용자 관리
- [ ] UserList 사용자 목록
- [ ] UserDetail 사용자 상세
- [ ] UserHistory 사용자 이력
- [ ] UserReports 사용자 리포트
- [ ] 사용자 검색 및 필터링

### 4.4 Phase 4: AI 리포트 및 디바이스 관리 (1주)

#### 4.4.1 Day 22-24: AI 리포트 관리
- [ ] ReportGeneration 리포트 생성
- [ ] ReportList 리포트 목록
- [ ] ReportDetail 리포트 상세
- [ ] ReportQuality 품질 관리
- [ ] 배치 리포트 생성

#### 4.4.2 Day 25-28: 디바이스 관리
- [ ] DeviceInventory 디바이스 현황
- [ ] DeviceAssignment 디바이스 배치
- [ ] DeviceMonitoring 디바이스 모니터링
- [ ] DeviceForm 디바이스 정보
- [ ] 실시간 디바이스 상태 업데이트

### 4.5 Phase 5: 크레딧 관리 및 최적화 (1주)

#### 4.5.1 Day 29-31: 크레딧 관리
- [ ] CreditDashboard 크레딧 대시보드
- [ ] CreditHistory 크레딧 이력
- [ ] CreditPurchase 크레딧 구매
- [ ] AutoRechargeSettings 자동 충전 설정
- [ ] 결제 시스템 연동

#### 4.5.2 Day 32-35: 최적화 및 테스트
- [ ] 성능 최적화
- [ ] 반응형 디자인 완성
- [ ] 테스트 코드 작성
- [ ] 버그 수정 및 폴리싱

## 5. 핵심 컴포넌트 설계

### 5.1 OrganizationAdminApp (메인 컴포넌트)
```typescript
interface OrganizationAdminAppProps {
  user: User;
  organization: Organization;
}

export function OrganizationAdminApp({ user, organization }: OrganizationAdminAppProps) {
  // 사이드바 상태 관리
  // 현재 활성 메뉴 관리
  // 권한 체크
  // 에러 핸들링
}
```

### 5.2 AdminSidebar (사이드바)
```typescript
interface SidebarMenuItem {
  id: string;
  title: string;
  icon: React.ComponentType;
  path: string;
  children?: SidebarMenuItem[];
  permission?: string;
}

export function AdminSidebar({ currentPath, onMenuClick }: AdminSidebarProps) {
  // 메뉴 구조 정의
  // 권한별 메뉴 필터링
  // 활성 메뉴 표시
  // 반응형 네비게이션
}
```

### 5.3 데이터 테이블 (공통)
```typescript
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchable?: boolean;
  filterable?: boolean;
  pagination?: boolean;
  loading?: boolean;
}

export function DataTable<T>({ data, columns, ...props }: DataTableProps<T>) {
  // 정렬, 필터링, 검색 기능
  // 페이지네이션
  // 로딩 상태
  // 에러 핸들링
}
```

## 6. 상태 관리 설계

### 6.1 OrganizationStore
```typescript
interface OrganizationStore {
  // 상태
  organization: Organization | null;
  departments: Department[];
  loading: boolean;
  error: string | null;
  
  // 액션
  fetchOrganization: (id: string) => Promise<void>;
  updateOrganization: (data: Partial<Organization>) => Promise<void>;
  fetchDepartments: () => Promise<void>;
  addDepartment: (department: Omit<Department, 'id'>) => Promise<void>;
  updateDepartment: (id: string, data: Partial<Department>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
}
```

### 6.2 MemberStore
```typescript
interface MemberStore {
  // 상태
  members: OrganizationMember[];
  invitations: Invitation[];
  loading: boolean;
  error: string | null;
  
  // 액션
  fetchMembers: () => Promise<void>;
  inviteMember: (email: string, role: string) => Promise<void>;
  updateMember: (id: string, data: Partial<OrganizationMember>) => Promise<void>;
  activateMember: (id: string) => Promise<void>;
  deactivateMember: (id: string) => Promise<void>;
  fetchInvitations: () => Promise<void>;
  resendInvitation: (id: string) => Promise<void>;
  cancelInvitation: (id: string) => Promise<void>;
}
```

## 7. 서비스 클래스 설계

### 7.1 OrganizationAdminService
```typescript
export class OrganizationAdminService {
  // 기업 정보 관리
  async getOrganization(id: string): Promise<Organization>;
  async updateOrganization(id: string, data: Partial<Organization>): Promise<void>;
  
  // 조직 관리
  async getDepartments(organizationId: string): Promise<Department[]>;
  async createDepartment(data: Omit<Department, 'id'>): Promise<Department>;
  async updateDepartment(id: string, data: Partial<Department>): Promise<void>;
  async deleteDepartment(id: string): Promise<void>;
  
  // 통계 및 대시보드
  async getOrganizationStats(organizationId: string): Promise<OrganizationStats>;
  async getRecentActivity(organizationId: string): Promise<Activity[]>;
}
```

### 7.2 OrganizationMemberService
```typescript
export class OrganizationMemberService {
  // 운영자 관리
  async getMembers(organizationId: string): Promise<OrganizationMember[]>;
  async inviteMember(organizationId: string, email: string, role: string): Promise<void>;
  async updateMember(id: string, data: Partial<OrganizationMember>): Promise<void>;
  async activateMember(id: string): Promise<void>;
  async deactivateMember(id: string): Promise<void>;
  
  // 초대 관리
  async getInvitations(organizationId: string): Promise<Invitation[]>;
  async resendInvitation(id: string): Promise<void>;
  async cancelInvitation(id: string): Promise<void>;
  
  // 권한 관리
  async updatePermissions(memberId: string, permissions: Permission[]): Promise<void>;
  async getPermissions(memberId: string): Promise<Permission[]>;
}
```

## 8. 데이터베이스 스키마

### 8.1 Organizations Collection
```typescript
interface Organization {
  id: string;
  name: string;
  industry: string;
  size: number;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  settings: {
    timezone: string;
    language: string;
    currency: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### 8.2 Departments Collection
```typescript
interface Department {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  parentId?: string;
  managerId?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 8.3 OrganizationMembers Collection
```typescript
interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  email: string;
  role: 'ORGANIZATION_ADMIN' | 'ORGANIZATION_MEMBER';
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  departments: string[];
  permissions: Permission[];
  invitedAt: Date;
  joinedAt?: Date;
  lastActiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## 9. API 설계

### 9.1 Organization API
```typescript
// GET /api/organizations/{id}
// PUT /api/organizations/{id}
// GET /api/organizations/{id}/stats
// GET /api/organizations/{id}/activity

// GET /api/organizations/{id}/departments
// POST /api/organizations/{id}/departments
// PUT /api/departments/{id}
// DELETE /api/departments/{id}
```

### 9.2 Members API
```typescript
// GET /api/organizations/{id}/members
// POST /api/organizations/{id}/members/invite
// PUT /api/members/{id}
// DELETE /api/members/{id}
// POST /api/members/{id}/activate
// POST /api/members/{id}/deactivate

// GET /api/organizations/{id}/invitations
// POST /api/invitations/{id}/resend
// DELETE /api/invitations/{id}
```

## 10. 테스트 전략

### 10.1 단위 테스트
- 모든 서비스 클래스 테스트
- 유틸리티 함수 테스트
- 커스텀 훅 테스트
- 상태 관리 테스트

### 10.2 통합 테스트
- API 연동 테스트
- 인증/권한 테스트
- 데이터베이스 연동 테스트

### 10.3 E2E 테스트
- 주요 사용자 플로우 테스트
- 크로스 브라우저 테스트
- 반응형 디자인 테스트

## 11. 배포 및 운영

### 11.1 배포 전략
- 스테이징 환경에서 충분한 테스트
- 점진적 배포 (Blue-Green 배포)
- 롤백 계획 수립

### 11.2 모니터링
- 애플리케이션 성능 모니터링
- 에러 추적 시스템
- 사용자 행동 분석

### 11.3 유지보수
- 정기적인 보안 업데이트
- 성능 최적화
- 사용자 피드백 반영

## 12. 성공 지표

### 12.1 개발 지표
- 코드 커버리지: 80% 이상
- 빌드 시간: 5분 이내
- 번들 크기: 2MB 이하
- 로딩 시간: 2초 이내

### 12.2 사용자 지표
- 사용자 만족도: 4.5/5.0 이상
- 작업 완료율: 95% 이상
- 에러 발생률: 1% 이하
- 일일 활성 사용자: 80% 이상

## 13. 다음 단계

### 13.1 Phase 6: 고급 기능 (추후 계획)
- 고급 분석 대시보드
- 자동화 기능
- 알림 시스템
- 모바일 앱 연동

### 13.2 Phase 7: 확장 기능
- 다국어 지원
- 접근성 개선
- 오프라인 지원
- PWA 기능

이 구현 계획에 따라 체계적으로 개발을 진행하면 안정적이고 확장 가능한 기업 관리자 서비스를 구축할 수 있을 것입니다. 