import React, { useState, useEffect, useCallback } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Switch } from './ui/switch'
import { 
  Bluetooth, 
  Search, 
  Plus, 
  Settings, 
  Battery, 
  CircuitBoard,
  Wifi,
  WifiOff,
  MoreHorizontal,
  Trash2,
  Edit3,
  Clock,
  Database,
  ChevronDown,
  AlertTriangle
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'


import { useUIStore } from '../stores/uiStore'
import { useSystemStatus, useDeviceStatus, useStreamingStatus, useSystemActions, useScanStatus } from '../stores/systemStore'
import { 
  useRegisteredDevices, 
  useDeviceList, 
  useConnectedDevice, 
  useDeviceMonitoring, 
  useBatteryInfo,
  useSamplingRates,
  useDeviceActions,
  useDeviceStore 
} from '../stores/deviceStore'
import { DeviceDetailModal } from './DeviceManager/DeviceDetailModal'
import { DeviceStorageSettingsModal } from './DeviceManager/DeviceStorageSettingsModal'
import { bluetoothService } from '../utils/bluetoothService'
import BrowserCompatibilityCheck from './PWA/BrowserCompatibilityCheck'

export function DeviceManager() {
  // 브라우저 호환성 확인
  const [browserInfo, setBrowserInfo] = useState<{
    isSupported: boolean;
    isIOS: boolean;
    isAndroid: boolean;
    browserName: string;
    platform: string;
  } | null>(null)
  const { addNotification } = useUIStore()
  
  // 새로운 스토어 구조 사용
  const systemStatus = useSystemStatus()
  const deviceStatus = useDeviceStatus()
  const streamingStatus = useStreamingStatus()
  const scanStatus = useScanStatus()
  const systemActions = useSystemActions()
  
  // DeviceStore Hook들 사용
  const registeredDevices = useRegisteredDevices()
  const availableDevices = useDeviceList()
  const connectedDevice = useConnectedDevice() // 연결된 디바이스 정보
  const deviceMonitoring = useDeviceMonitoring()
  const batteryInfo = useBatteryInfo()
  const samplingRates = useSamplingRates()
  const deviceActions = useDeviceActions()
  
  // 모달 상태 관리
  const [selectedDevice, setSelectedDevice] = useState<any>(null)
  const [deviceDetailModalOpen, setDeviceDetailModalOpen] = useState(false)
  const [deviceType, setDeviceType] = useState<'registered' | 'connected'>('registered')
  
  // 등록 확인 모달 상태
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false)
  const [deviceToRegister, setDeviceToRegister] = useState<any>(null)
  const [deviceNickname, setDeviceNickname] = useState('')
  
  // 디바이스 이름 변경 모달 상태
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [deviceToRename, setDeviceToRename] = useState<any>(null)
  const [newDeviceNickname, setNewDeviceNickname] = useState('')
  
  // 디바이스 저장 설정 모달 상태
  const [storageSettingsModalOpen, setStorageSettingsModalOpen] = useState(false)
  const [deviceToConfigureStorage, setDeviceToConfigureStorage] = useState<any>(null)
  
  // 자동 등록 상태
  const [autoRegistrationEnabled, setAutoRegistrationEnabled] = useState(() => {
    const saved = localStorage.getItem('autoRegistrationEnabled');
    return saved ? JSON.parse(saved) : true;
  })

  // 자동 연결 상태
  const [autoConnectionEnabled, setAutoConnectionEnabled] = useState(() => {
    const saved = localStorage.getItem('autoConnectionEnabled');
    return saved ? JSON.parse(saved) : true;
  })
  
  // 필터링된 디바이스 목록 (검색 기능 제거)
  const filteredRegisteredDevices = registeredDevices
  const filteredAvailableDevices = availableDevices

  // 시스템 초기화 함수를 useCallback으로 메모이제이션
  const initializeSystem = useCallback(async () => {
    // 이미 초기화 중이거나 완료된 경우 중복 실행 방지
    if (systemStatus.systemStatus === 'initializing' || systemStatus.isInitialized) {
      return;
    }

    try {
      console.log('Initializing system...');
      await systemActions.initializeSystem();
      console.log('System initialized successfully');
    } catch (error) {
      console.error('System initialization failed:', error);
      addNotification({
        type: 'error',
        title: 'System Initialization Failed',
        message: error instanceof Error ? error.message : 'Failed to initialize system'
      });
    }
  }, [systemStatus.systemStatus, systemStatus.isInitialized, systemActions.initializeSystem, addNotification]);

  // 컴포넌트 마운트 시 시스템 초기화 (한 번만 실행)
  useEffect(() => {
    if (!systemStatus.isInitialized && systemStatus.systemStatus === 'idle') {
      initializeSystem();
    }
  }, [systemStatus.isInitialized, systemStatus.systemStatus, initializeSystem]);

  // 자동 등록 설정 저장
  useEffect(() => {
    localStorage.setItem('autoRegistrationEnabled', JSON.stringify(autoRegistrationEnabled));
  }, [autoRegistrationEnabled])

  // 자동 연결 설정 저장
  useEffect(() => {
    localStorage.setItem('autoConnectionEnabled', JSON.stringify(autoConnectionEnabled));
  }, [autoConnectionEnabled])

  // 자동 연결 상태 추적
  const [autoConnectAttempted, setAutoConnectAttempted] = useState(new Set<string>());
  
  // 연결 로딩 상태 추적
  const [connectingDeviceId, setConnectingDeviceId] = useState<string | null>(null);
  
  // 연결 해제 상태 추적
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // 자동 연결 기능: availableDevices에 새 디바이스가 추가되면 자동으로 연결
  useEffect(() => {
    const autoConnectDevices = async () => {
      // 자동 연결 조건 체크
      if (!autoConnectionEnabled || 
          deviceStatus.isConnected || 
          systemStatus.systemStatus === 'initializing' ||
          systemStatus.systemStatus === 'error' ||
          availableDevices.length === 0 ||
          connectingDeviceId !== null) {
        return;
      }

      // 새로운 디바이스만 자동 연결 시도
      const newDevices = availableDevices.filter(device => 
        !autoConnectAttempted.has(device.id)
      );

      if (newDevices.length === 0) {
        return;
      }

      // 첫 번째 새 디바이스에만 연결 시도
      const deviceToConnect = newDevices[0];
      
      try {
        console.log('Auto-connecting to device:', deviceToConnect.name);
        setAutoConnectAttempted(prev => new Set(prev).add(deviceToConnect.id));
        await handleConnect(deviceToConnect.id);
      } catch (error) {
        console.error('Auto-connect failed for device:', deviceToConnect.name, error);
        // 연결 실패한 디바이스는 자동 연결 시도 목록에서 제거하지 않음
        // 사용자가 수동으로 다시 시도할 수 있도록 함
      }
    };

    // 디바이스 목록이 변경되고 자동 연결이 활성화된 경우에만 실행
    if (availableDevices.length > 0 && autoConnectionEnabled) {
      // 약간의 지연을 두어 연속적인 호출 방지
      const timeoutId = setTimeout(autoConnectDevices, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [availableDevices, deviceStatus.isConnected, systemStatus.systemStatus, autoConnectionEnabled, connectingDeviceId]);

  // 연결이 해제되면 자동 연결 시도 기록 초기화
  useEffect(() => {
    if (!deviceStatus.isConnected) {
      setAutoConnectAttempted(new Set());
    }
  }, [deviceStatus.isConnected])

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

  // 연결된 디바이스의 실시간 정보 (BluetoothService에서 직접 조회)
  const [realtimeDeviceInfo, setRealtimeDeviceInfo] = useState<{
    batteryLevel: number;
    connectionDuration: number;
    connectionStartTime: number;
    samplingRates: { eeg: number; ppg: number; acc: number };
    batteryPrediction: {
      mode: 'charging' | 'discharging' | 'unknown';
      timeRemainingFormatted: string;
      ratePerMinute: number;
    };
  } | null>(null);
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (deviceStatus.isConnected && bluetoothService.isConnected()) {
      interval = setInterval(async () => {
        try {
          const batteryLevel = await bluetoothService.getBatteryLevel();
          const batteryPrediction = bluetoothService.getBatteryPrediction();
          
          setRealtimeDeviceInfo({
            batteryLevel,
            connectionDuration: bluetoothService.getConnectionDuration(),
            connectionStartTime: bluetoothService.getConnectionStartTime(),
            samplingRates: bluetoothService.getCurrentSamplingRates(),
            batteryPrediction: {
              mode: batteryPrediction.mode,
              timeRemainingFormatted: batteryPrediction.timeRemainingFormatted,
              ratePerMinute: batteryPrediction.ratePerMinute
            }
          });
        } catch (error) {
          console.error('Failed to get realtime device info:', error);
        }
      }, 1000); // 1초마다 업데이트
    } else {
      setRealtimeDeviceInfo(null);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [deviceStatus.isConnected]);

  const handleScan = async () => {
    if (!navigator.bluetooth) {
      if (browserInfo?.isIOS) {
        addNotification({
          type: 'warning',
          title: 'iOS 브라우저 안내',
          message: 'iOS에서는 Bluefy 또는 WebBLE 브라우저를 사용해주세요. App Store에서 다운로드 가능합니다.',
          autoHide: false
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Bluetooth Not Supported',
          message: 'Chrome 또는 Edge 브라우저를 사용해주세요.',
          autoHide: false
        });
      }
      return;
    }
    
    try {
      // SystemControlService를 사용하여 디바이스 스캔
      await systemActions.scanDevices();
      
      addNotification({
        type: 'success',
        title: 'Scan Complete',
        message: `Found ${scanStatus.availableDevices.length} devices`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Device scan failed';
      
      // 사용자가 취소한 경우 알림을 표시하지 않음
      if (!errorMessage.includes('cancelled') && !errorMessage.includes('취소')) {
        addNotification({
          type: 'error',
          title: 'Scan Failed',
          message: errorMessage
        });
      }
    }
  };

  const handleConnect = async (deviceId: string) => {
    // 이미 연결 중인 경우 중복 연결 방지
    if (connectingDeviceId === deviceId) {
      console.log('Connection already in progress for device:', deviceId);
      return;
    }

    // 이미 연결된 디바이스인 경우 연결 시도 방지
    if (deviceStatus.isConnected && deviceStatus.currentDeviceId === deviceId) {
      console.log('Device already connected:', deviceId);
      return;
    }

    try {
      // 연결 시작 시 로딩 상태 설정
      setConnectingDeviceId(deviceId);
      
      // 시스템이 초기화되지 않은 경우 대기
      if (systemStatus.systemStatus === 'initializing') {
        console.log('Waiting for system initialization...');
        // 최대 5초 대기
        let waitTime = 0;
        while (systemStatus.systemStatus === 'initializing' && waitTime < 5000) {
          await new Promise(resolve => setTimeout(resolve, 100));
          waitTime += 100;
        }
        
        if (systemStatus.systemStatus === 'initializing') {
          throw new Error('System initialization timeout');
        }
      }

      console.log('Connecting to device:', deviceId);
      await systemActions.connectDevice(deviceId);
      
      // 연결 성공 후 등록되지 않은 디바이스인지 확인
      const isRegistered = deviceActions.isDeviceRegistered(deviceId);
      const connectedDevice = availableDevices.find(device => device.id === deviceId);
      
      if (!isRegistered && connectedDevice) {
        if (autoRegistrationEnabled) {
          // 자동 등록이 활성화된 경우 바로 등록
          try {
            deviceActions.registerDevice(connectedDevice, connectedDevice.name);
            addNotification({
              type: 'success',
              title: 'Device Auto-Registered',
              message: `${connectedDevice.name}이(가) 자동으로 등록되었습니다.`
            });
          } catch (error) {
            console.error('Auto-registration failed:', error);
            addNotification({
              type: 'error',
              title: 'Auto-Registration Failed',
              message: error instanceof Error ? error.message : 'Failed to auto-register device'
            });
          }
        } else {
          // 자동 등록이 비활성화된 경우 등록 모달 표시
          setDeviceToRegister(connectedDevice);
          setDeviceNickname(connectedDevice.name || ''); // 기본값으로 디바이스 이름 설정
          setRegistrationModalOpen(true);
        }
      }
      
      addNotification({
        type: 'success',
        title: 'Device Connected',
        message: `Successfully connected to ${connectedDevice?.name || 'device'}`
      });
      
      console.log('Device connected successfully:', deviceId);
      
    } catch (error) {
      console.error('Connection failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to device';
      
      // 사용자가 취소한 경우 알림을 표시하지 않음
      if (!errorMessage.includes('cancelled') && !errorMessage.includes('취소')) {
        addNotification({
          type: 'error',
          title: 'Connection Failed',
          message: errorMessage
        });
      }
      
      // 연결 실패 시 자동 연결 시도 목록에서 제거 (다시 시도할 수 있도록)
      setAutoConnectAttempted(prev => {
        const newSet = new Set(prev);
        newSet.delete(deviceId);
        return newSet;
      });
      
      throw error; // 자동 연결 로직에서 에러를 처리할 수 있도록 다시 throw
    } finally {
      // 연결 시도 완료 후 로딩 상태 해제
      setConnectingDeviceId(null);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await systemActions.disconnectDevice();
      
      addNotification({
        type: 'info',
        title: 'Device Disconnected',
        message: 'Device has been disconnected'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Disconnection Failed',
        message: error instanceof Error ? error.message : 'Failed to disconnect device'
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  // 강제 연결 해제 핸들러
  const handleForceDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      console.log('🔧 강제 연결 해제 시도...');
      
      // 1. 시스템 상태 강제 초기화
      await systemActions.disconnectDevice().catch(e => {
        console.warn('일반 연결 해제 실패, 강제 진행:', e);
      });
      
      // 2. Bluetooth 캐시 강제 정리
      bluetoothService.clearDeviceCache();
      
      // 3. 추가 대기 시간
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addNotification({
        type: 'success',
        title: 'Force Disconnect Complete',
        message: '디바이스 연결이 강제로 해제되었습니다. 재연결이 가능합니다.'
      });
    } catch (error) {
      console.error('강제 연결 해제 실패:', error);
      addNotification({
        type: 'error',
        title: 'Force Disconnect Failed',
        message: '강제 연결 해제에 실패했습니다. 브라우저를 새로고침해주세요.'
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  // 등록 모달에서 등록하기 선택
  const handleConfirmRegistration = () => {
    if (!deviceToRegister) return;
    
    try {
      const nickname = deviceNickname.trim() !== deviceToRegister.name ? deviceNickname.trim() : undefined;
      deviceActions.registerDevice(deviceToRegister, nickname);
      
      addNotification({
        type: 'success',
        title: 'Device Registered',
        message: `${deviceToRegister.name} has been registered successfully`
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Registration Failed',
        message: error instanceof Error ? error.message : 'Failed to register device'
      });
    } finally {
      setRegistrationModalOpen(false);
      setDeviceToRegister(null);
      setDeviceNickname('');
    }
  };

  // 등록 모달에서 건너뛰기 선택
  const handleSkipRegistration = () => {
    setRegistrationModalOpen(false);
    setDeviceToRegister(null);
    setDeviceNickname('');
  };

  // 디바이스 해지 기능
  const handleUnregisterDevice = (deviceId: string) => {
    try {
      deviceActions.unregisterDevice(deviceId);
      addNotification({
        type: 'info',
        title: 'Device Unregistered',
        message: 'Device has been removed from registered devices'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Unregistration Failed',
        message: error instanceof Error ? error.message : 'Failed to unregister device'
      });
    }
  };

  const handleViewDeviceDetails = (device: any, type: 'registered' | 'connected') => {
    setSelectedDevice(device);
    setDeviceType(type);
    setDeviceDetailModalOpen(true);
  };

  // 디바이스 이름 변경 모달 열기
  const handleRenameDevice = (device: any) => {
    setDeviceToRename(device);
    setNewDeviceNickname(device.nickname || device.name || '');
    setRenameModalOpen(true);
  };

  // 디바이스 이름 변경 확인
  const handleConfirmRename = () => {
    if (!deviceToRename) return;
    
    try {
      const trimmedNickname = newDeviceNickname.trim();
      
      // 20자 제한 검증
      if (trimmedNickname.length > 20) {
        addNotification({
          type: 'error',
          title: 'Rename Failed',
          message: '디바이스 별명은 20자를 초과할 수 없습니다.'
        });
        return;
      }
      
      // 빈 문자열이거나 원래 이름과 같으면 기본 이름 사용
      const finalNickname = trimmedNickname === deviceToRename.name ? '' : trimmedNickname;
      
      deviceActions.renameDevice(deviceToRename.id, finalNickname);
      
      addNotification({
        type: 'success',
        title: 'Device Renamed',
        message: `디바이스 별명이 "${finalNickname || deviceToRename.name}"로 변경되었습니다.`
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Rename Failed',
        message: error instanceof Error ? error.message : 'Failed to rename device'
      });
    } finally {
      setRenameModalOpen(false);
      setDeviceToRename(null);
      setNewDeviceNickname('');
    }
  };

  // 디바이스 이름 변경 취소
  const handleCancelRename = () => {
    setRenameModalOpen(false);
    setDeviceToRename(null);
    setNewDeviceNickname('');
  }
  
  const handleConfigureStorage = (device: any) => {
    setDeviceToConfigureStorage(device)
    setStorageSettingsModalOpen(true)
  };

  // 브라우저 호환성 체크 - 지원되지 않는 브라우저인 경우 안내 표시
  if (browserInfo && !browserInfo.isSupported) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <BrowserCompatibilityCheck />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Device Manager</h1>
            <p className="text-neutral-600 dark:text-neutral-400">Manage your LINK BAND devices</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleScan} 
              disabled={scanStatus.isScanning || deviceStatus.isConnected}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {scanStatus.isScanning ? (
                <>
                  <div className="animate-spin w-4 h-4 mr-2 border border-white border-t-transparent rounded-full"></div>
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

        {/* 브라우저별 안내 */}
        {!deviceStatus.isConnected && browserInfo && (
          <div className={`${
            browserInfo.isIOS ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
            browserInfo.isAndroid ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
            'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
          } border rounded-lg p-4`}>
            <div className="flex items-start space-x-3">
              <div className={`${
                browserInfo.isIOS ? 'text-blue-600 dark:text-blue-400' :
                browserInfo.isAndroid ? 'text-green-600 dark:text-green-400' :
                'text-purple-600 dark:text-purple-400'
              }`}>
                <Bluetooth className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`font-medium mb-2 ${
                  browserInfo.isIOS ? 'text-blue-900 dark:text-blue-100' :
                  browserInfo.isAndroid ? 'text-green-900 dark:text-green-100' :
                  'text-purple-900 dark:text-purple-100'
                }`}>
                  {browserInfo.isIOS ? '🍎 iOS 사용자 안내' :
                   browserInfo.isAndroid ? '🤖 Android 사용자 안내' :
                   '💻 데스크톱 사용자 안내'}
                </h3>
                
                {browserInfo.isIOS ? (
                  <div className="space-y-2">
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                      iOS Safari는 Web Bluetooth를 지원하지 않습니다. 다음 브라우저를 사용해주세요:
                    </p>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• <strong>Bluefy</strong> - 추천 브라우저 (App Store에서 다운로드)</li>
                      <li>• <strong>WebBLE</strong> - 대안 브라우저 (App Store에서 다운로드)</li>
                    </ul>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      앱 다운로드 후 <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">sdk.linkband.store</code>에 접속하세요.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-medium mb-2">LINK BAND 디바이스 연결 준비:</p>
                    <ul className={`text-sm space-y-1 ${
                      browserInfo.isAndroid ? 'text-green-800 dark:text-green-200' :
                      'text-purple-800 dark:text-purple-200'
                    }`}>
                      <li>• LINK BAND 디바이스의 전원을 켜주세요</li>
                      <li>• 페어링 모드로 설정해주세요</li>
                      <li>• 디바이스를 가까이에 두세요</li>
                      <li>• {browserInfo.isAndroid ? 'Chrome 또는 Edge 브라우저' : 'Chrome, Edge, 또는 Opera 브라우저'}를 사용해주세요</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 연결 중 상태 표시 */}
        {systemStatus.systemStatus === 'initializing' && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin w-5 h-5 border-2 border-yellow-600 border-t-transparent rounded-full"></div>
              <div>
                <h3 className="font-medium text-yellow-900 dark:text-yellow-100">
                  디바이스 연결 중...
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  LINK BAND 디바이스와 연결을 시도하고 있습니다. 잠시만 기다려주세요.
                </p>
              </div>
            </div>
          </div>
        )}



        {/* 연결 오류 상태 표시 */}
        {systemStatus.systemError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="text-red-600 dark:text-red-400">
                <WifiOff className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-red-900 dark:text-red-100">
                  연결 실패
                </h3>
                <p className="text-sm text-red-800 dark:text-red-200 mb-2">
                  {systemStatus.systemError || '알 수 없는 오류가 발생했습니다'}
                </p>
                <div className="text-sm text-red-700 dark:text-red-300">
                  <p className="font-medium mb-1">해결 방법:</p>
                  <ul className="space-y-1">
                    <li>• 디바이스 전원을 다시 켜보세요</li>
                    <li>• 페어링 모드를 다시 활성화하세요</li>
                    <li>• 브라우저를 새로고침하고 다시 시도하세요</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Connected Device Details */}
        {deviceStatus.isConnected && realtimeDeviceInfo && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
                  <CircuitBoard className="w-6 h-6 text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                    {bluetoothService.getDeviceName() || 'LINK BAND'}
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    실시간 EEG 데이터 수신 중
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-500 text-white">
                  <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                  Live
                </Badge>
                <div className="flex items-center">
                  <Button 
                    variant="outline" 
                    className="text-red-600 border-red-300 hover:bg-red-50 rounded-r-none border-r-0"
                    onClick={handleDisconnect}
                    disabled={isDisconnecting}
                  >
                    {isDisconnecting ? (
                      <>
                        <div className="animate-spin w-4 h-4 mr-2 border border-red-600 border-t-transparent rounded-full"></div>
                        연결 해제 중...
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-4 h-4 mr-2" />
                        연결 해제
                      </>
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50 rounded-l-none px-2"
                        disabled={isDisconnecting}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={handleForceDisconnect}
                        className="text-red-600 focus:text-red-600"
                        disabled={isDisconnecting}
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        강제 연결 해제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 배터리 정보 */}
              <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-green-100 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <Battery className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Battery</span>
                </div>
                <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  {realtimeDeviceInfo?.batteryLevel || 0}%
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  {realtimeDeviceInfo?.batteryPrediction?.timeRemainingFormatted || 'Unknown'}
                </div>
                {realtimeDeviceInfo?.batteryPrediction?.mode !== 'unknown' && (
                  <div className="text-xs text-neutral-500 dark:text-neutral-500">
                    {realtimeDeviceInfo?.batteryPrediction?.mode === 'charging' ? '⚡ Charging' : '🔋 Discharging'} 
                    {' '}({realtimeDeviceInfo?.batteryPrediction?.ratePerMinute.toFixed(1)}%/min)
                  </div>
                )}
              </div>
              
              {/* 연결 시간 정보 */}
              <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Connection</span>
                </div>
                <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  {realtimeDeviceInfo?.connectionStartTime ? 
                    new Date(realtimeDeviceInfo.connectionStartTime).toLocaleTimeString() : 'N/A'
                  }
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  Duration: {realtimeDeviceInfo ? 
                    (() => {
                      const totalSeconds = Math.floor(realtimeDeviceInfo.connectionDuration / 1000);
                      const hours = Math.floor(totalSeconds / 3600);
                      const minutes = Math.floor((totalSeconds % 3600) / 60);
                      const seconds = totalSeconds % 60;
                      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                    })() : '00:00:00'
                  }
                </div>
              </div>
              
              {/* 샘플링 레이트 */}
              <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-purple-100 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <Wifi className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Sampling Rates</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">EEG:</span>
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">{realtimeDeviceInfo?.samplingRates?.eeg || 0}Hz</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">PPG:</span>
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">{realtimeDeviceInfo?.samplingRates?.ppg || 0}Hz</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">ACC:</span>
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">{realtimeDeviceInfo?.samplingRates?.acc || 0}Hz</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Available Devices */}
        <div className="border border-neutral-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-neutral-900 dark:text-neutral-100">Available Devices ({filteredAvailableDevices.length})</h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">자동 연결</span>
                <Switch
                  checked={autoConnectionEnabled}
                  onCheckedChange={setAutoConnectionEnabled}
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleScan} disabled={scanStatus.isScanning} className="border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300">
                {scanStatus.isScanning ? (
                  <>
                    <div className="animate-spin w-4 h-4 mr-2 border border-neutral-400 border-t-transparent rounded-full"></div>
                    Scanning...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Refresh
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {scanStatus.isScanning ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-neutral-300 border-t-blue-600 rounded-full mx-auto mb-4"></div>
              <p className="text-neutral-600 dark:text-neutral-400 mb-2">Scanning for devices...</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Make sure your LINK BAND is in pairing mode
              </p>
            </div>
          ) : filteredAvailableDevices.length > 0 ? (
            <div className="space-y-3">
              {filteredAvailableDevices.map((device) => (
                <div key={device.id} className="p-4 bg-transparent rounded-lg border border-neutral-800 dark:border-neutral-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-neutral-300 dark:bg-neutral-600 rounded-lg flex items-center justify-center">
                        <CircuitBoard className="w-6 h-6 text-neutral-600 dark:text-neutral-300" />
                      </div>
                      <div>
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100">{device.name}</h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">{device.id}</p>

                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* 연결된 디바이스인지 확인하여 Badge 표시 */}
                      {deviceStatus.isConnected && deviceStatus.currentDeviceId === device.id ? (
                        <Badge className="bg-green-500 text-white">Connected</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-neutral-400 dark:bg-neutral-500 text-neutral-900 dark:text-neutral-100">Available</Badge>
                      )}
                      

                      
                      {/* 자동 연결 상태 표시 */}
                      {deviceStatus.isConnected && deviceStatus.currentDeviceId === device.id ? (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-green-600">연결됨</span>
                        </div>
                      ) : connectingDeviceId === device.id ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                          <span className="text-sm font-medium text-blue-600">연결 중...</span>
                        </div>
                      ) : autoConnectionEnabled ? (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-blue-600">자동 연결 대기</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => handleConnect(device.id)}
                            disabled={connectingDeviceId === device.id}
                          >
                            {connectingDeviceId === device.id ? (
                              <>
                                <div className="animate-spin w-3 h-3 mr-2 border border-white border-t-transparent rounded-full"></div>
                                연결 중...
                              </>
                            ) : (
                              'Connect'
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bluetooth className="w-12 h-12 text-neutral-500 dark:text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-600 dark:text-neutral-400 mb-2">No devices found</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                브라우저 페어링 창에서 LINK BAND를 선택하면 자동으로 연결됩니다
              </p>
              <Button variant="outline" onClick={handleScan} disabled={scanStatus.isScanning} className="border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300">
                {scanStatus.isScanning ? (
                  <>
                    <div className="animate-spin w-4 h-4 mr-2 border border-neutral-400 border-t-transparent rounded-full"></div>
                    Scanning...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Scan for Devices
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Registered Devices */}
        <div className="border border-neutral-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-neutral-900 dark:text-neutral-100">Registered Devices ({filteredRegisteredDevices.length})</h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">자동 등록</span>
                <Switch
                  checked={autoRegistrationEnabled}
                  onCheckedChange={setAutoRegistrationEnabled}
                />
              </div>
              <Badge variant="outline" className="text-blue-600 border-blue-600 bg-blue-50 dark:bg-blue-900/20">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                Registered
              </Badge>
            </div>
          </div>
          
          {filteredRegisteredDevices.length > 0 ? (
            <div className="space-y-3">
              {filteredRegisteredDevices.map((device) => (
                <div key={device.id} className="p-4 bg-neutral-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-neutral-300 dark:bg-neutral-600 rounded-lg flex items-center justify-center">
                        <CircuitBoard className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
                      </div>
                      <div>
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100">{device.name}</h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">{device.nickname || device.id}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1">
                            <CircuitBoard className="w-3 h-3 text-neutral-500 dark:text-neutral-400" />
                            <span className="text-xs text-neutral-500 dark:text-neutral-400">연결 {device.connectionCount}회</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-neutral-500 dark:text-neutral-400" />
                            <span className="text-xs text-neutral-500 dark:text-neutral-400">
                              Last: {device.lastConnectedAt ? new Date(device.lastConnectedAt).toLocaleDateString() : 'Never'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        {/* 연결된 디바이스인지 확인 */}
                        {deviceStatus.isConnected && deviceStatus.currentDeviceId === device.id ? (
                          <Badge className="mb-2 bg-green-500 text-white">Connected</Badge>
                        ) : (
                          <Badge className="mb-2 bg-white text-neutral-700">Registered</Badge>
                        )}
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">등록일: {new Date(device.registeredAt).toLocaleDateString()}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">ID: {device.id}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* 연결된 디바이스인지 확인하여 버튼 상태 결정 */}
                        {deviceStatus.isConnected && deviceStatus.currentDeviceId === device.id ? (
                          <Button 
                            disabled
                            className="bg-green-100 text-green-700 border-green-300 cursor-not-allowed"
                          >
                            Connected
                          </Button>
                        ) : (
                          <Button 
                            className="bg-white text-black border-neutral-300 hover:bg-neutral-50"
                            onClick={() => handleConnect(device.id)}
                            disabled={systemStatus.systemStatus === 'initializing' || connectingDeviceId === device.id}
                          >
                            {connectingDeviceId === device.id ? (
                              <>
                                <div className="animate-spin w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full"></div>
                                연결 중...
                              </>
                            ) : systemStatus.systemStatus === 'initializing' ? (
                              'Connecting...'
                            ) : (
                              'Connect'
                            )}
                          </Button>
                        )}
                        

                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            align="end"
                            className="bg-neutral-800/95 dark:bg-neutral-800/95 backdrop-blur-md border-neutral-700 dark:border-neutral-700"
                          >
                            <DropdownMenuItem 
                              onClick={() => handleViewDeviceDetails(device, 'registered')}
                              className="text-neutral-100 dark:text-neutral-100 hover:bg-neutral-700 dark:hover:bg-neutral-700 focus:bg-neutral-700 dark:focus:bg-neutral-700"
                            >
                              <Settings className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleRenameDevice(device)}
                              className="text-neutral-100 dark:text-neutral-100 hover:bg-neutral-700 dark:hover:bg-neutral-700 focus:bg-neutral-700 dark:focus:bg-neutral-700"
                            >
                              <Edit3 className="w-4 h-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleConfigureStorage(device)}
                              className="text-neutral-100 dark:text-neutral-100 hover:bg-neutral-700 dark:hover:bg-neutral-700 focus:bg-neutral-700 dark:focus:bg-neutral-700"
                            >
                              <Database className="w-4 h-4 mr-2" />
                              Storage Settings
                            </DropdownMenuItem>
                            {/* 연결되지 않은 경우에만 Unregister 메뉴 표시 */}
                            {!(deviceStatus.isConnected && deviceStatus.currentDeviceId === device.id) && (
                              <DropdownMenuItem 
                                onClick={() => handleUnregisterDevice(device.id)}
                                className="text-red-400 dark:text-red-400 hover:bg-red-900/20 dark:hover:bg-red-900/20 focus:bg-red-900/20 dark:focus:bg-red-900/20"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Unregister
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CircuitBoard className="w-12 h-12 text-neutral-500 dark:text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-600 dark:text-neutral-400 mb-2">No registered devices</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                디바이스를 스캔하여 연결하면 자동으로 등록됩니다
              </p>
            </div>
          )}
        </div>

        {/* Device Detail Modal */}
        <DeviceDetailModal
          device={selectedDevice}
          deviceType={deviceType}
          isOpen={deviceDetailModalOpen}
          onClose={() => {
            setDeviceDetailModalOpen(false);
            setSelectedDevice(null);
          }}
        />

        {/* Registration Confirmation Modal - Floating over Device Manager */}
        {registrationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop with blur */}
            <div 
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={handleSkipRegistration}
            />
            
            {/* Modal Content */}
            <div className="relative bg-white dark:bg-neutral-900 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-800 w-full max-w-md mx-4">
              {/* Header */}
              <div className="flex items-center gap-3 p-6 border-b border-neutral-200 dark:border-neutral-800">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <CircuitBoard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    디바이스를 등록해보세요
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    다음 연결시 더 편리한 연결이 제공됩니다
                  </p>
                </div>
              </div>
              
              {/* Body */}
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <p className="text-neutral-700 dark:text-neutral-300 mb-2">
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {deviceToRegister?.name}
                    </span>을(를) 등록하시겠습니까?
                  </p>
                </div>
                
                                 {/* Nickname Input */}
                 <div className="space-y-2">
                   <label htmlFor="device-nickname" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                     디바이스 별명 (선택사항)
                   </label>
                  <Input
                    id="device-nickname"
                    type="text"
                    value={deviceNickname}
                    onChange={(e) => setDeviceNickname(e.target.value)}
                    placeholder="디바이스 별명을 입력하세요"
                    className="w-full bg-neutral-700 dark:bg-neutral-700 text-white dark:text-white border-neutral-600 dark:border-neutral-600 placeholder:text-neutral-400 dark:placeholder:text-neutral-400 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    별명을 설정하면 디바이스 목록에서 쉽게 구분할 수 있습니다
                  </p>
                </div>
              </div>
              
              {/* Footer */}
              <div className="flex gap-3 p-6 border-t border-neutral-200 dark:border-neutral-800">
                <Button
                  variant="outline"
                  onClick={handleSkipRegistration}
                  className="flex-1"
                >
                  건너뛰기
                </Button>
                <Button
                  onClick={handleConfirmRegistration}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  등록하기
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Device Rename Modal - Floating over Device Manager */}
        {renameModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop with blur */}
            <div 
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={handleCancelRename}
            />
            
            {/* Modal Content */}
            <div className="relative bg-white dark:bg-neutral-900 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-800 w-full max-w-md mx-4">
              {/* Header */}
              <div className="flex items-center gap-3 p-6 border-b border-neutral-200 dark:border-neutral-800">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Edit3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    디바이스 별명 변경
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    디바이스를 쉽게 구분할 수 있도록 별명을 설정하세요
                  </p>
                </div>
              </div>
              
              {/* Body */}
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <p className="text-neutral-700 dark:text-neutral-300 mb-4">
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {deviceToRename?.name}
                    </span>의 별명을 변경하시겠습니까?
                  </p>
                </div>
                
                {/* Nickname Input */}
                <div className="space-y-2">
                  <label htmlFor="rename-device-nickname" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    디바이스 별명 (최대 20자)
                  </label>
                  <Input
                    id="rename-device-nickname"
                    type="text"
                    value={newDeviceNickname}
                    onChange={(e) => setNewDeviceNickname(e.target.value)}
                    placeholder="디바이스 별명을 입력하세요"
                    maxLength={20}
                    className="w-full bg-neutral-700 dark:bg-neutral-700 text-white dark:text-white border-neutral-600 dark:border-neutral-600 placeholder:text-neutral-400 dark:placeholder:text-neutral-400 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      빈 칸으로 두면 기본 이름이 사용됩니다
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {newDeviceNickname.length}/20
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="flex gap-3 p-6 border-t border-neutral-200 dark:border-neutral-800">
                <Button
                  variant="outline"
                  onClick={handleCancelRename}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={handleConfirmRename}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  수정
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Device Storage Settings Modal */}
        <DeviceStorageSettingsModal
          open={storageSettingsModalOpen}
          onOpenChange={setStorageSettingsModalOpen}
          deviceId={deviceToConfigureStorage?.id || ''}
          deviceName={deviceToConfigureStorage?.nickname || deviceToConfigureStorage?.name || ''}
        />
      </div>
    </div>
  )
}