# DB 구조 및 세부 구현 계획

## 📊 현재 DB 구조 분석

### 사용 중인 DB 시스템
- **Firebase Data Connect (GraphQL)** - 메인 스키마
- **Firestore (NoSQL)** - 실시간 데이터 및 트랜잭션
- **하이브리드 구조**: 구조화된 데이터는 Data Connect, 실시간/트랜잭션은 Firestore

### 기존 핵심 테이블/컬렉션
```typescript
// Firebase Data Connect (GraphQL)
- User (사용자 기본 정보)
- Organization (조직 정보)
- OrganizationMember (조직 멤버십)
- CreditTransaction (크레딧 거래)
- Device (디바이스 정보)
- BioSignalSession (측정 세션)
- MentalHealthReport (건강 리포트)
- TrialService (체험 서비스)
- Contract (계약 정보)
- AIReportUsage (AI 리포트 사용)

// Firestore Collections
- users (사용자 프로필)
- organizations (조직 실시간 데이터)
- creditTransactions (크레딧 거래 이력)
- devices (디바이스 상태)
- chatHistory (AI 상담 이력)
- healthReports (건강 리포트)
```

---

## 🔧 추가 필요 DB 구조

### 1. 시스템 관리자를 위한 추가 테이블

#### A. SystemStats (시스템 통계)
```graphql
type SystemStats @table {
  id: UUID! @default(expr: "uuidV4()")
  date: Date!
  
  # 전체 현황
  totalOrganizations: Int!
  totalUsers: Int!
  activeUsers: Int!
  totalReports: Int!
  totalSessions: Int!
  
  # 사용량 통계
  dailyReports: Int!
  weeklyReports: Int!
  monthlyReports: Int!
  
  # 크레딧 통계
  totalCreditsIssued: Int!
  totalCreditsUsed: Int!
  totalRevenue: Int!
  
  # 시스템 상태
  systemHealth: String!      # 'HEALTHY' | 'WARNING' | 'CRITICAL'
  errorCount: Int!
  
  createdAt: Timestamp!
}
```

#### B. SystemLogs (시스템 로그)
```graphql
type SystemLog @table {
  id: UUID! @default(expr: "uuidV4()")
  level: LogLevel!
  category: LogCategory!
  message: String!
  details: String           # JSON string
  
  # 관련 정보
  userId: String
  organizationId: String
  requestId: String
  
  createdAt: Timestamp!
}

enum LogLevel {
  DEBUG
  INFO
  WARNING
  ERROR
  CRITICAL
}

enum LogCategory {
  AUTH
  PAYMENT
  SYSTEM
  API
  MEASUREMENT
  REPORT
}
```

#### C. OrganizationMetrics (조직별 메트릭)
```graphql
type OrganizationMetrics @table {
  id: UUID! @default(expr: "uuidV4()")
  organization: Organization!
  period: String!           # 'DAILY' | 'WEEKLY' | 'MONTHLY'
  periodStart: Date!
  periodEnd: Date!
  
  # 사용량 메트릭
  activeMemberCount: Int!
  totalMeasurements: Int!
  completedReports: Int!
  consultationSessions: Int!
  
  # 크레딧 메트릭
  creditsUsed: Int!
  creditsRemaining: Int!
  
  # 참여도 메트릭
  participationRate: Float!
  completionRate: Float!
  
  # 건강 메트릭
  averageHealthScore: Float!
  riskMemberCount: Int!
  
  createdAt: Timestamp!
}
```

### 2. 기업 관리자를 위한 추가 테이블

#### A. LinkBandDevice (링크밴드 관리)
```graphql
type LinkBandDevice @table {
  id: UUID! @default(expr: "uuidV4()")
  organization: Organization!
  serialNumber: String!
  model: String!
  
  # 할당 정보
  assignedTo: User            # 현재 사용자
  assignedAt: Timestamp
  
  # 렌탈 정보
  rentalType: RentalType!
  rentalStartDate: Date!
  rentalEndDate: Date!
  rentalCost: Int!
  
  # 상태 정보
  status: DeviceStatus!
  lastSyncAt: Timestamp
  batteryLevel: Int
  firmwareVersion: String
  
  # 사용 통계
  totalUsageHours: Int!
  lastUsedAt: Timestamp
  
  createdAt: Timestamp!
  updatedAt: Timestamp!
}

enum RentalType {
  MONTHLY
  QUARTERLY
  SEMI_ANNUAL
  PURCHASED
}

enum DeviceStatus {
  ACTIVE
  INACTIVE
  MAINTENANCE
  LOST
  RETURNED
}
```

