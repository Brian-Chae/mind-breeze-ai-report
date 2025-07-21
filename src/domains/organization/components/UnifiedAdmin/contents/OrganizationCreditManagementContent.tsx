import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs'
import { 
  CreditCard, 
  DollarSign, 
  Calendar, 
  Settings
} from 'lucide-react'

// 기존 크레딧 관리 컴포넌트들 임포트
import CreditsSection from '../../OrganizationAdmin/Credits/CreditsSection'

/**
 * 통합 조직 크레딧 관리 콘텐츠
 * 크레딧 현황, 구매 내역, 결제 설정을 하나의 페이지로 통합
 */
export default function OrganizationCreditManagementContent() {
  const [activeTab, setActiveTab] = useState('credit-dashboard')

  const handleTabNavigation = (sectionId: string, subSectionId?: string) => {
    if (subSectionId) {
      setActiveTab(subSectionId)
    }
  }

  const tabs = [
    {
      id: 'credit-dashboard',
      label: '크레딧 현황',
      icon: DollarSign,
      description: '현재 크레딧 잔액 및 사용량'
    },
    {
      id: 'credit-history', 
      label: '구매 내역',
      icon: Calendar,
      description: '크레딧 구매 및 사용 이력'
    },
    {
      id: 'credit-settings',
      label: '결제 설정', 
      icon: Settings,
      description: '자동 결제 및 알림 설정'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 헤더 */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full mb-4">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">크레딧 관리</h1>
          <p className="text-lg text-slate-600">크레딧 현황 및 결제 관리</p>
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
              <TabsContent value="credit-dashboard">
                <CreditsSection 
                  subSection="credit-dashboard"
                  onNavigate={handleTabNavigation}
                />
              </TabsContent>

              <TabsContent value="credit-history">
                <CreditsSection 
                  subSection="credit-history"
                  onNavigate={handleTabNavigation}
                />
              </TabsContent>

              <TabsContent value="credit-settings">
                <CreditsSection 
                  subSection="credit-settings"
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