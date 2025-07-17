import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
// import { Label } from '../../components/ui/label'; // 패키지 의존성 문제로 제거
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { ReportViewerModal } from '@domains/ai-report/components/ReportViewerModal';
import reportSharingService, { ShareableReport, ShareLinkAuth } from '@domains/ai-report/services/ReportSharingService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/core/services/firebase';
import { Loader2, Calendar, Shield, User, Clock, Eye, AlertCircle } from 'lucide-react';

interface SharedReportPageProps {}

export function SharedReportPage({}: SharedReportPageProps) {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<'loading' | 'auth' | 'viewing'>('loading');
  const [shareableReport, setShareableReport] = useState<ShareableReport | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [birthDate, setBirthDate] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  useEffect(() => {
    if (shareToken) {
      loadShareableReport();
    } else {
      navigate('/');
    }
  }, [shareToken]);

  const loadShareableReport = async () => {
    if (!shareToken) return;

    try {
      setStep('loading');
      const report = await reportSharingService.getShareableReport(shareToken);
      
      if (!report) {
        setAuthError('유효하지 않은 링크입니다.');
        return;
      }

      // 만료 확인
      if (new Date() > report.expiresAt) {
        setAuthError('링크가 만료되었습니다.');
        return;
      }

      // 활성 상태 확인
      if (!report.isActive) {
        setAuthError('비활성화된 링크입니다.');
        return;
      }

      // 접근 횟수 확인
      if (report.accessCount >= report.maxAccessCount) {
        setAuthError('최대 접근 횟수를 초과했습니다.');
        return;
      }

      setShareableReport(report);
      setStep('auth');
    } catch (error) {
      console.error('공유 리포트 로드 실패:', error);
      setAuthError('리포트를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleAuthenticate = async () => {
    if (!shareToken || !birthDate) return;

    setIsAuthenticating(true);
    setAuthError('');

    try {
      const auth: ShareLinkAuth = { birthDate };
      const result = await reportSharingService.authenticateAndAccess(shareToken, auth);

      if (result.success && result.reportId) {
        // 실제 리포트 데이터 로드
        await loadReportData(result.reportId);
      } else {
        setAuthError(result.errorMessage || '인증에 실패했습니다.');
      }
    } catch (error) {
      console.error('인증 실패:', error);
      setAuthError('인증 중 오류가 발생했습니다.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const loadReportData = async (reportId: string) => {
    setIsLoadingReport(true);
    
    try {
      // Firestore에서 실제 리포트 데이터 로드
      const reportDoc = await getDoc(doc(db, 'ai_analysis_results', reportId));
      
      if (reportDoc.exists()) {
        const data = reportDoc.data();
        
        // Firestore Timestamp를 Date로 변환
        const processedData = {
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
        };
        
        setReportData(processedData);
        setStep('viewing');
      } else {
        setAuthError('리포트 데이터를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('리포트 데이터 로드 실패:', error);
      setAuthError('리포트 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingReport(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAccessInfo = (count: number, max: number) => {
    return `${count}/${max}회 열람`;
  };

  // 로딩 화면
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">리포트 확인 중</h3>
            <p className="text-gray-600 text-center">리포트 정보를 확인하고 있습니다...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 인증 화면
  if (step === 'auth') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* 상단 헤더 */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">AI 건강 분석 리포트</h1>
            <p className="text-gray-600 text-lg">
              리포트 열람을 위해 본인 확인이 필요합니다
            </p>
          </div>

          <Card className="shadow-xl border-0">
            <CardContent className="p-8 space-y-6">
              {/* 리포트 정보 */}
              {shareableReport && (
                <div className="bg-blue-50 rounded-xl p-6 space-y-4 border border-blue-100">
                  <h3 className="font-semibold text-gray-900 text-lg mb-3">리포트 정보</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">분석 대상</span>
                        <p className="font-medium text-gray-900">{shareableReport.subjectName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">생성일</span>
                        <p className="font-medium text-gray-900">{formatDate(shareableReport.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Eye className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">열람 현황</span>
                        <p className="font-medium text-gray-900">{formatAccessInfo(shareableReport.accessCount, shareableReport.maxAccessCount)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 인증 폼 */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <label htmlFor="birthDate" className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-3 w-3 text-green-600" />
                    </div>
                    생년월일 확인
                  </label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    placeholder="YYYY-MM-DD"
                    disabled={isAuthenticating || isLoadingReport}
                    className="h-12 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-lg"
                  />
                  <p className="text-sm text-gray-600 leading-relaxed">
                    분석 대상자의 생년월일을 입력해주세요
                  </p>
                </div>

                {authError && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">{authError}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={handleAuthenticate}
                  disabled={!birthDate || isAuthenticating || isLoadingReport}
                  className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold shadow-lg"
                >
                  {isAuthenticating || isLoadingReport ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {isAuthenticating ? '인증 중...' : '리포트 로딩 중...'}
                    </>
                  ) : (
                    '리포트 열람하기'
                  )}
                </Button>
              </div>

              {/* 안내 문구 */}
              <div className="text-center pt-6 border-t border-gray-200">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 font-medium">개인정보보호를 위한 본인 확인</p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    본 리포트는 개인정보보호를 위해 생년월일 확인이 필요합니다.<br />
                    문제가 있으시면 리포트 발송자에게 문의해주세요.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 리포트 뷰어 화면
  if (step === 'viewing' && reportData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ReportViewerModal
          isOpen={true}
          onClose={() => navigate('/')}
          report={reportData}
          viewerId="basic-gemini-v1-web"
          viewerName="웹 뷰어"
        />
      </div>
    );
  }

  // 오류 화면
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <AlertCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">오류 발생</h1>
          <p className="text-gray-600">
            {authError || '알 수 없는 오류가 발생했습니다.'}
          </p>
        </div>

        <Card className="shadow-xl border-0">
          <CardContent className="p-6 text-center">
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full h-12 text-lg border-2 border-gray-300 hover:bg-gray-50"
            >
              홈으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default SharedReportPage; 