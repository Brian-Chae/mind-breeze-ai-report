/**
 * 리포트 관리 탭 컴포넌트
 * 
 * AI 분석 리포트를 관리하는 인터페이스
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card'
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { Badge } from '@ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/select'
import { 
  FileText,
  Download,
  Plus,
  Loader2,
  Search,
  Mail,
  Send,
  Edit,
  Eye,
  MoreHorizontal,
  RefreshCw,
  TrendingUp,
  Calendar,
  User
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ui/table"
import { toast } from 'sonner'
import { ReportGenerationService } from '@domains/ai-report/services/ReportGenerationService'
import { ReportInstance } from '@domains/ai-report/types'

interface ReportManagementTabProps {
  organizationId: string
}

// ReportInstance를 UserReport로 매핑하기 위한 타입 정의
interface UserReport {
  id: string
  userId: string
  userName: string
  title: string
  type: 'stress' | 'focus' | 'wellness' | 'comprehensive'
  createdAt: string
  status: 'generated' | 'processing' | 'failed'
  quality: number
  sentTo: string[]
  downloadCount: number
}

interface ReportFilters {
  search?: string
  type?: string
  status?: string
  dateRange?: string
}

export default function ReportManagementTab({ organizationId }: ReportManagementTabProps) {
  const [reports, setReports] = useState<UserReport[]>([])
  const [filteredReports, setFilteredReports] = useState<UserReport[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ReportFilters>({ dateRange: '30d' })
  const reportService = new ReportGenerationService()

  useEffect(() => {
    loadReports()
  }, [organizationId])

  useEffect(() => {
    applyFilters()
  }, [reports, filters])

  const loadReports = async () => {
    try {
      setLoading(true)
      
      // 조직의 모든 사용자들의 리포트를 가져오는 로직
      // 현재는 임시로 빈 배열을 반환하지만, 실제로는 조직 사용자들을 먼저 조회한 후 각 사용자의 리포트를 가져와야 함
      // TODO: 조직의 사용자 목록을 먼저 조회하고, 각 사용자별로 리포트를 가져오는 로직 구현
      
      const allReports: UserReport[] = []
      
      // 임시로 빈 배열 설정 (실제 구현 시 제거)
      setReports(allReports)
      
    } catch (error) {
      console.error('Failed to load reports:', error)
      toast.error('리포트 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...reports]

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(report => 
        report.title.toLowerCase().includes(searchTerm) ||
        report.userName.toLowerCase().includes(searchTerm)
      )
    }

    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(report => report.type === filters.type)
    }

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(report => report.status === filters.status)
    }

    // Date range filtering would be implemented here
    // TODO: Implement date range filtering based on filters.dateRange

    setFilteredReports(filtered)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'stress': return 'bg-red-100 text-red-700'
      case 'focus': return 'bg-blue-100 text-blue-700'
      case 'wellness': return 'bg-green-100 text-green-700'
      case 'comprehensive': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'stress': return '스트레스'
      case 'focus': return '집중력'
      case 'wellness': return '웰니스'
      case 'comprehensive': return '종합'
      default: return '기타'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generated': return 'bg-green-100 text-green-700'
      case 'processing': return 'bg-yellow-100 text-yellow-700'
      case 'failed': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'generated': return '생성완료'
      case 'processing': return '처리중'
      case 'failed': return '실패'
      default: return '알 수 없음'
    }
  }

  // Calculate statistics
  const generatedReports = reports.filter(r => r.status === 'generated').length
  const processingReports = reports.filter(r => r.status === 'processing').length
  const totalDownloads = reports.reduce((sum, r) => sum + r.downloadCount, 0)
  const avgQuality = reports.length > 0 
    ? Math.round(reports.filter(r => r.quality > 0).reduce((sum, r) => sum + r.quality, 0) / reports.filter(r => r.quality > 0).length)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">리포트 관리</h2>
          <p className="text-sm text-slate-600 mt-1">
            AI 분석 리포트를 관리하고 배포할 수 있습니다.
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
          >
            <Download className="w-4 h-4" />
            일괄 다운로드
          </Button>
          <Button className="gap-2 bg-purple-600 hover:bg-purple-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200">
            <Plus className="w-4 h-4" />
            리포트 생성
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">총 리포트</p>
              <p className="text-2xl font-bold text-slate-900">{reports.length}</p>
            </div>
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">생성 완료</p>
              <p className="text-2xl font-bold text-green-600">{generatedReports}</p>
            </div>
            <FileText className="w-8 h-8 text-green-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">총 다운로드</p>
              <p className="text-2xl font-bold text-blue-600">{totalDownloads}</p>
            </div>
            <Download className="w-8 h-8 text-blue-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">평균 품질</p>
              <p className="text-2xl font-bold text-purple-600">{avgQuality}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-400" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="리포트 제목, 사용자명으로 검색..."
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>
          <Select
            value={filters.type || 'all'}
            onValueChange={(value) => setFilters({ ...filters, type: value })}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="유형 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 유형</SelectItem>
              <SelectItem value="stress">스트레스</SelectItem>
              <SelectItem value="focus">집중력</SelectItem>
              <SelectItem value="wellness">웰니스</SelectItem>
              <SelectItem value="comprehensive">종합</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => setFilters({ ...filters, status: value })}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="상태 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="generated">생성완료</SelectItem>
              <SelectItem value="processing">처리중</SelectItem>
              <SelectItem value="failed">실패</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.dateRange || '30d'}
            onValueChange={(value) => setFilters({ ...filters, dateRange: value })}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="기간 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">최근 7일</SelectItem>
              <SelectItem value="30d">최근 30일</SelectItem>
              <SelectItem value="90d">최근 90일</SelectItem>
              <SelectItem value="all">전체</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-slate-900">리포트 목록</CardTitle>
              <CardDescription className="text-slate-600">
                {filteredReports.length}개의 리포트
              </CardDescription>
            </div>
            <Button 
              onClick={loadReports} 
              variant="outline" 
              size="sm" 
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              <span className="ml-2 text-slate-600">리포트 목록을 불러오는 중...</span>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {filters.search || filters.type !== 'all' || filters.status !== 'all'
                  ? '검색 결과가 없습니다'
                  : '리포트가 없습니다'}
              </h3>
              <p className="text-slate-600 mb-4">
                {filters.search || filters.type !== 'all' || filters.status !== 'all'
                  ? '다른 검색 조건을 시도해보세요' 
                  : '첫 번째 리포트를 생성해보세요'}
              </p>
              {!filters.search && filters.type === 'all' && filters.status === 'all' && (
                <Button className="gap-2 bg-purple-600 text-white hover:bg-purple-700">
                  <Plus className="w-4 h-4" />
                  리포트 생성
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-slate-900 font-medium">리포트</TableHead>
                  <TableHead className="text-slate-900 font-medium">사용자</TableHead>
                  <TableHead className="text-slate-900 font-medium">유형</TableHead>
                  <TableHead className="text-slate-900 font-medium">상태</TableHead>
                  <TableHead className="text-slate-900 font-medium">품질</TableHead>
                  <TableHead className="text-slate-900 font-medium">발송</TableHead>
                  <TableHead className="text-slate-900 font-medium">다운로드</TableHead>
                  <TableHead className="text-slate-900 font-medium">생성일</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div className="font-medium text-slate-900">{report.title}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full">
                          <User className="w-3 h-3 text-blue-600" />
                        </div>
                        <span className="text-slate-900">{report.userName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={getTypeColor(report.type)}
                      >
                        {getTypeLabel(report.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={getStatusColor(report.status)}
                      >
                        {getStatusLabel(report.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {report.quality > 0 ? (
                        <Badge variant="outline" className="text-slate-900 border-slate-300">
                          {report.quality}%
                        </Badge>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-slate-600">
                        <Mail className="w-3 h-3" />
                        {report.sentTo.length}명
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-slate-600">
                        <Download className="w-3 h-3" />
                        {report.downloadCount}회
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-slate-600">
                        <Calendar className="w-3 h-3" />
                        {new Date(report.createdAt).toLocaleDateString('ko-KR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            미리보기
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="w-4 h-4 mr-2" />
                            다운로드
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Send className="w-4 h-4 mr-2" />
                            메일 발송
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            수정
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}