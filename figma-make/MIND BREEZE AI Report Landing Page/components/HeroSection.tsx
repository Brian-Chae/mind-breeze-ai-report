import { Clock, Zap, Activity, ArrowRight, Brain } from 'lucide-react';
import { Button } from './ui/button';
import linkBandHero from 'figma:asset/55f70a66226e9af819c146dca2d038d3d3da6fcd.png';

export function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-blue-50 via-white to-green-50 py-20 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
              <Brain className="w-4 h-4" />
              <span className="text-sm font-medium">LINK BAND 2.0 - Everyday EEG Technology</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                <span className="text-blue-600">Everyday EEG,</span><br />
                <span className="text-green-600">Redesigned.</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Revolutionary EEG headband that makes brain monitoring as simple as wearing headphones. 
                Get personalized AI health insights with professional-grade 2-channel EEG sensors.
              </p>
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 bg-white p-4 rounded-xl shadow-md border border-gray-100">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                  <Brain className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">2-Channel EEG</div>
                  <div className="text-sm text-gray-600">Professional Grade</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 bg-white p-4 rounded-xl shadow-md border border-gray-100">
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
                  <Zap className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">Ultra Light</div>
                  <div className="text-sm text-gray-600">Only 50g</div>
                </div>
              </div>
            </div>

            {/* Timer Visual */}
            <div className="flex items-center space-x-4 bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">60s</div>
                <div className="text-sm text-gray-600">Quick EEG Analysis</div>
              </div>
              <div className="flex items-center space-x-2 text-green-600">
                <Activity className="w-5 h-5" />
                <span className="font-medium">Real-time Brain Monitoring</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4">
                Experience LINK BAND
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">50g</div>
                <div className="text-sm text-gray-600">Ultra Lightweight</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">2-CH</div>
                <div className="text-sm text-gray-600">EEG Sensors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">24/7</div>
                <div className="text-sm text-gray-600">AI Analysis</div>
              </div>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative">
            <div className="relative bg-white rounded-3xl p-8 shadow-2xl overflow-hidden">
              <img
                src={linkBandHero}
                alt="Woman wearing LINK BAND 2.0 EEG headband device"
                className="w-full h-96 object-cover rounded-2xl"
              />
              
              {/* Floating UI Elements */}
              <div className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">EEG Active</span>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-white p-4 rounded-2xl shadow-lg border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Brain className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Brain Activity</div>
                    <div className="text-lg font-bold text-green-600">Optimal</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}