import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { Eye, EyeOff, ArrowLeft, Building, Building2, Users, User, CheckCircle, Star, TrendingUp, Shield, Loader2, Brain, Mail, Lock, Search } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useAuth } from '../AuthProvider';
import { auth } from '@core/services/firebase';
import { FirebaseService } from '@core/services/FirebaseService';
import { enterpriseAuthService } from '@domains/organization/services/EnterpriseAuthService';
import { OrganizationService } from '@domains/organization/services/CompanyService';
import { OrganizationCodeService } from '@domains/organization/services/CompanyCodeService';
import { Button } from '@ui/button';
import { Input } from '@ui/input';
import { Separator } from '@ui/separator';
import { toast } from 'sonner';
import { UserType } from '@core/types/unified';

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  const [loginType, setLoginType] = useState<'email' | 'company'>('email');
  const [formData, setFormData] = useState({
    // 이메일 로그인
    email: '',
    password: '',
    
    // 회사 코드 로그인
    companyCode: '',
    employeeId: '',
    companyPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showCompanyPassword, setShowCompanyPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [companyInfo, setCompanyInfo] = useState<{
    name: string;
    address: string;
    employeeCount: number;
  } | null>(null);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // 인증 상태 변화 감지하여 자동 리다이렉션
  useEffect(() => {
    if (user && !loading) {
      navigate('/app/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  // 회사 코드 검증
  const verifyCompanyCode = async () => {
    if (!formData.companyCode.trim()) {
      setError('회사 코드를 입력해주세요');
      return;
    }

    setIsVerifyingCode(true);
    setError('');
    
    try {
      const validation = await OrganizationCodeService.validateOrganizationCode(formData.companyCode);
      
      if (!validation.isValid) {
        setError(validation.errorMessage || '유효하지 않은 회사 코드입니다');
        setCompanyInfo(null);
        return;
      }

      const company = await OrganizationService.getOrganizationByCode(formData.companyCode);
      
      if (company) {
        setCompanyInfo({
          name: company.organizationName,
          address: company.address,
          employeeCount: company.initialMemberCount
        });
        toast.success('회사 코드가 확인되었습니다!');
      } else {
        setError('회사 정보를 찾을 수 없습니다');
        setCompanyInfo(null);
      }
    } catch (error) {
      setCompanyInfo(null);
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // 이메일 로그인 처리
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      
      // 시스템 관리자인지 확인하여 Firestore 프로필 업데이트
      
      if (formData.email === 'admin-mindbreeze@looxidlabs.com') {
        
        await FirebaseService.updateUserProfile(userCredential.user.uid, {
          userType: UserType.SYSTEM_ADMIN,
          displayName: 'System Administrator',
          email: formData.email,
          permissions: JSON.stringify([
            'system:all',
            'organization:all',
            'user:all',
            'report:all',
            'credit:all',
            'analytics:all',
            'settings:all',
            'admin:all'
          ]),
          lastLoginAt: new Date(),
          isActive: true,
          organizationId: null, // 시스템 관리자는 특정 조직에 속하지 않음
          role: 'SYSTEM_ADMIN',
          department: 'System Administration',
          position: 'System Administrator',
          status: 'ACTIVE'
        });
        
      } else {
        // 일반 사용자 로그인 시간 업데이트
        try {
          await FirebaseService.updateUserProfile(userCredential.user.uid, {
            lastLoginAt: new Date()
          });
        } catch (updateError) {
          // Update error handled
        }
      }
    } catch (error: any) {
      console.error('로그인 오류:', error);
      setError(error.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 회사 코드 기반 로그인 처리
  const handleCompanyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    
    try {
      if (!companyInfo) {
        throw new Error('회사 코드를 먼저 확인해주세요');
      }

      // EnterpriseAuthService를 사용하여 로그인
      const user = await enterpriseAuthService.signIn({
        employeeId: formData.employeeId,
        organizationId: formData.companyCode,
        password: formData.companyPassword
      });
      
      toast.success(`환영합니다, ${user.displayName}님!`);
      
    } catch (error: any) {
      setError(error.message || '로그인 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return '등록되지 않은 이메일입니다.';
      case 'auth/wrong-password':
        return '비밀번호가 올바르지 않습니다.';
      case 'auth/invalid-email':
        return '유효하지 않은 이메일 형식입니다.';
      case 'auth/user-disabled':
        return '비활성화된 계정입니다.';
      case 'auth/too-many-requests':
        return '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
      case 'auth/invalid-credential':
        return '잘못된 인증 정보입니다. 이메일과 비밀번호를 확인해주세요.';
      case 'auth/network-request-failed':
        return '네트워크 연결을 확인해주세요.';
      default:
        return `로그인 중 오류가 발생했습니다. (${errorCode})`;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // 로딩 중이면 로딩 화면 표시
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">인증 상태 확인 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>홈으로 돌아가기</span>
        </button>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">MIND BREEZE</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">로그인</h1>
            <p className="text-gray-600">AI 헬스케어 솔루션에 오신 것을 환영합니다</p>
          </div>

          {/* Login Type Toggle */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setLoginType('email')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                loginType === 'email' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Mail className="w-4 h-4" />
              개인 로그인
            </button>
            <button
              type="button"
              onClick={() => setLoginType('company')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                loginType === 'company' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              기업 로그인
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Email Login Form */}
          {loginType === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  이메일 주소
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className="pl-10 py-3 bg-gray-50 border-gray-200 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="비밀번호를 입력하세요"
                    className="pl-10 pr-10 py-3 bg-gray-50 border-gray-200 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
              >
                {isLoading ? '로그인 중...' : '로그인'}
              </Button>
            </form>
          )}

          {/* Company Login Form */}
          {loginType === 'company' && (
            <form onSubmit={handleCompanyLogin} className="space-y-6">
              {/* Company Code Input */}
              <div>
                <label htmlFor="companyCode" className="block text-sm font-medium text-gray-700 mb-2">
                  회사 코드
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="companyCode"
                      name="companyCode"
                      type="text"
                      required
                      value={formData.companyCode}
                      onChange={handleChange}
                      placeholder="MB2401"
                      className="pl-10 py-3 bg-gray-50 border-gray-200 focus:bg-white"
                      maxLength={6}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={verifyCompanyCode}
                    disabled={isVerifyingCode || !formData.companyCode.trim()}
                    variant="outline"
                    className="px-4 py-3"
                  >
                    {isVerifyingCode ? (
                      <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Company Info Display */}
              {companyInfo && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-5 h-5 text-green-600" />
                    <h3 className="font-medium text-green-800">{companyInfo.name}</h3>
                  </div>
                  <p className="text-sm text-green-700">{companyInfo.address}</p>
                  <p className="text-xs text-green-600 mt-1">직원 수: {companyInfo.employeeCount}명</p>
                </div>
              )}

              {/* Employee Login Fields (only show if company is verified) */}
              {companyInfo && (
                <>
                  <div>
                    <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-2">
                      직원 ID
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="employeeId"
                        name="employeeId"
                        type="text"
                        required
                        value={formData.employeeId}
                        onChange={handleChange}
                        placeholder="직원 ID를 입력하세요"
                        className="pl-10 py-3 bg-gray-50 border-gray-200 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="companyPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      비밀번호
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="companyPassword"
                        name="companyPassword"
                        type={showCompanyPassword ? 'text' : 'password'}
                        required
                        value={formData.companyPassword}
                        onChange={handleChange}
                        placeholder="비밀번호를 입력하세요"
                        className="pl-10 pr-10 py-3 bg-gray-50 border-gray-200 focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCompanyPassword(!showCompanyPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCompanyPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                  >
                    {isLoading ? '로그인 중...' : '기업 로그인'}
                  </Button>
                </>
              )}
            </form>
          )}

          {/* Footer Links */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                계정이 없으신가요?{' '}
                <button
                  onClick={() => onNavigate('signup')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  회원가입
                </button>
              </p>
              <p className="text-sm text-gray-600">
                기업 회원가입을 원하시나요?{' '}
                <button
                  onClick={() => navigate('/company-signup-selection')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  기업 회원가입
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}