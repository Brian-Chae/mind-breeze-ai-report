import React, { useState, useEffect } from 'react'
import { 
  Smartphone, 
  Calendar, 
  Activity, 
  Wrench, 
  RefreshCcw,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Play,
  Pause,
  Square,
  Download,
  Upload,
  CheckCircle,
  Clock,
  AlertTriangle,
  Package,
  CreditCard,
  ShoppingCart,
  RotateCcw,
  Settings,
  ClipboardList,
  TrendingUp,
  Building2,
  User,
  DollarSign,
  Calendar as CalendarIcon,
  MapPin,
  Battery,
  Wifi,
  Signal
} from 'lucide-react'
import { Card } from '@ui/card'
import { Button } from '@ui/button'
import { Badge } from '@ui/badge'
import { Input } from '@ui/input'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@ui/dropdown-menu'
import { toast } from 'sonner'
import organizationDeviceService from '../../../services/OrganizationDeviceService'
import { 
  OrganizationDevice, 
  RentalDevice, 
  PurchaseDevice, 
  OrganizationServiceRequest, 
  OrganizationDeviceStats,
  RentalAction,
  PurchaseAction
} from '../../../types/organization-device'

interface DevicesSectionProps {
  subSection: string
  onNavigate: (section: string, subSection: string) => void
}

