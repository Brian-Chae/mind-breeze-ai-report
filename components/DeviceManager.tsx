import React, { useState, useEffect } from 'react'
import { 
  BarChart3, 
  Building2, 
  Users, 
  UserPlus, 
  Brain, 
  Smartphone,
  CreditCard,
  Menu,
  X,
  Search,
  Bell,
  Settings,
  LogOut,
  Home,
  User,
  ChevronRight,
  Shield,
  Activity,
  TrendingUp,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Eye,
  Download,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Filter,
  RefreshCw
} from 'lucide-react'
import { Card } from '../src/components/ui/card'
import { Button } from '../src/components/ui/button'
import { Badge } from '../src/components/ui/badge'
import { Input } from '../src/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../src/components/ui/dropdown-menu'

interface SidebarMenuItem {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  children?: SidebarMenuItem[];
  badge?: number;
}

interface StatsCard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface RecentActivity {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

export function DeviceManager() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [searchQuery, setSearchQuery] = useState('')

  // 사이드바 메뉴 구조
  const sidebarMenuItems: SidebarMenuItem[] = [
    {
      id: 'dashboard',
      title: '대시보드',
      icon: BarChart3,
      path: '/admin/dashboard'
    },
    {
      id: 'organization',
      title: '기업 관리',
      icon: Building2,
      path: '/admin/organization',
      children: [
        { id: 'org-info', title: '기업 정보', icon: Building2, path: '/admin/organization/info' },
        { id: 'org-departments', title: '조직 관리', icon: Users, path: '/admin/organization/departments' },
        { id: 'org-structure', title: '조직 구조', icon: BarChart3, path: '/admin/organization/structure' }
      ]
    },
    {
      id: 'members',
      title: '운영자 관리',
      icon: UserPlus,
      path: '/admin/members',
      children: [
        { id: 'member-list', title: '운영자 목록', icon: Users, path: '/admin/members/list' },
        { id: 'member-invite', title: '초대 관리', icon: UserPlus, path: '/admin/members/invite' },
        { id: 'member-permissions', title: '권한 설정', icon: Shield, path: '/admin/members/permissions' }
      ]
    },
    {
      id: 'users',
      title: '사용자 관리',
      icon: User,
      path: '/admin/users',
      children: [
        { id: 'user-list', title: '사용자 목록', icon: Users, path: '/admin/users/list' },
        { id: 'user-history', title: '측정 이력', icon: Activity, path: '/admin/users/history' },
        { id: 'user-reports', title: '리포트 관리', icon: Eye, path: '/admin/users/reports' }
      ]
    },
    {
      id: 'ai-report',
      title: 'AI Report',
      icon: Brain,
      path: '/admin/ai-report',
      children: [
        { id: 'report-generation', title: '리포트 생성', icon: Plus, path: '/admin/ai-report/generation' },
        { id: 'report-list', title: '리포트 목록', icon: Eye, path: '/admin/ai-report/list' },
        { id: 'report-quality', title: '품질 관리', icon: CheckCircle, path: '/admin/ai-report/quality' }
      ]
    },
    {
      id: 'devices',
      title: '디바이스 관리',
      icon: Smartphone,
      path: '/admin/devices',
      children: [
        { id: 'device-inventory', title: '디바이스 현황', icon: Smartphone, path: '/admin/devices/inventory' },
        { id: 'device-assignment', title: '디바이스 배치', icon: Users, path: '/admin/devices/assignment' },
        { id: 'device-monitoring', title: '디바이스 모니터링', icon: Activity, path: '/admin/devices/monitoring' }
      ]
    },
    {
      id: 'credits',
      title: '크레딧 관리',
      icon: CreditCard,
      path: '/admin/credits',
      children: [
        { id: 'credit-dashboard', title: '크레딧 현황', icon: DollarSign, path: '/admin/credits/dashboard' },
        { id: 'credit-history', title: '구매 내역', icon: Calendar, path: '/admin/credits/history' },
        { id: 'credit-settings', title: '결제 설정', icon: Settings, path: '/admin/credits/settings' }
      ]
    }
  ]

  // 통계 카드 데이터
  const statsCards: StatsCard[] = [
    {
      title: '전체 사용자',
      value: '1,234',
      change: '+12.5%',
      trend: 'up',
      icon: Users,
      color: 'blue'
    },
    {
      title: '활성 디바이스',
      value: '86',
      change: '+2.3%',
      trend: 'up',
      icon: Smartphone,
      color: 'green'
    },
    {
      title: '이번달 리포트',
      value: '2,891',
      change: '+18.2%',
      trend: 'up',
      icon: Brain,
      color: 'purple'
    },
    {
      title: '잔여 크레딧',
      value: '15,420',
      change: '-5.8%',
      trend: 'down',
      icon: CreditCard,
      color: 'orange'
    }
  ]

