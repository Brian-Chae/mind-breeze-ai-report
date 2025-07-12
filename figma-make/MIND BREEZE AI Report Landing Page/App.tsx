import { useState } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { ServiceProcess } from './components/ServiceProcess';
import { LinkBandSection } from './components/LinkBandSection';
import { AIReportSection } from './components/AIReportSection';
import { AIConsultationSection } from './components/AIConsultationSection';
import { ReviewsSection } from './components/ReviewsSection';
import { PricingSection } from './components/PricingSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';

type PageType = 'home' | 'login' | 'signup';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('home');

  const handleNavigate = (page: string) => {
    setCurrentPage(page as PageType);
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
  }
}