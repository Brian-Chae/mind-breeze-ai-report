/**
 * 크레딧 관리 Hero 섹션
 * 
 * 크레딧 현황, 사용량, 빠른 액션을 표시하는 상단 섹션
 * AI 리포트 페이지의 AIReportHero와 동일한 디자인 패턴 적용
 */

import React, { useState, useEffect } from 'react'
import { 
  CreditCard,
  TrendingUp,
  TrendingDown,
  Plus,
  Download,
  RefreshCw,
  Clock,
  AlertCircle,
  ShoppingCart,
  Receipt,
  Zap,
  Calendar,
  PieChart,
  BarChart3,
  Settings,
  DollarSign,
  Coins,
  Wallet
} from 'lucide-react'
import { Button } from '@ui/button'
import { toast } from 'sonner'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@ui/dropdown-menu'
import enterpriseAuthService from '../../../../services/EnterpriseAuthService'

interface CreditManagementHeroProps {
  onPurchase?: () => void
  onExport?: () => void
  onRefresh?: () => void
}

interface CreditStats {
  totalCredits: number
  usedCredits: number
  remainingCredits: number
  monthlyUsage: number
  purchasedThisMonth: number
  lastPurchaseDate: string
  averageMonthlyUsage: number
  estimatedDaysLeft: number
  activeSubscriptions: number
  pendingPayments: number
  totalSpent: number
  creditPrice: number
}

