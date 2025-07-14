import React, { useState } from 'react'
import { 
  BarChart3, 
  Building2, 
  Users, 
  UserPlus, 
  Brain, 
  Smartphone,
  CreditCard,
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
  Calendar,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  Clock,
  Database,
  Mail,
  FileText,
  Monitor,
  CreditCard as CreditIcon,
  Download,
  Upload,
  Filter,
  RefreshCw
} from 'lucide-react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { Badge } from '../ui/badge'

// 섹션별 컴포넌트 import - 임시 주석 처리
// import DashboardSection from './Dashboard/DashboardSection'
// import OrganizationSection from './Organization/OrganizationSection'
// import MembersSection from './Members/MembersSection'
// import UsersSection from './Users/UsersSection'
// import AIReportSection from './AIReport/AIReportSection'
// import DevicesSection from './Devices/DevicesSection'
// import CreditsSection from './Credits/CreditsSection'

// 임시 Placeholder 컴포넌트들 - 서브섹션별로 다른 내용 표시
const DashboardSection = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">대시보드</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">전체 사용자</p>
            <p className="text-2xl font-bold">1,234</p>
          </div>
          <Users className="w-8 h-8 text-blue-500" />
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">활성 디바이스</p>
            <p className="text-2xl font-bold">86</p>
          </div>
          <Smartphone className="w-8 h-8 text-green-500" />
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">이번달 리포트</p>
            <p className="text-2xl font-bold">2,891</p>
          </div>
          <Brain className="w-8 h-8 text-purple-500" />
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">잔여 크레딧</p>
            <p className="text-2xl font-bold">15,420</p>
          </div>
          <CreditCard className="w-8 h-8 text-orange-500" />
        </div>
      </Card>
    </div>
  </div>
)

const OrganizationSection = ({ subSection }: { subSection: string }) => {
  const getContent = () => {
    switch (subSection) {
      case 'org-info':
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">기업 정보</h3>
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Building2 className="w-6 h-6 text-blue-500" />
                  <div>
                    <p className="font-medium">회사명</p>
                    <p className="text-gray-600">테크놀로지 주식회사</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Mail className="w-6 h-6 text-blue-500" />
                  <div>
                    <p className="font-medium">대표 이메일</p>
                    <p className="text-gray-600">contact@company.com</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Users className="w-6 h-6 text-blue-500" />
                  <div>
                    <p className="font-medium">전체 직원 수</p>
                    <p className="text-gray-600">1,234명</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )
      case 'org-departments':
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">조직 관리</h3>
            <div className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">연구개발부</p>
                    <p className="text-sm text-gray-600">85명</p>
                  </div>
                  <Badge>활성</Badge>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">인사부</p>
                    <p className="text-sm text-gray-600">12명</p>
                  </div>
                  <Badge>활성</Badge>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">영업부</p>
                    <p className="text-sm text-gray-600">35명</p>
                  </div>
                  <Badge>활성</Badge>
                </div>
              </Card>
            </div>
          </div>
        )
      case 'org-structure':
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">조직 구조</h3>
            <Card className="p-6">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <p className="text-gray-600">조직 구조도가 여기에 표시됩니다.</p>
              </div>
            </Card>
          </div>
        )
      default:
        return <p>기업 관리 메뉴를 선택하세요.</p>
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">기업 관리</h2>
      {getContent()}
    </div>
  )
}

const MembersSection = ({ subSection }: { subSection: string }) => {
  const getContent = () => {
    switch (subSection) {
      case 'member-list':
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">운영자 목록</h3>
            <div className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">김철수</p>
                      <p className="text-sm text-gray-600">시스템 관리자</p>
                    </div>
                  </div>
                  <Badge variant="secondary">활성</Badge>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">이영희</p>
                      <p className="text-sm text-gray-600">데이터 관리자</p>
                    </div>
                  </div>
                  <Badge variant="secondary">활성</Badge>
                </div>
              </Card>
            </div>
          </div>
        )
      case 'member-invite':
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">초대 관리</h3>
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Input placeholder="이메일 주소" />
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    초대
                  </Button>
                </div>
                <div className="text-center py-8">
                  <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">초대 내역이 여기에 표시됩니다.</p>
                </div>
              </div>
            </Card>
          </div>
        )
      case 'member-permissions':
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">권한 설정</h3>
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-blue-500" />
                    <span>시스템 관리자</span>
                  </div>
                  <Badge>전체 권한</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Eye className="w-5 h-5 text-green-500" />
                    <span>데이터 관리자</span>
                  </div>
                  <Badge variant="secondary">읽기 전용</Badge>
                </div>
              </div>
            </Card>
          </div>
        )
      default:
        return <p>운영자 관리 메뉴를 선택하세요.</p>
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">운영자 관리</h2>
      {getContent()}
    </div>
  )
}

const UsersSection = ({ subSection }: { subSection: string }) => {
  const getContent = () => {
    switch (subSection) {
      case 'user-list':
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">사용자 목록</h3>
            <div className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">박민수</p>
                      <p className="text-sm text-gray-600">연구원</p>
                    </div>
                  </div>
                  <Badge variant="outline">측정 완료</Badge>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">정지영</p>
                      <p className="text-sm text-gray-600">개발자</p>
                    </div>
                  </div>
                  <Badge variant="outline">측정 대기</Badge>
                </div>
              </Card>
            </div>
          </div>
        )
      case 'user-history':
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">측정 이력</h3>
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium">2024-01-15 09:30</p>
                    <p className="text-sm text-gray-600">박민수 - 뇌파 측정 완료</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium">2024-01-15 14:20</p>
                    <p className="text-sm text-gray-600">정지영 - 뇌파 측정 완료</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )
      case 'user-reports':
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">리포트 관리</h3>
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="font-medium">박민수 - 건강 리포트</p>
                      <p className="text-sm text-gray-600">2024-01-15</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    다운로드
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="font-medium">정지영 - 건강 리포트</p>
                      <p className="text-sm text-gray-600">2024-01-15</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    다운로드
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )
      default:
        return <p>사용자 관리 메뉴를 선택하세요.</p>
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">사용자 관리</h2>
      {getContent()}
    </div>
  )
}

