# 시스템 요구사항

Link Band SDK Web은 웹 기반 플랫폼으로 설계되어 최소한의 시스템 요구사항으로 다양한 환경에서 실행할 수 있습니다.

## 🌐 지원 브라우저

### 권장 브라우저
| 브라우저 | 최소 버전 | 권장 버전 | Web Bluetooth 지원 |
|----------|-----------|-----------|-------------------|
| **Google Chrome** | 80+ | 최신 버전 | ✅ 완전 지원 |
| **Microsoft Edge** | 80+ | 최신 버전 | ✅ 완전 지원 |
| **Opera** | 67+ | 최신 버전 | ✅ 완전 지원 |

### 제한적 지원
| 브라우저 | 최소 버전 | 제한사항 | 대안 |
|----------|-----------|----------|------|
| **Firefox** | 85+ | Web Bluetooth 미지원 | USB 연결 사용 |
| **Safari** | 14+ | Web Bluetooth 제한적 | macOS 앱 사용 권장 |

> **⚠️ 중요**: LINK BAND 디바이스 연결을 위해서는 **Web Bluetooth API**가 필요합니다. Chrome, Edge, Opera 브라우저 사용을 강력히 권장합니다.

## 💻 운영체제 요구사항

### Windows
- **최소**: Windows 10 (1903 이상)
- **권장**: Windows 11
- **Bluetooth**: Bluetooth 4.0+ (LE 지원)

### macOS
- **최소**: macOS 10.15 (Catalina)
- **권장**: macOS 12+ (Monterey 이상)
- **Bluetooth**: 내장 Bluetooth 4.0+

### Linux
- **최소**: Ubuntu 18.04+ 또는 동등한 배포판
- **권장**: Ubuntu 20.04+
- **Bluetooth**: BlueZ 5.50+

### 모바일
- **Android**: Android 8.0+ (Chrome 브라우저)
- **iOS**: iOS 14.5+ (제한적 지원)

## 🔧 하드웨어 요구사항

### 최소 사양
- **CPU**: 듀얼코어 1.5GHz 이상
- **RAM**: 4GB 이상
- **저장공간**: 1GB 여유 공간 (브라우저 캐시)
- **Bluetooth**: Bluetooth 4.0+ (BLE 지원)
- **인터넷**: 브로드밴드 연결 (초기 로딩)

### 권장 사양
- **CPU**: 쿼드코어 2.0GHz 이상
- **RAM**: 8GB 이상
- **저장공간**: 5GB 여유 공간
- **Bluetooth**: Bluetooth 5.0+
- **인터넷**: 고속 브로드밴드 연결

### 고성능 사양 (대용량 데이터 처리)
- **CPU**: 옥타코어 3.0GHz 이상
- **RAM**: 16GB 이상
- **저장공간**: 10GB+ 여유 공간
- **GPU**: 하드웨어 가속 지원
- **인터넷**: 기가비트 연결

## 📡 네트워크 요구사항

### 인터넷 연결
- **초기 로딩**: 10Mbps 이상 권장
- **실시간 사용**: 1Mbps 이상 (오프라인 모드 지원)
- **데이터 동기화**: 5Mbps 이상 권장

### 방화벽 설정
다음 포트들이 열려있어야 합니다:
- **HTTPS**: 443 (웹 애플리케이션 로딩)
- **WebSocket**: 443 (실시간 데이터 스트리밍)

## 🔒 보안 요구사항

### HTTPS 필수
- 모든 통신은 HTTPS를 통해 암호화
- 안전하지 않은 HTTP 연결은 차단
- 유효한 SSL 인증서 필요

### 권한 설정
브라우저에서 다음 권한이 필요합니다:
- **Bluetooth**: 디바이스 연결
- **저장공간**: 로컬 데이터 저장
- **알림**: 상태 알림 (선택적)

## 🔍 호환성 확인

### 브라우저 기능 확인
다음 기능들이 지원되는지 확인하세요:

```javascript
// Web Bluetooth API 지원 확인
if ('bluetooth' in navigator) {
  console.log('✅ Web Bluetooth 지원됨');
} else {
  console.log('❌ Web Bluetooth 미지원');
}

// Service Worker 지원 확인
if ('serviceWorker' in navigator) {
  console.log('✅ Service Worker 지원됨');
} else {
  console.log('❌ Service Worker 미지원');
}

// WebAssembly 지원 확인
if (typeof WebAssembly === 'object') {
  console.log('✅ WebAssembly 지원됨');
} else {
  console.log('❌ WebAssembly 미지원');
}
```

### 자동 호환성 검사
웹 애플리케이션 첫 실행 시 자동으로 시스템 호환성을 검사합니다:
- 브라우저 버전 확인
- Web Bluetooth API 지원 여부
- 필요한 권한 상태 확인
- 네트워크 연결 상태 확인

## 🚨 문제 해결

### 일반적인 문제들

**Web Bluetooth 연결 실패**
- Chrome 브라우저 최신 버전으로 업데이트
- HTTPS 연결 확인 (HTTP에서는 동작하지 않음)
- 브라우저 Bluetooth 권한 확인

**성능 저하**
- 브라우저 캐시 정리
- 다른 탭 닫기 (메모리 확보)
- 하드웨어 가속 활성화

**연결 끊김**
- Bluetooth 드라이버 업데이트
- 디바이스 재시작
- 브라우저 재시작

## ✅ 시스템 준비 체크리스트

시작하기 전에 다음 항목들을 확인하세요:

- [ ] Chrome/Edge/Opera 브라우저 설치 및 최신 버전 업데이트
- [ ] Bluetooth 4.0+ 지원 확인
- [ ] 인터넷 연결 상태 양호
- [ ] 브라우저 Bluetooth 권한 허용
- [ ] LINK BAND 디바이스 충전 상태 확인
- [ ] 방화벽 설정 확인

> **다음 단계**: 시스템 요구사항을 모두 만족한다면 [첫 번째 연결](first-connection.md)로 진행하세요! 