import React from 'react'
import {
  MoreHorizontal,
  Eye,
  UserPlus,
  UserMinus,
  Wrench,
  User,
  Smartphone
} from 'lucide-react'
import { Button } from '@ui/button'
import { Badge } from '@ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ui/table'
import { 
  OrganizationDeviceView,
  DeviceLifecycleStatus
} from '../../../types/integrated-device'

interface DeviceListTableProps {
  devices: OrganizationDeviceView[]
  onViewDetails: (device: OrganizationDeviceView) => void
  onAssignUser: (deviceId: string) => void
  onUnassignUser: (device: OrganizationDeviceView) => void
  onCreateServiceRequest: (deviceId: string) => void
  isLoading?: boolean
}

export default function DeviceListTable({
  devices,
  onViewDetails,
  onAssignUser,
  onUnassignUser,
  onCreateServiceRequest,
  isLoading = false
}: DeviceListTableProps) {

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '-'
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date(date))
  }

  const getStatusBadge = (status: DeviceLifecycleStatus) => {
    const statusConfig = {
      'INVENTORY': { label: '재고', color: 'bg-gray-100 text-gray-800' },
      'ALLOCATED': { label: '배정', color: 'bg-blue-100 text-blue-800' },
      'IN_USE': { label: '사용중', color: 'bg-green-100 text-green-800' },
      'MAINTENANCE': { label: '정비중', color: 'bg-yellow-100 text-yellow-800' },
      'RECALLED': { label: '회수', color: 'bg-orange-100 text-orange-800' },
      'RETIRED': { label: '폐기', color: 'bg-red-100 text-red-800' },
      'LOST': { label: '분실', color: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status] || statusConfig.INVENTORY
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const getAcquisitionBadge = (type: 'RENTAL' | 'SALE') => {
    return type === 'RENTAL' 
      ? <Badge className="bg-blue-100 text-blue-800">렌탈</Badge>
      : <Badge className="bg-purple-100 text-purple-800">구매</Badge>
  }

  const getBatteryBadge = (level?: number) => {
    if (!level && level !== 0) return <span className="text-sm text-gray-500">-</span>
    
    let color = 'bg-green-100 text-green-800'
    if (level < 20) color = 'bg-red-100 text-red-800'
    else if (level < 50) color = 'bg-yellow-100 text-yellow-800'
    else if (level < 80) color = 'bg-blue-100 text-blue-800'
    
    return <Badge className={color}>{level}%</Badge>
  }

  const getUtilizationBadge = (rate?: number) => {
    if (!rate && rate !== 0) return <span className="text-sm text-gray-500">-</span>
    
    let color = 'bg-gray-100 text-gray-800'
    if (rate > 80) color = 'bg-green-100 text-green-800'
    else if (rate > 60) color = 'bg-blue-100 text-blue-800'
    else if (rate > 40) color = 'bg-yellow-100 text-yellow-800'
    else color = 'bg-orange-100 text-orange-800'
    
    return <Badge className={color}>{rate}%</Badge>
  }

  if (isLoading) {
    return (
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>디바이스 정보</TableHead>
              <TableHead>할당 정보</TableHead>
              <TableHead>배정 타입</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>배터리</TableHead>
              <TableHead>사용률</TableHead>
              <TableHead>최근 사용</TableHead>
              <TableHead>작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4"></div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                </TableCell>
                <TableCell>
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-12"></div>
                </TableCell>
                <TableCell>
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-14"></div>
                </TableCell>
                <TableCell>
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-12"></div>
                </TableCell>
                <TableCell>
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-12"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                </TableCell>
                <TableCell>
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (devices.length === 0) {
    return (
      <div className="p-16 text-center">
        <div className="max-w-md mx-auto">
          {/* 빈 상태 아이콘 */}
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <Smartphone className="w-10 h-10 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">디바이스가 없습니다</h3>
              <p className="text-gray-600">
                조건에 맞는 디바이스를 찾을 수 없습니다.
                <br />
                첫 번째 디바이스를 등록해보세요
              </p>
            </div>
            
            {/* 디바이스 목록 박스 */}
            <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-200">
              <div className="flex items-center justify-center text-gray-400">
                <Smartphone className="w-5 h-5 mr-2" />
                <span className="text-sm">0대의 디바이스 | 0 선택됨</span>
              </div>
            </div>
            
            <p className="text-sm text-gray-500 mt-4">
              디바이스가 없습니다
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">디바이스 정보</TableHead>
            <TableHead className="w-[180px]">할당 정보</TableHead>
            <TableHead className="w-[100px]">배정 타입</TableHead>
            <TableHead className="w-[100px]">상태</TableHead>
            <TableHead className="w-[80px]">배터리</TableHead>
            <TableHead className="w-[80px]">사용률</TableHead>
            <TableHead className="w-[120px]">최근 사용</TableHead>
            <TableHead className="w-[80px]">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.map((device) => (
            <TableRow key={device.deviceId} className="hover:bg-gray-50">
              <TableCell>
                <div>
                  <div className="font-medium text-gray-900">{device.deviceId}</div>
                  <div className="text-sm text-gray-500">{device.deviceType}</div>
                  {device.serialNumber && (
                    <div className="text-xs text-gray-400">SN: {device.serialNumber}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {device.assignedUserId ? (
                  <div>
                    <div className="font-medium text-gray-900">{device.assignedUserName}</div>
                    <div className="text-sm text-gray-500">{device.location || '위치 미지정'}</div>
                    {device.assignedAt && (
                      <div className="text-xs text-gray-400">
                        할당일: {formatDate(device.assignedAt)}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">할당되지 않음</span>
                )}
              </TableCell>
              <TableCell>
                {getAcquisitionBadge(device.allocationType)}
              </TableCell>
              <TableCell>
                {getStatusBadge(device.currentStatus)}
              </TableCell>
              <TableCell>
                {getBatteryBadge(device.batteryLevel)}
              </TableCell>
              <TableCell>
                {getUtilizationBadge(device.utilizationRate)}
              </TableCell>
              <TableCell>
                <div>
                  <div className="text-sm text-gray-900">{formatDate(device.lastUsedAt)}</div>
                  {device.totalUsageHours && (
                    <div className="text-xs text-gray-500">
                      총 {Math.round(device.totalUsageHours)}시간
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onViewDetails(device)}>
                      <Eye className="mr-2 h-4 w-4" />
                      상세보기
                    </DropdownMenuItem>
                    {!device.assignedUserId ? (
                      <DropdownMenuItem onClick={() => onAssignUser(device.deviceId)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        사용자 할당
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => onUnassignUser(device)}>
                        <UserMinus className="mr-2 h-4 w-4" />
                        할당 해제
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onCreateServiceRequest(device.deviceId)}>
                      <Wrench className="mr-2 h-4 w-4" />
                      A/S 요청
                    </DropdownMenuItem>
                    {device.allocationType === 'RENTAL' && device.rentalEndDate && (
                      <>
                        <DropdownMenuItem>
                          <span className="mr-2 h-4 w-4">📅</span>
                          렌탈 연장
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <span className="mr-2 h-4 w-4">🛒</span>
                          구매 전환
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}