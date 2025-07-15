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
  onNavigate: (section: string, subSection?: string) => void;
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

export default function UsersSection({ subSection, onNavigate }: UsersSectionProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedDateRange, setSelectedDateRange] = useState('7d')

  // 실제 데이터 상태
  const [firebaseUsers, setFirebaseUsers] = useState<FirebaseMeasurementUser[]>([])
  const [users, setUsers] = useState<MeasurementUser[]>([])
  const [userStats, setUserStats] = useState<MeasurementUserStats | null>(null)

  // 측정 세션 데이터
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
      startTime: '2024-01-14 10:00:00',
      endTime: '2024-01-14 10:18:00',
      duration: 18,
      deviceId: 'LB002',
      deviceType: 'LinkBand Pro',
      quality: 'good',
      dataSize: 3.1,
      notes: '일부 신호 불안정',
      status: 'completed'
    },
    {
      id: '3',
      userId: '3',
      userName: '박집중',
      startTime: '2024-01-12 16:30:00',
      endTime: '2024-01-12 16:35:00',
      duration: 5,
      deviceId: 'LB003',
      deviceType: 'LinkBand Pro',
      quality: 'fair',
      dataSize: 0.8,
      notes: '측정 중단됨',
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

    // 로딩 상태
    if (loading) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">사용자 목록</h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled>
                <Download className="w-4 h-4 mr-2" />
                내보내기
              </Button>
              <Button disabled>
                <Plus className="w-4 h-4 mr-2" />
                사용자 추가
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      )
    }

    // 에러 상태
    if (error) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">사용자 목록</h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled>
                <Download className="w-4 h-4 mr-2" />
                내보내기
              </Button>
              <Button disabled>
                <Plus className="w-4 h-4 mr-2" />
                사용자 추가
              </Button>
            </div>
          </div>
          <Card className="p-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-xl">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">데이터 로드 오류</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={loadUsersData} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  다시 시도
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )
    }

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">사용자 목록</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              내보내기
            </Button>
            <Button className="bg-gray-600 text-white hover:bg-gray-700">
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
        {filteredUsers.length === 0 ? (
          <Card className="p-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-xl">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">사용자가 없습니다</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery ? '검색 조건에 맞는 사용자가 없습니다.' : '등록된 사용자가 없습니다.'}
                </p>
                <Button className="bg-gray-600 text-white hover:bg-gray-700">
                  <Plus className="w-4 h-4 mr-2" />
                  사용자 추가
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="p-6 bg-white border border-gray-200 hover:bg-gray-50 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl">
                      <User className="w-6 h-6 text-gray-600" />
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
                        <Button variant="ghost" size="sm" className="hover:bg-gray-50">
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
                  <div className="flex items-center space-x-2 p-3 bg-white rounded-lg">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">가입: {user.joinDate}</span>
                  </div>
                  <div className="flex items-center space-x-2 p-3 bg-white rounded-lg">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">최근 측정: {user.lastMeasurement}</span>
                  </div>
                  <div className="flex items-center space-x-2 p-3 bg-white rounded-lg">
                    <Activity className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">측정 횟수: {user.measurementCount}회</span>
                  </div>
                  <div className="flex items-center space-x-2 p-3 bg-white rounded-lg">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">리포트: {user.reportCount}개</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
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

    const filteredSessions = sessions.filter(session => 
      session.userName.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // 로딩 상태
    if (loading) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">측정 이력</h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled>
                <Download className="w-4 h-4 mr-2" />
                데이터 내보내기
              </Button>
              <Button variant="outline" size="sm" disabled>
                <BarChart3 className="w-4 h-4 mr-2" />
                통계 보기
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      )
    }

    // 에러 상태
    if (error) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">측정 이력</h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled>
                <Download className="w-4 h-4 mr-2" />
                데이터 내보내기
              </Button>
              <Button variant="outline" size="sm" disabled>
                <BarChart3 className="w-4 h-4 mr-2" />
                통계 보기
              </Button>
            </div>
          </div>
          <Card className="p-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-xl">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">데이터 로드 오류</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={loadUsersData} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  다시 시도
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )
    }

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">측정 이력</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              데이터 내보내기
            </Button>
            <Button variant="outline" size="sm" className="bg-gray-600 text-white hover:bg-gray-700">
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
        {filteredSessions.length === 0 ? (
          <Card className="p-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-xl">
                <Activity className="w-8 h-8 text-gray-600" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">측정 이력이 없습니다</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery ? '검색 조건에 맞는 측정 이력이 없습니다.' : '아직 측정 이력이 없습니다.'}
                </p>
                <Button className="bg-gray-600 text-white hover:bg-gray-700">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  측정 시작하기
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredSessions.map((session) => (
              <Card key={session.id} className="p-6 bg-white border border-gray-200 hover:bg-gray-50 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl">
                      <Activity className="w-6 h-6 text-gray-600" />
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
                        <Button variant="ghost" size="sm" className="hover:bg-gray-50">
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
                  <div className="flex items-center space-x-2 p-3 bg-white rounded-lg">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">측정 시간: {session.duration}분</span>
                  </div>
                  <div className="flex items-center space-x-2 p-3 bg-white rounded-lg">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">데이터 크기: {session.dataSize}MB</span>
                  </div>
                  <div className="flex items-center space-x-2 p-3 bg-white rounded-lg">
                    <CheckCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">품질: {session.quality}</span>
                  </div>
                  <div className="flex items-center space-x-2 p-3 bg-white rounded-lg">
                    <AlertCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">메모: {session.notes}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
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

    const filteredReports = reports.filter(report => 
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.userName.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // 로딩 상태
    if (loading) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">리포트 관리</h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled>
                <Download className="w-4 h-4 mr-2" />
                일괄 다운로드
              </Button>
              <Button disabled>
                <Plus className="w-4 h-4 mr-2" />
                리포트 생성
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      )
    }

    // 에러 상태
    if (error) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">리포트 관리</h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled>
                <Download className="w-4 h-4 mr-2" />
                일괄 다운로드
              </Button>
              <Button disabled>
                <Plus className="w-4 h-4 mr-2" />
                리포트 생성
              </Button>
            </div>
          </div>
          <Card className="p-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-xl">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">데이터 로드 오류</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={loadUsersData} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  다시 시도
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )
    }

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">리포트 관리</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              일괄 다운로드
            </Button>
            <Button className="bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700">
              <Plus className="w-4 h-4 mr-2" />
              리포트 생성
            </Button>
          </div>
        </div>

        {/* 검색 필터 */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="리포트 제목, 사용자명으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select className="px-3 py-2 border border-gray-300 rounded-md">
            <option value="all">전체 유형</option>
            <option value="stress">스트레스</option>
            <option value="focus">집중력</option>
            <option value="wellness">웰니스</option>
            <option value="comprehensive">종합</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 rounded-md">
            <option value="all">전체 상태</option>
            <option value="generated">생성완료</option>
            <option value="processing">처리중</option>
            <option value="failed">실패</option>
          </select>
        </div>

        {/* 리포트 목록 */}
        {filteredReports.length === 0 ? (
          <Card className="p-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-xl">
                <FileText className="w-8 h-8 text-orange-600" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">리포트가 없습니다</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery ? '검색 조건에 맞는 리포트가 없습니다.' : '아직 생성된 리포트가 없습니다.'}
                </p>
                <Button className="bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700">
                  <Plus className="w-4 h-4 mr-2" />
                  리포트 생성
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredReports.map((report) => (
              <Card key={report.id} className="p-6 bg-gradient-to-r from-white to-orange-50 hover:shadow-lg transition-all duration-300 border-l-4 border-orange-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-orange-100 to-red-100 rounded-xl">
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
                        <Button variant="ghost" size="sm" className="hover:bg-orange-50">
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
                  <div className="flex items-center space-x-2 p-3 bg-white rounded-lg">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">발송: {report.sentTo.length}명</span>
                  </div>
                  <div className="flex items-center space-x-2 p-3 bg-white rounded-lg">
                    <Download className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">다운로드: {report.downloadCount}회</span>
                  </div>
                  <div className="flex items-center space-x-2 p-3 bg-white rounded-lg">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">품질 점수: {report.quality}%</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  // 탭 정의
  const tabs = [
    { id: 'user-list', label: '사용자 목록', icon: Users },
    { id: 'user-history', label: '측정 이력', icon: Activity },
    { id: 'user-reports', label: '리포트 관리', icon: Eye }
  ]

  // 탭 렌더링
  const renderTabs = () => (
    <div className="bg-white shadow-sm border-b border-gray-200 -mx-6 -mt-6 mb-6">
      <div className="flex space-x-8">
        <button
          onClick={() => onNavigate('users', 'user-list')}
          className={`py-4 pl-6 pr-1 border-b-2 font-medium text-sm ${
            subSection === 'user-list' || (!subSection)
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          사용자 목록
        </button>
        <button
          onClick={() => onNavigate('users', 'user-history')}
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            subSection === 'user-history'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          측정 이력
        </button>
        <button
          onClick={() => onNavigate('users', 'user-reports')}
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            subSection === 'user-reports'
              ? 'border-purple-500 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          리포트 관리
        </button>
      </div>
    </div>
  )

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
    <div className="p-6">
      {renderTabs()}
      {renderContent()}
    </div>
  )
} 