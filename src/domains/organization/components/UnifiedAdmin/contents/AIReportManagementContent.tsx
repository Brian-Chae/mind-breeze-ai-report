import React, { useState } from 'react'
import { 
  Brain, 
  Plus, 
  Eye, 
  Shield
} from 'lucide-react'

// 기존 AI 리포트 컴포넌트들 임포트
import AIReportSection from '../../OrganizationAdmin/AIReport/AIReportSection'
import AIReportHero from '../../OrganizationAdmin/AIReport/components/AIReportHero'

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Section - 디바이스 관리 페이지와 동일한 스타일 */}
        <AIReportHero 
          onReportGenerated={() => console.log('Report generated')}
          onExport={() => console.log('Export clicked')}
          onRefresh={() => console.log('Refresh clicked')}
        />

        {/* 탭 인터페이스 - 디바이스 관리 페이지와 동일한 구조 */}
        <div className="space-y-6">
          {/* 탭 버튼들 */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-2">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setActiveTab('report-generation')}
                className={`flex items-center gap-3 px-6 py-4 rounded-xl transition-all ${
                  activeTab === 'report-generation'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Plus className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">리포트 생성</div>
                  <div className="text-xs opacity-80">AI 건강 리포트 생성</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('report-list')}
                className={`flex items-center gap-3 px-6 py-4 rounded-xl transition-all ${
                  activeTab === 'report-list'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Eye className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">리포트 목록</div>
                  <div className="text-xs opacity-80">생성된 리포트 조회</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('measurement-data')}
                className={`flex items-center gap-3 px-6 py-4 rounded-xl transition-all ${
                  activeTab === 'measurement-data'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Shield className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">측정 데이터 목록</div>
                  <div className="text-xs opacity-80">원본 측정 데이터 관리</div>
                </div>
              </button>
            </div>
          </div>

          {/* 탭 컨텐츠 */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            {activeTab === 'report-generation' && (
              <AIReportSection 
                subSection="report-generation"
                onNavigate={handleTabNavigation}
              />
            )}

            {activeTab === 'report-list' && (
              <AIReportSection 
                subSection="report-list"
                onNavigate={handleTabNavigation}
              />
            )}

            {activeTab === 'measurement-data' && (
              <AIReportSection 
                subSection="measurement-data"
                onNavigate={handleTabNavigation}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}