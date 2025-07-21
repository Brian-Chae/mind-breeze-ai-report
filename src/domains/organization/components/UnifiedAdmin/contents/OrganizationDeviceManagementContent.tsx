import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs'
import { 
  Smartphone, 
  Users as UsersIcon, 
  Activity, 
  Monitor
} from 'lucide-react'

// 기존 디바이스 관리 컴포넌트들 임포트
import DevicesSection from '../../OrganizationAdmin/Devices/DevicesSection'

/**
 * 통합 조직 디바이스 관리 콘텐츠
 * 디바이스 현황, 배치, 모니터링을 하나의 페이지로 통합
 */
export default function OrganizationDeviceManagementContent() {
  const [activeTab, setActiveTab] = useState('device-inventory')

  const handleTabNavigation = (sectionId: string, subSectionId?: string) => {
    if (subSectionId) {
      setActiveTab(subSectionId)
    }
  }

  const tabs = [
    {
      id: 'device-inventory',
      label: '디바이스 현황',
      icon: Monitor,
      description: '디바이스 재고 및 상태'
    },
    {
      id: 'device-assignment', 
      label: '디바이스 배치',
      icon: UsersIcon,
      description: '사용자별 디바이스 할당'
    },
    {
      id: 'device-monitoring',
      label: '디바이스 모니터링', 
      icon: Activity,
      description: '실시간 상태 모니터링'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 헤더 */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-full mb-4">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">디바이스 관리</h1>
          <p className="text-lg text-slate-600">LINK BAND 디바이스 배치 및 모니터링</p>
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
              <TabsContent value="device-inventory">
                <DevicesSection 
                  subSection="device-inventory"
                  onNavigate={handleTabNavigation}
                />
              </TabsContent>

              <TabsContent value="device-assignment">
                <DevicesSection 
                  subSection="device-assignment"
                  onNavigate={handleTabNavigation}
                />
              </TabsContent>

              <TabsContent value="device-monitoring">
                <DevicesSection 
                  subSection="device-monitoring"
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