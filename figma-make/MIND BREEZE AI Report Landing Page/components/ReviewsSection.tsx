import { Star, Quote, Check } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

const reviews = [
  {
    name: "Sarah Chen",
    role: "Software Engineer",
    age: 32,
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b977?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
    review: "As a busy tech worker, I barely had time for health checkups. MIND BREEZE AI changed everything - just 1 minute and I get comprehensive health insights. The stress monitoring feature helped me identify work patterns affecting my health.",
    highlight: "Detected early stress patterns from overwork"
  },
  {
    name: "Dr. Michael Rodriguez",
    role: "Cardiologist",
    age: 45,
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
    review: "The accuracy of LINK BAND's biosignals impressed me. I've been using it alongside traditional monitoring for my patients. The AI recommendations are surprisingly sophisticated and align well with clinical best practices.",
    highlight: "Medical professional endorsement"
  },
  {
    name: "Jennifer Kim",
    role: "Fitness Trainer",
    age: 28,
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
    review: "I use MIND BREEZE AI with all my clients. The 1-minute measurement fits perfectly into our session warm-ups. The real-time feedback helps us adjust workouts immediately based on their current health state.",
    highlight: "Perfect for fitness professionals"
  },
  {
    name: "Robert Thompson",
    role: "Executive",
    age: 52,
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
    review: "After my heart scare last year, I needed constant health monitoring without the hassle. MIND BREEZE AI gives me peace of mind with instant health checks. The AI caught irregularities that I took to my doctor immediately.",
    highlight: "Early detection of health irregularities"
  },
  {
    name: "Lisa Park",
    role: "Working Mother",
    age: 36,
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
    review: "Managing work and kids left no time for health monitoring. The 1-minute check fits into my busy schedule perfectly. The AI consultation feature is like having a health advisor available 24/7.",
    highlight: "Perfect for busy parents"
  },
  {
    name: "Alex Johnson",
    role: "College Student",
    age: 22,
    rating: 4,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
    review: "As a college student, I can't afford regular health checkups. MIND BREEZE AI gives me professional-level health insights at an affordable price. It helped me understand how my study habits affect my health.",
    highlight: "Affordable health monitoring for students"
  }
];

const useCases = [
  {
    title: "Busy Professionals",
    description: "Quick health checks between meetings",
    users: "15,000+ users"
  },
  {
    title: "Healthcare Workers",
    description: "Self-monitoring during demanding shifts",
    users: "3,500+ users"
  },
  {
    title: "Fitness Enthusiasts",
    description: "Optimizing workout intensity and recovery",
    users: "8,200+ users"
  },
  {
    title: "Chronic Condition Management",
    description: "Daily monitoring for health conditions",
    users: "2,800+ users"
  }
];

export function ReviewsSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            Trusted by 50,000+ Users Worldwide
          </h2>
          <p className="text-xl text-gray-600">
            See how MIND BREEZE AI is transforming health monitoring for people from all walks of life.
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">50K+</div>
            <div className="text-gray-600">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">98%</div>
            <div className="text-gray-600">Satisfaction Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">2M+</div>
            <div className="text-gray-600">Reports Generated</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">24/7</div>
            <div className="text-gray-600">AI Support</div>
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

        {/* Use Cases */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-3xl p-8 mb-16">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Popular Use Cases
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, index) => (
              <div key={index} className="bg-white rounded-xl p-6 text-center">
                <h4 className="font-bold text-gray-900 mb-2">{useCase.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{useCase.description}</p>
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
                "MIND BREEZE AI detected my irregular heart patterns before I even felt symptoms. 
                The immediate AI analysis potentially saved my life by prompting me to seek medical attention."
              </blockquote>
              <div className="flex items-center space-x-4">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
                  alt="Featured reviewer"
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <div className="font-bold">Maria Gonzalez</div>
                  <div className="text-gray-300">Teacher, 48</div>
                </div>
              </div>
            </div>
            <div className="bg-green-500 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold mb-2">Early Detection</div>
              <div className="text-green-100 mb-4">Potentially life-saving alert</div>
              <div className="bg-white text-green-600 px-4 py-2 rounded-lg font-medium">
                Verified Medical Outcome
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}