# 기업 멤버(측정 대상자) 간편 UX 구현 방안

## 📋 요구사항 분석

### 현재 니즈
- **기업 관리자**: 정식 회원가입 (이메일 인증, 결제 시스템)
- **기업 멤버**: 간편한 사용, 특별한 인증 절차 없음
- **Unique ID**: 이름 + 생년월일 + 전화번호

### 두 가지 제안된 UX 방식
1. **방식 A**: 기업 담당자가 미리 회원 정보를 입력 → 회원별 바로 측정 버튼
2. **방식 B**: 기업 담당자가 바로 측정 버튼 클릭 → 측정 대상자 정보 입력 화면

---

## 🎯 추천 구현 방안

### 핵심 전략: 하이브리드 접근
- **기존 User 테이블 활용** (별도 테이블 생성하지 않음)
- **새로운 UserType 추가**: `MEASUREMENT_SUBJECT`
- **간소화된 등록 프로세스** 적용

---

## 🔧 DB 구조 확장

### 1. UserType 확장
```graphql
enum UserType {
  SYSTEM_ADMIN
  ORGANIZATION_ADMIN  
  ORGANIZATION_MEMBER
  INDIVIDUAL_USER
  MEASUREMENT_SUBJECT    # 새로 추가
}
```

### 2. User 테이블 확장
```graphql
type User @table {
  # 기본 정보
  email: String              # 측정 대상자는 선택사항
  displayName: String
  
  # 측정 대상자 전용 필드
  birthDate: Date            # 생년월일 (Unique ID용)
  phoneNumber: String        # 전화번호 (Unique ID용)
  gender: String             # 성별
  occupation: String         # 직업
  
  # 기존 필드들...
  employeeId: String
  organizationId: UUID
  userType: UserType!
  department: String
  position: String
  isActive: Boolean!
  
  # 메타데이터
  createdAt: Timestamp!
  createdBy: User           # 생성자 (기업 관리자)
  lastMeasurementAt: Timestamp
  
  # 인증 상태
  isEmailVerified: Boolean!  # 기본값: false (측정 대상자는 false)
  authMethod: String         # 'FULL_AUTH' | 'SIMPLE_REGISTRATION'
}
```

### 3. 복합 Unique 제약조건 추가
```graphql
# 측정 대상자용 Unique 제약조건
# displayName + birthDate + phoneNumber + organizationId
```

---

## 🛠 구현 상세 계획

### Phase 1: 기업 관리자 인터페이스

#### A. 멤버 사전 등록 기능
```typescript
// 기업 관리자 대시보드에 추가
interface MeasurementSubjectForm {
  displayName: string;
  birthDate: Date;
  phoneNumber: string;
  gender: 'MALE' | 'FEMALE';
  email?: string;           // 선택사항
  occupation?: string;
  department?: string;
  position?: string;
}

// 대량 등록 지원
interface BulkRegistrationData {
  subjects: MeasurementSubjectForm[];
  csvFile?: File;
}
```

#### B. 바로 측정 인터페이스
```typescript
// 두 가지 시나리오 지원
interface QuickMeasurementFlow {
  // 시나리오 1: 사전 등록된 멤버 선택
  preRegisteredSubjects: MeasurementSubject[];
  
  // 시나리오 2: 즉석 등록 + 측정
  quickRegistration: {
    form: MeasurementSubjectForm;
    proceedToMeasurement: boolean;
  };
}
```

### Phase 2: 측정 대상자 경험

#### A. 간편 등록 프로세스
```typescript
interface SimpleRegistrationFlow {
  step1: {
    displayName: string;
    birthDate: Date;
    phoneNumber: string;
  };
  
  step2: {
    gender: 'MALE' | 'FEMALE';
    occupation: string;
    department?: string;
  };
  
  step3: {
    email?: string;        // 선택사항
    consent: boolean;      // 개인정보 처리 동의
  };
  
  validation: {
    checkDuplicate: (name: string, birth: Date, phone: string) => boolean;
    generateUniqueId: () => string;
  };
}
```

#### B. 측정 세션 시작
```typescript
interface MeasurementSession {
  subjectId: string;
  organizationId: string;
  adminId: string;           // 세션을 시작한 기업 관리자
  deviceId: string;
  startedAt: Timestamp;
  
  // 간편 인증
  simpleAuth: {
    name: string;
    birthDate: Date;
    phoneNumber: string;
  };
}
```

