import { Star, Quote, Check } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

const reviews = [
  {
    name: "김민수",
    role: "소프트웨어 엔지니어",
    age: 32,
    company: "테크 스타트업",
    rating: 5,
    review: "매일 아침 1분 건강 체크가 루틴이 되었어요. AI 분석이 정말 정확하고 개인화된 조언이 도움이 됩니다. 스트레스 관리가 훨씬 쉬워졌어요.",
    highlight: "업무 스트레스 조기 감지",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
    verified: true
  },
  {
    name: "이지은",
    role: "의료진",
    age: 38,
    company: "서울대학교병원",
    rating: 5,
    review: "의료진으로서 이 기술의 정확성에 감명받았습니다. 환자들에게도 추천하고 있어요. 데이터 품질이 임상급이에요.",
    highlight: "의료 전문가 승인",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
    verified: true
  },
  {
    name: "박준호",
    role: "피트니스 트레이너",
    age: 28,
    company: "프리미엄 헬스클럽",
    rating: 5,
    review: "클라이언트들의 운동 강도와 회복 상태를 모니터링하는 데 완벽합니다. 개인 맞춤형 운동 계획을 세우는 데 큰 도움이 됩니다.",
    highlight: "피트니스 전문가에게 완벽",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
    verified: true
  },
  {
    name: "정수연",
    role: "직장인",
    age: 35,
    company: "금융 회사",
    rating: 4,
    review: "직장 스트레스를 관리하는 데 정말 유용해요. AI 상담 기능이 특히 좋아요. 밤에 잠들기 전에 체크하는 것이 습관이 되었습니다.",
    highlight: "바쁜 부모에게 완벽",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
    verified: true
  },
  {
    name: "강태민",
    role: "학생",
    age: 22,
    company: "연세대학교",
    rating: 5,
    review: "시험 기간 스트레스와 수면 패턴을 추적하는 데 도움이 되었어요. 부모님도 제 건강 상태를 확인할 수 있어서 안심하십니다.",
    highlight: "학생을 위한 저렴한 건강 모니터링",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
    verified: true
  },
  {
    name: "최영희",
    role: "주부",
    age: 42,
    company: "가정",
    rating: 4,
    review: "가족 전체의 건강을 모니터링할 수 있어서 좋아요. 특히 아이들의 건강 상태를 확인할 수 있어서 마음이 놓입니다.",
    highlight: "건강 이상 조기 발견",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
    verified: true
  }
];

const useCases = [
  {
    title: "바쁜 직장인",
    description: "회의 사이 빠른 건강 체크",
    users: "15,000+ 사용자"
  },
  {
    title: "의료진",
    description: "힘든 근무 중 자가 모니터링",
    users: "3,500+ 사용자"
  },
  {
    title: "피트니스 애호가",
    description: "운동 강도와 회복 최적화",
    users: "8,200+ 사용자"
  },
  {
    title: "만성 질환 관리",
    description: "건강 상태 일일 모니터링",
    users: "2,800+ 사용자"
  }
];

export function ReviewsSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            검증된 성능으로 신뢰받는 MIND BREEZE AI
          </h2>
          <p className="text-xl text-gray-600">
            다양한 삶의 방식을 가진 사람들이 MIND BREEZE AI를 통해 건강을 관리하고 있습니다.
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">97.8%</div>
            <div className="text-gray-600">분석 정확도</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">95%</div>
            <div className="text-gray-600">사용자 만족도</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">2.3초</div>
            <div className="text-gray-600">평균 응답 시간</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">28가지</div>
            <div className="text-gray-600">분석 지표</div>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {reviews.map((review, index) => (
            <div key={index} className="bg-gray-50 rounded-2xl p-6 relative">
              <Quote className="absolute top-4 right-4 w-6 h-6 text-blue-200" />
              
              {/* Stars */}
              <div className="flex space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                  />
                ))}
              </div>

              {/* Review Text */}
              <p className="text-gray-700 mb-6 leading-relaxed">"{review.review}"</p>

              {/* Highlight */}
              <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium mb-4">
                <Check className="w-4 h-4 inline mr-2" />
                {review.highlight}
              </div>

              {/* User Info */}
              <div className="flex items-center space-x-3">
                <ImageWithFallback
                  src={review.avatar}
                  alt={review.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-semibold text-gray-900">{review.name}</div>
                  <div className="text-sm text-gray-600">{review.role}, {review.age}</div>
                </div>
              </div>
            </div>
          ))}
        </div>



        {/* Featured Review */}
        <div className="bg-gray-900 text-white rounded-3xl p-8 lg:p-12">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-xl lg:text-2xl font-medium mb-6 leading-relaxed">
                "MIND BREEZE AI가 제 스트레스와 번아웃을 감지하고 제가 교사로서 겪는 문제를 따뜻하게 들어주며 저를 위로해줬어요. 
                저보다 저를 더 잘 알고 함께 문제를 해결해줘서 좋았습니다. 기기도 너무 가볍고 디자인이 예뻐서 매일 착용하기 편해요."
              </blockquote>
              <div className="flex items-center space-x-4">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
                  alt="Featured reviewer"
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <div className="font-bold">김수정</div>
                  <div className="text-gray-300">초등학교 교사, 35</div>
                </div>
              </div>
            </div>
            <div className="bg-green-500 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold mb-2">개인 맞춤 분석</div>
              <div className="text-green-100 mb-4">나만을 위한 정확한 건강 컨설팅</div>
              <div className="bg-white text-green-600 px-4 py-2 rounded-lg font-medium">
                직업별 맞춤 솔루션
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}