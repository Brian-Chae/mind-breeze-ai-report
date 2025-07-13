import React from 'react';
import { useAuth } from '../AuthProvider';
import { enterpriseAuthService } from '../../services/EnterpriseAuthService';
import IndividualUserDashboard from './IndividualUserDashboard';
import OrganizationAdminDashboard from './OrganizationAdminDashboard';
import OrganizationMemberDashboard from './OrganizationMemberDashboard';
import { Card } from '../ui/card';
import { AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const authContext = enterpriseAuthService.getCurrentContext();

  // 로딩 중
  if (authContext.isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않음
  if (!user || !authContext.user) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">인증 오류</h2>
          <p className="text-gray-600">사용자 정보를 확인할 수 없습니다. 다시 로그인해주세요.</p>
        </Card>
      </div>
    );
  }

  const { userType, displayName } = authContext.user;

  // 사용자 타입별 대시보드 분기
  switch (userType) {
    case 'INDIVIDUAL_USER':
      return <IndividualUserDashboard user={authContext.user} />;
    
    case 'ORGANIZATION_ADMIN':
      return (
        <OrganizationAdminDashboard 
          user={authContext.user} 
          organization={authContext.organization}
          permissions={authContext.permissions}
        />
      );
    
    case 'ORGANIZATION_MEMBER':
      return (
        <OrganizationMemberDashboard 
          user={authContext.user} 
          organization={authContext.organization}
          memberInfo={authContext.memberInfo}
        />
      );
    
    case 'SYSTEM_ADMIN':
      // 시스템 관리자는 조직 관리자 대시보드 + 추가 권한으로 처리
      return (
        <OrganizationAdminDashboard 
          user={authContext.user} 
          organization={authContext.organization}
          permissions={authContext.permissions}
          isSystemAdmin={true}
        />
      );
    
    default:
      return (
        <div className="p-6">
          <Card className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">알 수 없는 사용자 타입</h2>
            <p className="text-gray-600">
              사용자 타입: {userType} ({displayName})
            </p>
            <p className="text-sm text-gray-500 mt-2">
              관리자에게 문의하거나 다시 로그인해주세요.
            </p>
          </Card>
        </div>
      );
  }
}

 