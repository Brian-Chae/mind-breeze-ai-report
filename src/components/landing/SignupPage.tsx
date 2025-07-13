import { useState, useEffect } from 'react';
import { Brain, Eye, EyeOff, Mail, Lock, User, Phone, ArrowLeft, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { Checkbox } from '../ui/checkbox';
import { createUserWithEmailAndPassword, signInWithPopup, signInWithRedirect, GoogleAuthProvider, updateProfile, getRedirectResult } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { FirebaseService } from '../../services/FirebaseService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthProvider';

interface SignupPageProps {
  onNavigate: (page: string) => void;
}

export function SignupPage({ onNavigate }: SignupPageProps) {
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

  // 리다이렉트 결과 확인 (Google 로그인)
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('Google 리다이렉트 회원가입 성공:', result.user);
          // useEffect에서 자동으로 리다이렉션됨
        }
      } catch (error: any) {
        console.error('리다이렉트 결과 처리 오류:', error);
        setError(getErrorMessage(error.code));
      }
    };

    checkRedirectResult();
  }, []);

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

  const handleGoogleSignup = async () => {
    // 중복 요청 방지
    if (isLoading) {
      console.log('⚠️ 이미 로그인 처리 중입니다.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    console.log('🔵 Google 회원가입 시도 시작');
    console.log('🔍 현재 환경:', {
      hostname: window.location.hostname,
      port: window.location.port,
      protocol: window.location.protocol,
      href: window.location.href
    });
    
    const isDevelopment = window.location.hostname === 'localhost';
    console.log('🔍 환경 감지 결과:', { isDevelopment });
    
    console.log('🔵 Firebase Auth 인스턴스:', auth);
    console.log('🔵 Firebase Config:', {
      authDomain: auth.config.authDomain,
      apiKey: auth.config.apiKey ? '***' : 'NOT_SET'
    });
    
    // Firebase 프로젝트 정보 확인
    console.log('🔍 Firebase 프로젝트 정보:', {
      currentUser: auth.currentUser,
      app: auth.app.name,
      appOptions: auth.app.options
    });

    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    // 추가 파라미터 설정
    provider.setCustomParameters({
      'prompt': 'select_account'
    });

    console.log('🔍 Google Auth Provider 생성 완료. 팝업 방식으로 시도합니다.');

    try {
      // 팝업 방식으로 시도 (페이지 이동 없음)
      console.log('🔍 signInWithPopup 호출 시작');
      
      // 팝업이 열리는지 확인
      const popupPromise = signInWithPopup(auth, provider);
      console.log('🔍 팝업 Promise 생성됨, 사용자 응답 대기 중...');
      
      // 타임아웃 설정 (30초)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('TIMEOUT: Google 로그인 타임아웃 (30초)'));
        }, 30000);
      });
      
      console.log('⏰ 30초 타임아웃 설정됨');
      const result = await Promise.race([popupPromise, timeoutPromise]);
      console.log('✅ Google 팝업 회원가입 성공:', {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName
      });
      
      // Firebase Firestore에 사용자 프로필 생성
      try {
        await FirebaseService.createUserProfile(result.user);
        console.log('✅ 사용자 프로필 생성 완료');
      } catch (profileError) {
        console.warn('⚠️ 사용자 프로필 생성 실패 (회원가입은 성공):', profileError);
      }
      
      console.log('✅ 회원가입 프로세스 완료, 인증 상태 변화 대기 중...');
      // useEffect에서 자동으로 리다이렉션됨
    } catch (error: any) {
      console.error('❌ Google 팝업 회원가입 실패:', {
        code: error.code,
        message: error.message,
        details: error,
        authDomain: auth.config.authDomain
      });
      
      // 더 자세한 오류 정보 출력
      if (error.code === 'auth/unauthorized-domain') {
        console.error('❌ 승인되지 않은 도메인 오류. Firebase Console에서 승인된 도메인을 확인하세요.');
        console.error('❌ 현재 도메인:', window.location.hostname);
        setError('도메인이 승인되지 않았습니다. Firebase Console에서 localhost를 승인된 도메인으로 추가해주세요.');
      } else if (error.code === 'auth/popup-blocked') {
        console.error('❌ 팝업이 차단되었습니다. 브라우저 팝업 차단을 해제해주세요.');
        setError('팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        console.log('ℹ️ 사용자가 팝업을 닫았습니다.');
        setError(''); // 사용자가 취소한 경우 에러 메시지 표시하지 않음
        setIsLoading(false);
        return;
      } else if (error.code === 'auth/cancelled-popup-request') {
        console.error('❌ 팝업 요청이 취소되었습니다. 설정을 확인하세요.');
        setError('Google 로그인 설정에 문제가 있습니다. 리다이렉트 방식을 시도해보세요.');
      } else if (error.message?.includes('TIMEOUT')) {
        console.error('❌ Google 로그인 타임아웃');
        setError('Google 로그인이 30초 동안 응답하지 않습니다. Firebase Console 설정을 확인하세요.');
      }
      
      setError(getErrorMessage(error.code));
      setIsLoading(false);
    }
  };

  const handleGoogleSignupRedirect = async () => {
    setIsLoading(true);
    setError('');
    
    console.log('🔄 Google 리다이렉트 회원가입 시도');
    
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({
      'prompt': 'select_account'
    });

    try {
      console.log('🔄 signInWithRedirect 호출');
      await signInWithRedirect(auth, provider);
      console.log('🔄 리다이렉트 시작됨');
      // 페이지가 리다이렉트되므로 로딩 상태는 유지됨
    } catch (error: any) {
      console.error('❌ 리다이렉트 실패:', error);
      setError('리다이렉트 방식도 실패했습니다. Firebase Console에서 Google 로그인이 활성화되어 있는지 확인해주세요.');
      setIsLoading(false);
    }
  };

  // 긴급 디버깅: Firebase 설정 상태 확인
  const debugFirebaseSettings = () => {
    console.log('🔍 Firebase 디버깅 정보:');
    console.log('- 프로젝트 ID:', auth.app.options.projectId);
    console.log('- Auth 도메인:', auth.app.options.authDomain);
    console.log('- API 키:', auth.app.options.apiKey ? '설정됨' : '없음');
    console.log('- 현재 사용자:', auth.currentUser);
    console.log('- Auth 상태:', auth.currentUser ? '로그인됨' : '로그아웃됨');
    
    // Firebase Console 링크 출력
    console.log('🔗 Firebase Console 링크:');
    console.log(`https://console.firebase.google.com/project/${auth.app.options.projectId}/authentication/providers`);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => step === 1 ? onNavigate('home') : setStep(1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{step === 1 ? '홈으로 돌아가기' : '이전 단계'}</span>
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
              {step === 1 ? '회원가입' : '약관 동의'}
            </h1>
            <p className="text-gray-600">
              {step === 1 
                ? '뇌 건강 모니터링 서비스 가입을 환영합니다' 
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
              {/* Social Signup */}
              <div className="space-y-3 mb-6">
                <Button 
                  variant="outline" 
                  className="w-full py-3 border-2 text-gray-900 hover:text-gray-900" 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔴 Google 회원가입 버튼 클릭됨!');
                    handleGoogleSignup();
                  }}
                  disabled={isLoading}
                >
                  <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" className="w-5 h-5 mr-3" />
                  Google로 가입하기 (팝업)
                </Button>
                
                {(error.includes('리다이렉트 방식을 시도해보세요') || error.includes('타임아웃')) && (
                  <Button 
                    variant="outline" 
                    className="w-full py-3 border-2 text-orange-900 hover:text-orange-900 border-orange-300 bg-orange-50 hover:bg-orange-100" 
                    type="button"
                    onClick={handleGoogleSignupRedirect}
                    disabled={isLoading}
                  >
                    <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" className="w-5 h-5 mr-3" />
                    🔄 Google로 가입하기 (리다이렉트 방식)
                  </Button>
                )}
              </div>

              <div className="relative mb-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-sm text-gray-500">
                  또는
                </span>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                  <p className="text-red-600 text-sm font-medium">{error}</p>
                  
                  {/* Firebase Console 설정 안내 */}
                  {(error.includes('승인되지 않은') || error.includes('unauthorized-domain') || error.includes('타임아웃')) && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-xs font-medium text-yellow-800 mb-2">🔧 즉시 해결 방법:</p>
                      <ol className="text-xs text-yellow-700 space-y-1 ml-4">
                        <li>1. <a 
                          href="https://console.firebase.google.com/project/mind-breeze-ai-report-47942/authentication/settings" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="underline text-blue-600 hover:text-blue-800"
                        >
                          Firebase Console 열기
                        </a></li>
                        <li>2. "Authorized domains" → "Add domain"</li>
                        <li>3. <code className="bg-gray-100 px-1 rounded">localhost</code> 추가</li>
                        <li>4. 페이지 새로고침 후 다시 시도</li>
                      </ol>
                      <button
                        type="button"
                        onClick={debugFirebaseSettings}
                        className="mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                      >
                        상세 설정 정보 확인
                      </button>
                    </div>
                  )}
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
                  '회원가입 완료'
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
                로그인
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