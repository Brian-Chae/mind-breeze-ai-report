import React from 'react'
import { Button } from '@shared/components/ui/button'
import { Badge } from '@shared/components/ui/badge'
import { ScrollArea } from '@shared/components/ui/scroll-area'
import { 
  LogOut,
  Shield,
  User,
  MoreHorizontal
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@shared/components/ui/dropdown-menu'
import { UnifiedAdminSidebarProps, UnifiedMenuItem } from '../types/unified-admin'

/**
 * 통합 관리자 사이드바 컴포넌트
 * 사용자 권한에 따라 동적으로 메뉴를 표시
 */
export const UnifiedAdminSidebar: React.FC<UnifiedAdminSidebarProps> = ({
  activeMenu,
  onMenuChange,
  userType,
  menuItems,
  systemHealth = 'healthy',
  notifications = {},
  onLogout
}) => {

  const getHealthStatusColor = () => {
    switch (systemHealth) {
      case 'healthy': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getHealthStatusText = () => {
    switch (systemHealth) {
      case 'healthy': return '정상'
      case 'warning': return '주의'
      case 'error': return '오류'
      default: return '알 수 없음'
    }
  }

  const getUserTypeText = () => {
    switch (userType) {
      case 'SYSTEM_ADMIN': return '시스템 관리'
      case 'ORGANIZATION_ADMIN': return '기업 관리'
      case 'ORGANIZATION_MEMBER': return '구성원'
      default: return '관리'
    }
  }

  const renderMenuItem = (item: UnifiedMenuItem) => {
    const Icon = item.icon
    const isActive = activeMenu === item.id
    const badge = notifications[item.id] || item.badge

    return (
      <Button
        key={item.id}
        variant={isActive ? "default" : "ghost"}
        className={`w-full justify-start gap-3 h-auto p-3 ${
          isActive 
            ? 'bg-blue-600 text-white hover:bg-blue-700' 
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        onClick={() => onMenuChange(item.id)}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1 text-left">
          <div className="flex items-center justify-between">
            <span className="font-medium">{item.title}</span>
            {badge && (
              <Badge 
                variant={item.badgeVariant || "destructive"} 
                className="ml-2 px-2 py-0.5 text-xs"
              >
                {badge}
              </Badge>
            )}
          </div>
          {item.description && (
            <p className={`text-xs mt-0.5 ${
              isActive ? 'text-blue-100' : 'text-gray-500'
            }`}>
              {item.description}
            </p>
          )}
        </div>
      </Button>
    )
  }

  const totalNotifications = Object.values(notifications).reduce((sum, count) => sum + count, 0)

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{getUserTypeText()}</h2>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                systemHealth === 'healthy' ? 'bg-green-500' : 
                systemHealth === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className={`text-sm ${getHealthStatusColor()}`}>
                시스템 {getHealthStatusText()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 메뉴 목록 */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {menuItems.map(renderMenuItem)}
        </div>
      </ScrollArea>

      {/* 하단 정보 */}
      <div className="p-4 border-t border-gray-200">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">활성 알림</span>
            <span className="font-medium text-gray-900">
              {totalNotifications}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="text-gray-600">크레딧</div>
              <div className="font-semibold text-orange-600">
                {notifications.credits || 0}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-600">디바이스</div>
              <div className="font-semibold text-blue-600">
                {notifications.devices || 0}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-600">기업</div>
              <div className="font-semibold text-green-600">
                {notifications.enterprises || 0}
              </div>
            </div>
          </div>

          {/* 로그아웃 버튼 */}
          {onLogout && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default UnifiedAdminSidebar