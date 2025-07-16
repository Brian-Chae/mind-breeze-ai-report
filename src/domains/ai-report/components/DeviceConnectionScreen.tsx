import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card';
import { Badge } from '@ui/badge';
import { Alert, AlertDescription } from '@ui/alert';
import { Bluetooth, Wifi, Battery, Signal, Search, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

// 기존 store들 import
import { useDeviceStore } from '../../../stores/deviceStore';
import { useProcessedDataStore } from '../../../stores/processedDataStore';

// SystemControlService 인스턴스 import (이미 생성된 인스턴스 사용)
import { systemControlService } from '../../../core/services/SystemControlService';

import type { DeviceConnectionStatus } from '../types';

interface DeviceConnectionScreenProps {
  onConnected: () => void;
  onError: (error: string) => void;
  deviceStatus: DeviceConnectionStatus;
}

export function DeviceConnectionScreen({ onConnected, onError, deviceStatus }: DeviceConnectionScreenProps) {
  // Local states
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [systemReady, setSystemReady] = useState(false);

  // Store states
  const { availableDevices, connectionState, setScanning, setAvailableDevices } = useDeviceStore();
  const { isConnected } = useProcessedDataStore();

  // SystemControlService 인스턴스
  const systemControl = systemControlService;

  // 브라우저 호환성 체크
  const [browserInfo, setBrowserInfo] = useState<{
    isSupported: boolean;
    isIOS: boolean;
    isAndroid: boolean;
    browserName: string;
  } | null>(null);

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    initializeSystem();
    checkBrowserCompatibility();
  }, []);

  // 연결 상태 모니터링
  useEffect(() => {
    if (isConnected) {
      onConnected();
    }
  }, [isConnected, onConnected]);

  const initializeSystem = async () => {
    try {
      const status = systemControl.getStatus();
      if (!status.isInitialized) {
        await systemControl.initialize();
      }
      setSystemReady(true);
    } catch (error) {
      console.error('System initialization failed:', error);
      onError(`시스템 초기화에 실패했습니다: ${error instanceof Error ? error.message : error}`);
    }
  };

  const checkBrowserCompatibility = () => {
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isSupported = !!navigator.bluetooth && !isIOS;
    
    let browserName = 'Unknown';
    if (userAgent.includes('Chrome')) browserName = 'Chrome';
    else if (userAgent.includes('Firefox')) browserName = 'Firefox';
    else if (userAgent.includes('Safari')) browserName = 'Safari';
    else if (userAgent.includes('Edge')) browserName = 'Edge';

    setBrowserInfo({
      isSupported,
      isIOS,
      isAndroid,
      browserName
    });
  };

  const handleScan = useCallback(async () => {
    if (!navigator.bluetooth) {
      if (browserInfo?.isIOS) {
        onError('iOS에서는 Bluefy 또는 WebBLE 브라우저를 사용해주세요. App Store에서 다운로드 가능합니다.');
      } else {
        onError('Chrome 또는 Edge 브라우저를 사용해주세요.');
      }
      return;
    }

    setIsScanning(true);
    setScanError(null);
    setScanning(true);

    try {
      console.log('🔍 Starting device scan...');
      const devices = await systemControl.scanDevices();
      
      console.log('🔍 Scan completed. Found devices:', devices);
      setAvailableDevices(devices);
      
      if (devices.length === 0) {
        setScanError('디바이스를 찾을 수 없습니다. LINK BAND의 전원을 확인하고 다시 시도해주세요.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Device scan failed';
      console.error('🚨 Scan failed:', error);
      
      // 사용자가 취소한 경우 알림을 표시하지 않음
      if (!errorMessage.includes('cancelled') && !errorMessage.includes('취소')) {
        setScanError(errorMessage);
        onError(errorMessage);
      }
    } finally {
      setIsScanning(false);
      setScanning(false);
    }
  }, [browserInfo, systemControl, setScanning, setAvailableDevices, onError]);

  const handleConnect = useCallback(async (deviceId: string) => {
    if (isConnecting) return;

    setIsConnecting(true);
    setConnectionError(null);

    try {
      console.log('🔗 Connecting to device:', deviceId);
      await systemControl.connectDevice(deviceId);
      console.log('✅ Device connected successfully');
      
      // 연결 성공은 useEffect에서 isConnected 상태 변화로 처리됨
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      console.error('🚨 Connection failed:', error);
      setConnectionError(errorMessage);
      onError(`디바이스 연결에 실패했습니다: ${errorMessage}`);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, systemControl, onError]);

  const renderBrowserCompatibility = () => {
    if (!browserInfo || browserInfo.isSupported) return null;

    return (
      <Alert className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {browserInfo.isIOS ? (
            <>
              iOS에서는 <strong>Bluefy</strong> 또는 <strong>WebBLE</strong> 브라우저를 사용해주세요. 
              App Store에서 다운로드할 수 있습니다.
            </>
          ) : (
            <>
              현재 브라우저({browserInfo.browserName})는 Bluetooth를 지원하지 않습니다. 
              <strong>Chrome</strong> 또는 <strong>Edge</strong> 브라우저를 사용해주세요.
            </>
          )}
        </AlertDescription>
      </Alert>
    );
  };

  const renderDeviceList = () => {
    if (availableDevices.length === 0) {
      return (
        <div className="text-center py-8">
          <Bluetooth className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">발견된 디바이스가 없습니다</p>
          <p className="text-sm text-gray-500 mb-4">
            LINK BAND의 전원을 켜고 스캔 버튼을 눌러주세요
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {availableDevices.map((device) => (
          <Card key={device.id} className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <Bluetooth className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{device.name || 'LINK BAND'}</h4>
                    <p className="text-sm text-gray-600">ID: {device.id}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {device.batteryLevel && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Battery className="w-4 h-4 mr-1" />
                      {device.batteryLevel}%
                    </div>
                  )}
                  
                  <Badge 
                    variant={device.connected ? "default" : "secondary"}
                    className={device.connected 
                      ? "bg-green-100 text-green-800 border-green-200" 
                      : "bg-gray-100 text-gray-800 border-gray-200"
                    }
                  >
                    {device.connected ? "연결됨" : "사용 가능"}
                  </Badge>
                  
                  <Button
                    onClick={() => handleConnect(device.id)}
                    disabled={isConnecting || device.connected || !systemReady}
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-400"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        연결 중...
                      </>
                    ) : device.connected ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        연결됨
                      </>
                    ) : (
                      '연결'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Bluetooth className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          LINK BAND 연결
        </h2>
        <p className="text-gray-700">
          디바이스를 착용하고 스캔하여 연결해주세요.
        </p>
      </div>

      {renderBrowserCompatibility()}

      {/* 연결 상태 표시 */}
      {isConnected && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            디바이스가 성공적으로 연결되었습니다!
          </AlertDescription>
        </Alert>
      )}

      {/* 에러 표시 */}
      {(scanError || connectionError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {scanError || connectionError}
          </AlertDescription>
        </Alert>
      )}

      {/* 스캔 버튼 */}
      <div className="flex justify-center">
        <Button 
          onClick={handleScan}
          disabled={isScanning || !systemReady || !browserInfo?.isSupported}
          className="px-8 py-3 text-white font-semibold bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isScanning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              스캔 중...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              디바이스 스캔
            </>
          )}
        </Button>
      </div>

      {/* 디바이스 목록 */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900">
            발견된 디바이스 ({availableDevices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderDeviceList()}
        </CardContent>
      </Card>

      {/* 도움말 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">연결 팁:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>LINK BAND의 전원이 켜져 있는지 확인하세요</li>
                <li>디바이스와 1m 이내 거리를 유지하세요</li>
                <li>브라우저에서 Bluetooth 권한을 허용해주세요</li>
                <li>연결이 안 되면 스캔을 다시 시도해보세요</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 