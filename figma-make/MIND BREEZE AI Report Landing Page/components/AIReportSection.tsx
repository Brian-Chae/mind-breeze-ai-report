import { Brain, Zap, Activity, TrendingUp, AlertTriangle, CheckCircle, Waves } from 'lucide-react';
import { Progress } from './ui/progress';

const brainMetrics = [
  {
    category: "Cognitive Performance",
    score: 88,
    status: "Excellent",
    icon: Brain,
    color: "green",
    insights: [
      "Alpha wave activity indicates relaxed focus state",
      "Cognitive load levels within optimal range",
      "Mental clarity scores above average"
    ]
  },
  {
    category: "Stress & Mental State",
    score: 76,
    status: "Good",
    icon: Zap,
    color: "blue",
    insights: [
      "Beta wave patterns show moderate stress levels",
      "Theta waves suggest good creativity potential",
      "Recommend meditation for stress optimization"
    ]
  },
  {
    category: "Sleep Quality Assessment",
    score: 82,
    status: "Very Good",
    icon: Waves,
    color: "purple",
    insights: [
      "Delta wave patterns indicate deep sleep quality",
      "Sleep-wake cycle appears well-regulated",
      "REM activity suggests healthy brain recovery"
    ]
  }
];

const recommendations = [
  {
    type: "urgent",
    icon: AlertTriangle,
    title: "Attention Training",
    description: "Beta wave patterns suggest implementing focus enhancement exercises"
  },
  {
    type: "positive",
    icon: CheckCircle,
    title: "Excellent Alpha Activity",
    description: "Your relaxed focus state is optimal - maintain current mindfulness practices"
  },
  {
    type: "improvement",
    icon: TrendingUp,
    title: "Theta Wave Enhancement",
    description: "Try creative activities to boost theta waves for improved problem-solving"
  }
];

export function AIReportSection() {
  return (
    <section id="ai-report" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            AI-Powered Brain Analysis Report
          </h2>
          <p className="text-xl text-gray-600">
            Get comprehensive brain health insights with our advanced AI engine that analyzes 
            your EEG patterns and provides personalized recommendations for optimal cognitive wellness.
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
                    <h3 className="text-2xl font-bold">Brain Analysis Report</h3>
                    <p className="opacity-90">EEG Recording - July 12, 2025 at 2:30 PM</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">A-</div>
                    <div className="text-sm opacity-90">Overall Brain Health Score</div>
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
              <h3 className="text-xl font-bold text-gray-900 mb-6">AI Brain Recommendations</h3>
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
              <h4 className="font-bold text-gray-900 mb-4">EEG Analysis Features</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>2-channel EEG wave analysis</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Alpha, Beta, Theta, Delta detection</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Cognitive state assessment</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Stress level indicators</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Sleep quality insights</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Personalized brain training tips</span>
                </li>
              </ul>
            </div>

            {/* EEG Wave Patterns */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6">
              <h4 className="font-bold text-gray-900 mb-4">EEG Wave Types Analyzed</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Alpha (8-12 Hz)</span>
                  <span className="text-purple-600 font-medium">Relaxed Focus</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Beta (12-30 Hz)</span>
                  <span className="text-blue-600 font-medium">Active Thinking</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Theta (4-8 Hz)</span>
                  <span className="text-green-600 font-medium">Creativity</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Delta (0.5-4 Hz)</span>
                  <span className="text-orange-600 font-medium">Deep Sleep</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors">
              Try Sample EEG Report
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}