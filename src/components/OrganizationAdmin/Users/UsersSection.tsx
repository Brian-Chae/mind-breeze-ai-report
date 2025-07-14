import React, { useState, useEffect } from 'react'
import {
  User,
  Users,
  Activity,
  Calendar,
  Clock,
  Brain,
  FileText,
  Download,
  Eye,
  Send,
  Mail,
  Phone,
  MapPin,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { Card } from '../../ui/card'
import { Button } from '../../ui/button'
import { Badge } from '../../ui/badge'
import { Input } from '../../ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown-menu'

// Firebase 서비스 import
import measurementUserManagementService, { MeasurementUser as FirebaseMeasurementUser, MeasurementUserStats } from '../../../services/MeasurementUserManagementService'
import enterpriseAuthService from '../../../services/EnterpriseAuthService'

interface UsersSectionProps {
  subSection: string;
}

interface MeasurementUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: 'male' | 'female';
  department: string;
  joinDate: string;
  lastMeasurement: string;
  measurementCount: number;
  reportCount: number;
  status: 'active' | 'inactive' | 'pending';
}

interface MeasurementSession {
  id: string;
  userId: string;
  userName: string;
  startTime: string;
  endTime: string;
  duration: number;
  deviceId: string;
  deviceType: string;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  dataSize: number;
  notes: string;
  status: 'completed' | 'failed' | 'processing';
}

interface UserReport {
  id: string;
  userId: string;
  userName: string;
  title: string;
  type: 'stress' | 'focus' | 'wellness' | 'comprehensive';
  createdAt: string;
  status: 'generated' | 'processing' | 'failed';
  quality: number;
  sentTo: string[];
  downloadCount: number;
}