#### B. MemberInvitation (멤버 초대)
```graphql
type MemberInvitation @table {
  id: UUID! @default(expr: "uuidV4()")
  organization: Organization!
  invitedBy: User!
  
  # 초대 정보
  employeeId: String!
  email: String
  displayName: String!
  department: String
  position: String
  
  # 초대 상태
  status: InvitationStatus!
  invitedAt: Timestamp!
  expiresAt: Timestamp!
  acceptedAt: Timestamp
  
  # 초대 코드
  invitationCode: String!
  
  createdAt: Timestamp!
}

enum InvitationStatus {
  PENDING
  ACCEPTED
  EXPIRED
  CANCELLED
}
```

#### C. OrganizationInsights (조직 인사이트)
```graphql
type OrganizationInsights @table {
  id: UUID! @default(expr: "uuidV4()")
  organization: Organization!
  generatedAt: Timestamp!
  
  # 위험 회원 분석
  riskMembers: String!        # JSON array of risk member data
  
  # 부서별 건강 분석
  departmentHealth: String!   # JSON object of department health scores
  
  # 트렌드 분석
  healthTrends: String!       # JSON object of health trends
  
  # 추천사항
  recommendations: String!    # JSON array of recommendations
  
  # 알림 생성
  alerts: String!             # JSON array of alerts
  
  createdAt: Timestamp!
}
```

### 3. Firestore 컬렉션 확장

#### A. systemStats (실시간 시스템 통계)
```typescript
interface SystemStatsRealtime {
  date: string;
  currentActiveUsers: number;
  currentSystemLoad: number;
  realtimeMetrics: {
    apiCallsPerMinute: number;
    errorRatePercentage: number;
    responseTimeAverage: number;
  };
  alerts: {
    id: string;
    type: 'WARNING' | 'ERROR' | 'CRITICAL';
    message: string;
    timestamp: Date;
  }[];
}
```

#### B. organizationDashboard (조직 대시보드 데이터)
```typescript
interface OrganizationDashboardData {
  organizationId: string;
  lastUpdated: Date;
  
  quickStats: {
    totalMembers: number;
    activeMembers: number;
    recentMeasurements: number;
    riskMembers: number;
    creditBalance: number;
  };
  
  recentActivity: {
    type: 'MEASUREMENT' | 'REPORT' | 'CONSULTATION' | 'MEMBER_JOIN';
    userId: string;
    userName: string;
    timestamp: Date;
    details: any;
  }[];
  
  alerts: {
    type: 'CREDIT_LOW' | 'DEVICE_ISSUE' | 'MEMBER_RISK';
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    message: string;
    timestamp: Date;
  }[];
}
```

---

## 🏗 세부 구현 계획

### 1. 시스템 관리자 기능 구현

#### A. SystemAdminService
```typescript
class SystemAdminService {
  // 전체 시스템 현황
  async getSystemOverview(): Promise<SystemOverview>;
  
  // 기업별 현황
  async getOrganizationList(filters?: OrganizationFilters): Promise<Organization[]>;
  async getOrganizationDetails(orgId: string): Promise<OrganizationDetails>;
  async getOrganizationMetrics(orgId: string, period: string): Promise<OrganizationMetrics>;
  
  // 시스템 모니터링
  async getSystemStats(dateRange: DateRange): Promise<SystemStats[]>;
  async getSystemLogs(filters: LogFilters): Promise<SystemLog[]>;
  async getSystemHealth(): Promise<SystemHealth>;
  
  // 관리 작업
  async suspendOrganization(orgId: string, reason: string): Promise<void>;
  async reactivateOrganization(orgId: string): Promise<void>;
  async adjustOrganizationCredits(orgId: string, amount: number, reason: string): Promise<void>;
}
```