export default function CreditManagementHero({ onPurchase, onExport, onRefresh }: CreditManagementHeroProps) {
  const [stats, setStats] = useState<CreditStats | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Get current organization context
  const currentContext = enterpriseAuthService.getCurrentContext()
  const organizationName = currentContext.organizationName || '조직'
  const organizationId = currentContext.user?.organizationId

  useEffect(() => {
    loadStats()
  }, [organizationId])

  const loadStats = async () => {
    if (!organizationId) return
    
    try {
      setLoading(true)
      // TODO: Replace with actual service call when integrated
      // const creditService = new CreditManagementService()
      // const statistics = await creditService.getCreditStatistics()
      
      // Mock data for now
      setStats({
        totalCredits: 50000,
        usedCredits: 12350,
        remainingCredits: 37650,
        monthlyUsage: 8500,
        purchasedThisMonth: 20000,
        lastPurchaseDate: '2024-01-15',
        averageMonthlyUsage: 10000,
        estimatedDaysLeft: 112,
        activeSubscriptions: 2,
        pendingPayments: 0,
        totalSpent: 580000,
        creditPrice: 100 // 100원 per credit
      })
    } catch (error) {
      console.error('Failed to load credit stats:', error)
      // Set default values on error
      setStats({
        totalCredits: 0,
        usedCredits: 0,
        remainingCredits: 0,
        monthlyUsage: 0,
        purchasedThisMonth: 0,
        lastPurchaseDate: '',
        averageMonthlyUsage: 0,
        estimatedDaysLeft: 0,
        activeSubscriptions: 0,
        pendingPayments: 0,
        totalSpent: 0,
        creditPrice: 100
      })
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAction = (action: string) => {
    toast.info(`${action} 기능은 곧 추가될 예정입니다.`)
  }

  const handleRefresh = async () => {
    await loadStats()
    if (onRefresh) {
      onRefresh()
    }
  }

  // Calculate rates
  const usageRate = stats ? Math.round((stats.usedCredits / stats.totalCredits) * 100) || 0 : 0
  const remainingRate = stats ? Math.round((stats.remainingCredits / stats.totalCredits) * 100) || 0 : 0
  
  // Mock growth data
  const usageGrowthRate = -12.3 // Negative means less usage (good)
  const purchaseGrowthRate = 15.7

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  return (
    <div className="space-y-8">
      {/* 크레딧 관리 정보 헤더 */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {/* 상단 그라데이션 배경 */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <CreditCard className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  크레딧 관리
                </h1>
                <p className="text-blue-100 text-lg mb-2">
                  {organizationName}의 AI 분석 크레딧을 효율적으로 관리하세요
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
                    크레딧 구매
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleQuickAction('일반 구매')}>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    일반 구매
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleQuickAction('대량 구매')}>
                    <Coins className="w-4 h-4 mr-2" />
                    대량 구매 (할인)
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
                  <p className="text-sm font-medium text-slate-600">보유 크레딧</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {loading ? '-' : formatNumber(stats?.remainingCredits || 0)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Wallet className="w-3 h-3 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-600">{remainingRate}%</span>
                    <span className="text-xs text-slate-500">남은 크레딧</span>
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
                  <p className="text-sm font-medium text-slate-600">이번 달 사용</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {loading ? '-' : formatNumber(stats?.monthlyUsage || 0)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingDown className="w-3 h-3 text-emerald-600" />
                    <span className="text-xs text-emerald-600 font-medium">{Math.abs(usageGrowthRate)}% 절약</span>
                    <span className="text-xs text-slate-500">지난 달 대비</span>
                  </div>
                </div>
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">예상 잔여 기간</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {loading ? '-' : stats?.estimatedDaysLeft || 0}일
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-blue-600">약 {Math.floor((stats?.estimatedDaysLeft || 0) / 30)}개월</span>
                    <span className="text-xs text-slate-500">예상 기간</span>
                  </div>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">총 구매 금액</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {loading ? '-' : formatCurrency(stats?.totalSpent || 0)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Receipt className="w-3 h-3 text-purple-600" />
                    <span className="text-xs font-medium text-purple-600">누적 금액</span>
                    <span className="text-xs text-slate-500">전체 기간</span>
                  </div>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 빠른 액션 및 크레딧 사용 현황 섹션 */}
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
              onClick={() => handleQuickAction('크레딧 구매')}
            >
              <div className="flex-1 text-left">
                <span className="font-semibold block">크레딧 구매</span>
                <p className="text-xs text-blue-100 mt-0.5">AI 분석 크레딧 충전</p>
              </div>
              <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors ml-3">
                <ShoppingCart className="w-5 h-5" />
              </div>
            </button>
            
            <button 
              className="bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-xl p-4 h-24 flex items-center justify-between transition-all duration-200 group"
              onClick={() => handleQuickAction('사용 내역')}
            >
              <div className="flex-1 text-left">
                <span className="font-semibold block">사용 내역</span>
                <p className="text-xs text-slate-500 mt-0.5">크레딧 사용 상세 내역</p>
              </div>
              <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors ml-3">
                <Receipt className="w-5 h-5 text-slate-600" />
              </div>
            </button>
            
            <button 
              className="bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-xl p-4 h-24 flex items-center justify-between transition-all duration-200 group"
              onClick={() => handleQuickAction('자동 결제')}
            >
              <div className="flex-1 text-left">
                <span className="font-semibold block">자동 결제</span>
                <p className="text-xs text-slate-500 mt-0.5">정기 결제 설정</p>
              </div>
              <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors ml-3">
                <Settings className="w-5 h-5 text-slate-600" />
              </div>
            </button>
            
            <button 
              className="bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-xl p-4 h-24 flex items-center justify-between transition-all duration-200 group"
              onClick={() => handleQuickAction('영수증 다운로드')}
            >
              <div className="flex-1 text-left">
                <span className="font-semibold block">영수증 다운로드</span>
                <p className="text-xs text-slate-500 mt-0.5">세금계산서 발행</p>
              </div>
              <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors ml-3">
                <Download className="w-5 h-5 text-slate-600" />
              </div>
            </button>
          </div>
        </div>

        {/* 크레딧 사용 현황 (우측) */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">크레딧 사용 현황</h2>
              <p className="text-slate-600 mt-1">실시간 크레딧 사용 정보를 확인하세요</p>
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
                <div className="p-2 bg-green-100 rounded-lg">
                  <Zap className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">일일 평균 사용량</p>
                  <p className="text-xs text-slate-500">최근 30일 기준</p>
                </div>
              </div>
              <p className="text-xl font-bold text-slate-900">
                {loading ? '-' : formatNumber(Math.round((stats?.averageMonthlyUsage || 0) / 30))}
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">이번 달 구매</p>
                  <p className="text-xs text-slate-500">충전된 크레딧</p>
                </div>
              </div>
              <p className="text-xl font-bold text-slate-900">
                {loading ? '-' : formatNumber(stats?.purchasedThisMonth || 0)}
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">크레딧 단가</p>
                  <p className="text-xs text-slate-500">1 크레딧당 가격</p>
                </div>
              </div>
              <p className="text-xl font-bold text-slate-900">
                {loading ? '-' : formatCurrency(stats?.creditPrice || 100)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}