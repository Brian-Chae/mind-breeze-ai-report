# Mind Breeze AI - 도메인 기반 아키텍처 재구성 계획

## 📋 현재 상황 분석

### 고객 그룹 분류
- **landing**: 랜딩 페이지 및 회원가입
- **organization**: 조직 관리 (B2B)
- **individual**: 개인 사용자 (B2C)  
- **system**: 시스템 관리자

### 공통 기능 모듈
- **ai-report**: 측정, 분석, 리포트 생성
- **ai-chatbot**: 개인 맞춤형 agent 시스템

## 🏗️ 제안하는 새로운 구조

```
src/
├── core/                           # 🔧 핵심 공통 기능
│   ├── services/
│   │   ├── BaseService.ts          # 모든 서비스의 기본 클래스
│   │   ├── firebase.ts             # Firebase 설정
│   │   └── ErrorHandler.ts         # 전역 에러 처리
│   ├── types/
│   │   ├── index.ts                # 공통 타입 정의
│   │   ├── auth.ts                 # 인증 관련 타입
│   │   └── business.ts             # 비즈니스 공통 타입
│   ├── utils/
│   │   ├── validation.ts           # 공통 검증 유틸
│   │   ├── formatting.ts           # 포맷팅 유틸
│   │   └── constants.ts            # 전역 상수
│   └── hooks/
│       ├── useAuth.ts              # 인증 훅
│       └── useErrorHandler.ts      # 에러 처리 훅
│
├── domains/                        # 🏢 도메인별 모듈
│   ├── organization/               # 조직 관리 도메인
│   │   ├── services/
│   │   │   ├── OrganizationService.ts
│   │   │   ├── MemberManagementService.ts
│   │   │   ├── CreditManagementService.ts
│   │   │   └── TrialManagementService.ts
│   │   ├── types/
│   │   │   ├── organization.ts
│   │   │   ├── member.ts
│   │   │   └── credit.ts
│   │   ├── components/
│   │   │   ├── Dashboard/
│   │   │   ├── Members/
│   │   │   ├── Credits/
│   │   │   └── Organization/
│   │   ├── pages/
│   │   │   ├── OrganizationAdminPage.tsx
│   │   │   └── MemberManagementPage.tsx
│   │   ├── hooks/
│   │   │   ├── useOrganization.ts
│   │   │   ├── useMembers.ts
│   │   │   └── useCredits.ts
│   │   └── utils/
│   │       ├── organizationHelpers.ts
│   │       └── memberValidation.ts
│   │
│   ├── individual/                 # 개인 사용자 도메인
│   │   ├── services/
│   │   │   ├── PersonalDataService.ts
│   │   │   └── PersonalReportService.ts
│   │   ├── types/
│   │   │   └── individual.ts
│   │   ├── components/
│   │   │   ├── PersonalDashboard/
│   │   │   └── PersonalReports/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── utils/
│   │
│   ├── system/                     # 시스템 관리자 도메인
│   │   ├── services/
│   │   │   ├── SystemManagementService.ts
│   │   │   └── AdminAnalyticsService.ts
│   │   ├── types/
│   │   │   └── system.ts
│   │   ├── components/
│   │   │   ├── SystemDashboard/
│   │   │   └── AdminControls/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── utils/
│   │
│   ├── ai-report/                  # 🤖 AI 리포트 공통 기능
│   │   ├── services/
│   │   │   ├── MeasurementService.ts
│   │   │   ├── AnalysisService.ts
│   │   │   ├── ReportGenerationService.ts
│   │   │   └── DataQualityService.ts
│   │   ├── types/
│   │   │   ├── measurement.ts
│   │   │   ├── analysis.ts
│   │   │   └── report.ts
│   │   ├── components/
│   │   │   ├── MeasurementUI/
│   │   │   ├── AnalysisCharts/
│   │   │   └── ReportViewer/
│   │   ├── utils/
│   │   │   ├── signalProcessing.ts
│   │   │   ├── analysisHelpers.ts
│   │   │   └── reportFormatters.ts
│   │   └── hooks/
│   │       ├── useMeasurement.ts
│   │       ├── useAnalysis.ts
│   │       └── useReport.ts
│   │
│   └── ai-chatbot/                 # 🤖 AI 챗봇 공통 기능
│       ├── services/
│       │   ├── ChatbotService.ts
│       │   ├── PersonalizationService.ts
│       │   └── ConversationService.ts
│       ├── types/
│       │   ├── chatbot.ts
│       │   └── conversation.ts
│       ├── components/
│       │   ├── ChatInterface/
│       │   ├── PersonalAgent/
│       │   └── ConversationHistory/
│       ├── utils/
│       │   ├── nlpHelpers.ts
│       │   └── personalizationHelpers.ts
│       └── hooks/
│           ├── useChatbot.ts
│           └── usePersonalization.ts
│
├── shared/                         # 🔄 완전 공통 컴포넌트
│   ├── components/
│   │   ├── ui/                     # 현재 ui 컴포넌트들
│   │   ├── Layout/
│   │   └── Navigation/
│   ├── hooks/
│   │   ├── useLocalStorage.ts
│   │   └── useDebounce.ts
│   └── utils/
│       ├── dateUtils.ts
│       └── formatUtils.ts
│
├── app/                            # 🚀 앱 레벨 설정
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   └── DomainLayout.tsx
│   ├── routing/
│   │   ├── AppRouter.tsx
│   │   ├── OrganizationRoutes.tsx
│   │   ├── IndividualRoutes.tsx
│   │   └── SystemRoutes.tsx
│   ├── providers/
│   │   ├── AuthProvider.tsx
│   │   ├── ThemeProvider.tsx
│   │   └── ErrorBoundary.tsx
│   └── config/
│       ├── environment.ts
│       └── features.ts
│
└── pages/                          # 📄 최상위 페이지들
    ├── LandingPage.tsx
    ├── LoginPage.tsx
    └── NotFoundPage.tsx
```

