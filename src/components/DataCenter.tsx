import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { 
  Search, 
  Filter, 
  Download, 
  Database, 
  HardDrive, 
  Trash2, 
  Calendar,
  Clock,
  FileText,
  Play,
  Square,
  Pause,
  FolderOpen,
  Settings,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  ArrowUpDown,
  Copy,
  ExternalLink,
  Smartphone
} from 'lucide-react'
import { cn } from './ui/utils'
import { toast } from 'sonner'
import { joinPath, formatPathForSystem, detectOS } from '../utils/pathUtils'
// Phase 4: 새로운 스토어 구조 사용
import { 
  useSystemStatus, 
  useDeviceStatus, 
  useStreamingStatus, 
  useRecordingStatus,
  useSystemActions 
} from '../stores/systemStore'
import { useSensorDataStore } from '../stores/sensorDataStore'
import { useConnectedDevice, useDeviceMonitoring, useSamplingRates } from '../stores/deviceStore'
import { bluetoothService } from '../utils/bluetoothService'
// 스트리밍 저장소 시스템 통합
import { useStorageStore, SessionInfo } from '../stores/storageStore'
import { StreamingSessionConfig } from '../services/StreamingStorageService'
import { StorageSetupModal } from './DataCenter/StorageSetupModal'
import { ExportSessionModal } from './DataCenter/ExportSessionModal'
import { useSettingsStore } from '../stores/settingsStore'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Checkbox } from './ui/checkbox'
import { Alert, AlertDescription } from './ui/alert'
// 저장소 자동 복원 Hook
import { useStorageAutoRestore } from '../hooks/useStorageAutoRestore'
// 🔧 분석 지표 서비스 추가
import { AnalysisMetricsService } from '../services/AnalysisMetricsService'
// 🔧 처리된 데이터 스토어 추가
import { useProcessedDataStore } from '../stores/processedDataStore'

