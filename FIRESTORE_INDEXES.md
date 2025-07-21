# Firestore 인덱스 설정 가이드

이 프로젝트는 Firestore의 복합 인덱스가 필요합니다. 아래 인덱스들을 Firebase Console에서 생성해주세요.

## 필요한 인덱스

### 1. measurementUsers 컬렉션
- **필드**: 
  - `organizationId` (오름차순)
  - `createdAt` (내림차순)
- **용도**: 조직별 측정 대상자 목록을 최신순으로 조회

### 2. organizationDevices 컬렉션
- **필드**:
  - `organizationId` (오름차순)
  - `registrationDate` (내림차순)
- **용도**: 조직별 디바이스 목록을 등록일 기준으로 조회

- **필드**:
  - `organizationId` (오름차순)
  - `acquisitionType` (오름차순)
  - `rentalEndDate` (오름차순)
- **용도**: 조직별 렌탈 디바이스 조회

- **필드**:
  - `organizationId` (오름차순)
  - `acquisitionType` (오름차순)
  - `purchaseDate` (내림차순)
- **용도**: 조직별 구매 디바이스 조회

### 3. organizationServiceRequests 컬렉션
- **필드**:
  - `organizationId` (오름차순)
  - `requestDate` (내림차순)
- **용도**: 조직별 서비스 요청 조회

- **필드**:
  - `organizationId` (오름차순)
  - `type` (오름차순)
  - `requestDate` (내림차순)
- **용도**: 조직별 특정 타입의 서비스 요청 조회

## 인덱스 생성 방법

1. [Firebase Console](https://console.firebase.google.com)에 접속
2. 프로젝트 선택 (mind-breeze-ai-report-47942)
3. Firestore Database 메뉴 선택
4. Indexes 탭 클릭
5. "Create Index" 버튼 클릭
6. 위 필드들을 순서대로 추가
7. "Create" 클릭

또는 Firestore 쿼리 실행 시 나타나는 오류 메시지의 링크를 클릭하여 자동으로 인덱스를 생성할 수 있습니다.