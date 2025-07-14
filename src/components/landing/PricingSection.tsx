import { Check, Calculator, Users, Brain, Zap, Crown } from 'lucide-react';
import { Button } from '../ui/button';
import { useState } from 'react';

const aiServiceTiers = [
  { range: "100인 미만", discount: 10, price: 7110 },
  { range: "500인 미만", discount: 20, price: 6320 },
  { range: "1000인 미만", discount: 25, price: 5925 },
  { range: "5000인 미만", discount: 30, price: 5530 }
];

const linkBandOptions = [
  {
    type: "1개월 렌탈",
    price: 69000,
    description: "단기 프로젝트에 적합",
    features: ["무료 배송", "기술 지원 포함", "반납 처리 간편"]
  },
  {
    type: "3개월 렌탈",
    price: 156000,
    description: "중기 프로젝트에 최적",
    features: ["월 대비 25% 할인", "무료 배송", "기술 지원 포함", "반납 처리 간편"]
  },
  {
    type: "구매",
    price: 297000,
    description: "장기 사용에 경제적",
    features: ["2년 보증", "무료 배송", "기술 지원 포함", "소유권 이전"]
  }
];

const linkBandDiscountTiers = [
  { range: "10대 이상", discount: 10 },
  { range: "50대 이상", discount: 20 },
  { range: "100대 이상", discount: 25 },
  { range: "500대 이상", discount: 30 }
];

