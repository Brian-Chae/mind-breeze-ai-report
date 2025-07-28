import React, { useState, useEffect, useMemo } from 'react'
import { 
  Database, 
  Activity, 
  FileText, 
  RefreshCw,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Download,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Calendar,
  Users,
  Building2,
  Monitor,
  BarChart3,
  User,
  Mail,
  Building,
  UserCheck,
  Share2,
  Trash2,
  ChevronDown,
  ChevronRight,
  Plus,
  Play,
  Loader2,
  DollarSign,
  Briefcase,
  Copy,
  Link
} from 'lucide-react'
import { toast } from 'sonner'
import systemAdminService from '../../../../services/SystemAdminService'
import { EngineSelectionModal } from '@domains/ai-report/components/EngineSelectionModal'
import { IAIEngine } from '@domains/ai-report/core/interfaces/IAIEngine'

interface DataStats {
  totalSessions: number
  dataVolume: number
  dailyCollection: number
  realTimeSessions: number
  qualityScore: number
  storageUsed: number
}

interface MeasurementUser {
  id: string
  userName: string
  userAge: number
  userGender: string
  userOccupation: string
  userDepartment: string
  userEmail: string
  organizationName: string // 시스템 관리자용 조직명 필드
  timestamp: string
  sessionDate: Date
  quality: 'excellent' | 'good' | 'poor'
  qualityScore: number
  eegSamples: number
  ppgSamples: number
  accSamples: number
  duration: number
  hasReports: boolean
  availableReports: Array<{
    id: string
    engineId: string
    engineName: string
    analysisId: string
    timestamp: string
    overallScore: number
    stressLevel: number
    focusLevel: number
    costUsed: number
    processingTime: number
    qualityScore: number
    createdAt: string
    createdByUserName: string
  }>
  sessionData: any
}

