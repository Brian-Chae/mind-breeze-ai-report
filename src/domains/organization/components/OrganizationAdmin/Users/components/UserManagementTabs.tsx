/**
 * 사용자 관리 탭 컴포넌트
 * 
 * 사용자 관리 페이지의 탭 인터페이스를 제공하는 컴포넌트
 */

import React from 'react'
import { 
  Users, 
  Activity, 
  FileText
} from 'lucide-react'

interface TabInfo {
  id: string
  label: string
  icon: React.ElementType
  description: string
  badge?: number
}

interface UserManagementTabsProps {
  activeTab: string
  onTabChange: (tabId: string) => void
  badges?: {
    userList?: number
    measurementHistory?: number
    reportManagement?: number
  }
}

export default function UserManagementTabs({ 
  activeTab, 
  onTabChange,
  badges 
}: UserManagementTabsProps) {
  // Tab configuration
  const tabs: TabInfo[] = [
    {
      id: 'report-management',
      label: '리포트 관리',
      icon: FileText,
      description: 'AI 분석 리포트 관리',
      badge: badges?.reportManagement
    },
    {
      id: 'measurement-history',
      label: '측정 이력',
      icon: Activity,
      description: '측정 세션 및 데이터 관리',
      badge: badges?.measurementHistory
    },
    {
      id: 'user-list',
      label: '사용자 목록',
      icon: Users,
      description: '측정 대상자 관리',
      badge: badges?.userList
    }
  ]

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-2">
      <div className="grid grid-cols-3 gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-3 px-6 py-4 rounded-xl transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <div className="font-medium">{tab.label}</div>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={`
                      text-xs font-medium px-1.5 py-0.5 rounded-full
                      ${isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-blue-100 text-blue-700'
                      }
                    `}>
                      {tab.badge}
                    </span>
                  )}
                </div>
                <div className={`text-xs opacity-80 ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                  {tab.description}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}