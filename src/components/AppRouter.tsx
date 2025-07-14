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
import { ProtectedRoute } from './ProtectedRoute';
import { HomeScreen } from './HomeScreen';
import { WelcomeScreen } from './WelcomeScreen';
// import { Applications } from './Applications';
import CompanySignupSelectionPage from './landing/CompanySignupSelectionPage';
import CompanyRegistrationForm from './landing/CompanyRegistrationForm';
import CompanyRegistrationSuccess from './landing/CompanyRegistrationSuccess';
import CompanyJoinForm from './landing/CompanyJoinForm';
import MeasurementSubjectAccess from './MeasurementSubjectAccess';
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
      if (['/login', '/signup', '/'].includes(currentPath)) {
        navigate('/welcome');
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
      } else if (['/welcome', '/home', '/data-center', '/visualizer', '/documents', '/linkband', '/applications'].includes(currentPath)) {
        // 보호된 페이지들은 랜딩 페이지로 리다이렉트
        navigate('/');
      }
    }
  }, [user, loading, navigate, location]);

  const getRedirectPath = (userType: string) => {
    switch (userType) {
      case 'SYSTEM_ADMIN':
      case 'ORGANIZATION_ADMIN':
      case 'ORGANIZATION_MEMBER':
      case 'INDIVIDUAL_USER':
        return '/welcome';
      default:
        return '/';
    }
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
      
      {/* AppLayout으로 감싸진 메인 애플리케이션 라우트 - 임시 비활성화 */}
      {/* <Route path="/" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route path="home" element={<HomePage />} />
        <Route path="data-center" element={<DataCenterPage />} />
        <Route path="visualizer" element={<VisualizerPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="linkband" element={<LinkBandPage />} />
        <Route path="applications" element={<Applications />} />
      </Route> */}
    </Routes>
  );
};

export default AppRouter; 