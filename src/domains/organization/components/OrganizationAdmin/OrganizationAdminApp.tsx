import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { 
  BarChart3, 
  Users, 
  Settings, 
  CreditCard, 
  Brain, 
  Building, 
  Bell, 
  Search, 
  LogOut, 
  Shield, 
  Plus, 
  Monitor,
  FileText,
  Calendar,
  TrendingUp,
  CheckSquare,
  Target,
  Zap,
  AlertCircle,
  ChevronDown,
  Menu,
  X,
  User,
  Activity,
  Eye,
  DollarSign,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react'
import { Card } from '@shared/components/ui/card'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@shared/components/ui/dropdown-menu'
import { Badge } from '@shared/components/ui/badge'
import enterpriseAuthService from '@domains/organization/services/EnterpriseAuthService'
import { auth } from '@core/services/firebase'
import FirebaseService from '@core/services/FirebaseService'

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
  const location = useLocation()
  const navigate = useNavigate()
  const params = useParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [currentContext, setCurrentContext] = useState(() => enterpriseAuthService.getCurrentContext())

  // URL에서 현재 섹션과 서브섹션 추출
  const getCurrentSectionFromURL = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    if (pathSegments.length >= 2) {
      return pathSegments[1] // /admin/dashboard -> dashboard
    }
    return 'dashboard'
  }

  const getCurrentSubSectionFromURL = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    if (pathSegments.length >= 3) {
      return pathSegments[2] // /admin/users/list -> list
    }
    return params.subSection || ''
  }

  const currentSection = getCurrentSectionFromURL()
  const currentSubSection = getCurrentSubSectionFromURL()

  // 사용자 역할을 한국어로 변환하는 함수
  const getUserRoleName = (userType: string | undefined) => {
    switch (userType) {
      case 'ORGANIZATION_ADMIN':
        return '조직 관리자'
      case 'ORGANIZATION_MEMBER':
        return '조직 구성원'
      case 'INDIVIDUAL_USER':
        return '개인 사용자'
      default:
        return '관리자'
    }
  }

  // URL이 /admin으로만 되어있으면 /admin/dashboard로 리디렉션
  useEffect(() => {
    if (location.pathname === '/admin') {
      navigate('/admin/dashboard', { replace: true })
    }
  }, [location.pathname, navigate])

  useEffect(() => {
    // Firebase Auth 상태 확인
    const firebaseUser = auth.currentUser
    console.log('=== Firebase Auth 상태 ===')
    console.log('Firebase 사용자:', firebaseUser)
    console.log('Firebase UID:', firebaseUser?.uid)
    console.log('Firebase Email:', firebaseUser?.email)
    console.log('==========================')
    
    // 현재 사용자 권한 정보 디버깅
    const context = enterpriseAuthService.getCurrentContext()
    console.log('=== 현재 사용자 권한 정보 ===')
    console.log('사용자:', context.user)
    console.log('조직:', context.organization)
    console.log('권한 배열:', context.permissions)
    console.log('사용자 타입:', context.user?.userType)
    console.log('조직 ID:', context.user?.organizationId)
    console.log('measurement_users.view.all 권한:', enterpriseAuthService.hasPermission('measurement_users.view.all'))
    console.log('measurement_users.view.own 권한:', enterpriseAuthService.hasPermission('measurement_users.view.own'))
    console.log('==========================')
    
    // 사용자 정보가 없으면 잠시 후 다시 확인
    if (!context.user) {
      console.log('🔄 사용자 정보가 없습니다. 잠시 후 다시 확인합니다...')
      setTimeout(() => {
        const updatedContext = enterpriseAuthService.getCurrentContext()
        if (!updatedContext.user) {
          console.warn('⚠️ 사용자 정보를 불러올 수 없습니다. 페이지를 새로고침하거나 다시 로그인해주세요.')
        } else {
          console.log('✅ 사용자 정보 로드 완료:', updatedContext.user)
          setCurrentContext(updatedContext)
        }
      }, 2000)
    }
  }, [])

  // 사용자 정보 실시간 업데이트를 위한 useEffect
  useEffect(() => {
    const unsubscribe = enterpriseAuthService.onAuthStateChanged((context) => {
      console.log('🔄 Auth 상태 변경 감지:', context)
      setCurrentContext(context)
    })
    
    return () => unsubscribe()
  }, [])

  // 로그아웃 기능
  const handleLogout = async () => {
    try {
      await enterpriseAuthService.signOut()
      // 로그아웃 후 랜딩 페이지로 리디렉션
      window.location.href = '/'
    } catch (error) {
      console.error('로그아웃 실패:', error)
    }
  }

  // 권한 재설정 유틸리티 함수
  const resetUserPermissions = async () => {
    try {
      const currentContext = enterpriseAuthService.getCurrentContext()
      if (!currentContext.user) {
        console.error('현재 사용자가 없습니다.')
        return
      }

      console.log('🔄 사용자 권한 재설정 중...')
      
      // 조직 관리자 권한 재설정
      const adminPermissions = [
        'organization.manage',
        'organization.structure.edit',
        'members.manage',
        'credits.view',
        'credits.manage',
        'measurement_users.create',
        'measurement_users.view.all',
        'measurement_users.edit.all',
        'measurement_users.delete.all',
        'measurement_users.measure.all',
        'reports.view.all',
        'reports.generate.all',
        'reports.send.all',
        'metrics.view.all',
        'analytics.organization'
      ]

      // Firebase에서 사용자 권한 업데이트
      await FirebaseService.updateDocument('users', currentContext.user.id, {
        permissions: JSON.stringify(adminPermissions),
        userType: 'ORGANIZATION_ADMIN',
        updatedAt: new Date()
      })

      console.log('✅ 사용자 권한 재설정 완료')
      alert('권한이 재설정되었습니다. 페이지를 새로고침해주세요.')
      
    } catch (error) {
      console.error('❌ 권한 재설정 실패:', error)
      alert('권한 재설정에 실패했습니다.')
    }
  }

  // 사이드바 메뉴 항목들
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
      icon: Building,
      path: '/admin/organization',
      children: [
        { id: 'company-info', title: '기업 정보', icon: Building, path: '/admin/organization/company-info' },
        { id: 'departments', title: '조직 관리', icon: Users, path: '/admin/organization/departments' },
        { id: 'structure', title: '조직 구조', icon: Shield, path: '/admin/organization/structure' }
      ]
    },
    {
      id: 'members',
      title: '운영자 관리',
      icon: Users,
      path: '/admin/members',
      children: [
        { id: 'member-list', title: '운영자 목록', icon: Users, path: '/admin/members/member-list' },
        { id: 'member-invite', title: '초대 관리', icon: Plus, path: '/admin/members/member-invite' },
        { id: 'member-permissions', title: '권한 설정', icon: Shield, path: '/admin/members/member-permissions' }
      ]
    },
    {
      id: 'users',
      title: '사용자 관리',
      icon: User,
      path: '/admin/users',
      children: [
        { id: 'user-list', title: '사용자 목록', icon: Users, path: '/admin/users/user-list' },
        { id: 'user-history', title: '측정 이력', icon: Activity, path: '/admin/users/user-history' },
        { id: 'user-reports', title: '리포트 관리', icon: Eye, path: '/admin/users/user-reports' }
      ]
    },
    {
      id: 'ai-report',
      title: 'AI Report',
      icon: Brain,
      path: '/admin/ai-report',
      children: [
        { id: 'report-generation', title: '리포트 생성', icon: Plus, path: '/admin/ai-report/report-generation' },
        { id: 'report-list', title: '리포트 목록', icon: Eye, path: '/admin/ai-report/report-list' },
        { id: 'measurement-data', title: '측정 데이터 목록', icon: Shield, path: '/admin/ai-report/measurement-data' }
      ]
    },
    {
      id: 'devices',
      title: '디바이스 관리',
      icon: Monitor,
      path: '/admin/devices',
      children: [
        { id: 'device-inventory', title: '디바이스 현황', icon: Monitor, path: '/admin/devices/device-inventory' },
        { id: 'device-assignment', title: '디바이스 배치', icon: Users, path: '/admin/devices/device-assignment' },
        { id: 'device-monitoring', title: '디바이스 모니터링', icon: Activity, path: '/admin/devices/device-monitoring' }
      ]
    },
    {
      id: 'credits',
      title: '크레딧 관리',
      icon: CreditCard,
      path: '/admin/credits',
      children: [
        { id: 'credit-dashboard', title: '크레딧 현황', icon: DollarSign, path: '/admin/credits/credit-dashboard' },
        { id: 'credit-history', title: '구매 내역', icon: Calendar, path: '/admin/credits/credit-history' },
        { id: 'credit-settings', title: '결제 설정', icon: Settings, path: '/admin/credits/credit-settings' }
      ]
    }
  ]

  const handleNavigation = (sectionId: string, subSectionId?: string) => {
    if (subSectionId) {
      navigate(`/admin/${sectionId}/${subSectionId}`)
    } else {
      navigate(`/admin/${sectionId}`)
    }
  }

  const renderSidebarItem = (item: SidebarMenuItem, level: number = 0) => {
    const isActive = currentSection === item.id
    const hasChildren = item.children && item.children.length > 0
    
    return (
      <div key={item.id} className="mb-1">
        <div
          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
            isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
          }`}
          style={{ paddingLeft: `${8 + level * 16}px` }}
          onClick={() => handleNavigation(item.id)}
        >
          <div className="flex items-center space-x-2">
            <item.icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
            <span className="text-sm font-medium">{item.title}</span>
          </div>
          {hasChildren && (
            <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'rotate-90' : ''}`} />
          )}
          {item.badge && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {item.badge}
            </Badge>
          )}
        </div>
        
        {hasChildren && isActive && (
          <div className="mt-1 space-y-1">
            {item.children!.map((child) => (
              <div
                key={child.id}
                className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-colors ${
                  currentSubSection === child.id ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                }`}
                style={{ paddingLeft: `${24 + level * 16}px` }}
                onClick={() => handleNavigation(item.id, child.id)}
              >
                <child.icon className={`w-3 h-3 ${currentSubSection === child.id ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className="text-sm">{child.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const getCurrentSectionTitle = () => {
    const activeItem = sidebarMenuItems.find(item => item.id === currentSection)
    if (!activeItem) return '대시보드'
    
    if (currentSubSection && activeItem.children) {
      const activeChild = activeItem.children.find(child => child.id === currentSubSection)
      if (activeChild) {
        return `${activeItem.title} > ${activeChild.title}`
      }
    }
    
    return activeItem.title
  }

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'dashboard':
        return <DashboardSection />
      case 'organization':
        return <OrganizationSection subSection={currentSubSection} onNavigate={handleNavigation} />
      case 'members':
        return <MembersSection subSection={currentSubSection} onNavigate={handleNavigation} />
      case 'users':
        return <UsersSection subSection={currentSubSection} onNavigate={handleNavigation} />
      case 'ai-report':
        return <AIReportSection subSection={currentSubSection} onNavigate={handleNavigation} />
      case 'devices':
        return <DevicesSection subSection={currentSubSection} onNavigate={handleNavigation} />
      case 'credits':
        return <CreditsSection subSection={currentSubSection} onNavigate={handleNavigation} />
      default:
        return <DashboardSection />
    }
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* 사이드바 */}
      <aside className="w-56 bg-white shadow-xl border-r border-gray-200 flex flex-col">
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">MIND BREEZE</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sidebarMenuItems.map((item) => renderSidebarItem(item))}
        </nav>

        <div className="p-3 border-t border-gray-200">
          <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50">
            <div className="flex items-center justify-center w-6 h-6 bg-gray-200 rounded-full">
              <User className="w-3 h-3 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-900">
                {currentContext.user?.displayName || '사용자'} | {getUserRoleName(currentContext.user?.userType)}
              </p>
              <p className="text-xs text-gray-500">{currentContext.user?.email || '이메일 없음'}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={resetUserPermissions}>
                  <Shield className="w-4 h-4 mr-2" />
                  권한 재설정
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  설정
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 헤더 */}
        <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{getCurrentSectionTitle()}</h1>
                <p className="text-sm text-gray-700">MIND BREEZE AI 관리자 포털</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64 text-gray-900 placeholder-gray-500"
                />
              </div>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5 text-gray-700" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-5 h-5 text-gray-700" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* 메인 콘텐츠 영역 */}
        <main className="flex-1 text-gray-900 overflow-y-auto">
          {renderCurrentSection()}
        </main>
      </div>
    </div>
  )
} 