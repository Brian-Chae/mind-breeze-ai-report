import { Check, X, Star, Zap, Crown } from 'lucide-react';
import { Button } from '../ui/button';

const plans = [
  {
    name: "베이직",
    price: "₩14,900",
    period: "/월",
    description: "가끔 건강 모니터링을 위한 완벽한 플랜",
    icon: Star,
    color: "gray",
    popular: false,
    features: [
      { included: true, text: "월 10회 AI 건강 리포트" },
      { included: true, text: "기본 AI 상담 (하루 5회 질문)" },
      { included: true, text: "건강 트렌드 추적" },
      { included: true, text: "모바일 앱 접근" },
      { included: false, text: "고급 분석" },
      { included: false, text: "우선 AI 상담" },
      { included: false, text: "맞춤 건강 목표" },
      { included: false, text: "가족 공유" }
    ]
  },
  {
    name: "프로페셔널",
    price: "₩29,900",
    period: "/월",
    description: "정기적인 건강 모니터링에 이상적",
    icon: Zap,
    color: "blue",
    popular: true,
    features: [
      { included: true, text: "무제한 AI 건강 리포트" },
      { included: true, text: "고급 AI 상담 (무제한)" },
      { included: true, text: "상세한 건강 분석" },
      { included: true, text: "맞춤 건강 목표 및 추적" },
      { included: true, text: "리포트 내보내기 (PDF)" },
      { included: true, text: "우선 고객 지원" },
      { included: false, text: "가족 공유 (최대 4명)" },
      { included: false, text: "개발자용 API 접근" }
    ]
  },
  {
    name: "패밀리",
    price: "₩49,900",
    period: "/월",
    description: "완전한 가족 건강 모니터링 솔루션",
    icon: Crown,
    color: "purple",
    popular: false,
    features: [
      { included: true, text: "프로페셔널의 모든 기능" },
      { included: true, text: "가족 공유 (최대 6명)" },
      { included: true, text: "아동 건강 모니터링 (6세 이상)" },
      { included: true, text: "가족 건강 인사이트 대시보드" },
      { included: true, text: "공유 AI 상담 기록" },
      { included: true, text: "비상 건강 경보" },
      { included: true, text: "전담 가족 건강 어드바이저" },
      { included: true, text: "우선 디바이스 교체" }
    ]
  }
];

const addOns = [
  {
    name: "링크밴드 디바이스",
    price: "₩297,000",
    description: "일회성 구매 • 마인드브리즈 AI 리포트 사용시 필수",
    features: ["편리한 사용성", "가벼운 무게(50g)", "의료기기급 센서 품질", "AI 분석 시스템 제공"]
  },
  {
    name: "추가 링크밴드",
    price: "₩249,000",
    description: "가족 구성원 또는 백업 디바이스용",
    features: ["동일한 프리미엄 기능", "간편한 계정 전환", "공유 가족 데이터", "연장 보증"]
  }
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            건강 모니터링 플랜 선택
          </h2>
          <p className="text-xl text-gray-600">
            무료 평가판부터 시작하여 건강 모니터링 필요에 맞는 플랜을 선택하세요. 
            모든 플랜은 핵심 1분 AI 분석 기능을 포함합니다.
          </p>
        </div>



        {/* Pricing Plans */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const colorClasses: { [key: string]: string } = {
              gray: "border-gray-200 bg-white",
              blue: "border-blue-500 bg-blue-50 relative",
              purple: "border-purple-200 bg-white"
            };

            return (
              <div key={index} className={`rounded-3xl p-8 border-2 ${colorClasses[plan.color]} relative`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-medium">
                      가장 인기 있는 플랜
                    </div>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-8">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                    plan.color === 'blue' ? 'bg-blue-600 text-white' :
                    plan.color === 'purple' ? 'bg-purple-600 text-white' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-1">{plan.period}</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start space-x-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      )}
                      <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button 
                  className={`w-full py-3 ${
                    plan.popular 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }`}
                >
                  무료 평가판 시작
                </Button>
              </div>
            );
          })}
        </div>

        {/* Add-ons */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            하드웨어 및 추가 기능
          </h3>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {addOns.map((addon, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">{addon.name}</h4>
                    <p className="text-gray-600 text-sm">{addon.description}</p>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{addon.price}</div>
                </div>
                <ul className="space-y-2 mb-6">
                  {addon.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full text-gray-900 hover:text-gray-900">
                  {addon.name.includes('추가') ? '장바구니에 추가' : '미리 예약하기'}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Enterprise Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-3xl p-8 mb-16 text-center">
          <h3 className="text-2xl font-bold mb-4">기업고객을 위한 특별 솔루션</h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            직원 건강 관리, 대량 구매 할인, 맞춤형 분석 대시보드 등 기업 전용 서비스를 제공합니다.
          </p>
          <Button 
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 font-medium"
            onClick={() => window.open('mailto:enterprise@mindbreeze.ai?subject=기업고객 문의&body=안녕하세요, 기업고객 서비스에 대해 문의드립니다.', '_blank')}
          >
            기업고객 문의하기
          </Button>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-3xl p-8 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            가격 자주 묻는 질문
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-bold text-gray-900 mb-2">링크밴드 디바이스를 구매해야 합니까?</h4>
              <p className="text-gray-600 text-sm mb-6">
                네, 링크밴드 디바이스는 건강 모니터링을 위해 필수적입니다. 일회성 구매로 ₩297,000에 2년 보증을 제공합니다.
              </p>

              <h4 className="font-bold text-gray-900 mb-2">언제든지 플랜을 변경할 수 있습니까?</h4>
              <p className="text-gray-600 text-sm mb-6">
                네, 언제든지 플랜을 업그레이드하거나 다운그레이드할 수 있습니다. 변경사항은 다음 청구 주기에 적용됩니다.
              </p>

              <h4 className="font-bold text-gray-900 mb-2">무료 평가판 후에 어떻게 됩니까?</h4>
              <p className="text-gray-600 text-sm">
                14일 후에는 선택하신 플랜에 자동으로 등록됩니다. 평가판 기간 중에는 언제든 취소할 수 있습니다.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-2">가족 할인이 있습니까?</h4>
              <p className="text-gray-600 text-sm mb-6">
                네! 가족 플랜은 여러 사용자를 위한 개별 프로페셔널 플랜에 비해 큰 절감을 제공합니다.
              </p>

              <h4 className="font-bold text-gray-900 mb-2">설정 비용이 있습니까?</h4>
              <p className="text-gray-600 text-sm mb-6">
                설정 비용이나 숨겨진 비용은 없습니다. 유일한 추가 비용은 링크밴드 디바이스로, 일회성 구매입니다.
              </p>

              <h4 className="font-bold text-gray-900 mb-2">환불이 가능합니까?</h4>
              <p className="text-gray-600 text-sm">
                네! 모든 구독 플랜에 대해 30일 환불 보증을 제공하며, 디바이스에 대해서는 60일 반품 정책을 제공합니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}