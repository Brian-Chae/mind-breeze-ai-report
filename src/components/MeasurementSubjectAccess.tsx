import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card';
import { Button } from '@ui/button';
import { Alert, AlertDescription } from '@ui/alert';
import { Loader2, FileText, MessageCircle, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import enterpriseAuthService, { MeasurementSubjectAccess as MeasurementSubjectAccessType } from '../services/EnterpriseAuthService';

const MeasurementSubjectAccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [accessInfo, setAccessInfo] = useState<MeasurementSubjectAccessType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setError('유효하지 않은 접속 링크입니다.');
      setLoading(false);
      return;
    }

    handleTokenAccess(token);
  }, [searchParams]);

  const handleTokenAccess = async (token: string) => {
    try {
      setLoading(true);
      setError(null);

      const accessResult = await enterpriseAuthService.accessWithToken(token);
      setAccessInfo(accessResult);
      
      toast.success('성공적으로 접속되었습니다.');
    } catch (error: any) {
      console.error('Token access failed:', error);
      setError(error.message || '접속에 실패했습니다.');
      toast.error('접속에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatExpiryDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-sm text-gray-600">접속 정보를 확인하고 있습니다...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
            <CardTitle className="text-red-700">접속 오류</CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/')} 
              className="w-full"
              variant="outline"
            >
              메인 페이지로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!accessInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-2" />
            <CardTitle className="text-gray-700">접속 정보 없음</CardTitle>
            <CardDescription>접속 정보를 불러올 수 없습니다.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">MIND BREEZE AI</h1>
              <span className="ml-3 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                측정 대상자
              </span>
            </div>
            <div className="text-sm text-gray-500">
              접속 만료: {formatExpiryDate(accessInfo.expiresAt)}
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 환영 메시지 */}
          <div className="mb-8">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                MIND BREEZE AI 리포트 접속에 성공했습니다. 아래에서 귀하의 건강 리포트를 확인하고 AI 상담을 받으실 수 있습니다.
              </AlertDescription>
            </Alert>
          </div>

          {/* 기능 카드들 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 리포트 조회 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center">
                  <FileText className="w-8 h-8 text-blue-600 mr-3" />
                  <div>
                    <CardTitle>나의 건강 리포트</CardTitle>
                    <CardDescription>
                      AI가 분석한 귀하의 뇌파 및 건강 상태 리포트를 확인하세요
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    접근 가능한 리포트: <span className="font-semibold">{accessInfo.reportIds.length}개</span>
                  </p>
                  <Button className="w-full" onClick={() => {
                    // TODO: 리포트 페이지로 이동
                    toast.info('리포트 페이지 구현 예정입니다.');
                  }}>
                    <FileText className="w-4 h-4 mr-2" />
                    리포트 확인하기
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI 상담 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center">
                  <MessageCircle className="w-8 h-8 text-purple-600 mr-3" />
                  <div>
                    <CardTitle>AI 건강 상담</CardTitle>
                    <CardDescription>
                      AI 전문가와 귀하의 건강 상태에 대해 상담받으세요
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    리포트 기반 맞춤형 건강 상담 서비스
                  </p>
                  <Button className="w-full" variant="outline" onClick={() => {
                    // TODO: AI 상담 페이지로 이동
                    toast.info('AI 상담 페이지 구현 예정입니다.');
                  }}>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    AI 상담 시작하기
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 접속 정보 */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">접속 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">사용자 ID</p>
                  <p className="font-mono">{accessInfo.userId}</p>
                </div>
                <div>
                  <p className="text-gray-500">조직 ID</p>
                  <p className="font-mono">{accessInfo.organizationId}</p>
                </div>
                <div>
                  <p className="text-gray-500">접속 만료</p>
                  <p>{formatExpiryDate(accessInfo.expiresAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default MeasurementSubjectAccess; 