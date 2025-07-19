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
  BarChart3,
  Settings,
  Upload
} from 'lucide-react'
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

  const getDataTypeIcon = (dataType: string) => {
    switch (dataType) {
      case 'EEG': return <Activity className="w-4 h-4 text-purple-600" />
      case 'PPG': return <Zap className="w-4 h-4 text-red-600" />
      case 'ACC': return <Gauge className="w-4 h-4 text-blue-600" />
      case 'EEG+PPG+ACC': return <Monitor className="w-4 h-4 text-green-600" />
      default: return <Database className="w-4 h-4 text-slate-600" />
    }
  }

  const filteredSessions = recentSessions.filter(session => {
    const matchesSearch = session.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.dataType.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === 'all' || session.dataType === filterType || 
                       (filterType === 'MULTI' && session.dataType.includes('+'))
    
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

  const formatDataVolume = (volume: number) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}GB`
    }
    return `${volume}MB`
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
              <h3 className="text-lg font-semibold text-slate-900 mb-2">측정 데이터 로드 중</h3>
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full mb-4">
            <Database className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">측정 데이터 관리</h1>
          <p className="text-lg text-slate-600">측정 세션 현황 및 데이터 모니터링</p>
        </div>

        {/* 측정 데이터 현황 개요 */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">측정 데이터 현황 개요</h2>
              <p className="text-slate-600 mt-1">전체 측정 세션 및 데이터 통계</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  autoRefresh 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                자동 새로고침 {autoRefresh ? 'ON' : 'OFF'}
              </button>
              <button 
                onClick={loadMeasurementData}
                disabled={isLoading}
                className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                새로고침
              </button>
            </div>
          </div>
          
          {/* 측정 데이터 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">총 측정 세션</p>
                  <p className="text-2xl font-bold text-blue-900">{formatNumber(dataStats?.totalSessions || 0)}</p>
                </div>
                <Database className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">데이터 용량</p>
                  <p className="text-2xl font-bold text-green-900">{formatDataVolume(dataStats?.dataVolume || 0)}</p>
                </div>
                <HardDrive className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">일일 수집량</p>
                  <p className="text-2xl font-bold text-purple-900">{dataStats?.dailyCollection || 0}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">실시간 세션</p>
                  <p className="text-2xl font-bold text-orange-900">{formatNumber(dataStats?.realTimeSessions || 0)}</p>
                </div>
                <Monitor className="w-8 h-8 text-orange-600" />
              </div>
            </div>
            
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700">품질 점수</p>
                  <p className="text-2xl font-bold text-emerald-900">{dataStats?.qualityScore || 0}%</p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
            
            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">저장소 사용률</p>
                  <p className="text-2xl font-bold text-red-900">{dataStats?.storageUsed || 0}%</p>
                </div>
                <Gauge className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* 최근 측정 세션 */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">최근 측정 세션</h2>
              <p className="text-slate-600 mt-1">최근 진행된 측정 세션 목록</p>
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="사용자, 조직, 데이터 타입 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-64 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-500"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
              >
                <option value="all">모든 타입</option>
                <option value="EEG">EEG</option>
                <option value="PPG">PPG</option>
                <option value="ACC">ACC</option>
                <option value="MULTI">멀티센서</option>
              </select>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                데이터 내보내기
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">사용자</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">조직</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">데이터 타입</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">지속 시간</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">데이터 크기</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">품질</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">상태</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">시간</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{session.userName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900">{session.organizationName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getDataTypeIcon(session.dataType)}
                        <span className="text-slate-900">{session.dataType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {session.status === 'completed' ? (
                        <div className="text-slate-900">{session.duration}분</div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {session.status === 'completed' ? (
                        <div className="text-slate-900">{session.dataSize}MB</div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {session.status === 'completed' ? (
                        <div className={`font-semibold ${getQualityColor(session.quality)}`}>
                          {session.quality}%
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(session.status)}`}>
                        {getStatusText(session.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">
                        {formatDate(session.timestamp)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                          <Eye className="w-4 h-4 text-slate-600" />
                        </button>
                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                          <Download className="w-4 h-4 text-slate-600" />
                        </button>
                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                          <MoreHorizontal className="w-4 h-4 text-slate-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredSessions.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>조건에 맞는 측정 세션이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 