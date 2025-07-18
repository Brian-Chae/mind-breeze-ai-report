import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card'
import { Button } from '@shared/components/ui/button'
import { Badge } from '@shared/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs'
import { Input } from '@shared/components/ui/input'
import { Label } from '../../../../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@shared/components/ui/dialog'
import { Textarea } from '@shared/components/ui/textarea'
import { ScrollArea } from '@shared/components/ui/scroll-area'
import { Separator } from '@shared/components/ui/separator'
import { Progress } from '@shared/components/ui/progress'
import { Alert, AlertDescription } from '@shared/components/ui/alert'
import systemAdminService, { 
  EnterpriseOverview, 
  RecentEnterpriseRegistration, 
  ReportAnalytics, 
  EnterpriseManagementAction 
} from '../../../services/SystemAdminService'
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
  Minus
} from 'lucide-react'

interface EnterpriseManagementPanelProps {
  onClose: () => void
}

export const EnterpriseManagementPanel: React.FC<EnterpriseManagementPanelProps> = ({ onClose }) => {
  const [enterpriseOverviews, setEnterpriseOverviews] = useState<EnterpriseOverview[]>([])
  const [recentRegistrations, setRecentRegistrations] = useState<RecentEnterpriseRegistration[]>([])
  const [selectedOrganization, setSelectedOrganization] = useState<string | null>(null)
  const [reportAnalytics, setReportAnalytics] = useState<ReportAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterRisk, setFilterRisk] = useState<string>('all')
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [actionForm, setActionForm] = useState<Partial<EnterpriseManagementAction>>({
    action: 'grant_credits',
    parameters: { reason: '', amount: 0 },
    sendNotification: true,
    requiresApproval: false
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [overviews, registrations] = await Promise.all([
        systemAdminService.getAllEnterpriseOverview(),
        systemAdminService.getRecentEnterpriseRegistrations(30)
      ])
      
      setEnterpriseOverviews(overviews)
      setRecentRegistrations(registrations)
    } catch (error) {
      console.error('기업 관리 데이터 로드 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadReportAnalytics = async (organizationId: string) => {
    try {
      const analytics = await systemAdminService.getOrganizationReportAnalytics(organizationId)
      setReportAnalytics(analytics)
    } catch (error) {
      console.error('리포트 분석 로드 실패:', error)
    }
  }

  const executeAction = async () => {
    if (!selectedOrganization || !actionForm.action || !actionForm.parameters?.reason) {
      return
    }

    try {
      const action: EnterpriseManagementAction = {
        organizationId: selectedOrganization,
        action: actionForm.action,
        parameters: actionForm.parameters,
        sendNotification: actionForm.sendNotification || false,
        requiresApproval: actionForm.requiresApproval || false
      }

      await systemAdminService.executeEnterpriseManagementAction(action)
      setShowActionDialog(false)
      loadData() // 데이터 새로고침
    } catch (error) {
      console.error('액션 실행 실패:', error)
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
      case 'active': return 'bg-green-100 text-green-800'
      case 'trial': return 'bg-blue-100 text-blue-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'trial': return 'bg-blue-100 text-blue-800'
      case 'basic': return 'bg-green-100 text-green-800'
      case 'premium': return 'bg-purple-100 text-purple-800'
      case 'enterprise': return 'bg-gold-100 text-gold-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-96 bg-white shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>기업 관리 데이터를 로드하고 있습니다...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-7xl h-full max-h-[90vh] overflow-hidden bg-white shadow-2xl">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                기업 관리
              </CardTitle>
              <CardDescription>
                전체 기업 현황 모니터링 및 관리
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={loadData}>
                새로고침
              </Button>
              <Button variant="ghost" onClick={onClose}>
                닫기
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 h-full bg-gray-50">
          <Tabs defaultValue="overview" className="h-full">
            <TabsList className="grid w-full grid-cols-3 border-b rounded-none bg-white">
              <TabsTrigger value="overview">기업 현황</TabsTrigger>
              <TabsTrigger value="registrations">최근 가입</TabsTrigger>
              <TabsTrigger value="analytics">상세 분석</TabsTrigger>
            </TabsList>

            {/* 기업 현황 탭 */}
            <TabsContent value="overview" className="h-full p-6 space-y-6 bg-gray-50">
              {/* 검색 및 필터 */}
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
                <div className="flex-1">
                  <Label htmlFor="search">검색</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="기업명, 코드, 이메일로 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>상태</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="active">활성</SelectItem>
                      <SelectItem value="trial">트라이얼</SelectItem>
                      <SelectItem value="suspended">중지</SelectItem>
                      <SelectItem value="pending">대기</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>위험도</Label>
                  <Select value={filterRisk} onValueChange={setFilterRisk}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="low">낮음</SelectItem>
                      <SelectItem value="medium">보통</SelectItem>
                      <SelectItem value="high">높음</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 요약 통계 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">총 기업 수</p>
                                                    <p className="text-2xl font-bold text-gray-900">{enterpriseOverviews.length}</p>
                      </div>
                      <Building2 className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">활성 기업</p>
                        <p className="text-2xl font-bold text-green-600">
                          {enterpriseOverviews.filter(e => e.status.organizationStatus === 'active').length}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">트라이얼 기업</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {enterpriseOverviews.filter(e => e.status.organizationStatus === 'trial').length}
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">고위험 기업</p>
                        <p className="text-2xl font-bold text-red-600">
                          {enterpriseOverviews.filter(e => e.status.riskLevel === 'high').length}
                        </p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 기업 목록 */}
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {filteredEnterprises.map((enterprise) => (
                    <Card key={enterprise.organizationId} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            {/* 기업 기본 정보 */}
                            <div className="flex items-center gap-3">
                              <div>
                                <h3 className="font-semibold text-lg">{enterprise.organizationName}</h3>
                                <p className="text-sm text-gray-600">{enterprise.companyCode}</p>
                              </div>
                              <div className="flex gap-2">
                                <Badge className={getStatusColor(enterprise.status.organizationStatus)}>
                                  {enterprise.status.organizationStatus}
                                </Badge>
                                <Badge className={getPlanColor(enterprise.status.plan)}>
                                  {enterprise.status.plan}
                                </Badge>
                                <Badge className={getRiskColor(enterprise.status.riskLevel)}>
                                  {enterprise.status.riskLevel} 위험
                                </Badge>
                              </div>
                            </div>

                            {/* 관리자 정보 */}
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Mail className="h-4 w-4" />
                                {enterprise.adminInfo.email}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                가입: {enterprise.adminInfo.registeredAt.toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Activity className="h-4 w-4" />
                                마지막 로그인: {enterprise.adminInfo.lastLogin.toLocaleDateString()}
                              </div>
                            </div>

                            {/* 통계 정보 */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-blue-600" />
                                <span>멤버: {enterprise.memberStats.totalMembers}</span>
                                <span className="text-gray-500">({enterprise.memberStats.activeMembers} 활성)</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-green-600" />
                                <span>리포트: {enterprise.usageStats.totalReports}</span>
                                <span className="text-gray-500">({enterprise.usageStats.reportsThisMonth} 이번달)</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-purple-600" />
                                <span>크레딧: {enterprise.creditInfo.currentBalance}</span>
                                <span className="text-gray-500">({enterprise.creditInfo.usedThisMonth} 사용)</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-orange-600" />
                                <span>건강점수: {enterprise.status.healthScore}/100</span>
                                <Progress value={enterprise.status.healthScore} className="w-16 h-2" />
                              </div>
                            </div>

                            {/* 성과 지표 */}
                            <div className="flex items-center gap-6 text-sm">
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                <span>참여율: {enterprise.performance.engagementRate.toFixed(1)}%</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Award className="h-4 w-4 text-purple-600" />
                                <span>도입률: {enterprise.performance.adoptionRate.toFixed(1)}%</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                <span>이탈위험: {enterprise.performance.churnRisk.toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>

                          {/* 액션 버튼들 */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedOrganization(enterprise.organizationId)
                                loadReportAnalytics(enterprise.organizationId)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedOrganization(enterprise.organizationId)}
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>기업 관리 액션</DialogTitle>
                                  <DialogDescription>
                                    {enterprise.organizationName}에 대한 관리 액션을 실행합니다.
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <div className="space-y-4">
                                  <div>
                                    <Label>액션 유형</Label>
                                    <Select
                                      value={actionForm.action}
                                      onValueChange={(value) => setActionForm({...actionForm, action: value as any})}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="grant_credits">크레딧 지급</SelectItem>
                                        <SelectItem value="suspend_organization">기업 정지</SelectItem>
                                        <SelectItem value="activate_organization">기업 활성화</SelectItem>
                                        <SelectItem value="extend_trial">트라이얼 연장</SelectItem>
                                        <SelectItem value="change_plan">플랜 변경</SelectItem>
                                        <SelectItem value="set_limit">한도 설정</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {actionForm.action === 'grant_credits' && (
                                    <div>
                                      <Label>크레딧 수량</Label>
                                      <Input
                                        type="number"
                                        value={actionForm.parameters?.amount || 0}
                                        onChange={(e) => setActionForm({
                                          ...actionForm,
                                          parameters: { 
                                            ...actionForm.parameters, 
                                            amount: parseInt(e.target.value),
                                            reason: actionForm.parameters?.reason || ''
                                          }
                                        })}
                                      />
                                    </div>
                                  )}

                                  {actionForm.action === 'extend_trial' && (
                                    <div>
                                      <Label>연장 일수</Label>
                                      <Input
                                        type="number"
                                        value={actionForm.parameters?.duration || 0}
                                        onChange={(e) => setActionForm({
                                          ...actionForm,
                                          parameters: { 
                                            ...actionForm.parameters, 
                                            duration: parseInt(e.target.value),
                                            reason: actionForm.parameters?.reason || ''
                                          }
                                        })}
                                      />
                                    </div>
                                  )}

                                  <div>
                                    <Label>사유</Label>
                                    <Textarea
                                      value={actionForm.parameters?.reason || ''}
                                      onChange={(e) => setActionForm({
                                        ...actionForm,
                                        parameters: { ...actionForm.parameters, reason: e.target.value }
                                      })}
                                      placeholder="액션 실행 사유를 입력하세요"
                                    />
                                  </div>
                                </div>

                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setShowActionDialog(false)}>
                                    취소
                                  </Button>
                                  <Button onClick={executeAction}>
                                    실행
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* 최근 가입 탭 */}
            <TabsContent value="registrations" className="h-full p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentRegistrations.map((registration) => (
                  <Card key={registration.organizationId} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* 기업 정보 */}
                        <div>
                          <h3 className="font-semibold">{registration.organizationName}</h3>
                          <p className="text-sm text-gray-600">{registration.companyCode}</p>
                        </div>

                        {/* 플래그들 */}
                        <div className="flex gap-2 flex-wrap">
                          {registration.flags.needsAttention && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              주의 필요
                            </Badge>
                          )}
                          {registration.flags.isHighValue && (
                            <Badge variant="secondary" className="text-xs">
                              <Award className="h-3 w-3 mr-1" />
                              고가치
                            </Badge>
                          )}
                          {registration.flags.isChampion && (
                            <Badge className="bg-gold-100 text-gold-800 text-xs">
                              <Flag className="h-3 w-3 mr-1" />
                              챔피언
                            </Badge>
                          )}
                        </div>

                        {/* 관리자 정보 */}
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span>{registration.adminInfo.email}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{registration.registrationDetails.registeredAt.toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* 설정 진행률 */}
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>설정 진행률</span>
                            <span>{registration.setupProgress.progressPercentage}%</span>
                          </div>
                          <Progress value={registration.setupProgress.progressPercentage} />
                          
                          <div className="grid grid-cols-2 gap-1 mt-2 text-xs">
                            <div className={`flex items-center gap-1 ${registration.setupProgress.profileCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                              <CheckCircle className="h-3 w-3" />
                              프로필 완성
                            </div>
                            <div className={`flex items-center gap-1 ${registration.setupProgress.firstMemberAdded ? 'text-green-600' : 'text-gray-400'}`}>
                              <CheckCircle className="h-3 w-3" />
                              멤버 추가
                            </div>
                            <div className={`flex items-center gap-1 ${registration.setupProgress.firstMeasurementDone ? 'text-green-600' : 'text-gray-400'}`}>
                              <CheckCircle className="h-3 w-3" />
                              측정 완료
                            </div>
                            <div className={`flex items-center gap-1 ${registration.setupProgress.firstReportGenerated ? 'text-green-600' : 'text-gray-400'}`}>
                              <CheckCircle className="h-3 w-3" />
                              리포트 생성
                            </div>
                          </div>
                        </div>

                        {/* 트라이얼 정보 */}
                        {registration.trialInfo && (
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="text-sm font-medium text-blue-800 mb-1">트라이얼 정보</div>
                            <div className="text-xs text-blue-700 space-y-1">
                              <div>남은 일수: {registration.trialInfo.daysRemaining}일</div>
                              <div>무료 크레딧: {registration.trialInfo.freeCreditsGranted - registration.trialInfo.freeCreditsUsed}/{registration.trialInfo.freeCreditsGranted}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* 상세 분석 탭 */}
            <TabsContent value="analytics" className="h-full p-6">
              {selectedOrganization && reportAnalytics ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">{reportAnalytics.organizationName} 리포트 분석</h2>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedOrganization(null)
                        setReportAnalytics(null)
                      }}
                    >
                      목록으로
                    </Button>
                  </div>

                  {/* 리포트 요약 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-white border border-gray-200">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <FileText className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                          <p className="text-2xl font-bold text-gray-900">{reportAnalytics.reportSummary.totalReports}</p>
                          <p className="text-sm text-gray-600">총 리포트</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white border border-gray-200">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <TrendingUp className="h-8 w-8 mx-auto text-green-600 mb-2" />
                          <p className="text-2xl font-bold text-green-600">{reportAnalytics.reportSummary.reportsThisMonth}</p>
                          <p className="text-sm text-gray-600">이번 달 리포트</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white border border-gray-200">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <Award className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                          <p className="text-2xl font-bold text-purple-600">{reportAnalytics.qualityMetrics.averageQualityScore.toFixed(1)}</p>
                          <p className="text-sm text-gray-600">평균 품질 점수</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white border border-gray-200">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <Activity className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                          <p className="text-2xl font-bold text-red-600">{reportAnalytics.qualityMetrics.errorRate.toFixed(1)}%</p>
                          <p className="text-sm text-gray-600">에러율</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 활발한 사용자 */}
                  <Card className="bg-white border border-gray-200">
                    <CardHeader>
                      <CardTitle>활발한 사용자 TOP 5</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {reportAnalytics.reportSummary.mostActiveUsers.map((user, index) => (
                          <div key={user.userId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-gray-900 border-gray-300">{index + 1}</Badge>
                              <span>{user.userName}</span>
                            </div>
                            <span className="font-medium">{user.reportCount}개 리포트</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* 리포트 유형별 통계 */}
                  <Card className="bg-white border border-gray-200">
                    <CardHeader>
                      <CardTitle>리포트 유형별 통계</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {reportAnalytics.reportTypes.map((type) => (
                          <div key={type.engineName} className="flex items-center justify-between p-3 border rounded">
                            <div>
                              <div className="font-medium">{type.engineName}</div>
                              <div className="text-sm text-gray-600">
                                평균 처리시간: {type.averageProcessingTime.toFixed(1)}초 | 
                                성공률: {type.successRate.toFixed(1)}%
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-gray-900">{type.count}개</div>
                              <div className="text-sm text-gray-600">{type.percentage.toFixed(1)}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* 최근 리포트 */}
                  <Card className="bg-white border border-gray-200">
                    <CardHeader>
                      <CardTitle>최근 리포트</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64">
                        <div className="space-y-2">
                          {reportAnalytics.recentReports.map((report) => (
                            <div key={report.reportId} className="flex items-center justify-between p-2 border-b">
                              <div>
                                <div className="font-medium">{report.userName}</div>
                                <div className="text-sm text-gray-600">{report.engineUsed}</div>
                              </div>
                              <div className="text-right text-sm">
                                <div>품질: {report.qualityScore}/100</div>
                                <div className="text-gray-600">{report.createdAt.toLocaleDateString()}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>기업을 선택하여 상세 분석을 확인하세요</p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 