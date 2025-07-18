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
  Settings,
  Zap,
  MemoryStick,
  Globe,
  AlertCircle
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
          start: new Date(Date.now() - 24 * 60 * 60 * 1000),
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
      case 'healthy': return 'text-emerald-600'
      case 'warning': return 'text-amber-600'
      case 'critical': return 'text-red-600'
      default: return 'text-slate-600'
    }
  }

  const getStatusBadgeColor = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'warning': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  const getStatusIcon = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-emerald-500" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />
      case 'critical': return <XCircle className="w-5 h-5 text-red-500" />
      default: return <Monitor className="w-5 h-5 text-slate-500" />
    }
  }

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'database': return <Database className="w-5 h-5 text-blue-500" />
      case 'storage': return <HardDrive className="w-5 h-5 text-purple-500" />
      case 'authentication': return <Shield className="w-5 h-5 text-green-500" />
      case 'aiEngine': return <Brain className="w-5 h-5 text-pink-500" />
      default: return <Server className="w-5 h-5 text-slate-500" />
    }
  }

  const getServiceStatusColor = (status: string) => {
    switch (status) {
      case 'up': return 'text-emerald-700 bg-emerald-50 border-emerald-200'
      case 'degraded': return 'text-amber-700 bg-amber-50 border-amber-200'
      case 'down': return 'text-red-700 bg-red-50 border-red-200'
      default: return 'text-slate-700 bg-slate-50 border-slate-200'
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

  if (isLoading && !systemHealth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">시스템 상태 확인 중</h3>
              <p className="text-slate-500">실시간 모니터링 데이터를 불러오고 있습니다...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Monitor className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-3">시스템 모니터링</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            실시간 시스템 상태 및 성능 지표를 한눈에 확인하세요
          </p>
        </div>

        {/* Control Panel */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-slate-500" />
                <span className="text-sm text-slate-600">
                  마지막 업데이트: {lastUpdated.toLocaleTimeString()}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? "bg-emerald-500 hover:bg-emerald-600" : ""}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                자동 새로고침 {autoRefresh ? 'ON' : 'OFF'}
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
        </div>

        {/* System Status Overview */}
        {systemHealth && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Uptime Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                  가동시간
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-slate-800">
                  {formatUptime(systemHealth.uptime)}
                </p>
                <p className="text-sm text-slate-500">연속 운영 중</p>
              </div>
            </div>

            {/* CPU Usage Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl">
                  <Cpu className="w-6 h-6 text-green-600" />
                </div>
                <Badge className={`${
                  systemHealth.performance.cpuUsage > 80 ? 'bg-red-100 text-red-700 border-red-200' :
                  systemHealth.performance.cpuUsage > 60 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                  'bg-green-100 text-green-700 border-green-200'
                }`}>
                  CPU
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-slate-800">
                  {systemHealth.performance.cpuUsage.toFixed(1)}%
                </p>
                <p className="text-sm text-slate-500">사용률</p>
              </div>
            </div>

            {/* Memory Usage Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl">
                  <MemoryStick className="w-6 h-6 text-purple-600" />
                </div>
                <Badge className={`${
                  systemHealth.performance.memoryUsage > 80 ? 'bg-red-100 text-red-700 border-red-200' :
                  systemHealth.performance.memoryUsage > 60 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                  'bg-purple-100 text-purple-700 border-purple-200'
                }`}>
                  메모리
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-slate-800">
                  {systemHealth.performance.memoryUsage.toFixed(1)}%
                </p>
                <p className="text-sm text-slate-500">사용률</p>
              </div>
            </div>

            {/* Network Latency Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-xl">
                  <Globe className="w-6 h-6 text-orange-600" />
                </div>
                <Badge className={`${
                  systemHealth.performance.networkLatency > 100 ? 'bg-red-100 text-red-700 border-red-200' :
                  systemHealth.performance.networkLatency > 50 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                  'bg-orange-100 text-orange-700 border-orange-200'
                }`}>
                  네트워크
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-slate-800">
                  {systemHealth.performance.networkLatency.toFixed(0)}ms
                </p>
                <p className="text-sm text-slate-500">지연시간</p>
              </div>
            </div>
          </div>
        )}

        {/* System Health Status */}
        {systemHealth && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-12 h-12 bg-slate-100 rounded-xl">
                  <Activity className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">시스템 상태</h2>
                  <p className="text-slate-500">핵심 서비스 운영 현황</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {getStatusIcon(systemHealth.status)}
                <Badge className={`text-sm font-medium border ${getStatusBadgeColor(systemHealth.status)}`}>
                  {systemHealth.status === 'healthy' ? '🟢 정상 운영' : 
                   systemHealth.status === 'warning' ? '🟡 주의 필요' : '🔴 긴급 상황'}
                </Badge>
              </div>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(systemHealth.services).map(([service, status]) => (
                <div key={service} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    {getServiceIcon(service)}
                    <Badge className={`text-xs font-medium border ${getServiceStatusColor(status)}`}>
                      {status === 'up' ? '정상' : status === 'degraded' ? '지연' : '중단'}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-1">
                    {service === 'aiEngine' ? 'AI 엔진' : 
                     service === 'database' ? '데이터베이스' :
                     service === 'storage' ? '스토리지' :
                     service === 'authentication' ? '인증' : service}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {status === 'up' ? '정상 작동 중' : 
                     status === 'degraded' ? '성능 저하' : '서비스 중단'}
                  </p>
                </div>
              ))}
            </div>

            {/* Active Alerts */}
            {systemHealth.alerts.length > 0 && (
              <div className="mt-8 p-6 bg-amber-50 rounded-xl border border-amber-200">
                <div className="flex items-center space-x-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <h3 className="font-semibold text-amber-800">활성 알림</h3>
                  <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                    {systemHealth.alerts.length}개
                  </Badge>
                </div>
                <div className="space-y-3">
                  {systemHealth.alerts.map((alert: SystemHealth['alerts'][0]) => (
                    <div key={alert.id} className="bg-white rounded-lg p-4 border border-amber-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-slate-800 mb-1">{alert.message}</p>
                          <span className="text-xs text-slate-500">
                            {alert.timestamp.toLocaleString()}
                          </span>
                        </div>
                        <Badge className={`ml-4 ${
                          alert.type === 'critical' ? 'bg-red-100 text-red-800 border-red-200' :
                          alert.type === 'error' ? 'bg-red-100 text-red-700 border-red-200' :
                          'bg-amber-100 text-amber-800 border-amber-200'
                        }`}>
                          {alert.type}
                        </Badge>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Performance Metrics Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">성능 지표</h2>
                  <p className="text-slate-500">응답시간 및 처리량</p>
                </div>
              </div>
              
              <div className="space-y-8">
                {/* Response Time */}
                <div className="bg-slate-50 rounded-xl p-6">
                  <h3 className="font-semibold text-slate-700 mb-4 flex items-center">
                    <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                    응답 시간
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-800">
                        {performanceMetrics.responseTime.average.toFixed(0)}ms
                      </p>
                      <p className="text-sm text-slate-500">평균</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-800">
                        {performanceMetrics.responseTime.p95.toFixed(0)}ms
                      </p>
                      <p className="text-sm text-slate-500">P95</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-800">
                        {performanceMetrics.responseTime.p99.toFixed(0)}ms
                      </p>
                      <p className="text-sm text-slate-500">P99</p>
                    </div>
                  </div>
                </div>

                {/* Throughput */}
                <div className="bg-slate-50 rounded-xl p-6">
                  <h3 className="font-semibold text-slate-700 mb-4 flex items-center">
                    <Activity className="w-4 h-4 mr-2 text-green-500" />
                    처리량
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">요청/초</span>
                      <span className="font-bold text-slate-800">
                        {performanceMetrics.throughput.requestsPerSecond.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">리포트/시간</span>
                      <span className="font-bold text-slate-800">
                        {performanceMetrics.throughput.reportsPerHour.toFixed(0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">측정/시간</span>
                      <span className="font-bold text-slate-800">
                        {performanceMetrics.throughput.measurementsPerHour.toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* User & Resource Metrics Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-xl">
                  <Users className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">사용자 & 리소스</h2>
                  <p className="text-slate-500">사용량 및 에러율</p>
                </div>
              </div>
              
              <div className="space-y-8">
                {/* User Metrics */}
                <div className="bg-slate-50 rounded-xl p-6">
                  <h3 className="font-semibold text-slate-700 mb-4 flex items-center">
                    <Users className="w-4 h-4 mr-2 text-blue-500" />
                    사용자 현황
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">활성 사용자</span>
                      <span className="font-bold text-slate-800">
                        {performanceMetrics.userMetrics.activeUsers}명
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">동시 세션</span>
                      <span className="font-bold text-slate-800">
                        {performanceMetrics.userMetrics.concurrentSessions}개
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">평균 세션</span>
                      <span className="font-bold text-slate-800">
                        {performanceMetrics.userMetrics.averageSessionDuration.toFixed(1)}분
                      </span>
                    </div>
                  </div>
                </div>

                {/* Resource Usage */}
                <div className="bg-slate-50 rounded-xl p-6">
                  <h3 className="font-semibold text-slate-700 mb-4 flex items-center">
                    <HardDrive className="w-4 h-4 mr-2 text-purple-500" />
                    리소스 사용량
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">에러율</span>
                      <Badge className={`font-bold ${
                        performanceMetrics.errorRate < 1 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                        performanceMetrics.errorRate < 5 ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                        'bg-red-100 text-red-700 border-red-200'
                      }`}>
                        {performanceMetrics.errorRate.toFixed(2)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">스토리지</span>
                      <span className="font-bold text-blue-600">
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
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">에러 로그</h2>
                <p className="text-slate-500">최근 24시간 로그 기록</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" className="text-slate-600 border-slate-300">
                <Download className="w-4 h-4 mr-2" />
                다운로드
              </Button>
              <Button variant="outline" size="sm" className="text-slate-600 border-slate-300">
                <Settings className="w-4 h-4 mr-2" />
                설정
              </Button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="에러 메시지, 서비스명으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 py-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <select 
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value as string)}
                className="px-4 py-3 border border-slate-300 rounded-xl text-slate-700 focus:border-blue-500 focus:ring-blue-500 bg-white"
              >
                <option value="all">모든 로그</option>
                <option value="error">에러</option>
                <option value="warning">경고</option>
                <option value="info">정보</option>
              </select>
            </div>
          </div>

          {/* Error Log List */}
          {filteredErrorLogs.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                {errorLogs.length === 0 ? "모든 시스템이 정상입니다" : "검색 결과가 없습니다"}
              </h3>
              <p className="text-slate-500">
                {errorLogs.length === 0 
                  ? "최근 24시간 동안 에러가 발생하지 않았습니다." 
                  : "검색 조건에 맞는 로그를 찾을 수 없습니다."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredErrorLogs.map((log) => (
                <div key={log.id} className={`rounded-xl border-2 p-6 ${
                  log.level === 'error' ? 'bg-red-50 border-red-200' : 
                  log.level === 'warning' ? 'bg-amber-50 border-amber-200' :
                  'bg-blue-50 border-blue-200'
                } hover:shadow-md transition-shadow`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <Badge className={`font-medium ${
                          log.level === 'error' ? 'bg-red-100 text-red-800 border-red-300' : 
                          log.level === 'warning' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                          'bg-blue-100 text-blue-800 border-blue-300'
                        }`}>
                          {log.level.toUpperCase()}
                        </Badge>
                        <span className="font-semibold text-slate-800">{log.service}</span>
                      </div>
                      <p className="text-slate-700 mb-2 leading-relaxed">{log.message}</p>
                      {log.organizationId && (
                        <p className="text-sm text-slate-500">조직: {log.organizationId}</p>
                      )}
                    </div>
                    <div className="text-right ml-6">
                      <p className="text-sm text-slate-500 mb-2">
                        {log.timestamp.toLocaleString()}
                      </p>
                      {log.resolved && (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                          ✓ 해결됨
                        </Badge>
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