import React from 'react'
import {
  Users,
  Smartphone,
  Brain,
  CreditCard,
  TrendingUp,
  UserPlus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  DollarSign,
  Eye,
  Plus
} from 'lucide-react'
import { Card } from '../../ui/card'
import { Button } from '../../ui/button'
import { Badge } from '../../ui/badge'

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

interface QuickAction {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  action: () => void;
}

interface Notification {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: string;
}

export default function DashboardSection() {
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
    },
    {
      id: '5',
      user: '홍길동',
      action: '새로운 사용자 등록',
      timestamp: '2시간 전',
      status: 'success'
    }
  ]

  // 빠른 액션 데이터
  const quickActions: QuickAction[] = [
    {
      id: 'invite-member',
      title: '운영자 초대',
      icon: UserPlus,
      color: 'blue',
      action: () => console.log('운영자 초대')
    },
    {
      id: 'generate-report',
      title: 'AI 리포트 생성',
      icon: Brain,
      color: 'purple',
      action: () => console.log('AI 리포트 생성')
    },
    {
      id: 'add-device',
      title: '디바이스 추가',
      icon: Smartphone,
      color: 'green',
      action: () => console.log('디바이스 추가')
    },
    {
      id: 'buy-credits',
      title: '크레딧 구매',
      icon: CreditCard,
      color: 'orange',
      action: () => console.log('크레딧 구매')
    }
  ]

  // 알림 데이터
  const notifications: Notification[] = [
    {
      id: '1',
      type: 'warning',
      title: '크레딧 부족',
      message: '잔여 크레딧이 20% 미만입니다',
      timestamp: '10분 전'
    },
    {
      id: '2',
      type: 'info',
      title: '시스템 업데이트',
      message: '새로운 기능이 추가되었습니다',
      timestamp: '2시간 전'
    },
    {
      id: '3',
      type: 'success',
      title: '백업 완료',
      message: '데이터 백업이 성공적으로 완료되었습니다',
      timestamp: '6시간 전'
    }
  ]

  // 통계 카드 렌더링
  const renderStatsCard = (card: StatsCard) => {
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600'
    }

    return (
      <Card key={card.title} className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{card.title}</p>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <div className="flex items-center mt-2">
              <TrendingUp className={`w-4 h-4 mr-1 ${
                card.trend === 'up' ? 'text-green-500' : 
                card.trend === 'down' ? 'text-red-500' : 'text-gray-500'
              }`} />
              <span className={`text-sm ${
                card.trend === 'up' ? 'text-green-600' : 
                card.trend === 'down' ? 'text-red-600' : 'text-gray-600'
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
      <div key={activity.id} className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
          statusColors[activity.status]
        }`}>
          <StatusIcon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{activity.user}</p>
          <p className="text-sm text-gray-600">{activity.action}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">{activity.timestamp}</p>
        </div>
      </div>
    )
  }

  // 빠른 액션 아이템 렌더링
  const renderQuickAction = (action: QuickAction) => {
    const colorClasses = {
      blue: 'hover:bg-blue-50 hover:text-blue-600',
      purple: 'hover:bg-purple-50 hover:text-purple-600',
      green: 'hover:bg-green-50 hover:text-green-600',
      orange: 'hover:bg-orange-50 hover:text-orange-600'
    }

    return (
      <Button
        key={action.id}
        variant="outline"
        className={`w-full justify-start transition-colors ${
          colorClasses[action.color as keyof typeof colorClasses]
        }`}
        onClick={action.action}
      >
        <action.icon className="w-4 h-4 mr-2" />
        {action.title}
      </Button>
    )
  }

  // 알림 아이템 렌더링
  const renderNotification = (notification: Notification) => {
    const typeColors = {
      warning: 'bg-yellow-100 text-yellow-600',
      info: 'bg-blue-100 text-blue-600',
      success: 'bg-green-100 text-green-600',
      error: 'bg-red-100 text-red-600'
    }

    const typeIcons = {
      warning: AlertCircle,
      info: CheckCircle,
      success: CheckCircle,
      error: AlertCircle
    }

    const TypeIcon = typeIcons[notification.type]

    return (
      <div key={notification.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
        <div className={`flex items-center justify-center w-6 h-6 rounded-full ${
          typeColors[notification.type]
        }`}>
          <TypeIcon className="w-3 h-3" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
          <p className="text-xs text-gray-600">{notification.message}</p>
          <p className="text-xs text-gray-500 mt-1">{notification.timestamp}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map(renderStatsCard)}
      </div>

      {/* 메인 콘텐츠 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 최근 활동 */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">최근 활동</h3>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-blue-50 text-blue-600">
                  실시간
                </Badge>
                <Button variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  새로고침
                </Button>
              </div>
            </div>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {recentActivities.map(renderActivityItem)}
            </div>
          </Card>
        </div>

        {/* 사이드 패널 */}
        <div className="space-y-6">
          {/* 빠른 액션 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">빠른 액션</h3>
            <div className="space-y-3">
              {quickActions.map(renderQuickAction)}
            </div>
          </Card>

          {/* 알림 */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">알림</h3>
              <Badge variant="secondary" className="bg-red-50 text-red-600">
                {notifications.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {notifications.map(renderNotification)}
            </div>
          </Card>
        </div>
      </div>

      {/* 추가 정보 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 시스템 상태 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">시스템 상태</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">서버 상태</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600">정상</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">데이터베이스</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600">정상</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">AI 서비스</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-yellow-600">점검중</span>
              </div>
            </div>
          </div>
        </Card>

        {/* 최근 성과 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 성과</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">금일 신규 사용자</span>
              <span className="text-sm font-medium text-gray-900">+24명</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">완료된 측정</span>
              <span className="text-sm font-medium text-gray-900">156회</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">생성된 리포트</span>
              <span className="text-sm font-medium text-gray-900">89개</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">사용된 크레딧</span>
              <span className="text-sm font-medium text-gray-900">2,340개</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
} 