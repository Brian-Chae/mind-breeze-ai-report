import React, { useState, useEffect } from 'react'
import { Smartphone, Battery, Wifi, Plus, Search, Filter, MapPin, User, Calendar, Activity, AlertCircle, CheckCircle, Settings, MoreHorizontal, Edit, Trash2, Eye, Download, BarChart3, RefreshCw, Power, Signal, Loader2 } from 'lucide-react'
import { Card } from '../../ui/card'
import { Button } from '../../ui/button'
import { Badge } from '../../ui/badge'
import { Input } from '../../ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown-menu'
import { FirebaseService } from '../../../services/FirebaseService'
import { SystemControlService } from '../../../services/SystemControlService'
import enterpriseAuthService from '../../../services/EnterpriseAuthService'

interface DevicesSectionProps {
  subSection: string;
}

interface Device {
  id: string;
  serialNumber: string;
  name: string;
  model: string;
  firmwareVersion: string;
  batteryLevel: number;
  signalStrength: 'weak' | 'medium' | 'strong';
  status: 'online' | 'offline' | 'maintenance';
  assignedUser?: string;
  assignedUserName?: string;
  assignedLocation?: string;
  lastSyncAt?: Date;
  pairedAt?: Date;
  isActive: boolean;
}

interface DeviceStats {
  totalDevices: number;
  activeDevices: number;
  offlineDevices: number;
  maintenanceDevices: number;
}

