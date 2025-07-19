import React, { useState, useEffect } from 'react'
import { 
  Database, 
  Activity, 
  HardDrive, 
  Zap,
  RefreshCw,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Download,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  Building2,
  Gauge,
  Signal,
  Clock,
  Monitor,
  BarChart3
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
import systemAdminService from '../../../../services/SystemAdminService'

interface DataStats {
  totalSessions: number
  dataVolume: number
  dailyCollection: number
  realTimeSessions: number
  qualityScore: number
  storageUsed: number
}

interface RecentSession {
  id: string
  userName: string
  organizationName: string
  dataType: string
  duration: number
  dataSize: number
  quality: number
  timestamp: Date
  status: 'completed' | 'processing' | 'failed'
}

export default function MeasurementDataContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [dataStats, setDataStats] = useState<DataStats | null>(null)
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [autoRefresh, setAutoRefresh] = useState(false)

  useEffect(() => {
    loadMeasurementData()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(loadMeasurementData, 30000) // 30초마다 새로고침
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const loadMeasurementData = async () => {
    setIsLoading(true)
    try {
      console.log('📊 측정 데이터 관리 데이터 로드 시작...')
      
      // 실제 데이터 로드
      const [overview, sessions] = await Promise.all([
        systemAdminService.getMeasurementDataOverview(),
        systemAdminService.getRecentMeasurementSessionsDetails(50)
      ])
      
      setDataStats(overview)
      setRecentSessions(sessions)
      
      console.log('✅ 측정 데이터 관리 데이터 로드 완료:', {
        overview,
        sessionCount: sessions.length
      })
      
    } catch (error) {
      console.error('❌ 측정 데이터 로드 실패:', error)
      toast.error('측정 데이터를 불러오는데 실패했습니다.')
      
      // 에러 시 기본값 설정
      setDataStats({
        totalSessions: 0,
        dataVolume: 0,
        dailyCollection: 0,
        realTimeSessions: 0,
        qualityScore: 0,
        storageUsed: 0
      })
      setRecentSessions([])
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-700 bg-emerald-50 border-emerald-200'
      case 'processing': return 'text-blue-700 bg-blue-50 border-blue-200'
      case 'failed': return 'text-red-700 bg-red-50 border-red-200'
      default: return 'text-slate-700 bg-slate-50 border-slate-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '완료'
      case 'processing': return '처리중'
      case 'failed': return '실패'
      default: return status
    }
  }

  const getQualityColor = (score: number) => {
    if (score >= 95) return 'text-emerald-600'
    if (score >= 90) return 'text-blue-600'
    if (score >= 80) return 'text-amber-600'
    return 'text-red-600'
  }

  const getDataTypeIcon = (type: string) => {
    if (type.includes('EEG')) return <Activity className="w-4 h-4 text-purple-600" />
    if (type.includes('PPG')) return <Zap className="w-4 h-4 text-red-600" />
    if (type.includes('ACC')) return <Gauge className="w-4 h-4 text-blue-600" />
    return <Signal className="w-4 h-4 text-slate-600" />
  }

  const filteredSessions = recentSessions.filter(session => {
    const matchesSearch = session.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.dataType.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || session.dataType.includes(filterType)
    return matchesSearch && matchesType
  })

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">측정 데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">측정 데이터 관리</h1>
          <p className="text-gray-600">EEG, PPG, ACC 측정 데이터 현황 및 관리</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            자동 새로고침 {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button onClick={loadMeasurementData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-100">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">총 측정 세션</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(dataStats?.totalSessions || 0)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-emerald-100">
              <HardDrive className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">데이터 용량</p>
              <p className="text-2xl font-bold text-gray-900">{dataStats?.dataVolume || 0}GB</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-purple-100">
              <Database className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">일일 수집량</p>
              <p className="text-2xl font-bold text-gray-900">{dataStats?.dailyCollection || 0}개</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-orange-100">
              <Signal className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">실시간 세션</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(dataStats?.realTimeSessions || 0)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-yellow-100">
              <CheckCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">품질 점수</p>
              <p className="text-2xl font-bold text-gray-900">{dataStats?.qualityScore || 0}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-indigo-100">
              <Monitor className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">저장소 사용률</p>
              <p className="text-2xl font-bold text-gray-900">{dataStats?.storageUsed || 0}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 최근 측정 세션 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">최근 측정 세션</h3>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="사용자, 조직, 데이터 타입 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">모든 타입</option>
              <option value="EEG">EEG</option>
              <option value="PPG">PPG</option>
              <option value="ACC">ACC</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  사용자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  조직
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  데이터 타입
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  지속 시간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  데이터 크기
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  품질
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  시간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {session.userName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {session.organizationName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getDataTypeIcon(session.dataType)}
                      <span className="ml-2 text-sm text-gray-900">{session.dataType}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {session.status === 'completed' ? `${session.duration}분` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {session.status === 'completed' ? `${session.dataSize}MB` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {session.status === 'completed' ? (
                      <span className={getQualityColor(session.quality)}>
                        {session.quality}%
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getStatusColor(session.status)}>
                      {getStatusText(session.status)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(session.timestamp)}
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
                          <Download className="mr-2 h-4 w-4" />
                          다운로드
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredSessions.length === 0 && (
          <div className="text-center py-12">
            <Database className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">측정 세션이 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">검색 조건을 변경해보세요.</p>
          </div>
        )}
      </Card>
    </div>
  )
} 