# AI Engine & Viewer Management DB Architecture

## 개요
기업별로 AI 분석 엔진과 뷰어를 차별화하여 제공하는 B2B SaaS 구조를 위한 Firestore DB 설계

## 핵심 요구사항
1. **AI 엔진별 뷰어 매칭**: 각 AI 엔진이 지원하는 뷰어들 관리
2. **기업별 권한 관리**: 기업마다 사용 가능한 엔진/뷰어 제한
3. **과금 체계**: 엔진/뷰어별 차별화된 과금 구조
4. **관리자 권한**: 시스템 관리자의 기업별 권한 설정
5. **실시간 업데이트**: 권한 변경 시 즉시 반영

## DB Collections 구조

### 1. ai_engines (AI 엔진 마스터 데이터)
```javascript
{
  id: "basic-gemini-v1",
  name: "기본 Gemini 엔진",
  description: "Google Gemini API를 사용한 기본적인 건강 분석 엔진",
  version: "1.0.0",
  provider: "gemini",
  
  // 기술적 정보
  supportedDataTypes: {
    eeg: true,
    ppg: true,
    acc: true
  },
  capabilities: {
    supportedLanguages: ["ko", "en"],
    maxDataDuration: 300, // 초
    minDataQuality: 30, // %
    supportedOutputFormats: ["json", "text"],
    realTimeProcessing: false
  },
  
  // 비즈니스 정보
  pricing: {
    costPerAnalysis: 1, // 크레딧
    tier: "basic", // basic, premium, enterprise
    billingType: "per_analysis" // per_analysis, monthly, yearly
  },
  
  // 호환 뷰어 목록
  compatibleViewers: [
    "basic-gemini-web-v1",
    "basic-gemini-pdf-v1"
  ],
  
  // 상태 관리
  status: "active", // active, deprecated, maintenance
  isPublic: true, // 모든 기업에게 기본 제공 여부
  
  // 메타데이터
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: "system",
  
  // 특화 분야
  specializations: ["general_health", "stress_analysis"],
  targetAudience: ["individual", "enterprise"],
  
  // 제한사항
  limitations: {
    maxConcurrentAnalyses: 10,
    rateLimitPerMinute: 60
  }
}
```

### 2. report_viewers (리포트 뷰어 마스터 데이터)
```javascript
{
  id: "basic-gemini-web-v1",
  name: "기본 Gemini 웹 뷰어",
  description: "기본 Gemini 엔진용 웹 리포트 뷰어",
  version: "1.0.0",
  type: "web", // web, pdf, mobile, api
  
  // 호환성
  compatibleEngines: ["basic-gemini-v1"],
  supportedFormats: ["json", "html"],
  
  // 기능
  features: {
    interactive: true,
    exportable: true,
    shareable: true,
    customizable: false,
    realTimeUpdate: false
  },
  
  // 비즈니스 정보
  pricing: {
    costPerView: 0, // 기본 뷰어는 무료
    tier: "basic",
    billingType: "free"
  },
  
  // 상태
  status: "active",
  isPublic: true,
  
  // 메타데이터
  createdAt: timestamp,
  updatedAt: timestamp,
  
  // UI 설정
  uiConfig: {
    theme: "default",
    layout: "standard",
    customCss: null
  }
}
```

### 3. organization_ai_permissions (기업별 AI 권한)
```javascript
{
  id: "auto-generated-id",
  organizationId: "org-123",
  
  // 허용된 AI 엔진들
  allowedEngines: [
    {
      engineId: "basic-gemini-v1",
      enabled: true,
      customPricing: {
        costPerAnalysis: 1, // 기본값 또는 특별 할인가
        billingType: "per_analysis"
      },
      limitations: {
        maxAnalysesPerMonth: 1000,
        maxConcurrentAnalyses: 5
      },
      grantedAt: timestamp,
      grantedBy: "admin-user-id"
    },
    {
      engineId: "mental-gemini-v1",
      enabled: false, // 비활성화
      reason: "not_subscribed"
    }
  ],
  
  // 허용된 뷰어들
  allowedViewers: [
    {
      viewerId: "basic-gemini-web-v1",
      enabled: true,
      customizations: {
        brandingEnabled: true,
        logoUrl: "https://...",
        customTheme: "organization-theme"
      }
    }
  ],
  
  // 메타데이터
  createdAt: timestamp,
  updatedAt: timestamp,
  lastModifiedBy: "admin-user-id"
}
```

