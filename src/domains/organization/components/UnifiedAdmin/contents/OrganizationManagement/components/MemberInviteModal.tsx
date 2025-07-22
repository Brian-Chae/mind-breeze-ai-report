/**
 * 구성원 계정 생성 모달 컴포넌트
 * 
 * 관리자가 직접 구성원 계정을 생성하는 모달 다이얼로그
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
  Plus,
  Download,
  Key,
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react'
import { toast } from 'sonner'
import organizationManagementService from '@domains/organization/services/management/OrganizationManagementService'
import type { Department, CreatePendingMemberData } from '@domains/organization/types/management/organization-management'

// Member creation form schema
const memberCreateSchema = z.object({
  email: z.string().email('올바른 이메일 형식을 입력해주세요'),
  name: z.string().min(2, '이름은 2자 이상이어야 합니다'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '비밀번호는 대소문자와 숫자를 포함해야 합니다'),
  departmentId: z.string().optional(),
  position: z.string().optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER'])
})

type MemberCreateFormData = z.infer<typeof memberCreateSchema>

interface MemberCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  organizationId: string
  departments: Department[]
}

export default function MemberCreateModal({
  isOpen,
  onClose,
  onSuccess,
  organizationId,
  departments
}: MemberCreateModalProps) {
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('single')
  const [showPassword, setShowPassword] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [copied, setCopied] = useState(false)
  
  // Member creation form
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch
  } = useForm<MemberCreateFormData>({
    resolver: zodResolver(memberCreateSchema),
    defaultValues: {
      email: '',
      name: '',
      password: '',
      departmentId: '',
      position: '',
      role: 'MEMBER'
    }
  })

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      reset()
      setActiveTab('single')
      setShowPassword(false)
      setGeneratedPassword('')
      setCopied(false)
    }
  }, [isOpen, reset])

  // Generate random password
  const generatePassword = () => {
    const length = 12
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const numbers = '0123456789'
    const symbols = '!@#$%^&*'
    const allChars = lowercase + uppercase + numbers + symbols
    
    let password = ''
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length))
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length))
    password += numbers.charAt(Math.floor(Math.random() * numbers.length))
    password += symbols.charAt(Math.floor(Math.random() * symbols.length))
    
    for (let i = 4; i < length; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length))
    }
    
    const shuffled = password.split('').sort(() => 0.5 - Math.random()).join('')
    setGeneratedPassword(shuffled)
    setValue('password', shuffled)
  }

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('클립보드에 복사되었습니다')
    } catch (error) {
      toast.error('복사에 실패했습니다')
    }
  }

  // Role options
  const roleOptions = [
    { value: 'ADMIN', label: '관리자', description: '모든 권한' },
    { value: 'MANAGER', label: '매니저', description: '팀 관리 권한' },
    { value: 'MEMBER', label: '구성원', description: '기본 권한' }
  ]

  // Handle member creation
  const onSubmitCreate = async (data: MemberCreateFormData) => {
    setSaving(true)
    try {
      const createData: CreatePendingMemberData = {
        email: data.email,
        name: data.name,
        temporaryPassword: data.password,
        role: data.role
      }

      // Only add optional fields if they have values
      if (data.departmentId && data.departmentId !== '' && data.departmentId !== 'none') {
        createData.departmentId = data.departmentId
      }
      
      if (data.position && data.position !== '') {
        createData.position = data.position
      }

      await organizationManagementService.createPendingMember(organizationId, createData)
      
      // Show success message with account info
      toast.success(
        <div className="space-y-2">
          <p className="font-medium">{data.name}님의 계정이 생성되었습니다.</p>
          <div className="text-sm space-y-1">
            <p>이메일: {data.email}</p>
            <p>비밀번호: {data.password}</p>
          </div>
          <p className="text-xs text-gray-500">계정 정보를 안전하게 전달해주세요.</p>
        </div>,
        { duration: 10000 }
      )

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Member creation failed:', error)
      toast.error('구성원 계정 생성에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // Handle bulk creation (CSV)
  const handleBulkCreate = () => {
    // TODO: CSV 업로드 및 일괄 계정 생성 구현
    toast.info('CSV 일괄 계정 생성 기능은 곧 제공될 예정입니다.')
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
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg shadow-md">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl text-slate-900">구성원 계정 생성</DialogTitle>
              <DialogDescription className="text-slate-600">
                새로운 구성원의 계정을 생성합니다
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-lg">
            <TabsTrigger 
              value="single" 
              className="gap-2 bg-slate-100 text-slate-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200"
            >
              <UserPlus className="w-4 h-4" />
              개별 생성
            </TabsTrigger>
            <TabsTrigger 
              value="bulk" 
              className="gap-2 bg-slate-100 text-slate-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200"
            >
              <Upload className="w-4 h-4" />
              일괄 생성
            </TabsTrigger>
          </TabsList>

          {/* 개별 생성 탭 */}
          <TabsContent value="single" className="space-y-4">
            <form onSubmit={handleSubmit(onSubmitCreate)} className="space-y-4">
              {/* 이메일 */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-900 font-medium">
                  이메일 <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="user@example.com"
                    className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    disabled={saving}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* 이름 */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-900 font-medium">
                  이름 <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="홍길동"
                    className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    disabled={saving}
                  />
                </div>
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              {/* 비밀번호 */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-900 font-medium">
                  임시 비밀번호 <span className="text-red-500">*</span>
                </Label>
                <div className="space-y-2">
                  <div className="relative">
                    <Key className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      placeholder="8자 이상, 대소문자와 숫자 포함"
                      className="pl-10 pr-20 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      disabled={saving}
                    />
                    <div className="absolute right-2 top-2 flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                        className="h-7 w-7 p-0 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={generatePassword}
                        className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                        title="비밀번호 자동 생성"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password.message}</p>
                  )}
                  
                  {/* 생성된 비밀번호 표시 및 복사 */}
                  {generatedPassword && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <p className="font-medium text-blue-900">생성된 비밀번호:</p>
                          <p className="font-mono text-blue-700">{generatedPassword}</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generatedPassword)}
                          className="gap-2"
                        >
                          {copied ? (
                            <>
                              <Check className="w-4 h-4 text-green-600" />
                              복사됨
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              복사
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 부서 */}
              <div className="space-y-2">
                <Label htmlFor="departmentId" className="text-slate-900 font-medium">부서</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 w-4 h-4 text-slate-400 z-10" />
                  <Select
                    value={watch('departmentId') || 'none'}
                    onValueChange={(value) => setValue('departmentId', value === 'none' ? '' : value)}
                    disabled={saving}
                  >
                    <SelectTrigger className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                      <SelectValue placeholder="부서 선택 (선택사항)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">부서 미배정</SelectItem>
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
                <Label htmlFor="position" className="text-slate-900 font-medium">직위</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    id="position"
                    {...register('position')}
                    placeholder="팀장, 매니저, 개발자 등"
                    className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    disabled={saving}
                  />
                </div>
              </div>

              {/* 역할 */}
              <div className="space-y-2">
                <Label htmlFor="role" className="text-slate-900 font-medium">
                  역할 <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 w-4 h-4 text-slate-400 z-10" />
                  <Select
                    value={watch('role')}
                    onValueChange={(value) => setValue('role', value as any)}
                    disabled={saving}
                  >
                    <SelectTrigger className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
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

              {/* 처음 로그인 시 비밀번호 변경 안내 */}
              <div className="p-4 border border-amber-200 rounded-lg bg-amber-50">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-medium text-amber-900">보안 안내</div>
                    <div className="text-sm text-amber-700">
                      구성원은 처음 로그인 시 반드시 비밀번호를 변경해야 합니다.
                    </div>
                    <div className="text-xs text-amber-600 mt-2">
                      계정 정보를 안전한 방법으로 전달해주세요.
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={saving}
                  className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={saving || !isDirty}
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-md hover:shadow-lg disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <UserPlus className="w-4 h-4" />
                  {saving ? '등록 중...' : '가입 대기 추가'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          {/* 일괄 초대 탭 */}
          <TabsContent value="bulk" className="space-y-4">
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-slate-400" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium text-slate-900">CSV 파일로 일괄 계정 생성</h3>
                <p className="text-slate-600 max-w-md mx-auto">
                  CSV 파일을 업로드하여 여러 구성원의 계정을 한 번에 생성할 수 있습니다.
                </p>
                <div className="text-sm text-slate-500 space-y-1 mt-3">
                  <p>필수 컬럼: 이메일, 이름, 비밀번호, 역할</p>
                  <p>선택 컬럼: 부서, 직위</p>
                </div>
              </div>
              <div className="flex gap-3 justify-center pt-2">
                <Button 
                  variant="outline" 
                  className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
                >
                  <Download className="w-4 h-4" />
                  템플릿 다운로드
                </Button>
                <Button 
                  onClick={handleBulkCreate} 
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  CSV 업로드
                </Button>
              </div>
            </div>
            
            {/* 빈 공간 추가하여 개별 생성 탭과 동일한 높이 유지 */}
            <div className="space-y-4">
              {/* 이메일 필드 높이 */}
              <div className="h-[72px]"></div>
              {/* 이름 필드 높이 */}
              <div className="h-[72px]"></div>
              {/* 비밀번호 필드 높이 (생성된 비밀번호 표시 포함) */}
              <div className="h-[120px]"></div>
              {/* 부서 필드 높이 */}
              <div className="h-[72px]"></div>
              {/* 직위 필드 높이 */}
              <div className="h-[72px]"></div>
              {/* 역할 필드 높이 */}
              <div className="h-[72px]"></div>
              {/* 보안 안내 높이 */}
              <div className="h-[88px]"></div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}