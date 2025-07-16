# Firestore 기반 DB 구조 및 구현 계획

## 📊 DB 구조 결정사항

### **최종 결정: Firestore 완전 통일 구조** ✅

**결정 근거:**
- 현재 모든 서비스가 100% Firestore 기반으로 구현됨
- GraphQL Data Connect는 설계되었으나 실제 사용되지 않음
- 실시간 업데이트와 간단한 개발 프로세스를 위해 Firestore 통일
- MVP 개발 속도 최적화

---

## 🗃️ Firestore 컬렉션 구조

### **1. 사용자 관리 컬렉션**

#### A. `users` 컬렉션
```typescript
interface User {
  // 문서 ID: Firebase Auth UID
  
  // 기본 정보
  email: string;
  displayName: string;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  updatedAt: Timestamp;
  
  // 사용자 유형별 필드
  userType: 'SYSTEM_ADMIN' | 'ORGANIZATION_ADMIN' | 'ORGANIZATION_MEMBER' | 'INDIVIDUAL_USER' | 'MEASUREMENT_SUBJECT';
  
  // 조직 관련 (B2B 사용자만)
  organizationId?: string;
  organizationCode?: string; // 6자리 코드 (MB2401, MB2402...)
  employeeId?: string;
  department?: string;
  position?: string;
  
  // 개인 사용자 전용
  personalCreditBalance?: number;
  
  // 연락처 정보
  phone?: string;
  address?: string;
  profileImage?: string;
  
  // 상태
  isActive: boolean;
  
  // 권한 (JSON 배열)
  permissions?: string[]; // ['users.read', 'reports.create', ...]
  
  // 측정 대상자 전용 필드
  accessToken?: string;
  tokenExpiresAt?: Timestamp;
}
```

#### B. `organizations` 컬렉션
```typescript
interface Organization {
  // 문서 ID: 자동 생성
  
  // 기본 정보
  organizationName: string;
  organizationCode: string; // 6자리 고유 코드
  businessRegistrationNumber: string;
  industry: string;
  
  // 연락처
  contactEmail: string;
  contactPhone: string;
  address: string;
  
  // 관리자
  adminUserId: string; // users 컬렉션 참조
  
  // 크레딧 관리
  creditBalance: number;
  
  // 계약 정보
  servicePackage: 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  contractStartDate?: Timestamp;
  contractEndDate?: Timestamp;
  
  // 상태
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'TERMINATED';
  
  // 통계
  memberCount: number;
  totalReports: number;
  totalSessions: number;
  
  // 설정 (JSON)
  settings: {
    autoInviteEnabled: boolean;
    reportAutoGeneration: boolean;
    maxMembersAllowed: number;
    [key: string]: any;
  };
  
  // 메타데이터
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### C. `organizationMembers` 컬렉션
```typescript
interface OrganizationMember {
  // 문서 ID: 자동 생성
  
  userId: string; // users 컬렉션 참조
  organizationId: string; // organizations 컬렉션 참조
  
  // 멤버 정보
  employeeId: string;
  department: string;
  position: string;
  
  // 권한
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
  permissions: string[];
  
  // 상태
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'LEFT';
  joinedAt: Timestamp;
  
  // 사용 통계
  reportsGenerated: number;
  consultationsUsed: number;
  lastActivityAt: Timestamp;
  
  // 메타데이터
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### **2. 측정 및 리포트 관리**

#### A. `measurementSessions` 컬렉션
```typescript
interface MeasurementSession {
  // 문서 ID: 자동 생성
  
  // 측정 대상자 정보
  subjectName: string;
  subjectEmail?: string;
  subjectPhone?: string;
  subjectBirthDate?: Timestamp;
  subjectGender?: 'MALE' | 'FEMALE' | 'OTHER';
  
  // 측정 실행자 정보
  organizationId: string; // organizations 컬렉션 참조
  measuredByUserId: string; // users 컬렉션 참조
  measuredByUserName: string;
  
  // 세션 정보
  sessionDate: Timestamp;
  duration: number; // 초 단위
  
  // 데이터 저장 경로
  rawDataPath?: string; // Storage 경로
  processedDataPath?: string; // Storage 경로
  
  // 분석 결과
  overallScore?: number; // 0-100
  stressLevel?: number; // 0-1
  focusLevel?: number; // 0-1
  relaxationLevel?: number; // 0-1
  
  // 리포트 정보
  reportGenerated: boolean;
  reportId?: string; // healthReports 컬렉션 참조
  
  // 상태
  status: 'MEASURING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  
  // 메타데이터
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### B. `healthReports` 컬렉션
```typescript
interface HealthReport {
  // 문서 ID: 자동 생성
  