  // 최근 활동 데이터
  const recentActivities: RecentActivity[] = [
    {
      id: '1',
      user: '김철수',
      action: 'AI 리포트 생성 완료',
      timestamp: '5분 전',
      status: 'success'
    },
    {
      id: '2',
      user: '이영희',
      action: '새로운 운영자 초대',
      timestamp: '12분 전',
      status: 'success'
    },
    {
      id: '3',
      user: '박민수',
      action: '디바이스 배터리 부족 알림',
      timestamp: '25분 전',
      status: 'warning'
    },
    {
      id: '4',
      user: '정지영',
      action: '크레딧 자동 충전 실패',
      timestamp: '1시간 전',
      status: 'error'
    }
  ]

  // 사이드바 메뉴 아이템 렌더링
  const renderSidebarItem = (item: SidebarMenuItem, level: number = 0) => {
    const isActive = currentPage === item.id
    const hasChildren = item.children && item.children.length > 0
    
    return (
      <div key={item.id} className={`${level > 0 ? 'ml-4' : ''}`}>
        <button
          onClick={() => setCurrentPage(item.id)}
          className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
            isActive
              ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
            <span className="font-medium">{item.title}</span>
          </div>
          {hasChildren && (
            <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'rotate-90' : ''}`} />
          )}
        </button>
        {hasChildren && isActive && (
          <div className="mt-2 space-y-1">
            {item.children!.map((child) => renderSidebarItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  // 통계 카드 렌더링
  const renderStatsCard = (card: StatsCard) => {
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600'
    }

    return (
      <Card key={card.title} className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700 mb-1">{card.title}</p>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <div className="flex items-center mt-2">
              <TrendingUp className={`w-4 h-4 mr-1 ${
                card.trend === 'up' ? 'text-green-500' : 
                card.trend === 'down' ? 'text-red-500' : 'text-gray-600'
              }`} />
              <span className={`text-sm ${
                card.trend === 'up' ? 'text-green-600' : 
                card.trend === 'down' ? 'text-red-600' : 'text-gray-700'
              }`}>
                {card.change}
              </span>
            </div>
          </div>
          <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${
            colorClasses[card.color as keyof typeof colorClasses]
          }`}>
            <card.icon className="w-6 h-6" />
          </div>
        </div>
      </Card>
    )
  }

  // 최근 활동 아이템 렌더링
  const renderActivityItem = (activity: RecentActivity) => {
    const statusColors = {
      success: 'bg-green-100 text-green-600',
      warning: 'bg-yellow-100 text-yellow-600',
      error: 'bg-red-100 text-red-600'
    }

    const statusIcons = {
      success: CheckCircle,
      warning: AlertCircle,
      error: AlertCircle
    }

    const StatusIcon = statusIcons[activity.status]

    return (
      <div key={activity.id} className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
          statusColors[activity.status]
        }`}>
          <StatusIcon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{activity.user}</p>
          <p className="text-sm text-gray-700">{activity.action}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-600">{activity.timestamp}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* 사이드바 */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-xl">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">MIND BREEZE</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {sidebarMenuItems.map((item) => renderSidebarItem(item))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
            <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">관리자</p>
              <p className="text-xs text-gray-500">admin@company.com</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  설정
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LogOut className="w-4 h-4 mr-2" />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <div className="lg:ml-80">
        {/* 헤더 */}
        <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <Menu className="w-5 h-5 text-gray-700" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">기업 관리 대시보드</h1>
                <p className="text-sm text-gray-700">MIND BREEZE AI 관리자 포털</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64 text-gray-900 placeholder-gray-500"
                />
              </div>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5 text-gray-700" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-5 h-5 text-gray-700" />
              </Button>
            </div>
          </div>
        </header>

        {/* 대시보드 콘텐츠 */}
        <main className="p-6 text-gray-900">
          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsCards.map(renderStatsCard)}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 최근 활동 */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">최근 활동</h3>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    새로고침
                  </Button>
                </div>
                <div className="space-y-2">
                  {recentActivities.map(renderActivityItem)}
                </div>
              </Card>
            </div>

            {/* 빠른 액션 */}
            <div>
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">빠른 액션</h3>
                <div className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <UserPlus className="w-4 h-4 mr-2" />
                    운영자 초대
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Brain className="w-4 h-4 mr-2" />
                    AI 리포트 생성
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Smartphone className="w-4 h-4 mr-2" />
                    디바이스 추가
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <CreditCard className="w-4 h-4 mr-2" />
                    크레딧 구매
                  </Button>
                </div>
              </Card>

              {/* 알림 */}
              <Card className="p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">알림</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-yellow-100 rounded-full">
                      <AlertCircle className="w-3 h-3 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">크레딧 부족</p>
                      <p className="text-xs text-gray-700">잔여 크레딧이 20% 미만입니다</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full">
                      <CheckCircle className="w-3 h-3 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">시스템 업데이트</p>
                      <p className="text-xs text-gray-700">새로운 기능이 추가되었습니다</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* 모바일 오버레이 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}