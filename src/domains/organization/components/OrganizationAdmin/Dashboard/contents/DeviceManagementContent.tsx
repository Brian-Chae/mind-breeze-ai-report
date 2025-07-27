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
  Monitor,
  Table,
  Phone,
  Mail,
  User,
  Package
} from 'lucide-react'
import systemAdminService, { 
  SystemDeviceOverview, 
  OrganizationDeviceBreakdown, 
  DeviceUsageAnalytics, 
  DeviceManagementAction 
} from '../../../../services/SystemAdminService'
import serviceManagementService from '../../../../services/ServiceManagementService'
import DeviceInventorySection from '../../Devices/DeviceInventorySection'
import SalesManagementTab from '../components/SalesManagementTab'
import { 
  ServiceRequest, 
  ServiceStatistics, 
  ServiceRequestStatus,
  UrgencyLevel
} from '../../../../types/device'

export default function DeviceManagementContent() {
  const [systemOverview, setSystemOverview] = useState<SystemDeviceOverview | null>(null)
  const [selectedOrganization, setSelectedOrganization] = useState<string | null>(null)
  const [organizationBreakdown, setOrganizationBreakdown] = useState<OrganizationDeviceBreakdown | null>(null)
  const [topOrganizations, setTopOrganizations] = useState<Array<{
    name: string
    usageHours: number
    utilizationRate: number
    devices: number
  }>>([])
  const [isLoadingTopOrgs, setIsLoadingTopOrgs] = useState(false)
  const [usageAnalytics, setUsageAnalytics] = useState<DeviceUsageAnalytics | null>(null)
  const [deviceUsageStats, setDeviceUsageStats] = useState<{
    assignedDevicesCount: number
    totalMeasurements: number
    averageMeasurementsPerDevice: number
    todayUsedDevicesCount: number
  }>({
    assignedDevicesCount: 0,
    totalMeasurements: 0,
    averageMeasurementsPerDevice: 0,
    todayUsedDevicesCount: 0
  })
  
  // A/S 관련 상태
  const [serviceStatistics, setServiceStatistics] = useState<ServiceStatistics | null>(null)
  const [pendingRequests, setPendingRequests] = useState<ServiceRequest[]>([])
  const [inProgressRequests, setInProgressRequests] = useState<ServiceRequest[]>([])
  const [completedRequests, setCompletedRequests] = useState<ServiceRequest[]>([])
  const [serviceTabView, setServiceTabView] = useState<'pending' | 'inProgress' | 'completed'>('pending')
  
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'usage' | 'rental' | 'sales' | 'service'>('overview')
  const [rentalAutoRefresh, setRentalAutoRefresh] = useState(false)
  const [salesAutoRefresh, setSalesAutoRefresh] = useState(false)
  
  // 기기별 사용 현황 상태
  const [deviceUsageList, setDeviceUsageList] = useState<Array<{
    deviceId: string
    deviceName: string
    deviceType: string
    organizationName: string
    usageType: 'purchase' | 'rental'
    rentalPeriod?: number
    totalMeasurements: number
    lastUsedDate: Date
    status: 'active' | 'inactive' | 'maintenance'
  }>>([])
  const [usageLoading, setUsageLoading] = useState(false)

  // 렌탈 관련 상태
  const [rentalStats, setRentalStats] = useState({
    totalContracts: 0,
    activeRentals: 0,
    scheduledReturns: 0,
    overdueRentals: 0,
    monthlyRevenue: 0,
    returnedThisWeek: 0
  })
  
  const [scheduledReturns, setScheduledReturns] = useState<Array<{
    id: string
    deviceId: string
    organization: string
    contact: string
    contactPhone?: string
    scheduledDate: Date
    daysUntil: number
    isOverdue: boolean
  }>>([])
  
  const [rentalLoading, setRentalLoading] = useState(false)

  useEffect(() => {
    loadSystemOverview()
    loadServiceData()
    loadDeviceUsageList()
    loadTopOrganizations()
    loadDeviceUsageStats()
    loadRentalData()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (rentalAutoRefresh && activeTab === 'overview') {
      interval = setInterval(loadSystemOverview, 30000) // 30초마다 새로고침
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [rentalAutoRefresh, activeTab])

  // 렌탈 자동 새로고침
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (rentalAutoRefresh && activeTab === 'rental') {
      interval = setInterval(() => {
        loadRentalData()
      }, 5000) // 5초마다 새로고침
    }
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [rentalAutoRefresh, activeTab])

  const loadSystemOverview = async () => {
    setIsLoading(true)
    try {
      const overview = await systemAdminService.getSystemDeviceOverview()
      setSystemOverview(overview)
    } catch (error) {
      console.error('시스템 디바이스 현황 로드 실패:', error)
      // 기본값 설정으로 UI가 정상 작동하도록 함
      setSystemOverview({
        totalDevices: 0,
        activeDevices: 0,
        offlineDevices: 0,
        maintenanceDevices: 0,
        errorDevices: 0,
        averageBatteryLevel: 0,
        devicesNeedingAttention: 0,
        organizationBreakdown: [],
        deviceTypeBreakdown: [],
        recentActivity: []
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 조직별 통계 로드
  const loadTopOrganizations = async () => {
    setIsLoadingTopOrgs(true)
    try {
      const topOrgStats = await systemAdminService.getTopOrganizationUsageStats()
      setTopOrganizations(topOrgStats)
    } catch (error) {
      console.error('조직별 통계 로드 실패:', error)
    } finally {
      setIsLoadingTopOrgs(false)
    }
  }

  // 디바이스 사용 통계 로드
  const loadDeviceUsageStats = async () => {
    try {
      const stats = await systemAdminService.getDeviceUsageStatsSummary()
      setDeviceUsageStats(stats)
    } catch (error) {
      console.error('디바이스 사용 통계 로드 실패:', error)
    }
  }

  const loadRentalData = async () => {
    setRentalLoading(true)
    try {
      // 렌탈 통계 조회
      const stats = await systemAdminService.getRentalStatistics()
      console.log('[DEBUG] 렌탈 통계:', stats)
      setRentalStats(stats)
      
      // 회수 일정 조회
      const returns = await systemAdminService.getScheduledReturns()
      console.log('[DEBUG] 회수 일정 데이터:', returns)
      console.log('[DEBUG] 회수 일정 데이터 길이:', returns.length)
      setScheduledReturns(returns)
    } catch (error) {
      console.error('렌탈 데이터 로드 실패:', error)
    } finally {
      setRentalLoading(false)
    }
  }

  // 렌탈 회수 처리
  const handleRentalReturn = async (deviceId: string) => {
    try {
      setRentalLoading(true)
      
      // 회수 처리
      await systemAdminService.processRentalReturn(deviceId, {
        actualReturnDate: new Date(),
        returnCondition: '정상',
        returnNotes: '시스템에서 회수 처리됨'
      })
      
      // 데이터 다시 로드
      await loadRentalData()
      
      alert('렌탈 회수 처리가 완료되었습니다.')
    } catch (error) {
      console.error('렌탈 회수 처리 실패:', error)
      alert(`렌탈 회수 처리에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      setRentalLoading(false)
    }
  }

  const loadOrganizationBreakdown = async (organizationId: string) => {
    try {
      const breakdown = await systemAdminService.getOrganizationDeviceBreakdown(organizationId)
      setOrganizationBreakdown(breakdown)
      setSelectedOrganization(organizationId)
      setActiveTab('assignment')
    } catch (error) {
      console.error('조직 디바이스 현황 로드 실패:', error)
    }
  }

  const loadUsageAnalytics = async (organizationId: string, timeRange: 'week' | 'month' | 'quarter' = 'month') => {
    try {
      const analytics = await systemAdminService.getDeviceUsageAnalytics(organizationId, timeRange)
      setUsageAnalytics(analytics)
      setActiveTab('usage')
    } catch (error) {
      console.error('디바이스 사용 분석 로드 실패:', error)
    }
  }

  // 기기별 사용 현황 로드
  const loadDeviceUsageList = async () => {
    setUsageLoading(true)
    try {
      const deviceUsageData = await systemAdminService.getDeviceUsageStatusList()
      setDeviceUsageList(deviceUsageData)
    } catch (error) {
      console.error('기기별 사용 현황 로드 실패:', error)
      setDeviceUsageList([])
    } finally {
      setUsageLoading(false)
    }
  }

  // A/S 데이터 로드
  const loadServiceData = async () => {
    try {
      const [statistics, pending, inProgress, completed] = await Promise.all([
        serviceManagementService.getServiceStatistics(),
        serviceManagementService.getServiceRequestsByStatus('PENDING'),
        serviceManagementService.getServiceRequestsByStatus('IN_PROGRESS'),
        serviceManagementService.getServiceRequestsByStatus('COMPLETED')
      ])
      
      setServiceStatistics(statistics)
      setPendingRequests(pending)
      setInProgressRequests(inProgress)
      setCompletedRequests(completed)
    } catch (error) {
      console.error('A/S 데이터 로드 실패:', error)
      // 기본값 설정으로 UI가 정상 작동하도록 함
      setServiceStatistics({
        totalRequests: 0,
        pendingRequests: 0,
        inProgressRequests: 0,
        completedRequests: 0,
        averageResolutionTime: 0,
        urgentRequests: 0,
        monthlyRequestTrend: [],
        topIssueTypes: []
      })
      setPendingRequests([])
      setInProgressRequests([])
      setCompletedRequests([])
    }
  }

  // 필터링된 조직 목록
  const filteredOrganizations = systemOverview?.organizationBreakdown?.filter(org => {
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

  // 재고 관리 탭 렌더링
  const renderInventoryTab = () => (
    <DeviceInventorySection />
  )

  // 사용 현황 탭 렌더링
  const renderUsageTab = () => {
    // 실제 Firebase 데이터 사용
    const usageStats = deviceUsageStats;

    // 실제 Firebase 데이터에서 가져온 조직별 통계 사용

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">사용 현황</h2>
              <p className="text-slate-600 mt-1">디바이스 사용 통계 및 분석</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  loadSystemOverview()
                  loadTopOrganizations()
                  loadDeviceUsageStats()
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingTopOrgs ? 'animate-spin' : ''}`} />
                새로고침
              </button>
            </div>
          </div>

          {/* 사용 통계 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 rounded-xl">
                  <Smartphone className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-indigo-700">활성 디바이스 수</p>
                  <p className="text-2xl font-bold text-indigo-900">{usageStats.assignedDevicesCount || 0}</p>
                  <p className="text-xs text-indigo-600">총 배정된 디바이스</p>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <Activity className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-700">총 측정 횟수</p>
                  <p className="text-2xl font-bold text-emerald-900">{usageStats.totalMeasurements?.toLocaleString() || 0}</p>
                  <p className="text-xs text-emerald-600">누적 측정 횟수</p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-700">기기당 평균 측정</p>
                  <p className="text-2xl font-bold text-amber-900">{usageStats.averageMeasurementsPerDevice || 0}회</p>
                  <p className="text-xs text-amber-600">디바이스당 평균</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700">오늘 사용된 디바이스</p>
                  <p className="text-2xl font-bold text-blue-900">{usageStats.todayUsedDevicesCount || 0}</p>
                  <p className="text-xs text-blue-600">오늘 측정 기록</p>
                </div>
              </div>
            </div>
          </div>

          {/* TOP 5 조직별 사용 현황 */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              TOP 5 조직별 사용 현황
            </h3>
            <div className="space-y-3">
              {isLoadingTopOrgs ? (
                <div className="bg-white rounded-lg p-4 text-center text-slate-500">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                  조직별 통계를 불러오는 중...
                </div>
              ) : topOrganizations.length === 0 ? (
                <div className="bg-white rounded-lg p-4 text-center text-slate-500">
                  조직별 사용 데이터가 없습니다.
                </div>
              ) : (
                topOrganizations.map((org, index) => (
                  <div key={org.name} className="bg-white rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-slate-400' :
                        index === 2 ? 'bg-amber-600' :
                        'bg-slate-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{org.name}</h4>
                        <p className="text-sm text-slate-600">{org.devices}개 디바이스</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{org.usageHours}시간</p>
                      <p className={`text-sm ${org.utilizationRate >= 85 ? 'text-green-600' : org.utilizationRate >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                        가동률 {org.utilizationRate}%
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 기기별 사용 현황 테이블 */}
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Table className="w-5 h-5 text-indigo-600" />
                기기별 사용 현황
              </h3>
              <button 
                onClick={loadDeviceUsageList}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                새로고침
              </button>
            </div>
            
            {usageLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-indigo-600 mr-2" />
                <span className="text-slate-600">데이터를 불러오는 중...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-medium text-slate-900">기기명</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-900">기기종류</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-900">사용 기업명</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-900">사용 방식</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-900">총 측정횟수</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-900">최근 사용일</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-900">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deviceUsageList.length > 0 ? (
                      deviceUsageList.map((device) => (
                        <tr key={device.deviceId} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Smartphone className="h-4 w-4 text-indigo-600" />
                              <span className="font-medium text-slate-900">{device.deviceName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                              {device.deviceType}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-slate-400" />
                              <span className="text-slate-700">{device.organizationName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              {device.usageType === 'purchase' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                  구매
                                </span>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    렌탈
                                  </span>
                                  <span className="text-xs text-slate-600">
                                    {device.rentalPeriod}개월
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <Activity className="h-4 w-4 text-purple-600" />
                              <span className="font-medium text-slate-900">
                                {device.totalMeasurements}회
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              <span className="text-slate-700">
                                {device.lastUsedDate.toLocaleDateString('ko-KR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              device.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                              device.status === 'maintenance' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-800'
                            }`}>
                              {device.status === 'active' ? '활성' :
                               device.status === 'maintenance' ? '유지보수' : '비활성'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          사용 현황 데이터가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 렌탈 관리 탭 렌더링
  const renderRentalTab = () => {

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-900">렌탈 관리</h2>
                {rentalAutoRefresh && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                    5초마다 자동 새로고침
                  </div>
                )}
              </div>
              <p className="text-slate-600 mt-1">렌탈 디바이스 회수 및 스케줄 관리</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setRentalAutoRefresh(!rentalAutoRefresh)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  rentalAutoRefresh 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                {rentalAutoRefresh ? (
                  <>
                    <Pause className="w-4 h-4" />
                    자동새로고침 중지
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    자동새로고침 시작
                  </>
                )}
              </button>
              <button 
                onClick={() => loadRentalData()}
                className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
                disabled={rentalLoading}
              >
                <RefreshCw className={`w-4 h-4 ${rentalLoading ? 'animate-spin' : ''}`} />
                새로고침
              </button>
              <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                회수 일정 추가
              </button>
            </div>
          </div>

          {rentalLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-orange-600 mr-3" />
              <span className="text-slate-600 text-lg">렌탈 데이터를 불러오는 중...</span>
            </div>
          ) : (
            <>
          {/* 렌탈 현황 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">총 렌탈</p>
                  <p className="text-2xl font-bold text-orange-900">{rentalStats.totalContracts}</p>
                </div>
                <RefreshCw className="w-8 h-8 text-orange-600" />
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">정상 반납</p>
                  <p className="text-2xl font-bold text-green-900">{(rentalStats.totalContracts || 0) - (rentalStats.overdueRentals || 0)}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">연체</p>
                  <p className="text-2xl font-bold text-red-900">{rentalStats.overdueRentals}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">이번 주 회수</p>
                  <p className="text-2xl font-bold text-blue-900">{rentalStats.scheduledReturns}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* 렌탈 수익 현황 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                이번 달 렌탈 수익
              </h3>
              <div className="text-3xl font-bold text-green-900 mb-2">
                ₩{rentalStats.monthlyRevenue.toLocaleString()}
              </div>
              <p className="text-sm text-green-700">+12.5% vs 지난달</p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                평균 렌탈 기간
              </h3>
              <div className="text-3xl font-bold text-blue-900 mb-2">
                3.2개월
              </div>
              <p className="text-sm text-blue-700">활성 계약 기준</p>
            </div>
          </div>

          {/* 렌탈 기기 목록 */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-600" />
              렌탈 기기 목록 ({scheduledReturns.length}건)
            </h3>
            
            {/* 필터 버튼 */}
            <div className="mb-4 flex gap-2">
              <button className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
                연체 ({scheduledReturns.filter(r => r.isOverdue).length})
              </button>
              <button className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium">
                회수 임박 ({scheduledReturns.filter(r => !r.isOverdue && r.daysUntil <= 7).length})
              </button>
              <button className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                정상 ({scheduledReturns.filter(r => !r.isOverdue && r.daysUntil > 7).length})
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-2 text-sm font-semibold text-slate-700">상태</th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-slate-700">디바이스 ID</th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-slate-700">고객사</th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-slate-700">담당자 정보</th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-slate-700">디바이스 정보</th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-slate-700">렌탈 기간</th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-slate-700 text-center">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledReturns.map((rental) => (
                    <tr key={rental.id} className={`border-b ${
                      rental.isOverdue 
                        ? 'bg-red-50 hover:bg-red-100' 
                        : rental.daysUntil <= 7 
                          ? 'bg-yellow-50 hover:bg-yellow-100'
                          : 'hover:bg-slate-50'
                    } transition-colors`}>
                      {/* 상태 */}
                      <td className="py-3 px-2">
                        <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold ${
                          rental.isOverdue 
                            ? 'bg-red-100 text-red-800' 
                            : rental.daysUntil <= 7
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        }`}>
                          {rental.isOverdue 
                            ? `D+${Math.abs(rental.daysUntil)} 연체` 
                            : rental.daysUntil === 0 
                              ? 'D-Day'
                              : `D-${rental.daysUntil}`}
                        </div>
                      </td>
                      
                      {/* 디바이스 ID */}
                      <td className="py-3 px-2">
                        <span className="font-mono text-sm font-medium text-slate-900">{rental.id}</span>
                      </td>
                      
                      {/* 고객사 */}
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-900">{rental.organization}</span>
                        </div>
                      </td>
                      
                      {/* 담당자 정보 */}
                      <td className="py-3 px-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            <span className="text-sm text-slate-700">{rental.contact}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span className="text-xs text-slate-600">{rental.contactPhone || '010-0000-0000'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="text-xs text-slate-600">email@company.com</span>
                          </div>
                        </div>
                      </td>
                      
                      {/* 디바이스 정보 */}
                      <td className="py-3 px-2">
                        <div className="space-y-0.5">
                          <span className="text-sm font-medium text-slate-900">LINK BAND 2.0</span>
                        </div>
                      </td>
                      
                      {/* 렌탈 기간 */}
                      <td className="py-3 px-2">
                        <div className="space-y-0.5">
                          <div className="text-sm text-slate-700">
                            시작일: {new Date(rental.scheduledDate.getTime() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR')}
                          </div>
                          <div className={`text-sm ${rental.isOverdue ? 'text-red-700 font-semibold' : 'text-slate-700'}`}>
                            종료일: {rental.scheduledDate.toLocaleDateString('ko-KR')}
                          </div>
                        </div>
                      </td>
                      
                      {/* 액션 */}
                      <td className="py-3 px-2 text-center">
                        <div className="flex gap-2 justify-center">
                          <button 
                            onClick={() => handleRentalReturn(rental.id)}
                            disabled={rentalLoading}
                            className={`px-3 py-1.5 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                              rental.isOverdue 
                                ? 'bg-red-600 hover:bg-red-700' 
                                : 'bg-orange-600 hover:bg-orange-700'
                            }`}
                          >
                            {rentalLoading ? '처리중...' : rental.isOverdue ? '연체 처리' : '회수 처리'}
                          </button>
                          <button className="px-3 py-1.5 rounded-lg bg-slate-600 text-white text-sm font-medium hover:bg-slate-700 transition-colors">
                            상세보기
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {scheduledReturns.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>렌탈 기기가 없습니다.</p>
                </div>
              )}
            </div>
          </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // A/S 관리 탭 렌더링
  const renderServiceTab = () => {
    const getUrgencyBadge = (urgency: UrgencyLevel) => {
      const styles = {
        LOW: 'bg-green-100 text-green-800',
        MEDIUM: 'bg-yellow-100 text-yellow-800', 
        HIGH: 'bg-orange-100 text-orange-800',
        CRITICAL: 'bg-red-100 text-red-800'
      };
      const labels = {
        LOW: '낮음',
        MEDIUM: '보통',
        HIGH: '높음', 
        CRITICAL: '긴급'
      };
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[urgency]}`}>
          {labels[urgency]}
        </span>
      );
    };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">A/S 관리</h2>
              <p className="text-slate-600 mt-1">구매 제품 서비스 및 수리 관리</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => loadServiceData()}
                className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                새로고침
              </button>
            </div>
          </div>

          {/* A/S 현황 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">총 서비스</p>
                  <p className="text-2xl font-bold text-red-900">
                    {serviceStatistics?.totalRequests || 0}
                  </p>
                </div>
                <Wrench className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700">진행중</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {serviceStatistics?.inProgressRequests || 0}
                  </p>
                </div>
                <Settings className="w-8 h-8 text-yellow-600" />
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">완료</p>
                  <p className="text-2xl font-bold text-green-900">
                    {serviceStatistics?.completedRequests || 0}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">평균 처리일</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {serviceStatistics?.averageResolutionTime || 0}일
                  </p>
                </div>
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* A/S 상태별 탭 */}
          <div className="flex gap-2 mb-6">
            {[
              { id: 'pending', label: '대응 대기', count: pendingRequests.length, color: 'orange' },
              { id: 'inProgress', label: '대응중', count: inProgressRequests.length, color: 'blue' },
              { id: 'completed', label: '대응 완료', count: completedRequests.length, color: 'green' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setServiceTabView(tab.id as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  serviceTabView === tab.id
                    ? `bg-${tab.color}-600 text-white`
                    : `bg-${tab.color}-100 text-${tab.color}-700 hover:bg-${tab.color}-200`
                }`}
              >
                {tab.label}
                <span className={`px-2 py-1 rounded-full text-xs ${
                  serviceTabView === tab.id 
                    ? 'bg-white/20 text-white' 
                    : `bg-${tab.color}-200 text-${tab.color}-800`
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* A/S 요청 목록 */}
          <div className="space-y-4">
            {serviceTabView === 'pending' && pendingRequests.map((request) => (
              <div key={request.id} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900">{request.organizationName}</h3>
                      {getUrgencyBadge(request.urgencyLevel)}
                      <span className="text-sm text-slate-500">
                        {new Date(request.requestDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-600">담당자:</span>
                        <span className="ml-2 font-medium">{request.requesterName}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">연락처:</span>
                        <span className="ml-2">{request.requesterPhone}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">디바이스:</span>
                        <span className="ml-2 font-medium">{request.deviceId}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">이메일:</span>
                        <span className="ml-2">{request.requesterEmail}</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-slate-600">이유:</span>
                      <span className="ml-2">{request.issueDescription}</span>
                    </div>
                  </div>
                  <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 ml-4">
                    <Play className="w-4 h-4" />
                    대응하기
                  </button>
                </div>
              </div>
            ))}

            {serviceTabView === 'inProgress' && inProgressRequests.map((request) => (
              <div key={request.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900">{request.organizationName}</h3>
                      {getUrgencyBadge(request.urgencyLevel)}
                      <span className="text-sm text-slate-500">
                        대응 시작: {request.responseDate ? new Date(request.responseDate).toLocaleDateString() : '-'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-2">
                      <div>
                        <span className="text-slate-600">담당 기술자:</span>
                        <span className="ml-2 font-medium">{request.assignedTechnicianName}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">디바이스:</span>
                        <span className="ml-2 font-medium">{request.deviceId}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">연락처:</span>
                        <span className="ml-2">{request.requesterPhone}</span>
                      </div>
                    </div>
                    {request.responseMessage && (
                      <div className="mt-2 p-3 bg-white rounded border">
                        <span className="text-slate-600">대응 메시지:</span>
                        <span className="ml-2">{request.responseMessage}</span>
                      </div>
                    )}
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 ml-4">
                    <CheckCircle className="w-4 h-4" />
                    대응 완료하기
                  </button>
                </div>
              </div>
            ))}

            {serviceTabView === 'completed' && completedRequests.map((request) => (
              <div key={request.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900">{request.organizationName}</h3>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        완료됨
                      </span>
                      <span className="text-sm text-slate-500">
                        완료: {request.completionDate ? new Date(request.completionDate).toLocaleDateString() : '-'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-2">
                      <div>
                        <span className="text-slate-600">대응 방법:</span>
                        <span className="ml-2 font-medium">{request.resolutionMethod}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">디바이스:</span>
                        <span className="ml-2 font-medium">{request.deviceId}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">처리자:</span>
                        <span className="ml-2">{request.assignedTechnicianName}</span>
                      </div>
                    </div>
                    {request.defectDescription && (
                      <div className="mt-2 p-3 bg-white rounded border">
                        <span className="text-slate-600">결함 내용:</span>
                        <span className="ml-2">{request.defectDescription}</span>
                      </div>
                    )}
                    {request.resolutionNotes && (
                      <div className="mt-2 p-3 bg-white rounded border">
                        <span className="text-slate-600">완료 메모:</span>
                        <span className="ml-2">{request.resolutionNotes}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* 빈 상태 표시 */}
            {serviceTabView === 'pending' && pendingRequests.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>대응 대기 중인 A/S 요청이 없습니다.</p>
              </div>
            )}
            {serviceTabView === 'inProgress' && inProgressRequests.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>현재 처리 중인 A/S 요청이 없습니다.</p>
              </div>
            )}
            {serviceTabView === 'completed' && completedRequests.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>완료된 A/S 요청이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
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
          <div className="flex gap-2 overflow-x-auto">
            {[
              { id: 'overview', label: '전체 현황', icon: Monitor },
              { id: 'inventory', label: '재고 관리', icon: HardDrive },
              { id: 'usage', label: '사용 현황', icon: BarChart3 },
              { id: 'rental', label: '렌탈관리', icon: RefreshCw },
              { id: 'sales', label: '판매기기관리', icon: Package },
              { id: 'service', label: 'A/S', icon: Wrench }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
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

        {/* 탭 컨텐츠 */}
        <div className="min-h-[500px]">
          {/* 전체 현황 탭 */}
          {activeTab === 'overview' && systemOverview && (
            <div className="space-y-6">
              {/* 전체 요약 통계 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

              {/* 추가 통계 및 차트 영역 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">조직별 디바이스 분포</h3>
                  <div className="space-y-3">
                    {systemOverview?.organizationBreakdown?.slice(0, 5).map((org) => (
                      <div key={org.organizationId} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Building2 className="w-5 h-5 text-slate-600" />
                          <span className="font-medium text-slate-700">{org.organizationName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-slate-900">{org.totalDevices}</span>
                          <span className="text-sm text-slate-600">개</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">디바이스 타입별 분포</h3>
                  <div className="space-y-3">
                    {systemOverview?.deviceTypeBreakdown?.map((type) => (
                      <div key={type.type} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Smartphone className="w-5 h-5 text-slate-600" />
                          <span className="font-medium text-slate-700">{type.type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-slate-900">{type.count}</span>
                          <span className="text-sm text-slate-600">({type.percentage}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 재고 관리 탭 */}
          {activeTab === 'inventory' && renderInventoryTab()}

          {/* 사용 현황 탭 */}
          {activeTab === 'usage' && renderUsageTab()}

          {/* 렌탈관리 탭 */}
          {activeTab === 'rental' && renderRentalTab()}

          {/* 판매기기관리 탭 */}
          {activeTab === 'sales' && (
            <SalesManagementTab 
              autoRefresh={salesAutoRefresh}
              onAutoRefreshChange={setSalesAutoRefresh}
            />
          )}

          {/* A/S 탭 */}
          {activeTab === 'service' && renderServiceTab()}
        </div>
      </div>
    </div>
  )
} 