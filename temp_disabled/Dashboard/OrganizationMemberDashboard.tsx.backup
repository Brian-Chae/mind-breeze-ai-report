import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Building2,
  User,
  Target,
  TrendingUp,
  Activity,
  BarChart3,
  Award,
  Calendar,
  Clock,
  Users,
  UserCheck,
  Bluetooth,
  Brain,
  Heart
} from 'lucide-react';
import { EnterpriseUser, Organization, OrganizationMember } from '../../types/business';
import { useUIStore } from '../../stores/uiStore';
import measurementUserManagementService, { MeasurementUser, MeasurementUserStats } from '../../services/MeasurementUserManagementService';
import { toast } from 'sonner';
import { Input } from '../ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select';
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
import { 
  Plus,
  Eye,
  FileText,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react';

interface OrganizationMemberDashboardProps {
  user: EnterpriseUser;
  organization: Organization | null;
  memberInfo: OrganizationMember | null;
}

export default function OrganizationMemberDashboard({ 
  user, 
  organization, 
  memberInfo 
}: OrganizationMemberDashboardProps) {
  
  const { setActiveMenu } = useUIStore();
  const [activeTab, setActiveTab] = useState('overview');
  
  // 측정 대상자 관리 상태 (자신이 등록한 것만)
  const [measurementUsers, setMeasurementUsers] = useState<MeasurementUser[]>([]);
  const [measurementUserStats, setMeasurementUserStats] = useState<MeasurementUserStats | null>(null);
  const [isLoadingMeasurementUsers, setIsLoadingMeasurementUsers] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [measurementUserFilter, setMeasurementUserFilter] = useState({
    status: '',
    searchTerm: '',
    isActive: undefined as boolean | undefined
  });
  
  // 임시 개인 통계 데이터
  const [personalStats, setPersonalStats] = useState({
    reportsThisMonth: 8,
    averageScore: 82,
    currentRank: 12,
    totalMembers: organization?.totalMemberCount || 0,
    streakDays: 5,
    lastMeasurement: '2시간 전'
  });

  // 임시 팀 챌린지 데이터
  const [teamChallenges, setTeamChallenges] = useState([
    {
      id: 1,
      title: '주간 건강 측정 챌린지',
      description: '일주일 동안 매일 측정하기',
      progress: 5,
      target: 7,
      participants: 45,
      reward: '건강한 직원상'
    },
    {
      id: 2,
      title: '스트레스 관리 마스터',
      description: '스트레스 지수 70점 이하 유지',
      progress: 3,
      target: 5,
      participants: 32,
      reward: '스트레스 프리 상품권'
    }
  ]);

  // 개인 건강 트렌드 데이터 (예시)
  const [healthTrend, setHealthTrend] = useState({
    thisWeek: { stress: 65, focus: 78, energy: 72 },
    lastWeek: { stress: 72, focus: 70, energy: 68 },
    improvement: { stress: -7, focus: +8, energy: +4 }
  });

  const handleStartMeasurement = () => {
    setActiveMenu('linkband');
    toast.info('측정 페이지로 이동합니다.');
  };

  const handleViewMyReports = () => {
    setActiveMenu('applications');
    toast.info('내 리포트 페이지로 이동합니다.');
  };

  const handleJoinChallenge = (challengeId: number) => {
    toast.success('챌린지에 참여했습니다! 🎯');
  };

  const handleViewTeamStats = () => {
    toast.info('팀 통계 보기 기능 준비 중입니다.');
  };

  // ========== 측정 대상자 관리 함수들 (자신이 등록한 것만) ==========
  const loadMeasurementUsers = async () => {
    setIsLoadingMeasurementUsers(true);
    try {
      // ORGANIZATION_MEMBER는 자신이 등록한 것만 조회
      const users = await measurementUserManagementService.getMeasurementUsers({
        ...measurementUserFilter,
        createdByUserId: user.id  // 자신이 등록한 것만
      });
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

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    if (activeTab === 'measurementUsers') {
      loadMeasurementUsers();
    }
  }, [activeTab]);

  // 필터 변경 시 측정 대상자 재로드
  useEffect(() => {
    if (activeTab === 'measurementUsers') {
      loadMeasurementUsers();
    }
  }, [measurementUserFilter]);

  if (!organization) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">조직 정보 없음</h2>
          <p className="text-gray-600">조직 정보를 불러올 수 없습니다.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* 상단 타이틀 - 조직 구성원 맞춤 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-medium text-foreground">내 건강 워크스페이스</h1>
          <p className="text-muted-foreground">
            {organization.name} - {user.displayName}님, 오늘도 건강한 하루 보내세요! 💪
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            {memberInfo?.department || '부서'}
          </Badge>
          <Badge variant="default" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            팀원
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
          개인 현황
        </button>
        <button
          onClick={() => setActiveTab('measurementUsers')}
          className={`pb-2 px-1 border-b-2 transition-colors ${
            activeTab === 'measurementUsers' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          내 측정 대상자
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 개인 현황 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 이번 달 측정 횟수 */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">이번 달 측정</p>
              <p className="text-2xl font-bold">{personalStats.reportsThisMonth}회</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>

        {/* 평균 건강 점수 */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">평균 점수</p>
              <p className="text-2xl font-bold">{personalStats.averageScore}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>

        {/* 팀 내 순위 */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">팀 내 순위</p>
              <p className="text-2xl font-bold">{personalStats.currentRank}위</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            전체 {personalStats.totalMembers}명 중
          </p>
        </Card>

        {/* 연속 측정 일수 */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">연속 측정</p>
              <p className="text-2xl font-bold">{personalStats.streakDays}일</p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* 메인 액션 카드들 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 빠른 측정 시작 */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bluetooth className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-medium">빠른 건강 측정</h2>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">마지막 측정</span>
                <span className="text-sm text-blue-600">{personalStats.lastMeasurement}</span>
              </div>
              <p className="text-sm text-blue-600">정기적인 측정으로 건강을 관리하세요!</p>
            </div>
            
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-gray-50 rounded-lg">
                <Brain className="w-6 h-6 text-purple-500 mx-auto mb-1" />
                <div className="text-sm font-medium">뇌파</div>
                <div className="text-xs text-gray-500">집중도, 스트레스</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <Heart className="w-6 h-6 text-red-500 mx-auto mb-1" />
                <div className="text-sm font-medium">심박</div>
                <div className="text-xs text-gray-500">심박변이도</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <Activity className="w-6 h-6 text-green-500 mx-auto mb-1" />
                <div className="text-sm font-medium">활동</div>
                <div className="text-xs text-gray-500">움직임 패턴</div>
              </div>
            </div>
            
            <Button 
              className="w-full h-12 text-lg"
              onClick={handleStartMeasurement}
            >
              지금 측정 시작하기
            </Button>
          </div>
        </Card>

        {/* 내 건강 트렌드 */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-medium">내 건강 트렌드</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-3">
              {/* 스트레스 수준 */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">스트레스 수준</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{healthTrend.thisWeek.stress}</span>
                  <Badge 
                    variant={healthTrend.improvement.stress < 0 ? "default" : "destructive"} 
                    className="text-xs"
                  >
                    {healthTrend.improvement.stress > 0 ? '+' : ''}{healthTrend.improvement.stress}
                  </Badge>
                </div>
              </div>
              
              {/* 집중도 */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">집중도</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{healthTrend.thisWeek.focus}</span>
                  <Badge 
                    variant={healthTrend.improvement.focus > 0 ? "default" : "destructive"} 
                    className="text-xs"
                  >
                    {healthTrend.improvement.focus > 0 ? '+' : ''}{healthTrend.improvement.focus}
                  </Badge>
                </div>
              </div>
              
              {/* 에너지 수준 */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">에너지 수준</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{healthTrend.thisWeek.energy}</span>
                  <Badge 
                    variant={healthTrend.improvement.energy > 0 ? "default" : "destructive"} 
                    className="text-xs"
                  >
                    {healthTrend.improvement.energy > 0 ? '+' : ''}{healthTrend.improvement.energy}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <Button 
                variant="outline" 
                className="w-full h-10"
                onClick={handleViewMyReports}
              >
                전체 리포트 보기
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* 팀 챌린지 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-medium">팀 건강 챌린지</h2>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {teamChallenges.length}개 진행 중
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teamChallenges.map((challenge) => (
            <Card key={challenge.id} className="p-4 border-l-4 border-l-orange-500">
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium text-sm">{challenge.title}</h3>
                  <p className="text-xs text-gray-600">{challenge.description}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>진행률</span>
                    <span>{challenge.progress}/{challenge.target}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all"
                      style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    <Users className="w-3 h-3 inline mr-1" />
                    {challenge.participants}명 참여
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-7 text-xs"
                    onClick={() => handleJoinChallenge(challenge.id)}
                  >
                    참여하기
                  </Button>
                </div>
                
                <div className="text-xs text-orange-600 font-medium">
                  🏆 보상: {challenge.reward}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* 팀 현황 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 팀 건강 현황 */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-medium">우리 팀 현황</h2>
          </div>
          
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {Math.round((personalStats.reportsThisMonth / personalStats.totalMembers) * 100)}%
              </div>
              <p className="text-sm text-gray-600">팀 평균 참여도</p>
              <p className="text-xs text-gray-500 mt-1">
                지난 달 대비 +12% 증가
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-700">78</div>
                <div className="text-sm text-green-600">팀 평균 점수</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-700">{personalStats.totalMembers}</div>
                <div className="text-sm text-blue-600">총 팀원</div>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full h-10"
              onClick={handleViewTeamStats}
            >
              팀 통계 자세히 보기
            </Button>
          </div>
        </Card>

        {/* 건강 팁 & 권장사항 */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-medium">오늘의 건강 팁</h2>
          </div>
          
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-medium text-sm text-purple-800 mb-2">
                💡 개인 맞춤 추천
              </h3>
              <p className="text-sm text-purple-700">
                최근 스트레스 수준이 높게 측정되었습니다. 
                오늘은 10분간 심호흡 명상을 시도해보세요!
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>점심시간 스트레칭 (12:00-12:10)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Activity className="w-4 h-4 text-gray-500" />
                <span>오후 3시 건강 측정 권장</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Brain className="w-4 h-4 text-gray-500" />
                <span>집중력 향상 호흡법 실습</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
      )}

      {activeTab === 'measurementUsers' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">내 측정 대상자</h2>
              <p className="text-sm text-gray-600">내가 등록한 측정 대상자들을 관리할 수 있습니다.</p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              새 대상자 등록
            </Button>
          </div>

          {/* 개인 통계 카드 */}
          {measurementUserStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">내 대상자</p>
                      <p className="text-2xl font-bold">{measurementUsers.length}</p>
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
                      <p className="text-2xl font-bold">{measurementUsers.filter(u => u.isActive).length}</p>
                    </div>
                    <UserCheck className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">이번 달 측정</p>
                      <p className="text-2xl font-bold">
                        {measurementUsers.reduce((sum, u) => {
                          const thisMonth = new Date();
                          thisMonth.setDate(1);
                          return sum + (u.lastMeasurementDate && u.lastMeasurementDate >= thisMonth ? 1 : 0);
                        }, 0)}
                      </p>
                    </div>
                    <Activity className="w-8 h-8 text-purple-600" />
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
                  <Input
                    type="text"
                    placeholder="이름 또는 이메일로 검색..."
                    value={measurementUserFilter.searchTerm}
                    onChange={(e) => setMeasurementUserFilter(prev => ({ ...prev, searchTerm: e.target.value }))}
                  />
                </div>
                <Select 
                  value={measurementUserFilter.status} 
                  onValueChange={(value) => setMeasurementUserFilter(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">모든 상태</SelectItem>
                    <SelectItem value="REGISTERED">등록됨</SelectItem>
                    <SelectItem value="MEASURING">측정중</SelectItem>
                    <SelectItem value="COMPLETED">완료</SelectItem>
                    <SelectItem value="INACTIVE">비활성</SelectItem>
                  </SelectContent>
                </Select>
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
                  <p className="text-sm text-gray-500 mt-2">첫 번째 측정 대상자를 등록해보세요!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">대상자 정보</th>
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
    </div>
  );
} 