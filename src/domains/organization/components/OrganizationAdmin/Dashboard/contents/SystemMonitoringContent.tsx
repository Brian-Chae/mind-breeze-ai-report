import React, { useState, useEffect } from 'react'
import { Card } from '@shared/components/ui/card'
import { Button } from '@shared/components/ui/button'
import { Badge } from '@shared/components/ui/badge'
import { Input } from '@shared/components/ui/input'
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
  Server,
  Clock,
  TrendingUp,
  Users,
  Search,
  Filter,
  Download,
  Settings
} from 'lucide-react'
import systemAdminService, { 
  SystemHealth, 
  PerformanceMetrics, 
  ErrorLog 
} from '../../../../services/SystemAdminService'

export default function SystemMonitoringContent() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null)
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')

  useEffect(() => {
    loadMonitoringData()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (autoRefresh) {
      interval = setInterval(() => {
        loadMonitoringData()
      }, 30000) // 30초마다 업데이트
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const loadMonitoringData = async () => {
    try {
      setIsLoading(true)

      const [health, performance, logs] = await Promise.allSettled([
        systemAdminService.getSystemHealth(),
        systemAdminService.getPerformanceMetrics(),
        systemAdminService.getErrorLogs({
          start: new Date(Date.now() - 24 * 60 * 60 * 1000), // 최근 24시간
          end: new Date()
        }, 50)
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

  const filteredErrorLogs = errorLogs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.service.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = selectedFilter === 'all' || log.level === selectedFilter
    return matchesSearch && matchesFilter
  })

  return (
    <div className="h-full p-6 w-full">
      <div className="w-full space-y-6">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            시스템 모니터링
          </h1>
          <p className="text-gray-600 text-lg">
            실시간 시스템 상태 및 성능 지표
          </p>
        </div>

        {/* Control Panel */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">시스템 상태 제어</h2>
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
          </div>

          <div className="text-center text-sm text-gray-500">
            마지막 업데이트: {lastUpdated.toLocaleString()}
          </div>
        </div>

        {/* System Overview */}
        {systemHealth && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center space-x-3">
                <Clock className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">가동 시간</p>
                  <p className="text-2xl font-bold text-gray-900">{formatUptime(systemHealth.uptime)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center space-x-3">
                <Cpu className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-500">CPU 사용률</p>
                  <p className="text-2xl font-bold text-gray-900">{systemHealth.performance.cpuUsage.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center space-x-3">
                <Activity className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-500">메모리 사용률</p>
                  <p className="text-2xl font-bold text-gray-900">{systemHealth.performance.memoryUsage.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center space-x-3">
                <Wifi className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-500">네트워크 지연</p>
                  <p className="text-2xl font-bold text-gray-900">{systemHealth.performance.networkLatency.toFixed(0)}ms</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System Health Status */}
        {systemHealth && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">시스템 상태</h2>
              <div className="flex items-center space-x-2">
                {getStatusIcon(systemHealth.status)}
                <span className={`font-medium ${getStatusColor(systemHealth.status)}`}>
                  {systemHealth.status === 'healthy' ? '정상' : 
                   systemHealth.status === 'warning' ? '주의' : '위험'}
                </span>
              </div>
            </div>

            {/* 서비스 상태 */}
            <h3 className="text-md font-medium text-gray-900 mb-4">서비스 상태</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {Object.entries(systemHealth.services).map(([service, status]) => (
                <div key={service} className="flex items-center space-x-2 p-4 border border-gray-200 rounded-lg">
                  {getServiceIcon(service)}
                  <div className="flex-1">
                    <p className="text-sm font-medium capitalize text-gray-900">
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
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">활성 알림</h3>
                <div className="space-y-3">
                  {systemHealth.alerts.map((alert: SystemHealth['alerts'][0]) => (
                    <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${
                      alert.type === 'critical' ? 'bg-red-50 border-red-500' :
                      alert.type === 'error' ? 'bg-red-50 border-red-400' :
                      'bg-yellow-50 border-yellow-400'
                    }`}>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                        <span className="text-xs text-gray-500">
                          {alert.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Performance Metrics */}
        {performanceMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 성능 지표 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">성능 지표</h2>
              
              <div className="space-y-6">
                {/* 응답 시간 */}
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-3">응답 시간</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">평균</span>
                      <span className="font-semibold text-gray-900">{performanceMetrics.responseTime.average.toFixed(0)}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">P95</span>
                      <span className="font-semibold text-gray-900">{performanceMetrics.responseTime.p95.toFixed(0)}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">P99</span>
                      <span className="font-semibold text-gray-900">{performanceMetrics.responseTime.p99.toFixed(0)}ms</span>
                    </div>
                  </div>
                </div>

                {/* 처리량 */}
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-3">처리량</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">요청/초</span>
                      <span className="font-semibold text-gray-900">{performanceMetrics.throughput.requestsPerSecond.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">리포트/시간</span>
                      <span className="font-semibold text-gray-900">{performanceMetrics.throughput.reportsPerHour.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">측정/시간</span>
                      <span className="font-semibold text-gray-900">{performanceMetrics.throughput.measurementsPerHour.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 사용자 및 리소스 지표 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">사용자 & 리소스</h2>
              
              <div className="space-y-6">
                {/* 사용자 지표 */}
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-3">사용자 지표</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">활성 사용자</span>
                      <span className="font-semibold text-gray-900">{performanceMetrics.userMetrics.activeUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">동시 세션</span>
                      <span className="font-semibold text-gray-900">{performanceMetrics.userMetrics.concurrentSessions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">평균 세션</span>
                      <span className="font-semibold text-gray-900">{performanceMetrics.userMetrics.averageSessionDuration.toFixed(1)}분</span>
                    </div>
                  </div>
                </div>

                {/* 리소스 사용량 */}
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-3">리소스 사용량</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">에러율</span>
                      <span className={`font-semibold ${
                        performanceMetrics.errorRate < 1 ? 'text-green-600' :
                        performanceMetrics.errorRate < 5 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {performanceMetrics.errorRate.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">스토리지 사용량</span>
                      <span className="font-semibold text-blue-600">
                        {formatBytes(performanceMetrics.resourceUsage.storage * 1024 * 1024 * 1024)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

                {/* Error Logs */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">에러 로그 (24시간)</h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                로그 다운로드
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                로그 설정
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="에러 메시지, 서비스명 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select 
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value as string)}
                className="bg-white border border-gray-200 rounded-md px-3 py-2 text-gray-900"
              >
                <option value="all">모든 로그</option>
                <option value="error">에러</option>
                <option value="warning">경고</option>
                <option value="info">정보</option>
              </select>
            </div>
          </div>

          {filteredErrorLogs.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <p className="text-gray-500">
                {errorLogs.length === 0 
                  ? "최근 24시간 동안 에러가 없습니다." 
                  : "검색 조건에 맞는 로그가 없습니다."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredErrorLogs.map((log) => (
                <div key={log.id} className={`p-4 rounded-lg border-l-4 ${
                  log.level === 'error' ? 'bg-red-50 border-red-500' : 
                  log.level === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                  'bg-blue-50 border-blue-400'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={
                          log.level === 'error' ? 'bg-red-100 text-red-800' : 
                          log.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }>
                          {log.level.toUpperCase()}
                        </Badge>
                        <span className="text-sm font-medium text-gray-900">{log.service}</span>
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
        </div>
      </div>
    </div>
  )
} 