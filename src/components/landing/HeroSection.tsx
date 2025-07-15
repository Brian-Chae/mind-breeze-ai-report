import { Clock, Zap, Activity, ArrowRight, Brain } from 'lucide-react';
import { Button } from '@ui/button';
import { useLanguageStore } from '../../stores/languageStore';
import { landingTexts } from '../../locales/landing';

export function HeroSection() {
  const { currentLanguage } = useLanguageStore();
  const t = landingTexts[currentLanguage];

  return (
    <section className="bg-gradient-to-br from-blue-50 via-white to-green-50 py-20 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full mb-8">
            <Brain className="w-4 h-4" />
            <span className="text-sm font-medium">세계 최초 혁신 기술</span>
          </div> */}

          {/* Main Headline */}
          <div className="space-y-6 mb-12">
            <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 leading-tight">
              <span className="text-blue-600">{t.hero.title}</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              {t.hero.subtitle}
            </p>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              {t.hero.description}
            </p>
          </div>

          {/* Key Features - Horizontal Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-4">
                <Brain className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{t.hero.features.eegChannels}</h3>
              <p className="text-sm text-gray-600">{t.hero.features.professionalGrade}</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-4">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{t.hero.features.ultraLight}</h3>
              <p className="text-sm text-gray-600">{t.hero.features.weight}</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-4">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{t.hero.timer.duration}</h3>
              <p className="text-sm text-gray-600">{t.hero.timer.description}</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4">
              {t.hero.cta}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4 text-gray-900 hover:text-gray-900 border-gray-300">
              {t.hero.watchDemo}
            </Button>
          </div>

          {/* Hero Image */}
          <div className="relative max-w-md mx-auto">
            <div className="bg-white rounded-3xl p-8 shadow-2xl">
              <img
                src="/linkband1.png"
                alt="LINK BAND 2.0 EEG headband device"
                className="w-full h-64 object-contain rounded-2xl"
              />
              
              {/* Simple Status Badge */}
              <div className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">{t.hero.floatingElements.eegActive}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-16 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{t.hero.stats.weight}</div>
              <div className="text-sm text-gray-600">{t.hero.stats.weightDesc}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{t.hero.stats.channels}</div>
              <div className="text-sm text-gray-600">{t.hero.stats.channelsDesc}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{t.hero.stats.analysis}</div>
              <div className="text-sm text-gray-600">{t.hero.stats.analysisDesc}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}