export function DataCenter() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  // selectedDevice 제거 - 실제 연결된 디바이스 정보 사용
  const [saveOptions, setSaveOptions] = useState({
    eegRaw: true,
    ppgRaw: true,
    accRaw: true,
    // 🔧 processed 데이터 타입 제거 - 복잡성으로 인해 제외
    // eegProcessed: false,
    // ppgProcessed: false,
    // accProcessed: false,
    // 🔧 분석 지표 데이터 타입만 유지
    eegAnalysisMetrics: true,
    ppgAnalysisMetrics: true,
    accAnalysisMetrics: true
  })
  const [sessionName, setSessionName] = useState('')
  const [showStorageSetup, setShowStorageSetup] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [sortBy, setSortBy] = useState('newest')
  const [showExportModal, setShowExportModal] = useState(false)
  const [selectedSessionForExport, setSelectedSessionForExport] = useState<SessionInfo | null>(null)
  
  // 저장소 자동 복원 Hook 사용
  const { isRestoring, isRestored, restoreError } = useStorageAutoRestore()
  
  // 실시간 레코딩 시간 계산 (StatusBar와 동일한 로직)
  const [recordingDuration, setRecordingDuration] = useState<string>('00:00:00')

  // Phase 4: 새로운 스토어 Hook 사용
  const { systemStatus, isInitialized } = useSystemStatus()
  const { isConnected, deviceName, currentDeviceId, batteryLevel } = useDeviceStatus()
  const { isStreaming } = useStreamingStatus()
  const { 
    initializeSystem
  } = useSystemActions()

  // 연결된 디바이스 상세 정보
  const connectedDevice = useConnectedDevice()
  const deviceMonitoring = useDeviceMonitoring()
  const samplingRates = useSamplingRates()

  // 🔧 실시간 배터리 정보 (DeviceManager와 동일한 방식)
  const [realtimeBatteryLevel, setRealtimeBatteryLevel] = useState<number>(0);
  
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
      }, 1000); // 1초마다 업데이트 (DeviceManager와 동일)
    } else {
      setRealtimeBatteryLevel(0);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isConnected]);

  // 스트리밍 저장소 시스템 통합
  const { 
    isInitialized: storageInitialized,
    storageDirectoryPath,
    storageStats,
    storageSettings,
    storageStatus,
    currentSession,
    sessions, 
    loadSessions, 
    deleteSession, 
    deleteSessions, 
    exportSession, 
    exportSessions, 
    selectSession, 
    selectAllSessions, 
    clearSelection, 
    selectedSessions,
    selectStorageDirectory,
    startRecording: startStreamingRecording,
    stopRecording: stopStreamingRecording,
    changeStorageDirectory,
    config,
    updateConfig,
    checkAndRestoreStorage
  } = useStorageStore()

  // 설정 스토어에서 스트리밍 레코딩 형식과 타임존 설정 가져오기
  const { streamingRecordingFormat, setStreamingRecordingFormat, timezone } = useSettingsStore()

  // 🔧 분석 지표 서비스 인스턴스
  const analysisMetricsService = AnalysisMetricsService.getInstance()

  // 포맷팅 함수들 (StatusBar와 동일)
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  // 시스템 초기화
  useEffect(() => {
    if (!isInitialized && systemStatus === 'idle') {
      initializeSystem()
    }
  }, [isInitialized, systemStatus, initializeSystem])

  // 저장소 설정 확인 - DataCenter 진입 시 저장소가 설정되지 않았다면 모달 표시
  useEffect(() => {
    // 자동 복원이 완료된 후에만 모달 표시 결정
    if (!isRestoring && !storageInitialized && !isRestored) {
      console.log('[DATACENTER] 📋 저장소가 설정되지 않음, 설정 모달 표시');
      setShowStorageSetup(true)
    } else if (storageInitialized) {
      console.log('[DATACENTER] ✅ 저장소가 설정됨, 설정 모달 숨김');
      setShowStorageSetup(false)
    }
  }, [storageInitialized, isRestoring, isRestored])

  // 저장소 초기화 후 세션 목록 로드
  useEffect(() => {
    if (storageInitialized) {
      console.log('🔧 저장소 초기화 완료, 세션 목록 로드 시작')
      loadSessions()
    }
  }, [storageInitialized, loadSessions])

  // 레코딩 상태 변경 시 세션 목록 새로고침
  useEffect(() => {
    if (!currentSession && storageInitialized) {
      console.log('🔧 레코딩 종료됨, 세션 목록 새로고침')
      // 레코딩이 종료되면 2초 후 세션 목록을 새로고침
      const timer = setTimeout(() => {
        loadSessions()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [currentSession, storageInitialized, loadSessions])

  // 실시간 레코딩 시간 계산 (StatusBar와 동일한 로직)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (currentSession && currentSession.startTime) {
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
  }, [currentSession?.startTime]);

  // 스트리밍 상태 실시간 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      // SystemControlService에서 실제 스트리밍 상태 확인하여 업데이트
      // 이는 useStreamingStatus가 실시간으로 반영되도록 도움
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // 자동 복원 오류 처리
  useEffect(() => {
    if (restoreError) {
      console.error('[DATACENTER] ❌ 저장소 자동 복원 오류:', restoreError);
      // 오류가 발생해도 사용자에게는 조용히 처리하고 설정 모달만 표시
    }
  }, [restoreError]);

  // Settings의 defaultSaveOptions와 연동
  useEffect(() => {
    if (config.defaultSaveOptions) {
      console.log('[DATACENTER] 🔧 Settings에서 기본 저장 옵션 로드:', config.defaultSaveOptions);
      setSaveOptions({
        eegRaw: config.defaultSaveOptions.eegRaw || false,
        ppgRaw: config.defaultSaveOptions.ppgRaw || false,
        accRaw: config.defaultSaveOptions.accRaw || false,
        // 🔧 새로운 분석 지표 옵션 추가
        eegAnalysisMetrics: config.defaultSaveOptions.eegAnalysisMetrics !== undefined ? config.defaultSaveOptions.eegAnalysisMetrics : true,
        ppgAnalysisMetrics: config.defaultSaveOptions.ppgAnalysisMetrics !== undefined ? config.defaultSaveOptions.ppgAnalysisMetrics : true,
        accAnalysisMetrics: config.defaultSaveOptions.accAnalysisMetrics !== undefined ? config.defaultSaveOptions.accAnalysisMetrics : true,
      });
    }
  }, [config.defaultSaveOptions]);

  // 타임존 설정 변경 시 세션 목록 새로고침
  useEffect(() => {
    if (storageInitialized && timezone) {
      console.log('[DATACENTER] 🕐 타임존 설정 변경됨:', timezone, '세션 목록 새로고침');
      loadSessions();
    }
  }, [timezone, storageInitialized, loadSessions]);

  // 저장소 선택 핸들러
  const handleSelectStorage = async () => {
    try {
      const success = await selectStorageDirectory();
      if (success) {
        setShowStorageSetup(false);
      }
    } catch (error) {
      console.error('저장소 선택 실패:', error);
    }
  };

  const toggleRecording = async () => {
    if (currentSession) {
      // 스트리밍 레코딩 중지
      try {
        await stopStreamingRecording()
      } catch (error) {
        console.error('Failed to stop streaming recording:', error)
        alert('레코딩 중지에 실패했습니다.')
      }
    } else {
      // 스트리밍 레코딩 시작 - 연결된 디바이스와 저장소 필요
      if (!isConnected) {
        alert('디바이스를 먼저 연결해주세요.')
        return
      }
      
      if (!storageInitialized) {
        alert('저장소 디렉토리를 먼저 선택해주세요.')
        return
      }
      
      try {
        // 선택된 형식을 StreamingSessionConfig에 맞게 변환
        const mappedFormat = streamingRecordingFormat === 'jsonl' ? 'json' : streamingRecordingFormat as ('json' | 'csv' | 'binary')
        
        // 실제 연결된 디바이스 정보 사용
        const actualDeviceName = connectedDevice?.device?.name || deviceName || 'Unknown Device'
        const actualDeviceId = connectedDevice?.device?.id || currentDeviceId || 'unknown'
        
        const config: StreamingSessionConfig = {
          sessionName: sessionName || `Session_${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}`,
          deviceName: actualDeviceName,
          deviceId: actualDeviceId,
          saveFormats: [mappedFormat], // 사용자가 선택한 형식 사용
          dataTypes: {
            eegRaw: saveOptions.eegRaw,
            ppgRaw: saveOptions.ppgRaw,
            accRaw: saveOptions.accRaw,
            // 🔧 새로운 분석 지표 옵션 추가
            eegAnalysisMetrics: saveOptions.eegAnalysisMetrics,
            ppgAnalysisMetrics: saveOptions.ppgAnalysisMetrics,
            accAnalysisMetrics: saveOptions.accAnalysisMetrics
          },
          compression: storageSettings.compression,
          chunkSize: 1024 // 1KB chunks
        }
        
        await startStreamingRecording(config)
        setSessionName('') // 세션 이름 초기화
      } catch (error) {
        console.error('Failed to start streaming recording:', error)
        alert('레코딩 시작에 실패했습니다.')
      }
    }
  }

  // 필터 옵션
  const filterOptions = [
    { value: 'all', label: 'All Data' },
    { value: 'eeg', label: 'EEG Only' },
    { value: 'ppg', label: 'PPG Only' },
    { value: 'acc', label: 'ACC Only' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' }
  ]

  // 필터링된 데이터
  const filteredData = sessions.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.deviceName.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (selectedFilter === 'all') return matchesSearch
    if (selectedFilter === 'today') {
      const today = new Date().toISOString().split('T')[0]
      return item.date === today && matchesSearch
    }
    if (selectedFilter === 'week') return matchesSearch // 임시로 모든 데이터 표시
    
    return item.formats.some((format: string) => format.toLowerCase() === selectedFilter) && matchesSearch
  })

  const getQualityBadge = (quality: number) => {
    if (quality >= 80) {
      return <Badge className="bg-green-100 text-green-800">우수</Badge>
    } else if (quality >= 60) {
      return <Badge className="bg-blue-100 text-blue-800">양호</Badge>
    } else if (quality >= 40) {
      return <Badge className="bg-yellow-100 text-yellow-800">보통</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800">불량</Badge>
    }
  }

  // 세션 목록 수동 새로고침
  const handleRefreshSessions = async () => {
    console.log('🔧 세션 목록 수동 새로고침')
    await loadSessions()
  }

  // 저장소 변경 핸들러
  const handleChangeStorage = async () => {
    try {
      const success = await changeStorageDirectory()
      if (success) {
        // 성공 시 세션 목록 새로고침
        await loadSessions()
      }
    } catch (error) {
      console.error('저장소 변경 실패:', error)
    }
  }

  // 세션 삭제 핸들러
  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId)
      // 세션 목록 새로고침
      await loadSessions()
    } catch (error) {
      console.error('세션 삭제 실패:', error)
    }
  }

  // 세션 내보내기 핸들러
  const handleExportSession = async (sessionId: string) => {
    try {
      const session = sessions.find(s => s.id === sessionId)
      if (session) {
        setSelectedSessionForExport(session)
        setShowExportModal(true)
      }
    } catch (error) {
      console.error('세션 내보내기 실패:', error)
    }
  }

  // 실제 내보내기 실행
  const handleExportExecute = async (sessionId: string, format: string, dirHandle?: FileSystemDirectoryHandle) => {
    try {
      console.log(`🎯 DataCenter.tsx handleExportExecute 호출됨 - sessionId: ${sessionId}, format: ${format}`);
      console.log(`🎯 Directory handle 전달됨:`, dirHandle ? `${dirHandle.name}` : 'undefined');
      
      if (format === 'zip' || format === 'all') {
        // ZIP 형태로 내보내기 - SessionManager 사용 (directory handle 전달)
        console.log(`🚀 DataCenter.tsx SessionManager.downloadAllAsZip 호출 시작`);
        const { sessionManager } = await import('../utils/SessionManager');
        const success = await sessionManager.downloadAllAsZip(sessionId, dirHandle);
        if (!success) {
          throw new Error('SessionManager ZIP 내보내기 실패');
        }
        console.log(`✅ DataCenter.tsx SessionManager.downloadAllAsZip 완료`);
      } else {
        // 기타 형식은 기존 storageStore 방식 사용
        console.log(`🔧 DataCenter.tsx storageStore.exportSession 호출 - format: ${format}`);
        await exportSession(sessionId, format, dirHandle);
      }
      
      // 내보내기 성공 후 모달 상태 정리는 onOpenChange에서 처리
      // 세션 목록 새로고침 (비동기로 백그라운드에서 실행)
      setTimeout(() => {
        loadSessions()
      }, 100)
    } catch (error) {
      console.error('내보내기 실행 실패:', error)
      throw error // ExportSessionModal에서 오류 처리하도록 전달
    }
  }

  // 세션 경로 복사 (크로스 플랫폼 지원)
  const handleCopySessionPath = async (session: SessionInfo) => {
    try {
      // 절대 경로 사용: config.storageDirectoryAbsolutePath 또는 상대 경로 폴백
      const absolutePath = config.storageDirectoryAbsolutePath || storageDirectoryPath;
      
      // 세션 날짜에서 년도/월 정보 추출 (storageStore의 parseSessionDate 사용)
      const sessionDate = useStorageStore.getState().parseSessionDate(session.id);
      const [year, month] = sessionDate.split('-');
      
      // 전체 저장소 구조 경로 생성: LinkBand-Data/sessions/년도/월/세션ID
      const fullSessionPath = joinPath(
        absolutePath,
        'LinkBand-Data',
        'sessions', 
        year,
        month,
        session.id
      );
      
      // 크로스 플랫폼 경로 포맷팅
      const sessionPath = formatPathForSystem(fullSessionPath);
      
      await navigator.clipboard.writeText(sessionPath);
      console.log('[DATACENTER] 📋 세션 경로 복사됨:', sessionPath);
      
      // 성공 토스트 메시지 표시
      toast.success('경로가 복사되었습니다', {
        description: `${session.name} 세션의 절대 경로가 클립보드에 복사되었습니다.`,
        duration: 3000,
      });
      
    } catch (error) {
      console.error('[DATACENTER] ❌ 경로 복사 실패:', error);
      
      // 대안: 텍스트 선택 방식으로 복사 시도
      try {
        const absolutePath = config.storageDirectoryAbsolutePath || storageDirectoryPath;
        
        // 세션 날짜에서 년도/월 정보 추출 (storageStore의 parseSessionDate 사용)
        const sessionDate = useStorageStore.getState().parseSessionDate(session.id);
        const [year, month] = sessionDate.split('-');
        
        // 전체 저장소 구조 경로 생성
        const fullSessionPath = joinPath(
          absolutePath,
          'LinkBand-Data',
          'sessions', 
          year,
          month,
          session.id
        );
        
        const sessionPath = formatPathForSystem(fullSessionPath);
          
        const textArea = document.createElement('textarea');
        textArea.value = sessionPath;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        console.log('[DATACENTER] 📋 대안 방식으로 경로 복사됨:', sessionPath);
        
        // 성공 토스트 메시지 표시
        toast.success('경로가 복사되었습니다', {
          description: `${session.name} 세션의 절대 경로가 클립보드에 복사되었습니다.`,
          duration: 3000,
        });
        
      } catch (fallbackError) {
        console.error('[DATACENTER] ❌ 대안 복사도 실패:', fallbackError);
        
        // 실패 토스트 메시지 표시
        toast.error('경로 복사 실패', {
          description: '경로를 클립보드에 복사하는 중 오류가 발생했습니다.',
          duration: 3000,
        });
      }
    }
  }

  // 플랫폼별 폴더 열기 안내 메시지 생성
  const getPlatformSpecificFolderInstructions = () => {
    const os = detectOS();
    console.log('[DEBUG] Detected OS:', os); // 디버깅용 로그
    console.log('[DEBUG] User Agent:', navigator.userAgent); // 디버깅용 로그
    console.log('[DEBUG] Platform:', navigator.platform); // 디버깅용 로그
    
    switch (os) {
      case 'windows':
        return {
          title: 'Windows 탐색기에서 저장소 폴더 열기',
          description: 'Windows 탐색기에서 Ctrl+L을 눌러 복사된 경로로 이동하세요.'
        };
      case 'macos':
        return {
          title: 'Finder에서 저장소 폴더 열기',
          description: 'Finder에서 ⌘+Shift+G를 눌러 복사된 경로로 이동하세요.'
        };
      case 'linux':
        return {
          title: '파일 매니저에서 저장소 폴더 열기',
          description: '파일 매니저에서 Ctrl+L을 눌러 복사된 경로로 이동하세요.'
        };
      default:
        return {
          title: '파일 매니저에서 저장소 폴더 열기',
          description: '파일 매니저에서 복사된 경로로 이동하세요.'
        };
    }
  };

  return (
    <div className="flex-1 overflow-auto p-6 bg-background text-foreground">
      <div className="max-w-7xl mx-auto space-y-6 pb-20">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-medium text-foreground">Data Center</h1>
            <p className="text-muted-foreground">데이터 저장소 및 관리</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleChangeStorage}
            >
              <Settings className="w-4 h-4 mr-2" />
              저장소 설정
            </Button>
          </div>
        </div>

        {/* Storage Directory Status */}
        {!storageInitialized && (
          <Card className="p-4 border-yellow-200 bg-yellow-50">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">저장소 디렉토리를 선택해주세요</p>
                <p className="text-xs text-yellow-700">데이터 저장을 위해 로컬 저장소 디렉토리를 선택해야 합니다.</p>
              </div>
              <Button 
                size="sm" 
                onClick={handleSelectStorage}
                className="ml-auto"
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                선택
              </Button>
            </div>
          </Card>
        )}

        {storageInitialized && storageDirectoryPath && (
          <Card className="p-4 border-green-200 bg-green-50">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">저장소 디렉토리 연결됨</p>
                <p className="text-xs text-green-700 font-mono">
                  {formatPathForSystem(config.storageDirectoryAbsolutePath || storageDirectoryPath)}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Storage Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <HardDrive className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Storage</p>
                <p className="text-xl font-medium">{storageStats.totalSize}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Database className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Used</p>
                <p className="text-xl font-medium">{storageStats.used}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <HardDrive className="w-8 h-8 text-gray-500" />
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-xl font-medium">{storageStats.available}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Database className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Sessions</p>
                <p className="text-xl font-medium">{storageStats.sessions}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Recording Control */}
        <div className="space-y-4">
          <h2 className="text-xl font-medium">실시간 스트리밍 레코딩</h2>
          
          {isConnected ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 디바이스 정보 카드 */}
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">디바이스 정보</h3>
                    <p className="text-sm text-muted-foreground">연결된 LINK BAND 디바이스</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">디바이스명</span>
                    <span className="text-sm font-medium">{connectedDevice?.device?.name || deviceName || 'Unknown Device'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">디바이스 ID</span>
                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{connectedDevice?.device?.id || currentDeviceId || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">연결 상태</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium text-green-600">연결됨</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">배터리</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{realtimeBatteryLevel}%</span>
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        realtimeBatteryLevel > 20 ? "bg-green-500" : realtimeBatteryLevel > 10 ? "bg-yellow-500" : "bg-red-500"
                      )}></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">연결 시간</span>
                    <span className="text-sm font-medium">{deviceMonitoring?.connectionDuration || '00:00:00'}</span>
                  </div>
                  
                  {/* 샘플링 레이트 */}
                  {samplingRates && (
                    <div className="pt-3 border-t">
                      <p className="text-sm text-muted-foreground mb-2">샘플링 레이트</p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center p-2 bg-muted/50 rounded">
                          <div className="font-medium">EEG</div>
                          <div className="text-muted-foreground">{samplingRates.eeg}Hz</div>
                        </div>
                        <div className="text-center p-2 bg-muted/50 rounded">
                          <div className="font-medium">PPG</div>
                          <div className="text-muted-foreground">{samplingRates.ppg}Hz</div>
                        </div>
                        <div className="text-center p-2 bg-muted/50 rounded">
                          <div className="font-medium">ACC</div>
                          <div className="text-muted-foreground">{samplingRates.acc}Hz</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* 저장소 정보 카드 */}
              {storageInitialized && storageDirectoryPath && (
                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <FolderOpen className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-medium">저장소 정보</h3>
                      <p className="text-sm text-muted-foreground">데이터 저장 위치</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-muted-foreground">저장 경로</span>
                      <div className="mt-1 p-3 bg-muted/50 rounded-lg">
                        <p className="font-mono text-xs break-all">{formatPathForSystem(storageDirectoryPath)}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const formattedPath = formatPathForSystem(config.storageDirectoryAbsolutePath || storageDirectoryPath || '');
                            await navigator.clipboard.writeText(formattedPath);
                            
                            toast.success('저장소 경로가 복사되었습니다', {
                              description: '저장소 루트 경로가 클립보드에 복사되었습니다.',
                              duration: 3000,
                            });
                            
                          } catch (error) {
                            console.error('클립보드 복사 실패:', error);
                            
                            try {
                              const formattedPath = formatPathForSystem(config.storageDirectoryAbsolutePath || storageDirectoryPath || '');
                              const textArea = document.createElement('textarea');
                              textArea.value = formattedPath;
                              document.body.appendChild(textArea);
                              textArea.select();
                              document.execCommand('copy');
                              document.body.removeChild(textArea);
                              
                              toast.success('저장소 경로가 복사되었습니다', {
                                description: '저장소 루트 경로가 클립보드에 복사되었습니다.',
                                duration: 3000,
                              });
                              
                            } catch (fallbackError) {
                              toast.error('경로 복사 실패', {
                                description: '경로를 클립보드에 복사하는 중 오류가 발생했습니다.',
                                duration: 3000,
                              });
                            }
                          }
                        }}
                        className="flex-1"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        경로 복사
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const formattedPath = formatPathForSystem(config.storageDirectoryAbsolutePath || storageDirectoryPath || '');
                            await navigator.clipboard.writeText(formattedPath);
                            
                            const instructions = getPlatformSpecificFolderInstructions();
                            
                            toast.info('저장소 폴더 경로가 복사되었습니다', {
                              description: instructions.description,
                              duration: 5000,
                            });
                            
                          } catch (error) {
                            console.error('디렉토리 경로 복사 실패:', error);
                            
                            try {
                              const formattedPath = formatPathForSystem(config.storageDirectoryAbsolutePath || storageDirectoryPath || '');
                              const textArea = document.createElement('textarea');
                              textArea.value = formattedPath;
                              document.body.appendChild(textArea);
                              textArea.select();
                              document.execCommand('copy');
                              document.body.removeChild(textArea);
                              
                              const instructions = getPlatformSpecificFolderInstructions();
                              
                              toast.info('저장소 폴더 경로가 복사되었습니다', {
                                description: instructions.description,
                                duration: 5000,
                              });
                              
                            } catch (fallbackError) {
                              toast.error('폴더 열기 실패', {
                                description: '폴더 경로를 복사하는 중 오류가 발생했습니다.',
                                duration: 3000,
                              });
                            }
                          }
                        }}
                        className="flex-1"
                        title={getPlatformSpecificFolderInstructions().title}
                      >
                        <FolderOpen className="w-4 h-4 mr-1" />
                        폴더 열기
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <div className="border-red-600 bg-red-900/20 border-l-4 border-l-red-600 w-full rounded-lg">
              <div className="flex flex-col items-center justify-center text-center px-8 py-8">
                <AlertCircle className="h-12 w-12 text-red-400 mb-6" />
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-red-200">디바이스를 연결해주세요!</h3>
                  <p className="text-lg text-red-300">
                    데이터 수집 및 레코딩을 위해서는 LINK BAND 디바이스 연결이 필요합니다.
                  </p>
                  <p className="text-lg text-red-200/80">
                    Device Manager 탭에서 디바이스를 연결한 후 다시 시도해주세요.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 레코딩 제어 카드 */}
          <Card className="p-4">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <h3 className="font-medium">레코딩 제어</h3>
                
                {/* 레코딩 상태 표시 */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      isConnected ? "bg-green-500" : "bg-gray-400"
                    )}></div>
                    <span className={isConnected ? "text-green-600" : "text-muted-foreground"}>
                      {isConnected ? '디바이스 연결됨' : '디바이스 연결 안됨'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      storageInitialized ? "bg-green-500" : "bg-gray-400"
                    )}></div>
                    <span className={storageInitialized ? "text-green-600" : "text-muted-foreground"}>
                      {storageInitialized ? '저장소 준비됨' : '저장소 설정 필요'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      isStreaming ? "bg-blue-500 animate-pulse" : "bg-gray-400"
                    )}></div>
                    <span className={isStreaming ? "text-blue-600" : "text-muted-foreground"}>
                      {isStreaming ? '데이터 스트리밍 중' : '스트리밍 중지'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      storageStatus.isWriting ? "bg-red-500 animate-pulse" : "bg-gray-400"
                    )}></div>
                    <span className={storageStatus.isWriting ? "text-red-600" : "text-muted-foreground"}>
                      {storageStatus.isWriting ? '파일 저장 중' : '저장 대기'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {/* 세션 이름 입력 */}
                {!currentSession && (
                  <Input
                    placeholder="세션 이름 (선택사항)"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    className="w-48"
                  />
                )}
                
                {currentSession && (
                  <div className="text-right">
                    <p className="text-sm font-medium">{currentSession.name}</p>
                    <p className="text-xs text-muted-foreground">
                      지속 시간: {recordingDuration}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      파일 크기: {formatFileSize(currentSession.estimatedSize || 0)}
                    </p>
                  </div>
                )}
                
                <Button 
                  onClick={toggleRecording}
                  disabled={!isConnected || !storageInitialized}
                  className={cn(
                    currentSession 
                      ? "bg-red-500 hover:bg-red-600 text-white" 
                      : "bg-green-500 hover:bg-green-600 text-white"
                  )}
                >
                  {currentSession ? (
                    <>
                      <Square className="w-4 h-4 mr-2" />
                      레코딩 중지
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      레코딩 시작
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* 저장 형식 설정 */}
            {!currentSession && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">저장 형식 설정</h4>
                
                {/* 파일 형식 선택 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">파일 형식</label>
                    <Select value={streamingRecordingFormat} onValueChange={setStreamingRecordingFormat}>
                      <SelectTrigger className="bg-background border-input">
                        <SelectValue placeholder="파일 형식 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV (쉼표로 구분된 값)</SelectItem>
                        <SelectItem value="json">JSON (JavaScript Object Notation)</SelectItem>
                        <SelectItem value="jsonl">JSON Lines (줄별 JSON)</SelectItem>
                        <SelectItem value="binary">Binary (바이너리 형식)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      선택한 형식이 기본값으로 저장됩니다.
                    </p>
                  </div>
                </div>
                
                {/* 데이터 타입 선택 */}
                <div>
                  <label className="block text-sm font-medium mb-2">저장할 데이터 타입</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(saveOptions).map(([key, value]) => (
                      <label key={key} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => {
                            const newSaveOptions = {
                              ...saveOptions,
                              [key]: e.target.checked
                            };
                            setSaveOptions(newSaveOptions);
                            
                            updateConfig({
                              defaultSaveOptions: newSaveOptions
                            });
                            
                            console.log('[DATACENTER] 🔧 저장 옵션 변경됨:', newSaveOptions);
                          }}
                          className="rounded border-input text-primary focus:ring-primary"
                        />
                        <span>
                          {(() => {
                            const formatted = key.replace(/([A-Z])/g, ' $1').trim();
                            return formatted
                              .replace(/^eeg/i, 'EEG')
                              .replace(/^ppg/i, 'PPG') 
                              .replace(/^acc/i, 'ACC')
                              .replace(/\beeg\b/gi, 'EEG')
                              .replace(/\bppg\b/gi, 'PPG')
                              .replace(/\bacc\b/gi, 'ACC');
                          })()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="세션 이름 또는 디바이스로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select 
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-3 py-2 border border-input bg-neutral-700 text-white rounded-md text-sm"
              >
                {filterOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                고급 필터
              </Button>
            </div>
          </div>
        </Card>

        {/* Data Table */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold">저장된 세션</h2>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                >
                  <ArrowUpDown className="h-4 w-4" />
                  {sortBy === 'newest' ? '최신순' : '오래된순'}
                </Button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">세션 이름</th>
                  <th className="text-left py-3 px-4 font-medium">날짜/시간</th>
                  <th className="text-left py-3 px-4 font-medium">지속 시간</th>
                  <th className="text-left py-3 px-4 font-medium">디바이스</th>
                  <th className="text-left py-3 px-4 font-medium">데이터 타입</th>
                  <th className="text-left py-3 px-4 font-medium">크기</th>
                  <th className="text-left py-3 px-4 font-medium">작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-neutral-700/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{item.date}</span>
                        <Clock className="w-4 h-4 text-muted-foreground ml-2" />
                        <span>{item.time}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">{item.duration}</td>
                    <td className="py-3 px-4 text-sm">{item.deviceName}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        {item.formats.map((format: string) => (
                          <Badge key={format} variant="outline" className="text-xs">
                            {format}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">{item.totalSize}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCopySessionPath(item)}
                          title="절대 경로 복사 (클립보드에 복사)"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleExportSession(item.id)}
                          title="세션 내보내기"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteSession(item.id)}
                          className="text-red-600 hover:text-red-700"
                          title="세션 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>검색 조건에 맞는 데이터가 없습니다.</p>
              <p className="text-sm">다른 검색어나 필터를 시도해보세요.</p>
            </div>
          )}
        </Card>
      </div>
      
      {/* Storage Setup Modal */}
      <StorageSetupModal
        open={showStorageSetup}
        onOpenChange={setShowStorageSetup}
      />
      
      {/* Export Session Modal */}
      <ExportSessionModal
        open={showExportModal}
        onOpenChange={(open) => {
          setShowExportModal(open);
          if (!open) {
            // 모달이 닫힐 때 선택된 세션 정리
            setTimeout(() => {
              setSelectedSessionForExport(null);
            }, 200);
          }
        }}
        session={selectedSessionForExport}
        onExport={handleExportExecute}
      />
    </div>
  )
}