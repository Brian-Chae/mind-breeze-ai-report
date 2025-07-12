import { Wifi, Battery, Shield, Smartphone, Heart, Brain, Zap, Bluetooth } from 'lucide-react';
import linkBandDevices from 'figma:asset/a65332bb9222702997c1967f140c6d63b0392410.png';
import linkBandFeatures from 'figma:asset/b7e65a8581b46a37228276986b9b757342192cfe.png';

const features = [
  {
    icon: Brain,
    title: "2-Channel EEG Sensors",
    description: "Professional-grade electroencephalography for accurate brain activity monitoring"
  },
  {
    icon: Zap,
    title: "Ultra Lightweight",
    description: "Only 50g - so light you'll forget you're wearing it"
  },
  {
    icon: Bluetooth,
    title: "Wireless Connectivity",
    description: "Seamless Bluetooth connection for real-time data transmission"
  },
  {
    icon: Battery,
    title: "All-Day Battery",
    description: "Extended battery life for continuous monitoring throughout your day"
  },
  {
    icon: Shield,
    title: "Medical Grade Quality",
    description: "Clinical-level accuracy with consumer-friendly design"
  },
  {
    icon: Smartphone,
    title: "Easy Setup",
    description: "Simple one-touch pairing with mobile app for instant use"
  }
];

const specs = [
  { label: "Weight", value: "50g" },
  { label: "EEG Channels", value: "2-Channel" },
  { label: "Connectivity", value: "Bluetooth" },
  { label: "Design", value: "Headband Style" },
  { label: "Sensors", value: "Professional EEG" },
  { label: "Compatibility", value: "iOS & Android" }
];

export function LinkBandSection() {
  return (
    <section id="device" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            LINK BAND 2.0: Everyday EEG Made Simple
          </h2>
          <p className="text-xl text-gray-600">
            Revolutionary EEG headband that brings professional brain monitoring into your daily life. 
            Lightweight, wireless, and incredibly easy to use.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center mb-16">
          {/* Device Images */}
          <div className="relative">
            <div className="bg-white rounded-3xl p-8 shadow-2xl">
              <img
                src={linkBandDevices}
                alt="LINK BAND 2.0 EEG headband device with charging case"
                className="w-full h-96 object-cover rounded-2xl"
              />
              
              {/* Feature Callouts */}
              <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                2.0 Technology
              </div>
              
              <div className="absolute bottom-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                <Brain className="w-3 h-3" />
                <span>EEG Ready</span>
              </div>
            </div>

            {/* Floating specs card */}
            <div className="absolute -bottom-8 -right-8 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 max-w-xs">
              <h4 className="font-bold text-gray-900 mb-3">Key Specs</h4>
              <div className="space-y-2">
                {specs.slice(0, 3).map((spec, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{spec.label}:</span>
                    <span className="font-medium text-gray-900">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Advanced EEG Monitoring Features</h3>
              <div className="grid gap-4">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-white rounded-xl border border-gray-100">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg flex-shrink-0">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Features Overview */}
        <div className="mb-16">
          <img
            src={linkBandFeatures}
            alt="LINK BAND 2.0 features overview - lightweight, 2-channel EEG, wireless connectivity"
            className="w-full rounded-3xl shadow-xl"
          />
        </div>

        {/* Technical Specifications */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-8 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Technical Specifications</h3>
            <div className="grid grid-cols-2 gap-6">
              {specs.map((spec, index) => (
                <div key={index} className="border-b border-gray-100 pb-3">
                  <div className="text-sm text-gray-600 mb-1">{spec.label}</div>
                  <div className="font-medium text-gray-900">{spec.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Why Choose LINK BAND */}
          <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-6">Why Choose LINK BAND 2.0?</h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
                <span>First consumer EEG device for everyday use</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
                <span>Professional-grade sensors in comfortable design</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
                <span>AI-powered insights from brain activity data</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
                <span>Seamless integration with daily routine</span>
              </li>
            </ul>
            
            <div className="mt-8">
              <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                Pre-Order LINK BAND 2.0
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}