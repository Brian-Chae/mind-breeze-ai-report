import React, { useState } from 'react';
import { useDeviceStore } from '../../stores/deviceStore';
import { useDeviceStatus, useStreamingStatus, useSensorContactStatus, useSystemActions } from '../../stores/systemStore';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Bluetooth, Zap, Activity } from 'lucide-react';
import EEGVisualizer from './EEG/EEGVisualizer';
import PPGVisualizer from './PPG/PPGVisualizer';
import ACCVisualizer from './ACC/ACCVisualizer';

const Visualizer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'eeg' | 'ppg' | 'acc'>('eeg');
  const { connectionState } = useDeviceStore();
  const [isConnecting, setIsConnecting] = useState(false);
  
  // 강제 리로드를 위한 주석 추가
  
  // 상태 관리 훅들
  const { isConnected } = useDeviceStatus();
  const { isStreaming } = useStreamingStatus();
  const { isSensorContacted } = useSensorContactStatus();
  const systemActions = useSystemActions();

  // 디바이스 연결 함수
  const handleConnectDevice = async () => {
    if (!navigator.bluetooth) {
      alert('이 브라우저는 Bluetooth를 지원하지 않습니다. Chrome 또는 Edge 브라우저를 사용해주세요.');
      return;
    }

    setIsConnecting(true);
    try {
      // SystemActions를 사용하여 디바이스 스캔 및 연결
      await systemActions.scanDevices();
    } catch (error) {
      console.error('Device connection failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to device';
      
      // 사용자가 취소한 경우 알림을 표시하지 않음
      if (!errorMessage.includes('cancelled') && !errorMessage.includes('취소')) {
        alert(`연결에 실패했습니다: ${errorMessage}`);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const tabs = [
    { id: 'eeg', label: 'EEG 뇌파', icon: '🧠' },
    { id: 'ppg', label: 'PPG 심박', icon: '❤️' },
    { id: 'acc', label: 'ACC 가속도', icon: '📱' }
  ];

  // 상태별 Chip 스타일 함수들 (StatusBar와 동일)
  const getDeviceStatus = () => {
    if (isConnected) {
      return {
        variant: 'default' as const,
        text: 'Connected',
        className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
      };
    } else {
      return {
        variant: 'secondary' as const,
        text: 'Disconnected',
        className: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
      };
    }
  };

  const getSensorStatus = () => {
    if (!isConnected) {
      return {
        variant: 'secondary' as const,
        text: 'Not Connected',
        className: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
      };
    } else if (isSensorContacted) {
      return {
        variant: 'default' as const,
        text: 'Good Contact',
        className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
      };
    } else {
      return {
        variant: 'destructive' as const,
        text: 'Poor Contact',
        className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
      };
    }
  };

  const getStreamingStatus = () => {
    if (!isConnected) {
      return {
        variant: 'secondary' as const,
        text: 'Not Connected',
        className: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
      };
    } else if (isStreaming) {
      return {
        variant: 'default' as const,
        text: 'Good',
        className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
      };
    } else {
      return {
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

  if (connectionState.status !== 'connected') {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 bg-black p-8">
        <div className="text-center p-12 bg-gray-900 border border-gray-800 rounded-lg shadow-md max-w-md">
          <div className="text-6xl mb-6">📡</div>
          <h2 className="text-2xl font-bold text-gray-200 mb-4">
            디바이스 연결 필요
          </h2>
          <p className="text-gray-400 mb-8">
            데이터 시각화를 위해 LINK BAND 디바이스를 연결해주세요.
          </p>
          
          {/* 큰 파란색 연결 버튼 */}
          <Button
            onClick={handleConnectDevice}
            disabled={isConnecting}
            className="w-full h-16 text-xl font-bold !bg-blue-600 hover:!bg-blue-700 !text-white border-0 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            {isConnecting ? (
              <>
                <div className="animate-spin w-6 h-6 mr-3 border-2 border-white border-t-transparent rounded-full"></div>
                연결 중...
              </>
            ) : (
              <>
                <Bluetooth className="w-6 h-6 mr-3" />
                Link Band 연결하기
              </>
            )}
          </Button>
          
          <p className="text-sm text-gray-500 mt-4">
            버튼을 클릭하면 브라우저에서 디바이스 선택 창이 나타납니다
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-full">
      {/* 헤더 */}
      <div className="bg-gray-900 shadow-sm border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-200">
              📊 데이터 시각화
            </h1>
            
            {/* 상태 Chip들 */}
            <div className="flex items-center space-x-3">
              {/* Device 상태 */}
              <div className="flex items-center space-x-2">
                <Bluetooth className="h-4 w-4 text-gray-400" />
                <Badge 
                  variant={deviceStatus.variant}
                  className={`${deviceStatus.className} text-xs font-medium`}
                >
                  Device: {deviceStatus.text}
                </Badge>
              </div>

              {/* Sensor 상태 */}
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-gray-400" />
                <Badge 
                  variant={sensorStatus.variant}
                  className={`${sensorStatus.className} text-xs font-medium`}
                >
                  Sensors: {sensorStatus.text}
                </Badge>
              </div>

              {/* Streaming 상태 */}
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-gray-400" />
                <Badge 
                  variant={streamingStatus.variant}
                  className={`${streamingStatus.className} text-xs font-medium`}
                >
                  Streaming: {streamingStatus.text}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-gray-900 border-b border-gray-800 sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                  }
                `}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* 컨텐츠 영역 - 스크롤 가능 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        {activeTab === 'eeg' && <EEGVisualizer />}
        {activeTab === 'ppg' && <PPGVisualizer />}
        {activeTab === 'acc' && <ACCVisualizer />}
      </div>
    </div>
  );
};

export default Visualizer; 