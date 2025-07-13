# Mind Breeze AI 사용자 타입 관계 및 차이점 (업데이트된 역할 정의)

## 📋 사용자 타입 개요

현재 시스템에는 3가지 기업 관련 사용자 타입이 있습니다:
- `ORGANIZATION_ADMIN` (기업 관리자 - 최고 권한자/의사결정권자)
- `ORGANIZATION_MEMBER` (현장 서비스 제공자 - HR 담당자/측정 담당자)
- `MEASUREMENT_SUBJECT` (측정 대상자 - 간편 사용자)

---

## 🔄 사용자 타입 간 관계도

```
┌─────────────────────────────────────────────────────────────┐
│                        조직 (Organization)                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐                                       │
│  │ ORGANIZATION_    │    최종 의사결정                          │
│  │ ADMIN            │    전체 관리                             │
│  │ (최고 관리자)       │    결제 권한                             │
│  └──────────────────┘                                       │
│           │                                                 │
│           │ 관리/지시                                         │
│           ▼                                                 │
│  ┌──────────────────┐    현장 서비스 제공                      │
│  │ ORGANIZATION_    │    측정 담당                             │
│  │ MEMBER           │    제한된 데이터 접근                      │
│  │ (현장 담당자)       │                                       │
│  └──────────────────┘                                       │
│           │                                                 │
│           │ 직접 서비스 제공                                    │
│           ▼                                                 │
│  ┌──────────────────┐                                       │
│  │ MEASUREMENT_     │                                       │
│  │ SUBJECT          │                                       │
│  │ (측정 대상자)       │                                       │
│  └──────────────────┘                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 각 사용자 타입 상세 분석

### 1. ORGANIZATION_ADMIN (기업 관리자 - 최고 권한자)

#### 특징
- **역할**: 기업의 최종 의사결정권자, 최상위 관리자
- **인증 방식**: 완전한 회원가입 (이메일, 패스워드, 이메일 인증)
- **결제 권한**: 있음 (크레딧 구매, 구독 관리)
- **수량**: 기업당 1명 이상 (소수)
- **데이터 접근**: 모든 조직 데이터 접근 가능

#### 권한 범위
```typescript
const organizationAdminPermissions = {
  // 기업 관리 (최고 권한)
  manageOrganization: true,
  manageContract: true,
  managePayment: true,
  manageCredits: true,
  
  // 전체 멤버 관리
  createMember: true,
  deleteMember: true,
  viewAllMembers: true,
  manageMemberPermissions: true,
  
  // 모든 측정 대상자 관리
  createMeasurementSubject: true,
  deleteMeasurementSubject: true,
  viewAllSubjects: true,
  
  // 전체 데이터 관리 (모든 조직 데이터)
  viewAllOrganizationData: true,
  viewAllMeasurementData: true,
  exportAllData: true,
  manageDataPolicy: true,
  
  // 시스템 관리
  manageDevices: true,
  viewAnalytics: true,
  generateReports: true,
  
  // 측정 관련
  conductMeasurement: true,
  viewMeasurementHistory: true,
};
```

#### 사용 시나리오
```
- 기업 계약 및 결제 관리
- 전체 조직 현황 파악
- 비즈니스 의사결정을 위한 데이터 분석
- 시스템 정책 설정
- 예산 관리 및 크레딧 구매
```

### 2. ORGANIZATION_MEMBER (현장 서비스 제공자 - HR 담당자)

#### 특징
- **역할**: 현장에서 MEASUREMENT_SUBJECT에게 서비스를 제공하는 HR 담당자/측정 담당자
- **인증 방식**: 완전한 회원가입 (이메일, 패스워드, 이메일 인증)
- **결제 권한**: 없음 (ADMIN만 가능)
- **수량**: 기업당 여러 명 (현장 담당자 수에 따라)
- **데이터 접근**: 자신이 측정한 사람들의 데이터만 접근 가능

#### 권한 범위
```typescript
const organizationMemberPermissions = {
  // 개인 관리
  manageOwnProfile: true,
  changePassword: true,
  
  // 측정 대상자 관리 (제한적)
  createMeasurementSubject: true,        // 자신이 담당할 사람 등록
  viewOwnMeasurementSubjects: true,      // 자신이 측정한 사람들만
  conductMeasurement: true,              // 측정 진행
  
  // 데이터 관리 (매우 제한적)
  viewOwnMeasurementData: true,          // 자신이 측정한 데이터만
  exportOwnMeasurementData: true,        // 자신이 측정한 데이터만
  
  // 제한된 권한 (불가능)
  manageOrganization: false,
  viewAllData: false,                    // 전체 데이터 조회 불가
  viewOthersData: false,                 // 다른 담당자 데이터 조회 불가
  manageCredits: false,                  // 결제 및 크레딧 관리 불가
  manageDevices: false,                  // 디바이스 관리 불가
  manageMembers: false,                  // 다른 멤버 관리 불가
  viewAnalytics: false,                  // 전체 분석 불가
};
```

#### 사용 시나리오
```
- 건강검진 현장에서 참가자 등록 및 측정
- 자신이 담당한 측정 대상자들의 결과 확인
- 측정 결과를 참가자에게 전달
- 현장에서 발생한 문제 해결
- 자신이 측정한 데이터의 기본 분석
```

### 3. MEASUREMENT_SUBJECT (측정 대상자)

#### 특징
- **역할**: 측정만 하는 대상자 (가장 간단한 사용자)
- **인증 방식**: 간편 등록 (이름 + 생년월일 + 전화번호)
- **결제 권한**: 없음
- **수량**: 기업당 매우 많음 (수백~수천 명)
- **데이터 접근**: 측정 직후 결과만 간단히 확인 가능

#### 권한 범위
```typescript
const measurementSubjectPermissions = {
  // 측정 관련 (매우 제한적)
  participateInMeasurement: true,
  viewOwnMeasurementResult: true,        // 측정 직후에만
  
  // 제한된 권한 (모두 불가능)
  login: false,                          // 로그인 불가
  manageProfile: false,                  // 프로필 관리 불가
  viewHistory: false,                    // 히스토리 조회 불가
  exportData: false,                     // 데이터 내보내기 불가
  manageConsent: false,                  // 동의 관리 불가 (담당자가 대신)
};
```

---

## 🏢 실제 사용 시나리오

### 시나리오 1: 기업 건강검진
```
1. [ORGANIZATION_ADMIN] 건강검진 계획 수립 및 크레딧 구매
2. [ORGANIZATION_ADMIN] 현장 담당자들(ORGANIZATION_MEMBER) 지정
3. [ORGANIZATION_MEMBER] 건강검진 현장에서 참가자 등록 및 측정
4. [MEASUREMENT_SUBJECT] 간편 등록 후 측정 참여
5. [ORGANIZATION_MEMBER] 측정 결과 확인 및 참가자에게 전달
6. [ORGANIZATION_ADMIN] 전체 결과 분석 및 보고서 생성
```

### 시나리오 2: 다중 사이트 관리
```
Site A: 
- [ORGANIZATION_MEMBER A] 자신이 측정한 사람들만 관리
- [MEASUREMENT_SUBJECT] 100명 측정

