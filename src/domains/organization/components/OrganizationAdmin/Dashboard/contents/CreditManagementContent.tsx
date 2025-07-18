import React, { useState, useEffect } from 'react'
import { 
  CreditCard, 
  Gift, 
  AlertTriangle, 
  RefreshCw,
  DollarSign,
  TrendingUp,
  Users,
  Filter,
  Search,
  MoreHorizontal,
  Plus,
  Pause,
  Play,
  Eye,
  Download,
  Bell,
  Settings,
  Zap,
  Clock,
  Award,
  CheckCircle2
} from 'lucide-react'
import systemAdminService, { 
  OrganizationCreditInfo, 
  CreditManagementAction,
  SystemSettings
} from '../../../../services/SystemAdminService'

interface GrantCreditModal {
  isOpen: boolean
  organizations: OrganizationCreditInfo[]
}

export default function CreditManagementContent() {
  const [creditInfos, setCreditInfos] = useState<OrganizationCreditInfo[]>([])
  const [filteredInfos, setFilteredInfos] = useState<OrganizationCreditInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'limitReached'>('all')
  const [grantModal, setGrantModal] = useState<GrantCreditModal>({ isOpen: false, organizations: [] })
  const [selectedOrganizations, setSelectedOrganizations] = useState<Set<string>>(new Set())
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)

  useEffect(() => {
    loadCreditData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [creditInfos, searchTerm, statusFilter])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(loadCreditData, 30000) // 30초마다 새로고침
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const loadCreditData = async () => {
    try {
      setIsLoading(true)

      const [credits, settings] = await Promise.allSettled([
        systemAdminService.getAllOrganizationCredits(),
        systemAdminService.getSystemSettings()
      ])

      if (credits.status === 'fulfilled') {
        setCreditInfos(credits.value)
      }

      if (settings.status === 'fulfilled') {
        setSystemSettings(settings.value)
      }

      setLastUpdated(new Date())
    } catch (error) {
      console.error('크레딧 데이터 로드 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = creditInfos

    // 검색 필터
    if (searchTerm) {
      filtered = filtered.filter(info => 
        info.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        info.organizationId.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter(info => info.status === statusFilter)
    }

    setFilteredInfos(filtered)
  }

  const handleGrantFreeCredits = async (amount: number, reason: string, expiryDays?: number) => {
    try {
      const actions: CreditManagementAction[] = grantModal.organizations.map(org => ({
        organizationId: org.organizationId,
        action: 'grant',
        amount,
        reason,
        expiryDate: expiryDays ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000) : undefined,
        sendNotification: true
      }))

      const result = await systemAdminService.grantFreeCredits(actions)
      
      console.log(`무료 크레딧 지급 완료: 성공 ${result.success}건, 실패 ${result.failed}건`)
      
      // 데이터 새로고침
      await loadCreditData()
      
      // 모달 닫기
      setGrantModal({ isOpen: false, organizations: [] })
      setSelectedOrganizations(new Set())
      
    } catch (error) {
      console.error('무료 크레딧 지급 실패:', error)
    }
  }

  const handleSuspendCredits = async (organizationId: string, reason: string) => {
    try {
      await systemAdminService.updateOrganizationCreditStatus(organizationId, 'suspended', reason)
      await loadCreditData()
    } catch (error) {
      console.error('크레딧 정지 실패:', error)
    }
  }

  const handleActivateCredits = async (organizationId: string) => {
    try {
      await systemAdminService.updateOrganizationCreditStatus(organizationId, 'active', '관리자에 의한 활성화')
      await loadCreditData()
    } catch (error) {
      console.error('크레딧 활성화 실패:', error)
    }
  }

  const getStatusColor = (status: OrganizationCreditInfo['status']) => {
    switch (status) {
      case 'active': return 'text-emerald-700 bg-emerald-50 border-emerald-200'
      case 'suspended': return 'text-red-700 bg-red-50 border-red-200'
      case 'limitReached': return 'text-amber-700 bg-amber-50 border-amber-200'
      default: return 'text-slate-700 bg-slate-50 border-slate-200'
    }
  }

  const getStatusText = (status: OrganizationCreditInfo['status']) => {
    switch (status) {
      case 'active': return '활성'
      case 'suspended': return '정지'
      case 'limitReached': return '한도도달'
      default: return '알 수 없음'
    }
  }

  const getPlanColor = (plan: OrganizationCreditInfo['plan']) => {
    switch (plan) {
      case 'trial': return 'text-blue-700 bg-blue-50 border-blue-200'
      case 'basic': return 'text-emerald-700 bg-emerald-50 border-emerald-200'
      case 'premium': return 'text-purple-700 bg-purple-50 border-purple-200'
      case 'enterprise': return 'text-orange-700 bg-orange-50 border-orange-200'
      default: return 'text-slate-700 bg-slate-50 border-slate-200'
    }
  }

  const getPlanText = (plan: OrganizationCreditInfo['plan']) => {
    switch (plan) {
      case 'trial': return '체험'
      case 'basic': return '기본'
      case 'premium': return '프리미엄'
      case 'enterprise': return '엔터프라이즈'
      default: return '알 수 없음'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount)
  }

  const calculateUsageRate = (used: number, limit: number) => {
    return limit > 0 ? (used / limit) * 100 : 0
  }

  const getUsageColor = (rate: number) => {
    if (rate >= 90) return 'bg-red-500'
    if (rate >= 70) return 'bg-amber-500'
    if (rate >= 50) return 'bg-blue-500'
    return 'bg-emerald-500'
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
              <h3 className="text-lg font-semibold text-slate-900 mb-2">크래딧 데이터 로드 중</h3>
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
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">기업별 크래딧 관리</h1>
          <p className="text-lg text-slate-600">무료 크래딧 지급 및 사용량 모니터링</p>
        </div>

        {/* 제어 패널 */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="조직명 또는 ID 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-64 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">전체 상태</option>
                <option value="active">활성</option>
                <option value="suspended">정지</option>
                <option value="limitReached">한도도달</option>
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
                onClick={loadCreditData}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                새로고침
              </button>
              
              <button
                onClick={() => {
                  const selected = filteredInfos.filter(info => selectedOrganizations.has(info.organizationId))
                  setGrantModal({ isOpen: true, organizations: selected })
                }}
                disabled={selectedOrganizations.size === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Gift className="w-4 h-4" />
                무료 크래딧 지급 ({selectedOrganizations.size})
              </button>
            </div>
          </div>
        </div>

        {/* 전체 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">총 조직 수</p>
                <p className="text-2xl font-bold text-slate-900">{creditInfos.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">총 크래딧 잔액</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(creditInfos.reduce((sum, info) => sum + info.creditBalance, 0))}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Gift className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">지급된 무료 크래딧</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(creditInfos.reduce((sum, info) => sum + info.freeCreditsGranted, 0))}
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
                <p className="text-sm font-medium text-slate-600">문제 있는 조직</p>
                <p className="text-2xl font-bold text-slate-900">
                  {creditInfos.filter(info => info.status !== 'active' || info.alerts.length > 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 조직별 크래딧 현황 */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-lg font-semibold text-slate-900">조직별 크래딧 현황</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedOrganizations.size === filteredInfos.length && filteredInfos.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOrganizations(new Set(filteredInfos.map(info => info.organizationId)))
                        } else {
                          setSelectedOrganizations(new Set())
                        }
                      }}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">조직명</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">플랜</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">크래딧 잔액</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">이번 달 사용량</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">무료 크래딧</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">상태</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">마지막 활동</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredInfos.map((info) => (
                  <tr key={info.organizationId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedOrganizations.has(info.organizationId)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedOrganizations)
                          if (e.target.checked) {
                            newSelected.add(info.organizationId)
                          } else {
                            newSelected.delete(info.organizationId)
                          }
                          setSelectedOrganizations(newSelected)
                        }}
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-900">{info.organizationName}</p>
                        <p className="text-sm text-slate-600">{info.organizationId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getPlanColor(info.plan)}`}>
                        {getPlanText(info.plan)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-900">{formatCurrency(info.creditBalance)}</p>
                        <div className="w-24 bg-slate-200 rounded-full h-2 mt-1">
                          <div 
                            className={`h-2 rounded-full transition-all ${getUsageColor(calculateUsageRate(info.creditBalance, info.creditLimit))}`}
                            style={{ width: `${Math.min(calculateUsageRate(info.creditBalance, info.creditLimit), 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{formatCurrency(info.usageThisMonth)}</span>
                        {info.usageThisMonth > 200 && (
                          <TrendingUp className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-emerald-600">+{formatCurrency(info.freeCreditsGranted)} 지급</p>
                        <p className="text-red-600">-{formatCurrency(info.freeCreditsUsed)} 사용</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(info.status)}`}>
                          {getStatusText(info.status)}
                        </span>
                        {info.alerts.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Bell className="w-3 h-3 text-red-500" />
                            <span className="text-xs text-red-600">{info.alerts.length}개 알림</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">
                        {info.lastActivity.toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                          <MoreHorizontal className="w-4 h-4 text-slate-600" />
                        </button>
                        {/* 드롭다운 메뉴는 추후 구현 */}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredInfos.length === 0 && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-full mb-4">
                  <Search className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">조직을 찾을 수 없습니다</h3>
                <p className="text-slate-600">검색 조건을 변경해보세요.</p>
              </div>
            )}
          </div>
        </div>

        {/* 마지막 업데이트 시간 */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-sm text-slate-600 bg-white px-4 py-2 rounded-full shadow-sm">
            <Clock className="w-4 h-4" />
            마지막 업데이트: {lastUpdated.toLocaleString()}
          </div>
        </div>

        {/* 무료 크래딧 지급 모달 */}
        {grantModal.isOpen && (
          <GrantCreditsModal
            organizations={grantModal.organizations}
            onClose={() => setGrantModal({ isOpen: false, organizations: [] })}
            onGrant={handleGrantFreeCredits}
            systemSettings={systemSettings}
          />
        )}
      </div>
    </div>
  )
}

// 무료 크래딧 지급 모달 컴포넌트
interface GrantCreditsModalProps {
  organizations: OrganizationCreditInfo[]
  onClose: () => void
  onGrant: (amount: number, reason: string, expiryDays?: number) => void
  systemSettings: SystemSettings | null
}

function GrantCreditsModal({ organizations, onClose, onGrant, systemSettings }: GrantCreditsModalProps) {
  const [amount, setAmount] = useState(50)
  const [reason, setReason] = useState('')
  const [expiryDays, setExpiryDays] = useState<number | undefined>(30)
  const [selectedTemplate, setSelectedTemplate] = useState('')

  const templates = [
    { id: 'trial', name: '체험 서비스', amount: 50, reason: '신규 고객 체험 서비스', expiryDays: 30 },
    { id: 'promotion', name: '프로모션', amount: 100, reason: '특별 프로모션 이벤트', expiryDays: 60 },
    { id: 'compensation', name: '보상', amount: 200, reason: '서비스 장애 보상', expiryDays: undefined },
    { id: 'custom', name: '사용자 정의', amount: 0, reason: '', expiryDays: undefined }
  ]

  const handleTemplateSelect = (template: typeof templates[0]) => {
    setSelectedTemplate(template.id)
    setAmount(template.amount)
    setReason(template.reason)
    setExpiryDays(template.expiryDays)
  }

  const handleSubmit = () => {
    if (amount > 0 && reason.trim()) {
      onGrant(amount, reason.trim(), expiryDays)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-xl">
              <Gift className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">무료 크래딧 지급</h3>
              <p className="text-sm text-slate-600">
                {organizations.length}개 조직에 무료 크래딧을 지급합니다
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <span className="text-slate-400">✕</span>
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* 대상 조직 */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">대상 조직</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {organizations.map((org) => (
                <div key={org.organizationId} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="font-medium text-slate-900">{org.organizationName}</span>
                  <span className="text-sm text-slate-600">현재: {org.creditBalance.toLocaleString()} 크래딧</span>
                </div>
              ))}
            </div>
          </div>

          {/* 템플릿 선택 */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">지급 템플릿</h4>
            <div className="grid grid-cols-2 gap-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`p-4 border-2 rounded-xl text-left transition-all ${
                    selectedTemplate === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-semibold text-slate-900">{template.name}</p>
                  {template.amount > 0 && (
                    <p className="text-sm text-slate-600">{template.amount} 크래딧</p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 상세 설정 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                지급 크래딧 수량
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min="1"
                max={systemSettings?.globalCreditLimits.maxFreeCredits || 1000}
                placeholder="지급할 크래딧 수량"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {systemSettings && (
                <p className="text-xs text-slate-500 mt-1">
                  최대: {systemSettings.globalCreditLimits.maxFreeCredits} 크래딧
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                만료 기간 (일)
              </label>
              <input
                type="number"
                value={expiryDays || ''}
                onChange={(e) => setExpiryDays(e.target.value ? Number(e.target.value) : undefined)}
                min="1"
                max="365"
                placeholder="만료 기간 (비워두면 무제한)"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              지급 사유
            </label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="크래딧 지급 사유를 입력하세요"
              maxLength={100}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 요약 */}
          <div className="p-4 bg-slate-50 rounded-xl">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">지급 요약</h4>
            <div className="space-y-2 text-sm text-slate-600">
              <p>• 대상 조직: {organizations.length}개</p>
              <p>• 조직당 지급: {amount.toLocaleString()} 크래딧</p>
              <p>• 총 지급량: {(amount * organizations.length).toLocaleString()} 크래딧</p>
              <p>• 만료 기간: {expiryDays ? `${expiryDays}일` : '무제한'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!amount || !reason.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Gift className="w-4 h-4" />
            지급하기
          </button>
        </div>
      </div>
    </div>
  )
} 