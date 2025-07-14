import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Shield, 
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Brain
} from 'lucide-react';
import { OrganizationService } from '../../services/CompanyService';
import { OrganizationCodeService } from '../../services/CompanyCodeService';
import { toast } from 'sonner';

interface CompanyRegistrationData {
  // 회사 정보
  companyName: string;
  businessNumber: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  
  // 관리자 정보
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  adminPasswordConfirm: string;
  adminPhone: string;
  adminAddress: string;
  
  // 서비스 설정
  totalEmployees: number;
  testingFrequency: 'ONCE' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  contractPeriod: number; // 계약 기간 (개월)
  
  // 링크 밴드 설정
  deviceOption: 'RENTAL_1M' | 'RENTAL_3M' | 'PURCHASE';
  deviceQuantity: number;
  
  // 약관 동의
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
  agreeToMarketing: boolean;
}

export default function CompanyRegistrationForm() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [generatedCompanyCode, setGeneratedCompanyCode] = useState<string | null>(null);
  const [agreeToAll, setAgreeToAll] = useState(false);
  
  const [formData, setFormData] = useState<CompanyRegistrationData>({
    companyName: '',
    businessNumber: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    adminPasswordConfirm: '',
    adminPhone: '',
    adminAddress: '',
    totalEmployees: 10,
    testingFrequency: 'ONCE',
    contractPeriod: 12,
    deviceOption: 'RENTAL_1M',
    deviceQuantity: 1,
    agreeToTerms: false,
    agreeToPrivacy: false,
    agreeToMarketing: false
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CompanyRegistrationData, string>>>({});

  const handleInputChange = (field: keyof CompanyRegistrationData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 에러 제거
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // 약관 동의 상태 변경 시 모든 동의 체크박스 상태 업데이트
    if (field === 'agreeToTerms' || field === 'agreeToPrivacy' || field === 'agreeToMarketing') {
      const newFormData = { ...formData, [field]: value };
      const allAgreed = newFormData.agreeToTerms && newFormData.agreeToPrivacy && newFormData.agreeToMarketing;
      setAgreeToAll(allAgreed);
    }
  };

  // 모든 약관 동의/해제 처리
  const handleAgreeToAll = (checked: boolean) => {
    setAgreeToAll(checked);
    setFormData(prev => ({
      ...prev,
      agreeToTerms: checked,
      agreeToPrivacy: checked,
      agreeToMarketing: checked
    }));
    
    // 에러 메시지 제거
    if (checked) {
      setErrors(prev => ({
        ...prev,
        agreeToTerms: undefined,
        agreeToPrivacy: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CompanyRegistrationData, string>> = {};

    // 회사 정보 검증
    if (!formData.companyName.trim()) {
      newErrors.companyName = '회사명을 입력해주세요';
    }
    
    if (!formData.businessNumber.trim()) {
      newErrors.businessNumber = '사업자등록번호를 입력해주세요';
    } else if (!/^\d{3}-\d{2}-\d{5}$/.test(formData.businessNumber)) {
      newErrors.businessNumber = '올바른 사업자등록번호 형식을 입력해주세요 (예: 123-45-67890)';
    }
    
    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = '회사 연락처 이메일을 입력해주세요';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = '올바른 이메일 형식을 입력해주세요';
    }
    
    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = '회사 연락처를 입력해주세요';
    }

    // 관리자 정보 검증
    if (!formData.adminName.trim()) {
      newErrors.adminName = '관리자 이름을 입력해주세요';
    }
    
    if (!formData.adminEmail.trim()) {
      newErrors.adminEmail = '관리자 이메일을 입력해주세요';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
      newErrors.adminEmail = '올바른 이메일 형식을 입력해주세요';
    }
    
    if (!formData.adminPassword) {
      newErrors.adminPassword = '비밀번호를 입력해주세요';
    } else if (formData.adminPassword.length < 6) {
      newErrors.adminPassword = '비밀번호는 최소 6자 이상이어야 합니다';
    }
    
    if (formData.adminPassword !== formData.adminPasswordConfirm) {
      newErrors.adminPasswordConfirm = '비밀번호가 일치하지 않습니다';
    }

    if (!formData.adminPhone.trim()) {
      newErrors.adminPhone = '관리자 전화번호를 입력해주세요';
    } else if (!/^[0-9-]+$/.test(formData.adminPhone)) {
      newErrors.adminPhone = '올바른 전화번호 형식을 입력해주세요';
    }

    if (!formData.adminAddress.trim()) {
      newErrors.adminAddress = '관리자 주소를 입력해주세요';
    }

    // 서비스 설정 검증
    if (formData.totalEmployees < 1) {
      newErrors.totalEmployees = '직원 수는 1명 이상이어야 합니다';
    }
    
    if (formData.contractPeriod < 1) {
      newErrors.contractPeriod = '계약 기간은 1개월 이상이어야 합니다';
    }
    
    if (formData.deviceQuantity < 1) {
      newErrors.deviceQuantity = '링크 밴드 수량은 1개 이상이어야 합니다';
    }

    // 약관 동의 검증
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = '서비스 이용약관에 동의해주세요';
    }
    
    if (!formData.agreeToPrivacy) {
      newErrors.agreeToPrivacy = '개인정보처리방침에 동의해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('입력 정보를 확인해주세요');
      return;
    }

    setIsLoading(true);
    
    try {
      // 기존 CompanyService.registerCompany 메서드에 맞게 데이터 변환
      const registrationData = {
        companyName: formData.companyName,
        businessRegistrationNumber: formData.businessNumber,
        address: formData.address,
        employeeCount: formData.totalEmployees,
        industry: undefined,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail,
        adminUserData: {
          name: formData.adminName,
          email: formData.adminEmail,
          password: formData.adminPassword,
          position: '관리자',
          phone: formData.adminPhone,
          address: formData.adminAddress
        },
        // 새로운 서비스 설정 정보
        serviceConfig: {
          totalEmployees: formData.totalEmployees,
          testingFrequency: formData.testingFrequency,
          contractPeriod: formData.contractPeriod,
          deviceOption: formData.deviceOption,
          deviceQuantity: formData.deviceQuantity
        }
      };

      // 회사 등록 (OrganizationService가 내부적으로 회사 코드 생성)
      const registrationResult = await OrganizationService.registerOrganization(registrationData);

      if (registrationResult.success) {
        setGeneratedCompanyCode(registrationResult.organizationCode || null);
        toast.success('회사 등록이 완료되었습니다!');
        
        // 성공 페이지로 이동
        navigate('/company-registration-success', { 
          state: { 
            companyCode: registrationResult.organizationCode,
            companyName: formData.companyName,
            adminEmail: formData.adminEmail
          } 
        });
      } else {
        throw new Error(registrationResult.error || '회사 등록에 실패했습니다');
      }
      
    } catch (error) {
      console.error('회사 등록 오류:', error);
      toast.error(error instanceof Error ? error.message : '회사 등록 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateServicePricing = () => {
    const basePrice = 7900; // 기본 검사 비용
    
    // 검사 빈도에 따른 총 검사 횟수 계산
    const getTestsPerMonth = (frequency: string) => {
      switch (frequency) {
        case 'ONCE': return 1 / formData.contractPeriod; // 계약 기간 동안 1회만
        case 'WEEKLY': return 4; // 주 1회 = 월 4회
        case 'MONTHLY': return 1; // 월 1회
        case 'QUARTERLY': return 1 / 3; // 분기 1회 = 월 0.33회
        default: return 1;
      }
    };
    
    const testsPerMonth = getTestsPerMonth(formData.testingFrequency);
    const totalTests = formData.totalEmployees * testsPerMonth * formData.contractPeriod;
    
    // 할인율 계산 (총 검사 건수 기준)
    let discountRate = 0;
    if (totalTests >= 5000) discountRate = 0.30;
    else if (totalTests >= 1000) discountRate = 0.25;
    else if (totalTests >= 500) discountRate = 0.20;
    else if (totalTests >= 100) discountRate = 0.10;
    
    const discountedPrice = basePrice * (1 - discountRate);
    const totalTestingCost = totalTests * discountedPrice;
    
    // 링크 밴드 비용 계산
    const getDeviceCost = (option: string, quantity: number) => {
      switch (option) {
        case 'RENTAL_1M': return 70000 * quantity * formData.contractPeriod; // 월 렌탈 × 계약 기간
        case 'RENTAL_3M': return 150000 * quantity * Math.ceil(formData.contractPeriod / 3); // 3개월 렌탈 × 필요 주기
        case 'PURCHASE': return 297000 * quantity; // 구매
        default: return 0;
      }
    };
    
    const deviceCost = getDeviceCost(formData.deviceOption, formData.deviceQuantity);
    const totalCost = totalTestingCost + deviceCost;
    
    return {
      basePrice,
      discountedPrice,
      discountRate,
      totalTests: Math.round(totalTests),
      testsPerMonth,
      totalTestingCost,
      deviceCost,
      totalCost
    };
  };

  const pricing = calculateServicePricing();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Back Button */}
        <button
          onClick={() => navigate('/company-signup-selection')}
          className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>이전으로</span>
        </button>

        {/* Main Registration Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">MIND BREEZE</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              신규 회사 등록
            </h1>
            <p className="text-gray-600">
              AI 헬스케어 솔루션을 위한 회사 정보를 등록해주세요
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 회사 정보 */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">회사 정보</h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                      회사명 *
                    </label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      placeholder="주식회사 마인드브리즈"
                      className={`${errors.companyName ? 'border-red-500' : ''} rounded-xl`}
                    />
                    {errors.companyName && (
                      <p className="text-sm text-red-500 mt-1">{errors.companyName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="businessNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      사업자등록번호 *
                    </label>
                    <Input
                      id="businessNumber"
                      value={formData.businessNumber}
                      onChange={(e) => handleInputChange('businessNumber', e.target.value)}
                      placeholder="123-45-67890"
                      className={`${errors.businessNumber ? 'border-red-500' : ''} rounded-xl`}
                    />
                    {errors.businessNumber && (
                      <p className="text-sm text-red-500 mt-1">{errors.businessNumber}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-2">
                      회사 연락처 이메일 *
                    </label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                      placeholder="contact@company.com"
                      className={`${errors.contactEmail ? 'border-red-500' : ''} rounded-xl`}
                    />
                    {errors.contactEmail && (
                      <p className="text-sm text-red-500 mt-1">{errors.contactEmail}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-2">
                      회사 연락처 *
                    </label>
                    <Input
                      id="contactPhone"
                      value={formData.contactPhone}
                      onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                      placeholder="02-1234-5678"
                      className={`${errors.contactPhone ? 'border-red-500' : ''} rounded-xl`}
                    />
                    {errors.contactPhone && (
                      <p className="text-sm text-red-500 mt-1">{errors.contactPhone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    회사 주소 (선택사항)
                  </label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="서울시 강남구 테헤란로 123, 4층"
                    rows={2}
                    className="rounded-xl bg-white text-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* 관리자 정보 */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">관리자 정보</h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="adminName" className="block text-sm font-medium text-gray-700 mb-2">
                      관리자 이름 *
                    </label>
                    <Input
                      id="adminName"
                      value={formData.adminName}
                      onChange={(e) => handleInputChange('adminName', e.target.value)}
                      placeholder="홍길동"
                      className={`${errors.adminName ? 'border-red-500' : ''} rounded-xl`}
                    />
                    {errors.adminName && (
                      <p className="text-sm text-red-500 mt-1">{errors.adminName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 mb-2">
                      관리자 이메일 *
                    </label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={formData.adminEmail}
                      onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                      placeholder="admin@company.com"
                      className={`${errors.adminEmail ? 'border-red-500' : ''} rounded-xl`}
                    />
                    {errors.adminEmail && (
                      <p className="text-sm text-red-500 mt-1">{errors.adminEmail}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      비밀번호 *
                    </label>
                    <div className="relative">
                      <Input
                        id="adminPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.adminPassword}
                        onChange={(e) => handleInputChange('adminPassword', e.target.value)}
                        placeholder="최소 6자 이상"
                        className={`${errors.adminPassword ? 'border-red-500' : ''} rounded-xl pr-10`}
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
                    <label htmlFor="adminPasswordConfirm" className="block text-sm font-medium text-gray-700 mb-2">
                      비밀번호 확인 *
                    </label>
                    <div className="relative">
                      <Input
                        id="adminPasswordConfirm"
                        type={showPasswordConfirm ? 'text' : 'password'}
                        value={formData.adminPasswordConfirm}
                        onChange={(e) => handleInputChange('adminPasswordConfirm', e.target.value)}
                        placeholder="비밀번호 재입력"
                        className={`${errors.adminPasswordConfirm ? 'border-red-500' : ''} rounded-xl pr-10`}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="adminPhone" className="block text-sm font-medium text-gray-700 mb-2">
                      관리자 전화번호 *
                    </label>
                    <Input
                      id="adminPhone"
                      type="tel"
                      value={formData.adminPhone}
                      onChange={(e) => handleInputChange('adminPhone', e.target.value)}
                      placeholder="010-1234-5678"
                      className={`${errors.adminPhone ? 'border-red-500' : ''} rounded-xl`}
                    />
                    {errors.adminPhone && (
                      <p className="text-sm text-red-500 mt-1">{errors.adminPhone}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="adminAddress" className="block text-sm font-medium text-gray-700 mb-2">
                      우편물 받아볼 주소 *
                    </label>
                    <Input
                      id="adminAddress"
                      value={formData.adminAddress}
                      onChange={(e) => handleInputChange('adminAddress', e.target.value)}
                      placeholder="서울시 강남구 테헤란로 123"
                      className={`${errors.adminAddress ? 'border-red-500' : ''} rounded-xl text-gray-900`}
                    />
                    {errors.adminAddress && (
                      <p className="text-sm text-red-500 mt-1">{errors.adminAddress}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 서비스 설정 */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">서비스 설정</h3>
              </div>
              <div className="space-y-6">
                {/* 기본 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="totalEmployees" className="block text-sm font-medium text-gray-700 mb-2">
                      총 직원 수 *
                    </label>
                    <Input
                      id="totalEmployees"
                      type="number"
                      value={formData.totalEmployees}
                      onChange={(e) => handleInputChange('totalEmployees', parseInt(e.target.value) || 0)}
                      min="1"
                      max="100000"
                      placeholder="예: 100"
                      className="rounded-xl"
                    />
                    {errors.totalEmployees && (
                      <p className="text-sm text-red-500 mt-1">{errors.totalEmployees}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="contractPeriod" className="block text-sm font-medium text-gray-700 mb-2">
                      계약 기간 (개월) *
                    </label>
                    <Input
                      id="contractPeriod"
                      type="number"
                      value={formData.contractPeriod}
                      onChange={(e) => handleInputChange('contractPeriod', parseInt(e.target.value) || 0)}
                      min="1"
                      max="60"
                      placeholder="예: 12"
                      className="rounded-xl"
                    />
                    {errors.contractPeriod && (
                      <p className="text-sm text-red-500 mt-1">{errors.contractPeriod}</p>
                    )}
                  </div>
                </div>

                {/* 검사 빈도 */}
                <div>
                  <label htmlFor="testingFrequency" className="block text-sm font-medium text-gray-700 mb-2">
                    검사 빈도 *
                  </label>
                  <Select 
                    value={formData.testingFrequency} 
                    onValueChange={(value) => handleInputChange('testingFrequency', value)}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="검사 빈도를 선택해주세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONCE">1회성 검사 (계약 기간 동안 1회만)</SelectItem>
                      <SelectItem value="WEEKLY">주 1회 검사 (월 4회)</SelectItem>
                      <SelectItem value="MONTHLY">월 1회 검사</SelectItem>
                      <SelectItem value="QUARTERLY">분기 1회 검사 (3개월마다)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 링크 밴드 설정 */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">링크 밴드 설정</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="deviceOption" className="block text-sm font-medium text-gray-700 mb-2">
                        링크 밴드 옵션 *
                      </label>
                      <Select 
                        value={formData.deviceOption} 
                        onValueChange={(value) => handleInputChange('deviceOption', value)}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="링크 밴드 옵션을 선택해주세요" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RENTAL_1M">1개월 렌탈 (70,000원/개)</SelectItem>
                          <SelectItem value="RENTAL_3M">3개월 렌탈 (150,000원/개)</SelectItem>
                          <SelectItem value="PURCHASE">구매 (297,000원/개)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label htmlFor="deviceQuantity" className="block text-sm font-medium text-gray-700 mb-2">
                        링크 밴드 수량 *
                      </label>
                      <Input
                        id="deviceQuantity"
                        type="number"
                        value={formData.deviceQuantity}
                        onChange={(e) => handleInputChange('deviceQuantity', parseInt(e.target.value) || 0)}
                        min="1"
                        max="1000"
                        placeholder="예: 5"
                        className="rounded-xl"
                      />
                      {errors.deviceQuantity && (
                        <p className="text-sm text-red-500 mt-1">{errors.deviceQuantity}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 계약 요약 */}
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                  <h4 className="font-semibold mb-3 text-blue-900">계약 요약</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-700">
                      <span>총 직원 수:</span>
                      <span>{formData.totalEmployees.toLocaleString()}명</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>계약 기간:</span>
                      <span>{formData.contractPeriod}개월</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>총 검사 건수:</span>
                      <span>{pricing.totalTests.toLocaleString()}건</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>기본 단가:</span>
                      <span>{pricing.basePrice.toLocaleString()}원/건</span>
                    </div>
                    {pricing.discountRate > 0 && (
                      <>
                        <div className="flex justify-between text-green-600">
                          <span>볼륨 할인 ({Math.round(pricing.discountRate * 100)}%):</span>
                          <span>-{((pricing.basePrice - pricing.discountedPrice) * pricing.totalTests).toLocaleString()}원</span>
                        </div>
                        <div className="flex justify-between text-gray-700">
                          <span>할인 적용가:</span>
                          <span>{pricing.discountedPrice.toLocaleString()}원/건</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between text-gray-700">
                      <span>검사 총 비용:</span>
                      <span>{pricing.totalTestingCost.toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>링크 밴드 비용:</span>
                      <span>{pricing.deviceCost.toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg border-t pt-2">
                      <span className="text-gray-900">총 계약 금액:</span>
                      <span className="text-blue-600">{pricing.totalCost.toLocaleString()}원</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 약관 동의 */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">약관 동의</h3>
              </div>
              <div className="space-y-4">
                {/* 모든 약관 동의 */}
                <div className="pb-4 border-b border-gray-200">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="agreeToAll"
                      checked={agreeToAll}
                      onCheckedChange={handleAgreeToAll}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <label htmlFor="agreeToAll" className="text-sm font-bold cursor-pointer text-gray-900">
                        모든 약관에 동의합니다
                      </label>
                      <p className="text-xs text-gray-600 mt-1">
                        서비스 이용약관, 개인정보처리방침, 마케팅 정보 수신에 모두 동의합니다.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 개별 약관 동의 */}
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => handleInputChange('agreeToTerms', checked)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor="agreeToTerms" className="text-sm font-medium cursor-pointer text-gray-900">
                      서비스 이용약관 동의 (필수)
                    </label>
                    <p className="text-xs text-gray-600 mt-1">
                      MIND BREEZE AI 서비스 이용에 관한 약관에 동의합니다.
                    </p>
                  </div>
                </div>
                {errors.agreeToTerms && (
                  <p className="text-sm text-red-500 ml-6">{errors.agreeToTerms}</p>
                )}

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="agreeToPrivacy"
                    checked={formData.agreeToPrivacy}
                    onCheckedChange={(checked) => handleInputChange('agreeToPrivacy', checked)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor="agreeToPrivacy" className="text-sm font-medium cursor-pointer text-gray-900">
                      개인정보처리방침 동의 (필수)
                    </label>
                    <p className="text-xs text-gray-600 mt-1">
                      개인정보 수집, 이용, 제공에 대한 동의입니다.
                    </p>
                  </div>
                </div>
                {errors.agreeToPrivacy && (
                  <p className="text-sm text-red-500 ml-6">{errors.agreeToPrivacy}</p>
                )}

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="agreeToMarketing"
                    checked={formData.agreeToMarketing}
                    onCheckedChange={(checked) => handleInputChange('agreeToMarketing', checked)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor="agreeToMarketing" className="text-sm font-medium cursor-pointer text-gray-900">
                      마케팅 정보 수신 동의 (선택)
                    </label>
                    <p className="text-xs text-gray-600 mt-1">
                      신규 서비스 및 이벤트 정보를 이메일로 받아보실 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 생성된 회사 코드 표시 */}
            {generatedCompanyCode && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>회사 코드가 생성되었습니다: {generatedCompanyCode}</strong>
                  <br />
                  이 코드는 직원들이 회사에 참여할 때 사용됩니다.
                </AlertDescription>
              </Alert>
            )}

            {/* 제출 버튼 */}
            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/company-signup-selection')}
                className="flex-1 rounded-xl h-12 text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 rounded-xl h-12 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    등록 중...
                  </>
                ) : (
                  '회사 등록 완료'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 