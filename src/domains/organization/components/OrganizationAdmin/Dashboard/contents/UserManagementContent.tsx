import React, { useState, useEffect } from 'react'
import { 
  Users, 
  User,
  UserCheck,
  UserX,
  UserPlus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Settings,
  Shield,
  Ban,
  RefreshCw,
  Calendar,
  Mail,
  Phone,
  Building2,
  Activity,
  Clock,
  Award,
  AlertTriangle
} from 'lucide-react'
import systemAdminService, { UserOverview } from '../../../../services/SystemAdminService'

interface UserManagementContentProps {}

export default function UserManagementContent({}: UserManagementContentProps) {
  const [users, setUsers] = useState<UserOverview[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserOverview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterUserType, setFilterUserType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterOrganization, setFilterOrganization] = useState<string>('all')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    organizationUsers: 0,
    individualUsers: 0,
    suspendedUsers: 0,
    newUsersThisMonth: 0,
    usersByType: {} as Record<string, number>
  })

  useEffect(() => {
    loadUserData()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(loadUserData, 30000) // 30초마다 새로고침
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  useEffect(() => {
    applyFilters()
  }, [users, searchTerm, filterUserType, filterStatus, filterOrganization])

  const loadUserData = async () => {
    try {
      setIsLoading(true)
      
      const [usersData, statsData] = await Promise.allSettled([
        systemAdminService.getAllUsersOverview(),
        systemAdminService.getUserManagementStats()
      ])

      if (usersData.status === 'fulfilled') {
        setUsers(usersData.value)
      }

      if (statsData.status === 'fulfilled') {
        const stats = statsData.value
        setUserStats({
          totalUsers: stats.totalUsers || 0,
          activeUsers: stats.activeUsers || 0,
          organizationUsers: stats.totalUsers || 0, // 기업 사용자를 전체 사용자로 대체
          individualUsers: 0, // API에서 제공하지 않음
          suspendedUsers: stats.inactiveUsers || 0,
          newUsersThisMonth: stats.newUsersThisMonth || 0,
          usersByType: stats.usersByRole || {}
        })
      }

    } catch (error) {
      console.error('사용자 데이터 로드 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = users

    // 검색 필터
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.organizationInfo?.organizationName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 사용자 타입 필터
    if (filterUserType !== 'all') {
      filtered = filtered.filter(user => user.userType === filterUserType)
    }

    // 상태 필터
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => user.systemInfo.status === filterStatus)
    }

    // 조직 필터
    if (filterOrganization !== 'all') {
      if (filterOrganization === 'individual') {
        filtered = filtered.filter(user => !user.organizationInfo)
      } else {
        filtered = filtered.filter(user => user.organizationInfo?.organizationId === filterOrganization)
      }
    }

    setFilteredUsers(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-emerald-700 bg-emerald-50 border-emerald-200'
      case 'suspended': return 'text-red-700 bg-red-50 border-red-200'
      case 'pending_verification': return 'text-amber-700 bg-amber-50 border-amber-200'
      case 'inactive': return 'text-slate-700 bg-slate-50 border-slate-200'
      default: return 'text-slate-700 bg-slate-50 border-slate-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '활성'
      case 'suspended': return '정지'
      case 'pending_verification': return '이메일 인증 대기'
      case 'inactive': return '비활성'
      default: return status
    }
  }

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'SYSTEM_ADMIN': return 'text-purple-700 bg-purple-50 border-purple-200'
      case 'ORGANIZATION_ADMIN': return 'text-blue-700 bg-blue-50 border-blue-200'
      case 'ORGANIZATION_MEMBER': return 'text-green-700 bg-green-50 border-green-200'
      case 'INDIVIDUAL_USER': return 'text-orange-700 bg-orange-50 border-orange-200'
      default: return 'text-slate-700 bg-slate-50 border-slate-200'
    }
  }

  const getUserTypeText = (userType: string) => {
    switch (userType) {
      case 'SYSTEM_ADMIN': return '시스템관리자'
      case 'ORGANIZATION_ADMIN': return '기업관리자'
      case 'ORGANIZATION_MEMBER': return '기업구성원'
      case 'INDIVIDUAL_USER': return '개인사용자'
      default: return userType
    }
  }

  const getActivityLevel = (user: UserOverview) => {
    const { loginFrequency, totalMeasurements, totalReports } = user.activityStats
    const score = loginFrequency + (totalMeasurements * 0.1) + (totalReports * 0.2)
    
    if (score >= 10) return { level: '높음', color: 'text-green-600' }
    if (score >= 5) return { level: '보통', color: 'text-yellow-600' }
    if (score >= 1) return { level: '낮음', color: 'text-orange-600' }
    return { level: '없음', color: 'text-slate-600' }
  }

  const formatDate = (date?: Date) => {
    if (!date) return '-'
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  // 고유한 조직 목록 추출
  const organizations = Array.from(
    new Set(
      users
        .filter(user => user.organizationInfo)
        .map(user => user.organizationInfo!.organizationId)
    )
  ).map(orgId => {
    const user = users.find(u => u.organizationInfo?.organizationId === orgId)
    return {
      id: orgId,
      name: user?.organizationInfo?.organizationName || '알 수 없음'
    }
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">사용자 데이터 로드 중</h3>
              <p className="text-slate-600">잠시만 기다려주세요...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 헤더 */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">사용자 관리</h1>
          <p className="text-lg text-slate-600">전체 사용자 현황 및 관리</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">전체 사용자</p>
                <p className="text-2xl font-bold text-slate-900">{(userStats.totalUsers || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <UserCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">활성 사용자</p>
                <p className="text-2xl font-bold text-slate-900">{(userStats.activeUsers || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">기업 사용자</p>
                <p className="text-2xl font-bold text-slate-900">{(userStats.organizationUsers || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <UserPlus className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">이번 달 신규</p>
                <p className="text-2xl font-bold text-slate-900">{(userStats.newUsersThisMonth || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 제어 패널 */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="이름, 이메일, 조직명으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-64 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-500"
                />
              </div>
              
              <select
                value={filterUserType}
                onChange={(e) => setFilterUserType(e.target.value)}
                className="px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
              >
                <option value="all">모든 사용자 유형</option>
                <option value="SYSTEM_ADMIN">시스템관리자</option>
                <option value="ORGANIZATION_ADMIN">기업관리자</option>
                <option value="ORGANIZATION_MEMBER">기업구성원</option>
                <option value="INDIVIDUAL_USER">개인사용자</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
              >
                <option value="all">모든 상태</option>
                <option value="active">활성</option>
                <option value="suspended">정지</option>
                <option value="pending_verification">이메일 인증 대기</option>
                <option value="inactive">비활성</option>
              </select>

              <select
                value={filterOrganization}
                onChange={(e) => setFilterOrganization(e.target.value)}
                className="px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
              >
                <option value="all">모든 조직</option>
                <option value="individual">개인 사용자</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                자동 새로고침
              </label>
              
              <button
                onClick={loadUserData}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all shadow-md disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                새로고침
              </button>
            </div>
          </div>
        </div>

        {/* 사용자 목록 */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">등록된 사용자</h2>
              <p className="text-slate-600 mt-1">전체 사용자 목록 및 상세 정보</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">사용자</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">유형</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">소속 조직</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">상태</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">활동도</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">측정/리포트</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">가입일</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredUsers.map((user) => {
                  const activityLevel = getActivityLevel(user)
                  
                  return (
                    <tr key={user.userId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 bg-slate-100 rounded-full">
                            <User className="w-5 h-5 text-slate-600" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{user.displayName}</div>
                            <div className="text-sm text-slate-600">{user.email}</div>
                            {user.profile.phoneNumber && (
                              <div className="text-xs text-slate-500">{user.profile.phoneNumber}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getUserTypeColor(user.userType)}`}>
                          {getUserTypeText(user.userType)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.organizationInfo ? (
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {user.organizationInfo.organizationName}
                            </div>
                            <div className="text-xs text-slate-600">
                              {user.organizationInfo.role}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-500">개인 사용자</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.systemInfo.status)}`}>
                            {getStatusText(user.systemInfo.status)}
                          </span>
                          {!user.profile.emailVerified && (
                            <span className="text-xs text-amber-600">이메일 미인증</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${activityLevel.color}`}>
                            {activityLevel.level}
                          </span>
                          {user.profile.lastActiveAt && (
                            <div className="text-xs text-slate-500">
                              {formatDate(user.profile.lastActiveAt)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="flex items-center gap-2 text-slate-900">
                            <Activity className="w-3 h-3" />
                            {user.activityStats.totalMeasurements}
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Award className="w-3 h-3" />
                            {user.activityStats.totalReports}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">
                          {formatDate(user.profile.registeredAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            title="사용자 상세"
                          >
                            <Eye className="w-4 h-4 text-slate-600" />
                          </button>
                          <button
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            title="권한 관리"
                          >
                            <Shield className="w-4 h-4 text-slate-600" />
                          </button>
                          <button
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            title="설정"
                          >
                            <Settings className="w-4 h-4 text-slate-600" />
                          </button>
                          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="더 많은 옵션">
                            <MoreHorizontal className="w-4 h-4 text-slate-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>조건에 맞는 사용자가 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 