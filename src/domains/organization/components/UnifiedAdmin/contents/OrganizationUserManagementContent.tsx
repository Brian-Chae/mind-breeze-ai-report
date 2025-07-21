import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs'
import { 
  Users, 
  Activity, 
  Eye, 
  UserPlus,
  FileText
} from 'lucide-react'

// 기존 사용자 관리 컴포넌트들 임포트
import UsersSection from '../../OrganizationAdmin/Users/UsersSection'
import MembersSection from '../../OrganizationAdmin/Members/MembersSection'
import AIReportSection from '../../OrganizationAdmin/AIReport/AIReportSection'

/**
 * 통합 조직 사용자 관리 콘텐츠
 * 사용자 목록, 측정 이력, 리포트 관리를 하나의 페이지로 통합
 */
export default function OrganizationUserManagementContent() {
  const [activeTab, setActiveTab] = useState('user-list')

  const handleTabNavigation = (sectionId: string, subSectionId?: string) => {
    if (subSectionId) {
      setActiveTab(subSectionId)
    }
  }

  const tabs = [
    {
      id: 'user-list',
      label: '사용자 목록',
      icon: Users,
      description: '조직 내 사용자 관리'
    },
    {
      id: 'user-history', 
      label: '측정 이력',
      icon: Activity,
      description: '사용자별 측정 기록'
    },
    {
      id: 'user-reports',
      label: '리포트 관리', 
      icon: FileText,
      description: 'AI 리포트 조회'
    },
    {
      id: 'member-management',
      label: '운영자 관리',
      icon: UserPlus,
      description: '운영자 및 초대 관리'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 헤더 */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">사용자 관리</h1>
          <p className="text-lg text-slate-600">조직 구성원 및 사용자 관리</p>
        </div>

        {/* 통합 탭 인터페이스 */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-50 rounded-t-2xl p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl transition-all"
                  >
                    <Icon className="w-4 h-4" />
                    <div className="text-left">
                      <div className="font-medium text-sm">{tab.label}</div>
                      <div className="text-xs text-slate-500 hidden lg:block">
                        {tab.description}
                      </div>
                    </div>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {/* 각 탭의 콘텐츠 */}
            <div className="p-6">
              <TabsContent value="user-list">
                <UsersSection 
                  subSection="user-list"
                  onNavigate={handleTabNavigation}
                />
              </TabsContent>

              <TabsContent value="user-history">
                <UsersSection 
                  subSection="user-history"
                  onNavigate={handleTabNavigation}
                />
              </TabsContent>

              <TabsContent value="user-reports">
                <UsersSection 
                  subSection="user-reports"
                  onNavigate={handleTabNavigation}
                />
              </TabsContent>

              <TabsContent value="member-management">
                <MembersSection 
                  subSection="member-list"
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