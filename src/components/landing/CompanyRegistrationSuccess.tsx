import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  CheckCircle, 
  Building2, 
  Mail, 
  Key, 
  Users, 
  ArrowRight,
  Copy,
  Download,
  Share2,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

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

  const handleDownloadInfo = () => {
    const infoText = `
MIND BREEZE AI 회사 등록 정보

회사명: ${companyName}
회사 코드: ${companyCode}
관리자 이메일: ${adminEmail}
등록 완료 시간: ${new Date().toLocaleString('ko-KR')}

다음 단계:
1. 관리자 계정으로 로그인하세요
2. 회사 설정을 완료하세요
3. 직원들에게 회사 코드를 공유하세요
4. 직원들이 회사 참여를 완료하면 서비스를 시작할 수 있습니다

문의사항이 있으시면 support@mindbreeze.ai로 연락주세요.
    `;

    const blob = new Blob([infoText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MIND_BREEZE_${companyCode}_정보.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShareCode = () => {
    if (navigator.share) {
      navigator.share({
        title: 'MIND BREEZE AI 회사 코드',
        text: `우리 회사의 MIND BREEZE AI 코드는 ${companyCode}입니다. 이 코드로 참여해주세요!`,
        url: window.location.origin + '/company-join'
      });
    } else {
      // 공유 API가 지원되지 않는 경우
      const shareText = `MIND BREEZE AI 회사 코드: ${companyCode}`;
      navigator.clipboard.writeText(shareText);
      toast.success('공유 텍스트가 클립보드에 복사되었습니다!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 성공 메시지 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            회사 등록이 완료되었습니다!
          </h1>
          <p className="text-gray-600">
            MIND BREEZE AI 서비스를 시작할 준비가 되었습니다
          </p>
        </div>

        {/* 회사 정보 카드 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              등록된 회사 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">회사명</p>
                  <p className="font-semibold">{companyName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">관리자 이메일</p>
                  <p className="font-semibold">{adminEmail}</p>
                </div>
              </div>
            </div>

            {/* 회사 코드 강조 표시 */}
            <Alert className="border-green-200 bg-green-50">
              <Key className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-green-800 mb-1">
                      회사 코드: <span className="text-xl font-mono">{companyCode}</span>
                    </p>
                    <p className="text-sm text-green-700">
                      이 코드는 직원들이 회사에 참여할 때 사용됩니다. 안전하게 보관해주세요.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyCode}
                      className="border-green-300 text-green-700 hover:bg-green-100"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      복사
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShareCode}
                      className="border-green-300 text-green-700 hover:bg-green-100"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      공유
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* 다음 단계 안내 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              다음 단계
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">관리자 계정 로그인</h3>
                  <p className="text-sm text-gray-600">
                    등록한 관리자 이메일과 비밀번호로 로그인하여 회사 설정을 완료하세요.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">회사 설정 완료</h3>
                  <p className="text-sm text-gray-600">
                    대시보드에서 회사 정보를 확인하고 필요한 설정을 완료하세요.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">직원 초대</h3>
                  <p className="text-sm text-gray-600">
                    회사 코드 <span className="font-mono font-semibold">{companyCode}</span>를 직원들에게 공유하여 회사 참여를 요청하세요.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                  4
                </div>
                <div>
                  <h3 className="font-semibold mb-1">서비스 시작</h3>
                  <p className="text-sm text-gray-600">
                    직원들이 회사 참여를 완료하면 MIND BREEZE AI 서비스를 본격적으로 시작할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 직원 초대 안내 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              직원 초대 방법
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">직원들에게 전달할 안내 메시지:</h4>
              <div className="bg-white p-3 rounded border text-sm">
                <p className="mb-2">
                  <strong>MIND BREEZE AI 서비스 참여 안내</strong>
                </p>
                <p className="mb-2">
                  안녕하세요! 우리 회사에서 MIND BREEZE AI 서비스를 도입했습니다.
                </p>
                <p className="mb-2">
                  아래 회사 코드를 사용하여 서비스에 참여해주세요:
                </p>
                <p className="mb-2">
                  <strong>회사 코드: {companyCode}</strong>
                </p>
                <p className="mb-2">
                  참여 방법:
                </p>
                <ol className="list-decimal list-inside text-sm space-y-1 mb-2">
                  <li>MIND BREEZE AI 웹사이트에서 "기존 회사 참여" 선택</li>
                  <li>회사 코드 입력: {companyCode}</li>
                  <li>개인 정보 입력 및 계정 생성</li>
                  <li>참여 완료 후 서비스 이용 가능</li>
                </ol>
                <p className="text-gray-600">
                  문의사항이 있으시면 관리자에게 연락주세요.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 액션 버튼 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleDownloadInfo}
            variant="outline"
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            등록 정보 다운로드
          </Button>
          <Button
            onClick={() => navigate('/login')}
            className="flex-1"
          >
            관리자 로그인
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* 지원 정보 */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>
            서비스 이용 중 문의사항이 있으시면 
            <a href="mailto:support@mindbreeze.ai" className="text-blue-600 hover:underline ml-1">
              support@mindbreeze.ai
            </a>
            로 연락주세요.
          </p>
        </div>
      </div>
    </div>
  );
} 