  // 연관 정보
  sessionId: string; // measurementSessions 컬렉션 참조
  userId: string; // 리포트 대상자 (측정 대상자)
  organizationId?: string; // B2B인 경우
  
  // 리포트 정보
  reportType: 'STRESS_ANALYSIS' | 'FOCUS_ANALYSIS' | 'COMPREHENSIVE' | 'CUSTOM';
  title: string;
  summary: string;
  
  // AI 분석 결과 (JSON)
  analysisResult: {
    overallScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    
    // 상세 지표들
    stressAnalysis: any;
    focusAnalysis: any;
    sleepQualityAnalysis: any;
    cognitiveLoadAnalysis: any;
    
    // 추천사항
    recommendations: string[];
    warnings: string[];
  };
  
  // 생성 정보
  generatedBy: 'AI_AUTO' | 'MANUAL_REQUEST';
  generatedAt: Timestamp;
  
  // 상태
  status: 'GENERATING' | 'COMPLETED' | 'FAILED';
  isShared: boolean;
  sharedWith: string[]; // 공유된 사용자 ID 목록
  
  // 메타데이터
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### **3. 크레딧 및 결제 관리**

#### A. `creditTransactions` 컬렉션
```typescript
interface CreditTransaction {
  // 문서 ID: 자동 생성
  
  // 거래 주체
  organizationId?: string; // B2B 거래인 경우
  userId?: string; // 개인 사용자 거래인 경우
  
  // 거래 정보
  type: 'PURCHASE' | 'TRIAL_GRANT' | 'BONUS_GRANT' | 'REPORT_USAGE' | 'CONSULTATION_USAGE' | 'REFUND' | 'EXPIRY';
  amount: number; // 양수: 적립, 음수: 사용
  balanceAfter: number; // 거래 후 잔액
  
  // 결제 정보 (구매인 경우)
  paymentMethod?: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'DIGITAL_WALLET';
  paymentId?: string; // 외부 결제 시스템 ID
  
  // 사용 정보 (사용인 경우)
  relatedResourceId?: string; // 리포트 ID, 상담 ID 등
  relatedResourceType?: 'REPORT' | 'CONSULTATION';
  
  // 설명
  description: string;
  
  // 메타데이터
  metadata?: {
    [key: string]: any;
  };
  
  createdAt: Timestamp;
}
```

#### B. `trialServices` 컬렉션
```typescript
interface TrialService {
  // 문서 ID: 자동 생성
  
  organizationId: string;
  
  // 체험 정보
  trialType: 'FREE_TRIAL' | 'PAID_TRIAL';
  startDate: Timestamp;
  endDate: Timestamp;
  
  // 제공 혜택
  creditsGranted: number;
  maxMembers: number;
  maxReports: number;
  
  // 사용 현황
  creditsUsed: number;
  reportsGenerated: number;
  membersAdded: number;
  
  // 상태
  status: 'ACTIVE' | 'EXPIRED' | 'CONVERTED' | 'CANCELLED';
  
  // 전환 정보
  convertedToPaidAt?: Timestamp;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### **4. 디바이스 관리**

#### A. `devices` 컬렉션
```typescript
interface Device {
  // 문서 ID: 디바이스 시리얼 넘버
  
  // 디바이스 정보
  serialNumber: string;
  model: string; // 'LINK_BAND_V4', 'LINK_BAND_WELLNESS'
  firmwareVersion: string;
  
  // 할당 정보
  organizationId?: string; // B2B 할당인 경우
  assignedToUserId?: string; // 현재 사용자
  assignedAt?: Timestamp;
  
