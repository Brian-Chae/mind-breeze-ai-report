import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { User, Activity, FileText, Settings } from 'lucide-react';

interface IndividualUserDashboardProps {
  user: {
    displayName: string;
    email?: string;
    userType: string;
  };
}

export default function IndividualUserDashboard({ user }: IndividualUserDashboardProps) {
  return (
    <div className="p-6 space-y-6">
      {/* 사용자 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            개인 대시보드
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-lg font-semibold">안녕하세요, {user.displayName}님!</p>
            <p className="text-sm text-gray-600">개인 사용자 계정입니다.</p>
          </div>
        </CardContent>
      </Card>

      {/* 주요 기능 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              바로 측정
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">개인 측정을 진행하세요</p>
            <Button className="w-full">
              측정 시작하기
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              측정 기록
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">나의 측정 기록을 확인하세요</p>
            <Button variant="outline" className="w-full">
              기록 보기
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              설정
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">개인 설정을 관리하세요</p>
            <Button variant="outline" className="w-full">
              설정 변경
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 