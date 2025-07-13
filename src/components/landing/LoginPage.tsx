import { useState, useEffect } from 'react';
import { Brain, Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { FirebaseService } from '../../services/FirebaseService';
import { enterpriseAuthService } from '../../services/EnterpriseAuthService';
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



          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Test Login Button - 개발용 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">🧪 개발 테스트용</h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    email: 'brian.chae@looxidlabs.com',
                    password: 'dlguswl8286!'
                  });
                }}
                className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200 transition-colors mr-2"
              >
                테스트 계정 정보 자동 입력
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsLoading(true);
                  setError('');
                  try {
                    console.log('🧪 EnterpriseAuthService 테스트 시작...');
                    const user = await enterpriseAuthService.signIn({
                      email: 'brian.chae@looxidlabs.com',
                      password: 'dlguswl8286!'
                    });
                    console.log('✅ EnterpriseAuthService 로그인 성공:', user);
                    setError('✅ EnterpriseAuthService 로그인 성공: ' + user.email);
                  } catch (testError: any) {
                    console.error('❌ EnterpriseAuthService 테스트 실패:', testError);
                    setError('❌ EnterpriseAuthService 테스트 실패: ' + testError.message);
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded hover:bg-blue-200 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? '테스트 중...' : 'EnterpriseAuthService 테스트'}
              </button>
            </div>
            <p className="text-xs text-yellow-700 mt-2">
              실제 Firebase 인증 및 EnterpriseAuthService 테스트를 위한 계정 정보입니다.
            </p>
          </div>

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