  // 렌탈 정보 (B2B)
  rentalType?: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'PURCHASED';
  rentalStartDate?: Timestamp;
  rentalEndDate?: Timestamp;
  rentalCost?: number;
  
  // 상태
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'LOST' | 'RETURNED';
  batteryLevel?: number;
  lastSyncAt?: Timestamp;
  
  // 사용 통계
  totalUsageHours: number;
  lastUsedAt?: Timestamp;
  connectionHistory: {
    startTime: Timestamp;
    duration: number; // 초
  }[];
  
  // 메타데이터
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### **5. 초대 및 알림 관리**

#### A. `invitations` 컬렉션
```typescript
interface Invitation {
  // 문서 ID: 자동 생성
  
  organizationId: string;
  invitedByUserId: string;
  
  // 초대 정보
  email: string;
  displayName: string;
  employeeId: string;
  department: string;
  position: string;
  
  // 초대 상태
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  invitationCode: string; // 고유 초대 코드
  
  // 만료 정보
  expiresAt: Timestamp;
  acceptedAt?: Timestamp;
  
  // 메타데이터
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### B. `notifications` 컬렉션
```typescript
interface Notification {
  // 문서 ID: 자동 생성
  
  // 수신자
  userId: string;
  organizationId?: string; // 조직 알림인 경우
  
  // 알림 내용
  type: 'CREDIT_LOW' | 'DEVICE_ISSUE' | 'MEMBER_RISK' | 'REPORT_READY' | 'INVITATION' | 'SYSTEM';
  title: string;
  message: string;
  
  // 우선순위
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  
  // 상태
  isRead: boolean;
  readAt?: Timestamp;
  
  // 액션 정보
  actionRequired?: boolean;
  actionUrl?: string;
  actionType?: 'NAVIGATE' | 'DOWNLOAD' | 'APPROVE' | 'DISMISS';
  
  // 관련 리소스
  relatedResourceId?: string;
  relatedResourceType?: 'REPORT' | 'DEVICE' | 'MEMBER' | 'CREDIT';
  
  // 메타데이터
  metadata?: {
    [key: string]: any;
  };
  
  createdAt: Timestamp;
  expiresAt?: Timestamp;
}
```

---

### **6. AI 상담 관리**

#### A. `chatHistory` 컬렉션
```typescript
interface ChatMessage {
  // 문서 ID: 자동 생성
  
  userId: string;
  sessionId: string; // 대화 세션 ID
  
  // 메시지 내용
  message: string;
  sender: 'USER' | 'AI';
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'REPORT_REFERENCE';
  
  // AI 응답 메타데이터
  aiModel?: string;
  aiResponseTime?: number; // ms
  confidence?: number; // 0-1
  
  // 관련 리소스
  relatedReportId?: string;
  relatedSessionId?: string;
  
  // 상태
  isImportant: boolean;
  tags: string[];
  
