import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@ui/button';
import { Card, CardContent } from '@ui/card';
import { Input } from '@ui/input';
import { Textarea } from '@ui/textarea';
import { Checkbox } from '@ui/checkbox';
import { Alert, AlertDescription } from '@ui/alert';
import { ArrowLeft, Building, User, Shield, Mail, Phone, MapPin, IdCard, CheckCircle, AlertCircle, Brain } from 'lucide-react';
import { OrganizationService } from '@domains/organization/services/CompanyService';
import { enterpriseAuthService } from '@domains/organization/services/EnterpriseAuthService';
import { toast } from 'sonner';

// 간단한 validation 함수들
const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validatePassword = (password: string) => {
  return password.length >= 8 && /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password);
};

const validatePhoneNumber = (phone: string) => {
  return /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/.test(phone);
};

interface CompanyJoinData {
  // 회사 코드
  companyCode: string;
  
  // 개인 정보
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
  phone: string;
  address: string;
  
  // 직원 정보
  employeeId: string;
  department: string;
  position: string;
  
  // 약관 동의
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
  agreeToMarketing: boolean;
}

interface CompanyInfo {
  name: string;
  address: string;
  employeeCount: number;
  adminEmail: string;
}

export function CompanyJoinForm() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CompanyJoinData>({
    companyCode: '',
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    phone: '',
    address: '',
    employeeId: '',
    department: '',
    position: '',
    agreeToTerms: false,
    agreeToPrivacy: false,
    agreeToMarketing: false
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CompanyJoinData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [isCompanyVerified, setIsCompanyVerified] = useState(false);
  const [agreeToAll, setAgreeToAll] = useState(false);

  // 디버깅용 로그
  useEffect(() => {
    console.log('🔍 CompanyJoinForm - currentStep:', currentStep);
    console.log('🔍 CompanyJoinForm - isCompanyVerified:', isCompanyVerified);
    console.log('🔍 CompanyJoinForm - companyInfo:', companyInfo);
  }, [currentStep, isCompanyVerified, companyInfo]);

  const handleInputChange = (field: keyof CompanyJoinData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleAgreeToAll = (checked: boolean) => {
    setAgreeToAll(checked);
    setFormData(prev => ({
      ...prev,
      agreeToTerms: checked,
      agreeToPrivacy: checked,
      agreeToMarketing: checked
    }));
    
    if (checked) {
      setErrors(prev => ({
        ...prev,
        agreeToTerms: undefined,
        agreeToPrivacy: undefined
      }));
    }
  };

  const verifyCompanyCode = async () => {
    console.log('🔵 verifyCompanyCode 시작 - 입력된 코드:', formData.companyCode);
    
    if (!formData.companyCode.trim()) {
      setErrors(prev => ({
        ...prev,
        companyCode: '회사 코드를 입력해주세요.'
      }));
      return;
    }

    setIsLoading(true);
    try {
      // 실제 데이터베이스 조회
      let company = await OrganizationService.getOrganizationByCode(formData.companyCode);
      
      // 실제 데이터가 없으면 테스트 데이터 사용
      if (!company) {
        console.log('🔴 실제 데이터 없음, 테스트 데이터 확인 중...');
        
        // 테스트용 회사 코드들
        const testCompanies = {
          'COMPANY123': {
            name: '테스트 회사',
            address: '서울시 강남구 테헤란로 123',
            employeeCount: 100,
            adminEmail: 'admin@testcompany.com'
          },
          'TESTCO456': {
            name: '테스트 기업',
            address: '서울시 서초구 강남대로 456',
            employeeCount: 50,
            adminEmail: 'admin@testco.com'
          }
        };

        const testCompany = testCompanies[formData.companyCode as keyof typeof testCompanies];
        if (testCompany) {
          console.log('✅ 테스트 회사 발견:', testCompany);
          setCompanyInfo(testCompany);
          setIsCompanyVerified(true);
          setCurrentStep(2);
          console.log('✅ 회사 코드 검증 성공 (테스트 데이터), 2단계로 진행');
          toast.success(`${testCompany.name}의 회사 코드가 확인되었습니다!`);
          return;
        }
      }
      
      if (company) {
        console.log('✅ 실제 회사 발견:', company);
        setCompanyInfo({
          name: company.organizationName,
          address: company.address,
          employeeCount: company.initialMemberCount,
          adminEmail: company.contactEmail
        });
        setIsCompanyVerified(true);
        setCurrentStep(2);
        console.log('✅ 회사 코드 검증 성공 (실제 데이터), 2단계로 진행');
        toast.success(`${company.organizationName}의 회사 코드가 확인되었습니다!`);
      } else {
        console.log('❌ 회사 코드 찾을 수 없음');
        setErrors(prev => ({
          ...prev,
          companyCode: '존재하지 않는 회사 코드입니다. 테스트용 코드: COMPANY123 또는 TESTCO456'
        }));
        setCompanyInfo(null);
        setIsCompanyVerified(false);
      }
    } catch (error) {
      console.error('❌ 회사 코드 검증 실패:', error);
      setErrors(prev => ({
        ...prev,
        companyCode: '회사 코드 검증에 실패했습니다.'
      }));
      setCompanyInfo(null);
      setIsCompanyVerified(false);
    } finally {
      setIsLoading(false);
      console.log('🔵 verifyCompanyCode 완료');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CompanyJoinData, string>> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요.';
    }
    
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = '비밀번호는 8자 이상이어야 하며, 영문, 숫자, 특수문자를 포함해야 합니다.';
    }
    
    if (!formData.passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호 확인을 입력해주세요.';
    } else if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = '전화번호를 입력해주세요.';
    } else if (!validatePhoneNumber(formData.phone)) {
      newErrors.phone = '올바른 전화번호 형식을 입력해주세요. (예: 010-1234-5678)';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = '주소를 입력해주세요.';
    } else if (formData.address.length < 5) {
      newErrors.address = '주소는 5자 이상 입력해주세요.';
    }
    
    if (!formData.employeeId.trim()) {
      newErrors.employeeId = '사원번호를 입력해주세요.';
    }
    
    if (!formData.department.trim()) {
      newErrors.department = '부서를 입력해주세요.';
    }
    
    if (!formData.position.trim()) {
      newErrors.position = '직급을 입력해주세요.';
    }
    
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = '서비스 이용약관에 동의해주세요.';
    }
    
    if (!formData.agreeToPrivacy) {
      newErrors.agreeToPrivacy = '개인정보 처리방침에 동의해주세요.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 2단계 개인정보 검증
  const validatePersonalInfo = (): boolean => {
    const newErrors: Partial<Record<keyof CompanyJoinData, string>> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요.';
    }
    
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = '비밀번호는 8자 이상이어야 하며, 영문, 숫자, 특수문자를 포함해야 합니다.';
    }
    
    if (!formData.passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호 확인을 입력해주세요.';
    } else if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = '전화번호를 입력해주세요.';
    } else if (!validatePhoneNumber(formData.phone)) {
      newErrors.phone = '올바른 전화번호 형식을 입력해주세요. (예: 010-1234-5678)';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = '주소를 입력해주세요.';
    } else if (formData.address.length < 5) {
      newErrors.address = '주소는 5자 이상 입력해주세요.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 3단계 직원정보 검증
  const validateEmployeeInfo = (): boolean => {
    const newErrors: Partial<Record<keyof CompanyJoinData, string>> = {};
    
    if (!formData.employeeId.trim()) {
      newErrors.employeeId = '사원번호를 입력해주세요.';
    }
    
    if (!formData.department.trim()) {
      newErrors.department = '부서를 입력해주세요.';
    }
    
    if (!formData.position.trim()) {
      newErrors.position = '직급을 입력해주세요.';
    }
    
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = '서비스 이용약관에 동의해주세요.';
    }
    
    if (!formData.agreeToPrivacy) {
      newErrors.agreeToPrivacy = '개인정보 처리방침에 동의해주세요.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 다음 단계로 진행
  const handleNextStep = () => {
    if (currentStep === 2) {
      // 2단계 개인정보 검증
      if (validatePersonalInfo()) {
        setCurrentStep(3);
        console.log('✅ 2단계 검증 완료, 3단계로 진행');
      }
    }
  };

  // 이전 단계로 돌아가기
  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      console.log('⬅️ 이전 단계로 돌아감, 현재 단계:', currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 3단계에서만 실제 제출 처리
    if (currentStep !== 3) {
      return;
    }
    
    // 전체 폼 검증
    if (!validateEmployeeInfo()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('📝 회원가입 시도:', {
        companyCode: formData.companyCode,
        name: formData.name,
        email: formData.email,
        employeeId: formData.employeeId,
        department: formData.department,
        position: formData.position
      });
      
      // 조직 구성원으로 등록
      await enterpriseAuthService.signUp({
        userType: 'ORGANIZATION_MEMBER',
        email: formData.email,
        password: formData.password,
        displayName: formData.name,
        phone: formData.phone,
        address: formData.address,
        employeeId: formData.employeeId,
        department: formData.department,
        position: formData.position,
        organizationId: formData.companyCode // 회사 코드를 organizationId로 사용
      });
      
      console.log('✅ 회원가입 성공');
      toast.success('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.');
      
      // 로그인 페이지로 이동
      setTimeout(() => {
        navigate('/');
      }, 1000);
      
    } catch (error: any) {
      console.error('❌ 회원가입 실패:', error);
      toast.error(error.message || '회원가입에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 모든 약관 동의 상태 확인
  useEffect(() => {
    const allAgreed = formData.agreeToTerms && formData.agreeToPrivacy && formData.agreeToMarketing;
    setAgreeToAll(allAgreed);
  }, [formData.agreeToTerms, formData.agreeToPrivacy, formData.agreeToMarketing]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/signup')}
            className="mb-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로가기
          </Button>
          
          <div className="flex items-center justify-center gap-3 mb-6">
            <Brain className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">MIND BREEZE</h1>
          </div>
          
          <p className="text-gray-600 text-lg">기존 회사에 참여하기</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 현재 단계 표시 */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
              currentStep === 1 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
            }`}>
              <span className="text-sm font-medium">1. 회사 코드 입력</span>
            </div>
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
              currentStep === 2 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
            }`}>
              <span className="text-sm font-medium">2. 개인정보 입력</span>
            </div>
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
              currentStep === 3 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
            }`}>
              <span className="text-sm font-medium">3. 직원정보 입력</span>
            </div>
          </div>

          {/* 회사 코드 입력 */}
          {currentStep === 1 && (
            <Card className="rounded-3xl shadow-2xl border-0">
              <CardContent className="p-8">
                <div className="bg-gray-50 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Building className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">회사 코드 입력</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="companyCode" className="block text-sm font-medium text-gray-700 mb-2">
                        회사 코드 *
                      </label>
                      <Input
                        id="companyCode"
                        value={formData.companyCode}
                        onChange={(e) => handleInputChange('companyCode', e.target.value)}
                        placeholder="예: COMPANY123"
                        className={`rounded-xl ${errors.companyCode ? 'border-red-500' : ''}`}
                        disabled={isLoading}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            verifyCompanyCode();
                          }
                        }}
                      />
                      {errors.companyCode && (
                        <p className="text-sm text-red-500 mt-1">{errors.companyCode}</p>
                      )}
                    </div>

                    {/* 테스트 코드 안내 */}
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">테스트용 회사 코드:</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-blue-700">COMPANY123</span>
                          <Button
                            type="button"
                            onClick={() => handleInputChange('companyCode', 'COMPANY123')}
                            className="text-xs px-2 py-1 h-auto bg-blue-500 hover:bg-blue-600"
                            disabled={isLoading}
                          >
                            사용
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-blue-700">TESTCO456</span>
                          <Button
                            type="button"
                            onClick={() => handleInputChange('companyCode', 'TESTCO456')}
                            className="text-xs px-2 py-1 h-auto bg-blue-500 hover:bg-blue-600"
                            disabled={isLoading}
                          >
                            사용
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      type="button"
                      onClick={verifyCompanyCode}
                      disabled={isLoading || !formData.companyCode.trim()}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-medium transition-colors disabled:opacity-50"
                    >
                      {isLoading ? '확인 중...' : '회사 코드 확인'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 개인 정보 입력 (2단계) */}
          {currentStep === 2 && (
            <>
              {/* 회사 정보 표시 */}
              {companyInfo && (
                <Card className="rounded-3xl shadow-2xl border-0">
                  <CardContent className="p-8">
                    <div className="bg-green-50 rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <h3 className="text-lg font-semibold text-gray-900">회사 정보 확인</h3>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700">{companyInfo.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700">{companyInfo.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700">직원 수: {companyInfo.employeeCount}명</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700">관리자: {companyInfo.adminEmail}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 개인 정보 입력 */}
              <Card className="rounded-3xl shadow-2xl border-0">
                <CardContent className="p-8">
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <User className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">개인 정보</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                            이름 *
                          </label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="홍길동"
                            className={`rounded-xl text-gray-900 ${errors.name ? 'border-red-500' : ''}`}
                          />
                          {errors.name && (
                            <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            이메일 *
                          </label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            placeholder="user@company.com"
                            className={`rounded-xl text-gray-900 ${errors.email ? 'border-red-500' : ''}`}
                          />
                          {errors.email && (
                            <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            비밀번호 *
                          </label>
                          <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            placeholder="영문, 숫자, 특수문자 포함 8자 이상"
                            className={`rounded-xl text-gray-900 ${errors.password ? 'border-red-500' : ''}`}
                          />
                          {errors.password && (
                            <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 mb-2">
                            비밀번호 확인 *
                          </label>
                          <Input
                            id="passwordConfirm"
                            type="password"
                            value={formData.passwordConfirm}
                            onChange={(e) => handleInputChange('passwordConfirm', e.target.value)}
                            placeholder="비밀번호 다시 입력"
                            className={`rounded-xl text-gray-900 ${errors.passwordConfirm ? 'border-red-500' : ''}`}
                          />
                          {errors.passwordConfirm && (
                            <p className="text-sm text-red-500 mt-1">{errors.passwordConfirm}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                            전화번호 *
                          </label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="010-1234-5678"
                            className={`rounded-xl text-gray-900 ${errors.phone ? 'border-red-500' : ''}`}
                          />
                          {errors.phone && (
                            <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                            주소 *
                          </label>
                          <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            placeholder="서울시 강남구 테헤란로 123"
                            className={`rounded-xl text-gray-900 ${errors.address ? 'border-red-500' : ''}`}
                          />
                          {errors.address && (
                            <p className="text-sm text-red-500 mt-1">{errors.address}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 2단계 네비게이션 버튼 */}
              <div className="flex justify-between space-x-4">
                <Button
                  type="button"
                  onClick={handlePreviousStep}
                  variant="outline"
                  className="flex-1 rounded-xl py-3 border-gray-300 hover:bg-gray-50"
                >
                  이전
                </Button>
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3"
                >
                  다음
                </Button>
              </div>
            </>
          )}

          {/* 직원 정보 입력 (3단계) */}
          {currentStep === 3 && (
            <>
              {/* 회사 정보 표시 */}
              {companyInfo && (
                <Card className="rounded-3xl shadow-2xl border-0">
                  <CardContent className="p-8">
                    <div className="bg-green-50 rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <h3 className="text-lg font-semibold text-gray-900">회사 정보 확인</h3>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700">{companyInfo.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700">{companyInfo.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700">직원 수: {companyInfo.employeeCount}명</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700">관리자: {companyInfo.adminEmail}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 직원 정보 입력 */}
              <Card className="rounded-3xl shadow-2xl border-0">
                <CardContent className="p-8">
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <IdCard className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">직원 정보</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-2">
                            사원번호 *
                          </label>
                          <Input
                            id="employeeId"
                            value={formData.employeeId}
                            onChange={(e) => handleInputChange('employeeId', e.target.value)}
                            placeholder="EMP001"
                            className={`rounded-xl text-gray-900 ${errors.employeeId ? 'border-red-500' : ''}`}
                          />
                          {errors.employeeId && (
                            <p className="text-sm text-red-500 mt-1">{errors.employeeId}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                            부서 *
                          </label>
                          <Input
                            id="department"
                            value={formData.department}
                            onChange={(e) => handleInputChange('department', e.target.value)}
                            placeholder="개발팀"
                            className={`rounded-xl text-gray-900 ${errors.department ? 'border-red-500' : ''}`}
                          />
                          {errors.department && (
                            <p className="text-sm text-red-500 mt-1">{errors.department}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                            직급 *
                          </label>
                          <Input
                            id="position"
                            value={formData.position}
                            onChange={(e) => handleInputChange('position', e.target.value)}
                            placeholder="대리"
                            className={`rounded-xl text-gray-900 ${errors.position ? 'border-red-500' : ''}`}
                          />
                          {errors.position && (
                            <p className="text-sm text-red-500 mt-1">{errors.position}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 약관 동의 */}
              <Card className="rounded-3xl shadow-2xl border-0">
                <CardContent className="p-8">
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">약관 동의</h3>
                    </div>
                    
                    <div className="space-y-4">
                      {/* 모든 약관 동의 */}
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="agreeToAll"
                          checked={agreeToAll}
                          onCheckedChange={handleAgreeToAll}
                          className="mt-1"
                        />
                        <label htmlFor="agreeToAll" className="text-sm font-medium text-gray-900 cursor-pointer">
                          모든 약관에 동의합니다
                        </label>
                      </div>

                      {/* 구분선 */}
                      <div className="border-t border-gray-200 my-4" />

                      {/* 개별 약관 동의 */}
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id="agreeToTerms"
                            checked={formData.agreeToTerms}
                            onCheckedChange={(checked) => {
                              handleInputChange('agreeToTerms', checked);
                            }}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <label htmlFor="agreeToTerms" className="text-sm text-gray-700 cursor-pointer">
                              <span className="text-blue-600 font-medium">[필수]</span> 서비스 이용약관에 동의합니다
                            </label>
                            {errors.agreeToTerms && (
                              <p className="text-sm text-red-500 mt-1">{errors.agreeToTerms}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id="agreeToPrivacy"
                            checked={formData.agreeToPrivacy}
                            onCheckedChange={(checked) => {
                              handleInputChange('agreeToPrivacy', checked);
                            }}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <label htmlFor="agreeToPrivacy" className="text-sm text-gray-700 cursor-pointer">
                              <span className="text-blue-600 font-medium">[필수]</span> 개인정보 처리방침에 동의합니다
                            </label>
                            {errors.agreeToPrivacy && (
                              <p className="text-sm text-red-500 mt-1">{errors.agreeToPrivacy}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id="agreeToMarketing"
                            checked={formData.agreeToMarketing}
                            onCheckedChange={(checked) => {
                              handleInputChange('agreeToMarketing', checked);
                            }}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <label htmlFor="agreeToMarketing" className="text-sm text-gray-700 cursor-pointer">
                              <span className="text-gray-500 font-medium">[선택]</span> 마케팅 정보 수신에 동의합니다
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 3단계 네비게이션 버튼 */}
              <div className="flex justify-between space-x-4">
                <Button
                  type="button"
                  onClick={handlePreviousStep}
                  variant="outline"
                  className="flex-1 rounded-xl py-3 border-gray-300 hover:bg-gray-50"
                >
                  이전
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 disabled:opacity-50"
                >
                  {isLoading ? '가입 중...' : '가입하기'}
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

export default CompanyJoinForm;