### 4. engine_viewer_compatibility (엔진-뷰어 호환성 매트릭스)
```javascript
{
  id: "basic-gemini-v1_basic-gemini-web-v1",
  engineId: "basic-gemini-v1",
  viewerId: "basic-gemini-web-v1",
  
  // 호환성 정보
  compatibility: {
    fullyCompatible: true,
    requiredEngineVersion: ">=1.0.0",
    requiredViewerVersion: ">=1.0.0",
    deprecationDate: null
  },
  
  // 매핑 설정
  mappingConfig: {
    dataFieldMappings: {
      "overallScore": "summary.health_score",
      "stressLevel": "metrics.stress.level"
    },
    renderingOptions: {
      chartTypes: ["line", "bar", "radar"],
      colorScheme: "default"
    }
  },
  
  // 성능 정보
  performance: {
    averageRenderTime: 2500, // ms
    supportedDataSize: "10MB"
  },
  
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 5. system_admin_logs (시스템 관리자 로그)
```javascript
{
  id: "auto-generated-id",
  adminUserId: "admin-123",
  action: "grant_engine_access", // grant_engine_access, revoke_engine_access, update_pricing
  
  targetOrganizationId: "org-456",
  resourceType: "ai_engine", // ai_engine, viewer, pricing
  resourceId: "mental-gemini-v1",
  
  changes: {
    before: { enabled: false },
    after: { enabled: true, limitations: {...} }
  },
  
  reason: "Premium subscription activated",
  timestamp: timestamp
}
```

### 6. usage_analytics (사용량 분석)
```javascript
{
  id: "usage-2024-01-org-123",
  organizationId: "org-123",
  period: "2024-01", // YYYY-MM
  
  engineUsage: {
    "basic-gemini-v1": {
      totalAnalyses: 450,
      totalCost: 450,
      averageProcessingTime: 15000, // ms
      successRate: 0.98
    }
  },
  
  viewerUsage: {
    "basic-gemini-web-v1": {
      totalViews: 890,
      totalExports: 120,
      averageViewTime: 180000 // ms
    }
  },
  
  createdAt: timestamp
}
```

## Service 클래스 구조

### 1. AIEnginePermissionService
```typescript
class AIEnginePermissionService {
  // 기업이 사용 가능한 엔진 목록 조회
  async getAvailableEngines(organizationId: string): Promise<AIEngine[]>
  
  // 기업이 사용 가능한 뷰어 목록 조회
  async getAvailableViewers(organizationId: string, engineId?: string): Promise<ReportViewer[]>
  
  // 엔진 사용 권한 확인
  async checkEnginePermission(organizationId: string, engineId: string): Promise<boolean>
  
  // 뷰어 사용 권한 확인
  async checkViewerPermission(organizationId: string, viewerId: string): Promise<boolean>
  
  // 호환 가능한 뷰어 조회
  async getCompatibleViewers(engineId: string): Promise<ReportViewer[]>
}
```

### 2. SystemAdminService
```typescript
class SystemAdminService {
  // 모든 엔진 목록 조회
  async getAllEngines(): Promise<AIEngine[]>
  
  // 모든 뷰어 목록 조회
  async getAllViewers(): Promise<ReportViewer[]>
  
  // 기업에게 엔진 권한 부여
  async grantEngineAccess(organizationId: string, engineId: string, config: PermissionConfig): Promise<void>
  
  // 기업 엔진 권한 해제
  async revokeEngineAccess(organizationId: string, engineId: string): Promise<void>
  
