import React, { useState } from 'react'
import { 
  Users as UsersIcon, 
  Activity, 
  Monitor
} from 'lucide-react'

// 기존 디바이스 관리 컴포넌트들 임포트
import DevicesSection from '../../OrganizationAdmin/Devices/DevicesSection'
import DeviceManagementHero from '../../OrganizationAdmin/Devices/components/DeviceManagementHero'

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Section - 사용자 관리 페이지와 동일한 스타일 */}
        <DeviceManagementHero 
          onDeviceAdded={() => console.log('Device added')}
          onExport={() => console.log('Export clicked')}
          onRefresh={() => console.log('Refresh clicked')}
        />

        {/* 탭 인터페이스 - 사용자 관리 페이지와 동일한 구조 */}
        <div className="space-y-6">
          {/* 탭 버튼들 */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-2">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setActiveTab('device-inventory')}
                className={`flex items-center gap-3 px-6 py-4 rounded-xl transition-all ${
                  activeTab === 'device-inventory'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Monitor className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">디바이스 현황</div>
                  <div className="text-xs opacity-80">디바이스 재고 및 상태</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('device-assignment')}
                className={`flex items-center gap-3 px-6 py-4 rounded-xl transition-all ${
                  activeTab === 'device-assignment'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <UsersIcon className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">디바이스 배치</div>
                  <div className="text-xs opacity-80">사용자별 디바이스 할당</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('device-monitoring')}
                className={`flex items-center gap-3 px-6 py-4 rounded-xl transition-all ${
                  activeTab === 'device-monitoring'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Activity className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">디바이스 모니터링</div>
                  <div className="text-xs opacity-80">실시간 상태 모니터링</div>
                </div>
              </button>
            </div>
          </div>

          {/* 탭 컨텐츠 */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            {activeTab === 'device-inventory' && (
              <DevicesSection 
                subSection="device-inventory"
                onNavigate={handleTabNavigation}
              />
            )}

            {activeTab === 'device-assignment' && (
              <DevicesSection 
                subSection="device-assignment"
                onNavigate={handleTabNavigation}
              />
            )}

            {activeTab === 'device-monitoring' && (
              <DevicesSection 
                subSection="device-monitoring"
                onNavigate={handleTabNavigation}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}