import { Check, Calculator, Users, Brain, Zap, Crown } from 'lucide-react';
import { Button } from '@ui/button';
import { useState } from 'react';
import { landingTexts } from '../../locales/landing';
import { useLanguageStore } from '../../stores/languageStore';

export function PricingSection() {
  const { currentLanguage } = useLanguageStore();
  const texts = landingTexts[currentLanguage as keyof typeof landingTexts];
  
  const [employeeCount, setEmployeeCount] = useState(100);
  const [deviceCount, setDeviceCount] = useState(10);
  const [deviceOption, setDeviceOption] = useState('rental1');
  const [serviceCountPerPerson, setServiceCountPerPerson] = useState(3);

  const getAIServicePrice = (count: number) => {
    if (count < 100) return { price: 7110, discount: 10 };
    if (count < 500) return { price: 6320, discount: 20 };
    if (count < 1000) return { price: 5925, discount: 25 };
    return { price: 5530, discount: 30 };
  };

  const getDeviceDiscount = (count: number) => {
    if (count >= 500) return 30;
    if (count >= 100) return 25;
    if (count >= 50) return 20;
    if (count >= 10) return 10;
    return 0;
  };

  const getDevicePrice = (option: string) => {
    switch (option) {
      case 'rental1': return 69000;
      case 'rental3': return 156000;
      case 'purchase': return 297000;
      default: return 69000;
    }
  };

  const formatCurrency = (amount: number) => {
    if (currentLanguage === 'ko') {
      return `₩${amount.toLocaleString()}`;
    } else if (currentLanguage === 'jp') {
      return `¥${amount.toLocaleString()}`;
    } else {
      return `$${(amount / 1000).toFixed(2)}`;
    }
  };

  const aiService = getAIServicePrice(employeeCount);
  const deviceDiscount = getDeviceDiscount(deviceCount);
  const devicePrice = getDevicePrice(deviceOption);
  const discountedDevicePrice = devicePrice * (1 - deviceDiscount / 100);

  const totalServiceCount = employeeCount * serviceCountPerPerson;
  const totalAIService = aiService.price * totalServiceCount;
  const totalDeviceCost = discountedDevicePrice * deviceCount;
  const totalCost = totalAIService + totalDeviceCost;

  const getDeviceOptionText = (option: string) => {
    switch (option) {
      case 'rental1': return texts.pricing.calculator.rental1Month;
      case 'rental3': return texts.pricing.calculator.rental3Month;
      case 'purchase': return texts.pricing.calculator.purchase;
      default: return texts.pricing.calculator.rental1Month;
    }
  };

  const getAIServiceTiers = () => [
    { range: texts.pricing.aiService.tiers.tier1.employees, discount: texts.pricing.aiService.tiers.tier1.discount, price: 7110 },
    { range: texts.pricing.aiService.tiers.tier2.employees, discount: texts.pricing.aiService.tiers.tier2.discount, price: 6320 },
    { range: texts.pricing.aiService.tiers.tier3.employees, discount: texts.pricing.aiService.tiers.tier3.discount, price: 5925 },
    { range: texts.pricing.aiService.tiers.tier4.employees, discount: texts.pricing.aiService.tiers.tier4.discount, price: 5530 }
  ];

  const getLinkBandOptions = () => [
    {
      type: texts.pricing.linkBand.options.rental1.name,
      price: texts.pricing.linkBand.options.rental1.price,
      description: currentLanguage === 'ko' ? '단기 프로젝트에 적합' : currentLanguage === 'jp' ? '短期プロジェクトに適している' : 'Perfect for short-term projects',
      features: currentLanguage === 'ko' ? ["무료 배송", "기술 지원 포함", "반납 처리 간편"] : 
                currentLanguage === 'jp' ? ["無料配送", "技術サポート含む", "返却処理簡単"] :
                ["Free shipping", "Technical support included", "Easy return process"]
    },
    {
      type: texts.pricing.linkBand.options.rental3.name,
      price: texts.pricing.linkBand.options.rental3.price,
      description: currentLanguage === 'ko' ? '중기 프로젝트에 최적' : currentLanguage === 'jp' ? '中期プロジェクトに最適' : 'Optimal for medium-term projects',
      features: currentLanguage === 'ko' ? ["월 대비 25% 할인", "무료 배송", "기술 지원 포함", "반납 처리 간편"] : 
                currentLanguage === 'jp' ? ["月比25%割引", "無料配送", "技術サポート含む", "返却処理簡単"] :
                ["25% discount vs monthly", "Free shipping", "Technical support included", "Easy return process"]
    },
    {
      type: texts.pricing.linkBand.options.purchase.name,
      price: texts.pricing.linkBand.options.purchase.price,
      description: currentLanguage === 'ko' ? '장기 사용에 경제적' : currentLanguage === 'jp' ? '長期使用に経済的' : 'Cost-effective for long-term use',
      features: currentLanguage === 'ko' ? ["2년 보증", "무료 배송", "기술 지원 포함", "소유권 이전"] : 
                currentLanguage === 'jp' ? ["2年保証", "無料配送", "技術サポート含む", "所有権移転"] :
                ["2-year warranty", "Free shipping", "Technical support included", "Ownership transfer"]
    }
  ];

  const getLinkBandDiscountTiers = () => [
    { range: currentLanguage === 'ko' ? '10대 이상' : currentLanguage === 'jp' ? '10台以上' : '10+ units', discount: 10 },
    { range: currentLanguage === 'ko' ? '50대 이상' : currentLanguage === 'jp' ? '50台以上' : '50+ units', discount: 20 },
    { range: currentLanguage === 'ko' ? '100대 이상' : currentLanguage === 'jp' ? '100台以上' : '100+ units', discount: 25 },
    { range: currentLanguage === 'ko' ? '500대 이상' : currentLanguage === 'jp' ? '500台以上' : '500+ units', discount: 30 }
  ];

  const aiServiceTiers = getAIServiceTiers();
  const linkBandOptions = getLinkBandOptions();
  const linkBandDiscountTiers = getLinkBandDiscountTiers();

  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            {texts.pricing.title}
          </h2>
          <p className="text-xl text-gray-600">
            {texts.pricing.subtitle}
          </p>
        </div>

        {/* AI Service Pricing */}
        <div className="mb-16">
          <div className="bg-white rounded-3xl p-8 shadow-lg mb-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-600 flex items-center justify-center">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{texts.pricing.aiService.title}</h3>
              <p className="text-gray-600">{texts.pricing.aiService.unitPrice} ({texts.pricing.aiService.description})</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {aiServiceTiers.map((tier, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-6 text-center">
                  <div className="text-sm font-medium text-gray-600 mb-2">{tier.range}</div>
                  <div className="text-2xl font-bold text-blue-600 mb-2">{tier.discount}% {currentLanguage === 'ko' ? '할인' : currentLanguage === 'jp' ? '割引' : 'discount'}</div>
                  <div className="text-lg font-bold text-gray-900">{formatCurrency(tier.price)}</div>
                  <div className="text-sm text-gray-500">{currentLanguage === 'ko' ? '인당' : currentLanguage === 'jp' ? '1人当たり' : 'per person'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* LinkBand Options */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">{texts.pricing.linkBand.title}</h3>
            <p className="text-gray-600">{currentLanguage === 'ko' ? '프로젝트 기간에 맞는 최적의 옵션을 선택하세요' : currentLanguage === 'jp' ? 'プロジェクト期間に合わせた最適なオプションを選択してください' : 'Choose the best option for your project duration'}</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            {linkBandOptions.map((option, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-500 transition-colors">
                <div className="text-center mb-6">
                  <div className={`w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center ${
                    index === 0 ? 'bg-green-100 text-green-600' :
                    index === 1 ? 'bg-blue-100 text-blue-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    {index === 0 ? <Zap className="w-6 h-6" /> :
                     index === 1 ? <Users className="w-6 h-6" /> :
                     <Crown className="w-6 h-6" />}
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{option.type}</h4>
                  <p className="text-gray-600 text-sm mb-4">{option.description}</p>
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(option.price)}</div>
                  <div className="text-sm text-gray-500">{currentLanguage === 'ko' ? '디바이스당' : currentLanguage === 'jp' ? 'デバイス当たり' : 'per device'}</div>
                </div>

                <ul className="space-y-2 mb-6">
                  {option.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* LinkBand Discounts */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-4 text-center">{texts.pricing.linkBand.discountNote}</h4>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {linkBandDiscountTiers.map((tier, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-sm font-medium text-gray-600 mb-1">{tier.range}</div>
                  <div className="text-xl font-bold text-green-600">{tier.discount}% {currentLanguage === 'ko' ? '할인' : currentLanguage === 'jp' ? '割引' : 'discount'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cost Calculator */}
        <div className="bg-white rounded-3xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-600 flex items-center justify-center">
              <Calculator className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{texts.pricing.calculator.title}</h3>
            <p className="text-gray-600">{currentLanguage === 'ko' ? '귀하의 기업 규모에 맞는 예상 비용을 확인하세요' : currentLanguage === 'jp' ? '御社の企業規模に合わせた予想費用を確認してください' : 'Check estimated costs for your company size'}</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{texts.pricing.calculator.employeeCount}</label>
                <input
                  type="number"
                  value={employeeCount}
                  onChange={(e) => setEmployeeCount(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{texts.pricing.calculator.serviceCountPerPerson}</label>
                <input
                  type="number"
                  value={serviceCountPerPerson}
                  onChange={(e) => setServiceCountPerPerson(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{texts.pricing.calculator.deviceCount}</label>
                <input
                  type="number"
                  value={deviceCount}
                  onChange={(e) => setDeviceCount(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{texts.pricing.calculator.deviceOption}</label>
                <select
                  value={deviceOption}
                  onChange={(e) => setDeviceOption(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="rental1">{texts.pricing.calculator.rental1Month}</option>
                  <option value="rental3">{texts.pricing.calculator.rental3Month}</option>
                  <option value="purchase">{texts.pricing.calculator.purchase}</option>
                </select>
              </div>
            </div>

            {/* Result Section */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4">{texts.pricing.calculator.estimatedCost}</h4>
              
              <div className="space-y-3">
                {/* AI 서비스 섹션 */}
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-800 mb-2">{texts.pricing.calculator.aiService}</div>
                  <div className="ml-4 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{texts.pricing.calculator.aiServiceTarget}</span>
                      <span className="text-gray-900">({employeeCount}{currentLanguage === 'ko' ? '명' : currentLanguage === 'jp' ? '名' : ' people'})</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{texts.pricing.calculator.aiServicePerPerson}</span>
                      <span className="text-gray-900">({serviceCountPerPerson}{currentLanguage === 'ko' ? '회' : currentLanguage === 'jp' ? '回' : ' times'})</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{texts.pricing.calculator.aiServiceTotal}</span>
                      <span className="text-gray-900">({totalServiceCount.toLocaleString()}{currentLanguage === 'ko' ? '건' : currentLanguage === 'jp' ? '件' : ' sessions'})</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-gray-700">{texts.pricing.calculator.totalServiceCost}</span>
                      <span className="text-gray-900">
                        {formatCurrency(totalAIService)}
                        <span className="text-green-600 text-xs ml-1">
                          ({texts.pricing.calculator.discountApplied} {aiService.discount}%, -{formatCurrency(7900 * totalServiceCount - totalAIService)} {currentLanguage === 'ko' ? '적용' : currentLanguage === 'jp' ? '適用' : 'applied'})
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 디바이스 비용 섹션 */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-gray-700">{texts.pricing.calculator.deviceCost} ({deviceCount}{currentLanguage === 'ko' ? '대' : currentLanguage === 'jp' ? '台' : ' units'}, {getDeviceOptionText(deviceOption)})</span>
                    <span className="text-gray-900">
                      {formatCurrency(totalDeviceCost)}
                      {deviceDiscount > 0 && (
                        <span className="text-green-600 text-xs ml-1">
                          ({texts.pricing.calculator.discountApplied} {deviceDiscount}%, -{formatCurrency(devicePrice * deviceCount - totalDeviceCost)} {currentLanguage === 'ko' ? '적용' : currentLanguage === 'jp' ? '適用' : 'applied'})
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                
                {/* 구분선 */}
                <div className="border-t border-gray-300 my-4"></div>
                
                {/* 총계 */}
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900">{texts.pricing.calculator.totalEstimatedCost}</span>
                  <span className="text-blue-600">
                    {formatCurrency(totalCost)}
                    <span className="text-green-600 text-sm ml-1">
                      ({texts.pricing.calculator.discountApplied} {formatCurrency((7900 * totalServiceCount + devicePrice * deviceCount) - totalCost)} {currentLanguage === 'ko' ? '적용' : currentLanguage === 'jp' ? '適用' : 'applied'})
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 font-medium"
              onClick={() => {
                const subject = currentLanguage === 'ko' ? '기업고객 견적 문의' : 
                              currentLanguage === 'jp' ? '企業顧客見積もり問い合わせ' : 
                              'Enterprise Customer Quote Request';
                const body = currentLanguage === 'ko' ? 
                  `안녕하세요, 다음과 같은 조건으로 견적을 문의드립니다.\n\n직원 수: ${employeeCount}명\n인당 서비스 횟수: ${serviceCountPerPerson}회\n총 서비스 횟수: ${totalServiceCount}회\n디바이스 수량: ${deviceCount}대\n디바이스 옵션: ${getDeviceOptionText(deviceOption)}\n\n감사합니다.` :
                  currentLanguage === 'jp' ?
                  `こんにちは、以下の条件で見積もりをお問い合わせいたします。\n\n従業員数: ${employeeCount}名\n1人あたりサービス回数: ${serviceCountPerPerson}回\n総サービス回数: ${totalServiceCount}回\nデバイス数量: ${deviceCount}台\nデバイスオプション: ${getDeviceOptionText(deviceOption)}\n\nありがとうございます。` :
                  `Hello, I would like to request a quote with the following conditions:\n\nNumber of employees: ${employeeCount}\nServices per person: ${serviceCountPerPerson}\nTotal services: ${totalServiceCount}\nDevice quantity: ${deviceCount}\nDevice option: ${getDeviceOptionText(deviceOption)}\n\nThank you.`;
                window.open(`mailto:enterprise@mindbreeze.ai?subject=${subject}&body=${body}`, '_blank');
              }}
            >
              {texts.pricing.calculator.requestQuote}
            </Button>
          </div>
        </div>

        {/* Enterprise Contact */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-3xl p-8 mt-16 text-center">
          <h3 className="text-2xl font-bold mb-4">{texts.pricing.enterprise.title}</h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            {texts.pricing.enterprise.description}
          </p>
          <Button 
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 font-medium"
            onClick={() => {
              const subject = currentLanguage === 'ko' ? '기업고객 맞춤 솔루션 문의' : 
                            currentLanguage === 'jp' ? '企業顧客カスタムソリューション問い合わせ' : 
                            'Enterprise Custom Solution Inquiry';
              const body = currentLanguage === 'ko' ? '안녕하세요, 맞춤형 기업 솔루션에 대해 문의드립니다.' :
                          currentLanguage === 'jp' ? 'こんにちは、カスタム企業ソリューションについてお問い合わせいたします。' :
                          'Hello, I would like to inquire about custom enterprise solutions.';
              window.open(`mailto:enterprise@mindbreeze.ai?subject=${subject}&body=${body}`, '_blank');
            }}
          >
            {texts.pricing.enterprise.cta}
          </Button>
        </div>
      </div>
    </section>
  );
}