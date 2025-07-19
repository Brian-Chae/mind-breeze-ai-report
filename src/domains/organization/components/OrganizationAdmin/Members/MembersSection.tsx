import React, { useState, useEffect, Fragment } from 'react'
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Shield,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Loader2,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Eye,
  EyeOff,
  Send
} from 'lucide-react'

import { Card } from '@ui/card'
import { Button } from '@ui/button'
import { Badge } from '@ui/badge'
import { Input } from '@ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/select'

// Firebase 서비스 import
import measurementUserManagementService, { MeasurementUser } from '../../../../individual/services/MeasurementUserManagementService'
import { MemberListResponse } from '../../../types/member'
import enterpriseAuthService from '../../../services/EnterpriseAuthService'
import { UserType } from '@core/types/business'
import { useAuth } from '@components/AuthProvider'

interface MembersSectionProps {
  subSection: string;
  onNavigate: (sectionId: string, subSectionId?: string) => void;
}

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'member';
  department: string;
  joinDate: string;
  lastLogin: string;
  status: 'active' | 'inactive' | 'pending';
  permissions: string[];
  // 측정 관련 추가 필드
  measurementCount?: number;
  reportCount?: number;
  lastMeasurement?: string;
}

interface Invitation {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'member';
  department: string;
  sentDate: string;
  status: 'pending' | 'accepted' | 'expired';
  invitedBy: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'user' | 'device' | 'report' | 'admin';
  level: 'read' | 'write' | 'delete';
}

