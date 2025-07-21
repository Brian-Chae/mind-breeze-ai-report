# 🎯 디바이스 관리 시스템 재설계

## 📋 현재 문제점
- "배정"이라는 용어가 렌탈과 판매를 모두 포함하여 혼동 발생
- 판매 기기가 판매기기관리에서 올바르게 표시되지 않음
- 비즈니스 로직과 UI 용어가 불일치

## 🎯 새로운 시스템 설계

### 1. 디바이스 상태 재정의

```typescript
enum DeviceStatus {
  AVAILABLE = 'AVAILABLE',    // 재고 (배정 대기)
  RENTED = 'RENTED',         // 렌탈 완료
  SOLD = 'SOLD',             // 판매 완료  
  IN_USE = 'IN_USE',         // 사용 중 (렌탈/판매 공통)
  MAINTENANCE = 'MAINTENANCE', // 수리 중
  RETIRED = 'RETIRED'        // 폐기됨
}

enum BusinessType {
  RENTAL = 'RENTAL',   // 렌탈 업무
  SALE = 'SALE'        // 판매 업무
}
```

### 2. 새로운 비즈니스 플로우

```
📦 디바이스 등록 (AVAILABLE)
         ↓
    🔀 업무 선택
    ├─ 🏠 렌탈 → RENTED → 렌탈관리
    └─ 💰 판매 → SOLD → 판매기기관리
         ↓
    📱 사용 중 (IN_USE)
```

### 3. 데이터 모델 수정

#### DeviceInventory 수정사항:
```typescript
interface DeviceInventory {
  // 기존 assignedXXX 필드들을 businessType별로 분리
  businessType?: BusinessType;        // 'RENTAL' | 'SALE'
  
  // 렌탈 정보
  rentalOrganizationId?: string;
  rentalOrganizationName?: string; 
  rentalStartDate?: Date;
  rentalEndDate?: Date;
  
  // 판매 정보
  soldToOrganizationId?: string;
  soldToOrganizationName?: string;
  saleDate?: Date;
  salePrice?: number;
}
```

### 4. UI 변경사항

#### 재고 관리 탭:
- "배정 대기 목록" → "재고 목록" (AVAILABLE)
- "배정 완료 목록" → "렌탈/판매 완료 목록" 분리
  - 렌탈 완료: RENTED 상태
  - 판매 완료: SOLD 상태

#### 액션 버튼:
- "배정하기" → "렌탈/판매 처리"
- "배정 해제" → "반납 처리" (렌탈) / "회수 처리" (판매)

### 5. 서비스 로직 변경

#### DeviceInventoryService:
- `updateDeviceAssignment()` → `processRental()` / `processSale()`
- `unassignDevice()` → `processReturn()` / `processReclaim()`

#### SystemAdminService:
- 렌탈 통계와 판매 통계 분리
- 각각의 관리 화면에서 적절한 데이터만 표시

### 6. 데이터 마이그레이션 계획

1. **기존 데이터 분석**: 현재 assignmentType 필드로 렌탈/구매 구분
2. **단계적 마이그레이션**: 
   - Phase 1: 새로운 필드 추가
   - Phase 2: 데이터 변환
   - Phase 3: 기존 필드 제거
3. **백워드 호환성**: 마이그레이션 중에도 시스템 정상 작동

### 7. 구현 우선순위

1. **High**: 타입 정의 및 데이터 모델 수정
2. **High**: DeviceInventoryService 로직 수정
3. **Medium**: UI 컴포넌트 용어 및 로직 변경
4. **Medium**: 판매기기관리 연동 강화
5. **Low**: 데이터 마이그레이션 및 정리