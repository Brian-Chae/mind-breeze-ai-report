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
  PieChart
} from 'lucide-react'

interface ReportStat {
  period: string
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
      // 실제 API 호출 대신 mock 데이터
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setReportStats({
        period: '2024년 1월',
        totalReports: 8450,
        dailyAverage: 280,
        averageProcessingTime: 2.5,
        activeUsers: 1250,
        qualityScore: 94.2,
        errorRate: 1.8
      })

      setEngineStats([
        { engineName: 'Basic Gemini V1', reportsGenerated: 4200, averageQuality: 95.2, processingTime: 2.1, successRate: 98.5, usage: 49.7 },
        { engineName: 'Advanced GPT-4', reportsGenerated: 2800, averageQuality: 96.8, processingTime: 3.2, successRate: 99.2, usage: 33.1 },
        { engineName: 'Claude Sonnet', reportsGenerated: 1200, averageQuality: 97.1, processingTime: 2.8, successRate: 99.0, usage: 14.2 },
        { engineName: 'Custom Engine', reportsGenerated: 250, averageQuality: 89.5, processingTime: 4.1, successRate: 95.8, usage: 3.0 }
      ])

      setRecentReports([
        { id: '1', userName: '김건강', organizationName: '테크컴퍼니', engineUsed: 'Basic Gemini V1', qualityScore: 96, processingTime: 2.3, createdAt: new Date(), status: 'completed' },
        { id: '2', userName: '이웰빙', organizationName: '헬스케어솔루션', engineUsed: 'Advanced GPT-4', qualityScore: 98, processingTime: 3.1, createdAt: new Date(), status: 'completed' },
        { id: '3', userName: '박마음', organizationName: '마인드케어', engineUsed: 'Claude Sonnet', qualityScore: 94, processingTime: 2.8, createdAt: new Date(), status: 'processing' },
        { id: '4', userName: '정스트레스', organizationName: '스마트웰니스', engineUsed: 'Basic Gemini V1', qualityScore: 92, processingTime: 2.1, createdAt: new Date(), status: 'completed' },
        { id: '5', userName: '최건강', organizationName: '디지털헬스', engineUsed: 'Advanced GPT-4', qualityScore: 0, processingTime: 0, createdAt: new Date(), status: 'failed' }
      ])
    } catch (error) {
      console.error('리포트 데이터 로드 실패:', error)
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
    if (engineName.includes('Gemini')) return <Zap className="w-4 h-4 text-blue-600" />
    if (engineName.includes('GPT')) return <Cpu className="w-4 h-4 text-green-600" />
    if (engineName.includes('Claude')) return <Target className="w-4 h-4 text-purple-600" />
    return <Activity className="w-4 h-4 text-slate-600" />
  }

  const filteredReports = recentReports.filter(report => {
    const matchesSearch = report.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.organizationName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEngine = filterEngine === 'all' || report.engineUsed === filterEngine
    return matchesSearch && matchesEngine
  })

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

        {/* 주요 통계 카드 */}
        {reportStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">총 리포트</p>
                  <p className="text-2xl font-bold text-slate-900">{reportStats.totalReports.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 mt-1">{reportStats.period}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">일일 평균</p>
                  <p className="text-2xl font-bold text-slate-900">{reportStats.dailyAverage}</p>
                  <p className="text-xs text-emerald-600 mt-1">+12% 증가</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">평균 처리 시간</p>
                  <p className="text-2xl font-bold text-slate-900">{reportStats.averageProcessingTime}분</p>
                  <p className="text-xs text-slate-500 mt-1">AI 분석</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">활성 사용자</p>
                  <p className="text-2xl font-bold text-slate-900">{reportStats.activeUsers.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 mt-1">리포트 요청</p>
                </div>
              </div>
            </div>
          </div>
        )}

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
                  className="pl-10 pr-4 py-2.5 w-64 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-500"
                />
              </div>
              
              <select
                value={filterEngine}
                onChange={(e) => setFilterEngine(e.target.value)}
                className="px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-slate-900"
              >
                <option value="all" className="text-slate-900">전체 엔진</option>
                <option value="Basic Gemini V1" className="text-slate-900">Basic Gemini V1</option>
                <option value="Advanced GPT-4" className="text-slate-900">Advanced GPT-4</option>
                <option value="Claude Sonnet" className="text-slate-900">Claude Sonnet</option>
                <option value="Custom Engine" className="text-slate-900">Custom Engine</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                />
                자동 새로고침
              </label>
              
              <button
                onClick={loadReportData}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                새로고침
              </button>
            </div>
          </div>
        </div>

        {/* 품질 및 성능 지표 */}
        {reportStats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">품질 및 성능 지표</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">평균 품질 점수</span>
                    <span className="text-lg font-bold text-emerald-600">{reportStats.qualityScore}/100</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div 
                      className="bg-emerald-500 h-3 rounded-full transition-all" 
                      style={{ width: `${reportStats.qualityScore}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">에러율</span>
                    <span className="text-lg font-bold text-red-600">{reportStats.errorRate}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div 
                      className="bg-red-500 h-3 rounded-full transition-all" 
                      style={{ width: `${reportStats.errorRate}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-lg mb-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="font-bold text-slate-900">{(100 - reportStats.errorRate).toFixed(1)}%</div>
                    <div className="text-xs text-slate-600">성공률</div>
                  </div>
                  
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg mb-2">
                      <Award className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="font-bold text-slate-900">A급</div>
                    <div className="text-xs text-slate-600">품질 등급</div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI 엔진별 성능 */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">AI 엔진별 성능</h3>
              <div className="space-y-4">
                {engineStats.map((engine) => (
                  <div key={engine.engineName} className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getEngineIcon(engine.engineName)}
                        <span className="font-medium text-slate-900">{engine.engineName}</span>
                      </div>
                      <span className="text-sm text-slate-600">{engine.usage}% 사용</span>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-3 text-center text-sm">
                      <div>
                        <div className="font-semibold text-slate-900">{engine.reportsGenerated.toLocaleString()}</div>
                        <div className="text-slate-600">리포트</div>
                      </div>
                      <div>
                        <div className={`font-semibold ${getQualityColor(engine.averageQuality)}`}>
                          {engine.averageQuality.toFixed(1)}
                        </div>
                        <div className="text-slate-600">품질</div>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{engine.processingTime.toFixed(1)}분</div>
                        <div className="text-slate-600">처리시간</div>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{engine.successRate.toFixed(1)}%</div>
                        <div className="text-slate-600">성공률</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 최근 리포트 목록 */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">최근 생성된 리포트</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">사용자</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">조직</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">AI 엔진</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">품질 점수</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">처리 시간</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">상태</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">생성 시간</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">액션</th>
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
                          {report.qualityScore}/100
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {report.status === 'completed' ? (
                        <div className="text-slate-900">{report.processingTime.toFixed(1)}분</div>
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
                        {report.createdAt.toLocaleString()}
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
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-full mb-4">
                  <Search className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">리포트를 찾을 수 없습니다</h3>
                <p className="text-slate-600">검색 조건을 변경해보세요.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 