export default function MembersSection({ subSection, onNavigate }: MembersSectionProps) {
  // 실제 데이터 상태
  const [membersData, setMembersData] = useState<MemberListResponse | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  // 싱글톤 인스턴스 사용

  // 로딩 및 에러 상태
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // UI 상태 관리
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [showInviteForm, setShowInviteForm] = useState(false)
  
  // 초대 폼 상태
  const [newInviteEmail, setNewInviteEmail] = useState('')
  const [newInviteRole, setNewInviteRole] = useState<'admin' | 'manager' | 'member'>('member')
  const [newInviteDepartment, setNewInviteDepartment] = useState('')

  // Role 변환 헬퍼 함수들
  const getMemberRoleDisplayName = (role: string): string => {
    const roleMap: { [key: string]: string } = {
      'ORGANIZATION_ADMIN': '조직 관리자',
      'ORGANIZATION_MEMBER': '조직 멤버', 
      'DEPARTMENT_MANAGER': '부서 관리자',
      'EMPLOYEE': '직원',
      'VIEWER': '뷰어'
    }
    return roleMap[role] || role
  }

  const convertToMemberRole = (orgRole: string): 'admin' | 'manager' | 'member' => {
    switch(orgRole) {
      case 'ORGANIZATION_ADMIN': return 'admin'
      case 'DEPARTMENT_MANAGER': return 'manager'  
      default: return 'member'
    }
  }

  // 초대 관리 데이터 (임시 - 향후 Firebase 연동 필요)
  const [invitations, setInvitations] = useState<Invitation[]>([])

  // 권한 설정 데이터
  const permissions: Permission[] = [
    { id: 'user_read', name: '사용자 조회', description: '사용자 정보 조회', category: 'user', level: 'read' },
    { id: 'user_write', name: '사용자 관리', description: '사용자 정보 수정', category: 'user', level: 'write' },
    { id: 'user_delete', name: '사용자 삭제', description: '사용자 정보 삭제', category: 'user', level: 'delete' },
    { id: 'device_read', name: '디바이스 조회', description: '디바이스 정보 조회', category: 'device', level: 'read' },
    { id: 'device_write', name: '디바이스 관리', description: '디바이스 설정 관리', category: 'device', level: 'write' },
    { id: 'device_delete', name: '디바이스 삭제', description: '디바이스 삭제', category: 'device', level: 'delete' },
    { id: 'report_read', name: '리포트 조회', description: 'AI 리포트 조회', category: 'report', level: 'read' },
    { id: 'report_write', name: '리포트 생성', description: 'AI 리포트 생성', category: 'report', level: 'write' },
    { id: 'report_delete', name: '리포트 삭제', description: 'AI 리포트 삭제', category: 'report', level: 'delete' },
    { id: 'admin_read', name: '관리자 조회', description: '관리자 정보 조회', category: 'admin', level: 'read' },
    { id: 'admin_write', name: '관리자 관리', description: '관리자 설정 관리', category: 'admin', level: 'write' }
  ]

  // 데이터 로드
  useEffect(() => {
    loadMembersData()
  }, [subSection])

  const loadMembersData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 현재 사용자 정보 가져오기
      const currentContext = enterpriseAuthService.getCurrentContext()
      if (!currentContext.user || !currentContext.user.organizationId) {
        setError('조직 정보를 찾을 수 없습니다.')
        return
      }

      const organizationId = currentContext.user.organizationId

      // 측정 사용자 데이터 로드
      console.log('🔄 [MembersSection] 측정 사용자 데이터 로딩 시작...', { organizationId })
      const measurementUsers = await measurementUserManagementService.getMeasurementUsers()
      console.log('✅ [MembersSection] 로딩된 측정 사용자 수:', measurementUsers.length)

      // MeasurementUser를 Member 인터페이스로 변환
      const convertedMembers: Member[] = measurementUsers.map((member: MeasurementUser) => ({
        id: member.id,
        name: member.displayName || '알 수 없음',
        email: member.email || '',
        phone: member.phone || '',
        role: 'member', // MeasurementUser는 기본적으로 member 역할
        department: '측정 대상자', // MeasurementUser는 부서 대신 측정 대상자로 표시
        joinDate: member.createdAt?.toLocaleDateString() || '',
        lastLogin: member.lastMeasurementDate?.toLocaleDateString() || '측정 기록 없음',
        status: member.isActive ? 'active' : 'inactive',
        permissions: [], // MeasurementUser는 권한이 없음
        // 추가 측정 관련 정보
        measurementCount: member.measurementCount || 0,
        reportCount: member.reportIds?.length || 0,
        lastMeasurement: member.lastMeasurementDate?.toLocaleDateString() || '없음'
      }))

      setMembers(convertedMembers)

    } catch (err) {
      console.error('멤버 데이터 로드 오류:', err)
      setError('멤버 데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // UserType을 role로 변환
  const getUserRoleFromType = (userType: UserType): 'admin' | 'manager' | 'member' => {
    switch (userType) {
      case 'ORGANIZATION_ADMIN':
        return 'admin'
      case 'ORGANIZATION_MEMBER':
        return 'member'
      default:
        return 'member'
    }
  }

  // 역할별 권한 반환
  const getPermissionsByRole = (role: 'admin' | 'manager' | 'member'): string[] => {
    switch (role) {
      case 'admin':
        return ['user_read', 'user_write', 'device_read', 'device_write', 'report_read', 'report_write', 'admin_read', 'admin_write']
      case 'manager':
        return ['user_read', 'user_write', 'device_read', 'report_read', 'report_write']
      case 'member':
        return ['user_read', 'device_read', 'report_read']
      default:
        return []
    }
  }

  // 로딩 중일 때
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">멤버 데이터를 불러오는 중...</span>
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
        <Button onClick={loadMembersData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          다시 시도
        </Button>
      </div>
    )
  }

  // 초대 관리 기능들
  const handleSendInvite = async () => {
    if (!newInviteEmail.trim()) return

    try {
      setLoading(true)
      setError(null)

      // 현재 사용자 정보 가져오기
      const currentContext = enterpriseAuthService.getCurrentContext()
      if (!currentContext.user || !currentContext.user.organizationId) {
        setError('조직 정보를 찾을 수 없습니다.')
        return
      }

      // 역할 변환 (UI role → MemberRole)
      const memberRoleMap = {
        'admin': 'ORGANIZATION_ADMIN',
        'manager': 'DEPARTMENT_MANAGER',
        'member': 'ORGANIZATION_MEMBER'
      } as const

      const inviteRequest = {
        organizationId: currentContext.user.organizationId,
        email: newInviteEmail,
        role: memberRoleMap[newInviteRole] || 'ORGANIZATION_MEMBER',
        displayName: newInviteEmail.split('@')[0], // 이메일에서 이름 추출
        departments: newInviteDepartment ? [newInviteDepartment] : [],
        sendEmail: true // 이메일 발송 여부
      }

      // 실제 측정 사용자 생성
      const newMeasurementUser = await measurementUserManagementService.createMeasurementUser({
        email: inviteRequest.email,
        displayName: inviteRequest.displayName,
        // MeasurementUser에 맞는 추가 필드들
        notes: `${inviteRequest.role} 역할로 등록됨`
      })

      console.log('측정 사용자 생성 성공:', newMeasurementUser)
      
             // 성공 알림
       alert(`${newMeasurementUser.displayName}님이 측정 사용자로 등록되었습니다.`)
       
       // 페이지 새로고침으로 데이터 업데이트
       window.location.reload()
      
      // 폼 초기화
      setNewInviteEmail('')
      setNewInviteDepartment('')
      setShowInviteForm(false)

      // 멤버 목록 새로고침
      await loadMembersData()

    } catch (err: any) {
      console.error('초대 실패:', err)
      setError(err.message || '초대를 보내는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendInvite = (id: string) => {
    console.log('초대 재발송:', id)
  }

  const handleCancelInvite = (id: string) => {
    setInvitations(invitations.filter((invite: Invitation) => invite.id !== id))
  }

  // 운영자 목록 렌더링
  const renderMemberList = () => {
    const filteredMembers = members.filter(member => 
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.department.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleDeleteMember = (id: string) => {
      setMembers(members.filter(member => member.id !== id))
    }

    const handleToggleStatus = (id: string) => {
      setMembers(members.map(member => 
        member.id === id 
          ? { ...member, status: member.status === 'active' ? 'inactive' : 'active' }
          : member
      ))
    }

    const getRoleColor = (role: string) => {
      switch (role) {
        case 'admin': return 'bg-gray-50 text-gray-700 border-gray-200'
        case 'manager': return 'bg-gray-50 text-gray-700 border-gray-200'
        case 'member': return 'bg-gray-50 text-gray-700 border-gray-200'
        default: return 'bg-gray-50 text-gray-700 border-gray-200'
      }
    }

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'active': return 'bg-gray-50 text-gray-700 border-gray-200'
        case 'inactive': return 'bg-gray-50 text-gray-700 border-gray-200'
        case 'pending': return 'bg-gray-50 text-gray-700 border-gray-200'
        default: return 'bg-gray-50 text-gray-700 border-gray-200'
      }
    }

    const getRoleIcon = (role: string) => {
      switch (role) {
        case 'admin': return 'bg-gray-500 text-white'
        case 'manager': return 'bg-gray-500 text-white'
        case 'member': return 'bg-gray-500 text-white'
        default: return 'bg-gray-500 text-white'
      }
    }

    // 빈 상태 렌더링
    const renderEmptyState = () => (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-6">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">등록된 운영자가 없습니다</h3>
          <p className="text-gray-600 max-w-md">
            아직 등록된 운영자가 없습니다. 
            새 운영자를 초대하여 조직 관리를 시작해보세요.
          </p>
        </div>
        <Button 
          onClick={() => setShowInviteForm(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white hover:bg-blue-700"
        >
          <UserPlus className="w-4 h-4" />
          <span>운영자 초대</span>
        </Button>
      </div>
    )

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">운영자 목록</h2>
            <p className="text-gray-600 mt-2">조직의 운영자들을 관리하고 권한을 설정하세요</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              내보내기
            </Button>
            <Button onClick={() => setShowInviteForm(true)} className="bg-blue-600 text-white hover:bg-blue-700">
              <UserPlus className="w-4 h-4 mr-2" />
              운영자 초대
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
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            필터
          </Button>
        </div>

        {/* 운영자 목록 */}
        <div className="space-y-4">
          {filteredMembers.length === 0 ? (
            renderEmptyState()
          ) : (
            filteredMembers.map((member) => (
              <Card key={member.id} className="p-6 bg-white border border-gray-200 hover:bg-gray-50 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-xl shadow-md ${getRoleIcon(member.role)}`}>
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{member.name}</h3>
                      <p className="text-sm text-gray-600">{member.email}</p>
                      <p className="text-sm text-gray-600">{member.department}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Badge className={`font-semibold ${getRoleColor(member.role)}`}>
                      {member.role === 'admin' ? '관리자' : member.role === 'manager' ? '매니저' : '운영자'}
                    </Badge>
                    <Badge className={`font-semibold ${getStatusColor(member.status)}`}>
                      {member.status === 'active' ? '활성' : member.status === 'inactive' ? '비활성' : '대기'}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          수정
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(member.id)}>
                          {member.status === 'active' ? (
                            <>
                              <EyeOff className="w-4 h-4 mr-2" />
                              비활성화
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-2" />
                              활성화
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteMember(member.id)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{member.phone || '연락처 없음'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">입사: {member.joinDate}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">최종 로그인: {member.lastLogin}</span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* 초대 폼 */}
        {showInviteForm && (
          <Card className="p-6 border-2 border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">새 운영자 초대</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">이메일</label>
                <Input
                  type="email"
                  value={newInviteEmail}
                  onChange={(e) => setNewInviteEmail(e.target.value)}
                  placeholder="초대할 이메일을 입력하세요"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">역할</label>
                  <select
                    value={newInviteRole}
                    onChange={(e) => setNewInviteRole(e.target.value as 'admin' | 'manager' | 'member')}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="member">운영자</option>
                    <option value="manager">매니저</option>
                    <option value="admin">관리자</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">부서</label>
                  <Input
                    value={newInviteDepartment}
                    onChange={(e) => setNewInviteDepartment(e.target.value)}
                    placeholder="부서를 입력하세요"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleSendInvite}>
                  <Send className="w-4 h-4 mr-2" />
                  초대 보내기
                </Button>
                <Button variant="outline" onClick={() => setShowInviteForm(false)}>
                  취소
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    )
  }

  // 초대 관리 렌더링
  const renderInviteManagement = () => {
    const getInviteStatusColor = (status: string) => {
      switch (status) {
        case 'pending': return 'bg-gray-50 text-gray-700 border-gray-200'
        case 'accepted': return 'bg-gray-50 text-gray-700 border-gray-200'
        case 'expired': return 'bg-gray-50 text-gray-700 border-gray-200'
        default: return 'bg-gray-50 text-gray-700 border-gray-200'
      }
    }

    const getInviteIcon = (status: string) => {
      switch (status) {
        case 'pending': return 'bg-gray-500 text-white'
        case 'accepted': return 'bg-gray-500 text-white'
        case 'expired': return 'bg-gray-500 text-white'
        default: return 'bg-gray-500 text-white'
      }
    }

    // 빈 상태 렌더링
    const renderEmptyInviteState = () => (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-6">
          <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">보낸 초대가 없습니다</h3>
          <p className="text-gray-600 max-w-md">
            아직 보낸 초대가 없습니다. 
            새 운영자를 초대하여 조직에 참여시켜보세요.
          </p>
        </div>
        <Button 
          onClick={() => setShowInviteForm(true)}
          className="flex items-center space-x-2 bg-green-600 text-white hover:bg-green-700"
        >
          <UserPlus className="w-4 h-4" />
          <span>새 초대</span>
        </Button>
      </div>
    )

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">초대 관리</h2>
            <p className="text-gray-600 mt-2">운영자 초대를 관리하고 상태를 확인하세요</p>
          </div>
          <Button onClick={() => setShowInviteForm(true)} className="bg-green-600 text-white hover:bg-green-700">
            <UserPlus className="w-4 h-4 mr-2" />
            새 초대
          </Button>
        </div>

        <div className="space-y-4">
          {invitations.length === 0 ? (
            renderEmptyInviteState()
          ) : (
            invitations.map((invitation) => (
              <Card key={invitation.id} className="p-6 transition-all duration-300 hover:shadow-lg border-2 hover:border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-xl shadow-md ${getInviteIcon(invitation.status)}`}>
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{invitation.email}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm text-gray-600">{invitation.department}</span>
                        <span className="text-sm text-gray-400">•</span>
                        <span className="text-sm text-gray-600">
                          {invitation.role === 'admin' ? '관리자' : invitation.role === 'manager' ? '매니저' : '운영자'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{invitation.invitedBy}님이 초대</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Badge className={`font-semibold ${getInviteStatusColor(invitation.status)}`}>
                      {invitation.status === 'pending' ? '대기중' : invitation.status === 'accepted' ? '수락' : '만료'}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {invitation.status === 'pending' && (
                          <DropdownMenuItem onClick={() => handleResendInvite(invitation.id)}>
                            <Send className="w-4 h-4 mr-2" />
                            재전송
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleCancelInvite(invitation.id)}>
                          <X className="w-4 h-4 mr-2" />
                          취소
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">초대일: {invitation.sentDate}</span>
                  </div>
                  {invitation.status === 'pending' && (
                    <span className="text-sm text-gray-600 font-medium">7일 후 만료</span>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>

        {/* 초대 폼 */}
        {showInviteForm && (
          <Card className="p-6 border-2 border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">새 운영자 초대</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">이메일</label>
                <Input
                  type="email"
                  value={newInviteEmail}
                  onChange={(e) => setNewInviteEmail(e.target.value)}
                  placeholder="초대할 이메일을 입력하세요"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">역할</label>
                  <select
                    value={newInviteRole}
                    onChange={(e) => setNewInviteRole(e.target.value as 'admin' | 'manager' | 'member')}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="member">운영자</option>
                    <option value="manager">매니저</option>
                    <option value="admin">관리자</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">부서</label>
                  <Input
                    value={newInviteDepartment}
                    onChange={(e) => setNewInviteDepartment(e.target.value)}
                    placeholder="부서를 입력하세요"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleSendInvite}>
                  <Send className="w-4 h-4 mr-2" />
                  초대 보내기
                </Button>
                <Button variant="outline" onClick={() => setShowInviteForm(false)}>
                  취소
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    )
  }

  // 권한 설정 렌더링
  const renderPermissionSettings = () => {
    const groupedPermissions = permissions.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = []
      }
      acc[permission.category].push(permission)
      return acc
    }, {} as Record<string, Permission[]>)

    const categoryNames = {
      user: '사용자 관리',
      device: '디바이스 관리',
      report: '리포트 관리',
      admin: '관리자 설정'
    }

    const categoryIcons = {
      user: Users,
      device: Shield, // Changed from Monitor to Shield
      report: Users, // Changed from FileText to Users
      admin: Shield
    }

    const categoryColors = {
      user: 'bg-gray-50 border-gray-200',
      device: 'bg-gray-50 border-gray-200',
      report: 'bg-gray-50 border-gray-200',
      admin: 'bg-gray-50 border-gray-200'
    }

    const levelColors = {
      read: 'bg-gray-50 text-gray-700 border-gray-200',
      write: 'bg-gray-50 text-gray-700 border-gray-200',
      delete: 'bg-gray-50 text-gray-700 border-gray-200'
    }

    const getPermissionIcon = (category: string) => {
      const colors = {
        user: 'bg-gray-500 text-white',
        device: 'bg-gray-500 text-white',
        report: 'bg-gray-500 text-white',
        admin: 'bg-gray-500 text-white'
      }
      return colors[category as keyof typeof colors] || 'bg-gray-500 text-white'
    }

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">권한 설정</h2>
            <p className="text-gray-600 mt-2">역할별 권한을 설정하고 관리하세요</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Shield className="w-4 h-4 mr-2" />
              권한 템플릿
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              권한 내보내기
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedPermissions).map(([category, perms]) => {
            const IconComponent = categoryIcons[category as keyof typeof categoryIcons]
            return (
              <Card key={category} className={`p-6 border-2 ${categoryColors[category as keyof typeof categoryColors]}`}>
                <div className="flex items-center space-x-3 mb-6">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl shadow-md ${getPermissionIcon(category)}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {categoryNames[category as keyof typeof categoryNames]}
                    </h3>
                    <p className="text-sm text-gray-600">{perms.length}개 권한</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {perms.map((permission) => (
                    <div key={permission.id} className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-all">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg">
                          <Shield className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{permission.name}</p>
                          <p className="text-sm text-gray-600">{permission.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <Badge className={`font-semibold ${levelColors[permission.level]}`}>
                          {permission.level === 'read' ? '읽기' : permission.level === 'write' ? '쓰기' : '삭제'}
                        </Badge>
                        
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                              defaultChecked={permission.level === 'read' || permission.level === 'write' || permission.level === 'delete'}
                            />
                            <span className="text-sm font-medium text-gray-600">관리자</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                              defaultChecked={permission.level === 'read' || permission.level === 'write'}
                            />
                            <span className="text-sm font-medium text-gray-600">매니저</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                              defaultChecked={permission.level === 'read'}
                            />
                            <span className="text-sm font-medium text-gray-600">운영자</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )
          })}
        </div>

        {/* 저장 버튼 */}
        <div className="flex justify-end space-x-2">
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            초기화
          </Button>
          <Button>
            <CheckCircle className="w-4 h-4 mr-2" />
            권한 저장
          </Button>
        </div>
      </div>
    )
  }

  // 서브섹션 탭 렌더링
  const renderSubSectionTabs = () => {
    return (
      <div className="bg-white shadow-sm border-b border-gray-200 -mx-6 -mt-6 mb-6">
        <div className="flex space-x-8">
          <button
            onClick={() => onNavigate('members', 'member-list')}
            className={`py-4 pl-6 pr-1 border-b-2 font-medium text-sm ${
              subSection === 'member-list' || (!subSection)
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            운영자 목록
          </button>
          <button
            onClick={() => onNavigate('members', 'member-invite')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              subSection === 'member-invite'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            초대 관리
          </button>
          <button
            onClick={() => onNavigate('members', 'member-permissions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              subSection === 'member-permissions'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            권한 설정
          </button>
        </div>
      </div>
    )
  }

  // 서브섹션에 따른 렌더링
  const renderContent = () => {
    switch (subSection) {
      case 'member-list':
        return renderMemberList()
      case 'member-invite':
        return renderInviteManagement()
      case 'member-permissions':
        return renderPermissionSettings()
      default:
        return renderMemberList()
    }
  }

  return (
    <div className="p-6">
      {renderSubSectionTabs()}
      {renderContent()}
    </div>
  )
} 