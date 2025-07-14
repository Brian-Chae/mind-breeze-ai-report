import React, { useEffect } from 'react'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { useSystemStatus, useDeviceStatus, useStreamingStatus, useSystemActions } from '../stores/systemStore'
import { useSignalQuality, useRealtimeAnalysis } from '../stores/processedDataStore'
import { useUIStore } from '../stores/uiStore'
import EEGVisualizer from './Visualizer/EEG/EEGVisualizer'
import PPGVisualizer from './Visualizer/PPG/PPGVisualizer'
import ACCVisualizer from './Visualizer/ACC/ACCVisualizer'

export function Visualizer() {
  // Phase 4: 새로운 스토어 Hook 사용
  const { systemStatus } = useSystemStatus()
  const { isConnected } = useDeviceStatus()
  const { isStreaming } = useStreamingStatus()
  const { initializeSystem } = useSystemActions()
  const signalQuality = useSignalQuality()
  const realtimeAnalysis = useRealtimeAnalysis()
  const { setActiveMenu } = useUIStore()

  // 시스템 초기화
  useEffect(() => {
    if (systemStatus === 'idle') {
      initializeSystem()
    }
  }, [systemStatus, initializeSystem])

  // 연결 상태 확인
  if (!isConnected) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-medium text-foreground">Visualizer</h1>
              <p className="text-muted-foreground">실시간 데이터 시각화</p>
            </div>
          </div>
          
          <Card className="p-8">
            <div className="flex flex-col items-center justify-center min-h-96">
              <div className="text-center">
                <div className="text-6xl mb-4">📡</div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  디바이스 연결 필요
                </h2>
                <p className="text-muted-foreground mb-6">
                  데이터 시각화를 위해 LINK BAND 디바이스를 연결해주세요.
                </p>
                <div className="flex flex-col items-center gap-6">
                  <Badge variant="outline" className="text-base px-4 py-2">
                    {systemStatus === 'initializing' ? '시스템 초기화 중...' : '연결 대기 중'}
                  </Badge>
                  <Button 
                    onClick={() => setActiveMenu('linkband')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-xl font-bold h-16 min-w-64 shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    Link Band 연결하기
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6 pb-20">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-medium text-foreground">Visualizer</h1>
            <p className="text-muted-foreground">실시간 데이터 시각화</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={isStreaming ? "default" : "secondary"}>
              {isStreaming ? "스트리밍 중" : "대기 중"}
            </Badge>
            <Badge variant={signalQuality.overall === 'excellent' ? "default" : 
                            signalQuality.overall === 'good' ? "secondary" : "destructive"}>
              신호 품질: {signalQuality.overall === 'excellent' ? '우수' : 
                        signalQuality.overall === 'good' ? '양호' : 
                        signalQuality.overall === 'fair' ? '보통' : '불량'}
            </Badge>
          </div>
        </div>

        {/* 실시간 분석 결과 요약 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {realtimeAnalysis.heartRate && (
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100">
                  <div className="w-6 h-6 text-red-600">❤️</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">심박수</p>
                  <p className="text-lg font-medium">{realtimeAnalysis.heartRate.toFixed(0)} BPM</p>
                </div>
              </div>
            </Card>
          )}
          
          {realtimeAnalysis.focusLevel && (
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <div className="w-6 h-6 text-blue-600">🧠</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">집중도</p>
                  <p className="text-lg font-medium">{realtimeAnalysis.focusLevel.toFixed(0)}%</p>
                </div>
              </div>
            </Card>
          )}
          
          {realtimeAnalysis.stressLevel && (
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100">
                  <div className="w-6 h-6 text-yellow-600">⚡</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">스트레스</p>
                  <p className="text-lg font-medium">{realtimeAnalysis.stressLevel.toFixed(0)}%</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* 탭 기반 시각화 */}
        <Card className="p-6 min-h-[900px]">
          <Tabs defaultValue="eeg" className="h-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="eeg">
                🧠 EEG 뇌파
              </TabsTrigger>
              <TabsTrigger value="ppg">
                ❤️ PPG 심박
              </TabsTrigger>
              <TabsTrigger value="acc">
                📱 ACC 가속도
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="eeg" className="mt-6 min-h-[800px]">
              <EEGVisualizer />
            </TabsContent>
            
            <TabsContent value="ppg" className="mt-6 min-h-[800px]">
              <PPGVisualizer />
            </TabsContent>
            
            <TabsContent value="acc" className="mt-6 min-h-[800px]">
              <ACCVisualizer />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}