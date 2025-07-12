import { Wifi, Battery, Shield, Smartphone, Heart, Brain, Zap, Bluetooth } from 'lucide-react';
import { useLanguageStore } from '../../stores/languageStore';
import { landingTexts } from '../../locales/landing';

export function LinkBandSection() {
  const { currentLanguage } = useLanguageStore();
  const t = landingTexts[currentLanguage];

  const features = [
    {
      icon: Brain,
      title: t.linkband.features.channels.title,
      description: t.linkband.features.channels.description
    },
    {
      icon: Zap,
      title: t.linkband.features.lightweight.title,
      description: t.linkband.features.lightweight.description
    },
    {
      icon: Bluetooth,
      title: t.linkband.features.wireless.title,
      description: t.linkband.features.wireless.description
    },
    {
      icon: Battery,
      title: t.linkband.features.battery.title,
      description: t.linkband.features.battery.description
    },
    {
      icon: Shield,
      title: t.linkband.features.quality.title,
      description: t.linkband.features.quality.description
    },
    {
      icon: Smartphone,
      title: t.linkband.features.setup.title,
      description: t.linkband.features.setup.description
    }
  ];

  const specs = [
    { label: currentLanguage === 'ko' ? '무게' : currentLanguage === 'jp' ? '重量' : 'Weight', value: t.linkband.specs.weight },
    { label: currentLanguage === 'ko' ? '뇌파 채널' : currentLanguage === 'jp' ? 'EEGチャンネル' : 'EEG Channels', value: t.linkband.specs.sensors },
    { label: currentLanguage === 'ko' ? '연결성' : currentLanguage === 'jp' ? '接続性' : 'Connectivity', value: t.linkband.specs.connectivity },
    { label: currentLanguage === 'ko' ? '디자인' : currentLanguage === 'jp' ? 'デザイン' : 'Design', value: currentLanguage === 'ko' ? '헤드밴드 스타일' : currentLanguage === 'jp' ? 'ヘッドバンドスタイル' : 'Headband Style' },
    { label: currentLanguage === 'ko' ? '센서' : currentLanguage === 'jp' ? 'センサー' : 'Sensors', value: currentLanguage === 'ko' ? '전문가급 뇌파' : currentLanguage === 'jp' ? 'プロフェッショナルEEG' : 'Professional EEG' },
    { label: currentLanguage === 'ko' ? '호환성' : currentLanguage === 'jp' ? '互換性' : 'Compatibility', value: currentLanguage === 'ko' ? 'iOS & 안드로이드' : currentLanguage === 'jp' ? 'iOS & Android' : 'iOS & Android' }
  ];

  return (
    <section id="device" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            {t.linkband.title}
          </h2>
          <p className="text-xl text-gray-600">
            {t.linkband.subtitle}. {t.linkband.description}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center mb-16">
          {/* Device Images */}
          <div className="relative">
            {/* Main Device Image */}
            <div className="bg-white rounded-3xl p-8 shadow-2xl mb-8">
              <img
                src="/linkband1.png"
                alt="LINK BAND 2.0 EEG headband device"
                className="w-full h-96 object-contain rounded-2xl"
              />
              
              {/* Feature Callouts */}
              <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                {currentLanguage === 'ko' ? '2.0 기술' : currentLanguage === 'jp' ? '2.0テクノロジー' : '2.0 Technology'}
              </div>
              
              <div className="absolute bottom-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                <Brain className="w-3 h-3" />
                <span>{t.linkband.specs.status}</span>
              </div>
            </div>

            {/* Image Gallery */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-4 shadow-lg">
                <img
                  src="/linkband2.png"
                  alt="LINK BAND 2.0 comfortable wearing"
                  className="w-full h-32 object-contain rounded-lg"
                />
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-lg">
                <img
                  src="/linkband3.png"
                  alt="LINK BAND 2.0 charging case"
                  className="w-full h-32 object-contain rounded-lg"
                />
              </div>
            </div>

            {/* Floating specs card */}
            <div className="absolute -bottom-8 -right-8 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 max-w-xs">
              <h4 className="font-bold text-gray-900 mb-3">
                {currentLanguage === 'ko' ? '주요 사양' : currentLanguage === 'jp' ? '主要仕様' : 'Key Specs'}
              </h4>
              <div className="space-y-2">
                {specs.slice(0, 3).map((spec, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{spec.label}:</span>
                    <span className="font-medium text-gray-900">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">{t.linkband.advancedTitle}</h3>
              <div className="grid gap-4">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-white rounded-xl border border-gray-100">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg flex-shrink-0">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Features Overview with Wellness Image */}
        <div className="mb-16">
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-3xl p-8">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {currentLanguage === 'ko' ? '웰니스 라이프스타일' : currentLanguage === 'jp' ? 'ウェルネスライフスタイル' : 'Wellness Lifestyle'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {currentLanguage === 'ko' ? 'LINK BAND 2.0으로 일상 속에서 뇌 건강을 모니터링하고 개선하세요.' : 
                   currentLanguage === 'jp' ? 'LINK BAND 2.0で日常生活の中で脳の健康を監視し、改善しましょう。' : 
                   'Monitor and improve your brain health in daily life with LINK BAND 2.0.'}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                                         <img
                       src="/linkband_4.png"
                       alt="LINK BAND 2.0 daily usage"
                       className="w-full h-24 object-contain rounded-lg mb-2"
                     />
                    <p className="text-sm font-medium text-gray-900">
                      {currentLanguage === 'ko' ? '일상 모니터링' : currentLanguage === 'jp' ? '日常監視' : 'Daily Monitoring'}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="w-full h-24 bg-blue-100 rounded-lg mb-2 flex items-center justify-center">
                      <Brain className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {currentLanguage === 'ko' ? 'AI 분석' : currentLanguage === 'jp' ? 'AI分析' : 'AI Analysis'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <img
                  src="/linkband_wellness.png"
                  alt="LINK BAND 2.0 wellness lifestyle"
                  className="w-full h-64 object-contain rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Technical Specifications */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-8 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              {currentLanguage === 'ko' ? '기술 사양' : currentLanguage === 'jp' ? '技術仕様' : 'Technical Specifications'}
            </h3>
            <div className="grid grid-cols-2 gap-6">
              {specs.map((spec, index) => (
                <div key={index} className="border-b border-gray-100 pb-3">
                  <div className="text-sm text-gray-600 mb-1">{spec.label}</div>
                  <div className="font-medium text-gray-900">{spec.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Why Choose LINK BAND */}
          <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-6">
              {currentLanguage === 'ko' ? '링크밴드 2.0을 선택하는 이유' : currentLanguage === 'jp' ? 'LINK BAND 2.0を選ぶ理由' : 'Why Choose LINK BAND 2.0?'}
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
                <span>
                  {currentLanguage === 'ko' ? '일상 사용을 위한 최초의 소비자용 뇌파 디바이스' : 
                   currentLanguage === 'jp' ? '日常使用のための最初の消費者向けEEGデバイス' : 
                   'First consumer EEG device for everyday use'}
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
                <span>
                  {currentLanguage === 'ko' ? '편안한 디자인의 전문가급 센서' : 
                   currentLanguage === 'jp' ? '快適なデザインのプロフェッショナルグレードセンサー' : 
                   'Professional-grade sensors in comfortable design'}
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
                <span>
                  {currentLanguage === 'ko' ? '뇌 활동 데이터에서 얻는 인공지능 기반 인사이트' : 
                   currentLanguage === 'jp' ? '脳活動データからのAI駆動インサイト' : 
                   'AI-powered insights from brain activity data'}
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
                <span>
                  {currentLanguage === 'ko' ? '일상 루틴과의 원활한 통합' : 
                   currentLanguage === 'jp' ? '日常ルーチンとのシームレスな統合' : 
                   'Seamless integration with daily routine'}
                </span>
              </li>
            </ul>
            
            <div className="mt-8">
              <a 
                href="https://www.linkband.store/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                {currentLanguage === 'ko' ? '링크밴드 2.0 주문하기' : 
                 currentLanguage === 'jp' ? 'LINK BAND 2.0 注문する' : 
                 'Order LINK BAND 2.0'}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}