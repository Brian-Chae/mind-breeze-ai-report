import React, { useState } from 'react'
import { Brain, Plus, Eye, Download, Send, Search, Filter, CheckCircle, AlertCircle, Clock, Star, BarChart3, FileText, User, Calendar, TrendingUp, MoreHorizontal, Edit, Trash2, Play, Pause, RefreshCw } from 'lucide-react'
import { Card } from '../../ui/card'
import { Button } from '../../ui/button'
import { Badge } from '../../ui/badge'
import { Input } from '../../ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown-menu'

interface AIReportSectionProps {
  subSection: string;
}

export default function AIReportSection({ subSection }: AIReportSectionProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const renderReportGeneration = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">AI 리포트 생성</h2>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          새 리포트 생성
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">리포트 생성 설정</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">리포트 유형</label>
              <select className="mt-1 w-full p-2 border border-gray-300 rounded-md">
                <option>스트레스 분석</option>
                <option>집중력 분석</option>
                <option>웰니스 종합</option>
                <option>개인 맞춤</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">대상 사용자</label>
              <Input placeholder="사용자 선택" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">기간</label>
              <div className="flex space-x-2">
                <Input type="date" />
                <Input type="date" />
              </div>
            </div>
            <Button className="w-full">
              <Brain className="w-4 h-4 mr-2" />
              리포트 생성 시작
            </Button>
          </div>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">생성 현황</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">진행 중인 작업</span>
              <Badge className="bg-yellow-100 text-yellow-600">3개</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">완료된 작업</span>
              <Badge className="bg-green-100 text-green-600">27개</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">실패한 작업</span>
              <Badge className="bg-red-100 text-red-600">2개</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )

  const renderReportList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">리포트 목록</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            일괄 다운로드
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            새 리포트
          </Button>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="리포트 제목이나 사용자로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          필터
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">스트레스 관리 분석 리포트 #{i}</h3>
                  <p className="text-sm text-gray-600">김건강 • 2024-01-15</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge className="bg-green-100 text-green-600">완료</Badge>
                <Badge variant="outline">품질: 92%</Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="w-4 h-4 mr-2" />
                      미리보기
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="w-4 h-4 mr-2" />
                      다운로드
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Send className="w-4 h-4 mr-2" />
                      메일 발송
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">생성일: 2024-01-15</span>
              </div>
              <div className="flex items-center space-x-2">
                <Download className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">다운로드: 5회</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">품질 점수: 92%</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderQualityManagement = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">품질 관리</h2>
        <Button variant="outline">
          <BarChart3 className="w-4 h-4 mr-2" />
          품질 리포트
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">품질 지표</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">평균 품질 점수</span>
              <span className="text-sm font-semibold text-green-600">89.5%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">생성 성공률</span>
              <span className="text-sm font-semibold text-green-600">94.2%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">재시도율</span>
              <span className="text-sm font-semibold text-yellow-600">5.8%</span>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">품질 개선 제안</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <span className="text-sm text-gray-600">데이터 품질 향상</span>
            </div>
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
              <span className="text-sm text-gray-600">알고리즘 최적화</span>
            </div>
            <div className="flex items-start space-x-2">
              <Clock className="w-4 h-4 text-blue-500 mt-0.5" />
              <span className="text-sm text-gray-600">처리 시간 단축</span>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">시스템 상태</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">AI 엔진 정상</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">데이터 파이프라인 정상</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-600">리포트 생성 지연</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (subSection) {
      case 'report-generation':
        return renderReportGeneration()
      case 'report-list':
        return renderReportList()
      case 'report-quality':
        return renderQualityManagement()
      default:
        return renderReportGeneration()
    }
  }

  return <div>{renderContent()}</div>
} 