export default function DevicesSection({ subSection }: DevicesSectionProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [devices, setDevices] = useState<Device[]>([])
  const [deviceStats, setDeviceStats] = useState<DeviceStats>({
    totalDevices: 0,
    activeDevices: 0,
    offlineDevices: 0,
    maintenanceDevices: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [systemControl] = useState(new SystemControlService())

  useEffect(() => {
    loadDeviceData()
  }, [])

  const loadDeviceData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const currentContext = enterpriseAuthService.getCurrentContext()
      if (!currentContext.user || !currentContext.organization) {
        throw new Error('인증 정보가 없습니다.')
      }

      // 조직의 모든 디바이스 조회
      const [organizationDevices, userDevices] = await Promise.all([
        FirebaseService.getDocuments('devices', [
          FirebaseService.createWhereFilter('organizationId', '==', currentContext.organization.id)
        ]),
        FirebaseService.getDocuments('devices', [
          FirebaseService.createWhereFilter('userId', '==', currentContext.user.id)
        ])
      ])

      // 디바이스 데이터 변환
      const allDevices = [...organizationDevices, ...userDevices]
        .filter((device: any, index: number, self: any[]) => 
          index === self.findIndex((d: any) => d.serialNumber === device.serialNumber)
        )
        .map((device: any) => ({
          id: device.id,
          serialNumber: device.serialNumber || device.id,
          name: device.name || `LinkBand ${device.serialNumber || device.id}`,
          model: device.model || 'LinkBand Pro',
          firmwareVersion: device.firmwareVersion || 'v2.1.3',
          batteryLevel: device.batteryLevel || 0,
          signalStrength: device.signalStrength || 'medium',
          status: (device.isActive ? 'online' : 'offline') as 'online' | 'offline' | 'maintenance',
          assignedUser: device.userId,
          assignedUserName: device.assignedUserName,
          assignedLocation: device.location,
          lastSyncAt: device.lastSyncAt?.toDate(),
          pairedAt: device.pairedAt?.toDate(),
          isActive: device.isActive || false
        }))

      setDevices(allDevices)

      // 통계 계산
      const stats = allDevices.reduce((acc, device) => {
        acc.totalDevices++
        if (device.status === 'online') acc.activeDevices++
        else if (device.status === 'offline') acc.offlineDevices++
        else if (device.status === 'maintenance') acc.maintenanceDevices++
        return acc
      }, {
        totalDevices: 0,
        activeDevices: 0,
        offlineDevices: 0,
        maintenanceDevices: 0
      })

      setDeviceStats(stats)

    } catch (error) {
      console.error('디바이스 데이터 로드 실패:', error)
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeviceConnect = async (deviceId: string) => {
    try {
      await systemControl.connectDevice(deviceId)
      await loadDeviceData() // 데이터 새로고침
    } catch (error) {
      console.error('디바이스 연결 실패:', error)
      setError(error instanceof Error ? error.message : '디바이스 연결에 실패했습니다.')
    }
  }

  const handleDeviceUpdate = async (deviceId: string) => {
    try {
      // 디바이스 업데이트 로직
      await FirebaseService.updateDocument('devices', deviceId, {
        firmwareVersion: 'v2.1.4',
        updatedAt: new Date()
      })
      await loadDeviceData()
    } catch (error) {
      console.error('디바이스 업데이트 실패:', error)
      setError(error instanceof Error ? error.message : '디바이스 업데이트에 실패했습니다.')
    }
  }

  const filteredDevices = devices.filter(device =>
    device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const renderDeviceInventory = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">디바이스 현황</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={loadDeviceData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            리포트 다운로드
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            디바이스 추가
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
              <Button variant="outline" size="sm" onClick={loadDeviceData} className="mt-2">
                다시 시도
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 디바이스</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : deviceStats.totalDevices}
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl">
              <Smartphone className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">활성 디바이스</p>
              <p className="text-2xl font-bold text-green-600">
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : deviceStats.activeDevices}
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">오프라인</p>
              <p className="text-2xl font-bold text-gray-600">
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : deviceStats.offlineDevices}
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl">
              <Power className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">점검 필요</p>
              <p className="text-2xl font-bold text-yellow-600">
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : deviceStats.maintenanceDevices}
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-xl">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="디바이스 ID나 모델로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          필터
        </Button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredDevices.map((device) => (
            <Card key={device.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl">
                    <Smartphone className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{device.name}</h3>
                    <p className="text-sm text-gray-600">{device.model} • {device.firmwareVersion}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className={
                    device.status === 'online' ? 'bg-green-100 text-green-600' :
                    device.status === 'offline' ? 'bg-gray-100 text-gray-600' :
                    'bg-yellow-100 text-yellow-600'
                  }>
                    {device.status === 'online' ? '온라인' : 
                     device.status === 'offline' ? '오프라인' : '점검중'}
                  </Badge>
                  <Badge variant="outline">배터리: {device.batteryLevel}%</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="w-4 h-4 mr-2" />
                        상세 정보
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="w-4 h-4 mr-2" />
                        설정
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeviceUpdate(device.id)}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        업데이트
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeviceConnect(device.id)}>
                        <Wifi className="w-4 h-4 mr-2" />
                        연결
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Battery className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">배터리: {device.batteryLevel}%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Signal className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">신호: {
                    device.signalStrength === 'strong' ? '강함' :
                    device.signalStrength === 'medium' ? '보통' : '약함'
                  }</span>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">사용자: {device.assignedUserName || '미할당'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    마지막 동기화: {device.lastSyncAt ? 
                      `${Math.floor((Date.now() - device.lastSyncAt.getTime()) / 60000)}분 전` :
                      '없음'
                    }
                  </span>
                </div>
              </div>
            </Card>
          ))}
          {filteredDevices.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              검색 결과가 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderDeviceAssignment = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">디바이스 배치</h2>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          새 배치
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">배치 설정</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">디바이스 선택</label>
              <select className="mt-1 w-full p-2 border border-gray-300 rounded-md">
                <option>사용 가능한 디바이스 선택</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">사용자 할당</label>
              <Input placeholder="사용자 이름 또는 ID" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">배치 위치</label>
              <Input placeholder="위치 정보" />
            </div>
            <Button className="w-full">배치 완료</Button>
          </div>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">배치 현황</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">배치 대기</span>
              <Badge className="bg-yellow-100 text-yellow-600">8개</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">배치 완료</span>
              <Badge className="bg-green-100 text-green-600">96개</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">회수 대기</span>
              <Badge className="bg-red-100 text-red-600">4개</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )

  const renderDeviceMonitoring = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">디바이스 모니터링</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            통계 보기
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">실시간 상태</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">정상 작동: 96개</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-600">주의 필요: 10개</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600">오류 발생: 3개</span>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">알림</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">배터리 부족</p>
                <p className="text-xs text-gray-600">LB003 • 15% 남음</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">연결 불안정</p>
                <p className="text-xs text-gray-600">LB007 • 신호 약함</p>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">성능 지표</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">평균 배터리 수명</span>
              <span className="text-sm font-semibold text-green-600">24시간</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">평균 신호 강도</span>
              <span className="text-sm font-semibold text-green-600">87%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">데이터 전송 성공률</span>
              <span className="text-sm font-semibold text-green-600">98.5%</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (subSection) {
      case 'device-inventory':
        return renderDeviceInventory()
      case 'device-assignment':
        return renderDeviceAssignment()
      case 'device-monitoring':
        return renderDeviceMonitoring()
      default:
        return renderDeviceInventory()
    }
  }

  return <div>{renderContent()}</div>
} 