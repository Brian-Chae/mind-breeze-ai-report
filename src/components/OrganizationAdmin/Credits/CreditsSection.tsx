import React, { useState, useEffect } from 'react'
import { CreditCard, DollarSign, ShoppingCart, Plus, Calendar, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Settings, MoreHorizontal, Download, Eye, Search, Filter, Clock, Receipt, Star, Award, Package, Loader2, RefreshCw } from 'lucide-react'
import { Card } from '../../ui/card'
import { Button } from '../../ui/button'
import { Badge } from '../../ui/badge'
import { Input } from '../../ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown-menu'

// Firebase 서비스 import
import creditManagementService from '../../../services/CreditManagementService'
import { OrganizationService } from '../../../services/CompanyService'
import enterpriseAuthService from '../../../services/EnterpriseAuthService'
import { CreditTransaction } from '../../../types/business'

interface CreditsSectionProps {
  subSection: string;
  onNavigate: (section: string, subSection: string) => void;
}

interface CreditData {
  balance: number;
  monthlyUsage: number;
  dailyAverage: number;
  totalSpent: number;
  history: CreditTransaction[];
}

export default function CreditsSection({ subSection, onNavigate }: CreditsSectionProps) {
  const [activeTab, setActiveTab] = useState(subSection || 'credit-dashboard')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [creditData, setCreditData] = useState<CreditData>({
    balance: 0,
    monthlyUsage: 0,
    dailyAverage: 0,
    totalSpent: 0,
    history: []
  })

  // 데이터 로드
  useEffect(() => {
    loadCreditData()
  }, [])

  useEffect(() => {
    setActiveTab(subSection || 'credit-dashboard')
  }, [subSection])

  const loadCreditData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 현재 사용자 정보 가져오기
      const currentContext = enterpriseAuthService.getCurrentContext()
      if (!currentContext.user || !currentContext.user.organizationId) {
        setError('조직 정보를 찾을 수 없습니다.')
        return
      }

      const organizationId = currentContext.user.organizationId

      // 병렬로 데이터 로드
      const [balance, history] = await Promise.all([
        creditManagementService.getCreditBalance(organizationId),
        creditManagementService.getCreditHistory(organizationId, undefined, 50)
      ])

      // 이번달 사용량 계산
      const thisMonth = new Date()
      thisMonth.setDate(1)
      const monthlyUsage = history
        .filter(transaction => 
          (transaction.type === 'REPORT_USAGE' || transaction.type === 'CONSULTATION_USAGE') && 
          transaction.createdAt >= thisMonth
        )
        .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0)

      // 일일 평균 계산 (최근 30일)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const recentUsage = history
        .filter(transaction => 
          (transaction.type === 'REPORT_USAGE' || transaction.type === 'CONSULTATION_USAGE') && 
          transaction.createdAt >= thirtyDaysAgo
        )
        .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0)
      const dailyAverage = Math.round(recentUsage / 30)

      // 총 지출 계산
      const totalSpent = history
        .filter(transaction => transaction.type === 'PURCHASE')
        .reduce((sum, transaction) => sum + transaction.amount, 0)

      setCreditData({
        balance,
        monthlyUsage,
        dailyAverage,
        totalSpent,
        history
      })

    } catch (err) {
      console.error('크레딧 데이터 로드 오류:', err)
      setError('크레딧 데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    onNavigate('credits', tab)
  }

  // 로딩 중일 때
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              <div className="py-4 px-1 border-b-2 border-green-500 text-green-600">
                크레딧 현황
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-8">
            <div className="flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-green-600 mr-3" />
              <span className="text-gray-600">크레딧 데이터를 불러오는 중...</span>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // 오류 발생 시
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              <div className="py-4 px-1 border-b-2 border-green-500 text-green-600">
                크레딧 현황
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-8 text-center border-red-200 bg-red-50">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">오류 발생</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={loadCreditData} className="bg-red-600 hover:bg-red-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              다시 시도
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  const renderCreditDashboard = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-white to-green-50 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">크레딧 현황</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="hover:bg-green-50">
              <Download className="w-4 h-4 mr-2" />
              사용 내역
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              크레딧 구매
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">잔여 크레딧</p>
              <p className="text-2xl font-bold text-green-900">{creditData.balance.toLocaleString()}</p>
              <p className="text-sm text-green-700">₩ {(creditData.balance * 25).toLocaleString()} 상당</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-green-200 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">이번달 사용량</p>
              <p className="text-2xl font-bold text-blue-900">{creditData.monthlyUsage.toLocaleString()}</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">이번달</span>
              </div>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-blue-200 rounded-xl">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">평균 일일 사용량</p>
              <p className="text-2xl font-bold text-purple-900">{creditData.dailyAverage.toLocaleString()}</p>
              <div className="flex items-center mt-1">
                <TrendingDown className="w-4 h-4 text-gray-500 mr-1" />
                <span className="text-sm text-gray-600">최근 30일</span>
              </div>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-purple-200 rounded-xl">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-orange-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium">총 구매액</p>
              <p className="text-2xl font-bold text-orange-900">{creditData.totalSpent.toLocaleString()}</p>
              <div className="flex items-center mt-1">
                <Package className="w-4 h-4 text-orange-500 mr-1" />
                <span className="text-sm text-orange-600">누적</span>
              </div>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-orange-200 rounded-xl">
              <ShoppingCart className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2" />
            크레딧 패키지
          </h3>
          <div className="space-y-4">
            <div className="border border-green-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">베이직 패키지</h4>
                <Badge className="bg-green-100 text-green-600">현재 플랜</Badge>
              </div>
              <p className="text-sm text-gray-600">월 5,000 크레딧</p>
              <p className="text-sm font-medium text-green-700">₩ 125,000 / 월</p>
            </div>
            <div className="border border-blue-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">프로 패키지</h4>
                <Badge className="bg-blue-100 text-blue-600">추천</Badge>
              </div>
              <p className="text-sm text-gray-600">월 20,000 크레딧</p>
              <p className="text-sm font-medium text-blue-700">₩ 400,000 / 월</p>
            </div>
            <div className="border border-purple-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">엔터프라이즈</h4>
                <Badge className="bg-purple-100 text-purple-600">최고급</Badge>
              </div>
              <p className="text-sm text-gray-600">무제한 크레딧</p>
              <p className="text-sm font-medium text-purple-700">₩ 1,000,000 / 월</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            알림 설정
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">크레딧 부족 알림</p>
                <p className="text-xs text-gray-600">잔여 크레딧이 20% 이하일 때</p>
              </div>
              <input type="checkbox" className="w-4 h-4 text-green-600 border-gray-300 rounded" defaultChecked />
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">자동 충전</p>
                <p className="text-xs text-gray-600">잔여 크레딧이 10% 이하일 때</p>
              </div>
              <input type="checkbox" className="w-4 h-4 text-green-600 border-gray-300 rounded" />
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">사용량 리포트</p>
                <p className="text-xs text-gray-600">월간 사용량 리포트 이메일</p>
              </div>
              <input type="checkbox" className="w-4 h-4 text-green-600 border-gray-300 rounded" defaultChecked />
            </div>
          </div>
        </Card>
      </div>
      
      <Card className="p-6 bg-gradient-to-r from-white to-green-50 border-l-4 border-green-500">
        <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
          <Receipt className="w-5 h-5 mr-2" />
          최근 사용 내역
        </h3>
        <div className="space-y-3">
          {creditData.history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">사용 내역이 없습니다</p>
              <p className="text-sm mt-2">크레딧을 사용하면 여기에 표시됩니다</p>
            </div>
          ) : (
            creditData.history.map((transaction, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-green-200 rounded-lg bg-white hover:bg-green-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                    <Receipt className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-xs text-gray-600">{transaction.createdAt.toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()} 크레딧</p>
                  <p className="text-xs text-gray-600">{transaction.type === 'PURCHASE' ? '구매' : '사용'}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )

  const renderPurchaseHistory = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-white to-blue-50 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">구매 내역</h2>
          <Button variant="outline" size="sm" className="hover:bg-blue-50">
            <Download className="w-4 h-4 mr-2" />
            영수증 다운로드
          </Button>
        </div>
      </div>
      
      <Card className="bg-gradient-to-r from-white to-blue-50 p-6">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="구매 내역 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-blue-200 focus:border-blue-500"
            />
          </div>
          <select className="px-3 py-2 border border-blue-200 rounded-md bg-white focus:border-blue-500">
            <option>최근 30일</option>
            <option>최근 90일</option>
            <option>최근 1년</option>
            <option>전체</option>
          </select>
          <Button variant="outline" size="sm" className="hover:bg-blue-50">
            <Filter className="w-4 h-4 mr-2" />
            필터
          </Button>
        </div>
      </Card>
      
      <div className="grid grid-cols-1 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="p-6 bg-gradient-to-r from-white to-blue-50 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">베이직 패키지</h3>
                  <p className="text-sm text-gray-600">5,000 크레딧 구매</p>
                  <p className="text-sm text-gray-600">2024-01-{15-i} 결제</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">₩ 125,000</p>
                <Badge className="bg-green-100 text-green-600">결제 완료</Badge>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600">신용카드 **** 1234</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600">결제일: 2024-01-{15-i}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Receipt className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600">주문번호: MB{202401}{15-i}001</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderPaymentSettings = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-white to-purple-50 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">결제 설정</h2>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            결제 수단 추가
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            등록된 결제 수단
          </h3>
          <div className="space-y-4">
            <div className="border border-purple-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">신용카드</p>
                    <p className="text-xs text-gray-600">**** **** **** 1234</p>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-600">기본</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">만료일: 12/27</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="hover:bg-purple-50">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Settings className="w-4 h-4 mr-2" />
                      수정
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Star className="w-4 h-4 mr-2" />
                      기본 설정
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            <div className="border border-purple-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg">
                    <CreditCard className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">법인카드</p>
                    <p className="text-xs text-gray-600">**** **** **** 5678</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">만료일: 08/26</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="hover:bg-purple-50">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Settings className="w-4 h-4 mr-2" />
                      수정
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Star className="w-4 h-4 mr-2" />
                      기본 설정
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            자동 결제 설정
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">자동 결제 활성화</p>
                <p className="text-xs text-gray-600">크레딧 부족 시 자동 충전</p>
              </div>
              <input type="checkbox" className="w-4 h-4 text-purple-600 border-gray-300 rounded" />
            </div>
            
            <div className="bg-white p-3 rounded-lg">
              <label className="text-sm font-medium text-purple-700">자동 충전 임계값</label>
              <select className="mt-1 w-full p-2 border border-purple-200 rounded-md bg-white focus:border-purple-500">
                <option>잔여 크레딧 10% 이하</option>
                <option>잔여 크레딧 20% 이하</option>
                <option>잔여 크레딧 30% 이하</option>
              </select>
            </div>
            
            <div className="bg-white p-3 rounded-lg">
              <label className="text-sm font-medium text-purple-700">자동 충전 금액</label>
              <select className="mt-1 w-full p-2 border border-purple-200 rounded-md bg-white focus:border-purple-500">
                <option>베이직 패키지 (5,000 크레딧)</option>
                <option>프로 패키지 (20,000 크레딧)</option>
                <option>엔터프라이즈 (무제한)</option>
              </select>
            </div>
            
            <div className="bg-white p-3 rounded-lg">
              <label className="text-sm font-medium text-purple-700">결제 수단</label>
              <select className="mt-1 w-full p-2 border border-purple-200 rounded-md bg-white focus:border-purple-500">
                <option>신용카드 **** 1234</option>
                <option>법인카드 **** 5678</option>
              </select>
            </div>
            
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              <Settings className="w-4 h-4 mr-2" />
              설정 저장
            </Button>
          </div>
        </Card>
      </div>
      
      <Card className="p-6 bg-gradient-to-r from-white to-purple-50 border-l-4 border-purple-500">
        <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
          <Receipt className="w-5 h-5 mr-2" />
          세금계산서 설정
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-purple-700">사업자등록번호</label>
            <Input placeholder="000-00-00000" className="mt-1 border-purple-200 focus:border-purple-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-purple-700">상호명</label>
            <Input placeholder="회사명" className="mt-1 border-purple-200 focus:border-purple-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-purple-700">대표자명</label>
            <Input placeholder="대표자명" className="mt-1 border-purple-200 focus:border-purple-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-purple-700">업태/종목</label>
            <Input placeholder="업태/종목" className="mt-1 border-purple-200 focus:border-purple-500" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-purple-700">사업장 주소</label>
            <Input placeholder="사업장 주소" className="mt-1 border-purple-200 focus:border-purple-500" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-purple-700">담당자 이메일</label>
            <Input placeholder="세금계산서 수신용 이메일" className="mt-1 border-purple-200 focus:border-purple-500" />
          </div>
        </div>
        <Button className="mt-4 bg-purple-600 hover:bg-purple-700">
          <Settings className="w-4 h-4 mr-2" />
          설정 저장
        </Button>
      </Card>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'credit-dashboard':
        return renderCreditDashboard()
      case 'credit-history':
        return renderPurchaseHistory()
      case 'credit-settings':
        return renderPaymentSettings()
      default:
        return renderCreditDashboard()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 탭 네비게이션 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => handleTabChange('credit-dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'credit-dashboard'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              크레딧 현황
            </button>
            <button
              onClick={() => handleTabChange('credit-history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'credit-history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              구매 내역
            </button>
            <button
              onClick={() => handleTabChange('credit-settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'credit-settings'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              결제 설정
            </button>
          </div>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </div>
    </div>
  )
} 