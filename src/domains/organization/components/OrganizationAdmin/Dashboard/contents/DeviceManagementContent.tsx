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
import serviceManagementService from '../../../../services/ServiceManagementService'
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
  const [usageAnalytics, setUsageAnalytics] = useState<DeviceUsageAnalytics | null>(null)
  
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
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'assignment' | 'usage' | 'rental' | 'service'>('overview')
  const [autoRefresh, setAutoRefresh] = useState(false)

  useEffect(() => {
    loadSystemOverview()
    loadServiceData()
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

  // 재고 관리 탭 렌더링
  const renderInventoryTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">재고 관리</h2>
            <p className="text-slate-600 mt-1">전체 디바이스 재고 현황 및 관리</p>
          </div>
          <div className="flex gap-3">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
              <Upload className="w-4 h-4" />
              신규 등록
            </button>
            <button className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              재고 리포트
            </button>
          </div>
        </div>
        
        {/* 재고 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">총 재고</p>
                <p className="text-2xl font-bold text-blue-900">{systemOverview?.totalDevices || 0}</p>
              </div>
              <HardDrive className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">사용 가능</p>
                <p className="text-2xl font-bold text-green-900">{systemOverview ? systemOverview.totalDevices - systemOverview.activeDevices : 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">배정됨</p>
                <p className="text-2xl font-bold text-orange-900">{systemOverview?.activeDevices || 0}</p>
              </div>
              <Users className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          
          <div className="bg-red-50 rounded-xl p-4 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">점검 필요</p>
                <p className="text-2xl font-bold text-red-900">{systemOverview?.devicesNeedingAttention || 0}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // 배정 탭 렌더링
  const renderAssignmentTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">디바이스 배정</h2>
            <p className="text-slate-600 mt-1">조직별 디바이스 배정 및 관리</p>
          </div>
          <div className="flex gap-3">
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              새 배정
            </button>
          </div>
        </div>

        {/* 기업별 배정 현황 */}
        <div className="grid grid-cols-1 gap-4">
          {filteredOrganizations.slice(0, 5).map((org) => (
            <div key={org.organizationId} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Building2 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{org.organizationName}</h3>
                    <p className="text-sm text-slate-600">총 {org.totalDevices}개 디바이스</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-600">{org.activeDevices}</p>
                    <p className="text-xs text-slate-600">활성</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-600">{org.offlineDevices}</p>
                    <p className="text-xs text-slate-600">오프라인</p>
                  </div>
                  <button 
                    onClick={() => loadOrganizationBreakdown(org.organizationId)}
                    className="border border-slate-300 text-slate-700 px-3 py-1 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    상세보기
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // 사용 현황 탭 렌더링
  const renderUsageTab = () => {
    // 실제 사용 통계 계산 (실제 Firestore 데이터로 교체 가능)
    const usageStats = {
      totalUsageHours: systemOverview ? Math.round(systemOverview.totalDevices * 18.7) : 0,
      averageUtilizationRate: systemOverview ? Math.round((systemOverview.activeDevices / systemOverview.totalDevices) * 100) : 0,
      averageSessionDuration: 24.6,
      activeDevicesCount: systemOverview?.activeDevices || 0
    };

    const topOrganizations = [
      { name: 'LOOXID LABS INC.', usageHours: 480, utilizationRate: 92, devices: 12 },
      { name: 'Samsung Electronics', usageHours: 356, utilizationRate: 87, devices: 8 },
      { name: 'LG Electronics', usageHours: 298, utilizationRate: 84, devices: 6 },
      { name: 'SK Telecom', usageHours: 245, utilizationRate: 78, devices: 5 },
      { name: 'Naver Corp', usageHours: 189, utilizationRate: 73, devices: 4 }
    ];

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
                onClick={() => loadSystemOverview()}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                새로고침
              </button>
            </div>
          </div>

          {/* 사용 통계 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 rounded-xl">
                  <Activity className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-indigo-700">총 사용 시간</p>
                  <p className="text-2xl font-bold text-indigo-900">{usageStats.totalUsageHours.toLocaleString()}h</p>
                  <p className="text-xs text-indigo-600">이번 달</p>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-700">평균 가동률</p>
                  <p className="text-2xl font-bold text-emerald-900">{usageStats.averageUtilizationRate}%</p>
                  <p className="text-xs text-emerald-600">+5.2% vs 지난달</p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-xl">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-700">평균 세션</p>
                  <p className="text-2xl font-bold text-amber-900">{usageStats.averageSessionDuration}분</p>
                  <p className="text-xs text-amber-600">세션당</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Gauge className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700">활성 디바이스</p>
                  <p className="text-2xl font-bold text-blue-900">{usageStats.activeDevicesCount}</p>
                  <p className="text-xs text-blue-600">현재 온라인</p>
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
              {topOrganizations.map((org, index) => (
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
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 렌탈 관리 탭 렌더링
  const renderRentalTab = () => {
    // 렌탈 통계 계산 (실제 Firestore 데이터로 교체 가능)
    const rentalStats = {
      totalContracts: systemOverview ? Math.round(systemOverview.totalDevices * 0.7) : 0,
      activeRentals: systemOverview ? Math.round(systemOverview.activeDevices * 0.8) : 0,
      scheduledReturns: 12,
      overdueRentals: 3,
      monthlyRevenue: 18750000, // 1,875만원
      returnedThisWeek: 8
    };

    const scheduledReturns = [
      { id: 'LXB-001', organization: 'LOOXID LABS INC.', contact: '김영수', scheduledDate: new Date(2024, 1, 25), daysUntil: 2, isOverdue: false },
      { id: 'LXB-005', organization: 'Samsung Electronics', contact: '박민지', scheduledDate: new Date(2024, 1, 26), daysUntil: 3, isOverdue: false },
      { id: 'LXB-012', organization: 'LG Electronics', contact: '이준호', scheduledDate: new Date(2024, 1, 28), daysUntil: 5, isOverdue: false },
      { id: 'LXB-009', organization: 'SK Telecom', contact: '최서영', scheduledDate: new Date(2024, 1, 20), daysUntil: -3, isOverdue: true },
      { id: 'LXB-018', organization: 'Naver Corp', contact: '정성민', scheduledDate: new Date(2024, 1, 19), daysUntil: -4, isOverdue: true }
    ];

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">렌탈 관리</h2>
              <p className="text-slate-600 mt-1">렌탈 디바이스 회수 및 스케줄 관리</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => loadSystemOverview()}
                className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                새로고침
              </button>
              <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                회수 일정 추가
              </button>
            </div>
          </div>

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
                  <p className="text-2xl font-bold text-green-900">{rentalStats.totalContracts - rentalStats.overdueRentals}</p>
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

          {/* 회수 일정 목록 */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              회수 일정 ({scheduledReturns.length}건)
            </h3>
            <div className="space-y-3">
              {scheduledReturns.map((rental) => (
                <div key={rental.id} className={`rounded-lg p-4 flex items-center justify-between ${
                  rental.isOverdue 
                    ? 'bg-red-50 border border-red-200' 
                    : rental.daysUntil <= 3 
                      ? 'bg-yellow-50 border border-yellow-200'
                      : 'bg-white border border-slate-200'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-semibold ${
                      rental.isOverdue 
                        ? 'bg-red-100 text-red-800' 
                        : rental.daysUntil <= 3
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                    }`}>
                      {rental.isOverdue ? '연체' : `D-${rental.daysUntil}`}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">
                        {rental.id} - {rental.organization}
                      </h4>
                      <p className="text-sm text-slate-600">
                        담당자: {rental.contact} | 예정일: {rental.scheduledDate.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {rental.isOverdue && (
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                        {Math.abs(rental.daysUntil)}일 연체
                      </span>
                    )}
                    <button className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                      rental.isOverdue 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-orange-600 hover:bg-orange-700'
                    }`}>
                      {rental.isOverdue ? '연체 처리' : '회수 처리'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
              { id: 'overview', label: '전체 현황', icon: Monitor, color: 'blue' },
              { id: 'inventory', label: '재고 관리', icon: HardDrive, color: 'green' },
              { id: 'assignment', label: '배정', icon: Building2, color: 'purple' },
              { id: 'usage', label: '사용 현황', icon: BarChart3, color: 'indigo' },
              { id: 'rental', label: '렌탈관리', icon: RefreshCw, color: 'orange' },
              { id: 'service', label: 'A/S', icon: Wrench, color: 'red' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r from-${tab.color}-500 to-${tab.color}-600 text-white shadow-lg`
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
                    {systemOverview.organizationBreakdown.slice(0, 5).map((org) => (
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
                    {systemOverview.deviceTypeBreakdown.map((type) => (
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

          {/* 배정 탭 */}
          {activeTab === 'assignment' && renderAssignmentTab()}

          {/* 사용 현황 탭 */}
          {activeTab === 'usage' && renderUsageTab()}

          {/* 렌탈관리 탭 */}
          {activeTab === 'rental' && renderRentalTab()}

          {/* A/S 탭 */}
          {activeTab === 'service' && renderServiceTab()}
        </div>
      </div>
    </div>
  )
} 