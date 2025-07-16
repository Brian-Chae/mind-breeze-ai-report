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

## 🤖 **AI Report 시스템 컬렉션 구조**

### **7. 측정 데이터 관리**

#### A. `measurementData` 컬렉션
```typescript
interface MeasurementData {
  // 문서 ID: 자동 생성
  
  // 연관 정보
  sessionId: string; // measurementSessions 컬렉션 참조
  organizationId?: string;
  userId: string; // 측정 대상자
  
  // 측정 기본 정보
  measurementDate: Timestamp;
  duration: number; // 초 단위 (기본 60초)
  deviceInfo: {
    serialNumber: string;
    model: string; // 'LINK_BAND_V4', 'LINK_BAND_WELLNESS'
    firmwareVersion: string;
    batteryLevel?: number;
  };
  
  // EEG 분석 메트릭
  eegMetrics: {
    // 주파수 밴드 파워
    delta: number; // 0.5-4 Hz
    theta: number; // 4-8 Hz  
    alpha: number; // 8-13 Hz
    beta: number; // 13-30 Hz
    gamma: number; // 30-100 Hz
    
    // 파생 지표들
    attentionIndex: number; // 0-100
    meditationIndex: number; // 0-100
    stressIndex: number; // 0-100
    fatigueIndex: number; // 0-100
    
    // 신호 품질
    signalQuality: number; // 0-1
    artifactRatio: number; // 0-1
    
    // 원시 데이터 경로 (Firebase Storage)
    rawDataPath?: string;
    processedDataPath?: string;
  };
  
  // PPG 분석 메트릭
  ppgMetrics: {
    // 심박 관련
    heartRate: number; // BPM
    heartRateVariability: number; // RMSSD
    rrIntervals: number[]; // ms 단위
    
    // 혈압 추정
    systolicBP?: number;
    diastolicBP?: number;
    
    // 스트레스 지표
    stressScore: number; // 0-100
    autonomicBalance: number; // LF/HF ratio
    
    // 신호 품질
    signalQuality: number; // 0-1
    motionArtifact: number; // 0-1
    
    // 원시 데이터 경로
    rawDataPath?: string;
    processedDataPath?: string;
  };
  
  // ACC 움직임 메트릭
  accMetrics: {
    // 활동 수준
    activityLevel: number; // 0-100
    movementIntensity: number; // 0-1
    
    // 자세 정보
    posture: 'SITTING' | 'STANDING' | 'LYING' | 'MOVING' | 'UNKNOWN';
    postureStability: number; // 0-1
    
    // 움직임 패턴
    stepCount?: number;
    movementEvents: {
      timestamp: number; // measurement 시작 기준 ms
      intensity: number; // 0-1
      duration: number; // ms
    }[];
    
    // 원시 데이터 경로
    rawDataPath?: string;
  };
  
  // 데이터 품질 종합 평가
  dataQuality: {
    overallScore: number; // 0-100
    eegQuality: number; // 0-100
    ppgQuality: number; // 0-100
    motionInterference: number; // 0-100
    usableForAnalysis: boolean;
    qualityIssues: string[]; // 품질 문제 목록
  };
  
  // 환경 정보
  environmentInfo?: {
    ambientNoise?: number; // dB
    temperature?: number; // Celsius
    humidity?: number; // %
    lightLevel?: number; // lux
  };
  
  // 메타데이터
  processingVersion: string; // 분석 알고리즘 버전
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### **8. AI 엔진 시스템**

#### A. `aiEngines` 컬렉션
```typescript
interface AIEngine {
  // 문서 ID: 엔진 고유 식별자 (예: 'basic_gemini_v1')
  
  // 기본 정보
  engineId: string; // 'basic_gemini_v1', 'detail_gemini_v1', 'focus_claude_v1'
  name: string; // '기본 건강 리포트', '정밀 건강 분석', '집중력 전문 분석'
  description: string;
  version: string; // 'v1.0.0'
  
  // AI 모델 설정
  aiProvider: 'GEMINI' | 'CLAUDE' | 'OPENAI' | 'CUSTOM';
  modelName: string; // 'gemini-1.5-pro', 'claude-3-sonnet'
  
  // 프롬프트 설정
  promptTemplate: {
    systemPrompt: string;
    userPromptTemplate: string; // 변수 포함 템플릿
    requiredVariables: string[]; // ['eegMetrics', 'ppgMetrics', 'accMetrics']
  };
  
  // 출력 설정
  outputFormat: {
    type: 'JSON' | 'MARKDOWN' | 'HTML';
    schema: any; // JSON 스키마
    validationRules: string[];
  };
  
  // 비용 설정
  creditCost: number; // 엔진 사용 시 차감되는 크레딧
  
  // 성능 정보
  averageProcessingTime: number; // ms
  successRate: number; // 0-1
  
