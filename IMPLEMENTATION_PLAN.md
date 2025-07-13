# Mind Breeze AI 기업 멤버 간편 UX 구현 기획서

## 📋 프로젝트 개요

### 목표
- 기업 관리자: 정식 인증 절차 (이메일, 결제 등)
- 기업 멤버: 간편 등록 및 측정 (이름+생년월일+전화번호)
- 기존 Landing 페이지와 일관된 디자인 시스템 적용

### 핵심 전략
- **하이브리드 접근**: 기존 User 테이블 확장 + 새로운 UserType 추가
- **통합 UI 시스템**: Landing 페이지 스타일 일관성 유지
- **단계별 구현**: DB → API → UI 순서로 진행

---

## 🗄️ 1. DATABASE 구조

### 1.1 기존 스키마 확장

#### UserType 확장
```graphql
enum UserType {
  SYSTEM_ADMIN
  ORGANIZATION_ADMIN  
  ORGANIZATION_MEMBER
  INDIVIDUAL_USER
  MEASUREMENT_SUBJECT    # 새로 추가
}
```

#### User 테이블 확장
```graphql
type User @table {
  # 기본 정보
  email: String              # 측정 대상자는 선택사항
  displayName: String!
  
  # 측정 대상자 전용 필드 (새로 추가)
  birthDate: Date            # 생년월일 (Unique ID용)
  phoneNumber: String        # 전화번호 (Unique ID용)
  gender: Gender             # 성별 (새로 추가)
  occupation: String         # 직업
  
  # 기존 필드들
  employeeId: String
  organizationId: UUID
  userType: UserType!
  department: String
  position: String
  personalCreditBalance: Int
  isActive: Boolean!
  profileImage: String
  permissions: String
  
  # 메타데이터 확장
  createdAt: Timestamp!
  createdBy: User           # 생성자 (기업 관리자)
  lastMeasurementAt: Timestamp
  lastLoginAt: Timestamp
  updatedAt: Timestamp
  
  # 인증 상태 (새로 추가)
  isEmailVerified: Boolean! # 기본값: false (측정 대상자는 false)
  authMethod: AuthMethod!   # 인증 방식
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

enum AuthMethod {
  FULL_AUTH             # 정식 인증 (이메일, 패스워드)
  SIMPLE_REGISTRATION   # 간편 등록 (이름+생년월일+전화번호)
}
```

#### 복합 Unique 제약조건
```graphql
# 측정 대상자용 복합 Unique 제약조건
# displayName + birthDate + phoneNumber + organizationId
# 같은 조직 내에서만 중복 방지
```

### 1.2 추가 테이블

#### ConsentRecord (개인정보 처리 동의)
```graphql
type ConsentRecord @table {
  id: UUID! @default(expr: "uuidV4()")
  user: User!
  organization: Organization!
  
  # 동의 항목들
  personalDataProcessing: Boolean!     # 개인정보 처리 동의
  measurementDataUsage: Boolean!       # 측정 데이터 활용 동의
  thirdPartySharing: Boolean!          # 제3자 제공 동의
  marketingCommunication: Boolean!     # 마케팅 활용 동의
  
  # 메타데이터
  consentedAt: Timestamp!
  consentedBy: User!                   # 동의 주체 (기업 관리자 또는 본인)
  ipAddress: String!
  userAgent: String
  
  # 동의 철회
  revokedAt: Timestamp
  revokedBy: User
}
```

#### MeasurementSession (측정 세션 확장)
```graphql
type MeasurementSession @table {
  id: UUID! @default(expr: "uuidV4()")
  user: User!                    # 측정 대상자
  organization: Organization!
  initiatedBy: User!             # 세션을 시작한 사용자 (기업 관리자)
  device: Device!
  
  # 세션 정보
  startTime: Timestamp!
  endTime: Timestamp
  status: SessionStatus!
  durationSeconds: Int
  
  # 측정 데이터
  rawDataUri: String
  processedDataUri: String
  qualityScore: Float
  
  # 간편 인증 정보 (측정 대상자용)
  verificationData: String       # JSON: { name, birthDate, phoneNumber }
  
  createdAt: Timestamp!
}

enum SessionStatus {
  INITIATED
  IN_PROGRESS
  COMPLETED
  FAILED
  CANCELLED
}
```

---

## 🔌 2. API 구조

### 2.1 인증 관련 API

