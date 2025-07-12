import React, { useState, useEffect } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useIsConnected, useCurrentDevice, useBatteryInfo, useIsScanning, useDeviceList, useDeviceStore } from '../../stores/deviceStore';
import { useStorageStore } from '../../stores/storageStore';
import { useConnectionState, useRecordingState } from '../../stores/sensorDataStore';
import { useSystemStatus, useDeviceStatus, useStreamingStatus, useRecordingStatus, useSensorContactStatus } from '../../stores/systemStore';
import { useRawDataStore } from '../../stores/rawDataStore';
import { useEEGSQIData, usePPGSQIData, useEEGAnalysis, usePPGAnalysis } from '../../stores/processedDataStore';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Bluetooth, 
  Activity, 
  Database, 
  Zap, 
  Battery,
  WifiOff,
  Wifi,
  Eye,
  Settings,
  Scan,
  Play,
  Square,
  FolderOpen,
  Download,
  Upload,
  HardDrive,
  Loader2
} from 'lucide-react';
import { cn } from '../ui/utils';
import VisualizerPreviewCard from './VisualizerPreview/VisualizerPreviewCard';
import { bluetoothService } from '../../utils/bluetoothService';
import { toast } from 'sonner';

export default function Dashboard() {
  const { setActiveMenu } = useUIStore();
  
  // StatusBar와 동일한 데이터 소스 사용
  const { isInitialized } = useSystemStatus();
  const { isConnected } = useDeviceStatus();
  const { isStreaming } = useStreamingStatus();
  const { isRecording } = useRecordingStatus();
  const { isSensorContacted } = useSensorContactStatus();
  
  // 저장소 상태
  const { currentSession, storageStats } = useStorageStore();
  
  // PPG 프로세싱 데이터 버퍼 카운트 (StatusBar와 동일한 데이터 소스)
  const dataStats = useRawDataStore(state => state.dataStats);
  
  // DeviceStore에서 샘플링 레이트 가져오기
  const connectedDevice = useDeviceStore(state => state.connectedDevice);
  const samplingRates = connectedDevice?.samplingRates || null;
  
  // 기존 device store hooks (스캔 및 연결 기능용)
  const currentDevice = useCurrentDevice();
  const batteryInfo = useBatteryInfo();
  const isScanning = useIsScanning();
  const deviceList = useDeviceList();
  const deviceStore = useDeviceStore();

  // 스캔된 디바이스 선택을 위한 state
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  
  // 실시간 배터리 정보
  const [realtimeBatteryLevel, setRealtimeBatteryLevel] = useState<number>(0);
  
  // 실시간 레코딩 시간 계산
  const [recordingDuration, setRecordingDuration] = useState<string>('00:00:00');
  
  // SQI 데이터 (80% 이상 조건 확인용)
  const eegSQIData = useEEGSQIData();
  const ppgSQIData = usePPGSQIData();
  const eegAnalysis = useEEGAnalysis();
  const ppgAnalysis = usePPGAnalysis();
  
  // Moving Average 관련 상태
  const [eegMovingAverageHistory, setEEGMovingAverageHistory] = useState<{
    arousal: number[];
    valence: number[];
    focus: number[];
  }>({
    arousal: [],
    valence: [],
    focus: []
  });
  
  const [ppgMovingAverageHistory, setPPGMovingAverageHistory] = useState<{
    heartRate: number[];
    rmssd: number[];
    sdnn: number[];
    pnn50: number[];
    stressIndex: number[];
    spo2: number[];
  }>({
    heartRate: [],
    rmssd: [],
    sdnn: [],
    pnn50: [],
    stressIndex: [],
    spo2: []
  });
  
  const [stabilizedEEGValues, setStabilizedEEGValues] = useState<{
    arousal: number | null;
    valence: number | null;
    focus: number | null;
  }>({
    arousal: null,
    valence: null,
    focus: null
  });
  
  const [stabilizedPPGValues, setStabilizedPPGValues] = useState<{
    heartRate: number | null;
    rmssd: number | null;
    sdnn: number | null;
    pnn50: number | null;
    stressIndex: number | null;
    spo2: number | null;
  }>({
    heartRate: null,
    rmssd: null,
    sdnn: null,
    pnn50: null,
    stressIndex: null,
    spo2: null
  });
  
  // 실시간 레코딩 시간 계산 (StatusBar와 동일한 로직)
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

  // 배터리 레벨 업데이트 (StatusBar와 동일한 로직)
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

  // SQI 기반 EEG Moving Average 업데이트
  useEffect(() => {
    if (!eegAnalysis?.indices || !eegSQIData) return;
    
    // 최신 SQI 값 확인 (80% 이상인지 체크)
    const latestCh1SQI = eegSQIData.ch1SQI?.[eegSQIData.ch1SQI.length - 1]?.value || 0;
    const latestCh2SQI = eegSQIData.ch2SQI?.[eegSQIData.ch2SQI.length - 1]?.value || 0;
    const averageSQI = (latestCh1SQI + latestCh2SQI) / 2;
    
    console.log('🔧 EEG SQI 체크:', {
      ch1SQI: latestCh1SQI,
      ch2SQI: latestCh2SQI,
      averageSQI: averageSQI,
      threshold: 80,
      isQualityGood: averageSQI >= 80
    });
    
    // SQI가 80% 이상일 때만 업데이트
    if (averageSQI >= 80) {
      const { focusIndex, relaxationIndex, emotionalStability } = eegAnalysis.indices;
      
      setEEGMovingAverageHistory(prev => {
        const maxHistory = 120; // 최대 120개 샘플 유지
        
        const newHistory = {
          arousal: [...prev.arousal, relaxationIndex].slice(-maxHistory),
          valence: [...prev.valence, emotionalStability].slice(-maxHistory),
          focus: [...prev.focus, focusIndex].slice(-maxHistory)
        };
        
        console.log('🔧 EEG Moving Average 업데이트:', {
          newValues: { arousal: relaxationIndex, valence: emotionalStability, focus: focusIndex },
          historyLengths: {
            arousal: newHistory.arousal.length,
            valence: newHistory.valence.length,
            focus: newHistory.focus.length
          }
        });
        
        return newHistory;
      });
    }
  }, [eegAnalysis, eegSQIData]);
  
  // SQI 기반 PPG Moving Average 업데이트
  useEffect(() => {
    if (!ppgAnalysis?.indices || !ppgSQIData) return;
    
    // 최신 Overall SQI 값 확인 (80% 이상인지 체크)
    const latestOverallSQI = ppgSQIData.overallSQI?.[ppgSQIData.overallSQI.length - 1]?.value || 0;
    
    console.log('🔧 PPG SQI 체크:', {
      overallSQI: latestOverallSQI,
      threshold: 80,
      isQualityGood: latestOverallSQI >= 80
    });
    
    // SQI가 80% 이상일 때만 업데이트
    if (latestOverallSQI >= 80) {
      const { heartRate, rmssd, sdnn, pnn50, stressIndex, spo2 } = ppgAnalysis.indices;
      
      setPPGMovingAverageHistory(prev => {
        const maxHistory = 120; // 최대 120개 샘플 유지
        
        const newHistory = {
          heartRate: [...prev.heartRate, heartRate].slice(-maxHistory),
          rmssd: [...prev.rmssd, rmssd].slice(-maxHistory),
          sdnn: [...prev.sdnn, sdnn].slice(-maxHistory),
          pnn50: [...prev.pnn50, pnn50].slice(-maxHistory),
          stressIndex: [...prev.stressIndex, stressIndex].slice(-maxHistory),
          spo2: [...prev.spo2, spo2].slice(-maxHistory)
        };
        
        console.log('🔧 PPG Moving Average 업데이트:', {
          newValues: { heartRate, rmssd, sdnn, pnn50, stressIndex, spo2 },
          historyLengths: {
            heartRate: newHistory.heartRate.length,
            rmssd: newHistory.rmssd.length,
            sdnn: newHistory.sdnn.length,
            pnn50: newHistory.pnn50.length,
            stressIndex: newHistory.stressIndex.length,
            spo2: newHistory.spo2.length
          }
        });
        
        return newHistory;
      });
    }
  }, [ppgAnalysis, ppgSQIData]);
  
  // EEG Moving Average 계산
  useEffect(() => {
    setStabilizedEEGValues({
      arousal: eegMovingAverageHistory.arousal.length > 0 
        ? eegMovingAverageHistory.arousal.reduce((sum, val) => sum + val, 0) / eegMovingAverageHistory.arousal.length 
        : null,
      valence: eegMovingAverageHistory.valence.length > 0 
        ? eegMovingAverageHistory.valence.reduce((sum, val) => sum + val, 0) / eegMovingAverageHistory.valence.length 
        : null,
      focus: eegMovingAverageHistory.focus.length > 0 
        ? eegMovingAverageHistory.focus.reduce((sum, val) => sum + val, 0) / eegMovingAverageHistory.focus.length 
        : null
    });
  }, [eegMovingAverageHistory]);
  
  // PPG Moving Average 계산
  useEffect(() => {
    setStabilizedPPGValues({
      heartRate: ppgMovingAverageHistory.heartRate.length > 0 
        ? ppgMovingAverageHistory.heartRate.reduce((sum, val) => sum + val, 0) / ppgMovingAverageHistory.heartRate.length 
        : null,
      rmssd: ppgMovingAverageHistory.rmssd.length > 0 
        ? ppgMovingAverageHistory.rmssd.reduce((sum, val) => sum + val, 0) / ppgMovingAverageHistory.rmssd.length 
        : null,
      sdnn: ppgMovingAverageHistory.sdnn.length > 0 
        ? ppgMovingAverageHistory.sdnn.reduce((sum, val) => sum + val, 0) / ppgMovingAverageHistory.sdnn.length 
        : null,
      pnn50: ppgMovingAverageHistory.pnn50.length > 0 
        ? ppgMovingAverageHistory.pnn50.reduce((sum, val) => sum + val, 0) / ppgMovingAverageHistory.pnn50.length 
        : null,
      stressIndex: ppgMovingAverageHistory.stressIndex.length > 0 
        ? ppgMovingAverageHistory.stressIndex.reduce((sum, val) => sum + val, 0) / ppgMovingAverageHistory.stressIndex.length 
        : null,
      spo2: ppgMovingAverageHistory.spo2.length > 0 
        ? ppgMovingAverageHistory.spo2.reduce((sum, val) => sum + val, 0) / ppgMovingAverageHistory.spo2.length 
        : null
    });
  }, [ppgMovingAverageHistory]);

  // 포맷팅 함수들 (StatusBar와 동일)
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const handleNavigateToLinkBand = () => {
    setActiveMenu('linkband');
  };

  const handleOpenVisualizer = () => {
    setActiveMenu('visualizer');
  };

  const handleOpenDataCenter = () => {
    setActiveMenu('datacenter');
  };

  const handleChangeStorage = () => {
    setActiveMenu('settings');
  };

  // 디바이스 스캔 시작
  const handleStartScan = async () => {
    try {
      deviceStore.setScanning(true);
      toast.info('디바이스 스캔을 시작합니다...');
      
      const devices = await bluetoothService.scan();
      deviceStore.setAvailableDevices(devices);
      
      if (devices.length > 0) {
        toast.success(`${devices.length}개의 디바이스를 발견했습니다.`);
        // 첫 번째 디바이스를 자동 선택
        setSelectedDevice(devices[0].id);
      } else {
        toast.warning('근처에서 LINK BAND 디바이스를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('Scan failed:', error);
      toast.error('디바이스 스캔에 실패했습니다.');
    } finally {
      deviceStore.setScanning(false);
    }
  };

  // 디바이스 연결
  const handleConnect = async () => {
    if (!selectedDevice) {
      toast.error('연결할 디바이스를 선택해주세요.');
      return;
    }

    const device = deviceList.find(d => d.id === selectedDevice);
    if (!device) {
      toast.error('선택한 디바이스를 찾을 수 없습니다.');
      return;
    }

    try {
      toast.info('디바이스에 연결 중입니다...');
      deviceStore.startDeviceConnection(device);
      
      await bluetoothService.connect(device.id);
      toast.success(`${device.name}에 연결되었습니다.`);
    } catch (error) {
      console.error('Connection failed:', error);
      toast.error('디바이스 연결에 실패했습니다.');
    }
  };

  // 디바이스 연결 해제
  const handleDisconnect = async () => {
    try {
      toast.info('디바이스 연결을 해제합니다...');
      await bluetoothService.disconnect();
      deviceStore.disconnectDevice();
      toast.success('디바이스 연결이 해제되었습니다.');
    } catch (error) {
      console.error('Disconnect failed:', error);
      toast.error('연결 해제에 실패했습니다.');
    }
  };

  // 레코딩 시작
  const handleStartRecording = () => {
    // TODO: 실제 레코딩 시작 기능 구현
    console.log('레코딩 시작');
    toast.info('레코딩을 시작합니다.');
  };

  // 레코딩 종료
  const handleStopRecording = () => {
    // TODO: 실제 레코딩 종료 기능 구현
    console.log('레코딩 종료');
    toast.info('레코딩을 종료합니다.');
  };

  return (
    <div className="p-6 space-y-6">
      {/* 상단 타이틀 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-medium text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">시스템 상태 및 실시간 모니터링</p>
        </div>
      </div>



      {/* 메인 카드들 - 1x4 그리드 (세로 배치) */}
      <div className="space-y-6">
        {/* 1. LINK BAND 연결 및 착용 */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bluetooth className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-medium">LINK BAND 연결 및 착용</h2>
          </div>
          
          <div className="space-y-6">
            {/* 상단 - LINK BAND 상태 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">LINK BAND 상태</h3>
              
              <div className="grid grid-cols-3 gap-4">
                {/* 배터리 정보 */}
                <Card className="p-4 bg-neutral-800 border-gray-300">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Battery className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-neutral-300">Battery</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {isConnected && realtimeBatteryLevel > 0 ? `${realtimeBatteryLevel}%` : '-'}
                    </div>
                    <div className="text-sm text-neutral-400">
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </div>
                  </div>
                </Card>

                {/* 연결 시간 정보 */}
                <Card className="p-4 bg-neutral-800 border-gray-300">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Bluetooth className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-neutral-300">Connection</span>
                    </div>
                    <div className="text-lg font-bold text-white">
                      {isConnected ? new Date().toLocaleTimeString() : '연결 없음'}
                    </div>
                    <div className="text-sm text-neutral-400">
                      {isConnected ? `Duration: ${recordingDuration}` : '디바이스를 연결해주세요'}
                    </div>
                  </div>
                </Card>

                {/* 샘플링 레이트 정보 */}
                <Card className="p-4 bg-neutral-800 border-gray-300">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-purple-500" />
                      <span className="text-sm text-neutral-300">Sampling Rates</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm text-neutral-400">EEG:</span>
                        <span className="text-sm text-white font-medium">
                          {isConnected && samplingRates?.eeg ? samplingRates.eeg.toFixed(1) : '-'} Hz
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-neutral-400">PPG:</span>
                        <span className="text-sm text-white font-medium">
                          {isConnected && samplingRates?.ppg ? samplingRates.ppg.toFixed(1) : '-'} Hz
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-neutral-400">ACC:</span>
                        <span className="text-sm text-white font-medium">
                          {isConnected && samplingRates?.acc ? samplingRates.acc.toFixed(1) : '-'} Hz
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
            
            {/* 하단 - 버튼 */}
            <div className="space-y-4">
              <div className="flex justify-center">
                <Button 
                  className="w-full h-16 text-lg font-semibold justify-center gap-4 bg-blue-600 text-white hover:bg-blue-700"
                  onClick={handleNavigateToLinkBand}
                >
                  <Bluetooth className="w-6 h-6" />
                  LINK BAND로 이동
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* 2. 데이터 시각화 및 확인 */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-medium">데이터 시각화 및 확인</h2>
          </div>
          
          <VisualizerPreviewCard onOpenVisualizer={handleOpenVisualizer} />
        </Card>

        {/* 3. 데이터 저장소 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-medium">데이터 저장소</h2>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs gap-2"
              onClick={handleChangeStorage}
            >
              <Settings className="w-3 h-3" />
              저장소 설정
            </Button>
          </div>
          
          <div className="space-y-6">
            {/* 상단 - 저장소 상태 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">저장소 상태</h3>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">저장소 준비 완료</span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400">데이터 저장이 가능합니다.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Used Storage */}
                <Card className="p-4 bg-neutral-800 border-gray-300">
                  <div className="space-y-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Database className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-neutral-300">Used</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {storageStats.used}
                    </div>
                  </div>
                </Card>

                {/* Available Storage */}
                <Card className="p-4 bg-neutral-800 border-gray-300">
                  <div className="space-y-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <HardDrive className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-neutral-300">Available</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {storageStats.available}
                    </div>
                  </div>
                </Card>

                {/* Sessions */}
                <Card className="p-4 bg-neutral-800 border-gray-300">
                  <div className="space-y-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Activity className="w-4 h-4 text-orange-500" />
                      <span className="text-sm text-neutral-300">Sessions</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {storageStats.sessions}
                    </div>
                  </div>
                </Card>

                {/* Total Storage */}
                <Card className="p-4 bg-neutral-800 border-gray-300">
                  <div className="space-y-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Database className="w-4 h-4 text-purple-500" />
                      <span className="text-sm text-neutral-300">Total Storage</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {storageStats.totalSize}
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* 하단 - 버튼 */}
            <div className="space-y-4">
              <div className="flex justify-center">
                <Button 
                  className="w-full h-16 text-lg font-semibold justify-center gap-4 bg-blue-600 text-white hover:bg-blue-700"
                  onClick={handleOpenDataCenter}
                >
                  <FolderOpen className="w-6 h-6" />
                  Data Center로 이동
                </Button>
              </div>
            </div>
          </div>
        </Card>


      </div>
    </div>
  );
}

 