Site B:
- [ORGANIZATION_MEMBER B] 자신이 측정한 사람들만 관리
- [MEASUREMENT_SUBJECT] 150명 측정

본사:
- [ORGANIZATION_ADMIN] 전체 사이트 데이터 통합 관리
- Site A + Site B 모든 데이터 접근 가능
```

### 시나리오 3: 권한 분리를 통한 보안
```
- [ORGANIZATION_ADMIN]: 전체 250명 데이터 접근 가능
- [ORGANIZATION_MEMBER A]: 자신이 측정한 100명 데이터만 접근
- [ORGANIZATION_MEMBER B]: 자신이 측정한 150명 데이터만 접근
- [MEASUREMENT_SUBJECT]: 자신의 측정 결과만 측정 직후 확인
```

---

## 📊 데이터 접근 권한 매트릭스 (업데이트됨)

| 기능 | ORGANIZATION_ADMIN | ORGANIZATION_MEMBER | MEASUREMENT_SUBJECT |
|------|-------------------|--------------------|--------------------|
| 로그인 | ✅ | ✅ | ❌ |
| 전체 조직 데이터 조회 | ✅ | ❌ | ❌ |
| 자신이 측정한 데이터 조회 | ✅ | ✅ | ❌ |
| 다른 담당자 데이터 조회 | ✅ | ❌ | ❌ |
| 측정 진행 | ✅ | ✅ | ✅ |
| 측정 대상자 등록 | ✅ | ✅ (자신 담당만) | ❌ |
| 크레딧 관리 | ✅ | ❌ | ❌ |
| 결제 관리 | ✅ | ❌ | ❌ |
| 멤버 관리 | ✅ | ❌ | ❌ |
| 디바이스 관리 | ✅ | ❌ | ❌ |
| 전체 데이터 내보내기 | ✅ | ❌ | ❌ |
| 자신 담당 데이터 내보내기 | ✅ | ✅ | ❌ |
| 전체 분석 리포트 열람 | ✅ | ❌ | ❌ |
| 자신 담당 분석 리포트 열람 | ✅ | ✅ | ❌ |
| 측정 결과 즉시 확인 | ✅ | ✅ | ✅ (측정 직후만) |

---

## 🔐 보안 및 권한 관리

### 데이터 분리 전략
```typescript
// ORGANIZATION_MEMBER의 데이터 접근 필터링
const getMeasurementData = (userId: string, userType: string) => {
  if (userType === 'ORGANIZATION_ADMIN') {
    return getAllOrganizationData();
  }
  
  if (userType === 'ORGANIZATION_MEMBER') {
    return getMeasurementDataByMeasurer(userId); // 측정자 기준 필터링
  }
  
  return null; // MEASUREMENT_SUBJECT는 데이터 조회 불가
};
```

### 측정 기록 추적
```typescript
// 누가 측정했는지 추적
const MeasurementSession = {
  id: string,
  subjectId: string,
  measuredBy: string,  // ORGANIZATION_MEMBER의 ID
  organizationId: string,
  timestamp: Date,
  // ... 기타 필드
};
```

---

## 💼 비즈니스 장점

### 1. 효율적인 현장 관리
- 각 현장 담당자가 자신의 업무 범위에 집중
- 불필요한 데이터 접근 제한으로 보안 강화
- 현장별 성과 추적 가능

### 2. 확장성
- 여러 사이트/지역에서 동시 운영 가능
- 담당자별 업무 분담 명확
- 조직 확장 시 쉬운 권한 관리

### 3. 데이터 보안
- 최소 권한 원칙 적용
- 개인정보 접근 최소화
- 감사 추적 가능

---

## 🚀 구현 고려사항

### 1. 데이터베이스 설계
```sql
-- 측정 세션에 측정자 정보 추가
ALTER TABLE MeasurementSession ADD COLUMN measuredBy VARCHAR(255);
ALTER TABLE MeasurementSession ADD INDEX idx_measured_by (measuredBy);

