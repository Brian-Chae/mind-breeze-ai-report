/**
 * 기업 정보 탭 컴포넌트
 * 
 * 기업 기본 정보를 조회하고 수정하는 폼 인터페이스
 */

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card'
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { Label } from '@ui/label'
import { Textarea } from '@ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/select'
import { Badge } from '@ui/badge'
import { Separator } from '@ui/separator'
import { 
  Building2, 
  Save, 
  X,
  Edit2,
  Calendar,
  Hash,
  Mail,
  Phone,
  Globe,
  MapPin,
  FileText,
  Briefcase,
  Users
} from 'lucide-react'
import { toast } from 'sonner'
import organizationManagementService from '@domains/organization/services/management/OrganizationManagementService'
import type { Organization, UpdateOrganizationData } from '@domains/organization/types/management/organization-management'

// Form validation schema
const organizationSchema = z.object({
  organizationName: z.string().min(2, '기업명은 2자 이상이어야 합니다'),
  businessNumber: z.string().optional(),
  industry: z.string().min(1, '업종을 선택해주세요'),
  size: z.enum(['SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']),
  contactEmail: z.string().email('올바른 이메일 형식을 입력해주세요'),
  contactPhone: z.string().regex(/^[\d-]+$/, '올바른 전화번호 형식을 입력해주세요'),
  address: z.string().min(5, '주소를 입력해주세요'),
  website: z.string().url('올바른 URL 형식을 입력해주세요').optional().or(z.literal('')),
  description: z.string().optional(),
  establishedDate: z.string().optional()
})

type FormData = z.infer<typeof organizationSchema>

interface CompanyInfoTabProps {
  organization: Organization
  onUpdate: () => void
}

