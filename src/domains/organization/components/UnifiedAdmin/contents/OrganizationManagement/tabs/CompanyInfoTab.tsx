/**
 * 기업 정보 탭 컴포넌트
 * 
 * 기업 기본 정보를 조회하고 수정하는 폼 인터페이스
 */

import React from 'react'
import { Card } from '@ui/card'
import { Button } from '@ui/button'
import { Building2 } from 'lucide-react'
import type { Organization } from '@domains/organization/types/management/organization-management'

interface CompanyInfoTabProps {
  organization: Organization
  onUpdate: () => void
}

export default function CompanyInfoTab({ organization, onUpdate }: CompanyInfoTabProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">기업 정보</h2>
          <p className="text-sm text-slate-600 mt-1">
            기업의 기본 정보를 관리하고 업데이트할 수 있습니다.
          </p>
        </div>
        <Button>
          정보 수정
        </Button>
      </div>

      {/* Content Card */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-blue-50 rounded-lg">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-slate-900">기업 상세 정보</h3>
            <p className="text-sm text-slate-600">등록된 기업 정보를 확인하세요</p>
          </div>
        </div>

        {/* TODO: Implement company info form */}
        <div className="text-center py-12 text-slate-500">
          <p>기업 정보 폼이 여기에 구현됩니다.</p>
          <p className="text-sm mt-2">조직 코드: {organization.organizationCode}</p>
        </div>
      </Card>
    </div>
  )
}