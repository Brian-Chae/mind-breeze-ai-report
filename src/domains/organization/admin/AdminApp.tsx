import React, { useMemo } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAdminConfig } from './core/hooks/useAdminConfig'
import { PermissionGuard } from './core/guards/PermissionGuard'
import { AdminLayout } from './components/layout/AdminLayout'
import { DashboardPage } from './pages/DashboardPage'
import { OrganizationsPage } from './pages/OrganizationsPage'
import { DevicesPage } from './pages/DevicesPage'
import { UsersPage } from './pages/UsersPage'
import { ReportsPage } from './pages/ReportsPage'
import { SystemPage } from './pages/SystemPage'
import { UserType, Permission } from './core/types/AdminTypes'

interface AdminAppProps {
  type: 'system' | 'organization'
}

interface RouteConfig {
  path: string
  element: React.ReactElement
  permissions: Permission[]
  title: string
}

export default function AdminApp({ type }: AdminAppProps) {
  const { userType, permissions, availableMenus } = useAdminConfig()

  // 타입에 따른 기본 경로 설정
  const basePath = type === 'system' ? '/sys-admin' : '/org-admin'

  // 라우트 설정
  const routes: RouteConfig[] = useMemo(() => {
    const baseRoutes: RouteConfig[] = [
      {
        path: 'dashboard',
        element: <DashboardPage />,
        permissions: [Permission.READ_ORGANIZATIONS],
        title: '대시보드'
      },
      {
        path: 'organizations',
        element: <OrganizationsPage />,
        permissions: [Permission.READ_ORGANIZATIONS],
        title: '조직 관리'
      },
      {
        path: 'devices',
        element: <DevicesPage />,
        permissions: [Permission.READ_DEVICES],
        title: '디바이스 관리'
      },
      {
        path: 'users',
        element: <UsersPage />,
        permissions: [Permission.READ_USERS],
        title: '사용자 관리'
      },
      {
        path: 'reports',
        element: <ReportsPage />,
        permissions: [Permission.READ_REPORTS],
        title: '리포트 관리'
      }
    ]

    // 시스템 관리자 전용 라우트
    if (type === 'system') {
      baseRoutes.push({
        path: 'system',
        element: <SystemPage />,
        permissions: [Permission.SYSTEM_ADMIN],
        title: '시스템 설정'
      })
    }

    // 권한에 따른 필터링
    return baseRoutes.filter(route => 
      route.permissions.every(permission => permissions.includes(permission))
    )
  }, [type, permissions])

  // 사용자 타입 확인
  const isAuthorized = useMemo(() => {
    if (type === 'system' && userType !== UserType.SYSTEM_ADMIN) {
      return false
    }
    if (type === 'organization' && ![UserType.ORGANIZATION_ADMIN, UserType.ORGANIZATION_MEMBER].includes(userType)) {
      return false
    }
    return true
  }, [type, userType])

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">접근 권한이 없습니다</h1>
          <p className="text-gray-600">이 페이지에 접근할 권한이 없습니다.</p>
        </div>
      </div>
    )
  }


  return (
    <AdminLayout type={type} basePath={basePath}>
      <Routes>
        {/* 기본 경로는 대시보드로 리다이렉트 */}
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        
        {/* 동적 라우트 생성 */}
        {routes.map(route => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <PermissionGuard permission={route.permissions}>
                {route.element}
              </PermissionGuard>
            }
          />
        ))}
        
        {/* 404 처리 */}
        <Route path="*" element={
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">페이지를 찾을 수 없습니다</h1>
              <p className="text-gray-600">요청하신 페이지가 존재하지 않습니다.</p>
            </div>
          </div>
        } />
      </Routes>
    </AdminLayout>
  )
}