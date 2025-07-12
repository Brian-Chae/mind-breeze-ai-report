import { MessageCircle, Bot, User, Send, Clock } from 'lucide-react';
import { useState } from 'react';
import { useLanguageStore } from '../../stores/languageStore';
import { landingTexts } from '../../locales/landing';

// Sample conversation will be dynamically loaded from translations

export function AIConsultationSection() {
  const [newMessage, setNewMessage] = useState('');
  const { currentLanguage } = useLanguageStore();
  const t = landingTexts[currentLanguage];
  
  // Get sample conversation from translations
  const sampleConversation = t.consultation.chat.conversation.messages;

  return (
    <section id="consultation" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            {t.consultation.title}
          </h2>
          <p className="text-xl text-gray-600">
            {t.consultation.description}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Chat Interface Demo */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold">{t.consultation.chat.header}</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm opacity-90">{t.consultation.chat.online}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="h-96 overflow-y-auto p-6 space-y-4">
              {sampleConversation.map((msg, index) => (
                <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-sm ${
                    msg.type === 'user' 
                      ? 'bg-blue-600 text-white rounded-l-2xl rounded-tr-2xl' 
                      : 'bg-gray-100 text-gray-900 rounded-r-2xl rounded-tl-2xl'
                  } p-4`}>
                    <p className="text-sm leading-relaxed whitespace-pre-line">{msg.message}</p>
                    <div className={`text-xs mt-2 ${
                      msg.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {msg.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="p-6 border-t border-gray-100">
              <div className="flex space-x-4">
                <input
                  type="text"
                  placeholder={t.consultation.chat.placeholder}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-colors">
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {t.consultation.chat.disclaimer}
              </p>
            </div>
          </div>

          {/* Features and Benefits */}
          <div className="space-y-8">
            {/* AI Features */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">{t.consultation.aiFeatures.title}</h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl flex-shrink-0">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">{t.consultation.aiFeatures.available.title}</h4>
                    <p className="text-gray-600">{t.consultation.aiFeatures.available.description}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl flex-shrink-0">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">{t.consultation.aiFeatures.personalized.title}</h4>
                    <p className="text-gray-600">{t.consultation.aiFeatures.personalized.description}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl flex-shrink-0">
                    <Bot className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">{t.consultation.aiFeatures.growing.title}</h4>
                    <p className="text-gray-600">{t.consultation.aiFeatures.growing.description}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Use Cases */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h4 className="font-bold text-gray-900 mb-4">{t.consultation.useCases.title}</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                {t.consultation.useCases.examples.map((example, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <MessageCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>{example}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-xl p-6 text-center">
                <div className="text-2xl font-bold text-green-600">95%</div>
                <div className="text-sm text-gray-600">{t.consultation.stats.satisfaction}</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-6 text-center">
                <div className="text-2xl font-bold text-blue-600">&lt;30초</div>
                <div className="text-sm text-gray-600">{t.consultation.stats.responseTime}</div>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl p-6">
              <h4 className="text-xl font-bold mb-2">{t.consultation.cta.title}</h4>
              <p className="mb-4 opacity-90">{t.consultation.cta.description}</p>
              <button className="bg-white text-purple-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                {t.consultation.cta.button}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}