import React, { useState } from 'react'
import { Settings, Monitor, Database, Shield, Activity, BarChart3 } from 'lucide-react'

// Import existing system management components - temporarily commented out
// import SystemMonitoringContent from '../../../components/OrganizationAdmin/Dashboard/contents/SystemMonitoringContent'
// import SystemAnalyticsContent from '../../../components/OrganizationAdmin/Dashboard/contents/SystemAnalyticsContent'
// import MeasurementDataContent from '../../../components/OrganizationAdmin/Dashboard/contents/MeasurementDataContent'

// Temporary dummy components
const SystemMonitoringContent = () => (
  <div className="text-center py-12">
    <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    <p className="text-gray-500">시스템 모니터링 기능 준비 중입니다.</p>
  </div>
)

const SystemAnalyticsContent = () => (
  <div className="text-center py-12">
    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    <p className="text-gray-500">사용량 분석 기능 준비 중입니다.</p>
  </div>
)

const MeasurementDataContent = () => (
  <div className="text-center py-12">
    <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    <p className="text-gray-500">측정 데이터 관리 기능 준비 중입니다.</p>
  </div>
)

interface TabInfo {
  id: string
  label: string
  icon: React.ElementType
  component: React.ComponentType
}

const tabs: TabInfo[] = [
  {
    id: 'monitoring',
    label: '시스템 모니터링',
    icon: Monitor,
    component: SystemMonitoringContent
  },
  {
    id: 'analytics',
    label: '사용량 분석',
    icon: BarChart3,
    component: SystemAnalyticsContent
  },
  {
    id: 'data',
    label: '측정 데이터',
    icon: Database,
    component: MeasurementDataContent
  }
]

export function SystemPage() {
  const [activeTab, setActiveTab] = useState('monitoring')

  const activeTabInfo = tabs.find(tab => tab.id === activeTab)
  const ActiveComponent = activeTabInfo?.component

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">시스템 관리</h1>
            <p className="text-gray-600">
              전체 시스템 상태를 모니터링하고 관리합니다
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {ActiveComponent ? (
            <ActiveComponent />
          ) : (
            <div className="text-center py-12">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                시스템 관리 기능을 불러오는 중입니다...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}