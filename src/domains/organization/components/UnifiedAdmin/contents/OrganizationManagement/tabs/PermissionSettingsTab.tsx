/**
 * 권한 설정 탭 컴포넌트
 * 
 * 역할별 권한을 관리하고 구성원에게 할당하는 인터페이스
 */

import React from 'react'
import { Card } from '@ui/card'
import { Button } from '@ui/button'
import { Shield, Lock, UserCheck } from 'lucide-react'

interface PermissionSettingsTabProps {
  organizationId: string
}

export default function PermissionSettingsTab({ organizationId }: PermissionSettingsTabProps) {
  // Predefined roles
  const roles = [
    {
      id: 'ADMIN',
      name: '관리자',
      description: '모든 기능에 대한 전체 권한',
      color: 'bg-red-100 text-red-700',
      icon: Shield,
      memberCount: 2
    },
    {
      id: 'MANAGER',
      name: '매니저',
      description: '팀 관리 및 리포트 생성 권한',
      color: 'bg-blue-100 text-blue-700',
      icon: UserCheck,
      memberCount: 5
    },
    {
      id: 'MEMBER',
      name: '일반 구성원',
      description: '기본 조회 및 사용 권한',
      color: 'bg-green-100 text-green-700',
      icon: Lock,
      memberCount: 118
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">권한 설정</h2>
          <p className="text-sm text-slate-600 mt-1">
            역할별 권한을 설정하고 구성원에게 할당합니다.
          </p>
        </div>
        <Button>
          역할 추가
        </Button>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roles.map((role) => {
          const Icon = role.icon
          return (
            <Card key={role.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${role.color.replace('text-', 'bg-').replace('-700', '-100')}`}>
                  <Icon className={`w-6 h-6 ${role.color.replace('bg-', 'text-').replace('-100', '-600')}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{role.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">{role.description}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${role.color}`}>
                      {role.memberCount}명
                    </span>
                    <Button variant="ghost" size="sm">
                      편집
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Permission Matrix Card */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-orange-50 rounded-lg">
            <Shield className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="font-medium text-slate-900">권한 매트릭스</h3>
            <p className="text-sm text-slate-600">각 역할별 세부 권한을 설정하세요</p>
          </div>
        </div>

        <div className="text-center py-12 text-slate-500">
          <p>권한 매트릭스 테이블이 여기에 구현됩니다.</p>
          <p className="text-sm mt-2">기능별 상세 권한 설정</p>
        </div>
      </Card>
    </div>
  )
}