const AIReportSection = ({ subSection }: { subSection: string }) => {
  const getContent = () => {
    switch (subSection) {
      case 'report-generation':
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">리포트 생성</h3>
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    새 리포트 생성
                  </Button>
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    데이터 업로드
                  </Button>
                </div>
                <div className="text-center py-8">
                  <Brain className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                  <p className="text-gray-600">AI 리포트 생성 기능이 여기에 표시됩니다.</p>
                </div>
              </div>
            </Card>
          </div>
        )
      case 'report-list':
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">리포트 목록</h3>
            <div className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Brain className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="font-medium">종합 건강 리포트</p>
                      <p className="text-sm text-gray-600">2024-01-15 생성</p>
                    </div>
                  </div>
                  <Badge variant="outline">완료</Badge>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Brain className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="font-medium">스트레스 분석 리포트</p>
                      <p className="text-sm text-gray-600">2024-01-14 생성</p>
                    </div>
                  </div>
                  <Badge variant="outline">완료</Badge>
                </div>
              </Card>
            </div>
          </div>
        )
      case 'report-quality':
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">품질 관리</h3>
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>리포트 품질 점수</span>
                  </div>
                  <Badge variant="outline">95%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    <span>생성 성공률</span>
                  </div>
                  <Badge variant="outline">98%</Badge>
                </div>
              </div>
            </Card>
          </div>
        )
      default:
        return <p>AI Report 메뉴를 선택하세요.</p>
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">AI Report</h2>
      {getContent()}
    </div>
  )
}

const DevicesSection = ({ subSection }: { subSection: string }) => {
  const getContent = () => {
    switch (subSection) {
      case 'device-inventory':
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">디바이스 현황</h3>
            <div className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium">LinkBand Pro #001</p>
                      <p className="text-sm text-gray-600">배터리: 85%</p>
                    </div>
                  </div>
                  <Badge variant="outline">온라인</Badge>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium">LinkBand Pro #002</p>
                      <p className="text-sm text-gray-600">배터리: 45%</p>
                    </div>
                  </div>
                  <Badge variant="destructive">오프라인</Badge>
                </div>
              </Card>
            </div>
          </div>
        )
      case 'device-assignment':
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">디바이스 배치</h3>
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium">연구개발부</p>
                      <p className="text-sm text-gray-600">15개 디바이스 배치</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">수정</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium">영업부</p>
                      <p className="text-sm text-gray-600">8개 디바이스 배치</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">수정</Button>
                </div>
              </div>
            </Card>
          </div>
        )
      case 'device-monitoring':
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">디바이스 모니터링</h3>
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Monitor className="w-5 h-5 text-blue-500" />
                    <span>실시간 모니터링</span>
                  </div>
                  <Badge variant="outline">활성</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span>알림 설정</span>
                  </div>
                  <Badge variant="outline">활성</Badge>
                </div>
              </div>
            </Card>
          </div>
        )
      default:
        return <p>디바이스 관리 메뉴를 선택하세요.</p>
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">디바이스 관리</h2>
      {getContent()}
    </div>
  )
}

const CreditsSection = ({ subSection }: { subSection: string }) => {
  const getContent = () => {
    switch (subSection) {
      case 'credit-dashboard':
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">크레딧 현황</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">잔여 크레딧</p>
                    <p className="text-2xl font-bold">15,420</p>
                  </div>
                  <CreditIcon className="w-8 h-8 text-orange-500" />
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">이번달 사용</p>
                    <p className="text-2xl font-bold">2,580</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-500" />
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">평균 사용량</p>
                    <p className="text-2xl font-bold">1,890</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-green-500" />
                </div>
              </Card>
            </div>
          </div>
        )
      case 'credit-history':
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">구매 내역</h3>
            <div className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium">2024-01-15</p>
                      <p className="text-sm text-gray-600">10,000 크레딧 구매</p>
                    </div>
                  </div>
                  <Badge variant="outline">완료</Badge>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium">2024-01-01</p>
                      <p className="text-sm text-gray-600">5,000 크레딧 구매</p>
                    </div>
                  </div>
                  <Badge variant="outline">완료</Badge>
                </div>
              </Card>
            </div>
          </div>
        )
      case 'credit-settings':
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">결제 설정</h3>
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CreditIcon className="w-5 h-5 text-blue-500" />
                    <span>자동 충전 설정</span>
                  </div>
                  <Button variant="outline" size="sm">설정</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Settings className="w-5 h-5 text-gray-500" />
                    <span>결제 방법</span>
                  </div>
                  <Button variant="outline" size="sm">변경</Button>
                </div>
              </div>
            </Card>
          </div>
        )
      default:
        return <p>크레딧 관리 메뉴를 선택하세요.</p>
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">크레딧 관리</h2>
      {getContent()}
    </div>
  )
}

interface SidebarMenuItem {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  children?: SidebarMenuItem[];
  badge?: number;
}

export default function OrganizationAdminApp() {
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
              <p className="text-xs font-medium text-gray-900">관리자</p>
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
            </div>
          </div>
        </header>

        {/* 메인 콘텐츠 영역 */}
        <main className="flex-1 p-6 text-gray-900 overflow-y-auto">
          {renderCurrentSection()}
        </main>
      </div>
    </div>
  )
} 