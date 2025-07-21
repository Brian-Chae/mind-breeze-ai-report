import React from 'react'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { 
  Search,
  Bell,
  Settings,
  LogOut,
  User
} from 'lucide-react'
import { UnifiedAdminHeaderProps } from '../types/unified-admin'

/**
 * 통합 관리자 헤더 컴포넌트
 * 검색, 알림, 사용자 정보 등을 포함
 */
export const UnifiedAdminHeader: React.FC<UnifiedAdminHeaderProps> = ({
  currentSectionTitle,
  searchQuery,
  onSearchChange,
  onLogout,
  userInfo
}) => {
  const getUserRoleName = (userType: string) => {
    switch (userType) {
      case 'SYSTEM_ADMIN': return '시스템관리자'
      case 'ORGANIZATION_ADMIN': return '기업관리자'
      case 'ORGANIZATION_MEMBER': return '구성원'
      default: return '관리자'
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{currentSectionTitle}</h1>
            <p className="text-sm text-gray-700">MIND BREEZE AI 관리자 포털</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* 검색창 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="검색..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 w-64 text-gray-900 placeholder-gray-500"
            />
          </div>

          {/* 알림 버튼 */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5 text-gray-700" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </Button>

          {/* 설정 버튼 */}
          <Button variant="ghost" size="sm">
            <Settings className="w-5 h-5 text-gray-700" />
          </Button>

          {/* 사용자 정보 */}
          {userInfo && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center w-6 h-6 bg-gray-200 rounded-full">
                <User className="w-3 h-3 text-gray-600" />
              </div>
              <div className="text-sm">
                <div className="font-medium text-gray-900">
                  {userInfo.displayName || '관리자'}
                </div>
                <div className="text-xs text-gray-500">
                  {getUserRoleName(userInfo.userType)}
                </div>
              </div>
            </div>
          )}

          {/* 로그아웃 버튼 */}
          {onLogout && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onLogout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

export default UnifiedAdminHeader