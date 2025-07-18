import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card'
import { Button } from '@shared/components/ui/button'
import { Badge } from '@shared/components/ui/badge'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity, 
  Clock, 
  Zap, 
  DollarSign,
  Monitor,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Download,
  Calendar,
  Target,
  Layers,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'
import systemAdminService, { 
  UsageAnalytics, 
  OrganizationComparison, 
  SystemStats 
} from '../../../services/SystemAdminService'

interface SystemAnalyticsPanelProps {
  systemStats: SystemStats
}

export default function SystemAnalyticsPanel({ systemStats }: SystemAnalyticsPanelProps) {
  const [loading, setLoading] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<UsageAnalytics['period']>('month')
  const [usageAnalytics, setUsageAnalytics] = useState<UsageAnalytics | null>(null)
  const [organizationComparison, setOrganizationComparison] = useState<OrganizationComparison[]>([])
  const [activeTab, setActiveTab] = useState<'usage' | 'comparison' | 'performance'>('usage')

  useEffect(() => {
    loadAnalyticsData()
  }, [selectedPeriod])

  const loadAnalyticsData = async () => {
    setLoading(true)
    try {
      console.log('📊 분석 데이터 로딩 시작...', selectedPeriod)
      
      // 임시 데이터 생성
      await new Promise(resolve => setTimeout(resolve, 1000))
      
             setUsageAnalytics({
         period: selectedPeriod,
         measurements: {
           total: 15420,
           successful: 14980,
           failed: 440,
           averageDuration: 145.5
         },
         reports: {
           total: 8450,
           generated: 8450,
           downloaded: 7200,
           shared: 1800
         },
         users: {
           total: 1250,
           active: 980,
           newRegistrations: 125,
           churnRate: 2.3
         },
         credits: {
           totalUsed: 125000,
           averagePerReport: 14.8,
           totalRevenue: 1850000,
           topSpendingOrganizations: [
             { organizationId: '1', organizationName: 'ABC 헬스케어', creditsUsed: 15000, revenue: 225000 },
             { organizationId: '2', organizationName: 'XYZ 웰니스', creditsUsed: 12000, revenue: 180000 },
             { organizationId: '3', organizationName: 'DEF 메디컬', creditsUsed: 18000, revenue: 270000 }
           ]
         },
         performance: {
           averageResponseTime: 235,
           errorRate: 1.2,
           systemLoad: 68,
           peakUsageHour: 14
         }
       })

             setOrganizationComparison([
         {
           organizationId: '1',
           organizationName: 'ABC 헬스케어',
           metrics: {
             usersCount: 150,
             measurementsThisMonth: 2400,
             reportsGenerated: 890,
             creditsUsed: 15000,
             activityScore: 85,
             engagementRate: 78.5,
             averageSessionLength: 25.8
           },
           trends: {
             userGrowth: 8.5,
             usageGrowth: 12.5,
             engagementTrend: 'up' as const
           },
           ranking: { 
             overall: 1,
             byActivity: 1,
             byUsage: 2,
             byEngagement: 1
           }
         },
         {
           organizationId: '2',
           organizationName: 'XYZ 웰니스',
           metrics: {
             usersCount: 89,
             measurementsThisMonth: 1580,
             reportsGenerated: 520,
             creditsUsed: 12000,
             activityScore: 72,
             engagementRate: 65.8,
             averageSessionLength: 22.3
           },
           trends: {
             userGrowth: 5.2,
             usageGrowth: 8.2,
             engagementTrend: 'up' as const
           },
           ranking: { 
             overall: 2,
             byActivity: 3,
             byUsage: 3,
             byEngagement: 2
           }
         },
         {
           organizationId: '3',
           organizationName: 'DEF 메디컬',
           metrics: {
             usersCount: 200,
             measurementsThisMonth: 3200,
             reportsGenerated: 1100,
             creditsUsed: 18000,
             activityScore: 91,
             engagementRate: 82.3,
             averageSessionLength: 28.5
           },
           trends: {
             userGrowth: 12.7,
             usageGrowth: 15.7,
             engagementTrend: 'up' as const
           },
           ranking: { 
             overall: 3,
             byActivity: 2,
             byUsage: 1,
             byEngagement: 3
           }
         }
       ])

    } catch (error) {
      console.error('❌ 분석 데이터 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="w-4 h-4 text-green-600" />
      case 'down':
        return <ArrowDown className="w-4 h-4 text-red-600" />
      case 'stable':
        return <Minus className="w-4 h-4 text-gray-600" />
    }
  }

  const getPerformanceColor = (value: number, type: 'response' | 'error' | 'load') => {
    switch (type) {
      case 'response':
        return value < 300 ? 'text-green-600' : value < 500 ? 'text-yellow-600' : 'text-red-600'
      case 'error':
        return value < 2 ? 'text-green-600' : value < 5 ? 'text-yellow-600' : 'text-red-600'
      case 'load':
        return value < 60 ? 'text-green-600' : value < 80 ? 'text-yellow-600' : 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}초`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return `${minutes}분 ${remainingSeconds}초`
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">시스템 분석</h1>
          <p className="text-gray-600 mt-1">상세한 시스템 사용량 분석 및 조직 성과 비교</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            리포트 다운로드
          </Button>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex space-x-1 bg-white rounded-lg p-1 border border-gray-200">
        <button
          onClick={() => setActiveTab('usage')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'usage'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-2" />
          사용량 분석
        </button>
        <button
          onClick={() => setActiveTab('comparison')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'comparison'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Target className="w-4 h-4 inline mr-2" />
          조직 비교
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'performance'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Monitor className="w-4 h-4 inline mr-2" />
          성능 지표
        </button>
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">분석 데이터를 불러오는 중...</span>
        </div>
      )}

      {/* 탭 콘텐츠 */}
      {!loading && (
        <>
          {/* 사용량 분석 탭 */}
          {activeTab === 'usage' && usageAnalytics && (
            <div className="space-y-6">
              {/* 기간 선택 */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">사용량 분석</h3>
                <div className="flex items-center space-x-2">
                  {(['today', 'week', 'month', 'year'] as const).map((period) => (
                    <Button
                      key={period}
                      variant={selectedPeriod === period ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedPeriod(period)}
                      disabled={loading}
                    >
                      {period === 'today' ? '오늘' : 
                       period === 'week' ? '주간' :
                       period === 'month' ? '월간' : '연간'}
                    </Button>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadAnalyticsData}
                    disabled={loading}
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>

              {/* 통계 카드들 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 측정 통계 */}
                <Card className="bg-white border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-gray-600">측정 현황</h4>
                      <Activity className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">총 측정</span>
                        <span className="text-sm font-medium text-gray-900">{usageAnalytics.measurements.total.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">성공률</span>
                        <span className="text-sm font-medium text-green-600">
                          {usageAnalytics.measurements.total > 0 
                            ? ((usageAnalytics.measurements.successful / usageAnalytics.measurements.total) * 100).toFixed(1) 
                            : 0}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">평균 시간</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatDuration(usageAnalytics.measurements.averageDuration)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 리포트 통계 */}
                <Card className="bg-white border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-gray-600">리포트 현황</h4>
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">생성</span>
                        <span className="text-sm font-medium text-gray-900">{usageAnalytics.reports.generated.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">다운로드</span>
                        <span className="text-sm font-medium text-gray-900">{usageAnalytics.reports.downloaded.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">공유</span>
                        <span className="text-sm font-medium text-gray-900">{usageAnalytics.reports.shared.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 사용자 통계 */}
                <Card className="bg-white border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-gray-600">사용자 현황</h4>
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">활성 사용자</span>
                        <span className="text-sm font-medium text-gray-900">{usageAnalytics.users.active.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">신규 등록</span>
                        <span className="text-sm font-medium text-blue-600">
                          +{usageAnalytics.users.newRegistrations.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">이탈률</span>
                        <span className="text-sm font-medium text-red-600">
                          {usageAnalytics.users.churnRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 크레딧 통계 */}
                <Card className="bg-white border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-gray-600">크레딧 현황</h4>
                      <DollarSign className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">총 사용</span>
                        <span className="text-sm font-medium text-gray-900">{usageAnalytics.credits.totalUsed.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">리포트당</span>
                        <span className="text-sm font-medium text-gray-900">{Math.round(usageAnalytics.credits.averagePerReport)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">총 수익</span>
                        <span className="text-sm font-medium text-green-600">
                          {Math.round(usageAnalytics.credits.totalRevenue).toLocaleString()}원
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 성능 지표 */}
              <Card className="bg-white border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">시스템 성능</h4>
                    <Monitor className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-1">
                        <span className={getPerformanceColor(usageAnalytics.performance.averageResponseTime, 'response')}>
                          {Math.round(usageAnalytics.performance.averageResponseTime)}ms
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">평균 응답시간</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-1">
                        <span className={getPerformanceColor(usageAnalytics.performance.errorRate, 'error')}>
                          {usageAnalytics.performance.errorRate.toFixed(2)}%
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">에러율</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-1">
                        <span className={getPerformanceColor(usageAnalytics.performance.systemLoad, 'load')}>
                          {Math.round(usageAnalytics.performance.systemLoad)}%
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">시스템 부하</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-1 text-purple-600">
                        {usageAnalytics.performance.peakUsageHour}시
                      </div>
                      <div className="text-sm text-gray-600">피크 시간대</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 조직 비교 탭 */}
          {activeTab === 'comparison' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">조직 성과 비교</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadAnalyticsData}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  새로고침
                </Button>
              </div>

              <Card className="bg-white border border-gray-200">
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-700">조직명</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">사용자 수</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">월간 측정</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">생성 리포트</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">활동 점수</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">참여율</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">성장률</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">순위</th>
                        </tr>
                      </thead>
                      <tbody>
                        {organizationComparison.map((org, index) => (
                          <tr key={org.organizationId} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium text-gray-900">{org.organizationName}</td>
                            <td className="py-3 px-4 text-gray-900">{org.metrics.usersCount.toLocaleString()}</td>
                            <td className="py-3 px-4 text-gray-900">{org.metrics.measurementsThisMonth.toLocaleString()}</td>
                            <td className="py-3 px-4 text-gray-900">{org.metrics.reportsGenerated.toLocaleString()}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">{Math.round(org.metrics.activityScore)}</span>
                                <div className="w-16 h-2 bg-gray-200 rounded">
                                  <div 
                                    className="h-full bg-blue-600 rounded"
                                    style={{ width: `${org.metrics.activityScore}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`font-medium ${
                                org.metrics.engagementRate > 70 ? 'text-green-600' : 
                                org.metrics.engagementRate > 50 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {org.metrics.engagementRate.toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-1">
                                {getTrendIcon(org.trends.engagementTrend)}
                                <span className={`text-sm font-medium ${
                                  org.trends.usageGrowth > 0 ? 'text-green-600' : 
                                  org.trends.usageGrowth < 0 ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                  {org.trends.usageGrowth > 0 ? '+' : ''}{org.trends.usageGrowth.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={index < 3 ? 'default' : 'secondary'}>
                                #{org.ranking.overall}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 성능 지표 탭 */}
          {activeTab === 'performance' && (
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-8">
                <div className="text-center py-8">
                  <Monitor className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">성능 모니터링</h3>
                  <p className="text-gray-600">실시간 시스템 성능 지표가 여기에 표시됩니다.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
} 