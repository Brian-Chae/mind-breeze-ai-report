# Mind Breeze AI - B2B 기업 인증 시스템 기획서

## 📋 개요

Mind Breeze AI는 **철저한 B2B 서비스**로서, 기업 단위의 계약 및 관리가 핵심입니다. 
각 기업에는 **6자리 고유 코드**가 발행되어 모든 사용자가 이 코드를 통해 기업과 연결됩니다.

---

## 🏢 기업 중심 사용자 구조

### 1. **ORGANIZATION_ADMIN** (기업 관리자)
- **역할**: 새로운 기업 등록 및 최종 관리자
- **권한**: 전체 기업 데이터 관리, 결제 관리, 멤버 관리
- **가입 방식**: 신규 기업 등록을 통한 가입

### 2. **ORGANIZATION_MEMBER** (현장 서비스 제공자)
- **역할**: 기존 기업의 현장 담당자 (HR, 측정 담당자)
- **권한**: 자신이 측정한 데이터만 접근 가능
- **가입 방식**: 기업 6자리 코드를 통한 가입

### 3. **MEASUREMENT_SUBJECT** (측정 대상자)
- **역할**: 측정만 하는 간편 사용자
- **권한**: 측정 참여만 가능 (로그인 불가)
- **가입 방식**: 간편 등록 (이름+생년월일+전화번호)

---

## 🔐 회원가입 플로우

### 초기 선택 화면
```
┌─────────────────────────────────────────────────────────────┐
│                    기업 회원가입                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🏢 새로운 계약을 생성하고                                     │
│     신규 기업 등록을 원하시나요?                               │
│                                                             │
│     [신규 기업 등록하기]                                       │
│                                                             │
│  ────────────────────────────────────────────────────────   │
│                                                             │
│  👥 이미 등록된 기업의                                        │
│     관리자 등록을 원하시나요?                                  │
│                                                             │
│     [기존 기업 합류하기]                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1. 신규 기업 등록 플로우 (ORGANIZATION_ADMIN)

#### 단계 1: 기업 정보 입력
```typescript
interface CompanyRegistrationForm {
  companyName: string;           // 기업명
  businessRegistrationNumber: string;  // 사업자 등록번호
  address: string;               // 주소
  employeeCount: number;         // 임직원 수
  industry?: string;             // 업종 (선택사항)
  contactPhone: string;          // 연락처
}
```

#### 단계 2: 관리자 정보 입력
```typescript
interface AdminRegistrationForm {
  name: string;                  // 관리자 이름
  email: string;                 // 이메일
  password: string;              // 비밀번호
  position: string;              // 직책
  phone: string;                 // 전화번호
}
```

#### 단계 3: 결제 옵션 선택
```
┌─────────────────────────────────────────────────────────────┐
│                    결제 옵션 선택                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  💳 현재 테스트 단계입니다                                     │
│                                                             │
│  📞 [별도 연락 예정]                                          │
│                                                             │
│  담당자가 별도로 연락드려 결제 및 계약 조건을                    │
│  안내해드리겠습니다.                                           │
│                                                             │
│  [등록 완료하기]                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 단계 4: 기업 코드 발행
```
┌─────────────────────────────────────────────────────────────┐
│                  🎉 기업 등록 완료!                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  기업명: (주)테스트컴퍼니                                       │
│  기업 코드: MB2024                                            │
│                                                             │
│  ⚠️ 이 6자리 코드는 임직원이 가입할 때 필요합니다.               │
│     안전한 곳에 보관해주세요.                                   │
│                                                             │
│  [대시보드로 이동]                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. 기존 기업 합류 플로우 (ORGANIZATION_MEMBER)

#### 단계 1: 기업 코드 입력
```typescript
interface CompanyCodeForm {
  companyCode: string;           // 6자리 기업 코드
}
```

#### 단계 2: 기업 정보 확인
```
┌─────────────────────────────────────────────────────────────┐
│                    기업 정보 확인                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  기업 코드: MB2024                                            │
│  기업명: (주)테스트컴퍼니                                       │
│  주소: 서울시 강남구 테헤란로 123                               │
│                                                             │
│  이 기업에 합류하시겠습니까?                                    │
│                                                             │
│  [예, 합류하겠습니다]  [아니오]                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 단계 3: 개인 정보 입력
```typescript
interface MemberRegistrationForm {
  name: string;                  // 이름
  email: string;                 // 이메일
  password: string;              // 비밀번호
  position: string;              // 직책
  phone: string;                 // 전화번호
  department?: string;           // 부서 (선택사항)
}
```

