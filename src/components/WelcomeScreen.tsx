import React, { useEffect, useState } from 'react';

interface WelcomeScreenProps {
  onComplete: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // 3초 후에 Welcome 화면을 사라지게 함
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500); // 페이드아웃 애니메이션 후 완료
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div 
      className={`
        fixed inset-0 z-50 flex flex-col items-center justify-center
        bg-gradient-to-br from-black via-gray-900 to-gray-800
        transition-opacity duration-500
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {/* 로고 이미지 - 크기 절반으로 축소 */}
      <div className="mb-8 animate-pulse-slow">
        <img 
          src="/symbols_looxidlabs_1024_circle.png" 
          alt="Looxid Labs Logo"
          className="w-16 h-16 md:w-20 md:h-20 drop-shadow-2xl"
        />
      </div>

      {/* Welcome 메시지 - 글씨 크기 절반으로 축소 */}
      <div className="text-center space-y-4 animate-fade-in-up">
        <h1 className="text-2xl md:text-2xl lg:text-3xl font-bold text-white tracking-wider">
          WELCOME TO
        </h1>
        <h2 className="text-xl md:text-2xl lg:text-2xl font-bold text-white tracking-wider">
          LINK BAND SDK
        </h2>
        <div className="w-12 h-0.5 bg-white mx-auto mt-6 rounded-full opacity-80"></div>
      </div>

      {/* 로딩 애니메이션 */}
      <div className="mt-12 flex space-x-2">
        <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
}; 