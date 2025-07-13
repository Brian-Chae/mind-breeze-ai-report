import { useState } from 'react';
import { Menu, X, Brain, Globe } from 'lucide-react';
import { Button } from '../ui/button';
import { useLanguageStore, Language } from '../../stores/languageStore';
import { landingTexts } from '../../locales/landing';

interface HeaderProps {
  onNavigate: (page: string) => void;
}

export function Header({ onNavigate }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const { currentLanguage, setLanguage } = useLanguageStore();
  const t = landingTexts[currentLanguage];

  const languages = [
    { code: 'ko' as Language, name: '한국어', flag: '🇰🇷' },
    { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
    { code: 'jp' as Language, name: '日本語', flag: '🇯🇵' },
  ];

  const handleLanguageChange = (language: Language) => {
    setLanguage(language);
    setIsLanguageOpen(false);
  };

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button 
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">MIND BREEZE AI Report</span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#service" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
              {t.nav.howItWorks}
            </a>
            <a href="#device" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
              {t.nav.linkBand}
            </a>
            <a href="#ai-report" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
              {t.nav.aiReport}
            </a>
            <a href="#consultation" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
              {t.nav.aiConsultation}
            </a>
            <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
              {t.nav.pricing}
            </a>
          </nav>

          {/* Language Selector & CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {languages.find(lang => lang.code === currentLanguage)?.flag}
                </span>
              </button>
              
              {isLanguageOpen && (
                <div className="absolute right-0 mt-2 py-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  {languages.map((language) => (
                    <button
                      key={language.code}
                      onClick={() => handleLanguageChange(language.code)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors flex items-center space-x-2 ${
                        currentLanguage === language.code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      <span>{language.flag}</span>
                      <span>{language.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button 
              variant="outline" 
              size="sm"
              className="text-black hover:text-black"
              onClick={() => onNavigate('login')}
            >
              기업 로그인
            </Button>
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => onNavigate('signup')}
            >
              기업 회원가입
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col space-y-4">
              <a 
                href="#service" 
                className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {t.nav.howItWorks}
              </a>
              <a 
                href="#device" 
                className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {t.nav.linkBand}
              </a>
              <a 
                href="#ai-report" 
                className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {t.nav.aiReport}
              </a>
              <a 
                href="#consultation" 
                className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {t.nav.aiConsultation}
              </a>
              <a 
                href="#pricing" 
                className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {t.nav.pricing}
              </a>
              
              {/* Mobile Language Selector */}
              <div className="pt-2 border-t border-gray-200">
                <div className="flex flex-col space-y-2">
                  <span className="text-sm font-medium text-gray-500 flex items-center space-x-1">
                    <Globe className="w-4 h-4" />
                    <span>언어 / Language</span>
                  </span>
                  <div className="flex space-x-2">
                    {languages.map((language) => (
                      <button
                        key={language.code}
                        onClick={() => {
                          handleLanguageChange(language.code);
                          setIsMenuOpen(false);
                        }}
                        className={`px-3 py-1 text-sm rounded-md transition-colors flex items-center space-x-1 ${
                          currentLanguage === language.code 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <span>{language.flag}</span>
                        <span>{language.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2 pt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-black hover:text-black"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onNavigate('login');
                  }}
                >
                  기업 로그인
                </Button>
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onNavigate('signup');
                  }}
                >
                  기업 회원가입
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}