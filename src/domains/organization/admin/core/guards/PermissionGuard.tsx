/**
 * 권한 가드 컴포넌트
 * 
 * 특정 권한이 있는 사용자에게만 컨텐츠를 표시합니다.
 * 권한이 없는 경우 fallback 컨텐츠를 표시하거나 숨깁니다.
 */

import React, { useMemo } from 'react'
import { Permission } from '../types/AdminTypes'
import { useAdminConfig } from '../hooks/useAdminConfig'
import { Alert, AlertDescription } from '@ui/alert'
import { Lock } from 'lucide-react'

interface PermissionGuardProps {
  // 필요한 권한 (단일 또는 배열)
  permission: Permission | Permission[]
  // 권한이 없을 때 표시할 컨텐츠
  fallback?: React.ReactNode
  // 권한이 없을 때 숨길지 여부 (fallback이 없을 때만 적용)
  hideWhenUnauthorized?: boolean
  // 자식 컴포넌트
  children: React.ReactNode
}

export function PermissionGuard({ 
  permission, 
  fallback, 
  hideWhenUnauthorized = false,
  children 
}: PermissionGuardProps) {
  const { hasPermission, userType } = useAdminConfig()
  
  const isAuthorized = useMemo(() => {
    return hasPermission(permission)
  }, [hasPermission, permission])
  
  if (!isAuthorized) {
    // fallback이 제공된 경우 fallback 표시
    if (fallback) {
      return <>{fallback}</>
    }
    
    // hideWhenUnauthorized가 true면 아무것도 표시하지 않음
    if (hideWhenUnauthorized) {
      return null
    }
    
    // 기본 권한 없음 메시지
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <Lock className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          이 기능에 대한 권한이 없습니다.
          {userType === 'ORGANIZATION_MEMBER' && (
            <span className="block text-sm mt-1">
              관리자에게 권한을 요청하세요.
            </span>
          )}
        </AlertDescription>
      </Alert>
    )
  }
  
  return <>{children}</>
}

// 기능 접근 가드 컴포넌트
interface FeatureGuardProps {
  feature: string
  fallback?: React.ReactNode
  hideWhenUnauthorized?: boolean
  children: React.ReactNode
}

export function FeatureGuard({
  feature,
  fallback,
  hideWhenUnauthorized = false,
  children
}: FeatureGuardProps) {
  const { canAccessFeature } = useAdminConfig()
  
  const canAccess = useMemo(() => {
    return canAccessFeature(feature)
  }, [canAccessFeature, feature])
  
  if (!canAccess) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    if (hideWhenUnauthorized) {
      return null
    }
    
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <Lock className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          이 기능은 현재 사용할 수 없습니다.
        </AlertDescription>
      </Alert>
    )
  }
  
  return <>{children}</>
}

// 조건부 렌더링을 위한 편의 컴포넌트
interface ConditionalRenderProps {
  condition: boolean
  fallback?: React.ReactNode
  hideWhenFalse?: boolean
  children: React.ReactNode
}

export function ConditionalRender({
  condition,
  fallback,
  hideWhenFalse = false,
  children
}: ConditionalRenderProps) {
  if (!condition) {
    if (fallback) return <>{fallback}</>
    if (hideWhenFalse) return null
    return null
  }
  
  return <>{children}</>
}

// 다중 권한 체크 컴포넌트 (AND 조건)
interface MultiPermissionGuardProps {
  permissions: Permission[]
  fallback?: React.ReactNode
  hideWhenUnauthorized?: boolean
  children: React.ReactNode
}

export function MultiPermissionGuard({
  permissions,
  fallback,
  hideWhenUnauthorized = false,
  children
}: MultiPermissionGuardProps) {
  return (
    <PermissionGuard
      permission={permissions}
      fallback={fallback}
      hideWhenUnauthorized={hideWhenUnauthorized}
    >
      {children}
    </PermissionGuard>
  )
}

// 다중 권한 체크 컴포넌트 (OR 조건)
interface AnyPermissionGuardProps {
  permissions: Permission[]
  fallback?: React.ReactNode
  hideWhenUnauthorized?: boolean
  children: React.ReactNode
}

export function AnyPermissionGuard({
  permissions,
  fallback,
  hideWhenUnauthorized = false,
  children
}: AnyPermissionGuardProps) {
  const { hasPermission } = useAdminConfig()
  
  const isAuthorized = useMemo(() => {
    return permissions.some(permission => hasPermission(permission))
  }, [hasPermission, permissions])
  
  if (!isAuthorized) {
    if (fallback) return <>{fallback}</>
    if (hideWhenUnauthorized) return null
    
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <Lock className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          이 기능에 대한 권한이 없습니다.
        </AlertDescription>
      </Alert>
    )
  }
  
  return <>{children}</>
}