#### B. SystemMetricsService
```typescript
class SystemMetricsService {
  // 메트릭 수집
  async collectDailyMetrics(): Promise<void>;
  async collectRealTimeMetrics(): Promise<void>;
  
  // 메트릭 분석
  async analyzeSystemTrends(period: string): Promise<TrendAnalysis>;
  async detectAnomalies(): Promise<Anomaly[]>;
  async generateAlerts(): Promise<Alert[]>;
  
  // 리포트 생성
  async generateSystemReport(type: 'DAILY' | 'WEEKLY' | 'MONTHLY'): Promise<string>;
}
```

### 2. 기업 관리자 기능 구현

#### A. OrganizationDashboardService
```typescript
class OrganizationDashboardService {
  // 대시보드 데이터
  async getDashboardData(orgId: string): Promise<OrganizationDashboardData>;
  async getQuickStats(orgId: string): Promise<QuickStats>;
  async getRecentActivity(orgId: string, limit: number): Promise<Activity[]>;
  
  // 알림 관리
  async getAlerts(orgId: string): Promise<Alert[]>;
  async markAlertAsRead(alertId: string): Promise<void>;
  async dismissAlert(alertId: string): Promise<void>;
}
```

#### B. OrganizationDataCenterService
```typescript
class OrganizationDataCenterService {
  // 데이터 조회
  async getOrganizationView(orgId: string): Promise<OrganizationViewData>;
  async getMemberView(orgId: string, memberId?: string): Promise<MemberViewData>;
  async getReportDetails(reportId: string): Promise<ReportDetails>;
  
  // 인사이트 분석
  async generateInsights(orgId: string): Promise<OrganizationInsights>;
  async getRiskMembers(orgId: string): Promise<RiskMember[]>;
  async getDepartmentHealth(orgId: string): Promise<DepartmentHealth[]>;
  
  // 데이터 내보내기
  async exportData(orgId: string, options: ExportOptions): Promise<string>;
}
```

#### C. OrganizationMemberService
```typescript
class OrganizationMemberService {
  // 멤버 관리
  async getMembers(orgId: string, filters?: MemberFilters): Promise<OrganizationMember[]>;
  async getMemberDetails(memberId: string): Promise<MemberDetails>;
  async updateMemberInfo(memberId: string, updates: MemberUpdates): Promise<void>;
  
  // 멤버 초대
  async inviteMember(orgId: string, invitationData: InvitationData): Promise<string>;
  async bulkInviteMembers(orgId: string, csvData: string): Promise<BulkInvitationResult>;
  async cancelInvitation(invitationId: string): Promise<void>;
  
  // 멤버 상태 관리
  async activateMember(memberId: string): Promise<void>;
  async deactivateMember(memberId: string): Promise<void>;
  async removeMember(memberId: string): Promise<void>;
}
```

#### D. LinkBandManagementService
```typescript
class LinkBandManagementService {
  // 디바이스 관리
  async getOrganizationDevices(orgId: string): Promise<LinkBandDevice[]>;
  async getDeviceDetails(deviceId: string): Promise<DeviceDetails>;
  async assignDevice(deviceId: string, userId: string): Promise<void>;
  async unassignDevice(deviceId: string): Promise<void>;
  
  // 렌탈 관리
  async renewDeviceRental(deviceId: string, period: RentalPeriod): Promise<void>;
  async getExpiringDevices(orgId: string, days: number): Promise<LinkBandDevice[]>;
  
  // 상태 모니터링
  async syncDeviceStatus(deviceId: string): Promise<void>;
  async getLowBatteryDevices(orgId: string): Promise<LinkBandDevice[]>;
  async getDeviceUsageStats(deviceId: string): Promise<DeviceUsageStats>;
}
```

### 3. 공통 서비스 확장

