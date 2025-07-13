import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { Header } from './landing/Header';
import { HeroSection } from './landing/HeroSection';
import { ServiceProcess } from './landing/ServiceProcess';
import { LinkBandSection } from './landing/LinkBandSection';
import { AIReportSection } from './landing/AIReportSection';
import { AIConsultationSection } from './landing/AIConsultationSection';
import { ReviewsSection } from './landing/ReviewsSection';
import { PricingSection } from './landing/PricingSection';
import { ContactSection } from './landing/ContactSection';
import { Footer } from './landing/Footer';
import { LoginPage } from './landing/LoginPage';
import { SignupPage } from './landing/SignupPage';
import CompanySignupSelectionPage from './landing/CompanySignupSelectionPage';
import CompanyRegistrationForm from './landing/CompanyRegistrationForm';
import CompanyRegistrationSuccess from './landing/CompanyRegistrationSuccess';
import Dashboard from './Dashboard/Dashboard';
import { DeviceManager } from './DeviceManager';
import { DataCenter } from './DataCenter';
import { Visualizer } from './Visualizer';
import Documents from './Documents';
import { Applications } from './Applications';
import { Settings } from './Settings';
import { ProtectedRoute } from './ProtectedRoute';

// 랜딩 페이지 홈 컴포넌트
const LandingHome = () => {
  const navigate = useNavigate();
  
  const handleNavigate = (page: string) => {
    if (page === 'app') {
      navigate('/app/dashboard');
    } else if (page === 'login') {
      navigate('/login');
    } else if (page === 'signup') {
      navigate('/signup');
    } else if (page === 'company-signup') {
      navigate('/company-signup-selection');
    } else if (page === 'home') {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header onNavigate={handleNavigate} />
      <main>
        <HeroSection />
        <ServiceProcess />
        <LinkBandSection />
        <AIReportSection />
        <AIConsultationSection />
        <ReviewsSection />
        <PricingSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

// 로그인 페이지 래퍼
const LoginPageWrapper = () => {
  const navigate = useNavigate();
  
  const handleNavigate = (page: string) => {
    if (page === 'app') {
      navigate('/app/dashboard');
    } else if (page === 'signup') {
      navigate('/signup');
    } else if (page === 'company-signup') {
      navigate('/company-signup-selection');
    } else if (page === 'home') {
      navigate('/');
    }
  };

  return <LoginPage onNavigate={handleNavigate} />;
};

// 회원가입 페이지 래퍼
const SignupPageWrapper = () => {
  const navigate = useNavigate();
  
  const handleNavigate = (page: string) => {
    if (page === 'login') {
      navigate('/login');
    } else if (page === 'company-signup') {
      navigate('/company-signup-selection');
    } else if (page === 'home') {
      navigate('/');
    }
  };

  return <SignupPage onNavigate={handleNavigate} />;
};

export const AppRouter = () => {
  return (
    <Routes>
      {/* 랜딩 페이지 라우트 */}
      <Route path="/" element={<LandingHome />} />
      <Route path="/login" element={<LoginPageWrapper />} />
      <Route path="/signup" element={<SignupPageWrapper />} />
      
      {/* 회사 등록 관련 라우트 */}
      <Route path="/company-signup-selection" element={<CompanySignupSelectionPage />} />
      <Route path="/company-registration" element={<CompanyRegistrationForm />} />
      <Route path="/company-registration-success" element={<CompanyRegistrationSuccess />} />
      
      {/* 앱 라우트 */}
      <Route path="/app" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="device" element={<DeviceManager />} />
        <Route path="visualizer" element={<Visualizer />} />
        <Route path="datacenter" element={<DataCenter />} />
        <Route path="documents" element={<Documents />} />
        <Route path="applications" element={<Applications />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      
      {/* 404 페이지 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}; 