export default function CompanyInfoTab({ organization, onUpdate }: CompanyInfoTabProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  

  // Initialize form with current organization data
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch
  } = useForm<FormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      organizationName: organization.organizationName,
      businessNumber: organization.businessNumber || '',
      industry: organization.industry,
      size: organization.size,
      contactEmail: organization.contactEmail,
      contactPhone: organization.contactPhone,
      address: organization.address,
      website: organization.website || '',
      description: organization.description || '',
      establishedDate: organization.establishedDate 
        ? new Date(organization.establishedDate.toDate()).toISOString().split('T')[0]
        : ''
    }
  })

  const watchedSize = watch('size')

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      console.log('Form submission started', { data, organizationId: organization.id })
      
      const updateData: UpdateOrganizationData = {
        organizationName: data.organizationName,
        industry: data.industry,
        size: data.size,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        address: data.address
      }

      // Only add optional fields if they have values
      if (data.businessNumber && data.businessNumber.trim()) {
        updateData.businessNumber = data.businessNumber
      }
      if (data.website && data.website.trim()) {
        updateData.website = data.website
      }
      if (data.description && data.description.trim()) {
        updateData.description = data.description
      }
      if (data.establishedDate) {
        updateData.establishedDate = new Date(data.establishedDate)
      }

      console.log('Update data prepared:', updateData)

      await organizationManagementService.updateOrganizationInfo(
        organization.id,
        updateData
      )
      
      console.log('Organization update completed successfully')

      toast.success('기업 정보가 성공적으로 업데이트되었습니다.')

      setIsEditing(false)
      onUpdate()
    } catch (error) {
      console.error('Failed to update organization:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        organizationId: organization.id,
        formData: data
      })
      toast.error(`기업 정보 업데이트에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      setSaving(false)
    }
  }

  // Cancel editing
  const handleCancel = () => {
    reset()
    setIsEditing(false)
  }

  // Industry options
  const industries = [
    { value: 'tech', label: '정보통신업' },
    { value: 'healthcare', label: '헬스케어' },
    { value: 'manufacturing', label: '제조업' },
    { value: 'retail', label: '소매업' },
    { value: 'finance', label: '금융업' },
    { value: 'education', label: '교육' },
    { value: 'service', label: '서비스업' },
    { value: 'other', label: '기타' }
  ]

  // Size options
  const sizeOptions = [
    { value: 'SMALL', label: '소규모', description: '1-50명' },
    { value: 'MEDIUM', label: '중규모', description: '51-200명' },
    { value: 'LARGE', label: '대규모', description: '201-1000명' },
    { value: 'ENTERPRISE', label: '엔터프라이즈', description: '1000명 이상' }
  ]

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
        {!isEditing && (
          <Button 
            onClick={() => setIsEditing(true)} 
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Edit2 className="w-4 h-4" />
            정보 수정
          </Button>
        )}
      </div>

      {/* Content Card */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-slate-900">기업 상세 정보</CardTitle>
                <CardDescription className="text-slate-600">
                  {isEditing ? '기업 정보를 수정하고 저장하세요' : '등록된 기업 정보를 확인하세요'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-slate-700 border-slate-300">
                  조직 코드: {organization.organizationCode}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-medium text-slate-900 mb-4">기본 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="organizationName" className="text-slate-900 font-medium">
                    기업명 <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input
                      id="organizationName"
                      {...register('organizationName')}
                      disabled={!isEditing}
                      className="pl-10 text-slate-900 disabled:text-slate-900 disabled:opacity-100"
                    />
                  </div>
                  {errors.organizationName && (
                    <p className="text-sm text-red-500">{errors.organizationName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessNumber" className="text-slate-900 font-medium">사업자번호</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input
                      id="businessNumber"
                      {...register('businessNumber')}
                      disabled={!isEditing}
                      placeholder="123-45-67890"
                      className="pl-10 text-slate-900 disabled:text-slate-900 disabled:opacity-100"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry" className="text-slate-900 font-medium">
                    업종 <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 w-4 h-4 text-slate-400 z-10" />
                    <Select
                      value={watch('industry')}
                      onValueChange={(value) => setValue('industry', value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="pl-10 text-slate-900 disabled:text-slate-900 disabled:opacity-100">
                        <SelectValue placeholder="업종 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map((industry) => (
                          <SelectItem key={industry.value} value={industry.value}>
                            {industry.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.industry && (
                    <p className="text-sm text-red-500">{errors.industry.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size" className="text-slate-900 font-medium">
                    기업 규모 <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 w-4 h-4 text-slate-400 z-10" />
                    <Select
                      value={watchedSize}
                      onValueChange={(value) => setValue('size', value as any)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="pl-10 text-slate-900 disabled:text-slate-900 disabled:opacity-100">
                        <SelectValue placeholder="규모 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {sizeOptions.map((size) => (
                          <SelectItem key={size.value} value={size.value}>
                            <div>
                              <div className="font-medium">{size.label}</div>
                              <div className="text-xs text-slate-500">{size.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="establishedDate" className="text-slate-900 font-medium">설립일</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input
                      id="establishedDate"
                      type="date"
                      {...register('establishedDate')}
                      disabled={!isEditing}
                      className="pl-10 text-slate-900 disabled:text-slate-900 disabled:opacity-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Contact Information */}
            <div>
              <h3 className="text-sm font-medium text-slate-900 mb-4">연락처 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail" className="text-slate-900 font-medium">
                    이메일 <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input
                      id="contactEmail"
                      type="email"
                      {...register('contactEmail')}
                      disabled={!isEditing}
                      className="pl-10 text-slate-900 disabled:text-slate-900 disabled:opacity-100"
                    />
                  </div>
                  {errors.contactEmail && (
                    <p className="text-sm text-red-500">{errors.contactEmail.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone" className="text-slate-900 font-medium">
                    전화번호 <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input
                      id="contactPhone"
                      {...register('contactPhone')}
                      disabled={!isEditing}
                      placeholder="02-1234-5678"
                      className="pl-10 text-slate-900 disabled:text-slate-900 disabled:opacity-100"
                    />
                  </div>
                  {errors.contactPhone && (
                    <p className="text-sm text-red-500">{errors.contactPhone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website" className="text-slate-900 font-medium">웹사이트</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input
                      id="website"
                      {...register('website')}
                      disabled={!isEditing}
                      placeholder="https://example.com"
                      className="pl-10 text-slate-900 disabled:text-slate-900 disabled:opacity-100"
                    />
                  </div>
                  {errors.website && (
                    <p className="text-sm text-red-500">{errors.website.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-slate-900 font-medium">
                    주소 <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input
                      id="address"
                      {...register('address')}
                      disabled={!isEditing}
                      className="pl-10 text-slate-900 disabled:text-slate-900 disabled:opacity-100"
                    />
                  </div>
                  {errors.address && (
                    <p className="text-sm text-red-500">{errors.address.message}</p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Additional Information */}
            <div>
              <h3 className="text-sm font-medium text-slate-900 mb-4">추가 정보</h3>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-900 font-medium">기업 소개</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Textarea
                    id="description"
                    {...register('description')}
                    disabled={!isEditing}
                    rows={4}
                    placeholder="기업에 대한 간단한 소개를 작성해주세요"
                    className="pl-10 resize-none bg-slate-50 text-slate-900 border-slate-200 focus:bg-white focus:border-blue-500 disabled:text-slate-900 disabled:opacity-100 disabled:bg-slate-50"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                  className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-md hover:shadow-lg disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <Save className="w-4 h-4" />
                  {saving ? '저장 중...' : '변경사항 저장'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  )
}