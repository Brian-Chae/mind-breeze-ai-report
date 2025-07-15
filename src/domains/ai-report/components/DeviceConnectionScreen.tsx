import React, { useState, useCallback } from 'react';
import { Button } from '@ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card';
import { Badge } from '@ui/badge';
import { Bluetooth, Wifi, Battery, Signal } from 'lucide-react';

import type { DeviceConnectionStatus } from '../types';

interface DeviceConnectionScreenProps {
  onConnected: () => void;
  onError: (error: string) => void;
  deviceStatus: DeviceConnectionStatus;
}

export function DeviceConnectionScreen({ onConnected, onError, deviceStatus }: DeviceConnectionScreenProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = useCallback(async () => {
    setIsConnecting(true);
    try {
      // TODO: 실제 DeviceManager 연결 로직 구현
      await new Promise(resolve => setTimeout(resolve, 2000)); // 임시
      onConnected();
    } catch (error) {
      onError(`디바이스 연결에 실패했습니다: ${error}`);
    } finally {
      setIsConnecting(false);
    }
  }, [onConnected, onError]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Bluetooth className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          LINK BAND 연결
        </h2>
        <p className="text-gray-700">
          디바이스를 착용하고 연결 버튼을 눌러주세요.
        </p>
      </div>

      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900">디바이스 상태</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium">연결 상태</span>
              <Badge 
                variant={deviceStatus.isConnected ? "default" : "secondary"}
                className={deviceStatus.isConnected 
                  ? "bg-green-100 text-green-800 border-green-200" 
                  : "bg-gray-100 text-gray-800 border-gray-200"
                }
              >
                {deviceStatus.isConnected ? "연결됨" : "연결 안됨"}
              </Badge>
            </div>
            
            {deviceStatus.deviceName && (
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">디바이스 이름</span>
                <span className="text-gray-900 font-medium">{deviceStatus.deviceName}</span>
              </div>
            )}
            
            {deviceStatus.batteryLevel && (
              <div className="flex items-center justify-between">
                <span className="flex items-center text-gray-700 font-medium">
                  <Battery className="w-4 h-4 mr-2 text-gray-600" />
                  배터리
                </span>
                <span className="text-gray-900 font-medium">{deviceStatus.batteryLevel}%</span>
              </div>
            )}
            
            {deviceStatus.signalStrength && (
              <div className="flex items-center justify-between">
                <span className="flex items-center text-gray-700 font-medium">
                  <Signal className="w-4 h-4 mr-2 text-gray-600" />
                  신호 강도
                </span>
                <span className="text-gray-900 font-medium">{deviceStatus.signalStrength}%</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button 
          onClick={handleConnect}
          disabled={isConnecting || deviceStatus.isConnected}
          className="px-8 py-3 text-white font-semibold bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isConnecting ? '연결 중...' : deviceStatus.isConnected ? '연결됨' : '디바이스 연결'}
        </Button>
      </div>
    </div>
  );
} 