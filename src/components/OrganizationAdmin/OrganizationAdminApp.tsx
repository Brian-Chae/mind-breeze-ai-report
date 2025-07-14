import React, { useState } from 'react'
import { 
  BarChart3, 
  Building2, 
  Users, 
  UserPlus, 
  Brain, 
  Smartphone,
  CreditCard,
  Menu,
  X,
  Search,
  Bell,
  Settings,
  LogOut,
  User,
  ChevronRight,
  Shield,
  Activity,
  Eye,
  Plus,
  MoreHorizontal,
  DollarSign,
  Calendar
} from 'lucide-react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'

// 섹션별 컴포넌트 import
import DashboardSection from './Dashboard/DashboardSection'
import OrganizationSection from './Organization/OrganizationSection'
import MembersSection from './Members/MembersSection'
import UsersSection from './Users/UsersSection'
import AIReportSection from './AIReport/AIReportSection'
import DevicesSection from './Devices/DevicesSection'
import CreditsSection from './Credits/CreditsSection'

interface SidebarMenuItem {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  children?: SidebarMenuItem[];
  badge?: number;
}

export default function OrganizationAdminApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentSection, setCurrentSection] = useState('dashboard')
  const [currentSubSection, setCurrentSubSection] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // 사이드바 메뉴 구조
  const sidebarMenuItems: SidebarMenuItem[] = [
    {
      id: 'dashboard',
      title: '대시보드',
      icon: BarChart3,
      path: '/admin/dashboard'
    },
    {
      id: 'organization',
      title: '기업 관리',
      icon: Building2,
      path: '/admin/organization',
      children: [
        { id: 'org-info', title: '기업 정보', icon: Building2, path: '/admin/organization/info' },
        { id: 'org-departments', title: '조직 관리', icon: Users, path: '/admin/organization/departments' },
        { id: 'org-structure', title: '조직 구조', icon: BarChart3, path: '/admin/organization/structure' }
      ]
    },
    {
      id: 'members',
      title: '운영자 관리',
      icon: UserPlus,
      path: '/admin/members',
      children: [
        { id: 'member-list', title: '운영자 목록', icon: Users, path: '/admin/members/list' },
        { id: 'member-invite', title: '초대 관리', icon: UserPlus, path: '/admin/members/invite' },
        { id: 'member-permissions', title: '권한 설정', icon: Shield, path: '/admin/members/permissions' }
      ]
    },
    {
      id: 'users',
      title: '사용자 관리',
      icon: User,
      path: '/admin/users',
      children: [
        { id: 'user-list', title: '사용자 목록', icon: Users, path: '/admin/users/list' },
        { id: 'user-history', title: '측정 이력', icon: Activity, path: '/admin/users/history' },
        { id: 'user-reports', title: '리포트 관리', icon: Eye, path: '/admin/users/reports' }
      ]
    },
    {
      id: 'ai-report',
      title: 'AI Report',
      icon: Brain,
      path: '/admin/ai-report',
      children: [
        { id: 'report-generation', title: '리포트 생성', icon: Plus, path: '/admin/ai-report/generation' },
        { id: 'report-list', title: '리포트 목록', icon: Eye, path: '/admin/ai-report/list' },
        { id: 'report-quality', title: '품질 관리', icon: Shield, path: '/admin/ai-report/quality' }
      ]
    },
    {
      id: 'devices',
      title: '디바이스 관리',
      icon: Smartphone,
      path: '/admin/devices',
      children: [
        { id: 'device-inventory', title: '디바이스 현황', icon: Smartphone, path: '/admin/devices/inventory' },
        { id: 'device-assignment', title: '디바이스 배치', icon: Users, path: '/admin/devices/assignment' },
        { id: 'device-monitoring', title: '디바이스 모니터링', icon: Activity, path: '/admin/devices/monitoring' }
      ]
    },
    {
      id: 'credits',
      title: '크레딧 관리',
      icon: CreditCard,
      path: '/admin/credits',
      children: [
        { id: 'credit-dashboard', title: '크레딧 현황', icon: DollarSign, path: '/admin/credits/dashboard' },
        { id: 'credit-history', title: '구매 내역', icon: Calendar, path: '/admin/credits/history' },
        { id: 'credit-settings', title: '결제 설정', icon: Settings, path: '/admin/credits/settings' }
      ]
    }
  ]

  // 네비게이션 핸들러
  const handleNavigation = (sectionId: string, subSectionId?: string) => {
    setCurrentSection(sectionId)
    setCurrentSubSection(subSectionId || '')
    setSidebarOpen(false)
  }

  // 사이드바 메뉴 아이템 렌더링
  const renderSidebarItem = (item: SidebarMenuItem, level: number = 0) => {
    const isActive = currentSection === item.id
    const hasChildren = item.children && item.children.length > 0
    
    return (
      <div key={item.id} className={`${level > 0 ? 'ml-4' : ''}`}>
        <button
          onClick={() => handleNavigation(item.id)}
          className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
            isActive
              ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
            <span className="font-medium">{item.title}</span>
          </div>
          {hasChildren && (
            <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'rotate-90' : ''}`} />
          )}
        </button>
        {hasChildren && isActive && (
          <div className="mt-2 space-y-1">
            {item.children!.map((child) => (
              <button
                key={child.id}
                onClick={() => handleNavigation(item.id, child.id)}
                className={`w-full flex items-center space-x-3 p-2 ml-8 rounded-lg transition-colors text-sm ${
                  currentSubSection === child.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <child.icon className={`w-4 h-4 ${
                  currentSubSection === child.id ? 'text-blue-600' : 'text-gray-500'
                }`} />
                <span>{child.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // 현재 섹션 제목 가져오기
  const getCurrentSectionTitle = () => {
    const section = sidebarMenuItems.find(item => item.id === currentSection)
    if (!section) return '대시보드'
    
    if (currentSubSection) {
      const subSection = section.children?.find(child => child.id === currentSubSection)
      return subSection ? `${section.title} > ${subSection.title}` : section.title
    }
    
    return section.title
  }

  // 현재 섹션 컴포넌트 렌더링
  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'dashboard':
        return <DashboardSection />
      case 'organization':
        return <OrganizationSection subSection={currentSubSection} />
      case 'members':
        return <MembersSection subSection={currentSubSection} />
      case 'users':
        return <UsersSection subSection={currentSubSection} />
      case 'ai-report':
        return <AIReportSection subSection={currentSubSection} />
      case 'devices':
        return <DevicesSection subSection={currentSubSection} />
      case 'credits':
        return <CreditsSection subSection={currentSubSection} />
      default:
        return <DashboardSection />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* 사이드바 */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-xl">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">MIND BREEZE</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {sidebarMenuItems.map((item) => renderSidebarItem(item))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
            <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">관리자</p>
              <p className="text-xs text-gray-500">admin@company.com</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  설정
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LogOut className="w-4 h-4 mr-2" />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <div className="lg:ml-64">
        {/* 헤더 */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{getCurrentSectionTitle()}</h1>
                <p className="text-sm text-gray-600">MIND BREEZE AI 관리자 포털</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* 메인 콘텐츠 영역 */}
        <main className="p-6">
          {renderCurrentSection()}
        </main>
      </div>

      {/* 모바일 오버레이 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
} 