import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface InstallPromptProps {
  variant?: 'popup' | 'button';
  className?: string;
}

export default function InstallPrompt({ variant = 'popup', className = '' }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // PWA 설치 상태 확인
    const checkInstalled = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                              (window.navigator as any).standalone ||
                              document.referrer.includes('android-app://');
      setIsInstalled(isStandaloneMode);
    };

    checkInstalled();

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (variant === 'popup') {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', checkInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', checkInstalled);
    };
  }, [variant]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // 수동 설치 안내 (iOS Safari 등)
      showManualInstallGuide();
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {

        setIsInstalled(true);
      } else {

      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.warn('설치 프롬프트 실행 중 오류:', error);
      // 프롬프트가 이미 사용되었거나 사용할 수 없는 경우 수동 설치 안내
      showManualInstallGuide();
    }
  };

  const showManualInstallGuide = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent);
    
    let message = '';
    if (isIOS && isSafari) {
      message = '📱 iOS Safari에서 설치하기:\n\n1. 화면 하단의 공유 버튼(⬆️)을 누르세요\n2. "홈 화면에 추가"를 선택하세요\n3. "추가"를 누르면 설치 완료!\n\n설치 후 홈 화면에서 LINK BAND SDK 앱 아이콘을 찾을 수 있어요.';
    } else if (isChrome) {
      message = '💻 Chrome에서 설치하기:\n\n1. 주소창 오른쪽의 설치 아이콘(⬇️)을 클릭하거나\n2. 브라우저 메뉴(⋮) → "앱 설치"를 선택하세요\n3. "설치" 버튼을 누르면 완료!\n\n설치 후 데스크톱이나 앱 목록에서 LINK BAND SDK를 찾을 수 있어요.';
    } else {
      message = '🌐 브라우저에서 설치하기:\n\n브라우저 메뉴에서 "홈 화면에 추가" 또는 "앱 설치"를 선택하세요.\n\n설치 후 홈 화면이나 앱 목록에서 LINK BAND SDK를 찾을 수 있어요.';
    }
    
    if (confirm(`LINK BAND SDK 앱 설치 방법:\n\n${message}\n\n지금 설치 방법을 확인하셨나요?`)) {
      // 사용자가 확인했으면 페이지 새로고침하여 설치 프롬프트 다시 시도
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
  };

  // 이미 설치된 경우 표시하지 않음
  if (isInstalled) {
    return null;
  }

  // 버튼 변형
  if (variant === 'button') {
    return (
      <button
        onClick={handleInstall}
        className={`group relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative flex items-center justify-center space-x-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-xl">📱</span>
          </div>
          <div className="text-left">
            <div className="text-lg font-bold">앱 설치하기</div>
            <div className="text-sm opacity-90">홈 화면에 추가하여 더 빠르게 사용하세요</div>
          </div>
        </div>
      </button>
    );
  }

  // 팝업 변형
  if (!showInstallPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-6 backdrop-blur-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-xl">🧠</span>
            </div>
          </div>
          
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-bold text-gray-900">
              LINK BAND SDK 설치
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              앱을 설치하면 더 빠른 성능과 오프라인에서도 EEG 데이터에 접근할 수 있어요.
            </p>
            
            <div className="mt-4 flex space-x-3">
              <button
                onClick={handleInstall}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md"
              >
                설치하기
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-medium rounded-lg transition-colors duration-200"
              >
                나중에
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 