import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card';
import { Button } from '@ui/button';
import { Alert, AlertDescription } from '@ui/alert';
import { 
  CheckCircle, 
  Building2, 
  Mail, 
  Key, 
  Users, 
  ArrowRight,
  Copy,
  Share2,
  Info,
  Brain,
  Home
} from 'lucide-react';
import { toast } from 'sonner';
import { createOrganizationJoinUrl } from '@/core/utils';

interface LocationState {
  companyCode: string;
  companyName: string;
  adminEmail: string;
}

export default function CompanyRegistrationSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  // 상태가 없으면 홈으로 리다이렉트
  if (!state) {
    navigate('/');
    return null;
  }

  const { companyCode, companyName, adminEmail } = state;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(companyCode);
    toast.success('회사 코드가 클립보드에 복사되었습니다!');
  };

  const handleShareCode = () => {
    if (navigator.share) {
      navigator.share({
        title: 'MIND BREEZE AI 회사 코드',
        text: `우리 회사의 MIND BREEZE AI 코드는 ${companyCode}입니다. 이 코드로 참여해주세요!`,
        url: createOrganizationJoinUrl()
      });
    } else {
      const shareText = `MIND BREEZE AI 회사 코드: ${companyCode}`;
      navigator.clipboard.writeText(shareText);
      toast.success('공유 텍스트가 클립보드에 복사되었습니다!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Main Success Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          
          {/* Header with Brand */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">MIND BREEZE</span>
            </div>
            
            {/* Success Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              회사 등록이 완료되었습니다!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              MIND BREEZE AI 서비스를 시작할 준비가 되었습니다
            </p>
          </div>

          {/* Company Info Section */}
          <div className="mb-8">
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">회사명</h3>
                  <p className="text-gray-600">{companyName}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">관리자 이메일</h3>
                  <p className="text-gray-600">{adminEmail}</p>
                </div>
              </div>

              {/* Company Code Highlight */}
              <div className="bg-gradient-to-r from-green-500 to-blue-600 p-1 rounded-xl">
                <div className="bg-white p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Key className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">회사 코드</h3>
                        <p className="text-2xl font-bold text-green-600 font-mono">{companyCode}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyCode}
                        className="border-green-300 text-green-700 hover:bg-green-50"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        복사
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleShareCode}
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        공유
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    이 코드는 직원들이 회사에 참여할 때 사용됩니다. 안전하게 보관해주세요.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              다음 단계
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">관리자 계정 로그인</h3>
                    <p className="text-blue-800 text-sm">
                      등록한 관리자 이메일과 비밀번호로 로그인하여 회사 설정을 완료하세요.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900 mb-2">회사 설정 완료</h3>
                    <p className="text-green-800 text-sm">
                      대시보드에서 회사 정보를 확인하고 필요한 설정을 완료하세요.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-900 mb-2">직원 초대</h3>
                    <p className="text-purple-800 text-sm">
                      회사 코드를 직원들에게 공유하여 회사 참여를 요청하세요.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold text-orange-900 mb-2">서비스 시작</h3>
                    <p className="text-orange-800 text-sm">
                      직원들이 회사 참여를 완료하면 MIND BREEZE AI 서비스를 시작할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Employee Invitation Guide */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              직원 초대 안내
            </h2>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4">직원들에게 전달할 안내 메시지:</h3>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-800 space-y-2">
                  <p className="font-semibold">📧 MIND BREEZE AI 서비스 참여 안내</p>
                  <p>안녕하세요! 우리 회사에서 MIND BREEZE AI 서비스를 도입했습니다.</p>
                  <p>아래 회사 코드를 사용하여 서비스에 참여해주세요:</p>
                  <p className="font-mono font-bold text-lg text-blue-600 bg-blue-50 p-2 rounded">
                    회사 코드: {companyCode}
                  </p>
                  <p>참여 방법:</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-700">
                    <li>MIND BREEZE AI 웹사이트 방문</li>
                    <li>'기존 기업 합류' 선택</li>
                    <li>위 회사 코드 입력</li>
                    <li>개인 정보 입력 및 가입 완료</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="flex items-center gap-2 px-8 py-3 text-lg rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            >
              <Home className="w-5 h-5" />
              홈으로 돌아가기
            </Button>
            
            <Button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-8 py-3 text-lg rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
            >
              관리자 로그인
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Support Info */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              서비스 이용 중 문의사항이 있으시면{' '}
              <a href="mailto:support@mindbreeze.ai" className="text-blue-600 hover:underline">
                support@mindbreeze.ai
              </a>
              로 연락주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 