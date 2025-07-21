import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card'
import { Button } from '@shared/components/ui/button'
import { Badge } from '@shared/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs'
import { Input } from '@shared/components/ui/input'
import { Label } from '../../../../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@shared/components/ui/dialog'
import { Textarea } from '@shared/components/ui/textarea'
import { ScrollArea } from '@shared/components/ui/scroll-area'
import { Separator } from '@shared/components/ui/separator'
import { Progress } from '@shared/components/ui/progress'
import { Alert, AlertDescription } from '@shared/components/ui/alert'
import systemAdminService, { 
  SystemDeviceOverview, 
  OrganizationDeviceBreakdown, 
  DeviceUsageAnalytics, 
  DeviceManagementAction 
} from '../../../services/SystemAdminService'
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
  Table
} from 'lucide-react'

interface DeviceSystemManagementPanelProps {
  onClose: () => void
}

// 기기별 사용 현황 타입 정의
interface DeviceUsageStatus {
  deviceId: string
  deviceName: string
  deviceType: string
  organizationName: string
  usageType: 'purchase' | 'rental'
  rentalPeriod?: number // 개월
  totalMeasurements: number
  lastUsedDate: Date
  status: 'active' | 'inactive' | 'maintenance'
}

export const DeviceSystemManagementPanel: React.FC<DeviceSystemManagementPanelProps> = ({ onClose }) => {
  const [systemOverview, setSystemOverview] = useState<SystemDeviceOverview | null>(null)
  const [selectedOrganization, setSelectedOrganization] = useState<string | null>(null)
  const [organizationBreakdown, setOrganizationBreakdown] = useState<OrganizationDeviceBreakdown | null>(null)
  const [usageAnalytics, setUsageAnalytics] = useState<DeviceUsageAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)
  const [actionForm, setActionForm] = useState<Partial<DeviceManagementAction>>({
    action: 'update_firmware',
    parameters: { reason: '' },
    sendNotification: true,
    priority: 'medium'
  })

  // 기기별 사용 현황 상태
  const [deviceUsageList, setDeviceUsageList] = useState<DeviceUsageStatus[]>([])
  const [usageLoading, setUsageLoading] = useState(false)
  

  useEffect(() => {
    loadSystemOverview()
    loadDeviceUsageList()
  }, [])

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
    } catch (error) {
      console.error('조직 디바이스 현황 로드 실패:', error)
    }
  }

  const loadUsageAnalytics = async (organizationId: string, timeRange: 'week' | 'month' | 'quarter' = 'month') => {
    try {
      const analytics = await systemAdminService.getDeviceUsageAnalytics(organizationId, timeRange)
      setUsageAnalytics(analytics)
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
      // 에러 시 빈 배열로 설정
      setDeviceUsageList([])
    } finally {
      setUsageLoading(false)
    }
  }

  const executeDeviceAction = async () => {
    if (!selectedDevice || !selectedOrganization || !actionForm.action || !actionForm.parameters?.reason) {
      return
    }

    try {
      const action: DeviceManagementAction = {
        deviceId: selectedDevice,
        organizationId: selectedOrganization,
        action: actionForm.action,
        parameters: actionForm.parameters,
        sendNotification: actionForm.sendNotification || false,
        priority: actionForm.priority || 'medium'
      }

      await systemAdminService.executeDeviceManagementAction(action)
      setShowActionDialog(false)
      
      // 데이터 새로고침
      loadSystemOverview()
      if (selectedOrganization) {
        loadOrganizationBreakdown(selectedOrganization)
      }
    } catch (error) {
      console.error('디바이스 액션 실행 실패:', error)
    }
  }

  // 필터링된 조직 목록
  const filteredOrganizations = systemOverview?.organizationBreakdown.filter(org => {
    const matchesSearch = org.organizationName.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  }) || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800'
      case 'offline': return 'bg-gray-100 text-gray-800'
      case 'maintenance': return 'bg-yellow-100 text-yellow-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <Wifi className="h-4 w-4 text-green-600" />
      case 'offline': return <WifiOff className="h-4 w-4 text-gray-600" />
      case 'maintenance': return <Wrench className="h-4 w-4 text-yellow-600" />
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <Smartphone className="h-4 w-4 text-gray-600" />
    }
  }

  const getDeviceTypeIcon = (type: string) => {
    switch (type) {
      case 'EEG': return <Activity className="h-4 w-4 text-purple-600" />
      case 'PPG': return <Zap className="h-4 w-4 text-red-600" />
      case 'MULTI_SENSOR': return <Gauge className="h-4 w-4 text-blue-600" />
      case 'WEARABLE': return <Smartphone className="h-4 w-4 text-green-600" />
      default: return <HardDrive className="h-4 w-4 text-gray-600" />
    }
  }

  const getBatteryIcon = (level: number) => {
    if (level > 20) {
      return <Battery className="h-4 w-4 text-green-600" />
    } else {
      return <BatteryLow className="h-4 w-4 text-red-600" />
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-96 bg-white shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>디바이스 시스템 데이터를 로드하고 있습니다...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-7xl h-full max-h-[90vh] overflow-hidden bg-white shadow-2xl">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-6 w-6" />
                디바이스 시스템 관리
              </CardTitle>
              <CardDescription>
                전체 LINK BAND 디바이스 현황 모니터링 및 관리
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={loadSystemOverview}>
                <RefreshCw className="h-4 w-4 mr-2" />
                새로고침
              </Button>
              <Button variant="ghost" onClick={onClose}>
                닫기
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 h-full bg-gray-50">
          <Tabs defaultValue="overview" className="h-full">
            <TabsList className="grid w-full grid-cols-5 border-b rounded-none bg-gray-100">
              <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">전체 현황</TabsTrigger>
              <TabsTrigger value="organizations" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">기업별 현황</TabsTrigger>
              <TabsTrigger value="usage" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">사용현황</TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">사용 분석</TabsTrigger>
              <TabsTrigger value="management" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">디바이스 관리</TabsTrigger>
            </TabsList>

            {/* 전체 현황 탭 */}
            <TabsContent value="overview" className="h-full p-6 space-y-6 bg-gray-50">
              {systemOverview && (
                <>
                  {/* 전체 요약 통계 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-white border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">총 디바이스</p>
                            <p className="text-2xl font-bold text-gray-900">{systemOverview.totalDevices}</p>
                          </div>
                          <Smartphone className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">활성 디바이스</p>
                            <p className="text-2xl font-bold text-green-600">{systemOverview.activeDevices}</p>
                          </div>
                          <Wifi className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">오프라인 디바이스</p>
                            <p className="text-2xl font-bold text-gray-600">{systemOverview.offlineDevices}</p>
                          </div>
                          <WifiOff className="h-8 w-8 text-gray-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">주의 필요</p>
                            <p className="text-2xl font-bold text-red-600">{systemOverview.devicesNeedingAttention}</p>
                          </div>
                          <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 디바이스 타입별 분포 */}
                  <Card className="bg-white border border-gray-200">
                    <CardHeader>
                      <CardTitle>디바이스 타입별 분포</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {systemOverview.deviceTypeBreakdown.map((type) => (
                          <div key={type.type} className="text-center p-4 border rounded-lg">
                            <div className="flex justify-center mb-2">
                              {getDeviceTypeIcon(type.type)}
                            </div>
                            <div className="font-semibold text-gray-900">{type.type}</div>
                            <div className="text-2xl font-bold text-gray-900">{type.count}</div>
                            <div className="text-sm text-gray-600">
                              활성: {type.activeCount} ({type.percentage}%)
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* 조직별 현황 */}
                  <Card className="bg-white border border-gray-200">
                    <CardHeader>
                      <CardTitle>조직별 디바이스 현황</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64">
                        <div className="space-y-2">
                          {systemOverview.organizationBreakdown.map((org) => (
                            <div key={org.organizationId} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer"
                                 onClick={() => loadOrganizationBreakdown(org.organizationId)}>
                              <div className="flex items-center gap-3">
                                <Building2 className="h-4 w-4 text-blue-600" />
                                <div>
                                  <div className="font-medium">{org.organizationName}</div>
                                  <div className="text-sm text-gray-600">
                                    총 {org.totalDevices}대 | 활성 {org.activeDevices}대
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  {getBatteryIcon(org.averageBatteryLevel)}
                                  <span className="text-sm">{org.averageBatteryLevel}%</span>
                                </div>
                                {org.errorDevices > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    에러 {org.errorDevices}대
                                  </Badge>
                                )}
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* 최근 활동 */}
                  <Card className="bg-white border border-gray-200">
                    <CardHeader>
                      <CardTitle>최근 디바이스 활동</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-48">
                        <div className="space-y-2">
                          {systemOverview.recentActivity.map((activity, index) => (
                            <div key={index} className="flex items-center justify-between p-2 border-b">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(activity.action)}
                                <div>
                                  <div className="font-medium">{activity.deviceName}</div>
                                  <div className="text-sm text-gray-600">
                                    {activity.organizationName} | {activity.action}
                                  </div>
                                </div>
                              </div>
                              <div className="text-sm text-gray-500">
                                {activity.timestamp.toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* 사용현황 탭 */}
            <TabsContent value="usage" className="h-full p-6 space-y-6 bg-gray-50">
              <div className="space-y-6">
                {/* 헤더 */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">기기별 사용 현황</h2>
                    <p className="text-gray-600">전체 디바이스의 사용 현황을 확인할 수 있습니다</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={loadDeviceUsageList}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      새로고침
                    </Button>
                  </div>
                </div>

                {/* 사용 현황 테이블 */}
                <Card className="bg-white border border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Table className="h-5 w-5" />
                      기기별 사용 현황 목록
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {usageLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                        <span className="text-gray-600">데이터를 불러오는 중...</span>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-3 px-4 font-medium text-gray-900">기기명</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-900">기기종류</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-900">사용 기업명</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-900">사용 방식</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-900">총 측정횟수</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-900">최근 사용일</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-900">상태</th>
                            </tr>
                          </thead>
                          <tbody>
                            {deviceUsageList.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="py-8 text-center text-gray-500">
                                  등록된 기기가 없습니다.
                                </td>
                              </tr>
                            ) : (
                              deviceUsageList.map((device) => (
                                <tr key={device.deviceId} className="border-b border-gray-100 hover:bg-gray-50">
                                  <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <Smartphone className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium text-gray-900">{device.deviceName}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <Badge variant="outline" className="text-xs">
                                    {device.deviceType}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-700">{device.organizationName}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1">
                                    {device.usageType === 'purchase' ? (
                                      <Badge className="bg-green-100 text-green-800 text-xs">
                                        구매
                                      </Badge>
                                    ) : (
                                      <div className="flex items-center gap-1">
                                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                                          렌탈
                                        </Badge>
                                        <span className="text-xs text-gray-600">
                                          {device.rentalPeriod}개월
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1">
                                    <Activity className="h-4 w-4 text-purple-600" />
                                    <span className="font-medium text-gray-900">
                                      {device.totalMeasurements}회
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-700">
                                      {device.lastUsedDate.toLocaleDateString('ko-KR', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <Badge 
                                    className={
                                      device.status === 'active' ? 'bg-green-100 text-green-800' :
                                      device.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }
                                  >
                                    {device.status === 'active' ? '활성' :
                                     device.status === 'maintenance' ? '유지보수' : '비활성'}
                                  </Badge>
                                </td>
                              </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 기업별 현황 탭 */}
            <TabsContent value="organizations" className="h-full p-6 space-y-6">
              {organizationBreakdown ? (
                <div className="space-y-6">
                  {/* 헤더 */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">{organizationBreakdown.organizationName}</h2>
                      <p className="text-gray-600">{organizationBreakdown.companyCode}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={organizationBreakdown.healthScore > 80 ? 'bg-green-100 text-green-800' : 
                                      organizationBreakdown.healthScore > 60 ? 'bg-yellow-100 text-yellow-800' : 
                                      'bg-red-100 text-red-800'}>
                        건강점수: {organizationBreakdown.healthScore}/100
                      </Badge>
                      <Button variant="outline" onClick={() => setOrganizationBreakdown(null)}>
                        목록으로
                      </Button>
                    </div>
                  </div>

                  {/* 디바이스 상태 통계 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-white border border-gray-200">
                      <CardContent className="p-4 text-center">
                        <Wifi className="h-6 w-6 mx-auto text-green-600 mb-2" />
                        <div className="text-2xl font-bold text-green-600">{organizationBreakdown.deviceStats.online}</div>
                        <div className="text-sm text-gray-600">온라인</div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white border border-gray-200">
                      <CardContent className="p-4 text-center">
                        <WifiOff className="h-6 w-6 mx-auto text-gray-600 mb-2" />
                        <div className="text-2xl font-bold text-gray-600">{organizationBreakdown.deviceStats.offline}</div>
                        <div className="text-sm text-gray-600">오프라인</div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white border border-gray-200">
                      <CardContent className="p-4 text-center">
                        <Wrench className="h-6 w-6 mx-auto text-yellow-600 mb-2" />
                        <div className="text-2xl font-bold text-yellow-600">{organizationBreakdown.deviceStats.maintenance}</div>
                        <div className="text-sm text-gray-600">유지보수</div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white border border-gray-200">
                      <CardContent className="p-4 text-center">
                        <AlertTriangle className="h-6 w-6 mx-auto text-red-600 mb-2" />
                        <div className="text-2xl font-bold text-red-600">{organizationBreakdown.deviceStats.error}</div>
                        <div className="text-sm text-gray-600">에러</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 부서별 디바이스 할당 */}
                  <Card className="bg-white border border-gray-200">
                    <CardHeader>
                      <CardTitle>부서별 디바이스 할당 현황</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {organizationBreakdown.departmentBreakdown.map((dept) => (
                          <div key={dept.departmentId} className="flex items-center justify-between p-3 border rounded">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-blue-600" />
                              <div>
                                <div className="font-medium">{dept.departmentName}</div>
                                <div className="text-sm text-gray-600">
                                  할당: {dept.assignedDevices}대 | 활성: {dept.activeDevices}대
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress value={dept.utilizationRate} className="w-20" />
                              <span className="text-sm font-medium">{dept.utilizationRate}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* 최근 디바이스 활동 */}
                  <Card className="bg-white border border-gray-200">
                    <CardHeader>
                      <CardTitle>최근 디바이스 활동</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-48">
                        <div className="space-y-2">
                          {organizationBreakdown.recentDeviceActivity.map((activity, index) => (
                            <div key={index} className="flex items-center justify-between p-2 border-b">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(activity.action)}
                                <div>
                                  <div className="font-medium">{activity.deviceName}</div>
                                  <div className="text-sm text-gray-600">
                                    {activity.userName} | {activity.action}
                                  </div>
                                </div>
                              </div>
                              <div className="text-sm text-gray-500">
                                {activity.timestamp.toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center text-gray-500">
                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>조직을 선택하여 상세 현황을 확인하세요</p>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* 사용 분석 탭 */}
            <TabsContent value="analytics" className="h-full p-6">
              {usageAnalytics ? (
                <div className="space-y-6">
                  {/* 사용 지표 요약 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-white border border-gray-200">
                      <CardContent className="p-4 text-center">
                        <Activity className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                                                    <div className="text-2xl font-bold text-gray-900">{usageAnalytics.usageMetrics.totalSessions}</div>
                        <div className="text-sm text-gray-600">총 세션</div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white border border-gray-200">
                      <CardContent className="p-4 text-center">
                        <Clock className="h-6 w-6 mx-auto text-green-600 mb-2" />
                        <div className="text-2xl font-bold text-gray-900">{usageAnalytics.usageMetrics.averageSessionDuration}분</div>
                        <div className="text-sm text-gray-600">평균 세션 시간</div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white border border-gray-200">
                      <CardContent className="p-4 text-center">
                        <HardDrive className="h-6 w-6 mx-auto text-purple-600 mb-2" />
                        <div className="text-2xl font-bold text-gray-900">{usageAnalytics.usageMetrics.totalDataCollected}MB</div>
                        <div className="text-sm text-gray-600">수집 데이터</div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white border border-gray-200">
                      <CardContent className="p-4 text-center">
                        <Users className="h-6 w-6 mx-auto text-orange-600 mb-2" />
                        <div className="text-2xl font-bold text-gray-900">{usageAnalytics.userEngagement.length}</div>
                        <div className="text-sm text-gray-600">활성 사용자</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 디바이스 성능 */}
                  <Card className="bg-white border border-gray-200">
                    <CardHeader>
                      <CardTitle>디바이스 성능 분석</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64">
                        <div className="space-y-2">
                          {usageAnalytics.devicePerformance.map((device) => (
                            <div key={device.deviceId} className="flex items-center justify-between p-3 border rounded">
                              <div className="flex items-center gap-2">
                                <Smartphone className="h-4 w-4 text-blue-600" />
                                <div>
                                  <div className="font-medium">{device.deviceName}</div>
                                  <div className="text-sm text-gray-600">{device.serialNumber}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <div className="text-center">
                                  <div className="font-medium">{device.sessionCount}</div>
                                  <div className="text-gray-600">세션</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-medium">{device.totalUptime}h</div>
                                  <div className="text-gray-600">가동시간</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-medium">{device.errorRate}%</div>
                                  <div className="text-gray-600">에러율</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-medium">{device.batteryPerformance}%</div>
                                  <div className="text-gray-600">배터리</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>조직을 선택하여 사용 분석을 확인하세요</p>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* 디바이스 관리 탭 */}
            <TabsContent value="management" className="h-full p-6 space-y-6">
              <div className="text-center text-gray-500">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>디바이스 관리 기능</p>
                <p className="text-sm">펌웨어 업데이트, 유지보수 스케줄링, 디바이스 재할당 등</p>
                
                <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
                  <DialogTrigger asChild>
                    <Button className="mt-4">
                      <Settings className="h-4 w-4 mr-2" />
                      디바이스 관리 액션
                    </Button>
                  </DialogTrigger>
                  
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>디바이스 관리 액션</DialogTitle>
                      <DialogDescription>
                        선택된 디바이스에 대한 관리 액션을 실행합니다.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <Label>액션 유형</Label>
                        <Select
                          value={actionForm.action}
                          onValueChange={(value) => setActionForm({...actionForm, action: value as any})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="update_firmware">펌웨어 업데이트</SelectItem>
                            <SelectItem value="schedule_maintenance">유지보수 스케줄링</SelectItem>
                            <SelectItem value="reassign_device">디바이스 재할당</SelectItem>
                            <SelectItem value="force_sync">강제 동기화</SelectItem>
                            <SelectItem value="calibrate_device">캘리브레이션</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>우선순위</Label>
                        <Select
                          value={actionForm.priority}
                          onValueChange={(value) => setActionForm({...actionForm, priority: value as any})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">낮음</SelectItem>
                            <SelectItem value="medium">보통</SelectItem>
                            <SelectItem value="high">높음</SelectItem>
                            <SelectItem value="urgent">긴급</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>사유</Label>
                        <Textarea
                          value={actionForm.parameters?.reason || ''}
                          onChange={(e) => setActionForm({
                            ...actionForm,
                            parameters: { 
                              ...actionForm.parameters, 
                              reason: e.target.value 
                            }
                          })}
                          placeholder="액션 실행 사유를 입력하세요"
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowActionDialog(false)}>
                        취소
                      </Button>
                      <Button onClick={executeDeviceAction}>
                        실행
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 