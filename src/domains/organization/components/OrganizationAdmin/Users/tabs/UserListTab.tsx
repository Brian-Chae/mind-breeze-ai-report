/**
 * 사용자 목록 탭 컴포넌트
 * 
 * 측정 대상자를 조회, 등록, 관리하는 인터페이스
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card'
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { Badge } from '@ui/badge'
import { Checkbox } from '@ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/select'
import { 
  Users, 
  Plus, 
  Upload, 
  Loader2,
  Search,
  Download,
  User,
  Mail,
  Phone,
  Calendar,
  Activity,
  FileText,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  AlertCircle
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
import measurementUserManagementService, { MeasurementUser, BulkCreateResult } from '@domains/individual/services/MeasurementUserManagementService'
import enterpriseAuthService from '../../../../services/EnterpriseAuthService'
import BulkUserUploadModal from '../BulkUserUploadModal'

interface UserListTabProps {
  organizationId: string
}

interface UserFilters {
  search?: string
  status?: string
  gender?: string
}

export default function UserListTab({ organizationId }: UserListTabProps) {
  const [users, setUsers] = useState<MeasurementUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<MeasurementUser[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<UserFilters>({})
  
  // Modal states
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [organizationId])

  useEffect(() => {
    applyFilters()
  }, [users, filters])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const userList = await measurementUserManagementService.getMeasurementUsers({ organizationId })
      setUsers(userList)
    } catch (error) {
      console.error('Failed to load users:', error)
      toast.error('사용자 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...users]

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(user => 
        user.displayName.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        (user.phone && user.phone.toLowerCase().includes(searchTerm))
      )
    }

    if (filters.status) {
      filtered = filtered.filter(user => 
        filters.status === 'active' ? user.isActive : !user.isActive
      )
    }

    if (filters.gender) {
      filtered = filtered.filter(user => user.gender === filters.gender)
    }

    setFilteredUsers(filtered)
  }

  // Handle bulk upload success
  const handleBulkUploadSuccess = (result: BulkCreateResult) => {
    setShowBulkUploadModal(false)
    loadUsers()
    toast.success(`대량 등록 완료: 성공 ${result.successfulRows.length}개, 실패 ${result.failedRows.length}개`)
  }

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)))
    } else {
      setSelectedUsers(new Set())
    }
  }

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers)
    if (checked) {
      newSelected.add(userId)
    } else {
      newSelected.delete(userId)
    }
    setSelectedUsers(newSelected)
  }

  // Calculate statistics
  const activeUsers = users.filter(u => u.isActive).length
  const inactiveUsers = users.filter(u => !u.isActive).length

  const isAllSelected = filteredUsers.length > 0 && selectedUsers.size === filteredUsers.length
  const isSomeSelected = selectedUsers.size > 0 && selectedUsers.size < filteredUsers.length

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-700' 
      : 'bg-gray-100 text-gray-700'
  }

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'MALE': return '남성'
      case 'FEMALE': return '여성'
      default: return '미정'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">사용자 목록</h2>
          <p className="text-sm text-slate-600 mt-1">
            측정 대상자를 등록하고 관리할 수 있습니다.
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
          >
            <Download className="w-4 h-4" />
            내보내기
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200">
                <Plus className="w-4 h-4" />
                사용자 추가
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {/* TODO: 개별 등록 모달 */}}>
                <User className="w-4 h-4 mr-2" />
                개별 등록
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowBulkUploadModal(true)}>
                <Upload className="w-4 h-4 mr-2" />
                대량 등록 (CSV)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>


      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="이름, 이메일, 전화번호로 검색..."
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
              <SelectItem value="active">활성</SelectItem>
              <SelectItem value="inactive">비활성</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.gender || 'all'}
            onValueChange={(value) => setFilters({ ...filters, gender: value === 'all' ? undefined : value })}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="성별 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="MALE">남성</SelectItem>
              <SelectItem value="FEMALE">여성</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-slate-900">
                사용자 목록
              </CardTitle>
              <CardDescription className="text-slate-600">
                {filteredUsers.length}명의 사용자 | {selectedUsers.size}명 선택됨
              </CardDescription>
            </div>
            {selectedUsers.size > 0 && (
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
              <span className="ml-2 text-slate-600">사용자 목록을 불러오는 중...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {filters.search || filters.status || filters.gender ? '검색 결과가 없습니다' : '사용자가 없습니다'}
              </h3>
              <p className="text-slate-600 mb-4">
                {filters.search || filters.status || filters.gender
                  ? '다른 검색 조건을 시도해보세요' 
                  : '첫 번째 사용자를 등록해보세요'
                }
              </p>
              {!filters.search && !filters.status && !filters.gender && (
                <Button onClick={() => setShowBulkUploadModal(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  사용자 추가
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
                      aria-label="모든 사용자 선택"
                      className={isSomeSelected ? "data-[state=checked]:bg-blue-600" : ""}
                    />
                  </TableHead>
                  <TableHead className="text-slate-900 font-medium">사용자</TableHead>
                  <TableHead className="text-slate-900 font-medium">연락처</TableHead>
                  <TableHead className="text-slate-900 font-medium">성별/나이</TableHead>
                  <TableHead className="text-slate-900 font-medium">측정</TableHead>
                  <TableHead className="text-slate-900 font-medium">리포트</TableHead>
                  <TableHead className="text-slate-900 font-medium">상태</TableHead>
                  <TableHead className="text-slate-900 font-medium">가입일</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.has(user.id)}
                        onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                        aria-label={`${user.displayName} 선택`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{user.displayName}</div>
                          <div className="text-sm text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.phone && (
                        <div className="text-sm text-slate-600 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {user.phone}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-600">
                        {getGenderLabel(user.gender)} • {user.age || '미정'}세
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-600 flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        {user.measurementCount || 0}회
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-600 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {user.reportIds?.length || 0}개
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={getStatusColor(user.isActive)}
                      >
                        {user.isActive ? '활성' : '비활성'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-600 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {user.createdAt?.toLocaleDateString('ko-KR') || '-'}
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
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            상세 보기
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            편집
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

      {/* Bulk Upload Modal */}
      <BulkUserUploadModal
        isOpen={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
        onSuccess={handleBulkUploadSuccess}
      />
    </div>
  )
}