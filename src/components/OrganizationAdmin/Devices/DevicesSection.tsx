import React, { useState } from 'react'
import { Smartphone, Battery, Wifi, Plus, Search, Filter, MapPin, User, Calendar, Activity, AlertCircle, CheckCircle, Settings, MoreHorizontal, Edit, Trash2, Eye, Download, BarChart3, RefreshCw, Power, Signal } from 'lucide-react'
import { Card } from '../../ui/card'
import { Button } from '../../ui/button'
import { Badge } from '../../ui/badge'
import { Input } from '../../ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown-menu'

interface DevicesSectionProps {
  subSection: string;
}

export default function DevicesSection({ subSection }: DevicesSectionProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const renderDeviceInventory = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">디바이스 현황</h2>
        <div className="flex items-center space-x-2">
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
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 디바이스</p>
              <p className="text-2xl font-bold text-gray-900">124</p>
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
              <p className="text-2xl font-bold text-green-600">96</p>
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
              <p className="text-2xl font-bold text-gray-600">18</p>
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
              <p className="text-2xl font-bold text-yellow-600">10</p>
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
      
      <div className="grid grid-cols-1 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl">
                  <Smartphone className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">LinkBand Pro LB00{i}</h3>
                  <p className="text-sm text-gray-600">LinkBand Pro • 펌웨어 v2.1.3</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge className="bg-green-100 text-green-600">온라인</Badge>
                <Badge variant="outline">배터리: 85%</Badge>
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
                    <DropdownMenuItem>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      업데이트
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Battery className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">배터리: 85%</span>
              </div>
              <div className="flex items-center space-x-2">
                <Signal className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">신호: 강함</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">사용자: 김건강</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">마지막 동기화: 5분 전</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
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