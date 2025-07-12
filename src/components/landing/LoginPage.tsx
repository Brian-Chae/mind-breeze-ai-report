import { useState } from 'react';
import { Brain, Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useNavigate } from 'react-router-dom';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      window.location.href = '/app/dashboard';
    } catch (error: any) {
      setError(getErrorMessage(error.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      // 팝업 차단 문제를 해결하기 위해 리다이렉트 방식도 시도
      try {
        const result = await signInWithPopup(auth, provider);
        console.log('Google 로그인 성공:', result.user);
        window.location.href = '/app/dashboard';
      } catch (popupError: any) {
        console.log('팝업 로그인 실패, 리다이렉트 방식 시도:', popupError);
        // 팝업이 차단된 경우 리다이렉트 방식 사용
        if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/popup-closed-by-user') {
          const { signInWithRedirect } = await import('firebase/auth');
          await signInWithRedirect(auth, provider);
          return;
        }
        throw popupError;
      }
    } catch (error: any) {
      console.error('Google 로그인 오류:', error);
      setError(getErrorMessage(error.code));
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
      case 'auth/popup-closed-by-user':
        return '로그인이 취소되었습니다.';
      default:
        return '로그인 중 오류가 발생했습니다.';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

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
                handleGoogleLogin();
              }}
              disabled={isLoading}
            >
              <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" className="w-5 h-5 mr-3" />
              Google로 계속하기
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
              <p className="text-red-600 text-sm">{error}</p>
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