  // 기업별 사용량 조회
  async getUsageAnalytics(organizationId: string, period: string): Promise<UsageAnalytics>
}
```

## 구현 예제

### 1. 기업 관리자용 엔진/뷰어 선택 컴포넌트
```typescript
// hooks/useAvailableEngines.ts
export const useAvailableEngines = (organizationId: string) => {
  const [engines, setEngines] = useState<AIEngine[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadEngines = async () => {
      const available = await AIEnginePermissionService.getAvailableEngines(organizationId);
      setEngines(available);
      setLoading(false);
    };
    
    loadEngines();
  }, [organizationId]);
  
  return { engines, loading };
};

// components/EngineSelector.tsx
export const EngineSelector = ({ organizationId, onEngineSelect }) => {
  const { engines, loading } = useAvailableEngines(organizationId);
  
  return (
    <select onChange={(e) => onEngineSelect(e.target.value)}>
      {engines.map(engine => (
        <option key={engine.id} value={engine.id}>
          {engine.name} - {engine.pricing.costPerAnalysis} 크레딧
        </option>
      ))}
    </select>
  );
};
```

### 2. 시스템 관리자용 권한 관리 컴포넌트
```typescript
// components/SystemAdminPermissionManager.tsx
export const SystemAdminPermissionManager = ({ organizationId }) => {
  const [allEngines, setAllEngines] = useState<AIEngine[]>([]);
  const [currentPermissions, setCurrentPermissions] = useState<Permission[]>([]);
  
  const handleGrantAccess = async (engineId: string) => {
    await SystemAdminService.grantEngineAccess(organizationId, engineId, {
      limitations: { maxAnalysesPerMonth: 1000 }
    });
    // 권한 목록 새로고침
    loadCurrentPermissions();
  };
  
  return (
    <div>
      {allEngines.map(engine => (
        <EnginePermissionRow 
          key={engine.id}
          engine={engine}
          hasPermission={currentPermissions.some(p => p.engineId === engine.id)}
          onToggle={() => handleGrantAccess(engine.id)}
        />
      ))}
    </div>
  );
};
```

## 보안 고려사항

### 1. Firestore Security Rules
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // AI 엔진 데이터 - 읽기만 허용
    match /ai_engines/{engineId} {
      allow read: if request.auth != null;
      allow write: if hasSystemAdminRole();
    }
    
    // 기업별 권한 - 해당 기업 관리자만 읽기 가능
    match /organization_ai_permissions/{permissionId} {
      allow read: if belongsToOrganization(resource.data.organizationId);
      allow write: if hasSystemAdminRole();
    }
    
    // 시스템 관리자 로그 - 시스템 관리자만 접근
    match /system_admin_logs/{logId} {
      allow read, write: if hasSystemAdminRole();
    }
  }
}
```

### 2. 사용량 제한 및 모니터링
```typescript
class UsageLimitService {
  async checkUsageLimit(organizationId: string, engineId: string): Promise<boolean> {
    const permissions = await this.getOrganizationPermissions(organizationId);
    const enginePermission = permissions.allowedEngines.find(e => e.engineId === engineId);
    
    if (!enginePermission || !enginePermission.enabled) {
      return false;
    }
    
    const currentUsage = await this.getCurrentMonthUsage(organizationId, engineId);
    return currentUsage < enginePermission.limitations.maxAnalysesPerMonth;
  }
  
  async incrementUsage(organizationId: string, engineId: string): Promise<void> {
    // 사용량 증가 로직
  }
}
```

## 마이그레이션 계획

### Phase 1: 기본 구조 생성
1. 마스터 데이터 Collections 생성 (ai_engines, report_viewers)
2. 기존 엔진 데이터 마이그레이션
3. 기본 권한 Service 클래스 구현

### Phase 2: 권한 시스템 구현
1. organization_ai_permissions Collection 생성
2. 기업별 권한 관리 UI 구현
3. 권한 체크 로직 통합

### Phase 3: 시스템 관리자 기능
1. 시스템 관리자 UI 구현
2. 사용량 분석 및 로깅 시스템
3. 과금 연동

이 구조로 구현하면 완전한 B2B SaaS 형태의 AI 엔진/뷰어 관리 시스템을 만들 수 있습니다! 