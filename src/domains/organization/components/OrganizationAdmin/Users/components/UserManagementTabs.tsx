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
      id: 'user-list',
      label: '사용자 목록',
      icon: Users,
      description: '측정 대상자 관리',
      badge: badges?.userList
    },
    {
      id: 'measurement-history',
      label: '측정 이력',
      icon: Activity,
      description: '측정 세션 및 데이터 관리',
      badge: badges?.measurementHistory
    },
    {
      id: 'report-management',
      label: '리포트 관리',
      icon: FileText,
      description: 'AI 분석 리포트 관리',
      badge: badges?.reportManagement
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              h-auto p-3 rounded-xl shadow-md border transition-all duration-200 group
              ${isActive 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-blue-500 shadow-lg transform scale-[1.02]' 
                : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-lg'
              }
            `}
          >
            <div className="flex items-center gap-3 pl-1">
              <div className={`
                p-1.5 rounded-lg transition-colors flex-shrink-0
                ${isActive 
                  ? 'bg-white/20 group-hover:bg-white/30' 
                  : 'bg-slate-100 group-hover:bg-slate-200'
                }
              `}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-600'}`} />
              </div>
              <div className="text-left flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{tab.label}</span>
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
                <p className={`
                  text-xs
                  ${isActive ? 'text-blue-100' : 'text-slate-500'}
                `}>
                  {tab.description}
                </p>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}