---

## 🔑 로그인 시스템

### 통합 로그인 화면
```
┌─────────────────────────────────────────────────────────────┐
│                    기업 로그인                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📧 이메일: [________________]                                │
│  🔒 비밀번호: [________________]                               │
│                                                             │
│  [기업 로그인]                                                │
│                                                             │
│  ────────────────────────────────────────────────────────   │
│                                                             │
│  계정이 없으신가요?                                            │
│  [기업 회원가입]                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 로그인 후 대시보드 분기
```typescript
// 로그인 후 자동 분기
if (user.userType === 'ORGANIZATION_ADMIN') {
  redirect('/dashboard/admin');
} else if (user.userType === 'ORGANIZATION_MEMBER') {
  redirect('/dashboard/member');
}
```

---

## 🏗️ 데이터베이스 구조

### Company 테이블
```sql
CREATE TABLE Company (
  id VARCHAR(36) PRIMARY KEY,
  companyCode VARCHAR(6) UNIQUE NOT NULL,  -- 6자리 고유 코드
  companyName VARCHAR(255) NOT NULL,
  businessRegistrationNumber VARCHAR(50) UNIQUE,
  address TEXT,
  employeeCount INTEGER,
  industry VARCHAR(100),
  contactPhone VARCHAR(20),
  paymentStatus ENUM('PENDING', 'ACTIVE', 'SUSPENDED') DEFAULT 'PENDING',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### User 테이블 (확장)
```sql
ALTER TABLE User ADD COLUMN companyId VARCHAR(36);
ALTER TABLE User ADD COLUMN companyCode VARCHAR(6);
ALTER TABLE User ADD COLUMN position VARCHAR(100);
ALTER TABLE User ADD COLUMN department VARCHAR(100);
ALTER TABLE User ADD FOREIGN KEY (companyId) REFERENCES Company(id);
```

### CompanyCode 생성 규칙
```typescript
// 6자리 코드 생성 규칙
const generateCompanyCode = (): string => {
  const prefix = 'MB';  // Mind Breeze
  const year = new Date().getFullYear().toString().slice(-2);  // 24
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');  // 00-99
  
  return `${prefix}${year}${random}`;  // MB2401, MB2402, ...
};
```

---

## 📱 UI 구성

### 네비게이션 메뉴 업데이트
```typescript
// 기존
<Button>로그인</Button>
<Button>회원가입</Button>

// 변경
<Button>기업 로그인</Button>
<Button>기업 회원가입</Button>
```

### 랜딩 페이지 메시지
```
- "기업을 위한 AI 헬스케어 솔루션"
- "6자리 기업 코드로 간편한 관리"
- "B2B 전용 맞춤형 서비스"
```

---

## 🔄 구현 우선순위

### Phase 1: 기본 기업 인증 시스템
1. 기업 등록 시스템 구현
2. 6자리 코드 생성 및 검증
3. 기업 관리자 회원가입
4. 기업 멤버 회원가입
5. 통합 로그인 시스템

### Phase 2: 대시보드 분기
1. 기업 관리자 대시보드
2. 현장 담당자 대시보드
3. 데이터 접근 권한 제어

### Phase 3: 고급 기능
1. 결제 시스템 연동
2. 기업별 사용량 추적
3. 고급 관리 기능

---

## 🛡️ 보안 고려사항

### 기업 코드 보안
- 6자리 코드 무차별 대입 방지 (rate limiting)
- 코드 유효성 검증
- 코드 공유 시 주의사항 안내

### 데이터 격리
- 기업별 완전한 데이터 격리
- 멤버는 자신이 측정한 데이터만 접근
- 관리자는 전체 기업 데이터 접근

### 인증 보안
- 강력한 비밀번호 정책
- 이메일 인증 필수
- 세션 관리 및 만료 처리

---

## 📊 성공 지표

### 기업 등록 관련
- 기업 등록 완료율
- 코드 공유 및 멤버 가입율
- 기업별 활성 사용자 수

### 사용자 경험
- 회원가입 완료 시간
- 로그인 성공률
- 대시보드 접근 시간

### 비즈니스 지표
- 기업 고객 획득율
- 기업당 평균 사용자 수
- 측정 세션 수 