-- 사용자별 데이터 접근 권한 체크
CREATE VIEW MemberDataAccess AS
SELECT ms.* FROM MeasurementSession ms
WHERE ms.measuredBy = :currentUserId;
```

### 2. API 권한 검증
```typescript
// 미들웨어에서 권한 검증
const checkDataAccess = (req, res, next) => {
  const { userType, userId } = req.user;
  const { subjectId } = req.params;
  
  if (userType === 'ORGANIZATION_ADMIN') {
    return next(); // 전체 접근 허용
  }
  
  if (userType === 'ORGANIZATION_MEMBER') {
    // 자신이 측정한 데이터만 접근 허용
    return checkMeasurementOwnership(userId, subjectId)
      .then(isOwner => isOwner ? next() : res.status(403).json({error: 'Access denied'}));
  }
  
  return res.status(403).json({error: 'Access denied'});
};
```

### 3. UI/UX 차별화
```typescript
// 사용자 타입별 다른 대시보드
const Dashboard = ({ userType }) => {
  switch(userType) {
    case 'ORGANIZATION_ADMIN':
      return <AdminDashboard />; // 전체 관리 기능
    case 'ORGANIZATION_MEMBER':
      return <MemberDashboard />; // 현장 담당자 기능
    default:
      return <AccessDenied />;
  }
};
```

---

## 💡 결론

이 새로운 역할 정의는 **실제 현장에서 더 실용적**입니다:

- **ORGANIZATION_ADMIN**: 전체를 관리하는 의사결정권자
- **ORGANIZATION_MEMBER**: 현장에서 서비스를 제공하는 담당자 (제한된 권한)
- **MEASUREMENT_SUBJECT**: 측정만 하는 간편 사용자

이를 통해 **조직별 관리가 원활**해지고, **사이트별 관리가 쉬워지며**, **보안도 강화**됩니다.

---

**이 새로운 역할 정의로 더 명확하고 실용적인 시스템이 될 것 같습니다!** 