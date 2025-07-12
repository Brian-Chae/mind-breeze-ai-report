# Firebase 설정 및 사용 가이드

## 🔥 Firebase 초기화 완료

Firebase SDK가 성공적으로 초기화되었습니다. 다음 파일들이 생성되었습니다:

### 📁 생성된 파일들

1. **`src/services/firebase.ts`** - Firebase 설정 및 초기화
2. **`src/services/FirebaseService.ts`** - Firebase 서비스 클래스
3. **`src/examples/FirebaseExample.tsx`** - 사용 예제 컴포넌트

## 🚀 사용 방법

### 1. Firebase 서비스 임포트

```typescript
import FirebaseService from '../services/FirebaseService';
```

### 2. 데이터 추가 (Create)

```typescript
// 문서 추가
const userId = await FirebaseService.addDocument('users', {
  name: '홍길동',
  email: 'hong@example.com',
  age: 30
});
```

### 3. 데이터 조회 (Read)

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

### 4. 데이터 수정 (Update)

```typescript
// 문서 수정
await FirebaseService.updateDocument('users', userId, {
  age: 31,
  lastLogin: new Date()
});
```

### 5. 데이터 삭제 (Delete)

```typescript
// 문서 삭제
await FirebaseService.deleteDocument('users', userId);
```

### 6. 실시간 데이터 구독

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
import FirebaseService from '../services/FirebaseService';

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

## 🔧 Firebase 콘솔 설정

1. **Firestore Database 활성화**
   - Firebase 콘솔에서 Firestore Database 생성
   - 보안 규칙 설정

2. **Authentication 설정**
   - 이메일/비밀번호 인증 활성화
   - 기타 인증 방법 설정 (Google, Facebook 등)

3. **Storage 설정**
   - Cloud Storage 활성화
   - 보안 규칙 설정

## 📋 예제 컴포넌트 사용법

생성된 예제 컴포넌트를 사용하려면:

```typescript
import FirebaseExample from './examples/FirebaseExample';

// App.tsx 또는 원하는 곳에서
<FirebaseExample />
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