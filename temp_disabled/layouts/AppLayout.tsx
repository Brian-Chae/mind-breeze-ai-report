import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../layout/Sidebar';
import { StatusBar } from '../layout/StatusBar';
import { WelcomeScreen } from '../WelcomeScreen';
import { useUIStore } from '../../stores/uiStore';
import { useSystemStore } from '../../stores/systemStore';
import { useStorageStore } from '../../stores/storageStore';
import { Toaster } from '../ui/sonner';
import { usePWAUpdate } from '../../hooks/usePWAUpdate';
import UpdateNotification from '../PWA/UpdateNotification';

export const AppLayout = () => {
  const [showWelcome, setShowWelcome] = useState(false); // 로그인 후에는 환영 화면 스킵
  const location = useLocation();
  const { setActiveMenu } = useUIStore();
  const { initializeSystem, isInitialized, systemStatus, systemError } = useSystemStore();
  const { checkAndRestoreStorage, initializeStorage } = useStorageStore();
  
  // PWA 업데이트 시스템
  const {
    showUpdateNotification,
    performUpdate,
    dismissUpdate,
    isUpdating
  } = usePWAUpdate();

  // 경로에 따른 메뉴 설정
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/dashboard')) {
      setActiveMenu('engine');
    } else if (path.includes('/device')) {
      setActiveMenu('linkband');
    } else if (path.includes('/visualizer')) {
      setActiveMenu('visualizer');
    } else if (path.includes('/datacenter')) {
      setActiveMenu('datacenter');
    } else if (path.includes('/documents')) {
      setActiveMenu('cloudmanager');
    } else if (path.includes('/applications')) {
      setActiveMenu('applications');
    } else if (path.includes('/settings')) {
      setActiveMenu('settings');
    }
  }, [location.pathname, setActiveMenu]);

  // PWA 바로가기 처리
  useEffect(() => {
    const handleShortcut = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const shortcut = urlParams.get('shortcut');
      
      if (shortcut) {
        // URL 파라미터 제거 (브라우저 히스토리 정리)
        const url = new URL(window.location.href);
        url.searchParams.delete('shortcut');
        window.history.replaceState({}, '', url.toString());
        
        // 바로가기로 실행된 경우 환영 화면 스킵
        setShowWelcome(false);
        
        console.log(`🚀 PWA 바로가기 실행: ${shortcut}`);
      }
    };
    
    // 페이지 로드 시 바로가기 처리
    handleShortcut();
  }, []);

  // 🔧 SystemControlService 및 Storage 초기화
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🔧 App 시작 - SystemControlService 초기화 중...');
        await initializeSystem();
        console.log('🔧 SystemControlService 초기화 완료');
        
        // 저장소 복원 시도
        console.log('🔧 App 시작 - 저장소 복원 시도 중...');
        const storageRestored = await checkAndRestoreStorage();
        if (storageRestored) {
          console.log('🔧 저장소 자동 복원 완료');
        } else {
          console.log('🔧 저장소 복원 실패 또는 저장된 저장소 없음');
          // 저장소 기본 초기화만 수행
          await initializeStorage();
          console.log('🔧 저장소 기본 초기화 완료');
        }
      } catch (error) {
        console.error('🔧 App 초기화 실패:', error);
      }
    };

    if (!isInitialized && systemStatus === 'idle') {
      initializeApp();
    }
  }, [initializeSystem, isInitialized, systemStatus, checkAndRestoreStorage, initializeStorage]);

  if (showWelcome) {
    return <WelcomeScreen onComplete={() => setShowWelcome(false)} />;
  }

  // 🔧 시스템 초기화 상태 표시
  if (systemStatus === 'initializing') {
    return (
      <div className="dark h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">시스템 초기화 중...</p>
        </div>
      </div>
    );
  }

  if (systemStatus === 'error') {
    return (
      <div className="dark h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">시스템 초기화 실패</p>
          <p className="text-muted-foreground text-sm">{systemError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dark h-screen bg-background flex flex-col fixed inset-0">
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <div className="flex-shrink-0">
        <StatusBar />
      </div>
      
      {/* PWA 업데이트 알림 */}
      <UpdateNotification
        isVisible={showUpdateNotification}
        onUpdate={performUpdate}
        onDismiss={dismissUpdate}
      />
      
      {/* 업데이트 중 오버레이 */}
      {isUpdating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-sm">업데이트 중...</span>
            </div>
          </div>
        </div>
      )}
      
      <Toaster />
    </div>
  );
}; 