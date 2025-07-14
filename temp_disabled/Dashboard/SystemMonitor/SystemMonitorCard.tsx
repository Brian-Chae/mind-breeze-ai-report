import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Monitor, Cpu, HardDrive, Zap } from 'lucide-react';

export default function SystemMonitorCard() {
  // TODO: 실제 시스템 메트릭 연동
  const systemMetrics = {
    cpuUsage: 45,
    memoryUsage: 62,
    diskUsage: 78,
    networkSpeed: 125
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="w-5 h-5" />
          시스템 모니터링
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* CPU 사용률 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-600">CPU 사용률</span>
            </div>
            <Badge variant={systemMetrics.cpuUsage > 80 ? "destructive" : "default"}>
              {systemMetrics.cpuUsage}%
            </Badge>
          </div>

          {/* 메모리 사용률 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-600">메모리 사용률</span>
            </div>
            <Badge variant={systemMetrics.memoryUsage > 80 ? "destructive" : "default"}>
              {systemMetrics.memoryUsage}%
            </Badge>
          </div>

          {/* 디스크 사용률 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-gray-600">디스크 사용률</span>
            </div>
            <Badge variant={systemMetrics.diskUsage > 80 ? "destructive" : "default"}>
              {systemMetrics.diskUsage}%
            </Badge>
          </div>

          {/* 네트워크 속도 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-gray-600">네트워크 속도</span>
            </div>
            <Badge variant="outline">
              {systemMetrics.networkSpeed} Mbps
            </Badge>
          </div>

          {/* 시스템 상태 요약 */}
          <div className="pt-4 border-t">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">전체 시스템 상태</div>
              <Badge 
                variant={
                  systemMetrics.cpuUsage > 80 || systemMetrics.memoryUsage > 80 || systemMetrics.diskUsage > 90
                    ? "destructive" 
                    : "default"
                }
                className="text-sm"
              >
                {systemMetrics.cpuUsage > 80 || systemMetrics.memoryUsage > 80 || systemMetrics.diskUsage > 90
                  ? "주의 필요" 
                  : "정상"}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 