#### A. CreditManagementService 확장
```typescript
// 기존 서비스에 추가 메서드
class CreditManagementService {
  // 조직별 크레딧 관리
  async getOrganizationCreditDashboard(orgId: string): Promise<CreditDashboard>;
  async getCreditUsageProjection(orgId: string): Promise<CreditProjection>;
  async setCreditAlert(orgId: string, threshold: number): Promise<void>;
  
  // 부서별 크레딧 할당
  async allocateCreditsToDepartment(orgId: string, department: string, amount: number): Promise<void>;
  async getDepartmentCreditUsage(orgId: string): Promise<DepartmentCreditUsage[]>;
  
  // 크레딧 구매 및 결제
  async initiateCreditPurchase(orgId: string, amount: number, paymentMethod: string): Promise<string>;
  async processCreditPayment(paymentId: string): Promise<void>;
  async getCreditPurchaseHistory(orgId: string): Promise<CreditPurchase[]>;
}
```

#### B. NotificationService (신규)
```typescript
class NotificationService {
  // 알림 생성
  async createAlert(type: AlertType, recipientId: string, message: string): Promise<void>;
  async createSystemAlert(type: AlertType, message: string): Promise<void>;
  
  // 알림 전송
  async sendEmailNotification(email: string, subject: string, body: string): Promise<void>;
  async sendSMSNotification(phone: string, message: string): Promise<void>;
  
  // 알림 관리
  async getNotifications(userId: string): Promise<Notification[]>;
  async markAsRead(notificationId: string): Promise<void>;
  async getUnreadCount(userId: string): Promise<number>;
}
```

---

## 📊 API 엔드포인트 설계

### 1. 시스템 관리자 API
```
GET /api/admin/system/overview
GET /api/admin/system/stats?period=daily|weekly|monthly
GET /api/admin/system/logs?level=error&category=payment
GET /api/admin/organizations?status=active&page=1&limit=20
GET /api/admin/organizations/:id/details
POST /api/admin/organizations/:id/suspend
POST /api/admin/organizations/:id/credits/adjust
```

### 2. 기업 관리자 API
```
GET /api/org/:id/dashboard
GET /api/org/:id/members?department=engineering&active=true
POST /api/org/:id/members/invite
POST /api/org/:id/members/bulk-invite
GET /api/org/:id/datacenter/overview
GET /api/org/:id/datacenter/insights
GET /api/org/:id/credits/dashboard
POST /api/org/:id/credits/purchase
GET /api/org/:id/devices
POST /api/org/:id/devices/:deviceId/assign
```

### 3. 실시간 데이터 API (WebSocket)
```
ws://api/admin/system/realtime
ws://api/org/:id/realtime
ws://api/org/:id/alerts
```

---

## 🔧 구현 우선순위

### Phase 1: 기본 대시보드 (1주)
1. SystemAdminService 기본 구현
2. OrganizationDashboardService 기본 구현
3. 기본 UI 컴포넌트 구현

### Phase 2: 핵심 기능 (1주)
1. 시스템 관리자 기능 완성
2. 기업 관리자 Data Center 구현
3. 크레딧 관리 기능 구현

### Phase 3: 고급 기능 (추가 1주)
1. 멤버 관리 시스템
2. 링크밴드 관리 시스템
3. 인사이트 및 분석 기능

---

## 🛡 보안 고려사항

### 1. 데이터 접근 제어
- 시스템 관리자: 모든 데이터 접근 가능
- 기업 관리자: 본인 조직 데이터만 접근 가능
- 조직 멤버: 본인 데이터만 접근 가능

### 2. Firebase Security Rules
```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 시스템 관리자만 시스템 데이터 접근
    match /systemStats/{document} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.userType == 'SYSTEM_ADMIN';
    }
    
    // 조직 관리자는 본인 조직 데이터만 접근
    match /organizations/{orgId} {
      allow read, write: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.userType == 'SYSTEM_ADMIN' ||
         (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.organizationId == orgId &&
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.userType == 'ORGANIZATION_ADMIN'));
    }
  }
}
```

### 3. API 인증 및 권한
- Firebase Authentication + JWT 토큰
- 역할 기반 접근 제어 (RBAC)
- 요청 로깅 및 모니터링

---

이 구현 계획으로 시작하시겠습니까? 먼저 어떤 부분부터 구현해보실지 말씀해주세요! 