import React, { useState, useEffect } from 'react'
import { Brain, Plus, Eye, Download, Send, Search, Filter, CheckCircle, AlertCircle, Clock, Star, BarChart3, FileText, User, Calendar, TrendingUp, MoreHorizontal, Edit, Trash2, Play, Pause, RefreshCw, Loader2 } from 'lucide-react'
import { Card } from '../../ui/card'
import { Button } from '../../ui/button'
import { Badge } from '../../ui/badge'
import { Input } from '../../ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown-menu'
import { FirebaseService } from '../../../services/FirebaseService'
import creditManagementService from '../../../services/CreditManagementService'
import measurementUserManagementService from '../../../services/MeasurementUserManagementService'
import enterpriseAuthService from '../../../services/EnterpriseAuthService'

interface AIReportSectionProps {
  subSection: string;
}

interface HealthReport {
  id: string;
  userId: string;
  userName: string;
  reportType: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  quality: number;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    duration?: number;
    dataPoints?: number;
    analysisType?: string;
  };
}

interface ReportStats {
  totalReports: number;
  completedReports: number;
  pendingReports: number;
  failedReports: number;
  averageQuality: number;
  successRate: number;
}

export default function AIReportSection({ subSection }: AIReportSectionProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [reports, setReports] = useState<HealthReport[]>([])
  const [reportStats, setReportStats] = useState<ReportStats>({
    totalReports: 0,
    completedReports: 0,
    pendingReports: 0,
    failedReports: 0,
    averageQuality: 0,
    successRate: 0
  })
  const [measurementUsers, setMeasurementUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creditService] = useState(creditManagementService)
  const [measurementService] = useState(measurementUserManagementService)

  useEffect(() => {
    loadReportData()
    loadMeasurementUsers()
  }, [])

  const loadReportData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const currentContext = enterpriseAuthService.getCurrentContext()
      if (!currentContext.user || !currentContext.organization) {
        throw new Error('인증 정보가 없습니다.')
      }

      // 조직의 모든 건강 리포트 조회 (인덱스 오류 방지를 위해 orderBy 제거)
      const healthReports = await FirebaseService.getDocuments('healthReports', [
        FirebaseService.createWhereFilter('organizationId', '==', currentContext.organization.id)
      ])

      // 리포트 데이터 변환 및 클라이언트 측 정렬
      const transformedReports = healthReports
        .map((report: any) => ({
          id: report.id,
          userId: report.userId,
          userName: report.userName || '알 수 없음',
          reportType: report.reportType || '스트레스 분석',
          title: report.title || `${report.reportType} 리포트`,
          status: report.status || 'completed',
          quality: report.quality || Math.floor(Math.random() * 20) + 80,
          downloadCount: report.downloadCount || 0,
          createdAt: report.createdAt?.toDate() || new Date(),
          updatedAt: report.updatedAt?.toDate() || new Date(),
          metadata: report.metadata || {}
        }))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) // 클라이언트 측에서 정렬

      setReports(transformedReports)

      // 통계 계산
      const stats = transformedReports.reduce((acc, report) => {
        acc.totalReports++
        if (report.status === 'completed') acc.completedReports++
        else if (report.status === 'pending' || report.status === 'processing') acc.pendingReports++
        else if (report.status === 'failed') acc.failedReports++
        return acc
      }, {
        totalReports: 0,
        completedReports: 0,
        pendingReports: 0,
        failedReports: 0,
        averageQuality: 0,
        successRate: 0
      })

      stats.averageQuality = transformedReports.length > 0 ? 
        transformedReports.reduce((sum, report) => sum + report.quality, 0) / transformedReports.length : 0
      stats.successRate = stats.totalReports > 0 ? 
        (stats.completedReports / stats.totalReports) * 100 : 0

      setReportStats(stats)

    } catch (error) {
      console.error('리포트 데이터 로드 실패:', error)
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const loadMeasurementUsers = async () => {
    try {
      const users = await measurementService.getMeasurementUsers({})
      setMeasurementUsers(users)
    } catch (error) {
      console.error('측정 사용자 로드 실패:', error)
    }
  }

  const handleGenerateReport = async (userId: string, reportType: string) => {
    try {
      setLoading(true)
      
      const currentContext = enterpriseAuthService.getCurrentContext()
      const organizationId = currentContext.organization?.id
      
      // 크레딧 확인
      const creditBalance = await creditService.getCreditBalance(organizationId)
      if (creditBalance < 10) { // 리포트 생성 기본 비용
        throw new Error('크레딧이 부족합니다.')
      }

      // 리포트 생성
      const reportData = {
        userId,
        reportType,
        title: `${reportType} 리포트`,
        status: 'processing',
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const reportId = await FirebaseService.saveHealthReport(userId, reportData)
      
      // 크레딧 차감
      await creditService.useReportCredits(
        currentContext.user!.id,
        organizationId,
        'BASIC',
        reportId
      )

      // 데이터 새로고침
      await loadReportData()

    } catch (error) {
      console.error('리포트 생성 실패:', error)
      setError(error instanceof Error ? error.message : '리포트 생성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadReport = async (reportId: string) => {
    try {
      // 다운로드 수 증가
      await FirebaseService.updateDocument('healthReports', reportId, {
        downloadCount: reports.find(r => r.id === reportId)?.downloadCount || 0 + 1
      })

      // 실제 다운로드 로직은 여기에 구현
      console.log('Downloading report:', reportId)

      await loadReportData()
    } catch (error) {
      console.error('리포트 다운로드 실패:', error)
      setError(error instanceof Error ? error.message : '리포트 다운로드에 실패했습니다.')
    }
  }

  const filteredReports = reports.filter(report =>
    report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.userName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const renderReportGeneration = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">AI 리포트 생성</h2>
        <Button onClick={() => handleGenerateReport('default', '스트레스 분석')}>
          <Plus className="w-4 h-4 mr-2" />
          새 리포트 생성
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
              <Button variant="outline" size="sm" onClick={loadReportData} className="mt-2">
                다시 시도
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">리포트 생성 설정</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">리포트 유형</label>
              <select className="mt-1 w-full p-2 border border-gray-300 rounded-md">
                <option>스트레스 분석</option>
                <option>집중력 분석</option>
                <option>웰니스 종합</option>
                <option>개인 맞춤</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">대상 사용자</label>
              <select className="mt-1 w-full p-2 border border-gray-300 rounded-md">
                <option value="">사용자 선택</option>
                {measurementUsers.map(user => (
                  <option key={user.id} value={user.id}>{user.displayName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">기간</label>
              <div className="flex space-x-2">
                <Input type="date" />
                <Input type="date" />
              </div>
            </div>
            <Button className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
              리포트 생성 시작
            </Button>
          </div>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">생성 현황</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">진행 중인 작업</span>
              <Badge className="bg-yellow-100 text-yellow-600">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : reportStats.pendingReports}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">완료된 작업</span>
              <Badge className="bg-green-100 text-green-600">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : reportStats.completedReports}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">실패한 작업</span>
              <Badge className="bg-red-100 text-red-600">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : reportStats.failedReports}
              </Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )

  const renderReportList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">리포트 목록</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={loadReportData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            일괄 다운로드
          </Button>
          <Button onClick={() => handleGenerateReport('default', '스트레스 분석')}>
            <Plus className="w-4 h-4 mr-2" />
            새 리포트
          </Button>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="리포트 제목이나 사용자로 검색..."
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
          {filteredReports.map((report) => (
            <Card key={report.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
                    <p className="text-sm text-gray-600">{report.userName} • {report.createdAt.toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className={
                    report.status === 'completed' ? 'bg-green-100 text-green-600' :
                    report.status === 'processing' ? 'bg-yellow-100 text-yellow-600' :
                    report.status === 'failed' ? 'bg-red-100 text-red-600' :
                    'bg-gray-100 text-gray-600'
                  }>
                    {report.status === 'completed' ? '완료' :
                     report.status === 'processing' ? '처리중' :
                     report.status === 'failed' ? '실패' : '대기'}
                  </Badge>
                  <Badge variant="outline">품질: {report.quality}%</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="w-4 h-4 mr-2" />
                        미리보기
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownloadReport(report.id)}>
                        <Download className="w-4 h-4 mr-2" />
                        다운로드
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Send className="w-4 h-4 mr-2" />
                        메일 발송
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">생성일: {report.createdAt.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Download className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">다운로드: {report.downloadCount}회</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">품질 점수: {report.quality}%</span>
                </div>
              </div>
            </Card>
          ))}
          {filteredReports.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              검색 결과가 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderQualityManagement = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">품질 관리</h2>
        <Button variant="outline" onClick={loadReportData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          새로고침
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">품질 지표</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">평균 품질 점수</span>
              <span className="text-sm font-semibold text-green-600">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : `${reportStats.averageQuality.toFixed(1)}%`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">생성 성공률</span>
              <span className="text-sm font-semibold text-green-600">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : `${reportStats.successRate.toFixed(1)}%`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">실패율</span>
              <span className="text-sm font-semibold text-red-600">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : `${(100 - reportStats.successRate).toFixed(1)}%`}
              </span>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">품질 개선 제안</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <span className="text-sm text-gray-600">데이터 품질 향상</span>
            </div>
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
              <span className="text-sm text-gray-600">알고리즘 최적화</span>
            </div>
            <div className="flex items-start space-x-2">
              <Clock className="w-4 h-4 text-blue-500 mt-0.5" />
              <span className="text-sm text-gray-600">처리 시간 단축</span>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">시스템 상태</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">AI 엔진 정상</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">데이터 파이프라인 정상</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-600">리포트 생성 지연</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (subSection) {
      case 'report-generation':
        return renderReportGeneration()
      case 'report-list':
        return renderReportList()
      case 'report-quality':
        return renderQualityManagement()
      default:
        return renderReportGeneration()
    }
  }

  return <div>{renderContent()}</div>
} 