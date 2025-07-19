import React, { useState, useEffect } from 'react'
import { 
  FileText, 
  TrendingUp, 
  Clock, 
  Users, 
  RefreshCw,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Download,
  AlertTriangle,
  CheckCircle,
  Star,
  Zap,
  BarChart3,
  Activity,
  Calendar,
  Award,
  Cpu,
  Target,
  TrendingDown,
  PieChart,
  Upload,
  Settings
} from 'lucide-react'
import { toast } from 'sonner'
import systemAdminService from '../../../../services/SystemAdminService'

interface ReportStat {
  totalReports: number
  dailyAverage: number
  averageProcessingTime: number
  activeUsers: number
  qualityScore: number
  errorRate: number
}

interface EngineStats {
  engineName: string
  reportsGenerated: number
  averageQuality: number
  processingTime: number
  successRate: number
  usage: number
}

interface RecentReport {
  id: string
  userName: string
  organizationName: string
  engineUsed: string
  qualityScore: number
  processingTime: number
  createdAt: Date
  status: 'completed' | 'processing' | 'failed'
}

export default function ReportManagementContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [reportStats, setReportStats] = useState<ReportStat | null>(null)
  const [engineStats, setEngineStats] = useState<EngineStats[]>([])
  const [recentReports, setRecentReports] = useState<RecentReport[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEngine, setFilterEngine] = useState<string>('all')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'engines' | 'reports'>('overview')

  useEffect(() => {
    loadReportData()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(loadReportData, 30000) // 30초마다 새로고침
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const loadReportData = async () => {
    setIsLoading(true)
    try {
      console.log('📊 리포트 관리 데이터 로드 시작...')
      
      // 실제 데이터 로드
      const [overview, engines, recent] = await Promise.all([
        systemAdminService.getReportManagementOverview(),
        systemAdminService.getEngineUsageStatistics(),
        systemAdminService.getRecentReports(50)
      ])
      
      setReportStats(overview)
      setEngineStats(engines)
      setRecentReports(recent)
      
      console.log('✅ 리포트 관리 데이터 로드 완료:', {
        overview,
        engineCount: engines.length,
        recentCount: recent.length
      })
      
    } catch (error) {
      console.error('❌ 리포트 데이터 로드 실패:', error)
      toast.error('리포트 데이터를 불러오는데 실패했습니다.')
      
      // 에러 시 기본값 설정
      setReportStats({
        totalReports: 0,
        dailyAverage: 0,
        averageProcessingTime: 0,
        activeUsers: 0,
        qualityScore: 0,
        errorRate: 0
      })
      setEngineStats([])
      setRecentReports([])
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

  const getEngineIcon = (engineName: string) => {
    if (engineName.includes('Gemini') || engineName.includes('gemini')) return <Zap className="w-5 h-5 text-blue-600" />
    if (engineName.includes('GPT') || engineName.includes('gpt')) return <Cpu className="w-5 h-5 text-green-600" />
    if (engineName.includes('Claude') || engineName.includes('claude')) return <Target className="w-5 h-5 text-purple-600" />
    return <Activity className="w-5 h-5 text-slate-600" />
  }

  const filteredReports = recentReports.filter(report => {
    const matchesSearch = report.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.engineUsed.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesEngine = filterEngine === 'all' || report.engineUsed === filterEngine
    
    return matchesSearch && matchesEngine
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

  // 개요 탭 렌더링
  const renderOverviewTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">리포트 현황 개요</h2>
            <p className="text-slate-600 mt-1">AI 리포트 생성 현황 및 전체 통계</p>
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
              onClick={loadReportData}
              disabled={isLoading}
              className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              새로고침
            </button>
          </div>
        </div>
        
        {/* 리포트 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">전체 리포트</p>
                <p className="text-2xl font-bold text-blue-900">{formatNumber(reportStats?.totalReports || 0)}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">일평균</p>
                <p className="text-2xl font-bold text-green-900">{reportStats?.dailyAverage || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">평균 처리시간</p>
                <p className="text-2xl font-bold text-purple-900">{reportStats?.averageProcessingTime || 0}초</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">활성 사용자</p>
                <p className="text-2xl font-bold text-orange-900">{formatNumber(reportStats?.activeUsers || 0)}</p>
              </div>
              <Users className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700">품질 점수</p>
                <p className="text-2xl font-bold text-emerald-900">{reportStats?.qualityScore || 0}%</p>
              </div>
              <Star className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          
          <div className="bg-red-50 rounded-xl p-4 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">에러율</p>
                <p className="text-2xl font-bold text-red-900">{reportStats?.errorRate || 0}%</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // 엔진별 성능 탭 렌더링
  const renderEnginesTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">AI 엔진별 성능</h2>
            <p className="text-slate-600 mt-1">각 AI 엔진의 성능 지표 및 사용률</p>
          </div>
          <div className="flex gap-3">
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
              <Settings className="w-4 h-4" />
              엔진 설정
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          {engineStats.map((engine) => (
            <div key={engine.engineName} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getEngineIcon(engine.engineName)}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{engine.engineName}</h3>
                    <p className="text-sm text-slate-600">{engine.usage}% 사용률</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button className="text-slate-600 hover:text-slate-900">
                    <Eye className="w-5 h-5" />
                  </button>
                  <button className="text-slate-600 hover:text-slate-900">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-3 bg-white rounded-lg">
                  <p className="text-sm font-medium text-slate-600">생성 수</p>
                  <p className="text-xl font-bold text-slate-900">{formatNumber(engine.reportsGenerated)}</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <p className="text-sm font-medium text-slate-600">평균 품질</p>
                  <p className={`text-xl font-bold ${getQualityColor(engine.averageQuality)}`}>
                    {engine.averageQuality}%
                  </p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <p className="text-sm font-medium text-slate-600">처리시간</p>
                  <p className="text-xl font-bold text-slate-900">{engine.processingTime}초</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <p className="text-sm font-medium text-slate-600">성공률</p>
                  <p className="text-xl font-bold text-slate-900">{engine.successRate}%</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <p className="text-sm font-medium text-slate-600">사용률</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${engine.usage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{engine.usage}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {engineStats.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Cpu className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>AI 엔진 데이터가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  )

  // 최근 리포트 탭 렌더링
  const renderReportsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">최근 리포트</h2>
            <p className="text-slate-600 mt-1">최근 생성된 AI 리포트 목록</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="사용자, 조직, 엔진 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-64 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-500"
              />
            </div>
            <select
              value={filterEngine}
              onChange={(e) => setFilterEngine(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
            >
              <option value="all">모든 엔진</option>
              {engineStats.map(engine => (
                <option key={engine.engineName} value={engine.engineName}>
                  {engine.engineName}
                </option>
              ))}
            </select>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              리포트 내보내기
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">사용자</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">조직</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">엔진</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">품질</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">처리시간</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">상태</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">생성일시</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{report.userName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-900">{report.organizationName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getEngineIcon(report.engineUsed)}
                      <span className="text-slate-900">{report.engineUsed}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {report.status === 'completed' ? (
                      <div className={`font-semibold ${getQualityColor(report.qualityScore)}`}>
                        {report.qualityScore}%
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {report.status === 'completed' ? (
                      <div className="text-slate-900">{report.processingTime}초</div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
                      {getStatusText(report.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-600">
                      {formatDate(report.createdAt)}
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

          {filteredReports.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>조건에 맞는 리포트가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">리포트 데이터 로드 중</h3>
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">리포트 관리</h1>
          <p className="text-lg text-slate-600">AI 리포트 현황 및 성능 모니터링</p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-2">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span>개요</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('engines')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'engines'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Cpu className="w-4 h-4" />
                <span>AI 엔진</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'reports'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" />
                <span>최근 리포트</span>
              </div>
            </button>
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'engines' && renderEnginesTab()}
        {activeTab === 'reports' && renderReportsTab()}
      </div>
    </div>
  )
} 