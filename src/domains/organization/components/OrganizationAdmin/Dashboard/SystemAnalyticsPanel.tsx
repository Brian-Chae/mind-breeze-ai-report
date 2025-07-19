import React, { useState, useEffect } from 'react'
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
  Minus,
  Search,
  Filter,
  Eye,
  Award,
  Gauge,
  Sparkles
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
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadAnalyticsData()
  }, [selectedPeriod])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(loadAnalyticsData, 30000) // 30초마다 새로고침
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, selectedPeriod])

  const loadAnalyticsData = async () => {
    setLoading(true)
    try {
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
      console.error('분석 데이터 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="w-4 h-4 text-emerald-600" />
      case 'down':
        return <ArrowDown className="w-4 h-4 text-red-600" />
      case 'stable':
        return <Minus className="w-4 h-4 text-slate-600" />
    }
  }

  const getPerformanceColor = (value: number, type: 'response' | 'error' | 'load') => {
    switch (type) {
      case 'response':
        return value < 300 ? 'text-emerald-600' : value < 500 ? 'text-amber-600' : 'text-red-600'
      case 'error':
        return value < 2 ? 'text-emerald-600' : value < 5 ? 'text-amber-600' : 'text-red-600'
      case 'load':
        return value < 60 ? 'text-emerald-600' : value < 80 ? 'text-amber-600' : 'text-red-600'
      default:
        return 'text-slate-600'
    }
  }

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}초`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return `${minutes}분 ${remainingSeconds}초`
  }

  const filteredOrganizations = organizationComparison.filter(org =>
    org.organizationName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">분석 데이터 로드 중</h3>
              <p className="text-slate-600">잠시만 기다려주세요...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 헤더 */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full mb-4">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">시스템 분석</h1>
          <p className="text-lg text-slate-600">상세한 시스템 사용량 분석 및 조직 성과 비교</p>
        </div>

        {/* 제어 패널 */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex gap-2">
                {(['today', 'week', 'month', 'year'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    disabled={loading}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      selectedPeriod === period
                        ? 'bg-purple-500 text-white shadow-lg'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {period === 'today' ? '오늘' : 
                     period === 'week' ? '주간' :
                     period === 'month' ? '월간' : '연간'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                />
                자동 새로고침
              </label>
              
              <button
                onClick={loadAnalyticsData}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                새로고침
              </button>


            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-2">
          <div className="flex gap-2">
            {[
              { id: 'usage', label: '사용량 분석', icon: BarChart3 },
              { id: 'comparison', label: '조직 비교', icon: Target },
              { id: 'performance', label: '성능 지표', icon: Monitor }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        {/* 사용량 분석 탭 */}
        {activeTab === 'usage' && usageAnalytics && (
          <div className="space-y-8">
            {/* 통계 카드들 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* 측정 통계 */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Activity className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">측정 현황</p>
                    <p className="text-2xl font-bold text-slate-900">{usageAnalytics.measurements.total.toLocaleString()}</p>
                    <p className="text-xs text-emerald-600 mt-1">
                      성공률 {usageAnalytics.measurements.total > 0 
                        ? ((usageAnalytics.measurements.successful / usageAnalytics.measurements.total) * 100).toFixed(1) 
                        : 0}%
                    </p>
                  </div>
                </div>
              </div>

              {/* 리포트 통계 */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">리포트 현황</p>
                    <p className="text-2xl font-bold text-slate-900">{usageAnalytics.reports.generated.toLocaleString()}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      다운로드 {usageAnalytics.reports.downloaded.toLocaleString()}건
                    </p>
                  </div>
                </div>
              </div>

              {/* 사용자 통계 */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <Users className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">사용자 현황</p>
                    <p className="text-2xl font-bold text-slate-900">{usageAnalytics.users.active.toLocaleString()}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      신규 +{usageAnalytics.users.newRegistrations.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* 크레딧 통계 */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <DollarSign className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">크레딧 현황</p>
                    <p className="text-2xl font-bold text-slate-900">{usageAnalytics.credits.totalUsed.toLocaleString()}</p>
                    <p className="text-xs text-emerald-600 mt-1">
                      수익 {Math.round(usageAnalytics.credits.totalRevenue).toLocaleString()}원
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 성능 지표 */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">시스템 성능</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-3">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className={`text-2xl font-bold mb-1 ${getPerformanceColor(usageAnalytics.performance.averageResponseTime, 'response')}`}>
                    {Math.round(usageAnalytics.performance.averageResponseTime)}ms
                  </div>
                  <div className="text-sm text-slate-600">평균 응답시간</div>
                </div>

                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl mb-3">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className={`text-2xl font-bold mb-1 ${getPerformanceColor(usageAnalytics.performance.errorRate, 'error')}`}>
                    {usageAnalytics.performance.errorRate.toFixed(2)}%
                  </div>
                  <div className="text-sm text-slate-600">에러율</div>
                </div>

                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 rounded-xl mb-3">
                    <Gauge className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className={`text-2xl font-bold mb-1 ${getPerformanceColor(usageAnalytics.performance.systemLoad, 'load')}`}>
                    {Math.round(usageAnalytics.performance.systemLoad)}%
                  </div>
                  <div className="text-sm text-slate-600">시스템 부하</div>
                </div>

                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mb-3">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold mb-1 text-slate-900">
                    {usageAnalytics.performance.peakUsageHour}시
                  </div>
                  <div className="text-sm text-slate-600">피크 시간대</div>
                </div>
              </div>
            </div>

            {/* 추가 통계 정보 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-6">측정 세부 정보</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm font-medium text-slate-700">총 측정 횟수</span>
                    <span className="text-lg font-bold text-slate-900">{usageAnalytics.measurements.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm font-medium text-slate-700">성공한 측정</span>
                    <span className="text-lg font-bold text-emerald-600">{usageAnalytics.measurements.successful.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm font-medium text-slate-700">실패한 측정</span>
                    <span className="text-lg font-bold text-red-600">{usageAnalytics.measurements.failed.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm font-medium text-slate-700">평균 측정 시간</span>
                    <span className="text-lg font-bold text-slate-900">
                      {formatDuration(usageAnalytics.measurements.averageDuration)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-6">사용자 분석</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm font-medium text-slate-700">총 사용자 수</span>
                    <span className="text-lg font-bold text-slate-900">{usageAnalytics.users.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm font-medium text-slate-700">활성 사용자</span>
                    <span className="text-lg font-bold text-emerald-600">{usageAnalytics.users.active.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm font-medium text-slate-700">신규 등록자</span>
                    <span className="text-lg font-bold text-blue-600">+{usageAnalytics.users.newRegistrations.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm font-medium text-slate-700">이탈률</span>
                    <span className="text-lg font-bold text-red-600">{usageAnalytics.users.churnRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 조직 비교 탭 */}
        {activeTab === 'comparison' && (
          <div className="space-y-8">
            {/* 검색 */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="조직명으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 조직 비교 테이블 */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">조직 성과 비교</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">조직명</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">사용자 수</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">월간 측정</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">생성 리포트</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">활동 점수</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">참여율</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">성장률</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">순위</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredOrganizations.map((org, index) => (
                      <tr key={org.organizationId} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">{org.organizationName}</td>
                        <td className="px-6 py-4 text-slate-900">{org.metrics.usersCount.toLocaleString()}</td>
                        <td className="px-6 py-4 text-slate-900">{org.metrics.measurementsThisMonth.toLocaleString()}</td>
                        <td className="px-6 py-4 text-slate-900">{org.metrics.reportsGenerated.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-slate-900">{Math.round(org.metrics.activityScore)}</span>
                            <div className="w-16 bg-slate-200 rounded-full h-2">
                              <div 
                                className="h-full bg-purple-500 rounded-full transition-all"
                                style={{ width: `${org.metrics.activityScore}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-medium ${
                            org.metrics.engagementRate > 70 ? 'text-emerald-600' : 
                            org.metrics.engagementRate > 50 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {org.metrics.engagementRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getTrendIcon(org.trends.engagementTrend)}
                            <span className={`text-sm font-medium ${
                              org.trends.usageGrowth > 0 ? 'text-emerald-600' : 
                              org.trends.usageGrowth < 0 ? 'text-red-600' : 'text-slate-600'
                            }`}>
                              {org.trends.usageGrowth > 0 ? '+' : ''}{org.trends.usageGrowth.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                            index < 3 ? 'text-purple-700 bg-purple-50 border-purple-200' : 'text-slate-700 bg-slate-50 border-slate-200'
                          }`}>
                            #{org.ranking.overall}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredOrganizations.length === 0 && (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-full mb-4">
                      <Search className="w-6 h-6 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">조직을 찾을 수 없습니다</h3>
                    <p className="text-slate-600">검색 조건을 변경해보세요.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 성능 지표 탭 */}
        {activeTab === 'performance' && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                <Monitor className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">성능 모니터링</h3>
              <p className="text-slate-600 mb-6">실시간 시스템 성능 지표가 여기에 표시됩니다.</p>
              
              <div className="space-y-2 text-sm text-slate-500 mb-8">
                <p>• 실시간 성능 대시보드</p>
                <p>• 응답 시간 추적</p>
                <p>• 메모리 및 CPU 사용률</p>
                <p>• 네트워크 트래픽 분석</p>
                <p>• 알림 및 경고 시스템</p>
              </div>
              
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all">
                <Monitor className="w-4 h-4" />
                성능 모니터링 시작
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 