#### 간편 등록 API
```typescript
// POST /api/auth/simple-register
interface SimpleRegisterRequest {
  organizationId: string;
  displayName: string;
  birthDate: string;          // YYYY-MM-DD
  phoneNumber: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  occupation?: string;
  department?: string;
  position?: string;
  email?: string;
  consent: ConsentData;
}

interface ConsentData {
  personalDataProcessing: boolean;
  measurementDataUsage: boolean;
  thirdPartySharing: boolean;
  marketingCommunication: boolean;
}

interface SimpleRegisterResponse {
  success: boolean;
  user?: {
    id: string;
    displayName: string;
    userType: 'MEASUREMENT_SUBJECT';
    organizationId: string;
  };
  error?: string;
}
```

#### 중복 확인 API
```typescript
// POST /api/auth/check-duplicate
interface CheckDuplicateRequest {
  organizationId: string;
  displayName: string;
  birthDate: string;
  phoneNumber: string;
}

interface CheckDuplicateResponse {
  exists: boolean;
  suggestion?: string;        // 중복 시 대안 제시
}
```

### 2.2 기업 관리자 API

#### 측정 대상자 관리 API
```typescript
// GET /api/organization/measurement-subjects
interface GetMeasurementSubjectsResponse {
  subjects: MeasurementSubject[];
  totalCount: number;
  pagination: PaginationInfo;
}

// POST /api/organization/measurement-subjects
interface CreateMeasurementSubjectRequest {
  subjects: MeasurementSubjectForm[];
}

// POST /api/organization/measurement-subjects/bulk
interface BulkCreateRequest {
  csvData: string;
  validateOnly?: boolean;
}

interface MeasurementSubjectForm {
  displayName: string;
  birthDate: string;
  phoneNumber: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  occupation?: string;
  department?: string;
  position?: string;
  email?: string;
}
```

#### 빠른 측정 API
```typescript
// POST /api/measurement/quick-start
interface QuickMeasurementRequest {
  subjectId?: string;         // 기존 등록된 대상자
  newSubject?: MeasurementSubjectForm;  // 새로운 대상자
  deviceId: string;
}

interface QuickMeasurementResponse {
  sessionId: string;
  subject: MeasurementSubject;
  deviceStatus: DeviceStatus;
  nextStep: 'DEVICE_CONNECT' | 'START_MEASUREMENT';
}
```

### 2.3 측정 세션 API

#### 세션 관리 API
```typescript
// POST /api/measurement/sessions
interface CreateSessionRequest {
  subjectId: string;
  organizationId: string;
  deviceId: string;
  verificationData?: {
    name: string;
    birthDate: string;
    phoneNumber: string;
  };
}

// GET /api/measurement/sessions/{sessionId}
interface GetSessionResponse {
  session: MeasurementSession;
  realTimeData?: RealTimeData;
  status: SessionStatus;
}

// POST /api/measurement/sessions/{sessionId}/complete
interface CompleteSessionRequest {
  endTime: string;
  durationSeconds: number;
  qualityScore: number;
  rawDataUri: string;
}
```

---

## 🎨 3. UI 구조 및 디자인 시스템

### 3.1 디자인 시스템 (Landing 페이지 기반)

#### 색상 체계
```typescript
const colors = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    600: '#0284c7',   // 메인 블루
    700: '#0369a1',
  },
  secondary: {
    50: '#f0fdf4',
    100: '#dcfce7',
    600: '#16a34a',   // 메인 그린
    700: '#15803d',
  },
  accent: {
    50: '#faf5ff',
    100: '#f3e8ff',
    600: '#9333ea',   // 메인 퍼플
    700: '#7c3aed',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    600: '#4b5563',
    900: '#111827',
  }
};
```

#### 레이아웃 컴포넌트
```typescript
// 기본 레이아웃 구조
const Layout = {
  container: "container mx-auto px-4 sm:px-6 lg:px-8",
  section: "py-20",
  card: "bg-white rounded-3xl shadow-2xl border border-gray-100",
  cardMd: "bg-white rounded-2xl shadow-md border border-gray-100",
  cardSm: "bg-white rounded-xl shadow-sm border border-gray-100",
  gradient: "bg-gradient-to-br from-blue-50 via-white to-green-50",
  gradientHeader: "bg-gradient-to-r from-blue-600 to-green-600",
};
```

### 3.2 컴포넌트 구조

