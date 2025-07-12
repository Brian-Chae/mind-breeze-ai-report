import { Brain, Timer, FileText, ArrowRight } from 'lucide-react';
import { useLanguageStore } from '../../stores/languageStore';
import { landingTexts } from '../../locales/landing';

const stepIcons = [Brain, Timer, FileText];
const stepColors = ["blue", "green", "purple"];

export function ServiceProcess() {
  const { currentLanguage } = useLanguageStore();
  const t = landingTexts[currentLanguage];

  return (
    <section id="service" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            {t.process.title}
          </h2>
          <p className="text-xl text-gray-600">
            {t.process.subtitle}
          </p>
        </div>

        {/* Process Steps */}
        <div className="relative">
          {/* Connection Lines */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 transform -translate-y-1/2 z-0"></div>
          
          <div className="grid md:grid-cols-3 gap-8 relative z-10">
            {t.process.steps.map((step, index) => {
              const Icon = stepIcons[index];
              const color = stepColors[index];
              const colorClasses: Record<string, string> = {
                blue: "bg-blue-600 text-white border-blue-600",
                green: "bg-green-600 text-white border-green-600",
                purple: "bg-purple-600 text-white border-purple-600"
              };

              return (
                <div key={index} className="relative">
                  <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                    {/* Step Number */}
                    <div className="absolute -top-4 left-8 bg-gray-900 text-white w-12 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                      {String(index + 1).padStart(2, '0')}
                    </div>

                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${colorClasses[color]}`}>
                      <Icon className="w-8 h-8" />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{step.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{step.description}</p>

                    {/* Special indicators */}
                    {index === 0 && (
                      <div className="mt-6 flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
                        <Brain className="w-4 h-4" />
                        <span className="text-sm font-medium">{step.indicator}</span>
                      </div>
                    )}
                    
                    {index === 1 && (
                      <div className="mt-6 flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg">
                        <Timer className="w-4 h-4" />
                        <span className="text-sm font-medium">{step.indicator}</span>
                      </div>
                    )}

                    {index === 2 && (
                      <div className="mt-6 flex items-center space-x-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-lg">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm font-medium">{step.indicator}</span>
                      </div>
                    )}
                  </div>

                  {/* Arrow between steps */}
                  {index < t.process.steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-20">
                      <ArrowRight className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {t.process.cta.title}
            </h3>
            <p className="text-gray-600 mb-6">
              {t.process.cta.description}
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors">
              {t.process.cta.button}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}