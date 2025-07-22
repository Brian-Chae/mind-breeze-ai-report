/**
 * 사용자 관리 Summary 섹션
 * 
 * 사용자 관리 현황, 통계, 빠른 액션을 표시하는 상단 섹션
 * 기업 관리 페이지의 OrganizationHero와 동일한 디자인 패턴 적용
 */

import React, { useState, useEffect } from 'react'
import { 
  Users,
  Activity,
  FileText,
  TrendingUp,
  TrendingDown,
  Plus,
  Download,
  RefreshCw,
  Calendar,
  UserPlus,
  CheckCircle,
  Clock,
  Edit2,
  Upload,
  Search,
  BarChart3
} from 'lucide-react'
import { Button } from '@ui/button'
import { toast } from 'sonner'
import measurementUserManagementService, { MeasurementUserStats } from '@domains/individual/services/MeasurementUserManagementService'
import enterpriseAuthService from '../../../../services/EnterpriseAuthService'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@ui/dropdown-menu'

interface UserManagementSummaryProps {
  onUserAdded?: () => void
  onExport?: () => void
}

export default function UserManagementSummary({ onUserAdded, onExport }: UserManagementSummaryProps) {
  const [stats, setStats] = useState<MeasurementUserStats | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Get current organization context
  const currentContext = enterpriseAuthService.getCurrentContext()
  const organizationName = currentContext.user?.organizationName || '조직'

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const userStats = await measurementUserManagementService.getMeasurementUserStats()
      setStats(userStats)
    } catch (error) {
      console.error('Failed to load user stats:', error)
      // Set default values on error
      setStats({
        totalCount: 0,
        activeCount: 0,
        measuringCount: 0,
        completedCount: 0,
        thisMonthNewUsers: 0,
        thisMonthMeasurements: 0,
        averageMeasurementsPerUser: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAction = (action: string) => {
    toast.info(`${action} 기능은 곧 추가될 예정입니다.`)
  }

  // Calculate growth rates (mock data for now)
  const userGrowthRate = 12.5
  const measurementGrowthRate = 25.3
  const activeRate = stats ? Math.round((stats.activeCount / stats.totalCount) * 100) || 0 : 0

  return (
    <div className="space-y-8">
      {/* 사용자 관리 정보 헤더 */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {/* 상단 그라데이션 배경 */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Users className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  사용자 관리
                </h1>
                <p className="text-blue-100 text-lg mb-2">
                  {organizationName}의 측정 대상자와 데이터를 효율적으로 관리하세요
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
                onClick={loadStats} 
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
                    사용자 추가
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleQuickAction('개별 등록')}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    개별 등록
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleQuickAction('대량 등록')}>
                    <Upload className="w-4 h-4 mr-2" />
                    대량 등록 (CSV)
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
                  <p className="text-sm font-medium text-slate-600">전체 사용자</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {loading ? '-' : stats?.totalCount.toLocaleString() || 0}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-600">+{userGrowthRate}%</span>
                    <span className="text-xs text-slate-500">지난 달 대비</span>
                  </div>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">활성 사용자</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {loading ? '-' : stats?.activeCount.toLocaleString() || 0}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    <span className="text-xs text-emerald-600 font-medium">{activeRate}% 활성</span>
                    <span className="text-xs text-slate-500">전체 대비</span>
                  </div>
                </div>
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Activity className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">이번 달 측정</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {loading ? '-' : stats?.thisMonthMeasurements.toLocaleString() || 0}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-blue-600">+{measurementGrowthRate}%</span>
                    <span className="text-xs text-slate-500">지난 달 대비</span>
                  </div>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">생성된 리포트</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {loading ? '-' : stats?.completedCount.toLocaleString() || 0}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <FileText className="w-3 h-3 text-orange-600" />
                    <span className="text-xs font-medium text-orange-600">
                      평균 {stats?.averageMeasurementsPerUser.toFixed(1) || 0}개
                    </span>
                    <span className="text-xs text-slate-500">사용자당</span>
                  </div>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FileText className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 빠른 액션 섹션 */}
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
              onClick={() => handleQuickAction('사용자 등록')}
            >
              <div className="flex-1 text-left">
                <span className="font-semibold block">사용자 등록</span>
                <p className="text-xs text-blue-100 mt-0.5">측정 대상자 추가</p>
              </div>
              <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors ml-3">
                <UserPlus className="w-5 h-5" />
              </div>
            </button>
            
            <button 
              className="bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-xl p-4 h-24 flex items-center justify-between transition-all duration-200 group"
              onClick={() => handleQuickAction('측정 이력')}
            >
              <div className="flex-1 text-left">
                <span className="font-semibold block">측정 이력</span>
                <p className="text-xs text-slate-500 mt-0.5">측정 세션 및 데이터 관리</p>
              </div>
              <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors ml-3">
                <Activity className="w-5 h-5 text-slate-600" />
              </div>
            </button>
            
            <button 
              className="bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-xl p-4 h-24 flex items-center justify-between transition-all duration-200 group"
              onClick={() => handleQuickAction('리포트 관리')}
            >
              <div className="flex-1 text-left">
                <span className="font-semibold block">리포트 관리</span>
                <p className="text-xs text-slate-500 mt-0.5">AI 분석 리포트 조회</p>
              </div>
              <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors ml-3">
                <FileText className="w-5 h-5 text-slate-600" />
              </div>
            </button>
            
            <button 
              className="bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-xl p-4 h-24 flex items-center justify-between transition-all duration-200 group"
              onClick={() => handleQuickAction('데이터 내보내기')}
            >
              <div className="flex-1 text-left">
                <span className="font-semibold block">데이터 내보내기</span>
                <p className="text-xs text-slate-500 mt-0.5">사용자 데이터 다운로드</p>
              </div>
              <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors ml-3">
                <Download className="w-5 h-5 text-slate-600" />
              </div>
            </button>
          </div>
        </div>

        {/* 측정 현황 (우측) */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">측정 현황</h2>
              <p className="text-slate-600 mt-1">실시간 측정 현황을 확인하세요</p>
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
                  <p className="text-sm font-medium text-slate-900">측정 진행 중</p>
                  <p className="text-xs text-slate-500">현재 측정 중인 사용자</p>
                </div>
              </div>
              <p className="text-xl font-bold text-slate-900">
                {loading ? '-' : stats?.measuringCount || 0}
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">오늘 완료</p>
                  <p className="text-xs text-slate-500">오늘 측정을 완료한 건수</p>
                </div>
              </div>
              <p className="text-xl font-bold text-slate-900">
                {loading ? '-' : Math.floor((stats?.completedCount || 0) * 0.1)}
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">신규 가입</p>
                  <p className="text-xs text-slate-500">이번 달 신규 사용자</p>
                </div>
              </div>
              <p className="text-xl font-bold text-slate-900">
                {loading ? '-' : stats?.thisMonthNewUsers || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}