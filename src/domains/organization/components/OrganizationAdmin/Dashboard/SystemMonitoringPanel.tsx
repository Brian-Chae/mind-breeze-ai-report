import React, { useState, useEffect } from 'react'
import { Card } from '@ui/card'
import { Button } from '@ui/button'
import { Badge } from '@ui/badge'
import { 
  Monitor, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Cpu,
  HardDrive,
  Wifi,
  Database,
  Shield,
  Brain,
  Cloud,
  Clock,
  TrendingUp,
  Users,
  Server
} from 'lucide-react'
import systemAdminService, { 
  SystemHealth, 
  PerformanceMetrics, 
  ErrorLog 
} from '../../../services/SystemAdminService'

interface SystemMonitoringPanelProps {
  isVisible: boolean
  onClose: () => void
}

export default function SystemMonitoringPanel({ isVisible, onClose }: SystemMonitoringPanelProps) {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null)
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    if (isVisible) {
      loadMonitoringData()
    }
  }, [isVisible])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isVisible && autoRefresh) {
      interval = setInterval(() => {
        loadMonitoringData()
      }, 30000) // 30초마다 업데이트
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isVisible, autoRefresh])

  const loadMonitoringData = async () => {
    try {
      setIsLoading(true)

      const [health, performance, logs] = await Promise.allSettled([
        systemAdminService.getSystemHealth(),
        systemAdminService.getPerformanceMetrics(),
        systemAdminService.getErrorLogs({
          start: new Date(Date.now() - 24 * 60 * 60 * 1000), // 최근 24시간
          end: new Date()
        }, 20)
      ])

      if (health.status === 'fulfilled') {
        setSystemHealth(health.value)
      }

      if (performance.status === 'fulfilled') {
        setPerformanceMetrics(performance.value)
      }

      if (logs.status === 'fulfilled') {
        setErrorLogs(logs.value)
      }

      setLastUpdated(new Date())
    } catch (error) {
      console.error('모니터링 데이터 로드 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'critical': return <XCircle className="w-5 h-5 text-red-600" />
      default: return <Monitor className="w-5 h-5 text-gray-600" />
    }
  }

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'database': return <Database className="w-4 h-4" />
      case 'storage': return <HardDrive className="w-4 h-4" />
      case 'authentication': return <Shield className="w-4 h-4" />
      case 'aiEngine': return <Brain className="w-4 h-4" />
      default: return <Server className="w-4 h-4" />
    }
  }

  const getServiceStatusColor = (status: string) => {
    switch (status) {
      case 'up': return 'text-green-600 bg-green-50'
      case 'degraded': return 'text-yellow-600 bg-yellow-50'
      case 'down': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}일 ${hours}시간`
    if (hours > 0) return `${hours}시간 ${minutes}분`
    return `${minutes}분`
  }

  const formatBytes = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Monitor className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">시스템 모니터링</h2>
              <p className="text-sm text-gray-500">
                실시간 시스템 상태 및 성능 지표
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'bg-green-50 text-green-700' : ''}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                자동 새로고침
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadMonitoringData}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                새로고침
              </Button>
            </div>
            <Button variant="outline" onClick={onClose}>
              ✕
            </Button>
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isLoading && !systemHealth ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">모니터링 데이터 로드 중...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 시스템 전체 상태 */}
              {systemHealth && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">시스템 상태</h3>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(systemHealth.status)}
                      <span className={`font-medium ${getStatusColor(systemHealth.status)}`}>
                        {systemHealth.status === 'healthy' ? '정상' : 
                         systemHealth.status === 'warning' ? '주의' : '위험'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-500">가동 시간</p>
                        <p className="font-semibold">{formatUptime(systemHealth.uptime)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Cpu className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-500">CPU 사용률</p>
                        <p className="font-semibold">{systemHealth.performance.cpuUsage.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Activity className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-500">메모리 사용률</p>
                        <p className="font-semibold">{systemHealth.performance.memoryUsage.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Wifi className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="text-sm text-gray-500">네트워크 지연</p>
                        <p className="font-semibold">{systemHealth.performance.networkLatency.toFixed(0)}ms</p>
                      </div>
                    </div>
                  </div>

                  {/* 서비스 상태 */}
                  <h4 className="text-md font-medium text-gray-900 mb-3">서비스 상태</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(systemHealth.services).map(([service, status]) => (
                      <div key={service} className="flex items-center space-x-2 p-3 border rounded-lg">
                        {getServiceIcon(service)}
                        <div className="flex-1">
                          <p className="text-sm font-medium capitalize">
                            {service === 'aiEngine' ? 'AI 엔진' : 
                             service === 'database' ? '데이터베이스' :
                             service === 'storage' ? '스토리지' :
                             service === 'authentication' ? '인증' : service}
                          </p>
                          <Badge className={`text-xs ${getServiceStatusColor(status)}`}>
                            {status === 'up' ? '정상' : status === 'degraded' ? '지연' : '중단'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 활성 알림 */}
                  {systemHealth.alerts.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-md font-medium text-gray-900 mb-3">활성 알림</h4>
                      <div className="space-y-2">
                        {systemHealth.alerts.map((alert) => (
                          <div key={alert.id} className={`p-3 rounded-lg border-l-4 ${
                            alert.type === 'critical' ? 'bg-red-50 border-red-500' :
                            alert.type === 'error' ? 'bg-red-50 border-red-400' :
                            'bg-yellow-50 border-yellow-400'
                          }`}>
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">{alert.message}</p>
                              <span className="text-xs text-gray-500">
                                {alert.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {/* 성능 지표 */}
              {performanceMetrics && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">성능 지표</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* 응답 시간 */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">응답 시간</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">평균</span>
                          <span className="font-semibold">{performanceMetrics.responseTime.average.toFixed(0)}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">P95</span>
                          <span className="font-semibold">{performanceMetrics.responseTime.p95.toFixed(0)}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">P99</span>
                          <span className="font-semibold">{performanceMetrics.responseTime.p99.toFixed(0)}ms</span>
                        </div>
                      </div>
                    </div>

                    {/* 처리량 */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">처리량</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">요청/초</span>
                          <span className="font-semibold">{performanceMetrics.throughput.requestsPerSecond.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">리포트/시간</span>
                          <span className="font-semibold">{performanceMetrics.throughput.reportsPerHour.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">측정/시간</span>
                          <span className="font-semibold">{performanceMetrics.throughput.measurementsPerHour.toFixed(0)}</span>
                        </div>
                      </div>
                    </div>

                    {/* 사용자 지표 */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">사용자 지표</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">활성 사용자</span>
                          <span className="font-semibold">{performanceMetrics.userMetrics.activeUsers}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">동시 세션</span>
                          <span className="font-semibold">{performanceMetrics.userMetrics.concurrentSessions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">평균 세션</span>
                          <span className="font-semibold">{performanceMetrics.userMetrics.averageSessionDuration.toFixed(1)}분</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 에러율 및 리소스 사용량 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">에러율</h4>
                      <div className={`text-2xl font-bold ${
                        performanceMetrics.errorRate < 1 ? 'text-green-600' :
                        performanceMetrics.errorRate < 5 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {performanceMetrics.errorRate.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">스토리지 사용량</h4>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatBytes(performanceMetrics.resourceUsage.storage * 1024 * 1024 * 1024)}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* 최근 에러 로그 */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 에러 로그 (24시간)</h3>
                
                {errorLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                    <p className="text-gray-500">최근 24시간 동안 에러가 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {errorLogs.map((log) => (
                      <div key={log.id} className={`p-4 rounded-lg border-l-4 ${
                        log.level === 'error' ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-400'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <Badge className={log.level === 'error' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                                {log.level.toUpperCase()}
                              </Badge>
                              <span className="text-sm font-medium text-gray-600">{log.service}</span>
                            </div>
                            <p className="text-sm text-gray-900 mb-1">{log.message}</p>
                            {log.organizationId && (
                              <p className="text-xs text-gray-500">조직: {log.organizationId}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              {log.timestamp.toLocaleString()}
                            </p>
                            {log.resolved && (
                              <Badge className="mt-1 bg-green-100 text-green-800">해결됨</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* 마지막 업데이트 시간 */}
              <div className="text-center text-sm text-gray-500">
                마지막 업데이트: {lastUpdated.toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 