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
import OrganizationAdminApp from '@domains/organization/components/OrganizationAdmin/OrganizationAdminApp';
// Enterprise Auth Service import 추가
import enterpriseAuthService from '@domains/organization/services/EnterpriseAuthService';
// AI Report App import 추가
import { AIHealthReportApp } from '@domains/ai-report/components/AIHealthReportApp';
// Shared Report Page import 추가
import { SharedReportPage } from '../pages/SharedReportPage';
// AI Report Renderers 초기화
import { initializeRenderers } from '@domains/ai-report/report-renderers';
// 디버깅 유틸리티
import { DebugUserInfo } from '../utils/DebugUserInfo';
// import { AppLayout } from './layouts/AppLayout';

const AppRouter = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showWelcome, setShowWelcome] = useState(false);

  // 렌더러 초기화 및 디버깅 함수 등록 (앱 시작 시 한 번만 실행)
  useEffect(() => {
    try {
      initializeRenderers();
      console.log('✅ 렌더러 초기화 완료');
      
      // 디버깅 함수 등록 (개발 환경에서만)
      if (process.env.NODE_ENV === 'development') {
        DebugUserInfo.registerGlobalDebugFunctions();
      }
    } catch (error) {
      console.error('❌ 렌더러 초기화 실패:', error);
    }
  }, []);

  useEffect(() => {
    if (loading) return;

    const currentPath = location.pathname;
    
    console.log('🔄 라우팅 체크:', {
      user: user ? { email: user.email, uid: user.uid } : null,
      currentPath,
      loading
    });
    
    if (user) {
      // 로그인된 사용자의 라우팅
      const userType = getUserType(user);
      const redirectPath = getRedirectPath(userType);
      
      console.log('🔄 사용자 타입 확인:', {
        email: user.email,
        userType,
        redirectPath,
        currentPath,
        shouldRedirect: ['/login', '/signup', '/', '/welcome', '/home'].includes(currentPath)
      });
      
      // 공유 리포트 페이지는 절대 리다이렉션하지 않음
      if (currentPath.includes('/shared-report/')) {
        console.log('🔒 공유 리포트 페이지 - 리다이렉션 완전 차단:', currentPath);
        return;
      }
      
      // 기타 공개 페이지들 체크
      const publicPaths = [
        '/measurement-access',
        '/organization-signup-selection', 
        '/organization-registration',
        '/organization-registration-success',
        '/organization-join'
      ];
      
      const isPublicPath = publicPaths.some(path => currentPath.startsWith(path));
      const shouldRedirect = ['/login', '/signup', '/', '/welcome', '/home'].includes(currentPath);
      
      console.log('🔍 리다이렉션 체크:', {
        currentPath,
        publicPaths,
        isPublicPath,
        shouldRedirect,
        finalShouldRedirect: shouldRedirect && !isPublicPath
      });
      
      if (shouldRedirect && !isPublicPath) {
        console.log('🔄 리디렉션 실행:', currentPath, '→', redirectPath);
        navigate(redirectPath);
      } else {
        console.log('✅ 리다이렉션 스킵:', { currentPath, isPublicPath, shouldRedirect });
      }
    } else {
      console.log('🔄 로그인되지 않은 사용자:', currentPath);
      
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
      } else if (['/welcome', '/home', '/data-center', '/visualizer', '/documents', '/linkband', '/applications'].includes(currentPath) || currentPath.startsWith('/admin')) {
        // 보호된 페이지들은 랜딩 페이지로 리다이렉트
        navigate('/');
      }
    }
  }, [user, loading, navigate, location]);

  const getRedirectPath = (userType: string) => {
    switch (userType) {
      case 'SYSTEM_ADMIN':
        return '/admin/dashboard';
      case 'ORGANIZATION_ADMIN':
        return '/admin/dashboard';
      case 'ORGANIZATION_MEMBER':
        return '/welcome';
      case 'INDIVIDUAL_USER':
        return '/welcome';
      default:
        return '/';
    }
  };

  // Firestore에서 실제 사용자 타입 확인
  const getUserType = (user: any) => {
    if (!user) return 'INDIVIDUAL_USER';
    
    // EnterpriseAuthService에서 실제 사용자 정보 가져오기
    const enterpriseContext = enterpriseAuthService.getCurrentContext();
    
    // 실제 사용자 타입이 있으면 사용, 없으면 기본값
    if (enterpriseContext.user?.userType) {
      console.log('✅ Firestore에서 사용자 타입 확인:', enterpriseContext.user.userType);
      return enterpriseContext.user.userType;
    }
    
    // Firestore 데이터가 아직 로드되지 않은 경우 임시로 이메일 패턴 사용
    console.log('⚠️ Firestore 데이터 로드 중... 임시로 이메일 패턴 사용');
    const email = user.email?.toLowerCase();
    
    if (email === 'brian.chae@looxidlabs.com') {
      return 'ORGANIZATION_ADMIN';
    }
    
    if (email?.includes('admin') || email?.includes('manager') || email?.includes('org')) {
      return 'ORGANIZATION_ADMIN';
    }
    
    if (email?.includes('@company.com') || email?.includes('@organization.com')) {
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
      
      {/* 공유 리포트 라우트 - 인증 불필요 */}
      <Route path="/shared-report/:shareToken" element={<SharedReportPage />} />
      
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
      
      {/* AI Report 라우트 - 단계별 네비게이션 지원 */}
      <Route path="/ai-report" element={
        <ProtectedRoute>
          <AIHealthReportApp onClose={() => window.history.back()} />
        </ProtectedRoute>
      } />
      <Route path="/ai-report/:step" element={
        <ProtectedRoute>
          <AIHealthReportApp onClose={() => window.history.back()} />
        </ProtectedRoute>
      } />
      
      {/* 관리자 라우트 */}
      <Route path="/admin" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/dashboard" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/organization" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/organization/company-info" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/organization/departments" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/organization/structure" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/members" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/members/member-list" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/members/member-invite" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/members/member-permissions" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/users/user-list" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/users/user-history" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/users/user-reports" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/ai-report" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/ai-report/report-generation" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/ai-report/report-list" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/ai-report/measurement-data" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/devices" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/devices/device-inventory" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/devices/device-assignment" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/devices/device-monitoring" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/credits" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/credits/credit-dashboard" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/credits/credit-history" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/credits/credit-settings" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      
      {/* 시스템 관리자 전용 라우트 */}
      <Route path="/admin/system" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/system/system-overview" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/system/system-monitoring" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/system/system-settings" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/organizations" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/organizations/organization-list" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/organizations/organization-analytics" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/organizations/organization-settings" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/users/all-users" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/users/user-analytics" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/users/user-support" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/system-analytics" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/system-analytics/usage-analytics" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/system-analytics/performance-metrics" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
      <Route path="/admin/system-analytics/error-monitoring" element={
        <ProtectedRoute>
          <OrganizationAdminApp />
        </ProtectedRoute>
      } />
    </Routes>
  );
};

export default AppRouter; 