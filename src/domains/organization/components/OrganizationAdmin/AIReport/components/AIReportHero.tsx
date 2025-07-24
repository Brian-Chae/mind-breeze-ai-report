/**
 * AI 리포트 관리 Hero 섹션
 * 
 * AI 리포트 현황, 통계, 빠른 액션을 표시하는 상단 섹션
 * 디바이스 관리 페이지의 DeviceManagementHero와 동일한 디자인 패턴 적용
 */

import React, { useState, useEffect, useMemo } from 'react'
import { 
  Brain,
  Activity,
  FileText,
  TrendingUp,
  TrendingDown,
  Plus,
  Download,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Sparkles,
  Users,
  Zap,
  Target,
  LineChart,
  PieChart,
  CreditCard
} from 'lucide-react'
import { Button } from '@ui/button'
import { toast } from 'sonner'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@ui/dropdown-menu'
import enterpriseAuthService from '../../../../services/EnterpriseAuthService'
import { FirebaseService } from '@core/services/FirebaseService'

interface AIReportHeroProps {
  onReportGenerated?: () => void
  onExport?: () => void
  onRefresh?: () => void
}

interface AIReportStats {
  todayMeasurements: number
  todayReports: number
  todayCreditsUsed: number
  thisWeekMeasurements: number
  thisWeekReports: number
  thisWeekCreditsUsed: number
  totalMeasurements: number
  totalReports: number
  totalCreditsUsed: number
}

