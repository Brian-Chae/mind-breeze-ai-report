import { useState, useEffect, useCallback } from 'react';

// PWA 관련 타입 정의
interface ServiceWorkerRegistration {
  update: () => void;
}

interface PWARegisterOptions {
  onRegistered?: (registration: ServiceWorkerRegistration | null) => void;
  onRegisterError?: (error: any) => void;
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
}

interface PWARegisterReturn {
  needRefresh: boolean;
  offlineReady: boolean;
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
}

// virtual:pwa-register/react 모듈 fallback
const useRegisterSW = (options: PWARegisterOptions): PWARegisterReturn => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);

  useEffect(() => {
    // PWA가 비활성화된 상태에서는 Service Worker 등록을 시도하지 않음
    if ('serviceWorker' in navigator) {
      // sw.js 파일이 존재하는지 먼저 확인
      fetch('/sw.js', { method: 'HEAD' })
        .then((response) => {
          if (response.ok && response.headers.get('content-type')?.includes('javascript')) {
            // sw.js가 올바른 JavaScript 파일인 경우에만 등록 시도
            return navigator.serviceWorker.register('/sw.js');
          } else {
            throw new Error('Service Worker not available or PWA disabled');
          }
        })
        .then((registration) => {
          options.onRegistered?.(registration);
          
          // 업데이트 확인
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setNeedRefresh(true);
                  options.onNeedRefresh?.();
                }
              });
            }
          });
        })
        .catch((error) => {
          // PWA가 비활성화된 경우 에러를 무시
          console.log('Service Worker registration skipped (PWA disabled):', error.message);
        });

      // 오프라인 상태 확인
      if (!navigator.onLine) {
        setOfflineReady(true);
        options.onOfflineReady?.();
      }
    }
  }, []);

  const updateServiceWorker = async (reloadPage = false) => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        if (reloadPage) {
          window.location.reload();
        }
      }
    }
  };

  return {
    needRefresh,
    offlineReady,
    updateServiceWorker
  };
};

interface PWAUpdateState {
  needRefresh: boolean;
  offlineReady: boolean;
  updateAvailable: boolean;
  isUpdating: boolean;
}

export const usePWAUpdate = () => {
  const [updateState, setUpdateState] = useState<PWAUpdateState>({
    needRefresh: false,
    offlineReady: false,
    updateAvailable: false,
    isUpdating: false
  });

  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [lastUpdateCheck, setLastUpdateCheck] = useState<number>(0);

  const {
    needRefresh,
    offlineReady,
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | null) {
      console.log('SW Registered: ' + r);
      // 등록 후 주기적으로 업데이트 확인
      if (r) {
        setInterval(() => {
          r.update();
        }, 60000); // 1분마다 업데이트 확인
      }
    },
    onRegisterError(error: any) {
      console.log('SW registration error', error);
    },
    onNeedRefresh() {
      console.log('New version available');
      setUpdateState(prev => ({ 
        ...prev, 
        needRefresh: true, 
        updateAvailable: true 
      }));
      setShowUpdateNotification(true);
    },
    onOfflineReady() {
      console.log('App ready to work offline');
      setUpdateState(prev => ({ 
        ...prev, 
        offlineReady: true 
      }));
    },
  });

  // 버전 체크 함수
  const checkForUpdates = useCallback(async () => {
    const now = Date.now();
    
    // 마지막 체크로부터 30초 이상 지났을 때만 체크
    if (now - lastUpdateCheck < 30000) {
      return;
    }
    
    setLastUpdateCheck(now);
    
    try {
      // 현재 빌드 타임스탬프 확인
      const currentTimestamp = document.querySelector('meta[name="build-timestamp"]')?.getAttribute('content');
      
      if (currentTimestamp) {
        // 서버에서 최신 빌드 타임스탬프 확인
        const response = await fetch(`/index.html?t=${now}`, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (response.ok) {
          const html = await response.text();
          const serverTimestampMatch = html.match(/name="build-timestamp" content="([^"]+)"/);
          
          if (serverTimestampMatch && serverTimestampMatch[1] !== currentTimestamp) {
            console.log('New version detected:', serverTimestampMatch[1], 'vs current:', currentTimestamp);
            setUpdateState(prev => ({ 
              ...prev, 
              needRefresh: true, 
              updateAvailable: true 
            }));
            setShowUpdateNotification(true);
          }
        }
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  }, [lastUpdateCheck]);

  // 업데이트 실행
  const performUpdate = useCallback(async () => {
    setUpdateState(prev => ({ ...prev, isUpdating: true }));
    setShowUpdateNotification(false);
    
    try {
      await updateServiceWorker(true);
      
      // 추가 캐시 클리어
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      // 페이지 새로고침
      window.location.reload();
    } catch (error) {
      console.error('Update failed:', error);
      setUpdateState(prev => ({ ...prev, isUpdating: false }));
      setShowUpdateNotification(true);
    }
  }, [updateServiceWorker]);

  // 업데이트 알림 닫기
  const dismissUpdate = useCallback(() => {
    setShowUpdateNotification(false);
    setUpdateState(prev => ({ ...prev, needRefresh: false }));
  }, []);

  // 페이지 포커스 시 업데이트 확인
  useEffect(() => {
    const handleFocus = () => {
      checkForUpdates();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkForUpdates();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 초기 체크
    checkForUpdates();

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkForUpdates]);

  return {
    ...updateState,
    showUpdateNotification,
    performUpdate,
    dismissUpdate,
    checkForUpdates
  };
}; 