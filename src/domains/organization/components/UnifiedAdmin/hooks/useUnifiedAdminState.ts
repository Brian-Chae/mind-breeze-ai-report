import { useState, useEffect, useCallback } from 'react'
import { UnifiedAdminState } from '../types/unified-admin'

/**
 * 통합 관리자 상태 관리 훅
 * 전체 관리자 앱의 공통 상태를 관리
 */
export const useUnifiedAdminState = () => {
  const [state, setState] = useState<UnifiedAdminState>({
    activeMenu: 'dashboard',
    searchQuery: '',
    systemHealth: 'healthy',
    notifications: {},
    isLoading: false,
    error: undefined
  })

  // 활성 메뉴 설정
  const setActiveMenu = useCallback((menuId: string) => {
    setState(prev => ({
      ...prev,
      activeMenu: menuId
    }))
  }, [])

  // 검색어 설정
  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({
      ...prev,
      searchQuery: query
    }))
  }, [])

  // 시스템 상태 설정
  const setSystemHealth = useCallback((health: 'healthy' | 'warning' | 'error') => {
    setState(prev => ({
      ...prev,
      systemHealth: health
    }))
  }, [])

  // 알림 설정
  const setNotifications = useCallback((notifications: Record<string, number>) => {
    setState(prev => ({
      ...prev,
      notifications
    }))
  }, [])

  // 로딩 상태 설정
  const setIsLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({
      ...prev,
      isLoading
    }))
  }, [])

  // 에러 설정
  const setError = useCallback((error?: string) => {
    setState(prev => ({
      ...prev,
      error
    }))
  }, [])

  // 상태 초기화
  const resetState = useCallback(() => {
    setState({
      activeMenu: 'dashboard',
      searchQuery: '',
      systemHealth: 'healthy',
      notifications: {},
      isLoading: false,
      error: undefined
    })
  }, [])

  // 시스템 상태 및 알림 정보 로드
  const loadSystemStatus = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(undefined)
      
      // 실제 API 호출 대신 임시 데이터 사용
      // Phase 2-3에서 실제 서비스 연결 예정
      await new Promise(resolve => setTimeout(resolve, 1000)) // 로딩 시뮬레이션
      
      setSystemHealth('healthy')
      setNotifications({
        credits: 3,     // 크레딧 부족 기업 수
        devices: 2,     // 주의 필요 디바이스 수
        enterprises: 1, // 주의 필요 기업 수
        users: 0,       // 주의 필요 사용자 수
        reports: 5      // 새 리포트 수
      })
      
    } catch (error) {
      console.error('시스템 상태 로드 실패:', error)
      setSystemHealth('error')
      setError('시스템 상태를 불러올 수 없습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [setIsLoading, setError, setSystemHealth, setNotifications])

  // 컴포넌트 마운트 시 시스템 상태 로드
  useEffect(() => {
    loadSystemStatus()
  }, [loadSystemStatus])

  // 주기적으로 시스템 상태 업데이트 (5분마다)
  useEffect(() => {
    const interval = setInterval(() => {
      loadSystemStatus()
    }, 5 * 60 * 1000) // 5분

    return () => clearInterval(interval)
  }, [loadSystemStatus])

  return {
    // 상태
    ...state,
    
    // 상태 변경 함수들
    setActiveMenu,
    setSearchQuery,
    setSystemHealth,
    setNotifications,
    setIsLoading,
    setError,
    resetState,
    
    // 액션 함수들
    loadSystemStatus
  }
}

export default useUnifiedAdminState