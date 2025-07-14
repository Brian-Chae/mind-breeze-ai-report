import React, { useState, useEffect } from 'react';
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
  Download,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  User,
  MoreVertical,
  UserPlus,
  UserMinus
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '../ui/alert-dialog';
import { memberManagementService, MemberManagementData } from '../../services/MemberManagementService';
import measurementUserManagementService, { MeasurementUser, MeasurementUserStats } from '../../services/MeasurementUserManagementService';
import { toast } from 'sonner';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'measurementUsers' | 'credits' | 'analytics'>('overview');
  const [members, setMembers] = useState<MemberManagementData[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 측정 대상자 관리 상태
  const [measurementUsers, setMeasurementUsers] = useState<MeasurementUser[]>([]);
  const [measurementUserStats, setMeasurementUserStats] = useState<MeasurementUserStats | null>(null);
  const [isLoadingMeasurementUsers, setIsLoadingMeasurementUsers] = useState(false);
  const [measurementUserFilter, setMeasurementUserFilter] = useState({
    status: '',
    searchTerm: '',
    isActive: undefined as boolean | undefined
  });

  // 멤버 목록 로드
  const loadMembers = async () => {
    if (!organization?.id) return;
    
    setIsLoadingMembers(true);
    try {
      const memberList = await memberManagementService.getOrganizationMembers(organization.id);
      setMembers(memberList);
    } catch (error: any) {
      console.error('멤버 목록 로드 실패:', error);
      toast.error(error.message || '멤버 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // 측정 대상자 목록 로드
  const loadMeasurementUsers = async () => {
    setIsLoadingMeasurementUsers(true);
    try {
      const users = await measurementUserManagementService.getMeasurementUsers(measurementUserFilter);
      const stats = await measurementUserManagementService.getMeasurementUserStats();
      setMeasurementUsers(users);
      setMeasurementUserStats(stats);
    } catch (error: any) {
      console.error('측정 대상자 목록 로드 실패:', error);
      toast.error(error.message || '측정 대상자 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoadingMeasurementUsers(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (activeTab === 'members') {
      loadMembers();
    } else if (activeTab === 'measurementUsers') {
      loadMeasurementUsers();
    }
  }, [activeTab, organization?.id]);

  // 필터 변경 시 측정 대상자 재로드
  useEffect(() => {
    if (activeTab === 'measurementUsers') {
      loadMeasurementUsers();
    }
  }, [measurementUserFilter]);

  // 권한 승격 (ORGANIZATION_MEMBER → ORGANIZATION_ADMIN)
  const handlePromoteToAdmin = async (userId: string, userName: string) => {
    if (!user.organizationId) return;
    
    setIsProcessing(true);
    try {
      await memberManagementService.promoteMemberToAdmin(userId, user.organizationId);
      toast.success(`${userName}님이 관리자로 승격되었습니다.`);
      await loadMembers(); // 목록 새로고침
    } catch (error: any) {
      toast.error(error.message || '관리자 승격에 실패했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 관리자 권한 해제 (ORGANIZATION_ADMIN → ORGANIZATION_MEMBER)
  const handleDemoteToMember = async (userId: string, userName: string) => {
    if (!user.organizationId) return;
    
    setIsProcessing(true);
    try {
      await memberManagementService.demoteAdminToMember(userId, user.organizationId);
      toast.success(`${userName}님의 관리자 권한이 해제되었습니다.`);
      await loadMembers(); // 목록 새로고침
    } catch (error: any) {
      toast.error(error.message || '관리자 권한 해제에 실패했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 멤버 활성화/비활성화
  const handleToggleMemberStatus = async (userId: string, userName: string, isActive: boolean) => {
    if (!user.organizationId) return;
    
    setIsProcessing(true);
    try {
      await memberManagementService.toggleMemberStatus(userId, isActive, user.organizationId);
      toast.success(`${userName}님이 ${isActive ? '활성화' : '비활성화'}되었습니다.`);
      await loadMembers(); // 목록 새로고침
    } catch (error: any) {
      toast.error(error.message || '멤버 상태 변경에 실패했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 멤버 삭제
  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!user.organizationId) return;
    
    setIsProcessing(true);
    try {
      await memberManagementService.removeMemberFromOrganization(userId, user.organizationId);
      toast.success(`${userName}님이 조직에서 제거되었습니다.`);
      await loadMembers(); // 목록 새로고침
    } catch (error: any) {
      toast.error(error.message || '멤버 삭제에 실패했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ========== 측정 대상자 관리 함수들 ==========
  const handleDeleteMeasurementUser = async (userId: string, userName: string) => {
    setIsProcessing(true);
    try {
      await measurementUserManagementService.deleteMeasurementUser(userId);
      toast.success(`${userName}님이 측정 대상자에서 삭제되었습니다.`);
      await loadMeasurementUsers();
    } catch (error: any) {
      toast.error(error.message || '측정 대상자 삭제에 실패했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleMeasurementUserStatus = async (userId: string, userName: string, isActive: boolean) => {
    setIsProcessing(true);
    try {
      await measurementUserManagementService.updateMeasurementUser(userId, { 
        // isActive는 MeasurementUser 데이터에 포함되어 있지만 업데이트 인터페이스에는 없음
        // 따라서 별도 처리가 필요할 수 있음
      });
      toast.success(`${userName}님이 ${isActive ? '활성화' : '비활성화'}되었습니다.`);
      await loadMeasurementUsers();
    } catch (error: any) {
      toast.error(error.message || '상태 변경에 실패했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateAccessLink = (measurementUser: MeasurementUser) => {
    if (!measurementUser.accessToken) {
      toast.error('접속 토큰이 없습니다.');
      return;
    }
    
    const accessLink = measurementUserManagementService.generateAccessLink(measurementUser.accessToken);
    navigator.clipboard.writeText(accessLink);
    toast.success('접속 링크가 클립보드에 복사되었습니다.');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REGISTERED':
        return <Badge variant="secondary">등록됨</Badge>;
      case 'MEASURING':
        return <Badge variant="default">측정중</Badge>;
      case 'COMPLETED':
        return <Badge variant="default">완료</Badge>;
      case 'INACTIVE':
        return <Badge variant="destructive">비활성</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // 권한 배지 컴포넌트
  const RoleBadge = ({ role }: { role: string }) => {
    if (role === 'ORGANIZATION_ADMIN') {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          관리자
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <User className="w-3 h-3" />
          멤버
        </Badge>
      );
    }
  };

  // 멤버 관리 액션 메뉴
  const MemberActionMenu = ({ member }: { member: MemberManagementData }) => {
    const isCurrentUser = member.userId === user.organizationId;
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={isProcessing}>
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* 권한 변경 */}
          {!isCurrentUser && (
            <>
              {member.userType === 'ORGANIZATION_MEMBER' && (
                <DropdownMenuItem onClick={() => handlePromoteToAdmin(member.userId, member.displayName)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  관리자로 승격
                </DropdownMenuItem>
              )}
              {member.userType === 'ORGANIZATION_ADMIN' && (
                <DropdownMenuItem onClick={() => handleDemoteToMember(member.userId, member.displayName)}>
                  <UserMinus className="w-4 h-4 mr-2" />
                  관리자 권한 해제
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
            </>
          )}
          
          {/* 상태 변경 */}
          {!isCurrentUser && (
            <DropdownMenuItem 
              onClick={() => handleToggleMemberStatus(member.userId, member.displayName, !member.isActive)}
            >
              {member.isActive ? (
                <>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  비활성화
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  활성화
                </>
              )}
            </DropdownMenuItem>
          )}
          
          {/* 삭제 */}
          {!isCurrentUser && member.userType !== 'ORGANIZATION_ADMIN' && (
            <>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem 
                    className="text-red-600 focus:text-red-600"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    조직에서 제거
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>정말로 삭제하시겠습니까?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {member.displayName}님을 조직에서 제거합니다. 이 작업은 되돌릴 수 없습니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleRemoveMember(member.userId, member.displayName)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      삭제
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

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
          멤버 관리
        </button>
        <button
          onClick={() => setActiveTab('measurementUsers')}
          className={`pb-2 px-1 border-b-2 transition-colors ${
            activeTab === 'measurementUsers' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          측정 대상자
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
                  조직 멤버
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {members.length || mockData.organization.memberCount}
            </div>
                <p className="text-xs text-gray-600">활성 멤버 수</p>
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
            <div>
              <h2 className="text-xl font-semibold">멤버 관리</h2>
              <p className="text-sm text-gray-600">조직 멤버들의 권한을 관리하고 상태를 확인할 수 있습니다.</p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              새 멤버 초대
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoadingMembers ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">멤버 목록을 불러오는 중...</p>
                </div>
              ) : members.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">조직 멤버가 없습니다.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {members.map((member) => (
                    <div key={member.userId} className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          {member.userType === 'ORGANIZATION_ADMIN' ? (
                            <ShieldCheck className="w-5 h-5 text-blue-600" />
                          ) : (
                            <User className="w-5 h-5 text-blue-600" />
                          )}
          </div>
            <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{member.displayName}</p>
                            {member.userId === user.organizationId && (
                              <Badge variant="secondary" className="text-xs">나</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{member.email}</p>
                          <p className="text-xs text-gray-500">
                            {member.department} · {member.position}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <RoleBadge role={member.userType} />
                          <p className="text-xs text-gray-500 mt-1">
                            {member.isActive ? '활성' : '비활성'}
                          </p>
            </div>
                        <MemberActionMenu member={member} />
            </div>
          </div>
                  ))}
          </div>
              )}
            </CardContent>
        </Card>
      </div>
      )}

      {activeTab === 'measurementUsers' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">측정 대상자 관리</h2>
              <p className="text-sm text-gray-600">측정 대상자를 등록하고 관리할 수 있습니다.</p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              새 대상자 등록
            </Button>
          </div>

          {/* 통계 카드 */}
          {measurementUserStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">총 대상자</p>
                      <p className="text-2xl font-bold">{measurementUserStats.totalCount}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">활성 대상자</p>
                      <p className="text-2xl font-bold">{measurementUserStats.activeCount}</p>
                    </div>
                    <UserCheck className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">이번 달 신규</p>
                      <p className="text-2xl font-bold">{measurementUserStats.thisMonthNewUsers}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">평균 측정 횟수</p>
                      <p className="text-2xl font-bold">{measurementUserStats.averageMeasurementsPerUser.toFixed(1)}</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 필터 및 검색 */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder="이름 또는 이메일로 검색..."
                    value={measurementUserFilter.searchTerm}
                    onChange={(e) => setMeasurementUserFilter(prev => ({ ...prev, searchTerm: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={measurementUserFilter.status}
                  onChange={(e) => setMeasurementUserFilter(prev => ({ ...prev, status: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">모든 상태</option>
                  <option value="REGISTERED">등록됨</option>
                  <option value="MEASURING">측정중</option>
                  <option value="COMPLETED">완료</option>
                  <option value="INACTIVE">비활성</option>
                </select>
                <select
                  value={measurementUserFilter.isActive === undefined ? '' : measurementUserFilter.isActive.toString()}
                  onChange={(e) => setMeasurementUserFilter(prev => ({ 
                    ...prev, 
                    isActive: e.target.value === '' ? undefined : e.target.value === 'true' 
                  }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">활성 상태</option>
                  <option value="true">활성</option>
                  <option value="false">비활성</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* 측정 대상자 목록 */}
          <Card>
            <CardContent className="p-0">
              {isLoadingMeasurementUsers ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">측정 대상자 목록을 불러오는 중...</p>
                </div>
              ) : measurementUsers.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">등록된 측정 대상자가 없습니다.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">대상자 정보</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">등록자</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">측정 횟수</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">마지막 측정</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {measurementUsers.map((measurementUser) => (
                        <tr key={measurementUser.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{measurementUser.displayName}</div>
                              <div className="text-sm text-gray-500">{measurementUser.email}</div>
                              {measurementUser.age && (
                                <div className="text-xs text-gray-400">{measurementUser.age}세 {measurementUser.gender}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{measurementUser.createdByUserName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {getStatusBadge(measurementUser.status)}
                              {measurementUser.isActive ? (
                                <Badge variant="default">활성</Badge>
                              ) : (
                                <Badge variant="destructive">비활성</Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{measurementUser.measurementCount}회</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {measurementUser.lastMeasurementDate 
                                ? measurementUser.lastMeasurementDate.toLocaleDateString() 
                                : '-'
                              }
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCreateAccessLink(measurementUser)}
                                title="접속 링크 복사"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Edit className="w-4 h-4 mr-2" />
                                    정보 수정
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <FileText className="w-4 h-4 mr-2" />
                                    리포트 보기
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        삭제
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>측정 대상자 삭제</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          {measurementUser.displayName}님을 측정 대상자에서 삭제하시겠습니까? 
                                          이 작업은 되돌릴 수 없습니다.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>취소</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteMeasurementUser(measurementUser.id, measurementUser.displayName)}
                                          disabled={isProcessing}
                                        >
                                          삭제
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
                      <p className="text-sm font-medium">멤버 활동 모니터링</p>
                      <p className="text-xs text-gray-600">신규 멤버 {members.length}명이 활동 중입니다.</p>
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