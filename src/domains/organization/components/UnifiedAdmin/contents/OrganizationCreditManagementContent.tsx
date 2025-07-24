import React, { useState } from 'react'
import { 
  CreditCard, 
  DollarSign, 
  Calendar, 
  Settings
} from 'lucide-react'

// 기존 크레딧 관리 컴포넌트들 임포트
import CreditsSection from '../../OrganizationAdmin/Credits/CreditsSection'
import CreditManagementHero from '../../OrganizationAdmin/Credits/components/CreditManagementHero'

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Section - AI 리포트 페이지와 동일한 스타일 */}
        <CreditManagementHero 
          onPurchase={() => console.log('Purchase clicked')}
          onExport={() => console.log('Export clicked')}
          onRefresh={() => console.log('Refresh clicked')}
        />

        {/* 탭 인터페이스 - AI 리포트 페이지와 동일한 구조 */}
        <div className="space-y-6">
          {/* 탭 버튼들 */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-2">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setActiveTab('credit-dashboard')}
                className={`flex items-center gap-3 px-6 py-4 rounded-xl transition-all ${
                  activeTab === 'credit-dashboard'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <DollarSign className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">크레딧 현황</div>
                  <div className="text-xs opacity-80">현재 크레딧 잔액 및 사용량</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('credit-history')}
                className={`flex items-center gap-3 px-6 py-4 rounded-xl transition-all ${
                  activeTab === 'credit-history'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">구매 내역</div>
                  <div className="text-xs opacity-80">크레딧 구매 및 사용 이력</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('credit-settings')}
                className={`flex items-center gap-3 px-6 py-4 rounded-xl transition-all ${
                  activeTab === 'credit-settings'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Settings className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">결제 설정</div>
                  <div className="text-xs opacity-80">자동 결제 및 알림 설정</div>
                </div>
              </button>
            </div>
          </div>

          {/* 탭 컨텐츠 */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            {activeTab === 'credit-dashboard' && (
              <CreditsSection 
                subSection="credit-dashboard"
                onNavigate={handleTabNavigation}
              />
            )}

            {activeTab === 'credit-history' && (
              <CreditsSection 
                subSection="credit-history"
                onNavigate={handleTabNavigation}
              />
            )}

            {activeTab === 'credit-settings' && (
              <CreditsSection 
                subSection="credit-settings"
                onNavigate={handleTabNavigation}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}