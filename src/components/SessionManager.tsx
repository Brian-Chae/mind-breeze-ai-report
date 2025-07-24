import React, { useState, useEffect } from 'react';
import { Card } from '@ui/card';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@ui/dialog';
import { Download, Trash2, FolderOpen, Clock, Database, FileText, Activity, RefreshCw, ChevronLeft, ChevronRight, Play, Square } from 'lucide-react';
import { sessionManager, type SessionMetadata } from '../utils/SessionManager';
import { useDeviceStore } from '../stores/deviceStore';
import { useSensorDataStore } from '../stores/sensorDataStore';
import { useSettingsStore } from '../stores/settingsStore';
import { formatDateByTimezone, formatTimeOnlyByTimezone, formatDateOnlyByTimezone, formatDuration as formatDurationByTimezone } from '../utils/timeUtils';

interface SessionManagerProps {
  className?: string;
}

export function SessionManager({ className }: SessionManagerProps) {
  const { connectionState } = useDeviceStore();
  const { isConnected, isRecording } = useSensorDataStore();
  const { timezone } = useSettingsStore();
  const [sessions, setSessions] = useState<SessionMetadata[]>([]);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [storageInfo, setStorageInfo] = useState({ used: 0, available: 0, sessions: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const sessionsPerPage = 10;
  const [sessionName, setSessionName] = useState('');

  // 세션 목록 새로고침
  const refreshSessions = () => {
    const allSessions = sessionManager.getAllSessions();
    
    // 각 세션의 실제 데이터 카운트를 확인하여 동기화
    const validatedSessions = allSessions.map(session => {
      const actualSession = sessionManager.loadSession(session.id);
      if (actualSession) {
        // 실제 데이터 개수 계산
        const eegCount = actualSession.eegData?.length || 0;
        const ppgCount = actualSession.ppgData?.length || 0;
        const accCount = actualSession.accData?.length || 0;
        const eegProcessedCount = 0; // Processed data not stored in SessionData
        const ppgProcessedCount = 0; // Processed data not stored in SessionData
        const accProcessedCount = 0; // Processed data not stored in SessionData

        const totalSamples = eegCount + ppgCount + accCount + eegProcessedCount + ppgProcessedCount + accProcessedCount;
        const estimatedSize = (eegCount * 50) + (ppgCount * 30) + (accCount * 40) + 
                            (eegProcessedCount * 60) + (ppgProcessedCount * 40) + (accProcessedCount * 50);

        return {
          ...session,
          startTime: session.startTime || new Date(),
          endTime: session.endTime || undefined,
          duration: session.duration || 0,
          dataCount: {
            eeg: eegCount,
            ppg: ppgCount,
            acc: accCount,
            eegProcessed: eegProcessedCount,
            ppgProcessed: ppgProcessedCount,
            accProcessed: accProcessedCount
          },
          totalSamples,
          estimatedSize
        };
      } else {
        // 세션을 불러올 수 없는 경우 기본값 사용
        return {
          ...session,
          startTime: session.startTime || new Date(),
          endTime: session.endTime || undefined,
          duration: session.duration || 0,
          dataCount: {
            eeg: session.dataCount?.eeg || 0,
            ppg: session.dataCount?.ppg || 0,
            acc: session.dataCount?.acc || 0,
            eegProcessed: session.dataCount?.eegProcessed || 0,
            ppgProcessed: session.dataCount?.ppgProcessed || 0,
            accProcessed: session.dataCount?.accProcessed || 0
          },
          totalSamples: 0,
          estimatedSize: 0
        };
      }
    })
    .sort((a, b) => {
      // 최신순 정렬 (startTime 기준)
      const timeA = a.startTime ? a.startTime.getTime() : 0;
      const timeB = b.startTime ? b.startTime.getTime() : 0;
      return timeB - timeA;
    });
    
    setSessions(validatedSessions);
    
    // 페이지 리셋
    setCurrentPage(1);
    
    const current = sessionManager.getCurrentSession();
    if (current) {
      // 현재 세션 데이터도 검증
      const validatedCurrentSession = {
        ...current.metadata,
        startTime: current.metadata.startTime || new Date(),
        endTime: current.metadata.endTime || undefined,
        duration: current.metadata.duration || 0,
        dataCount: {
          eeg: current.metadata.dataCount?.eeg || 0,
          ppg: current.metadata.dataCount?.ppg || 0,
          acc: current.metadata.dataCount?.acc || 0,
          eegProcessed: current.metadata.dataCount?.eegProcessed || 0,
          ppgProcessed: current.metadata.dataCount?.ppgProcessed || 0,
          accProcessed: current.metadata.dataCount?.accProcessed || 0
        }
      };
      setCurrentSession(validatedCurrentSession);
    } else {
      setCurrentSession(null);
    }
    
    const info = sessionManager.getStorageInfo();
    setStorageInfo(info);
    
    // 디버깅: 현재 세션 데이터 확인
    if (current) {
    }
  };

  useEffect(() => {
    refreshSessions();
    
    // 더 자주 세션 정보 업데이트 (1초마다)
    const interval = setInterval(refreshSessions, 1000);
    return () => clearInterval(interval);
  }, []);

  // CSV 내보내기
  const handleExportCSV = async (sessionId: string, dataType: 'eeg' | 'ppg' | 'acc' | 'system') => {
    setIsLoading(true);
    try {
      const success = sessionManager.downloadCSV(sessionId, dataType);
      if (success) {
      } else {
        alert('CSV 형식의 파일을 찾을 수 없습니다.');
      }
    } catch (error) {
      alert('세션 내보내기 실패: csv 형식의 파일을 찾을 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // ZIP 모든 데이터 내보내기
  const handleExportAllAsZip = async (sessionId: string) => {
    setIsLoading(true);
    try {
      const success = await sessionManager.downloadAllAsZip(sessionId);
      if (success) {
      } else {
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  // 세션 삭제
  const handleDeleteSession = (sessionId: string) => {
    if (confirm('이 세션을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      sessionManager.deleteSession(sessionId);
      refreshSessions();
    }
  };

  // 시간 포맷팅 (시간대 인식)
  const formatDuration = (seconds: number): string => {
    return formatDurationByTimezone(seconds);
  };

  // 데이터 크기 포맷팅
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 세션 타입 결정
  const getSessionType = (session: SessionMetadata): string => {
    const { eeg, ppg, acc } = session.dataCount || {};
    const types = [];
    if (eeg > 0) types.push('EEG');
    if (ppg > 0) types.push('PPG');
    if (acc > 0) types.push('Accelerometer');
    return types.length > 1 ? 'Multi-modal' : types[0] || 'Unknown';
  };

  // 세션 상태 결정
  const getSessionStatus = (session: SessionMetadata): { status: string; className: string } => {
    if (session.endTime) {
      return { status: 'Completed', className: 'bg-green-100 text-green-800' };
    } else {
      return { status: 'Processing', className: 'bg-yellow-100 text-yellow-800' };
    }
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(sessions.length / sessionsPerPage);
  const startIndex = (currentPage - 1) * sessionsPerPage;
  const endIndex = startIndex + sessionsPerPage;
  const currentSessions = sessions.slice(startIndex, endIndex);

  // 세션 상태 업데이트
  useEffect(() => {
    const updateSessionState = () => {
      const current = sessionManager.getCurrentSession();
      const sessions = sessionManager.getAllSessions();
      const storage = sessionManager.getStorageInfo();
      
      setCurrentSession(current);
      setSessions(sessions);
      setStorageInfo(storage);
    };

    // 초기 로드
    updateSessionState();

    // 1초마다 업데이트
    const interval = setInterval(updateSessionState, 1000);
    return () => clearInterval(interval);
  }, []);

  // 세션 시작
  const startSession = () => {
    if (!connectionState.device) {
      alert('디바이스가 연결되지 않았습니다.');
      return;
    }

    const name = sessionName.trim() || `Session ${new Date().toLocaleString()}`;
    const sessionId = sessionManager.startSession(
      connectionState.device.name,
      connectionState.device.id,
      name,
      undefined, // saveOptions - 기본값 사용
      timezone    // 시간대 설정 전달
    );
    

    setSessionName('');
  };

  // 세션 종료
  const stopSession = () => {
    const success = sessionManager.endSession();
    if (success) {
  
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 세션 제어 */}
      <Card className="p-6 bg-gray-900 border-gray-700">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">
          📊 세션 녹화 제어
        </h3>
        
        {!isRecording ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                세션 이름 (선택사항)
              </label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder={`Session ${new Date().toLocaleString()}`}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!connectionState.device}
              />
            </div>
            
            <Button
              onClick={startSession}
              disabled={!connectionState.device}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <Play className="w-4 h-4 mr-2" />
              세션 녹화 시작
            </Button>
            
            {!connectionState.device && (
              <p className="text-sm text-gray-400 text-center">
                디바이스를 먼저 연결하세요
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                                     <h4 className="text-green-400 font-medium">
                     🔴 녹화 중: {currentSession?.metadata?.name}
                   </h4>
                   <p className="text-sm text-gray-300 mt-1">
                     지속 시간: {formatDuration(Math.floor((Date.now() - new Date(currentSession?.metadata?.startTime).getTime()) / 1000))}
                   </p>
                   <p className="text-sm text-gray-400 mt-1">
                     데이터: EEG {currentSession?.metadata?.dataCount?.eeg || 0} | 
                     PPG {currentSession?.metadata?.dataCount?.ppg || 0} | 
                     ACC {currentSession?.metadata?.dataCount?.acc || 0}
                   </p>
                </div>
                <Badge variant="destructive" className="bg-red-600">
                  LIVE
                </Badge>
              </div>
            </div>
            
            <Button
              onClick={stopSession}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              <Square className="w-4 h-4 mr-2" />
              세션 녹화 중지
            </Button>
          </div>
        )}
      </Card>

      {/* 현재 세션 정보 */}
      {currentSession && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              <h3 className="font-medium">현재 세션</h3>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                진행 중
              </Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">세션 이름</p>
              <p className="font-medium">{currentSession.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">시작 시간</p>
              <p className="font-medium">
                {currentSession.startTime ? 
                  formatDateByTimezone(currentSession.startTime, timezone) : 'N/A'
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">디바이스</p>
              <p className="font-medium">{currentSession.deviceName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">데이터 수집</p>
              <p className="font-medium text-xs">
                EEG Raw: {(currentSession.dataCount?.eeg || 0).toLocaleString()}<br />
                PPG Raw: {(currentSession.dataCount?.ppg || 0).toLocaleString()}<br />
                ACC Raw: {(currentSession.dataCount?.acc || 0).toLocaleString()}<br />
                EEG Processed: {(currentSession.dataCount?.eegProcessed || 0).toLocaleString()}<br />
                PPG Processed: {(currentSession.dataCount?.ppgProcessed || 0).toLocaleString()}<br />
                ACC Processed: {(currentSession.dataCount?.accProcessed || 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            {/* 모두 받기 버튼 */}
            <Button
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleExportAllAsZip('current');
              }}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              모든 데이터 ZIP으로 받기
            </Button>
            
            {/* 개별 내보내기 버튼들 */}
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExportCSV('current', 'eeg')}
                disabled={isLoading}
              >
                <Download className="w-4 h-4 mr-2" />
                EEG 내보내기
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExportCSV('current', 'ppg')}
                disabled={isLoading}
              >
                <Download className="w-4 h-4 mr-2" />
                PPG 내보내기
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExportCSV('current', 'acc')}
                disabled={isLoading}
              >
                <Download className="w-4 h-4 mr-2" />
                ACC 내보내기
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExportCSV('current', 'system')}
                disabled={isLoading}
              >
                <Download className="w-4 h-4 mr-2" />
                시스템 로그 내보내기
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 저장소 정보 */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-blue-500" />
          <h3 className="font-medium">저장소 정보</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">저장된 세션</p>
            <p className="text-2xl font-bold">{storageInfo.sessions}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">사용 중</p>
            <p className="text-2xl font-bold">{formatBytes(storageInfo.used)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">사용 가능</p>
            <p className="text-2xl font-bold">{formatBytes(storageInfo.available)}</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span>저장소 사용률</span>
            <span>{Math.round((storageInfo.used / (storageInfo.used + storageInfo.available)) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${Math.min((storageInfo.used / (storageInfo.used + storageInfo.available)) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </Card>

      {/* 세션 목록 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-purple-500" />
            <h3 className="font-medium">저장된 세션 ({sessions.length}개)</h3>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={refreshSessions}>
              <RefreshCw className="w-4 h-4 mr-2" />
              새로고침
            </Button>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>저장된 세션이 없습니다</p>
          </div>
        ) : (
          <>
            {/* 세션 테이블 헤더 */}
            <div className="hidden md:grid md:grid-cols-9 gap-4 p-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-600 mb-4">
              <div>Session</div>
              <div>Device</div>
              <div>Type</div>
              <div>Date</div>
              <div>Duration</div>
              <div>Samples</div>
              <div>Size</div>
              <div>Status</div>
              <div>Actions</div>
            </div>

            {/* 세션 목록 */}
            <div className="space-y-3">
              {currentSessions.map((session) => {
                const sessionStatus = getSessionStatus(session);
                const sessionType = getSessionType(session);
                
                return (
                  <div key={session.id} className="border rounded-lg hover:bg-gray-700 transition-colors overflow-hidden">
                    {/* 모바일 뷰 */}
                    <div className="md:hidden p-4">
                      <div className="flex items-start justify-between mb-3 gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-lg truncate">{session.name}</h4>
                          <p className="text-sm text-gray-600 truncate">{session.id}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${sessionStatus.className}`}>
                          {sessionStatus.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                        <div className="min-w-0">
                          <span className="text-gray-500 block">Device:</span>
                          <p className="font-medium truncate">{session.deviceName || 'Unknown Device'}</p>
                        </div>
                        <div className="min-w-0">
                          <span className="text-gray-500 block">Type:</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium inline-block">
                            {sessionType}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-gray-500 block">Date:</span>
                          <p className="font-medium text-sm">
                            {session.startTime ? formatDateOnlyByTimezone(session.startTime, timezone) : 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {session.startTime ? formatTimeOnlyByTimezone(session.startTime, timezone) : ''}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <span className="text-gray-500 block">Duration:</span>
                          <p className="font-medium">{formatDuration(session.duration || 0)}</p>
                        </div>
                        <div className="min-w-0">
                          <span className="text-gray-500 block">Samples:</span>
                          <p className="font-medium">{(session.totalSamples || 0).toLocaleString()}</p>
                        </div>
                        <div className="min-w-0">
                          <span className="text-gray-500 block">Size:</span>
                          <p className="font-medium">{formatBytes(session.estimatedSize || 0)}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="flex-1">
                              <Download className="w-4 h-4 mr-2" />
                              내보내기
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-black/95">
                            <DialogHeader>
                              <DialogTitle>데이터 내보내기</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2">세션: {session.name}</h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                  내보낼 데이터 유형을 선택하세요
                                </p>
                              </div>
                              
                              {/* 모두 받기 버튼 */}
                              <div className="border-b pb-4">
                                <Button
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    await handleExportAllAsZip(session.id);
                                  }}
                                  disabled={isLoading}
                                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                  size="lg"
                                >
                                  <Download className="w-5 h-5 mr-2" />
                                  모든 데이터 ZIP으로 받기
                                </Button>
                                <p className="text-xs text-muted-foreground mt-2 text-center">
                                  모든 데이터와 세션 정보를 하나의 ZIP 파일로 다운로드합니다
                                </p>
                              </div>
                              
                              <div className="grid grid-cols-1 gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => handleExportCSV(session.id, 'eeg')}
                                  disabled={isLoading || (session.dataCount?.eeg || 0) === 0}
                                  className="justify-start"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  EEG 데이터 ({(session.dataCount?.eeg || 0).toLocaleString()}개)
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  onClick={() => handleExportCSV(session.id, 'ppg')}
                                  disabled={isLoading || (session.dataCount?.ppg || 0) === 0}
                                  className="justify-start"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  PPG 데이터 ({(session.dataCount?.ppg || 0).toLocaleString()}개)
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  onClick={() => handleExportCSV(session.id, 'acc')}
                                  disabled={isLoading || (session.dataCount?.acc || 0) === 0}
                                  className="justify-start"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  가속도계 데이터 ({(session.dataCount?.acc || 0).toLocaleString()}개)
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  onClick={() => handleExportCSV(session.id, 'system')}
                                  disabled={isLoading}
                                  className="justify-start"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  시스템 로그
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDeleteSession(session.id)}
                          className="text-red-600 hover:text-red-700 px-3"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* 데스크톱 뷰 */}
                    <div className="hidden md:grid md:grid-cols-9 gap-3 p-4 items-center">
                      <div className="min-w-0">
                        <p className="font-medium truncate" title={session.name}>{session.name}</p>
                        <p className="text-xs text-gray-500 truncate" title={session.id}>{session.id}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{session.deviceName || 'Unknown Device'}</p>
                      </div>
                      <div className="min-w-0">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium whitespace-nowrap">
                          {sessionType}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm">
                          {session.startTime ? formatDateOnlyByTimezone(session.startTime, timezone) : 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {session.startTime ? formatTimeOnlyByTimezone(session.startTime, timezone) : ''}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium whitespace-nowrap">{formatDuration(session.duration || 0)}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium whitespace-nowrap">{(session.totalSamples || 0).toLocaleString()}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium whitespace-nowrap">{formatBytes(session.estimatedSize || 0)}</p>
                      </div>
                      <div className="min-w-0">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${sessionStatus.className}`}>
                          {sessionStatus.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 justify-center">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                              <Download className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-black/95">
                            <DialogHeader>
                              <DialogTitle>데이터 내보내기</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2">세션: {session.name}</h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                  내보낼 데이터 유형을 선택하세요
                                </p>
                              </div>
                              
                              {/* 모두 받기 버튼 */}
                              <div className="border-b pb-4">
                                <Button
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    await handleExportAllAsZip(session.id);
                                  }}
                                  disabled={isLoading}
                                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                  size="lg"
                                >
                                  <Download className="w-5 h-5 mr-2" />
                                  모든 데이터 ZIP으로 받기
                                </Button>
                                <p className="text-xs text-muted-foreground mt-2 text-center">
                                  모든 데이터와 세션 정보를 하나의 ZIP 파일로 다운로드합니다
                                </p>
                              </div>
                              
                              <div className="grid grid-cols-1 gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => handleExportCSV(session.id, 'eeg')}
                                  disabled={isLoading || (session.dataCount?.eeg || 0) === 0}
                                  className="justify-start"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  EEG 데이터 ({(session.dataCount?.eeg || 0).toLocaleString()}개)
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  onClick={() => handleExportCSV(session.id, 'ppg')}
                                  disabled={isLoading || (session.dataCount?.ppg || 0) === 0}
                                  className="justify-start"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  PPG 데이터 ({(session.dataCount?.ppg || 0).toLocaleString()}개)
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  onClick={() => handleExportCSV(session.id, 'acc')}
                                  disabled={isLoading || (session.dataCount?.acc || 0) === 0}
                                  className="justify-start"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  가속도계 데이터 ({(session.dataCount?.acc || 0).toLocaleString()}개)
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  onClick={() => handleExportCSV(session.id, 'system')}
                                  disabled={isLoading}
                                  className="justify-start"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  시스템 로그
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDeleteSession(session.id)}
                          className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  {startIndex + 1}-{Math.min(endIndex, sessions.length)} / {sessions.length}개 세션
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    이전
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => 
                        page === 1 || 
                        page === totalPages || 
                        Math.abs(page - currentPage) <= 1
                      )
                      .map((page, index, array) => (
                        <React.Fragment key={page}>
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <Button
                            size="sm"
                            variant={currentPage === page ? "default" : "outline"}
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        </React.Fragment>
                      ))
                    }
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    다음
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

</div>
  );
} 