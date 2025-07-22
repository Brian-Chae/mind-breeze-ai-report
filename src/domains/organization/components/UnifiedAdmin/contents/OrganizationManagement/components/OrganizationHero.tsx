/**
 * 조직 Hero 섹션 컴포넌트
 * 
 * 조직 개요, 통계, 빠른 액션을 표시하는 상단 섹션
 * 시스템 관리자 페이지 스타일에 맞춰 디자인됨
 */

import React, { useState, useEffect } from 'react'
import { 
  Building2, 
  Users, 
  TrendingUp, 
  CreditCard,
  Upload,
  Edit2,
  Calendar,
  Globe,
  Mail,
  Phone,
  Network,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  RefreshCw,
  User,
  TrendingDown,
  Award,
  Shield
} from 'lucide-react'
import { Card } from '@ui/card'
import { Button } from '@ui/button'
import { Badge } from '@ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@ui/avatar'
import { toast } from 'sonner'
import organizationManagementService from '@domains/organization/services/management/OrganizationManagementService'
import type { Organization, OrganizationStats } from '@domains/organization/types/management/organization-management'

interface OrganizationHeroProps {
  organization: Organization
}

export default function OrganizationHero({ organization }: OrganizationHeroProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<OrganizationStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  // Load organization statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoadingStats(true)
        const orgStats = await organizationManagementService.getOrganizationStats(organization.id)
        setStats(orgStats)
      } catch (error) {
        console.error('Failed to load organization stats:', error)
        toast.error('통계 데이터를 불러오는데 실패했습니다.')
      } finally {
        setLoadingStats(false)
      }
    }

    loadStats()
  }, [organization.id])

  // Use real data from stats or fallback to organization data
  const totalMembers = stats?.totalMembers ?? organization.totalMembers ?? 0
  const activeMembers = stats?.activeMembers ?? organization.activeMembers ?? 0
  const totalDepartments = stats?.totalDepartments ?? organization.totalDepartments ?? 0
  const memberGrowthRate = Math.round(stats?.memberGrowthRate ?? 0)
  const activityRate = Math.round(stats?.activityRate ?? 0)

  // Calculate department growth (mock for now - could be enhanced later)
  const departmentGrowth = 2

  // Get organization size text
  const getSizeText = (size: string) => {
    switch (size) {
      case 'SMALL': return '소규모 (1-50명)'
      case 'MEDIUM': return '중간규모 (51-200명)'
      case 'LARGE': return '대규모 (201-1000명)'
      case 'ENTERPRISE': return '기업형 (1000명+)'
      default: return size
    }
  }

  // Get service package text and color
  const getPackageInfo = (pkg: string) => {
    switch (pkg) {
      case 'BASIC': return { text: 'Basic', color: 'text-blue-600 bg-blue-50' }
      case 'PREMIUM': return { text: 'Premium', color: 'text-purple-600 bg-purple-50' }
      case 'ENTERPRISE': return { text: 'Enterprise', color: 'text-orange-600 bg-orange-50' }
      default: return { text: pkg, color: 'text-slate-600 bg-slate-50' }
    }
  }

  // Get payment status info
  const getPaymentStatusInfo = (status: string) => {
    switch (status) {
      case 'ACTIVE': return { text: '활성', color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle }
      case 'TRIAL': return { text: '체험', color: 'text-blue-600 bg-blue-50', icon: Clock }
      case 'SUSPENDED': return { text: '정지', color: 'text-red-600 bg-red-50', icon: AlertTriangle }
      case 'TERMINATED': return { text: '종료', color: 'text-gray-600 bg-gray-50', icon: AlertTriangle }
      default: return { text: status, color: 'text-slate-600 bg-slate-50', icon: AlertTriangle }
    }
  }

  const handleQuickAction = (action: string) => {
    toast.info(`${action} 기능은 곧 추가될 예정입니다.`)
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
              <h3 className="text-lg font-semibold text-slate-900 mb-2">조직 정보 로드 중</h3>
              <p className="text-slate-600">잠시만 기다려주세요...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 조직 정보 헤더 */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {/* 상단 그라데이션 배경 */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                {organization.logoUrl ? (
                  <img src={organization.logoUrl} alt="Logo" className="w-12 h-12 rounded-lg" />
                ) : (
                  <Building2 className="w-10 h-10 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  {organization.organizationName}
                </h1>
                <p className="text-blue-100 text-lg mb-2">
                  {organization.industry} • {getSizeText(organization.size)}
                </p>
                <div className="flex items-center gap-4">
                  {organization.website && (
                    <div className="flex items-center gap-2 text-sm text-blue-100">
                      <Globe className="w-4 h-4" />
                      <a href={organization.website} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                        {organization.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-blue-100">
                    <Calendar className="w-4 h-4" />
                    설립: {organization.establishedDate ? new Date(organization.establishedDate.toDate()).toLocaleDateString() : '정보 없음'}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {(() => {
                const statusInfo = getPaymentStatusInfo(organization.paymentStatus)
                const StatusIcon = statusInfo.icon
                return (
                  <div className="flex items-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-sm rounded-lg">
                    <StatusIcon className="w-4 h-4 text-white" />
                    <span className="text-white font-medium">{statusInfo.text}</span>
                  </div>
                )
              })()}
              <Button variant="secondary" size="sm" onClick={() => handleQuickAction('정보 수정')} className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30">
                <Edit2 className="w-4 h-4 mr-2" />
                편집
              </Button>
            </div>
          </div>
        </div>

        {/* 하단 정보 섹션 */}
        <div className="px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 연락처 정보 */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">연락처 정보</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="w-4 h-4" />
                  {organization.contactEmail}
                </div>
                {organization.contactPhone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4" />
                    {organization.contactPhone}
                  </div>
                )}
                {organization.address && (
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <Building2 className="w-4 h-4 mt-0.5" />
                    <span className="leading-relaxed">{organization.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 서비스 정보 */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">서비스 정보</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">서비스 플랜:</span>
                  {(() => {
                    const packageInfo = getPackageInfo(organization.servicePackage)
                    return (
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${packageInfo.color}`}>
                        {packageInfo.text}
                      </span>
                    )
                  })()}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span>조직 코드:</span>
                  <code className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono">
                    {organization.organizationCode}
                  </code>
                </div>
                {organization.businessNumber && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span>사업자번호:</span>
                    <span>{organization.businessNumber}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 관리자 정보 */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">관리자 정보</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <User className="w-4 h-4" />
                  {organization.adminEmail}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="w-4 h-4" />
                  가입: {organization.createdAt ? new Date(organization.createdAt.toDate()).toLocaleDateString() : '정보 없음'}
                </div>
              </div>
            </div>
          </div>

          {/* 설명 */}
          {organization.description && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">기업 소개</h3>
              <p className="text-slate-600 leading-relaxed">{organization.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* 통계 섹션과 빠른 액션을 좌우로 배치 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* 통계 카드 섹션 (좌측 - 1/2 영역) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">주요 통계</h2>
                <p className="text-slate-600 mt-1">조직의 핵심 지표를 확인하세요</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-emerald-700">실시간 업데이트</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loadingStats ? (
                // 로딩 상태 표시
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="bg-slate-50 rounded-xl p-4 h-24 flex items-center justify-between animate-pulse">
                    <div className="flex-1">
                      <div className="h-4 bg-slate-200 rounded w-20 mb-2"></div>
                      <div className="h-6 bg-slate-200 rounded w-12 mb-1"></div>
                      <div className="h-3 bg-slate-200 rounded w-24"></div>
                    </div>
                    <div className="p-2 bg-slate-200 rounded-lg ml-3 w-9 h-9"></div>
                  </div>
                ))
              ) : (
                <>
                  <div className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors h-24 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-600">전체 구성원</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{totalMembers.toLocaleString()}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {memberGrowthRate >= 0 ? (
                          <TrendingUp className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-600" />
                        )}
                        <span className={`text-xs font-medium ${memberGrowthRate >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {memberGrowthRate >= 0 ? '+' : ''}{memberGrowthRate.toFixed(1)}%
                        </span>
                        <span className="text-xs text-slate-500">지난 달 대비</span>
                      </div>
                    </div>
                    <div className="p-2 bg-blue-100 rounded-lg ml-3">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors h-24 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-600">활성 구성원</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{activeMembers.toLocaleString()}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        <span className="text-xs text-emerald-600 font-medium">{activityRate}% 활성</span>
                        <span className="text-xs text-slate-500">전체 대비</span>
                      </div>
                    </div>
                    <div className="p-2 bg-emerald-100 rounded-lg ml-3">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors h-24 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-600">부서 수</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{totalDepartments.toLocaleString()}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Building2 className="w-3 h-3 text-blue-600" />
                        <span className="text-xs text-blue-600 font-medium">{stats?.activeDepartments || 0}개 활성</span>
                        <span className="text-xs text-slate-500">전체 대비</span>
                      </div>
                    </div>
                    <div className="p-2 bg-purple-100 rounded-lg ml-3">
                      <Building2 className="w-5 h-5 text-purple-600" />
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors h-24 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-600">서비스 플랜</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{getPackageInfo(organization.servicePackage).text}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Award className="w-3 h-3 text-orange-600" />
                        <span className="text-xs text-orange-600 font-medium">{getPaymentStatusInfo(organization.paymentStatus).text}</span>
                        <span className="text-xs text-slate-500">상태</span>
                      </div>
                    </div>
                    <div className="p-2 bg-orange-100 rounded-lg ml-3">
                      <CreditCard className="w-5 h-5 text-orange-600" />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 빠른 액션 섹션 (우측 - 1/2 영역) */}
        <div className="space-y-6">
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
                onClick={() => handleQuickAction('구성원 초대')}
              >
                <div className="flex-1 text-left">
                  <span className="font-semibold block">구성원 초대</span>
                  <p className="text-xs text-blue-100 mt-0.5">새로운 팀원 추가</p>
                </div>
                <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors ml-3">
                  <Users className="w-5 h-5" />
                </div>
              </button>
              
              <button 
                className="bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-xl p-4 h-24 flex items-center justify-between transition-all duration-200 group"
                onClick={() => handleQuickAction('부서 추가')}
              >
                <div className="flex-1 text-left">
                  <span className="font-semibold block">부서 추가</span>
                  <p className="text-xs text-slate-500 mt-0.5">조직 구조 확장</p>
                </div>
                <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors ml-3">
                  <Building2 className="w-5 h-5 text-slate-600" />
                </div>
              </button>
              
              <button 
                className="bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-xl p-4 h-24 flex items-center justify-between transition-all duration-200 group"
                onClick={() => handleQuickAction('조직도 보기')}
              >
                <div className="flex-1 text-left">
                  <span className="font-semibold block">조직도 보기</span>
                  <p className="text-xs text-slate-500 mt-0.5">계층 구조 확인</p>
                </div>
                <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors ml-3">
                  <Network className="w-5 h-5 text-slate-600" />
                </div>
              </button>
              
              <button 
                className="bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-xl p-4 h-24 flex items-center justify-between transition-all duration-200 group"
                onClick={() => handleQuickAction('정보 수정')}
              >
                <div className="flex-1 text-left">
                  <span className="font-semibold block">정보 수정</span>
                  <p className="text-xs text-slate-500 mt-0.5">기업 정보 관리</p>
                </div>
                <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors ml-3">
                  <Edit2 className="w-5 h-5 text-slate-600" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}