import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Brain, Heart, Activity, FileText, Settings, BarChart3 } from 'lucide-react';
import { ApplicationRunner } from '../applications/shared/components/ApplicationRunner';
import { AIHealthReportApp } from '../applications/ai-health-report/components/AIHealthReportApp';

export function Applications() {
  const [activeApplication, setActiveApplication] = useState<string | null>(null);
  const [shouldShowBackButton, setShouldShowBackButton] = useState(false);
  const appContextRef = useRef<any>(null);

  const applications = [
    {
      id: 'ai-health-report',
      title: 'AI Health Report',
      description: 'AI 기반 건강 분석 리포트를 생성하고 관리합니다.',
      icon: Brain,
      status: 'Active',
      color: 'bg-blue-500'
    },
    {
      id: 'ai-mental-health-monitor',
      title: 'AI Mental Health Monitor',
      description: '실시간 AI 기반 정신건강 모니터링 및 관리 도구입니다.',
      icon: Heart,
      status: 'Coming Soon',
      color: 'bg-red-500'
    },
    {
      id: 'wellness-tracker',
      title: 'Wellness Tracker',
              description: '종합적인 정신 건강 추적 및 분석 도구입니다.',
      icon: Activity,
      status: 'Coming Soon',
      color: 'bg-green-500'
    },
    {
      id: 'report-generator',
      title: 'Report Generator',
      description: '맞춤형 건강 리포트 생성 도구입니다.',
      icon: FileText,
      status: 'Coming Soon',
      color: 'bg-purple-500'
    },
    {
      id: 'analytics-dashboard',
      title: 'Analytics Dashboard',
      description: '고급 분석 대시보드 및 인사이트 도구입니다.',
      icon: BarChart3,
      status: 'Coming Soon',
      color: 'bg-orange-500'
    },
    {
      id: 'custom-app',
      title: 'Custom Application',
      description: '사용자 정의 애플리케이션 개발 도구입니다.',
      icon: Settings,
      status: 'Coming Soon',
      color: 'bg-gray-500'
    }
  ];

  const handleBack = () => {
    if (appContextRef.current && appContextRef.current.handleBack) {
      appContextRef.current.handleBack();
    }
  };

  return (
    <div className="h-full bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Applications</h1>
              <p className="text-muted-foreground mt-1">
                LINK BAND SDK 기반 애플리케이션 및 도구들
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((app) => {
            const Icon = app.icon;
            return (
              <Card key={app.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${app.color}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{app.title}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                          {app.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm mb-4">
                    {app.description}
                  </CardDescription>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    disabled={app.status === 'Coming Soon'}
                    onClick={() => {
                      if (app.id === 'ai-health-report' && app.status === 'Active') {
                        setActiveApplication(app.id);
                      }
                    }}
                  >
                    {app.status === 'Coming Soon' ? '개발 예정' : '실행'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="mt-8 p-6 bg-muted/50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">개발 중인 애플리케이션</h3>
          <p className="text-muted-foreground text-sm">
            LINK BAND SDK를 활용한 다양한 애플리케이션들이 개발 중입니다. 
            각 애플리케이션은 EEG, PPG 데이터를 활용하여 사용자에게 
            맞춤형 건강 인사이트를 제공할 예정입니다.
          </p>
        </div>
      </div>

      {/* Application Runner */}
      {activeApplication === 'ai-health-report' && (
        <ApplicationRunner
          component={AIHealthReportApp}
          initialMode="fullscreen"
          onClose={() => setActiveApplication(null)}
        />
      )}
    </div>
  );
} 