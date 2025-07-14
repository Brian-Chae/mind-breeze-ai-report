import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { LandingPage } from './LandingPage';
import { LoginPage } from './landing/LoginPage';
import { SignupPage } from './landing/SignupPage';
import { HomePage } from '../pages/HomePage';
import { DataCenterPage } from '../pages/DataCenterPage';
import { VisualizerPage } from '../pages/VisualizerPage';
import { DocumentsPage } from '../pages/DocumentsPage';
import { LinkBandPage } from '../pages/LinkBandPage';
import { SettingsPage } from '../pages/SettingsPage';
import { ProtectedRoute } from './ProtectedRoute';
import { HomeScreen } from './HomeScreen';
import { WelcomeScreen } from './WelcomeScreen';
// import { Applications } from './Applications';
import CompanySignupSelectionPage from './landing/CompanySignupSelectionPage';
import CompanyRegistrationForm from './landing/CompanyRegistrationForm';
import CompanyRegistrationSuccess from './landing/CompanyRegistrationSuccess';
import CompanyJoinForm from './landing/CompanyJoinForm';
import MeasurementSubjectAccess from './MeasurementSubjectAccess';
import { DeviceManager } from '../../components/DeviceManager';
// import { AppLayout } from './layouts/AppLayout';

const AppRouter = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (loading) return;

    const currentPath = location.pathname;
    
    if (user) {
      // 로그인된 사용자의 라우팅
      const userType = getUserType(user);
      const redirectPath = getRedirectPath(userType);
      
      console.log('🔄 사용자 타입 확인:', {
        email: user.email,
        userType,
        redirectPath,
        currentPath
      });
      
      if (['/login', '/signup', '/'].includes(currentPath)) {
        navigate(redirectPath);
      } else if (currentPath === '/welcome' && userType === 'ORGANIZATION_ADMIN') {
        // 기업 관리자는 /welcome 대신 /admin으로 리디렉션
        navigate('/admin');
      } else if (currentPath === '/home' && userType === 'ORGANIZATION_ADMIN') {
        // 기업 관리자는 /home 대신 /admin으로 리디렉션
        navigate('/admin');
      }
    } else {
      // 로그인되지 않은 사용자는 토큰 접속 허용
      if (currentPath.startsWith('/measurement-access')) {
        return; // 토큰 접속 페이지는 허용
      }
      
      // 로그인되지 않은 사용자의 라우팅
      if (currentPath === '/signup') {
        const urlParams = new URLSearchParams(location.search);
        const page = urlParams.get('page');
        
        if (page === 'organization-signup') {
          navigate('/organization-signup-selection');
        } else {
          // 기본 회원가입 페이지로 이동
          navigate('/signup');
        }
      } else if (['/welcome', '/home', '/data-center', '/visualizer', '/documents', '/linkband', '/applications', '/admin'].includes(currentPath)) {
        // 보호된 페이지들은 랜딩 페이지로 리다이렉트
        navigate('/');
      }
    }
  }, [user, loading, navigate, location]);

  const getRedirectPath = (userType: string) => {
    switch (userType) {
      case 'SYSTEM_ADMIN':
        return '/admin';
      case 'ORGANIZATION_ADMIN':
        return '/admin';
      case 'ORGANIZATION_MEMBER':
        return '/welcome';
      case 'INDIVIDUAL_USER':
        return '/welcome';
      default:
        return '/';
    }
  };

  // 임시로 이메일 패턴으로 사용자 타입 확인
  const getUserType = (user: any) => {
    if (!user || !user.email) return 'INDIVIDUAL_USER';
    
    const email = user.email.toLowerCase();
    
    // 임시로 admin 키워드가 포함된 이메일을 기업 관리자로 간주
    if (email.includes('admin') || email.includes('manager') || email.includes('org')) {
      return 'ORGANIZATION_ADMIN';
    }
    
    // 기업 도메인 체크 (예: @company.com)
    if (email.includes('@company.com') || email.includes('@organization.com')) {
      return 'ORGANIZATION_MEMBER';
    }
    
    return 'INDIVIDUAL_USER';
  };

  useEffect(() => {
    if (user && ['/welcome', '/home'].includes(location.pathname)) {
      const page = new URLSearchParams(location.search).get('page');
      
      if (page === 'organization-signup') {
        navigate('/organization-signup-selection');
      } else if (page === 'signup') {
        navigate('/signup');
      }
    }
  }, [user, location, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* 공개 라우트 */}
      <Route path="/" element={<LandingPage onEnterApp={() => {}} />} />
      <Route path="/login" element={<LoginPage onNavigate={(page) => navigate(page === 'home' ? '/welcome' : `/${page}`)} />} />
      <Route path="/signup" element={<SignupPage onNavigate={(page) => navigate(page === 'home' ? '/welcome' : `/${page}`)} />} />
      
      {/* 조직 관련 라우트 */}
      <Route path="/organization-signup-selection" element={<CompanySignupSelectionPage />} />
      <Route path="/organization-registration" element={<CompanyRegistrationForm />} />
      <Route path="/organization-registration-success" element={<CompanyRegistrationSuccess />} />
      <Route path="/organization-join" element={<CompanyJoinForm />} />
      
      {/* MEASUREMENT_SUBJECT 토큰 접속 */}
      <Route path="/measurement-access" element={<MeasurementSubjectAccess />} />
      
      {/* 보호된 라우트 */}
      <Route path="/welcome" element={
        <ProtectedRoute>
          <WelcomeScreen onComplete={() => navigate('/home')} />
        </ProtectedRoute>
      } />
      <Route path="/home" element={
        <ProtectedRoute>
          <HomePage />
        </ProtectedRoute>
      } />
      <Route path="/data-center" element={
        <ProtectedRoute>
          <DataCenterPage />
        </ProtectedRoute>
      } />
      <Route path="/visualizer" element={
        <ProtectedRoute>
          <VisualizerPage />
        </ProtectedRoute>
      } />
      <Route path="/documents" element={
        <ProtectedRoute>
          <DocumentsPage />
        </ProtectedRoute>
      } />
      <Route path="/linkband" element={
        <ProtectedRoute>
          <LinkBandPage />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <SettingsPage />
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute>
          <DeviceManager />
        </ProtectedRoute>
      } />
      <Route path="/admin/*" element={
        <ProtectedRoute>
          <DeviceManager />
        </ProtectedRoute>
      } />
    </Routes>
  );
};

export default AppRouter; 