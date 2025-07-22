/**
 * 구성원 관리 탭 컴포넌트
 * 
 * 조직 구성원을 조회, 초대, 관리하는 인터페이스
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card'
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { Badge } from '@ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@ui/avatar'
import { Checkbox } from '@ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/select'
import { 
  Users, 
  Plus, 
  Upload, 
  Loader2,
  Search,
  Filter,
  MoreHorizontal,
  Edit2,
  Trash2,
  UserX,
  UserCheck,
  Mail,
  Phone
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ui/table"
import { toast } from 'sonner'
import organizationManagementService from '@domains/organization/services/management/OrganizationManagementService'
import type { OrganizationMember, Department, PendingMember } from '@domains/organization/types/management/organization-management'
import MemberCreateModal from '../components/MemberInviteModal'

interface MemberManagementTabProps {
  organizationId: string
}

interface MemberFilters {
  departmentId?: string
  status?: string
  role?: string
  search?: string
}

type MemberStatusFilter = 'ALL' | 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'RESIGNED'

// Status configuration
const statusConfig = {
  ACTIVE: { label: '활성', color: 'bg-green-100 text-green-700' },
  INVITED: { label: '초대됨', color: 'bg-yellow-100 text-yellow-700' },
  SUSPENDED: { label: '정지됨', color: 'bg-red-100 text-red-700' },
  RESIGNED: { label: '퇴사함', color: 'bg-gray-100 text-gray-700' }
}

// Role configuration
const roleConfig = {
  ORGANIZATION_ADMIN: { label: '조직 관리자', color: 'bg-red-100 text-red-700' },
  DEPARTMENT_MANAGER: { label: '부서 관리자', color: 'bg-blue-100 text-blue-700' },
  TEAM_LEADER: { label: '팀 리더', color: 'bg-purple-100 text-purple-700' },
  SUPERVISOR: { label: '감독자', color: 'bg-orange-100 text-orange-700' },
  EMPLOYEE: { label: '일반 직원', color: 'bg-gray-100 text-gray-700' },
  ORGANIZATION_MEMBER: { label: '조직 구성원', color: 'bg-green-100 text-green-700' }
}

export default function MemberManagementTab({ organizationId }: MemberManagementTabProps) {
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [filteredMembers, setFilteredMembers] = useState<OrganizationMember[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<MemberFilters>({})
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<MemberStatusFilter>('ALL')
  
  // Modal states
  const [inviteModalOpen, setInviteModalOpen] = useState(false)

  useEffect(() => {
    loadMembers()
    loadPendingMembers()
    loadDepartments()
    checkAndCreateAdminMember()
  }, [organizationId])

  useEffect(() => {
    applyFilters()
  }, [members, pendingMembers, filters, selectedStatusFilter])

  const loadMembers = async () => {
    try {
      setLoading(true)
      const memberList = await organizationManagementService.getMembers(organizationId)
      setMembers(memberList)
    } catch (error) {
      console.error('Failed to load members:', error)
      toast.error('구성원 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const loadPendingMembers = async () => {
    try {
      const pendingMemberList = await organizationManagementService.getPendingMembers(organizationId)
      setPendingMembers(pendingMemberList)
    } catch (error) {
      console.error('Failed to load pending members:', error)
      toast.error('가입 대기 구성원 목록을 불러오는데 실패했습니다.')
    }
  }

  const loadDepartments = async () => {
    try {
      const departmentList = await organizationManagementService.getDepartments(organizationId)
      setDepartments(departmentList)
    } catch (error) {
      console.error('Failed to load departments:', error)
    }
  }

  const checkAndCreateAdminMember = async () => {
    try {
      // 현재 구성원 수 확인
      const currentMembers = await organizationManagementService.getMembers(organizationId)
      
      // 구성원이 없으면 관리자 구성원 자동 생성
      if (currentMembers.length === 0) {
        console.log('구성원이 없음. 관리자 구성원 자동 생성 중...')
        await organizationManagementService.addAdminMemberToExistingOrganization(organizationId)
        
        // 구성원 목록 다시 로드
        setTimeout(() => {
          loadMembers()
        }, 1000)
        
        toast.success('관리자 구성원이 자동으로 추가되었습니다.')
      }
    } catch (error) {
      console.error('관리자 구성원 자동 생성 실패:', error)
      // 에러는 로그만 남기고 사용자에게는 알리지 않음 (선택적 기능)
    }
  }

  const applyFilters = () => {
    let filtered: OrganizationMember[] = []

    // Status filter by card selection
    if (selectedStatusFilter === 'ALL') {
      // Include both regular members and pending members
      const convertedPendingMembers = pendingMembers.map(pending => ({
        id: pending.id,
        userId: '',
        employeeId: '대기중',
        displayName: pending.name,
        email: pending.email,
        position: pending.position || '',
        role: pending.role,
        status: 'INVITED' as const, // Use INVITED status for pending members
        permissions: [],
        departmentId: pending.departmentId,
        departmentName: pending.departmentId ? departments.find(d => d.id === pending.departmentId)?.name : undefined,
        joinedAt: pending.createdAt,
        phone: undefined,
        profilePhotoUrl: undefined,
        jobTitle: undefined,
        invitationToken: undefined,
        invitationExpiry: pending.expiresAt,
        lastActiveAt: undefined,
        resignedAt: undefined
      } as OrganizationMember))
      
      filtered = [...members, ...convertedPendingMembers]
    } else if (selectedStatusFilter === 'PENDING') {
      // Convert pending members to display format
      filtered = pendingMembers.map(pending => ({
        id: pending.id,
        userId: '',
        employeeId: '대기중',
        displayName: pending.name,
        email: pending.email,
        position: pending.position || '',
        role: pending.role,
        status: 'INVITED' as const, // Use INVITED status for pending members
        permissions: [],
        departmentId: pending.departmentId,
        departmentName: pending.departmentId ? departments.find(d => d.id === pending.departmentId)?.name : undefined,
        joinedAt: pending.createdAt,
        phone: undefined,
        profilePhotoUrl: undefined,
        jobTitle: undefined,
        invitationToken: undefined,
        invitationExpiry: pending.expiresAt,
        lastActiveAt: undefined,
        resignedAt: undefined
      } as OrganizationMember))
    } else {
      filtered = members.filter(member => member.status === selectedStatusFilter)
    }

    // Additional filters
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(member => 
        member.displayName.toLowerCase().includes(searchTerm) ||
        member.email.toLowerCase().includes(searchTerm) ||
        member.employeeId.toLowerCase().includes(searchTerm) ||
        (member.departmentName && member.departmentName.toLowerCase().includes(searchTerm))
      )
    }

    if (filters.status && selectedStatusFilter === 'ALL') {
      filtered = filtered.filter(member => member.status === filters.status)
    }

    if (filters.role) {
      filtered = filtered.filter(member => member.role === filters.role)
    }

    if (filters.departmentId) {
      filtered = filtered.filter(member => member.departmentId === filters.departmentId)
    }

    setFilteredMembers(filtered)
  }

  // Handle member actions
  const handleInviteMember = () => {
    setInviteModalOpen(true)
  }

  // Modal handlers
  const handleInviteModalClose = () => {
    setInviteModalOpen(false)
  }

  const handleInviteModalSuccess = () => {
    loadMembers()
    loadPendingMembers()
  }

  const handleEditMember = (memberId: string) => {
    toast({
      title: '개발 중',
      description: '구성원 편집 기능은 곧 제공될 예정입니다.'
    })
  }

  const handleUpdateMemberStatus = async (memberId: string, status: 'ACTIVE' | 'SUSPENDED') => {
    try {
      await organizationManagementService.updateMemberStatus(organizationId, memberId, status)
      toast({
        title: '성공',
        description: `구성원 상태가 ${status === 'ACTIVE' ? '활성' : '정지'}으로 변경되었습니다.`
      })
      loadMembers()
    } catch (error) {
      console.error('Failed to update member status:', error)
      toast({
        title: '오류',
        description: '구성원 상태 변경에 실패했습니다.',
        variant: 'destructive'
      })
    }
  }

  const handleUpdateMemberRole = async (memberId: string, role: 'ORGANIZATION_ADMIN' | 'DEPARTMENT_MANAGER' | 'TEAM_LEADER' | 'SUPERVISOR' | 'EMPLOYEE' | 'ORGANIZATION_MEMBER') => {
    try {
      await organizationManagementService.updateMemberRole(organizationId, memberId, role)
      toast({
        title: '성공',
        description: `구성원 역할이 ${roleConfig[role].label}로 변경되었습니다.`
      })
      loadMembers()
    } catch (error) {
      console.error('Failed to update member role:', error)
      toast({
        title: '오류',
        description: '구성원 역할 변경에 실패했습니다.',
        variant: 'destructive'
      })
    }
  }

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMembers(new Set(filteredMembers.map(m => m.id)))
    } else {
      setSelectedMembers(new Set())
    }
  }

  const handleSelectMember = (memberId: string, checked: boolean) => {
    const newSelected = new Set(selectedMembers)
    if (checked) {
      newSelected.add(memberId)
    } else {
      newSelected.delete(memberId)
    }
    setSelectedMembers(newSelected)
  }

  // Calculate statistics
  const activeMembers = members.filter(m => m.status === 'ACTIVE').length
  const pendingMembersCount = pendingMembers.length
  const suspendedMembers = members.filter(m => m.status === 'SUSPENDED').length

  // Debug: 역할별 구성원 수 확인
  console.log('Members by role:', {
    total: members.length,
    organizationAdmin: members.filter(m => m.role === 'ORGANIZATION_ADMIN').length,
    departmentManager: members.filter(m => m.role === 'DEPARTMENT_MANAGER').length,
    teamLeader: members.filter(m => m.role === 'TEAM_LEADER').length,
    supervisor: members.filter(m => m.role === 'SUPERVISOR').length,
    employee: members.filter(m => m.role === 'EMPLOYEE').length,
    organizationMember: members.filter(m => m.role === 'ORGANIZATION_MEMBER').length,
    pending: pendingMembersCount,
    totalWithPending: members.length + pendingMembersCount,
    allRoles: [...new Set(members.map(m => m.role))]
  })

  // Handle status filter changes
  const handleStatusFilterChange = (status: MemberStatusFilter) => {
    setSelectedStatusFilter(status)
    // Clear other status filters when using card filter
    if (filters.status) {
      setFilters({ ...filters, status: undefined })
    }
  }

  const isAllSelected = filteredMembers.length > 0 && selectedMembers.size === filteredMembers.length
  const isSomeSelected = selectedMembers.size > 0 && selectedMembers.size < filteredMembers.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">구성원 관리</h2>
          <p className="text-sm text-slate-600 mt-1">
            조직 구성원을 초대하고 권한을 관리할 수 있습니다.
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
          >
            <Upload className="w-4 h-4" />
            CSV 가져오기
          </Button>
          <Button 
            onClick={handleInviteMember} 
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            구성원 추가
          </Button>
        </div>
      </div>

      {/* Summary Cards - Filter Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card 
          className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
            selectedStatusFilter === 'ALL' 
              ? 'ring-2 ring-blue-500 bg-blue-50' 
              : 'hover:bg-slate-50'
          }`}
          onClick={() => handleStatusFilterChange('ALL')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">전체 구성원</p>
              <p className="text-2xl font-bold text-slate-900">{members.length + pendingMembersCount}</p>
            </div>
            <Users className="w-8 h-8 text-slate-400" />
          </div>
        </Card>
        <Card 
          className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
            selectedStatusFilter === 'ACTIVE' 
              ? 'ring-2 ring-green-500 bg-green-50' 
              : 'hover:bg-slate-50'
          }`}
          onClick={() => handleStatusFilterChange('ACTIVE')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">활성 구성원</p>
              <p className="text-2xl font-bold text-green-600">{activeMembers}</p>
            </div>
            <Users className="w-8 h-8 text-green-400" />
          </div>
        </Card>
        <Card 
          className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
            selectedStatusFilter === 'PENDING' 
              ? 'ring-2 ring-yellow-500 bg-yellow-50' 
              : 'hover:bg-slate-50'
          }`}
          onClick={() => handleStatusFilterChange('PENDING')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">가입 대기</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingMembersCount}</p>
            </div>
            <Users className="w-8 h-8 text-yellow-400" />
          </div>
        </Card>
        <Card 
          className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
            selectedStatusFilter === 'SUSPENDED' 
              ? 'ring-2 ring-red-500 bg-red-50' 
              : 'hover:bg-slate-50'
          }`}
          onClick={() => handleStatusFilterChange('SUSPENDED')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">정지된 구성원</p>
              <p className="text-2xl font-bold text-red-600">{suspendedMembers}</p>
            </div>
            <Users className="w-8 h-8 text-red-400" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="이름, 이메일, 사번으로 검색..."
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? undefined : value })}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="상태 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="ACTIVE">활성</SelectItem>
              <SelectItem value="INVITED">초대됨</SelectItem>
              <SelectItem value="SUSPENDED">정지됨</SelectItem>
              <SelectItem value="RESIGNED">퇴사함</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.role || 'all'}
            onValueChange={(value) => setFilters({ ...filters, role: value === 'all' ? undefined : value })}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="역할 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="ORGANIZATION_ADMIN">조직 관리자</SelectItem>
              <SelectItem value="DEPARTMENT_MANAGER">부서 관리자</SelectItem>
              <SelectItem value="TEAM_LEADER">팀 리더</SelectItem>
              <SelectItem value="SUPERVISOR">감독자</SelectItem>
              <SelectItem value="EMPLOYEE">일반 직원</SelectItem>
              <SelectItem value="ORGANIZATION_MEMBER">조직 구성원</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-slate-900">
                구성원 목록 
                {selectedStatusFilter !== 'ALL' && (
                  <span className="text-sm font-normal text-slate-500 ml-2">
                    ({selectedStatusFilter === 'ACTIVE' && '활성'}
                    {selectedStatusFilter === 'PENDING' && '가입 대기'}
                    {selectedStatusFilter === 'SUSPENDED' && '정지됨'} 구성원)
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-slate-600">
                {filteredMembers.length}명의 구성원 | {selectedMembers.size}명 선택됨
              </CardDescription>
            </div>
            {selectedMembers.size > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  일괄 편집
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                  일괄 삭제
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              <span className="ml-2 text-slate-600">구성원 목록을 불러오는 중...</span>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {filters.search || filters.status || filters.role ? '검색 결과가 없습니다' : '구성원이 없습니다'}
              </h3>
              <p className="text-slate-600 mb-4">
                {filters.search || filters.status || filters.role 
                  ? '다른 검색 조건을 시도해보세요' 
                  : '첫 번째 구성원을 초대해보세요'
                }
              </p>
              {!filters.search && !filters.status && !filters.role && (
                <Button onClick={handleInviteMember} className="gap-2">
                  <Plus className="w-4 h-4" />
                  구성원 추가
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-slate-900">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="모든 구성원 선택"
                      className={isSomeSelected ? "data-[state=checked]:bg-blue-600" : ""}
                    />
                  </TableHead>
                  <TableHead className="text-slate-900 font-medium">구성원</TableHead>
                  <TableHead className="text-slate-900 font-medium">사번</TableHead>
                  <TableHead className="text-slate-900 font-medium">부서</TableHead>
                  <TableHead className="text-slate-900 font-medium">직위</TableHead>
                  <TableHead className="text-slate-900 font-medium">역할</TableHead>
                  <TableHead className="text-slate-900 font-medium">상태</TableHead>
                  <TableHead className="text-slate-900 font-medium">가입일</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedMembers.has(member.id)}
                        onCheckedChange={(checked) => handleSelectMember(member.id, checked as boolean)}
                        aria-label={`${member.displayName} 선택`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          {member.profilePhotoUrl ? (
                            <AvatarImage src={member.profilePhotoUrl} alt={member.displayName} />
                          ) : (
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                              {member.displayName.charAt(0)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <div className="font-medium text-slate-900">{member.displayName}</div>
                          <div className="text-sm text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-slate-100 px-2 py-1 rounded">
                        {member.employeeId}
                      </code>
                    </TableCell>
                    <TableCell>
                      {member.departmentName ? (
                        <div>
                          <div className="font-medium text-slate-900">{member.departmentName}</div>
                          {member.position && (
                            <div className="text-sm text-slate-500">{member.position}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">미배정</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {member.jobTitle && (
                        <Badge variant="outline">{member.jobTitle}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={roleConfig[member.role]?.color || 'bg-gray-100 text-gray-700'}
                      >
                        {roleConfig[member.role]?.label || member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={statusConfig[member.status]?.color || 'bg-gray-100 text-gray-700'}
                      >
                        {statusConfig[member.status]?.label || member.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-600">
                        {new Date(member.joinedAt.toDate()).toLocaleDateString('ko-KR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditMember(member.id)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            편집
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleUpdateMemberStatus(
                              member.id, 
                              member.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
                            )}
                          >
                            {member.status === 'ACTIVE' ? (
                              <>
                                <UserX className="w-4 h-4 mr-2" />
                                정지
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-4 h-4 mr-2" />
                                활성화
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Member Create Modal */}
      <MemberCreateModal
        isOpen={inviteModalOpen}
        onClose={handleInviteModalClose}
        onSuccess={handleInviteModalSuccess}
        organizationId={organizationId}
        departments={departments}
      />
    </div>
  )
}