#### 기업 관리자 대시보드
```typescript
// src/components/Dashboard/OrganizationAdmin/
├── OrganizationAdminDashboard.tsx
├── QuickMeasurement/
│   ├── QuickMeasurementPanel.tsx
│   ├── SubjectSelector.tsx
│   ├── NewSubjectForm.tsx
│   └── DeviceConnector.tsx
├── MemberManagement/
│   ├── MemberManagementPanel.tsx
│   ├── MemberList.tsx
│   ├── MemberForm.tsx
│   ├── BulkUpload.tsx
│   └── MemberDetails.tsx
├── DataCenter/
│   ├── DataCenterPanel.tsx
│   ├── SessionHistory.tsx
│   ├── OrganizationInsights.tsx
│   └── ReportViewer.tsx
├── CreditManagement/
│   ├── CreditManagementPanel.tsx
│   ├── CreditBalance.tsx
│   ├── UsageHistory.tsx
│   └── PaymentForm.tsx
└── LinkBandManagement/
    ├── LinkBandPanel.tsx
    ├── DeviceList.tsx
    ├── DeviceStatus.tsx
    └── RentalInfo.tsx
```

#### 공통 UI 컴포넌트
```typescript
// src/components/ui/enterprise/
├── StatusBadge.tsx
├── MetricCard.tsx
├── QuickActionButton.tsx
├── DataTable.tsx
├── SearchFilter.tsx
├── PaginationControls.tsx
├── LoadingSpinner.tsx
└── EmptyState.tsx
```

### 3.3 상세 UI 설계

#### 3.3.1 기업 관리자 메인 대시보드
```typescript
interface OrganizationAdminDashboardProps {
  user: EnterpriseUser;
  organization: Organization;
  permissions: Permission[];
}

const OrganizationAdminDashboard: React.FC<OrganizationAdminDashboardProps> = ({
  user,
  organization,
  permissions
}) => {
  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-green-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {organization.name}
                </h1>
                <p className="text-sm text-gray-600">기업 관리자</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <CreditBalance balance={organization.creditBalance} />
              <UserProfile user={user} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <QuickActionCard
            icon={Zap}
            title="바로 측정"
            description="즉시 측정 시작"
            onClick={() => setActiveTab('quick-measurement')}
            gradient="from-blue-600 to-blue-700"
          />
          <QuickActionCard
            icon={Database}
            title="Data Center"
            description="측정 데이터 관리"
            onClick={() => setActiveTab('data-center')}
            gradient="from-green-600 to-green-700"
          />
          <QuickActionCard
            icon={CreditCard}
            title="Credits"
            description="크레딧 관리"
            onClick={() => setActiveTab('credits')}
            gradient="from-purple-600 to-purple-700"
          />
          <QuickActionCard
            icon={Smartphone}
            title="Link Bands"
            description="디바이스 관리"
            onClick={() => setActiveTab('linkbands')}
            gradient="from-orange-600 to-orange-700"
          />
          <QuickActionCard
            icon={Users}
            title="Members"
            description="멤버 관리"
            onClick={() => setActiveTab('members')}
            gradient="from-red-600 to-red-700"
          />
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="총 멤버 수"
            value={organization.totalMemberCount}
            icon={Users}
            change="+5"
            changeType="increase"
          />
          <MetricCard
            title="이번 달 측정"
            value={stats.monthlyMeasurements}
            icon={Activity}
            change="+12"
            changeType="increase"
          />
          <MetricCard
            title="남은 크레딧"
            value={organization.creditBalance}
            icon={CreditCard}
            change="-24"
            changeType="decrease"
          />
          <MetricCard
            title="활성 디바이스"
            value={stats.activeDevices}
            icon={Smartphone}
            change="0"
            changeType="neutral"
          />
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100">
          {activeTab === 'quick-measurement' && <QuickMeasurementPanel />}
          {activeTab === 'data-center' && <DataCenterPanel />}
          {activeTab === 'credits' && <CreditManagementPanel />}
          {activeTab === 'linkbands' && <LinkBandManagementPanel />}
          {activeTab === 'members' && <MemberManagementPanel />}
        </div>
      </div>
    </div>
  );
};
```

