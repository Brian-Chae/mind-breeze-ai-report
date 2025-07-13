# Firebase 설정 및 사용 가이드

## 🔥 Firebase 초기화 완료

Firebase SDK가 성공적으로 초기화되었습니다. 다음 파일들이 생성되었습니다:

### 📁 생성된 파일들

1. **`src/services/firebase.ts`** - Firebase 설정 및 초기화
2. **`src/services/FirebaseService.ts`** - Firebase 서비스 클래스
3. **`src/examples/FirebaseExample.tsx`** - 사용 예제 컴포넌트

## 🔧 Firebase 콘솔 필수 설정

### 1. Authentication 설정 확인

Firebase 콘솔(https://console.firebase.google.com)에서 다음을 확인하세요:

#### ✅ 인증 방법 활성화
- **이메일/비밀번호**: 활성화 필요
- **Google**: 활성화 필요 (선택사항)

#### ✅ 승인된 도메인 설정 ⚠️ **중요**
Authentication > Settings > Authorized domains에 다음 도메인들이 **반드시** 추가되어 있어야 합니다:

**개발 환경:**
```
localhost
127.0.0.1
localhost:5173
localhost:5174
```

**프로덕션 환경:**
```
mind-breeze-ai-report-47942.firebaseapp.com
mind-breeze-ai-report-47942.web.app
```

**설정 방법:**
1. Firebase Console > Authentication > Settings
2. "Authorized domains" 섹션에서 "Add domain" 클릭
3. 위의 모든 도메인을 하나씩 추가

⚠️ **주의사항**: 
- 개발 중에는 `localhost:5174`가 반드시 포함되어야 함
- 포트 번호까지 정확히 일치해야 함
- 프로토콜(http/https)은 제외하고 도메인만 입력

#### ✅ Google OAuth 설정 (Google 로그인 사용 시) ⚠️ **중요**

**1단계: Google 로그인 활성화**
1. Firebase Console > Authentication > Sign-in method
2. Google 제공업체 클릭하여 활성화

**2단계: 웹 SDK 구성 설정**
Google 제공업체 설정에서 다음을 정확히 입력:

**승인된 JavaScript 원본:**
```
http://localhost:5173
http://localhost:5174
https://mind-breeze-ai-report-47942.firebaseapp.com
https://mind-breeze-ai-report-47942.web.app
```

**승인된 리디렉션 URI:**
```
http://localhost:5173/__/auth/handler
http://localhost:5174/__/auth/handler
https://mind-breeze-ai-report-47942.firebaseapp.com/__/auth/handler
https://mind-breeze-ai-report-47942.web.app/__/auth/handler
```

⚠️ **주의사항**:
- `/__/auth/handler` 경로는 Firebase가 자동으로 처리하는 OAuth 콜백 URL입니다
- 포트 번호와 프로토콜을 정확히 입력해야 합니다
- 개발 환경에서는 `http://`, 프로덕션에서는 `https://` 사용

### 2. Firestore Database 설정

#### ✅ 데이터베이스 생성
- Firestore Database 생성 (테스트 모드 또는 프로덕션 모드)
- 지역 설정 (asia-northeast3 권장)

#### ✅ 보안 규칙 설정
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 프로필 - 본인만 읽기/쓰기
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 건강 리포트 - 본인만 읽기/쓰기
    match /healthReports/{reportId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // 채팅 히스토리 - 본인만 읽기/쓰기
    match /chatHistory/{chatId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // 디바이스 정보 - 본인만 읽기/쓰기
    match /devices/{deviceId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

### 3. Storage 설정 (파일 업로드 시)

#### ✅ Cloud Storage 활성화
- Storage 버킷 생성
- 보안 규칙 설정

## 🚨 로그인 문제 해결 가이드

### 문제 1: 로그인 후 현재 페이지로 리다이렉션
**원인**: AuthProvider에서 자동 리다이렉션 충돌
**해결**: ✅ 수정 완료 - AuthProvider에서 자동 리다이렉션 제거

### 문제 2: 팝업 차단으로 Google 로그인 실패
**해결책**:
1. 팝업 허용 설정
2. 리다이렉트 방식 자동 전환 (구현됨)

### 문제 3: 승인되지 않은 도메인 오류 (`auth/unauthorized-domain`)
**증상**: 
- 개발 환경에서 Google 로그인 시 오류
- "This domain is not authorized" 메시지
- Google 팝업이 Firebase 프로덕션 도메인으로 리다이렉션됨

**원인**: Firebase Console에 현재 도메인이 등록되지 않음

**긴급 해결책** ⚠️:
1. **Firebase Console 접속**: https://console.firebase.google.com
2. **프로젝트 선택**: `mind-breeze-ai-report-47942`
3. **Authentication > Settings > Authorized domains**
4. **"Add domain" 버튼 클릭하여 다음 도메인들을 모두 추가**:
   - `localhost` ⭐ **필수**
   - `127.0.0.1` ⭐ **필수**
   - `localhost:5173` ⭐ **개발 포트**
   - `localhost:5174` ⭐ **백업 포트**
   - `mind-breeze-ai-report-47942.firebaseapp.com`
   - `mind-breeze-ai-report-47942.web.app`

**Google OAuth 추가 설정** ⚠️:
1. **Authentication > Sign-in method > Google 제공업체 클릭**
2. **웹 SDK 구성 섹션에서**:

   **승인된 JavaScript 원본**:
   ```
   http://localhost:5173
   http://localhost:5174
   https://mind-breeze-ai-report-47942.firebaseapp.com
   https://mind-breeze-ai-report-47942.web.app
   ```

   **승인된 리디렉션 URI**:
   ```
   http://localhost:5173/__/auth/handler
   http://localhost:5174/__/auth/handler
   https://mind-breeze-ai-report-47942.firebaseapp.com/__/auth/handler
   https://mind-breeze-ai-report-47942.web.app/__/auth/handler
   ```

**확인 방법**:
- 브라우저 개발자 도구 > Console에서 현재 주소 확인
- `window.location.href` 출력값과 Firebase 설정 비교
- 설정 후 5-10분 정도 기다린 후 테스트

### 문제 4: 네트워크 오류
**확인사항**:
1. 인터넷 연결 상태
2. Firebase 프로젝트 설정
3. API 키 유효성

## 🚀 사용 방법

### 1. 사용자 관리

```typescript
import { FirebaseService } from '../services/FirebaseService';

// 회원가입 (자동으로 사용자 프로필 생성)
const user = await FirebaseService.signUp('user@example.com', 'password123');

// 로그인 (자동으로 마지막 로그인 시간 업데이트)
const user = await FirebaseService.signIn('user@example.com', 'password123');

// 사용자 프로필 조회
const profile = await FirebaseService.getUserProfile(user.uid);

// 사용자 프로필 업데이트
await FirebaseService.updateUserProfile(user.uid, {
  displayName: '새 이름',
  preferences: { language: 'en' }
});
```

### 2. 건강 리포트 관리

```typescript
// 리포트 저장
const reportId = await FirebaseService.saveHealthReport(userId, {
  overallScore: 85,
  mentalHealthScore: 90,
  physicalHealthScore: 80,
  reportData: { /* AI 분석 결과 */ }
});

// 사용자 리포트 조회
const reports = await FirebaseService.getUserHealthReports(userId, 20);
```

### 3. 채팅 히스토리 관리

```typescript
// 채팅 메시지 저장
await FirebaseService.saveChatMessage(userId, {
  message: '안녕하세요',
  type: 'user',
  sessionId: 'chat-session-123'
});

// 채팅 히스토리 조회
const chatHistory = await FirebaseService.getChatHistory(userId, 50);
```

### 4. 디바이스 관리

```typescript
// 디바이스 정보 저장
await FirebaseService.saveDeviceInfo(userId, {
  serialNumber: 'LB-001-2024',
  model: 'LinkBand Pro',
  manufacturer: 'LOOXID LABS'
});

// 사용자 디바이스 조회
const devices = await FirebaseService.getUserDevices(userId);
```

### 5. Firebase 서비스 임포트

```typescript
import { FirebaseService } from '../services/FirebaseService';
```

### 6. 데이터 추가 (Create)

```typescript
// 문서 추가
const userId = await FirebaseService.addDocument('users', {
  name: '홍길동',
  email: 'hong@example.com',
  age: 30
});
```

### 7. 데이터 조회 (Read)

```typescript
// 단일 문서 조회
const user = await FirebaseService.getDocument('users', userId);

// 전체 문서 조회
const allUsers = await FirebaseService.getDocuments('users');

// 조건부 조회
const filters = [
  FirebaseService.createWhereFilter('age', '>=', 18),
  FirebaseService.createOrderByFilter('name', 'asc'),
  FirebaseService.createLimitFilter(10)
];
const adults = await FirebaseService.getDocuments('users', filters);
```

### 8. 데이터 수정 (Update)

```typescript
// 문서 수정
await FirebaseService.updateDocument('users', userId, {
  age: 31,
  lastLogin: new Date()
});
```

### 9. 데이터 삭제 (Delete)

```typescript
// 문서 삭제
await FirebaseService.deleteDocument('users', userId);
```

### 10. 실시간 데이터 구독

```typescript
// 실시간 데이터 구독
const unsubscribe = FirebaseService.subscribeToCollection('users', (data) => {
  console.log('사용자 데이터 업데이트:', data);
});

// 구독 해제
unsubscribe();
```

## 🔐 인증 (Authentication)

### 회원가입

```typescript
const user = await FirebaseService.signUp('user@example.com', 'password123');
```

### 로그인

```typescript
const user = await FirebaseService.signIn('user@example.com', 'password123');
```

### 로그아웃

```typescript
await FirebaseService.signOut();
```

### 인증 상태 감지

```typescript
const unsubscribe = FirebaseService.onAuthStateChanged((user) => {
  if (user) {
    console.log('사용자 로그인됨:', user.email);
  } else {
    console.log('사용자 로그아웃됨');
  }
});
```

## 📁 파일 업로드 (Storage)

### 파일 업로드

```typescript
const downloadURL = await FirebaseService.uploadFile('images/profile.jpg', file);
```

### 파일 삭제

```typescript
await FirebaseService.deleteFile('images/profile.jpg');
```

## 🎯 React 컴포넌트에서 사용하기

```typescript
import React, { useState, useEffect } from 'react';
import { FirebaseService } from '../services/FirebaseService';

const MyComponent: React.FC = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    // 데이터 로드
    const loadData = async () => {
      try {
        const result = await FirebaseService.getDocuments('myCollection');
        setData(result);
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      }
    };

    loadData();

    // 실시간 구독
    const unsubscribe = FirebaseService.subscribeToCollection('myCollection', (newData) => {
      setData(newData);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>
      {data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
};
```

## 🔒 보안 고려사항

1. **API 키 보안**: 프로덕션에서는 환경 변수 사용
2. **Firestore 보안 규칙**: 적절한 읽기/쓰기 권한 설정
3. **Authentication**: 사용자 인증 후 데이터 접근 제한

## 📚 추가 리소스

- [Firebase 공식 문서](https://firebase.google.com/docs)
- [Firestore 가이드](https://firebase.google.com/docs/firestore)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Cloud Storage](https://firebase.google.com/docs/storage)

---

✅ Firebase SDK 초기화가 완료되었습니다! 이제 위의 예제들을 참고하여 Firebase 기능을 사용할 수 있습니다. 