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
  Server,
  Monitor,
  Shield,
  Target,
  BarChart3
} from 'lucide-react'

interface DataStats {
  period: string
  totalSessions: number
  dataVolume: number
  dailyCollection: number
  realTimeSessions: number
  qualityScore: number
  storageUsed: number
}

interface DataTypeBreakdown {
  type: string
  volume: number
  percentage: number
  sessions: number
  color: string
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

interface StorageInfo {
  type: string
  used: number
  total: number
  growthRate: number
}

export default function MeasurementDataContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [dataStats, setDataStats] = useState<DataStats | null>(null)
  const [dataBreakdown, setDataBreakdown] = useState<DataTypeBreakdown[]>([])
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])
  const [storageInfo, setStorageInfo] = useState<StorageInfo[]>([])
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
      // 실제 API 호출 대신 mock 데이터
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setDataStats({
        period: '2024년 1월',
        totalSessions: 15420,
        dataVolume: 2.8,
        dailyCollection: 95,
        realTimeSessions: 145,
        qualityScore: 96.8,
        storageUsed: 68.5
      })

      setDataBreakdown([
        { type: 'EEG 데이터', volume: 1.6, percentage: 57.1, sessions: 8800, color: 'purple' },
        { type: 'PPG 데이터', volume: 0.8, percentage: 28.6, sessions: 4400, color: 'red' },
        { type: 'ACC 데이터', volume: 0.4, percentage: 14.3, sessions: 2200, color: 'blue' }
      ])

      setRecentSessions([
        { id: '1', userName: '김측정', organizationName: '헬스테크', dataType: 'EEG', duration: 15, dataSize: 45.2, quality: 98, timestamp: new Date(), status: 'completed' },
        { id: '2', userName: '이데이터', organizationName: '바이오랩', dataType: 'PPG', duration: 10, dataSize: 22.8, quality: 95, timestamp: new Date(), status: 'completed' },
        { id: '3', userName: '박센서', organizationName: '스마트헬스', dataType: 'ACC', duration: 20, dataSize: 12.5, quality: 92, timestamp: new Date(), status: 'processing' },
        { id: '4', userName: '정신호', organizationName: '뉴로텍', dataType: 'EEG', duration: 12, dataSize: 38.7, quality: 97, timestamp: new Date(), status: 'completed' },
        { id: '5', userName: '최바이오', organizationName: '메디텍', dataType: 'PPG', duration: 0, dataSize: 0, quality: 0, timestamp: new Date(), status: 'failed' }
      ])

      setStorageInfo([
        { type: '실시간 데이터', used: 850, total: 1000, growthRate: 2.3 },
        { type: '보관 데이터', used: 1900, total: 3000, growthRate: 5.2 },
        { type: '백업 데이터', used: 950, total: 2000, growthRate: 1.8 },
        { type: '분석 캐시', used: 280, total: 500, growthRate: 8.7 }
      ])
    } catch (error) {
      console.error('측정 데이터 로드 실패:', error)
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

  const getTypeColor = (color: string) => {
    switch (color) {
      case 'purple': return { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' }
      case 'red': return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' }
      case 'blue': return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' }
      default: return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-500' }
    }
  }

  const filteredSessions = recentSessions.filter(session => {
    const matchesSearch = session.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.organizationName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || session.dataType === filterType
    return matchesSearch && matchesType
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <RefreshCw className="w-8 h-8 text-green-600 animate-spin" />
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-full mb-4">
            <Database className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">측정 데이터 관리</h1>
          <p className="text-lg text-slate-600">EEG, PPG, ACC 측정 데이터 현황 및 관리</p>
        </div>

        {/* 제어 패널 */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="사용자명, 조직명으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-64 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-500"
                />
              </div>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-slate-900"
              >
                <option value="all" className="text-slate-900">전체 데이터 타입</option>
                <option value="EEG" className="text-slate-900">EEG 데이터</option>
                <option value="PPG" className="text-slate-900">PPG 데이터</option>
                <option value="ACC" className="text-slate-900">ACC 데이터</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4 text-green-600 border-slate-300 rounded focus:ring-green-500"
                />
                자동 새로고침
              </label>
              
              <button
                onClick={loadMeasurementData}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                새로고침
              </button>
            </div>
          </div>
        </div>

        {/* 주요 통계 카드 */}
        {dataStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">총 측정 세션</p>
                  <p className="text-2xl font-bold text-slate-900">{dataStats.totalSessions.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 mt-1">{dataStats.period}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <HardDrive className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">데이터 용량</p>
                  <p className="text-2xl font-bold text-slate-900">{dataStats.dataVolume}TB</p>
                  <p className="text-xs text-emerald-600 mt-1">+5.2% 증가</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Database className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">일일 수집량</p>
                  <p className="text-2xl font-bold text-slate-900">{dataStats.dailyCollection}GB</p>
                  <p className="text-xs text-slate-500 mt-1">평균</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <Zap className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">실시간 세션</p>
                  <p className="text-2xl font-bold text-slate-900">{dataStats.realTimeSessions}</p>
                  <p className="text-xs text-slate-500 mt-1">진행 중</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 품질 및 저장소 정보 */}
        {dataStats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 데이터 품질 및 성능 */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">데이터 품질 및 성능</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">평균 데이터 품질</span>
                    <span className="text-lg font-bold text-emerald-600">{dataStats.qualityScore}/100</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div 
                      className="bg-emerald-500 h-3 rounded-full transition-all" 
                      style={{ width: `${dataStats.qualityScore}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">저장소 사용률</span>
                    <span className="text-lg font-bold text-blue-600">{dataStats.storageUsed}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div 
                      className="bg-blue-500 h-3 rounded-full transition-all" 
                      style={{ width: `${dataStats.storageUsed}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-lg mb-2">
                      <Shield className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="font-bold text-slate-900">99.2%</div>
                    <div className="text-xs text-slate-600">데이터 무결성</div>
                  </div>
                  
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg mb-2">
                      <Target className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="font-bold text-slate-900">A+급</div>
                    <div className="text-xs text-slate-600">품질 등급</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 저장소 상세 정보 */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">저장소 상세 정보</h3>
              <div className="space-y-4">
                {storageInfo.map((storage) => (
                  <div key={storage.type} className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-slate-900">{storage.type}</span>
                      </div>
                      <span className="text-sm text-slate-600">+{storage.growthRate}% 증가</span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-700">{storage.used}GB / {storage.total}GB</span>
                      <span className="text-sm font-semibold text-slate-900">
                        {((storage.used / storage.total) * 100).toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all" 
                        style={{ width: `${(storage.used / storage.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 데이터 타입별 현황 */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">데이터 타입별 현황</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dataBreakdown.map((data) => {
              const colors = getTypeColor(data.color)
              return (
                <div key={data.type} className={`p-6 ${colors.bg} border ${colors.border} rounded-xl`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 ${colors.dot} rounded-full`}></div>
                      <span className={`font-medium ${colors.text}`}>{data.type}</span>
                    </div>
                    {getDataTypeIcon(data.type)}
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className={`text-2xl font-bold ${colors.text}`}>{data.volume}TB</div>
                      <div className="text-sm text-slate-600">{data.percentage}% 비율</div>
                    </div>
                    
                    <div>
                      <div className={`text-lg font-semibold ${colors.text}`}>{data.sessions.toLocaleString()}</div>
                      <div className="text-sm text-slate-600">총 세션 수</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 최근 측정 세션 */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">최근 측정 세션</h3>
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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">액션</th>
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
                          {session.quality}/100
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
                        {session.timestamp.toLocaleString()}
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
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-full mb-4">
                  <Search className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">측정 세션을 찾을 수 없습니다</h3>
                <p className="text-slate-600">검색 조건을 변경해보세요.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 