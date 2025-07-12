import { Mail, Phone, MapPin, Clock, Send, MessageSquare } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { useState } from 'react';

const contactInfo = [
  {
    icon: Mail,
    title: "이메일 지원",
    details: "support@mindbreeze.ai",
    description: "24시간 내 답변 드립니다"
  },
  {
    icon: Phone,
    title: "전화 지원",
    details: "+82 (02) 1234-5678",
    description: "평일 오전 9시 - 오후 6시"
  },
  {
    icon: MapPin,
    title: "본사 위치",
    details: "서울특별시 강남구 테헤란로 123",
    description: "본사 방문 상담 가능"
  },
  {
    icon: Clock,
    title: "운영 시간",
    details: "평일: 오전 9시 - 오후 6시",
    description: "토요일: 오전 10시 - 오후 4시"
  }
];

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            연락처
          </h2>
          <p className="text-xl text-gray-600">
            마인드브리즈 AI에 대해 궁금하신 점이 있으신가요? 개인화된 건강 모니터링을 시작하는 데 도움을 드리겠습니다.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">연락처 정보</h3>
              <div className="space-y-6">
                {contactInfo.map((info, index) => {
                  const Icon = info.icon;
                  return (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl flex-shrink-0">
                        <Icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-1">{info.title}</h4>
                        <p className="text-gray-900 mb-1">{info.details}</p>
                        <p className="text-sm text-gray-600">{info.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-6">
              <h4 className="font-bold text-gray-900 mb-4">빠른 액션</h4>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start text-gray-900 hover:text-gray-900">
                  <MessageSquare className="w-4 h-4 mr-2 text-gray-700" />
                  실시간 채팅 지원
                </Button>
                <Button variant="outline" className="w-full justify-start text-gray-900 hover:text-gray-900">
                  <Phone className="w-4 h-4 mr-2 text-gray-700" />
                  데모 전화 예약
                </Button>
                <Button variant="outline" className="w-full justify-start text-gray-900 hover:text-gray-900">
                  <Mail className="w-4 h-4 mr-2 text-gray-700" />
                  제품 소개서 다운로드
                </Button>
              </div>
            </div>

            {/* Office Hours */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <h4 className="font-bold text-gray-900 mb-4">지원 시간</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">월요일 - 금요일:</span>
                  <span className="text-gray-900">오전 9:00 - 오후 6:00 EST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">토요일:</span>
                  <span className="text-gray-900">오전 10:00 - 오후 4:00 EST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">일요일:</span>
                  <span className="text-gray-900">휴무</span>
                </div>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-blue-700 text-xs">
                    모든 구독자를 위한 24/7 비상 건강 경보 및 AI 상담이 가능합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-gray-50 rounded-3xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">메시지 보내기</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    전체 이름 *
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="존 스미스"
                    className="bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    이메일 주소 *
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className="bg-white"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                    회사/기관
                  </label>
                  <Input
                    id="company"
                    name="company"
                    type="text"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="당신의 회사"
                    className="bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    제목 *
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="어떻게 도움을 받을 수 있을까요?"
                    className="bg-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  메시지 *
                </label>
                <Textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="건강 모니터링 필요 사항이나 궁금하신 점을 알려주세요..."
                  className="bg-white"
                />
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-3">
                <Send className="w-4 h-4 mr-2" />
                메시지 보내기
              </Button>

              <p className="text-xs text-gray-600 text-center">
                일반적으로 24시간 내에 답변해드립니다. 긴급 사항의 경우 지원 번호를 통해 문의해주세요.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}