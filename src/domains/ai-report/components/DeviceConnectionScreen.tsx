import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card';
import { Badge } from '@ui/badge';
import { Switch } from '@ui/switch';
import { Alert, AlertDescription } from '@ui/alert';
import { 
  Bluetooth, 
  Search, 
  Battery, 
  CircuitBoard,
  Wifi,
  WifiOff,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2
} from 'lucide-react';

// 현재 프로젝트의 stores 활용
import { useDeviceStore } from '../../../stores/deviceStore';
import { useProcessedDataStore } from '../../../stores/processedDataStore';

// SystemControlService 인스턴스 import (이미 생성된 인스턴스 사용)
import { systemControlService } from '../../../core/services/SystemControlService';
import { bluetoothService } from '../../../utils/bluetoothService';

import type { DeviceConnectionStatus } from '../types';

interface DeviceConnectionScreenProps {
  onConnectionSuccess: () => void;
  onBack: () => void;
  onError: (error: string) => void;
}

export function DeviceConnectionScreen({ onConnectionSuccess, onBack, onError }: DeviceConnectionScreenProps) {
  // 브라우저 호환성 정보
  const [browserInfo, setBrowserInfo] = useState<{
    isSupported: boolean;
    isIOS: boolean;
    isAndroid: boolean;
    browserName: string;
    platform: string;
  } | null>(null);

  // 자동 연결 설정
  const [autoConnectionEnabled, setAutoConnectionEnabled] = useState(() => {
    const saved = localStorage.getItem('autoConnectionEnabled');
    return saved ? JSON.parse(saved) : true;
  });

  // Local states
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [systemReady, setSystemReady] = useState(false);
  const [connectingDeviceId, setConnectingDeviceId] = useState<string | null>(null);
  const [autoConnectAttempted, setAutoConnectAttempted] = useState(new Set<string>());

  // Store states
  const { availableDevices, connectionState, setScanning, setAvailableDevices } = useDeviceStore();
  const { isConnected } = useProcessedDataStore();

  // SystemControlService 인스턴스
  const systemControl = systemControlService;

  // 실시간 디바이스 정보
  const [realtimeDeviceInfo, setRealtimeDeviceInfo] = useState<{
    batteryLevel: number;
    connectionDuration: number;
    connectionStartTime: number;
    samplingRates: { eeg: number; ppg: number; acc: number };
  } | null>(null);

  // 브라우저 호환성 확인
  useEffect(() => {
    const detectBrowser = () => {
      const userAgent = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isAndroid = /Android/.test(userAgent);
      const hasWebBluetooth = 'bluetooth' in navigator;
      const isSecureContext = window.isSecureContext;

      let browserName = 'Unknown';
      if (userAgent.includes('Chrome')) browserName = 'Chrome';
      else if (userAgent.includes('Safari')) browserName = 'Safari';
      else if (userAgent.includes('Firefox')) browserName = 'Firefox';
      else if (userAgent.includes('Edge')) browserName = 'Edge';

      const platform = isIOS ? 'iOS' : isAndroid ? 'Android' : 'Desktop';
      const isSupported = hasWebBluetooth && isSecureContext && !isIOS;

      return {
        isSupported,
        isIOS,
        isAndroid,
        browserName,
        platform
      };
    };

    setBrowserInfo(detectBrowser());
  }, []);

  // 자동 연결 설정 저장
  useEffect(() => {
    localStorage.setItem('autoConnectionEnabled', JSON.stringify(autoConnectionEnabled));
  }, [autoConnectionEnabled]);

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    initializeSystem();
  }, []);

  // 연결 상태 모니터링
  useEffect(() => {
    if (isConnected) {
      // 2초 후 자동으로 다음 단계로 진행
      const timer = setTimeout(() => {
        onConnectionSuccess();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, onConnectionSuccess]);

  // 자동 연결 기능
  useEffect(() => {
    const autoConnectDevices = async () => {
      if (!autoConnectionEnabled || 
          isConnected || 
          !systemReady ||
          availableDevices.length === 0 ||
          isConnecting) {
        return;
      }

      const newDevices = availableDevices.filter(device => 
        !autoConnectAttempted.has(device.id) && !device.connected
      );

      if (newDevices.length === 0) {
        return;
      }

      const deviceToConnect = newDevices[0];
      
      try {
        console.log('Auto-connecting to device:', deviceToConnect.name);
        setAutoConnectAttempted(prev => new Set(prev).add(deviceToConnect.id));
        await handleConnect(deviceToConnect.id);
      } catch (error) {
        console.error('Auto-connect failed for device:', deviceToConnect.name, error);
      }
    };

    if (availableDevices.length > 0 && autoConnectionEnabled) {
      const timeoutId = setTimeout(autoConnectDevices, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [availableDevices, isConnected, autoConnectionEnabled, isConnecting, systemReady]);

  // 연결이 해제되면 자동 연결 시도 기록 초기화
  useEffect(() => {
    if (!isConnected) {
      setAutoConnectAttempted(new Set());
    }
  }, [isConnected]);

  // 실시간 디바이스 정보 업데이트
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isConnected && bluetoothService.isConnected()) {
      interval = setInterval(async () => {
        try {
          const batteryLevel = await bluetoothService.getBatteryLevel();
          
          setRealtimeDeviceInfo({
            batteryLevel,
            connectionDuration: bluetoothService.getConnectionDuration(),
            connectionStartTime: bluetoothService.getConnectionStartTime(),
            samplingRates: bluetoothService.getCurrentSamplingRates()
          });
        } catch (error) {
          console.error('Failed to get realtime device info:', error);
        }
      }, 2000); // 2초마다 업데이트
    } else {
      setRealtimeDeviceInfo(null);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isConnected]);

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
    if (isConnecting || connectingDeviceId === deviceId) return;

    setIsConnecting(true);
    setConnectingDeviceId(deviceId);
    setConnectionError(null);

    try {
      console.log('🔗 Connecting to device:', deviceId);
      await systemControl.connectDevice(deviceId);
      console.log('✅ Device connected successfully');
      
      // 연결 성공은 useEffect에서 isConnected 상태 변화로 처리됨
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      console.error('🚨 Connection failed:', error);
      
      if (!errorMessage.includes('cancelled') && !errorMessage.includes('취소')) {
        setConnectionError(errorMessage);
        onError(`디바이스 연결에 실패했습니다: ${errorMessage}`);
      }
      
      setAutoConnectAttempted(prev => {
        const newSet = new Set(prev);
        newSet.delete(deviceId);
        return newSet;
      });
    } finally {
      setIsConnecting(false);
      setConnectingDeviceId(null);
    }
  }, [isConnecting, connectingDeviceId, systemControl, onError]);

  // 브라우저 호환성 체크
  if (browserInfo && !browserInfo.isSupported) {
    return (
      <div className="device-connection-screen bg-gray-50 p-4 flex flex-col">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            🔗 디바이스 연결
          </h1>
          <p className="text-gray-600">
            LINK BAND 디바이스를 연결해주세요.
          </p>
        </div>

        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700">
            <div className="font-medium mb-2">브라우저가 지원되지 않습니다</div>
            {browserInfo.isIOS ? (
              <div>
                <p className="mb-2">iOS Safari는 Web Bluetooth를 지원하지 않습니다.</p>
                <p className="font-medium">다음 브라우저를 사용해주세요:</p>
                <ul className="list-disc list-inside mt-1">
                  <li>Bluefy (추천, App Store에서 다운로드)</li>
                  <li>WebBLE (App Store에서 다운로드)</li>
                </ul>
              </div>
            ) : (
              <p>Chrome, Edge, 또는 Opera 브라우저를 사용해주세요.</p>
            )}
          </AlertDescription>
        </Alert>

        <div className="flex gap-4 mt-4">
          <Button onClick={onBack} variant="outline" className="flex-1">
            <ArrowLeft className="w-4 h-4 mr-2" />
            이전 단계
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="device-connection-screen bg-gray-50 p-4 flex flex-col">
      {/* 헤더 */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          🔗 디바이스 연결
        </h1>
        <p className="text-gray-600">
          LINK BAND 디바이스를 연결해주세요.
        </p>
      </div>

      {/* 브라우저별 안내 */}
      {!isConnected && browserInfo && (
        <Card className="bg-white border-gray-200 shadow-sm mb-4">
          <CardContent className="p-4">
            <div className={`${
              browserInfo.isIOS ? 'bg-blue-50 border-blue-200' :
              browserInfo.isAndroid ? 'bg-green-50 border-green-200' :
              'bg-purple-50 border-purple-200'
            } border rounded-lg p-4`}>
              <div className="flex items-start space-x-3">
                <div className={`${
                  browserInfo.isIOS ? 'text-blue-500' :
                  browserInfo.isAndroid ? 'text-green-500' :
                  'text-purple-500'
                }`}>
                  <Bluetooth className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-gray-800">
                    {browserInfo.isIOS ? '🍎 iOS 사용자 안내' :
                     browserInfo.isAndroid ? '🤖 Android 사용자 안내' :
                     '💻 데스크톱 사용자 안내'}
                  </h3>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium mb-2 text-gray-700">LINK BAND 디바이스 연결 준비:</p>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• LINK BAND 디바이스의 전원을 켜주세요</li>
                      <li>• 페어링 모드로 설정해주세요</li>
                      <li>• 디바이스를 가까이에 두세요</li>
                      <li>• {browserInfo.isAndroid ? 'Chrome 또는 Edge 브라우저' : 'Chrome, Edge, 또는 Opera 브라우저'}를 사용해주세요</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 시스템 초기화 중 */}
      {!systemReady && (
        <Alert className="mb-4 border-amber-200 bg-amber-50">
          <div className="flex items-center space-x-3">
            <div className="animate-spin w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full"></div>
            <div>
              <div className="font-medium text-amber-900">
                시스템 초기화 중...
              </div>
              <AlertDescription className="text-amber-800">
                LINK BAND 연결 준비를 하고 있습니다. 잠시만 기다려주세요.
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      {/* 연결 오류 */}
      {(scanError || connectionError) && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700">
            <div className="font-medium mb-1">연결 오류</div>
            <div className="text-sm">
              {scanError || connectionError}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* 연결된 디바이스 정보 */}
      {isConnected && realtimeDeviceInfo && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg mb-4">
          <CardHeader>
            <CardTitle className="text-lg text-gray-700 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              디바이스 연결 완료
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  <CircuitBoard className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {bluetoothService.getDeviceName() || 'LINK BAND'}
                  </h3>
                  <p className="text-sm text-green-700 font-medium">
                    실시간 데이터 수신 중
                  </p>
                </div>
              </div>
              <Badge className="bg-green-500 text-white shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                Connected
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 배터리 정보 */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Battery className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Battery</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {realtimeDeviceInfo.batteryLevel || '--'}%
                  </div>
                  <div className="text-sm text-gray-600">
                    상태 양호
                  </div>
                </CardContent>
              </Card>
              
              {/* 연결 시간 */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Connection</span>
                  </div>
                  <div className="text-lg font-bold text-gray-800">
                    {realtimeDeviceInfo.connectionStartTime ? 
                      new Date(realtimeDeviceInfo.connectionStartTime).toLocaleTimeString() : 
                      new Date().toLocaleTimeString()
                    }
                  </div>
                  <div className="text-sm text-gray-600">
                    Duration: {(() => {
                      const totalSeconds = Math.floor((realtimeDeviceInfo.connectionDuration || 0) / 1000);
                      const minutes = Math.floor(totalSeconds / 60);
                      const seconds = totalSeconds % 60;
                      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                    })()}
                  </div>
                </CardContent>
              </Card>
              
              {/* 샘플링 레이트 */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wifi className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Sampling</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">EEG:</span>
                      <span className="font-medium text-gray-800">{realtimeDeviceInfo.samplingRates?.eeg || 250}Hz</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">PPG:</span>
                      <span className="font-medium text-gray-800">{realtimeDeviceInfo.samplingRates?.ppg || 50}Hz</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ACC:</span>
                      <span className="font-medium text-gray-800">{realtimeDeviceInfo.samplingRates?.acc || 25}Hz</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 text-center">
              <p className="text-green-700 font-medium mb-2">
                ✅ 디바이스 연결이 완료되었습니다!
              </p>
              <p className="text-gray-600 text-sm">
                자동으로 다음 단계로 진행됩니다...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 사용 가능한 디바이스 목록 */}
      {!isConnected && (
        <Card className="bg-white border-gray-200 shadow-sm mb-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-gray-700">사용 가능한 디바이스 ({availableDevices.length})</CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600">자동 연결</span>
                  <Switch
                    checked={autoConnectionEnabled}
                    onCheckedChange={setAutoConnectionEnabled}
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleScan} 
                  disabled={isScanning || !systemReady}
                  className="border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  {isScanning ? (
                    <>
                      <div className="animate-spin w-4 h-4 mr-2 border border-blue-600 border-t-transparent rounded-full"></div>
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Scan Devices
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isScanning ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600 mb-2">디바이스를 검색하고 있습니다...</p>
                <p className="text-sm text-gray-500">
                  LINK BAND가 페어링 모드인지 확인해주세요
                </p>
              </div>
            ) : availableDevices.length > 0 ? (
              <div className="space-y-3">
                {availableDevices.map((device) => (
                  <Card key={device.id} className="bg-gray-50 border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                            <CircuitBoard className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">{device.name || 'LINK BAND'}</h4>
                            <p className="text-sm text-gray-600">{device.id}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {device.batteryLevel && (
                            <div className="flex items-center text-sm text-gray-600 mr-2">
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
                          
                          {connectingDeviceId === device.id ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                              <span className="text-sm font-medium text-blue-600">연결 중...</span>
                            </div>
                          ) : device.connected ? (
                            <Button disabled size="sm" className="bg-green-100 text-green-700">
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              연결됨
                            </Button>
                          ) : autoConnectionEnabled ? (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                              <span className="text-sm font-medium text-blue-600">자동 연결 대기</span>
                            </div>
                          ) : (
                            <Button 
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => handleConnect(device.id)}
                              disabled={isConnecting || !systemReady}
                            >
                              연결하기
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bluetooth className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">디바이스를 찾을 수 없습니다</p>
                <p className="text-sm text-gray-500 mb-4">
                  브라우저 페어링 창에서 LINK BAND를 선택하면 자동으로 연결됩니다
                </p>
                <Button 
                  variant="outline" 
                  onClick={handleScan} 
                  disabled={isScanning || !systemReady}
                  className="border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  {isScanning ? (
                    <>
                      <div className="animate-spin w-4 h-4 mr-2 border border-blue-600 border-t-transparent rounded-full"></div>
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      디바이스 스캔
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 액션 버튼들 */}
      <div className="flex gap-4 mt-4">
        <Button 
          onClick={onBack}
          variant="outline"
          className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          이전 단계
        </Button>
        
        {isConnected && (
          <Button 
            onClick={onConnectionSuccess}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            다음 단계
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
} 