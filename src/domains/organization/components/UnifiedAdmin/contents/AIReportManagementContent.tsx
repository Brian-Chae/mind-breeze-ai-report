import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs'
import { 
  Brain, 
  Plus, 
  Eye, 
  Shield
} from 'lucide-react'

// 기존 AI 리포트 컴포넌트들 임포트
import AIReportSection from '../../OrganizationAdmin/AIReport/AIReportSection'

/**
 * 통합 AI 리포트 관리 콘텐츠
 * 리포트 생성, 목록, 측정 데이터를 하나의 페이지로 통합
 */
export default function AIReportManagementContent() {
  const [activeTab, setActiveTab] = useState('report-generation')

  const handleTabNavigation = (sectionId: string, subSectionId?: string) => {
    if (subSectionId) {
      setActiveTab(subSectionId)
    }
  }

  const tabs = [
    {
      id: 'report-generation',
      label: '리포트 생성',
      icon: Plus,
      description: 'AI 건강 리포트 생성'
    },
    {
      id: 'report-list', 
      label: '리포트 목록',
      icon: Eye,
      description: '생성된 리포트 조회'
    },
    {
      id: 'measurement-data',
      label: '측정 데이터 목록', 
      icon: Shield,
      description: '원본 측정 데이터 관리'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 헤더 */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">AI 리포트</h1>
          <p className="text-lg text-slate-600">AI 기반 건강 분석 리포트 생성 및 관리</p>
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
              <TabsContent value="report-generation">
                <AIReportSection 
                  subSection="report-generation"
                  onNavigate={handleTabNavigation}
                />
              </TabsContent>

              <TabsContent value="report-list">
                <AIReportSection 
                  subSection="report-list"
                  onNavigate={handleTabNavigation}
                />
              </TabsContent>

              <TabsContent value="measurement-data">
                <AIReportSection 
                  subSection="measurement-data"
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