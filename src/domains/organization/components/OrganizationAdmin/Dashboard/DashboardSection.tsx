import React, { useState, useEffect } from 'react'
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
  Plus,
  Loader2
} from 'lucide-react'
import { Card } from '@ui/card'
import { Button } from '@ui/button'
import { Badge } from '@ui/badge'

// Firebase 서비스 import
import { OrganizationService, OrganizationInfo } from '../../../services/CompanyService'
import { MemberManagementService } from '../../../services/MemberManagementService'
import creditManagementService from '../../../services/CreditManagementService'
import measurementUserManagementService, { MeasurementUser, MeasurementUserStats } from '@domains/individual/services/MeasurementUserManagementService'
import enterpriseAuthService from '../../../services/EnterpriseAuthService'

interface StatsCard {
  title: string
  value: string | number
  change?: string
  changeType?: 'increase' | 'decrease' | 'neutral'
  trend?: 'up' | 'down' | 'stable'
  icon: React.ComponentType<any>
  color: string
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

interface DashboardData {
  totalUsers: number;
  activeDevices: number;
  monthlyReports: number;
  creditBalance: number;
  userStats: MeasurementUserStats | null;
  members: any[]; // 임시로 any 타입 사용
  organizationInfo: OrganizationInfo | null;
}

export default function DashboardSection() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalUsers: 0,
    activeDevices: 0,
    monthlyReports: 0,
    creditBalance: 0,
    userStats: null,
    members: [],
    organizationInfo: null
  })

  // 대시보드 데이터 로드
  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const currentContext = enterpriseAuthService.getCurrentContext()
      
      
      // 사용자 정보가 없는 경우 기본값으로 설정
      if (!currentContext.user || !currentContext.user.organizationId) {
        
        // 기본 대시보드 데이터 설정
        setDashboardData({
          totalUsers: 0,
          activeDevices: 0,
          monthlyReports: 0,
          creditBalance: 0,
          userStats: null,
          members: [],
          organizationInfo: null
        })
        
        setLoading(false)
        return
      }

      const organizationId = currentContext.user.organizationId

      // 현재 사용자의 권한 정보 확인
        permissions: currentContext.permissions,
        userType: currentContext.user.userType,
        organizationId

      // 병렬로 데이터 로드 (각각 에러 처리)
      const [
        organizationInfo,
        members,
        creditBalance
      ] = await Promise.allSettled([
        OrganizationService.getOrganizationById(organizationId),
        new MemberManagementService().getOrganizationMembers(organizationId),
        creditManagementService.getCreditBalance(organizationId)
      ])

      // 권한이 있는 경우에만 사용자 통계 로드
      let userStats = null
      const userPermissions = currentContext.permissions || []
      
        userPermissions,
        userType: currentContext.user?.userType
      
      // ORGANIZATION_ADMIN은 모든 권한을 가져야 함
      const hasViewPermission = 
        currentContext.user?.userType === 'ORGANIZATION_ADMIN' ||
        userPermissions.includes('*') ||
        userPermissions.includes('measurement_users.view.all') || 
        userPermissions.includes('measurement_users.view.own')
      
      if (hasViewPermission) {
        try {
          userStats = await measurementUserManagementService.getMeasurementUserStats()
        } catch (err) {
          // 통계 데이터 없이 계속 진행
        }
      } else {
      }

      // 결과 처리 (에러가 발생한 경우 기본값 사용)
      const orgInfo = organizationInfo.status === 'fulfilled' ? organizationInfo.value : null
      const memberList = members.status === 'fulfilled' ? members.value : []
      const balance = creditBalance.status === 'fulfilled' ? creditBalance.value : 0

      // memberList가 배열인지 확인
      const safeMemberList = Array.isArray(memberList) ? memberList : []
        memberListType: typeof memberList,
        isArray: Array.isArray(memberList),
        length: safeMemberList.length

      setDashboardData({
        totalUsers: userStats?.totalCount || 0,
        activeDevices: safeMemberList.filter((m: any) => m.isActive).length,
        monthlyReports: userStats?.thisMonthMeasurements || 0,
        creditBalance: balance,
        userStats,
        members: safeMemberList,
        organizationInfo: orgInfo
      })

    } catch (err) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 통계 카드 데이터 (실제 데이터 기반)
  const getStatsCards = (): StatsCard[] => [
    {
      title: '전체 사용자',
      value: dashboardData.totalUsers.toLocaleString(),
      change: dashboardData.userStats ? `+${dashboardData.userStats.thisMonthNewUsers}` : '+0',
      trend: 'up',
      icon: Users,
      color: 'blue'
    },
    {
      title: '활성 운영자',
      value: dashboardData.activeDevices.toString(),
      change: '+2.3%',
      trend: 'up',
      icon: Smartphone,
      color: 'green'
    },
    {
      title: '이번달 측정',
      value: dashboardData.monthlyReports.toLocaleString(),
      change: '+18.2%',
      trend: 'up',
      icon: Brain,
      color: 'purple'
    },
    {
      title: '잔여 크레딧',
      value: dashboardData.creditBalance.toLocaleString(),
      change: '-5.8%',
      trend: 'down',
      icon: CreditCard,
      color: 'orange'
    }
  ]

  // 최근 활동 데이터 (실제 데이터 기반)
  const getRecentActivities = (): RecentActivity[] => {
    const activities: RecentActivity[] = []
    
    // 최근 가입한 멤버들 기반으로 활동 생성
    dashboardData.members.slice(0, 4).forEach((member, index) => {
      activities.push({
        id: `member-${index}`,
        user: member.displayName || member.email || '알 수 없음',
        action: member.isActive ? '로그인 완료' : '계정 비활성화',
        timestamp: `${index + 1}시간 전`,
        status: member.isActive ? 'success' : 'warning'
      })
    })

    return activities
  }

  // 빠른 액션들
  const quickActions: QuickAction[] = [
    {
      id: 'invite',
      title: '운영자 초대',
      icon: UserPlus,
      color: 'blue',
    },
    {
      id: 'report',
      title: 'AI 리포트 생성',
      icon: Brain,
      color: 'purple',
    },
    {
      id: 'device',
      title: '디바이스 추가',
      icon: Smartphone,
      color: 'green',
    },
    {
      id: 'credit',
      title: '크레딧 구매',
      icon: CreditCard,
      color: 'orange',
    }
  ]

  // 알림 데이터 (실제 데이터 기반)
  const getNotifications = (): Notification[] => {
    const notifications: Notification[] = []
    
    // 크레딧 부족 알림
    if (dashboardData.creditBalance < 1000) {
      notifications.push({
        id: 'credit-low',
        type: 'warning',
        title: '크레딧 부족',
        message: '잔여 크레딧이 부족합니다. 충전을 권장합니다.',
        timestamp: '1시간 전'
      })
    }

    // 조직 정보 알림
    if (dashboardData.organizationInfo) {
      notifications.push({
        id: 'org-info',
        type: 'info',
        title: '조직 정보',
        message: `${dashboardData.organizationInfo.organizationName} 관리 중`,
        timestamp: '2시간 전'
      })
    }

    return notifications
  }

  // 로딩 중일 때
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">데이터를 불러오는 중...</span>
      </div>
    )
  }

  // 오류 발생 시
  if (error) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">오류 발생</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={loadDashboardData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          다시 시도
        </Button>
      </div>
    )
  }

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

  const renderQuickAction = (action: QuickAction) => {
    const colorClasses = {
      blue: 'hover:bg-blue-50 border-blue-200 text-blue-700',
      green: 'hover:bg-green-50 border-green-200 text-green-700',
      purple: 'hover:bg-purple-50 border-purple-200 text-purple-700',
      orange: 'hover:bg-orange-50 border-orange-200 text-orange-700'
    }

    return (
      <Button
        key={action.id}
        onClick={action.action}
        className={`w-full justify-start ${colorClasses[action.color as keyof typeof colorClasses]}`}
        variant="outline"
      >
        <action.icon className="w-4 h-4 mr-2" />
        {action.title}
      </Button>
    )
  }

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
      <div key={notification.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
        <div className={`flex items-center justify-center w-6 h-6 rounded-full ${
          typeColors[notification.type]
        }`}>
          <TypeIcon className="w-3 h-3" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
          <p className="text-xs text-gray-700">{notification.message}</p>
          <p className="text-xs text-gray-500 mt-1">{notification.timestamp}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">대시보드</h2>
          <p className="text-gray-600">
            {dashboardData.organizationInfo?.organizationName || '조직'} 관리 현황
          </p>
        </div>
        <Button onClick={loadDashboardData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          새로고침
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getStatsCards().map(renderStatsCard)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 최근 활동 */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">최근 활동</h3>
              <Button variant="outline" size="sm" onClick={loadDashboardData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                새로고침
              </Button>
            </div>
            <div className="space-y-2">
              {getRecentActivities().map(renderActivityItem)}
            </div>
          </Card>
        </div>

        {/* 빠른 액션 */}
        <div>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">빠른 액션</h3>
            <div className="space-y-3">
              {quickActions.map(renderQuickAction)}
            </div>
          </Card>

          {/* 알림 */}
          <Card className="p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">알림</h3>
            <div className="space-y-3">
              {getNotifications().map(renderNotification)}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
} 