export default function AIReportHero({ onReportGenerated, onExport, onRefresh }: AIReportHeroProps) {
  const [measurementDataList, setMeasurementDataList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Get current organization context
  const currentContext = enterpriseAuthService.getCurrentContext()
  const organizationName = currentContext.organizationName || '조직'
  const organizationId = currentContext.user?.organizationId

  useEffect(() => {
    loadMeasurementData()
  }, [organizationId])

  // 측정 데이터 로드 (AIReportSection과 동일한 로직)
  const loadMeasurementData = async () => {
    setLoading(true)
    try {
      const currentContext = enterpriseAuthService.getCurrentContext()
      
      let measurementSessions = []
      
      try {
        if (currentContext.organization) {
          // 1. 조직 측정 세션 조회
          const orgFilters = [
            FirebaseService.createWhereFilter('organizationId', '==', currentContext.organization.id)
          ]
          const orgSessions = await FirebaseService.getMeasurementSessions(orgFilters)
          measurementSessions.push(...orgSessions)
        }
        
        // 2. 모든 측정 세션을 조회한 후 organizationId가 없는 것들 필터링
        const allSessions = await FirebaseService.getMeasurementSessions([])
        const personalSessions = allSessions.filter((session: any) => !session.organizationId)
        measurementSessions.push(...personalSessions)
        
      } catch (queryError) {
        measurementSessions = await FirebaseService.getMeasurementSessions([])
      }
      
      // 클라이언트에서 sessionDate로 정렬 (최신순)
      measurementSessions.sort((a, b) => {
        const dateA = a.sessionDate || a.createdAt
        const dateB = b.sessionDate || b.createdAt
        return dateB.getTime() - dateA.getTime()
      })
      
      // 각 세션의 AI 분석 결과 조회 및 데이터 변환
      const measurementDataWithReports = await Promise.all(
        measurementSessions.map(async (session: any) => {
          try {
            const analysisFilters = [
              FirebaseService.createWhereFilter('measurementDataId', '==', session.id)
            ]
            const analysisResults = await FirebaseService.getDocuments('ai_analysis_results', analysisFilters)
            
            return {
              id: session.id,
              timestamp: session.sessionDate || session.createdAt,
              sessionData: session,
              availableReports: analysisResults.map((result: any) => ({
                ...result,
                createdAt: result.analysisDate || result.createdAt,
                costUsed: result.costUsed || 0,
                engineId: result.engineId || 'unknown'
              }))
            }
          } catch (error) {
            return {
              id: session.id,
              timestamp: session.sessionDate || session.createdAt,
              sessionData: session,
              availableReports: []
            }
          }
        })
      )
      
      
      setMeasurementDataList(measurementDataWithReports)
    } catch (error) {
      setMeasurementDataList([])
    } finally {
      setLoading(false)
    }
  }

  // 통계 계산 (AIReportSection과 동일한 로직)
  const stats = useMemo<AIReportStats>(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // 이번주 시작일 (월요일) 계산
    const thisWeekStart = new Date(today)
    const dayOfWeek = today.getDay()
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    thisWeekStart.setDate(today.getDate() - daysToSubtract)
    thisWeekStart.setHours(0, 0, 0, 0)

    // 총 측정 데이터 수
    const totalMeasurements = measurementDataList.length

    // 총 발행된 리포트 수
    const totalReports = measurementDataList.reduce((sum, data) => {
      return sum + (data.availableReports?.length || 0)
    }, 0)

    // 오늘 측정한 데이터 수
    const todayMeasurements = measurementDataList.filter(data => {
      const measurementDate = new Date(data.timestamp)
      return measurementDate >= today && measurementDate < tomorrow
    }).length

    // 이번주 측정한 데이터 수
    const thisWeekMeasurements = measurementDataList.filter(data => {
      const measurementDate = new Date(data.timestamp)
      return measurementDate >= thisWeekStart && measurementDate < tomorrow
    }).length

    // 오늘 발행된 리포트 수
    const todayReports = measurementDataList.reduce((sum, data) => {
      const todayReportsForData = (data.availableReports || []).filter((report: any) => {
        // Firebase Timestamp를 올바르게 변환
        let reportDate
        if (report.createdAt && typeof report.createdAt.toDate === 'function') {
          reportDate = report.createdAt.toDate()
        } else if (report.createdAt) {
          reportDate = new Date(report.createdAt)
        } else {
          return false
        }
        
        return reportDate >= today && reportDate < tomorrow
      }).length
      return sum + todayReportsForData
    }, 0)

    // 이번주 발행된 리포트 수
    const thisWeekReports = measurementDataList.reduce((sum, data) => {
      const thisWeekReportsForData = (data.availableReports || []).filter((report: any) => {
        // Firebase Timestamp를 올바르게 변환
        let reportDate
        if (report.createdAt && typeof report.createdAt.toDate === 'function') {
          reportDate = report.createdAt.toDate()
        } else if (report.createdAt) {
          reportDate = new Date(report.createdAt)
        } else {
          return false
        }
        return reportDate >= thisWeekStart && reportDate < tomorrow
      }).length
      return sum + thisWeekReportsForData
    }, 0)

    // 총 크레딧 사용량
    const totalCreditsUsed = measurementDataList.reduce((sum, data) => {
      const dataCredits = (data.availableReports || []).reduce((reportSum: number, report: any) => {
        return reportSum + (report.costUsed || 0)
      }, 0)
      return sum + dataCredits
    }, 0)

    // 오늘 사용한 크레딧
    const todayCreditsUsed = measurementDataList.reduce((sum, data) => {
      const todayCreditsForData = (data.availableReports || [])
        .filter((report: any) => {
          // Firebase Timestamp를 올바르게 변환
          let reportDate
          if (report.createdAt && typeof report.createdAt.toDate === 'function') {
            reportDate = report.createdAt.toDate()
          } else if (report.createdAt) {
            reportDate = new Date(report.createdAt)
          } else {
            return false
          }
          return reportDate >= today && reportDate < tomorrow
        })
        .reduce((reportSum: number, report: any) => {
          return reportSum + (report.costUsed || 0)
        }, 0)
      return sum + todayCreditsForData
    }, 0)

    // 이번주 사용한 크레딧
    const thisWeekCreditsUsed = measurementDataList.reduce((sum, data) => {
      const thisWeekCreditsForData = (data.availableReports || [])
        .filter((report: any) => {
          // Firebase Timestamp를 올바르게 변환
          let reportDate
          if (report.createdAt && typeof report.createdAt.toDate === 'function') {
            reportDate = report.createdAt.toDate()
          } else if (report.createdAt) {
            reportDate = new Date(report.createdAt)
          } else {
            return false
          }
          return reportDate >= thisWeekStart && reportDate < tomorrow
        })
        .reduce((reportSum: number, report: any) => {
          return reportSum + (report.costUsed || 0)
        }, 0)
      return sum + thisWeekCreditsForData
    }, 0)

    const result = {
      totalMeasurements,
      totalReports,
      todayMeasurements,
      thisWeekMeasurements,
      todayReports,
      thisWeekReports,
      totalCreditsUsed,
      todayCreditsUsed,
      thisWeekCreditsUsed
    }
    
      calculatedStats: result,
      measurementDataListLength: measurementDataList.length,
      todayDateRange: { today, tomorrow },
      thisWeekStart,
      sampleTimestamps: measurementDataList.slice(0, 3).map(d => ({ 
        id: d.id, 
        timestamp: d.timestamp,
        isToday: d.timestamp >= today && d.timestamp < tomorrow,
        isThisWeek: d.timestamp >= thisWeekStart && d.timestamp < tomorrow
      }))
    
    return result
  }, [measurementDataList])

  const handleQuickAction = (action: string) => {
    toast.info(`${action} 기능은 곧 추가될 예정입니다.`)
  }

  const handleRefresh = async () => {
    await loadMeasurementData()
    if (onRefresh) {
      onRefresh()
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num)
  }

  return (
    <div className="space-y-8">
      {/* AI 리포트 관리 정보 헤더 */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {/* 상단 그라데이션 배경 */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  AI 리포트
                </h1>
                <p className="text-blue-100 text-lg mb-2">
                  {organizationName}의 AI 건강 분석 리포트를 생성하고 관리하세요
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-blue-100">
                    <Clock className="w-4 h-4" />
                    마지막 업데이트: {new Date().toLocaleString('ko-KR')}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleRefresh} 
                disabled={loading}
                className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                새로고침
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm" className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30">
                    <Plus className="w-4 h-4 mr-2" />
                    리포트 생성
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleQuickAction('개별 리포트 생성')}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    개별 리포트 생성
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleQuickAction('일괄 생성')}>
                    <Zap className="w-4 h-4 mr-2" />
                    일괄 생성
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* 하단 통계 섹션 */}
        <div className="px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">오늘 측정 데이터</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {loading ? '로딩중...' : `${formatNumber(stats.todayMeasurements)}건`}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Activity className="w-3 h-3 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-600">총 {formatNumber(stats.totalMeasurements)}건</span>
                    <span className="text-xs text-slate-500">전체 기간</span>
                  </div>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">오늘 발행 리포트</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {loading ? '로딩중...' : `${formatNumber(stats.todayReports)}건`}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <FileText className="w-3 h-3 text-emerald-600" />
                    <span className="text-xs text-emerald-600 font-medium">총 {formatNumber(stats.totalReports)}건</span>
                    <span className="text-xs text-slate-500">전체 기간</span>
                  </div>
                </div>
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <FileText className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">오늘 사용 크레딧</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {loading ? '로딩중...' : formatNumber(stats.todayCreditsUsed)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <CreditCard className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-blue-600">총 {formatNumber(stats.totalCreditsUsed)}</span>
                    <span className="text-xs text-slate-500">크레딧 사용</span>
                  </div>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">총 리포트 발행</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {loading ? '로딩중...' : `${formatNumber(stats.totalReports)}건`}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <FileText className="w-3 h-3 text-purple-600" />
                    <span className="text-xs font-medium text-purple-600">전체 기간</span>
                    <span className="text-xs text-slate-500">누적 발행량</span>
                  </div>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 빠른 액션 및 분석 현황 섹션 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* 빠른 액션 (좌측) */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">빠른 액션</h2>
              <p className="text-slate-600 mt-1">자주 사용하는 작업을 빠르게 실행하세요</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl p-4 h-24 flex items-center justify-between transition-all duration-200 group shadow-md hover:shadow-lg"
              onClick={() => handleQuickAction('AI 리포트 생성')}
            >
              <div className="flex-1 text-left">
                <span className="font-semibold block">AI 분석 시작</span>
                <p className="text-xs text-blue-100 mt-0.5">새로운 건강 리포트 생성</p>
              </div>
              <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors ml-3">
                <Sparkles className="w-5 h-5" />
              </div>
            </button>
            
            <button 
              className="bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-xl p-4 h-24 flex items-center justify-between transition-all duration-200 group"
              onClick={() => handleQuickAction('리포트 조회')}
            >
              <div className="flex-1 text-left">
                <span className="font-semibold block">리포트 조회</span>
                <p className="text-xs text-slate-500 mt-0.5">생성된 리포트 확인</p>
              </div>
              <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors ml-3">
                <FileText className="w-5 h-5 text-slate-600" />
              </div>
            </button>
            
            <button 
              className="bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-xl p-4 h-24 flex items-center justify-between transition-all duration-200 group"
              onClick={() => handleQuickAction('분석 대시보드')}
            >
              <div className="flex-1 text-left">
                <span className="font-semibold block">분석 대시보드</span>
                <p className="text-xs text-slate-500 mt-0.5">통계 및 트렌드 확인</p>
              </div>
              <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors ml-3">
                <LineChart className="w-5 h-5 text-slate-600" />
              </div>
            </button>
            
            <button 
              className="bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-xl p-4 h-24 flex items-center justify-between transition-all duration-200 group"
              onClick={() => handleQuickAction('데이터 내보내기')}
            >
              <div className="flex-1 text-left">
                <span className="font-semibold block">데이터 내보내기</span>
                <p className="text-xs text-slate-500 mt-0.5">분석 결과 다운로드</p>
              </div>
              <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors ml-3">
                <Download className="w-5 h-5 text-slate-600" />
              </div>
            </button>
          </div>
        </div>

        {/* 분석 현황 (우측) */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">분석 현황</h2>
              <p className="text-slate-600 mt-1">실시간 AI 분석 상태를 확인하세요</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-emerald-700">실시간 업데이트</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">오늘 측정</p>
                  <p className="text-xs text-slate-500">오늘 측정된 데이터</p>
                </div>
              </div>
              <p className="text-xl font-bold text-slate-900">
                {loading ? '로딩중...' : `${formatNumber(stats.todayMeasurements)}건`}
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">오늘 리포트</p>
                  <p className="text-xs text-slate-500">오늘 생성된 리포트</p>
                </div>
              </div>
              <p className="text-xl font-bold text-slate-900">
                {loading ? '로딩중...' : `${formatNumber(stats.todayReports)}건`}
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">오늘 크레딧</p>
                  <p className="text-xs text-slate-500">오늘 사용한 크레딧</p>
                </div>
              </div>
              <p className="text-xl font-bold text-slate-900">
                {loading ? '로딩중...' : `${formatNumber(stats.todayCreditsUsed)}개`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}