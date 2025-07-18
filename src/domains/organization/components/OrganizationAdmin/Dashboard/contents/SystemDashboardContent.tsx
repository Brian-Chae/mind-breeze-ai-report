import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card'
import { Badge } from '@shared/components/ui/badge'
import { ScrollArea } from '@shared/components/ui/scroll-area'
import systemAdminService, { 
  SystemStats as ServiceSystemStats, 
  OrganizationSummary as ServiceOrganizationSummary, 
  SystemActivity 
} from '../../../../services/SystemAdminService'
import { 
  Users, 
  Building, 
  Activity, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  DollarSign,
  Monitor,
  Server,
  Wifi,
  Database,
  BarChart3,
  Clock,
  Zap
} from 'lucide-react'

interface SystemStats {
  totalOrganizations: number
  totalUsers: number
  activeUsers: number
  totalReports: number
  systemHealth: 'healthy' | 'warning' | 'error'
  uptime: string
  totalCreditsUsed: number
  monthlyGrowth: number
}

interface OrganizationSummary {
  id: string
  name: string
  memberCount: number
  activeUsers: number
  creditBalance: number
  status: 'active' | 'trial' | 'suspended'
  lastActivity: Date
}

export const SystemDashboardContent: React.FC = () => {
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalOrganizations: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalReports: 0,
    systemHealth: 'healthy',
    uptime: '99.9%',
    totalCreditsUsed: 0,
    monthlyGrowth: 0
  })

  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([])
  const [activities, setActivities] = useState<SystemActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSystemData()
  }, [])

  const loadSystemData = async () => {
    setLoading(true)
    try {
      // 실제 서비스 호출 대신 임시 데이터 사용
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 임시 데이터 설정
      setSystemStats({
        totalOrganizations: 45,
        totalUsers: 1250,
        activeUsers: 980,
        totalReports: 8450,
        systemHealth: 'healthy',
        uptime: '99.9%',
        totalCreditsUsed: 125000,
        monthlyGrowth: 12.5
      })

      setOrganizations([
        {
          id: '1',
          name: 'ABC 헬스케어',
          memberCount: 150,
          activeUsers: 120,
          creditBalance: 2500,
          status: 'active',
          lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
          id: '2',
          name: 'XYZ 웰니스',
          memberCount: 89,
          activeUsers: 75,
          creditBalance: 800,
          status: 'trial',
          lastActivity: new Date(Date.now() - 5 * 60 * 60 * 1000)
        },
        {
          id: '3',
          name: 'DEF 메디컬',
          memberCount: 200,
          activeUsers: 180,
          creditBalance: 5000,
          status: 'active',
          lastActivity: new Date(Date.now() - 30 * 60 * 1000)
        }
      ])

      setActivities([
        {
          id: '1',
          organizationId: '1',
          organizationName: 'ABC 헬스케어',
          type: 'user_registered',
          description: '새로운 사용자 5명 등록',
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          severity: 'info'
        },
        {
          id: '2',
          organizationId: '2',
          organizationName: 'XYZ 웰니스',
          type: 'credit_purchased',
          description: '크레딧 500개 구매',
          timestamp: new Date(Date.now() - 20 * 60 * 1000),
          severity: 'info'
        },
        {
          id: '3',
          organizationId: '3',
          organizationName: 'DEF 메디컬',
          type: 'system_event',
          description: '대용량 리포트 생성 완료',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          severity: 'info'
        }
      ])

    } catch (error) {
      console.error('시스템 데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">활성</Badge>
      case 'trial':
        return <Badge className="bg-blue-100 text-blue-800">트라이얼</Badge>
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">중지</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">알 수 없음</Badge>
    }
  }

  const getHealthIcon = () => {
    switch (systemStats.systemHealth) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <Monitor className="h-5 w-5 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">시스템 데이터를 불러오는 중...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">시스템 대시보드</h1>
        <p className="text-gray-600 mt-1">전체 시스템 현황을 한눈에 확인하세요</p>
      </div>

      {/* 주요 지표 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 기업 수</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.totalOrganizations}</p>
                <p className="text-xs text-gray-500 mt-1">전월 대비 +{systemStats.monthlyGrowth}%</p>
              </div>
              <Building className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 사용자 수</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.totalUsers.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">활성: {systemStats.activeUsers}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">생성된 리포트</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.totalReports.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">이번 달</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">시스템 상태</p>
                <div className="flex items-center gap-2 mt-1">
                  {getHealthIcon()}
                  <span className={`text-lg font-semibold ${
                    systemStats.systemHealth === 'healthy' ? 'text-green-600' : 
                    systemStats.systemHealth === 'warning' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {systemStats.systemHealth === 'healthy' ? '정상' : 
                     systemStats.systemHealth === 'warning' ? '주의' : '오류'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">가동률: {systemStats.uptime}</p>
              </div>
              <Server className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 기업 현황 */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Building className="h-5 w-5" />
              최근 기업 현황
            </CardTitle>
            <CardDescription className="text-gray-600">활성 기업들의 최신 현황</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-4">
                {organizations.map((org) => (
                  <div key={org.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{org.name}</h4>
                        {getStatusBadge(org.status)}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {org.memberCount}명
                        </span>
                        <span className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          활성: {org.activeUsers}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {org.creditBalance} 크레딧
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {Math.floor((Date.now() - org.lastActivity.getTime()) / (1000 * 60))}분 전
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* 최근 시스템 활동 */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Activity className="h-5 w-5" />
              최근 시스템 활동
            </CardTitle>
            <CardDescription className="text-gray-600">실시간 시스템 활동 로그</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="mt-1">
                      {activity.severity === 'info' && <CheckCircle className="h-4 w-4 text-blue-600" />}
                      {activity.severity === 'warning' && <AlertCircle className="h-4 w-4 text-yellow-600" />}
                      {activity.severity === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{activity.organizationName}</span>
                        <Badge variant="outline" className="text-xs text-gray-900 border-gray-300">
                          {activity.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.floor((Date.now() - activity.timestamp.getTime()) / (1000 * 60))}분 전
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SystemDashboardContent 