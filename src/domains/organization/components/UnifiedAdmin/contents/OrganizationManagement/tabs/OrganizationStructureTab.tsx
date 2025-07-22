/**
 * 조직 구조 탭 컴포넌트
 * 
 * 부서 계층 구조를 시각화하고 관리하는 인터페이스
 */

import React, { useState, useEffect } from 'react'
import { Card } from '@ui/card'
import { Button } from '@ui/button'
import { Network, Plus, Loader2 } from 'lucide-react'
import { useToast } from '@shared/hooks/use-toast'
import organizationManagementService from '@domains/organization/services/management/OrganizationManagementService'
import type { DepartmentNode } from '@domains/organization/types/management/organization-management'

interface OrganizationStructureTabProps {
  organizationId: string
}

export default function OrganizationStructureTab({ organizationId }: OrganizationStructureTabProps) {
  const [departments, setDepartments] = useState<DepartmentNode[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadDepartmentHierarchy()
  }, [organizationId])

  const loadDepartmentHierarchy = async () => {
    try {
      setLoading(true)
      const hierarchy = await organizationManagementService.getDepartmentHierarchy(organizationId)
      setDepartments(hierarchy)
    } catch (error) {
      console.error('Failed to load departments:', error)
      toast({
        title: '오류',
        description: '부서 정보를 불러오는데 실패했습니다.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">조직 구조</h2>
          <p className="text-sm text-slate-600 mt-1">
            부서 계층 구조를 관리하고 조직도를 확인할 수 있습니다.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          부서 추가
        </Button>
      </div>

      {/* Content Card */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-green-50 rounded-lg">
            <Network className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-medium text-slate-900">부서 조직도</h3>
            <p className="text-sm text-slate-600">드래그 앤 드롭으로 조직 구조를 변경할 수 있습니다</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <p>조직도 시각화가 여기에 구현됩니다.</p>
            <p className="text-sm mt-2">총 {departments.length}개의 최상위 부서</p>
          </div>
        )}
      </Card>
    </div>
  )
}