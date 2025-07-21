import React, { useState } from 'react'
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from 'lucide-react'
import { Button } from '@ui/button'
import { Input } from '@ui/input'
// Label component - using styled label instead
const Label = ({ children, htmlFor, ...props }: { children: React.ReactNode; htmlFor?: string; [key: string]: any }) => (
  <label 
    htmlFor={htmlFor}
    className="text-sm font-medium text-gray-700 mb-1.5 block"
    {...props}
  >
    {children}
  </label>
)

import { Textarea } from '@ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/tabs'
import { Badge } from '@ui/badge'
import { Alert, AlertDescription } from '@ui/alert'
import { toast } from 'sonner'
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  CreditCard, 
  Shield, 
  AlertCircle,
  Eye,
  EyeOff,
  Calendar,
  DollarSign,
  Gift,
  FileText
} from 'lucide-react'
import systemAdminService from '@domains/organization/services/SystemAdminService'
import { OrganizationSize } from '@domains/organization/types/organization'

interface CreateEnterpriseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface EnterpriseFormData {
  // 기본 정보
  companyName: string
  businessNumber: string
  industry: string
  size: OrganizationSize
  employeeCount: number
  
  // 주소
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  
  // 담당자 정보
  contactName: string
  contactPhone: string
  contactEmail: string
  contactPosition: string
  
  // 관리자 계정
  adminEmail: string
  adminPassword: string
  adminPasswordConfirm: string
  
  // 크레딧 설정 (시스템 관리자 전용)
  initialCredits: number
  promotionCredits: number
  creditExpireDate?: string
  
  // 구독 설정 (시스템 관리자 전용)
  subscriptionPlan: 'TRIAL' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE' | 'CUSTOM'
  customPrice?: number
  trialDays: number
  specialTerms?: string
  
  // 시스템 메모
  systemNotes?: string
}