export default function UsersSection({ subSection }: UsersSectionProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedDateRange, setSelectedDateRange] = useState('7d')

  // 실제 데이터 상태
  const [firebaseUsers, setFirebaseUsers] = useState<FirebaseMeasurementUser[]>([])
  const [users, setUsers] = useState<MeasurementUser[]>([])
  const [userStats, setUserStats] = useState<MeasurementUserStats | null>(null)

  // 데이터 로드
  useEffect(() => {
    loadUsersData()
  }, [subSection])

  const loadUsersData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 현재 사용자 정보 가져오기
      const currentContext = enterpriseAuthService.getCurrentContext()
      if (!currentContext.user) {
        setError('로그인 정보가 없습니다.')
        return
      }

      const organizationId = currentContext.user.organizationId

      if (!organizationId) {
        setError('조직 정보를 찾을 수 없습니다.')
        return
      }

      // 현재 사용자의 권한 정보 확인
      console.log('현재 사용자 권한:', currentContext.permissions)
      console.log('사용자 타입:', currentContext.user.userType)
      console.log('조직 ID:', organizationId)

      // 권한이 있는 경우에만 사용자 데이터 로드
      let usersData: FirebaseMeasurementUser[] = []
      let statsData: MeasurementUserStats | null = null

      if (enterpriseAuthService.hasPermission('measurement_users.view.all') || 
          enterpriseAuthService.hasPermission('measurement_users.view.own')) {
        try {
          // 병렬로 데이터 로드
          [usersData, statsData] = await Promise.all([
            measurementUserManagementService.getMeasurementUsers({ organizationId }),
            measurementUserManagementService.getMeasurementUserStats()
          ])
        } catch (err) {
          console.warn('사용자 데이터 로드 실패:', err)
          // 빈 데이터로 계속 진행
        }
      } else {
        console.warn('측정 대상자 조회 권한이 없습니다.')
      }

      setFirebaseUsers(usersData)
      setUserStats(statsData)

      // Firebase 데이터를 UI 인터페이스로 변환
      const convertedUsers: MeasurementUser[] = usersData.map(user => ({
        id: user.id,
        name: user.displayName,
        email: user.email,
        phone: user.phone || '',
        age: user.age || 0,
        gender: user.gender === 'MALE' ? 'male' : user.gender === 'FEMALE' ? 'female' : 'male',
        department: '미지정', // Firebase 데이터에 부서 정보 없음
        joinDate: user.createdAt?.toLocaleDateString() || '',
        lastMeasurement: user.lastMeasurementDate?.toLocaleDateString() || '측정 기록 없음',
        measurementCount: user.measurementCount,
        reportCount: user.reportIds?.length || 0,
        status: user.isActive ? 'active' : 'inactive'
      }))

      setUsers(convertedUsers)

    } catch (err) {
      console.error('사용자 데이터 로드 오류:', err)
      setError('사용자 데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 로딩 중일 때
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">사용자 데이터를 불러오는 중...</span>
      </div>
    )
  }

  // 오류 발생 시
  if (error) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">오류 발생</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={loadUsersData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          다시 시도
        </Button>
      </div>
    )
  }

  // 측정 사용자 데이터
  const [sessions, setSessions] = useState<MeasurementSession[]>([
    {
      id: '1',
      userId: '1',
      userName: '김건강',
      startTime: '2024-01-15 14:30:00',
      endTime: '2024-01-15 14:45:00',
      duration: 15,
      deviceId: 'LB001',
      deviceType: 'LinkBand Pro',
      quality: 'excellent',
      dataSize: 2.4,
      notes: '정상적인 측정 완료',
      status: 'completed'
    },
    {
      id: '2',
      userId: '2',
      userName: '이스트레스',
      startTime: '2024-01-14 09:15:00',
      endTime: '2024-01-14 09:30:00',
      duration: 15,
      deviceId: 'LB002',
      deviceType: 'LinkBand Pro',
      quality: 'good',
      dataSize: 2.1,
      notes: '약간의 노이즈 있음',
      status: 'completed'
    },
    {
      id: '3',
      userId: '3',
      userName: '박집중',
      startTime: '2024-01-12 16:45:00',
      endTime: '2024-01-12 17:00:00',
      duration: 15,
      deviceId: 'LB003',
      deviceType: 'LinkBand Pro',
      quality: 'fair',
      dataSize: 1.8,
      notes: '연결 불안정',
      status: 'completed'
    },
    {
      id: '4',
      userId: '4',
      userName: '정웰니스',
      startTime: '2024-01-10 11:20:00',
      endTime: '2024-01-10 11:35:00',
      duration: 15,
      deviceId: 'LB004',
      deviceType: 'LinkBand Pro',
      quality: 'poor',
      dataSize: 1.2,
      notes: '측정 중 연결 끊김',
      status: 'failed'
    }
  ])

  // 사용자 리포트 데이터
  const [reports, setReports] = useState<UserReport[]>([
    {
      id: '1',
      userId: '1',
      userName: '김건강',
      title: '스트레스 관리 분석 리포트',
      type: 'stress',
      createdAt: '2024-01-15 15:00:00',
      status: 'generated',
      quality: 92,
      sentTo: ['kim.health@company.com'],
      downloadCount: 3
    },
    {
      id: '2',
      userId: '2',
      userName: '이스트레스',
      title: '집중력 향상 분석 리포트',
      type: 'focus',
      createdAt: '2024-01-14 10:30:00',
      status: 'generated',
      quality: 87,
      sentTo: ['lee.stress@company.com', 'manager@company.com'],
      downloadCount: 5
    },
    {
      id: '3',
      userId: '3',
      userName: '박집중',
      title: '종합 웰니스 리포트',
      type: 'comprehensive',
      createdAt: '2024-01-12 18:00:00',
      status: 'generated',
      quality: 95,
      sentTo: ['park.focus@company.com'],
      downloadCount: 2
    },
    {
      id: '4',
      userId: '4',
      userName: '정웰니스',
      title: '웰니스 상태 분석',
      type: 'wellness',
      createdAt: '2024-01-10 12:00:00',
      status: 'processing',
      quality: 0,
      sentTo: [],
      downloadCount: 0
    }
  ])

  // 사용자 목록 렌더링
  const renderUserList = () => {
    const filteredUsers = users.filter(user => 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'active': return 'bg-green-100 text-green-600'
        case 'inactive': return 'bg-gray-100 text-gray-600'
        case 'pending': return 'bg-yellow-100 text-yellow-600'
        default: return 'bg-gray-100 text-gray-600'
      }
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">사용자 목록</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              내보내기
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              사용자 추가
            </Button>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="이름, 이메일, 부서로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={selectedDateRange}
            onChange={(e) => setSelectedDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="7d">최근 7일</option>
            <option value="30d">최근 30일</option>
            <option value="90d">최근 90일</option>
            <option value="all">전체</option>
          </select>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            필터
          </Button>
        </div>

        {/* 사용자 목록 */}
        <div className="grid grid-cols-1 gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-sm text-gray-600">{user.department} • {user.age}세 • {user.gender === 'male' ? '남성' : '여성'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Badge className={getStatusColor(user.status)}>
                    {user.status === 'active' ? '활성' : user.status === 'inactive' ? '비활성' : '대기'}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="w-4 h-4 mr-2" />
                        상세 보기
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        수정
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Brain className="w-4 h-4 mr-2" />
                        리포트 생성
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Mail className="w-4 h-4 mr-2" />
                        메일 발송
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">가입: {user.joinDate}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">최근 측정: {user.lastMeasurement}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">측정 횟수: {user.measurementCount}회</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">리포트: {user.reportCount}개</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // 측정 이력 렌더링
  const renderMeasurementHistory = () => {
    const getQualityColor = (quality: string) => {
      switch (quality) {
        case 'excellent': return 'bg-green-100 text-green-600'
        case 'good': return 'bg-blue-100 text-blue-600'
        case 'fair': return 'bg-yellow-100 text-yellow-600'
        case 'poor': return 'bg-red-100 text-red-600'
        default: return 'bg-gray-100 text-gray-600'
      }
    }

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'completed': return 'bg-green-100 text-green-600'
        case 'failed': return 'bg-red-100 text-red-600'
        case 'processing': return 'bg-yellow-100 text-yellow-600'
        default: return 'bg-gray-100 text-gray-600'
      }
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">측정 이력</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              데이터 내보내기
            </Button>
            <Button variant="outline" size="sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              통계 보기
            </Button>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="사용자명으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select className="px-3 py-2 border border-gray-300 rounded-md">
            <option value="all">전체 상태</option>
            <option value="completed">완료</option>
            <option value="failed">실패</option>
            <option value="processing">처리중</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 rounded-md">
            <option value="all">전체 품질</option>
            <option value="excellent">우수</option>
            <option value="good">양호</option>
            <option value="fair">보통</option>
            <option value="poor">불량</option>
          </select>
        </div>

        {/* 측정 세션 목록 */}
        <div className="grid grid-cols-1 gap-4">
          {sessions.map((session) => (
            <Card key={session.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl">
                    <Activity className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{session.userName}</h3>
                    <p className="text-sm text-gray-600">{session.deviceType} ({session.deviceId})</p>
                    <p className="text-sm text-gray-600">{session.startTime} - {session.endTime}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Badge className={getQualityColor(session.quality)}>
                    {session.quality === 'excellent' ? '우수' : 
                     session.quality === 'good' ? '양호' : 
                     session.quality === 'fair' ? '보통' : '불량'}
                  </Badge>
                  <Badge className={getStatusColor(session.status)}>
                    {session.status === 'completed' ? '완료' : 
                     session.status === 'failed' ? '실패' : '처리중'}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="w-4 h-4 mr-2" />
                        상세 보기
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="w-4 h-4 mr-2" />
                        데이터 다운로드
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Brain className="w-4 h-4 mr-2" />
                        리포트 생성
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">측정 시간: {session.duration}분</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">데이터 크기: {session.dataSize}MB</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">품질: {session.quality}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">메모: {session.notes}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // 리포트 관리 렌더링
  const renderReportManagement = () => {
    const getTypeColor = (type: string) => {
      switch (type) {
        case 'stress': return 'bg-red-100 text-red-600'
        case 'focus': return 'bg-blue-100 text-blue-600'
        case 'wellness': return 'bg-green-100 text-green-600'
        case 'comprehensive': return 'bg-purple-100 text-purple-600'
        default: return 'bg-gray-100 text-gray-600'
      }
    }

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'generated': return 'bg-green-100 text-green-600'
        case 'processing': return 'bg-yellow-100 text-yellow-600'
        case 'failed': return 'bg-red-100 text-red-600'
        default: return 'bg-gray-100 text-gray-600'
      }
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">리포트 관리</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              일괄 다운로드
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              리포트 생성
            </Button>
          </div>
        </div>

        {/* 리포트 목록 */}
        <div className="grid grid-cols-1 gap-4">
          {reports.map((report) => (
            <Card key={report.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-xl">
                    <FileText className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
                    <p className="text-sm text-gray-600">{report.userName}</p>
                    <p className="text-sm text-gray-600">{report.createdAt}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Badge className={getTypeColor(report.type)}>
                    {report.type === 'stress' ? '스트레스' : 
                     report.type === 'focus' ? '집중력' : 
                     report.type === 'wellness' ? '웰니스' : '종합'}
                  </Badge>
                  <Badge className={getStatusColor(report.status)}>
                    {report.status === 'generated' ? '생성완료' : 
                     report.status === 'processing' ? '처리중' : '실패'}
                  </Badge>
                  {report.quality > 0 && (
                    <Badge variant="outline">
                      품질: {report.quality}%
                    </Badge>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="w-4 h-4 mr-2" />
                        미리보기
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="w-4 h-4 mr-2" />
                        다운로드
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Send className="w-4 h-4 mr-2" />
                        메일 발송
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        수정
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">발송: {report.sentTo.length}명</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Download className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">다운로드: {report.downloadCount}회</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">품질 점수: {report.quality}%</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // 서브섹션에 따른 렌더링
  const renderContent = () => {
    switch (subSection) {
      case 'user-list':
        return renderUserList()
      case 'user-history':
        return renderMeasurementHistory()
      case 'user-reports':
        return renderReportManagement()
      default:
        return renderUserList()
    }
  }

  return (
    <div>
      {renderContent()}
    </div>
  )
} 