/**
 * 사용자 통계 카드 컴포넌트
 * 
 * 사용자 관리 페이지의 통계 정보를 표시하는 카드들
 */

import React from 'react'
import { Card } from '@ui/card'
import { Users } from 'lucide-react'

interface UserStatisticsCardsProps {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  loading?: boolean
}

export default function UserStatisticsCards({ 
  totalUsers, 
  activeUsers, 
  inactiveUsers,
  loading = false 
}: UserStatisticsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">전체 사용자</p>
            <p className="text-2xl font-bold text-slate-900">
              {loading ? '-' : totalUsers}
            </p>
          </div>
          <Users className="w-8 h-8 text-slate-400" />
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">활성 사용자</p>
            <p className="text-2xl font-bold text-green-600">
              {loading ? '-' : activeUsers}
            </p>
          </div>
          <Users className="w-8 h-8 text-green-400" />
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">비활성 사용자</p>
            <p className="text-2xl font-bold text-gray-600">
              {loading ? '-' : inactiveUsers}
            </p>
          </div>
          <Users className="w-8 h-8 text-gray-400" />
        </div>
      </Card>
    </div>
  )
}