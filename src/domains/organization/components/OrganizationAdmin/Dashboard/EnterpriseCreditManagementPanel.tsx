import React, { useState, useEffect } from 'react'
import { Card } from '@ui/card'
import { Button } from '@ui/button'
import { Badge } from '@ui/badge'
import { Input } from '@ui/input'
import { 
  CreditCard, 
  Gift, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Filter,
  Search,
  MoreHorizontal,
  Plus,
  Pause,
  Play,
  Eye,
  Download,
  Bell,
  Settings
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@ui/dropdown-menu'
import systemAdminService, { 
  OrganizationCreditInfo, 
  CreditManagementAction,
  SystemSettings
} from '../../../services/SystemAdminService'

interface EnterpriseCreditManagementPanelProps {
  isVisible: boolean
  onClose: () => void
}

interface GrantCreditModal {
  isOpen: boolean
  organizations: OrganizationCreditInfo[]
}

export default function EnterpriseCreditManagementPanel({ isVisible, onClose }: EnterpriseCreditManagementPanelProps) {
  const [creditInfos, setCreditInfos] = useState<OrganizationCreditInfo[]>([])
  const [filteredInfos, setFilteredInfos] = useState<OrganizationCreditInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'limitReached'>('all')
  const [grantModal, setGrantModal] = useState<GrantCreditModal>({ isOpen: false, organizations: [] })
  const [selectedOrganizations, setSelectedOrganizations] = useState<Set<string>>(new Set())
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null)

  useEffect(() => {
    if (isVisible) {
      loadCreditData()
    }
  }, [isVisible])

  useEffect(() => {
    applyFilters()
  }, [creditInfos, searchTerm, statusFilter])

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
      case 'active': return 'text-green-600 bg-green-50'
      case 'suspended': return 'text-red-600 bg-red-50'
      case 'limitReached': return 'text-yellow-600 bg-yellow-50'
      default: return 'text-gray-600 bg-gray-50'
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
      case 'trial': return 'text-blue-600 bg-blue-50'
      case 'basic': return 'text-green-600 bg-green-50'
      case 'premium': return 'text-purple-600 bg-purple-50'
      case 'enterprise': return 'text-orange-600 bg-orange-50'
      default: return 'text-gray-600 bg-gray-50'
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

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <CreditCard className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">기관별 크레딧 관리</h2>
              <p className="text-sm text-gray-500">
                무료 크레딧 지급 및 사용량 모니터링
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadCreditData}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
            <Button variant="outline" onClick={onClose}>
              ✕
            </Button>
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">크레딧 데이터 로드 중...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 전체 통계 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">총 기관 수</p>
                      <p className="text-xl font-bold text-gray-900">{creditInfos.length}</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">총 크레딧 잔액</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(creditInfos.reduce((sum, info) => sum + info.creditBalance, 0))}
                      </p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Gift className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">지급된 무료 크레딧</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(creditInfos.reduce((sum, info) => sum + info.freeCreditsGranted, 0))}
                      </p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-50 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">문제 있는 기관</p>
                      <p className="text-xl font-bold text-gray-900">
                        {creditInfos.filter(info => info.status !== 'active' || info.alerts.length > 0).length}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* 필터링 및 액션 */}
              <Card className="p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                  <div className="flex space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="기관명 또는 ID 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Filter className="w-4 h-4 mr-2" />
                          상태: {statusFilter === 'all' ? '전체' : getStatusText(statusFilter as any)}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                          전체
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                          활성
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter('suspended')}>
                          정지
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter('limitReached')}>
                          한도도달
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      size="sm"
                      onClick={() => {
                        const selected = filteredInfos.filter(info => selectedOrganizations.has(info.organizationId))
                        setGrantModal({ isOpen: true, organizations: selected })
                      }}
                      disabled={selectedOrganizations.size === 0}
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      무료 크레딧 지급 ({selectedOrganizations.size})
                    </Button>
                  </div>
                </div>
              </Card>

              {/* 조직별 크레딧 현황 */}
              <Card className="overflow-hidden">
                <div className="p-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">기관별 크레딧 현황</h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left">
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
                            className="w-4 h-4"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">기관명</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">플랜</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">크레딧 잔액</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">이번 달 사용량</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">무료 크레딧</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">상태</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">마지막 활동</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">액션</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredInfos.map((info) => (
                        <tr key={info.organizationId} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
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
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900">{info.organizationName}</p>
                              <p className="text-sm text-gray-500">{info.organizationId}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={getPlanColor(info.plan)}>
                              {getPlanText(info.plan)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-semibold text-gray-900">{formatCurrency(info.creditBalance)}</p>
                              <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-1">
                                <div 
                                  className="bg-blue-600 h-1.5 rounded-full" 
                                  style={{ width: `${Math.min(calculateUsageRate(info.creditBalance, info.creditLimit), 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{formatCurrency(info.usageThisMonth)}</span>
                              {info.usageThisMonth > 200 && (
                                <TrendingUp className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm">
                                <span className="text-green-600">{formatCurrency(info.freeCreditsGranted)}</span> 지급
                              </p>
                              <p className="text-sm">
                                <span className="text-red-600">{formatCurrency(info.freeCreditsUsed)}</span> 사용
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <Badge className={getStatusColor(info.status)}>
                                {getStatusText(info.status)}
                              </Badge>
                              {info.alerts.length > 0 && (
                                <div className="flex items-center space-x-1">
                                  <Bell className="w-3 h-3 text-red-500" />
                                  <span className="text-xs text-red-600">{info.alerts.length}개 알림</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-gray-600">
                              {info.lastActivity.toLocaleDateString()}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => {
                                  setGrantModal({ isOpen: true, organizations: [info] })
                                }}>
                                  <Gift className="w-4 h-4 mr-2" />
                                  무료 크레딧 지급
                                </DropdownMenuItem>
                                
                                {info.status === 'active' ? (
                                  <DropdownMenuItem 
                                    onClick={() => handleSuspendCredits(info.organizationId, '관리자에 의한 정지')}
                                    className="text-red-600"
                                  >
                                    <Pause className="w-4 h-4 mr-2" />
                                    크레딧 정지
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem 
                                    onClick={() => handleActivateCredits(info.organizationId)}
                                    className="text-green-600"
                                  >
                                    <Play className="w-4 h-4 mr-2" />
                                    크레딧 활성화
                                  </DropdownMenuItem>
                                )}
                                
                                <DropdownMenuItem>
                                  <Eye className="w-4 h-4 mr-2" />
                                  사용 내역 보기
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem>
                                  <Download className="w-4 h-4 mr-2" />
                                  데이터 내보내기
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredInfos.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">조건에 맞는 기관이 없습니다.</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* 마지막 업데이트 시간 */}
              <div className="text-center text-sm text-gray-500">
                마지막 업데이트: {lastUpdated.toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* 무료 크레딧 지급 모달 */}
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

// 무료 크레딧 지급 모달 컴포넌트
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Gift className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="text-lg font-bold text-gray-900">무료 크레딧 지급</h3>
              <p className="text-sm text-gray-500">
                {organizations.length}개 기관에 무료 크레딧을 지급합니다
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* 대상 조직 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">대상 기관</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {organizations.map((org) => (
                <div key={org.organizationId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="font-medium">{org.organizationName}</span>
                  <span className="text-sm text-gray-500">현재: {org.creditBalance.toLocaleString()} 크레딧</span>
                </div>
              ))}
            </div>
          </div>

          {/* 템플릿 선택 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">지급 템플릿</h4>
            <div className="grid grid-cols-2 gap-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    selectedTemplate === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-gray-900">{template.name}</p>
                  {template.amount > 0 && (
                    <p className="text-sm text-gray-500">{template.amount} 크레딧</p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 상세 설정 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                지급 크레딧 수량
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min="1"
                max={systemSettings?.globalCreditLimits.maxFreeCredits || 1000}
                placeholder="지급할 크레딧 수량"
              />
              {systemSettings && (
                <p className="text-xs text-gray-500 mt-1">
                  최대: {systemSettings.globalCreditLimits.maxFreeCredits} 크레딧
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                만료 기간 (일)
              </label>
              <Input
                type="number"
                value={expiryDays || ''}
                onChange={(e) => setExpiryDays(e.target.value ? Number(e.target.value) : undefined)}
                min="1"
                max="365"
                placeholder="만료 기간 (비워두면 무제한)"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              지급 사유
            </label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="크레딧 지급 사유를 입력하세요"
              maxLength={100}
            />
          </div>

          {/* 요약 */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">지급 요약</h4>
            <div className="space-y-1 text-sm">
              <p>• 대상 기관: {organizations.length}개</p>
              <p>• 기관당 지급: {amount.toLocaleString()} 크레딧</p>
              <p>• 총 지급량: {(amount * organizations.length).toLocaleString()} 크레딧</p>
              <p>• 만료 기간: {expiryDays ? `${expiryDays}일` : '무제한'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!amount || !reason.trim()}
          >
            <Gift className="w-4 h-4 mr-2" />
            지급하기
          </Button>
        </div>
      </div>
    </div>
  )
} 