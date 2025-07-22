/**
 * 기업 관리 메인 컨테이너
 * 
 * 기업 정보, 조직 구조, 구성원, 권한 설정을 관리하는 통합 인터페이스
 */

import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs'
import { 
  Building2, 
  Users, 
  Network, 
  Shield,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import enterpriseAuthService from '@domains/organization/services/EnterpriseAuthService'
import organizationManagementService from '@domains/organization/services/management/OrganizationManagementService'
import type { Organization } from '@domains/organization/types/management/organization-management'

// Tab components (to be implemented)
import CompanyInfoTab from './tabs/CompanyInfoTab'
import OrganizationStructureTab from './tabs/OrganizationStructureTab'
import MemberManagementTab from './tabs/MemberManagementTab'
import PermissionSettingsTab from './tabs/PermissionSettingsTab'
import OrganizationHero from './components/OrganizationHero'

interface TabInfo {
  id: string
  label: string
  icon: React.ElementType
  description: string
  badge?: number
}

export default function OrganizationManagementContent() {
  const [activeTab, setActiveTab] = useState('company-info')
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get current organization context
  const currentContext = enterpriseAuthService.getCurrentContext()
  const organizationId = currentContext.organization?.id

  // Tab configuration with dynamic badges
  const tabs: TabInfo[] = [
    {
      id: 'company-info',
      label: '기업 정보',
      icon: Building2,
      description: '기업 기본 정보 관리'
    },
    {
      id: 'organization-structure', 
      label: '조직 구조',
      icon: Network,
      description: '부서 및 조직도 관리',
      badge: organization?.totalDepartments
    },
    {
      id: 'member-management',
      label: '구성원 관리', 
      icon: Users,
      description: '구성원 초대 및 관리',
      badge: organization?.totalMembers
    },
    {
      id: 'permission-settings',
      label: '권한 설정',
      icon: Shield,
      description: '역할 및 권한 관리'
    }
  ]

  // Load organization data
  useEffect(() => {
    const loadOrganizationData = async () => {
      if (!organizationId) {
        setError('조직 정보를 찾을 수 없습니다.')
        setLoading(false)
        return
      }

      try {
        const orgData = await organizationManagementService.getOrganization(organizationId)
        if (orgData) {
          setOrganization(orgData)
        } else {
          setError('조직 정보를 불러올 수 없습니다.')
        }
      } catch (err) {
        console.error('Failed to load organization:', err)
        setError('조직 정보 로딩 중 오류가 발생했습니다.')
        toast.error('조직 정보를 불러오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }

    loadOrganizationData()
  }, [organizationId])

  // Subscribe to real-time organization updates
  useEffect(() => {
    if (!organizationId) return

    const unsubscribe = organizationManagementService.subscribeToOrganizationChanges(
      organizationId,
      (updatedOrg) => {
        setOrganization(updatedOrg)
      }
    )

    return () => unsubscribe()
  }, [organizationId])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">조직 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !organization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">오류</h2>
          <p className="text-slate-600">{error || '조직 정보를 찾을 수 없습니다.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto space-y-8 p-6">
        {/* Hero Section */}
        <OrganizationHero organization={organization} />

        {/* 탭 인터페이스 */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-50 rounded-t-2xl p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center gap-3 px-6 py-4 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl transition-all relative"
                  >
                    <Icon className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium flex items-center gap-2">
                        {tab.label}
                        {tab.badge !== undefined && tab.badge > 0 && (
                          <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                            {tab.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 hidden sm:block">
                        {tab.description}
                      </div>
                    </div>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            <div className="p-6">
              <TabsContent value="company-info" className="mt-0">
                <CompanyInfoTab 
                  organization={organization} 
                  onUpdate={() => {
                    // Refresh will happen automatically via subscription
                  }}
                />
              </TabsContent>

              <TabsContent value="organization-structure" className="mt-0">
                <OrganizationStructureTab 
                  organizationId={organizationId!}
                />
              </TabsContent>

              <TabsContent value="member-management" className="mt-0">
                <MemberManagementTab 
                  organizationId={organizationId!}
                />
              </TabsContent>

              <TabsContent value="permission-settings" className="mt-0">
                <PermissionSettingsTab 
                  organizationId={organizationId!}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}