#### 3.3.2 바로 측정 패널
```typescript
const QuickMeasurementPanel: React.FC = () => {
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [selectedSubject, setSelectedSubject] = useState<MeasurementSubject | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>('disconnected');

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">바로 측정</h2>
        <p className="text-gray-600">측정 대상자를 선택하고 즉시 측정을 시작하세요</p>
      </div>

      {/* Mode Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div
          className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
            mode === 'existing' 
              ? 'border-blue-600 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => setMode('existing')}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">등록된 멤버</h3>
          </div>
          <p className="text-gray-600">기존에 등록된 멤버를 선택하여 측정</p>
        </div>

        <div
          className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
            mode === 'new' 
              ? 'border-green-600 bg-green-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => setMode('new')}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">새로운 측정 대상자</h3>
          </div>
          <p className="text-gray-600">새로운 대상자 정보를 입력하여 측정</p>
        </div>
      </div>

      {/* Content based on mode */}
      {mode === 'existing' ? (
        <SubjectSelector
          onSelect={setSelectedSubject}
          selected={selectedSubject}
        />
      ) : (
        <NewSubjectForm
          onSubmit={handleNewSubjectSubmit}
        />
      )}

      {/* Device Connection */}
      {(selectedSubject || mode === 'new') && (
        <div className="mt-8 p-6 bg-gray-50 rounded-2xl">
          <h3 className="text-lg font-bold text-gray-900 mb-4">디바이스 연결</h3>
          <DeviceConnector
            status={deviceStatus}
            onStatusChange={setDeviceStatus}
          />
        </div>
      )}

      {/* Start Measurement Button */}
      {deviceStatus === 'connected' && (
        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-lg px-12 py-4"
            onClick={handleStartMeasurement}
          >
            <Zap className="w-5 h-5 mr-2" />
            측정 시작
          </Button>
        </div>
      )}
    </div>
  );
};
```

#### 3.3.3 새로운 측정 대상자 폼
```typescript
const NewSubjectForm: React.FC<{
  onSubmit: (data: MeasurementSubjectForm) => void;
}> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<MeasurementSubjectForm>({
    displayName: '',
    birthDate: '',
    phoneNumber: '',
    gender: 'MALE',
    occupation: '',
    department: '',
    position: '',
    email: ''
  });

  const [isDuplicateChecking, setIsDuplicateChecking] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState<CheckDuplicateResponse | null>(null);

  const handleDuplicateCheck = async () => {
    setIsDuplicateChecking(true);
    try {
      const result = await checkDuplicate({
        organizationId: organization.id,
        displayName: formData.displayName,
        birthDate: formData.birthDate,
        phoneNumber: formData.phoneNumber,
      });
      setDuplicateResult(result);
    } finally {
      setIsDuplicateChecking(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-6">측정 대상자 정보</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 이름 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            이름 *
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            value={formData.displayName}
            onChange={(e) => setFormData({...formData, displayName: e.target.value})}
            placeholder="홍길동"
          />
        </div>

        {/* 생년월일 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            생년월일 *
          </label>
          <input
            type="date"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            value={formData.birthDate}
            onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
          />
        </div>

        {/* 전화번호 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            전화번호 *
          </label>
          <input
            type="tel"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
            placeholder="010-1234-5678"
          />
        </div>

        {/* 성별 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            성별 *
          </label>
          <select
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            value={formData.gender}
            onChange={(e) => setFormData({...formData, gender: e.target.value as Gender})}
          >
            <option value="MALE">남성</option>
            <option value="FEMALE">여성</option>
            <option value="OTHER">기타</option>
          </select>
        </div>

        {/* 직업 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            직업
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            value={formData.occupation}
            onChange={(e) => setFormData({...formData, occupation: e.target.value})}
            placeholder="회사원"
          />
        </div>

        {/* 부서 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            부서
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            value={formData.department}
            onChange={(e) => setFormData({...formData, department: e.target.value})}
            placeholder="개발팀"
          />
        </div>
      </div>

      {/* 중복 확인 */}
      <div className="mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={handleDuplicateCheck}
          disabled={!formData.displayName || !formData.birthDate || !formData.phoneNumber || isDuplicateChecking}
          className="w-full"
        >
          {isDuplicateChecking ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              중복 확인 중...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              중복 확인
            </>
          )}
        </Button>

        {duplicateResult && (
          <div className={`mt-4 p-4 rounded-xl ${
            duplicateResult.exists 
              ? 'bg-red-50 border border-red-200' 
              : 'bg-green-50 border border-green-200'
          }`}>
            <div className="flex items-center space-x-2">
              {duplicateResult.exists ? (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              <span className={`font-medium ${
                duplicateResult.exists ? 'text-red-900' : 'text-green-900'
              }`}>
                {duplicateResult.exists 
                  ? '중복된 사용자가 있습니다' 
                  : '사용 가능한 정보입니다'
                }
              </span>
            </div>
            {duplicateResult.suggestion && (
              <p className="mt-2 text-sm text-red-700">
                제안: {duplicateResult.suggestion}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 개인정보 동의 */}
      <div className="mt-6 p-4 bg-gray-50 rounded-xl">
        <h4 className="font-medium text-gray-900 mb-3">개인정보 처리 동의</h4>
        <div className="space-y-2">
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
            <span className="text-sm text-gray-700">개인정보 처리 동의 (필수)</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
            <span className="text-sm text-gray-700">측정 데이터 활용 동의 (필수)</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
            <span className="text-sm text-gray-700">마케팅 활용 동의 (선택)</span>
          </label>
        </div>
      </div>

      {/* 등록 버튼 */}
      <div className="mt-6">
        <Button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700"
          disabled={!duplicateResult || duplicateResult.exists}
          onClick={() => onSubmit(formData)}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          등록하고 측정 시작
        </Button>
      </div>
    </div>
  );
};
```

