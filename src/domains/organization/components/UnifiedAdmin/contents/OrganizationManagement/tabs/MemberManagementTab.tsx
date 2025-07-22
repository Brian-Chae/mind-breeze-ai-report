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
import type { OrganizationMember, Department } from '@domains/organization/types/management/organization-management'
import MemberInviteModal from '../components/MemberInviteModal'

interface MemberManagementTabProps {
  organizationId: string
}

interface MemberFilters {
  departmentId?: string
  status?: string
  role?: string
  search?: string
}

// Status configuration
const statusConfig = {
  ACTIVE: { label: '활성', color: 'bg-green-100 text-green-700' },
  INVITED: { label: '초대됨', color: 'bg-yellow-100 text-yellow-700' },
  SUSPENDED: { label: '정지됨', color: 'bg-red-100 text-red-700' },
  RESIGNED: { label: '퇴사함', color: 'bg-gray-100 text-gray-700' }
}

// Role configuration
const roleConfig = {
  ADMIN: { label: '관리자', color: 'bg-red-100 text-red-700' },
  MANAGER: { label: '매니저', color: 'bg-blue-100 text-blue-700' },
  MEMBER: { label: '구성원', color: 'bg-gray-100 text-gray-700' }
}

export default function MemberManagementTab({ organizationId }: MemberManagementTabProps) {
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [filteredMembers, setFilteredMembers] = useState<OrganizationMember[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<MemberFilters>({})
  
  // Modal states
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  
  

  useEffect(() => {
    loadMembers()
    loadDepartments()
  }, [organizationId])

  useEffect(() => {
    applyFilters()
  }, [members, filters])

  const loadMembers = async () => {
    try {
      setLoading(true)
      const memberList = await organizationManagementService.getMembers(organizationId)
      setMembers(memberList)
    } catch (error) {
      console.error('Failed to load members:', error)
      toast({
        title: '오류',
        description: '구성원 목록을 불러오는데 실패했습니다.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
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

  const applyFilters = () => {
    let filtered = [...members]

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(member => 
        member.displayName.toLowerCase().includes(searchTerm) ||
        member.email.toLowerCase().includes(searchTerm) ||
        member.employeeId.toLowerCase().includes(searchTerm) ||
        (member.departmentName && member.departmentName.toLowerCase().includes(searchTerm))
      )
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(member => member.status === filters.status)
    }

    // Role filter
    if (filters.role) {
      filtered = filtered.filter(member => member.role === filters.role)
    }

    // Department filter
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

  const handleUpdateMemberRole = async (memberId: string, role: 'ADMIN' | 'MANAGER' | 'MEMBER') => {
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
  const invitedMembers = members.filter(m => m.status === 'INVITED').length
  const suspendedMembers = members.filter(m => m.status === 'SUSPENDED').length

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
          <Button variant="outline" className="gap-2">
            <Upload className="w-4 h-4" />
            CSV 가져오기
          </Button>
          <Button onClick={handleInviteMember} className="gap-2">
            <Plus className="w-4 h-4" />
            구성원 초대
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">전체 구성원</p>
              <p className="text-2xl font-bold text-slate-900">{members.length}</p>
            </div>
            <Users className="w-8 h-8 text-slate-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">활성 구성원</p>
              <p className="text-2xl font-bold text-green-600">{activeMembers}</p>
            </div>
            <Users className="w-8 h-8 text-green-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">초대 대기</p>
              <p className="text-2xl font-bold text-yellow-600">{invitedMembers}</p>
            </div>
            <Users className="w-8 h-8 text-yellow-400" />
          </div>
        </Card>
        <Card className="p-4">
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
            value={filters.status || ''}
            onValueChange={(value) => setFilters({ ...filters, status: value || undefined })}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="상태 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체</SelectItem>
              <SelectItem value="ACTIVE">활성</SelectItem>
              <SelectItem value="INVITED">초대됨</SelectItem>
              <SelectItem value="SUSPENDED">정지됨</SelectItem>
              <SelectItem value="RESIGNED">퇴사함</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.role || ''}
            onValueChange={(value) => setFilters({ ...filters, role: value || undefined })}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="역할 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체</SelectItem>
              <SelectItem value="ADMIN">관리자</SelectItem>
              <SelectItem value="MANAGER">매니저</SelectItem>
              <SelectItem value="MEMBER">구성원</SelectItem>
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
              <CardTitle>구성원 목록</CardTitle>
              <CardDescription>
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
                  구성원 초대
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="모든 구성원 선택"
                      className={isSomeSelected ? "data-[state=checked]:bg-blue-600" : ""}
                    />
                  </TableHead>
                  <TableHead>구성원</TableHead>
                  <TableHead>사번</TableHead>
                  <TableHead>부서</TableHead>
                  <TableHead>직위</TableHead>
                  <TableHead>역할</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>가입일</TableHead>
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
                        className={roleConfig[member.role].color}
                      >
                        {roleConfig[member.role].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={statusConfig[member.status].color}
                      >
                        {statusConfig[member.status].label}
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

      {/* Member Invite Modal */}
      <MemberInviteModal
        isOpen={inviteModalOpen}
        onClose={handleInviteModalClose}
        onSuccess={handleInviteModalSuccess}
        organizationId={organizationId}
        departments={departments}
      />
    </div>
  )
}