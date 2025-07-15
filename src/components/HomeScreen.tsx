import React from 'react';
import { Brain, Cpu, Eye, Database, FileText, Activity, Wifi, Battery, Download } from 'lucide-react';
import { Badge } from '@ui/badge';
import { Button } from '@ui/button';
import InstallPrompt from './PWA/InstallPrompt';

export const HomeScreen: React.FC = () => {
  return (
    <div className="h-full pl-6 pr-0 py-6">
      <div className="w-full space-y-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome to LINK BAND SDK
          </h1>
          <p className="text-muted-foreground text-lg">
            EEG 모니터링 및 데이터 분석을 위한 통합 개발 환경
          </p>
        </div>

        {/* PWA Install Prompt */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Download className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  앱으로 설치하기
                </h2>
                <p className="text-muted-foreground mb-4">
                  LINK BAND SDK를 홈 화면에 설치하여 더 빠르고 편리하게 사용하세요. 
                  오프라인에서도 데이터에 접근할 수 있고, 네이티브 앱과 같은 경험을 제공합니다.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <InstallPrompt variant="button" className="flex-1 sm:flex-none" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium mb-1">설치 혜택:</p>
                    <ul className="space-y-1">
                      <li>• 더 빠른 로딩 속도</li>
                      <li>• 오프라인 데이터 접근</li>
                      <li>• 푸시 알림 지원</li>
                      <li>• 네이티브 앱 경험</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Cpu className="w-8 h-8 text-blue-500" />
              <div>
                <h3 className="font-semibold text-foreground">Engine</h3>
                <Badge variant="destructive" className="text-xs">Stopped</Badge>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Brain className="w-8 h-8 text-purple-500" />
              <div>
                <h3 className="font-semibold text-foreground">LINK BAND</h3>
                <Badge variant="destructive" className="text-xs">Disconnected</Badge>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Activity className="w-8 h-8 text-green-500" />
              <div>
                <h3 className="font-semibold text-foreground">Signal Quality</h3>
                <Badge variant="outline" className="text-xs">-</Badge>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Database className="w-8 h-8 text-orange-500" />
              <div>
                <h3 className="font-semibold text-foreground">Data Storage</h3>
                <Badge variant="secondary" className="text-xs">Ready</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Main Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center space-x-4 mb-4">
              <Brain className="w-10 h-10 text-blue-500" />
              <div>
                <h2 className="text-xl font-semibold text-foreground">Device Connection</h2>
                <p className="text-muted-foreground">LINK BAND 디바이스를 연결하고 관리합니다</p>
              </div>
            </div>
            <Button className="w-full">
              Connect Device
            </Button>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center space-x-4 mb-4">
              <Eye className="w-10 h-10 text-green-500" />
              <div>
                <h2 className="text-xl font-semibold text-foreground">Data Visualization</h2>
                <p className="text-muted-foreground">실시간 EEG 데이터를 시각화합니다</p>
              </div>
            </div>
            <Button className="w-full" variant="outline">
              Open Visualizer
            </Button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-muted rounded-md">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm text-muted-foreground">17:55:16.186</span>
              <Badge variant="outline" className="text-xs">SYSTEM</Badge>
              <span className="text-sm text-foreground">Link Band SDK v1.0.2 starting up...</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-muted rounded-md">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-muted-foreground">17:55:16.190</span>
              <Badge variant="outline" className="text-xs">SYSTEM</Badge>
              <span className="text-sm text-foreground">System initialization started</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-muted rounded-md">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm text-muted-foreground">17:55:16.132</span>
              <Badge variant="outline" className="text-xs">SYSTEM</Badge>
              <span className="text-sm text-foreground">System initialization failed</span>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="ghost" className="h-auto p-4 flex flex-col items-center space-y-2">
              <FileText className="w-6 h-6" />
              <span className="text-sm">Documentation</span>
            </Button>
            <Button variant="ghost" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Database className="w-6 h-6" />
              <span className="text-sm">Data Center</span>
            </Button>
            <Button variant="ghost" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Eye className="w-6 h-6" />
              <span className="text-sm">Visualizer</span>
            </Button>
            <Button variant="ghost" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Cpu className="w-6 h-6" />
              <span className="text-sm">Settings</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}; 