export function PricingSection() {
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

  const aiService = getAIServicePrice(employeeCount);
  const deviceDiscount = getDeviceDiscount(deviceCount);
  const devicePrice = getDevicePrice(deviceOption);
  const discountedDevicePrice = devicePrice * (1 - deviceDiscount / 100);

  const totalServiceCount = employeeCount * serviceCountPerPerson;
  const totalAIService = aiService.price * totalServiceCount;
  const totalDeviceCost = discountedDevicePrice * deviceCount;
  const totalCost = totalAIService + totalDeviceCost;

  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            기업 고객 전용 가격 안내
          </h2>
          <p className="text-xl text-gray-600">
            직원 수와 디바이스 수량에 따른 맞춤형 가격을 확인해보세요
          </p>
        </div>

        {/* AI Service Pricing */}
        <div className="mb-16">
          <div className="bg-white rounded-3xl p-8 shadow-lg mb-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-600 flex items-center justify-center">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">AI 리포트 & AI 상담 서비스</h3>
              <p className="text-gray-600">1인당 7,900원 (1회 측정 + AI 상담 서비스)</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {aiServiceTiers.map((tier, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-6 text-center">
                  <div className="text-sm font-medium text-gray-600 mb-2">{tier.range}</div>
                  <div className="text-2xl font-bold text-blue-600 mb-2">{tier.discount}% 할인</div>
                  <div className="text-lg font-bold text-gray-900">₩{tier.price.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">인당</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* LinkBand Options */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">링크밴드 디바이스 옵션</h3>
            <p className="text-gray-600">프로젝트 기간에 맞는 최적의 옵션을 선택하세요</p>
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
                  <div className="text-2xl font-bold text-gray-900">₩{option.price.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">디바이스당</div>
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
            <h4 className="text-lg font-bold text-gray-900 mb-4 text-center">대량 구매 할인율</h4>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {linkBandDiscountTiers.map((tier, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-sm font-medium text-gray-600 mb-1">{tier.range}</div>
                  <div className="text-xl font-bold text-green-600">{tier.discount}% 할인</div>
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
            <h3 className="text-2xl font-bold text-gray-900 mb-2">서비스 비용 예상해보기</h3>
            <p className="text-gray-600">귀하의 기업 규모에 맞는 예상 비용을 확인하세요</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">직원 수</label>
                <input
                  type="number"
                  value={employeeCount}
                  onChange={(e) => setEmployeeCount(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">인당 서비스 횟수</label>
                <input
                  type="number"
                  value={serviceCountPerPerson}
                  onChange={(e) => setServiceCountPerPerson(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">디바이스 수량</label>
                <input
                  type="number"
                  value={deviceCount}
                  onChange={(e) => setDeviceCount(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">디바이스 옵션</label>
                <select
                  value={deviceOption}
                  onChange={(e) => setDeviceOption(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="rental1">1개월 렌탈</option>
                  <option value="rental3">3개월 렌탈</option>
                  <option value="purchase">구매</option>
                </select>
              </div>
            </div>

            {/* Result Section */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4">예상 비용</h4>
              
              <div className="space-y-3">
                {/* AI 서비스 섹션 */}
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-800 mb-2">AI 서비스</div>
                  <div className="ml-4 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">AI 리포트 및 상담 제공 대상자</span>
                      <span className="text-gray-900">({employeeCount}명)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">인당 AI 리포트 및 상담 제공 횟수</span>
                      <span className="text-gray-900">({serviceCountPerPerson}회)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">총 AI 리포트 및 상담 제공 회수</span>
                      <span className="text-gray-900">({totalServiceCount.toLocaleString()}건)</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-gray-700">총 서비스 비용</span>
                      <span className="text-gray-900">
                        ₩{totalAIService.toLocaleString()} 
                        <span className="text-green-600 text-xs ml-1">
                          (할인 {aiService.discount}%, -₩{(7900 * totalServiceCount - totalAIService).toLocaleString()} 적용)
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 디바이스 비용 섹션 */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-gray-700">디바이스 비용 ({deviceCount}대, {deviceOption === 'rental1' ? '1개월 렌탈' : deviceOption === 'rental3' ? '3개월 렌탈' : '구매'})</span>
                    <span className="text-gray-900">
                      ₩{totalDeviceCost.toLocaleString()}
                      {deviceDiscount > 0 && (
                        <span className="text-green-600 text-xs ml-1">
                          (할인 {deviceDiscount}%, -₩{(devicePrice * deviceCount - totalDeviceCost).toLocaleString()} 적용)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                
                {/* 구분선 */}
                <div className="border-t border-gray-300 my-4"></div>
                
                {/* 총계 */}
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900">총 예상 비용</span>
                  <span className="text-blue-600">
                    ₩{totalCost.toLocaleString()}
                    <span className="text-green-600 text-sm ml-1">
                      (할인 ₩{((7900 * totalServiceCount + devicePrice * deviceCount) - totalCost).toLocaleString()} 적용)
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 font-medium"
              onClick={() => window.open('mailto:enterprise@mindbreeze.ai?subject=기업고객 견적 문의&body=안녕하세요, 다음과 같은 조건으로 견적을 문의드립니다.\n\n직원 수: ' + employeeCount + '명\n인당 서비스 횟수: ' + serviceCountPerPerson + '회\n총 서비스 횟수: ' + totalServiceCount + '회\n디바이스 수량: ' + deviceCount + '대\n디바이스 옵션: ' + deviceOption + '\n\n감사합니다.', '_blank')}
            >
              정확한 견적 문의하기
            </Button>
          </div>
        </div>

        {/* Enterprise Contact */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-3xl p-8 mt-16 text-center">
          <h3 className="text-2xl font-bold mb-4">맞춤형 기업 솔루션</h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            대규모 기업을 위한 특별 할인, 맞춤형 대시보드, 전담 지원팀 등 
            더 많은 혜택을 원하시면 직접 문의해주세요.
          </p>
          <Button 
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 font-medium"
            onClick={() => window.open('mailto:enterprise@mindbreeze.ai?subject=기업고객 맞춤 솔루션 문의&body=안녕하세요, 맞춤형 기업 솔루션에 대해 문의드립니다.', '_blank')}
          >
            맞춤 솔루션 문의하기
          </Button>
        </div>
      </div>
    </section>
  );
}