  timestamp: Timestamp;
}
```

---

## 🔧 Firestore 보안 규칙

### **보안 규칙 구조**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 사용자 컬렉션 - 본인 및 권한자만 접근
    match /users/{userId} {
      allow read, write: if 
        request.auth != null && 
        (request.auth.uid == userId || 
         hasRole(['SYSTEM_ADMIN']) ||
         (hasRole(['ORGANIZATION_ADMIN']) && 
          isSameOrganization(userId)));
    }
    
    // 조직 컬렉션 - 조직 관리자 및 시스템 관리자만 접근
    match /organizations/{orgId} {
      allow read: if 
        request.auth != null && 
        (hasRole(['SYSTEM_ADMIN']) ||
         getUserOrganizationId() == orgId);
      
      allow write: if 
        request.auth != null && 
        (hasRole(['SYSTEM_ADMIN']) ||
         (hasRole(['ORGANIZATION_ADMIN']) && 
          getUserOrganizationId() == orgId));
    }
    
    // 측정 세션 - 조직 멤버만 접근
    match /measurementSessions/{sessionId} {
      allow read, write: if 
        request.auth != null && 
        (hasRole(['SYSTEM_ADMIN']) ||
         isOrganizationMember(resource.data.organizationId) ||
         resource.data.measuredByUserId == request.auth.uid);
    }
    
    // 건강 리포트 - 본인 또는 권한자만 접근
    match /healthReports/{reportId} {
      allow read: if 
        request.auth != null && 
        (hasRole(['SYSTEM_ADMIN']) ||
         resource.data.userId == request.auth.uid ||
         isOrganizationMember(resource.data.organizationId));
      
      allow write: if 
        request.auth != null && 
        (hasRole(['SYSTEM_ADMIN']) ||
         isOrganizationMember(resource.data.organizationId));
    }
    
    // 크레딧 거래 - 읽기 전용 (시스템에서만 생성)
    match /creditTransactions/{transactionId} {
      allow read: if 
        request.auth != null && 
        (hasRole(['SYSTEM_ADMIN']) ||
         resource.data.userId == request.auth.uid ||
         isOrganizationMember(resource.data.organizationId));
      
      // 쓰기는 서버 함수에서만
      allow write: if false;
    }
    
    // 헬퍼 함수들
    function hasRole(roles) {
      return request.auth != null && 
             getUserData().userType in roles;
    }
    
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    function getUserOrganizationId() {
      return getUserData().organizationId;
    }
    
    function isSameOrganization(targetUserId) {
      let targetUser = get(/databases/$(database)/documents/users/$(targetUserId)).data;
      return getUserOrganizationId() == targetUser.organizationId;
    }
    
    function isOrganizationMember(orgId) {
      return getUserOrganizationId() == orgId &&
             getUserData().userType in ['ORGANIZATION_ADMIN', 'ORGANIZATION_MEMBER'];
    }
  }
}
```

---

## 🚀 서비스 계층 최적화

### **1. Core Services (공통 기반)**

#### A. `FirebaseService` (확장)
```typescript
// src/core/services/FirebaseService.ts
export class FirebaseService {
  // 기존 기능 + 추가 유틸리티
  
  // 트랜잭션 헬퍼
  static async runTransaction<T>(
    updateFunction: (transaction: Transaction) => Promise<T>
  ): Promise<T> {
    return await runTransaction(db, updateFunction);
  }
  
  // 배치 작업 헬퍼
  static createBatch(): WriteBatch {
    return writeBatch(db);
  }
  
  // 실시간 구독 관리
  static subscribeToDocument(
    path: string, 
    callback: (data: any) => void
  ): () => void {
    const unsubscribe = onSnapshot(doc(db, path), (doc) => {
      callback(doc.exists() ? { id: doc.id, ...doc.data() } : null);
    });
    return unsubscribe;
  }
  
  // 쿼리 빌더
  static buildQuery(
    collectionPath: string,
    constraints: QueryConstraint[]
  ): Query {
    return query(collection(db, collectionPath), ...constraints);
  }
}
```

#### B. `BaseService` (최적화)
```typescript
// src/core/services/BaseService.ts
export abstract class BaseService {
  protected db: Firestore;
  protected auth: Auth;
  protected cache: Cache;
  
  // Firestore 전용 헬퍼 메서드들
  protected async getDocument<T>(
    collectionPath: string, 
    docId: string
  ): Promise<T | null> {
    const cacheKey = `${collectionPath}:${docId}`;
    
    // 캐시 확인
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;
    
    // Firestore 조회
    const docSnap = await getDoc(doc(this.db, collectionPath, docId));
    const result = docSnap.exists() ? 
      { id: docSnap.id, ...docSnap.data() } as T : null;
    
    // 캐시 저장
    if (result) {
      this.cache.set(cacheKey, result, 5 * 60 * 1000); // 5분
    }
    
    return result;
  }
  
  protected async queryDocuments<T>(
    collectionPath: string,
    constraints: QueryConstraint[]
  ): Promise<T[]> {
    const q = query(collection(this.db, collectionPath), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as T[];
  }
  
  protected async createDocument<T>(
    collectionPath: string,
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const docData = {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(this.db, collectionPath), docData);
    return docRef.id;
  }
  
  protected async updateDocument(
    collectionPath: string,
    docId: string,
    data: Partial<any>
  ): Promise<void> {
    await updateDoc(doc(this.db, collectionPath, docId), {
      ...data,
      updatedAt: Timestamp.now()
    });
    
    // 캐시 무효화
    this.cache.delete(`${collectionPath}:${docId}`);
  }
}
```

---

## 📈 성능 최적화 전략

### **1. 인덱스 최적화**

#### A. 복합 인덱스 설정
```javascript
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "measurementSessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "organizationId", "order": "ASCENDING" },
        { "fieldPath": "sessionDate", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "healthReports", 
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "creditTransactions",
      "queryScope": "COLLECTION", 
      "fields": [
        { "fieldPath": "organizationId", "order": "ASCENDING" },
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "organizationMembers",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "organizationId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "joinedAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### **2. 캐싱 전략**

#### A. 다계층 캐싱
```typescript
// 메모리 캐시 (실시간 데이터)
const realtimeCache = new Map();

// IndexedDB 캐시 (오프라인 지원)
const persistentCache = new Cache('firestore-cache');

// 캐싱 전략별 TTL
const CACHE_TTL = {
  USER_DATA: 10 * 60 * 1000,      // 10분
  ORGANIZATION_DATA: 30 * 60 * 1000, // 30분
  STATIC_DATA: 60 * 60 * 1000,    // 1시간
  REALTIME_DATA: 30 * 1000        // 30초
};
```

### **3. 배치 처리**

#### A. 일괄 작업 최적화
```typescript
// 벌크 멤버 초대
export async function bulkInviteMembers(
  organizationId: string,
  members: InviteMemberData[]
): Promise<BulkInviteResult> {
  const batch = writeBatch(db);
  const results: BulkInviteResult = {
    success: [],
    failed: []
  };
  
  // 최대 500개씩 배치 처리 (Firestore 제한)
  const chunks = chunkArray(members, 500);
  
  for (const chunk of chunks) {
    for (const member of chunk) {
      try {
        const inviteRef = doc(collection(db, 'invitations'));
        batch.set(inviteRef, {
          ...member,
          organizationId,
          status: 'PENDING',
          createdAt: Timestamp.now()
        });
        
        results.success.push(member.email);
      } catch (error) {
        results.failed.push({
          email: member.email,
          error: error.message
        });
      }
    }
    
    await batch.commit();
  }
  
  return results;
}
```

---

## 🛠️ 구현 우선순위

### **Phase 1: 핵심 데이터 구조 (1주)**
1. ✅ 기존 Firestore 서비스 최적화
2. ✅ 보안 규칙 적용
3. ✅ 인덱스 최적화
4. ✅ 캐싱 전략 구현

### **Phase 2: 관리 기능 구현 (1주)**
1. 시스템 관리자 대시보드
2. 조직 관리자 기능
3. 멤버 관리 시스템
4. 디바이스 관리

### **Phase 3: 고급 기능 (1주)**
1. 실시간 알림 시스템
2. 고급 분석 및 리포트
3. 일괄 작업 기능
4. 데이터 내보내기

---

## 🔄 마이그레이션 및 백업 전략

### **데이터 백업**
```typescript
// 정기 백업 자동화
export class FirestoreBackupService {
  static async createBackup() {
    const collections = [
      'users', 'organizations', 'measurementSessions', 
      'healthReports', 'creditTransactions'
    ];
    
    for (const collectionName of collections) {
      await this.backupCollection(collectionName);
    }
  }
  
  static async backupCollection(collectionName: string) {
    // Firebase Admin SDK를 통한 백업 구현
    // Google Cloud Storage에 JSON 형태로 저장
  }
}
```

### **데이터 마이그레이션**
```typescript
// 향후 스키마 변경 시 마이그레이션
export class MigrationService {
  static async migrateToV2() {
    // 기존 데이터 구조에서 새로운 구조로 변환
    // 안전한 롤백 지원
  }
}
```

---

이제 **Firestore 완전 통일 구조**로 모든 DB 작업을 진행할 수 있습니다! 🚀 