  // 사용 제한
  restrictions: {
    minDataQuality: number; // 최소 데이터 품질 요구사항
    requiredMetrics: string[]; // 필수 메트릭 목록
    maxRetries: number;
    timeoutMs: number;
  };
  
  // 접근 권한
  accessControl: {
    isPublic: boolean;
    allowedOrganizations: string[]; // 특정 조직만 사용 가능
    userTypes: string[]; // 사용 가능한 사용자 유형
    subscriptionRequired?: string; // 필요한 구독 등급
  };
  
  // 상태
  status: 'ACTIVE' | 'DEPRECATED' | 'MAINTENANCE' | 'BETA';
  
  // 메타데이터
  createdBy: string; // 개발자/조직
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastUsedAt?: Timestamp;
  usageCount: number;
}
```

#### B. `reportRenderers` 컬렉션
```typescript
interface ReportRenderer {
  // 문서 ID: 렌더러 고유 식별자 (예: 'detail_gemini_v1_web')
  
  // 기본 정보
  rendererId: string; // 'basic_web_v1', 'detail_pdf_v1', 'company_samsung_web_v1'
  name: string; // '웹 기본 렌더러', 'PDF 상세 렌더러', '삼성전자 전용 웹 렌더러'
  description: string;
  version: string;
  
  // 입력/출력 설정
  inputFormat: {
    supportedEngines: string[]; // 지원하는 AI 엔진 목록
    requiredJsonSchema: any; // 필요한 입력 JSON 스키마
  };
  
  outputFormat: {
    type: 'WEB_COMPONENT' | 'PDF' | 'DOCX' | 'EMAIL' | 'MOBILE_APP';
    mimeType: string; // 'text/html', 'application/pdf'
    downloadable: boolean;
  };
  
  // 렌더링 설정
  renderingConfig: {
    templateEngine: 'REACT' | 'HANDLEBARS' | 'MUSTACHE' | 'CUSTOM';
    stylesheetPath?: string; // CSS/SCSS 파일 경로
    assetsPath?: string; // 이미지, 폰트 등 에셋 경로
    customBranding?: {
      logoPath: string;
      colors: {
        primary: string;
        secondary: string;
        accent: string;
      };
      fonts: string[];
    };
  };
  
  // 비용 설정
  creditCost: number; // 렌더러 사용 시 추가 차감 크레딧
  
  // 접근 권한
  accessControl: {
    isPublic: boolean;
    allowedOrganizations: string[]; // B2B 전용 렌더러
    customizationLevel: 'NONE' | 'BASIC' | 'ADVANCED' | 'FULL';
  };
  
  // 성능 정보
  averageRenderTime: number; // ms
  maxFileSize: number; // bytes (PDF 등의 경우)
  
  // 상태
  status: 'ACTIVE' | 'DEPRECATED' | 'MAINTENANCE' | 'BETA';
  
  // 메타데이터
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  usageCount: number;
}
```

---

### **9. 리포트 인스턴스 관리**

#### A. `reportInstances` 컬렉션
```typescript
interface ReportInstance {
  // 문서 ID: 자동 생성
  
  // 연관 정보
  measurementDataId: string; // measurementData 컬렉션 참조
  sessionId: string; // measurementSessions 컬렉션 참조
  userId: string; // 리포트 대상자
  organizationId?: string;
  
  // 생성 설정
  engineId: string; // 사용된 AI 엔진
  rendererId: string; // 사용된 렌더러
  
  // 리포트 내용
  aiAnalysisResult: {
    // AI 엔진 원본 출력
    rawOutput: any; // JSON 형태
    
    // 파싱된 분석 결과
    parsedResult: {
      overallScore: number; // 0-100
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      
      // 상세 분석 (엔진별로 다름)
      stressAnalysis?: any;
      focusAnalysis?: any;
      healthRiskAnalysis?: any;
      
      // 추천사항
      recommendations: string[];
      warnings: string[];
      
      // 메타데이터
      confidence: number; // 0-1
      analysisVersion: string;
    };
  };
  
  // 렌더링 결과
  renderedOutput: {
    // 렌더러 출력
    content: string; // HTML, Base64 PDF 등
    contentType: string; // MIME type
    
    // 다운로드 정보
    downloadUrl?: string; // Firebase Storage URL
    fileName?: string;
    fileSize?: number; // bytes
    
    // 렌더링 메타데이터
    renderingTime: number; // ms
    renderingVersion: string;
  };
  
  // 비용 정보
  costBreakdown: {
    engineCost: number; // 엔진 사용 크레딧
    rendererCost: number; // 렌더러 사용 크레딧
    totalCost: number; // 총 차감 크레딧
    
    // 결제 정보
    paidBy: string; // 결제한 사용자/조직 ID
    paymentMethod: 'ORGANIZATION_CREDIT' | 'INDIVIDUAL_CREDIT' | 'FREE_TIER';
  };
  