const CreateEnterpriseModal: React.FC<CreateEnterpriseModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState('basic')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof EnterpriseFormData, string>>>({})
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  
  const [formData, setFormData] = useState<EnterpriseFormData>({
    companyName: '',
    businessNumber: '',
    industry: '',
    size: 'SMALL',
    employeeCount: 10,
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Korea'
    },
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    contactPosition: '',
    adminEmail: '',
    adminPassword: '',
    adminPasswordConfirm: '',
    initialCredits: 0,
    promotionCredits: 0,
    creditExpireDate: '',
    subscriptionPlan: 'TRIAL',
    customPrice: undefined,
    trialDays: 30,
    specialTerms: '',
    systemNotes: ''
  })

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      // 중첩된 객체 처리 (예: address.street)
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof EnterpriseFormData] as any,
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
    
    // 에러 제거
    if (errors[field as keyof EnterpriseFormData]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateTab = (tabId: string): boolean => {
    switch (tabId) {
      case 'basic':
        return formData.companyName.trim() !== '' && 
               formData.industry.trim() !== '' && 
               formData.employeeCount > 0 && 
               formData.address.street.trim() !== ''
      case 'admin':
        return formData.contactName.trim() !== '' &&
               formData.contactPhone.trim() !== '' &&
               formData.contactEmail.trim() !== '' &&
               formData.adminEmail.trim() !== '' &&
               formData.adminPassword !== '' &&
               formData.adminPassword === formData.adminPasswordConfirm &&
               /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail) &&
               /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail) &&
               !errors.contactEmail &&
               !errors.adminEmail
      case 'credits':
      case 'subscription':
        return true // Optional tabs
      default:
        return false
    }
  }

  const isTabComplete = (tabId: string): boolean => {
    return validateTab(tabId) && activeTab !== tabId
  }

  const isFormValid = (): boolean => {
    return validateTab('basic') && validateTab('admin')
  }

  const checkEmailAvailability = async (email: string, fieldName: 'contactEmail' | 'adminEmail') => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return // Skip validation for empty or invalid email format
    }

    setIsCheckingEmail(true)
    try {
      const emailExists = await systemAdminService.checkEmailExists(email)
      if (emailExists) {
        setErrors(prev => ({ 
          ...prev, 
          [fieldName]: '이미 등록된 이메일입니다. 다른 이메일을 사용해주세요.' 
        }))
      } else {
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors[fieldName]
          return newErrors
        })
      }
    } catch (error) {
      console.error('이메일 중복 확인 실패:', error)
      setErrors(prev => ({ 
        ...prev, 
        [fieldName]: '이메일 중복 확인 중 오류가 발생했습니다.' 
      }))
    } finally {
      setIsCheckingEmail(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof EnterpriseFormData, string>> = {}

    // 기본 정보 검증
    if (!formData.companyName.trim()) {
      newErrors.companyName = '기업명을 입력해주세요'
    }
    
    if (!formData.industry.trim()) {
      newErrors.industry = '업종을 선택해주세요'
    }
    
    if (formData.employeeCount < 1) {
      newErrors.employeeCount = '직원 수는 1명 이상이어야 합니다'
    }
    
    // 주소 검증
    if (!formData.address.street.trim()) {
      newErrors.address = '주소를 입력해주세요'
    }
    
    // 담당자 정보 검증
    if (!formData.contactName.trim()) {
      newErrors.contactName = '담당자명을 입력해주세요'
    }
    
    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = '연락처를 입력해주세요'
    }
    
    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = '담당자 이메일을 입력해주세요'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = '올바른 이메일 형식을 입력해주세요'
    }
    
    // 관리자 계정 검증
    if (!formData.adminEmail.trim()) {
      newErrors.adminEmail = '관리자 로그인 이메일을 입력해주세요'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
      newErrors.adminEmail = '올바른 이메일 형식을 입력해주세요'
    }
    
    if (!formData.adminPassword) {
      newErrors.adminPassword = '비밀번호를 입력해주세요'
    } else if (formData.adminPassword.length < 8) {
      newErrors.adminPassword = '비밀번호는 최소 8자 이상이어야 합니다'
    } else if (!/(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/.test(formData.adminPassword)) {
      newErrors.adminPassword = '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다'
    }
    
    if (formData.adminPassword !== formData.adminPasswordConfirm) {
      newErrors.adminPasswordConfirm = '비밀번호가 일치하지 않습니다'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      // 첫 번째 에러가 있는 탭으로 이동
      if (errors.companyName || errors.industry || errors.employeeCount || errors.address) {
        setActiveTab('basic')
      } else if (errors.contactName || errors.contactPhone || errors.contactEmail || errors.adminEmail || errors.adminPassword) {
        setActiveTab('admin')
      }
      toast.error('필수 정보를 모두 입력해주세요')
      return
    }

    // 이메일 중복 확인 (마지막 검증)
    if (errors.contactEmail || errors.adminEmail) {
      setActiveTab('admin')
      toast.error('이메일 문제를 해결해주세요')
      return
    }

    setIsLoading(true)

    try {
      // ⚠️ 최종 이메일 중복 검사 (제출 직전 보안 검증)
      console.log('🔒 최종 이메일 중복 검사 시작...')
      
      const adminEmailExists = await systemAdminService.checkEmailExists(formData.adminEmail)
      if (adminEmailExists) {
        console.error('❌ 관리자 이메일 중복 발견:', formData.adminEmail)
        setActiveTab('admin')
        setErrors(prev => ({ ...prev, adminEmail: '이미 등록된 이메일입니다. 다른 이메일을 사용해주세요.' }))
        toast.error('관리자 이메일이 이미 등록되어 있습니다.')
        setIsLoading(false)
        return
      }
      
      // 담당자 이메일이 관리자 이메일과 다른 경우에만 검사
      if (formData.contactEmail !== formData.adminEmail) {
        const contactEmailExists = await systemAdminService.checkEmailExists(formData.contactEmail)
        if (contactEmailExists) {
          console.error('❌ 담당자 이메일 중복 발견:', formData.contactEmail)
          setActiveTab('admin')
          setErrors(prev => ({ ...prev, contactEmail: '이미 등록된 이메일입니다. 다른 이메일을 사용해주세요.' }))
          toast.error('담당자 이메일이 이미 등록되어 있습니다.')
          setIsLoading(false)
          return
        }
      }
      
      console.log('✅ 최종 이메일 중복 검사 통과')

    } catch (error) {
      console.error('❌ 최종 이메일 검사 중 오류:', error)
      toast.error('이메일 검증 중 오류가 발생했습니다. 다시 시도해주세요.')
      setIsLoading(false)
      return
    }

    try {
      const result = await systemAdminService.createEnterpriseWithAdmin({
        // 기본 정보
        companyName: formData.companyName,
        businessNumber: formData.businessNumber,
        industry: formData.industry,
        size: formData.size,
        employeeCount: formData.employeeCount,
        
        // 주소
        address: formData.address,
        
        // 담당자 정보
        contact: {
          name: formData.contactName,
          email: formData.contactEmail,
          phone: formData.contactPhone,
          position: formData.contactPosition
        },
        
        // 관리자 계정
        adminName: formData.contactName, // 담당자명과 동일하게 설정
        adminEmail: formData.adminEmail,
        adminPassword: formData.adminPassword,
        
        // 크레딧 설정
        creditSettings: {
          initialCredits: formData.initialCredits,
          promotionCredits: formData.promotionCredits,
          creditExpireDate: formData.creditExpireDate ? new Date(formData.creditExpireDate) : undefined
        },
        
        // 구독 설정
        subscriptionOverride: {
          plan: formData.subscriptionPlan,
          customPrice: formData.customPrice,
          trialDays: formData.trialDays,
          specialTerms: formData.specialTerms
        },
        
        // 시스템 메모
        systemNotes: formData.systemNotes
      })

      if (result.success) {
        toast.success(`기업이 성공적으로 등록되었습니다!\n기업코드: ${result.organizationCode}`)
        onSuccess()
      } else {
        throw new Error(result.error || '기업 등록에 실패했습니다')
      }
    } catch (error) {
      console.error('기업 등록 오류:', error)
      const errorMessage = error instanceof Error ? error.message : '기업 등록 중 오류가 발생했습니다'
      
      // 특정 에러 유형에 따라 적절한 탭으로 이동
      if (errorMessage.includes('사업자 등록번호')) {
        setActiveTab('basic')
        setErrors(prev => ({ ...prev, businessNumber: errorMessage }))
      } else if (errorMessage.includes('이메일')) {
        setActiveTab('admin')
        if (errorMessage.includes('담당자')) {
          setErrors(prev => ({ ...prev, contactEmail: errorMessage }))
        } else {
          setErrors(prev => ({ ...prev, adminEmail: errorMessage }))
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const industries = [
    '제조업', 'IT/소프트웨어', '금융/보험', '의료/제약', '건설/부동산', 
    '유통/물류', '교육', '공공기관', '서비스', '기타'
  ]

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onClose}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 max-w-6xl w-[95vw] max-h-[95vh] h-[90vh] translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-2xl bg-white shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
        <div className="h-full flex flex-col relative">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-t-2xl relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">기업 관리</h2>
                  <p className="text-white/80 text-sm">새로운 기업 등록</p>
                </div>
              </div>
              <Badge className="bg-white/20 text-white border-white/30 mr-10">시스템 관리자 전용</Badge>
            </div>
            
            {/* Close button */}
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-lg opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 disabled:pointer-events-none">
              <X className="h-5 w-5 text-white" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </div>

          {/* Tab Navigation - Matching Enterprise Management Page Style */}
          <div className="bg-gray-50 p-4 border-b">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-2">
              <div className="flex gap-2">
                {[
                  { id: 'basic', label: '기본 정보', icon: Building2, required: true },
                  { id: 'admin', label: '관리자 계정', icon: User, required: true },
                  { id: 'credits', label: '크레딧 설정', icon: CreditCard, required: false },
                  { id: 'subscription', label: '구독 설정', icon: Shield, required: false }
                ].map((tab) => {
                  const isValid = validateTab(tab.id)
                  const isComplete = isTabComplete(tab.id)
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                          : isComplete
                          ? 'text-emerald-600 hover:bg-emerald-50 bg-emerald-50/50'
                          : tab.required && !isValid
                          ? 'text-red-600 hover:bg-red-50 bg-red-50/50'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span className="text-sm">{tab.label}</span>
                      {tab.required && !isValid && activeTab !== tab.id && (
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                      )}
                      {isComplete && activeTab !== tab.id && (
                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50" style={{ maxHeight: 'calc(90vh - 240px)' }}>
              {/* 기본 정보 탭 */}
              <TabsContent value="basic" className="p-6 m-0">
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-center gap-2 mb-6">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-slate-900">기업 정보</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="companyName">기업명 *</Label>
                        <Input
                          id="companyName"
                          value={formData.companyName}
                          onChange={(e) => handleInputChange('companyName', e.target.value)}
                          placeholder="예: 주식회사 마인드브리즈"
                          className={`h-11 ${errors.companyName ? 'border-red-500' : ''}`}
                        />
                        {errors.companyName && (
                          <p className="text-sm text-red-500 mt-1">{errors.companyName}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="businessNumber">사업자등록번호</Label>
                        <Input
                          id="businessNumber"
                          value={formData.businessNumber}
                          onChange={(e) => handleInputChange('businessNumber', e.target.value)}
                          placeholder="123-45-67890"
                          className={`h-11 ${errors.businessNumber ? 'border-red-500' : ''}`}
                        />
                        {errors.businessNumber && (
                          <p className="text-sm text-red-500 mt-1">{errors.businessNumber}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="industry">업종 *</Label>
                        <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                          <SelectTrigger className={`h-11 ${errors.industry ? 'border-red-500' : ''}`}>
                            <SelectValue placeholder="업종을 선택해주세요" />
                          </SelectTrigger>
                          <SelectContent>
                            {industries.map(industry => (
                              <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.industry && (
                          <p className="text-sm text-red-500 mt-1">{errors.industry}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="size">기업 규모 *</Label>
                        <Select value={formData.size} onValueChange={(value) => handleInputChange('size', value)}>
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SMALL">소기업 (1-50명)</SelectItem>
                            <SelectItem value="MEDIUM">중기업 (51-300명)</SelectItem>
                            <SelectItem value="LARGE">대기업 (301-1000명)</SelectItem>
                            <SelectItem value="ENTERPRISE">대기업 (1000명 이상)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="employeeCount">직원 수 *</Label>
                      <Input
                        id="employeeCount"
                        type="number"
                        value={formData.employeeCount}
                        onChange={(e) => handleInputChange('employeeCount', parseInt(e.target.value) || 0)}
                        min="1"
                        className={`h-11 ${errors.employeeCount ? 'border-red-500' : ''}`}
                      />
                      {errors.employeeCount && (
                        <p className="text-sm text-red-500 mt-1">{errors.employeeCount}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label>주소 *</Label>
                      <Input
                        placeholder="도로명 주소"
                        value={formData.address.street}
                        onChange={(e) => handleInputChange('address.street', e.target.value)}
                        className={`h-11 ${errors.address ? 'border-red-500' : ''}`}
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          placeholder="시/군/구"
                          value={formData.address.city}
                          onChange={(e) => handleInputChange('address.city', e.target.value)}
                          className="h-11"
                        />
                        <Input
                          placeholder="시/도"
                          value={formData.address.state}
                          onChange={(e) => handleInputChange('address.state', e.target.value)}
                          className="h-11"
                        />
                        <Input
                          placeholder="우편번호"
                          value={formData.address.zipCode}
                          onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                          className="h-11"
                        />
                      </div>
                      {errors.address && (
                        <p className="text-sm text-red-500">{errors.address}</p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* 관리자 계정 탭 */}
              <TabsContent value="admin" className="p-6 m-0">
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-center gap-2 mb-6">
                      <User className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-slate-900">담당자 정보</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="contactName">담당자명 *</Label>
                          <Input
                            id="contactName"
                            value={formData.contactName}
                            onChange={(e) => handleInputChange('contactName', e.target.value)}
                            placeholder="홍길동"
                            className={`h-11 ${errors.contactName ? 'border-red-500' : ''}`}
                          />
                          {errors.contactName && (
                            <p className="text-sm text-red-500 mt-1">{errors.contactName}</p>
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor="contactPosition">직책</Label>
                          <Input
                            id="contactPosition"
                            value={formData.contactPosition}
                            onChange={(e) => handleInputChange('contactPosition', e.target.value)}
                            placeholder="대표이사"
                            className="h-11"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="contactPhone">연락처 *</Label>
                          <Input
                            id="contactPhone"
                            value={formData.contactPhone}
                            onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                            placeholder="010-1234-5678"
                            className={`h-11 ${errors.contactPhone ? 'border-red-500' : ''}`}
                          />
                          {errors.contactPhone && (
                            <p className="text-sm text-red-500 mt-1">{errors.contactPhone}</p>
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor="contactEmail">담당자 이메일 *</Label>
                          <div className="relative">
                            <Input
                              id="contactEmail"
                              type="email"
                              value={formData.contactEmail}
                              onChange={(e) => {
                                const value = e.target.value
                                handleInputChange('contactEmail', value)
                                // Debounced email check
                                if (value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                                  setTimeout(() => {
                                    if (formData.contactEmail === value) {
                                      checkEmailAvailability(value, 'contactEmail')
                                    }
                                  }, 1000)
                                }
                              }}
                              placeholder="contact@company.com"
                              className={`h-11 ${errors.contactEmail ? 'border-red-500' : ''}`}
                            />
                            {isCheckingEmail && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                              </div>
                            )}
                          </div>
                          {errors.contactEmail && (
                            <p className="text-sm text-red-500 mt-1">{errors.contactEmail}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
                    <h4 className="font-medium mb-4 flex items-center gap-2 text-slate-900">
                      <Shield className="w-4 h-4 text-green-600" />
                      로그인 계정 설정
                    </h4>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="adminEmail">로그인 이메일 (ID) *</Label>
                        <div className="relative">
                          <Input
                            id="adminEmail"
                            type="email"
                            value={formData.adminEmail}
                            onChange={(e) => {
                              const value = e.target.value
                              handleInputChange('adminEmail', value)
                              // Debounced email check
                              if (value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                                setTimeout(() => {
                                  if (formData.adminEmail === value) {
                                    checkEmailAvailability(value, 'adminEmail')
                                  }
                                }, 1000)
                              }
                            }}
                            placeholder="admin@company.com"
                            className={`h-11 ${errors.adminEmail ? 'border-red-500' : ''}`}
                          />
                          {isCheckingEmail && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
                        {errors.adminEmail && (
                          <p className="text-sm text-red-500 mt-1">{errors.adminEmail}</p>
                        )}
                        <p className="text-xs text-slate-600 mt-1">이 이메일로 로그인하게 됩니다</p>
                      </div>
                      
                      <div>
                        <Label htmlFor="adminPassword">비밀번호 *</Label>
                        <div className="relative">
                          <Input
                            id="adminPassword"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.adminPassword}
                            onChange={(e) => handleInputChange('adminPassword', e.target.value)}
                            placeholder="8자 이상, 영문/숫자/특수문자 포함"
                            className={`h-11 pr-10 ${errors.adminPassword ? 'border-red-500' : ''}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {errors.adminPassword && (
                          <p className="text-sm text-red-500 mt-1">{errors.adminPassword}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="adminPasswordConfirm">비밀번호 확인 *</Label>
                        <div className="relative">
                          <Input
                            id="adminPasswordConfirm"
                            type={showPasswordConfirm ? 'text' : 'password'}
                            value={formData.adminPasswordConfirm}
                            onChange={(e) => handleInputChange('adminPasswordConfirm', e.target.value)}
                            placeholder="비밀번호 재입력"
                            className={`h-11 pr-10 ${errors.adminPasswordConfirm ? 'border-red-500' : ''}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          >
                            {showPasswordConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {errors.adminPasswordConfirm && (
                          <p className="text-sm text-red-500 mt-1">{errors.adminPasswordConfirm}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* 크레딧 설정 탭 */}
              <TabsContent value="credits" className="p-6 m-0">
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-center gap-2 mb-6">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-slate-900">크레딧 설정</h3>
                  </div>
                  
                  <Alert className="mb-6 border-orange-200 bg-orange-50">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-700">
                      시스템 관리자만 크레딧을 할당할 수 있습니다. 신중하게 설정해주세요.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="initialCredits">초기 크레딧</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <Input
                            id="initialCredits"
                            type="number"
                            value={formData.initialCredits}
                            onChange={(e) => {
                              const value = e.target.value
                              handleInputChange('initialCredits', value === '' ? 0 : parseInt(value) || 0)
                            }}
                            min="0"
                            className="h-11 pl-10"
                            placeholder="0"
                          />
                        </div>
                        <p className="text-xs text-slate-600 mt-1">기본 제공 크레딧</p>
                      </div>
                      
                      <div>
                        <Label htmlFor="promotionCredits">프로모션 크레딧</Label>
                        <div className="relative">
                          <Gift className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
                          <Input
                            id="promotionCredits"
                            type="number"
                            value={formData.promotionCredits}
                            onChange={(e) => {
                              const value = e.target.value
                              handleInputChange('promotionCredits', value === '' ? 0 : parseInt(value) || 0)
                            }}
                            min="0"
                            className="h-11 pl-10"
                            placeholder="0"
                          />
                        </div>
                        <p className="text-xs text-slate-600 mt-1">추가 프로모션 크레딧</p>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="creditExpireDate">크레딧 만료일 (선택)</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input
                          id="creditExpireDate"
                          type="date"
                          value={formData.creditExpireDate}
                          onChange={(e) => handleInputChange('creditExpireDate', e.target.value)}
                          className="h-11 pl-10"
                        />
                      </div>
                      <p className="text-xs text-slate-600 mt-1">설정하지 않으면 만료 없음</p>
                    </div>
                    
                    {(formData.initialCredits > 0 || formData.promotionCredits > 0) && (
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mt-4">
                        <h4 className="font-medium text-blue-900 mb-2">크레딧 요약</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>초기 크레딧:</span>
                            <span className="font-medium">{formData.initialCredits.toLocaleString()} 크레딧</span>
                          </div>
                          <div className="flex justify-between">
                            <span>프로모션 크레딧:</span>
                            <span className="font-medium text-green-600">+{formData.promotionCredits.toLocaleString()} 크레딧</span>
                          </div>
                          <div className="flex justify-between border-t pt-1">
                            <span className="font-medium">총 크레딧:</span>
                            <span className="font-bold text-blue-900">{(formData.initialCredits + formData.promotionCredits).toLocaleString()} 크레딧</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* 구독 설정 탭 */}
              <TabsContent value="subscription" className="p-6 m-0">
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-center gap-2 mb-6">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-slate-900">구독 설정</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="subscriptionPlan">구독 플랜</Label>
                      <Select value={formData.subscriptionPlan} onValueChange={(value: any) => handleInputChange('subscriptionPlan', value)}>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TRIAL">무료 체험 (30일)</SelectItem>
                          <SelectItem value="BASIC">베이직</SelectItem>
                          <SelectItem value="PREMIUM">프리미엄</SelectItem>
                          <SelectItem value="ENTERPRISE">엔터프라이즈</SelectItem>
                          <SelectItem value="CUSTOM">커스텀</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {formData.subscriptionPlan === 'TRIAL' && (
                      <div>
                        <Label htmlFor="trialDays">체험 기간 (일)</Label>
                        <Input
                          id="trialDays"
                          type="number"
                          value={formData.trialDays}
                          onChange={(e) => handleInputChange('trialDays', parseInt(e.target.value) || 30)}
                          min="1"
                          max="365"
                          className="h-11"
                        />
                        <p className="text-xs text-slate-600 mt-1">기본값: 30일</p>
                      </div>
                    )}
                    
                    {formData.subscriptionPlan === 'CUSTOM' && (
                      <div>
                        <Label htmlFor="customPrice">커스텀 가격 (월)</Label>
                        <Input
                          id="customPrice"
                          type="number"
                          value={formData.customPrice || ''}
                          onChange={(e) => handleInputChange('customPrice', parseInt(e.target.value) || undefined)}
                          min="0"
                          placeholder="가격 입력"
                          className="h-11"
                        />
                      </div>
                    )}
                    
                    <div className="bg-slate-100 p-4 rounded-xl">
                      <Label htmlFor="specialTerms" className="text-slate-700">특별 조건 (선택)</Label>
                      <Textarea
                        id="specialTerms"
                        value={formData.specialTerms}
                        onChange={(e) => handleInputChange('specialTerms', e.target.value)}
                        placeholder="특별 계약 조건이나 할인 정보 등을 입력하세요"
                        rows={3}
                        className="min-h-[80px] bg-white text-slate-700 placeholder-slate-500"
                      />
                    </div>
                    
                    <div className="bg-slate-100 p-4 rounded-xl">
                      <Label htmlFor="systemNotes" className="text-slate-700">시스템 메모 (선택)</Label>
                      <Textarea
                        id="systemNotes"
                        value={formData.systemNotes}
                        onChange={(e) => handleInputChange('systemNotes', e.target.value)}
                        placeholder="내부 참고사항을 입력하세요"
                        rows={3}
                        className="min-h-[80px] bg-white text-slate-700 placeholder-slate-500"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t flex justify-end gap-3 rounded-b-2xl">
            <Button variant="outline" onClick={onClose} disabled={isLoading} className="h-11 px-6 text-slate-900 border-slate-300 hover:bg-slate-50">
              취소
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading || !isFormValid()}
              className={`h-11 px-6 text-white ${
                isFormValid() 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700' 
                  : 'bg-slate-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  등록 중...
                </>
              ) : (
                '기업 등록'
              )}
            </Button>
          </div>
        </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export default CreateEnterpriseModal