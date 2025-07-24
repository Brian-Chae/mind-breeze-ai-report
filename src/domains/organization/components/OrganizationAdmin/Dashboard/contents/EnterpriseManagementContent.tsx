import React, { useState, useEffect } from 'react'
import { 
  Building2, 
  Users, 
  CreditCard, 
  FileText, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Mail,
  Phone,
  Award,
  Flag,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Settings,
  Send,
  Ban,
  Play,
  Plus,
  Minus,
  RefreshCw,
  Building,
  Sparkles,
  Shield,
  Star,
  ChevronRight
} from 'lucide-react'
import systemAdminService, { 
  EnterpriseOverview, 
  RecentEnterpriseRegistration, 
  ReportAnalytics, 
  EnterpriseManagementAction 
} from '../../../../services/SystemAdminService'
import CreateEnterpriseModal from '../modals/CreateEnterpriseModal'

interface EnterpriseManagementContentProps {}

export default function EnterpriseManagementContent({}: EnterpriseManagementContentProps) {
  const [enterpriseOverviews, setEnterpriseOverviews] = useState<EnterpriseOverview[]>([])
  const [recentRegistrations, setRecentRegistrations] = useState<RecentEnterpriseRegistration[]>([])
  const [selectedOrganization, setSelectedOrganization] = useState<string | null>(null)
  const [reportAnalytics, setReportAnalytics] = useState<ReportAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterRisk, setFilterRisk] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'overview' | 'registrations' | 'analytics' | 'performance' | 'comparison'>('overview')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [performanceDashboard, setPerformanceDashboard] = useState<any>(null)
  const [comparisonAnalytics, setComparisonAnalytics] = useState<any>(null)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  useEffect(() => {
    loadData()
    // 초기 비교 분석 데이터 로드
    loadComparisonData()
  }, [])

  const loadComparisonData = async () => {
    try {
      const comparison = await systemAdminService.getEnterpriseComparisonAnalytics()
      setComparisonAnalytics(comparison)
    } catch (error) {
      // 실패해도 빈 데이터로 설정
      setComparisonAnalytics({
        topPerformers: [],
        industryBenchmarks: [],
        monthlyGrowthRanking: []
      })
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(loadData, 30000) // 30초마다 새로고침
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const loadData = async () => {
    setIsLoading(true)
    try {
      
      const [overviewsResult, registrationsResult] = await Promise.allSettled([
        systemAdminService.getAllEnterpriseOverview(),
        systemAdminService.getRecentEnterpriseRegistrations(30)
      ])
      
      // 성공한 결과만 사용
      const overviews = overviewsResult.status === 'fulfilled' ? overviewsResult.value : []
      const registrations = registrationsResult.status === 'fulfilled' ? registrationsResult.value : []
      
      // 개별 실패 로그
      if (overviewsResult.status === 'rejected') {
      }
      if (registrationsResult.status === 'rejected') {
      }
      
        enterpriseCount: overviews.length,
        enterprises: overviews.map(e => ({
          id: e.organizationId,
          name: e.organizationName,
          companyCode: e.companyCode
        }))
      
      // LOOXID LABS INC. 검색
      const looxidLabs = overviews.find(e => 
        e.organizationName.toLowerCase().includes('looxid') || 
        e.organizationName.toLowerCase().includes('labs')
      )
      
      if (looxidLabs) {
      } else {
          allEnterpriseNames: overviews.map(e => e.organizationName)
      }
      
      setEnterpriseOverviews(overviews)
      setRecentRegistrations(registrations)
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }

  const loadReportAnalytics = async (organizationId: string) => {
    try {
      const analytics = await systemAdminService.getOrganizationReportAnalytics(organizationId)
      setReportAnalytics(analytics)
      setActiveTab('analytics')
    } catch (error) {
    }
  }

  const loadPerformanceDashboard = async (organizationId: string) => {
    try {
      setDashboardLoading(true)
      const [dashboard, comparison] = await Promise.all([
        systemAdminService.getEnterprisePerformanceDashboard(organizationId),
        systemAdminService.getEnterpriseComparisonAnalytics()
      ])
      setPerformanceDashboard(dashboard)
      setComparisonAnalytics(comparison)
      setSelectedOrganization(organizationId)
      setActiveTab('analytics')
    } catch (error) {
    } finally {
      setDashboardLoading(false)
    }
  }

  // 필터링된 기업 목록
  const filteredEnterprises = enterpriseOverviews.filter(enterprise => {
    const matchesSearch = enterprise.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         enterprise.companyCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         enterprise.adminInfo.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || enterprise.status.organizationStatus === filterStatus
    const matchesRisk = filterRisk === 'all' || enterprise.status.riskLevel === filterRisk

    return matchesSearch && matchesStatus && matchesRisk
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-emerald-700 bg-emerald-50 border-emerald-200'
      case 'trial': return 'text-blue-700 bg-blue-50 border-blue-200'
      case 'suspended': return 'text-red-700 bg-red-50 border-red-200'
      case 'pending': return 'text-amber-700 bg-amber-50 border-amber-200'
      default: return 'text-slate-700 bg-slate-50 border-slate-200'
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-emerald-700 bg-emerald-50 border-emerald-200'
      case 'medium': return 'text-amber-700 bg-amber-50 border-amber-200'
      case 'high': return 'text-red-700 bg-red-50 border-red-200'
      default: return 'text-slate-700 bg-slate-50 border-slate-200'
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'trial': return 'text-blue-700 bg-blue-50 border-blue-200'
      case 'basic': return 'text-emerald-700 bg-emerald-50 border-emerald-200'
      case 'premium': return 'text-purple-700 bg-purple-50 border-purple-200'
      case 'enterprise': return 'text-orange-700 bg-orange-50 border-orange-200'
      default: return 'text-slate-700 bg-slate-50 border-slate-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '활성'
      case 'trial': return '트라이얼'
      case 'suspended': return '정지'
      case 'pending': return '대기'
      default: return status
    }
  }

  const getRiskText = (risk: string) => {
    switch (risk) {
      case 'low': return '낮음'
      case 'medium': return '보통'
      case 'high': return '높음'
      default: return risk
    }
  }

  const getPlanText = (plan: string) => {
    switch (plan) {
      case 'trial': return '체험'
      case 'basic': return '기본'
      case 'premium': return '프리미엄'
      case 'enterprise': return '엔터프라이즈'
      default: return plan
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">기업 관리 데이터 로드 중</h3>
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">기업 관리</h1>
          <p className="text-lg text-slate-600">전체 기업 현황 모니터링 및 관리</p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-2">
          <div className="flex gap-2">
            {[
              { id: 'overview', label: '기업 현황', icon: Building2 },
              { id: 'registrations', label: '최근 가입', icon: Users },
              { id: 'analytics', label: '상세 분석', icon: Activity },
              { id: 'performance', label: '성과 대시보드', icon: TrendingUp },
              { id: 'comparison', label: '기업 비교', icon: Award }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 기업 현황 탭 */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* 요약 통계 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">총 기업 수</p>
                    <p className="text-2xl font-bold text-slate-900">{enterpriseOverviews.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">활성 기업</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {enterpriseOverviews.filter(e => e.status.organizationStatus === 'active').length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">트라이얼 기업</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {enterpriseOverviews.filter(e => e.status.organizationStatus === 'trial').length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">고위험 기업</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {enterpriseOverviews.filter(e => e.status.riskLevel === 'high').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 제어 패널 */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="기업명, 코드, 이메일로 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2.5 w-64 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-500"
                    />
                  </div>
                  
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
                  >
                    <option value="all" className="text-slate-900">전체 상태</option>
                    <option value="active" className="text-slate-900">활성</option>
                    <option value="trial" className="text-slate-900">트라이얼</option>
                    <option value="suspended" className="text-slate-900">정지</option>
                    <option value="pending" className="text-slate-900">대기</option>
                  </select>

                  <select
                    value={filterRisk}
                    onChange={(e) => setFilterRisk(e.target.value)}
                    className="px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
                  >
                    <option value="all" className="text-slate-900">전체 위험도</option>
                    <option value="low" className="text-slate-900">낮음</option>
                    <option value="medium" className="text-slate-900">보통</option>
                    <option value="high" className="text-slate-900">높음</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    자동 새로고침
                  </label>
                  
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    기업등록
                  </button>
                </div>
              </div>
            </div>

            {/* 기업 목록 */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">등록된 기업</h2>
                  <p className="text-slate-600 mt-1">전체 기업 목록 및 상세 정보</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">기업정보</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">관리자</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">상태</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">멤버</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">리포트</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">크레딧</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">건강점수</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">작업</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredEnterprises.map((enterprise) => (
                      <tr key={enterprise.organizationId} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-slate-900">{enterprise.organizationName}</div>
                            <div className="text-sm text-slate-600">{enterprise.companyCode}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm text-slate-900">{enterprise.adminInfo.email}</div>
                            <div className="text-xs text-slate-600">가입: {enterprise.adminInfo.registeredAt.toLocaleDateString()}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(enterprise.status.organizationStatus)}`}>
                              {getStatusText(enterprise.status.organizationStatus)}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPlanColor(enterprise.status.plan)}`}>
                              {getPlanText(enterprise.status.plan)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-slate-900">
                            <div className="font-semibold">{enterprise.memberStats.totalMembers}</div>
                            <div className="text-xs text-slate-600">{enterprise.memberStats.activeMembers} 활성</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-slate-900">
                            <div className="font-semibold">{enterprise.usageStats.totalReports}</div>
                            <div className="text-xs text-slate-600">{enterprise.usageStats.reportsThisMonth} 이번달</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-slate-900">
                            <div className="font-semibold">{enterprise.creditInfo.currentBalance}</div>
                            <div className="text-xs text-slate-600">{enterprise.creditInfo.usedThisMonth} 사용</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-semibold text-slate-900">{enterprise.status.healthScore}/100</div>
                            <div className="w-16 bg-slate-200 rounded-full h-2">
                              <div 
                                className="bg-orange-500 h-2 rounded-full transition-all" 
                                style={{ width: `${enterprise.status.healthScore}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => loadPerformanceDashboard(enterprise.organizationId)}
                              disabled={dashboardLoading}
                              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                              title="성과 분석"
                            >
                              {dashboardLoading ? (
                                <RefreshCw className="w-4 h-4 text-slate-600 animate-spin" />
                              ) : (
                                <TrendingUp className="w-4 h-4 text-slate-600" />
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedOrganization(enterprise.organizationId)
                                loadReportAnalytics(enterprise.organizationId)
                              }}
                              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                              title="상세 리포트 분석"
                            >
                              <Eye className="w-4 h-4 text-slate-600" />
                            </button>
                            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="기업 설정">
                              <Settings className="w-4 h-4 text-slate-600" />
                            </button>
                            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="더 많은 옵션">
                              <MoreHorizontal className="w-4 h-4 text-slate-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredEnterprises.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>조건에 맞는 기업이 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 최근 가입 탭 */}
        {activeTab === 'registrations' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentRegistrations.map((registration) => (
              <div key={registration.organizationId} className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
                <div className="space-y-4">
                  {/* 기업 정보 */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{registration.organizationName}</h3>
                    <p className="text-sm text-slate-600">{registration.companyCode}</p>
                  </div>

                  {/* 플래그들 */}
                  <div className="flex gap-2 flex-wrap">
                    {registration.flags.needsAttention && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium border border-red-200">
                        <AlertTriangle className="w-3 h-3" />
                        주의 필요
                      </span>
                    )}
                    {registration.flags.isHighValue && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium border border-purple-200">
                        <Award className="w-3 h-3" />
                        고가치
                      </span>
                    )}
                    {registration.flags.isChampion && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium border border-amber-200">
                        <Flag className="w-3 h-3" />
                        챔피언
                      </span>
                    )}
                  </div>

                  {/* 관리자 정보 */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-900">{registration.adminInfo.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-900">{registration.registrationDetails.registeredAt.toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* 설정 진행률 */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="font-medium text-slate-900">설정 진행률</span>
                      <span className="text-slate-600">{registration.setupProgress.progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all" 
                        style={{ width: `${registration.setupProgress.progressPercentage}%` }}
                      ></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                      <div className={`flex items-center gap-1 ${registration.setupProgress.profileCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>
                        <CheckCircle className="w-3 h-3" />
                        프로필 완성
                      </div>
                      <div className={`flex items-center gap-1 ${registration.setupProgress.firstMemberAdded ? 'text-emerald-600' : 'text-slate-400'}`}>
                        <CheckCircle className="w-3 h-3" />
                        멤버 추가
                      </div>
                      <div className={`flex items-center gap-1 ${registration.setupProgress.firstMeasurementDone ? 'text-emerald-600' : 'text-slate-400'}`}>
                        <CheckCircle className="w-3 h-3" />
                        측정 완료
                      </div>
                      <div className={`flex items-center gap-1 ${registration.setupProgress.firstReportGenerated ? 'text-emerald-600' : 'text-slate-400'}`}>
                        <CheckCircle className="w-3 h-3" />
                        리포트 생성
                      </div>
                    </div>
                  </div>

                  {/* 트라이얼 정보 */}
                  {registration.trialInfo && (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                      <div className="text-sm font-medium text-blue-900 mb-2">트라이얼 정보</div>
                      <div className="text-xs text-blue-800 space-y-1">
                        <div>남은 일수: {registration.trialInfo.daysRemaining}일</div>
                        <div>무료 크래딧: {registration.trialInfo.freeCreditsGranted - registration.trialInfo.freeCreditsUsed}/{registration.trialInfo.freeCreditsGranted}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 상세 분석 탭 */}
        {activeTab === 'analytics' && (
          <>
            {selectedOrganization && reportAnalytics ? (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{reportAnalytics.organizationName} 리포트 분석</h2>
                      <p className="text-slate-600">상세한 리포트 활용 현황</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedOrganization(null)
                      setReportAnalytics(null)
                      setActiveTab('overview')
                    }}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    목록으로
                  </button>
                </div>

                {/* 리포트 요약 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-3">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{reportAnalytics.reportSummary.totalReports}</p>
                      <p className="text-sm text-slate-600">총 리포트</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-xl mb-3">
                        <TrendingUp className="w-6 h-6 text-emerald-600" />
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{reportAnalytics.reportSummary.reportsThisMonth}</p>
                      <p className="text-sm text-slate-600">이번 달 리포트</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mb-3">
                        <Award className="w-6 h-6 text-purple-600" />
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{reportAnalytics.qualityMetrics.averageQualityScore.toFixed(1)}</p>
                      <p className="text-sm text-slate-600">평균 품질 점수</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl mb-3">
                        <Activity className="w-6 h-6 text-red-600" />
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{reportAnalytics.qualityMetrics.errorRate.toFixed(1)}%</p>
                      <p className="text-sm text-slate-600">에러율</p>
                    </div>
                  </div>
                </div>

                {/* 활발한 사용자와 리포트 유형별 통계를 2컬럼으로 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* 활발한 사용자 */}
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">활발한 사용자 TOP 5</h3>
                    <div className="space-y-3">
                      {reportAnalytics.reportSummary.mostActiveUsers.map((user, index) => (
                        <div key={user.userId} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">
                              {index + 1}
                            </span>
                            <span className="font-medium text-slate-900">{user.userName}</span>
                          </div>
                          <span className="text-sm font-semibold text-slate-900">{user.reportCount}개</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 리포트 유형별 통계 */}
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">리포트 유형별 통계</h3>
                    <div className="space-y-3">
                      {reportAnalytics.reportTypes.map((type) => (
                        <div key={type.engineName} className="p-3 border border-slate-200 rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-slate-900">{type.engineName}</div>
                            <div className="text-right">
                              <div className="font-bold text-slate-900">{type.count}개</div>
                              <div className="text-xs text-slate-600">{type.percentage.toFixed(1)}%</div>
                            </div>
                          </div>
                          <div className="text-xs text-slate-600">
                            평균 처리시간: {type.averageProcessingTime.toFixed(1)}초 | 
                            성공률: {type.successRate.toFixed(1)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 최근 리포트 */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">최근 리포트</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {reportAnalytics.recentReports.map((report) => (
                      <div key={report.reportId} className="flex items-center justify-between p-3 border-b border-slate-100 last:border-b-0">
                        <div>
                          <div className="font-medium text-slate-900">{report.userName}</div>
                          <div className="text-sm text-slate-600">{report.engineUsed}</div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="text-slate-900">품질: {report.qualityScore}/100</div>
                          <div className="text-slate-600">{report.createdAt.toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-32">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                    <FileText className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">기업을 선택해주세요</h3>
                  <p className="text-slate-600">기업 현황 탭에서 기업을 선택하여 상세 분석을 확인하세요</p>
                  <button
                    onClick={() => setActiveTab('overview')}
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                  >
                    기업 현황 보기
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* 기업 등록 모달 */}
      {isCreateModalOpen && (
        <CreateEnterpriseModal 
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false)
            loadData() // 목록 새로고침
          }}
        />
      )}
    </div>
  )
} 