  // 생성 과정 추적
  processingStatus: {
    stage: 'QUEUED' | 'AI_PROCESSING' | 'RENDERING' | 'COMPLETED' | 'FAILED';
    progress: number; // 0-100
    
    // 단계별 타이밍
    queuedAt: Timestamp;
    aiProcessingStartedAt?: Timestamp;
    aiProcessingCompletedAt?: Timestamp;
    renderingStartedAt?: Timestamp;
    renderingCompletedAt?: Timestamp;
    
    // 오류 정보
    errorMessage?: string;
    errorCode?: string;
    retryCount: number;
  };
  
  // 공유 및 접근 제어
  accessControl: {
    isPublic: boolean;
    sharedWith: string[]; // 공유된 사용자 ID 목록
    accessCode?: string; // 링크 공유용 코드
    expiresAt?: Timestamp;
  };
  
  // 사용 통계
  viewCount: number;
  downloadCount: number;
  lastViewedAt?: Timestamp;
  
  // 메타데이터
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### **10. 크레딧 정책 관리**

#### A. `creditPolicies` 컬렉션
```typescript
interface CreditPolicy {
  // 문서 ID: 자동 생성
  
  // 적용 범위
  policyType: 'ENGINE' | 'RENDERER' | 'COMBO' | 'ORGANIZATION_OVERRIDE';
  
  // 대상 지정
  targetEngineId?: string; // 특정 엔진에 대한 정책
  targetRendererId?: string; // 특정 렌더러에 대한 정책
  targetOrganizationId?: string; // 조직별 할인 정책
  
  // 비용 설정
  baseCost: number; // 기본 크레딧 비용
  
  // 할인 정책
  discounts: {
    type: 'VOLUME' | 'SUBSCRIPTION' | 'PROMOTION' | 'LOYALTY';
    condition: any; // 할인 조건 (JSON)
    discountRate: number; // 0-1 (0.2 = 20% 할인)
    maxDiscount?: number; // 최대 할인 크레딧
  }[];
  
  // 번들 정책
  bundleRules?: {
    engineId: string;
    rendererId: string;
    bundleCost: number; // 개별 비용 합보다 저렴
    description: string;
  }[];
  
  // 무료 사용 정책
  freeTierRules?: {
    userType: string[]; // 무료 사용 가능한 사용자 유형
    dailyLimit: number; // 일일 무료 사용 한도
    monthlyLimit: number; // 월간 무료 사용 한도
    qualityThreshold?: number; // 무료 사용 시 품질 제한
  };
  
  // 유효 기간
  validFrom: Timestamp;
  validUntil?: Timestamp;
  
  // 상태
  isActive: boolean;
  priority: number; // 정책 우선순위 (숫자가 낮을수록 높은 우선순위)
  
  // 메타데이터
  createdBy: string;
  description: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### **11. 조직별 AI 시스템 설정**

#### A. `organizationAIConfigs` 컬렉션
```typescript
interface OrganizationAIConfig {
  // 문서 ID: organizationId
  
  organizationId: string;
  
  // 사용 가능한 AI 엔진
  enabledEngines: {
    engineId: string;
    isEnabled: boolean;
    customSettings?: {
      promptOverrides?: any; // 프롬프트 커스터마이징
      outputCustomization?: any; // 출력 형식 조정
      costOverride?: number; // 조직별 특별 가격
    };
  }[];
  
  // 사용 가능한 렌더러
  enabledRenderers: {
    rendererId: string;
    isEnabled: boolean;
    customBranding?: {
      logoUrl: string;
      companyName: string;
      colors: any;
      fonts: string[];
    };
    costOverride?: number;
  }[];
  
  // 기본 설정
  defaultEngine: string; // 기본 선택될 엔진
  defaultRenderer: string; // 기본 선택될 렌더러
  
  // 사용 제한
  limits: {
    dailyReportLimit: number;
    monthlyReportLimit: number;
    concurrentProcessingLimit: number; // 동시 처리 가능한 리포트 수
    
    // 엔진별 제한
    engineLimits: {
      [engineId: string]: {
        dailyLimit: number;
        monthlyLimit: number;
      };
    };
  };
  
  // 자동화 설정
  automation: {
    autoGenerateBasicReport: boolean; // 측정 완료 시 자동 기본 리포트 생성
    autoNotifyCompletion: boolean; // 리포트 완성 시 자동 알림
    autoArchiveOldReports: boolean; // 오래된 리포트 자동 아카이브
    
    // 스케줄링
    scheduledReports?: {
      frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
      engineId: string;
      rendererId: string;
      recipientEmails: string[];
    }[];
  };
  
  // 메타데이터
  createdAt: Timestamp;
  updatedAt: Timestamp;
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