## 🎯 리팩토링 계획

### Phase 1: 핵심 구조 생성 (1일)
1. **폴더 구조 생성**
   - core, domains, shared, app 폴더 생성
   - 각 도메인별 하위 폴더 구조 생성

2. **현재 파일들 이동**
   - `BaseService.ts` → `core/services/`
   - `organization.ts`, `member.ts` → `domains/organization/types/`
   - `OrganizationService.ts` → `domains/organization/services/`
   - `CreditManagementService.ts` → `domains/organization/services/`

### Phase 2: Import 경로 수정 (1일)
1. **절대 경로 설정**
   ```typescript
   // vite.config.ts에 alias 추가
   export default defineConfig({
     resolve: {
       alias: {
         '@core': path.resolve(__dirname, './src/core'),
         '@domains': path.resolve(__dirname, './src/domains'),
         '@shared': path.resolve(__dirname, './src/shared'),
         '@app': path.resolve(__dirname, './src/app'),
       },
     },
   });
   ```

2. **모든 import 문 업데이트**

### Phase 3: 도메인별 정리 (2-3일)
1. **Organization 도메인 완성**
2. **AI Report 도메인 분리**
3. **공통 컴포넌트 정리**

## 🔄 이동할 기존 파일들

### services/ → domains/organization/services/
- `CreditManagementService.ts` ✅ (이미 잘 구현됨)
- `OrganizationService.ts` ✅
- `MemberManagementService.ts` (구현 예정)

### types/ → domains/organization/types/
- `organization.ts` ✅
- `member.ts` ✅
- `business.ts` → core/types/business.ts

### components/OrganizationAdmin/ → domains/organization/components/
- 모든 OrganizationAdmin 컴포넌트들

## 💡 장점

1. **명확한 책임 분리**: 각 도메인이 독립적
2. **확장성**: 새로운 도메인 추가 용이
3. **재사용성**: 공통 기능의 명확한 분리
4. **유지보수성**: 코드 찾기 쉬움
5. **팀 협업**: 도메인별 담당자 배정 가능

## 🤔 고려사항

1. **현재 vs 나중**: 지금 정리하면 개발 속도는 느려지지만 장기적으로 유리
2. **학습 곡선**: 새로운 구조에 익숙해져야 함
3. **Import 경로**: 절대 경로 설정 필요

## 💬 결정이 필요한 사항

1. **지금 리팩토링 vs 나중**: 추천은 **지금**
2. **점진적 vs 한번에**: 추천은 **점진적**
3. **우선순위**: Organization 도메인부터 시작

---

**추천**: 현재 Organization 관련 코드가 어느정도 구현되어 있으니, 지금이 리팩토링하기 좋은 시점입니다. 점진적으로 진행하여 개발 속도에 큰 영향을 주지 않으면서도 구조를 개선할 수 있습니다. 