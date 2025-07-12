import React from 'react';
import { Header } from './landing/Header';
import { ServiceProcess } from './landing/ServiceProcess';

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
      return <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-6">로그인</h2>
          <p className="text-center text-gray-600 mb-4">Coming Soon</p>
          <button 
            onClick={() => handleNavigate('home')}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>;
    
    case 'signup':
      return <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-6">회원가입</h2>
          <p className="text-center text-gray-600 mb-4">Coming Soon</p>
          <button 
            onClick={() => handleNavigate('home')}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>;
    
    case 'home':
    default:
      return (
        <div className="min-h-screen bg-white">
          <Header onNavigate={handleNavigate} onEnterApp={onEnterApp} />
          <main>
            <ServiceProcess />
          </main>
        </div>
      );
  }
} 