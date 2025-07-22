/**
 * 부서 생성/편집 모달 컴포넌트
 * 
 * 부서 정보를 생성하거나 편집하는 모달 다이얼로그
 */

import React, { useEffect } from 'react'
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
import { 
  Building2, 
  Save, 
  X, 
  User,
  Hash,
  FileText,
  Network
} from 'lucide-react'
import { toast } from 'sonner'
import organizationManagementService from '@domains/organization/services/management/OrganizationManagementService'
import type { Department, CreateDepartmentData } from '@domains/organization/types/management/organization-management'

// Form validation schema
const departmentSchema = z.object({
  name: z.string().min(2, '부서명은 2자 이상이어야 합니다'),
  code: z.string().min(2, '부서 코드는 2자 이상이어야 합니다').regex(/^[A-Z0-9_]+$/, '부서 코드는 영문 대문자, 숫자, 언더스코어만 사용 가능합니다'),
  description: z.string().optional(),
  parentId: z.string().optional(),
  managerId: z.string().optional(),
  sortOrder: z.number().optional()
})

type FormData = z.infer<typeof departmentSchema>

interface DepartmentFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  organizationId: string
  department?: Department // 편집 모드일 때 전달
  departments: Department[] // 상위 부서 선택을 위한 전체 부서 목록
  mode: 'create' | 'edit'
  parentId?: string // 하위 부서 생성 시 부모 ID
}

export default function DepartmentFormModal({
  isOpen,
  onClose,
  onSuccess,
  organizationId,
  department,
  departments,
  mode,
  parentId
}: DepartmentFormModalProps) {
  const [saving, setSaving] = React.useState(false)
  

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch
  } = useForm<FormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: department?.name || '',
      code: department?.code || '',
      description: department?.description || '',
      parentId: parentId || department?.parentId || '',
      managerId: department?.managerId || '',
      sortOrder: department?.sortOrder || 0
    }
  })

  // Reset form when modal opens/closes or department changes
  useEffect(() => {
    if (isOpen) {
      reset({
        name: department?.name || '',
        code: department?.code || '',
        description: department?.description || '',
        parentId: parentId || department?.parentId || '',
        managerId: department?.managerId || '',
        sortOrder: department?.sortOrder || 0
      })
    }
  }, [isOpen, department, parentId, reset])

  // Filter parent options (exclude self and children)
  const parentOptions = departments.filter(dept => {
    if (mode === 'edit' && department) {
      // 편집 모드: 자기 자신과 하위 부서들은 제외
      if (dept.id === department.id) return false
      // TODO: 하위 부서 체크 로직 추가
    }
    return dept.isActive
  })

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      if (mode === 'create') {
        const createData: CreateDepartmentData = {
          name: data.name,
          code: data.code,
          description: data.description,
          parentId: data.parentId,
          managerId: data.managerId,
          sortOrder: data.sortOrder || 0
        }

        await organizationManagementService.createDepartment(organizationId, createData)
        
        toast.success('부서가 성공적으로 생성되었습니다.')
      } else {
        // 편집 모드
        const updateData = {
          name: data.name,
          code: data.code,
          description: data.description,
          parentId: data.parentId,
          managerId: data.managerId,
          sortOrder: data.sortOrder || 0
        }

        await organizationManagementService.updateDepartment(
          organizationId, 
          department!.id, 
          updateData
        )
        
        toast.success('부서 정보가 성공적으로 수정되었습니다.')
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Department operation failed:', error)
      toast.error(mode === 'create' 
        ? '부서 생성에 실패했습니다.' 
        : '부서 수정에 실패했습니다.'
      )
    } finally {
      setSaving(false)
    }
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
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-md">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl text-slate-900">
                {mode === 'create' ? '새 부서 추가' : '부서 정보 수정'}
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                {mode === 'create' 
                  ? '새로운 부서를 생성합니다.' 
                  : `${department?.name} 부서의 정보를 수정합니다.`
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 부서명 */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-900 font-medium">
              부서명 <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                id="name"
                {...register('name')}
                placeholder="개발팀"
                className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                disabled={saving}
              />
            </div>
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* 부서 코드 */}
          <div className="space-y-2">
            <Label htmlFor="code" className="text-slate-900 font-medium">
              부서 코드 <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Hash className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                id="code"
                {...register('code')}
                placeholder="DEV_TEAM"
                className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                disabled={saving}
              />
            </div>
            {errors.code && (
              <p className="text-sm text-red-500">{errors.code.message}</p>
            )}
            <p className="text-xs text-slate-500">
              영문 대문자, 숫자, 언더스코어(_)만 사용 가능
            </p>
          </div>

          {/* 상위 부서 */}
          <div className="space-y-2">
            <Label htmlFor="parentId" className="text-slate-900 font-medium">상위 부서</Label>
            <div className="relative">
              <Network className="absolute left-3 top-3 w-4 h-4 text-slate-400 z-10" />
              <Select
                value={watch('parentId') || 'none'}
                onValueChange={(value) => setValue('parentId', value === 'none' ? undefined : value)}
                disabled={saving}
              >
                <SelectTrigger className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                  <SelectValue placeholder="상위 부서 선택 (선택사항)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">상위 부서 없음</SelectItem>
                  {parentOptions.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {'  '.repeat(dept.level)}{dept.name} ({dept.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 부서 설명 */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-900 font-medium">부서 설명</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Textarea
                id="description"
                {...register('description')}
                placeholder="부서의 역할과 업무를 간단히 설명해주세요"
                rows={3}
                className="pl-10 resize-none bg-slate-50 text-slate-700 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400"
                disabled={saving}
              />
            </div>
          </div>

          {/* 정렬 순서 */}
          <div className="space-y-2">
            <Label htmlFor="sortOrder" className="text-slate-900 font-medium">정렬 순서</Label>
            <Input
              id="sortOrder"
              type="number"
              {...register('sortOrder', { valueAsNumber: true })}
              placeholder="0"
              className="border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              disabled={saving}
            />
            <p className="text-xs text-slate-500">
              작은 숫자일수록 먼저 표시됩니다
            </p>
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
              <Save className="w-4 h-4" />
              {saving 
                ? '저장 중...' 
                : mode === 'create' 
                  ? '부서 생성' 
                  : '변경사항 저장'
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}