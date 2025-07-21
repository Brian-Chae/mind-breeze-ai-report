import React from 'react'
import { Button } from '@shared/components/ui/button'
import { Badge } from '@shared/components/ui/badge'
import { ScrollArea } from '@shared/components/ui/scroll-area'
import { Separator } from '@shared/components/ui/separator'
import { 
  LayoutDashboard,
  BarChart3,
  Monitor,
  CreditCard,
  Building2,
  Smartphone,
  FileText,
  Database,
  Settings,
  Activity,
  TrendingUp,
  Shield,
  LogOut,
  Users
} from 'lucide-react'

export type SystemAdminMenuItem = 
  | 'dashboard'
  | 'analytics'
  | 'monitoring'
  | 'credits'
  | 'enterprises'
  | 'devices'
  | 'users'
  | 'reports'
  | 'measurements'

interface SystemAdminSidebarProps {
  activeMenu: SystemAdminMenuItem
  onMenuChange: (menu: SystemAdminMenuItem) => void
  systemHealth?: 'healthy' | 'warning' | 'error'
  notifications?: {
    credits: number
    devices: number
    enterprises: number
  }
  onLogout?: () => void
}

export const SystemAdminSidebar: React.FC<SystemAdminSidebarProps> = ({
  activeMenu,
  onMenuChange,
  systemHealth = 'healthy',
  notifications = { credits: 0, devices: 0, enterprises: 0 },
  onLogout
}) => {
  const menuItems = [
    {
      id: 'dashboard' as SystemAdminMenuItem,
      label: '대시보드',
      icon: LayoutDashboard,
      description: '전체 시스템 현황',
      badge: null
    },
    {
      id: 'enterprises' as SystemAdminMenuItem,
      label: '기업관리',
      icon: Building2,
      description: '기업 현황 및 관리',
      badge: notifications.enterprises || null
    },
    {
      id: 'devices' as SystemAdminMenuItem,
      label: '디바이스관리',
      icon: Smartphone,
      description: 'LINK BAND 디바이스 관리',
      badge: notifications.devices || null
    },
    {
      id: 'users' as SystemAdminMenuItem,
      label: '사용자관리',
      icon: Users,
      description: '전체 사용자 관리',
      badge: null
    },
    {
      id: 'reports' as SystemAdminMenuItem,
      label: '리포트관리',
      icon: FileText,
      description: 'AI 리포트 현황',
      badge: null
    },
    {
      id: 'measurements' as SystemAdminMenuItem,
      label: '측정데이터관리',
      icon: Database,
      description: '측정 데이터 현황',
      badge: null
    },
    {
      id: 'credits' as SystemAdminMenuItem,
      label: '크래딧관리',
      icon: CreditCard,
      description: '기업별 크레딧 현황',
      badge: notifications.credits || null
    },
    {
      id: 'analytics' as SystemAdminMenuItem,
      label: '사용량 분석',
      icon: BarChart3,
      description: '상세 분석 및 인사이트',
      badge: null
    },
    {
      id: 'monitoring' as SystemAdminMenuItem,
      label: '시스템 모니터링',
      icon: Monitor,
      description: '실시간 시스템 상태',
      badge: systemHealth !== 'healthy' ? 1 : null,
      badgeVariant: (systemHealth === 'error' ? 'destructive' : 'secondary') as "default" | "destructive" | "outline" | "secondary"
    }
  ]

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

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">시스템 관리</h2>
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
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeMenu === item.id
            
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
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <Badge 
                        variant={item.badgeVariant || "destructive"} 
                        className="ml-2 px-2 py-0.5 text-xs"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 ${
                    isActive ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {item.description}
                  </p>
                </div>
              </Button>
            )
          })}
        </div>
      </ScrollArea>

      {/* 하단 정보 */}
      <div className="p-4 border-t border-gray-200">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">활성 알림</span>
            <span className="font-medium text-gray-900">
              {(notifications.credits + notifications.devices + notifications.enterprises)}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="text-gray-600">크레딧</div>
              <div className="font-semibold text-orange-600">{notifications.credits}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-600">디바이스</div>
              <div className="font-semibold text-blue-600">{notifications.devices}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-600">기업</div>
              <div className="font-semibold text-green-600">{notifications.enterprises}</div>
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

export default SystemAdminSidebar 