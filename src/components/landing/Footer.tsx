import { Activity, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';
import { landingTexts } from '../../locales/landing';
import { useLanguageStore } from '../../stores/languageStore';

const footerLinks = {
  product: [
    { name: '링크밴드 디바이스', href: '#device' },
    { name: 'AI 건강 리포트', href: '#ai-report' },
    { name: 'AI 상담', href: '#consultation' },
    { name: '모바일 앱', href: '#' },
    { name: 'API 문서', href: '#' }
  ],
  company: [
    { name: '회사 소개', href: '#' },
    { name: '채용 정보', href: '#' },
    { name: '보도 자료', href: '#' },
    { name: '블로그', href: '#' },
    { name: '투자자 정보', href: '#' }
  ],
  support: [
    { name: '도움말 센터', href: '#' },
    { name: '고객 지원', href: '#' },
    { name: '디바이스 설정', href: '#' },
    { name: '문제 해결', href: '#' },
    { name: '상태 페이지', href: '#' }
  ],
  legal: [
    { name: '개인정보처리방침', href: '#' },
    { name: '이용약관', href: '#' },
    { name: 'HIPAA 준수', href: '#' },
    { name: '쿠키 정책', href: '#' },
    { name: '데이터 보안', href: '#' }
  ]
};

const socialLinks = [
  { name: 'Facebook', icon: Facebook, href: '#' },
  { name: 'Twitter', icon: Twitter, href: '#' },
  { name: 'Instagram', icon: Instagram, href: '#' },
  { name: 'LinkedIn', icon: Linkedin, href: '#' },
  { name: 'YouTube', icon: Youtube, href: '#' }
];

export function Footer() {
  const { currentLanguage } = useLanguageStore();
  const texts = landingTexts[currentLanguage as keyof typeof landingTexts];
  
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-6 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold">MIND BREEZE AI</span>
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              {texts.footer.description}
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-blue-400" />
                <span className="text-gray-400">support@mindbreeze.ai</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-blue-400" />
                <span className="text-gray-400">+82 (02) 1234-5678</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-blue-400 mt-0.5" />
                <span className="text-gray-400">서울특별시 강남구 테헤란로 123<br />대한민국</span>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <div className="lg:col-span-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">제품</h3>
              <ul className="space-y-3">
                {footerLinks.product.map((link, index) => (
                  <li key={index}>
                    <a href={link.href} className="text-gray-400 hover:text-white transition-colors text-sm">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">회사</h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link, index) => (
                  <li key={index}>
                    <a href={link.href} className="text-gray-400 hover:text-white transition-colors text-sm">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">지원</h3>
              <ul className="space-y-3">
                {footerLinks.support.map((link, index) => (
                  <li key={index}>
                    <a href={link.href} className="text-gray-400 hover:text-white transition-colors text-sm">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">법적 정보</h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link, index) => (
                  <li key={index}>
                    <a href={link.href} className="text-gray-400 hover:text-white transition-colors text-sm">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="border-t border-gray-800 mt-12 pt-12">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-xl font-semibold mb-2">최신 소식 받기</h3>
              <p className="text-gray-400">
                최신 건강 인사이트, 제품 업데이트, 웰니스 팁을 이메일로 받아보세요.
              </p>
            </div>
            <div className="flex space-x-4">
              <input
                type="email"
                placeholder="이메일을 입력하세요"
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
              />
              <button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors">
                구독하기
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            {/* Copyright */}
            <div className="text-sm text-gray-400">
              © 2025 MIND BREEZE AI. 모든 권리 보유.
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors"
                    aria-label={social.name}
                  >
                    <Icon className="w-5 h-5 text-gray-400 hover:text-white" />
                  </a>
                );
              })}
            </div>

            {/* Certifications */}
            <div className="flex items-center space-x-4 text-xs text-gray-400">
              <span className="bg-gray-800 px-3 py-1 rounded">FDA 승인</span>
              <span className="bg-gray-800 px-3 py-1 rounded">HIPAA 준수</span>
              <span className="bg-gray-800 px-3 py-1 rounded">ISO 27001</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}