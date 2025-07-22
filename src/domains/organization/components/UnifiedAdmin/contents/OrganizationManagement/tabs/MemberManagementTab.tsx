/**
 * 구성원 관리 탭 컴포넌트
 * 
 * 조직 구성원을 조회, 초대, 관리하는 인터페이스
 */

import React, { useState, useEffect } from 'react'
import { Card } from '@ui/card'
import { Button } from '@ui/button'
import { Users, Plus, Upload, Loader2 } from 'lucide-react'
import { useToast } from '@shared/hooks/use-toast'
import organizationManagementService from '@domains/organization/services/management/OrganizationManagementService'
import type { OrganizationMember } from '@domains/organization/types/management/organization-management'

interface MemberManagementTabProps {
  organizationId: string
}

export default function MemberManagementTab({ organizationId }: MemberManagementTabProps) {
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    departmentId: undefined,
    status: undefined,
    role: undefined
  })
  const { toast } = useToast()

  useEffect(() => {
    loadMembers()
  }, [organizationId, filters])

  const loadMembers = async () => {
    try {
      setLoading(true)
      const memberList = await organizationManagementService.getMembers(organizationId, filters)
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

  const activeMembers = members.filter(m => m.status === 'ACTIVE').length
  const invitedMembers = members.filter(m => m.status === 'INVITED').length

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
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            구성원 초대
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <p className="text-2xl font-bold text-orange-600">{invitedMembers}</p>
            </div>
            <Users className="w-8 h-8 text-orange-400" />
          </div>
        </Card>
      </div>

      {/* Members Table Card */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-purple-50 rounded-lg">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-medium text-slate-900">구성원 목록</h3>
            <p className="text-sm text-slate-600">역할과 권한을 관리하세요</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <p>구성원 테이블이 여기에 구현됩니다.</p>
            <p className="text-sm mt-2">총 {members.length}명의 구성원</p>
          </div>
        )}
      </Card>
    </div>
  )
}