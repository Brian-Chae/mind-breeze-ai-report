/**
 * 디바이스 관리 Hero 섹션
 * 
 * 디바이스 관리 현황, 통계, 빠른 액션을 표시하는 상단 섹션
 * 사용자 관리 페이지의 UserManagementSummary와 동일한 디자인 패턴 적용
 */

import React, { useState, useEffect } from 'react'
import { 
  Smartphone,
  Activity,
  Package,
  TrendingUp,
  TrendingDown,
  Plus,
  Download,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  Wrench,
  Package2,
  Battery,
  BarChart3,
  Settings
} from 'lucide-react'
import { Button } from '@ui/button'
import { toast } from 'sonner'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@ui/dropdown-menu'
import enterpriseAuthService from '../../../../services/EnterpriseAuthService'
// import { DeviceMasterService } from '../../../../services/DeviceMasterService' // TODO: Enable when service is ready

interface DeviceManagementHeroProps {
  onDeviceAdded?: () => void
  onExport?: () => void
  onRefresh?: () => void
}

interface DeviceStats {
  totalDevices: number
  activeDevices: number
  availableDevices: number
  maintenanceDevices: number
  rentalDevices: number
  saleDevices: number
  lowBatteryDevices: number
  serviceRequests: number
}

export default function DeviceManagementHero({ onDeviceAdded, onExport, onRefresh }: DeviceManagementHeroProps) {
  const [stats, setStats] = useState<DeviceStats | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Get current organization context
  const currentContext = enterpriseAuthService.getCurrentContext()
  const organizationName = currentContext.organizationName || '조직'
  const organizationId = currentContext.user?.organizationId

  useEffect(() => {
    loadStats()
  }, [organizationId])

  const loadStats = async () => {
    if (!organizationId) return
    
    try {
      setLoading(true)
      // TODO: Replace with actual service call when integrated
      // const deviceService = new DeviceMasterService()
      // const statistics = await deviceService.getDeviceMasterStatistics()
      
      // Mock data for now
      setStats({
        totalDevices: 24,
        activeDevices: 18,
        availableDevices: 4,
        maintenanceDevices: 2,
        rentalDevices: 15,
        saleDevices: 9,
        lowBatteryDevices: 3,
        serviceRequests: 1
      })
    } catch (error) {
      console.error('Failed to load device stats:', error)
      // Set default values on error
      setStats({
        totalDevices: 0,
        activeDevices: 0,
        availableDevices: 0,
        maintenanceDevices: 0,
        rentalDevices: 0,
        saleDevices: 0,
        lowBatteryDevices: 0,
        serviceRequests: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAction = (action: string) => {
    toast.info(`${action} 기능은 곧 추가될 예정입니다.`)
  }

  const handleRefresh = async () => {
    await loadStats()
    if (onRefresh) {
      onRefresh()
    }
  }

  // Calculate rates
  const activeRate = stats ? Math.round((stats.activeDevices / stats.totalDevices) * 100) || 0 : 0
  const rentalRate = stats ? Math.round((stats.rentalDevices / stats.totalDevices) * 100) || 0 : 0
  
  // Mock growth data
  const deviceGrowthRate = 8.3
  const utilizationGrowthRate = 15.7

  return (
    <div className="space-y-8">
      {/* 디바이스 관리 정보 헤더 */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {/* 상단 그라데이션 배경 */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Smartphone className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  디바이스 관리
                </h1>
                <p className="text-blue-100 text-lg mb-2">
                  {organizationName}의 LINK BAND 디바이스를 효율적으로 관리하세요
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-blue-100">
                    <Clock className="w-4 h-4" />
                    마지막 업데이트: {new Date().toLocaleString('ko-KR')}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleRefresh} 
                disabled={loading}
                className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                새로고침
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm" className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30">
                    <Plus className="w-4 h-4 mr-2" />
                    디바이스 추가
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleQuickAction('디바이스 등록')}>
                    <Package2 className="w-4 h-4 mr-2" />
                    새 디바이스 등록
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleQuickAction('대량 등록')}>
                    <Package className="w-4 h-4 mr-2" />
                    대량 등록 (CSV)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* 하단 통계 섹션 */}
        <div className="px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">전체 디바이스</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {loading ? '-' : stats?.totalDevices.toLocaleString() || 0}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-600">+{deviceGrowthRate}%</span>
                    <span className="text-xs text-slate-500">지난 달 대비</span>
                  </div>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">활성 디바이스</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {loading ? '-' : stats?.activeDevices.toLocaleString() || 0}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    <span className="text-xs text-emerald-600 font-medium">{activeRate}% 활성</span>
                    <span className="text-xs text-slate-500">전체 대비</span>
                  </div>
                </div>
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Activity className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">렌탈 디바이스</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {loading ? '-' : stats?.rentalDevices.toLocaleString() || 0}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Package className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-blue-600">{rentalRate}%</span>
                    <span className="text-xs text-slate-500">렌탈 비율</span>
                  </div>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">사용 가능</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {loading ? '-' : stats?.availableDevices.toLocaleString() || 0}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <BarChart3 className="w-3 h-3 text-purple-600" />
                    <span className="text-xs font-medium text-purple-600">즉시 배정 가능</span>
                  </div>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 빠른 액션 및 디바이스 현황 섹션 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* 빠른 액션 (좌측) */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">빠른 액션</h2>
              <p className="text-slate-600 mt-1">자주 사용하는 작업을 빠르게 실행하세요</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl p-4 h-24 flex items-center justify-between transition-all duration-200 group shadow-md hover:shadow-lg"
              onClick={() => handleQuickAction('디바이스 배정')}
            >
              <div className="flex-1 text-left">
                <span className="font-semibold block">디바이스 배정</span>
                <p className="text-xs text-blue-100 mt-0.5">사용자에게 디바이스 할당</p>
              </div>
              <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors ml-3">
                <Package2 className="w-5 h-5" />
              </div>
            </button>
            
            <button 
              className="bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-xl p-4 h-24 flex items-center justify-between transition-all duration-200 group"
              onClick={() => handleQuickAction('A/S 관리')}
            >
              <div className="flex-1 text-left">
                <span className="font-semibold block">A/S 관리</span>
                <p className="text-xs text-slate-500 mt-0.5">서비스 요청 처리</p>
              </div>
              <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors ml-3">
                <Wrench className="w-5 h-5 text-slate-600" />
              </div>
            </button>
            
            <button 
              className="bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-xl p-4 h-24 flex items-center justify-between transition-all duration-200 group"
              onClick={() => handleQuickAction('디바이스 모니터링')}
            >
              <div className="flex-1 text-left">
                <span className="font-semibold block">모니터링</span>
                <p className="text-xs text-slate-500 mt-0.5">실시간 상태 확인</p>
              </div>
              <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors ml-3">
                <Activity className="w-5 h-5 text-slate-600" />
              </div>
            </button>
            
            <button 
              className="bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-xl p-4 h-24 flex items-center justify-between transition-all duration-200 group"
              onClick={() => handleQuickAction('데이터 내보내기')}
            >
              <div className="flex-1 text-left">
                <span className="font-semibold block">데이터 내보내기</span>
                <p className="text-xs text-slate-500 mt-0.5">디바이스 데이터 다운로드</p>
              </div>
              <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors ml-3">
                <Download className="w-5 h-5 text-slate-600" />
              </div>
            </button>
          </div>
        </div>

        {/* 디바이스 현황 (우측) */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">디바이스 현황</h2>
              <p className="text-slate-600 mt-1">실시간 디바이스 상태를 확인하세요</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-emerald-700">실시간 업데이트</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Settings className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">정비 필요</p>
                  <p className="text-xs text-slate-500">점검이 필요한 디바이스</p>
                </div>
              </div>
              <p className="text-xl font-bold text-slate-900">
                {loading ? '-' : stats?.maintenanceDevices || 0}
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Battery className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">배터리 부족</p>
                  <p className="text-xs text-slate-500">충전이 필요한 디바이스</p>
                </div>
              </div>
              <p className="text-xl font-bold text-slate-900">
                {loading ? '-' : stats?.lowBatteryDevices || 0}
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">A/S 요청</p>
                  <p className="text-xs text-slate-500">처리 대기중인 서비스</p>
                </div>
              </div>
              <p className="text-xl font-bold text-slate-900">
                {loading ? '-' : stats?.serviceRequests || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}