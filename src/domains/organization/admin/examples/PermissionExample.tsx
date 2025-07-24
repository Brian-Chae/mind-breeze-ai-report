/**
 * 권한 시스템 사용 예시
 * 
 * PermissionGuard와 useAdminConfig를 활용한 실제 사용 예시입니다.
 */

import React from 'react'
import { Button } from '@ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { Plus, Edit, Trash2, Users, Shield, CreditCard } from 'lucide-react'
import { 
  Permission, 
  PermissionGuard, 
  FeatureGuard,
  MultiPermissionGuard,
  AnyPermissionGuard,
  useAdminConfig,
  usePermission,
  getUserTypeDisplayName
} from '../core'

export function PermissionExample() {
  const { userType, permissions, hasPermission } = useAdminConfig()
  
  return (
    <div className="space-y-6">
      {/* 현재 사용자 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>현재 사용자 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>사용자 타입: <strong>{getUserTypeDisplayName(userType)}</strong></p>
            <p>권한 개수: <strong>{permissions.length}개</strong></p>
          </div>
        </CardContent>
      </Card>

      {/* 단일 권한 체크 예시 */}
      <Card>
        <CardHeader>
          <CardTitle>디바이스 관리</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 디바이스 추가 버튼 - WRITE_DEVICES 권한 필요 */}
          <PermissionGuard permission={Permission.WRITE_DEVICES}>
            <Button className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              새 디바이스 추가
            </Button>
          </PermissionGuard>
          
          {/* 디바이스 할당 버튼 - ASSIGN_DEVICES 권한 필요 */}
          <PermissionGuard 
            permission={Permission.ASSIGN_DEVICES}
            fallback={
              <Button variant="outline" disabled className="w-full">
                <Users className="w-4 h-4 mr-2" />
                디바이스 할당 (권한 없음)
              </Button>
            }
          >
            <Button variant="outline" className="w-full">
              <Users className="w-4 h-4 mr-2" />
              디바이스 할당
            </Button>
          </PermissionGuard>
          
          {/* 디바이스 삭제 버튼 - DELETE_DEVICES 권한 필요, 권한 없으면 숨김 */}
          <PermissionGuard 
            permission={Permission.DELETE_DEVICES}
            hideWhenUnauthorized
          >
            <Button variant="destructive" className="w-full">
              <Trash2 className="w-4 h-4 mr-2" />
              디바이스 삭제
            </Button>
          </PermissionGuard>
        </CardContent>
      </Card>

      {/* 다중 권한 체크 예시 (AND 조건) */}
      <Card>
        <CardHeader>
          <CardTitle>시스템 관리</CardTitle>
        </CardHeader>
        <CardContent>
          <MultiPermissionGuard
            permissions={[Permission.SYSTEM_ADMIN, Permission.VIEW_ANALYTICS]}
            fallback={
              <div className="text-center p-4 text-gray-500">
                시스템 관리자 권한과 분석 조회 권한이 모두 필요합니다.
              </div>
            }
          >
            <Button variant="outline" className="w-full">
              <Shield className="w-4 h-4 mr-2" />
              시스템 분석 대시보드
            </Button>
          </MultiPermissionGuard>
        </CardContent>
      </Card>

      {/* 다중 권한 체크 예시 (OR 조건) */}
      <Card>
        <CardHeader>
          <CardTitle>크레딧 관리</CardTitle>
        </CardHeader>
        <CardContent>
          <AnyPermissionGuard
            permissions={[Permission.MANAGE_CREDITS, Permission.PURCHASE_CREDITS]}
            fallback={
              <div className="text-center p-4 text-gray-500">
                크레딧 관리 또는 구매 권한이 필요합니다.
              </div>
            }
          >
            <Button className="w-full">
              <CreditCard className="w-4 h-4 mr-2" />
              크레딧 관리
            </Button>
          </AnyPermissionGuard>
        </CardContent>
      </Card>

      {/* 기능 가드 예시 */}
      <Card>
        <CardHeader>
          <CardTitle>사용자 관리</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FeatureGuard feature="invite-user">
            <Button variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              사용자 초대
            </Button>
          </FeatureGuard>
          
          <FeatureGuard 
            feature="edit-user"
            hideWhenUnauthorized
          >
            <Button variant="outline" className="w-full">
              <Edit className="w-4 h-4 mr-2" />
              사용자 정보 수정
            </Button>
          </FeatureGuard>
        </CardContent>
      </Card>

      {/* Hook을 사용한 조건부 렌더링 */}
      <Card>
        <CardHeader>
          <CardTitle>프로그래밍 방식 권한 체크</CardTitle>
        </CardHeader>
        <CardContent>
          {hasPermission(Permission.SYSTEM_ADMIN) ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800">시스템 관리자 권한이 있습니다.</p>
            </div>
          ) : (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded">
              <p className="text-orange-800">시스템 관리자 권한이 없습니다.</p>
            </div>
          )}
          
          {/* usePermission hook 사용 */}
          <PermissionCheckExample />
        </CardContent>
      </Card>
    </div>
  )
}

// usePermission hook 사용 예시
function PermissionCheckExample() {
  const canWriteDevices = usePermission(Permission.WRITE_DEVICES)
  const canManageCredits = usePermission(Permission.MANAGE_CREDITS)
  
  return (
    <div className="mt-4 space-y-2">
      <p>디바이스 쓰기 권한: {canWriteDevices ? '✅ 있음' : '❌ 없음'}</p>
      <p>크레딧 관리 권한: {canManageCredits ? '✅ 있음' : '❌ 없음'}</p>
    </div>
  )
}