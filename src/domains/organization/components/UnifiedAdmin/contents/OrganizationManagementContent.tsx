import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs'
import { Button } from '@shared/components/ui/button'
import { Badge } from '@shared/components/ui/badge'
import { 
  Building2, 
  Users, 
  Shield, 
  Settings 
} from 'lucide-react'

// 기존 조직 관리 컴포넌트들 임포트
import OrganizationSection from '../../OrganizationAdmin/Organization/OrganizationSection'

/**
 * 통합 조직 관리 콘텐츠
 * 기업 정보, 조직 관리, 조직 구조를 하나의 페이지로 통합
 */
export default function OrganizationManagementContent() {
  const [activeTab, setActiveTab] = useState('company-info')

  const handleTabNavigation = (sectionId: string, subSectionId?: string) => {
    if (subSectionId) {
      setActiveTab(subSectionId)
    }
  }

  const tabs = [
    {
      id: 'company-info',
      label: '기업 정보',
      icon: Building2,
      description: '기업 기본 정보 관리'
    },
    {
      id: 'departments', 
      label: '조직 관리',
      icon: Users,
      description: '부서 및 조직도 관리'
    },
    {
      id: 'structure',
      label: '조직 구조', 
      icon: Shield,
      description: '권한 및 구조 설정'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 헤더 */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">기업 관리</h1>
          <p className="text-lg text-slate-600">기업 정보 및 조직 구조 관리</p>
        </div>

        {/* 통합 탭 인터페이스 */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-50 rounded-t-2xl p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center gap-3 px-6 py-4 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl transition-all"
                  >
                    <Icon className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">{tab.label}</div>
                      <div className="text-xs text-slate-500 hidden sm:block">
                        {tab.description}
                      </div>
                    </div>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {/* 각 탭의 콘텐츠 */}
            <div className="p-6">
              <TabsContent value="company-info">
                <OrganizationSection 
                  subSection="company-info"
                  onNavigate={handleTabNavigation}
                />
              </TabsContent>

              <TabsContent value="departments">
                <OrganizationSection 
                  subSection="departments"
                  onNavigate={handleTabNavigation}
                />
              </TabsContent>

              <TabsContent value="structure">
                <OrganizationSection 
                  subSection="structure"
                  onNavigate={handleTabNavigation}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}