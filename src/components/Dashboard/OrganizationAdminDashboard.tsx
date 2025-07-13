import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Building2, 
  CreditCard, 
  Users, 
  Activity, 
  BarChart3,
  Settings,
  TrendingUp,
  DollarSign,
  UserCheck,
  AlertCircle,
  CheckCircle,
  Plus,
  Eye,
  FileText,
  Download
} from 'lucide-react';

interface OrganizationAdminDashboardProps {
  user: {
    displayName: string;
    email?: string;
    userType: string;
    organizationId: string;
  };
  organization?: {
    name: string;
    id: string;
    creditBalance: number;
    memberCount: number;
    totalMeasurements: number;
  };
  permissions?: string[];
  isSystemAdmin?: boolean;
}

export default function OrganizationAdminDashboard({ 
  user, 
  organization, 
  permissions = [],
  isSystemAdmin = false 
}: OrganizationAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'credits' | 'analytics'>('overview');

  // 모의 데이터 (실제 구현 시 API에서 가져올 데이터)
  const mockData = {
    organization: organization || {
      name: "샘플 기업",
      id: "org_sample",
      creditBalance: 2500,
      memberCount: 12,
      totalMeasurements: 348
    },
    recentMeasurements: [
      { id: 1, subject: "홍길동", measuredBy: "이담당자", date: "2024-01-15", status: "완료" },
      { id: 2, subject: "김철수", measuredBy: "박담당자", date: "2024-01-15", status: "완료" },
      { id: 3, subject: "이영희", measuredBy: "이담당자", date: "2024-01-14", status: "완료" },
    ],
    members: [
      { id: 1, name: "이담당자", email: "lee@company.com", role: "현장 담당자", measurements: 156, status: "활성" },
      { id: 2, name: "박담당자", email: "park@company.com", role: "현장 담당자", measurements: 89, status: "활성" },
      { id: 3, name: "최담당자", email: "choi@company.com", role: "현장 담당자", measurements: 103, status: "활성" },
    ],
    analytics: {
      thisMonth: {
        measurements: 156,
        members: 12,
        subjects: 245,
        creditUsed: 234
      },
      lastMonth: {
        measurements: 134,
        members: 11,
        subjects: 201,
        creditUsed: 201
      }
    }
  };

  const getChangePercentage = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className="p-6 space-y-6">
      {/* 상단 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">기업 관리자 대시보드</h1>
          <p className="text-gray-600">안녕하세요, {user.displayName}님! ({mockData.organization.name})</p>
        </div>
        <div className="flex items-center gap-3">
          {isSystemAdmin && (
            <Badge variant="destructive" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              시스템 관리자
            </Badge>
          )}
          <Badge variant="default" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            기업 관리자
          </Badge>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2 px-1 border-b-2 transition-colors ${
            activeTab === 'overview' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          전체 현황
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`pb-2 px-1 border-b-2 transition-colors ${
            activeTab === 'members' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          현장 담당자 관리
        </button>
        <button
          onClick={() => setActiveTab('credits')}
          className={`pb-2 px-1 border-b-2 transition-colors ${
            activeTab === 'credits' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          크레딧 관리
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-2 px-1 border-b-2 transition-colors ${
            activeTab === 'analytics' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          분석 리포트
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 주요 지표 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <CreditCard className="w-4 h-4 text-green-600" />
                  크레딧 잔액
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {mockData.organization.creditBalance.toLocaleString()}
                </div>
                <p className="text-xs text-gray-600">사용 가능한 크레딧</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-blue-600" />
                  현장 담당자
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {mockData.organization.memberCount}
                </div>
                <p className="text-xs text-gray-600">활성 담당자 수</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Activity className="w-4 h-4 text-purple-600" />
                  총 측정 수
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {mockData.organization.totalMeasurements}
                </div>
                <p className="text-xs text-gray-600">누적 측정 수</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-orange-600" />
                  월간 성장률
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  +{getChangePercentage(mockData.analytics.thisMonth.measurements, mockData.analytics.lastMonth.measurements).toFixed(1)}%
                </div>
                <p className="text-xs text-gray-600">측정 기준</p>
              </CardContent>
            </Card>
          </div>

          {/* 최근 측정 현황 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                최근 측정 현황
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockData.recentMeasurements.map((measurement) => (
                  <div key={measurement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">{measurement.subject}</p>
                        <p className="text-sm text-gray-600">측정자: {measurement.measuredBy}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{measurement.date}</p>
                      <Badge variant="outline" className="text-xs">
                        {measurement.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" className="w-full">
                  <Eye className="w-4 h-4 mr-2" />
                  전체 측정 기록 보기
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">현장 담당자 관리</h2>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              새 담당자 추가
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {mockData.members.map((member) => (
                  <div key={member.id} className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm font-medium">{member.measurements} 측정</p>
                          <p className="text-xs text-gray-600">{member.role}</p>
                        </div>
                        <Badge variant={member.status === '활성' ? 'default' : 'secondary'}>
                          {member.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          관리
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'credits' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">크레딧 관리</h2>
            <Button>
              <DollarSign className="w-4 h-4 mr-2" />
              크레딧 구매
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-green-600" />
                  현재 크레딧
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {mockData.organization.creditBalance.toLocaleString()}
                </div>
                <p className="text-sm text-gray-600">사용 가능한 크레딧</p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>이번 달 사용</span>
                    <span>{mockData.analytics.thisMonth.creditUsed}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>지난 달 사용</span>
                    <span>{mockData.analytics.lastMonth.creditUsed}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  사용 현황
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">측정 비용</span>
                    <span className="font-medium">80%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '80%' }}></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">AI 분석 비용</span>
                    <span className="font-medium">20%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '20%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">분석 리포트</h2>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              리포트 다운로드
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  월간 성과
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>측정 수</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{mockData.analytics.thisMonth.measurements}</span>
                      <Badge variant="outline" className="text-xs">
                        +{getChangePercentage(mockData.analytics.thisMonth.measurements, mockData.analytics.lastMonth.measurements).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>측정 대상자</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{mockData.analytics.thisMonth.subjects}</span>
                      <Badge variant="outline" className="text-xs">
                        +{getChangePercentage(mockData.analytics.thisMonth.subjects, mockData.analytics.lastMonth.subjects).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>크레딧 사용</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{mockData.analytics.thisMonth.creditUsed}</span>
                      <Badge variant="outline" className="text-xs">
                        +{getChangePercentage(mockData.analytics.thisMonth.creditUsed, mockData.analytics.lastMonth.creditUsed).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  주요 인사이트
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">이번 달 측정 수 증가</p>
                      <p className="text-xs text-gray-600">전월 대비 16% 증가했습니다.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">효율적인 크레딧 사용</p>
                      <p className="text-xs text-gray-600">예산 범위 내에서 운영 중입니다.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">담당자 업무 분산 검토</p>
                      <p className="text-xs text-gray-600">일부 담당자의 측정 비중이 높습니다.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
} 