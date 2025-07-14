import React from 'react';
import { Header } from './landing/Header';
import { HeroSection } from './landing/HeroSection';
import { LinkBandSection } from './landing/LinkBandSection';
import { ServiceProcess } from './landing/ServiceProcess';
import { AIReportSection } from './landing/AIReportSection';
import { AIConsultationSection } from './landing/AIConsultationSection';
import { PricingSection } from './landing/PricingSection';
import { ReviewsSection } from './landing/ReviewsSection';
import { ContactSection } from './landing/ContactSection';
import { Footer } from './landing/Footer';
import { LoginPage } from './landing/LoginPage';
import { SignupPage } from './landing/SignupPage';

interface LandingPageProps {
  onEnterApp: () => void;
}

export function LandingPage({ onEnterApp }: LandingPageProps) {
  const [currentPage, setCurrentPage] = React.useState<'home' | 'login' | 'signup'>('home');

  const handleNavigate = (page: string) => {
    setCurrentPage(page as 'home' | 'login' | 'signup');
    // Scroll to top when navigating
    window.scrollTo(0, 0);
  };

  // Render different pages based on current page
  switch (currentPage) {
    case 'login':
      return <LoginPage onNavigate={handleNavigate} />;
    
    case 'signup':
      return <SignupPage onNavigate={handleNavigate} />;
    
    case 'home':
    default:
      return (
        <div className="min-h-screen bg-white">
          <Header onNavigate={handleNavigate} />
          <main>
            <HeroSection />
            <LinkBandSection />
            <ServiceProcess />
            <AIReportSection />
            <AIConsultationSection />
            <PricingSection />
            <ReviewsSection />
            <ContactSection />
          </main>
          <Footer />
        </div>
      );
  }
} 