/**
 * 사용자 관리 메인 컨테이너
 * 
 * 사용자 목록, 측정 이력, 리포트 관리를 하는 통합 인터페이스
 * 기업 관리 페이지와 동일한 디자인 패턴 적용
 */

import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import enterpriseAuthService from '../../../services/EnterpriseAuthService'
import measurementUserManagementService, { MeasurementUser } from '@domains/individual/services/MeasurementUserManagementService'

// Components
import UserListTab from './tabs/UserListTab'
import UserManagementSummary from './components/UserManagementSummary'

export default function UserManagementContent() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<MeasurementUser[]>([])

  // Get current organization context
  const currentContext = enterpriseAuthService.getCurrentContext()
  const organizationId = currentContext.user?.organizationId

  // Load user management data function
  const loadUserManagementData = async () => {
    if (!organizationId) {
      setError('조직 정보를 찾을 수 없습니다.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      // Load users data
      const userList = await measurementUserManagementService.getMeasurementUsers({ organizationId })
      setUsers(userList)
    } catch (err) {
      console.error('Failed to load user management data:', err)
      setError('사용자 관리 데이터 로딩 중 오류가 발생했습니다.')
      toast.error('데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // Load initial data
  useEffect(() => {
    loadUserManagementData()
  }, [organizationId])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">사용자 관리 데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">오류</h2>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Summary Section - 기업 관리 페이지와 동일한 스타일 */}
        <UserManagementSummary 
          onUserAdded={() => loadUserManagementData()}
          onExport={() => toast.info('내보내기 기능은 곧 추가될 예정입니다.')}
        />

        {/* 사용자 목록 컨텐츠 */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <UserListTab organizationId={organizationId!} />
        </div>
      </div>
    </div>
  )
}