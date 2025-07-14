import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Building2, 
  User, 
  Key, 
  Mail, 
  Phone, 
  IdCard,
  Shield,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Search,
  Brain
} from 'lucide-react';
import { CompanyService } from '../../services/CompanyService';
import { CompanyCodeService } from '../../services/CompanyCodeService';
import { toast } from 'sonner';

interface CompanyJoinData {
  // 회사 코드
  companyCode: string;
  
  // 개인 정보
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
  phone: string;
  
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

export default function CompanyJoinForm() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [codeVerified, setCodeVerified] = useState(false);
  const [agreeToAll, setAgreeToAll] = useState(false);
  
  const [formData, setFormData] = useState<CompanyJoinData>({
    companyCode: '',
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    phone: '',
    employeeId: '',
    department: '',
    position: '',
    agreeToTerms: false,
    agreeToPrivacy: false,
    agreeToMarketing: false
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CompanyJoinData, string>>>({});

  const handleInputChange = (field: keyof CompanyJoinData, value: string | boolean) => {
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

  const handleAgreeToAll = (checked: boolean) => {
    setAgreeToAll(checked);
    setFormData(prev => ({
      ...prev,
      agreeToTerms: checked,
      agreeToPrivacy: checked,
      agreeToMarketing: checked
    }));
    
    // 에러 제거
    if (checked) {
      setErrors(prev => ({ 
        ...prev, 
        agreeToTerms: undefined,
        agreeToPrivacy: undefined 
      }));
    }
  };

  const verifyCompanyCode = async () => {
    if (!formData.companyCode.trim()) {
      setErrors(prev => ({ ...prev, companyCode: '회사 코드를 입력해주세요' }));
      return;
    }

    setIsVerifying(true);
    
    try {
      // 먼저 회사 코드 형식 및 존재 여부 확인
      const validation = await CompanyCodeService.validateCompanyCode(formData.companyCode);
      
      if (!validation.isValid) {
        setErrors(prev => ({ ...prev, companyCode: validation.error || '유효하지 않은 회사 코드입니다' }));
        return;
      }

      // 유효한 경우 전체 회사 정보 조회
      const company = await CompanyService.getCompanyByCode(formData.companyCode);
      
      if (company) {
        setCompanyInfo({
          name: company.companyName,
          address: company.address,
          employeeCount: company.employeeCount,
          adminEmail: company.contactEmail
        });
        setCodeVerified(true);
        toast.success('회사 코드가 확인되었습니다!');
      } else {
        setErrors(prev => ({ ...prev, companyCode: '회사 정보를 찾을 수 없습니다' }));
      }
    } catch (error) {
      console.error('회사 코드 검증 오류:', error);
      setErrors(prev => ({ ...prev, companyCode: '회사 코드 검증 중 오류가 발생했습니다' }));
    } finally {
      setIsVerifying(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CompanyJoinData, string>> = {};

    // 회사 코드 검증
    if (!codeVerified) {
      newErrors.companyCode = '회사 코드를 먼저 확인해주세요';
    }

    // 개인 정보 검증
    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요';
    }
    
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요';
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 최소 6자 이상이어야 합니다';
    }
    
    if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = '전화번호를 입력해주세요';
    }

    // 직원 정보 검증
    if (!formData.employeeId.trim()) {
      newErrors.employeeId = '사원번호를 입력해주세요';
    }
    
    if (!formData.department.trim()) {
      newErrors.department = '부서를 입력해주세요';
    }
    
    if (!formData.position.trim()) {
      newErrors.position = '직급을 입력해주세요';
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
      // 회사 정보 조회
      const company = await CompanyService.getCompanyByCode(formData.companyCode);
      
      if (!company) {
        throw new Error('회사 정보를 찾을 수 없습니다');
      }

      // 회사 멤버 추가 (실제 구현에서는 Firebase Auth 사용자 생성도 필요)
      const memberData = {
        employeeId: formData.employeeId,
        department: formData.department,
        position: formData.position
      };

      // 임시 사용자 ID (실제 구현에서는 Firebase Auth에서 생성된 UID 사용)
      const tempUserId = `temp_${Date.now()}`;
      
      const success = await CompanyService.addCompanyMember(
        company.id,
        tempUserId,
        memberData
      );

      if (success) {
        toast.success('회사 참여가 완료되었습니다!');
        
        // 성공 페이지로 이동
        navigate('/company-join-success', { 
          state: { 
            companyCode: formData.companyCode,
            companyName: company.companyName,
            userName: formData.name,
            userEmail: formData.email,
            department: formData.department,
            position: formData.position
          } 
        });
      } else {
        throw new Error('회사 참여 처리에 실패했습니다');
      }
      
    } catch (error) {
      console.error('회사 참여 오류:', error);
      toast.error(error instanceof Error ? error.message : '회사 참여 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/company-signup-selection')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            이전으로
          </Button>
          
          {/* 브랜딩 헤더 */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">MIND BREEZE</h1>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            기존 회사 참여
          </h2>
          <p className="text-gray-600">
            관리자로부터 받은 6자리 회사 코드를 입력하여 회사에 참여하세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 회사 코드 입력 */}
          <Card className="rounded-3xl shadow-2xl border-0">
            <CardContent className="p-8">
              <div className="bg-gray-50 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Key className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">회사 코드 확인</h3>
                </div>
                <div className="space-y-4">
              <div>
                <label htmlFor="companyCode" className="block text-sm font-medium text-gray-700 mb-2">
                  회사 코드 (6자리) *
                </label>
                <div className="flex gap-2">
                  <Input
                    id="companyCode"
                    value={formData.companyCode}
                    onChange={(e) => handleInputChange('companyCode', e.target.value.toUpperCase())}
                    placeholder="MB2401"
                    maxLength={6}
                    className={errors.companyCode ? 'border-red-500' : (codeVerified ? 'border-green-500' : '')}
                    disabled={codeVerified}
                  />
                  <Button
                    type="button"
                    onClick={verifyCompanyCode}
                    disabled={isVerifying || codeVerified}
                    className="px-6"
                  >
                    {isVerifying ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        확인 중
                      </>
                    ) : codeVerified ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        확인됨
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        확인
                      </>
                    )}
                  </Button>
                </div>
                {errors.companyCode && (
                  <p className="text-sm text-red-500 mt-1">{errors.companyCode}</p>
                )}
              </div>

              {/* 확인된 회사 정보 */}
              {companyInfo && (
                <Alert className="border-green-200 bg-green-50">
                  <Building2 className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold text-green-800">
                        {companyInfo.name}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-green-700">
                        <p>주소: {companyInfo.address}</p>
                        <p>직원 수: {companyInfo.employeeCount}명</p>
                        <p>관리자 이메일: {companyInfo.adminEmail}</p>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 개인 정보 입력 (회사 코드 확인 후에만 표시) */}
          {codeVerified && (
            <>
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
                        className={errors.name ? 'border-red-500' : ''}
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
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                        비밀번호 *
                      </label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          placeholder="최소 6자 이상"
                          className={errors.password ? 'border-red-500' : ''}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 mb-2">
                        비밀번호 확인 *
                      </label>
                      <div className="relative">
                        <Input
                          id="passwordConfirm"
                          type={showPasswordConfirm ? 'text' : 'password'}
                          value={formData.passwordConfirm}
                          onChange={(e) => handleInputChange('passwordConfirm', e.target.value)}
                          placeholder="비밀번호 재입력"
                          className={errors.passwordConfirm ? 'border-red-500' : ''}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPasswordConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.passwordConfirm && (
                        <p className="text-sm text-red-500 mt-1">{errors.passwordConfirm}</p>
                      )}
                    </div>
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
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                    )}
                  </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                        className={errors.employeeId ? 'border-red-500' : ''}
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
                        className={errors.department ? 'border-red-500' : ''}
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
                        className={errors.position ? 'border-red-500' : ''}
                      />
                      {errors.position && (
                        <p className="text-sm text-red-500 mt-1">{errors.position}</p>
                      )}
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
                        <div className="flex-1">
                          <label htmlFor="agreeToAll" className="text-sm font-bold cursor-pointer text-gray-900">
                            모든 약관에 동의합니다
                          </label>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-200 pt-4">
                        <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onCheckedChange={(checked) => handleInputChange('agreeToTerms', checked)}
                      />
                      <div className="flex-1">
                        <label htmlFor="agreeToTerms" className="text-sm font-medium cursor-pointer">
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
                      />
                      <div className="flex-1">
                        <label htmlFor="agreeToPrivacy" className="text-sm font-medium cursor-pointer">
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
                      />
                      <div className="flex-1">
                        <label htmlFor="agreeToMarketing" className="text-sm font-medium cursor-pointer">
                          마케팅 정보 수신 동의 (선택)
                        </label>
                        <p className="text-xs text-gray-600 mt-1">
                          신규 서비스 및 이벤트 정보를 이메일로 받아보실 수 있습니다.
                        </p>
                      </div>
                    </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 제출 버튼 */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/company-signup-selection')}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      참여 중...
                    </>
                  ) : (
                    '회사 참여 완료'
                  )}
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
} 