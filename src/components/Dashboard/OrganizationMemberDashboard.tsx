import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
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
  Bluetooth,
  Brain,
  Heart
} from 'lucide-react';
import { EnterpriseUser, Organization, OrganizationMember } from '../../types/business';
import { useUIStore } from '../../stores/uiStore';
import { toast } from 'sonner';

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
    </div>
  );
} 