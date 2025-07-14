import { Activity, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';
import { landingTexts } from '../../locales/landing';
import { useLanguageStore } from '../../stores/languageStore';

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
                <span className="text-gray-400">{texts.contact.info.email}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-blue-400" />
                <span className="text-gray-400">{texts.contact.info.phone}</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-blue-400 mt-0.5" />
                <span className="text-gray-400">{texts.contact.info.address}</span>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <div className="lg:col-span-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">{texts.footer.sections.product.title}</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#device" className="text-gray-400 hover:text-white transition-colors text-sm">
                    {texts.footer.sections.product.links.linkband}
                  </a>
                </li>
                <li>
                  <a href="#ai-report" className="text-gray-400 hover:text-white transition-colors text-sm">
                    {texts.footer.sections.product.links.aiReport}
                  </a>
                </li>
                <li>
                  <a href="#consultation" className="text-gray-400 hover:text-white transition-colors text-sm">
                    {texts.footer.sections.product.links.aiConsultation}
                  </a>
                </li>
                <li>
                  <a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm">
                    {texts.footer.sections.product.links.features}
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-gray-400 hover:text-white transition-colors text-sm">
                    {texts.footer.sections.product.links.pricing}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">{texts.footer.sections.company.title}</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    {texts.footer.sections.company.links.about}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    {texts.footer.sections.company.links.careers}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    {texts.footer.sections.company.links.news}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    {texts.footer.sections.company.links.contact}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">{texts.footer.sections.support.title}</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    {texts.footer.sections.support.links.help}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    {texts.footer.sections.support.links.documentation}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    {texts.footer.sections.support.links.community}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    {texts.footer.sections.support.links.status}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">{texts.footer.sections.legal.title}</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    {texts.footer.sections.legal.links.privacy}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    {texts.footer.sections.legal.links.terms}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    {texts.footer.sections.legal.links.cookies}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    {texts.footer.sections.legal.links.gdpr}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="border-t border-gray-800 mt-12 pt-12">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-xl font-semibold mb-2">{texts.footer.newsletter.title}</h3>
              <p className="text-gray-400">
                {texts.footer.newsletter.description}
              </p>
            </div>
            <div className="flex space-x-4">
              <input
                type="email"
                placeholder={texts.footer.newsletter.placeholder}
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
              />
              <button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors">
                {texts.footer.newsletter.subscribe}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            {/* Copyright */}
            <div className="text-sm text-gray-400">
              {texts.footer.copyright}
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors"
                aria-label={texts.footer.social.links.twitter}
              >
                <Twitter className="w-5 h-5 text-gray-400 hover:text-white" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors"
                aria-label={texts.footer.social.links.linkedin}
              >
                <Linkedin className="w-5 h-5 text-gray-400 hover:text-white" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors"
                aria-label={texts.footer.social.links.facebook}
              >
                <Facebook className="w-5 h-5 text-gray-400 hover:text-white" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors"
                aria-label={texts.footer.social.links.youtube}
              >
                <Youtube className="w-5 h-5 text-gray-400 hover:text-white" />
              </a>
            </div>

            {/* Certifications */}
            <div className="flex items-center space-x-4 text-xs text-gray-400">
              {texts.footer.certifications.items.map((cert, index) => (
                <span key={index} className="bg-gray-800 px-3 py-1 rounded">{cert}</span>
              ))}
            </div>
          </div>
          
          {/* Made with */}
          <div className="mt-6 text-center text-sm text-gray-400">
            {texts.footer.madeWith}
          </div>
        </div>
      </div>
    </footer>
  );
}