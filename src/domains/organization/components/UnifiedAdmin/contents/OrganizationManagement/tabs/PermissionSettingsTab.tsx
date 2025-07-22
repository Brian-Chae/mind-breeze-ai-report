/**
 * 권한 설정 탭 컴포넌트
 * 
 * 역할별 권한을 관리하고 구성원에게 할당하는 인터페이스
 */

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card'
import { Button } from '@ui/button'
import { Badge } from '@ui/badge'
import { Switch } from '@ui/switch'
import { Separator } from '@ui/separator'
import { 
  Shield, 
  Lock, 
  UserCheck, 
  Plus,
  Edit2,
  Save,
  RotateCcw,
  Building2,
  Users,
  FileText,
  Database,
  Settings,
  BarChart3,
  Smartphone,
  CreditCard,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ui/table"
import { toast } from 'sonner'

interface PermissionSettingsTabProps {
  organizationId: string
}

// Permission categories and items
const permissionCategories = [
  {
    id: 'organization',
    name: '기업 관리',
    icon: Building2,
    permissions: [
      { id: 'organization.view', name: '기업 정보 조회', description: '기업 기본 정보 및 통계 조회' },
      { id: 'organization.manage', name: '기업 정보 관리', description: '기업 정보 수정, 로고 업로드' }
    ]
  },
  {
    id: 'members',
    name: '구성원 관리',
    icon: Users,
    permissions: [
      { id: 'members.view', name: '구성원 조회', description: '구성원 목록 및 정보 조회' },
      { id: 'members.manage', name: '구성원 관리', description: '구성원 초대, 편집, 삭제' },
      { id: 'members.permissions', name: '권한 관리', description: '구성원 역할 및 권한 변경' }
    ]
  },
  {
    id: 'departments',
    name: '부서 관리',
    icon: Building2,
    permissions: [
      { id: 'departments.view', name: '부서 조회', description: '부서 구조 및 정보 조회' },
      { id: 'departments.manage', name: '부서 관리', description: '부서 생성, 수정, 삭제' }
    ]
  },
  {
    id: 'reports',
    name: '리포트',
    icon: BarChart3,
    permissions: [
      { id: 'reports.view', name: '리포트 조회', description: '분석 리포트 조회 및 다운로드' },
      { id: 'reports.manage', name: '리포트 관리', description: '리포트 생성, 편집, 삭제' },
      { id: 'reports.export', name: '리포트 내보내기', description: '리포트 PDF/Excel 내보내기' }
    ]
  },
  {
    id: 'devices',
    name: '디바이스 관리',
    icon: Smartphone,
    permissions: [
      { id: 'devices.view', name: '디바이스 조회', description: '디바이스 목록 및 상태 조회' },
      { id: 'devices.manage', name: '디바이스 관리', description: '디바이스 등록, 배정, 해제' },
      { id: 'devices.settings', name: '디바이스 설정', description: '디바이스 설정 변경' }
    ]
  },
  {
    id: 'credits',
    name: '크레딧 관리',
    icon: CreditCard,
    permissions: [
      { id: 'credits.view', name: '크레딧 조회', description: '크레딧 잔액 및 사용 내역 조회' },
      { id: 'credits.manage', name: '크레딧 관리', description: '크레딧 구매, 배분, 회수' }
    ]
  },
  {
    id: 'system',
    name: '시스템 설정',
    icon: Settings,
    permissions: [
      { id: 'system.view', name: '시스템 조회', description: '시스템 설정 및 로그 조회' },
      { id: 'system.manage', name: '시스템 관리', description: '시스템 설정 변경, 백업' }
    ]
  }
]

// Role configurations
const roles = [
  {
    id: 'ADMIN',
    name: '관리자',
    description: '모든 기능에 대한 전체 권한',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: Shield,
    memberCount: 2,
    defaultPermissions: [
      'organization.view', 'organization.manage',
      'members.view', 'members.manage', 'members.permissions',
      'departments.view', 'departments.manage',
      'reports.view', 'reports.manage', 'reports.export',
      'devices.view', 'devices.manage', 'devices.settings',
      'credits.view', 'credits.manage',
      'system.view', 'system.manage'
    ]
  },
  {
    id: 'MANAGER',
    name: '매니저',
    description: '팀 관리 및 리포트 생성 권한',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: UserCheck,
    memberCount: 5,
    defaultPermissions: [
      'organization.view',
      'members.view',
      'departments.view',
      'reports.view', 'reports.manage', 'reports.export',
      'devices.view', 'devices.manage'
    ]
  },
  {
    id: 'MEMBER',
    name: '일반 구성원',
    description: '기본 조회 및 사용 권한',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: Lock,
    memberCount: 118,
    defaultPermissions: [
      'organization.view',
      'members.view',
      'departments.view',
      'reports.view'
    ]
  }
]

export default function PermissionSettingsTab({ organizationId }: PermissionSettingsTabProps) {
  const [selectedRole, setSelectedRole] = useState(roles[0])
  const [permissions, setPermissions] = useState<Record<string, string[]>>(
    roles.reduce((acc, role) => {
      acc[role.id] = [...role.defaultPermissions]
      return acc
    }, {} as Record<string, string[]>)
  )
  const [hasChanges, setHasChanges] = useState(false)
  

  // Handle permission toggle
  const handlePermissionToggle = (roleId: string, permissionId: string, enabled: boolean) => {
    setPermissions(prev => {
      const rolePermissions = prev[roleId] || []
      const updated = enabled
        ? [...rolePermissions, permissionId]
        : rolePermissions.filter(p => p !== permissionId)
      
      setHasChanges(true)
      return {
        ...prev,
        [roleId]: updated
      }
    })
  }

  // Check if permission is enabled for role
  const hasPermission = (roleId: string, permissionId: string) => {
    return permissions[roleId]?.includes(permissionId) || false
  }

  // Handle save changes
  const handleSaveChanges = () => {
    // TODO: Save permissions to backend
    toast({
      title: '성공',
      description: '권한 설정이 저장되었습니다.'
    })
    setHasChanges(false)
  }

  // Handle reset changes
  const handleResetChanges = () => {
    setPermissions(
      roles.reduce((acc, role) => {
        acc[role.id] = [...role.defaultPermissions]
        return acc
      }, {} as Record<string, string[]>)
    )
    setHasChanges(false)
    toast({
      title: '초기화',
      description: '권한 설정이 기본값으로 초기화되었습니다.'
    })
  }

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
        <div className="flex gap-3">
          {hasChanges && (
            <>
              <Button variant="outline" onClick={handleResetChanges} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                초기화
              </Button>
              <Button onClick={handleSaveChanges} className="gap-2">
                <Save className="w-4 h-4" />
                변경사항 저장
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Warning Banner */}
      {hasChanges && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  저장되지 않은 변경사항이 있습니다
                </p>
                <p className="text-sm text-yellow-700">
                  권한 변경사항을 저장하지 않으면 손실됩니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roles.map((role) => {
          const Icon = role.icon
          const isSelected = selectedRole.id === role.id
          const rolePermissionCount = permissions[role.id]?.length || 0
          const totalPermissions = permissionCategories.reduce((sum, cat) => sum + cat.permissions.length, 0)
          
          return (
            <Card 
              key={role.id} 
              className={`cursor-pointer transition-all hover:shadow-lg ${
                isSelected ? `border-2 ${role.color}` : 'border border-slate-200'
              }`}
              onClick={() => setSelectedRole(role)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${role.color.split(' ')[0]} ${role.color.split(' ')[1].replace('text-', 'bg-').replace('-700', '-100')}`}>
                    <Icon className={`w-6 h-6 ${role.color.split(' ')[1].replace('bg-', 'text-').replace('-100', '-600')}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-slate-900">{role.name}</h3>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <p className="text-sm text-slate-900 mb-4">{role.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={role.color}>
                        {role.memberCount}명
                      </Badge>
                      <div className="text-xs text-slate-500">
                        {rolePermissionCount}/{totalPermissions} 권한
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Permission Matrix */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-50 rounded-lg">
              <Shield className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-slate-900">{selectedRole.name} 권한 설정</CardTitle>
              <CardDescription>
                <span className="text-slate-900">{selectedRole.description}</span> - <span className="text-slate-900">각 기능별 세부 권한을 설정하세요</span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {permissionCategories.map((category) => {
            const Icon = category.icon
            const categoryPermissions = category.permissions
            const enabledCount = categoryPermissions.filter(p => 
              hasPermission(selectedRole.id, p.id)
            ).length
            
            return (
              <div key={category.id}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-slate-100 rounded">
                    <Icon className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900">{category.name}</h4>
                    <p className="text-sm text-slate-500">
                      {enabledCount}/{categoryPermissions.length}개 권한 활성
                    </p>
                  </div>
                </div>

                <div className="space-y-3 ml-9">
                  {categoryPermissions.map((permission) => {
                    const isEnabled = hasPermission(selectedRole.id, permission.id)
                    
                    return (
                      <div 
                        key={permission.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">{permission.name}</div>
                          <div className="text-sm text-slate-500">{permission.description}</div>
                        </div>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(checked) => 
                            handlePermissionToggle(selectedRole.id, permission.id, checked)
                          }
                        />
                      </div>
                    )
                  })}
                </div>

                {category.id !== permissionCategories[permissionCategories.length - 1].id && (
                  <Separator className="mt-6" />
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Permission Summary */}
      <Card>
        <CardHeader>
          <CardTitle>권한 요약</CardTitle>
          <CardDescription>현재 설정된 모든 역할의 권한을 한눈에 확인하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>기능</TableHead>
                {roles.map(role => (
                  <TableHead key={role.id} className="text-center">
                    {role.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissionCategories.map(category => 
                category.permissions.map(permission => (
                  <TableRow key={permission.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{permission.name}</div>
                        <div className="text-sm text-slate-500">{category.name}</div>
                      </div>
                    </TableCell>
                    {roles.map(role => (
                      <TableCell key={role.id} className="text-center">
                        {hasPermission(role.id, permission.id) ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-slate-200 mx-auto" />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}