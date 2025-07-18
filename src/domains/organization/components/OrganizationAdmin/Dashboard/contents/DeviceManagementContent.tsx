import React, { useState, useEffect } from 'react'
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Battery, 
  BatteryLow, 
  Settings, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Zap, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Users,
  Building2,
  MapPin,
  Wrench,
  RefreshCw,
  Download,
  Upload,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Play,
  Pause,
  Square,
  RotateCcw,
  Gauge,
  Signal,
  HardDrive,
  Shield,
  Cpu,
  Monitor
} from 'lucide-react'
import systemAdminService, { 
  SystemDeviceOverview, 
  OrganizationDeviceBreakdown, 
  DeviceUsageAnalytics, 
  DeviceManagementAction 
} from '../../../../services/SystemAdminService'

export default function DeviceManagementContent() {
  const [systemOverview, setSystemOverview] = useState<SystemDeviceOverview | null>(null)
  const [selectedOrganization, setSelectedOrganization] = useState<string | null>(null)
  const [organizationBreakdown, setOrganizationBreakdown] = useState<OrganizationDeviceBreakdown | null>(null)
  const [usageAnalytics, setUsageAnalytics] = useState<DeviceUsageAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'overview' | 'organizations' | 'analytics' | 'management'>('overview')
  const [autoRefresh, setAutoRefresh] = useState(false)

  useEffect(() => {
    loadSystemOverview()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(loadSystemOverview, 30000) // 30초마다 새로고침
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const loadSystemOverview = async () => {
    setIsLoading(true)
    try {
      const overview = await systemAdminService.getSystemDeviceOverview()
      setSystemOverview(overview)
    } catch (error) {
      console.error('시스템 디바이스 현황 로드 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadOrganizationBreakdown = async (organizationId: string) => {
    try {
      const breakdown = await systemAdminService.getOrganizationDeviceBreakdown(organizationId)
      setOrganizationBreakdown(breakdown)
      setSelectedOrganization(organizationId)
      setActiveTab('organizations')
    } catch (error) {
      console.error('조직 디바이스 현황 로드 실패:', error)
    }
  }

  const loadUsageAnalytics = async (organizationId: string, timeRange: 'week' | 'month' | 'quarter' = 'month') => {
    try {
      const analytics = await systemAdminService.getDeviceUsageAnalytics(organizationId, timeRange)
      setUsageAnalytics(analytics)
      setActiveTab('analytics')
    } catch (error) {
      console.error('디바이스 사용 분석 로드 실패:', error)
    }
  }

  // 필터링된 조직 목록
  const filteredOrganizations = systemOverview?.organizationBreakdown.filter(org => {
    const matchesSearch = org.organizationName.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  }) || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-emerald-700 bg-emerald-50 border-emerald-200'
      case 'offline': return 'text-slate-700 bg-slate-50 border-slate-200'
      case 'maintenance': return 'text-amber-700 bg-amber-50 border-amber-200'
      case 'error': return 'text-red-700 bg-red-50 border-red-200'
      default: return 'text-slate-700 bg-slate-50 border-slate-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <Wifi className="w-4 h-4 text-emerald-600" />
      case 'offline': return <WifiOff className="w-4 h-4 text-slate-600" />
      case 'maintenance': return <Wrench className="w-4 h-4 text-amber-600" />
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />
      default: return <Smartphone className="w-4 h-4 text-slate-600" />
    }
  }

  const getDeviceTypeIcon = (type: string) => {
    switch (type) {
      case 'EEG': return <Activity className="w-4 h-4 text-purple-600" />
      case 'PPG': return <Zap className="w-4 h-4 text-red-600" />
      case 'MULTI_SENSOR': return <Gauge className="w-4 h-4 text-blue-600" />
      case 'WEARABLE': return <Smartphone className="w-4 h-4 text-emerald-600" />
      default: return <HardDrive className="w-4 h-4 text-slate-600" />
    }
  }

  const getBatteryIcon = (level: number) => {
    if (level > 20) {
      return <Battery className="w-4 h-4 text-emerald-600" />
    } else {
      return <BatteryLow className="w-4 h-4 text-red-600" />
    }
  }

  const getBatteryColor = (level: number) => {
    if (level > 60) return 'bg-emerald-500'
    if (level > 20) return 'bg-amber-500'
    return 'bg-red-500'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">디바이스 시스템 데이터 로드 중</h3>
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">디바이스 시스템 관리</h1>
          <p className="text-lg text-slate-600">전체 LINK BAND 디바이스 현황 모니터링 및 관리</p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-2">
          <div className="flex gap-2">
            {[
              { id: 'overview', label: '전체 현황', icon: Monitor },
              { id: 'organizations', label: '기업별 현황', icon: Building2 },
              { id: 'analytics', label: '사용 분석', icon: BarChart3 },
              { id: 'management', label: '디바이스 관리', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 전체 현황 탭 */}
        {activeTab === 'overview' && systemOverview && (
          <div className="space-y-8">
            {/* 제어 패널 */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="조직명으로 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2.5 w-64 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    자동 새로고침
                  </label>
                  
                  <button
                    onClick={loadSystemOverview}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    새로고침
                  </button>
                </div>
              </div>
            </div>

            {/* 전체 요약 통계 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Smartphone className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">총 디바이스</p>
                    <p className="text-2xl font-bold text-slate-900">{systemOverview.totalDevices}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <Wifi className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">활성 디바이스</p>
                    <p className="text-2xl font-bold text-slate-900">{systemOverview.activeDevices}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-100 rounded-xl">
                    <WifiOff className="w-6 h-6 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">오프라인 디바이스</p>
                    <p className="text-2xl font-bold text-slate-900">{systemOverview.offlineDevices}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">주의 필요</p>
                    <p className="text-2xl font-bold text-slate-900">{systemOverview.devicesNeedingAttention}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 디바이스 타입별 분포 */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">디바이스 타입별 분포</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {systemOverview.deviceTypeBreakdown.map((type) => (
                  <div key={type.type} className="bg-slate-50 p-4 rounded-xl text-center">
                    <div className="flex justify-center mb-3">
                      <div className="p-2 bg-white rounded-lg">
                        {getDeviceTypeIcon(type.type)}
                      </div>
                    </div>
                    <div className="font-semibold text-slate-900">{type.type}</div>
                    <div className="text-2xl font-bold text-slate-900 my-2">{type.count}</div>
                    <div className="text-sm text-slate-600">
                      활성: {type.activeCount} ({type.percentage}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 조직별 현황 */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">조직별 디바이스 현황</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredOrganizations.map((org) => (
                  <div key={org.organizationId} className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                       onClick={() => loadOrganizationBreakdown(org.organizationId)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{org.organizationName}</div>
                          <div className="text-sm text-slate-600">
                            총 {org.totalDevices}대 | 활성 {org.activeDevices}대
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getBatteryIcon(org.averageBatteryLevel)}
                          <span className="text-sm font-medium text-slate-900">{org.averageBatteryLevel}%</span>
                        </div>
                        {org.errorDevices > 0 && (
                          <span className="inline-flex items-center px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium border border-red-200">
                            에러 {org.errorDevices}대
                          </span>
                        )}
                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                          <Eye className="w-4 h-4 text-slate-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 최근 활동 */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">최근 디바이스 활동</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {systemOverview.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border-b border-slate-100 last:border-b-0">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(activity.action)}
                      <div>
                        <div className="font-medium text-slate-900">{activity.deviceName}</div>
                        <div className="text-sm text-slate-600">
                          {activity.organizationName} | {activity.action}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-slate-500">
                      {activity.timestamp.toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 기업별 현황 탭 */}
        {activeTab === 'organizations' && (
          <>
            {organizationBreakdown ? (
              <div className="space-y-8">
                {/* 헤더 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{organizationBreakdown.organizationName}</h2>
                      <p className="text-slate-600">{organizationBreakdown.companyCode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                      organizationBreakdown.healthScore > 80 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 
                      organizationBreakdown.healthScore > 60 ? 'text-amber-700 bg-amber-50 border-amber-200' : 
                      'text-red-700 bg-red-50 border-red-200'
                    }`}>
                      건강점수: {organizationBreakdown.healthScore}/100
                    </span>
                    <button
                      onClick={() => {
                        setOrganizationBreakdown(null)
                        setActiveTab('overview')
                      }}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      목록으로
                    </button>
                  </div>
                </div>

                {/* 디바이스 상태 통계 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 text-center hover:shadow-xl transition-shadow">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-xl mb-3">
                      <Wifi className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{organizationBreakdown.deviceStats.online}</div>
                    <div className="text-sm text-slate-600">온라인</div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 text-center hover:shadow-xl transition-shadow">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-xl mb-3">
                      <WifiOff className="w-6 h-6 text-slate-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{organizationBreakdown.deviceStats.offline}</div>
                    <div className="text-sm text-slate-600">오프라인</div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 text-center hover:shadow-xl transition-shadow">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 rounded-xl mb-3">
                      <Wrench className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{organizationBreakdown.deviceStats.maintenance}</div>
                    <div className="text-sm text-slate-600">유지보수</div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 text-center hover:shadow-xl transition-shadow">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl mb-3">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{organizationBreakdown.deviceStats.error}</div>
                    <div className="text-sm text-slate-600">에러</div>
                  </div>
                </div>

                {/* 부서별 디바이스 할당 */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-6">부서별 디바이스 할당 현황</h3>
                  <div className="space-y-4">
                    {organizationBreakdown.departmentBreakdown.map((dept) => (
                      <div key={dept.departmentId} className="p-4 bg-slate-50 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg">
                              <MapPin className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{dept.departmentName}</div>
                              <div className="text-sm text-slate-600">
                                할당: {dept.assignedDevices}대 | 활성: {dept.activeDevices}대
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-24 bg-slate-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all" 
                                style={{ width: `${dept.utilizationRate}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold text-slate-900 w-12">{dept.utilizationRate}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 최근 디바이스 활동 */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-6">최근 디바이스 활동</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {organizationBreakdown.recentDeviceActivity.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border-b border-slate-100 last:border-b-0">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(activity.action)}
                          <div>
                            <div className="font-medium text-slate-900">{activity.deviceName}</div>
                            <div className="text-sm text-slate-600">
                              {activity.userName} | {activity.action}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-slate-500">
                          {activity.timestamp.toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-32">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                    <Building2 className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">조직을 선택해주세요</h3>
                  <p className="text-slate-600">전체 현황 탭에서 조직을 선택하여 상세 현황을 확인하세요</p>
                  <button
                    onClick={() => setActiveTab('overview')}
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                  >
                    전체 현황 보기
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* 사용 분석 탭 */}
        {activeTab === 'analytics' && (
          <>
            {usageAnalytics ? (
              <div className="space-y-8">
                {/* 사용 지표 요약 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 text-center hover:shadow-xl transition-shadow">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-3">
                      <Activity className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{usageAnalytics.usageMetrics.totalSessions}</div>
                    <div className="text-sm text-slate-600">총 세션</div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 text-center hover:shadow-xl transition-shadow">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-xl mb-3">
                      <Clock className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{usageAnalytics.usageMetrics.averageSessionDuration}분</div>
                    <div className="text-sm text-slate-600">평균 세션 시간</div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 text-center hover:shadow-xl transition-shadow">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mb-3">
                      <HardDrive className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{usageAnalytics.usageMetrics.totalDataCollected}MB</div>
                    <div className="text-sm text-slate-600">수집 데이터</div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 text-center hover:shadow-xl transition-shadow">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-xl mb-3">
                      <Users className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{usageAnalytics.userEngagement.length}</div>
                    <div className="text-sm text-slate-600">활성 사용자</div>
                  </div>
                </div>

                {/* 디바이스 성능 */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-6">디바이스 성능 분석</h3>
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {usageAnalytics.devicePerformance.map((device) => (
                      <div key={device.deviceId} className="p-4 border border-slate-200 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Smartphone className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{device.deviceName}</div>
                              <div className="text-sm text-slate-600">{device.serialNumber}</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-6 text-center text-sm">
                            <div>
                              <div className="font-semibold text-slate-900">{device.sessionCount}</div>
                              <div className="text-slate-600">세션</div>
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{device.totalUptime}h</div>
                              <div className="text-slate-600">가동시간</div>
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{device.errorRate}%</div>
                              <div className="text-slate-600">에러율</div>
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{device.batteryPerformance}%</div>
                              <div className="text-slate-600">배터리</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-32">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                    <BarChart3 className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">조직을 선택해주세요</h3>
                  <p className="text-slate-600">전체 현황 탭에서 조직을 선택하여 사용 분석을 확인하세요</p>
                  <button
                    onClick={() => setActiveTab('overview')}
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                  >
                    전체 현황 보기
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* 디바이스 관리 탭 */}
        {activeTab === 'management' && (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                <Settings className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">디바이스 관리 기능</h3>
              <p className="text-slate-600 mb-6">펌웨어 업데이트, 유지보수 스케줄링, 디바이스 재할당 등의 고급 관리 기능</p>
              
              <div className="space-y-2 text-sm text-slate-500 mb-8">
                <p>• 펌웨어 일괄 업데이트</p>
                <p>• 유지보수 스케줄 관리</p>
                <p>• 디바이스 재할당 및 이동</p>
                <p>• 원격 진단 및 재부팅</p>
                <p>• 캘리브레이션 관리</p>
              </div>
              
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all">
                <Settings className="w-4 h-4" />
                관리 기능 실행
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 