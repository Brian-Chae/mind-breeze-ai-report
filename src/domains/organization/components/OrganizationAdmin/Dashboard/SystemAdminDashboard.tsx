import React, { useState, useEffect } from 'react'
import { Card } from '@shared/components/ui/card'
import { Button } from '@shared/components/ui/button'
import { Badge } from '@shared/components/ui/badge'
import systemAdminService, { 
  SystemStats as ServiceSystemStats, 
  OrganizationSummary as ServiceOrganizationSummary, 
  SystemActivity 
} from '../../../services/SystemAdminService'
import SystemAnalyticsPanel from './SystemAnalyticsPanel'
import SystemMonitoringPanel from './SystemMonitoringPanel'
import EnterpriseCreditManagementPanel from './EnterpriseCreditManagementPanel'
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
  Zap,
  Shield
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

export default function SystemAdminDashboard() {
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
  const [loading, setLoading] = useState(true)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showMonitoring, setShowMonitoring] = useState(false)
  const [showCreditManagement, setShowCreditManagement] = useState(false)

  useEffect(() => {
    loadSystemData()
  }, [])

  const loadSystemData = async () => {
    setLoading(true)
    try {
      console.log('🚀 실제 시스템 데이터 로딩 시작...')
      
      // 실제 API 호출
      const [realStats, realOrganizations, recentActivities] = await Promise.allSettled([
        systemAdminService.getSystemStats(),
        systemAdminService.getAllOrganizationSummaries(),
        systemAdminService.getRecentSystemActivities(10)
      ])

      // 시스템 통계 설정
      if (realStats.status === 'fulfilled') {
        const stats: SystemStats = {
          totalOrganizations: realStats.value.totalOrganizations,
          totalUsers: realStats.value.totalUsers,
          activeUsers: realStats.value.activeUsers,
          totalReports: realStats.value.totalReports,
          systemHealth: realStats.value.systemHealth,
          uptime: realStats.value.uptime,
          totalCreditsUsed: realStats.value.totalCreditsUsed,
          monthlyGrowth: realStats.value.monthlyGrowth
        }
        setSystemStats(stats)
        console.log('✅ 시스템 통계 로드 성공:', stats)
      } else {
        console.warn('⚠️ 시스템 통계 로드 실패:', realStats.reason)
        // Fallback to mock data
        setSystemStats({
          totalOrganizations: 0,
          totalUsers: 0,
          activeUsers: 0,
          totalReports: 0,
          systemHealth: 'warning',
          uptime: '99.9%',
          totalCreditsUsed: 0,
          monthlyGrowth: 0
        })
      }

      // 조직 정보 설정
      if (realOrganizations.status === 'fulfilled') {
        const orgs: OrganizationSummary[] = realOrganizations.value.map(org => ({
          id: org.id,
          name: org.name,
          memberCount: org.memberCount,
          activeUsers: org.activeUsers,
          creditBalance: org.creditBalance,
          status: org.status,
          lastActivity: org.lastActivity
        }))
        setOrganizations(orgs)
        console.log('✅ 조직 정보 로드 성공:', orgs.length, '개 조직')
      } else {
        console.warn('⚠️ 조직 정보 로드 실패:', realOrganizations.reason)
        setOrganizations([])
      }

      // 최근 활동 로그
      if (recentActivities.status === 'fulfilled') {
        console.log('✅ 최근 활동 로드 성공:', recentActivities.value.length, '개 활동')
      }

    } catch (error) {
      console.error('❌ 시스템 데이터 로드 중 오류:', error)
      
      // 에러 발생 시 기본값 설정
      setSystemStats({
        totalOrganizations: 0,
        totalUsers: 0,
        activeUsers: 0,
        totalReports: 0,
        systemHealth: 'error',
        uptime: '99.9%',
        totalCreditsUsed: 0,
        monthlyGrowth: 0
      })
      setOrganizations([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">활성</Badge>
      case 'trial':
        return <Badge className="bg-blue-100 text-blue-800">체험</Badge>
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">정지</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return <Monitor className="w-5 h-5 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  // 패널 표시 시 해당 컴포넌트 렌더링
  if (showAnalytics) {
    return <SystemAnalyticsPanel systemStats={systemStats} />
  }

  if (showMonitoring) {
    return <SystemMonitoringPanel isVisible={showMonitoring} onClose={() => setShowMonitoring(false)} />
  }

  if (showCreditManagement) {
    return <EnterpriseCreditManagementPanel isVisible={showCreditManagement} onClose={() => setShowCreditManagement(false)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">시스템 관리 대시보드</h1>
            <p className="text-gray-600 mt-2">전체 시스템 현황과 조직 관리</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {getHealthIcon(systemStats.systemHealth)}
              <span className={`font-medium ${getHealthColor(systemStats.systemHealth)}`}>
                시스템 상태: {systemStats.systemHealth === 'healthy' ? '정상' : '주의'}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => setShowAnalytics(!showAnalytics)}
                className={`${showAnalytics ? 'bg-blue-700' : 'bg-blue-600'} text-white hover:bg-blue-700`}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                {showAnalytics ? '대시보드 보기' : '상세 분석'}
              </Button>
              
              <Button 
                onClick={() => setShowMonitoring(!showMonitoring)}
                className={`${showMonitoring ? 'bg-green-700' : 'bg-green-600'} text-white hover:bg-green-700`}
              >
                <Monitor className="w-4 h-4 mr-2" />
                시스템 모니터링
              </Button>
              
              <Button 
                onClick={() => setShowCreditManagement(!showCreditManagement)}
                className={`${showCreditManagement ? 'bg-purple-700' : 'bg-purple-600'} text-white hover:bg-purple-700`}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                크레딧 관리
              </Button>
            </div>
          </div>
        </div>

        {/* 주요 지표 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 조직 수</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.totalOrganizations.toLocaleString()}</p>
              </div>
              <Building className="w-8 h-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 사용자 수</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.totalUsers.toLocaleString()}</p>
                <p className="text-sm text-green-600">활성: {systemStats.activeUsers.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 리포트 수</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.totalReports.toLocaleString()}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </Card>

          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">시스템 가동률</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.uptime}</p>
              </div>
              <Monitor className="w-8 h-8 text-indigo-600" />
            </div>
          </Card>
        </div>

        {/* 시스템 성능 지표 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">월간 성장률</h3>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">사용자 증가율</span>
                <span className="text-sm font-medium text-green-600">+{systemStats.monthlyGrowth}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">리포트 생성량</span>
                <span className="text-sm font-medium text-green-600">+24.5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">크레딧 사용량</span>
                <span className="text-sm font-medium text-green-600">+18.2%</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">크레딧 현황</h3>
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">총 사용량</span>
                <span className="text-sm font-medium">{systemStats.totalCreditsUsed.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">이번 달</span>
                <span className="text-sm font-medium">15,240</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">평균 단가</span>
                <span className="text-sm font-medium">7,900원</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">시스템 리소스</h3>
              <Server className="w-5 h-5 text-purple-600" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">CPU 사용률</span>
                <span className="text-sm font-medium text-green-600">65%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">메모리 사용률</span>
                <span className="text-sm font-medium text-yellow-600">78%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">디스크 사용률</span>
                <span className="text-sm font-medium text-green-600">42%</span>
              </div>
            </div>
          </Card>
        </div>

        {/* 조직 현황 테이블 */}
        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">주요 조직 현황</h3>
            <Button variant="outline" size="sm">
              전체 보기
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">조직명</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">회원 수</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">활성 사용자</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">크레딧 잔액</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">상태</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">관리</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org) => (
                  <tr key={org.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{org.name}</td>
                    <td className="py-3 px-4">{org.memberCount.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className="text-green-600">{org.activeUsers}</span>
                      <span className="text-gray-400">/{org.memberCount}</span>
                    </td>
                    <td className="py-3 px-4">{org.creditBalance.toLocaleString()}</td>
                    <td className="py-3 px-4">{getStatusBadge(org.status)}</td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm">
                        관리
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 최근 활동 */}
        <Card className="p-6 bg-white">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 시스템 활동</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-gray-600">10분 전</span>
              <span>삼성전자에서 120개의 새로운 리포트가 생성되었습니다.</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-gray-600">25분 전</span>
              <span>LG전자에 새로운 사용자 15명이 등록되었습니다.</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <DollarSign className="w-4 h-4 text-purple-600" />
              <span className="text-gray-600">1시간 전</span>
              <span>현대자동차에서 크레딧 5,000개를 구매했습니다.</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-gray-600">2시간 전</span>
              <span>시스템 백업이 완료되었습니다.</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
} 