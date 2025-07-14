import { Star, Quote, Check } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { landingTexts } from '../../locales/landing';
import { useLanguageStore } from '../../stores/languageStore';

export function ReviewsSection() {
  const { currentLanguage } = useLanguageStore();
  const texts = landingTexts[currentLanguage as keyof typeof landingTexts];
  
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            {texts.reviews.title}
          </h2>
          <p className="text-xl text-gray-600">
            {texts.reviews.subtitle}
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{texts.reviews.stats.users.value}</div>
            <div className="text-gray-600">{texts.reviews.stats.users.label}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{texts.reviews.stats.satisfaction.value}</div>
            <div className="text-gray-600">{texts.reviews.stats.satisfaction.label}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{texts.reviews.stats.reports.value}</div>
            <div className="text-gray-600">{texts.reviews.stats.reports.label}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{texts.reviews.stats.support.value}</div>
            <div className="text-gray-600">{texts.reviews.stats.support.label}</div>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {texts.reviews.testimonials.map((review, index) => (
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

              {/* Verified Badge */}
              {review.verified && (
                <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium mb-4">
                  <Check className="w-4 h-4 inline mr-2" />
                  Verified User
                </div>
              )}

              {/* User Info */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {review.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{review.name}</div>
                  <div className="text-sm text-gray-600">{review.role}</div>
                  <div className="text-xs text-gray-500">{review.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>


      </div>
    </section>
  );
}