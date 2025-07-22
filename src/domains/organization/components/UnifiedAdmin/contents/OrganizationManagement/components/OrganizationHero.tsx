/**
 * 조직 Hero 섹션 컴포넌트
 * 
 * 조직 개요, 통계, 빠른 액션을 표시하는 상단 섹션
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
  Network
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

interface StatCard {
  label: string
  value: string | number
  icon: React.ElementType
  trend?: string | null
  color?: string
}

export default function OrganizationHero({ organization }: OrganizationHeroProps) {
  const [uploadingLogo, setUploadingLogo] = useState(false)
  

  // Calculate activity rate
  const activityRate = organization.totalMembers > 0 
    ? Math.round((organization.activeMembers / organization.totalMembers) * 100)
    : 0

  // Stats configuration
  const stats: StatCard[] = [
    { 
      label: '전체 구성원', 
      value: `${organization.totalMembers}명`, 
      icon: Users, 
      trend: '+12%',
      color: 'text-blue-600'
    },
    { 
      label: '부서', 
      value: `${organization.totalDepartments}개`, 
      icon: Building2, 
      trend: '+2',
      color: 'text-green-600'
    },
    { 
      label: '활성률', 
      value: `${activityRate}%`, 
      icon: TrendingUp, 
      trend: '+5%',
      color: 'text-purple-600'
    },
    { 
      label: '서비스 플랜', 
      value: getServicePackageLabel(organization.servicePackage), 
      icon: CreditCard, 
      trend: null,
      color: 'text-orange-600'
    }
  ]

  // Handle logo upload
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    try {
      const logoUrl = await organizationManagementService.uploadOrganizationLogo(
        organization.id,
        file
      )
      
      toast({
        title: '성공',
        description: '로고가 성공적으로 업로드되었습니다.'
      })
    } catch (error) {
      console.error('Logo upload failed:', error)
      toast({
        title: '오류',
        description: '로고 업로드에 실패했습니다.',
        variant: 'destructive'
      })
    } finally {
      setUploadingLogo(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Organization Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Logo */}
          <div className="relative group">
            <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
              {organization.logoUrl ? (
                <AvatarImage src={organization.logoUrl} alt={organization.organizationName} />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white text-2xl">
                  <Building2 className="w-12 h-12" />
                </AvatarFallback>
              )}
            </Avatar>
            <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
                className="hidden"
              />
              <Upload className="w-6 h-6 text-white" />
            </label>
          </div>

          {/* Organization Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  {organization.organizationName}
                </h1>
                <p className="text-lg text-slate-600 mb-4">
                  {organization.description || organization.industry}
                </p>
                
                {/* Organization Details */}
                <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                  {organization.establishedDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>설립 {new Date(organization.establishedDate.toDate()).getFullYear()}년</span>
                    </div>
                  )}
                  {organization.website && (
                    <div className="flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      <a href={organization.website} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-600 hover:underline">
                        {organization.website}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    <span>{organization.contactEmail}</span>
                  </div>
                  {organization.contactPhone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      <span>{organization.contactPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-col gap-2">
                <Badge 
                  variant={organization.paymentStatus === 'ACTIVE' ? 'default' : 'secondary'}
                  className="self-end"
                >
                  {getPaymentStatusLabel(organization.paymentStatus)}
                </Badge>
                <Badge 
                  variant="outline" 
                  className="self-end"
                >
                  {getSizeLabel(organization.size)}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-slate-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  {stat.trend && (
                    <p className="text-sm text-green-600 font-medium">{stat.trend}</p>
                  )}
                </div>
                <div className={`p-3 rounded-lg bg-slate-50 ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap justify-center gap-4">
        <Button size="lg" className="gap-2">
          <Users className="w-4 h-4" />
          구성원 초대
        </Button>
        <Button size="lg" variant="outline" className="gap-2">
          <Building2 className="w-4 h-4" />
          부서 추가
        </Button>
        <Button size="lg" variant="outline" className="gap-2">
          <Network className="w-4 h-4" />
          조직도 보기
        </Button>
        <Button size="lg" variant="outline" className="gap-2">
          <Edit2 className="w-4 h-4" />
          정보 수정
        </Button>
      </div>
    </div>
  )
}

// Helper functions
function getServicePackageLabel(packageType: string): string {
  const packages: Record<string, string> = {
    'BASIC': 'Basic',
    'PREMIUM': 'Premium',
    'ENTERPRISE': 'Enterprise'
  }
  return packages[packageType] || packageType
}

function getPaymentStatusLabel(status: string): string {
  const statuses: Record<string, string> = {
    'ACTIVE': '활성',
    'TRIAL': '체험판',
    'SUSPENDED': '일시정지',
    'TERMINATED': '종료'
  }
  return statuses[status] || status
}

function getSizeLabel(size: string): string {
  const sizes: Record<string, string> = {
    'SMALL': '소규모 (1-50명)',
    'MEDIUM': '중규모 (51-200명)',
    'LARGE': '대규모 (201-1000명)',
    'ENTERPRISE': '엔터프라이즈 (1000명+)'
  }
  return sizes[size] || size
}