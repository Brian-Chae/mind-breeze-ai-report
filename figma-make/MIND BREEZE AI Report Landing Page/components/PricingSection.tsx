import { Check, X, Star, Zap, Crown } from 'lucide-react';
import { Button } from './ui/button';

const plans = [
  {
    name: "Basic",
    price: "$9.99",
    period: "/month",
    description: "Perfect for occasional health monitoring",
    icon: Star,
    color: "gray",
    popular: false,
    features: [
      { included: true, text: "10 AI health reports per month" },
      { included: true, text: "Basic AI consultation (5 questions/day)" },
      { included: true, text: "Health trend tracking" },
      { included: true, text: "Mobile app access" },
      { included: false, text: "Advanced analytics" },
      { included: false, text: "Priority AI consultation" },
      { included: false, text: "Custom health goals" },
      { included: false, text: "Family sharing" }
    ]
  },
  {
    name: "Professional",
    price: "$19.99",
    period: "/month",
    description: "Ideal for regular health monitoring",
    icon: Zap,
    color: "blue",
    popular: true,
    features: [
      { included: true, text: "Unlimited AI health reports" },
      { included: true, text: "Advanced AI consultation (unlimited)" },
      { included: true, text: "Detailed health analytics" },
      { included: true, text: "Custom health goals & tracking" },
      { included: true, text: "Export reports (PDF)" },
      { included: true, text: "Priority customer support" },
      { included: false, text: "Family sharing (up to 4 members)" },
      { included: false, text: "API access for developers" }
    ]
  },
  {
    name: "Family",
    price: "$34.99",
    period: "/month",
    description: "Complete family health monitoring solution",
    icon: Crown,
    color: "purple",
    popular: false,
    features: [
      { included: true, text: "Everything in Professional" },
      { included: true, text: "Family sharing (up to 6 members)" },
      { included: true, text: "Kids health monitoring (ages 6+)" },
      { included: true, text: "Family health insights dashboard" },
      { included: true, text: "Shared AI consultation history" },
      { included: true, text: "Emergency health alerts" },
      { included: true, text: "Dedicated family health advisor" },
      { included: true, text: "Priority device replacement" }
    ]
  }
];

const addOns = [
  {
    name: "LINK BAND Device",
    price: "$299",
    description: "One-time purchase • Required for health monitoring",
    features: ["Medical-grade sensors", "24-hour battery life", "Water resistant IPX7", "2-year warranty"]
  },
  {
    name: "Additional LINK BAND",
    price: "$249",
    description: "For family members or backup device",
    features: ["Same premium features", "Easy account switching", "Shared family data", "Extended warranty"]
  }
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            Choose Your Health Monitoring Plan
          </h2>
          <p className="text-xl text-gray-600">
            Start with our free trial, then select the plan that fits your health monitoring needs. 
            All plans include the core 1-minute AI analysis feature.
          </p>
        </div>

        {/* Free Trial Banner */}
        <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-2xl p-6 mb-12 text-center">
          <h3 className="text-2xl font-bold mb-2">🎉 Free 14-Day Trial Available</h3>
          <p className="text-green-100">
            Try any plan free for 14 days. No credit card required. Cancel anytime.
          </p>
        </div>

        {/* Pricing Plans */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const colorClasses = {
              gray: "border-gray-200 bg-white",
              blue: "border-blue-500 bg-blue-50 relative",
              purple: "border-purple-200 bg-white"
            };

            return (
              <div key={index} className={`rounded-3xl p-8 border-2 ${colorClasses[plan.color]} relative`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-medium">
                      Most Popular
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
                  Start Free Trial
                </Button>
              </div>
            );
          })}
        </div>

        {/* Add-ons */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Hardware &amp; Add-ons
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
                <Button variant="outline" className="w-full">
                  {addon.name.includes('Additional') ? 'Add to Cart' : 'Pre-Order Now'}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-3xl p-8 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Pricing FAQs
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-bold text-gray-900 mb-2">Do I need to buy the LINK BAND device?</h4>
              <p className="text-gray-600 text-sm mb-6">
                Yes, the LINK BAND device is required for health monitoring. It's a one-time purchase of $299 with a 2-year warranty.
              </p>

              <h4 className="font-bold text-gray-900 mb-2">Can I change plans anytime?</h4>
              <p className="text-gray-600 text-sm mb-6">
                Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.
              </p>

              <h4 className="font-bold text-gray-900 mb-2">What happens after the free trial?</h4>
              <p className="text-gray-600 text-sm">
                After 14 days, you'll be automatically enrolled in the plan you selected. You can cancel anytime during the trial period.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-2">Is there a family discount?</h4>
              <p className="text-gray-600 text-sm mb-6">
                Yes! Our Family plan provides significant savings compared to individual Professional plans for multiple users.
              </p>

              <h4 className="font-bold text-gray-900 mb-2">Are there any setup fees?</h4>
              <p className="text-gray-600 text-sm mb-6">
                No setup fees, no hidden costs. The only additional cost is the LINK BAND device, which is a one-time purchase.
              </p>

              <h4 className="font-bold text-gray-900 mb-2">Do you offer refunds?</h4>
              <p className="text-gray-600 text-sm">
                Yes! We offer a 30-day money-back guarantee on all subscription plans and a 60-day return policy on devices.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}