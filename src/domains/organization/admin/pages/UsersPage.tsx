import React from 'react'
import { useAdminConfig } from '../core/hooks/useAdminConfig'
import { UserType } from '../core/types/AdminTypes'

// Import existing user management components
import UserManagementContent from '../../components/OrganizationAdmin/Dashboard/contents/UserManagementContent'
import { Users, UserPlus, Settings } from 'lucide-react'

export function UsersPage() {
  const { userType, organizationName } = useAdminConfig()

  // System admins get the full user management component
  if (userType === UserType.SYSTEM_ADMIN) {
    return <UserManagementContent />
  }

  // Organization admins and members get a simplified user management view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">사용자 관리</h1>
              <p className="text-gray-600">
                {organizationName || '조직'} 사용자를 관리합니다
              </p>
            </div>
          </div>
          {userType === 'ORGANIZATION_ADMIN' && (
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <UserPlus className="w-4 h-4" />
              사용자 초대
            </button>
          )}
        </div>
      </div>

      {/* User List Placeholder */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">사용자 목록</h2>
        </div>
        <div className="p-6">
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">사용자 데이터를 불러오는 중입니다...</p>
            <p className="text-sm text-gray-400">
              사용자 관리 기능이 곧 제공될 예정입니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}