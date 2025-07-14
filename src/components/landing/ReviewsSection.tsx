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

        {/* Use Cases */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            {texts.reviews.useCases.title}
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {texts.reviews.useCases.items.map((useCase, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 text-center">
                <h4 className="font-semibold text-gray-900 mb-2">{useCase.title}</h4>
                <p className="text-gray-600 text-sm mb-3">{useCase.description}</p>
                <div className="text-blue-600 font-medium text-sm">{useCase.users}</div>
              </div>
            ))}
          </div>
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
                "{texts.reviews.featured.quote}"
              </blockquote>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                  <span className="text-xl font-medium text-white">
                    {texts.reviews.featured.author.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-bold">{texts.reviews.featured.author}</div>
                  <div className="text-gray-300">{texts.reviews.featured.role}</div>
                </div>
              </div>
            </div>
            <div className="bg-green-500 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold mb-2">{texts.reviews.featured.badge.title}</div>
              <div className="text-green-100 mb-4">{texts.reviews.featured.badge.subtitle}</div>
              <div className="bg-white text-green-600 px-4 py-2 rounded-lg font-medium">
                {texts.reviews.featured.badge.verification}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}