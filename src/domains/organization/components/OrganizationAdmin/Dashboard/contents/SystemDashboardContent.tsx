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

// Service에서 가져온 타입들 사용
type SystemStats = ServiceSystemStats
type OrganizationSummary = ServiceOrganizationSummary

// 컴포넌트 내부용 인터페이스
interface OrganizationStatus {
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
    monthlyGrowth: 0,
    todayMeasurements: 0,
    thisWeekMeasurements: 0,
    thisMonthMeasurements: 0,
    averageReportsPerUser: 0,
    totalStorageUsed: 0,
    averageSessionDuration: 0
  })

  const [organizations, setOrganizations] = useState<OrganizationStatus[]>([])
  const [activities, setActivities] = useState<SystemActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSystemData()
  }, [])

  const loadSystemData = async () => {
    setLoading(true)
    try {
      console.log('🔄 실제 시스템 데이터 로딩 시작...')
      
      // 실제 SystemAdminService 호출
      const [statsResult, organizationsResult, activitiesResult] = await Promise.allSettled([
        systemAdminService.getSystemStats(),
        systemAdminService.getAllOrganizationSummaries(),
        systemAdminService.getRecentSystemActivities(20)
      ])

      // 시스템 통계 설정
      if (statsResult.status === 'fulfilled') {
        setSystemStats(statsResult.value)
        console.log('✅ 시스템 통계 로드 성공:', statsResult.value)
      } else {
        console.warn('⚠️ 시스템 통계 로드 실패:', statsResult.reason)
        // 에러 시 기본값 설정
        setSystemStats({
          totalOrganizations: 0,
          totalUsers: 0,
          activeUsers: 0,
          totalReports: 0,
          systemHealth: 'error',
          uptime: '0%',
          totalCreditsUsed: 0,
          monthlyGrowth: 0,
          todayMeasurements: 0,
          thisWeekMeasurements: 0,
          thisMonthMeasurements: 0,
          averageReportsPerUser: 0,
          totalStorageUsed: 0,
          averageSessionDuration: 0
        })
      }

      // 조직 현황 설정
      if (organizationsResult.status === 'fulfilled') {
        // OrganizationSummary를 OrganizationStatus로 변환
        const orgStatuses = organizationsResult.value.slice(0, 10).map(org => ({
          id: org.id,
          name: org.name,
          memberCount: org.memberCount,
          activeUsers: org.activeUsers,
          creditBalance: org.creditBalance,
          status: org.status,
          lastActivity: org.lastActivity
        }))
        setOrganizations(orgStatuses)
        console.log('✅ 조직 현황 로드 성공:', orgStatuses.length, '개 조직')
      } else {
        console.warn('⚠️ 조직 현황 로드 실패:', organizationsResult.reason)
        setOrganizations([])
      }

      // 시스템 활동 설정
      if (activitiesResult.status === 'fulfilled') {
        setActivities(activitiesResult.value.slice(0, 10))
        console.log('✅ 시스템 활동 로드 성공:', activitiesResult.value.length, '개 활동')
      } else {
        console.warn('⚠️ 시스템 활동 로드 실패:', activitiesResult.reason)
        // 에러 시 기본 활동 로그 설정
        setActivities([
          {
            id: 'fallback-1',
            organizationId: 'system',
            organizationName: '시스템',
            type: 'system_event',
            description: '시스템 활동 데이터를 불러오는 중 오류가 발생했습니다.',
            timestamp: new Date(),
            severity: 'error'
          }
        ])
      }

    } catch (error) {
      console.error('❌ 시스템 데이터 로드 실패:', error)
      // 전체 에러 시 기본값들 설정
      setSystemStats({
        totalOrganizations: 0,
        totalUsers: 0,
        activeUsers: 0,
        totalReports: 0,
        systemHealth: 'error',
        uptime: '0%',
        totalCreditsUsed: 0,
        monthlyGrowth: 0,
        todayMeasurements: 0,
        thisWeekMeasurements: 0,
        thisMonthMeasurements: 0,
        averageReportsPerUser: 0,
        totalStorageUsed: 0,
        averageSessionDuration: 0
      })
      setOrganizations([])
      setActivities([])
    } finally {
      setLoading(false)
      console.log('🏁 시스템 데이터 로딩 완료')
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