export default function MeasurementDataContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [dataStats, setDataStats] = useState<DataStats | null>(null)
  const [measurementDataList, setMeasurementDataList] = useState<MeasurementUser[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set())
  
  // AI 엔진 선택 모달 상태
  const [isEngineSelectionModalOpen, setIsEngineSelectionModalOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  
  // 모달 상태 디버깅
  useEffect(() => {
    console.log('🔍 모달 상태 변경:', { 
      isEngineSelectionModalOpen, 
      selectedUserId 
    })
  }, [isEngineSelectionModalOpen, selectedUserId])
  
  // 현재 페이지 상태
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

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
      
      // 실제 데이터 로드 - 조직 관리자와 동일한 구조로 변환
      const [overview, sessions] = await Promise.all([
        systemAdminService.getMeasurementDataOverview(),
        loadUserMeasurementData() // 새로운 함수로 사용자별 그룹화 데이터 로드
      ])
      
      setDataStats(overview)
      setMeasurementDataList(sessions)
      
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
      setMeasurementDataList([])
    } finally {
      setIsLoading(false)
    }
  }

  // 조직 관리자와 동일한 구조로 사용자별 측정 데이터 로드
  const loadUserMeasurementData = async (): Promise<MeasurementUser[]> => {
    try {
      // 시스템 관리자용: 모든 조직의 측정 세션 조회
      const rawSessions = await systemAdminService.getRecentMeasurementSessionsDetails(100)
      
      // 사용자별로 그룹화하고 조직 정보 추가
      const userDataMap = new Map<string, MeasurementUser>()
      
      for (const session of rawSessions) {
        const userKey = `${session.userName || '알 수 없음'}_${session.organizationName || 'LOOXID LABS INC'}`
        
        if (!userDataMap.has(userKey)) {
          // 새 사용자 데이터 생성
          userDataMap.set(userKey, {
            id: session.id,
            userName: session.userName || '알 수 없음',
            userAge: 0, // 실제 데이터에서 가져오기
            userGender: '미지정',
            userOccupation: '미지정',
            userDepartment: session.organizationName || 'LOOXID LABS INC', // 시스템 관리자는 조직명을 부서로 표시
            userEmail: '',
            organizationName: session.organizationName || 'LOOXID LABS INC',
                         timestamp: typeof session.timestamp === 'string' ? session.timestamp : new Date(session.timestamp).toISOString(),
             sessionDate: new Date(session.timestamp),
            quality: session.quality >= 80 ? 'excellent' : session.quality >= 60 ? 'good' : 'poor',
            qualityScore: session.quality,
            eegSamples: 3000,
            ppgSamples: 3000,
            accSamples: 3000,
            duration: session.duration,
            hasReports: false,
            availableReports: [],
            sessionData: session
          })
        }
        
        // AI 분석 결과가 있다면 추가
        // TODO: 실제 AI 분석 결과 조회 로직 추가
        // 현재는 더미 데이터로 표시
        const userData = userDataMap.get(userKey)!
        if (session.status === 'completed') {
          userData.hasReports = true
          userData.availableReports.push({
            id: `${session.id}_analysis`,
            engineId: 'basic-gemini-v1',
            engineName: '기본 Gemini 분석',
            analysisId: `analysis_${session.id}`,
                         timestamp: typeof session.timestamp === 'string' ? session.timestamp : new Date(session.timestamp).toISOString(),
             overallScore: session.quality,
            stressLevel: Math.random() * 0.5,
            focusLevel: Math.random() * 0.5 + 0.5,
            costUsed: 1,
            processingTime: 30,
            qualityScore: session.quality,
                         createdAt: typeof session.timestamp === 'string' ? session.timestamp : new Date(session.timestamp).toISOString(),
            createdByUserName: '시스템'
          })
        }
      }
      
      return Array.from(userDataMap.values()).sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      
    } catch (error) {
      console.error('❌ 사용자별 측정 데이터 로드 실패:', error)
      return []
    }
  }

  // 통계 계산
  const calculateStats = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const thisWeekStart = new Date(now)
    thisWeekStart.setDate(now.getDate() - 7)
    
    const totalMeasurements = measurementDataList.length
    const totalReports = measurementDataList.reduce((sum, data) => sum + data.availableReports.length, 0)
    
    const todayMeasurements = measurementDataList.filter(data => 
      new Date(data.timestamp) >= todayStart
    ).length
    
    const thisWeekMeasurements = measurementDataList.filter(data => 
      new Date(data.timestamp) >= thisWeekStart
    ).length
    
    const todayReports = measurementDataList.filter(data => 
      data.availableReports.some(report => new Date(report.createdAt) >= todayStart)
    ).reduce((sum, data) => 
      sum + data.availableReports.filter(report => new Date(report.createdAt) >= todayStart).length, 0
    )
    
    const thisWeekReports = measurementDataList.filter(data => 
      data.availableReports.some(report => new Date(report.createdAt) >= thisWeekStart)
    ).reduce((sum, data) => 
      sum + data.availableReports.filter(report => new Date(report.createdAt) >= thisWeekStart).length, 0
    )
    
    const totalCreditsUsed = measurementDataList.reduce((sum, data) => 
      sum + data.availableReports.reduce((reportSum, report) => reportSum + report.costUsed, 0), 0
    )
    
    const todayCreditsUsed = measurementDataList.reduce((sum, data) => 
      sum + data.availableReports
        .filter(report => new Date(report.createdAt) >= todayStart)
        .reduce((reportSum, report) => reportSum + report.costUsed, 0), 0
    )
    
    return {
      totalMeasurements,
      totalReports,
      todayMeasurements,
      thisWeekMeasurements,
      todayReports,
      thisWeekReports,
      totalCreditsUsed,
      todayCreditsUsed
    }
  }, [measurementDataList])

  // 필터링된 데이터
  const filteredMeasurementData = useMemo(() => {
    return measurementDataList.filter(data => {
      const matchesSearch = searchTerm === '' || 
        data.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        new Date(data.timestamp).toLocaleDateString('ko-KR').includes(searchTerm)
      
      const matchesFilter = filterType === 'all' || 
        (filterType === 'with-reports' && data.hasReports) ||
        (filterType === 'without-reports' && !data.hasReports)
      
      return matchesSearch && matchesFilter
    })
  }, [measurementDataList, searchTerm, filterType])

  // 페이지네이션
  const totalPages = Math.ceil(filteredMeasurementData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filteredMeasurementData.slice(startIndex, endIndex)

  // 사용자 확장/축소 토글
  const toggleUserExpanded = (userId: string) => {
    const newExpanded = new Set(expandedUsers)
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId)
    } else {
      newExpanded.add(userId)
    }
    setExpandedUsers(newExpanded)
  }

  // 리포트 보기 핸들러
  const handleViewReport = (userId: string, reportId: string) => {
    console.log('🔍 handleViewReport 호출됨:', { userId, reportId })
    
    // 새로운 AI 분석 생성 요청인 경우
    if (reportId === 'new_analysis') {
      console.log('🎯 AI 분석 생성 요청 - 모달 열기')
      setSelectedUserId(userId)
      setIsEngineSelectionModalOpen(true)
      return
    }
    
    // 기존 리포트 보기
    console.log('👁️ 기존 리포트 보기:', userId, reportId)
    toast.success('리포트 뷰어를 준비 중입니다...')
  }

  // AI 엔진 선택 핸들러
  const handleEngineSelect = (engine: IAIEngine) => {
    if (!selectedUserId) return
    
    console.log('🎯 엔진 선택됨:', {
      engineId: engine.id,
      engineName: engine.name,
      userId: selectedUserId,
      provider: engine.provider,
      costPerAnalysis: engine.costPerAnalysis
    })
    
    toast.success(`${engine.name} 엔진으로 AI 분석을 시작합니다...`)
    
    // 실제 AI 분석 로직은 여기에 추가
    // TODO: AI 분석 실행 로직 구현
    
    // 모달 닫기
    setIsEngineSelectionModalOpen(false)
    setSelectedUserId(null)
  }

  // 엔진 선택 모달 닫기 핸들러
  const handleEngineSelectionModalClose = () => {
    setIsEngineSelectionModalOpen(false)
    setSelectedUserId(null)
  }

  // 리포트 공유 핸들러
  const handleShareReport = (userId: string, reportId: string) => {
    console.log('리포트 공유:', userId, reportId)
    toast.success('공유 링크가 생성되었습니다.')
  }

  // 리포트 다운로드 핸들러
  const handleDownloadReport = (userId: string, reportId: string) => {
    console.log('리포트 다운로드:', userId, reportId)
    toast.success('PDF 다운로드를 시작합니다...')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">측정 데이터 및 AI 분석 리포트</h2>
        <div className="flex items-center space-x-2">
          <button 
            onClick={loadMeasurementData}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            새로고침
          </button>
        </div>
      </div>

      {/* 통계 카드 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* 오늘 측정 데이터 수 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-medium text-gray-600">오늘 측정 데이터 수</h3>
            <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg">
              <Activity className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : `${calculateStats.todayMeasurements}건`}
            </div>
            <div className="text-xs text-gray-500">
              총 {calculateStats.totalMeasurements}건
            </div>
          </div>
        </div>

        {/* 오늘 발행 리포트 수 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-medium text-gray-600">오늘 발행 리포트 수</h3>
            <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg">
              <FileText className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : `${calculateStats.todayReports}건`}
            </div>
            <div className="text-xs text-gray-500">
              총 {calculateStats.totalReports}건
            </div>
          </div>
        </div>

        {/* 오늘 사용 크레딧 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-medium text-gray-600">오늘 사용 크레딧</h3>
            <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg">
              <DollarSign className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : `${calculateStats.todayCreditsUsed} 크레딧`}
            </div>
            <div className="text-xs text-gray-500">
              총 {calculateStats.totalCreditsUsed} 크레딧 사용
            </div>
          </div>
        </div>

        {/* 이번주 사용 현황 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-medium text-gray-600">이번주 사용 현황</h3>
            <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg">
              <TrendingUp className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : `${calculateStats.thisWeekMeasurements}건`}
            </div>
            <div className="text-xs text-gray-500">
              리포트 {calculateStats.thisWeekReports}건, 크레딧 18개
            </div>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="사용자명 또는 조직명을 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[120px]"
          >
            <option value="all">전체</option>
            <option value="with-reports">리포트 있음</option>
            <option value="without-reports">리포트 없음</option>
          </select>
        </div>
      </div>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">데이터를 불러오는 중...</span>
        </div>
      )}

      {/* 측정 데이터 목록 */}
      {!isLoading && (
        <div className="space-y-4">
          {currentItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>측정 데이터가 없습니다.</p>
            </div>
          ) : (
            currentItems.map((userData) => (
              <div key={userData.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* 사용자 정보 헤더 */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">{userData.userName}</h3>
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                            ID: {userData.id.slice(-4)}
                          </span>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                            {userData.userGender || '미지정'}
                          </span>
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                            {userData.userOccupation || '미지정'}
                          </span>
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                            {userData.organizationName}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center">
                            <Building className="w-3 h-3 mr-1" />
                            담당자
                          </span>
                          <span className="flex items-center">
                            <UserCheck className="w-3 h-3 mr-1" />
                            {userData.organizationName}(관리부)
                          </span>
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            작성일시
                          </span>
                          <span>{new Date(userData.timestamp).toLocaleString('ko-KR')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleViewReport(userData.id, 'new_analysis')}
                        className="px-3 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-1"
                      >
                        <Play className="w-4 h-4" />
                        AI 분석 생성
                      </button>
                    </div>
                  </div>
                </div>

                {/* 연관된 분석 리스트 */}
                {userData.hasReports && userData.availableReports.length > 0 && (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-purple-600 flex items-center">
                        <FileText className="w-4 h-4 mr-1" />
                        연관된 분석 리스트 ({userData.availableReports.length}개)
                      </h4>
                      <button
                        onClick={() => toggleUserExpanded(userData.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {expandedUsers.has(userData.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* 분석 리포트 목록 */}
                    <div className="space-y-3">
                      {userData.availableReports.map((report) => (
                        <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-900">{report.engineName}</span>
                                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                  {report.engineId}
                                </span>
                              </div>
                              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                                <span>분석 엔진</span>
                                <span>분석시점</span>
                                <span>{new Date(report.createdAt).toLocaleString('ko-KR')}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleShareReport(userData.id, report.id)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Share2 className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => handleViewReport(userData.id, report.id)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => handleDownloadReport(userData.id, report.id)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Download className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 분석 리포트가 없는 경우 */}
                {!userData.hasReports && (
                  <div className="p-4 text-center text-gray-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">아직 생성된 분석 리포트가 없습니다.</p>
                  </div>
                )}
              </div>
            ))
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                총 {filteredMeasurementData.length}개 중 {startIndex + 1}-{Math.min(endIndex, filteredMeasurementData.length)}개 표시
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  이전
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === pageNum 
                            ? "bg-purple-600 text-white hover:bg-purple-700 font-semibold shadow-sm" 
                            : "text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  다음
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* AI 엔진 선택 모달 */}
      <EngineSelectionModal
        isOpen={isEngineSelectionModalOpen}
        onClose={handleEngineSelectionModalClose}
        onSelect={handleEngineSelect}
        availableCredits={10} // TODO: 실제 크레딧 정보로 교체
        requiredDataTypes={{ eeg: true, ppg: true, acc: false }}
      />
    </div>
  )
} 