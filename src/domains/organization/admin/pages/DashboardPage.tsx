import React from 'react'
import { useAdminConfig } from '../core/hooks/useAdminConfig'
import { UserType } from '../core/types/AdminTypes'
import { LayoutDashboard, Users, Building2, Activity } from 'lucide-react'

// Import existing dashboard content components
import SystemDashboardContent from '../../components/OrganizationAdmin/Dashboard/contents/SystemDashboardContent'

export function DashboardPage() {
  const { userType, organizationName } = useAdminConfig()

  // For system admin, use existing component
  if (userType === UserType.SYSTEM_ADMIN) {
    return <SystemDashboardContent />
  }

  // For organization admin and members, create a simple dashboard
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
            <p className="text-gray-600">
              {organizationName || '조직'} 현황을 한눈에 확인하세요
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">사용자</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">디바이스</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">리포트</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-6 h-6 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">활성 세션</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">최근 활동</h2>
        <div className="text-center py-12">
          <LayoutDashboard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            대시보드 데이터를 불러오는 중입니다...
          </p>
        </div>
      </div>
    </div>
  )
}