import React, { useState, useEffect } from 'react';
import { useSensorDataStore } from '../../stores/sensorDataStore';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

interface PerformanceMonitorProps {
  className?: string;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ className }) => {
  const { performanceMetrics, isConnected } = useSensorDataStore();
  const [isExpanded, setIsExpanded] = useState(false);

  // 성능 상태 평가
  const getPerformanceStatus = () => {
    if (!performanceMetrics) return 'unknown';
    
    const { processingTime, memoryUsage, timestampSyncQuality } = performanceMetrics;
    
    if (processingTime > 100 || memoryUsage > 0.8 || timestampSyncQuality < 0.5) {
      return 'critical';
    } else if (processingTime > 50 || memoryUsage > 0.6 || timestampSyncQuality < 0.7) {
      return 'warning';
    } else {
      return 'good';
    }
  };

  const status = getPerformanceStatus();

  // 상태별 색상 및 아이콘
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'good':
        return { color: 'bg-green-500', icon: '✅', text: '양호' };
      case 'warning':
        return { color: 'bg-yellow-500', icon: '⚠️', text: '주의' };
      case 'critical':
        return { color: 'bg-red-500', icon: '🚨', text: '위험' };
      default:
        return { color: 'bg-gray-500', icon: '❓', text: '알 수 없음' };
    }
  };

  const statusConfig = getStatusConfig(status);

  if (!isConnected) {
    return (
      <div className={`${className} bg-gray-800/50 border border-gray-700 rounded-lg p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-300">성능 모니터</span>
          </div>
          <Badge variant="outline" className="text-gray-400">
            연결 안됨
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} bg-gray-800/50 border border-gray-700 rounded-lg p-4`}>
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 ${statusConfig.color} rounded-full animate-pulse`}></div>
          <span className="text-sm font-medium text-gray-200">성능 모니터</span>
          <span className="text-xs text-gray-400">{statusConfig.icon}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Badge 
            variant={status === 'good' ? 'default' : status === 'warning' ? 'secondary' : 'destructive'}
            className="text-xs"
          >
            {statusConfig.text}
          </Badge>
          <span className="text-xs text-gray-400">
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>
      </div>

      {isExpanded && performanceMetrics && (
        <div className="mt-4 space-y-3">
          {/* 처리 시간 */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">처리 시간</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-mono text-gray-200">
                {performanceMetrics.processingTime.toFixed(1)}ms
              </span>
              <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    performanceMetrics.processingTime > 100 ? 'bg-red-500' :
                    performanceMetrics.processingTime > 50 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, (performanceMetrics.processingTime / 100) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* 메모리 사용량 */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">메모리 사용량</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-mono text-gray-200">
                {(performanceMetrics.memoryUsage * 100).toFixed(1)}%
              </span>
              <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    performanceMetrics.memoryUsage > 0.8 ? 'bg-red-500' :
                    performanceMetrics.memoryUsage > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${performanceMetrics.memoryUsage * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* 버퍼 크기 */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">버퍼 크기</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-mono text-gray-200">
                EEG: {performanceMetrics.bufferSizes.eeg}
              </span>
              <span className="text-sm font-mono text-gray-200">
                PPG: {performanceMetrics.bufferSizes.ppg}
              </span>
              <span className="text-sm font-mono text-gray-200">
                ACC: {performanceMetrics.bufferSizes.acc}
              </span>
            </div>
          </div>

          {/* 드롭된 패킷 */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">드롭된 패킷</span>
            <span className="text-sm font-mono text-gray-200">
              {performanceMetrics.droppedPackets}개
            </span>
          </div>

          {/* 타임스탬프 동기화 품질 */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">타임스탬프 동기화</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-mono text-gray-200">
                {(performanceMetrics.timestampSyncQuality * 100).toFixed(1)}%
              </span>
              <div className={`w-2 h-2 rounded-full ${
                performanceMetrics.timestampSyncQuality > 0.9 ? 'bg-green-500' :
                performanceMetrics.timestampSyncQuality > 0.7 ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
            </div>
          </div>

          {/* 타임스탬프 드리프트 */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">타임스탬프 드리프트</span>
            <span className="text-sm font-mono text-gray-200">
              {performanceMetrics.timestampDriftRate.toFixed(3)}ms/s
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor; 