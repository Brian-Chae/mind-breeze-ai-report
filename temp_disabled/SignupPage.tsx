import { useState, useEffect } from 'react';
import { Brain, Eye, EyeOff, Mail, Lock, User, Phone, ArrowLeft, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { Checkbox } from '../ui/checkbox';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { FirebaseService } from '../../services/FirebaseService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthProvider';
import CompanySignupSelectionPage from './CompanySignupSelectionPage';

interface SignupPageProps {
  onNavigate: (page: string) => void;
}

export function SignupPage({ onNavigate }: SignupPageProps) {
  const [signupMode, setSignupMode] = useState<'selection' | 'company-registration' | 'member-registration'>('selection');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    birthDate: '',
    gender: ''
  });
  
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    marketing: false,
    allAgree: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: 기본정보, 2: 약관동의
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // 인증 상태 변화 감지하여 자동 리다이렉션
  useEffect(() => {
    if (!loading && user) {
      console.log('사용자 회원가입/로그인 감지, 대시보드로 이동:', user.email);
      navigate('/app/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (step === 1) {
      if (formData.password !== formData.confirmPassword) {
        setError('비밀번호가 일치하지 않습니다.');
        return;
      }
      if (formData.password.length < 6) {
        setError('비밀번호는 6자 이상이어야 합니다.');
        return;
      }
      setStep(2);
      return;
    }

    if (!agreements.terms || !agreements.privacy) {
      setError('필수 약관에 동의해주세요.');
      return;
    }

    setIsLoading(true);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      // Update user profile with display name
      await updateProfile(userCredential.user, {
        displayName: formData.name
      });
      
      // Firebase Firestore에 사용자 프로필 생성
      try {
        await FirebaseService.createUserProfile(userCredential.user);
        console.log('✅ 사용자 프로필 생성 완료');
      } catch (profileError) {
        console.warn('⚠️ 사용자 프로필 생성 실패 (로그인은 성공):', profileError);
      }
      
      console.log('이메일 회원가입 성공:', userCredential.user.email);
      // useEffect에서 자동으로 리다이렉션됨
    } catch (error: any) {
      setError(getErrorMessage(error.code));
    } finally {
      setIsLoading(false);
    }
  };





  const getErrorMessage = (errorCode: string) => {
    console.log('회원가입 오류 코드:', errorCode);
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return '이미 사용 중인 이메일입니다.';
      case 'auth/invalid-email':
        return '유효하지 않은 이메일 형식입니다.';
      case 'auth/weak-password':
        return '비밀번호가 너무 약합니다. 6자 이상 입력해주세요.';
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        return ''; // 사용자가 취소한 경우 에러 메시지 표시하지 않음
      case 'auth/unauthorized-domain':
        return '승인되지 않은 도메인입니다. 관리자에게 문의하세요.';
      default:
        return `회원가입 중 오류가 발생했습니다. (${errorCode})`;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAgreementChange = (key: string, checked: boolean) => {
    console.log('🔄 약관 동의 상태 변화:', { key, checked, currentAgreements: agreements });
    
    setAgreements(prevAgreements => {
      if (key === 'allAgree') {
        const newAgreements = {
          terms: checked,
          privacy: checked,
          marketing: checked,
          allAgree: checked
        };
        console.log('✅ 전체 동의 설정:', newAgreements);
        return newAgreements;
      } else {
        const newAgreements = { ...prevAgreements, [key]: checked };
        newAgreements.allAgree = newAgreements.terms && newAgreements.privacy && newAgreements.marketing;
        console.log('✅ 개별 동의 설정:', newAgreements);
        return newAgreements;
      }
    });
  };

  // 선택 화면 핸들러
  const handleModeNavigate = (mode: string) => {
    if (mode === 'home') {
      onNavigate('home');
    } else if (mode === 'login') {
      onNavigate('login');
    } else if (mode === 'company-registration') {
      setSignupMode('company-registration');
    } else if (mode === 'member-registration') {
      setSignupMode('member-registration');
    }
  };

  // 선택 화면 표시
  if (signupMode === 'selection') {
    return <CompanySignupSelectionPage onNavigate={handleModeNavigate} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => step === 1 ? setSignupMode('selection') : setStep(1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{step === 1 ? '선택 화면으로 돌아가기' : '이전 단계'}</span>
        </button>

        {/* Signup Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">MIND BREEZE - AI Report</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {step === 1 
                ? (signupMode === 'company-registration' ? '신규 기업 등록' : '기존 기업 합류') 
                : '약관 동의'
              }
            </h1>
            <p className="text-gray-600">
              {step === 1 
                ? (signupMode === 'company-registration' 
                    ? '새로운 기업 정보를 등록하고 6자리 기업 코드를 받아보세요' 
                    : '기업 코드를 입력하여 기존 기업에 합류하세요'
                  )
                : '서비스 이용을 위한 약관에 동의해주세요'
              }
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > 1 ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <div className={`w-16 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                2
              </div>
            </div>
          </div>

          {step === 1 ? (
            /* Step 1: Basic Information */
            <>


              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Signup Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    이름 *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                      <Input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="홍길동"
                    className="pl-10 py-3 bg-gray-50 border-gray-200 focus:bg-white"
                  />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    이메일 주소 *
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
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    휴대폰 번호
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="010-0000-0000"
                      className="pl-10 py-3 bg-gray-50 border-gray-200 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">
                      생년월일
                    </label>
                    <Input
                      id="birthDate"
                      name="birthDate"
                      type="date"
                      autoComplete="bday"
                      value={formData.birthDate}
                      onChange={handleChange}
                      className="py-3 bg-gray-50 border-gray-200 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                      성별
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full py-3 px-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">선택</option>
                      <option value="male">남성</option>
                      <option value="female">여성</option>
                      <option value="other">기타</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    비밀번호 *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                      <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="8자 이상, 영문/숫자/특수문자 포함"
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

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    비밀번호 확인 *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                      <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="비밀번호를 다시 입력하세요"
                    className="pl-10 pr-10 py-3 bg-gray-50 border-gray-200 focus:bg-white"
                  />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-3 text-lg mt-6">
                  다음 단계
                </Button>
              </form>
            </>
          ) : (
            /* Step 2: Terms Agreement */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {/* All Agreement */}
                <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                  <Checkbox
                    id="allAgree"
                    checked={agreements.allAgree}
                    onCheckedChange={(checked) => handleAgreementChange('allAgree', checked as boolean)}
                  />
                  <label htmlFor="allAgree" className="font-medium text-gray-900 cursor-pointer flex-1">
                    전체 약관에 동의합니다
                  </label>
                </div>

                <Separator />

                {/* Individual Agreements */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3 flex-1">
                      <Checkbox
                        id="terms"
                        checked={agreements.terms}
                        onCheckedChange={(checked) => handleAgreementChange('terms', checked as boolean)}
                      />
                      <label htmlFor="terms" className="text-gray-700 cursor-pointer">
                        <span className="text-red-500">[필수]</span> 서비스 이용약관
                      </label>
                    </div>
                    <button type="button" className="text-sm text-blue-600 hover:text-blue-700 ml-2">
                      보기
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3 flex-1">
                      <Checkbox
                        id="privacy"
                        checked={agreements.privacy}
                        onCheckedChange={(checked) => handleAgreementChange('privacy', checked as boolean)}
                      />
                      <label htmlFor="privacy" className="text-gray-700 cursor-pointer">
                        <span className="text-red-500">[필수]</span> 개인정보 처리방침
                      </label>
                    </div>
                    <button type="button" className="text-sm text-blue-600 hover:text-blue-700 ml-2">
                      보기
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3 flex-1">
                      <Checkbox
                        id="marketing"
                        checked={agreements.marketing}
                        onCheckedChange={(checked) => handleAgreementChange('marketing', checked as boolean)}
                      />
                      <label htmlFor="marketing" className="text-gray-700 cursor-pointer">
                        [선택] 마케팅 정보 수신 동의
                      </label>
                    </div>
                    <button type="button" className="text-sm text-blue-600 hover:text-blue-700 ml-2">
                      보기
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
                <p className="mb-2">✓ 만 14세 이상만 가입 가능합니다</p>
                <p className="mb-2">✓ 의료기기 사용 시 주의사항을 숙지해주세요</p>
                <p>✓ EEG 데이터는 암호화되어 안전하게 보관됩니다</p>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !agreements.terms || !agreements.privacy}
                className="w-full bg-blue-600 hover:bg-blue-700 py-3 text-lg"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>가입 처리 중...</span>
                  </div>
                ) : (
                  '기업 회원가입 완료'
                )}
              </Button>
            </form>
          )}

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              이미 계정이 있으신가요?{' '}
              <button
                onClick={() => onNavigate('login')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                기업 로그인
              </button>
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>MIND BREEZE - AI Report</p>
          <p className="mt-2">
            <a href="#" className="hover:text-blue-600">개인정보처리방침</a>
            {' · '}
            <a href="#" className="hover:text-blue-600">이용약관</a>
            {' · '}
            <a href="#" className="hover:text-blue-600">고객지원</a>
          </p>
        </div>
      </div>
    </div>
  );
}