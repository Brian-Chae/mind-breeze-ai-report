import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Bluetooth, Zap, Activity, HardDrive, Brain, HeartPulse, Move3d, Battery } from 'lucide-react';
import { useSystemStatus, useDeviceStatus, useStreamingStatus, useRecordingStatus, useSensorContactStatus } from '../../stores/systemStore';
import { useStorageStore } from '../../stores/storageStore';
import { useProcessedDataStore } from '../../stores/processedDataStore';
import { useRawDataStore } from '../../stores/rawDataStore';
import { useDeviceStore } from '../../stores/deviceStore';
import { bluetoothService } from '../../utils/bluetoothService';
import { useState, useEffect } from 'react';

export function StatusBar() {
  // Store Hook들 사용
  const { isInitialized } = useSystemStatus();
  const { isConnected } = useDeviceStatus();
  const { isStreaming } = useStreamingStatus();
  const { isRecording } = useRecordingStatus();
  const { isSensorContacted, leadOffStatus } = useSensorContactStatus();
  
  // 저장소 상태
  const { currentSession, storageStatus } = useStorageStore();
  
  // PPG 프로세싱 데이터 버퍼 카운트
  const ppgAnalysis = useProcessedDataStore(state => state.ppgAnalysis);
  const dataStats = useRawDataStore(state => state.dataStats);
  
  // DeviceStore에서 샘플링 레이트 가져오기
  const connectedDevice = useDeviceStore(state => state.connectedDevice);
  const samplingRates = connectedDevice?.samplingRates || null;
  
  // 실시간 배터리 정보
  const [realtimeBatteryLevel, setRealtimeBatteryLevel] = useState<number>(0);
  
  // 실시간 레코딩 시간 계산
  const [recordingDuration, setRecordingDuration] = useState<string>('00:00:00');
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording && currentSession?.startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const start = new Date(currentSession.startTime).getTime();
        const diff = Math.floor((now - start) / 1000);
        
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        
        setRecordingDuration(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }, 1000);
    } else {
      setRecordingDuration('00:00:00');
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording, currentSession?.startTime]);

  // 배터리 레벨 업데이트
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isConnected && bluetoothService.isConnected()) {
      interval = setInterval(async () => {
        try {
          const batteryLevel = await bluetoothService.getBatteryLevel();
          setRealtimeBatteryLevel(batteryLevel);
        } catch (error) {
          console.error('Failed to get realtime battery level:', error);
        }
      }, 1000); // 1초마다 업데이트
    } else {
      setRealtimeBatteryLevel(0);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isConnected]);

  // 포맷팅 함수들
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  // 1) Device 상태 로직 개선
  const getDeviceStatus = () => {
    if (isConnected) {
      // 레코딩 중 연결이 끊어진 경우는 별도 체크 필요 (향후 구현)
      return {
        status: 'connected',
        variant: 'default' as const,
        text: 'Connected',
        className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
      };
    } else {
      return {
        status: 'disconnected',
        variant: 'secondary' as const,
        text: 'Disconnected',
        className: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
      };
    }
  };

  // 2) Sensor 상태 로직 개선
  const getSensorStatus = () => {
    if (!isConnected) {
      return {
        status: 'disconnected',
        variant: 'secondary' as const,
        text: 'Not Connected',
        className: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
      };
    } else if (isSensorContacted) {
      return {
        status: 'good',
        variant: 'default' as const,
        text: 'Good Contact',
        className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
      };
    } else {
      return {
        status: 'poor',
        variant: 'destructive' as const,
        text: 'Poor Contact',
        className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
      };
    }
  };

  // 3) Streaming 상태 로직 개선
  const getStreamingStatus = () => {
    if (!isConnected) {
      return {
        status: 'disconnected',
        variant: 'secondary' as const,
        text: 'Not Connected',
        className: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
      };
    } else if (isStreaming) {
      return {
        status: 'active',
        variant: 'default' as const,
        text: 'Good',
        className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
      };
    } else {
      return {
        status: 'stopped',
        variant: 'secondary' as const,
        text: 'Stopped',
        className: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
      };
    }
  };

  // 4) Recording 상태 로직 개선
  const getRecordingStatus = () => {
    if (!isConnected) {
      return {
        status: 'disconnected',
        variant: 'secondary' as const,
        text: 'Not Connected',
        className: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
      };
    } else if (isRecording) {
      return {
        status: 'recording',
        variant: 'default' as const,
        text: `${recordingDuration} • ${formatFileSize(currentSession?.estimatedSize || 0)}`,
        className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
      };
    } else {
      return {
        status: 'stopped',
        variant: 'secondary' as const,
        text: 'Stopped',
        className: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
      };
    }
  };

  // 각 상태 객체 생성
  const deviceStatus = getDeviceStatus();
  const sensorStatus = getSensorStatus();
  const streamingStatus = getStreamingStatus();
  const recordingStatus = getRecordingStatus();

  return (
    <footer className="bg-card border-t border-border px-8 py-3">
      <div className="flex items-center justify-between text-sm max-w-screen-2xl mx-auto">
        
        {/* 왼쪽: 핵심 4가지 상태 */}
        <div className="flex items-center space-x-8">
          
          {/* 1) Device 상태 */}
          <div className="flex items-center gap-2">
            <Bluetooth className="h-4 w-4 text-blue-500" />
            <span className="text-foreground font-medium">Device:</span>
            <Badge variant={deviceStatus.variant} className={`text-xs px-2 py-1 ${deviceStatus.className}`}>
              {deviceStatus.text}
            </Badge>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* 2) Sensor 상태 */}
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="text-foreground font-medium">Sensors:</span>
            <Badge variant={sensorStatus.variant} className={`text-xs px-2 py-1 ${sensorStatus.className}`}>
              {sensorStatus.text}
            </Badge>
            {isConnected && !isSensorContacted && (
              <span className="text-xs text-muted-foreground">
                (FP1: {leadOffStatus.fp1 ? 'OFF' : 'ON'}, FP2: {leadOffStatus.fp2 ? 'OFF' : 'ON'})
              </span>
            )}
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* 3) Streaming 상태 */}
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-green-500" />
            <span className="text-foreground font-medium">Streaming:</span>
            <Badge variant={streamingStatus.variant} className={`text-xs px-2 py-1 ${streamingStatus.className}`}>
              {streamingStatus.text}
            </Badge>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* 4) Recording 상태 */}
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-red-500" />
            <span className="text-foreground font-medium">Recording:</span>
            <Badge variant={recordingStatus.variant} className={`text-xs px-2 py-1 ${recordingStatus.className}`}>
              {recordingStatus.text}
            </Badge>
          </div>
        </div>

        {/* 오른쪽: 샘플링 레이트 및 배터리 */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center gap-2 min-w-fit">
            <Brain className="h-4 w-4 text-chart-1" />
            <span className="text-foreground">EEG: {isConnected && samplingRates?.eeg ? samplingRates.eeg.toFixed(1) : '-'} Hz</span>
          </div>

          <div className="flex items-center gap-2 min-w-fit">
            <HeartPulse className="h-4 w-4 text-chart-2" />
            <span className="text-foreground">PPG: {isConnected && samplingRates?.ppg ? samplingRates.ppg.toFixed(1) : '-'} Hz</span>
          </div>

          <div className="flex items-center gap-2 min-w-fit">
            <Move3d className="h-4 w-4 text-chart-3" />
            <span className="text-foreground">ACC: {isConnected && samplingRates?.acc ? samplingRates.acc.toFixed(1) : '-'} Hz</span>
          </div>

          <div className="flex items-center gap-2 min-w-fit">
            <Battery className="h-4 w-4 text-chart-4" />
            <span className="text-foreground">Battery: {isConnected && realtimeBatteryLevel > 0 ? `${realtimeBatteryLevel}%` : '-'}</span>
          </div>
        </div>

      </div>
    </footer>
  );
} 