---

## 📱 UX 시나리오

### 시나리오 1: 사전 등록 방식
```
1. 기업 관리자 로그인
2. "Members" 메뉴 → "측정 대상자 추가"
3. 개별 또는 CSV 대량 등록
4. "바로 측정" 메뉴 → 등록된 대상자 목록 표시
5. 대상자 선택 → 디바이스 연결 → 측정 시작
```

### 시나리오 2: 즉석 등록 방식
```
1. 기업 관리자 로그인
2. "바로 측정" 메뉴 → "새로운 측정 대상자"
3. 대상자 정보 입력 (이름, 생년월일, 전화번호, 성별, 직업)
4. 중복 확인 → 자동 등록
5. 디바이스 연결 → 측정 시작
```

### 시나리오 3: 측정 대상자 셀프 서비스 (모바일 웹)
```
1. QR 코드 스캔 또는 링크 접속
2. 간단한 정보 입력 (이름, 생년월일, 전화번호)
3. 기업 관리자 승인 대기
4. 승인 후 측정 진행
```

---

## 🔒 보안 및 개인정보 보호

### 1. 데이터 최소화
- 측정 대상자는 필수 정보만 수집
- 이메일 인증 불필요
- 복잡한 비밀번호 설정 없음

### 2. 조직 내 접근 제어
- 측정 대상자는 자신이 속한 조직 내에서만 접근 가능
- 기업 관리자만 측정 대상자 정보 관리 가능
- 크로스 조직 데이터 접근 방지

### 3. 개인정보 처리 동의
```typescript
interface ConsentManagement {
  personalDataProcessing: boolean;    // 개인정보 처리 동의
  measurementDataUsage: boolean;      // 측정 데이터 활용 동의
  thirdPartySharing: boolean;         // 제3자 제공 동의 (선택)
  marketingCommunication: boolean;    // 마케팅 활용 동의 (선택)
  
  consentedAt: Timestamp;
  consentedBy: User;                  // 기업 관리자 또는 본인
  ipAddress: string;
}
```

---

## 🚀 구현 우선순위

### Week 1: 기본 구조
- [ ] UserType에 MEASUREMENT_SUBJECT 추가
- [ ] User 테이블 확장 (birthDate, phoneNumber 필드)
- [ ] 복합 Unique 제약조건 구현
- [ ] 간편 등록 서비스 구현

### Week 2: 기업 관리자 인터페이스
- [ ] 측정 대상자 등록 화면
- [ ] 대량 등록 (CSV) 기능
- [ ] 바로 측정 인터페이스 (두 가지 시나리오)
- [ ] 중복 확인 및 검증 로직

### Week 3: 측정 대상자 경험
- [ ] 간편 등록 프로세스
- [ ] 모바일 웹 인터페이스
- [ ] QR 코드 기반 접근
- [ ] 개인정보 동의 관리

### Week 4: 통합 및 테스트
- [ ] 전체 플로우 통합 테스트
- [ ] 보안 검증
- [ ] 성능 최적화
- [ ] 사용자 피드백 수집

---

## 💡 추가 고려사항

### 1. 확장성
- 향후 개인 고객 서비스 확장 시 호환성 유지
- 다양한 인증 방식 추가 가능한 구조

### 2. 분석 및 인사이트
- 측정 대상자별 이용 패턴 분석
- 조직별 참여도 및 완료율 통계
- 기업 관리자를 위한 대시보드 제공

### 3. 알림 시스템
- SMS/이메일을 통한 측정 알림
- 결과 공유 및 피드백 시스템
- 기업 관리자 보고서 자동 생성

---

## 🎯 기대 효과

1. **사용자 경험 개선**: 복잡한 회원가입 없이 간편한 측정 가능
2. **기업 관리자 효율성**: 중앙집중식 멤버 관리 및 측정 진행
3. **서비스 접근성**: 기술에 익숙하지 않은 사용자도 쉽게 이용
4. **데이터 품질**: 중복 방지 및 정확한 신원 확인
5. **비즈니스 확장**: B2B 시장에서의 경쟁력 강화 