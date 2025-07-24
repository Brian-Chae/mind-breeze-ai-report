import React from 'react'
import { Menu, Bell, User, LogOut } from 'lucide-react'
import { useAdminConfig } from '../../core/hooks/useAdminConfig'
import enterpriseAuthService from '../../../services/EnterpriseAuthService'
import { UserType } from '@core/types/unified'

interface AdminHeaderProps {
  onToggleSidebar: () => void
  isSidebarOpen: boolean
  type: 'system' | 'organization'
}

export function AdminHeader({ onToggleSidebar, isSidebarOpen, type }: AdminHeaderProps) {
  const { userType, organizationName } = useAdminConfig()
  const currentContext = enterpriseAuthService.getCurrentContext()

  const handleLogout = async () => {
    try {
      await enterpriseAuthService.signOut()
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Left side */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-semibold text-gray-900">
            {type === 'system' ? '시스템 관리' : '조직 관리'}
          </h2>
          {organizationName && type === 'organization' && (
            <>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">{organizationName}</span>
            </>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg relative">
          <Bell className="w-5 h-5" />
          {/* Notification badge */}
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
        </button>

        {/* User menu */}
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              {currentContext.user?.displayName || 'Unknown User'}
            </p>
            <p className="text-xs text-gray-500">
              {userType === UserType.SYSTEM_ADMIN ? '시스템 관리자' : 
               userType === UserType.ORGANIZATION_ADMIN ? '조직 관리자' : '조직 구성원'}
            </p>
          </div>
          
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-600" />
          </div>

          <button
            onClick={handleLogout}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
            title="로그아웃"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}