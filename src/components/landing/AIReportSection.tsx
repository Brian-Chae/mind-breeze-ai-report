import { Brain, Zap, Activity, TrendingUp, AlertTriangle, CheckCircle, Waves } from 'lucide-react';
import { Progress } from '@ui/progress';
import { useLanguageStore } from '../../stores/languageStore';
import { landingTexts } from '../../locales/landing';

export function AIReportSection() {
  const { currentLanguage } = useLanguageStore();
  const t = landingTexts[currentLanguage];

  const brainMetrics = [
    {
      category: t.aiReport.metrics.cognitivePerformance.title,
      score: 88,
      status: t.aiReport.metrics.cognitivePerformance.status,
      icon: Brain,
      color: "green" as const,
      insights: t.aiReport.metrics.cognitivePerformance.insights
    },
    {
      category: t.aiReport.metrics.stressMentalState.title,
      score: 76,
      status: t.aiReport.metrics.stressMentalState.status,
      icon: Zap,
      color: "blue" as const,
      insights: t.aiReport.metrics.stressMentalState.insights
    },
    {
      category: t.aiReport.metrics.sleepQuality.title,
      score: 82,
      status: t.aiReport.metrics.sleepQuality.status,
      icon: Waves,
      color: "purple" as const,
      insights: t.aiReport.metrics.sleepQuality.insights
    }
  ];

  const recommendations = [
    {
      type: "urgent" as const,
      icon: AlertTriangle,
      title: t.aiReport.recommendations.items.attentionTraining.title,
      description: t.aiReport.recommendations.items.attentionTraining.description
    },
    {
      type: "positive" as const,
      icon: CheckCircle,
      title: t.aiReport.recommendations.items.alphaActivity.title,
      description: t.aiReport.recommendations.items.alphaActivity.description
    },
    {
      type: "improvement" as const,
      icon: TrendingUp,
      title: t.aiReport.recommendations.items.thetaEnhancement.title,
      description: t.aiReport.recommendations.items.thetaEnhancement.description
    }
  ];

  return (
    <section id="ai-report" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            {t.aiReport.title}
          </h2>
          <p className="text-xl text-gray-600">
            {t.aiReport.subtitle}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sample Report */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Report Header */}
              <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">{t.aiReport.reportHeader.title}</h3>
                    <p className="opacity-90">{t.aiReport.reportHeader.subtitle}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">A-</div>
                    <div className="text-sm opacity-90">{t.aiReport.reportHeader.overallScore}</div>
                  </div>
                </div>
              </div>

              {/* Brain Metrics */}
              <div className="p-6 space-y-6">
                {brainMetrics.map((metric, index) => {
                  const Icon = metric.icon;
                  const colorClasses = {
                    green: "text-green-600 bg-green-100",
                    blue: "text-blue-600 bg-blue-100",
                    purple: "text-purple-600 bg-purple-100"
                  };

                  return (
                    <div key={index} className="border border-gray-100 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[metric.color]}`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">{metric.category}</h4>
                            <p className="text-sm text-gray-600">{metric.status}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">{metric.score}</div>
                          <div className="text-sm text-gray-600">/ 100</div>
                        </div>
                      </div>

                      <Progress value={metric.score} className="mb-4" />

                      <div className="space-y-2">
                        {metric.insights.map((insight, idx) => (
                          <div key={idx} className="flex items-start space-x-2 text-sm text-gray-600">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                            <span>{insight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">{t.aiReport.recommendations.title}</h3>
              <div className="space-y-4">
                {recommendations.map((rec, index) => {
                  const Icon = rec.icon;
                  const typeColors = {
                    urgent: "text-red-600 bg-red-100",
                    positive: "text-green-600 bg-green-100",
                    improvement: "text-blue-600 bg-blue-100"
                  };

                  return (
                    <div key={index} className="bg-white rounded-xl p-4 border border-gray-100">
                      <div className="flex items-start space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColors[rec.type]}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">{rec.title}</h4>
                          <p className="text-sm text-gray-600">{rec.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* EEG Report Features */}
            <div className="bg-blue-50 rounded-2xl p-6">
              <h4 className="font-bold text-gray-900 mb-4">{t.aiReport.features.title}</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                {t.aiReport.features.items.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>



            {/* CTA */}
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors">
              {t.aiReport.cta}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}