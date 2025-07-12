/**
 * ApplicationRunner - 애플리케이션 실행 및 모드 관리 컴포넌트
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { ApplicationContextProvider } from './ApplicationContext';
import { ApplicationProps, ApplicationMode } from '../types';
import { StatusBar } from '../../../components/layout/StatusBar';
import { Button } from '../../../components/ui/button';

interface ApplicationRunnerProps {
  component: React.ComponentType<ApplicationProps>;
  initialMode?: ApplicationMode;
  onClose: () => void;
  className?: string;
}

export function ApplicationRunner({
  component: Component,
  initialMode = 'fullscreen',
  onClose,
  className = ''
}: ApplicationRunnerProps) {
  const [mode, setMode] = useState<ApplicationMode>(initialMode);
  const [showBackButton, setShowBackButton] = useState(false);
  const componentRef = useRef<any>(null);

  const handleModeChange = (newMode: ApplicationMode) => {
    setMode(newMode);
  };

  const handleBack = () => {
    // window 객체를 통해 back 함수 호출
    const appState = (window as any).__aiHealthReportAppState;
    if (appState && appState.handleBack) {
      appState.handleBack();
    }
  };

  // AI Health Report App의 상태 변화 감지
  useEffect(() => {
    const checkBackButtonState = () => {
      // window 객체를 통해 AI Health Report App의 상태 확인
      const appState = (window as any).__aiHealthReportAppState;
      if (appState) {
        setShowBackButton(appState.currentScreen && appState.currentScreen !== 'home');
      }
    };

    // 주기적으로 상태 체크 (간단한 polling 방식)
    const interval = setInterval(checkBackButtonState, 100);
    
    return () => clearInterval(interval);
  }, []);

  if (mode === 'fullscreen') {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        {/* Fullscreen Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gray-900 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-white">
              AI Health Report
            </h1>
            <span className="text-sm text-gray-400">
              전체화면 모드
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {showBackButton && (
              <Button
                onClick={handleBack}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                이전
              </Button>
            )}
            
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              aria-label="애플리케이션 닫기"
            >
              <X className="h-4 w-4" />
              <span className="text-sm">닫기</span>
            </button>
          </div>
        </div>

        {/* Fullscreen Content */}
        <div className="flex-1 overflow-auto bg-black">
          <ApplicationContextProvider
            mode={mode}
            onClose={onClose}
            onModeChange={handleModeChange}
          >
            <Component 
              context={{
                stores: {} as any, // Context에서 주입됨
                mode,
                onClose,
                onModeChange: handleModeChange
              }}
            />
          </ApplicationContextProvider>
        </div>

        {/* StatusBar at bottom */}
        <div className="flex-shrink-0">
          <StatusBar />
        </div>
      </div>
    );
  }

  // Widget 모드 (향후 구현)
  return (
    <div className={`bg-card border border-border rounded-lg shadow-lg ${className}`}>
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h2 className="text-sm font-medium text-foreground">AI Health Report</h2>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
          aria-label="위젯 닫기"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      <div className="p-4">
        <ApplicationContextProvider
          mode={mode}
          onClose={onClose}
          onModeChange={handleModeChange}
        >
          <Component 
            context={{
              stores: {} as any, // Context에서 주입됨
              mode,
              onClose,
              onModeChange: handleModeChange
            }}
          />
        </ApplicationContextProvider>
      </div>
    </div>
  );
} 