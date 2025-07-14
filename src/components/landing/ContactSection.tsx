import { Mail, Phone, MapPin, Clock, Send, MessageSquare } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { useState } from 'react';
import { landingTexts } from '../../locales/landing';
import { useLanguageStore } from '../../stores/languageStore';

export function ContactSection() {
  const { currentLanguage } = useLanguageStore();
  const texts = landingTexts[currentLanguage as keyof typeof landingTexts];
  
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

  // Dynamic contact info based on language
  const contactInfo = [
    {
      icon: Mail,
      title: "이메일 지원",
      details: texts.contact.info.email,
      description: texts.contact.info.response
    },
    {
      icon: Phone,
      title: "전화 지원",
      details: texts.contact.info.phone,
      description: texts.contact.info.hours
    },
    {
      icon: MapPin,
      title: "본사 위치",
      details: texts.contact.info.address,
      description: "본사 방문 상담 가능"
    },
    {
      icon: Clock,
      title: "운영 시간",
      details: texts.contact.info.hours,
      description: "토요일: 오전 10시 - 오후 4시"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            {texts.contact.title}
          </h2>
          <p className="text-xl text-gray-600">
            {texts.contact.subtitle}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">{texts.contact.info.title}</h3>
              <div className="space-y-6">
                {/* Email */}
                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl flex-shrink-0">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">
                      {currentLanguage === 'ko' ? '이메일' : 
                       currentLanguage === 'en' ? 'Email' : 'メール'}
                    </h4>
                    <p className="text-gray-900 mb-1">{texts.contact.info.email}</p>
                    <p className="text-sm text-gray-600">{texts.contact.info.response}</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl flex-shrink-0">
                    <Phone className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">
                      {currentLanguage === 'ko' ? '전화' : 
                       currentLanguage === 'en' ? 'Phone' : '電話'}
                    </h4>
                    <p className="text-gray-900 mb-1">{texts.contact.info.phone}</p>
                    <p className="text-sm text-gray-600">{texts.contact.info.hours}</p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl flex-shrink-0">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">
                      {currentLanguage === 'ko' ? '주소' : 
                       currentLanguage === 'en' ? 'Address' : '住所'}
                    </h4>
                    <p className="text-gray-900 mb-1">{texts.contact.info.address}</p>
                    <p className="text-sm text-gray-600">
                      {currentLanguage === 'ko' ? '본사 방문 상담 가능' : 
                       currentLanguage === 'en' ? 'In-person consultation available' : 'オフィス訪問相談可能'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-6">
              <h4 className="font-bold text-gray-900 mb-4">{texts.contact.quickActions.title}</h4>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start text-gray-900 hover:text-gray-900">
                  <MessageSquare className="w-4 h-4 mr-2 text-gray-700" />
                  {texts.contact.quickActions.support}
                </Button>
                <Button variant="outline" className="w-full justify-start text-gray-900 hover:text-gray-900">
                  <Phone className="w-4 h-4 mr-2 text-gray-700" />
                  {texts.contact.quickActions.demo}
                </Button>
                <Button variant="outline" className="w-full justify-start text-gray-900 hover:text-gray-900">
                  <Mail className="w-4 h-4 mr-2 text-gray-700" />
                  {texts.contact.quickActions.sales}
                </Button>
              </div>
            </div>

            {/* Office Hours */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <h4 className="font-bold text-gray-900 mb-4">
                {currentLanguage === 'ko' ? '지원 시간' : 
                 currentLanguage === 'en' ? 'Support Hours' : 'サポート時間'}
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {currentLanguage === 'ko' ? '월요일 - 금요일:' : 
                     currentLanguage === 'en' ? 'Monday - Friday:' : '月曜日 - 金曜日:'}
                  </span>
                  <span className="text-gray-900">{texts.contact.info.hours}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {currentLanguage === 'ko' ? '토요일:' : 
                     currentLanguage === 'en' ? 'Saturday:' : '土曜日:'}
                  </span>
                  <span className="text-gray-900">
                    {currentLanguage === 'ko' ? '오전 10:00 - 오후 4:00' : 
                     currentLanguage === 'en' ? '10:00 AM - 4:00 PM' : '10:00 - 16:00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {currentLanguage === 'ko' ? '일요일:' : 
                     currentLanguage === 'en' ? 'Sunday:' : '日曜日:'}
                  </span>
                  <span className="text-gray-900">
                    {currentLanguage === 'ko' ? '휴무' : 
                     currentLanguage === 'en' ? 'Closed' : '休業'}
                  </span>
                </div>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-blue-700 text-xs">
                    {currentLanguage === 'ko' ? '모든 구독자를 위한 24/7 비상 건강 경보 및 AI 상담이 가능합니다.' :
                     currentLanguage === 'en' ? '24/7 emergency health alerts and AI consultation available for all subscribers.' :
                     'すべての加入者に24時間365日緊急健康アラートとAI相談が利用可能です。'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-gray-50 rounded-3xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">{texts.contact.form.title}</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    {texts.contact.form.name} *
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={currentLanguage === 'ko' ? '홍길동' : 
                                currentLanguage === 'en' ? 'John Smith' : '田中太郎'}
                    className="bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    {texts.contact.form.email} *
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
                    {currentLanguage === 'ko' ? '회사/기관' : 
                     currentLanguage === 'en' ? 'Company/Organization' : '会社/組織'}
                  </label>
                  <Input
                    id="company"
                    name="company"
                    type="text"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder={currentLanguage === 'ko' ? '당신의 회사' : 
                                currentLanguage === 'en' ? 'Your Company' : 'あなたの会社'}
                    className="bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    {texts.contact.form.subject} *
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder={currentLanguage === 'ko' ? '어떻게 도움을 받을 수 있을까요?' : 
                                currentLanguage === 'en' ? 'How can we help you?' : 'どのようにお手伝いできますか？'}
                    className="bg-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  {texts.contact.form.message} *
                </label>
                <Textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={currentLanguage === 'ko' ? '건강 모니터링 필요 사항이나 궁금하신 점을 알려주세요...' : 
                              currentLanguage === 'en' ? 'Tell us about your health monitoring needs or questions...' : 
                              '健康モニタリングのご要望やご質問をお聞かせください...'}
                  className="bg-white"
                />
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-3">
                <Send className="w-4 h-4 mr-2" />
                {texts.contact.form.submit}
              </Button>

              <p className="text-xs text-gray-600 text-center">
                {currentLanguage === 'ko' ? '일반적으로 24시간 내에 답변해드립니다. 긴급 사항의 경우 지원 번호를 통해 문의해주세요.' :
                 currentLanguage === 'en' ? 'We typically respond within 24 hours. For urgent matters, please contact our support number.' :
                 '通常24時間以内に回答いたします。緊急の場合は、サポート番号までお問い合わせください。'}
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}