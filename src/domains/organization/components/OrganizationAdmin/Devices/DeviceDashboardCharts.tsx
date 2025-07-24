import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card'

interface DeviceDashboardChartsProps {
  dashboard: {
    totalDevices: number
    activeDevices: number
    availableDevices: number
    maintenanceDevices: number
    lowBatteryDevices: number
    rentalDevices: number
    saleDevices: number
    assignedDevices: number
    unassignedDevices: number
    activeServiceRequests: number
    pendingApprovals: number
    averageUtilizationRate: number
    totalUsageHours: number
    costSummary: {
      monthlyRentalCost: number
      maintenanceCost: number
      pendingApprovals: number
    }
    topUsers: Array<{
      userId: string
      userName: string
      deviceCount: number
      utilizationRate: number
    }>
    expiringRentals: any[]
  }
}

export default function DeviceDashboardCharts({ dashboard }: DeviceDashboardChartsProps) {
  
  // 디바이스 상태 분포 데이터
  const statusDistribution = [
    { name: '사용중', value: dashboard.activeDevices, color: '#10b981' },
    { name: '사용 가능', value: dashboard.availableDevices, color: '#3b82f6' },
    { name: '정비중', value: dashboard.maintenanceDevices, color: '#f59e0b' },
    { name: '배터리 부족', value: dashboard.lowBatteryDevices, color: '#ef4444' }
  ]

  // 할당 타입 분포 데이터
  const allocationDistribution = [
    { name: '렌탈', value: dashboard.rentalDevices, color: '#3b82f6' },
    { name: '구매', value: dashboard.saleDevices, color: '#8b5cf6' }
  ]

  // 사용자 할당 현황
  const assignmentStatus = [
    { name: '할당됨', value: dashboard.assignedDevices, color: '#10b981' },
    { name: '미할당', value: dashboard.unassignedDevices, color: '#6b7280' }
  ]

  // 상위 사용자 데이터 (최대 5명)
  const topUsersData = dashboard.topUsers.slice(0, 5).map(user => ({
    name: user.userName,
    devices: user.deviceCount,
    utilization: user.utilizationRate
  }))

  // 월별 비용 데이터 (샘플)
  const monthlyData = [
    { month: '1월', rental: dashboard.costSummary.monthlyRentalCost * 0.8, maintenance: dashboard.costSummary.maintenanceCost * 0.7 },
    { month: '2월', rental: dashboard.costSummary.monthlyRentalCost * 0.9, maintenance: dashboard.costSummary.maintenanceCost * 0.8 },
    { month: '3월', rental: dashboard.costSummary.monthlyRentalCost * 1.1, maintenance: dashboard.costSummary.maintenanceCost * 0.9 },
    { month: '4월', rental: dashboard.costSummary.monthlyRentalCost * 1.0, maintenance: dashboard.costSummary.maintenanceCost * 1.1 },
    { month: '5월', rental: dashboard.costSummary.monthlyRentalCost * 0.95, maintenance: dashboard.costSummary.maintenanceCost * 1.0 },
    { month: '6월', rental: dashboard.costSummary.monthlyRentalCost, maintenance: dashboard.costSummary.maintenanceCost }
  ]

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  // 커스텀 툴팁 컴포넌트
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* 디바이스 상태 분포 */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="text-lg">디바이스 상태 분포</CardTitle>
          <CardDescription>현재 디바이스 상태별 분포</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 할당 타입 분포 */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="text-lg">할당 타입 분포</CardTitle>
          <CardDescription>렌탈 vs 구매 디바이스</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={allocationDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}대`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {allocationDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 사용자별 디바이스 현황 */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="text-lg">상위 사용자</CardTitle>
          <CardDescription>디바이스 보유 상위 사용자</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topUsersData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="devices" fill="#3b82f6" name="디바이스 수" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 사용자 할당 현황 */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="text-lg">사용자 할당 현황</CardTitle>
          <CardDescription>할당 vs 미할당 디바이스</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={assignmentStatus}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {assignmentStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {assignmentStatus.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.name}</span>
                </div>
                <span className="font-medium">{formatNumber(item.value)}대</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 월별 비용 추이 */}
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">월별 비용 추이</CardTitle>
          <CardDescription>렌탈비용 및 유지보수 비용</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `${Math.round(value / 10000)}만원`} />
              <Tooltip 
                formatter={(value: any) => [formatCurrency(value), '']}
                labelFormatter={(label) => `${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="rental" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="렌탈 비용"
              />
              <Line 
                type="monotone" 
                dataKey="maintenance" 
                stroke="#f59e0b" 
                strokeWidth={2}
                name="유지보수 비용"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 주요 메트릭 카드들 */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="text-lg">주요 메트릭</CardTitle>
          <CardDescription>핵심 지표 요약</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">평균 사용률</span>
            <span className="font-semibold">{dashboard.averageUtilizationRate}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">총 사용 시간</span>
            <span className="font-semibold">{formatNumber(dashboard.totalUsageHours)}시간</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">활성 A/S 요청</span>
            <span className="font-semibold text-orange-600">{dashboard.activeServiceRequests}건</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">승인 대기</span>
            <span className="font-semibold text-red-600">{dashboard.pendingApprovals}건</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">만료 예정 렌탈</span>
            <span className="font-semibold text-yellow-600">{dashboard.expiringRentals.length}건</span>
          </div>
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">월 렌탈 비용</span>
              <span className="font-semibold text-blue-600">
                {formatCurrency(dashboard.costSummary.monthlyRentalCost)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}