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
    if (engineName.includes('Gemini') || engineName.includes('gemini')) return <Zap className="w-4 h-4 text-blue-600" />
    if (engineName.includes('GPT') || engineName.includes('gpt')) return <Cpu className="w-4 h-4 text-green-600" />
    if (engineName.includes('Claude') || engineName.includes('claude')) return <Target className="w-4 h-4 text-purple-600" />
    return <Activity className="w-4 h-4 text-slate-600" />
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">리포트 데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">리포트 관리</h1>
          <p className="text-gray-600">AI 리포트 생성 현황과 엔진 성능을 모니터링하세요</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-blue-50 border-blue-200' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            자동 새로고침 {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button onClick={loadReportData} disabled={isLoading}>
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
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">전체 리포트</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(reportStats?.totalReports || 0)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-100">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">일평균</p>
              <p className="text-2xl font-bold text-gray-900">{reportStats?.dailyAverage || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-purple-100">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">평균 처리시간</p>
              <p className="text-2xl font-bold text-gray-900">{reportStats?.averageProcessingTime || 0}초</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-orange-100">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">활성 사용자</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(reportStats?.activeUsers || 0)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-emerald-100">
              <Star className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">품질 점수</p>
              <p className="text-2xl font-bold text-gray-900">{reportStats?.qualityScore || 0}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">에러율</p>
              <p className="text-2xl font-bold text-gray-900">{reportStats?.errorRate || 0}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 엔진별 통계 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">AI 엔진별 성능</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  엔진
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  생성 수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  평균 품질
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  처리시간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  성공률
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  사용률
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {engineStats.map((engine) => (
                <tr key={engine.engineName} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getEngineIcon(engine.engineName)}
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{engine.engineName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(engine.reportsGenerated)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={getQualityColor(engine.averageQuality)}>
                      {engine.averageQuality}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {engine.processingTime}초
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {engine.successRate}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${engine.usage}%` }}
                        ></div>
                      </div>
                      <span>{engine.usage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 최근 리포트 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">최근 리포트</h3>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="사용자, 조직, 엔진 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <select
              value={filterEngine}
              onChange={(e) => setFilterEngine(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">모든 엔진</option>
              {engineStats.map(engine => (
                <option key={engine.engineName} value={engine.engineName}>
                  {engine.engineName}
                </option>
              ))}
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
                  엔진
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  품질
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  처리시간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  생성일시
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {report.userName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.organizationName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getEngineIcon(report.engineUsed)}
                      <span className="ml-2 text-sm text-gray-900">{report.engineUsed}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {report.status === 'completed' ? (
                      <span className={getQualityColor(report.qualityScore)}>
                        {report.qualityScore}%
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.status === 'completed' ? `${report.processingTime}초` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getStatusColor(report.status)}>
                      {getStatusText(report.status)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(report.createdAt)}
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
        
        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">리포트가 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">검색 조건을 변경해보세요.</p>
          </div>
        )}
      </Card>
    </div>
  )
} 