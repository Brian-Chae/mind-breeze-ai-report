'use client'

import React, { useState, useEffect } from 'react'
import { Sidebar } from './components/layout/Sidebar'
import { StatusBar } from './components/layout/StatusBar'
import Dashboard from './components/Dashboard/Dashboard'
import { DeviceManager } from './components/DeviceManager'
import { DataCenter } from './components/DataCenter'
import { Visualizer } from './components/Visualizer'
import Documents from './components/Documents'
import { Applications } from './components/Applications'
import { Settings } from './components/Settings'
import { WelcomeScreen } from './components/WelcomeScreen'
import { LandingPage } from './components/LandingPage'
import { useUIStore } from './stores/uiStore'
import { useSystemStore } from './stores/systemStore'
import { useStorageStore } from './stores/storageStore'
import { Toaster } from './components/ui/sonner'
import { usePWAUpdate } from './hooks/usePWAUpdate'
import UpdateNotification from './components/PWA/UpdateNotification'
import type { MenuId } from './stores/uiStore'

type AppMode = 'landing' | 'app'

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>('landing')
  const [showWelcome, setShowWelcome] = useState(true)
  const { activeMenu, setActiveMenu } = useUIStore()
  const { initializeSystem, isInitialized, systemStatus, systemError } = useSystemStore()
  const { checkAndRestoreStorage, initializeStorage } = useStorageStore()
  
  // PWA 업데이트 시스템
  const {
    showUpdateNotification,
    performUpdate,
    dismissUpdate,
    isUpdating
  } = usePWAUpdate()

  // PWA 바로가기 처리
  useEffect(() => {
    const handleShortcut = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const shortcut = urlParams.get('shortcut')
      
      if (shortcut) {
        // URL 파라미터 제거 (브라우저 히스토리 정리)
        const url = new URL(window.location.href)
        url.searchParams.delete('shortcut')
        window.history.replaceState({}, '', url.toString())
        
        // 바로가기에 따른 메뉴 설정
        let targetMenu: MenuId = 'engine' // 기본값
        
        switch (shortcut) {
          case 'dashboard':
            targetMenu = 'engine'
            break
          case 'datacenter':
            targetMenu = 'datacenter'
            break
          case 'visualizer':
            targetMenu = 'visualizer'
            break
          case 'device':
            targetMenu = 'linkband'
            break
          default:
            targetMenu = 'engine'
        }
        
        // 메뉴 변경
        setActiveMenu(targetMenu)
        
        // 바로가기로 실행된 경우 환영 화면 스킵
        setShowWelcome(false)
        
        console.log(`🚀 PWA 바로가기 실행: ${shortcut} -> ${targetMenu}`)
      }
    }
    
    // 페이지 로드 시 바로가기 처리
    handleShortcut()
  }, [setActiveMenu])

  // 🔧 SystemControlService 및 Storage 초기화
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🔧 App 시작 - SystemControlService 초기화 중...')
        await initializeSystem()
        console.log('🔧 SystemControlService 초기화 완료')
        
        // 저장소 복원 시도
        console.log('🔧 App 시작 - 저장소 복원 시도 중...')
        const storageRestored = await checkAndRestoreStorage()
        if (storageRestored) {
          console.log('🔧 저장소 자동 복원 완료')
        } else {
          console.log('🔧 저장소 복원 실패 또는 저장된 저장소 없음')
          // 저장소 기본 초기화만 수행
          await initializeStorage()
          console.log('🔧 저장소 기본 초기화 완료')
        }
      } catch (error) {
        console.error('🔧 App 초기화 실패:', error)
      }
    }

    if (!isInitialized && systemStatus === 'idle') {
      initializeApp()
    }
  }, [initializeSystem, isInitialized, systemStatus, checkAndRestoreStorage, initializeStorage])

  const handleNavigate = (page: string) => {
    if (page === 'app' || page === 'home') {
      setAppMode('app')
      setShowWelcome(false)
    } else if (page === 'landing') {
      setAppMode('landing')
    }
  }

  const renderContent = () => {
    switch (activeMenu) {
      case 'engine':
        return <Dashboard />
      case 'linkband':
        return <DeviceManager />
      case 'visualizer':
        return <Visualizer />
      case 'datacenter':
        return <DataCenter />
      case 'cloudmanager':
        return <Documents />
      case 'applications':
        return <Applications />
      case 'settings':
        return <Settings />
      default:
        return <Dashboard />
    }
  }

  // 랜딩 페이지 모드
  if (appMode === 'landing') {
    return <LandingPage onNavigate={handleNavigate} />
  }

  if (showWelcome) {
    return <WelcomeScreen onComplete={() => setShowWelcome(false)} />
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
    )
  }

  if (systemStatus === 'error') {
    return (
      <div className="dark h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">시스템 초기화 실패</p>
          <p className="text-muted-foreground text-sm">{systemError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dark h-screen bg-background flex flex-col">
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {renderContent()}
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
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  업데이트 중
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  잠시만 기다려 주세요...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Toaster position="top-right" />
    </div>
  )
}