export default function DevicesSection({ subSection, onNavigate }: DevicesSectionProps) {
  // 상태 관리
  const [activeTab, setActiveTab] = useState<'all' | 'rental' | 'purchase' | 'service'>('all')
  const [deviceStats, setDeviceStats] = useState<OrganizationDeviceStats | null>(null)
  const [allDevices, setAllDevices] = useState<OrganizationDevice[]>([])
  const [rentalDevices, setRentalDevices] = useState<RentalDevice[]>([])
  const [purchaseDevices, setPurchaseDevices] = useState<PurchaseDevice[]>([])
  const [serviceRequests, setServiceRequests] = useState<OrganizationServiceRequest[]>([])
  const [refundRequests, setRefundRequests] = useState<OrganizationServiceRequest[]>([])
  
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [autoRefresh, setAutoRefresh] = useState(false)

  // 현재 조직 ID (실제로는 컨텍스트나 프로퍼티에서 가져와야 함)
  const organizationId = 'current-org-id' // TODO: 실제 구현에서는 context에서 가져오기

  useEffect(() => {
    loadAllData()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(loadAllData, 30000) // 30초마다 새로고침
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  // 데이터 로드 함수들
  const loadAllData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        loadDeviceStats(),
        loadAllDevices(),
        loadRentalDevices(),
        loadPurchaseDevices(),
        loadServiceRequests()
      ])
    } catch (error) {
      console.error('데이터 로드 실패:', error)
      toast.error('데이터를 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadDeviceStats = async () => {
    try {
      const stats = await organizationDeviceService.getDeviceStats(organizationId)
      setDeviceStats(stats)
    } catch (error) {
      console.error('디바이스 통계 로드 실패:', error)
      setDeviceStats({
        totalDevices: 0,
        rentalDevices: 0,
        purchaseDevices: 0,
        activeDevices: 0,
        inactiveDevices: 0,
        maintenanceDevices: 0,
        serviceDevices: 0,
        totalMeasurements: 0,
        monthlyUsage: 0,
        expiringSoonRentals: 0,
        pendingRentalActions: 0,
        warrantyExpiringSoon: 0,
        pendingPurchaseActions: 0,
        pendingServiceRequests: 0,
        inProgressServiceRequests: 0,
        pendingRefundRequests: 0
      })
    }
  }

  const loadAllDevices = async () => {
    try {
      const devices = await organizationDeviceService.getAllDevices(organizationId)
      setAllDevices(devices)
    } catch (error) {
      console.error('전체 기기 목록 로드 실패:', error)
      setAllDevices([])
    }
  }

  const loadRentalDevices = async () => {
    try {
      const devices = await organizationDeviceService.getRentalDevices(organizationId)
      setRentalDevices(devices)
    } catch (error) {
      console.error('렌탈 기기 목록 로드 실패:', error)
      setRentalDevices([])
    }
  }

  const loadPurchaseDevices = async () => {
    try {
      const devices = await organizationDeviceService.getPurchaseDevices(organizationId)
      setPurchaseDevices(devices)
    } catch (error) {
      console.error('구매 기기 목록 로드 실패:', error)
      setPurchaseDevices([])
    }
  }

  const loadServiceRequests = async () => {
    try {
      const [allRequests, refunds] = await Promise.all([
        organizationDeviceService.getServiceRequests(organizationId),
        organizationDeviceService.getServiceRequests(organizationId, 'REFUND')
      ])
      
      setServiceRequests(allRequests.filter(r => r.type === 'SERVICE'))
      setRefundRequests(refunds)
    } catch (error) {
      console.error('서비스 요청 로드 실패:', error)
      setServiceRequests([])
      setRefundRequests([])
    }
  }

  // 액션 처리 함수들
  const handleRentalAction = async (type: RentalAction['type'], deviceId: string, additionalData?: any) => {
    try {
      const action: Omit<RentalAction, 'requestDate' | 'status'> = {
        type,
        deviceId,
        requestedBy: 'current-user', // TODO: 실제 사용자 정보
        ...additionalData
      }

      await organizationDeviceService.processRentalAction(action)
      toast.success('요청이 성공적으로 처리되었습니다.')
      loadAllData() // 데이터 새로고침
    } catch (error) {
      console.error('렌탈 액션 처리 실패:', error)
      toast.error('요청 처리에 실패했습니다.')
    }
  }

  const handlePurchaseAction = async (type: PurchaseAction['type'], deviceId: string, additionalData?: any) => {
    try {
      const action: Omit<PurchaseAction, 'requestDate' | 'status'> = {
        type,
        deviceId,
        requestedBy: 'current-user', // TODO: 실제 사용자 정보
        ...additionalData
      }

      await organizationDeviceService.processPurchaseAction(action)
      toast.success('요청이 성공적으로 처리되었습니다.')
      loadAllData() // 데이터 새로고침
    } catch (error) {
      console.error('구매 액션 처리 실패:', error)
      toast.error('요청 처리에 실패했습니다.')
    }
  }

  // 유틸리티 함수들
  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'ACTIVE': { label: '활성', color: 'bg-green-100 text-green-800' },
      'INACTIVE': { label: '비활성', color: 'bg-gray-100 text-gray-800' },
      'MAINTENANCE': { label: '정비중', color: 'bg-yellow-100 text-yellow-800' },
      'SERVICE': { label: 'A/S중', color: 'bg-red-100 text-red-800' },
      'PENDING': { label: '대기중', color: 'bg-blue-100 text-blue-800' },
      'IN_PROGRESS': { label: '진행중', color: 'bg-orange-100 text-orange-800' },
      'COMPLETED': { label: '완료', color: 'bg-green-100 text-green-800' },
      'CANCELLED': { label: '취소', color: 'bg-gray-100 text-gray-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.INACTIVE
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const getAcquisitionBadge = (type: 'RENTAL' | 'PURCHASE') => {
    return type === 'RENTAL' 
      ? <Badge className="bg-blue-100 text-blue-800">렌탈</Badge>
      : <Badge className="bg-purple-100 text-purple-800">구매</Badge>
  }

  // 탭 별 렌더링 함수들
  const renderOverviewCards = () => {
    if (!deviceStats) return null

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-100">
              <Smartphone className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">전체 기기</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(deviceStats.totalDevices)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-100">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">렌탈 기기</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(deviceStats.rentalDevices)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-purple-100">
              <ShoppingCart className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">구매 기기</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(deviceStats.purchaseDevices)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-orange-100">
              <Activity className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">활성 기기</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(deviceStats.activeDevices)}</p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  const renderAllDevicesTab = () => (
    <div className="space-y-6">
      {renderOverviewCards()}
      
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">전체 기기 목록</h3>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="기기 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={loadAllData}
              disabled={isLoading}
            >
              <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  기기 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  등록일자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  구매/렌탈
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  측정 건수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  최근 사용
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allDevices
                .filter(device => 
                  searchTerm === '' || 
                  device.deviceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  device.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  device.deviceModel.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((device) => (
                <tr key={device.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{device.deviceId}</div>
                      <div className="text-sm text-gray-500">{device.deviceModel}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(device.registrationDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getAcquisitionBadge(device.acquisitionType)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(device.totalMeasurements)}회
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(device.lastUsedDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(device.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          상세보기
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="mr-2 h-4 w-4" />
                          설정
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )

  const renderRentalTab = () => (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">렌탈 기기 관리</h3>
        <Button 
          variant="outline" 
          onClick={loadRentalDevices}
          disabled={isLoading}
        >
          <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                기기 정보
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                렌탈 기간
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                월 요금
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rentalDevices.map((device) => (
              <tr key={device.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{device.deviceId}</div>
                    <div className="text-sm text-gray-500">{device.deviceModel}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                                         <div>{formatDate(device.rentalStartDate || null)} ~ {formatDate(device.rentalEndDate || null)}</div>
                    <div className="text-xs text-gray-500">
                      {Math.ceil((device.rentalEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}일 남음
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₩{formatNumber(device.monthlyFee)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(device.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleRentalAction('EXTEND_RENTAL', device.deviceId)}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        렌탈 기간 연장
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRentalAction('CONVERT_TO_PURCHASE', device.deviceId)}>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        구매 전환
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRentalAction('REQUEST_RETURN', device.deviceId)}>
                        <Package className="mr-2 h-4 w-4" />
                        반납 신청
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRentalAction('REQUEST_SERVICE', device.deviceId)}>
                        <Wrench className="mr-2 h-4 w-4" />
                        A/S 신청
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )

  const renderPurchaseTab = () => (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">구매 기기 관리</h3>
        <Button 
          variant="outline" 
          onClick={loadPurchaseDevices}
          disabled={isLoading}
        >
          <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                기기 정보
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                구매일자
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                구매 금액
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                보증 기간
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {purchaseDevices.map((device) => (
              <tr key={device.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{device.deviceId}</div>
                    <div className="text-sm text-gray-500">{device.deviceModel}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(device.purchaseDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₩{formatNumber(device.purchasePrice)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                                         <div>{formatDate(device.warrantyStartDate || null)} ~ {formatDate(device.warrantyEndDate || null)}</div>
                    <div className="text-xs text-gray-500">
                      {Math.ceil((device.warrantyEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}일 남음
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(device.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handlePurchaseAction('REQUEST_REFUND', device.deviceId)}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        환불 신청
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePurchaseAction('REQUEST_SERVICE', device.deviceId)}>
                        <Wrench className="mr-2 h-4 w-4" />
                        A/S 신청
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )

  const renderServiceTab = () => (
    <div className="space-y-6">
      {/* A/S 현황 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">A/S 현황</h3>
          <Button 
            variant="outline" 
            onClick={loadServiceRequests}
            disabled={isLoading}
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  기기 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  신청일자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  문제 내용
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  긴급도
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  완료 예정일
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {serviceRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{request.deviceId}</div>
                      <div className="text-sm text-gray-500">{request.deviceName}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(request.requestDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.issue || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={
                      request.urgency === 'URGENT' ? 'bg-red-100 text-red-800' :
                      request.urgency === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                      request.urgency === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }>
                      {request.urgency === 'URGENT' ? '긴급' :
                       request.urgency === 'HIGH' ? '높음' :
                       request.urgency === 'MEDIUM' ? '보통' : '낮음'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(request.status)}
                  </td>
                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                     {formatDate(request.estimatedCompletionDate || null)}
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 환불 현황 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">환불 현황</h3>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  기기 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  신청일자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  환불 사유
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  환불 금액
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {refundRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{request.deviceId}</div>
                      <div className="text-sm text-gray-500">{request.deviceName}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(request.requestDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.refundReason || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.refundAmount ? `₩${formatNumber(request.refundAmount)}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(request.refundStatus || request.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )

  // 메인 렌더링
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">디바이스 관리</h1>
          <p className="text-gray-600">조직의 디바이스를 효율적으로 관리하세요</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            자동 새로고침 {autoRefresh ? 'ON' : 'OFF'}
          </Button>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'all', label: '전체 기기 관리', icon: Smartphone },
            { key: 'rental', label: '렌탈 관리', icon: CreditCard },
            { key: 'purchase', label: '구매 관리', icon: ShoppingCart },
            { key: 'service', label: 'A/S 및 환불 현황', icon: Wrench }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="mt-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">데이터를 불러오는 중...</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'all' && renderAllDevicesTab()}
            {activeTab === 'rental' && renderRentalTab()}
            {activeTab === 'purchase' && renderPurchaseTab()}
            {activeTab === 'service' && renderServiceTab()}
          </>
        )}
      </div>
    </div>
  )
} 