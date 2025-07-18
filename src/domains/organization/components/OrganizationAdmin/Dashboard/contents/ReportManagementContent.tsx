import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card'
import { FileText, TrendingUp, Clock, Users } from 'lucide-react'

export const ReportManagementContent: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">리포트 관리</h1>
        <p className="text-gray-600 mt-1">AI 리포트 현황 및 관리</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 리포트</p>
                <p className="text-2xl font-bold text-gray-900">8,450</p>
                <p className="text-xs text-gray-500 mt-1">이번 달</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">일일 평균</p>
                <p className="text-2xl font-bold text-gray-900">280</p>
                <p className="text-xs text-green-600 mt-1">+12% 증가</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">평균 처리 시간</p>
                <p className="text-2xl font-bold text-gray-900">2.5분</p>
                <p className="text-xs text-gray-500 mt-1">AI 분석</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">활성 사용자</p>
                <p className="text-2xl font-bold text-gray-900">1,250</p>
                <p className="text-xs text-gray-500 mt-1">리포트 요청</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">리포트 관리 기능</CardTitle>
          <CardDescription className="text-gray-600">리포트 시스템 관리 및 모니터링</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">리포트 관리 시스템</h3>
            <p className="text-gray-600 mb-4">상세한 리포트 관리 기능이 곧 추가될 예정입니다.</p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>• 리포트 생성 현황 모니터링</p>
              <p>• AI 엔진 성능 분석</p>
              <p>• 리포트 품질 관리</p>
              <p>• 사용자별 리포트 통계</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ReportManagementContent 