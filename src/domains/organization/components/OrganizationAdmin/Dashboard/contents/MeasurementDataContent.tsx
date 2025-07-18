import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card'
import { Database, Activity, HardDrive, Zap } from 'lucide-react'

export const MeasurementDataContent: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">측정 데이터 관리</h1>
        <p className="text-gray-600 mt-1">EEG, PPG 측정 데이터 현황 및 관리</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 측정 세션</p>
                <p className="text-2xl font-bold text-gray-900">15,420</p>
                <p className="text-xs text-gray-500 mt-1">이번 달</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">데이터 용량</p>
                <p className="text-2xl font-bold text-gray-900">2.8TB</p>
                <p className="text-xs text-green-600 mt-1">+5.2% 증가</p>
              </div>
              <HardDrive className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">일일 수집량</p>
                <p className="text-2xl font-bold text-gray-900">95GB</p>
                <p className="text-xs text-gray-500 mt-1">평균</p>
              </div>
              <Database className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">실시간 세션</p>
                <p className="text-2xl font-bold text-gray-900">145</p>
                <p className="text-xs text-gray-500 mt-1">진행 중</p>
              </div>
              <Zap className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">데이터 타입별 현황</CardTitle>
            <CardDescription className="text-gray-600">측정 데이터 유형별 통계</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">EEG 데이터</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">1.6TB</p>
                  <p className="text-sm text-gray-500">57.1%</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">PPG 데이터</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">0.8TB</p>
                  <p className="text-sm text-gray-500">28.6%</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">ACC 데이터</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">0.4TB</p>
                  <p className="text-sm text-gray-500">14.3%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">데이터 관리 기능</CardTitle>
            <CardDescription className="text-gray-600">측정 데이터 시스템 관리</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">데이터 관리 시스템</h3>
              <p className="text-gray-600 mb-4">고급 데이터 관리 기능이 곧 추가될 예정입니다.</p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>• 데이터 품질 검증</p>
                <p>• 자동 백업 및 복구</p>
                <p>• 데이터 압축 및 최적화</p>
                <p>• 실시간 모니터링</p>
                <p>• 데이터 생명주기 관리</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default MeasurementDataContent 