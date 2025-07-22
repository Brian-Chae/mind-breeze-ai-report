import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import '@core/services/firebase' // Firebase 초기화
import { AuthProvider } from './components/AuthProvider'

// AI 리포트 시스템 초기화
import { initializeAIReportSystem } from '@domains/ai-report'

// 시스템 초기화
try {
  initializeAIReportSystem();
} catch (error) {
  console.error('Failed to initialize AI Report System:', error);
}

// 개발 환경 전역 함수 추가
if (process.env.NODE_ENV === 'development') {
  // 개발 도구 로드
  import('./utils/dev-tools');
  // @ts-ignore
  window.addDevCredits = async (amount = 99999999999999) => {
    try {
      const { default: creditManagementService } = await import('@domains/organization/services/CreditManagementService');
      const { default: enterpriseAuthService } = await import('@domains/organization/services/EnterpriseAuthService');
      
      const currentContext = enterpriseAuthService.getCurrentContext();
      if (!currentContext.user) {
        console.error('로그인된 사용자가 없습니다.');
        return;
      }

             await creditManagementService.addCredits({
        organizationId: currentContext.user.organizationId,
        userId: currentContext.user.id,
        amount,
        description: `개발용 크레딧 수동 추가 (${amount} 크레딧)`,
        purchaseType: 'BONUS'
      });
      
      console.log(`🚀 개발용 크레딧 ${amount.toLocaleString()}개가 추가되었습니다!`);
    } catch (error) {
      console.error('❌ 개발용 크레딧 추가 실패:', error);
    }
  };

  // @ts-ignore
  window.initTestData = async () => {
    try {
      const { TestDataInitializer } = await import('./utils/TestDataInitializer');
      await TestDataInitializer.initializeAllTestData();
      console.log('🎉 테스트 데이터 초기화 완료! 페이지를 새로고침하세요.');
    } catch (error) {
      console.error('❌ 테스트 데이터 초기화 실패:', error);
    }
  };

  // @ts-ignore  
  window.loginAsSystemAdmin = async () => {
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const { auth } = await import('@core/services/firebase');
      
      await signInWithEmailAndPassword(auth, 'admin@mindbreeze.ai', 'admin123456!');
      console.log('✅ 시스템 관리자로 로그인 완료!');
      window.location.reload();
    } catch (error) {
      console.error('❌ 시스템 관리자 로그인 실패:', error);
    }
  };
  
  console.log('🚀 개발 환경 감지: 개발용 함수들이 사용 가능합니다');
  console.log('   📊 initTestData() - 테스트 데이터 생성');
  console.log('   👤 loginAsSystemAdmin() - 시스템 관리자 로그인');
  console.log('   💳 addDevCredits(amount) - 크레딧 추가');
}

// Cache busting - 브라우저 캐시 강제 새로고침
const forceCacheRefresh = () => {
  // 빌드 타임스탬프 확인
  const buildTimestamp = document.querySelector('meta[name="build-timestamp"]')?.getAttribute('content');
  const storedTimestamp = localStorage.getItem('app-build-timestamp');
  
  if (buildTimestamp && buildTimestamp !== 'BUILD_TIMESTAMP_PLACEHOLDER') {
    if (storedTimestamp && storedTimestamp !== buildTimestamp) {
      console.log('🔄 New build detected, clearing cache...');
      // 캐시 클리어
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
          });
        });
      }
      // 로컬 스토리지 일부 클리어 (설정은 유지)
      const keysToPreserve = ['linkband-settings', 'linkband-storage-config'];
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (!keysToPreserve.some(preserve => key.includes(preserve))) {
          localStorage.removeItem(key);
        }
      });
    }
    // 새로운 빌드 타임스탬프 저장
    localStorage.setItem('app-build-timestamp', buildTimestamp);
  }
};

// 캐시 새로고침 실행
forceCacheRefresh();

ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  // </React.StrictMode>,
)