---

## 🚀 4. 구현 순서

### Phase 1: Database & API (1주)
- [ ] DB 스키마 확장 (UserType, User 테이블)
- [ ] 복합 Unique 제약조건 구현
- [ ] 간편 등록 API 구현
- [ ] 중복 확인 API 구현
- [ ] 기본 인증 로직 구현

### Phase 2: 기업 관리자 UI (1주)
- [ ] 기업 관리자 메인 대시보드
- [ ] 바로 측정 패널 (기본 구조)
- [ ] 새로운 측정 대상자 폼
- [ ] 디바이스 연결 컴포넌트
- [ ] 기본 UI 컴포넌트 라이브러리

### Phase 3: 고급 기능 (1주)
- [ ] 기존 멤버 선택 및 관리
- [ ] 대량 등록 (CSV) 기능
- [ ] 측정 세션 관리
- [ ] 실시간 상태 업데이트
- [ ] 에러 핸들링 및 검증

### Phase 4: 통합 및 최적화 (1주)
- [ ] 전체 플로우 통합 테스트
- [ ] 성능 최적화
- [ ] 반응형 디자인 적용
- [ ] 보안 검증
- [ ] 문서화 및 배포

---

## 📱 5. 반응형 디자인

### 5.1 브레이크포인트
```typescript
const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};
```

### 5.2 모바일 최적화
- 터치 친화적인 버튼 크기 (44px 이상)
- 간편한 입력 폼 (큰 입력 필드, 명확한 라벨)
- 모바일 키보드 최적화
- 스와이프 제스처 지원

---

## 🔒 6. 보안 고려사항

### 6.1 데이터 보호
- 개인정보 암호화 저장
- API 요청 시 JWT 토큰 검증
- 조직 간 데이터 접근 제한
- 감사 로그 기록

### 6.2 입력 검증
- 클라이언트 및 서버 사이드 검증
- SQL 인젝션 방지
- XSS 공격 방지
- CSRF 토큰 적용

---

## 📊 7. 성능 최적화

### 7.1 프론트엔드 최적화
- React.memo 및 useMemo 활용
- 가상화된 리스트 (react-window)
- 이미지 최적화 (WebP, lazy loading)
- 코드 분할 (dynamic imports)

### 7.2 백엔드 최적화
- 데이터베이스 인덱스 최적화
- 캐싱 전략 (Redis)
- API 응답 압축
- 페이지네이션 구현

---

## 🧪 8. 테스트 전략

### 8.1 단위 테스트
- API 엔드포인트 테스트
- 비즈니스 로직 테스트
- 컴포넌트 테스트 (React Testing Library)
- 유틸리티 함수 테스트

### 8.2 통합 테스트
- 사용자 플로우 테스트
- API 통합 테스트
- 데이터베이스 트랜잭션 테스트
- 디바이스 연결 테스트

### 8.3 E2E 테스트
- 회원 등록부터 측정 완료까지
- 다양한 브라우저 환경
- 모바일 디바이스 테스트
- 성능 테스트 (Load Testing)

---

## 📈 9. 모니터링 및 분석

### 9.1 사용자 행동 분석
- 등록 완료율
- 측정 성공률
- 사용자 이탈 지점
- 기능별 사용 빈도

### 9.2 시스템 모니터링
- API 응답 시간
- 에러율 및 에러 로그
- 데이터베이스 성능
- 서버 리소스 사용량

---

## 🎯 10. 성공 지표

### 10.1 사용자 경험 지표
- 등록 완료 시간 < 2분
- 측정 시작까지 시간 < 30초
- 사용자 만족도 > 4.5/5
- 지원 문의 감소율 > 30%

### 10.2 비즈니스 지표
- 월간 활성 사용자 증가
- 기업 갱신율 향상
- 크레딧 사용량 증가
- 신규 기업 고객 유치

---

이 기획서를 바탕으로 단계적으로 구현을 진행하면 됩니다. 어떤 부분부터 시작할까요? 