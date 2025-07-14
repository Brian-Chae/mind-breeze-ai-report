import React, { useState, useEffect } from 'react'
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Shield,
  Edit,
  Trash2,
  Send,
  Check,
  X,
  Eye,
  EyeOff,
  MoreHorizontal,
  Search,
  Filter,
  Download,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { Card } from '../../ui/card'
import { Button } from '../../ui/button'
import { Badge } from '../../ui/badge'
import { Input } from '../../ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown-menu'

// Firebase 서비스 import
import { MemberManagementService, MemberManagementData } from '../../../services/MemberManagementService'
import enterpriseAuthService from '../../../services/EnterpriseAuthService'
import { UserType } from '../../../types/business'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [newInviteEmail, setNewInviteEmail] = useState('')
  const [newInviteRole, setNewInviteRole] = useState<'admin' | 'manager' | 'member'>('member')
  const [newInviteDepartment, setNewInviteDepartment] = useState('')
  const [showInviteForm, setShowInviteForm] = useState(false)

  // 실제 데이터 상태
  const [membersData, setMembersData] = useState<MemberManagementData[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [memberManagementService] = useState(new MemberManagementService())

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

      // 멤버 데이터 로드
      const membersData = await memberManagementService.getOrganizationMembers(organizationId)
      setMembersData(membersData)

      // MemberManagementData를 Member 인터페이스로 변환
      const convertedMembers: Member[] = membersData.map(member => ({
        id: member.userId,
        name: member.displayName || member.email || '알 수 없음',
        email: member.email || '',
        phone: '', // MemberManagementData에 phone 필드가 없음
        role: getUserRoleFromType(member.userType),
        department: member.department || '미지정',
        joinDate: member.createdAt?.toLocaleDateString() || '',
        lastLogin: member.lastLoginAt?.toLocaleDateString() || '로그인 기록 없음',
        status: member.isActive ? 'active' : 'inactive',
        permissions: getPermissionsByRole(getUserRoleFromType(member.userType))
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
  const handleSendInvite = () => {
    if (newInviteEmail.trim()) {
      const newInvitation: Invitation = {
        id: Date.now().toString(),
        email: newInviteEmail,
        role: newInviteRole,
        department: newInviteDepartment,
        sentDate: new Date().toLocaleDateString(),
        status: 'pending',
        invitedBy: '관리자'
      }
      setInvitations([...invitations, newInvitation])
      setNewInviteEmail('')
      setNewInviteDepartment('')
      setShowInviteForm(false)
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
        case 'admin': return 'bg-red-50 text-red-700 border-red-200'
        case 'manager': return 'bg-blue-50 text-blue-700 border-blue-200'
        case 'member': return 'bg-green-50 text-green-700 border-green-200'
        default: return 'bg-gray-50 text-gray-700 border-gray-200'
      }
    }

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'active': return 'bg-green-50 text-green-700 border-green-200'
        case 'inactive': return 'bg-gray-50 text-gray-700 border-gray-200'
        case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
        default: return 'bg-gray-50 text-gray-700 border-gray-200'
      }
    }

    const getRoleIcon = (role: string) => {
      switch (role) {
        case 'admin': return 'bg-red-500 text-white'
        case 'manager': return 'bg-blue-500 text-white'
        case 'member': return 'bg-green-500 text-white'
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
          className="flex items-center space-x-2"
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
            <Button onClick={() => setShowInviteForm(true)}>
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
              <Card key={member.id} className="p-6 transition-all duration-300 hover:shadow-lg border-2 hover:border-blue-200">
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
          <Card className="p-6 border-2 border-blue-200 bg-blue-50">
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
        case 'pending': return 'bg-yellow-100 text-yellow-800'
        case 'accepted': return 'bg-green-100 text-green-800'
        case 'expired': return 'bg-red-100 text-red-800'
        default: return 'bg-gray-100 text-gray-800'
      }
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">초대 관리</h2>
          <Button onClick={() => setShowInviteForm(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            새 초대
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {invitations.map((invitation) => (
            <Card key={invitation.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl">
                    <Mail className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{invitation.email}</h3>
                    <p className="text-sm text-gray-600">{invitation.department} • {invitation.role === 'admin' ? '관리자' : invitation.role === 'manager' ? '매니저' : '운영자'}</p>
                    <p className="text-sm text-gray-600">{invitation.invitedBy}님이 초대</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Badge className={getInviteStatusColor(invitation.status)}>
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

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">초대일: {invitation.sentDate}</span>
                </div>
                {invitation.status === 'pending' && (
                  <span className="text-sm text-yellow-600">7일 후 만료</span>
                )}
              </div>
            </Card>
          ))}
        </div>
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

    const levelColors = {
      read: 'bg-blue-100 text-blue-600',
      write: 'bg-green-100 text-green-600',
      delete: 'bg-red-100 text-red-600'
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">권한 설정</h2>
          <Button variant="outline">
            <Shield className="w-4 h-4 mr-2" />
            권한 템플릿
          </Button>
        </div>

        {Object.entries(groupedPermissions).map(([category, perms]) => (
          <Card key={category} className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {categoryNames[category as keyof typeof categoryNames]}
            </h3>
            <div className="space-y-4">
              {perms.map((permission) => (
                <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg">
                      <Shield className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{permission.name}</p>
                      <p className="text-sm text-gray-600">{permission.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={levelColors[permission.level]}>
                      {permission.level === 'read' ? '읽기' : permission.level === 'write' ? '쓰기' : '삭제'}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
                      <span className="text-sm text-gray-600">관리자</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
                      <span className="text-sm text-gray-600">매니저</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
                      <span className="text-sm text-gray-600">운영자</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    )
  }

  // 서브섹션 탭 렌더링
  const renderSubSectionTabs = () => {
    const tabs = [
      { id: 'member-list', label: '운영자 목록', icon: Users },
      { id: 'member-invite', label: '초대 관리', icon: UserPlus },
      { id: 'member-permissions', label: '권한 설정', icon: Shield }
    ]

    return (
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
              subSection === tab.id || (!subSection && tab.id === 'member-list')
                ? 'bg-white shadow-sm text-blue-600 font-medium'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            onClick={() => onNavigate('members', tab.id)}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
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
    <div>
      {renderSubSectionTabs()}
      {renderContent()}
    </div>
  )
} 