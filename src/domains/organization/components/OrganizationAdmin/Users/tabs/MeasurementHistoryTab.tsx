/**
 * 측정 이력 탭 컴포넌트
 * 
 * 측정 세션 데이터와 이력을 관리하는 인터페이스
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card'
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { Badge } from '@ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/select'
import { 
  Activity,
  Download,
  BarChart3,
  Loader2,
  Search,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  Eye,
  MoreHorizontal,
  RefreshCw,
  Filter,
  TrendingUp
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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

interface MeasurementHistoryTabProps {
  organizationId: string
}

interface MeasurementSession {
  id: string
  userId: string
  userName: string
  startTime: string
  endTime: string
  duration: number
  deviceId: string
  deviceType: string
  quality: 'excellent' | 'good' | 'fair' | 'poor'
  dataSize: number
  notes: string
  status: 'completed' | 'failed' | 'processing'
}

interface SessionFilters {
  search?: string
  status?: string
  quality?: string
  dateRange?: string
}

export default function MeasurementHistoryTab({ organizationId }: MeasurementHistoryTabProps) {
  const [sessions, setSessions] = useState<MeasurementSession[]>([])
  const [filteredSessions, setFilteredSessions] = useState<MeasurementSession[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<SessionFilters>({ dateRange: '7d' })

  // Mock data - replace with actual API calls
  const mockSessions: MeasurementSession[] = [
    {
      id: '1',
      userId: '1',
      userName: '김건강',
      startTime: '2024-01-15 14:30:00',
      endTime: '2024-01-15 14:45:00',
      duration: 15,
      deviceId: 'LB001',
      deviceType: 'LinkBand Pro',
      quality: 'excellent',
      dataSize: 2.4,
      notes: '정상적인 측정 완료',
      status: 'completed'
    },
    {
      id: '2',
      userId: '2',
      userName: '이스트레스',
      startTime: '2024-01-14 10:00:00',
      endTime: '2024-01-14 10:18:00',
      duration: 18,
      deviceId: 'LB002',
      deviceType: 'LinkBand Pro',
      quality: 'good',
      dataSize: 3.1,
      notes: '일부 신호 불안정',
      status: 'completed'
    },
    {
      id: '3',
      userId: '3',
      userName: '박집중',
      startTime: '2024-01-12 16:30:00',
      endTime: '2024-01-12 16:35:00',
      duration: 5,
      deviceId: 'LB003',
      deviceType: 'LinkBand Pro',
      quality: 'fair',
      dataSize: 0.8,
      notes: '측정 중단됨',
      status: 'failed'
    }
  ]

  useEffect(() => {
    loadSessions()
  }, [organizationId])

  useEffect(() => {
    applyFilters()
  }, [sessions, filters])

  const loadSessions = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call
      // const sessionList = await measurementSessionService.getSessions(organizationId)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Mock delay
      setSessions(mockSessions)
    } catch (error) {
      console.error('Failed to load sessions:', error)
      toast.error('측정 이력을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...sessions]

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(session => 
        session.userName.toLowerCase().includes(searchTerm) ||
        session.deviceId.toLowerCase().includes(searchTerm) ||
        session.deviceType.toLowerCase().includes(searchTerm)
      )
    }

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(session => session.status === filters.status)
    }

    if (filters.quality && filters.quality !== 'all') {
      filtered = filtered.filter(session => session.quality === filters.quality)
    }

    // Date range filtering would be implemented here
    // TODO: Implement date range filtering based on filters.dateRange

    setFilteredSessions(filtered)
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'bg-green-100 text-green-700'
      case 'good': return 'bg-blue-100 text-blue-700'
      case 'fair': return 'bg-yellow-100 text-yellow-700'
      case 'poor': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getQualityLabel = (quality: string) => {
    switch (quality) {
      case 'excellent': return '우수'
      case 'good': return '양호'
      case 'fair': return '보통'
      case 'poor': return '불량'
      default: return '알 수 없음'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700'
      case 'failed': return 'bg-red-100 text-red-700'
      case 'processing': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return '완료'
      case 'failed': return '실패'
      case 'processing': return '처리중'
      default: return '알 수 없음'
    }
  }

  // Calculate statistics
  const completedSessions = sessions.filter(s => s.status === 'completed').length
  const failedSessions = sessions.filter(s => s.status === 'failed').length
  const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0)
  const avgDuration = sessions.length > 0 ? Math.round(totalDuration / sessions.length) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">측정 이력</h2>
          <p className="text-sm text-slate-600 mt-1">
            측정 세션 데이터와 품질을 관리할 수 있습니다.
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
          >
            <Download className="w-4 h-4" />
            데이터 내보내기
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 bg-green-600 text-white hover:bg-green-700 border-0"
          >
            <BarChart3 className="w-4 h-4" />
            통계 보기
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">총 세션</p>
              <p className="text-2xl font-bold text-slate-900">{sessions.length}</p>
            </div>
            <Activity className="w-8 h-8 text-slate-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">완료된 세션</p>
              <p className="text-2xl font-bold text-green-600">{completedSessions}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">실패한 세션</p>
              <p className="text-2xl font-bold text-red-600">{failedSessions}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">평균 시간</p>
              <p className="text-2xl font-bold text-slate-900">{avgDuration}분</p>
            </div>
            <Clock className="w-8 h-8 text-slate-400" />
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
                placeholder="사용자명, 디바이스로 검색..."
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => setFilters({ ...filters, status: value })}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="상태 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="completed">완료</SelectItem>
              <SelectItem value="failed">실패</SelectItem>
              <SelectItem value="processing">처리중</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.quality || 'all'}
            onValueChange={(value) => setFilters({ ...filters, quality: value })}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="품질 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 품질</SelectItem>
              <SelectItem value="excellent">우수</SelectItem>
              <SelectItem value="good">양호</SelectItem>
              <SelectItem value="fair">보통</SelectItem>
              <SelectItem value="poor">불량</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.dateRange || '7d'}
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

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-slate-900">측정 세션</CardTitle>
              <CardDescription className="text-slate-600">
                {filteredSessions.length}개의 측정 세션
              </CardDescription>
            </div>
            <Button 
              onClick={loadSessions} 
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
              <span className="ml-2 text-slate-600">측정 이력을 불러오는 중...</span>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {filters.search || filters.status !== 'all' || filters.quality !== 'all' 
                  ? '검색 결과가 없습니다' 
                  : '측정 이력이 없습니다'}
              </h3>
              <p className="text-slate-600 mb-4">
                {filters.search || filters.status !== 'all' || filters.quality !== 'all'
                  ? '다른 검색 조건을 시도해보세요' 
                  : '아직 측정 이력이 없습니다.'}
              </p>
              {!filters.search && filters.status === 'all' && filters.quality === 'all' && (
                <Button className="gap-2 bg-gray-600 text-white hover:bg-gray-700">
                  <TrendingUp className="w-4 h-4" />
                  측정 시작하기
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-slate-900 font-medium">사용자</TableHead>
                  <TableHead className="text-slate-900 font-medium">디바이스</TableHead>
                  <TableHead className="text-slate-900 font-medium">측정 시간</TableHead>
                  <TableHead className="text-slate-900 font-medium">소요 시간</TableHead>
                  <TableHead className="text-slate-900 font-medium">품질</TableHead>
                  <TableHead className="text-slate-900 font-medium">상태</TableHead>
                  <TableHead className="text-slate-900 font-medium">데이터 크기</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="font-medium text-slate-900">{session.userName}</div>
                      <div className="text-sm text-slate-500">{session.userId}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900">{session.deviceType}</div>
                      <div className="text-sm text-slate-500">{session.deviceId}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-900">{session.startTime}</div>
                      <div className="text-sm text-slate-500">~{session.endTime}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-slate-900">
                        <Clock className="w-3 h-3" />
                        {session.duration}분
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={getQualityColor(session.quality)}
                      >
                        {getQualityLabel(session.quality)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={getStatusColor(session.status)}
                      >
                        {getStatusLabel(session.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-slate-600">
                        <FileText className="w-3 h-3" />
                        {session.dataSize}MB
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
                            상세 보기
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="w-4 h-4 mr-2" />
                            데이터 다운로드
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="w-4 h-4 mr-2" />
                            리포트 생성
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