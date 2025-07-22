/**
 * 구성원 초대 모달 컴포넌트
 * 
 * 새로운 구성원을 초대하는 모달 다이얼로그
 */

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@ui/dialog"
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { Label } from '@ui/label'
import { Textarea } from '@ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/tabs'
import { Switch } from '@ui/switch'
import { 
  Users, 
  Mail, 
  User,
  Building2,
  Briefcase,
  Shield,
  UserPlus,
  Upload,
  X,
  Plus
} from 'lucide-react'
import { toast } from 'sonner'
import organizationManagementService from '@domains/organization/services/management/OrganizationManagementService'
import type { Department, InviteMemberData } from '@domains/organization/types/management/organization-management'

// Single invitation form schema
const singleInviteSchema = z.object({
  email: z.string().email('올바른 이메일 형식을 입력해주세요'),
  name: z.string().min(2, '이름은 2자 이상이어야 합니다'),
  departmentId: z.string().optional(),
  position: z.string().optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER']),
  sendInvitation: z.boolean().default(true)
})

type SingleInviteFormData = z.infer<typeof singleInviteSchema>

interface MemberInviteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  organizationId: string
  departments: Department[]
}

export default function MemberInviteModal({
  isOpen,
  onClose,
  onSuccess,
  organizationId,
  departments
}: MemberInviteModalProps) {
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('single')
  

  // Single invitation form
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch
  } = useForm<SingleInviteFormData>({
    resolver: zodResolver(singleInviteSchema),
    defaultValues: {
      email: '',
      name: '',
      departmentId: '',
      position: '',
      role: 'MEMBER',
      sendInvitation: true
    }
  })

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      reset()
      setActiveTab('single')
    }
  }, [isOpen, reset])

  // Role options
  const roleOptions = [
    { value: 'ADMIN', label: '관리자', description: '모든 권한' },
    { value: 'MANAGER', label: '매니저', description: '팀 관리 권한' },
    { value: 'MEMBER', label: '구성원', description: '기본 권한' }
  ]

  // Handle single invitation
  const onSubmitSingle = async (data: SingleInviteFormData) => {
    setSaving(true)
    try {
      const inviteData: InviteMemberData = {
        email: data.email,
        name: data.name,
        departmentId: data.departmentId || undefined,
        position: data.position || undefined,
        role: data.role,
        sendInvitation: data.sendInvitation
      }

      await organizationManagementService.inviteMember(organizationId, inviteData)
      
      toast({
        title: '성공',
        description: `${data.name}님을 성공적으로 초대했습니다.`
      })

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Member invitation failed:', error)
      toast({
        title: '오류',
        description: '구성원 초대에 실패했습니다.',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  // Handle bulk invitation (CSV)
  const handleBulkInvite = () => {
    // TODO: CSV 업로드 및 일괄 초대 구현
    toast({
      title: '개발 중',
      description: 'CSV 일괄 초대 기능은 곧 제공될 예정입니다.'
    })
  }

  // Handle close
  const handleClose = () => {
    if (!saving) {
      reset()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <DialogTitle>구성원 초대</DialogTitle>
              <DialogDescription>
                새로운 구성원을 조직에 초대합니다
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single" className="gap-2">
              <UserPlus className="w-4 h-4" />
              개별 초대
            </TabsTrigger>
            <TabsTrigger value="bulk" className="gap-2">
              <Upload className="w-4 h-4" />
              일괄 초대
            </TabsTrigger>
          </TabsList>

          {/* 개별 초대 탭 */}
          <TabsContent value="single" className="space-y-4">
            <form onSubmit={handleSubmit(onSubmitSingle)} className="space-y-4">
              {/* 이메일 */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  이메일 <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="user@example.com"
                    className="pl-10"
                    disabled={saving}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* 이름 */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  이름 <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="홍길동"
                    className="pl-10"
                    disabled={saving}
                  />
                </div>
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              {/* 부서 */}
              <div className="space-y-2">
                <Label htmlFor="departmentId">부서</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 w-4 h-4 text-slate-400 z-10" />
                  <Select
                    value={watch('departmentId') || ''}
                    onValueChange={(value) => setValue('departmentId', value || undefined)}
                    disabled={saving}
                  >
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="부서 선택 (선택사항)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">부서 미배정</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {'  '.repeat(dept.level)}{dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 직위 */}
              <div className="space-y-2">
                <Label htmlFor="position">직위</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    id="position"
                    {...register('position')}
                    placeholder="팀장, 매니저, 개발자 등"
                    className="pl-10"
                    disabled={saving}
                  />
                </div>
              </div>

              {/* 역할 */}
              <div className="space-y-2">
                <Label htmlFor="role">
                  역할 <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 w-4 h-4 text-slate-400 z-10" />
                  <Select
                    value={watch('role')}
                    onValueChange={(value) => setValue('role', value as any)}
                    disabled={saving}
                  >
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="역할 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          <div>
                            <div className="font-medium">{role.label}</div>
                            <div className="text-xs text-slate-500">{role.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 초대 이메일 발송 */}
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div>
                  <div className="font-medium">초대 이메일 발송</div>
                  <div className="text-sm text-slate-500">
                    초대 링크가 포함된 이메일을 발송합니다
                  </div>
                </div>
                <Switch
                  checked={watch('sendInvitation')}
                  onCheckedChange={(checked) => setValue('sendInvitation', checked)}
                  disabled={saving}
                />
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={saving}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={saving || !isDirty}
                  className="gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  {saving ? '초대 중...' : '초대 보내기'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          {/* 일괄 초대 탭 */}
          <TabsContent value="bulk" className="space-y-4">
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                <Upload className="w-8 h-8 text-slate-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">CSV 파일로 일괄 초대</h3>
                <p className="text-slate-600 mb-4">
                  CSV 파일을 업로드하여 여러 구성원을 한 번에 초대할 수 있습니다.
                </p>
                <div className="text-sm text-slate-500 space-y-1">
                  <p>필수 컬럼: 이메일, 이름, 역할</p>
                  <p>선택 컬럼: 부서, 직위</p>
                </div>
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" className="gap-2">
                  <Upload className="w-4 h-4" />
                  템플릿 다운로드
                </Button>
                <Button onClick={handleBulkInvite} className="gap-2">
                  <Plus className="w-4 h-4" />
                  CSV 업로드
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}