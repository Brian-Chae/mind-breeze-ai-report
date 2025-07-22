/**
 * 조직 Hero 섹션 컴포넌트
 * 
 * 조직 개요, 통계, 빠른 액션을 표시하는 상단 섹션
 * 시스템 관리자 페이지 스타일에 맞춰 디자인됨
 */

import React, { useState } from 'react'
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
  RefreshCw
} from 'lucide-react'
import { Card } from '@ui/card'
import { Button } from '@ui/button'
import { Badge } from '@ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@ui/avatar'
import { toast } from 'sonner'
import organizationManagementService from '@domains/organization/services/management/OrganizationManagementService'
import type { Organization } from '@domains/organization/types/management/organization-management'

interface OrganizationHeroProps {
  organization: Organization
}

export default function OrganizationHero({ organization }: OrganizationHeroProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  // Calculate activity rate
  const activityRate = organization.totalMembers > 0 
    ? Math.round((organization.activeMembers / organization.totalMembers) * 100)
    : 0

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
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {organization.name}
              </h1>
              <p className="text-lg text-slate-600 mb-3">
                {organization.description || '조직 설명이 없습니다'}
              </p>
              <div className="flex items-center gap-4">
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
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="w-4 h-4" />
                  설립: {organization.createdAt ? new Date(organization.createdAt).toLocaleDateString() : '정보 없음'}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-3 py-1">
              활성 상태
            </Badge>
            <Button variant="outline" size="sm" onClick={() => handleQuickAction('정보 수정')}>
              <Edit2 className="w-4 h-4 mr-2" />
              편집
            </Button>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">전체 구성원</p>
              <p className="text-2xl font-bold text-slate-900">{organization.totalMembers}</p>
              <p className="text-xs text-green-600">+12%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">활성 구성원</p>
              <p className="text-2xl font-bold text-slate-900">{organization.activeMembers}</p>
              <p className="text-xs text-green-600">+5%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">활성률</p>
              <p className="text-2xl font-bold text-slate-900">{activityRate}%</p>
              <p className="text-xs text-emerald-600">+5%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-xl">
              <CreditCard className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">서비스 플랜</p>
              <p className="text-2xl font-bold text-slate-900">Basic</p>
              <p className="text-xs text-slate-600">활성</p>
            </div>
          </div>
        </div>
      </div>

      {/* 빠른 액션 */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">빠른 액션</h2>
            <p className="text-slate-600 mt-1">자주 사용하는 작업을 빠르게 실행하세요</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md hover:from-blue-600 hover:to-purple-700 h-auto p-4"
            onClick={() => handleQuickAction('구성원 초대')}
          >
            <div className="flex flex-col items-center gap-2">
              <Users className="w-6 h-6" />
              <span className="font-medium">구성원 초대</span>
            </div>
          </Button>
          
          <Button 
            size="lg" 
            variant="outline" 
            className="h-auto p-4 hover:bg-slate-50"
            onClick={() => handleQuickAction('부서 추가')}
          >
            <div className="flex flex-col items-center gap-2">
              <Building2 className="w-6 h-6" />
              <span className="font-medium">부서 추가</span>
            </div>
          </Button>
          
          <Button 
            size="lg" 
            variant="outline" 
            className="h-auto p-4 hover:bg-slate-50"
            onClick={() => handleQuickAction('조직도 보기')}
          >
            <div className="flex flex-col items-center gap-2">
              <Network className="w-6 h-6" />
              <span className="font-medium">조직도 보기</span>
            </div>
          </Button>
          
          <Button 
            size="lg" 
            variant="outline" 
            className="h-auto p-4 hover:bg-slate-50"
            onClick={() => handleQuickAction('정보 수정')}
          >
            <div className="flex flex-col items-center gap-2">
              <Edit2 className="w-6 h-6" />
              <span className="font-medium">정보 수정</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  )
}