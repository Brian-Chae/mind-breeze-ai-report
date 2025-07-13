import { useState, useEffect } from 'react';
import { Brain, Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, getRedirectResult } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { FirebaseService } from '../../services/FirebaseService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthProvider';

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // 인증 상태 변화 감지하여 자동 리다이렉션
  useEffect(() => {
    console.log('인증 상태 변화:', { loading, user: user?.email || null });
    if (!loading && user) {
      console.log('사용자 로그인 감지, 대시보드로 이동:', user.email);
      navigate('/app/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  // 리다이렉트 결과 확인 (Google 로그인)
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('Google 리다이렉트 로그인 성공:', result.user);
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
    setIsLoading(true);
    setError('');
    
    console.log('🔵 로그인 시도 시작:', formData.email);
    
    try {
      console.log('🔵 Firebase 인증 시도 중...');
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      
      console.log('✅ Firebase 인증 성공:', {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        emailVerified: userCredential.user.emailVerified
      });
      
      // 마지막 로그인 시간 업데이트
      try {
        await FirebaseService.updateUserProfile(userCredential.user.uid, {
          lastLoginAt: new Date()
        });
        console.log('✅ 로그인 시간 업데이트 완료');
      } catch (updateError) {
        console.warn('⚠️ 로그인 시간 업데이트 실패:', updateError);
      }
      
      console.log('✅ 로그인 프로세스 완료, 인증 상태 변화 대기 중...');
      // useEffect에서 자동으로 리다이렉션됨
    } catch (error: any) {
      console.error('❌ 로그인 오류:', {
        code: error.code,
        message: error.message,
        details: error
      });
      setError(getErrorMessage(error.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');

    console.log('🔵 Google 로그인 시도 시작');
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
      const result = await signInWithPopup(auth, provider);
      console.log('✅ Google 팝업 로그인 성공:', {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName
      });
      
      // Firebase Firestore에 사용자 프로필 생성/업데이트
      try {
        await FirebaseService.createUserProfile(result.user);
        console.log('✅ 사용자 프로필 처리 완료');
      } catch (profileError) {
        console.warn('⚠️ 사용자 프로필 처리 실패 (로그인은 성공):', profileError);
      }
      
      console.log('✅ 로그인 프로세스 완료, 인증 상태 변화 대기 중...');
      // useEffect에서 자동으로 리다이렉션됨
    } catch (error: any) {
      console.error('❌ Google 팝업 로그인 실패:', {
        code: error.code,
        message: error.message,
        details: error,
        authDomain: auth.config.authDomain
      });
      
      // 더 자세한 오류 정보 출력
      if (error.code === 'auth/unauthorized-domain') {
        console.error('❌ 승인되지 않은 도메인 오류. Firebase Console에서 승인된 도메인을 확인하세요.');
        console.error('❌ 현재 도메인:', window.location.hostname);
      } else if (error.code === 'auth/popup-blocked') {
        console.error('❌ 팝업이 차단되었습니다. 브라우저 팝업 차단을 해제해주세요.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        console.log('ℹ️ 사용자가 팝업을 닫았습니다.');
        setError(''); // 사용자가 취소한 경우 에러 메시지 표시하지 않음
        setIsLoading(false);
        return;
      }
      
      setError(getErrorMessage(error.code));
      setIsLoading(false);
    }
  };

  const getErrorMessage = (errorCode: string) => {
    console.log('인증 오류 코드:', errorCode);
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
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        return ''; // 사용자가 취소한 경우 에러 메시지 표시하지 않음
      case 'auth/invalid-credential':
        return '잘못된 인증 정보입니다. 이메일과 비밀번호를 확인해주세요.';
      case 'auth/network-request-failed':
        return '네트워크 연결을 확인해주세요.';
      case 'auth/unauthorized-domain':
        return '승인되지 않은 도메인입니다. 관리자에게 문의하세요.';
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
              <span className="text-2xl font-bold text-gray-900">MIND BREEZE - AI Report</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">로그인</h1>
            <p className="text-gray-600">뇌 건강 모니터링 서비스에 오신 것을 환영합니다</p>
          </div>

          {/* Social Login */}
          <div className="space-y-3 mb-6">
            <Button 
              variant="outline" 
              className="w-full py-3 border-2 text-gray-900 hover:text-gray-900" 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔴 Google 로그인 버튼 클릭됨!');
                handleGoogleLogin();
              }}
              disabled={isLoading}
            >
              <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" className="w-5 h-5 mr-3" />
              Google로 로그인
            </Button>
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
                </div>
              )}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <span className="ml-2 text-sm text-gray-600">로그인 상태 유지</span>
              </label>
              <button type="button" className="text-sm text-blue-600 hover:text-blue-700">
                비밀번호 찾기
              </button>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 py-3 text-lg"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>로그인 중...</span>
                </div>
              ) : (
                '로그인'
              )}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              아직 계정이 없으신가요?{' '}
              <button
                onClick={() => onNavigate('signup')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                회원가입
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